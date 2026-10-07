# Performance: where each thing lives, and what is recorded only here

The performance campaign of September 2026 is closed. Its method, rules and numbers live in the files
below. This file adds the findings that no other file holds.

## Where each thing lives

| Need | Read |
| --- | --- |
| Devices, protocol, how to measure | `e2e/README.md` (the performance runbook was folded into it, 2026-10-07) |
| The harness, the build steps and every measuring gotcha | `e2e/README.md` |
| Baseline medians and the 30fps floor results a regression check compares against | `e2e/baselines/android-3t.json` |
| The design rules that came out of it | `ai/AGENTS.md`, "Performance Design Rules" |
| The decisions | `ai/adr/013/ADR.md`, `ai/adr/014/ADR.md`, `ai/adr/015/ADR.md` |
| The instrumentation | `shared/perf.ts`, gated by `EXPO_PUBLIC_PERF_MONITOR=1` |

## #14. The idle Choreographer loop

The baseline file cites this as "#14". An idle React Native app on Android runs about 60
`Choreographer#doFrame` calls a second in the foreground and renders zero frames.

| Fact | Detail |
| --- | --- |
| Cause | Four React Native frame callbacks re-arm themselves every frame with no pending-work check: `JavaTimerManager`, `FabricEventDispatcher`, `NativeAnimatedModule`, `FabricUIManager` (read in 0.86.3) |
| Not app code | It reproduces on a stock React Native template and with a bare `View` as the whole app. A raw Java activity gets 0 calls |
| Cost at idle | About 22.5% of a core on the OnePlus 3T (Snapdragon 820), 9.3% on a OnePlus 5T, 3.5 to 6.8% on an Oppo Find X8 |
| iOS | Not affected. The classes are Android only |
| Upstream | Issue react/react-native#58367. Four pull requests, one per callback: #58375 timers, #58376 event dispatch, #58377 native animated, #58378 mount items. Each sits behind a `disableIdle…FrameCallbackRearm` flag that defaults off |
| Upstream state when last read, 2026-09-07 | All open and awaiting maintainer review. A maintainer asked about prior art and the C++ animation backend, and both were answered |
| With all four flags on, 3T | Event dispatch, mount items and native animated go quiet at idle. Timers stay armed at about 40 a second, because the countdown ticker keeps the timer queue non-empty. Zero idle frames is not reachable for this app |
| Reanimated | Its worklet run loop uses the same `NATIVE_ANIMATED_MODULE` callback slot and stays armed, at about 12 a second in the background too. Attribute a callback by its class name, never by its type |

Measure it after 40 seconds of settling:

```bash
adb shell atrace -t 10 -b 32768 view input -z -o /data/local/tmp/idle.atrace.gz
adb shell dumpsys gfxinfo <package> | grep "Total frames rendered"
```

Count `Choreographer#doFrame` in the decoded trace. About 600 in 10 seconds with 0 frames rendered is
the loop.

Rules in force:

- The re-plan the owner accepted on 2026-09-11 says to spend no session on this loop or on polling
  these threads.
- Close none of the threads unless a maintainer declines the work.
- Re-measure the loop when React Native is upgraded.

## Marks regression investigation

The baseline file cites this by name. `overlay_open` and `overlay_close` changed meaning when the
instrument moved to a commit-time `useLayoutEffect`. The mark then read about 200 to 265 ms where it
had read 80 to 190. Five single-variable builds ruled out every code change. The JS thread works for
44 to 78 ms and then waits on a synchronous UI-thread mount, and the frames were unchanged. Compare
builds by frames, never by this mark.

## Cold start on the 3T

| Fact | Detail |
| --- | --- |
| Floor | About 1.8 s passes before any JS runs: fork, activity and bundle read. The best cold `am start -W` is 2.6 to 2.8 s. Under 1 s is not reachable on this phone |
| Module evaluation is not ours to trim | Of 2,375 modules, React Native's view configs take 1,643 ms (`getNativeComponentAttributes` 628, `UIManager` 624, `BridgelessUIManager` 391) and the expo-router tree 1,107 ms. All app code is negligible. The owner dropped an upstream request for lazy view configs |
| Bands the baseline file lacks | At 1.21.1, after the launch chrome was deferred: cold `am start -W` 3069 to 3161 ms and `js_to_content` 673 to 710 ms in a dev-env build. The baseline file's `js_to_content` of 1076 predates that change |

## Two harness facts written nowhere else

- Pull a `screenrecord` file only after its time limit has elapsed. Before that it has no moov atom.
- To split tap latency, inject taps with raw kernel `sendevent` on the touchscreen device. From
  finger-up to the JS handler is about 130 ms on the 3T, which is the phone's floor.
