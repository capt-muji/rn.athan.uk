# Execution log: Session 48

## The plan's two steps are ONE commit, and the plan was wrong to split them

The session ran step 1 exactly as written: pre-flight `PREFLIGHT OK`, the carried test file copied, red
confirmed as `Cannot find module '../qiblaSettle'`, the carried module copied, 16 of 16 green, tsc 0,
Biome 0, and the break script `ALL AS EXPECTED: 1` at 10 of 10.

**Then the pre-commit hook refused the commit:**

```
FAIL unit shared/__tests__/unusedExports.test.ts
    - Expected  - 0
    + Received  + 2
    +   "hasSettled",
    +   "trailingWindow",
```

`shared/__tests__/unusedExports.test.ts` fails the moment a module exports a symbol that no production file
imports, and step 1 ships `shared/qiblaSettle.ts` with nothing importing it until step 2. Measured both
ways rather than assumed:

| State | `python3 scripts/find-unused-exports.py` |
| --- | --- |
| Step 1 alone | **7** unreachable: `hasSettled`, `trailingWindow`, plus the 5 pre-existing |
| Steps 1 and 2 together | **5** unreachable, the pre-existing entries only |

So no smaller cut leaves `uat-2` green, and the two steps were merged into one commit.

**This is a defect in the plan rather than in the execution, and it is the THIRD session running to meet
it.** Session 44 measured that its deletion could not be split because `unusedExports.test.ts` reports an
export the moment its last caller goes. Session 45 measured that its whole feature was one commit because
the same guard reports every new export as unreachable until a production file imports it. Both wrote it
into their records. This plan's section 6 split the work anyway, and its own section 4 never checked the
guard. The correction is recorded in `PLAN.md` section 6, with the combined commit message.

**Nothing was committed by the refused attempt**, so the tree was clean and the work continued on the same
branch rather than being restored.

## Step 1 (both step files, one commit)

| What | Value |
| --- | --- |
| Branch | `feat/48-1-settle-arithmetic` |
| Files | `shared/qiblaSettle.ts`, `shared/__tests__/qiblaSettle.test.ts`, `hooks/useQibla.ts`, `components/sheets/screens/__tests__/Qibla.test.tsx` |

### Red, as the plan predicted

| Suite | Before | Reason |
| --- | --- | --- |
| `shared/__tests__/qiblaSettle.test.ts` | 1 failed, 0 tests | `Cannot find module '../qiblaSettle'` |

### Green

