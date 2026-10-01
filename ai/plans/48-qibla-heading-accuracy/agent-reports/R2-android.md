# R2: the Android heading, with this session's corrections

A research report commissioned on 2026-10-02 and CHECKED against this repository before any of it entered
the plan. It is the strongest of the three reports and it contributes the row's single most useful forward
finding. **Its headline claim about Reanimated is REFUTED three separate ways**, and that refutation is
recorded in full because it is a plausible, well-sourced, arithmetically-argued conclusion that would have
sent the next session chasing a defect that does not exist.

---

## CORRECTION 1: the mirrored-yaw theory is REFUTED, and its own arithmetic disproves it

**What the report claimed.** That `ReanimatedSensorListener.kt` emits `yaw = -orientation[0]`, that using
that as a heading mirrors the compass about north, giving `error = 2 x heading`, and that this fits session
47's two measurements exactly: "At 2.5 degrees from north that is 5 degrees; at 17 degrees from north that
is 34 degrees, the owner's two measurements, exactly." It called this "the actual arithmetic cause" and
recommended one cheap confirmation before writing the sensor off.

**The negation is real.** Verified at `node_modules/react-native-reanimated/android/.../ReanimatedSensorListener.kt:51`,
which emits `-orientation[0]` as yaw. That much of the report is correct source reading.

**The conclusion is still wrong, for three independent reasons.**

**(1) Session 47's own code negated it back.** `git show d144d777:shared/qiblaHeading.ts` carries:

```ts
export const headingFromYaw = (yaw: number, declination = 0, interfaceOrientation = 0): number => {
  'worklet';
  return normaliseBearing(-yaw * DEGREES_PER_RADIAN + declination + interfaceOrientation);
};
```

The `-yaw` cancels Reanimated's `-orientation[0]` exactly. Two negations, one bearing.

**(2) That sign was taken from a hardware measurement, not from the conventions.** The function's own
doc comment records it: "Measured on an S23 rather than argued from the sign conventions: turning the phone
clockwise drove the uncorrected heading DOWN, 273 to 147, where a compass must climb." Session 47's `LOG.md`
carries the five raw samples as the suite's only hardware-derived regression test. So the sign was the one
term in that file established by probe rather than derivation, precisely because reasoning about it had
already produced a contradiction.

**(3) The arithmetic predicts the wrong number, by the report's own formula.** A mirror about north applied
to a phone pointing at the London qibla gives:

| Quantity | Value |
| --- | --- |
| True London qibla | 118.99 |
| What a mirrored heading would read | 241.01 |
| **Error a mirror predicts** | **122.02 degrees** |
| By the report's own `2 x heading` | 237.98 degrees |
| **What session 47 actually measured** | **5 degrees flat, 34 degrees on a balcony** |

The report's examples require the phone to be 2.5 and 17 degrees from NORTH. The owner points the phone at
the QIBLA, 118.99 degrees from north, where a mirror costs 122 degrees. The theory cannot produce a
5-degree error at that heading under any circumstances.

**The durable lesson.** The report's method was right: find a mechanism whose arithmetic reproduces the
measurements, rather than guessing. It failed because it fitted the mechanism to two error MAGNITUDES while
never checking the HEADING at which they were measured, and two free parameters will fit two points. **A
mechanism is only confirmed when it also predicts the condition under which the measurement was taken.**

## CORRECTION 2: "a per-process calibration reset is NOT the mechanism" conflicts with R1, and R2 is right

R1 concluded that per-process hard-iron re-estimation explains the owner's symptom. R2 refutes it from AOSP:
the HAL is single-client, the framework multiplexes above it, and "there is no mechanism to send data down
from the applications to the sensors or their drivers", so **there is no per-process calibration state to
reset.** A second app reading the magnetometer shares the same calibration.

**R2 wins on evidence**, and it then supplies the correct adjacent mechanism: the framework powers the
sensor DOWN when the last client unregisters, and `stopHeadingWatch()` calls `unregisterListener(this)`, so
closing the sheet genuinely deactivates the magnetometer. Whether a vendor's estimator persists its state
across that deactivation is **UNVERIFIED and vendor-specific**, which R2 states plainly.

The distinction matters because it changes what is fixable: process isolation would be beyond the app,
whereas a cold warm-up is exactly what this session's settling gate addresses (`MEASURED.md` section 6).

---

## WHAT THE REPORT GOT RIGHT, and the plan uses

### 1. THE FORWARD ANSWER: Google Maps uses the Fused Orientation Provider, stated by Google

The most valuable finding in all three reports, from the Android Developers Blog, 7 March 2024:

