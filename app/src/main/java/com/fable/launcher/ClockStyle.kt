package com.fable.launcher

import android.content.Context
import android.content.SharedPreferences
import android.graphics.Typeface

/** Everything the user can customise about the glass clock. */
data class ClockStyle(
    val glass: Boolean = true,
    /** 10..100: how frosted the glass digits are (10 = very clear). */
    val opacity: Int = 40,
    /** 100..150: vertical stretch of the clock, in percent. */
    val stretch: Int = 100,
    val font: Int = 0,
    val tint: Int = 0,
    val wallpaper: Int = 0,
    /** Also draw the big clock on the home screen (for people using another launcher). */
    val clockOnHome: Boolean = false,
) {
    val tintColor: Int get() = TINTS[tint.coerceIn(TINTS.indices)]

    fun save(context: Context) {
        prefs(context).edit()
            .putBoolean("glass", glass)
            .putInt("opacity", opacity)
            .putInt("stretch", stretch)
            .putInt("font", font)
            .putInt("tint", tint)
            .putInt("wallpaper", wallpaper)
            .putBoolean("clock_on_home", clockOnHome)
            .apply()
    }

    companion object {
        const val PREFS = "fable_clock"

        val TINTS = intArrayOf(
            0xFFFFFFFF.toInt(), 0xFFFFE2B0.toInt(), 0xFFBFE3FF.toInt(),
            0xFFFFC2D6.toInt(), 0xFFC9FFD8.toInt(), 0xFFFFD15C.toInt(),
        )
        val TINT_NAMES = arrayOf("White", "Warm", "Ice", "Rose", "Mint", "Gold")

        fun prefs(context: Context): SharedPreferences =
            context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

        fun load(context: Context): ClockStyle {
            val p = prefs(context)
            return ClockStyle(
                glass = p.getBoolean("glass", true),
                opacity = p.getInt("opacity", 40),
                stretch = p.getInt("stretch", 100),
                font = p.getInt("font", 0),
                tint = p.getInt("tint", 0),
                wallpaper = p.getInt("wallpaper", 0),
                clockOnHome = p.getBoolean("clock_on_home", false),
            )
        }
    }
}

/** The bundled clock typefaces (all SIL Open Font License). */
object ClockFonts {
    val NAMES = arrayOf("Rounded", "Wide", "Tall", "Condensed")
    private val FILES = arrayOf("outfit.ttf", "unbounded.ttf", "anton.ttf", "bigshoulders.ttf")
    private val cache = HashMap<String, Typeface>()

    /** [weight] is only applied to variable fonts. */
    fun get(context: Context, index: Int, weight: Int = 700): Typeface {
        val i = index.coerceIn(FILES.indices)
        val key = "$i/$weight"
        return cache.getOrPut(key) {
            try {
                Typeface.Builder(context.assets, "fonts/" + FILES[i])
                    .setFontVariationSettings("'wght' $weight")
                    .build() ?: Typeface.DEFAULT_BOLD
            } catch (e: Exception) {
                Typeface.DEFAULT_BOLD
            }
        }
    }
}
