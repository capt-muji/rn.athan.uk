# Round 2, agent 3: the field reality of expo-location's heading API

Returned 2026-09-28. **This is the report that settles the Option A vs Option B decision** left open by
round 1's section 13.2, and it settles it with evidence rather than preference.

The agent marked claims **CONFIRMED** (observed in a primary source) or **INFERRED**. Planner's ruling in
`RESEARCH.md` section 16.

---

## 1. The issue landscape is TINY, and that is the headline

A GitHub API search of `repo:expo/expo watchHeadingAsync` returns **10 total issues and PRs across the
repository's entire history**, of which about 7 are real heading reports. **The most recent
heading-specific bug report was filed in September 2022.** Nothing since. CONFIRMED.

| Issue | Year | Platform | Complaint | Resolution |
| --- | --- | --- | --- | --- |
| #4081 | 2019 | Android emulator | `getHeadingAsync` does not fire on tablet emulators | stale-closed |
| #4266 | 2019 | iOS | `watchHeadingAsync` floods the JS thread | closed, needs info |
| #12548 | 2021 | both | 90° physical rotations give 85 to 95° deltas | stale-closed, no reply |
| #14481 | 2021 | iOS | `remove()` crashes | **fixed**, an RN 0.65 EventEmitter regression |
| **#16640** | 2022 | Android | **"heading values go totally out of order if the telephone is tilted"** | **stale-closed, NEVER FIXED** |
| **#19071** | 2022 | Android | trueHeading flickers and **logs negative values** (−10.75, −12.90) | **partially fixed, see below** |

## 2. THE NEGATIVE trueHeading BUG: reported once, "fixed" incompletely, still live

**This confirms this session's own source reading, and adds the history behind it.**

- **Issue #19071** (Sep 2022, SDK 46): a user logs
  `-10.756927490234375, -12.9041748046875, -10.64691162109375, 347.04...` while rotating clockwise.
- **PR #19629**, "[location][Android] Fix trueHeading is sometimes bigger then 360", merged 2022-10-20,
  changed `calcTrueNorth` from `magNorth + declination` to `(magNorth + declination) % 360`. **The PR body
  explicitly claims it fixes "trueHeading reports a negative value right before rolling back to zero."**
- **But Kotlin's `%` preserves the dividend's sign, so it only clamped the TOP end.** The agent verified
  the current sdk-58 branch source and found the same code this session read in the installed package.

> **So the bug is four years old, was believed fixed, and is still live wherever
> `magHeading + declination < 0`, which is much of the Americas.**

**No issue has ever been filed about the remaining negative case.** The agent's inference for why: most
Expo users are in positive-declination regions where it only bites within a few degrees of north, and the
flicker reads as generic compass jitter, so it gets smoothed over rather than reported.

**Also confirmed:** `trueHeading` returns `-1f` when permission is missing OR when `mGeofield` is null, and
**that sentinel is indistinguishable from a small negative real heading except that it is exactly −1.**

## 3. Lifecycle and leaks: clean today, with history

- The only `remove()` crash was an RN 0.65 regression, fixed years ago.
- **expo-location 58.0.0 changelog: "[Android] Fix leaking watches (#48294)".** A watch leak was fixed in
  the exact major version we are on. We are on 58.0.8, so we have it. CONFIRMED.
- **PR #35004** (Feb 2025) fixed the iOS streamer continuing to emit after unsubscribe **and added an
  optional `errorHandler` second argument** to `watchHeadingAsync`. Available in SDK 58.
- **Discussion #24268** (2023) asks for a `timeInterval` option because updates still arrive "several times
  per second" even with the 2°/50ms throttle. Unresolved, zero replies. **Throttle in JS.**

## 4. Stack Overflow field reports

- **SO 68100176** (2021, unanswered, 619 views): "On iOS all works fine but on Android the heading changes
  without moving the device... trueHeading changes about two degrees with the device stationary"
  (265.49 → 267.61 → 265.55).
- **SO 73678894** (2022, accepted answer): the same 17/358 flicker. **The accepted community answer
  recommends abandoning `watchHeadingAsync` on Android in favour of `DeviceMotion` from expo-sensors**,
  computing heading from `rotation.alpha`.

**Crucially, the agent then verified what backs `DeviceMotion` on Android: `TYPE_ROTATION_VECTOR`**,
confirmed in `DeviceMotionModule.kt` on the sdk-58 branch. **So the community's escape hatch is literally
"use the rotation vector instead", and it is reachable without leaving Expo.**

**The pattern across every report: iOS is fine; Android is unstable and worst near 0/360. Nobody in the
wild has isolated the sign-modulo; they all describe symptoms.**

## 5. SDK 58 specifics

