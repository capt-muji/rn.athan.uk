# Performance campaign progress (compressed record, 2026-10-07)

The September 2026 performance campaign (sessions 1-11) is closed. This page replaces the deleted
session-by-session tracker; that full tracker remains recoverable from git history. Outcome:
idle CPU 80.6% down to a ~19-31% band on the 3T, all big animations at or above the 30fps floor.
ADR-013 and ADR-014 hold the design; the 12 Performance Design Rules live in `ai/AGENTS.md`.

## #14: the idle Choreographer loop

The app never idles at zero frames: a settled foreground app runs about 60 `Choreographer#doFrame`
calls a second while rendering none, about 6-7% CPU in-app. The loop is UPSTREAM, below all app
code: a 7-build bisect ending with a bare `View` as the whole layout still showed it (~303
doFrames/5s), about 22.5% of a core on the 3T (Snapdragon 820). Repro method: settle 40s, run
`adb shell atrace -t 10 -b 32768 view input`, and count `Choreographer#doFrame` against
`dumpsys gfxinfo` rendered frames; about 600 calls in 10s with 0 frames rendered is the loop. Idle
CPU: `e2e/scripts/idle-cpu.sh`. Root cause and per-callback detail: `README.md` in this folder.
Revisit on React Native upgrades; otherwise spend no session on it (owner re-plan 2026-09-11).

## MARKS REGRESSION INVESTIGATION

`overlay_open` and `overlay_close` changed meaning in s9, when the instrument moved to a
commit-time `useLayoutEffect`: the mark reads ~200-265ms where the old instrument read 80-190.
Five single-variable builds ruled out every code change; the JS thread works ~44-78ms and then
sleeps on a synchronous UI-thread mount, while frame evidence showed user-visible parity. Compare
builds by frame evidence, never by this mark.

## Numbers and pointers

- `js_to_content` has measured 673-753ms on the 3T since 1.21.1 (dev-env builds).
- `e2e/baselines/android-3t.json` line 3 still holds 1076ms and is STALE; re-base it before
  comparing any future measurement.
- Measuring gotchas (Metro env-blind transform cache, the capture wedge, screen-share CPU burn,
  ffmpeg passthrough) and the build protocol live in `e2e/README.md`; tools:
  `e2e/scripts/frame-audit.sh`, `e2e/scripts/baseline-compare.sh`.
