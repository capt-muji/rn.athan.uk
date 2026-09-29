# R4: Fusion and filtering, the maths on top of the sensor

Session 40, research agent R4. Scope: everything between "a raw fused sample arrives" and "a smooth number reaches the dial". The bearing maths is exact and not in question. The governing sentence throughout: a rock-steady needle a few degrees off beats a jittery one that is mathematically perfect.

## Summary

Every reference implementation I could read filters the fused sensor with a single-pole low-pass family (exponential smoothing or its spring equivalent), never with a Kalman filter, Madgwick, or Mahony on top. Trail Sense ships with smoothing OFF on top of `TYPE_ROTATION_VECTOR` and lets the vendor fusion do the work. MBCompass uses a Compose spring (`StiffnessLow` 200, `dampingRatio` 0.5). c:geo uses a proportional chase of one tenth of the remaining error per 40ms tick with a 1 degree dead zone. FSensor's default low-pass time constant is 0.18s.

The app's `unwrapAngle` plus `shortestDelta` approach is mathematically correct at the boundary and I could not break it numerically. Its real weakness is upstream of the maths: the filter runs on the JS thread, and `withTiming(150ms)` retargeted every 50ms behaves as a 57ms time constant, a number nobody chose.

My recommendation: a rate-adaptive exponential filter on the unwrapped angle, running in a Reanimated worklet on the UI thread, fed by `useAnimatedSensor(SensorType.ROTATION)` which delivers the fused quaternion and yaw straight to a UI-thread shared value (verified in the installed `react-native-reanimated@4.7.0` native code). Time constant 0.3s when still, 0.05s when turning, ramped on measured angular rate. Keep the accuracy signal from a parallel cheap path because both Reanimated and expo-location throw the sensor's own accuracy estimate away.

The quiet killer is question 7: a fused heading fails silently. The gyro carries the needle smoothly while the magnetic reference is wrong, so every visual cue of unreliability disappears exactly when the reading is least trustworthy. The design answer is a divergence detector (gyro-only heading versus fused heading, while still) plus the rotation vector's `data[4]` accuracy estimate, surfaced as UI, never left implicit.

## Q1: What the reference apps actually apply

Closed-source honesty first: Google Maps and Apple Maps filter code is not public. I grade what I could read.

| Implementation | Filter on top of fusion | Constants | Grade |
|---|---|---|---|
| Trail Sense (Android, best-regarded open compass) | Quaternion SLERP low-pass, OFF by default | Default `compassSmoothing = 1` which skips the filter entirely. Slider 1 to 100 maps through `(1 - s/100)^2` to alpha 0.005 to 1 | [S] |
| MBCompass (FOSS, Show HN 2025) | Spring on the unwrapped angle | `StiffnessLow` (200), `DampingRatioMediumBouncy` (0.5), sensor at `SENSOR_DELAY_FASTEST` | [S] |
| c:geo (geocaching, 10k+ stars) | Proportional chase per 40ms UI tick | Move `ceil(diff/10)` degrees per tick, dead zone below 1 degree, redraw only on 2 degree change, sensor at `SENSOR_DELAY_NORMAL` | [S] |
| FSensor (sensor-fusion library) | Single-pole low-pass offered as the smoothing option | Default `timeConstant = 0.18f`, same for its complementary fusion | [S] |
| Android platform docs | Canonical single-pole form | `alpha = t / (t + dT)`, example alpha 0.8 at 200ms event rate for gravity isolation, described as "a rough representation of the latency" | [P] |
| Google Maps | Beam width encodes compass accuracy, narrow is accurate | No filter constants public | [P] for behaviour, [U] for filter |
| Apple Maps / Core Location | Not documented; the only public knob is `headingFilter` | Default 1 degree minimum angular change between events | [P] for the knob, [U] for the filter |
| OsmAnd | Exposes a "Kalman filter" toggle for compass in settings | Implementation not located | [W] |

Patterns worth copying:

