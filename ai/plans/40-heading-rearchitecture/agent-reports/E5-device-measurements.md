# E5: sensor measurements on the failing OnePlus 3T

Measurement agent E5, session 40, 2026-09-29. Device: OnePlus 3T, serial `8f7ada76`, Android 9, MMC3416PJ magnetometer, LSM6DS3 accelerometer, QTI sensor hub. Every number below is read-only `adb` (`dumpsys sensorservice`, `logcat`, `dumpsys battery`, one `screencap`), nothing installed, nothing launched, no settings touched. Device clock throughout; host clock ran 6 to 8 minutes ahead of device wall time this evening.

## Verdict, first

This phone's magnetometer is not broken. It measures, stably and repeatably, a field that is not Earth's. On the desk today the calibrated stream reads |F| 103.5 to 105.1 uT against London's 49.0 (2.11 to 2.14x), horizontal component 25.2 to 25.7 uT against 19.5 (1.29 to 1.32x), and dip 75.9 deg against 66.5 (+9.4). The dip error is the proof: dip is heading-independent, and Earth's field at this address does not dip 76 deg. Round 1's key artefact is corrected here: the "bias constant across 90 minutes" claim is a frozen `dumpsys` buffer, not a measurement. From the measured horizontal surplus the compass error at this desk is 39 to 41 deg under perpendicular geometry, inside the owner's observed 25 to 55 deg band.

London truth used everywhere below: F 49.0 uT, H 19.5 uT, dip 66.5 deg, declination 1.18 deg, from D1/D2's IGRF-14/WMM2025 evaluation for 51.48 N 0.195 W on 2026-09-29 [P, round 1]. My computations on top of it are [M] arithmetic on [P] inputs.

## 1. Field readings versus London truth

The owner's app (`com.mugtaba.athan`, uid 10194) sat in the foreground from 16:00:52 holding the calibrated magnetometer and accelerometer at 5 Hz each (200 ms). I polled `dumpsys sensorservice` 197 times over 47 minutes and paired each magnetometer sample with the nearest accelerometer sample (max gap 0.2 s). Two desk epochs exist because the phone was repositioned in my blind window (section 4): epoch B 17:10 to 17:40, epoch C 17:49 to 17:56.

| Quantity | Epoch B (n=1280) | Epoch C (n=510) | London truth | Error B | Error C |
| --- | --- | --- | --- | --- | --- |
| Total field, mean uT | 105.06, sd 0.46 | 103.53 | 49.0 | 2.14x | 2.11x |
| Horizontal, mean uT | 25.67, sd 0.20 | 25.20 | 19.5 | 1.32x | 1.29x |
| Dip, mean deg | 75.86, sd 0.12 | 75.91 | 66.5 | +9.4 | +9.4 |
| Phone tilt from flat, deg | 9.3 | 9.6 | 0 assumed by round 1 | | |

Every per-minute mean across 30 minutes of epoch B stayed inside 104.6 to 106.2 uT. The reading is stable, coherent and wrong. The vertical-down component measures 101.8 uT where Earth supplies 44.9, an excess of 56.9 uT straight down, which is the single largest anomaly component on this desk.

A third epoch exists at 15:26:21 from the wakeup-secondary buffers (2 mag, 4 accel samples): F 63.9 uT, H 51.4 uT, dip 36.5 deg, heading 237.5. Same desk, different spot or orientation two hours earlier: dip was 30 deg too shallow where it is now 9.4 deg too steep, and H was 2.6x truth where it is now 1.3x. The desk field varies enormously at phone scale, which matches D2's cited 12 cm influence scale for desk objects [P, round 1].

Correction to round 1, stated plainly: D1 and D5 computed H and dip assuming a flat phone. The accelerometer says the phone lies at 9.3 to 9.6 deg of tilt. Recomputed on the true gravity plane, dip is 75.9 deg, not 67.8, and H is 25.7 uT, not 39.4. Round 1 overstated the horizontal anomaly (20 uT surplus; real surplus 6.2 uT) and missed the dip error entirely (+1 deg claimed; real +9.4). The 45 deg heading-error story survived by coincidence of two offseting errors; the corrected perpendicular-geometry figure is 39 to 41 deg, still inside the owner band.

## 2. Is the bias stable, and is it plausible

