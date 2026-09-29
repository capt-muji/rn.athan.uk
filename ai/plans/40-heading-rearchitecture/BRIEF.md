# Session 40: re-architect the heading, the way Maps does it

Queued 2026-09-29, straight out of session 37's audit and the owner's reading of the shipped compass.

**This is a research-and-replan row, not a patch.** Session 37's bearing is exact and stays; what is being
re-architected is where the NEEDLE comes from.

## 1. The owner's observation, which is correct

🐋  "the way the most accurate reading is usually, for example, when I am using Google Maps or Apple Maps, I turn
on my location and it shows me the way that I'm facing, and then I just face Mecca, I face Saudi Arabia, and
that's the direction that I pray in, and that's what a lot of people do."

🐋  "How does Google Maps get an accurate reading of the way that I'm facing?"

**The answer is the sensor, and it is a real defect in what session 37 shipped.**

## 2. The finding, read from source and confirmed on the 3T

`expo-location`'s Android heading is built from the accelerometer and the raw magnetometer only
(`LocationModule.kt:646`, `SensorManager.getRotationMatrix(rotationMatrix, inclinationMatrix, mGravity,
mGeomagnetic)`). **There is no gyroscope anywhere in that path.** That is the wobbly-compass sensor pair, and it
is why the needle swings near metal and needs a figure of eight.

Google Maps reads `TYPE_ROTATION_VECTOR` (Android sensor type 11), which the OS fuses from accelerometer,
magnetometer **and gyroscope**. The gyroscope measures rotation directly and is immune to magnetic interference,
so the fusion lets the gyro carry fast movement while the magnetometer slowly corrects north. Steady AND true.

**All three sensors exist on the floor device.** From the 3T's own `dumpsys sensorservice`:

```
0x00000013) Rotation Vector             | QTI | type: android.sensor.rotation_vector(11)
0x00000017) Game Rotation Vector        | QTI | type: android.sensor.game_rotation_vector(15)
0x00000018) GeoMagnetic Rotation Vector | QTI | type: android.sensor.geomagnetic_rotation_vector(20)
```

| Sensor | Inputs | Used by | Behaviour |
| --- | --- | --- | --- |
| `MAGNETIC_FIELD` + `ACCELEROMETER` | accel + mag | **what we ship today** | wobbles, swings near metal, needs calibration |
| `ROTATION_VECTOR` (11) | accel + mag + **gyro** | **Google Maps** | gyro damps the wobble in hardware |
| `GAME_ROTATION_VECTOR` (15) | accel + gyro | games | very steady but has NO north, useless here |

## 3. The owner's two questions, answered before planning starts

### 3.1 "Do we still need location permission?" YES, and nothing about that changes

The owner asked directly. **A sensor tells you which way the phone POINTS; only a position tells you which way
Makkah LIES.** The bearing is a function of where the phone stands: London 119.0 degrees, Cairo 135.9, Jakarta
295.2, New York 58.5. No sensor of any kind escapes that, and this was already settled in session 37's research.

So the permission stays exactly as it ships: coarse, at the moment of use, on the Qibla screen only.

**`expo-sensors` adds a SECOND permission consideration on iOS**, read from the SDK docs this session:
`NSMotionUsageDescription`, configurable through its plugin's `motionPermission` (and settable to `false`). On
Android it needs `HIGH_SAMPLING_RATE_SENSORS` only above 200Hz, which a compass never approaches. **Whether the
motion prompt can be avoided entirely is a question for the research**, because a second dialog on a screen whose
first dialog is already a cost is a real UX price, and the owner's standing concern is asking at all.

### 3.2 "Can we just face Saudi Arabia?" NO, and the numbers say why

Aiming at the country rather than the point is a real error, measured this session:

| From | Kaaba bears | Saudi centre bears | Error |
| --- | --- | --- | --- |
| Cairo | 135.9 | 112.7 | **23.1 degrees** |
| Istanbul | 151.4 | 136.7 | **14.7 degrees** |
| London | 119.0 | 111.2 | 7.8 degrees |
| New York | 58.5 | 53.2 | 5.3 degrees |
| Jakarta | 295.2 | 299.3 | 4.1 degrees |

Two further flaws in the eyeball-a-map approach, both worth carrying into the research because they explain why
the app draws a dial rather than a map:

1. **A map shows where YOU are, not where Makkah is.** Judging a direction across a flat projection is judging it
   by eye on the wrong geometry.
2. **On a flat map the great circle looks wrong.** From New York the true qibla is north-east; a flat map suggests
   south-east, and the two differ by 43 degrees. That is exactly why some North American mosques face the wrong
   way, and session 37's research already measured it.

**But the owner's instinct is right where it counts: a rock-steady needle a few degrees off beats a jittery one
that is mathematically perfect.** That is the whole justification for this row.

## 4. What the session must decide, and it is a full re-architecture

The owner's instruction: 🐋  "a complete overhaul, a complete re-architecture, complete research again, where we
will deploy multiple agents."

Open questions for the research, none of them answered here:

1. **Which API.** `expo-sensors`' `DeviceMotion.rotation` (alpha/beta/gamma) against a native rotation-vector
   module. `DeviceMotion` is the cheap path and may be enough; it must be measured, not assumed.
2. **Is `DeviceMotion.rotation.alpha` true north or magnetic north**, and on which platform. `expo-location` gets
   true north by applying declination itself (`calcTrueNorth`). If the fused path gives magnetic only, the
   declination has to come from somewhere, and `expo-location` is the only thing in the tree that has it.
3. **Whether `expo-location` stays** for the position while `expo-sensors` supplies the heading, which is the
   likely shape, or whether one package can do both.
4. **The iOS motion permission**, per 3.1: whether it fires at all for the rotation data this needs, and whether
   `motionPermission: false` is viable.
5. **A low-pass filter on top of the fusion**, or none. Maps still damps its own arrow; the fusion is not the
   whole answer to smoothness.
6. **What replaces the calibration warning** shipped in 1.29.111. A fused heading degrades differently, so the
   honest-copy rule needs re-deriving rather than copying.
7. **The 60fps architecture is NOT re-opened.** The transform-only dial measured a median frame gap of 16.7ms on
   the SD820 and is proven; only the source of the number changes.

## 5. What must not regress

- The bearing maths (`shared/qibla.ts`), its 13 invariants and its surveyed fixtures. Exact, and not in question.
- The dial's 60fps architecture, measured on the 3T.
- The permission asked at the moment of use, on this screen only, never at launch.
- The honesty rule: the compass is honest about the needle, never about the number.
- No API keys and no external services (owner, 2026-09-29): 🐋  "I don't want to use any API keys or any external
  services for this."

## 6. Evidence this brief is built on

- `LocationModule.kt:646` in the installed `expo-location@58.0.8`, read this session.
- The 3T's `dumpsys sensorservice`, run this session against serial `8f7ada76`.
- The SDK 58 `expo-sensors` docs, fetched this session for the permission facts.
- The bearing tables above, computed from the great-circle formula this session.
- `ai/plans/37-qibla-compass/RESEARCH.md` for the great-circle-versus-flat-map measurements.
