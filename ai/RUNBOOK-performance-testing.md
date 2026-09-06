# RUNBOOK — Performance Testing (Athan.uk)

> Operational runbook for measuring and auditing app performance on physical
> devices. Companion docs: `ai/adr/013/ADR.md` (architecture),
> `ai/features/performance/progress.md` (campaign history),
> `e2e/README.md` (harness usage).

## Devices

| Device | Role | Handle |
| --- | --- | --- |
| OnePlus 3T (Android 9, SD820) | **THE verification device** — oldest/worst; smooth there means smooth everywhere | adb serial `3T_SERIAL` |
| iPhone XS (iOS 18.x) | structural verification only (same code paths); owner eyeballs smoothness | devicectl `IPHONE_UDID` |

Never reboot devices mid-session without owner approval. Keep both plugged
in. Android keep-awake: `adb -s 3T_SERIAL shell svc power stayon usb`.

## Build (gate-ON Release)

```sh
rm -rf node_modules/.cache/metro
rm -rf android/app/build/generated/assets/react/release/index.android.bundle
EXPO_PUBLIC_PERF_MONITOR=1 npx expo run:android --variant release
```

Metro's transform cache is ENV-BLIND — without the cache + bundle deletion a
toggled `EXPO_PUBLIC_PERF_MONITOR` silently ships the stale transform (a
false OFF build once cost a full session block). Verify the gate before
measuring: launch and check `adb logcat -s ReactNativeJS` shows
`PERF_MEASURE` lines.

iOS: `EXPO_PUBLIC_PERF_MONITOR=1 xcodebuild -workspace ios/Athan.xcworkspace
-scheme Athan -configuration Release -destination 'platform=iOS,id=<id>'
-allowProvisioningUpdates -derivedDataPath ios/build`, install via
`xcrun devicectl device install app`. Marks surface in
`pymobiledevice3 syslog live` under `Athan{React}` (attach the stream BEFORE
driving interactions — it sometimes attaches late).

## Measurement instruments (pick by question)

| Question | Instrument | Notes |
| --- | --- | --- |
| JS-commit timing (store→effect) | perf marks (`PERF_MEASURE` lines) | primary; cross-validated Phase 2 |
| Animation frame cadence | `e2e/scripts/frame-audit.sh` (screenrecord → per-frame pts) or `FRAME_AUDIT=sf` (SurfaceFlinger `--latency`) | screenrecord writes a frame ONLY on real display changes — each written frame IS a display update |
| App-side frame truth (any encoder state) | `atrace -t 5 -b 8192 view gfx sched` around the interaction; parse `Choreographer#doFrame` durations + cadence | immune to video-pipeline wedges |
| Idle CPU | `top -n 5 -d 5` medians (`dumpsys cpuinfo` is lifetime-cumulative) | kill any stale `com.android.tools.screensharing` agents first (100% CPU + heat) |
| Visual quality of frames | contact sheet → vision subagent | scripts MEASURE, vision INTERPRETS — never infer visuals from pixel stats alone |

## The 30fps floor

Big animations (overlay open/close, sheet entrances, date/prayer cascade,
segmented selection, prayer-transition UI) must hold frame gaps ≤33ms with
no multi-frame freezes. PASS/FAIL is decided on compositor/atrace cadence +
vision's read of the frames; marks alone cannot validate animation quality.

## Session protocol

1. Force-stop the app before every scripted interaction (resets
   sheet/scroll state).
2. Discard the first post-install launch (dexopt inflates `am start -W`
   ThisTime ~4.9s).
3. Settle ≥10-12s after launch before measuring (JS warmup + the widget
   re-push ~2.5s in).
4. Drive Android via `input tap` with mark verification; Android 9 AX dumps
   serve STALE trees — live-text assertions need screencap pixel diffs.
5. Pace recorded transitions ≥1.2s apart (SD820 encoder drops frames
   back-to-back).
6. Per iteration: marks FIRST → root-cause → fix → rebuild gate-ON →
   re-measure → log before/after in the campaign progress file →
   jest + tsc + biome green.

## Known failure modes of the instruments

- **Video capture wedge**: screenrecord emits ~1 frame despite display
  changes (and scrcpy freezes early) = virtual-display pipeline wedged.
  A device REBOOT restores it. SF-latency and atrace still work — fall back
  and continue.
- **SF layer names rotate** per process relaunch — dump both the plain and
  hash-prefixed names from `dumpsys SurfaceFlinger --list`; an empty ring
  usually means the wrong (stale) layer.
- **Thermal**: sustained recording heats the SD820; the encoder degrades
  (37→21→5 frames per recording observed). Passive cool screen-ON ~10min;
  NEVER power-key the screen off to cool (the lock screen engages and
  unlocks leave owner-device state you don't want to disturb).
- **ffmpeg frame extraction**: `-fps_mode passthrough` as an OUTPUT option
  or VFR screenrecord frames get CFR-duplicated and stop matching timestamps.

## Baselines

`e2e/baselines/android-3t.json` — end-of-Phase-3 medians + floor verdicts.
Campaign builds are dev-env (mock API): every launch runs the mock refresh
(~175ms) production never does. Deltas across builds sharing the env are
valid; absolute startup numbers are NOT production-comparable.
