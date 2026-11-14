package com.fable.launcher

import android.content.Context
import android.content.Intent
import java.text.Collator

object AppRepository {

    /** All apps that show up in a launcher, sorted A–Z (Fable itself excluded). */
    fun loadApps(context: Context): List<AppInfo> {
        val pm = context.packageManager
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val collator = Collator.getInstance()
        return pm.queryIntentActivities(intent, 0)
            .asSequence()
            .filter { it.activityInfo.packageName != context.packageName }
            .map {
                AppInfo(
                    label = it.loadLabel(pm).toString().trim(),
                    packageName = it.activityInfo.packageName,
                    className = it.activityInfo.name,
                )
            }
            .distinctBy { it.key }
            .sortedWith { a, b -> collator.compare(a.label, b.label) }
            .toList()
    }
}
