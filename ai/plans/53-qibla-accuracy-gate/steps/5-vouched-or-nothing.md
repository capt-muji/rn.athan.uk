# Step 5: A heading nothing has vouched for is never drawn

Planned and executed by the same session on 2026-10-07, on the owner's rulings of that night. This file is the
specification the build satisfied, with the numbers it measured.

**His rulings, after he had tested step 4 on the OnePlus 3T and been advised against an unlimited wait:**

🐋  "The user must wave the phone. I don't care if they can't wave the phone... No, I will not make it 30 seconds,
because then I run the risk of showing a wrong location. I would rather not show at all. I don't want the burden of
showing the wrong location. This is extremely important. So, no, don't put a cap."

🐋  "On iPhone... remove the 3 second cap, okay? If it's within 30 degrees, perfect, we will take them straight to the
compass. Otherwise... we just keep showing the animation so they can shake the phone. You said some rooms may never
pass. Yes, exactly. That's fine."

🐋  "We will fade in a piece of text at the bottom... Could not find north, the first line. Second line, please try
standing in a different location... it should be the same colour as... move your phone like this."

🐋  "The vibration shouldn't be there unless it's been there for more than like 1 second." And, on being told that
budget phones with no gyroscope would then get no compass: 🐋  "Don't worry about the phones, budget phones... If it
works on the 1+3T, which is a really old phone, then that's it, that's our baseline."

**This step changes the iPhone, on his instruction.** It reverses his ruling of 2026-10-02 that this screen must
never lock, and it is the direction he gave on 2026-10-06 for a later session, brought forward.

0. **Anchor check.** From the repository root at `uat-2` with step 4 merged, each prints `1`:

   ```bash
   grep -c "if (!waved && waitedMs < WAVE_CEILING_MS) return;" hooks/useQibla.ts
   grep -c "if (!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs < CERTAINTY_CEILING_MS) return;" hooks/useQibla.ts
   grep -c "if (!showsCompass || arrivedWarm) return;" components/sheets/screens/Qibla.tsx
   ```

1. **Goal.** The compass is drawn only on a heading something has vouched for, and no length of waiting changes
   that. A user who is waiting on a phone that cannot be vouched for is told so. An arrival the user did not wait
   for is not announced.

2. **Branch.**
   ```bash
   git checkout -b feat/qibla-vouched-or-nothing uat-2
   ```

3. **Files.** Exactly these, apart from `app.json`, `package.json`, `ai/plans/README.md` and this plan folder:

   | File | What changes |
   | --- | --- |
   | `hooks/useQibla.ts` | Both ceilings leave the gate. The fallback of step 4 is deleted. `arrivedWarm` becomes `arrivedQuietly`. `lost` and its wait are added |
   | `components/sheets/screens/Qibla.tsx` | `QiblaLost`, its style, and the haptic's condition. One comment |
   | `shared/qiblaSettle.ts` | `CERTAINTY_CEILING_MS` is deleted |
   | `shared/qiblaWaveGate.ts` | `WAVE_CEILING_MS` is deleted |
   | `components/sheets/screens/__tests__/Qibla.test.tsx` | The ceilings' tests become their opposites. New describes for the report, the haptic and the unwaved phone. The fallback's tests go with it |
   | `shared/__tests__/qiblaSettle.test.ts`, `shared/__tests__/qiblaWaveGate.test.ts` | Each loses its ceiling's test |

   **Not touched:** the wave's arithmetic, the module binding, the Kotlin, the Swift, the patch, `QiblaCompass.tsx`,
   `QiblaWave.tsx`.