- Nobody runs Madgwick, Mahony, or a Kalman filter on top of an already-fused sensor. Those algorithms exist to fuse raw sensors. The vendor fusion already did that work. Stacking a second estimator adds lag and tuning burden for no noise reduction a one-pole filter cannot give.
- The shipped feel comes from the display-side filter, not the sensor-side. c:geo's per-tick proportional chase (faster when far, dead zone when close) is a shipped adaptive filter in disguise and its numbers are a useful sanity check.
- Trail Sense trusting the raw fused stream by default is the strongest evidence available that the display filter should be light. Its FAQ tells users to adjust smoothing only if the compass feels unresponsive or jittery.

## Q2: The angle-wrap trap, and the app's existing approach

The failure, demonstrated (`exp1_wrap.py`, output pasted):

```
naive mean of 359 and 1: 180.0
circular mean of 359, 1: 360.0
naive EMA after 200 samples across 359/1 boundary: 170.58
per-crossing walk toward the wrong pole (deg): -35.8
app unwrap+EMA after 200 samples: 360.053 (error 0.053 deg)
unwrap+EMA at 179/-179 alternation: 180.05 (true 180)
```

A naive EMA fed a stream alternating 359 and 1 (true heading 0, one degree of noise) walks 35.8 degrees toward the wrong pole on every crossing and settles near 170. The needle points south while the phone points north. This is not an edge case: north is the most-visited heading in a qibla app in the UK, where the bearing to Mecca is roughly 118 to 119 degrees and the user sweeps the phone across north to reach it.

The three correct families:

1. Filter on the unit circle. Maintain EMA states for `sin(heading)` and `cos(heading)`, extract with `atan2`. Wrap-free by construction. Cost: two trig calls per sample.
2. Quaternion SLERP. Interpolate rotations on S(O(3)), extract azimuth after. Handles tilt coupling as well as yaw. Cost: one acos, one sin, normalisation.
3. Unwrapped-angle accumulation. Keep a continuous state, add the shortest signed delta each sample. This is what `shared/qibla.ts` does.

Assessment of the app's code, which I read and then attacked numerically:

- `shortestDelta` is correct on the half-turn tie: an exact 180 delta resolves to plus 180 deterministically, so the needle never depends on a rounding error. The tie-break cannot ratchet: a stream alternating 179 and 181 (crossing the 180 boundary, the mirror of the north case) settles at 180.05, not at 0.
- `unwrapAngle` composes them into a continuous accumulator, and `Dial.tsx` animates `-heading.value` inside `useDerivedValue`, so the interpolation never sees a wrap. The first-evaluation snap avoids the mount-time spin. All sound.
- It survives a faster sample rate unchanged. The accumulator has no rate dependence. At 50Hz the per-sample deltas shrink, which makes the unwrap MORE accurate, not less.
- What it gets wrong is not the wrap. It is that the filtering burden falls entirely on `withTiming(ANIMATION.durationFade)` inside `useDerivedValue`, retargeted on every sample. A timing animation restarted at 33 percent of its curve has covered roughly 26 percent of its delta (smoothstep approximation, `exp2_timeconstants.py`), so retargeting a 150ms animation every 50ms is an accidental exponential filter with effective time constant 57ms that nobody chose or tuned. Worse, the unwrap runs in the JS callback (`Qibla.tsx` line 59), so the accumulator state lives on the JS thread where congestion bursts it.
- One genuine boundary hazard remains: `unwrapAngle` output is unbounded by design. That is fine for double precision (eight hours of continuous spinning at one turn per second is 10 million degrees, exact in float64), but any future code that normalises the shared value reintroduces the wrap silently. The invariant deserves a comment where the shared value is declared, and a test.

## Q3: Quaternion domain versus angle domain

What tilt does to the azimuth, measured (`exp3_quat.py`):

```
2 deg roll wobble at pitch  0: azimuth shifts 0.00 deg
2 deg roll wobble at pitch 15: azimuth shifts 0.52 deg
2 deg roll wobble at pitch 30: azimuth shifts 1.00 deg
2 deg roll wobble at pitch 45: azimuth shifts 1.41 deg
2 deg roll wobble at pitch 85: azimuth shifts 1.99 deg
```

Roll noise leaks into azimuth as `2 x sin(pitch)` degrees. Hand tremor at typical holding pitch (15 to 45 degrees) injects 0.5 to 1.4 degrees of apparent yaw noise per 2 degrees of roll wobble.

The trade-off, concretely:

