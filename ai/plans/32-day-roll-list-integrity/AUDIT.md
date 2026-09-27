# Audit: Session 32. ISSUES #27, the day roll

| Field | Value |
| --- | --- |
| Audited | 2026-09-27 |
| Range | `a5fc9631` (plan) through step 2's merge |
| Verdict | **PASS** |

## What was checked

| # | Item | How it was proved |
| --- | --- | --- |
| 1 | The range holds only this session's commits | `git log --oneline origin/uat-2..uat-2` lists the plan commit and its merge, step 1 and its merge, and step 2 and its merge. Nothing else |
| 2 | Step 1 does what the plan specified, and nothing else | `git show --stat 5d68802d`: `stores/__tests__/schedule.test.ts`, `app.json`, `package.json`, `ai/plans/README.md` and the plan folder only. **No source file.** The test's name, its fixture and its assertion match the plan's row word for word |
| 3 | The test proves what the plan said | It drives 864 five-minute steps across three days, calls `refreshSequence` at each, and at every step where a list day is on screen compares the rows held for that day against the rows the real builder puts on it. It asserts the collected differences are empty, so a failure names the step, the instant, the day and the rows |
| 4 | The test guards the line | `bash $TMPDIR/breaks-32-1.sh` ends `ALL AS EXPECTED: 1`, with `CAUGHT: day-roll keep removed` and `CAUGHT: both keeps become equalities`. `stores/schedule.ts` is restored clean after each break |
| 5 | The whole suite is green at 100% | The hook on both step commits reports `Tests: 4775 passed, 4775 total` with `Statements 100% (4409/4409)`, `Branches 100% (1962/1962)`, `Functions 100% (917/917)`, `Lines 100% (3970/3970)` |
| 6 | Versions in sequence | 1.29.33 (plan), 1.29.34 (step 1), 1.29.35 (step 2), each in `app.json`, `package.json` and the gitignored `android/app/build.gradle` |
| 7 | Reviews recorded | `LOG.md` records step 1's one round and its one finding, applied under `EXECUTOR-BRIEF.md` section 4, item 8 with the break script re-run afterwards. Step 2's review is below |
| 8 | Records accurate | Every number in `ai/ISSUES.md`, `ai/AGENTS.md` and `AUDIT-FINDINGS.md` traces to a measurement in the plan's section 5: 562, 0, 1440, 20,000, 360 days, 04:00 to 05:56, 13 tests, 1,014, 966, 3,748, 4 rows |
| 9 | The owner's rules | No visual change, no prayer time substituted (the fixture is a synthetic latitude, stated as such in the test's own comment and in the records), no release file, no touch of `uat` or EAS, no API key, no ignore comment, no skipped hook |
| 10 | Device evidence | None claimed, and none needed: the plan's section 7 gives the reasoning, and no commit in the range touches a platform path |

## Findings

**One, found by the planning session against its own work, and it is the most useful thing in this session.**

The plan's first draft asserted that #27's cause was a single equality and wrote a break script that mutated that one
operator. Run, it printed `SURVIVED`. Today's `filterRelevantPrayers` holds TWO keep tests that overlap on the
day-roll shape, so either one alone holds the invariant:

| Mutation of today's code | Standard short-list states on the overlap fixture |
| --- | --- |
| none | 0 |
| day-roll keep becomes `===` | 0 |
| day-roll keep removed | 1,014 |
| `previous` keep becomes `===` | 0 |
| `previous` keep removed | 0 |
| both keeps become `===` | 966 |

The plan was corrected before it merged: section 5 carries the matrix, the break script uses the two mutations that
are genuinely red, and every statement of the form "the equality was the defect" was rewritten to distinguish
2026-09-10 as a whole (where both tests were equalities) from any single line today. **A break script written from a
diagnosis is not verified until it is run**, and that lesson is in `ai/AGENTS.md`.

**Nothing else.** No finding against the executed commits.

## Step 2's review

`git show` read back cold. #27's original observation bullets are kept rather than rewritten, which matters because
they are the only record of what was actually seen on device. The new issue is #42, the next unused number, and no
existing number moved. The closed index gained one line between #26 and #28, in that list's own style. The
`ai/AGENTS.md` entry is a durable lesson, names no model, and carries no plan mechanics. No source file and no test
changed in the commit. The two em-dash-or-arrow matches in the diff are both correct: one is a verbatim quote of
`mocks/simple.ts`'s own header, and the other is the closed index's existing em-dash style.

## Verdict

**PASS.** The session answered the owner's question with evidence rather than assertion: #27 was real, its cause is
named, it was fixed on 2026-09-13, it was never reachable on real London data, and the day roll now has a test of its
own where before it had only thirteen tests about a different rule. One finding is left open as `ai/ISSUES.md` #42.
