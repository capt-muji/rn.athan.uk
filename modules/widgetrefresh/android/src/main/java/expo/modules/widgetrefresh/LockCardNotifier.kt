package expo.modules.widgetrefresh

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import org.json.JSONObject
import kotlin.math.ceil

/**
 * Posts the lock screen card: an ongoing, silent notification carrying the
 * next prayer.
 *
 * Android removed its lock-screen widget API in 5.0 and never replaced it.
 * The vendor surfaces that do exist are signature-gated to one OEM and
 * absent from older phones, so a notification is the only vehicle that
 * reaches every Android device (session 18).
 *
 * The content is recomputed on the minute-edge tick that already drives the
 * home widgets, rather than handed to Android's Chronometer, because the
 * chronometer can only render "06:08:32" and the owner's countdown shape is
 * "6h 8m".
 */
internal object LockCardNotifier {
    /** A new id would leave the old channel's settings stranded on upgrade. */
    private const val CHANNEL_ID = "lock_card_v1"

    private const val NOTIFICATION_ID = 1_827_401

    private const val MINUTE_MS = 60_000L

    /** Written by the JS push; absent until the user first enables the card. */
    private const val PREFERENCES_NAME = "expo.modules.widgets"
    private const val SNAPSHOT_KEY = "__expo_lock_card_snapshot"
    private const val ENABLED_KEY = "__expo_lock_card_enabled"

    private fun manager(context: Context): NotificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        // LOW keeps the card silent and out of the shade's ranking: it is a
        // display surface, never an alert. The alert channels are untouched.
        val channel = NotificationChannel(CHANNEL_ID, "Lock screen card", NotificationManager.IMPORTANCE_LOW)
        channel.setShowBadge(false)
        channel.setSound(null, null)
        channel.enableVibration(false)
        manager(context).createNotificationChannel(channel)
    }

    /**
     * Formats whole minutes as the app writes a countdown everywhere else.
     * Mirrors formatMinutes in shared/lockCard.ts; both are pinned by the
     * same owner ruling on the countdown shape.
     */
    private fun formatMinutes(totalMinutes: Long): String {
        val hours = totalMinutes / 60
        val minutes = totalMinutes % 60
        return when {
            hours == 0L -> "${minutes}m"
            minutes == 0L -> "${hours}h"
            else -> "${hours}h ${minutes}m"
        }
    }

    private data class Content(val name: String, val time: String, val countdown: String)

    /**
     * Picks the earliest prayer still ahead of [nowMs] out of the stored
     * snapshot. Rows carrying epoch 0 are unreadable and can never win, since
     * 0 predates every instant the app deals in.
     */
    private fun contentFrom(snapshot: String, nowMs: Long): Content? {
        val days = runCatching { JSONObject(snapshot).getJSONArray("days") }.getOrNull() ?: return null

        var bestEpoch = Long.MAX_VALUE
        var bestName: String? = null
        var bestTime = ""

        for (dayIndex in 0 until days.length()) {
            val rows = days.optJSONObject(dayIndex)?.optJSONArray("rows") ?: continue
            for (rowIndex in 0 until rows.length()) {
                val row = rows.optJSONObject(rowIndex) ?: continue
                val epoch = row.optLong("epochMs", 0L)
                if (epoch <= nowMs || epoch >= bestEpoch) continue
                bestEpoch = epoch
                bestName = row.optString("name")
                bestTime = row.optString("time")
            }
        }

        val name = bestName ?: return null
        val minutesLeft = ceil((bestEpoch - nowMs).toDouble() / MINUTE_MS).toLong()
        return Content(name, bestTime, formatMinutes(minutesLeft))
    }

    private fun launchIntent(context: Context): PendingIntent? {
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    fun cancel(context: Context) {
        manager(context.applicationContext).cancel(NOTIFICATION_ID)
    }

    /**
     * Re-renders the card from the stored snapshot, or clears it when the
     * setting is off and when nothing readable is left ahead, so a stale
     * countdown can never sit on the lock screen.
     */
    fun refresh(context: Context) {
        val appContext = context.applicationContext
        val preferences = appContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
        if (!preferences.getBoolean(ENABLED_KEY, false)) {
            cancel(appContext)
            return
        }

        val snapshot = preferences.getString(SNAPSHOT_KEY, null)
        val content = snapshot?.let { contentFrom(it, System.currentTimeMillis()) }
        if (content == null) {
            cancel(appContext)
            return
        }

        ensureChannel(appContext)

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(appContext, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(appContext).setPriority(Notification.PRIORITY_LOW)
        }

        val notification = builder
            .setContentTitle(content.name)
            .setContentText("${content.time}  in ${content.countdown}")
            .setSmallIcon(appContext.applicationInfo.icon)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            // The post time is noise beside a countdown that owns the line
            .setShowWhen(false)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .apply { launchIntent(appContext)?.let { setContentIntent(it) } }
            .build()

        manager(appContext).notify(NOTIFICATION_ID, notification)
    }
}
