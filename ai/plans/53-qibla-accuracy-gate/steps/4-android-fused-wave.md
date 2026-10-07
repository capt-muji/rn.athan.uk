# Step 4: Android reads Google's sensor alone, and waits for a wave

Planned, reviewed, executed and reviewed again by the same session on 2026-10-07. This file is the specification the
build satisfied. Its first draft was attacked by an independent reviewer BEFORE the code was finished, and part 13
records what that changed.

**The owner's ruling, 2026-10-07, after testing three builds on the Samsung S23 and the OnePlus 3T that night:**
🐋  "We should go completely Google-based... No basic compass reading at all, completely Google based and always
shake the phone. Remove the 15 degrees gate." 🐋  "This is only for the Android, okay? The iOS is perfectly fine."

**What he tested, which is why:**

| Build | What read the heading | What he found |
| --- | --- | --- |
| 1.29.249 | The basic compass AND Google's sensor, side by side | Jittery, wrong, `fused error 180`, always the ceiling |
| Prototype B | Google's sensor alone | Right and steady once the phone had been shaken. 220 for 120 before that. The error figure never passed 15 and did not follow the truth (`LOG.md`, "The night Android's direction was settled") |
| Prototype C | The basic compass alone | 🐋  "Horrible... a slight change in direction makes it spin about 50 degrees" |

0. **Anchor check.** From the repository root at `uat-2` with step 3 merged, each prints `1`:

   ```bash
   grep -c "unwatchDiagnosticRef.current = watchQiblaDiagnostic((diagnostic) => {" hooks/useQibla.ts
   grep -c "if (!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs < CERTAINTY_CEILING_MS) return;" hooks/useQibla.ts
   grep -c "export const watchQiblaDiagnostic" modules/qiblaheading/index.ts
   ```

1. **Goal.** On an Android phone that carries Google's Fused Orientation Provider, that sensor is the ONLY thing
   that reads the heading, and the compass is drawn once the user has waved the phone. The iPhone, and an Android
   phone without the sensor, decide and draw exactly as they did before this step.

2. **Branch.**
   ```bash
   git checkout -b feat/qibla-android-fused-wave refactor/qibla-readout-removed
   ```

3. **Files.** Exactly these, apart from `app.json`, `package.json`, `ai/plans/README.md` and this plan folder:

   | File | What changes |
   | --- | --- |
   | `shared/qiblaWaveGate.ts` | NEW. The wave, as pure arithmetic over the phone's attitude. NOT `shared/qiblaWave.ts`, which is the hint's drawing and is untouched |
   | `shared/__tests__/qiblaWaveGate.test.ts` | NEW |
   | `modules/qiblaheading/index.ts` | `watchQiblaDiagnostic` and `QiblaDiagnostic` are replaced by `hasFusedHeading`, `watchFusedHeading` and `watchHeadingAccuracy` |
   | `modules/qiblaheading/__tests__/index.test.ts` | NEW. The binding had no suite and stood at 0% |
   | `modules/qiblaheading/android/.../QiblaHeadingModule.kt` | Each sample carries the heading and the attitude. The two error figures are no longer sent |
   | `hooks/useQibla.ts` | The reader and the gate each branch on whether the phone carries the fused sensor. A silent sensor falls back |
   | `components/sheets/screens/Qibla.tsx` | Comments only: three that this step, or the shake gate's deletion before it, left false |
   | `components/sheets/screens/QiblaCompass.tsx` | One comment only, false since the patch removed the 2 degree gate |
   | `components/sheets/screens/__tests__/Qibla.test.tsx` | The module's mock follows its new surface. The Android cone's three tests go with the cone. New describes for a fused phone. Two tests the step 3 review asked for |
   | `device/qibla.ts` | One comment, false for the same reason |
   | `shared/qiblaSettle.ts` | `CERTAINTY_THRESHOLD_DEGREES` loses `export`: the readout was its only importer |
   | `jest.config.js` | `modules/**/*.{ts,tsx}` joins `collectCoverageFrom` |
   | `scripts/check-changed-coverage.js` | `modules/` leaves `UNMEASURED`, because its JavaScript is now measured |

   **Not touched:** `modules/qiblaheading/ios/`, `patches/expo-location+58.0.9.patch`, `QiblaWave.tsx`,
   `shared/qiblaWave.ts`, every style and every string the user reads.

