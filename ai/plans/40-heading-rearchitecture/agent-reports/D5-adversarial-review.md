# D5: adversarial review of the fusion theory

Session 40, diagnostic agent D5. Scope: attack the working theory that the two old phones read an unfused accelerometer-plus-magnetometer heading, that a bedroom field deflects them by 45 degrees, and that the four newer phones resist because their headings are gyroscope-fused. Grades: [P] official documentation or paper, [S] read from source or measured this session, [W] blog or forum, [U] unverified.

## The strongest objection, first

**Gyroscope fusion does not reject a static magnetic field offset. It rejects transients and noise.** A bedroom anomaly is static. In a steady distorted field the fused compass converges to the same wrong magnetic north as the raw pair, just more smoothly. R4 proved this in the other direction with its silent-confident-error section: the gyro carries the heading while the magnetometer slowly pulls it toward whatever north the disturbed field defines. The inverse holds here: a fused phone in a bad room stays right only for as long as its gyro-carried heading outlives its last good magnetic fix, which is a minutes-scale transient, not a stable property of the device.

The theory is therefore not wrong so much as mis-stated. It survives as a claim about dynamics: the owner turned his body to judge each phone, so every reading was taken seconds after motion, which is exactly the regime where a fused phone still carries a pre-room heading and an unfused phone has already snapped to the room's field. As a claim about steady state it fails, and the second half of this report shows the evidence usually cited for it does not discriminate.

Two evidentiary holes follow directly, and either alone should stop the session from shipping a diagnosis tuned to "fusion resists the bedroom":

1. On the 3T, Google Maps agreed with the Athan app in the wrong direction. Per the theory Maps reads the fused path and the Athan app the raw pair, so in that room the two paths read the same wrong north. That is the static-field behaviour, not the resistance behaviour.
2. On iOS the XS and the 14 Pro Max both read `CLHeading` through Core Location in every app involved (R2 verified expo-location is a passthrough, and MapKit hands the developer the same `CLHeading` through `MKUserLocation.heading`). The same API cannot be the unfused path on one phone and the fused path on the other. Any iOS-side fusion difference lives inside locationd, is undocumented, and per R2 rests on inference from a WWDC session, not a statement.

## 1. Room geometry: what "corner versus centre of the wall" is worth

Room 4.5 m by 3.5 m, person at height irrelevant, bearings computed as compass angles from the standing position to each feature. Script: `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/D5/room-and-field.js`, output pasted in full below for the audit trail.

From the exact centre of the room:

| Feature | Bearing (room-relative) |
| --- | --- |
| Each corner | 52.1, 127.9, 232.1, 307.9 |
| Each wall centre | 0, 90, 180, 270 |

The separation between a corner and the centre of an adjacent wall, seen from the centre, is 37.9 degrees for the short-wall pairs and 52.1 degrees for the long-wall pairs. Nothing in this room's geometry produces exactly 45.

Standing off-centre widens the range. A full sweep over a 0.25 m lattice (0.3 m margin from walls), taking at each position the adjacent corner-and-wall-centre pair whose bearings bracket the 118.9 qibla, gives 148 samples:

| Statistic | Separation |
| --- | --- |
| Minimum | 16.5 deg |
| 25th percentile | 24.5 deg |
| Median | 34.0 deg |
| 75th percentile | 54.1 deg |
| Maximum | 88.2 deg |

The honest range for the observed split is therefore **about 25 to 55 degrees**, with 34 the single most likely value and body-turn judgement adding its own error of several degrees. "Roughly 45" is consistent with standing near the centre, but any mechanism tuned to exactly 45 degrees is tuned to a number the measurement cannot carry. The owner's report brackets the truth, it does not pin it.

What the honest band demands of any physical cause, against London's horizontal Earth field of roughly 18.4 uT (F about 49 to 49.5 uT, inclination about 67.5 to 68 degrees, [P] NOAA calculator gives declination 1.18 deg at the room's coordinates on 2026-09-29; component calculators were unreachable, so F and I carry the stated tolerance and the anomaly table moves by at most 6 percent across it):

| Deflection | Perpendicular anomaly required |
| --- | --- |
| 25 deg | 8.6 uT |
| 34 deg | 12.4 uT |
| 45 deg | 18.4 uT |
| 55 deg | 26.3 uT |

Everyday sources reach these magnitudes. Section 5 measures one directly.

## 2. Were the two groups measuring the same thing

What each app shows:

- **The Athan app**: a printed compass card that counter-rotates against the phone's heading, a Kaaba marker fixed at the bearing on that card, and a fixed mark at the top of the screen. The user turns the phone until the Kaaba sits under the mark. The app shows **where Makkah is, relative to the phone**.
- **Apple Maps and Google Maps**: the blue cone or beam shows **which way the user is facing**. In north-up mode the map stays fixed and the cone rotates as the user turns. In compass mode the map itself rotates so that up is the heading, and Makkah's on-screen direction is the bearing minus the heading.

Both reduce to the same physical quantity, the phone's heading, so a user who translates both into ground directions gets a like-for-like comparison. The owner turned his body for both, which is the correct protocol and the reason the comparison is probably sound. Two residual risks remain:

1. **Map-mode mismatch.** If one Maps check ran north-up and the other in compass mode, and the owner judged by on-screen direction rather than ground direction, the two judgements differ by the map's own rotation. The result would be apparent disagreement between two phones whose headings agree.
2. **The Maps-side target carries projection error.** The owner identified Makkah's direction on a flat map by eye, since Maps shows no 119 number. The rhumb-line bearing from this room to the Kaaba is 133.75 degrees against the true great-circle 118.89, a gap of 14.86 degrees (computed this session, `rhumb-and-3t.js`). Eyeballing "toward Saudi Arabia" on a Mercator map lands somewhere between the two. This does not break the agreement observation, since both apps on one phone shared the same wrong heading, but it contaminates any magnitude derived from the Maps side. The 45-degree figure came from body-turning, not from the map, so it stands with the section 1 error bars.

The Android qibla-app comparisons on the 3T were needle-against-needle and are the cleanest of the lot. The XS comparison is sound on agreement, softer on magnitude.

## 3. Could holding difference produce the split

Modelled at London's inclination, scripts `tilt-and-sweep.js`:

A naive compass that reads only the phone-frame horizontal components errs by `atan(tan(I) * sin(roll))`:

| Roll | Heading error |
| --- | --- |
| 5 deg | 12.2 deg |
| 10 deg | 23.3 deg |
| 30 deg | 51.1 deg |

A tilt-compensated compass with its gravity estimate biased by g degrees errs by roughly `atan(tan(I) * sin(g))`: 2.5 degrees at 1 degree of accelerometer bias, 23.3 degrees at 10 degrees of bias.

So the sensitivity asymmetry the question asks about is real: at London's steep inclination, a genuinely naive compass turns a small roll into a large heading error, while a tilt-compensated one needs an accelerometer fault to move at all. But the asymmetry cannot explain this observation, because **none of the six phones runs a naive compass**. The Athan app's Android path runs `getRotationMatrix` with the accelerometer, which is tilt compensation (R3, source-verified). Core Location handles tilt on iOS. Maps certainly does. Holding one phone flat and another upright changes each one's noise and jitter, not its steady heading.

The one honest exception: dynamic acceleration while turning the body biases the gravity estimate for a second or two, and a tilt-compensated compass with 10 degrees of apparent gravity error errs by 23 degrees at this inclination. That produces wobble during the turn, not a settled wrong direction. Verdict: tilt is a red herring for a persistent split of this size, and the session should not spend owner patience on flat-versus-upright protocols beyond controlling for gross abuse.

## 4. Does "every app on the device agrees" prove the cause sits below the app layer

No. It proves less than it is being asked to prove, on both platforms, and it is actively inconvenient for the theory on Android.

**iOS.** All apps read the same service. R2 read the source: expo-location's heading is a 53-line passthrough to `CLLocationManager.startUpdatingHeading`, and MapKit hands apps the same `CLHeading` through `MKUserLocation.heading` [P, R2]. So Maps and the Athan app on the XS receive identical numbers by construction. Agreement between them carries zero information about where the fault sits. It is compatible with an app rendering bug only being ruled out by attack 2's like-for-like check, with a locationd behaviour, and with an environmental deflection. The fact cannot arbitrate between them because there is nothing downstream of the service to differ.

**Android.** Apps do not share one sensor path. Each app chooses its sensors: `TYPE_ROTATION_VECTOR` (fused), the raw accelerometer-plus-magnetometer pair, or Play services' Fused Orientation Provider where available [P, R3 and R6]. The Play Store qibla apps on the 3T could sit on either. So on Android, "all apps agree" is a real measurement, and it is the one that hurts: per the theory, Google Maps on the 3T reads a fused path while the Athan app reads the raw pair, and the two agreed on the same wrong direction in that room. Under a static room field that agreement is exactly what both paths should produce, since both anchor to the same disturbed magnetic north. Under the resistance claim it should not happen. The theory's defenders must either show Maps on that 3T build fell back to an unfused path, which no one has, or accept that in the observed steady state fusion did not separate right from wrong on that device.

