# Queued sessions — the index

**This file is where open sessions are tracked.** The owner asked on 2026-09-13 where that was
being kept; the answer was "three separate briefs and a memory note", which is not an answer.
One list, in order, with a status each. Add a row when a session is queued, change the status
when it starts, and keep the brief itself in this directory.

| # | Session | Brief | Status |
| --- | --- | --- | --- |
| 1 | **Verify every feature on real hardware**: the flip either side of 00:00, both clock changes, high latitude, unreadable times, `uat` against `uat-2` | `device-verification-sweep.md` | **DONE** 2026-09-13, findings 72 to 77 |
| 2 | **Fetch before wipe**: never clear a usable cache for a fetch that might fail | `data-resilience-swap-not-wipe.md` | **DONE** 2026-09-13, 1.26.33, finding 67 |
| 3 | **`--:--` for unreadable times**: per prayer, not per day; the day is still shown. Extended by the owner during session 2: missing days, dashed-row styling, 1 January, screenshots to approve | `unavailable-times-dashes.md` | **DONE** 2026-09-13, 1.27.0, findings 71 and 72. Round 2 on 2026-09-14 (1.27.1 to 1.27.14, `feat/audit-71-dashes`, merged into `uat-2` the same day) built the owner's rulings on R5, R8, R11 and R14, the bar and "ago" badge measuring only from the prayer directly above next, and `...` above a waiting `--:--` countdown; choices C2, C5 to C10 and C13 on the approval page wait for the owner |
| 4 | **Close the test-coverage gaps**: parallel agents per area, widen `collectCoverageFrom` first | `coverage-sweep.md` | **DONE** 2026-09-15, 1.27.16 to 1.27.137: statements 68.49 to 76.18 over every measured area, 3,598 to 4,089 tests, thresholds raised to 76 statements, 73 branches, 74 functions and 75 lines; findings 80 to 82 are session 6, and 79 waits for session 5's explanation |
| 5 | **Reach 100% test coverage, and gate every commit on it**: answer the owner's coverage questions and explain findings 79 and 80 simply first; add a React renderer; `yarn validate` runs coverage; no commit or push without 100% coverage of the change | `coverage-100.md` | **NEXT** |
| 6 | **An alert always does what its bell shows**: fix findings 80 to 82 (Ramadan splash, two Android cancel failures), and 79 (settings hang) only if the owner approves it after session 5; design reviewed first | `alert-integrity.md` | queued |
| 7 | **Android: each notification replaces the one before it**: one shared tag, and notifications due at the same instant are left to the system | `replace-previous-notification.md` | queued |
| 8 | **iOS: find a way for each notification to replace the one before it**: investigate, and prove each answer on the iPhone | `ios-replace-previous-notification.md` | queued |
| 9 | **Keep yesterday's still-due rows after 00:00**: a Magrib or Isha after midnight stays on screen and keeps its alarm, before v2.0 | `keep-still-due-rows-after-midnight.md` | queued |
| 10 | **Moonsighting.com / Khalid Shaukat research**: v2.0 prerequisite, needs its own clean context, and runs after every other session | `moonsighting-research.md` | **RAN** 2026-09-14 on branch `research/moonsighting`. All four steps done: every page, document and archived method-page version read; London 2026 reproduced; implementations measured. Findings: `ai/features/moonsighting/RESEARCH-FINDINGS.md` |
| 11 | **Moonsighting research, session 2**: help the owner read the findings, then the small remainders and an independent review | `moonsighting-research-2.md` | **PAUSED** by the owner 2026-09-14. The owner hasn't read the findings yet, section 5's 11 questions are unanswered, and whether the research is usable for v2.0 is open. Resume at step 1 of the brief; the start prompt is at its end |

Ordering is the owner's, given 2026-09-13: the device sweep runs before everything else, and the
moonsighting research runs after everything else. On 2026-09-15 the owner queued the coverage session next and asked
for findings 80 to 82 to be fixed, so those became sessions 5 and 6 and the sessions queued before them moved down two:
old 5 to 9 are now 7 to 11. Documents written before 2026-09-15 use the old numbers. Sessions 7 to 9 sit in the order
they were queued until the owner places them.

## Waiting on the owner, from session 1

None of these is a session yet. Each needs the owner's decision first.

- **Traced, not run (finding 74):** a Suhoor wrapped onto the evening before loses a day of buffer.
  The other half, 1 January's failed previous-year fetch rejecting `sync()`, was ruled on by the
  owner during session 2 and is queued in session 3 as R13.
- **Leftover channels on the 3T:** cosmetic. Clearing the app's data or uninstalling removes them,
  and either needs a fresh backup of the owner's data first.

## Decided by the owner, 2026-09-15, from session 4

- **Findings 80, 81 and 82 get fixed**, in session 6 (`alert-integrity.md`). The owner's rule: what fires always
  equals what the bell shows (Off none, Silent silent, Sound sound), with no exception and no waiting for a refresh.
- **Finding 79 is not decided.** Session 5 explains 79 and 80 simply, because they were not clear, and the owner
  decides on 79 after that.
- **Yes to a React renderer** and **yes to `yarn validate` running coverage**; both are built in session 5
  (`coverage-100.md`).
- **No commit and no push without 100% coverage of the change**, and 100% overall is the target, with reviewed,
  written exclusions only for genuinely meaningless code.

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
  exception is session 3's `--:--` rendering and its styling rules, which the owner specified
  directly.
- **Never copy, average or synthesise a prayer time.** Owner ruling, 2026-09-13, absolute.
- Comments explain **why**, never what. The code already shows what.
- Every change deep-reviewed by an agent with no stake in it, and verified on the device.
