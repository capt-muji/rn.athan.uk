# D4: detection and honesty

Diagnostic agent D4, session 40. Scope: what the app can measure to KNOW the heading is wrong, and what the screen then says. Root cause belongs to other agents; this report assumes the heading stream exists and asks when to stop trusting it.

**The best single detector is total field magnitude compared against the expected field for where you stand: flag when the measured magnitude sits more than 20 percent away from the model value for 2 seconds, and treat more than 35 percent as proof.**
In London the expected magnitude is 49.13 microtesla and the expected dip is 66.5 degrees (computed from WMM2025 below, validated against NOAA). A 45-degree deflection needs a disturbance of roughly 15 microtesla or more, and a disturbance that size trips the magnitude check in 70 to 100 percent of geometries. It is the only detector that works at rest, with no motion and no second sensor stream. Its blind spot, a disturbance tuned to rotate the field without changing its length, is covered by the dip check and, in the last resort, by the sun.

## Ranked signals

| Rank | Signal | Catch rate on this failure | Cost | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Field magnitude versus expected F (offline model) | 70 to 100 percent at 15 to 25 microtesla of disturbance; 100 percent above 25 | One magnetometer read per sample, already streaming | Build on this |
| 2 | Dip versus expected inclination | Catches the vertical and F-tuned cases magnitude misses; shifts of 3 to 17 degrees at 45-degree deflection | Magnitude plus gravity vector, one cheap extra sensor | Build with it |
| 3 | Magnitude variance across orientations | Catches hard-iron miscalibration, the residual the calibrator leaves | Free once rank 1 streams; needs the user to move the phone | Add, cheap |
| 4 | Reference versus primary divergence (Trail Sense pattern) | Catches fusion stuck or lagging (the fixed-offset firmware family); silent on a steady external field, see 1.4 | Second orientation computation plus motion gate | Add for the firmware class |
| 5 | iOS `headingAccuracy` | Zero here; the XS reported no problem while 45 degrees wrong | Free today | Keep, never trust alone |
| 6 | Android `onAccuracyChanged` band | Zero here; the 3T band read healthy | Free today | Keep, never trust alone |
| 7 | Android rotation vector `values[4]` | Zero; reads 0.00 on every 3T sample and AOSP software fusion never writes it | Free if populated | Ignore below 0 strictly |

## 1. Every signal, assessed

### 1.1 Platform accuracy reports

iOS `CLHeading.headingAccuracy`: degrees, "maximum deviation", negative means invalid [A, header read]. It is populated on real hardware; Apple's own cone logic depends on it. Two problems. First, expo-location collapses it into a 0 to 3 band with thresholds 50, 35 and 20 degrees before JS sees it (R2 verified `LocationUtils.swift`), so the app today cannot even read the figure. Second, and decisive for this session: on the failing day the XS said nothing while every app pointed 45 degrees wrong. The estimate is the vendor's opinion of its own magnetometer, and a steady disturbance that the calibrator has absorbed into its baseline produces a confident wrong answer. Keep it as one input, never as the gate.

Android `onAccuracyChanged`: the 0 to 3 band, populated for the QTI rotation vector on the 3T [S, R3 section 4]. The framework fires it only on change, and `event.accuracy` rides every sample. Same failure: the band read healthy in the failing room.

Android rotation vector `values[4]`: documented as estimated heading accuracy in radians, minus 1 when unavailable [A]. R3 measured 0.00 on every sample at rest on the 3T, and read AOSP: `RotationVectorSensor.cpp` builds the output event by copying the accelerometer event and overwriting `data[0..3]` only, so the software fusion path never writes it; old HALs force it to minus 1 [S]. On the floor device it carries no signal. Use it only when present and strictly positive, which on the 3T is never.

### 1.2 Magnetic field magnitude, the physical invariant

Earth's total intensity at the surface runs 22,000 to 67,000 nanotesla [P, BGS]. For London on 2026-09-29 I evaluated WMM2025 directly: F 49.13 microtesla, horizontal component 19.56, vertical 45.07, dip 66.54 degrees, declination 1.203 (my evaluator matches the NOAA calculator's 1.20325 to the fourth digit, and matches pygeomag's Seattle doctest to the fourth digit, so the numbers are trustworthy). The brief's figures check out: about 49 microtesla and about 66 degrees.

