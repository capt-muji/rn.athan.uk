# D2: the magnetic environment, measured, and what it does to a phone compass

Diagnostic agent D2, session 40. Scope: the physics and the field evidence. The device-class reasoning belongs to the sibling agent.

**Direct answer.** Yes, a room can cause a 45 degree error: London's horizontal field component is only 19.58 µT [S, IGRF computed], so a perpendicular horizontal anomaly of 19.6 µT produces exactly 45 degrees, and measured indoor surveys record anomalies of that order (a spot 3 m from a lift reads 1.9x Earth's total field, stable over 24 h [P, Li 2012]). Gyro fusion would have prevented part of this failure but not all of it: AOSP's fusion explicitly rejects magnetometer samples outside 10 to 100 µT before letting them near the heading [S, Fusion.cpp], and the gyro carries the heading through transients, but a directionally distorted field inside the gate still pulls the fused heading to the same wrong north. In this specific bedroom the four fused phones read correct at the standing spot, so the room alone is not producing 45 degrees there. The split is dominated by the two phones' own calibration state and their ungated raw path. Both paths share the same HAL calibration, so row 40's sensor swap alone does not repair a corrupted calibration; the recalibration coaching is load-bearing.

Grades: [P] paper or official documentation, [S] source read or on-device measurement, [W] blog or forum, [U] unverified inference.

---

## 1. How badly a real building distorts the field

**The reference field at Fulham.** Computed from IGRF coefficients for 51.48 N, 0.195 W on 2026-09-29 [S, ppigrf evaluation]: total field F = 49.11 µT, horizontal component H = 19.58 µT, inclination I = 66.51 deg, declination D = 1.17 deg. NOAA's WMM-2025 calculator agrees on declination, 1.184 deg, uncertainty 0.38 deg [S]. The global surface range is 22,000 to 67,000 nT [P, BGS]. The dip angle matters: the field vector points 66.5 deg into the ground, so the horizontal component the compass actually uses is only 2.5x smaller than the total. London is a middling place for this; at 51 deg N nothing helps.

**The conversion from anomaly to heading error.** A horizontal disturbance d arriving perpendicular to the field produces a worst-case heading error of atan(d / H) [computed]:

| Perpendicular horizontal anomaly | Worst-case heading error in London |
| --- | --- |
| 1 µT | 2.9 deg |
| 2.5 µT | 7.3 deg |
| 5 µT | 14.3 deg |
| 10 µT | 27.1 deg |
| 19.6 µT | 45.0 deg |
| 30 µT | 56.9 deg |

So 45 degrees needs an anomaly equal to the horizontal component: 19.6 µT, which is 40 percent of the total field.

**Measured indoor figures, by source:**

| Source, building | Measured figure | Grade |
| --- | --- | --- |
| Li 2012, UNSW office building | Total intensity 1.345x Earth field in an office, 1.344x in a garage, 1.909x in a computer lab 3 m from a lift; stable over 24 h (std 0.001 to 0.007 normalized, roughly 0.05 to 0.35 µT) | P |
| Li 2012, near two lifts | Walking past lifts at 30 cm, inclination swings between 55 and 70 deg over a 14 m line; per-axis intensity across a 4.6 m squared office area spans X 0.315 to 0.411, Y minus 0.267 to near 0, Z up to 1.005 (normalized to Earth total) | P |
| Chung 2011, MIT steel-and-concrete lab building | Heading deviation along a 25 m corridor "varies significantly with position" with structure-correlated peaks (values in figures, not text); adjacent fingerprint points 60 cm apart differ by a minimum RMS of 1.96 µT | P |
| Ouyang 2022 survey | Earth surface 23 to 62 µT; an industrial phone reading 125.19 µT mean sat far outside it, and ellipsoid calibration brought it onto the iPhone's 47.63 µT level | P |
| Zhu 2023 | Heading error from traditional smartphone APIs "can escalate to around 20 degrees in a span of mere minutes"; names "electronic devices or steel reinforcements within buildings" as the sources | P |
| SkySafari vendor doc | Solid-state compass "can easily be wrong by ten degrees or more" | P (vendor) |

**Rebar and reinforced concrete.** Zhu names steel reinforcement directly [P]. Li's office numbers are a steel-frame concrete building, and its ordinary office spot already sits at 1.345x Earth field, rising to 1.9x near the lift shaft [P]. No source I could reach isolates "rebar alone" from the rest of the structure. The honest statement: reinforced concrete buildings are the normal environment in every one of these surveys, and their typical interior anomaly is tens of percent of Earth's field, which is 10 to 30 µT in London terms.

