# R1: API arbitration, the route R5 missed, and the expo-sensors verdict

Session 40, research agent R1 (rerun). Scope: settle the API choice on evidence, audit Reanimated's own sensor API from installed source, adjudicate the R3 versus R5 disagreement on `expo-sensors`, compare the three routes against this app's binding constraints, and rule on the hybrid.

Grades: [S] read from package or platform source this session, [D] official documentation, [R] registry data pulled 2026-09-29, [W] blog or forum, [U] unverified. Where I contradict a sibling report there is a section near the end naming each one.

## Summary: the five things that most change the design

1. **Reanimated's sensor API is real, public and UI-thread native, but it cannot carry this compass alone.** The sample path never touches JS: Android sensor events arrive on the main looper and the handler runs synchronously on the UI worklet runtime (`AnimatedSensorModule.cpp:59`, `runSyncOnRuntime`). But the accuracy signal is dropped (`ReanimatedSensorListener.kt:73-76`, empty body), the default iOS frame is `Auto`, which resolves to `XArbitraryCorrectedZVertical` (`ReanimatedSensor.m:148-154`), an arbitrary-yaw frame with no north reference at all, and the hook's mount-bound lifecycle collides with this repo's gate-invisible-work rule. The brief names the accuracy loss a real cost, not a detail, and that alone disqualifies it as the sole source.
2. **R3 versus R5 on `expo-sensors` resolves 4 CONFIRMED, 1 PARTLY.** The remap skip, the accuracy drop and the radians mislabel are confirmed at file and line. The five-sensors charge is confirmed with a sharper consequence than R3 stated: on the 3T (API 28) the high-sampling gate short-circuits true, so all five sensors run at `SENSOR_DELAY_FASTEST` (`SensorSubscription.kt:49-52`), roughly 1000 main-thread callbacks per second while the sheet is open. The 5 Hz charge is the PARTLY one: true on Android 12 and above without a manifest permission, but backwards on the 3T, which gets 200 Hz sensor delivery with JS events gated by the Choreographer to the display rate.
3. **The dist-tag trap is confirmed exactly as R5 reported.** `latest` is 57.0.3, the SDK 58 line publishes under `next`, and 58.0.0 (2026-09-10) is its only stable member. Quoted registry output in section 2.
4. **The winning route is a local Android-only Expo module in the `modules/tls13` shape, roughly 120 to 180 lines of Kotlin plus a thin TS wrapper, with iOS left untouched on `expo-location`.** R2 established the iOS path already works and needs no change, so the module needs no Swift half, and the platform split removes the entire iOS test surface. The runner-up is the Reanimated hybrid, and it wins under one named condition in section 3.
5. **The hybrid is architecturally sound but over-engineered today.** Two subscriptions share one activated sensor, so the second costs event dispatch, not a second gyro (client side source-verified; server side conservative). Given the dial already measures a 16.7 ms median frame gap on the JS-fed architecture (AGENTS.md, session 37), the hybrid's congestion immunity buys nothing measured, and the accuracy constraint forces a local module anyway.

## 1. The route nobody audited: `useAnimatedSensor(SensorType.ROTATION)`

Audited from the installed `react-native-reanimated@4.7.0` (`package.json` range `4.7.0`, `node_modules/react-native-reanimated/package.json` version `4.7.0`), plus `react-native-worklets@0.13.0` which supplies the runtime primitives. The `animations` and `multithreading` skills were loaded before this section per the brief.

### 1.1 What `SensorType.ROTATION` maps to natively

**Android: `TYPE_ROTATION_VECTOR`, sensor type 11.** `ReanimatedSensorType.kt:12`: `ROTATION_VECTOR(Sensor.TYPE_ROTATION_VECTOR)`. The JS enum value `ROTATION = 5` (`commonTypes.ts:330`) maps through `getInstanceById` (`ReanimatedSensorType.kt:19-27`, where the `when` arm for id 5 returns `ROTATION_VECTOR`). It is not `TYPE_GAME_ROTATION_VECTOR` (15) and not the geomagnetic variant (20). This is the same fused, magnetic-north-referenced sensor R3 identified as the platform-blessed compass source.

**iOS: `CMMotionManager` device motion, `startDeviceMotionUpdatesUsingReferenceFrame:`** (`ReanimatedSensor.m:157`). Each sensor type maps to its own Core Motion stream; ROTATION maps to the attitude path (`ReanimatedSensor.m:34-36` dispatches to `initializeOrientation`).

### 1.2 The iOS reference frame, and whether it is configurable

Configurable, with one trap. The JS config accepts `iosReferenceFrame` from the `IOSReferenceFrame` enum (`commonTypes.ts:332-338`): the four `CMAttitudeReferenceFrame` values plus `Auto`, in enum order, so `XTrueNorthZVertical` is index 3 and the native side computes `1 << _referenceFrame` (`ReanimatedSensor.m:156-157`).

