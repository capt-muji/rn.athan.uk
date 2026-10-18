# Step 3 - the lockstep shape assertion

Requirements: R3.1, R5.1
Weight: 1

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/138-semver-discipline/scripts/anchors/lockstep-shape.md shared/__tests__/versionLockstep.test.ts`
prints `1`. If not, `STOP:` per PLAN.md 2.2.

## Goal

The lockstep suite pins the semver normal form: three dot-separated integers, no
leading zeros, no pre-release or build suffix - the form the discipline, the store
comparator and any future `appVersion` runtime policy assume.

## Branch

`git checkout -b step/138-lockstep-shape lane/138` (after step 2 merged).

## Files

- `shared/__tests__/versionLockstep.test.ts` (one assertion changed, one added)

## Red tests

Change the existing loose assertion
`expect(appJsonVersion()).toMatch(/^\d+\.\d+\.\d+/)` to the exact normal form
`expect(appJsonVersion()).toMatch(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/)` inside
the existing `declares a usable version` case, and add one case to the same describe:

`it('rejects a suffixed or zero-padded version shape', ...)` - the case asserts the
regex itself against three strings (`2.0.1053-rc1` matches nothing, `02.0.1` matches
nothing, `2.0.1053` matches), so the shape contract is pinned without touching the
repo's real `app.json`.

Red proof, recorded in `LOG.md`: temporarily set the worktree `app.json` version to
`2.0.1054-rc1` (and `package.json` to match, keeping the lockstep equality case
green), run
`npx jest shared/__tests__/versionLockstep.test.ts --watchman=false`, record the
failing assertion line from the tightened case, then `git checkout -- app.json
package.json` and re-run green. The repo's real version never commits the suffix.

## Change contracts

Only the two changes above. The equality cases and the gradle case stay untouched.

## Green run

`npx jest shared/__tests__/versionLockstep.test.ts --watchman=false` green, then
`yarn validate`.

## Break script

`scripts/break-138-lockstep.sh`: loosens the tightened regex back to the loose
`/\d+\.\d+\.\d+/` with perl (a `cmp` guard fails loudly when the perl changed
nothing), sets the suffixed temporary version in both files (the same temporary edit
as the red proof), runs the suite - RED here means the loosened live assertion no
longer catches the suffix, so the suite exits 0 and the script reports
`BREAK LOCKSTEP RED` on that inverted outcome; restores the suite file and BOTH
version files first, re-runs the full suite green, prints `BREAK LOCKSTEP GREEN`,
then `ALL AS EXPECTED: 1` (the ending the executor's break loop requires). The break
proves the live assertion is the load-bearing half.

## Version and commit

The parent's version plus exactly one patch (D138.3) - after step 2's commit; record
the number in `LOG.md`. If the uniqueness gate reports parent+1 held, `STOP: lane
weather` per PLAN.md section 5. Subject: `<VERSION> - test(version): 138 step 3
the semver normal form pinned in the lockstep suite`.

## Review

Read the diff cold: no other assertion moved; the temporary suffix edit is absent
from the commit.

## Merge

Same as step 1, branch `step/138-lockstep-shape`.

## Done when

Checklist box ticked, suite green, `yarn validate` green, `BREAK OK` printed, merged
to `lane/138`.