4. **Design.**

   **4.1 What vouches for a heading, and what draws.**

   | Phone | Draws when | Otherwise |
   | --- | --- | --- |
   | Android on Google's fused sensor | The user has waved it: eight turns of 30 degrees, this visit | The hint, for as long as it goes unwaved |
   | iPhone | It reports its heading within 15 degrees either way, OR a reopen meets the stream it left (unchanged) | The hint, and after five seconds the report |
   | Android with no fused sensor | Never. Nothing on it can vouch for a heading | The hint, and after five seconds the report |

   **4.2 The gate.**

   ```ts
   if (!settledRef.current) {
     const waitedMs = Date.now() - waitingSinceRef.current;

     if (fusedRef.current) {
       if (!hasWaved(waveRef.current)) return;
       logger.info('QIBLA: compass drawn after a wave', { waitedMs });
     } else {
       const remembered = warmHeadingRef.current;
       confirmRef.current = [...confirmRef.current, trueHeading];
       const arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);

       if (!arrivedWarm && !isCertain(accuracyRef.current)) return;
       arrivedQuietly = waitedMs < ARRIVAL_ANNOUNCE_MS;
     }
     settledRef.current = true;
     clearLost();
   }
   ```

   It still latches. `firstReadingAtRef` existed to count the ceilings and is deleted with them.

   **4.3 Step 4's fallback is deleted.** It handed a phone whose fused sensor stayed silent to the platform heading.
   With no ceiling, the platform heading on Android can never be drawn, because nothing there reports an accuracy.
   So the fallback would only arm the magnetometer for nothing. `fallBack`, `unwatchFallbackRef`, `visitRef`,
   `FUSED_SILENCE_MS` and the warning it logged are gone. Such a phone gets the report of 4.5.

   **4.4 The arrival the user feels.** `waitingSinceRef` holds when the hint last went up: at the open, and again
   when a drawn compass loses its heading. `ARRIVAL_ANNOUNCE_MS = 1000`.

   | Phone | The arrival haptic fires |
   | --- | --- |
   | Without the fused sensor | Only if the hint had been up for a second or more. Sooner, the hint could not be read and the tap lands as part of the sheet opening |
   | On the fused sensor | After every wave, however quick: its user is looking at the phone they are moving |

   This replaces `arrivedWarm`. A warm reopen is quiet because it is quick, which is the same reason, and one rule
   now covers a first open that is already certain, the case step 2 recorded and did not build.

   **4.5 North reported lost.** `LOST_AFTER_MS = 5000`. `awaitNorth()` sets `waitingSinceRef` and starts one
   timer. When it fires, `lost` is true and the sheet mounts:

   ```
   Could not find north
   Please try standing in a different location
   ```

   | Started by | Ended by |
   | --- | --- |
   | The open, once the permission is granted | The compass being drawn, which also clears `lost` |
   | A drawn compass losing its heading (`blank`) | A close, which also clears `lost` |
   | | On a fused phone, ANY sample arriving |

   The last row is deliberate: a fused phone that is delivering has not lost north. All it lacks is the wave, and
   the hint is already asking for that. It gets the report only if its sensor reports itself and delivers nothing.

   **Why five seconds and not his three seconds of shaking:** nothing reads a sensor to see the wave on a phone
   without the fused one, by the rule of 2026-10-02, so the app cannot know the user has shaken an iPhone. Five
   seconds from the hint appearing is about two to notice it and three of waving. He was told before it was built.

   **4.6 The two lines on the sheet.** Both in `styles.message`, the style of *Move your phone like this*, which is
   the colour he asked for. They sit in a view positioned absolutely at the foot of the stage, so the hint and its
   drawing do not move when they arrive, and the sheet does not resize. Mounted only while `lost`, with
   `FadeIn.duration(ANIMATION.durationMedium)`, as `Help.tsx` fades its own. Mounting is also what keeps a screen
   reader from announcing a failure that has not happened.

   **This is the one visual change of the row, and it is his, word for word.**

5. **Tests.** All in `Qibla.test.tsx`. The literals are `ANNOUNCE_AFTER_MS = 1000`, `LOST_AFTER_MS = 5000` and
   `A_LONG_WAIT_MS = 60_000`, written in the suite, because a test spending the constant it guards moves with it.

   | What it proves | Asserts |
   | --- | --- |
   | An unvouched heading is never drawn, however long | Bare headings, 60 seconds, no dial. And with an accuracy of 25.4 |
   | That same phone draws the moment it comes inside the bar | The pair that gives the two above their meaning |
   | An unwaved Android phone is never drawn, and time does not make up for a wave one turn short | 60 seconds, no dial, twice |
   | It draws the moment it is waved, however long it had waited | The pair again |
   | After a genuine loss, a phone unsure of the returned stream draws nothing | Accuracy 40 after the loss |
   | A certainty before the fix draws once the fix lands | |
   | A compass arriving at once, or at 999ms, is silent. At 1000ms it is felt | `notificationAsync` |
   | The second is counted from when the hint RETURNED after a loss | Silent at 999ms after the blank, felt at 1000ms |
   | A wave is felt however quick, a reopen included | Once each |
   | A quiet arrival does not silence the next visit's | A cold arrival after a warm one |
   | The report appears at 5000ms and not at 4999ms, in two lines, with the hint still up | The exact strings |
   | It appears on a phone that reports nothing at all | |
   | Both lines wear the colour of the line that asks for the wave | One colour compared with another, never with a value |
   | It is laid over the stage, not added to its column | `position: 'absolute'` |
   | It never appears once the compass is drawn, and goes when the compass is drawn | |
   | It is not said to a user who refused location | |
   | A close forgets it, stops its wait, and the next open waits its own five seconds | Three tests |
   | An overtaking open starts the wait afresh | |
   | A lost heading starts the wait afresh | |
   | On Android: said when the sensor is silent, never when it is delivering, and not when a sample beats it by 1ms | Three tests |
   | A garbled or missing attitude draws nothing and does not spoil the wave that follows | |
   | The log line carries how long the wave took | `{ waitedMs: 2500 }`, once |

6. **Green.**
   ```bash
   yarn validate
   ```
   Measured, after the review's fixes: `Test Suites: 188 passed, 188 total`, `Tests: 5198 passed, 5198 total`,
   and `100%` on Statements (4938), Branches (2153), Functions (1031) and Lines (4427).

