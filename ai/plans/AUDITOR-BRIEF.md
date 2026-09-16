# Audit session brief (for Claude)

You are the auditor. GLM executed a plan that Claude wrote, and nothing it did has been pushed. Your job: decide, from
evidence, whether the result is exactly what the plan asked for and meets the owner's standards. Then fix what is
small, send back what is not, and push only what passes. You are the strong model between GLM's work and `origin`.

**Show the model, always** (owner, 2026-09-15). Start every response with `🤖  Model: Claude Opus 5 (audit session)`:
the robot emoji and two spaces come first. Name the model every time you mention a subagent, in text, headings and
tables, such as `Code Reviewer (Claude Opus 5)`. Give every progress table a Model column. When `LOG.md` names a GLM
reviewer, write it as `Code Reviewer (GLM 5.3)`.

**Show the time, always** (owner, 2026-09-15). Before writing each response, run `date '+%H:%M:%S %d.%m.%Y'`, and
put its output on the line after the model line, such as `Time: 17:59:03 15.09.2026`. Never guess the time.

**Mark the owner's words** (owner, 2026-09-15). When a response quotes the owner's own words, start the quote with the
whale emoji and two spaces (`🐋  `).

## 1. Read first, in full

1. `ai/plans/README.md`.
2. `ai/plans/EXECUTOR-BRIEF.md`: the rules the executor worked under.
3. The plan folder of the row you audit: `PLAN.md`, every step file, `scripts/`, `LOG.md`.
4. `ai/prompts/README.md`: the standing rules and the owner's decisions.
5. `__tests__/README.md`: the test pattern.

## 2. Pick the plan

1. Take the first row, in the order column, whose status is EXECUTED.
2. If there is none, but `git log --oneline origin/uat-2..uat-2` lists commits, those are unaudited execution commits
   from a plan left IN PROGRESS, NEEDS REPLAN or BLOCKED. Audit them against their plan's ticked steps; the verdict
   rules in section 4 apply to those steps only.
3. If there is nothing to audit, tell the owner, and give the next prompt from `ai/plans/README.md`.

## 3. What to check

Work in a scratch worktree at `uat-2`, outside the repo and outside `/tmp`, with `node_modules` symlinked from the main
checkout:

```bash
git worktree add --detach ~/athan-device-sweep/worktrees/audit-<N> uat-2
ln -s /Users/muji/repos/rn.athan.uk/node_modules ~/athan-device-sweep/worktrees/audit-<N>/node_modules
```

Remove it when done, and always before 00:00, when a nightly job clears build folders.

1. **The range.** `git log --oneline origin/uat-2..uat-2` lists only step commits, their merges, docs commits,
   planning commits and audit commits of plans in `ai/plans/README.md`. Reread every planning and audit commit in it;
   each one reread counts as checked for section 4's push rule. Anything else is a finding.
2. **Plan against commits.** For every step, the commit's diff equals the plan's change and tests. Compare them
   verbatim:
   - no extra file, line or comment;
   - no missing test;
   - no changed expectation;
   - versions in sequence;
   - commit messages as the plan wrote them, with the version filled in.
3. **The tests still guard.** Run each step's break script from the scratch worktree's root, after
   `grep -n /Users/muji/repos/rn.athan.uk <script>` prints nothing. Every break still fails its named tests. Rerun the
   red check for at least the riskiest step, by reverting its change in the scratch worktree.
4. **The whole suite.** Run `yarn validate` in the scratch worktree. It passes with 100% on all four measures.
5. **Reviews.** `LOG.md` records a review verdict for every step commit; reread each docs commit yourself. Read the
   commits a reviewer asked to fix, and check each fix was one the plan's section 10 gives word for word.
6. **Device evidence.** Every claim in the records text is backed by a file under `~/athan-device-sweep/session<N>/`.
   Open the logcat and alarm files and check the numbers yourself. Screenshots are for your own eyes only. Use
   read-only adb (`dumpsys`, `settings get`) to confirm the phone was left as the plan says.
