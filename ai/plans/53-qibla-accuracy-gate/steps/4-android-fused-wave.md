# Step 4: Android reads Google's sensor alone, and waits for a wave

2026-10-07. Specification the build satisfied; part 13 records what the design review changed before the code was
finished. **Superseded in part only by step 5**, which removed the ceilings and the fallback this step built; the
wave, the gate and the binding stand as locked.

**The owner's ruling, after testing three builds on the S23 and the 3T that night:**
🐋  "We should go completely Google-based... No basic compass reading at all, completely Google based and always
shake the phone. Remove the 15 degrees gate." 🐋  "This is only for the Android, okay? The iOS is perfectly fine."

**What he tested, which is why:** 1.29.249 (both readers side by side) — jittery, wrong, `fused error 180`, always
the ceiling; prototype B (Google's sensor alone) — right and steady once shaken, 220 for 120 before; prototype C
(basic compass alone) — 🐋  "Horrible... a slight change in direction makes it spin about 50 degrees". The full
night is `LOG.md`, "The night Android's direction was settled".

1. **Goal.** On an Android phone carrying Google's Fused Orientation Provider, that sensor is the ONLY thing that
   reads the heading, and the compass draws once the user has waved the phone. The iPhone, and an Android without
   the sensor, decided exactly as before this step.

2. **Files.** NEW `shared/qiblaWaveGate.ts` (the wave as pure arithmetic over the phone's attitude — NOT
   `shared/qiblaWave.ts`, the hint's drawing) and its suite; `modules/qiblaheading/index.ts` re-bound
   (`watchQiblaDiagnostic`/`QiblaDiagnostic` replaced by `hasFusedHeading`, `watchFusedHeading`, `watchHeadingAccuracy`)
   with a NEW suite (the binding had none and stood at 0%); the Kotlin `QiblaHeadingModule.kt` now sends heading +
   attitude, not the two error figures; `hooks/useQibla.ts` branches on whether the phone carries the sensor;
   `jest.config.js` collects `modules/**`, `scripts/check-changed-coverage.js` drops the `UNMEASURED` entry;
   comments only elsewhere. NOT touched: `modules/qiblaheading/ios/`, `patches/expo-location+58.0.9.patch`,
   `QiblaWave.tsx`, `shared/qiblaWave.ts`, every style and user-facing string.

3. **Design.**

   **3.1 Who reads the heading** — chosen by what the native module exposes, never `Platform.OS`: iPhone = false
   (no `isFusedOrientationAvailable` on the Swift side), `expo-location`, unchanged gate; Android with Play
   services + accelerometer + gyroscope + magnetometer = true, Google's sensor ONLY, `watchHeading` never called,
   the wave (then a 10000ms ceiling, removed in step 5); Android without those = false, `expo-location`, unchanged;
   Android reporting the sensor but silent = the step-5-deleted fallback (3.4).

   **3.2 One sample on a fused phone:** Google Play services → `QiblaHeadingModule.kt emit()` →
   `'onFusedOrientation' { headingDegrees, attitude }` → `watchFusedHeading` → the hook: clear silence, advance the
   wave, `processReading(headingDegrees)`. One sensor, one subscription, one listener — the rule of 2026-10-02.
   The wave advances BEFORE the reading is judged, so the sample that completes the wave is the one that draws.

   **3.3 The wave.** `WAVE_TURN_DEGREES = 30`, `WAVE_TURNS = 8`. `advanceWave`, in order: a reading whose squared
   length is not between 0.5 and 2 is NOT an attitude (returned unchanged; Google lets zeros and infinities
   through, `javap`; NaN fails both comparisons); with no wave yet the reading becomes where counting starts; a
   turn short of 30 degrees from the attitude last counted at returns the SAME object; otherwise one turn, and
   this attitude becomes the counted-from one. **A turn is judged in cosine space, with no arc cosine:**
   `|a . b| <= cos(15 degrees)` — frame-independent, and `q` and `-q` are one attitude. The reviewer computed that
   `2 * acos` returns 29.99999999999999 for a true 30 and NaN for half of all single-precision quaternions. Why
   that shape: measured from what Google already sends (no second reader — the 2026-10-02 shake gate lagged the
   dial); 30 degrees from the last counted attitude (🐋  "What if they shake it very lightly and it does nothing?"
   — a light shake wobbles inside 30 and never counts; hand tremor and walking sit well inside); counted from the
   last COUNTED attitude (a slow steady turn still adds up; the count barely depends on sample rate); any axis (a
   user copying the drawing twists, tilts and swings); eight turns = 240 degrees (more than picking the phone up,
   less than two seconds of a real figure of eight — his shake moved the heading 60 to 170 degrees per quarter
   second). **The numbers are engineering judgement, not measurement** — constants tested each side, logged per
   open so the owner's hands can move them. What it cannot do, stated for the owner: it measures effort not
   coverage; it can open without a real wave (turning on the spot tilted ≈4s, tilting 45° up-down ≈2s, a full
   circle is 7–8 turns); it can refuse a real wave (a figure of eight drawn in the air barely turns the phone —
   this became step 5's finding 2); the compass draws mid-wave by construction, so the alignment tap can fire
   while waving, and the arrival haptic fires on any open; the needle can still creep after the wave (140→120
   over five seconds in the recording — Google's own reading; the gate latches, the dial follows).

   **3.4 A sensor that reports itself and delivers nothing (DELETED in step 5, kept for the record).**
   `isFusedOrientationAvailable` passes on Play services from 2018; the provider needs far newer. Such a phone
   (or microG) answers true and never sends a sample. `FUSED_SILENCE_MS = 3000`: `fallBack()` stopped the fused
   watch, set `fusedRef` false, logged, started `watchHeading`; the visit ran on as a sensorless phone. The
   fallback's watch was kept only if `visitRef` still held the asking visit (stored in its own
   `unwatchFallbackRef` — `activeRef` cannot answer, the sheet may have closed AND reopened). 3000 = six times
   the slowest first sample in the owner's recording (<500ms on the S23). Step 5 deleted the whole fallback: with
   no ceiling, the platform heading on Android can never be drawn, so it would only have armed the magnetometer
   for nothing; such a phone gets the five-second report instead.

   **3.5 The gate** (in `processReading`, the one place a reading is refused): on a fused phone, no wave (then:
   and ceiling not reached) → return; on a wave, log `{ waved, turns, waitedMs }`. Every other phone ran the same
   four statements as before, inside the `else`. On a fused phone there is **no warm reopen and no certainty**:
   🐋  "Every time they want to see the compass, they will have to shake", and Google's error figure is not read at
   all. `warmHeadingRef` is still written on every drawn reading; nothing reads it.

   **3.6 Lifecycle.** `fusedRef` asked fresh on every open; any held watch stopped first; the fused watch stored
   SYNCHRONOUSLY so `stop()` can end it at any instant; a sample before the position is known still advances the
   wave (a slow fix costs nothing); `stop()` clears watch, timer and wave (the next open starts at zero turns;
   `remove()` is synchronous and the emitter reads its list at emit time); native stop-then-start on one thread,
   `startFusedOrientation` clears any listener first; a second `start()` with no `stop()` between (a permission
   prompt outlasting a close-reopen) stops the first watch before arming its own — without it the first listener
   would be stranded and every sample processed twice. On every OTHER phone two leaks existed and were left
   exactly as they were (part 12.3, still open).

   **3.7 The binding.** `hasFusedHeading () => boolean` (false without the native side); `watchFusedHeading`
   and `watchHeadingAccuracy`, each subscribing to its own event, then starting its own native side, both ON the
   native object (the emitter reads its own receiver); each returned function is synchronous, runs once,
   `remove()` then `stop...()`. Two bodies, not a shared helper. The start's promise is not awaited. The lazy
   `require('expo')` stays. **3.8 Kotlin:** `emit` sends `headingDegrees` and `attitude` (four doubles from
   `DeviceOrientation.getAttitude()`, a fresh non-null array, `javap` on 21.4.0); the error figures are no longer
   read; nothing else in the file changes.

   **3.9 Deliberately not built:** no mid-visit silence watchdog (the platform path does not detect silence
   either; it only handles a REPORTED loss, -1, which Google's sensor never sends; a watchdog need not cost a
   second wave — recorded for the owner); no wait for needle creep (a settling gate cannot separate a user's turn
   from drift, sessions 50 and 52); no NaN-heading guard (Google's contract is 0–360); no change to the hint, its
   words or its drawing.

4. **Tests.** Wave-gate fixtures built from an axis and an angle, composed for a tilted start, rounded to single
   precision where the test is about what the sensor really sends: first sample only sets the start; the step each
   side (10, 29.9, 30.1, 90, 179 → 0, 0, 1, 1, 1); each axis and a diagonal, from flat and from a 40°×115° tilt;
   no-yet returns the same object; counting restarts from the counted attitude (flat, 31, 60); a slow steady turn
   adds up (0→105 in 7s → 3 turns, 2 one sample earlier); a wobble never counts though it travels 5600 degrees; an
   attitude and its negative are one; a still phone in single precision counts nothing over 200 samples; eight
   31-degree steps count as eight; six no-attitude shapes (zeros, NaN, infinity, short arrays, five and a fifth of
   unit length) are never counted and cost no turn; complete at eight not seven. Binding: registry reset and
   `expo` mocked per test (the lookup is lazy and cached); subscribe-before-start; payload forwarded; every native
   call on the native object; remove+stop once; all three exports inert without module/platform/availability.
   Sheet: `mockState.fused` false by default so every existing describe runs as the iPhone; `reportFused`,
   `heldStill`, `waved(turns, heading = 95)` at ONE heading (so a leftover warm path would be met and seen);
   Google's sensor is the only reader; a sensorless phone runs as before; refused location arms nothing; 50 still
   samples draw nothing; eight turns draw on the completing sample, seven do not; a light shake never draws; the
   (then-)ceiling at 10000ms not 9999, not at other phones' 3000, restarting per visit; the wave made before the
   fix arrives is kept; every open needs its own wave; turns not carried over a close; the gate latches; the
   heading is drawn untouched (95 → `-95deg`); the haptic after every wave; the alignment tap, nothing while shut;
   no-attitude samples never open nor block; the log line per path; the fallback's timing, stopping and
   overtaking-open cases; plus the two tests step 3's review asked for (warm+certainty silent, post-warm cold felt).

5. **Green.** After the review's fixes: 188 suites, 5191 tests, 100% on all four measures. Breaks: `CAUGHT: 84 of
   84` before review, `91 of 91` after, each ending `ALL AS EXPECTED: 1` (wave arithmetic and counting 19, gate and
   close 16, silent sensor 18, who-reads-what 10, binding 21). `modules/qiblaheading/index.ts` entered the measure
   at 100% from 0%. Kotlin compiles (`:qiblaheading:compileReleaseKotlin`, `BUILD SUCCESSFUL`, on a throwaway build
   before the review landed; the Kotlin never changed after).

6. **Commit and the phone.** `e1d3feba`, 1.29.253, through the hook. Mock build installed on the 3T over
   prototype B; the installed file's `md5` equals the built one (`0b4b12b86f86b55344ffae4d4586a3d8`). The desk
   check, phone untouched: hint at 7s, compass at 14s (the then-ceiling draws); logcat `{ waved: false, turns: 0,
   waitedMs: 10012 }` (`turns` a number — the attitude arrives); `dumpsys sensorservice` with the sheet open —
   `1 active connection`, uid 10029 (Google Play services) holding accelerometer, magnetometer, uncalibrated
   magnetometer, uncalibrated gyroscope, and **the app's uid 10116 holds none** (one reader; the same dump's
   history shows 10116 registering two sensors itself on the build that ran both); three seconds after close —
   `0 active connections` (the close releases the sensor). The wave itself was never tested by the session; it is
   the owner's. The owner's hands, 1.29.253: log held two unwaved ceiling opens (`waitedMs: 10012`, `10001`) and
   one wave `{ waved: true, turns: 8, waitedMs: 1599 }`; 🐋  "It's very, very smooth. It is about almost accurate...
   sometimes it's like 15 degrees off on 1 side or 15 degrees off on the other side, so there's like a, it's within
   a 30 degree radius... It's almost consistently good enough." Then he removed the ceilings — step 5.

7. **Review.** (13) The design review (against this file's first draft, BEFORE the code was finished; verdict "build
   after changes"): BLOCKER — a reporting-but-silent phone shows the hint for ever (3.4, built); BLOCKER —
   `2 * acos` fails at exactly 30 and NaNs on half of real samples, a zero quaternion counts every sample
   (cosine space + validity test + single-precision fixtures); BLOCKER — the design called `shared/qiblaWave.ts`
   NEW and it exists (overwritten for four minutes before `tsc` named it; restored from git byte for byte; the
   wave lives in `qiblaWaveGate.ts`); binding calls must stay attached (3.7, `mock.contexts`); the measure is
   effort not coverage (3.3's limits; a coverage rule was NOT built — it would refuse a hard one-axis shake, the
   motion he was seen to make); two lifecycle rows were wrong and an overtaking open stranded a listener (3.5,
   rewritten with the guard and its tests); the declined watchdog was a false choice (3.9 corrected); fixtures
   that would have hidden the bug (tilted start, diagonal axis, single precision, one-heading waves, unmount,
   reopen during a read); the desk check passes with the attitude missing. The code review (against `e1d3feba`,
   read-only; verdict pass with findings, no blocker) compared what an iPhone executes at `1bf2d8fc` and
   `e1d3feba` in fourteen rows and concluded the iPhone's behaviour cannot differ — the only reachable difference
   needs an accuracy of null, which the Swift side cannot send. Its findings: the fallback-stop ref pinned by test
   and break; the "first open finally finishes" test now releases what it replaces; a sensorless phone never arms
   the silence wait, tested; an overtaking open ends a running-or-setting-up fallback (two tests, two breaks); a
   missing `attitude` would have thrown before judging — `isAttitude` asks `Array.isArray` first; inside the 0.5–2
   band a turn was judged on length too (a quaternion nine tenths as long counted a turn per sample) — lengths
   multiplied back in, four tests and a break; the silence wait covered only the first sample — NOT built, step 5
   replaced it; comments corrected; the dial-trails finding recorded, and the owner judged the 3T smooth that night.

8. **Costs for the owner, NONE built:**
   12.1 **The iPhone has not run this build** — its accuracy now reaches the gate through a rewritten binding;
     the suite proves the calls, order and receiver, not a phone. Check: indoors the compass should arrive well
     under a second; if every open takes three, the accuracy is not arriving.
   12.2 **The iPhone does one thing less per reading since step 3** (no render per accuracy sample): it decides
     the same and is not timing-identical.
   12.3 **Two leaks on every phone that reads `expo-location`, both older than this session.** A close and reopen
     while the first open still awaits the position strands the first heading watch, with the magnetometer armed
     for the life of the process. And `processReading` does not check that the sheet is open, so that stranded
     watch can open the gate, and tap, with the sheet closed. The window is the length of the position read:
     milliseconds with a cached fix, seconds without.
   12.4 The mid-visit watchdog. 12.5 The five limits of 3.3.

**Done when:** `yarn validate` green, breaks `ALL AS EXPECTED: 1`, the desk check's first four rows measured, the
owner's wave has opened it. It did.
