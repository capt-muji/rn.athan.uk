# Session 40 execution log

Executed 2026-09-29 in the same session as the research and the plan, on the owner's instruction.

## What shipped, 1.29.115 to 1.29.121

The compass needle reads the OS-fused rotation vector through Reanimated's `useAnimatedSensor` instead of
`expo-location`'s `watchHeadingAsync`, and the screen now says when the magnetic field it is reading is not
Earth's.

| File | Change |
| --- | --- |
| `shared/qibla.ts` | `headingFromYaw`, `dialAngleFromYaw` and `isFieldTrustworthy` added. `normaliseHeading`, `shortestDelta` and `unwrapAngle` marked `'worklet'`, since the conversion runs on the UI thread. |
| `device/qibla.ts` | `watchHeading` and `HeadingReading` deleted. `readDeclination` added, taking the gap between the platform's own magnetic and true headings rather than shipping a geomagnetic model. |
| `components/sheets/screens/Qibla.tsx` | `HeadingSensor` child feeds the dial and watches the field. Declination is Android-only. The calibration hint is replaced by an interference warning driven by physics. |
| `shared/__mocks__/expo-location.ts` | `getHeadingAsync` added. |

## The defect, measured

Instrumented `watchHeading` and read the live stream off the OPPO Find X8 with the phone's top edge aimed at
the qibla, so the true heading was 118.9:

| Path | Heading | Error | Samples in 40s |
| --- | --- | --- | --- |
| `expo-location` (shipped) | 190.0 | **+71.1** | 2 |
| Fused rotation vector | 109.2 | -9.7 | 148 |

Three defects read from `LocationModule.kt`: no gyroscope in the Android heading (line 649), `event.values`
stored by reference into `FloatArray(9)` fields for 3-value sensors while Android reuses that array (1101,
1103), and a 2-degree 50ms gate (656) that explains 2 samples against 148.

**Reanimated's iOS default reference frame is ARBITRARY.** `ReanimatedSensor.m:146` resolves `Auto` to
`XArbitraryCorrectedZVertical`, whose yaw zero is wherever the phone woke up, so a compass built on the
default points at nothing. `XTrueNorthZVertical` is passed explicitly, and because that frame is already
true-north referenced the declination correction is Android-only.

## THE FINDING THAT ENDS THE TUNING

The iOS axis correction was tuned six times against the owner's dial: 270, 180, 190, 180, 170, 190, then
220. **It never converged, and the reason is that it cannot.**

The owner walked the phone from the middle of his room toward a corner without turning it. The needle swung
**30 degrees**. The qibla bearing over that distance moves **0.09 arcseconds**.

| Where | Correction that read perfectly |
| --- | --- |
| On the desk, beside a MacBook | 190 |
| Middle of the room, open floor | 220 |

Same phone, same orientation, two metres apart. **No constant satisfies both**, because the room's field
changes with position: drywall corners carry a continuous steel corner bead, two stud lines and the screws of
both sheets, and London's horizontal field is only 19.5 uT, so ten microtesla of steel is
`atan(10/19.5)` = 27 degrees. The owner measured 30.

**The owner caught the consequence himself and was right:** 220 is not a multiple of 90, so it is not
geometry, and shipping it would export one bedroom's steel to every user on Earth. The correction is back at
**180**, the only multiple of 90 the readings support, and the residual is reported rather than absorbed.

## What the app does instead

`isFieldTrustworthy` reads the magnetometer and checks the field strength against Earth's 25 to 65 uT band.
Outside it, the hint becomes "Something nearby is bending the reading. Step away from metal, magnets and
electronics." This project's own desk measured **104.5 uT against London's 49**, which is the case it exists
to catch.

## Review findings fixed before shipping

- **The sensor would have run forever.** `useAnimatedSensor` subscribes for the life of its component and
  every sheet here is mounted from launch, so the first draft armed the magnetometer permanently on every
  device (Performance Design Rule 7). It now lives in a child mounted only while the sheet is open.
- **`rotation.register()` does not exist.** The hook self-registers; only `unregister` is exposed. A device
  build would have crashed on open.
- **A 180-degree derivation error.** The iOS constant was first derived as 270 from a hand-built rotation
  matrix and measured at 180 on the device. The derivation was wrong; the measurement was right.

## Verification

`tsc` clean, `biome` clean, 182 suites, 4901 tests, 100% on all four measures.

## Not proven on device

- **Android.** The OnePlus 3T and OPPO Find X8 were disconnected before the 1.29.121 Android build. The
  Android correction path (declination only) has never been checked on hardware.
- **The iOS constant.** 180 is correct by geometry and by the open-floor reading, but the owner's last check
  was at 220 on open floor. It needs one clean reading away from metal.

## Why this row is not closed

The owner's conclusion, and it is the right one: a compass that can be 30 degrees wrong in a bedroom is not
good enough for prayer, and no amount of sensor work fixes a distorted field. The next session researches an
offline map instead, where the user aligns what they see to what is drawn and the magnetometer stops being
the single point of failure. Queued as row 41.
