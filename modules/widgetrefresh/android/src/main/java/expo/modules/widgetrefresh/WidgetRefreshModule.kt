package expo.modules.widgetrefresh

import android.content.Context
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

        // The card renders from native on every minute tick, including with
        // the app dead, so the snapshot and the setting are stored rather
        // than passed per render.
        Function("setLockCard") { enabled: Boolean, snapshot: String? ->
            val context = appContext?.reactContext ?: return@Function false
            context.applicationContext
                .getSharedPreferences("expo.modules.widgets", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("__expo_lock_card_enabled", enabled)
                .apply { snapshot?.let { putString("__expo_lock_card_snapshot", it) } }
                .commit()

            LockCardNotifier.refresh(context)
            if (enabled) WidgetRefreshScheduler.ensureArmed(context)
            true
        }
    }
}
