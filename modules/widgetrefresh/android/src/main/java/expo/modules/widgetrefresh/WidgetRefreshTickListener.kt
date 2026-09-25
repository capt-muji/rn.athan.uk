package expo.modules.widgetrefresh

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter

/**
 * Redraws the widgets on every system minute while this process lives, so the
 * countdown stays correct even if the alarm was destroyed or deferred.
 *
 * It RENDERS; it must never re-arm. ACTION_TIME_TICK arrives at the minute
 * boundary itself, and the alarm is set 500ms past that boundary, so calling
 * armNext from here reschedules the pending alarm to the NEXT minute 500ms
 * before it would have fired. Doing that every minute means the alarm can
 * never fire at all: it is pushed forward forever and the widget freezes.
 * Measured on the 3T at 1.28.19, where the label sat at 53m while the true
 * remaining walked from 53m to 36m.
 *
 * Registered at runtime, never in the manifest: Android refuses
 * ACTION_TIME_TICK to manifest receivers from API 26 and this module's minSdk
 * is 24, so a manifest entry would work on two API levels and silently stop on
 * every later one.
 *
 * The body stays one guarded redraw, because it runs every minute for the life
 * of the process.
 */
internal object WidgetRefreshTickListener {
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
            context.applicationContext.registerReceiver(receiver, IntentFilter(Intent.ACTION_TIME_TICK))
            registered = true
        }
    }
}
