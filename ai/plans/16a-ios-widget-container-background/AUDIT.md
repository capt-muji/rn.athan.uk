# Audit: Session 16a. iOS widgets, containerBackground to verdict

| Field | Value |
| --- | --- |
| Audited | 2026-09-24, audit session |
| Plan | `ai/plans/16a-ios-widget-container-background/PLAN.md` (8 steps) |
| Range | `33381bb1^..b89a4c9b` on `uat-2`, versions 1.27.297 and 1.27.313 to 1.27.323 |
| Scratch worktree | `~/athan-device-sweep/worktrees/audit-16a` at `6d62dc9e`, removed at the end |
| Verdict | **FIX IT, then PASS.** Two defects, both in `LOG.md`, both repaired here |

The session's own commits were already on `origin/uat-2` when this audit started: later sessions
(15b's successors, ISSUES #36 and #37) pushed through them. `git log origin/uat-2..uat-2` is
therefore empty, and the audit read the range by sha rather than by the unpushed set.

## 1. What was checked

| # | Check | Command or file | Result |
| --- | --- | --- | --- |
| 1 | The range holds only plan commits | `git log --oneline --first-parent uat-2` over 2026-09-20 | 16 commits: 1 planning, 1 checkpoint merge, 5 step merges, 2 direct commits, docs. No stranger |
| 2 | Step 2 against its contract | `git show 0448b271` vs `steps/2-lock-centring.md` | Exact. Import alphabetical, `containerRelativeFrame` innermost on all six rectangular paths, `alignment='leading'` deleted from five, L2 live gains it, docstring says why |
| 3 | Step 2's tests | same diff vs the step's part 4 | Both specified tests present: the six-row `it.each` asserting index 0, `frameIndex` greater, value `{ axes: 'horizontal' }`; and the inline/alignment test. `MODIFIERS` stub extended |
| 4 | Step 3 against branch C | `git show a08329b3` vs `steps/3-nebula-verdict.md` | Exact. `OrbLight`, the three `NEBULA_*` constants and the `Circle`/`blur`/`scaleEffect` imports deleted; renderer pins zero Circles on both themes and families; the contract drops the three literals from both lists |
| 5 | Step 2 breaks still catch | `/tmp/breaks-16a-2.sh` in the scratch worktree | `CAUGHT: axes vertical`, `CAUGHT: leading alignment back on layout 2`, restore green, `ALL AS EXPECTED: 1` |
| 6 | Step 3 red re-run (riskiest) | card literal reverted in the worktree | `Tests: 2 failed, 8 passed`, matching the LOG. A `<Circle />` reinserted into the dark path fails `draws no runtime orbs on any theme`: `1 failed, 32 passed` |
| 7 | The whole suite | `yarn validate` in the scratch worktree | Exit 0. 169 suites, 4621 passed, 2 skipped. Statements/branches/functions/lines all 100% |
| 8 | Versions | `app.json` vs `package.json` at all nine commits | Every pair in sync, strictly ascending 1.27.313 to 1.27.323 (1.27.314 and 1.27.322 belong to other rows' commits in the same window) |
| 9 | Commit messages | `git log` over the range | Each starts `<VERSION> - `, and steps 2 and 3 carry the plan's wording with the version filled |
| 10 | Owner rules | `git diff 33381bb1^ b89a4c9b` filtered | `releases.json`, `eas.json` and CI untouched; no API key; no `biome-ignore`/`ts-ignore`/`ts-expect-error` in shipped widget code; no `console.log`; no skipped test |
| 11 | No synthesised prayer time | `shared/time.ts` diff | The only deletion is `formatCountdownMinutes`, a label formatter. Its minute-ceil logic moved inline as `ALabel` in the widget body, which the `'widget'` directive requires. No time value is copied or invented |
| 12 | Device evidence | `LOG.md` §36 to §49, `~/athan-device-sweep/16a-ab/`, `16a-nebula-round/` | Artefacts present: two APKs, two `.app` bundles, the baseline screenshot. Every owner checkpoint is recorded with their verbatim answer |
| 13 | Records text | `ai/features/uat-2/AUDIT-FINDINGS.md` line 5963 | Every one of the ten placeholders is filled; no `<` survives in the block |
| 14 | Reviews | `LOG.md` §34 to §49 | Each step commit carries its own recorded diff review. No subagent reviewed anything, which is the owner's ruling for this plan, not a gap |

## 2. Findings

### Finding 1: `LOG.md` lost the §51 heading, orphaning its body after §53

`bccc1bf0` (1.27.323) replaced the line `## 51. Investigation follow-ups ruled on by the owner:
accept the cost, no changes` with `## 52. The bake experiment...` instead of inserting §52 after
§51. The §51 body survived but was left headless and stranded below §53, so the document read
50, 52, 53, then eleven lines of unattributed prose. A reader had no way to tell whose ruling it
was or where it belonged.

**Fixed here.** The heading is restored and its paragraph moved back between §50 and §52. Sections
now read 45 through 53 in order.

### Finding 2: `LOG.md` carried a duplicated, truncated copy of the §40 A/B paragraph at EOF

`aa044606` (1.27.320) appended a second copy of §40's opening paragraph below §49, with no
heading, separated by blank lines, and ending mid-thought. It contradicted §40 in one detail
("side B measured first-built-then-A" against §41's recorded A-then-B order), so the file held two
different accounts of the same measurement.

**Fixed here.** The stray copy is deleted. §40 and §41, which are correct and carry the result
table, stand as the single account.

### Not findings, recorded because they look like ones

- **The process slip at 1.27.316.** `dee02d7c` landed directly on `uat-2` without its own branch.
  The executor caught it, recorded it in `LOG.md` §37 under "PROCESS SLIP, recorded for the
  audit", and the content is correct and reviewed. Self-reported and already in the record, so it
  is noted, not repaired; rewriting `uat-2`'s history to add a branch would be worse than the slip.
- **Step 3 landed branch C after recording branch D.** `1428c8dc` deferred the verdict, then
  `a08329b3` dropped the orbs. That is not a contradiction: the plan's §2.1 decision 4 allows the
  owner to rule mid-step, and §43's A/B control produced the evidence that changed their mind.
  The checklist line records the supersession.
- **The dark card literal has moved since.** `rgba(18, 14, 40, 0.95)` became
  `rgba(2, 13, 38, 0.95)` in `874461d0` (1.27.324, the Gradient Deep palette), after 16a closed.
  My first break run missed because I used 16a's literal; re-run against the current one it caught
  correctly. The pin works; the literal simply belongs to a later row.
- **`patches/` still exists.** It holds `expo-background-task+58.0.3.patch` from ISSUES #37, not
  the expo-widgets patch 16a removed. `postinstall: patch-package` is correctly still wired for it.
- **PLAN §8's second records instruction has no target.** It tells this audit to set "the
  `ai/prompts/README.md` programme table row for 16a" on PASS, but that table holds one row
  (moonsighting) and never carried a 16a row; the programme table moved to `ai/plans/README.md`
  long before this session. Sessions 15 and 15b hit the same dead instruction, and 15b's
  `AUDIT.md` recorded it rather than inventing a row. Same here: the queue row in
  `ai/plans/README.md` is the one that matters, and it now reads DONE. The six owner rulings this
  session produced are already in `ai/prompts/README.md`, written by the executor.

## 3. Verdict

**PASS**, after the two `LOG.md` repairs above.

Everything the plan specified shipped, and shipped as specified. The two code steps match their
contracts line for line, their tests prove what the plan said they would, both breaks still catch,
and the suite is green at 100% on all four measures. Neither finding touched code or behaviour:
both were damage to the session's own record, done by later docs commits editing around the
previous section rather than after it.

Row 11 goes to DONE.
