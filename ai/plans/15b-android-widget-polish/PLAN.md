# Plan: Session 15b. Android widget polish + self-refresh + mock build loop

| Field | Value |
| --- | --- |
| Brief | `ai/prompts/android-widget-polish.md` |
| Planned at | `825c4ce5` (version 1.27.270), 2026-09-19 |
| Planned by | Planning session on 2026-09-19, GLM 5.3 (roles collapsed by owner: the same session plans, executes and audits) |
| Needs first | 9 (DONE) |
| Steps | 5 code steps, then one build-and-prove pass |
| Device | OnePlus 3T `8f7ada76`, fleettest mock build; iPhone XS attempt at the end |
| Owner decisions still needed | None. Every one was taken; see section 2 |

## 1. Goal

The owner reviewed session 15's 3T device proof and ruled eight fixes. Today the Android widgets freeze the
moment the app closes (JS flip chain dies with the host), the cards render translucent, the footer sits too low
and at different heights across the eight kinds, the active pill hugs its row and carries an ugly shadow, the
card corners are too soft, the smalls are thin-and-tall and the mediums leave an unusable strip, and the stale
card's text hugs the left edge. When this plan is DONE: the countdown ticks every minute with the app closed,
cards are opaque with the glow kept, all eight share one uniform lifted footer, the pill has vertical padding
and no shadow on Android, corners are sharper, smalls span half the grid width and mediums the full width on
any launcher grid, the stale card is centered, and the mock resting state (Asr next at +3 minutes) is installed
on the 3T for the owner to judge live.

Owner rules that apply: "an alert does exactly what its bell shows"; never copy or synthesise a prayer time;
visuals change only as this brief rules; comments explain why; `releases.json` untouchable; EAS read-only; the
API key never committed; nothing of OpenCode's changed. Plus this session's standing instruction (owner,
2026-09-19): the owner DOES receive screenshots this session, saved under `~/athan-device-sweep/session15b/`
and opened at the end.

## 2. Decisions

### 2.1 Taken

1. **Owner (2026-09-19, in the brief).** Solid cards keep the glow: base alpha 1.0 on all 8 Android kinds,
   both themes; iOS keeps translucency. Recorded in `ai/prompts/android-widget-polish.md`.
2. **Owner (2026-09-19, in the brief).** No widget is the footer reference: lift every footer, uniform height,
   including the dark medium.
3. **Owner (2026-09-19, in the brief).** Pill: keep 8dp left/right insets and the radius, add vertical padding,
   remove the shadow on Android only.
4. **Owner (2026-09-19, chat).** Small = 50% of the home screen, medium = 100%, on ALL Android phones,
   including phones whose launcher grid the user can change (4x4, 8x8, and so on), matching iOS. iOS is
   already exact and unchanged.
5. **Owner (2026-09-19, chat).** This session runs with roles collapsed: the same agent plans, executes and
   audits; the only subagent allowed is `vision`; screenshots are taken of every state and opened for the
   owner at the end. This overrides PLANNER-BRIEF's review subagents (replaced by self-review plus `vision`
   device proofs) and EXECUTOR-BRIEF's "the owner receives no screenshots".
