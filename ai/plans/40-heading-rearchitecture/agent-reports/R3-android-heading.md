# R3: Android heading, platform level

Research agent R3, session 40. Scope: the rotation vector family, the code path to a bearing, magnetic versus true north, the accuracy signal, rates and battery, the Snapdragon 820 reality, and what `expo-sensors` DeviceMotion uses on Android.

## Summary

`TYPE_ROTATION_VECTOR` is the right sensor and it is magnetic-north referenced, so declination is still needed and still comes from `android.hardware.GeomagneticField`. The expo-location heading path is confirmed to be raw accelerometer plus raw magnetometer with no gyroscope, at `SENSOR_DELAY_NORMAL`, throttled to 2 degrees per 50 ms. Its negative-declination bug is confirmed in source. `expo-sensors` DeviceMotion on Android already subscribes to `TYPE_ROTATION_VECTOR` (`DeviceMotionModule.kt:28`) and already runs `getRotationMatrixFromVector` then `getOrientation` (`:247-248`), but it skips `remapCoordinateSystem`, drops accuracy entirely, subscribes to four other sensors at the same time, and delivers radians that the TS types mislabel. A small local Expo module in the `modules/tls13` shape is the cleaner path. Two verified device facts cap the design: the 3T's QTI rotation vector reports `values[4]` as 0.00 at rest, and Android 9's `GeomagneticField` ships WMM-2015, which extrapolates to roughly 0.4 degrees error in London today, growing roughly 0.17 degrees per year.

## 1. The rotation vector family, compared properly

Ground truth from the 3T, `adb shell dumpsys sensorservice` (read-only, nothing installed or launched):

```
0x00000013) Rotation Vector           | QTI  | type: android.sensor.rotation_vector(11)             | minRate=5.00Hz | maxRate=200.00Hz
0x00000017) Game Rotation Vector      | QTI  | type: android.sensor.game_rotation_vector(15)        | minRate=5.00Hz | maxRate=200.00Hz
0x00000018) GeoMagnetic Rotation Vec  | QTI  | type: android.sensor.geomagnetic_rotation_vector(20) | minRate=5.00Hz | maxRate=52.00Hz
0x00000019) Orientation               | QTI  | type: android.sensor.orientation(3)                  | minRate=5.00Hz | maxRate=200.00Hz
...plus AOSP software fallbacks for 11, 15, 20, and a "Corrected Gyroscope Sensor"
```

| Property | `TYPE_ROTATION_VECTOR` (11) | `TYPE_GAME_ROTATION_VECTOR` (15) | `TYPE_GEOMAGNETIC_ROTATION_VECTOR` (20) | `TYPE_ORIENTATION` (3) |
| --- | --- | --- | --- | --- |
| Physical inputs | accelerometer + magnetometer + gyroscope | accelerometer + gyroscope, no magnetometer | accelerometer + magnetometer, no gyroscope | whatever feeds the underlying orientation estimate |
| North reference | magnetic north (SensorEvent reference frame: "Y ... points towards magnetic north") | arbitrary yaw, drifts like gyro Z drift | magnetic north | magnetic north (values[0] is azimuth from magnetic north) |
| `values[4]` accuracy | present, radians, "-1 if unavailable" | explicitly absent ("This sensor will not have the estimated heading accuracy value") | not documented for it; same shape as 11 in practice | none |
| Drift behaviour | gyro holds short-term, magnetometer corrects long-term, no unbounded yaw drift | unbounded yaw drift at gyro-drift order | wobblier: no gyro, so it inherits the tilt-compensation problem of the raw pair, though fused | same as its inputs |
| Power (3T measured) | QTI sensor-hub fused; `getPowerUsage` for the AOSP software path sums accel + mag + gyro (SensorFusion.cpp:175-180) | sums accel + gyro | sums accel + mag | same inputs as 11 |
| CDD status (Android 9 CDD 7.3) | MUST exist when the device has accel + mag + gyro (7.3.2 C-2-1, 7.3.4 C-2-1) | STRONGLY RECOMMENDED (7.3.4 SR) | MAY exist when device has accel + mag; if present MUST consume under 10 mW (7.3.2 C-3-1) | deprecated since API 3 era, "exists for legacy reasons" |

