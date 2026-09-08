Read ai/AGENTS.md, then execute this feature end-to-end. This prompt carries everything the 2026-09-08 fix sessions learned about the alert path; do not relearn it. Ask me ONLY for physical actions you cannot perform.

# Alert Icon Change Animation — Owner-Picks Session

## The feature (owner request, 2026-09-08)

When the user changes a prayer's alert (Off/Silent/Sound) in the alert sheet and closes it, the row's alert icon swaps to the new glyph instantly — a snap. It works and commits correctly; only the PRESENTATION is changing. Add a bounce/pop transition animation on the icon swap: owner wants "a bounce in, bounce out kind of effect".

## The deliverable protocol (owner-directed, three phases)

1. **Phase 1 — five candidates on the iPhone**: implement FIVE distinct bounce/pop effects, all reachable in ONE build via a debug cycler (see below), build Release to the iPhone XS, hand it over. The OWNER records the videos himself and picks the winner. Do not pick for him.
2. **Phase 2 — implement the winner**: keep exactly one effect, delete the other four AND the debug cycler, `yarn validate` green, owner eyeball on the iPhone.
3. **Phase 3 — after explicit owner approval**: release fleettest build on the OnePlus 3T, frame-verified (the session-2 protocol below), then commit/push/merge to uat only when the owner says so (default agent rule: never commit).

## Where the snap happens (settled, do not re-investigate)

`components/prayer/Alert.tsx`:
- `const alertAtom = useAtomValue(getPrayerAlertAtom(type, index))` — `iconIndex` selects `ALERT_CONFIGS[iconIndex].icon`, the SVG path for bell-slash / bell-ring / speaker.
- The icon is `<Svg><AnimatedPath d={ALERT_ICONS[...]} animatedProps={AnimFill.animatedProps} /></Svg>` inside `<Animated.View style={AnimScale.style}>`.
- `hooks/useAlertAnimations.ts` already owns `AnimScale` (press-in 0.9, press-out 1) and `AnimFill` (fill color animation; also driven by `refreshUIAtom`, `Prayer.isNext`, cascade, overlay selection effects in Alert.tsx).
- The change lands when the sheet's `onDismiss` commit runs: `hooks/useNotification.ts` `commitAlertMenuChanges` → `NotificationStore.setPrayerAlertType` → the jotai atom flips → Alert re-renders with the new path. The sheet is already closed at that moment, so the swap plays alone on the row. Timing is correct as-is; do not move the commit.

## The trigger rule (non-negotiable, house law)

Animate ONLY on a VALUE CHANGE of the alert atom. Mount must appear settled (ai/AGENTS.md "No mount-time visual settling" + Performance Design Rule 3; the Toggle/segmented-control first-eval-snapped pattern). Do not animate on mount, on re-renders, or when the sheet merely opens/closes without a change. An effect keyed on the `alertAtom` transition (prev !== next) is the shape; make sure the FIRST evaluation snaps (the Toggle pattern in components/sheets/parts/Toggle.tsx).

## Effect candidates (starting points; tune amplitudes on device)

All five are scale/transform bounces on the existing `Animated.View` wrapper (GPU-composited, no layout props). Reanimated 4.5.1 springs/timings; consider `expo-haptics` pairing (ImpactFeedbackStyle.Light already fires on the row press) — haptics optional, owner sensitive to feel:

1. **Spring overshoot pop** — scale 1 → 0.6 → spring back with overshoot (damping ~10-14, stiffness 300-500)
2. **Bounce out, bounce in** — shrink the OLD glyph out (scale → 0, ~120ms), swap, spring the NEW glyph in with overshoot (~250ms); reads as "in and out"
3. **Squash & stretch** — non-uniform scaleX/scaleY: squash to (1.15, 0.75), swap, stretch past (0.9, 1.1), settle; cartoon feel
4. **Elastic wobble** — scale drop to 0.85 then `withSequence` of decaying oscillation (±6%, ±3%, ±1.5%) around 1
5. **Heartbeat double-pulse** — two quick scale pulses (1 → 1.12 → 1 → 1.08 → 1, ~450ms total); subtle, notification-like

The glyph swap itself (path `d` change) can happen mid-first-shrink or at the trough — midpoint of the animation, tuned per effect for the best read.

## The debug cycler (phase 1 only, deleted in phase 2)

