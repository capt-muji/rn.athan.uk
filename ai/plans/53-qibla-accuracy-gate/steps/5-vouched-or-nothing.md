# Step 5: A heading nothing has vouched for is never drawn

2026-10-07, on the owner's rulings of that night. Specification of the LOCKED gate. Planned and executed by the
same session.

**His rulings, after he had tested step 4 on the OnePlus 3T and been advised against an unlimited wait:**

🐋  "The user must wave the phone. I don't care if they can't wave the phone... No, I will not make it 30 seconds,
because then I run the risk of showing a wrong location. I would rather not show at all. I don't want the burden of
showing the wrong location. This is extremely important. So, no, don't put a cap."

🐋  "On iPhone... remove the 3 second cap, okay? If it's within 30 degrees, perfect, we will take them straight to the
compass. Otherwise... we just keep showing the animation so they can shake the phone. You said some rooms may never
pass. Yes, exactly. That's fine."

🐋  "We will fade in a piece of text at the bottom... Could not find north, the first line. Second line, please try
standing in a different location... it should be the same colour as... move your phone like this."

🐋  "The vibration shouldn't be there unless it's been there for more than like 1 second." And, on budget phones
with no gyroscope then getting no compass: 🐋  "Don't worry about the phones, budget phones... If it works on the
1+3T, which is a really old phone, then that's it, that's our baseline."

**This step changes the iPhone, on his instruction.** It reverses his ruling of 2026-10-02 that this screen must
never lock, and it is the direction he gave on 2026-10-06 for a later session, brought forward.

1. **Goal.** The compass is drawn only on a heading something has vouched for, and no length of waiting changes
   that. A user waiting on a phone that cannot be vouched for is told so. An arrival the user did not wait for is
   not announced.

