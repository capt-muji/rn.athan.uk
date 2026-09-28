# Session 37 research: the qibla finder

Everything below was measured or read from source during planning on 2026-09-28. Anything this session could
not verify is marked **UNVERIFIED** and names the step that proves it before code depends on it.

## 1. The mathematics, and why it is the easy part

### 1.1 The formula

The qibla is the initial great-circle bearing from the observer to the Kaaba:

```
y = sin(Δλ) · cos(φ_k)
x = cos(φ_o) · sin(φ_k) − sin(φ_o) · cos(φ_k) · cos(Δλ)
θ = (atan2(y, x) in degrees + 360) mod 360
```

where `φ_o` is the observer's latitude, `φ_k` the Kaaba's, and `Δλ = λ_k − λ_o`.

### 1.2 The Kaaba's coordinates

**21.4225° N, 39.8262° E.** Four independent sources agree on these to 4 decimal places, and they are what
QiblaLocator and the mainstream finders publish. Sources differ in the 5th decimal (latlong.net gives
21.422487, 39.826206; one tool cites 21.4224779, 39.8251832, whose longitude differs by ~0.001° or about
100 m). **A 100 m disagreement about the target is worth under 0.002° of bearing from anywhere outside
Makkah, so the 4-decimal value is used and the disagreement is noted, not resolved.**

### 1.3 Validation, measured this session

Computed bearings against published reference values for eight cities:

| City | Computed | Published | Δ |
| --- | --- | --- | --- |
| London | 118.99 | 118.99 | 0.00 |
| Jakarta | 295.15 | 295.15 | 0.00 |
| New York | 58.48 | 58.48 | 0.00 |
| Sydney | 277.50 | 277.50 | 0.00 |
| Istanbul | 151.62 | 151.60 | 0.02 |
| Toronto | 54.58 | 54.60 | 0.02 |
| Kuala Lumpur | 292.54 | 292.50 | 0.04 |
| Cape Town | 23.35 | 23.40 | 0.05 |

**Worst deviation 0.05°, and that is the published value's own rounding.** The formula is correct.

### 1.4 Spherical vs ellipsoidal: measured, and it does not matter

The academic literature (Helmi 2024; the Haversine/Vincenty comparative study; arXiv 2512.03271) debates
spherical against ellipsoidal earth models. Measured across 12 cities, **great-circle against Vincenty on
the WGS84 ellipsoid differs by at most 0.181°** (Sydney), typically under 0.1°.

**Vincenty is therefore rejected**: it is an iterative solver that can fail to converge for near-antipodal
pairs, and it buys under 0.2° against a sensor that is wrong by 5 to 30°.

### 1.5 The great-circle vs rhumb-line dispute is REAL and must not be silently taken

This is the one genuinely contested question, and it is religious rather than technical.

- The **great circle** (shortest path) is what essentially every modern mosque and app uses. Utrecht
  University's reference page states it plainly: "The most commonly adopted algorithm was based on the
  great-circle path."
- A **rhumb line** (constant compass bearing) is advocated by a minority, notably Nachef and Kadiar for
  North America, and arXiv 2512.03271 records that their position cites classical jurists and is backed by
  some contemporary theologians.

Measured, the two disagree enormously in the Americas and barely in Eurasia:

| City | Great circle | Rhumb line | Difference |
| --- | --- | --- | --- |
| Los Angeles | 23.86 | 95.17 | **71.31** |
| Chicago | 48.67 | 100.78 | **52.11** |
| Toronto | 54.58 | 102.61 | **48.03** |
| New York | 58.48 | 101.28 | **42.80** |
| Tokyo | 293.00 | 260.73 | 32.27 |
| Sydney | 277.50 | 297.50 | 20.00 |
| London | 118.99 | 133.83 | 14.84 |
| Istanbul | 151.63 | 154.85 | 3.22 |
| Jakarta | 295.16 | 292.80 | 2.36 |
| Moscow | 176.36 | 177.22 | 0.86 |

