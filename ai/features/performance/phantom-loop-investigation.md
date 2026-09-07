# The Phantom 60fps Idle Choreographer Loop — Full Investigation (RN 0.86.3 Android)

> Session 14, Phase A item 1. AI-authored investigation dossier. Evidence directory:
> `/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/perf21/fleet/` (traces decodable by
> `parse_doFrame.py`; attribution log at `findx8/idle-attribution.log`; patched sources at
> `patch/`). PR-ready per the owner's protocol: PR is the LAST resort; this file exists so a PR
> can be filed easily, replicated, debugged and fixed by anyone.

## TL;DR

Every React Native 0.86.3 Android app runs the main-thread Choreographer at ~60 doFrames/s
**while idle in the foreground, doing zero work and rendering zero frames**, on every Android
tier we tested (API 28 → 36). Four RN framework frame-callbacks re-arm themselves
unconditionally every frame, forever, with no pending-work check. Patching/gating them makes an
idle RN app **completely frame-silent** (identical to a raw Java app) with the app still
functional.

## The issue — why it matters

- **Wasted CPU / battery**: idle-foreground RN apps burn main-thread cycles every vsync. Measured
  process CPU at idle: ~22.5% on a Snapdragon 820 (2016), ~9.3% on SD835 (2017), ~3.5–6.8% on a
  Dimensity 9400 (2025 flagship). A fix restores ~0%.
- **No visual function**: in every measurement `dumpsys gfxinfo` reported **"Total frames
  rendered: 0"** over the same 10s windows the loop ran — the loop produces no frames, no layout,
  no draw. It is pure overhead.
- **Foreground-only**: backgrounded (process alive, HOME pressed) the loop stops (0 doFrames) —
  Android suspends vsync delivery. The waste applies whenever an RN screen is simply VISIBLE —
  reading, idling, screen-on standby on a stationary app.
- **Everyone is affected**: reproduced identically in a stock `react-native@0.86.3` template app
  and a stock Expo SDK 57 blank app. It is not app code, not a third-party dependency.
- **Contention**: on low-end hardware the loop competes with real work (the OnePlus 3T's 15.9ms
  worst-case doFrames at idle).

## Device matrix (which devices are affected)

Three tiers, all affected identically in behavior; cost scales inversely with SoC speed:

| Device | SoC / API | doFrames per 10s idle | median / p90 / max doFrame | App CPU idle | Frames rendered |
| --- | --- | --- | --- | --- | --- |
| OnePlus 3T | SD820 / 28 (Android 9) | 597–598 | 1.95 / 2.81 / 15.86 ms | ~22.5% | 0 |
| OnePlus 5T | SD835 / 29 (Android 10) | 599–601 | 0.99–1.82 / 2.11 / 14.67 ms | ~9.3% | 0 |
| OPPO Find X8 | Dimensity 9400 / 36 (Android 16) | 587–601 | 0.67–0.86 / 0.94–1.21 / 2.83 ms | ~3.3–6.8% | 0 |

- The loop is vsync-locked at ~60/s even on the Find X8's 120Hz panel (Choreographer cadence, not
  refresh-rate scaled).
