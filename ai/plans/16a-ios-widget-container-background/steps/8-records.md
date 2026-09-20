# Step 8: Records and EXECUTED (docs)

0. **Anchor check:** none.
1. **Goal:** The findings text lands, the row reads EXECUTED, the docs commit exists, and the owner gets the report.
2. **Branch:** `git checkout -b docs/executed-16a-$(date +%Y%m%d-%H%M) uat-2`.
3. **Files:** `ai/features/uat-2/AUDIT-FINDINGS.md`, `ai/plans/README.md`, this folder's `PLAN.md` and `LOG.md`, `app.json` and `package.json` (the version), `android/app/build.gradle` (set, never added).
4. **Tests first (red):** None.
5. **Change.**
   - Apply PLAN section 8's findings text to `ai/features/uat-2/AUDIT-FINDINGS.md` with every placeholder filled from `LOG.md`'s recorded values: `<NEBULA_VERDICT>`, `<NEBULA_LOG_PART>`, `<ROLLOVER_RESULT>`, `<PLACEMENT_RESULT>`, `<PATCH_WITH>`, `<PATCH_WITHOUT>`, `<PATCH_CRASH_NOTE>`, `<ANDROID_RESULT>`, `<CRASH_DELTA>`, `<FINAL_VERSION>`.
   - Set row 11 in `ai/plans/README.md` to `EXECUTED` (Status cell), keeping the plan path cell as `ai/plans/16a-ios-widget-container-background/PLAN.md`.
   - `LOG.md` closes with: every step's evidence, the phones' end states, and any owner reading still open.
6. **Green:** `yarn validate` inside the hook; `git status --porcelain` shows only the step's files.
7. **Breaks:** None.
8. **Version and commit.** The version command from step 2; set all three files. Add by name: the five files above (never the gradle file). Commit message:
   ```
   <VERSION> - docs(16a): session executed — records and row to EXECUTED
   ```
9. **Review:** the executor's own diff review, recorded: placeholders all replaced (grep for `<` inside the new findings block finds none), row cells correct, no other file touched.
10. **Merge:** `git checkout uat-2 && git merge --no-ff docs/executed-16a-$(date +%Y%m%d-%H%M) -m "Merge docs/executed-16a into uat-2: session 16a executed, reviewed"`. (Use the branch name `git branch --show-current` printed.)
11. **Done when:** the row reads EXECUTED; the merge is on `uat-2`; the report per PLAN section 12 is written with the progress table and the four-line handoff; no push.

Worktrees: remove `~/athan-device-sweep/worktrees/plan-16a` if the audit has not already (the planner's spike worktree; `git worktree remove --force`), and any throwaway build APKs stay outside the repo as they are.
