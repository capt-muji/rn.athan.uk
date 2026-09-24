# Audit: Session 15d. Android widgets size themselves from the granted width

| Field | Value |
| --- | --- |
| Audited | 2026-09-24 |
| Range | `7b38e5a6..2706c40d`, 8 commits, versions 1.27.340 to 1.27.343 |
| Worktree | `~/athan-device-sweep/worktrees/audit-15d`, detached at `uat-2`, removed after the verdict |
| Verdict | **PASS** |

## What was checked

| # | Check | Evidence |
| --- | --- | --- |
| 1 | The range holds only this session's commits | `git log --oneline origin/uat-2..uat-2`: 4 version commits and their 4 merges, nothing else. Versions 1.27.340, .341, .342, .343, in sequence, each merged `--no-ff` |
| 2 | The whole suite passes at 100% | `yarn validate` in the worktree: exit 0, `Tests: 2 skipped, 4629 passed, 4631 total`, and 100% on statements (4195/4195), branches (1876/1876), functions (852/852) and lines (3786/3786) |
| 3 | Every break still fails its tests | `scripts/breaks-step1.sh`, run from the worktree root: `caught 10 of 10`, `ALL AS EXPECTED: 1` |
| 4 | The tests genuinely guard, not just pass | Red check: `git checkout 7b38e5a6 -- widgets/PrayerWidget.tsx` in the worktree fails 8 of the 41 renderer tests, exactly the 8 this session added or changed. Restored afterwards |
| 5 | Contracts match the plan | All eight constants present with the plan's values: `REFERENCE_INNER_WIDTH` 347, `REFERENCE_HERO_WIDTH` 170, `REFERENCE_NAME_WIDTH` 82, `REFERENCE_TIME_WIDTH` 54, `ROW_TEXT_MIN_SIZE` 10, `ANDROID_MEDIUM_MIN_WIDTH` 310, `CARD_PAD_START` 13, `CARD_PAD_END` 20. `LIST_WIDTH` is the remainder; `rowTextSize` is clamped both ways |
| 6 | The cross-language contract holds | Kotlin `GRANTED_WIDTH_KEY = "grantedWidthDp"` matches `grantedWidthDp?: number` in `shared/widgetTypes.ts`, byte for byte. One `commit()` in the file, so the tick still writes once |
| 7 | No visual change | The only diff line in `PrayerWidget.tsx` matching a colour, weight or radius pattern is the padding literal becoming the constants that already carried its values: `APad(13, 13, 20, ...)` to `APad(CARD_PAD_START, 13, CARD_PAD_END, ...)`, which is 13 and 20 either way |
| 8 | iOS is untouched | `MEDIUM_LIST_WIDTH` 146, `ROW_HEIGHT` 23 and both SwiftUI `font({ size: ROW_TEXT_SIZE })` calls unchanged |
| 9 | No forbidden path | Nothing under `releases.json`, `eas.json`, `.env` or any key file appears in `git diff --name-only` for the range |
| 10 | Device evidence backs the records | Builds `BUILD-MOCK OK` and `BUILD-PROD OK` in `~/athan-device-sweep/session15d/`, with six screenshots. Every number in the findings text traces to a reading in `LOG.md` |
| 11 | The phones were left as the plan says | `auto_time` 1 on both, both on 1.27.342, the X8's 480 override restored (`Physical 560, Override 480`), `mobile_data` 0 |

## Findings

**1. The break script hardcodes the main checkout path.** `scripts/breaks-step1.sh` line 3 is
`cd /Users/muji/repos/rn.athan.uk`, so running it from an audit worktree silently tests the main checkout instead of
the code under audit. `AUDITOR-BRIEF.md` section 3, item 3 anticipates exactly this: it says to run the script only
after `grep -n /Users/muji/repos/rn.athan.uk <script>` prints nothing. Here it prints line 3.

The audit worked around it by parameterising the line (`cd "${REPO_ROOT:-.}"`) and running with `REPO_ROOT` set to
the worktree, which is how the `10 of 10` above was obtained. Fixed at source below, so the next auditor needs no
workaround.

**2. The plan's step 2 was folded into step 1, correctly and for a real reason.** Recorded rather than charged as a
defect: the plan claimed the layout could read `grantedWidthDp` "through an optional access that type-checks before
the field exists", which `tsc` rejects (`TS2339`). The executor found it, folded the field into step 1, and amended
the plan's section 6 to record the correction. The evidence is the type error itself, which cannot be argued with.

**3. Step 3 ships without a break script, and that is right.** No Jest project compiles Kotlin, so every substitution
would report `NOT CAUGHT` regardless of correctness. A script that cannot fail is false evidence. Its proof is the
device run, which is `LOG.md`'s readings.

**4. The 3T could not exercise the medium.** Every widget the owner has placed on a visible 3T page is a small kind,
which is hero-only and has no list to clip. The plan assumed the 3T would prove the medium alongside the X8. It did
not, and the session says so plainly instead of implying coverage it does not have. The X8 carries the proof, which
is the right phone for it: it is the one that showed the bug. The 3T still shows no regression, with the small kinds
rendering and the refresh chain firing and re-arming on the minute.

**5. The plan named the wrong build script, and the plan was corrected.** Section 7 originally specified a mock
build, which installs under `com.mugtaba.athan.fleettest`, whose providers are never placed and therefore never
measured by the launcher. The proof would have been impossible. Found by running it, corrected in the plan, and the
production widget build used instead.

## Fixes applied by this audit

**Finding 1.** `scripts/breaks-step1.sh` now starts `cd "${REPO_ROOT:-/Users/muji/repos/rn.athan.uk}"`, so it
defaults to the main checkout exactly as before and an auditor can point it at a worktree with one variable. The
`grep` the brief prescribes now finds the path only inside that default, which is its purpose.

## Two risks recorded, deliberately not fixed

Both were found by review during execution and are written here so they are not lost.

**The guard checks the grant, not the inner width.** A grant below 33dp would still drive the columns negative,
because the padding is subtracted after the guard. Unreachable while the provider declares a 310dp floor, which is
the narrowest a launcher may offer. A guard for an unreachable state cannot be covered by a test, and this repository
holds 100% coverage, so guarding it would mean an uncoverable branch.

**The props write is a read-modify-write.** The tick reads the stored props, parses, then commits, so a JS push
landing between those points is overwritten by the tick writing back the stale snapshot with fresh stamps. This is
pre-existing, from the `size` stamp of session 15b; this session adds a field to the same block without widening the
window. The Android snapshot carries a multi-day window, so a lost push usually renders identically. Worth a future
session if it is ever observed.

## Verdict

**PASS.** The session does what the plan asked, the tests guard it, the breaks catch every decision, the suite is
green at 100%, the owner's rules hold, and the fix is proven on the phone that showed the bug, at both its densities
including the narrowest configuration it can produce.
