# Session 48: the decision, and what the owner is being asked to accept

Three research reports and this session's own measurements agree on more than they disagree, and where they
disagree the disagreement was settled against this repository's own source and history rather than by
preferring a report. This page is the conclusion. `MEASURED.md` holds what was computed, `FINDINGS.md` what
was read from platform source, and `agent-reports/` the three reports with every correction recorded.

---

## The owner's question, answered

🐋  "we want accuracy, 1000% accuracy, always, always, always accuracy."

🐋  "sometimes it's 20 degrees off, sometimes 30 degrees off. Sometimes 5 degrees, sometimes 10 degrees.
There's a lot of inconsistencies... it's still not consistent enough for me to be confident in releasing
this feature."

**The symptom has two halves and only one of them is the app's to fix.**

| Half | Cause | Evidence | Fixable |
| --- | --- | --- | --- |
| **A different answer on each app restart** | The sensor fusion arms cold and walks toward the truth. The app draws the first step of that walk | Measured: the first reading is about 30 degrees out where the converged one is 0.71. Apple states the gyro takes "as much as two seconds to spin up" and that CoreMotion withholds data until sensible while Core Location delivers an immediate first heading | **Yes.** 42.1x, measured |
| **A residual error present on every run** | Iron in the room, or a hard-iron offset absorbed into the calibration | Measured: a stable bias passes every stream gate at 1.0x. Apple: calibration "is able to filter out only those magnetic fields that move WITH the device" | **No.** Not by any software |

**So the honest answer to "1000% accuracy" is that it is not available on a magnetometer compass, from any
app, on any phone.** Three independent findings say so:

1. Apple states in its own documentation that a field fixed in the room cannot be calibrated away.
2. Every competitor has the same problem. **Google's own Qibla Finder** documents its bearing arithmetic in
   detail and then disposes of the hard half in two sentences: "Qibla Finder works with your device's
   compass. To make sure that the direction is as accurate as possible, we recommend calibrating your compass
   before using." No accuracy display, no uncertainty, no settling logic.
3. **Apple Maps does not draw a confident needle.** It draws a CONE whose width is its own heading
   uncertainty, and it is still wrong sometimes.

What IS available is a compass that is right more often, and honest when it is not.

---

## What ships, in order

### 1. A settling gate: refuse to draw a heading that has not converged

The one change measured to attack the fixable half, specified in full in `MEASURED.md` section 6 and already
built and proven in a scratch worktree.

| Property | Value |
| --- | --- |
| Test | DRIFT between the two halves of the window, never spread |
| Window | 3000ms, which must be SPANNED, not merely filled |
| Minimum | 8 readings |
| Threshold | 1.5 degrees of half-to-half agreement |
| Result | 30.05 degrees of error becomes 0.71. The indoor jittery case 29.48 becomes 3.52 |
| Refuses | A stream that never converges is never drawn, rather than drawn badly |
| Cost | Pure arithmetic. No dependency, no permission, no native code |
| Proven | 16 tests, 100% on all four measures, tsc 0, Biome 0, 10 of 10 breaks caught |

**Why drift and not spread**, which is the finding that makes this work: a stream smoothly converging from 30
degrees of error is quiet between consecutive readings, so a spread gate passes it at **27.22 degrees wrong**.
This is session 47's lesson in a new place: a heading that is SMOOTH is not a heading that is RIGHT.

**Why the window must be spanned**, found by a defect in this session's own first gate: without the span
check a fast stream fills the count in 400ms, and the 8-second convergence opens at **29.18** degrees rather
than 9.70 while the indoor case reads **22.19** rather than 3.52.

### 2. The diagnostic that decides everything after this

The three reports converge on one measurement, and it cannot be taken through `expo-location`:

> Log `trueHeading`, `magneticHeading` and **`headingAccuracy` in DEGREES** at 1 Hz, across ten app restarts
> at one fixed spot, then repeat outdoors.

**It discriminates between the three candidates that matter**, and its outcomes are decisive rather than
suggestive:

| If | Then |
| --- | --- |
| The scatter correlates with `headingAccuracy` | The platform already knows it is uncertain, and the app can act on it |
| The error is 30 degrees while `headingAccuracy` reads 5 | A local field has been absorbed into the calibration and **no software fix exists** |
| The scatter collapses outdoors | The answer is physics, and the product answer is honesty plus guidance |

**Why it needs native code at all:** `ios/LocationUtils.swift:9-20` buckets `headingAccuracy` to 0 to 3 at
the 50/35/20 boundaries, and **bucket 3 means "anywhere from 0 to 20 degrees", which spans the entire range
the owner is complaining about.** The number that would answer his question is quantised to uselessness at
Expo's JS boundary. So the module is a diagnostic instrument first and a product change second.

### 3. On Android, the forward answer is the Fused Orientation Provider

Google states outright that **FOP is what draws the Google Maps heading, which is the comparison the owner
has been making all along.** Its documented job list is this row's defect list: synchronise sensors on
different clocks, compensate the hard-iron offset, fuse accelerometer with gyroscope and magnetometer,
compensate gyro drift, and "produce a realistic estimate of the compass heading accuracy." Its stated reason
for existing is the S23-versus-Find-X8 contradiction that created this row: "an API in Google Play services
means that there is no implementation variance across different manufacturers."

| Property | Value |
| --- | --- |
| Availability | Android 5+ with Play services, so the OnePlus 3T on API 28 is in scope |
| Permissions | **None** |
| Declination | Applied internally |
| Accuracy | `getConservativeHeadingErrorDegrees()`, a per-sample half-angle cone |
| **Blocker** | `expo-location` pins `play-services-location:21.0.1`; FOP needs 21.2.0+ |
| Reachable from JS | **No.** No wrapper exists. Needs a native module |

