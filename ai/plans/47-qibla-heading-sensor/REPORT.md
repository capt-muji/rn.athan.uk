# Session 47 report: what was measured, decided and built

## The headline

The owner asked for the dial to be rasterised to PNG. **Measurement refused that approach and found a
different cause**, so what shipped is a sensor change, not a rendering change. The reasoning is in
section 2 and is the most important thing in this report.

## 1. What the owner reported

On the Galaxy S23, 2026-10-01: the compass "is not 60 FPS, is really, really slow. Very, very
jittery. I'm holding my phone still, moving it about and it's not moving smooth like iPhone." Same
place, same orientation, same build, and the iPhone XS is a much older phone.

Two further defects came in the same message and both are fixed: a permission prompt on every open,
and a duplicate app icon on the S23.

## 2. The measurement that changed the plan

Taken on the S23 (SM-S911B, Android 16) with `dumpsys gfxinfo`, before any change:

| Reading | Value | What it means |
| --- | --- | --- |
| Frames drawn in 15s on the compass | **2** | The whole defect |
| GPU per frame | 3 ms | Drawing is cheap |
| CPU draw, 50th percentile | 8 ms of a 16.7 ms budget | Drawing is not late |
| Frames during the sheet open | 44 in 12s, p95 34 ms | Open is heavier than steady state |

**Two frames in fifteen seconds is a frame-REQUEST problem, not a frame-COST problem.** A PNG changes
how each frame is drawn. It cannot change how often the screen is asked to draw, and at 8 ms of a
16.7 ms budget there is nothing to win: even a free draw leaves 2 frames.

Two further facts make the PNG case weaker still:

- The dial is already `memo()` plus a Reanimated transform (`QiblaCompass.tsx:83, 199`), recorded once
  and moved by a matrix. **That is the same cost model a PNG has.**
- Session 37 measured this same vector dial on the SD820, the weakest phone in the fleet, at a
  **16.7 ms median frame gap, one vsync, 89% of gaps at 60fps**.

**PNG is deferred rather than refused.** It targets the sheet-open cost, a separate and smaller
defect, and is re-decided in step 5 of `PLAN.md` once the new frame numbers exist.

## 3. The cause, read from source rather than inferred

`node_modules/expo-location/android/src/main/java/expo/modules/location/LocationModule.kt`:

- **Line 656** gates every heading update: `DEGREE_DELTA = 0.0355` radians (about 2 degrees) and
  `TIME_DELTA = 50f` ms. A turn smaller than 2 degrees emits nothing, so a slow smooth turn arrives
  as discrete jumps. That is the jitter, exactly as described.
- **Lines 634 to 643** register `TYPE_MAGNETIC_FIELD` and `TYPE_ACCELEROMETER` at
  `SENSOR_DELAY_NORMAL`. **No gyroscope.**
- The S23 has `TYPE_ROTATION_VECTOR` (handle `0x6f`, QTI), the gyro-fused sensor a maps app uses, and
  `dumpsys sensorservice` reports `9-axis fusion disabled (0 clients)`: nothing is using it.

iOS is smooth because Core Location's `trueHeading` is gyro-fused and ungated. **Same drawing code,
different sensor.**

## 4. What was built

`SensorType.ROTATION` through Reanimated's `useAnimatedSensor`, which is Android's
`TYPE_ROTATION_VECTOR`. No new dependency: Reanimated already drives this screen.

| File | What it does |
| --- | --- |
| `shared/qiblaHeading.ts` | Yaw to bearing, the declination term, the wrap. Pure |
| `device/qiblaSensor.ts` | The sensor reader and `readDeclination` |
| `components/sheets/screens/QiblaHeadingSource.tsx` | Arms the sensor while mounted |
| `hooks/useQibla.ts` | Consumes it; the gated watch is gone |
| `device/qibla.ts` | Permission fix; `watchHeading` deleted |

Two traps were verified in native source before being designed around, both recorded in `ai/AGENTS.md`
from earlier sessions:

- `ReanimatedSensor.m:148` resolves the default `Auto` reference frame to
  `XArbitraryCorrectedZVertical`, whose yaw zero is wherever the phone woke up. **A compass on the
  default points at nothing**, so `XTrueNorthZVertical` is passed explicitly.
- `ReanimatedSensorListener.kt:46-52` emits yaw from `getOrientation`, which is **magnetic** north,
  while iOS `XTrueNorthZVertical` is already true north. **The declination is therefore Android only**,
  and applying it on both would be a second bug. It is read as the platform's own difference between
  its two reported headings, never from a constant of ours.

## 5. State at handoff

**Tests: 185 suites, 4959 passing. Global coverage 99.83%, so `yarn validate` is RED on its 100%
threshold.** Two gaps, both documented with their causes in `NEXT-SESSION.md`:

| File | Coverage | Why |
| --- | --- | --- |
| `QiblaHeadingSource.tsx` | 0% | `jest.components.setup.js:96` mocks Reanimated globally and its `useAnimatedReaction` is a no-op a per-file mock cannot override. Five approaches failed |
| `useQibla.ts` | 97% | The `NO_HEADING` branch. **May now be dead code**: decide before testing it |

**Nothing is committed, and nothing has run on a phone.** `uat-2` is at `24d1db55`; the S23 holds
1.29.192 and the iPhone 1.29.191, neither carrying this work.

## 6. The two smaller fixes, with their causes

- **The permission prompt on every open.** `requestQiblaPermission` called
  `requestForegroundPermissionsAsync` unconditionally. It now reads `getForegroundPermissionsAsync`
  first, returns early when granted, and does not prompt when `canAskAgain` is false. 16 tests, 100%.
- **The duplicate app icon.** `adb install -r` without `--user 0` installs into Samsung's `DUAL_APP`
  profile (user 95) as well, which is why deleting one icon took both. My error, not a device fault
  and not an MCP gap. The clone was removed and `--user 0` is now the rule on this device.

## 7. What I would tell the next session in one line

**Put it on the phone and count frames before writing another test**, because if the sensor change
does not deliver smoothness the coverage work is spent on code that is about to be rewritten.
