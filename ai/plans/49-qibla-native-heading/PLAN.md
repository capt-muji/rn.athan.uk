# Session 49: the heading from our own native module

**Planned at:** `3100ad7f` (`uat-2`, 1.29.208)
**Status:** DONE 2026-10-02 (executed 1.29.210 to 1.29.213, audited; see LOG.md and AUDIT.md)
**Needs first:** nothing (48 is DONE)

Compressed 2026-10-07 after the row closed DONE: the step mechanics are gone (the shipped code in
`modules/qiblaheading/` is the specification now), the decisions, rulings and defects stay.

---

## 1. The goal, in one paragraph

The owner chose his options 3 and 4 together: write our own native module, because the fault is in
`expo-location`. Session 48 proved him substantially right, and narrowed it: `expo-location` reads
both platforms' sensors faithfully and then **throws away the one number that says how much to trust
the reading.** On iOS it buckets `CLHeading.headingAccuracy` from degrees into 0 to 3, where bucket 3
spans the whole 0 to 20 degree range he is complaining about, and it collapses Apple's "this reading
is invalid" into the same bucket as "this reading is poor". On Android it never offers Google's Fused
Orientation Provider, which Google states IS the heading Google Maps draws, and which the owner has
been comparing against all along. **This session built one local Expo module, `modules/qiblaheading`,
that exposes the uncertainty in real degrees on both platforms, and on Android offers FOP beside the
platform heading so the two can be measured against each other on his own phone.**

### The owner's rules that bound every line of this plan

🐋  "we want accuracy, 1000% accuracy, always, always, always accuracy."

🐋  "the least amount of permissions possible."

🐋  "I don't ever want to touch released on Jason ever again." (no hand-edited release file)

The standing rule from sessions 40, 41 and 47, not relaxed anywhere: **no invented constant, no
tuned offset, no per-location calibration, no axis correction, no declination term of our own.**
Session 40 shipped a reading 90 degrees out by tuning one by eye.

And the owner's instruction for this session, which is why no question was asked:

🐋  "I want you to work autonomously in a loop. Don't ask me questions. And list all your
assumptions at the very end."

🐋  "if this is a prototype, is it worth writing tests for it? ... maybe we should save the testing
for later."

## 2. The decisions this session took, and why each is the owner's own rule applied

Every decision was taken under his instruction not to ask, each recorded with the rule or
measurement that forced it.

