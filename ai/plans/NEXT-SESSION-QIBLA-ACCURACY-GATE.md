# The qibla wait: replace the stopwatch with the phone's own uncertainty

**Read this first and in full.** It is the whole handoff for the next qibla session, written after the owner ran
20 trials on his own two phones and overturned the model this programme had been designing against.

---

## 1. The revert point, and the owner named it himself

🐋 "Right now the build, I am on build number 1.29.239. So I want you to save this in your mind because this is
a good build that we will come back to, that we will revert to, should things go wrong."

| | |
| --- | --- |
| **Known-good build** | **1.29.239** |
| Commit | `7904e00f` (merged as `55e6659b`) |
| Judged on | OnePlus 3T and iPhone XS, 20 trials, 2026-10-03 |
| His verdict | 🐋 "the compass is absolutely smooth and absolutely perfect" |
| Android APK | `~/athan-device-sweep/session52/mock.apk` (MOCK data, package `com.mugtaba.athan`) |
| iOS | Built from `uat-2` at 1.29.241, installed on the XS |

**To revert:** `git revert` back to `7904e00f`, or rebuild from that sha. Anything the next session ships sits
on top of a build the owner has already accepted, so there is always a known-good floor.

**One caveat on that APK, and it is the mistake session 52 made:** it carries the PRODUCTION package name with
MOCK data, because `build-mock.zsh` was run without `EXPO_ANDROID_SUFFIX=fleettest`. Its prayer times are
fabricated. `ai/AGENTS.md` now carries the `aapt2 dump badging` check that catches this before an install.

---

## 2. THE OWNER'S 20 TRIALS, and what they refute

He ran the protocol this programme asked for, on both phones, 2026-10-03:

| Phone | Still | Waving | Mix |
| --- | --- | --- | --- |
| OnePlus 3T | 5 | 5 | cold and warm |
| iPhone XS | 5 | 5 | cold and warm |

🐋 "For both phones, absolutely no difference in terms of accuracy, both of them. Always show the animation,
always, always show the animation for about 2 seconds. And then after about 2, 3 seconds the compass pops up and
the compass is absolutely smooth and absolutely perfect. So shaking the phone doesn't actually do anything at
all. Nor does cold, nor does warm."

**Three findings, and each one contradicts something this programme believed.**

### 2.1 The 9.7-second wait does not exist on his phones. The real wait is the SPAN, and it is 2.7 seconds

Session 52 predicted 9.7 seconds from a cold fusion converging on a 4000ms time constant (session 48's
measurement). **He measured 2 to 3 seconds, every single time, on both phones, cold or warm.**

2.7 seconds is `SETTLE_WINDOW_MS * 0.9`, which is `hasSettled`'s span requirement. So on his phones the gate's
three conditions resolve like this:

| Condition | On his phones |
| --- | --- |
| `window.length >= SETTLE_MIN_READINGS` (8) | met in about 570ms at the measured ~14Hz |
| **`nowMs - window[0].atMs >= SETTLE_WINDOW_MS * 0.9`** | **2700ms. THIS IS THE ENTIRE WAIT** |
| drift between the window's halves `<= 1.5` degrees | already true, because the fusion is already converged |

**The gate is holding a correct heading and waiting for a stopwatch.** That is the answer to his question
🐋 "Why is the animation there? What's blocking it?"

### 2.2 There is no cold start, because calibration is the OS's and not the app's

**Why session 48's 30-degrees-out cold fusion never appeared:** magnetometer hard-iron estimation and sensor
fusion are OS-level services. Clearing app data, force-stopping, even reinstalling does not reset them. A phone
in daily use already holds a good hard-iron estimate and a converged fusion before this app asks for a heading.

**So "cold" for the app is not cold for the phone**, which is exactly what he measured: 🐋 "Nor does cold, nor
does warm."

### 2.3 Waving does nothing ON HIS PHONES, and that is not the same as the gesture being useless

**Both are true and they are not in conflict:**