| Command | Result |
| --- | --- |
| `npx jest shared/__tests__/qiblaSettle.test.ts device/__tests__/qibla.test.ts --selectProjects=unit` | `Tests: 32 passed, 32 total` |
| `npx jest components/sheets/screens/__tests__/Qibla.test.tsx --selectProjects=components` | `Tests: 50 passed, 50 total` |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check . --error-on-warnings` | exit 0, 377 files |
| `grep -c heldRef hooks/useQibla.ts` | 0 |
| `python3 scripts/find-unused-exports.py` | 5 pre-existing entries, none new |

### Breaks

| Script | Result |
| --- | --- |
| `scripts/breaks-step2.sh` (the arithmetic) | `caught 10 of 10`, `ALL AS EXPECTED: 1` |
| `$TMPDIR/breaks-48-2.sh` (the hook) | `caught 6 of 6`, `ALL AS EXPECTED: 1` |

### Commit and review

| What | Value |
| --- | --- |
| Commit | `1c947980`, version 1.29.201 |
| Hook's last `Tests:` line | `Tests: 4949 passed, 4949 total` across 184 suites |
| Coverage | `100% ( 4737/4737 )` statements, `100% ( 2077/2077 )` branches, `100% ( 983/983 )` functions, `100% ( 4250/4250 )` lines |
| Review | Clean on the first read, one round |
| Merge | `bce99f94` |

The review checked and confirmed, reading `git show 1c947980` back cold:

- `processReading` runs in the plan's order: `NO_HEADING` first, then the window append, then the
  `bearing === null` return, then `clearBlank`, then the gate, then the alignment work;
- **the gate sits ABOVE the haptic**, at line 112 against the haptic's 116, so a refused reading fires
  nothing. That is the owner's accessibility requirement;
- `samplesRef` is cleared in `stop` and in the `NO_HEADING` branch;
- `heldRef` is gone: `grep -c heldRef hooks/useQibla.ts` prints 0;
- `trailingWindow` is called exactly once per reading;
- all four carried files are byte-identical to the proven copies under `working-code/`;
- no `Platform` check in either changed file, and no change to `shared/qiblaAlignment.ts`,
  `shared/qiblaGeometry.ts`, `shared/qiblaCompass.ts`, `device/qibla.ts` or
  `components/sheets/screens/Qibla.tsx`.

### Done when

| Check | Result |
| --- | --- |
| `npx jest components/sheets/screens/__tests__/Qibla.test.tsx --selectProjects=components` | `Tests: 50 passed, 50 total` |
| `npx jest device/__tests__/qibla.test.ts shared/__tests__/qiblaSettle.test.ts --selectProjects=unit` | `Tests: 32 passed, 32 total` |
| `grep -c heldRef hooks/useQibla.ts` | 0 |
| `scripts/breaks-step2.sh` | `ALL AS EXPECTED: 1`, 10 of 10 |
| `$TMPDIR/breaks-48-2.sh` | `ALL AS EXPECTED: 1`, 6 of 6 |

## What the owner judges next, and what this does NOT fix

The compass now stays blank for about 3 seconds on opening, then draws. It refuses to draw at all while
the stream never converges, rather than drawing badly. The owner tests it the way he has been: open, shake,
close, reopen, lay both phones flat, and see whether the restarts now agree.

**It does not fix the residual error from iron in his house**, which is measured as unfixable by any gate
reading the heading stream (`MEASURED.md` sections 3 and 4), and it does not touch the heading SOURCE.
Row 49 carries the native module for `headingAccuracy` in real degrees, Apple's calibration prompt and
Android's Fused Orientation Provider.

## The owner's device verdict on 1.29.203, and the two defects it found

He installed 1.29.203 on both phones and reported: "once the compass has actually loaded, it is
extremely unresponsive... I have shaken the phone a thousand times and it doesn't move. And it just
loves to move by itself."

### Defect 1, MINE: the settling gate was re-tested on every reading

`hasSettled` gated EVERY reading rather than deciding once. A turning phone is a moving window, so
drift exceeded the threshold and the gate DROPPED the update: the compass advanced only while the
phone was held still, which is the inverse of a compass.

Fixed in 1.29.204 by latching: the gate decides once, and resets through `blank` when the heading is
genuinely lost rather than on each dropped reading, so a brief dropout does not re-arm it.

**The suite could not see this, and that is the lesson.** Its only assertion about a turning dial was
`toBeOnTheScreen`, which a dial frozen at its first reading passes. The dial reads the heading off a
shared value, so a turn costs no render and the rendered transform never changes; the new tests
re-render to publish the live value into the style, then assert the rotation.

### Defect 2, UPSTREAM: the stream was never fast enough for the latch to matter

Measured on the 3T with `dumpsys sensorservice`:

| | Period | Rate |
| --- | --- | --- |
| Hardware ceiling, magnetometer-bound | 19.2 ms | 52 Hz |
| What `expo-location` requested | 199.95 ms, zero jitter | **5.00 Hz** |
| The owner's bar | 100 ms | 10 Hz |

**10.4x of headroom discarded.** Reanimated, in the same process and uid, already pulled
`rotation_vector` at 16 ms, so only the compass was slow.

Its 2-degree emission gate is worse for this app specifically. Simulated against the measured arrival
pattern, a user creeping the last few degrees onto the line at 2 degrees a second is served **0.83
Hz**, and a stationary phone nothing at all. That is "it doesn't move, then it moves by itself". The
gate also floored the heading's own resolution at 2 degrees.

`patches/expo-location+58.0.9.patch` now carries three changes, each a documented platform constant or
the removal of a threshold:

| Platform | Change |
| --- | --- |
| Android | `SENSOR_DELAY_NORMAL` to `SENSOR_DELAY_GAME` on both registrations |
| Android | The 2-degree `DEGREE_DELTA` gate removed, the 50 ms rate limit kept. `DEGREE_DELTA` and the orphaned `kotlin.math.abs` import go with it |
| iOS | `headingFilter = kCLHeadingFilterNone`, which `expo-location` never set. CoreLocation fuses at about 50 Hz on the XS and its 1-degree default rejected 731 of 731 readings of a stationary phone |

The 2-degree constant was itself a magic number of the kind the owner bans, so removing it moves the
code toward that rule.

### PROVEN ON THE DEVICE, not inferred

The patch could have been a no-op: `ai/AGENTS.md` records that a patched Expo module is skipped when
its `expo-module.config.json` still declares a `publication` block, because autolinking then resolves
a prebuilt AAR. Verified that the existing patch already removes that block, then verified the
compiled bytecode in the shipped APK:

```
invoke-virtual {v1, v4}, SensorManager;.getDefaultSensor:(I)Landroid/hardware/Sensor;   // v4 = 2, magnetometer
const/4 v5, #int 1                                                                       // SENSOR_DELAY_GAME
invoke-virtual {v1, v0, v4, v5}, SensorManager;.registerListener:(...)Z
```

`SENSOR_DELAY_GAME` is 1 where `SENSOR_DELAY_NORMAL` is 3, on both registrations.

Then measured live with the qibla sheet open on 1.29.205:

```
0x00000001) active-count = 1; sampling_period(ms) = {20.0}, selected = 20.00 ms
0x00000003) active-count = 1; sampling_period(ms) = {20.0}, selected = 20.00 ms
```

**20.00 ms is 50 Hz, up from 200 ms and 5 Hz: a tenfold improvement, measured on the floor device.**
Confirmed again in the raw event timestamps, which are 20 ms apart. A first reading of `200000us`
came from a STALE dump entry belonging to the previous process, which is a trap worth recording:
`dumpsys sensorservice` lists historical registrations by pid, so a rate must be read from the live
`active-count` block or from a pid confirmed current.

### The calibration hint, shipped in 1.29.205 on the owner's request

🐋  "At least put a message there to tell the user to shake the phone... put like a figure-8 motion
for them to shake the phone with a path, like an 8 figure."

The waiting state now reads "Wave the phone in a figure eight to calibrate the compass." above a
looping figure of eight with a dot travelling it. Verified by screenshot on the 3T.

### State of the phones

| Phone | Build |
| --- | --- |
| OnePlus 3T | 1.29.205, production release, automatic time on |
| iPhone XS | 1.29.205, production release |

### Still open, and NOT claimed as fixed

The residual error from iron in the owner's house. Nothing here attacks it, and `MEASURED.md`
sections 3 and 4 measure it as invisible to any gate reading the heading stream. Row 49 carries the
native module.