> "the FOP provides the device's heading and accuracy, which are derived from the orientation estimate.
> **This is the same heading that is shown in Google Maps, which uses the FOP as well.** We recently added
> changes to better cope with magnetic disturbances, to improve the reliability of the cone for Google Maps
> and FOP clients."

This answers the row's central question, "what does Maps do that we do not", with a vendor statement rather
than an inference. FOP's documented tasks are the exact list of defects this row is chasing:

> - Synchronize sensors running on different clocks and delays;
> - Compensate for the hard iron offset (magnetometer bias);
> - Fuse accelerometer, gyroscope, and magnetometer measurements;
> - Compensate for gyro drift (gyro bias) while moving;
> - Produce a realistic estimate of the compass heading accuracy.

And its stated reason for existing speaks directly to the S23-versus-Find-X8 contradiction that created this
row: "recommended sensor specifications are not tight enough to fully prevent orientation inaccuracies", and
"an API in Google Play services means that there is no implementation variance across different
manufacturers."

| Property | Value |
| --- | --- |
| Availability | Android 5+ with Play services, so the OnePlus 3T on API 28 is in scope |
| Dependency | `play-services-location:21.2.0` or above |
| **Blocker found** | `expo-location/android/build.gradle:19` pins `play-services-location:21.0.1`, below FOP's minimum |
| Permissions | **None required** |
| Declination | Applied internally when a fix is available |
| Accuracy | `getConservativeHeadingErrorDegrees()`, a per-sample half-angle error cone, 0 to 180 |
| Needs | Accelerometer, gyroscope AND magnetometer |
| Reachable from JS today | **No.** No npm or Expo wrapper found. Needs a native module |

### 2. The `onAccuracyChanged` defect, which explains a two-session-old anomaly

```kotlin
1108:  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
1109:    mAccuracy = accuracy
1110:  }
```

**No sensor-type check.** Both the accelerometer and the magnetometer call this and the last writer wins,
and accelerometers essentially always report `SENSOR_STATUS_ACCURACY_HIGH`. So the `accuracy` field this app
receives on Android is usually the ACCELEROMETER's.

**This explains session 40's unexplained anomaly**: a Find X8 reporting band 3 while 71 degrees wrong, and
band 0 while its field was correct at 47.3 uT. Both are what you see when the number is the wrong sensor's.
`ai/AGENTS.md` records that anomaly as a reason to distrust the band; this is the mechanism behind it.

The report adds that the callback is edge-triggered in AOSP, so a sensor genuinely at accuracy 0 fires no
callback at all and `mAccuracy` stays at its initialised `0`, indistinguishably. And that the per-sample
truth is on `SensorEvent.accuracy`, which `expo-location` never reads.

### 3. The by-reference array defect is CONFIRMED present and REFUTED as a cause

Session 40 flagged `mGravity = event.values` as storing by reference. The report confirms the code and the
documented violation, then refutes it as a bug on two AOSP grounds:

- **The pool is per-sensor-handle.** `SystemSensorManager.SensorEventQueue` keeps a
  `SparseArray<SensorEvent>` keyed by handle and allocates one `SensorEvent` per sensor, so the accelerometer's
  and magnetometer's `values` are two distinct permanently-allocated arrays that can never alias each other.
  Verified in the `android-9.0.0_r35` tree, so it holds on the 3T.
- **Delivery is serialized.** Both registrations pass the same listener with no `Handler`, so both land on the
  main Looper and `sendUpdate()` runs to completion before the next event.

**Verdict: correctness debt that is safe by accident, worth nothing as a bug hunt.** The report recommends
dropping the line of enquiry, and this plan does. That closes an item session 40 left open.

### 4. The 2-degree gate freezes a sample captured MID-MOTION: the report's primary suspect

The gate compares against the last EMITTED azimuth, and `mLastAzimuth` only advances on an emit. Once the
phone is still, noise stays under 2 degrees and **nothing further is ever emitted**, which is the measured
"2 samples in 40 seconds". So the heading on screen is frozen at the last sample emitted during motion,
taken while the phone was being lowered to the table, when `mGravity` is gravity PLUS linear acceleration
and `getRotationMatrix` treats the whole vector as down.

At `SENSOR_DELAY_NORMAL`, about 5 Hz, only a handful of samples exist during the set-down, and which one
happens to be last is essentially random per run. The report's claim is that this predicts the complete
symptom set: random 5 to 30 degree errors, varying per run, same spot, same final orientation, mostly right,
with sample starvation when still.

**This session's own measurements support it and sharpen it.** `MEASURED.md` section 5 measured the same gate
from the other side: at 0.5 degrees of jitter only **0.1%** of readings survive it. A stream that has
converged emits almost nothing, so the last emitted value is the newest thing the app has, however old and
however badly it was captured. **That is the mechanism the settling gate is built for**, and it is why the
gate must require the window to be SPANNED rather than merely filled.

