# Execution log: Session 38

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
