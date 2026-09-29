# R5: the adhan question, the Kaaba coordinates, and the fused-heading package audit

Session 40, research agent R5. Date: 2026-09-29. Every load-bearing claim carries a file path and line, a URL, or pasted command output pulled today.

## Summary

`adhan` stays, unchanged. Its qibla function is pure arithmetic over two latitude and longitude numbers, proven from its own source below. It has zero dependencies, touches no sensor, no permission and no network, and the app calls it in exactly one file. Changing where the heading comes from has no bearing on it whatsoever. `expo-location` also stays, because the permission flow and the position fix have no replacement in any sensor package; only its `watchHeadingAsync` loses the job, and only on Android, since its iOS heading is already gyro-fused through Core Location. The recommended replacement for the Android needle is `expo-sensors` pinned at `~58.0.0` (resolves to `58.0.0`, published 2026-09-10 under the `next` dist-tag): its `DeviceMotion` reads `TYPE_ROTATION_VECTOR` on Android and `CMDeviceMotion` on iOS, it adds zero new runtime dependencies (`invariant` is already in the tree), and it is New Architecture native. Two design constraints dominate everything else: neither fused path gives true north (both reference magnetic north), and `expo-sensors` drops the rotation vector's own accuracy estimate, so the calibration flag needs a new source.

## 1. The adhan question, settled from source

The owner asked: "Does this mean we have to move away from the adhan package, because that one has the qibla?"

**No. `adhan` computes the bearing, not the heading, and the two are independent inputs to the needle.**

The complete code that runs when the app calls `Qibla` is three files. Here is all of it.

`node_modules/adhan/lib/cjs/Qibla.js`, lines 10 to 19, in full [S]:

```js
function qibla(coordinates) {
  var makkah = new _Coordinates["default"](21.4225241, 39.8261818);

  // Equation from "Spherical Trigonometry For the use of colleges and schools" page 50
  var term1 = Math.sin((0, _MathUtils.degreesToRadians)(makkah.longitude) - (0, _MathUtils.degreesToRadians)(coordinates.longitude));
  var term2 = Math.cos((0, _MathUtils.degreesToRadians)(coordinates.latitude)) * Math.tan((0, _MathUtils.degreesToRadians)(makkah.latitude));
  var term3 = Math.sin((0, _MathUtils.degreesToRadians)(coordinates.latitude)) * Math.cos((0, _MathUtils.degreesToRadians)(makkah.longitude) - (0, _MathUtils.degreesToRadians)(coordinates.longitude));
  var angle = Math.atan2(term1, term2 - term3);
  return (0, _MathUtils.unwindAngle)((0, _MathUtils.radiansToDegrees)(angle));
}
```

Its only imports are `./Coordinates.js` and `./MathUtils.js` (lines 7 and 8 of the same file). `Coordinates.js` lines 13 to 17 is a class that stores two numbers [S]:

```js
var Coordinates = exports["default"] = _createClass(function Coordinates(latitude, longitude) {
  _classCallCheck(this, Coordinates);
  this.latitude = latitude;
  this.longitude = longitude;
});
```

`MathUtils.js` lines 11 to 22 is degree and radian conversion plus range normalisation [S]:

```js
function degreesToRadians(degrees) { return degrees * Math.PI / 180.0; }
function radiansToDegrees(radians) { return radians * 180.0 / Math.PI; }
function normalizeToScale(num, max) { return num - max * Math.floor(num / max); }
function unwindAngle(angle) { return normalizeToScale(angle, 360.0); }
```

That is the entire runtime. `Math.sin`, `Math.cos`, `Math.tan`, `Math.atan2`, arithmetic. There is no `import` of anything outside these files, no `NativeModules`, no `fetch`, no permission string, no platform check. `adhan`'s own `package.json` confirms it: `"dependencies"` is absent entirely, and the entry is pure CommonJS JavaScript (`main: lib/cjs/Adhan.js`) [S, read from `node_modules/adhan/package.json`].

The app's usage is exactly one import site. A repo-wide grep for `from 'adhan'` returns `shared/qibla.ts:1` and nothing else outside tests [S]. And that file uses only two exports: `Coordinates` and `Qibla` (`shared/qibla.ts` line 1, lines 26 to 31).

So the division of labour is:

