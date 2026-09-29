# E4: competitor teardown, shipped code and shipped products

Research agent E4, round 2, session 40. Date 2026-09-29. Scope: how everyone else solves the old-phone compass problem, answered by reading source that ships and pages that products publish. R6 (field evidence, UX) and D4 (detection, honesty) are read and not repeated. Grades: [S] read from real source code, [P] official documentation or published standard, [J] journalism or teardown, [W] blog, forum, store listing or review, [U] unverified.

## The answer to question 7, first

No. A reliable compass on these old phones is not achievable by app code, and the best compass app in the world does not pretend otherwise. Trail Sense, the strongest open-source compass I can read, ships a field-strength validator, a dual-sensor divergence detector, a quality banner and a figure-of-eight coach, and none of that makes a wrong magnetometer right. Its "recalibration" is a stop and restart of the OS sensor, which asks Android to redo its own calibration. Nobody I read implements an app-side hard-iron fit, even though `TYPE_MAGNETIC_FIELD_UNCALIBRATED` exposes the raw field plus the OS bias estimate, which is exactly the data an ellipsoid fit needs. The winning pattern across every serious product is the one D4 and R6 already propose: detect, say so, coach the motion, and offer a path that needs no magnetometer at all. The qibla market has already voted on what that path is. Al-Azan ships a map beside the compass. SimplyQibla dropped the compass entirely and is map-only, with "a map remains factual" as its store pitch. SolarCompass and Sun Qibla point at Makkah from the sun with no magnetometer at all. The owner is not chasing something the best apps have. He is chasing something they publish disclaimers about.

---

## 1. The teardowns, code first

Everything in this section is [S] unless marked. I fetched each repository with `opensrc` and read the sensor paths end to end.

### 1.1 Trail Sense, the reference implementation

The compass stack, from `CompassProvider.get()` and `getOrientationSensor()`:

```kotlin
// CompassProvider.kt, shipped wiring
val quickRecalibration =
    if (isCustomSensor) {
        baseOrientationSensor
    } else {
        QuickRecalibrationOrientationSensor(
            getCustomGeomagneticRotationSensor(false, sensorDelay),
            baseOrientationSensor,
            1f,     // resetAngleThreshold, degrees
            45f     // motionAngleThreshold, degrees per second
        )
    }
```

Three layers wrap every non-custom source. The innermost is the OS sensor, `RotationSensor` (which is `TYPE_ROTATION_VECTOR`) by default, with `GeomagneticRotationSensor`, a custom mag-plus-gyro fusion, a custom mag-plus-accel path and the deprecated orientation sensor as user-selectable fallbacks, offered in a quality-ranked order:

```kotlin
fun getAvailableSources(context: Context): List<CompassSource> {
    val sources = mutableListOf<CompassSource>()
    if (Sensors.hasSensor(context, Sensor.TYPE_GYROSCOPE) &&
        Sensors.hasSensor(context, Sensor.TYPE_MAGNETIC_FIELD)
    ) { sources.add(CompassSource.CustomRotationVector) }
    if (Sensors.hasSensor(context, Sensor.TYPE_ROTATION_VECTOR)) {
        sources.add(CompassSource.RotationVector) }
    ...
```

Note the ranking: their own mag-plus-gyro fusion outranks the OS rotation vector when both sensors exist. The app trusts its own filter more than the vendor's.

The second layer is `QuickRecalibrationOrientationSensor`, already quoted in full by D4 section 1.3. What matters for this report is what "recalibrate" actually is:

```kotlin
private fun recalibrate() {
    synchronized(startLock) {
        if (isStarted) {
            primary.stop(this::onPrimaryUpdate)
            primary.start(this::onPrimaryUpdate)
        }
    }
}
```

A stop and a start. It bounces the sensor so the OS fusion re-converges from scratch. It does not compute a bias, does not fit anything, does not touch the magnetometer's calibration constants. When the noisy self-computed reference and the smooth primary disagree by more than 1 degree for 1 second while the phone is still, Trail Sense kicks the vendor's sensor and lets it settle again.

The third layer is the field-strength validator, `MagnetometerExtensions.kt` in full:

```kotlin
fun IMagnetometer.getQualityFromFieldStrength(): Quality {
    // https://geomag.bgs.ac.uk/education/earthmag.html
    val normalStrengthRange = Range(22f, 67f)
    val warningStrengthRange =
        Range(normalStrengthRange.start * 0.9f, normalStrengthRange.end * 1.1f)
    val strength = Vector3Utils.magnitude(rawMagneticField)
    return when {
        normalStrengthRange.contains(strength) -> Quality.Good
        warningStrengthRange.contains(strength) -> Quality.Moderate
        Arithmetic.isZero(strength) -> Quality.Unknown
        else -> Quality.Poor
    }
}
```

This is D4's rank-1 detector, shipping today, with a fixed global band rather than a position-resolved model. The 3T's 104.5 microtesla reading lands far outside even the 10 percent warning band, so Trail Sense would grade that phone Poor. Then the wrapper degrades the whole compass to the worst input:

```kotlin
// MagQualityCompassWrapper.kt
override val quality: Quality
    get() = Quality.entries[minOf(
        magnetometer.quality.ordinal,
        compass.quality.ordinal,
        magnetometer.getQualityFromFieldStrength().ordinal
    )]
```

The 3T's stored 84.5 microtesla hard-iron bias would also trip this from the other direction once the OS removes a wrong bias and the residual swings the magnitude across orientations, which is D4's detector 3.