4. **Design.**

   **4.1 Who reads the heading.** The choice is made by what the native module exposes, never by `Platform.OS`,
   which is how this path has worked since session 47:

   | Phone | `hasFusedHeading()` | Heading from | Gate |
   | --- | --- | --- | --- |
   | iPhone | false: the Swift side has no `isFusedOrientationAvailable` | `expo-location`, as before | warm, or accuracy within 15, or 3000ms. Unchanged |
   | Android with Play services, an accelerometer, a gyroscope and a magnetometer | true | Google's sensor ONLY. `watchHeading` is never called | the wave, or 10000ms |
   | Android without one of those | false | `expo-location`, as before | 3000ms, since nothing there reports an accuracy. Unchanged |
   | Android that reports the sensor and delivers no sample in 3000ms | true, and wrong | `expo-location`, for that visit | as the row above |

   The third row is why the basic compass is not deleted: without it a phone with no Play services, or no
   gyroscope, would have no qibla at all. The fourth row is part 4.6.

   **4.2 The path of one sample on a fused phone.**

   ```
   Google Play services  ->  QiblaHeadingModule.kt emit()  ->  'onFusedOrientation' { headingDegrees, attitude }
     ->  modules/qiblaheading watchFusedHeading  ->  hooks/useQibla:
           clearSilence()
           waveRef.current = advanceWave(waveRef.current, attitude)
           processReading(headingDegrees)
   ```

   `processReading` is the same function the iPhone's readings pass through. One sensor, one subscription, one
   listener: nothing else registers a sensor while the sheet is open, which is the rule of 2026-10-02 (`ai/AGENTS.md`).
   The wave advances BEFORE the reading is judged, so the sample that completes the wave is the one that draws.

   **4.3 The wave.** `shared/qiblaWaveGate.ts`:

   ```ts
   export type Attitude = readonly [number, number, number, number];   // the quaternion x, y, z, w
   export type Wave = { from: Attitude; turns: number };

   const WAVE_TURN_DEGREES = 30;
   const WAVE_TURNS = 8;
   export const WAVE_CEILING_MS = 10_000;

   export const advanceWave = (wave: Wave | null, attitude: Attitude): Wave | null
   export const hasWaved = (wave: Wave | null): boolean
   ```

   `advanceWave`, in this order:

   1. A reading whose squared length is not between 0.5 and 2 is NOT an attitude. The wave is returned unchanged:
      it is neither counted nor counted from. Google's class lets zeros and infinities through (`javap`), and a
      NaN fails both comparisons.
   2. With no wave yet, the reading becomes where counting starts, at zero turns.
   3. If the phone has not turned 30 degrees from the attitude last counted at, the SAME object is returned.
   4. Otherwise that is one turn, and this attitude becomes the one counted from. One sample is one turn at most.

   **A turn is judged in cosine space, with no arc cosine:** two attitudes are 30 degrees or more apart when
   `|a . b| <= cos(15 degrees)`, the dot product of the two quaternions. It needs no convention: it is the same
   whichever frame Google rotates from, and `q` and `-q` are one attitude. The reviewer computed that `2 * acos`
   of that product returns 29.99999999999999 for a true 30, and NaN for half of all single precision quaternions.

   | Rule | Why it is that shape |
   | --- | --- |
   | Measured from the attitude Google already sends | No second sensor reader. The shake gate of 2026-10-02 read the accelerometer beside the compass and the dial lagged |
   | A turn must reach 30 degrees from the last counted attitude | The owner's question: 🐋  "What if they shake it very lightly and it does nothing?" A light shake wobbles inside the 30 degrees and never counts, however long it lasts. Hand tremor and walking sit well inside it too |
   | Counted from the last COUNTED attitude, not the last sample | A slow steady turn still adds up, and the count barely depends on the sample rate: each turn costs the first sample at or past 30 |
   | Any axis | A user copying the drawing twists, tilts and swings the phone. Requiring one kind of motion would refuse people who are doing what they were asked |
   | Eight turns, 240 degrees in all | More than picking the phone up (one or two turns) and less than two seconds of a real figure of eight. The owner's own shake in the recording of 2026-10-07 moved the heading 60 to 170 degrees every quarter second |
   | 10000ms, then the compass draws anyway | The owner's ruling of 2026-10-02 stands: 🐋  "we don't want to lock it". A user who cannot wave, or a phone whose attitude never moves, still gets a compass |

   **The numbers are engineering judgement, not measurement.** No hand has run this gate. They are constants, each
   tested each side, and a mock build logs what every open scored (part 4.7), so the owner's hands can move them.

   **What it cannot do, stated plainly for the owner to rule on:**

   1. **It measures effort, not coverage.** It proves the phone was turned about. It does not prove the turning
      was the kind that fixes a compass, and it does not prove Google's sensor corrected itself, which nothing in
      the app can see.
   2. **It can open without a real wave.** Turning on the spot with the phone tilted opens it in about 4 seconds.
      Tilting up and down 45 degrees opens it in about 2. Picking the phone up and turning right round is 7 to 8
      turns.
   3. **It can refuse a real wave.** A figure of eight DRAWN IN THE AIR with the phone kept facing the user barely
      turns the phone, scores nothing, and waits the full 10 seconds. A rock of 16 to 29 degrees about one axis
      counts or does not, depending on where in the swing the first sample fell.
   4. **The compass is drawn mid-wave by construction**, so the alignment tap can fire while the user is still
      waving, on each crossing of the line. The arrival haptic also fires on a ceiling open, as it does on every
      other phone.
   5. **The needle can still creep after the wave.** In the recording it slid from 140 to 120 over five seconds
      after the shake ended. The gate latches, so the dial follows it there.

   **4.4 The gate.** In `processReading`, the one place a reading is refused:

   ```ts
   if (!settledRef.current) {
     const waitedMs = nowMs - firstReadingAtRef.current;

     if (fusedRef.current) {
       const waved = hasWaved(waveRef.current);
       if (!waved && waitedMs < WAVE_CEILING_MS) return;
       logger.info('QIBLA: compass drawn on the fused sensor', { waved, turns: waveRef.current?.turns, waitedMs });
     } else {
       // the four statements every other phone runs today, moved inside this branch and otherwise untouched:
       // remembered, the confirmRef push, arrivedWarm, and the one-line condition of step 3
     }
     settledRef.current = true;
   }
   ```

   On a fused phone there is **no warm reopen and no certainty**: every open needs its own wave, as the owner said
   (🐋  "Every time they want to see the compass, they will have to shake"), and Google's error figure is not read at
   all. `arrivedWarm` stays false there, so the arrival haptic the sheet already fires announces every wave, which
   is the vibration he asked for. `warmHeadingRef` is still written on every drawn reading, and nothing reads it.

   **4.5 Lifecycle, traced.**

   | Moment | What happens on a fused phone | Why it is safe |
   | --- | --- | --- |
   | `start()`, after the permission is granted | `fusedRef` is set from `hasFusedHeading()`, asked on every open. Any watch still held is stopped first. The fused watch is stored in `unwatchNativeRef` SYNCHRONOUSLY, and the silence timer is armed | `stop()` can end both at any instant |
   | Close during the permission prompt | Nothing is armed yet. `start()` returns at its existing `activeRef` check | |
   | A sample before the position is known | The silence timer is cleared. The wave advances. `processReading` starts the ceiling and returns at `bearing === null` | A slow fix costs the user nothing: the wave they have made is kept |
   | The wave completes | That same sample passes the gate, latches it and draws | |
   | `stop()` | The watch is removed, the silence timer cleared, `waveRef` cleared, the visit counter moved on | The next open starts at zero turns. `remove()` is synchronous and the emitter reads its list at emit time, so no sample arrives after it |
   | Close and reopen at once | Native `stop` then `start` run in that order on one thread, and `startFusedOrientation` clears any listener first | One listener at a time |
   | Reopen while the first open still awaits the position | The first open's check passes, because the sheet IS open. It stores a no-op in `unwatchRef` and writes the position a second time | No sensor is touched: the fused path holds no promise to resolve late |
   | A second `start()` with no `stop()` between, which a permission prompt outlasting a close and reopen produces | The second open stops the first one's watch before arming its own, and clears its silence timer | Without it the first JS listener would be stranded and every sample processed twice |
   | Unmount | The hook's effect cleanup is `stop()` | |

   **On every OTHER phone two leaks exist today and this step leaves them exactly as they are**, because the fix
   changes code the iPhone runs. They are recorded in part 12 for a step of their own.

   **4.6 A sensor that reports itself and delivers nothing.** `isFusedOrientationAvailable` passes on any Play
   services from 2018 on, and the provider needs a far newer one. Such a phone, or one running microG, answers
   true and never sends a sample. Every wait on this screen is counted from a reading, so with no reading there is
   no ceiling, and before this step that phone drew from `expo-location` at 3000ms. Left alone, this step would
   have turned a harmless failure into a hint that never clears.

   So: `FUSED_SILENCE_MS = 3000`. If no fused sample has arrived by then, `fallBack()` stops the fused watch, sets
   `fusedRef` false, logs a warning and starts `watchHeading`. The visit runs on as a phone without the sensor: no
   wave, the 3000ms ceiling. The watch it starts is asynchronous, so it is kept only if `visitRef` still holds the
   visit that asked for it, and stopped at once otherwise. `activeRef` cannot answer that: the sheet may have
   closed AND opened again by then. It is stored in its own `unwatchFallbackRef`, never in `unwatchRef`, because
   `start()`'s own late store of a no-op there would overwrite it.

   3000 is six times the slowest first sample in the owner's recording (under 500ms on the S23). The next open
   asks the sensor afresh: a phone is not written off for one silence.

   **4.7 What a mock build records.** Two lines, through `shared/logger.ts`, which is off in prod and preview:

   | Line | When | Why |
   | --- | --- | --- |
   | `QIBLA: compass drawn on the fused sensor` with `waved`, `turns`, `waitedMs` | Once per visit, when the gate opens | It is how a wave that would not open is diagnosed without a readout: `turns: 3, waitedMs: 10000` is a bar set too high, and `turns: undefined` is an attitude that never arrived |
   | `QIBLA: the fused sensor delivered nothing, reading the platform heading instead` | When a visit falls back | |

   **4.8 What this step deliberately does not build.**

   1. **No watchdog for a sensor that goes silent MID-visit.** If Google's sensor stopped after the compass was
      drawn, the dial would hold its last angle. The platform path does not detect silence either: it only handles
      a loss the platform REPORTS, as -1, which Google's sensor never sends. So this is no worse than today, except
      that the sensor lives in the Play services process, which can die on its own. A watchdog need not cost the
      user a second wave, because "waved this visit" can be kept apart from "is drawing". Recorded for the owner.
   2. **No wait for the needle to stop creeping** after the wave. That is a settling gate, which sessions 50 and 52
      measured cannot tell a user's turn from a sensor's drift.
   3. **No guard against a heading that is not a number.** Google's contract is 0 to 360 and no phone has sent
      otherwise. If one did, the dial's angle would be poisoned until the app restarted.
   4. **No change to the hint, its words or its drawing.**

   **4.9 The binding.** `modules/qiblaheading/index.ts`:

   | Export | Shape | A phone without that native side |
   | --- | --- | --- |
   | `hasFusedHeading` | `() => boolean` | `false` |
   | `watchFusedHeading` | `(onReading: (reading: FusedHeading) => void) => () => void` | Subscribes to nothing, returns a no-op |
   | `watchHeadingAccuracy` | `(onReading: (accuracyDegrees: number) => void) => () => void` | Subscribes to nothing, returns a no-op |

   `FusedHeading` is `{ headingDegrees: number; attitude: Attitude }`. Two bodies, not a shared helper. Each
   re-asks its availability, calls `native.addListener(...)` and then `native.start...()`, both ON the native
   object, because the emitter reads its own receiver. Each returned function is synchronous and runs once:
   `remove()`, then `native.stop...()`. The start's promise is not awaited, as before. The lazy `require('expo')`
   stays, for the reason its comment gives. The two native sides are typed as a union, so the calls need no `?.`
   that no test could reach.

   **4.10 Kotlin.** `emit` sends `headingDegrees` and `attitude`, the latter as a list of four doubles from
   `DeviceOrientation.getAttitude()`, which returns a fresh non-null array of four (`javap` on 21.4.0).
   `headingErrorDegrees` and the conservative cone are no longer read. Nothing else in the file changes.

