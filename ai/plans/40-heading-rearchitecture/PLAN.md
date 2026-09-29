# Session 40: the compass needle comes from the fused sensor, not `expo-location`

Planned 2026-09-29 from measurements taken on the owner's own devices, not from documentation.

## 1. The defect, measured

The owner aimed all three phones so the phone's TOP EDGE pointed at the qibla, then read the dial. On every
phone the Kaaba marker sat near 10 o'clock instead of 12.

Instrumented `watchHeading` on the Find X8 and captured what `expo-location` actually delivers:

```
QIBLAPROBE true=191.19 mag=189.86 acc=3
QIBLAPROBE true=188.73 mag=187.40 acc=3
```

| Quantity | Value |
| --- | --- |
| True heading (phone aimed at the qibla) | 118.9 deg |
| `expo-location` reported | ~190 deg |
| **Error** | **+71 deg** |
| Accuracy it claimed while doing so | **3, the highest band** |

The screenshot agrees exactly: the label under the fixed mark is between `S` (180) and `21` (210), and the
marker sits at `bearing - heading = 118.9 - 190 = 288.9 deg`, which is 9.6 o'clock, which is where the owner
sees it.

**The dial is correct. The bearing is correct. The heading VALUE is wrong.**

## 2. The fix, measured on the same phone at the same moment

`react-native-reanimated@4.7.0` is already installed and its `useAnimatedSensor(SensorType.ROTATION)` maps to
Android's `TYPE_ROTATION_VECTOR`, the gyroscope-fused sensor Google Maps uses
(`ReanimatedSensorType.kt`: `ROTATION_VECTOR(Sensor.TYPE_ROTATION_VECTOR)`, id 5).

Both paths probed together on the X8, phone stationary and aimed at the qibla:

| Path | Heading | Error | Samples in 40s |
| --- | --- | --- | --- |
| `expo-location` `watchHeadingAsync` (ships today) | 190.0 | **+71.1** | 2 |
| Reanimated fused `ROTATION_VECTOR` | 109.2 | **-9.7** | 148 |

The fused sensor is roughly eight times more accurate on the same device at the same instant, and it streams
continuously where `expo-location` emits twice and stops.

## 3. Why `expo-location` is this wrong

Read from `node_modules/expo-location/android/src/main/java/expo/modules/location/LocationModule.kt`:

1. **No gyroscope.** Line 649 builds the heading from `getRotationMatrix(rotationMatrix, inclinationMatrix,
   mGravity, mGeomagnetic)`, the raw accelerometer and raw magnetometer. The gyro is never opened.
2. **The `SensorEvent.values` array is stored by reference.** Lines 1101 and 1103 do `mGravity = event.values`
   and `mGeomagnetic = event.values`. Android reuses that array between callbacks, so the two fields can hold
   torn or mismatched data. Both are also declared `FloatArray(9)` where the sensors deliver 3 values.
3. **A 2-degree, 50 ms gate.** Line 656 suppresses any update smaller than `DEGREE_DELTA` (0.0355 rad), which
   is why a stationary phone produced 2 events while the fused sensor produced 148.
4. **The accuracy is stale.** `mAccuracy` is written only in `onAccuracyChanged`. The X8's magnetometer
   reported band 0 (UNRELIABLE) in `dumpsys` at the same moment `expo-location` told the app band 3.

Point 4 is why the screen said "Hold the phone flat for an accurate reading" while pointing 71 degrees wrong.
That is the silent confident error the research warned about, reproduced on the owner's desk.

## 4. What ships

**Step 1. The needle reads the fused sensor.**
`useAnimatedSensor(SensorType.ROTATION)` in `components/sheets/screens/Qibla.tsx`, converted to degrees
clockwise from north. Reanimated negates yaw for iOS parity, so the conversion is
`(((-yaw * 180 / PI) % 360) + 360) % 360`. The value lands in a shared value on the UI thread with no JS
crossing per sample, which suits the existing 60fps dial.

**Step 2. True north.**
The rotation vector is magnetic-referenced. `expo-location` stays for the position and supplies the
declination through a single `Location.getHeadingAsync()` style read, or the declination is computed once per
position from the same `GeomagneticField` data the bearing already needs. London's declination is +1.2
degrees, so this is a small correction, but it is not zero and it grows abroad.

**Step 3. Honest trust.**
The vendor accuracy band is not trustworthy on either phone (the X8 reported 3 while its magnetometer said 0,
then 0 while its field was correct). Trust is therefore derived from physics: total field magnitude against
the expected value, and dip angle against the expected inclination. When either is out of range the screen
says the needle cannot be trusted rather than drawing a confident wrong one.

**Step 4. iOS takes the same sensor, on the one reference frame that knows where north is.**
Found while implementing, by reading `ReanimatedSensor.m` lines 146 to 157: Reanimated's default
`iosReferenceFrame` is `Auto`, which resolves to `XArbitraryCorrectedZVertical` when a magnetometer exists and
`XArbitraryZVertical` when it does not. **Both are arbitrary: yaw zero lands wherever the phone happened to be
when the sensor started, so a compass built on the default points at nothing.** The screen passes
`IOSReferenceFrame.XTrueNorthZVertical` explicitly.

That frame is already true-north referenced, so the declination correction is Android-only. Applying it on
both would bend the iOS needle by twice the local declination.

## 5. What must not regress

- The bearing maths in `shared/qibla.ts` and its 13 invariants. Exact, untouched.
- The dial's 60fps architecture: one recorded layer rotated by a transform.
- The permission asked at the moment of use, on this screen only.
- No API keys, no external services.

## 6. Acceptance

The owner holds each phone with its top edge pointing at the qibla and the Kaaba marker sits under the fixed
mark at 12 o'clock, on the OnePlus 3T, the OPPO Find X8 and the iPhone XS.
