# Session 47 execution log

## FINAL STATE: 1.29.196. The gyro-fused sensor was shipped, measured inaccurate, and REVERTED.

**Read this first, because the headline reversed twice.** The session shipped `SensorType.ROTATION`
for smoothness (1.29.193), the owner tested it outdoors against Google Maps and Apple Maps, and it was
measurably pointing the wrong way. It is reverted to the platform's own `trueHeading` (1.29.195) and
the alignment window widened to four degrees either side (1.29.196).

**The owner's ruling that governs everything after this:** 🐋  "we want accuracy, 1000% accuracy,
always, always, always accuracy. No. I don't care about smoothness anymore."

| Device | Build installed | Owner's judgement |
| --- | --- | --- |
| Galaxy S23 | 1.29.196 | **~95% accurate**, up from ~70% |
| iPhone XS | 1.29.196 | **still off**, around 85%, consistently |

**The remaining work is queued as row 48**, which is a research row rather than a build row. Its brief
is `ai/plans/48-qibla-heading-accuracy/BRIEF.md` and it carries the four options the owner named.

## The three commits

| Version | What |
| --- | --- |
| `d144d777` 1.29.193 | The gyro-fused sensor, the worklet crash fix, the pop-in fix, the padding fix |
| 1.29.195 | **Reverted** to `watchHeadingAsync`, because the fused sensor is inaccurate |
| 1.29.196 | The alignment window widened to 4 degrees either side, on the owner's request |

## DONE at `d144d777` (1.29.193). 186 suites, 4964 tests, 100% on all four measures.

**Accepted by the owner on both Android phones**: the OnePlus 3T and the Galaxy S23, on RELEASE builds.
🐋  "the performance has been fixed, it's very smooth, it's very good" and, after the axis fix,
🐋  "the direction now has been fixed."

**Still open, and it is the one thing this session could not finish: the iPhone XS is on 1.29.191**, a
build that predates this work and uses the OLD `watchHeadingAsync` path. So iOS has NEVER run this code,
and the owner's report that iOS and Android point differently is a comparison of two different
implementations rather than a defect in either. **Nothing about iOS is proven until the XS carries
1.29.193.**

## The phone changed, and that is the headline

The owner disconnected the Galaxy S23 and connected the **OnePlus 3T (`8f7ada76`)**, which is the floor
device, and asked for all testing to happen there from now on. His instruction: build and install
**locally, never on EAS**, and it **must hot reload** for quick prototype iterations.

The 3T arrived with **no Athan package installed at all**.

### What is on the phone now

| What | State |
| --- | --- |
| Device | OnePlus 3T `8f7ada76`, Android 9 (API 28), 1080x1920 at density 420, arm64-v8a |
| Build | `app-debug.apk`, local Gradle `assembleDebug -PreactNativeArchitectures=arm64-v8a`, 130 MB |
| Install | `adb install -r --user 0`, package `com.mugtaba.athan` |
| Metro | `npx expo start --dev-client --port 8081`, detached, with `adb reverse tcp:8081 tcp:8081` |
| Hot reload | **Working**, proven: the worklet fix below reached the phone without a rebuild |
| Location permission | Granted by hand on the device (fresh install prompted) |

The launch URL is the one in `ai/AGENTS.md`:

```
athan://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081&disableFab=1&disableAutoLaunch=1
```

**The debug build is what gives hot reload**, which is why it was chosen over the production build the
previous session used: a release APK carries its own bundle and cannot reload.

## THE DEFECT: the compass never drew, and it was a crash rather than slowness

The owner reported the sheet rendering blank with the compass arriving seconds later, blamed on loading
cost. **It was not a loading cost. It was an uncaught error on every single sensor reading**, read off
the phone's own error overlay:

```
[Worklets] Tried to synchronously call a Remote Function.
Called "headingFromYaw" on the UI Runtime.
QiblaHeadingSource.tsx (23:5)
[UI]: QiblaHeadingSourceTsx1
```

`useAnimatedReaction`'s prepare function runs on the **UI runtime**, and it called two plain JS
functions:

- `headingFromYaw` in `shared/qiblaHeading.ts`, and through it `normaliseBearing`;
- `onHeading`, the hook's `processReading`, which fires the haptic and writes React state.

