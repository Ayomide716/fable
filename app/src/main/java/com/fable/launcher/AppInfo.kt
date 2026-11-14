package com.fable.launcher

import android.content.ComponentName

/** One launchable app. [key] uniquely identifies it ("package/activity"). */
data class AppInfo(
    val label: String,
    val packageName: String,
    val className: String,
) {
    val key: String get() = "$packageName/$className"
    val component: ComponentName get() = ComponentName(packageName, className)
}
