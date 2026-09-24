# Execution log: Session 17

## Pre-flight

`bash $TMPDIR/preflight-17.sh 1` ended `PREFLIGHT OK`. Version 1.27.352, both anchors counted 1.

## Step 1: The horizon is 30 days

Branch `feat/17-timeline-horizon-30`. Anchor `1-1` counted 1.

Before the change, the three widget suites reported `Tests:       163 passed, 163 total`.

Change: `TIMELINE_DAYS` 14 to 30 in `stores/widget.ts`, with the plan's verbatim doc comment. Nothing else in the
file.

Green: the same three suites still report `Tests:       163 passed, 163 total`, and `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` both exit 0.

Break: `bash $TMPDIR/breaks-17-1.sh` printed `NOT CAUGHT: the horizon falls back to a fortnight`, then
`caught 0 of 1`. **This is what the plan predicts for this step** (step 1, part 7): nothing in the suite reads the
constant until step 2 moves the volume guard's span onto it, so there is nothing yet to catch a revert. Step 2 runs
the same script and requires `ALL AS EXPECTED: 1`. No test was invented here to make it green early, because the
guard belongs with the volume block it protects.

Commit `86bf6597`, version 1.27.353, merged as `3c3f82cc`. The hook reported
`Tests:       4644 passed, 4644 total` with four 100% coverage lines.

Review: the session reviewed the diff itself against the step's four checks, one round, verdict merge.
`TIMELINE_DAYS` is 30, the doc comment matches the plan's verbatim block, no builder, layout or test file is in the
diff, and the three widget suites still report 163.

## Step 2: The volume guard measures the horizon it ships

Branch `test/17-volume-guard-30`. Anchor `1-2` counted 1.

**The plan was wrong here, the execution corrected it, and the plan now records what shipped.** As written, step 2
moved the fixture spans from 16 to a literal 31. That passed, and the break script still printed
`NOT CAUGHT: the horizon falls back to a fortnight`, because nothing could read `TIMELINE_DAYS`: it was a private
constant in `stores/widget.ts`, which imports react-native and `@/modules/widgetrefresh`, so a pure unit test cannot
import it. A guard that hard-codes the span it guards is not a guard, so the step became:

1. `TIMELINE_DAYS` moved to `shared/widgetTimeline.ts`, exported, beside `MIN_ENTRY_SPACING_MS`, which is the same
   kind of shared widget constant. `stores/widget.ts` imports it and is otherwise unchanged. The doc comment moved
   with it and gained one line saying why it lives there.
2. Both fixture spans became `TIMELINE_DAYS + 1`. The DST block's span was a second hard-coded 16 whose own comment
   already claimed to be "the span stores/widget.ts pushes".
3. A test was added, `carries a 30-day horizon`, asserting the constant is 30.

Point 3 came from a second measurement. With only the upper bounds in place, the break to 14 days STILL passed:
every bound in the block is an upper bound and the fixtures now scale with the constant, so a shrink satisfies all of
them. The horizon is a product decision, so one test asserts the number and the rest guard the budgets. A second
break, a jump to 365, was added to the script for the opposite direction.

One stale comment was corrected while there: the payload test cited "155KB across ~380 entries" from the entry shape
session 16a deleted. It now cites the measured ~78KB across ~185.

Green: `Tests:       52 passed, 52 total` for the suite, `Tests:       164 passed, 164 total` for the three widget
suites together, one more than step 1's 163. `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both
exited 0.

Breaks: `bash $TMPDIR/breaks-17-1.sh` printed `caught: the horizon falls back to a fortnight`,
`caught: the horizon overruns the entry budget`, `caught 2 of 2`, then `ALL AS EXPECTED: 1`. No `.bak` file left.