Sources: [A] `SensorEvent.values` javadoc for all four types; [A] Android 9 CDD sections 7.3.2 and 7.3.4, fetched from source.android.com; [S] AOSP `SensorFusion.cpp` and `SensorService.cpp` (LineageOS android-9.0.0 lineage-16.0 mirror, verified as the Android 9 sensorservice); [S] 3T dumpsys output pasted above.

Which one Google Maps uses, and how that is known: Google Maps' own compass is closed source, so there is no [A]-grade citation of its internals. Three converging facts, none alone conclusive:

1. The platform-blessed compass sensor is `TYPE_ROTATION_VECTOR`; every Android compass tutorial and the `SensorEvent` reference frame (magnetic-north Y axis) are written around it. [A]
2. Google ships a public API for the same job, the `FusedOrientationProvider` (`FusedOrientationProviderClient` in Google Play services), whose `DeviceOrientation` exposes `getHeading()` and `getConservativeHeadingErrorDegrees()`, and whose docs tell the caller to feed its quaternion through `SensorManager.getRotationMatrixFromVector`. [A] This is the API surface Maps-scale apps are pointed at.
3. Direct observation on the 3T: `com.google.ccc.abuse.droidguard.events.b`, a Play Services component, is the only external consumer subscribing to handle `0x00000013`, the QTI Rotation Vector, at 20000us (50 Hz). [S] That is Play Services code reading rotation vector, not Maps itself.

Grade the claim as: Maps uses the fused rotation-vector path, evidenced indirectly and strongly, not by reading Maps' source. Marked [U] where it overreaches: anything specific about Maps' internal filtering.

## 2. The exact code path from `TYPE_ROTATION_VECTOR` to a compass bearing

The canonical sequence, verified against the API 28 `SensorManager.java` source (AOSP tag android-9.0.0_r1) and the live `SensorEvent` docs:

```kotlin
override fun onSensorChanged(event: SensorEvent) {
    val r = FloatArray(9)
    SensorManager.getRotationMatrixFromVector(r, event.values)   // step 1: quaternion -> rotation matrix
    val remapped = FloatArray(9)
    SensorManager.remapCoordinateSystem(r, AXIS_X, AXIS_Y, remapped)  // step 2: portrait-locked, see below
    val orientation = FloatArray(3)
    SensorManager.getOrientation(remapped, orientation)          // step 3: azimuth/pitch/roll in RADIANS
    val azimuthDeg = Math.toDegrees(orientation[0].toDouble())   // step 4: (-180, 180], magnetic north
    val bearing = ((azimuthDeg + 360.0) % 360.0)                 // step 5: [0, 360)
    val trueBearing = ((bearing + declination + 360.0) % 360.0)  // step 6: add declination, section 3
}
```

Why each step, from source:

- Step 1, `getRotationMatrixFromVector(R, values)` (SensorManager_api28.java, lines ~1893-1940): reads `values[0..2]` as `x*sin(theta/2), y*sin(theta/2), z*sin(theta/2)` and `values[3]` as `cos(theta/2)`. If the array has only 3 elements it reconstructs `q0 = sqrt(1 - q1^2 - q2^2 - q3^2)`. Produces the device-to-world rotation matrix in row-major 9 or 16 float form.
- Step 2, `remapCoordinateSystem`. The sensor frame is fixed to the device's natural orientation: "the axes are not swapped when the device's screen orientation changes" (SensorEvent docs, coordinate system section). `getOrientation` then returns angles of the device's Y axis, the axis pointing out the top of the phone in its natural portrait. For a portrait-locked app on a portrait-natural phone the rotation is `ROTATION_0` and the correct remap arguments are `AXIS_X, AXIS_Y`, which is the identity remap, so it can be skipped only when both hold. The docs warn the opposite direction: "you need to do this even if your manifest specifies portrait-only display", because a portrait-locked app on a landscape-natural device (most tablets) still sees `ROTATION_0` while the natural frame is rotated 90 degrees. Verified wording in the sensors overview page. The general rule from the `remapCoordinateSystem` javadoc: for `ROTATION_90` used as a mechanical compass, `remapCoordinateSystem(inR, AXIS_Y, AXIS_MINUS_X, outR)`.
- What happens if you skip it: on a portrait-natural phone in an app locked to portrait, nothing, because identity. On a landscape-natural device, or if the user rotates a lock-exempt app, the azimuth reads 90 degrees off. expo-sensors' DeviceMotion skips it entirely (DeviceMotionModule.kt:247-248 go straight from `getRotationMatrixFromVector` to `getOrientation`), which is correct on portrait phones and wrong on landscape-natural tablets.
- Step 3, `getOrientation(R, values)` (SensorManager_api28.java, `values[0] = atan2(R[1], R[4])`, `values[1] = asin(-R[7])`, `values[2] = atan2(-R[6], R[8])` for the 9-element case): all three outputs are radians. Azimuth range is (-pi, pi].
- Step 6 belongs to section 3: the rotation vector's world frame is magnetic north, so the bearing is magnetic and declination must be added.

