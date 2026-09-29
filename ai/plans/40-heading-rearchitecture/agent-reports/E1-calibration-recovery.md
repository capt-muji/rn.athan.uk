# E1: can the app fix a badly calibrated magnetometer

Session 40, research agent E1 round 2, 2026-09-29. Scope: app-side recovery from the measured calibration failure on the old phones.

## The direct answer

Yes, on Android, conditionally on iOS. An Android app can read the raw field and the OS's bias estimate as six values from `TYPE_MAGNETIC_FIELD_UNCALIBRATED`, fit its own hard-iron offset in about 60 seconds of guided motion, validate the fit against the expected field strength, and apply the correction itself, bypassing the vendor calibration entirely. On iOS an app can read the raw total field through `CMMotionManager`'s magnetometer service, so the same fit is buildable, but it pays more: the corrected vector cannot be fed back into `CLHeading`, so the app must own the whole heading computation. In both cases the correction fixes only the calibration component of the error. A distorted room survives any calibration, because a static external field is indistinguishable from Earth's field pointing somewhere else. The measured 104.5 uT and 84.5 uT bias are consistent with that split, and section 3 reckons with them directly.

## 1. Hard iron, soft iron, and the real fitting algorithms

**The two defects, precisely.** The phone measures `m = S(B + h)` in its body frame, where `B` is the ambient field, `h` is hard iron and `S` is soft iron [P, VectorNav primer, via D2]. Hard iron is a magnet fixed to the device: speakers, camera actuators, a case plate. It adds a constant vector to every sample and shifts the measurement locus off centre. Soft iron is permeable material that warps the ambient field: it scales and skews the sphere into an ellipsoid. Rotating a healthy phone through all orientations traces a sphere of radius `|B|` centred at `h`; hard iron moves the centre, soft iron changes the shape. Hard iron usually dominates the uncorrected error [P, VectorNav].

