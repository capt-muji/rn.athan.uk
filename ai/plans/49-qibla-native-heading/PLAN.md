# Session 49: the heading from our own native module

**Planned at:** `3100ad7f` (`uat-2`, 1.29.208)
**Status:** READY
**Needs first:** nothing (48 is DONE)

Read `MEASURED.md` and `FINDINGS.md` before this file. They hold every number and every quote this
plan rests on, taken during planning, and one of them overturns the row's own brief.

---

## 1. The goal, in one paragraph

The owner chose his options 3 and 4 together: write our own native module, because the fault is in
`expo-location`. Session 48 proved him substantially right, and narrowed it: `expo-location` reads
both platforms' sensors faithfully and then **throws away the one number that says how much to trust
the reading.** On iOS it buckets `CLHeading.headingAccuracy` from degrees into 0 to 3, where bucket 3
spans the whole 0 to 20 degree range he is complaining about, and it collapses Apple's "this reading
is invalid" into the same bucket as "this reading is poor". On Android it never offers Google's Fused
Orientation Provider, which Google states IS the heading Google Maps draws, and which the owner has
been comparing against all along. **This session builds one local Expo module, `modules/qiblaheading`,
that exposes the uncertainty in real degrees on both platforms, and on Android offers FOP beside the
platform heading so the two can be measured against each other on his own phone.** It ships as a
prototype he judges on the device, with no test suite, on his explicit deferral; the suite is session
51's job.

### The owner's rules that bind every line of this plan

🐋  "we want accuracy, 1000% accuracy, always, always, always accuracy."

🐋  "the least amount of permissions possible."

🐋  "I don't ever want to touch released on Jason ever again." (no hand-edited release file)

The standing rule from sessions 40, 41 and 47, which this plan does not relax anywhere: **no invented
constant, no tuned offset, no per-location calibration, no axis correction, no declination term of
our own.** Session 40 shipped a reading 90 degrees out by tuning one by eye.

And the owner's instruction for this session, which is why no question is asked below:

🐋  "I want you to work autonomously in a loop. Don't ask me questions. And list all your
assumptions at the very end."

🐋  "if this is a prototype, is it worth writing tests for it? ... maybe we should save the testing
for later."

## 2. The decisions this session took, and why each is the owner's own rule applied

Every decision below was taken by this session under his instruction not to ask. Each is recorded
with the rule or measurement that forced it, and each is reversible by a later session.

