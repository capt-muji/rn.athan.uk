# Step 2: the device proof on both phones (specified)

No code changes. This step builds, installs and measures, then writes the records.

**The owner's instruction for this session decides the shape of this step:**

> please make sure both phones have the latest code so I can test both phones at the same time

So both phones end on the SAME new version, and the diagnostic is read on each. That is also the only
way his side-by-side comparison means anything.

**The method caution, from `WHAT-FIXED-IT.md`, and it is load-bearing:** the owner's judgement is the
instrument and his room is the variable, so both phones are read back to back in the same place, never
across days.

## 1. The build the diagnostic needs, and why it is NOT a prod build

The flag resolves true only when `EXPO_PUBLIC_QIBLA_DIAGNOSTIC === '1'` **and**
`EXPO_PUBLIC_ENV !== 'prod'` (step 1, part 3.8: this repo's own rule for every debug gate, so a
variable left set can never reach a store build). **A `prod` build therefore shows no readout, by
construction, and `build-prod.zsh` could not produce one even with the variable set.**

That is the right design and it decides the method here:

| Reading | Build | Why |
| --- | --- | --- |
| The diagnostic | `EXPO_PUBLIC_ENV=local` with the flag at `1` | The gate refuses `prod`, and `local` needs no API key |
| What the phones are LEFT on | the ordinary `prod` build | The compass the owner accepted, with no readout |

**Why `local` and not `preview`, which was this plan's first answer and was wrong.** `app.config.ts`
throws when `EXPO_PUBLIC_ENV` is `prod` or `preview` and no real API key is present
(`app.config.ts:96-106`, read during planning), so a `preview` build without the key fails at prebuild
with `EXPO_PUBLIC_API_KEY is missing`. `local` trips neither that contract nor the diagnostic's prod
guard, and it is what `build-mock.zsh` already uses.

**The cost, stated plainly: a `local` build serves `MOCK_DATA_SIMPLE`** (`api/client.ts:124`), so the
prayer times on screen during the diagnostic run are mock data, not the owner's real timetable. That
does not matter here, because the qibla sheet reads a position and a magnetometer and never touches
prayer data. `ai/AGENTS.md` records the inverse trap, that alarm times only mean anything on a
production build, and it does not apply to a compass.

**Android, the diagnostic build.** `build-prod.zsh` forces `EXPO_PUBLIC_ENV=prod`, which the gate
refuses, so the diagnostic build is made directly rather than through either shared script:

```bash
cd /Users/muji/repos/rn.athan.uk
EXPO_PUBLIC_ENV=local EXPO_PUBLIC_QIBLA_DIAGNOSTIC=1 \
  EXPO_PUBLIC_IOS_WIDGETS=1 EXPO_PUBLIC_ANDROID_WIDGETS=1 \
  EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest \
  npx expo prebuild -p android --no-install
grep -n versionName android/app/build.gradle
```

`versionName` must show step 1's version. The env vars are REQUIRED on prebuild as well as on the
build: without them `android/` regenerates as the plain Play package id and the install ritual breaks
(`ai/AGENTS.md`). The `fleettest` suffix means this build installs ALONGSIDE the owner's real app as
`com.mugtaba.athan.fleettest` rather than over it, which is what protects his data and his accepted
build while the diagnostic is read.

```bash
cd /Users/muji/repos/rn.athan.uk
EXPO_PUBLIC_ENV=local EXPO_PUBLIC_QIBLA_DIAGNOSTIC=1 \
  EXPO_PUBLIC_IOS_WIDGETS=1 EXPO_PUBLIC_ANDROID_WIDGETS=1 \
  EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest \
  npx expo run:android --variant release
```

Run it in the background with its log. Then the usual tail from `ai/AGENTS.md`: kill the CLI at
"Installing", poll `dumpsys package com.mugtaba.athan.fleettest | grep lastUpdateTime` until it
settles, and launch with a DOUBLED `am start`, because the first start after an install lands on the
launcher.

**Never run two builds at once**: `ai/AGENTS.md` records that two build runs share one worktree and
the second deletes the first's intermediates, which reads as a corrupt dependency and has already cost
two builds of 15 and 21 minutes.

**Every command in part 2 that names `com.mugtaba.athan` names
`com.mugtaba.athan.fleettest` instead while reading the diagnostic.**

