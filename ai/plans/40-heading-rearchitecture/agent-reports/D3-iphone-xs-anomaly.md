# D3: the iPhone XS anomaly

No public evidence says the XS's Core Location heading pipeline differs from the 14 Pro Max's. Apple documents no generation difference in `CLHeading` fusion, and no teardown or reverse engineering establishes one. The best-supported explanation is per-device: the XS carries a bad magnetometer calibration state (a learned hard-iron or soft-iron offset from a magnetic case, mount or past magnet exposure), or degraded magnetometer hardware. Every app on the XS reads the same `CLHeading`, which is why Athan, Apple Maps and Google Maps all point the same wrong way on that phone and only that phone. This does not confirm the sibling's gyro-fusion split on iOS. It breaks it: nothing public supports "old iPhone unfused, new iPhone fused". A 20-minute owner test with the built-in Compass app discriminates the hypotheses with zero third-party software (procedure below).

Scope: why the owner's iPhone XS points roughly 45 degrees off while the iPhone 14 Pro Max, held beside it, is right. The Android phones and the general fusion theory belong to sibling reports.

Grades: [A] Apple official documentation, SDK headers read from disk, Apple support pages. [S] read or measured directly by me on this machine or on the connected XS. [J] teardown or journalism. [W] forum, blog, Reddit: evidence of a user experience, not of a mechanism. [U] unverified.

## Q1. Does the XS have a gyro, and does Core Location use it?

The XS has a gyro. Apple's spec page lists "Three-axis gyro", "Accelerometer", "Barometer" under Sensors and "Digital compass" under Location [A, support.apple.com/en-us/111881]. The connected device confirms iPhone11,2, A12, iOS 18.7.10 [S, `xcrun devicectl device info details`].

Whether Core Location feeds that gyro into `CLHeading` is not documented, on any generation:

- `CLHeading.h` (iPhoneOS 27.0 SDK, read from disk): "Represents a vector pointing to magnetic North constructed from axis component values x, y, and z." No sensor list [A].
- WWDC 2017 session 704 remains the strongest Apple statement: it presents gyro fusion as the new Core Motion heading's feature ("We now provide heading ... Fuses accelerometer, gyroscope, and magnetometer") and describes Core Location's heading as one that "can fuse course" (GPS) [A, as established in R2].
- The service dates to iOS 3.0 on the gyro-less iPhone 3GS (`startUpdatingHeading` is `API_AVAILABLE(ios(3.0))`, CLLocationManager.h) [A].

So the honest position, matching R2: `CLHeading` fusion is undocumented, and nothing public says it changed between the XS (2018) and the 14 Pro Max (2022). If Core Location's heading is unfused on both, the 14 Pro Max's correctness comes from its magnetometer quality or calibration state, not from a fusion upgrade. If it is fused on both, the XS's error comes from the same two suspects. Either way the split needs a per-device cause. No credible locationd reverse engineering exists to settle it [A absent; R2 searched too].

## Q2. Magnetometer hardware, XS versus 14 Pro Max

What teardowns establish:

| Generation | Finding | Grade |
|---|---|---|
| iPhone 5S | Magnetometer is AKM AK8963 (Asahi Kasei 3-axis electronic compass IC) | [J, TechInsights 5S teardown] |
| iPhone 8 / X | Custom Bosch Sensortec 6-axis IMU (accelerometer plus gyro), replacing InvenSense; magnetometer not in that package | [J, SystemPlus teardown via PRNewswire] |
| iPhone XS / XS Max | TechInsights full teardown identifies AP, modem, PMICs, cameras, NFC, RF. It does not name the magnetometer part or vendor. Sensors appear only as a combined "Connectivity & Sensors" cost line ($18) | [J, TechInsights XS Max teardown, fetched] |
| iPhone 14 Pro Max | No public teardown I could reach names its magnetometer either | COULD NOT VERIFY |