How to read it:

- Android: `TYPE_MAGNETIC_FIELD` gives the calibrated field in microtesla. The planned native compass module (R3 section 7) can subscribe to it beside the rotation vector and emit the magnitude in the same event. `TYPE_MAGNETIC_FIELD_UNCALIBRATED` adds the iron bias in values 3 to 5, useful for the variance detector. expo-sensors' Magnetometer modules expose both if the owner prefers a library over module code [S, source read].
- iOS: `CLHeading` carries `x`, `y`, `z` as geomagnetic microtesla [A, header read], and expo-location drops them on the floor today [S, `LocationModule.swift` sends only trueHeading, magHeading, accuracy]. `CMMotionManager` magnetometer data is the total field, Earth plus device bias, in microtesla [A, `CMMagnetometer.h`]. Either works; the CLHeading fields cost nothing extra if the app ever owns its heading stream.

Thresholds and their justification:

- **Warn: measured F more than 20 percent from expected, sustained 2 seconds. Severe: more than 35 percent, sustained 2 seconds.** Monte Carlo over disturbance orientations in the London field: a 15 microtesla bias produces a deflection over 40 degrees in a third of orientations, and where it does, the combined F and dip bands catch 50 percent at 15, 86 percent at 20, 99.8 percent at 25, 100 percent at 30 microtesla. Clean-field magnitude is stable to a few percent; the worst documented geomagnetic storm depressions move total intensity by under 3 percent (my storm check: a 5 percent horizontal depression shifts F by 0.8 percent and dip by 1 degree). The 20 percent line sits four storm-widths clear of clean air and inside the disturbance band.
- **Fallback with no position: the fixed global band 25 to 65 microtesla**, Trail Sense's shipped 22 to 67 narrowed slightly for a warn, widened for severe. This needs no model and no location, at the cost of missing tuned disturbances.
- Noise: the magnitude estimate at rest is stable to well under 1 microtesla after a short average. I could not measure the XS and 3T magnetometer noise floors directly (see COULD NOT VERIFY); the margins above absorb any plausible handset noise.

The dangerous case, stated rigorously. A disturbance that rotates the field without changing its length or its dip is possible and computable: it takes a horizontal offset of magnitude `2 H sin(deflection / 2)` with zero vertical component. For 45 degrees in London that is 14.96 microtesla aimed across the field. Then F, H and dip all read normal while the heading is 45 degrees wrong. No motion sensor can expose it either: the gyro sees the same rotations the deflected compass sees, so every internal consistency check passes. Two honest statements follow. A tuned disturbance is undetectable from inside the phone, full stop. And a tuned disturbance is also unlikely: it requires a source of a third of Earth's field arranged at a specific angle, whereas real sources (radiators, speakers, steel) put out untuned fields that the magnitude and dip checks catch in the great majority of geometries. The screen's last line of honesty for the tuned case is the sun check, which needs no sensor at all.

One subtlety worth building on: on Android the calibrated field has already had the OS hard-iron estimate removed. When that estimate is wrong by a residual vector d, the measured magnitude swings by plus and minus d as the phone rotates, because the residual rotates with the device while Earth's field does not. A 45-degree error implies a residual near 15 microtesla, so the magnitude would swing between roughly 34 and 64 across orientations, far outside noise. This gives detector 3: **track the max-min of F over any 10-second window in which the phone has swept at least 30 degrees of yaw; warn when the spread exceeds 6 microtesla.** It fires only once the user moves the phone, which the calibration hint already asks them to do.

### 1.3 Divergence between an unfused and a fused heading

I read Trail Sense's `QuickRecalibrationOrientationSensor` verbatim [S]. Verified: defaults 4 degrees, 60 degrees per second motion gate, 1-second dwell; shipped instantiation in `CompassProvider` at 1 degree and 45 degrees per second; reference is their own accelerometer-plus-magnetometer computation, primary is the OS rotation vector; motion is debounced over 40 milliseconds; recalibration is a stop and start of the primary; the whole class is skipped for their custom sensor sources. `MagQualityOrientationWrapper` additionally rates quality from raw field strength with the 22 to 67 microtesla band and a plus or minus 10 percent warning margin [S, `MagnetometerExtensions.kt`].

