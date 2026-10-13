# Ticket 71 findings: the AppState soft exception on the relaunch teardown

Every load-bearing claim cites file:line, read on this run's tree (uat at or above the Planned
at 2.0.187; RN 0.88.0-rc.3 and expo-updates as pinned in node_modules).

## 1. The three AppState listeners and the reload site

| Listener | Where | Behaviour when the reload tears the context down |
| --- | --- | --- |
| The launch listener | `device/listeners.ts:79`, registered once per process behind the `listenersInitialized` guard (:17, :24-25), seeded from `AppState.currentState` (:27) | Downstream of the emit. The dying tree never receives the dropped background event (the emit is dropped before dispatch, `ReactHostImpl.kt:916-926`); the relaunched tree re-registers fresh and re-seeds from the live state (`app/index.tsx:108`, `device/listeners.ts:27`) |
| The perf flush | `shared/perf.ts:205`, live only behind the perf monitor gate | Loses one background flush into a tree the reload tears down; dev-gated, no production path |
| The permission watcher | `hooks/useNotification.ts:37`, removes itself on return (`:44`) | Unrelated to reload timing: it watches the settings round-trip, not language switches |

The reload site: `stores/language.ts:77-89`, the D59 branch, `await Updates.reloadAsync()` at
`:83`. The second production reload site is the error screen's recovery
(`components/ui/Error.tsx:30`); the same teardown log rides every reload from any site.

## 2. The throw path, hop by hop

1. The D59 branch calls `Updates.reloadAsync()` (`stores/language.ts:83`).
2. expo-updates' native `AsyncFunction("reload")` relaunches the React application
   (`node_modules/expo-updates/android/src/main/java/expo/modules/updates/UpdatesModule.kt:65-68`),
   resolving the React host and calling `reload(reason)`
   (`.../procedures/RestartReactAppExtensions.kt:28-32`).
3. `ReactHostImpl.reload` resets the instance task ref, then pauses the dying context on the
   UI executor while its lifecycle state is RESUMED
   (`node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt:1330-1336`).
4. `ReactContext.onHostPause` fans out to the lifecycle listeners
   (`.../bridge/ReactContext.java:321-334`), reaching `AppStateModule.onHostPause`, which sets
   background and emits `appStateDidChange`
   (`.../modules/appstate/AppStateModule.kt:46-49`).
5. The drop is ordered, not a lost race. The reload first resets the instance task ref to its
   initial value, a completed task holding a null result
   (`node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/runtime/ReactHostImpl.kt:1316-1317`,
   the initial value declared at `:129`), then pauses the dying context (`:1330-1336`). The
   module's guard reads a different field, the `reactInstance` member (`:130`, read by
   `isInstanceInitialized` at `:347-348` through
   `.../runtime/BridgelessReactContext.kt:109` from `AppStateModule.kt:68`), which stays live
   until the chain's destroy step (`:1387`, fourth in the continuation chain, after the
   pause). The guard passes, the emit dispatches onto the reset ref, the task result is null,
   and `callFunctionOnModule` lands on `callWithExistingReactInstance`, which raises
   (`ReactHostImpl.kt:916-926`).
6. The raise logs a `ReactNoCrashSoftException` (`ReactHostImpl.kt:897-908`), printed via
   `FLog.e`, never thrown
   (`.../bridge/ReactSoftExceptionLogger.kt:68-77`). The exception object is constructed at
   the raise site, so its captured stack carries the `AppStateModule.onHostPause` frames the
   row 71 record read.

## 3. Why the JS listeners cannot suppress the exception

> The throw path holds no repo code. Hop 1 is the repo's only hop, and it ends at the
> `reloadAsync` call; hops 2 to 6 are native, inside the reload implementation the call
> invokes. The three JS listeners of section 1 consume the event the native module emits at
> hop 4; subscribing or unsubscribing them changes nothing upstream of that emit, and React
> pauses the dying context unconditionally while RESUMED (hop 3). A pause-before-reload change
> is therefore dead code on a working path: it cannot suppress the exception.

## 4. What the dropped event costs

> The dropped emit is the dying tree's background transition. No consumer needs it: the
> relaunched tree re-seeds `previousAppState` from `AppState.currentState`
> (`device/listeners.ts:27`) on its fresh registration (`app/index.tsx:108`), so no stale
> background-to-active transition is expected or missed; the perf flush (`shared/perf.ts:205`)
> loses one flush into a tree the reload tears down, behind a dev gate; the permission
> watcher (`hooks/useNotification.ts:37`) removes itself and is unrelated to reload timing.
> The post-reload convergence stamp-bails (`stores/language.ts:38`), so no re-arm work is
> lost.

## 5. The alternatives, rejected

1. Unsubscribe the app's AppState listener(s) before `reloadAsync`. Rejected: downstream of the
   emit, no effect on the raise (section 3).
2. Patch React Native core to guard or silence the raise (patch-package shape). Rejected:
   `patches/` today carries only expo-background-task, expo-location and expo-widgets; an RN
   core patch is a new surface carried on every re-pin, for zero behaviour change. The row 51
   discipline is the repo's settled answer for RN and expo corrections: file them upstream; a
   local patch dies at the next re-pin. If the owner ever wants the line gone, the lever is an
   upstream report carrying the traced chain of section 2.
3. Suppress at the logger by wiring a `ReactSoftExceptionListener`. Rejected: a native listener
   needs a native module or a patch, the same rejection as alternative 2 with more machinery.
