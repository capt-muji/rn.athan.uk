# R5: prior attempts, settled findings, and the adversarial review of the map

Research agent R5, session 41, 2026-09-29. Mandate: brief question 7, the repeat-history question, plus the adversarial review of the whole row.

🐋  "compare it with what we have already tried so many, many, many times already. We actually tried to do this,
but we had so many trials and errors."

Every claim below carries a file path, a commit sha, or a report name in this folder tree. Where a number is an
estimate rather than a measurement it says so.

---

## 1. The verdict, first

**Build the row differently. Do not build the map as specified.**

Two sessions shipped correct, audited, 100%-covered code and the feature still failed, because the failure was
never in the code. Session 37 fixed the maths, which was never broken. Session 40 fixed the sensor, which was
real but not decisive. The map as specified is the third attempt at the same shape: build a presentation, ship
it correct, and discover afterwards that the user still cannot trust it indoors.

The map is not worthless. It is the market's converged fallback (E4, session 40: Al-Azan pairs it with the
compass and ranks the compass below it in its own disclaimer; SimplyQibla is map-only by design). But the
specific map this row proposes, a planet-scale offline basemap with no key and no network inside a 67 MB APK,
is a thing **no shipped app has achieved**. E4 section 3: "no keyless, offline map exists, so our map-shaped
fallback must be the bearing-plus-cardinal-ring variant". Al-Azan, a privacy-first prayer app that wanted
exactly this, ships its map network-bound and strips MapLibre entirely from its F-Droid build for size
(`agent-reports/E4-competitor-teardown.md` sections 1.5 and 3).

The row should be re-sequenced around what its own error budget says (`P0-error-budget.md`): the map's value is
not precision, it is that "its error does not grow when the user steps near a wall". Two cheaper things share
that property and ship today in other apps: the bearing number plus a cardinal ring (nearly free, E4 section 3),
and the sun line, computable offline to arcseconds, endorsed by IslamQA, carried in machinery `adhan@4.4.6`
already has (session 37 `RESEARCH.md` section 19.3). E4's own closing line on the sun method: "of everything in
this report, it is the highest-certainty feature per line of code."

Concretely:

| Priority | Deliverable | Cost | Why first |
| --- | --- | --- | --- |
| 1 | The sun line and the bearing-plus-ring presentation | Near zero: no sensor, no network, no native code, `adhan` already in the tree | Works on every phone including the no-compass ones, cannot be bent by a room, is the method users already trust (session 40 `R6` summary point 5 and section 6.2) |
| 2 | A map, scoped to a region pack the user's position covers, north-up, geodesic drawn by the app | Measured by this session's basemap and renderer reports, not guessed here | Real value for the one-time "which way does my living room face" calibration at home |
| 3 | A planet-scale offline basemap as the primary qibla surface | Unknown, no shipped precedent | Not buildable under the constraints as they stand, and its coverage hole contradicts the owner's own traveller ruling |

`ASSUMPTIONS.md` A4 already narrows the row to "how does the user verify the direction". This report endorses
that narrowing and pushes it harder: the verification method should be decided on measured human error, not on
which library installs.

---

## 2. The complete timeline of attempts

### 2.1 Before any code: the planning wave of session 37, 2026-09-28

| Attempt | Verdict | Evidence |
| --- | --- | --- |
| Owner's premise: no GPS needed, Makkah is fixed | Corrected before the row was queued. The bearing is a function of position: London 119.0, Cairo 136.1, New York 58.5, Jakarta 295.2 | `ai/plans/README.md` row 37 |
| Infer position from the device timezone | Rejected. 0.5 degrees wrong for Manchester, 6.5 Detroit, 13.7 Peshawar, 29.7 Diyarbakir, **147.5 for Jeddah**, which points a user in Saudi Arabia almost exactly backwards | Row 37, `ai/plans/README.md` |
| A permission-free gradient: render the compass without permission, ask only for the arrow | The owner rejected it mid-sentence: 🐋  "we can literally just put a tabla icon, literally a caba icon on where? Oh, no, we can't. Can we?" Half a qibla compass is a broken one | Row 37, `ai/plans/README.md` |
| Cached-forever position | Rejected by the owner the same day: 🐋  "some people are travellers... we still need a compass even when in a different country." Now refreshed on every sheet open, cache paints over and never answers | Row 37, `ai/plans/README.md`; session 37 `RESEARCH.md` section 17.3 |
| City-picker fallback with a bundled GeoNames `cities15000` dataset, about 1 MB | Cancelled by owner ruling: 🐋  "If the user says no... we'll just deny them." No permission, no compass. The largest single bundle addition the feature considered was deleted | Session 37 `RESEARCH.md` section 18 |
| Coarse-only Android posture via a config plugin | Researched in full, then cancelled: 🐋  "I want to keep my config very simple... yes, please go ahead with the default." Fine costs the user no extra dialog on any Android version | `ANDROID-PERMISSIONS.md` sections 1 to 4a |
| Hand-written bearing maths | Rejected. `adhan@4.4.6` adopted: the two agree to 0.002 degrees, and adhan cites the 19th-century theorem it derives from | Session 37 `RESEARCH.md` sections 19 and 21 |
| Vincenty ellipsoidal solver | Rejected. Measured gain over great circle is 0.387 degrees across a 16,200-point grid, an order below the sensor floor, and it can fail to converge near antipodes | Session 37 `RESEARCH.md` sections 1.4 and 23.2 |
| Rhumb line | Rejected. Disagrees with the great circle by 71.3 degrees in Los Angeles, 42.8 in New York, 14.84 in London. The documented reason some North American mosques face the wrong way | Session 37 `RESEARCH.md` section 1.5; `AUDIT.md` section 3 |

### 2.2 Session 37 executed, 1.29.96 to 1.29.111