| Concept | Supplied by | Depends on the other? |
| --- | --- | --- |
| Bearing: which way Makkah lies from here | `adhan`, from the phone's position | No. It is a function of two coordinates. |
| Heading: which way the phone points | A sensor, today `expo-location` | No. It is a function of the hardware. |
| Needle: the rotation on the dial | `shared/qibla.ts` maths, from both | Yes, on both. |

Re-architecting the heading changes the second row only. The first row is untouched, its thirteen test invariants stay valid, and removing `adhan` would force the app to hand-write the very formula quoted above, which session 37 adopted `adhan` specifically to avoid. The owner's phrasing "that one has the qibla" conflates the bearing with the compass; `adhan` has the bearing, and the bearing is the half that is already exact.

## 2. The Kaaba coordinates: ours against adhan's against the world's

**adhan's internal constant.** `node_modules/adhan/lib/cjs/Qibla.js` line 11: `21.4225241, 39.8261818` [S]. The sibling implementation `batoulapps/adhan-swift` carries the identical numbers, `Sources/Qibla.swift`: `Coordinates(latitude: 21.4225241, longitude: 39.8261818)` [S, fetched from `raw.githubusercontent.com/batoulapps/adhan-swift/main/Sources/Qibla.swift`].

**Ours.** `shared/qibla.ts` line 12: `{ latitude: 21.4225241, longitude: 39.8261818 }` [S]. Identical to adhan, digit for digit, and `shared/__tests__/qibla.test.ts` lines 79 to 82 pin the restatement to adhan's private value through the meridian invariants [S]. Ours are right.

**Other candidates in the wild.**

| Source | Latitude | Longitude | Grade |
| --- | --- | --- | --- |
| `adhan` 4.4.6 and `adhan-swift` | 21.4225241 | 39.8261818 | [S] |
| `shared/qibla.ts` (ours) | 21.4225241 | 39.8261818 | [S] |
| Wikipedia (REST summary API, today) | 21.4225 | 39.82617 | [R] |
| `flutter_qiblah` `lib/src/utils.dart` | 21.422487 | 39.826206 | [S] |
| Abdali, "The Correct Qibla", official pre-GPS survey quoted in DMS | 21.423333 | 39.823333 | [W] |

**What the spread costs, computed.** I wrote a throwaway script (kept at `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/kaaba-spread.js`, not in the repo) that computes the great-circle bearing with adhan's own formula and measures the bearing difference each candidate causes, for twelve cities. Output, verbatim:

```
Candidate Kaaba positions (spread check):
  adhan          21.4225241, 39.8261818
  gcc_survey     21.4225087, 39.8261614
  wikipedia_2024 21.4224870, 39.8262061
  batoul         21.4224779, 39.8262132
  rounded        21.4225000, 39.8262000
  max pairwise separation: 6.4 m

Worst bearing error anywhere in the city list, across all candidates: 0.00012 deg
Session 37 claim to verify: 0.0037 deg. CONFIRMED as an upper bound

Outlier: Abdali official-survey (pre-GPS) coordinates 21.423333, 39.823333 vs adhan:
  London 0.0025, New York 0.0013, Jakarta 0.0001, Istanbul 0.0058, Cairo 0.0075 (worst)
  worst: 0.0075 deg

Scale check: bearing change from a 1 km observer position error (same cities):
  London 1 km north: 0.0084 deg, 1 km east: 0.0159 deg
  Cairo  1 km north: 0.0304 deg, 1 km east: 0.0368 deg
```

Interpretation:

- The modern candidates sit within 6.4 metres of each other. Across every city tested, choosing the "wrong" modern candidate bends the qibla by at most 0.00012 degrees. Session 37's figure of 0.0037 degrees is confirmed as a safe upper bound; I measure thirty times less.
- Even the pre-GPS survey outlier, roughly 310 metres away from the modern value, causes at most 0.0075 degrees. No candidate anywhere near the modern consensus can move a needle by a visible amount; one degree of needle rotation is over a hundred times the whole spread.
- A 1 km error in the observer's own position moves the bearing by up to 0.037 degrees, which is 300 times the modern candidate spread. The GPS fix, not the Kaaba constant, is the sensitive input, and that is why `device/qibla.ts` line 81 already uses Balanced accuracy and no better.

The current restated constant needs no change of any kind.

## 3. Does the app need `expo-location` after this change?

`device/qibla.ts` was read in full. It calls exactly four `expo-location` functions (plus `Linking.openSettings` from react-native, which is not expo-location):