**Victorian terrace specifics.** COULD NOT VERIFY any measured microtesla figure for cast-iron radiators or pipework. I searched for a UK survey covering Victorian housing stock and found none; the results were radiator retail pages. What the physics says: cast iron is a high-permeability soft ferromagnetic, so it concentrates flux without being a permanent magnet; that is exactly the soft-iron distortion class in the VectorNav primer, which notes soft iron warps the measurement sphere into an ellipsoid [P]. The measured analogue available is Li's lift shaft: a large ferromagnetic mass at 3 m lifted the total field 42 percent above Earth's [P]. A cast-iron radiator within a metre of the standing spot belongs in the same class and could plausibly contribute 10 to 20 µT. That figure is [U], bounded by the lift measurement.

**Brick itself is weakly magnetic and small.** No source attributes meaningful anomaly to fired clay brick alone [U, absence of evidence in the surveys I read].

**Electrical wiring and underfloor heating are mostly red herrings for heading.** Domestic wiring and heating elements carry AC at 50 Hz. A compass measures the DC vector; a sinusoidal field aliases into sample noise rather than a steady direction change. The WHO compilation of appliance fields measures AC: can opener 0.72 to 16.3 µT at 30 cm, microwave 0.06 to 5.4 µT, fan up to 8.6 µT, printer up to 4.3 µT, all collapsing below roughly 0.85 µT at 1 m [P, WHO data via GreenFacts]. The compass-relevant part of an appliance is its permanent magnets: speaker drivers, fridge-door seals, motor magnets. Those are DC and bend the heading.

**Typical versus worst case for heading error indoors:**

| Regime | Heading error | Evidence |
| --- | --- | --- |
| Typical interior spot, fused or well-calibrated | 2 to 5 deg | Ouyang survey's 4.72 deg fused corridor average [P] |
| Typical interior spot, raw path | 5 to 20 deg | Zhu's 20 deg API figure [P], SkySafari's "ten degrees or more" [P] |
| Near identifiable steel or electronics | 20 to 60 deg | Li's lift corridor inclinations [P], the anomaly-to-error table above [computed] |
| Worst documented in the field | 90 to 180 deg | R6's S21 and couch reports [W] |

45 degrees sits inside the documented range, above typical, and is exactly what a 19.6 µT perpendicular anomaly produces in London. It is not an extraordinary claim. It is also not what this room did, per the four correct phones, which is the more useful finding.

## 2. How sharply the distortion varies with position

The indoor-positioning field exists because the anomaly field is spatially unique and stable. The measured spatial scales:

| Distance scale | What changes | Source |
| --- | --- | --- |
| 1.6 cm | Two locations in a 2x2x2 m volume were distinguishable with a sensor array, in Chung's informal desktop test | P |
| 5 cm | Li's fine grid spacing resolved distinct per-axis fingerprints across a 4.6 m squared area | P |
| 12 cm | A laptop, a phone and a wrist watch stopped producing more than 1 µT RMS of change beyond this distance (2008 MacBook Pro) | P |
| 30 cm | Li placed their sensor this close to two lifts and recorded the largest swings in the study; inclination ranged 55 to 70 deg along the walk | P |
| 60 cm | Chung's corridor sampling pitch; the minimum RMS difference between adjacent points was 1.96 µT, so even adjacent cells differ measurably | P |
| 1 m | Moving objects' effect on the field is "very limited and almost non-existent" | P, Ouyang survey |
| 1.3 m | Chung's elevator anomaly fell below 1 µT RMS at this distance | P |
| Building scale | Overlapping corridors on different floors have related but non-identical signatures; total-intensity peaks correlate but magnitudes differ | P, Chung |

Two consequences for this diagnosis. First, the owner stood in one spot and got two answers from six phones, so the difference at that spot is carried by the devices, not by position; a 30 cm difference in hand position cannot produce 45 degrees unless a magnet-class source is within tens of centimetres, which section 5 quantifies. Second, the field is stable in time: Chung measured cosine similarity 0.9977 between fingerprints six months apart [P], and Li measured 24 h standard deviations of 0.05 to 0.35 µT [P]. The room's anomaly is a fixture. Whatever is measured there on Tuesday holds for months, which makes the device-side procedures in section 9 repeatable.

## 3. Why gyro fusion resists distortion and a raw magnetometer does not

This is the mechanism question, so it gets the source treatment. The AOSP software fusion is a Kalman filter over a quaternion plus gyro bias, `Fusion.cpp` in `services/sensorservice`, read from the Android 9 tree and re-read from the Android 13 tree. The constants are identical in both [S].

