package com.fable.launcher

import android.content.Context
import android.content.SharedPreferences

/** Which apps sit on the home screen and in the dock. */
class Prefs(context: Context) {

    private val sp: SharedPreferences =
        context.applicationContext.getSharedPreferences("fable", Context.MODE_PRIVATE)

    /** null until the user (or first-run setup) has chosen. */
    var homeApps: List<String>?
        get() = sp.getString(KEY_HOME, null)?.split('\n')?.filter { it.isNotBlank() }
        set(value) = sp.edit().putString(KEY_HOME, value?.joinToString("\n")).apply()

    var dockApps: List<String>?
        get() = sp.getString(KEY_DOCK, null)?.split('\n')?.filter { it.isNotBlank() }
        set(value) = sp.edit().putString(KEY_DOCK, value?.joinToString("\n")).apply()

    companion object {
        const val MAX_HOME = 16
        const val MAX_DOCK = 4
        private const val KEY_HOME = "home_apps"
        private const val KEY_DOCK = "dock_apps"
    }
}
