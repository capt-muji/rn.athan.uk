# Execution log: Session 24

## Planning, execution and audit ran in ONE session (owner instruction, 2026-09-25)

The owner asked for all three phases in the same session and, separately and repeatedly, for **no subagents at all**.
Both instructions override the `athan-next` skill's one-phase-per-subagent shape and `EXECUTOR-BRIEF.md` section 4,
item 8's `Code Reviewer` subagent. What that changed, recorded here because an audit reads this file:

- The plan was rewritten from a design brief into a TEMPLATE.md plan by this session, and then executed by it.
- **Step 1's review was done by this session against the plan's own eleven checks**, not by a `Code Reviewer`
  subagent. Its evidence is under "Step 1 review" below: every check was run as a command, and check 7 was proven
  mechanically with a statement-level diff rather than by reading.
- The rescope from four kinds to two came from the owner mid-planning, so the plan and the queue row were rewritten
  before any code was written.

## The plan was not executable when this session found it

Row 23 read READY, but `PLAN.md` was a design brief: no header table, no pre-flight, no step structure, no anchors, no
break script, no commit message, no review prompt, no acceptance criteria. An executor could not have run it without
deciding what to build, which is the defect `PLANNER-BRIEF.md` exists to prevent. So this session did the planning
phase first, at `273abe96`, and committed it as `2572df32` (1.28.12).

### Owner decisions taken while planning (all recorded in `ai/prompts/README.md`)

1. **Two kinds, not four.** One style per schedule: `ExtrasLockWidget4` is the one-column extras face,
   `PrayerLockWidget5` the two-column standard face.
2. **Row tiers:** active solid white and bold, passed at 60%, upcoming at 35%.
3. **Row sizes:** 11pt in the one-column face, 14pt in the two-column face.
4. **No `try`/`catch` in any lock layout**, including the three that already shipped one.
5. **No `accessoryInline` branch** on the new kinds.
6. **A day with no active row lists its rows and marks none.**

### What the scratch worktree taught, and what it changed in the plan

Spiked in `~/athan-device-sweep/worktrees/plan-24` (removed afterwards), and the code thrown away:

| Finding | Effect on the plan |
| --- | --- |
| The `activeIndex` `: -1` default went uncovered with numeric-only fixtures, landing branches at 99.89% against a 100% gate | The held-day test runs over both `-1` and `undefined`, and the acceptance criteria name the coverage lines |
| Removing the `catch` broke exactly three tests in `widgetLockRenderer.test.ts`, each reaching it through a throwing getter | Part 4 names all three by anchor |
| A JSX text array reads as `""` through a string-only helper, so the fallback assertion failed | The suite's `styledTexts` joins array children, specified in part 4 |
| Rewriting `app.json` with a JSON serialiser reflows the file until Biome rejects it | Part 5e says hand-edit in place |

Verified pre-flight at `273abe96`: all thirteen anchors counted 1, `PREFLIGHT OK`.

## Step 1: The two day-list Lock Screen faces

- **Branch:** `feat/24-lock-widget-day-list`
- **Commit:** `bd5610da`, version **1.28.13**
- **Merge:** `21560164`

**Red, before the change:** all 16 tests of the new suite failed with
`TypeError: layouts.ExtrasLockWidget4 is not a function`, which is the failure the plan predicted.

**Green:** `widgetLockListRenderer` 16 passed, `widgetLockRenderer` 28 passed, `widgetContract` 10 passed.
`npx tsc --noEmit` exited 0. `npx biome check . --error-on-warnings` initially failed on
`widgets/LockPrayerWidget.tsx` formatting, exactly as the plan's section 10 predicted: the dedent left three
`Out of date` elements fitting on one line. `npx biome check --write` on that file fixed it, then both exited 0.

**Hook, from the commit log:**

```
Statements   : 100% ( 4277/4277 )
Branches     : 100% ( 1924/1924 )
Functions    : 100% ( 866/866 )
Lines        : 100% ( 3868/3868 )
Tests:       4677 passed, 4677 total
```

**Break script:** `CAUGHT: 6 of 6`, then `ALL AS EXPECTED: 1`. Re-run after the merge: same.

### Step 1 review (by this session, no subagent, per the owner's instruction)

