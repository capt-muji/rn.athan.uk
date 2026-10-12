## Ticket 60

## Planning (2026-10-12)

- Surface inventory mapped: five sheets through Sheet.tsx, three modals through
  Modal.tsx, ColorPicker bounded, Error out of scope. Library facts verified at
  @gorhom/bottom-sheet 5.2.14 (dynamic detent math, the shared contentHeight
  writer, the pinned-header constraint under dynamic sizing).
- Interview taken 2026-10-12 (D70 to D73 in PLAN.md section 2.1): scope is the
  modal family only, no bottom sheet changes at all; every modal must be
  capped; Help stays untouched; WhatsNew gets the Help pattern; Update's
  message also gets a bound that never engages at today's copy.
- Catalog facts measured: update.message runs 37 to 60 characters across all
  six languages; help totals 1160 to 1498 characters; whatsNew keys total 559
  to 594.
- Scratch-worktree proof at uat c88f50f5: both scroller tests red on pristine
  code (TypeError at the flatten line), green after the exact step contracts
  (19 passed across both suites), tsc exit 0, Biome exit 0 after the
  import-order placement, break fails the named test (1 failed, 10 skipped).
  Worktree removed.
- Draft written: PLAN.md, two step files, pre-flight, seven anchors all
  counting 1. Gate and grill next.
- Gate: `bash scripts/check-plan.sh` printed `PLAN OK` on the first run.
- Grill (plan-griller, cold): zero must findings; five applied (WhatsNew test
  count ten not nine, the D71 strike line added to section 12, the Update test
  placement named exactly, "same six lines" corrected to "same fields", the
  731 dp figure marked planning-computed with its derivation). No second
  round: fewer than six problems.
- Ticket set READY, planned at uat c88f50f5.

### Step 01 — done

- Branch: `code/60-1-whatsnew-bounded-list` off `uat`. Preflight copy run from
  `$TMPDIR` per PLAN.md section 3: `PREFLIGHT OK`. Anchor check: wn-list-open,
  wn-list-close, wn-styles-list each count 1.
- Red: `TypeError: Cannot read properties of undefined (reading 'maxHeight')`
  at the flatten line, `Tests: 1 failed, 10 skipped, 11 total`, exactly as the
  step predicts.
- Change: the five contract edits in `components/modals/WhatsNew.tsx`
  (ScrollView import, hook import after `@/components/ui`, LIST_HEIGHT_SHARE
  below FAINT_BLUE, `useWindowDimensions` opening the component, list View to
  ScrollView with the gap moved to `styles.listContent`) plus the StyleSheet
  import and the scroller test in `WhatsNew.test.tsx`. The map body is byte
  identical.
- Green: `Tests: 11 passed, 11 total`; `npx tsc --noEmit` exit 0;
  `npx biome check . --error-on-warnings` exit 0.
- Break: `ALL AS EXPECTED: 1`; after the break `git status --porcelain` listed
  only the step's two files.
- Version: 2.0.100 (origin fetched under the version lock at 2.0.99, one patch
  past the plan's expected 2.0.99; app.json, package.json and
  android/app/build.gradle versionName all set, app.json first).
- Commit: `f6c7a0f4` (2.0.100), hook green: `Tests: 5469 passed, 5469 total`;
  Statements 100% (5213/5213), Branches 100% (2246/2246), Functions 100%
  (1082/1082), Lines 100% (4669/4669).
- Review: read `git show f6c7a0f4` cold. The diff is the five contract edits
  plus the sanctioned test, version and plan files, nothing else; the map body
  is byte identical (diff-verified). No sheets file, no Modal.tsx, no Help.tsx
  (D70). No padding, margin or colour added beyond the moved gap and the
  unchanged marginBottom. `styles.list` keeps width and marginBottom, both
  read; `styles.listContent` read. No lifecycle, thread, residue or rule
  finding. No fix applied.
- Merge: `42a5cc96` ("2.0.100 - merge code/60-1-whatsnew-bounded-list:
  WhatsNew list bounded (60 step 1)"), no conflict. Step branch deleted after
  the merge.

session: ses_ecffa9787ffePI2dQO5uEO6LPk

### Step 02 — done

- Branch: `code/60-2-update-bounded-message` off `uat`. Tree carried only the
  step 01 LOG fill. Anchor check: update-message, update-styles-message each
  count 1.
- Red: `TypeError: Cannot read properties of undefined (reading 'maxHeight')`
  at the flatten line, `Tests: 1 failed, 7 skipped, 8 total`, exactly as the
  step predicts.
- Change: the five contract edits in `components/modals/Update.tsx`
  (ScrollView import, hook import before `@/shared/constants`,
  MESSAGE_HEIGHT_SHARE below the Modal import, `useWindowDimensions` opening
  the component, message Text wrapped with `marginBottom: 36` moved to
  `styles.messageScroll`) plus the StyleSheet import and the scroller test in
  `Update.test.tsx`.
- Green: `Tests: 8 passed, 8 total`; `npx tsc --noEmit` exit 0;
  `npx biome check . --error-on-warnings` exit 0.
- Break: `ALL AS EXPECTED: 1`; after the break `git status --porcelain` listed
  only the step's two files and the plan LOG fill.
- Version: 2.0.101 (origin fetched under the version lock; local uat 2.0.100,
  origin/uat 2.0.99; app.json, package.json and android/app/build.gradle
  versionName all set, app.json first).
- Commit: (filled after the merge, with the hook line)
- Review: (filled after the merge)
- Merge: (filled after the merge)

session: ses_ecffa9787ffePI2dQO5uEO6LPk