Sensor hub lineage: M7 (NXP LPC18A1), M8 (LPC18B1), M9 through M11 embedded in the A9 through A11. With the A12, the chip in the XS, Apple stopped naming a motion coprocessor at all and folded the role into the SoC's always-on domain [J, Wikipedia motion coprocessor article citing Chipworks and iFixit]. No source documents a heading-fusion change at any step of that lineage.

Repair-world context: XS-generation compass IC failures are a real repair category. One documented case has Apple support diagnosing a defective compass/barometric sensor on a 1.5-year-old XS Max; the repair techs in the thread dispute the diagnosis but confirm the compass is a separate IC on its own bus [W, iFixit answer 623124].

Verdict: no known generational magnetometer change between XS and 14 Pro Max is documented anywhere I could reach. The claim "the XS has a worse magnetometer" is plausible and unproven. One counter-signal worth recording: the 14 Pro Max contains a permanent MagSafe magnet ring and still reads correctly, so modern Apple calibration handles a fixed internal magnet. The same mechanism (learning a device-fixed offset) is exactly how an external magnet on the XS would poison its calibration. That is inference, not a sourced mechanism.

## Q3. iOS version differences (XS tops at 18.x, 14 Pro Max runs iOS 26)

No documented change to the heading pipeline exists in either range:

- iOS 18 developer release notes (full JSON fetched and searched): zero occurrences of CoreLocation, compass, heading or magnet; no Core Location section exists in the document [A].
- iOS 26 developer release notes (full JSON fetched and searched): same result, zero occurrences [A].
- No Apple release note, support note or WWDC session between iOS 12 and iOS 26 describes a change to compass fusion, calibration triggers or `CLHeading` behaviour. Searched release notes, dev forums via web search, and the current User Guide.

Forum reports of post-update compass errors exist but do not amount to a documented regression:

- An October 2024 Apple Communities thread reports wrong compass north on several devices after iOS 18 [W].
- A MacPowerusers thread (January updates) reports roughly 60 degrees of error across watch, phone and iPad [W]. The same thread contains an XS owner replying that their Compass app is correct, which cuts against "iOS 18.x breaks the XS compass" [W].
- A May 2026 Apple Communities thread reports Apple Maps direction wrong while the Compass app registers rotation correctly [W, snippet only, bot-blocked].

One real iOS 18-era software fact with compass relevance: the "Use True North" toggle's visibility. The current iPhone User Guide compass page no longer documents it [A, fetched], a January 2025 MacRumors thread reports it missing under Settings on 18.3 [W], while a March 2025 guide still documents it at Settings then Apps then Compass [W]. Whether the XS on 18.7.10 shows it, I could not check without driving the owner's Settings (see COULD NOT VERIFY).

Conclusion: a software difference between 18.7.10 and iOS 26 is not supported by any primary source. It remains possible and unverifiable. It cannot be the whole story anyway, because the OnePlus 3T errs the same way on Android 9.

## Q4. Known iPhone XS compass defects

There is no Apple acknowledgement, service program or published defect for XS compass accuracy. The pattern that does exist at [W] level:

- Launch week, September 2018, MacRumors thread "iPhone XS Max Compass Issue": a new XS Max whose heading is wrong in Google Maps on CarPlay, Apple Maps and the Compass app together. Toggling Compass Calibration, the figure of eight and reboots did not fix it. The thread continues to collect replies through at least the iOS 15 era [W, fetched].
- January 2019, Apple Communities "Compass calibration iPhone Xs": wrong compass fixed by toggling Compass Calibration off and back on in Location Services [W, snippet only, bot-blocked].
- The iFixit XS Max case above: Apple support diagnosing a defective compass/barometric sensor [W].
- A December 2022 r/iphone thread titled "Gyroscope issues" surfaced in searches as XS-related but the body is an iPhone 13 Pro with MagSafe interference; rejected as XS evidence [W, fetched and excluded].

So: XS-family compass complaints exist from launch, they have the owner's exact shape (every app wrong the same way on one device), and the community fixes are the calibration rituals. No mechanism is established by any of these threads. Note also the counterevidence in Q3: other XS owners report correct compass on the same iOS versions. This is a per-device condition, not a universal XS trait.

