# Should a user wave the phone before a compass reading? Both platforms, from the sources

The owner challenged a claim this session made, and asked for outside evidence rather than this app's own
numbers: does waving a phone before a compass reading help or hurt, **in general**, on **both platforms**?

Two separate questions came out of it, and they have different answers.

---

## PART 1. The owner was RIGHT, and my claim was wrong as a statement about what a user experiences

**What I claimed:** "a user who obeys the wave hint gets the gate opening at 3.7s with 11.88 degrees of error
against 9.7s and 2.98 for someone who ignores it. The animation rewards impatience with a 4x worse reading."

**His challenge:** 🐋 "I've been shaking my phone during the animation with every test that I do, and I don't
really find myself being penalised... are you sure about this?"

**He is right. The claim measures the error at the INSTANT THE GATE OPENS, which is not a moment the user acts
on.** Simulating the whole visit, including the user noticing the compass, turning onto the line at 45 deg/s
and the fusion continuing to converge throughout (`scripts/probes/probe-felt.mjs`, 300 runs):

| What the user does | Gate opens at | Error AT OPEN | **True error when the app says "aligned"** | False taps |
| --- | --- | --- | --- | --- |
| holds still | 9465ms | 2.84 degrees | **0.70 degrees** | 0.0% of 300 |
| waves | 9338ms | 3.03 degrees | **0.73 degrees** | 0.0% of 300 |

**0.70 against 0.73 degrees. There is no penalty, and the owner's own hands were the better instrument.**

**Why, and it is in this repository's own code.** The gate **latches** (`settledRef.current = true`,
`hooks/useQibla.ts:130`), so once it opens every later reading flows to the dial, and the fusion keeps
converging whether the gate is open or shut. A user who opens early does not get a wrong ANSWER; they get a
dial that is still settling as it appears, and the seconds they spend turning toward the qibla are seconds the
fusion spends converging. By the moment that matters, the haptic, both users are in the same place.

**The lesson, and it generalises past this feature: "error at the instant a gate opens" is not a user-facing
quantity.** The user-facing quantity is the error at the moment the app makes a claim, which here is the tap.
Measuring the convenient moment instead of the decisive one produced a confident wrong conclusion, and row 50's
own figure has the same defect, so this correction applies to it too.

### The one regime where waving genuinely does harm, recorded rather than buried

| Fusion time constant | Still: error when aligned | Waving: error when aligned | Waving: false taps |
| --- | --- | --- | --- |
| 2000ms | 2.20 to 3.40 degrees | 0.71 to 2.80 | 0.0% |
| 4000ms | 0.70 to 1.93 | 0.73 to 2.07 | 0.0 to 2.3% |
| **8000ms** | 1.78 to 5.24 | **10.33 to 17.22** | **99.7%** |

On a phone whose fusion converges slowly, waving does hurt, badly. Nothing in this programme has measured the
real time constant on either of the owner's phones, so this regime is **unconfirmed rather than ruled out**,
and it is the honest reason not to call the matter closed.

---

## PART 2. The figure of eight is the CORRECT gesture, and "hold it flat" cannot calibrate at all

The owner asked whether the hint should ask for a flat phone instead, with a new flat animation. **The
arithmetic says no, and it is not a close call.**

### The criterion, from the industry reference

NXP (Freescale) AN4246 Rev 4.0, *Calibrating an eCompass in the Presence of Hard- and Soft-Iron Interference*,
section 6, states the requirement outright:

> "ten magnetometer measurements made at the same orientation will be identical apart from sensor noise and
> will not lead to a quality solution. The standard approach is to use the accelerometer sensor to select
> magnetometer measurements for calibration taken at significantly different roll and pitch angles."

Hard-iron calibration fits the **centre of a sphere** to magnetometer samples (AN4246 equations 21 to 37). So
the gesture's whole job is to put samples on enough of that sphere to determine its centre.

### Running AN4246's own least-squares fit against each candidate gesture

London's field (19.4 uT horizontal, 45.2 uT vertical), a 9.9 uT hard-iron offset, 0.3 uT sensor noise, 60
samples per gesture (`scripts/probes/probe-flat.mjs`):

| Gesture | Offset left unremoved | Heading error it costs |
| --- | --- | --- |
| **held flat and still** | **497.6%** | 12.34 degrees |
| flat, turned full circle | 449.7% | 0.04 degrees |
| flat, turned, slight tilt (5 degrees) | 48.2% | 0.09 degrees |
| tilted up and down only | 197.2% | **176.90 degrees** |
| **figure of eight** | **2.8%** | 0.05 degrees |
| **wrist roll, figure of eight** | **1.3%** | 0.11 degrees |
| tumbled every which way | 1.2% | 0.04 degrees |

