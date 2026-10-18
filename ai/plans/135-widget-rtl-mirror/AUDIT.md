# AUDIT — ticket 135

Two reviewer passes over the whole landed range, plus the lead's own cold
read of the diff and adjudication of every finding.

Range: `b5bee6a9..a1c6347a` (the ticket's whole surface: steps 1 to 4, the
D135.13 repair and the step-4 readings; the sibling-lane commits inside the
range touch disjoint files and are out of scope).

## Pass one: plan-conformance

Range: `b5bee6a9..a1c6347a`
Findings: findings-plan-135.md
Verdict: PASS, no MUST. Every acceptance criterion R1.1 to R5.2 and every
decision D135.1 to D135.14 verified against the repository.

Findings and verdicts:

1. [should] Duplicate stale queue rows (135 "IN PROGRESS, step 3" and 138
   "DEFERRED") survived the lane-weather merge. CONFIRMED by the lead's own
   read (README lines 273/274 pre-fix). FIXED: both stale rows deleted in
   the audit's docs commit.
2. [should] records-135.md's DONE cell claimed device proof "under app
   Arabic and English" on both phones, overstating the XS read against the
   recorded D135.14 waiver. CONFIRMED. FIXED: the cell names the as-found
   Arabic XS read, the accessibility-tree channel and the waiver's ground.
3. [should] records-135.md carried a second, stale pre-amendment veto
   section contradicting her 2026-10-18 order. CONFIRMED. FIXED: the stale
   section deleted; the live veto section (the composed-label mechanism and
   the simulator digits) stands.
4. [nice] The Step 01 ledger lacked its version and session lines and Step
   00 carried a "session: pending" stub. CONFIRMED. FIXED: both backfilled
   (2.0.1031 merged as `1d69959c`, executor-135-s1; lane-135-planning).

## Pass two: blind

Range: `b5bee6a9..a1c6347a`
Findings: findings-blind-135.md
Verdict: PASS. The mirror is complete (no half-mixed input), the label
arithmetic matches the fixtures, the patch round-trips against the pinned
expo-widgets 58.0.20, tsc and Biome clean, 107/107 widget tests green.

Findings and verdicts:

1. [should] The label group's inner Row omitted `verticalAlignment`, and
   the converter defaults Row children to Alignment.Top
   (`ExpoWidgetEmittableTree.kt`'s `else -> Alignment.Top` branch), lifting
   the 24.7sp letter about 1sp off the digit's ride, while the app face it
   copies nests the letter inline on the digits' baseline
   (`Countdown.tsx`'s inner `Text`). CONFIRMED from the converter source
   and the app component; the runtime offers no baseline alignment, and
   centre is the closest expression. FIXED red-first: the composition test
   asserts `verticalAlignment: 'center'` on both inner Rows (red:
   `Expected: "center" / Received: undefined`), then the Row carries it;
   suite green 71/71.
2. [nice] The v8/v4 version-history comments still say "(blocked, P16)".
   REJECTED: the planning grill round scoped step 3's docblock change to
   the two FIELD docblocks precisely so the per-version history lines keep
   their provenance (the state at each version's introduction is the
   changelog's truth), the contract test pins that intent in prose
   ("keep their provenance words"), and the field docblocks above name both
   live consumers. The blind pass could not know the scoping; verified
   correct by the plan-conformance pass.
3. [nice] The `duration.h/m/s` catalog keys lost their last reader (the
   bake writes literals; the app countdown carries fixed Latin letters).
   CONFIRMED by the reader census (zero readers outside the catalogs and
   the i18n test rows; `duration.now` keeps two live readers and stays).
   FIXED: the three keys deleted from all six catalogs, the three test rows
   removed, the catalog lock re-taken, the dist regenerated (en.json
   carries `duration.now` alone).

## The lead's own checks

The diff read cold once end to end (the mirror table's eight rows plus the
D135.13 width swap, the label composition, the patch hunk); the whole
`yarn validate` chain ran green on the audit-fix tree inside the commit
hook (`Tests: 2 skipped, 5760 passed, 5762 total`, coverage 100 percent on
all four measures); the break scripts stay red on their mutants; the
version took the next free number under the uniqueness gate.

Vision note: the pixel corroboration of the XS read could not run — three
`vision` dispatches sat unstreaming and the first returned a platform
stream error ("Chat stream ended without finish_reason"); the screenshots
exist uncommitted under `~/athan-gitree/sessions/135/xs/`. The structural
accessibility read is the proof of record (the e2e rules prefer the
structured tree over pixels), and the 3T carries the pixel-band evidence
on the Android side.
