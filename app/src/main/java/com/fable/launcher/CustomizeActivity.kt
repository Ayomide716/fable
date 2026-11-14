package com.fable.launcher

import android.app.Activity
import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast

/**
 * Customise the glass clock: Glass/Solid, opacity, height, font, tint and wallpaper,
 * with a live full-screen preview. Done saves and, if needed, sets Fable as the
 * live wallpaper so the clock appears on the lock screen.
 */
class CustomizeActivity : Activity() {

    private lateinit var preview: GlassClockView
    private lateinit var sheet: LinearLayout
    private lateinit var done: TextView
    private var style = ClockStyle()

    private val segmentViews = mutableListOf<TextView>()
    private val fontViews = mutableListOf<TextView>()
    private val tintViews = mutableListOf<View>()
    private val wallViews = mutableListOf<View>()
    private lateinit var opacityRow: View

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_customize)
        style = ClockStyle.load(this)

        preview = findViewById(R.id.preview)
        preview.drawWallpaper = true
        sheet = findViewById(R.id.sheet)
        done = findViewById(R.id.done)

        makeEdgeToEdge()

        val cancel = findViewById<TextView>(R.id.cancel)
        cancel.background = GlassDrawable.clear(this, 22f)
        cancel.typeface = font(600)
        cancel.setOnClickListener { finish() }

        done.background = GradientDrawable().apply {
            cornerRadius = dp(22).toFloat()
            setColor(Color.WHITE)
        }
        done.typeface = font(700)
        done.setOnClickListener { save() }

        sheet.background = GlassDrawable.regular(this, 32f)
        buildSheet()
        refresh()
    }

    override fun onResume() {
        super.onResume()
        done.text = getString(if (isOurWallpaperActive()) R.string.done else R.string.set_wallpaper)
    }

    // ------------------------------------------------------------------ sheet

    private fun buildSheet() {
        // Glass / Solid segmented control (plain fills: no glass on glass).
        val segments = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            background = rounded(0x1AFFFFFF, 14)
            setPadding(dp(3), dp(3), dp(3), dp(3))
        }
        for ((i, label) in listOf("Glass", "Solid").withIndex()) {
            val tv = text(label, 14f, 600).apply {
                gravity = Gravity.CENTER
                setOnClickListener {
                    style = style.copy(glass = i == 0)
                    refresh()
                }
            }
            segmentViews += tv
            segments.addView(tv, LinearLayout.LayoutParams(0, dp(40), 1f))
        }
        sheet.addView(segments)

        opacityRow = slider(
            left = "Clear", middle = "Glass", right = "Frosted",
            min = 10, max = 100, value = style.opacity,
        ) { style = style.copy(opacity = it); refresh() }
        addSpaced(opacityRow)

        addSpaced(slider(
            left = "Clock height", middle = "", right = "Taller",
            min = 100, max = 150, value = style.stretch,
        ) { style = style.copy(stretch = it); refresh() })

        // Fonts
        val fonts = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        for (i in ClockFonts.NAMES.indices) {
            val tv = TextView(this).apply {
                text = "12"
                gravity = Gravity.CENTER
                setTextColor(Color.WHITE)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 22f)
                typeface = ClockFonts.get(this@CustomizeActivity, i, 700)
                contentDescription = "${ClockFonts.NAMES[i]} font"
                setOnClickListener { style = style.copy(font = i); refresh() }
            }
            fontViews += tv
            fonts.addView(tv, LinearLayout.LayoutParams(0, dp(52), 1f).apply {
                if (i > 0) marginStart = dp(8)
            })
        }
        addSpaced(fonts)

        // Tints
        val tints = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        for (i in ClockStyle.TINTS.indices) {
            val v = View(this).apply {
                contentDescription = "${ClockStyle.TINT_NAMES[i]} clock colour"
                setOnClickListener { style = style.copy(tint = i); refresh() }
            }
            tintViews += v
            tints.addView(v, LinearLayout.LayoutParams(dp(44), dp(44)))
            if (i < ClockStyle.TINTS.size - 1) {
                tints.addView(View(this), LinearLayout.LayoutParams(0, 1, 1f))
            }
        }
        addSpaced(tints)

        // Wallpapers
        val walls = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        for ((i, preset) in Wallpapers.PRESETS.withIndex()) {
            val v = View(this).apply {
                contentDescription = "${preset.name} wallpaper"
                setOnClickListener { style = style.copy(wallpaper = i); refresh() }
            }
            wallViews += v
            walls.addView(v, LinearLayout.LayoutParams(0, dp(48), 1f).apply {
                if (i > 0) marginStart = dp(10)
            })
        }
        addSpaced(walls)

        // Clock on home screen too (for people who use another launcher).
        val homeSwitch = Switch(this).apply {
            text = getString(R.string.clock_on_home)
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            typeface = font(500)
            isChecked = style.clockOnHome
            minHeight = dp(44)
            setOnCheckedChangeListener { _, checked -> style = style.copy(clockOnHome = checked) }
        }
        addSpaced(homeSwitch)
    }

    /** A labelled slider. Labels sit above the bar: left, middle, right. */
    private fun slider(
        left: String, middle: String, right: String,
        min: Int, max: Int, value: Int,
        onChange: (Int) -> Unit,
    ): View {
        val box = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val labels = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        labels.addView(text(left, 13f, 500).apply { alpha = 0.85f },
            LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        labels.addView(text(middle, 13f, 500).apply { alpha = 0.85f; gravity = Gravity.CENTER },
            LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        labels.addView(text(right, 13f, 500).apply { alpha = 0.85f; gravity = Gravity.END },
            LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        box.addView(labels)
        val bar = SeekBar(this).apply {
            this.max = max - min
            progress = value - min
            progressTintList = android.content.res.ColorStateList.valueOf(Color.WHITE)
            thumbTintList = android.content.res.ColorStateList.valueOf(Color.WHITE)
            progressBackgroundTintList = android.content.res.ColorStateList.valueOf(0x66FFFFFF)
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(s: SeekBar?, p: Int, fromUser: Boolean) {
                    if (fromUser) onChange(p + min)
                }
                override fun onStartTrackingTouch(s: SeekBar?) {}
                override fun onStopTrackingTouch(s: SeekBar?) {}
            })
        }
        box.addView(bar, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(40)))
        return box
    }

    private fun refresh() {
        preview.style = style
        for ((i, tv) in segmentViews.withIndex()) {
            val selected = (i == 0) == style.glass
            tv.background = if (selected) rounded(Color.WHITE, 11) else null
            tv.setTextColor(if (selected) 0xFF111111.toInt() else Color.WHITE)
        }
        opacityRow.visibility = if (style.glass) View.VISIBLE else View.GONE
        for ((i, tv) in fontViews.withIndex()) {
            tv.background = rounded(0x14FFFFFF, 14, stroke = if (i == style.font) Color.WHITE else 0)
        }
        for ((i, v) in tintViews.withIndex()) {
            v.background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(ClockStyle.TINTS[i])
                setStroke(dp(3), if (i == style.tint) Color.WHITE else 0x33FFFFFF)
            }
        }
        for ((i, v) in wallViews.withIndex()) {
            val preset = Wallpapers.PRESETS[i]
            v.background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(preset.glows.first().color, preset.glows.last().color),
            ).apply {
                cornerRadius = dp(14).toFloat()
                setStroke(dp(2), if (i == style.wallpaper) Color.WHITE else 0x33FFFFFF)
            }
        }
    }

    // ------------------------------------------------------------------ save

    private fun save() {
        style.save(this)
        if (isOurWallpaperActive()) {
            Toast.makeText(this, R.string.saved, Toast.LENGTH_SHORT).show()
            finish()
            return
        }
        val intent = Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER).putExtra(
            WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
            ComponentName(this, GlassClockWallpaper::class.java),
        )
        try {
            startActivity(intent)
            Toast.makeText(this, R.string.choose_home_and_lock, Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            try {
                startActivity(Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER))
            } catch (e2: Exception) {
                Toast.makeText(this, R.string.no_live_wallpaper, Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun isOurWallpaperActive(): Boolean = try {
        WallpaperManager.getInstance(this).wallpaperInfo?.packageName == packageName
    } catch (e: Exception) {
        false
    }

    // ------------------------------------------------------------------ helpers

    @Suppress("DEPRECATION")
    private fun makeEdgeToEdge() {
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)
        val topBar = findViewById<View>(R.id.topBar)
        val scroll = findViewById<View>(R.id.sheetScroll)
        findViewById<View>(R.id.root).setOnApplyWindowInsetsListener { _, insets: WindowInsets ->
            val top = insets.systemWindowInsetTop
            topBar.setPadding(topBar.paddingLeft, top + dp(8), topBar.paddingRight, 0)
            preview.topInset = top + dp(56).toFloat()
            preview.invalidate()
            scroll.setPadding(0, 0, 0, insets.systemWindowInsetBottom)
            insets
        }
    }

    private fun addSpaced(v: View) {
        sheet.addView(v, LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
        ).apply { topMargin = dp(14) })
    }

    private fun text(s: String, sizeSp: Float, weight: Int) = TextView(this).apply {
        text = s
        setTextColor(Color.WHITE)
        setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
        typeface = font(weight)
    }

    private fun font(weight: Int) = ClockFonts.get(this, 0, weight)

    private fun rounded(color: Int, radiusDp: Int, stroke: Int = 0) = GradientDrawable().apply {
        cornerRadius = dp(radiusDp).toFloat()
        setColor(color)
        if (stroke != 0) setStroke(dp(2), stroke)
    }

    private fun dp(value: Int): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()
}