The default is `Auto` (`useAnimatedSensor.ts:116`). `Auto` never picks a north frame: with a magnetometer present it resolves to `XArbitraryCorrectedZVertical` (index 1), without one to `XArbitraryZVertical` (index 0) (`ReanimatedSensor.m:148-154`). **A caller using the defaults gets a yaw with no north reference at all on iOS.** For a compass you must pass `iosReferenceFrame: IOSReferenceFrame.XTrueNorthZVertical` explicitly, which per R2's report carries the true-north frame's dependency on location services being available. This contradicts the impression R4's summary left, that the quaternion and yaw arrive compass-ready; see the contradictions section.

### 1.3 What it delivers, in what units, signs and ranges

`ValueRotation` (`commonTypes.ts:372-381`): `qw, qx, qy, qz, yaw, pitch, roll, interfaceOrientation`. All angles are radians, undocumented as such in the type.

Android path, `ReanimatedSensorListener.kt:39-55`:

- `getQuaternionFromVector(quaternion, event.values)` then `getRotationMatrixFromVector` then `getOrientation`. AOSP `SensorManager.getQuaternionFromVector` stores `[w, x, y, z]` and reads only `rv[0..3]` (API 28 source, `SensorManager.java:1713-1723`), so the rotation vector's fifth value never enters.
- The data array is `quaternion[1], quaternion[3], -quaternion[2], quaternion[0]` for the four quaternion slots, which the C++ maps to `qx, qy, qz, qw` (`AnimatedSensorModule.cpp:45-48`). Net effect: `qx = x`, `qy = z`, `qz = -y`, `qw = w`. The in-source comment says why: "make Android consistent with iOS, which is better documented here" with a Core Motion link (`ReanimatedSensorListener.kt:46-50`).
- Euler slots: `yaw = -orientation[0]`, `pitch = -orientation[1]`, `roll = orientation[2]`. `getOrientation` returns azimuth, pitch, roll in radians with azimuth in (-pi, pi] (R3 section 2, from the same API 28 source). So Reanimated's `yaw` is the negated azimuth, range [-pi, pi). A compass bearing on Android portrait is `((toDegrees(-yaw) % 360) + 360) % 360` plus declination. Three lines in a worklet.

iOS path, `ReanimatedSensor.m:164-172`: `attitude.quaternion.(x, y, z, w)` and `attitude.yaw, pitch, roll` passed through unchanged, radians, `[-pi, pi]` per Core Motion. So the two platforms agree with each other by construction (Android is remapped onto iOS conventions), and the agreement is the API's main cross-platform virtue.

**No timestamp.** The C++ TODO says it outright: "timestamp should be provided by the platform implementation" (`AnimatedSensorModule.cpp:42-44`). A rate-adaptive filter needs `dt`; a worklet must derive it from `performance.now()` or from `useFrameCallback`'s frame time rather than the sample.

### 1.4 Screen orientation: remap or not

Not. Android passes `display.rotation` as degrees alongside the data (`ReanimatedSensorListener.kt:30-36`) and never calls `remapCoordinateSystem`. The compensation lives in a JS worklet, `adjustRotationToInterfaceOrientation` (`useAnimatedSensor.ts:36-59`), which shifts `yaw` by plus or minus 90 degrees for landscape and then re-derives the quaternion from the shifted Euler angles.

For this app the distinction is academic and the behaviour correct: the app is portrait-locked (`app.json` `"orientation": "portrait"`) on portrait-natural phones, so `display.rotation` is `ROTATION_0`, the JS adjustment is a no-op, and the skipped remap is the identity case (R3 section 2 establishes the same for expo-sensors). The honest caveat: on a landscape-natural device the Euler-shift approximation diverges from a true frame remap at steep tilt, because yaw-only arithmetic ignores pitch and roll coupling. The app does not ship there.

### 1.5 The accuracy signal

Dropped, confirmed. `ReanimatedSensorListener.kt:73-76`:

```kotlin
override fun onAccuracyChanged(
    sensor: Sensor,
    accuracy: Int,
) {}
```

`event.accuracy` per sample is never read either; `onSensorChanged` consumes only `event.values`. On iOS there is no accuracy surface in the payload at all (`ReanimatedSensor.m:164-174`). This settles R3 and R5's shared finding for this wrapper too: every JS-accessible wrapper of the fused sensor discards the accuracy signal.

### 1.6 `interval` and supported rates

