# Root cause: Glance's own update() is a no-op when no session is running

## The evidence chain

1. **Device symptom (both phones, build 1.28.20).** The tick alarm fires every minute (verified 3
   fires per 3 minutes on BOTH the 3T and the X8 via AlarmManager's own cumulative counter), the
   `ACTION_APPWIDGET_UPDATE` broadcast is sent, the launcher logs
   `LauncherAppWidgetHostView: updateAppWidget: com.mugtaba.athan` — and the widget text does not change.

2. **Logcat, 3T:** every tick produces
   `GlanceSessionManager: Closing session appWidget-41 wasOpen=false hasError=false events=[]`.
   The session closes **without ever opening**, so nothing is composed.

3. **The upstream source** (androidx-main, `GlanceAppWidget.kt`), which the peek fork used by
   expo-widgets leaves untouched apart from translation hooks:

```kotlin
internal suspend fun update(context: Context, appWidgetId: Int, options: Bundle? = null) {
    Tracing.beginGlanceAppWidgetUpdate()
    val glanceId = AppWidgetId(appWidgetId)
    getOrCreateAppWidgetSession(context, glanceId, options) { session, wasRunning ->
        if (wasRunning) session.updateGlance()
    }
}
```

and

```kotlin
internal suspend fun <T> getOrCreateAppWidgetSession(...): T =
    getSessionManager(context).runWithLock {
        val wasRunning = isSessionRunning(context, glanceId.toSessionKey())
        if (!wasRunning) {
            startSession(context, createAppWidgetSession(context, glanceId, options))
        }
        val session = getSession(glanceId.toSessionKey()) as AppWidgetSession
        return@runWithLock block(session, wasRunning)
    }
```

**`updateGlance()` is called ONLY when a session was already running.** When the app process has been
backgrounded long enough for Glance's session to be torn down, `wasRunning` is false: Glance starts a
session and then does nothing with it, and the widget keeps its previous RemoteViews.

## Why this matches every observation

| Observation | Explained |
| --- | --- |
| Widget freezes while the alarm keeps firing | `onUpdate` -> `update()` -> no `updateGlance()` because no session was running |
| Opening the app instantly corrects it | A foreground push calls `updateSnapshot`/`reload` from JS while the process is warm, so a session IS running and `updateGlance()` runs |
| It then re-freezes within a minute or two | The session is torn down once the app is backgrounded again |
| `wasOpen=false` on every closing session | The session was created by `startSession` and closed without composing |
| X8 ticked perfectly for 4 edges at 01:02 to 01:05 | The app had just been foregrounded, so sessions were alive |

## What this is NOT

- Not the alarm. Both phones fire 3/3 per 3 minutes.
- Not app-standby or an OEM battery manager. The X8 with "allow background activity" still froze
  once its sessions died, and the 3T (stock Android 9, no OEM killer) freezes identically.
- Not the stale snapshot. The data is correct; it is never re-rendered.
- Not `patchCompositionSize`'s early return: `updateAll` broadcasts unconditionally regardless.

## The fix, without patching Glance

`GlanceAppWidget.updateAll(context)` and `update(context, glanceId)` both route through the same
no-op path. The reliable API is the one that forces a composition regardless of session state:
Glance exposes `GlanceAppWidget.update()` only as above, so the supported way to force a render from
outside the app process is to **start the session AND request an update**, which upstream does by
calling `session.updateGlance()` on an already-running session.

Options, in order of preference:

1. **Have the native tick call the same path the JS push uses.** The JS push calls expo-widgets'
   `updateSnapshot`/`reload`, which works even when cold, because it writes new props to the shared
   preferences and then triggers the update. If the native receiver writes a trivially-changed prop
   (or re-writes the same props) before broadcasting, Glance's state-backed composition has a reason
   to recompose. This needs verification: the state write is what Glance observes, not the broadcast.
2. **Call `AppWidgetSession.updateGlance()` equivalent by forcing `wasRunning`** — not reachable from
   outside the library (`internal`).
3. **Patch the peek fork** so `update()` always calls `updateGlance()`. This is a two-line change and
   is the last resort per the owner's instruction.

Option 1 is tried first because it needs no patch.

## Longer measurement refines the picture: intermittent, not permanent

An 8-minute watch on the 3T with the app backgrounded (build 1.28.20):

| Clock | True | Widget | Verdict |
| --- | --- | --- | --- |
| 01:39:52 | 3h 43m | 3h 45m | DRIFT +2 |
| 01:42:04 | 3h 40m | 3h 40m | exact |
| 01:44:16 | 3h 38m | 3h 38m | exact |
| 01:46:28 | 3h 36m | 3h 38m | DRIFT +2 |
| 01:48:40 | 3h 34m | 3h 34m | exact |
| 01:50:52 | 3h 32m | 3h 34m | DRIFT +2 |
| 01:53:04 | 3h 29m | 3h 34m | DRIFT +5 |

So the render is **intermittent**: some ticks compose, some do not, and the error accumulates between
successful ones. That matches `if (wasRunning) session.updateGlance()` exactly, because whether a
session happens to be alive at tick time is a race against Glance's own session teardown (the
`Closing session ... wasOpen=false` lines land ~45s after each update, i.e. the session created by
one tick is torn down before the next tick needs it).