The correction to how R4 characterised it: the reference is magnetic, so in a steady external field both sides deflect together and the detector stays silent. What it does catch is the primary's fusion being stuck or lagging the raw magnetic heading, which is exactly the fixed-offset firmware family R6 documents (S21 and Xperia 90-degree jumps, CMF 180). It also catches the convergence transient after a field changes. For this app: compare the shipped heading against a self-computed accelerometer-plus-magnetometer heading, both of which the module already has the ingredients for, **warn at more than 10 degrees of disagreement held 1 second while motion stays under 45 degrees per second**. Trail Sense can act at 1 degree because its remedy is a silent sensor restart; a user-facing warning needs the wider margin.

Cost: one more orientation computation plus a motion gate. On iOS the same pattern compares Core Location heading against a Core Motion true-north heading; both are magnetic, so it catches the same fusion-lag class only.

### 1.4 Inclination or dip

The dip is computable from the device-frame field and gravity alone: the angle between the calibrated magnetic vector and the gravity vector needs no Earth-frame transform and no declination. Expected dip comes from the same offline model as F. **Warn when dip is more than 5 degrees from expected for 2 seconds; severe beyond 10.**

Justification: my UK sweep gives dip 64.8 to 73.0 degrees and F 48.4 to 51.4 microtesla across the country, so a position-resolved expected value keeps table error near 1 degree; tilt noise from accelerometer jitter contributes well under a degree; a real 45-degree untuned deflection shifts dip by 3 to 17 degrees. The check earns its place on the cases magnitude misses: a vertical or tilted disturbance can hold F inside a 20 percent band while moving dip 8 degrees or more (my table: a 45-degree deflection with a compensating vertical component of 6 to 13 microtesla keeps F inside even the loose 25 to 65 band, and the dip check is what catches most of that window). Together F and dip are near-orthogonal: F constrains the length, dip the direction's steepness, and only the exactly-tuned rotation defeats both.

### 1.5 Anything else found

GPS course comparison: while walking, the heading should agree with the track. Maps does this ("Google's doing some extra processing using your recent GPS movement", R6 quotes the field report). Useless at rest, which is the qibla use case; not recommended.

Camera or sun reference: the sun's azimuth is closed-form astronomy, computable on device (R6 section 6.4). Not a detector of the sensor, but the final arbiter when every internal detector is silent. Belongs in copy before it belongs in code.

## 2. Ranking against this failure

The failure to catch: 45 degrees, iPhone XS and OnePlus 3T, indoors, both platforms' own signals silent.

- Magnitude versus expected: the Fulham source must produce at least ~15 microtesla of horizontal disturbance to rotate London's 19.56 microtesla horizontal component by 45 degrees. Barring the tuned geometry, the check fires. Probability-weighted from the simulation: 50 to 92 percent at 15 microtesla depending on orientation, 86 percent plus at 20, essentially certain above 25. This is the winner because it needs nothing from the user and nothing from the vendor.
- Dip: fires on the same disturbances whenever they carry a vertical component, which random real sources usually do. Adds independent coverage.
- Magnitude variance: would have fired the moment anyone turned either phone, and the owner reports the phones were used normally. Requires the yaw-sweep gate, so it lags ranks 1 and 2 at rest.
- Divergence: silent here in steady state, since both phones' reference and primary deflect together. Catches the adjacent firmware class, so it stays in the set at rank 4.
- Vendor signals: both silent on the day. Confirmed as necessary but insufficient.

## 3. Expected field without a network

Constraint: no API keys, no external services. Everything below runs on device.