In North America the two differ by roughly a right angle: great circle points north-east, rhumb line
south-east. **This is why some North American mosques face north-east and others south-east.**

**Decision: great circle, and the app never names the dispute in user copy.** It is the mainstream position
and London's own difference is 14.8°, well inside what a phone compass can resolve anyway. Recorded here so
a later session does not "fix" it.

### 1.6 The error budget: the sensor dominates by two orders of magnitude

| Source | Worst error | Basis |
| --- | --- | --- |
| Great circle vs ellipsoid | 0.18° | measured, 12 cities |
| Coarse location (1 to 3 km) | 0.05° | measured; 10 km gives 0.5° |
| WMM declination residual | ~0.5° | NOAA, most populated areas |
| Magnetometer, calibrated, outdoors | 5 to 10° | published sensor accuracy |
| Magnetometer, indoors near metal | 15 to 30°+ | published; dominant term |

**Refining the maths is measurably pointless. The honest engineering is calibration UX and telling the user
when not to trust the reading.** That is where this session's effort goes.

### 1.7 Position tolerance, and where it inverts

Worst-case bearing error from a position error, sampled over a global grid excluding a 1000 km cap around
the antipode:

| Position error | Worst qibla error |
| --- | --- |
| 10 km | 0.5° |
| 50 km | 2.4° |
| 200 km | 9.7° |

So a commute never matters and coarse location is ample. **Two exceptions:**

1. **Near Makkah the relationship inverts.** From Jeddah (66 km out) a 50 km error moves the bearing 49°,
   and a 200 km error moves it 170°. The Hajj pilgrim is the user a stale position fails worst.
2. **The antipode** (−21.4225, −140.1738, open South Pacific, nearest land the Gambier Islands ~600 km) is
   mathematically degenerate: every direction is equally "toward" the Kaaba. No inhabited place is inside
   the degenerate cap, but the code must not produce NaN there.

### 1.7a Numerical safety: measured, and the formula cannot produce NaN

Every degenerate input was run through the formula this session:

| Input | Result |
| --- | --- |
| The Kaaba itself | 0.00, finite |
| 1 m north of the Kaaba | 180.00, finite |
| The exact antipode | 90.00, finite |
| North Pole | 140.17, finite |
| South Pole | 39.83, finite |
| Date line, `+180` and `-180` | 301.49 both, identical |

**No input produces NaN.** The only candidate degeneracy is `atan2(0, 0)`, and IEEE 754 defines that as
`0` rather than NaN in both Python and JavaScript. The antipode is therefore "arbitrary but stable" rather
than undefined: the bearing is meaningless there in the real world, but the code never breaks. A guard is
still warranted for the *display*, not for the maths.

### 1.7b The Kaaba's angular size, which is the geometric heart of the tolerance question

The Kaaba is about 12.86 m wide. Its angular size from a distance is what any "exact direction" claim runs
into:

| From | Distance | Kaaba subtends |
| --- | --- | --- |
| Inside the Sacred Mosque | ~50 m | 14.66° |
| Makkah, edge of city | 5 km | 0.147° |
| Jeddah | 66 km | 0.011° |
| Cairo | 1,287 km | 0.00057° |
| London | 4,794 km | **0.000154°**, about 1/6,500th of one degree |
| New York | 10,307 km | 0.000071° |

**From London the Kaaba covers roughly one six-thousandth of a single degree.** No compass, no survey
instrument, and no human body can be aimed that finely. This is the geometric reason the schools of
jurisprudence discuss facing the *direction* (jihat al-Kaaba) rather than the *point* (ayn al-Kaaba), and
it is the strongest possible argument that our effort belongs in sensor honesty rather than decimal places.

Read the other way, an angular error costs this much miss-distance at Mecca:

