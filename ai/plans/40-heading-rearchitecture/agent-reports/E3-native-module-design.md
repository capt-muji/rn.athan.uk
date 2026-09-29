# E3: the native module, specified

Session 40, engineering-design agent E3. Scope: turn R1's recommendation into a buildable module. The physics, the version matrix and the detection thresholds belong to siblings; everything here is contract, code and cost. Grades: [P] official documentation or platform SDK, [S] read from source or measured this session, [W] blog or forum, [U] unverified. Sibling-report claims I relied on without re-deriving are marked [S-sib].

## Architecture in five lines

1. One local Android-only Expo module, `modules/compass`, in the `modules/widgetrefresh` shape: a `ModuleDefinition` carrying `Events("headingDidUpdate")`, `Function("getStatus")`, `Function("configure")`, and sensor registration in `OnStartObserving` / `OnStopObserving`.
2. Kotlin registers `TYPE_ROTATION_VECTOR` at `SENSOR_DELAY_GAME` (50 Hz) with `TYPE_MAGNETIC_FIELD` and `TYPE_MAGNETIC_FIELD_UNCALIBRATED` beside it for the honesty diagnostics, falls back to `TYPE_GEOMAGNETIC_ROTATION_VECTOR` flagged unfused, and emits one bundle per sample: true heading, magnetic heading, accuracy band, `values[4]`, field magnitudes, dip, and a divergence reference.
3. iOS changes nothing: it stays on `expo-location`'s `CLHeading`, and the contract's nullable diagnostics let one JS honesty layer serve both platforms. The `CMMotionManager` alternative is specced below and parked behind one named measurement.
4. Physics runs native, policy runs JS: the module translates sensors into fields, and the dwell, hysteresis and variance state machines D4 designed live in `shared/` where Jest replays recorded 3T samples.
5. The display filter stays a Reanimated worklet on the UI thread (R4's design, reaffirmed in section 4). The calibration seam E1 needs is one optional `correctionBias` in `configure`, droppable whole if E1 concludes correction is not viable.

## 1. The TypeScript contract

The module's JS binding, `modules/compass/index.ts`, following the `widgetrefresh` lazy-resolution pattern:

```typescript
/**
 * JS binding for the native compass (modules/compass).
 *
 * Android only: every other resolution answers null and the caller stays on
 * the expo-location path, so callers need no platform branch at this layer.
 * The platform split lives in device/qibla.ts, the sanctioned seam.
 */

/** Which heading source the device offers */
export type CompassSource = 'fused' | 'geomagnetic' | 'none';

export interface CompassStatus {
  available: boolean;
  source: CompassSource;
}

/**
 * Position and correction, both optional.
 *
 * Without a position the heading is magnetic-north only (declination 0) and
 * the expected-field detectors fall back to the global 25 to 65 uT band.
 */
export interface CompassConfigure {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  /** E1's refined hard-iron bias in microtesla, device frame; omit to clear */
  correctionBias?: { x: number; y: number; z: number } | null;
}

/**
 * One heading sample. Degrees are clockwise, [0, 360). NaN-able diagnostics
 * arrive as null after the binding maps them; each null means "this device
 * does not fill the field", never "the value was zero".
 */
export interface HeadingSample {
  /** True-north heading: magnetic heading plus declination when configured */
  heading: number;
  /** Magnetic-north heading; the divergence detector consumes it */
  magneticHeading: number;
  /** Sensor timestamp, nanoseconds on the elapsedRealtime clock */
  timestamp: number;
  /** Vendor calibration band per sample: 3 high, 2 medium, 1 low, 0 unreliable, -1 no contact */
  accuracy: number;
  /** Rotation vector values[4] as degrees; null unless strictly positive (the 3T reports 0.00, so always null there) */
  headingAccuracyDeg: number | null;
  /** Calibrated field magnitude in microtesla; D4's rank 1 detector */
  fieldUT: number | null;
  /** Uncalibrated field magnitude in microtesla; E1's fit input */
  rawFieldUT: number | null;
  /** Magnitude of the OS hard-iron bias the uncalibrated stream reports */
  biasUT: number | null;
  /** Dip of the measured field, degrees below horizontal; D4's rank 2 detector */
  dipDeg: number | null;
  /** Accelerometer-plus-magnetometer heading computed in-module; D4's rank 4 divergence reference */
  referenceHeading: number | null;
  /** The reference recomputed with correctionBias; null when no correction is set */
  correctedReferenceHeading: number | null;
}

export const getCompassStatus = (): CompassStatus => { /* section 2 */ };
export const configureCompass = (options: CompassConfigure): void => { /* section 2 */ };
export const watchHeadingSamples = (onSample: (sample: HeadingSample) => void): (() => void) => { /* section 2 */ };
```

Error cases, stated exhaustively because the event stream has none of its own:

- No rotation vector and no geomagnetic fallback: `getCompassStatus()` answers `{ available: false, source: 'none' }`, `watchHeadingSamples` subscribes and never fires, and the stop function is a no-op. D4's NO COMPASS rung renders from the status alone. No exception crosses the bridge.
- Sensors vanish mid-session (thermal or HAL fault): the stream goes silent, not wrong. D4's STALLED state (5 s of silence while presented) is the designed consumer.
- `configure` without coordinates: legal, declination stays 0, diagnostics fall to the global band. `configure` with only a correctionBias: legal, position untouched.
- The module absent (iOS, or a stripped build): the binding resolves null and every export degrades to `{ available: false, source: 'none' }` and a no-op watch, exactly the `widgetrefresh` contract.

The app-level seam, `device/qibla.ts`, keeps its current public shape (`watchHeading(onHeading)` returning a stop function) and gains the platform branch: Android resolves the module and folds `HeadingSample` into the existing `HeadingReading` plus the honesty inputs; iOS keeps `Location.watchHeadingAsync` and maps `CLHeading` into the same `HeadingSample` with `fieldUT`, `rawFieldUT`, `biasUT`, `dipDeg`, `referenceHeading` and `correctedReferenceHeading` all null, because expo-location discards the x, y, z that would fill them [S-sib R2]. One honesty layer then serves both platforms by consuming nulls as "not measured here".

## 2. The Android implementation

### 2.1 Registration: which sensors, at what rate

| Sensor | Registered | Rate | Why |
| --- | --- | --- | --- |
| `TYPE_ROTATION_VECTOR` (11) | always, primary | `SENSOR_DELAY_GAME` (20,000 us, 50 Hz) | The platform-blessed compass: gyro-fused, magnetic-north referenced [P-sib R3]. 50 Hz gives one sample per animation frame with margin [S-sib R3] |
| `TYPE_MAGNETIC_FIELD` (2) | when present | 50 Hz requested (3T cap 52 Hz) | Calibrated magnitude feeds D4's rank 1 and rank 2 detectors |
| `TYPE_MAGNETIC_FIELD_UNCALIBRATED` (14) | when present | 50 Hz requested | Raw field and OS bias feed E1's correction and D4's rank 3 variance detector |
| `TYPE_GEOMAGNETIC_ROTATION_VECTOR` (20) | only when 11 is absent | 50 Hz requested (3T cap 52 Hz) | The no-gyro fallback, flagged unfused, D4 rung 4 |

Never `TYPE_ORIENTATION` (deprecated since API 3) and never `TYPE_GAME_ROTATION_VECTOR` (no north reference). Verified on the 3T this session: all four candidate types exist, rotation vector spans 5 to 200 Hz, both magnetometers cap at 52 Hz [S, dumpsys]. The two magnetometer subscriptions add no physical sensor activation on this hardware: the QTI sensor hub already consumes the MMC3416PJ for the fusion, so the marginal cost is two more event dispatch paths at 50 Hz each.

`HIGH_SAMPLING_RATE_SENSORS` is not needed: the 200 Hz cap concerns rates above GAME [P-sib R3]. No manifest entry, no permission, no `app.json` change. Autolinking needs nothing either: both existing local modules are discovered from the default `modules/` directory without any `app.config.ts` entry [S, verified this session].

### 2.2 The full maths

Per primary sample, in `onSensorChanged`. The six-step pipeline R3 verified against the API 28 `SensorManager.java` source, with the remap and the normalisation the incumbent gets wrong:

```kotlin
private fun computeHeading(event: SensorEvent) {
    // Step 1: rotation vector (quaternion as x*sin(t/2), y*sin(t/2), z*sin(t/2), cos(t/2))
    // into a device-to-world rotation matrix
    val r = FloatArray(9)
    SensorManager.getRotationMatrixFromVector(r, event.values)

    // Step 2: remap for the screen's rotation. Portrait-locked does NOT excuse this:
    // a landscape-natural device still reports ROTATION_0 while its natural frame is rotated
    val (xAxis, yAxis) = remapAxes(displayRotation)
    val screenR = FloatArray(9)
    SensorManager.remapCoordinateSystem(r, xAxis, yAxis, screenR)

    // Step 3: Euler extraction; orientation[0] is azimuth in (-pi, pi], magnetic north
    val orientation = FloatArray(3)
    SensorManager.getOrientation(screenR, orientation)

    // Step 4: radians to degrees
    val magneticDeg = Math.toDegrees(orientation[0].toDouble())

    // Step 5 and 6: normalise, then add East-positive declination.
    // Kotlin's % keeps the dividend sign; without the double mod a negative
    // declination ships a negative heading (the calcTrueNorth bug, LocationModule.kt:691)
    val headingDeg = normalise360(magneticDeg + declinationDeg)
    ...
}

private fun normalise360(deg: Double): Double = ((deg % 360.0) + 360.0) % 360.0

private fun remapAxes(rotation: Int): Pair<Int, Int> = when (rotation) {
    Surface.ROTATION_90 -> SensorManager.AXIS_Y to SensorManager.AXIS_MINUS_X
    Surface.ROTATION_180 -> SensorManager.AXIS_MINUS_X to SensorManager.AXIS_MINUS_Y
    Surface.ROTATION_270 -> SensorManager.AXIS_MINUS_Y to SensorManager.AXIS_X
    else -> SensorManager.AXIS_X to SensorManager.AXIS_Y
}
```

`displayRotation` is read once per registration from the current activity (`(context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay?.rotation ?: Surface.ROTATION_0`), which is `ROTATION_0` forever in this portrait-locked app; the full mapping exists so a landscape-natural device cannot silently read 90 degrees off [P-sib R3, javadoc]. `defaultDisplay` is deprecated on API 30+ and still functional on the Find X8's Android 15; the suppression carries a why-comment.

Declination and the expected field come from `configure`, never from a location read inside the module, so the module holds no permission at all:

```kotlin
fun configure(options: ConfigureOptions) {
    if (!options.latitude.isNaN() && !options.longitude.isNaN()) {
        val field = GeomagneticField(
            options.latitude.toFloat(),
            options.longitude.toFloat(),
            options.altitude.toFloat(),
            System.currentTimeMillis(),
        )
        declinationDeg = field.declination.toDouble()
    }
    correctionBias = options.asBiasFloatArray() // null when any component is missing
}
```

`GeomagneticField` is offline, coefficient-compiled, and on the 3T carries WMM-2015 extrapolated roughly 0.4 degrees low in London today [S-sib R3]. That error is an order below every threshold in the design and nothing the app can fix; the module takes it as-is.

The diagnostics per sample, all from data already in hand:

```kotlin
// World-up in device coords is the third row of the UNREMAPPED matrix; gravity points opposite
val down = floatArrayOf(-r[6], -r[7], -r[8])

// Dip: angle of B below horizontal, computable in the device frame with no Earth transform.
// London expects 66.5 deg (D4); a 45-deg untuned disturbance typically shifts it 3 to 17 deg
val dipDeg = latestMag?.let { mag ->
    val b = mag.magnitude()
    if (b > 0f) Math.toDegrees(asin(clamp(mag.dot(down) / b, -1.0, 1.0))) else Double.NaN
} ?: Double.NaN

// Divergence reference: the classic accelerometer-plus-magnetometer heading, computed
// beside the fused one. Gravity derived from the fused matrix, so a yaw-stuck fusion
// tilts both; the detector targets the yaw-offset firmware family, not tilt faults
val referenceDeg = computeReference(r, latestMag)
val correctedReferenceDeg = correctionBias?.let { bias ->
    computeReference(r, latestUncalibrated?.subtract(bias))
}

private fun computeReference(r: FloatArray, mag: FloatArray?): Double? {
    if (mag == null) return null
    val gravity = floatArrayOf(r[6] * 9.81f, r[7] * 9.81f, r[8] * 9.81f)
    val ref = FloatArray(9)
    if (!SensorManager.getRotationMatrix(ref, null, gravity, mag)) return null
    val o = FloatArray(3)
    SensorManager.getOrientation(ref, o)
    return normalise360(Math.toDegrees(o[0].toDouble()))
}
```

The emitted bundle, one per primary sample at 50 Hz, unavailable doubles as NaN (the binding maps NaN to null):

```kotlin
sendEvent(
    "headingDidUpdate",
    bundleOf(
        "heading" to headingDeg,
        "magneticHeading" to magneticDeg,
        "timestamp" to event.timestamp,          // ns, elapsedRealtime basis
        "accuracy" to event.accuracy,            // per-sample band, always populated
        "headingAccuracyDeg" to acc4Deg,         // values[4] in degrees when > 0, else NaN
        "fieldUT" to fieldUT,                    // NaN before the first magnetometer sample
        "rawFieldUT" to rawFieldUT,
        "biasUT" to biasUT,
        "dipDeg" to dipDeg,
        "referenceHeading" to referenceDeg,
        "correctedReferenceHeading" to correctedReferenceDeg,
    ),
)
```

No throttle, no 2-degree gate. The incumbent's throttle existed to tame a 5 Hz raw pair's jitter [S, LocationModule.kt:654-658]; a fused 50 Hz stream with a worklet filter needs no such gate, and a gate would only hide samples from the detectors. Payload is about 150 bytes at 50 Hz, 7.5 KB/s across the bridge, beside a dial that already holds a 16.7 ms median frame gap on a heavier JS-fed stream [S-sib, session 37].

Reading `TYPE_MAGNETIC_FIELD_UNCALIBRATED` alongside costs one more dispatch path and no new hardware, and it is the only source of the OS bias E1's fit needs. Measured on the 3T this session: uncalibrated events arrive as six values (field, then bias) at 50 Hz when requested, with the stored bias steady at (-34.3, 14.1, -75.9), magnitude 84.5 uT [S, dumpsys]. On a device returning only three values the bias fields emit NaN and everything downstream degrades honestly.

### 2.3 The fallback ladder

```kotlin
val primary = sensors.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
    ?: sensors.getDefaultSensor(Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR)
```

- Rung 0, rotation vector present (the 3T, the X8, every phone with a gyro): `fused: true`, D4 rungs 0 to 3 apply.
- Rung 4, only the geomagnetic rotation vector (gyro-less budget phones; the CDD makes it optional): same maths, same payload, status reports `source: 'geomagnetic'`, and D4's rung-4 copy ("Hold the phone level...") renders from the status, not from a flag on each sample.
- Rung 5, neither sensor: `source: 'none'`, no registration happens, the NO COMPASS state renders. `registerListener` with a null sensor silently does nothing [P-sib R3], so the explicit null check is the difference between an honest state and a dead stream.

### 2.4 Lifecycle

```kotlin
OnStartObserving { start() }          // first JS listener attaches: register sensors
OnStopObserving { stop() }            // last listener detaches: unregister
OnActivityEntersBackground { pauseForBackground() }   // unregister, remember intent
OnActivityEntersForeground { resumeFromBackground() } // re-register only if still observed
```

A `wantsObserving` flag separates "JS wants the stream" from "sensors are registered". Backgrounding unregisters even though these are non-wakeup sensors that stop delivering anyway, because the explicit unregister is free and states the intent. The app controls the first and last listener: `device/qibla.ts` subscribes when the sheet presents and unsubscribes on dismiss, which is the existing `watchHeading` contract and satisfies performance rule 7 (invisible work gated). The sheet stays pre-mounted from launch, so the observing hooks, not the module's existence, decide whether anything spins. What the app sees on backgrounding is stream silence, and D4's STALLED state already defines the copy for that; on resume the stream restarts and STALLED exits on its own hysteresis.

### 2.5 Files and line count

| File | Lines | Content |
| --- | --- | --- |
| `modules/compass/expo-module.config.json` | 6 | `platforms: ["android"]`, `modules: ["expo.modules.compass.CompassModule"]` |
| `modules/compass/android/build.gradle` | 22 | Copy of `tls13`'s, dependency list cut to `expo-modules-core` only |
| `modules/compass/android/src/main/java/expo/modules/compass/CompassModule.kt` | ~110 | Definition: `Name`, `Events`, `Function("getStatus")`, `Function("configure")`, the four lifecycle hooks, `ConfigureOptions` record, start/stop plumbing |
| `modules/compass/android/src/main/java/expo/modules/compass/HeadingPipeline.kt` | ~150 | The `SensorEventListener`: configure state, the maths of 2.2, bundle assembly |
| `modules/compass/index.ts` | ~110 | The section 1 contract: lazy resolution, NaN-to-null mapping, status defaults, watch/unwatch |
| `modules/compass/__tests__/index.test.ts` | ~60 | Binding behaviour, the `widgetrefresh` test shape |

Total new module code: roughly 250 lines of Kotlin plus 170 of TypeScript, about 460 including tests. R1 estimated 120 to 180 lines of Kotlin before D4's diagnostic fields and E1's seam existed; the growth is those eleven bundle fields and the reference computation, not scope creep elsewhere. No manifest, no podspec, no config-plugin, no app.json change. The shared JS layers the module feeds (`shared/headingFilter.ts`, `shared/qiblaHonesty.ts`, E1's `shared/qiblaCalibration.ts`) are separate from the module and sized in sections 4 to 6.

## 3. iOS

**Recommendation: iOS needs no module today.** R2 verified the iOS path is a bare 53-line passthrough to `CLLocationManager.startUpdatingHeading`, that it already works, and that nothing explains the XS failure at the generation level [S-sib R2, D3]. The Android module is where the measured defects live (no gyro, negative-declination bug, 5 Hz raw pair). iOS also cannot fill most of the contract's diagnostics through expo-location, because expo-location discards `CLHeading`'s x, y, z and bands `headingAccuracy` into 0 to 3 before JS sees it [S-sib R2]; the nullable contract absorbs that without a second native surface.

The candidate design, specified so a planning session can lift it verbatim if the evidence turns:

```swift
import CoreMotion
import ExpoModulesCore

public class CompassModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoCompass")
    Events("headingDidUpdate")

    let manager = CMMotionManager()
    manager.deviceMotionUpdateInterval = 1.0 / 30.0   // CLHeading cadence parity; the worklet interpolates

    OnStartObserving {
      guard manager.isDeviceMotionAvailable else { return }
      let frame: CMAttitudeReferenceFrame = manager.availableAttitudeReferenceFrames()
        .contains(.xTrueNorthZVertical) ? .xTrueNorthZVertical : .xMagneticNorthZVertical
      manager.startDeviceMotionUpdates(using: frame, to: .main) { [weak self] motion, error in
        guard let motion, error == nil else { return }
        // motion.heading: degrees [0, 360) in the requested frame, iOS 11+, measured from the X axis
        // magnetic frame plus JS declination is the fallback when true north errors (CMErrorTrueNorthNotAvailable)
        self?.sendEvent("headingDidUpdate", [
          "heading": motion.heading,
          "accuracy": motion.magneticField.accuracy.rawValue,  // -1 uncalibrated, 0 low, 1 medium, 2 high
          "fieldUT": (motion.magneticField.field.x ** 2 + ... ) ** 0.5,  // total field, uT
          // dipDeg from field dot gravity; referenceHeading stays absent on iOS
        ])
      }
    }
    OnStopObserving { manager.stopDeviceMotionUpdates() }
  }
}
```

Pieces R2 verified: `CMDeviceMotion.heading` is degrees in [0, 360) relative to the requested frame, gyro-fused per WWDC17 session 704, directly substitutable for `trueHeading` under `.xTrueNorthZVertical`; `magneticField.accuracy` gives the 4-state band; `magneticField.field` gives microtesla components; `CMErrorTrueNorthNotAvailable` is the named failure channel [P-sib R2]. The declination for the magnetic-frame fallback is free: one `CLHeading` sample yields it as `trueHeading - magneticHeading`, no model needed.

**Evidence that would decide the swap:** the signed XS probe R2 left built at `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/R2-device-probe/`, run in a clean outdoor field, logging both `CLHeading.trueHeading` and `CMDeviceMotion.heading` under `.xTrueNorthZVertical` side by side. Decision rule: move to Core Motion if (a) the two disagree by more than 3 degrees sustained, or (b) after a quick 90-degree hand snap the Core Location heading lags the Core Motion heading by a visible margin, or (c) `headingAccuracy` reports under 10 degrees while the XS reads more than 15 degrees off a physical reference. Absent any of those, the passthrough stays.

**The permission question, load-bearing per R2:** no motion prompt fires for `CMMotionManager` attitude reads. `NSMotionUsageDescription`'s required-API list is `CMSensorRecorder`, `CMPedometer`, `CMMotionActivityManager`, `CMMovementDisorderManager`; `CMMotionManager` is absent from the list, absent from the framework's authorization surface, and absent from WWDC17's sensitive-interfaces slide [P-sib R2]. The key is already in the shipped `Info.plist` via expo-location's plugin anyway [S-sib R2]. The caveat that travels with this conclusion: iOS 26 TCC polices motion more aggressively (a confirmed expo-sensors kill), and while the XS tops out at iOS 18, any future floor device on iOS 26+ needs the prompt question re-verified on hardware [W-sib R2].

## 4. Where the filtering runs

**The filter stays in a Reanimated worklet on the UI thread. R4's recommendation survives the module unchanged.** The case for moving it native looks stronger now that a module exists, so here is the assessment against this repo's actual constraints:

| Consideration | Native filter (in the module) | Worklet filter (recommended) |
| --- | --- | --- |
| Testable in this repo | No. The repo runs Jest only; no JVM test harness exists in `modules/`, and a native filter's tuning would be verified solely on device. Session 37's lesson (green suite, broken dial) argues against putting UX tuning where the suite cannot reach it | Yes. The maths lives in `shared/headingFilter.ts` as pure functions the worklet calls, replayed against recorded fixtures with break scripts |
| Tuning iteration | Every constant change is a Gradle rebuild; the widget sessions measured those at minutes apiece | JS reload; the owner's own iteration workflow for UI |
| One implementation for both platforms | The claimed prize, and it dissolves: iOS stays on `expo-location`, so there is no second platform to unify. The filter already has exactly one consumer | Same outcome, no prize lost |
| Bridge traffic saved by decimating native | 7.5 KB/s at 50 Hz, trivial next to the dial's own render cost | Pays 7.5 KB/s, measured floor already met on a heavier stream |
| Congestion immunity | Full | The worklet holds the last filtered value through a JS stall; a stalled JS thread stops target updates, it cannot corrupt the filtered state. R4's failure mode (accumulator state living where congestion lives) is avoided by keeping the accumulator in the worklet, which the module design preserves |
| 30 fps floor on the SD820 | Free | Free: about 10 flops per frame in `useFrameCallback`, beside a layer-rotation dial measured at 16.7 ms median frame gaps |

The design in one paragraph: the module's JS binding writes each `sample.heading` into a target shared value from its event callback (one line, `unwrapAngle` included, which keeps the accumulator on the UI side of the crossing); a `useFrameCallback` worklet runs R4's rate-adaptive exponential filter on the unwrapped angle, ramping tau from 0.3 s at rest to 0.05 s above 90 deg/s, using `timeSincePreviousFrame` for rate independence (verified this session: `FrameInfo` carries `timestamp` and `timeSincePreviousFrame` [S, installed reanimated types]); the dial rotates from the filtered value as today, first-evaluation snap preserved per repo rule. The unwrap plus filter constants live in `shared/headingFilter.ts`, imported by the worklet, exercised by the fixtures in section 6.

## 5. The calibration seam (E1)

Design assumption per the brief: E1 concludes an app can refine the hard-iron bias from the uncalibrated stream. The seam is built to be dropped whole if that conclusion flips.

**Where the correction lives.** The fit is JS: `shared/qiblaCalibration.ts`, a pure function over a recorded sweep of `rawFieldUT` samples (the event already carries raw field and OS bias at 50 Hz, so recording needs no new native surface). The module never computes or stores a bias; it only applies one it is given.

**Persistence.** MMKV through the existing `Database` wrapper, key `preference_qibla_calibration`, value `{ bias: {x, y, z}, spreadUT, savedAt }`. The `preference_` prefix is already whitelisted in both wipe paths (`UPGRADE_KEEP_PREFIXES` in `stores/version.ts` and the `clearAllExcept` list in `stores/sync.ts`, both read this session [S]), so the calibration survives upgrades and refreshes with zero changes to those lists. Reusing the prefix is mandatory, not stylistic: a new prefix would be swept on the next version bump.

**How calibration quality is exposed.** No new API. The event's `fieldUT` stream is the input; JS computes D4's rank 3 spread (max minus min over any 10 s window with at least 30 degrees of yaw swept) and the residual spread after the candidate bias is applied. A good bias is one that collapses the spread.

**How the guided flow drives it.**

1. D4's CALIBRATING state (or a future recalibrate row) shows the figure-of-eight copy. The compass is already streaming; JS buffers the raw and bias fields for the sweep's duration.
2. `qiblaCalibration.ts` fits, reports the before and after spread, and persists under `preference_qibla_calibration` only when the after spread beats a named threshold.
3. On the next compass open, `configureCompass({ latitude, longitude, altitude, correctionBias })` passes it in when the stored entry is present and fresh.
4. The module computes `correctedReferenceHeading` from the corrected uncalibrated field. This is the honest limit, stated plainly: the correction cannot reach inside the OS fusion, so it cannot repair `heading` itself. What D4's policy gains is a second opinion: display the fused `heading` by default, and switch to `correctedReferenceHeading` only when the vendor band is low and the corrected reference's own spread is tight. That is rung 1's repair path, and it is exactly the Trail Sense divergence pattern inverted [S-sib D4].

**The drop boundary.** Removing E1's outcome deletes: `correctionBias` from `CompassConfigure`, `correctedReferenceHeading` from `HeadingSample` and the bundle, the subtract-and-recompute call in `HeadingPipeline` (about 20 Kotlin lines), and `shared/qiblaCalibration.ts` whole. Nothing else in the contract, the module or the honesty layer references any of it.

## 6. Testing strategy

The repo requires 100 percent coverage on branches, functions, lines and statements (`jest.config.js`, verified this session [S]) and proves tests fail when code breaks via run break scripts. Session 37 shipped a visibly broken dial behind a green suite, so the plan separates what Jest can own from what only a device can.

**Unit-testable in Jest, the layers this module adds:**

- `modules/compass/__tests__/index.test.ts`: native module resolution, the NaN-to-null mapping per field, absent-module degradation, watch and stop wiring. The `widgetrefresh` test is the shape.
- `shared/headingFilter.test.ts`: unwrap boundary, tie-break determinism, tau ramp points, rate independence, first-sample snap.
- `shared/qiblaHonesty.test.ts`: D4's state machine entire, every trigger, every hysteresis exit, the priority order, null-diagnostics fallbacks (the iOS shape).
- `shared/qiblaCalibration.test.ts` (E1's): fit accuracy on synthetic spheres, spread before and after, staleness.
- `device/__tests__/qibla.test.ts`: the platform seam, both branches mocked.

**Recorded-sample fixtures.** Format: JSONL, one sample per line, stored under `shared/__tests__/fixtures/qibla/`:

```json
{"t":238714.401576768,"rv":[0.06,-0.09,0.96,0.27,0.0],"mag":[-6.49,38.77,-96.73],"raw":[5.09,-9.63,-130.17,-34.34,14.10,-75.92],"acc":2}
```

`t` is seconds on the device's elapsedRealtime clock so `dt` derives by subtraction; `rv` is the rotation vector (five values, the 3T's `values[4]` reads 0.00, re-confirmed in dumpsys this session [S]); `mag` is calibrated microtesla; `raw` is uncalibrated then bias (six values, omit when the device returns three); `acc` is `event.accuracy`. Recording mechanism: the compass debug path logs one `QIBLA_RAW` pino line per sample through the JS callback (the sample is already in JS, so recording is a pure JS concern, no native change), captured with `adb logcat -s` and stripped. The capture script aligns on device-clock timestamps, not host arithmetic, per the session 37 skew lesson.

Cases to capture on the 3T:

| Fixture | Motion | Pins |
| --- | --- | --- |
| `rest-table` | 60 s flat on wood | Noise floor; every detector stays quiet (specificity) |
| `sweep-360` | One slow full hand turn, flat | Unwrap boundary crossing; variance detector arms then clears |
| `figure-eight` | 30 s calibration motion | E1's fit input; CALIBRATING transition |
| `magnet-static` | 30 s beside a speaker magnet | F ratio and dip fire; SEVERE reached |
| `tilt-series` | Flat, 30, 60, 85 deg pitch, 20 s each | Dip stability; heading validity at steep tilt |
| `boundary-dwell` | Parked at 359 to 1 wiggle | R4's north-crossing failure case, replayed |

Synthetic fixtures alongside, hand-computed with no device: exact headings 0, 90, 180, 359.5, and a populated `values[4]` variant matching modern-HAL shape, pinning the binding's sentinel mapping and deterministic state transitions.

**Break scripts, each run rather than merely written (session 32's lesson):**

1. Delete `shortestDelta`'s tie-break line; `boundary-dwell` replay must fail.
2. Set the F-ratio warn threshold to 2.0; `magnet-static` replay must fail.
3. Remove the binding's NaN mapping; the sentinel test must fail.
4. Dial assertions stay on react-native-svg's `matrix` prop (session 37's ruling, already in the suite).

**What needs a device, and the ritual.** The Kotlin maths and the integration:

- Heading truth: at a clean outdoor spot, the module's `magneticHeading` within 2 degrees of a reference (another phone's compass app or a handheld compass), and `heading` differing from `magneticHeading` by the NOAA declination for London. The break script for this layer: flip the declination sign in `configure`; the device proof must catch the 2.4-degree shift.
- Rates and payload on the 3T and the Find X8: 50 Hz delivery, six-value uncalibrated events, `event.accuracy` band transitions on the X8 (verified on the 3T only; the X8 is not attached to this machine).
- Background pause and resume: stream falls silent within a transition, restarts on foreground.
- The frame audit: `e2e/scripts/frame-audit.sh` with the sheet open and the countdown ticker running, 30 fps floor, long gaps read as whole vsync multiples per the session 37 lesson.

What honestly cannot be covered: the Kotlin pipeline itself has no JVM harness in this repo, and adding one (kotest plus a gradle test task) is a new pattern the owner has not asked for. The device proof and the golden-vector replay of its logcat output are the coverage. Say so in the plan; do not pretend otherwise.

## 7. The comparison the owner asked for

Every route end to end. "Old phones" is the OnePlus 3T class, "new" is the Find X8 and iPhone 14 Pro Max class.

| | Keep `expo-location` | Adopt `expo-sensors` DeviceMotion | Reanimated `useAnimatedSensor` alone | **Local module (recommended)** | Hybrid: Reanimated needle plus module for truth |
| --- | --- | --- | --- | --- | --- |
| Heading quality, old phones | Wobbly and wrong: raw accel plus raw mag, no gyro, 5 Hz, 25 to 55 deg fleet error | Rotation vector read correctly but at 5 Hz on Android 12+ (not the 3T) with no remap | Fused quaternion at controllable rate, zero JS crossings | Fused, remapped, 50 Hz, true north; expected to match Google Maps class behaviour on the same hardware | Same as the module for truth, same as Reanimated for delivery |
| Heading quality, new phones | Same defects, less visible on better magnetometers | 5 Hz ceiling on Android 12+ fleet devices, not configurable from JS | Correct with explicit config | Correct | Correct |
| Accuracy signal | 0 to 3 band, collapsed, and silent while wrong (both failing phones) | None on either platform | None; `onAccuracyChanged` is an empty body | Per-sample band, `values[4]` when populated, plus D4's physics detectors | Same as the module |
| True north | Buggy: negative declination ships negative headings | No declination applied | Magnetic on Android; true north on iOS only with explicit frame config | Declination via `GeomagneticField`, normalisation correct by construction | Same as the module |
| Code this repo owns | None of the heading path | A TS wrapper plus workarounds it cannot express | A worklet filter, mapping, config pinning, plus a second accuracy path regardless | Roughly 250 Kotlin plus 170 TS in the module, plus the shared filter and honesty layers | The module plus the worklet plus the agreement glue between two sources |
| Platform coverage | Both, one defective half | Both, both defective | Both, needs per-platform config | Android native, iOS unchanged by design | Android native plus worklet |
| Effort | Zero | Low, then dead-ends at the accuracy constraint | Medium, then dead-ends the same way | One module session plus one integration session | The module's effort plus the hybrid's glue |
| Risk | The owner's complaint ships unfixed | Binding constraint unmet: the needle lies smoothly | Two sources of one heading that must agree on sign, units, frame, rate | Ours to break: house pattern, no new dependency, no patch to maintain | Same baseline plus integration risk between two streams |
| Fixes the owner's complaint | No | No | Partially: steadier needle, no honesty | Yes: old phones get the fused path new phones already had, and the screen can say when the needle is wrong | Yes, at higher complexity |

**Recommendation: the local Android-only module.** It is the only route that satisfies the binding constraint (a trust signal D4's detectors can drive), the only one that fixes the old-phone gap the owner named, and the cheapest route that does both, because the repo already owns the pattern and the module needs no permission, manifest entry or dependency beyond `expo-modules-core`.

**Runner-up: the hybrid**, Reanimated driving the needle from `useAnimatedSensor(SensorType.ROTATION, { interval: 16 })` with the module reduced to the accuracy and diagnostics stream. It wins under exactly one condition: a device measurement shows the module's 50 Hz JS event stream breaking the 30 fps floor on the 3T with the compass sheet open and the countdown ticker running. No such measurement exists; the closest evidence, the session 37 dial on a heavier stream, measured a 16.7 ms median frame gap. If a later build produces that measurement, the hybrid is the right response, and section 4's worklet design is already half of it.

## 8. The patch question

Patching `expo-location`'s Android source is viable only in the narrow sense and is the wrong choice here. The lesson is already in `ai/AGENTS.md` (session 24, the `expo-background-task` patch): while a module's `expo-module.config.json` declares a `publication` block, autolinking resolves the module to its prebuilt `local-maven-repo` AAR and Gradle never compiles the patched Kotlin, so the patch must delete that block too, and a native patch is verified by runtime behaviour, never by a green build. Verified this session: `node_modules/expo-location/expo-module.config.json` carries exactly such a block (`groupId host.exp.exponent`, `artifactId expo.modules.location`, `repository local-maven-repo`, version 58.0.8) [S].

What a correct heading patch must change inside `LocationModule.kt`: `startHeadingUpdate`'s two registrations (raw mag plus raw accel at `SENSOR_DELAY_NORMAL`, lines 634 to 643), `sendUpdate`'s pipeline (lines 646 to 674, including the 2-degree throttle), and `calcTrueNorth`'s sign bug (line 691), all private members of a class we do not own. That fixes the needle. It does not deliver what else this design requires: the uncalibrated stream, per-sample accuracy alongside the band, field magnitude, dip, the divergence reference, and the fallback ladder. Those are not extensions of the existing code, they are a second module wearing a patch's clothes, maintained against upstream churn on every 58.0.x bump, with the publication-block deletion re-pinned each time.

The local module avoids the entire class: it compiles from source by construction, needs no patch-package entry, survives expo-location bumps untouched, and leaves `expo-location` doing what it does well here, which is permissions and position. On Android the app simply stops calling `watchHeadingAsync`; no patch exists to go stale. Verdict: local module, and no patch.

## COULD NOT VERIFY

1. **The thread and queue semantics of `OnStartObserving` in expo-modules-core.** The skill documents the hooks; I did not read the Kotlin dispatcher source this session to confirm the body runs on the main queue by default (needed for `registerListener` without a Handler). Mitigation is one line: pass an explicit `Handler(Looper.getMainLooper())` to every `registerListener` call, which removes the assumption entirely. Tried: grepped `node_modules/expo-modules-core` for the module dispatcher; the relevant Kotlin is behind the compiled AAR on this machine.
2. **`event.accuracy` behaviour for the fused sensor on the Find X8.** Verified on the 3T by R3's dumpsys evidence; the X8 is not attached to this machine, so the modern-HAL band behaviour rests on docs plus the 3T.
3. **The iOS A/B that decides section 3.** R2's probe is built and unsigned; no account on this machine can sign it. The decision rule is written, the measurement does not exist yet.
4. **`remapCoordinateSystem` behaviour on a landscape-natural device.** The mapping is the javadoc's; no landscape hardware ran this session. The app is portrait-locked, so the shipped path is the identity case either way.
5. **The real battery cost of three concurrent 50 Hz registrations.** The design argument (dispatch only, hardware already spinning) is architectural; no soak test ran. The compass runs only while the sheet is open, tens of seconds at a time.
6. **Whether `bundleOf` with a NaN double survives the Expo K/V conversion losslessly on every supported Android version.** NaN doubles are spec-correct through the Bundle; the binding maps them to null, and a first-device-run assertion in the integration session settles it in minutes. Flagged because a silent NaN-to-zero conversion would corrupt the null contract.

## Sources

| Grade | Source | What it established |
| --- | --- | --- |
| [S] | `node_modules/expo-location/android/.../LocationModule.kt` lines 595 to 706, read this session | The incumbent's exact registrations, throttle, pipeline and sign bug the module replaces |
| [S] | `node_modules/expo-location/expo-module.config.json`, read this session | The `publication` block that makes source-patching a no-op (section 8) |
| [S] | OnePlus 3T `dumpsys sensorservice`, read-only this session | Rotation vector 5 to 200 Hz; both magnetometers 52 Hz cap; six-value uncalibrated events at 50 Hz with steady bias; calibrated events at 5 Hz matching the incumbent's live registration; `values[4]` = 0.00 on current samples |
| [S] | Repo: `modules/tls13`, `modules/widgetrefresh` (config json, gradle, Kotlin, `index.ts`, tests), `device/qibla.ts`, `shared/qibla.ts`, `components/sheets/screens/Qibla.tsx`, `components/qibla/Dial.tsx`, `stores/version.ts`, `stores/sync.ts`, `jest.config.js` | The house module pattern and line counts; the current heading contract and its seams; both MMKV wipe whitelists (calibration key survival); the 100 percent coverage thresholds |
| [S] | `node_modules/react-native-reanimated` `useFrameCallback` and `FrameCallbackRegistryUI` type declarations, read this session | `FrameInfo.timeSincePreviousFrame` exists for rate-independent worklet filtering |
| [P] | `expo-module` skill references: `native-module.md`, `lifecycle.md`, `module-config.md` (repo `.agents/skills/`) | The DSL used in section 2: `Events`, `OnStartObserving`/`OnStopObserving`, activity lifecycle hooks, Kotlin Records, `bundleOf`, `requireOptionalNativeModule` |
| [S-sib] | R1 (API arbitration) | The route comparison this report builds on; the runner-up condition quoted in section 7; the house-pattern line-count basis |
| [S-sib] | R2 (iOS heading) | `CLHeading` passthrough, accuracy banding, the four reference frames, `CMDeviceMotion.heading` semantics, the no-prompt conclusion and its iOS 26 caveat, the unsigned probe |
| [S-sib] | R3 (Android heading) | The six-step pipeline and its AOSP API 28 source verification, remap arguments, `GeomagneticField` staleness figures, delay-constant microsecond mapping, fallback-ladder CDD basis |
| [S-sib] | R4 (fusion and filtering) | The filter family, tau table, rate-adaptive ramp, wrap analysis, the worklet recommendation section 4 reassesses |
| [S-sib] | D4 (detection and honesty) | Detector ranks and thresholds, expected London field and dip, the state machine and copy the diagnostics feed, rung definitions |
| [S-sib] | D2, D3 (magnetic environment, XS anomaly) | The 19.58 uT horizontal field and disturbance-to-error arithmetic; the no-generational-iOS-difference finding behind section 3's recommendation |
| [U] | Battery estimate for three registrations (section 2.1, COULD NOT VERIFY 5) | Architectural inference, no soak test |
