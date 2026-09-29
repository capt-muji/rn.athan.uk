# Device atlas: OPPO Find X8 (CPH2659)

Serial `G6RWBAQ4VKWWEAIZ`. Android 16 (API 36), ColorOS. Second Android test device beside the OnePlus 3T.

Read this BEFORE screenshotting. Screenshot only what is missing, then write back what you learned.
Every coordinate is keyed on model + panel + density + screen state, and is void when any of those change.

## Install ritual

| What | How |
| --- | --- |
| Install dialog ("cancel installation" / "continue installation") | PREVENTED for adb installs by `adb -s G6RWBAQ4VKWWEAIZ shell settings put global verifier_verify_adb_installs 0` and `package_verifier_enable 0` (set 2026-09-29; original values were both 1). With these at 0 an `adb install -r` completes unattended. |
| Install duration | A 142 MB release APK takes 60 to 90 seconds to appear in `dumpsys package`. `adb install` returns nothing useful in that window, so poll `dumpsys package com.mugtaba.athan \| grep lastUpdateTime` in loops of 14 seconds and compare the timestamp rather than waiting on the command. |
| Launch after install | `adb shell monkey -p com.mugtaba.athan -c android.intent.category.LAUNCHER 1`, twice: the first start after an install can land on the launcher. |

## Sensors, measured 2026-09-29

| Sensor | Part | Vendor |
| --- | --- | --- |
| Magnetometer | `akm09919` | AKM |
| Gyroscope | `icm456xy` | InvenSense |
| Accelerometer | `icm456xy acc` | InvenSense |
| Rotation vector (11) | `rot_vec` | MTK |
| Game rotation vector (15) | `game_rotvec` | MTK |
| Geomagnetic rotation vector (20) | `geo_rotvec` | MTK |

**Android 16 MASKS sensor values in `dumpsys sensorservice` for some sensors**, printing `[value masked]`
instead of the readings. The magnetometer and accelerometer still print real values; `linear_acc` and several
others do not. So this device cannot substitute for the 3T when a raw stream is needed, and an in-app probe is
the only reliable read.

The calibrated magnetometer stream carries a FOURTH value, the accuracy band (0 to 3). The 3T's does not.

## Readings taken 2026-09-29, Fulham

| Where | Field | Accuracy band |
| --- | --- | --- |
| On the desk | 101.4 uT (2.07x London's 49 uT) | 3 (HIGH) |
| Held up, off the desk | 47.3 uT (correct) | **0 (UNRELIABLE)** |

The desk is magnetically hostile. Away from it the field is correct while the phone reports its accuracy as
UNRELIABLE, which is the opposite of what the band is supposed to mean and is why the band cannot be trusted
as the app's honesty signal on its own.
