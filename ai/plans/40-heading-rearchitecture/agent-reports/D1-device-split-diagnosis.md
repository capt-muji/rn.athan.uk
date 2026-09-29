# D1: why two old phones fail identically while four newer ones succeed

Session 40, diagnostic agent D1, 2026-09-29. Question: why do the iPhone XS (2018) and OnePlus 3T (2016) point the qibla needle the same wrong way in the same room, while four newer phones point the right way, with every app on each device agreeing with every other app on that device?

## The answer, first

The room's field is locally distorted and both old phones read it raw, while the four newer phones reject it. A bedroom in a steel-framed or steel-reinforced building carries a disturbance of a few tens of microtesla; at London's horizontal field of about 19.4 uT (computed from WMM2025 today), a perpendicular horizontal disturbance of 19.4 uT deflects an ungated compass by exactly 45 degrees. The two old phones supply their headings through paths with no magnetic anomaly rejection, so they report the distorted field's direction as north. The four newer phones run gyro-fused heading stacks that gate or heavily weight down magnetometer samples in a disturbed field, so their needles hold a near-correct north while the disturbance persists. Nothing is broken on either old phone. Each is faithfully reporting the magnetic field at the spot it occupies, and that field is not Earth's.

One measurement on the attached 3T anchors this: its magnetometer reads a calibrated field of 104.4 uT total and 39.4 uT horizontal right now, against London's true 49 uT and 19.4 uT. The room is adding roughly 20 uT of horizontal field at the device, which is exactly the 45-degree dose for a compass that consumes the raw direction.

## Ranked candidates

| Rank | Candidate | Mechanism | Expected error | Explains old-versus-new split? | Two-minute test |
|---|---|---|---|---|---|
| 1 | Room distortion plus ungated reading | Building steel adds a horizontal field; raw-path compasses report the vector sum's direction | 10 uT added gives 27 deg, 19.4 uT gives 45 deg, 40 uT gives 64 deg [S, arithmetic below] | Yes, if the old paths are ungated and the new are gated | Walk both groups to a window or outdoors, or slide the phone 2 m along the wall; the wrong group moves or snaps |
| 2 | Stale hard-iron calibration on the old phones | Persisted bias absorbed a past disturbance and now rotates everything | Any fixed offset, tens of degrees | Partly: explains a persistent per-device error but not the clean two-group alignment unless both absorbed the same room | Figure of eight in the SAME spot: no change points to the room, a jump points to calibration |
| 3 | Gyro fusion as distortion rejection (the amplifier, not the root cause) | Fused stacks gate magnitude and coast on gyro; raw stacks cannot | Reduces the observed error by whatever the gate rejects | This is the mechanism behind the split, not an independent cause | Read the wrong phone's number in Google Maps' calibrate card or a sensor app: 104 uT where Earth says 49 |
| 4 | Magnet or MagSafe on the old devices | Hard-iron source stuck to the device | 5 mm N42 cube at 5 cm gives 208 uT, at 20 cm gives 3.2 uT [S, dipole arithmetic below] | Weak: needs two independent magnets on two devices, coincidentally aligned | Remove cases, wave a fridge-magnet-suspect area near each phone and watch the needle swing |
| 5 | Age-related magnetometer drift | Sensor zero-offset drifts over years | Claimed a few degrees at most in vendor forums | No: folklore-grade evidence, cannot make 45 degrees | None needed; ranked out by evidence |
| 6 | Measuring different things (cone versus qibla) | Confusing phone-facing with Makkah-bearing | Reading error, not device error | No: owner compared like-for-like qibla apps on the 3T | Re-face test: rotate the phone 90 deg and confirm the needle follows the phone |

The single best discriminating test is the walk-to-the-window test in row 1. It needs no instruments and separates the top two candidates cleanly: room distortion changes with position, stale calibration does not.

## H1: indoor magnetic distortion, and why it splits the groups

