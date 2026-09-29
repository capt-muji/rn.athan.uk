# R2: iOS heading, end to end, at the platform level

Session 40 heading rearchitecture, iOS research. Evidence graded [A] Apple official, [S] source read, [W] web/secondary, [U] unverified. Every load-bearing claim carries a citation. Where Apple does not document behaviour, that is stated.

## Summary of findings

1. **`CLHeading` fusion is not documented sensor-by-sensor by Apple.** Apple's current docs say only that "the magnetometer determines a device's orientation relative to magnetic north" and that Core Location "also reports" true north when location is available [A]. WWDC 2017 session 704 is the strongest Apple statement available: it presents `CMDeviceMotion.heading` as the NEW heading API and describes Core Location's heading as one that "can fuse course" (GPS), not gyro [A]. No Apple source says Core Location's heading includes gyroscope input. That said, the headers show the heading service long predates any Apple statement of its internals: heading shipped in iOS 3.0 on the iPhone 3GS, a device with no gyroscope (gyro arrived with iPhone 4) [A/S]. The service therefore cannot be architecturally gyro-dependent, whatever the current fusion on modern hardware.
2. **The empirical picture contradicts "iOS never fuses gyro".** Multiple independent developer reports describe `CLHeading.trueHeading` as "extremely responsive and accurate" in ways raw magnetometer output is not [W]. The app's own experience, per session brief, is that iOS does not wobble the way Android's `watchHeadingAsync` does. I could not run the on-device A/B probe (no signing account on this machine, see COULD NOT VERIFY), so the fusion question on current hardware remains open at the level of Apple's public statements.
3. **The pragmatic answer for this app: the iOS code should not be touched.** `expo-location`'s `watchHeadingAsync` on iOS is a 53-line passthrough to `CLLocationManager.startUpdatingHeading` with zero smoothing and zero fusion of its own [S]. Whatever Core Location does is what the app already gets, and it already works. The rearchitecture is Android-only in effect.
4. **If iOS is ever moved to Core Motion, the pieces exist and mostly line up.** `CMDeviceMotion.heading` (iOS 11+) returns degrees in `[0, 360)` relative to the requested reference frame; with `.xTrueNorthZVertical` it is degrees from true north, directly substitutable for `trueHeading` [A]. It fuses accelerometer, gyroscope and magnetometer per WWDC 2017 [A].
5. **The motion permission prompt does not fire for `CMMotionManager` on iOS versions the XS runs.** `NSMotionUsageDescription`'s required-API list is `CMSensorRecorder`, `CMPedometer`, `CMMotionActivityManager`, `CMMovementDisorderManager` [A]. `CMMotionManager` is absent from it, absent from the header's authorization surface, and absent from WWDC 2017's "Sensitive Interfaces" slide [A/S]. Caveat: iOS 26 hardened TCC around motion, with a confirmed kill for `CMAltimeter.stop*` misuse; the XS tops out at iOS 18 so this does not apply to it, but a future device swap matters (detail in Q5) [W].
6. **The honest-needle signal survives a Core Motion move, with a caveat.** `CMDeviceMotion.magneticField.accuracy` (the `CMMagneticFieldCalibrationAccuracy` enum: uncalibrated/-1, low/0, medium/1, high/2) exists since iOS 4/5 and is the natural replacement for the current `accuracy > 1` gate [A/S]. But `CMDeviceMotion.headingAccuracy` in degrees, the true like-for-like, is `API_AVAILABLE(ios(27.0))` and does not exist on any OS the XS can run [S].

## Q1. What does `CLLocationManager`'s `CLHeading` actually fuse on iOS?

**Apple does not document the sensor fusion behind `CLHeading`.** What Apple states, verbatim:

- `CLHeading.h` header (Xcode 27 iPhoneOS 27.0 SDK, read from disk): "Represents a vector pointing to magnetic North constructed from axis component values x, y, and z. An accuracy of the heading calculation is also provided along with timestamp information." [A] This describes the object's construction from the raw magnetometer vector, nothing more.
- Current article "Getting heading and course information" (developer.apple.com, fetched 2026-09-29): "Heading information is available only on devices with a built-in magnetometer; it's not available in iOS Simulator. The magnetometer determines a device's orientation relative to magnetic north. When location data is available, Core Location also reports the device's orientation relative to true north." [A] Note for the note attached: "If you want heading objects to contain valid data for the trueHeading property, configure your location manager object to deliver location updates." [A]
- WWDC 2017 session 704 "Creating Immersive Apps with Core Motion" (official transcript PDF, devstreaming-cdn.apple.com): the "Heading" section contrasts the two APIs. "Could use CoreLocation / CoreLocation's heading can fuse course" (GPS course), then announces "We now provide heading ... Fuses accelerometer, gyroscope, and magnetometer ... iOS only" for `CMDeviceMotion.heading` [A]. If Core Location's heading were already gyro-fused, this session had no reason to exist in that form. The session treats gyro-fused heading as the new thing Core Motion adds.

**Archaeology:** `startUpdatingHeading` is `API_AVAILABLE(ios(3.0))` (CLLocationManager.h, read from disk) [A]. The iPhone 3GS, the launch device for iOS 3.0, has a digital compass (magnetometer) and a 3-axis accelerometer and no gyroscope; Apple's own tech specs for the 3GS list "Digital compass" and no gyro, and the iPhone 4 specs are the first to add "Three-axis gyro" [A, support.apple.com en-us/112307 and the iPhone 4 equivalent]. The service was therefore designed for a magnetometer-plus-accelerometer world, exactly like Android's `SENSOR_ORIENTATION` legacy path. Modern iPhone hardware and the locationd daemon almost certainly do more than that today, but Apple has not published it.

**Reverse-engineering grade:** I found no credible disassembly or leaked-source claim about locationd's heading fusion. Stack Overflow answers asserting "it fuses the gyro" exist and I grade them [W] and reject them as proof; none cites an Apple source.

**What this means for the rearchitecture:** on iOS the app receives `CLHeading` unmixed and unfiltered by anything in the JS stack (verified in source below). If iOS needles look stable today, that stability comes from Core Location itself. The owner's premise that "iOS is fine" is consistent with everything I could verify, and nothing I could verify contradicts "iOS already benefits from some fusion on modern hardware". But there is no Apple statement that iOS heading is gyro-fused, so the honest position is: not documented, likely fused on modern hardware, and the app already receives whatever it is.

**expo-location's iOS path, verified in source [S]:** `node_modules/expo-location/ios/Providers/DeviceHeadingStreamer.swift` in this repo, lines 18-46: `streamDeviceHeading()` checks `CLLocationManager.headingAvailable()`, then calls `manager.startUpdatingHeading()` and yields each `CLHeading` unchanged. No smoothing, no filtering, no extra sensors. `LocationModule.swift` lines 110-120 map the payload: `"trueHeading": heading.trueHeading`, `"magHeading": heading.magneticHeading`, `"accuracy": normalizeAccuracy(heading.headingAccuracy)`.

**`normalizeAccuracy` collapses the degrees figure into bands [S]:** `expo-location/ios/LocationUtils.swift` lines 9-20: `accuracy > 50 || accuracy < 0` returns 0; `> 35` returns 1; `> 20` returns 2; else 3. The app's `POOR_CALIBRATION = 1` gate (`device/qibla.ts` line 16) therefore means "headingAccuracy worse than 35 degrees but better than 50", or invalid (negative). This is an expo invention, not Apple's, and it destroys the degrees information before JS sees it.

## Q2. The four `CMAttitudeReferenceFrame` values

Header source: `CMAttitude.h` in the iPhoneOS 27.0 SDK, read from disk [A]. All four are iOS 4.0+. The enum is `API_UNAVAILABLE(tvos)`.

| Frame | References | Sensors | Location needed | Accuracy / drift |
|---|---|---|---|---|
| `xArbitraryZVertical` (1 << 0) | Z vertical, X arbitrary in horizontal plane | Accelerometer + gyroscope ("Accelerometer and gyroscope fused", WWDC17 704) | No | Yaw is arbitrary at start and drifts with gyro bias; no world reference. Default frame. |
| `xArbitraryCorrectedZVertical` (1 << 1) | Same, "with the following exception: when available and calibrated, the magnetometer will be used to correct for accumulated yaw errors. The downside ... is increased CPU usage" (header) | Accel + gyro + magnetometer | No | Magnetometer bounds yaw drift; "Reliable attitude / Provides fixed center reference" (WWDC17). Still not north-referenced. |
| `xMagneticNorthZVertical` (1 << 2) | Z vertical, X toward magnetic north | Accel + gyro + magnetometer; "may require device movement to calibrate the magnetometer" (header) | No | North-referenced to magnetic north; accuracy tracks magnetometer calibration. |
| `xTrueNorthZVertical` (1 << 3) | Z vertical, X toward true north | Accel + gyro + magnetometer + location for declination | **Yes** | North-referenced to true north; same magnetometer caveats plus location availability. |