**What the fact does establish.** The heading was wrong at the OS-service level on each old phone, in that room, at that time. That is worth having: it rules out an Athan-app rendering defect as the cause of the wrong group, which section 6 confirms independently by audit. It does not establish that the old phones' sensor *path* is the differentiator between the groups, which is the load-bearing step of the theory and the one the Maps-on-3T agreement undermines.

## 5. Alternative causes, assessed

Measured this session, read-only, nothing installed or launched: the 3T sits on this machine's desk, and its calibrated magnetometer at rest reads `(-6.5, 38.8, -96.4)` uT. That is a total field magnitude of **104.1 uT against London's Earth field of roughly 49.5 uT, a factor of 2.1**, with a horizontal component of 39.3 uT against Earth's 18.5 and an inclination of 67.8 degrees against Earth's 68 [S, `dumpsys sensorservice`]. The uncalibrated stream carries a hard-iron bias estimate of `(-34.3, 14.1, -75.9)` uT, magnitude 84 uT. An ordinary desk with a laptop on it therefore supplies a horizontal anomaly of about 21 uT over Earth's, which alone would deflect a compass by roughly 49 degrees, the exact class of the observed split. This is not the owner's bedroom, but it is a measured demonstration that mundane indoor sources reach the required magnitude without any rare conditions.

The candidate causes, ranked by how well they fit the six-phone observation:

| Cause | Fit | Evidence |
| --- | --- | --- |
| **Stale hard- and soft-iron calibration on the old phones** | Strong. Calibration state is per-device, persists until motion triggers re-estimation, and corrupts every app on the device identically, which matches "all apps agree". Newer phones recalibrate continuously and more aggressively. A wrong hard-iron offset produces a stable wrong heading in every app, fused or not, since fusion consumes the same calibrated magnetometer. | The 3T's measured 84 uT bias vector and 2.1x field [S]. Distinct from the collapsed "magnetometer ageing" diagnosis: this is a software calibration state, fixable in twenty seconds by a figure of eight. |
| **Static room field with position-dependent gradient** | Strong. Both groups were read at "the same spot", but sequentially, with the owner's body and the other phones moving through that spot between readings. A dipole source's deflection falls as the inverse cube of distance, so tens of centimetres of position change move the deflection by tens of degrees. | The desk measurement above [S]; the inverse-cube table below. |
| **Fused phones carrying a pre-room heading** | Moderate, and this is the theory's defensible core. A phone that walked into the bedroom holds its last good mag fix for a gyro time constant while a raw phone snaps to the room field immediately. Fits the turn-and-read protocol exactly. Predicts the split decays if both phones stand still for a minute, which is testable in section 7. | Mechanism [P, R4's fusion analysis; R2's WWDC-17 reading]. No direct measurement. |
| **Two phones near each other during comparison** | Real but bounded. Corrected mutual-deflection table, anomaly perpendicular to London's 18.4 uT horizontal field, axial dipole model [S, `deflection-fixed.js`]: | See table below. |
| **OS-level setting** | Possible on iOS, absent on Android 9 in this form. The Compass Calibration system toggle (Settings, Privacy, System Services) silently degrades every app's heading when off, and it is per-device, invisible, and tracks phone age by accident [W, R6]. Would produce exactly "all apps on the XS agree and are wrong". No way to check without touching the phone's settings, which this agent will not do. | [W] only. |
| **Case magnets, wearables, pockets** | Plausible contributors. A closure magnet of 0.01 A m squared gives 41 degrees at 5 cm; fixed to the phone it lands in the hard-iron calibration and corrupts it rather than the heading directly. Keys and watch on the owner move with every body turn. | Dipole table below [S, modelled]. |
| **Stale reading after screen-off** | Weak for a settled comparison; R6 documents the class on Wear OS and iOS. The owner's readings required live needles, so a fully stale stream would have shown as frozen, not wrong. | [W, R6]. |
| **True versus magnetic north confusion** | Dead. London declination is 1.18 degrees [P, NOAA this session]. Nothing near 45 lives here. |

Mutual and near-field deflection, the numbers the brief asked for:

| Source | 5 cm | 10 cm | 15 cm | 20 cm | 30 cm | 50 cm |
| --- | --- | --- | --- | --- | --- | --- |
| Speaker or vibrator magnet, 0.05 A m² | 77 deg | 29 deg | 9 deg | 4 deg | 1 deg | 0 deg |
| Vibration motor, 0.02 A m² | 60 deg | 12 deg | 4 deg | 2 deg | 0 deg | 0 deg |
| Case closure, 0.01 A m² | 41 deg | 6 deg | 2 deg | 1 deg | 0 deg | 0 deg |
| Magnetic case plate, 0.1 A m² | 83 deg | 47 deg | 18 deg | 8 deg | 2 deg | 0 deg |