Shipped: `expo-location`'s `watchHeadingAsync` feeding a 72-tick dial, recorded once and rotated as one layer.
Audited PASS, 28 of 28 breaks caught, 100% coverage on all four measures, 60fps measured on the 3T at a median
frame gap of 16.7 ms (`LOG.md` section 6.4). The owner then reported the compass "is not very accurate right
now". The audit's answer was finding 2: `watchHeading` discarded the phone's own calibration level, so the dial
drew a confident needle while the phone said the heading might be 50 degrees out (`AUDIT-EXECUTION.md` section
2.2, fixed in 1.29.111). Defects found and fixed along the way: the sensor armed once and never again (1.29.98),
a live position read could hang the sheet on "Finding your position" forever (1.29.100), a re-present stranded
the previous stream (1.29.101), every label counter-rotated by its own bearing so E and W lay on their sides
(1.29.108), and the fixed mark covered the N it points at (1.29.108).

### 2.3 Session 40 planned, 2026-09-29: the four wrong diagnoses

The owner aimed three phones so the top edge pointed at the qibla and the marker sat near 10 o'clock on all
three. **Four diagnoses were proposed and all four were wrong before anything was measured**: a stale cached GPS
position, per-device magnetometer ageing, old-phone hardware, and a missing `remapCoordinateSystem`. The last
was disproved by simulating a physically consistent accelerometer and magnetometer pair at every pitch and roll,
where `getRotationMatrix` plus `getOrientation` returns the correct azimuth to six decimal places
(`ai/AGENTS.md` entry of 2026-09-29). An earlier "180 degrees of error from tilt" result came from pairing a
real magnetometer sample with a synthetic accelerometer, which describes no physical situation. The answer came
from instrumenting `watchHeading` on a Find X8: `expo-location` reported 190.0 where the truth was 118.9, an
error of +71.1, while claiming accuracy band 3, the highest. The fused rotation vector read 109.2, an error of
-9.7, at 148 samples against 2 (`PLAN.md` sections 1 and 2).

### 2.4 Session 40 executed, 1.29.115 to 1.29.121: the axis-correction constants that could not converge

The needle moved to Reanimated's `useAnimatedSensor(SensorType.ROTATION)`. Then the iOS axis correction was
tuned against the owner's dial, and this is the sequence, read from the commits:

| Version | Commit | Correction | What the commit message says |
| --- | --- | --- | --- |
| 1.29.115 | `665019d0` | 270 (derived) | Derived from a hand-built rotation matrix. Measured on device, the derivation was wrong |
| 1.29.116 | `a4334fa7` | 180 | "iOS yaw needs a half turn, not a quarter." The needle had pointed at 7 o'clock |
| 1.29.117 | `049a955a` | 190 | "The marker sat two ticks clockwise of the mark at 180", a tick being 5 degrees |
| 1.29.118 | `853d187c` | 180 | "The axis relationship can only be a multiple of 90." Aimed at one corner, yaw read 64.6, 72.1, 72.2 and 65.9 degrees over twelve minutes, putting the implied constant anywhere between 183.5 and 191.1 |
| 1.29.119 | `94c3b3ae` | 170 | Read off the dial |
| 1.29.120 | `0ee13ef8` | 190 | "Confirmed by moving it the wrong way": at 180 the marker sat two ticks clockwise, at 170 four, so lowering the correction pushes the marker further the way it was already wrong |
| not shipped | measured only | 220 | Read perfectly on open floor. Rejected before commit: 220 is not a multiple of 90, so it is not geometry |
| 1.29.121 | `893f2fd0` | **180, final** | The tuning ends. The walk test had settled why |

**Why tuning could never converge:** the owner walked the phone from the middle of his room toward a corner
without turning it. The needle swung **30 degrees** while the qibla bearing over that distance moved **0.09
arcseconds**. Beside a laptop the constant that read perfectly was 190; on open floor, 220. Same phone, same
orientation, two metres apart. The room's field changes with position: drywall corners carry a continuous steel
corner bead, two stud lines and the screws of both sheets, and London's horizontal field is 19.5 uT, so ten
microtesla of steel is `atan(10/19.5)`, or 27 degrees (`LOG.md`, "The finding that ends the tuning"). The owner
caught the consequence himself: shipping 220 would export one bedroom's steel to every user on Earth. The
shipped comment in `components/sheets/screens/Qibla.tsx` records the reversion.

What shipped with it: `isFieldTrustworthy`, the 25 to 65 uT field-strength check, measured against this
project's own desk reading 104.5 uT where London's truth is 49 (`shared/qibla.ts`; `LOG.md`). Two self-review
catches prevented shipping defects: the sensor would have run forever because `useAnimatedSensor` subscribes for
its component's life and every sheet is mounted from launch, and `rotation.register()` does not exist
(`LOG.md`, review findings).

**What is not proven:** the Android correction path has never been checked on hardware, both Android phones
having been disconnected before the 1.29.121 build; and the owner's last iOS reading was at 220 on open floor,
so 180 awaits one clean reading away from metal (`LOG.md`, "Not proven on device").

### 2.5 The attempts elsewhere, from the session 40 teardowns