Current docs add per-frame discussion [A]:

- `xMagneticNorthZVertical`: "Use this option to determine the attitude of the device relative to magnetic north. For example, you might use this to implement a compass feature in your app. The yaw (Z-axis) value in CMAttitude is 0 when the X axis is aligned with magnetic north. The device must have a magnetometer and that sensor must be available. If the magnetometer isn't currently calibrated, Core Motion prompts the person to move the device to calibrate it."
- `xTrueNorthZVertical`: "Use this option to determine the attitude of the device relative to true north. For example, you might use this to implement more precise navigation. The yaw (Z-axis) value in CMAttitude is 0 when the X axis is aligned with true north. The device must have a magnetometer and that sensor must be available. Location services must also be available to calculate the difference between magnetic and true north. If the magnetometer isn't currently calibrated, Core Motion prompts the person to move the device to calibrate it."

Availability probe: `CMMotionManager.availableAttitudeReferenceFrames()` returns a bitmask (`CMMotionManager.h` lines 308-313) [A]. WWDC17 704 best practice: "Check for availability / Reference frame choice is key / Attitude definition / Sensors used" [A].

**The true-north frame costs:** location services running (for declination), magnetometer calibration, "increased CPU usage" relative to arbitrary frames (that wording is attached to the corrected frame, but the north frames add the magnetometer on top of gyro), and possible `CMErrorDeviceRequiresMovement` delivered once via the handler when the magnetometer needs movement (`CMMotionManager.h` lines 412-420; `CMError.h` line 17) [A].

## Q3. Does `xTrueNorthZVertical` require location permission?

**Apple's words:** "Location services must also be available to calculate the difference between magnetic and true north" [A, xTrueNorthZVertical discussion]. Note the phrasing: *services available*, not *your app authorized*. The distinction matters and Apple does not resolve it in docs.

What is verifiable:

- The app already holds foreground location authorisation whenever the compass is open (`device/qibla.ts` `hasLocationPermission` gate) [S], and `readPosition` has already run a `getCurrentPositionAsync` for the bearing. If Core Motion's true-north frame reads the system declination estimate the way Core Location does, the precondition is satisfied for free.
- The failure mode when location is unavailable is named in the headers: `CMErrorTrueNorthNotAvailable` (`CMError.h` line 18) [A]. That error exists, so the frame can fail at runtime; the app must handle it.
- `CLHeading.trueHeading` has the same dependency and documents the degraded behaviour: "A negative value indicates an invalid heading" (`CLHeading.h` lines 60-70) [A]. Core Motion's analogous signal is `heading < 0` for the arbitrary frames; for true-north frame failure the documented channel is the error, not a sentinel.

**COULD NOT VERIFY:** whether `.xTrueNorthZVertical` returns data when the app itself has denied location but system location services are on. Apple's docs say "available", not "authorised for your app". I could not test this empirically (signing, see end). Design consequence: keep the Core Location heading as a cross-check, or fall back to `.xMagneticNorthZVertical` plus a JS-side declination offset, which removes the dependency entirely.

## Q4. `CMDeviceMotion.heading`

Header (`CMDeviceMotion.h` lines 132-139, read from disk) [A]:

```
/*
 *  heading
 *
 *  Discussion:
 *    Returns heading angle in the range [0,360) degrees with respect to the CMAttitude reference frame. A negative value is returned
 *    for CMAttitudeReferenceFrameXArbitraryZVertical and CMAttitudeReferenceFrameXArbitraryCorrectedZVertical.
 */
@property(readonly, nonatomic) double heading COREMOTION_EXPORT API_AVAILABLE(ios(11.0)) API_UNAVAILABLE(visionos);
```