So two phones held in one hand, 5 to 10 cm apart, deflect each other by 30 to 77 degrees, while phones 30 cm apart are unaffected. If any part of the comparison held two phones together, that alone could manufacture the split, and it would preferentially hit whichever phone was read while the other sat in the owner's other hand or pocket. Beyond 30 cm the effect is dead. **The standing protocol for any re-test should keep the phones a metre apart or compared sequentially with the idle phone on a table.**

## 6. Code audit: is there a third rendering defect

Read in full: `device/qibla.ts`, `shared/qibla.ts`, `components/qibla/Dial.tsx`, `components/qibla/dialGeometry.ts`, `components/sheets/screens/Qibla.tsx`, `components/qibla/__tests__/Dial.test.tsx`.

The directional chain is correct. The marker's angular position comes from `dialPoint(bearing, ...)` plus `translate`, which is bearing-correct and independent of heading. The face rotation is `-heading` under a fixed top mark, so the marker reaches the mark exactly when the phone's heading equals the bearing; the test pins this at heading 90 rotating the face minus 90. The unwrap accumulator never wraps, the first evaluation snaps, `normaliseHeading` handles the Android negative-declination case before the sentinel check, and the displayed number rounds the bearing, which is heading-independent and therefore always right, matching the owner's observation that all six phones showed 118 or 119. No 45-degree-like constant exists anywhere in the five files.

**One cosmetic suspect, non-directional.** `Dial.tsx` line 95 wraps the Kaaba glyph in `rotate(${-bearing})`. Two coherent frames exist for an element on the turning layer: zero rotation for a glyph printed on the card, or plus-bearing for a glyph upright on screen at the moment of alignment. Minus-bearing matches neither: at alignment the glyph sits rotated by minus twice the bearing, about 122 degrees from upright for London, so the kiswah band reads diagonally. This is the same counter-rotation class session 37 removed from the labels, surviving inside the marker. It cannot rotate the direction the needle points, because placement is translate-only and the rotation acts on the glyph about its own centre. Worth fixing, worthless as an explanation here.

**Why the suite missed the glyph while catching the labels:** the label regression asserts that no text node carries a matrix. The marker glyph is a `G` of two `Rect`s, not text, so no assertion reaches it. A glyph-orientation assertion would need to read the `G`'s matrix, which the existing walker does not visit.

## 7. The decisive test, designed and ranked

Constraints honoured: phones in hand, no new apps, no sun, no landmarks, under two minutes, and it must discriminate between the live candidate causes, which are now calibration staleness, static room field with gradient, and fusion-as-transient.

**The test: calibrate both, then stand still and watch.** Take one wrong phone and one right phone. Cases off, keys and watch off, idle phone on a table a metre away. At the standing spot, figure of eight the wrong phone, read it immediately, then hold both phones still at the same spot for sixty seconds and read both again.

| Outcome after sixty seconds of stillness | Diagnosis |
| --- | --- |
| Wrong phone snapped right, then drifted back toward wrong | The room field is pulling every phone. The device split is a convergence-time difference. Fusion matters only as dynamics; a fused architecture is the right fix but the honest copy must say so. |
| Wrong phone snapped right and stayed right | Stale calibration was the whole defect. The fusion re-architecture would not have fixed it, since fusion consumes the same calibrated magnetometer. Twenty seconds of figure of eight was the fix. |
| Wrong phone stayed wrong, right phone stayed right | Stable per-device difference in a field both see identically. Points at calibration quality or sensor condition, not at fusion status, and the re-architecture's premise for this observation is dead. |
| Right phone drifted toward wrong | The right group's correctness was transient all along. The fusion theory's mechanism is confirmed in its dynamic form and the room is confirmed hostile. |

This single protocol partitions the whole candidate space in about ninety seconds, uses nothing the owner has not already got, and its outcomes each name a different engineering response.

Ranked runner-ups, by discriminating power:

1. **Relocation control** (60 s): carry both phones three big steps away or to the doorway, read both, return. A split that moves with position indicts the room's gradient. A split that follows the phones indicts the phones.
2. **Observer control** (20 s): metal off the body, cases off, one phone at a time, and no phone within a metre of another at any moment. Cheap, and it eliminates the entire near-field row of the deflection table in one stroke.
3. **Mode check** (10 s, one question to the owner): was Maps north-up or rotating on each phone. Closes the last conflation path from section 2.