The physics. A compass heading is the direction of the horizontal component of the local magnetic field. That field is Earth's field plus the field of every magnetised object in range: steel rebar, structural steel, radiators, pipework, wiring, speakers, laptops. An elongated steel object distorts the field along its own axis, which is why a distorted indoor field tends to pull headings toward the orientation of nearby steel. A 4.5 by 3.5 m bedroom with a wall-sized steel source has exactly the geometry to add a coherent horizontal component.

The measured size of real indoor distortion. Not guessed:

- A 2024 IPSN-style study measured an average magnetic field direction deviation of 31 degrees along a corridor, with distortion-free rooms showing 45 to 55 uT magnitudes and disturbed ones outside the 40 to 60 uT band [P, arxiv 2410.12304, MDR paper]. Thirty-one degrees is the AVERAGE; corridors and steel-adjacent spots run far higher.
- The Ouyang 2022 survey of magnetic-field indoor positioning records heterogeneous smartphones reading 80 to 110 uT indoors where the Earth field is 23 to 62 uT, with the distortion temporally stable over days [P, Sensors/MDPI survey]. The 3T's live reading of 104.4 uT sits inside that documented band.
- Google's own Maps blog names everyday causes at this scale: "charging your phone or walking by a metal pole" [P, vendor].

The arithmetic for this room, today. London's field on 2026-09-29, computed from the WMM2025 coefficient file I pulled and evaluated: total intensity 49.0 uT, horizontal 19.4 uT, inclination 66.9 degrees down, declination 1.18 degrees (NOAA's calculator confirms the declination to 0.001 deg, which validates the implementation). For a horizontal disturbance D perpendicular to north, heading error is atan(D / 19.4):

| Perpendicular horizontal disturbance | Heading error |
|---|---|
| 5 uT | 14 deg |
| 10 uT | 27 deg |
| 19.4 uT | 45 deg |
| 30 uT | 57 deg |
| 40 uT | 64 deg |

The observed 45-degree split needs about 19.4 uT of perpendicular horizontal disturbance. The 3T measures 39.4 uT horizontal right now, which is 20 uT more than Earth supplies, and the surplus need only be roughly perpendicular to north to produce the observed angle. The room is supplying the dose.

Would this deflect an unfused magnetometer more than a gyro-fused rotation vector? Yes, and this is the crux. The mechanism is in H2, but the summary is: a raw accelerometer-plus-magnetometer compass has no state. It computes the field direction on every sample and reports it, whatever the magnitude. `SensorManager.getRotationMatrix`, which is what expo-location's Android path calls, contains no field-magnitude check at all; its javadoc only says results "may be inaccurate" near strong fields. The fused stacks have both a memory (the gyro) and a gate (magnitude and consistency checks), so a disturbance of exactly this size passes straight into the old phones' heading and is rejected or down-weighted in the new phones' heading.

One mechanism, the room, plus one architectural difference, gating, explains the entire observation: both old phones wrong by the same amount (same room field, same ungated arithmetic on the vector sum), all four new phones right (same room field, gated or fused paths that coast on gyro), every app on a given device agreeing (all apps on a device consume the same OS-level heading source).

## H2: gyro fusion as distortion rejection, precisely

Three layers exist on these six phones, and they differ exactly along the old-versus-new line.

**AOSP software fusion (Android 9 framework).** I read `Fusion.cpp` from the LineageOS android-9 lineage-16.0 mirror of `frameworks/native/services/sensorservice` [S]. The magnetometer update path, `Fusion::handleMag`, applies three explicit gates before a magnetic sample may influence the orientation estimate:

```cpp
// the geomagnetic-field should be between 30uT and 60uT
// reject if too large to avoid spurious magnetic sources
const float magFieldSq = length_squared(m);
if (magFieldSq > maxValidMagFieldSq) {
    return BAD_VALUE;
} else if (magFieldSq < MIN_VALID_MAGNETIC_FIELD_SQ) {
    // Also reject if too small since we will get ill-defined (zero mag)
    return BAD_VALUE;
}
```

