# E2: OS version and device class compatibility matrix

Research agent E2, round 2, session 40. Scope: which Android versions, iOS versions and device classes have a working compass, which do not, what predicts it, and what the app can read at runtime to decide. Grades: [P] platform documentation or CDD, [S] source read or measured directly, [J] journalism or teardown, [W] forum or blog, [U] unverified. MEASURED, DOCUMENTED or INFERRED marks every load-bearing cell.

## The answer in five lines

On Android, every phone with accelerometer plus magnetometer plus gyroscope MUST ship `TYPE_ROTATION_VECTOR` under the CDD in force since API 9, so the OS version predicts almost nothing: a 2016 phone and a 2026 phone owe the same sensor. What predicts quality is the vendor fusion and calibration behind it, which the app cannot see and which fails per-device, per-firmware and per-environment, not per-version. On iOS, no release from 3.0 through 27 changed `CLHeading`'s contract; iOS 26 matters only as a device-class boundary (it drops the XS generation) and because TCC policing of motion tightened, not because heading behaviour changed. The two reliable runtime signals on both platforms are the presence of the fused sensor itself and the physics checks (field magnitude and dip against a model), not any vendor accuracy band. Roughly 5 to 15 percent of a UK audience sits on the questionable classes: sub-200-pound Androids with no gyroscope or no magnetometer at all, plus a tail of ageing flagships with stale calibration.

## 1. Android: the heading API timeline and where behaviour changed

API levels verified from the official `Sensor` reference constants table [P].

| Android release (API) | Sensor event | What changed for a compass user | Did visible behaviour change? | Grade |
| --- | --- | --- | --- | --- |
| 1.5 (3) | `TYPE_ORIENTATION`, `TYPE_MAGNETIC_FIELD`, `TYPE_GYROSCOPE` constants exist | Compass apps read the deprecated orientation sensor, raw and unfused | Baseline | [P] |
| 2.3 (9) | `TYPE_ROTATION_VECTOR` and `TYPE_GRAVITY` added | First fused orientation output; apps still had to opt in | Only for apps that switched | [P] |
| 4.3 (18) | `TYPE_GAME_ROTATION_VECTOR`, `TYPE_MAGNETIC_FIELD_UNCALIBRATED`, `TYPE_GYROSCOPE_UNCALIBRATED`, rotation vector `values[4]` accuracy slot added | Uncalibrated streams expose the hard-iron bias to apps; `values[4]` promises a heading-accuracy estimate (often unpopulated, see R3) | Marginal; no user-visible change | [P] |
| 4.4 (19) | `TYPE_GEOMAGNETIC_ROTATION_VECTOR` added | Documented no-gyro fallback: accelerometer plus magnetometer, "more noisy, works best outdoors" | Only on gyro-less phones | [P] |
| 4.4 (20) | `TYPE_ORIENTATION` deprecated in API 20 (KitKat MR2) | Legacy path officially discouraged; `getOrientation()` on a rotation matrix replaces it | No, legacy sensor kept working | [P] |
| 7.0 to 9.0 (24 to 28) | CDD restructures to conditional MUST: `TYPE_ROTATION_VECTOR` MUST exist when the device has all three base sensors; magnetometer itself stays SHOULD then STRONGLY RECOMMENDED | The compliance regime for the whole modern era settles. The AOSP software fusion's magnetic gate (10 to 100 uT default) is present in the Android 9 tree | No user-visible change; this is the stable contract the 3T lives under | [P] CDD, [S] Fusion.cpp |
| 10 (29) | No heading sensor change | Foreground-only restrictions on some sensors; compass unaffected | No | [P] |
| 12 (31) | Sensor rate limiting (200 Hz cap without permission) | Compass rates sit far below the cap | No | [P] |
| 13 (33) | `TYPE_HEADING` (type 42, true-north, degrees), `TYPE_GYROSCOPE_LIMITED_AXES` added | A direct true-north heading sensor finally exists; CDD requires the limited-axes type when a gyro has fewer than 3 axes | Minimal: adoption is sparse and `TYPE_HEADING` is only STRONGLY RECOMMENDED for Automotive in every CDD through 16, never required for Handheld | [P] API ref, [P] CDD 13 to 16 |
| 13 to 14 (33 to 34) | CDD tightens: `TYPE_MAGNETIC_FIELD_UNCALIBRATED` moves from STRONGLY RECOMMENDED to MUST when a magnetometer exists | Devices must expose the bias to apps | No user-visible change | [P] CDD 13 shows SR at C-1-10 slot wording; CDD 14 shows MUST |
| Any, March 2024 | Google Play services ships the Fused Orientation Provider (FOP), Android 5+ | Google's cross-device gyro-fused heading with documented magnetic-disturbance handling, "the same heading that is shown in Google Maps" | YES, the single largest quality change for users, delivered by Play services rather than the OS, so it reaches a 2016 phone | [P] Android Developers Blog 2024-03-07 |