| Who | What they tried | How it failed or succeeded |
| --- | --- | --- |
| 5 of the 20 most-downloaded qibla apps | The bearing formula | Wrong by a consistent 3 degrees on both platforms, an algorithmic failure, against a theodolite survey of 292.9622 degrees (IJARPED 13(4), via session 37 `RESEARCH.md` section 22.2) |
| `qibla@1.1.0` on npm | The bearing formula | Sign flipped in `deltaL`, mirroring every bearing about north-south: London 241.01 against the correct 118.99, an error of 122 degrees (`RESEARCH.md` section 23.1) |
| `qibla-direction@1.0.0` | Normalisation | `if (C < 0) C *= 360` instead of `C += 360`: Jakarta returns -23,345 degrees (`RESEARCH.md` section 23.1) |
| `react-native-qibla-compass`, `react-native-qibla-finder` | The whole screen | Correct maths, broken physics: raw `atan2`, no tilt compensation, no declination, a `+271` fudge where `+270` was meant, no shortest-path interpolation, alignment broken across the 0/360 boundary so the vibration never fires for users whose qibla is near north (`RESEARCH.md` section 23.4) |
| Samsung S21 Ultra, Xperia 5 IV, Nexus 6P owners | Nothing they could do | The fixed-offset family: exactly 90 degrees clockwise in every app, calibration-immune, OS-level (`R6-field-evidence-and-ux.md` section 1.2) |
| Nothing CMF Phone 2 Pro, 2025 | Switching to the fused sensor | The fused path was the defect: 150 to 180 degrees off in Maps, fixed by a raw-sensor compass app and a figure of eight (`R6` section 1.3) |
| Muslim Pro | Calibration coaching | Documents its own inescapable calibration loop and ships a manual sun-alignment affordance as the way out (`E4` section 2) |
| Al-Azan | The offline map this row wants | Needs the network ("Internet connection is necessary for qibla map to work"), and the F-Droid build strips MapLibre entirely rather than ship its size (`E4` section 1.5) |
| SimplyQibla | Deleting the compass | Map-only, and users prefer it. But it sits on `google_maps_flutter`: an API key at build time and network at run time (`E4` section 1.6) |
| Google | Qibla Finder | A camera AR line, not a map and not a compass (`E4` section 2) |

The pattern across all of it, in E4's words: "the entire sophisticated end of the market is doing what D4 and R6
already proposed for this app: honest degradation plus a sensor-free path."

---

## 3. The settled-findings register

Nothing in this table is to be re-derived by any session 41 report. Each row names its source.

### 3.1 The bearing and the position

| Finding | The number | Source |
| --- | --- | --- |
| The formula | Initial great-circle bearing, `adhan@4.4.6`, validated to 0.05 degrees against published values for 8 cities | Session 37 `RESEARCH.md` section 1.3 |
| The Kaaba's coordinates | 21.4225241 N, 39.8261818 E; all four circulating candidates agree within 0.0037 degrees | `RESEARCH.md` sections 1.2 and 22.4; `shared/qibla.ts` line 12 |
| Great circle, not rhumb | 71.3 degrees apart in Los Angeles, 42.8 in New York, 14.84 in London; the rhumb line is not even well-defined (rhumb lines between two points are not unique) | `RESEARCH.md` sections 1.5 and 12.1 |
| Sphere versus ellipsoid | 0.387 degrees maximum over a 16,200-point grid for populated latitudes; the oracle bound is 0.5 degrees, never 0.25 | `RESEARCH.md` section 23.2 |
| Position tolerance | 0.5 degrees of bearing error per 10 km of position error, 2.4 at 50 km, 9.7 at 200 km; recomputed independently in audit and reproduced | `RESEARCH.md` section 1.7; `AUDIT.md` section 3 |
| The near-Makkah inversion | From Jeddah, 66 km out, a 50 km position error moves the bearing 49.4 degrees | `RESEARCH.md` section 1.7; `AUDIT.md` section 3 |
| The antipode | Every direction is equally toward the Kaaba; the code produces a stable finite value, never NaN | `RESEARCH.md` sections 1.7a and 12.4 |
| Greater London is a single bearing | 118.60 to 119.31 across the whole capital, a spread of 0.71 degrees | Session 40 `D4-detection-and-honesty.md` section 7 |
| Timezone inference of position | 147.5 degrees wrong in Jeddah. Dead | Row 37, `ai/plans/README.md` |
| "Just face Saudi Arabia" | 23.1 degrees wrong from Cairo, 14.7 from Istanbul, 7.8 from London | Session 40 `BRIEF.md` section 3.2 |
| The flat-map eyeball | From New York the true qibla is north-east where a flat map suggests south-east, 43 degrees apart; from the owner's own room the rhumb line is 133.75 against the true 118.89, a gap of 14.86 degrees | `BRIEF.md` section 3.2; `D5-adversarial-review.md` section 2 |
| The permission | Stays. A sensor says which way the phone points; only a position says which way Makkah lies | `BRIEF.md` section 3.1; `ai/AGENTS.md` 2026-09-29 |
| Position refresh | Never cached authoritatively: every sheet open re-fixes at Balanced, the cache paints over and serves as refusal fallback only | Session 37 `RESEARCH.md` section 17.3 |
| Declination, London, today | +1.18 to +1.2 degrees east; the agonic line crossed Greenwich in September 2019, so magnetic and true north nearly coincide here, which hides declination bugs from London testing | `RESEARCH.md` section 1.7d; `D2` section 1 |

### 3.2 The sensor