- The expo-location CHANGELOG back two years contains **only two heading-adjacent entries**: the iOS
  unsubscribe fix and the Android watch leak. **No heading behaviour changes, no regressions.**
- **Zero expo-location or heading issues among current SDK 58 issues.**
- expo-location has been an Expo Modules (Swift/Kotlin) module since SDK 43, so it is New-Architecture
  native by construction; the bridgeless migration did not touch the heading path.

## 6. Real-world accuracy of this exact library

**Nobody publishes quantitative accuracy write-ups of expo-location's heading.** No blog, paper or
benchmark compares it against CLHeading or the rotation vector. CONFIRMED as an absence, after extensive
search.

**The strongest real-world signal remains #16640**, the tilt dependence, which is the
`remapCoordinateSystem`-never-called symptom. Every other native compass implementation remaps
`AXIS_X/AXIS_Z` for portrait before calling `getOrientation`. expo-location does not.

## 7. The alternatives, evaluated

| Library | Android path | Maintained | New Arch | Verdict |
| --- | --- | --- | --- | --- |
| **expo-location** | mag + accel + `getRotationMatrix`, no remap, `% 360` sign bug | first-party | yes | ships today |
| **expo-sensors `DeviceMotion`** | **TYPE_ROTATION_VECTOR**, OS-fused | first-party | yes | already in our tree; gives `rotation.alpha`; **no declination, no accuracy signal** |
| **react-native-attitude 3.1.2** | **rotation vector + `remapCoordinateSystem` for all 4 rotations**, normalised `((deg+360)%360)`, 1 to 1000 Hz | active (Sep 2026) | **TurboModule, peer RN >= 0.82** | the best technical option, but **magnetic-referenced: no declination** |
| react-native-compass-heading | **identical algorithm to expo-location** | stale | legacy arch | **not an upgrade**; open 2025 issue "completely random numbers" on Samsung |
| react-native-sensors | raw sensors, no fusion | npm stale since 2022 | no | worse than what we have |
| **an FOP wrapper** | — | **NONE EXISTS ON NPM** | — | would mean writing it |

**The agent's direct answer to "is there a well-maintained RN library giving fused, tilt-compensated,
declination-corrected heading on Android?" is NO.** The closest, `react-native-attitude`, is fused and
tilt-compensated but magnetic-referenced, so declination would still be ours to add.

## 8. The OnePlus 3T, answered

**CONFIRMED from OnePlus's official spec page:** "Fingerprint sensor, Hall sensor, Accelerometer,
**Gyroscope**, Proximity sensor, Ambient light sensor and **Electronic Compass**."

**So the 3T has a gyroscope, a magnetometer and an accelerometer.** The rotation-vector path would work on
it.

Two corrections to our own notes: **the 3T is a Snapdragon 821, not 820** (per GSMArena). And Google Play
services currently supports **Android 6.0 and higher**, so an Android 9 device is comfortably in support.

## 9. The agent's recommendation

> **expo-location alone is sufficient to SHIP, and is what I'd ship, provided you defend against its three
> known Android defects in JS.**

Its reasoning:

1. **The issue record is thin and old, not damning.** Seven real reports in seven years, none since 2022,
   none open, no SDK 58 problems, iOS consistently fine.
2. **But all three defects found in source are real in the field**, and all three are cheap to neutralise:
   - **Wrap every reading `((h + 360) % 360)`**, and test `=== -1` exactly, never `< 0`
   - **Smooth, and ignore sub-threshold deltas**, since ~40 events/sec still get through
   - **Prompt the figure-8 when accuracy degrades**
   - **Prefer `magHeading` plus our own declination** over trusting `trueHeading` near the zero crossing
3. **The better Android path is available without leaving Expo** (`DeviceMotion`, or
   `react-native-attitude`). **Keep it as the fallback if device testing shows the tilt bug hurting real
   users. Do not adopt preemptively.**
4. **Do not adopt** react-native-compass-heading, and there is no FOP wrapper to adopt.

**One action it recommends upstream:** file the negative-modulo issue on expo/expo with the #19071 and
#19629 history. It is a one-line fix, `((x % 360) + 360) % 360`, and nobody has reported it in four years.

## Key sources

- expo/expo issues #4081, #4266, #12548, #14481, **#16640**, **#19071**; PR **#19629**; PR #35004; PR #48294
- Discussion #24268 (the missing `timeInterval`)
- SO 68100176, SO 73678894
- OnePlus 3T official spec: `oneplus.com/us/support/spec/oneplus-3t`
- react-native-attitude: `github.com/dpyeates/react-native-attitude`
- react-native-compass-heading issue #66
- Google Play services minimum API: apilevels.com, 9to5google