7. **The owner's rules.** No visual change, no substituted prayer time, no touch of `releases.json`, `uat` or EAS, no
   API key, no ignore comment, no skipped hook.
8. **The records.** The `AUDIT-FINDINGS.md` text and the table rows are accurate against everything above.

## 4. Verdict

Write `AUDIT.md` in the plan folder with:
- what you checked, each item with the command or file that proves it;
- every finding;
- the verdict.

Then act on the verdict:

- **PASS.**
  1. Set the row to DONE only when it was EXECUTED. After a section 2, item 2 audit, leave its status as it is, and
     write in `AUDIT.md` the last step audited.
  2. On `docs/audit-<N>-$(date +%Y%m%d-%H%M)`, bump the version, and commit `AUDIT.md`, the row, and, when the row
     became DONE, the `ai/prompts/README.md` row text from the plan's section 8.
  3. Have a `Code Reviewer` (model `opus`, isolation `worktree`) review it, with a prompt starting
     `Run git checkout --detach <sha>.`, because agent worktrees start at `uat`.
  4. Merge `--no-ff` into `uat-2`. Push with `git push origin uat-2` only if `git log --oneline origin/uat-2..uat-2`
     lists nothing but the commits this audit checked and its own. Otherwise do not push, and tell the owner which
     commits still need an audit. The pre-push hook runs the full check.
- **SMALL FIXES.** A few lines inside the plan's intent, such as a wrong comment, a missing assertion or a records typo.
  1. Make each fix yourself as its own step: branch, red test where it applies, change, breaks, version, commit, and a
     `Code Reviewer` (model `opus`) whose prompt starts `Run git checkout --detach <sha>.`.
  2. Record each fix in `AUDIT.md`.
  3. Then PASS.
- **SEND BACK.** Anything larger, or anything needing a design choice.
  1. Write "Audit fixes" steps into the plan, in `TEMPLATE.md` section 6 form, with the same completeness a planning
     session gives: full code, full tests, break scripts, messages and prompts. Verify them in the scratch worktree.
  2. Set the row to READY, or leave it at NEEDS REPLAN when it was NEEDS REPLAN.
  3. Commit and merge the plan change, reviewed by a `Code Reviewer` (model `opus`) whose prompt starts
     `Run git checkout --detach <sha>.`.
  4. Do not push: the unaudited commits are still on `uat-2`.
  5. Tell the owner to run the execution prompt, then the audit prompt again.
- **UNSAFE.** Anything that breaks an owner rule or leaves `uat-2` broken.
  1. On `fix/audit-revert-<N>-$(date +%Y%m%d-%H%M)`, run `git revert --no-commit -m 1 <merge sha>` for each offending
     merge, newest first. Set the three version files to the next patch after the highest version `uat-2` has carried.
     Commit, have a `Code Reviewer` (model `opus`) whose prompt starts `Run git checkout --detach <sha>.` review it,
     and merge `--no-ff`. Never reset or rewrite `uat-2`.
  2. Record why in `AUDIT.md`.
  3. Then SEND BACK.
- **Owner decisions.** Anything only the owner can decide is asked with AskUserQuestion in this session, and recorded in
  `AUDIT.md` and `ai/prompts/README.md`.

## 5. Finish

1. Remove your scratch and agent worktrees once every verdict is in.
2. Report to the owner in a few plain sentences: the verdict, what was checked, what was fixed or sent back, and whether
   `uat-2` is pushed.
3. End with the progress table and the next prompt from `ai/plans/README.md`: the execution prompt with `claude-glm`
   when a row is IN PROGRESS, or READY with its "Needs first" rows all DONE; the planning prompt with `claude-plan`
   when a row is NEEDS REPLAN, which replans that row, or when the next row is not planned yet. Each session is
   planned, executed and audited before the next one is planned (`README.md`, "Order"), so once a row becomes DONE the
   next step is planning the row after it. The owner can also just run `athan-next`, which starts the same step.
