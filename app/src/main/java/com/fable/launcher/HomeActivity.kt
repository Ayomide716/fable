package com.fable.launcher

import android.app.Activity
import android.app.AlertDialog
import android.app.WallpaperManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.util.TypedValue
import android.view.GestureDetector
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.BaseAdapter
import android.widget.EditText
import android.widget.GridLayout
import android.widget.GridView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import java.text.Normalizer
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.abs

class HomeActivity : Activity() {

    private lateinit var prefs: Prefs
    private lateinit var homeView: LinearLayout
    private lateinit var drawerView: View
    private lateinit var drawerContent: View
    private lateinit var clockView: GlassClockView
    private lateinit var infoView: TextView
    private lateinit var setupHint: TextView
    private lateinit var grid: GridLayout
    private lateinit var dock: LinearLayout
    private lateinit var searchView: EditText
    private lateinit var allAppsView: GridView
    private lateinit var gestures: GestureDetector

    private var allApps: List<AppInfo> = emptyList()
    private var battery: Int? = null
    private val adapter = DrawerAdapter()

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                Intent.ACTION_BATTERY_CHANGED -> {
                    val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                    val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                    if (level >= 0 && scale > 0) battery = level * 100 / scale
                    renderInfo()
                }
                Intent.ACTION_TIME_TICK, Intent.ACTION_TIME_CHANGED, Intent.ACTION_DATE_CHANGED -> renderInfo()
            }
        }
    }

    private val packageReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            AppRepository.clearIcons()
            reloadApps()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)
        prefs = Prefs(this)
        makeEdgeToEdge()

        homeView = findViewById(R.id.home)
        drawerView = findViewById(R.id.drawer)
        drawerContent = findViewById(R.id.drawerContent)
        clockView = findViewById(R.id.clock)
        infoView = findViewById(R.id.info)
        setupHint = findViewById(R.id.setupHint)
        grid = findViewById(R.id.grid)
        dock = findViewById(R.id.dock)
        searchView = findViewById(R.id.search)
        allAppsView = findViewById(R.id.allApps)

        infoView.typeface = ClockFonts.get(this, 0, 600)
        clockView.sizeFraction = 0.36f

        // Glass only on the floating controls (see docs/glass-design-guide.md).
        dock.background = GlassDrawable.regular(this, 36f)
        val searchPill = findViewById<TextView>(R.id.searchPill)
        searchPill.background = GlassDrawable.clear(this, 22f)
        searchPill.typeface = ClockFonts.get(this, 0, 600)
        searchPill.setCompoundDrawablesRelativeWithIntrinsicBounds(R.drawable.ic_search, 0, 0, 0)
        searchPill.setOnClickListener { showDrawer(focusSearch = true) }
        searchView.background = GlassDrawable.regular(this, 25f)
        searchView.typeface = ClockFonts.get(this, 0, 500)
        searchView.setCompoundDrawablesRelativeWithIntrinsicBounds(R.drawable.ic_search, 0, 0, 0)
        setupHint.background = GlassDrawable.clear(this, 22f)
        setupHint.typeface = ClockFonts.get(this, 0, 600)
        setupHint.setOnClickListener { openCustomize() }

        allAppsView.adapter = adapter
        allAppsView.setOnItemClickListener { _, _, position, _ -> openApp(adapter.getItem(position)) }
        allAppsView.setOnItemLongClickListener { _, _, position, _ ->
            showAppMenu(adapter.getItem(position))
            true
        }

        searchView.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) = filter(s?.toString().orEmpty())
        })
        searchView.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO && adapter.count > 0) {
                openApp(adapter.getItem(0))
                true
            } else {
                false
            }
        }

        homeView.setOnLongClickListener {
            openCustomize()
            true
        }
        clockView.setOnClickListener { openCustomize() }

        gestures = GestureDetector(this, SwipeListener())

        registerReceivers()
        reloadApps()
    }

    override fun onResume() {
        super.onResume()
        clockView.style = ClockStyle.load(this)
        renderInfo()
        setupHint.visibility = if (isOurWallpaperActive()) View.GONE else View.VISIBLE
    }

    override fun onDestroy() {
        try {
            unregisterReceiver(receiver)
            unregisterReceiver(packageReceiver)
        } catch (e: IllegalArgumentException) {
            // Not registered.
        }
        super.onDestroy()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        hideDrawer()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (drawerView.visibility == View.VISIBLE) hideDrawer()
    }

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        gestures.onTouchEvent(ev)
        return super.dispatchTouchEvent(ev)
    }

    // ------------------------------------------------------------------ setup

    @Suppress("DEPRECATION")
    private fun makeEdgeToEdge() {
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)
        val root = findViewById<View>(R.id.root)
        root.setOnApplyWindowInsetsListener { _, insets: WindowInsets ->
            val top = insets.systemWindowInsetTop
            val bottom = insets.systemWindowInsetBottom
            homeView.setPadding(homeView.paddingLeft, top, homeView.paddingRight, bottom)
            drawerContent.setPadding(drawerContent.paddingLeft, top, drawerContent.paddingRight, 0)
            allAppsView.setPadding(0, 0, 0, bottom + dp(24))
            insets
        }
    }

    private fun registerReceivers() {
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_BATTERY_CHANGED)
            addAction(Intent.ACTION_TIME_TICK)
            addAction(Intent.ACTION_TIME_CHANGED)
            addAction(Intent.ACTION_DATE_CHANGED)
        }
        val pkgFilter = IntentFilter().apply {
            addAction(Intent.ACTION_PACKAGE_ADDED)
            addAction(Intent.ACTION_PACKAGE_REMOVED)
            addAction(Intent.ACTION_PACKAGE_CHANGED)
            addAction(Intent.ACTION_PACKAGE_REPLACED)
            addDataScheme("package")
        }
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
            registerReceiver(packageReceiver, pkgFilter, Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(receiver, filter)
            registerReceiver(packageReceiver, pkgFilter)
        }
    }

    private fun isOurWallpaperActive(): Boolean = try {
        WallpaperManager.getInstance(this).wallpaperInfo?.packageName == packageName
    } catch (e: Exception) {
        false
    }

    private fun openCustomize() {
        startActivity(Intent(this, CustomizeActivity::class.java))
    }

    // ------------------------------------------------------------------ apps

    private fun reloadApps() {
        Thread {
            val apps = AppRepository.loadApps(this)
            runOnUiThread {
                allApps = apps
                firstRunSetup()
                filter(searchView.text.toString())
                renderHome()
            }
        }.start()
    }

    /** Fill the dock and home screen with sensible apps the first time. */
    private fun firstRunSetup() {
        if (prefs.dockApps == null) {
            prefs.dockApps = AppRepository.defaultDock(this, allApps)
        }
        if (prefs.homeApps == null) {
            val dockKeys = prefs.dockApps.orEmpty()
            prefs.homeApps = allApps.filter { it.key !in dockKeys }.take(Prefs.MAX_HOME).map { it.key }
        }
    }

    private fun appFor(key: String): AppInfo? = allApps.firstOrNull { it.key == key }

    private fun openApp(app: AppInfo) {
        hideKeyboard()
        Launcher.open(this, app)
    }

    // ------------------------------------------------------------------ home

    private fun renderInfo() {
        val date = SimpleDateFormat("EEE d MMM", Locale.getDefault()).format(Date())
        infoView.text = battery?.let { "$date  ·  $it%" } ?: date
        clockView.invalidate()
    }

    private fun renderHome() {
        grid.removeAllViews()
        for (key in prefs.homeApps.orEmpty()) {
            val app = appFor(key) ?: continue
            val cell = makeCell(app, iconDp = 58, showLabel = true)
            val params = GridLayout.LayoutParams(
                GridLayout.spec(GridLayout.UNDEFINED),
                GridLayout.spec(GridLayout.UNDEFINED, 1f),
            ).apply {
                width = 0
                setMargins(0, 0, 0, dp(18))
            }
            grid.addView(cell, params)
        }

        dock.removeAllViews()
        for (key in prefs.dockApps.orEmpty()) {
            val app = appFor(key) ?: continue
            val cell = makeCell(app, iconDp = 60, showLabel = false)
            dock.addView(cell, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f))
        }
        dock.visibility = if (dock.childCount == 0) View.INVISIBLE else View.VISIBLE
    }

    /** An app icon with an optional label underneath. */
    private fun makeCell(app: AppInfo, iconDp: Int, showLabel: Boolean): View {
        val cell = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            isClickable = true
            isLongClickable = true
            contentDescription = app.label
            setOnClickListener { openApp(app) }
            setOnLongClickListener {
                showAppMenu(app)
                true
            }
        }
        cell.addView(ImageView(this).apply {
            setImageDrawable(AppRepository.icon(this@HomeActivity, app))
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
        }, LinearLayout.LayoutParams(dp(iconDp), dp(iconDp)))
        if (showLabel) {
            cell.addView(labelView(app.label), LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
            ).apply { topMargin = dp(6) })
        }
        return cell
    }

    private fun labelView(text: String) = TextView(this).apply {
        this.text = text
        gravity = Gravity.CENTER
        setSingleLine(true)
        ellipsize = android.text.TextUtils.TruncateAt.END
        setTextColor(Color.WHITE)
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
        typeface = ClockFonts.get(this@HomeActivity, 0, 500)
        setShadowLayer(dp(6).toFloat(), 0f, dp(1).toFloat(), 0x66000000)
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }

    // ------------------------------------------------------------------ drawer

    private fun showDrawer(focusSearch: Boolean = false) {
        if (drawerView.visibility == View.VISIBLE) return
        searchView.setText("")
        allAppsView.setSelection(0)
        drawerView.alpha = 0f
        drawerContent.translationY = dp(40).toFloat()
        drawerView.visibility = View.VISIBLE
        drawerView.animate().alpha(1f).setDuration(200).start()
        drawerContent.animate().translationY(0f).setDuration(220).start()
        if (focusSearch) {
            searchView.requestFocus()
            searchView.postDelayed({
                getSystemService(InputMethodManager::class.java)
                    .showSoftInput(searchView, InputMethodManager.SHOW_IMPLICIT)
            }, 150)
        }
    }

    private fun hideDrawer() {
        if (drawerView.visibility != View.VISIBLE) return
        hideKeyboard()
        drawerView.animate().alpha(0f).setDuration(160).withEndAction {
            drawerView.visibility = View.GONE
            searchView.setText("")
        }.start()
    }

    private fun hideKeyboard() {
        getSystemService(InputMethodManager::class.java)
            .hideSoftInputFromWindow(searchView.windowToken, 0)
        searchView.clearFocus()
    }

    private fun filter(query: String) {
        val q = normalize(query.trim())
        val results = if (q.isEmpty()) {
            allApps
        } else {
            allApps.filter { normalize(it.label).contains(q) }
                .sortedBy { if (normalize(it.label).startsWith(q)) 0 else 1 }
        }
        adapter.submit(results)
    }

    private fun normalize(s: String): String =
        Normalizer.normalize(s.lowercase(), Normalizer.Form.NFD).replace(Regex("\\p{Mn}+"), "")

    // ------------------------------------------------------------------ long-press menu

    private fun showAppMenu(app: AppInfo) {
        val actions = mutableListOf<Pair<String, () -> Unit>>()
        val home = prefs.homeApps.orEmpty()
        val dockKeys = prefs.dockApps.orEmpty()

        if (app.key in home) {
            actions += "Remove from home screen" to { prefs.homeApps = home - app.key; renderHome() }
        } else {
            actions += "Add to home screen" to {
                if (home.size >= Prefs.MAX_HOME) {
                    toast("Home screen is full (${Prefs.MAX_HOME} apps)")
                } else {
                    prefs.homeApps = home + app.key
                    renderHome()
                }
            }
        }
        if (app.key in dockKeys) {
            actions += "Remove from dock" to { prefs.dockApps = dockKeys - app.key; renderHome() }
        } else {
            actions += "Add to dock" to {
                if (dockKeys.size >= Prefs.MAX_DOCK) {
                    toast("Dock is full (${Prefs.MAX_DOCK} apps)")
                } else {
                    prefs.dockApps = dockKeys + app.key
                    renderHome()
                }
            }
        }
        actions += "App info" to {
            startActivity(
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                    .setData(Uri.fromParts("package", app.packageName, null))
            )
        }
        actions += "Uninstall" to {
            startActivity(Intent(Intent.ACTION_DELETE).setData(Uri.fromParts("package", app.packageName, null)))
        }

        AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
            .setTitle(app.label)
            .setItems(actions.map { it.first }.toTypedArray()) { _, which -> actions[which].second() }
            .show()
    }

    // ------------------------------------------------------------------ helpers

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    private fun dp(value: Int): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()

    private inner class SwipeListener : GestureDetector.SimpleOnGestureListener() {
        override fun onFling(e1: MotionEvent?, e2: MotionEvent, velocityX: Float, velocityY: Float): Boolean {
            val start = e1 ?: return false
            val dy = e2.y - start.y
            val dx = e2.x - start.x
            if (abs(dy) < abs(dx) || abs(dy) < dp(80) || abs(velocityY) < 300) return false
            val open = drawerView.visibility == View.VISIBLE
            if (dy < 0 && !open) {
                showDrawer()
                return true
            }
            if (dy > 0 && open && !allAppsView.canScrollVertically(-1)) {
                hideDrawer()
                return true
            }
            return false
        }
    }

    private inner class DrawerAdapter : BaseAdapter() {
        private var items: List<AppInfo> = emptyList()

        fun submit(newItems: List<AppInfo>) {
            items = newItems
            notifyDataSetChanged()
        }

        override fun getCount() = items.size
        override fun getItem(position: Int) = items[position]
        override fun getItemId(position: Int) = position.toLong()

        override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
            val cell = (convertView as? LinearLayout) ?: LinearLayout(parent.context).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER_HORIZONTAL
                addView(ImageView(context), LinearLayout.LayoutParams(dp(56), dp(56)))
                addView(labelView(""), LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
                ).apply { topMargin = dp(6) })
            }
            val app = items[position]
            (cell.getChildAt(0) as ImageView).setImageDrawable(AppRepository.icon(this@HomeActivity, app))
            (cell.getChildAt(1) as TextView).text = app.label
            cell.contentDescription = app.label
            return cell
        }
    }
}
