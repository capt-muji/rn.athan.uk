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

### 4.2a The ornament budget, derived from the Masjid measurement, and why the DESIGN is not constrained

The Masjid figure (30 paths, 40 to 56 ms per record on the SD820) implies **1.33 to 1.87 ms per path** for
a full-window re-record:

| Paths | Estimated cost | Verdict against a 16.67 ms frame |
| --- | --- | --- |
| 8 | 10.7 to 14.9 ms | fits even if re-recorded |
| 12 | 16.0 to 22.4 ms | only safe if never re-recorded |
| 32 | 42.7 to 59.7 ms | only safe if never re-recorded |
| 72 | 96 to 134 ms | only safe if never re-recorded |

**The conclusion is liberating rather than limiting.** A static tree rotated by a transform is recorded
ONCE; the per-frame cost is then a compositor matrix multiply that does not depend on path count at all.
So the rule for the plan is:

> Draw the dial as richly as the design wants. The moving layer must be transform-only, never
> attribute-animated.

A 72-tick dial with Islamic geometric ornament is affordable if it never re-records, and an 8-path dial is
still too slow if it re-records every frame. **Architecture decides this, not ornament.**

### 4.2b The space the compass actually gets, measured

Inside a `snapPoints={['85%']}` sheet, after `Header`, `SHEET_BOTTOM_PADDING`, the `SPACING.xl` side
padding and the `SIZE.contentMaxWidth` cap of 500:

| Device | Screen pt | Sheet height | Usable width | Usable height | Largest square dial |
| --- | --- | --- | --- | --- | --- |
| OnePlus 3T | 360x640 | 544 | 312 | 366 | **312** |
| iPhone XS | 375x812 | 690 | 327 | 512 | 327 |
| iPhone 16 | 393x852 | 724 | 345 | 546 | 345 |
| Find X8 | 412x915 | 778 | 364 | 600 | 364 |

**The dial is width-bound on every phone**, and the floor device gives the smallest at 312pt, which is
still generous. Vertical room is left over everywhere (366pt spare even on the 3T), so a numeric heading
readout and a status line fit beneath the dial without a scroll. The dial should therefore size from
width, not from a fixed constant, exactly as session 15d's Android widget lesson required.

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

## 4-OWNER. THE SURFACE IS A BOTTOM SHEET, NOT A MODAL (owner ruling, 2026-09-28)

**This supersedes section 5 below and makes most of section 4a moot. It is the owner's ruling and it is
not re-litigated.**

🐋  "I want this to be a bottom sheet... in the settings button, I want an option underneath Change athan,
I want an option underneath that to compass or Qibla. I want it to be called Qibla, and it will be a
compass icon in the purple circular, you know, same exact button as Change athan, but instead of the music
icon it will be a compass icon, and then that will open a second bottom sheet. Same behaviour as the
others. Open a second bottom sheet, and that's where we will have the compass, and then you can close it by
dragging it down."

And the rule behind it, which is the durable part:

🐋  "We usually only display modals for information, but for like features and stuff like that, we show, we
use the bottom sheets."

**So: modals are for INFORMATION (Help, What's New, Update). Bottom sheets are for FEATURES (Sound, Alert,
Qibla).** The qibla is a feature, so it is a sheet. Record this as the app's standing convention, because
it decides where every future surface goes without asking.

### 4-OWNER.1 The exact shape, read from the code it must match

The owner named `Change athan` as the template, and that row is `components/sheets/screens/Settings.tsx:75`.
Its handler is the SECOND of the two patterns in that file, and it is the RIGHT one:

```ts
const handleAthanPress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  hideSettingsSheet();
  showSheet();
};
```

