# Agent report 3: sensor and platform engineering

Returned 2026-09-28, attempt 3. The most technically dense of the five. Planner's ruling, **including the
one place it contradicts this session's own source reading**, is in `RESEARCH.md` section 13.

---

## 1. Android heading: the four options

| Sensor | Hardware | Status | Best for |
| --- | --- | --- | --- |
| `TYPE_ROTATION_VECTOR` | accel + gyro + mag, fused | **Google's recommendation** | foreground compass |
| `TYPE_GEOMAGNETIC_ROTATION_VECTOR` | mag + accel, no gyro | current | low-power/background |
| `TYPE_ORIENTATION` | virtual | **deprecated** (API 8) | nothing |
| raw mag + accel + `getRotationMatrix` | raw | current | DIY fusion |

`TYPE_ORIENTATION` is "reliable only when the roll angle is 0". AOSP: "Use the rotation vector sensor over
the orientation sensor whenever possible."

`TYPE_ROTATION_VECTOR` reports an **estimated heading accuracy in `values[4]` (radians)**, where "the
heading error must be less than `estimated_accuracy` 95% of the time."

## 2. The 2024 API: Fused Orientation Provider

Announced 7 March 2024. Part of **Google Play services** (`play-services-location:21.2.0+`), **not the
platform**, so no `minSdk` concern: "available on all devices running Google Play services on Android 5
and above." **An Android 9 Snapdragon 820 is fine if it is a GMS device.** Requires accelerometer,
gyroscope and magnetometer.

What it fixes:
- Unified across manufacturers; updates ship via Play services, decoupled from OS updates
- **Directly incorporates local magnetic declination**, referencing orientation to geographic north
- Compensates gyro bias and **hard-iron offset**
- `getHeadingErrorDegrees()` and `getConservativeHeadingErrorDegrees()`, **returning 180° when invalid**
- "This is the same heading that is shown in Google Maps, which uses the FOP as well"

`OUTPUT_PERIOD_DEFAULT` is 50 Hz, described as suited to "a compass or navigation app". Foreground only.

## 3. remapCoordinateSystem

**Required whenever the display rotation differs from the device's natural orientation.** Sensor
coordinates are fixed to the device: "The axes are not swapped when the device's screen orientation
changes."

**Symptom without it: compass correct in portrait, wrong by a constant 90, 180 or 270 in landscape.**

## 4. Tilt and the vertical singularity

The azimuth from `getOrientation()` **is tilt-compensated**, which is what distinguishes it from a naive
`atan2(my, mx)` on the raw magnetometer, correct only when flat.

**Vertical is the singularity.** At pitch ±90° azimuth and roll become degenerate (gimbal lock) and the
azimuth oscillates wildly. The docs also warn the matrices "are meaningful only when the device is not
free-falling and it is not close to the magnetic north."

## 5. Android accuracy constants

`SENSOR_STATUS_ACCURACY_HIGH = 3`, `MEDIUM = 2`, `LOW = 1` ("calibration with the environment is needed"),
`UNRELIABLE = 0`. **These are coarse vendor-defined bands, not degrees.** The rotation vector's `values[4]`
and FOP's error cone are the quantitative alternatives.

## 6. Sampling and battery

`SENSOR_DELAY_NORMAL` ~5 Hz, `UI` ~16.7 Hz, `GAME` 50 Hz, `FASTEST` 0. "The delay you specify is only a
suggested delay."

**Android 12+ caps `registerListener` at 200 Hz** without `HIGH_SAMPLING_RATE_SENSORS`, else
`SecurityException`. "Failing to [disable sensors] can drain the battery in just a few hours. Note that the
system will **not** disable sensors automatically when the screen turns off."

**For a compass, ~50 Hz is the documented fit**: 5 Hz looks laggy, 200 Hz wastes battery.

## 7. iOS heading

- `headingFilter` default is **1 degree**; `kCLHeadingFilterNone` notifies on every change.
- **`headingOrientation`**: "the location manager assumes that the top of the device in portrait mode
  represents due north (0 degrees) by default." **If unset in a rotating UI, heading is referenced to the
  portrait top edge, the same ±90° error class as Android's remap issue.**