- Angle domain (filter the extracted azimuth). One subtraction, one mod, one multiply per sample. The tilt coupling above passes straight through, so pitch and roll wobble appear as yaw jitter and the filter must damp them. At 50Hz this is roughly 10 flops.
- Quaternion domain (SLERP the orientation, extract azimuth after). One dot product, one acos, one sin, normalisation. Filtering in SO(3) averages the full rotation, so the extracted yaw inherits a consistent average that accounts for the pitch and roll each sample carried. For pure yaw motion the two are numerically identical (measured: both give 0.00 degrees mean error on a yaw-only pair at pitch 70). Cost is roughly 80 flops plus three transcendentals per sample.
- 60fps budget verdict: both are free. At 50Hz on a Snapdragon 820-class core either filter is under 0.001ms per sample against a 16.7ms frame. The 60fps constraint does not decide this question. The dial's 84-element SVG layer architecture is untouched either way because the filter output is still one number rotating one layer.

Decision rule: if the native module delivers a quaternion (the rotation vector natively is one), SLERP-then-extract is the technically better filter and costs nothing. If the module delivers an angle, angle-domain EMA on the unwrapped value is correct as long as the user holds the phone reasonably flat, which the app's own hint text already asks for. The qibla use case is a dial held flat, pitch under 30 degrees, where the difference between the two domains is under 1 degree. I recommend the angle domain for implementation simplicity, with the tilt number above recorded as the accepted cost, unless the quaternion is already crossing the boundary anyway.

## Q4: Filter parameters that feel right

Measured time constants and their step response at a 50Hz sample rate (`exp2_timeconstants.py`):

| tau | alpha at 50Hz | 90% of a 10deg step | Feel |
|---|---|---|---|
| 0.05s | 0.286 | 140ms | Instant, still shows sensor noise |
| 0.10s | 0.167 | 260ms | Crisp |
| 0.15s | 0.118 | 380ms | Balanced |
| 0.20s | 0.091 | 500ms | Deliberate |
| 0.30s | 0.062 | 720ms | Steady but noticeable lag on a turn |
| 0.50s | 0.038 | 1180ms | User turns, needle follows late |

Shipped numbers:

- FSensor default low-pass: 0.18s [S]
- c:geo: proportional, reaches 90 percent of a 10 degree step in about 180ms given its 40ms tick and one-tenth chase [S, computed from their constants]
- MBCompass spring at `StiffnessLow` 200, damping 0.5: settle in roughly 300 to 400ms with visible bounce [S]
- The app today, through accidental `withTiming` retargeting: effective tau 57ms [computed]
- Android docs: alpha framed as latency, example 0.8 at 5Hz which is tau 0.8s for gravity, explicitly called a starting point [P]

Proposed starting value: tau 0.15s as the fixed baseline. Reasoning: it lands between FSensor's shipped default and the app's current accidental 57ms, it keeps a 10 degree correction under 400ms which is below the threshold where a user turning to face the qibla perceives lag, and it halves sensor noise power roughly three times over tau 0.05.

Adaptive filtering, which is what actually makes an arrow feel instant AND steady: gate the time constant on the measured angular rate. When the phone is nearly still, filter hard (tau 0.3s) so the needle freezes. When the user is turning, filter light (tau 0.05s) so the needle tracks. My ramp, measured:

```
rate   0 deg/s -> tau 0.30s alpha 0.062
rate  20 deg/s -> tau 0.27s alpha 0.069
rate  60 deg/s -> tau 0.14s alpha 0.122
rate 120 deg/s -> tau 0.05s alpha 0.286
```

Ramp tau linearly in the rate between 10 and 90 degrees per second, computed from the same sample stream as `|shortestDelta| / dt`. Two named shipped implementations do this: c:geo's chase is inherently adaptive (bigger error, bigger step) and Trail Sense ships a user-facing smoothing control with an explicit unresponsive-versus-jittery trade-off in its FAQ [S]. The gyro rate itself is also available and is a cleaner rate estimate than differenced headings.

## Q5: Where the filter should run

The current path, from `components/sheets/screens/Qibla.tsx` and `components/qibla/Dial.tsx`: expo-location native callback crosses into JS, `unwrapAngle` runs in the JS callback, the result writes a shared value, `useDerivedValue` in `Dial.tsx` runs `withTiming` on the UI thread. The unwrap is on the JS thread. The animation is on the UI thread.

