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