What the user sees. A permanently visible badge (`SensorStatusBadgeView`, updated every second) names the quality in one word. When quality is Poor, a banner appears, from `NavigatorUserErrors.kt`:

```kotlin
MagnetometerDiagnosticScanner.MAGNETOMETER_POOR to UserError(
    ErrorBannerReason.CompassPoor,
    fragment.getString(
        R.string.compass_calibrate_toast,
        formatter.formatQuality(Quality.Poor).lowercase(Locale.getDefault())
    ),
    R.drawable.ic_compass_icon,
    fragment.getString(R.string.how)
) {
    fragment.displayAccuracyTips()
    ...
```

The strings, verbatim:

```xml
<string name="compass_calibrate_toast">Compass accuracy %s, calibration is advised</string>
<string name="calibrate_compass_dialog_content">Rotate your phone in a figure 8 pattern or in all directions several times, click %s when finished.</string>
<string name="compass_accuracy_improved">Compass accuracy improved to %s</string>
```

The "How" action opens `ImproveAccuracyAlerter`, a dialog that pairs GPS tips with the compass instruction and embeds `CompassCalibrationView`, an animated canvas that draws a phone tracing a Lissajous figure-of-eight on a loop, so the user watches the motion they are meant to copy. There is no completion detection in that dialog. It is a demonstration, not a flow with a success state. The success signal is indirect: `CalibrateCompassFragment.update()` fires a toast, "Compass accuracy improved to Good", when the quality enum gets better.

One more Trail Sense feature belongs in section 4: the augmented reality settings screen ships a toggle, "Use gyroscope after calibration", described as "Instead of the compass (avoids magnetic drift)" (`augmented_reality_preferences.xml`). After the user aligns once against the magnetic compass, the AR view can stop reading the magnetometer entirely and track rotation with the gyro alone. That is a shipped, user-facing example of using the magnetometer only as an initial reference on hardware you do not trust long-term.

What Trail Sense does not do: it never hides the needle, never shows a numeric error, never offers a heading offset, and never claims to fix the sensor. Detection plus coaching plus a restart is the whole strategy.

### 1.2 GPSTest

`SharedSensorManager.kt` reads `TYPE_ROTATION_VECTOR`, falls back to deprecated `TYPE_ORIENTATION`, applies declination from `GeomagneticField` behind a "Point Compass to True North" preference, and remaps coordinates per display rotation. Two details worth keeping:

```kotlin
private fun maybeTruncateVector(event: SensorEvent) {
    if (!truncateVector) {
        try {
            SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
        } catch (e: IllegalArgumentException) {
            // On some Samsung devices, an exception is thrown if this vector > 4 (see #39)
```

A shipped workaround for OEM sensors that emit a longer rotation vector than the API tolerates. Old-phone space is full of this. And the accuracy callback:

```kotlin
override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
    // No op
}
```

GPSTest displays the raw sensor band nowhere in the map view. A diagnostics-first app ignores the accuracy signal entirely. That is how little the vendor band is worth on its own.

### 1.3 flutter_compass, the package most qibla apps sit on

The Android side reads `TYPE_ROTATION_VECTOR` with a raw accel-plus-mag fallback, low-passes the fallback pair at `ALPHA = 0.45f`, throttles to 32 ms, remaps axes per display rotation including the pitch-over-45-degrees cases, and maps the vendor band to rough degrees:

```java
private double getAccuracy() {
    if (lastAccuracySensorStatus == SensorManager.SENSOR_STATUS_ACCURACY_HIGH) {
        return 15;
    } else if (lastAccuracySensorStatus == SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM) {
        return 30;
    } else if (lastAccuracySensorStatus == SensorManager.SENSOR_STATUS_ACCURACY_LOW) {
        return 45;
    } else {
        return -1; // unknown
    }
}
```

It also logs, but does not act on, the unreliable case: "Compass sensor is unreliable, device calibration is needed" followed by "Update the heading, even if the sensor is unreliable", a deliberate choice to keep streaming. The iOS side is `CLLocationManager` heading with `headingAccuracy > 0` as a hard gate (events are dropped while accuracy is invalid) and a `CMMotionManager` quaternion for a camera-mode heading. No field validation on either platform. No calibration UI.

### 1.4 flutter_qiblah, a qibla package with no compass engineering

The whole plugin is a sensor-support check plus stream plumbing. The native side, in full effect:

```kotlin
"androidSupportSensor" -> {
    val sensorManager = context?.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val sensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR) ?: null
    result.success(sensor != null)
}
```

The heading comes from `flutter_compass_v2`, the position from `geolocator`, and the qibla needle is `(event.heading ?? 0.0) + (360 - offSet)`. No accuracy consumed, no field check, no calibration, no degradation. Whatever the compass says, the Kaaba marker rotates. A large family of store qibla apps inherits exactly this shape, which is consistent with the academic findings in section 6 that a chunk of the market is wrong by a few degrees and one app family is wrong by three.

### 1.5 Al-Azan, the closest peer to this app

A React Native prayer-times app on F-Droid, archived in favour of a Compose rewrite, with a native compass module and three qibla screens: a disclaimer chooser, a compass, and a map.

The native sensor (`CompassSensor.java`) reads `TYPE_ROTATION_VECTOR` only, low-passes at `ALPHA = 0.96f`, remaps per display rotation, adds declination from a bundled 1256-line WMM port (`TSAGeoMag.java`, public-domain NOAA-derived code, no network), and emits distinct events:

```java
if (rotationSensor == null) {
    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit("accuracyChanged", -3);   // SENSOR_NOT_FOUND
    return;
}
...
@Override
public void onAccuracyChanged(Sensor sensor, int accuracy) {
    if (sensor.getType() == Sensor.TYPE_ROTATION_VECTOR) {
        context.getJSModule(...).emit("accuracyChanged", accuracy);
    }
}
```

The compass screen renders that band in colour-graded words (Unreliable red, Low orange, Medium yellow, High green) and never blocks on it. The disclaimer screen the user must acknowledge first is the most honest sentence I found in any qibla app's code:

```tsx
{t`Note that due to software and hardware errors, Qibla direction shown by this app, particularly in compass mode, can be wrong.`}{' '}
{t`Other magnetic devices may interfere with your phone's compass and your compass may need calibration.`}
```

"Particularly in compass mode" is doing real work: the map mode is the trusted path. The map screen draws a geodesic qibla line plus a user-direction line over MapLibre with OpenStreetMap raster tiles, `setAccessToken(null)`, no key. It computes the qibla line as a GeoJSON LineString to a second point 10 km along the bearing, detects facing within 1 degree, turns the line green, shows a check or cross icon with an `aria-live` label ("You are facing Kaaba"), and displays "Turn Left" or "Turn Right" text hints driven by the compass when the optional compass lock is on. That lock is off by default. The map is north-up unless the user opts into compass rotation, so the map remains usable when the compass is wrong.

Two constraints matter for us. The map needs the network (the app alerts "Internet connection is necessary for qibla map to work"), and the F-Droid build strips MapLibre entirely, showing "Qibla map is currently unavailable in F-Droid builds". So even this privacy-first app could not ship a keyless offline map.

### 1.6 SimplyQibla, the compass-free product

A Flutter app whose entire premise is that the compass is the problem. The README, verbatim: "Accurate: The device compass easily fluctuates and shows the wrong qibla direction, but a map remains factual." The Play listing repeats it: "SimplyQibla uses a map instead of a compass, since the device compass easily fluctuates. Simply look at your surroundings and the Qibla direction shown in the map to orient your phone and find the right direction." [W, store listing, fetched today]

The code matches the pitch. The compass (`flutter_compass`) exists only as an optional map-rotation mode behind a setting, with a needle animation that plays only when hardware is available, and a hardware-failure path that swaps the compass icon for a plain location icon. The default experience is a north-up Google map, a geodesic amber polyline from your position to the Kaaba, and manual coordinate entry so no location permission is needed at all. The trade: it is built on `google_maps_flutter`, so it needs an API key at build time and network at run time, which our constraints disqualify.

A store review on the listing, from a real user: "Very simple app. I always prefer using maps rather than a compass to find the qibla, and this does the job perfectly." Another reviewer complained the compass-rotation mode pointed the wrong way on his phone, which is the exact failure the map-first design exists to route around. [W]

### 1.7 hj-qibla-compass, the naive library

A Compose library, on Maven Central, that many store apps can drop in. `CompassSensors.kt` reads `TYPE_ROTATION_VECTOR` with the raw accel-plus-mag fallback, low-passes the fallback at 0.97, and that is all:

```kotlin
override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) = Unit
```

Accuracy discarded. No field check, no validation, no quality surface. The UI layer animates the dial with `animateFloatAsState` and handles wraparound. This is the floor of the market, and it is representative of the median qibla app: sensor in, needle out.

### 1.8 SolarCompass, the sensor-free shipped product

An F-Droid Android app that finds all four cardinal directions with no magnetometer, no gyro, nothing but location and clock. `CompassLogic.java` computes the solar azimuth from the day-of-year declination and the hour angle:

```java
private static double getDeclinationAngle(){
    int dayNum= Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
    return 23.45*Math.sin(Math.toRadians(360.0/365.0*(284.0+dayNum)));
}
...
private static double getAzimuthAngle(){ ... }
```

The interaction is the interesting part, from the README: "Start the app and place your device horizontally. Now touch the sun icon on the screen and rotate it towards the position of the sun in the sky. The compass will automatically rotate to point the directions once you release the sun icon." The user is the sensor. The app supplies the astronomy and the dial. Tips text even teaches the shadow trick: "place your finger vertically on a horizontal surface. The direction of the shadow will be the exact opposite direction of the sun."

The formula is the coarse 23.45-degree sine model, good to roughly a degree of declination, which is far inside the qibla tolerance. Trail Sense's own `sol` library ships the same capability at higher precision, `Astronomy.getSunPosition(time, location)` returning a `CelestialObservation` with altitude and azimuth, MIT licensed, drop-in Kotlin [S]. The maths for a computed sun line is a solved, reusable, offline problem.

### 1.9 Kr0oked Compass (F-Droid, com.bobek.compass)

Rotation vector only, azimuth from the same canonical pipeline, and a visible "Sensor status" preference plus a dialog with the string "Rotate your device in a figure-eight motion to improve sensor accuracy." Accuracy levels are rendered as tinted labels (Unreliable red and so on) via `SensorAccuracy.tintColor`. No field validation, no calibration flow, no fallback sensors. A clean minimal example of the honest-minimum pattern: show the vendor band in words, coach the motion.

### 1.10 react-native-compass (russellio), our ecosystem's median

An Expo-ecosystem compass built on `expo-sensors`' bare magnetometer, `calculateHeading` via `atan2`, EMA smoothing with wraparound handling (correctly done, `applyEMA` shifts across the 0 or 360 boundary). The accuracy path is the tell:

```typescript
// Note: expo-sensors doesn't provide accuracy data directly
// On Android, accuracy would come from magnetometer uncalibrated sensor
// For now, we'll use a fixed value. This could be enhanced later.
const currentAccuracy = 0;
onAccuracyChangeRef.current?.(currentAccuracy);
```

A shipped compass with no tilt compensation, no accuracy, and a README that outsources the problem to the user: "Move it in a figure-8 pattern... Follow any on-screen prompts." This is the level of engineering under a large share of store compasses, and it is the same architecture our app has today. Nothing in the React Native ecosystem ships anything near Trail Sense.

### 1.11 NorthPin, documented but closed

A Flutter compass whose public repo is README-only, so the implementation is COULD NOT VERIFY, but whose published material is precise about method: interference detection by monitoring total field magnitude against a 25 to 65 microtesla envelope, a microtesla meter shown to the user, guided figure-eight calibration triggered by "field magnitude drift", and a dynamic-alpha low-pass that smooths hard at rest and opens up while turning [W, README and dev.to post by the developer, both fetched]. Its FAQ also states the accuracy expectation: "In a clear outdoor setting away from metal and electronics, most modern phones achieve 1-3 degrees." Every element matches what Trail Sense ships in code, which raises confidence that this is the converged industry answer: envelope check, meter, coach, and never claim to fix the sensor.

---

## 2. What the commercial qibla apps do about bad compasses

- **Muslim Pro** (the largest, 190 million downloads claimed) publishes a help page [P, support.muslimpro.com, fetched today] that admits every failure mode we have measured: keep the device flat, stay away from "metallic and magnetic interferences (such as electronic devices, vehicles, metallic cases or magnetic closures)", and "try to 're-calibrate' the device by moving it 5 or 6 times in large 8-figures loops in front of you". For phones with no compass it names the Samsung Galaxy J5 by model and says the compass "can't work properly", then offers the fallback: "You may need to use the North indicator or the 'sun' icon in order to align the device manually." So the biggest player ships a manual sun-alignment affordance for hopeless compasses. Its calibration loop is documented as sometimes inescapable: "If you are getting an infinite loop (8-figure) image with instructions to re-calibrate your device" then repeat the motion "5 or 6 times... for the interferences / re-calibrations screen to disappear".
- **Google Qibla Finder** sidesteps the magnetometer entirely with a camera AR line, "paint a clear blue line within the imagery your phone camera sees" [P, blog.google, 2017]. Its help page still says it "works with your device's compass" and recommends calibrating first, so AR is not sold as sensor-free, though Live View ultimately grounds on visual positioning rather than the magnetometer alone [P for the help text, U for the internals].
- **Qiblafinder.org** (a long-standing web tool) offers the map as the explicit no-compass path: "If your phone does not have a compass sensor, use the 'FIND QIBLA WITH MAP' tab instead... use the Qibla line together with nearby buildings, roads and other landmarks" [W, site FAQ fetched]. It also documents the sun method and the "Qibla time" concept, facing the sun at the computed instant.
- **Store review reality**: complaints about qibla apps pointing wrong are constant across Reddit and store reviews, users report apps disagreeing with each other and even with themselves hour to hour, and the advice communities give each other is Maps, satellite dishes, the sun, and physical compasses [W, threads already cited by R6]. A tester in the haram in Makkah found the apps pointing different directions inside the mosque that contains the Kaaba [W, r/islam]. No reviewer anywhere expects an old phone's compass to be fixable. They expect the app to stop lying.

The commercial pattern is uniform: acknowledge interference, teach the figure of eight, and provide a second method (map, AR, sun, or the bearing number) for when the compass cannot be trusted. None of the closed apps publishes a numeric accuracy target.

---

## 3. The map fallback, assessed

**How well it works.** The map is the only fallback with direct user-validation evidence. SimplyQibla exists because of it and quotes it as the product's whole reason ("a map remains factual"). Al-Azan's own code ranks it above the compass in its disclaimer ("particularly in compass mode, can be wrong"). R6 section 6.2 already documented users describing the mental step: "you figure out 'oh, so I stand this way relative to Suchandsuch Street'". The map works because it converts the bearing into something the user can see, a street, a wall, a building edge, which is the same resolution step the sun method provides. It needs no magnetometer and never drifts.

**What it costs here.** Every shipped map qibla draws tiles from a service. SimplyQibla uses the Google Maps SDK, which needs an API key at build time. Al-Azan uses MapLibre with OpenStreetMap raster tiles, no key, but a live network, and its own code blocks the screen offline with an "Internet connection is necessary" alert. The app's constraints, no API keys and no external services, disqualify both shapes as a primary path. Al-Azan additionally proves the packaging cost: the F-Droid build drops MapLibre and the whole screen with it.

**The keyless, serviceless variant.** Nobody ships it as a map, and I looked for one. What ships instead are two keyless equivalents that do the same job:

1. **The bearing number plus a cardinal diagram.** This is D4's rung 5 and the no-compass states in R6 and D4. The qiblafinder.org FAQ is effectively this in prose: "locate your Qibla degree... then, starting from N, locate your Qibla degree clockwise on the compass dial", described as something you can do with any physical compass [W]. Muslim Pro's "use the North indicator or the 'sun' icon in order to align the device manually" is the same idea with a sun glyph [P]. Our app already owns every ingredient: the exact bearing from `adhan`, the cardinal ring already drawn on the dial, and the fact that Greater London's bearing spans 0.71 degrees (D4 section 7), so a single number is correct for every user.
2. **A drawn street-diagram the user labels themselves.** This would be new product surface with no shipped precedent I could find, and I would not build it. The user's own landmark knowledge plus a clear number does the job without inventing a fake map.

INFERRED sizing: the number-plus-diagram path is nearly free, sits inside the existing dial, and matches what the biggest commercial app tells users to do by hand. A real map is only worth its cost if the owner ever relaxes the offline constraint, and Al-Azan is the blueprint if he does.

---

## 4. Manual calibration and manual override

**What ships.** Trail Sense ships a numeric declination override (an edit-text in degrees, plus "set from GPS"), a smoothing slider, a true-north toggle, a sensor-source picker, and the AR-specific "use gyroscope after calibration" toggle. GPSTest ships the true-north toggle only. flutter_compass, hj-qibla, flutter_qiblah and Al-Azan ship no user correction of the heading at all. The React Native and Flutter compasses ship nothing. The figure-of-eight dialog in Trail Sense and the guided flow in NorthPin coach the OS's own calibration; neither computes a bias. Muslim Pro's sun icon is the only "align to a known reference and proceed" affordance in the commercial space, and it is a manual pointing aid, not a stored offset.

**The one real gap nobody fills.** Android exposes `TYPE_MAGNETIC_FIELD_UNCALIBRATED`, whose event carries the raw field and the OS's iron-bias estimate, the same numbers the 3T measurement used. An app could sample the uncalibrated field across orientations, fit the ellipsoid itself, and apply its own bias correction, which would genuinely repair a phone whose OS calibrator has converged on a wrong 84.5 microtesla bias. No shipped app I read does this. Trail Sense gets closest in spirit with its custom sensor sources and its `validMagnetometerMagnitudes = Range(20f, 65f)` gate inside `CustomRotationSensor`, which rejects bad fields rather than correcting them. I infer the market avoids app-side fitting because the OS keeps recalibrating underneath you, so an app-side bias would fight the system's, and because the motion requirement, a proper multi-orientation sweep, is the same user burden as the figure of eight with more failure modes.

**Do users understand such controls?** The evidence says no, and it says so about controls far simpler than a heading offset. The iPhone's true-north toggle generates confusion threads ("What is true north", users surprised two phones disagree) [W]. Cloudy Nights and r/Survival threads show experienced adults wrestling with declination correction on physical compasses [W]. Trail Sense's declination override is buried in a settings screen aimed at experts. D4 section 6 already ruled against a persisted manual offset on the correct engineering ground that it bakes today's room into every future reading, and my survey adds the product ground: in the entire shipped ecosystem I read, not one qibla or compass app offers a "fix your heading by N degrees" control. The closest shipped pattern that does work is SolarCompass's: the user performs the alignment against a real reference (the sun), the app supplies the astronomy, and nothing persists beyond the session's dial. If the owner ever wants a user-performed correction, that is the shape with a shipped precedent behind it, and it needs no stored offset.

---

## 5. The non-compass qibla methods

Framed strictly as product features, per the brief. R6 sections 6.3 and 6.4 cover the astronomy, the rasd dates and the IslamQA endorsement, and session 37's `01-jurisprudence.md` covers the religious standing; none of that is repeated.

**The sun method ships, twice over.** SolarCompass is open source, on F-Droid since 2016, and computes cardinal directions from solar azimuth alone, with the user pointing the phone at the sun [S]. Sun Qibla on the Play Store does the qibla-specific version: "The application to find direction of qibla and direction of north, east, south, and west from your location using sun or moon position", with a four-step user guide, moon as a night fallback, and 1K+ downloads [W, listing fetched]. So the "face the sun, turn by the difference" feature exists as a shipped, describable product, from a solo Indonesian developer, with no sensor and no network beyond a location fix.

**The daily variant.** The qiblafinder.org FAQ describes "Qibla time": "When you face the sun at the Qibla time calculated for your city, you are facing the Qibla direction", positioning it as "a practical and reliable method" [W]. The twice-yearly rasd events get annual mainstream coverage in the Gulf and Indian press, which is where most users meet the idea [J, Gulf News and Times of India, both 2025 or 2026]. Athanify's own product blog teaches the shadow method and the solar-noon method as backups and encourages users to "learn the sun method properly" [W].

**How users receive it.** Enthusiastically, in the specific sense that it is the method users recommend to each other when apps disagree: R6 quotes "Use the method that has always worked throughout the ages to verify the qiblah: Qiblah by Shadow", and the sun-sense method threads ("where the sun rises I just face a bit to the right of it") show users already think this way without any app's help [W]. No review I found complains about a sun feature existing. The owner does not want to test with the sun himself, which is fine: nothing here needs him to. The product shape is one computed line, "the sun is at 214 degrees now, the qibla is 119", or on rasd days "the shadow points along the qibla at 13:27", both of which R6 section 6.4 already specced and both of which a user can ignore at zero cost.

**The landmark method.** A mosque's mihrab, satellite dishes, street grids: users do this already (R6 section 6.2) and apps support it only indirectly, through the map's landmark matching. Nothing to build. The one honest copy line is the bearing number, which D4's states already carry.

**Cost.** The sun azimuth is closed-form. SolarCompass does it in 60 lines with a coarse model; Trail Sense's `sol` library does it properly (`getSunPosition`) under MIT in Kotlin, and the JS port of NOAA's equations is a well-trodden afternoon with the existing `adhan` test suite as a neighbour. No sensor, no permission beyond location (already held), no network. Of everything in this report, it is the highest-certainty feature per line of code.

---

## 6. What the ecosystem considers acceptable accuracy

Session 37's `01-jurisprudence.md` establishes the classical frame: `jihat al-Ka'ba` suffices at distance for three of four schools, a derived 45-degree bound appears in fatwa literature, and diligence rather than outcome decides validity, with IslamQA 483121 naming the phone compass as the readily available instrument whose neglect counts as negligence. What this pass adds is the engineering band the apps and the measurement literature actually operate in.

