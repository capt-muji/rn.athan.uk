# Step 5: the records close

Requirements: R5.1, R6.1
Weight: 1

Anchor check: `scripts/anchors/a6-upstream-ledger.md` counts 1 in `ai/UPSTREAM-PRS.md`.
The two queue rows are located by their order numbers (`| 117 |`, `| 69 |`), each
matching exactly one line; a second match or zero matches is a STOP. Queue rows are
single-line cells, so no multi-line anchor can pin them.

Goal: land the queue records with the measured values, set the ticket EXECUTED, and hand
the range to the audit.

Branch: `docs/117-records-<date>` off `lane/117` (which carries the plan folder and
`LOG.md`), authored in the lane worktree `$HOME/athan-gitree/worktrees/lane-117`, merged
into `uat` by the lane in the main tree under `uat.lock`.

Dispatch: one `athan-executor`, given the lane worktree, the lock family, and the rule
that merges into `uat` happen only in the main tree (the executor commits on the lane
branch; the lane merges). If the dispatch cannot run, the lane runs this step itself and
records that in `LOG.md`.

Files: `ai/plans/README.md` (rows 117 and 69), `ai/UPSTREAM-PRS.md` (the expo-widgets
row's Upstream cell), this plan folder's `LOG.md`.

Red tests: None (a records step; no code changes).

Change contract:

1. Fill every `<slot>` of the section 8 row 117 cell with the measured values from
   steps 1 to 4, land the cell with the prefix `EXECUTED, audit owed` in place of
   OWNER-LED and the audit clause's `<N>` left for the audit-close commit to fill,
   replacing the PLANNING-era text. Set the Needs-first cell to `nothing`.
2. Set row 69's status cell to section 8's SUPERSEDED text verbatim.
3. Append the held-state sentence to `ai/UPSTREAM-PRS.md`'s expo-widgets row exactly as
   section 8 gives it, with the base sha from step 4.
4. Tick the checklist boxes in `LOG.md` and append the `### Step 5 — records closed` entry
   with the commit sha and a `session:` line.
5. Version: the next patch after the records branch parent's version (the lane tip's
   `package.json`, so the first records commit after a 2.0.1070 planning commit takes
   2.0.1071) under `$HOME/athan-gitree/version.lock` (mkdir pattern, `sleep 15` retries,
   `rmdir` after), set in `app.json` first, then `package.json`, then the gitignored
   `android/app/build.gradle` `versionName` (never added, but matching). Docs subject,
   patch class per row 138's discipline.
6. Commit in the lane worktree under `$HOME/athan-gitree/commit.lock` with the message
   `docs(plans): ticket 117 executed: the closeout reads recorded, the PR prepared and held`
   prefixed with the version. A docs commit's hook output carries no `Tests:` line
   (lint-staged finds no related tests for `.md` files); confirm the hook ran by the
   lint-staged and `yarn validate` output in the commit log, and if the hooks are absent,
   run `yarn validate` by hand before continuing.
7. Merge into `uat` from the main tree under `$HOME/athan-gitree/uat.lock`:
   `git fetch -q origin uat`, `node scripts/check-version-uniqueness.js` (must print its
   `VERSIONS OK` line), `git merge --no-ff` with the records-merge message from section 8,
   then sync the main tree's gitignored `android/app/build.gradle` `versionName` to the
   new version under `$HOME/athan-gitree/build.lock`. A conflict on the queue file or the
   version files is lane weather: the plan's symptom table governs.

Green run: `git log --oneline origin/uat..uat` shows this lane's docs commits;
`grep -n "OWNER-LED" ai/plans/README.md` finds row 117's audit-set text after the audit
merge; the three version files agree.

Break script: `bash` from the repository root:
read back the three edited texts and fail unless each is present verbatim once:

```bash
bash -c 'grep -c "PREPARED AND HELD" ai/plans/README.md ai/UPSTREAM-PRS.md && \
  grep -c "SUPERSEDED 2026-10-18 by rows 135 and 117" ai/plans/README.md'
```

Expected: row 117 and the ledger each report 1, and the SUPERSEDED count is 1. Any other
count is `BREAK NOT APPLIED`.

Version and commit: as the change contract's items 5 and 6 give.

Review: the executor reads `git show <sha>` cold: the queue rows read as section 8
specifies with measured values, the ledger sentence sits inside the expo-widgets row
without breaking the table (one line per row), and nothing else moved.

Merge: item 7.

Done when: the checklist box 5 is ticked, the ticket reads EXECUTED, and `LOG.md`'s step 5
entry ends with a `session:` line.

Audit handoff (the lane's, satisfying R6.1): write the range to
`$TMPDIR/audit-117.diff` from the main tree, dispatch the two `athan-reviewer` passes
(plan-conformance with this plan folder, blind without it), adjudicate every finding in
`AUDIT.md` with `Range:` and `Findings:` lines per pass, run
`bash scripts/check-audit.sh ai/plans/117-widget-language-closeout` to `AUDIT OK`, then
close per the lead skill: the audit-close commit fills the `<N>` slot, drops the
`EXECUTED, audit owed` prefix and sets the cell's OWNER-LED opening (repairs anything a
finding forces), `git rm -r` the plan folder, delete `$HOME/athan-gitree/sessions/117/`,
branch `docs/audit-117-<date>`, version bumped, merge `--no-ff`. The upstream artefact
under `$HOME/athan-gitree/upstream/` survives (D117.5).
