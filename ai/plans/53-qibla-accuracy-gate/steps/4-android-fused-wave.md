# Step 4: Android reads Google's sensor alone, and waits for a wave

Planned and executed by the same session on 2026-10-07. This file is the specification the build satisfied, with
the numbers it measured.

**The owner's ruling, 2026-10-07, after testing three builds on the Samsung S23 and the OnePlus 3T that night:**
🐋  "We should go completely Google-based... No basic compass reading at all, completely Google based and always
shake the phone. Remove the 15 degrees gate." 🐋  "This is only for the Android, okay? The iOS is perfectly fine."

**What he tested, which is why:**

| Build | What read the heading | What he found |
| --- | --- | --- |
| 1.29.249 | The basic compass AND Google's sensor, side by side | Jittery, wrong, `fused error 180`, always the ceiling |
| Prototype B | Google's sensor alone | Right and steady once the phone had been shaken. 220 for 120 before that. The error figure never passed 15 and did not follow the truth (`MEASURED.md` of this step, in `LOG.md`) |
| Prototype C | The basic compass alone | 🐋  "Horrible... a slight change in direction makes it spin about 50 degrees" |

0. **Anchor check.** From the repository root, each prints `1`:

   ```bash
   grep -c "unwatchDiagnosticRef.current = watchQiblaDiagnostic((diagnostic) => {" hooks/useQibla.ts
   grep -c "if (!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs < CERTAINTY_CEILING_MS) return;" hooks/useQibla.ts
   grep -c "export const watchQiblaDiagnostic" modules/qiblaheading/index.ts
   ```

1. **Goal.** On an Android phone that carries Google's Fused Orientation Provider, that sensor is the ONLY thing
   that reads the heading, and the compass is drawn once the user has waved the phone. The iPhone, and an Android
   phone without the sensor, behave exactly as they did before this step.

2. **Branch.**
   ```bash
   git checkout -b feat/qibla-android-fused-wave uat-2
   ```

3. **Files.** Exactly these, apart from `app.json`, `package.json`, `ai/plans/README.md` and this plan folder:

   | File | What changes |
   | --- | --- |
   | `shared/qiblaWave.ts` | NEW. The wave, as pure arithmetic over the phone's attitude |
   | `shared/__tests__/qiblaWave.test.ts` | NEW |
   | `modules/qiblaheading/index.ts` | `watchQiblaDiagnostic` and `QiblaDiagnostic` are replaced by `hasFusedHeading`, `watchFusedHeading` and `watchHeadingAccuracy` |
   | `modules/qiblaheading/__tests__/index.test.ts` | NEW. The binding had no suite and stood at 0% |
   | `modules/qiblaheading/android/.../QiblaHeadingModule.kt` | Each sample carries the heading and the attitude. The two error figures are no longer sent |
   | `hooks/useQibla.ts` | One branch at the watch and one at the gate, both on whether the phone carries the fused sensor |
   | `components/sheets/screens/Qibla.tsx` | Comments only: the hint's comment said nothing measures the wave |
   | `components/sheets/screens/__tests__/Qibla.test.tsx` | The module's mock follows its new surface. The Android cone's three tests go with the cone. New describes for a fused phone |
   | `device/qibla.ts` | One comment that stopped being true when the patch removed the 2 degree gate |
   | `jest.config.js` | `modules/**/*.{ts,tsx}` joins `collectCoverageFrom` |
   | `scripts/check-changed-coverage.js` | `modules/` leaves `UNMEASURED`, because its JavaScript is now measured |

   **Not touched:** `modules/qiblaheading/ios/`, `patches/expo-location+58.0.9.patch`, `shared/qiblaSettle.ts`,
   `QiblaCompass.tsx`, `QiblaWave.tsx`, every style and every string the user reads.