**The explicit magnitude gate, verbatim from source [S]:**

```cpp
/*
* The geomagnetic-field should be between 30uT and 60uT.
* Fields strengths greater than this likely indicate a local magnetic
* disturbance which we do not want to update into the fused frame.
*/
static const int MAX_VALID_MAGNETIC_FIELD = 100; // uT
...
static const float MIN_VALID_MAGNETIC_FIELD = 10; // uT
```

And the rejection in `handleMag` [S]:

```cpp
const float magFieldSq = length_squared(m);
if (magFieldSq > maxValidMagFieldSq) {
    return BAD_VALUE;
} else if (magFieldSq < MIN_VALID_MAGNETIC_FIELD_SQ) {
    return BAD_VALUE;
}
```

On Android 9 the maximum is overridable by the system property `ro.fusion.magfield.max`; on Android 13 it is a compile-time constant [S]. A third rejection exists: if the magnetic vector is nearly parallel to gravity (cross product magnitude squared below 1e-3), the sample is discarded, which catches the pole case and the disturbed-vertical case [S].

So the direct answer to the brief's specific question: yes, Android's fusion gates on field magnitude, but the gate is 10 to 100 µT, not the nominal 22 to 67 µT of Earth's surface range [P, BGS]. The gate is deliberately wider than Earth's field. It catches magnitude outliers: MagSafe pucks, speakers, the 104 µT the 3T measures on this desk (section 6). It does not catch direction: a 45-degree rotation of the field at 55 µT total passes straight through. That distinction decides what fusion can and cannot fix here.

**The time-constant argument, from the same source [S].** The filter's prediction step integrates gyro output with `DEFAULT_GYRO_VAR = 1e-7 (rad/s)^2/Hz` and a gyro-bias random walk of `1e-12`; the correction step weighs the magnetometer with `DEFAULT_MAG_STDEV = 0.1 µT`. In plain terms: the gyro is modelled as nearly noiseless over short windows, the magnetometer as very clean in direction. Each magnetometer update pulls the attitude toward magnetic north with a strong gain; between updates the gyro carries the attitude alone. A disturbance lasting a second or two moves the heading only by the fraction the update gain allows before the gyro pulls it back; a disturbance that persists pulls the heading all the way, because the filter has no model for "the field itself is wrong here", only for noise around a trusted mean. The no-gyro mode (`FUSION_NOGYRO`, the geomagnetic rotation vector) uses `GEOMAG_GYRO_VAR = 1e-4`, a thousand times noisier gyro modelling, which is why the geomagnetic rotation vector wobbles: it must lean on the magnetometer continuously [S].

**What the raw path lacks.** `expo-location` on Android computes the heading with `SensorManager.getRotationMatrix(rotationMatrix, inclinationMatrix, mGravity, mGeomagnetic)` from the accelerometer and the calibrated magnetometer [S, LocationModule.kt:646, per R3]. `getRotationMatrix` applies no magnitude test and no anomaly rejection; the javadoc only warns the result "may be inaccurate" in strong fields [P, Android docs, per R3]. Whatever the HAL calibration leaves behind passes into the heading unfiltered. The HAL ellipsoid calibration (section 5) removes fixed internal distortions; it cannot know that the room bends the field, because the room's bend is identical from the phone's perspective to Earth's field being somewhere else.

**One correction to the clean story.** On the 3T the rotation vector comes from the QTI sensor hub in hardware, not from this AOSP software path; `dumpsys sensorservice` reports all three framework fusions disabled with 0 clients [S, on-device, and R3]. The AOSP constants are the documented platform behaviour and the vendor implementation is opaque; COULD NOT VERIFY the QTI hub's own gating thresholds. The 3T's rotation vector does exist and delivers data; its `values[4]` accuracy estimate reads 0.00 at rest, which R3 read as unpopulated. The gating mechanism is therefore evidenced at the platform level, not proven inside this phone's chip.

**Does the gate explain a 45-degree split on its own?** Partly. If the two failing phones sat in a field locally pushed past 100 µT by something the four newer phones' fused paths rejected, the raw path would absorb the full distortion while the fused paths coasted on the gyro. The 3T measures 104 µT on this desk today [S], so fields of that size are real in this flat's geometry. But in the bedroom, at arm's length, mid-room, a 100+ µT field would also have bent the four fused phones during their convergence, and they read correct. The residual explanation is the calibration state, which is section 5 and section 6.

## 4. The limit of that resistance