| # | Decision | Why, and what it rests on |
| --- | --- | --- |
| 2.1 | **A LOCAL MODULE, not a patch to `expo-location`** | `MEASURED.md` section 1: a local module declaring `play-services-location:21.4.0` lifts the whole app's resolution, proven by `21.0.1 -> 21.4.0` in Gradle's own report and by a successful `:qiblaheading:compileReleaseKotlin`. It needs no `expo-location` patch at all, and `ai/AGENTS.md` records that patching that package's Android source has already produced one silent no-op |
| 2.2 | **NO TESTS THIS SESSION, and this is the owner's own call** | 🐋  "maybe we should save the testing for later." It is also what the gates permit: `modules/` is in `UNMEASURED` (`scripts/check-changed-coverage.js:40`) and outside `collectCoverageFrom` (`jest.config.js:110-122`), so native module code is unmeasurable by Jest by existing policy. Session 45 ran exactly this shape: prototype on the phone first, 100% coverage in a later session |
| 2.3 | **The module ADDS a reading; it REPLACES nothing** | The compass the owner accepted at 1.29.205 keeps drawing from `watchHeadingAsync` exactly as it does today. `FINDINGS.md` section 1 is the reason: Google states FOP "returns values piped through from the AOSP Rotation Vector" in certain cases, and that is the sensor session 47 shipped, measured 5 to 34 degrees wrong, and reverted. **Swapping the heading source on the strength of the Maps quote alone would repeat session 47's mistake with a different API** |
| 2.4 | **Both platforms in this session, not iOS first** | The owner's ruling of 2026-10-01: 🐋  "we shouldn't block this feature from Android. We want to implement both Android and iOS... I see you putting iOS only feature flags, but this is just going to increase the work for us later." Both halves compile already (`MEASURED.md` sections 1 and 5) |
| 2.5 | **Apple's calibration HUD is NOT shown** | `FINDINGS.md` section 3: the delegate answer hands the screen to a system HUD at a moment the app does not choose, and the owner owns every visual. Session 48's research also downgraded it to UI rather than algorithm, supplying only the motion he already performs and which 1.29.207 already asks for in words and animation. The module reports whether iOS WANTS calibration, which is the signal; showing the HUD stays an owner decision |
| 2.6 | **The diagnostic surfaces ON SCREEN, not in a log** | `shared/config.ts` disables Pino on `prod` and `preview`, and the owner tests production release builds, so a logged diagnostic would be invisible on the only build that matters. It goes behind a flag, into the sheet |
| 2.7 | **`EXPO_PUBLIC_QIBLA_DIAGNOSTIC`, default OFF** | The existing flag pattern (`shared/flags.ts`, one typed reader, `=== '1'` so mistakes disable). A diagnostic readout is not a shipped visual, and the compass he accepted must look identical with the flag off |
| 2.8 | **FOP at `OUTPUT_PERIOD_DEFAULT`** | Google: "If you do not know which update period to use, we recommend starting with `OUTPUT_PERIOD_DEFAULT`". `MEASURED.md` section 2 measures it at 20000 microseconds, which is exactly the 50 Hz session 48 already proved affordable on the 3T |
| 2.9 | **No new permission, and the module asks for none** | The owner's least-permissions rule. FOP needs none (Google, verbatim). iOS heading needs the foreground permission the app already holds |
| 2.10 | **`play-services-location:21.4.0`, not `21.2.0`** | 21.2.0 is the floor; 21.4.0 is current and `MEASURED.md` section 2 verified its API surface in the bytecode. Pinning the floor buys nothing and dates faster |

## 3. The invariant

**With `EXPO_PUBLIC_QIBLA_DIAGNOSTIC` off, the qibla sheet behaves byte-for-byte as it does at
1.29.208: the same heading source, the same settling gate, the same haptic, the same drawing, and no
sensor armed that is not armed today.** With it on, the sheet additionally shows the platform's own
uncertainty in degrees, and on Android the FOP heading beside the platform heading.

That is checkable: with the flag off, no FOP registration appears in
`adb shell dumpsys sensorservice` beyond the two the app already registers, and the screen is
unchanged.

## 4. Code map

The heading path today, from `codegraph_explore`, verbatim at `3100ad7f`:

```
components/sheets/screens/Qibla.tsx   draws; owns nothing about the heading
  └─ hooks/useQibla.ts                the whole behaviour: permission, position, watch, settle, haptic
       ├─ device/qibla.ts             the ONLY file that touches expo-location
       ├─ shared/qiblaSettle.ts       trailingWindow, hasSettled (session 48's gate)
       ├─ shared/qiblaAlignment.ts    isAligned, alignmentOffset, shouldTap, NO_HEADING = -1
       ├─ shared/qiblaGeometry.ts     qiblaBearing
       └─ shared/qiblaCompass.ts      unwrapHeading, and the drawing geometry
```

What this session adds, and nothing else:

| File | Why it exists |
| --- | --- |
| `modules/qiblaheading/expo-module.config.json` | Declares the module to autolinking on both platforms |
| `modules/qiblaheading/index.ts` | The JS surface, optional-native so iOS/Android/absent all answer safely |
| `modules/qiblaheading/android/build.gradle` | Where `play-services-location:21.4.0` is declared, which is the whole FOP unblock |
| `modules/qiblaheading/android/src/main/AndroidManifest.xml` | Empty manifest, as `modules/widgetrefresh` has |
| `modules/qiblaheading/android/src/main/java/expo/modules/qiblaheading/QiblaHeadingModule.kt` | FOP registration and the event |
| `modules/qiblaheading/ios/QiblaHeading.podspec` | Pod definition, proven to install |
| `modules/qiblaheading/ios/QiblaHeadingModule.swift` | `CLHeading` with `headingAccuracy` in degrees |
| `shared/flags.ts` | One flag added, following the single-reader rule |
| `.env.example` | The flag documented, default `0` |
| `hooks/useQibla.ts` | Subscribes to the diagnostic when the flag is on |
| `components/sheets/screens/Qibla.tsx` | Renders the readout when the flag is on |

