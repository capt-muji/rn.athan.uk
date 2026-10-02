# Step 1: the module and its consumer, in one commit (specified)

This step is **specified**, not dictated: the contracts below are the plan's, the code that satisfies
them is the executor's, except where a block is marked **verbatim**.

**One commit, measured.** `python3 scripts/find-unused-exports.py` scans `modules/`
(`scripts/find-unused-exports.py:25`) and reports an export the moment no production file imports it.
This session confirmed it: a throwaway export in `modules/qiblaheading/index.ts` reported
`modules/qiblaheading/index.ts: probeGate` while nothing imported it. So the module and its consumer
land together or `uat-2` goes red.

## 0. Anchor check

```bash
bash $TMPDIR/preflight-49.sh 1
```

Expect `PREFLIGHT OK`. Any anchor count other than 1 is NEEDS REPLAN.

## 1. Branch

```bash
git status --porcelain
git checkout -b feat/49-1-native-heading uat-2
```

`git status --porcelain` may list only `ai/plans/README.md` and this plan folder. Anything else: STOP.

## 2. No tests in this step

The owner deferred them: 🐋  "maybe we should save the testing for later." `modules/` is in
`UNMEASURED` (`scripts/check-changed-coverage.js:40`) and outside `collectCoverageFrom`
(`jest.config.js:110-122`), so nothing in the native module is measurable by Jest.

**The four files outside `modules/` ARE measured, and the existing suites cover them**, so no
coverage gap opens. Verify that claim with the acceptance commands in part 6 rather than assuming it:
if `shared/__tests__/flags.test.ts` or the Qibla suites fail, that is work still to do, not a finding.

## 3. The contracts

### 3.1 `modules/qiblaheading/expo-module.config.json`

**Verbatim:**

```json
{
  "platforms": ["apple", "android"],
  "apple": {
    "modules": ["QiblaHeadingModule"]
  },
  "android": {
    "modules": ["expo.modules.qiblaheading.QiblaHeadingModule"]
  }
}
```

### 3.2 `modules/qiblaheading/android/build.gradle`

**Verbatim.** The `play-services-location` line is the entire FOP unblock: Gradle resolves a version
conflict to the highest request, so this lifts `expo-location`'s own `21.0.1` as well
(`MEASURED.md` section 1).

```gradle
apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'

group = 'expo.modules.qiblaheading'
version = '0.1.0'

android {
    namespace "expo.modules.qiblaheading"

    compileSdk 37

    defaultConfig {
        minSdk 24
    }

    lint {
        abortOnError false
    }
}

dependencies {
    implementation project(':expo-modules-core')
    // Gradle resolves a conflict to the highest request, so this lifts expo-location's own 21.0.1
    // for the whole app: the Fused Orientation Provider first ships in 21.2.0.
    implementation 'com.google.android.gms:play-services-location:21.4.0'
}
```

### 3.3 `modules/qiblaheading/android/src/main/AndroidManifest.xml`