5. **Tests.**

   **`shared/__tests__/qiblaWaveGate.test.ts`.** Fixtures are attitudes built from an axis and an angle, composed
   with the quaternion product where a tilted start is needed, and rounded to single precision where the test is
   about what the sensor really sends. Every number in a test is a number of degrees a reader can picture.

   | What it proves | Inputs | Asserts |
   | --- | --- | --- |
   | The first sample only sets where counting starts | flat | `turns` 0 |
   | The step, each side of it, and one sample is one turn at most | 10, 29.9, 30.1, 90, 179 from flat | 0, 0, 1, 1, 1 |
   | Each axis counts, a diagonal one included | 29.9 and 30.1 about x, y, z and (1,1,1) | 0 and 1 |
   | The same from a phone already tilted | the four axes again, composed onto a 40 by 115 degree start | 0 and 1 |
   | Nothing counted returns the same object | flat, then 29.9 | `toBe` |
   | Counting restarts from the counted attitude | flat, 31, 60 | `from` is the 31, `turns` 1 |
   | A slow steady turn adds up, which a count from the last SAMPLE would miss | 0 to 105 in steps of 7 | `turns` 3, and 2 one sample earlier |
   | A wobble never counts, though it travels 5600 degrees | 0 and 28 alternating, 200 samples | `turns` 0 |
   | An attitude and its negative are one attitude | 40, then 40 negated | `turns` 0 |
   | A still phone in single precision counts nothing | one tilted attitude, 200 times | `turns` 0 |
   | Eight turns count as eight in single precision | 31 degree steps | `turns` 8 |
   | Six things that are no attitude are never counted, never counted from, and cost no turn already counted | zeros, NaN, infinity, a two element array, five times and a fifth of unit length | three tables |
   | The wave is complete at eight turns and not at seven | literals, and by feeding turns | `hasWaved` |
   | The ceiling as a literal | | `10000` |

   **`modules/qiblaheading/__tests__/index.test.ts`.** The registry is reset and `expo` mocked per test, because
   the lookup is lazy and cached: the lookup happens once, present or absent; each watch subscribes to its own
   event BEFORE it starts its own native side, forwards its own payload, and calls every native method on the
   native object (`mock.contexts`); the returned function removes and stops once however often it is called; and
   each of the three exports is inert when the module, that platform's side, or that side's availability is
   absent.

   **`Qibla.test.tsx`.** The module's mock gains `mockState.fused`, false by default, so every existing describe
   runs as the iPhone. `reportAccuracy` takes the number the binding now passes. `reportFused(...samples)` delivers
   to the live watch. `heldStill(heading, count)` is a phone at one attitude. `waved(turns, heading = 95)` is one
   opening sample and then that many samples each a LITERAL 31 degrees on, about the phone's long axis, all at ONE
   heading: the heading the last visit left, so a leftover warm path would be met and seen.

   | What it proves, on a fused phone | Asserts |
   | --- | --- |
   | Google's sensor is the only reader | `watchFusedHeading` once. `watchHeading` and `watchHeadingAccuracy` never |
   | A phone without it runs as before | `watchHeadingAccuracy` once. `watchFusedHeading` never |
   | Refused location arms nothing | `watchFusedHeading` never |
   | A still phone draws nothing | 50 samples at one attitude, no dial, the hint still up |
   | Eight turns draw on the completing sample, seven do not | literals |
   | A light shake draws nothing | 200 samples wobbling 28 degrees, no dial |
   | The ceiling draws an unwaved phone at 10000ms, not at 9999ms, and not at the 3000ms other phones wait | literals |
   | The ceiling restarts on each visit | |
   | The wave made before the fix arrives is kept | position held, wave, position released, one sample: dial |
   | Every open needs its own wave | wave, close, reopen, 8 samples at the heading it left: no dial |
   | Turns are not carried over a close | 7 turns, close, reopen, 1 turn: no dial |
   | The gate latches | after the wave, a still phone's next heading turns the dial |
   | The heading is drawn untouched | first frame at `-95deg` for a heading of 95 |
   | The arrival haptic fires after every wave, a reopen included | `notificationAsync` once each |
   | The alignment tap works, and nothing taps while the gate is shut | `impactAsync` |
   | An attitude that is no attitude never opens the gate and never blocks the ceiling | zeros, 50 times, then at 10000ms |
   | The log line says what opened it | wave: `turns: 8, waitedMs: 0`. Ceiling: `turns: 3, waitedMs: 10000`. Once per visit. Never on another phone |
   | A silent sensor falls back at 3000ms and not at 2999ms | `watchHeading` once, the fused watch stopped once, the warning logged |
   | One sample ends the wait for good | nothing after a further 9000ms |
   | A close ends the wait | `watchHeading` never |
   | The fallen-back visit draws at 3000ms with no wave, and not at 2999ms | |
   | The fallback's watch is stopped by a close, by a close that beats its setup, and by a close AND reopen that beat its setup | `mockUnwatch` once each. The last is what `activeRef` alone would get wrong |
   | The next open asks the sensor afresh | `watchFusedHeading` twice, and a wave draws |
   | An overtaking open stops the first one's watch and its silence timer | the stop once, one fallback |
   | A reopen during the first open's position read leaves the second open's sensor running | the stop once, and a wave draws |
   | Closing, closing mid-read, and unmounting each stop the sensor | the stop once |

   **Two tests the step 3 review asked for,** on every other phone: a warm reopen that is ALSO certain on its
   confirming reading fires no arrival haptic, and a cold arrival on the visit after a warm one does.