### Concurrency: every path that reaches the heading

| Path | What must hold |
| --- | --- |
| Sheet opens | The diagnostic watch arms only with the flag ON, and only after permission is granted |
| Sheet closes | Every watch this module started is stopped, including FOP's, or the sensors run for the life of the process (Performance Design Rule 7) |
| The watch resolves AFTER the sheet closed | It is stopped at once rather than stored: the race session 45 found and `useQibla.ts:161-166` already guards |
| The phone has no gyroscope | FOP registration fails; the JS must treat absence as a normal state, never an error on screen |
| Play services is absent or old | The same path as no gyroscope |
| iOS | FOP does not exist; the Android half of the surface answers nothing and nothing branches on `Platform` in app code |

## 5. Design, and the review that changed it

### What the module exposes

One module name, `ExpoQiblaHeading`, with one event per platform capability. Contracts in section 6.

**The design review found three defects in my own first draft**, each recorded because each would
have shipped something wrong:

1. **The first draft replaced `watchHeading` with FOP on Android.** Rereading `FINDINGS.md` section 1
   killed it: Google says FOP sometimes pipes the AOSP Rotation Vector through, which is the sensor
   session 47 reverted. The module now ADDS a reading beside the accepted one (decision 2.3). Without
   that quote this plan would have shipped session 47's defect again.
2. **The first draft read `getConservativeHeadingErrorDegrees()` unconditionally.** `MEASURED.md`
   section 2 found `hasConservativeHeadingErrorDegrees()` in the bytecode: the cone is OPTIONAL per
   sample, so an unconditional read publishes a default and calls it an accuracy.
3. **The first draft logged the diagnostic through Pino.** `shared/config.ts` disables Pino on
   production builds, which is the only build the owner tests, so the diagnostic would have been
   invisible exactly where it was needed (decision 2.6).

### The cold read of the finished plan found five more, and two would have failed on the first command

Section 11 of `PLANNER-BRIEF.md` asks for the plan to be reread as the executor would read it. That
pass found five defects, recorded because each is a class of mistake rather than a typo:

4. **The pre-flight's own anchor was wrong, and running it is what caught it.** The anchor for the
   local-module JS pattern counted 2, because `requireOptionalNativeModule` appears twice in
   `modules/widgetrefresh/index.ts`, once in a type and once in the call. An unrun pre-flight would
   have sent the executor straight to NEEDS REPLAN on a healthy tree. Fixed to the call line, and the
   script now ends `PREFLIGHT OK` for step 1 and correctly FAILS for step 2 with step 1 unmerged.
5. **The flag had no prod guard, which this repo's own rule requires.** `shared/flags.ts`'s header
   states that any gate spelling its own variable "also require[s] `EXPO_PUBLIC_ENV !== 'prod'`",
   and `shared/perf.ts:34`, `device/backgroundTaskDebug.ts:32` and `shared/time.ts:315` all do it.
   The first draft's flag would have let a diagnostic readout reach a store build on a stray variable.
6. **With the guard added, the plan's own build method became impossible.** It built the diagnostic
   with `build-prod.zsh`, which forces `EXPO_PUBLIC_ENV=prod`, which the new guard refuses. The
   measurement now runs on a `local` build.
7. **And `preview`, the first replacement, would have thrown at prebuild.** `app.config.ts:96-106`
   fails any `prod` or `preview` build with no real API key, so `EXPO_PUBLIC_ENV=preview` without a
   key dies with `EXPO_PUBLIC_API_KEY is missing`. `local` trips neither that nor the prod guard.
8. **A direct `npx expo prebuild` would have shipped both phones widget-less.** `app.config.ts:33-34`
   mirrors the two widget flags and a falsy value STRIPS the `expo-widgets` plugin;
   `build-prod.zsh` supplies them from `.env.example` and a direct prebuild does not. `ai/AGENTS.md`
   records that this exact mistake once shipped widget-less builds onto both phones and that no
   amount of re-adding brought the widgets back. Every prebuild and run command in step 2 now carries
   `EXPO_PUBLIC_IOS_WIDGETS=1 EXPO_PUBLIC_ANDROID_WIDGETS=1`.