**A fused phone in a uniformly distorted room converges to the wrong north.** The Kalman update treats the magnetometer as a trusted direction reference with 0.1 µT noise [S]. A steady field rotation inside the 10 to 100 µT gate is, to the filter, indistinguishable from Earth's field pointing somewhere else. The gyro carries the heading for seconds; the magnetometer corrects it over minutes; the end state matches the raw phone's answer, just arrived at more smoothly. Fusion resists transients and rejects outliers; it does not manufacture a reference it never had.

**How long convergence takes.** COULD NOT VERIFY a wall-clock constant. No public source gives the reconvergence time; R6 searched for the same number and also failed. What exists: the gain structure above [S], R4's finding that display-side filters run 0.05 to 0.5 s time constants on top, and field reports describing corrections landing over seconds to minutes of movement [W, R6]. The behavioural answer from R6's sources: deliberate varied motion fixes it fast ("immediately" per Google's figure-of-eight copy [P]), sitting still never does.

**What this means for row 40's fix in this room.** Two scenarios, both concrete:

1. If the bedroom's standing spot were uniformly distorted by 45 degrees, the four fused phones would agree with each other on the wrong answer. They do not; they point true. So the spot is at most mildly distorted, and a fused 3T would have converged near the truth there. The fix helps.
2. If the 3T's error is a corrupted HAL calibration (an ellipsoid fit learned in a 64 to 104 µT desk field, section 6), the fused path inherits it, because the QTI hub fusion and the AOSP software fusion both consume the calibrated magnetic_field sensor, type 2, downstream of the same ellipsoid fit [S, sensor stack structure]. The sensor swap alone would not have fixed the bedroom reading. The recalibration prompt is not decoration; it is the repair.

The design consequence matches R6's states proposal: ship the fused path, keep the calibration coaching keyed to the accuracy signal, and never let the needle's smoothness read as truth.

## 5. Hard-iron and soft-iron, defined and quantified

**Definitions, from the VectorNav inertial navigation primer [P]:**

- **Hard-iron** is a magnet attached to the device or moving with it: a speaker magnet, a magnetized screw, a MagSafe puck clipped to the back. It adds a constant vector to every measurement in the phone's body frame. It shifts the measurement sphere off-centre.
- **Soft-iron** is permeable material near the sensor that distorts the ambient field without generating one: the phone's own steel shields, a laptop's hinge, a radiator nearby. It scales and skews the sphere into an ellipsoid.
- Hard iron usually contributes more to total uncorrected error than soft iron [P, VectorNav].

**How phone OSes calibrate it out.** The phone collects magnetometer samples across many orientations and fits an ellipsoid, then maps it back to a centred sphere; the offset is the hard-iron bias and the matrix is the soft-iron correction [P, Meta/LaValle; P, VectorNav]. A minimal fit needs four linearly independent orientation points; a good fit needs hundreds [P, LaValle]. This is what the figure of eight feeds. On Android the fit lives in the sensor HAL, below the framework; the calibrated stream is magnetic_field (type 2) and the raw stream is magnetic_field_uncalibrated (type 14), whose extra three values are the current bias estimate [P, Android docs; S, 3T dumpsys shows both].

**Measured magnitudes.** The 3T's stored bias right now is (-34.34, 14.10, -75.92) µT, magnitude 84.5 µT, constant across every sample in the buffer [S, on-device]. That is the phone's internal hard iron, dominated by its own speaker and camera magnets, and it is normal: the iPhone 13 Pro's own magnet array measures 68.8 mT at 0.1 mm on the back and 5.2 mT on the front [P, Khalil 2023]. The calibration exists to cancel exactly this.

**Uncalibrated hard iron's heading error follows the same table as section 1.** A residual uncorrected bias of 5 µT horizontal gives 14 degrees at worst heading, 10 µT gives 27 degrees, 19.6 µT gives 45 degrees [computed]. Note the shape: hard-iron error is sinusoidal against heading, worst when the bias points perpendicular to the field, zero when aligned. A constant 45-degree offset at every heading is NOT classic hard or soft iron; it indicates a reference error (a wrong declination application, an axis remap, or a stale fused yaw). R3 verified expo-location's declination sign bug exists but costs at most about 2.4 degrees in London, where declination is +1.18 [S, R3].

**External magnet sources at distance, quantified:**

| Source | Field at distance | Heading effect in London | Grade |
| --- | --- | --- | --- |
| MagSafe charger alone | 108.4 mT at 1 mm; falls to 1 mT (1000 µT, 20x Earth) at 25 mm | At 10 cm roughly 15.6 µT by inverse cube from the 25 mm anchor: up to 38 deg worst case. At 15 cm roughly 4.6 µT: 13 deg. At 20 cm roughly 2 µT: 6 deg | anchor [P, Khalil 2023]; falloff [U, computed] |
| iPhone 13 Pro magnet array | 68.8 mT at 0.1 mm back, 5.2 mT front | A second phone pressed back-to-back sits in the mT range | P |
| Fridge magnet | 1 to 10 mT at surface | 1000 µT at 1 cm falls to about 30 µT at 3 cm and 10 µT at 4.6 cm by inverse cube: tens of degrees within 5 cm | surface [W, Wikipedia orders of magnitude]; falloff [U] |
| Phone speaker | exceeds 1 mT near surface, below 1 mT by 12 mm on the measured unit | A magnetic case closure or wallet flap sits in exactly this range | P, Khalil 2023 |
| Magnet shipment box | 2 µT at 1 m | About 6 deg at 1 m if perpendicular | W, K&J Magnetics |

The K&J Magnetics bench note adds the persistence observation that matters for section 6: after magnet experiments their iPhone "doesn't show the same overall field strength when we twist the phone around in different directions", which they read as having magnetized an internal component, and the change outlived the magnet's removal [W].

**Calibration duration and motion.** Google's instruction: "move your phone in a figure 8 motion a few times. This should immediately result in a more accurate direction" [P, per R6]. NXP's sensor team describes the same fit needing "a minute or so" of varied orientations [W, NXP community]. The motion requirement is orientation diversity, not the figure-eight shape specifically: any motion sampling well-separated directions feeds the ellipsoid fit [P, LaValle].

## 6. The dev-desk hypothesis

Both failing phones live on a desk near a laptop, cables and possibly magnetic accessories. I measured the 3T's field environment on its desk, read-only, while it sat there.

**Measured.** `adb shell dumpsys sensorservice`, MMC3416PJ calibrated magnetometer [S, on-device]:

| Wall time | Reading (x, y, z) µT | Magnitude |
| --- | --- | --- |
| 15:26 | 44.28, -18.86, -42.03 | 63.9 µT |
| 16:16 | -6.3, 39.05, -95.25 | 103.1 µT |
| 16:31 | -6.45, 38.88, -96.63 | 104.4 µT |

True London field: 49.11 µT [S, IGRF]. The desk environment holds the phone in a field 1.3 to 2.1x Earth's, and the latest readings sit ABOVE the AOSP fusion gate of 100 µT. The variation across the hour is position on the desk and orientation; magnitude independence from orientation is what a perfect calibration would give, and 64 versus 104 µT shows the desk field is grossly inhomogeneous at phone scale. This matches Chung's measured scale: an object's influence becomes negligible beyond about 12 cm, so a laptop docking position of a few cm decides tens of µT [P].

**How close does a laptop or charger need to be?** From section 5's table: a MagSafe-class source produces up to tens of degrees of heading deflection at around 10 cm, low single digits by 20 cm, negligible at 30 cm [anchor P, falloff U]. A laptop's speaker and hinge magnets are one to two orders weaker than a MagSafe ring but sit closer; Chung measured a 2008 MacBook Pro becoming negligible past 12 cm [P]. Modern laptops with NdFeB speakers are stronger than 2008 parts [U]. A charging phone lying on a MagSafe puck is in a 1 mT-plus field at the back cover, 20x Earth [P].

**Does the offset persist after the phone is moved away?** Two separate mechanisms with opposite answers:

1. **The desk's field distortion does not persist.** The field is attached to the desk. Pick the phone up, walk to mid-room, and the external anomaly is gone in the same instant; there is no hysteresis in air [P, physics; consistent with Li's 24 h stability at a fixed point, which is stability, not stickiness].
2. **The calibration corruption does persist.** If the ellipsoid fit ran while the phone lived in the desk's 64 to 104 µT environment, the learned hard/soft-iron correction absorbs part of that local field. Carried to mid-room, the correction subtracts a vector that is no longer there, rotating the measured direction. This persists until the fit re-runs on fresh motion in the new spot. Evidence for persistence of calibration error: K&J's magnetized-component observation [W]; R6's field reports of calibration holding wrong for days and needing "recalibration daily or so" [W]; and the mechanism is structural, since the bias lives in the HAL and survives sensor client restarts [S, stack structure]. Whether the 3T's bias survives a reboot is vendor behaviour I could not test without disrupting the device.

