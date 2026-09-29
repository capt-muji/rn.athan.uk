# Session 40 execution log

Executed 2026-09-29 in the same session as the research and the plan, on the owner's instruction.

## What shipped, 1.29.115

The compass needle now reads the OS-fused rotation vector through Reanimated's `useAnimatedSensor`, instead of
`expo-location`'s `watchHeadingAsync`.

| File | Change |
| --- | --- |
| `shared/qibla.ts` | `headingFromYaw` added. `normaliseHeading`, `shortestDelta` and `unwrapAngle` marked `'worklet'`, since the conversion now runs on the UI thread. |
| `device/qibla.ts` | `watchHeading` and `HeadingReading` deleted. `readDeclination` added, which takes the gap between the platform's own magnetic and true headings rather than shipping a geomagnetic model. |
| `components/sheets/screens/Qibla.tsx` | `HeadingSensor` child feeds the dial. Declination is Android-only. The hint no longer claims a calibration state the phone cannot be trusted about. |
| `shared/__mocks__/expo-location.ts` | `getHeadingAsync` added. |

## The measurement this is built on

Instrumented `watchHeading` and read the live stream off the OPPO Find X8 with the phone's top edge aimed at
the qibla, so the true heading was 118.9 degrees:

```
QIBLAPROBE true=191.19 mag=189.86 acc=3
FUSEDPROBE yaw=-1.9057 deg=109.2
```

| Path | Heading | Error | Samples in 40s |
| --- | --- | --- | --- |
| `expo-location` (shipped) | 190.0 | **+71.1** | 2 |
| Fused rotation vector | 109.2 | **-9.7** | 148 |

The screenshot agreed with the probe exactly: the label under the fixed mark sat between `S` and `21`, and the
Kaaba marker sat at `118.9 - 190 = 288.9` degrees, which is 9.6 o'clock, which is where the owner reported it.

## Three defects found while reading the source

1. **`expo-location` has no gyroscope in its Android heading** (`LocationModule.kt:649`), which is the whole
   reason this row exists.
2. **It stores `event.values` by reference** (lines 1101 and 1103) into fields declared `FloatArray(9)` for
   3-value sensors. Android reuses that array between callbacks.
3. **Reanimated's iOS default reference frame is ARBITRARY.** `ReanimatedSensor.m:146` resolves `Auto` to
   `XArbitraryCorrectedZVertical`, whose yaw zero is wherever the phone woke up. Passing
   `XTrueNorthZVertical` is what makes the iOS needle mean anything, and this would have shipped a compass
   that pointed nowhere on iOS had the source not been read.

## Two review findings, fixed before the build

- **The sensor would have run forever.** `useAnimatedSensor` subscribes for the life of its component and
  every sheet in this app is mounted from launch, so the first draft armed the magnetometer on every device
  permanently (Performance Design Rule 7). The sensor now lives in a child mounted only while the sheet is
  open, so Reanimated's own effect cleanup unregisters it.
- **`rotation.register()` does not exist.** The first draft called it. The hook self-registers; only
  `unregister` is exposed. A device build would have crashed on open.

## The honesty rule, restated

The old hint switched on the platform's calibration band. That band is not trustworthy: the X8 reported band 3
(HIGH) while reading 71 degrees wrong, then band 0 (UNRELIABLE) while its field was correct at 47.3 uT. So the
band no longer drives any copy. The hint now names what the user can do and nothing about a state the phone
cannot be trusted to report.

The physics-based trust checks (field magnitude and dip against the expected values) are specified in
`agent-reports/D4-detection-and-honesty.md` and are NOT built in this pass.

## Verification

- `npx tsc --noEmit` clean.
- `npx biome check` clean.
- Full suite: 182 suites, 4880 tests, all passing.
- Coverage deliberately not pursued this pass (owner: "don't even bother with the coverage, this is a
  prototype, we want it fixed first").

## Not done

- The device proof on all three phones. The OnePlus 3T and the OPPO Find X8 were disconnected by the owner
  before the 1.29.115 Android build finished; they return in about 24 hours. The iPhone XS build is the only
  one that can be proven in this session.