Flat versus upright. The app tells the user to hold the phone flat. The maths must not explode when they do not, and with the rotation vector it does not: `getOrientation` on the full rotation matrix is tilt-compensated, meaning the azimuth stays correct at arbitrary pitch and roll as long as the gravity and magnetic vectors are not collinear with each other or with the sensor's blind axis. Degeneracies, from the `getRotationMatrix` javadoc and the SensorEvent reference-frame definition:

- Phone held vertical (pitch near 90): the top edge points at the horizon; azimuth is still valid and tilt-compensation is doing the most work. The classic raw `getRotationMatrix` failure mode here was gimbal lock around the Y axis; the quaternion path has no Euler singularity, and `atan2` keeps working through it.
- Phone flat on a table at the magnetic pole regions: gravity and magnetic field align, the horizontal magnetic component vanishes, and the azimuth becomes undefined. Android documents blackout zones for exactly this (WMM blackout zones near the poles).
- Phone accelerating hard or next to a magnet: the javadoc for `getRotationMatrix` says the matrices "may be inaccurate" in free fall or strong fields. The fused sensor withstands these better than the raw pair because the gyro bridges short disturbances, but it cannot fix a sustained fake magnetic field.

Practical consequence for this app: no special flat-only handling is required in the maths. The honest-degradation duty is to surface accuracy (section 4) rather than to gate on pitch.

## 3. Magnetic versus true north on Android

`TYPE_ROTATION_VECTOR` gives magnetic north. Proof, [A], from the `SensorEvent.values` javadoc for `TYPE_ROTATION_VECTOR`, reference coordinate system definition, verbatim:

> "Y is tangential to the ground at the device's current location and points towards magnetic north."

The same page documents `TYPE_HEADING` (API 34+) as "measures the direction in which the device is pointing relative to true north", confirming by contrast that the rotation vector family is not true-north referenced. So declination is still required, exactly as the current `calcTrueNorth` does, and the qibla bearing from `adhan` is true-north, so the two only meet after adding declination.

`android.hardware.GeomagneticField`, verified from source and reference:

- Model: the World Magnetic Model from the US NGA/NOAA. The class javadoc on current Android says "currently uses WMM-2020 which is valid until 2025". AOSP main (fetched today) still ships WMM-2020 coefficients with `BASE_TIME` 2020-01-01 UTC.
- Network: none. The coefficients are compiled into the class (`G_COEFF`, `H_COEFF`, `DELTA_G`, `DELTA_H` static arrays). Computation is local arithmetic. It needs a location (lat, lon, altitude, time) from the caller.
- Expiry behaviour: there is no runtime expiry check. `GeomagneticField_api28.java` line ~192: `yearsSinceBase = (timeMillis - BASE_TIME) / (365 * 24 * 60 * 60 * 1000)`, then line ~201: `g = G_COEFF[n][m] + yearsSinceBase * DELTA_G[n][m]`. Linear extrapolation of the secular variation, unbounded, no clamping and no warning. Past the epoch the error grows without limit.
- The 3T on API 28 carries WMM-2015 (verified: `GeomagneticField_api28.java` line 29: "uses WMM-2015 which is valid until 2020"; line 51 comment "World Magnetic Model for 2015-2020"; BASE_TIME = GregorianCalendar(2015, 1, 1)), six years past its validity window today.

