package expo.modules.widgetrefresh

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WidgetRefreshModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoWidgetRefresh")

        // JS arms after every snapshot push; the chain sustains itself from
        // there. Idempotent: a pending alarm is never re-created.
        Function("armWidgetRefreshChain") {
            val context = appContext ?: return@Function false
            WidgetRefreshScheduler.ensureArmed(context.reactContext ?: return@Function false)
            true
        }
    }
}