(a) Native module. The filter sits at the sensor source, runs at sensor rate with zero bridge cost, and can decimate before crossing. Costs: per-platform code for what is 10 lines of maths, and the filtered value still has to reach the UI thread afterwards, so the bridge crossing only shrinks, it does not disappear. Justified only for the adaptive rate estimate if gyro access is needed, or to preserve `data[4]` accuracy, neither of which requires the display filter to live there.

(b) JS thread. The status quo's fatal property: a JS-thread filter is at the mercy of JS-thread congestion while the dial renders on the UI thread. When React renders, a fetch resolves, or a timer fires, heading samples queue behind it, the shared value stops updating, the timing animation completes on its last target, and the needle freezes then snaps. The dial is proven at 16.7ms median frame gap ON THE UI THREAD; a JS filter imports every JS hiccup into the needle for no benefit, because nothing on the JS thread consumes the filtered value. This option fails the design constraint.

(c) Reanimated worklet on the UI thread. Recommended. Two supporting facts from the installed `react-native-reanimated@4.7.0`:

- `useAnimatedSensor(SensorType.ROTATION)` exists and its Android implementation (`node_modules/react-native-reanimated/android/src/main/java/com/swmansion/reanimated/sensor/ReanimatedSensorListener.kt`, read directly) subscribes to `Sensor.TYPE_ROTATION_VECTOR`, extracts the quaternion AND yaw/pitch/roll, and pushes them into a UI-thread shared value through the sensor setter. No JS involvement per sample.
- The whole filter, unwrap plus EMA plus adaptive rate gate, is a handful of arithmetic operations inside `useDerivedValue` or `useFrameCallback`, running beside the animation that already holds 60fps.

Caveats found in that same native source, which matter:

- `onAccuracyChanged` is an empty body. The sensor's accuracy signal is dropped on the floor. The `interval` config is a wall-clock throttle on reads.
- The listener discards the rotation vector's fifth component, the estimated heading accuracy (see Q7). So a worklet fed by `useAnimatedSensor` gets the orientation but not the platform's own uncertainty estimate.

Consequence for the architecture: run the display filter in a worklet, and run a cheap parallel accuracy path (magnetometer accuracy events, field strength, or a small custom native module that forwards `data[4]`) whose only job is to set an uncertainty shared value the UI can read. Do not route the heading through JS to get it. `react-native-worklets@0.13.0` is current (latest published is 0.13.0), so the scheduling APIs the skills document are available as documented.

## Q6: Sample rate versus frame rate

50Hz samples against 60Hz frames beat. Measured (`exp4_bridge.py`): in an 18-frame window, 3 of 17 frame advances redraw the same sample value, and the stale frame lands in a repeating 10Hz pattern. Driving the rotation directly from each sample turns that beat into visible micro-stutter, angular steps of 1.8 degrees per sample at a 90 degree per second turn against the 1.5 degrees per frame the eye expects.

Interpolating between samples fills every frame. Latency comparison:

- Direct drive: mean staleness 10ms (half a sample period), but beat stutter and sample-quantised motion.
- Interpolation: the needle trails by roughly the filter time constant. The app's current `withTiming(150ms)` retargeted every 50ms is an effective 57ms chase, so measured added latency today is about 60ms.

Verdict: interpolate. The app's family (hold the target, animate toward it) is correct. What is wrong is the constant. `ANIMATION.durationFade` is 150ms, chosen for overlay fades, and a timing animation restarted every 20ms (a 50Hz stream) runs only 13 percent of its curve per sample, covering roughly 8 percent of each delta: an effective tau of about 230ms, sluggish, and the easing curve's slow start makes each retarget visibly hesitate. At the current expo throttle (2 degrees or 50ms, so effectively 20 to 40Hz in steady turning) 150ms is defensible. Against a faster fused stream it is not.

Recommendation: stop using a duration at all. One exponential filter in the frame domain (`useFrameCallback`, `timeSincePreviousFrame` for rate independence, tau from Q4) produces a value every frame regardless of sample rate, which makes the sensor rate irrelevant to smoothness. If a timing animation must stay, set its duration near 1.5x the sample period (30ms at 50Hz) and use a linear or ease-out curve, not the default ease-in-out whose slow start amplifies retarget hesitation.

