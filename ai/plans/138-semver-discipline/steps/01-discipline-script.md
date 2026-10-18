# Step 1 - the discipline gate and the major allowlist

Requirements: R1.1, R1.2, R1.3, R1.4, R1.5, R4.2, R5.1
Weight: 2

## Anchor check

`python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' ai/plans/138-semver-discipline/scripts/anchors/uniqueness-merge-handling.md scripts/check-version-uniqueness.js`
prints `1`. If not, `STOP:` per PLAN.md 2.2.

## Goal

A commit-time gate that refuses a bump of the wrong class and every major without the
owner's recorded order.

## Branch

`git checkout -b step/138-discipline lane/138` (the lane branch carries the plan
folder; the step branches off it).

## Files

- `scripts/check-version-discipline.js` (new)
- `scripts/version-major-allowlist.json` (new)
- `scripts/__tests__/checkVersionDiscipline.test.ts` (new)
- `.husky/commit-msg` (one line added)

## Red tests

Write `scripts/__tests__/checkVersionDiscipline.test.ts` first, mirroring
`scripts/__tests__/checkVersionUniqueness.test.ts`: the same `cleanEnv()`, the same
`makeRepo()` fixture shape (`mkdtempSync`, base ref `refs/remotes/origin/uat`,
`commit(version, message)` writing `app.json` and committing with `-m`), the same
`afterEach` cleanup, spawned with `spawnSync('node', [SCRIPT, '--message-file', msg])`
where `msg` is a temp file holding the subject line. Every case stages its candidate
before spawning: `worktreeVersion(v)` then `git add app.json` - at commit-msg time the
index holds the version being committed, and the script reads the staged blob first.
Cases, each a named `it`:

1. `feat subject takes the minor` - parent 1.0.0, worktree 1.1.0, message file
   `1.1.0 - feat(x): y` - exit 0, stdout `DISCIPLINE OK 1.0.0 -> 1.1.0 (minor, feat)`.
2. `feat subject with a patch delta fails` - parent 1.0.0, worktree 1.0.1, subject
   `1.0.1 - feat(x): y` - exit 1, stdout starts `DISCIPLINE FAIL feat requires a minor`.
3. `non-feat subject takes the patch` - parent 1.0.0, worktree 1.0.1, subject
   `1.0.1 - fix(x): y` - exit 0, `DISCIPLINE OK 1.0.0 -> 1.0.1 (patch, fix)`.
4. `untyped subject takes the patch` - subject `1.0.1 - plain subject` - exit 0,
   `(patch, untyped)`.
5. `non-feat subject with a minor delta fails` - worktree 1.1.0, subject
   `1.1.0 - fix(x): y` - exit 1, `DISCIPLINE FAIL only feat may take a minor`.
6. `equal version fails` - worktree 1.0.0, subject `1.0.0 - fix(x): y` - exit 1,
   `DISCIPLINE FAIL version did not move`.
7. `skipped patch fails` - parent 1.0.0, worktree 1.0.2, subject `1.0.2 - fix(x): y`
   - exit 1, `DISCIPLINE FAIL` naming `1.0.0 -> 1.0.2` (the FAIL line carries the
   delta: every FAIL line ends `(<parent> -> <candidate>)`, asserted here).
8. `minor with nonzero patch fails` - parent 1.0.5, worktree 1.1.2, subject
   `1.1.2 - fix(x): y` - exit 1.
9. `major without allowlist fails` - parent 1.9.3, worktree 2.0.0, subject
   `2.0.0 - feat(x): generational` - exit 1, `DISCIPLINE FAIL major versions are the
   owner's alone` (the word `owner` appears).
10. `major with allowlist entry passes` - same, with `--allowlist <tmp json>` holding
    `[{ "version": "2.0.0", "reason": "test ruling" }]` - exit 0, `(major, feat)`.
11. `merge in flight is skipped` - a second branch exists (created from the base with
    a commit touching a different file); the fixture writes the ref directly,
    `git rev-parse other > .git/MERGE_HEAD`, runs the script with worktree equal to
    parent - exit 0, stdout `DISCIPLINE SKIP merge in flight`; the fixture deletes
    `.git/MERGE_HEAD` in teardown.
