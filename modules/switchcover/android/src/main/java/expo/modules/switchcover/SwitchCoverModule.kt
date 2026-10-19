package expo.modules.switchcover

import android.content.res.ColorStateList
import android.graphics.Color
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Record

/**
 * The language switch's cover: the loader's own face, held by the activity's content view across
 * the React context restart an Android crossing switch triggers. expo-modules-core builds a fresh
 * Module instance per React context and the hide() after the restart arrives from the new
 * context's instance, so the view and the showing flag live in the companion object and this
 * module registers no OnDestroy cleanup: the cover must outlive the registry that showed it.
 */
class SwitchCoverModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("SwitchCover")

        // View work runs on the main queue: the AsyncFunction body otherwise executes off it
        AsyncFunction("show") { cover: SwitchCoverFace ->
            val activity = appContext.currentActivity ?: return@AsyncFunction
            val content = activity.findViewById<ViewGroup>(android.R.id.content) ?: return@AsyncFunction

            // A companion-held view can outlive its activity: one whose parent is no longer this
            // content view is a stale reference from a destroyed activity, dropped rather than reused
            heldCover?.let { held ->
                if (held.parent !== content) {
                    (held.parent as? ViewGroup)?.removeView(held)
                    heldCover = null
                    showing = false
                }
            }
            if (showing) return@AsyncFunction

            val density = activity.resources.displayMetrics.density
            val spinnerPx = (cover.spinnerSizeDp * density).toInt()
            val lineSizePx = (cover.lineSizeDp * density).toFloat()
            val lineMarginPx = (cover.lineMarginTopDp * density).toInt()
            val lineMaxWidthPx = (cover.lineMaxWidthDp * density).toInt()
            // The content view is laid out behind the loader at show time; a call that beats
            // layout centres on the display instead
            val midY =
                if (content.height > 0) {
                    content.height / 2
                } else {
                    activity.resources.displayMetrics.heightPixels / 2
                }

            val spinner =
                ProgressBar(activity).apply {
                    isIndeterminate = true
                    indeterminateTintList = ColorStateList.valueOf(Color.parseColor(cover.spinnerColor))
                    layoutParams =
                        FrameLayout.LayoutParams(spinnerPx, spinnerPx, Gravity.CENTER_HORIZONTAL).apply {
                            // The loader's translateY(-size / 2): the spinner box centres dead on the parent's midpoint
                            topMargin = midY - spinnerPx / 2
                        }
                }

            val line =
                TextView(activity).apply {
                    text = cover.lineText
                    setTextColor(Color.parseColor(cover.lineColor))
                    setTextSize(TypedValue.COMPLEX_UNIT_PX, lineSizePx)
                    gravity = Gravity.CENTER
                    setTextAlignment(View.TEXT_ALIGNMENT_CENTER)
                    layoutParams =
                        FrameLayout.LayoutParams(
                            lineMaxWidthPx,
                            ViewGroup.LayoutParams.WRAP_CONTENT,
                            Gravity.CENTER_HORIZONTAL,
                        ).apply {
                            // Hung from the spinner's foot, as the loader's line box is
                            topMargin = midY + lineMarginPx
                        }
                }

            val coverView =
                FrameLayout(activity).apply {
                    setBackgroundColor(Color.parseColor(cover.backgroundColor))
                    layoutParams =
                        ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT,
                        )
                    addView(spinner)
                    addView(line)
                }

            content.addView(coverView)
            heldCover = coverView
            showing = true
        }.runOnQueue(Queues.MAIN)

        AsyncFunction("hide") {
            val held = heldCover
            if (held != null) {
                (held.parent as? ViewGroup)?.removeView(held)
                heldCover = null
                showing = false
            }
        }.runOnQueue(Queues.MAIN)
    }

    companion object {
        private var heldCover: FrameLayout? = null
        private var showing = false
    }
}

/** The cover's face, in the loader's own values; every dp field is scaled by the display density here */
data class SwitchCoverFace(
    val backgroundColor: String = "#000000",
    val spinnerColor: String = "#ffffff",
    val spinnerSizeDp: Double = 20.0,
    val lineText: String = "",
    val lineColor: String = "#ffffff",
    val lineSizeDp: Double = 18.0,
    val lineMarginTopDp: Double = 40.0,
    val lineMaxWidthDp: Double = 260.0,
) : Record