6. **Planner.** Grid recipe: `minWidth` is the only lever. Small `minWidth 160dp` (lands 2 cells on 4-col
   grids, 3 on 5-col, 3 on 6-col: always ~half the usable width; on the measured 3T grid, 3 of 5 columns =
   567px of 1080 = 52.5% and, at 2 rows tall, a near-square 567x540 like iOS). Medium `minWidth 310dp`
   (the standard formula's 5-cell value; 400dp computed to 7 cells on the 3T, which HIDES over-wide providers instead of clamping, found in the device pass). Both
   `minHeight 110dp` (2 rows) and `resizeMode "both"` (owner wants resizable). The plugin-written
   `targetCellWidth/Height` attributes are stripped after expo-widgets writes them, because a fixed cell
   count is grid-dependent (4 cells on an 8x8 grid is 25%, not 50%) and Android 12+ prefers them over
   `minWidth`. Derived from vision-measured 3T geometry (cell 161x249px, gap 42px, pitch 203x291px,
   5x5 grid; span(k) = 77.3k - 16dp) recorded in `~/athan-device-sweep/session15b/shots/plan/`.
7. **Planner.** Card radius 22pt becomes 16pt: sharper, still soft enough to keep the design's character.
   Verified on device in the prove pass; one adjustment allowed by self-review if the owner's screenshots
   show it still too soft.
8. **Planner.** Footer bottom padding: uniform `16dp` on all 8 Android kinds (small path footer pad 6 -> 16,
   small content bottom pad 24 -> 34, medium outer bottom pad 13 -> 16). iOS footer untouched (uniform at its
   13pt inset already; the brief's item 3 names the eight Android widgets).
9. **Planner.** Pill vertical padding `2dp` each side: pill height 22 -> 26 in the PNG and both layouts
   (Android image height and iOS RoundedRectangle frame), offset lifted by 2, first spacer clamped at 0.
10. **Planner.** Mock resting state read as: Asr is the first whole minute at least 3 minutes after download
    (180 to 239.999s away, keeping the whole-minute convention); Fajr/Sunrise/Dhuhr a minute apart ending one
    minute before download minus two (Fajr at asr-6, Sunrise asr-5, Dhuhr asr-4), Magrib asr+1, Isha asr+2.
    Both anchor statements in the brief ("Asr next at plus 3" and "Fajr -3, each +1") hold with a 4-minute
    Dhuhr-to-Asr runway, which is also the self-refresh proof window.
11. **Planner.** Self-refresh design: exact-alarm receiver chain. A new local module
    `modules/widgetrefresh` (mirroring `modules/tls13`) contributes a `WidgetRefreshReceiver` that, on fire,
    broadcasts `ACTION_APPWIDGET_UPDATE` (with the placed ids) to each of the 8 generated
    `<pkg>.<Kind>Provider` components (public `GlanceAppWidgetReceiver` entry; expo-widgets'
    internal `WidgetsUpdater` is module-private and cannot be called) and re-arms one
    `setExactAndAllowWhileIdle` alarm at the next wall minute + 1s, only while at least one widget is
    placed. Arming points: JS `armWidgetRefreshChain()` after every Android push in
    `refreshPrayerWidgets`, a `BOOT_COMPLETED`/`MY_PACKAGE_REPLACED` receiver (permission already held), and
    the chain itself. `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM` are already in `app.json`; API 31+ uses
    `canScheduleExactAlarms()` with an inexact fallback. Deep-doze coalescing (at most one exact fire per
    ~9 minutes in doze) is accepted: the screen is off then, and the first post-wake fire catches the label
    up. Force-stop still breaks the chain (Android cancels alarms); the next app open re-arms, same contract
    as the notification background chain.

### 2.2 The executor must not decide

Ask the owner (via the `question` tool) and stop when:
- any test fails that this plan does not predict, or a predicted-red test passes;
- the 3T placement measurements miss 3-of-5 (small) or 5-of-5 (medium) columns;
- the self-refresh proof shows a frozen label after `am kill`;
- a build script prints `FAILED`;
- anything touching `releases.json`, `uat`, EAS, the API key, or OpenCode's config;
- a visual the owner must judge (radius sharpness, footer height, pill padding) looks wrong in the
  screenshots: ask with the screenshot path, options "ship as is" / "adjust once".

## 3. Pre-flight

```bash
#!/bin/bash
# preflight-15b.sh <k>. Run from the repo root with bash.
set -u
cd /Users/muji/repos/rn.athan.uk || exit 1
[ "$(git rev-parse --abbrev-ref HEAD)" = "uat-2" ] || { echo "NOT on uat-2"; exit 1; }
git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "origin/uat-2 not merged"; exit 1; }
node -p "require('./package.json').version"
python3 - <<'EOF'
import re, sys
readme = open('ai/plans/README.md').read()
row9 = re.search(r'^\| 9 \|.*$', readme, re.M).group(0)
assert 'DONE' in row9, 'row 9 not DONE'
EOF
adb -s 8f7ada76 get-state | grep -qx device || { echo "3T not connected"; exit 1; }
[ -x "$(command -v python3)" ] && python3 -c 'import PIL' 2>/dev/null || { echo "Pillow missing"; exit 1; }
echo "PREFLIGHT OK"
```

## 4. Background the executor needs

- **Code map.**
  - `scripts/generate-widget-assets.py`: bakes the Android PNGs (cards, pills, moon) from the layout palette;
    `CARD_RADIUS_PT 22`, `PILL_H 22`, translucent `CARD_LIGHT/CARD_DARK`, pill shadow specs.
  - `assets/widgets/*.png`: the 10 committed drawables; the config plugin copies them to
    `res/drawable-nodpi`.
  - `widgets/PrayerWidget.tsx`: ONE `'widget'` function backing all 8 kinds; Android composition renders
    from `PrayerWidgetAndroidProps` at render time (`androidRender`, `ACard`, `AStale`, `ANeutral`,
    `ARowLine`, pill image at `activeIndex * ROW_HEIGHT`), iOS keeps timeline entries
    (`HeroColumn`, `ActivePill`, `StaleCard`). `ROW_HEIGHT 22`.
  - `stores/widget.ts`: `refreshPrayerWidgets` branches to `pushScheduleAndroid` per schedule;
    `scheduleLabelFlipReload` is the JS setTimeout chain that dies with the host (the bug).
  - `app.json` + `app.config.ts`: expo-widgets plugin config (8 android blocks, `resizeMode none`,
    `targetCellWidth 2/4`); `enableAndroidWidgets` appends `./plugins/androidWidgetAssets`.
  - `plugins/androidWidgetAssets.js`: dangerous mod copying PNGs to `res/drawable-nodpi` (the model for the
    new grid plugin).
  - `modules/tls13`: the local-module pattern (`expo-module.config.json`, `build.gradle`, Kotlin under
    `expo.modules.tls13`, `ModuleDefinition { Name(...) Function(...) }`).
  - `mocks/simple.ts`: `buildTimes` seeds TODAY around `asrAt` (first whole minute >= 1 minute after
    download; offsets -4..+2).
  - `e2e/device-atlas-oneplus3t.md`: launcher coordinates, placement mechanics, widget render failures.
  - `~/athan-device-sweep/session15/bin/build-mock-widgets.zsh`: the mock build (fleettest suffix,
    `EXPO_PUBLIC_ANDROID_WIDGETS=1`, worktree build, ends `BUILD-MOCK OK`).
- **Interaction.** Android widgets render on: push (`updateSnapshot`), the JS flip chain (dies on pause),
  launcher-driven updates. The new native chain adds: alarm fire -> `ACTION_APPWIDGET_UPDATE` broadcast ->
  each provider's `GlanceAppWidgetReceiver.onUpdate` -> layout re-evaluated from stored props (label
  recomputed from epochs: correct inside the 14-day window without JS). Concurrency: alarms are serial
  (one PendingIntent, re-armed after each fire); the JS arm call is idempotent (pending-intent
  `FLAG_NO_CREATE` probe); no JS runtime is ever started by the chain.
- **Existing tests.** `mocks/__tests__/simple.test.ts` pins Asr 60-119.999s (changes in step 1);
  `shared/__tests__/widgetAssets.test.ts` pins generator literals subset + PNG set (changes in step 2);
  `shared/__tests__/widgetRenderer.test.ts` evaluates the real layout against both platforms' component sets
  (gains assertions in step 3; palette rows unchanged); `shared/__tests__/widgetContract.test.ts` AST-guards
  the layout (palette stays); `shared/__tests__/flags.test.ts` pins the app.json android blocks and the
  app.config.ts mirror (changes in step 4); `widgetSnapshot/widgetTimeline/widgetSimulation/widgetLockRenderer`
  must not change.
- **Why the obvious fix is wrong.** WorkManager periodic (15-min floor) cannot tick a minute countdown;
  keeping JS timers alive needs a foreground service (Play policy rejection pattern, per the 2026-09-10
  research); calling expo-widgets' `WidgetsUpdater.reload` from app code is impossible (module-private).
  For sizing: `targetCell*` alone is grid-dependent, so it is stripped rather than tuned.

## 5. Design

- **Self-refresh invariant (a test can check the JS half):** every Android `refreshPrayerWidgets` call that
  pushes snapshots also calls `armWidgetRefreshChain()` exactly once, and nothing calls it when the flag is
  off or the platform is iOS. Native invariant (device-proven): with the app killed, a placed widget's
  countdown label advances within 90 seconds without any app process running.
- **Sizing invariant:** `dumpsys appwidget` after install shows `minWidth` 160dp encoded (160<<8|1 = 40961)
  for small kinds and 310dp (79361) for mediums, `resizeMode=3` (both), and no `targetCell` attributes in
  `android/app/src/main/res/xml/*` provider files after prebuild.
- **Styling invariants:** generator writes opaque cards `#fcfcfe`/`#1a1a5c`; pill PNGs carry no shadow and
  are 26dp tall; radius 16pt; layout pill height 26 anchored `-2`; footer bottom pad 16 on all 8 Android
  kinds; stale/neutral Android Columns center horizontally.
- **Alternatives rejected:** see section 4's last bullet; also "re-render only placed kinds" (done: empty id
  sets end the chain), "reboot-proof via persistent storage" (unnecessary: boot receiver re-arms).