12. `the first minor over the 10xx line` - parent 2.0.1053, worktree 2.1.0, subject
    `2.1.0 - feat(x): y` - exit 0 (R4.2's fixture form).
13. `featur is not feat` - subject `1.0.1 - featur(x): y`, worktree 1.0.1 - exit 0
    `(patch, untyped)`.
14. `subject without the version prefix still parses` - subject `feat(x): y`, worktree
    1.1.0 - exit 0 `(minor, feat)`.

Record the exact failing names and first failure lines of the first run (expected:
every case fails with `Cannot find module
'.../scripts/check-version-discipline.js'` from the spawn, or nonzero exit with no
DISCIPLINE line) into `LOG.md` before writing the script.

## Change contracts

`scripts/check-version-discipline.js`, CommonJS, no dependency, shaped like
`check-version-uniqueness.js` (same `git()` helper via `execFileSync`, same cwd
discipline, same header comment block explaining what it refuses and why):

- Usage line: `node scripts/check-version-discipline.js [--message-file <file>] [--allowlist <file>]`.
- Reads: parent version from `git cat-file -p HEAD:app.json` (JSON `.expo.version`),
  candidate from the staged blob `git cat-file -p :app.json`, falling back to the
  worktree file when no staged blob exists.
- Merge skip: `MERGE_HEAD` in `process.env` or `git rev-parse -q --verify MERGE_HEAD`
  succeeding - print `DISCIPLINE SKIP merge in flight`, exit 0 (mirrors the uniqueness
  script's reason: the merge convention repeats the landed version).
- No `--message-file` and no `--merge-check`: exit 1, `DISCIPLINE FAIL no message
  file` (step 2's red depends on this pinned behaviour).
- Subject: first line of the message file; strip a leading
  `/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)? - /` prefix; the subject type is declared
  exactly as `const type = ...` (the break script's sed matches that text) and is
  `feat` iff `/^feat(?=[(:\s])/` matches the stripped subject.
- Delta classes, computed segment-wise against the parent: `patch` (major equal,
  minor equal, patch +1), `minor` (major equal, minor +1, patch 0), `major`
  (major +1, minor 0, patch 0); anything else is `invalid`, with equal versions named
  `version did not move`.
- Verdict: `major` needs an allowlist entry (same two-line loader shape as the
  collision allowlist: `[{ "version": "...", "reason": "..." }]`, missing file reads
  as empty); `minor` needs `feat`; `patch` needs not-`feat`; `invalid` always fails.
- Output: `DISCIPLINE OK <parent> -> <candidate> (<class>, <type>)`,
  `DISCIPLINE SKIP ...`, or `DISCIPLINE FAIL <reason>` - every FAIL line ends
  `(<parent> -> <candidate>)` except the no-message-file and skip lines.
  Exit 1 on FAIL.
- The default allowlist path: `path.join(__dirname, 'version-major-allowlist.json')`.

`scripts/version-major-allowlist.json` lands as `[]` with a one-line README comment
impossible in JSON - so the contract lives in the script's header comment block: an
entry is added only with the owner's recorded order, naming the queue row and date in
`reason`.

`.husky/commit-msg` becomes exactly two commands on one `&&`-chained line (git runs
`core.hooksPath` hooks with plain `sh`, no `-e`: bare lines would let a passing
second command mask a first-line identifiers refusal, the shape `.husky/pre-commit`
already avoids):

```
node scripts/check-identifiers.js --message "$1" && node scripts/check-version-discipline.js --message-file "$1"
```

## Green run

`npx jest scripts/__tests__/checkVersionDiscipline.test.ts --watchman=false` - all 14
green. Then `yarn validate` (R5.1). Then a live smoke on the step branch itself: its
own commit is the proof - the hook runs the gate for real.

## Break script

`scripts/break-138-discipline.sh` in the plan folder, run from the worktree root:
blanks the subject type (sed replaces `const type = ` with `const type = ''; const
brokenType = ` in `scripts/check-version-discipline.js`, the pinned declaration),
runs the suite, expects `feat subject with a patch delta fails` RED
(exit nonzero), prints `BREAK DISCIPLINE RED`, then `git checkout --
scripts/check-version-discipline.js` and re-runs the suite green, printing
`BREAK DISCIPLINE GREEN` and last `ALL AS EXPECTED: 1` (the ending the executor's
break loop requires).

## Version and commit

Version: the parent's version plus exactly one patch (D138.3) - at planning close
the lane's last plan commit sits at 2.0.1057, so expect 2.0.1058, plus one for any
plan commit that lands after this text; record the parent sha and the number taken in
`LOG.md`. If the uniqueness gate reports parent+1 held by another unpushed commit,
`STOP: lane weather, rebase onto the holder and renumber per PLAN.md section 5` -
under the discipline no higher patch is legal. Subject: `<VERSION> -
build(scripts): 138 step 1 the version discipline gate
(feat-requires-minor, majors allowlisted)`. Note the type is `build`, not `feat`: this
is tooling, user-invisible - the discipline applies to itself (R4.1).

## Review

Read the diff cold: the script's verdict table matches PLAN.md section 5; no
`console.log` (the script prints to stdout by contract, as the uniqueness script
does); no dependency; the fixture harness copied, not imported, from the uniqueness
suite (the same two copies agree with each other - importing would couple the suites).

## Merge

`git checkout lane/138 && git merge --no-ff step/138-discipline -m "<VERSION> - merge
step/138-discipline: 138 step 1 the discipline gate"`, after
`git fetch -q origin uat` and `node scripts/check-version-uniqueness.js`.

## Done when

Checklist box ticked in `LOG.md`, the 14 cases green, `yarn validate` green, the break
script printed `BREAK OK`, the merge landed on `lane/138`.