7. **Breaks.** `bash ai/plans/53-qibla-accuracy-gate/scripts/breaks-4.sh`. Measured, after the review's fixes:
   `CAUGHT: 50 of 50`, then `ALL AS EXPECTED: 1`. Its first run printed `SURVIVED: a close does not end the wait`: the test meant to catch
   it reopened the sheet, and the reopen clears the wait itself. The test now lets the wait run on behind the
   CLOSED sheet, which is where leaving it armed does its harm.

8. **Version and commit.** As step 2, part 8. The commit goes through the hook.

9. **Device proof.** Mock builds of this commit, on phones the owner names.

   | Check | Who | Proves |
   | --- | --- | --- |
   | Android, still on a desk: the hint, and NO compass after 10 seconds or after 60 | This session | The ceiling is gone. No report either, because the sensor is delivering |
   | Android: a real wave draws the compass with a vibration | The owner | The feature |
   | iPhone, where it reads inside the bar: the compass in under a second, with no vibration | The owner | The binding still delivers the accuracy, and the quiet arrival |
   | iPhone, in the room that read 18 to 20: the hint, the two lines at five seconds, and whether waving ever brings the compass | The owner | Whether that room can pass at all |

10. **Review.**

    - [ ] No path draws a heading on time alone: `grep -n "CEILING" hooks/useQibla.ts shared/qibla*.ts` prints nothing.
    - [ ] `python3 scripts/find-unused-exports.py` reports its five standing entries and nothing else.
    - [ ] The two strings are exactly as he gave them.
    - [ ] No comment names a date, a session, an owner ruling or a file under `ai/`.
    - [ ] Nothing outside part 3's files changed.

11. **Merge.**
    ```bash
    git checkout uat-2 && git merge --no-ff feat/qibla-vouched-or-nothing \
      -m "Merge feat/qibla-vouched-or-nothing into uat-2: session 53 step 5, no heading is drawn unvouched"
    ```

12. **What this costs, stated so it is not discovered later.**

    1. **An iPhone in a room that reads outside 15 gets no compass there**, whatever the user does, and the two
       lines are all that says why. His room read 18 to 20 that night, and a cable beside a laptop once read 25.4.
    2. **An Android user whose wave turns the phone too little gets no compass.** A figure of eight drawn in the
       air with the screen kept facing the user barely turns it. The drawing shows a path, not a twist. He has said
       the animation changes in a later session.
    3. **An Android phone with no gyroscope, or no Play services, gets no compass at all**, and the second line,
       which asks the user to move, cannot help it. He ruled these phones out of scope.
    4. **A blind user is not told the report has appeared.** It is mounted for a screen reader to find, and nothing
       announces it.
    5. **The two leaks older than this session** (step 4, part 12.3) are still there on every phone that reads
       `expo-location`.

    6. **A fused phone that can never be waved gets the hint for ever and no report:** one whose attitude never
       arrives as an attitude, or whose sensor sends one sample and stops. The ceiling used to cover both.
    7. **The five seconds start when location is granted, not when the position is known.** On a first open with
       no cached fix, a user can be told north could not be found while only the position is missing.
    8. **A certainty held from before a genuine loss still draws the first heading back** (step 2's first finding).
       `blank()` does not clear it. The owner stopped that edit once, on 2026-10-06, and it is his to rule on again
       now that nothing unvouched is meant to be drawn.

13. **What the code review changed.** One independent reviewer, read-only against `7b45fda0`. Verdict: pass with
    findings, no blocker, and no timer, ceiling or fallback can draw a heading any more.

    | Finding | What was done |
    | --- | --- |
    | `blank()` restarted both waits on every gap, drawn or not: a stream that keeps reporting no heading would never be shown the report, and its arrival would pass for a quick one | Restarted only when a compass was drawn. Two tests, two breaks |
    | A fused sample that arrived after the report left the report up | It is taken back. A test, a break |
    | With no ceiling the list a warm reopen is judged on grew for as long as the hint was up, copied whole on every reading | Kept to the latest eight. A test that counts them, a break |
    | A reading from a watch that outlived its close could draw, tap and announce behind the closed sheet, and leave the next open drawn from its first frame | `processReading` returns at once on a closed sheet. A test, a break. The magnetometer half of that leak remains |
    | The report could sit over a drawn compass if a second open found one | It is rendered only beside the hint. A test, a break |
    | "At the bottom" and the order of the two lines were pinned by nothing | Both asserted, both broken |
    | A test the new rule had made a duplicate of its neighbour | Deleted |

    After those fixes the break script's next run printed three survivors, each a wait or a report left standing
    behind a drawn compass or a permission prompt, where the sheet no longer shows it. Each is seen later, when
    the hint returns, so each now has a test that waits for that.

14. **Done when:** `yarn validate` passes, the break script ends `ALL AS EXPECTED: 1`, part 9's first row is
    measured, and the owner has judged the other three.
