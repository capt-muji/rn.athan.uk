# Audit: Session 20. G.2 and the horizon to 3 days

| Field | Value |
| --- | --- |
| Audited | 2026-09-25 |
| Range | `origin/uat-2..uat-2`, 8 commits: 1.27.373 to 1.27.376 |
| Worktree | `~/athan-device-sweep/worktrees/audit-20` at `25a9f053`, removed at the end |
| Verdict | **PASS** |

## What was checked

| Item | How | Result |
| --- | --- | --- |
| The range holds only this session's commits | `git log --oneline origin/uat-2..uat-2` | 8 commits: the planning pair, two step pairs, the executed docs pair. Nothing foreign. |
| Files touched are only those the plan lists | `git diff --stat origin/uat-2..uat-2` | 19 files, every one named in a step's Files list or the plan folder itself. |
| Step 1 matches its contract | `git show 34b90cb1` | `TIMELINE_DAYS = 3`; nothing else in `shared/widgetTimeline.ts` changed; `stores/widget.ts` absent from the commit. |
| The four named tests changed as specified | `git show 34b90cb1 -- shared/__tests__/widgetTimeline.test.ts` | All four, and only those four. Both guards read `toBeLessThan(22)`; the payload guard is still `200_000`, twice. |
| Step 2 matches its contract | `git show 0ba96ef7` | `shared/flags.ts` changed only inside the `widgets` JSDoc; the value line and the `androidWidgets` JSDoc are untouched. |
| Step 2's factual claims | Read against the installed tree | `expo-widgets` is `58.0.3`; `grep -c 'UUID()' node_modules/expo-widgets/ios/Widgets/DynamicView.swift` prints `0`; the CHANGELOG records #49810 under `58.0.1`; `app.json` gives 0 of 12 kinds an `ios.initialLayout`. Every claim holds. |
| The tests still guard | `bash $TMPDIR/breaks-20-1.sh` from the audit worktree root, after confirming it holds no absolute repository paths | `ALL AS EXPECTED: 1`, all three horizon substitutions caught. |
| The red check reproduces | Reverted `TIMELINE_DAYS` to 7 in the audit worktree | The same three tests fail with the same lines the executor recorded (`< 22` vs 40, `3` vs `7`, `< 22` vs 26). |
| The whole suite | `yarn validate` in the audit worktree | Exit 0. 170 suites, 4,645 passing, 100% statements, branches, functions and lines. |
| The records' measured figures | An independent builder run in the audit worktree | `entries=23 bytes=9771`, matching `AUDIT-FINDINGS.md` exactly. |
| Versions in sequence and lockstep | `git show <sha>:package.json` per commit; `app.json` against `package.json` at HEAD | 1.27.373, .374, .375, .376. Both files read 1.27.376. |
| Commit messages | Read each | As the plan wrote them, with the version filled in. |
| The owner's rules | `git diff origin/uat-2..uat-2` filtered | No `releases.json`, no `eas.json`, no `uat`, no EAS. No `components/`, `widgets/` or `assets/` file: no pixel changed. No ignore comment added. No API key. No hook skipped. |
| Reviews recorded | `LOG.md` | A verdict for every step commit, each with what it checked. |

## Findings

**1. A subagent was spawned once, against the owner's instruction. Not a code defect; recorded in full.**

The owner instructed that this session use no subagents at all. The plan as first written carried the programme's
standing rule instead, naming a `Code Reviewer` subagent in section 11 and in both steps' part 9, and step 1's review
was begun by spawning one. It failed on an unavailable model, and the session performed the review itself.

The session then corrected the plan in step 2's commit: section 11 now records the owner's instruction and says the
session reviews its own commits against the same checklists, and both steps' part 9 say the same. `LOG.md` records
the whole episode for this audit.

Judged here: nothing merged unreviewed, no work was delegated, and the document that caused the slip is fixed, so
the defect cannot recur from the same source. No further action.

**2. One review finding during execution, fixed before merge. Correctly handled.**

Reviewing step 2, the session found `ai/ISSUES.md` still carried the present-tense heading "THE FIX IS NOW #49810,
MERGED BUT UNRELEASED" at G.1 item 0. The plan had said to leave the old diagnosis in place, but a present-tense
status claim is not diagnosis, and leaving it would have reproduced the exact hazard the step existed to remove. It
was struck through and marked SUPERSEDED using the file's own convention, pointing at the new status note, with the
dated 2026-09-12 detail kept as the record. The commit was amended rather than followed by a second commit, which is
right for a branch that had not merged.

This meets all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, and is recorded in `LOG.md` as that item
requires. Verified: `shared/flags.ts` holds no occurrence of `57.0.18`, `UNRELEASED` or `merged but`, and the
survivors in `ai/ISSUES.md` are all inside the struck-through dated record.

**3. No device evidence, correctly.**

The plan's section 7 says none is possible: the iOS widgets flag is off, so `app.config.ts` strips the expo-widgets
plugin at prebuild and no build this session could make contains a widget extension. Confirmed that no claim in the
records text asserts device behaviour. Nothing was installed, no clock was changed, and neither phone was touched.

## Verdict

**PASS.** Nothing to fix. Row 17 set to DONE, `ai/prompts/README.md` updated with the plan's section 8 text, and
`uat-2` pushed.

## Note for the next session

G.2 stays OPEN in `ai/ISSUES.md`, which is correct: this session characterised it and ruled out entry count, but
could not observe a placement, because the flag is off. The one repository-side lead (no `ios.initialLayout` on any
iOS kind, leaving the embedded layout registry empty) is recorded there and is the first thing to try once row 16
flips the flag on the XS.