Its test is free and is step 1 of the plan: lay the phone down, rotate it 20 degrees and back, and see
whether the heading snaps to a consistent value while moving and is inconsistent only when still.

### 5. `remapCoordinateSystem` is correctly absent for a FLAT phone, and wrong for an upright one

Honest and precise, and it corrects a worry from session 40. `getOrientation`'s azimuth is the compass
direction of the device's +y axis, which in portrait points out of the top edge. Phone flat, screen up: +y
lies in the horizontal plane, its projection is full length, `atan2(Hy, My)` is well-conditioned, and the
reading is exactly "where the top edge points". **Omitting the remap is correct, not merely differently
referenced**, and the app is portrait-locked so the screen-rotation flavour is a no-op too.

Held upright, +y points at the sky, the horizontal projection collapses, and the azimuth becomes unstable
then undefined. That is gimbal lock. So the heading is meaningful only near flat and degrades toward
vertical, which is a real usability defect for a compass users hold at every angle, but **it is not the
owner's bug, because he tests flat.** It is also an argument against hand-rolling: FOP and
`TYPE_ROTATION_VECTOR` both return a full quaternion from which a tilt-independent heading follows with no
case analysis.

### 6. `TYPE_MAGNETIC_FIELD` is already calibrated, which corrects this project's own wording

The AOSP HAL spec requires `TYPE_MAGNETIC_FIELD` to be temperature-compensated, soft-iron corrected and
hard-iron corrected. So describing `expo-location` as fusing "the RAW magnetometer", which this repository
has done since session 37, is imprecise: it fuses the CALIBRATED magnetometer. **Its weakness is the absence
of a gyroscope and of any filtering**, not raw input.

`TYPE_MAGNETIC_FIELD_UNCALIBRATED` exists for algorithms that distrust the platform's hard-iron estimate, and
its spec carries the sentence that matters most for diagnosing the owner's symptom: the bias values "are
expected to jump as soon as the estimate of the hard-iron changes." Watching those three values across
open-and-close cycles is a direct, cheap observation of whether recalibration is landing mid-session.

### 7. The physics check assessed independently, and it agrees with this session's rejection

The report rates the check "sound, nearly free, but a rejecter not a validator", and finds that
`LocationModule.kt:648` already computes an `inclinationMatrix` and **throws it away**, so the measured dip
is four lines of arithmetic from being available with no new sensor and no new permission.

Its honest limit matches this session's measurement from the other direction: the check cannot catch a
soft-iron scale error, a bad axis convention, a mis-handled attitude, or a sign error, because all of those
leave magnitude and dip perfectly plausible. It notes the check "would NOT have caught the Reanimated
90-degree bug". **This session's `MEASURED.md` section 4 goes further and bounds what it misses even within
its own domain: a 10 uT hard-iron offset swings the heading 30.8 degrees and passes both gates**, because a
compass uses only the horizontal field, 40% of the total at London.

Together: the check is a necessary-not-sufficient rejecter whose misses are large enough to matter at this
app's own latitude, which is why the plan does not build it.

### 8. The declination wrap bug, a genuine small find

```kotlin
690:    val geofield = mGeofield.takeIf { !isMissingForegroundPermissions() } ?: return -1f
691:    return (magNorth + geofield.declination) % 360
```

Kotlin's `%` keeps the sign, so a negative declination with a small `magNorth` returns a NEGATIVE heading:
2 degrees plus -3 gives -1. `calcMagNorth` normalises with `(x + 360) % 360` and `calcTrueNorth` does not.

**And it collides with this app's own sentinel.** `shared/qiblaAlignment.ts:20` defines `NO_HEADING = -1`,
so a true heading of exactly -1 degree would be read as "no heading at all". Narrow, bounded by the
declination, only near north, and not a 30-degree bug, but real and worth knowing this app is exposed to it.

### 9. The ranked candidate table

| Rank | Cause | Likelihood | Test cost | Explains per-run variance? |
| --- | --- | --- | --- | --- |
| 1 | The 2-degree gate freezing a mid-motion sample | **High** | Trivial, no code | **Yes, completely** |
| 2 | Hard-iron re-convergence after sensor power-down | Medium-high | Low | Yes |
| 3 | Warm-up and early-sample acceptance | Medium | Low | Yes |
| 4 | Local magnetic field in the house | Medium, for the baseline | Trivial | **No**, a static distortion is static |
| 5 | Negative heading from the declination wrap | Low | Trivial | No |
| 6 | `mGeofield` never populated, permanent -1 | Low | Trivial | No |
| 7 | By-reference arrays | **Refuted** | Do not test | No |