COULD NOT MEASURE bias stability, and round 1 could not either. Here is why. The uncalibrated magnetometer (type 14) has had no subscriber since 15:28:03. `dumpsys` serves its "last 10 events" from a buffer that only updates while something listens. Every later capture, mine at 16:59, 17:10 through 17:56, and round 1's "90-minute window", replays the same ten timestamps from 15:28:00.053 to 15:28:00.226, a span of 178 ms. The bias triplet `(-34.34, 14.10, -75.92)` is constant across those 10 samples because 178 ms of a static phone contains no new information, not because 90 minutes of calibration state was observed. The logcat confirms no uncalibrated-mag subscription after 15:28. Any claim built on that buffer's "stability" is built on nothing.

What the frozen window does give, at 15:28:00, is one simultaneous raw-plus-bias reading:

| Stream at 15:28:00 | Values (x, y, z) uT | Magnitude |
| --- | --- | --- |
| Uncalibrated raw, 10-sample range | x 4.69 to 7.12, y -10.60 to -9.37, z -130.39 to -127.71 | 127.8 to 130.6 |
| Reported bias, all 10 samples | -34.34, 14.10, -75.92 | 84.5 |
| Implied calibrated (raw minus bias, sample 1) | 39.43, -23.73, -54.25 | 71.1 |

Plausibility of 84.5 uT as hard iron: plausible in size. Phones carry speaker and camera magnets whose fields at the sensor are in the tens of uT, and the bias exists to absorb exactly that [P, D2 round 1]. What is not plausible is that the bias describes a clean environment. Three independent reads disagree: the implied calibrated magnitude is 71.1 uT where Earth supplies 49, the calibrated secondary stream two minutes earlier read 63.9 uT pointing 10 deg differently, and today's live stream reads 103.5 to 105.1. The calibration is subtracting a vector that does not make the residual equal Earth's field at any of these spots. Whether that is a stale fit or a correct fit in a distorted room is exactly what the data cannot separate from a desk; both D1 rank 1 and D2 section 6 remain live.

One genuine calibration observation, from logcat: the SEE registry (`sns_reg_la.c`) logged writes at offsets 1792 (24 bytes) at 15:42:52, 15:43:02, 15:47:59 and 15:48:03, and paired writes at offsets 10752 (58 bytes) plus 11008 (22 bytes) at 15:43:09, 15:43:13, 16:00:45 and 17:31:39. The first cluster sits inside the window when the owner was actively using a qibla app with the phone in hand (per the subscription log). The 17:31:39 pair fired while the phone lay still on the desk. I cannot decode the payloads without vendor source, so semantics are [U]: these are plausibly persisted calibration and bias state. What is [M]: the calibration machinery does write, and it wrote during hand motion and also once during stillness.

## 3. Computed heading error, from measurements

Method. For each paired sample I computed the tilt-compensated heading exactly as `SensorManager.getRotationMatrix` plus `getOrientation` does: project the calibrated field onto the plane perpendicular to gravity, take `atan2` of the horizontal components. I verified my sign convention on constructed cases (flat phone, top north gives 0 deg, top east gives 90 deg) and then cross-validated on live data: at 17:39 my formula gives heading 358.6 deg, and the vision subagent read the app's rendered dial as essentially unrotated with N at top (a `screencap` of the live qibla sheet, marker at 119 deg, dial face rotation equals minus heading). Predicted face rotation 1.4 deg against a vision read of "unrotated": agreement within about 4 deg. The app is consuming these very sensors and my pipeline reproduces its render.

The error the desk field produces. The measured horizontal vector is the vector sum of Earth's 19.5 uT and the anomaly's horizontal part. From the triangle, the anomaly magnitude is between 25.7 minus 19.5 equals 6.2 uT (anomaly opposed to Earth is impossible here since 25.7 exceeds 19.5, so this end means near-aligned) and 25.7 plus 19.5 equals 45.2 uT (opposed). The heading error for a given anomaly geometry is `atan2(d sin phi, 19.5 + d cos phi)` where phi is the anomaly's angle from north.

| Assumed geometry | Anomaly size uT | Heading error deg |
| --- | --- | --- |
| Perpendicular (worst case at this H) | 16.7 | 40.6 |
| Owner band lower end, 25 deg | 11.5 | 25 |
| Owner band midpoint, 34 deg | 14.5 | 34 |
| Owner band upper end, 55 deg | 21.6 | 55 |

The perpendicular geometry at today's measured H gives 40.6 deg (epoch B) and 39.3 deg (epoch C). The owner's observed 25 to 55 deg band requires 11.5 to 21.6 uT of horizontal anomaly, which sits inside the measured 6.2 to 45.2 uT bounds and brackets the perpendicular value 16.7. Measured and observed agree. The 15:26 epoch, H 51.4 uT, would give up to 67.7 deg at the same spot family, so position on the desk alone sweeps the whole observed band.

