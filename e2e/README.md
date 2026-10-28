# e2e: Performance & Behavior Harness

Physical-device harness for the performance campaign (methodology and history:
`ai/plans/README.md` rows 1-11. The campaign folders left the repository in the
2026-10-07 and 2026-10-08 clean-ups). Target device:
**OnePlus 3T** (`3T_SERIAL`), the floor device. Smooth there means smooth
everywhere.

## Layout

- `flows/`: Maestro flows (tag `baseline`): smoke, overlay, sheets, swipes,
  toggles, sounds, language-switch (Settings > Language > العربية, then back
  to English). Tap points are OnePlus 3T coordinates (1080×1920).
- `scripts/baseline-compare.sh`: run a flow while streaming `ReactNativeJS`
  perf marks. Medians diffed against `baselines/android-3t.json`.
- `scripts/frame-audit.sh`: dual FPS audit of one animation. One tap, two
  reads in one evidence dir: the screenrecord video (the ENCODER's word —
  per-frame pts, contact sheet, vision prompt) and SurfaceFlinger's present
  timestamps for the app's layer (the COMPOSITOR's word, layer resolved from
  `dumpsys SurfaceFlinger --list`). The gap lists print side by side with a
  separation verdict: a dead zone in both is compositor truth, in video
  alone encoder loss. `PRE_TAP` opens the overlay first so a close audit
  records a real closing tap (`PRE_TAP_WAIT`, default 1s, mock-safe).
  `FRAME_AUDIT=video` keeps the video-only path; `FRAME_AUDIT=sf` is the
  recorder-free floor witness (D16): the tap is stamped and anchored on the
  SF clock, the layer resolved from `--list`, and the entrance window
  bounded [tap-50ms, tap+ENTRANCE_MS] (default 1000). The PRINTED
  PRESENT-GAP LIST inside that window is the verdict of record, read
  against the 33ms floor — gaps over 100ms inside the window are floor
  failures, never "freeze or idle"; the PASS line only summarizes the list.
  It is also the only read while video capture is wedged.
- `scripts/device-checks.sh` (`yarn check:device`): on-demand audit of what the
  phone has: build identity, permissions, notification channels and
  every alarm the app has armed (`scripts/device_checks.py` parses
  `dumpsys alarm`). FAILS on nothing armed, a missing channel, or a trigger that
  is not a prayer time. Pass a JSON list of `"YYYY-MM-DD HH:MM"` trigger times
  as the third argument to check the times themselves. No API key is read,
  passed or stored. Alarm TIMES only mean anything on a production build. Local
  builds run the mock API, whose prayers sit either side of launch.
