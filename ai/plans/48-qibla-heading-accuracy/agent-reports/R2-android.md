# R2: the Android heading, with this session's corrections

Commissioned 2026-10-02 and checked against this repository. The strongest of the three reports; it
contributes the row's most useful forward finding. **Its headline claim about Reanimated is REFUTED three
separate ways**, recorded because it was plausible, well-sourced and arithmetically argued.

## CORRECTION 1: the mirrored-yaw theory is REFUTED, and its own arithmetic disproves it

The report claimed `ReanimatedSensorListener.kt:51` emits `yaw = -orientation[0]` (true, verified), so using
it as a heading mirrors the compass and gives `error = 2 x heading`, "exactly" session 47's 5 and 34.

Three independent refutations:

1. **Session 47's own code negated it back.** `git show d144d777:shared/qiblaHeading.ts`,
   `headingFromYaw` returns `normaliseBearing(-yaw * DEGREES_PER_RADIAN + ...)`. Two negations, one bearing.
2. **That sign was a hardware measurement, not a convention**: turning the phone clockwise drove the
   uncorrected heading DOWN, 273 to 147, carried as the suite's only hardware-derived regression test.
3. **The arithmetic predicts the wrong number.** A mirror about north at the London qibla (118.99) reads
   241.01, a **122.02-degree** error (237.98 by its own formula), against the 5 and 34 actually measured.
   The report's examples need the phone 2.5 and 17 degrees from NORTH; the owner points it at the QIBLA.

**Durable lesson:** two free parameters fit two points. A mechanism is confirmed only when it also predicts
the condition under which the measurement was taken.

## CORRECTION 2: no per-process calibration reset exists (R2 is right against R1)

AOSP: the HAL is single-client and "there is no mechanism to send data down from the applications to the
sensors or their drivers": there is no per-process calibration state to reset. R2 then supplies the correct adjacent
mechanism: the framework powers the sensor DOWN when the last client unregisters, and `stopHeadingWatch()`
unregisters, so closing the sheet genuinely deactivates the magnetometer. Whether a vendor's estimator
persists across that deactivation is UNVERIFIED and vendor-specific. This matters because a cold warm-up is
what the settling gate addresses.

## What the report got right, and the plan uses

- **THE FORWARD ANSWER: Google Maps uses the Fused Orientation Provider, stated by Google** (Android
  Developers Blog, 7 March 2024): "This is the same heading that is shown in Google Maps, which uses the FOP
  as well." Its documented jobs are this row's defect list: synchronise sensors on different clocks,
  compensate hard-iron, fuse accelerometer/gyro/magnetometer, compensate gyro drift, produce a realistic
  heading-accuracy estimate. And its reason for existing is the S23-versus-Find-X8 contradiction: "an API in
  Google Play services means that there is no implementation variance across different manufacturers."
  Android 5+ with Play services; needs `play-services-location:21.2.0+` (**blocker: `expo-location`
  pins 21.0.1** (`expo-location/android/build.gradle:19`); no permissions; declination applied internally;
  accuracy via `getConservativeHeadingErrorDegrees()`; **no JS wrapper, needs a native module**.
- **The `onAccuracyChanged` defect** (`LocationModule.kt:1108-1110`): no sensor-type check, last writer wins,
  accelerometers essentially always report `ACCURACY_HIGH`, so the accuracy this app receives on Android is
  usually the ACCELEROMETER's. **Explains session 40's band 3 while 71 degrees wrong.** Edge-triggered in
  AOSP, so a sensor at accuracy 0 fires nothing and `mAccuracy` stays 0 indistinguishably; the per-sample
  truth is on `SensorEvent.accuracy`, never read.
- **`event.values` by reference: confirmed present, REFUTED as a cause.** The `SensorEvent` pool is per
  sensor-handle (`android-9.0.0_r35`, so it holds on the 3T) and delivery is serialized on one Looper: the
  arrays can never alias. Correctness debt safe by accident; the line of enquiry is dropped, closing session
  40's open item.
- **The 2-degree gate freezes a MID-MOTION sample (the report's primary suspect).** `mLastAzimuth` advances
  only on emit; once still, nothing further is emitted, so the on-screen heading is frozen at the last sample
  emitted while the phone was being lowered, when `mGravity` is gravity PLUS linear acceleration. At ~5 Hz
  which set-down sample is last is essentially random per run, predicting the complete symptom set. This
  session sharpened it from the other side: at 0.5 degrees of jitter only 0.1% of readings survive the gate
  (`MEASURED.md` 5), which is why the settling window must be SPANNED.
- **`remapCoordinateSystem` correctly absent for a FLAT phone** (gimbal lock only when upright); corrects a
  session-40 worry; not the owner's bug, he tests flat.
- **`TYPE_MAGNETIC_FIELD` is already calibrated** per the AOSP HAL spec: this repo's "raw magnetometer"
  wording since session 37 was imprecise; the weakness is no gyroscope and no filtering. Watching
  `TYPE_MAGNETIC_FIELD_UNCALIBRATED`'s three bias values across open-and-close cycles would directly observe
  recalibration landing mid-session.
- **The declination wrap bug** (`:691`, `(magNorth + geofield.declination) % 360`): Kotlin's `%` keeps the
  sign, so a negative declination near north returns a NEGATIVE heading, colliding with this app's
  `NO_HEADING = -1` (`shared/qiblaAlignment.ts:20`). Narrow but real.
- **The physics check, independently rated**: "sound, nearly free, but a rejecter not a validator"; it cannot
  catch soft-iron scale, bad axis convention or sign error, and "would NOT have caught the Reanimated
  90-degree bug". `LocationModule.kt:648` already computes an `inclinationMatrix` and throws it away.
- **Ranked causes:** 1) the 2-degree gate freezing a mid-motion sample (HIGH, explains per-run variance
  completely); 2) hard-iron re-convergence after power-down; 3) warm-up; 4) local field (no per-run variance);
  5) declination wrap; 6) `mGeofield` never populated; 7) by-reference arrays REFUTED, do not test.