What this replaces is the weakest heading source Android offers: accelerometer plus magnetometer, **no
gyroscope**, no filtering, sampled at about 5 Hz, gated so a still phone sees no updates at all, with an
accuracy field that reports the **wrong sensor's** band.

---

## What is REJECTED, each with the measurement or source that rejects it

| Option | Verdict |
| --- | --- |
| **The `adhan` package** (the row's option 1) | **Rejected.** It computes a BEARING, which this app already does correctly to 0.002 degrees. A bearing cannot fix a heading. Nothing in it reads a sensor |
| **The field-magnitude and dip physics check** (session 40's untried lever) | **Rejected, measured.** A 10 uT offset swings the heading **30.8 degrees** and passes gates of 10% on magnitude and 5 degrees on dip. A compass uses only the HORIZONTAL field, 40% of the total at London, and an offset adds linearly to it and in quadrature to the total: 20 uT costs 45.7 degrees of heading and 8.0% of magnitude. **Weakest exactly where the owner lives**, and worse toward the poles. Independently, R2 found it cannot catch a soft-iron error, a bad axis convention or a sign error either |
| **A spread or smoothness gate** | **Rejected, measured.** Passes a converging stream at 27.22 degrees of error |
| **A settling window counted in readings** | **Rejected, measured.** 120 seconds to open on a still phone, because the platform suppresses anything within 2 degrees |
| **A gate waiting for platform silence** | **Rejected, measured.** Never opens beyond a 400ms quiet period: jitter re-triggers the gate forever |
| **`CMDeviceMotion` on iOS** | **Rejected for this handset.** Its degree-valued `headingAccuracy` is **iOS 27+** and the owner's XS runs 18.7.10, so CoreMotion would offer only a 4-level enum, COARSER than the `headingAccuracy` degrees `CLHeading` already has. Independent side-by-side measurement also found `CLHeading` "far more stable than any of these" |
| **Reanimated's gyro-fused sensor, revisited** | **Stays rejected.** R2 proposed a mirrored-sign cause and it is refuted three ways: session 47's own `headingFromYaw` negates the yaw back, a test pinned it, and a mirror predicts a **122 degree** error at the London qibla rather than the 5 and 34 measured |
| **The `event.values` by-reference defect** (session 40's open item) | **Refuted and CLOSED.** AOSP allocates one `SensorEvent` per sensor handle and both registrations share one Looper, so the two arrays can never alias and delivery is serialized. Correctness debt, not a bug. Verified in the Android 9 tree, so it holds on the 3T |
| **A tuned constant, stored offset or per-place calibration** | **Forbidden** by the owner, and session 41 measured the error drifting 20 degrees at a fixed spot across hours, so there is nothing stable to store |
| **Anything magnetometer-free** | **Nothing available.** AR does not escape it (ARKit and ARCore yaw origins are arbitrary unless geographic alignment is on, which is itself magnetometer-derived), GNSS course needs sustained outdoor walking, and UWB is unreachable |

---

## Smaller real defects found, all recorded so none is rediscovered

| Finding | Where | Magnitude |
| --- | --- | --- |
| `DeviceHeadingStreamer` never calls `startUpdatingLocation` on its own manager, which Apple requires for a valid `trueHeading` | `ios/Providers/DeviceHeadingStreamer.swift:28` | **About 1.2 degrees in London** (NOAA WMM-2025: declination 1.205, uncertainty 0.380). Much more at high declination. Real, and NOT the owner's bug |
| `onAccuracyChanged` has no sensor-type guard, so the accuracy this app receives on Android is usually the ACCELEROMETER's | `android/.../LocationModule.kt:1108-1110` | **Explains session 40's band 3 while 71 degrees wrong**, and band 0 while the field was fine at 47.3 uT |
| `calcTrueNorth` does not normalise, and Kotlin's `%` keeps the sign, so a negative declination near north returns a NEGATIVE heading | `android/.../LocationModule.kt:691` | Collides with this app's own `NO_HEADING = -1` sentinel. Narrow but real |
| The app never gates on `headingAccuracy < 0`, which Apple's own sample does unconditionally | `hooks/useQibla.ts:96` checks only `trueHeading === NO_HEADING` | An uncalibrated reading with a plausible-looking heading is drawn at full confidence |
| `device/qibla.ts:65` says the platform gates at 2 degrees, which is ANDROID's gate. iOS's `headingFilter` default is 1 degree | `device/qibla.ts:65` | A wrong comment in shipped code |
| `remapCoordinateSystem` is absent, which is CORRECT for a flat phone and degrades toward vertical | `android/.../LocationModule.kt` | Not the owner's bug, since he tests flat. A real usability limit at other angles |

---

## What the owner is being asked to accept

**The feature can be made better and it cannot be made certain.** After the settling gate, the compass will
agree with itself across restarts far more often, and will go quiet rather than lie when the stream has not
converged. The residual error from iron in his house will remain, because Apple says in writing that no
software can remove it, and because every competing app including Google's has the same limit and does not
admit it.

**The one thing that would answer his question properly is a measurement, not a change:** ten restarts at one
spot logging `headingAccuracy` in degrees, then the same outdoors. That tells him whether the phone already
knows it is uncertain, and therefore whether anything further is worth building. It needs a small native
module purely because `expo-location` throws the number away.

**If his bar is a trustworthy absolute bearing indoors on demand, the only path there abandons the
magnetometer** for a direction the user confirms once against something whose bearing is independently known,
tracked afterwards by the gyroscope. That is a different feature, and it is his decision rather than this
session's.
