# Plan: Session 15. Android home-screen widgets

| Field | Value |
| --- | --- |
| Brief | `ai/plans/SDK58-PROGRAMME.md` §15 |
| Planned at | `0ec4fe70` (version 1.27.241), 2026-09-18 |
| Planned by | Planning session on 2026-09-18, GLM 5.3 |
| Needs first | 6 |
| Steps | 7, each one branch, one commit, one version |
| Device | OnePlus 3T (8f7ada76), local production + mock builds with `EXPO_PUBLIC_ANDROID_WIDGETS=1` |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

Note on form (owner instruction, 2026-09-18): the owner ordered this session planned, executed and audited by the
main agent with no phase subagents (only `vision` for images). The executor is therefore the planning session itself,
warm on the research; anchors are inlined in section 4 instead of a `scripts/anchors/` tree, and the step reviews are
self-reviews recorded in `LOG.md`. Every contract, test, acceptance criterion and break below is binding on that
executor exactly as if a cold session ran it.

## 1. Goal

Today the app ships eight iOS home-screen widget kinds (standard/extras, small/medium, light/dark) and no Android
widgets: `expo-widgets` on Android was unavailable until SDK 58, `stores/widget.ts` early-returns unless
`Platform.OS === 'ios'`, and `app.config.ts` strips the plugin entirely when the `widgets` flag is off. When this plan
is DONE, an Android build with `EXPO_PUBLIC_ANDROID_WIDGETS=1` offers the SAME eight widget kinds in the launcher
widget picker with the same display names, the same Light/Dark split, the same "Cotton Candy"/"Violet Dusk" styling
(the palette literals byte-identical; orbs, pill, rounded card and stale moon delivered as pre-rendered PNG assets
baked from those literals, which the owner approved on 2026-09-18 as a trial to be judged visually), content computed
at render time so every render is correct without new data, refreshed while the app runs at each minute flip, by the
existing background task every few hours with the app closed, and degrading to the iOS-parity "Out of date" stale card
once the 14-day data horizon passes. The owner notices by long-pressing the 3T home screen and finding "Next Prayer
(Light)" through "Extra Times (Dark)" under the Athan app, looking exactly like their iPhone widgets.

Owner rules that apply:

- 🐋 "I want 8 widgets total, exactly the same as the iOS widget styling, the same the exact same setup as the iOS
  widgets, okay? It's exact same styling." (2026-09-18)
- 🐋 "I think we should create an Android Widgets flag, and we want to turn it off by default... the same behaviour as
  iOS. So we can enable and disable each 1 individually." (2026-09-18)
- 🐋 On frozen widgets: "if it's completely killed [show] the stale card... I like the 14 day... before showing the
  stale cards... the goal is to not make the user need to open the app." (2026-09-18)
- 🐋 On PNG assets: "Let's try option number 1 and see how it works for us and I'll tell you if it's good or not. Same
  with performance, of course. We want to be 60 FPS. minimum 30 FPS." (2026-09-18)
- Visuals are settled; no pixel changes without the owner's approval (`ai/AGENTS.md` absolute rules).
- Version bump on every commit in both `app.json` and `package.json`; `releases.json` untouchable; EAS read-only.

## 2. Decisions

### 2.1 Taken

1. **A second feature flag `androidWidgets`** (env `EXPO_PUBLIC_ANDROID_WIDGETS`, `'1'` enables, off by default),
   same lifecycle and fail-direction as the iOS `widgets` flag; each platform toggles independently. Owner, 2026-09-18.
2. **Android widgets ship behind the flag in this session**; the owner flips and releases it after judging the 3T
   screenshots. Owner, 2026-09-18.
3. **Snapshot model, not timelines**: Android `updateTimeline` is a no-op in expo-widgets 58.0.3; the app pushes one
   snapshot per kind (`updateSnapshot`) carrying 14 days of derived data, and the layout computes what to show AT
   RENDER TIME (label, active row, day list, staleness). Planner, from source: `Widgets.ts:53-72`,
   `WidgetsLayoutRegistry.kt`, `ExpoWidgetsPeekWidget.kt`.
4. **Refresh cadence**: while the app runs, the existing per-schedule label-flip timers trigger `reload()` at each
   minute flip (no data rebuild needed; render recomputes). With the app closed, the existing background task's
   `sync()` path re-pushes snapshots on its ~3-6h cadence (WorkManager; survives reboot; never needs the app opened).
   Force-stop freezes the last frame (Android kills WorkManager; same class as iOS force-quit). Planner + owner
   discussion 2026-09-18.
