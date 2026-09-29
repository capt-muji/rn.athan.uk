# R6: field evidence and user-facing design

Returned 2026-09-29 by research agent R6 for session 40. Scope: what happens when the fused heading
ships to real people, and what the screen says. The sensor APIs, the filtering maths and the package
choice belong to other agents and are not re-derived here.

Every claim carries a grade: [P] primary (issue tracker, official doc, quoted review), [J] journalism
or teardown, [W] blog or forum, [U] unverified. INFERRED marks my own reasoning on top of the
evidence.

---

## Summary

1. The fused sensor is better on average and worse on some devices. The single most constraining
   field report is a phone whose fused compass read 180 degrees off while a third-party compass app
   reading the raw sensor was correct; the user fixed Maps by calibrating through the raw-reading app
   [W]. Google built the Fused Orientation Provider because OEM variance is real, and its own launch
   post admits it exists to fix "frequent user complaints when orientation is incorrect" [P].
2. The silent-confident-error problem is real, is described by users in the field, and does not fully
   self-correct. The gyro carries the heading smoothly while the magnetic reference is bad, fusion
   actively resists disturbances it can model, and a phone held still in a bad field stays wrong. The
   only reliable cures in the field are deliberate motion (the figure of eight, which Maps says works
   "immediately") and moving away from the interference. One user reports needing recalibration
   "daily or so" [W].
3. Nobody ships a numeric confidence. Google has the number (`getHeadingErrorDegrees`) and renders it
   as cone width, not digits. Apple does the same with its cone. Recommendation: no number on screen,
   band wording in the screen-reader label.
4. The calibration warning must survive the sensor change, with new triggers: an error-degrees
   threshold with hysteresis replaces the boolean calibration band, plus a settling state for the
   first seconds, plus a no-compass state with the bearing and a sun check.
5. The "just face Saudi Arabia" model is confirmed as the dominant real-world behaviour, and the
   bridge users build is landmarks and streets, not the dial. The sun check is the trusted
   verification method, has exact dates (rasd al-qibla), and can be computed on device.

---

## What this confirms, weakens and overturns from session 37

### Confirms

- **"Fused heading, never raw magnetometer" (02, section 9.1).** Google's own launch post for the
  Fused Orientation Provider confirms the architecture: fusing accelerometer, gyroscope and
  magnetometer, compensating gyro bias, and producing "a realistic estimate of the compass heading
  accuracy" [P]. Google Maps uses this exact heading [P].
- **The figure of eight is real, taught, and works.** Google's instruction has been stable since
  2016: "move your phone in a figure 8 motion a few times. This should immediately result in a more
  accurate direction" [P]. The motion is folk knowledge passed between users when apps fail to teach
  it (05, section 2), and my searches found the same pattern in sailing, hiking, geocaching and
  astronomy contexts.
- **Accuracy must be surfaced.** Google ships a visible accuracy signal (beam width, Low/Medium/High
  in the calibrate flow) rather than hiding it [P][J].
- **The near-Kaaba, great-circle and interference findings** all stand; nothing in this research
  contradicts them.

### Weakens

- **"The best apps use the fused heading, and that is the steady path" (02, section 9) reads too
  clean.** Field reports show the fused path failing on specific firmware where the raw path works
  (below, section 1). The claim survives as "better on average", not "better everywhere".
- **The tilt emphasis (02, section 5).** The 100-degree-tilt maths is about the raw
  accelerometer-plus-magnetometer pair. The fused rotation vector does tilt compensation in the
  fusion, so "Hold the phone flat" loses its trigger under the new architecture. The physics stands;
  the user-facing hint built on it does not.
- **"iOS accuracy bands are always available" (implicit in 02, section 7).** `headingAccuracy` can be
  negative, meaning "invalid, uncalibrated or strong interference" [P]. The system calibration HUD is
  no longer reliably shown (users are told it "will calibrate automatically"), and the Compass
  Calibration toggle in System Services can be off for months, silently degrading every map app
  [W]. The iOS trigger signal is weaker than session 37 assumed.

### Overturns

- **"The fused sensor is strictly better than raw" as a universal claim.** One documented case
  (Nothing CMF Phone 2 Pro, 2025): Maps compass 150 to 180 degrees off; a third-party compass app
  with an explicit "USE ADVANCED SENSOR" setting, turned off so it reads the raw sensor, calibrated
  correctly with figure of eights and fixed the phone [W]. A second case (S22 Ultra): "I downloaded a
  compass app, and it's perfect, but google maps stays frozen in the wrong or 90' off direction"
  [W]. On those devices the fused layer is the defect. The design must keep an honest degradation
  path and cannot assume the fused needle is the truth.
- **"Uncertainty as an arc, not a label" (05, section 3) as the complete answer.** The arc is right
  for the visual, but the arc is only as honest as the error estimate behind it. Google had to patch
  the FOP cone: "We recently added changes to better cope with magnetic disturbances, to improve the
  reliability of the cone" [P]. When the estimate itself is wrong, an arc lies smoothly. A text state
  that names the condition remains necessary alongside the arc.