| # | Decision | Why, and what it rests on |
| --- | --- | --- |
| 2.1 | **A LOCAL MODULE, not a patch to `expo-location`** | MEASURED.md section 1: a local module declaring `play-services-location:21.4.0` lifts the whole app's resolution, proven by `21.0.1 -> 21.4.0` in Gradle's own report and by a successful `:qiblaheading:compileReleaseKotlin`. It needs no `expo-location` patch at all, and `ai/AGENTS.md` records that patching that package's Android source has already produced one silent no-op |
| 2.2 | **NO TESTS THIS SESSION, and this is the owner's own call** | 🐋  "maybe we should save the testing for later." Also what the gates permit: `modules/` is in `UNMEASURED` (`scripts/check-changed-coverage.js:40`) and outside `collectCoverageFrom` (`jest.config.js:110-122`). Session 45 ran the same shape: prototype first, 100% coverage in a later session. (The deferral held for `modules/` and FAILED for the flag-gated files — see LOG.md.) |
| 2.3 | **The module ADDS a reading; it REPLACES nothing** | The compass the owner accepted at 1.29.205 keeps drawing from `watchHeadingAsync`. FINDINGS.md section 1 is the reason: Google states FOP "returns values piped through from the AOSP Rotation Vector" in certain cases, and that is the sensor session 47 shipped, measured 5 to 34 degrees wrong, and reverted. **Swapping the heading source on the strength of the Maps quote alone would repeat session 47's mistake with a different API** |
| 2.4 | **Both platforms in this session, not iOS first** | The owner's ruling of 2026-10-01: 🐋  "we shouldn't block this feature from Android. We want to implement both Android and iOS... I see you putting iOS only feature flags, but this is just going to increase the work for us later." |
| 2.5 | **Apple's calibration HUD is NOT shown** | FINDINGS.md section 3: the delegate answer hands the screen to a system HUD at a moment the app does not choose, and the owner owns every visual. Session 48's research downgraded it to UI rather than algorithm, supplying only the motion he already performs and which 1.29.207 already asks for in words and animation. The module reports whether iOS WANTS calibration, which is the signal |
| 2.6 | **The diagnostic surfaces ON SCREEN, not in a log** | `shared/config.ts` disables Pino on `prod` and `preview`, and the owner tests production release builds, so a logged diagnostic would be invisible on the only build that matters |
| 2.7 | **`EXPO_PUBLIC_QIBLA_DIAGNOSTIC`, default OFF** | The existing flag pattern (`shared/flags.ts`, one typed reader, `=== '1'` so mistakes disable), AND the repo's own rule that a gate spelling its own variable also requires `EXPO_PUBLIC_ENV !== 'prod'` (`shared/perf.ts:34`, `device/backgroundTaskDebug.ts:32`, `shared/time.ts:315`) — so a diagnostic readout can never reach a store build on a stray variable. The compass he accepted must look identical with the flag off |
| 2.8 | **FOP at `OUTPUT_PERIOD_DEFAULT`** | Google: "If you do not know which update period to use, we recommend starting with `OUTPUT_PERIOD_DEFAULT`". MEASURED.md section 2 measures it at 20000 microseconds, exactly the 50 Hz session 48 already proved affordable on the 3T |
| 2.9 | **No new permission, and the module asks for none** | The owner's least-permissions rule. FOP needs none (Google, verbatim). iOS heading needs the foreground permission the app already holds |
| 2.10 | **`play-services-location:21.4.0`, not `21.2.0`** | 21.2.0 is the floor; 21.4.0 is current and MEASURED.md section 2 verified its API surface in the bytecode. Pinning the floor buys nothing and dates faster |

## 3. The invariant

**With the flag off, the qibla sheet behaves byte-for-byte as it does at 1.29.208: the same heading
source, the same settling gate, the same haptic, the same drawing, and no sensor armed that is not
armed today.** With it on, the sheet additionally shows the platform's own uncertainty in degrees,
and on Android the FOP heading beside the platform heading. Checkable: with the flag off, no FOP
registration appears in `adb shell dumpsys sensorservice` beyond the two the app already registers.
**The audit (AUDIT.md section 3) found this invariant guarded by nothing and the gap was fixed in
1.29.213** — a guard that every test is indifferent to is not a guard.

## 4. Design review: the eight defects this plan's own process caught

The design review found three defects in the first draft, each recorded because each would have
shipped something wrong:

1. **The first draft replaced `watchHeading` with FOP on Android.** FINDINGS.md section 1 killed it
   (decision 2.3): Google says FOP sometimes pipes the AOSP Rotation Vector through, the sensor
   session 47 reverted. Without that quote this plan would have shipped session 47's defect again.
2. **The first draft read `getConservativeHeadingErrorDegrees()` unconditionally.** MEASURED.md
   section 2 found `hasConservativeHeadingErrorDegrees()` in the bytecode: the cone is OPTIONAL per
   sample, so an unconditional read publishes a default and calls it an accuracy.
3. **The first draft logged the diagnostic through Pino.** `shared/config.ts` disables Pino on
   production builds, the only build the owner tests, so the diagnostic would have been invisible
   exactly where it was needed (decision 2.6).

The cold read of the finished plan found five more, each a class of mistake rather than a typo:

4. **The pre-flight's own anchor was wrong, and running it is what caught it** — the anchor counted
   2 because `requireOptionalNativeModule` appears twice in `modules/widgetrefresh/index.ts` (once
   in a type, once in the call). An unrun pre-flight would have sent the executor to NEEDS REPLAN on
   a healthy tree.