**The measurement literature, all [P] (peer-reviewed or official):**

- **Ismail, Musa and Zainon 2024** (IJARPED 13.4): theodolite ground truth 292 degrees 57 minutes 44 seconds against the 20 most-downloaded apps. Fifteen of twenty apps matched 292; five showed 295, a 3-degree error, on both platforms, indicting the apps' maths rather than any phone. Conclusion verbatim: "it is still functional as it falls within the allowed limits of degrees."
- **Zaki and Hidayatullah 2025** (Jurnal Fiqh 22.1, Universiti Malaya): 25 apps compared, "68% of qibla applications in both systems have a deviation of less than 3 degrees", iOS apps more accurate than Android by 8 percent. Framed as usable "within the tolerance limits allowed in Malaysia".
- **Mukhtari 2026** (AR-RISALAH): surveys the tolerance literature directly. Operational limits in use: **2 degrees** for mosque row alignment in several studies, a **sociological tolerance of about 6 degrees** for a worshipper's body drift during prayer, and mathematical tolerances derived from whether the projected ray still hits Mecca's territory. The author applies 2 degrees as the strict mosque-grade bar and finds four of five sampled mosques exceed it (up to 10 degrees).
- **The Selangor Muftiate, Taudhih al-Falak 19, March 2026** [P, official fatwa-office publication, fetched today]: the Malaysian Muzakarak of 2007 decided the individual-prayer deviation limit should not be fatwa'd at all, and the Selangor Falak Committee's position is that for an individual praying, no fixed degree is set "kerana nas yang memberikan keluasan", because the texts grant breadth, while **3 degrees serves as the guideline for buildings** (mosques, prayer rooms, cemeteries), chosen "berdasarkan kemampuan peralatan falak", on the capability of falak instruments. The same document quantifies why anyone cares: 1 degree of deviation displaces the ray 111 to 122 km at Malaysian distance.