---

## 1. Real failure reports specific to the fused rotation vector

### 1.1 Devices where the fused sensor is missing

- **Samsung Galaxy A5 (2016), stardroid issue 188 [P].** The phone declares
  `android.hardware.sensor.accelerometer` and `android.hardware.sensor.compass`, yet exposes NO
  rotation vector sensor at all. Google's own Sky Map rendered jumpy on it. The reporter's fix:
  switch to `TYPE_GEOMAGNETIC_ROTATION_VECTOR` (accelerometer plus magnetometer, no gyro) with a
  low-pass filter, which "works like a charm". This is the documented fallback path for gyro-less
  phones, and it is exactly the sensor pair we ship today.
- **Whole device classes with stubbed fusion [W].** An ST community thread (November 2025) documents
  an Android 10 board where accelerometer, gyro and magnetometer drivers all deliver valid raw data,
  but the vendor fusion library is placeholder stubs: `getQuaternion`, `getEulerAngles` and friends
  "simply return 0", so rotation vector, geomagnetic rotation vector and orientation sensors all
  report zero and "heading never changes in any compass or mapping application" [W, vendor forum with
  dumpsys attached]. Custom-ROM and budget-device users hit this class.
- **The Fused Orientation Provider requires all three sensors and Google Play services [P].** The
  launch post: devices "must have an accelerometer, gyroscope, and magnetometer available", and the
  API lives in Play services 21.2.0+. Where FOP is unavailable it "returns values piped through from
  the AOSP Rotation Vector" [P]. A GMS-free device or a gyro-less phone lands on the fallback, and
  the app must tolerate both.

### 1.2 OEM firmware bugs, the fixed-offset family

- **Samsung S21 Ultra, 90 degrees, widely reported [W].** A measured, patient report: the user
  mounted the phone on a tripod, photographed a fixed spot with a theodolite app, and read azimuths
  of 329, 277, 315, 332, 332, 322, 331, minus 70, 348, 342, 348 without moving the phone. The
  outlier is impossible on a 0 to 360 scale, which points to an invalid tilt-compensation angle being
  applied to a correct compass read. "That's a very very widely reported problem, people have had
  hardware replaced under warranty and still the same issue." The user watched it "make the 90 degree
  jump" after minutes of being fine [W].
- **Sony Xperia 5 IV, exactly 90 degrees clockwise, every app, every location, calibration-immune
  [W].** Same report family on Xperia 5 II and on Xiaomi/Poco in the same thread.
- **Nexus 6P [W].** "Always 90 off. Calibrating works, but just for a few seconds, and than back to
  90 clockwise off." Multiple users in the thread; one fixed it only via a Maps calibration prompt
  and could not explain why that worked.
- Session 37 traced the 90-degree class to app-level axis remapping (OsmAnd 2131). These reports are
  OS-level and app-independent, so under the fused architecture the class does not disappear; it
  moves from our code to the OEM's. INFERRED: we cannot fix it, we can only fail honestly.

### 1.3 Fused worse than raw

- **CMF Phone 2 Pro, 2025 [W].** Compass "around 150 degrees inaccurate" on Google Maps and another
  map app; one user "completely opposite, 180 degrees off". The fix, verbatim: download a compass app
  with "USE ADVANCED SENSOR turned off in the settings", "then wrote 8s in the air with the phone.
  Fixed it immediately" [W]. The raw-sensor app's calibration cleared the bias that the fused
  consumers were stuck with.
- **S22 Ultra [W].** Third-party compass app accurate, Maps frozen or 90 off on the same hardware,
  same moment.

### 1.4 Stale after screen-off

- **Wear OS, documented at Stack Overflow [P, title and snippet; full text bot-blocked].** "Sensor
  Data pauses upon Screen Off even when" a foreground service with partial wake lock is running.
  Continuous sensors do not survive screen-off merely because the app asked.
- **iOS, the wake-and-recalibrate ritual [W].** A developer's documented fix for a stale heading:
  lock the screen, wake it, re-enable Compass Calibration, return to the app [W]. An HN user
  describes the cone "behaving funny" for months after disabling the toggle, and others describe
  calibration fixes that hold "only for a minute" [W].
- INFERRED: the app already keys the heading subscription on sheet presentation rather than mount
  (`Qibla.tsx`), which is the correct shape. The residual risk is mid-session stalling after an
  interruption, which no app-level code can prevent, only detect: a heading stream that stops
  producing samples while the sheet is open is a detectable state (section 4).

### 1.5 expo-sensors specifics (relevant to the other agents, noted for completeness)

- `DeviceMotion.isAvailableAsync()` returned false on two physical Android devices (8.1 and 12)
  while returning true in a virtual preview [P, expo 19523].
- Long-standing `orientation` bugs: returns 0 despite rotation [P, expo 2430, expo 7051], and the
  RFC thread lists DeviceMotion problems among the package's "long standing problems" [P, expo 7893].
