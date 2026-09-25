# Audit: Session 24, the two Lock Screen day-list faces

Audited at `21560164` from an independent worktree, `~/athan-device-sweep/worktrees/audit-24`, detached at `uat-2`
with `node_modules` symlinked from the main checkout. Removed afterwards.

**Verdict: PASS on the code, and the row stays EXECUTED.** Every check below passed, and the one thing the plan asks
for that cannot be done from here is the owner's own: looking at the two faces on the XS. The plan's section 9 already
says so, so this is the plan working as written rather than a finding.

**One caveat on this audit's independence, stated plainly.** The owner asked for planning, execution and audit in one
session and, separately and repeatedly, for no subagents. So the same session wrote the plan, built it and audited it,
and there was no `Code Reviewer` subagent at any step. That removes the fresh pair of eyes the programme normally puts
between the executor and `origin`, and no amount of care here replaces it. What it does not remove is evidence: every
claim below is a command that was run and its output, most of it from a checkout this session was not working in, and
two of the checks were deliberately built to fail if my own reasoning was wrong (the independent red check, and the
statement-level diff proving the existing layouts did not change behaviour).

## What was checked

| # | Check | How it was proven |
| --- | --- | --- |
| 1 | The range holds only this session's commits | `git log --oneline origin/uat-2..uat-2` lists four: the plan commit `2572df32` and its merge `7afb3de5`, the step commit `bd5610da` and its merge `21560164`. Both docs commits were reread in full |
| 2 | Versions in sequence, all three files agreeing | 1.28.12 then 1.28.13; `package.json` and `app.json` both read 1.28.13, and `versionLockstep.test.ts` passes in the suite, which is what checks the gitignored gradle file |
| 3 | Every test the plan listed exists, by the name it gave | All nine `it`/`it.each` rows present, names matching the plan's table word for word |
| 4 | No extra file, no extra behaviour | `git diff --name-only origin/uat-2..uat-2` lists the plan's nine files plus the plan folder itself, nothing else |
| 5 | The breaks still guard | The script has no absolute repo path (`grep` prints nothing), and run from the audit worktree it printed `CAUGHT: 6 of 6` then `ALL AS EXPECTED: 1` |
| 6 | Red reproduces independently | In the audit worktree, `git checkout bd5610da~1 -- widgets/LockPrayerWidget.tsx` then the suite: `TypeError: layouts.ExtrasLockWidget4 is not a function`, for both new kinds. Restored afterwards |
| 7 | The whole suite | `yarn validate` in the audit worktree exited 0: `4675 passed, 2 skipped, 4677 total`, at 100% statements, branches, functions and lines |
| 8 | The builder was not touched | `shared/widgetTimeline.ts` and `shared/sequence.ts` are absent from the range's file list, so the rollover still has exactly one source of truth |
| 9 | The existing three layouts changed no rendered output | Proven mechanically, not by reading: a statement-level diff of the pre-commit file against the post-commit one with the two new layouts excised, comments and brace-only lines stripped, reports 14 differences, every one of them the `Spacer` import or one of three `Out of date` elements Biome joined onto a single line once the dedent left room |
| 10 | The owner's rules | No `releases.json` or `eas.json` in the diff; no `istanbul ignore`, `c8 ignore` or `v8 ignore`; no `--no-verify`; no API key; `uat` untouched; nothing built on EAS |
| 11 | Reviews recorded | `LOG.md` carries a verdict and its evidence for the step, and states openly that this session performed that review itself against the plan's eleven checks because no subagent was permitted |

## Findings

**None against the code.** Two things are worth recording anyway.

1. **The plan this session inherited was not executable, and was rewritten before anything was built.** Row 23 read
   READY, but `PLAN.md` was a design brief: no header table, no pre-flight, no anchors, no step structure, no break
   script, no commit message, no acceptance criteria. An executor could not have run it without deciding what to build,
   which is the defect `PLANNER-BRIEF.md` exists to prevent. The planning phase therefore ran first, at `273abe96`.
   This is not a finding against the executor; it is a finding against whatever earlier session set that row READY.
2. **The scope changed mid-plan, from four kinds to two,** on the owner's instruction. The plan, the queue row and
   `ai/prompts/README.md` were rewritten to match before any code existed, so nothing was built to the old scope and
   nothing was reverted.

## Owner decisions taken during this session

Recorded in full in `ai/prompts/README.md` under "Decided by the owner, 2026-09-25, while planning session 24": the two
kinds, the three row tiers, the 11pt and 14pt sizes, no inline branch, no `try`/`catch` anywhere in the file, and a
held day listing its rows unmarked.

One more was taken while this audit was being written, and it changed nothing: the owner restated that the next prayer
is the only bold and only pure-white element on either face, with every text at one size and opacity carrying the rest.
That is what `bd5610da` already shipped. Asked whether "the next prayer" meant its name alone or the name and its time,
the owner chose both, which is what the code does: a row computes one `colour` and one `weight`, so a name and its time
can never disagree. `widgetLockListRenderer.test.ts` line 218 pins it by asserting the COMPLETE list of bold texts
equals `['Asr', '15:20']`, so a bold creeping onto any other row fails the suite, and break 2 proves that assertion is
load-bearing.

## Device proof: outstanding, and the row stays EXECUTED

The plan's section 7 needs a Release build on the iPhone XS with the real API key, then the owner's eyes on three
questions no test can answer:

1. whether the one-column extras face at 11pt is readable, or wants fewer rows;
2. whether a column of the split face holds `Last Third 02:41` without shrinking to nothing;
3. whether the three tiers (solid, 60%, 35%) separate on the glass in vibrant monochrome.

Touch automation is not available on a physical iPhone (`ai/AGENTS.md`), and the owner receives no screenshots, so this
step is theirs. The plan's section 9 states the consequence, and this audit honours it: **the row stays EXECUTED, not
DONE, and `uat-2` is not pushed.** `AUDITOR-BRIEF.md` section 4's PASS path sets a row DONE and pushes; doing that here
would claim a visual verdict nobody has given.

## What the owner does next

Type `athan-next`. The next session builds 1.28.13 onto the XS per the plan's section 7, the owner places both faces and
rules on the three questions, and the row becomes DONE on their word. If either face fails on device, that is a fix for
an audit session, not a replan: the plan is sound and only its numbers would move.