| Call | Line | What it is for | Can a sensor package replace it? |
| --- | --- | --- | --- |
| `getForegroundPermissionsAsync` | 34 | Reading whether foreground location is granted, at every tap | No. Sensor packages carry the iOS motion permission, not location. |
| `requestForegroundPermissionsAsync` | 49 | Asking for foreground location, once, on this screen | No. Same reason. |
| `getCurrentPositionAsync({ accuracy: Balanced })` | 81 | The position fix the bearing is computed from | No. No sensor package fixes a position; that is GPS. |
| `watchHeadingAsync` | 100 | The heading stream, the needle's source | **Yes, on Android.** This is the one call that moves. |

So the obvious survivors are confirmed: the permission flow and the position fix stay with `expo-location`. There is no candidate in section 4 that supplies either.

One further fact narrows the change: **the defect is Android-only.** On iOS, `expo-location`'s heading is `CLLocationManager.startUpdatingHeading` (`node_modules/expo-location/ios/Providers/DeviceHeadingStreamer.swift` line 28 [S]), which Core Location fuses with the gyroscope at the OS level and returns `trueHeading` with declination already applied (LocationModule.swift line 114 passes `heading.trueHeading` straight through [S]). The wobbly unfused path exists only in the Android module, `LocationModule.kt` lines 634 to 652, which registers `TYPE_MAGNETIC_FIELD` and `TYPE_ACCELEROMETER` and calls `getRotationMatrix(rotationMatrix, inclinationMatrix, mGravity, mGeomagnetic)` [S]. There is no gyroscope anywhere in that Android code, confirming the brief.

The likely final shape:

| Job | Package |
| --- | --- |
| Permission ask and read | `expo-location` |
| Position fix | `expo-location` |
| Bearing to the Kaaba | `adhan` |
| iOS heading | `expo-location` (already fused, already true north) or the new source, per the design session's choice |
| Android heading | `expo-sensors` `DeviceMotion` (or a local module, see section 4) |

One open input the design session must settle: on Android the fused heading is magnetic-referenced (section 4), so true north needs declination. Three no-network options: compute it from `GeomagneticField` exactly as `LocationModule.kt` lines 688 to 692 do today, in a local module or patch; derive it from `expo-location`'s own stream as `trueHeading` minus `magHeading`, averaged, since declination drifts slowly; or rotate the qibla bearing by declination once per position fix instead of rotating the heading. All three are pure arithmetic.

## 4. Every route to a fused heading in React Native

Registry data pulled 2026-09-29 via `npm view` and the npm downloads API; repository data via the GitHub API. "True north" and "gyro-fused" are read from each package's native source, not from its README.