What the standard path would produce on a correct field: with Earth's 49 uT at 66.5 deg dip rotated into this phone's frame, the same pipeline returns the phone's true azimuth plus 1.18 deg declination. The predicted error is therefore the full angle between measured and true horizontal directions, bounded by the table above. I cannot pin the exact error at the desk because no read-only reference for true north exists here (see COULD NOT MEASURE); the measured bound and the owner band are the cross-check, and they match.

## 4. Does the error depend on orientation: external field versus phone-attached

This is D5's discriminator and the desk answered part of it by accident. Between 17:40 and 17:49 the phone was repositioned (not by me; every command I ran was read-only). Epochs B and C have gravity vectors 0.41 deg apart, so the phone kept its lie, but its heading reading moved 33.5 deg, from 354.4 to 320.9. I fit a pure yaw about gravity to the two field vectors: a rotation of minus 32.1 deg maps epoch B's field onto epoch C's with a residual of 1.09 uT on a 104 uT field.

That residual is the measurement. A disturbance dominated by a source attached to the phone (hard iron beyond the calibration, a case magnet) rotates with the phone, so it appears constant in phone frame and the world-field direction would appear to swing. The observation is the opposite: the field direction stayed fixed in the world frame while the phone yawed under it. The dominant disturbance on this desk is external to the phone. Two consequences follow. First, at a given spot the compass error is a constant offset (the angle between measured and true horizontal directions), not a heading sinusoid; the classic hard-iron sinusoid applies to the residual the calibration fails to remove, which is bounded by the disagreement noted in section 2, not by the 56.9 uT environmental anomaly. Second, no recalibration performed on the desk can fix this: the calibration cannot distinguish "Earth points elsewhere" from "a laptop puts 56.9 uT straight down", which is D2's section 4 argument, now with a number.

The remaining discriminator needs the owner, because only he can give the phone a known reference. The two-minute procedure is at the end of this report.

## 5. The three rotation-vector sensors

Inventory [M, `dumpsys` sensor list]: `rotation_vector` type 11 exists twice, QTI handle 0x13 (the one apps get by default) and an AOSP software fallback handle 0x5f726f76; `game_rotation_vector` type 15, QTI 0x17 plus AOSP; `geomagnetic_rotation_vector` type 20, QTI 0x18 plus AOSP. All three AOSP software fusions report disabled with 0 clients in every one of my 197 polls. Whatever serves rotation data on this phone comes from the QTI hub.

Which are populated:

| Sensor | Ever delivered events in any capture | Rate observed | values[4] accuracy |
| --- | --- | --- | --- |
| Rotation Vector (QTI 0x13) | Yes, 10 events at 15:28:49 | 4.9 ms spacing, 204 Hz | 0.00 in all 10 |
| Game Rotation Vector | No, buffer never present in 197 polls | COULD NOT MEASURE | COULD NOT MEASURE |
| GeoMagnetic Rotation Vector | No, buffer never present | COULD NOT MEASURE | COULD NOT MEASURE |

The rotation vector events exist because the qibla app `qibladirectioncompass.qiblafinder.truenorthcompass` (uid 10195, logcat tag `J6.c`) subscribed handle 0x13 at 5 ms from 15:28:24 to 15:28:49. The `values[4]` estimated-accuracy slot reads 0.00 in every event, confirming R3 and D1: on this device that slot is dead, so row 40 cannot key any "unreliable heading" UX on it.

Fused versus raw on the same phone, same field, near-same moment. At 15:28:49 the QTI rotation vector reports q = (0.06, -0.09, 0.96, 0.27), norm 1.0031, which is azimuth 211.9 deg, pitch about -12, roll about -8 (AOSP matrix convention, verified by two derivations agreeing within 1.3 deg). At 15:28:00, 49 seconds earlier with no significant motion in between (SMD silent, GMS gyro window reading ~0.01 rad/s), the raw path on the uncalibrated-minus-bias field gives heading 227.5 deg. The gap is 15.6 to 16.9 deg depending on convention details. Labelled assumption: the gravity vector for the raw-path computation is borrowed from the 15:26:21 secondary buffer because the primary accelerometer buffer was overwritten by the live stream; at epoch dip 43 deg a 3 deg gravity error moves the heading by about 2.6 deg, so the gap is real within a few degrees.