**Verbatim**, matching `modules/widgetrefresh`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android" />
```

### 3.4 `QiblaHeadingModule.kt`

Package `expo.modules.qiblaheading`. Module name **`ExpoQiblaHeading`**. One event,
**`onFusedOrientation`**.

| Member | Signature | What it answers | What it must never do |
| --- | --- | --- | --- |
| `Name` | `"ExpoQiblaHeading"` | The JS lookup name | Differ from `index.ts`'s string |
| `Events` | `"onFusedOrientation"` | The one event name | Emit any other event |
| `Function("isFusedOrientationAvailable")` | `() -> Boolean` | Whether FOP can be used on this device at all | Throw. A device without a gyroscope, or without Play services, answers `false` |
| `AsyncFunction("startFusedOrientation")` | `() -> Boolean` | Registers for FOP updates; `true` when registration succeeded | Register twice without stopping. Request any permission |
| `AsyncFunction("stopFusedOrientation")` | `() -> Unit` | Removes the listener | Leave a listener registered. Throw when nothing was started |

**`isFusedOrientationAvailable` must test three things**, because Google requires all three and a
missing one yields silence rather than an error: Play services availability via
`GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS`,
and the presence of `Sensor.TYPE_GYROSCOPE` and `Sensor.TYPE_MAGNETIC_FIELD` from `SensorManager`.
The accelerometer is implied by every Android device that has the other two; test it too if it costs
one line.

**The request** uses `DeviceOrientationRequest.Builder(DeviceOrientationRequest.OUTPUT_PERIOD_DEFAULT).build()`,
on Google's own recommendation. No other period.

**The executor** is a single-thread executor, as Google's own sample uses. It is created once and
reused, and the listener instance is held so `removeOrientationUpdates` can be passed the same one:
passing a different instance removes nothing.

**The event payload**, exactly these keys and types:

| Key | Type | Source | Rule |
| --- | --- | --- | --- |
| `headingDegrees` | `Float` | `DeviceOrientation.getHeadingDegrees()` | Passed through untouched. No declination, no axis term, no normalisation of our own |
| `headingErrorDegrees` | `Float?` | `getConservativeHeadingErrorDegrees()` | **Only when `hasConservativeHeadingErrorDegrees()` is true.** Otherwise `null` |

The optional read is not a nicety: `MEASURED.md` section 2 found `hasConservativeHeadingErrorDegrees()`
in the bytecode, so the cone is optional per sample and an unconditional read publishes a default
dressed as an accuracy.

**A comment is required on the `headingDegrees` pass-through**, explaining WHY nothing is added to it:
FOP applies declination itself and reports geographic north when a fix is known, magnetic north when
it is not, so any term of ours would double-count. One line, why only.

### 3.5 `QiblaHeadingModule.swift`

Module name **`ExpoQiblaHeading`**, the same string. One event, **`onHeadingAccuracy`**.

| Member | Signature | What it answers | What it must never do |
| --- | --- | --- | --- |
| `Name` | `"ExpoQiblaHeading"` | The JS lookup name | Differ from the Kotlin one |
| `Events` | `"onHeadingAccuracy"` | The one event name | Emit any other event |
| `Function("isHeadingAccuracyAvailable")` | `() -> Bool` | `CLLocationManager.headingAvailable()` | Throw |
| `AsyncFunction("startHeadingAccuracy")` | `() -> Bool` | Starts a heading watch whose readings carry the accuracy in DEGREES; `true` when started | Request a permission. Show any UI. Set `headingFilter` to anything but `kCLHeadingFilterNone` |
| `AsyncFunction("stopHeadingAccuracy")` | `() -> Unit` | Stops that watch | Leave the manager updating |

**The accuracy is passed in DEGREES, unbucketed. That is the entire point of the iOS half**
(`MEASURED.md` section 4).

**The event payload:**

| Key | Type | Source | Rule |
| --- | --- | --- | --- |
| `trueHeading` | `Double` | `CLHeading.trueHeading` | Untouched |
| `magneticHeading` | `Double` | `CLHeading.magneticHeading` | Untouched |
| `accuracyDegrees` | `Double` | `CLHeading.headingAccuracy` | **Untouched, including when negative.** A negative value is Apple's "this reading is invalid" and must reach JS as a negative number |
| `wantsCalibration` | `Bool` | Whether iOS asked to show the calibration HUD | See below |

**`wantsCalibration` is the signal without the HUD** (decision 2.5). Implement
`locationManagerShouldDisplayHeadingCalibration` and **return `false`**, recording that iOS asked.
Returning `false` is what keeps Apple's HUD off the owner's settled screen while still reading the
signal. A comment must say WHY it returns false: the app owns its visuals and a system HUD can appear
over the sheet at a moment the app does not choose.

`headingFilter = kCLHeadingFilterNone` matches what session 48 already patched into `expo-location`
and proved on the XS; without it a stationary phone's readings are rejected and the diagnostic shows
nothing.

### 3.6 `modules/qiblaheading/ios/QiblaHeading.podspec`

**Verbatim.** Proven to install during planning (`MEASURED.md` section 5).

```ruby
Pod::Spec.new do |s|
  s.name           = 'QiblaHeading'
  s.version        = '0.1.0'
  s.summary        = 'The heading with its uncertainty in degrees'
  s.description    = 'Reads CLHeading.headingAccuracy in degrees, which expo-location buckets away.'
  s.author         = ''
  s.homepage       = 'https://athan.uk'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