- Session 52 measured, from NXP AN4246's own least-squares fit, that the figure of eight is the ONLY gesture
  that can determine a hard-iron offset: a flat still phone leaves 497.6% of it unremoved, a flat phone turning
  on the spot lies on a CIRCLE which does not determine a sphere's centre, and the figure of eight leaves 1.3%.
- His phones have no significant hard iron left to remove, because the OS already removed it.

**The wave is insurance against a state he is not in.** It costs nothing when it is not needed (0.70 degrees
still against 0.73 waving at the alignment tap) and it is the only thing that helps when it is.

**THE OWNER CAUGHT A CONTRADICTION IN THIS PROGRAMME'S OWN ADVICE AND HE WAS RIGHT.** Session 52 said the wave
is insurance and then suggested dropping the instruction. He answered: 🐋 "But then if we remove that, the user
is not going to shake their phone. And we're going to lose the insurance. So maybe we should just keep
everything as is."

**That is the correct reading, and the geometry proves it.** The turn a user makes to face the qibla is rotation
about the VERTICAL axis only, a flat phone spinning, which is precisely the degenerate circle case that cannot
calibrate. Only the figure of eight supplies the pitch and roll that closes it. **Remove the instruction and the
insurance goes with it. The hint and its animation STAY.**

### 2.4 A fourth observation of his, worth keeping

🐋 "Laying the phone flat is actually makes it a smoother experience, less bobble, less jitter, but holding the
phone up straight does cause a jitter, and that's, I guess, that's expected."

Correct and expected: a compass reads the HORIZONTAL component of the field, so tilting the phone shrinks the
signal being measured while the noise stays, and the heading gets noisier. **His existing copy already says the
right thing** (*Hold flat and turn slowly*), and he has ruled out explaining the physics in the UI:
🐋 "that's too technical, too much for people."

---

## 3. WHAT THE NEXT SESSION BUILDS: gate on the platform's own uncertainty

The owner chose this directly: 🐋 "Okay, okay. I think, yeah. This is good... I do want to implement what you
said about the modules, qibla heading."

**Replace the 2700ms drift stopwatch with a reading of how certain the phone says it is.** The instrument
already exists: row 49 shipped `modules/qiblaheading`, which reads what `expo-location` destroys.

| Platform | What the module already reads | What `expo-location` does with it |
| --- | --- | --- |
| iOS | `CLHeading.headingAccuracy` in DEGREES, and a negative value meaning "invalid heading" | buckets it to 0 to 3, where bucket 3 spans 0 to 20 degrees |
| Android | FOP's `getConservativeHeadingErrorDegrees()`, a per-sample error cone | never exposes FOP at all |

**The shape of the change:** when the phone reports its uncertainty is inside the alignment window, draw
immediately; when it reports worse, keep waiting and say so. A phone that is already certain stops waiting for a
clock, and a phone that is genuinely uncertain is caught, which the drift gate cannot do (it passes a stable
hard-iron bias untouched at 0, 5, 15 and 27 degrees).

### What a planning session must settle before any code

