# Session 48: the decision, and what the owner is being asked to accept

The research and this session's own measurements agree where it matters; where reports disagreed, the
disagreement was settled against this repository's own source and history. `MEASURED.md` holds what was
computed, `FINDINGS.md` what was read from platform source, `agent-reports/` the three checked reports.

🐋  "we want accuracy, 1000% accuracy, always, always, always accuracy."

🐋  "sometimes it's 20 degrees off, sometimes 30 degrees off. Sometimes 5 degrees, sometimes 10 degrees.
There's a lot of inconsistencies... it's still not consistent enough for me to be confident in releasing
this feature."

**The symptom has two halves and only one is the app's to fix:**

| Half | Cause | Evidence | Fixable |
| --- | --- | --- | --- |
| Different answer on each app restart | The fusion arms cold and walks toward the truth; the app drew the first step | First reading ~30 degrees out, converged 0.71. Apple: the gyro takes "as much as two seconds to spin up"; Core Motion withholds data until sensible while Core Location delivers an immediate first heading | **Yes.** 42.1x, measured |
| Residual error on every run | Iron in the room, or hard-iron offset absorbed into the calibration | A stable bias passes every stream gate at 1.0x. Apple: calibration "is able to filter out only those magnetic fields that move WITH the device" | **No.** Not by any software |

**"1000% accuracy" is not available on a magnetometer compass, from any app, on any phone.** Apple's own docs
say a field fixed in the room cannot be calibrated away; Google's Qibla Finder documents its bearing and then
just says "we recommend calibrating your compass" — no accuracy display, no uncertainty, no settling; Apple
Maps does not draw a confident needle, it draws a CONE whose width is its own heading uncertainty, and is
still wrong sometimes.

## 1. What ships: the settling gate

DRIFT between the two halves of a trailing 3000ms window, at least 8 readings, the window SPANNED not merely
filled, 1.5 degrees of half-to-half agreement. Result: 30.05 degrees becomes 0.71 (42.1x); the indoor jittery
case 29.48 becomes 3.52. A stream that never converges is refused, not drawn badly. Pure arithmetic: no
dependency, no permission, no native code. Proven: 16 tests, 100% on four measures, 10 of 10 breaks caught.

Why drift and not spread: a stream converging from 30 degrees is quiet between consecutive readings, so a
spread gate passes it at **27.22 degrees wrong** — session 47's lesson again, a SMOOTH heading is not a RIGHT
one. Why spanned: without the span check a fast stream fills the count in 400ms and the gate opens at 29.18
rather than 9.70 (indoor case 22.19 rather than 3.52).

## 2. The diagnostic that decides everything after

> Log `trueHeading`, `magneticHeading` and **`headingAccuracy` in DEGREES** at 1 Hz, across ten app restarts
> at one fixed spot, then repeat outdoors.

| If | Then |
| --- | --- |
| The scatter correlates with `headingAccuracy` | The platform already knows it is uncertain, and the app can act on it |
| The error is 30 degrees while `headingAccuracy` reads 5 | A local field has been absorbed into the calibration and **no software fix exists** |
| The scatter collapses outdoors | The answer is physics, and the product answer is honesty plus guidance |

It needs native code: `ios/LocationUtils.swift:9-20` buckets `headingAccuracy` to 0–3 at the 50/35/20
boundaries, and bucket 3 means "anywhere from 0 to 20 degrees" — the entire range the owner complains about,
quantised to uselessness at Expo's JS boundary.

## 3. On Android, the forward answer is the Fused Orientation Provider

Google states **FOP is what draws the Google Maps heading** — the comparison the owner has been making all
along. Its documented jobs are this row's defect list (sync sensors on different clocks, compensate hard-iron,
fuse accelerometer/gyro/magnetometer, compensate gyro drift, produce a realistic heading-accuracy estimate),
and its stated reason is this row's founding contradiction: "an API in Google Play services means that there
is no implementation variance across different manufacturers."

Android 5+ with Play services (3T in scope); **no permissions**; declination applied internally; accuracy via
`getConservativeHeadingErrorDegrees()`. **Blocker:** `expo-location` pins `play-services-location:21.0.1`,
FOP needs 21.2.0+. **No JS wrapper** — needs a native module. It replaces the weakest Android heading source:
accelerometer plus magnetometer, no gyroscope, ~5 Hz, gated so a still phone sees nothing, reporting the wrong
sensor's accuracy band.