- **Design review:** self-review against the code map above (roles collapsed, owner 2026-09-19), plus
  `vision` verification of every on-device claim in the prove pass.

## 6. Steps

- [ ] Step 1: mock resting state: Asr next at +3 minutes (specified)
- [ ] Step 2: opaque cards, shadowless 26dp pill, 16pt radius in the generator + PNGs (specified)
- [ ] Step 3: footer lift 16, pill vertical padding, stale/neutral centering in the shared layout (specified)
- [ ] Step 4: grid sizing 160/310dp + resizable + targetCell strip (specified)
- [ ] Step 5: native minute-refresh chain, modules/widgetrefresh (specified)
- [ ] Prove pass: mock build, place, screenshot every state, self-refresh + sizing proof, records

### Step 1: mock resting state

1. **Goal:** TODAY's six rows sit at Fajr -3, Sunrise -2, Dhuhr -1, Asr +3, Magrib +4, Isha +5 minutes from
   the download (Asr 180 to 239.999s away).
2. **Branch:** `git checkout -b mock/resting-state-15b uat-2`.
3. **Files:** `mocks/simple.ts`, `mocks/__tests__/simple.test.ts`.
4. **Tests first (red).** In `mocks/__tests__/simple.test.ts`, update the pinned case to: name "puts Asr
   next, 180 to 239.999 seconds after a download at %s, with Fajr, Sunrise and Dhuhr passed"; it proves the
   new resting offsets; inputs: the same download instants the file already sweeps; asserts: Asr epoch in
   [download+3min, download+4min), Fajr/Sunrise/Dhuhr epochs before the download and exactly one minute
   apart, Magrib/Isha exactly one and two minutes after Asr. Command:
   `npx jest mocks/__tests__/simple.test.ts --watchman=false --selectProjects=unit`. Expected red: the Asr
   window assertion fails against today's 60-119.999s seeding.
