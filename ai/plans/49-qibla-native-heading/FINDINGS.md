# Session 49: what was read from the vendors, and the findings that reshape the row

`MEASURED.md` holds what this machine measured. This page holds what was READ from Google's and
Apple's own words, because two of them change what this row should build. Compressed 2026-10-07
after the row closed DONE; the quotes and the rulings stay.

---

## 1. FOP, in Google's own words, including the sentence that bounds the whole Android half

Source: the Android Developers Blog, 7 March 2024, "Introducing the Fused Orientation Provider API",
by its own engineers (Geoffrey Boullanger, Shandor Dektor, Martin Frassl, Benjamin Joseph). Fetched
in full during planning.

**The claim the row is built on, confirmed verbatim:**

> "In addition, the FOP provides the device's heading and accuracy, which are derived from the
> orientation estimate. **This is the same heading that is shown in Google Maps, which uses the FOP
> as well.** We recently added changes to better cope with magnetic disturbances, to improve the
> reliability of the cone for Google Maps and FOP clients."

**And the sentence nobody has quoted, which is the single most important line for this row:**

> "**In certain cases, the FOP returns values piped through from the AOSP Rotation Vector**, adapted
> to incorporate magnetic declination."

`SensorType.ROTATION` in Reanimated IS the AOSP Rotation Vector, and session 47 shipped it, measured
it 5 to 34 degrees wrong outdoors, and reverted it. **So FOP is not guaranteed to be a different
answer from the one this programme already rejected once** — on some devices it is that same answer
with declination applied. The device proof (LOG.md) then measured exactly that agreement on the 3T,
which is why the module ADDS a reading beside the platform's and replaces nothing.

**Other load-bearing facts, quote and consequence:**

| Fact | Quote or value | Consequence |
| --- | --- | --- |
| Reference frame | "The orientation is referenced to **geographic** north. In cases where the local magnetic declination is not known (e.g., location is not available), the orientation will be relative to **magnetic** north" | The app applies NO declination of its own, and the frame SILENTLY changes with location availability. No flag announces which one you got |
| Hardware floor | "must have an accelerometer, gyroscope, and magnetometer available to use the fused orientation provider" | The 3T qualifies (MEASURED.md section 3). A device missing a gyroscope gets nothing, so the JS layer needs a real absence path |
| Availability | "available on all devices running Google Play services on Android 5 (Lollipop) and above" | The 3T at API 28 is in scope |
| Permissions | "**No permissions are required to use the FOP API**" | Satisfies the owner's least-permissions rule |
| Dependency | "Developers need to add the dependency play-services-location:21.2.0 (or above)" | Confirms MEASURED.md section 2's bytecode finding |
| Rate honesty | "The FOP does not guarantee a minimum or maximum update rate... it can be slower as requested if the device doesn't support the high rate" | No rate assertion can be written as an acceptance criterion |
| Power | "Always request the longest update period (lowest frequency) that is sufficient... If you do not know which update period to use, we recommend starting with `OUTPUT_PERIOD_DEFAULT`" | Use the default, 20 ms, which happens to equal what session 48 already proved affordable |
| Foreground only | "**FOP updates are only available to apps running in the foreground**" | Exactly matches a sheet-scoped watch. No background concern |

Google's own example registers with an `Executor`, and the sample uses
`Executors.newSingleThreadExecutor()`. The API's own job list is this programme's defect list, which
is the reason the row exists:

> - Synchronize sensors running on different clocks and delays;
> - Compensate for the hard iron offset (magnetometer bias);
> - Fuse accelerometer, gyroscope, and magnetometer measurements;
> - Compensate for gyro drift (gyro bias) while moving;
> - Produce a realistic estimate of the compass heading accuracy.

## 2. iOS: the two numbers `expo-location` destroys, and Apple's own rule about one of them

`CLHeading.headingAccuracy` is documented in degrees, and a negative value means the reading is
invalid. Apple's own sample gates on it unconditionally. `MEASURED.md` section 4 shows the exact
Swift that makes both unreachable from JS: four buckets, with invalid and merely-poor collapsed into
the same bucket 0.

**What a native module can therefore give that no patch to the JS surface could:**

| Reading | Today through `expo-location` | Through a module |
| --- | --- | --- |
| `trueHeading` | available | available, unchanged |
| `magneticHeading` | available | available, unchanged |
| `headingAccuracy` | bucket 0 to 3 | **degrees** |
| "this reading is invalid" (`headingAccuracy < 0`) | **indistinguishable from "poor"** | a distinct, testable state |