6. **Green.**
   ```bash
   yarn validate
   ```
   Measured: `Test Suites: 188 passed, 188 total`, `Tests: 5179 passed, 5179 total`, and `100%` on Statements
   (4940), Branches (2145), Functions (1029) and Lines (4431). `modules/qiblaheading/index.ts` enters the measure
   at 100% from 0%, and `modules/widgetrefresh/index.ts` at the 100% its own suite already gave it.

7. **Breaks.** `bash ai/plans/53-qibla-accuracy-gate/scripts/breaks-3.sh`. Measured: `CAUGHT: 84 of 84`, then
   `ALL AS EXPECTED: 1`. It breaks, in the script's own order: the wave's constants, its arithmetic and what is
   counted from (19), the gate, its log and the close (16), a silent sensor (18), which phone reads what and what
   the other phones still do (10), and the binding (21).

8. **Version and commit.** As step 2, part 8. The commit goes through the hook.

9. **Device proof.** A mock build, `adb install -r`, on a phone the owner names.

   | Check | How | Proves |
   | --- | --- | --- |
   | The Kotlin compiles | `> Task :qiblaheading:compileReleaseKotlin`, `BUILD SUCCESSFUL` | Measured on a throwaway build before the commit |
   | One reader | `adb shell dumpsys sensorservice` with the sheet open: the app's uid holds no accelerometer or magnetometer connection | The rule of 2026-10-02 |
   | The sensor and the ceiling | Still on a desk: the hint for 10 seconds, then the compass | Not the attitude: the ceiling draws without it |
   | The attitude | `adb logcat` after any open: `turns` is a number, not `undefined` | The Kotlin key and the binding agree |
   | The wave | The owner's hands: a real wave draws well inside 10 seconds, a light shake does not | The only proof of the feature |

