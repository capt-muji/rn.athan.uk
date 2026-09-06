# Baseline Report — v1.18.9 Release, 2026-09-05 (session 2)

Devices: iPhone XS (A12, iOS 18.7.10) + OnePlus 3T (SD820, Android 9), clean installs,
physical, plugged in. All numbers: BEFORE any optimization change.

## Headlines (ranked by severity)

| # | Finding | Numbers | Backlog link |
| --- | --- | --- | --- |
| 1 | **Android idle CPU 49–90%** — half a core burned doing nothing | dumpsys 49%, top 90.3% | #4 ticks, #7 pino |
| 2 | **Cold start fails <1s on both platforms** | Android 3668ms (am start ThisTime); iOS 2693ms WDA content (623–796ms system floor, rest = JS mount/data render ≈1.1–1.6s) | #1 startup |
| 3 | **Jank everywhere on Android** — every interaction suite >24% janky | overlay 69.9%, sounds 66.4% (spam: 89.3%), sheets 43.1%, swipes 37.6%, toggles 24.4% | #2 #3 #5 #6 |
| 4 | **iOS sheet/overlay open ≈1.3–1.6s bias-corrected** | WDA 2110/2119ms medians (−~550ms tap RTT −poll bias) | #1 #2 |
| 5 | **iOS toggle/sound spam doubles main-thread AX latency** | /source 1000ms idle → 2000ms+ | #6 #9 |
| 6 | No ANRs, no input loss, no freezes anywhere (both platforms, all spam) | 0 across all suites | — (bar held) |

## Warm/relaunch state (healthy — do not regress)

- Android warm 83ms / bg-relaunch 91ms (activity resume path is excellent).
- iOS warm/bg-to-content ~1.2s WDA-measured (includes harness bias; xctrace cross-check
  pending — likely shares root cause with headline #4).

## Where the time goes (profiles)

- iOS toggle spam: Hermes interpretFunction >> RN shadow-tree slicing >> Yoga layout.
  → Each control tap triggers whole-tree re-render (always-mounted overlay subtree
  amplifies) + heavy JS (jotai cascade, reschedule, widget sync).
- iOS launch: system floor 0.6–0.8s; app gap to content ≈1.1–1.6s (JS bundle exec + mount
  + first data render).
- Android cold start: only 19 frames rendered during 3.5s — pre-render stall dominates.

## Files

- `1.1-launch-timings.md` — start matrix ×10/device
- `1.2-interactions-android.md` — gfxinfo per suite
- `1.2-interactions-ios.md` — WDA latencies per suite
- `1.3-spam-blocked.md` — spam + blocked-time
- `1.4-profiles.md` — xctrace launch/profile + Android idle CPU
- `1.5-behavior.md` — jest 918 green + live assertions + quirks
- `ios-home-ax.xml` — iOS home AX snapshot

## Harness (reusable; details in files above)

- Android: Maestro CLI (MCP driver dies on long sessions — use CLI), raw adb input for
  true spam, gfxinfo reset/dump, am start -W.
- iOS: WDA (appium fork build in `/var/folders/.../T/opencode/WebDriverAgent`, held by
  detached `xcodebuild test`, `usbmux forward 8100`), python harnesses
  (`ios-launch-timing.py`, `ios-interactions.py`, `ios-spam.py`), xctrace App Launch /
  Time Profiler.

## Immediate iteration priorities (re-prioritized by measurement)

1. **Startup path** (#1): defer non-critical init past first content frame — both platforms.
2. **Android idle CPU** (#4 + #7): consolidate tick timers, gate pino hot-path logs.
3. **Sound sheet rows** (#6): worst jank on both platforms (89% Android spam; 2× AX iOS).
4. **Overlay subtree** (#3): unmount when closed — 70% jank Android + shadow-tree amplification.
5. **Sheet dismiss burst** (#2): defer reschedule+widget pushes past animation.
