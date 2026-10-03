# What this session measured, and the three findings that changed the plan

Every number here came from replaying **this repository's own `shared/qiblaSettle.ts`** against a simulated
heading stream, 200 to 300 runs per cell, with `expo-location`'s own 50ms emission limit in the loop. The
probes are in `scripts/probes/`.

**Read this before `PLAN.md`.** Two of the row's own framing assumptions are refuted below, and the design
follows from the refutation rather than from the row's text.

---

## 1. The row's premise is wrong: 50Hz and the 3-second window are INDEPENDENT

The row asks whether the window could shrink because the patch raised the rate to 50Hz, and whether halving
the rate to 25Hz would let the window halve too. **Neither follows, and the reason is in the patch itself.**

`patches/expo-location+58.0.9.patch` removed the 2-degree gate and raised `SENSOR_DELAY_NORMAL` to `_GAME`.
It left `TIME_DELTA = 50f` in place, and that line is what decides how many readings the gate ever sees:

```kotlin
if (System.currentTimeMillis() - mLastUpdate > TIME_DELTA) {
```

So the gate sees at most ~14Hz no matter what the sensor does. Measured at the shipped 3000ms window:

| Sensor rate | Readings the gate receives | Gate opens at | Error it opens on |
| --- | --- | --- | --- |
| 50Hz (shipped) | 14.3Hz | 9703ms | 2.66 degrees |
| 25Hz | 11.1Hz | 9563ms | 2.76 degrees |
| 10Hz | 6.7Hz | 9692ms | 2.67 degrees |
| 5Hz (upstream default) | 4.0Hz | 9844ms | 2.58 degrees |
| 2Hz | 1.8Hz | never opens | - |

**Halving the rate changes the wait by 1.4%.** The rate buys SMOOTHNESS and nothing else, which is exactly
what row 50 measured on the device: experiment A at 5Hz was 🐋 "accurate, but no smooth at all". Dropping to
25Hz would cost smoothness and save no time at all.

**So the rate is not a lever on the wait, and this is now closed.**

## 2. "3 seconds" was never the wait. The wait is 9.7 seconds

`SETTLE_WINDOW_MS` is a measuring stick, not a timer: the gate opens once the heading's drift across a
trailing 3000ms window is under 1.5 degrees. On a cold fusion that takes **9.7 seconds**, not 3.

That is the number the owner is actually waiting through, and no document in this programme had stated it.

## 3. The window length is a real lever, and 3000ms is justified by the owner's OWN 4-degree rule

| Window | Animation goes at | Error, mean | Error, p95 |
| --- | --- | --- | --- |
| 500ms | 842ms | 24.35 | 26.61 |
| 1000ms | 3754ms | 11.80 | 13.35 |
| 1500ms | 5949ms | 6.81 | 8.01 |
| 2000ms | 7453ms | 4.67 | 5.51 |
| 2500ms | 8521ms | 3.58 | 4.02 |
| **3000ms (shipped)** | **9708ms** | **2.66** | **3.02** |
| 4000ms | 11302ms | 1.79 | 2.14 |
| 5000ms | 12735ms | 1.25 | 1.41 |

`ALIGNMENT_ENTER_DEGREES` is 4. The haptic fires when the phone is within 4 degrees of the bearing, so a
compass that appears already 5 degrees wrong can tell the user they are aligned when they are not.

**3000ms is the shortest window whose p95 error fits inside the owner's own alignment window.** At 2500ms the
p95 is 4.02, exactly on the boundary; at 2000ms it is 5.51 and the haptic becomes a lie. The constant was
never justified this way in writing, and now it is.

**Conclusion: the window does not shrink. It is not arbitrary and it is not 3 seconds of waste.**

---

## 4. THE GATE IS GAMEABLE ON PAPER, and the owner proved the paper does not reach the user

**Read `RESEARCH.md` Part 1 before this section.** Everything below measures the error **at the instant the
gate opens**, and the owner challenged exactly that: 🐋 "I've been shaking my phone during the animation with
every test that I do, and I don't really find myself being penalised." **He is right, and this section's
framing was wrong.** The gate latches, the fusion keeps converging, and the error at the moment the app
actually makes a claim (the alignment tap) is **0.70 degrees still against 0.73 waving**, with zero false taps
in 300 runs each.