- **`headingAccuracy`**: "The maximum deviation (measured in degrees) between the reported heading and the
  true geomagnetic heading... **A negative value means that the reported heading is invalid**, which can
  occur when the device is uncalibrated or there is strong interference."
- **`trueHeading` needs location**: "This property contains a valid value **only if location updates are
  also enabled**... Core Location needs the current location of the device to compute the value."
- **The calibration HUD**: `locationManagerShouldDisplayHeadingCalibration` is called on the first heading
  request and "when Core Location observes a significant change in magnitude or inclination". Returning
  true shows an alert that "remains visible until calibration is complete or until you explicitly dismiss
  it."
- **Apple publishes no numeric accuracy claim.**

## 8. Measured accuracy

- **~1.4° achievable** with custom calibration outdoors (Li & Liu 2024, 1.37° RMSE, better than the phone's
  own factory calibration)
- **Indoors: RMSE ~17.4°** even with a purpose-built EKF anomaly-rejection algorithm (Ettlinger & Weiss,
  *NAVIGATION*, ION, 2024), outperforming prior art by 40%. **Naive indoor readings are far worse.**
- Practitioner consensus: outdoors expect **±5° before filtering** on a good day.

## 9. Detecting an untrustworthy reading: four independent signals

1. **Platform flags:** iOS `headingAccuracy < 0`; Android `SENSOR_STATUS_ACCURACY_LOW/UNRELIABLE`
2. **Quantitative error estimates:** rotation vector `values[4]`; FOP's error cone
3. **Total field strength vs WMM expectation.** Android gives it directly:
   `new GeomagneticField(lat, lon, alt, time).getFieldStrength()`. Earth's field is ~25 to 65 µT; a ratio
   outside roughly ±30 to 50% means local distortion. **"This is cheap, works in a static position, and is
   the single best 'am I near metal' check."**
4. **Variance and gyro cross-check:** if azimuth diverges from gyro-integrated yaw while the gyro says the
   phone is still, the field moved and the magnetometer is lying

## 10. The World Magnetic Model

**WMM2025**, released **17 December 2024**, valid 2025.0 to 2030.0, expiring 31 December 2029.

**The Android wrinkle, quoted from the reference page:** "This class currently uses **WMM-2020** which is
valid until 2025, but should produce acceptable results for several years after that." **So Android ships
a model one generation behind**, refreshed only with OS updates. Expiry is graceful because secular
variation is slow.

**iOS does not document which version it embeds.**

**The FOP wrinkle:** FOP **already applies declination** when location is available, so applying
`GeomagneticField.getDeclination()` on top of FOP heading **double-counts it.**

**Blackout Zones** near the magnetic poles (horizontal intensity below 2000 nT): "compasses are not
accurate and should not be relied on for navigation."

### Declination measured live from NOAA, 2026-09-28

| City | Declination |
| --- | --- |
| **London** | **+1.2°** |
| Mumbai | −0.01° |
| **Mecca** | **+3.5°** |
| Oslo | +5.1° |
| Tokyo | −7.9° |
| Canberra | +12.6° |
| **Boston** | **−13.9°** |
| **Seattle** | **+14.9°** |

**"A Qibla app that skips declination is wrong by 8° in Tokyo, 14° in Boston, 15° in Seattle."**

## 11. Smoothing and 60fps rendering

**Filtering.** Exponential low-pass on the shortest-path delta is the workhorse; shipped values cluster at
**α ≈ 0.15**, and at 50 Hz **α ≈ 0.1 to 0.3 gives a 100 to 300 ms settle**. The One-Euro filter (adaptive
cutoff: sluggish when slow, snappy when fast) is the recommended middle ground.

**"The classic bug both those threads exist to fix: low-passing the raw 0-360 angle makes 359° to 1°
traverse the whole dial backwards. Filter the wrapped delta, never the raw angle."**

**You do not need Kalman**: platform fusion already outputs a fused heading; the app's job is presentation
smoothing only.

### The wrap-safe standard

```js
function angleDeltaJs(a, b) {
  return ((((b - a) % 360) + 540) % 360) - 180;
}
filtered = (filtered + alpha * angleDelta(filtered, target) + 360) % 360;
```