`interval: number | 'auto'` in milliseconds (`commonTypes.ts:341`). Android: the value becomes the `registerListener` sampling period in microseconds (`ReanimatedSensor.kt:38`, `interval * 1000`) and additionally a wall-clock gate per event (`ReanimatedSensorListener.kt:24-26`). `'auto'` passes -1 and becomes `DEFAULT_INTERVAL = 8` ms (`ReanimatedSensor.kt:23,32`), a fixed 125 Hz request. The docs claim `'auto'` "matches the device's screen refresh rate" [D]; on Android the source says 8 ms flat, so the docs are wrong for that platform at any refresh rate other than 125 Hz. The sensor's own range bounds the result (3T rotation vector 5 to 200 Hz, R3's dumpsys). iOS: `'auto'` becomes `1 / UIScreen.mainScreen.maximumFramesPerSecond` (`ReanimatedSensor.m:13-14`), an explicit number becomes seconds (`:16`). Any positive millisecond value is accepted; 0 would request FASTEST.

Practical setting for this app: `interval: 16` (60 Hz) on Android. The default 8 ms runs 125 worklet invocations per second on the main thread for no visual gain over 60 Hz.

### 1.7 New Architecture on RN 0.88, and API stability

New Architecture clean by construction: Reanimated 4 is New-Arch-only, and the sensor path is JSI end to end, `NativeProxy` C++ then a worklet runtime, with no legacy bridge events anywhere in the chain read this session. The hook is a public export (`src/index.ts:140`, no `unstable_` or `experimental` prefix) with a full reference page in the official 4.x docs [D]. Stable public API, then, but lightly loved: the empty accuracy handler and the still-open timestamp TODO are the marks of a feature with rough edges nobody has sanded. Two API quirks to design around:

- `isAvailable` is false at first render and only becomes true inside the effect that registers the sensor (`useAnimatedSensor.ts:123-168`), so the no-compass state needs a post-mount read, not a render-time one.
- The subscription is bound to the hook's component lifecycle. This repo's performance rule 7 gates invisible work, and its sheet surfaces follow the pre-mounted Overlay pattern (AGENTS.md section 4). A hook in a pre-mounted sheet spins the rotation vector at 125 Hz whenever the sheet exists, open or closed. The escape is a conditionally mounted child component carrying the hook, which is more machinery than the imperative subscribe and unsubscribe the current `watchHeading` contract already provides (`device/qibla.ts:99-110`).

### 1.8 Verdict on this route

Viable, genuinely attractive on the threading axis, and not shippable as the whole answer. It is the only route with zero JS crossings per sample, the only one whose two platforms agree on conventions by construction, and on iOS the only off-the-shelf way to request `XTrueNorthZVertical`, true north straight from the OS with declination applied by Core Motion. Against that: no accuracy signal at all (binding constraint), a default iOS frame that is not north-referenced (fixable in config, but silently wrong if missed), no per-sample timestamp, a mount-bound lifecycle that fights this repo's gating rule, and radians that someone still has to convert, normalise and declination-correct in a worklet. Against `expo-sensors` it wins outright on threading, sensor count and Android rate control. Against a local module it wins on JS immunity and loses on everything the needle's honesty depends on. The module comparison is section 3.

## 2. Adjudicating R3's five charges against `expo-sensors`

Version pinned and read: **`expo-sensors@58.0.0`**, obtained by `npm pack expo-sensors@58.0.0` into `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/R1/expo-sensors-58/` and extracting the tarball. All file and line references below are from that tarball. R3 read 58.0.8 from an opensrc cache and diffed 57.0.3 identical; I did not re-diff 58.0.8, so where line numbers could have drifted I say so.

Registry data pulled today [R]:

```
dist-tags = {
  'sdk-57': '57.0.3',
  canary: '58.0.0-canary-20260909-ea7a89a',
  next: '58.0.0',
  latest: '57.0.3',
  ...
}
"58.0.0": "2026-09-10T19:35:03.359Z"
```

Confirmed: `latest` points at the SDK 57 line, there is no `sdk-58` tag, and the stable SDK 58 package publishes under `next` with exactly one member, 58.0.0. For calibration, `expo-location`'s tags are `latest 57.0.20`, `next 58.0.8` (2026-09-28). A bare `yarn add expo-sensors` today installs 57.0.3 and breaks SDK lockstep, exactly as R5 warned.

### Charge 1: "skips `remapCoordinateSystem`" verdict CONFIRMED

`DeviceMotionModule.kt:246-248`: `getRotationMatrixFromVector(rotationMatrix, rotationEvent!!.values)` then `getOrientation(rotationMatrix, rotationResult)`, straight into the emit at 249-257. No remap anywhere in the file. Correct on a portrait-natural phone in a portrait-locked app (identity case), wrong by 90 degrees on landscape-natural hardware. Same line numbers R3 cited; the code matches.

### Charge 2: "drops all accuracy" verdict CONFIRMED

`DeviceMotionModule.kt:154`: `override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit`. The emit path (`eventsToMap`, 211-262) reads no `event.accuracy` and no `values[4]`. On iOS the payload (`DeviceMotionModule.swift:88-114`) carries no accuracy field either. Nothing in the package surfaces any trust signal for the rotation.