Neither could run there. The reaction threw on every reading, so `hasHeading` never became true and
`showsCompass` stayed false: the sheet drew its header, its place name, and an empty stage.

**This also explains the sheet-open symptom without any loading theory.** Nothing was being loaded. The
SVG face is drawn from code already in the bundle, and the position comes from the cached fix.

### The fix, in two parts

| Part | Change | Why this one |
| --- | --- | --- |
| The pure maths | `'worklet'` directive on `headingFromYaw` and `normaliseBearing` | Matches this repo's own convention at `components/countdown/tipGeometry.ts:32`. The functions are pure arithmetic, so they belong on the UI thread |
| The callback | `scheduleOnRN(onHeading, heading)` from `react-native-worklets` | `onHeading` fires a haptic and calls `setState`; neither can run on the UI runtime, so it has to hop back. `runOnJS` is the same call and is **deprecated** in the installed `react-native-worklets@0.13.0` |

`QiblaHeadingSource.tsx`'s prop doc was corrected with it: it claimed the heading was "written on the UI
thread, so a sensor stream at frame rate costs no React render", which was never true of this callback.

### Proven on the phone

The compass **draws on the 3T**, verified by screenshot after a cold relaunch, with the Kaaba mark, the
dial, the jewel and the needle all present and the place reading "Greater London, United Kingdom".

`dumpsys sensorservice` confirms the sensor we asked for is the one running:

```
0x00000013) active-count = 1; sampling_period(ms) = {16.0}, selected = 16.00 ms
0x00000013) Rotation Vector | QTI | type: android.sensor.rotation_vector(11)
```

That is `TYPE_ROTATION_VECTOR`, the gyro-fused sensor, at the 16 ms `SENSOR_INTERVAL_MS` asks for, which
is what `PLAN.md` section 2 specified. The 3T has the full sensor set (LSM6DS3 accelerometer and
gyroscope, MMC3416PJ magnetometer, and the QTI fused rotation vector).

### Frame measurements on the 3T

`dumpsys gfxinfo com.mugtaba.athan`, 15 second windows:

| Condition | Total frames | Janky | p50 | p90 | p99 |
| --- | --- | --- | --- | --- | --- |
| Compass open, phone turning | 1166 | 95.28% | 18 ms | 23 ms | 30 ms |
| Compass open, phone still | 1051 | 99.05% | 31 ms | 40 ms | 48 ms |
| Settings sheet open, phone still | 689 | 86.94% | 23 ms | 31 ms | 38 ms |
| Home screen, phone still | 0 | 0% | n/a | n/a | n/a |

**The frame-REQUEST defect is gone**: the S23 measured 2 frames in 15 seconds before this work, and the
3T now draws over a thousand. The compass turning reads **p50 18 ms**, close to the 16.7 ms vsync.

The home-screen row proves the app itself is silent when nothing is on screen, so this is the compass's
own cost and not a background ticker.

## THE SECOND DEFECT: a tween that could never finish, found by measuring the sensor's real rate

With the compass finally drawing, the phone sitting **STILL** still cost 1051 frames in 15 seconds at a
p50 of 31 ms, WORSE than the same dial while turning. A still dial redrawing 70 times a second is not a
drawing cost, so the question was what kept asking for frames.

**Measured from `dumpsys sensorservice`'s own event log rather than assumed:**

```
Rotation Vector: last 10 events
	 1 (ts=422027.460189016, wall=18:24:02.849)
	 2 (ts=422027.469985159, wall=18:24:02.859)
	 ...
```

Consecutive timestamps are **9.8 ms apart, so the fused sensor reports at about 100 Hz**, not at the
16 ms `SENSOR_INTERVAL_MS` requests. `interval` is a floor, and this phone beats it six times over.

`QiblaCompass.tsx` wrapped every one of those readings in `withTiming(heading.value, { duration: 150 })`.
**A 150 ms animation restarted every 10 ms can never reach its target**: roughly fifteen tweens are
started and abandoned inside the span of one, so the dial is permanently mid-animation and Reanimated
asks for a frame forever, even with the phone face down on a desk.