| Plan check | Evidence |
| --- | --- |
| 1. Self-contained, props alone, no module scope, no family read | Both signatures are `(props: PrayerWidgetProps)`; 0 occurrences of `environment` or `widgetFamily` in either body; `widgetContract.test.ts`'s AST guard passes, which is what proves the no-module-scope rule |
| 2. Every row a name and a time at one `ROW_SIZE`, time monospaced | 2 `const ROW_SIZE` declarations, 4 `font({ size: ROW_SIZE` uses (a name and a time per layout), 2 `monospacedDigit()` |
| 3. Active solid and bold, passed 60%, upcoming 35% | Pinned by "marks only the active row on %s"; breaks 1 and 2 both caught |
| 4. `-1` or absent lists and marks none | Pinned by the held-day test over both values; break 3 caught |
| 5. `Math.ceil`, first half left, tier from the whole day | `Math.ceil(rows.length / 2)` at line 650, `index={from + offset}` at line 687; break 4 caught |
| 6. No `timerInterval`, no `try`/`catch`, no date maths | 0 occurrences each of `timerInterval`, `catch`, `new Date`, `getTime`, `Date.parse` in the new bodies |
| 7. The existing three changed no rendered output | Proven mechanically, not by eye: a statement-level diff of the old file against the new one with the two new layouts excised, comments and brace-only lines stripped, reports 14 differences, all of them the `Spacer` import and three `Out of date` elements Biome joined onto one line. Zero behavioural statements differ |
| 8. Builder untouched | `shared/widgetTimeline.ts` and `shared/sequence.ts` are absent from the commit's file list |
| 9. Registered in all four places | 8 `createWidget` exports; 2 `app.json` entries, each `["accessoryRectangular"]` with `android: null`; 2 `updateTimeline` calls; 2 mock kinds |
| 10. Comments explain why, and carry no date or owner rule | No comment in the new code matches `20\d\d` or `owner` |
| 11. Nothing beyond the file list changed | `git show --stat` lists exactly the nine files the plan names |

**Verdict: merge.** One round.

**An independent check the plan did not ask for.** The `activeIndex: -1` state is the premise of two of the new tests,
so it was confirmed against the real builder rather than against my own fixture: the existing
`widgetTimeline.test.ts` test "keeps the list before after its Isha until 00:00, then holds a day with no readable row
until its own 00:00" passes and asserts `activeIndex: -1` beside a full six-row `prayers` array. The state the layouts
render is one the builder genuinely emits.

**Codegraph blast radius,** read before committing: each new layout has exactly one caller (its own `createWidget`),
and the lock kinds' dependants are five store suites. All five were run green before the commit
(`widgetPlatform`, `widgetAndroid`, `widgetIo`, `widgetSettingsSync`, `widgetFlagOff`: 31 passed).

## Deployment, 2026-09-25 21:26: both phones on 1.28.14

The owner reported still seeing the reverted session's extra-large HOME widgets in the iOS gallery. **They were right that
nothing had been deployed, and the cause was worse than a missing build.**

**Root cause: a gitignored native folder outlived the revert.** The 2026-09-25 attempt that built this as a `systemLarge`
home widget was reverted in git, and `app.json` came back clean. But that session had also run `expo prebuild`, which
generated `ios/ExpoWidgetsTarget/PrayerWidgetLarge.swift` and `ExtrasWidgetLarge.swift`. `/ios` is gitignored
(`.gitignore` line 13), so **`git revert` could not see those files and left them on disk**, and the XS was carrying a
build compiled from them, stamped **1.29.0**, a version that exists nowhere in git history. iOS keeps a placed widget
alive after its kind leaves the config, so the gallery kept offering the large ones. No amount of git history could have
fixed it: the large widgets existed only in the installed binary and in an ignored folder.

