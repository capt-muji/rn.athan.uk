# Execution log: Session 37

## Step 5: the dial

**Branch:** `step/37-5-dial` off `feat/37-qibla-compass`. **Version:** 1.29.107.

The compass face ships: 72 ticks at 5 degrees in three Garmin weights, 12 labels at 30 with the cardinals named
and the rest abbreviated to two digits, a needle to the Kaaba and a Kaaba marker on the rim, turning as ONE
recorded layer under a fixed mark at the top.

**The architecture the plan required, built as specified.** `Face` is memoised on its size and bearing alone, both
of which hold still while the needle moves, so react-native-svg records the tree once and the rotation is a
Reanimated transform on the layer above it. No `useAnimatedProps`, no per-frame JS, no attribute animation. The
derived value snaps on its first evaluation, so the face draws at the phone's real heading rather than spinning to
it from north on every open.

`components/qibla/dialGeometry.ts` is pure and carries the whole face: the unit project measures it with no
renderer, which is what let the bearing-to-point mapping, the tick hierarchy and the label abbreviation each get a
test that can fail.

**Two edits found in my own review and applied under section 4, item 8** (own code, no contract touched): the
tick's "is it labelled" test was computed twice from the same rule and is now computed once and passed down; and
`MAJOR_STEP` was doing two unrelated jobs, the 10-degree tick and the label's divide-by-ten, which are only equal
by coincidence. The break script's substitutions were re-pointed at the new text and re-run.

**Also fixed:** the branch tip failed `biome check` on two files from steps 2 to 4
(`components/sheets/screens/__tests__/Settings.test.tsx`, `device/__tests__/qibla.test.ts`), both import ordering.
The pre-commit hook runs `yarn validate`, so no commit was possible until they were formatted.