One build, five effects. Gate with `EXPO_PUBLIC_ALERT_EFFECT_DEBUG=1` (the statically-folded env idiom; see `EXPO_PUBLIC_FORCE_RAMADAN` in shared/time.ts and `EXPO_PUBLIC_BG_DEBUG` in device/backgroundTaskDebug.ts):
- With the gate ON, each alert CHANGE advances the active effect 1 → 2 → 3 → 4 → 5 → 1 …
- Show the active effect's name briefly somehow (a tiny temporary Text overlay near the icon, or in the existing sheet header — cheapest thing that films well)
- Gate OFF (production): effect 1 is the default placeholder; none of this ships
- The owner opens a prayer's sheet, changes the value, closes, watches the row, repeats — one continuous screen recording covers all five; he announces the winner

## Build and verify protocol

- Load the `expo-animation` skill FIRST (`.agents/skills/expo-animation/SKILL.md`) — it encodes the house decisions on thread, spring-vs-timing, and handoffs.
- iPhone XS build: `EXPO_PUBLIC_ALERT_EFFECT_DEBUG=1 npx expo run:ios --configuration Release --device IPHONE_UDID` (Release config — dev-mode JS timing distorts springs; the XS device id is stable). First Release build takes minutes; subsequent ones are incremental.
- The owner records videos himself (his stated preference) — hand him the phone with the cycler active; do not attempt pymobiledevice3 screenshots on the XS (screenshotr needs a developer-disk mount; known dead end from 2026-09-08).
- Phase 3 on the OnePlus 3T (3T_SERIAL via adb): release fleettest build `EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest npx expo run:android --variant release`; kill the CLI at "Installing"; poll `adb shell dumpsys package com.mugtaba.athan.fleettest | grep lastUpdateTime` until settled BEFORE `am start -n com.mugtaba.athan.fleettest/com.mugtaba.athan.MainActivity`; launch with `am start`; the What's New modal may fire after a version bump — dismiss its Continue before scripted taps.
- 3T verification: `adb shell screenrecord` (start it 3-4s BEFORE the tap — encoder warm-up eats earlier frames; wait PAST the time-limit before pulling or the moov atom is missing), extract `ffmpeg -i x.mp4 -vf fps=16 frames/f_%03d.png`, vision-audit the frames: the animation must hold the 30fps floor (ADR-013), no frozen mid-frames, and the icon must never render the WRONG glyph at rest.
- `yarn validate` green (tsc + biome + 931 tests) before every handover.
- Version: the FINAL phase-3 commit is a patch bump (app.json + package.json + shared/whatsNew.ts version, in sync; no new whats-new items). Never touch releases.json. Default: do NOT commit/push/merge until the owner explicitly orders it (he ordered it in the 1.22.5 session; assume nothing).

## Constraints and known landmines

- No new dependencies. Reanimated + expo-haptics only.
- Do not fight the existing press feedback: `AnimScale` press-in 0.9 / release 1.0 must keep working; the change-bounce either reuses the same shared value (sequenced) or a second transform on an inner/outer wrapper — do not stack two transforms on one view.
- Do not touch: the commit path (`useNotification.ts`), the keyed `AlertSheetBody` architecture, `SegmentedControl` (percent pill — settled 2026-09-08), the splash gates, the Ramadan preview gate.
- Biome `useExhaustiveDependencies` is never disabled — inline `biome-ignore` comments with reasons, as the existing Alert.tsx effects do.
- No `console.log` (Pino only). No mount-time animation (first frame settled — the trigger rule above).
- The atom flip fires for BOTH schedule pages' rows independently; the animation is per-row (only the changed prayer's icon bounces — never a cascade).
- Rollback path caveat: if a commit fails and rolls back (`useNotification.ts` catch), the atom flips back and the animation will fire again on the revert — that is correct behavior, not a bug.

## Context files

- `components/prayer/Alert.tsx` (the icon, press handlers, existing effects)
- `hooks/useAlertAnimations.ts` (AnimScale/AnimFill — extend this hook, do not fork it)
- `components/sheets/screens/Alert.tsx` (the sheet; closed by the time the icon swaps)
- `shared/constants.ts` (`ANIMATION.*` durations; add new constants there, not inline magic numbers)
- `ai/chaos-20260908-report.md` + this directory's `alert-sheet-first-frame.md` (the 2026-09-08 history: what was fixed and why the architecture is what it is)
- Repo state at session start: `perf/chaos` == `uat` == 1.22.5 (commit b63a020)