5. **The flag had no prod guard**, which this repo's own rule requires (decision 2.7).
6. **With the guard added, the plan's own build method became impossible** — `build-prod.zsh` forces
   `EXPO_PUBLIC_ENV=prod`, which the guard refuses. The measurement ran on a `local` build.
7. **And `preview`, the first replacement, would have thrown at prebuild** — `app.config.ts:96-106`
   fails any `prod` or `preview` build with no real API key. `local` trips neither that nor the
   prod guard.
8. **A direct `npx expo prebuild` would have shipped both phones widget-less** — `app.config.ts:33-34`
   mirrors the two widget flags and a falsy value STRIPS the `expo-widgets` plugin;
   `build-prod.zsh` supplies them from `.env.example` and a direct prebuild does not. `ai/AGENTS.md`
   records that this exact mistake once shipped widget-less builds onto both phones.

Defects 5 through 8 are one chain: a correct guard invalidated the build method, whose first
replacement hit an unrelated contract, whose fix exposed a missing pair of variables. **None would
have been found by reading the plan for sense; each needed a specific file read.**

## 5. Steps (as executed)

- Step 1: the module and its consumer, in ONE commit — measured, because
  `scripts/find-unused-exports.py` scans `modules/` (`scripts/find-unused-exports.py:25`) and
  reports an export the moment no production file imports it, so the module and its first consumer
  must land together or `uat-2` goes red. Specified in `steps/1-module-and-consumer.md` (git
  history, `42bb6742`).
- Step 2: the device proof on both phones, no code (git history, `steps/2-device-proof.md`,
  `0fcb5fdc`).

The contracts of step 1 are the shipped module's own code now (true as of 1.29.210-211, the build
this section records — row 53 later rewrote the module, so treat these as the row-49 specification,
not the current one; iOS's `accuracyDegrees`/`wantsCalibration`/no-calibration-prompt still hold,
`QiblaHeadingModule.swift:34-35,96-99`): `ExpoQiblaHeading` on both
platforms; Android registers FOP at `OUTPUT_PERIOD_DEFAULT` with the optional error cone read only
behind `hasConservativeHeadingErrorDegrees()` and omitted (never `null`) when absent; iOS passes
`headingAccuracy` through unbucketed, negative included, with `locationManagerShouldDisplayHeadingCalibration`
answering `false`; no permission requested anywhere; `watchQiblaDiagnostic` chooses its platform by
which function the module exposes, never by `Platform.OS`, and returns a synchronous unsubscribe.

## 6. Rejected alternatives

| Rejected | Why |
| --- | --- |
| Patch `expo-location`'s `build.gradle` to lift the pin | Unnecessary: Gradle takes the highest request, measured (MEASURED.md section 1). A patch also risks the prebuilt-AAR no-op already recorded in `ai/AGENTS.md` |
| Patch `normalizeAccuracy` to pass degrees | It changes a published type's meaning for every caller, and `expo-location`'s own `getHeadingAsync` branches on `accuracy > 1`. A patch there breaks the library's own logic |
| Replace the heading source with FOP | Decision 2.3, and defect 1 above |
| `CMDeviceMotion` on iOS | Session 48: its degree-valued `headingAccuracy` is iOS 27+, and the owner's XS runs 18.7.10, so it would be COARSER than what `CLHeading` already offers |
| Show Apple's calibration HUD | Decision 2.5 |
| Write the diagnostic to a file for later reading | The owner judges on the phone, in the moment, and a file needs a second tool. On screen is both simpler and what he actually does |

## 7. What this session is NOT

It does not make the compass certain indoors. Apple states in writing that calibration "is able to
filter out only those magnetic fields that move with the device", so a field fixed in the owner's
room is indistinguishable from the earth's by any software, and session 48 measured that no gate
reading the heading stream can see it. **This session made the phone's own uncertainty VISIBLE and
gave Android the sensor Maps uses, so the next decision is taken on measurement rather than on
argument.** The measurement it took is in LOG.md.
