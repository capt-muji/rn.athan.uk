# The qibla sheet: what this session broke, fixed, and left open

**Read this first.** It replaces the crash handoff and carries everything learned between 1.29.227 and
1.29.233. The open questions are in section 7 and they are the next session's work.

---

## 1. Where it stands

| | State |
| --- | --- |
| Branch | `uat-2`, pushed |
| Both phones | 1.29.233 |
| Gates | 187 suites, 5044 tests, 100% on all four measures |
| Compass drawing, geometry, settling, alignment, `expo-location` patch | **BYTE-IDENTICAL to 1.29.220**, the build the owner accepted. Verified by an empty `git diff 45ff6267 -- ...` |

---

## 2. The crash, and the two defects behind it

The sheet died on open: a hard crash on the iPhone XS and the error page on the 3T. **Two defects, both
proven by RUNNING the libraries' own code rather than reading it.**

### A. An animated transform STRING cannot be SVG syntax

`QiblaWave` placed the phone with `transform: \`translate(12.34 -5.67) rotate(20.5)\``, which is valid SVG and
which `react-native-svg` parses correctly. **Reanimated 4.7.0 re-parses an ANIMATED transform through its own
CSS grammar first** (`updateProps.native.ts` calls `processTransform` whenever `isAnimatedProps`), and that
grammar is not SVG's. Running the real processor on the exact production string:

```
STRING => THROWS: [Reanimated] Invalid transform property: rotate(20.5)
ARRAY  => OK
```

Two faults in one string: `parseValues` splits on COMMAS, so `translate(12.34 -5.67)` reads as a single
argument and the y value is silently dropped; and `parseRotate` requires a unit, so `rotate(20.5)` throws. The
throw lands on the UI thread at the first frame, which is why **one cause produced two different symptoms**.

**RULE: an animated transform is an ARRAY (`[{ translateX }, { rotate: '20deg' }]`), never a string, even on
an SVG node.** A static transform may be a string, because nothing re-parses it.

### B. `Polygon` has no animatable `points`

`Polygon` is not a native element: its `render()` returns `<Path d={...}>` and there is no `RNSVGPolygon` in
the codegen. Animating `points` pushed a prop to a native Path node that has no such prop, and the wrapper's
ref resolved to the inner composite rather than a host view. That is the `undefined is not a function`.

**RULE: animate `d` on a `Path`. A shape whose native form is a Path cannot have its own prop animated.**

---

## 3. THE REGRESSION THIS SESSION CAUSED, and it is the most important lesson here

The owner reported the compass had become jittery and laggy on the 3T, worst on the slow careful turn a qibla
actually needs. **Nothing in the compass had changed.** What changed was what ran BESIDE it.

The shake gate armed `useAnimatedSensor(ACCELEROMETER, { interval: 20 })`. `dumpsys sensorservice` with the
sheet open showed:

```
0x00000001) active-count = 2   <- raw accelerometer, registered TWICE
0x00000003) active-count = 1   <- magnetometer
```

`expo-location`'s heading needs the accelerometer AND the magnetometer. **The 3T's magnetometer is an
MMC3416PJ with `maxRate=52.00Hz`**, so it was already near its ceiling at the patched 50Hz, and a second 50Hz
subscriber on the same pipeline starved it.

**RULE, and it binds every future feature on this screen: the qibla heading owns the accelerometer and the
magnetometer while the sheet is open. Nothing else may subscribe to either at a high rate.** A feature that
reads motion during the compass degrades the compass, and the symptom is lag on SLOW movement, which is
exactly where this feature is judged.

**The method failure behind it:** the gate was verified in isolation and declared done. Its cost to a
neighbour was never measured. Verifying a part in isolation says nothing about the whole.

---

## 4. The shake gate: built, measured, and DELETED

The gate asked the user to wave and refused the compass until the accelerometer agreed. It is gone, on the
owner's instruction, and every trace with it: `shared/qiblaShake.ts`, `hooks/useQiblaShake.ts` and both
suites. `grep -rn 'useAnimatedSensor|qiblaShake|SHAKE'` over the app returns **zero**.

