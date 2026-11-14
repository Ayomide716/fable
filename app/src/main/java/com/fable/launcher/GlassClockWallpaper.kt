package com.fable.launcher

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.os.BatteryManager
import android.os.Build
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder

/**
 * Live wallpaper that draws Fable's glass clock.
 *
 * The big clock shows while the phone is locked. Once unlocked, the home screen
 * gets the plain wallpaper (Fable's launcher draws its own clock there), unless the
 * user turned on "Clock on home screen too" for use with another launcher.
 */
class GlassClockWallpaper : WallpaperService() {

    override fun onCreateEngine(): Engine = ClockEngine()

    inner class ClockEngine : Engine(), SharedPreferences.OnSharedPreferenceChangeListener {

        private var style = ClockStyle.load(this@GlassClockWallpaper)
        private var visible = false
        private var receiverRegistered = false
        private var battery: Int? = null

        private val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                if (intent.action == Intent.ACTION_BATTERY_CHANGED) {
                    battery = readBattery(intent)
                }
                draw()
            }
        }

        override fun onCreate(surfaceHolder: SurfaceHolder) {
            super.onCreate(surfaceHolder)
            ClockStyle.prefs(this@GlassClockWallpaper).registerOnSharedPreferenceChangeListener(this)
        }

        override fun onDestroy() {
            ClockStyle.prefs(this@GlassClockWallpaper).unregisterOnSharedPreferenceChangeListener(this)
            unregister()
            super.onDestroy()
        }

        override fun onVisibilityChanged(isVisible: Boolean) {
            visible = isVisible
            if (isVisible) {
                register()
                draw()
            } else {
                unregister()
            }
        }

        override fun onSurfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
            super.onSurfaceChanged(holder, format, width, height)
            draw()
        }

        override fun onSurfaceRedrawNeeded(holder: SurfaceHolder) {
            super.onSurfaceRedrawNeeded(holder)
            draw()
        }

        override fun onSharedPreferenceChanged(prefs: SharedPreferences?, key: String?) {
            style = ClockStyle.load(this@GlassClockWallpaper)
            draw()
        }

        private fun register() {
            if (receiverRegistered) return
            val filter = IntentFilter().apply {
                addAction(Intent.ACTION_TIME_TICK)
                addAction(Intent.ACTION_TIME_CHANGED)
                addAction(Intent.ACTION_TIMEZONE_CHANGED)
                addAction(Intent.ACTION_SCREEN_ON)
                addAction(Intent.ACTION_SCREEN_OFF)
                addAction(Intent.ACTION_USER_PRESENT)
                addAction(Intent.ACTION_BATTERY_CHANGED)
            }
            val sticky = if (Build.VERSION.SDK_INT >= 33) {
                registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
            } else {
                registerReceiver(receiver, filter)
            }
            if (sticky != null) battery = readBattery(sticky)
            receiverRegistered = true
        }

        private fun unregister() {
            if (!receiverRegistered) return
            try {
                unregisterReceiver(receiver)
            } catch (e: IllegalArgumentException) {
                // Already unregistered.
            }
            receiverRegistered = false
        }

        private fun readBattery(intent: Intent): Int? {
            val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            return if (level >= 0 && scale > 0) level * 100 / scale else null
        }

        private fun isLocked(): Boolean {
            val km = getSystemService(KeyguardManager::class.java)
            return km?.isKeyguardLocked ?: true
        }

        private fun draw() {
            if (!visible) return
            val holder = surfaceHolder
            val frame = holder.surfaceFrame
            if (frame.width() <= 0 || frame.height() <= 0) return
            val canvas = try {
                holder.lockHardwareCanvas()
            } catch (e: Exception) {
                null
            } ?: holder.lockCanvas() ?: return
            try {
                val showClock = isPreview || isLocked() || style.clockOnHome
                val info = battery?.let { "Battery $it%" }
                val topInset = frame.width() * 0.08f
                GlassClock.drawScene(
                    canvas, this@GlassClockWallpaper, style,
                    frame.width(), frame.height(), showClock, info, topInset,
                )
            } finally {
                holder.unlockCanvasAndPost(canvas)
            }
        }
    }
}