- Orientation reference frames are NOT aligned across platforms: Android uses magnetic north plus
  gravity via `getOrientation()`, iOS defaults to `xArbitraryZVertical`, and the library never
  configures `xMagneticNorthZVertical` [P, react-native-sensors 451]. Whoever owns the sensor API
  must pin the frame explicitly or the two platforms disagree about what north means.

---

## 2. The silent-confident-error problem, from the field

This is the best-evidenced section of the report. The mechanism, the user descriptions, and the
correction behaviour are all documented.

### 2.1 The mechanism, from primary sources

- **The gyro drifts by itself.** Oculus's chief sensor scientist, on why the Rift needed a
  magnetometer at all: "When we integrate gyroscope readings of angular velocity, the resulting,
  estimated head orientation gradually drifts away from the true orientation" [P]. The accelerometer
  corrects tilt drift; yaw drift (rotation about the vertical, which is the compass axis) needs the
  magnetometer.
- **The fusion hides interference.** A physics-education teardown filmed a magnet next to a phone:
  "the smartphone's compass appears to be unaffected by the presence of a magnet" [J]. The reason is
  dynamic calibration: the OS "continuously measures the detected field and compares it to its
  expected value, using data from the accelerometer and gyroscope... if the phone is resting on a
  table and a magnet is brought nearby, the software detects the additional field, measures
  variations along the three axes, and adjusts the calibration to align the values with the initial
  magnetic field" [J]. The same source notes the cost: "raw sensor data is harder to access", because
  the system constantly adjusts it.
- **The correction is gated on a good reference.** Google's FOP post lists "compensate for gyro drift
  (gyro bias) while moving" among its tasks [P], and the FOP team shipped cone-reliability fixes for
  magnetic disturbance after launch [P]. INFERRED: the filter believes the gyro over the short term
  and the magnetometer over the long term. When the magnetometer is wrong (interference) the gyro
  carries the error smoothly; when the phone is still, there is no new information to correct
  toward, so the wrong heading persists.

### 2.2 How users describe it

- "The phone uses an accelerometer to figure out how you turn the phone around, the trick is that
  the compass takes way too long to do a proper measurement, but once done, you can track it with
  the accelerometer/gyro. This has a tendency to drift over time. It happens to me all the time.
  Needs to be recalibrated daily or so." [W, ELI5 thread on Maps' direction arrow]
- "Google's doing some extra processing using your recent gps movement that fixes the
  inaccuracies of the magnetometer, but it doesn't work while stationary and likes to take over even
  when it's completely off." [W, same thread]
- On a Samsung A53, indoors at a desk: "The fluctuation was not jumpy, but slowly sweeping", and "the
  compass may point anywhere while I sit on my couch, even 180 degrees opposite" [W].
- On the S21 Ultra: fine for a few minutes, then the user watched it "inevitably make the
  90 degree jump" [W].
- Astronomy users, who verify against known objects, describe the same glide: a Mapillary forum
  report has the heading work "super-smooth for a minute or so" and then go erratic [W, snippet];
  SkySafari's own docs budget for it: the solid-state compass "can easily be wrong by ten degrees or
  more" and is "certainly not accurate enough to point a telescope" [P, vendor help doc].

The smoothness is the disguise. A raw compass wobbles, which reads as untrustworthy and triggers the
user's own figure of eight. A fused compass glides, which reads as confident, and the field reports
show users trusting it until an external reference (a road, the sun, a known star) contradicts it.

### 2.3 Does it self-correct?

Partially, slowly, and only under conditions the user controls:

- **Deliberate motion fixes it, fast.** Google: the figure of eight "should immediately result in a
  more accurate direction" [P]. The motion samples many orientations, which is exactly the ellipsoid
  fit the calibration needs (the Oculus post derives why: well-separated points determine the sphere
  of offsets) [P].
- **Moving away from the source fixes it.** The interference must be left behind; nothing in the
  filter can distinguish a fixed local field from Earth's field once the phone is still [J].
- **Sitting still in a bad field does not fix it.** The couch report above shows 180 degrees of
  persistent error indoors [W]. INFERRED: with no motion, the gyro reports consistency, the filter's
  confidence stays high, and the error estimate can read low while the heading is wrong.
- **Time alone does not fix it for some users.** "Needs to be recalibrated daily or so" [W] and
  "recalibrating fixed it, but only for a minute" [W].
- **The error estimate is the only honest signal, and it is imperfect.** Google patched the FOP's
  cone reliability after launch [P]. On iOS the equivalent signal can go invalid
  (`headingAccuracy` negative) [P].

**Answer to the brief's question:** it does not reliably self-correct. It self-corrects when the
phone moves through varied orientations in a clean field, which is precisely what the figure of
eight is. The screen must therefore keep the calibration coaching, driven by the error estimate, and
must not let the needle's smoothness read as trustworthiness.

---

## 3. What the reference apps show the user

