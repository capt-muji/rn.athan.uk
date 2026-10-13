# Ticket 71 findings: the AppState soft exception on the relaunch teardown

Every load-bearing claim cites file:line, read on this run's tree (uat at or above the Planned
at 2.0.187; RN 0.88.0-rc.3 and expo-updates as pinned in node_modules).

## 1. The three AppState listeners and the reload site

| Listener | Where | Behaviour when the reload tears the context down |
| --- | --- | --- |
| The launch listener | `device/listeners.ts:79`, registered once per process behind the `listenersInitialized` guard (:17, :24-25), seeded from `AppState.currentState` (:27) | Downstream of the emit. The dying tree never receives the dropped background event (the emit is dropped before dispatch, `ReactHostImpl.kt:916-926`); the relaunched tree re-registers fresh and re-seeds from the live state (`app/index.tsx:108`, `device/listeners.ts:27`) |
| The perf flush | `shared/perf.ts:205`, live only behind the perf monitor gate | Loses one background flush into a tree that dies about 1.5 s later; dev-gated, no production path |
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
   row 68 record read.

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
> loses one flush into a tree that dies about 1.5 s later, behind a dev gate; the permission
> watcher (`hooks/useNotification.ts:37`) removes itself and is unrelated to reload timing.
> The post-reload convergence stamp-bails (`stores/language.ts:38`), so no re-arm work is
> lost.

## 5. The alternatives, rejected

1. Unsubscribe the app's AppState listener(s) before `reloadAsync`. Rejected: downstream of the
   emit, no effect on the raise (section 4, "Why the obvious fix is wrong").
2. Patch React Native core to guard or silence the raise (patch-package shape). Rejected:
   `patches/` today carries only expo-background-task, expo-location and expo-widgets; an RN
   core patch is a new surface carried on every re-pin, for zero behaviour change. The row 51
   discipline is the repo's settled answer for RN and expo corrections: file them upstream; a
   local patch dies at the next re-pin. If the owner ever wants the line gone, the lever is an
   upstream report carrying the traced chain of section 4.
3. Suppress at the logger by wiring a `ReactSoftExceptionListener`. Rejected: a native listener
   needs a native module or a patch, the same rejection as alternative 2 with more machinery.
4. Stop reloading (drop the D59 relaunch). Rejected: D59 is the owner's landed ruling and row
   66's option 1 keeps it; the exception is a recorded cost of that ruling, not a new defect.

## 6. The verdict

> No. The AppState listener must not pause before the reload, and no code change ships: the
> exception is raised inside React's own reload sequence, every hop after the `reloadAsync`
> call is native, the repo's listeners sit downstream of the emitting module and cannot
> suppress it, and the dropped event has no consumer that needs it (sections 1 to 4). One
> non-fatal log line per RTL boundary crossing is the whole cost; silencing it from inside
> this repo means patching RN core, which section 5 rejects, so the fix-if-so branch stays
> untaken.
