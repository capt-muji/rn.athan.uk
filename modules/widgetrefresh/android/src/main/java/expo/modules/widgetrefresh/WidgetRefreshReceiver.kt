package expo.modules.widgetrefresh

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * The minute-edge tick: re-render every placed widget, then keep the chain
 * alive only while something is placed. With no placed widgets the chain
 * ends here and the next app open re-arms it.
 */
class WidgetRefreshReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        WidgetRefreshScheduler.updateAll(context)
        if (WidgetRefreshScheduler.hasPlacedWidgets(context)) {
            WidgetRefreshScheduler.armNext(context)
        }
    }
}
