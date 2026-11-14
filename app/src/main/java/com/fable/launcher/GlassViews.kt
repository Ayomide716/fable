package com.fable.launcher

import android.content.Context
import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.view.View
import java.util.Date

/**
 * A glass panel background, following docs/glass-design-guide.md.
 *
 * - REGULAR: frosted and darker, for anything with text (dock, sheets, cards).
 * - CLEAR: very see-through, for small round buttons over the wallpaper.
 *
 * Each has a 1px translucent border, a bright top rim and a soft shadow.
 */
class GlassDrawable(
    private val radius: Float,
    private val variant: Variant = Variant.REGULAR,
    private val density: Float,
) : Drawable() {

    enum class Variant { REGULAR, CLEAR }

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    private val rimPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
    private val shadowPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val rect = RectF()

    override fun draw(canvas: Canvas) {
        val b = bounds
        val inset = density * 1f
        rect.set(b.left + inset, b.top + inset, b.right - inset, b.bottom - inset)
        val r = radius.coerceAtMost(rect.height() / 2f)

        // Soft shadow under the panel.
        shadowPaint.color = 0x01000000
        shadowPaint.setShadowLayer(density * 14f, 0f, density * 6f, 0x38000000)
        canvas.drawRoundRect(rect, r, r, shadowPaint)

        // Fill: regular glass is a darker frost; clear glass is a light wash.
        fillPaint.shader = LinearGradient(
            0f, rect.top, 0f, rect.bottom,
            if (variant == Variant.REGULAR) {
                intArrayOf(0x8C2A2240.toInt(), 0xA61A1430.toInt())
            } else {
                intArrayOf(0x38FFFFFF, 0x1FFFFFFF)
            },
            null, Shader.TileMode.CLAMP,
        )
        canvas.drawRoundRect(rect, r, r, fillPaint)

        // 1px translucent border all round.
        borderPaint.strokeWidth = density
        borderPaint.color = if (variant == Variant.REGULAR) 0x40FFFFFF else 0x59FFFFFF
        canvas.drawRoundRect(rect, r, r, borderPaint)

        // Bright rim along the top edge, fading out by the middle.
        rimPaint.strokeWidth = density * 1.2f
        rimPaint.shader = LinearGradient(
            0f, rect.top, 0f, rect.top + rect.height() * 0.5f,
            intArrayOf(if (variant == Variant.REGULAR) 0x8CFFFFFF.toInt() else 0xBFFFFFFF.toInt(), 0x00FFFFFF),
            null, Shader.TileMode.CLAMP,
        )
        canvas.drawRoundRect(rect, r, r, rimPaint)
    }

    override fun setAlpha(alpha: Int) {}
    override fun setColorFilter(colorFilter: ColorFilter?) {}

    @Deprecated("Deprecated in Java")
    override fun getOpacity(): Int = PixelFormat.TRANSLUCENT

    companion object {
        fun regular(context: Context, radiusDp: Float) =
            GlassDrawable(radiusDp * context.resources.displayMetrics.density, Variant.REGULAR,
                context.resources.displayMetrics.density)

        fun clear(context: Context, radiusDp: Float) =
            GlassDrawable(radiusDp * context.resources.displayMetrics.density, Variant.CLEAR,
                context.resources.displayMetrics.density)
    }
}

/**
 * Shows the glass clock. With [drawWallpaper] it is a full lock-screen preview
 * (used on the customise screen); without it, just the clock over whatever is
 * behind (used on the home screen).
 */
class GlassClockView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {

    var style: ClockStyle = ClockStyle.load(context)
        set(value) {
            field = value
            requestLayout()
            invalidate()
        }

    var drawWallpaper = false
        set(value) {
            field = value
            invalidate()
        }

    /** Clock text size as a fraction of the view width (home-screen mode). */
    var sizeFraction = 0.40f

    var topInset = 0f

    private val tick = object : Runnable {
        override fun run() {
            invalidate()
            val now = System.currentTimeMillis()
            postDelayed(this, 60_000L - now % 60_000L + 50L)
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        post(tick)
    }

    override fun onDetachedFromWindow() {
        removeCallbacks(tick)
        super.onDetachedFromWindow()
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        if (drawWallpaper) {
            super.onMeasure(widthMeasureSpec, heightMeasureSpec)
            return
        }
        val w = MeasureSpec.getSize(widthMeasureSpec)
        val stretch = style.stretch.coerceIn(100, 150) / 100f
        val h = (w * sizeFraction * 0.78f * stretch + w * 0.03f).toInt()
        setMeasuredDimension(w, h)
    }

    override fun onDraw(canvas: Canvas) {
        val w = width
        val h = height
        if (w == 0 || h == 0) return
        if (drawWallpaper) {
            GlassClock.drawScene(canvas, context, style, w, h, true, "Battery 82%", topInset)
        } else {
            GlassClock.drawClock(
                canvas, context, style, GlassClock.timeText(context, Date()),
                w / 2f, w * 0.01f, w * sizeFraction,
            )
        }
    }
}