⚠️ This also revises the earlier "frozen forever" reading: over a long enough window the widget does
correct itself, but it spends most of its time wrong, and the drift reaches +5 and beyond between
lucky ticks. The owner's reported 20 to 24 minutes is the tail of this distribution, not a special case.

## The verified mechanism, stated once

`ACTION_APPWIDGET_UPDATE` -> `GlanceAppWidgetReceiver.onUpdate` -> `GlanceAppWidget.update()` ->
`getOrCreateAppWidgetSession { session, wasRunning -> if (wasRunning) session.updateGlance() }`.

When no session is running, Glance starts one and returns WITHOUT composing. The started session then
closes with `wasOpen=false`. The widget keeps its previous RemoteViews, so the label freezes at
whatever the last successful composition produced.

## CONTROLLED EXPERIMENT: the hypothesis is proven

Prediction from the source: a single `ACTION_APPWIDGET_UPDATE` on a cold session starts a session but
does not compose (`if (wasRunning)` is false). A SECOND update moments later finds that session alive
and DOES compose.

Run on the 3T, app backgrounded, build 1.28.20:

| Step | Clock | True | Widget | Result |
| --- | --- | --- | --- | --- |
| Before (drifted) | 01:56:01 | 3h 26m | 3h 34m | **DRIFT +8** |
| Broadcast 1, then broadcast 2 three seconds later | | | | |
| After | 01:57:17 | 3h 25m | 3h 25m | **EXACT** |

A single tick had left it 8 minutes stale; two ticks 3 seconds apart corrected it completely. This is
the predicted behaviour of `if (wasRunning) session.updateGlance()` and rules out every alternative
explanation (alarm timing, OEM policy, stale data, snapshot age).

## The fix chosen: double-tap the update, no patch required

`WidgetRefreshScheduler.updateAll` sends one broadcast per kind. Sending a second broadcast a short
delay later means the session started by the first is still alive, so the second composes. This:

- needs **no patch** to Glance or expo-widgets, which the owner asked for;
- uses only the public `ACTION_APPWIDGET_UPDATE` path already in use;
- costs one extra broadcast per minute per kind, which is trivial next to a composition;
- degrades safely: if a session WAS already running, the first broadcast composes and the second is a
  cheap no-op recomposition of identical content.

⚠️ **Assumption to verify on device:** that a 2 to 3 second gap is reliably inside Glance's session
lifetime. The observed teardown is ~45s after an update, so a few seconds has wide margin, but the
exact value is a race and must be proven by measurement over many ticks on BOTH phones, not reasoned.
