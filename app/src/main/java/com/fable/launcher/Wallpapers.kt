package com.fable.launcher

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RadialGradient
import android.graphics.Shader

/** Fable's built-in wallpapers: a dark base with large, soft colour glows. */
object Wallpapers {

    class Preset(val name: String, val base: Int, val glows: List<Glow>)

    /** A soft circle. Positions and radius are fractions of the screen width/height. */
    class Glow(val color: Int, val x: Float, val y: Float, val radius: Float)

    val PRESETS = listOf(
        Preset(
            "Dusk", 0xFF160E2E.toInt(), listOf(
                Glow(0xFF2E6BFF.toInt(), 0.12f, 0.10f, 0.75f),
                Glow(0xFFB33BFF.toInt(), 1.00f, 0.42f, 0.85f),
                Glow(0xFFFF6A3D.toInt(), 0.10f, 0.78f, 0.95f),
                Glow(0xFFFFB938.toInt(), 0.85f, 0.92f, 0.55f),
            )
        ),
        Preset(
            "Ocean", 0xFF04202C.toInt(), listOf(
                Glow(0xFF6A5CFF.toInt(), 0.10f, 0.08f, 0.75f),
                Glow(0xFF2E6BFF.toInt(), 1.00f, 0.38f, 0.85f),
                Glow(0xFF00C2A8.toInt(), 0.12f, 0.75f, 0.95f),
            )
        ),
        Preset(
            "Citrus", 0xFF2A1405.toInt(), listOf(
                Glow(0xFFFF3D7F.toInt(), 0.10f, 0.08f, 0.75f),
                Glow(0xFFFF6A3D.toInt(), 1.00f, 0.40f, 0.85f),
                Glow(0xFFFFB938.toInt(), 0.12f, 0.78f, 0.95f),
            )
        ),
        Preset(
            "Forest", 0xFF0A1E13.toInt(), listOf(
                Glow(0xFFB8F03D.toInt(), 0.10f, 0.08f, 0.70f),
                Glow(0xFF0E8A6A.toInt(), 1.00f, 0.40f, 0.85f),
                Glow(0xFF3DDC84.toInt(), 0.12f, 0.78f, 0.95f),
            )
        ),
    )

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.DITHER_FLAG)

    fun draw(canvas: Canvas, index: Int, width: Int, height: Int) {
        val preset = PRESETS[index.coerceIn(PRESETS.indices)]
        canvas.drawColor(preset.base)
        val w = width.toFloat()
        val h = height.toFloat()
        for (g in preset.glows) {
            val cx = g.x * w
            val cy = g.y * h
            val r = g.radius * w
            paint.shader = RadialGradient(
                cx, cy, r,
                intArrayOf(g.color, withAlpha(g.color, 0.55f), Color.TRANSPARENT),
                floatArrayOf(0f, 0.45f, 1f),
                Shader.TileMode.CLAMP,
            )
            canvas.drawCircle(cx, cy, r, paint)
        }
        paint.shader = null
    }

    fun withAlpha(color: Int, alpha: Float): Int =
        Color.argb((alpha.coerceIn(0f, 1f) * 255).toInt(), Color.red(color), Color.green(color), Color.blue(color))
}