So what follows is a real property of the gate's arithmetic and **not** a defect a user suffers in the
measured regime. It is kept because it bounds what the gate can promise, and because it is genuinely harmful
in one unconfirmed regime (a fusion time constant of 8000ms: 99.7% false taps, `RESEARCH.md` Part 1).

Row 50 measured that waving the phone opens the gate early and wrong (3.7s at 11.88 degrees against 9.7s at
2.98). **That figure has the same defect as mine and is corrected by the same measurement.** The broader
property is: **the shipped gate is defeated by ANY motion, and by NOISE, and the noise case means the error at
the moment it opens is already outside the owner's accuracy bar on a still phone.**

Worst case over jitter 0.5 to 3 degrees and convergence time constants 2000 to 6000ms, which is the range a
real phone spans:

| What the user does | Gate opens at (p95) | Error it opens on (p95) |
| --- | --- | --- |
| holds still | 12060ms | **9.69 degrees** |
| waves hard | 3780ms | **17.84 degrees** |
| waves 3s then holds still | 10440ms | **18.01 degrees** |
| hand sway, 12 degrees | 6000ms | **11.37 degrees** |
| hand tremor, 4 degrees | 6240ms | **16.14 degrees** |
| walks and turns | 3540ms | **17.14 degrees** |

The 2.66-degree figure in section 3 holds only at 0.5 degrees of jitter and a 4000ms time constant. Those
were the probe defaults session 48 used, and a real phone is not pinned to them.

**The mechanism, and it is the gate's own arithmetic.** `hasSettled` splits the window into TWO halves and
compares their means. Two failure modes follow directly:

1. **Oscillation averages away.** A hand's motion is roughly sinusoidal, and a sinusoid's two halves average
   alike, so drift reads near zero while the fusion is still far out.
2. **Noise HELPS the gate open.** Measured on a still phone at 3000ms: jitter 0.5 opens at 9705ms, jitter 3
   opens at **8030ms**, jitter 5 at **7453ms**. More noise means an earlier open at a higher error, which is
   the opposite of what a convergence test must do.

## 5. Two obvious fixes were measured and REJECTED

**A range cap beside the drift test.** Rejected: at a 15-degree cap a phone in a HAND never opens at all
(100% refused across every jitter level), and at a 25-degree cap a hand opens at 6.47 degrees of error, so no
cap separates a 60-degree wave from a 12-degree hand sway. The two overlap.

**More segments of the same window.** Measurably better on accuracy and still wrong: at 4 segments a still
phone opens at 1.80 degrees, but a hand tremor of 4 degrees is refused 100% of the time. Swept across both
knobs together (5 window lengths x 3 segment counts x 4 jitter levels), **exactly one cell meets the
4-degree bar, 3000ms x 4 segments, and it refuses a phone in a hand 100% of the time.**

**The general result, and it is the same shape as session 48's finding about hard iron:** a gate reading the
heading stream ALONE cannot separate the fusion's convergence from the user's own motion, because a slow user
turn and a slow fusion drift are the same signal. Session 48 wrote it about a stable bias; it is equally true
about motion.

## 6. THE DESIGN THE MEASUREMENTS POINT AT: a time floor, which reads nothing

A term that reads no readings cannot be gamed by any motion or any noise. The fusion's error decays on its
own time constant whatever the user does, so the AGE of the stream is a guarantee that holds for every
behaviour at once.

Worst p95 error across **all seven user behaviours** and the full jitter and time-constant sweep:

| Floor | Worst p95 error, any behaviour | Refused |
| --- | --- | --- |
| 3000ms | 18.20 degrees | 0% |
| 5000ms | 12.95 | 0% |
| 7000ms | 9.31 | 0% |
| 9000ms | 6.69 | 0% |
| 11000ms | 4.76 | 0% |
| **13000ms** | **3.43 degrees** | **0%** |

**13000ms is the shortest floor that holds the owner's 4-degree bar for every user behaviour**, and it never
refuses anyone, so it satisfies the fail-open rule by construction.