Android: `android.hardware.GeomagneticField` gives `getFieldStrength()` in nanotesla, `getInclination()`, `getDeclination()`, `getHorizontalStrength()` [A, source read]. Compiled WMM, no network, needs a position the app already holds. The 3T's WMM-2015 staleness is irrelevant to this check: I evaluated WMM-2015v2 extrapolated to today against WMM2025 and the F error is 1 nanotesla in London, 21 in Edinburgh, 190 in Karachi; dip error is at most 0.42 degrees. Against thresholds of 20 percent and 5 degrees, the stale model costs nothing.

iOS: no equivalent. Core Location exposes no geomagnetic model, and nothing in the CoreMotion or MapKit headers supplies expected field values. Two options:

1. **A coarse table.** The app is London-only by the North Star. Ten latitude bands with linear interpolation, each carrying F and dip, roughly 200 bytes as literals, keeps expected-value error under 2 degrees of dip and 3 percent of F anywhere in the UK. Against the 5-degree and 20-percent thresholds that is a two to seven times margin. For a London-pinned app a single UK row would almost suffice (the whole country spans 48.4 to 51.4 microtesla and 64.8 to 73 degrees dip), but latitude bands cost little more and cover visitors.
2. **An embedded WMM.** The WMM2025 COF is 90 rows of six numbers, about 2.5 KB, and the evaluator is the 150-line spherical-harmonic summation I validated for this report. Exact worldwide, offline, no keys, and the coefficients are public domain NOAA data. Costs a test suite and a five-yearly refresh discipline; the model's own uncertainty (138 nanotesla in F, 0.20 degrees in dip) is orders below the thresholds.

Recommendation: the coarse table now, the WMM port if the app ever drops its London scope. Quantified accuracy need: expected F within 5 percent and expected dip within 2 degrees are ample, because a 45-degree deflection implies disturbances an order larger than both error budgets.

## 4. What the reference apps do, triggers first

R6 section 3 covers appearance. What matters here is the trigger behind each appearance, and how weak every vendor trigger is against a tuned or absorbed disturbance.

- Google Maps beam: the width is the FOP's `getConservativeHeadingErrorDegrees()` rendered as geometry [P, API reference]. The figure is Google's estimate of its own fusion, the same class of signal that read confident on the XS. Google patched the cone's disturbance behaviour after launch ("better cope with magnetic disturbances"), which is an admission that the estimate itself misleads near disturbances [P].
- Maps calibrate flow: appears on user action (tap the dot, Calibrate) or when the beam is wide, and shows Low, Medium, High from the same estimate [J]. The flow completes at High, meaning the vendor signal must improve, meaning it cannot clear a disturbance the vendor cannot see.
- Apple Maps cone: widens with `headingAccuracy` [W for the rendering, A for the signal]. Same class, same blindness.
- iOS system calibration HUD: triggered by Core Location, not by the app, and only at documented moments: the first heading request ever, and when Core Location "observes a significant change in magnitude or inclination of the observed magnetic field" [A]. Note what this means: Apple runs a magnitude-and-inclination watch of its own, which is independent confirmation that the physics check in section 1.2 is the platform-grade detector. The HUD's appearance is consent-gated by the app's delegate and cannot be summoned on demand.
- Android: no system calibration surface exists. The OS calibrates continuously in the background; Google's figure-of-eight screen lives inside Maps, not the platform.

The pattern across all of them: every shipped trigger is the vendor's self-assessment, except Apple's field-change watch, which is physics. Nothing shipped would have flagged the Fulham room. That is the gap rank 1 fills.

## 5. The screen states and their copy

Current copy, for reference: the reading line plus a hint that is either "Hold the phone flat for an accurate reading" or "Move the phone in a figure of eight a few times, away from metal and magnets". The voice rule from the code comment holds: name the condition and what to do about it, never apologising for the reading and never blaming the phone.

The state machine (full table below the sections) has eight states. The new one this session exposed is DISTURBED, and it splits in two: warn, where the needle stays with a widened uncertainty arc, and severe, where the needle is hidden.