**Verdict on the hypothesis.** The desk is demonstrably a distorted-field environment for the failing 3T, strong enough to cross the fusion gate, and it plausibly corrupts calibration in exactly the way the bedroom observation needs. But it is not proven to be THE cause: I could not measure the phone's state in the bedroom, and the bedroom's own field is unmeasured. What the desk measurement does prove is that "the phone was fine outdoors yesterday" is not evidence against calibration corruption today, and that the 45-degree split needs a device-carried explanation, because the four fused phones were correct at the same spot.

## 7. What the platforms tell users, and whether the figure of eight still works

**Google.** The instruction has been stable since 2016: "move your phone in a figure 8 motion a few times. This should immediately result in a more accurate direction" [P, per R6]. The canonical causes named are "charging your phone or walking by a metal pole" [P, per R6]. Maps renders accuracy as beam width and gates its calibrate flow on a Low/Medium/High status [P/J, per R6].

**Apple.** The historical system HUD (ring of tick marks, red ball) still exists as an opt-in delegate (`locationManagerShouldDisplayHeadingCalibration`) but is rarely shown; current guidance is "use your compass normally. It will calibrate automatically", and the real control is buried at Settings, Privacy and Security, Location Services, System Services, Compass Calibration [P/W, per R6]. Turning that toggle off silently degrades every map's cone [W, per R6]. `CLHeading.headingAccuracy` going negative documents invalid heading under strong interference [P, Apple, per R2/R6].

