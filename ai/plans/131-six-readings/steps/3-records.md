# Step 3: records, the row cell, evidence fold

**Requirements:** R0.1, R6.1
Weight: 1

Anchor check: none new (covered by the pre-flight).

## Goal

READINGS.md holds all six sections (RD6 recorded void by ruling), the row 131 cell
carries the EXECUTED text with the six verdicts, and the lane's docs commits are
merged.

## Branch and commits

Lane branch `lane/131`. One docs commit:
`<VERSION> - docs(plans): ticket 131 step 3, the six readings folded into the row`.

## Files

- Lane: `ai/plans/131-six-readings/READINGS.md`, `LOG.md`, the row 131 cell in
  `ai/plans/README.md`.

## Red tests

None (docs step).

## The work

1. RD6's section, verbatim in shape: "VOID BY RULING. Row 121's DONE cell records
   her 2026-10-16 ruling: adopt nothing, the classic heading path and the upstream
   PR stay. No adopted prebuild exists to diff, and row 121's record already states
   both /next native modules compile into every build today, which makes an
   adoption's native deltas zero by construction. Not measured, not forced." That
   text satisfies R6.1.
2. Read every quoted line in READINGS.md against its transcript under
   `sessions/131/`; delete any verdict line without a source line.
3. Draft the row 131 EXECUTED cell: one clause per reading naming the verdict and
   its evidence class, plus the restorations. Keep it inside the cell's width; the
   audit folds it into the DONE text.
4. Check R0.1: `git diff ca73f5a9..lane/131 --stat -- . ':(exclude)ai/plans'`
   prints only the three version files (package.json, app.json) and nothing else;
   `git diff ca73f5a9..lane/131 --stat -- ai/plans` prints only
   `ai/plans/131-six-readings/` and `ai/plans/README.md`.
5. LOG.md step entry with its `session:` line, commit, merge under `uat.lock`,
   sync the main tree's `android/app/build.gradle` `versionName` under
   `build.lock`.

## Break script

None owed. Honesty check: the R0.1 diff command above prints nothing outside the
plan folder, the queue row and the version files.

## Done when

All six sections exist, the row cell is drafted, the diff is clean of app changes,
and the commit is merged.

## Review checklist

- RD6 cites row 121's ruling with its date.
- Every reading names its absent form.
- The restorations are named per phone.
