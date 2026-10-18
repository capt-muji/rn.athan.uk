# Step 2 - the merge monotonicity gate

Requirements: R2.1, R2.2, R5.1
Weight: 2

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/138-semver-discipline/scripts/anchors/lane-merge-bullet.md .opencode/agents/athan-lane.md`
prints `1`. If not, `STOP:` per PLAN.md 2.2.

## Goal

A pre-merge gate on `uat` that refuses a merge whose merge-result version does not
strictly exceed `uat` HEAD's, closing the one path a lower line could take `uat`
backward (a patch lane merging after a sibling's minor).

## Branch

`git checkout -b step/138-merge-gate lane/138` (after step 1 merged).

## Files

- `scripts/check-version-discipline.js` (gains the `--merge-check` arm)
- `scripts/__tests__/checkVersionDiscipline.test.ts` (gains a describe block)
- `.husky/pre-merge-commit` (one line added)

## Red tests

Append a `describe('check-version-discipline merge check')` to the step 1 suite, same
fixture harness:

1. `increasing incoming version passes` - base (HEAD) 2.0.1050, staged (worktree +
   `git add app.json`) 2.1.0 - run with `--merge-check` - exit 0, stdout
   `MERGE VERSION OK 2.0.1050 -> 2.1.0`.
2. `equal incoming version fails` - staged 2.0.1050 - exit 1, stdout starts
   `MERGE VERSION FAIL`.
3. `lower incoming version fails` - staged 2.0.1053 against HEAD 2.1.0 - exit 1,
   stdout `MERGE VERSION FAIL 2.1.0 -> 2.0.1053` (the lane-weather case, R2.1's exact
   shape).
4. `missing staged app.json fails` - `git rm --cached app.json` in the fixture - exit
   1, stdout starts `MERGE VERSION FAIL no staged app.json`.

Record the first failing lines of all four (step 1's script has no `--merge-check`
arm yet: the flag is ignored, the class path runs with no message file, and every
case fails on a crash or a wrong verdict - record the actual first line of each)
into `LOG.md` before changing the script.

## Change contracts

`--merge-check` arm in `scripts/check-version-discipline.js`:

- Reads HEAD version from `git cat-file -p HEAD:app.json` and the merge-result
  version from the staged blob `git cat-file -p :app.json` (at pre-merge-commit time
  the index already holds the merged tree, exactly as the uniqueness script's
  `--no-candidate` comment records).
- The arm declares its two sides as `head` and `incoming` and compares them with a
  three-segment numeric total, variables named `headTotal` and `incomingTotal`,
  strictly greater with `>` (the break script's perl matches these exact names -
  the pinned shape).
- Output: `MERGE VERSION OK <head> -> <incoming>` or
  `MERGE VERSION FAIL <head> -> <incoming> (rebase and renumber onto the higher
  line)`. Exit 1 on FAIL.
- A missing or unreadable staged `app.json` fails with `MERGE VERSION FAIL no
  staged app.json`.

`.husky/pre-merge-commit` becomes one `&&`-chained line (same plain-`sh` masking
trap):

```
node scripts/check-version-uniqueness.js --no-candidate && node scripts/check-version-discipline.js --merge-check
```

## Green run

The four cases green, then `yarn validate`, then the live proof: this step's own
merge into `lane/138` fires the hook in the worktree (step merges run the hooks; the
lane branch merge is a real `--no-ff` merge).

## Break script

`scripts/break-138-merge-gate.sh` in the plan folder: comments out the strictness in
the compare (perl replaces the two pinned `>` comparisons with `>=`, guarded by a
`cmp` that fails loudly when the perl changed nothing), runs the suite, expects
`equal incoming version fails` RED, prints `BREAK MERGE RED`, restores with
`git checkout -- scripts/check-version-discipline.js`, re-runs green, prints
`BREAK MERGE GREEN` and last `ALL AS EXPECTED: 1` (the ending the executor's break
loop requires).

## Version and commit

The parent's version plus exactly one patch (D138.3) - after step 1's commit, plus
one more for any plan commit that lands late; record the number in `LOG.md`. If the
uniqueness gate reports parent+1 held, `STOP: lane weather` per PLAN.md section 5.
Subject: `<VERSION> - build(scripts): 138 step 2
the pre-merge version monotonicity gate`.

## Review

Read the diff cold: the merge arm reads the index, never the worktree file (the
pre-merge index is the merge result; the worktree may still hold pre-merge bytes);
the failure line names both versions and the action.

## Merge

Same as step 1, branch `step/138-merge-gate`.

## Done when

Checklist box ticked, the four cases green, `yarn validate` green, `BREAK OK`
printed, merged to `lane/138`.