**iOS, the diagnostic build.** The flag reaches the bundle through the shell environment:

```bash
cd /Users/muji/repos/rn.athan.uk
EXPO_PUBLIC_IOS_WIDGETS=1 EXPO_PUBLIC_ANDROID_WIDGETS=1 npx expo prebuild -p ios --no-install
grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
```

**The two widget variables are mandatory on every prebuild in this step**, and leaving them out is a
silent regression rather than an error. `app.config.ts:33-34` mirrors them, and a falsy value STRIPS
the `expo-widgets` plugin from the native build: `ai/AGENTS.md` records that a device build derived
from a `.env.example` holding `0` shipped widget-less onto both phones, and that no amount of
re-adding brought the widgets back. `build-prod.zsh` supplies them from `.env.example` and a direct
`npx expo prebuild` does not, which is exactly the gap this step steps into. The same two variables go
on the Android prebuild in the block above; add them there too.

The plist must show step 1's version. The order is mandatory and `ai/AGENTS.md` records why: bump the
version first, then prebuild, then build, because `expo run:ios` never resyncs an existing native dir
and violating this order once shipped 1.22.10 code stamped 1.22.9.

```bash
cd /Users/muji/repos/rn.athan.uk/ios && pod install
```

Expect `Installing QiblaHeading (0.1.0)`.

```bash
cd /Users/muji/repos/rn.athan.uk
EXPO_PUBLIC_ENV=local EXPO_PUBLIC_QIBLA_DIAGNOSTIC=1 \
  EXPO_PUBLIC_IOS_WIDGETS=1 EXPO_PUBLIC_ANDROID_WIDGETS=1 \
  npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E
```

**No API key is needed and none is passed**, because `local` serves mock prayer data and the qibla
sheet reads none of it. So `eas env:exec` is deliberately NOT used here, which keeps EAS out of this
build entirely.

**This iOS build installs OVER the owner's app**, unlike the Android one, because iOS has no suffix
mechanism in this project. That is why part 4 reinstalls the shipped build on the XS at the end, and
why it is not optional.

## 2. Read the 3T

The Android diagnostic build installed itself in part 1 as `com.mugtaba.athan.fleettest`, alongside
the owner's real app.

**Confirm which build is actually running before reading anything.** Session 41 lost time to reasoning
about a build that was not installed:

```bash
adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan.fleettest | grep versionName
```

It must print step 1's version.

### The three measurements, in order

**(a) Is FOP available at all on the 3T?** This is the one answer that decides whether the Android
half of this row has any future. Open the qibla sheet, then:

```bash
adb -s 8f7ada76 shell dumpsys sensorservice | sed -n '1,8p'
```

Record the `active-count` block. With the diagnostic on, FOP registers its own sensor clients through
Play services, so the sampling periods and client counts differ from the two the app registers alone.
Compare against `MEASURED.md` section 3's baseline, which was taken with the sheet open on 1.29.207.

**(b) What does the screen say?** Take a screenshot and read it:

```bash
python3 ~/athan-device-sweep/session5/bin/devcheck.py shot ~/athan-device-sweep/session49/3t-diagnostic.png
```

Read it yourself if your model can see images. If it cannot, call the `vision` subagent with that
path and exactly this question:

> In the lower half of this phone screenshot, below the circular compass dial, there is a small text
> readout of several labelled numbers. Transcribe every label and its number exactly as shown, line by
> line. If there is no such readout, say "no readout".

**(c) Do FOP and the platform heading agree?** The screen shows both. Hold the phone still, flat,
and record both numbers. Then turn it to face the qibla and record both again.

**What each outcome means**, written down before the measurement so it cannot be rationalised after:

| Outcome | What it means | What the next session does |
| --- | --- | --- |
| FOP unavailable on the 3T | The Android half is dead on the floor device, whatever Google documents | Report it; the iOS half still stands alone |
| FOP and platform agree within a degree or two | FOP is piping the AOSP Rotation Vector through, exactly as Google's own caveat allows, and buys nothing here | Do NOT swap the source. `FINDINGS.md` section 1 predicted this |
| FOP differs materially AND matches Maps better | The forward answer Google advertises, confirmed on his hardware | A later session swaps the source, with his judgement as the gate |
| FOP differs materially and is WORSE | Session 47's defect in a new API | Reject it, and record it so nobody tries again |