```

### 3.7 `modules/qiblaheading/index.ts`

The JS surface. It follows `modules/widgetrefresh/index.ts`'s pattern exactly: `requireOptionalNativeModule`,
cached, so a build without the module is a silent no-op and no caller needs a `Platform` branch.

| Export | Signature | What it answers | What it must never do |
| --- | --- | --- | --- |
| `QiblaDiagnostic` | `type` | The shape a subscriber receives | Carry a field no platform supplies |
| `watchQiblaDiagnostic` | `(onReading: (reading: QiblaDiagnostic) => void) => () => void` | Starts whichever diagnostic this platform has and returns the function that stops it | Throw on a platform or build that has neither. Arm anything when the module is absent |

`QiblaDiagnostic` carries every field optional, because the two platforms supply different ones:

```ts
export type QiblaDiagnostic = {
  /** iOS: CLHeading.headingAccuracy in degrees. Negative means Apple considers the reading invalid */
  accuracyDegrees?: number;
  /** iOS: whether the system asked to show its calibration HUD */
  wantsCalibration?: boolean;
  /** Android: the Fused Orientation Provider heading, the value Google states Maps draws */
  fusedHeadingDegrees?: number;
  /** Android: FOP's own error cone, absent on a sample that does not carry one */
  fusedErrorDegrees?: number | null;
};
```

`watchQiblaDiagnostic` returns a **synchronous** unsubscribe even though the native starts are async,
because the sheet's cleanup runs synchronously and the race session 45 found (a watch resolving after
the sheet closed) must be impossible here too: the returned function sets a flag AND stops whatever
started, in either order of completion.

**How it subscribes, verified at the pinned version rather than assumed.** A native module returned by
`requireOptionalNativeModule` already IS an event emitter:
`expo-modules-core@58.0.7`'s `NativeModule` declaration reads
`export declare class NativeModule<...> extends EventEmitter<...>`, and `EventEmitter.addListener`
returns an `EventSubscription` carrying `remove(): void`. So the sequence is:

1. `addListener` on the platform's event name, keeping the returned subscription;
2. `await` the platform's `start*` function;
3. in the unsubscribe: `remove()` the subscription and call the platform's `stop*`.

**Which platform's names to use is decided by what the module exposes, never by `Platform.OS`.** Test
for the function: if `isFusedOrientationAvailable` is present, use the Android trio; if
`isHeadingAccuracyAvailable` is present, use the iOS trio. That keeps the one `Platform`-free rule the
qibla path has held since session 47, and it also handles a build where the native side is missing
entirely.

The whole file must be reachable with the module absent, which is every Jest run.

### 3.8 `shared/flags.ts`, and the prod guard this repo already requires

One flag, following the file's own pattern and the single-reader rule.

| Flag key | Env var | Resolves true when | JSDoc must say |
| --- | --- | --- | --- |
| `qiblaDiagnostic` | `EXPO_PUBLIC_QIBLA_DIAGNOSTIC` | `=== '1'` **AND** `process.env.EXPO_PUBLIC_ENV !== 'prod'` | That it shows the platform's own heading uncertainty on the qibla sheet, that it is a diagnostic rather than a feature, and that it is deleted once the owner has the measurements he needs |

**The second operand is mandatory, and it is this repo's own rule rather than a choice.**
`shared/flags.ts`'s own header states it: the four behaviour gates that spell a variable of their own
"also require `EXPO_PUBLIC_ENV !== 'prod'`, so a variable left set cannot reach a release build;
anything added here or there must hold to the same rule." Verified in all three:
`shared/perf.ts:34`, `device/backgroundTaskDebug.ts:32` and `shared/time.ts:315` each AND the
variable with `EXPO_PUBLIC_ENV !== 'prod'`. Both operands are literals, so Metro folds the branch away
in a store build.

**This changes how step 2 builds the diagnostic**, and step 2 says so: a `prod` build can never show
the readout, by design, so the measurement runs on a `preview` build. That is better than the
alternative, because it makes it impossible to ship a diagnostic readout to a user by forgetting a
variable.

Only the exact string `1` enables it, which matches every other flag in the file.

### 3.9 `.env.example`

One documented line, `EXPO_PUBLIC_QIBLA_DIAGNOSTIC=0`, under the existing `# Feature flags` comment
block, in the file's existing style.

**Do not add it to `shared/__tests__/flagDefaults.test.ts`'s pinned list.** That suite pins the two
widget variables at `1` because the owner ruled they never ship off. This flag's shipped value is `0`,
which is the opposite rule, and the file's existing `it.each` table is the only place that would need
changing. Leave it alone.

### 3.10 `hooks/useQibla.ts`

**The smallest possible change.** Everything about the drawn compass stays exactly as it is: the same
`watchHeading`, the same settling gate, the same haptic, the same shared values.

