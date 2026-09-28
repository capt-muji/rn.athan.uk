# Agent report 2: shipped-app engineering failures

Returned 2026-09-28 by an independent research agent, attempt 3. This is the war-stories brief: real bug
reports, issue trackers, and app-store complaints from people who shipped a qibla compass before us.

The planner's ruling is in `RESEARCH.md` section 11.

---

## 1. The most-reported complaint: "the direction changes every time I open it"

- r/islam: "Every day the qibla changes on the app, I'm using athan... I decided to use a website instead
  it seems more stable"
- A user quoted by muslimapp.com: the same spot in the same room read **118° one day, then 103° or 134° on
  other days**
- An Arabic app review: "the compass shows me the Qibla in one direction in the exact same spot and the
  next day it shows 180 degrees in a completely different" direction

**Root cause in essentially all of these: an uncalibrated or interfered magnetometer, never the bearing
maths.**

## 2. Demonstrable failures with identified causes

| Case | Root cause |
| --- | --- |
| Apps near the Kaaba point the wrong way | GPS error (10 to 50 m) exceeds the distance to the target, so the bearing flips. A **Pillars developer confirmed on Reddit**: "your GPS would quite literally have to be accurate to <5m... We actually recently started to roll out an update that would notify users of this." |
| Apps pointing at "Makkah city" not the Kaaba | App uses city-centre coordinates |
| Qibla Pro review (Malaysia) | "in the mosque... the compass was totally wrong direction" - indoor steel interference, no re-calibration trigger |
| Academic audit (Malaysia 2024) | Theodolite reference 292°57′44″; **5 of the 10 top apps differed measurably**, though within juristic tolerance |

## 3. The 180° and fixed-offset cases

**qibla.uk states it flatly:** "A reading that is out by roughly 180° almost always has a physical cause
[MagSafe case, magnetic mount, magnetic wallet], **not a software one**."

- MacRumors, iPhone 15 Pro: "My compass is reliably 180 degrees out and no amount of calibration seems to
  help" after MagSafe case use.
- **90° fixed offset** is documented on a landscape-default device (OsmAnd issue 2131, Samsung Galaxy
  Camera 2): **sensor-axis remapping not adjusted for screen rotation.**

**The agent found NO credible report of a shipped qibla app computing the antipode bearing.** Every
diagnosed "opposite direction" case traced to magnets or near-Kaaba GPS error.

## 4. Open-source issue trackers: what actually breaks

### flutter_qiblah (154 stars), the most-used Flutter plugin

- **#7 "Wrong direction"** - maintainer's diagnosis: "In Android devices the hardware is not very good and
  keeps giving wrong direction but if you test it in iOS, you will find that it's working properly. **This
  is not a problem with the Qiblah direction but with the North direction.**"
- **#43 "How to detect compass accuracy?"** - maintainer: not supported. The plugin **cannot surface
  accuracy at all.**
- **#46 "Compass Not Moving - Compass sensor is unreliable, device calibration is needed"** - the Android
  native log string is un-catchable from Dart.
- **#49 "Animation is very shaky and unstable for Android 13 & 14"** - smooth on 8/10, shaky on 13/14,
  unresolved. Plus **#34 "Qibla is jumping"**, **#21 "New update is slow!"**
- **#57** `androidDeviceSensorSupport()` always returns false on Android 14.
- **#39/#29/#10/#6** - iOS "loading forever": **the iOS Simulator has no magnetometer.**

### compass-qibla (Android, 34 stars)