Measured error today. I compiled the verbatim API 28 `GeomagneticField.java` (package line stripped, nothing else changed) and evaluated it for 2026-09-29, then queried the NOAA geomagnetic calculator (model WMM-2025) for ground truth:

| City | API 28 WMM-2015 evaluated 2026-09-29 | NOAA WMM-2025 (truth) | Error |
| --- | --- | --- | --- |
| London | +0.822 deg | +1.203 deg | -0.38 deg |
| New York | -12.669 deg | -12.465 deg | -0.20 deg |
| Los Angeles | +11.219 deg | +11.342 deg | -0.12 deg |
| Sydney | +12.679 deg | +12.826 deg | -0.15 deg |

Karachi (+1.609) and Jakarta (+0.498) computed from the port but NOAA rate-limited before truth arrived. The pattern: error is sub-half-degree in the cities checked, biased low (the extrapolated model lags the real field), and grows about 0.17 deg per year (London `declination_sv` from NOAA: 0.17 deg/yr). Conclusion for the design: on the 3T today the stale declination costs under half a degree against a qibla needle whose UI hint already says the phone's own uncertainty exceeds 35 degrees when uncalibrated. It is a real, measurable, growing error, not a ship blocker; a modern device on Android 15 carries WMM-2020 and sits closer to 0.2 deg error. Nothing the app can do fixes the 3T's stale model; the OS owns it. The mitigation is scope: keep using `GeomagneticField`, know its epoch per API level, and do not bake declination into the app.

One subtlety the re-architecture must keep: the negative-declination bug. Verified in `LocationModule.kt:688-692`: `calcTrueNorth` returns `(magNorth + geofield.declination) % 360` using Kotlin's `%`, which keeps the dividend's sign. Where declination is negative and the sum is negative, `trueHeading` ships negative. Ground truth (b) confirmed exactly as stated. Any replacement must normalise with `((x % 360) + 360) % 360` before it reaches JS, matching `shared/qibla.ts:42`.

## 4. The accuracy signal under fusion

Two distinct signals, often conflated:

1. `SensorEventListener.onAccuracyChanged(sensor, accuracy)`: the 0-3 band (`SENSOR_STATUS_UNRELIABLE=0, ACCURACY_LOW=1, ACCURACY_MEDIUM=2, ACCURACY_HIGH=3`, SensorManager_api28.java lines ~330-352). Delivery is event-driven, not per-sample: the framework fires it only when the cached accuracy changes (SystemSensorManager `SensorEventQueue.dispatchSensorEvent`: compares `mSensorAccuracies.get(handle)` with the incoming accuracy and calls the listener on change). The incoming accuracy rides along in the sensors_event_t from the HAL.
2. `values[4]` on the rotation vector: estimated heading accuracy in radians, "-1 if unavailable", added in SDK level 18. Same page: "values[3], originally optional, will always be present from SDK Level 18 onwards. values[4] is a new value that has been added in SDK Level 18."

Does the fused sensor report `onAccuracyChanged` like the raw magnetometer? Yes, structurally: every continuous sensor carries a per-event accuracy field through the HAL and the framework surfaces changes the same way. What differs is what the vendor's HAL puts in it. For the AOSP software rotation vector on Android 9, `RotationVectorSensor.cpp:46-63` builds the output event by copying the incoming accelerometer event (`*outEvent = event`) and overwriting `data[0..3]`, so the synthesized event inherits the accelerometer's accuracy wholesale, and `data[4]` is never written by that path. On old HALs (`halVersion < SENSORS_DEVICE_API_VERSION_1_0`) SensorService.cpp line ~713 explicitly forces `data[4] = -1` for rotation vector events.