**The geometry behind it, which is why no amount of flat holding can substitute.** Samples from one attitude
are a single point. Samples from a flat phone turning on the spot lie on a **circle**, and a circle lies on
infinitely many spheres, so the centre is undetermined along the circle's own axis. **Tilting is the only
thing that closes that degree of freedom**, which is exactly what AN4246 means by "significantly different
roll and pitch angles". The shipped animation already asks for a wrist that rolls, and that is the best cell
in the table at 1.3%.

**An honest subtlety that cuts the other way, and it is why the owner's instinct is not foolish.** "Flat,
turned full circle" leaves 449.7% of the offset unremoved and still costs only **0.04 degrees of heading
error**, because the unremoved part is almost entirely in the Z axis, and a compass reads only the HORIZONTAL
field. So turning a flat phone in a circle is a genuinely useful gesture for a FLAT-HELD compass even though
it calibrates badly. What it does not survive is the user then tilting the phone, which every real user does.
And "tilted up and down only" is the trap in the table: 176.90 degrees of heading error, a compass pointing
almost exactly backwards, from a gesture that feels like diligent calibration.

**Conclusion: keep the figure of eight. Do not replace it with a flat hint.** A flat-and-still hint would ask
the user to perform the one gesture in the table that cannot work, and the drawing already shows the one that
works best.

---

## PART 3. Both platforms, compared, from each platform's own headers on this machine

The owner asked specifically for a platform comparison rather than an Android-only answer.

| | iOS (CoreLocation) | Android (SensorManager) |
| --- | --- | --- |
| Does the OS estimate hard iron continuously? | Yes, and it is a user-visible system service (Settings > Privacy & Security > Location Services > System Services > Compass Calibration) | Yes. `TYPE_MAGNETIC_FIELD_UNCALIBRATED` returns `x_bias, y_bias, z_bias`, documented as "the iron bias estimated in X, Y, Z axes" |
| Does the OS tell the app its calibration is poor? | Yes, in DEGREES: `CLHeading.headingAccuracy` is "the maximum deviation of where the magnetic heading may differ from the actual geomagnetic heading in degrees. A negative value indicates an invalid heading" | Only as a 0 to 3 band: `SENSOR_STATUS_UNRELIABLE` = "cannot be trusted, calibration is needed", `SENSOR_STATUS_ACCURACY_LOW` = "calibration with the environment is needed" |
| Is there an OS-provided calibration prompt? | **Yes.** `locationManagerShouldDisplayHeadingCalibration:` and "The display will remain until heading is calibrated, unless dismissed early via `dismissHeadingCalibrationDisplay`" | **No equivalent.** Every Android compass app draws its own figure-of-eight hint, which is why they all look hand-rolled |
| Can this app reach either? | Not through `expo-location`, which implements no such delegate and buckets `headingAccuracy` to 0 to 3 (row 49) | Not through `expo-location`, whose `onAccuracyChanged` has no sensor-type guard (row 48) |

Both platform headers were read from the SDKs installed on this machine, iPhoneOS27.0.sdk and android-35, so
these are quotations rather than recollections.

**What this means for the hint, and it is the same on both platforms.** Neither OS exposes "your calibration
is now good" to an app through this library, and both estimate hard iron continuously from whatever motion the
user happens to give them. **So the gesture is never wasted and never verifiable**: it feeds an estimator that
is always running, on both platforms, and no app-level code can confirm it worked. That is precisely why the
shipped design asks for the gesture and gates on nothing, which row 52's handoff already called failing open.

**The one asymmetry worth acting on later:** iOS has a built-in, OS-drawn calibration flow that this app's
users have never seen, because `expo-location` implements no delegate for it. That is row 51's PR candidate
list, not this session's work.

---

## What this research changed in the plan

1. **The wave hint STAYS, and its justification is now external rather than assumed.** No redesign, no flat
   variant. The owner's question is answered with AN4246 and a run of its own fit.
2. **The "motion-rejecting gate" the owner picked is VOID, on this session's own measurements** (see
   `MEASURED.md` section 5): no stream-only gate separates a 60-degree wave from a 12-degree hand sway, and
   every shape tried refused a hand-held phone 100% of the time. There is also now no defect to fix in the
   common regime, because the user-experienced error is 0.70 against 0.73 degrees.
3. **The 13-second time floor is NOT shipped.** It buys worst-case accuracy in the unconfirmed slow-fusion
   regime and costs every user real time, against an owner who has judged both phones accurate. It is recorded
   with its numbers in `MEASURED.md` section 6 so a later session can ship it if the 3T's real time constant
   turns out to be slow.
4. **What ships is the three things measured to cost nothing**: the subtitle on one line, the instant warm
   reopen, and no success haptic on an instant open.