On hiding the needle. The argument for drawing it anyway: a wrong needle with a caption is still evidence, the user has paid for a compass screen, and every reference app keeps its arrow. The argument for hiding: the app's governing rule is honesty about the needle, and a needle the app can prove wrong is not information, it is misinformation wearing the same costume as the trustworthy one. A glance reads direction before text; a caption cannot unglance. The qibla case differs from navigation in one decisive way: the target is static. Maps needs continuous heading to track you; a qibla screen needs one bearing, which the number line already states and which never depends on any sensor. Hiding a provably wrong needle costs nothing the screen does not already carry.

Verdict: hide on severe, draw with a wide arc on warn. The split respects both sides: the needle only disappears when physics, not opinion, convicts it, and the number plus the physical-compass line remains on screen in every state without exception.

Exact copy, checked against the voice rules:

- SETTLING: `Finding north`
- STEADY: no hint line. The dial is the information; a permanent hint trains the eye to ignore the card. This retires "Hold the phone flat", whose trigger (raw-pair tilt sensitivity) the fused path removes, matching R6's recommendation. On the no-gyro fallback rung the tilt line returns for that rung only: `Hold the phone level for an accurate reading`
- CALIBRATING: `Move the phone in a figure of eight a few times, away from metal and magnets`
- WARN: `Magnetic interference nearby. Move away from metal and magnets and the needle will settle`
- SEVERE: `Strong magnetic interference. The needle is hidden because it would point the wrong way. Step away from metal and magnets, or line 119 degrees up with any physical compass`
- STALLED: `The compass has stopped responding. Close and reopen this screen`
- NO COMPASS: `This phone has no compass. The qibla from here is 119 degrees from north, so line that up with any physical compass`
- NO POSITION (unchanged): `Your location is not available right now`

Every line names an actor that is not the phone (interference, the compass, the location) and pairs the condition with one motion. The severe line speaks the number aloud because the needle it used to anchor is gone.

## 6. Manual correction or calibration flow

- **In-app figure-of-eight with a progress indicator.** Buildable: the completion condition is measurable (accuracy band rising, magnitude returning inside the band, dip settling). Maps ships exactly this with Low, Medium, High. Worth building only if field reports show users failing to act on the hint line; the hint plus the live arc already coach the same motion. Recommend deferring.
- **A "my compass is wrong" affordance.** As a persisted manual offset, rejected outright: it bakes today's room into every future reading at every location, and the offset that fixes Fulham breaks a clean field by the same 45 degrees. As a session-scoped sun calibration (compute the sun's azimuth, have the user face it, reset the reference), technically sound but a whole interaction for a case the severe state already routes to the physical-compass line. Recommend no manual offset of any persisted kind.
- **Deep-linking to OS calibration.** The real answers, verified from headers and docs:
  - iOS: an app cannot trigger the calibration HUD programmatically. The delegate method `locationManagerShouldDisplayHeadingCalibration` is invoked by Core Location when it wants to show the HUD, and the app consents; `dismissHeadingCalibrationDisplay` retires it early [A]. The commonly repeated claim that calling `startUpdatingHeading` summons the HUD is false; it only makes the first-request condition eligible. There is no public URL into the Compass Calibration system toggle; `App-Prefs:` scheme usage is private API and earns rejections. The correct move for this app: implement the delegate, return true, auto-dismiss after a few seconds, which is the documented pattern.
  - Android: no system calibration screen exists to link to. Calibration is continuous and invisible. Samsung's dialer diagnostic is OEM-specific and not an Intent target. The honest affordance is the app's own figure-of-eight coaching.

## 7. The degradation ladder

The bearing number is arithmetic from position alone and never depends on a sensor. It survives every rung. That asymmetry is the architecture of the honest compass.

| Rung | Condition | Drawn | Said |
| --- | --- | --- | --- |
| 0 | Position, fused heading, all detectors quiet | Dial with needle, narrow arc | Bearing line, no hint |
| 1 | Fused heading, vendor band low | Dial with needle, medium arc | Bearing plus CALIBRATING line |
| 2 | Physics warn (F, dip, variance, divergence) | Dial with needle, arc widened to the detector's implied error | Bearing plus WARN line |
| 3 | Physics severe (F ratio over 35 percent, dip over 10 degrees) | Dial face with NO needle, bearing large | Bearing plus SEVERE line |
| 4 | No rotation vector, geomagnetic rotation vector fallback | Dial with needle, wobble expected | Bearing, tilt line (this rung only) plus calibration hint |
| 5 | No magnetometer or no usable heading source | No needle, bearing prominent | Bearing plus NO COMPASS line |
| 6 | No position | Empty dial, no bearing | NO POSITION line, with the note below |

