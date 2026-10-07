# Audit: Session 53 (the gate, the wave, nothing unvouched drawn)

The row is DONE: the owner tested the iPhone XS, the OnePlus 3T and the Samsung S23 on 2026-10-07, accepted all
three and locked both platforms. This is the audit `AUDITOR-BRIEF.md` section 2, item 2 describes. **Verdict:
PASS**, `uat-2` pushed to `origin` at the close, nothing after the owner's acceptance changing what the compass
does. Step 2's audit was this file at `1d5441ab`.

## What was checked

| Check | Evidence |
| --- | --- |
| The range holds only these steps and their records | `git log --oneline origin/uat-2..uat-2`: the six commits step 2's audit covered, then 1.29.252 to 1.29.256 and their merges |
| Each step changes what its step file lists | `git show --stat` of `1bf2d8fc`, `e1d3feba`, `8361161a`, `7b45fda0` and the review-fix commit that follows it |
| Step 3 does not change what the compass decides | An independent reviewer built the gate's truth table, eight rows, old and new identical, and proved the deleted reset in `stop()` cannot be observed |
| Step 4's design was attacked before its code was finished | A second reviewer, against `1bf2d8fc`. Three blockers, all fixed: `steps/4-android-fused-wave.md`, part 13 |
| Step 4 left the iPhone alone | A third reviewer compared what an iPhone executes at `1bf2d8fc` and at `e1d3feba` in fourteen rows: it cannot behave differently |
| Step 5 leaves nothing that draws on time alone | A fourth reviewer walked twelve paths to a drawn compass at `7b45fda0`. `grep -n "CEILING" hooks/useQibla.ts shared/qibla*.ts` prints nothing |
| Every review's findings were acted on or recorded | `LOG.md`, the code-review passages in the step 3, 4 and 5 sections, and `steps/4-android-fused-wave.md`, section 7 (13) |
| The tests still guard | The step break scripts: 10 of 10 at step 3, 91 of 91 at step 4, 50 of 50 at step 5. Each ended `ALL AS EXPECTED: 1`, each run on a green suite |
| The whole suite | `yarn validate`: `Test Suites: 188 passed, 188 total`, `Tests: 5198 passed, 5198 total`, 100% on all four measures |
| The hook ran on every commit | Each commit's own output ends with the suite count and four `100%` lines. No `--no-verify` (the one-time grant for 1.29.247/248 aside) |
| The module binding is inside the measure | `jest.config.js` collects `modules/**/*.{ts,tsx}`, and the coverage gate no longer excuses `modules/`. It stood at 0% |
| Nothing deleted was reachable, nothing added is unreachable | `python3 scripts/find-unused-exports.py` reports its five standing entries |
| The owner's rules | No prayer time touched, no release file, no `uat`, no EAS, no ignore comment, no second sensor reader. ONE visual change, his own, word for word: the two lines of step 5 |
| The Kotlin compiles | `> Task :qiblaheading:compileReleaseKotlin`, `BUILD SUCCESSFUL`, on every Android build of the night |
| The phones carry what is in git | OnePlus 3T: `versionName=1.29.256`, the installed file's `md5` equal to the built one. iPhone XS: `devicectl` reports 1.29.256 |
| One reader, on the phone | `dumpsys sensorservice` with the sheet open, at 1.29.253 and again at 1.29.255: Google Play services holds the four sensors and the app's own uid holds none |
| Step 4's ceiling, and step 5's lack of one, on the phone | At 1.29.253 the log line `{ waved: false, turns: 0, waitedMs: 10012 }`. At 1.29.255 the hint still up at 30 seconds, no compass, no report, no log line |
| The wave, by the owner's hand | At 1.29.253 on the 3T: `{ waved: true, turns: 8, waitedMs: 1599 }`, and 🐋 "It's very, very smooth" |

## The close

| Check | Evidence |
| --- | --- |
| The owner accepted it | 🐋 "On the iOS, it works. Perfectly... iPhone is locked in place. Android, let's also lock it in place. It's about 98% accurate... it's within the 30 degree radius. So that's marked as successful." (`LOG.md`, the last section) |
| The fixes of 1.29.256 were reviewed, which no reviewer had seen | A fifth independent reviewer, read-only, `7b45fda0` to `47596764`. **Pass, no blocker, no regression for a phone without the fused sensor.** Each of the five fixes was walked and found correct in every visit that opens once |
| No compass code changed after his acceptance | `git diff 47596764 HEAD -- hooks components device shared modules` prints nothing |
| The clean-up changed no result | Twenty lines of unused test scaffolding left `jest.components.setup.js`. `yarn validate` after it: 188 suites, 5198 tests, 100% |
| The Samsung S23 carries what is in git | `versionName=1.29.256`, the installed file's `md5` equal to the built one |

## What is NOT known

1. **Whether the owner's room, which read 18 to 20, can pass on the iPhone.** He reported the iPhone perfect and
   did not say where he stood.
2. **Whether he saw the two lines of text on a phone.** Their place is arithmetic and a unit test.
3. **1.29.256 by this session's own check.** The still-phone check was made on 1.29.255. His three phones ran 1.29.256.

## Findings

1. **The session overwrote two existing files for four minutes** (`shared/qiblaWave.ts` and its suite), because
   its own plan called them new and it did not look. `tsc` caught it, git restored them byte for byte, and nothing
   was committed in between. `LOG.md` records the rule.
2. **One run of a break script was worthless**, made against a suite with a failing test, and is recorded as such.
3. **The session wrote an unmeasured figure into `LOG.md`** ("61 lines and 14 tests"), committed it in `7b45fda0`,
   and removed it in the next commit. Nothing rested on it.
4. **Eight costs of step 5 are written down for the owner** (`steps/5-vouched-or-nothing.md`, part 12). He accepted
   the first five when he ruled. The last three were found by the review afterwards and wait on him.
5. **Two leaks older than this session remain on every phone that reads `expo-location`** (`steps/4-android-fused-wave.md`,
   part 12.3). Step 5 closed the half that could draw and tap behind a closed sheet. The watch itself can still be
   stranded with the magnetometer armed.
6. **`stop()` in `hooks/useQibla.ts` still carries a comment that names the owner**, which `ai/AGENTS.md` section
   15 excludes. Recorded at step 2 and left again, with the same in four other qibla files that predate this row.
7. **Two defects the last review found are NOT fixed, because the owner had locked both platforms before it
   reported.** Both need a second `start()` with no `stop()` between, which the sheet library does not produce on
   its own. `awaitNorth()` ends the old wait and discards whether the report had gone up, so `lost` can stay true
   in state: on a phone without the fused sensor the report can then return the instant a drawn compass loses its
   heading, without its five seconds, and on a fused phone a report can outlast the sensor's first sample. The
   reviewer's fix is one line in `awaitNorth`: `if (endLostWait()) setState((previous) => ({ ...previous, lost:
   false }));`. It waits on the owner unlocking the hook.
8. **Three findings of step 5's review are closed by the lock, unbuilt** (`steps/5-vouched-or-nothing.md`, part 12,
   items 6 to 8).

## What this audit did not do

- **It did not touch the Find X8.** It was not attached again and still holds the 1.29.249 mock.
- **It did not wave a phone or open the qibla on the iPhone.** Those were the owner's tests.
