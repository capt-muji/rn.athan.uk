# Audit: Session 53, steps 3 to 5 (the readout removed, Android on Google's sensor behind a wave, nothing unvouched drawn)

**Last step audited: step 5.** The row is PLANNING and stays PLANNING: the owner's tests of step 5 on both phones are
open. This is the audit `AUDITOR-BRIEF.md` section 2, item 2 describes: commits on `uat-2` that `origin` does not
hold, from a plan still in flight. Step 2's audit is this file at `1d5441ab`.

**Verdict: PASS for what a machine can prove, OPEN for what only a hand can.** Nothing is pushed.

## What was checked

| Check | Evidence |
| --- | --- |
| The range holds only these steps and their records | `git log --oneline origin/uat-2..uat-2`: the six commits step 2's audit covered, then 1.29.252 to 1.29.256 and their merges |
| Each step changes what its step file lists | `git show --stat` of `1bf2d8fc`, `e1d3feba`, `8361161a`, `7b45fda0` and the review-fix commit that follows it |
| Step 3 does not change what the compass decides | An independent reviewer built the gate's truth table, eight rows, old and new identical, and proved the deleted reset in `stop()` cannot be observed |
| Step 4's design was attacked before its code was finished | A second reviewer, against `1bf2d8fc`. Three blockers, all fixed: `steps/4-android-fused-wave.md`, part 13 |
| Step 4 left the iPhone alone | A third reviewer compared what an iPhone executes at `1bf2d8fc` and at `e1d3feba` in fourteen rows: it cannot behave differently |
| Step 5 leaves nothing that draws on time alone | A fourth reviewer walked twelve paths to a drawn compass at `7b45fda0`. `grep -n "CEILING" hooks/useQibla.ts shared/qibla*.ts` prints nothing |
| Every review's findings were acted on or recorded | `LOG.md`, the three sections headed "the code review" and step 4's part 13 |
| The tests still guard | `breaks-2.sh` 10 of 10 at step 3. `breaks-3.sh` 91 of 91 at step 4. `breaks-4.sh` 50 of 50 at step 5. Each ended `ALL AS EXPECTED: 1`, each run on a green suite |
| The whole suite | `yarn validate`: `Test Suites: 188 passed, 188 total`, `Tests: 5198 passed, 5198 total`, 100% on all four measures |
| The hook ran on every commit | Each commit's own output ends with the suite count and four `100%` lines. No `--no-verify` |
| The module binding is inside the measure | `jest.config.js` collects `modules/**/*.{ts,tsx}`, and the coverage gate no longer excuses `modules/`. It stood at 0% |
| Nothing deleted was reachable, nothing added is unreachable | `python3 scripts/find-unused-exports.py` reports its five standing entries |
| The owner's rules | No prayer time touched, no release file, no `uat`, no EAS, no ignore comment, no second sensor reader. ONE visual change, his own, word for word: the two lines of step 5 |
| The Kotlin compiles | `> Task :qiblaheading:compileReleaseKotlin`, `BUILD SUCCESSFUL`, on every Android build of the night |
| The phones carry what is in git | OnePlus 3T: `versionName=1.29.256`, the installed file's `md5` equal to the built one. iPhone XS: `devicectl` reports 1.29.256 |
| One reader, on the phone | `dumpsys sensorservice` with the sheet open, at 1.29.253 and again at 1.29.255: Google Play services holds the four sensors and the app's own uid holds none |
| Step 4's ceiling, and step 5's lack of one, on the phone | At 1.29.253 the log line `{ waved: false, turns: 0, waitedMs: 10012 }`. At 1.29.255 the hint still up at 30 seconds, no compass, no report, no log line |
| The wave, by the owner's hand | At 1.29.253 on the 3T: `{ waved: true, turns: 8, waitedMs: 1599 }`, and 🐋 "It's very, very smooth" |

## What is NOT proven

1. **Step 5 by any hand.** No one has waved a phone at 1.29.255, and no one has opened the qibla on the iPhone.
2. **Whether the owner's room can pass at all.** It read 18 to 20 that night. With no ceiling it draws only if
   waving brings that under 15.
3. **The two lines on a real screen.** Their place is arithmetic and a unit test, not a photograph.
4. **The review fixes of step 5 on a phone.** 1.29.256 is installed on the 3T and the iPhone, and nothing has been
   run on it: the desk check was made on 1.29.255.

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
   15 excludes. Recorded at step 2 and left again.

## What this audit did not do

- **It did not push.**
- **It did not touch the Samsung S23 or the Find X8.** Neither was attached. The S23 still holds prototype C.
- **It did not wave a phone or open the qibla on the iPhone.**