Defects 5 through 8 are one chain: a correct guard invalidated the build method, whose first
replacement hit an unrelated contract, whose fix exposed a missing pair of variables. **None of them
would have been found by reading the plan for sense; each needed a specific file read.**

### Rejected alternatives

| Rejected | Why |
| --- | --- |
| Patch `expo-location`'s `build.gradle` to lift the pin | Unnecessary: Gradle takes the highest request, measured (`MEASURED.md` section 1). A patch also risks the prebuilt-AAR no-op already recorded in `ai/AGENTS.md` |
| Patch `normalizeAccuracy` to pass degrees | It changes a published type's meaning for every caller, and `expo-location`'s own `getHeadingAsync` branches on `accuracy > 1`. A patch there breaks the library's own logic |
| Replace the heading source with FOP | Decision 2.3, and defect 1 above |
| `CMDeviceMotion` on iOS | Session 48: its degree-valued `headingAccuracy` is iOS 27+, and the owner's XS runs 18.7.10, so it would be COARSER than what `CLHeading` already offers |
| Show Apple's calibration HUD | Decision 2.5 |
| Write the diagnostic to a file for later reading | The owner judges on the phone, in the moment, and a file needs a second tool. On screen is both simpler and what he actually does |

## 6. Steps

Each step is one branch, one commit, version-bumped, merged `--no-ff`. The order leaves `uat-2` green
at every point.

**One commit or two?** Measured, because three prior sessions got this wrong. `python3
scripts/find-unused-exports.py` reports an export the moment no production file imports it, and it
scans `modules/` (`scripts/find-unused-exports.py:25`): this session confirmed that a throwaway
`modules/qiblaheading/index.ts` export reported as unreachable while nothing imported it. **So the
module and its first consumer must land together.** Steps 1 and 2 are therefore ONE commit, exactly
as sessions 44, 45 and 48 each measured for their own work.

- [ ] Step 1: the module and its consumer, in one commit (specified), in `steps/1-module-and-consumer.md`
- [ ] Step 2: the device proof on both phones, no code (specified), in `steps/2-device-proof.md`

## 7. Device proof

Both phones, same place, back to back, which is the method caution `WHAT-FIXED-IT.md` records: the
owner's judgement is the instrument and his room is the variable, so nothing is compared across days.

Full protocol in `steps/2-device-proof.md`. The build the phones are left on is named there, and the
owner's instruction for this session is explicit:

> please make sure both phones have the latest code so I can test both phones at the same time

So step 2 ends with BOTH phones on the same new version, which is also what makes his side-by-side
comparison meaningful.

## 8. Records

On completion, `ai/AGENTS.md` gains one Recent Decisions entry and `ai/plans/README.md`'s row 49 is
set EXECUTED then DONE. The text is in `steps/2-device-proof.md` part 6.

## 9. Owner decisions

None open. Every decision is in section 2, taken under his instruction not to ask.

## 10. If a step stops part-way

| Step | Restore |
| --- | --- |
| 1 | `git checkout -- shared/flags.ts .env.example hooks/useQibla.ts components/sheets/screens/Qibla.tsx app.json package.json`, then `rm -rf modules/qiblaheading` |
| 2 | Nothing: it changes no code. Leave both phones on the version step 1 produced |

### Anticipated review fixes

None are predicted for code this plan does not give verbatim: `EXECUTOR-BRIEF.md` section 4, item 8
gives the three conditions under which a finding is applied and recorded in `LOG.md`.

## 11. What this session is NOT

It does not make the compass certain indoors. Apple states in writing that calibration "is able to
filter out only those magnetic fields that move with the device", so a field fixed in the owner's
room is indistinguishable from the earth's by any software, and session 48 measured that no gate
reading the heading stream can see it. **This session makes the phone's own uncertainty VISIBLE and
gives Android the sensor Maps uses, so the next decision is taken on measurement rather than on
argument.**

## 12. Report to the owner

Section 12's report is written at the end of step 2, and it says: which build each phone is on, what
the diagnostic read on each, whether FOP and the platform heading agreed on the 3T, and the
assumptions this session took without asking.