| Package | Latest and date | Weekly downloads | Licence | Runtime deps | New Architecture (verified how) | Maintained | True north | Gyro-fused | Verdict for this app |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `expo-sensors` (`DeviceMotion`) | 58.0.0, 2026-09-10 (`next`; `latest` is 57.0.3) | 513,449 | MIT | 1: `invariant`, already in tree | Yes. ExpoModulesCore `ModuleDefinition`, Kotlin and Swift; SDK 58 is New-Arch-first and this app runs 20 sibling expo modules on Fabric | Yes, actively (part of Expo) | **No.** Android `TYPE_ROTATION_VECTOR` is magnetic-referenced (Android docs: "Y ... points towards magnetic north"); iOS code picks `.xMagneticNorthZVertical` first (`SensorsUtils.swift`) | Yes. Android `sensorTypes` includes `TYPE_ROTATION_VECTOR` and `TYPE_GYROSCOPE` (`DeviceMotionModule.kt`); iOS `CMDeviceMotion` | **Recommended.** Zero new deps, autolinks, SDK-locked, fused on both platforms. Drops the sensor's own accuracy estimate and needs declination for true north. |
| `react-native-sensors` (orientation sensor) | 7.3.6, npm latest publish 2022-11-21 | 54,918 | MIT | 1: `rxjs` (new to tree) | **No.** Legacy `ReactContextBaseJavaModule`, no `codegenConfig`; a maintainer-adjacent reply on issue 469 states RN 0.82+ New Architecture is not supported out of the box | Repo pushed 2026-09-24 but only dependency bots; last human npm publish 2022 | No | Android yes: `RNSensorsPackage.java` maps `RNSensorsOrientation` to `Sensor.TYPE_ROTATION_VECTOR`. **iOS broken for compass use:** `RNSensorsOrientation.m` calls `startDeviceMotionUpdatesToQueue` with no reference frame, so yaw is against the arbitrary startup frame, not north | Rejected. New Arch unverified, adds `rxjs`, and its iOS yaw has no north reference at all. |
| `react-native-compass-heading` | 2.0.2, 2025-04-03 | 4,386 | MIT | 0 | No. Legacy `RCTEventEmitter` and `ReactContextBaseJavaModule`, no `codegenConfig` | Pushed 2025-11-26, 176 stars, 7 open issues | No (returns magnetic azimuth) | **No on Android.** `CompassHeadingModule.kt` registers `TYPE_ACCELEROMETER` and `TYPE_MAGNETIC_FIELD` with a 0.97 low-pass, then `getRotationMatrix(R, I, mGravity, mGeomagnetic)`: the same unfused pair as the incumbent. Also hardcodes `accuracy: 1.0` into every event | Rejected. It is the incumbent's defect repackaged; it does not solve the problem it would be installed for. |
| `react-native-simple-compass` | 1.0.0, 2017-07-14 | 12 | none declared | 0 | No, legacy | Last push 2021; 14 open issues on 41 stars | No | No evidence of fusion; iOS-only origin | Rejected. Abandoned, unlicensed, effectively unused. |
| `react-native-orientation` (yamill) | 3.1.3, 2022-06 | 1,224 | not checked | not checked | n/a | Last publish 2022 | n/a | n/a | Rejected. Measures screen orientation, not compass heading. Wrong problem. |
| `react-native-orientation-locker` | 1.7.0, 2024-04-20 | 135,077 | MIT | 0 | Not verified here | Pushed 2026-05, 805 stars | n/a | n/a | Rejected for the same reason: screen orientation, not heading. Listed because the brief named it. |
| `expo-location` (incumbent) | 58.0.8, 2026-09-28 (`next`) | 2,628,991 | MIT | already installed | Yes (same ExpoModulesCore basis) | Yes | **Yes, both platforms.** Android adds `GeomagneticField` declination (`calcTrueNorth`, lines 688 to 692); iOS passes Core Location's `trueHeading` | iOS yes (Core Location fuses). **Android no** (`LocationModule.kt` 634 to 652) | Keeps permission, position, and the iOS heading. Loses the Android heading. |
| `react-native-nitro-sensors` | 0.1.6, 2026-05-31 | 9 | MIT | 0; peers `react-native-nitro-modules`, which this tree already has at 0.37.1 | Yes by construction (Nitro is New-Arch-only; `HybridDeviceMotionSpec` classes read from the tarball) | Repo URL in package.json resolves to `lauridskern/nitroverse`, which the GitHub API cannot find; provenance unverifiable | No. Android requires `TYPE_ROTATION_VECTOR` (fused, magnetic); iOS calls `startDeviceMotionUpdates(to: .main)` with no reference frame, so attitude is arbitrary-frame | Yes on Android | Rejected on maturity and provenance alone: nine downloads a week and a source repository that cannot be located. Technically the closest non-Expo fit. |
| Local Expo module against `TYPE_ROTATION_VECTOR` / `CMDeviceMotion` | n/a | n/a | ours | 0 (expo-modules-core already in tree) | Yes, by construction | Ours | Ours to choose: Android needs `GeomagneticField` declination applied by us; iOS can request `.xTrueNorthZVertical` and get true north straight from the OS, which no third-party option does | Yes, same sensors | Runner-up. Full control, north-reference included, and Android's rotation vector carries a native accuracy estimate in `values[4]` that no wrapper exposes. Costs owned native code and two platform test surfaces. |

Two facts from this table constrain the design more than any preference:

1. **No off-the-shelf option gives true north from the fused path.** The Android rotation vector is magnetic-referenced by specification [D], `expo-sensors` picks the magnetic frame on iOS [S], and the two packages that could pick a frame either pick none (`react-native-sensors`, `react-native-nitro-sensors`) or do not use `CMDeviceMotion` at all. Declination has to be handled by us wherever the fused path is used. A local module is the only route that gets true north natively on iOS (`.xTrueNorthZVertical`).
2. **The rotation vector's own accuracy estimate is discarded by every wrapper.** Android documents `values[4]` as "estimated heading Accuracy (in radians)" [D]. `expo-sensors`' `eventsToMap` reads only `rotationResult[0..2]` [S]. So the `calibrated` flag that `device/qibla.ts` line 16 derives from `heading.accuracy` today has no direct replacement in `expo-sensors`, and the honesty rule needs re-deriving, which the brief already anticipated.

