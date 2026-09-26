package expo.modules.widgetrefresh

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Re-arms the chain across reboots (alarms do not survive them) and app
 * updates, so a placed widget never freezes for longer than one boot cycle
 * without an app open.
 */
class WidgetRefreshBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_MY_PACKAGE_REPLACED) return
        WidgetRefreshScheduler.updateAll(context)
        if (WidgetRefreshScheduler.hasPlacedWidgets(context)) {
            WidgetRefreshScheduler.armNext(context)
            // A reboot clears WorkManager's schedule too, so the watchdog is
            // re-enqueued beside the alarm rather than waiting for an app open.
            WidgetRefreshScheduler.ensureWatchdog(context)
            // Same reason as the tick receiver: a boot-time process has no Expo
            // module registry, so the listener has to be claimed here too.
            WidgetRefreshTickListener.ensureRegistered(context)
        }
    }
}