| What | Contract |
| --- | --- |
| New state | A `diagnostic` field on `QiblaState`, typed `QiblaDiagnostic | null`, `null` until a reading arrives |
| When it arms | Inside `start`, only when `FEATURE_FLAGS.qiblaDiagnostic` is true, and only AFTER the permission check passes |
| When it stops | In `stop`, unconditionally, alongside the existing `unwatchRef` teardown |
| What it must never do | Feed `heading`, `aligned`, the settling window or the haptic. Change the order of anything in `processReading`. Arm anything with the flag off |

The flag read must be the only new branch in the hook. A diagnostic reading writes state and nothing
else.

### 3.11 `components/sheets/screens/Qibla.tsx`

| What | Contract |
| --- | --- |
| When it renders | Only when `FEATURE_FLAGS.qiblaDiagnostic` is true. **With the flag on it renders from the first frame, before any reading arrives**, showing a placeholder for each field it will carry |
| Where | Below the existing place line, as its sibling, so the dial's geometry and the place line's own layout are untouched |
| What it shows | Each field the reading carries, labelled, one per line, numbers to one decimal place. A field with no value yet shows a dash |
| What it must never do | Change any existing style, colour, size or spacing. Shift the dial. Render anything with the flag off |

**Why it renders before the first reading, which is not obvious and is a real trap.** The place line
above it carries the comment "Never conditional: the sheet sizes itself from its content, so a line
that comes and goes resizes it", and the sheet runs `enableDynamicSizing` with `contentCap={0.85}`.
A readout that appeared when the first reading arrived would resize the sheet under the user mid-read,
which is the defect session 47 already fixed once in this same component. The flag is build-time
static, so rendering unconditionally under it costs nothing and keeps the sheet one size.

**The owner's visuals are settled.** With the flag off this component tree must be identical to
1.29.208's, which is what the invariant in `PLAN.md` section 3 asserts.

Use the file's existing text styles. Do not invent a colour: reuse what the waiting message already
uses.

## 4. Build it

Nothing here needs a device yet. Confirm the module compiles on both platforms before committing,
because a native module that fails to build is caught by nothing in the JS gates:

```bash
cd /Users/muji/repos/rn.athan.uk/android && ./gradlew :qiblaheading:assembleRelease
```

Expect `BUILD SUCCESSFUL`. Then:

```bash
cd /Users/muji/repos/rn.athan.uk/ios && pod install
```

Expect a line `Installing QiblaHeading (0.1.0)`. Then:

```bash
cd /Users/muji/repos/rn.athan.uk/ios && xcodebuild -project Pods/Pods.xcodeproj -scheme QiblaHeading -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build
```

Expect `** BUILD SUCCEEDED **`. All three were run during planning against a scratch copy of this
module and all three passed, so a failure here is a difference between the plan's contract and the
code written, not a surprise about the toolchain.

**`android/` and `ios/` are gitignored prebuild output**, so none of this is committed.

## 5. Acceptance criteria

Every one is checkable by the executor itself.

| Check | Command | Expected |
| --- | --- | --- |
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Lint and format | `npx biome check . --error-on-warnings` | exit 0 |
| No unreachable export | `python3 scripts/find-unused-exports.py` | `NEVER reachable from production code: 5`, the pre-existing entries only |
| The flag suite | `npx jest shared/__tests__/flags.test.ts --watchman=false --selectProjects=unit` | all pass |
| The device wrapper suite | `npx jest device/__tests__/qibla.test.ts --watchman=false --selectProjects=unit` | all pass |
| The sheet suite | `npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components` | all pass |
| The widget nested-copy trap | `npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit` | all pass |
| Android builds | `cd android && ./gradlew :qiblaheading:assembleRelease` | `BUILD SUCCESSFUL` |
| iOS builds | the `xcodebuild` line in part 4 | `** BUILD SUCCEEDED **` |
| Flag off is invisible | `grep -c "qiblaDiagnostic" components/sheets/screens/Qibla.tsx hooks/useQibla.ts` | at least 1 in each: the flag is READ in both, so neither renders nor arms unconditionally |

**No dependency is installed in this step**, so the nested `@expo/ui` trap cannot fire. The
`widgetRuntimeLoads` check is cheap insurance and is run because `ai/AGENTS.md` records that ANY
install can reintroduce it; if it fails, STOP, because nothing in this step should have touched the
tree.

## 6. Version

