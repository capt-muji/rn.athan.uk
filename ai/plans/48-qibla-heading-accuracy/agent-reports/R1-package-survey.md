# R1: the heading-source survey, with this session's corrections

Commissioned by the planning session 2026-10-02, then CHECKED against this repository's history before any of
it entered the plan. Two of its three headline claims hold; **the biggest is REFUTED**, and the refutation is
kept because it is exactly the kind of plausible, well-sourced, wrong conclusion that costs a session.

## CORRECTION 1: the `iosReferenceFrame` headline is REFUTED

The report claimed session 47's orientation-varying error came from a default arbitrary yaw origin
(`Auto` = `XArbitraryCorrectedZVertical`), fixable with a one-line config change. Every fact in its chain was
right and the conclusion still wrong: **session 47 already passed the frame explicitly.** `git show d144d777`
line 1295 carries `iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical` into `useAnimatedSensor`, lines
1163-1164 assert it in a test, and `git show 40ae9d58` shows the revert removing them. So the shipped
gyro-fused build was never on an arbitrary origin, and was still 34 degrees wrong outdoors, 5 degrees on the
desk. The report's proposed first experiment cannot be run because it has already been run.

**Durable lesson:** a report reading only `node_modules` and the brief reconstructs defects the repository
already fixed, because the brief records the CONCLUSION without the configuration that produced it. Check a
research claim against `git show` of the commit it is about.

## CORRECTION 2: "the error is NOT the room" is contradicted by this project's own measurement

The report argued a fixed spot gives the same wrong answer every time, isolating the cause to per-process
hard-iron re-estimation. Session 41 measured the error DRIFTING 20 degrees at a fixed spot across hours
(`ai/AGENTS.md`, 2026-09-30), so the report's diagnostic cannot separate the two causes here. What survives:
its AOSP citation, the uncalibrated-magnetometer spec saying hard-iron bias values "are expected to jump as
soon as the estimate of the hard-iron changes", a vendor statement that a fresh process re-rolls the estimate,
which is what the settling gate is built for.

## CORRECTION 3: `expo-sensors` is not installed

Its second-ranked option is a new dependency here, and the nested-`@expo/ui` trap fires on any `yarn add`.
(SDK 58 sitting on npm's `next` tag, not `latest`, verified correct.)

## What the report got right, and the plan uses

- **Android has no gyroscope in its heading, confirmed independently**: `LocationModule.kt:634-643` registers
  only `TYPE_MAGNETIC_FIELD` and `TYPE_ACCELEROMETER`; added detail: `onSensorChanged` sends on every event
  from either sensor with no timestamp alignment between the two arrays, at ~200 ms.
- **Both platforms publish a degree-valued accuracy that `expo-location` discards**, and the two 0-3 scales
  the app ends up with are DIFFERENT QUANTITIES: iOS's is a binned heading error in degrees
  (`LocationUtils.swift:9-20`); Android's is the sensor-status enum from `onAccuracyChanged`, not an error at
  all (the per-sample truth, `TYPE_ROTATION_VECTOR.values[4]` in radians, CDD-mandated, is never read). This
  repo was burned by trusting the Android band while 71 degrees wrong (session 40).
- **The calibration alert is never shown, confirmed independently** (only `didUpdateHeading` and
  `didFailWithError` implemented).
- **A variance gate is strictly worse than the platform's estimate**: "a confidently-wrong, perfectly-steady
  30 degree error... has near-zero variance and would pass. Low variance does not imply low error." Two
  independent routes to the same measured conclusion (27.22; bias 1.0x).
- **A `trueHeading` precondition, flagged UNVERIFIED**: Apple requires location updates running for
  `trueHeading` to be valid; `DeviceHeadingStreamer` never starts them, and this app runs no continuous
  position watch. Bounded later by R3 at ~1.2 degrees in London (see R3 section 6).
- **No competitor has solved this, including Google**: Google Qibla Finder documents its bearing then says
  says "we recommend calibrating your compass"; Muslim Pro attributes "Unknown accuracy" to LOCATION; most
  qibla apps ship help articles prescribing figure-of-eights; AR changes rendering, not the magnetometer
  problem; Miqat's 360-degree street imagery is the one genuinely different idea.
- **Nothing magnetometer-free is available indoors.** The honest set: a magnetometer with uncertainty shown,
  or a user-anchored relative heading tracked by gyroscope.
