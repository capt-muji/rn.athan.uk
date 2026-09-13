# e2e — Performance & Behavior Harness

Physical-device harness for the performance campaign (see
`ai/features/performance/` for methodology and history). Target device:
**OnePlus 3T** (`8f7ada76`) — the floor device; smooth there means smooth
everywhere.

## Layout

- `flows/` — Maestro flows (tag `baseline`): smoke, overlay, sheets, swipes,
  toggles, sounds. Tap points are OnePlus 3T coordinates (1080×1920).
- `scripts/baseline-compare.sh` — run a flow while streaming `ReactNativeJS`
  perf marks; medians diffed against `baselines/android-3t.json`.
- `scripts/frame-audit.sh` — FPS + visual-quality audit of one animation:
  records → per-frame pts (compositor truth) → contact sheet → a vision
  prompt for an image-capable subagent. `FRAME_AUDIT=sf` falls back to
  SurfaceFlinger compositor cadence when video capture is wedged.
- `scripts/device-checks.sh` (`yarn check:device`) — on-demand audit of what the
  phone actually has: build identity, permissions, notification channels and
  every alarm the app has armed (`scripts/device_checks.py` parses
  `dumpsys alarm`). FAILS on nothing armed, a missing channel, or a trigger that
  is not a prayer time. Pass a JSON list of `"YYYY-MM-DD HH:MM"` trigger times
  as the third argument to check the times themselves; no API key is read,
  passed or stored. Alarm TIMES only mean anything on a production build — local
  builds run the mock API, whose prayers sit either side of launch.
- `baselines/` — measured medians + animation-floor verdicts per device.

## Build (gate-ON Release, REQUIRED before measuring)

```sh
rm -rf node_modules/.cache/metro                       # Metro's cache is ENV-BLIND
rm -rf android/app/build/generated/assets/react/release/index.android.bundle
EXPO_PUBLIC_PERF_MONITOR=1 npx expo run:android --variant release
```

Discard the first post-install launch (`am start -W` ThisTime is dexopt
inflated). Verify marks flow before driving anything:

```sh
adb -s 8f7ada76 logcat -s ReactNativeJS -v threadtime   # PERF_MEASURE lines must appear
```

## Run

```sh
export PATH="$HOME/.maestro/bin:$PATH"
yarn check:device                                        # what the phone has armed
yarn check:device 8f7ada76 com.mugtaba.athan expected-times.json   # check the times too
e2e/scripts/baseline-compare.sh e2e/flows/overlay-x10.yaml
e2e/scripts/frame-audit.sh overlay-open 540 974 3        # settle 12s, tap, audit
FRAME_AUDIT=sf e2e/scripts/frame-audit.sh sheet-open 540 1730 3   # cadence-only
```

## The 30fps floor

Big animations (overlay, sheets, cascade, segmented selection,
prayer-transition UI) must hold frame gaps ≤33ms with no multi-frame
freezes. 60fps is a bonus, never required. Per-second countdown text is
exempt (tiny). Scripts measure (pts gaps, PIL bboxes); the vision subagent
interprets (what the frame actually looks like) — always delegate frame
verification, never infer visuals from pixels alone.

## Gotchas (each cost real time — read twice)

- **Metro env-blindness**: changing ANY `EXPO_PUBLIC_*` variable — including
  `EXPO_PUBLIC_ENV` — requires clearing the metro cache AND deleting the
  generated Android bundle or the stale transform ships; gradle marks the
  bundle task UP-TO-DATE on env-only changes, because the environment is not a
  declared input to `createBundleReleaseJsAndAssets`. **Restarting the gradle
  daemon is NOT enough**: the fresh daemon holds the new env, but the task
  still sees unchanged file inputs and skips. Remedy:
  `find android/app/build -name index.android.bundle -delete`, then
  `assembleRelease`. Always verify before trusting the APK — compare
  `unzip -p app-release.apk assets/index.android.bundle | md5` against the
  previous build, and treat an identical hash as a recycled bundle. Note that
  `assets/app.config` (the version `Constants.expoConfig` reads) IS regenerated
  on its own, so a correct version in the APK proves nothing about the bundle:
  a build can report the new version while still running the old JavaScript.