## Q7: How a fused heading degrades, and the honest copy

This is the failure mode that changes under fusion. A raw magnetometer heading degrades visibly: the needle wobbles, the user sees it. A fused heading degrades invisibly: the gyro integrates rotation smoothly and confidently while the magnetic reference it corrects toward is wrong. The needle looks steady and points 20 degrees off. The app's rule, honest about the needle and never about the number, inverts under fusion: the visible needle becomes the least trustworthy signal on the screen.

The mechanism, per the AOSP sensor documentation: the rotation vector MUST use the gyroscope as the primary orientation input and uses accelerometer and magnetometer only to make up for gyro drift [P]. Magnetic disturbance therefore propagates as a slow drift correction, not as instantaneous noise. Google's own Maps blog names the trigger conditions users actually hit: "charging your phone or walking by a metal pole" [P, vendor blog].

Signals that expose it:

| Signal | Source | Grade | Notes |
|---|---|---|---|
| Estimated heading accuracy, `data[4]` | Rotation vector fifth component, radians, 95 percent bound | [P] AOSP | The direct platform answer. Dropped by both expo-location and Reanimated's listener |
| Magnetometer accuracy events | `onAccuracyChanged`, `SENSOR_STATUS_UNRELIABLE` or `LOW` | [P] | The app already consumes this via expo-location `accuracy <= 1`. Keep it |
| Field magnitude sanity | `sqrt(x^2+y^2+z^2)` of raw magnetometer | [S] | Earth's field is 22 to 67 uT (BGS, cited by Trail Sense). Outside 19.8 to 73.7 uT means disturbance or miscalibration |
| Divergence while still | Gyro-only heading versus fused heading | [S] | The sharpest detector. Trail Sense's `QuickRecalibrationOrientationSensor` compares a magnetic reference against the fused primary and triggers a sensor restart when they diverge by more than a threshold while the device is still (defaults 4 degrees, motion gate 60 deg/s; Trail Sense instantiates 1 degree and 45 deg/s) |
| iOS `headingAccuracy` | `CLHeading`, degrees | [P] | Apple also fires the calibration prompt on "a significant change in magnitude or inclination of the observed magnetic field" |

What good compasses show: Google Maps widens the blue beam. The beam IS the accuracy estimate, always visible, no number, no dialog. That is the pattern to copy: uncertainty rendered as a property of the needle's presentation, present at rest, gone when confident. Trail Sense renders a quality enum from field strength and sensor quality.

Honest copy under fusion, in the app's voice: never a bare number over a wrong needle. When accuracy degrades, the hint text should move from calibration advice to a warning ("the needle may be pointing wrong, move away from metal and magnets"), because the figure-eight alone does not fix a live disturbance, and the needle's steadiness no longer means anything. When the divergence detector fires, say the compass lost its reference. The states the screen needs: confident (no copy), degraded (accuracy band shown, calibration hint), disturbed (explicitly say the direction may be wrong).

## Q8: Is the figure of eight still right

Yes, with one refinement. What calibration actually does on Android, per AOSP: the magnetometer readings are calibrated by temperature compensation, factory or online soft-iron calibration, and online hard-iron calibration [P]. Hard and soft iron estimation needs the device to be seen in varied orientations, which is exactly what a figure of eight through varied tilt provides. The fusion does not remove this need: the fused sensor still consumes the magnetometer to correct gyro drift, so a miscalibrated magnetometer corrupts the fusion's absolute reference.

What the vendors tell users:

- Google support and the Maps blog: "move your phone in a figure 8 until your compass is calibrated. The beam should become narrow" [P/W, vendor support thread plus vendor blog].
- Apple: the calibration alert "prompts the user to move the device in a particular pattern", fires on first heading request or on significant field magnitude or inclination change, and Apple's own note is precise: the calibration filters only fields that MOVE WITH THE DEVICE. Interference from a nearby fixed source must be escaped by moving away [P].
- That Apple note is the refinement. The figure eight fixes hard-iron miscalibration. It does nothing about a static external disturbance, and waving the phone inside a disturbed field can even feed the calibrator bad data.