## 5. Bundle and dependency cost

This project rejected a library over two runtime dependencies before, so the accounting matters.

- `expo-sensors@58.0.0`: unpacked size 2,469,074 bytes across 405 files [R, `npm view`]. Most of that is native code for six sensors the app will not subscribe to; only `ExpoSensors` pod and the Android module compile in, and autolinking includes the module regardless of which sensor is used. One runtime dependency, `invariant@^2.2.4` [R], and it is already in the tree: `yarn why invariant` reports it hoisted from `@react-native#codegen` [R]. **Net new runtime dependencies: zero.**
- `expo-sensors` is not currently installed in any form. `yarn why expo-sensors` returns `error We couldn't find a match!` and `yarn list --pattern expo-sensors` returns no entries; both commands were run in the repo and their output is quoted here [R].
- `react-native-sensors@7.3.6`: 90,891 bytes, one dependency `rxjs` [R], which is new to the tree and would be the largest single addition on this page.
- `react-native-compass-heading@2.0.2`: 29,785 bytes, zero dependencies [R]. Cheap, and worthless here, because its Android path is the incumbent's unfused pair.
- `react-native-nitro-sensors@0.1.6`: 430,609 bytes, zero dependencies, peer already satisfied [R].
- Local module: zero published bytes; the cost is owned code.

One Android-specific cost of `expo-sensors` to flag now: its AndroidManifest declares `android.permission.ACTIVITY_RECOGNITION` [S, read from the sdk-58 branch]. Manifest merging puts that permission into the app's Play listing even though the compass never uses it; it is there for the pedometer. `expo-build-properties` plus a `tools:node="remove"` override in the app manifest can strip it, and the design session should decide whether to. On the iOS side the plugin adds `NSMotionUsageDescription`; note that `DeviceMotionModule.swift`'s `OnStartObserving` starts updates without any permission gate [S], so no second runtime dialog fires unless the app itself calls `requestPermissionsAsync`. The plist key must exist, the prompt need not happen.

The native binary delta of adding `expo-sensors` to the `.ipa` and `.apk` is not measured here; it needs a build, which is outside this agent's read-only scope.

## 6. The SDK-58 version trap, re-measured today

`npm view expo-sensors dist-tags`, pulled 2026-09-29 [R]:

```
dist-tags = {
  'sdk-50': '12.9.1',
  'sdk-51': '13.0.7',
  'canary-sdk-55': '55.0.9-canary-20260429-a5e59cf',
  'canary-sdk-56': '56.0.6-canary-20260701-9100865',
  'sdk-55': '55.0.19',
  canary: '58.0.0-canary-20260909-ea7a89a',
  next: '58.0.0',
  latest: '57.0.3',
  'sdk-57': '57.0.3'
}
```

Session 37's warning holds: `latest` points at 57.0.3, the SDK 57 line. There is no `sdk-58` dist-tag at all; the stable SDK 58 line is published under `next`, and it contains exactly one version, `58.0.0`, published 2026-09-10 [R]. Everything else in the 58 range is canary.

`expo/bundledNativeModules.json` in the installed tree pins `expo-sensors: ~58.0.0` [S, read from `node_modules/expo/bundledNativeModules.json`].

**The pin: `"expo-sensors": "~58.0.0"`, which resolves to 58.0.0.** Install it with `npx expo install expo-sensors`, matching the repo's own `add` script guidance, never a bare `yarn add expo-sensors` (which could float) and never a `latest` (which installs 57.0.3 and breaks SDK lockstep).

The standing repo rule, confirmed in `ai/AGENTS.md` line 115: **never run `npx expo install --fix`.** It reports against `bundledNativeModules.json` and would silently roll back three deliberately-ahead packages: `jest` 30.5.1 to `~29.7.0`, `@types/jest` 30.0.0 to 29.5.14, and `typescript` 7.0.2 to `~6.0.3`. `npx expo install --check` is safe and reports the same three. For completeness, `expo-location`'s correct pin is already in place: `next: 58.0.8`, installed `~58.0.8` [R].

## 7. Precedent: what shipped qibla code uses

I read the source of the two most-starred open-source qibla compass implementations reachable on GitHub, plus the Flutter ecosystem's standard chain.