**Why the residual matters here.** If the correction leaves a horizontal residual `r`, the heading error is `atan(r / 19.56)` in London, so 2 uT is 6 degrees, 5 uT is 14, 8 uT is 22, 19.56 uT is 45 [S, arithmetic on D4's WMM2025 evaluation]. The 3T's stored correction is 84.5 uT. Ten percent residual in that correction is 8.5 uT, which is the 22-degree row. The observed split of 25 to 55 degrees needs a horizontal residual of 9 to 26 uT, which is 11 to 31 percent of the stored bias. A badly fitted calibration fully explains the observation without inventing anything new.

**The fitting methods.**

| Method | Maths | Samples needed | User motion | Time | Accuracy | CPU on SD820 |
| --- | --- | --- | --- | --- | --- | --- |
| Min/max per axis | `h = (max + min) / 2` per axis; per-axis scale from `max - min` | Full excursion of every axis, so hundreds of samples in practice | Rotate through all six face orientations plus twists | 30 to 60 s | Poor to fair. Bias error is bounded by spacing of extremes; sensitive to missed excitation | Negligible |
| Sphere fit, least squares (hard iron only) | Linearise `|m|² - 2h·m + (|h|² - r²) = 0` into 4 unknowns, solve 4x4 normal equations | 4 linearly independent orientations minimum, 50 to 200 well-spread points for a good fit [P, LaValle via D2] | Varied orientations, the figure eight through tilt | 20 to 60 s | Good when soft iron is small. Optimal in the least-squares sense for the centre | Accumulation is O(N), solve is one 4x4. Microseconds |
| Ellipsoid fit, Li and Griffiths 2004 | Fit the general quadric with the ellipsoid constraint by eigendecomposition of a 9x9 system, recover centre and shape matrix [P, IEEE CVPR 2004] | 9 is the algebraic minimum; 100 to 300 well-spread points in practice | Same varied orientations, stricter coverage | 30 to 90 s | Best. Recovers both hard and soft iron | One 9x9 solve plus a 3x3 symmetric eigendecomposition. Low milliseconds. FSensor ships this in portable Kotlin [S] |
| Ellipsoid fit, Merayo 2000 | Two-step algebraic scalar calibration: linear least squares for offset, then matrix recovery, no iteration [P, Meas. Sci. Technol. 11 (2000) 120-N132, DTU orbit record] | Same class as Li | Same | Same | Equivalent quality to Li on well-spread data; the standard in magnetometer practice | Same class. Two linear solves |
| Recursive or online (gradient descent, RLS, Kalman) | Continuously refine `(h, S)` against buffered samples; ysoldak/magcal runs gradient descent on a 128-sample ring buffer in float32, throttled, on embedded targets [S, source read] | Streaming; converges over minutes of ordinary varied use | None explicit, but convergence depends on the user naturally varying orientation | Minutes, background | Slightly worse than a batch fit at any instant, improves continuously | Per-step cost is tiny, but it runs always. Feasible on the 820 inside a foreground-only module |

**Feasibility on the Snapdragon 820.** All of it is feasible. The heaviest option, the full ellipsoid fit, is one 9x9 normal-equation solve and one 3x3 symmetric eigendecomposition, which FSensor implements in about 200 lines of dependency-free Kotlin [S]. R4 measured the app's per-frame budget at 16.7 ms and the dial holding 60 fps with 10 ms of headroom; a calibration fit runs once at the end of a 60-second flow, not per frame. Even in JS the fit is a one-shot sub-millisecond matrix job, though it belongs in the native module beside the sensor stream, which R3 already sketches at 120 to 180 lines.

**What the app should fit.** On Android the raw stream from type 14 already has soft-iron and temperature compensation applied [P, SensorEvent docs, verbatim below], so the app-side fit only needs the hard-iron offset, and the sphere fit is the honest match to the defect. The full ellipsoid is the fallback if validation shows residual soft iron. On iOS the raw stream has nothing applied, so the app needs the ellipsoid or at least the sphere plus a diagonal scale.

## 2. What data the app can actually get

### Android: yes, and it is the key that unlocks everything

`SensorEvent.values` for `TYPE_MAGNETIC_FIELD_UNCALIBRATED`, verbatim from the official reference [P, fetched this session]:

> Similar to `Sensor.TYPE_MAGNETIC_FIELD`, but the hard iron calibration is reported separately instead of being included in the measurement. Factory calibration and temperature compensation will still be applied to the "uncalibrated" measurement. Assumptions that the magnetic field is due to the Earth's poles is avoided.
>
> values[0] = x_uncalib, values[1] = y_uncalib, values[2] = z_uncalib, values[3] = x_bias, values[4] = y_bias, values[5] = z_bias
>
> x_uncalib, y_uncalib, z_uncalib are the measured magnetic field in X, Y, Z axes. Soft iron and temperature calibrations are applied. But the hard iron calibration is not applied. The values are in micro-Tesla (uT).
>
> x_bias, y_bias, z_bias give the iron bias estimated in X, Y, Z axes.

Confirmed live on the 3T [S, `dumpsys sensorservice`, read-only]: handle 0x00000004, `MMC3416PJ Magnetometer Uncalibrated`, type 14, max rate 52 Hz, serving exactly this six-value layout, with the bias triplet reading `(-34.34, 14.10, -75.92)` on every sample in the buffer. The permission line reads `perm: n/a`: no permission is needed beyond none at all.

Three consequences:

1. **The app can bypass the vendor's correction.** It reads the raw field, applies its own offset, and never consumes `TYPE_MAGNETIC_FIELD` (type 2) for heading. Nothing in the platform forces the vendor bias on the app.
2. **The app cannot write the OS's bias.** No public API updates it. I checked the 3T for sysfs bias nodes under `/sys/class/sensors` and `/sys/bus/iio` and found none exposed; the bias lives inside the Qualcomm HAL. Also, Android 9's sensorservice contains no calibration file at all [S, directory listing of the LineageOS lineage-16.0 mirror]: the platform's own calibration code is absent, which confirms the fit is vendor code. So the "fix the OS calibration in place" strategy reduces to triggering the vendor's re-fit through motion, while the app-side strategy replaces the consumer of the data.
3. **expo-sensors already exposes this stream.** Its `MagnetometerUncalibratedModule` subscribes to type 14 on Android and returns all six values [S, D4 source 11]. The data path needs zero new native code; only the fit and the application do.

One arithmetic check I could only partially complete. The documented relation is `calibrated = raw - bias`. At 15:26 D2 measured the calibrated stream at `(44.28, -18.86, -42.03)`, 63.9 uT, and my uncalibrated capture at 15:28 read raw `(5.09, -9.63, -130.17)` with bias `(-34.34, 14.10, -75.92)`, so `raw - bias = (39.43, -23.73, -54.25)`, 71.1 uT. Components agree within 5 uT on x and y and 12 uT on z, magnitudes within 11 percent, on samples taken two minutes apart on a desk whose field D2 measured swinging from 63.9 to 104.4 uT across an hour. Consistent with the documented relation within the desk's own variability, but not a verification. A true simultaneous capture needs a subscribing client, which the read-only rule forbids.

### iOS: raw access exists, but no bias estimate, and no way to feed a correction back into Core Location

Read from the SDK headers on disk [P, `CMMagnetometer.h`, iPhoneOS 27.0 SDK]:

> Returns the magnetic field measured by the magnetometer. Note that this is the total magnetic field observed by the device which is equal to the Earth's geomagnetic field plus bias introduced from the device itself and its surroundings.

That is the definition of an uncalibrated reading, in Apple's words. `CMMotionManager.startMagnetometerUpdates(to:)` delivers it at up to hardware rate, with no permission prompt (R2 established `CMMotionManager` is not on the motion-sensitive API list). So the iOS app can run the same hard-iron fit from the same class of data, and expo-sensors' `MagnetometerModule` already wraps this stream [S, D4 source 11].

The asymmetries against Android:

- **No bias estimate is provided.** Android's type 14 hands the app the OS's own `(x_bias, y_bias, z_bias)` for free, which is also a diagnostic. iOS offers nothing comparable; the nearest is `CMDeviceMotion.magneticField`, a `CMCalibratedMagneticField` carrying a corrected vector plus a four-state calibration accuracy enum (`uncalibrated`, `low`, `medium`, `high`) [P, `CMDeviceMotion.h`, R2 Q8]. Useful as a cross-check, not as a fit input.
- **The correction cannot reach `CLHeading`.** Core Location computes its heading inside locationd. An app-side corrected vector feeds only the app's own heading computation, which on iOS means building the tilt-compensated compass in the app: gravity from `CMMotionManager`, corrected field, rotation matrix, azimuth, declination. That is a real but bounded amount of work; the maths is the same `getRotationMatrix` equivalent R3 documents for Android.
- `CLHeading.x/y/z` exist and carry microtesla values [P, `CLHeading.h`, D4 source 1], but Apple does not document whether they are hard-iron corrected, and I found no statement either way. Treat them as calibrated-of-unknown-quality and use the `CMMotionManager` stream for any fitting.

The platform split is therefore: Android gets correction cheaply because the raw stream and the heading computation are both within reach. iOS gets it at the cost of owning the entire heading path, with the system's own recalibration (the consent-gated HUD plus continuous background fitting) as the cheaper first line.

## 3. Would an app-side calibration actually beat the OS's

**The case for the OS.** It sees data continuously, across all apps, for the life of the phone, and it fits whenever the user generates orientation diversity. A vendor fit that had months of varied motion in clean air is better than anything a 60-second guided flow produces. Google's instruction ("move your phone in a figure 8 motion a few times. This should immediately result in a more accurate direction") works because the OS re-fits, not because the gesture is magic [P, via D2].

**The case against, on this device, measured.** The 3T's stored bias is 84.5 uT, which is 1.72 times Earth's entire field in London, and it has been bit-identical across every capture for over 100 minutes [S, D1 at 16:16 and 16:31, mine at 15:28]. A phone lying on a desk generates no orientation diversity, so the vendor fit has had nothing to update from. Its 84.5 uT estimate is therefore old by construction, and its magnitude says it was fitted either in a badly disturbed field or against a magnet that may since have moved. Meanwhile the AOSP software fusion that would gate at 10 to 100 uT sits disabled with 0 clients [S, D2], so nothing downstream rejects the result.

**The honest reckoning with 104.5 uT.** The calibrated magnitude alone does not convict the calibration. Calibration removes device-fixed fields; it cannot remove the desk's field, so a perfect calibration still reads 104.5 uT if the desk genuinely supplies it. The evidence that splits the two is the bedroom: four newer phones read correct at the same spot, which bounds the room's distortion there as mild, so the old phones' errors in that room must be mostly their own calibration [S, D1 and D5's reasoning]. On the desk, the two causes stack. This matters for the design: a recalibration performed on that desk fits an ellipsoid in a field whose magnitude varies by tens of uT across tens of centimetres [P, Li 2012 via D2], which corrupts the fit itself. The guided flow must either move somewhere cleaner or detect and refuse.