4. **Design.**

   **4.1 Who reads the heading.** The choice is made by what the native module exposes, never by `Platform.OS`,
   which is how this path has worked since session 47:

   | Phone | `hasFusedHeading()` | Heading from | Gate |
   | --- | --- | --- | --- |
   | iPhone | false: the Swift side has no `isFusedOrientationAvailable` | `expo-location`, as before | warm, or accuracy within 15, or 3000ms. Unchanged |
   | Android with Play services, an accelerometer, a gyroscope and a magnetometer | true | Google's sensor ONLY. `watchHeading` is never called | the wave, or 10000ms |
   | Android without one of those | false | `expo-location`, as before | 3000ms, since nothing there reports an accuracy. Unchanged |

   The third row is why the basic compass is not deleted: without it a phone with no Play services, or no
   gyroscope, would have no qibla at all.

   **4.2 The path of one sample on a fused phone.**

   ```
   Google Play services  ->  QiblaHeadingModule.kt emit()  ->  'onFusedOrientation' { headingDegrees, attitude }
     ->  modules/qiblaheading watchFusedHeading  ->  hooks/useQibla:
           waveRef.current = advanceWave(waveRef.current, attitude)
           processReading(headingDegrees)
   ```

   `processReading` is the same function the iPhone's readings pass through. One sensor, one subscription, one
   listener: nothing else registers a sensor while the sheet is open, which is the rule of 2026-10-02 (`ai/AGENTS.md`).

   **4.3 The wave.** `shared/qiblaWave.ts`:

   ```ts
   export type Attitude = readonly [number, number, number, number];
   export type Wave = { from: Attitude; turns: number };

   export const WAVE_TURN_DEGREES = 30;
   export const WAVE_TURNS = 8;
   export const WAVE_CEILING_MS = 10_000;

   export const advanceWave = (wave: Wave | null, attitude: Attitude): Wave
   export const hasWaved = (wave: Wave | null): boolean
   ```

   `advanceWave` holds the attitude the phone was last counted at. When the phone has turned `WAVE_TURN_DEGREES`
   or more away from it, by ANY axis, that is one turn and the new attitude becomes the one counted from.
   Anything less returns the same object. `hasWaved` is `turns >= WAVE_TURNS`.

   The angle between two attitudes is `2 * acos(|a . b|)`, the dot product of the two quaternions. It needs no
   convention: it is the same whichever frame Google rotates from, and `q` and `-q` are the same attitude.

   | Rule | Why it is that shape |
   | --- | --- |
   | Measured from the attitude Google already sends | No second sensor reader. The shake gate of 2026-10-02 read the accelerometer beside the compass and the dial lagged |
   | A turn must reach 30 degrees from the last counted attitude | The owner's question: 🐋  "What if they shake it very lightly and it does nothing?" A light shake wobbles inside the 30 degrees and never counts, however long it lasts. Hand tremor and walking sit well inside it too |
   | Counted from the last COUNTED attitude, not the last sample | So the count does not depend on the sample rate, and a slow steady turn still adds up |
   | Any axis | A user copying the drawing twists, tilts and swings the phone. Requiring one kind of motion would refuse people who are doing what they were asked |
   | Eight turns, 240 degrees in all | More than picking the phone up (one or two turns) and less than two seconds of a real figure of eight. The owner's own shake in the recording of 2026-10-07 moved the heading 60 to 170 degrees every quarter second |
   | 10000ms, then the compass draws anyway | The owner's ruling of 2026-10-02 stands: 🐋  "we don't want to lock it". A user who cannot wave, or a phone whose attitude never moves, still gets a compass |

   **The numbers are engineering judgement, not measurement.** No phone has run this gate. They are constants, each
   tested each side, so the owner's hands can move them.

   **What it cannot do, stated plainly:** it proves the user turned the phone about. It does not prove Google's
   sensor corrected itself, which nothing in the app can see. In the recording the needle still crept from 140
   to 120 for five seconds after the shake ended. The gate latches, so the dial follows it there.

   **4.4 The gate.** In `processReading`, the one place a reading is refused:

   ```ts
   if (!settledRef.current) {
     const waitedMs = nowMs - firstReadingAtRef.current;

     if (fusedRef.current) {
       if (!hasWaved(waveRef.current) && waitedMs < WAVE_CEILING_MS) return;
     } else {
       // the three lines the iPhone runs today, moved inside this branch and otherwise untouched
     }
     settledRef.current = true;
   }
   ```

   On a fused phone there is **no warm reopen and no certainty**: every open needs its own wave, as the owner said
   (🐋  "Every time they want to see the compass, they will have to shake"), and Google's error figure is not read at
   all. `arrivedWarm` stays false there, so the arrival haptic the sheet already fires announces every wave, which
   is the vibration he asked for.

   **4.5 Lifecycle, traced.**

   | Moment | What happens | Why it is safe |
   | --- | --- | --- |
   | `start()` | `fusedRef` is set. The fused watch is stored in `unwatchNativeRef` SYNCHRONOUSLY, as the accuracy watch always was | `stop()` can end it at any instant, before or after any `await` |
   | A sample before the position is known | The wave advances. `processReading` starts the ceiling and returns at `bearing === null` | A slow fix costs the user nothing: the wave they have already made is kept |
   | The wave completes | The next sample passes the gate, latches it and draws | |
   | `stop()` | The watch is removed, `waveRef` is cleared, `settledRef` and `firstReadingAtRef` reset as today | The next open starts at zero turns |
   | Close and reopen at once | Native `stop` then `start` are queued in that order, and `startFusedOrientation` clears any listener first | One listener at a time |
   | `start()` awaits while the sheet closes | The fused path holds no promise to resolve late. `unwatchPromise` is an already resolved no-op there | The existing check after the awaits still runs and does nothing |

   **4.6 What this step deliberately does not build.**

   1. **No watchdog for a sensor that goes silent.** `expo-location` reports a lost heading as -1 and the dial
      blanks after 1500ms. Google's sensor has no such reading, so if it stopped mid-visit the dial would hold its
      last angle. Prototype B, the build the owner chose, had none, and a watchdog that blanked on a 1500ms gap
      would demand a second wave after any hiccup on a slow phone. Recorded for his decision.
   2. **No wait for the needle to stop creeping** after the wave. That is a settling gate, which sessions 50 and 52
      measured cannot tell a user's turn from a sensor's drift.
   3. **No change to the hint, its words or its drawing.**

   **4.7 The binding.** `modules/qiblaheading/index.ts`:

   | Export | Shape | A phone without that native side |
   | --- | --- | --- |
   | `hasFusedHeading` | `() => boolean` | `false` |
   | `watchFusedHeading` | `(onReading: (reading: FusedHeading) => void) => () => void` | Subscribes to nothing, returns a no-op |
   | `watchHeadingAccuracy` | `(onReading: (accuracyDegrees: number) => void) => () => void` | Subscribes to nothing, returns a no-op |

   `FusedHeading` is `{ headingDegrees: number; attitude: Attitude }`. Each returned function is synchronous and
   runs once, as today's is. The lazy `require('expo')` stays, for the reason its comment gives.

   **4.8 Kotlin.** `emit` sends `headingDegrees` and `attitude`, the latter as a list of four doubles from
   `DeviceOrientation.getAttitude()` (confirmed in the 21.4.0 class with `javap`). `headingErrorDegrees` and the
   conservative cone are no longer read. Nothing else in the file changes.

