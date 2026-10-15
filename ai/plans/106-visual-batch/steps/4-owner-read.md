# Step 4: the owner's read

Requirements: R4.1
Weight: 1

Anchor check: none (no code changes).

## Goal

The owner reads all three items on her XS under ar and en and rules them landed, or names the
dials.

## Branch

`git checkout -b build/visual-batch-xs uat` (fetch `origin` first). Expected outcome: no commit
unless a dial lands.

## Files

None. The build recipe lives in `e2e/device-atlas-iphone-xs.md`.

## Red tests

None. Her read is the acceptance (D106.4).

## Change contracts

None. Build and install the Release dev build from `uat`'s merged step-3 state per the atlas
recipe.

## Green run

1. Build and install on the XS.
2. Tell the lead the build is on the phone. The lead batches the ask with the other lanes'
   owner moments: under Arabic read the location-date gap, the Extras overlay's info boxes and
   the countdown letters; under English read the countdown letters and confirm nothing else
   moved.
3. Record her words in `LOG.md`. A dial (the arrow's three numbers, the gap if the Rubik read
   needs a re-pick from the kept specimen) lands as one follow-up commit per surface with its
   pins re-taken; a re-pick reopens step 1 with the new family, same contract.

## Break script

None (no code).

## Version and commit

None, unless a dial lands: then the dial is its own commit with the pin re-taken and the
version bumped per the same rule.

## Review checklist

- Her read recorded verbatim beside this step's heading, per item.

## Merge

Nothing to merge when no commit exists. Delete the branch if it stayed empty.

## Done when

Her read is recorded in `LOG.md` and the step entry ends with its `session:` line. The ticket
moves to EXECUTED and the lead's audit takes it.