**DURABLE LESSON: reverting a widget change in git does not revert the prebuild it ran.** `git status` is blind to
`ios/` and `android/`, so a reverted native change survives on disk and in the installed app. After reverting anything
that touches `app.json`'s widget list, re-run the prebuild and check the generated kinds, or the next device build
carries the reverted work. The check is
`ls ios/ExpoWidgetsTarget/*.swift` against `app.json`'s widget names, and `grep -A1 CFBundleShortVersionString
ios/Athan/Info.plist` against `app.json`'s version: a version in the plist that git has never heard of is the tell.

| Step | Evidence |
| --- | --- |
| Diagnosis | XS reported `com.mugtaba.athan 1.29.0`; `uat-2` was at 1.28.14; `ios/ExpoWidgetsTarget/` held two `*Large.swift` files; `grep -c systemLarge app.json` was 0, so the source was already clean |
| iOS prebuild | `npx expo prebuild -p ios --no-install` exited 0. The expo-widgets plugin `rmSync`s its target directory, so both `*Large.swift` files are gone; 16 kinds are generated, including `ExtrasLockWidget4.swift` and `PrayerLockWidget5.swift`, each declaring `.supportedFamilies([.accessoryRectangular])`. `grep -rl systemLarge ios/` now prints nothing, and the plist reads 1.28.14 |
| iOS Release build | `DEVELOPMENT_TEAM=9V3WAU9Z54 npx eas-cli env:exec preview 'npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E'`, real API key. Install detected by polling the device, not the log, as the plan says: `xcrun devicectl device info apps` reports **1.28.14** (was 1.29.0). Evidence: `~/athan-device-sweep/session24/xs-installed-version.txt` |
| 3T build | `zsh ~/athan-device-sweep/session3/bin/build-prod.zsh uat-2 ...athan-1.28.14-prod.apk` ended `BUILD-PROD OK` in 519s from `05dd09b7` |
| 3T provider check BEFORE installing | Per `ai/AGENTS.md`, the APK's manifest was checked first: all 8 `*WidgetProvider` entries present. (A bare `grep -c PrayerWidgetProvider` returned 1 and looked alarming; the quoted-attribute grep showed all eight. The false negative is the grep, not the APK) |
| 3T install and launch | `adb install -r` printed `Success`; versionName 1.28.14; 12 widgets still placed across all 8 kinds; doubled `am start` per the ritual; app live as PID 22634 |
| 3T regression | No fatals and no ANR for the package in logcat. The `widgetrefresh` minute-edge alarm is armed and fired (`Triggering alarm #0 ... WidgetRefreshReceiver`), Glance sessions render, and the documented year-2036 `ACTION_FORCE_STOP_RESCHEDULE` alarm is present as every 3T dump shows. Session 24 is iOS-only, so the 3T is a regression check: it regressed nothing |

The 3T carries no lock-screen widgets by design (session 18 proved Android has no such API), so it shows nothing new
from this session, which is expected rather than a failure.

## Device proof: the owner's visual verdict is still outstanding

The build is now done and installed (above). What remains is the part no test and no agent can do: the owner's eyes on
three questions. **Touch automation is not available on a physical iPhone** (`ai/AGENTS.md`), and the owner receives no
screenshots, so placing the two faces and judging them is theirs:

1. whether the one-column extras face at 11pt is readable, or wants fewer rows;
2. whether a column of the split face holds `Last Third 02:41` without shrinking to nothing;
3. whether the three tiers (solid, 60%, 35%) separate on the glass in vibrant monochrome.

The gallery now offers `Extra Times (Layout 4)` and `Next Prayer (Layout 5)` under Lock Screen widgets, and the
extra-large home widgets are gone from it.

So the row is EXECUTED, not DONE, which is what the plan's section 9 says: "the row stays EXECUTED until they have
looked." The audit below does not push past that.

## REJECTED ON DEVICE, 2026-09-25 21:34, and reverted in full

The owner placed both faces on the XS, tested the standard and the extras schedules, and rejected them on sight:
🐋  "it looks absolutely horrible. There's no space, everything is squeezed in. I thought it was going to be a big
widget, but actually it's horrible and it's all squeezed in... those 2 we just need to go, completely wiped as if they
never existed before."

Reverted with `git revert --no-commit -m 1 21560164`. Every file is byte-identical to `bd5610da~1`, the new suite is
deleted, and `grep` finds no trace of `ExtrasLockWidget4` or `PrayerLockWidget5` in any source file or in `app.json`.
The revert also restores the three `try`/`catch` blocks in the existing lock layouts, because removing them shipped in
the same commit; that cleanup can return in a session of its own if the owner still wants it.

**The cause is geometry, not code, which is why no fix was attempted.** An `accessoryRectangular` face is about
160x72pt. The plan's own section 4 computed what that means and said so before anything was built: six rows in one
column is ~12pt per row, and the plan called it "tight" and recorded that the owner had already rejected 12pt elsewhere
as 🐋  "really really small". It shipped at 11pt to fit five extras rows. Two columns bought height at the cost of
width: ~78pt per column for a name and a time together. Both readings were correct and both are unusable, so the honest
conclusion is that the slot cannot hold a day list at all, and no tuning of sizes, spacing or split changes that.

**DURABLE LESSON: arithmetic that predicts a cramped layout is a reason to stop, not a number to tune.** The plan
measured the squeeze, wrote it down, called Layout 4 "tight", and then built it anyway because the comparison was the
point. The comparison cost a full plan, an execution, an audit and two device builds to learn what the measurement
already said. When a layout's own geometry says the content does not fit, the answer is to put the geometry to the owner
BEFORE building, not to ship two variants and let the device decide. Any future Lock Screen work states the pt budget
per element up front and gets the owner's ruling on the arithmetic first.

What survives from this session: the deployment fix and its lesson about a gitignored prebuild outliving a `git revert`
(above), which is unrelated to the day lists and stays on `uat-2`.
