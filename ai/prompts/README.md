# Queued sessions — the index

**This file is where open sessions are tracked.** The owner asked on 2026-09-13 where that was
being kept; the answer was "three separate briefs and a memory note", which is not an answer.
One list, in order, with a status each. Add a row when a session is queued, change the status
when it starts, and keep the brief itself in this directory.

| # | Session | Brief | Status |
| --- | --- | --- | --- |
| 1 | **Verify every feature on real hardware**: the flip either side of 00:00, both clock changes, high latitude, unreadable times, `uat` against `uat-2` | `device-verification-sweep.md` | **DONE** 2026-09-13, findings 72 to 77 |
| 2 | **Fetch before wipe**: never clear a usable cache for a fetch that might fail | `data-resilience-swap-not-wipe.md` | **NEXT** |
| 3 | **`--:--` for unreadable times**: per prayer, not per day; the day is still shown | `unavailable-times-dashes.md` | queued |
| 4 | **Close the test-coverage gaps**: parallel agents per area, widen `collectCoverageFrom` first | `coverage-sweep.md` | queued |
| 5 | **Moonsighting.com / Khalid Shaukat research**: v2.0 prerequisite, needs its own clean context | `moonsighting-research.md` | queued |
| 6 | **Android: each notification replaces the one before it**: one shared tag, and notifications due at the same instant are left to the system | `replace-previous-notification.md` | queued |
| 7 | **iOS: find a way for each notification to replace the one before it**: investigate, and prove each answer on the iPhone | `ios-replace-previous-notification.md` | queued |

Ordering is the owner's, given 2026-09-13: the device sweep runs before everything else.
Sessions from 6 on sit in the order they were queued until the owner places them.

## Waiting on the owner, from session 1

None of these is a session yet. Each needs the owner's decision first.

- **Finding 74:** after 00:00, a still-due row from yesterday's list leaves the screen and loses its
  alarm. It is dormant in London and live for v2.0.
- **Finding 72:** night rows on the first stored day come from a substituted Magrib, and two tests
  assert that behaviour.
- **Traced, not run (finding 74):** a Suhoor wrapped onto the evening before loses a day of buffer,
  and on 1 January a failed previous-year fetch rejects `sync()`.
- **Leftover channels on the 3T:** cosmetic. Clearing the app's data or uninstalling removes them,
  and either needs a fresh backup of the owner's data first.

## Also live, not sessions

- `audit-changes-2.md` — the audit brief currently being worked through. Findings and their
  closures live in `ai/features/uat-2/AUDIT-FINDINGS.md`.
- Mutation harness: `ai/features/uat-2/mutate.py` and `mutate2.py`. Re-run against any file an
  audit touches; a survivor is a place the suite cannot see.
- Finding 76: three wrong code comments and a stale `ai/AGENTS.md:523` note, small documentation
  fixes.

## Standing rules that apply to every session in this list

- Never touch `uat`. One finding → one branch → one commit, version-bumped, merged `--no-ff`
  into `uat-2`.
- Never build on EAS and never push to it. EAS and the Expo MCP are read-only.
- `releases.json` is untouchable.
- Keep every visual exactly as it is — fixes change behaviour, never pixels. The one standing
  exception is the `--:--` rendering in session 3, which the owner specified directly.
- **Never copy, average or synthesise a prayer time.** Owner ruling, 2026-09-13, absolute.
- Comments explain **why**, never what. The code already shows what.
- Every change deep-reviewed by an agent with no stake in it, and verified on the device.