Populated on real hardware or often zero: on the 3T, live `dumpsys sensorservice` "Rotation Vector: last 10 events" shows all five values, and `values[4]` reads 0.00 across every sample at rest. A 0.00 radian accuracy claim (a perfect heading) is not credible; the sane readings are either "vendor stubs it to zero" or "0 means unpopulated here". Either way, on the exact floor device, `values[4]` carries no usable signal. Meanwhile `onAccuracyChanged` for the same sensor does transition through the band on that device, since expo-location's current path already reads a usable 0-3 from the raw magnetometer's callback (LocationModule.kt:1108-1110) and the same mechanism serves the fused sensor.

Design consequence, re-derived rather than copied: keep deriving the calibration verdict from `onAccuracyChanged` on the rotation vector itself, treat accuracy below 2 (below MEDIUM) as "uncalibrated", and ignore `values[4]` unless it is present and strictly greater than 0. Do not copy the old threshold semantics blindly: the current app reads accuracy from the raw magnetometer's callback because that is the sensor expo-location registers; on the fused sensor the band means the fusion's confidence, which is what the user needs to know. Also note `SENSOR_STATUS_NO_CONTACT = -1` exists and arrives in `event.accuracy` per sample; a fresh module should read `event.accuracy` per event (it is always populated) and use `onAccuracyChanged` only as the change notification, which is exactly how the framework itself consumes it.

## 5. Sampling rates and battery

The four delay constants, verified from `SensorManager_api28.java` `getDelay(int rate)` (lines ~1886-1906): the public constants are enum ordinals (`SENSOR_DELAY_FASTEST = 0`, `SENSOR_DELAY_GAME = 1`, `SENSOR_DELAY_UI = 2`, `SENSOR_DELAY_NORMAL = 3`, lines 317-323), and `getDelay` maps them to microseconds: FASTEST to 0, GAME to 20000us (50 Hz), UI to 66667us (15 Hz), NORMAL to 200000us (5 Hz).

| Constant | Microseconds | Nominal rate | Delivered on 3T rotation vector |
| --- | --- | --- | --- |
| `SENSOR_DELAY_FASTEST` | 0 | sensor max | 200 Hz (its maxRate) |
| `SENSOR_DELAY_GAME` | 20000 | 50 Hz | 50 Hz |
| `SENSOR_DELAY_UI` | 66667 | 15 Hz | 15 Hz |
| `SENSOR_DELAY_NORMAL` | 200000 | 5 Hz | 5 Hz |

The overview docs warn the delay "is only a suggested delay" and the system may deliver faster; the AOSP `SensorFusion::setDelay` clamps the accel request to 50 ms minimum (line ~169: `if (ns > 5e7) ns = 5e7`), so the software fusion path never runs its accel slower than 20 Hz regardless of what you ask.

Which is right for a compass at 60fps: `SENSOR_DELAY_GAME` (50 Hz). The needle animates at 60 fps but the heading does not change at 60 Hz; 50 Hz of sensor samples gives one sample per animation frame with margin, and expo-location's own 2-degree-per-50ms throttle shows the event rate needed is far below what GAME delivers. `SENSOR_DELAY_UI` (15 Hz) is defensible for a slow needle and saves power; `SENSOR_DELAY_NORMAL` (5 Hz) is what expo-location uses today and is visibly steppy behind a 60 fps animation; FASTEST wastes battery for zero perceptible gain.

Measured power difference, fused versus raw magnetometer. COULD NOT VERIFY a per-sensor milliamp figure on the 3T: `dumpsys sensorservice` on Android 9 does not print per-sensor power, and no `dumpsys batterystats` attribution separates sensors by client without a long soak. What source establishes: the AOSP software rotation vector's declared power is the sum of its inputs' declared power (`SensorFusion.cpp:175-180`: `mAcc + mMag + mGyro` power), so a software-fused rotation vector always costs more than the raw magnetometer alone on paper. On the 3T the rotation vector is QTI sensor-hub fused in hardware, and the CDD caps geomagnetic rotation vector at 10 mW (7.3.2 C-3-1) as the precedent for what fused compass sensors are expected to cost. The honest statement: on a sensor-hub device the fused sensor's marginal cost over the raw pair is the gyro, which on the 3T is an LSM6DS3 package member already spun up; the practical battery difference for a compass that runs only while the sheet is open is negligible next to the screen.