```bash
node -e "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;console.log(v.join('.'))"
```

Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). The
gradle file is gitignored and never added, but `shared/__tests__/versionLockstep.test.ts` fails if it
differs.

## 7. Commit

Add by name, and nothing else:

```
modules/qiblaheading/expo-module.config.json
modules/qiblaheading/index.ts
modules/qiblaheading/android/build.gradle
modules/qiblaheading/android/src/main/AndroidManifest.xml
modules/qiblaheading/android/src/main/java/expo/modules/qiblaheading/QiblaHeadingModule.kt
modules/qiblaheading/ios/QiblaHeading.podspec
modules/qiblaheading/ios/QiblaHeadingModule.swift
shared/flags.ts
.env.example
hooks/useQibla.ts
components/sheets/screens/Qibla.tsx
app.json
package.json
ai/plans/README.md
ai/plans/49-qibla-native-heading/PLAN.md
ai/plans/49-qibla-native-heading/LOG.md
```

**Never `git add .`**: `modules/qiblaheading/android/build/` is created by the Gradle check in part 4
and must not be committed.

Commit message, with `<VERSION>` replaced:

```
<VERSION> - feat(qibla): our own native module, so the phone's own uncertainty is readable in degrees

expo-location reads both platforms' sensors faithfully and then discards the one number that says how
much to trust the reading. On iOS it buckets CLHeading.headingAccuracy from degrees into 0 to 3, where
bucket 3 spans 0 to 20 degrees, the whole range the owner reports, and it collapses Apple's "invalid
reading" into the same bucket as "poor reading". On Android it never offers Google's Fused Orientation
Provider, which Google states is the heading Google Maps draws.

modules/qiblaheading exposes both: the accuracy in real degrees on iOS, and FOP beside the platform
heading on Android. The row's stated blocker turned out not to exist: Gradle resolves a version
conflict to the highest request, so a local module declaring play-services-location:21.4.0 lifts
expo-location's own 21.0.1 for the whole app, measured as 21.0.1 -> 21.4.0 in Gradle's own report. No
patch to expo-location, and no new permission on either platform.

The module ADDS a reading and replaces nothing. Google's own announcement says FOP "returns values
piped through from the AOSP Rotation Vector" in certain cases, and that is the sensor session 47
shipped, measured 5 to 34 degrees wrong outdoors, and reverted, so FOP is measured against the
platform value on the owner's phone before anything is swapped.

Behind EXPO_PUBLIC_QIBLA_DIAGNOSTIC, default off, so the compass the owner accepted at 1.29.205 is
unchanged. The readout is on screen rather than logged because Pino is disabled on production builds,
which is the only build he tests. No tests this session, on his deferral: modules/ is already outside
the coverage measure.
```

## 8. Review checklist

Read `git show <sha>` back cold, as a stranger. Confirm every line:

- [ ] Both module names are the exact string `ExpoQiblaHeading`, Kotlin and Swift
- [ ] `headingDegrees` and `trueHeading` are passed through with no term added anywhere
- [ ] `getConservativeHeadingErrorDegrees()` is read ONLY behind `hasConservativeHeadingErrorDegrees()`
- [ ] A negative `accuracyDegrees` reaches JS as a negative number, unclamped
- [ ] `locationManagerShouldDisplayHeadingCalibration` returns `false`, with a why-comment
- [ ] No permission is requested anywhere in the module
- [ ] `stop` tears down every watch the module started, FOP included
- [ ] `watchQiblaDiagnostic`'s unsubscribe is safe when the native start resolves after it was called
- [ ] With the flag off, nothing arms and nothing renders: both files READ the flag
- [ ] No existing style, colour, size, spacing or text changed
- [ ] `processReading`'s order is byte-for-byte unchanged, and the gate still sits above the haptic
- [ ] The diagnostic never feeds `heading`, `aligned`, the settling window or the haptic
- [ ] No `Platform` check in app code
- [ ] Every comment explains why, never what, and none is a paragraph
- [ ] No `modules/qiblaheading/android/build/` path is in the commit
- [ ] Nothing beyond this step's 15 files changed

## 9. Merge

```bash
git checkout uat-2 && git merge --no-ff feat/49-1-native-heading -m "Merge feat/49-1-native-heading into uat-2: session 49 step 1, reviewed"
```

## 10. Done when

Every part 5 check passes, the review is clean, the merge is in, and `LOG.md` records the commit sha,
the version, the review verdict and the three build outcomes.