2. **Files.** `hooks/useQibla.ts` (both ceilings leave the gate; step 4's fallback deleted; `arrivedWarm` becomes
   `arrivedQuietly`; `lost` and its wait added), `components/sheets/screens/Qibla.tsx` (`QiblaLost`, its style, the
   haptic's condition), `CERTAINTY_CEILING_MS` and `WAVE_CEILING_MS` deleted with their tests, the suites rewritten.
   NOT touched: the wave's arithmetic, the module binding, the Kotlin, the Swift, the patch, `QiblaCompass.tsx`,
   `QiblaWave.tsx`.

3. **Design.**

   **4.1 What vouches for a heading, and what draws.**

   | Phone | Draws when | Otherwise |
   | --- | --- | --- |
   | Android on Google's fused sensor | The user has waved it: eight turns of 30 degrees, this visit | The hint, for as long as it goes unwaved |
   | iPhone | It reports its heading within 15 degrees either way, OR a reopen meets the stream it left (unchanged) | The hint, and after five seconds the report |
   | Android with no fused sensor | Never. Nothing on it can vouch for a heading | The hint, and after five seconds the report |

   **4.2 The gate** (in `processReading`, still latching; `firstReadingAtRef` deleted with the ceilings):

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

   **4.3 Step 4's fallback is deleted** (an hour after it was built and reviewed, with its tests):
   `fallBack`, `unwatchFallbackRef`, `visitRef`, `FUSED_SILENCE_MS` and its warning. With no ceiling, the platform
   heading on Android can never be drawn — nothing there reports an accuracy — so the fallback would only have
   armed the magnetometer for nothing. A phone whose fused sensor never delivers gets the report of 4.5.

   **4.4 The arrival the user feels.** `waitingSinceRef` holds when the hint last went up: at the open, and again
   when a drawn compass loses its heading. `ARRIVAL_ANNOUNCE_MS = 1000`. Without the fused sensor, the haptic fires
   only if the hint had been up a second or more (sooner, the hint could not be read and the tap lands as part of
   the sheet opening). On the fused sensor, after every wave however quick — its user is looking at the phone they
   are moving. This replaces `arrivedWarm`: a warm reopen is quiet because it is quick, the same reason, and one
   rule now covers a first open that is already certain.

   **4.5 North reported lost.** `LOST_AFTER_MS = 5000`. `awaitNorth()` sets `waitingSinceRef` and starts one
   timer; when it fires, `lost` is true and the sheet mounts:

   ```
   Could not find north
   Please try standing in a different location
   ```

   Started by: the open once permission is granted; a drawn compass losing its heading (`blank`). Ended by: the
   compass being drawn (which also clears `lost`); a close (which also clears `lost`); on a fused phone, ANY sample
   arriving. The last row is deliberate: a fused phone that is delivering has not lost north — all it lacks is the
   wave, and the hint is already asking for that. It gets the report only if its sensor reports itself and delivers
   nothing. **Why five seconds and not his three of shaking:** nothing reads a sensor to see the wave on a phone
   without the fused one (the rule of 2026-10-02), so the app cannot know an iPhone was shaken. Five seconds from
   the hint appearing is about two to notice it and three of waving. He was told before it was built.

   **4.6 The two lines on the sheet.** Both in `styles.message` — the style of *Move your phone like this*, the
   colour he asked for — in a view positioned absolutely at the foot of the stage, so the hint and its drawing do
   not move when they arrive and the sheet does not resize. Mounted only while `lost`, with
   `FadeIn.duration(ANIMATION.durationMedium)`, as `Help.tsx` fades its own. Mounting is also what keeps a screen
   reader from announcing a failure that has not happened. **This is the one visual change of the row, and it is
   his, word for word.**

4. **Tests.** Literals `ANNOUNCE_AFTER_MS = 1000`, `LOST_AFTER_MS = 5000`, `A_LONG_WAIT_MS = 60_000` in the suite.
   The unvouched heading is never drawn however long (60s; and at accuracy 25.4), and the pair that shows the same
   phone draws the moment it enters the bar. An unwaved Android phone is never drawn and time does not make up a
   wave one turn short (twice at 60s); it draws the moment it is waved. After a genuine loss, an unsure stream
   draws nothing (accuracy 40); a certainty before the fix draws once the fix lands. An arrival at once or at
   999ms is silent; at 1000ms it is felt; the second is counted from when the hint RETURNED after a loss. A wave is
   felt however quick, a reopen included; a quiet arrival does not silence the next visit's. The report appears at
   5000ms and not 4999, in two lines, hint still up; on a phone that reports nothing at all; in the wave-hint
   colour; absolutely positioned; never once the compass is drawn, and gone when it is; not to a user who refused
   location; forgotten by a close, which stops the wait, the next open waiting its own five seconds; an overtaking
   open and a lost heading each start the wait afresh. On Android: said when the sensor is silent, never when it is
   delivering, not when a sample beats it by 1ms. A garbled or missing attitude draws nothing and does not spoil
   the wave that follows. The log line carries `{ waitedMs: 2500 }`, once.

5. **Green.** After the review's fixes: 188 suites, 5198 tests, 100% on Statements (4938), Branches (2153),
   Functions (1031), Lines (4427). Breaks: `CAUGHT: 50 of 50`, `ALL AS EXPECTED: 1`. First run printed
   `SURVIVED: a close does not end the wait` — the test meant to catch it reopened the sheet, and the reopen clears
   the wait itself; it now lets the wait run on behind the CLOSED sheet, which is where leaving it armed does its harm.

6. **Commit.** `7b45fda0`, 1.29.255, through the hook. Mock build md5-equal on the 3T
   (`950a63277c5c65eb27aba9e067415f4d`); the XS installed from the same commit and kept beside the other two apps
   for the eight-second swap. **1.29.256** (`47596764`) carries the review's four fixes; built and installed on the
   3T and XS before the owner tested (md5 `8ada4abeb263635099f7bed7ca6bcd98`).

7. **Device proof.** Android still on a desk: the hint and NO compass after 10 and after 60 seconds — the ceiling
   is gone; no report either, because the sensor is delivering (measured by the session at 1.29.255: 14s and 30s,
   no log line, `dumpsys` still one reader). A real wave draws with a vibration: the owner. iPhone inside the bar:
   compass in under a second, no vibration: the owner. iPhone in the room that read 18 to 20: the hint, the two
   lines at five seconds, whether waving ever helps: the owner.

8. **Review checklist.** `grep -n "CEILING" hooks/useQibla.ts shared/qibla*.ts` prints nothing (no path draws on
   time alone); the five standing entries and nothing else; the two strings exactly as he gave them; no comment
   names a date, session, ruling or `ai/` file; nothing outside part 2's files changed.

9. **What this costs, stated so it is not discovered later (12):**

    1. **An iPhone in a room that reads outside 15 gets no compass there**, whatever the user does, and the two
       lines are all that says why. His room read 18 to 20 that night; a cable beside a laptop once read 25.4.
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

10. **What the code review changed (13).** One independent reviewer, read-only against `7b45fda0`. Verdict: pass
    with findings, no blocker, and no timer, ceiling or fallback can draw a heading any more.

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

**Done when:** `yarn validate` passes, the break script ends `ALL AS EXPECTED: 1`, the desk check is measured, and
the owner has judged the rest. He did: **accepted on three phones, 2026-10-07, both platforms locked** (`AUDIT.md`).