| From | 1° error | 5° error | 22.5° error |
| --- | --- | --- | --- |
| Cairo | 22 km | 112 km | 505 km |
| London | 84 km | 418 km | 1,883 km |
| Jakarta | 138 km | 691 km | 3,108 km |
| New York | 180 km | 899 km | 4,048 km |

The 22.5° column is there because it is half of a 45° sector, the tolerance some scholarly positions
describe as facing the general direction. **Agent research is confirming the actual jurisprudential
positions; these are the geometric consequences, not a ruling.**

### 1.7c London is a single bearing, which is how this ships safely

Measured across Greater London, which is the app's ENTIRE current user base:

| Place | Qibla | Δ from Charing Cross |
| --- | --- | --- |
| Charing Cross | 118.987 | — |
| Ilford | 119.259 | +0.272 |
| East Ham | 119.215 | +0.227 |
| Woolwich | 119.185 | +0.198 |
| Enfield | 119.174 | +0.187 |
| Croydon | 118.897 | −0.090 |
| Wembley | 118.844 | −0.143 |
| Heathrow | 118.593 | −0.395 |

**The total spread across Greater London is 0.666°**, and the compass cannot resolve better than about 5°.

Two consequences the plan uses:

1. **The feature can be verified on device against a known constant.** A London device must read
   119° ± 1, and any reading outside that is a defect, regardless of what the location layer reports. This
   gives a device proof that does not depend on trusting the location code, which is exactly the property
   session 25's drift work lacked when its "after" run silently used mock data.
2. **A wrong location is detectable in London but invisible elsewhere.** If the position fell back to
   something absurd, London's expected 119° would not appear. The device proof therefore has real
   diagnostic power here that it would not have in, say, Cairo.

### 1.7d London's magnetic declination is currently near zero, which is a TRAP for our own testing

The British Geological Survey records that the **agonic line, where declination is exactly zero, crossed
Greenwich in September 2019 for the first time since about 1660**, and is moving west at roughly 20 km per
year. BGS's Dr Ciarán Beggan: "By 2040, all compasses will probably point eastwards of true north."

So in London today, **magnetic north and true north very nearly coincide**. That is a testing hazard rather
than a benefit: section 2.1's negative-`trueHeading` bug, and any confusion between `magHeading` and
`trueHeading`, are **invisible in London** because the two values are nearly equal here. A London device
cannot prove that the declination handling is correct.

**The plan must therefore test declination handling with unit tests over synthetic values, not on the
owner's phone.** The simulator can be given any coordinates, which is the honest way to exercise a
negative-declination location such as New York without travelling.

WMM2025 is the model behind both platforms, released 2024-12-17 and valid to 2029-12-31; BGS's own
calculator accepts dates from 2024-01-01 to 2034-12-31 but warns that "inputs beyond 2030 are not
recommended as accuracy will be reduced".

### 1.8 A free precision check nobody needs to build

Twice a year the sun passes directly over the Kaaba: **27/28 May at 09:18 UTC and 15/16 July at 09:27 UTC.**
At that instant, anywhere in the hemisphere centred on Makkah, the sun's direction IS the qibla, to a
fraction of a degree, with no compass at all. For the opposite hemisphere the sun passes over the antipode
on 12/13 January at 21:29 UTC and 28 November at 21:09 UTC, so the direction of one's shadow is the qibla.

Not built in this session. Recorded because it is the cheapest possible accuracy feature and a natural
follow-up, and because it is the ground truth against which a device reading can be checked for free.

## 2. The platform, read from source

`opensrc` fetched `expo-location@58.0.8`, published 2026-09-28, and the heading path was read directly.
**These are traps the documentation does not mention.**

### 2.1 TRAP: Android's `calcTrueNorth` can return a NEGATIVE heading

`android/src/main/java/expo/modules/location/LocationModule.kt:691`:

```kotlin
private fun calcTrueNorth(magNorth: Float): Float {
  val geofield = mGeofield.takeIf { !isMissingForegroundPermissions() } ?: return -1f
  return (magNorth + geofield.declination) % 360
}
```