5. **Change.** In `buildTimes`: `asrAt` becomes the first whole minute at least 3 minutes after the download
   (`Math.ceil((downloadedAt.getTime() + 3 * MINUTE) / MINUTE) * MINUTE`); today's rows become
   `fajr: addMinutes(asrAt, -6), sunrise: -5, dhuhr: -4, asr: 0, magrib: +1, isha: +2`. Update the function's
   doc sentence to state the new anchors (Asr 3 minutes out; three passed rows before the download; two
   upcoming a minute apart). No other day changes.
6. **Green.** The command passes; `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.
7. **Breaks.** None for this step (a data fixture; the red-first row above is the proof). Run
   `git diff --stat` and confirm only the two files changed.
8. **Version and commit.** Next patch after uat-2 (`1.27.272`). Files: the two above. Message:
   `<VERSION> - mock resting state: Asr next at +3min, Fajr -3 / Sunrise -2 / Dhuhr -1, Magrib +4, Isha +5`.
9. **Review.** Self-review (roles collapsed): re-read the diff against part 5; check the mock dates comment
   block still tells the truth.
10. **Merge.** `git checkout uat-2 && git merge --no-ff mock/resting-state-15b -m "Merge mock/resting-state-15b into uat-2: session 15b step 1"`.
11. **Done when:** the suite passes and the commit hook's last `Tests:` line ends `passed, <n> total` with
    four `100%` coverage lines.

### Step 2: opaque cards, shadowless taller pill, sharper radius (generator)

1. **Goal:** the PNGs bake opaque cards, a shadowless 26dp pill, and a 16pt card radius.
2. **Branch:** `git checkout -b assets/widget-solid-15b uat-2`.
3. **Files:** `scripts/generate-widget-assets.py`, `shared/__tests__/widgetAssets.test.ts`, the regenerated
   `assets/widgets/*.png` (10 files, names unchanged).
4. **Tests first (red).** In `widgetAssets.test.ts`: replace the subset test's card handling with two
   exact-source pins, `CARD_LIGHT = css("#fcfcfe")` and `CARD_DARK = css("#1a1a5c")` present verbatim; pin
   `CARD_RADIUS_PT = 16` and `PILL_H = 26` verbatim; pin that the generator source contains no `shadow`
   spec key (assert `expect(generator).not.toContain('"shadow"')`); keep the subset relation for every other
   generator color literal (orbs, pill fills/strokes, moons). Expected red on today's generator.
5. **Change.** In the generator: `CARD_RADIUS_PT = 16`; `PILL_H = 26`; `CARD_LIGHT = css("#fcfcfe")`;
   `CARD_DARK = css("#1a1a5c")`; delete `shadow`/`shadow_radius`/`shadow_y` from all four `PILLS` specs;
   `pill()` drops the shadow pass and renders the rounded rect on a canvas of exactly `PILL_W x PILL_H`
   (margins gone). Update the module docstring's scale line (small 110dp, medium 250x110dp, pill 140x26dp).
   Run `python3 scripts/generate-widget-assets.py` and confirm it prints 10 `wrote` lines.
6. **Green.** The suite command
   `npx jest shared/__tests__/widgetAssets.test.ts --watchman=false --selectProjects=unit` passes; tsc and
   Biome exit 0.
7. **Breaks.** `perl -pi -e 's/CARD_RADIUS_PT = 16/CARD_RADIUS_PT = 22/' scripts/generate-widget-assets.py`
   must fail the radius pin; restore. Same for `PILL_H = 26` -> `22`.
8. **Version and commit.** `1.27.273`. Message:
   `<VERSION> - widget PNGs: opaque cards (alpha 1.0, glow kept), shadowless 26dp pill, 16pt card radius`.
9. **Review.** Self-review: PNG dimensions in the generator output (pill 420x78px at SCALE 3).
10. **Merge.** `git merge --no-ff assets/widget-solid-15b` with the step message.
11. **Done when:** 10 PNGs regenerated, suite green, hook green.

### Step 3: footer lift, pill padding, stale centering (layout)

1. **Goal:** uniform 16dp footer lift on all 8 Android kinds, 2dp pill vertical padding on both platforms,
   horizontally centered stale and neutral Android cards.
2. **Branch:** `git checkout -b widgets/layout-polish-15b uat-2`.
3. **Files:** `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetRenderer.test.ts` (and
   `widgetContract.test.ts` only if it pins a changed constant).
4. **Tests first (red).** Renderer rows to add/update (Android medium tree from an existing snapshot fixture):
   - "lifts the footer 16dp above the card bottom on every Android kind": asserts the small path's footer Row
     padding bottom = 16 and the medium outer Row padding bottom = 16 (light small, dark small, light medium,
     dark medium).
   - "pads the active pill 2dp above and below its row": the Android pill image height = 26 and the spacer
     above it = `max(0, activeIndex * 22 - 2)`; the iOS `ActivePill` frame height = 26 and offset =
     `activeIndex * 22 - 2`.
   - "centers the stale card and the neutral card": `AStale`/`ANeutral` render Columns with
     `horizontalAlignment: 'center'`.
   Expected red on today's layout (6/13/none/none respectively).
5. **Change.** Add `const FOOTER_BOTTOM_PAD = 16;` and `const PILL_VPAD = 2;` near `ROW_HEIGHT`. `ACard`:
   footer Row `APad(0, 0, 0, FOOTER_BOTTOM_PAD)`; content Box `APad(13, 13, 13, FOOTER_BOTTOM_PAD + 18)`.
   Medium outer Row `APad(13, 13, 20, FOOTER_BOTTOM_PAD)`. Android pill: spacer
   `height(Math.max(0, activeIndex * ROW_HEIGHT - PILL_VPAD))`, image
   `height(ROW_HEIGHT + 2 * PILL_VPAD)`. iOS `ActivePill`: `frame({ height: ROW_HEIGHT + 2 * PILL_VPAD })`,
   `offset({ y: activeIndex * ROW_HEIGHT - PILL_VPAD })` (keep the shadow modifiers untouched).
   `AStale` and `ANeutral` Columns gain `horizontalAlignment="center"`.
6. **Green.** `npx jest shared/__tests__/widgetRenderer.test.ts --watchman=false --selectProjects=unit`
   passes (whole renderer file, both platform suites); tsc and Biome exit 0.
7. **Breaks.** `perl -pi -e 's/FOOTER_BOTTOM_PAD = 16/FOOTER_BOTTOM_PAD = 6/' widgets/PrayerWidget.tsx`
   fails the footer row; restore. `perl -pi -e 's/PILL_VPAD = 2/PILL_VPAD = 0/' widgets/PrayerWidget.tsx`
   fails the pill row; restore.
8. **Version and commit.** `1.27.274`. Message:
   `<VERSION> - widget layout: uniform 16dp footer lift, 2dp pill vertical padding (Android shadowless, iOS keeps shadow), centered stale/neutral cards`.
9. **Review.** Self-review: iOS diff must touch ONLY `ActivePill`'s frame/offset (footer and stale stay).
10. **Merge.** `--no-ff widgets/layout-polish-15b`.
11. **Done when:** renderer suite green, hook green.

### Step 4: grid sizing 160/310dp, resizable, targetCell stripped

1. **Goal:** smalls request half the grid width and mediums the full width on any launcher; both resizable;
   `targetCell*` never reaches the manifest XML.
2. **Branch:** `git checkout -b widgets/grid-sizing-15b uat-2`.
3. **Files:** `app.json` (8 android blocks), `app.config.ts` (append the new plugin), new
   `plugins/androidWidgetGrid.js`, `shared/__tests__/flags.test.ts`, new
   `shared/__tests__/androidWidgetGrid.test.ts`.
4. **Tests first (red).**
   - `flags.test.ts`: update the pinned android block to
     `{"minWidth":160,"minHeight":110,"resizeMode":"both","initialLayout":"./widgets/PrayerWidget"}` for
     small kinds and `minWidth 400` for mediums; assert no `targetCell` keys remain.
   - New `androidWidgetGrid.test.ts`: requires `plugins/androidWidgetGrid.js`, fabricates
     `<root>/android/app/src/main/res/xml/prayer_widget_provider.xml` containing
     `android:targetCellWidth="2" android:targetCellHeight="2" android:minWidth="160dp"`, runs the mod
     (same harness as `widgetAssets.test.ts`'s plugin case), asserts the file afterwards has no
     `android:targetCell` attributes, `minWidth` intact, and a second run is a no-op.
5. **Change.** `app.json`: all four small kinds `minWidth 160, minHeight 110, resizeMode "both"` (drop
   `targetCellWidth/Height`); all four medium kinds `minWidth 400, minHeight 110, resizeMode "both"`.
   New `plugins/androidWidgetGrid.js`: `withDangerousMod('android')` that, after prebuild, walks
   `android/app/src/main/res/xml/*.xml`, and in every file containing `<appwidget-provider` removes
   `android:targetCellWidth="..."` and `android:targetCellHeight="..."` attributes (regex, one pass,
   idempotent). `app.config.ts` `enableAndroidWidgets`: append `'./plugins/androidWidgetGrid'` after
   `'./plugins/androidWidgetAssets'`.
6. **Green.** Both suites pass; tsc and Biome exit 0.
7. **Breaks.** Rename the strip regex's target attribute string (`targetCellWidth` -> `targetCellWidthX`) in
   a copy: the new test must fail (attribute survived); restore.
8. **Version and commit.** `1.27.275`. Message:
   `<VERSION> - widget sizing: small 160dp (half grid), medium 400dp (full grid), resizable both axes, targetCell attrs stripped for grid-agnostic placement`.
9. **Review.** Self-review: app.config.ts diff is one line; plugin file mirrors androidWidgetAssets.js's
   shape.
10. **Merge.** `--no-ff widgets/grid-sizing-15b`.
11. **Done when:** suites green; after the prove-pass prebuild, `grep -r targetCell android/app/src/main/res/xml/` prints nothing.

### Step 5: native minute-refresh chain

1. **Goal:** placed widgets re-render every minute with no app process, and every Android push arms the
   chain.
2. **Branch:** `git checkout -b widgets/native-refresh-15b uat-2`.
3. **Files:** new `modules/widgetrefresh/` (`expo-module.config.json`, `android/build.gradle`,
   `android/src/main/AndroidManifest.xml`, `android/src/main/java/expo/modules/widgetrefresh/{WidgetRefreshModule.kt,WidgetRefreshScheduler.kt,WidgetRefreshReceiver.kt,WidgetRefreshBootReceiver.kt}`,
   `index.ts`), `stores/widget.ts`, new `shared/__tests__/widgetRefreshChain.test.ts`.
4. **Tests first (red).** New `widgetRefreshChain.test.ts` (pattern from `flags.test.ts`'s platform/flag
   isolation): mock `@/modules/widgetrefresh` with a jest.fn; `refreshPrayerWidgets()` with
   `Platform.OS = 'android'` and `androidWidgets` flag on calls `armWidgetRefreshChain` exactly once;
   with the flag off, or `Platform.OS = 'ios'`, it is never called. Expected red: the module does not exist.
5. **Change.**
   - `modules/widgetrefresh/index.ts`: `import { requireOptionalNativeModule } from 'expo';` export
     `armWidgetRefreshChain = (): void => requireOptionalNativeModule('ExpoWidgetRefresh')?.armWidgetRefreshChain?.();`
   - `WidgetRefreshScheduler.kt` (internal object): `HOME_KINDS = listOf("PrayerWidget", "ExtrasWidget",
     "PrayerWidgetMedium", "ExtrasWidgetMedium", "PrayerWidgetDark", "ExtrasWidgetDark",
     "PrayerWidgetDarkMedium", "ExtrasWidgetDarkMedium")`; `placedIds(context): IntArray` (union of
     `AppWidgetManager.getAppWidgetIds(ComponentName(pkg, "${pkg}.${kind}Provider"))`); `fun
     updateAll(context)` sends one explicit `ACTION_APPWIDGET_UPDATE` broadcast per kind that has ids
     (`EXTRA_APPWIDGET_IDS`); `fun ensureArmed(context)`: if
     `PendingIntent.getBroadcast(..., FLAG_NO_CREATE or FLAG_IMMUTABLE)` is null, `armNext`;
     `fun armNext(context)`: `setExactAndAllowWhileIdle(RTC_WAKEUP, nextMinuteEdge(), pi)` where
     `nextMinuteEdge()` is the next wall minute + 1000ms (skip forward a minute if < 500ms away); on
     `SDK_INT >= 31 && !canScheduleExactAlarms()` fall back to `setAndAllowWhileIdle`. PendingIntent intent
     targets `WidgetRefreshReceiver`, `FLAG_UPDATE_CURRENT or FLAG_IMMUTABLE`.
   - `WidgetRefreshReceiver.kt`: `onReceive` -> `updateAll`; if `placedIds` is non-empty, `armNext` (the
     chain dies when the last widget is removed; the next app open re-arms).
   - `WidgetRefreshBootReceiver.kt`: `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED` -> if `placedIds`
     non-empty, `updateAll` + `armNext`.
   - Module manifest (module's own `AndroidManifest.xml`, manifest-merged like tls13's provider): the two
     receivers, `exported="false"`, boot receiver with the two intent-filter actions.
   - `WidgetRefreshModule.kt`: `Name("ExpoWidgetRefresh")`, `Function("armWidgetRefreshChain") {
     ensureArmed(appContext!!) }`.
   - `expo-module.config.json` + `build.gradle` mirror tls13 (namespace `expo.modules.widgetrefresh`,
     no extra dependencies; `expo-modules-core` only).
   - `stores/widget.ts`: in `refreshPrayerWidgets`'s Android branch, after both `pushScheduleAndroid`
     awaits, `try { armWidgetRefreshChain(); } catch { /* surfaces stay best-effort */ }` with the import
     from `@/modules/widgetrefresh` (lazy-require pattern used for widget layouts is NOT needed: the module
     has no side effects on import).
6. **Green.** New suite passes; `npx tsc --noEmit` and Biome exit 0.
7. **Breaks.** `perl -pi -e 's/armWidgetRefreshChain\(\);/armWidgetRefreshChain(); if (false)/' stores/widget.ts`
   fails the called-once row; restore.
8. **Version and commit.** `1.27.276`. Message:
   `<VERSION> - Android widgets self-refresh: exact-alarm minute chain (native receiver + boot re-arm + JS arm after every push)`.
9. **Review.** Self-review against section 5's invariants: no JS runtime started, no new permissions, chain
   dies with zero placed widgets, `MY_PACKAGE_REPLACED` re-arms after updates.
10. **Merge.** `--no-ff widgets/native-refresh-15b`.
11. **Done when:** suite green, hook green, and the prove pass shows the label advancing with the app killed.

## 7. Device proof (the prove pass; screenshots for the owner)

Build: `zsh ~/athan-device-sweep/session15/bin/build-mock-widgets.zsh uat-2
~/athan-device-sweep/session15b/mocks-resting.ts ~/athan-device-sweep/session15b/athan-mock-15b.apk` where
`mocks-resting.ts` is the repo's `mocks/simple.ts` at uat-2 tip (copied out after step 1). Success ends
`BUILD-MOCK OK`. Install: `adb -s 8f7ada76 install -r <apk>` (fleettest package, keeps data).

Placement (atlas mechanics): long-press home -> WIDGETS (539, 1675) -> Athan strip -> place one of each:
NP Light small, NP Dark small, NP Light medium, NP Dark medium, ET Light medium on a clean page. Screenshot
after each placement into `~/athan-device-sweep/session15b/shots/`:
`01-place-small-light.png`, `02-place-small-dark.png`, `03-place-medium-light.png`,
`04-place-medium-dark.png`, `05-place-medium-extras.png`.

Checks, each saved under `~/athan-device-sweep/session15b/`:
1. **Sizing:** `vision` measures the placed small and medium bounding boxes from `03/01`. Expected: small
   3 columns (567px on the 3T), medium 5 columns (973px). Also `adb shell dumpsys appwidget | grep -A1
   'fleettest'` shows `min=(40961x28161)` smalls / `(102401x28161)` mediums and `resizeMode=3`. Long-press a
   medium and screenshot the resize handles: `06-resize-handles.png`.
2. **Styling:** `vision` reads `01..05`: cards fully opaque (no wallpaper bleed-through), dark cards keep
   the orbs, pill extends 2dp above/below its row with no shadow, footer one uniform height across all,
   corners sharper than session 15's.
3. **Resting state:** launch the fleettest app once (mocks seed at download), HOME, screenshot
   `07-resting-launcher.png`: Asr next with a ~3m label; rows before it dimmed.
4. **Self-refresh:** `adb shell am kill com.mugtaba.athan.fleettest`; screenshot `08-refresh-t0.png`;
   background-wait 80s (loop of `sleep 15`); screenshot `09-refresh-t1.png`. `vision` confirms the label
   moved down one minute (e.g. 3m -> 2m) and `adb shell pidstat`/`ps -A | grep fleettest` shows no app
   process. If the label froze: STOP, ask the owner.
5. **Stale state:** read `adb shell dumpsys alarm | grep -A2 'fleettest'` and list every alarm; then
   `settings put global auto_time 0`, jump the clock +15 days (`service call alarm 2 i64 <epoch ms>`),
   screenshot `10-stale-centered.png` (centered text), restore `auto_time 1` and the real clock
   (`service call alarm 2 i64 <real epoch ms>`), re-screenshot `11-restored.png`.
6. **Clock safety:** before any jump, the dump list is compared; every armed fleettest alarm fired by a +15d
   jump belongs to this app's mock build and is acceptable; the year-2036 system alarm (`when
   2104803640505`) is untouched by a forward jump. Never touch the real app's data or clock beyond this.

Phone left on: the fleettest mock build, automatic time ON, widgets placed on one clean page for the owner.

iOS (stretch, only if the XS is connected, `xcrun devicectl list devices`): prebuild with
`EXPO_PUBLIC_WIDGETS=1 EXPO_PUBLIC_ENV=local`, release build with `DEVELOPMENT_TEAM=9V3WAU9Z54`, install on
the XS, screenshot the small + medium placements (pill padding is the visible delta). If the XS is absent,
record it in `LOG.md` and move on.

At the end: copy the screenshot set to `~/athan-device-sweep/session15b/shots/` (final names), `open` the
folder for the owner, and list every path in the report (owner instruction 2026-09-19).

## 8. Records

- **Findings text** for `ai/features/uat-2/AUDIT-FINDINGS.md`, under "Session 15b of the queue":
  session 15b delivered the owner's 8 widget rulings (opaque cards, uniform footer, padded shadowless pill,
  16pt radius, 160/400dp grid-agnostic sizing with resizable kinds, centered stale card, Asr+3m mock
  resting state, and the native exact-alarm minute-refresh chain), proven on the 3T with placed widgets
  screenshot across all states; measurements `<SMALL_PX>`px small (3 of 5 columns) and `<MEDIUM_PX>`px
  medium (5 of 5 columns); self-refresh label advance `<T0_LABEL>` -> `<T1_LABEL>` over 80s with no app
  process.
- **Table rows.** Executor sets the `ai/plans/README.md` row to EXECUTED. On PASS the auditor sets the
  `ai/prompts/README.md` 15b row cell to: `DONE 2026-09-19 (session 15b): all 8 rulings shipped, 3T-proven;
  iOS XS verification pending/present`.
- **Docs commit.** `<VERSION> - docs(plans): session 15b executed: widget polish + self-refresh + sizing, 3T-proven`.
- **Memory.** Add one Recent Decisions entry to `ai/AGENTS.md` for the native refresh chain (durable
  behavior) at audit time.

## 9. Push

The executor never pushes. This session's audit phase (same agent, roles collapsed) pushes `uat-2` after its
PASS verdict, per the owner's 2026-09-19 instruction to run the whole queue step end to end.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| Placement lands 2 or 4 columns, not 3/5 | launcher clamps differently | Collect the dumpsys minWidth line and the vision measurements; STOP and ask the owner with the numbers |
| Widget shows "Loading widget" after placement | R8 strip (session 15's lesson) | Confirm the proguard keeps are in `app.json` (they are); rebuild; second failure STOP |
| Label frozen after `am kill` | receiver not manifest-merged or alarm not armed | `aapt dump xmltree <apk> AndroidManifest.xml | grep -i refresh`; check `dumpsys alarm | grep fleettest`; STOP with findings |
| `uiautomator dump` empty | countdown animating | Use screenshots + `vision` only |
| Clock jump misbehaves | armed alarms | `dumpsys alarm` first; restore `auto_time 1` and real clock immediately; STOP if anything unexplained fired |
| A test the plan did not name fails | plan defect | STOP and ask |

Anticipated review fixes (self-review findings applied without asking, per EXECUTOR-BRIEF 4.8's conditions):
comment wording in the generator/module files; import order (Biome autofix); a missed `max(0, ...)` clamp
site. Stopping part-way: `git checkout --` this step's files plus `app.json`/`package.json`, delete new
files, drop the step branch.

## 11. Subagents in this plan

| Step | Agent | Model | Isolation | Why |
| --- | --- | --- | --- | --- |
| Prove pass | `vision` | GLM 5.3 Flash | read-only on screenshot paths | every image measurement and styling verdict; the executor cannot see images |
| Reviews | none (self-review, recorded in `LOG.md`) | GLM 5.3 | same tree | owner restricted subagents to `vision`, 2026-09-19 |

## 12. Report to the owner

Starts `🤖  Model: GLM 5.3 (execution session)` and a `Time:` line. What changed (the 8 rulings), what was
proven on the 3T, the screenshot paths (opened), any decision waiting, then the four-line handoff.