Doc page adds: "This property contains a value in the range of 0.0 to 360.0 degrees. This value is available only when the frame of reference is xMagneticNorthZVertical or xTrueNorthZVertical. If the reference frame is xArbitraryZVertical or xArbitraryCorrectedZVertical, this property contains a negative number to indicate the heading is invalid." [A]

Answers: it returns degrees in `[0, 360)`, in the frame requested at `startDeviceMotionUpdates(using:)`; it is meaningful only under the two north frames; with `.xTrueNorthZVertical` it is degrees from true north, so yes, directly substitutable with `trueHeading`. WWDC17 704 on this property: "Heading / Fuses accelerometer, gyroscope, and magnetometer / iOS only / Valid for XMagneticNorth, XTrueNorth / 0-359 degrees from X axis (North)" [A].

Axis convention: measured from the device's X axis when the top of the device points at north, matching `CLHeading`'s "referenced from the top of the device" convention (`CLHeading.h` lines 49-56) [A]. One nuance: `CLHeading` applies `headingOrientation`; `CMDeviceMotion.heading` does not have that property, so the app must keep the phone in the orientation the needle assumes (portrait, flat-ish) or fold orientation in itself.

## Q5. `NSMotionUsageDescription` and whether reading `CMDeviceMotion` prompts

**The prompt does not fire for `CMMotionManager` device motion.** Evidence:

1. The `NSMotionUsageDescription` doc page lists the APIs that require the key: "This key is required if your app uses APIs that access the device's motion data, including CMSensorRecorder, CMPedometer, CMMotionActivityManager, and CMMovementDisorderManager. If you don't include this key, your app will crash when it attempts to access motion data." [A] `CMMotionManager` is not in the list.
2. WWDC17 704 "Authorization" section separates the frameworks' interfaces into "Sensitive Interfaces: CMAltimeter, CMPedometer, CMMotionActivityManager, CMSensorRecorder" with "Sensitive API causes prompt / Appears only once", and the `authorizationStatus()` API is documented for exactly those four [A]. `CMMotionManager` appears in the session only under "Motion Interfaces", unsensitive.
3. Header survey [S]: grep of every `authorizationStatus` declaration across the SDK's CoreMotion headers returns `CMSensorRecorder`, `CMMotionActivityManager`, `CMMovementDisorderManager`, `CMAltimeter`, `CMHeadphoneActivityManager`, `CMWaterSubmersionManager`, `CMBatchedSensorManager`, `CMFallDetectionManager`, `CMPedometer`, `CMHeadphoneMotionManager`. `CMMotionManager.h` has no authorization surface at all. The framework's own header architecture treats raw `CMMotionManager` streams as unprompted.
4. Empirical (simulator, iOS 18.5): my probe binary ran `startDeviceMotionUpdates` with no `NSMotionUsageDescription` in its Info.plist. It printed availability false (simulator has no motion hardware) and exited cleanly; no crash, no TCC kill. Weak evidence on its own (no data path executed), but consistent with the key not being required for `CMMotionManager` startup. On iOS 18 this matches the docs.
5. expo-sensors' implementation treats DeviceMotion as permission-free at the native layer: `DeviceMotionModule.swift` `OnStartObserving` calls `startDeviceMotionUpdates()` directly, no permission check [S]. Its `EXMotionPermissionRequester` exists for the JS `requestPermissionsAsync()` surface and triggers the real prompt via a `CMPedometer` query [S].