**Compare against Google Maps on the same phone at the same instant**, which is the comparison the
owner has made all along and the only external reference available.

## 3. Install and read the XS

`expo run:ios` installs and launches. Confirm the build:

```bash
xcrun devicectl device info apps --device 00008020-0015585C22D2002E | grep -i athan
```

It must print step 1's version.

### The measurement that answers session 48's open question

Open the qibla sheet and read the diagnostic. The number that matters is **`accuracyDegrees`**, which
no build of this app has ever been able to see.

```bash
pymobiledevice3 developer dvt screenshot ~/athan-device-sweep/session49/xs-diagnostic.png --udid 00008020-0015585C22D2002E
```

Read it with the same question as part 2(b).

**Then the discriminator session 48 specified, which is the whole reason this module exists.** Close
and reopen the sheet ten times at one fixed spot, recording `accuracyDegrees` and `trueHeading` each
time. The outcomes are decisive rather than suggestive:

| If | Then |
| --- | --- |
| The heading scatter correlates with `accuracyDegrees` | The phone already knows when it is uncertain, and the app can act on it. That is a real feature for a later session |
| The heading is 20 to 30 degrees out while `accuracyDegrees` reads 5 or less | A local field has been absorbed into the calibration and **no software fix exists.** A result worth having, and the honest end of this line of work |
| `accuracyDegrees` is ever negative | Apple is declaring the reading invalid and the app has been drawing it at full confidence. An immediate, cheap fix for a later session |

Record `wantsCalibration` too: if iOS asks for calibration and the app has never offered it, that is
the gap session 48 identified, now observed rather than inferred.

## 4. Leave both phones on the shipped build, the same version on each

**This is what the owner asked for:**

> please make sure both phones have the latest code so I can test both phones at the same time

So both phones end on step 1's version as an ordinary `prod` build, with no diagnostic readout. The
diagnostic build is a measuring instrument and is not what he tests the compass on.

**The 3T needs no reinstall of the real app**, because the diagnostic went on as
`com.mugtaba.athan.fleettest` alongside it. It does need the real package brought up to step 1's
version:

```bash
zsh ~/athan-device-sweep/session3/bin/build-prod.zsh uat-2 ~/athan-device-sweep/session49/athan-ship.apk
adb -s 8f7ada76 install -r ~/athan-device-sweep/session49/athan-ship.apk
```

Success ends `BUILD-PROD OK`. Then the install ritual from part 1, against `com.mugtaba.athan` this
time.

**Remove the diagnostic build from the 3T**, so the owner is not left with two Athan icons:

```bash
adb -s 8f7ada76 uninstall com.mugtaba.athan.fleettest
```

That is the `fleettest` package, never `com.mugtaba.athan`. The executor brief forbids uninstalling
the app; this uninstalls the throwaway alongside it, which is the point of having used a suffix.

**The XS must be rebuilt**, because its diagnostic build went on OVER the real app:

```bash
cd /Users/muji/repos/rn.athan.uk
EXPO_PUBLIC_IOS_WIDGETS=1 EXPO_PUBLIC_ANDROID_WIDGETS=1 npx expo prebuild -p ios --no-install
grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
cd ios && pod install
cd /Users/muji/repos/rn.athan.uk
eas env:exec preview 'npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E'
```

The two widget variables are mandatory here for the same reason as above: without them the prebuild
strips the widget extension. No `EXPO_PUBLIC_QIBLA_DIAGNOSTIC` is set, so the flag is absent and the
readout cannot render.
`eas env:exec preview` injects the API key for a local Release build and the environment is POSITIONAL
(`ai/AGENTS.md`); it reads EAS configuration and builds locally, which is the permitted read-only use.

**Verify on BOTH phones that no readout is present**, by screenshot with the part 2(b) question, rather
than assuming the build honoured the flag. A readout still showing means Metro served a cached bundle
that inlined the old value, which `e2e/README.md` records as Metro's env-blindness; the remedy is a
clean build.

**Verify both versions match:**

```bash
adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan | grep versionName
xcrun devicectl device info apps --device 00008020-0015585C22D2002E | grep -i athan
```