- **Dev-env confound**: local builds run the mock API — `api/client.ts` returns
  `MOCK_DATA_SIMPLE` whenever the env is neither `prod` nor `preview`, so every
  launch does a full mock refresh (~175ms Android). Baseline and iterations
  share it; never compare absolute startup numbers to production. It also
  **writes mock times into the device's MMKV cache**, so any device check about
  prayer times, notifications or armed alarm times is void until that build
  refetches. Since the store is namespaced by the same predicate that serves
  the mock (`stores/database.ts`, AUDIT #25), the fabricated rows stay in
  `athan-storage-dev` and a prod or preview build installed over the top never
  reads them — but they persist for the next local build, so a stale mock day
  is still a live confound within dev. The tell is `fajr: addMinutes(-3)` in
  `mocks/simple.ts`: TODAY's six rows are launch-relative, so a "Fajr" three
  minutes before the current clock is the mock, not a bug. Logging is disabled
  in prod and preview (`shared/logger.ts`), so the only build that gives both
  real data and logs is none of them — on a real-data device run, the alarm
  dump is the evidence and an empty logcat proves nothing either way.
- **`--verbose` prints no test names here**: `yarn jest <file> --verbose` emitted
  only the summary (14 lines, no per-test output) with no `verbose`/`silent`/
  `reporters` setting in `jest.config.js` to explain it. Cause unestablished —
  what matters is that a passing COUNT is then the only signal, and "the total
  went up by the three I think I added" is not evidence those three ran. To
  confirm a specific test executed, filter by name:
  `yarn jest <file> -t "<phrase>"` and read the `N passed, M skipped` line; a
  name that does not exist reports 0 matched instead of quietly passing.
- **Android 9 AX trees are STALE** in `uiautomator dump`. Read live text with
  Maestro's `hierarchy`, which reads the live tree, or with screencap pixel
  diffs, never AX dumps. Button coordinates from a fresh dump are fine. On
  the 3T a dump once returned the tree of a package that had since been
  uninstalled (`com.mugtaba.athan.fleettest`).
- **`am start -W` after install is dexopt-inflated** (~4.9s) — discard.
- **`dumpsys cpuinfo` is lifetime-cumulative, and `top -n 5 -d 5 -b` printed
  five identical snapshots on the 3T** — measure idle with
  `scripts/idle-cpu.sh` (per-thread `/proc` deltas over 60s).
- **Idle must be measured past the mock's compressed window**: today's six
  mock prayers sit at launch −3…+3 min, so sample ≥4.5 min after a cold launch
  (idle-cpu.sh does). At night (00:00–06:00) the mock's Isha becomes a
  post-midnight Isha and the day-roll fires early — test day-rolls in daytime.
- **`expo run:android --device` takes a device NAME, not an adb serial**: with
  a serial it prebuilds, then fails — and a `| tail` pipe reports exit 0.
  Build with `./gradlew assembleRelease` + `adb install -r`, and check
  `dumpsys package com.mugtaba.athan | grep versionName` before measuring.
- **What's New appears on the first launch after any upgrade** (including
  reinstalling a newer build after bisecting an older one) and marks itself
  shown the moment it appears — do one throwaway launch after each install.
- **`overlay_open` mark semantics changed in s9** (useLayoutEffect instrument):
  JS works ~44-78ms then waits on a synchronous UI-thread mount, so the band
  is ~180-240ms; the 80ms baseline predates it. Compare builds with frame
  evidence, never this mark (progress.md, "MARKS REGRESSION INVESTIGATION").
- **zsh does not word-split** `D="adb -s X"; $D shell …` ("command not found")
  — use a function, and have scripts check every output file is non-empty.
- **Force-stop before every scripted interaction** (sheet/scroll state).
- **BACK exits the app when no sheet is open** — flows end with exactly one
  BACK per open sheet.
- **Aborted toggle flows double-flip prefs** — verify final state from pixels.
- **screenrecord pace**: ≥1.2s between recorded transitions; the SD820
  encoder drops frames when animations arrive back-to-back. Extract frames
  with `-fps_mode passthrough` (output option) or VFR frames get duplicated.
- **Video capture wedge**: if screenrecord emits ~1 frame despite display
  changes (and scrcpy freezes early), the virtual-display pipeline is
  wedged — REBOOT the device to restore; `FRAME_AUDIT=sf` still works.
- **Stale Android Studio screen-sharing agents** (`app_process
  com.android.tools.screensharing`) burn 100% CPU, heat the device and skew
  measurements — check `top` for them before measuring.
- **SF `--latency` layer names rotate** per process relaunch — dump both
  `com.mugtaba.athan/com.mugtaba.athan.MainActivity#0` and the
  hash-prefixed variant from `dumpsys SurfaceFlinger --list`.
- **iOS**: Maestro does not support physical devices. WDA (appium fork) +
  `pymobiledevice3 syslog live` (tag `Athan{React}`); fast 140ms flicks
  dismiss scrollable sheets. Per campaign directive, iOS is verified by
  owner eyeball — the 3T is the measurement device.