**Is the figure of eight vestigial?** No. The underlying consumer is the HAL's ellipsoid fit, which needs orientation diversity on current hardware exactly as it did in 2011 [P, LaValle; S, the type 2 and type 14 sensor pair on the 3T]. The fusion above it resists disturbances better than the raw path, so the gesture is needed less often, but a corrupted or stale fit is only repaired by fresh varied motion. R6's field reports (calibration fixing fused phones "immediately" after figure eights) show the gesture still reaches the fused path on modern devices [W]. The motion takes seconds; a full cold recalibration with poor motion can drag over a minute [W, NXP].

**Does calibration survive a reboot?** COULD NOT VERIFY on the 3T; testing it requires rebooting the owner's device, which I did not do. The bias lives in the vendor sensor HAL, and behaviour varies by vendor [U]. R6's iOS field reports include calibration surviving screen-off and app restarts [W]. Treat reboot persistence as unknown and design so it does not matter: the app's coaching triggers on the accuracy signal, not on boot events.

## 8. Verification methods that need no external reference

The owner rejected sun and landmark checks. Everything below uses the phones themselves, plus read-only `adb` on the 3T. Procedures are minute-scale.

### 8.1 Read the raw field magnitude (the single best test)

**Principle.** Field magnitude is independent of which way the phone points. A yaw rotation changes the components, never the vector length. So the magnitude splits the two hypotheses cleanly: far from 49 µT means local distortion or a broken calibration; near 49 µT with a wrong heading means the direction reference is corrupted (calibration or fusion state), not the room.

**Reference value.** 49.1 µT at Fulham, tolerance roughly plus or minus 2 µT for calibration quality [S, IGRF; P, BGS global range]. A phone in a magnetically clean spot with a healthy calibration reads between about 45 and 53 µT.

**On the 3T, read-only, no install [S, proven today]:**

```bash
adb shell dumpsys sensorservice | grep -A 4 "Magnetometer: last"
```

Take the three values, compute the root of the sum of squares. Repeat at the bedroom's standing spot, mid-room, and by the radiator or window.

**Interpretation.**

| Reading at the standing spot | Conclusion |
| --- | --- |
| 45 to 53 µT | The spot is clean. A 45-degree heading error there is the phone's calibration or reference, not the room. Do 8.4, then re-read the heading. |
| 55 to 70 µT | Moderate distortion, 10 to 30 degrees of heading risk. Move a metre and re-read before trusting any phone. |
| Above 70 µT or below 35 µT | Heavy distortion or failed calibration. The AOSP fusion gate would reject above 100 µT. Nothing trustworthy here. |

Also read the uncalibrated sensor's trailing bias values in the same output (`Magnetometer Uncalibrated: last 10 events`, values 4 to 6) [S, observed today]: the bias magnitude is the phone's internal hard iron, 84.5 µT on the 3T today. If the bias vector changes after the figure of eight, the calibration re-ran.

**On the XS.** No `adb` path exists. The built-in Compass app shows no magnitude. Use 8.2 and 8.3 comparatively instead, or read the number from any already-installed app that displays µT.

### 8.2 Rotate two phones together (splits constant versus heading-dependent error)

Hold the 3T and a correct phone back to back, both flat, screens up, edges aligned. Rotate the pair slowly through a full circle over about 30 seconds. Log both headings at each 30-degree step (a second person helps; otherwise pause at each step).