Three findings are worth keeping even though the code is not:

**(a) Reanimated's `ACCELEROMETER` is a DIFFERENT SENSOR on each platform.** Android gives
`TYPE_LINEAR_ACCELERATION`, gravity already removed, so a still phone reads about 0; iOS passes
`CMAccelerometerData` through, so a still phone reads about 9.81. Subtracting a gravity constant is therefore
correct on one platform and inverted on the other. It shipped that way: a still 3T read 9.81 of "motion" and
satisfied the whole gesture untouched on a desk. **Measure how much a reading VARIES, never its distance from
a constant.**

**(b) A `runOnJS` per sensor reading starves whatever it feeds.** The gate took 3 seconds on the XS and 8 on
the 3T for a gesture asking half a second. Every reading was a separate cross-thread dispatch (worklets
defers through `queueMicrotask`) queued behind the animation, so readings arrived far slower than the 50Hz
the sensor was registered at. Replaying the shipped logic against falling delivery rates showed a CLIFF, not
a slope: the window needed 20 readings a second to be valid at all, so at 50Hz it opened in 0.64s, at 20Hz in
0.85s, and **at 15Hz and below it never opened**, however hard the phone was waved.

**(c) A gate that waits for a gesture FAILS SHUT.** On a phone whose magnetometer misbehaves it refuses for
ever and the user has no way through. The owner's ruling: *"we don't want to lock it... what if the
magnetometer doesn't actually work the first time"*. Anything gating this screen must fail open.

---

## 5. What the sheet does now

The animation shows while the heading settles, then the compass replaces it. **The settling gate alone
decides**; there is no timer beside it.

A 2-second timer WAS built and then removed, because it was measured to be invisible: `SETTLE_WINDOW_MS` is
3000ms, so on a cold magnetometer the heading is always the longer wait and the timer never bound. Keeping it
would have meant a constant that does nothing on the path the user actually takes.

Also shipped this session:

- **Location is requested on the Qibla TAP**, before the sheet opens. It used to open the sheet and then ask,
  so the user watched an empty instrument under a system dialog. A refusal now opens nothing and explains
  itself, offering Settings, which is the only route back once the system stops asking.
- **The reopen flash is fixed.** `hasHeading` was never cleared when the watch was torn down, so the first
  frame of a second open drew the last visit's compass. It now clears in `stop()`.
- **The hint phone** is drawn flat (no Z-axis narrowing, which made it vanish edge-on), faces along the curve
  so the trail always leaves its foot, has a notch rather than a camera dot and home button, and its trail is
  30% shorter.
- **The wording** dropped "calibrate" and "figure eight" for *Wake up the compass* / *Move your phone like
  this*, and the sheet subtitle cross-fades between *Just a moment* and *Hold flat, turn until it vibrates*.
- **The settings button** is more visible (the owner judged the exact level on device) and its iOS shadow is
  dark at 0.75 opacity. **Android's is untouched** and must stay so: it draws `elevation`, which takes no
  colour, and the owner accepted that build.

---

## 6. Testing notes that cost real time

**The sheet's suite cannot drive the UI runtime.** Anything reading a sensor through `useAnimatedReaction`
runs on a thread no test reaches, so a feature verified only there is unverified.

**`jest.useFakeTimers()` called twice resets the clock and discards pending timers.** A helper that re-faked
timers mid-test silently cancelled the very timeout under test. Fake timers once, at open.

**A mock can hide the defect it exists to model.** Breaking the gate's latch passed the entire sheet suite,
because the mocked hook could not report a broken real one. **Every break must be aimed at the suite that can
actually see it**, and a break that passes means the test is wrong, not the code.

**`qlmanage` crops a contact sheet to a square.** Ten rendered designs lost four cells to it; the owner saw a
broken sheet. Render wide grids at the right aspect or check the output before showing it.

---

## 7. OPEN QUESTIONS for the next session