### Charge 3: "emits radians mislabeled in the TypeScript types" verdict CONFIRMED, with the inconsistency sharpened

Native emits radians: `rotationResult` from `getOrientation` goes out as `alpha = -rotationResult[0]`, `beta = -rotationResult[1]`, `gamma = rotationResult[2]` (`DeviceMotionModule.kt:252-254`), unconverted. The TS type documents `rotation.alpha` as "rotation around Z axis" with no unit (`src/DeviceMotion.ts:24-31`). Sharper than R3 put it: the sibling field `rotationRate` in the same measurement object IS converted to degrees (`Math.toDegrees`, `DeviceMotionModule.kt:239-241`), so `DeviceMotionMeasurement.rotation` is radians while `DeviceMotionMeasurement.rotationRate` is degrees per second, and neither type says so. A consumer who assumes symmetry between the two ships a factor of 57.3 bug. On iOS, `rotation.alpha` is `attitude.yaw` in radians (`DeviceMotionModule.swift:102`), so at least the platforms agree with each other.

### Charge 4: "runs at 5 Hz" verdict PARTLY

There are two independent throttles and R3 conflated them, in both directions.

The sensor delivery rate, `SensorSubscription.kt:21-26`:

```kotlin
private val samplingPeriodUs: Int
  get() = if (hasHighSamplingRateSensorsPermission()) {
    SensorManager.SENSOR_DELAY_FASTEST
  } else {
    SensorManager.SENSOR_DELAY_NORMAL
  }
```

And the gate, `SensorSubscription.kt:49-52`:

```kotlin
private fun hasHighSamplingRateSensorsPermission(): Boolean {
  if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
    return true
  }
  ...
```

So: on Android 11 and below, the permission check short-circuits true and the subscription requests `SENSOR_DELAY_FASTEST`. **The 3T (API 28) gets 200 Hz sensor delivery, not 5 Hz.** On Android 12 and above, the check inspects the manifest for `HIGH_SAMPLING_RATE_SENSORS`; expo-sensors' own manifest declares only `ACTIVITY_RECOGNITION` (`android/src/main/AndroidManifest.xml`), so on the Find X8 (Android 15) the subscription requests `SENSOR_DELAY_NORMAL`, 200,000 us, 5 Hz, and nothing in JS can raise it: `setUpdateInterval` sets a different variable.

The JS event rate is the second throttle, and its default is broken by a units mismatch: a Choreographer frame callback gates emission on `curTime - lastUpdate > updateInterval` (`DeviceMotionModule.kt:173-177`), where the clock difference is milliseconds but the default `updateInterval = 1.0f / 60.0f` (`:35`) is a value in seconds, 0.0167. Compared against milliseconds the gate always passes, so by default an event dispatches on every frame the Choreographer runs, about 60 Hz on the 3T, and the loop re-arms itself every frame whether or not any sensor fired (`:165-177`). `setUpdateInterval` writes milliseconds into the same field (`:69-71`, JS passes `intervalMs`), which makes the gate real: `setUpdateInterval(100)` then yields 10 Hz. The per-sensor `SensorSubscription`s are constructed with `updateInterval = 0` (`:52-53`), so that layer's millisecond gate (`SensorSubscription.kt:30-36`) passes everything except same-millisecond duplicates.

Net verdict: R3's 5 Hz is true for every device on Android 12 or newer unless the app adds `HIGH_SAMPLING_RATE_SENSORS` to its own manifest, and on those devices the rate is not configurable from JS at all. On the 3T floor device the claim is backwards: FASTEST delivery, Choreographer-cadence JS events at about 60 Hz by default, configurable downward through `setUpdateInterval` (the 200 Hz OS cap is the only ceiling, and it needs nothing below it). R3's companion figure "a default 100 ms updateInterval" is also wrong for this class: 100 ms is `SensorSubscription`'s constructor default (`SensorSubscription.kt:17`), which `DeviceMotionModule` overrides to 0; the operative default is the module's own 1/60 s constant, and being in seconds against a millisecond clock it gates nothing. Both corrections are in the contradictions section.

### Charge 5: "opens five sensors" verdict CONFIRMED, with the cost made concrete

`DeviceMotionModule.kt:24-30`:

```kotlin
private val sensorTypes = arrayListOf(
  Sensor.TYPE_GYROSCOPE,
  Sensor.TYPE_ACCELEROMETER,
  Sensor.TYPE_LINEAR_ACCELERATION,
  Sensor.TYPE_ROTATION_VECTOR,
  Sensor.TYPE_GRAVITY
)
```

`OnStartObserving` starts all five (`:105-109`), constructed unconditionally (`:49-54`). Two consequences R3 did not spell out:

- On the 3T, all five run at FASTEST (charge 4's short-circuit), so `onSensorChanged` fires on the main thread roughly 1000 times per second while the compass sheet is open (`:142-152`), each posting a frame callback. Small callbacks, but that is real main-thread work next to a 60 fps dial, and it is five times the event load of the one sensor the compass needs.
- `isAvailableAsync` requires all five (`:130-139`): a phone with a rotation vector but no `TYPE_LINEAR_ACCELERATION` reports unavailable. This is the mechanism behind the field reports R6 cited (expo issue 19523, `DeviceMotion.isAvailableAsync()` false on physical Android 8.1 and 12 devices): a missing fifth wheel hides a working compass.

### Charge 2b from R5's side, for completeness: the iOS frame

`SensorsUtils.swift:5-8` picks `xMagneticNorthZVertical` when available, else `xArbitraryCorrectedZVertical`. Confirmed as R5 reported: magnetic north on iOS, never true north, and the fallback is an arbitrary-yaw frame. `DeviceMotionModule.swift:54-56` starts updates on observe with no permission gate, matching R2's finding that `CMMotionManager` streams prompt nothing on the XS's iOS.

### Interim: is `expo-sensors` sufficient?

No. R5's case (zero new runtime dependencies, New Arch native, reads `TYPE_ROTATION_VECTOR`) is all true, and R3's case (no remap, no accuracy, radians, wrong rates, five sensors) is four-fifths true with the rate charge partly corrected. The decisive fact sits above both cases: the honest-needle constraint is binding per the brief, and `expo-sensors` provides no accuracy signal on either platform, in either version, with no configuration that changes that. A route that cannot report trust cannot carry this compass regardless of its other merits, and its second problem (5 Hz ceiling on every Android 12+ device without a manifest permission) lands on the owner's second phone. R3's conclusion stands; R5's recommendation does not.

## 3. The three-route comparison and the recommendation

Rows scored against this app's actual constraints: 60 fps target with a 30 fps floor on the OnePlus 3T, no API keys or external services, New Architecture on RN 0.88.0-rc.2 with Expo SDK 58 preview, Android 9 floor device, and the compass must stay honest about the needle.

| | `expo-sensors` DeviceMotion | Reanimated `useAnimatedSensor` | Local Expo module (Android-only) |
| --- | --- | --- | --- |
| Sensor per platform | Android `TYPE_ROTATION_VECTOR` plus gyro, accel, linear accel, gravity (all five, always). iOS `CMDeviceMotion`, `xMagneticNorthZVertical` [S] | Android `TYPE_ROTATION_VECTOR` alone. iOS `CMDeviceMotion`, frame configurable; default `Auto` resolves to `XArbitraryCorrectedZVertical`, no north [S] | Android `TYPE_ROTATION_VECTOR` alone at `SENSOR_DELAY_GAME`; `TYPE_GEOMAGNETIC_ROTATION_VECTOR` fallback with an honest "unfused" flag. iOS untouched, stays `expo-location` [S, design] |
| North reference | Magnetic on both platforms; declination ours to add [S] | Magnetic on Android; true north available on iOS only by passing `XTrueNorthZVertical` [S] | True north on Android via `GeomagneticField` declination, the same computation `expo-location` does today [S] |
| Accuracy signal | None, either platform [S] | None; `onAccuracyChanged` empty, `values[4]` and `event.accuracy` unread [S] | `event.accuracy` per sample plus `onAccuracyChanged` band, forwarded with every event [S, design] |
| Sample rate and configurability | Sensor rate FASTEST below Android 12, 5 Hz on Android 12+ without `HIGH_SAMPLING_RATE_SENSORS` in the app manifest; JS emission once per Choreographer frame by default (the ms gate's default is in seconds and always passes), `setUpdateInterval(ms)` makes the gate real [S] | `interval` in ms, `'auto'` default is fixed 8 ms (125 Hz) on Android regardless of screen rate, 1/maxFPS on iOS; configurable to any ms [S] | `SENSOR_DELAY_GAME` (50 Hz), chosen at registration; any rate we pick [S, design] |
| Screen-orientation remap | None; correct only for portrait-natural portrait-locked apps [S] | No native remap; yaw Euler-shift in a JS worklet, identity for this app's portrait lock [S] | `remapCoordinateSystem` per display rotation, the canonical sequence [S, design] |
| JS crossing per sample | One bundle per Choreographer tick on the client-code queue thread, default ceiling 60 Hz [S] | Zero; handler runs synchronously on the UI worklet runtime [S] | One event per sample at 50 Hz, same shape as today's `watchHeading` contract [S, design] |
| New runtime dependencies | The package itself; transitives zero (`invariant` already in tree); merges `ACTIVITY_RECOGNITION` into the app manifest [S, R] | None, already installed at 4.7.0 | None, `expo-modules-core` already in tree [S] |
| New Arch on RN 0.88 | Yes, ExpoModulesCore `ModuleDefinition` | Yes, JSI end to end, New-Arch-only library | Yes, same basis as `modules/tls13` and `modules/widgetrefresh` [S] |
| Android 9 floor device | Works, but spins five sensors at FASTEST, roughly 1000 main-thread callbacks per second [S] | Works; rotation vector present on the 3T, default 125 Hz should be configured down [S, R3 dumpsys] | Works; GAME rate is well inside the 3T's 5 to 200 Hz range [S, R3 dumpsys] |
| Code this repo owns | A TS wrapper plus the accuracy and declination workarounds it cannot provide | A worklet filter, sign and unit mapping, config pinning, a conditionally mounted hook carrier, plus a second native path for accuracy (mandatory) | One Kotlin file 120 to 180 lines, config json about 6 lines, TS wrapper 40 to 60 lines mirroring `device/qibla.ts` [S, estimate] |
| The risk that would sink it | No accuracy signal: the needle lies smoothly and the screen cannot say so, violating a binding constraint; 5 Hz ceiling on Android 12+ fleet devices | The accuracy gap forces a second sensor source anyway, so two paths must agree on sign, rate and frame; mount-bound subscription risks an always-on sensor behind a pre-mounted sheet; default iOS frame silently lacks north | Ours to break: the incumbent shipped a negative-declination sign bug, so the module's normalisation needs the test suite R3's six-step pipeline implies; owner maintains native code |

The module cost estimate is grounded in the two shipped modules. `modules/tls13` is the minimal shape: 17 lines of Kotlin plus a 6-line config, one `Function`. `modules/widgetrefresh` is the lifecycle-and-events shape: 386 lines of Kotlin across six files, `OnCreate`, `Function`, receivers. A compass module is between them and closer to tls13 plus one listener class: registration and unregistration on start and stop observing, the six-step pipeline in `onSensorChanged`, a one-shot `GeomagneticField` build, and event emission. Platform test surface: the 3T and the Find X8, no iOS surface at all because iOS code does not change.

### Recommendation

**The local Android-only Expo module.** Reasoning, in order of weight:

1. It is the only route that satisfies the binding constraint. Accuracy per sample, the honest fallback state, the fused flag, true north, degrees, one sensor at 50 Hz: every property the screen needs arrives from one small place this repo controls.
2. The repo's own measurements already retired the one argument against it. The JS-event-fed dial measured a 16.7 ms median frame gap with 89 percent of gaps at 60 fps and zero between 30 and 34 ms (AGENTS.md, session 37). A 50 Hz event stream through the existing `watchHeading` contract is the same architecture at a finer cadence. JS immunity is a benefit Reanimated offers that no measurement in this codebase says the compass needs.
3. It is a known quantity here. Two local modules ship today; the house pattern is established down to the config json shape; no new dependency, no manifest permission, no version pin to police against a moving `next` tag.
4. Android-only keeps iOS on the path R2 verified as already correct, deleting half the work and all of the iOS regression surface.

### Runner-up and its winning condition

**Runner-up: the Reanimated hybrid**, `useAnimatedSensor(SensorType.ROTATION, { interval: 16, iosReferenceFrame: XTrueNorthZVertical })` driving the needle in a worklet, with the local module reduced to an accuracy-only listener. It wins instead of the recommendation under exactly one condition: **a device measurement shows the 50 Hz JS event stream breaking the 30 fps floor on the 3T while the compass sheet is open**, with the countdown ticker and prayer-boundary timers running. That measurement does not exist today; the closest evidence points the other way. If a later build produces it, the hybrid is the right response, and section 4 says why its cost is acceptable.

## 4. The combination question

**Is running two sensor subscriptions at once wasteful?** Not in hardware. Within one process, each distinct `SensorEventListener` gets its own `SensorEventQueue` and its own connection to the sensor service (`SystemSensorManager.java:169-182`, read from the API 28 source: the `mSensorListeners` map keys queues by listener, so two listeners means two queues and two connections). The physical sensor, though, is a shared system resource the service activates once for any number of clients and then multiplexes; that server-side behaviour I did not read from `SensorService.cpp` this session, so it stands on platform architecture rather than a pasted line (see COULD NOT VERIFY). The working claim is the conservative one: the hybrid's second subscription costs a second event dispatch path, not a second gyro.

**What does it cost in battery?** Roughly the second dispatch path and nothing else. The sensor hub runs once either way; on the 3T the gyro is an LSM6DS3 package member already spun up by the fusion (R3 section 5). Event dispatch for a 7-float sample is microseconds. The compass subscribes only while the sheet is open, so the exposure is tens of seconds against a screen that dwarfs it.

**Is the hybrid worth its complexity?** Not today, and the reasoning is the repo's own evidence rather than taste. The hybrid's entire value is congestion immunity for the needle, and the dial's measured frame record says the JS-fed architecture already meets the floor on the floor device. Against that unbanked benefit it costs: two sources of one heading that must agree on sign, units, frame and rate; a worklet-side mapping of a negated radian yaw with a swapped-quaternion convention; no per-sample timestamp from Reanimated's side, forcing the filter to derive `dt`; a hook lifecycle that needs a conditionally mounted carrier to honour rule 7; and an `isAvailable` flag that is wrong until an effect runs. Every one of those is soluble and none is free. The local module delivers the same honesty and the same smoothness guarantee the app has already measured, in one path, in about 150 lines. Keep the hybrid as the named fallback from section 3, not as the opening move.

## Where I contradict a sibling report

- **R4, on the compass-readiness of Reanimated's output.** R4's summary recommends the sensor as delivering "the fused quaternion plus yaw straight to a UI-thread shared value". The threading half is correct and I confirmed it deeper than R4 did. The compass-readiness half is wrong by omission: the default iOS frame is `Auto`, which resolves to `XArbitraryCorrectedZVertical` (`ReanimatedSensor.m:148-154`), so the default yaw has no north reference at all, and no accuracy or timestamp rides along. A caller who ships R4's recommendation as written gets an arbitrary-frame yaw on iOS and silently loses the honesty rule on both platforms. The fix is one config line plus the parallel accuracy path R4 does propose, and R4's own caveat paragraph acknowledges the accuracy drop; the arbitrary default frame is the part its summary omitted.
- **R4, on what `interval` is.** R4 calls it "a wall-clock throttle on reads". It is both that and the `registerListener` sampling period (`ReanimatedSensor.kt:38`), and the `'auto'` default is a fixed 8 ms on Android, not the screen rate the docs claim. The distinction matters because the throttle alone would still deliver every event the sensor sends.
- **R3, on the 5 Hz charge.** Partly wrong, in both directions, and the correction changes which device the problem lands on. The 3T (API 28) short-circuits the permission check true and runs the sensors at FASTEST (`SensorSubscription.kt:49-52`), so the floor device gets 200 Hz delivery with JS events Choreographer-gated to about 60 Hz. The 5 Hz cap is real on Android 12 and above without `HIGH_SAMPLING_RATE_SENSORS` in the app manifest, which lands on the Find X8, and on those devices `setUpdateInterval` cannot fix it because it gates a different variable. R3's core conclusion (custom module required) survives; its rate model does not.
- **R3, on the default update interval.** R3 says the stream is "throttled further by a default 100 ms `updateInterval`". The 100 ms figure is `SensorSubscription`'s constructor default, which `DeviceMotionModule` overrides to 0 at construction (`DeviceMotionModule.kt:52-53`); the operative default is the module-level `1/60` s Choreographer gate (`:35`). R3's line citation for the 5 Hz (`SensorSubscription.kt:21-26`) is accurate; this companion figure is not.
- **R5, on the recommendation.** R5 recommends `expo-sensors` pinned `~58.0.0`. Its factual audit is almost entirely correct (the dist-tag trap, the magnetic frame on iOS, the accuracy drop, zero new transitive dependencies), but the recommendation does not survive contact with the binding constraint R5 itself documented in the same table: no accuracy signal, no true north, and now also a 5 Hz ceiling on every Android 12+ fleet device. R5 also missed the Reanimated route entirely, as the brief noted; this report is that missing audit.
- **R6, on the mechanism behind expo issue 19523.** R6 cited `isAvailableAsync` returning false on two physical devices as a field report. `DeviceMotionModule.kt:130-139` supplies the mechanism: availability requires all five sensors, so a device missing `TYPE_LINEAR_ACCELERATION` or `TYPE_GRAVITY` reports no compass despite a working rotation vector. Corroborated, not contradicted; recorded because it upgrades R6's [P] report to a source-verified design fact.

## COULD NOT VERIFY

1. **expo-sensors 58.0.8 line-number identity with 58.0.0.** I audited 58.0.0 from the tarball and did not fetch 58.0.8, which R3 read and R5's pin `~58.0.0` would not reach on install today (only 58.0.0 exists in the `~` range). Tried: nothing further, the `next` tag's single member is what an install resolves, so 58.0.0 is the version that matters. Risk: line numbers in 58.0.0.8-era citations may drift by a line or two.
2. **The sign convention of `CMAttitude.yaw` against compass bearings on a physical iPhone.** The mapping for Reanimated on iOS with `XTrueNorthZVertical` (negate, degrees, mod 360) follows from the header conventions R2 read, but no device run confirmed it. Needs the XS probe R2 could not sign.
3. **Whether Reanimated's sensor keeps delivering after the app is backgrounded on the 3T**, given the registration happens from the main looper. R6 documented sensor pause on screen-off for Wear OS; the analogous Android 9 phone behaviour was not measured here.
4. **Per-sensor battery figures for the hybrid's second dispatch path.** No measurable difference exists in any dump this session; asserting one would need the soak test R3 also declined.
5. **The server-side fan-out in Android 9's `SensorService`.** I verified the client-side shape (one queue per listener) from the API 28 `SystemSensorManager` source but did not read `SensorService.cpp` myself; R3's report describes its registration model, and I lean on that as sibling-verified rather than my own read. The conservative claim in section 4 does not depend on it.
6. **The exact latency added by expo-sensors' Choreographer dispatch** versus Reanimated's direct write. Architecture establishes the ordering (frame-gated versus immediate) but no millisecond figure was measured.

## Sources

| Grade | Source | What it established |
| --- | --- | --- |
| [S] | `node_modules/react-native-reanimated@4.7.0`: `ReanimatedSensorType.kt`, `ReanimatedSensorListener.kt`, `ReanimatedSensor.kt`, `ReanimatedSensorContainer.kt`, `NativeProxy.kt`, `SensorSetter.kt`, `ReanimatedSensor.m`, `ReanimatedSensorType.h`, `src/hook/useAnimatedSensor.ts`, `src/commonTypes.ts`, `src/Sensor.ts`, `src/SensorContainer.ts`, `src/index.ts` | Android sensor type 11, the quaternion and Euler extraction with sign flips, empty `onAccuracyChanged`, no remap, default 8 ms interval, iOS frame selection and configurability, `showsDeviceMovementDisplay`, public export |
| [S] | `node_modules/react-native-reanimated/Common/cpp/reanimated/AnimatedSensor/AnimatedSensorModule.cpp`, `android/src/main/cpp/reanimated/android/NativeProxy.cpp`, `SensorSetter.h` | The setter lambda runs `runSyncOnRuntime` on the UI worklet runtime; property mapping `qx..qw, yaw, pitch, roll`; the timestamp TODO; the ignored iOS frame parameter on Android |
| [S] | `node_modules/react-native-worklets@0.13.0` `WorkletRuntime.h:128-138`, `Compat/StableApi.cpp:117-147` | `runSyncAndDiscard` is a synchronous, locked call into the target runtime |
| [S] | AOSP API 28 `SystemSensorManager.java` and `SensorManager.java` (aosp-mirror GitHub, tag android-9.0.0_r1, fetched this session) | No-handler `registerListener` delivers on the main looper; one `SensorEventQueue` per listener; `getQuaternionFromVector` stores `[w,x,y,z]` and reads `rv[0..3]` only |
| [S] | `expo-sensors@58.0.0` tarball (npm pack, 2026-09-29): `DeviceMotionModule.kt`, `SensorSubscription.kt`, `AndroidManifest.xml`, `SensorsUtils.swift`, `DeviceMotionModule.swift`, `src/DeviceMotion.ts`, `src/DeviceSensor.ts`, `package.json` | All five adjudicated charges, the two-throttle rate model, the all-five availability gate, the radians-versus-degrees split, the ACTIVITY_RECOGNITION-only manifest, `invariant` as the sole dependency |
| [S] | `node_modules/expo-location` `LocationModule.kt:634-643` | The incumbent registers raw magnetometer plus accelerometer at `SENSOR_DELAY_NORMAL`; the module's output is what the local module replaces on Android |
| [S] | Repo: `modules/tls13` (17-line Kotlin, 6-line config), `modules/widgetrefresh` (386 lines Kotlin, six files), `device/qibla.ts`, `app.json` | The house module pattern and the line-count basis for the cost estimate; the imperative subscribe contract; the portrait lock |
| [D] | docs.swmansion.com react-native-reanimated 4.x `useAnimatedSensor` reference (fetched 2026-09-29) | Public documented API; the `'auto'` "matches screen refresh" claim the Android source contradicts; "most sensors up to 100Hz" |
| [D] | docs.expo.dev v58 `DeviceMotion` reference (fetched 2026-09-29) | `setUpdateInterval` contract, the 200 Hz permission note, `motionPermission` plugin option |
| [R] | `npm view expo-sensors dist-tags / time / versions`, `npm view expo-location dist-tags`, 2026-09-29 | `latest 57.0.3`, `next 58.0.0` published 2026-09-10, sole stable SDK 58 member; expo-location `next 58.0.8` |
| [S] | Sibling reports R2, R3, R4, R5, R6 (read in full) | The iOS frame semantics and the recommendation to leave iOS alone (R2); the six-step pipeline, 3T dumpsys sensor facts, `SensorService` multicast shape, `GeomagneticField` error figures (R3); the filter design and the effective-time-constant analysis (R4); the registry and package audit being arbitrated (R5); the field evidence and the expo 19523 report (R6) |