4. Stop reloading (drop the D59 relaunch). Rejected: D59 is the owner's landed ruling and row
   66's option 1 keeps it; the exception is a recorded cost of that ruling, not a new defect.

## 6. The verdict

> No. The AppState listener must not pause before the reload, and no code change ships: the
> exception is raised inside React's own reload sequence, every hop after the `reloadAsync`
> call is native, the repo's listeners sit downstream of the emitting module and cannot
> suppress it, and the dropped event has no consumer that needs it (sections 1 to 4). One
> logged exception block whenever the reload fires is the whole cost; silencing it from inside
> this repo means patching RN core, which section 5 rejects, so the fix-if-so branch stays
> untaken.

## 7. The crossing pinned on the 3T

Measured on the mock build (production package id com.mugtaba.athan, versionName 2.0.190,
floor test device), 2026-10-13: one RTL boundary crossing, en to ar, captured in one
process. The verbatim block below is transcribed from logcat-drive1-full.txt and
cross-checked against NOTES.md.

### The exception block, verbatim

```
10-13 08:45:33.305 21009 21009 W unknown:BridgelessReact: ReactHost{0}.raiseSoftException(callWithExistingReactInstance(callFunctionOnModule("RCTDeviceEventEmitter", "emit"))): Execute: reactInstance is null. Dropping work.
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: Unhandled SoftException
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: com.facebook.react.bridge.ReactNoCrashSoftException: raiseSoftException(callWithExistingReactInstance(callFunctionOnModule("RCTDeviceEventEmitter", "emit"))): Execute: reactInstance is null. Dropping work.
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at com.facebook.react.runtime.ReactHostImpl.i(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:22)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at am6.a(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:59)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at u88.run(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:12)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at oj9.execute(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:45)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at v88.a(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:43)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at r88.a(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:90)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at u88.run(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:29)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at oj9.execute(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:45)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at e64.a(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:9)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at v88.b(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:37)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at v88.g(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:10)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at com.facebook.react.runtime.ReactHostImpl.a(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:56)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at ue0.emitDeviceEvent(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:18)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at com.facebook.react.modules.appstate.AppStateModule.sendEvent(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:15)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at com.facebook.react.modules.appstate.AppStateModule.sendAppStateChangeEvent(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:7)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at com.facebook.react.modules.appstate.AppStateModule.onHostPause(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:5)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at com.facebook.react.bridge.ReactContext.onHostPause(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:28)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at dm6.a(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:254)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at u88.run(r8-map-id-3a8d615f8f5c02eb2bb361a04e0934dee312aae3d1aa905a5d807fa61c21bd15:29)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at android.os.Handler.handleCallback(Handler.java:873)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at android.os.Handler.dispatchMessage(Handler.java:99)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at android.os.Looper.loop(Looper.java:193)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at android.app.ActivityThread.main(ActivityThread.java:6863)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at java.lang.reflect.Method.invoke(Native Method)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:537)
10-13 08:45:33.306 21009 21009 E unknown:ReactHost: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:858)
```

### Counts and readings

- Exception blocks naming AppStateModule.onHostPause in the capture: 1
- pid before / after: 21009 / 21009 (unchanged)
- Marker line `APP: feature flags resolved` after the block: 1, at 08:45:34.702
- Exception-to-marker span: 1.397 s (the row 71 record: about 1.5 s)
- FATAL EXCEPTION lines: 0
- Alarm dumps: alarm-after-drive1.txt under sessions/71/; trigger-time movement across the
  reload is the mock's per-download re-seed (row 55's record) and not a finding
- Unrelated soft exceptions in the capture: none

One cycle, one drive, one session: this section pins the line and the span; it states no
rate. The rate is section 8's subject.

## 8. The starvation: the reload is not the modeled constant

The same session's other crossings did not reload. Recorded evidence, one session, one
build (mock 2.0.190), one device; transcribed from NOTES.md's drive table:

| Drive | Crossing | Face flipped | Exception block | Marker | Reload |
| --- | --- | --- | --- | --- | --- |
| 1 (pid 21009) | recovery ar→en (discarded, pre-baseline) | yes | yes | yes | yes |
| 1 | crossing 1 en→ar | yes | yes | yes | yes |
| 1 | crossing 2 ar→en | yes | no | no | no |
| 2 (pid 22599) | crossing 1 en→ar | yes | no | no | no |
| 3 (pid 23273) | recovery ar→en (discarded, pre-baseline) | yes | yes | yes | yes |
| 3 | crossing 1 en→ar | yes | no | no | no |

Every starved crossing carries the same silent signature: the UI locale flips within
about 0.9 s, the preference stores, and then nothing — no convergence dequeue line, no
`LANGUAGE:` warn, no `Updates state change: Restart`, no exception, no marker, no FATAL;
the app keeps ticking on the old tree in the new locale (observed past four minutes). The
drive 3 post-mortem adds the once-per-process deferred launch init (`app/index.tsx`,
1.5 s timeout, the `launchInitRan` latch) firing over four minutes after process start,
so mount and timer timing around the language commits is not what the model assumes.

What this section does not claim: a rate, a cause, or a production-build generalisation.
What it changes: nothing in section 6's verdict — the drop is ordered and log-only
whenever the reload fires, and the starved crossings log no exception at all. The
investigation lives in queue row 78 (added from this evidence, 2026-10-13); the owner
rules on its priority.