**The app's structural advantages, which are real.**

1. **The app knows the expected field.** The OS's vendor fit has no knowledge of `|B|`; it fits whatever sphere it sees, at whatever radius. The app has WMM2025 via `GeomagneticField` on Android and D4's embedded table on iOS, so it can validate the fitted radius against 49.1 uT and reject a fit performed inside a disturbance. Nothing shipped does this: D4 surveyed every vendor trigger and found only self-assessment.
2. **The app can require coverage.** The OS fits opportunistically on whatever motion happens to occur. A guided flow tracks orientation diversity explicitly and does not finish until the sphere is covered.
3. **The app can validate after the fact** by the spread of `|corrected|` across orientations: a residual hard-iron offset makes the magnitude swing by twice its horizontal component as the phone rotates (D4's detector 3), so a fit that leaves more than about 2 uT of spread is a failed fit and can be refused.

**What real implementations do.** Graded from source:

- **Trail Sense**, the best-regarded open Android compass, ships no fit of its own. Its "calibrate compass" dialog plays an animation of a phone tracing a figure eight (`CompassCalibrationView`, a CanvasView drawing a Lissajous-ish eight with a phone glyph) and relies on the OS to re-fit; its calibration-adjacent engineering goes into source selection, quality bands from field strength, and the divergence-triggered sensor restart [S, `CalibrateCompassFragment.kt` and `CompassCalibrationView.kt` read this session; D4's `QuickRecalibrationOrientationSensor` read].
- **Google Maps** likewise teaches the motion and lets the OS fit [P, blog via D2/D6].
- **FSensor** (Apache 2.0, Kotlin multiplatform) ships the full algebraic ellipsoid fit, `FitPoints`: builds the 9-column design matrix of the quadric, solves the 9x9 normal equations, forms the algebraic matrix, finds the centre, eigendecomposes a 3x3 to get radii [S, `fsensor/src/commonMain/kotlin/com/tracqi/fsensor/math/offset/FitPoints.kt` read this session].
- **ysoldak/magcal** (Go, MIT) ships a continuous gradient-descent calibrator over a 128-sample buffer in float32, designed for embedded devices, with state serialisable to flash [S, `magcal.go`, `buffer.go` read this session].
- **MAGYC** (2023, compas-docs) is the academic state of the art for joint magnetometer-plus-gyroscope online calibration [P, project page found; methods not read in depth].

So the shipped-app norm is to coach the OS, and the fits live in libraries and embedded products. An app-side fit is uncommon but not exotic, and every ingredient is verified present on both platforms.

**Verdict.** On a phone whose vendor calibration is provably stale and unrefreshed, a 60-second guided fit with coverage tracking, expected-radius validation and post-fit spread validation beats what the OS has, because what the OS has is months old and 84.5 uT deep. On a phone with a healthy vendor fit, the app-side fit adds nothing and should not run. The detectors decide which phone is which.

## 4. The guided calibration flow, designed concretely

**Trigger.** D4's detectors fire: field magnitude beyond 20 percent of expected for 2 seconds, or the variance detector on a 30-degree sweep. The screen enters WARN and offers "Recalibrate".

**Environment gate, before any motion.** Read the calibrated magnitude for 3 seconds at rest. Above roughly 70 uT or below 35, the flow refuses to start and says so: calibrating inside a disturbance fits the disturbance. This is the single most important guard, and it exists because the app knows the expected field and the OS does not. On this desk it would refuse, correctly.

**The motion.** The figure eight is the taught gesture, but the requirement is orientation diversity, not the shape [P, LaValle via D2]. The flow asks for the rotate-about-three-axes sequence, which covers the sphere better than a planar eight: hold the phone flat and yaw a full circle, then pitch it onto each face in turn while continuing to turn, which is the pattern both Google's and Apple's calibration HUDs animate. Practically: 3 slow full circles flat, 3 with the phone on its side each way, 1 with the phone face down and face up, 30 to 60 seconds total.

**Live feedback.** A sphere-coverage indicator: bin accepted samples into the cells of an icosahedron or a coarse 4x4x4 orientation grid of the unit vector direction, light up covered bins, finish when coverage passes a threshold and the minimum sample count (about 100) is met. Beside it, the running spread of `|raw - running_offset|` as the quality number.

**The fit.** On completion, solve the sphere least squares for `h` (Android; type 14 raw minus nothing, since the raw stream is already soft-iron corrected) or the Li/Griffiths ellipsoid for `(h, S)` (iOS, or Android when validation below fails). Batch, one shot, in the module.

**Validation, three gates, all must pass.**

1. Fitted radius within 15 percent of the expected field (49.1 uT in London). Outside that, the fit ran in a disturbance: reject, tell the user to move away from metal and large electronics.
2. Post-fit residual: the spread of `|corrected|` across the collected samples below 4 uT, which bounds the residual horizontal offset to about 2 uT, which is the 6-degree row of the table.
3. Offset sanity: the fitted `|h|` compared against the OS-reported bias on Android (type 14 values 3 to 5). Wild disagreement between the app's fit and the OS's stored estimate is itself information about which one is stale.

**The displayed quality metric.** One number: residual field spread in microtesla, mapped to plain language. Under 2 uT reads "calibrated", 2 to 4 reads "usable", refused fits read "too much interference here". Degrees are the user-facing translation of the residual via the atan table, and 2 uT means "within about 6 degrees", which is honest without overclaiming.

**Persistence.** Store the offset vector, the soft-iron matrix if fitted, the residual metric, the timestamp and the fitting location's expected field in MMKV under a `preference_compass_calibration_*` key family, matching the store pattern. Re-validate on every qibla open: the detectors already re-check the magnitude, and a stored calibration older than the phone's last case change or magnet event is suspect. Discard whenever the detectors go quiet for a session and the stored offset disagrees with a fresh healthy OS bias on Android; the OS's own fit, when it runs in clean air, is the better long-term owner of the correction.

**The silent-failure rule.** A calibration that stores without validating is worse than none, because it converts a visible wobble into a confident wrong needle (R4's quiet killer). The three gates above are the contract: no stored calibration without a passed radius, a passed residual and a sane offset.

## 5. Detect-and-warn versus detect-and-correct

D4's detectors (magnitude versus expected, dip, variance across orientations, divergence) cost one parallel sensor subscription and a few comparisons, and they are already specified. The question is what happens when they fire.

| | Detect-and-warn | Detect-and-correct |
| --- | --- | --- |
| User gets | An honest apology and the bearing number with a "line it up with any physical compass" line | A working needle after 60 seconds of motion |
| Implementation cost | D4's design, pure addition to the module R3 sketches | The full section 4 flow: environment gate, coverage UI, fit, validation, persistence, application path |
| Fixes | Nothing. Converts silent wrongness into honest wrongness | The calibration component: the 84.5 uT stale bias class |
| Cannot fix | The room, tuned disturbances, the stubbed-HAL family (R6) | The room, tuned disturbances, and any phone whose raw stream itself is broken |
| Risk | None beyond false positives, which D4's thresholds bound | A bad fit stored confidently. Mitigated by the three gates; the failure mode is real and must be engineered against, not assumed away |
| Owner's requirement | Fails it: "the compass should WORK" | Meets it on the failure class this session measured |

The owner's brief is explicit that apologising is not the goal, and the measurement says correction is achievable on the failure class observed: a stale, unrefreshed, oversized hard-iron estimate. But the honest boundary is: correction fixes the phone, never the room. If D5's decisive test lands on "the room is pulling every phone", no calibration fixes that, and detect-and-warn plus the physical-compass line is the whole truth available. Ship the detectors regardless; they decide when correction is even eligible.

## 6. The self-calibrating alternative: gyro-anchored heading

The idea: anchor the heading once by any trusted means, then integrate the gyro and ignore the magnetometer entirely. The gyro is immune to magnetic distortion, so a phone whose magnetometer cannot be trusted at all keeps a true needle for as long as the integration stays honest.

**Drift numbers, measured.** A 2023 laboratory study ran 4-hour static Allan-variance tests on five modern smartphones [P, "Smartphone MEMS Accelerometer and Gyroscope Measurement Errors", Sensors/PMC10490716]. Gyro bias instability, the floor after ideal bias removal:

| Phone | Mean bias instability | In degrees per minute |
| --- | --- | --- |
| Google Pixel 7 Pro | 0.0000096 rad/s | 0.033 |
| Samsung SM-A536V | 0.0000105 rad/s | 0.036 |
| iPhone XR | about 0.00009 rad/s (worst axis 0.000162) | 0.31 mean, 0.56 worst axis |
| Vivo X60 Pro | 0.000134 rad/s | 0.46 |

So modern phone gyros hold 2 to 28 degrees per hour, which is 0.03 to 0.46 degrees per minute. The practical figure is worse than the Allan floor because the anchor's own bias estimate is imperfect, and better than raw bias because anchoring at rest removes the static offset first. Budget an honest 0.1 to 1 degree per minute drift on a modern phone after a rest-anchored start. The 3T's LSM6DS3 datasheet states the zero-rate level "changes very little over temperature and time" [P, DocID026899], and consumer-MEMS IMUs are classed at 1 to 100 degrees per hour [W, Firgelli estimator class], consistent with the measured band.

**The trap I measured on the 3T.** The uncalibrated gyro stream's stored drift estimate reads `(-0.02, 0.01, -0.02)` rad/s [S, dumpsys this session], which is 69 degrees per minute on z if left uncompensated. The calibrated stream subtracts it. So a gyro-anchored implementation must use the calibrated gyro or estimate the bias itself by averaging at rest; integrating the raw stream is fatal within a minute. One stored number, and the difference between a fallback and a fraud.

**How long an anchor survives.** At 0.5 degree per minute, the heading stays within 2 degrees for 4 minutes and within 5 degrees for 10 minutes. A qibla reading is a 10-second to 2-minute interaction, so a gyro-anchored session is comfortably inside budget on drift. The anchor is the hard part: if the magnetometer is untrusted, the trusted source must be the user. Two workable anchors: face a known direction (a street, the sun at a computed azimuth, R6's sun check) and press "I am facing X", or lay the phone flat aligned with any physical compass. Both are one interaction.

**Verdict.** A genuine fallback for a phone whose magnetometer is beyond repair, and the natural degradation rung below SEVERE: anchor once, track for minutes, show a drift countdown so the user knows when to re-anchor. Not the primary fix, because it converts a self-updating compass into a session-scoped one, and the calibration route fixes the measured failure class without that cost.

## 7. The comparison table the owner asked for

| Approach | What it fixes | What it cannot fix | User effort | Implementation cost here | Platform support | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| OS calibration only (today plus coaching) | Nothing new. The figure-eight hint sometimes triggers the vendor re-fit | The stale bias while the phone is still; the room; tuned disturbances; stubbed HALs | None to 20 s | Zero, it ships | Both | The measured failure: confident 25 to 55 degree error |
| Fused rotation vector (row 40 sensor swap) | Wobble, transient disturbance rejection, honest `values[4]` where populated | The calibration, because fusion consumes the same calibrated magnetometer (D2 section 4). The room | None | R3's module, 120 to 180 lines Kotlin, iOS unchanged | Android 9 has all sensors; gyro-less phones need the geomagnetic fallback rung | Low. Smoothness can mask a wrong reference (R4) |
| Detect-and-warn only (D4) | Honesty. Silent wrongness becomes visible wrongness | The heading itself | None | Detector fields on the same module event; the D4 state machine | Both, given magnitude and dip fields | Low. False positives bounded by thresholds |
| App-side hard-iron fit (sphere) | The stale 84.5 uT bias class, which is the measured defect on the 3T | Soft iron; the room; tuned disturbances; stubbed raw streams | 60 s guided motion, with environment gate | Section 4 flow. On Android: type 14 subscription plus fit plus persistence, roughly 150 to 250 lines in the module R3 sketches plus a sheet UI. On iOS: the same plus owning the full heading path, several hundred lines | Both platforms' raw access verified present | A bad fit stored confidently. Contained by the three validation gates |
| App-side full ellipsoid (Li or Merayo) | Hard iron plus soft iron, the complete device-fixed error | The room; tuned disturbances | Same 60 s, stricter coverage | The FSensor fit is Apache 2.0 and portable [S]; integrate or reimplement, plus everything above | Same | Same as sphere fit, plus more parameters to overfit on sparse coverage. Only worth it if validation shows per-axis radii beyond a few percent apart |
| Gyro-anchored heading | Any magnetometer failure at all, including unfixable hardware, for minutes | Drift beyond about 10 minutes; needs a trusted anchor once | One anchor interaction | Gyro subscription plus anchor UI and drift countdown, about 100 to 150 lines native plus UI | Both (CoreMotion gyro on iOS is bias-compensated) | Integrating an uncorrected bias is 69 deg/min on this device. Must use the calibrated gyro or rest-average the bias |

**Recommendation.** Ship the layered stack, in this order of investment. First, the row-40 rotation-vector swap with D4's detectors on the same event: honest, cheap, and the detectors are what make everything else decidable. Second, the guided recalibration flow of section 4 with the app-side sphere fit on Android, validated by the expected field and the residual spread, stored in MMKV, refused wherever the environment gate fails: this is the piece that makes old phones work, and Android is where the raw-plus-bias stream makes it cheap. Third, on iOS, implement the consent-gated calibration HUD delegate and the same detectors first, and defer the app-side fit until the Android flow proves the UX, because iOS demands owning the whole heading path for the same payoff. Fourth, the gyro-anchored rung as the SEVERE fallback with a drift countdown.

**The runner-up and its winning condition.** The app-side full ellipsoid beats the sphere fit if and only if the fleet's old phones show residual soft iron after a sphere fit, which the validation gates measure directly as per-axis radius ratios and post-fit spread. Ship the sphere fit first, let its own validation tell you whether the ellipsoid earns its extra parameters.

## COULD NOT VERIFY

1. **`calibrated = raw - bias` on simultaneous samples.** The uncalibrated buffer froze at 15:28 when its client (a third-party qibla app) disconnected, and the read-only rule forbids subscribing my own client. Tried: paired captures at the closest available timestamps, cross-checked against D2's 15:26 calibrated reading. Result: component agreement within 5 uT on x and y, 12 uT on z, magnitude within 11 percent, consistent with the documented relation inside the desk's measured variability. A one-line logging addition in any future dev build settles it exactly.
2. **Whether the 3T's 84.5 uT bias is stale-and-wrong versus a faithful description of a real attached magnet.** Distinguishing requires moving the phone (D5's decisive test) or a case removal, both outside a read-only session. The desk's 104.5 uT is consistent with either cause; the bedroom's four correct phones are the evidence that implicates the old phones, not the desk, for that room.
3. **The exact fusion inside the Qualcomm HAL and its fit-update policy.** Closed vendor code; Android 9's sensorservice contains no calibration source to read [S, directory listing]. Tried: AOSP mirrors (googlesource returned 503; GitHub mirror listing confirmed the file set), sysfs probe for bias nodes (none exposed).
4. **iOS `CLHeading.x/y/z` corrected-or-raw status.** Apple documents the fields as geomagnetic microtesla but not their correction state. Tried: header grep for the discussion text (the property comments carry no statement), developer-doc fetch (empty). The `CMMotionManager` magnetometer service is documented raw and is the fitting input regardless.
5. **A measured Allan-variance drift figure for the 3T's own LSM6DS3 in situ.** Needs a logged static capture, which needs an app. Bounded by the datasheet's stability language [P] and the measured-phone band from PMC10490716.
6. **Any shipped production app that performs its own hard-iron fit in-app.** Found libraries (FSensor, magcal) and academic systems (MAGYC), and confirmed Trail Sense and Maps deliberately do not. Searched via tinyfish and opensrc. Absence of a found example is not proof of absence; the building blocks are all verified present regardless.

## Sources

| Claim | Source | Grade |
| --- | --- | --- |
| Type 14 returns raw plus bias as values 0 to 5; soft iron and temperature applied, hard iron not; permission-free | Android `SensorEvent.values` reference, developer.android.com, fetched 2026-09-29 | [P] |
| Type 14 live on the 3T: 6 values, bias `(-34.34, 14.10, -75.92)` on every sample, max 52 Hz, `perm: n/a`; calibrated stream 104.4 uT; gyro uncalibrated bias `(-0.02, 0.01, -0.02)` rad/s; sysfs has no bias nodes; third-party app is the active mag client | `adb shell dumpsys sensorservice` on 8f7ada76, read-only, this session | [S] |
| Android 9 sensorservice contains no calibration implementation (fit is vendor HAL code) | Directory listing of LineageOS lineage-16.0 `frameworks/native/services/sensorservice` via GitHub API | [S] |
| iOS raw magnetometer is the total field including device bias | `CMMagnetometer.h`, iPhoneOS 27.0 SDK on disk, verbatim | [P] |
| `CMCalibratedMagneticField` carries corrected field plus accuracy enum; no bias estimate on iOS; `CLHeading.x/y/z` semantics | `CMDeviceMotion.h`, `CLHeading.h` (R2 and D4 header reads, consistent) | [P] |
| expo-sensors exposes type 14 on Android and `CMMotionManager` magnetometer on iOS | D4 source 11, expo-sensors 58.0.0 module sources | [S] |
| Ellipsoid-specific least-squares fitting method and maths | Li and Griffiths, "Least squares ellipsoid specific fitting", IEEE CVPR 2004 | [P] |
| Two-step algebraic scalar calibration of vector magnetometers | Merayo et al., Meas. Sci. Technol. 11 (2000), DTU | [P] |
| Full algebraic ellipsoid fit implemented in portable Kotlin: 9x9 normal equations, 3x3 symmetric eigendecomposition | FSensor `FitPoints.kt`, read via opensrc this session, Apache 2.0 | [S] |
| Continuous gradient-descent calibration over a 128-sample float32 buffer, state serialisable to flash | ysoldak/magcal `magcal.go`, `buffer.go`, README, read via opensrc this session | [S] |
| Trail Sense ships no own fit; the calibrate dialog is a figure-eight teaching animation; reliance on OS plus quality bands | `CalibrateCompassFragment.kt`, `CompassCalibrationView.kt`, read via opensrc this session | [S] |
| Four-point minimum for a fit, hundreds for a good one; hard versus soft iron definitions; hard iron dominates | LaValle (Meta) and VectorNav primers, via D2, primary sources | [P] |
| Phone gyro bias instability 2 to 28 deg/hr (0.03 to 0.46 deg/min) across Pixel 7 Pro, A53, iPhone XR, Vivo X60 Pro; OnePlus 7 Pro BMI160 measured; 4-hour Allan method | "Smartphone MEMS Accelerometer and Gyroscope Measurement Errors: Laboratory Testing and Analysis", Sensors 2023, PMC10490716, Tables 3 and 5 | [P] |
| LSM6DS3 zero-rate level changes very little over temperature and time | ST LSM6DS3 datasheet DocID026899, section 4.6.2, fetched this session | [P] |
| Consumer MEMS IMU drift class 1 to 100 deg/hr | Firgelli drift estimator page | [W] |
| London expected field F 49.13 uT, H 19.56 uT, dip 66.5 deg | D4's WMM2025 evaluation, validated against NOAA | [S] on [P] coefficients |
| Heading error is `atan(residual / H)`; the 2/5/8/19.56 uT table | Standard e-compass arithmetic, consistent with NXP AN4248 formulation (via D1/D2) | [P] |
| AOSP fusion gates 10 to 100 uT; fusion consumes the calibrated sensor; the desk field 63.9 to 104.4 uT across an hour | D1 and D2 primary reads and measurements | [S] |
| The 25 to 55 degree honest error band; the four-correct-phones bedroom evidence; the calibrate-and-watch decisive test | D5 | [S] |
| Detector thresholds, expected-field sourcing, state machine, degradation ladder | D4 | [S] design |
| Rotation-vector module sketch, lines estimate, sensor inventory, remap and declination handling | R3 | [S] |
| iOS passthrough, HUD delegate consent pattern, deployment floor | R2 | [P]/[S] |
| Silent confident error under fusion; shipped filter survey | R4 | [S] |