**The apps' own claims.** Nobody in the qibla market publishes a numeric accuracy claim. The numbers that exist come from the general compass space: NorthPin's FAQ claims "most modern phones achieve 1-3 degrees" outdoors away from metal [W]; the genre's alignment window is plus or minus 5 degrees, per session 37's UX report, with the Garmin qibla watch vibrating inside a 5-degree window and Qibla Pro pulsing on alignment. Al-Azan faces at 1 degree in its map mode, which is a snap threshold, not an accuracy claim.

**The bar, distilled.** Three numbers, three jurisdictions of trust:

| Bar | Degrees | Source and standing |
| --- | --- | --- |
| Classical validity floor | 45 | Derived fatwa figure, session 37's report; the prayer stays valid, this is the outer fence [P] |
| Building and instrument grade | 2 to 3 | Peer-reviewed operational limits and the Selangor guideline for mosques, explicitly not for individuals [P] |
| Product alignment window | 5 | The shipped apps' green-and-vibrate threshold, and R6's recommended haptic window [S37 plus W] |

So the product decision the owner faces, with real numbers: a phone whose residual bias leaves it 15 degrees wrong fails the instrument-grade bar by a factor of five and the product window by three, yet sits comfortably inside the classical 45-degree validity floor, and even inside the roughly 6-degree sociological band it is only a factor of 2.5 out. An app that guarantees "15 degrees or I tell you honestly" is defensible on the religious evidence and on the published measurement literature, provided the screen never claims instrument grade when it does not have it. That is exactly the honesty split D4's degradation ladder implements, and nobody's shipped code contradicts it.

