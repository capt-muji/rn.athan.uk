# Session 48 findings: where the heading comes from

The answer to the row's question. `MEASURED.md` holds the numbers computed here; the platform reading below is
from installed source and primary documentation, cited line by line.

1. **`expo-location`'s iOS path is faithful to `CLHeading`, so the XS was already on the value Apple Maps
   draws.** No bug to fix there. It kills the row's fourth possibility ("the fault may be in
   `expo-location` itself rather than in the sensor", one of four the owner named for research; the
   enumeration lives in git history, `git show HEAD:ai/plans/48-qibla-heading-accuracy/BRIEF.md`, the
   "options the owner named" section) as stated.
2. **But the module never configures Core Location, and one omission is a real defect:** it never implements
   `locationManagerShouldDisplayHeadingCalibration`, and Apple documents that without it **the calibration
   alert is never shown**: in four sessions the owner's iPhone was never offered the figure-of-eight prompt.
3. **The "inconsistent run to run" symptom has two halves, only one fixable.** Cold sensor fusion: 42.1x.
   A biased field in the room: the physics check session 40 specified cannot bound it (30.8 degrees passes at
   a 10 uT offset).

## 1. What `expo-location` 58.0.9 actually does, from its own source

**iOS, faithful and unconfigured.** `LocationModule.swift:99` builds a `DeviceHeadingStreamer` with
`.bestForNavigation`, `distanceInterval: 0`; `:113-117` forwards `trueHeading`, `magneticHeading` and
`normalizeAccuracy(heading.headingAccuracy)`; `DeviceHeadingStreamer.swift:28` calls `startUpdatingHeading()`;
`:43-45` yields the raw `CLHeading` unmodified; `BaseLocationProvider.swift:11-16` sets only
`allowsBackgroundLocationUpdates`, `distanceFilter`, `desiredAccuracy`, `delegate`. So `trueHeading` reaches
the app exactly as Core Location produced it.

Three things the module never sets: `headingOrientation` (default portrait-top, correct here by luck),
`headingFilter` (default 1 degree; the 2-degree gate is Android's), and
`locationManagerShouldDisplayHeadingCalibration` (**the finding**).

**The calibration alert.** Apple: return `false` "or do not provide an implementation for it in your delegate"
and "Core Location does not display the heading calibration alert." It would otherwise fire on first heading
request and on significant field changes, exactly the owner's situation. Its limit, which bounds what it
buys: "The calibration process is able to filter out only those magnetic fields that move WITH the device."
Calibration fixes a magnet in the phone case, not a steel joist in the wall; consistent with the residual
error no amount of shaking removes.

**Android: accelerometer plus CALIBRATED magnetometer, no gyroscope.** `LocationModule.kt:~648` runs
`getRotationMatrix`/`getOrientation` from gravity + geomagnetic; `:~656` gates on >2 degrees AND >50ms;
`:~660-661` applies `calcMagNorth` then `calcTrueNorth`. The 2-degree gate is why a still phone emits almost
nothing, which makes any reading-counted settling window unshippable (`MEASURED.md` 5). (R2 corrected this
repo's own wording: `TYPE_MAGNETIC_FIELD` is already calibrated. The weakness is no gyro and no filtering,
not raw input.)

**So `watchHeadingAsync` is NOT symmetric across platforms:** iOS = `CLHeading.trueHeading`, Apple's own
fused value; Android = accelerometer + magnetometer fused in Kotlin inside the module. This inverts the
founding assumption that one swap could fix both.

## 2. `headingAccuracy` is thrown away before the app can see it

`ios/LocationUtils.swift:9`:

```swift
internal func normalizeAccuracy(_ accuracy: CLLocationDirection) -> Int {
  if accuracy > 50 || accuracy < 0 { return 0 }
  if accuracy > 35 { return 1 }
  if accuracy > 20 { return 2 }
  return 3
}
```

A reading iOS reports as plus or minus 4 and one it reports as plus or minus 19 arrive as the same number, 3.
**Session 45's ruling stands, not reopened:** a cone drawn from a bucket would be 20, 35 or 50 degrees wide
and nothing between, so the app draws a needle and goes quiet only when the platform reports no heading at
all. The bucket IS good for a threshold the app never shows: `accuracy < 3` means iOS itself believes the
reading is worse than plus or minus 20 degrees.

## 3. The symptom, divided honestly

| Half | Cause | Evidence | Fixable? |
| --- | --- | --- | --- |
| Varies per app restart | The fusion arms cold and walks toward the truth | First reading ~30 degrees out, converged 0.71 (`MEASURED.md` 6) | **Yes.** 42.1x |
| Residual present every run | Hard or soft iron in the room, or uncalibrated magnetometer | A stable bias passes every stream gate at 1.0x (`MEASURED.md` 3) | **No**, not from the stream |

## 4. Rejected, with the measurement that rejects each

`adhan` (a bearing only, nothing reads a sensor); the field-magnitude/dip physics check (30.8 degrees passes
at 10 uT; horizontal field only 40% of total at London, 21% at Tromso); spread gates (27.22); readings-counted
windows (120s); platform-silence gates (never opens past 400ms); tuned constants (forbidden, and session 41
measured the error drifting 20 degrees at a fixed spot). Detail in `MEASURED.md` and `DECISION.md`.

## 5. Recommendation, in the order the measurements support

1. **The settling gate** as `MEASURED.md` 6 specifies: drift over a trailing 3000ms spanned window, 8
   readings, 1.5 degrees. Pure arithmetic, 42.1x, refuses rather than draws badly.
2. **The diagnostic:** `headingAccuracy` in DEGREES across ten restarts, to decide whether anything further is
   worth building; `expo-location` makes it unmeasurable. See `DECISION.md`.
3. **Honesty about the rest.** The residual cannot be removed by arithmetic; going quiet while the fusion is
   cold is a state the app previously drew through.

**CORRECTED after the reports came in (2026-10-02):** this page originally ranked the iOS calibration alert
second. **Withdrawn** on R3's argument: the alert is UI rather than algorithm, it only asks the user to supply
motion diversity, and the owner already supplies exactly that motion by shaking the phone; the scatter
persists through it. Still a real gap worth closing for its explanation and OS-level signal, no longer the
second recommendation. Not recommended: replacing the heading source (iOS is already on the value Apple Maps
draws; the gyro-fused alternative is smooth and wrong by an amount that varies with orientation).
