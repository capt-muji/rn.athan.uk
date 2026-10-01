# Audit: Session 45. The qibla as an Islamic compass

| Field | Value |
| --- | --- |
| Audited | 2026-10-01 |
| Range | `39ba5665..uat-2`, which is `1.29.180` through `1.29.183` |
| Worktree | `~/athan-device-sweep/worktrees/audit-45`, removed at the end |
| Verdict | **PASS**, after three records corrections made in this session |

## What was checked, and what proves it

| Check | Command or file | Result |
| --- | --- | --- |
| The range holds only this session's work | `git log --oneline 39ba5665..uat-2` | 4 commits and 4 merges, every one this row's |
| Versions run in sequence | `git log --format=%s \| grep -oE '1\.29\.[0-9]+'` | 180, 181, 182, 183, one each, no gaps or repeats |
| The whole suite, from a clean worktree | `npx jest --coverage` in `audit-45` | **182 suites, 4884 passed, 2 skipped, 100% on all four measures** |
| Types and lint | `npx tsc --noEmit`, `npx biome check . --error-on-warnings` | both exit 0 |
| The tests still guard the code | `bash breaks.sh` from the worktree root | **29 of 29 caught, `ALL AS EXPECTED: 1`** |
| No dead code | `python3 scripts/find-unused-exports.py` | only the 5 pre-existing allow-listed entries |
| The owner's rules | diff over the whole range | no `uat`, no EAS, no release file, no API key, no ignore comment, no OpenCode file, no prayer-time change |
| Nothing out of scope changed | `git diff --name-only 39ba5665..uat-2` | 33 files, every one this feature's or its records |

The 2 skips are `audioMatrix.test.ts`'s prebuild-gated assertions, which no scratch worktree can run. The main
checkout runs them.

## The code, read rather than counted

Every export carries the name and signature the plan gives. `device/qibla.ts` is still the only file importing
`expo-location`, it asks for foreground location alone, and it adds nothing to `trueHeading`. The hook arms no
sensor until `start`, and `stop` calls the unwatch function. Every colour, size and radius comes from
`shared/constants.ts`; none was invented. Every comment explains WHY.

**Two probes were run that no test covers, because an audit should attack what the suite assumes.**

1. **The heading through north, 2000 samples each way.** `unwrapHeading` produced **zero** jumps over 180 degrees
   and a maximum single step of 0.70 degrees in both directions, so the face can never spin the long way round.
2. **The bearing at the places that break naive spherical code**: both poles, standing AT the Kaaba, its exact
   antipode, both sides of the antimeridian, Tromso and McMurdo. **All eight finite and inside 0 to 360.** Standing
   at the Kaaba answers 0 rather than `NaN`, which is the degenerate case a division would have failed.

## Findings, all fixed in this session

**Work is never handed back to the executor, so each was repaired here.**

1. **The suite totals in the records were stale.** They said 4883 tests; the tree has 4884, because the What's New
   item added one after the figure was written. Corrected in `AUDIT-FINDINGS.md`, `LOG.md` and `ai/plans/README.md`
   to "4884 passed and 2 skipped". A records number that disagrees with the tree is exactly what an audit is for.
2. **Row 45 still presented decision 2.1.2 (iOS only) as if it stood.** The row states further on that the owner
   reversed it, but a reader meeting "(2) iOS ONLY" first would take it as current. Marked VOID at the point it is
   stated.
3. **Row 45 said "step 4 removes them" of the `pmtiles` and `mvt` asset extensions.** Step 4 never ran as a separate
   step; they were removed in `1.29.182`. Corrected to say so.

## What the execution session got right, and it is worth recording

**It found a defect in its own prototype using the suite it was asked to write.** Drawing the dial on POSITION
alone, which was added to work around the simulator, left a lost heading frozen at its last angle: the app would
have pointed confidently in a stale direction, which is the one thing this feature must never do. The test
asserted the correct behaviour, failed, and the screen was fixed rather than the test. That is the whole reason
the owner asked for 100% coverage.

**It rewrote a break that survived rather than accepting it.** `activeRef.current = true;` plus `void 0` changes
nothing, so it printed SURVIVED against a hook that genuinely works. The honest break removes `onPresent` from the
screen, and it is caught. A break that cannot fail proves nothing, and accepting one would have left a false 29 of
29.

**It proved the drawing against the approved design rather than assuming the port matched.** The design is a Node
generator and the app is TypeScript, which is exactly where a locked design silently drifts: all 10 primitive
comparisons are identical and the generator still reproduces its own renders byte for byte.

## What is NOT proven, and is named rather than implied

- **Android.** The compass ships on both platforms and no `Platform` gate exists, but the heading has never been
  measured on Android hardware and session 40 measured `expo-location`'s Android heading at 71 degrees wrong.
  Queued as row 46 at the owner's instruction, because he has no Android phone to hand.
- **60 fps.** Deferred by the owner for this row (🐋  "Don't worry about the 60 FPS for now"), and
  `frame-audit.sh` is `adb`-only so it could not measure an iPhone in any case. The architecture is the one
  session 37 proved: the dial is memoised, the heading writes to a shared value, and only a transform animates.
- **The simulator can never prove any of it.** CoreLocation reports `updatingHeading` transitioning `old:0, new:0`
  there, because a simulator has no magnetometer.

## Verdict

**PASS.** The feature matches the plan as replanned, the owner accepted it on his own phone, the suite is honest at
100% with 29 of 29 breaks caught, and the three records defects found here are fixed. Row 45 is DONE.
