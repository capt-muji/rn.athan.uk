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
            // Also claim the system broadcasts from here, because this receiver
            // runs in whatever process Android revived to serve the widget.
            // After a force-stop that process comes back WITHOUT the Expo module
            // registry (measured on the Find X8: 3 receivers, not 8), so the
            // module's OnCreate never runs and the listener would stay missing
            // until the user opened the app. They are the redraw signals
            // ColorOS does not defer, so they have to be re-claimed wherever we
            // regain execution.
            WidgetRefreshSystemListener.ensureRegistered(context)
        }
    }
}