5. **Stale semantics**: any render at `Date.now() > horizonEpochMs` shows the stale card ("Out of date / Open Athan /
   to refresh", moon mark), matching the iOS terminal entry. Horizon = 14 days of carried data, same constant as iOS.
   Owner liked the 14-day minimum; extending beyond 14 days is queue row 10 (session 17), whose brief the owner asked
   to widen to "user never opens the app" (recorded in section 8).
6. **Styling parity method**: palette literals byte-identical inside the one shared layout function; Glance cannot
   draw blur/stroke/shadow/letter-spacing/medium/semibold, so the dark-theme orbs, both themes' rounded translucent
   card, the active pill and the stale moon icon ship as PNG assets generated from the same literals by a committed
   Python/Pillow script. Two accepted text deltas: medium/semibold weights render as regular, no letter-spacing.
   Owner approved as a trial, 2026-09-18.
7. **One layout function, dual-platform shim inside the body**: iOS resolves `@expo/ui/swift-ui` globals, the Android
   widget runtime resolves `@expo/ui/jetpack-compose` globals (verified: `bundle/index.ts` assigns
   `ui-globals.android.ts` exports onto `globalThis`). The composition is written once against local shim components
   that branch on `typeof Column !== 'undefined'`. The iOS render path stays byte-identical in behavior.
   Planner, spike-verified 2026-09-18.
8. **Config plumbing**: app.json gains `android` blocks on the 8 home kinds (2x2 and 4x2, `resizeMode: none`,
   `initialLayout: './widgets/PrayerWidget'`); the lock kinds get `android: null`. `app.config.ts` resolves an
   android-only config (argv signal `'android'` present without `'ios'`, spike-verified CLI form, plus
   `EXPO_WIDGETS_ANDROID=1` env override; belt for non-CLI resolvers) when `androidWidgets` is on: plugin kept,
   `enableAndroid: true`, `config.ios` dropped so the plugin's iOS side cannot generate anything. When the flag is
   off, every resolution strips the plugin exactly as today. Planner, spike-verified 2026-09-18.
9. **Sizing**: small = `targetCellWidth 2, targetCellHeight 2, minWidth 110dp, minHeight 110dp`; medium =
   `targetCellWidth 4, targetCellHeight 2, minWidth 250dp, minHeight 110dp`; both `resizeMode none`. Planner, from
   Android widget size guidance; matches iOS fixed-size kinds.
10. **Images by drawable resource**: PNGs land in `android/app/src/main/res/drawable-nodpi/` via a small local config
    plugin (pattern: `plugins/portraitOnlyIpad.js`) copying from `assets/widgets/`; the layout references them by bare
    drawable name (`resolveDrawableId` path in `WidgetImageLoader.kt`). No runtime staging, no new dependencies.
    Planner 2026-09-18 (`expo-file-system` absent from the tree ruled out the `widgetsDirectory` copy route).
11. **Medium/small detection on Android**: environment carries no `widgetFamily` (`WidgetsUtils.getWidgetEnvironment`
    provides only `colorScheme`, `configuration`, `materialColors`), so every snapshot stamps `size: 'small' |
    'medium'`, which the push layer knows per kind. Planner, from source.
12. **Day list on Android**: shows the day containing the render instant (per-day 00:00 London boundary epochs carried
    in props). London real data never triggers the held-day edge cases (DASHES §8); if the picked day has no rows or
    no active row, the layout falls back to the hero-only composition, the same fallback the iOS layout already has.
    Planner 2026-09-18.
13. **iOS untouched**: the iOS branch of the layout, the iOS push paths, and flag-off iOS codegen remain byte-identical
    in behavior; spike-verified (`prebuild -p ios` with the flag off produces zero widget artifacts).

### 2.2 The executor must not decide

1. Any anchor (inlined in section 4) counting other than 1 in the named file: STOP, ask "The plan does not say which
   of the multiple matches to edit. What should it be?"
2. A test failing that the plan does not predict, or a named test passing in its red phase: STOP with the output.
3. A break printing `BREAK NOT APPLIED`: STOP (both briefs depend on that exact string).
4. Any need to change visuals beyond this plan's spec, substitute a prayer time, touch `releases.json`, `uat`, or EAS:
   STOP and ask.
5. Anything about the PNG appearance the generation spec in step 6 does not answer (positions, radii, colors): STOP and
   ask; do not guess styling values, they are the owner's.
6. If `yarn test:tz` fails after step 3 or 5: STOP with the failing zone.
7. If the 3T build fails on the AGP/Gradle mismatch documented in `ai/AGENTS.md`: STOP and report; do not switch to
   EAS or another build path.

## 3. Pre-flight

Saved to `scripts/preflight.sh` in this folder and run as
`bash ai/plans/15-android-widgets/scripts/preflight.sh <k>`:

- pwd is `/Users/muji/repos/rn.athan.uk`, branch `uat-2`, `git status --porcelain` clean except
  `ai/plans/README.md` and this folder;
- `git fetch origin uat-2` then `git merge-base --is-ancestor origin/uat-2 uat-2` exits 0;
- `package.json` version printed, at least `1.27.241`;
- row 6 status is DONE in `ai/plans/README.md`;
- `adb -s 8f7ada76 get-state` prints `device` (steps 6-7 only);
- `python3 -c "import PIL"` exits 0 (step 6 only);
- inline anchors from section 4 each count 1 via the Python count method.

Ends `PREFLIGHT OK`.

## 4. Background the executor needs

Code map (all paths repo-relative; anchors verbatim, each must count 1 in the named file at `uat-2` = `0ec4fe70`):

- `app.json` lines 195-258: the `expo-widgets` plugin entry; 10 widgets, each with only an `ios` block. Anchor A1
  (the first home kind):
  ```
            {
              "name": "PrayerWidget",
              "displayName": "Next Prayer (Light)",
              "description": "A countdown to the next prayer.",
              "ios": { "supportedFamilies": ["systemSmall"], "contentMarginsDisabled": true }
            },
  ```
- `app.config.ts` lines 21-33 (anchor A2):
  ```
  const widgetsEnabled = process.env.EXPO_PUBLIC_WIDGETS === '1';
  const pluginName = (plugin: unknown): string | null => {
    if (typeof plugin === 'string') return plugin;
    if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
    return null;
  };

  if (!widgetsEnabled) {
    config.plugins = (config.plugins ?? []).filter((plugin) => pluginName(plugin) !== 'expo-widgets');
  }
  ```
- `shared/flags.ts` end of `FEATURE_FLAGS` (anchor A3):
  ```
  widgets: process.env.EXPO_PUBLIC_WIDGETS === '1',
} as const;
```
- `.env.example` contains `EXPO_PUBLIC_WIDGETS=` (the mirror-test reads it; the flag catalog line is appended near it).
- `stores/widget.ts`: the whole file is the map; anchors: A4 gate at line 317
  `if (Platform.OS !== 'ios' || !FEATURE_FLAGS.widgets) return;` and A5 the standard push block at lines 274-281.
- `widgets/PrayerWidget.tsx`: 490 lines; anchor A6 the eight `createWidget` exports at lines 483-490; anchor A7 the
  props/neutral guard at line 203 `if (props == null) {`; anchor A8 `const isMedium =
  environment.widgetFamily === 'systemMedium';`.
- `shared/widgetTimeline.ts`: pure builder (354 lines), reused unchanged; new sibling functions join it.
- `shared/widgetTypes.ts`: `WIDGET_PROPS_VERSION = 4` (line 14) and `PrayerWidgetProps` (lines 55-117); new types join.
- `shared/__tests__/widgetContract.test.ts`: closure test auto-allows imports from `@expo/ui/` sources
  (`collectExpoUiRuntimeGlobals`); palette anchors list at lines 202-242; the stores/widget.ts require-shape test at
  lines 325-353.
- `shared/__tests__/flags.test.ts`: loads `app.config.ts` expecting an object default (`loadAppConfigFresh`); changes
  with step 1.
- `device/listeners.ts` and `stores/sync.ts`: call `refreshPrayerWidgets()` and `initWidgetSettingsSync()`; read only.
- `.agents/skills` not involved. `plugins/` currently holds `portraitOnlyIpad.js` (pattern for the new asset plugin).

How the pieces interact:

| Caller | Today | After |
| --- | --- | --- |
| `stores/sync.ts` after cache write | calls `refreshPrayerWidgets()` (no-op off iOS) | same call; on Android with flag on, rebuilds sequences and pushes 8 snapshots |
| `stores/notifications.ts` `_rescheduleAllNotifications` | calls `refreshPrayerWidgets()` | unchanged |
| background task body | `await sync()` headlessly | same; the sync-driven push now refreshes Android widgets with the app closed |
| per-schedule flip timers (foreground) | re-push 5 iOS kinds per schedule per minute | Android branch calls `reload()` on that schedule's 4 home kinds instead (render recomputes) |
| launcher render (Glance `provideRoot`) | n/a | reads stored layout + snapshot props from SharedPreferences, evaluates in Hermes, converts to Glance |
| reboot / resize / launcher restart | n/a | Android re-runs `provideRoot`; render-time computation self-heals from the stored snapshot |

Existing tests that cover this code: `widgetContract.test.ts` (closure, palette, static imports, one directive),
`widgetSimulation.test.ts` (virtual-week model over the builder), `flags.test.ts` (flag parse + app.config mirror),
`versionLockstep.test.ts` (three-file version sync). `yarn test:tz` covers the date paths the builder shares.

Why the obvious simpler fix is wrong: pushing `entries[0].props` (the iOS first entry) per kind would freeze labels
between renders because the label is precomputed for the push instant; render-time computation from carried epochs is
what makes every render truthful without the app running, which is the owner's stated goal.

## 5. Design

- **Invariant (one sentence a test can check):** for every instant T within the carried 14-day window, evaluating the
  Android layout with the snapshot props and a mocked `Date.now() = T` yields the same next prayer, countdown label,
  day list and active row that `buildPrayerWidgetTimeline(now=T, ...)` produces for iOS at T; for T beyond
  `horizonEpochMs` it yields the stale card.
- **Alternatives rejected:** pushing per-minute snapshots forever (JS dies with the process); native boundary alarms
  (new module, battery cost, owner deferred); hiding the label when data is old (a frozen display cannot re-evaluate
  the rule, so it fails its purpose); PNG-free flat styling (owner wants exact iOS look); runtime asset copy to
  `widgetsDirectory` (needs `expo-file-system`, absent).
- **Concurrency trace:** all pushes stay on the JS thread via `WidgetObject`/`WidgetsUpdater` (mutex-serialized
  coroutine per name); the flip timers remain per-schedule `setTimeout` chains, Android branch arming the same chain
  with `reload()`; `updateSnapshot` writes SharedPreferences synchronously then enqueues the reload.
- **Design review:** planner self-review against the source map (the "reviewer" role is this session's own, per the
  owner instruction): checked that `updateSnapshot` persists props as one JSON map (`WidgetsJson`), that the widget
  process is the app process (no app group needed on Android), that `resolveDrawableId` needs bare names with no
  scheme, and that the registry build imports `initialLayout` by absolute path resolved from the project root
  (verified in the spike; symlinked `node_modules` breaks the script's self-invocation guard, so builds run from the
  main checkout only).

## 6. Steps

Checklist (the executor ticks as it goes, in `LOG.md`):

- [ ] Step 1: `androidWidgets` flag + config plumbing (specified)
- [ ] Step 2: pure Android snapshot builder (specified)
- [ ] Step 3: dual-platform layout with Android composition (specified)
- [ ] Step 4: renderer tests, both platforms (specified)
- [ ] Step 5: push layer + flip timers (specified)
- [ ] Step 6: widget PNG assets + config plugin + drawable names (specified)
- [ ] Step 7: docs + queue records (specified)

### Step 1: `androidWidgets` flag + config plumbing

1. **Anchor check:** A1 in `app.json`, A2 in `app.config.ts`, A3 in `shared/flags.ts`.
2. **Branch:** `git checkout -b feat/android-widgets-flag uat-2`.
3. **Files:** `shared/flags.ts`, `.env.example`, `app.config.ts`, `app.json`, `shared/__tests__/flags.test.ts`.
4. **Tests first (red):** extend `shared/__tests__/flags.test.ts`:
   - `FEATURE_FLAGS.androidWidgets parsing mirrors widgets` — proves the new flag parses exactly `'1'`; sets env to
     `undefined`, `'0'`, `'1'`, `'yes'`; asserts false/false/true/false.
   - `app config android resolution enables expo-widgets codegen when the android flag is on` — calls the (now
     function) default export with `{ platform: 'android' }` after setting `process.argv` tokens `['prebuild',
     'android']` and `EXPO_PUBLIC_ANDROID_WIDGETS='1'`; asserts the `expo-widgets` plugin entry exists with
     `enableAndroid: true` and `config.ios === undefined`.
   - `app config android resolution strips expo-widgets when the android flag is off` — same argv, env deleted;
     asserts the plugin is absent.
   - `app config ios resolution is unchanged by the android flag` — argv `['prebuild','ios']`, android flag on, iOS
     flag off; asserts plugin absent; then iOS flag on; asserts plugin present without `enableAndroid` and
     `config.ios` intact.
   `loadAppConfigFresh` changes to call the export as a function with the context object. Run:
   `npx jest shared/__tests__/flags.test.ts --watchman=false --selectProjects=unit`. Red: the two new resolution
   tests fail (`config.plugins` filter is not a function output / plugin absent), names printed by Jest.
5. **Change.** All `(specified)`:
   - `shared/flags.ts`: add `androidWidgets: process.env.EXPO_PUBLIC_ANDROID_WIDGETS === '1'` with JSDoc naming the
     flip condition: "on once the owner judges the 3T styling and performance proof (session 15) and releases it;
     delete with the flag lifecycle when stable". Update the file header sentence "This file is not the only reader".
   - `.env.example`: add `# Android home-screen widgets (expo-widgets Android). Off unless exactly 1.` and
     `EXPO_PUBLIC_ANDROID_WIDGETS=` beside the widgets line.
   - `app.config.ts`: replace A2 with the platform-split resolution exactly as spike-tested (argv token scan for
     `'android'` without `'ios'`, `EXPO_WIDGETS_ANDROID === '1'` override, `enableAndroidWidgets` also deleting
     `config.ios`, flag gating both directions, iOS branch byte-equivalent in behavior to today). The export becomes
     `export default ({ platform }: ConfigContext): ExpoConfig => ...` returning the object; the build-contract
     throw stays module-level.
   - `app.json`: add to each of the 8 home kinds an `android` block: small kinds
     `{"minWidth":110,"minHeight":110,"targetCellWidth":2,"targetCellHeight":2,"resizeMode":"none","initialLayout":"./widgets/PrayerWidget"}`
     and medium kinds `{"minWidth":250,"minHeight":110,"targetCellWidth":4,"targetCellHeight":2,"resizeMode":"none","initialLayout":"./widgets/PrayerWidget"}`;
     add `"android": null` to the two lock kinds.
   - Log line: none new.
6. **Green:** the named suite passes (`Tests: 6 passed, 6 total` or the full count if unrelated suites in the file
   run); `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0.
7. **Breaks:** `bash ai/plans/15-android-widgets/scripts/breaks-1.sh` with three perl substitutions:
   (a) in `app.config.ts` `enableAndroid: true` to `enableAndroid: false` expecting the android-on test to fail;
   (b) in `shared/flags.ts` `EXPO_PUBLIC_ANDROID_WIDGETS` to `EXPO_PUBLIC_ANDROID_WIDGET` expecting the parsing test
   to fail; (c) in `app.json` `"targetCellWidth": 2` to `"targetCellWidth": 3` expecting no named test to fail (the
   plan adds no app.json schema test; the break is recorded as intentionally not caught and the script prints
   `ALL AS EXPECTED: 1` only if breaks (a) and (b) fail their tests and (c) is reported as not caught — the executor
   adds the app.json shape assertion to the flags suite in the same commit so (c) fails too; if it cannot, STOP).
8. **Version and commit:** next patch after `uat-2`; add the five files; commit
   `<VERSION> - feat: androidWidgets flag, app config platform split, widget android blocks`.
9. **Review (self, recorded in LOG.md):** re-read the diff as a stranger: iOS flag-off behavior byte-identical; argv
   scan cannot fire on `prebuild ios`; JSON valid (parse with `node -e "JSON.parse(require('fs').readFileSync('app.json','utf8'))"`).
10. **Merge:** `git checkout uat-2 && git merge --no-ff feat/android-widgets-flag -m "Merge feat/android-widgets-flag into uat-2: session 15 step 1"`.
11. **Done when:** `npx expo config --json --type prebuild 2>/dev/null | head -1` exits 0 from the main checkout with
    no env (flag off, no argv platform: plugin stripped, file unchanged behavior).

### Step 2: pure Android snapshot builder

1. **Anchor check:** `shared/widgetTypes.ts` line 14 `export const WIDGET_PROPS_VERSION = 4;` and the file tail
   `stale?: boolean;\n}` count 1 each.
2. **Branch:** `feat/android-widget-snapshot`.
3. **Files:** `shared/widgetTypes.ts`, `shared/widgetTimeline.ts`, `shared/__tests__/widgetSnapshot.test.ts` (new).
4. **Tests first (red):** new suite `widgetSnapshot.test.ts`, modelled on `widgetSimulation.test.ts` fixtures:
   - `carries every readable prayer of the window with epoch, name and time` — inputs: the virtual-week standard
     fixture; asserts `days` length, first day = yesterday London, rows chronological, every `epochMs` matches the
     sequence's `datetime.getTime()`, `--:--` rows carry `epochMs: null`.
   - `horizon is the last readable prayer in the window` — asserts `horizonEpochMs` equals the final readable
     prayer's epoch.
   - `stamps schedule, theme, size and version` — asserts the four fields round-trip.
   - `day boundaries are London midnights` — asserts each day's `startEpochMs` is 00:00 Europe/London of its date.
   - `dateLabel honors the hijri preference` — hijri true and false; asserts the precomputed labels match
     `formatHijriDateLong` / `formatDateLong` outputs for the day's date.
   - `empty sequence yields null` — asserts the builder answers `null` when no readable prayer exists (callers skip
     the push).
   Red run command: `npx jest shared/__tests__/widgetSnapshot.test.ts --watchman=false --selectProjects=unit`;
   red failure: suite fails to resolve the not-yet-written `buildPrayerWidgetSnapshot` export.
5. **Change.**
   - `shared/widgetTypes.ts` adds, with JSDoc mirroring the file's existing style:
     - `export const ANDROID_SNAPSHOT_VERSION = 1;`
     - `export interface AndroidWidgetDayRow { name: string; time: string; epochMs: number | null; }`
     - `export interface AndroidWidgetDay { dateLabel: string; startEpochMs: number; rows: AndroidWidgetDayRow[]; }`
     - `export interface PrayerWidgetAndroidProps { v: number; schedule: 'standard' | 'extra'; theme: WidgetTheme;
       size: 'small' | 'medium'; days: AndroidWidgetDay[]; horizonEpochMs: number; }`
   - `shared/widgetTimeline.ts` adds `buildPrayerWidgetSnapshot`:
     - signature `(sequence: PrayerSequence, settings: PrayerWidgetSettings): Omit<PrayerWidgetAndroidProps, 'theme' | 'size'> | null`
     - answers the version, schedule, one `AndroidWidgetDay` per distinct `belongsToDate` from the sequence's start
       (yesterday) through its end, each row `{ name, time, epochMs }` with `epochMs = prayer.datetime.getTime()` for
       readable rows and `null` with `time = UNAVAILABLE_TIME` otherwise, `startEpochMs` = the London midnight
       starting that date (`TimeUtils.getDayAnchor(dateString).getTime()`), `dateLabel` from `formatDateLabel` logic
       (Hijri when `settings.hijriDate`), `horizonEpochMs` = the last readable prayer's epoch; `null` when the
       sequence holds no readable prayer.
     - must never: read storage, call `Date.now` (pure), throw on empty sequences.
     - The theme and size are stamped by the push layer (step 5), not the builder.
6. **Green:** suite green (`Tests: 6 passed`); tsc, biome exit 0; full `yarn test` unchanged totals plus six.
7. **Breaks:** `breaks-2.sh`: (a) `horizonEpochMs = ` computation swapped to the FIRST prayer's epoch expecting the
   horizon test red; (b) `getDayAnchor` swapped to `new Date(dateString).getTime()` expecting the boundaries test red
   in a non-UTC zone (the script runs `TZ=America/New_York npx jest ...`); ends `ALL AS EXPECTED: 1`.
8. **Version/commit:** `<VERSION> - feat: pure Android widget snapshot builder + props contract`; files: the three.
9. **Self-review** in LOG.md: pure module (no RN imports) verified by reading the import list.
10. **Merge:** `--no-ff` message `Merge feat/android-widget-snapshot into uat-2: session 15 step 2`.
11. **Done when:** `yarn test:tz` green in all four zones.

### Step 3: dual-platform layout with Android composition

1. **Anchor check:** A6 (the eight `createWidget` lines), A7 (`if (props == null) {`), A8 (`environment.widgetFamily`).
2. **Branch:** `feat/android-widget-layout`.
3. **Files:** `widgets/PrayerWidget.tsx`, `shared/__tests__/widgetContract.test.ts`.
4. **Tests first (red):** extend `widgetContract.test.ts`:
   - `home widget imports jetpack-compose names for the Android runtime` — asserts the file imports from
     `@expo/ui/jetpack-compose` and `@expo/ui/jetpack-compose/modifiers` (closure test then auto-allows them).
   - `palette literals unchanged` — the existing two palette tests must still pass untouched (regression guard, not
     new). The red run is the new import test failing.
   Run: `npx jest shared/__tests__/widgetContract.test.ts --watchman=false --selectProjects=unit`.
5. **Change.** `(specified)` — the composition is restructured around a shim INSIDE the widget function; the iOS
   output tree must stay behaviorally identical (same elements, modifiers, literals, branching):
   - Top of function (after `'widget';`): `const isAndroid = typeof Column !== 'undefined';` then local shim
     components `StackV/StackH/StackZ/Label/Gap/Fill/Card` defined inside the body:
     - iOS: `StackV` renders `<VStack>` with `spacing` handled by leaving the existing `spacing` prop path on
       VStack; Android: `StackV` renders `<Column>` and INTERLEAVES `<Spacer modifiers={[height(s)]}/>` children for
       the `spacing` prop value (Glance columns have no spacing); `Label` takes `{size, weight, color, children,
       maxLines, monospaced}`; iOS maps to the existing `font`/`foregroundStyle`/`monospacedDigit`/`lineLimit`
       modifiers exactly as today; Android maps to Text props `fontSize`, `fontWeight` (with `'medium'`/`'semibold'`
       passed through as `'normal'`), `color`, `maxLines`. `Card` iOS keeps `containerBackground`; Android renders
       the theme/size PNG `<Image source={{ uri: '<drawable>' }} contentScale="fillBounds"
       modifiers={[fillMaxSize()]}/>` as the first ZStack child (drawable names from step 6's table).
   - The palette tables, ROW_HEIGHT 22, ROW_TEXT_SIZE 12, LIST_WIDTH 140 and every color literal stay byte-identical
     (the palette tests pin them).
   - Android branch behavior, all computed at render time with `nowMs = Date.now()`:
     - flatten `props.days` rows with non-null `epochMs` in order; `next` = first with `epochMs > nowMs`;
     - `nowMs > props.horizonEpochMs || !next` renders `StaleCard` (Android flavor: moon PNG, same texts, same
       spacing values);
     - the on-screen day = last day with `startEpochMs <= nowMs`; if it has no rows, or `next` is not in it,
       `activeIndex = -1` and the medium renders hero-only (the existing `listValid` path);
     - countdown label from `next.epochMs - nowMs` with the local `formatCountdownMinutes` logic re-declared inside
       the body (minute-ceil, floor 1m, seconds never render) — the iOS precomputed `props.countdownLabel` is NOT
       used on Android;
     - `size` from `props.size ?? 'small'` replaces `environment.widgetFamily` for `isMedium` when `isAndroid`;
     - footer derives from the on-screen day's `dateLabel` with the same token-shortening code as iOS.
   - The iOS path keeps its exact current structure, including `environment.widgetFamily`, `props.countdownLabel`,
     `Blobs`, `ActivePill` and the neutral/stale cards.
   - The `props == null` NeutralCard renders identically on both platforms (Android: plain `Card` background via the
     light PNG, same texts).
6. **Green:** contract suite green; full unit suite green; tsc/biome 0.
7. **Breaks:** `breaks-3.sh`: (a) swap `isAndroid` initializer `typeof Column` to `typeof VStack` expecting the
   step-4 renderer tests' Android cases to fail (run after step 4 too; at this step the break is verified by the
   contract closure test if it references Column — if no test catches it, the break is reported not caught and the
   executor adds the closure assertion `expect(source).toContain("typeof Column !== 'undefined'")` to the contract
   suite in this commit); (b) delete `monospacedDigit()` from the iOS hero expecting no unit red (intentionally not
   caught: it is a visual modifier; recorded, not caught, and NOT added as a test — the contract suite pins palette,
   not modifiers); ends `ALL AS EXPECTED: 1` with (a) caught.
8. **Version/commit:** `<VERSION> - feat: dual-platform home widget layout (jetpack shim, render-time Android composition)`.
9. **Self-review:** diff read line-by-line against today's file; the iOS tree must be element-for-element equivalent.
10. **Merge** `--no-ff`.
11. **Done when:** `npx jest shared/__tests__/ --watchman=false --selectProjects=unit` green.

### Step 4: renderer tests, both platforms

1. **Anchor check:** `widgets/PrayerWidget.tsx` still contains the eight `createWidget` exports (A6).
2. **Branch:** `test/android-widget-renderer`.
3. **Files:** `shared/__tests__/widgetRenderer.test.tsx` (new; the `components` project runs `.test.tsx` against real
   React via RNTL, or if the widget file cannot compile under the components project's RN preset, the suite lives as
   `.test.ts` in the unit project with a hand-rolled element stub — the executor verifies which project compiles the
   `@expo/ui` imports against the existing RN mock and uses that one; both projects are 100%-coverage gated).
4. **Tests first (red):** the suite mocks `expo-widgets`'s `createWidget` to capture the layout function per name,
   provides two global sets (iOS: `VStack/HStack/ZStack/Text/Spacer/Image/Circle/RoundedRectangle` + modifier
   factories as no-op objects; Android: `Column/Row/Box/Text/Spacer/Image` + `padding/paddingAll/height/width/size/
   fillMaxSize/fillMaxWidth/background` returning marker objects), builds snapshot props from the step-2 builder with
   the virtual-week fixture, and asserts:
   - `iOS path renders the precomputed label from props and VStack trees` (regression);
   - `Android path computes the label at render` — freeze `Date.now` mid-segment; asserts the label equals the
     minute-ceil of the real remaining time, and that it differs from a stale pushed label;
   - `Android advances across a boundary without a new push` — two frozen `Date.now` values either side of a prayer;
     asserts name/time/list/activeIndex flip;
   - `Android renders the stale card past the horizon`;
   - `Android medium stamps from props.size, not widgetFamily` — environment without `widgetFamily`, `size:
     'medium'` renders the two-column composition, `'small'` the hero-only;
   - `placeholder props render the neutral card on both platforms`;
   - `Android day list picks the day containing now` — render at 23:59 London vs 00:01.
5. **Change.** Test-only; no production change (any production fix the tests force is a defect in step 3 and is
   recorded in `LOG.md` as such).
6. **Green:** suite green with `Tests:` line; coverage of `widgets/PrayerWidget.tsx` and `shared/widgetTimeline.ts`
   at 100% statements/branches/functions/lines in the changed-files gate.
7. **Breaks:** `breaks-4.sh`: (a) in the layout's Android label formula `Math.ceil` to `Math.floor` expecting the
   label test red; (b) `horizonEpochMs` comparison `<` to `<=` expecting the stale test red; ends
   `ALL AS EXPECTED: 1`.
8. **Version/commit:** `<VERSION> - test: renderer suites for the dual-platform widget layout`.
9. **Self-review:** the Date freezes restore in `afterEach` (leaked mocks poison other suites).
10. **Merge** `--no-ff`.
11. **Done when:** `yarn validate` green end to end.

### Step 5: push layer + flip timers

1. **Anchor check:** A4 (`Platform.OS !== 'ios'` gate), A5 (standard push block), the `initWidgetSettingsSync` gate
   at line 158.
2. **Branch:** `feat/android-widget-push`.
3. **Files:** `stores/widget.ts`, `shared/__tests__/widgetContract.test.ts` (the require-shape test), plus its unit
   test file `shared/__tests__/widgetStore.test.ts` if one exists (the executor locates the existing suite covering
   `stores/widget.ts` — the simulation/contract suites plus any store tests — and extends those; if none exists, a
   new `widgetStore.test.ts` with the mocks from `shared/__mocks__/`).
4. **Tests first (red):**
   - `refreshPrayerWidgets pushes eight Android snapshots when the flag is on` — Platform.OS mocked `'android'`,
     flags on; asserts each of the 8 kinds' `updateSnapshot` called once with props whose `theme`/`size`/`schedule`
     match the kind, and the lock kinds' updateSnapshot/updateTimeline never called on Android;
   - `Android flip timer reloads the four home kinds of its schedule` — advances jest timers to a flip; asserts
     `reload` called on the schedule's 4 kinds and `updateSnapshot` not called again;
   - `refreshPrayerWidgets stays a no-op on Android with the flag off` (and on iOS with the iOS flag off — existing
     behavior pinned);
   - `settings sync initializes on Android when the flag is on`.
5. **Change.**
   - `refreshPrayerWidgets` gate becomes: iOS keeps `FEATURE_FLAGS.widgets`; Android requires
     `FEATURE_FLAGS.androidWidgets`; otherwise return.
   - `pushScheduleTimelines` gains an Android branch: build the snapshot via `buildPrayerWidgetSnapshot` (reusing
     the cached sequence exactly as iOS), and for the schedule's 4 home kinds call
     `kind.updateSnapshot({ ...snapshot, theme, size })` with the kind's theme/size; no lock pushes; the flip chain
     arms identically but the timer callback calls a new `reloadAndroidKinds(schedule)` (four `reload()` calls) with
     no sequence work.
   - `initWidgetSettingsSync` gate widens to allow Android under its own flag.
   - Log line (Android push, mirrors iOS): `logger.info(\`WIDGET: ${scheduleLabel} snapshot pushed\`, { next: <next
     row name>, nextAt: <next row time> })`.
   - The lazy `require` getters stay (the contract test pins them); on Android only `getHomeWidgets` is required.
6. **Green:** suites green; tsc/biome 0; the contract require-shape test updated to accept the Android branch (it
   pins `updateTimeline` calls for home kinds — extend with `updateSnapshot` for the same kinds).
7. **Breaks:** `breaks-5.sh`: (a) remove the Android gate return expecting the flag-off no-op test red; (b) swap a
   light/dark theme stamp on one kind expecting the snapshot-stamp test red; ends `ALL AS EXPECTED: 1`.
8. **Version/commit:** `<VERSION> - feat: Android widget push layer, snapshot + reload flip path`.
9. **Self-review:** the iOS push block byte-diff checked (only the branch wrapper added around it).
10. **Merge** `--no-ff`.
11. **Done when:** `yarn validate` and `yarn test:tz` green.

### Step 6: widget PNG assets + config plugin + drawable names

1. **Anchor check:** `plugins/` contains `portraitOnlyIpad.js`; `assets/` contains `widgets/` NOT yet.
2. **Branch:** `feat/android-widget-assets`.
3. **Files:** `scripts/generate-widget-assets.py` (new), `assets/widgets/*.png` (10 new, generated),
   `plugins/androidWidgetAssets.js` (new), `app.config.ts` (register the plugin in the android resolution),
   `shared/__tests__/widgetAssets.test.ts` (new).
4. **Tests first (red):**
   - `every layout-referenced drawable exists as a committed asset` — parses the drawable names the layout
     references (the `uri:` literals in `widgets/PrayerWidget.tsx`) and asserts a matching
     `assets/widgets/<name>.png` exists;
   - `generator palette literals match the layout palette` — extracts the color literals from
     `scripts/generate-widget-assets.py` and asserts the set equals the layout's palette anchors (the same
     normalizeColor helper from the contract suite);
   - `config plugin copies assets into res/drawable-nodpi` — runs the plugin's mod function against a temp dir tree
     with fixture PNGs; asserts the files land at `android/app/src/main/res/drawable-nodpi/<name>.png` byte-equal.
5. **Change.**
   - `scripts/generate-widget-assets.py`: Pillow script; palette constants byte-identical to the layout (test-pinned);
     renders, at 3x scale of the dp box (small 110x110dp -> 330px, medium 250x110dp -> 750x330px):
     - `athan_widget_card_light_small/medium`: rounded-rect (radius 24px at 3x, matching the iOS system card
       radius look) filled `rgba(252,252,254,0.92)` on transparent;
     - `athan_widget_card_dark_small/medium`: same radius, fill `rgba(26,26,92,0.88)`, plus the three orbs + corner
       orb of the DARK palettes (positions/alphas from the layout's orb tables scaled 1pt = 3px, gaussian blur
       radius = the layout's blur value x 3, clipped to the rounded rect);
     - `athan_widget_pill_<schedule>_<theme>` (4): 420x66px (140dp x 22dp at 3x) rounded rect radius 12px, fill =
       the schedule/theme pillFill, 3px stroke the pillStroke color, drop shadow the pillShadow color/radius/offset;
     - `athan_widget_moon_<theme>` (2): crescent-and-star mark approximating `moon.stars.fill` at 78x78px (26pt at
       3x) in staleIcon color. Writes to `assets/widgets/`. Committed output; regenerating requires Pillow only.
   - `plugins/androidWidgetAssets.js`: config plugin modeled on `portraitOnlyIpad.js`; `withDangerousMod('android')`
     copying every `assets/widgets/*.png` to `<projectRoot>/app/src/main/res/drawable-nodpi/`, snake_case names
     verbatim; registered in `app.config.ts`'s android resolution only (alongside, not inside, expo-widgets).
   - Layout drawable names (step 3 already references them; the names table): the ten names above.
6. **Green:** new suite green; tsc/biome 0 (the plugin is JS in tsc's scope).
7. **Breaks:** `breaks-6.sh`: (a) delete one committed PNG expecting the asset-existence test red (restore after);
   (b) change one palette literal in the generator expecting the palette-equality test red; ends
   `ALL AS EXPECTED: 1`.
8. **Version/commit:** `<VERSION> - feat: widget PNG assets, generator, drawable config plugin`.
9. **Self-review:** PNG sizes/dimensions sane (`sips -g pixelWidth -g pixelHeight assets/widgets/*.png` printed into
   LOG.md); plugin idempotent (second run byte-equal).
10. **Merge** `--no-ff`.
11. **Done when:** in the main checkout with `EXPO_PUBLIC_ANDROID_WIDGETS=1`, `EXPO_ANDROID_SUFFIX=fleettest npx
    expo prebuild -p android --no-install` then `ls android/app/src/main/res/drawable-nodpi/ | grep athan_widget |
    wc -l` prints `10`.

### Step 7: docs + queue records

1. **Branch:** `docs/android-widgets-records`.
2. **Files:** `ai/AGENTS.md` (stack table row already says expo-widgets; add the `androidWidgets` flag to "Current
   flags" and a one-line widget-architecture note for Android), `ai/plans/README.md` (row 9 EXECUTED at the end of
   step 6 by the executor rule; this step records it), `ai/prompts/README.md` decided section (the three owner
   rulings + the widened session 17 goal), `ai/plans/SDK58-PROGRAMME.md` §17 (append the owner's widened goal:
   horizon beyond 14 days, both platforms, "the user never needs to open the app"), this folder's `LOG.md`.
3. **Tests first:** none (docs-only; the pre-commit hook still runs the suite).
4. **Change:** the records above, written in the repo's prose style.
5-7. Green/breaks: `yarn validate` once; no breaks (docs).
8. **Version/commit:** `<VERSION> - docs: session 15 records, androidWidgets flag catalog, widened session 17 goal`.
9. **Merge** `--no-ff`.

## 7. Device proof

Build (production, flag on), from the main checkout:

```
zsh ~/athan-device-sweep/session3/bin/build-prod.zsh uat-2 ~/athan-device-sweep/session15/athan-android-widgets.apk
```

with `EXPO_PUBLIC_ANDROID_WIDGETS=1` exported into the build environment (the script's env carries through to
prebuild and the bundle; verify by grepping the prebuilt manifest for `PrayerWidgetProvider` before gradle). Install:
`adb -s 8f7ada76 install -r <apk>`.

Checks, all saved under `~/athan-device-sweep/session15/`:

1. `adb shell dumpsys package com.mugtaba.athan.fleettest | grep -c PrayerWidgetProvider` prints 8 (receivers
   registered).
2. Cold launch the app (doubled `am start`), wait for first sync, `adb logcat -d | grep 'WIDGET: Standard snapshot
   pushed'` shows one line per schedule.
3. Placement + live screenshots: the screenshot-coordinate-tap loop the owner described (long-press home, Widgets
   button bottom-left, scroll to Athan, place each of the 8: 4 small + 4 medium). Screenshots after each placement;
   final home-screen screenshots holding as many as fit per screen. Expected: 8 widget cards matching the iOS
   design (vision subagent reads them; exact question in section 11).
4. Minute-freshness: screenshot, wait 70s, screenshot; the hero label advanced by one minute (vision compares).
5. Boundary advance: with the mock build variant
   (`build-mock.zsh` with `mocks/simple.ts`), the resting state flips Dhuhr->Fajr within minutes; screenshots either
   side; the name, list and pill flip (vision).
6. Stale card (8 screenshots): on the mock build, push the device clock past the horizon (`settings put global
   auto_time 0` then `service call alarm 2 i64 <epoch>`; read `dumpsys alarm` first, expect the notification alarms
   to fire noisily — mute the 3T first — and the year-2036 alarm at `when 2104803640505` untouched), then force one
   widget render per kind via
   `adb shell am broadcast -a android.appwidget.action.APPWIDGET_UPDATE -n com.mugtaba.athan.fleettest/.<Name>Provider`;
   screenshot each stale card. Restore `auto_time 1`.
7. Performance: `e2e/scripts/frame-audit.sh e2e/flows/<existing idle flow>` with widgets placed and a flip observed
   mid-run; the 30fps floor holds; idle CPU via `adb shell top -n 1 | grep athan` recorded in LOG.md.
8. Vision review of all 16 screenshots against the iOS design (palette, composition, spacing); findings loop back
   into fixes under section 10's rules; the owner receives the final set opened at the end of the session.

Safety: no clock change before reading `dumpsys alarm`; every expected alarm listed in LOG.md including the 2036
one; the owner never receives screenshots mid-session, only the final opened set.

Phone left on: the mock build, flag on, automatic time restored, widgets placed.

## 8. Records

- **Findings text:** none added to `AUDIT-FINDINGS.md` (feature session, not a findings session).
- **Table rows:** executor sets row 9 to EXECUTED with the last commit sha; auditor sets DONE. `ai/prompts/README.md`
  decided-section rows to add on PASS (auditor applies): `2026-09-18 androidWidgets flag created off-by-default,
  parity with iOS flag lifecycle (owner)`; `2026-09-18 Android widget refresh model: render-time computation +
  background-task pushes; stale card at the 14-day horizon; force-stop freezes (owner)`; `2026-09-18 session 17 goal
  widened: widget horizons beyond 14 days on both platforms, the user never needs to open the app (owner)`.
- **Docs commit:** step 7's message.

## 9. Push

None by the executor. The audit phase (this session, third pass) pushes `uat-2` after the PASS verdict, per
`AUDITOR-BRIEF.md`.

## 10. When something goes wrong

| Symptom | Cause | Action |
| --- | --- | --- |
| Registry build error `Unexpected Expo widget layout registration` | a module registered a name not in app.json | the 8 names in app.json must match the 8 `createWidget` calls exactly |
| `View not found` error text inside a placed widget | layout emitted a swift-ui-only component name on Android | check the shim: Android must emit only Column/Row/Box/Text/Spacer/Image |
| Widget renders `Image resource ... not found` | drawable missing from res | step 6 plugin + the asset-existence test |
| `prebuild -p android` loses widgets | resolution fell to the flag-off branch (argv shape changed in a future CLI) | the flags test pins the resolution; if the CLI argv changed, STOP and replan the signal |
| Labels frozen though app open | flip timer chain broke | the ALWAYS-re-arm invariant in `scheduleLabelFlipPush` is unchanged; its Android branch must keep it |
| Full-suite failures beyond section 10 | mock contamination (Date.now leak from step 4) | restore mocks in afterEach; see EXECUTOR-BRIEF general table |

- **Anticipated review fixes:** (a) reviewer finds the iOS palette test needed a new literal because the shim
  duplicated one: deduplicate inside the body, never at module scope (closure rule); apply, record in LOG.md.
  (b) reviewer finds the Android branch pushing lock kinds: remove; lock kinds have `android: null`. (c) reviewer
  finds `props.size` missing on a kind's snapshot: the stamp table in step 5 part 5 is the source; fix the stamp.
  Anything else is a STOP under `EXECUTOR-BRIEF.md` section 4, item 8.
- **Stopping part-way:** step 1: `git checkout -- shared/flags.ts .env.example app.config.ts app.json
  shared/__tests__/flags.test.ts`; step 2: same for its three files plus delete the new test; step 3: `git checkout
  -- widgets/PrayerWidget.tsx shared/__tests__/widgetContract.test.ts`; step 4: delete the new suite; step 5:
  `git checkout -- stores/widget.ts` plus its test edits; step 6: delete `scripts/generate-widget-assets.py`,
  `assets/widgets/`, `plugins/androidWidgetAssets.js`, revert `app.config.ts`, delete the asset test.

## 11. Subagents in this plan

| Step | Agent | Model | Isolation | Why | Prompt |
| --- | --- | --- | --- | --- | --- |
| 7 | `vision` | GLM 5.3 Flash | none | the only image reader allowed; reads the 16 device screenshots | in `LOG.md` when reached, one question per batch |
| all | none | GLM 5.3 | main checkout | owner instruction 2026-09-18: no phase subagents | n/a |

## 12. Report to the owner

Written at execution end, starting `🤖  Model: GLM 5.3 (execution session)` with a `Time:` line, and carrying: what
shipped (8 Android widgets, flag, refresh model), the proof (16 screenshots, opened; tests; frame audit), the
behaviour write-up the owner asked for (stale, refresh cadence, horizon, iOS differences — section 7's findings),
and the four-line handoff.