**The fix is a deletion.** The dial now reads `heading.value` directly, and `useDerivedValue`,
`useSharedValue` and the `isFirstEvaluation` snap go with it. The snap existed to stop the dial spinning
up from north on the first frame, which is exactly what a direct read does by construction, so removing
the tween removed the thing the snap was there to work around.

Smoothing was never this tween's job either: `SensorType.ROTATION` is gyroscope-fused and already smooth,
which is the whole premise of `PLAN.md`. The tween was smoothing an already-smooth signal and costing a
permanent animation to do it.

### Measured, phone still, before and after

| | Total frames / 15s | Janky | p50 | p90 | p99 |
| --- | --- | --- | --- | --- | --- |
| With the tween | 1051 | 99.05% | 31 ms | 40 ms | 48 ms |
| **Direct read** | **633** | **81.36%** | **23 ms** | **34 ms** | **44 ms** |

**40% fewer frames and 8 ms off the median**, for less code. Verified on screen by hot reload: the
compass draws correctly, the Kaaba mark, needle, jewel and gold arc all present.

## Performance Design Rule 7 holds: the gyroscope is idle until the sheet is open

Checked rather than assumed, with the app open and the Qibla sheet closed:

```
0x00000001) active-count = 2   (accelerometer, the OS and another app)
0x00000016) active-count = 2   (significant motion)
```

**`0x00000013`, the Rotation Vector, is absent from the active list entirely** and appears only while the
sheet is open. The sensor arms on open and disarms on close, which is what `QiblaHeadingSource` being a
component rather than a hook buys.

## THE THIRD DEFECT: the sheet opened blank because the compass waited on a sensor we had replaced

The owner reported the sheet opening with its title and icon but no compass, which "pops into place" about
two seconds later. Three serial awaits stood between the tap and the first dial:

```
start() -> await requestQiblaPermission()
        -> await readPosition()
        -> await readDeclination()   <- the slow one
        -> setState(bearing)         -> NOW the sensor component mounts
        -> first sensor reading      -> hasHeading -> the dial finally draws
```

**`readDeclination` was the stall, and the reason is the same gated sensor this whole plan exists to get
away from.** It calls `Location.getHeadingAsync()`, and `expo-location` answers that only after its OWN
magnetometer watch emits a reading: `startHeadingUpdate` registers `TYPE_MAGNETIC_FIELD` and
`TYPE_ACCELEROMETER` at `SENSOR_DELAY_NORMAL` (`LocationModule.kt:634-643`) and `sendUpdate` refuses to
emit until the azimuth has moved 2 degrees AND 50 ms have passed (line 656). **A phone held still moves
0 degrees, so the promise can stay pending for seconds.** The compass was waiting on the very sensor it
was built to stop using.

Worse, the sensor component was gated on `bearing !== null`, so the gyroscope did not even START
warming up until the position and declination had both landed.

### Two changes, both removing a wait rather than adding a cache

| Change | Effect |
| --- | --- |
| `readDeclination()` is no longer awaited: it resolves into state when it arrives | The dial draws immediately and the declination refines under it. Until it lands the heading carries none, which is under a degree in London, against a blank sheet for seconds |
| The sensor arms on `active`, set synchronously at the top of `start()`, instead of on `bearing !== null` | The gyroscope warms up DURING the permission and position reads. Its early readings are already held by `heldRef`, so the dial draws already turned rather than snapping |

The `active` flag is also a tighter statement of Performance Design Rule 7 than `bearing !== null` was:
it is true exactly while the sheet is open, so the sensor cannot outlive it.

### Measured on the RELEASE build, Qibla sheet open

| | Compass visible at | p50 | p90 | Janky |
| --- | --- | --- | --- | --- |
| Before | ~2.0 to 3.0 s | 23 ms | 40 ms | 70.0% |
| After | **~1.0 s** | **14 ms** | 28 ms | 39.0% |

p50 is now **under the 16.7 ms vsync**, and janky frames have gone from 70% to 39%.

## THE FOURTH DEFECT: the place name touched the screen edge, and the cause was an overflow

The owner reported the location line against the bottom of the screen with no padding, on a phone with
hardware navigation keys. `Sheet.tsx` does apply 80dp of bottom padding on Android, so the question was
where it went.

**The content was simply taller than the sheet is allowed to be.** `contentCap={0.85}` caps the sheet at
85% of the screen, and the Qibla column asked for more:

| | dp |
| --- | --- |
| Content wanted | 657.4 |
| The 85% cap allows | 621.7 |
| **Overflow** | **35.7** |

A `BottomSheetView` clamps rather than scrolls, so the overflow is taken off the BOTTOM, and the first
thing below the dial is the padding. The dial was sized from WIDTH alone
(`min(width, 500) - 40` = 371.4 dp on the 3T), which takes no account of how tall the screen is.

**Fix: bound the dial by height as well**, at `DIAL_HEIGHT_SHARE = 0.45`. On the 3T the height bound now
wins and the dial is 329 dp; **on the iPhone XS the width bound still wins at 335 dp, so the approved
iOS look is untouched**, which was checked rather than assumed.

With the owner's two spacing asks applied as well (50% less below the dial, 20% less above):

| | Clearance below the place name |
| --- | --- |
| Before | **3.8 dp** |
| After | **76.6 dp** |

Both platforms now fit inside the cap with room to spare (3T 41.6 dp, XS 104.2 dp).

## THE FIFTH DEFECT: the dial turned backwards, and the fix came from a measurement rather than a derivation

The owner reported the dial spinning clockwise as he turned the phone clockwise, where it must spin
anticlockwise. **Reasoning from the two platforms' sign conventions produced a contradiction**: the same
argument said iOS should be wrong too, and he reported iOS as correct.

That contradiction is what made a device measurement non-negotiable, and session 40 is the precedent,
having shipped a reading 90 degrees out by tuning a constant until a dial "looked right".

**A temporary probe was added to log the raw yaw beside the computed heading**, built, installed on the
S23, and the owner turned the phone through a clockwise quarter turn:

| yaw | heading, as computed |
| --- | --- |
| -1.535 | 273.4 |
| -2.019 | 245.6 |
| -2.502 | 218.0 |
| -3.127 | 182.2 |
| 2.547 | 147.3 |

**The heading FELL while the phone turned clockwise. A compass bearing must climb**, N to E to S. So the
conversion was inverted, and negating the yaw turns those same samples into 87.9, 115.7, 143.4, 179.2,
214.1: a clean climb through a 126-degree sweep.

**The contradiction then resolved itself**: the iPhone is on 1.29.191 and never runs this code at all,
so "iOS is correct" was never evidence about this conversion. **The bug was in shared code and would
have shipped to both platforms.**

The probe was removed and **those five device samples are now the regression test**, in
`shared/__tests__/qiblaHeading.test.ts`, asserting the heading climbs: the only test in the suite taken
from hardware rather than from a convention.

## DECLINATION IS NOW ANDROID ONLY, which the code claimed but never enforced

`readDeclination` carried a comment saying "ANDROID ONLY ... passing it on both platforms double-counts
it", and **the gate was never written**. Measured by reading both libraries' native sources:

| Platform | What the sensor reports | What we add | Result |
| --- | --- | --- | --- |
| Android | `getOrientation` from MAGNETIC north | declination | true north, correct |
| iOS | `XTrueNorthZVertical`, already TRUE north | declination | true north PLUS declination, wrong |

About 0.9 degrees in London, which is why it had not been noticed, but it scales with place: the same
code near Seattle would be about 15 degrees out. `readDeclination` now returns 0 on iOS without asking
the platform at all, so **each platform ends on its own native true-north reading and the app invents
nothing**, which is the owner's standing rule.

## Cold launch on the 3T

**The owner's "30 seconds, blank purple screen, absolutely disgusting" was measured on a DEBUG build, and
it does not reproduce on a release build.** This was the right thing to check first, because a debug
build fetches its whole 2924-module bundle from Metro over the network at every launch while a release
build has it embedded.

| Build | `am start -W` TotalTime | Content on screen | Blank-purple hang |
| --- | --- | --- | --- |
| Debug (what the owner tested) | 5288 ms | 20 s+, sometimes 30 s+ | **Yes** |
| **Release** | **3620 ms** | **between 3 and 4 s** | **No, never reproduced** |

Sampled across a cold launch at 1, 2, 3, 4, 5, 7, 10, 15, 20 and 30 seconds: splash at 3 s, full content
by 4 s, and nothing resembling the hang. The splash-then-white-then-splash flicker he described is the
dev-client's own launcher screen sliding away before the app's splash, which a release build has no
equivalent of.