Decision-relevant reading for row 40: the fused sensor on this phone does not reproduce the raw path (17 deg apart at one static pose in a 64 to 71 uT field), so switching to it changes the answer. It also does not escape the distorted field: both readings are tens of degrees from anything defensible, in a field whose magnitude was then already 1.3x Earth and whose dip was 43 deg against 66.5. And today's live desk field, 105 uT, sits above the AOSP software fusion's 100 uT rejection threshold [P, D1 round 1], so a hypothetical AOSP-fusion consumer here would reject the magnetometer outright and coast on gyro until it drifted. The QTI hub's own gating is closed vendor code and remains unmeasurable. This supports D5's objection in its precise form: on this device, in this field, fusion differs from raw but does not resist the field.

## 6. Environment

All data above is desk data. The phone lies on the owner's dev desk beside this machine, USB cable connected and charging at 100 percent (`dumpsys battery`: USB powered true), which makes the cable and the laptop legitimate magnetic suspects I could not move. The field here is stable in time (F held 104.6 to 106.2 uT across 30 minutes; the 32 deg phone yaw reproduced the world field direction to 1.1 uT) and violently position-dependent (F 63.9 at 15:26 versus 105.1 at 17:15; dip 36.5 versus 75.9). A stable, position-dependent, magnitude-inflated field is the fingerprint of fixed ferromagnetic or magnetised furniture, not of a misbehaving sensor.

Limitation, stated clearly: the owner's failing comparison happened standing mid-room holding the phone, not on this desk. The bedroom's field is unmeasured and nothing in this report measures it. What the desk data proves is that this phone faithfully records whatever field it sits in, including fields 2.1x Earth with 10 deg of dip error, and that the error such a field produces brackets the owner's 25 to 55 deg observation. Whether the bedroom supplies a similar field is the walk-test question D1 already ranked first.

## 7. Fixture data for the test suite

All files under `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/E5/`:

| File | Contents | Format |
| --- | --- | --- |
| `fixture-desk-streams.csv` | 1790 rows, epochs B (1280) and C (510) | CSV, one line per paired sample |
| `fixture-frozen-epochs.json` | 15:26 secondary pair, 15:28 uncal raw plus bias, 15:28:49 quaternion, London truth block | JSON |
| `events.jsonl` | Every event my poller harvested, all sensors, deduplicated | JSON lines |
| `dumpsys-full-1.txt`, `rawdumps/` | Full raw dumps at capture time | Text |
| `logcat-full.log` | 15:42 to 17:45 device log incl. registry writes | Text |
| `screen1.png` | Live qibla sheet screenshot used for the render cross-check | PNG |

`fixture-desk-streams.csv` columns: `epoch` (B or C with time window), `ts_s` (device monotonic clock, seconds, 6 decimals), `wall_device` (device wall clock hh:mm:ss.mmm), `accel_x_m_s2` to `accel_z_m_s2`, `mag_cal_x_uT` to `mag_cal_z_uT` (calibrated type 2 stream). Sample spacing 200 ms. The phone is static within each epoch. To become repo fixtures a planning session should: copy the two fixture files into `shared/__mocks__/sensors/` or equivalent, keep the column names, and document that the magnetometer data is the calibrated stream (bias already applied by the HAL), that the uncal raw and bias pair exists only in the JSON at 15:28, and that E3's maths can regenerate headings from these pairs exactly as section 3 does. The epoch pair also encodes a built-in test: rotate epoch B's field by minus 32.1 deg about its gravity vector and it must land on epoch C within 1.1 uT.

## The owner's two-minute rotation procedure

Goal: separate "the room bends the field" from "the phone's calibration is stale", using no instruments, at the spot where the needle reads wrong.

1. Stand at the failing spot. Open the Athan qibla screen. Note where the needle points relative to a fixed object in the room (a door handle, a window edge). 15 seconds.
2. Turn your whole body slowly through a full circle, about 30 seconds per turn, holding the phone flat at chest height. Watch the needle the whole way. Do not wave the phone, just turn. 40 seconds.
3. If the needle tracks your turn evenly, one steady rotation for one steady turn, and lands back where it started, note that. If it lags, sticks, or swings at some part of the circle, note the room direction where that happens. 10 seconds.
4. Now repeat the circle holding the phone against your chest with your back straighter, so the phone is upright rather than flat, then once more flat. 40 seconds.
5. Read the three outcomes. Even tracking at every heading means a constant offset, which is an external field: the room is the cause, and walking two metres away or to the doorway should change the needle (test that in the same two minutes if it fits). A wobble or error that peaks at one heading and vanishes 180 degrees later means a phone-attached residual, hard iron the calibration missed: a figure of eight in place is worth trying. Different behaviour flat versus upright at London's steep dip means tilt handling, not the room.

