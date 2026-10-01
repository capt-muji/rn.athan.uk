# R1: the heading-source survey, with this session's corrections

A research report commissioned by the planning session on 2026-10-02, then CHECKED against this repository's
own history before any of it was allowed into the plan. Two of its three headline claims hold and are
valuable. **The biggest one is REFUTED for this repository**, and the refutation is recorded here in full
because it is exactly the kind of plausible, well-sourced, wrong conclusion that would have cost a session.

---

## CORRECTION 1: the `iosReferenceFrame` headline is REFUTED

**What the report claimed.** That Reanimated defaults `iosReferenceFrame` to `Auto`, that
`ReanimatedSensor.m` resolves `Auto` to `XArbitraryCorrectedZVertical`, whose yaw zero is "wherever the phone
happened to be pointing when the sensor started", and therefore that session 47's orientation-varying error
"wasn't a sensor defect, it was a different arbitrary origin per run", so "the fix was a one-line config
change, not a revert."

**Every fact in that chain is correct, and the conclusion is still wrong, because session 47 already passed
the frame explicitly.** Verified in this repository:

| Evidence | What it shows |
| --- | --- |
| `git show d144d777` line 1295 | `iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical` was passed to `useAnimatedSensor` |
| `git show d144d777` lines 1163-1164 | A test asserted it: `expect.objectContaining({ iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical })` |
| `git show d144d777` line 1144 | A comment recorded WHY declination is not added on iOS: the frame has already applied it |
| `git show 40ae9d58` | The revert REMOVED those lines, which is why the current tree does not contain them |

So the shipped gyro-fused build was never on an arbitrary yaw origin. It was on `XTrueNorthZVertical`, with a
test pinning it, and it was **still** 34 degrees wrong on the owner's balcony while 5 degrees wrong on his
desk. Session 40 had already found the same trap on the default and written it into `ai/AGENTS.md`, so this
repository knew it two sessions before the report raised it.

**What this costs the plan.** The report's recommended first experiment, "set `XTrueNorthZVertical` and
re-measure, one line, and it tests the single most consequential claim in the brief", is a NO-OP: that line
was there, under test, when the measurement that rejected the sensor was taken. The experiment cannot be run
because it has already been run.

