package expo.modules.widgetrefresh

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WidgetRefreshModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoWidgetRefresh")

        // JS arms after every snapshot push. The alarm carries the minute
        // cadence; the watchdog is what survives an OEM force-stop, which
        // cancels the alarm and would otherwise leave the widget frozen until
        // the next app open.
        Function("armWidgetRefreshChain") {
            val context = appContext ?: return@Function false
            val reactContext = context.reactContext ?: return@Function false
            WidgetRefreshScheduler.ensureArmed(reactContext)
            WidgetRefreshScheduler.ensureWatchdog(reactContext)
            true
        }
    }
}