## What is REJECTED, each with the measurement or source that rejects it

| Option | Verdict |
| --- | --- |
| `adhan` package | Computes a BEARING (already correct to 0.002 degrees); nothing in it reads a sensor |
| Field-magnitude and dip physics check | **Measured:** a 10 uT offset swings the heading **30.8 degrees** past 10%-magnitude/5-degree-dip gates; horizontal field is 40% of total at London; 20 uT costs 45.7 degrees and 8.0% magnitude. Weakest where the owner lives, worse toward the poles. Cannot catch soft-iron, bad axis or sign errors either |
| Spread/smoothness gate | Passes a converging stream at 27.22 degrees |
| Window counted in readings | 120s to open on a still phone |
| Gate waiting for platform silence | Never opens beyond a 400ms quiet period |
| `CMDeviceMotion` on iOS | Degree-valued accuracy is **iOS 27+**; the XS runs 18.7.10, where CoreMotion offers only a 4-level enum, coarser than `CLHeading` already has. Side-by-side: `CLHeading` "far more stable" |
| Reanimated gyro-fused sensor revisited | Mirrored-yaw cause refuted three ways: `headingFromYaw` negates the yaw back, a test pinned the sign, and a mirror predicts **122 degrees** error at the London qibla, not the 5 and 34 measured |
| `event.values` by-reference defect | **CLOSED, refuted.** AOSP allocates one `SensorEvent` per sensor handle; both registrations share one Looper; arrays can never alias. Verified in the Android 9 tree, so it holds on the 3T |
| Tuned constant / stored offset / per-place calibration | **Forbidden** by the owner; session 41 measured the error drifting 20 degrees at a fixed spot, so there is nothing stable to store |
| Anything magnetometer-free | Nothing available: AR yaw origins are arbitrary or themselves magnetometer-derived, GNSS course needs sustained outdoor walking, UWB unreachable |

## Smaller real defects found, recorded so none is rediscovered

| Finding | Where | Magnitude |
| --- | --- | --- |
| `DeviceHeadingStreamer` never calls `startUpdatingLocation`, which Apple requires for a valid `trueHeading` | `ios/Providers/DeviceHeadingStreamer.swift:28` | **~1.2 degrees in London** (NOAA WMM-2025: declination 1.205 ± 0.380), more at high declination. Real, NOT the owner's bug |
| `onAccuracyChanged` has no sensor-type guard — the accuracy this app receives on Android is usually the ACCELEROMETER's | `android/.../LocationModule.kt:1108-1110` | **Explains session 40's band 3 while 71 degrees wrong** (and band 0 at a fine 47.3 uT field) |
| `calcTrueNorth` does not normalise; Kotlin's `%` keeps the sign, so a negative declination near north returns a NEGATIVE heading | `android/.../LocationModule.kt:691` | Collides with this app's `NO_HEADING = -1`. Narrow but real |
| The app never gates on `headingAccuracy < 0`, which Apple's own sample does unconditionally | `hooks/useQibla.ts:96` | An uncalibrated reading with a plausible heading is drawn at full confidence |
| `device/qibla.ts:65` says the platform gates at 2 degrees — that is ANDROID's gate; iOS's `headingFilter` default is 1 degree | `device/qibla.ts:65` | A wrong comment in shipped code |
| `remapCoordinateSystem` absent — CORRECT for a flat phone, degrades toward vertical | `android/.../LocationModule.kt` | Not the owner's bug; a real usability limit at other angles |

## What the owner is asked to accept

**The feature can be made better and it cannot be made certain.** After the gate, the compass agrees with
itself across restarts far more often and goes quiet rather than lying when the stream has not converged.
The residual from iron indoors remains: Apple says in writing no software can remove it, and every competing
app has the same limit without admitting it. The one thing that would answer his question properly is the
measurement above, which needs a small native module only because `expo-location` throws the number away.
If his bar is a trustworthy absolute bearing indoors on demand, the only path abandons the magnetometer for a
user-confirmed direction tracked by gyroscope — a different feature, his decision.