10. **Review.**

    - [ ] The four statements every other phone runs are the same four, in the same order, inside the `else`.
    - [ ] `grep -rn "watchQiblaDiagnostic\|QiblaDiagnostic\|fusedErrorDegrees"` over the app's code prints nothing.
    - [ ] Every test of the iPhone's gate passes with its assertions unedited, apart from `reportAccuracy` taking
          a number.
    - [ ] `python3 scripts/find-unused-exports.py` reports its five standing entries and nothing else.
    - [ ] No comment names a date, a session, an owner ruling or a file under `ai/`.
    - [ ] Nothing outside part 3's files changed. No visual changed.

11. **Merge.**
    ```bash
    git checkout uat-2 && git merge --no-ff refactor/qibla-readout-removed -m "..." \
      && git merge --no-ff feat/qibla-android-fused-wave \
      -m "Merge feat/qibla-android-fused-wave into uat-2: session 53 step 4, Android on Google's sensor alone behind a wave"
    ```

12. **Findings for the owner, NONE built.**

    1. **The iPhone has not run this build.** Its heading accuracy now reaches the gate through a rewritten
       binding. The suite proves the calls, their order and their receiver, and cannot prove a phone. The check
       is twenty seconds: indoors the compass should arrive in well under a second, as it does today. If every
       open takes three, the accuracy is not arriving.
    2. **The iPhone does one thing less per reading since step 3:** it no longer renders the sheet on every
       accuracy sample. It decides the same and it is not timing-identical.
    3. **Two leaks on every phone that reads `expo-location`, both older than this session.** A close and reopen
       while the first open still awaits the position strands the first heading watch, with the magnetometer
       armed for the life of the process. And `processReading` does not check that the sheet is open, so that
       stranded watch can open the gate, and tap, with the sheet closed. The window is the length of the position
       read: milliseconds with a cached fix, seconds without.
    4. **The watchdog of part 4.8.**
    5. **The five limits of part 4.3.**

