# Session 49: what this planning session measured, before any plan was written

Every number here was taken on this machine or the owner's own hardware during planning, and each
one is reproducible by the command beside it. The row's brief carried three claims from session 48's
research; **one of them is wrong, and finding that out changed the shape of the whole session.**

---

## 1. THE ROW'S CENTRAL BLOCKER DOES NOT EXIST

The brief states it as settled fact, twice:

> **TWO BLOCKERS ARE ALREADY MEASURED AND A PLANNING SESSION MUST DESIGN AROUND THEM:
> `expo-location/android/build.gradle:19` pins `play-services-location:21.0.1` against FOP's
> minimum of 21.2.0**, and no npm or Expo wrapper for FOP was found, so this is a native module or
> a patch rather than a dependency.

The pin is real. **The conclusion that it blocks anything is false**, because Gradle resolves a
version *conflict* by taking the HIGHEST request, not the first. Measured three ways:

| Step | Command | Result |
| --- | --- | --- |
| The pin, confirmed | `grep play-services-location node_modules/expo-location/android/build.gradle` | `api 'com.google.android.gms:play-services-location:21.0.1'` |
| What resolves TODAY | `./gradlew :app:dependencies --configuration releaseRuntimeClasspath` | `play-services-location:21.0.1`, no upgrade |
| What resolves with a local module asking 21.4.0 | the same command, with `modules/qiblaheading` present | **`play-services-location:21.0.1 -> 21.4.0`** |

So a local Expo module declaring `implementation 'com.google.android.gms:play-services-location:21.4.0'`
lifts the whole app's resolution, `expo-location` included, with **no patch to `expo-location` at
all.** Proven to compile, not merely to resolve:

```
> Task :qiblaheading:compileReleaseKotlin
> Task :qiblaheading:bundleReleaseAar
BUILD SUCCESSFUL in 30s
```

against a Kotlin file importing `FusedOrientationProviderClient`, `DeviceOrientation`,
`DeviceOrientationRequest` and `LocationServices.getFusedOrientationProviderClient`.

**Why this matters beyond saving work:** the brief's framing invited a patch to `expo-location`'s
own `build.gradle`, and `ai/AGENTS.md` records that patching that package's Android source is
subtle enough to have already produced one silent no-op (the `publication` block resolving a
prebuilt AAR instead of the patched Kotlin). A local module avoids that class of defect entirely.

## 2. FOP's API surface, read from the bytecode rather than the documentation

The documentation pages for these classes 404 today, so the signatures come from the AAR itself:
`javap` over `play-services-location-21.4.0.aar`'s `classes.jar`.

```
public class com.google.android.gms.location.DeviceOrientation {
  public float getHeadingDegrees();
  public float getHeadingErrorDegrees();
  public float getConservativeHeadingErrorDegrees();
  public boolean hasConservativeHeadingErrorDegrees();
  public long getElapsedRealtimeNs();
  public float[] getAttitude();
}
public interface com.google.android.gms.location.FusedOrientationProviderClient {
  Task<Void> requestOrientationUpdates(DeviceOrientationRequest, Executor, DeviceOrientationListener);
  Task<Void> removeOrientationUpdates(DeviceOrientationListener);
}
public interface com.google.android.gms.location.DeviceOrientationListener {
  void onDeviceOrientationChanged(DeviceOrientation);
}
public final class DeviceOrientationRequest {
  public static final long OUTPUT_PERIOD_DEFAULT = 20000;   // microseconds, 50 Hz
  public static final long OUTPUT_PERIOD_MEDIUM  = 10000;   // 100 Hz
  public static final long OUTPUT_PERIOD_FAST    =  5000;   // 200 Hz
}
```

Three things worth having that the brief did not carry:

- **`hasConservativeHeadingErrorDegrees()` exists**, so the error cone is OPTIONAL per sample and a
  caller must test before reading it. A plan that read it unconditionally would publish whatever
  the field defaults to and call it an accuracy.
- **`OUTPUT_PERIOD_DEFAULT` is 20000 microseconds, which is exactly the 50 Hz the 3T is already
  running** after session 48's patch, so FOP needs no rate tuning to match what the owner accepted.