- If the difference between the two headings is CONSTANT across the circle, the error is a fixed reference offset: a stale fused yaw, a wrongly applied declination, or a remap. Hard and soft iron cannot produce a constant offset at every heading.
- If the difference OSCILLATES once per revolution (peaks at some heading, near zero 180 degrees later), it is classic hard or soft iron: residual bias or a mis-fit ellipsoid. The peak amplitude approximates the worst-case error.
- If the difference WANDERS without period, suspect a stalled or diverged fusion stream (R6's stalled state).

This needs no external north and no second trusted app. Two minutes.

### 8.3 The rotate-180 test (the error-follows check, one phone, no reference)

Stand at the bedroom spot. Pick a visible fixed object, any object. Point the phone's top edge at it, note the heading h1. Turn the phone precisely 180 degrees in the horizontal plane (top edge now pointing away from the object, same spot, same height), note h2.

- Clean phone, clean field: h2 minus h1 is exactly 180 (within a degree or two).
- If the difference is NOT 180, the error at that pair of orientations is real. Repeat with the phone initially pointed at four different objects around the room. The deviations trace the distortion curve of that spot for that phone.
- Now the follow check from the brief: if the deviation stays attached to the same ROOM direction as you rotate (the same absolute bearing always reads wrong by the same amount), the field is distorted from that direction; a source north of you bends readings taken facing north. If the deviation stays attached to the same PHONE edge (the phone always reads wrong by the same amount relative to its own body, whichever way it faces), it is the phone's calibration or frame, because the room cannot know which edge is which.

One minute per orientation set.

### 8.4 Walk the room map (finds the gradients and the sources)

Carry one phone flat at chest height, walking slowly. On the 3T, a helper can run the 8.1 command at each corner; solo, watch any installed compass app's magnitude readout, or simply watch for the heading slewing while you walk a straight line: a real gradient shows as a smooth swing that reverses when you walk the line backwards.

Walk four straight lines: wall to wall across the room's short axis, long axis, diagonal, and a tight circle at the standing spot.

- A heading that swings more than about 10 degrees along a 3.5 m wall-to-wall walk indicates a gradient source: radiator, pipework, embedded steel, a speaker on a shelf. Li's measured gradient scale says a metre of approach to a ferromagnetic mass moves the field by percent of Earth's total [P].
- A circle at the standing spot that closes back on its starting heading says the spot itself is self-consistent; the phone reading 45 degrees off there is carrying the error.

Five minutes for the whole room.

### 8.5 Recalibrate in place, then re-read

At the standing spot, after 8.1 confirms the magnitude is near 49 µT, do the figure of eight for about 20 seconds, then re-read the heading and the magnitude. If the heading jumps toward the four correct phones, the corrupted-calibration explanation is confirmed and repaired in one step. If the magnitude changes by more than about 3 µT during the recalibration, the previous calibration was absorbing room field, which is the desk mechanism of section 6 caught in the act.

---

## COULD NOT VERIFY

- **The QTI sensor hub's gating constants on the 3T.** The rotation vector is vendor-fused in hardware; the AOSP software fusion (whose 10 to 100 µT gate I read in two Android generations) is disabled with 0 clients on this phone. Tried: dumpsys sensor lists and fusion states (vendor binary exposes no thresholds), AOSP source for the vendor HAL (not public). The 3T's fused path therefore has a documented mechanism but an unverifiable constant.
- **The |F| at the bedroom's standing spot.** The owner did not run the procedure during this session; my on-device readings are desk readings. The bedroom claims rest on the four correct phones as negative evidence.
- **The XS's calibration state and any iOS-side magnitude read.** No `adb` path to a physical iPhone; the built-in Compass app shows no µT.
- **Reboot persistence of the 3T's magnetometer bias.** Testing requires rebooting the owner's device, which this read-only session did not do. Nothing in AOSP source pins vendor persistence behaviour.
- **A wall-clock reconvergence constant for fused heading after a disturbance.** No public source quantifies it; R6 searched independently and also failed. The gain structure in `Fusion.cpp` bounds it qualitatively only.
- **Radiator-specific microtesla figures for Victorian housing stock.** No measured survey found in searches; the claim is bounded by Li's lift-shaft measurements, not directly measured. Tried: UK survey searches, building-materials research via the Ouyang survey's citations.
- **Li 2012's exact per-position heading deviations.** The paper's numbers live in raster figures; the text gives the ranges I quoted (inclination 55 to 70 deg near lifts, per-axis intensity spans across the grid).

## Sources

| Grade | Source | Used for |
| --- | --- | --- |
| S | AOSP `services/sensorservice/Fusion.cpp`, Android 9 (LineageOS lineage-16.0 mirror) and Android 13 (lineage-20.0 mirror), fetched 2026-09-29 | The 10 and 100 µT gates, cross-product rejection, gyro and mag noise constants, FUSION_NOGYRO parameters, comment on 30 to 60 µT intent |
| S | IGRF evaluation for 51.48 N, 0.195 W, 2026-09-29 via ppigrf (IGRF-14 coefficients), cross-checked against NOAA WMM-2025 declination 1.1835 deg | F 49.11 µT, H 19.58 µT, I 66.51 deg, D 1.17 deg |
| S | OnePlus 3T read-only `adb shell dumpsys sensorservice`, 2026-09-29 15:26 to 16:31 | Desk field magnitudes 63.9, 103.1, 104.4 µT; stored bias (-34.34, 14.10, -75.92) µT; MMC3416PJ calibrated and uncalibrated streams; rotation-vector quaternion; fusion states disabled |
| P | Li, Gallagher, Dempster, Rizos, "How feasible is the use of magnetic field alone for indoor positioning?", IPIN 2012 (PDF fetched and text extracted) | 24 h stability figures, office 1.345x and computer lab 1.909x normalized intensity, lift proximity 3 m and 30 cm, inclination 55 to 70 deg, 4.6 m squared grid variation, 5 cm and 30.5 cm grids |
| P | Chung, Donahoe, Schmandt, Kim, Razavai, Wiseman, "Indoor location sensing using geo-magnetism", MIT Media Lab 2011 (PDF fetched) | Corridor heading deviation variability, 1.96 µT adjacent-point RMS at 60 cm, 12 cm small-object scale, 1.3 m elevator scale, six-month stability 0.9977, 1.6 cm resolution |
| P | Ouyang et al., "A Survey of Magnetic-Field-Based Indoor Localization", Electronics 11(6):864, 2022 (and the analysis paper PMC9183029) | Earth range 23 to 62 µT, iPhone XS Max 47.63 µT versus Bluebird 125.19 µT, ellipsoid calibration restoring agreement, moving-object negligible at 1 m, building-material anomaly framing |
| P | Zhu et al., "Improving Indoor Pedestrian Dead Reckoning for Smartphone-Based Localization", Sensors 2023, PMC10708641 | 20-degree API heading error within minutes, rebar and electronics as named interference sources, fused single-step error averages |
| P | Khalil et al., "High-Fidelity 3D Stray Magnetic Field Mapping of iPhone 12 and 13", PMC9919430 | MagSafe charger 108.4 mT at 1 mm and 1 mT at 25 mm, phone arrays 68.8 mT at 0.1 mm, camera 13.3 to 35.5 mT, speaker exceeding 1 mT, 25 mm AIMD recommendation |
| P | VectorNav, "Magnetometer Hard and Soft Iron Calibration", inertial navigation primer | Hard versus soft iron definitions, sphere-to-ellipsoid model, hard iron dominating uncorrected error |
| P | Meta / LaValle, "Magnetometer", developers.meta.com blog | Ellipsoid fit mechanics, four-point minimum, calibration imperfection growing with distance from reference orientation |
| P | WHO appliance field compilation via greenfacts.org | AC fields at 30 cm and 1 m: can opener, microwave, fan, printer values; the AC versus DC distinction |
| P | BGS, "An Overview of the Earth's Magnetic Field" | Global surface total intensity 22,000 to 67,000 nT |
| W | Wikipedia, "Orders of magnitude (magnetic field)" | Refrigerator magnet 1 to 10 mT at surface |
| W | K&J Magnetics, "iPhone Magnetic Measurements" | 2 µT at 1 m for a magnet shipment; persistent calibration change after magnet exposure |
| W | NXP community, magnetometer calibration threads | "A minute or so" of varied orientations for a full fit |
| P | Apple, `CLHeading.headingAccuracy` documentation; Google figure-of-eight guidance (both via R2/R6, primary) | Negative accuracy semantics, calibration copy and cadence |
| S | Sibling reports R2 (iOS heading), R3 (Android heading), R6 (field evidence), this plan's directory | expo-location raw path location, values[4] behaviour, fusion disabled on 3T, field report grades, declination bug bound |

Every computed figure in this report derives from the anchors above by arithmetic stated inline (atan(d/H) conversions, inverse-cube falloff, quaternion yaw, vector magnitudes) and is reproducible from the cited numbers.
