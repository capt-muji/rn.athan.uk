# Execution log: Job 38

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
