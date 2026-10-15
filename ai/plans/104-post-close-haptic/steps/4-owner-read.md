# Step 4: the owner's read after the fix

Requirements: R3.1
Weight: 1

Anchor check: none (no code changes).

## Goal

The owner reads the fixed timing on her XS: the buzz lands with the close on both paths, and no
second buzz follows.

## Branch

`git checkout -b build/haptic-xs-read uat` (fetch `origin` first). Expected outcome: no commit.

## Files

None.

## Red tests

None. Her read is the acceptance.

## Change contracts

None. Build and install the Release dev build from `uat`'s merged step-3 state per the atlas
recipe (the perf flag stays set: it changes nothing she feels and keeps the marks readable if
she reads the buzz late again).

## Green run

1. Build and install on the XS.
2. Tell the lead the build is on the phone. The lead batches the ask (D104.5, pass two, with
   row 103's read): close the sound sheet unchanged once, then with a different pick once.
3. Record her words in `LOG.md`: the buzz lands with the close, or the defect she still feels
   (a residual late buzz reopens the verdict work under a NEEDS REPLAN, it is not patched
   in place).

## Break script

None (no code).

## Version and commit

None.

## Review checklist

- Her read is recorded verbatim beside this step's heading.

## Merge

Nothing to merge. Delete the branch if it stayed empty.

## Done when

Her read is recorded in `LOG.md` and the step entry ends with its `session:` line. The ticket
moves to EXECUTED and the lead's audit takes it.
