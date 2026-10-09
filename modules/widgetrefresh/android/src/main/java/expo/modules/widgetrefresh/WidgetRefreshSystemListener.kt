package expo.modules.widgetrefresh

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter

/**
 * Redraws the widgets on the two system signals no OEM policy can defer, so the
 * countdown is correct both while the user watches it and at the instant they
 * first look.
 *
 * ACTION_TIME_TICK carries the minute cadence while the screen is on, which is
 * the only time it is delivered. ACTION_SCREEN_ON covers what that leaves
 * uncovered: with the screen off the alarm is the only trigger left, and
 * ColorOS widens it rather than firing it exactly (read from dumpsys on the
 * Find X8: window=+25s729ms, maxWhenElapsed=+34s440ms, beside
 * exactAllowReason=policy_permission, which AOSP never emits together). Until
 * that deferred alarm lands the widget still holds the previous minute's label,
 * and waking inside the window shows it. Measured on 1.28.24 with TIME_TICK
 * confirmed registered: a wake at 11:51:13 read 1h 7m against a true 1h 6m and
 * corrected 21 seconds later, at the next minute edge.
 *
 * It RENDERS; it must never re-arm. ACTION_TIME_TICK arrives at the minute
 * boundary itself, and the alarm is set 500ms past that boundary, so calling
 * armNext from here reschedules the pending alarm to the NEXT minute 500ms
 * before it would have fired. Doing that every minute means the alarm can
 * never fire at all: it is pushed forward forever and the widget freezes.
 * Measured on the 3T at 1.28.19, where the label sat at 53m while the true
 * remaining walked from 53m to 36m.
 *
 * Registered at runtime, never in the manifest: Android refuses both actions to
 * manifest receivers (TIME_TICK from API 26, SCREEN_ON since API 1), so a
 * manifest entry would silently deliver nothing.
 *
 * The body stays one guarded redraw, because it runs every minute for the life
 * of the process.
 */
internal object WidgetRefreshSystemListener {
    @Volatile
    private var registered = false

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (WidgetRefreshScheduler.hasPlacedWidgets(context)) {
                WidgetRefreshScheduler.updateAll(context)
            }
        }
    }

    fun ensureRegistered(context: Context) {
        synchronized(this) {
            if (registered) return
            val filter = IntentFilter(Intent.ACTION_TIME_TICK).apply {
                addAction(Intent.ACTION_SCREEN_ON)
            }
            context.applicationContext.registerReceiver(receiver, filter)
            registered = true
        }
    }
}
