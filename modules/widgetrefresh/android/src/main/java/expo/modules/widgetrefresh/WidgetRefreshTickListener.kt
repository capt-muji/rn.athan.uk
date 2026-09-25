package expo.modules.widgetrefresh

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter

/**
 * Re-arms the tick on every system minute while this process lives, so an
 * alarm the OS destroyed is invisible: the next minute puts it back. This
 * covers the window between losing the alarm and the 15-minute watchdog
 * noticing.
 *
 * Registered at runtime, never in the manifest: Android refuses
 * ACTION_TIME_TICK to manifest receivers from API 26 and this module's minSdk
 * is 24, so a manifest entry would work on two API levels and silently stop on
 * every later one.
 *
 * ACTION_TIME_TICK arrives once a minute for the life of the process, so the
 * body stays one guarded re-arm and nothing else.
 */
internal object WidgetRefreshTickListener {
    @Volatile
    private var registered = false

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (WidgetRefreshScheduler.hasPlacedWidgets(context)) {
                WidgetRefreshScheduler.ensureArmed(context)
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
