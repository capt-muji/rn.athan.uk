# Facts that survive, and nothing else

The owner threw out the conclusions of sessions 37, 40, 41 and 43 (🐋  "all the previous research is incorrect"). A
MEASUREMENT does not stop being a measurement, so the numbers below are preserved with how each was obtained. Every
CONCLUSION built on them is void, and session 45 draws its own.

**This page is the only thing session 45 may carry forward.** Session 44 completes it as it deletes.

## 1. The owner's own measurement, which is why the row exists

Walking between four rooms with Google Maps and Apple Maps open, on an iPhone XS running 1.29.162, the indicated
direction changed substantially in each room. Reported 2026-09-30.

**So the platform's own maps are jittery indoors.** Not our code, not our fusion, not our axis constant.

## 2. The qibla does not move when you walk

Computed from the owner's address (51.475, -0.2015) with the great-circle initial bearing. True qibla **118.875568**.

| Moved | Qibla change, north | Qibla change, east |
| --- | --- | --- |
| 1 m | 0.000008 | 0.000016 |
| 5 m | 0.000042 | 0.000080 |
| 10 m | 0.000084 | 0.000159 |
| 100 m | 0.000841 | 0.001591 |
| 1 km | 0.008409 | 0.015915 |
| 10 km | 0.083999 | 0.159312 |

**Room-to-room movement moves the true qibla by under a ten-thousandth of a degree.** Every degree the owner saw
change was the compass.

## 3. Through the earth and along the surface are the SAME direction

The owner asked whether a man in space, or someone in a very tall building, faces differently, reasoning about cutting
through the earth rather than following a curve.

Computed two ways: the great-circle initial bearing, and the 3D chord from observer to Kaaba projected onto the
observer's local horizontal plane (the literal straight line through the earth).

| City | Great circle | Through the earth | Difference |
| --- | --- | --- | --- |
| London | 118.876 | 118.876 | 0.000000 |
| New York | 58.482 | 58.482 | 0.000000 |
| Los Angeles | 23.857 | 23.857 | 0.000000 |
| Jakarta | 295.152 | 295.152 | 0.000000 |
| Sydney | 277.500 | 277.500 | 0.000000 |
| Cairo | 136.137 | 136.137 | 0.000000 |
| Toronto | 54.581 | 54.581 | 0.000000 |

**Identical to six decimal places at all seven.** There is no arc-versus-chord choice to make about the DIRECTION, so
the owner's instinct that it should not matter is correct and it is now proven rather than argued.

## 4. A straight line on a flat world map is a different direction

The rhumb line, which is what a straight line between two points on a Mercator map IS.

| City | True bearing | Straight line on a flat map | Error |
| --- | --- | --- | --- |
| Cairo | 136.137 | 138.130 | 1.99 |
| Jakarta | 295.152 | 292.792 | 2.36 |
| London | 118.876 | 133.736 | 14.86 |
| Sydney | 277.500 | 297.496 | 20.00 |
| New York | 58.482 | 101.281 | 42.80 |
| Toronto | 54.581 | 102.614 | 48.03 |
| **Los Angeles** | 23.857 | 95.174 | **71.32** |

**This is the trap the drawing must avoid**, and it is independent of fact 3: the DIRECTION is unambiguous, but a line
drawn straight across a flat map does not point along it.

## 5. What the platform gives, read from installed source

- `expo-location`'s `watchHeadingAsync` emits `trueHeading`, `magHeading` and `accuracy`
  (`expo-location/ios/LocationModule.swift:114-116`). `trueHeading` is `CLHeading.trueHeading`, Core Location's own
  fused, declination-corrected heading: the value Apple Maps points with. **An app that reads it needs no axis
  constant, no reference frame choice and no declination term.**
- **The accuracy is BUCKETED before JavaScript sees it.** `expo-location/ios/LocationUtils.swift:9` maps Apple's raw
  degrees to `0` above 50 or negative, `1` above 35, `2` above 20, else `3`. **The exact degrees Apple reports are
  discarded.**
- Both platforms report `trueHeading` of `-1` when there is no fix. Android additionally reports a NEGATIVE
  trueHeading wherever declination is negative, which is indistinguishable from that sentinel to anything testing for
  a negative number, so the sentinel must be matched exactly.
- **Android's heading has no gyroscope in it.** `expo-location`'s `LocationModule.kt:646` fuses accelerometer with the
  RAW magnetometer and gates updates at 2 degrees and 50 ms. Measured on a Find X8: **71 degrees of error, 2 samples
  in 40 seconds**, against a fused rotation-vector reading of 9.7 degrees and 148 samples on the same phone at the
  same moment.
- The app's only location permission today is `NSLocationWhenInUseUsageDescription`. No motion permission is used.

## 6. What Apple itself does about indoor jitter

**Apple Maps draws a CONE, not a needle, and its width is the reported heading accuracy.** Apple's documentation for
`CLHeading.headingAccuracy` states that a negative value means the reported heading is invalid, "which can occur when
the device is uncalibrated or there is strong interference from local magnetic fields".

So the platform's answer to the owner's own observation is to DISPLAY the uncertainty rather than hide it. Whether this
app does the same is session 45's central design decision, and fact 5's bucketing is the obstacle.

## 7. The haptic numbers, which are implementation-independent

Measured in session 43's prototype against 0.3-degree jitter at the boundary:

- A SINGLE alignment threshold fires **49 taps in 100 samples**. That is the continuous buzz the owner refuses.
- A gap between entering and leaving (4 degrees in, 8 degrees out) fires **1**.
- A crossing test with no bound on how far the heading may be from the line **taps at the antipode**, when the user
  faces directly away from Makkah: measured 4 taps per 2 revolutions where 2 is right. Bounding a crossing to within
  90 degrees of the line fixes it.

These are properties of the state machine, not of any particular sensor or map, so they hold whatever session 45
builds.

## 8. Library facts

- `adhan@4.4.6` exports `Qibla(coordinates)`, which returns the same great-circle bearing. Measured against a
  hand-written implementation it agreed to about **nine millionths of a degree**, and all 29 of this repo's existing
  bearing tests passed unchanged against each. **`adhan` must stay installed regardless**: it computes the prayer
  times, which is the app's purpose.
- The Kaaba's position, re-sourced in session 41 from five independent sources including OpenStreetMap's surveyed
  building footprint (way 103914569, area centroid 21.4224868, 39.8261262), agrees to **8.27 metres**, which is
  **0.34 arcseconds** of bearing from London. `21.4225, 39.8262` is safe to reuse.
- `react-native-svg` is already a dependency and was measured at **+0.0 MB**, against **+39.9 MB** for MapLibre across
  four ABIs.
- `fflate@0.8.3` (91 KB, zero transitive dependencies) was added for PMTiles gzip and has no other consumer.

## 9. The process lesson, recorded because it cost four sessions

**An acceptance criterion that measures our output against an unvalidated reference is not a test.** Sessions 37, 40,
41 and 43 each compared this app's needle against Google Maps and Apple Maps and treated every disagreement as our
defect. Nobody checked whether the reference holds still. It does not.

The cheapest experiment in the programme, walking between rooms with the reference apps open, was available from day
one and would have prevented all four.
