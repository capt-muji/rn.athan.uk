# Blind review 138 (1a7ebffe..d169d2a2) - version discipline gate

Verified against the worktree at d169d2a2 and real-git fixtures under
$TMPDIR/opencode/fixture-138 (clean and conflicted merges with live hooks,
linked-worktree commits with exported GIT_DIR/GIT_INDEX_FILE, pathspec commits,
amends, malformed versions). Suite: 22/22 pass; biome and tsc --noEmit clean.

Checked and clean: subject parsing (pre-release suffix in the version prefix
strips; `featur` is untyped; no bang-typed subject exists in history), the
staged-blob read at commit-msg (including `git commit <paths>`, which stages
pathspec content into the index before hooks), the merge arm reading the
receiving HEAD and the result index at pre-merge time (verified on a real
clean --no-ff merge; MERGE_HEAD is visible to commit-msg on the auto-created
merge commit, so the SKIP fires), exit codes 0/1, output shapes, JSON files,
fixture-harness isolation, hook environment inheritance in worktrees, and the
range's own 13 commits, which each take exactly one patch step.

## FINDINGS

1. [should] scripts/check-version-discipline.js:102 - the MERGE_HEAD skip is
   unconditional, so a conflicted merge resolved to the lower version lands
   with no gate at all: pre-merge-commit never fires on a conflicted merge
   (verified: only COMMIT_MSG fired, with MERGE_HEAD present) and the
   concluding commit is skipped, so "a merge whose incoming version does not
   exceed uat HEAD's is refused" is unenforced on the one path where a
   resolver error can violate it - fix: when a merge is in flight at
   commit-msg time, skip only the class-step rule and still require staged
   :app.json to strictly exceed HEAD:app.json (the --merge-check comparison);
   update 'merge in flight is skipped' (scripts/__tests__/checkVersionDiscipline.test.ts:186)
   to stage a higher version and add a lower-resolution case.

2. [should] scripts/check-version-discipline.js:121-127 - the worktree
   fallback can only read bytes that are not in the commit: it fires only when
   the index lacks app.json, i.e. when the commit is untracking or deleting
   it, and then blesses that commit with the untracked file's version
   (verified: `git rm --cached app.json` plus a worktree bump passed the gate
   and landed with app.json untracked, and the next commit then fails
   'cannot read a version (parent null, ...)') - fix: delete the fallback; the
   existing 'cannot read a version' failure at line 128 already covers a
   missing staged app.json.

3. [nice] scripts/check-version-discipline.js:60-63 - parseSegments silently
   drops a fourth segment, so "1.0.1.7" passes as a patch step from 1.0.0
   (verified: `DISCIPLINE OK 1.0.0 -> 1.0.1.7 (patch, fix)`), and the
   --merge-check totals ignore the tail the same way - fix: reject any version
   that does not match the lockstep normal form in parseSegments and fall into
   the existing fail paths.

4. [nice] shared/__tests__/versionLockstep.test.ts:58-65 - the new test
   re-declares the regex as a local literal and asserts it against its own
   strings, so weakening the live regex on line 55 leaves it green; it guards
   nothing in the repository - fix: hoist one NORMAL_FORM constant to module
   scope and use it in both the live assertion and the shape test.

5. [nice] scripts/check-version-discipline.js:113-114 - displayType knows only
   fix/docs/build/merge, but the repository's living types include test (166
   subjects), chore (64) and refactor (35), so their DISCIPLINE OK audit lines
   are labelled "untyped"; the verdict itself never reads the label - fix: add
   the missing tokens or drop the type label from the OK line.

## VERDICT

PASS - no must-level defect; the gate's core wiring holds on real merges,
worktree commits and its own range. Count: 2 should, 3 nice.
