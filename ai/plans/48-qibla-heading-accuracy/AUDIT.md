# Audit: Session 48

**Verdict: PASS.** Nothing to fix. Everything the plan specified exists, does what the contract says, and is
guarded by tests that fail when the code is broken. Every load-bearing number in the records was recomputed
from the committed probes rather than taken on trust, and the plan's own self-reported defect was verified
rather than accepted.

Audited in a scratch worktree at `uat-2`, `~/athan-device-sweep/worktrees/audit-48`, with `node_modules`
symlinked from the main checkout.

---

## 1. The range

`git log --oneline origin/uat-2..uat-2` lists four commits, all this plan's:

| Commit | What |
| --- | --- |
| `1c947980` | 1.29.201, the step commit |
| `bce99f94` | its merge |
| `e2de7ba5` | 1.29.202, the executed docs commit |
| `fc261f38` | its merge |

App code touched, and nothing else:

```
components/sheets/screens/__tests__/Qibla.test.tsx | 106 ++++++++++++++----
hooks/useQibla.ts                                  |  32 +++---
shared/__tests__/qiblaSettle.test.ts               | 121 +++++++++++++++++++++
shared/qiblaSettle.ts                              |  75 +++++++++++++
```

Versions in sequence: 1.29.201 then 1.29.202.

## 2. The plan against the commits

**Every contract the plan named exists with the signature it gave**, read from
`shared/qiblaSettle.ts`:

| Symbol | Line | Matches the plan |
| --- | --- | --- |
| `SETTLE_WINDOW_MS = 3000` | 19 | yes |
| `SETTLE_MIN_READINGS = 8` | 22 | yes |
| `SETTLE_DRIFT_DEGREES = 1.5` | 25 | yes |
| `HeadingSample` | 28 | yes |
| `circularMean` | 36 | yes |
| `headingDelta` | 48 | yes |
| `trailingWindow` | 57 | yes |
| `hasSettled` | 66 | yes |

`hasSettled` applies the three gates in the order the plan specified, including the span check at
`SETTLE_WINDOW_MS * 0.9` that the plan calls load-bearing.

**`processReading` runs in the plan's order**, and the audit checked the one thing that matters most for the
owner's accessibility requirement: **no path reaches the haptic without passing the gate.** The returns and
calls in order are `return` (NO_HEADING), `if (bearing === null) return`, `if (!hasSettled(...)) return`,
then `Haptics.impactAsync`. The gate is the last return before the tap.

**No extra file and no behaviour the plan did not ask for.** `heldRef` is gone
(`grep -c heldRef hooks/useQibla.ts` prints 0), which the plan specified and justified.

**The carried files are byte-identical** to the proven copies under `working-code/`, checked with `diff` on
all four.

## 3. The tests still guard

Both break scripts were run from the scratch worktree's root, after confirming neither holds an absolute
path:

| Script | Result |
| --- | --- |
| `ai/plans/48-qibla-heading-accuracy/scripts/breaks-step2.sh` | `caught 10 of 10`, `ALL AS EXPECTED: 1` |
| Step 2's script, extracted from its step file | `caught 6 of 6`, `ALL AS EXPECTED: 1` |

**The red check was re-run independently**, which is the audit's own verification rather than a reading of
the executor's claim: reverting the gate in the worktree fails exactly 3 of the 50 sheet tests, and they are
the three the plan added to guard it. That confirms the suite detects a missing gate, which is precisely what
the plan's own break script found it previously could not do.

## 4. The whole suite

`yarn validate` in the scratch worktree, exit 0:

```
Statements   : 100% ( 4737/4737 )
Branches     : 100% ( 2077/2077 )
Functions    : 100% ( 983/983 )
Lines        : 100% ( 4250/4250 )
Test Suites: 184 passed, 184 total
Tests:       2 skipped, 4947 passed, 4949 total
```

## 5. Reviews

`LOG.md` records a review verdict for the step commit, clean on the first read in one round, and the audit
re-read `git show 1c947980` itself and agrees. The docs commit `e2de7ba5` was reread here too.

**No fix of `EXECUTOR-BRIEF.md` section 4 item 8's kind was applied**, so there is nothing of that sort to
check: the executor changed nothing the plan did not specify.

## 6. The plan's own defect, verified rather than accepted

`LOG.md` reports that the pre-commit hook refused step 1 because `shared/__tests__/unusedExports.test.ts`
fails on a module whose exports no production file imports, and that the two steps therefore became one
commit. **The audit reproduced the measurement both ways:**

| State | `python3 scripts/find-unused-exports.py` |
| --- | --- |
| The settling import removed from `hooks/useQibla.ts` | **7** unreachable, naming `hasSettled` and `trailingWindow` |
| As shipped | **5** unreachable, the pre-existing entries only |

So the claim is exact and no smaller cut leaves `uat-2` green. **This is a defect in the plan, which the
planning session owns, and it is correctly recorded in `PLAN.md` section 6 and `LOG.md` rather than quietly
fixed.** It is the third session to meet this guard after 44 and 45, and that is written down where the next
planner will read it.

The audit's own note on it: the plan's section 4 lists the existing tests that cover the changed code and
**does not mention `unusedExports.test.ts`**, which is why the split survived the planner's own section 11
review. A plan adding an exported symbol should name that guard in its background.

## 7. The owner's rules

| Rule | Result |
| --- | --- |
| No visual change | **Kept.** The only `components/` file touched is `__tests__/Qibla.test.tsx` |
| No substituted prayer time | Kept. Nothing in the range touches prayer data |
| No hand-edited release file | Kept |
| No touch of `uat` or EAS | Kept |
| No API key | Kept |
| No coverage ignore comment | Kept, `grep` finds none in the three changed source files |
| No skipped hook | Kept. The refused attempt is recorded, and the commit that landed ran the full hook |
| Comments explain why | **Kept.** All 13 comments in the two changed source files state a reason; none restates what the code does |
| No invented constant, offset or per-location calibration | **Kept.** The three constants are thresholds on a measured residual, every one swept rather than chosen, and none adjusts a heading |

## 8. The records

Every load-bearing number in `AUDIT-FINDINGS.md` was recomputed from the committed probes:

| Claim | Recomputed |
| --- | --- |
| First reading about 30 degrees out, converged 0.71, 42.1x | `probe-window-ms.mjs`: `mean 0.71, worst 1.05`, first `30.05`, `42.1x` |
| A spread gate passes a converging stream at 27.22 degrees | `probe-settle.mjs`: `27.22` |
| A 10 uT offset swings the heading 30.8 degrees past both gates | `probe-physics.mjs`: `| 10 | 30.8 |` |
| 0.1% of readings survive the 2-degree gate at 0.5 degrees of jitter | `probe-cost.mjs`: `0.1%` |
| Suite after: 4949 tests across 184 suites, 100% on four measures | Measured here: 184 suites, 4949 tests, 100% on four measures |

The findings text also states plainly what the session does NOT fix, which the audit checked is true rather
than optimistic: the residual from a stable bias is invisible to every gate measured, and the heading source
is unchanged.

## 9. Device evidence

**None, and the plan says so deliberately** (section 7): the symptom lives in the owner's house and no
plan can reproduce his room. The claims this session makes are all measurable without a device and were
measured. The owner judges the gate on his own phones next, which is the same loop that accepted the compass
in session 45.

Nothing in the records claims a device reading, so there is no device evidence to check.

## 10. Verdict

**PASS.** The row is set DONE and `uat-2` is pushed.