## Q5. Cases, magnets, and how iOS calibrates

Official statements:

- The Compass app guide: "Important: The accuracy of the compass can be affected by magnetic or environmental interference. Use the digital compass only for basic navigation assistance." [A, iPhone User Guide, fetched]
- The calibration delegate doc, quoted verbatim in R2 and re-fetched now: "The calibration process is able to filter out only those magnetic fields that move with the device. To calibrate a device that is near other sources of magnetic interference, the user must either move the device away from the source or move the source in conjunction with the device during the calibration process." [A]
- Same doc, on giving up: "Even if the alert is not displayed, calibration can still occur naturally when any interfering magnetic fields move away from the device. However, if the device is unable to calibrate itself for any reason, the value in the headingAccuracy property of any subsequent events will reflect the uncalibrated readings." [A]
- `CLHeading.h`: "A negative value indicates an invalid heading" for `headingAccuracy` [A]. That is the phone's own signal that it has given up. The app's stack bands it away before JS sees it (expo-location's `normalizeAccuracy`, R2).

The mechanism, assembled from those facts: a magnetic case, car mount or wallet clasp that stays on the phone moves with the device, so iOS absorbs it into the hard-iron model as a constant offset. The heading is then rotated everywhere, in every app, by a stable angle. That matches the owner's observation precisely: constant error, same direction across Athan, Apple Maps and Google Maps. Removal of the source alone does not instantly unlearn the offset; deliberate varied motion (the figure of eight) in a clean field re-fits the model.

The system calibration HUD: Core Location offers it only through the delegate. Trigger times are documented: "The first time heading updates are ever requested" and "When Core Location observes a significant change in magnitude or inclination of the observed magnetic field" [A]. If the app returns false or implements nothing, "Core Location does not display the heading calibration alert" [A]. The Athan app's iOS path implements nothing (R2 verified the bare passthrough), so this app will never surface the HUD, and on a phone whose calibration went bad slowly (magnitude drift below the "significant change" threshold) no app may show it. Users report the HUD has become rare on modern iOS generally [W, R6].

MagSafe specifically: the XS predates it, so the built-in ring is not a suspect on the XS. No Apple support note about magnets and the compass surfaced; Apple's archived magnet statement covers camera OIS and AF only [A, support.apple.com/102434, fetched]. Apple Communities replies confirm magnets disturb the compass [W].

## Q6. Forcing a full recalibration on iOS 18

There is no recalibration button anywhere in iOS. The full ritual, in the order I recommend, all steps verified against current sources:

1. Remove every magnetic accessory: case, wallet, mount plate, anything with a clasp magnet. This is the precondition; calibration cannot learn a clean field through a magnet.
2. Check the master toggle: Settings, Privacy and Security, Location Services, scroll to System Services, confirm "Compass Calibration" is on. The toggle exists on iOS 18.x [W, MacRumors 18.3 report and multiple 2025-2026 Apple Communities threads]. If it was off for months, that alone explains a degraded needle [W, R6's HN report].
3. Force a calibration reset cycle: toggle Compass Calibration off, lock the screen, wake it, toggle back on, return to the Compass app [W, blog.kchung.co ritual; the January 2019 XS thread reports exactly this fixing an XS].
4. Move away from interference: outdoors, or at least several metres from radiators, speakers, laptops, steel furniture and the car.
5. With the Compass app open, hold the phone flat and draw slow figure of eights, three to five times, tilting the phone through different orientations as you go. Apple's own documented pattern is "move the device in a particular pattern so that Core Location can distinguish between the Earth's magnetic field and any local magnetic fields" [A, delegate doc]. The figure of eight as the specific gesture is community knowledge, consistent across Apple Communities, Google's own guidance and every repair guide [W]. No Apple document names the gesture on iOS 18; treat it as the field-tested form of "move the device in a particular pattern".
6. Reboot if steps 1 through 5 change nothing, then repeat step 5 once.
7. Last resort before a hardware verdict: Settings, General, Transfer or Reset iPhone, Reset, Reset Location and Privacy. This clears location and calibration state without touching data [W, listed in the iPhone 16 compass thread's fix sequence].
8. Then re-test against a known reference (the 14 Pro Max or a street you know runs north-south).

Does the figure of eight still do anything on this generation? No Apple statement says it stopped, no Apple statement names it. Current Apple support replies say "use your compass normally, it will calibrate automatically" [W], and the delegate doc guarantees background calibration happens when interference moves away [A]. The honest grade: gesture [W], underlying motion-based recalibration [A].

## Q7. The built-in Compass diagnostic, and the north setting

The Compass app is a complete probe. It displays the live heading in degrees, a crosshair, coordinates and elevation; "For accurate bearings, hold iPhone flat to align the crosshairs at the center of the compass" [A, User Guide]. Its degrees number is a direct read of the device heading, which makes it cleaner than the Athan app for diagnosis: in Athan the big number is the computed qibla bearing (correct on every phone by geometry), while in the Compass app the number is what the sensor believes.

True versus magnetic north: the Compass app honours a per-device "Use True North" setting, historically at Settings then Compass, on iOS 18 under Settings then Apps then Compass [W]. The current User Guide no longer documents the setting [A by absence, fetched], and one 18.3 user reports it missing [W]. The two settings differ by exactly the local declination.

Declination at the test site: plus 1.18 degrees east (WMM2025, NOAA NCEI calculator, 51.48 N, 0.195 W, computed 2026-09-29, uncertainty 0.38 degrees) [A]. So one phone on true north and the other on magnetic north disagree by about 1 degree in Fulham. A 45 degree disagreement cannot come from this setting. The procedure below still sets both phones the same way, to remove even that 1 degree from the comparison.

The procedure, written for the owner:

1. On both phones: Settings, Privacy and Security, Location Services, System Services, confirm Compass Calibration is on. Record what you find. If the XS had it off, that is a finding on its own.
2. On both phones: open the Compass app, allow location if prompted.
3. On both phones: Settings, Apps, Compass, and set Use True North identically (both on, or both off). If the toggle is absent on one phone, set the other to match whatever the first shows, and note it. On equals magnetic plus roughly 1 degree in London, so this only removes noise.
4. Take both phones to the room where the error was seen. Remove both cases. Lay the phones flat, side by side, a hand's width apart, tops pointing the same direction, away from speakers, radiators and computers. Wait five seconds.
5. Read and write down the degrees on each phone.
6. Rotate both phones together by 90 degrees, keeping them parallel. Wait, read again. Repeat once more at 180 degrees.
7. Interpret the indoor pass: a constant difference at all three rotations means one phone's calibration or hardware is offset. A difference that changes with rotation means tilt or environment. Two phones that agree indoors were never disagreeing about the sensor.
8. Now go outdoors, twenty or more metres from cars, fences and buildings. Remove every accessory.
9. On the XS only: do the slow figure of eight three times (Q6 step 5).
10. Repeat steps 4 through 6 outdoors.
11. Interpret the outdoor pass:
    - XS still differs by roughly 45 degrees, constant across rotations, after the figure of eight and case removal: device-level proof of a bad calibration state or hardware fault on the XS. Zero third-party software involved. Take it to the Genius Bar with this result.
    - XS matches outdoors but not indoors: the room wins. The field at one hand position is not the field at another; the newer phone resists it or happened to sit elsewhere. Re-test with the phones swapping exact positions.
    - XS matches after the figure of eight or case removal: the offset was learned from an accessory. Re-introduce the case and re-test to name the culprit.
    - Both phones agree everywhere: the original observation was a held-differently or transient effect. Re-test the Athan app on both.

What each outcome proves: the constant-offset indoor and outdoor result is the clean device-level proof the brief asks for. It needs no app beyond the stock Compass, no account, no install.

## Q8. Can any setting produce roughly 45 degrees?

No. Enumeration with magnitudes:

| Setting | Where | Effect on heading | Can it make 45 degrees? |
|---|---|---|---|
| Use True North | Settings, Apps, Compass | Shifts displayed heading by local declination, plus 1.18 degrees in Fulham [A, NOAA] | No. Maximum about 1 degree here |
| Compass Calibration | Settings, Privacy and Security, Location Services, System Services | Gate on the calibration subsystem; off degrades accuracy over time, users report 90 to 180 degree errors [W] | Not a fixed rotation, but yes, it can produce large errors. Verify it is on. Not a 45 degree dial |
| Location Services for Compass | Settings, Privacy and Security, Location Services, Compass | Off removes coordinates and elevation; magnetic heading keeps working [A, User Guide] | No offset |
| Master Location Services | same path | Off removes true heading; magnetic heading still reported | No offset |
| Portrait orientation lock | Control Center | None. Heading is "referenced from the top of the device regardless of device orientation as well as the orientation of the user interface" [A, CLHeading.h] | No |
| Region, language, calendar | Settings, General | None touch the heading computation | No |
| Accessibility settings | Settings, Accessibility | None rotate headings. No compass-offset feature exists in the set | No |
| `headingOrientation` (developer API) | app code only | App-side reference rotation; default portrait; Athan never sets it (R2) | Not user-visible, not set |
| Reduce Motion, Zoom, Display Accommodations | Settings, Accessibility | Rendering only | No |

Plain statement: no user-visible iOS setting can produce a controlled 45 degree heading rotation. The only setting that shifts the reading at all moves it about 1 degree in London. The Compass Calibration toggle is the one setting whose absence can genuinely break the needle by large angles, so step 1 of the procedure checks it first. A steady 45 is the signature of a learned magnetic offset (Q5) or hardware, not of any switch.

## What this means for the sibling's fusion theory

The theory says old phones run unfused accelerometer plus raw magnetometer paths and deflect indoors, new phones run gyro-fused headings and resist. On iOS this theory has no public support at either end: Apple documents no fusion difference between XS and 14 Pro Max, and its one statement on the subject (WWDC17) attributes gyro fusion to Core Motion's heading, not Core Location's, without qualification by generation. If the theory survives at all on iOS, it survives as an unverifiable possibility about locationd internals. The per-device explanations (learned hard-iron offset, degraded sensor, calibration subsystem left off) explain every observed fact: same error across all apps on the XS, correct number with wrong needle, 14 Pro Max correct in the same room. The OnePlus 3T agreeing with the XS in direction is equally consistent with both old phones carrying bad calibration states in the owner's daily environment, and with a shared indoor field that only the newer phones resist. The Compass app procedure above separates those worlds without writing any code.

## COULD NOT VERIFY

1. The XS's magnetometer vendor and part number. The TechInsights XS Max teardown does not identify it and no other public source does. Tried: TechInsights (fetched), iFixit (XS Max teardown URL redirects to an unrelated guide), search across AKM, Bosch, STMicro teardown coverage.
2. The iPhone 14 Pro Max's magnetometer vendor. Same absence.
3. Whether `CLHeading` fusion on the XS differs from the 14 Pro Max in any way. Apple documents nothing; no reverse engineering exists; R2's signed on-device A/B probe remains unbuilt on this machine (no signing account, and installing would clobber the owner's app).
4. Whether the XS on iOS 18.7.10 still shows Use True North in Settings. The current User Guide omits it and one 18.3 user reports it missing; checking requires driving the owner's Settings UI, which this task forbids.
5. Any Apple acknowledgement of an XS compass defect or service note. None found in searches of support.apple.com, Apple Communities and MacRumors.
6. What the XS's Compass Calibration toggle is currently set to. Requires reading the owner's Settings.
7. Whether Apple's own apps implement `locationManagerShouldDisplayHeadingCalibration` on iOS 18. Their binaries are not inspectable here; behaviour is [W] only.
8. A live syslog read of compass activity on the XS. A 12-second `pymobiledevice3 syslog live` window with grep for locationd, compass, heading, calibration returned nothing: the phone was idle with no compass consumer running. I did not extend the capture because the owner is actively using the phone.
9. The exact reason the XS is wrong. This report ranks causes and supplies the discriminating test; it cannot name the cause from public evidence alone.

## Sources

| Grade | Source | Used for |
|---|---|---|
| [A] | `CLHeading.h`, `CLLocationManager.h` (`headingOrientation` deprecation, `dismissHeadingCalibrationDisplay`), iPhoneOS 27.0 SDK on disk | Heading construction wording, top-of-device reference, negative accuracy semantics |
| [A] | developer.apple.com `locationManagerShouldDisplayHeadingCalibration(_:)` (fetched, JSON endpoint) | HUD trigger times, "fields that move with the device", "headingAccuracy will reflect the uncalibrated readings" |
| [A] | iOS 18 and iOS 26 developer release notes (fetched JSON, full-text searched) | No Core Location or compass change in either |
| [A] | iPhone User Guide, "Use the compass on iPhone" (fetched) | Compass app behaviour, interference warning, crosshair guidance, location requirement; True North absent from current text |
| [A] | support.apple.com/en-us/111881, iPhone XS tech specs (fetched) | XS sensor list: three-axis gyro, accelerometer, barometer, digital compass |
| [A] | support.apple.com/102434 (archived HT208747), magnetic accessories and cameras | Apple's only magnet-interference statement found; covers cameras, not compass |
| [A] | NOAA NCEI geomagnetic calculator, WMM2025, computed 2026-09-29 at 51.48 N, 0.195 W | Declination plus 1.18 degrees, uncertainty 0.38 |
| [S] | `xcrun devicectl device info details` on UDID 00008020-0015585C22D2002E | iPhone11,2, iOS 18.7.10, connected and paired |
| [S] | 12-second `pymobiledevice3 syslog live` capture on the XS | No compass activity while idle |
| [J] | TechInsights, "Apple iPhone Xs Max Teardown" (fetched) | Full component identification absent a magnetometer part; sensor cost line |
| [J] | SystemPlus / ResearchAndMarkets, Bosch 6-axis IMU in iPhone 8/X (fetched) | Custom Bosch accel-plus-gyro part; magnetometer separate; no heading-fusion claim |
| [J] | TechInsights iPhone 5S teardown; AppleInsider 2009 | AKM held the magnetometer socket in earlier iPhones |
| [J] | Wikipedia, Apple motion coprocessors (Chipworks and iFixit references) | M7 through M11 lineage; naming dropped at A12, the XS's chip |
| [W] | MacRumors thread 2143823, "iPhone XS Max Compass Issue", Sep 2018, replies through iOS 15 era (fetched) | Launch-week XS-family all-apps-wrong compass, unresponsive to rituals |
| [W] | Apple Communities thread 250080991, "Compass calibration iPhone Xs", Jan 2019 (snippet; body bot-blocked) | XS compass fixed by Compass Calibration toggle cycle |
| [W] | iFixit answer 623124, XS Max compass/barometric sensor (fetched) | Apple support diagnosing defective compass sensor; techs disputing; separate IC |
| [W] | Apple Communities thread 255799914 (Oct 2024), thread 256292836 (May 2026, snippet) | Post-iOS-18 wrong-north reports, multi-device |
| [W] | talk.macpowerusers.com January-updates compass thread (fetched) | 60-degree error across devices; an XS owner reporting correct compass on same era |
| [W] | MacRumors thread 2447806 (fetched) and ios.gadgethacks.com (Mar 2025) | Use True North toggle location on iOS 18, reported missing for some on 18.3 |
| [W] | blog.kchung.co recalibration ritual (fetched) | Toggle, lock, wake, untoggle procedure |
| [W] | r/iphone ztsp8k (fetched and excluded) | Title suggested XS; body is iPhone 13 Pro with MagSafe. Recorded as rejected evidence |
| [U] | MagSafe-era calibration robustness inference (14 Pro Max carries a magnet ring and still reads true) | Inference in Q2 and Q5, labelled as such |