### 3.1 Google Maps (Android), the beam

- The blue dot's direction arrow was replaced with "a shining blue beam, think of it as a flashlight"
  [P]. The width encodes uncertainty: "The narrower the beam, the more accurate your direction. The
  wider the beam, the more likely it is that your phone's compass is temporarily uncalibrated" [P].
- The canonical causes named by Google are everyday ones: "This can happen by doing something as
  simple as charging your phone or walking by a metal pole" [P].
- The copy is effort-bounded and appears without a prompt: "Any time you want to get back on track,
  not just when you see a prompt or notification, simply move your phone in a figure 8 motion a few
  times" [P].
- The calibrate flow (tap the blue dot, then "Calibrate") prefers the camera: Live View scanning,
  with "Use Compass" appearing as the fallback after a timeout, then a figure-of-eight screen with a
  live "Compass Accuracy" status that must reach "High" before "Done" [J, ghacks walkthrough]. A
  Google support answer gives the one-line version: "Make a figure 8 until your compass is
  calibrated. You should only have to do this a few times. The beam should become narrow" [P].
- Under the hood this is the FOP: "This is the same heading that is shown in Google Maps" [P], with
  `getHeadingErrorDegrees()` and `getConservativeHeadingErrorDegrees()` (a value "calculated from
  more samples") exposed per update [W, Repčík's API walkthrough of the Play services reference].

### 3.2 Apple Maps (iOS), the cone

- The equivalent is a blue "funnel" or wedge beside the dot: pie-shaped lines radiating over "about
  a sixth to an eighth of the blue dot's circumference", moving as the phone turns [J, MacMost]. An
  Apple Communities reply names its meaning: "Blue arrow with a faint line/cone pointing forward...
  Your direction is estimated within a range. That line/cone shows possible" directions [W].
- Width varies with certainty in the same way as Google's beam [J]. No numbers are shown.
- The failure reports are the mirror of Android's: the cone pointing 180 degrees opposite the
  direction of travel, fixed by recalibration rituals, or persistently wrong when the hidden Compass
  Calibration system toggle is off [W, HN and Apple Communities].

### 3.3 The iOS system calibration HUD

- Historically, Core Location showed a full-screen system HUD: a ring of tick marks and a red ball,
  "rotate your device in a full circle slowly moving the red ball around in a circle. Each tick mark
  in the circle will be illuminated as the ball passes by" [J, Gaia GPS help documenting Apple's
  overlay]. Apps opt in per session through the `locationManagerShouldDisplayHeadingCalibration`
  delegate and dismiss it with `dismissHeadingCalibrationDisplay()` [P, Apple docs].
- On current iOS this HUD has become rare; calibration is background and automatic, and Apple
  support forums steer users to "use your compass normally. It will calibrate automatically" [W].
  The user-facing control is buried: Settings, Privacy and Security, Location Services, System
  Services, Compass Calibration [W, multiple guides]. Turning it off silently degrades every map's
  cone [W, HN].

### 3.4 Android's equivalent

- There is no system-wide calibration HUD on modern Android. The de facto one is Google Maps' own
  in-app figure-of-eight animation [W, user reports]. Samsung devices carry a hidden diagnostic
  (dial `*#0*#`, sensor menu) that shows a compass "need calibration" state that some users report
  they cannot clear [W]. AOSP defines rotation-vector CTS tests that devices must pass [P], which is
  the compliance backstop, not a user-facing one.

### 3.5 The best qibla-specific displays