### 7.1 Is the settling gate still needed? (the owner's question, unanswered)

He asked directly: *"Are you sure we still need the settling gate? Does it cause jitters? Is it for
smoothness? What is it for?"* and asked how hard a build without it would be.

**What it is for**, from session 48's own measurements (`ai/plans/48-qibla-heading-accuracy/DECISION.md`):

| | Without the gate | With it |
| --- | --- | --- |
| First reading error | 30.05 degrees | **0.71** |
| Indoor jittery case | 29.48 degrees | **3.52** |

It exists because a fused heading arms COLD and walks toward the truth, and the app was drawing the first
step of that walk. The symptom it fixed is the owner's own: the same phone at the same spot answering 5 to 30
degrees differently on each restart. It tests DRIFT between the two halves of a 3000ms window that must be
SPANNED, not merely filled: without the span check a fast stream fills the count in 400ms and opens at 29.18
degrees rather than 9.70.

**So it is for CORRECTNESS, not smoothness, and it is not a jitter source: it either draws or it does not.**

**What is genuinely worth re-testing, and the honest reason:** those figures were measured BEFORE the
`expo-location` patch that removed the 2-degree emission gate and raised the rate to 50Hz. A denser stream
may converge sooner, which would make 3000ms longer than it needs to be. **The question to answer is not
whether to delete it but whether 3000ms is still the right number**, and it is answerable by logging drift
against time on both phones from cold.

**A build without it is one line** (`hasSettled` returning `true`) and is worth making as a COMPARISON only.
It should not ship: deleting it restores the 30-degrees-wrong first reading that created session 48.

### 7.2 Cold versus warm opens

The owner raised this and it is unexplored. A warm reopen can have a settled stream already, so the compass
could appear almost at once, while a cold open waits the full window. Nobody has measured the two apart or
decided whether the warm case should still show the animation briefly for consistency.

### 7.3 The compass subtitle wraps to two lines

Seen on the 3T at 1.29.233: *Hold flat, turn until it vibrates* does not fit one line beside the header icon
and wraps. It is legible and nothing overlaps, but the header is taller while the compass is up than while
the hint is, so the cross-fade is not a pure fade. Either shorten the phrase (*Hold your phone flat* was the
owner's other candidate) or let the header reserve two lines throughout. **The owner has not seen this yet
and should choose.**

### 7.4 The 3T's lag, re-measured

**The second subscription is gone and that is CONFIRMED on the device at 1.29.233.** With the compass open,
`dumpsys sensorservice` lists the app (`hn4`, uid 10201) holding exactly one of each:

```
Connection Number: 2
   hn4 | uid 10201
   LSM6DS3 Accelerometer 0x00000001 | status: active
   MMC3416PJ Magnetometer 0x00000003 | status: active
```

**Read `active-count` carefully, which is the trap here.** It still shows 2 on the accelerometer after the
fix, and the second holder is **Google Play Services' own location collector**
(`com.google.android.location.collectionlib.BatchSignalCollector`), not this app. Count the per-connection
list rather than the aggregate, or a clean build reads like a leak.

**What is NOT confirmed is the FEEL.** The owner has not judged the slow turn since the gate was removed, and
that is the only test that matters for this symptom.

---

## 8. Rules this session earned

1. An animated transform is an array, never a string.
2. Animate `d` on a `Path`; a Path-backed shape has no prop of its own to animate.
3. The heading owns the accelerometer and magnetometer while the qibla sheet is open. Nothing else subscribes.
4. Reanimated's `ACCELEROMETER` is a different sensor per platform. Measure variation, not distance from a
   constant.
5. Never `runOnJS` per sensor reading. Judge on the thread the readings arrive on, and cross once.
6. Anything gating this screen must fail OPEN.
7. Verify a break against the suite that can see it; a break that passes is a broken test.
8. A suite that cannot see the thread boundary is not evidence that the app runs. For anything touching
   Reanimated, the acceptance test is the sheet opening on a device.
