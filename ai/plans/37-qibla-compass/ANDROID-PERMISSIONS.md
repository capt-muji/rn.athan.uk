# Android and iOS location permissions: what actually ships, read from source

Researched 2026-09-29 against the installed `expo-location@58.0.8`, the SDK 58 documentation, and this
repo's own manifest. **It contradicts the coarse-only decision taken while planning, so the decision has to
be retaken rather than quietly implemented.**

## 1. The finding: coarse-only is NOT reachable by configuration

`expo-location` adds BOTH permissions, in two places, and neither is optional.

**Its own manifest** (`node_modules/expo-location/android/src/main/AndroidManifest.xml`) is merged into
every build that includes the module:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

**Its runtime request** hardcodes the pair (`LocationModule.kt:176-186`):

```kotlin
AsyncFunction("requestForegroundPermissionsAsync") Coroutine { ->
  LocationHelpers.askForPermissionsWithPermissionsManager(
    permissionsManager,
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION
  )
```

**Its config plugin** takes no option to drop either, and says so
(`plugin/build/withLocation.js`):

> `// Note: these are already added in the library AndroidManifest.xml and so are not required here`

The SDK 58 documentation states the same: "When you install the `expo-location` module, it automatically
adds the following permissions: `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`", and lists only
`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION` and `ACCESS_BACKGROUND_LOCATION` as optional.

**So an unmodified build ships FINE and asks the user for precise location, which the owner did not choose
and the feature cannot use.**

## 2. What Android does with the pair, by version

The 3T is the floor device at **Android 9 (API 28)**, and the behaviour splits either side of API 31.

| Android | What the user is asked | What the app gets |
| --- | --- | --- |
| 9 (API 28), the 3T | One dialog. No precision choice exists | Both, as declared |
| 10 to 11 (29 to 30) | One dialog, plus a while-using-the-app choice | Both |
| **12+ (API 31+)** | A dialog with **Precise** and **Approximate** toggles | Whatever the user picks |

From API 31 a user may grant COARSE while refusing FINE, so **any code that treats FINE as guaranteed is
wrong on every modern phone**, which is precisely why `expo-location` re-reads the result rather than
trusting its own request (`LocationModule.kt:184`: "we need to check if the user has provided fine location
permissions").

**Declaring a permission is always safe on older versions.** A `uses-permission` an OS does not know is
ignored at install time, which is why this repo already ships `USE_EXACT_ALARM` (API 33+) and
`POST_NOTIFICATIONS` (API 33+) unconditionally while supporting API 28. The risk is never breakage; it is
asking for more than the feature needs, and being judged for it at store review.

## 3. The remedy, and it is a pattern this repo already runs

A manifest merger directive removes the permission the module forces in:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" tools:node="remove" />
```

`plugins/androidWidgetGrid.js` already strips attributes expo-widgets writes, after prebuild, with the
registration-order rule documented in `ai/AGENTS.md`: dangerous mods run last-registered-first, so a plugin
must be registered BEFORE the one whose output it edits.

**Unverified until built:** that the merged manifest ends with COARSE and without FINE, and that
`getCurrentPositionAsync({ accuracy: Balanced })` still returns a fix on the 3T with COARSE alone. Both are
step 1 of the follow-up, and neither is assumed here.

## 4. iOS

iOS has no equivalent problem and needs one string.

`NSLocationWhenInUseUsageDescription` is the only key this feature needs. The plugin supplies a generic
default ("Allow $(PRODUCT_NAME) to access your location"), which is **not good enough**: it names no reason,
and `app.json` currently carries no location key at all. The research already settled the copy:

> **"Your location is used to point the compass toward the Kaaba. It never leaves your device."**

`NSLocationAlwaysAndWhenInUseUsageDescription` and `NSLocationAlwaysUsageDescription` are NOT added, because
the compass never runs in the background. Reduced accuracy ("Precise: Off") is the iOS analogue of coarse
and does not break `trueHeading`, which section 17.1 of `RESEARCH.md` established.

## 5. What this means for the owner's decision

The decision was "coarse only, via a config plugin". That is still achievable, but it costs a **fourth
local config plugin** plus a device proof on two phones, rather than the one plugin flag the decision was
taken against. The alternative is to accept FINE in the manifest, which is what every Expo app using this
module ships by default.

**This is put back to the owner in section 2 of `PLAN.md` rather than decided here**, because the cost
changed after the decision was taken.