- Session 37 already catalogued these (Muslim Pro's hard-block loop, Zarrah's calibrate-first gate,
  Qibla Pro's star-crystallisation, lghou's "turn right 43 degrees" instruction, the "if the compass
  and the sun check disagree, trust the sun" line). One addition from this pass: Google's own Qibla
  Finder sidesteps the needle entirely with a camera AR overlay, the same Live View trust path Maps
  uses for its calibrate flow [P, Google blog, 2017].

**The shared visual language:** uncertainty is geometry (beam or cone width), calibration advice is
one sentence naming a motion, effort is bounded ("a few times", "you should only have to do this a
few times"), and the accurate state is a narrow shape with no words at all.

---

## 4. What replaces the current calibration warning

### 4.1 What changes about the trigger

Today (`components/sheets/screens/Qibla.tsx` and `device/qibla.ts`) the screen consumes one boolean:
`calibrated = accuracy > 1`, from iOS `CLHeading` bands or Android `onAccuracyChanged`. Under a
fused heading:

- Android's FOP supplies a continuous `headingErrorDegrees()` in [0, 180] per sample, plus
  `hasConservativeHeadingErrorDegrees()` for the multi-sample variant [W, from the Play services
  reference]. The raw SensorManager path (rotation vector) still delivers the 1-to-3 accuracy band,
  which is coarser but usable as a fallback signal [P, Android docs].
- iOS `CLHeading.headingAccuracy` stays, with the documented invalid case: "A negative value means
  that the reported heading is invalid, which can occur when the device is uncalibrated or there is
  strong interference" [P].
- The signal may be absent entirely: FOP unavailable, HAL stubbed (section 1.1), or the stream
  stalled (section 1.4). A missing signal is itself a state, not a default of "fine".

### 4.2 Proposed states

Five states, each with a trigger, a visual, and copy. The existing two-line card (reading plus hint)
is kept; only its content logic changes.

| State | Trigger | Visual | Copy (hint line) |
| --- | --- | --- | --- |
| `settling` | Sheet opened, heading stream started, error estimate not yet arrived or iOS accuracy negative | Needle shown, arc at its widest | "Finding north" |
| `steady` | Error estimate below 15 degrees for 3 seconds | Needle, narrow or no arc | none |
| `uncertain` | Error estimate above 15 degrees for 2 seconds (hysteresis both ways, so the line does not flicker) | Arc widens to the error angle | "The needle may be off. Move away from metal and magnets, then turn the phone in a figure of eight a few times." |
| `stalled` | No heading sample for 5 seconds while the sheet is open | Needle frozen, arc widest | "The compass has stopped responding. Close and reopen this screen." |
| `no-compass` | No usable heading source on the device (no magnetometer, or fused and raw both absent) | No needle; the bearing number stays, large | "This phone has no compass. The qibla from here is 119 degrees from north. Line that up with any physical compass, or check it against the sun." |

Decisions embedded there, with reasons:

- **The constant "Hold the phone flat" line is dropped.** Its trigger was raw-pair tilt sensitivity;
  the fused rotation vector does tilt compensation in the filter [P]. A permanently visible warning
  that no longer names a real condition trains the user to ignore the card. The physics from session
  37 (report 02, section 5) is about the raw pair and stays true for the gyro-less fallback path, so
  if the device lands on `GEOMAGNETIC_ROTATION_VECTOR` the tilt line returns for that path only.
  INFERRED from the sensor split; the sensor-API agent should confirm which path ships.
- **Thresholds are 15 degrees sustained 2 seconds in, 3 seconds out.** INFERRED: no public source
  gives Maps' internal thresholds. The tolerance context (session 37: Malaysian fatwa tolerance about
  10.8 degrees, the genre's ±5 degree alignment window) says a needle trusted beyond roughly 15 degrees
  is already past honest. The hysteresis follows from the S21 Ultra report of values that "fluctuate
  between a couple of degrees" at rest [W]: a single-sample trigger would flash.
- **`settling` exists because the first seconds of a fused heading are its least trustworthy.** The
  gyro bias estimate converges and iOS reports invalid accuracy until calibration settles [P]. The
  state prevents the user anchoring on the opening glide. It mirrors the existing "Finding your
  position" line in register and length.
- **`stalled` exists because stale-after-screen-off is documented (section 1.4) and a frozen needle
  with no message is the worst possible presentation of it.** The fix action is honest: only
  re-presenting the sheet re-subscribes, which the code already does.
- **`no-compass` keeps the exact bearing prominent.** The bearing needs no sensor [P, session 37's
  governing rule], and GetQibla's precedent (session 37, R2-02) shows the number plus a physical
  compass is a complete answer. The sun clause is expanded in section 6.

### 4.3 The copy, checked against the voice rules

The rule in the code comment holds: "Names the condition and what to do about it, never apologising
for the reading and never blaming the phone." Each proposed line:

- names the actor ("The needle", "The compass"), never "your phone" as the culprit;
- pairs the condition with exactly one motion;
- bounds the effort implicitly ("a few times"), which is Google's own framing [P];
- never says error, failure or unreliable bare, matching session 37's finding that every
  well-reviewed warning pairs the problem with one concrete action.

The figure of eight stays in the copy even though the fused sensor needs it less often, because
Google has spent a decade training users on this gesture and it is the one fix users perform without
being told [P][W].

---

## 5. Should the compass show a numeric confidence, and does anyone?

### 5.1 Survey

| App or device | Shows a number? | What it shows |
| --- | --- | --- |
| Google Maps | no | Beam width, and Low/Medium/High only inside the calibrate flow [P][J] |
| Apple Maps | no | Cone width [J] |
| iOS Compass app | no | Degrees only; the single uncertainty string is the tilt line [P, session 37 R2-02] |
| FOP API | to developers only | `getHeadingErrorDegrees()` [0, 180], not rendered as digits by Google [P][W] |
| Zarrah | yes, for position | Live GPS accuracy ("~18m" vs "~100m"); nothing numeric for heading [W, session 37 05] |
| Marine forum folk wisdom | mentally | "assume +/- 10-15 degrees uncertainty at best" for phone compasses, carried as advice, not UI [W] |
| Android platform | to developers only | Accuracy band defined at 68 percent confidence [P, Android docs] |

The pattern is uniform: every platform computes a number and every major consumer UI renders it as
geometry. Google owning a per-sample error in degrees and choosing a cone is the strongest signal
available.

### 5.2 Recommendation: no numeric confidence on screen

- **A number over-claims its own precision.** The Android band is a 68 percent confidence interval
  [P]; printing "±12" invites arithmetic the user cannot act on differently from "±25". Both mean
  "do the figure of eight".
- **It breaks the screen's governing split.** The number is exact and the needle is not. A second
  number, attached to the needle, blurs which number the app stands behind.
- **Numbers churn.** The error estimate moves per sample; a live digits field next to a smoothed
  needle contradicts the needle's calm, which is the one asset the fused path buys.
- **The counter-argument, stated fairly:** a number is unambiguous and screen-reader users get it
  without extra work; Zarrah shows transparency about accuracy builds trust rather than eroding it;
  and degrees are already the screen's native unit, so "±12 degrees" costs no new vocabulary. This is
  a real position, and if the owner wants maximal transparency it is defensible.
- **The resolution:** keep the display geometric, and put the band, rounded and coarse, into the
  accessibility label only: "Qibla 119 degrees from north. Needle steady." or "Needle uncertain."
  Screen-reader users get the state in words; sighted users get the arc. Nobody gets a churn of
  digits.

---

## 6. The "just face Saudi Arabia" user model

Session 37 measured the error of aiming at the country (23.1 degrees from Cairo, 14.7 from
Istanbul, 7.8 from London); that is not re-derived. This section is about what people do to
verify a direction.

### 6.1 The owner's described behaviour is the dominant one

In an r/islam thread where a qibla app gave a different direction every hour, the top practical
reply is verbatim the owner's model: "I use google maps for orientation: Open Google maps and turn
on your location. Try to recognize where you exactly are, then look on Google Maps which direction
you are facing right now and adjust it so you look towards Qibla" [W]. Other replies in the same
thread: use Google Earth's ruler to draw a line from your location to the Kaaba, step by step [W];
"search up the bearing of Makkah from your city... then open the compass app" [W]; "use nearby
mosques as guides" [W]; buy a Suunto clipper compass and memorise your city's bearing [W].

### 6.2 The landmark bridge is how "face that way" resolves in practice

- "Most apps also let you view the map of where you're currently at and point toward the Qibla. I
  find this method trustworthy... you figure out 'oh, so I stand this way relative to Suchandsuch
  Street in order to face the qibla'" [W].
- Satellite dishes as a rough qibla reference in Europe: "look for satellite dishes as they are a
  good indicator (they usually point south with various degrees), eg. Astra is 19.2 East so it's good
  enough to be a qibla" [W].
- The sun as the primary orientation source: "If you're in Europe it's South East, use the sun
  position to work out where east is" [W]; "it's easy to cross-check by looking at the direction of
  the sun east/west" [W]; a grandmother's method: "where the sun rises I just face a bit to the
  right of it" [W].
- Verification against a mosque's mihrab, including the discovery that some North American mosques
  are misoriented, which forces the user to choose between the app and the congregation [W].

So the mental model is not "a dial with a marker". It is "the app tells me a direction, I resolve it
against something I can see: a street, a dish, the sun, a mosque". The dial is a middle step the
user converts into a landmark. INFERRED: the app should help with that conversion rather than
polish the dial alone.

### 6.3 The sun check, precisely

- The twice-yearly rasd al-qibla: when the sun is directly over the Kaaba, any vertical shadow
  points along the qibla line. Dates and times are fixed globally: 27 or 28 May at 12:18 Saudi
  time, and 15 or 16 July at 12:27; the antipodal events (shadow points the qibla on the opposite
  bearing) fall on 12 to 14 January and 28 or 29 November. Observations within a five-minute window,
  or a day either side, carry "negligible deviation" [J, Wikipedia with cited astronomy literature].
- Daily: at the moment the sun crosses the great-circle path to Mecca, its shadow marks the qibla;
  the time depends on location and date and requires calculation [J].
- IslamQA endorses the sun method as a religiously sound determination [P, islamqa 95241], and users
  recommend it as the verification of apps: "Use the method that has always worked throughout the
  ages to verify the qiblah: Qiblah by Shadow" [W].
- lghou's line (session 37) already commits to it: "If the compass reading and the sun check
  disagree, trust the sun."

### 6.4 What the app can do, within "no API keys, no external services"

The sun's azimuth for a date, time and position is closed-form astronomy (the NOAA solar position
equations), computable on device with no service, the same class of maths the app already runs for
prayer times. Two concrete bridges, in ascending size:

1. **Copy only (cheap):** in the `no-compass` and help text, teach the sun check in one sentence:
   "In the morning the sun is roughly east; the qibla from London is 119 degrees from north, a
   little right of south-east." Matches the grandmother's method users already trust.
2. **A computed line (one feature):** when the sheet is open, show "The sun is at 214 degrees now"
   beside the qibla bearing, so the user can face the sun and turn by the difference. On rasd days,
  the line becomes "The shadow points along the qibla at 13:27 today". This is the strongest bridge
  between "a dial" and "face that way" found anywhere in this research, it needs no sensor at all,
  and it degrades gracefully: it works on every phone, including the `no-compass` one.

INFERRED sizing: option 2 is a planner decision, not a copy decision, and the solar-azimuth code
would need its own tests. Flagged as a proposal, not a requirement.

---

## 7. Accessibility and the honest degradation path

### 7.1 No gyroscope

- The documented fallback is `TYPE_GEOMAGNETIC_ROTATION_VECTOR` (accelerometer plus magnetometer,
  no gyro), which is what stardroid's reporter proved workable on a gyro-less Samsung with a
  low-pass filter [P, issue 188]. Android's own docs describe it as lower accuracy and lower power,
  suitable when the full rotation vector is unavailable [P].
- That is exactly the sensor pair the app ships today. So a gyro-less phone keeps the current
  behaviour, wobble and all, and the honest thing is to say so rather than pretend the upgrade
  reached it. The `uncertain` state's hysteresis thresholds may need loosening on this path, since
  the wobble is real.

### 7.2 No magnetometer

- Real classes: budget Androids, Wi-Fi iPads, iPod Touch, Kindle Fire; SkySafari names the latter
  two and ships a distinct UX for them [P, vendor docs].
- The honest degradation is already the app's rule: the bearing survives, the needle does not. The
  `no-compass` state (section 4) is the screen for it, with the bearing large, the physical-compass
  line, and the sun bridge.
- SkySafari's gyro-only mode offers a second pattern for gyro-without-compass devices: point at a
  known reference, then track relative rotation [P]. For a qibla screen the reference would be the
  sun or a street. INFERRED: attractive, but it adds a whole interaction for a thin device slice;
  the copy-only sun bridge serves the same users at a fraction of the cost.

### 7.3 What a screen reader should announce

- Apple's Compass is the model: "Compass 349 degrees, N, Rutland, VT" as the value, changes announced
  on the user's turn rather than continuously, the tilt warning spoken as it becomes true [P,
  Perkins transcript, quoted in session 37 R2-02].