Both must print step 1's version. That is the owner's request, checked rather than assumed.

Finally:

```bash
adb -s 8f7ada76 shell settings get global auto_time
```

It must print `1`. Never leave automatic time off.

## 5. Acceptance criteria

| Check | Expected |
| --- | --- |
| No tracked file changed by this step | `git status --porcelain` lists only `ai/plans/README.md` and this plan folder. **`.env.example` is NOT edited anywhere in this step**: the flag reaches the diagnostic build through the shell environment only |
| Both phones' `versionName` | step 1's version, identical on both |
| The diagnostic was READ on both phones | a transcription recorded in `LOG.md` for each |
| FOP availability on the 3T | answered yes or no, with the evidence |
| `accuracyDegrees` across ten XS restarts | ten numbers recorded in `LOG.md` |
| Both phones left with the diagnostic OFF | confirmed by screenshot on each, not assumed |
| The throwaway package is gone from the 3T | `adb -s 8f7ada76 shell pm list packages com.mugtaba.athan.fleettest` prints nothing |
| `adb shell settings get global auto_time` | `1` |

## 6. Records

Append one entry to `ai/AGENTS.md`'s Recent Decisions, dated, with the measured values substituted.
Its claims must be only what was measured:

> **[2026-10-02] The row's own blocker did not exist, and Gradle's conflict resolution is why**
> (session 49). Session 48's research recorded that `expo-location` pins
> `play-services-location:21.0.1` against the Fused Orientation Provider's 21.2.0 minimum, and
> concluded that reaching FOP needed a patch or a native module. The pin is real and the conclusion was
> wrong: **Gradle resolves a version conflict to the HIGHEST request**, so a local Expo module
> declaring 21.4.0 lifts the whole app's resolution including `expo-location`'s own, measured as
> `play-services-location:21.0.1 -> 21.4.0` in Gradle's own dependency report and proven by a
> successful `:qiblaheading:compileReleaseKotlin` against FOP's imports. **DURABLE LESSON: a version
> pin in a dependency's own build file is a FLOOR, not a ceiling, and reading one as a blocker without
> running `./gradlew :app:dependencies` costs a session's worth of design.** Three further findings.
> **`DeviceOrientation.hasConservativeHeadingErrorDegrees()` exists**, read from the AAR's bytecode
> because the documentation pages 404 today, so FOP's error cone is OPTIONAL per sample and an
> unconditional read publishes a default dressed as an accuracy. **`play-services-location:21.1.0` is
> a trap**: it carries `DeviceOrientation` and `DeviceOrientationListener` but NOT
> `FusedOrientationProviderClient`, so a version check written against the data classes passes on a
> version that cannot work; 21.2.0 is the true floor, measured by downloading three AARs and counting
> classes. And **Google's own announcement carries a caveat nobody had quoted: "in certain cases, the
> FOP returns values piped through from the AOSP Rotation Vector"**, which IS the sensor session 47
> shipped, measured 5 to 34 degrees wrong outdoors, and reverted, so FOP cannot be assumed to be a
> different answer and this session deliberately ADDED it beside the platform heading rather than
> swapping to it. **`expo-location` also destroys TWO numbers on iOS, not one**: `normalizeAccuracy`
> buckets `headingAccuracy`'s degrees to 0 to 3, and it maps a NEGATIVE accuracy, which Apple
> documents as "invalid heading" and gates on unconditionally in its own sample, into the same bucket 0
> as a merely-poor 60-degree reading, so "the phone says this reading is invalid" is not recoverable
> from JS even in principle. **A diagnostic belongs on the SCREEN rather than in a log on this
> project**, because `shared/config.ts` disables Pino on `prod` and `preview` and those are the only
> builds the owner tests. What the module measured on his own phones is in
> `ai/plans/49-qibla-native-heading/LOG.md`.

Then set row 49 to EXECUTED in `ai/plans/README.md` and make an `executed` docs commit
(`EXECUTOR-BRIEF.md` section 4b). Do not push: the audit pushes.

## 7. Report

`PLAN.md` section 12 gives the shape: which build each phone is on, what the diagnostic read on each,
whether FOP and the platform heading agreed on the 3T, what ten XS restarts said about
`accuracyDegrees`, and the assumptions taken without asking.