Honest limits. No two-minute test with these constraints can read which sensor API Google Maps used on the 3T's build, and that fact is load-bearing for the strongest form of the fusion theory. The owner has rejected the diagnostics that could. The calibrate-and-watch test is the most any in-hand protocol can carry, because it does not need to know the API: it observes the convergence behaviour that distinguishes the candidate causes regardless of path.

## Where the theory stands after this attack

Its strong parts: the sensor-path facts are source-verified and unchallenged here (expo-location's Android heading is the raw pair, the rotation vector is fused, all three sensors exist on the 3T). The re-architecture case for smoothness and honest degradation survives this review untouched, since R4's filtering analysis and R6's field evidence stand on their own. The gyro-carry mechanism gives the theory a real, protocol-fitting explanation for why the split appeared during turn-and-read comparison.

Its broken part: the phrase "resist indoor magnetic distortion" as a steady-state property. The Maps-on-3T agreement, the identical `CLHeading` on both iPhones, and the static-field physics all cut against it, and the unexamined competitors, stale calibration first among them, fit the same six-phone table at least as well. The session should ship the re-architecture on its measured merits, and should not ship the diagnosis that the four new phones were right because fusion resists the bedroom, because that sentence is the third confident diagnosis in a row that the evidence does not hold.

## COULD NOT VERIFY

1. **What Google Maps on the 3T's Android 9 build actually reads.** FOP requires Play services 21.2.0+ [P, R6]; the 3T's Play services version was not read this session and reading it would not settle Maps' internal choice anyway. Tried: nothing beyond R3's dumpsys, which observed only droidguard subscribing to the rotation vector, not Maps. This is the theory's largest open fact.
2. **locationd's heading fusion on the XS versus the 14 Pro Max.** Apple does not document it; R2 exhausted the public sources. Without it, the iOS half of the device split has no verified mechanism.
3. **The bedroom's own field.** The desk measurement is a proxy from this machine's environment, not the owner's room. The owner's standing position, hold angle, case, and pocket state during the original comparison are likewise unknown and unmeasurable now.
4. **London's F and I from a component calculator.** The NOAA declination endpoint worked; the component endpoints and the BGS calculator page did not return values this session. The uT tables use F 49 to 49.5 and I 67.5 to 68 from published chart values, which moves the deflection numbers by at most 6 percent and changes no conclusion.
5. **Whether any phone wore a magnet-bearing case during the original comparison.** The owner did not report it and the deflection table shows it matters.

## Sources

| Grade | Source | What it established |
| --- | --- | --- |
| [S] | Scripts and pasted output: `room-and-field.js`, `tilt-and-sweep.js`, `rhumb-and-3t.js`, `field-check.js`, `wmm-check.js`, `deflection-fixed.js` in `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/D5/` | All arithmetic in sections 1, 3 and 5: corner-versus-wall separations, sweep quartiles, tilt error tables, deflection tables, rhumb-versus-great-circle gap |
| [S] | `adb shell dumpsys sensorservice` on the 3T, serial 8f7ada76, read-only, 2026-09-29 | Live magnetometer values, 104.1 uT total against 49.5 Earth, 39.3 uT horizontal, 67.8 deg inclination, 84 uT hard-iron bias estimate, sensor inventory |
| [P] | NOAA NCEI geomagnetic calculator, WMM-2025, queried for 51.48, -0.195 on 2026-09-29 | Declination 1.18 deg, secular variation 0.17 deg per year, uncertainty 0.38 deg |
| [S] | Repo source read this session: `device/qibla.ts`, `shared/qibla.ts`, `components/qibla/Dial.tsx`, `components/qibla/dialGeometry.ts`, `components/sheets/screens/Qibla.tsx`, `components/qibla/__tests__/Dial.test.tsx` | Section 6 audit, the glyph rotation suspect, the absence of a 45-degree constant, why the suite cannot see the glyph |
| [S] | Sibling reports R1 through R6, read in full this session | expo-location's raw Android pair (R3), the iOS passthrough and MapKit's shared `CLHeading` (R2), the fusion transient-versus-static mechanism (R4), FOP's Play services requirement and the calibration-toggle class (R6) |
| [P] | Android `SensorEvent` and `SensorManager` references as cited by R3 | Tilt-compensation structure of `getRotationMatrix`, rotation vector reference frame |
| [U] | F 49 to 49.5 uT and I 67.5 to 68 deg for London from published chart values | The horizontal-intensity basis of the uT tables; not returned by a live component calculator this session, bounded by `field-check.js` |
| [W] | The iOS Compass Calibration toggle's silent degradation, via R6's HN and Apple Communities citations | The one OS-level per-device setting that fits the iOS half of the split |
