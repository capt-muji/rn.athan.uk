# Execution log: Session 49

## Planning, 2026-10-02

Planned in one session, with every make-or-break risk spiked in the working tree and thrown away
before the plan was written. What the spike taught is in `MEASURED.md`; what was read from the vendors
is in `FINDINGS.md`.

### What the spike built, proved and deleted

A complete throwaway `modules/qiblaheading` with both platform halves, to answer three questions the
plan could not answer by reading:

| Question | Answer | Evidence |
| --- | --- | --- |
| Does `expo-location`'s `21.0.1` pin block FOP? | **No.** Gradle takes the highest request | `play-services-location:21.0.1 -> 21.4.0` in `:app:dependencies` |
| Does a local module reach FOP's classes? | Yes | `:qiblaheading:compileReleaseKotlin`, `BUILD SUCCESSFUL in 30s` |
| Does the iOS half integrate without a Podfile edit? | Yes | `Installing QiblaHeading (0.1.0)`, then `** BUILD SUCCEEDED **` |

All of it was removed (`rm -rf modules/qiblaheading`, then `pod install` printed
`Removing QiblaHeading`), so the tree carried only the plan folder at commit time.

### The planning worktree

`~/athan-device-sweep/worktrees/plan-49` was created with `node_modules` symlinked, and in the end was
not needed: every spike ran in the main checkout because the Gradle and CocoaPods state being measured
lives in the gitignored `android/` and `ios/` folders, which a worktree does not carry. Removed at the
end of the session with its branch, per `ai/AGENTS.md` section 7.

### Defects found in this session's own plan, before the executor could meet them

Eight, listed in `PLAN.md` section 5. Three came from the design review and five from the cold read.
The two that would have stopped the executor on its first commands:

- the pre-flight's own anchor counted 2, not 1, and would have sent a healthy tree to NEEDS REPLAN.
  **Found only by running the script**, which is this programme's recurring lesson about break scripts
  applied to a pre-flight;
- a direct `npx expo prebuild` omits the two widget variables that `app.config.ts` mirrors, and a
  falsy value strips the `expo-widgets` plugin, so the diagnostic build would have **shipped both
  phones widget-less**. `ai/AGENTS.md` records that exact accident happening once already.

### Verified green before the plan was committed

| Check | Result |
| --- | --- |
| `bash ai/plans/49-qibla-native-heading/scripts/preflight.sh 1` | `PREFLIGHT OK` |
| `bash ai/plans/49-qibla-native-heading/scripts/preflight.sh 2` | correctly FAILS: step 1 not merged |
| The hook's suite | `Tests: 4983 passed, 4983 total` across 185 suites |
| Coverage | 100% statements, branches, functions and lines |

## Step 1: the module and its consumer

| What | Value |
| --- | --- |
| Branch | `feat/49-1-native-heading` |
| Commit | `e7c3b01f`, version 1.29.210 |
| Merge | `fec1bf72` |
| Files | 16, listed in the commit |

### THE PLAN WAS WRONG ABOUT TESTS, and the pre-commit hook caught it

The plan's part 2 said the four files outside `modules/` needed no new tests because the existing
suites cover them. **The hook refused the commit:**

```
Statements   : 99.91% ( 4788/4792 )
Branches     : 99.66% ( 2088/2095 )
Jest: Coverage for branches (99.66%) does not meet "global" threshold (100%)
```

The cause is structural rather than an oversight about any one file: **a suite running with the flag
OFF cannot reach a line the flag gates**, so every gated line is uncovered by construction. Measured
per file with `--coverageReporters=text`:

| File | Uncovered lines | What they are |
| --- | --- | --- |
| `shared/flags.ts` | 71 | the new flag's own branch |
| `hooks/useQibla.ts` | 155 to 156 | the arming block |
| `components/sheets/screens/Qibla.tsx` | 30, 76 to 79 | `oneDecimal` and the readout |

**So the owner's deferral held where the plan's reasoning was right and failed where it was not.**
`modules/` is genuinely outside the measure, so the Kotlin, the Swift and the module's `index.ts` carry
no tests, exactly as he asked. Anything the flag GATES lives in a measured file and had to be covered.

Closed with two suites, both in patterns this repo already uses:

- `shared/__tests__/flags.test.ts`: a `qiblaDiagnostic` describe block shaped like the two beside it,
  plus two the others do not have, pinning that `prod` stays disabled with the variable at `1` and that
  a non-prod build with it set is enabled;
