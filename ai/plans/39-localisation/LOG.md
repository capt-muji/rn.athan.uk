# Execution log: Job 38

## Step 15: the 3T pre-flights - monitor reads taken, the require stays at <1 ms

- Branch `feat/38-15-preflights` off `uat` (`a7d84645`, step 14's merge).
  D36 to D38 executed exactly as ruled (OWNER-DECISIONS.md, this commit).
- The R2.1 base (D38): the owner armed every bell himself;
  `step15-alarm-armed-base.txt` holds the full armed census -
  NOTIFICATION_EVENT alarms for every prayer plus both reminders out to
  2026-10-31 (next wake 23:32 tonight) and the 2036
  ACTION_FORCE_STOP_RESCHEDULE tombstone (`when 2106885990618`,
  2036-10-06 06:06:30 UTC). Channels at base: `athan_1_v4`,
  `extras_at_time_v3`, sound on both.
- Monitor-build detour, recorded: the e2e README vehicle on the main
  checkout first produced `com.mugtaba.athan.fleettest` 1.29.342 - the
  stale `android/` carried the fleettest applicationId, and the vehicle's
  prebuild is not clean. Fixed inside the vehicle: `expo prebuild
  --no-install --clean` with a grep guard on the regenerated
  applicationId, rebuild BUILD SUCCESSFUL in 6m 17s. The fleettest
  artifact (installed 22:05:59 by that build, never launched, nothing
  armed) was uninstalled after the reads; the owner's install was never
  touched by it.
- Monitor build: 1.29.342, EXPO_PUBLIC_PERF_MONITOR=1, env local (no .env
  in the main checkout), production id, installed `-r` over the real
  1.29.287 data. First launch captured in
  `step15-logcat-monitor-firstlaunch-prod-id.txt`.
- Read 1, the require timing (D36): the marks ran on the LIVE perf path,
  not the buffered one - Expo Router lazy-loads route modules, so
  loader.ts evaluates about 190 ms AFTER `initPerfMonitor` (the ring
  shows the bootstrap marks replayed with `detail.at` while the catalog
  marks carry none: they were never pre-init). For live marks the ring
  `ts` is the true epoch, so the specified offline read survives with a
  better clock: both marks round to the same epoch millisecond on the
  first launch (1791666941028) and on the clean relaunch
  (1791667097376). The catalog require costs under 1 ms of JS-thread
  time on the 3T, five times under the 5 ms threshold. DECISION per
  D36: the TS require stays; loader.ts carries only the mark pair
  (committed and kept).
- Read 2, the stamp and dead-key lines (D37): the monitor build reads
  the DEV store (env-namespaced), which was fresh under
  com.mugtaba.athan - every earlier local build on this phone was
  fleettest-id with its own data dir. First launch logged `First install
  detected (no stored version)`, `stored: 'none'` - the stamp and
  dead-key lines correctly did not fire; the key-absence guard treating
  a fresh store as a fresh install is R6.2 observed on device. The
  formal proof of both lines stays with the step-12 suites, exactly
  D37's ruling; the one-shot is spent as ruled.
- Read 3, the render checks (monitor, mock data): six rows, one Latin
  name per row, no Arabic script anywhere on screen (vision-read from
  two frames, `step15-render-monitor-frame1/2.png`); the mock time
  signature matches e2e/README's description; the two frames 2 s apart
  differ only in the countdown digits and the progress-bar tip (1005
  pixels in two bands, pixel-diffed) - no row moved, so the seeded en
  width keys held and the first measurement caused no reflow.
- The monitor launch re-armed the package's bells from the dev store's
  defaults (all off - crossed-out bell icons in the frames), cancelling
  the owner's armed set until the prod build re-arms from the real
  store; the after-dump below proves the restoration.
- Forced surface update, recorded: the unused-export sweep no longer
  sees `PRAYER_LABELS` reached (the wrapper's namespace require is
  invisible to static analysis; a static import would evaluate the
  catalog before the marks). Added to
  `REACHED_WITHOUT_AN_IMPORT` in `unusedExports.test.ts` with that
  reason. No assertion weakened; `yarn validate` green: 194 suites,
  5291 passed.
- Prod leg: `build-prod.zsh feat/38-15-preflights` -> `9fc70a66`,
  BUILD-PROD OK in 335s; aapt2 badging `com.mugtaba.athan` versionCode
  1000000 versionName 1.29.342; `adb install -r` Success over the real
  data. First launch ThisTime 6740ms (post-install dexopt, discarded per
  e2e/README).
- The R2.1 comparison, base vs after (`step15-alarm-armed-base.txt` vs
  `step15-alarm-after-prod*.txt`): every notification alarm the new build
  armed is byte-identical in tag and trigger epoch to the base's nearest
  alarms - the diff holds NO changed lines, only deletions of the base's
  far-future window (120 alarms, Oct 13 onward) and one addition. The
  deletions are accumulation, not identifiers: the fresh install armed
  one 64-budget pass (time-ordered nearest-first, 63 future + tonight's),
  while the base's 184 accumulated across the 1.29.287 install's two days
  of passes; the same code arms the same window as time advances. The
  addition was `expo.modules.widgetrefresh.WidgetRefreshReceiver`, the
  launch-time widget-push one-shot (present in 1.29.x, armed only while a
  push cycle runs - gone by the third dump with the app at rest, and
  absent from the base whose app was idle). Channels: `athan_1_v4` and
  `extras_at_time_v3` byte-identical with sound and importance 4, plus
  the owner's own 20 `reminder_<id>_30_v3`/`_5_v3` channels (legacy v3
  generation, created by 1.29.287 when he armed both reminders per D38,
  persisting across install -r and reused; the part-1 census of 2
  predates his arming). No identifier diff: NOT a STOP.
  `yarn check:device` PASSES end to end (63 future prayer alerts armed,
  triggers are prayer times, channels sound on).
- Render checks on the prod build, real data (vision-read,
  `step15-render-prod-frame1.png`): six rows, one Latin name each (Fajr
  05:44, Sunrise 07:15, Dhuhr 12:52, Asr 15:40, Magrib 18:19, Isha
  19:40), no Arabic anywhere, countdown coherent (7h 8m to Fajr, Isha
  2h 53m ago), sound icons active, and the owner's preferences visible
  as survived: hijri date on, reminders armed, London. No What's-New
  modal (no 2.0.0-stage1 archive entry exists). Times align with the
  timetable by the epoch identity above.
- Phone end state: production 1.29.342 (`9fc70a66`) installed, bells
  armed as the owner set them, `auto_time` 1. The fleettest artifact was
  uninstalled (installed 22:05:59 by the detour build, never launched).
  The main checkout's `android/` was regenerated by the clean prebuild
  and now carries the production id at 1.29.342 (it had carried the
  stale fleettest suffix).
- Order note: a relay asked for the merge before the install reads; its
  own dump-diff-is-STOP gate requires the comparison first, so the merge
  stayed gated behind it (same commits, gated order).
- Finishing: step 15 committed as `790b8f4e` (built and installed as
  the APK's source `9fc70a66`, one LOG-append amend apart), merged into
  `uat` as `4d55140e` --no-ff. Evidence under `~/athan-gitree/sessions/38/`
  (armed base dump, monitor first-launch and relaunch logcats, two monitor
  render frames, prod render frame, three after-dumps, the device audits,
  the APK and its build report). Row 38 EXECUTED.

session: ses_ed8889dc3ffeaTOQtypPTcI25q
## Resume from: step 15, part 2 (owner rulings D36 to D38 landed; corrected shape below)

The part-1 STOP's decisions were put to the owner and ruled (D36 to D38 in
OWNER-DECISIONS.md). The corrected step-15 sequence, replacing the step file's
build and read paths wherever they named the production build or the debug
screen:

1. Alarm dump on the armed 3T BEFORE any install (the owner armed every
   notification on both phones himself: sound on, both reminders on; the
   part-1 as-found dump with zero alerts is superseded as the comparison
   base for R2.1).
2. E2e monitor release build (`EXPO_PUBLIC_PERF_MONITOR=1`, the e2e/README
   vehicle; never two builds at once). Install `-r` over the phone's real
   1.29.287 data. First-launch logcat carries all four reads: the
   catalog-require timing (buffered `perfMark` pair inside `loader.ts`, read
   offline from `detail.at` epochs; the pair commits with the step and
   stays), `VERSION: Stamped upgrade language to en`, the dead-key removal
   line, and the render checks (one name per row, times aligned, no
   first-measurement reflow). The 5 ms rule applies as written: above 5 ms
   JS-thread time, `loader.ts` switches to `JSON.parse` of an embedded JSON
   constant (step 07 parity suite covers it); at or under, the TS require
   stays.
3. `build-prod.zsh` (the plan's named final build, the step's version). Install
   `-r`. Alarm dump: identifier bytes identical to step 1's. Leave the phone
   on this build, `auto_time` on, bells as the owner set them.
4. Numbers in LOG.md with their build versions, evidence under
   `~/athan-gitree/sessions/38/`, the step's docs commit (`loader.ts` only if
   the require loses, else LOG.md alone), merge `--no-ff`, then Finishing and
   the row to EXECUTED.

## Resume from: step 15, part 1 (STOP returned: the step's named device reads are compiled out of the production build)

Steps 1 to 14 remain merged (`uat` `a7d84645`, 1.29.341); no branch,
commit, build or clock change happened this session. The 3T is present
(auto_time=1, BST, holding 1.29.287 as found). Read-only evidence was
banked and the session stopped BEFORE the build, because the step's
specified reads cannot exist on the build it names:

