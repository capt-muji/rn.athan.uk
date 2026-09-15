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
| 4 | **Close the test-coverage gaps**: parallel agents per area, widen `collectCoverageFrom` first | `coverage-sweep.md` | **DONE** 2026-09-15, 1.27.16 to 1.27.137: statements 68.49 to 76.18 over every measured area, 3,598 to 4,089 tests, thresholds raised to 76 statements, 73 branches, 74 functions and 75 lines; findings 79 to 82 wait for the owner |
| 5 | **Android: each notification replaces the one before it**: one shared tag, and notifications due at the same instant are left to the system | `replace-previous-notification.md` | queued |
| 6 | **iOS: find a way for each notification to replace the one before it**: investigate, and prove each answer on the iPhone | `ios-replace-previous-notification.md` | queued |
| 7 | **Keep yesterday's still-due rows after 00:00**: a Magrib or Isha after midnight stays on screen and keeps its alarm, before v2.0 | `keep-still-due-rows-after-midnight.md` | queued |
| 8 | **Moonsighting.com / Khalid Shaukat research**: v2.0 prerequisite, needs its own clean context, and runs after every other session | `moonsighting-research.md` | queued, last |

Ordering is the owner's, given 2026-09-13: the device sweep runs before everything else, and the
moonsighting research runs after everything else. Sessions 5 to 7 sit in the order they were queued
until the owner places them.

## Waiting on the owner, from session 1

None of these is a session yet. Each needs the owner's decision first.

- **Traced, not run (finding 74):** a Suhoor wrapped onto the evening before loses a day of buffer.
  The other half, 1 January's failed previous-year fetch rejecting `sync()`, was ruled on by the
  owner during session 2 and is queued in session 3 as R13.
- **Leftover channels on the 3T:** cosmetic. Clearing the app's data or uninstalling removes them,
  and either needs a fresh backup of the owner's data first.

## Waiting on the owner, from session 4

Each is written up in `ai/features/uat-2/AUDIT-FINDINGS.md` under "Session 4 of the queue", with its evidence. None
is fixed: 81 and 82 change notification scheduling logic, 80 changes when the splash lifts, and 79 changes the
permission flow.

- **Finding 79:** a bell tap on a prayer saved Off never opens the alert sheet when Settings cannot be opened, and
  the permission is read as Settings opens rather than on return.
- **Finding 80:** during Ramadan, an exception in `sync()` on a warm launch leaves the splash over the error
  screen; a traced worse case could keep it there on every launch in that window.
- **Finding 81 (Android):** switching a prayer Off when the OS refuses one cancel loses that prayer's other alarms and
  every reminder for up to 12 hours.
- **Finding 82 (Android):** one refused cancel releases the scheduling lock early, so a later commit can leave an Off
  prayer armed until the next refresh.
- **Two choices:** whether `yarn validate` should run coverage so the new thresholds bind every commit, and whether to
  add a React renderer so component markup can be tested.

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
