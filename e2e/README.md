# e2e — Performance & Behavior Harness

Physical-device harness for the performance campaign (see
`ai/features/performance/` for methodology and history). Target device:
**OnePlus 3T** (`3T_SERIAL`) — the floor device; smooth there means smooth
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
adb -s 3T_SERIAL logcat -s ReactNativeJS -v threadtime   # PERF_MEASURE lines must appear
```

## Run

```sh
export PATH="$HOME/.maestro/bin:$PATH"
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

- **Metro env-blindness**: toggling `EXPO_PUBLIC_PERF_MONITOR` requires
  clearing the metro cache AND deleting the generated Android bundle or the
  stale transform ships; gradle marks the bundle task UP-TO-DATE on env-only
  changes.
- **Dev-env confound**: local builds run the mock API — every launch does a
  full mock refresh (~175ms Android). Baseline and iterations share it;
  never compare absolute startup numbers to production.
- **Android 9 AX trees are STALE** in `uiautomator dump` — assert live text
  via screencap pixel diffs, not AX dumps. Button coordinates from a fresh
  dump are fine.
- **`am start -W` after install is dexopt-inflated** (~4.9s) — discard.
- **`dumpsys cpuinfo` is lifetime-cumulative** — use `top -n 5 -d 5` medians.
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
