# 48. Where the heading comes from: research the alternatives, because the platform's own is not accurate enough

Session 47 made the compass fast and the right way round, then measured that it still does not agree with the
maps the owner trusts. **The geometry is proven correct to 0.1 degrees; the heading is the whole problem.**

🐋  "we want accuracy, 1000% accuracy, always, always, always accuracy. No. I don't care about smoothness
anymore. Accuracy is number 1 importance."

## Where it stood after 1.29.196, on hardware

Galaxy S23 **about 95% accurate** against Google Maps (up from ~70%); iPhone XS **still off**, ~85%. Both
phones ran byte-identical code — no `Platform` branch, axis constant, offset or location-specific number — so
a per-platform difference could only come from what the OS returns.

**Proven, not re-investigated:** frame measurements off the owner's own screen recordings — Kaaba from dial
North 119.4 / 118.9 / 121.5 against the true 118.99 (errors 0.4 / 0.1 / 2.5), cardinals within ~1 degree of a
perfect 90 — exonerated the dial, SVG, `qiblaBearing`, Kaaba coordinates, sheet and position fix.

| Heading source | Result |
| --- | --- |
| `expo-location` `watchHeadingAsync` `trueHeading` | Accurate on iOS, jittery on Android (2-degree/50ms gate: 2 frames in 15s on the S23) |
| Reanimated gyro-fused `ROTATION` (47) | Smooth and **measurably inaccurate**: 5 degrees off in one orientation, 34 in another — an error that VARIES, so no constant can fix it |
| Back to `watchHeadingAsync` (current then) | S23 ~70%→~95%; XS still off |

**The decisive measurement** (logged 22:15:07, seconds before the owner's screenshot): fused 149.7 against the
platform's 115.3, true qibla 118.99. The platform value puts the Kaaba at 12 o'clock; ours put it at 11 —
exactly what the screenshot shows.

**The open contradiction that created this row:** session 40 measured the OPPOSITE on a Find X8 —
`expo-location` 190.0 (+71.1) against fused 109.2 (-9.7). Both measurements are real; neither source is
trustworthy across handsets.

## The owner's standing rule

**No invented constant, no tuned offset, no per-location calibration.** 🐋  "I want it to work, same as
Android, Android phones, Android Google Maps... it should work in the whole world." Session 40 shipped a
reading 90 degrees out by tuning a constant by eye; the fix that worked came from a device measurement.

**Every claim in this row was measured on hardware.** The pattern: log our value beside the platform's at the
same instant, correlate the screenshot's timestamp against the log, read full-resolution frames. A
low-resolution contact sheet produced a confident wrong conclusion in that very session, caught only by
re-measuring at full size.
