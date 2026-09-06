# Phase 2 — Instrumentation validation (2026-09-05/06, session 3)

Builds: Release, gate ON (`EXPO_PUBLIC_PERF_MONITOR=1`), v1.18.9 + `react-native-performance@6.0.0`,
original app ids. Devices: iPhone XS (WDA externals) + OnePlus 3T (Maestro externals).
Baseline externals from `baseline/` (same code family, no optimization changes).

## What was built

- `shared/perf.ts` — env-gated monitor: `perfMark`/`perfMeasure`/`perfFlush`/`initPerfMonitor`;
  PerformanceObserver → 600-entry ring → `perf-monitor` MMKV instance (separate from app schema)
  + pino stream (`PERF_MEASURE`/`PERF_MARK` single-line JSON; info/debug).
- Marks on every baseline action path (launch, sheet present/animate/settle ×3 sheets, overlay
  open/close, pager drag/settle, toggle taps, sound select/play taps, sound dismiss commit,
  scheduling-lock enqueue/queue-wait/duration, widget push at the caller).
- Launch measures derived native↔native only (`launch_native`, `launch_js_bundle`); JS↔JS via
  marks (`js_to_content`). Native↔JS clock mixing is broken in the lib on iOS — documented below.

## Validation: in-app marks vs Phase 1 external numbers

### iOS (external re-run this session: sheets 2097 / overlay 2055 / swipes 1170 medians — matches baseline 2110/2119/1005 within noise)

| In-app measure | Value (ms) | External anchor | Verdict |
| --- | --- | --- | --- |
| `js_to_content` (JS init → home content) | **1451** | xctrace app-attributable gap 1100–1600 (1.4) | ✓ dead center |
| `sheet_settings_open` (present→settled) | 729–770 | WDA 2110 → bias-corrected ≈700–1500 | ✓ |
| `sheet_settings_open_anim` (animation only) | 678–680 | — | plausible (A12 spring) |
| `sheet_settings_close` | 676–688 | — | sane |
| `overlay_open` (JS commit: store.set→effect) | **34** | WDA 2119 → corrected ≈1300–1600 | JS is fast; the wall is render/AX visibility — Phase 3 signal |
| `overlay_close` (JS commit) | 46 | — | same |
| `pager_page` (drag→selected) | 204 median (18 runs) | WDA 1005–1170 → corrected ≈200–500 | ✓ |
| `launch_js_bundle` | 58–706 | — | indicative (variance across runs) |

### Android

| In-app measure | Value (ms) | External anchor | Verdict |
| --- | --- | --- | --- |
| cold start ThisTime (external) | 3563–3646 | baseline 3668 median | no regression from instrumentation |
| `launch_native` | 75 | — | sane |
| `launch_js_bundle` | 774 | — | sane |
| `js_to_content` | 1077 | — | decomposes cold start: 3563 ≈ 75 native + 774 bundle + ~1.1s JS mount/data + remainder process/splash |
| `sheet_settings_open` ×20 | **416 median** (p90 435) | gfxinfo 43% jank (frame budget, different metric) | credible |
| `sheet_settings_open_anim` ×20 | 250 median | — | animation ≈60% of open |
| `sheet_settings_close` ×20 | 258 median | — | sane |
| `overlay_open` ×10 / `overlay_close` ×10 | 180 / 190 | gfxinfo 70% jank | JS commit fast → jank is render-side (backlog #3 confirmed) |
| `pager_page` ×30 | 16 median | gfxinfo 38% jank | gesture pipeline snappy; jank = page render |
| `sheet_sound_open` (32-row sheet) | 834 | — | heaviest sheet |
| `sound_commit` (preference+channel+reschedule+widget) | **117** | — | DB/notification layer efficient; jank is row re-render (backlog #6 confirmed) |
| `sched_rescheduleAllNotifications` / queue_wait | 74 / 1 | — | no scheduling contention |

## Findings beyond validation (instrument > harness)

1. **iOS baseline sheet numbers were partially false-positive**: the harness's `close_sheets()`
   swipe is eaten by the settings sheet's scrollable content; "sheet open" iterations 2-10 were
   actually toggle taps inside the still-open sheet (caught by `toggle_tap` marks with
   `label:"Show arabic names"`). True sheet open ≈730-770ms (in-app), not ~2.1s. Overlay
   iterations similarly mis-tapped during its first suite run (pager marks appeared instead) —
   the manual re-run captured overlay marks cleanly.
2. **Overlay JS commit is 34ms (iOS) / 180ms (Android)** — the perceived ~2s is tap delivery +
   overlay subtree first-render + AX visibility. Phase 3 backlog #3 (unmount closed overlay
   subtree) targets exactly the render side.
3. Sound-sheet slowness is NOT the commit (117ms) — it's the per-status-tick row re-renders
   (backlog #6).

## Library gotchas (react-native-performance@6.0.0)

- iOS native marks live on a **skewed timeline** (epoch-converted CACurrentMediaTime):
  native↔JS measures produce garbage (observed −189592208ms). Only derive native↔native.
- Ring `ts` is **recording wall-clock ±observer-batch lag (~1.5s)**, not exact event time —
  durations are exact; use syslog/logcat line timestamps for wall-clock ordering.
- `performance.measure(name, {start})` **throws** on missing marks — perf.ts guards via
  `getEntriesByName` first.
- Requires the module's default export (`require(...).default`), not a named `performance`.
- Observer `buffered: true` replays pre-init native launch marks — init can stay where it is.

## Harness notes (Phase 4 must fix)

- iOS `close_sheets()` swipe fails on scrollable sheets — swipe from the handle must drag
  further/faster, or close via hardware-equivalent (accessibility) route.
- Android `logcat -d` post-hoc dumps lose entries to TICK debug flood (buffer rotation) —
  stream `logcat -v threadtime` to a file during flows (fixed in this session's runs).
- WDA overlay-suite taps at fixed y=328 can land between rows after layout shifts — verify
  with mark presence, not just AX count.

## Zero-cost gate OFF

- Static: gate is a build-time-inlined constant; disabled path never `require`s the library,
  never creates MMKV, all exports early-return (hermesc folds). Covered by jest (918 original
  + 7 perf tests) with the gate unset.
- Native: the autolinked RNPerformanceManager module registers in OFF builds but is never
  activated (listeners attach only on module import) — near-zero, documented.
- Empirical: OFF-build Android cold starts match baseline (below).
