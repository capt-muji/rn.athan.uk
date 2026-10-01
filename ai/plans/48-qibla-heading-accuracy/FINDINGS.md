# Session 48 findings: where the heading comes from

This page is the answer to the row's question. `MEASURED.md` holds the numbers this session computed itself;
the platform reading below is from the installed source and from primary documentation, cited line by line.

---

## The short version

1. **`expo-location`'s iOS path is faithful to `CLHeading`, so the XS is already on the value Apple Maps
   draws.** The module passes `CLHeading.trueHeading` through untouched. There is no bug to fix there, which
   kills option 4 of the row's four options as stated.
2. **But the module never configures Core Location, and one omission is a real defect for this app.** It
   never implements `locationManagerShouldDisplayHeadingCalibration`, and Apple documents that the
   consequence is that **the calibration alert is never shown**. So in four sessions of work the owner's
   iPhone has never once been offered the figure-of-eight prompt that iOS uses to separate the earth's field
   from the metal in his house.
3. **The owner's "inconsistent run to run" symptom has two halves, and only one is fixable.** A cold sensor
   fusion that has not converged is fixable, measured at a 42.1x improvement. A biased field in the room is
   not, and the physics check session 40 specified for it cannot bound the error: a 10 uT offset swings the
   heading 30.8 degrees while passing the check.

---

## 1. What `expo-location` 58.0.9 actually does, read from its own source

### iOS: faithful to `CLHeading`, and configured for nothing

| Where | What it does |
| --- | --- |
| `ios/LocationModule.swift:99` | `AsyncFunction("watchDeviceHeading")` builds a `DeviceHeadingStreamer` with `LocationOptions(accuracy: .bestForNavigation, distanceInterval: 0)` |
| `ios/LocationModule.swift:113-117` | Forwards `heading.trueHeading`, `heading.magneticHeading` and `normalizeAccuracy(heading.headingAccuracy)` |
| `ios/Providers/DeviceHeadingStreamer.swift:28` | Calls `manager.startUpdatingHeading()` |
| `ios/Providers/DeviceHeadingStreamer.swift:43-45` | `didUpdateHeading` yields the raw `CLHeading`, unmodified |
| `ios/Providers/BaseLocationProvider.swift:11-16` | Sets ONLY `allowsBackgroundLocationUpdates`, `distanceFilter`, `desiredAccuracy` and `delegate` |

So `trueHeading` reaches the app exactly as Core Location produced it. **This exonerates `expo-location`'s
iOS arithmetic completely**, and with session 47's frame measurements already exonerating the app's own
geometry to 0.1 degrees, the remaining suspects are Core Location's own state and the field in the room.

**Three things the module never sets.** Grepped across the whole package for each name, zero hits:

| API | What it would do | Does this app need it? |
| --- | --- | --- |
| `headingOrientation` | Chooses which device axis counts as "forward" | **No.** Unset means the top of the device in portrait, which Apple documents, and this app is portrait-only. Correct by luck rather than by choice, but correct |
| `headingFilter` | Suppresses updates below N degrees of change | **Possibly.** Default is 1 degree; it is not the 2-degree gate, which is Android's |
| `locationManagerShouldDisplayHeadingCalibration` | Lets iOS show the figure-of-eight prompt | **Yes, and this is the finding.** See below |

### The calibration alert, which this app's users have never seen

Apple's documentation for `locationManagerShouldDisplayHeadingCalibration(_:)` is explicit:

> "If you return `false` from this method **or do not provide an implementation for it in your delegate**,
> Core Location does not display the heading calibration alert."

And on when it would otherwise be offered:

> "Typically, Core Location calls this method at the following times: The first time heading updates are ever
> requested. When Core Location observes a significant change in magnitude or inclination of the observed
> magnetic field."

> "The calibration alert prompts the user to move the device in a particular pattern so that Core Location
> can distinguish between the Earth's magnetic field and any local magnetic fields."

Both of those triggers describe the owner's exact situation: he opens the sheet for the first time in a
process, standing in a house full of local magnetic fields. **`expo-location` implements no such delegate
method, so the prompt cannot fire**, and the owner has been shaking the phone by hand to do a job iOS has a
guided flow for.

Apple also states the limit, which matters for honesty about what this would buy:

> "The calibration process is able to filter out only those magnetic fields that move WITH the device. To
> calibrate a device that is near other sources of magnetic interference, the user must either move the device
> away from the source or move the source in conjunction with the device."

So calibration fixes a magnet in the phone case; it does not fix a steel joist in the wall. That is consistent
with the owner seeing a residual error that no amount of shaking removes.

### Android: accelerometer plus RAW magnetometer, no gyroscope

| Where | What it does |
| --- | --- |
| `android/.../LocationModule.kt:~648` | `SensorManager.getRotationMatrix(rotationMatrix, inclinationMatrix, mGravity, mGeomagnetic)` then `getOrientation(...)` |
| same, `:~656` | Gates on `abs(orientation[0] - mLastAzimuth) > DEGREE_DELTA && now - mLastUpdate > TIME_DELTA`, documented in its own comment as about 2 degrees and 50ms |
| same, `:~660-661` | Applies `calcMagNorth` then `calcTrueNorth`, so the module adds declination itself |

Two consequences this session relies on. **The 2-degree gate is why a still phone emits almost nothing**,
which is what makes any reading-counted settling window unshippable (`MEASURED.md` section 5). And there is
**no gyroscope anywhere in the Android path**, which is the documented reason the Android reading wobbles
where Google Maps does not.