What to send back to the session: even or uneven, the room direction of any wobble, and whether the needle changed at the doorway.

## COULD NOT MEASURE

- Bias stability over time. The uncalibrated stream has had no subscriber since 15:28:03 and `dumpsys` replays a frozen 178 ms buffer. Round 1's "constant across 90 minutes" was this artefact. No read-only path exists to subscribe a sensor; I tried `cmd sensorservice` (uid-state overrides only), the `/system/bin/sensorservice` diagnostic binary (it is the service itself and hung harmlessly until timeout), and HAL file paths (absent or permission-denied, no root on this production build).
- `game_rotation_vector` and `geomagnetic_rotation_vector` live values, and `values[4]` under any condition other than rest: no app subscribed them in any window I captured, so their buffers never existed. Only the QTI rotation vector ever delivered events, 10 of them, all at rest.
- The true error sign at the desk (which direction the needle lies from truth): no read-only north reference exists. The error is bounded and cross-checked against the owner band only.
- The bedroom field, and the phone in hand mid-room: all measurements are desk measurements. Stated in section 6.
- Whether the 15:28:49 fused azimuth changed while the phone moved: the rotation vector buffer froze the moment the qibla app unsubscribed. The 17 deg fused-versus-raw gap is one static pose.
- The QTI hub's internal gating and the meaning of the SEE registry offsets: closed vendor code, payloads undecodable without source.
- Anything on the iPhone XS: no equivalent read-only sensor path, and installs are forbidden.
- Who repositioned the phone at 17:45: not this agent (all commands read-only), and the transition fell inside my poller restart gap.

## Raw readings taken

Device clock. Calibrated magnetometer is the type 2 stream.

| Time | Source | Raw values | Derived |
| --- | --- | --- | --- |
| 15:26:21.244 | Accel wakeup secondary, 4 samples | (-0.31 to -0.33, -2.26 to -2.29, 9.66 to 9.75) m/s2 | tilt 13.3 deg |
| 15:26:21.289 | Cal mag wakeup secondary, 2 samples | (44.28, -18.86, -42.03) and (44.93, -19.08, -42.05) uT | F 63.9 / 64.4, H 51.4 / 52.1, dip 36.5 / 36.1, heading 237.5 / 236.8 |
| 15:28:00.053 to .226 | Uncal mag, 10 samples | raw x 4.69 to 7.12, y -10.60 to -9.37, z -130.39 to -127.71; bias (-34.34, 14.10, -75.92) uT | raw F 127.8 to 130.6, bias 84.5, implied cal F 71.1 |
| 15:28:00.141 to .232 | Gyro uncal, 10 samples | rates ~0 to 0.25 rad/s per axis, bias (-0.02, 0.01, -0.02) | stationary |
| 15:28:49.791 to .836 | QTI rotation vector, 10 samples | q (0.05 to 0.06, -0.09, 0.96, 0.27), values[4] 0.00 | azimuth 211.9 deg, 204 Hz |
| 16:59:49.996 to 51.784 | Cal mag, 10 samples at 200 ms | (-6.61 to -6.89, 38.62 to 38.86, -96.74 to -97.00) uT | F ~104.5 |
| 17:10 to 17:40 | Cal mag plus accel, 1280 pairs at 5 Hz | per-minute F 104.60 to 106.22, H 25.52 to 26.05, dip 75.64 to 76.06 | heading 354.2 to 358.8 |
| 17:39:47 to 59 | Cal mag, 30 samples | (-9.24 to -8.75, 39.08 to 39.29, -98.44 to -97.88) uT | subset of the above |
| 17:49 to 17:56 | Cal mag plus accel, 510 pairs at 5 Hz | mean mag (5.96, 33.05, -97.93), mean accel (0.97, -1.32, 9.70) | F 103.53, H 25.20, dip 75.91, heading 320.9 |
| 17:39 | `screencap` of live qibla sheet | dial unrotated, marker at 119 deg, N at top | matches sensor heading 358.6 within ~4 deg |
| session | 197 `dumpsys` polls | AOSP fusions disabled, 0 clients, every poll | QTI hub serves all rotation data |
| 15:42 to 17:31 | logcat SEE registry | writes: 1792 (24 B) at 15:42:52, 15:43:02, 15:47:59, 15:48:03; 10752 (58 B) plus 11008 (22 B) at 15:43:09, 15:43:13, 16:00:45, 17:31:39 | calibration machinery active |
| session | `dumpsys battery` | USB powered true, level 100 | cable connected throughout |

Measurement scripts and full outputs live in the temp directory above; nothing was added to the repository except this report.