---

## 7. The honest conclusion, in full

A reliable compass on the failing phones is not achievable in app code, and the evidence is the strongest kind: the best implementations, readable line by line, do not attempt it. Trail Sense's complete answer to a bad magnetometer is a 22 to 67 microtesla envelope check, a quality enum, a one-word badge, a banner saying calibration is advised, an animated figure-of-eight, and a sensor restart. It is the most-funded engineering effort in open-source compasses, it has thought about this harder than anyone, and its remedy for a Poor phone is to tell the user to wave it in the air. Every convergent detail in the closed-source world, NorthPin's microtesla meter, Google's beam, Muslim Pro's help page, matches the same architecture: detect, disclose, coach, and offer a way out that does not need the sensor.

The way out is not hypothetical product design. It ships. Al-Azan pairs the compass with a map and ranks the compass below it in its own disclaimer. SimplyQibla deleted the compass and made the map the whole app, with users reviewing that they prefer it. SolarCompass and Sun Qibla get direction from the sun with no magnetometer at all, and users recommend the sun method to each other unprompted. Google's flagship effort is a camera line. The entire sophisticated end of the market is doing what D4 and R6 already proposed for this app: honest degradation plus a sensor-free path.

Two things are genuinely unshipped, and they are the only frontier I found. No app-side hard-iron fit over `TYPE_MAGNETIC_FIELD_UNCALIBRATED` exists in any readable codebase, so a phone whose OS calibrator has converged wrongly cannot be repaired by us, only detected. And no keyless, offline map exists, so our map-shaped fallback must be the bearing-plus-cardinal-ring variant, which is nearly free and which the biggest commercial app effectively tells users to perform by hand. The owner should take the product decision with the three bars in front of him: chase the 5-degree window on good phones, guarantee honesty at 15, and never let the screen imply instrument grade. He is not behind the best apps in the world. They publish disclaimers; he has the chance to publish states.

