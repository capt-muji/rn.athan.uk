# Step 1: Land the 16a checkpoint on uat-2 (merge)

0. **Anchor check:** none. The pre-flight (section 3) already verified `wip/16a-ios-widget-archive-budget` sits at `0506f608` and `uat-2` is clean and current.
1. **Goal:** Put the six committed, validate-green checkpoint commits on `uat-2` so every later step branches off the integration branch as normal.
2. **Branch:** none. This step is a single merge of an existing branch.
3. **Files:** none change in the working tree. The merge brings in the 29-file range `git diff --stat uat-2..wip/16a-ios-widget-archive-budget` lists (LOG.md, the widget modules, tests, the patch, `app.json`, `package.json`, `yarn.lock`, regenerated dark card PNGs, `ai/AGENTS.md`).
4. **Tests first (red):** None. No code is written. Sanity instead: run `yarn validate` on the merged tree before committing anything further (expected: green, `4610 passed, 4611 total` with the one Android-network skip, four `100%` coverage lines; these are the checkpoint's numbers from LOG §26).
5. **Change.** Exactly:
   ```
   git checkout uat-2
   git merge --no-ff wip/16a-ios-widget-archive-budget -m "Merge wip/16a-ios-widget-archive-budget into uat-2: session 16a checkpoint (archive-budget fix, timerInterval countdowns, 4 lock kinds, nebula study) landed, per plan"
   ```
   If `git merge` reports a conflict: `git merge --abort`, STOP and ask (section 10).
6. **Green:** `yarn validate` exits 0 with the numbers above. Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exit 0.
7. **Breaks:** None. No new code to break.
8. **Version and commit:** no new commit. The merge commit carries no bump (every merged commit already bumped; `uat-2`'s `package.json` now reads `1.27.312`). The version lockstep test inside `yarn validate` proves the three files agree.
9. **Review:** the executor's own diff review, recorded in `LOG.md`: confirm the merge's `--stat` matches section 4's table, no `releases.json` change, no `.env` change, no secret.
10. **Merge:** done in item 5.
11. **Done when:**
    - `git log --oneline -1` shows the merge commit;
    - `git status --porcelain` lists only `ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`;
    - `yarn validate` green at 1.27.312.
    Tick the checklist; append to `LOG.md`: the merge sha and the validate totals.
