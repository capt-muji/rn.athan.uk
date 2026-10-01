# 47. The heading comes from the gyro-fused sensor, so the compass turns smoothly

## 1. Why

The owner, on the Galaxy S23, 2026-10-01: the compass "is not 60 FPS, is really, really slow.
Very, very jittery. I'm holding my phone still, moving it about and it's not moving smooth like
iPhone." Same place, same orientation, same build. The iPhone XS, a much older phone, is smooth.

He proposed rasterising the dial to PNG, the way the Ramadan decorations were done. **Measurement
says the drawing is not the bottleneck, so a PNG would change nothing**, and that is why this plan
exists instead.

### What was measured on the S23 (SM-S911B, Android 16), before any change

| Reading | Value | Meaning |
| --- | --- | --- |
| Frames drawn, 15s on the compass, phone still | **2** | The whole defect |
| GPU time per frame | 3 ms | Drawing is cheap |
| CPU draw, 50th percentile | 8 ms of a 16.7 ms budget | Drawing is not late |
| Frames during the sheet open | 44 in 12s, p95 34 ms | Open is heavier than steady state |

Two frames in fifteen seconds is not a dropped-frame problem. It is a **frame-request** problem: the
screen redraws only when a heading arrives, and almost none arrived.

### The cause, read from `expo-location`'s own source

`node_modules/expo-location/android/src/main/java/expo/modules/location/LocationModule.kt`:

- **Line 656** gates every update: `abs(orientation[0] - mLastAzimuth) > DEGREE_DELTA && now - mLastUpdate > TIME_DELTA`, with `DEGREE_DELTA = 0.0355` radians (about 2 degrees) and `TIME_DELTA = 50f` ms (lines 1094 to 1095). A turn smaller than 2 degrees emits **nothing**, so a slow smooth turn arrives as discrete 2-degree jumps. That is the jitter, exactly as described.
- **Lines 634 to 643** register `TYPE_MAGNETIC_FIELD` and `TYPE_ACCELEROMETER` at `SENSOR_DELAY_NORMAL`. No gyroscope. This is the wobbly-compass pair session 37's audit already identified.
- The S23 **has** `TYPE_ROTATION_VECTOR` (handle `0x6f`, QTI), the gyro-fused sensor Maps uses, and `dumpsys sensorservice` reports `9-axis fusion disabled (0 clients)`: nothing on the device is using it.

iOS is smooth because Core Location's `trueHeading` is gyro-fused and ungated. Same drawing code,
different sensor quality. **The platform difference is the sensor, not the renderer.**

### Why PNG is rejected for THIS defect

The dial is already `memo()` plus a Reanimated transform on the layer above it
(`QiblaCompass.tsx:83, 199`): recorded once, then moved by a matrix. A PNG has the identical cost
model, record once and transform a layer. Session 37 measured this same vector dial on the SD820
(OnePlus 3T, the weakest phone in the fleet) at a **16.7 ms median frame gap, exactly one vsync,
89% of gaps at 60fps**. Rasterising would cost 3 to 4 images across 3 densities and 2 palettes,
re-exported on every design change, blurry above their export size, and would still leave the dial
stepping in 2-degree jumps.

**PNG is not dismissed permanently.** It targets the sheet-open cost (the 34 ms p95 frame), which is
a different, smaller defect. It is reconsidered in step 5 with fresh numbers, not before.

## 2. What ships

One new device reader that uses Reanimated's `useAnimatedSensor` instead of
`Location.watchHeadingAsync`, feeding the heading onto the UI thread ungated.

### Decisions taken, each with its evidence

| Decision | Why, measured |
| --- | --- |
| `SensorType.ROTATION`, not a raw magnetometer | `ReanimatedSensorType.kt:12` maps it to `Sensor.TYPE_ROTATION_VECTOR`, the gyro-fused sensor. Session 40 measured 148 samples against `expo-location`'s 2 over 40 seconds on the same hardware |
| `iosReferenceFrame: XTrueNorthZVertical`, passed EXPLICITLY | `ReanimatedSensor.m:148` resolves the default `Auto` to `XArbitraryCorrectedZVertical`, whose yaw zero is wherever the phone woke up. A compass on the default points at nothing |
| Declination applied on **Android only** | `ReanimatedSensorListener.kt:46-52` emits yaw from `getOrientation`, which is MAGNETIC north. iOS `XTrueNorthZVertical` is already true-north, so applying it twice is a second bug. The alignment window is 1.5 degrees and London's declination is up to 1 degree, so this is not negligible |
| No new dependency | `react-native-reanimated@4.7.0` is already installed and already drives this screen |
| `expo-location` stays | It still serves the one-shot position and the permission. Only the heading watch moves |
| The sensor arms on sheet open only | Performance Design Rule 7. Every sheet mounts at launch, so a sensor armed at mount runs for the life of the process |

### The invariant that must not break

**The heading is never corrected by an invented constant.** Session 40 shipped a reading 90 degrees
out by tuning an axis constant by eye, and the owner's rule is absolute: the app never shows a
direction it knows to be wrong. The only permitted adjustment is the platform's own declination,
read from the position already held, on the platform that does not apply it itself.

## 3. Steps

| # | Step | Done when |
| --- | --- | --- |
| 1 | `shared/qiblaHeading.ts`: pure yaw-to-bearing conversion, including the Android declination term and the interface-orientation offset | Unit tested at 100%, including both platforms and the wrap at 360 |
| 2 | `device/qiblaSensor.ts`: the `useAnimatedSensor` reader, explicit reference frame, returning a shared value | tsc 0, Biome 0 |
| 3 | `hooks/useQibla.ts`: consume the new reader, delete the `watchHeading` path, keep the grace window and the haptic unchanged | Full suite green, 100% on all four measures |
| 4 | Device proof on the S23 AND the 3T: `dumpsys gfxinfo` frame counts before and after, phone turning | Frames per 15s rises from 2 into the hundreds; p50 frame time stays under 16.7 ms |
| 5 | Audit: dead code, comment density, and a fresh PNG decision from the step 4 numbers | `find-unused-exports.py` clean, no `watchHeading` remnants |

## 4. How it is proven

- **The frame count is the acceptance criterion**, not a feeling: `dumpsys gfxinfo <pkg> reset`, fifteen seconds of turning, then read `Total frames rendered`. Before is 2.
- **Both phones**, because the 3T is the floor device and the S23 is where the defect was reported.
- **A break test per guard**, since a guard that has never failed proves nothing.
- **The haptic must still fire once per crossing.** The alignment maths is untouched, and its tests must stay green without modification: if they need changing, the step is wrong.

## 5. Risks

| Risk | Handling |
| --- | --- |
| `useAnimatedSensor` reports `isAvailable: false` on a device with no gyroscope | Fall back to the existing `expo-location` watch rather than showing nothing. The 3T is the device to check |
| The declination term is wrong in sign | Verified against a known bearing on the S23 before step 3 is called done. London's qibla is 118.9 degrees |
| A sensor armed and never released | `unregister` in the same cleanup path as the existing watch, with the existing late-resolve guard |
| Reanimated's yaw convention differs from the heading convention | `ReanimatedSensorListener.kt:50` emits `-orientation[0]`; the conversion is tested against known angles rather than assumed |
