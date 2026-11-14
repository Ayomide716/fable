package com.fable.launcher

import android.app.Activity
import android.app.AlertDialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Bundle
import android.provider.AlarmClock
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.util.TypedValue
import android.view.GestureDetector
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.BaseAdapter
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ListView
import android.widget.TextView
import android.widget.Toast
import java.text.Normalizer
import kotlin.math.abs

class HomeActivity : Activity() {

    private lateinit var prefs: Prefs
    private lateinit var homeView: View
    private lateinit var drawerView: View
    private lateinit var favoritesView: LinearLayout
    private lateinit var statsView: TextView
    private lateinit var searchView: EditText
    private lateinit var listView: ListView
    private lateinit var gestures: GestureDetector

    private var allApps: List<AppInfo> = emptyList()
    private val adapter = AppAdapter()

    /** Reload the app list whenever something is installed, removed or updated. */
    private val packageReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            reloadApps()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)
        prefs = Prefs(this)

        homeView = findViewById(R.id.home)
        drawerView = findViewById(R.id.drawer)
        favoritesView = findViewById(R.id.favorites)
        statsView = findViewById(R.id.stats)
        searchView = findViewById(R.id.search)
        listView = findViewById(R.id.appList)

        listView.adapter = adapter
        listView.setOnItemClickListener { _, _, position, _ -> openApp(adapter.getItem(position)) }
        listView.setOnItemLongClickListener { _, _, position, _ ->
            showAppMenu(adapter.getItem(position), fromHome = false)
            true
        }

        searchView.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) = onSearchChanged(s?.toString().orEmpty())
        })
        searchView.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO && adapter.count > 0) {
                openApp(adapter.getItem(0))
                true
            } else {
                false
            }
        }

        findViewById<View>(R.id.clock).setOnClickListener { openAlarms() }
        homeView.setOnLongClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
            true
        }

        gestures = GestureDetector(this, SwipeListener())

        registerPackageReceiver()
        reloadApps()
    }

    override fun onResume() {
        super.onResume()
        renderFavorites()
        renderStats()
    }

    override fun onDestroy() {
        unregisterReceiver(packageReceiver)
        super.onDestroy()
    }

    /** Pressing Home while Fable is already showing returns to the home screen. */
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        hideDrawer()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // A launcher never closes itself; back only closes the drawer.
        if (drawerView.visibility == View.VISIBLE) hideDrawer()
    }

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        gestures.onTouchEvent(ev)
        return super.dispatchTouchEvent(ev)
    }

    // ---------------------------------------------------------------- apps

    private fun registerPackageReceiver() {
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_PACKAGE_ADDED)
            addAction(Intent.ACTION_PACKAGE_REMOVED)
            addAction(Intent.ACTION_PACKAGE_CHANGED)
            addAction(Intent.ACTION_PACKAGE_REPLACED)
            addDataScheme("package")
        }
        // System broadcasts: no export flag needed, but API 33+ wants one stated.
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            registerReceiver(packageReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            registerReceiver(packageReceiver, filter)
        }
    }

    private fun reloadApps() {
        Thread {
            val apps = AppRepository.loadApps(this)
            runOnUiThread {
                allApps = apps
                onSearchChanged(searchView.text.toString(), allowAutoLaunch = false)
                renderFavorites()
            }
        }.start()
    }

    private fun openApp(app: AppInfo) {
        hideKeyboard()
        Launcher.open(this, app)
    }

    private fun appFor(key: String): AppInfo? = allApps.firstOrNull { it.key == key }

    // ---------------------------------------------------------------- home screen

    private fun renderFavorites() {
        favoritesView.removeAllViews()
        val favorites = prefs.favorites.mapNotNull { appFor(it) }
        if (favorites.isEmpty()) {
            favoritesView.addView(TextView(this).apply {
                text = getString(R.string.empty_favorites)
                setTextColor(getColor(R.color.text_dim))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            })
            return
        }
        val distracting = prefs.distracting
        for (app in favorites) {
            favoritesView.addView(TextView(this).apply {
                text = app.label
                setTextColor(getColor(if (app.key in distracting) R.color.text_dim else R.color.text))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
                setPadding(0, dp(10), 0, dp(10))
                setSingleLine(true)
                setOnClickListener { openApp(app) }
                setOnLongClickListener {
                    showAppMenu(app, fromHome = true)
                    true
                }
            })
        }
    }

    private fun renderStats() {
        val skips = prefs.skipsToday()
        statsView.text = when (skips) {
            0 -> ""
            1 -> "1 mindful skip today"
            else -> "$skips mindful skips today"
        }
    }

    private fun openAlarms() {
        try {
            startActivity(Intent(AlarmClock.ACTION_SHOW_ALARMS))
        } catch (e: Exception) {
            // No clock app; ignore.
        }
    }

    // ---------------------------------------------------------------- drawer

    private fun showDrawer() {
        if (drawerView.visibility == View.VISIBLE) return
        searchView.setText("")
        listView.setSelection(0)
        drawerView.alpha = 0f
        drawerView.translationY = dp(48).toFloat()
        drawerView.visibility = View.VISIBLE
        drawerView.animate().alpha(1f).translationY(0f).setDuration(180).start()
        if (prefs.showKeyboard) {
            searchView.requestFocus()
            searchView.postDelayed({
                getSystemService(InputMethodManager::class.java)
                    .showSoftInput(searchView, InputMethodManager.SHOW_IMPLICIT)
            }, 120)
        }
    }

    private fun hideDrawer() {
        if (drawerView.visibility != View.VISIBLE) return
        hideKeyboard()
        searchView.setText("")
        drawerView.visibility = View.GONE
    }

    private fun hideKeyboard() {
        getSystemService(InputMethodManager::class.java)
            .hideSoftInputFromWindow(searchView.windowToken, 0)
        searchView.clearFocus()
    }

    private fun onSearchChanged(query: String, allowAutoLaunch: Boolean = true) {
        val q = normalize(query.trim())
        val results = if (q.isEmpty()) {
            allApps
        } else {
            // Apps whose name starts with the query come first.
            val matches = allApps.filter { normalize(it.label).contains(q) }
            matches.sortedBy { if (normalize(it.label).startsWith(q)) 0 else 1 }
        }
        adapter.submit(results)
        if (allowAutoLaunch && q.isNotEmpty() && results.size == 1 && prefs.autoLaunch) {
            openApp(results[0])
        }
    }

    private fun normalize(s: String): String =
        Normalizer.normalize(s.lowercase(), Normalizer.Form.NFD)
            .replace(Regex("\\p{Mn}+"), "")

    // ---------------------------------------------------------------- long-press menu

    private fun showAppMenu(app: AppInfo, fromHome: Boolean) {
        val actions = mutableListOf<Pair<String, () -> Unit>>()

        if (prefs.isFavorite(app.key)) {
            if (fromHome && prefs.favorites.indexOf(app.key) > 0) {
                actions += "Move up" to { prefs.moveFavoriteUp(app.key); renderFavorites() }
            }
            actions += "Remove from home" to { prefs.removeFavorite(app.key); renderFavorites() }
        } else {
            actions += "Add to home" to {
                if (prefs.addFavorite(app.key)) {
                    renderFavorites()
                    toast("${app.label} added to home")
                } else {
                    toast("Home is full (${Prefs.MAX_FAVORITES} apps). Less is more.")
                }
            }
        }

        if (prefs.isDistracting(app.key)) {
            actions += "Unmark as distracting" to { prefs.toggleDistracting(app.key); renderFavorites() }
        } else {
            actions += "Mark as distracting (adds a pause)" to {
                prefs.toggleDistracting(app.key)
                renderFavorites()
                toast("${app.label} will now ask you to pause first")
            }
        }

        actions += "App info" to {
            startActivity(
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                    .setData(Uri.fromParts("package", app.packageName, null))
            )
        }
        actions += "Uninstall" to {
            startActivity(
                Intent(Intent.ACTION_DELETE).setData(Uri.fromParts("package", app.packageName, null))
            )
        }

        AlertDialog.Builder(this, android.R.style.Theme_DeviceDefault_Dialog_Alert)
            .setTitle(app.label)
            .setItems(actions.map { it.first }.toTypedArray()) { _, which -> actions[which].second() }
            .show()
    }

    // ---------------------------------------------------------------- helpers

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    private fun dp(value: Int): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()

    private inner class SwipeListener : GestureDetector.SimpleOnGestureListener() {
        override fun onFling(e1: MotionEvent?, e2: MotionEvent, velocityX: Float, velocityY: Float): Boolean {
            val start = e1 ?: return false
            val dy = e2.y - start.y
            val dx = e2.x - start.x
            if (abs(dy) < abs(dx) || abs(dy) < dp(80) || abs(velocityY) < 300) return false

            val drawerOpen = drawerView.visibility == View.VISIBLE
            if (dy < 0 && !drawerOpen) {
                showDrawer()
                return true
            }
            if (dy > 0 && drawerOpen && !listView.canScrollVertically(-1)) {
                hideDrawer()
                return true
            }
            return false
        }
    }

    private inner class AppAdapter : BaseAdapter() {
        private var items: List<AppInfo> = emptyList()

        fun submit(newItems: List<AppInfo>) {
            items = newItems
            notifyDataSetChanged()
        }

        override fun getCount() = items.size
        override fun getItem(position: Int) = items[position]
        override fun getItemId(position: Int) = position.toLong()

        override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
            val view = (convertView as? TextView)
                ?: LayoutInflater.from(parent.context).inflate(R.layout.item_app, parent, false) as TextView
            val app = items[position]
            view.text = app.label
            view.setTextColor(
                getColor(if (prefs.isDistracting(app.key)) R.color.text_dim else R.color.text)
            )
            return view
        }
    }
}