- **#5 crash on Android 13:** `NullPointerException: sensorManager.getDefaultSensor(Sensor.TYPE_ORIENTATION)
  must not be null` - using the **deprecated TYPE_ORIENTATION sensor** many devices do not expose.
- **#6 "Compass stuck after minimizing and resuming"** - sensor listener lifecycle bug.

### Recurring bug classes, ranked by frequency

1. Wrong or jumpy heading on specific Android devices and versions - **always the sensor layer, never the
   formula**
2. iOS loading-forever: simulator, or missing location permission
3. Cannot detect or report compass accuracy
4. Sensor-availability checks breaking on new Android versions
5. **Lifecycle bugs: compass stuck after backgrounding**
6. Dependency drift
7. Landscape/axis-remap 90° errors
8. atan2 argument order and negative modulo

## 5. TILT: the failure mode nobody expects

**The strongest quantitative finding in the report.**

- **ASYU 2023 paper (yahyatawil/qibla-paper):** "The Qibla error without tilt compensation **can reach up
  to 100 degrees for 30 degrees pitch**."
- **Dip-dependent sensitivity**, from manufacturer documentation: at magnetic dip ~5° (near the magnetic
  equator), 1° of tilt error gives **0.09°** of heading error. At dip 80° (northern Alaska), the same 1°
  gives **up to 6°**.
- Apps that tell users to hold the phone flat (Muslim Pro: "Keep the device flat on a table or on the
  floor") are working around exactly this.

## 6. Magnets: the measured numbers

- **A MagSafe magnet array measured 68.8 mT at the back surface of an iPhone 13 Pro, and still ~1 mT at
  19 mm.** Earth's field is **0.05 to 0.06 mT**. At contact the accessory beats the signal by **three
  orders of magnitude.** (2023 *Sensors* study.)
- **THE CRITICAL ASYMMETRY, and the best single finding of this brief:** figure-8 calibration only fixes
  fields that **move with the device**. Apple's documented wording: calibration "is able to filter out only
  those magnetic fields that move with the device"; for external sources "the user must either move the
  device away from the source or move the source in conjunction with the device."

  **So a permanently-attached MagSafe case cannot be calibrated away. The only fix is "remove the case".**

## 7. How the good apps communicate untrustworthiness

- **iOS:** `CLHeading.headingAccuracy` in degrees; `trueHeading == -1` when location services are off.
- **Android:** `SENSOR_STATUS_ACCURACY_*`. **The docs define accuracy at 68% confidence**: "if heading
  returns 60 degrees and accuracy returns 10 degrees, then there is a 68 percent probability of the true
  heading being between 50 and 70."
- **New Fused Orientation Provider** (Play services 21.2.0+) exposes explicit `getHeadingErrorDegrees()`,
  recommended for new compass work.
- **Field-magnitude heuristic:** total field far outside **25 to 65 µT** implies interference.
- **Muslim Pro hard-blocks** with an infinite-loop icon until 5 or 6 large figure-8s are done.
- **flutter_qiblah cannot surface accuracy at all** (issue #43).
- The genre's own guidance: **"a confident wrong arrow is worse than a 'move away from interference'
  prompt."**

## 8. The great-circle "looks wrong" problem, and how the best app handles it

Users in North America repeatedly report the app as broken because the qibla is **NE, not the SE a flat map
suggests**.

- Abdali, *The Correct Qibla* (1997): documents the dispute, holds the great circle correct, and cites the
  Islamic Center of Washington DC (1953) oriented 56°33′15″ E of N, calculated by the Egyptian Ministry of
  Works, **with passers-by complaining it was "wrong"** for exactly the flat-map reason.
- Mohamed Zakariya's first-person account of **being banned from a Los Angeles mosque** for pointing this
  out.
- **Muslim Pro pre-empts it in its help centre, in writing:** "If you believe that the device is indicating
  the wrong direction in degrees, please note that the direction to the Kaaba is not a straight line on a
  flat map... it is normal that your Qibla points towards the North-East if you are in NY."

**Implication stated by the agent: the app WILL get "wrong direction" reviews from North America if it
computes the correct bearing and does not explain it in-product.**

## 9. What the best apps share

1. Fused heading (gyro + accelerometer + magnetometer), never raw magnetometer
2. True north via OS declination
3. Explicit accuracy signal plus figure-8 coaching, with a hard block on "unreliable"
4. **A map fallback** (Muslim Pro, flutter_qiblah's example, SimplyQibla, Google Qibla Finder)
5. Near-Kaaba and low-GPS-accuracy warnings (Pillars shipped this in 2025)
6. Great-circle education copy for North America
7. On-device calculation, no network round trip

**The worst:** interstitial ads over the compass, false sensor warnings, no accuracy surfacing, no map
mode, and 100%-accuracy claims.

## 10. Calibration UX

- **Muslim Pro, the canonical pattern:** animated infinite-loop icon, "a large (shoulder width) 8-figure
  gesture... repeat 5 or 6 times", hard-blocking until cleared.
- **Mawaqit:** ordered list - remove metal cases, force stop, figure-8, restart phone, reinstall.
- **It works only when the interference travels with the phone**, and fails completely otherwise. "If the
  interference is the desk rather than the phone, you can wave until your arm aches and the reading will
  not improve."
- Worst-in-class: one app fires an **interstitial ad immediately after the calibration step.**

## 11. Ranked traps for a new implementation

1. Untrustworthy Android magnetometer readings. **Never render raw `atan2(mag.y, mag.x)` from expo-sensors
   as a heading.**
2. No accuracy surfacing or calibration coaching. "A confident wrong arrow is the genre's cardinal sin."
3. Magnetic interference, especially MagSafe, being unfixable by figure-8.
4. Great-circle direction "looks wrong" in North America, producing bad reviews.
5. **Tilt: up to 6° heading error per 1° tilt at high dip; up to 100° at 30° pitch.**
6. Magnetic vs true north mix-ups and declination model expiry (WMM2020 lapsed Dec 2024).
7. Devices without magnetometers: budget Androids, Wi-Fi iPads, **and the iOS Simulator, which will hang
   dev builds.**
8. GPS error near the Kaaba flipping the bearing.
9. Heading-stream lifecycle bugs: stuck compass after backgrounding.
10. Landscape/axis-remap 90° errors, atan2 argument order, negative modulo.
11. Sphere vs WGS84 1 to 2° disagreement between apps.

## 12. What the agent could NOT find evidence for

- A shipped app computing the antipode bearing
- **A public post-mortem where a named qibla app fixed a formula bug** (sign error, radian/degree, swapped
  lat/lon). "Math bugs are conspicuously absent, consistent with the math being settled and libraries being
  copies of one formula."
- **A Southern-Hemisphere-specific qibla bug report.** "The formula is symmetric."
- Systematic A/B data on calibration-prompt UX
- Per-object degree deltas for car mounts and popsockets

## Key sources

- flutter_qiblah issues: `github.com/medyas/flutter_qiblah/issues`
- compass-qibla issues: `github.com/derysudrajat/compass-qibla/issues`
- ASYU 2023 tilt paper: `github.com/yahyatawil/qibla-paper`
- qibla.uk troubleshooting: `qibla.uk/compass-not-working`
- muslimapp.com on calibration physics: `muslimapp.com/blog/qibla-compass-mistakes`
- Muslim Pro help: `support.muslimpro.com/help/en/articles/how-to-access-qibla-on-muslim-pro-app`
- Abdali, *The Correct Qibla*: `geomete.com/abdali/papers/qibla.pdf`
- Zakariya, "The Trouble with the Qibla": `mohamedzakariya.org/pages/the-trouble-with-the-qibla`
- Pillars near-Kaaba reply: `reddit.com/r/islam/comments/1oub4zo/which_is_the_qibla/`
- Android sensors position doc (68% confidence): `developer.android.com/develop/sensors-and-location/sensors/sensors_position`
- Android Fused Orientation Provider: `tomasrepcik.dev/blog/2024/2024-04-15-android-orientation-api/`
- OsmAnd 90° landscape bug: `github.com/osmandapp/OsmAnd/issues/2131`
- geomagnetism npm (WMM in JS): `github.com/naturalatlas/geomagnetism`