**So no launch change ships from this session, deliberately.** The 3620 ms cold launch on an SD820 is
dominated by the TLS provider install and JS evaluation already measured in ISSUES #32, and tuning it
against debug-build numbers would have been tuning against an artefact. **Future device judgements
should use the release build**; the debug build earns its place for hot-reload iteration only.

## Traps hit, each of which cost time

- **Metro dies with the shell that started it.** A backgrounded `npx expo start` was killed by SIGTERM
  when its tool call ended, twice. `setsid` does not exist on macOS. What works is a wrapper script
  started inside a subshell: `(nohup bash <script> > log 2>&1 &)`.
- **A stale Metro from the previous session held port 8081**, so a new one silently moved to 8082 while
  `adb reverse` pointed at 8081. Check `lsof -ti:8081` before starting.
- **Two back presses exit the app**, not just the sheets, which sent a measurement run to the launcher
  and produced a screenshot of the home screen. Re-enter with
  `adb shell monkey -p com.mugtaba.athan -c android.intent.category.LAUNCHER 1`.
- **The sheet is still animating when a tap lands.** The Qibla row sits at y=1093 while the settings
  sheet opens and at **y=977** once it settles, so an early tap misses entirely. Wait for the settle,
  and verify with a screenshot rather than assuming the tap landed.
- **The 3T needs about 20 seconds from launch to first frame** on a debug build (10.8 s of that is
  Metro bundling 2924 modules). A screenshot taken earlier shows only the splash colour.

## The audit: dead code, coverage, security

**`NO_HEADING` and its grace window are DELETED, proven unreachable rather than assumed so.** The
sentinel was `-1`, the value `watchHeadingAsync` used to report a lost fix. Every heading now arrives
through `headingFromYaw`, which ends in `normaliseBearing`, whose range is `[0, 360)`: swept across
extremes including the infinities' worth of turns, it never returns a negative. So the branch could not
fire, and with it went `HEADING_GRACE_MS`, `blankRef`, `clearBlank` and `blank`.

**Three test-infrastructure findings, each of which cost real time and is worth carrying:**

1. **The published Reanimated mock's `useAnimatedReaction` is a no-op** (`src/mock.ts:67`), so a
   component whose entire job is to react to a shared value did nothing under test. That is why
   `QiblaHeadingSource.tsx` sat at 0% and the handoff called it untestable. `jest.components.setup.js`
   now gives it a working implementation, and all 185 existing suites stayed green.
2. **Only the FIRST `render()` in a file runs its effects unless the render is awaited.** A bare
   `useEffect` probe fired once in test A and zero times in tests B and C; `await render(...)` fires in
   all three. Every sheet suite here already used the awaited form, which is why none of them hit it.
3. **`clearMocks: true` is set globally** (`jest.config.js:66`), so a module mock's implementation is
   stripped between tests, not just its call records. A mock that must survive has to be restored in
   `beforeEach`, not merely cleared.

**Security: nothing added.** No key, token or secret in the diff; no new network call; `app.json`
untouched apart from the version, so no new permission. The one permission the feature uses is the
foreground location prompt that already existed.

**`find-unused-exports.py` reports its five pre-existing entries and no new ones.**

## State of the checks

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | exit 0 |
| `npx biome check . --error-on-warnings` | exit 0, 381 files |
| Suite | 186 suites, 4964 tests, all passing |
| Coverage | **100% statements, branches, functions and lines** |
| `find-unused-exports.py` | 5 pre-existing entries, none new |

## THE REVERSAL: the fused sensor was smooth and WRONG, proven outdoors against two map vendors

The owner took both phones to a balcony, away from metal, and compared the compass against Google Maps
on Android and both Google and Apple Maps on iOS. Facing the qibla by the maps' own reckoning, the app
put the Kaaba at 9 to 10 o'clock where it should have been at 12.

**The decisive log, captured seconds before his screenshot:**

```
22:15:07  fused: 149.7   platformTrue: 115.3   (true London qibla 118.99)
```

The platform's value would have drawn the Kaaba at 12 o'clock. Ours drew it at 11. That is exactly
what the screenshot shows.