Two structural facts from the CDD, checked across 4.4, 6.0, 7.0, 8.0, 9, 10, 11, 13, 14, 15 and 16 [P]:

- The magnetometer has never been mandatory. It reads SHOULD in 4.4 to 7.0, then "STRONGLY RECOMMENDED" ([C-SR-1]) from Android 10 onward. A compliant Android device can ship with no compass at all, and current budget phones do (MEASURED on specs: Samsung Galaxy A05 and A06 list accelerometer and proximity only, no magnetometer [J] GSMArena).
- `TYPE_ROTATION_VECTOR` is a conditional MUST: "include a 3-axis magnetometer, an accelerometer sensor, and a 3-axis gyroscope" then MUST implement it. The condition, not the OS version, is the gate. This sentence is byte-identical in intent from Android 4.4's "if an accelerometer sensor and a gyroscope sensor is also included" through Android 16's [C-2-1].

So the releases where compass behaviour changed for users are: API 9 (fusion first available), and March 2024 (FOP over Play services). No Android version bump in between changed what a compass app receives. The 3T on Android 9 with Play services 26.34.36 already runs FOP (MEASURED, D1).

## 2. Hardware versus software fusion on Android

What exists. Each fused sensor type is served either by a vendor implementation through the sensor HAL or by AOSP's software fallback in `SensorService`. The framework registers hardware sensors first and instantiates the AOSP `RotationVectorSensor` software fusion only when the HAL does not provide the type [S, R3's read of SensorService.cpp].

What the 3T shows, MEASURED today, read-only `dumpsys sensorservice`:

- Handles 0x00000013 through 0x00000022 (rotation vector, game RV, geomagnetic RV, orientation, gravity, linear acceleration) carry vendor `QTI` and are served by the Qualcomm sensor hub. Handles 0x5f636779 onward carry `AOSP` and are debug fallbacks.
- The sensor HAL processes are `android.hardware.sensors@1.0-service`, `vendor.qti.hardware.sensorscalibrate@1.0-service` and `sensors.qti` [S, `ps -A`]. The presence of a dedicated `sensorscalibrate` HAL is the vendor's calibration engine running as its own service.
- The "Fusion States" block reports all three framework fusions (9-axis, game, geomag) disabled with 0 clients [S]. Nothing framework-side runs.

Which one an app's request reaches: the QTI one, always. `getDefaultSensor(TYPE_ROTATION_VECTOR)` returns the first registered sensor of the type, which is the hardware QTI handle; the AOSP entries are registered with `isDebug` true and are reachable only by explicit handle selection [S, R3]. So on this device the app cannot choose AOSP software fusion, and cannot compare the two, without non-default APIs.

Does it matter for accuracy. The two implementations differ in one decisive way. The AOSP software fusion gates magnetometer samples: fields over 100 uT, under 10 uT, or parallel to gravity are rejected before they can influence the estimate, with the comment "Fields strengths greater than this likely indicate a local magnetic disturbance which we do not want to update into the fused frame" [S, Fusion.cpp in the Android 9 tree and still present on master, fetched today]. The 3T's live calibrated field of 104.5 uT would be rejected by that gate outright. The QTI hub's gating is closed vendor code; COULD NOT VERIFY (D1 tried as well). So on exactly this floor device, the fusion the app reaches is the one whose disturbance rejection is unknown, and the disturbance rejection that is documented is the one the app cannot reach.

Does vendor fusion quality vary enough to matter. Yes, and this is DOCUMENTED at the platform level rather than inferred: source.android.com's sensor-stack page states the default (AOSP) implementation "is not as accurate nor as power efficient as other implementations can be" and, more strongly, "The default sensor fusion implementation is not being maintained and might cause devices relying on it to fail CTS" [P]. That is Google telling OEMs to ship their own fusion, which guarantees fleet-wide variance. The variance shows up as: the stubbed-fusion family (an Android 10 board whose vendor fusion library returns zeros for every quaternion, so no compass app gets a heading at all [W, ST community thread with dumpsys attached, via R6]), the fixed-offset family (S21 Ultra and Xperia 5 IV reading 90 degrees clockwise in every app, calibration-immune [W, via R6]), and the fused-worse-than-raw family (Nothing CMF Phone 2 Pro, 2025, where a raw-sensor compass app fixed what the fused consumers could not [W, via R6])."