### So `watchHeadingAsync` is NOT symmetric across platforms

| Platform | What `trueHeading` is |
| --- | --- |
| iOS | `CLHeading.trueHeading`: Apple's own fused value, the one Apple Maps draws |
| Android | Accelerometer plus raw magnetometer, no gyroscope, fused in Kotlin inside `expo-location` |

This inverts the row's founding assumption that one swap could fix both. iOS is already on the best value the
platform offers, so there is nothing to swap it FOR; Android is on a visibly worse one.

## 2. `headingAccuracy` is thrown away before the app can see it

`ios/LocationUtils.swift:9` buckets `CLHeading.headingAccuracy`, which is a value in DEGREES, into 0 to 3:

```swift
internal func normalizeAccuracy(_ accuracy: CLLocationDirection) -> Int {
  if accuracy > 50 || accuracy < 0 { return 0 }
  if accuracy > 35 { return 1 }
  if accuracy > 20 { return 2 }
  return 3
}
```

So a reading iOS reports as plus or minus 4 degrees and one it reports as plus or minus 19 arrive at the app
as the same number, 3. **Session 45 already took the owner's ruling on this**: a cone drawn from a bucket
would be 20, 35 or 50 degrees wide and nothing between, which is a coarse lie about a fine quantity, so the
app draws a needle and goes quiet only when the platform reports no heading at all. That ruling stands and
this row does not reopen it.

What the bucket IS good for is a threshold the app never shows: `accuracy < 3` means iOS itself believes the
reading is worse than plus or minus 20 degrees, which is worth more than any heuristic this app could invent.

## 3. The owner's symptom, divided honestly

🐋  "sometimes it's 20 degrees off, sometimes 30 degrees off. Sometimes 5 degrees, sometimes 10 degrees.
There's a lot of inconsistencies."

| Half | Cause | Evidence | Fixable? |
| --- | --- | --- | --- |
| **Varies per app restart** | The fusion arms cold and walks toward the truth. The app draws the first step | `MEASURED.md` 6: first reading about 30 degrees out, converged 0.71 | **Yes.** 42.1x, measured |
| **A residual present every run** | Hard or soft iron in the room, or an uncalibrated magnetometer | `MEASURED.md` 3: a stable bias passes every stream gate at 1.0x improvement | **No**, not from the stream |

The second half is why iOS's calibration alert matters: it is the only mechanism in reach that attacks a
stable bias at all, and it belongs to the platform rather than to this app's arithmetic.

## 4. What is REJECTED, with the measurement that rejects it

| Option | Verdict |
| --- | --- |
| **The `adhan` package** (the row's option 1) | **Rejected on reading its exports.** It computes a BEARING from a position, which `shared/qiblaGeometry.ts` already does correctly and which session 45 proved agrees to 0.002 degrees. A bearing cannot fix a heading. Confirmed: nothing in `adhan` reads a sensor |
| **The field-magnitude and dip physics check** (session 40's untried lever) | **Rejected, measured.** A 10 uT offset swings the heading 30.8 degrees and passes gates of 10% on magnitude and 5 degrees on dip. A compass uses only the horizontal field, 40% of the total at London, and an offset adds linearly to it and in quadrature to the total. Worst at high latitude: 21% horizontal at Tromso |
| **A spread or smoothness gate** | **Rejected, measured.** A smoothly converging stream passes a 2-degree spread gate at 27.22 degrees of error |
| **A settling window counted in readings** | **Rejected, measured.** 120 seconds to open on a still phone |
| **A gate waiting for platform silence** | **Rejected, measured.** Never opens beyond a 400ms quiet period |
| **A tuned constant, stored offset or per-place calibration** | **Forbidden** by the owner, and session 41 measured the error drifting 20 degrees at a fixed spot across a few hours, so there is nothing stable to store |

## 5. What this row RECOMMENDS

In the order the measurements support, cheapest first:

1. **A settling gate on the heading stream**, as `MEASURED.md` section 6 specifies: drift over a trailing
   3000ms window that must be spanned, with at least 8 readings and 1.5 degrees of half-to-half agreement.
   Pure arithmetic, no new dependency, no new permission, measured 42.1x on the per-restart half of the
   symptom, and it REFUSES to draw rather than drawing badly when the stream never converges.
2. **The diagnostic: `headingAccuracy` in DEGREES, logged across ten restarts.** This is what decides
   whether anything further is worth building, and `expo-location` makes it unmeasurable by bucketing the
   value. See `DECISION.md`.
3. **Honesty about the rest.** The residual cannot be removed by arithmetic. The app's existing behaviour of
   drawing a needle and going quiet when the platform reports nothing is the right shape; what the settling
   gate adds is going quiet while the fusion is still cold, which is a state the app currently draws through.

**CORRECTED after the research reports came in (2026-10-02).** This page originally ranked the iOS
calibration alert second, as "the only lever that attacks the stable-bias half". That ranking is **wrong and
is withdrawn**, on R3's argument against the hypothesis it was sent to confirm: the alert is UI rather than
algorithm, it does not calibrate anything, it only asks the user to supply motion diversity, **and the owner
is already supplying exactly that motion by shaking the phone**. The scatter persists through it, so the
alert adds no information he is not already providing. It is still a real gap worth closing for its
explanation and its OS-level signal, and it is no longer the second recommendation. `DECISION.md` carries the
corrected order.

What this row does NOT recommend: replacing the heading source. iOS is already on `CLHeading.trueHeading`,
the value Apple Maps draws, and session 47 measured the gyro-fused alternative as smooth and wrong by an
amount that varies with orientation.
