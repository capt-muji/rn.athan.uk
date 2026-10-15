# Step 2: the owner's read on the XS dev build

Requirements: R4.1
Weight: 1

Anchor check: none (no code changes).

## Goal

The owner reads the mirrored pager on her XS and rules it lands or names a defect.

## Branch

`git checkout -b build/pager-mirror-xs uat` (fetch `origin` first). This branch exists only if a
build artifact must be committed; the repo's builds stay outside git, so the expected outcome is
no commit at all on this branch.

## Files

None. The build recipe lives in `e2e/device-atlas-iphone-xs.md` (Release device-build section).

## Red tests

None. The owner's read is the acceptance (D103.2).

## Change contracts

None. Build and install the dev build on the XS from `uat`'s merged state, per the atlas recipe.
No code changes.

## Green run

1. Build the Release dev build and install it on the XS (devicectl, per the atlas).
2. Tell the lead the build is on the phone. The lead batches the ask with the owner's other
   moments (her logistics ruling, D104.5's pattern): under Arabic, swipe the pager both ways and
   read the placement.
3. Record her words in `LOG.md` under this step's heading: the mirror reads native, or the defect
   she names (a defect she finds opens its own row; this ticket does not chase it).

## Break script

None (no code).

## Version and commit

None, unless the build uncovers a defect that this ticket must fix: then the fix is a new step
added by a NEEDS REPLAN pass, not an edit here.

## Review checklist

- The build installed is built from `uat`'s merged step-1 state.
- Her read is recorded verbatim in `LOG.md`.

## Merge

Nothing to merge when no commit exists. Delete the branch if it stayed empty.

## Done when

Her read is recorded in `LOG.md` and the step entry ends with its `session:` line. The ticket
moves to EXECUTED and the lead's audit takes it.