---

## Implementation comparison

| Implementation | Read | Sensor | Filtering | Field validation | Bad-heading UX | Own calibration |
| --- | --- | --- | --- | --- | --- | --- |
| Trail Sense | [S] full stack | OS rotation vector, geo RV, custom mag+gyro, custom mag+accel, legacy; source picker, custom ranked first | Low-pass optional (smoothing pref), gravity sensor preferred over accel | 22 to 67 uT band plus 10 percent margins, min-of-qualities; divergence detector 1 degree, 45 deg/s, 1 s dwell | Quality badge always visible; Poor banner with How action; toast on improvement | No fit. Sensor stop/start restart, figure-of-eight coach, declination numeric override, gyro-only AR toggle |
| GPSTest | [S] | Rotation vector, legacy orientation fallback | None | None | None in map view; accuracy callback is a no-op | True-north toggle; Samsung vector truncation workaround |
| flutter_compass | [S] | Rotation vector, raw accel+mag fallback | Low-pass 0.45 on fallback only; 32 ms throttle | None | Logs unreliable, keeps streaming; band mapped to 15/30/45 degrees for consumers | None |
| flutter_qiblah | [S] | Delegates to flutter_compass_v2 | Whatever flutter_compass does | None; support check on Android only | None | None |
| Al-Azan | [S] | Rotation vector only, native module | Low-pass 0.96 | None | Unreliable/Low/Medium/High in colour words; disclaimer gate names compass mode as the unreliable one | None. WMM declination offline. Map mode is the fallback |
| SimplyQibla | [S] | flutter_compass, optional, off by default (map rotation only) | Library default | None | Compass icon swaps to location icon when hardware absent | None. The map IS the answer |
| hj-qibla-compass | [S] | Rotation vector, raw fallback | Low-pass 0.97 on fallback | None (accuracy discarded) | None | None |
| SolarCompass | [S] | None. Sun position plus user pointing | None needed | Not applicable | Not applicable | User is the sensor; sun icon drag |
| Kr0oked Compass | [S] | Rotation vector | None read | None | Sensor-status dialog, tinted levels, figure-of-eight string | None |
| react-native-compass | [S] | expo-sensors bare magnetometer | EMA with wraparound | None; accuracy stubbed to 0 | README tells the user to wave the phone | None |
| NorthPin | README only, code COULD NOT VERIFY | Magnetometer plus optional accel/gyro | Dynamic-alpha low-pass | 25 to 65 uT envelope, live microtesla meter | Interference alerts, "know when not to trust it" | Guided figure-eight, triggered by field drift. No offset |
| Muslim Pro | [P] help page | Compass | Unpublished | Unpublished | Still-compass, wrong-direction and infinite-loop help sections; sun icon manual alignment; names no-compass phones | Teaches figure-of-eight, 5 or 6 loops |
| Google Qibla Finder | [P] blog and help | Compass plus camera AR | Unpublished | Unpublished (Maps beam per R6) | AR line as the alternative path; calibrate recommendation | Points at Maps calibration |
| qiblafinder.org | [W] site | Browser compass or none | Unpublished | Unpublished | Map tab as the no-compass path; sun and qibla-time methods documented | Teaches figure-of-eight |

---

## COULD NOT VERIFY