**`flutter_qiblah` (154 stars, the de facto Flutter qibla package).** Its own Android code checks only for `TYPE_ROTATION_VECTOR` availability (`FlutterQiblahPlugin.kt` lines 33 to 36 [S]). The heading itself comes from `flutter_compass_v2`, which wraps `flutter_compass`. Its Kaaba sits at `21.422487, 39.826206` (`lib/src/utils.dart` [S]), inside the 6.4 metre modern consensus of section 2.

**`flutter_compass` (108 stars on hemanthrajv/flutter_compass, pub.dev latest 0.8.1, 2024-11-17).** This is the canonical Flutter compass, and its Android implementation is the pattern this session is moving to: `FlutterCompassPlugin.java` line 72 takes `Sensor.TYPE_ROTATION_VECTOR` as the primary compass sensor, and registers the accelerometer and magnetometer only as a fallback "when isCompassSensorAvailable()" is false (lines 78, 79, 153 to 181) [S]. It also remaps coordinates for display rotation at four orientations, applies a low-pass filter, and translates `onAccuracyChanged` into accuracy buckets of 15, 30 and 45 degrees for the JS side (lines 297 to 306) [S]. So the mainstream Flutter path is fused-first with an unfused fallback, and it reports accuracy alongside every reading.

**`hj-qibla-compass` (66 stars, Kotlin Compose).** `CompassSensors.kt` line 32 takes `TYPE_ROTATION_VECTOR` when present, computes azimuth from it (lines 51 to 57), and only registers the accelerometer-plus-magnetometer pair when the fused sensor is absent (lines 92 to 98), low-pass filtering that fallback path [S].

**iOS precedent.** Every implementation examined uses `CLLocationManager.startUpdatingHeading`, which is what `expo-location` already wraps; `react-native-compass-heading`'s iOS file is a thin `CLLocationManager` delegate returning `magneticHeading`. No credible qibla app reads raw magnetometer samples on iOS.

**Does anyone ship the raw magnetometer path this app uses today?** I found no credible qibla implementation that prefers it. Both credible sources treat accelerometer-plus-magnetometer as a fallback for hardware without the fused sensor. The one React Native package that uses it as its primary path, `react-native-compass-heading`, hardcodes its accuracy value to 1.0 and is the weakest package audited in section 4. The incumbent `expo-location` is in a small and defensible minority here: its choice is a library-level simplification, not an industry position.

**What users report about accuracy.** A qibla-app vendor states real-world compass accuracy of plus or minus 5 to 15 degrees depending on calibration [W, weslamic.com tool page]. The IJARPED Malaysia study the repo's own tests cite found 15 of 20 shipped apps correct and 5 wrong, with the flat-map and rhumb-line formulas as the separating failure; that failure is in the bearing, not the heading, and this app's bearing is already proven against a theodolite survey (`shared/__tests__/qibla.test.ts` lines 17 to 26). The residual user-facing complaint for correct-bearing apps is needle wobble, which is the gyro-fusion gap this session exists to close.

## COULD NOT VERIFY

- **The binary size delta** of adding `expo-sensors` to the production `.apk` and `.ipa`. Requires a build; this agent is read-only in the repo. What is known: 2.47 MB unpacked on disk, one pod and one Android module compiled in.
- **Google Maps' private implementation.** The claim that it reads `TYPE_ROTATION_VECTOR` is carried from the session-40 brief and matches the Android platform pattern, but Google ships no source to read. Treated as [U] here.
- **Whether `react-native-orientation` (yamill) supports the New Architecture.** Moot: it reports screen orientation, not heading, so it was eliminated before the check was worth making.
- **The source repository of `react-native-nitro-sensors`.** The package's own `repository` field points at `lauridskern/nitroverse`, which the GitHub API does not find; the code ships under `com.margelo.nitro` namespaces. The tarball was inspected directly (section 4), but no upstream issue tracker or commit history could be located to judge maintenance.
- **Exact human-maintenance cadence of `react-native-sensors`.** Its repository receives pushes in 2026, but every open item inspected is a dependency bot; the last npm publish a human could ship was 2022. The distinction between repo activity and release activity is asserted from the issue titles, not from a maintainer statement.

## Sources