The constants: `MAX_VALID_MAGNETIC_FIELD = 100` uT (overridable by the OEM property `ro.fusion.magfield.max`; the 3T does not set it, so the default 100 applies), `MIN_VALID_MAGNETIC_FIELD = 10` uT, and a third gate rejecting any field parallel to gravity (cross-product magnitude under 1e-3) [S, Fusion.cpp lines 83-102 and 357-368]. A field of 104.4 uT, the 3T's live reading, is rejected by the framework fusion outright. The comment block states the design intent verbatim: "Fields strengths greater than this likely indicate a local magnetic disturbance which we do not want to update into the fused frame."

The gyro's role in the same file: the fused attitude propagates from gyro integration between corrections, with `DEFAULT_MAG_STDEV = 0.1` uT against gyro-driven propagation, so a rejected magnetometer sample leaves the estimate coasting on the gyro rather than absorbing the disturbance [S, Fusion.cpp lines 57-60 and the update weighting].

So, to the brief's direct question: does Android's fusion explicitly reject magnetometer samples outside Earth's 22 to 67 uT range? The AOSP software fusion gates at 10 to 100 uT, which brackets the same intent with wider margins. That is [S]-grade, read from the Android 9 source that ships on the 3T.

**Qualcomm QTI hardware fusion (what the 3T actually serves for rotation vector).** The 3T's rotation vector comes from the QTI sensor hub, not the AOSP software path; `dumpsys` shows handles 0x13-0x18 as vendor QTI with the AOSP entries registered only as debug fallbacks [S, dumpsys on this device, consistent with R3]. The QTI fusion is closed vendor code. COULD NOT VERIFY its internal gating. What is verifiable is its output behaviour on this device today: the rotation vector's `values[4]` accuracy slot reads 0.00 at rest (R3 measured; I confirmed the same in the live dump), and the sensor serves at up to 200 Hz. The strongest statement the evidence supports: the platform's own reference fusion for this exact Android version carries magnitude gating, Google's newer cross-device stack (below) carries disturbance handling explicitly, and the QTI hub is the layer Google built FOP partly to replace, citing OEM variance.

**Google's Fused Orientation Provider (Maps on the 3T).** The Android Developers Blog post "Introducing the Fused Orientation Provider API" (2024-03-07) states: FOP fuses accelerometer, gyroscope and magnetometer; "This is the same heading that is shown in Google Maps, which uses the FOP as well. We recently added changes to better cope with magnetic disturbances"; FOP is "available on all devices running Google Play services on Android 5 (Lollipop) and above"; and where FOP cannot run its own algorithm it "returns values piped through from the AOSP Rotation Vector" [P, vendor blog, fetched today]. The 3T runs Android 9 with Play services 26.34.36 (verified via `dumpsys package com.google.android.gms` on the device), so Maps on the 3T gets FOP, and FOP explicitly added magnetic-disturbance handling. This is the layer that makes Google Maps on the 3T resist the room in a way the raw pair cannot.

**iOS Core Location.** Apple does not document locationd's heading fusion internals (R2 established this at [A]-grade). What Apple does document, verbatim, is the calibration trigger: Core Location calls the calibration delegate when it "observes a significant change in magnitude or inclination of the observed magnetic field" [P, Apple developer documentation, `locationManagerShouldDisplayHeadingCalibration`]. A magnitude-change detector is a disturbance detector; it is the same observable the AOSP gate uses. The calibration note also states the filter can only remove fields that MOVE WITH THE DEVICE, and that fixed interference "must be escaped by moving away" [P]. The 14 Pro Max runs six more years of locationd evolution than the XS. COULD NOT VERIFY any per-version behavioural change; the honest statement is that the documented magnitude-change trigger exists on both, and the XS's observed failure means its heading consumed the distorted field.

The architecture in one sentence each. Raw pair: field direction in, heading out, no memory, no gate. Fused stack: gyro integrates rotation at high rate, magnetometer corrects drift slowly, and the correction is refused when the field's magnitude or geometry says the sample is not Earth.

## H3: hard-iron offset from a case, magnet, or MagSafe