- The announce-on-demand model from a blind developer's compass: the user taps to interrogate; the
  app does not babble [P, session 37]. The general rule: "Never mark the streaming region live, you
  will fire hundreds of announcements" [P, session 37].
- The VISA Talking Compass, built by blind sailors for blind sailors, adds the one pattern this app
  should copy: set a target heading, then "alerts you to deviation from that heading with tones or
  spoken directions", with user-adjustable precision and announcement frequency [W, AppleVis
  thread by the developer]. Translated: the qibla bearing is the target, the announcement is the
  deviation, and the user chooses how often to hear it. Its reported bug is a warning: after ending
  a "journey", the heading "stops changing and is stuck" until app restart [W, same thread]. Any
  a11y state machine needs an exit ramp back to live readings.
- Announcement set for this screen, transitions only: entering `uncertain`, returning to `steady`,
  and (if the turn-instruction work from session 37 lands) entering and leaving the aligned window.
  The label carries the state words from section 5 ("Needle steady" / "Needle uncertain"), never a
  live digits stream.

### 7.4 Haptics for alignment

- Established in this exact domain: the Garmin qibla watch vibrates within its 5 degree window
  [P, listing, session 37]; Qibla Pro quickens a vibration pulse as error falls and fires "a
  signature pulse" on alignment, built with feedback from a blind user [P, session 37].