5. **Tests.**

   **`shared/__tests__/qiblaWave.test.ts`.** Fixtures are attitudes built from an axis and an angle, so every
   number in a test is a number of degrees a reader can picture:

   | What it proves | Inputs | Asserts |
   | --- | --- | --- |
   | The first sample only sets where counting starts | flat | `turns` 0 |
   | A turn one degree short does not count | flat, then 29 about the long axis | `turns` 0, same object |
   | A turn of exactly the step counts | flat, then 30 | `turns` 1 |
   | Counting restarts from the counted attitude | flat, 30, 59 | `turns` 1 (59 is 29 from 30) |
   | A slow steady turn adds up across samples | 0 to 90 in steps of 10 | `turns` 3 |
   | A wobble never counts, however long | 0 and 28 alternating, 200 samples | `turns` 0 |
   | Each axis counts | 30 about each of the three axes, as a table | `turns` 1 |
   | An attitude and its negative are one attitude | flat, then flat negated | `turns` 0 |
   | The wave is complete at eight turns and not at seven | literal 7 and 8 | `hasWaved` false, true |
   | No wave before any sample | `null` | false |
   | The ceiling as a literal | | `10000` |

   **`modules/qiblaheading/__tests__/index.test.ts`.** `jest.isolateModules` with `expo` mocked, as
   `modules/widgetrefresh/__tests__/index.test.ts` does: the lookup is cached; each watch subscribes to its own
   event, starts its own native side and forwards its own payload; the returned function removes and stops once
   however often it is called; and each of the three exports is inert when the module, its emitter, or that
   platform's native side is absent.

   **`Qibla.test.tsx`.** The module's mock gains `mockState.fused`, false by default, so every existing describe
   runs as the iPhone. `reportAccuracy` takes the number the binding now passes. A helper `reportFused(heading,
   attitude)` delivers one sample and `waveThePhone(turns)` delivers that many 30 degree turns.

   | What it proves, on a fused phone | Asserts |
   | --- | --- |
   | Google's sensor is the only reader | `watchFusedHeading` once. `watchHeading` and `watchHeadingAccuracy` never |
   | A phone without it runs as before | `watchHeading` and `watchHeadingAccuracy` once. `watchFusedHeading` never |
   | A still phone draws nothing | 50 samples at one attitude, no dial |
   | Eight turns draw, seven do not | literals |
   | A light shake draws nothing | 200 samples wobbling 28 degrees, no dial |
   | The ceiling draws an unwaved phone at 10000ms and not at 9999ms | literals |
   | The wave made before the fix arrives is kept | position held, wave, position released, one sample: dial |
   | Every open needs its own wave | wave, close, reopen, 8 samples at the heading it left: no dial |
   | The gate latches | after the wave, a still phone's next heading turns the dial |
   | The heading is drawn untouched | first frame at `-95deg` for a heading of 95 |
   | The arrival haptic fires on every open, reopen included | `notificationAsync` after a reopen and its wave |
   | The alignment tap works | one `impactAsync` on crossing the line |
   | Closing stops the sensor | the stop function once |