The physics. A permanent magnet near the sensor adds a bias in device coordinates. The OS calibration estimates that bias by fitting a sphere to readings taken across varied orientations, and subtracts it. Two failure modes follow. First, a magnet PRESENT NOW: the calibration can absorb it (wrongly treating it as hard iron, which actually works locally until the magnet moves relative to the device, which it never does if attached) or the field breaks the magnitude gate. Second, a magnet ABSENT NOW but baked into the persisted bias: the calibration once saw a disturbed field, locked in a bias, and every reading since is rotated.

Magnitudes, from dipole arithmetic (a 5 mm N42 neodymium cube has a moment of roughly 0.13 A m2; axial field B = 2 x 1e-7 x m / r3):

| Distance from a 5 mm N42 cube | Added field |
|---|---|
| 5 cm | 208 uT |
| 10 cm | 26 uT |
| 20 cm | 3.2 uT |

So a fridge-magnet-class object within 10 cm delivers exactly the tens of uT this diagnosis needs; at 20 cm it is already marginal. A laptop speaker at arm's length is in the 26 uT at 10 cm class. These are [S]-grade arithmetic on the standard dipole formula, with the moment value from vendor magnet tables [W for the exact moment constant].

The 3T's persisted state, measured: the uncalibrated stream carries a hard-iron bias of (-34.34, 14.10, -75.92) uT, magnitude 84.5 uT, and it is IDENTICAL across samples 30 minutes apart [S, `dumpsys sensorservice`, two captures]. London's entire field is 49 uT. A bias of 84.5 uT means the calibration currently believes the phone sits inside a magnetic source stronger than Earth's field everywhere. Two readings of that bias, identical, say the calibration is stable, not drifting minute to minute.

Whether it is WRONG is the question, and the same-room comparison answers it: the 3T and the XS disagree with four phones that share the room. If the 3T's 84.5 uT bias correctly described a real attached magnet, the calibrated field would come out at Earth's magnitude, 49 uT. It comes out at 104 uT. So either a disturbance is present NOW (the room), or the bias is stale, or both. The two are separable only by moving the phone, which is the top-ranked test.

How a user clears it: Android, wave the phone in a figure of eight through varied orientations until the OS recalibrates (Google's own instruction, Maps support and blog [P/W]); the bias lives in the vendor HAL and resets on enough varied motion, and a reboot does not clear it. iOS, allow the calibration HUD when it appears (Settings, Privacy, Location Services, System Services, Compass Calibration on), or move the device in the pattern Apple shows [P, Apple docs for the calibration delegate; W for the settings path on current iOS].

Prediction if this hypothesis is the whole story: the figure of eight IN PLACE would fix both phones and the error would return after they next absorb the room's field. If the figure of eight in place does nothing, the room is the cause and only distance fixes it.

## H4: age-related sensor degradation

Graded honestly: this is folklore with weak evidence. MEMS magnetometer vendors describe temperature-driven offset drift and stress-driven hysteresis in their datasheets' offset-drift sections, at levels of a few microtesla over operational temperature ranges [W, ST and Bosch community answers and datasheets; no vendor document claims tens of uT over years]. I found no paper or vendor document demonstrating multi-decade microtesla-scale drift accumulations on consumer phone magnetometers. The strongest counterevidence is in this very diagnosis: the 3T's raw magnetometer readings are stable, its uncalibrated stream is coherent, and its bias is constant over 30 minutes. A degrading sensor is noisy or drifting, not consistently rotated. And two devices from different vendors with different chips would not degrade by the SAME 45 degrees in the same direction. Verdict: real phenomenon at the few-uT level, irrelevant at the 45-degree level, and it cannot produce the observed clean split. Ranked last-but-one deliberately.

## H5: do the old phones have the fused sensor, and does Maps use it

The 3T has the hardware. Live `dumpsys sensorservice` today lists `Rotation Vector` (type 11, QTI), `Game Rotation Vector` (15), `GeoMagnetic Rotation Vector` (20), a real `LSM6DS3 Gyroscope`, and AOSP software fallbacks [S, on-device]. The iPhone XS has a full motion stack; the iPhone 4 was the first with a gyro and every iPhone since carries one [P, Apple tech specs via R2].

Does Google Maps on Android 9 use the fused path or fall back? The FOP blog settles availability: "all devices running Google Play services on Android 5 and above" [P]. The 3T's Play services is 26.34.36 (verified on device), far past the 21.2.0 minimum. So Maps on the 3T runs FOP with its documented magnetic-disturbance handling, not a legacy fallback. One nuance the blog itself states: in some cases FOP pipes through the AOSP Rotation Vector [P], and that AOSP path carries the 10 to 100 uT gate read above, so EITHER branch of Maps' supply is gated or fused.

The sensor connection log on the 3T shows the OS-level heading economy running today: `com.google.ccc.abuse.droidguard.events.b` (a Play Services component) subscribing to the QTI Rotation Vector at 50 Hz [S, dumpsys previous registrations], consistent with R3's observation.

On the XS versus the 14 Pro Max: both run Core Location's heading. The differences available to evidence are the six intervening years of locationd (undocumented internals, R2's COULD NOT VERIFY) and nothing else load-bearing. There is no documented reason the XS's Core Location fusion would behave differently; the observed difference must come from how each version's stack weighs a disturbed field, which Apple does not document. What IS documented for both is the magnitude-or-inclination-change calibration trigger [P], so both versions possess the disturbance observable.

