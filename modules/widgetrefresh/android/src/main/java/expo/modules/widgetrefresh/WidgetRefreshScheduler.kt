package expo.modules.widgetrefresh

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Drives the Android widgets' minute cadence with no JS runtime: one exact
 * alarm just past each wall-minute edge re-renders every placed widget via
 * the public ACTION_APPWIDGET_UPDATE path, and re-arms itself. The JS flip
 * chain in stores/widget.ts dies with the host process, which froze the
 * countdown until the app next opened (owner ruling 2026-09-19).
 *
 * expo-widgets' own WidgetsUpdater is module-private, so the refresh rides
 * each generated GlanceAppWidgetReceiver's standard update broadcast; the
 * layout recomputes its content from the carried epochs at every render.
 */
internal object WidgetRefreshScheduler {
    private const val MINUTE_MS = 60_000L

    private val HOME_KINDS = listOf(
        "PrayerWidget",
        "ExtrasWidget",
        "PrayerWidgetMedium",
        "ExtrasWidgetMedium",
        "PrayerWidgetDark",
        "ExtrasWidgetDark",
        "PrayerWidgetDarkMedium",
        "ExtrasWidgetDarkMedium",
    )

    private fun providerComponent(context: Context, kind: String): ComponentName =
        ComponentName(context.packageName, "${context.packageName}.${kind}Provider")

    fun hasPlacedWidgets(context: Context): Boolean {
        val manager = AppWidgetManager.getInstance(context)
        return HOME_KINDS.any { kind -> manager.getAppWidgetIds(providerComponent(context, kind)).isNotEmpty() }
    }

    fun updateAll(context: Context) {
        val appContext = context.applicationContext
        val manager = AppWidgetManager.getInstance(appContext)
        for (kind in HOME_KINDS) {
            val component = providerComponent(appContext, kind)
            val ids = manager.getAppWidgetIds(component)
            if (ids.isEmpty()) continue
            val update = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                this.component = component
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            appContext.sendBroadcast(update)
        }
    }

    /** Arms the next minute-edge alarm when none is pending, so every caller may call freely. */
    fun ensureArmed(context: Context) {
        val appContext = context.applicationContext
        val existing = PendingIntent.getBroadcast(
            appContext,
            0,
            Intent(appContext, WidgetRefreshReceiver::class.java),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (existing == null) armNext(appContext)
    }

    fun armNext(context: Context) {
        val appContext = context.applicationContext
        val alarmManager = appContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        // 1s past the edge: the countdown label is minute-ceil, so a render
        // just past the boundary always carries the new minute
        var atMillis = (System.currentTimeMillis() / MINUTE_MS + 1) * MINUTE_MS + 1_000
        if (atMillis < System.currentTimeMillis() + 500) atMillis += MINUTE_MS
        val pending = PendingIntent.getBroadcast(
            appContext,
            0,
            Intent(appContext, WidgetRefreshReceiver::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
        if (canExact) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pending)
        } else {
            // Deep-doze coalescing accepted: the screen is off when it bites,
            // and the next fire catches the label up
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, pending)
        }
    }
}
