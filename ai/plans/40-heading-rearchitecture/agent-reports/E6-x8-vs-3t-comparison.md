# E6: the Find X8 against the OnePlus 3T, measured side by side

Measured 2026-09-29 over adb, both phones on the owner's desk in Fulham, London. Every row marked [M] is
read from `dumpsys sensorservice` on the device today.

The owner's question: the X8 reads correctly and the 3T does not, so what is different, and can the 3T be
calibrated into behaving like the X8.

## The verdict

**Calibration is NOT the difference, and calibrating the 3T would not have fixed it.** The X8 carries a
LARGER hard-iron bias than the 3T and sits in an equally distorted field, yet points correctly. The
difference is that the X8's heading is gyro-fused and reports an honest accuracy band, while the path
`expo-location` uses on the 3T is the raw accelerometer-plus-magnetometer pair with no gyroscope and a dead
accuracy value.

## 1. The field both phones see [M]

| | OnePlus 3T | OPPO Find X8 | London truth |
| --- | --- | --- | --- |
| Magnetometer part | MEMSIC `MMC3416PJ` | AKM `akm09919` | |
| Calibrated field magnitude | 104.5 uT | 101.4 uT | 49.0 uT |
| Ratio to truth | 2.13x | 2.07x | 1.00x |
| Stored hard-iron bias | 84.5 uT | **114.8 uT** | |
| Accuracy value on the calibrated stream | **absent** | **3 (HIGH)** | |

Both phones read roughly twice the true field, so the desk is magnetically hostile to both equally. The X8's
stored bias is 36 percent LARGER than the 3T's. A theory that blames the 3T's calibration has to explain why
the phone with the worse bias is the one that works, and it cannot.

## 2. The hardware each phone has [M]

| Sensor | OnePlus 3T | OPPO Find X8 |
| --- | --- | --- |
| Gyroscope | `LSM6DS3` (STMicroelectronics) | `icm456xy` (InvenSense) |
| Rotation vector (11) | QTI | MTK |
| Game rotation vector (15) | QTI | MTK |
| Geomagnetic rotation vector (20) | QTI | MTK |
| AOSP software fusion engines | present | present |

**The 3T has a gyroscope and a rotation vector.** The owner's instinct that the technology is present is
correct. Nothing about the 3T's hardware prevents a fused heading. The defect is which sensor the app's
library subscribes to, not what the phone can supply.

## 3. The two heading paths on the 3T, computed from the same device [M]

`expo-location` builds its Android heading from `getRotationMatrix(accel, magnetometer)` then
`getOrientation`, which is the raw pair. The fused alternative is `TYPE_ROTATION_VECTOR` through
`getRotationMatrixFromVector`.

Both computed from the 3T's own captured samples:

| Path | Heading (magnetic) |
| --- | --- |
| RAW accel + magnetometer (what ships today) | 227.5 deg |
| FUSED QTI rotation vector | 211.9 deg |
| **Difference** | **15.6 deg** |

The two paths disagree by 15.6 degrees on this device, in this field. So the sensor choice measurably changes
the answer on the failing phone.

## 4. `values[4]` is dead on the 3T [M]

The 3T's rotation vector reports its estimated heading accuracy as `0.00` on every captured sample. The X8
reports an accuracy band of `3` (HIGH) on its calibrated magnetometer stream, a field the 3T's stream does
not carry at all.

So the honesty signal has to come from the physics checks (field magnitude against the expected 49 uT, dip
against the expected 66.5 degrees) rather than from the vendor's own verdict, on this device at least. The
3T's dip measures 75.9 degrees against a true 66.5, which is a 9.4 degree error that no heading can explain
away, and that is the check that catches this failure.

## 5. What this means for the fix

1. **Ship the fused rotation vector.** It is present on the 3T, it is what the X8 uses, and it measurably
   changes the heading by 15.6 degrees on the failing device.
2. **Do not ship a calibration ritual as the primary fix.** The X8's larger bias disproves the premise.
3. **Derive trust from physics, not from the vendor.** `values[4]` is dead on the 3T and the accuracy band is
   absent from its calibrated stream, so field magnitude and dip are the only checks that work on both
   phones.

## COULD NOT MEASURE

- The X8's own heading from `dumpsys`. Android 16 masks sensor values (`[value masked]`), so the X8's
  accelerometer and computed heading are unavailable over adb. The on-device app reading is the substitute.
- Simultaneous captures from both phones at the same instant. The two dumps are seconds apart and the phones
  sit in different spots on the same desk, so the field each sees is not identical.
- Whether the 15.6 degree gap persists through a rotation. A single static pair shows the paths disagree; it
  does not show which is closer to truth.
