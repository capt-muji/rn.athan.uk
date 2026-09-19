# Audit: Session 15. Android home-screen widgets

Auditor: the same GLM 5.3 session, acting as auditor per the owner's no-subagents instruction
(vision used for every image). 2026-09-19.

## What was checked

1. **Range.** `git log origin/uat-2..uat-2`: 24 merges, all session-15 planning, steps 1-20,
   log commits and the alias guard. No foreign commits.
2. **Plan against commits.** Every plan step's contract exists as named: `androidWidgets` flag,
   platform-split `app.config.ts`, android blocks in `app.json`, `buildPrayerWidgetSnapshot`,
   `ANDROID_SNAPSHOT_VERSION`, the dual-platform layout with `typeof Column` detection, the
   renderer suites (iOS home, Android home, lock), `pushScheduleAndroid`/`reloadAndroidKinds`,
   the asset generator + `plugins/androidWidgetAssets.js`, the eight drawable names, and the
   records. The plan's step splits moved twice (3+4 folded by the coverage gate; steps 8-20 are
   device-caught fixes the plan could not foresee): each is logged in `LOG.md` with its cause.
3. **Breaks.** breaks-1 through breaks-6 all ended `ALL AS EXPECTED: 1` when run during their
   steps (recorded in the log entries).
4. **Suite.** `yarn validate` green: 4603/4603, coverage 100/100/100/100 with `widgets/` inside
   the collected set (the owner's explicit requirement).
5. **Device evidence.** All screenshots under `~/athan-device-sweep/session15/shots/`, read by
   the vision subagent at every step: live renders of all 8 kinds (64-67), stale renders on the
   +16d clock jump (73-78), the +60h render-time computation proof, minute-freshness pair
   (31/32 frozen while closed, 33/34 clock-exact after foreground), alarm dump before the clock
   change, idle CPU sample. Phone left on the production v14 build (1.27.266), auto-time on,
   widgets placed, volumes restored.
6. **Owner rules.** No visual change outside the widgets themselves; no prayer time
   substituted; `releases.json` untouched; EAS untouched; no API key; no ignore comments; every
   hook ran (two hook rejections forced real fixes rather than skips).

## Findings and fixes (all applied in-session, by the auditor)

- R8 stripped `androidx.work.OverwritingInputMerger` (widget never composed) - fixed 1.27.250.
- Aliased `@expo/ui` imports resolve to nothing in the widget runtime (two layers: components,
  then modifiers) - fixed 1.27.251-253, contract-guarded 1.27.254.
- Noon-anchored day boundary kept yesterday picked every morning - fixed 1.27.255.
- Glance starvation family: `fillMaxWidth(0.48)` hero (1.27.257), row Spacer (1.27.259),
  overlay/textAlign times (1.27.260-262) - all fixed with fixed-width boxes and pure alignment.
- Pill asset margin clipped the active row's edge glyphs - fixed 1.27.263.
- Owner styling pass (centered trio, bold name verified by stroke measurement, footer inset,
  pill air) - 1.27.264-265.
- List column arithmetic (150dp hero left 110dp for 130dp rows; times ellipsized) - 1.27.266.
- Mock-build incident: the variant script installed over `com.mugtaba.athan` once; restored
  within a minute, owner data untouched (mock uses `athan-storage-dev`); script fixed and the
  incident logged.

## Known edges (recorded, not defects)

- Extras mediums render hero-only while the on-screen day's extras rows have all passed (the
  app's held-day rule; identical to the iOS layout's fallback). The medium list returns at the
  next day boundary.
- Labels freeze while the app is closed (Android pauses JS timers); every render recomputes
  from epochs, so any trigger (open, background task, reboot, resize) heals instantly. This is
  the behaviour model the owner approved.
- Two accidental duplicate placements remain on the launcher (launcher reflow); cosmetic only.
- iOS simulator device proof not run this session (the renderer suites carry iOS layout logic
  at 100%; the queue's session 17 row covers the iOS widget work). Immediate follow-up.

## Verdict

**PASS.** The plan's deliverable exists, works, and matches the owner's styling rulings to the
pixel-measured letter: 8 kinds, iOS-exact palettes (verified by measured RGB at every step),
render-time computation, minute-fresh while running, stale cards past the horizon.