**Why an earlier measurement in this same session said the opposite, and this is the lesson:** four
samples taken with the phone flat on a desk showed the two sources only 5 degrees apart, and that was
read as "the heading is correct". **The error VARIES with orientation**: 5 degrees on the desk, 34 on
the balcony. One orientation is not a measurement of an orientation-dependent error, and the owner's
outdoor test was better evidence than the desk test that preceded it.

A varying error also rules out every fix that would have been attempted next: it is not a constant
offset, not an axis swap, not a doubled heading, and not declination (1.3 degrees).

## THE APP'S GEOMETRY IS PROVEN CORRECT, which is what made the diagnosis possible

Measured off FULL-RESOLUTION frames of the owner's own screen recordings:

| Source | Kaaba from dial North | True | Error |
| --- | --- | --- | --- |
| 22:38 recording, t=0 | 119.4 | 118.99 | **0.4** |
| 23:23 recording, t=30 | 118.9 | 118.99 | **0.1** |

Cardinal steps within about 1 degree of 90 in both. **So the dial, the SVG, `qiblaBearing`, the Kaaba
coordinates, the bottom sheet and the position fix are all exonerated**, and the fault could only be
the heading.

**A METHOD WARNING WORTH MORE THAN THE RESULT: a low-resolution contact sheet produced a confident and
WRONG conclusion.** Reading a 3x3 tile of 400px-wide frames suggested the Kaaba was drifting relative
to North, which is geometrically impossible from a fixed position and would have sent the next session
hunting a defect that does not exist. Re-measuring one frame at native 1080x2340 gave 0.4 degrees.
**Measure full-resolution frames, and treat a contact sheet as an index rather than an instrument.**

## What `watchHeadingAsync` actually is on each platform, which is NOT symmetric

Read from `expo-location`'s own sources, and it inverts the assumption this session started with:

| Platform | What `trueHeading` is built from |
| --- | --- |
| iOS | `CLHeading.trueHeading`, Apple's OWN fused value, the same one Apple Maps draws |
| Android | accelerometer plus RAW magnetometer, no gyroscope, gated at 2 degrees and 50ms |

So on iOS the app is already using the maps-grade value and the XS is STILL off, which is the open
question row 48 inherits. On Android the cruder fusion happens to be well calibrated on the S23.

## The tween returned with the revert, and the arithmetic is why

It was deleted in 1.29.193 because the fused sensor fired every ~10ms, so a 150ms `withTiming`
restarted about fifteen times inside its own duration and could never settle. The platform gates its
heading at 2 degrees and 50ms, so the same tween now completes, and a STILL phone emits nothing at all
and stops requesting frames. Smoothing came back for free as a property of the accurate source.

## The alignment window, 1.29.196

Widened on the owner's request from 1.5 degrees either side to **4**, an 8-degree window.
`ALIGNMENT_EXIT_DEGREES` moved with it to 8, because the 2:1 RATIO is what suppresses the chatter
rather than either absolute value. Re-measured against the jitter samples that justified the original
pair: the widened hysteresis fires **1 tap** where a single threshold on the same samples fires **50**.

One test needed correcting with it, and the defect was in the test rather than the rule: it asserted on
a literal `2` degrees, which sat outside the old enter threshold and inside the new one. It now derives
its probe from the midpoint of the two thresholds, so widening the window again cannot stale it.

## What the next session should pick up

**Row 48 is the successor and carries the whole heading question**, including the four options the
owner named: the `adhan` package, a different package, native Swift and Kotlin, or a fault inside
`expo-location` itself. Its brief is written: `ai/plans/48-qibla-heading-accuracy/BRIEF.md`.

Smaller items this session did not take, kept so they are not lost:

1. **Re-measure the cold launch on a release build if the owner wants it faster.** 3620 ms on the 3T
   is dominated by the TLS provider install and JS evaluation already measured in ISSUES #32, and
   nothing here targeted it. The 20-to-30-second hang he reported was a DEBUG build fetching its
   bundle from Metro and does not reproduce on release.
2. **The OnePlus 3T has not run 1.29.195 or 1.29.196.** It was swapped out for the S23 mid-session
   and carries 1.29.193, which holds the inaccurate fused sensor.
