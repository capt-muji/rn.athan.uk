# Ticket 121 findings: `expo-location/next`, the provider API evaluation

Measured 2026-10-16 in the lane 121 worktree at the installed pin `expo-location` 58.0.16
(`package.json:55`) with `expo` 58.0.12 and `react-native` 0.88.0. Every claim carries its file
and line, or its command and its output. Read from `node_modules/expo-location/src/` first; the
published documentation second; the changelog and the upstream pull request third. Section 8
names the re-verification pass a re-pin that moves `expo-location` requires.

Section 5 ends the ticket: the options, the recommendation and the argument record. Nothing in
this file changes a line of app code.

## 1. The API surface of `expo-location/next` at 58.0.16

### 1.1 Where it lives

The package's export map carries a second entry point:

```
"exports": { ".": { ... }, "./next": { "types": { "default": "./build/next/index.d.ts" },
  "default": "./build/next/index.js" } }
```

(`node_modules/expo-location/package.json`, `exports`). The `/next` surface is therefore a
first-class subpackage inside the same dependency, not a separate package. The native side is
registered as `LocationModuleNext` beside the classic `LocationModule`
(`node_modules/expo-location/expo-module.config.json`, the `android.modules` list and the apple
module list), so both native modules are compiled into every build this repo makes today. An
adoption of `/next` changes JavaScript only: no dependency is added and no native module is
erased.