Verdict on the app's current copy, "Move the phone in a figure of eight a few times, away from metal and magnets": still correct under fusion, and the "away from metal" clause already carries the real fix. What must change is the trigger. Today the copy shows when the raw accuracy band is poor. Under fusion the accuracy band can read fine while the heading is quietly wrong, so the copy must also fire on the divergence detector from Q7, and its meaning shifts from "your needle is wobbling" to "your reference may be wrong even though the needle looks fine".

## COULD NOT VERIFY

- Google Maps' filter family or constants. Closed source. I searched for teardowns and talks, found none that name a filter. What is public is the accuracy-beam behaviour from Google's own 2016 announcement. Searched tinyfish for "Google Maps compass arrow smoothing damping developer" and read the blog.google post.
- Apple Maps' filter. Same situation. The only public platform knob is `headingFilter` default 1 degree.
- OsmAnd's Kalman compass filter implementation. The setting exists in its UI and issue references; I located neither the class nor its constants in the time available. Tried GitHub code search (unauthenticated, 401) and raw file guesses (404).
- The exact easing curve Reanimated 4.7 applies inside a retargeted `withTiming`, so my 26 percent coverage per 50ms retarget is a smoothstep approximation, stated as such.
- Any published number for the rotation vector's convergence time after magnetic disturbance on a Snapdragon 820. The AOSP contract gives the 95 percent accuracy bound but no dynamics.

## Sources

| Claim | Source | Grade |
|---|---|---|
| Rotation vector fuses accel, mag, gyro; gyro primary; mag corrects drift; `data[4]` accuracy, 95 percent bound | AOSP sensor types documentation, source.android.com | [P] |
| `alpha = t/(t+dT)` canonical low-pass form, alpha 0.8 example, latency framing | Android motion sensors documentation, developer.android.com | [P] |
| `headingFilter` default 1 degree; `CLHeading.headingAccuracy`; calibration alert triggers and the moves-with-device rule | Apple developer documentation for CoreLocation | [P] |
| Maps beam encodes compass accuracy; figure 8 fix; charging or a metal pole disturbs | blog.google, Maps product update, Sep 2016 | [P] (vendor statement) |
| expo-location Android: mag+accel at DELAY_NORMAL, 2 degree or 50ms gate, accuracy passthrough | `expo/expo` sdk-58 `LocationModule.kt`, read in full | [S] |
| Trail Sense: smoothing default off, quadratic slider mapping, SLERP low-pass filter class, quick recalibration 4deg/60deg/s defaults and 1deg/45deg/s instantiation, field strength 22 to 67 uT quality bands | `kylecorry31/Trail-Sense` and `kylecorry31/Andromeda` source, read directly | [S] |
| MBCompass: rotation vector at FASTEST, unwrap, spring StiffnessLow 200, damping 0.5 | `CompassMB/MBCompass` source, read directly | [S] |
| c:geo: rotation vector at NORMAL, 40ms tick, ceil(diff/10) chase, 1 degree dead zone, 2 degree redraw gate | `cgeo/cgeo` `CompassView.java` and `RotationProvider.java`, read directly | [S] |
| FSensor: low-pass default 0.18s, complementary 0.18s, Madgwick beta 0.033 | `KalebKE/FSensor` README | [S] |
| Reanimated delivers quaternion and yaw from rotation vector to a UI shared value; drops accuracy events | `react-native-reanimated@4.7.0` installed native source, `ReanimatedSensorListener.kt` | [S] |
| Quaternion SLERP low-pass formulation | MathWorks Nav Toolbox documentation, quaternion slerp lowpass example | [P] |
| OsmAnd Kalman compass setting exists | OsmAnd GitHub issue 4641 | [W] |
| Madgwick MARG filter incorporates magnetic distortion and gyro bias compensation | Madgwick internal report, 2010 | [P] |
| All numerical results (359/1 failure, 170.58 convergence, 0.053 degree unwrap error, tilt leak `2 sin(pitch)`, tau table, 57ms effective chase, 3-of-17 beat frames) | My scripts in `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/r4/`, outputs pasted above | [S] (reproducible) |