`HIGH_SAMPLING_RATE_SENSORS`: rate limiting applies to apps targeting Android 12 (API 31) and above, caps `registerListener` at 200 Hz, and requires the permission only above that (sensors overview page, Sensor Rate-Limiting section; SensorManager class javadoc, same statement). A compass at GAME (50 Hz) or UI (15 Hz) never needs it. Confirmed also from the expo-sensors side: `SensorSubscription.kt:22-26` only requests FASTEST when the permission is present, else falls back to NORMAL, which is exactly the guard a well-behaved app needs and evidence the permission is only about FASTEST.

## 6. The Snapdragon 820 / Android 9 reality

- Fusion in hardware or framework: both, and the HAL wins. SensorService.cpp ~187-229 registers hardware sensors first and only instantiates the AOSP `RotationVectorSensor` software fusion when the HAL does not already provide the type (`virtualSensorsNeeds` bookkeeping; software instances registered with `isDebug` true when hardware exists). On the 3T the QTI sensor-hub provides 11, 15 and 20 in hardware (dumpsys handles 0x13-0x18, vendor QTI), so the app gets the vendor's fusion, not the framework's. The AOSP entries (handles 0x5f...) exist as debug fallbacks. `IGNORE_HARDWARE_FUSION` is a build flag that forces the software path.
- The 3T's actual live behaviour, read-only dumpsys: rotation vector delivers 5-value events at up to 200 Hz, and the "Fusion States" block reports all three framework fusions disabled with 0 clients, confirming nothing framework-side is running. `values[4]` reads 0.00 (section 4).
- Known bugs on older Qualcomm: COULD NOT VERIFY any specific Qualcomm 820 rotation-vector erratum from an [A] or [S] source. Searched for issue-tracker entries and forum reports; the Google Issue Tracker entry I could reach (109950515) is access-restricted. What is documented generally: vendor HALs of that era widely varied in `values[4]` population and in accuracy reporting, which matches the 0.00 observed. Treat this as "design must not depend on values[4]" rather than "the 820 is broken".
- Accuracy reporting reliability on this hardware: the 0-3 `onAccuracyChanged` band is populated for the QTI rotation vector (the framework only reports what the HAL sends; the HAL sends it, as the raw magnetometer path on the same device demonstrates). The per-sample `event.accuracy` is the trustworthy channel; `values[4]` is not, on this device.
- No gyroscope at all (budget phones): the CDD requires `TYPE_ROTATION_VECTOR` only when the device has accelerometer + magnetometer + gyroscope (7.3.2 C-2-1). A gyro-less device MAY implement `TYPE_GEOMAGNETIC_ROTATION_VECTOR` (accel + mag) instead. So `getDefaultSensor(TYPE_ROTATION_VECTOR)` can return null on a budget phone. There is no silent fallback inside the platform for the app: `registerListener` with a null sensor simply does nothing. The app must check `getDefaultSensor(TYPE_ROTATION_VECTOR) != null`, and when null, either fall back to `TYPE_GEOMAGNETIC_ROTATION_VECTOR` while telling the user the heading is the wobbly unfused kind, or show the honest "no compass on this phone" state. It must never present the gyro-less heading as a fused one. Note also the AOSP framework itself only builds its software 9-axis fusion when hasGyro && hasAccel && hasMag (SensorService.cpp ~201), so even the fallback path on such devices is the geomagnetic one.

## 7. What expo-sensors' DeviceMotion uses on Android

Read from package source, version 58.0.8 (opensrc cache; 57.0.3 diffed identical), file `packages/expo-sensors/android/src/main/java/expo/modules/sensors/modules/DeviceMotionModule.kt`:

- Line 24-30: `sensorTypes = [TYPE_GYROSCOPE, TYPE_ACCELEROMETER, TYPE_LINEAR_ACCELERATION, TYPE_ROTATION_VECTOR, TYPE_GRAVITY]`. The rotation channel is backed by `TYPE_ROTATION_VECTOR`. Line 28.
- Lines 246-258: for the rotation bundle it runs `SensorManager.getRotationMatrixFromVector(rotationMatrix, rotationEvent!!.values)` then `SensorManager.getOrientation(rotationMatrix, rotationResult)`, then emits `alpha = -rotationResult[0]`, `beta = -rotationResult[1]`, `gamma = rotationResult[2]` as raw doubles. Line 247 and 248 are the two calls; 252-254 the sign flips.
- What it gets wrong or omits for a compass: no `remapCoordinateSystem` (breaks landscape-natural devices), no declination (alpha is magnetic azimuth, negated), no accuracy signal at all (`onAccuracyChanged` is `= Unit`, line 154, and `values[4]` is never read), no `values[4]` consumption, radians never converted to degrees (the TS type at `src/DeviceMotion.ts:25` describes alpha as "rotation around Z axis" without units; the native side emits radians), all five sensors registered whenever observing starts (five subscriptions where a compass needs one), and `SensorSubscription.kt:21-26` requests `SENSOR_DELAY_NORMAL` (5 Hz) without the high-sampling permission, throttled further by a default 100 ms `updateInterval`.
- Sampling rate: `DeviceMotionModule` passes `updateInterval = 0` into each `SensorSubscription` (line 52), so every event flows through to the frame callback until the Choreographer-side throttle (`lastUpdate > updateInterval`, line 174 with the JS-set interval defaulting to 1/60 s) applies.

So the answer to "is this nearly free": the sensor choice is free, the plumbing is not. DeviceMotion gives a magnetic, unremapped, accuracy-less, radian, 5 Hz, five-sensor heading. The app needs true-north, remapped, accuracy-banded, degree, single-sensor, 50 Hz. A custom native module is required, and it is small.

House pattern and size sketch. The repo already ships two local Expo modules. `modules/tls13` is the minimal shape: one `expo-module.config.json` (`platforms: ["android"]`, `modules: ["expo.modules.tls13.Tls13Module"]`) and one Kotlin file with a `ModuleDefinition` exposing a single `Function` (Tls13Module.kt, 17 lines total). `modules/widgetrefresh` shows the event-emitting, lifecycle-aware shape: `OnCreate`, `Function`, and a system listener bound to the process (WidgetRefreshModule.kt:6-33). A compass module in that pattern is one Kotlin file of roughly 120 to 180 lines plus the config json and a thin TS type:

- `Function("isAvailable")` returning whether `getDefaultSensor(TYPE_ROTATION_VECTOR)` is non-null, and whether the fallback is geomagnetic (not fused) so JS can degrade honestly.
- `Events("headingDidUpdate")` with a bundle carrying `heading` (degrees, [0,360), true-north), `accuracy` (int 0-3), `fused` (bool).
- `OnStartObserving` / `OnStopObserving` to register and unregister one listener on the rotation vector at `SENSOR_DELAY_GAME`, plus a one-shot location read to build `GeomagneticField` (same pattern as LocationModule.kt:602-633, which can be copied nearly verbatim).
- `onSensorChanged`: the six-step pipeline from section 2, plus `event.accuracy` per sample.
- No permissions of its own beyond what expo-location already holds for the declination position; `ACTIVITY_RECOGNITION` is not needed (that is DeviceMotion's pedometer legacy, DeviceMotionModule.kt:73-97).

## COULD NOT VERIFY

1. Google Maps' internal sensor choice. No public source; evidence is converging but indirect (section 1). Tried: Maps issue tracker (access denied), Play Services reference docs, on-device sensor connection logs (only droidguard, not Maps, observed subscribing).
2. Per-sensor power figures on the 3T. Android 9's `dumpsys sensorservice` prints no power column and no battery-attribution breakdown per sensor client. Tried `dumpsys sensorservice` full output and `dumpsys batterystats` headers; a controlled soak test would be needed and was out of scope for a read-only session.
3. Any Snapdragon 820-specific rotation-vector erratum from a gradable source. Tried Google Issue Tracker (restricted entry), web search via tinyfish (only forum-grade anecdotes, [W] at best, none load-bearing).
4. `values[4]` behaviour on the Find X8 (second device): it is not attached to this machine, so the modern-hardware `values[4]` claim rests on the docs plus the 3T observation only.
5. The exact `minSdkVersion` the app builds with (`rootProject.ext.minSdkVersion` resolves through the Expo gradle plugin's compiled `DefaultProperties.class`; the source default is not in the repo). Not load-bearing: the 3T is API 28 and both sensors exist there.

## Sources

| # | Grade | Source |
| --- | --- | --- |
| 1 | [A] | `SensorEvent` reference, developer.android.com/reference/android/hardware/SensorEvent: rotation vector reference frame ("points towards magnetic north"), values[4] semantics and SDK 18 note, game/geomagnetic/orientation/heading definitions |
| 2 | [A] | `SensorManager` reference and API 28 source (AOSP android-9.0.0_r1 `SensorManager.java`): `getDelay` mapping (20000/66667/200000/0 us), delay constants, `getOrientation` atan2 forms, `getRotationMatrixFromVector` quaternion math, `remapCoordinateSystem` javadoc and ROTATION_90 example, accuracy constants |
| 3 | [A] | Sensors Overview, developer.android.com/develop/sensors-and-location/sensors/sensors_overview: coordinate system remap warning for portrait-only apps, sensor rate limiting (200 Hz cap, API 31+), background sensor restrictions on API 28+ |
| 4 | [A] | Android 9 CDD, source.android.com/docs/compatibility/9/android-9-cdd: 7.3.2 magnetometer (rotation vector MUST, geomagnetic MAY, 10 mW cap), 7.3.4 gyroscope (rotation vector MUST, game RV SR) |
| 5 | [A] | `GeomagneticField` reference and API 28 source (AOSP android-9.0.0_r1): WMM-2015, BASE_TIME 2015, unbounded linear extrapolation; AOSP main fetched for WMM-2020 comparison |
| 6 | [A] | `SystemSensorManager.java` API 28 (AOSP): `SensorEventQueue.dispatchSensorEvent` accuracy change detection and per-event accuracy |
| 7 | [S] | AOSP Android 9 SensorService via LineageOS lineage-16.0 mirror: `RotationVectorSensor.cpp` (data[0..3] only, inherits accel event), `SensorService.cpp` (hardware-first registration, `data[4] = -1` on old HALs, software fusion gating), `SensorFusion.cpp` (power summation, 200 Hz gyro, setDelay clamp, activate paths) |
| 8 | [S] | `node_modules/expo-location/.../LocationModule.kt` in this repo: lines 595-644 (raw accel+mag at DELAY_NORMAL), 646-674 (getRotationMatrix path, 2 deg / 50 ms throttle), 683-692 (calcMagNorth, calcTrueNorth sign bug), 1098-1110 (onSensorChanged, onAccuracyChanged), 1094-1095 (throttle constants) |
| 9 | [S] | `expo-sensors` 58.0.8 and 57.0.3 source (opensrc): `DeviceMotionModule.kt:24-30,52,142-154,246-262`, `SensorSubscription.kt:13-62`, `src/DeviceMotion.ts:25-41` |
| 10 | [S] | 3T on-device read-only evidence: `adb shell dumpsys sensorservice` sensor list, fusion states, live Rotation Vector events with values[4] = 0.00, per-package connection log |
| 11 | [A] | NOAA NCEI WMM pages: WMM2025 release note, model expiry 2029-12-31, five-year update cadence |
| 12 | [S] | NOAA geomagnetic calculator API (`geomag-web/calculators/calculateDeclination`, model WMM-2025): truth declinations for London, New York, Los Angeles, Sydney |
| 13 | [S] | Ported-computation: API 28 `GeomagneticField` compiled and evaluated at 2026-09-29 for six cities (method in section 3, reproducible from the AOSP source cited in #5) |
| 14 | [A] | `FusedOrientationProviderClient` / `DeviceOrientation`, developers.google.com: quaternion via `getRotationMatrixFromVector`, heading error contract |
| 15 | [S] | This repo: `device/qibla.ts`, `shared/qibla.ts`, `components/sheets/screens/Qibla.tsx`, `modules/tls13`, `modules/widgetrefresh` |