- Established generally: HapticNav on Apple Watch guides by vibration alone [P, listing]; Apple
  Watch Maps encodes turn direction in distinct wrist patterns [J, CIO].
- Recommendation unchanged from session 37 and reinforced: a rising haptic cadence as the error
  shrinks, one distinct pulse inside the aligned window, and the text state change alongside, so
  colour, sound and touch each carry the same transition (WCAG 1.4.1 [P, session 37]).
- For this app's visually-impaired audience specifically, the overlay precedent matters: the qibla
  sheet already renders its state as text lines, which the overlay's large text will scale. The
  screen-reader labels above complete that path. A compass that is only a needle excludes them; a
  compass that speaks its transitions and buzzes its alignment includes them.

---

## COULD NOT VERIFY

- **Any measured time constant for fused-heading reconvergence.** The Oculus post gives the theory
  (integrated gyro error pulled back by the magnetometer) but no phone-fusion constants; no source
  quantifies "how long until it corrects itself". What the field gives is behavioural: minutes to
  days, cured by motion or relocation [W]. Searched: gyro drift correction time, Kalman magnetometer
  trust time constant, FOP convergence.
- **Maps' internal beam thresholds.** No public source gives the degree values at which the beam
  widens or the calibrate flow triggers. The 15-degree proposal in section 4 is inferred from the
  tolerance literature, not copied.
- **The full text of two bot-blocked pages:** android.stackexchange 143246 (magnet not moving an
  Android compass; snippet and the fizziq experiment corroborate the claim) and Stack Overflow
  71659843 (Wear OS sensor pause on screen-off; title and snippet verified, body not). Both are
  cited on snippet strength and marked accordingly.