Kotlin's `%` is a **remainder**, which keeps the sign of the dividend. Declination is negative throughout
the Americas, so wherever `magHeading + declination < 0` the result is negative. Modelled:

| Place | magHeading | declination | `trueHeading` |
| --- | --- | --- | --- |
| London | 10.0 | +0.3 | 10.3 |
| New York | 10.0 | −13.0 | **−3.0** |
| Seattle | 5.0 | −15.6 | **−10.6** |
| Cape Town | 5.0 | −25.6 | **−20.6** |

Six of eight sampled places can emit a negative `trueHeading`. **The app must normalise every heading with
`((h % 360) + 360) % 360` before use.** This is also indistinguishable from the documented `-1` sentinel
for "no permission" if the code merely tests `heading < 0`, so the sentinel must be tested with `=== -1`
BEFORE normalising, and this session's own reading is that relying on that sentinel at all is fragile.

**UNVERIFIED on device.** Step 1 pins the normalisation with tests; the device proof records the raw values
the phone actually emits.

### 2.2 TRAP: Android never remaps the coordinate system

`sendUpdate()` calls `SensorManager.getRotationMatrix` then `getOrientation` with no
`remapCoordinateSystem`. The azimuth is therefore correct **only while the phone is held flat, face up**.
A qibla compass is used flat on a table or in the palm, so this matches the real posture, but the app must
say "hold the phone flat" rather than assume.

### 2.3 TRAP: Android throttles to ~2° and 50 ms

`LocationModule.kt:1094`: `DEGREE_DELTA = 0.0355` radians (about 2°) and `TIME_DELTA = 50f` ms. Updates
below 2° of change are dropped upstream. **So the needle can only ever be fed ~2° steps on Android**, and
any smoothing must interpolate between them rather than expect fine-grained input.

### 2.4 Android uses the raw magnetometer, not the fused rotation vector

`startHeadingUpdate()` registers `TYPE_MAGNETIC_FIELD` and `TYPE_ACCELEROMETER` at `SENSOR_DELAY_NORMAL`.
It does **not** use `TYPE_ROTATION_VECTOR`, which the Android documentation and practitioner write-ups
both describe as more stable. This is a known quality ceiling of the library, not something the app can fix
without its own native module, which is out of scope.

### 2.5 Android's declination needs a location fix it may not have

`startHeadingUpdate()` builds `GeomagneticField` from `getLastKnownLocation`, and if that is null it
requests a **`PRIORITY_HIGH_ACCURACY`** single update. Until that arrives, `mGeofield` is null and
`calcTrueNorth` returns `-1`. **So `trueHeading` is `-1` for a period after the screen opens, even with
permission granted**, and the UI must tolerate it rather than draw a wrong arrow.

### 2.6 iOS is Core Location, and cleaner

`ios/LocationModule.swift:99` streams `DeviceHeadingStreamer` with
`LocationOptions(accuracy: .bestForNavigation)`, emitting `heading.trueHeading`, `heading.magneticHeading`
and a normalised `headingAccuracy`. Core Location computes true north itself. Note that the module sets
neither `headingFilter` nor `headingOrientation`, so iOS uses its defaults.

### 2.7 `accuracy` means two different things

- **iOS:** `3` is < 20° uncertainty, `2` < 35°, `1` < 50°, `0` > 50°.
- **Android:** `mAccuracy` is whatever `onAccuracyChanged` last reported, that is
  `SENSOR_STATUS_ACCURACY_{LOW,MEDIUM,HIGH}`, which is an unreliable/low/medium/high scale with no degree
  meaning.

They share a field name and a 0 to 3 range with **different semantics**, so the app must treat the number
as an ordinal "how much to trust this" and never print a degree figure from it.

## 3. What the install costs, measured in a scratch worktree

Proven in `~/athan-device-sweep/worktrees/plan-37` at `a626ae8b`, then removed.