6. **Green.**
   ```bash
   yarn validate
   ```
   Measured: recorded in `LOG.md`, step 4. `modules/qiblaheading/index.ts` enters the measure at 100% from 0%.

7. **Breaks.** `bash ai/plans/53-qibla-accuracy-gate/scripts/breaks-3.sh`. Its last line must read
   `ALL AS EXPECTED: 1`.

8. **Version and commit.** As step 2, part 8. The commit goes through the hook.

9. **Device proof.** A mock build, `adb install -r`, on a phone the owner names. With the phone still on a desk
   the sheet must show the hint for 10 seconds and then draw, which proves the sensor, the binding and the
   ceiling without hands. The wave itself is the owner's test.

10. **Review.**

    - [ ] The iPhone's three gate terms are the same three, in the same order, inside the `else`.
    - [ ] `grep -rn "watchQiblaDiagnostic\|QiblaDiagnostic\|fusedErrorDegrees"` over the app's code prints nothing.
    - [ ] Every test of the iPhone's gate passes with its assertions unedited.
    - [ ] `python3 scripts/find-unused-exports.py` reports its five standing entries and nothing else.
    - [ ] No comment names a date, a session, an owner ruling or a file under `ai/`.
    - [ ] Nothing outside part 3's files changed. No visual changed.

11. **Merge.**
    ```bash
    git checkout uat-2 && git merge --no-ff feat/qibla-android-fused-wave \
      -m "Merge feat/qibla-android-fused-wave into uat-2: session 53 step 4, Android on Google's sensor alone behind a wave"
    ```

12. **Done when:** `yarn validate` passes, the break script ends `ALL AS EXPECTED: 1`, and part 9's desk check
    draws at the ceiling.