**The durable lesson, and it is the reason this file exists.** A report reading only `node_modules` and the
brief will reconstruct a defect the repository already fixed, because the brief records the CONCLUSION ("the
fused sensor is inaccurate") without the configuration that produced it. Check a research claim against
`git show` of the commit it is about, not against the summary of that commit.

## CORRECTION 2: "the error is NOT the room" is contradicted by this project's own measurement

**What the report claimed.** That because the owner holds position and orientation fixed while shaking
between runs, "that isolates the error to the device-carried, per-process hard-iron estimate, not the room",
and that "if the room's steel dominated, the same spot would give the same wrong answer every time."

**The reasoning is sound and the premise is false here.** Session 41 measured the error DRIFTING at a fixed
spot across a few hours, with a prediction written down before the measurement: lowering a correction
constant by 10 degrees should swing the dial 10 degrees clockwise, and it swung 30, leaving 20 degrees
unexplained at one spot (`ai/AGENTS.md`, 2026-09-30). So a fixed spot does NOT give the same wrong answer
every time in this house, and the report's diagnostic cannot separate the two causes here.

**What survives.** The report's physics is still the best account available of WHY a per-process estimate
varies, and its AOSP citation is the load-bearing one: the uncalibrated magnetometer spec says soft-iron is
corrected at the factory while hard-iron is re-estimated continuously and its bias values "are expected to
jump as soon as the estimate of the hard-iron changes." That is a vendor statement that a fresh process
re-rolls the estimate, which is what the plan's settling gate is built for.

## CORRECTION 3: `expo-sensors` is not installed

The report ranks `expo-sensors` `DeviceMotion` second. It is not in `package.json`, so adopting it is a new
dependency rather than a configuration change, and the nested-`@expo/ui` trap fires on any `yarn add` in this
repository (`ai/AGENTS.md`). Its own note that SDK 58 sits on npm's `next` tag rather than `latest` is
correct and was verified: `expo-location`'s `latest` is 57.0.20 while this project pins 58.0.9 from `next`.

---

## WHAT THE REPORT GOT RIGHT, and the plan uses

### 1. Android has no gyroscope in its heading, confirmed independently

The report read `LocationModule.kt:634-643` registering only `TYPE_MAGNETIC_FIELD` and `TYPE_ACCELEROMETER`,
feeding `getRotationMatrix` at line 649 with no filtering and no gyroscope. This session read the same path
independently and agrees (`FINDINGS.md` section 1). Its added detail is worth keeping: `onSensorChanged`
calls `sendUpdate()` on every event from either sensor with **no timestamp alignment** between the two
arrays, at `SENSOR_DELAY_NORMAL` of about 200ms, so the matrix is built from whichever samples arrived last.

### 2. Both platforms publish a degree-valued accuracy that `expo-location` discards

| Platform | The honest signal | What the app receives |
| --- | --- | --- |
| iOS | `CLHeading.headingAccuracy`, a `CLLocationDirection` double in degrees | Bucketed to 0 to 3 at the 50/35/20 boundaries (`ios/LocationUtils.swift:9-20`) |
| Android | `TYPE_ROTATION_VECTOR.values[4]`, radians, **CDD-mandated** so that "the heading error must be less than the estimated accuracy 95% of the time" | Never read. `expo-location` sends `onAccuracyChanged`'s 0 to 3 sensor-status enum instead |

**The sharpest point in the whole report** is that these two 0-to-3 scales are not the same quantity: iOS's is
a binned heading error in degrees, Android's is a sensor-health enum that is not an error at all. Anything
treating them as one scale compares unlike things. This repository has already been burned by trusting the
Android band, which read HIGH while 71 degrees wrong (`ai/AGENTS.md`, session 40).

### 3. The calibration alert is never shown, confirmed independently

The report found `DeviceHeadingStreamer.swift` implements only `didUpdateHeading` and `didFailWithError`, so
`locationManagerShouldDisplayHeadingCalibration` is absent and Apple's documented default of "no alert"
applies. This session read the same file and the same Apple documentation independently and agrees
(`FINDINGS.md` section 1). It is the one lever in reach that attacks a stable bias.

### 4. A variance gate is strictly worse than the platform's estimate, for the reason this session measured

The report: "a variance-of-last-N test detects noise, not bias. A confidently-wrong, perfectly-steady 30
degree error, which is exactly the owner's failure mode, has near-zero variance and would pass. Low variance
does not imply low error."

That is this session's own measured result arrived at from theory (`MEASURED.md` sections 1 and 3): the
spread gate passed a converging stream at 27.22 degrees of error, and a stable bias passes every stream gate
at 1.0x improvement. **Two independent routes to the same conclusion**, which is why the plan's gate measures
DRIFT rather than spread and why it is honest that the bias half is unfixable.

### 5. A `trueHeading` precondition worth checking, flagged UNVERIFIED by the report and still unverified

Apple requires location updates to be running concurrently for `trueHeading` to be valid, and
`DeviceHeadingStreamer` calls only `startUpdatingHeading()`. This app reads its position with
`getLastKnownPositionAsync` and a one-shot `getCurrentPositionAsync` (`device/qibla.ts:33-38`), and runs **no
continuous position watch at all**. If `trueHeading` needs one, every reading this app has ever taken on iOS
may have had an invalid true-north term, which would show as a declination-sized error: about 0.9 degrees in
London, which is too small to be the owner's 5 to 30, but about 15 degrees near Seattle.

**This is the cheapest unexplained thing left and the plan's step 1 measures it**, because it is a candidate
for the XS's residual that costs one log line to test.

### 6. No competitor has solved this, including Google

| App | What it does about heading uncertainty |
| --- | --- |
| **Google Qibla Finder** | Documents its haversine bearing in detail, then: "Qibla Finder works with your device's compass. To make sure that the direction is as accurate as possible, we recommend calibrating your compass before using." No accuracy display, no uncertainty, no settling |
| Muslim Pro | Shows an "Unknown accuracy" state, but its help centre attributes it to LOCATION rather than magnetics |
| Mawaqit, Pray Watch | Ship help articles titled, in effect, "the Qibla compass is pointing in the wrong direction", prescribing figure-of-eight, force-restart, or going to the ground floor |
| AR qibla apps | AR changes the rendering; ARKit/ARCore yaw origin is arbitrary unless geographic alignment is on, which is itself magnetometer-derived |
| Miqat | Uses 360-degree street imagery: a human-recognisable visual reference instead of a sensor. The one genuinely different idea in the field |

So the owner's dissatisfaction is not a sign this app is behind. **Every app surveyed has this problem and
most do not admit it**, and showing the uncertainty honestly would put this app ahead of Google's own.

### 7. Nothing magnetometer-free is available indoors

The report could establish no magnetometer-free absolute heading for a React Native app indoors. AR does not
escape it, GNSS course-over-ground needs sustained outdoor walking, and dual-antenna GNSS and UWB are not
reachable. The honest set is a magnetometer with its uncertainty shown, or a user-anchored relative heading
tracked by gyroscope, where `XArbitraryCorrectedZVertical`'s arbitrary origin becomes an advantage because
the user supplies the reference.