Measured, the docs' own platform line: the published page declares `platforms: ['android',
'ios']` for the subpackage.

### 1.2 The JavaScript surface, name by name

`src/next/index.ts` re-exports the `Location` namespace plus the hooks, the three classes, the
task definer and the enums and types. `src/next/Location.ts` is the flat method namespace.
Anchors: `next-index.md`, `next-location.md`, `next-js-index.md`.

Methods (15), all on `Location`:

| Method | Platforms | What it answers |
| --- | --- | --- |
| `getPosition(options)` | android, ios | one fix, cached or fresh, or `null` |
| `watchPosition({profile,onPosition,onError})` | android, ios | a `PositionWatchHandle` stream |
| `hasLocationServicesEnabled()` | android, ios | the device's own location switch |
| `enableLocationServices()` | android only | the prompt that turns that switch on, throwing `UnavailabilityError` elsewhere |
| `getForegroundPermissions()` | android, ios | the current permission |
| `requestForegroundPermissions(options)` | android, ios | the system dialog |
| `getBackgroundPermissions()` | android, ios | the current background permission |
| `requestBackgroundPermissions(options)` | android, ios | the background dialog |
| `getNotificationPermissions()` | android only | the service's notification permission |
| `requestNotificationPermissions()` | android only | that dialog |
| `setLocationProvider(provider)` | android only | selects the backend |
| `getSelectedLocationProviderName()` | android only | the backend's name |
| `ensureBackgroundSessionStarted(options)` | android only | starts the foreground service |
| `stopBackgroundSession()` | android only | stops it |
| `getBackgroundSessionStatus()` | android only | the service's state |

Hooks (4): `useForegroundLocationPermissions`, `useBackgroundLocationPermissions`,
`useNotificationPermissions`, `useLocationServices`.
Classes (3): `PositionWatchHandle`, `LocationProvider`, `LocationUpdatesHandle`.
Functions (1): `defineLocationTask`.
Enums (5): `LocationProfile` (`default`, `automotiveNavigation`, `otherNavigation`, `fitness`,
`airborne`, `lowPower`), `LocationAccuracy` (`full`, `reduced`, `notGranted`), `LocationScope`
(`always`, `whenInUse`, `notGranted`), `RequestPermissionsAccuracyOption` (`full`, `reduced`),
`BackgroundSessionState`.
Types (14): `Coordinates`, `Position`, `PositionUpdate`, `PositionWatchError`,
`PositionWatchStatus`, `WatchPositionParams`, `GetPositionOptions`, `LocationTaskOptions`,
`LocationPermissionResponse`, `RequestPermissionsOptions`, `LocationProviderRefType`,
`BackgroundSessionOptions`, `BackgroundSessionStatus`, `BackgroundTaskStatus`.

### 1.3 The native method manifest

`src/next/native/types/NativeLocationModuleNextClass.types.ts:17-38` declares the whole native
module: at 17-31 the six permission methods (`requestForegroundPermissions`,
`getForegroundPermissions`, `requestBackgroundPermissions`, `getBackgroundPermissions`,
`requestNotificationPermissions`, `getNotificationPermissions`), then `setLocationProvider`,
`getSelectedLocationProviderName`, `hasLocationServicesEnabled`, `enableLocationServices`, and at
32-37 `getPosition`, `watchPosition` and the four nested classes (`LocationProvider`,
`PositionWatchHandle`, `LocationUpdatesHandle`, `BackgroundSession`). Twelve methods in all, and
none is a heading stream. The anchor `next-native-manifest.md` carries the 17-31 block. The Android side's `ModuleDefinition`
(`android/src/main/java/expo/modules/location/next/LocationModuleNext.kt:117-331`) declares
exactly those, and nothing else. The iOS side is `ios/next/LocationModuleNext.swift` with the
permission, position and updates-handle trees beneath it.

The watcher's only event is `positionChanged` (`NativePositionWatchHandleClass.types.ts:5-6`), and
its only status fields are `isSubscribed`, `canDeliverUpdates`, `isHandleAlive`, `isStarted`,
`isPaused`, `areUpdatesAllowed` and `isInForeground`
(`src/next/types/Position.types.ts:219-259`).

### 1.4 Heading is absent from `/next`: three independent checks

1. **The JavaScript layer declares none.** `grep -rn "heading\|Heading"
   node_modules/expo-location/src/next/js` prints no line (exit 1). The whole JS surface
   (`index.ts`, `Location.ts`, `js/*.ts`) carries no heading, compass or magnetometer name.
2. **The only heading in the source tree is a position field.** `grep -rn "heading\|Heading"
   node_modules/expo-location/src/next | wc -l` prints `5`, all inside
   `types/Position.types.ts` at lines 91, 92, 142, 144 and 149. Anchor: `next-position-heading.md`.
   The field's own documentation says it is not a compass: "The direction in which the device is
   traveling, in degrees clockwise from true north, from `0` to `360`. It is unrelated to the
   device's orientation." (`Position.types.ts:138-141`).
3. **The native layer carries no heading stream.** `grep -rn "heading\|Heading"
   node_modules/expo-location/android/src/main/java/expo/modules/location/next
   node_modules/expo-location/ios/next | wc -l` prints `13`, every one of them inside the
   `Position` record's mapping: the Android accessors and the `toPosition()` builder
   (`LocationRecords.kt:156, 161, 169, 173, 206, 210, 238, 275, 288`) and the iOS record and its
   `CLLocation` extension (`ios/next/Position/Position.swift:13, 14, 37, 38`). No
   `CLLocationManager.startUpdatingHeading` and no sensor listener appears anywhere under
   `ios/next/` or the `next` Kotlin package.

The field cannot stand in for a compass on either platform: iOS builds it from `CLLocation.course`
and reports `nil` when `course < 0` (`Position.swift:37`), and Android builds it from
`Location.getBearing()` behind `hasBearing()` (`LocationRecords.kt:275`). Course over ground is
nil or meaningless on a stationary phone, which is every use of the qibla sheet.

### 1.5 Position

`getPosition(options?: GetPositionOptions): Promise<Position | null>` (`js/getPosition.ts:32-35`).
Options: `maxCachedAge` (seconds, default 0), `timeout` (seconds, default 30, capped at 30 s on
Android), `profile` (default `LocationProfile.DEFAULT`). Resolves with a cached fix younger than
`maxCachedAge`, else waits up to `timeout` for a fresh one, else falls back to the last known
location; with `timeout: 0` it answers the last known location at once. On Android it still
resolves when location services are off; on iOS it throws. `Position` carries `coordinates`,
`horizontalAccuracy`, `timestamp`, `altitude`, `mslAltitude`, `verticalAccuracy`, `mocked`,
`heading`, `headingAccuracy`, `speed`, `speedAccuracy`.

`watchPosition(params): PositionWatchHandle` (`js/PositionWatchHandle.ts:156-164`). The handle
offers `pause`, `resume`, `withProfile`, `withInterval`, `restart`, `status`, `dispose` and
`addListener` (`:38-132`). On Android the watcher stops emitting when the app is backgrounded
unless a background session runs (`:16-18`).

### 1.6 Permissions, and the temporary full accuracy option

`LocationPermissionResponse` extends the modules-core `PermissionResponse` with `scope`
(`always` | `whenInUse` | `notGranted`) and `accuracy` (`full` | `reduced` | `notGranted`)
(`types/Permissions.types.ts:3-83`). The classic response nests the same information
(`ios: { scope, accuracy }`, `android: { accuracy }`, `src/Location.types.ts:485-515`), so `/next`
flattens an awkward shape but adds no capability the classic reader cannot already reach.

The temporary full accuracy path is real and iOS-only. `RequestPermissionsAccuracyOption.FULL`
(`types/Permissions.types.ts:49-62`, anchor `next-permissions-option.md`) requests precise location,
and "when the app holds a reduced accuracy, shows the system prompt for temporary full accuracy
after the permission is granted". Native: `ios/next/Permissions/TemporaryFullAccuracyRequester.swift`
calls `requestTemporaryFullAccuracyAuthorization(withPurposeKey:)`, gated by
`LocationPermissionsDelegate.swift:78-81` on `options.accuracy == .full` and on the purpose key
being present in the plist. The key is `ExpoLocationFullAccuracy` in
`NSLocationTemporaryUsageDescriptionDictionary`, written by the package's own config plugin by
default (`plugin/src/withLocation.ts:16-20, 146-156, 272-276`; `locationFullAccuracyPermission: false`
suppresses it).

Measured in the main tree, where the generated native folders live (both are gitignored and
untracked, so a lane worktree cannot read them), read at `b329d543` 2.0.900: `ios/Athan/Info.plist:79-83`
already carries

```
<key>NSLocationTemporaryUsageDescriptionDictionary</key>
<dict>
	<key>ExpoLocationFullAccuracy</key>
	<string>Allow $(PRODUCT_NAME) to access your precise location</string>
</dict>
```

and `app.json` names no `expo-location` plugin entry, so the plugin ran with its defaults. That
reading is a property of the plugin's default, written by `plugin/src/withLocation.ts:272-276` at
any prebuild, and not of the planned sha; the reading above stands as the observation, and the
mechanism is what the claim rests on. The
purpose string an adoption of `/next`'s FULL request needs is therefore already in every build
this repo makes. The classic API has no equivalent request (it reads `ios.accuracy` but never asks
the system to lift a reduced grant).

### 1.7 Services

`hasLocationServicesEnabled(): boolean` on both platforms (`js/locationServices.ts:13-15`, and the
published platform line reads "Supported platforms: Android, iOS"), and
`enableLocationServices(): Promise<boolean>` on Android alone, throwing `UnavailabilityError`
elsewhere, plus `useLocationServices()` which re-reads the switch on every return to the
foreground (`js/locationServices.ts:27-67`). With the GMS provider
the enable call shows an in-app dialog; with the Android provider it opens system Settings and
resolves on return. `/next` also reports `ERR_LOCATION_SERVICES_DISABLED_GLOBALLY` from its
watchers when the switch is off (CHANGELOG 58.0.14).

This closes a state the app cannot tell apart today: `device/qibla.ts` reports a denied permission
and a lost heading, and nothing distinguishes "the device switch is off" from either.

### 1.8 Background location

`LocationUpdatesHandle` (task name defaults to `expo-location-background-location`) with
`withProfile`, `start`, `stop`, `hasStarted` and the Android-only `status`
(`js/LocationUpdatesHandle.ts:27-86`), plus `defineLocationTask({taskName, onPosition, onError})`,
which wraps `TaskManager.defineTask` and throws a named error when `expo-task-manager` is absent
(`:89-117`). The repo carries `expo-task-manager ~58.0.12` as a direct dependency (`package.json`),
so that requirement is met already. Android needs the background permission and
`RECEIVE_BOOT_COMPLETED` (present in this build's manifest for other features); iOS needs the
`location` background mode and the foreground permission.

The app has no background location use: the qibla reads one fix per sheet open and re-reads only
after 10 km of movement (`hooks/useQibla.ts:49-58, 268-304`). Nothing on this axis is a candidate
for adoption.

### 1.9 The Android foreground service

`ensureBackgroundSessionStarted(options)`, `stopBackgroundSession()` and
`getBackgroundSessionStatus()` (`js/BackgroundSession.ts:30-56`). The service keeps position
watchers running while the app is backgrounded; starting it requires the app to be in the
foreground, `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION` in the manifest, and it throws
when either is missing (`:23-33`).

Measured in the main tree (`android/app/src/main/AndroidManifest.xml`): the manifest carries
`ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` (lines 2 and 3) and no
`ACCESS_BACKGROUND_LOCATION`, no `FOREGROUND_SERVICE` and no `FOREGROUND_SERVICE_LOCATION`.
Adopting this surface would add a foreground-service permission pair and the Play Store's
foreground-service declaration review, which is ask-first ground.

### 1.10 Providers

`LocationProvider.Gms()`, `LocationProvider.Android()` and `LocationProvider.Fallback(providers)`
with the Android-only `setLocationProvider` and `getSelectedLocationProviderName`
(`js/LocationProvider.ts:13-64`). The default chain is `Fallback: GMS -> Android`, so an app that
never touches this keeps Google Play services first and the framework second. This is a position
concern only; the compass's Android reader is the app's own module
(`modules/qiblaheading`), which talks to the Fused Orientation Provider directly and is unaffected
by which position provider serves fixes.

### 1.11 What the published documentation says

`https://docs.expo.dev/versions/v58.0.0/sdk/location-next.md`, title `Location (next)`, fetched
with the documentation server's `fetch_url` on 2026-10-16: 1376 lines. It documents the same 15
methods, 4 hooks and 3 classes the source exports. `grep -c compass` on it prints `0`; `grep -n
"heading\|compass"` prints four lines (1080, 1081, 1091, 1092), all of them the `Position` table
and its example, the same course-over-ground field section 1.4 describes. The classic page,
`.../sdk/location.md`, documents `Location.getHeadingAsync` (line 424) and
`Location.watchHeadingAsync` (line 698) - heading stayed with the classic API in the published docs
as it did in the source.

A first read of the same page through a different fetch tool returned a 16 KB rendering with the
methods and types sections missing, which is worth recording: a documentation reader that drops
sections can produce a false "the docs say nothing about heading" claim. The count above comes
from the complete rendering.

### 1.12 The changelog record

`node_modules/expo-location/CHANGELOG.md`, the `/next` entries in the installed range
(anchor `changelog-next.md`):

| Version | Entry | Pull request |
| --- | --- | --- |
| 58.0.10 | Android core: permission getters and requesters, position getter, `enableLocationServices`, the `LocationProvider` interface | #49988 |
| 58.0.10 | Android: the position watchers, and the provider interface extended for them | #49992 |
| 58.0.12 | Android: background permission reporting aligned to the TypeScript API | #51067 |
| 58.0.13 | TypeScript API layer for `expo-location/next` | #49849 |
| 58.0.13 | iOS: `PositionWatchHandle` | #50262 |
| 58.0.13 | iOS: permissions | #49972 |
| 58.0.13 | iOS: `LocationUpdatesHandle` | #50263 |
| 58.0.13 | iOS: `getPosition` | #50198 |
| 58.0.14 | Android: background location tracking, task consumers, `RECEIVE_BOOT_COMPLETED` | #50876 |
| 58.0.14 | iOS: `hasLocationServicesEnabled` | #51326 |
| 58.0.14 | iOS: `ERR_LOCATION_SERVICES_DISABLED_GLOBALLY` from the watchers | #51325 |
| 58.0.14 | iOS: `LocationUpdatesHandle.stop()` a no-op when unregistered | #51325 |
| 58.0.14 | iOS: watchers kept alive in the background | #51325 |
| 58.0.14 | Android: `LocationForegroundService` and its helpers | #49995 |
| 58.0.15 | TSDoc added to the `expo-location/next` API | #51231 |
| 58.0.15 | iOS: `notifyOnEnter` fix, geofencing restart fix (classic surface) | #51444, #51443 |
| 58.0.16 | Android: the foreground service's TypeScript interface, the notification permissions, `LocationUpdatesHandle.status()` | #51320 |

Every entry is position, permissions, services or background. No entry in the whole changelog
names a heading or compass change for `/next`. The next published version, 58.0.17, carries one
Android fix in the background task consumer and no `/next` surface change, measured against the
registry and the tarball's own changelog on 2026-10-16.

## 2. The load-bearing question: does `/next` carry a heading watcher?

**No.** Section 1.4 gives three independent checks: the JS layer declares none, the only heading in
the source tree is a position field whose own documentation says it is unrelated to the device's
orientation, and the native tree carries no heading stream. Section 1.11 finds the same in the
published docs and section 1.12 the same in the changelog.

Consequences, stated plainly:

- **The local patch does not re-file.** `patches/expo-location+58.0.16.patch` carries six hunks in
  three files and all six stay where they are: four in the classic `LocationModule.kt` (the sensor
  rates and the emission gate, anchors `patch-android-gate.md`; the import at hunk line 5, the
  rates at 13 and 28, the gate and its constant at 28 and 42), one in
  `expo-module.config.json` (the publication-block removal that keeps the package compiled from
  source), and one in the classic `ios/Providers/DeviceHeadingStreamer.swift` (the
  `kCLHeadingFilterNone`, anchor `patch-ios-filter.md`). Nothing in `/next` touches a heading
  reader, so there is no new API for these hunks to move to.
- **The upstream PR does not re-file.** `expo/expo#51291`, "[location] Add `headingFilter` option and raw
  `headingAccuracy` to `watchHeadingAsync`", patches the classic `watchHeadingAsync` and nothing
  else. Measured on 2026-10-16 through the GitHub API: state `open`, not a draft, not merged,
  created 2026-10-09T04:32:06Z, last updated 2026-10-09T11:43:19Z, one comment, and that comment
  is an automated CodeMention subscription (`github-actions[bot]`). No human review has landed.
  `/next` offers no heading surface for this PR to be refiled against. `ai/UPSTREAM-PRS.md:13, 25-28`
  keeps its record unchanged (anchor `upstream-location-pr.md`).
- **The compass's API stays the classic one**, which is what the settled ground already assumes.
  Rows 40, 49, 52 and 53 built the heading path on the classic stream plus the two native readers
  in `modules/qiblaheading`; the owner's lock (`ai/AGENTS.md:93-95`, anchor `agents-qibla-lock.md`)
  is written against that path and is untouched by anything in `/next`.

## 3. What the app's location and heading usage maps onto

The whole location surface is one file. `git grep -n "^import .*expo-location" -- '*.ts' '*.tsx'` prints
exactly two lines:

```
device/__tests__/qibla.test.ts:5:import * as Location from 'expo-location';
device/qibla.ts:1:import * as Location from 'expo-location';
```

The wider `git grep -n "expo-location" -- '*.ts' '*.tsx'` prints 13 lines: those two imports, a
docblock mention (`modules/qiblaheading/index.ts:4`), the suite's mock and title lines
(`device/__tests__/qibla.test.ts:2, 17`) and eight path strings in the patch guard
(`shared/__tests__/expoLocationPatch.test.ts:2, 11, 51, 55, 59, 87, 151, 156`). One production file
imports the package, and one suite mocks it. `device/qibla.ts` is 92 lines and makes six classic
calls:

| Line | Classic call | What it is for | `/next` equivalent |
| --- | --- | --- | --- |
| `qibla.ts:20` | `Location.getForegroundPermissionsAsync()` | reads before asking, so the sheet never re-prompts | `getForegroundPermissions()` |
| `qibla.ts:24` | `Location.requestForegroundPermissionsAsync()` | one prompt carrying both the position and the heading | `requestForegroundPermissions({accuracy})` |
| `qibla.ts:54` | `Location.getLastKnownPositionAsync()` | the instant cached fix the compass draws on | `getPosition({maxCachedAge, timeout: 0})` |
| `qibla.ts:55` | `Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Lowest})` | the coarsest fix, because 3 km moves the qibla under 0.15 degrees | `getPosition({profile: LocationProfile.LOW_POWER})` |
| `qibla.ts:69` | `Location.reverseGeocodeAsync(position)` | the place name at the sheet's foot | **none** |
| `qibla.ts:89` | `Location.watchHeadingAsync(({trueHeading}) => ...)` | the compass's heading stream | **none** |

`Location.Accuracy.Lowest` is `LocationAccuracy.Lowest = 1`, documented as "Accurate to the nearest
three kilometers" (`src/Location.types.ts:7-11`, re-exported as `Accuracy` at `src/index.ts:11`),
and `/next`'s `LOW_POWER` profile is "kilometer accuracy with a 3 km distance filter, on every iOS
version" (`types/Position.types.ts:52-61`). The two state the same tolerance.

The rest of the heading path, none of it `/next`'s:

- `hooks/useQibla.ts:245-266` (anchor `qibla-sheet-branch.md`) branches on `hasFusedHeading()`:
  a phone with Google's Fused Orientation Provider reads `watchFusedHeading` and never starts the
  classic watch; every other phone reads `watchHeading` (the classic stream) and
  `watchHeadingAccuracy` in parallel.
- `modules/qiblaheading/index.ts:1-9` (anchor `qiblaheading-index.md`) is the app's own native
  module: the Android side is the Fused Orientation Provider with the heading and the attitude
  quaternion, the iOS side is `CLLocationManager` with `kCLHeadingFilterNone` and the raw
  negative-bearing accuracy sentinel.
- The gates: `shared/qiblaWaveGate.ts` (the forced wave on the fused reader) and
  `shared/qiblaSettle.ts:32-39` (anchor `settle-gate.md`, the reported-uncertainty gate at 15
  degrees, negative excluded).

## 4. The migration cost against the settled heading ground

The ground, quoted: `ai/AGENTS.md:93-95` - "Qibla is locked. Never draw a heading the phone has not
vouched for. Android draws only Google's fused sensor behind a forced wave, iPhone inside its
reported accuracy cone. No invented constant, no tuned offset, no per-location calibration, ever."

What `/next` would and would not touch:

1. **It touches no heading code at all** (section 1.4), so the lock cannot be violated by an
   adoption and cannot be satisfied by one either. The compass keeps the classic stream, the two
   native readers and both gates.
2. **There is no dependency to remove and no build weight to save.** Both native modules are
   compiled today (section 1.1). Adopting `/next` changes JavaScript only.
3. **The classic import survives regardless.** `reverseGeocodeAsync` (the place label, a
   user-visible surface) and `watchHeadingAsync` (the compass) have no `/next` equivalent, so an
   adoption is partial by construction: two subpackages of one dependency, two permission response
   shapes, two position shapes in one file.
4. **Every capability `/next` would add has a classic equivalent already in the package.**
   `Location.hasServicesEnabledAsync()` (`src/Location.ts:344-346`) reads the device switch;
   `ios.accuracy` (`src/Location.types.ts:485-496`) reports a reduced grant; the classic reader
   already accepts the coarse fix. The genuinely new items are the temporary-full-accuracy prompt
   (whose plist purpose key this build already carries, section 1.6) and the in-app services
   prompt, and neither is a compass concern.
5. **Adoption costs a native rebuild and a fresh device proof** for behaviour that is already proven
   on the 3T and the XS, against a surface whose published docs and code moved across five patch
   releases (58.0.10 to 58.0.16) in one week.
6. **The one place `/next` changes user-facing behaviour is the permission flow** (the optional
   temporary-full-accuracy prompt). A permission prompt is a behaviour change the owner has not
   ruled on, and the row's own constraint says it ends with her ruling before any code; the qibla
   needs no precise fix either: 3 km of error moves the
   bearing under 0.15 degrees, which is why the classic path asks for `Lowest`.

## 5. Options and the recommendation

### Question 1: should the app adopt `expo-location/next` for its position and permission half?

- **Option A: adopt `/next` for position and permissions, keep the classic import for the
  geocoded place name and the heading.** One cleaner permission call, an explicit reduced-accuracy
  lift, and a stated coarse-fix profile.
- **Option B (recommended): adopt nothing. Keep the whole location path on the classic API, and
  re-open the question when a need appears that only `/next` serves.**
- **Option C: adopt `/next` wholesale and drop the classic import.** Rejected outright: it would
  delete the compass (`watchHeadingAsync`) and the place label (`reverseGeocodeAsync`), neither of
  which `/next` offers.

Why B: option A's gains are all reachable classically today (section 4 item 4), so the change
buys a cleaner file at the price of two APIs for one feature, a native rebuild, a fresh proof on
both platforms, and a permission-flow change in a surface the owner has ruled on. The ticket's own
subject - the compass - does not move either way.

Argued twice. **The challenge:** the app's location file is genuinely awkward - a two-call dance
for one fix, a nested permission response, and no way to tell a device switch from a refusal - and
`/next` exists precisely to fix that shape; the package is Expo's own and will only get better.
**The answer that survives the challenge:** awkwardness is not a defect the app suffers from. The
file is 92 lines with a suite over it, the sheet reports the states it needs, and the missing
device-switch state has a classic one-line reader (`hasServicesEnabledAsync`). Against that, the
adoption's real costs are a native rebuild and a permission-prompt change, and its benefit on the
compass - the ticket's subject - is exactly zero. If her ruling is different, the adoption is a
small, well-bounded job: one file, one suite, one prebuild, the compass untouched by construction.
**Flip-check on the strongest rival (A):** if the compass had moved to `/next`, A would become the
clear answer - two APIs would be unavoidable and the migration would be forced. The measurement in
section 2 is what makes it unnecessary rather than merely optional.

### Question 2: what does the compass do?

**Recommendation: nothing moves.** The patch and the PR keep their ground (section 2). Any future
change to the compass arrives through `watchHeadingAsync` and `modules/qiblaheading`, which is
where the two native readers already live.

Heavy compass testing, the shape any adoption must pass (her named requirement; device work waits
on her ruling and on the phones, rows 40/49/53's discipline):

| # | Reading | Device | What it proves | Waits on |
| --- | --- | --- | --- | --- |
| C1 | The classic stream's rate and the 2-degree gate's absence under an adopted build | 3T | the patch's Android hunks still govern the classic reader when `/next` is imported beside it | her ruling, a free build lock |
| C2 | The heading stream's behaviour of a stationary phone | XS | `kCLHeadingFilterNone` still delivers where the default filter delivered nothing (731 of 731 discarded, row 51) | the owner unlocking the XS |
| C3 | `Position.heading` from a `/next` watcher while stationary | 3T | course over ground is nil/meaningless, which is why it cannot be the compass | her ruling, a free build lock |
| C4 | The wave gate and the certainty gate unchanged on both readers | 3T, XS | the fused reader and the accuracy cone still decide whether the dial draws | C1, C2 |
| C5 | A reduced-accuracy grant's effect on the sheet | XS | the qibla bearing is unaffected at 3 km of positional error, and the place label degrades alone | C2 |

A device reading is the only proof: no source claim about a heading replaces one (row 53's
discipline, `ai/AGENTS.md:157-160`). No Maestro flow and no device atlas touches the qibla sheet
today (`grep -rli "qibla\|compass" e2e/` prints nothing; the seven flows are language-switch,
overlay, sheets, smoke, sounds, swipes and toggles), so any live phase drives the sheet with
`agent-device` and writes the coordinates it needs into `e2e/device-atlas-3t.md` and
`e2e/device-atlas-iphone-xs.md` first.

The patch that governs those readings is verified as shipped in the lane worktree:
`bash scripts/verify-expo-location-patch.sh` prints `SENSOR_DELAY_GAME: 2, expected 2`,
`DEGREE_DELTA: absent, expected absent`, `kCLHeadingFilterNone: 1, expected 1`, `publication
block: absent, expected absent`, `local-maven-repo: absent, expected absent` and `PATCH AS
SHIPPED` (exit 0), and the installed Kotlin carries `SensorManager.SENSOR_DELAY_GAME` twice
(`LocationModule.kt:636, 641`) with `TIME_DELTA = 50f` (`:1094`) and no `DEGREE_DELTA`.

### Question 3: does anything else in the ticket move?

Nothing. No repo file changes, no dependency changes, no permission added, no patch or PR touched.

## 6. Experiments and the unverified list

Experiments a live phase would settle, each with its waiting condition: E1 the classic heading
stream under an adopted build (the build lock and her ruling); E2 `Position.heading` on a
stationary phone (E1); E3 the temporary-full-accuracy prompt under a reduced grant (the XS
unlocked); E4 the services-off experience on the 3T with the classic reader and with `/next`'s
(E1); E5 the coarse-fix equivalence at the 3 km tolerance on both platforms (E1).

Unverified, each with the step that would settle it:

- U1 whether Android's GMS provider ever reports a bearing on a stationary phone (E2).
- U2 whether `enableLocationServices` shows an in-app dialog or opens Settings on the 3T with Play
  services present (E4).
- U3 the temporary-full-accuracy prompt's exact presentation under a reduced grant (E3).
- U4 whether `getPosition({timeout: 0})` returns the same cached fix `getLastKnownPositionAsync`
  returns, on both platforms (E5).
- U5 how `/next` reports a coarse-only Android grant (`locationAccuracy` `reduced`) on a position
  request, and whether it throws or answers (E5).
- U6 the exact native deltas of an adopted prebuild (the plist purpose key is already present and
  the manifest needs nothing for a foreground-only reader, both measured, but no adopted build has
  been produced to confirm them).

## 7. What changes under the recommendation

Nothing in code, config, dependencies or docs outside this plan folder. The row records the
answer: `/next` is a position, permission, service and background surface at the installed
version; it carries no heading watcher; the compass's patch and the upstream PR stay filed against
the classic API; adoption is unnecessary for the app's use and would cost a partial migration, a
native rebuild and a permission-flow change for no compass benefit.

## 8. Re-verification pass after a re-pin

If `yarn.lock` moves `expo-location` off 58.0.16 while this row runs, re-run these before recording
anything:

```
python3 -c "import json;print(json.load(open('node_modules/expo-location/package.json'))['version'])"
grep -rn "heading\|Heading" node_modules/expo-location/src/next/js | wc -l
grep -rn "heading\|Heading" node_modules/expo-location/src/next | wc -l
grep -rn "heading\|Heading" node_modules/expo-location/android/src/main/java/expo/modules/location/next node_modules/expo-location/ios/next | wc -l
sed -n '1,15p' node_modules/expo-location/src/next/Location.ts
head -30 node_modules/expo-location/CHANGELOG.md
```

Expected: the same version or the new one; `0`, `5` and `13` for the three greps unless the new
release added a heading surface (in which case section 2 is rewritten before the row is set);
the same 15-method export list; a changelog whose `/next` entries still name no heading. Then
re-run `bash ai/plans/121-expo-location-next/scripts/build-anchors.sh` and
`bash ai/plans/121-expo-location-next/scripts/preflight-121.sh` from the worktree root, because
the anchor excerpts come from the installed tree.
