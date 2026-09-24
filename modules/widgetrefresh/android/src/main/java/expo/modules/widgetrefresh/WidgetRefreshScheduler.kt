package expo.modules.widgetrefresh

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import org.json.JSONObject

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
 *
 * The runtime never hands the JS layout its rendered size, so both size
 * stamps are patched HERE: each tick reads every placed id's actual width
 * from the system and writes the composition ("size") and that width
 * ("grantedWidthDp") into the kind's stored props before the re-render.
 * The composition flips within a minute of a resize (owner ruling
 * 2026-09-19); the width lets the medium lay its columns out against what
 * the launcher really gave, which a grid or display-size change alters
 * without any resize at all.
 */
internal object WidgetRefreshScheduler {
    private const val MINUTE_MS = 60_000L

    /** Sits between the half-width small span (~216dp) and the full-width
     *  medium span (~370dp), so the composition always matches the grid the
     *  launcher actually granted. */
    private const val MEDIUM_COMPOSITION_MIN_DP = 250

    private const val WIDGETS_PREFERENCES_NAME = "expo.modules.widgets"

    /** Must match PrayerWidgetAndroidProps.grantedWidthDp in shared/widgetTypes.ts. */
    private const val GRANTED_WIDTH_KEY = "grantedWidthDp"

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

    /**
     * Stamps the composition AND the granted width the placed ids measure over
     * the kind's stored props. MIN_WIDTH is the portrait grant (MAX_WIDTH is
     * landscape), so it is the width the user sees on a phone. Props are stored
     * per kind, so a kind placed at two widths renders the widest id's
     * composition on every instance.
     */
    private fun patchCompositionSize(context: Context, manager: AppWidgetManager, kind: String, ids: IntArray) {
        var widestDp = 0
        for (id in ids) {
            val options: Bundle = manager.getAppWidgetOptions(id) ?: continue
            val minWidthDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0)
            if (minWidthDp > widestDp) widestDp = minWidthDp
        }
        if (widestDp <= 0) return
        val desired = if (widestDp >= MEDIUM_COMPOSITION_MIN_DP) "medium" else "small"

        val preferences = context.applicationContext.getSharedPreferences(WIDGETS_PREFERENCES_NAME, Context.MODE_PRIVATE)
        val key = "__expo_widgets_${kind}_props"
        val stored = preferences.getString(key, null) ?: return
        val patched = runCatching {
            val props = JSONObject(stored)
            // Both stamps gate the write: a re-grant that keeps the composition
            // (a grid change, a display-size change) still has to reach the layout
            if (props.optString("size") == desired && props.optInt(GRANTED_WIDTH_KEY, 0) == widestDp) return
            props.put("size", desired).put(GRANTED_WIDTH_KEY, widestDp).toString()
        }.getOrNull() ?: return
        preferences.edit().putString(key, patched).commit()
    }

    fun updateAll(context: Context) {
        val appContext = context.applicationContext
        val manager = AppWidgetManager.getInstance(appContext)
        for (kind in HOME_KINDS) {
            val component = providerComponent(appContext, kind)
            val ids = manager.getAppWidgetIds(component)
            if (ids.isEmpty()) continue
            patchCompositionSize(appContext, manager, kind, ids)
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
        // 500ms past the edge: the countdown label is minute-ceil and the
        // chain is wall-clock synced (owner ruling 2026-09-19), so the flip
        // lands within half a second of the system minute change
        var atMillis = (System.currentTimeMillis() / MINUTE_MS + 1) * MINUTE_MS + 500
        if (atMillis < System.currentTimeMillis() + 250) atMillis += MINUTE_MS
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