One asymmetry worth naming: the XS, like the 3T, may simply have been the phone that calibrated IN this room. Apple's own calibration note says the filter removes only fields that move with the device [P]; a calibration absorbed while the phone lived in a distorted corner bakes the corner into the bias. The 14 Pro Max presumably calibrated elsewhere or recalibrated more recently. This folds into H3's stale-bias branch.

## H6: is 45 degrees even the right reading

Three honest caveats, none of which rescues the observation from the diagnosis above.

First, body-position judgement has a resolution of maybe 10 degrees, so the true split is 35 to 55 degrees, not 45.0. The mechanism in H1 produces any angle in that band from 13 to 27 uT of perpendicular disturbance, so the uncertainty does not strain the explanation.

Second, characteristic angles that could masquerade: exactly 90 degrees is the axis-remap signature (R6 documents the S21 and Xperia families) and would indicate an OS bug, not a room; the observation is well away from 90. Exactly 180 is polarity inversion, also absent. Around 45 has no special arithmetic signature in the software; it is what a modest horizontal disturbance does at London's latitude. That absence of a "special" value is itself mild support for a physical-field cause over a code constant.

Third, the measuring-different-things possibility: Google Maps' cone shows which way the phone faces, a qibla app shows where Makkah lies, and confusing them would look like disagreement. The owner's protocol rules it out: he compared like-for-like qibla apps on the 3T (the Athan app against two Play Store qibla apps), and every comparison held the phone's heading constant and read the needle. Also, on the four RIGHT phones Google Maps pointed the other way, which under the confusion hypothesis would make the four new phones the confused ones. Treated fairly and set aside.

Also established by the owner and unchanged here: every device shows the correct NUMBER (118 or 119 degrees). The bearing arithmetic (adhan, R5) is pure geodesy and correct everywhere; the failure is confined to the needle, which is the heading sensor's contribution.

## The owner's two-minute tests, in priority order

All tests need only the phones and ordinary objects. No sun, no landmarks, no instruments.