1. `npx expo install expo-location` resolves **58.0.8** and completes in 44s. `patch-package` reapplies both
   existing patches cleanly (`expo-background-task@58.0.7`, `expo-widgets@58.0.5`).
2. **The documented nested-copy trap FIRED.** After the install,
   `node_modules/expo-widgets/node_modules/@expo/ui` existed at **58.0.7** while the flat pin read 58.0.5,
   and `shared/__tests__/widgetRuntimeLoads.test.ts` failed 2 of 3 tests. This is exactly the failure
   `ai/AGENTS.md` records for session 31, from an unrelated dependency.
3. **The documented remedy worked:** `rm -rf node_modules/expo-widgets/node_modules` then re-running the
   suite passes 3 of 3. A full `yarn install --frozen-lockfile` was not needed.
4. With `expo-location` installed and the nested copy removed, the **full suite is green: 177 suites, 4786
   tests, 2 skipped**, in 9.8s.
5. A pure-maths spike of `qiblaBearing` passed 6 of 6 including a 12x25 global sweep asserting every bearing
   lands in `[0, 360)`.
6. `shared/__tests__/unusedExports.test.ts` fails the moment a new exported symbol has no production
   importer. **So the plan must wire the module up in the same step that creates it**, or add it to that
   test's allow-list, which would be wrong.

## 4. The visual design, and the constraint that shapes it

### 4.1 Build our own, in SVG, and keep it simple

Owner's ruling: 🐋  "we're going to use our own compass, not download one from online, like design our own
style... because it's just to fit the theme of the app."

`react-native-svg@15.15.5` is **already a direct dependency** (`package.json:72`) and already used in app UI
by `components/ui/Glow.tsx`, `components/prayer/Alert.tsx` and `components/prayer/Explanation.tsx`. So the
custom compass needs **no new package**.

### 4.2 THE CONSTRAINT: 60fps is the target, and it rules out the obvious implementation

**OWNER RULING, 2026-09-28, raising the bar for this screen:** 🐋  "we want to maintain or keep a minimum
30 FPS for the bad phones, but realistically, we're looking at 60 FPS. We want 60 FPS, so it's really,
really important. We keep this very optimised."

This supersedes Performance Design Rule 1's "60fps is a bonus, never required" **for the qibla screen**:
60fps is the target on every phone, and 30fps is the floor the 3T may fall back to. The rest of rule 1
(no multi-frame freezes) still binds.

The budget arithmetic decides the architecture on its own:

| Target | Budget per frame |
| --- | --- |
| 60 fps | **16.67 ms** |
| 30 fps | 33.33 ms |

`components/ui/Masjid.tsx` carries the measured lesson: a 30-path SVG icon "re-walks react-native-svg's
drawing pipeline on every full-window display-list record", costing **40 to 56 ms per Android page-swipe
start on the SD820**, bisect-verified, and it was replaced with a PNG. **That is 2.4x to 3.4x the entire
16.67 ms budget for ONE 60fps frame.**

**So the compass must never re-record its vector tree while the needle moves.** That rejects the obvious
implementation, animating SVG attributes through `useAnimatedProps`, which re-walks the drawing pipeline
every frame; practitioner reports of exactly that approach failing are in the search record.

The architecture that reaches 60fps:

1. **The dial is drawn once as a static tree and rotated as a WHOLE LAYER** by a Reanimated `transform`.
   A transform is a compositor operation: no re-record, no JS in the frame loop.