Is it knowable at runtime. Almost not at all. The framework exposes the vendor string (`Sensor.getVendor()`), which separates QTI from STMicro from AOSP but says nothing about fusion quality within a vendor. It exposes whether the sensor reports FIFO depth and rates, which correlates with a real sensor hub and nothing else. It does not expose gating thresholds, filter constants or calibration state. The honest runtime strategy is to treat the fused sensor as untrusted-by-default and verify it with physics (D4's magnitude and dip checks), not to attempt vendor fingerprinting.

## 3. iOS: the same timeline

Headers read from the on-disk iPhoneOS 27.0 SDK [S]; availability annotations are [P].

| iOS release | API or hardware event | What changed for a compass user | Grade |
| --- | --- | --- | --- |
| 3.0 (2009) | `startUpdatingHeading`, `CLHeading`, `headingAccuracy`, the calibration delegate | The heading service ships on the iPhone 3GS, which has a magnetometer and no gyroscope. The service is therefore architecturally gyro-independent at birth | [P] headers, [P] Apple 3GS specs via R2 |
| 4.0 to 5.0 | `CMAttitudeReferenceFrame` all four values; `CMMotionManager` attitude; `CMDeviceMotion.magneticField.accuracy` band | Core Motion offers app-side fusion with the magnetometer-corrected and north-referenced frames | [P] |
| 7 (2013, iPhone 5S) | M7 motion coprocessor (NXP LPC18A1) | Sensor collection and processing moves off the main CPU. M8 (LPC18B1) adds the barometer; M9, M10, M11 embed in A9, A10, A11 | [J] Chipworks and iFixit teardowns via Wikipedia |
| 7.0 | `CMAltimeter` and the pedometer-era sensitive interfaces; `NSMotionUsageDescription` regime begins later | No heading change | [P] |
| 11.0 (2017) | `CMDeviceMotion.heading` | Core Motion's own degrees heading in [0, 360), valid only under the magnetic or true-north frames. WWDC17 session 704 presents it as the API that "fuses accelerometer, gyroscope, and magnetometer", in contrast to Core Location's heading which "can fuse course" (GPS) | [P] header, [P] WWDC transcript via R2 |
| XS generation (2018) | A12; Apple stops naming a motion coprocessor and folds the role into the SoC's always-on domain | No documented heading-fusion change | [J] via Wikipedia |
| 14.0 | `CMDeviceMotion.sensorLocation` | Tells the app where the sensors physically sit; no behaviour change | [P] |
| 18.x (2024 to 2025) | Nothing. The CoreLocation and CoreMotion "updates" pages fetched today contain zero mentions of compass, heading or magnetometer changes; the June 2024 and later sections cover CLMonitor, CLLocationUpdate diagnostics and watchOS diving | No heading change | [P] developer.apple.com updates JSON, fetched this session |
| 26 (2025) | Device floor moves to iPhone 11 and second-generation SE; XS, XS Max and XR dropped | The 14 Pro Max runs heading code six years newer than the XS can. No release-note evidence of any heading, calibration or fusion change in between (D3 searched the full iOS 26 release notes JSON: zero hits) | [W] for the compatibility list, [P] for the absence in release notes |
| 26 | TCC hardened around motion: a dev-build reload with `motionPermission: false` got an app killed (`kTCCServiceMotion`) | Matters for `CMAltimeter` misuse patterns, not for `CLLocationManager` heading; the XS cannot run iOS 26 anyway | [W] expo/expo#45386 |
| 27 (2026) | `CMDeviceMotion.headingAccuracy` (degrees, `API_AVAILABLE(ios(27.0))`) | Core Motion finally gets the degrees accuracy that `CLHeading` has had since 3.0. Useless on any device this app supports | [S] header read |

Verdict on the XS anomaly, after digging harder as instructed: the generational-fusion theory remains unsupported on iOS, and one more piece of counterevidence surfaced this round. The CoreLocation updates page's dated sections run June 2024, and CoreMotion's run September 2024 and June 2024 and 2023; none mentions heading, compass or magnetometer at all [P]. Apple had multiple opportunities to document a fusion change and documented none, while documenting watch-diving and headphone-motion in detail. The 14 Pro Max's "High dynamic range gyro" and "High-g accelerometer" versus the XS's plain "Three-axis gyro" (MEASURED from Apple's own spec pages for both devices [P]) names better hardware but Apple attaches no accuracy claim to either phrase. D3's per-device explanation stands as the best supported: a learned hard-iron offset or a degraded calibration state on this particular XS. The XS-family launch-week thread (MacRumors 2143823, every app wrong together, rituals ineffective) and the January 2019 Apple Communities thread (an XS fixed by toggling Compass Calibration) both fit that reading [W].

What iOS 26 changed that matters here: only the fleet split. Eighty-two percent of UK iOS web traffic is on iOS 26.x and eleven percent on 18.x (StatCounter, August 2026, computed below), and the 18.x slice is disproportionately the pre-iPhone-11 hardware that cannot leave. Those are the devices with the most years of accumulated calibration state and the least OS-side evolution. That is a correlation the app can act on only through behaviour, not through a version check, because an iPhone 11 on iOS 26 and an XS on iOS 18.7 have identical documented heading contracts.

## 4. The device-class matrix and ranked predictors

Every cell marked MEASURED (this session or a sibling report), DOCUMENTED ([P] or [S] source) or INFERRED (my reasoning over the former two).

| Device class | Heading source | Expected compass quality | Runtime-detectable? | Evidence |
| --- | --- | --- | --- | --- |
| Android flagship or mid-range, gyro present (2016 to 2026) | `TYPE_ROTATION_VECTOR`, vendor fusion | Good outdoors, per-device indoors; fails on stale calibration, vendor firmware bugs, disturbed rooms | Sensor presence: yes. Quality: no | MEASURED on 3T (wrong indoors), Find X8 and four others right; DOCUMENTED variance across OEMs |
| Android budget, magnetometer but no gyro (for example Redmi 13C, A15 4G class) | `TYPE_GEOMAGNETIC_ROTATION_VECTOR` if the OEM ships it, else raw pair in apps | Wobbly always; tilt-sensitive; no gyro smoothing | YES: `getDefaultSensor(TYPE_ROTATION_VECTOR) == null` with a magnetometer present | DOCUMENTED [P] sensor docs; MEASURED spec sheets |
| Android ultra-budget, no magnetometer (Galaxy A05, A06 class) | None | No compass possible, permanently | YES: `getDefaultSensor(TYPE_MAGNETIC_FIELD) == null` | MEASURED spec sheets [J] GSMArena |
| Android with stubbed vendor fusion | All fused sensors report zeros | No heading at all | Partially: a heading stream that never changes across real rotation is detectable at runtime | DOCUMENTED [W] ST community case |
| iPhone, any generation from 3GS on | `CLHeading` via Core Location | Same contract everywhere; quality varies with calibration state and hardware age | Sensor presence: `CLLocationManager.headingAvailable()`. Quality: `headingAccuracy`, which read silent on the failing XS | MEASURED (XS wrong, 14 Pro Max right, same documented API); DOCUMENTED [P] |
| iPhone 11 and later on iOS 26 | Same `CLHeading` | Identical documented behaviour to iOS 18 | Version readable via `ProcessInfo`, but it predicts nothing documented | DOCUMENTED absence of change [P] |
| Wi-Fi iPad, iPod touch class | No magnetometer | No compass | YES | DOCUMENTED [P] via R6/SkySafari |

Predictors, ranked by how well they predict, with the runtime-readable flag the whole point:

| Rank | Predictor | Predictive power | Readable at runtime? |
| --- | --- | --- | --- |
| 1 | Magnetometer presence | Perfect for its class: absent means no compass, ever | YES, trivially, both platforms |
| 2 | Measured field magnitude and dip versus a geomagnetic model (D4's detector) | Catches 50 to 100 percent of the observed failure sizes at rest, on any device | YES, from the sensor streams the app already needs |
| 3 | Fused sensor presence (`TYPE_ROTATION_VECTOR` non-null) | Perfect for separating the gyro-fused class from the wobbly class | YES, trivially |
| 4 | Gyroscope presence | Strong proxy for rank 3 given the CDD's conditional MUST | YES |
| 5 | Age of the device | Weak and indirect: it aggregates stale calibration, older magnetometer parts and longer exposure to cases and mounts. The fleet data shows old flagships failing (3T, XS) but also old flagships fine (other XS owners) | NO usable signal. iOS reports no model identifier to web-facing APIs without private calls; Android's `Build.MODEL` names the model but says nothing about that unit's calibration state |
| 6 | Price tier | Correlated with sensor presence (ranks 1 and 4), nothing more once present | NO, beyond what ranks 1 and 4 already give |
| 7 | OS version | Nearly zero on both platforms (sections 1 and 3). The one real version effect, FOP, ships through Play services and reaches Android 5+ | YES but pointless as a quality signal |
| 8 | Magnetometer vendor and part | The 3T's MEMSIC MMC3416PJ is a competent part on paper (1.5 mG RMS noise, "enables heading accuracy of ±1 deg", on-chip set/reset to clear residual magnetization [P] MEMSIC product page). The observed failure is integration and environment, not the die | NO, and worse than useless: it invites deny-listing parts whose failures are not theirs |
| 9 | Vendor accuracy band (`onAccuracyChanged`, `headingAccuracy`, `values[4]`) | Measured to read healthy while 45 degrees wrong, on both failing platforms | YES but must never gate alone (D4 ranks it 5 to 7) |

The practical reading: the app can ask two cheap structural questions (is there a magnetometer, is there a fused rotation vector) and one expensive physics question (is the field the right strength and dip here). Everything else in the table is either unreadable or uninformative.

## 5. Market reality: how much of the user base is affected

Android version distribution, official numbers as of the December 2025 Play dashboard (via 9to5google quoting Google): Android 16 at 7.5, 15 at 19.3, 14 at 17.2, 13 at 13.9, 12 at 11.4, 11 at 13.7, 10 at 7.8, 9 at 4.5, 8.1 at 2.3, everything older at about 3 [P]. AppBrain's SDK panel (100M monthly users, September 2026) puts Android 16 at 25.1 [W]. UK-specific, StatCounter August 2026: Android 17 at 4.1, 16 at 32.0, 15 at 12.5, 14 at 13.5, 13 at 14.1, 12 at 8.7, 11 at 6.6, 10 at 4.1, 9 and below at 4.5 [W].

iOS distribution, UK, StatCounter August 2026, computed from the version CSV this session: iOS 26.x at 82.2, iOS 18.x at 11.2, iOS 17 and older at 6.1 [W]. Apple's own pre-WWDC figure was 79 percent of all iPhones on iOS 26 [W, MacRumors]. The two sources agree within a few points. Platform split in the UK: iOS 51.5, Android 48.5, StatCounter August 2026 [W].

Gyroscope and magnetometer prevalence in the budget segment. No public fleet-wide percentage exists; Google's dashboards stopped publishing per-sensor capability data, and Play Console device-capability data is private per app [P by absence]. What is established instead, from spec sheets of the highest-volume current budget models [J, GSMArena, fetched this session]:

- Samsung Galaxy A05 (2023, still on sale): accelerometer and proximity only. No magnetometer. No compass of any kind.
- Samsung Galaxy A06 (2024): same. No magnetometer.
- Xiaomi Redmi 13C (2023 to 2024, one of the highest-volume Android phones worldwide): accelerometer, proximity, compass. No gyroscope. So no `TYPE_ROTATION_VECTOR`; at best the geomagnetic fallback.
- Samsung Galaxy A15 5G, A16, Redmi 14C, OnePlus Nord N30: gyro and compass both present.
- Samsung Galaxy A12, the single most-used Android phone in AppBrain's September 2026 panel at 1.0 percent share: gyro and compass both present.

The pattern: the A0x and Redmi C-class floor omits the gyro or the magnetometer entirely; everything one tier up carries both. Google's own developer documentation hedges the same way: "Most Android-powered devices have an accelerometer, and many now include a gyroscope" [P].

The estimate, labelled INFERRED because the fleet-level gyro percentage is not published: a UK prayer-app audience skews younger and value-conscious, so the budget share is at least the market's. Combining the version and spec data: roughly 5 to 10 percent of UK Android users are on devices with no magnetometer or no gyroscope (the permanent classes), another 4 to 5 percent are on Android 9 and below where FOP-era hardening has had the least time to reach vendor HALs through OEM updates, and on iOS roughly 11 percent sit on iOS 18.x with a tail of that on pre-11 hardware. Weighted by the 51.5 / 48.5 platform split, the total fraction on a questionable class lands around 5 to 15 percent. Within that, the fraction whose compass is wrong at any moment is far smaller: most of those devices work fine outdoors. The app's own detectors (D4), not the class, decide that per session.

## 6. Known-bad list

| Device, part or class | Documented problem | Grade | Bad part or bad integration? |
| --- | --- | --- | --- |
| OnePlus 3 and 3T, MMC3416PJ | Launch-week 2016: magnetic field sensor glitching at a fixed rate, breaking Cardboard's magnetic trigger; OnePlus confirmed software and fixed it in a build. 2016 to 2018 era: Maps direction "always pointing to wrong side"; post-OxygenOS 5.0.2 reports of compass and GPS degradation after update, persisting across factory resets | [W] r/oneplus launch thread, OnePlus Community threads (cookie-blocked bodies, snippets and search excerpts only) | Integration. The part itself specifies 1.5 mG RMS noise and ±1 degree heading accuracy with on-chip set/reset degauss [P] MEMSIC. The 2016 spike bug was driver-level and fixed by OTA. The 2018 reports cluster on an OxygenOS update, which is software. Nothing in the part's documentation explains a persistent 45-degree rotation |
| Samsung S21 Ultra | 90-degree jumps after minutes of correct operation, widely reported, hardware replacement did not cure it | [W] r/samsunggalaxy via R6 | Integration (tilt-compensation angle applied to a correct compass read, R6's reading of the theodolite data) |
| Sony Xperia 5 IV, 5 II, some Xiaomi and Poco | Exactly 90 degrees clockwise in every app, calibration-immune | [W] r/SonyXperia via R6 | Integration, OEM firmware family |
| Nothing CMF Phone 2 Pro (2025) | Fused heading 150 to 180 degrees off; raw-sensor app plus figure of eight fixed it | [W] nothing.community via R6 | Integration: the calibration state the fused layer consumed was wrong; the raw layer re-fit it |
| Nexus 6P | 90 degrees off, calibration holding only seconds | [W] r/Nexus6P via R6 | Integration |
| Generic Android 10 board, ST vendor fusion | All fused sensors return zeros; heading never changes in any app | [W] ST community with dumpsys attached, via R6 | Integration: placeholder vendor fusion library over working raw drivers |
| Samsung Galaxy A5 (2016) | Declares compass feature, ships no rotation vector sensor at all | [P] stardroid issue 188 via R6 | Integration: a gyro-less device with no fused sensor, the documented CDD gap |
| iPhone XS generation | Launch-week all-apps-wrong compass reports; 2019 case fixed by Compass Calibration toggle cycle; one Apple-diagnosed defective compass IC | [W] MacRumors 2143823, Apple Communities, iFixit 623124 via D3 | Per-device: calibration state or a failed IC, not a generation defect (other XS owners report correct compass on the same versions) |
| iPhone, any, with Compass Calibration system toggle off | Silently degraded heading for every app, for months | [W] HN 46264074 via R6, multiple Apple Communities | Configuration, fully recoverable |
| AKM AK8963 (iPhone 5S era) and other early parts | No documented fleet problem | [J] teardown via D3 | Not applicable |

The MEMSIC part's reputation, specifically: searched the vendor's product page, DigiKey and Mouser listings, and the XDA and OnePlus forums. The part markets itself on heading accuracy and carries an explicit residual-magnetization clearing feature, which is the opposite of a part that silently absorbs hard iron. No forum thread names the part as a defect. The honest classification of the 3T is a device whose calibration state is poisoned (84.5 uT stored bias, 2.13x Earth's field, MEASURED) inside a disturbed room (104.5 uT calibrated field, MEASURED), running a 2016 vendor fusion whose gating is unknown. The part is the least suspicious layer in that stack.

## 7. What the app should do, per class, decidable at runtime

Every input in the decision table is readable at runtime from the app's own modules: `getDefaultSensor()` calls and the sensor streams the planned compass module already opens. No user questions, no model lookup, no version gating.

| # | Runtime condition (all readable) | Device class it catches | Policy |
| --- | --- | --- | --- |
| 0 | `getDefaultSensor(TYPE_MAGNETIC_FIELD)` returns null (Android), or `CLLocationManager.headingAvailable()` false (iOS) | A05 and A06 class, Wi-Fi iPads | Hide the needle permanently for this device. Show the bearing number large with the physical-compass line. Never poll again this session |
| 1 | Rotation vector present, all physics checks quiet (field magnitude within 20 percent of model, dip within 5 degrees, per D4) | Healthy gyro-fused phones, both platforms | Trust the fused heading. Needle with narrow arc, no hint line |
| 2 | Rotation vector present, field magnitude 20 to 35 percent off model or dip 5 to 10 degrees off, sustained 2 seconds | A phone in a mildly disturbed field, any class | Draw the needle with the arc widened to the detector's implied error. Warn line: interference nearby, move away |
| 3 | Field magnitude beyond 35 percent or dip beyond 10 degrees, sustained 2 seconds | The 3T and XS in the failing room | Hide the needle. Severe line naming the number so the physical-compass fallback works |
| 4 | Rotation vector absent but magnetometer present | Redmi 13C class | Fall back to `TYPE_GEOMAGNETIC_ROTATION_VECTOR`. Draw the needle but say it is the unfused kind: tilt line plus calibration hint. Never present it as rung 1 |
| 5 | Heading stream present but value frozen across real rotation (user turning, samples arriving, azimuth unchanged past 5 degrees of gyro-measured rotation) | Stubbed-fusion boards | Treat as no compass: hide needle, bearing plus physical-compass line, and a line saying the compass has stopped responding |
| 6 | Vendor accuracy band low (Android `event.accuracy` below 2, iOS banded accuracy at or below 1) with physics quiet | Freshly opened compass anywhere | Keep the needle, medium arc, figure-of-eight coaching line. Never let this state alone hide the needle (measured silent while 45 degrees wrong) |
| 7 | iOS heading stream negative `headingAccuracy` | Interference or uncalibrated per Apple | Same treatment as rung 6 plus the documented calibration-hint copy; expo-location's banding must be bypassed to see the sign at all (R2) |

Implementation notes for the engineer: rungs 0 and 4 need one `getDefaultSensor` call each at module init, which is free. Rungs 2, 3 and 5 need the magnetometer magnitude, gravity vector and gyro stream beside the rotation vector, all inside the native module R3 sketches and D4 specifies. Rung 5's threshold comes from the gyro the fused device must have by the CDD. On iOS the same table collapses to rungs 0, 1, 2, 3, 6 and 7 with `CLHeading.x/y/z` feeding the physics checks. No row consults OS version, device model, price tier or age, because sections 1, 3 and 4 established those predict nothing the sensors do not already say.

## COULD NOT VERIFY

1. A fleet-wide percentage of Android devices with a gyroscope or magnetometer. Google retired per-sensor distribution data from the public dashboard years ago and Play Console capability data is private to each app's console. Tried: developer.android.com dashboards (now Vulkan, OpenGL and screen metrics only), AppBrain stats pages (phone and SDK models only), ARCore device pages (supported-model list, no fleet share), academic smartphone datasets (Cambridge Device Analyzer is defunct and its published tables predate the modern budget era). The 5 to 10 percent budget-class estimate is therefore INFERRED from current spec sheets of the highest-volume budget models, not measured.
2. The QTI sensor hub's magnetic gating on the 3T. Closed vendor code, no public source. Established instead: the AOSP gate it replaces (10 to 100 uT, source read) and Google's platform statement that vendor implementations vary and the default is unmaintained.
3. Whether the XS's failure is calibration state or hardware. Requires the owner's 20-minute Compass-app procedure from D3, which discriminates without any install. No public source names an XS-generation defect.
4. The OnePlus Community thread bodies (467400, 825477) cookie-block full reads; graded on snippets and corroborating threads. The r/oneplus launch thread was fetched in full.
5. iOS 26's UK adoption on the exact pre-iPhone-11 population. StatCounter aggregates by version, not by device model, so the 11.2 percent on iOS 18.x is an upper bound for the XS-generation slice (iPhone 11 and SE2 also run 18.x by choice or by storage constraints).
6. When the AOSP Fusion.cpp magnetic gate was introduced. The Android 9 tree and current master both carry it; gitiles log endpoints returned empty via the fetch tool. Not load-bearing: every device this app supports ships a vendor fusion in front of it anyway.
7. FOP's share on UK Android devices specifically. FOP requires Play services 21.2.0+, and the 3T runs 26.34.36 (MEASURED), but no public figure breaks Play services version by region. The Huawei-and-friends GMS-free population in the UK is small but nonzero and lands on the AOSP fallback path with its 100 uT gate.

## Sources

| # | Grade | Source | Used for |
| --- | --- | --- | --- |
| 1 | [P] | `Sensor` API reference, developer.android.com, constants table with per-type API levels (fetched this session) | TYPE_ROTATION_VECTOR API 9, GEOMAGNETIC_ROTATION_VECTOR 19, GAME_ROTATION_VECTOR and UNCALIBRATED 18, HEADING 33, ORIENTATION 3 deprecated at 20 |
| 2 | [P] | Android CDD 4.4, 6.0, 7.0, 8.0, 9, 10, 11, 13, 14, 15, 16, sections 7.3.1 to 7.3.4, all fetched this session from source.android.com | Magnetometer always SHOULD or C-SR, never MUST; rotation vector conditional MUST unchanged in intent 4.4 through 16; TYPE_MAGNETIC_FIELD_UNCALIBRATED MUST from 14; TYPE_HEADING only Automotive SR; LIMITED_AXES C-3-1 |
| 3 | [P] | source.android.com sensor-stack page (fetched) | Default fusion "not as accurate", "not being maintained and might cause devices relying on it to fail CTS"; OEM guidance to ship own fusion |
| 4 | [S] | AOSP `Fusion.cpp`, master via android.googlesource.com (fetched this session) | 30 to 60 uT comment, MAX_VALID 100 uT, MIN_VALID 10 uT, gravity-parallel rejection; matches D1's Android 9 tree read |
| 5 | [S] | OnePlus 3T, read-only `adb shell dumpsys sensorservice` and `ps -A`, this session | QTI versus AOSP handle split, fusion states disabled, sensors.qti and sensorscalibrate HAL processes, MMC3416PJ and LSM6DS3 parts, calibrated 104.5 uT field, 84.5 uT stored bias, values[4] equal to 0.00 |
| 6 | [S] | iPhone XS via `xcrun devicectl device info details`, read-only | iPhone11,2, iOS 18.7.10, connected |
| 7 | [S] | iPhoneOS 27.0 SDK headers on disk: `CLHeading.h`, `CMDeviceMotion.h`, `CLLocationManager.h` | CLHeading contract unchanged since iOS 3.0; CMDeviceMotion.headingAccuracy iOS 27; heading iOS 11; no iOS 26 heading API |
| 8 | [P] | developer.apple.com CoreLocation and CoreMotion updates pages (JSON, fetched this session) | Dated change sections contain zero compass, heading or magnetometer entries; June 2024 CLMonitor and watchOS diving items confirm the pages are live and detailed |
| 9 | [P] | Android Developers Blog, "Introducing the Fused Orientation Provider API", 2024-03-07 (via D1, re-checked) | FOP availability Android 5+ with Play services, Maps uses it, disturbance handling added |
| 10 | [W] | 9to5google quoting Google's distribution dashboard, 2026-01-30 (fetched) | Official December 2025 per-version percentages |
| 11 | [W] | StatCounter UK mobile OS, iOS version and Android version CSVs, August 2026 (fetched and computed this session) | UK: iOS 51.5 percent; iOS 26.x 82.2, iOS 18.x 11.2, iOS 17-and-older 6.1; Android 9-and-below 4.5, Android 10 to 11 10.6 |
| 12 | [J] | GSMArena spec pages fetched this session: Galaxy A05, A06, A12, A15 5G, A16, Redmi 13C, Redmi 14C, Nord N30, iPhone 11 | Sensor lists: A05 and A06 no magnetometer; Redmi 13C no gyro; others full stack |
| 13 | [W] | AppBrain top Android phones and SDK pages, September 2026 (fetched) | Galaxy A12 most-used at 1.0 percent; Android 16 at 25.1 on their panel |
| 14 | [P] | MEMSIC MMC3416xPJ product page (fetched) | 1.5 mG RMS noise, ±1 degree heading claim, set/reset residual-magnetization clearing |
| 15 | [W] | r/oneplus launch-week magnetic field sensor thread (fetched in full); OnePlus Community threads 467400 and 825477 (snippets) | 3T launch sensor bug confirmed software and fixed; later compass complaints cluster on OxygenOS updates |
| 16 | [J] | Wikipedia, Apple motion coprocessors (Chipworks, iFixit citations; fetched) | M7 NXP LPC18A1 through M11, naming dropped at A12 |
| 17 | [P] | Apple support spec pages: iPhone XS 111881, iPhone 14 Pro Max 111846, iPhone 11 111865 (fetched) | XS "Three-axis gyro"; 14 Pro Max "High dynamic range gyro", "High-g accelerometer", Magnetometer and magnet array listed; iPhone 11 "Three-axis gyro" |
| 18 | [W] | MacRumors 2026-06-09 (Apple's pre-WWDC adoption stats), TelemetryDeck iOS version survey (fetched) | iOS 26 adoption 79 to 85 percent depending on panel and date |
| 19 | [P] | developer.android.com sensors overview and motion sensors pages (fetched) | "Most Android-powered devices have an accelerometer, and many now include a gyroscope"; fusion family composition |
| 20 | [W] | Field failure reports aggregated by R6: stardroid issue 188 [P], ST community stub-fusion thread, r/samsunggalaxy S21 Ultra, r/SonyXperia, nothing.community CMF, r/Nexus6P, MacRumors XS thread, HN 46264074 | Known-bad list, section 6 |
| 21 | [S] | Sibling reports R2, R3, D1, D3, D4, R6 in this folder | expo-location internals, 3T ground truth, XS evidence state, detector thresholds, field evidence |
