# Audit: Session 17. The widget horizon grows from 14 days to 30

| Field | Value |
| --- | --- |
| Audited | 2026-09-24 |
| Range | `origin/uat-2..uat-2`, eight commits, `729c57bb` through `48e94735` |
| Plan | `ai/plans/17-ios-timeline-horizon/PLAN.md` |
| Worktree | `~/athan-device-sweep/worktrees/audit-17`, removed after the verdict |
| Verdict | **PASS** |

## What was checked

| # | Check | How | Result |
| --- | --- | --- | --- |
| 1 | The range holds only this session's work | `git log --oneline origin/uat-2..uat-2` | Eight commits: the planning pair, two step pairs, the executed docs pair. All session 17 |
| 2 | Versions in sequence | `git show <sha>:package.json` | 352, 353, 354, 355, one patch apart, each message starting with its own version |
| 3 | No file outside the plan's lists | `git diff --name-only 53d9baba uat-2` | 12 files: the plan folder, `ai/plans/README.md`, `ai/AGENTS.md`, `app.json`, `package.json`, and the three source files the corrected step 2 names |
| 4 | The whole suite | `yarn validate` in the scratch worktree | Exit 0. `Tests: 2 skipped, 4643 passed, 4645 total`, 100% on statements (4199/4199), branches (1876/1876), functions (853/853) and lines (3789/3789) |
| 5 | The breaks still guard | The step's script, rewritten to the worktree path, after `grep -c '/Users/muji/repos/rn.athan.uk'` printed 0 | `caught: the horizon falls back to a fortnight`, `caught: the horizon overruns the entry budget`, `caught 2 of 2`, `ALL AS EXPECTED: 1` |
| 6 | **The measurement the whole plan rests on** | Built a 31-day timeline from the real builder in the scratch worktree and read its entry count and payload | `TIMELINE_DAYS=30 span=31d entries=185 payload=79998B`. The plan, the commit messages and `ai/AGENTS.md` all claim ~185 entries and ~78KB. Confirmed independently |
| 7 | The constant has one home | `grep -rn 'const TIMELINE_DAYS' stores/ shared/` | One hit, `shared/widgetTimeline.ts:73`. No copy left behind in `stores/widget.ts` |
| 8 | No bound relaxed | Read the volume block | Both 200 KB payload assertions intact, and the `stillAhead.length + 2` relative bound still sits beside the new absolute one rather than replacing it |
| 9 | `widgetSimulation.test.ts` not widened | `git diff --name-only` | Not in the diff. Section 5's design review item 3 holds |
| 10 | The owner's rules | Grepped the range | No `releases.json`, no `uat`, no EAS, no API key, no ignore comment, no `--no-verify`, no visual change (no layout file is in the diff) |
| 11 | Reviews recorded | `LOG.md` | A verdict for both steps, each listing the checks it ran |
| 12 | The records are accurate | Read `ai/AGENTS.md`'s new bullet against check 6 | Every number in it matches what the audit measured |

## Findings

**None that change the code.** Two things are recorded because they are the substance of this session.

1. **The plan was wrong about step 2, the execution caught it, and both the plan and `LOG.md` say so.** As written,
   step 2 moved the fixture spans to a literal 31. That passed every assertion while the break script still printed
   `NOT CAUGHT`, because no test could read `TIMELINE_DAYS`: it was private to `stores/widget.ts`, which imports
   react-native and a native module. The executing session moved the constant to `shared/widgetTimeline.ts`, pointed
   both fixtures at it, and rewrote the plan's step 2 to record what shipped. That is the plan being corrected by
   contact with the code, which is what `AUDITOR-BRIEF.md` section 4, item 3 asks for.
2. **A second measurement during execution earned an extra test.** With the fixtures reading the constant, every
   bound in the block is an UPPER bound, so shrinking the horizon back to 14 still passed. `carries a 30-day horizon`
   asserts the number itself, and a second break covers the opposite direction. The audit reproduced both.

## The claim this session makes

The widget stays correct for 30 days with the app closed instead of 14, on both platforms, and the cost is measured
rather than assumed:

| Span | iOS entries | iOS payload | Verdict |
| --- | --- | --- | --- |
| 16 days (before) | 95 | 40 KB | |
| **31 days (now)** | **185** | **78 KB** | Inside both budgets |
| 91 days | 545 | 230 KB | Past the 200 KB payload guard |
| 366 days | 2195 | 929 KB | Far past both; the owner's "maybe 1 year" is not available in this shape |

The 200 KB guard is untouched, which keeps it as the automatic warning it is meant to be.

## Verdict

**PASS.** The row moves to DONE and `uat-2` is pushed.