- iOS: **structurally unaffected** — `Choreographer` is an Android framework class; the four
  pump classes are Android-only. (iOS idles at ≈0% per the campaign's earlier time-sampling.)
- `doframeadd` trace tag seen on API 28/29 (never in RN source or any shipped .so/.dex string) is
  absent on API 36 while the loop persists → legacy-Android instrumentation, a red herring.

## Reproduction tiers (owner protocol: raw SDK → naked app → naked+package → full app)

| Tier | App | Extra deps | Loops? |
| --- | --- | --- | --- |
| T1 | Hand-written raw Java `Activity` + `setContentView(new View(this))`, zero dependencies, no AndroidX/Kotlin/RN (6KB APK) | none | **NO — 0 doFrames, 0 frames** |
| T2a | `npx create-expo-app --template blank` (Expo 57.0.20, RN 0.86.3, react 19.2.3) | expo, expo-status-bar | **YES** (601/10s, median 0.70ms) |
| T2b | `npx @react-native-community/cli init --version 0.86.3` stock template | react-native, new-app-screen, safe-area-context | **YES** (597–601/10s on all 3 devices) |
| T3' | Our app with the ENTIRE tree replaced by a literal black `<View>` (all deps still linked) | full dependency set | **YES** (601/10s) |
| T3 | Our full app (`com.mugtaba.athan.fleettest`, Release) | everything | **YES** (see matrix) |

Conclusion: every third-party package is exonerated — **the carrier is `react-native` itself**;
Expo adds nothing. T1 proves the OS floor is clean (an idle native app receives no Choreographer
callbacks at all).

### Exact replication steps (any of the looping tiers)

```sh
# build + install the stock RN template
npx @react-native-community/cli@latest init rn086blank --version 0.86.3 --skip-git-init
cd rn086blank/android && ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell am start -W -n com.rn086blank/com.rn086blank.MainActivity
# settle ≥40s (boot timers must finish), then measure 10s idle:
adb shell atrace -t 10 -b 32768 view input -z -o /data/local/tmp/idle.atrace.gz
adb pull /data/local/tmp/idle.attrace.gz .   # (decode: gunzip, or strip "TRACE:" hdr + zlib)
grep -c "Choreographer#doFrame" idle.text    # ≈ 600 (60/s), all ~0.2–2ms "animation"-stage only
adb shell dumpsys gfxinfo com.rn086blank reset && sleep 10 \
  && adb shell dumpsys gfxinfo com.rn086blank | grep "Total frames rendered"   # 0
```

## Root cause (source-verified + runtime-attributed)

RN 0.86.3 keeps four frame callbacks queued on `ReactChoreographer` (which posts onto the raw
`android.view.Choreographer` CALLBACK_ANIMATION stage) that **re-arm themselves unconditionally
in their own doFrame**, armed initially at host resume, with no pending-work check:

| # | Class | Re-arm site (0.86.3) | Notes |
| --- | --- | --- | --- |
| 1 | `JavaTimerManager$TimerFrameCallback` | `JavaTimerManager.kt:317` — `postFrameCallback(..., this)` at end of every `doFrame` | JS timers engine; runs forever even with an empty timer queue. Only stops on host pause/destroy. |
| 2 | `FabricEventDispatcher$ScheduleDispatchFrameCallback` | `FabricEventDispatcher.kt:153` — `doFrame` calls `dispatchBatchedEvents()` (a re-post) unless stopped | Armed at EVERY `onHostResume` + every event; events are actually dispatched synchronously in `dispatchEvent` — this callback only notifies `BatchEventDispatchedListener`s. |
| 3 | `NativeAnimatedModule$animatedFrameCallback$1` | `NativeAnimatedModule.kt:353` — `enqueueFrameCallback()` unconditionally at end of `doFrameGuarded` | The `hasActiveAnimations()` guard (line ~347) protects the WORK, not the RE-ARM. Zero animations in the app and it still runs 60/s. |
| 4 | `FabricUIManager$DispatchUIFrameCallback` | `FabricUIManager.java:1631` — `finally { schedule(); }` | Mount-item dispatch; `dispatchPreMountItems`/`tryDispatchMountItems` are no-ops when queues are empty, but the finally re-schedules forever. |

**Runtime attribution method (the "who posts at 60Hz" log)**: ReactChoreographer was replaced
with a Java port logging POST/RUN/REMOVE with callback class names (tag `PhantomChoreographer`).
A 10s idle logcat capture on the stock template (zero interactions, ~61 frames):

```
604 RUN  type=NATIVE_ANIMATED_MODULE cb=com.facebook.react.animated.NativeAnimatedModule$animatedFrameCallback$1
604 RUN  type=DISPATCH_UI            cb=com.facebook.react.fabric.FabricUIManager$DispatchUIFrameCallback
603 POST type=NATIVE_ANIMATED_MODULE cb=com.facebook.react.animated.NativeAnimatedModule$animatedFrameCallback$1
603 POST type=DISPATCH_UI            cb=com.facebook.react.fabric.FabricUIManager$DispatchUIFrameCallback
(0 posts from JavaTimerManager / FabricEventDispatcher — those two were already demand-gated by
our patches in that build; on stock 0.86.3 they cycle the same way, source-verified)
```

## Patch validation (owner protocol: patch the framework; if the loop dies, the cause is proven)

All experiments on the stock RN template (Find X8), by substituting a patched
`react-android-0.86.3` AAR via a local maven repo + dependency substitution
(`patch/` has the exact sources):

| Build | Change | Result |
| --- | --- | --- |
| P1 | `JavaTimerManager` port: disarm when timer queue empty, re-arm from `createTimer` | App boots, timers work. Loop persists (other pumps). Idle logs: 0 timer-callback posts. |
| P2 | + `FabricEventDispatcher` port: one-shot callback per schedule request | App boots. Loop persists. Idle logs: 0 dispatcher-callback posts. |
| P3 | + `ReactChoreographer` port with logging + 30s-uptime kill-switch that drops NATIVE_ANIMATED_MODULE + DISPATCH_UI posts | **Loop completely dead: 0 doFrames in 10s, app alive and foreground.** Exactly 2 SUPPRESSED posts total — each pump was keeping ONLY itself alive, so one dropped re-post collapses it permanently. |

**After-state (what a fix delivers)**: idle RN app = 0 doFrames, 0 frames rendered, ~0% CPU —
byte-for-byte the T1 raw-Java floor. Before-state: ~600 doFrames/10s at 0.2–2ms each.

## Proposed fix (for an eventual upstream PR — NOT filed)

Four small, independently-shippable patches, each turning an unconditional re-arm into a
demand-driven one (full patched sources in `patch/*.java`):

1. `JavaTimerManager.TimerFrameCallback.doFrame`: re-post only `if (!timers.isEmpty())`;
   re-arm from `createTimer` (any thread — ReactChoreographer is thread-safe).
2. `FabricEventDispatcher.ScheduleDispatchFrameCallback.doFrame`: never re-post; reset
   `isFrameCallbackDispatchScheduled` and finish (each schedule request = one frame, as events
   are dispatched synchronously at enqueue time).
3. `NativeAnimatedModule.animatedFrameCallback.doFrameGuarded`: `enqueueFrameCallback()` only
   when `nodesManager.hasActiveAnimations()` (or pending event work); ensure every
   animation/event-registration path calls `enqueueFrameCallback()` as its re-arm trigger.
4. `FabricUIManager.DispatchUIFrameCallback.doFrameGuarded`: drop `finally { schedule(); }`;
   re-schedule only when the mount-item dispatcher still has items (or rely on the existing
   external `schedule()` call sites that fire when C++ posts mount items).

**Risk / open questions for maintainers**: completeness of the re-arm triggers (an animation or
mount batch that arrives while disarmed must reliably re-post — sources suggest every
registration/posting path already calls the enqueue/schedule methods, but this needs maintainer
review). **Expected win**: idle-foreground CPU ~0% on all Android tiers; restored deep idle;
no behavior change with pending work (all four keep their per-frame dispatch while work exists).

## Interaction with tracked upstream PRs

- **expo/expo#49244 (expo-widgets stable view identity)**: unrelated mechanism (widget-extension
  SwiftUI teardown); no overlap. Our app's idle CPU on Android is dominated by THIS loop
  (~19–31% campaign band included it), so this fix would compound with any widget fixes.
