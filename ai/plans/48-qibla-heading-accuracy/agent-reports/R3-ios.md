# R3: the iOS heading

A research report commissioned on 2026-10-02 and checked against this repository. **It is the most
intellectually honest of the three**: it refutes the hypothesis it was sent to confirm, bounds its own best
finding at a magnitude too small to be the owner's bug, and says so in writing rather than selling it. No
correction was needed to any of its claims. Everything below was verified independently where this session
could verify it.

---

## 1. The calibration alert: CONFIRMED as a gap, REFUTED as the cause

The report confirms this session's independent reading of Apple's documentation: with no
`locationManagerShouldDisplayHeadingCalibration` implementation, Core Location never shows the alert, and
this app's iOS users have therefore never been offered it. Verified in `CLLocationManagerDelegate.h:69-75`
and in Apple's own documentation.

**Then it refutes the hypothesis on the owner's own protocol, which is the right way to kill an idea:**

> "The alert is UI, not algorithm. It does not calibrate anything. It is a prompt that gets the user to
> supply the motion diversity the hard-iron estimator needs."

And the owner is already supplying exactly that motion. 🐋  "if I shake the phone about it... I shake it
about it, recalibrate it". So the alert would add no information he is not already providing, and the
scatter persists through it. **This downgrades the lever this session had ranked second** (`FINDINGS.md`
section 5), and the downgrade is correct.

What it would still buy, and why it is worth doing anyway: Apple's own designed explanation of why the
compass needs waving, better than anything this app would write, plus an OS signal that iOS currently
considers itself uncalibrated.

**Three detection primitives that need no alert**, all verified from the SDK headers:

| Path | What it gives | Header |
| --- | --- | --- |
| `CLHeading.headingAccuracy` | Degrees of claimed error; **negative means invalid, uncalibrated, or strong local interference** | `CLHeading.h:70-76` |
| `CMDeviceMotion.magneticField.accuracy` | `Uncalibrated = -1`, `Low`, `Medium`, `High` | `CMDeviceMotion.h:40-45` |
| `CMErrorDeviceRequiresMovement` | An explicit, documented "I need you to move", fired once | `CMMotionManager.h:412-420` |

The third is the cleanest primitive on the platform: a vendor-defined "please move the phone" signal with no
HUD and **no invented threshold**, which matters under the owner's no-constants rule.

**On persistence:** calibration lives in `locationd`, a system daemon shared by all apps, which is why the
folk remedy is the system-wide Settings toggle and why Apple ships that switch at all. So an app restart does
not by itself discard the estimate. The report marks the retention policy **UNVERIFIED** and names it as the
biggest open question it could not close. This session accepts that as the honest state.

## 2. What Apple Maps uses: UNVERIFIED, and the report refuses to speculate

> "Honest answer: I could not establish this from primary sources, and I am not going to speculate."

MapKit documents only that `MKUserTrackingMode.followWithHeading` "requires the device to have an available
magnetometer", which rules nothing out. No WWDC session, sample project or credible write-up settles it.

**What IS established, and it is the design precedent the plan cares about:** the cone is near-certainly
driven by `headingAccuracy` or something very close, on consistent third-party reporting, and one such
investigation's root cause turned out to be **a phone case with a small magnetic clasp**, a permanent
hard-iron source riding with the device. So **Apple's own flagship compass UI does not draw a single
confident direction: it draws the uncertainty.** And Apple Maps is not immune to this problem; there is a
public report of the iOS 18 cone being wrong on an iPhone 15.

## 3. `CMDeviceMotion`: the alternative, with an iOS 27 trap for the owner's XS

| | `CLHeading.trueHeading` | `CMDeviceMotion.heading` with `.xTrueNorthZVertical` |
| --- | --- | --- |
| Gyro-fused | Not documented, behaves so | **Yes, documented** |
| True north needs location | Yes | Yes |
| Reference point | Top of device, portrait, via `headingOrientation` | Device X axis; the app must apply its own portrait convention |
| Degree-valued accuracy | `headingAccuracy`, **available today** | `CMDeviceMotion.headingAccuracy` is **iOS 27+** (`CMDeviceMotion.h:147`) |

**The trap, and it is decisive for this device.** The owner's iPhone XS runs iOS 18.7.10, where
`CMDeviceMotion.headingAccuracy` does not exist. On iOS 18 the only accuracy available from CoreMotion is the
4-level `magneticField.accuracy` enum, which is **coarser than the `headingAccuracy` degrees `CLHeading`
already offers**. So switching to CoreMotion on this handset would lose resolution rather than gain it.

**WWDC 2012 session 524, Understanding Core Motion** (Andy Pham, Apple) supplies two quotes the plan uses.
On fusion being the point of device motion:

> "What if we can combine all three of those sensors, fuse them all together to give you, basically, the
> pointing stability of the magnetometer and the accelerometer, and the responsiveness of the gyro?"

And on the accuracy enum, which is an Apple engineer stating that uncalibrated data is worthless and that an
app should gate on it:

> "if the field that you get has uncalibrated level of accuracy, **it's essentially a random number
> generator for you in terms of the heading**. Low means it's marginal... **You really want to live around
> the medium and the high.**"

**Would CoreMotion be more stable run to run? The available evidence says no.** Both paths sit on the same
magnetometer and the same `locationd` hard-iron estimate. The best comparative measurement found is the
`MagnetoMeter` project, which measured all three APIs side by side:

> "`CLHeading.magneticHeading`, Apple's recommendation for magnetic compass reading, is **far more stable
> than any of these**."

> "CMDeviceMotion's `CMCalibratedMagneticField` seems to be the next most desirable, **although considerably
> less stable and accurate than `magneticHeading`**."

So the report concludes it cannot honestly claim CoreMotion will be more consistent, and that the evidence
leans the other way. **The Oppo result does not transfer: that is a different OS with a different stack.**

**A documented warm-up, which supports this session's settling gate from the vendor's own mouth:**

> "The accelerometer starts up right away. **The gyro takes a little longer, as much as two seconds to spin
> up.** So if you were to start pulling right away, you're going to get nonsensical data... So what we do is
> we hold that data back until it becomes sensical."

**Core Motion withholds data until it is sensible. Core Location does not.** `startUpdatingHeading`'s own
documentation says the opposite: it "causes it to obtain an initial heading and notify your delegate",
immediately, with no convergence guarantee. That asymmetry is an Apple-sourced argument that the first
`CLHeading` reading is the wrong one to draw, which is exactly what `MEASURED.md` measured at about 30
degrees of error against 0.71 converged.

## 4. `headingAccuracy`: degrees, and a sound reject signal but not a certify signal

`CLHeading.h:70-76`: "Represents the maximum deviation of where the magnetic heading may differ from the
actual geomagnetic heading **in degrees**. A negative value indicates an invalid heading."

**Is a large value predictive?** Partly, and the limit is the important half: it is Core Location's estimate
of its own uncertainty, so it cannot report an error it has not detected. A magnetic clasp that has been in
the case for months may be silently absorbed into the model. **So it is a sound basis for "do not trust this
reading" and an unsound basis for "this reading is correct"**, which is how a compass UI should treat it.

Apple's own legacy sample gates on it unconditionally, `if (newHeading.headingAccuracy < 0) return;`. **This
app does not, because `expo-location` never gives it the chance.**

**The bucketing is what makes this unusable today, and the report makes the sharpest point in all three
reports about it:** bucket 3 means "anywhere from 0 to 20 degrees", which **spans the entire range the owner
is complaining about**, and bucket 3 is what the app would see most of the time. So the one number that could
distinguish a good reading from a 20-degree-wrong one is quantised to uselessness at Expo's JS boundary.

**Typical XS values: UNVERIFIED.** The report refuses to invent a distribution and notes that two third-party
modules pick thresholds of 10 and 5 degrees by choice rather than by measurement.

## 5. The iOS 26 course-substitution report: real, correct, long-standing, and NOT this bug

Stack Overflow 79802366 is real. The accepted answer, from a published iOS author, says the behaviour is
correct rather than a regression:

> "In a moving automobile, how the user is holding the device is usually unimportant to you: what you want to
> know is which way the car is moving. **If the runtime concludes, from the nature of the device's motion,
> that when you ask for heading you probably mean course, it will provide the course as the heading.**"

Apple's own legacy guide anticipates the substitution. The trigger is sustained vehicular motion and the
reporter confirms correct behaviour when stationary, so **a user standing in his house is nowhere near it.**

**But it has a real design consequence:** `CLHeading` is not a pure device-orientation API. Core Location
reserves the right to substitute course. `CMDeviceMotion.heading` is the API with the orientation-only
contract, and that is a correctness argument for CoreMotion rather than an accuracy one. The iOS version
boundary is **UNVERIFIED**, one device each side.

## 6. The architectural bug the report found, and honestly bounded

**`DeviceHeadingStreamer` never starts location updates on its own manager.** Verified independently by this
session:

```
node_modules/expo-location/ios/Providers/DeviceHeadingStreamer.swift:28:  manager.startUpdatingHeading()
node_modules/expo-location/ios/Providers/LocationsStreamer.swift:28:     manager.startUpdatingLocation()
```

`startUpdatingLocation` appears nowhere in `DeviceHeadingStreamer`, and `BaseLocationProvider` gives each
streamer its OWN `CLLocationManager`. Apple's requirement is explicit on both the `CLHeading` and
`trueHeading` pages: "This property contains a valid value only if location updates are also enabled for the
corresponding location manager object."

