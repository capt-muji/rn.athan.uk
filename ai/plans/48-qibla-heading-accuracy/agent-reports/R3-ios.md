# R3: the iOS heading

Commissioned 2026-10-02 and checked against this repository. **The most intellectually honest of the three**:
it refuted the hypothesis it was sent to confirm, bounded its best finding at a magnitude too small to be the
owner's bug, and said so in writing. No correction was needed to any of its claims; everything verifiable was
verified independently.

## 1. The calibration alert: CONFIRMED as a gap, REFUTED as the cause

Confirmed independently (`CLLocationManagerDelegate.h:69-75` and Apple's docs): with no
`locationManagerShouldDisplayHeadingCalibration` implementation, Core Location never shows the alert, so this
app's iOS users have never been offered it. **Then it refuted the hypothesis on the owner's own protocol:**
"The alert is UI, not algorithm. It does not calibrate anything. It is a prompt that gets the user to supply
the motion diversity the hard-iron estimator needs." The owner already supplies that motion by shaking, so
the alert adds no information he is not already providing, and the scatter persists through it. **This
downgraded the lever this session had ranked second** (`FINDINGS.md` 5), correctly. It still buys Apple's own
designed explanation and an OS-level "iOS considers itself uncalibrated" signal.

Three detection primitives needing no alert, verified from SDK headers: `CLHeading.headingAccuracy` (degrees;
**negative means invalid, uncalibrated, or strong local interference**, `CLHeading.h:70-76`);
`CMDeviceMotion.magneticField.accuracy` (`Uncalibrated/Low/Medium/High`); and `CMErrorDeviceRequiresMovement`,
a vendor-defined "please move the phone" with no HUD and no invented threshold.

On persistence: calibration lives in `locationd`, shared by all apps, so an app restart does not by itself
discard the estimate. The retention policy is **UNVERIFIED**, the report's biggest open question, accepted
as the honest state.

## 2. What Apple Maps uses: UNVERIFIED, and the report refuses to speculate

Only the cone is established, on consistent third-party reporting: driven by `headingAccuracy` or something
close, and one investigation's root cause was **a phone case with a magnetic clasp**, a permanent hard-iron
source riding with the device. Apple's flagship compass draws the uncertainty, not a confident needle, and is
not immune itself (public report of the iOS 18 cone wrong on an iPhone 15).

## 3. `CMDeviceMotion`: an iOS 27 trap on the owner's XS

`CMDeviceMotion.headingAccuracy` is **iOS 27+** (`CMDeviceMotion.h:147`); the owner's XS runs 18.7.10, where
CoreMotion offers only the 4-level `magneticField.accuracy` enum, **coarser than the degrees `CLHeading`
already has**, so switching would lose resolution. WWDC 2012 session 524 (Andy Pham): on the accuracy enum,
"if the field that you get has uncalibrated level of accuracy, **it's essentially a random number generator
for you in terms of the heading**... **You really want to live around the medium and the high.**" Comparative
evidence leans against CoreMotion for stability too: the `MagnetoMeter` project measured `CLHeading`
"far more stable than any of these" and `CMCalibratedMagneticField` "considerably less stable and accurate
than `magneticHeading`". The Oppo result does not transfer (different OS, different stack).

**A documented warm-up supporting the settling gate from the vendor's mouth:** "The gyro takes a little
longer, **as much as two seconds to spin up**... what we do is we hold that data back until it becomes
sensical." **Core Motion withholds data until sensible; Core Location does not**: `startUpdatingHeading`
delivers an immediate first heading with no convergence guarantee. Apple-sourced argument that the first
`CLHeading` reading is the wrong one to draw, measured here at ~30 degrees against 0.71 converged.

## 4. `headingAccuracy`: a sound reject signal, not a certify signal

It is Core Location's estimate of its own uncertainty, so it cannot report an error it has not detected: a
clasp absorbed over months looks fine. Sound for "do not trust this reading", unsound for "this reading is
correct". Apple's legacy sample gates `if (newHeading.headingAccuracy < 0) return;` unconditionally; this app
does not, because `expo-location` never gives it the chance. And the sharpest point in all three reports: the
bucketing means bucket 3 spans 0 to 20 degrees, **the entire range the owner complains about**, so the one
number that could distinguish a good reading from a 20-degree-wrong one is quantised to uselessness at Expo's
JS boundary. Typical XS values: UNVERIFIED; the report refuses to invent a distribution.

## 5. The iOS 26 course-substitution report: real, correct, and NOT this bug

Stack Overflow 79802366: under sustained vehicular motion Core Location may substitute course for heading.
A published iOS author confirms it is documented behaviour, and the reporter confirms correctness when
stationary, so a user standing indoors is nowhere near it. The design consequence stands: `CLHeading` is not
a pure device-orientation API; `CMDeviceMotion.heading` is. iOS version boundary UNVERIFIED, one device each
side.

## 6. The architectural bug, honestly bounded

**`DeviceHeadingStreamer` never starts location updates on its own manager** (verified: it calls only
`startUpdatingHeading()`; each `BaseLocationProvider` streamer has its OWN `CLLocationManager`), and this app
runs no continuous position watch. Apple: `trueHeading` "contains a valid value only if location updates are
also enabled for the corresponding location manager object." Then the bound, the best paragraph in the three
reports: "In London, about 1.2 degrees, and I want to be explicit that this does not explain your problem...
**Had I not checked the number I might have sold you this as the answer; it isn't.**" NOAA WMM-2025, London,
2026-10-02: declination **1.205 ± 0.380**. A correctness bug worth fixing, not a 30-degree bug. Two smaller
corrections to this repo's notes: `headingOrientation`'s default is already portrait (setting it is a no-op
today; deprecated on iOS 27+), and **`headingFilter`'s default is 1 degree, not 2**: `device/qibla.ts:65`'s
comment describes Android's gate and is wrong about iOS.

## 7. Ranked causes, and the measurement to take first

1. Hard-iron estimate converging to a DIFFERENT solution each run, in a magnetically dirty room: **most
   likely**; 2. a reading accepted before the fusion converges: highly likely contributor, cheapest to test
   (the pre-gate app even STORED the earliest pre-bearing reading in `heldRef`); 3. per-launch calibration
   reset: plausible, UNVERIFIED, the biggest open question; 4. local fields, likely present, bounds what is
   achievable; 5. a reading accepted while `headingAccuracy` is negative: likely happening; 6. the missing
   `startUpdatingLocation`: real, ~1.2 degrees; 7. the alert never offered: real gap, not the cause.

**The first measurement, adopted by this row:** "Log `trueHeading`, `magneticHeading`, and **`headingAccuracy`
in degrees** at 1 Hz for 10 seconds, across 10 app restarts, at one fixed spot, then repeat outdoors. That
single dataset discriminates between #1, #2 and #4, and it tells you whether the platform already knows it's
wrong." And: "**You cannot take that measurement through `expo-location`**... a diagnostic instrument first
and a product change second." The discriminator: scatter correlating with `headingAccuracy` means the app can
act; 30 degrees with `headingAccuracy` 5 means a local field was absorbed and **no software fix exists**;
scatter collapsing outdoors means physics.

## 8. What cannot be fixed

Local magnetic fields in a house: Apple: calibration filters "only those magnetic fields that move with the
device", so a field fixed in the ROOM is indistinguishable from the earth's by any software. A physics limit,
not a software limit, and the best explanation for the owner's data. The fundamental ambiguity: a phone
cannot know it is wrong when a steady field has been absorbed. "no iOS API will make it consistent, and the
correct product answer is to show uncertainty honestly and tell the user to move."