- `baselines/`: measured medians + animation-floor verdicts per device.
- `device-atlas-<model>.md`: the tap-point atlas for one device
  (`device-atlas-oneplus3t.md` is the 3T's). **Read it before screenshotting a
  phone:** launcher, widget-picker and dialog coordinates are already mapped, so
  a screen is measured once and replayed thereafter. Screenshot only what is
  missing, then write back what you learned. Every coordinate is keyed on model,
  panel, density and screen state, and is void when any part changes. Only what
  `mobile-mcp` and Maestro CANNOT reach belongs here. Their refs survive a
  layout change and coordinates do not.

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
yarn check:device                                        # what the phone has armed
yarn check:device 3T_SERIAL "$APP_ID" expected-times.json   # check the times too
e2e/scripts/baseline-compare.sh e2e/flows/overlay-x10.yaml
e2e/scripts/frame-audit.sh overlay-open 540 1012 3                      # dual: video + SF
PRE_TAP="540 1012" e2e/scripts/frame-audit.sh overlay-close 540 1100 3  # open, settle, record close
FRAME_AUDIT=video e2e/scripts/frame-audit.sh overlay-open 540 1012 3    # video only
FRAME_AUDIT=sf e2e/scripts/frame-audit.sh sheet-open 539 1833 3         # cadence-only
```

## The AVD lane: smoke only, never a witness

One emulator serves the harness: `athan-smoke-28` (android-28 google_apis
arm64-v8a, 1080x1920 at 420 density, the 3T's measured panel class). It
exists for flow smoke and disposable destructive checks: replaying
`e2e/flows/*.yaml`, install and uninstall cycles, day-roll and
language-switch exercises, dialog mechanics. The flows' tap points are 3T
panel coordinates, so they replay unchanged.

Boot it headless and kill it when done (never leave it resident: it is real
CPU load beside sibling builds):

```sh
emulator -avd athan-smoke-28 -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect
adb -s emulator-5554 shell getprop sys.boot_completed   # 1 = ready; the serial increments per instance
adb -s emulator-5554 emu kill
```

- Never a measurement witness: `baseline-compare.sh`, `frame-audit.sh` and
  every perf number name a physical device, and no measurement claim cites
  the emulator.
- Disposable by design: destructive checks that would never touch a fleet
  phone (uninstall storms, clock jumps, day rolls) run here; recreate the
  AVD with `avdmanager delete avd -n athan-smoke-28` then
  `echo no | avdmanager create avd -n athan-smoke-28 -k "system-images;android-28;google_apis;arm64-v8a" -d pixel --force`
  and write `hw.lcd.width=1080`, `hw.lcd.height=1920`, `hw.lcd.density=420`
  into `~/.android/avd/athan-smoke-28.avd/config.ini` (the profile's panel is
  not the 3T's; those three lines pin it).
- Further system images (any other API level) are ask-first ground; this one
  image was ruled in by the owner, 2026-10-16.
- The emulator's adb serial is `emulator-5554` on the first instance: pass it
  to adb with `-s` and to Maestro with `maestro --device emulator-5554 test
  <flow>`.
- The 3T atlas's app rows transfer only because panel, density and OS class
  match; its OEM rows (launcher, widget picker) are OxygenOS and never apply.

## The 30fps floor

Big animations (overlay, sheets, cascade, segmented selection,
prayer-transition UI) must hold frame gaps ≤33ms with no multi-frame
freezes. 60fps is a bonus, never required. Per-second countdown text is
exempt (tiny). Scripts measure (pts gaps, PIL bboxes). The vision subagent
interprets (what the frame looks like). Always delegate frame
verification, never infer visuals from pixels alone.

## Gotchas (each cost real time, read twice)

- **Metro env-blindness (healed at SDK 58, keep the verification)**: before SDK 58, changing
  any `EXPO_PUBLIC_*` variable (including `EXPO_PUBLIC_ENV`) required clearing the Metro cache
  AND deleting the generated Android bundle, or the stale transform shipped. At the SDK 58
  pin set (`@react-native/metro-config` 0.88.0 beside `@expo/metro-config` 58.0.14) the env
  change invalidates the transform cache itself,
  measured 2026-10-16 with two `npx expo export --platform android` runs differing only in
  `EXPO_PUBLIC_ENV`: the two entry-chunk md5s DIFFER (`afa8d8377bdb3692bc4bbeb46b928da4` prod
  vs `a3d4e28ff9ce15029b6c994877d7fa6e` mock), so no stale bytes shipped with no manual cache
  clearing. Keep the habit anyway, because it is cheap and the failure mode is silent: after
  any env-only change, compare `unzip -p app-release.apk assets/index.android.bundle | md5`
  against the previous build and treat an identical hash as a recycled bundle
  (`assets/app.config` still regenerates on its own, so a correct version in the APK proves
  nothing about the bundle). The gradle `UP-TO-DATE` skip on env-only changes is NOT
  re-measured at this pin set: `find android/app/build -name index.android.bundle -delete`
  before `assembleRelease` remains the safe route when the env changed.
- **Dev-env confound**: local builds run the mock API (`api/client.ts` returns
  `MOCK_DATA_SIMPLE` whenever the env is neither `prod` nor `preview`, so every
  launch does a full mock refresh (~175ms Android). Baseline and iterations
  share it. Never compare absolute startup numbers to production. It also
  **writes mock times into the device's MMKV cache**, so any device check about
  prayer times, notifications or armed alarm times is void until that build
  refetches. Since the store is namespaced by the same predicate that serves
  the mock (`stores/database.ts`, AUDIT #25), the fabricated rows stay in
  `athan-storage-dev` and a prod or preview build installed over the top never
  reads them, but they persist for the next local build, so a stale mock day
  is still a live confound within dev. The mock seeds by the download's London clock (row 113,
  any hour, any day, `mocks/simple.ts`): the evening window (06:00-23:52:59) puts Asr just
  passed, Maghrib on the next minute boundary and Isha the minute after, so the day rolls to
  tomorrow's real schedule within a couple of minutes; the pre-dawn window (00:00-05:59)
  composes a realistic day with Fajr one minute out and Sunrise eleven; the spent late evening
  (23:53-23:59) serves the day's real static shape with all six passed. A prayer a minute or
  two off the wall clock is the mock, not a bug. Logging is disabled
  in prod and preview (`shared/logger.ts`), so the only build that gives both
  real data and logs is none of them. On a real-data device run, the alarm
  dump is the evidence and an empty logcat proves nothing either way.
- **`--verbose` prints no test names here**: `yarn jest <file> --verbose` emitted
  only the summary (14 lines, no per-test output) with no `verbose`/`silent`/
  `reporters` setting in `jest.config.js` to explain it. Cause unestablished;
  what matters is that a passing COUNT is then the only signal, and "the total
  went up by the three I think I added" is not evidence those three ran. To
  confirm a specific test executed, filter by name:
  `yarn jest <file> -t "<phrase>"` and read the `N passed, M skipped` line. A
  name that does not exist reports 0 matched instead of quietly passing.
- **Android 9 AX trees are STALE** in `uiautomator dump`. Read live text with
  Maestro's `hierarchy`, which reads the live tree, or with screencap pixel
  diffs, never AX dumps. Button coordinates from a fresh dump are fine. On
  the 3T a dump once returned the tree of a package that had since been
  uninstalled (`${APP_ID}.fleettest`).
- **`am start -W` after install is dexopt-inflated** (~4.9s): discard.
- **`dumpsys cpuinfo` is lifetime-cumulative, and `top -n 5 -d 5 -b` printed
  five identical snapshots on the 3T**: measure idle with
  `scripts/idle-cpu.sh` (per-thread `/proc` deltas over 60s).
- **Idle must be measured past the mock's compressed window**: the evening seed puts the next
  prayers one and two minutes out, and every return to the app downloads again, so sample
  ≥5.5 min after a cold launch without leaving the app (idle-cpu.sh does). The night windows
  are safe since row 113: the pre-dawn branch never writes a small-hours Standard row (the
  midnight-crossing rules are what dashed the old night mock), and the evening branch's
  early roll is the owner's own reseed design, not a defect.
- **`expo run:android --device` matches an adb serial first, a device name
  only as a fallback** (@expo/cli 58; the CLI's own help text still says
  "Device name", the code matches the serial before the name). Install and
  launch a built APK with
  `npx expo run:android --binary <apk> --device <serial> --no-bundler`.
  Building stays on `./gradlew assembleRelease` + `adb install -r`, and check
  `dumpsys package "$APP_ID" | grep versionName` before measuring.
- **What's New appears on the first launch after an upgrade that ships a new
  archived item** (including reinstalling a newer build after bisecting an
  older one, when that build stamped a new item) and marks itself shown the
  moment it appears: a silent patch adds no item and pops nothing, so the
  throwaway launch after an install matters only when that install adds items.
- **`overlay_open` mark semantics changed in s9** (useLayoutEffect instrument):
  JS works ~44-78ms then waits on a synchronous UI-thread mount, so the band
  is ~180-240ms. The 80ms baseline predates it. Compare builds with frame
  evidence, never this mark (progress.md, "MARKS REGRESSION INVESTIGATION").
- **zsh does not word-split** `D="adb -s X"; $D shell …` ("command not found"):
  use a function, and have scripts check every output file is non-empty.
- **Force-stop before every scripted interaction** (sheet/scroll state).
- **BACK exits the app when no sheet is open**: flows end with exactly one
  BACK per open sheet.
- **Aborted toggle flows double-flip prefs**: verify final state from pixels.
- **screenrecord pace**: ≥1.2s between recorded transitions. The SD820
  encoder drops frames when animations arrive back-to-back. Extract frames
  with `-fps_mode passthrough` (output option) or VFR frames get duplicated.
- **Video capture wedge**: if screenrecord emits ~1 frame despite display
  changes (and scrcpy freezes early), the virtual-display pipeline is
  wedged. REBOOT the device to restore; `FRAME_AUDIT=sf` still works.
- **Stale Android Studio screen-sharing agents** (`app_process
  com.android.tools.screensharing`) burn 100% CPU, heat the device and skew
  measurements. Check `top` for them before measuring.
- **SF `--latency` layer names rotate** per process relaunch: dump both
  `$APP_ID/$APP_ID.MainActivity#0` and the
  hash-prefixed variant from `dumpsys SurfaceFlinger --list`. The dual
  frame-audit resolves the layer from `--list` itself for this reason.
- **The dual read pairs two clocks through a measured offset**: the video's
  tap sits at 0.5s of recording by construction, but SF present timestamps
  ride CLOCK_MONOTONIC while `/proc/uptime` rides CLOCK_BOOTTIME (suspend
  included) — a phone that has ever suspended carries the difference as a
  growing offset (this 3T: ~8047s), so the script measures it per capture
  (ring clear, anchor tap on the prayer row, uptime read in the same shell,
  then dump; offset = uptime - first present, +-50ms vsync and read lag) and
  subtracts it from the tap's boottime read. Dozes between captures grow the
  offset, and an anchor tap that CLOSES a sheet presents 275-296ms late and
  reads it LOW: offsets cannot decrease, so across a session the highest
  coherent reading is the true one, and `SF_OFFSET=<seconds>` overrides a
  polluted read without a re-capture. The SF dump must land AFTER the
  recorded animation — tap, animation, then dump: the ring holds only ~127
  presents and an idle layer presents nothing, so the ring still covers the
  entrance, while a dump before the tap reads an idle layer and prints
  NO DATA.
- **The pre-tap settle wait is mock-tuned**: `PRE_TAP` opens the overlay
  before a close audit records the closing tap, and `PRE_TAP_WAIT` (default
  1s) is the entrance's settle time. The stock 3s wait is unusable on mock:
  when the seeded boundary is near, the overlay auto-closes inside the wait
  and the recorded "closing" tap captures a re-open — an open mislabelled as
  a close. The 1s default shrinks the exposure window; evening seeds read as
  boundary-adjacent, and a capture whose sheet shows two animations is a
  re-run, not data (the vision read catches it).
- **iOS**: Maestro does not support physical devices. WDA (appium fork) +
  `pymobiledevice3 syslog live` (tag `Athan{React}`). Fast 140ms flicks
  dismiss scrollable sheets. Per campaign directive, iOS is verified by
  owner eyeball. The 3T is the measurement device.
