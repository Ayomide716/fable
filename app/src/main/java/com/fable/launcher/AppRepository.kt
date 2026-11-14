package com.fable.launcher

import android.content.Context
import android.content.Intent
import android.graphics.drawable.Drawable
import android.provider.MediaStore
import java.text.Collator

object AppRepository {

    private val iconCache = HashMap<String, Drawable>()

    /** All apps that show up in a launcher, sorted A–Z (Fable's own entry excluded). */
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

    fun icon(context: Context, app: AppInfo): Drawable? {
        iconCache[app.key]?.let { return it }
        return try {
            context.packageManager.getActivityIcon(app.component).also { iconCache[app.key] = it }
        } catch (e: Exception) {
            null
        }
    }

    fun clearIcons() = iconCache.clear()

    /** Best guess at the phone's own dialer, messages, browser and camera apps. */
    fun defaultDock(context: Context, apps: List<AppInfo>): List<String> {
        val pm = context.packageManager
        val intents = listOf(
            Intent(Intent.ACTION_DIAL),
            Intent.makeMainSelectorActivity(Intent.ACTION_MAIN, Intent.CATEGORY_APP_MESSAGING),
            Intent.makeMainSelectorActivity(Intent.ACTION_MAIN, Intent.CATEGORY_APP_BROWSER),
            Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA),
        )
        val result = mutableListOf<String>()
        for (intent in intents) {
            val pkg = try {
                pm.resolveActivity(intent, 0)?.activityInfo?.packageName
            } catch (e: Exception) {
                null
            } ?: continue
            val app = apps.firstOrNull { it.packageName == pkg && it.key !in result } ?: continue
            result += app.key
        }
        return result
    }
}