1. **NorthPin's implementation.** The GitHub repo (`Lapnito/northpin-compass`) contains only localized READMEs, no source. Tried: `opensrc fetch`, directory listing, searching the repo for Kotlin, Swift or Dart files. The method claims (envelope, meter, guided flow) rest on the developer's own README and dev.to post, both fetched today. They match Trail Sense's shipped code exactly, which is why they are still useful.
2. **Any app-side hard-iron calibration in shipped code.** Searched every fetched repo for ellipsoid fits, bias estimation from uncalibrated data, and `TYPE_MAGNETIC_FIELD_UNCALIBRATED` consumers beyond D4's expo-sensors finding. None implement a fit. The claim "nobody ships it" is absence of evidence across eleven codebases plus failed searches for others, which is strong but not proof of universal absence.
3. **A keyless, offline, map-based qibla UI anywhere.** Searched the map qibla apps' sources and the store. Every shipped map draws remote tiles. The negative is scoped to what I could read and find.
4. **Store review volume statistics.** TinyFish returns individual reviews, not aggregates. The reviews quoted (SimplyQibla's map preference, the haram tester, Muslim Pro one-stars) are single voices, graded [W], and are used as existence proofs of sentiment, not as measurements of its prevalence.
5. **The Jurnal Fiqh 2025 full text** (Zaki and Hidayatullah). The abstract page was fetched and quoted; the PDF download was not retried after the first redirect failed. The 68-percent figure is from the publisher's own abstract, which is authoritative for the number's wording.
6. **Whether Google Qibla Finder's AR mode degrades to the magnetometer indoors.** The help page says it "works with your device's compass"; the AR line's actual sensor grounding is unpublished. Marked [U] where it matters.
7. **Sun Qibla's download and rating health beyond the listing's own numbers** (1K+, contains ads). No review text was retrievable through the fetch.

---

## Sources

| Grade | Source | Used for |
| --- | --- | --- |
| S | Trail Sense `main` via opensrc: `QuickRecalibrationOrientationSensor.kt`, `CompassProvider.kt`, `MagnetometerExtensions.kt`, `MagQualityCompassWrapper.kt`, `MagQualityOrientationWrapper.kt`, `NavigatorUserErrors.kt`, `MagnetometerDiagnosticScanner.kt`, `CalibrateCompassFragment.kt`, `CompassCalibrationView.kt`, `ImproveAccuracyAlerter.kt`, `SensorStatusBadgeView.kt`, `strings.xml`, `compass_calibration.xml`, `augmented_reality_preferences.xml` | Section 1.1 in full |
| S | Andromeda `main` (Trail Sense's sensor library): `Magnetometer.kt`, `RotationSensor.kt`, `BaseSensor.kt`, `CustomGeomagneticRotationSensor.kt` | Sensor wrappers, quality plumbing, the custom reference sensor |
| S | sol `main`: `Astronomy.kt`, `Sun.kt` | Shipped offline solar-position API for the sun method |
| S | GPSTest `master`: `SharedSensorManager.kt`, `Orientation.kt`, `SatelliteUtils.java`, `strings.xml`, `preferences.xml` | Section 1.2 |
| S | flutter_compass `master`: `FlutterCompassPlugin.java`, `SwiftFlutterCompassPlugin.swift` | Section 1.3 |
| S | flutter_qiblah `master` (medyas): `FlutterQiblahPlugin.kt`, `flutter_qiblah.dart` | Section 1.4 |
| S | Al-Azan `main` (meypod): `CompassSensor.java`, `CompassModule.java`, `MathUtils.java`, `TSAGeoMag.java`, `src/modules/compass.ts`, `qibla_finder_compass/` (both files), `qibla_finder_map/index.tsx`, `qibla_finder/index.tsx` | Section 1.5, the map fallback |
| S | simply_qibla `master` (TowardsIkhlaas): `map_page.dart`, `map_page_state.dart`, `pubspec.yaml`, `README.md` | Section 1.6 |
| S | hj-qibla-compass `master`: `CompassSensors.kt`, `QiblaCompass.kt`, `QiblaMath.kt` | Section 1.7 |
| S | solarcompass `master` (agnibho): `CompassLogic.java`, `README.txt` | Section 1.8, the sun method in code |
| S | Kr0oked Compass `master`: `SensorAccuracy.kt`, `SensorAccuracyExt.kt`, `strings.xml` | Section 1.9 |
| S | react-native-compass `main` (russellio): `useCompassHeading.ts`, `headingMath.ts`, `README.md` | Section 1.10 |
| W | NorthPin: `Lapnito/northpin-compass` README and dev.to build post, both fetched 2026-09-29 | Section 1.11, marked unverified in code |
| P | support.muslimpro.com Qibla help article, fetched 2026-09-29 | Section 2, Muslim Pro behaviour |
| P | support.google.com Qibla Finder FAQ, fetched 2026-09-29 | Section 2 |
| P | blog.google, "Finding the Qibla with the help of augmented reality", 2017-06-11 | Section 2, AR line |
| P | Ismail, Musa, Zainon, IJARPED 13.4 (2024), PDF fetched from ijarped.com | Section 6, 20-app theodolite study |
| P | Zaki, Hidayatullah, Jurnal Fiqh 22.1 (2025), abstract page fetched from ejournal.um.edu.my | Section 6, 68-percent figure |
| P | Mukhtari and Irfan, AR-RISALAH 6.1 (2026), PDF fetched from ejournal.iain-bone.ac.id | Section 6, tolerance survey, 2-degree and 6-degree bars |
| P | Jabatan Mufti Negeri Selangor, Taudhih al-Falak 19, 2026-03-30, fetched | Section 6, Muzakarak 2007 ruling, 3-degree building guideline |
| W | SimplyQibla Play Store listing with reviews, fetched 2026-09-29 | Sections 1.6 and 3 |
| W | qiblafinder.org site FAQ, fetched 2026-09-29 | Sections 2, 3, 5 |
| W | Sun Qibla Play Store listing, fetched 2026-09-29 | Section 5 |
| W | athanify.com blog, "How to Find Qibla Direction Without a Compass", 2026-06-15 | Section 5 |
| W | qiblafinders.com GPS-versus-compass comparison, 2026-01-07 | Section 6 context, error bands by environment |
| W | r/islam 1ciaq42 (Maps ruler method, haram tester), r/Muslim 1h0xkhz (physical compass advice), r/MuslimLounge qjg1ab (shadow method), r/iphone true-north thread, cloudynights compass thread | Sections 2, 4, 5 |
| J | Gulf News 2026-07-14 and Times of India 2025-07-15 on the rasd al-qibla events | Section 5, mainstream awareness |
| S37 | Session 37 reports `01-jurisprudence.md`, `05-ux-design.md` | The 45-degree floor, the 5-degree window, not re-derived |
| S40 | D4 and R6 sibling reports in this folder | The detection architecture and UX states this report aligns to, not repeated |