1. **The threshold.** `ALIGNMENT_ENTER_DEGREES` is 4, so a reported uncertainty under 4 degrees is the obvious
   candidate. It needs measuring on both phones first: session 49 read 25.4, 24.8, 24.8 degrees on the XS, but
   **every one of those samples was taken over a cable beside a laptop on a magnetic table**, so they measure
   that desk and nothing else (session 49's own rule). Untethered readings are the first task.
2. **Android's availability.** Session 49 measured FOP on the 3T registering the uncalibrated magnetometer and
   gyroscope and then AGREEING with the shipped heading, moving 0.3 degrees across 8 seconds. Its error cone is
   OPTIONAL per sample (`hasConservativeHeadingErrorDegrees()`), so an unguarded read publishes a default
   dressed as an accuracy.
3. **The fallback, which must fail OPEN.** A phone reporting no accuracy at all, or a build whose native module
   is missing, must still draw a compass. The drift gate is the natural fallback and it already works.
4. **The flag.** `qiblaDiagnostic` currently gates the module and carries `EXPO_PUBLIC_ENV !== 'prod'`, so the
   module is UNREACHABLE in production today. Making the accuracy gate real means promoting that path out from
   behind the diagnostic flag, which is a decision with its own test surface (session 49's audit found the flag
   check guarded by nothing and the whole suite blind to it).
5. **What the user sees while waiting.** He asked directly: 🐋 "Should we keep the animation, but then it makes
   the users shake their phone... Maybe we keep the animation and treat it as a loading screen perhaps." Section
   2.3 answers the wave question (keep it). What is undecided is whether a sub-second wait should show the
   animation at all, or whether it should appear only when the wait will actually be long enough to notice.

### What must NOT be re-investigated

| Settled | By |
| --- | --- |
| `SETTLE_WINDOW_MS` is not shortened as a fix | It is the shortest window whose p95 error fits the 4-degree alignment window (session 52) |
| The sensor rate is not a lever | `TIME_DELTA = 50f` survives the patch, so the gate sees ~14Hz at any rate |
| No stream-only gate separates motion from convergence | A slow turn and a slow drift are the same signal (sessions 48 and 52) |
| The wave hint stays | Section 2.3, on AN4246's own fit plus the owner's ruling |
| The 13-second time floor is not shipped | It fixes a regime his phones are not in, at 3.5s per open |
| The app's geometry is correct to 0.1 degrees | Measured off his own recordings (session 47) |

---

## 4. What session 52 shipped, and the defect it introduced and fixed

| Version | Change |
| --- | --- |
| 1.29.237 | The compass subtitle on one line |
| 1.29.238 | A verified warm reopen draws the compass at once |
| 1.29.239 | No arrival haptic on an instant open. **THE OWNER'S REVERT POINT** |
| 1.29.240 | Records |
| 1.29.241 | The latch comment sits above the latch |
| 1.29.242 | The APK package-name check in `ai/AGENTS.md` |
| 1.29.243 | **The subtitle truncation fixed** |

**THE DEFECT, and it was session 52's own.** The owner reported 🐋 "It says hold the phone flat and dot dot dot,
3 ellipses. I don't see the rest." Adding `numberOfLines={1}` turned a WRAP into a TRUNCATION: two readable
lines became one unreadable one.

**The cause is not the text length, and that is the useful part.** An absolutely positioned child contributes NO
width, so the subtitle column shrink-wrapped to whichever line was left in flow, which was *Just a moment* at
roughly 91dp. The longer line was then clipped inside that, against a text column measured at **299dp** on the
3T (411dp screen, minus 40dp of sheet padding, 32dp of header padding and the 40dp icon). **Both the original
wrap and the ellipsis come from the same place.**

Fixed in 1.29.243 by leaving the LONGER line in flow and taking the shorter one out, so the column measures the
widest text it must hold. The header still keeps one height through the cross-fade, which is the only reason the
lines are stacked. A test asserts which line is absolute, so swapping them back fails.

**DURABLE LESSON: `numberOfLines` hides a layout fault rather than fixing one.** When text does not fit, measure
the box before capping the lines.

---

## 5. The measurement rule this session earned

**The error at the instant a gate opens is not a user-facing quantity.** Session 52 told the owner that waving
costs a 4x worse reading, repeating row 50's figure, and he refused it from his own hands. He was right: the
gate LATCHES, so the fusion keeps converging while the user turns toward the qibla, and at the moment the app
actually claims alignment the error is 0.70 degrees still against 0.73 waving, with zero false taps in 300 runs
each.

**Measure the error at the moment the app makes a claim a user acts on, never at the moment an internal gate
changes state.** Row 50's own figure carries the same defect.

**And its companion, from his 20 trials: a simulation's premise is worth less than one trial on the real
device.** The 9.7-second wait, the cold-fusion convergence and the wave penalty were all predicted off a model
whose starting assumption, that the app sees a cold fusion, is false on a phone in daily use. He found that in
twenty opens.
