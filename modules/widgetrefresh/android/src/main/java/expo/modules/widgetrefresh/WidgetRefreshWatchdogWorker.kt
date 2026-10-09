package expo.modules.widgetrefresh

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters

/**
 * Re-arms the minute tick after the OS has destroyed it. An OEM battery
 * manager force-stops a backgrounded app, which cancels the alarm and leaves
 * the widget frozen on its last render; nothing in the alarm chain can notice,
 * because the chain's only liveness came from the alarm it just lost.
 *
 * WorkManager is the vehicle because it survives what kills the alarm
 * (measured on the 3T: the same force-stop leaves the armed alarms at 0 and
 * the WorkManager jobs in place).
 *
 * It re-arms and nothing else: rendering is the alarm's job, and a watchdog
 * that also rendered would double every render on a healthy phone.
 */
class WidgetRefreshWatchdogWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        if (WidgetRefreshScheduler.hasPlacedWidgets(applicationContext)) {
            WidgetRefreshScheduler.ensureArmed(applicationContext)
        }
        return Result.success()
    }
}