2. **The Kaaba marker is one static element with one transform**, never a re-rendered path.
3. **Heading samples arrive at 20 Hz at most** (Android's own 50 ms throttle, section 2.3), so a sample
   writes a shared value and the ANIMATION interpolates between samples at display rate. JS never runs
   per frame.
4. **Path count stays low**, and any ornament richer than a few paths is pre-rasterized to PNG exactly as
   `Masjid` is.
5. Rule 2 (first-eval-snapped, never worklet-applied-only) so the needle does not pop at mount, and Rule 7
   (a closed surface ticks nothing) so the sensor subscription and every animation stop when the modal
   closes.

Frame proof is not optional here: `e2e/scripts/frame-audit.sh` on the 3T, read as compositor timestamps
per Rule 8, because a perf mark cannot evidence smoothness. **Note the harness's own gate is written for
the 30fps floor** (`gaps <= 33ms = 30fps floor pass`), so the 60fps target needs its frame gaps read
against **16.67 ms**, not the harness's default verdict. Its `FRAME_AUDIT=sf` fallback reads
SurfaceFlinger `--latency` cadence directly, which is the right instrument for a gap distribution.

### 4.3 TRAP: naive rotation spins the long way round

Interpolating a heading from 359 to 1 naively travels −358°, a visible full spin. Measured:

| From | To | Naive | Shortest |
| --- | --- | --- | --- |
| 359 | 1 | −358 | **2** |
| 350 | 10 | +340 | **20** |
| 10 | 350 | +340 | **−20** |

Every rotation must go through the shortest-arc form `((to − from + 180) mod 360) − 180`, accumulated onto
a continuous angle rather than assigned a wrapped one.

### 4.4 Smoothing

Practitioner consensus (Android compass write-ups, the low-pass filter literature) is a low-pass filter:
`out += alpha * shortestDelta(out, sample)`. Raw readings jitter by several degrees; a filter narrows that
markedly at the cost of lag. Combined with Android's own 2°/50 ms throttle, the filter is what makes the
needle feel solid.

## 5. Where it goes, and how it is reached

`app/Navigation.tsx` is a two-page `PagerView` (Standard, Extras) with two page dots and the settings
button beneath. Adding a third page would change the app's primary navigation, re-pitch the dots, and put
a location permission in the swipe path of every user. **Rejected.**

The Settings sheet (`components/sheets/screens/Settings.tsx`) already has titled cards and rows, and the
Help modal (`components/modals/Help.tsx`) is the precedent for a full-screen surface opened from a row.
**The qibla opens from a Settings row, as a modal, exactly as Help does.** That keeps the permission behind
a deliberate tap, which is also what makes it defensible at App Store review under Guideline 5.1.1
(purpose strings must describe use; unused or unexplained permissions are the most common rejection).

## 6. Sources

- arXiv 2512.03271, "Determining the Qibla Direction by Astronomical and Geometrical Methods" (the
  great-circle vs rhumb-line dispute, Nachef and Kadiar's North American position, the classical method).
- Utrecht University, R.H. van Gent, "Determining the Sacred Direction of Islam" (great circle as the
  commonly adopted algorithm; the qibla days and their exact UTC times).
- Helmi, R. (2024), "Spherical Plane And Ellipsoid Approaches in Qibla Direction"; and the Haversine /
  Vincenty / spherical-trigonometry comparative study (the ellipsoid debate).
- NOAA NCEI: WMM2025, released 2024-12-17, valid to 2029-12-31; the model both platforms' declination
  ultimately derives from.
- `expo-location@58.0.8` source, read via `opensrc`: `LocationModule.kt` and `LocationModule.swift`.
- Expo SDK 58 `expo-location` docs (docs-mcp-server): `trueHeading` "needs location permissions, will
  return `-1` if not given"; the `accuracy` scale; `getLastKnownPositionAsync` semantics.
- Apple App Review Guideline 5.1.1 (purpose strings).
- `ai/AGENTS.md`: the `@expo/ui` nested-copy trap; Performance Design Rules; `components/ui/Masjid.tsx`'s
  measured SVG cost.

## 7. Research method and retry policy

**OWNER RULING, 2026-09-28, on how research is delegated:** five research briefs were dispatched in
parallel to independent agents (jurisprudence; shipped-app engineering failures; sensor and platform
engineering; professional mosque-surveying practice; UX, visual design and accessibility). The owner's
standing rule for this session and any like it:

> An agent that fails or times out is redeployed on the same brief. If it fails a second time, it is
> redeployed once more. If it fails a third time, the session takes that brief over and does the research
> itself rather than leaving the topic unresearched.

No brief is ever dropped. Findings that contradict sections 1 to 6 above are recorded as contradictions
with both sources named, and the contradiction is resolved by measurement where a measurement is possible.

## 8. PAUSED: resume from here

**Paused 2026-09-28 at the owner's instruction, to restart the LLM gateway.** The repeated
`Chat admission capacity is temporarily unavailable` failures were the GATEWAY, not the research agents or
their briefs. Nothing below is a finding; it is the state to resume from.

### 8.1 What is already done and committed

- Sections 1 to 6 of this file: the mathematics, the great-circle vs rhumb-line dispute, the error budget,
  the five `expo-location@58.0.8` source traps, the measured install cost, the 60fps architecture ruling,
  and where the screen lives. All verified this session.
- Sections 1.7a to 1.7d: numerical edge cases (no NaN anywhere), the Kaaba's angular size, the London
  single-bearing property, and London's near-zero declination as a testing hazard.
- Row 36 CANCELLED and rows 37 to 39 queued in `ai/plans/README.md`. Row 37 is PLANNING.

### 8.2 The five research briefs, and their state at the pause

All five were dispatched to independent agents. Their full briefs are in this session's history; each is
reproducible from the topic list below.

| # | Brief | State at pause |
| --- | --- | --- |
| 1 | Jurisprudence: fatwa councils on great circle vs rhumb line, required precision, ruling if a prayer faced wrong | Failed once on gateway capacity at the pause; ONE retry used |
| 2 | Shipped-app engineering failures: bug reports, GitHub issues, app-store complaints, recurring traps | Failed once on gateway capacity, redeployed, no result yet |
| 3 | Sensor and platform engineering: Android/iOS heading APIs, declination, untrustworthy-reading detection, 60fps rotation | Failed once on gateway capacity, redeployed, no result yet |
| 4 | Professional practice: how mosque surveyors work, mosque-misalignment studies, why professionals distrust magnetic compasses | Failed once on gateway capacity, redeployed, no result yet |
| 5 | UX, visual design and accessibility: existing qibla screens, honest uncertainty wording, Islamic geometric motifs | Failed once on gateway capacity at the pause; ONE retry used |

**None has reported, and ALL FIVE failed on the gateway rather than on their work, so each has used exactly ONE of its two retries.** Every one of those failures was the gateway returning
`Chat admission capacity is temporarily unavailable`, never an agent error, so no brief needs rewriting.

### 8.3 The retry policy, which survives the pause

Owner's rule, 2026-09-28: an agent that fails is redeployed on the same brief; if it fails a second time it
is redeployed once more; **if it fails a third time the session takes that brief over itself.** The counts
above are per-brief and carry forward: briefs 2, 3 and 4 have each used ONE of their two retries.

### 8.4 Resume by doing exactly this

1. Re-dispatch all five briefs, honouring the counts in 8.2.
2. Fold each report into this file as its own section, naming the source for every claim.
3. **Flag any finding that contradicts sections 1 to 6**, naming both sources, and resolve it by measurement
   where a measurement is possible. The likeliest contradictions are the jurisprudential tolerance figures
   (section 1.7b computes the geometry but takes no ruling) and whether professionals accept a magnetic
   compass at all (section 4.2's architecture assumes the app's answer is sensor-limited).
4. Only then write `PLAN.md`. No app code has been written and none should be until the research settles.

### 8.5 The one thing to re-check on resume

`expo-location` is NOT installed in the main checkout. The install was proven in a scratch worktree that has
been removed, so `package.json` is unchanged and the tree is clean. Step 1 of the plan does the real install,
and it MUST carry the `rm -rf node_modules/expo-widgets/node_modules` remedy from section 3.