**Note there is NO `setTimeout` here.** The 150ms delay documented in section 4a.1 belongs to the MODAL
handlers (What's New, Help) and must NOT be copied: a sheet-to-sheet transition is handled by
`@gorhom/bottom-sheet` itself. Copying the modal delay into the qibla row would be a real defect, and it is
exactly the kind of thing a plan that skimmed one handler would get wrong.

The sheet it opens (`components/sheets/screens/Sound.tsx:163`) carries `stackBehavior='push'`, which is
what makes the second sheet stack over the settings sheet rather than replace it, and `snapPoints={['85%']}`.

### 4-OWNER.2 What the row costs, precisely

Five edits, all mirroring `Change athan`:

| Piece | Where | Note |
| --- | --- | --- |
| The row | `Settings.tsx`, in the Sound card or its own | `Pressable` + circular icon + label `Qibla` + `›` chevron |
| The icon glyph | `assets/icons/svg/compass.svg` | **Does not exist yet.** 16 SVGs are there; no compass |
| The icon id | `shared/types.ts`, `Icon` enum | `COMPASS = 'COMPASS'`, 13 members today |
| The icon registration | `assets/icons/svg/index.ts` | one import, one `ICONS` entry |
| The sheet | `components/sheets/screens/Qibla.tsx` | new, `stackBehavior='push'` |
| Its ref atom | `stores/ui.ts` | `qiblaSheetModalAtom` + `showQiblaSheet` + setter, mirroring `bottomSheetModalAtom` |
| The mount | `app/_layout.tsx` | beside the other sheets |

The circular purple button the owner described is `styles.musicButton` / `styles.infoButton`: a 20x20 circle
at `borderRadius: 10`, `backgroundColor: COLORS.interactive.active` (`#5015b5`) with a
`COLORS.interactive.activeBorder` (`#672bcf`) hairline, holding a `size={9}` glyph. The qibla row reuses it
exactly, so nothing new is designed for the row itself.

### 4-OWNER.2a THE LIFECYCLE TRAP: a sheet is ALWAYS MOUNTED, so the sensor must not follow the mount

`app/_layout.tsx:86` mounts all three sheets together under `chromeDeferred`, and they stay mounted for the
whole life of the app:

```tsx
{chromeDeferred && (
  <>
    <BottomSheetSound />
    <BottomSheetSettings />
    <BottomSheetAlert />
  </>
)}
```

A `BottomSheetModal` is present-on-demand, not mount-on-demand. **So a qibla sheet mounted this way exists
from launch, and any `useEffect` in it that subscribes to the magnetometer would run at launch and keep
running forever, on every device, for a screen the user may never open.** That is precisely Performance
Design Rule 7 ("gate invisible work"), and the RamadanDecorations precedent in `ai/AGENTS.md` measured the
cost of getting it wrong at 93% main-thread CPU while rendering nothing.

**The subscription must therefore be keyed on PRESENTATION, not on mount.** `Sheet.tsx` already exposes the
exact signal: `handleChange` sets `presented` on `index !== -1`, and `onFirstPresent` fires once on the
first open. The sound sheet uses the same machinery for its own warming (`soundListReadyAtom`), so the
pattern to copy already exists in the file.

Three things follow for the plan:

1. The sensor subscription starts when the sheet is presented and **stops when it is dismissed**, verified
   by a test that asserts the unsubscribe ran.
2. The heavy compass subtree may warm invisibly the way the sound list does, but it must tick nothing while
   closed.
3. The 60fps animation must not run while the sheet is shut. A shared value that is not being written costs
   nothing, but a `withRepeat` or a frame callback would.

### 4-OWNER.2b Two behaviours the sheet gives for free, which the plan must not rebuild

- **Drag-down to close** is `enablePanDownToClose` on the shared `Sheet`, already set. The owner's "you can
  close it by dragging it down" needs no work.
- **Android back closes the sheet**, via `Sheet.tsx`'s own `BackHandler` subscription keyed on `presented`.
  Session 35 established the rule that back closes every open surface; the shared component already honours
  it.
- **One unified close haptic** fires on every close path (swipe, backdrop, back, programmatic), so the
  qibla sheet must not add its own.

### 4-OWNER.3 The palette question is SETTLED by this ruling

Section 4a found that modals are white and worried the compass would have to be designed for a white card.
**A sheet is not a modal, and the sheets are DARK**: `Sheet.tsx` renders on `COLORS.surface.sheet`
(`#0b183a`) with a `COLORS.surface.sheetBorder` (`#0f1d46`) edge.

So the compass IS drawn on the app's dark ground after all, the UX agent's dark-theme brief was correct as
issued, and section 4a's alternative (a full-bleed dark screen) is withdrawn: the owner has chosen the
surface and it is already dark. **Section 4a is kept only for its five-touchpoint wiring map and the
modal/feature distinction it helped uncover.**

## 4a. Superseded: the modal palette finding (kept for its wiring map)

**This contradicts the brief given to the UX research agent, and the correction is recorded rather than
quietly applied.** That brief described the app's palette as a deep indigo/purple gradient with white text
and asked for a dark-theme compass. That is the palette of the app's SCREENS. It is not the palette of its
MODALS.

Measured: `components/modals/` uses `COLORS.light` **19 times** and the dark gradient **zero** times.
`Modal.tsx` hardcodes `backgroundColor: COLORS.light.background`, which is `#ffffff`, with
`COLORS.light.text` at `#1a1a1a`. Help, What's New, Update and the colour picker all render as a white card
over a dimmed backdrop.

So if the qibla opens as a modal (section 5), **the compass is drawn on white, not on the indigo gradient**,
and a dial designed for a dark background would be illegible in it. Three consequences:

1. Any dark-theme compass concept the UX agent returns must be re-read against a white card before it is
   adopted. Its findings on layout, metaphor, alignment feedback and accessibility transfer regardless of
   palette; its colour recommendations do not.
2. The app's own accent colours still apply, because they are palette-independent: the indigo family
   (`COLORS.interactive.active` `#5015b5`, `COLORS.icon.primary` `rgba(165, 180, 252, 1)`) reads correctly
   on both grounds, which is presumably why `Help.tsx` already defines its own `INK`, `BODY` and
   `ACCENT_TINT` constants locally rather than pulling screen colours.
3. **An alternative worth putting to the owner:** the qibla is the one surface where a full-bleed dark
   screen would suit the subject, and a modal is not the only option. A dark full-screen presentation would
   match the app's screens and make a glowing dial possible, at the cost of departing from the Help
   precedent. This is a visual decision, and section 2.2 of the plan will carry it to the owner rather than
   take it.

### 4a.1 The wiring is a five-touchpoint pattern, already proven by Help

Help was added by session 29 and its wiring is the template, measured this session:

| Touchpoint | File | What it is |
| --- | --- | --- |
| The visibility atom | `stores/ui.ts:85` | `popupHelpEnabledAtom`, ephemeral, not persisted |
| Its setter | `stores/ui.ts:194` | `setPopupHelpEnabled` |
| The Settings row | `components/sheets/screens/Settings.tsx:150` | a `Pressable` with icon, label and a `›` chevron |
| The open handler | `components/sheets/screens/Settings.tsx:53` | haptic, dismiss the sheet, then open |
| The mount | `app/index.tsx:228` | rendered under `chromeDeferred`, with an `onClose` |

**The trap inside that handler, which the plan must repeat verbatim:**

```ts
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
hideSettingsSheet();
setTimeout(() => setPopupHelpEnabled(true), 150);
```

The `150`ms delay exists because the sheet's dismissal animation and the modal's entrance would otherwise
run together and fight. A qibla row that opens without it will look wrong in exactly the way Help would
have.

`chromeDeferred` matters too: the modal mounts only past the first content frame, which is Performance
Design Rule 4's warm-but-idle-cheap pattern. **A sensor subscription must not arm at mount**, or the app
pays for the magnetometer from launch for a screen nobody opened.

## 5. Where it goes, and how it is reached

`app/Navigation.tsx` is a two-page `PagerView` (Standard, Extras) with two page dots and the settings
button beneath. Adding a third page would change the app's primary navigation, re-pitch the dots, and put
a location permission in the swipe path of every user. **Rejected.**

The Settings sheet (`components/sheets/screens/Settings.tsx`) already has titled cards and rows. **The
qibla opens from a Settings row, which the owner has now ruled opens a SECOND BOTTOM SHEET rather than a
modal (section 4-OWNER), exactly as `Change athan` opens the Sound sheet.** That keeps the permission
behind a deliberate tap, which is also what makes it defensible at App Store review under Guideline 5.1.1
(purpose strings must describe use; unused or unexplained permissions are the most common rejection).

The paragraph above originally named the Help modal as the precedent; the owner corrected it to the Sound
sheet, on the rule that modals inform and sheets carry features.

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
| 1 | Jurisprudence: fatwa councils on great circle vs rhumb line, required precision, ruling if a prayer faced wrong | **COMPLETE** (attempt 3; reports in `agent-reports/`) |
| 2 | Shipped-app engineering failures: bug reports, GitHub issues, app-store complaints, recurring traps | **COMPLETE** (attempt 3; reports in `agent-reports/`) |
| 3 | Sensor and platform engineering: Android/iOS heading APIs, declination, untrustworthy-reading detection, 60fps rotation | **COMPLETE** (attempt 3; reports in `agent-reports/`) |
| 4 | Professional practice: how mosque surveyors work, mosque-misalignment studies, why professionals distrust magnetic compasses | **COMPLETE** (attempt 3; reports in `agent-reports/`) |
| 5 | UX, visual design and accessibility: existing qibla screens, honest uncertainty wording, Islamic geometric motifs | **COMPLETE** (attempt 3; reports in `agent-reports/`) |

**ALL FIVE COMPLETED on attempt 3**, once the owner raised the ceiling and restarted the gateway. Every prior failure was the gateway returning
`Chat admission capacity is temporarily unavailable`, never an agent error, so no brief needs rewriting.

### 8.3 The retry policy, which survives the pause

Owner's rule, 2026-09-28: an agent that fails is redeployed on the same brief; if it fails a second time it
is redeployed once more; **if it fails a third time the session takes that brief over itself.** The counts
above are per-brief and carry forward.

### 8.3a An infrastructure failure is NOT one of a brief's attempts

Every failure so far has been the transport: `Chat admission capacity is temporarily unavailable`, and once
`ECONNRESET` while the owner was deliberately restarting the gateway. **Not one agent has failed at its
research.** Counting those against the three-strike rule would hand five briefs to this session because a
socket closed, which inverts the rule's purpose: it exists to stop a session waiting on an agent that
cannot do the work, not to punish a brief for a restart the owner performed on purpose.

**The reading applied here: a failure whose cause is the gateway does not consume a brief's attempts, and
the brief is re-dispatched once the gateway is up.** A failure where the agent returns but its work is
wrong, empty or off-brief DOES consume one.

**OWNER RULING, 2026-09-28, confirming that reading and raising the ceiling:** 🐋  "that is just an LLM
gateway error on omniroute, which is an LLM gateway. It's not the actual agent itself failing... So maybe
we should be a little bit more lenient. If an agent fails, don't take over, just let them fail and try
again, fail and try again, fail and try again. A maximum of 20 times, I guess, if they hit the limit 20
times, then we can stop them and take over their work."

So the policy for this session, superseding the three-strike rule of earlier today:

| Failure kind | What happens |
| --- | --- |
| Gateway or transport (`admission capacity`, `ECONNRESET`) | Re-dispatch the same brief. **Up to 20 attempts.** Never take over. |
| The agent returns wrong, empty or off-brief work | Counts as a real attempt; the session may take the brief over. |
| 20 gateway failures on one brief | Stop that brief and the session researches it itself. |

The earlier three-strike wording is dead for this session. No brief has come close to 20.

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

## 9. Agent report 5 (UX, design, accessibility): what it changes

Full report at `agent-reports/05-ux-design.md`. It is the strongest of the five briefs so far and it
changes four things. Read this section as the planner's ruling on it, not as a summary.

### 9.1 IT CONTRADICTS THIS SESSION'S OWN PLAN, and the agent is right

Section 4.3 of this file established that every rotation must go through a shortest-arc form,
`((to - from + 180) mod 360) - 180`. **That is correct for a single step and INSUFFICIENT for an
animation**, and the agent found the evidence this session did not: Reanimated discussion #4353, where the
library's own maintainer confirms there is no built-in solution.

The distinction matters and the plan must carry it:

- **Shortest-arc delta** answers "which way is nearer". It is what a filter needs.
- **Unwrapping** answers "what continuous number do I hand the animation". Without it `withTiming` still
  interpolates between two WRAPPED values and spins the long way.

So the shared value driving the transform holds an **unwrapped, monotonic-ish angle that may exceed 360 or
fall below 0**, accumulated by adding ±360 on each wrap. The displayed bearing stays wrapped; only the
animated one accumulates. This session's section 4.3 is amended accordingly rather than deleted, because
its measurement of the naive failure is still what proves the problem.

### 9.2 A BOOBY TRAP inside the very solution the report recommends

The accepted answer in #4353 carries a correct one-liner AND a WRONG "equivalent" in its own comment:

```ts
if (Math.abs(diff) > 180) delta += Math.sign(diff) * -360;   // correct
/* Equivalent to:
if (diff > 180) delta -= 360;
else if (diff < 180) delta += 360;   // WRONG: should be diff < -180
*/
```

Measured this session across 10 transitions: **the two disagree on 6 of them.** The commented form fires
`else if (diff < 180)` for every ordinary small step, adding 360 on a 5° turn. A developer who copies the
comment rather than the code ships a compass that spins constantly.

**The plan therefore writes the guard out verbatim and its break script mutates `-180` to `180`**, because
that is the exact mutation that reproduces the community's own bug. This is the kind of trap the owner's
"no vagueness" rule exists for.

### 9.3 Findings adopted into the design

| Finding | Source | Ruling |
| --- | --- | --- |
| Alignment window **±5°** with green, haptic and a text change | Garmin's stated spec [V]; JUTeC cites a Malaysian fatwa tolerance of ~10.8°, so ±5° sits comfortably inside | **Adopt.** Three channels, which is also what WCAG 1.4.1 requires |
| Snap the STATE, never the needle | No surveyed app snaps the needle; it always jitters 1 to 3° | **Adopt** |
| A "Turn right 28°" instruction beside the dial | Resolves a documented, reproducible user misunderstanding of which thing rotates | **Adopt.** It is also the WCAG 1.3.3 text equivalent, so it pays twice |
| Keep the exact bearing visible when the sensor is untrustworthy | lghou's exact/estimate split | **Adopt.** Degrade, never disappear |
| Dynamic-alpha smoothing: heavy when still, responsive when turning | NorthPin | **Adopt** |
| ~200ms ease, critically damped, no overshoot | Reanimated #4353 recipe; wobble reads as sensor failure | **Adopt** |
| Field-strength sanity check (Earth is 25 to 65 µT) | NorthPin | **Note only.** `expo-location` does not expose raw µT; it would need `expo-sensors` as a second dependency. Costed, not adopted, and put to the owner |
| Khatam (8-point star) tick geometry | 8-fold symmetry is native to 45° divisions | **Recommend to the owner.** Visual decisions are the owner's |
| Kaaba icon: black cube with the gold hizam band | Universal convention; the band is the identifying feature | **Adopt for the glyph** |
| Distance to Makkah | Near-universal | **Recommend.** Cheap, and it earns the screen meaning |
| Uncertainty as an arc width, Google Maps' beam | `headingAccuracy` maps to it directly | **Recommend to the owner** |

### 9.4 What it CONFIRMS independently

- The permission-free compass is not a thing anyone ships. Every surveyed app has a position.
- `headingAccuracy` is the right uncertainty signal, which matches section 2.7's reading of the two
  platforms' differing scales.
- The near-Kaaba case is real and users hit it: the Pillars team's public reply says GPS "would quite
  literally have to be accurate to <5m" there. **That independently confirms section 1.7's measurement**
  that a 50 km error at Jeddah swings the bearing 49°, arrived at from geometry rather than from support
  threads.

### 9.5 One thing to weigh against the app's own rules

The report recommends copy such as "This is a technical Qibla estimate, not an official religious ruling."
That is honest and this session endorses the spirit. **But `ai/AGENTS.md` records that the app is never
named in user copy** (owner, session 29), and any wording that edges toward a religious claim is the
owner's to approve. The plan will carry proposed copy to the owner rather than ship it.

## 10. Agent report 4 (professional practice): the finding that reframes the feature

Full report at `agent-reports/04-professional-practice.md`.

### 10.1 THE DECISIVE MEASUREMENT

**JAKIM, Malaysia's official Islamic authority, tested phone qibla apps and measured errors "between 3° and
45° depending on the app and the phone", ruling that app results "only count as an estimate (anggaran)".**

Set that against the religious tolerances the same brief documented:

| Authority | Tolerance |
| --- | --- |
| Malaysia (National Fatwa Committee) | **3°** |
| Indonesian practitioner norm | ~2° |
| Pahang, old mosques | 23° |
| Egypt Dar al-Ifta / Perlis / IslamQA | **45°** |

**The phone's error band (3 to 45°) spans every tolerance in the table, from the strictest to the most
lenient.** So a phone compass cannot guarantee even the loosest religious tolerance.

Meanwhile our COMPUTED bearing is accurate to 0.05° and our coarse position costs another 0.05°. **The
number beats the strictest tolerance by about sixty times; the needle cannot reliably meet the loosest.**

### 10.2 What follows, and it is the feature's governing principle

> **The computed bearing is professional-grade. The needle is not. The number must therefore always be on
> screen, and the needle must never be the only answer the app gives.**

This is independently what the honest practitioners do. The Turkish site namazvakti.com publishes three
values per city: true-north qibla angle, magnetic declination, and the derived compass angle. The US land
surveyor who oriented a Tennessee mosque computed the true bearing and applied declination by hand rather
than trusting a qibla compass, noting that sources advise "it is not advisable to determine qibla using a
compass".

### 10.3 Adopted

| Finding | Ruling |
| --- | --- |
| Show the computed bearing as a first-class number, never only a needle | **Adopt.** Governing principle above |
| Never tell a user their prayers were invalid | **Adopt as a copy rule.** Every authority separates measurement from validity: MUI ruled "realign the rows, don't demolish", Pahang that past prayers are never repeated, Dar al-Ifta that a 13° mosque need not change |
| Never claim "100% accurate" | **Adopt as a copy rule.** Contradicted by every published measurement |
| Teach the sun check | **Recommend to the owner as a follow-up**, not this session. It is the one method that beats the sensor, and Kemenag's national campaign is built on it |
| The 0.4° "ihtiyat al-qiblah" tolerance in the IKN study | **Note only.** It is one jurisdiction's operational figure, far below what any phone delivers |

### 10.4 What it independently CONFIRMS

- Earthquakes do not move the qibla (LAPAN/BHR, explicitly), so nothing about our bearing needs to age.
- Great circle is right: Malaysia's official 291 to 293° band, Google's method, and the geodesy literature
  all use it. The rhumb line remains a documented minority.
- Al-Khalili's 14th-century table of 4,000 entries was accurate to **1 to 2 arc-minutes**, which is a
  useful humility check: the mathematics was solved 660 years ago and our contribution is honesty about
  sensors, not arithmetic.

## 11. Agent report 2 (engineering war stories): the trap that would have shipped

Full report at `agent-reports/02-engineering-traps.md`.

### 11.1 TILT, which no other source raised and which London makes worse

Measured (ASYU 2023): **"The Qibla error without tilt compensation can reach up to 100 degrees for 30
degrees pitch."** And the sensitivity is dip-dependent: at magnetic dip 5° near the magnetic equator, 1° of
tilt error costs 0.09° of heading; at dip 80° it costs **up to 6°**.

**London's magnetic dip is about 66°.** Interpolating between those published points puts 1° of tilt error
at roughly **5° of heading error here.** So "hold the phone flat" is an instruction, not a footnote, and it
matters more in the UK than almost anywhere the feature was tested by others.

`expo-location`'s Android path uses `getRotationMatrix`, which IS tilt-compensated for the matrix itself,
so this is about the user's posture rather than a library defect. iOS Core Location compensates internally.

### 11.2 The MagSafe asymmetry, which decides the copy

**Figure-8 calibration only fixes fields that move WITH the device.** Apple's own wording: calibration "is
able to filter out only those magnetic fields that move with the device"; for external sources "the user
must either move the device away from the source or move the source in conjunction with the device."

A MagSafe array measures **68.8 mT at the phone's back**, against Earth's **0.05 mT**: three orders of
magnitude. **So a permanently attached magnetic case cannot be calibrated away, and the only honest advice
is "take the case off".** An app that tells such a user to wave a figure-8 is wasting their time.

### 11.3 Adopted

| Finding | Ruling |
| --- | --- |
| "A confident wrong arrow is worse than a 'move away from interference' prompt" | **Adopt as the governing UX principle**, and it agrees exactly with section 10.2 |
| Hold the phone flat, prominently | **Adopt.** Section 11.1 makes it a UK-critical instruction |
| Magnetic case advice must be "remove it", not "calibrate" | **Adopt** |
| Field-strength sanity check (25 to 65 µT) | **Now upgraded from "note only" to RECOMMENDED**, because two independent briefs reached it and Android exposes the expectation directly via `GeomagneticField.getFieldStrength()`. Still costs `expo-sensors` as a second dependency, so it goes to the owner |
| Great-circle education copy | **Adopt as a copy requirement.** Muslim Pro carries it in writing precisely because North American users report the correct answer as a bug |
| Never render raw `atan2(mag.y, mag.x)` as a heading | **Adopt.** We do not: `expo-location` fuses |
| The iOS Simulator has no magnetometer | **Adopt into the plan's device proof.** It will hang a naive dev loop, and this session's own device testing must account for it |

### 11.4 The reassurance, which is worth as much as the warnings

The agent searched specifically for formula bugs and **found none**: "A public post-mortem where a named
qibla app fixed a formula bug... Math bugs are conspicuously absent, consistent with the math being settled
and libraries being copies of one formula." It also found **no Southern-Hemisphere-specific bug**, because
"the formula is symmetric", which independently supports this session's own global sweep in section 1.7a.

**Every catastrophic failure in the field is a SENSOR or a GPS failure. Not one is arithmetic.** That is
the strongest possible argument for spending this session's remaining effort on trust signalling rather
than on the bearing.

## 12. Agent report 1 (jurisprudence): what may and may not be said

Full report at `agent-reports/01-jurisprudence.md`.

### 12.1 The great circle is confirmed, and the dispute is real but minority

Al-Azhar's 1998 fatwa endorsed the great circle. The southeast position is held by essentially one
organised body (AICP / Al-Ahbash) plus one Quranist sect. Twelve centuries of Muslim astronomers used the
great circle. **Section 1.5's decision stands, now on far better evidence than "most apps do it".**

Two details worth keeping:

- **The Islamic Center of Washington DC has faced 56°33′15″ since 1953**, calculated by the Egyptian
  Ministry of Works and checked by a National Geographic cartographer. The north-easterly answer is older
  than the controversy about it.
- Abdali's geometric refutation is decisive and worth recording: **rhumb lines between two points are not
  unique**, so "the constant-bearing route" is not even a well-defined single answer.

### 12.2 The tolerance question is ANSWERED, and it reframes the ±5° alignment window

The agent verified the 45° figure to an official state muftiate: **Egypt's Dar al-Ifta, Fatwa 6453: "Scholars
determined this to be 90 degrees i.e. 45 degrees from each direction."** Hanafi fatwa literature says
deviation beyond 45° invalidates the prayer. Sistani gives no number, only "not a lot". The Shafi'i school
is the strict outlier.

**So agent 5's proposed ±5° alignment window is comfortably inside every documented tolerance except the
Shafi'i ideal, which is unattainable by any instrument.** It is a UI affordance, not a religious claim, and
that is exactly how the copy must treat it.

### 12.3 THE COPY RULE THIS SETTLES

The jurisprudence is unambiguous that **diligence, not outcome, decides validity.** Ibn al-'Uthaymeen: "if
he put effort into working it out... he does not have to repeat the prayer at all, **whether he got it
right or not**."

**Therefore the app must never imply a prayer was invalid, and never imply a past prayer must be repeated.**
That is now backed by fatwa rather than by taste, and it aligns with agent 4's independent finding from
MUI, Pahang and Dar al-Ifta.

**One finding cuts the other way and must be handled carefully.** IslamQA 483121 (2024) names the
**cell-phone compass** as "the most readily available" method and treats IGNORING it as negligence
requiring repetition. So a user may reasonably believe our number carries religious weight. **That raises
the bar on honesty rather than lowering it**, and it is the strongest argument for section 10.2's rule.

### 12.4 The antipode, now with a ruling

At the antipode every direction reaches the Kaaba along an equal 10,008 km great circle, **so any facing is
correct.** No formal fatwa was located, but it follows from jihat. The agent's engineering note matches
this session's measurement in section 1.7a: **display large uncertainty near the antipode** rather than a
confident arrow.

### 12.5 Deferred with better information

The sun method's dates are **not stable constants**: sources disagree on 12 vs 13 vs 14 January and 28 vs
29 November, and the classical sources specified **solar longitude rather than a calendar date** because
the Islamic calendar is lunar. **If the sun check is ever built, it must compute the instant per year and
never hardcode the dates**, which is a stronger statement than section 1.8 made.

## 13. Agent report 3 (sensor engineering): a CONTRADICTION this session must resolve

Full report at `agent-reports/03-sensor-engineering.md`.

### 13.1 The contradiction, stated plainly

**The agent recommends** the Fused Orientation Provider on Android and `CLLocationManager` on iOS, and
states there is "no rotation-vector/FOP/CLHeading equivalent in Expo's sensor suite", so a native module is
needed.

**This session read `expo-location@58.0.8`'s actual source** (section 2), and the agent is **half right**:

| Claim | Verdict |
| --- | --- |
| No CLHeading equivalent in Expo | **WRONG.** `expo-location`'s iOS path IS `CLLocationManager` heading (`DeviceHeadingStreamer`), verified in `LocationModule.swift` |
| No rotation-vector or FOP path on Android | **RIGHT.** Verified: `LocationModule.kt:636` registers `TYPE_MAGNETIC_FIELD` and `TYPE_ACCELEROMETER` and fuses with `getRotationMatrix`. No rotation vector, no FOP |
| `expo-sensors` gives raw µT with no fusion | Right, but irrelevant: we would use `expo-location`, not `expo-sensors` |

The agent evidently reasoned about `expo-sensors` and generalised to Expo as a whole. **Its Android
conclusion survives that error, and its Android conclusion is the one that matters**, because agent 2
independently found that the Android sensor layer is the number one source of wrong-direction reports in
shipped apps.

### 13.2 THE DECISION THIS FORCES, and it is the owner's

| | Option A: `expo-location` as shipped | Option B: a native module for Android |
| --- | --- | --- |
| iOS quality | Core Location, best available | identical |
| Android quality | raw mag + accel, no gyro fusion, no rotation vector | FOP: gyro-fused, declination built in, explicit error cone |
| Android accuracy signal | `SENSOR_STATUS_*` only, a coarse 0 to 3 band | `getHeadingErrorDegrees()` in real degrees |
| Cost | zero, one `expo install` | a new local Expo module, second only to `modules/tls13` |
| Risk on the 3T | none new | needs GMS, needs a gyroscope, needs proving on Android 9 |
| Known upstream bug | the negative `trueHeading` of section 2.1 | avoided entirely, FOP applies declination itself |

**This is a genuine engineering trade with no obviously right answer, so it goes to the owner in the plan's
section 2 rather than being taken here.** The planner's recommendation is **Option A for this session**,
because it ships the feature, and the honest-number architecture of section 10.2 means the app never stakes
its answer on the needle alone. Option B becomes a follow-up row if the 3T proof shows the Android needle
is unusable.

### 13.3 Adopted outright

| Finding | Ruling |
| --- | --- |
| **Filter the wrapped delta, never the raw angle**, and keep the ANIMATED value unbounded | **Adopt.** Third independent confirmation, after section 4.3 and agent 5 |
| α ≈ 0.15, or 0.1 to 0.3 at 50 Hz for a 100 to 300 ms settle | **Adopt as the starting value** |
| One-Euro filter as the adaptive upgrade | **Note.** Try only if a fixed α feels wrong |
| **No Kalman needed**: the platform already fuses | **Adopt.** Removes a whole class of work |
| Animate `transform` on a plain View; never per-frame SVG attributes | **Adopt.** This is the FOURTH independent source for section 4.2's architecture, and the strongest: react-native-svg's own maintainers say "everything gets redrawn, and there's no caching involved" |
| Enable `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` and the iOS equivalent | **Investigate in the plan.** They are Reanimated feature flags and this app is on 4.7.0 |
| **Measure in release builds only** | **Adopt.** Already this repo's rule (Performance Design Rule 8) |
| Field-strength check via `GeomagneticField.getFieldStrength()` | Reinforces section 11.3 |
| London declination is **+1.2°** | **Confirms section 1.7d** independently, from NOAA live |
| Boston −13.9°, Seattle +14.9°, Tokyo −7.9° | **Adopt into the declination test fixtures** as the synthetic cases section 1.7d requires |
| iOS `headingOrientation` unset means heading is referenced to the portrait top edge | **Adopt.** `expo-location` does NOT set it (verified: zero matches in its Swift source), so **the qibla sheet must be portrait-only or the heading will be 90° out in landscape** |

### 13.4 The most useful single number in the report

**Indoor heading RMSE is about 17.4° even with a purpose-built EKF anomaly-rejection algorithm** (Ettlinger
& Weiss, *NAVIGATION*, 2024), and that was state of the art beating prior work by 40%. Naive indoor
readings are worse.

**Most prayer happens indoors.** So the realistic error for our actual use case is ~17°, which is four
times agent 5's proposed ±5° alignment window, and inside only the lenient 45° tolerance. This is the
single strongest justification for the honest-number architecture, and it should be quoted in the plan.

# ROUND 2

The owner asked for a second research wave rather than a repeat of the first. Five briefs were dispatched
on the questions round 1 OPENED, not on its topics. Three have returned; two are running.

## 14. R2 agent 1 (visual design): the dial is now specified, not sketched

Full report at `agent-reports/R2-01-visual-design.md`.

### 14.1 The tick spec, verified against our own measurements

The agent derived 72 minor ticks from arc spacing. **Checked independently this session against the real
dial sizes from section 4.2b:**

| Device | Dial | Circumference | 72 ticks | 120 ticks |
| --- | --- | --- | --- | --- |
| OnePlus 3T | 312pt | 980pt | **13.6pt** | 8.2pt |
| Find X8 | 364pt | 1144pt | 15.9pt | 9.5pt |

Its arithmetic is exact, and **72 is also precisely 360/5**, so the 5° minor interval and the comfortable
spacing are the same choice. Adopted with the rest of the spec: **12 labelled majors at 30° in two digits,
N/E/S/W replacing 0/90/180/270, tick length ratio 1 : 1.6 : 2.2, cardinals rotating with the dial.**

This comes from **Garmin's published HSI specification**, not from taste, which is worth more than any
design opinion the session could have formed.

### 14.2 It re-confirms the architecture from the other direction

88 paths (72 + 12 + 4) costed against section 4.2a's measured 1.33 to 1.87 ms per path:
**117 to 165 ms per frame IF the tree re-recorded**, which is 7 to 10 times over a 60fps budget.

**So the tick count the design wants is only affordable under the transform-only architecture, and is free
under it.** Design and performance agree, which is the outcome section 4.2a predicted.

### 14.3 The single most useful find: a complete anti-flicker spec

**GeoQibla**, an open-source Kotlin Multiplatform qibla library, publishes its `QiblaConfig` defaults:
near = 10°, **aligned = within 3° held for 750 ms**, with a state priority that makes aligned sticky over
near.

And a **shipping app's changelog** carries the bug that spec prevents, verbatim: *"the alignment tap no
longer repeats at the edge of alignment."*

**Adopted, merged with our ±5° window:** near ±10°, **aligned ±5° sustained 750 ms**, exit only beyond
**±7°**, no re-animation while held. That is a 2° hysteresis band, and it is the difference between a
feature that feels solid and one that buzzes at the boundary.

### 14.4 Three findings that change specific decisions

| Finding | Effect |
| --- | --- |
| **Apple reserves green EXCLUSIVELY for success** across Compass and Level | **Green may not appear anywhere else on the sheet.** A palette rule, not a preference |
| A black Kaaba cube **disappears** on `#0b183a` | The glyph is **front elevation, ~34pt, dark fill with a lilac stroke, and the gold band carries the identity**. Halo only when aligned |
| The khatam is **two squares, one rotated 45°** | Trivially cheap as a static asset, and its 8 points land exactly on N/NE/E/SE/S/SW/W/NW. Ornament at 4 to 8% opacity, in ONE place only |

### 14.5 What goes to the owner

Every visual choice above is a recommendation, not a decision. Visuals are the owner's alone
(`ai/AGENTS.md`), and session 29's Help design is the precedent: 25 candidates were built and the owner
chose. The plan will carry the dial spec as a proposal.

## 15. R2 agent 2 (honest copy): the most directly shippable report of the seven

Full report at `agent-reports/R2-02-honest-copy.md`.

### 15.1 It supplies the copy this feature could not have written safely

Two examples that no amount of internal drafting would have produced:

- **Apple Compass ships exactly ONE uncertainty string**, and it is the model: *"Hold the device flat for
  accurate bearing."* A condition and an instruction, no apology. **We should near-quote it, deliberately,
  because Apple has already trained every iPhone user on that sentence.**
- **Muslim App's developer reply** to a one-star review from a user standing in front of the Kaaba is
  exactly our governing principle in one sentence: *"the direction may appear incorrect **even though our
  Qibla calculation is accurate**."*

### 15.2 The permission evidence is quantitative

Asking at the moment of use, with a primer and a proper purpose string, moved one app from **45% to 93%**
opt-in. A purpose string at all moves opt-in from **62.8% to 73.6%**. **This validates the decision to ask
on the sheet rather than at launch**, and it is now backed by numbers rather than by instinct.

**Apple's 5.1.1 test, from a real rejection sequence: the string needs a specific EXAMPLE of what the user
sees, not a category of benefit.**

### 15.3 FOUR ITEMS ARE FLAGGED AS RELIGIOUS CLAIMS, NOT PRODUCT DECISIONS

**This is the most valuable thing in the report and the plan must carry it verbatim.**

1. **"Facing qibla" as the aligned label.** Describes geometry, but the word in an asserted state is worth
   a check.
2. **Any sentence asserting scholarly consensus**, such as "scholars agree that sincere effort is what
   counts". It is well supported by IslamQA 42574 and 148900, **but it is still the app stating fiqh.**
3. **The near-Kaaba screen in any wording.**
4. **Any mention of tolerance ranges.** The ranges exist and differ by authority (Malaysia 3°, Egypt 45°),
   **so quoting one is a de facto ruling.** The agent's recommendation, which this session adopts:
   **do not surface tolerance ranges in the UI at all.**

**The test the agent proposes for every line is the best single sentence in all seven reports: "can a
sensor engineer and a mufti both sign it?"**

### 15.4 Copy that is now banned, with evidence

"Exact", "precise" or "always accurate" describing the direction shown, because JAKIM and Mufti Selangor
both measured 3 to 45° of app error. "Ensures your prayers are aligned", because it promises a religious
outcome. **"Your prayer is valid" in any form.** And no exclamation marks anywhere near a religious term.

**The app is never named**, which is already this repo's rule and already pinned by
`shared/__tests__/help.test.ts:88`. The qibla copy inherits that test's pattern.

## 16. R2 agent 3 (expo-location field reality): THE DECISION IS RESOLVED

Full report at `agent-reports/R2-03-expo-location-field.md`. **This settles section 13.2's open question.**

### 16.1 The verdict: Option A, expo-location, with three defences

**The evidence, not a preference:**

- **Seven real heading bug reports in expo/expo's ENTIRE history**, none since September 2022, none open,
  **zero heading issues among current SDK 58 issues.** iOS is consistently reported fine.
- Both lifecycle risks this session worried about are **already fixed in the version we are on**: the iOS
  streamer emitting after unsubscribe (PR #35004) and **an Android watch leak fixed in 58.0.0 itself**
  (PR #48294).
- `watchHeadingAsync` gained an **`errorHandler` second argument**, verified present in the installed
  source.

**Against that, all three source defects are confirmed real in the field**, and all three are cheap to
defend in JS. So Option A ships, and Option B (a native module) is explicitly **held as the fallback if the
3T proof shows the tilt bug hurting real use**, not adopted preemptively.

### 16.2 The negative-heading bug has a four-year history, and we are not the first

- **Issue #19071** (2022) reported it with logs.
- **PR #19629** claimed to fix it, stating in its own body that it fixes "trueHeading reports a negative
  value right before rolling back to zero".
- **It only clamped the top end**, because Kotlin's `%` keeps the dividend's sign.
- **Nobody has reported the remaining case in four years.**

**Two consequences for the plan.** The guard is mandatory: `((h % 360) + 360) % 360`, and the `-1` sentinel
must be tested with `=== -1` before normalising, never `< 0`. And **this session should file the upstream
issue**, because it is a one-line fix with a documented history and reporting it costs nothing.

### 16.3 The tilt bug is REPORTED AND NEVER FIXED

**Issue #16640** (2022): "heading values go totally out of order if the telephone is tilted". Stale-closed,
never fixed. That is the user-visible symptom of the missing `remapCoordinateSystem` this session found in
source, and it pairs with section 11.1's measurement that **1° of tilt costs about 5° of heading at
London's magnetic dip.**

**So "hold the phone flat" is not merely good advice: it is working around a known, open, unfixed library
defect.** The copy from section 15 covers it, and Apple's own string is the wording.

### 16.4 The escape hatch is closer than expected

The accepted Stack Overflow answer for this exact problem recommends `DeviceMotion` from **expo-sensors**,
and the agent verified that **`DeviceMotionModule.kt` on the sdk-58 branch is backed by
`TYPE_ROTATION_VECTOR`.**

**So the fused, tilt-compensated path is reachable with a package already in our dependency tree**, at the
cost of computing declination ourselves. `react-native-attitude` (TurboModule, RN >= 0.82, actively
maintained, adds `remapCoordinateSystem`) is the better-engineered version of the same idea, also
magnetic-referenced.

**Both are recorded as the fallback ladder. Neither is adopted now.**

### 16.5 The 3T question is answered, and two of our own notes were wrong

**OnePlus's official spec page confirms the 3T has a gyroscope, an electronic compass and an
accelerometer**, so every alternative path would work on it.

Two corrections to this session's own record: **the 3T is a Snapdragon 821, not 820** (this repo's pages
say 820 in several places), and **Google Play services supports Android 6.0 and up**, so an Android 9
device is comfortably supported.

## 17. R2 agent 4 (location strategy): the critical question is answered, and staleness dissolves

Full report at `agent-reports/R2-04-location-strategy.md`.

### 17.1 iOS reduced accuracy does NOT break trueHeading

**This question could have invalidated the entire coarse-location plan, and the answer is no.**

`trueHeading` needs *a* position only to look up the magnetic declination. Reduced accuracy gives a point
**within 1 to 20 km**, and declination varies by roughly 0.01 to 0.1° per km, **so the correction changes by
well under 2° even in the worst geomagnetic patches.** WWDC20 disabled only beacons and region monitoring
under reduced accuracy; heading was never restricted.

Android is safe for the same reason: `LocationModule.kt` builds its `GeomagneticField` from the last known
location and **explicitly accepts COARSE permission**.

### 17.2 One caveat that changes the implementation, verified in source

**`expo-location`'s iOS heading streamer calls only `startUpdatingHeading()`**, never
`startUpdatingLocation()`. This session verified it independently in the installed package:
`startUpdatingHeading` at `DeviceHeadingStreamer.swift:28`, and `startUpdatingLocation` **zero times**.

Apple's documentation says location updates should be enabled for a valid `trueHeading`. In practice iOS
uses its own estimate, but the mitigation is free and the plan takes it:

> **Call `getCurrentPositionAsync` BEFORE or alongside `watchHeadingAsync`. We need the position for the
> bearing anyway, and it guarantees location services are warm.**

### 17.3 THE STALENESS PROBLEM DISSOLVES

The owner's traveller objection (section 4-OWNER and the earlier correction) drove a search for cache
invalidation: timers, significant-location-change, timezone listeners. **The agent's answer removes the
problem instead of solving it:**

> **Do not cache authoritatively. Every sheet open re-fixes with `Balanced`, which takes 1 to 5 seconds
> behind an instantly-painted cached arrow. The cache is a paint-over and a refusal fallback, never the
> answer. A cached fix therefore cannot mislead a traveller, because it is never shown without a refresh
> already in flight.**

No timers, no background permission, no significant-location-change (which on iOS **would require Always
authorisation**, indefensible for this feature), and no Play background-location review. **This is
strictly simpler than what this session had planned, and strictly more correct.**

### 17.4 A 2026 store policy that argues for coarse-only

**Play's "Minimum Scope" location policy, announced 15 April 2026:** from **November 2026** every app
requesting `ACCESS_FINE_LOCATION` must file a Play Console declaration explaining "why
`ACCESS_COARSE_LOCATION` or LocationButton is not sufficient", **enforced 27 January 2027 for new AND
existing apps.**

**A coarse-only app is exempt.** Google's own list of coarse-appropriate uses reads like a description of
this feature.

**But `expo-location` always requests BOTH permissions**, so coarse-only needs a config plugin that strips
`ACCESS_FINE_LOCATION` from the merged manifest. **That is a real cost to weigh**, and it goes to the owner:
the privacy posture and the policy exemption against one more plugin in a project that already carries
`plugins/androidWidgetGrid.js` and `plugins/portraitOnlyIpad.js`.

**Detection is free either way:** `getForegroundPermissionsAsync()` returns `android.accuracy` of
`fine | coarse | none` and `ios.accuracy` of `full | reduced`, verified this session at
`LocationModule.kt:402-409`.

### 17.5 Store declaration: "Data Not Collected"

Both stores define collection as transmission off the device. **We compute the bearing locally and transmit
nothing, so the App Store declaration is "Data Not Collected" and Play's Data Safety form records no
collection**, with the caveat that no analytics or crash SDK may carry coordinates. This app has none on
that path.

### 17.6 The manual fallback is bundled, not networked

**`geocodeAsync` is not an option for the refusal path**: iOS CLGeocoder is network-based and rate-limited
to about one request per minute, and **on Android expo's own docs say geocoding requires location
permission already granted**, which defeats the entire purpose of a refusal fallback.

**The answer is a bundled list: GeoNames `cities15000`, about 1 MB trimmed to name, country, latitude and
longitude, CC BY 4.0 with an attribution line.** 25,000 rows is instant to search in JS with no database.

**This is the largest single addition the feature would make to the bundle, so it goes to the owner** with
the alternative of a much smaller curated list of major cities.

## 18. OWNER RULING: no permission, no compass. The fallback branch is CANCELLED

**Owner, 2026-09-28, closing the question this session had left open:**

🐋  "If the user says no, we just won't, yeah, we'll just deny them. We'll prevent them from clicking the
compass. They need to accept permissions before being able to click on the compass to show the bottom sheet
for the compass. That's just how it is."

### 18.1 What this deletes

| Cancelled | Why it existed |
| --- | --- |
| **The bundled city dataset**, ~1 MB of GeoNames `cities15000` | Section 17.6's answer for a refusing user |
| The city-search UI, its list, its matching | the same |
| `geocodeAsync` as any part of the design | already rejected as network-bound; now moot entirely |
| Every "enter a city instead" string in section 15's copy | the same |
| **R3 agent 3's entire brief** (refusal UX, timezone and locale proxies, SIM country, sun-position fix) | it was researching a branch that no longer exists |
| The CC BY 4.0 attribution line the dataset would have required | the same |

**The largest single addition the feature would have made to the bundle is gone, and so is its licence
obligation.**

### 18.2 What replaces it

The Qibla row in Settings is **gated**: the sheet does not open until foreground location permission is
granted. The row is present and visible, because hiding it would leave the user no way to change their
mind, but tapping it when permission is absent requests permission rather than opening the sheet.

Three states, and no fourth:

| Permission | The row does |
| --- | --- |
| `undetermined` | requests it, then opens the sheet on grant |
| `granted` | opens the sheet |
| `denied` | explains that the compass needs location, and offers the route to Settings |

The denied state still needs copy, and section 15's research still supplies it: name what is unavailable,
name the consequence, and give the exact route back (NN/g's documented pattern). **What it no longer needs
is an alternative path to a bearing.**

### 18.3 Why this is defensible rather than merely simpler

It is also the *honest* shape, and it matches the governing principle of section 10.2. A city-picked
position is a position the user asserted rather than one the device measured, and section 1.7's arithmetic
shows a wrong city is worth far more error than anything else in the chain: **200 km of position error is
9.7° of bearing**, which is larger than the entire great-circle-versus-ellipsoid debate and larger than any
filtering improvement. A feature whose stated principle is "the number is professional-grade" should not
quietly accept a number the user typed.

**Store review note:** gating a feature behind a permission is not a dark pattern when the permission is
genuinely required for the feature and the app still functions without it. Prayer times, notifications and
widgets are all untouched, so a refusing user loses exactly one screen and nothing else. Apple's Guideline
5.1.1 objection is to apps that refuse to work *at all* without an unnecessary permission, which is not
this.

### 18.4 What survives from the cancelled research

Section 17's location strategy is unaffected and still correct: `Balanced` accuracy, refreshed on every
sheet open, painted over a cached fix, never cached authoritatively. **The staleness finding of 17.3 is
untouched**, because it never depended on the fallback.

The two decisions still open for the owner shrink to one: **the coarse-only Android posture** (a config
plugin, in exchange for Play's Minimum Scope exemption). The dataset question is closed.

## 19. `adhan` is flagged by the owner as interesting, and it is more interesting than the qibla function alone

**Owner, 2026-09-28:** 🐋  "The adhan function, or package, which has the qibla, is an interesting one. Keep
this in mind, it's a very interesting one."

Recorded so a later session does not have to rediscover why. A dedicated R3 brief is running on it; these
are the facts this session has already verified for itself.

### 19.1 Its qibla function is algebraically ours

`adhan@4.4.6` exports `Qibla(coordinates)`, read from source via `opensrc`:

```ts
const makkah = new Coordinates(21.4225241, 39.8261818);
// Equation from "Spherical Trigonometry For the use of colleges and schools" page 50
const term1 = sin(makkahLon - lon);
const term2 = cos(lat) * tan(makkahLat);
const term3 = sin(lat) * cos(makkahLon - lon);
return unwindAngle(radiansToDegrees(atan2(term1, term2 - term3)));
```

Measured against this session's own implementation:

| Comparison | Max difference |
| --- | --- |
| 12 cities including Jeddah, Anchorage, Nuuk | **0.00214°** |
| A 2,555-point global sweep | **0.00056°** |

**The two are the same formula in a different algebraic arrangement.** The entire discrepancy is the Kaaba
coordinate in the 5th decimal, about 2 metres on the ground.

**So "build or adopt" cannot be decided on correctness: both are correct, and both are roughly four orders
of magnitude better than the sensor.** It must be decided on everything else.

### 19.2 The numbers that make it a serious candidate

Measured live from npm and bundlephobia this session:

| Metric | Value |
| --- | --- |
| Version | 4.4.6, published 2026-08-31 |
| **Weekly downloads** | **48,154** |
| **Minified** | **13.2 KB** |
| **Minified + gzipped** | **4.6 KB** |
| **Runtime dependencies** | **zero** |
| Licence | MIT |
| First published | 2016 |

**4.6 KB gzipped with no dependencies** is small enough that the bundle argument against it is weak, and
`hasSideEffects: true` is the one flag worth checking, since it may block tree-shaking down to `Qibla`
alone.

### 19.3 THE REASON IT IS ACTUALLY INTERESTING, which is not the qibla

The package's real value to this project is what sits beside `Qibla.ts` in the same 4.6 KB:

```
Astronomical.ts   CalculationMethod.ts   HighLatitudeRule.ts   Madhab.ts
PolarCircleResolution.ts   PrayerTimes.ts   Shafaq.ts   SolarCoordinates.ts
SolarTime.ts   SunnahTimes.ts
```

**Three of those matter to work this repo has already queued or considered.**

1. **`PrayerTimes`, `CalculationMethod`, `HighLatitudeRule` and `PolarCircleResolution` are the global
   prayer-times problem**, which is row 39's v2.0 premise. This repo ALREADY researched `adhan` for exactly
   that: `ai/features/moonsighting/RESEARCH-FINDINGS.md` section 2.11 records `adhan@4.4.6` being read with
   `opensrc` and diffed against our own endpoint **for every day of 2026, across twelve cities and three
   methods**, with the scripts kept in `ai/features/moonsighting/data/adhan/`. **So the library is already
   partly validated against our own production data**, which is a far stronger position than adopting it
   cold.

2. **`SolarCoordinates` exposes solar declination and right ascension, and `SolarTime` the transit.** That
   is the machinery for **rasd al-qibla**, the sun-transit verification method that sections 1.8 and 12.5
   identified as the one technique that beats the magnetometer outright, and that section 10.4 recorded
   Kemenag building a national campaign around. Section 12.5 also established that the dates must be
   COMPUTED per year rather than hardcoded, because sources disagree on the day. **`adhan` already carries
   the solar maths to do that.**

3. **Session 32's polar work used `adhan` as its reference implementation** for the high-latitude sweep
   (`ai/AGENTS.md` [2026-09-27]), so the library has already been trusted as ground truth by an audited
   session in this repo.

### 19.4 The honest counter-argument

The qibla formula is ten lines. Adopting a dependency for ten lines is the wrong trade on its own, and
`ai/AGENTS.md` records this project's preference for deleting code over adding it. **The case for `adhan`
rests entirely on the three points above, not on the qibla.**

There is also a real risk worth naming: **two sources of prayer times in one app.** Our API is the source
of truth today (`ai/AGENTS.md`: "Prayer times must always be accurate (API is source of truth)"), and
importing a library that can also compute them invites future drift unless the boundary is explicit.

### 19.5 What the plan will do

**Nothing yet.** This is a decision for the owner, and the R3 brief is gathering the evidence: bundle
impact with and without tree-shaking, the test suite's own qibla reference values, whether the ports agree,
and whether the "Spherical Trigonometry page 50" citation checks out, which is a good proxy for how
carefully the library was built.

**The provisional recommendation, to be revisited when that report lands:** use `adhan` ONLY if the session
also wants the sun-transit verification, and otherwise write the ten lines. A dependency justified by one
function is a dependency justified by nothing.