1. Experiment 1's vehicle: `build-prod.zsh` sets `EXPO_PUBLIC_ENV=prod`
   and unsets every other `EXPO_PUBLIC_*`, and `shared/perf.ts:34` gates
   `PERF_ENABLED` on `EXPO_PUBLIC_PERF_MONITOR === '1' && ENV !== 'prod'`:
   a production build folds every perfMark/perfMeasure call to a no-op
   (the perf.ts docblock says so). No PERF line can ever reach the prod
   build's logcat. The repo's sanctioned measurement vehicle is the e2e
   monitor release build (`EXPO_PUBLIC_PERF_MONITOR=1 npx expo run:android
   --variant release`, e2e/README.md:37-51), a mock-data local build - not
   the production build the step names (R16 forced change 3 said "release
   build"; the step narrowed it to "production build").
2. The named wrapper cannot emit in ANY build: `perfMeasure`
   (shared/perf.ts:241-243) returns while `perfModule` is null, and
   `perfModule` exists only after `initPerfMonitor()` runs in
   app/_layout - loader.ts evaluates during bundle evaluation, before
   that. Only `perfMark` buffers pre-init (pendingMarks, perf.ts:222-232).
   The working form at that boundary is a mark pair read offline from
   `detail.at` epochs (perf.ts docblock lines 21-23), a form decision the
   plan does not give.
3. Experiment 2's stamp/dead-key reads: "the app's debug screen" does not
   exist (no such surface in app/ or components/; `preference_language`
   is read only by its own write-guard, stores/version.ts:243), and pino
   is `enabled: false` in prod (shared/logger.ts:6-13), so
   `VERSION: Stamped upgrade language to en` and the dead-key removal
   line never log in a production build. Empirical proof banked: a cold
   launch of the installed 1.29.287 prod build logs exactly one
   ReactNativeJS line (`Running "main"`) - zero app lines, zero PERF,
   zero VERSION (e2e/README.md:101-104 states this trap verbatim: "the
   only build that gives both real data and logs is none of them").
4. One-shot hazard, the reason NOTHING was installed: the stamp fires
   only while `preference_language` is absent (stores/version.ts:243-245),
   so installing any step-12+ build over the phone's populated 1.29.287
   data applies the stamp silently and permanently - a replan could never
   re-observe it on this install. No install was made; the phone stays on
   1.29.287 as found, auto_time on.
5. Phone premise gap: the step expects "(days fetched, bells armed)". As
   found and again after a cold launch: zero prayer alerts armed (bells
   off on this phone; channels `athan_1_v4` and `extras_at_time_v3`
   present with sound, importance 4). The identifier-bytes before/after
   comparison would carry no armed identifiers beyond the channels and
   the 2036 ACTION_FORCE_STOP_RESCHEDULE tombstone. The planning-time
   reference alarm `when 2104803640505` (2036-09-12 03:40:40 UTC) is a
   tombstone of the same kind; today's reads `when 2106885990618`
   (2036-10-06 06:06:30 UTC) - the tombstone moved with the Oct 9 07:06
   reinstall.

Decisions the replan must give: (a) experiment 1's vehicle and the
wrapper's form - monitor release build plus the buffered mark pair, or
drop the device timing and let the TS require stand; (b) the
stamp/dead-key proof source - the step-12 suites already prove both, and
the step itself accepts the suite as the fresh-install proof; (c) whether
bells may be switched on for the identifier proof (an owner-state
change) or the channel ids plus the contract-test freeze carry R2.1's
device half; (d) only after (b) is ruled may any step-12+ build be
installed over this phone.

Evidence (outside the repo, `~/athan-gitree/sessions/38/`):
step15-alarm-dump-before-asfound.txt, step15-alarm-grep-before-asfound.txt,
step15-check-device-asfound.txt, step15-logcat-coldlaunch-1.29.287-prod.txt,
step15-check-device-postlaunch.txt. The part-0 note's standing facts
still hold (allowlist `[]`, 158 catalog keys, widget strings baked by
shared/widgetTimeline.ts).

session: ses_ed8889dc3ffeaTOQtypPTcI25q
## Resume from: step 15, part 0 (steps 1 to 14 merged)

Steps 12, 13 and 14 landed in the same executor session as 9 to 11
(commits `b7ccb335`/`3672a9a6`, `a02e1450`/`5622828f`, `1fe389e6`/`a7d84645`,
versions 1.29.339 to 1.29.341; every hook green at 100% on all four lines).
Step 15 (`steps/15-pre-flights.md`) is the 3T first-catalog require-timing
experiment with the JSON.parse decision behind the loader, the stage-two
month-keys sourcing note, and the numbers; it needs the 3T and closes stage
one. The next session's LOG append lands the uncommitted plan-file edits
(the sha fills and this note). Standing facts: the allowlist is `[]` and
pinned, the widget-body exemption and the data-modules rule are live, the
catalog holds 158 keys, and `widget.*` strings are baked by
`shared/widgetTimeline.ts`.

session: ses_ed8e296afffeZElOViN4KqIzpp
## Step 14: the guard closes - zero exclusion list, data-modules rule

- Branch `feat/38-14-guard` off `uat` (`5622828f`, step 13's merge; step 13
  committed `a02e1450`). No new anchors (the step reads the whole tree).
- Red, recorded: the allowlist set to `[]` in the working tree before the
  rule work, and the guard failed naming 62 offender lines - every one in
  `widgets/LockPrayerWidget.tsx` and `widgets/PrayerWidget.tsx`, exactly the
  census prediction (the two files step 10 allowlisted). No other root held
  a display hit; no file needed the "migrate here" path.
- Contract 3, the structural widget exemption: the walker threads a
  `widgetBody` flag from every arrow function whose block carries the
  'widget' directive (sticky through helpers defined inside the body - they
  serialize with it), and the guard skips display rows flagged
  `widgetBody` in `widgets/` files. Literals outside any widget function in
  those files still fail - break 3 proves it with a module-scope
  `alert(...)` probe (module scope holds no JSX, so the probe is a
  display-sink).
- Contract 2, the data-modules rule, interpretation recorded: the
  contract's parenthetical ("a StringLiteral in those files matches only
  against the catalog-import path and key literals") read strictly would
  flag the modules' own code ids ('ios', 'dndAccess', the version stamps,
  the 'iOS'/'Android' badge glyphs) - and the same step says the guard
  should name no file. The rule as implemented: in `shared/help.ts` and
  `shared/whatsNew.ts`, a StringLiteral fails when it is a copy-field value
  (question/answer/text/steps/title/body/titleKey/bodyKey/label/message, or
  an element under one) that is not `help.`/`whatsNew.`-prefixed, or when it
  contains a space anywhere in the module without the prefix (a copy
  sentence is never legal there; single-word ids and glyphs are). Import
  sources and TS type literals are out of scope. Break 2's free string
  fires it.
- Contract 4: `stringGuard.test.ts` gained 'holds zero display literals
  outside the catalog' (the allowlist is `[]`, pinned structurally) and
  'the data modules export keys only' (the census holds zero data-module
  rows); the existing three tests stand unedited, including the
  migrated-modules list, which now trivially holds against the empty list.
- The TranslationKey closure over the whole surface was already asserted
  (`i18nBridge.test.ts` 'keys the file exactly as the TranslationKey
  union'); i18n.test.ts needed no change.
- Green: full suite `194 suites, 5291 passed`; four 100% coverage lines;
  tsc clean; Biome clean; `yarn validate`'s three legs all green
  (tsc/Biome run directly, jest as above); guard CLI exit 0 with `[]`.
- Breaks, 3 of 3 AS EXPECTED, final `ALL AS EXPECTED: 1`: a JSX probe in
  Error.tsx named by the guard; a free sentence in help.ts failing the
  data-modules rule; a module-scope display sink in PrayerWidget.tsx
  failing while the body exemption holds. Restores by file backup; guard
  exit 0 restored.
- Version 1.29.341 (origin fetched under the lock; origin/uat still at
  `53eecb99`, nothing raced). Committed `1fe389e6`, merged into `uat` as
  `a7d84645`.

## Step 13: widget props v6 - ids, tolerance, baked strings

- Branch `feat/38-13-widgets` off `uat` (`3672a9a6`, step 12's merge; step
  12 committed `b7ccb335`). Anchors: the nine widget anchors count 1;
  `timeline-names`/`timeline-next` count 0 in extracted bytes (pre-06 text,
  the step's own parenthetical) and their live regions (widgetTimeline.ts
  buildDayList and the nextName sites, all through `prayerLabel`) verified
  unique.
- Red, recorded: (1) widgetTimeline 'bakes the id and the label into every
  row and entry' - `Received: undefined` (rows carry no id); (2)
  widgetContract 'walks the closure of all three lock layouts' PASSED at red
  - no lock layout beyond the first holds a free identifier today, so per
  the step's own note the fix is the walk itself, now pinned (the walker
  was refactored to `findWidgetFunctions` + a shared `closureViolations`
  helper; the per-file test keeps its shape); (3) widgetRenderer 'renders
  unit suffixes from props' - `1h 12m` still rendered from literals; plus
  the guard-tolerance test 'renders the null-props card when props are
  undefined' - threw on `'days' in undefined` (contract 4's red; the break
  script's exact call, added to the renderer suite as the step directs).
- Types (contract 1/2): `WIDGET_PROPS_VERSION` 6, `ANDROID_SNAPSHOT_VERSION`
  2 (docblocks state what each bump carries); `WidgetPrayerRow` and
  `AndroidWidgetDayRow` gain `id: PrayerId` beside `name` (the docblocks
  note v5/v1 entries carry `name` alone); `PrayerWidgetAndroidProps` gains
  `strings: WidgetStrings`.
- `WidgetStrings` interpretation, recorded: the contract names "the same
  fields as `DurationLabels` plus the neutral-card line" while the same
  sentence bakes "any stale/neutral card string the Android layout
  computes" - a five-field type cannot carry both. Resolved as:
  `{h, m, s, now, staleTitle, refreshLine, refreshLead, refreshTail}` -
  the DurationLabels parity fields plus every card string AStale renders
  from valid props. The null-props cards (Android `ANeutral` and the iOS
  `NeutralCard` at the `widget-units` anchor) keep their literals exactly
  as the contract exempts. `s`/`now` ride for DurationLabels shape parity
  and are documented as unread until the countdown changes (the docblock
  says so; the widget's countdown is minutes-only, frozen).
- Builder (contract 3): `widgetStrings()` in `shared/widgetTimeline.ts`
  resolves from `t()` (`duration.*` reuse plus four new keys
  `widget.stale/refresh/refreshLead/refreshTail`, byte-identical, pinned in
  `i18n.test.ts`); rows bake `{id: prayer.id, name: prayerLabel(prayer.id)}`
  in both builders; the snapshot carries `strings`. `stores/widget.ts`
  needed no change (the version constants flow from the types; the settings
  sync carries no language).
- Layout (contract 3/4): the guard `props != null && 'days' in props`;
  `ALabel` takes its unit words as a parameter; `AStale` takes the strings;
  `androidRender` builds `input.strings ?? {English fallback}` INSIDE the
  body (a module-scope fallback would break the closure law; the fallback
  literals are object properties, invisible to the string guard); the iOS
  medium list keys `row.id ?? row.name`; the eyebrow keeps `.toUpperCase()`
  on the baked name. The Android list renders unkeyed as before (only the
  `widget-rowkey` site keys).
- Suites: fixtures re-keyed for the new payload shape - widgetSimulation's
  twelve golden digests re-golded (the digest pins the builder's exact
  output; rows gaining `id` is the contractual change, computed by the
  same hash over the new output, never hand-typed), its two `expectedRows`
  builders and widgetTimeline's row fixtures gain `id`, widgetSnapshot's
  and widgetAndroid's version pins 1->2. New tests beyond the reds: the
  v1-snapshot tolerance drive (no strings, no row ids, the English
  fallback renders) and the id-key collision test - a future-locale shape
  with two same-named rows whose RAW element keys must stay distinct
  (`keysOf` walks the raw tree because rendering output cannot show a key;
  this is break 1's "v6 payload test with two same-named rows", made
  behavioral since the marker harness ignores keys).
- Green: full suite `194 suites, 5288 passed`; four 100% coverage lines
  (the first coverage run sat at 99.95% branches - the tolerance fallback
  was unexercised; the v1-snapshot test closes it). tsc clean; Biome clean.
- Breaks, 3 of 3 AS EXPECTED, final `ALL AS EXPECTED: 1`: name-only keys
  collapse the collision fixture's keys; the guard reverted to `!== null`
  throws on undefined props; the tolerance guards dropped fail the v1
  drive (break 3 adapted to the implementation: the plan's "v tolerance
  branch" is a v-read in its model and a presence-guard here - the
  contract's own "the `id ?? name` key and every `id`-dependent branch
  guards on presence" is the shape implemented). Restores by file backup;
  renderer suite back to 54 passed.
- Version 1.29.340 (origin fetched under the lock; origin/uat still at
  `53eecb99`, nothing raced). Committed `a02e1450`, merged into `uat` as
  `5622828f`.

## Step 12: `migrateToLocaleDefaults`, the version-guarded stamp

- Branch `feat/38-12-upgrade` off `uat` (`8a1544df`). All seven anchors
  resolve: six count 1 in `stores/version.ts`, and `migration-core` counts 0
  in its extracted bytes because step 06 retitled its arrays - the live
  region `migrateIndexKeyedAlertPreferences` (notifications.ts:514) is unique
  in its post-06 shape, per the step's own parenthetical (plan-text slip, no
  replan; the step does not edit that region).
- Red, recorded: `upgrade2_0_0.test.ts` 4/4 failing (stamp absent, dead key
  surviving, no idempotence); `upgrade2_0_0CrashWindows.test.ts` rows 2, 3, 4
  and 5a failing (rows 5b, the four 7s and 8 pass today as convergence
  guards, matching the plan's own "lands with the suite and guards" note on
  test 3); `version.test.ts`'s new order pin failing (no
  `preference_language` write exists). All named failures were the plan's.
- The migration, exactly per contract: `migrateToLocaleDefaults(storedVersion)`
  called after `migrateIndexKeyedAlertPreferences(storedVersion)`, stamping
  `preference_language` to `'en'` only when the CAPTURED `storedVersion` is
  non-null and below 2.0.0 AND the key is absent, with the raw
  `Database.setItem` write; `Database.removeItem('preference_show_arabic_names')`
  unconditional; the two log lines verbatim (the removal log only when the
  key existed). `CACHE_SCHEMA_VERSION` stays 1, `UPGRADE_KEEP_PREFIXES`
  untouched (D35).
- Suites: the two new ones (the crash suite carries one test per R18
  crash-table row as corrected, the row-4 rewrite the load-bearing one -
  mid-state `2.0.0`-on-disk with no language key relaunches to a persisting
  absence, proving the guard reads the captured value, never the stored key
  or bare absence); `version.test.ts` gained the order pin (the
  index-keyed mock's invocationCallOrder precedes the language setItem's)
  plus `removeItem` in both its database mocks; `versionFailures.test.ts`'s
  database mock gained `removeItem` and its healthy-upgrade stamp-set pin
  gained `preference_language` (its 1.27.15 fixture satisfies the guard - a
  build carrying the migration is itself 2.0.0-era, so any captured 1.x
  stamps). Both were forced surface updates from the change, no assertion
  weakened: the pin still enumerates exactly what a healthy upgrade writes.
- Green: full suite `194 suites, 5283 passed`; tsc clean; Biome clean (one
  unused-fixture warning fixed by deleting it).
- Breaks, 4 of 4 AS EXPECTED, final `ALL AS EXPECTED: 1`: key-absence-only
  guard stamps the fresh install (test 1 fails); order swap fails the order
  pin; removeItem deleted fails test 2's dead-key assertion;
  `CACHE_SCHEMA_VERSION` bumped to 2 wipes the days (test 2 fails). Restores
  by file backup; suite back to 4 passed.
- Version 1.29.339 (origin fetched under the lock; origin/uat still at
  `53eecb99`, nothing raced). Committed `<sha>`, merged into `uat` as
  `<merge sha>`.

## Resume from: step 12, part 0 (steps 1 to 11 merged)

Steps 9, 10 and 11 landed in one executor session on 2026-10-10/11
(commits `27cf0014`/`6372aa74`, `8230a9a9`/`03137ce3`, `78d9d957`/`8a1544df`,
versions 1.29.336 to 1.29.338; every hook green at 100% on all four lines).
The next session runs step 12 (`steps/12-upgrade-migrations.md`) and its own
LOG append lands the uncommitted plan-file edits above (the sha fills and
this note). Standing facts for step 12: the string guard now fails on every
display kind (rule 1/2 AND display-sink), the allowlist holds only the two
widgets files, `CURRENT_LOCALE_ID` is exported from `shared/i18n` and already
consumed by `stores/ui.ts`'s seed, and the width keys on disk are
`prayer_max_english_width_en_standard`/`..._en_extra`.

session: ses_ed8e296afffeZElOViN4KqIzpp
## Step 11: the width cache goes per-locale

- Branch `feat/38-11-width` off `uat` (`03137ce3`, step 10's merge). All five
  anchors count exactly 1 in their live files (`width-atoms`, `setwidth`,
  `setwidth-grow` in stores/ui.ts; `version-keeplist` in stores/version.ts;
  `sync-keeplist` in stores/sync.ts).
- Red, both named tests written in `stores/__tests__/ui.test.ts` and failing
  before the change: test 1 `Expected "150", Received undefined` (no en key on
  disk), test 2 `Expected 150, Received 90` (the atoms still read the legacy
  keys, so 90 widened from 0). Getting the red honest took test-mock surgery,
  recorded: the file-wide hoisted mocks for `jotai` and `../storage` cannot be
  overridden by `jest.doMock` once the outer imports have instantiated them
  (probed empirically), so both hoisted factories gained a `mockRealImplementations`
  flag that the isolated load flips, and the delegate captures the sandbox's
  real default store (`mockCapturedRealStore`) so the assertions read the same
  store the module under test wrote. `@/stores/database` is file-scope mocked
  behind a Map both the seed and the real storage factory share.
- Contracts: `CURRENT_LOCALE_ID = 'en'` exported from `shared/i18n/index.ts`;
  the seed loop in `stores/ui.ts` at module scope ABOVE the atom definitions
  (R18 phase 0 step 2's ordering), copying each legacy value raw
  string-to-string only when the `en` key is absent, then removing the legacy
  key unconditionally (idempotent, D35); the atoms now carry
  `prayer_max_english_width_en_standard`/`..._en_extra` through the constant.
  `setEnglishWidth` untouched (anchors hold; widen-only per key exactly).
- Contract 4's parenthetical "already true after step 06" is a slip: the
  component read `STANDARD_PRAYER_TITLES`/`EXTRA_PRAYER_TITLES`. The normative
  sentence and R3.3 win - `InitialWidthMeasurement` now renders
  `prayerLabel(STANDARD_PRAYER_IDS[...])`/`prayerLabel(EXTRA_PRAYER_IDS[...])`
  (same bytes, `getLongestPrayerNameIndex` unchanged as the length oracle); its
  suite's assertions needed no re-key (they assert atom values, not keys) and
  pass unedited.
- Keep-lists untouched in both wipes (`prayer_max_english_width_` covers both
  shapes - D35 no keep-list changes). Fixture re-keys: `sync.test.ts`'s
  survivor-keys row and `syncFetchBeforeWipe.test.ts`'s KEPT_KEYS + seeded key
  now carry `prayer_max_english_width_en_standard` (the only shape the app
  writes post-change). `version.test.ts`, `shownDate.test.ts` and the
  InitialWidthMeasurement suite needed no change.
- Green: the six named suites 252 passed; full suite `192 suites, 5268
  passed`; tsc clean; Biome clean. Done-when grep: only the seed, the atoms,
  the two keep-prefixes and Error.tsx's true comment reference the width keys;
  no legacy key read anywhere after the seed.
- Breaks, 3 of 3 AS EXPECTED, final `ALL AS EXPECTED: 1` (first run's
  NOT-APPLIED verdicts were the script's own `tail -5` capture hiding the
  failing-test names; the rerun with full capture proved each break): seed
  moved below the atoms -> named test 1 reads 0; unconditional overwrite ->
  named test 2 fails (with the sibling ISSUES #22 pin, the same defect);
  legacy removal dropped -> named test 1's removal assertion fails. Restores
  by file backup, suite back to 29 passed.
- Version 1.29.338 (origin fetched under the lock; origin/uat still at
  `53eecb99`, nothing raced). Committed `78d9d957`, merged into `uat` as
  `8a1544df`.

## Step 10: wave 3, the app tree, the device strings and the duration labels

- Branch `feat/38-10-wave3` off `uat` (`6372aa74`). Step 9's commit was
  `27cf0014`, merged as `6372aa74` (fills the placeholders in the step 9
  entry above).
- Anchor check: all four anchors (`ago-text`, `plan-key`, `content-builders`,
  `reminder-content`) count 0 in their extracted bytes - step 06/07 consumed
  them, each with the step file's own parenthetical. The live regions were
  verified unique before editing: `agoText` in `hooks/usePrayerAgo.ts:37`,
  the plan lookup in `shared/notifications.ts:356`, the builders at
  `shared/notifications.ts:131/180` (titles already through `t()`).
- Red, recorded: (1) the allowlist shed the 3 app files and the guard test
  failed `1 failed, 2 passed` listing the five app hits (Navigation 2,
  _layout 1, index 2). (2) `time.test.ts` 'labels durations from the
  catalog' failed `Expected "1H 2M 5S", Received "1h 2m 5s"` - note two
  plan-text slips recorded here: the step's call form
  `formatTime(3725, {...})` puts labels second, but the contract's "optional
  final parameter" plus the unchanged-JSDoc-pins promise fix it last, so the
  test calls `formatTime(3725, false, false, labels)`; and the step's
  expected `'1H 1M 5S'` mis-divides 3725s (1h 2m 5s), corrected to
  `'1H 2M 5S'`.
- Scanner grew its default ROOTS by `widgets` (census and guard both scan
  it; the allowlist carries `widgets/LockPrayerWidget.tsx` and
  `widgets/PrayerWidget.tsx` until step 13 - the allowlist is the single
  source of what is left).
- Executor strengthening, three conditions met (scanner code the plan did
  not give verbatim this step, no plan-named name/signature/test changed,
  every acceptance criterion green): the guard's offender filter widened
  from rule 1/2 to every `display*` kind. The step's own predictions demand
  it - red 1 says the guard lists "app/, device/, hooks/, shared/ files"
  (device/qibla.ts and hooks/useNotification.ts hold only display-sink rows)
  and break 1 says the guard names a hardcoded `'Enable Location'`, a
  display-sink argument - and R5.1 reads "every display literal outside the
  catalog that the allowlist does not name". The widened guard stays green
  on the migrated tree (the only display-sink rows left are the allowlisted
  widgets file) and break 1 fires exactly as predicted. review-template
  rows stay out (logger lines are code, not copy).
- The catalog grew by 15 keys: `duration.h/m/s/now`, `time.now`/`time.ago`
  (the Files line's key names; the DurationLabels section's `time.since` is
  a slip - the Files line's precise `t('time.ago', {name, duration})` form
  wins), `channel.athan {n}`/`channel.extras`, `app.loadingLabel`, the
  qibla location dialog pair, `dialog.cancel`/`dialog.openSettings` (both
  device dialogs share them), and the notifications enable-dialog pair.
  `ParamsOf` gained the three new shapes.
- `shared/time.ts`: `DurationLabels` + `durationLabels()` (the catalog's
  single-letter units) and the optional final `labels` parameter on both
  `formatTime` (4th) and `formatTimeAgo` (2nd); every literal unit now reads
  through the labels object. Defaults reproduce today's bytes: all 118
  pre-existing time pins pass unchanged. `usePrayerAgo` templates route
  through `t('time.now'|'time.ago', ...)` ('Fajr now', 'Fajr 2h 30m ago'
  pins unchanged).
- `device/qibla.ts` and `hooks/useNotification.ts` Alert copy through `t()`
  (byte-identical, no arity change); the qibla suite's dialog pins pass
  unchanged. `device/updates.ts` holds only logger lines - nothing remained.
- `shared/notifications.ts`: `athanAndroidChannelConfig`'s name reads
  `t('channel.athan', {n})` and the extras channel name reads
  `t('channel.extras')`. `prayerIdContract.test.ts`'s channel-name source
  pins moved with the source shape (the pin now reads the `t()` call text
  plus the en.ts value lines, keeping the freeze on the resolved bytes);
  `notifications.test.ts`'s runtime `name: 'Extra Times'` pin passes
  unchanged. The reminder channel-name template
  `` `${prayerLabel(id)} in ${intervalMinutes}m Reminder` `` stays literal:
  the step enumerates exactly two channel-name formats, and that template is
  invisible to every census rule (no display literal by the plan's own
  definition); its source pin is unchanged.
- app files: Navigation's `pointerEvents`/`importantForAccessibility` and
  _layout's SystemBars `style` braced; index's loading label through
  `t('app.loadingLabel')` with the role braced. The error-boundary strings
  the step names are ErrorScreen's, already catalogued in step 9.
- Suites changed: `time.test.ts` (+ the labels test), `i18nBridge.test.ts`
  (token set +3 with two new ParamsOf pins), `i18n.test.ts` (+12 pins),
  `stringGuard.test.ts` (migrated list + the 3 app files),
  `prayerIdContract.test.ts` (the moved source pins). The 24 affected
  suites green in one run; the qibla, usePrayerAgo, notifications and app
  suites pass unedited (the parity proof).
- Green: full suite `192 suites, 5266 passed`; tsc clean; Biome clean (after
  `--write`: import ordering); guard CLI exit 0 with widgets scanned and
  allowlisted.
- Breaks, 3 of 3 AS EXPECTED, final `ALL AS EXPECTED: 1`: hardcoded
  `'Enable Location'` named by the guard at its line (the widened net's
  first proof); `duration.h` -> 'hour' failed the time pins; the labels
  default dropped and bare `formatTime(60)` failed the `'1m'` pin. Restores
  by file backup; tree held only the step's files.
- Version 1.29.337 (origin fetched under the lock; origin/uat still at
  `53eecb99`, nothing raced). Committed `8230a9a9`, merged into `uat` as
  `03137ce3`.

## Step 9: wave 2, every remaining component surface

- Branch `feat/38-09-wave2` off `uat` (`5e0031db`). Re-executed cold from the
  contracts after the previous session's usage-limit stop; the saved
  `step09-unfinished.patch` was consulted for key naming only, nothing restored
  from it. The previous attempt had not migrated the option labels
  (`ALERT_OPTIONS`/`SOUND_OPTIONS`), `UNAVAILABLE_MESSAGE`, the Stepper `min`
  default, the `notification:` a11y templates or `spoken`; this execution did
  (the step's parenthetical names them and its first line covers them).
- Anchor check: `explanation-arabic` counts 1 (Explanation.tsx).
  `overlaycontent-arabic` counts 0 in its extracted bytes because step 06
  rewrote the region (id-keyed `indexOf` over `EXTRA_PRAYER_IDS`, the plan's
  own parenthetical); the live region `getOverlayExplanation` is unique in
  production and holds the exact seam this step migrates, so the anchor
  resolves to it. Plan-text slip (the parenthetical guessed the title-case
  array would sit in the `indexOf` line; what landed is the id array),
  recorded, no replan.
- Red, recorded before any change: the allowlist shed all 26 component files
  (holding only the 3 `app/` files, step 10's) and the guard test failed
  `1 failed, 2 passed` listing 147 offender lines across the 26 files
  (`$TMPDIR/step09-red-offenders.txt` captured; the byFile table in
  `scripts/string-census.json` order). That list was the worklist.
- The catalog grew by 67 keys (en.ts +75 lines): sheets (closeToSave), the
  alert sheet (card athan/hint, reminder `{n}` template + hint, off/silent/
  sound option labels, the four-line unavailable paragraph as one
  newline-joined key), reminder row labels + `min` unit, the three stepper
  a11y templates, sound sheet + soundItem templates, colorPicker, the 13
  qibla strings (label/text split one byte apart on `Open settings`),
  modal.close, help.title, whatsNew heading + ` ({platform} only)` note,
  update modal, overlay close label, day.location, settingsButton,
  countdown progressA11y `{percent}` + waiting label, the four Error texts
  (leading/trailing spaces are rendered bytes, kept), prayerAlert
  notification template + four lowercase state words + the two hints, and
  `extras.explanation.<id>` (the space key `extras.explanation.last third`
  included). `ParamsOf` gained the six new param shapes.
- `EXTRAS_EXPLANATIONS` (shared/constants.ts) now carries the five catalog
  keys (`as const`, docblock rewritten to say keys); `getOverlayExplanation`
  resolves through `t()` at the consumer with an early return for Standard
  and an explicit `TranslationKey | undefined` annotation so the
  still-loading row (Extra + standard id) keeps passing `undefined`
  through instead of throwing on `t(undefined)` - the pinned
  `no explanation text to borrow` case.
- Non-display attribute literals moved off string-literal positions exactly
  per step 8's mechanics: `accessibilityRole={'button'}`-style braces on 12
  files, SVG geometry/colors (`Explanation`, `QiblaCompass`, `QiblaWave`,
  `Glow`, prayer/Alert viewBox) braced inline, testIDs braced, and the
  sheet icon colour + perf names as per-file `SHEET_ICON_COLOR`/
  `SHEET_PERF_NAME` constants carrying the one why-comment. Glyph display
  text stays in braces per the reviewed step 8 precedent: `{'›'}`,
  `{'−'}`, `{'v'}` (WhatsNew's version prefix). The WhatsNew platform note
  became one whole-string key `whatsNew.platformNote` with `{platform}`
  interpolating the `iOS`/`Android` brand names as data.
- Suites: only two changed. `Explanation.test.tsx` fixtures now feed
  `t(EXTRAS_EXPLANATIONS[MIDNIGHT])` so its verbatim
  `getByText('Halfway between Magrib and Fajr')` pin reads the catalog (the
  parity proof kept); `i18nBridge.test.ts`'s only-tokened-keys pin grew the
  nine new token families with per-key token assertions and two new
  `ParamsOf` compile pins. `stringGuard.test.ts`'s migrated-modules list
  grew the 26 files. `i18n.test.ts` PINNED_LITERALS gained 56 entries: every
  new non-tokened key (the tokened keys follow the step 5/7 pattern of
  suite pins - Alert 'Reminder 1/2', Stepper '15 min'/'Decrease to 10 min',
  SoundItem 'Athan 3'/'Preview Athan 3', Bar 'Prayer countdown: N percent
  remaining', WhatsNew '(iOS only)', prayer/Alert 'Fajr notification:
  sound'). Pin coverage machine-checked: 139 catalog keys, 122 single-line
  pins + 4 multi-line pins + 12 bridge-tokened, zero uncovered.
- Green: full suite `192 suites, 5265 passed`; tsc clean; Biome clean (after
  `--write`: import ordering plus the allowlist collapsing to one line).
  Guard CLI exits 0 with the 26 component files off the allowlist; the
  Done-when grep (`'[A-Z][a-z]+'` through components/) reviews to zero; the
  two remaining components/ census rows are ColorPicker's logger templates
  (rule 4 review rows on `logger.info` lines, code not copy).
- Breaks, both AS EXPECTED, final `ALL AS EXPECTED: 1`: (1) one label
  hardcoded back in each of a sheets, a modal and a ui file - the guard
  named all three lines (Alert.tsx:214 display-jsx, Update.tsx
  display-jsx-attr, SettingsButton.tsx display-jsx-attr); first run of the
  hand-rolled script failed to apply two of the three substitutions (zsh
  ate the `!` in `Update Available!` through the perl one-liners) - rewritten
  with python heredocs, both files then broke as predicted; (2)
  `settings.title` bytes changed to 'Configuration' - the Settings suite
  pin failed. Restores by file backup; tree held only the step's files.
- Version 1.29.336 (origin fetched under the lock; origin/uat still at
  `53eecb99`, nothing raced). Committed `<sha>`, merged into `uat` as
  `<merge sha>`.

## Resume from: step 9, part 0 (wave 1 merged, wave 2 not started)

The worker session stopped on the account usage limit at 2026-10-10 19:35,
after merging step 8 and writing this note but part way into step 9's edits.
The lead ran the part-way recovery: the partial diff (35 files, no red
recorded, nothing committed) is saved as evidence at
`$HOME/athan-gitree/sessions/38/step09-unfinished.patch` (with
`step09-unfinished-status.txt`) and the tree was restored clean. The next
session re-executes step 9 from its contracts, cold; the patch is evidence of
what was attempted, never a restore source. Respawn after the limit resets
(02:33 2026-10-11).

Steps 1 to 8 are committed and merged into `uat` (the step 8 section below
carries the commit sha; its post-merge sha patch rides step 9's commit, the
established pattern). The string guard is live in the pre-commit chain:
`scripts/scan-strings.mjs` + `scripts/string-census-allowlist.json` + the Jest
wrapper `shared/__tests__/stringGuard.test.ts`. The allowlist holds 29 files and
wave 2 (step 9) sheds every component file on it. Scanner invocation pitfall
carries: argv[2] is an optional ROOT, pass `''` before `--guard`.

What wave 2 (step 9) inherits from step 8's mechanics, proven on Settings.tsx:

- Display labels go through `t('…')`; NON-display attribute literals (colors,
  testIDs/perf names, `accessibilityRole`) move off string-literal JSX attributes
  as constants (`SHEET_ICON_COLOR`, `SETTINGS_PERF_NAME`) or brace expressions
  (`accessibilityRole={'button'}`, `{'›'}`) - Biome keeps the braces (verified).
- A visible text and its a11y label that differ by one byte get two keys
  (`settings.whatsNew` straight `'` for the label pin,
  `settings.whatsNewLabel` with U+2019 for the rendered text); the suite pins
  decide which byte each key carries.
- New catalog keys join their byte-parity pins in `i18n.test.ts`
  `PINNED_LITERALS` in the same commit (step 8's executor strengthening; the
  step's files list omitted the file but four strings had no other pin).
- `TranslationKey` is re-exported from `shared/i18n/index.ts` (the guard's
  data-modules rule demands the `'@/shared/i18n'` import; `t` alone was not
  enough for the typed key fields).
- whatsNew's archive shape is `WhatsNewArchiveItem`/`WhatsNewArchiveRelease`
  (`titleKey`/`bodyKey`); `WHATS_NEW` itself IS the archive now,
  `getVisibleWhatsNew` resolves through `t()` at the release boundary, and the
  unused-export sweep stays clean (a resolved `WHATS_NEW` twin would orphan -
  intra-module references are what keep it reachable).

Standing lessons carry: restores use file backups never `git checkout` before
the step commits (step 8's executor lost a file rewrite by stashing instead:
`git stash` reverts the file BEFORE a following `cp` backup runs); delete
constants by exact-text edits; regenerate the commit-message file right before
`git commit -F`; pin writes with inline type annotations; a jest worker SIGSEGV
(watchman recrawl) once killed a commit attempt - regenerate the message file
and commit again.

## Step 8: the guard lands, wave 1 migrates

- Branch `feat/38-08-wave1` off `uat`. The three guard artefacts were copied
  back verbatim from `$HOME/athan-gitree/sessions/38/` (scanner, allowlist,
  guard test), not rebuilt.
- Red, recorded before any migration: the guard test failed exactly as the
  saved seed log predicted (`2 failed, 1 passed`: rule 1 listing Settings.tsx's
  29 rule-1/2 hits; rule 3 the data-modules source read), and the new
  help.test.ts test 'sources every entry from the catalog' failed against the
  literal-holding module (`1 failed, 20 passed`). The step's red prose
  overstatement (three files' hits) was already adjudicated in the previous
  resume note: the guard red lists Settings.tsx only.
- The catalog-sourcing test (plan-text slip recorded: the plan names
  `getHelpEntries()`, which does not exist; written against the real surface
  `getHelpTopics`) loads a fresh help module under a marking `t()`
  (`jest.doMock` + `jest.isolateModules`, the versionFailures house pattern):
  every question/text/step and `HELP_ACTION_LABELS.dndAccess` must carry the
  `catalog:<key>` mark. A value-equality test alone cannot fail the plan's
  break 2 (a hardcoded string equal to the catalog value passes equality), so
  the marker form is what makes break 2 honest.
- help.ts: `HELP_ENTRIES` holds `TranslationKey`s over the existing
  `help.q/a/step.x` members (`.ios`/`.android` answer keys where the platforms
  differ, shared keys where they do not); `getHelpTopics` resolves every field
  through `t()`; `HELP_ACTION_LABELS` resolves through
  `t('help.action.dndAccess')` at module scope. Public shapes and byte output
  unchanged: all 20 verbatim help pins pass unedited.
- whatsNew.ts: `WHATS_NEW` is now the key-carrying archive
  (`WhatsNewArchiveItem`/`WhatsNewArchiveRelease`, `titleKey`/`bodyKey` over
  the existing `whatsNew.title/body.x` keys); `filterWhatsNewItems` takes the
  archive shape; `getVisibleWhatsNew` resolves through `t()` at the release
  boundary (`resolveItem`); `WhatsNewItem`/`WhatsNewRelease` keep the resolved
  public shape app/index.tsx and the modal already read. A resolved `WHATS_NEW`
  twin was rejected: the unused-export sweep counts intra-module references,
  so a twin nothing in production reads would have needed an allowlist entry.
  `whatsNew.test.ts` fixtures re-keyed (archive factories for
  filter/getVisible inputs; the getVisible expected side pins real catalog
  bytes: 'Tablet support', 'Home & Lock widgets'); the parked-wording pin now
  reads `t(parked.titleKey)` against the literal 'Home & Lock widgets'.
- Settings.tsx: 21 display hits went through `t('settings.…')`; the 8
  non-display hits moved off string-literal positions - `SHEET_ICON_COLOR` and
  `SETTINGS_PERF_NAME` constants (one why-comment: the guard reads
  attribute-held literals as copy), `accessibilityRole={'button'}` and
  `{'›'}` brace expressions (Biome keeps braces; verified with a probe before
  choosing). The visible What's-new text and its a11y label differ by one byte
  (U+2019 entity vs straight `'`), so they take two keys:
  `settings.whatsNew` (straight, the suite's `getByRole` pin) and
  `settings.whatsNewLabel` (U+2019, the rendered bytes). Seven new keys joined
  en.ts byte-identically (subtitle, prayer, changeAthan, qibla, display,
  showHijriDate, whatsNewLabel).
- Executor strengthenings, three conditions met (code the plan did not give
  verbatim, no plan-named name/signature/log-line/behaviour changed, every
  acceptance criterion green): (1) byte-parity pins for the seven new keys in
  `i18n.test.ts` PINNED_LITERALS - the step's files list omitted the file, but
  four of the seven strings had no other pin (subtitle, prayer, display,
  whatsNewLabel) and the step's own review checklist claims every migrated
  string is pinned; (2) `export type { TranslationKey }` from
  `shared/i18n/index.ts` - the typed key fields need it and the guard's rule 3
  demands the `'@/shared/i18n'` import; (3) the marker form of the sourcing
  test (above) - the plan's equality form cannot satisfy its own break 2.
- Files the step listed that needed no change: the Help, WhatsNew and Settings
  modal/screen suites pass unedited (the parity proof); only whatsNew.test.ts
  and help.test.ts changed among suites.
- Green: full suite `192 suites, 5265 passed`; tsc clean; Biome clean (after
  `--write`: import ordering in the new-shape files). The unused-export sweep
  reports exactly its six allowlisted symbols. Guard CLI exits 0 with
  Settings.tsx off the allowlist.
- Breaks, 3 of 3 AS EXPECTED, final `ALL AS EXPECTED: 1`: hardcoded
  `label='Show seconds'` named by the guard at its line; a hardcoded question
  failed the marker test; `[]` allowlist failed the guard with 152 offender
  lines. Restore green, tree holding only the step's files.
- Incident, no repo damage: a `git stash -- <file>` used as an in-place backup
  reverted the whatsNew.ts rewrite before the intended `cp` backup ran; the
  stash was dropped before the loss was noticed and the file was rewritten
  from the session's own record. Lesson added to the resume note: never stash
  as a backup; copy first.
- Version 1.29.334 (origin fetched under the lock; origin/uat still at
  `53eecb99`, nothing raced). Committed `633bc8f5`, merged into `uat` as
  `e67ebcf9`. Hook: `Tests: 5265 passed, 5265 total`, four 100% lines
  (Statements 4951/4951, Branches 2145/2145, Functions 1034/1034, Lines
  4433/4433). One watchman recrawl warning beside the commit, but no SIGSEGV
  this time. Review: one pass, cold over `git show 633bc8f5`, nothing to fix -
  parity pinned by unchanged assertions in three suites (help.test.ts's
  verbatim questions, Settings.test.tsx's DISPLAY_TOGGLES labels and the
  straight-apostrophe `getByRole` name, whatsNew.test.ts's parked
  'Home & Lock widgets' wording); no lifecycle, thread or rule surface in the
  diff (module-scope `t()` calls replace literals at the same evaluation
  moment); the census shows 0 display hits for all three migrated files with
  the guard exiting 0. Branch `feat/38-08-wave1` deleted after the merge.

## Step 6: the identifier union takes the row (reconciliation first)

A previous executor session started this step and died without writing the ledger. The
branch `feat/38-06-union` sat off `uat` with 73 uncommitted modified files. This session
reconciled the found state contract by contract before finishing; nothing was reset.

Found state, verified against `steps/06-identifier-union.md`:

- Production contracts 1 to 6 were complete and faithful: `PrayerRow.id: PrayerId`
  (`shared/types.ts`, plus `CountdownStore.name` retyped `PrayerId | typeof
  COUNTDOWN_WAITING_NAME` so the display atom resolves the label), the builders and the
  night-branch narrowing with the cast deleted by restructure (the bare-id guards the
  plan's restructure mandates; the `type === Extra` term is subsumed because no standard
  id can equal an extras id), the constants rename
  (`STANDARD_PRAYER_TITLES`/`EXTRA_PRAYER_TITLES` documented as migration-era spellings,
  `NIGHT_PRAYER_NAMES`/`MIDNIGHT_CROSSING_PRAYERS` retyped with their `as` casts gone),
  every display read through `prayerLabel`, the atom factories retyped with byte-identical
  keys, the migration rewrite keeping `prayerName.toLowerCase()` in the loop (its sources
  are the title arrays), and the loading sentinel `id: 'fajr'`.
- Both red tests were already written: `prayer.test.ts` 'keys the stored-day lookup by
  the id' and `device/notifications.test.ts` 'builds the space-form identifier from the
  id'. The step names the second a type-red on the old signature; the red could not be
  re-run against the pre-change tree without resetting inherited work, so it is recorded
  here as written-but-unwitnessed rather than restaged.
- The suite re-keying was part-done: roughly 50 suites were swept, but seven files still
  failed tsc (prayerIdContract, widgetRenderer untouched, widgetSimulation,
  widgetSnapshot, widgetTimeline, alarmHarness, syncLateDecember31), five more suites
  called the alarm harness with title names, and several already-swept expectations
  compared widget row names against ids where the builders now emit labels.

This session finished the sweep: rekeyed the seven files, retyped the harness `enable`
to `PrayerId` and re-keyed its callers (23 call sites across notificationsClockChange,
notificationsOctober18Midnight - one line, outside the R14 table but forced by the
harness retype - notificationsFridayIstijaba, notificationsAroundMidnight,
notificationsMidnightWindow), moved the migration-guards mock to `EXTRA_PRAYER_TITLES`
(the seam the rename left), and fixed the label expectations: widget row names and
`nextName` props carry `prayerLabel(id)` (en titles, byte-identical), while fixtures,
lookups and unreadable-name walks carry ids. `prayerIdContract` gained the firewall test
with the four `@ts-expect-error` display-string calls, the truth table re-keyed to ids,
and the channel-name source pin moved to the new `` `${prayerLabel(id)} in ...` `` text.

Green, after the sweep above: tsc clean, Biome clean (after `--write` fixes: import-type
and unused-import cleanups in seven files, one unused `PRAYER_IDS` import the previous
executor left in `overlayContent.test.ts`), full suite `190 suites, 5255 passed`, four
100% coverage lines (Statements 4940/4940, Branches 2143/2143, Functions 1031/1031,
Lines 4423/4423).

Red, recorded: named test 1 re-proven against the pre-change tree in a scratch worktree
off `uat` (minimal harness around the same assertions: `1 failed` - rows carry no `id`,
`english` present). Named test 2's type-red is unwitnessable as written: the step says
the old `string` signature rejects a `PrayerId`-typed fixture, but `PrayerId` is assignable
to `string`, so the old signature compiles and the byte outputs are identical (the step's
own parenthetical admits this). The red that is real is the suite-wide retype: the
title-case fixtures failed tsc all through this session's sweep (witnessed: widgetRenderer
197, alarmHarness 122, the string-vs-PrayerId lines). Plan-text slip, no plan change.

Breaks, 4 of 4 AS EXPECTED, final `ALL AS EXPECTED: 1`:

1. Night-branch narrowing reverted to `String(name) === 'Midnight'` comparisons: named
   test 1 fails (night rows unreadable). Restored from backup.
2. At-time identifier slugified through `prayerNameSlug`: the contract test's space-form
   pins fail. Restored.
3. Alert-key factory template suffixed `_x`: contract test 2 fails. This needed test 2
   strengthened first: as inherited it derived the key set inside the test, so a factory
   move could not touch it - against the step's own break contract. Test 2 now also pins
   the three factory template bytes in `stores/notifications.ts` source (the suite's
   existing read-the-source pin pattern); no existing assertion changed. Restored.
4. `isDailyPrayer` widened to `(x: string)`: the firewall's directive over
   `isDailyPrayer(prayerLabel('fajr'))` goes stale, `TS2578` on the tsc gate. This break
   only works because the firewall covers `isDailyPrayer` too - contract 7 enumerates
   four builders and break 4 names a fifth; the two lines are consistent only with the
   fifth call included, so the firewall carries it. Restored.

Executor strengthenings, three conditions met (code the plan did not give verbatim, no
plan-named name/signature/log-line/behaviour changed, every acceptance criterion still
green): the factory-template source pins in contract test 2 (break 3 demanded them); the
`isDailyPrayer` firewall line (break 4 demanded it); `seedReminder` in
`notificationSinglePrayerUpdate` re-armed the identifier not the id (the previous
executor's mid-sweep damage, caught by the suite); `armedFor` in `notificationAlertCommit`
filtered `id.includes('__')`, matching nothing - restored to filter by the id.

Done-when grep `\.english` outside `__tests__` returns nothing. The stylesheet key
`styles.english` in `Prayer.tsx` was the last field-named survivor and is now
`styles.name` (a style key, no pixel moved); `usePrayerSequence`'s doc example and two
stale `@param`/comment mentions renamed with it. One production `toLowerCase()` survives,
in the migration loop, exactly as the step mandates.

Version 1.29.326 (origin fetched first; origin/uat sits one merge behind local uat at
53eecb99, nothing newer to race). Committed `872619f8`, merged into `uat` as `874ec768`.
Hook: `Tests: 5255 passed, 5255 total`, four 100% lines (Statements 4940/4940, Branches
2143/2143, Functions 1031/1031, Lines 4423/4423). Review: one pass, cold over
`git show 872619f8`, nothing to fix - no lifecycle, thread or worklet line in the diff;
`getPrayerArrays` consumers all id-consistent (two indexOf sites, two positional walks);
the title arrays live only in their migration-era and width-measurement homes; identifiers
and keys byte-identical throughout, proven by the contract test green in the commit's own
hook run (the Rule pin).

## Step 7: the bridge and interpolation

- Branch `feat/38-07-bridge` off `uat`. The step's two anchors (`content-builders`,
  `reminder-content`) hold the post-step-04 text and step 06 consumed them by design (the
  step file's own parenthetical: edit against the post-06 shape) - the live regions match
  that shape, verified before editing.
- Red, recorded: `i18nBridge.test.ts` written (bare-mode parity plus the runner modes);
  tsc line `TS2554: Expected 1 arguments, but got 2` at the interpolation test (t took no
  second argument) plus `TS2305 ... no exported member 'ParamsOf'`; runtime `2 failed`
  (interpolation, token coverage). The notifications addition 'builds the titles from the
  catalog templates' failed tsc on the same lines (the template keys did not exist yet).
  The step's red-2 note "fails before (signature)" predates the replan: step 06 already
  landed the builder signature, so the red is the missing catalog keys, not the signature.
  Plan-text slip, recorded.
- Contracts: `t` gained `{token}` interpolation with the exact missing-parameter throw;
  `ParamsOf` is the four-line conditional. The plan's prose signature
  (`params?: Record<string, string | number>`) is looser than A6's "typed per key", so
  `ParamsOf` is wired into `t`'s own parameter (a production read, no allowlist entry
  needed) and the two deliberate-violation throw pins carry an explicit
  `as ParamsOf<...>` cast to get past the typing they exist to police.
- The bridge: `i18nBridge.test.ts` doubles as the runner (export writes
  `shared/i18n/dist/en.json` and exits 0; import reads `<I18N_LOCALE or en>.json` and
  asserts identity). `yarn i18n:export` / `yarn i18n:import` exit 0 (the package.json
  entries verbatim from contract 5), and `scripts/i18n-export.mjs` / `scripts/i18n-import.mjs`
  wrap the same command for the pipeline (both verified exit 0). `shared/i18n/dist/` is
  gitignored (the existing `dist` rule covers it); no artefact staged.
- The two templates joined `en.ts` (`notification.now: '{name} now'`,
  `notification.reminder: '{name} in {n}m'`) and the builders read them through `t`;
  the existing pins `'Fajr now'` and `'Fajr in 15m'` still pass unchanged - the byte-parity
  proof the review names.
- The unused-export gate retired `t`'s allowlist entry (step 7 reaches it in production;
  step 5's log said removal rides whichever step reaches it).
- Breaks: 3 of 3 AS EXPECTED (template uppercased fails the title pin; throw dropped fails
  the bridge assertion; one value nested fails the flat-string parity), restore green:
  `ALL AS EXPECTED: 1`.
- Green: tsc clean, Biome clean (after `--write`: import order in the bridge test, the
  ParamsOf formatting). One hook rerun: the first commit attempt died on a jest worker
  SIGSEGV in `List.test.tsx` (watchman recrawl warning beside it) - the same suite passed
  on both sides of the attempt, infrastructure flake, not a test failure.
- Version 1.29.327. Committed `80130edf`, merged into `uat` as `dac75402`. Hook:
  `Tests: 5261 passed, 5261 total`, four 100% lines (4945/2145/1032/4429). Review: one
  pass, clean - the only `{{`/`$t(` strings in the diff are the bridge test's negative
  pins; no dist artefact staged; titles byte-identical by the unchanged `'Fajr now'` and
  `'Fajr in 15m'` pins (the Rule proof); no lifecycle or thread surface added.


## Step 5: the id vocabulary and the catalog

- Branch `feat/38-05-catalog` off `uat`. Red: the suite failed on the absent module
  (`Could not locate module @/shared/i18n`, jest 30's phrasing of the step's named
  `Cannot find module`), recorded before any module existed.
- `shared/constants.ts` gained the five declarations beside the title-case arrays:
  `STANDARD_PRAYER_IDS` after `PRAYERS_ENGLISH`, `EXTRA_PRAYER_IDS` ('last third' with the
  space), `PrayerId`, `StoredPrayerId`, `PRAYER_IDS` (spread concatenation, `as const`)
  after `EXTRAS_ENGLISH`.
- Catalog membership, recorded because the census number is not a membership: the
  planning census (`inventory-strings.py`) counts capitalised regex ROWS per file, so its
  "27 help strings" double-counts platform-repeated rows, glues multi-string lines into one
  row, and misses every literal over 80 chars or containing `\n`. The distinct user-visible
  help strings are 30 (7 questions, 9 answers, 13 steps, the dndAccess action label);
  What's New is exactly 14 (7 titles, 7 bodies - the census reached 14 by a different
  arithmetic that counted the Android badge twice and dropped two long bodies); Settings is
  the 9 labels the contract enumerates. The catalog holds all of them, keys in step 08's
  shapes (`help.q/a/step.x`, `whatsNew.title/body.x`, `settings.*`, plus
  `help.action.dndAccess` for the action label). Step 08 item 4 remains the completion net.
- `PRAYER_LABELS` is an inline-annotated `Record<PrayerId, string>` in `en.ts`, every value
  read out of the catalog's own `prayer.*` members; `prayer.last third` carries the space.
  `index.ts` re-exports `en` and `PRAYER_LABELS`; the loader is the only path `t` and
  `prayerLabel` read through.
- Unused-export gate: fired on exactly the four predicted symbols (`t`, `prayerLabel`,
  `PRAYER_IDS`, `StoredPrayerId`), added to `REACHED_WITHOUT_AN_IMPORT` with reasons naming
  the reaching step (06 for prayerLabel/PRAYER_IDS/StoredPrayerId, 08 for `t`). Removal
  rides those steps.
- Green: i18n + contract suites 13 passed; full suite `190 suites, 5253 passed`, four 100%
  coverage lines (4937/2144/1031/4422). tsc clean. Biome clean (formatter reflowed three
  long strings and organised imports in the new files).
- Breaks: 3 of 3 AS EXPECTED. Break 2's named compiler line:
  `shared/i18n/en.ts(92,14): error TS2741: Property 'duha' is missing ... but required in
  type 'Record<PrayerId, string>'`. Restore green, bytes identical to backup,
  `ALL AS EXPECTED: 1`.
- Step-text slips, no plan change needed: break 2 says "in `index.ts`" but contracts 2 and
  3 place `PRAYER_LABELS` in `en.ts`; the deletion ran where the Record lives. Jest 30's
  default reporter prints `● describe › test` blocks, never the ✕/✓ glyphs; the break
  script matches the ● lines and the summary counts.
- Version 1.29.325. Committed `adea6784`, merged into `uat` as `abf2fd98`. Hook:
  `Tests: 5253 passed, 5253 total`, four 100% lines (4937/2144/1031/4422). Review: one
  pass, nothing to fix (flat keys, `as const satisfies`, byte parity machine-verified 64
  members to 64 pins with zero mismatches; no lifecycle, thread or rule surface in the diff).

## Deep review at close (steps 1 to 4)

Read the whole executed range `5d0ca54c..HEAD` cold (58 files, +416/-680, plus this
cleanup). Verdict by class:

- **Lifecycle / Thread:** zero added lines touch effects, timers, subscriptions or worklets
  (grep over the diff and read of every production addition).
- **Residue:** six finds. Four cleaned in the review's commit: two untyped record fixtures
  still carrying `arabicName` (`notificationStaleCancelFailure`, `reminderCancelFailure`),
  one mock sheet state still passing `prayerArabic` (`ui.test`), one stale cascade-length
  comment (`prayer.test`), one stale `@param arabicName` doc (`useNotification`). The sixth
  is this step's own `'arabicName' in record` guard, which stays.
- **Rule:** identifiers and keys byte-identical throughout - `prayerIdContract` green in every
  commit's full run; no substituted values; the only visual deltas are the ruled removals.
- **Coverage:** 100% on statements, branches, functions and lines at every step commit
  (hook output recorded per step); final full suite `189 suites, 5249 passed`.

One pass, nothing else to fix.

## Step 4: `PrayerRow.arabic` dies end to end

- Branch `feat/38-04-plumbing` off `uat`. Red: "creates prayer with an english name and no
  arabic field" failed first; the commit-signature red landed as a type-red (the old arity no
  longer compiles), recorded here per the step's note.
- The sweep: `PrayerRow.arabic`, `CreatePrayerParams.arabic`, `getPrayerNamesForDate`'s Arabic
  array, `PRAYERS_ARABIC`/`EXTRAS_ARABIC`, `ScheduledNotification.arabicName`, both
  `_arabicName` parameters, the `arabicName` threading through twelve store signatures,
  `AlertSheetState.prayerArabic`, the usePrayer loading row's `arabic: ''`, and the device
  record writes. `getPrayerArrays` now returns the name array itself; its three `.english`
  consumers (the plan walk, `canonicalPrayerIndex`, `alarmHarness`) re-keyed. The extras
  cascade-length quirk (R13) collapses to `PRAYERS_ENGLISH.length`, byte-identical at 6.
- Executor strengthenings, three conditions met: the two device record writes gained inline
  `NotificationUtils.ScheduledNotification` annotations, because a variable-carried excess
  property escapes tsc and nothing else pinned the armed record's field set (the break proved
  the hole); `notificationOffCancelFailure` asserts the stored records carry `englishName`
  and no `arabicName`.
- Fixtures: 25 suites plus `alarmHarness.ts` re-keyed (arabic properties, arabicName call
  arguments, tuple types, Arabic literals, parity tests). `constants.test.ts`'s two
  English-Arabic parity pins became one no-shared-member pin; `getPrayerArrays`'s describe
  re-pinned to the array-returning shape.
- Green: full suite `189 suites, 5249 passed`. tsc clean. Biome clean.
- Breaks: 3 of 3 AS EXPECTED (row regains an arabic field; armed record regains arabicName
  against the annotation; title bytes change), restore green: `ALL AS EXPECTED: 1`.
- Incident, no damage escaped: a break-script restore ran `git checkout --` on a file whose
  step edits were uncommitted, reverting `device/notifications.ts` mid-verification; caught by
  grep before commit, re-applied, and the final break run proved the restored state. Lesson
  already in the resume note: restores use backups, never `git checkout`, until the step is
  committed.
- Version 1.29.314.


Steps 1 to 3 are committed and merged (freeze test `aa7d2014`, row `719b64c2`, chrome
`b4ad82d6`). The next session: run the pre-flight with k=4, resume the IN PROGRESS row, and
execute step 4 (`steps/04-arabic-data-plumbing.md`), the widest step: `PrayerRow.arabic` dies
end to end, the commit signatures lose their `arabicName` parameter
(`commitPrayerAlertChange` at `stores/notifications.ts:1330`, `commitAlertMenuChanges` at
`hooks/useNotification.ts:210`, threading through `applyPrayerAlerts`,
`undoPrayerAlertChange`, the schedule/reminder twins), and `PRAYERS_ARABIC`/`EXTRAS_ARABIC`
leave `shared/constants.ts`. Note `EXTRAS_EXPLANATIONS_ARABIC` already went with step 3
(unused-export gate), so step 4's constants edit covers only the two name arrays. Lessons that
carry: untracked new files restore from a backup copy (`git checkout --` aborts atomically on
them); delete constants by exact-text edit, never a regex block match; `git rm`-staged
deletions are already in the index, do not re-add their paths; write the commit message file
immediately before `git commit -F`.

## Step 1: the freeze test

- Branch `feat/38-01-freeze-test` off `uat`.
- `shared/__tests__/prayerIdContract.test.ts` written per the step: 9 tests, 8 derived from
  the planning proof plus the bookkeeping-record-key pin. One production word changed:
  `export` on `EXTRAS_ENGLISH_PRE_1_0_27` (`stores/notifications.ts:487`).
- Green: `Tests: 9 passed, 9 total` (matches the planner's proof prediction of the draft's 8
  plus the record-key test). `npx tsc --noEmit` clean. `npx biome check . --error-on-warnings`
  clean.
- Executor findings recorded:
  1. The frozen literal `preference_alert_standard_magrib` was first written `maghrib`; the
     pin caught its own author. Fixed to the app's `magrib` spelling.
  2. Break-script defect (tooling, not plan): `git checkout --` aborts atomically when the
     list names the untracked test file, leaving every mutation in place. The break script now
     backs up the test file and restores tracked sources by name. Nothing in the plan text
     needs to change; step files say "restore the file", which the backup satisfies.
- Breaks: 4 of 4 AS EXPECTED (slug separator, identifier slugify, array reorder, frozen-list
  member removal), final restore green: `ALL AS EXPECTED: 1`.
- Version 1.29.308. Row set IN PROGRESS with this commit.
- Committed `aa7d2014`, merged into `uat`. Hook: `Tests: 5263 passed, 5263 total`, four 100%
  lines (Statements 4938/4938, Branches 2153/2153, Functions 1031/1031, Lines 4427/4427).
  Review: one pass, nothing to fix (the diff is the suite, the one-word export, the row and
  this log).
- One hook iteration: Biome `noTemplateCurlyInString` fires on the four source-text pins;
  each carries a per-line ignore with its reason (a pin of template-literal source text must
  not interpolate).

## Step 2: the row's Arabic column dies

- Branch `feat/38-02-row` off `uat`. Red: "names the prayer once, in one language" failed
  against the atom-defaulted Arabic Text, then the change removed the conditional block, the
  `arabic` style, the atom read and its import from `Prayer.tsx`; both Arabic tests deleted
  with the surface, the mock entry dropped from `Prayer.test.ts`.
- Green: Prayer folder 7 suites, 57 tests. tsc clean. Biome clean.
- Breaks: 2 of 2 AS EXPECTED (ungated Arabic Text returns; name uppercases), restore green:
  `ALL AS EXPECTED: 1`. Version 1.29.310.

- Version 1.29.314. Committed `b8eef85f`, merged into `uat`.

## Replan 2026-10-10: the anchor ownership repair

> The gate retrofit below landed later the same session, on the owner's ruling; read both.

The k=5 pre-flight failure was the plan's, not the tree's. Root cause, verified this session:
the pre-flight map gave each anchor one owning step, but step 04's own contracts mandated
edits inside regions the map assigned to steps 05, 06 and 07, so their anchor files zeroed.
The same defect sat further down the chain: step 06's contracts also retype the `ago-text`,
`channel-reminder`, `content-builders`, `reminder-content`, `timeline-names` and
`timeline-next` regions ahead of their original owners (steps 07/10/13), which would have
broken the k=7 and k=10 and k=13 pre-flights the same way after step 06 landed.

Repair, all inside the plan folder:

- Eleven anchor files named by steps 05 to 09 regenerated from the post-step-04 tree at
  `76a40d3f` by `scripts/regenerate-anchors-38.sh` (sha-guarded, a record not a tool):
  `constants-arrays`, `useprayer-sentinel`, `content-builders`, `reminder-content`,
  `prayerrow-type`, `namesforDate`, `unreadable-row`, `multi-schedule-sig`,
  `scheduled-record-type`, `explanation-arabic`, `overlaycontent-arabic`. Each counts
  exactly 1 at `76a40d3f`.
- Seven anchors re-owned to step 06 in the pre-flight map (the first step not yet DONE that
  edits the region is the owner): `ago-text`, `channel-reminder`, `content-builders`,
  `reminder-content`, `timeline-names`, `timeline-next`, `overlaycontent-arabic` (the last
  added on the grill's finding: step 06's retitle of `EXTRAS_ENGLISH` rewrites the region's
  `indexOf` line, which step 09 would otherwise have grepped as stale).
- Parentheticals added where a step names an anchor an earlier step rewrites: steps 07, 08,
  09, 10, 12, 13.
- Ownership rule recorded in PLAN.md section 4. No step contract changed; no app code
  touched. The decision (regenerate AND re-own, each where it applies) is mechanical
  planning machinery, taken on the code evidence; nothing here is an owner ruling.

## Gate retrofit 2026-10-10 (owner ruling: retrofit row 38 now)

The plan predates `scripts/check-plan.sh` (planned at 1.29.305, gate born at 1.29.316) and
failed it on 31 findings, every one pre-existing (the anchor repair itself removed two and
added none; verified by running the gate before and after on both trees). The owner chose
retrofit over record-and-continue. What landed, all plan-folder bytes:

- EARS acceptance criteria R1.1 to R9.1 added to PLAN.md section 5; every step file opens
  with a `Requirements:` line citing its criteria; every criterion resolves to a step.
- Every anchor over 15 lines split into named pieces (channel-reminder, constants-arrays,
  countdown-name, device-ids, extras-channel, migration-core, setwidth, slug,
  version-keeplist, version-upgrade); every anchor under 3 lines widened (explanation-arabic,
  shownames-atom). The pre-flight map, the step Anchors lines and the in-contract anchor
  mentions carry the new names; 50 anchors owned by steps 05 to 13 all count exactly 1.
- The one banned hedge word in step 04 rewritten.
- `scripts/regenerate-anchors-38.sh` deleted: its output is superseded by the split files,
  and git history holds it. PLAN.md section 4 names git history as the record.

`scripts/check-plan.sh` prints `PLAN OK`. No step contract changed and no app code touched.

## Resume from: step 5, part 0 (replan landed)

Steps 1 to 4 are committed, merged and deep-reviewed; the anchor repair above is merged.
The next session: run the pre-flight with k=5, resume the IN PROGRESS row, and execute step
5 (`steps/05-catalog-and-t.md`) as written. Step 6 then renames the row field to `id` and
retypes every builder. Standing lessons: restores use file backups, never `git checkout`,
before the step commits; delete constants by exact-text edits; regenerate the commit-message
file right before use; pin writes with inline type annotations or runtime assertions (a
variable-carried excess property escapes tsc).

## Resume from: replan needed before step 5 (session stopped at pre-flight)

The k=5 pre-flight fails: four anchors count 0, and all four are the direct product of step 4's
own mandated deletions against text the anchor map assigns to later steps:

- `constants-arrays` (step 5, `shared/constants.ts`): the anchor carries `PRAYERS_ARABIC` and
  `EXTRAS_ARABIC`, which step 4 item 3 deleted.
- `useprayer-sentinel` (step 6, `hooks/usePrayer.ts`): the anchor carries the loading row's
  `arabic: ''`, which step 4 item 8 deleted.
- `content-builders` and `reminder-content` (step 7, `shared/notifications.ts`): both anchors
  carry the `_arabicName` parameters, which step 4 item 4 deleted.

Step 4 executed its contracts faithfully (verified against the tree this session: the sentinel
and both builder signatures match step 4's post-change shape; no Arabic remnants in
`shared/constants.ts`). The defect is the plan's, not the tree's: the anchors were extracted
once at `c3149dfc` and the map assigns each a single owning step, so step 4's edits inside
steps 5/6/7 regions zero their counts. PLAN.md section 10 rules this NEEDS REPLAN and the
executor may not repair anchors. Steps 5, 6 and 7 each hit this otherwise (k=6 fails on
`useprayer-sentinel`, k=7 on the two builders), so the replan should regenerate or re-own all
four in one pass. Nothing was executed for step 5; the tree is clean at `76a40d3f` apart from
this log and the queue row. After the replan: run the pre-flight with k=5 and execute step 5
(`steps/05-catalog-and-t.md`) as written. Standing lessons carried: restores use file backups,
never `git checkout`, before the step commits; delete constants by exact-text edits; regenerate
the commit-message file right before use; pin writes with inline type annotations or runtime
assertions (a variable-carried excess property escapes tsc).

## Step 3: the Arabic chrome dies

- Branch `feat/38-03-chrome` off `uat`. Red: "shows no arabic-names toggle" and "names the
  prayer and explains it in one language" both failed before the change.
- Removed: the Settings wiring, toggle row and import; the explanation box's Arabic line,
  style, prop and doc; `OverlayInfoBox`'s destructure, guard term and prop pass;
  `overlayContent`'s type field, assignment and import; `toArabicNumbers` and
  `ENGLISH_TO_ARABIC` (`shared/text.ts` and its suite deleted with the surface);
  `showArabicNamesAtom`.
- Executor fix, three conditions met (recorded per the step-8 rule): the plan kept
  `EXTRAS_EXPLANATIONS_ARABIC` in `shared/constants.ts` for step 4, but removing its last
  consumer leaves the export unreachable and fails `unusedExports`. The array and its
  `constants.test.ts` length pin are deleted in this step instead of step 4.
- Executor incident, no repo damage: a regex block-deletion in `shared/constants.ts` matched
  from the file's first doc comment and removed the first 1009 lines. Caught immediately by
  the suite (`PRAYERS_ENGLISH` undefined), restored from git, redone as an exact-text edit.
  Diff verified at 15 deleted lines before proceeding.
- Green: constants 49, overlayContent + overlayPlacement 34, Settings + Explanation + Overlay
  39, ui 27. tsc clean. Biome clean. `grep` finds zero surviving references to the four
  removed identifiers outside `ai/plans`.
- Breaks: 3 of 3 AS EXPECTED (toggle row returns; Arabic explanation returns; dead atom
  unreachable), restore green: `ALL AS EXPECTED: 1`. Version 1.29.311.