**When driving an animation, keep the display angle unbounded and continuous**: animate
`display += delta(filtered, target)` so 350° to 10° rotates +20°, never −340°.

### Rendering: the decisive evidence

**Animate `transform: rotate` on a plain View. Do not re-render SVG paths every frame.**

- **Reanimated's own performance guide:** animate non-layout styles (`transform`, `opacity`); enable
  `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` (4.0+) and `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` (4.2+), which give
  "a fast code path for applying updates of non-layout styles... rather than cloning ShadowNode instances
  and calling ShadowTree::commit." **Also: dev-mode numbers are meaningless; measure release builds.**
- **react-native-svg's own maintainers (Software Mansion, April 2025):** every prop change dispatches a
  native drawing operation and **"everything gets redrawn, and there's no caching involved"**; each SVG
  element is both a React component and a native view-hierarchy entry "that is never actually drawn"; plus
  known **memory leaks on iOS**.
- **Measured:** react-native-svg#1535, an Android SVG roulette wheel, ran at **30 to 40 fps UI / 10 to 20
  fps JS** despite native driver and transform tuning.
- **The fair counterpoint:** simple icons and small charts are fine. "The problem class is per-frame
  attribute mutation of a large SVG, which is exactly a compass dial."
- **If the dial must be vector:** rasterize the static dial once and rotate the image, or use
  react-native-skia, which redraws on the render thread from a shared value without React re-renders.

**Sensor plumbing note from the agent:** `expo-sensors` gives raw µT triples with no tilt compensation, no
declination and no fusion, and **"there is no rotation-vector/FOP/CLHeading equivalent in Expo's sensor
suite"**, so it recommends a small native module.

## 12. Pitfalls and their symptoms

| Pitfall | Symptom |
| --- | --- |
| No `remapCoordinateSystem` / unset iOS `headingOrientation` | correct in portrait, constant 90/180/270 off in landscape |
| `TYPE_ORIENTATION` | roll-dependent errors |
| Low-passing the raw 0-360 angle | needle spins the long way at north |
| Renormalising the display angle each frame | full 360° spins at the wrap |
| FOP heading **plus** manual declination | constant offset equal to local declination |
| Declination sign wrong | constant offset of **2x** declination |
| `trueHeading` without location updates | returns −1 |
| Trusting azimuth when vertical | wild oscillation (gimbal lock) |
| Skipping declination | 8 to 15° systematic error in Tokyo/Boston/Seattle |
| Sampling above 200 Hz on Android 12+ | `SecurityException` |
| MagSafe attached after calibration | silent hard-iron bias, tens of degrees |
| No field-strength check indoors | confidently wrong arrow (indoor RMSE over 17°) |
| Animating SVG attributes per frame | frame drops on mid/low Android |
| Rotating via React state | JS-thread-bound fps |
| Debug-build performance conclusions | numbers that do not match release |

## Key sources

- Android sensors: `developer.android.com/develop/sensors-and-location/sensors/sensors_position`, `_motion`, `_overview`
- AOSP sensor types: `source.android.com/docs/core/interaction/sensors/sensor-types`
- FOP announcement: `android-developers.googleblog.com/2024/03/introducing-fused-orientation-provider-api.html`
- `GeomagneticField`: `developer.android.com/reference/android/hardware/GeomagneticField`
- Apple `headingAccuracy`: `developer.apple.com/documentation/corelocation/clheading/headingaccuracy`
- Apple calibration delegate: `developer.apple.com/documentation/corelocation/cllocationmanagerdelegate/locationmanagershoulddisplayheadingcalibration(_:)`
- NOAA WMM2025: `ncei.noaa.gov/products/world-magnetic-model`
- Reanimated performance: `docs.swmansion.com/react-native-reanimated/docs/guides/performance/`
- Software Mansion, "You might not need react-native-svg": `swmansion.com/blog/you-might-not-need-react-native-svg-b5c65646d01f/`
- Ettlinger & Weiss 2024, *NAVIGATION* (17.4° indoor RMSE): `navi.ion.org/content/71/1/navi.632`
- Rosetta Code, angle difference between bearings: `rosettacode.org/wiki/Angle_difference_between_two_bearings`