And in this app's flow no continuous location session is started anywhere: `readPosition` prefers
`getLastKnownPositionAsync`, which is `CLLocationManager().location` on a throwaway instance, and the
fallback is a one-shot `requestLocation()`.

**Then the report bounds it and declines to oversell it, which is the best paragraph in the three reports:**

> "In London, about 1.2 degrees, and I want to be explicit that this does not explain your problem...
> **Had I not checked the number I might have sold you this as the answer; it isn't.**"

NOAA WMM-2025 for London on 2026-10-02: declination **1.205 degrees, uncertainty 0.380**. Since the app
observes `trueHeading != -1`, `locationd` is evidently supplying a cached fix and the declination IS being
applied. So this is a correctness bug worth fixing, about 1 degree in London and much more in high-declination
regions, and **not a 30-degree bug**.

**Two smaller corrections to this repository's own notes:**

- `headingOrientation`'s default is already `CLDeviceOrientationPortrait` (`CLLocationManager.h:394-403`),
  which matches this portrait-only app, so setting it is a no-op today. It is also
  `API_DEPRECATED_WITH_REPLACEMENT("headingBody", ios(4.0, 27.0))` on iOS 27+.
- **`headingFilter`'s default is 1 degree, not 2** (`CLLocationManager.h:386-393`). `device/qibla.ts:65`
  currently says "the platform gates it at 2 degrees and 50ms", which is Android's gate, not iOS's. The
  comment in the shipped code is wrong about the platform it is describing.

## 7. The ranked causes, and the measurement to take first

| Rank | Cause | Verdict |
| --- | --- | --- |
| **1** | Hard-iron estimate converging to a DIFFERENT solution each run, in a magnetically dirty room | **Most likely.** Fits the magnitude, the scatter, and the cross-platform symmetry |
| **2** | A reading accepted before the fusion converges | **Highly likely contributor, cheapest to test.** `startUpdatingHeading` is documented to deliver an immediate first heading with no convergence guarantee, and `hooks/useQibla.ts:92` even STORES the earliest pre-bearing reading in `heldRef` and replays it later at line 165 |
| 3 | Calibration state resetting per launch | Plausible, **UNVERIFIED**, the biggest open question |
| 4 | Local magnetic fields in the house | Likely present, partly folded into 1. Bounds what is achievable |
| 5 | A reading accepted while `headingAccuracy` is negative | Likely happening. `NO_HEADING = -1` catches only `trueHeading == -1`, never a negative ACCURACY with a plausible-looking heading |
| 6 | The missing `startUpdatingLocation` | Real bug, about 1.2 degrees in London |
| 7 | The calibration alert never offered | Real gap, not the cause |

**The single measurement the report would take first**, and the plan adopts it as step 1:

> "Log `trueHeading`, `magneticHeading`, and **`headingAccuracy` in degrees** at 1 Hz for 10 seconds, across
> 10 app restarts, at one fixed spot, then repeat outdoors. That single dataset discriminates between #1, #2
> and #4, which are the three candidates that actually matter, and it tells you whether the platform already
> knows it's wrong."

With the conclusion that justifies a native module on diagnostic grounds rather than product ones:

> "**You cannot take that measurement through `expo-location`**, because it buckets `headingAccuracy` away...
> you currently cannot see the data that would tell you whether the heading is fixable. I'd write it as a
> diagnostic instrument first and a product change second."

**And the discriminator that decides whether to keep going:** if the scatter correlates with
`headingAccuracy`, the platform is declaring its own uncertainty and the app can act on it. If the error is
30 degrees while `headingAccuracy` reads 5, a local field has been silently absorbed into the calibration
and **no software fix exists**. If the scatter collapses outdoors, the answer is physics.

## 8. What it says cannot be fixed, which the plan reports to the owner as-is

- **Local magnetic fields in a house.** Apple is explicit that calibration "is able to filter out only those
  magnetic fields that move with the device", so a field fixed in the ROOM is indistinguishable from the
  earth's by any software. **A physics limit, not a software limit**, and the report's best explanation for
  the owner's data, since standing in the middle of a house is the worst case.
- **The fundamental ambiguity.** A phone cannot know it is wrong when a steady local field has been absorbed
  into its calibration: `headingAccuracy` looks fine and the heading is off.
- **It cannot make `headingAccuracy` more accurate, only visible.**

> "And the thing it most likely cannot fix is the thing the owner actually asked for... **no iOS API will
> make it consistent**, and the correct product answer is to show uncertainty honestly and tell the user to
> move. I think you should go into this expecting that outcome to be at least partly true."
