package com.fable.launcher

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.widget.Toast

/** Opens apps, routing distracting ones through the mindful pause. */
object Launcher {

    fun open(activity: Activity, app: AppInfo) {
        val prefs = Prefs(activity)
        if (prefs.isDistracting(app.key)) {
            val attempt = prefs.recordAttempt(app.key)
            activity.startActivity(
                Intent(activity, PauseActivity::class.java)
                    .putExtra(PauseActivity.EXTRA_LABEL, app.label)
                    .putExtra(PauseActivity.EXTRA_PACKAGE, app.packageName)
                    .putExtra(PauseActivity.EXTRA_CLASS, app.className)
                    .putExtra(PauseActivity.EXTRA_ATTEMPT, attempt)
            )
            activity.overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        } else {
            openDirect(activity, app)
        }
    }

    fun openDirect(activity: Activity, app: AppInfo) {
        val intent = Intent(Intent.ACTION_MAIN)
            .addCategory(Intent.CATEGORY_LAUNCHER)
            .setComponent(app.component)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
        try {
            activity.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(activity, "${app.label} isn't installed any more", Toast.LENGTH_SHORT).show()
        } catch (e: SecurityException) {
            Toast.makeText(activity, "Can't open ${app.label}", Toast.LENGTH_SHORT).show()
        }
    }
}