**iOS 26 caveat [W, expo/expo#45386]:** on iOS 26 a dev-build reload with `motionPermission: false` got an app killed by TCC (`service=kTCCServiceMotion`, `AUTHREQ_PROMPTING`), fixed in expo-sensors by guarding `CMAltimeter.stop*` calls (PR #45396). This shows iOS 26 TCC polices motion more aggressively. The XS cannot run iOS 26 (Q7), so the app's floor is unaffected, but any future test device on iOS 26+ needs a real verification pass.

**Where the app's existing `NSMotionUsageDescription` comes from [S]:** the committed `ios/Athan/Info.plist` line 76-77 contains `NSMotionUsageDescription = "Allow $(PRODUCT_NAME) to detect your current motion activity"`. Source: `expo-location`'s config plugin adds it by default (`node_modules/expo-location/plugin/src/withLocation.ts` line 17, 237) for its motion *activity* APIs (`getMotionActivityAsync`/`watchMotionActivityAsync`, which use `CMMotionActivityManager`). `expo-sensors` is NOT installed in this repo (checked node_modules and package.json). So the key is already present, already shipped, and moving the compass to `CMMotionManager` adds no new permission surface on iOS.

**`motionPermission: false` in expo-sensors [S]:** `plugin/src/withSensors.ts` sets Podfile `MOTION_PERMISSION=false`, the podspec (`ExpoSensors.podspec` lines 24-27) turns that into `EXPO_DISABLE_MOTION_PERMISSION` Swift/ObjC flags, and `EXMotionPermissionRequester.m` then returns denied and `RCTFatal`s on missing key. Note this option is about the *pedometer* permission surface, not `CMMotionManager` streams.

## Q6. How Apple Maps draws its heading cone

Public, verifiable facts:

- MapKit hands the developer the same `CLHeading`: `MKUserLocation.heading` is typed `CLHeading?`, "The heading of the user's location", nil unless tracking mode is `followWithHeading` [A]. So Apple Maps' own needle source is Core Location's heading, the same one `watchHeadingAsync` returns. There is no public gyro-fused alternative that MapKit consumes.
- The cone (the blue beam ahead of the location dot) encodes uncertainty: it narrows as `headingAccuracy` improves and widens as it degrades. This convention is long-standing and observable; I found no Apple doc that states it in words. Grade [W], observed behaviour.
- The system calibration HUD is app-controllable: delegate method `locationManagerShouldDisplayHeadingCalibration(_:)` [A]. Verbatim from the doc fetched today: "Core Location may call this method in an effort to calibrate the onboard hardware used to determine heading values. Typically, Core Location calls this method at the following times: The first time heading updates are ever requested; When Core Location observes a significant change in magnitude or inclination of the observed magnetic field. If you return true from this method, Core Location displays the heading calibration alert on top of the current window immediately. The calibration alert prompts the user to move the device in a particular pattern so that Core Location can distinguish between the Earth's magnetic field and any local magnetic fields. The alert remains visible until calibration is complete or until you explicitly dismiss it by calling the dismissHeadingCalibrationDisplay() method. In the latter case, you can use this method to set up a timer and dismiss the interface after a specified amount of time has elapsed."
- Note in the same doc [A]: "The calibration process is able to filter out only those magnetic fields that move with the device. To calibrate a device that is near other sources of magnetic interference, the user must either move the device away from the source or move the source in conjunction with the device during the calibration process."
- Core Motion has its own equivalent display switch: `showsDeviceMovementDisplay` [A, CMMotionManager.h lines 412-420]: "When the device requires movement, showsDeviceMovementDisplay indicates if the system device movement display should be shown. Note that when device requires movement, CMErrorDeviceRequiresMovement is reported once via CMDeviceMotionHandler. By default, showsDeviceMovementDisplay is NO." Both calibration prompts (Core Location's and Core Motion's) are the figure-8 style HUD. An app can allow them; it cannot draw its own system HUD, and returning `false` from the delegate suppresses Core Location's.

**Should the app trigger it?** The delegate method is invoked by Core Location, not the app; the app only consents. Given the owner's permission-dialog aversion, note this HUD is not a permission dialog, it is a calibration instruction overlay, appears at most rarely (first-ever heading request per device, or after magnetic environment change), and improves the needle for every app on the device. Returning `true` and auto-dismissing after a few seconds via `dismissHeadingCalibrationDisplay()` is the documented pattern [A].

## Q7. iOS device floor: iPhone XS

Device facts read from the connected XS via `xcrun devicectl` [S]: iPhone11,2, iOS **18.7.10**. iOS 26 dropped the XS [W, widely reported; Apple's iOS 26 compatibility list excludes it].

| API | Introduced | On XS (iOS 18.7) |
|---|---|---|
| `CLHeading` / `startUpdatingHeading` | iOS 3.0 | Yes |
| `CLHeading.headingAccuracy` | iOS 3.0 | Yes |
| `locationManagerShouldDisplayHeadingCalibration` | iOS 3.0 | Yes |
| `CMAttitudeReferenceFrame` all four values | iOS 4.0 | Yes |
| `CMMotionManager.availableAttitudeReferenceFrames()` | iOS 5.0 | Yes |
| `CMDeviceMotion.magneticField` (calibration accuracy enum) | iOS 5.0 | Yes |
| `showsDeviceMovementDisplay` | iOS 5.0 | Yes |
| `CMDeviceMotion.heading` | iOS 11.0 | Yes |
| `CMDeviceMotion.sensorLocation` | iOS 14.0 | Yes |
| `CMDeviceMotion.headingAccuracy` (degrees) | **iOS 27.0** (`API_AVAILABLE(ios(27.0))`, CMDeviceMotion.h line 147) | **No** |
| `CMAuthorizationStatus` / motion prompt for CMPedometer etc. | iOS 11.0 | Yes (not needed for CMMotionManager) |

Deployment target in this repo: iOS 16.4 (`app.json` expo-build-properties) [S], so every recommended API except `CMDeviceMotion.headingAccuracy` (iOS 27) is available at the target and on the XS.

Flag: nothing else. One non-API floor note: the app is portrait-locked (`app.json` orientation portrait) [S], which sidesteps the `headingOrientation` compensation question for Core Location; Core Motion's `heading` has no such property, so if the app ever allows landscape the JS layer must compensate.

## Q8. The accuracy signal if heading moves to Core Motion

Current chain [S]: `CLHeading.headingAccuracy` (degrees, negative = invalid) is banded 0-3 by expo-location's `normalizeAccuracy`, and `device/qibla.ts` treats band `<= 1` as uncalibrated. The degrees figure never reaches JS.

Core Motion equivalents, by strength:

1. `CMDeviceMotion.magneticField.accuracy` [A/S]: `CMMagneticFieldCalibrationAccuracy`, values `Uncalibrated = -1`, `Low = 0`, `Medium = 1`, `High = 2` (CMDeviceMotion.h lines 33-45). iOS 5.0+. This is a calibration verdict on the magnetometer, the same underlying quantity `CLHeading.headingAccuracy` reflects, but as a 4-state band rather than degrees. The existing `POOR_CALIBRATION` gate maps almost 1:1: `calibrated: dm.magneticField.accuracy.rawValue > 1` reads "high only", stricter than today's `> 1` on expo's band (which maps to CL degrees worse-than-35). The honesty rule survives.
2. `CMDeviceMotion.headingAccuracy` [A]: "Represents the maximum deviation of where the estimated heading may differ from the actual heading in degrees. A negative value indicates an invalid heading." This is the true like-for-like, and it is `API_AVAILABLE(ios(27.0))` (CMDeviceMotion.h line 147) [S]. Useless on the XS floor and on the 16.4 deployment target. If the app ever raises its floor to 27 it can restore exact parity.
3. Hybrid honesty: keep the Core Location heading stream running at low rate purely for `headingAccuracy` degrees, drive the needle from Core Motion. Costs a second service; only worth it if the band signal proves insufficient.

**Conclusion:** the uncertainty signal is not lost. It degrades from degrees to a calibration band on the current floor, which is enough to keep the "needle is honest" rule because the app's UI hint is already binary (`calibrated` boolean drives it, `components/sheets/screens/Qibla.tsx`).

## COULD NOT VERIFY

1. **The exact sensor fusion inside locationd's heading service on modern iPhones.** Apple does not document it; no credible reverse-engineering surfaced. Tried: Apple docs JSON endpoints, archived LocationAwarenessPG via Wayback (CDX 502s, no snapshot), WWDC transcript search, forums search, header reads. The WWDC17 statement ("CoreLocation's heading can fuse course" vs Core Motion "fuses accelerometer, gyroscope, and magnetometer") is the closest Apple comes, and it implies Core Location's heading is NOT the gyro-fused one.
2. **On-device empirical A/B (CL heading vs CM heading on the XS).** I built a probe app (CoreMotion `.xTrueNorthZVertical` first, then CoreLocation heading at t=18s, logging to `NSLog` and on-screen) and a minimal `PBXFileSystemSynchronizedRootGroup` project. Build failed at signing: `No Account for Team "9ZU4ASVJSS"` and no wildcard profiles exist (all 12 local profiles are AdHoc/AppStore for `com.mugtaba.athan`, and installing under that id would clobber the owner's installed Athan 1.29.72, which I refused to do). The probe source remains at `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/R2-device-probe/` for a signed run.
3. **Whether `.xTrueNorthZVertical` produces data with app location denied but system location on.** Docs say "Location services must also be available"; the authorisation nuance is undocumented. Needs the same signed probe (phase B could run with location denied).
4. **Apple Maps' cone smoothing algorithm.** Observable convention only [W]; no Apple documentation of the filter.
5. **That no motion prompt fires for `CMMotionManager` on iOS 18 specifically.** Verified at doc/header/WWDC level and by the no-crash simulator run; the definitive on-device check needs the signed probe.

## Sources

| Grade | Source | What it established |
|---|---|---|
| [A] | `CLHeading.h`, `CLLocationManager.h`, `CLLocationManagerDelegate.h`, iPhoneOS 27.0 SDK on disk | `CLHeading` construction description, ranges, negative-invalid semantics, headingFilter default, calibration delegate |
| [A] | `CMAttitude.h`, `CMDeviceMotion.h`, `CMMotionManager.h`, `CMError.h`, `CMAuthorization.h` on disk | Four reference frames and their sensor/cost wording, `heading` iOS 11 and its negative-invalid rule, `headingAccuracy` iOS 27, `magneticField.accuracy` enum, no authorization surface on `CMMotionManager`, `CMErrorTrueNorthNotAvailable` |
| [A] | developer.apple.com "Getting heading and course information" (fetched 2026-09-29) | "The magnetometer determines a device's orientation relative to magnetic north"; trueHeading needs location updates |
| [A] | developer.apple.com CMDeviceMotion.heading, xTrueNorthZVertical, xMagneticNorthZVertical, NSMotionUsageDescription pages | Heading range/validity, "Location services must also be available", the four motion APIs that require the key |
| [A] | developer.apple.com locationManagerShouldDisplayHeadingCalibration, MKUserLocation.heading | Calibration HUD trigger times and dismissal; Apple Maps heading source is `CLHeading` |
| [A] | WWDC17 session 704 transcript PDF (devstreaming-cdn.apple.com) | DeviceMotion "Fuses accelerometer, gyroscope, and magnetometer"; CoreLocation heading "can fuse course"; sensitive-interface list without `CMMotionManager` |
| [A] | support.apple.com iPhone 3GS / iPhone 4 tech specs | 3GS has digital compass, no gyro; gyro first on iPhone 4 |
| [S] | `node_modules/expo-location/ios/Providers/DeviceHeadingStreamer.swift`, `LocationModule.swift`, `LocationUtils.swift`, `plugin/src/withLocation.ts` | iOS watchHeadingAsync is a bare passthrough; accuracy banding 0-3 with thresholds 50/35/20; NSMotionUsageDescription default source |
| [S] | expo-sensors 57.0.3 via opensrc: `DeviceMotionModule.swift`, `EXMotionPermissionRequester.m`, `SensorsUtils.swift`, `ExpoSensors.podspec`, `plugin/src/withSensors.ts`, `src/DeviceSensor.ts` | DeviceMotion starts without permission check; prompt is triggered via CMPedometer; frame picker never chooses xTrueNorth; `motionPermission: false` mechanics |
| [S] | Repo: `device/qibla.ts`, `shared/qibla.ts`, `ios/Athan/Info.plist`, `app.json` | Current gate `accuracy > 1`, POOR_CALIBRATION, existing NSMotionUsageDescription, deployment target 16.4, portrait lock |
| [S] | `xcrun devicectl device info details` on the connected XS | iPhone11,2 on iOS 18.7.10 |
| [S] | Simulator probe run (iOS 18.5, `xcrun simctl launch --console-pty`) | `CMMotionManager` startup with no NSMotionUsageDescription does not crash |
| [W] | expo/expo#45386 and PR #45396 | iOS 26 TCC kill on motion with `motionPermission: false`; fixed by guarding CMAltimeter stop |
| [W] | Cone-width-as-uncertainty convention; iOS 26 dropping the XS | Observable/secondary, no Apple doc |
| [U] | "CLHeading fuses the gyro" blog/SO assertions | Rejected as proof; no primary source |