A note on rung 6: the app is London-only, and the qibla bearing across all of Greater London spans 0.71 degrees (my sweep: 118.60 to 119.31 from Heathrow to Dartford). A city-anchored fallback bearing of 119 degrees would be correct to within half a degree for every user this app has. That is an owner decision, not a design necessity, and it is flagged here because it converts the worst rung from empty to useful at the cost of one sentence.

## State machine

| State | Trigger (threshold) | Exit (hysteresis) | Needle | Arc | Copy |
| --- | --- | --- | --- | --- | --- |
| LOOKING | Sheet presented, position not yet read | Position arrives or fails | Hidden | None | `Finding your position` |
| NO POSITION | `readPosition` returns null | Represent the sheet | Hidden | None | `Your location is not available right now` |
| SETTLING | Heading stream started, fewer than 2 seconds of samples | 2 seconds of samples with any accuracy | Drawn, settling | Widest | `Finding north` |
| STEADY | All detectors quiet 3 seconds | Any detector fires | Drawn | Narrow or none | None (bearing line only) |
| CALIBRATING | Vendor band at or below 1 (iOS banded accuracy, Android `event.accuracy`) | Band at or above 2 for 3 seconds | Drawn | Medium | `Move the phone in a figure of eight a few times, away from metal and magnets` |
| WARN | Any of: F ratio beyond 0.20 for 2 s; dip beyond 5 degrees for 2 s; F spread beyond 6 microtesla over a 30-degree sweep; divergence beyond 10 degrees for 1 s under the 45 deg/s motion gate | All detectors clear for 5 seconds | Drawn | Widened to the detector's implied error | `Magnetic interference nearby. Move away from metal and magnets and the needle will settle` |
| SEVERE | F ratio beyond 0.35 for 2 s, or dip beyond 10 degrees for 2 s | Ratio and dip inside warn bounds for 5 seconds | Hidden | None | `Strong magnetic interference. The needle is hidden because it would point the wrong way. Step away from metal and magnets, or line 119 degrees up with any physical compass` |
| STALLED | No heading sample for 5 seconds while presented | A sample arrives | Frozen then hidden on state entry | None | `The compass has stopped responding. Close and reopen this screen` |
| NO COMPASS | No rotation vector and no geomagnetic fallback, or no magnetometer | Never, for this device | Never drawn | None | `This phone has no compass. The qibla from here is 119 degrees from north, so line that up with any physical compass` |

Priority order when several fire: NO COMPASS over STALLED over SEVERE over WARN over CALIBRATING over SETTLING over STEADY. Arc angles quantise to 10-degree steps so the geometry cannot flicker. The bearing line is present and identical in every state from SETTLING down.

Implementation notes for whoever executes: the detectors need `CLHeading` x, y, z and the unbanded `headingAccuracy` on iOS, which expo-location discards today, and `TYPE_MAGNETIC_FIELD` plus `TYPE_GRAVITY` beside the rotation vector on Android. All three belong in the native compass module R3 sketches, as fields on the one event the dial already consumes. The expected F and dip come from `GeomagneticField` on Android and the embedded table on iOS, resolved once per position read.

## COULD NOT VERIFY