- `components/sheets/screens/__tests__/QiblaDiagnostic.test.tsx`: 7 tests with
  `jest.mock('@/shared/flags', ...)` hoisted above the imports, which is `widgetIo.test.ts`'s own
  opt-in and is required because `flags.ts` reads its environment once at module evaluation.

**Result: 186 suites, 5000 tests, 100% on all four measures.**

### Two defects found by rereading my own code before the commit

1. **A `null` was crossing the bridge.** The first Kotlin wrote `headingErrorDegrees` as `null` when
   FOP attached no cone, and `ai/AGENTS.md` records that KLDI's C++ bridge rejects a JSON null nested
   inside a map. The key is now OMITTED instead, which reads as `undefined` in JS and keeps a null off
   the bridge entirely.
2. **A dead branch in the sheet.** Once the Android payload's optional field became `number | undefined`
   rather than `number | null`, `oneDecimal`'s `value === null` test could never fire. Collapsed to
   `value?.toFixed(1) ?? PENDING`.

### Builds, all three run before committing

| Check | Result |
| --- | --- |
| `./gradlew :qiblaheading:assembleRelease` | `BUILD SUCCESSFUL` |
| `pod install` | `Installing QiblaHeading (0.1.0)` |
| `xcodebuild -scheme QiblaHeading` | `** BUILD SUCCEEDED **` |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check . --error-on-warnings` | exit 0, 382 files |
| `python3 scripts/find-unused-exports.py` | 5, the pre-existing entries only |

### Review, one round, clean

Read `git show e7c3b01f` back cold. Confirmed: no colour, size, spacing, font or text changed;
`processReading` untouched (the diff touches none of its lines); no `Platform` branch in app code (the
only mention is a comment explaining why there is none); no permission requested anywhere in the module,
verified by grep across all six module files; no `android/build/` path in the commit; and both module
names are the exact string `ExpoQiblaHeading`.

## Step 2: the device proof

The Android prebuild carried the two widget variables the plan's defect 8 added, and the guard earned
its place immediately: `grep -cE 'Widget[A-Za-z]*Provider"' android/app/src/main/AndroidManifest.xml`
counts **8**, so the widget extension survived a direct `npx expo prebuild`. Without those variables it
would have been 0, which is the accident `ai/AGENTS.md` records shipping onto both phones once.

`applicationId 'com.mugtaba.athan.fleettest'` and `versionName "1.29.210"` both confirmed before the
build, so the diagnostic installs alongside the owner's real app rather than over it.

### THE ANDROID ANSWER: FOP RUNS ON THE 3T, AND IT AGREES WITH THE PLATFORM HEADING

**It works on a 2016 phone.** `BUILD SUCCESSFUL in 10m 3s`, installed as `com.mugtaba.athan.fleettest`
at 1.29.210, and the readout shows a live `fused heading`.

**The proof that FOP is really running its own fusion, rather than failing silently, is in the sensor
clients.** `dumpsys sensorservice` with the sheet closed, then open:

| Sensor | Closed | Qibla sheet open |
| --- | --- | --- |
| `0x01` accelerometer | absent | `active-count = 2`, periods `{20.0, 10.0}` |
| `0x03` magnetometer (calibrated) | absent | `active-count = 2`, periods `{20.0, 20.0}` |
| **`0x04` magnetometer UNCALIBRATED** | absent | **`active-count = 1`, 20.0 ms** |
| **`0x06` gyroscope UNCALIBRATED** | absent | **`active-count = 1`, 10.0 ms** |

**The last two rows are the finding.** The app's own heading path has never requested an uncalibrated
sensor or a gyroscope of any kind: session 48 measured it registering exactly the calibrated
accelerometer and magnetometer at 20 ms. The uncalibrated pair appears only when FOP is asked for
updates, which is Google's documented fusion estimating the hard-iron bias and the gyro bias for
itself. Both read `status: active` with `connections=1`.

**And FOP agrees with the heading the owner already accepted.** Three frames 4 seconds apart, phone
stationary, measured off the full-resolution screenshots rather than by eye:

| Frame | `fused heading` | The dial's own N bearing |
| --- | --- | --- |
| 1 | 345.4 | 16.4 |
| 2 | 345.5 | 14.5 |
| 3 | 345.7 | 15.4 |

**FOP moved 0.3 degrees across 8 seconds while the dial, drawn from `watchHeadingAsync`, moved 1.9.**
So on this handset FOP is marginally STEADIER and points the same way.

**What that means, and it is the outcome `FINDINGS.md` section 1 predicted in writing:** Google's own
caveat says FOP "returns values piped through from the AOSP Rotation Vector" in certain cases, and
agreement this close is what that looks like. **So FOP buys no accuracy on the 3T and the heading source
must NOT be swapped on this evidence**, which is exactly why the plan made the module add a reading
rather than replace one. Had this row shipped FOP as the new source on the strength of the Maps quote,
it would have changed nothing measurable here while risking session 47's defect again.

The honest limit on this measurement: it is one handset, indoors, at one spot. The S23 is where FOP
could still differ, because that is where `watchHeadingAsync` is known to be good and the Find X8 is
where it was 71 degrees wrong.

### The readout renders before any reading, as the contract requires

Measured on the device before the permission was granted: `accuracy -`, `wants calibration -`,
`fused heading -`, all three present with placeholders and no value. That is what keeps the
dynamically-sized sheet from resizing under the user when the first reading lands.

**`accuracy` and `wants calibration` stay blank on Android**, correctly: they are the iOS half of the
module, and `watchQiblaDiagnostic` chooses its platform by which function the native module exposes
rather than by `Platform.OS`.

### The 3T is back on the shipped build, verified rather than assumed

| Check | Result |
| --- | --- |
| `build-prod.zsh uat-2` | `BUILD-PROD OK`, 612s, `versionName 1.29.210`, real API key, built locally |
| Source sha | `fec1bf72`, the step 1 merge |
| `adb install -r` | `Success` |
| `pm list packages com.mugtaba.athan.fleettest` | prints nothing: the throwaway is gone |
| `dumpsys package com.mugtaba.athan` | `versionName=1.29.210` |
| `settings get global auto_time` | `1` |
| The qibla screen, read from a screenshot | **No diagnostic readout.** Only "Greater London, United Kingdom" below the dial, as 1.29.207 looked. The dial, needle, Kaaba mark and cardinals all draw normally |

That last row is the real check on the prod guard: the same code that printed four labelled numbers
under `EXPO_PUBLIC_ENV=local` prints nothing under `prod`, with no code change between the two builds.

### THE iOS DEFECT THE DEVICE FOUND, which nothing else could have

The first XS build drew the compass correctly and showed **`accuracy -`**: all four lines rendered,
and the iOS one never filled. The compass itself was turning, so `CLHeading` was flowing through
`expo-location` while this module's own stream delivered nothing.

**The cause is a threading rule, not a logic error.** An Expo `AsyncFunction` runs on a background
queue by default, and `CLLocationManager` only delivers delegate callbacks on a thread with an active
run loop. The manager was constructed inside `startHeadingAccuracy`, on that background queue, so it
started cleanly, reported no error, and its delegate was never called. Fixed by appending
`.runOnQueue(.main)` to both `startHeadingAccuracy` and `stopHeadingAccuracy`, which is
`expo-modules-core`'s own API for exactly this (`ios/Core/Functions/AsyncFunctionDefinition.swift:207`,
and the same call its SwiftUI view builder makes).

**Why no gate caught it:** the Swift compiles either way, the module loads, the function returns
`true`, and `modules/` carries no tests by the owner's deferral. A simulator could not have caught it
either, because a simulator has no magnetometer and `CLLocationManager.headingAvailable()` is false
there, which session 47 already proved from CoreLocation's own log. **Only a physical phone with the
sheet open distinguishes "started" from "delivering".** That is the argument for this row's device
step existing at all.

### THE iOS ANSWER, and it is the measurement this whole row existed to take

The owner drove the app to the Qibla sheet on his iPhone XS and the readout filled. Three samples over
about two minutes, phone held still indoors, read from full-resolution screenshots:

| Sample | `accuracy` (degrees) | `wants calibration` |
| --- | --- | --- |
| 09:25 | **25.4** | false |
| 09:26 | **24.8** | false |
| 09:27 | **24.8** | false |

**No build of this app has ever been able to see that number.** `expo-location`'s `normalizeAccuracy`
would have reported all three as bucket 2, which spans 20 to 35 degrees and is indistinguishable from
a 34-degree reading.

**Three things follow, and together they answer the owner's question.**

1. **The phone agrees with him.** He reported errors "sometimes 20 degrees off, sometimes 30", and the
   phone is declaring an uncertainty of about 25 degrees at the same spot. The scatter he sees is not
   mysterious: CoreLocation has been reporting it all along and the library threw it away.
2. **`wants calibration` is FALSE, which retires the shaking.** iOS does not consider itself
   uncalibrated, so the figure-of-eight he has been performing, and which 1.29.207 asks for in words
   and animation, addresses a condition the OS says is not present. **This is session 48's
   `headingAccuracy`-reads-fine-while-wrong case**, and `DECISION.md` named its consequence in advance:
   a local field has been absorbed into the calibration and no software fix exists.
3. **The value is STABLE at about 25 rather than scattering**, which rules out a convergence problem on
   this handset: 0.6 degrees of movement across two minutes is not a sensor still settling. It is a
   steady declaration of steady uncertainty.

**THE CONDITIONS INVALIDATE ANY CLAIM ABOUT THE OWNER'S HOUSE, AND HE IS THE ONE WHO POINTED IT OUT**
(2026-10-02): 🐋  "I did move the mobile phones from the table to the floor because the table is very
magnetic and the laptop is there... if you are connected, that means there's magnets."

**Every reading in this session was taken on a phone tethered by cable, beside a laptop, in a room he
describes as magnetically dirty.** That is close to the worst case, and session 41 measured this exact
effect: the same iPhone wanted a 190 correction beside a laptop and 220 two metres away on open floor,
at one spot, within one session. **So the 25 degrees is a reading of THIS DESK, not of his house and
not of the phone's general behaviour.**

The claim that survives is narrow and is the one worth having: **the module can report iOS's own
uncertainty in degrees, and in a magnetically hostile spot that figure was about 25 while iOS still
said it did not need calibrating.** Whether it falls to 3 outdoors is UNMEASURED and is the whole
question.

**Two things are therefore NOT established and must not be written as if they were:**

- the accuracy was never checked against a known true bearing, so "the phone claims 25 and is wrong by
  25" is untested;
- nothing here characterises the owner's house, let alone any user's, because the instrument was sitting
  in the interference.

**THE METHOD RULE THIS SETS, and it binds every future heading measurement in this programme: a
tethered phone is inside the magnetic field of the thing tethering it, so no heading or accuracy
reading taken over a cable is evidence about anywhere.** The owner's protocol is the correct one and
this row adopts it: he disconnects, leaves the room, records video or screenshots outdoors, and brings
the frames back for frame-by-frame reading. Session 47 already proved the same point from the other
side, when a desk measurement said 5 degrees and a balcony said 34.

### The platform split is visible on the phones, and is correct

The owner observed that the 3T showed nothing below the dial while the XS showed four lines. Both are
right:

- the 3T had already been returned to the **shipped** build, where the prod guard folds the readout
  away entirely. While the diagnostic build was on it, it showed `fused heading 345.4`;
- on the XS, `fused heading` and `fused error` read `-` because FOP is **Android only**, and on the 3T
  `accuracy` and `wants calibration` read `-` because `CLHeading` is **iOS only**.

Each platform fills its own half, chosen by which function the native module exposes rather than by a
`Platform.OS` branch, which is the rule the qibla path has held since session 47.

### Both phones end on the same clean build, which is what the owner asked for

🐋  "please make sure both phones have the latest code so I can test both phones at the same time"

| Phone | Build | Diagnostic | Checked |
| --- | --- | --- | --- |
| OnePlus 3T `8f7ada76` | 1.29.211, production release | off, folded away by the prod guard | `versionName=1.29.211`, `fleettest` package absent, `auto_time` 1, readout confirmed absent by screenshot |
| iPhone XS | 1.29.211, local Release | off | `devicectl` reports 1.29.211 |

Both built from `75e1e17b`, the iOS fix merge. The Android APK is `BUILD-PROD OK`, 767s, real API key,
built locally with Gradle and never on EAS.

### What row 49 does NOT answer, asked by the owner directly

🐋  "Which test will number 49 allow us to do? Is it A, B, C, or D?"

**None of them.** A, B, C and D are row 50's four isolation experiments over the patches that shipped in
1.29.205, and this row ran none of them. The four changes are all still in, verified in the live code:
`SENSOR_DELAY_GAME` on both registrations, the `DEGREE_DELTA` gate removed with `TIME_DELTA` kept,
`headingFilter = kCLHeadingFilterNone`, and the latch at `hooks/useQibla.ts:126`.

**What this row gives row 50 is the INSTRUMENT those experiments were missing.** Before it, A against B
could only be judged by eye, which cannot separate a 5-degree change from a 15-degree one and varies with
where the owner stands. Now each build reports iOS's own uncertainty in degrees, so "which patch was the
hero" becomes a reading rather than an argument.

**The honest limit on that, so row 50 does not over-plan around it:** `headingAccuracy` is iOS only. On
the S23 and the 3T, A and B still have to be judged against Google Maps by eye, because Android's
equivalent number comes from FOP and this session measured FOP to be no better than what already ships
on the 3T.