| Finding | The number | Source |
| --- | --- | --- |
| `expo-location` Android heading has no gyroscope | `LocationModule.kt:649`, raw accelerometer plus raw magnetometer through `getRotationMatrix` | Session 40 `PLAN.md` section 3 |
| Its other defects | `event.values` stored by reference into `FloatArray(9)` fields (lines 1101, 1103); a 2-degree 50 ms gate (line 656) that explains 2 samples against 148 | `PLAN.md` section 3; `LOG.md` |
| The measured failure | 190.0 reported where truth was 118.9, +71.1, while claiming band 3 | `PLAN.md` section 1 |
| The fused sensor on the same phone | 109.2, an error of -9.7, at 148 samples in 40 seconds | `PLAN.md` section 2 |
| The Reanimated iOS frame trap | Default `iosReferenceFrame` is `Auto`, resolved to `XArbitraryCorrectedZVertical`, whose yaw zero is wherever the phone woke up. `XTrueNorthZVertical` must be passed explicitly, and it is already true-north, so declination is Android-only | `PLAN.md` section 4; `R1-api-arbitration.md` section 1.2 |
| The vendor accuracy band is worthless as a gate | The X8 reported band 3 while 71 degrees wrong, then band 0 while its field was correct at 47.3 uT. `values[4]` reads 0.00 on every 3T sample | `ai/AGENTS.md` 2026-09-29; `E6-x8-vs-3t-comparison.md` section 4 |
| The room is the residual enemy | Two metres of walking swings the needle 30 degrees while the qibla moves 0.09 arcseconds; 190 beside a laptop, 220 on open floor, same phone, same orientation | `LOG.md`; commit `893f2fd0` |
| London's field | F 49.0 to 49.13 uT, horizontal 19.4 to 19.56, dip 66.5 to 66.9, from WMM2025, cross-checked against NOAA to 0.001 degrees | `D1` section H1; `D2` section 1; `D4` section 1.2 |
| The project desk's field | 104.5 uT measured, 2.13 times Earth, stable across 30 minutes, with a 9.4-degree dip error | `E5-device-measurements.md` section 1; `E6` section 1 |
| AOSP fusion gates magnitude, not direction | 10 to 100 uT rejection band in `Fusion.cpp`, Android 9 and 13 identical; a field rotation inside the gate passes straight through, so a fused phone in a uniformly distorted room converges to the same wrong north | `D2` sections 3 and 4 |
| Calibration is not the old-versus-new difference | The X8 carries a larger hard-iron bias, 114.8 uT against the 3T's 84.5, and reads correctly anyway | `E6` section 1 |
| Indoor heading error is the norm | RMSE about 17.4 degrees even with a purpose-built EKF (Ettlinger and Weiss, NAVIGATION 2024); JAKIM measured 3 to 45 degrees across phone qibla apps; most prayer happens indoors | Session 37 `PLAN.md` section 1.1; `RESEARCH.md` section 10.1 |
| The tuned-disturbance blind spot | A disturbance that rotates the field without changing its length or dip is undetectable from inside the phone; the last honest line is the sun | `D4` section 1.2 |
| Two phones held together | 5 to 10 cm apart they deflect each other by 30 to 77 degrees; beyond 30 cm the effect is dead. Keep compared phones a metre apart | `D5` section 5 |

### 3.3 The presentation

