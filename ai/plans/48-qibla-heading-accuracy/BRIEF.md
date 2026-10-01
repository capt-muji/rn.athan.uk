# 48. Where the heading comes from: research the alternatives, because the platform's own is not accurate enough

## Why this row exists

Session 47 made the compass fast, then made it point the right way round, then measured that it still
does not agree with the maps the owner trusts. **The geometry is proven correct to 0.1 degrees. The
heading is the whole problem, and this row decides where it comes from.**

🐋  "we want accuracy, 1000% accuracy, always, always, always accuracy. No. I don't care about
smoothness anymore. Accuracy is number 1 importance."

## Where it stands after 1.29.196, on hardware

| Device | Build | Owner's judgement |
| --- | --- | --- |
| Galaxy S23 | 1.29.196 | **about 95% accurate** against Google Maps, up from about 70% |
| iPhone XS | 1.29.196 | **still off**, around 85%, consistently so |

Both phones now run **byte-identical code**: there is no `Platform` branch anywhere in the qibla path,
no axis constant, no offset, no calibration, and no location-specific number (verified by grep). So a
per-platform difference can only come from what the OS itself returns.

## What is PROVEN and must not be re-investigated

**The app's own maths is not the problem.** Measured off full-resolution frames of the owner's own
screen recordings, rather than argued:

| Frame | Kaaba from dial North | True London qibla | Error |
| --- | --- | --- | --- |
| 22:38 recording, t=0 | 119.4 | 118.99 | **0.4** |
| 23:23 recording, t=30 | 118.9 | 118.99 | **0.1** |
| 23:40 live screenshot | 121.5 | 118.99 | 2.5 |

The four cardinal steps measure within about 1 degree of a perfect 90 in every frame. **So the dial,
the SVG, `qiblaBearing`, the Kaaba coordinates, the bottom sheet and the position fix are all
exonerated**, and the owner's proposed "naked hello world app" test is already answered: it would
isolate app-versus-platform, and the recordings have done exactly that.

## What was tried, and what it cost

| Heading source | Result |
| --- | --- |
| `expo-location` `watchHeadingAsync` `trueHeading` (shipped before 47) | Accurate on iOS, jittery on Android: gated at 2 degrees and 50ms, measured at **2 frames in 15 seconds** on the S23 |
| Reanimated `SensorType.ROTATION`, the gyro-fused sensor (47, 1.29.193) | Beautifully smooth and **measurably inaccurate**: differed from the platform's own heading by **5 degrees in one orientation and 34 in another**, an error that VARIES and so cannot be corrected by any constant |
| Back to `watchHeadingAsync` (1.29.195, current) | S23 went from ~70% to ~95%. iPhone still off. The 150ms tween returns and now settles, because the 2-degree gate means a still phone emits nothing |

**The decisive measurement**, logged at 22:15:07 seconds before the owner's screenshot: fused heading
149.7 against the platform's 115.3, where the true qibla is 118.99. The platform value would have put
the Kaaba at 12 o'clock; ours put it at 11, which is exactly what the screenshot shows.

## The contradiction that is still open, and matters

**Session 40 measured the OPPOSITE on a Find X8**: `expo-location` reported 190.0 where the truth was
118.9, an error of +71.1, while the fused `ROTATION_VECTOR` read 109.2, an error of -9.7. That is the
reverse of tonight's finding on the S23.

Both measurements are real. They cannot both generalise, so **neither source is trustworthy across
handsets**, and that is the strongest argument for this row existing at all.

## The options the owner named, to research rather than assume

1. **`adhan` the npm package.** Already a dependency, and it ships a `Qibla` export. It computes the
   BEARING from a position, which this app already does correctly, so by itself it cannot fix a
   HEADING. Worth confirming whether it offers anything beyond the bearing before it is dismissed.
2. **A different package.** Survey what else reads a device heading in React Native, and against what
   sensor stack. The question to answer for each: does it read `TYPE_ROTATION_VECTOR`, the raw
   magnetometer, or the platform's fused heading, and does it expose the accuracy band.
3. **Native code of our own**, Swift and Kotlin. The most control and the most work. On Android this
   would mean `TYPE_ROTATION_VECTOR` with `remapCoordinateSystem` done properly; on iOS it would mean
   `CLLocationManager` directly rather than through `expo-location`.
4. **A fourth possibility the owner raised and it deserves equal weight: the fault may be in
   `expo-location` itself rather than in the sensor.** Google Maps is accurate on the same handset at
   the same instant, so the hardware is capable. What Maps does that we do not is the real question.

## What a research session should establish

- **What Google Maps and Apple Maps actually use.** Both are accurate on hardware where our reading is
  not, so the gap is in the method, not the magnetometer.
- **Whether `expo-location`'s iOS path is faithful to `CLHeading`.** On iOS it should be returning
  Apple's own fused `trueHeading`, the same value Apple Maps draws, yet the XS is still off. Read the
  module's Swift source the way this programme read its Kotlin.
- **Whether heading ACCURACY can be read and surfaced.** `CLHeading.headingAccuracy` exists on iOS and
  `expo-location` buckets it to 0 to 3 (`LocationUtils.swift:9`, found in session 45). Apple Maps
  draws a CONE whose width IS that accuracy. A compass that admits its own uncertainty may be more
  honest than one that cannot.
- **Calibration.** iOS raises a calibration prompt through `CLLocationManagerDelegate`; whether
  `expo-location` ever lets that surface is unknown and is a plausible cause of a consistently-off XS.

## What must NOT happen

**No invented constant, no tuned offset, no per-location calibration.** The owner's rule, restated
tonight: 🐋  "I want it to work, same as Android, Android phones, Android Google Maps... it should work
in the whole world." Session 40 shipped a reading 90 degrees out by tuning a constant by eye, and
tonight's fix came from a device measurement precisely because the derivation from first principles
contradicted itself.

**Every claim in this row is to be measured on hardware.** The pattern that worked tonight: log our
value beside the platform's at the same instant, correlate a screenshot's timestamp against the log,
and read full-resolution frames rather than contact sheets. A low-resolution contact sheet produced a
confident, wrong conclusion in this very session and was caught only by re-measuring at full size.
