package expo.modules.widgetrefresh

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WidgetRefreshModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoWidgetRefresh")

        // The minute listener binds to the PROCESS, not to a data push, so it
        // must start with the module. Hanging it off armWidgetRefreshChain left
        // it unregistered on a phone that had not pushed since its last process
        // start: measured on the Find X8, where the app held four receivers and
        // none was TIME_TICK. That is the one minute signal ColorOS does not
        // defer, so it is the layer that must never be missing.
        OnCreate {
            val reactContext = appContext.reactContext ?: return@OnCreate
            WidgetRefreshTickListener.ensureRegistered(reactContext)
        }

        // JS arms after every snapshot push. The alarm carries the minute
        // cadence; the watchdog is what survives an OEM force-stop, which
        // cancels the alarm and would otherwise leave the widget frozen until
        // the next app open.
        Function("armWidgetRefreshChain") {
            val context = appContext ?: return@Function false
            val reactContext = context.reactContext ?: return@Function false
            WidgetRefreshScheduler.ensureArmed(reactContext)
            WidgetRefreshScheduler.ensureWatchdog(reactContext)
            WidgetRefreshTickListener.ensureRegistered(reactContext)
            true
        }
    }
}
