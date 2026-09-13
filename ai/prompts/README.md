# Queued sessions — the index

**This file is where open sessions are tracked.** The owner asked on 2026-09-13 where that was
being kept; the answer was "three separate briefs and a memory note", which is not an answer.
One list, in order, with a status each. Add a row when a session is queued, change the status
when it starts, and keep the brief itself in this directory.

| # | Session | Brief | Status |
| --- | --- | --- | --- |
| 1 | **Verify every feature on real hardware** — both phones, all 99 sounds, every notification, every Extras row, before/after midnight | `device-verification-sweep.md` | **NEXT** |
| 2 | **Fetch before wipe** — never clear a usable cache for a fetch that might fail | `data-resilience-swap-not-wipe.md` | queued |
| 3 | **Close the test-coverage gaps** — parallel agents per area, widen `collectCoverageFrom` first | `coverage-sweep.md` | queued |
| 4 | **Moonsighting.com / Khalid Shaukat research** — v2.0 prerequisite, needs its own clean context | `moonsighting-research.md` | queued |

Ordering is the owner's, given 2026-09-13: the device sweep runs before everything else.

## Also live, not sessions

- `audit-changes-2.md` — the audit brief currently being worked through. Findings and their
  closures live in `ai/features/uat-2/AUDIT-FINDINGS.md`.
- Mutation harness: `ai/features/uat-2/mutate.py` and `mutate2.py`. Re-run against any file an
  audit touches; a survivor is a place the suite cannot see.

## Standing rules that apply to every session in this list

- Never touch `uat`. One finding → one branch → one commit, version-bumped, merged `--no-ff`
  into `uat-2`.
- Never build on EAS and never push to it. EAS and the Expo MCP are read-only.
- `releases.json` is untouchable.
- Keep every visual exactly as it is — fixes change behaviour, never pixels.
- Comments explain **why**, never what. The code already shows what.
- Every change deep-reviewed by an agent with no stake in it, and verified on the device.