- `getAttitude()` returns a quaternion, which is the tilt-independent form R2 said hand-rolled
  `getOrientation` could never give.

**Which version first carries it, measured rather than assumed**, by downloading three AARs and
counting the classes:

| Version | FOP classes present | `LocationServices.getFusedOrientationProviderClient` |
| --- | --- | --- |
| 21.0.1 | 0 | absent |
| 21.1.0 | 5 (the data classes only) | **absent** |
| 21.2.0 | 6 | present |
| 21.4.0 | 6 | present |

So 21.2.0 is the true minimum, which confirms the brief's number, and 21.4.0 is the current
release. **21.1.0 is a trap: it carries `DeviceOrientation` and `DeviceOrientationListener` but no
client to request updates from**, so a version check written against the data classes would pass on
a version that cannot work.

## 3. The 3T can run FOP, which was not a given for a 2016 phone

FOP needs an accelerometer, a gyroscope AND a magnetometer, plus Play services. All four confirmed
on the floor device, from `adb -s 8f7ada76 shell dumpsys sensorservice` and `dumpsys package`:

| Requirement | On the OnePlus 3T |
| --- | --- |
| Accelerometer | `LSM6DS3 Accelerometer`, maxRate 200 Hz |
| Gyroscope | `LSM6DS3 Gyroscope`, maxRate 200 Hz |
| Magnetometer | `MMC3416PJ Magnetometer`, maxRate **52 Hz** |
| Play services | `versionName=26.34.36` |
| API level | 28, against FOP's Android 5+ |

The magnetometer's 52 Hz ceiling is the binding constraint on the whole stack, which is what
session 48 measured from the other side when it chose `SENSOR_DELAY_GAME` at 20 ms.

## 4. iOS: the bucketing, read verbatim, and what it costs

`node_modules/expo-location/ios/LocationUtils.swift:9-20`, unchanged at the pinned 58.0.9:

```swift
internal func normalizeAccuracy(_ accuracy: CLLocationDirection) -> Int {
  if accuracy > 50 || accuracy < 0 { return 0 }
  if accuracy > 35 { return 1 }
  if accuracy > 20 { return 2 }
  return 3
}
```

And the one call site, `LocationModule.swift:111-117`, which is the only path a JS caller has:

```swift
sendEvent(EVENT_HEADING_CHANGED, [
  "watchId": watchId,
  "heading": [
    "trueHeading": heading.trueHeading,
    "magHeading": heading.magneticHeading,
    "accuracy": normalizeAccuracy(heading.headingAccuracy)
  ]
])
```

**Two separate losses, and the second is the one nobody has written down.**

1. The degrees collapse into four buckets, and bucket 3 spans 0 to 20 degrees, which is the entire
   range the owner is complaining about. This is session 48's finding, confirmed verbatim.
2. **A NEGATIVE accuracy, which Apple documents as "invalid heading", is mapped to bucket 0, and
   bucket 0 is ALSO what a merely-poor 60-degree reading maps to.** So the one value Apple's own
   sample code gates on unconditionally (`if (newHeading.headingAccuracy < 0) return;`) is not
   recoverable from the JS side even in principle: `accuracy === 0` cannot distinguish "the phone
   says this reading is invalid" from "the phone says this reading is poor but real".

`normalizeAccuracy` is not reachable from JS, is not configurable, and has no bypass. So on iOS the
native module is the only route to the number, exactly as session 48 concluded.

## 5. The iOS module integrates, proven rather than assumed

A local Expo module with an `ios/` folder and a podspec is picked up by autolinking with no Podfile
edit. Measured by creating one and running `pod install` in `ios/`:

```
Installing QiblaHeading (0.1.0)
  QiblaHeading (iOS=16.4)
```

So both halves of this module reach both platforms through mechanisms this repository already uses
for `modules/tls13` and `modules/widgetrefresh`.

## 6. What is on the phones right now

| Phone | Installed | Repository |
| --- | --- | --- |
| OnePlus 3T `8f7ada76` | 1.29.207, production release | `uat-2` at 1.29.208 |
| iPhone XS `00008020-0015585C22D2002E` | 1.29.207 | the same |

Both are one patch version behind `uat-2`, whose extra commit is documentation only (row 50's
write-up), so both phones hold the code the owner accepted.
