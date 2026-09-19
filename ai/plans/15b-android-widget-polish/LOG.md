# Execution log: Session 15b

Planning resumed 2026-09-19 after the first planning session was cut short having queued the row and refined
the brief twice (1.27.268, 1.27.269, 1.27.270; all merged and pushed). Roles collapsed by the owner in the
same run: one GLM 5.3 session plans, executes and audits; `vision` is the only subagent; the owner receives
screenshots this session (all under `~/athan-device-sweep/session15b/shots/`).

## Planned

- 1.27.271 `61e23ffc` merged `f7b16f7f`: PLAN.md (5 steps + prove pass), PROMPT.md, LOG.md; row 10 READY,
  planned at `825c4ce5`. Self-review only (owner ruling); no scratch-worktree spike (roles collapsed, the
  step loop's red-first rule carries the protection).

## Executed (each: tests red first, green, breaks verified, hook 100% + full suite, merged --no-ff)

- Step 1 `mock/resting-state-15b` 1.27.272: `mocks/simple.ts` Asr = first whole minute >= 3 minutes after
  download; today Fajr/Sunrise/Dhuhr = asr-6/-5/-4, Magrib/Isha = +1/+2. `mocks/__tests__/simple.test.ts`
  window 180-239.999s. Hook: 4603 passed.
- Step 2 `assets/widget-solid-15b` 1.27.273: generator opaque cards `#fcfcfe`/`#1a1a5c`, `CARD_RADIUS_PT`
  22->16, `PILL_H` 26, shadow specs deleted; 10 PNGs regenerated (pill PNGs 4KB->540 bytes);
  `widgetAssets.test.ts` pins the opaque forms + subset rule for the rest. Hook: 4603.
- Step 3 `widgets/layout-polish-15b` 1.27.274: `FOOTER_BOTTOM_PAD 16` (small footer row, small content pad
  34, medium outer pad), `PILL_VPAD 2` both platforms (iOS keeps shadow), `AStale`/`ANeutral` Columns
  centered. Renderer harness: positional modifier capture (swift-ui padding was the one Android casts).
  Hook: 4608.
- Step 4 `widgets/grid-sizing-15b` 1.27.275: app.json smalls 160dp, mediums 400dp (later 310), targetCell
  keys removed, resizeMode both; `plugins/androidWidgetGrid.js` strips targetCell attrs;
  `androidWidgetGrid.test.ts`. NOTE: package.json missed from the step-4 commit (hook read the working
  tree); healed by step 5's commit. Hook: 4609.
- Step 5 `widgets/native-refresh-15b` 1.27.276: `modules/widgetrefresh` (Scheduler + minute Receiver + Boot
  receiver + Expo Module `ExpoWidgetRefresh.armWidgetRefreshChain`), exact alarm at wall minute +1s,
  ACTION_APPWIDGET_UPDATE per placed kind, chain dies with zero placed widgets; JS arms after every Android
  push in `refreshPrayerWidgets`; `widgetRefreshChain.test.ts` + binding tests. Hook: 4612.

## Device-pass fixes (each device-proven before committing)

- 1.27.277 ordering: dangerous mods run last-registered-first; the strip plugin now registers BEFORE
  expo-widgets so it runs after the provider XMLs are written (flags test pins the order).
- 1.27.278 null epochs: `[updateSnapshot] Cannot convert ... expected an Object` on EVERY mock push; the
  KLDI C++ bridge cannot carry JSON null nested in the snapshot. Unavailable rows now carry `epochMs: 0`
  (never a real instant; the render path already skipped `epoch <= now`). Session 15 never met this because
  its device proof ran on real API data where no row is unavailable. Verified: 0 failures, both schedules
  pushed. Root cause found by building session 15's tip (615622d2) as a control: it failed too.
- 1.27.279 medium minWidth 400 -> 310dp: the 3T launcher computes spans as ceil((minWidth+30)/70) and HIDES
  over-wide providers (400 -> 7 cells); with 310dp the mediums appeared as 5x2 and the owner placed one at
  exactly 100% grid width. 160dp smalls measured 3x2 = 567x540px (near-square, iOS-like) on device.
- 1.27.280 full-width medium: hero/list 132/148dp split, pill bounded to the list column (was spanning the
  dead space), day list rolls to the NEXT prayer's day after Isha (the app's and iOS's rule; was falling
  back to hero-only), horizontal resize with minResizeWidth 160dp + native composition patch (reads each
  id's OPTION_APPWIDGET_MIN_WIDTH, stamps `size` into the kind's stored props).
- 1.27.281 owner review round 2: sizes LOCKED like iOS (resizeMode none; "the 8 kinds ARE the size
  choices"), small-card footer unclipped (row height 16 + bottom pad 16 left zero room for the 9sp text -
  row now FOOTER_BOTTOM_PAD+14), hero 160dp, PILL_VPAD 1, rows+pill share the 8dp side insets, radius
  16->13pt.
- 1.27.282 owner review round 3: hero 176dp (the true left half up to the list's edge), pill inset 4dp
  inside its row (left letter no longer kisses the pill), bold "Out of date" title both platforms.

## Device proof (3T, fleettest build, owner-observed)

- Snapshot pushes clean from 1.27.278 on; resting state lands (Asr next at +3min).
- Sizing: small 3x2 (567x540px), medium 5x2 full grid width - owner confirmed "correctly fills up the
  entire 100% good".
- Self-refresh: DUHA 14m -> 13m over 66s with the app process cached and ZERO `snapshot pushed` lines in
  the window (`10-chain-a/b.png`); Isha 1m -> next-day FAJR 15h with tomorrow's list, pill on Fajr
  (`11-chain-b.png` rollover fix proven live).
- The owner observed the minute-boundary update live during placement, the morph on resize ("when I resize
  and then it updates, it correctly works"), and the out-of-date cards during a +16d clock jump ("look
  great, fantastic, I love it"). Clock restored, auto_time on. The stale card never screenshotted cleanly
  because the app relaunched mid-jump and re-downloaded; renderer rows cover it and session 15 proved the
  same card on device.
- Tap-to-open the app: NOT wired - expo-widgets' runtime routes taps only for layout buttons, not plain
  cards; owner accepted ("that's okay I guess"). Possible follow-up via an @expo/ui Button wrapper.
- Screenshots for the owner: `~/athan-device-sweep/session15b/shots/` (grid research, picker states,
  placements, chain proof, stale attempt).