| Claim | Source | Grade |
| --- | --- | --- |
| adhan qibla is pure trig over two coordinates | `node_modules/adhan/lib/cjs/Qibla.js` 10-19, `Coordinates.js` 13-17, `MathUtils.js` 11-22 | [S] |
| adhan has zero dependencies | `node_modules/adhan/package.json` | [S] |
| adhan used in exactly one file | repo grep, `shared/qibla.ts:1` | [S] |
| adhan internal Kaaba constant | `Qibla.js` line 11 | [S] |
| adhan-swift identical constant | `raw.githubusercontent.com/batoulapps/adhan-swift/main/Sources/Qibla.swift` | [S] |
| Our KAABA matches adhan, pinned by test | `shared/qibla.ts` line 12, `shared/__tests__/qibla.test.ts` 79-82 | [S] |
| Candidate spread 0.00012 deg; 1 km position error up to 0.037 deg | script output, `/private/var/folders/.../opencode/kaaba-spread.js` | computed, script preserved |
| Abdali pre-GPS survey coordinates | `geomete.com/abdali/papers/qibla.pdf` | [W] |
| Wikipedia Kaaba coordinates | `en.wikipedia.org/api/rest_v1/page/summary/Kaaba` | [R] |
| expo-location Android heading unfused | `node_modules/expo-location/android/.../LocationModule.kt` 634-652, 688-692 | [S] |
| expo-location iOS heading is Core Location, true north | `ios/Providers/DeviceHeadingStreamer.swift` 28, `ios/LocationModule.swift` 114 | [S] |
| device/qibla.ts call inventory | `device/qibla.ts` lines 34, 49, 81, 100 | [S] |
| expo-sensors Android reads TYPE_ROTATION_VECTOR, gyro in set | `expo/expo` sdk-58 branch, `DeviceMotionModule.kt` (sensorTypes list, eventsToMap) | [S] |
| expo-sensors iOS picks xMagneticNorthZVertical | sdk-58 branch, `SensorsUtils.swift` | [S] |
| expo-sensors drops the accuracy estimate | `eventsToMap` reads rotationResult[0..2] only | [S] |
| TYPE_ROTATION_VECTOR references magnetic north; values[4] is accuracy | `developer.android.com/reference/android/hardware/SensorEvent#values` | [D] |
| DeviceMotion needs NSMotionUsageDescription; plugin options | `docs.expo.dev/versions/v58.0.0/sdk/devicemotion/` | [D] |
| expo-sensors manifest declares ACTIVITY_RECOGNITION | sdk-58 branch, `android/src/main/AndroidManifest.xml` | [S] |
| No auto permission prompt on subscribe | sdk-58 branch, `DeviceMotionModule.swift` OnStartObserving; `DeviceSensor.ts` addListener | [S] |
| All versions, dates, licences, sizes, dist-tags | `npm view` and `api.npmjs.org/downloads`, 2026-09-29 | [R] |
| expo-sensors absent from tree | `yarn why expo-sensors`, `yarn list --pattern expo-sensors`, pasted in section 5 | [R] |
| bundledNativeModules pins `~58.0.0` | `node_modules/expo/bundledNativeModules.json` | [S] |
| Never `expo install --fix`; the three packages it would roll back | `ai/AGENTS.md` 113-125 | [S] |
| react-native-sensors maps orientation to TYPE_ROTATION_VECTOR; iOS uses no reference frame | `RNSensorsPackage.java`, `RNSensorsOrientation.m` | [S] |
| react-native-sensors New Arch unsupported | issue 469 reply, `github.com/react-native-sensors/react-native-sensors/issues/469` | [W] |
| react-native-compass-heading Android unfused, accuracy hardcoded 1.0 | `CompassHeadingModule.kt` 57-79, 126-129 | [S] |
| nitro-sensors Android requires rotation vector; iOS default frame | tarball inspection, `HybridDeviceMotion.kt` 26-41, `HybridDeviceMotion.swift` | [S] |
| flutter_compass rotation-vector-first with fallback and accuracy buckets | `FlutterCompassPlugin.java` 72-79, 150-181, 297-306 | [S] |
| hj-qibla-compass rotation vector first | `CompassSensors.kt` 32, 51-57, 92-98 | [S] |
| flutter_qiblah checks rotation vector support; its Kaaba constant | `FlutterQiblahPlugin.kt` 33-36, `lib/src/utils.dart` | [S] |
| Real-world compass accuracy plus or minus 5 to 15 degrees | weslamic.com qibla tool page | [W] |
