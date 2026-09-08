Read ai/AGENTS.md, then execute this campaign end-to-end. Do not ask me to plan — the instrumentation, procedures, and thresholds already exist. Ask me ONLY for physical actions you cannot perform.

# Owner Chaos Session — Record Everything, Break Nothing Silently

## What this is

I (the owner) will take the OnePlus 3T and abuse the app like a child: spam
swipes in every direction, machine-gun taps on rows, bells, the overlay,
settings, sounds, toggles, the pager, rapid sheet open/close, backgrounding,
anything reachable. Your job is to capture EVERYTHING while I do it, then
produce a defect report from the evidence. You drive zero UI during the chaos
window — I am the input. You are the flight recorder and the accident
investigator.

Branch: `perf/chaos` (from `uat` @ 1.22.2 — the first-paint surgery campaign:
`ai/features/performance/progress.md` sessions 1-22 are the history; the
`perf22` campaign summary lives in the 1.22.0-1.22.2 commit messages).

## Pre-session build (do this BEFORE I start)

```sh
rm -rf node_modules/.cache/metro android/app/build/generated/assets/react/release/index.android.bundle
EXPO_PUBLIC_PERF_MONITOR=1 EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest \
  npx expo run:android --variant release
```

Verify before handing me the phone:
- PERF_MEASURE lines flow (`adb -s 3T_SERIAL logcat -s ReactNativeJS`)
- One clean cold launch, both pages render, then force-stop
- `adb -s 3T_SERIAL shell svc power stayon usb`
- Kill stale `com.android.tools.screensharing` agents (100% CPU + heat)
- Battery > 60% and charging

## The recording rig (start ALL of it, then hand me the phone)

Run these CONCURRENTLY for the whole chaos window:

1. **Marks stream**: `adb -s 3T_SERIAL logcat -v threadtime > chaos-logcat.log`
   (streaming, never post-hoc `-d` — the buffer rotates under spam).
2. **Frame cadence**: screenrecord in ~2.5-min segments (SD820 encoder
   degrades when thermally soaked; runbook §known-failure-modes):
   `adb shell "nohup screenrecord --time-limit 150 /sdcard/chaos_N.mp4 ..."`
   chained per segment, pulled as each finishes. Name segments with wall-clock
   boundaries.
3. **atrace rolling capture**: `atrace -t 150 -b 8192 view gfx sched am` per
   segment (compositor-truth for frame gaps; immune to encoder wedges).
4. **Crash/ANR watch**: a loop checking `adb logcat -b crash -d` and
   `dumpsys activity anomalies` every segment; ANY hit stops the analysis
   clock and gets flagged immediately.
5. **Memory sampling**: `dumpsys meminfo com.mugtaba.athan.fleettest` every
   ~30s into a log (leak signature: monotonic PSS growth through
   mount/unmount spam).

Tell me "GO" when the rig is live. Then do not touch the device or the flows
until I say "DONE" (or ~8-10 minutes pass — whichever comes first). If I break
the app into a state you can see on the screencap feed (blank, frozen,
error screen), note the wall-clock timestamp and KEEP RECORDING unless it is
a crash loop.

## Post-chaos analysis (the actual work)

1. **Reconstruct the input timeline** from the marks: `pager_swipe_start`,
   `pager_page`, `overlay_open/close`, `sheet_*_open/close/animate`,
   `sound_select_tap`, `sound_play_tap`, `sound_commit`,
   `toggle_tap`, `sched_*`, `widget_push`. Align logcat timestamps with
   screenrecord segment boundaries (device clock, which runs ~3.3s behind
   the mac — use device time only).
2. **Frame-gap audit** on every segment: per-frame pts extraction (ffmpeg
   `-fps_mode passthrough`), flag any gap > 33ms during active input bursts,
   and > 100ms quiescent freezes. Vision-review the worst 5 windows
   (contact sheet + subagent) — scripts measure, vision interprets.
3. **Marks anomaly pass**: any mark duration > 2x its 1.22.2 band (bands in
   the perf22 summary and `e2e/baselines/android-3t.json`); any mark MISSING
   where input clearly happened (lost taps, swallowed gestures); any
   duplicate/overlapping `sched_*` (queue_wait spikes = reschedule storms
   from rapid sound changes).
4. **Error sweep**: every ReactNativeJS warn/error, unhandled rejection,
   require-cycle regression, audio player errors (rapid play-tap churn is the
   known G.4/G.5 territory), notification failures (sound-commit spam can
   queue multiple full reschedules — check `sched_rescheduleAllNotifications`
   count vs my actual number of sound changes).
5. **State-integrity checks AFTER I finish** (before force-stop):
   - Overlay/sheets/pager interaction state sane (no stuck scrollEnabled,
     no ghost sheet, overlay opens and closes cleanly)
   - One prayer per row, countdown correct, no duplicate rows
   - `dumpsys notification` scheduled set still matches DB records
     (post-sweep counts in logcat)
   - Notification channels sane after any sound spam
6. **Memory verdict**: PSS trajectory flat or bounded; note any growth that
   survives a force-stop-relaunch cycle (retained across process = leak
   suspect vs MMKV growth).

## Report format

Findings table: what I did (timestamp + evidence link) / what happened /
expected / severity / suspected component / fix sketch. Separate sections:
crashes (hopefully none), jank windows (frame evidence), mark anomalies,
state-integrity results, memory. End with a ranked fix list and a verdict on
whether anything blocks UAT promotion.

## Known hazards (from the campaign logs — do not relearn these)

- screenrecord t0 drifts ~0.3-1s from shell time; align to logcat marks
- the SD820 encoder drops frames back-to-back and when hot; atrace is the
  arbiter when video and atrace disagree
- `uiautomator dump` serves stale trees — pixels + marks only
- BACK with no sheet open EXITS the app; that is a valid chaos input, just
  relaunch-clean in the timeline
- Thermal: if segments show encoder decay mid-session, pause recording and
  cool passively 8-10 min (screen ON), then resume — never power-key off
- 2 failed attempts at anything → stop and note it rather than thrash

## Rules

- NEVER commit during the session; findings go in the report first
- Never reboot the device without asking me
- If I break something real, reproduce it scripted (input taps/swipes in the
  same sequence from the marks timeline) BEFORE writing the report — a
  reproducible defect is worth ten hypotheses