1. The XS's actual `headingAccuracy` in the failing room. The phone is not attached to a sterile probe setup and the failure is not reproducible on demand. Inferred silent from the owner's report that Apple Maps showed no cone warning; if it did warn, the vendor signal ranks lower still.
2. Magnetometer noise floors on the XS and 3T. No quiet-room measurement was possible. The thresholds carry margins (20 percent against an expected sub-2-percent clean variation) that absorb any plausible handset noise, but the margins are computed, not measured.
3. Whether the Fulham source was tuned. The 50 to 92 percent catch band at 15 microtesla is geometry-conditional; if the source happened to sit near the pure-rotation angle, no internal detector fires and only the sun check answers. A re-test in the room with a magnitude readout would settle it; no such device session was in scope.
4. Google Maps' internal beam thresholds. No public source gives the degree values; section 4's claims stop at the signal's identity, not its cutoffs.
5. The FOP's `getHeadingErrorDegrees` behaviour on hardware without Play services. Documented to fall back to AOSP rotation vector values [P, launch post]; not measured here.
6. iOS Compass Calibration toggle deep link: confirmed absent as public API by header and doc search; the negative is supported by the absence of any documented URL scheme for it, which is weaker than a positive citation.

## Sources

| # | Grade | Source | Used for |
| --- | --- | --- | --- |
| 1 | [P] | `CLHeading.h`, iPhoneOS 27.0 SDK, read from disk | x, y, z geomagnetic microtesla; headingAccuracy semantics, negative invalid |
| 2 | [P] | `CMMagnetometer.h`, same SDK | Total field in microtesla, Earth plus device bias |
| 3 | [P] | `CLLocationManagerDelegate.h` and `CLLocationManager.h`, same SDK | Calibration HUD is consent-gated, `dismissHeadingCalibrationDisplay`, no on-demand trigger |
| 4 | [P] | `GeomagneticField.java`, Android 35 sources on disk | `getFieldStrength`, `getInclination`, `getHorizontalStrength` in nanotesla, offline |
| 5 | [P] | BGS, "An Overview of the Earth's Magnetic Field" | Surface total intensity 22,000 to 67,000 nT |
| 6 | [P] | NOAA NCEI geomagnetic calculator (`calculateDeclination`, WMM2025) | London declination 1.20325 at 2026.74, validation anchor |
| 7 | [P] | WMM2025 coefficients (NOAA publication, fetched via the pygeomag mirror `WMM.COF`, epoch 2025) and WMM2015v2 | Field model inputs; port of the NOAA legacy evaluator |
| 8 | [S] | My WMM evaluator port, validated against source 6 (1.2033 versus 1.20325) and pygeomag's Seattle doctest (15.0656 exact) | London F 49.13 uT, H 19.56, Z 45.07, dip 66.54; UK sweep F 48.4 to 51.4, dip 64.8 to 73.0; 3T stale-model errors (F 1 nT London, dip 0.08 deg) |
| 9 | [S] | My Monte Carlo simulations (20,000 to 40,000 samples per point, London field vectors) | Catch rates by bias magnitude and orientation; tuned-offset algebra (`2 H sin(deflection/2)` = 14.96 uT at 45 degrees); storm sensitivity (5 percent H gives 1.05-degree dip shift) |
| 10 | [S] | Trail Sense `QuickRecalibrationOrientationSensor.kt`, `CompassProvider.kt`, `MagnetometerExtensions.kt`, read via opensrc | Thresholds 4 deg and 60 deg/s defaults, 1 deg and 45 deg/s shipped; 1 s dwell; 40 ms motion debounce; stop/start recalibration; reference is mag-plus-accel, primary is rotation vector; 22 to 67 uT quality band with 10 percent margins |
| 11 | [S] | expo-sensors 58.0.0 source via opensrc: `MagnetometerModule.swift`, `MagnetometerUncalibratedModule.swift`, Android module Kotlin | iOS reads `CMMotionManager` total field; Android reads `TYPE_MAGNETIC_FIELD` and `TYPE_MAGNETIC_FIELD_UNCALIBRATED` |
| 12 | [S] | `node_modules/expo-location/ios/LocationModule.swift` in this repo | Heading payload sends trueHeading, magHeading, banded accuracy only; x, y, z discarded |
| 13 | [S] | My qibla bearing sweep across Greater London | 118.60 to 119.31 degrees, spread 0.71 |
| 14 | [P] | Android `SensorEvent` reference (via R3, checked consistent) | `values[4]` radians, minus 1 unavailable |
| 15 | [S] | R2, R3, R4, R6 sibling reports in this folder | expo-location internals, 3T dumpsys evidence, field reports, prior UX analysis |