13. **What the design review changed.** One independent reviewer, read-only, against the first draft of this file.
    Verdict: build after changes.

    | Finding | What was done |
    | --- | --- |
    | BLOCKER. A phone that reports the sensor and delivers nothing shows the hint for ever | Part 4.6, built and tested |
    | BLOCKER. `2 * acos` fails at exactly 30 and returns NaN for half of all real samples. A zero quaternion counts on every sample | Part 4.3: cosine space, a validity test first, fixtures in single precision |
    | BLOCKER. `shared/qiblaWave.ts` was listed as new, and exists | Found while building, which overwrote it for four minutes before `tsc` named it. Restored from git byte for byte, and the wave lives in `qiblaWaveGate.ts` |
    | The binding's native calls must stay attached, and nothing proved it | Part 4.9, and `mock.contexts` in its suite |
    | The measure is effort, not coverage | Part 4.3's five limits, for the owner. A coverage rule was NOT built: it would refuse a hard shake about one axis, which is the motion he was seen to make |
    | Two rows of the lifecycle table were wrong, and an overtaking open strands a listener | Part 4.5, rewritten, with the guard and its tests |
    | The reason given for declining a watchdog was a false choice | Part 4.8.1, corrected |
    | Tests whose fixtures would hide the bug | Part 5: a tilted start, a diagonal axis, single precision, `waved` at one heading, the unmount, the reopen during a read |
    | The desk check passes with the attitude missing | Part 4.7's log line, and part 9's table says which check proves what |

14. **Done when:** `yarn validate` passes, the break script ends `ALL AS EXPECTED: 1`, part 9's first four rows
    are measured, and the owner's wave has opened it.
