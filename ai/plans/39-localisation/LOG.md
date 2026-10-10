# Execution log: Job 38

## Resume from: step 8, part 1 (guard seeds proven, migrations not started)

Steps 1 to 7 are committed and merged into `uat` (step 6 `872619f8`/merge `874ec768`,
step 7 `80130edf`/merge `dac75402`; hook lines in their sections below). `uat` is two
merges ahead of `origin/uat` (origin at `53eecb99`); the executor cannot push. This
LOG.md's step 6-7 close-out edits are on disk, uncommitted - they ride the step 8 commit.

Step 8 (`steps/08-strings-wave-1.md`) was started to its red and stopped on session
context; no production file was touched and the tree is clean apart from this log. The
three guard seeds are finished and saved verbatim under `~/athan-gitree/sessions/38/`
(`scan-strings.mjs`, `string-census-allowlist.json`, `stringGuard.test.ts`,
`step08-guard-red.log`); copy them back rather than rebuilding. What the next session
must know:

- The scanner is copied verbatim from the plan folder, but its `argv[2]` is an optional
  ROOT: calling `node scripts/scan-strings.mjs --guard <file>` silently scans nothing
  (ROOTS becomes `['--guard']`). Invoke it with an empty-string second arg:
  `node scripts/scan-strings.mjs '' --guard scripts/string-census-allowlist.json` - that
  keeps the default roots and the guard works (verified: exit 1, 29 offender lines, all
  `components/sheets/screens/Settings.tsx`). The saved guard test already does this.
- The allowlist is the census's 30 rule-1/2 files minus Settings.tsx (29 entries,
  sorted). help.ts and whatsNew.ts produce no rule-1/2 hits (data modules, no JSX), so
  the step's red prose "listing exactly those three files' hits" overstates: the guard
  red lists Settings.tsx only; the other two fail the guard test's third rule (the
  source read). Red was recorded exactly so.
- The guard test's third rule (dataModules) asserts help/whatsNew import from
  `'@/shared/i18n'`, hold no `get*String` helper, and call `t(` - it is red until the
  migration lands.
- help.ts design (surveyed, not written): `HELP_ENTRIES` becomes key arrays over the
  existing `help.q/a/step.x` catalog keys (all present in `en.ts`, verified); the
  ios/android split uses the `.ios`/`.android` answer keys the catalog already carries;
  `HELP_ACTION_LABELS` resolves through `t('help.action.dndAccess')`; `getHelpTopics`
  maps every field through `t()`. The step's named red test `getHelpEntries()` does not
  exist - the module exports `getHelpTopics`; write the catalog-sourcing test against
  the real surface (another plan-text slip to record).
- whatsNew.ts design (surveyed): the archive items become `titleKey`/`bodyKey`
  TranslationKeys (`whatsNew.title/body.x`, all in the catalog); `WhatsNewItem`'s public
  shape stays `title: string`; `getVisibleWhatsNew` resolves through `t()`;
  `filterWhatsNewItems` takes the archive shape, so `whatsNew.test.ts` fixtures re-key.
  `getPlatformBadges`'s 'iOS'/'Android' glyphs are not catalog strings and stay.
- Settings.tsx: 29 rule-1/2 hits include NON-display literals the scanner cannot tell
  apart (`rgba(...)` colors, `sheet_settings` testID) - the migration must move those
  off string-literal JSX attributes (expressions/constants) or the guard cannot go
  green; the display labels go through `t('settings.…')`.
- Standing lessons carry: restores use file backups never `git checkout` before the step
  commits; delete constants by exact-text edits; regenerate the commit-message file
  right before `git commit -F`; pin writes with inline type annotations. One flake
  pattern seen this session: a jest worker SIGSEGV (watchman recrawl) killed one commit
  attempt - regenerate the message file and commit again.

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