This is the diagnostic session 48 said would decide whether anything further is worth building, and
it is the row's first deliverable for that reason.

## 3. Apple's calibration prompt: real, cheap, and correctly downgraded

`CLLocationManagerDelegate.locationManagerShouldDisplayHeadingCalibration` is what permits the
system calibration HUD, and with no implementation Core Location never shows it.
`expo-location`'s `DeviceHeadingStreamer` implements no such delegate method, confirmed by reading
the file in full.

Session 48's research downgraded the prompt honestly, and this session agrees: the alert is UI, not
algorithm. It supplies the same figure-of-eight motion the owner is already performing by hand, and
which the app asks for in words and with an animation (1.29.207). **So its value is the OS-level
signal that iOS considers itself uncalibrated, not the calibration itself.**

There is a sharper reason to be careful with it, which no prior session recorded: the delegate
method is a QUESTION iOS asks, and answering `true` hands the screen to a system HUD that can appear
over the qibla sheet at a moment the app does not choose. **Showing that HUD is therefore an owner
decision rather than an implementation detail** — the module answers `false` and reports whether
iOS WANTED calibration, which is the signal without the HUD.

## 4. What this row must NOT re-investigate

Carried forward from session 48's `DECISION.md`, so no future session spends time here again:

| Settled | Verdict |
| --- | --- |
| The app's geometry | Correct to 0.1 degrees, measured off full-resolution frames of the owner's own recordings |
| The field-magnitude and dip physics check | **Rejected by measurement.** A 10 uT offset swings the heading 30.8 degrees and passes gates of 10% on magnitude and 5 degrees on dip |
| Reanimated's gyro-fused sensor as a drop-in | Rejected, and the mirrored-sign theory refuted three ways |
| `event.values` by-reference | Refuted on AOSP evidence |
| A tuned constant, stored offset or per-place calibration | Forbidden by the owner, and measured to drift 20 degrees at a fixed spot across hours |

And the standing rule, which binds every line this row ships: **no invented constant, no tuned
offset, no per-location calibration.**

## 5. THE WORD "CALIBRATION" IN THIS ROW MEANS A READING, NEVER A CORRECTION

The owner raised this directly on 2026-10-02, and he was right to:

🐋  "this calibration talk a bit scares me because I'm recalibrating based on my room, on London, my
house. What about someone in a completely different country? My calibration is not going to fit their
calibration."

**He is describing a thing this programme already tried, already shipped, and has permanently
banned.** Session 40 tuned seven constants by eye (270, 180, 190, 180, 170, 190, 220) and shipped a
reading 90 degrees out. Session 41 then proved why no such constant can exist, with a prediction
written down before the measurement: at one FIXED spot the error drifted 20 degrees across a few
hours. So a stored offset fails in the owner's own house across one afternoon, before any question
of another country arises.

**Nothing in this row calibrates anything.** The module is a read-only instrument: it reads
`CLHeading.headingAccuracy`, which Apple computes, and shows it; it reads whether iOS ASKED to show
its calibration HUD, and answers no; it reads FOP's heading beside the platform's, for comparison.
It does not change the heading by any amount, store an offset per place or per user, or replace the
heading the compass draws.

Checkable rather than asserted: across `modules/qiblaheading/`, `hooks/useQibla.ts`,
`shared/qiblaAlignment.ts`, `shared/qiblaGeometry.ts` and `device/qibla.ts`, every occurrence of
`offset`, `calibrat`, `correction` or `declination` is a NAME or a COMMENT, never an arithmetic
operation. The whole alignment maths is `bearing - heading` wrapped to the short way round
(`shared/qiblaAlignment.ts:23-29`).

**And the measurement points the opposite way from calibrating.** `wantsCalibration` came back FALSE
on the XS while the accuracy sat at about 25 degrees (LOG.md), so iOS considered itself calibrated
and was still uncertain. That is a field fixed in the ROOM, which Apple states in writing cannot be
filtered because calibration removes only fields that move WITH the device. **The shaking the owner
has been doing, and which 1.29.207 asks for in words and animation, addresses a condition the OS says
is not present.** The product answer this supports is showing the uncertainty, the way Apple Maps
draws a cone rather than a confident needle. It is not a correction, and a later session must not
read this page as licence to build one.