| Finding | The number | Source |
| --- | --- | --- |
| The 60fps dial architecture | 84 SVG elements recorded once, rotated as one Reanimated transform; measured median frame gap 16.7 ms on the 3T, 89% of gaps at 60fps, zero between 30 and 34 ms. Re-recording the same tree would cost 117 to 165 ms per frame | `LOG.md` section 6.4; `ai/AGENTS.md` 2026-09-29 |
| A long gap is not a dropped frame | The 11 gaps over 34 ms were each a whole multiple of the 16.67 ms vsync within 0.4 ms: a vsync with nothing submitted, not a missed frame | `LOG.md` section 6.4 |
| The angle machinery | Shortest-arc delta, unwrapped accumulation, first-evaluation snap; the animated value must never wrap | `shared/qibla.ts`; session 37 `RESEARCH.md` section 9.1 |
| Known cosmetic defect, unfixed | The Kaaba glyph carries `rotate(${-bearing})` at `Dial.tsx` line 95, the same counter-rotation class removed from the labels in 1.29.108. It cannot affect direction; the marker is placed by translate | `D5-adversarial-review.md` section 6 |
| What the honest screen states should be | D4's degradation ladder: the bearing number survives every rung, the needle hides only when physics convicts it, the severe line speaks the number aloud | `D4` section 7 and the state machine |
| The fiqh frame | Diligence, not outcome, decides validity (Ibn al-'Uthaymeen); the app must never imply a prayer was invalid. Tolerances in the wild: Malaysia 3 degrees, Egypt Dar al-Ifta 45, the product alignment window 5; never surface a tolerance in UI, quoting one is a de facto ruling | Session 37 `RESEARCH.md` sections 12.2, 12.3 and 15.3; `E4` section 6 |
| The sun method | The sun crosses the Kaaba twice a year, 27/28 May at 09:18 UTC and 15/16 July at 09:27 UTC; the shadow method on the antipodal dates. The instant must be computed per year from solar longitude, never hardcoded. Both 2026 windows have passed; next London-observable dates are May and July 2027 | Session 37 `RESEARCH.md` sections 1.8, 12.5 and 22.5 |
| The sun method is the trusted verification | IslamQA-endorsed; the method users recommend to each other unprompted when apps disagree; `adhan` already ships `SolarCoordinates` and `SolarTime` | `R6` sections 6.3 and 6.4; session 37 `RESEARCH.md` section 19.3 |
| The market's answer to a bad compass | Detect, disclose, coach the figure of eight, and offer a sensor-free path. Trail Sense, the best open-source compass, ships exactly that and nothing more; nobody ships an app-side hard-iron fit | `E4` sections 1.1 and 7 |
| No keyless offline map ships | Al-Azan's map is network-bound and its F-Droid build drops it; SimplyQibla needs Google's SDK and key. The bearing-plus-cardinal-ring variant is the keyless equivalent, and it is nearly free | `E4` section 3 |

---

## 4. The durable-lessons register

The process lessons, quoted or closely paraphrased, each with its source. These are what stop a third repeat.

| # | The lesson | The source |
| --- | --- | --- |
| 1 | "when every app on a device agrees with every other app on that device, the fault is below the app layer, and the only honest next step is to instrument the boundary rather than reason about it" | `ai/AGENTS.md`, 2026-09-29, session 40 entry |
| 2 | "the platform's accuracy band is not evidence of accuracy": the X8 reported HIGH while 71 degrees wrong | `ai/AGENTS.md`, 2026-09-29 |
| 3 | "Four diagnoses were proposed and all four were wrong before anything was measured" | `ai/AGENTS.md`, 2026-09-29 |
| 4 | A synthetic half-measurement is worse than none: the "180 degrees from tilt" result paired a real magnetometer sample with a synthetic accelerometer, "which describes no physical situation and produces a meaningless number" | `ai/AGENTS.md`, 2026-09-29 |
| 5 | "the suite was green at 100% while the dial shipped every label counter-rotated by its own bearing... Both were invisible to tests and obvious in one screenshot." The device proof is a step, not a formality | `ai/AGENTS.md`, 2026-09-29, session 37 entry; `LOG.md` section 5a |
| 6 | "a break script is not verified until it is run, and the first draft of this one printed SURVIVED". Learned in session 32, repeated in 37 | `ai/AGENTS.md`, 2026-09-27 and 2026-09-29; `LOG.md` section 5a |
| 7 | Tuning a constant to one room exports that room's steel to everyone: "shipping it would export one bedroom's steel to every user on Earth" | `LOG.md`, "The finding that ends the tuning"; `components/sheets/screens/Qibla.tsx` lines 41 to 49 |
| 8 | No shipped app offers a "fix your heading by N degrees" control, and a persisted manual offset "bakes today's room into every future reading at every location" | `E4` section 4; `D4` section 6 |
| 9 | "a gap is only a dropped frame if it lands at an arbitrary time": the multiple-of-vsync check separates a missed frame from an idle vsync, and the harness's own verdict calls both FAIL | `ai/AGENTS.md`, 2026-09-29, session 37 |
| 10 | "a version counter read from the working tree is not safe while two sessions run": 1.29.107 and 1.29.108 each name two different commits | `AUDIT-EXECUTION.md` section 2.1 |
| 11 | Two `build-mock.zsh` runs share one worktree and one log; a second started before the first dies deletes the first's intermediates and reads as a corrupt dependency | `LOG.md` section 6.2 |
| 12 | "when a sweep over real data lights up, suspect the assertion before the code" | `ai/AGENTS.md`, 2026-09-27, session 32 |
| 13 | "an agent that fails or times out is redeployed on the same brief", and a gateway failure never consumes an attempt: the ceiling was raised to 20 | Session 37 `RESEARCH.md` sections 7 and 8.3a |
| 14 | The nested-copy trap fires on ANY `yarn add`, not one that touches the nested package: run `widgetRuntimeLoads.test.ts` after every install | `ai/AGENTS.md`, 2026-09-26 session 23 entry and 2026-09-27 session 31 note |
| 15 | "Any claim built on that buffer's 'stability' is built on nothing": round 1's 90-minute bias observation was a frozen `dumpsys` buffer replaying 178 ms of a static phone | `E5-device-measurements.md` section 2 |
| 16 | The session should not ship "the third confident diagnosis in a row that the evidence does not hold" | `D5-adversarial-review.md`, closing section |
| 17 | The owner's own instinct is right where it counts: "a rock-steady needle a few degrees off beats a jittery one that is mathematically perfect" | Session 40 `BRIEF.md` section 3.2 |
| 18 | "The compass is therefore honest about the needle, never about the number." The governing principle from the start | Session 37 `PLAN.md` section 1.1 |
| 19 | Every catastrophic field failure is a sensor or GPS failure, not one of arithmetic: "Math bugs are conspicuously absent" from the field record | Session 37 `RESEARCH.md` section 11.4 |
| 20 | The Ponytail ladder, applied here: does this need to exist? is it in the codebase? is it in the stdlib? is it one line? Only then build the minimum. A map renderer is the last rung; the sun line and the ring are the first | Global `AGENTS.md` section 8 |

---

## 5. The adversarial review of the map proposal

The premise under test: "a map is checkable so the user catches the error". Attacked from seven angles, including
the row's own arithmetic.

### 5.1 A map still has to be oriented, and both orientations have owners already

If the map is **north-up**, the user must mentally rotate the drawn line against the street they can see. That
rotation is a known source of error and it is the dominant term in the row's own budget: `P0-error-budget.md`
section 2 assigns 2 degrees to judging the street on the map and 3 to matching it to the real one, both flagged
as estimates. If the map is **heading-up**, it rotates by the magnetometer, which is the broken thing, and the
map inherits every defect in section 3.2 above.

The market has already taken sides on this. Al-Azan's map is north-up by default with compass rotation as an
opt-in setting, off by default, "so the map remains usable when the compass is wrong" (`E4` section 1.5).
SimplyQibla keeps the compass only as an optional map-rotation mode behind a setting (`E4` section 1.6). The
shipped answer is north-up, and a north-up map does not escape the alignment problem, it relocates it from the
sensor to the user's head.

**Verdict: the map escapes the magnetometer only by handing the rotation to the human, and the human's error is
unmeasured.** P0's own numbers make the map 6.2 degrees RSS against the fused sensor's 9.7 on open floor, a gap
of 3.5 degrees that "alone would not justify a session" (`P0` section 3). The indoor case is what carries the
row, and indoors is precisely where the next attack lands.

### 5.2 Does the user know which way their street runs, and can they see it at all

The map's checkable content is streets and buildings. Enumerate where that content is unavailable:

| Situation | What the map offers | What the user can check against |
| --- | --- | --- |
| At home, ground floor, window on the street | The road shape | The street itself. The strongest case: a one-time calibration of a known place |
| At home, interior room | The road shape | A room. The user sees walls, not streets. The common case, since "most prayer happens indoors" (session 37 `PLAN.md` section 1.1) |
| A cul-de-sac or curved road | A curve | Judging a curve's mean direction is worse than a straight street; P0's 2-degree term is the optimistic end |
| A tower block flat | The building footprint | The building's own walls, which the user can align to, but only if the footprint is drawn and the user knows their floor's orientation within it |
| A basement | Nothing visible | No GPS fix under `readPosition` either, so possibly no map at all |
| A hotel room in an unfamiliar city | An unfamiliar street plan | Nothing. The map is the only source of geography, and aligning a map to a room with no line of sight outdoors is impossible without a compass, which is the thing being replaced |
| A plane or a train | A moving position | Nothing stable. The owner's own traveller objection is what killed the cached-forever position in row 37 |
| Open countryside | Field boundaries, maybe a road | Far sightlines and the sun. The map's feature-poor at exactly the place the sun method is strongest, and a distant church tower or tree line serves the alignment better than any drawn tile |

The honest structure of the map's value: it is a **one-time calibration against a known place**. "The qibla from
my living room is toward the bay window." That is real and users describe doing exactly this: "you figure out
'oh, so I stand this way relative to Suchandsuch Street'" (`R6` section 6.2, quoting a user). But the
calibration happens outdoors or at a window, once, and the screen is used at prayer time in a room. The map
solves the establishment of the direction, not its use, and the traveller, the exact user the owner defended in
row 37, is the one the map serves worst.

### 5.3 Offline planet at street zoom does not fit, and partial coverage has an owner ruling against it

The brief's own research questions on the basemap and the renderer will measure the tile weights, so this review
does not guess them. What is already established:

- **No shipped app has done it.** E4 section 3: "no keyless, offline map exists" in the readable shipped
  ecosystem. Al-Azan, which wanted exactly this, ships network-bound and strips MapLibre from F-Droid builds
  rather than carry it.
- **A coarse-zoom planet fits but shows the wrong thing.** Country-level zoom orients toward a continent, and
  the "face Saudi Arabia" shortcut is measured at 23.1 degrees wrong from Cairo and 7.8 from London (section 3.1 above).
  The checkable content, streets, exists only at high zoom, and high zoom for the whole planet is the thing that
  does not fit.
- **A region pack creates the traveller hole.** The owner's row 37 ruling: 🐋  "some people are travellers... we
  still need a compass even when we are in a different country." A map that carries only London tiles is blank
  in Cairo, and under the owner's premise ruling, 🐋  "I would rather not offer this feature at all", a screen
  that confidently shows nothing to the traveller is worse than no screen. Either the planet ships, with its
  weight, or the row's own predecessor ruling is contradicted. **This is a coverage contradiction, not a size
  question, and the size-deferral ruling of 2026-09-29 does not dissolve it.**
- The one-time-download escape (assumption B3) satisfies "works offline in use" while breaking 🐋  "It's a
  completely on the phone app". It is flagged REVIEW in `ASSUMPTIONS.md` and belongs to the owner.

### 5.4 Is the map solving the problem or moving the blame

Bluntly: partly yes, it moves responsibility to the user, and partly that is legitimate.

The illegitimate half would be a map that lets the app stop being accountable: draw a line over a basemap, call
the result checkable, and when the user prays 10 degrees off, the error is theirs. The app still owns every term
that produces the line: the position, the bearing, the projection, the basemap's own accuracy and staleness.
Two of those are settled and exact (section 3.1). The projection is not: **on a Mercator basemap a straight line
is the rhumb line**, and in London the rhumb line is 14.86 degrees from the great circle (`D5` section 2). An
implementation that draws "a line toward Makkah" as a straight screen line at continent zoom, or that lets the
user eyeball toward Saudi Arabia on the map, reproduces the exact flat-map error the project has already
measured twice. The app must draw the geodesic itself, computed from the bearing it already has. At street zoom
over a few kilometres the geodesic is a straight line at the great-circle bearing, so the drawing is easy, but
the requirement is load-bearing and easy to miss.

The legitimate half: the user is the only party with eyes on the room. E4's teardown shows the whole market
converged on giving the user a sensor-free path and being honest about the rest. Muslim Pro ships a sun icon and
tells users to align manually. SimplyQibla deleted the compass. Al-Azan ranks its own compass below its map in
its own disclaimer: "Qibla direction shown by this app, particularly in compass mode, can be wrong." The
distinction that keeps it honest: the app must still publish states (D4's ladder), not a disclaimer. A map plus
an interference warning plus the bearing number is accountable. A map alone is a shrug with a renderer.

### 5.5 The attack on `P0-error-budget.md`, term by term

The row's justification is P0's comparison table, and four of its six rows are estimates (the two sensor rows are
measurements). The mandate is to attack it, so here is each term tested.

| Term | P0 value | The attack | Does it hold |
| --- | --- | --- | --- |
| Reading the line on screen | 0.5 | The smallest term and the safest. Human orientation acuity for a line against a reference is published at well under a degree, and P0 flags it UNVERIFIED as a citation while using it as a floor. The screen-space check: on a 312 pt dial (session 37 `RESEARCH.md` section 4.2b, the smallest of the fleet) one degree of bearing is about 2.7 pt of arc at the rim, so a 0.5-degree judgement is about 1.4 pt, which is near the limit of what a careful eye resolves on a phone screen. The term is plausible as a best case and optimistic as a typical case, but it stays the smallest term either way. Holds, thinly. |
| Judging the street on the map | 2.0 | Optimistic for the city most of the user base prays in. London's street grid is anything but straight: crescents, squares, roads that bend three times in a view. P0's own note says "a straight street is better, a curved one worse" and assigns the better case the number. A curved street judged by its chord can be 10 degrees off its mean direction, and the user's road is one they know because they live on it, not because it is straight. Half the real-world cases sit above this term. As a median it is defensible; as a design bound it is low. |
| Matching the map to the visible street | 3.0 | The one term with a shape nobody has measured for THIS task: the user sees the street in PERSPECTIVE, from eye height, and must match it to a PLAN view. That mental rotation is the classic hard case in map-reading research, and it couples with the previous term rather than adding independently: the same oblique view that hides the road's true direction on the ground hides it on the screen too. P0 combines the terms in quadrature (RSS), which assumes independence. For a bent street seen end-on, terms 2 and 3 are one error seen twice, and the honest combination is closer to their sum than their quadrature. This is the term most likely to be underestimated. |
| Transferring to the body or mat | 5.0 | The honest one. P0 flags it "the one nobody can remove", and the counterpoint section concedes it applies to the sensor too. It holds. |
| RSS total, 6.2 | derived | The arithmetic is correct GIVEN independence, and independence is the weak assumption. For the coupled case (bent street, end-on view) a sum-combination gives 10.5, which P0 itself records as the worst case. The coupled case is not rare; it is the interior-room case the row exists to serve. |
| Worst case, all aligned | 10.5 | Correct arithmetic. The attack's finding is that this "worst case" is not a tail: the coupled case is the bent-street, end-on-view case, and a user who lives on a curved road or prays in an interior room meets it every time. |

**Does the conclusion survive?** Yes, and the reason is structural rather than numerical. P0's own attack section
already ran the stress test: "the indoor comparison survives even if every term doubles (12.4 RSS against 30)". The
30-degree indoor figure is a measurement from the owner's own room (`LOG.md`), not an estimate, and no plausible
inflation of the four human terms reaches it. Even the fully coupled worst case, 10.5, sits inside the fused
sensor's INDOOR error, and the sensor's indoor error has no ceiling: D5's corrected dipole table shows a speaker
magnet at 10 cm deflecting a compass 29 degrees and a magnetic case plate at 5 cm deflecting it 83 (`D5` section
5), and Ettlinger and Weiss's 17.4-degree indoor RMSE is the AVERAGE, not the tail (session 37 `RESEARCH.md`
section 13.4). The map's error is bounded by human anatomy. The sensor's is bounded by whatever steel is nearby.

What does NOT survive is the open-floor claim, and P0 concedes this itself: adding the 5-degree body term to both
sides puts the sensor at 10.9 against the map's 6.2, a gap inside the coupled case's own error bars, and P0's
summary already rules that the open-floor gap "alone would not justify a session". **The row must not be justified
on open-floor precision. It must be justified on the wall-proximity property alone, which is a measurement against
a measurement and is safe.** P0's framing already says exactly this. The row's marketing should not drift from it.

One term P0 does not carry and this review adds as a required sixth: **the user's trust in their own answer**. The
map's value depends on the user noticing when their alignment failed (the bent-street case above). A user who
mis-aligns by 15 degrees on a curved road gets no signal at all, which is the dial's silent-confidence failure in a
new costume. The mitigation is not numerical: it is showing the bearing number beside the map permanently, so the
user can always re-derive the answer against a physical compass or the sun. That mitigation already ships as the
reading line in `components/sheets/screens/Qibla.tsx`.

### 5.6 The simplest thing that could work, and it has not been the row's centre of gravity

In ascending cost, all already inside the codebase or the research:

1. **The bearing number and the cardinal ring.** Already on screen. D4's rung 5 and the no-compass state: "The
   qibla from here is 119 degrees from north, so line that up with any physical compass." Greater London spans
   0.71 degrees, so one number serves every current user. E4 section 3: nearly free, and "the biggest
   commercial app effectively tells users to perform [it] by hand."
2. **The sun line.** "The sun is at 214 degrees now; the qibla is 119." Face the sun, turn by the difference.
   On rasd days, "the shadow points along the qibla at 13:27". Closed-form astronomy, no sensor, no network, no
   permission beyond the one already held; `adhan@4.4.6` already ships `SolarCoordinates` and `SolarTime`
   (session 37 `RESEARCH.md` section 19.3); IslamQA-endorsed; the method users recommend to each other
   unprompted (`R6` section 6.3). Its one limit: it needs daylight and a view of the sun, so it is a
   verification path, not the whole answer. The dates must be computed per year, never hardcoded (section 3.3).
3. **A region map**, north-up, geodesic drawn by the app, per section 5.3's constraints.
4. **A planet basemap.** No precedent, unmeasured weight, the traveller hole either way.

E4's closing line on option 2: "of everything in this report, it is the highest-certainty feature per line of
code." The row as briefed puts the map first and the sun method as research question 4. The order should be
reversed: options 1 and 2 are buildable now, cannot be bent by a room, and serve the no-compass phones that no
map or sensor can reach.

### 5.7 The bundle cost, stated against the baseline and the ruling

The spawned brief named a 66 MB APK the owner wants smaller. The current `BRIEF.md` on disk, updated later the
same day, records the owner's superseding ruling: 🐋  "I think you should stop worrying about the size, actually.
Don't worry about the size for now... This is too early to think about it." Size is recorded, never a filter.

Recorded, then: the baseline is a 67 MB release APK, of which 26 MB is `lib/arm64-v8a` at a single ABI, 9.4 MB
`classes.dex`, 4.9 MB the JS bundle, about 15 MB audio (`BRIEF.md` section 2). A native renderer adds its own
binary per ABI on top of that, and the renderer report in this session's wave carries the measured number; this
report does not guess it. The one measured precedent is Al-Azan's F-Droid build dropping MapLibre whole rather than
ship it (`E4` section 1.5). Under the deferral ruling that precedent is not a veto, but it is the only shipped
data point on what a map costs a prayer app, and it says the cost was too high for an app that wanted it.

The size ruling will flip back, because the owner's standing position on the app is small. `BRIEF.md` already
binds every proposal to state its megabyte cost. Keep doing that even while the filter is off.

### 5.8 What survived the attack

- The **indoor comparison** in P0 section 3: the map's error does not grow near a wall, the sensor's does. That
  is the row's real justification and it survived every angle above.
- The **one-time calibration at a known place** use case, section 5.2's strongest row.
- The **geodesic-drawing requirement**, section 5.4: whatever ships must draw the line, never invite the user to
  eyeball toward a country on a flat map.
- The **sun line and the number-plus-ring** as deliverables that stand entirely outside this argument.

What did not survive: the map as the primary and only surface; the implication that checkability is free; the
planet-scale offline basemap as a buildable object this session; any design where the user's own
unmeasured alignment error is the largest term in the budget and nobody measures it; and any open-floor
precision claim, which section 5.5 shows is noise once the shared body-transfer term is charged to both sides.

---

## 6. The repeat-risk list

Concrete ways session 41 is about to repeat sessions 37 or 40. Named files, named patterns.

| # | The repeat | The precedent | What to do instead |
| --- | --- | --- | --- |
| 1 | **Shipping a correct renderer and calling the feature fixed.** Both prior sessions shipped correct code; the failure was never in the code | Sessions 37 and 40 in full | Judge on `P0-error-budget.md`'s comparison, and replace its four estimate terms with measurements before any PLAN is written |
| 2 | **Tuning a constant to the owner's room.** It will return as "default map rotation" or "the user's manual offset" | 270, 180, 190, 180, 170, 190, then 220 measured and rejected, all in one evening (`LOG.md`; section 2.4) | No persisted correction of any kind. `E4` section 4: no shipped app offers one |
| 3 | **Four confident diagnoses before measuring.** The map row's equivalent is asserting the user "catches the error" without measuring the human alignment error | `ai/AGENTS.md` 2026-09-29 | P0 exists and flags its terms as estimates; the human-factors research pass must fill them or the row ships on guesses |
| 4 | **100% coverage hiding a visual defect.** A map is the largest visual surface this app has ever shipped; tests assert on props and GeoJSON, not pixels | 1.29.108: every label upside down behind a green suite | A device proof with a real screenshot read against a known street, by the session or `vision`, before any DONE verdict |
| 5 | **The version-counter collision.** Five subagents plus a main session are committing docs concurrently, the exact condition that stamped 1.29.107 and 1.29.108 twice | `AUDIT-EXECUTION.md` section 2.1 | Take the version from `origin/uat-2` at the moment of the bump, or serialise the commits |
| 6 | **The nested-copy trap on `yarn add`.** Any map dependency install re-resolves the tree and can put `@expo/ui@58.0.7` back under `expo-widgets` | Session 31, recorded in `ai/AGENTS.md` | `widgetRuntimeLoads.test.ts` after every install; `rm -rf node_modules/expo-widgets/node_modules` then reinstall if it fails |
| 7 | **The dist-tag trap.** `latest` points at the 57 line for Expo SDK 58 packages | Row 37 hit it; `R1-api-arbitration.md` section 2 confirms it | Pin exactly, verify against the registry on the day |
| 8 | **A preview-era native dependency on Fabric and RN 0.88.0-rc.2.** The repo has been burned by exact-version pinning of preview packages, `@expo/ui` at 58.0.5, where 58.0.6 and 58.0.7 break both platforms | `ai/AGENTS.md` widget invariants | Treat the renderer's version pin as a lockstep risk and test the actual build, not the version number |
| 9 | **Two builds in one worktree.** A map renderer makes builds longer, raising the temptation | `LOG.md` section 6.2 | One build at a time; check `ps` for `assembleRelease` first |
| 10 | **Re-deriving settled findings.** The bearing, the tolerance, the great-circle ruling, the permission, the field check. Five fresh agents with no memory are the exact repeat vector | This report's section 3 exists to stop it | Section 3 is the register; cite it, never recompute it |
| 11 | **Ignoring the traveller.** The map's region coverage is the cached-position mistake in a new costume | Row 37: 🐋  "some people are travellers" | The coverage answer must serve a user who lands in Cairo tomorrow, or say honestly that it does not |
| 12 | **Eyeballing toward Saudi Arabia on a flat map.** The owner's own practice, cited as the row's model, carries a 7.8-degree country error and a 14.86-degree rhumb error in London | `D5` section 2; `BRIEF.md` section 3.2 | The app draws the geodesic. The user aligns to a street, never to a country |
| 13 | **The unfixed glyph rotation shipping again unnoticed.** `Dial.tsx` line 95 still carries `rotate(${-bearing})` on the Kaaba marker, flagged cosmetic by D5 and never fixed | `D5` section 6 | If the dial survives beside the map, fix it or carry the finding forward by name |
| 14 | **Leaving the Android proof undone.** Session 40 ended with the Android correction never checked on hardware and the iOS constant awaiting one clean reading | `LOG.md`, "Not proven on device" | Whatever row 41 ships, its device proof list starts with the two proofs row 40 still owes |

---

## 7. Sources

| Class | Source |
| --- | --- |
| Session records | `ai/plans/37-qibla-compass/{PLAN,LOG,AUDIT,AUDIT-EXECUTION,ANDROID-PERMISSIONS,RESEARCH}.md`; `ai/plans/40-heading-rearchitecture/{BRIEF,PLAN,LOG}.md` and all 17 files in its `agent-reports/`; `ai/plans/41-qibla-map/{BRIEF,ASSUMPTIONS}.md` and `agent-reports/P0-error-budget.md` |
| Repo records | `ai/plans/README.md` rows 37, 40 and 41; `ai/AGENTS.md` section 11 entries of 2026-09-29 and the widget invariants; `ai/ISSUES.md` (no open qibla, compass, heading or location issue exists; the qibla history lives entirely in the plan records) |
| Shipped code | `shared/qibla.ts`, `device/qibla.ts`, `components/sheets/screens/Qibla.tsx`, `components/qibla/Dial.tsx`, `components/qibla/dialGeometry.ts` |
| Commits | `665019d0`, `a4334fa7`, `049a955a`, `853d187c`, `94c3b3ae`, `0ee13ef8`, `893f2fd0` (the constant's full sequence); `376c7545`, `c0454a36`, `b2642b87` (the dial and calibration fixes); `1a833a94` (the 37 merge) |
| Measurements | Every number in section 3 is traceable to the file named in its row; none is this report's own measurement |

**On ISSUES.md:** it carries no qibla, compass, heading or location entries. The feature's entire institutional
memory lives in the plan records cited above. That is itself a repeat risk: a session that greps ISSUES.md for
qibla history finds nothing and concludes there is none.
