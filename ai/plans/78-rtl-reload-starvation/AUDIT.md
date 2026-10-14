# AUDIT — ticket 78

The audit of branch `ticket/78` (base `b1bf6f89`) ran three reviewers on
2026-10-14: plan-conformance, blind, and a threading-and-lifecycle-focused
blind pass (the change rides the scheduling lock's concurrency). The range's
code diff is 207 lines excluding the plan folder. Every reviewer re-ran the
suites itself: 14 tests pass, `stores/language.ts` at 100% statements,
branches, functions and lines.

## Verdict: PASS

All confirmed findings are fixed at 2.0.304. The rejected findings carry the
line that disproves them. Nothing owner-owned surfaced: no visual, no
notification-scheduling behaviour, no ruling this run lacks.

## Findings and adjudication

| # | Source | Severity | Finding | Verdict | Action |
| --- | --- | --- | --- | --- | --- |
| 1 | blind | must | `stores/language.ts` constant comment cites ticket history ("row 78's starved crossings waited past four minutes"), against `ai/AGENTS.md`'s "No history and no provenance in comments" | Confirmed. The plan's own contract prescribed the offending words; the defect is the plan's | Fixed at 2.0.304: the comment keeps the why (healthy cycle ~1.4 s, one silent native call legally burns 15 s, a starved queue holds the pass for minutes) and drops the history. Comment-only, no behaviour, so no red test applies |
| 2 | blind + thread | nice | the warn hardcodes "10000 ms" instead of interpolating `RELOAD_CONVERGENCE_CAP_MS` | Rejected. The literal is plan-pinned (contract item 4) so the break script's mutation (c) pattern matches, and the claim's premise fails: any constant change already breaks the suite's boundary test (mutation (b) proved `Tests: 3 failed` at the 10 s advance) and the exact-string assertion together, so the log line can never drift quietly | None |
| 3 | blind | nice | `clearTimeout` skipped if the race rejects | Rejected. The race cannot reject: `reconcileLanguageSurfaces` catches its own failures (`stores/language.ts`) and `capSettled` only resolves; the thread reviewer traced the same path and confirmed it. A future change breaking that contract fails the suites loudly (the tests await the commit) | None |
| 4 | blind | nice | pre-existing docstring duplication around the insertion (`stores/language.ts` lines 51-56 versus 67-69) | Rejected. Pre-existing, outside this diff; the audit judges the change | None |
| 5 | plan | nice | LOG.md says the anchor block is "14 lines"; it is 15 | Confirmed | Fixed at 2.0.304 |
| 6 | plan | nice | step 1 contract item 5's parenthetical ("through the reload branch's closing brace") contradicts the 3-to-15-line anchor bound; the executor deviated correctly and documented it | Confirmed. The plan's wording was wrong, the executor's resolution right | Fixed at 2.0.304: the parenthetical names the bounded-await region |
| 7 | plan | nice | step 2's Files list omits `PLAN.md`, whose box tick the step's done-when requires | Confirmed | Fixed at 2.0.304 |

## The threading trace (the focused pass, accepted as the audit's own)

Every named interleaving resolves safely: the cap firing while the pass is
queued (the pass dies with the torn-down context, stamp unwritten, the next
context's init chain and the foreground retry converge it); mid-pass
(schedule-first identifiers, the sweep, the unstamped gate heal a torn batch);
settled first (the losing timer is cleared in a microtask that precedes the
timer's turn); the busy atom and the sheet dismiss (the `finally` covers every
path where the context survives); no double-reload window exists between race
resolution and `reloadAsync`; the lock is a chain, not a mutex, and nothing
added holds it.

## Commits

| Version | Commit | What |
| --- | --- | --- |
| 2.0.300 | `66e8a4ed` | PLANNING skeleton |
| 2.0.301 | `e7891fb7` | READY: plan grilled (eleven findings applied), gate `PLAN OK` |
| 2.0.302 | `00cf7c0f` | the fix: the boundary-crossing convergence wait bounded at 10 s, red-first suite, mutation pass, anchor updated |
| 2.0.303 | `76dfee36` | the verdict record (`FINDINGS.md`) |
| 2.0.304 | this commit | the audit fixes (findings 1, 5, 6, 7) and `AUDIT.md` |

The run stops here per the owner's run order, 2026-10-14: no merge into
`uat`, no push, no DONE. The orchestrator merges and applies the DONE record
from `PLAN.md` section 8.