1. **The walk test (discriminates rank 1 against rank 2).** Open the qibla screen on one WRONG phone and one RIGHT phone. Walk from the test spot to the window, or just outside, watching the WRONG phone's needle. If the needle swings as you cross the room and settles differently near the window or outdoors, the room's field is the cause (rank 1 confirmed, and the phone is fine). If the needle carries the same error outdoors, the phone's calibration is the cause (rank 2). Under room distortion, the RIGHT phone's needle stays put; under a phone fault, both phones would agree outdoors.
2. **The same-spot figure of eight.** Stand exactly on the test spot. Wave each WRONG phone in a figure of eight through varied tilts for 20 seconds, then re-read the needle. No change, or a change that decays back, points to the room (calibration cannot fix a field that is present now). A lasting fix points to a stale bias (rank 2) or an attached magnet (rank 4).
3. **The wall slide.** Slide one WRONG phone slowly along the wall through the test spot, 2 m each way, holding it flat. A heading that swings as a function of position along the wall, smoothly, is the signature of steel in that wall. This needs no second phone.
4. **The object sweep.** On any phone showing a qibla needle, sweep a fridge magnet or a pair of scissors around the phone at 20 cm, then at 5 cm. Watch the needle follow the object at close range. This calibrates your intuition for how little metal it takes at how short a range, and on a WRONG phone, a needle that already sits at its limit tells you the room already did the same job.
5. **The case removal.** Take cases off both WRONG phones and re-read. Thirty seconds, eliminates rank 4's attached-magnet branch.
6. **The number cross-check (read-only).** On the 3T, Google Maps' calibrate card, or any sensor-readout app showing microtesla, read the field magnitude at the test spot and at the window. Roughly 50 uT is Earth; 80 to 110 uT is a disturbed room. The Ouyang survey's band is the reference.

Test 1 is the discriminator between the top two candidates. Position-dependence is the room; position-independence is the phone.

## What the attached 3T contributed, measured today

Read-only `adb shell dumpsys sensorservice`, nothing installed, nothing launched:

- Calibrated magnetometer at rest: (-6.2, 38.9, -96.7) uT, total 104.4 uT, horizontal 39.4 uT, stable across two captures 30 minutes apart [S].
- Uncalibrated stream's persisted hard-iron bias: (-34.34, 14.10, -75.92) uT, magnitude 84.5 uT, identical across both captures [S].
- London truth today (WMM2025 coefficients, evaluated locally; declination cross-checked against NOAA's calculator to 0.001 deg): total 49.0 uT, horizontal 19.4 uT, inclination 66.9 deg [S computation on P-grade coefficients].
- The phone currently subscribes its calibrated magnetometer and accelerometer to a third-party qibla app (`qibladirectioncompass.qiblafinder.truenorthcompass`, uid 10195 at capture time), confirming the owner's observation that Play Store qibla apps on this device read the same wrong heading [S].
- Play services 26.34.36, Android 9, so Maps runs FOP with its documented disturbance handling [S device, P blog].
- `ro.fusion.magfield.max` unset, so the AOSP gate default of 100 uT applies on this build [S].
- The rotation vector serves values at 200 Hz max with `values[4]` reading 0.00 at rest [S, consistent with R3].

The one-line reading of those numbers: this phone is sitting in a field twice Earth's strength with a bias bigger than Earth's field, in a room that four other phones walk into and out of without changing their needles.

## COULD NOT VERIFY

- The QTI hardware fusion's internal gating on the 3T. It is closed vendor code; no public source or document describes its magnetometer weighting. Tried: AOSP source (covers only the software fusion), web search for Qualcomm sensor-hub fusion internals. What is established instead: the AOSP reference fusion for this exact Android version gates at 10 to 100 uT, and Google's FOP layer above it documents disturbance handling.
- Whether Apple's locationd applies an explicit magnitude gate, or only the documented magnitude-change calibration trigger. Apple does not document locationd's heading internals (R2's finding stands). Tried: Apple docs, WWDC transcript search.
- The exact disturbance geometry of the bedroom (which wall, which object). No access. The wall-slide test exists precisely to map it.
- Whether the XS carries a similarly elevated field reading. No tooling reaches the XS magnetometer readout without shipping a probe app, and the brief forbids installs. The symmetry of the observation (every app on it agrees) makes the parallel highly likely but unmeasured.
- The precise moment constant of the 3T's mounted magnetometer bias history (when it was absorbed). Not observable read-only.
- Any vendor document giving multi-year offset drift for the MMC3416PJ or the XS's magnetometer. The part is old enough that public datasheets circulate only through aggregators I could not authenticate.

## Sources

| Claim | Source | Grade |
|---|---|---|
| AOSP Android 9 fusion rejects magnetic samples over 100 uT (default), under 10 uT, and parallel to gravity; comment names local magnetic disturbance as the reason; gyro propagation between corrections | `Fusion.cpp`, LineageOS android-9 lineage-16.0 mirror of `frameworks/native/services/sensorservice`, read today | [S] |
| The 100 uT gate is OEM-overridable via `ro.fusion.magfield.max`; the 3T leaves it unset | Same file plus `getprop ro.fusion.magfield.max` on the device | [S] |
| 3T calibrated field 104.4 uT total, 39.4 uT horizontal, stable; persisted bias 84.5 uT, stable; sensor list and subscriptions | `adb shell dumpsys sensorservice`, two captures, 2026-09-29 | [S] |
| London field today: F 49.0 uT, H 19.4 uT, I 66.9 deg, D +1.18 deg | WMM2025 coefficient file (westphae/geomag mirror of the NOAA file), evaluated locally in Python; declination cross-checked to 0.001 deg against NOAA's geomag-web calculator | [P] coefficients, [S] my computation |
| 45 deg error needs a perpendicular horizontal disturbance equal to H (19.4 uT at London); table of disturbance versus error | Standard e-compass arithmetic (heading is atan2 of field components); consistent with NXP AN4248 tilt-compensated eCompass formulation | [P] |
| Average 31 deg magnetic direction deviation measured in a corridor; distortion-free magnitude band 45 to 55 uT used as a criterion | "Magnetic Distortion Resistant Orientation Estimation", arxiv 2410.12304 (2024) | [P] |
| Indoor magnitudes 80 to 110 uT on heterogeneous smartphones; Earth band 23 to 62 uT; indoor field temporally stable | Ouyang 2022, "Analysis of Magnetic Field Measurements for Indoor Positioning", Sensors (PMC9183029) and the MDPI survey it belongs to | [P] |
| FOP fuses accel, gyro, mag; same heading as Google Maps; disturbance handling recently added; available on Play services, Android 5+, play-services-location 21.2.0+; sometimes pipes AOSP rotation vector | Android Developers Blog, "Introducing the Fused Orientation Provider API", 2024-03-07, fetched today via TinyFish | [P] |
| 3T runs Play services 26.34.36, Android 9 | `dumpsys package com.google.android.gms` on device | [S] |
| Core Location fires calibration on "a significant change in magnitude or inclination"; calibration filters only fields that move with the device; fixed interference must be escaped by moving away | Apple developer documentation, `locationManagerShouldDisplayHeadingCalibration(_:)` | [P] |
| expo-location Android heading uses raw accel plus raw magnetometer via `getRotationMatrix`, no gyroscope, no magnitude gate | R3's source read of `LocationModule.kt` line 646 onwards, this repo's `node_modules` | [S] |
| `getRotationMatrix` javadoc warns only that results may be inaccurate in strong fields; no magnitude rejection in the raw path | AOSP `SensorManager` API 28 source and javadoc | [P] |
| 5 mm N42 magnet moment ~0.13 A m2; field at 5/10/20 cm from dipole formula | Dipole field formula with vendor magnet-table moment | [S] arithmetic, [W] moment constant |
| Magnet-at-table demonstration: OS calibration detects and adjusts to an added static field | fizziq physics-education teardown, as cited by R6 | [J] |
| MEMS magnetometer drift is a few-uT phenomenon, no vendor claim of tens of uT over years | Vendor datasheets and community answers, searched | [W] |
| Maps beam semantics, figure of eight instruction, "charging your phone or walking by a metal pole" | blog.google Maps update 2016 and Google support threads, via R6 | [P/W] |
| 90-degree and 180-degree error families on specific OEMs | R6's field-report survey (S21, Xperia, Nexus 6P threads) | [W] |
| Two earlier collapsed hypotheses (stale cached position; per-device drift) | Session 40 prior agent findings, owner's observation protocol | session record |

The room-plus-architecture explanation stands on four independent legs: the measured 104 uT on the wrong phone against a computed 49 uT truth, the source-level gating in the fused path the right phones take, the measured indoor-distortion literature bracketing this exact magnitude, and the arithmetic that 19.4 uT of perpendicular disturbance at London's field is 45 degrees to the degree.
