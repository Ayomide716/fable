package com.fable.launcher

import android.content.Context
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.Shader
import android.text.format.DateFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Draws the big glass clock. Used by the live wallpaper (lock screen) and by
 * the previews inside the app, so they always look identical.
 *
 * Glass look (see docs/glass-design-guide.md): a fill that is bright at the top
 * and fades lower down so the wallpaper shows through, a thin bright rim, and a
 * soft drop shadow.
 */
object GlassClock {

    private val fill = Paint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG)
    private val rim = Paint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG).apply {
        style = Paint.Style.STROKE
    }
    private val shadow = Paint(Paint.ANTI_ALIAS_FLAG)
    private val label = Paint(Paint.ANTI_ALIAS_FLAG or Paint.SUBPIXEL_TEXT_FLAG)
    private val bounds = Rect()

    fun timeText(context: Context, now: Date = Date()): String {
        val pattern = if (DateFormat.is24HourFormat(context)) "HH:mm" else "h:mm"
        return SimpleDateFormat(pattern, Locale.getDefault()).format(now)
    }

    fun dateText(now: Date = Date()): String =
        SimpleDateFormat("EEEE d MMMM", Locale.getDefault()).format(now)

    /**
     * Draws [text] horizontally centred on [cx] with its top edge at [top].
     * Returns the y coordinate of the clock's bottom edge (after stretching).
     */
    fun drawClock(
        canvas: Canvas,
        context: Context,
        style: ClockStyle,
        text: String,
        cx: Float,
        top: Float,
        textSize: Float,
    ): Float {
        val typeface = ClockFonts.get(context, style.font, 700)
        for (p in arrayOf(fill, rim, shadow)) {
            p.typeface = typeface
            p.textSize = textSize
            p.textAlign = Paint.Align.CENTER
            p.letterSpacing = -0.035f
        }
        fill.getTextBounds(text, 0, text.length, bounds)
        val baseline = top - bounds.top
        val glyphTop = top
        val glyphBottom = top + bounds.height()
        val stretch = style.stretch.coerceIn(100, 150) / 100f

        canvas.save()
        canvas.scale(1f, stretch, cx, top)

        // Soft shadow, drawn on its own so it shows even under very clear glass.
        shadow.color = 0x02000000
        shadow.setShadowLayer(textSize * 0.10f, 0f, textSize * 0.045f, 0x47000000)
        canvas.drawText(text, cx, baseline, shadow)

        val tint = style.tintColor
        if (style.glass) {
            val o = style.opacity.coerceIn(10, 100) / 100f
            fill.shader = LinearGradient(
                0f, glyphTop, 0f, glyphBottom,
                intArrayOf(
                    Wallpapers.withAlpha(tint, 0.55f + o * 0.45f),
                    Wallpapers.withAlpha(tint, o),
                    Wallpapers.withAlpha(tint, o * 0.6f),
                ),
                floatArrayOf(0f, 0.46f, 1f),
                Shader.TileMode.CLAMP,
            )
            canvas.drawText(text, cx, baseline, fill)
            fill.shader = null

            // Bright rim: strongest at the top edge, like light catching glass.
            rim.strokeWidth = (textSize * 0.0085f).coerceAtLeast(1.2f)
            rim.shader = LinearGradient(
                0f, glyphTop, 0f, glyphBottom,
                intArrayOf(0xF2FFFFFF.toInt(), 0xB3FFFFFF.toInt(), 0x8CFFFFFF.toInt()),
                floatArrayOf(0f, 0.5f, 1f),
                Shader.TileMode.CLAMP,
            )
            canvas.drawText(text, cx, baseline, rim)
            rim.shader = null
        } else {
            fill.shader = null
            fill.color = tint
            canvas.drawText(text, cx, baseline, fill)
        }
        canvas.restore()
        return top + bounds.height() * stretch
    }

    /** A small line of text (date, battery…) with a soft shadow for legibility. */
    fun drawLabel(
        canvas: Canvas,
        context: Context,
        text: String,
        x: Float,
        y: Float,
        size: Float,
        weight: Int = 600,
        alpha: Float = 1f,
        align: Paint.Align = Paint.Align.CENTER,
    ) {
        label.typeface = ClockFonts.get(context, 0, weight)
        label.textSize = size
        label.textAlign = align
        label.color = Wallpapers.withAlpha(0xFFFFFFFF.toInt(), alpha)
        label.setShadowLayer(size * 0.5f, 0f, size * 0.06f, 0x52000000)
        canvas.drawText(text, x, y, label)
    }

    /**
     * The full lock-screen scene: wallpaper, date, huge glass clock and an info line.
     * [topInset] keeps everything clear of the status bar.
     */
    fun drawScene(
        canvas: Canvas,
        context: Context,
        style: ClockStyle,
        width: Int,
        height: Int,
        showClock: Boolean,
        info: String?,
        topInset: Float,
    ) {
        Wallpapers.draw(canvas, style.wallpaper, width, height)
        if (!showClock) return

        val w = width.toFloat()
        val cx = w / 2f
        val dateSize = w * 0.046f
        val dateY = topInset + w * 0.10f
        drawLabel(canvas, context, dateText(), cx, dateY, dateSize)

        val clockSize = w * 0.48f
        val bottom = drawClock(
            canvas, context, style, timeText(context), cx, dateY + w * 0.035f, clockSize,
        )
        if (!info.isNullOrBlank()) {
            drawLabel(canvas, context, info, cx, bottom + w * 0.09f, w * 0.040f, weight = 500, alpha = 0.95f)
        }
    }
}
