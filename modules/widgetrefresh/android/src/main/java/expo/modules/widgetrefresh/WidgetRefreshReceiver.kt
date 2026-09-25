package expo.modules.widgetrefresh

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * The minute-edge tick: re-render every placed widget and the lock card,
 * then keep the chain alive while either still needs it. With nothing placed
 * and the card off, the chain ends here and the next app open re-arms it.
 */
class WidgetRefreshReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        WidgetRefreshScheduler.updateAll(context)
        LockCardNotifier.refresh(context)
        if (WidgetRefreshScheduler.needsChain(context)) {
            WidgetRefreshScheduler.armNext(context)
        }
    }
}
