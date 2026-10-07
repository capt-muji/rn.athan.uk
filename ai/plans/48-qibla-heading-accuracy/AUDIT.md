# Audit: Session 48

**Verdict: PASS.** Nothing to fix. Everything the plan specified exists, does what the contract says, and is
guarded by tests that fail when the code is broken. Every load-bearing number was recomputed from the
committed probes rather than taken on trust; the plan's self-reported defect was verified, not accepted.
Audited in a scratch worktree at `uat-2` (path since cleaned up) with `node_modules` symlinked from the main
checkout.

## The range

`1c947980` (1.29.201, the step commit), `bce99f94` (its merge), `e2de7ba5` (1.29.202, docs), `fc261f38`
(its merge). App code touched, nothing else: `shared/qiblaSettle.ts` (+75), `shared/__tests__/qiblaSettle.test.ts`
(+121), `hooks/useQibla.ts` (32 changed), `components/sheets/screens/__tests__/Qibla.test.tsx` (106 changed).

## What was verified

- **Contract:** every symbol exists with the planned signature in `shared/qiblaSettle.ts` —
  `SETTLE_WINDOW_MS = 3000`, `SETTLE_MIN_READINGS = 8`, `SETTLE_DRIFT_DEGREES = 1.5`, `HeadingSample`,
  `circularMean`, `headingDelta`, `trailingWindow`, `hasSettled` — and `hasSettled` applies the gates in the
  planned order including the span check at `SETTLE_WINDOW_MS * 0.9`.
- **Accessibility:** in `processReading` no path reaches the haptic without passing the gate; the gate's
  return is the last before `Haptics.impactAsync`.
- `heldRef` is gone (`grep -c heldRef hooks/useQibla.ts` prints 0); the four carried files were byte-identical
  to the proven copies under `working-code/` (diffed; those scratch copies are deleted here since).
- **Tests still guard:** both break scripts re-run, `caught 10 of 10` and `caught 6 of 6`, each ending
  `ALL AS EXPECTED: 1`. The red check was re-run independently: reverting the gate fails exactly 3 of the 50
  sheet tests — the three added to guard it — so the suite detects a missing gate.
- **Suite:** `yarn validate` exit 0 — 184 suites, 2 skipped, 4949 passed, 100% on all four measures
  (4737/4737 statements, 2077/2077 branches, 983/983 functions, 4250/4250 lines).
- **Reviews:** the step commit was clean on first read in one round; the audit re-read `git show 1c947980`
  and agrees; the docs commit `e2de7ba5` re-read here. No fix of the `EXECUTOR-BRIEF.md` section 4 item 8
  kind was applied.
- **The plan's own defect, reproduced:** removing the settling import from `hooks/useQibla.ts` makes
  `python3 scripts/find-unused-exports.py` report 7 unreachable (naming `hasSettled`, `trailingWindow`);
  as shipped, the pre-existing 5. So no smaller cut leaves `uat-2` green. Third session to meet this guard
  (after 44 and 45). The plan's background did not list `unusedExports.test.ts` among the tests covering the
  changed code — a plan adding an exported symbol should name it.
- **Owner's rules:** no visual change (only `components/` file touched is the test), no substituted prayer
  time, no hand-edited release file, no touch of `uat` or EAS, no API key, no coverage ignore comment, no
  skipped hook, comments explain why (all 13 state a reason), and the three constants are swept thresholds on
  a measured residual — no invented constant, offset or per-location calibration.

## Load-bearing numbers recomputed from the committed probes

| Claim | Recomputed |
| --- | --- |
| First reading about 30 degrees out, converged 0.71, 42.1x | `probe-window-ms.mjs`: `mean 0.71, worst 1.05`, first `30.05`, `42.1x` |
| A spread gate passes a converging stream at 27.22 degrees | `probe-settle.mjs`: `27.22` |
| A 10 uT offset swings the heading 30.8 degrees past both gates | `probe-physics.mjs`: `| 10 | 30.8 |` |
| 0.1% of readings survive the 2-degree gate at 0.5 degrees of jitter | `probe-cost.mjs`: `0.1%` |
| Suite after: 4949 tests across 184 suites, 100% on four measures | Measured here |

The findings text states plainly what the session does NOT fix — the residual from a stable bias is invisible
to every gate measured, and the heading source is unchanged — and the audit checked that is true rather than
optimistic.

Device evidence: none, and the plan says so deliberately; the owner judges the gate on his own phones next.
**The row is set DONE and `uat-2` is pushed.**