| Check | Result |
| --- | --- |
| Break script | **23 of 23 caught**, `ALL AS EXPECTED: 1` (step 2's 15, plus 8 for the dial) |
| `tsc --noEmit` | clean |
| `biome check . --error-on-warnings` | clean |
| Full suite | **182 suites, 4877 tests, 100% statements / branches / functions / lines** |
| Coverage, new files | `Dial.tsx` and `dialGeometry.ts` both 100% on all four measures |

## Step 5a: two defects the simulator found, which no test could have

**Branch:** `step/37-5a-dial-device-fixes`. **Version:** 1.29.108.

Both were invisible to a green suite and obvious the moment the dial was on a screen, which is the whole
argument for the device proof being a step rather than a formality.

**(1) Every label was rotated by its own bearing.** I had counter-rotated each one to keep it upright, reasoning
from a rotation that is never applied: the labels are placed by coordinate, and the only thing that turns is the
LAYER above them, which carries the letters with it for free. So the counter-rotation was not cancelling anything,
it was the only rotation there was. On screen `E` and `W` lay on their sides and the bottom half of the dial read
upside down.

**The research said this and I did not follow it:** "cardinal letters rotate with the dial", which iOS, Apple
Watch, Garmin and marine compasses all do, and which the whole-layer transform gives at no cost.

**(2) The fixed mark reached into the label ring and hid N.** `MARK_LENGTH` was 3x the rim inset, which put its
inner end past the labels at `LABEL_RADIUS`. North was behind the one element that is supposed to point at it.

**Both now have a test that fails without the fix**, and both are breaks 24 and 25. The label test asserts on the
`matrix` prop, because react-native-svg resolves ANY transform into a matrix: asserting on `rotate` printed
SURVIVED against a genuinely broken dial, which is the session's durable lesson. **A break script is not verified
until it is run**, and this one was wrong on its first draft for the same reason session 32's was.

| Check | Result |
| --- | --- |
| Break script | **25 of 25 caught**, `ALL AS EXPECTED: 1` |
| iPhone XS simulator, London | dial renders, 12 labels upright, needle at 119 degrees between E and S |

## Step 6: the device proof

### 6.1 iOS simulator: PASSED, at two positions

Run on the booted iPhone XS replica against the step-5a code, with the simulator's location set twice. **Two
positions rather than one, because a dial that draws a fixed picture passes a single-city check.**

| Position set | Readout | Where the needle points | Expected |
| --- | --- | --- | --- |
| London, 51.5074 / -0.1278 | `119° from north` | between E and S, nearer E | 119.0 degrees |
| Jakarta, -6.2088 / 106.8456 | `295° from north` | between W and 30, above the horizontal | 295.2 degrees |

Both agree with `RESEARCH.md`'s own published table. The face carries the Kaaba marker at the bearing and the
needle runs from the centre to it, so the two readings are the same fact drawn twice.

Also verified on screen: all 72 ticks in three weights, all 12 labels (`N 03 06 E 12 15 S 21 24 W 30 33`) upright
and legible, the fixed mark clear of N, and the honest line `Hold the phone flat for an accurate reading` beneath
the bearing.

### 6.2 The 3T: the build, and a trap worth recording

**DURABLE LESSON: two `build-mock.zsh` runs share one worktree and one log, so a second run started before the
first has died deletes the first's intermediates and both fail.** R8 reported
`NoSuchFileException: .../mergeReleaseJavaResource/base.jar`, which reads as a corrupt dependency and is nothing
of the kind: the file existed, and was removed underneath the running build by the other one. Two 15-to-21 minute
builds were lost to it. The rule is one build at a time, and confirm no `gradlew assembleRelease` is alive before
starting another, because killing the wrapper does not kill the daemon. **Run alone, the same build took 338s.**

### 6.3 The 3T: PASSED, on a real fix and a real magnetometer

Mock build 1.29.108 (`com.mugtaba.athan`, versionCode 1000000) installed over the existing one; the owner's alarms
were dumped first and not touched, and the clock was never changed.

| Step | What happened |
| --- | --- |
| Settings | The **Qibla** row renders beneath Change athan with the compass glyph, at (540, 977) |
| Tapping it | Android 9 raises ONE location dialog with no precision choice, exactly as `ANDROID-PERMISSIONS.md` predicted for API 28 |
| Allowing it | Play Services then asks separately to enable Location Accuracy |
| **Declining that** | The sheet reads **"Your location is not available right now"** and draws NO dial |
| Enabling it | The dial draws and reads **`119° from north`**, the true London bearing |

**The refusal path is the more valuable half of this proof.** It exercised break 23 and finding 2 from the earlier
audit on a real phone: with no fix obtainable the screen says so plainly rather than claiming to still be looking,
and no dial is drawn, because a dial with no bearing would point confidently at nothing.

**The face is ROTATED in the passing screenshot**, with N up and to the right rather than at the top, because the
magnetometer is live and the phone was not pointing north. That is the whole compass working end to end: real fix,
real sensor, real rotation, and the Kaaba marker still landing at the true bearing relative to the turned face.

### 6.4 The frame audit: 60fps on the floor device

`e2e/scripts/frame-audit.sh` could not run: line 42 assigns `status`, which is READ-ONLY in zsh, so the `sf` branch
aborts before measuring. Recorded as a harness defect; the measurement it performs was run directly instead.

Method: two `dumpsys SurfaceFlinger --latency` reads 12s apart on the open dial, differenced, so only frames drawn
in that window are counted. **127 frames, 97 gaps under 100ms.**

| Reading | Value |
| --- | --- |
| Median gap | **16.7ms, exactly one vsync** |
| Gaps at 60fps (<=17.5ms) | **86 of 97, 89%** |
| Gaps at 30 to 34ms | **ZERO** |
| Longest gap | 83.8ms |

**The 11 long gaps are not dropped frames, and the arithmetic proves it: every one is a whole multiple of the
16.67ms vsync, within 0.4ms** (50.2 = 3.01x, 66.8 = 4.01x, 83.5 = 5.01x). A frame dropped to JS work lands at an
arbitrary time; a vsync where nothing was submitted lands exactly on the grid. They are intervals where the
magnetometer sent no new heading, so there was nothing to redraw, which is Performance Design Rule 7 working rather
than failing.

**So the dial renders at a true 60fps whenever the needle moves, on the SD820.** The transform-only architecture is
what buys it: 84 elements recorded once, and a compositor matrix multiply per frame whose cost does not depend on
the path count at all. The owner's 60fps target is met on the phone that was expected to struggle.