Keeping the drift test BESIDE the floor is what makes the common case fast: on a still phone the drift test is
already satisfied by the time the floor expires, so the floor binds and nothing is added to the wait. The
drift test still earns its place, because it catches a stream that is still visibly moving when the floor
expires.

**IT IS NOT SHIPPED IN THIS SESSION, and the reason is section 4's correction.** The floor buys worst-case
accuracy measured at the instant the gate opens, and the owner's own testing showed the user-experienced error
is already 0.70 degrees. A floor would add up to 3.5 seconds to every single open, on both phones he has judged
accurate (🐋 "They both work accurately 100%. I love it, very smooth, fantastic, amazing"), to fix a number no
user reads.

**It is the right fix for one regime, and that regime is unconfirmed:** a fusion converging on an 8000ms time
constant gives 99.7% false taps when the user waves (`RESEARCH.md` Part 1). Nothing has measured the real time
constant on either phone. **A later session that measures a slow fusion on the 3T ships this floor, and these
numbers are why.** Measuring that time constant is this session's device task.

## 7. The warm reopen is where the speed is, and it is FREE

An already-converged stream still pays 2700ms at the shipped window to re-prove what it already proved. A
reopen can instead be VERIFIED rather than assumed:

| Confirming readings | Tolerance | Draws at | Agrees every time |
| --- | --- | --- | --- |
| 3 | 2 degrees | 120ms | no |
| 5 | 3 degrees | 240ms | no |
| **8** | **3 degrees** | **420ms** | **yes** |

Eight readings at 3 degrees is the first cell that agrees on every single run across every jitter level, so
it is the first one that does not sometimes throw away a warm stream for no reason.

**And it refuses a phone that MOVED while the sheet was closed**, which is what makes it a verification rather
than an assumption:

| Phone moved by | First 8 readings agree within 3 degrees | What happens |
| --- | --- | --- |
| 0 degrees | yes | draws at once, correctly |
| 2 degrees | yes | draws at once, correctly (inside the tolerance) |
| 5 degrees | **no** | falls through to the full gate, correctly |
| 15, 40, 90 degrees | **no** | falls through to the full gate, correctly |

So a reopen in the same spot is near-instant at **zero accuracy cost**, and a reopen after the user has turned
or walked pays the full gate. That is the whole of the owner's "disappear as quick as possible", bought
without giving up a single degree.

---

## 8. What is now CLOSED and must not be re-investigated

| Question | The answer, measured |
| --- | --- |
| Can the rate drop to 25Hz to halve the wait? | No. The gate sees ~14Hz at any sensor rate, because `TIME_DELTA = 50f` survives the patch. Halving the rate changes the wait by 1.4% and costs smoothness. |
| Is 3000ms arbitrary? | No. It is the shortest window whose p95 error fits `ALIGNMENT_ENTER_DEGREES = 4`. |
| Is the window the thing to shorten? | No. Shortening it costs accuracy linearly and the owner ruled accuracy first. |
| Can a range or spread cap reject the wave? | No. It rejects a hand too. 100% refusal at a 15-degree cap. |
| Can more segments reject the wave? | Not without refusing a hand. One cell of 15 met the bar and refused a hand 100%. |
| Can any stream-only gate separate motion from convergence? | No, by construction. A slow turn and a slow drift are the same signal. |
| Is hard iron made better or worse by any of this? | Neither. Invisible to every gate shape tested, at 0, 5, 15 and 27 degrees. Out of scope, confirmed not regressed. |
| Does waving the phone penalise the user? | **No, in the measured regime.** 0.70 degrees still against 0.73 waving at the moment of the tap, zero false taps in 300 runs each. The owner caught this claim and was right (`RESEARCH.md` Part 1). |
| Should the hint ask for a FLAT phone instead? | **No.** A flat still phone leaves 497.6% of the hard-iron offset unremoved and a flat phone turning on the spot lies on a circle, which does not determine a sphere's centre. The figure of eight leaves 1.3%. NXP AN4246's own fit, run per gesture (`RESEARCH.md` Part 2). |
| Is the wave hint worth keeping? | **Yes**, and now on external evidence rather than assumption. It is the best gesture in the table and neither platform exposes a way to verify it, on iOS or Android (`RESEARCH.md` Parts 2 and 3). |
