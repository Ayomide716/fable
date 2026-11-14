package com.fable.launcher

import android.content.Context
import android.content.SharedPreferences
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Everything Fable remembers, stored in SharedPreferences. */
class Prefs(context: Context) {

    private val sp: SharedPreferences =
        context.applicationContext.getSharedPreferences("fable", Context.MODE_PRIVATE)

    // ---- Favourites (ordered) ----

    var favorites: List<String>
        get() = sp.getString(KEY_FAVORITES, "")!!.split('\n').filter { it.isNotBlank() }
        set(value) = sp.edit().putString(KEY_FAVORITES, value.joinToString("\n")).apply()

    fun isFavorite(key: String) = key in favorites

    /** Returns false if the home screen is already full. */
    fun addFavorite(key: String): Boolean {
        val current = favorites
        if (key in current) return true
        if (current.size >= MAX_FAVORITES) return false
        favorites = current + key
        return true
    }

    fun removeFavorite(key: String) {
        favorites = favorites - key
    }

    fun moveFavoriteUp(key: String) {
        val list = favorites.toMutableList()
        val i = list.indexOf(key)
        if (i > 0) {
            list[i] = list[i - 1]
            list[i - 1] = key
            favorites = list
        }
    }

    // ---- Distracting apps ----

    var distracting: Set<String>
        get() = sp.getStringSet(KEY_DISTRACTING, emptySet())!!.toSet()
        set(value) = sp.edit().putStringSet(KEY_DISTRACTING, value).apply()

    fun isDistracting(key: String) = key in distracting

    fun toggleDistracting(key: String) {
        val current = distracting
        distracting = if (key in current) current - key else current + key
    }

    // ---- Options ----

    var pauseSeconds: Int
        get() = sp.getInt(KEY_PAUSE_SECONDS, 5)
        set(value) = sp.edit().putInt(KEY_PAUSE_SECONDS, value).apply()

    var autoLaunch: Boolean
        get() = sp.getBoolean(KEY_AUTO_LAUNCH, true)
        set(value) = sp.edit().putBoolean(KEY_AUTO_LAUNCH, value).apply()

    var showKeyboard: Boolean
        get() = sp.getBoolean(KEY_SHOW_KEYBOARD, true)
        set(value) = sp.edit().putBoolean(KEY_SHOW_KEYBOARD, value).apply()

    // ---- Daily counters (reset automatically each day) ----

    /** Records an attempt to open [key] today and returns today's total. */
    fun recordAttempt(key: String): Int {
        rollDay()
        val k = "attempt:$key"
        val n = sp.getInt(k, 0) + 1
        sp.edit().putInt(k, n).apply()
        return n
    }

    fun recordSkip() {
        rollDay()
        sp.edit().putInt(KEY_SKIPS, sp.getInt(KEY_SKIPS, 0) + 1).apply()
    }

    fun skipsToday(): Int {
        rollDay()
        return sp.getInt(KEY_SKIPS, 0)
    }

    /** Clears yesterday's counters when the date changes. */
    private fun rollDay() {
        val today = SimpleDateFormat("yyyyMMdd", Locale.US).format(Date())
        if (sp.getString(KEY_DAY, null) == today) return
        val editor = sp.edit()
        sp.all.keys.filter { it.startsWith("attempt:") }.forEach { editor.remove(it) }
        editor.putInt(KEY_SKIPS, 0).putString(KEY_DAY, today).apply()
    }

    companion object {
        const val MAX_FAVORITES = 7
        private const val KEY_FAVORITES = "favorites"
        private const val KEY_DISTRACTING = "distracting"
        private const val KEY_PAUSE_SECONDS = "pause_seconds"
        private const val KEY_AUTO_LAUNCH = "auto_launch"
        private const val KEY_SHOW_KEYBOARD = "show_keyboard"
        private const val KEY_SKIPS = "skips"
        private const val KEY_DAY = "day"
    }
}