- **Android-notifications expo PR (tracked)**: unrelated (notification delivery semantics).
- Any future RN core PR: the four classes above are the complete Android idle-pump set for
  0.86.3 bridgeless.

## Harness notes (full debuggability)

- atrace decode: API ≤29 output is gzip text (plus API 36 = `"TRACE:"` header + raw zlib → the
  fleet `decode` python snippet); parser `parse_doFrame.py` counts/durations per pid.
- API 36 exposes `DoFrameCB-IsEmptyDoFrame-<pid>` counters after each doFrame — useful live signal.
- `ReactChoreographer` attribution log (tag `PhantomChoreographer`) is the fastest triage on any
  device: `adb logcat -s PhantomChoreographer` — POST/RUN lines name the pump directly.
- OPPO ColorOS gotchas hit during this work: rapid shell-launched app switches get dropped
  (verify `mCurrentFocus`); a sideloaded debug app (bareloop) got quarantined mid-session
  ("No activities found", DELETE_FAILED_INTERNAL_ERROR) — measure promptly after install.
- Gradle: replacing an artifact inside `~/.gradle/caches/modules-2` does NOT reliably invalidate
  transforms — use a local maven repo + `resolutionStrategy.dependencySubstitution` (strict
  RNGP version pins ignore `force`; substitution does not).
- Kotlin interop when hand-porting: keep the `Companion` class + `Companion` field
  (`NoSuchFieldError` otherwise), and internal members are mangled `$ReactAndroid_release` in
  release AARs.