- **A public post-mortem of a qibla app migrating to the fused sensor.** No app documents the
  before-and-after. Session 37 already noted the absence of formula post-mortems; the migration
  post-mortem is equally absent. The closest evidence is nothing.community (users discovering the
  fused/raw toggle) and Google's FOP launch rationale.
- **Whether `expo-sensors`' iOS motion permission prompt fires for attitude-only reads.** Owned by
  the sensor-API agent; nothing in this pass settles it.

---

## Sources

| Grade | Source | Used for |
| --- | --- | --- |
| P | blog.google, "Always know which way you're headed", 2016-09-20 | Beam semantics, figure-8 copy, "immediately" claim |
| P | android-developers.googleblog.com, "Introducing the Fused Orientation Provider API", 2024-03-07 | FOP fusion list, gyro-bias compensation, Maps uses FOP, cone reliability patch, foreground-only, Play services requirement |
| P | developer.apple.com, `CLHeading.headingAccuracy` | Negative accuracy is invalid heading |
| P | developer.apple.com, `locationManagerShouldDisplayHeadingCalibration` and `dismissHeadingCalibrationDisplay` | The opt-in system calibration HUD |
| P | developer.android.com, position and motion sensors docs | Geomagnetic rotation vector as no-gyro fallback, 68 percent accuracy definition |
| P | source.android.com, rotation vector CV crosscheck | CTS compliance testing exists |
| P | github.com/sky-map-team/stardroid issue 188 | Gyro-less Samsung with no rotation vector, GRV fallback proof |
| P | github.com/expo/expo issues 19523, 2430, 7051, discussion 7893 | DeviceMotion availability and orientation-0 bugs on Android |
| P | github.com/react-native-sensors/react-native-sensors issue 451 | Cross-platform orientation frame mismatch |
| P | developers.meta.com/horizon/blog/magnetometer, Steve LaValle | Yaw drift mechanism, calibration ellipsoid fit |
| P | userguide.skysafariastronomy.com and support.simulationcurriculum.com | Ten-degree error budget, gyro-only mode, no-compass devices |
| P | islamqa.info answer 95241 | Religious endorsement of the sun method |
| J | en.wikipedia.org, "Qibla observation by shadows" | Rasd al-qibla dates, times, accuracy window |
| J | fizziq.org, "Why is a smartphone compass not affected by magnets?" | Dynamic calibration hiding interference, raw-data opacity |
| J | ghacks.net compass calibration walkthrough, 2023 | Maps calibrate flow, Live View fallback, Low/Medium/High |
| J | macmost.com forum on Apple Maps radiating lines | Cone geometry description |
| J | help.gaiagps.com, "Compass Calibration in iOS" | The red-ball system HUD described |
| J | CIO on Apple Watch Maps haptics | Distinct turn-direction wrist patterns |
| W | nothing.community, "Compass Inaccuracy and no calibration in Google Maps", 2025 | Fused worse than raw, "USE ADVANCED SENSOR" off fix |
| W | r/samsunggalaxy, "Compass calibration", 2022 | S21 Ultra 90-degree family, Dioptra azimuth scatter, A53 slow sweep indoors |
| W | r/Nexus6P, "compass is very often about 90 degrees off", 2016 | 90-degree offset, calibration holding seconds |
| W | r/SonyXperia, "Compass off by 90 degrees", 2023 | Exact clockwise offset, calibration-immune, Xiaomi corroboration |
| W | r/explainlikeimfive, "why Google Maps is bad at figuring out direction", 2022 | User descriptions of gyro-carried drift, GPS-override behaviour |
| W | news.ycombinator.com item 46264074 | Compass Calibration toggle silently degrading the cone; fix holding "only for a minute" |
| W | blog.kchung.co, "Recalibrate the iOS Compass" | Screen-off stale-heading ritual |
| W | tomasrepcik.dev, "Update your compass, new Android Orientation API" | FOP output surface, heading error degrees methods |
| W | community.st.com, fusion HAL stub thread, 2025 | Zero-output fused sensors on valid raw drivers |
| W | r/islam threads 1g21km2, 3hyhm8, 1imq97s; r/MuslimLounge qjg1ab | User verification behaviour: Maps orientation, Google Earth ruler, satellite dishes, sun, mosques, shadow method |
| W | applevis.com, VISA Talking Compass thread | Target-heading deviation alerts, adjustable cadence, stuck-heading bug |
| W | Mapillary forum "Map rotation erratic" (snippet) | Smooth-then-erratic heading in the field |
| W | support.google.com/maps thread 5071162 | Official one-line calibrate instruction |
| S37 | Session 37 reports 02, 05, R2-02 | Baseline being confirmed, weakened or overturned |

The r/Blind, r/iphone and Apple Communities threads surfaced in search corroborate sections 2 and 7
at snippet level and are not load-bearing on their own.
