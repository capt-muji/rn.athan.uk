# Row 53: gate the qibla compass on the phone's own uncertainty, not on a stopwatch

**Read this first and in full.** It is the whole brief for the next session: what to build, what the owner has
already decided, the three traps that will bite, and what must not be re-investigated. Written 2026-10-03 at the
close of session 52, which is DONE and pushed.

---

## 1. The one-sentence goal

**Stop timing the heading and start asking it.** Replace `hasSettled`'s 2700ms span requirement with a reading of
the uncertainty the phone itself reports, so the compass draws as soon as the phone says it is certain and waits
only as long as the phone says it is not.

The owner's framing: 🐋 "instead of inferring, convergence from drift every time, ask the phone how sure it is if
iOS is 5 degrees, draw immediately if it says 25 weight, and say why. Okay, okay. I think, yeah. This is good."

---

## 2. Why the current wait exists, measured

The animation shows for 2 to 3 seconds on both of the owner's phones, every single time, cold or warm. He
measured this himself across 20 trials on 2026-10-03.

**It is not waiting for accuracy. It is waiting for a clock.** `hasSettled` has three conditions and on his
phones two are already satisfied before the third can be:

| Condition in `shared/qiblaSettle.ts` | On his phones |
| --- | --- |
| `window.length < SETTLE_MIN_READINGS` (8) | met in about 570ms at the measured ~14Hz |
| **`nowMs - window[0].atMs < SETTLE_WINDOW_MS * 0.9`** | **2700ms. THIS IS THE ENTIRE WAIT** |
| drift between the window's halves over 1.5 degrees | already false, because the fusion is already converged |

So the gate sits holding a **correct heading** waiting for the stopwatch to reach 2700ms before it is allowed to
believe itself.

**And there is no cold start to wait through**, which is why his cold and warm trials were indistinguishable.
Hard-iron estimation and sensor fusion are OS-level services: clearing app data, force-stopping and reinstalling
do not reset them, so a phone in daily use hands this app an already-converged fusion. Session 48's
30-degrees-out first reading cannot occur on such a phone.

---

## 3. What is already built, and what is missing

**Built, in row 49 and shipping today: the module READS both platforms' numbers.**

`modules/qiblaheading/index.ts` normalises them behind one shape, so the JS never branches on platform:

```typescript
accuracyDegrees?: number;        // iOS: CLHeading.headingAccuracy, in real degrees
wantsCalibration?: boolean;      // iOS: whether CoreLocation wants a calibration gesture
headingErrorDegrees?: number;    // Android: FOP's conservative heading error cone
```

**Missing: nothing ACTS on them.** In `hooks/useQibla.ts` the reading is written into state for display only:

```typescript
unwatchDiagnosticRef.current = watchQiblaDiagnostic((diagnostic) =>
  setState((previous) => ({ ...previous, diagnostic }))
);
```

It never reaches a decision. The gate still reads only the window and the clock.

**Why these numbers are worth reaching for:** `expo-location` destroys both. On iOS it buckets
`headingAccuracy`'s degrees to 0 to 3 where bucket 3 spans 0 to 20 degrees, and it maps Apple's NEGATIVE
"invalid heading" sentinel into the same bucket as a merely poor reading. On Android it never exposes FOP at all,
and Google states FOP is the same heading Google Maps draws.

---

## 4. The owner's decisions, already taken

Do not re-ask these. Each is his, dated 2026-10-03.

1. **The accuracy gate REPLACES the 2700ms wait. It does not sit beside it.** 🐋 "it should be replaced that the
   whole purpose. We want to make it as quick as possible. We want to replace it, not beside it. So if it takes a
   long time to settle, then it's going to take a long time to load. If it takes a shorter time to settle, then
   it's going to load faster. Let's replace." **Rejected: running both and opening on whichever fires first**,
   because a gate that can only ever be faster would show no change if accuracy always lost, and would teach
   nothing.
2. **ONE session covers both platforms.** 🐋 "I think we can do iOS and android. Separately, in separate
   sessions, because it's different technologies, even though they touch the same code, it's different
   technologies, so. Or actually, let's do it in 1 session." The code is one gate reading one normalised field,
   so splitting it would mean planning the same gate twice.
3. **Plan AND execute in that one session. Coverage, cleanup and audit come later.** 🐋 "We plan it in the next
   session. We execute it for both platforms in the next session. without testing, actually, without any
   coverage. We don't implement coverage because leave it as a prototype. I want to check if it works. If it
   works, I'll come back and tell you that both phones work perfectly. Then we can begin the coverage and the
   cleanup and the auditing and the completion of it of both platforms."
4. **Build with MOCK data, and install on both phones.** His words: build and compile on both devices with mock
   data.
5. **He tests iOS FIRST, then Android.** 🐋 "The 1st thing we will do is test iOS only, and then we'll test on
   Android once." This is a sequencing decision inside the one session, not two sessions.
6. **The wave hint and its animation STAY, unchanged.** Settled in session 52 and he ruled on it directly:
   🐋 "if we remove that, the user is not going to shake their phone. And we're going to lose the insurance. So
   maybe we should just keep everything as is." The geometry is why: the turn a user makes to face the qibla is
   rotation about the VERTICAL axis alone, which traces a circle and cannot determine a sphere's centre, so only
   a figure of eight supplies the pitch and roll that calibrates hard iron. **Remove the instruction and the
   insurance goes with it.**
7. **No technical explanation in the UI.** 🐋 "I don't really want to put more information like. You know, the
   compass reads the horizontal component, blah, blah, blah, that's no, that's too technical too much for
   people."
8. **1.29.239 (`7904e00f`) is the revert point.** 🐋 "this is a good build that we will come back to, that we
   will revert to, should things go wrong." He has accepted it on both phones.
9. **Row 46 is CLOSED as superseded**, not planned. 🐋 "go ahead and close it, supersede it."
10. **Questions are asked in the next session, not this one.** 🐋 "Any questions you have for me should be asked
    in that session."

---

## 5. THREE TRAPS THAT WILL BITE, each with its remedy

These are the reason this brief exists rather than a one-line instruction.

### 5.1 The coverage gate will refuse an untested commit

The owner deferred tests, and the pre-commit hook does not know that. It runs `yarn validate` with 100%
thresholds on all four measures plus `scripts/check-changed-coverage.js --staged`. **New logic in `hooks/` is
measured and will fail the gate at under 100%.**

Row 49 hit this exact wall. `modules/` is listed in `UNMEASURED` inside `scripts/check-changed-coverage.js`:

```javascript
{ path: 'modules/', reason: 'native Kotlin module; its JavaScript surface is device/tls13.ts, which is measured' },
```

**Two routes, and the planning session chooses one and writes it down:**

- **Put the prototype's decision logic inside `modules/qiblaheading/`**, which is already exempt, and have
  `hooks/useQibla.ts` call it. Needs no new exemption and no `--no-verify`. **This is the recommended route.**
- Or gate it behind a flag and cover the off-path, which is what row 49 ended up doing and what cost it a refused
  commit at 99.91%.

**`--no-verify` is not an option.** It is banned by `ai/AGENTS.md`.

### 5.2 The flag makes the module unreachable in a mock build, so a naive build would change nothing

Two separate problems compound here.

**First, the flag excludes production and preview:**

```typescript
qiblaDiagnostic: process.env.EXPO_PUBLIC_QIBLA_DIAGNOSTIC === '1' && process.env.EXPO_PUBLIC_ENV !== 'prod',
```

**Second, `build-mock.zsh` unsets every `EXPO_PUBLIC_*` variable on purpose**, so the flag cannot be passed in
from the caller's environment:

```bash
# Only this build's variables reach prebuild, Metro and Gradle: no API key, no package suffix
unset -m 'EXPO_PUBLIC_*'
unset EXPO_ANDROID_SUFFIX EXPO_NAME_SUFFIX 2>/dev/null
export EXPO_PUBLIC_ENV=local EXPO_PUBLIC_API_KEY=key CI=1 EXPO_NO_TELEMETRY=1
```

So a build made without addressing this ships a phone where **nothing changed**, and the owner would test a
no-op. The planning session must decide how the accuracy path reaches a mock build: either the gate does not sit
behind `qiblaDiagnostic` at all (it is becoming a real feature rather than a diagnostic), or the build script is
given the variable explicitly. **Verify the decision by reading the flag's value out of the built bundle or by
observing the behaviour on device, not by assuming.**

### 5.3 The threshold cannot be chosen from any existing measurement

Every accuracy reading this programme holds was taken **over a cable beside a laptop on a magnetic table**.
Session 49 read 25.4, 24.8 and 24.8 degrees on the owner's iPhone XS that way, with `wantsCalibration` FALSE.

**The owner's own rule, which he set after catching it: a tethered phone sits inside the magnetic field of the
thing tethering it, so no heading or accuracy reading taken over a cable is evidence about anywhere.** Session 41
measured the same iPhone wanting a 190-degree correction beside a laptop and 220 two metres away on open floor.

**So the first build's job is to SHOW the numbers, not to act on a guessed threshold.** `ALIGNMENT_ENTER_DEGREES`
is 4 and is the obvious candidate, because it is the window the haptic announces, but a gate set to 4 degrees
would refuse to draw at all if his phones genuinely report 25 untethered. Design the first prototype so it draws
AND reveals what it read, then set the threshold from real numbers.

There is also an Android-specific trap from row 49: **FOP's error cone is OPTIONAL per sample.**
`hasConservativeHeadingErrorDegrees()` exists, so an unguarded read publishes a default dressed as an accuracy.
`modules/qiblaheading/index.ts` already types it as optional (`headingErrorDegrees?: number`), and the gate must
treat its absence as "no reading" rather than as zero.

---

## 6. What the planning session must settle

1. **The threshold, and how it is reached.** A fixed constant, or `ALIGNMENT_ENTER_DEGREES`, or a first build
   that reveals the numbers and a second that acts on them. Trap 5.3 applies.
2. **The ceiling.** Decision 4.1 replaces the stopwatch, so a phone that never reports a good accuracy must still
   draw eventually. `ai/AGENTS.md` carries the owner's absolute rule that anything gating this screen **fails
   OPEN**: 🐋 "we don't want to lock it... what if the magnetometer doesn't actually work the first time". Decide
   the ceiling's value and what the user sees when it is hit.
3. **Where the logic lives**, per trap 5.1.
4. **How the flag reaches a mock build**, per trap 5.2.
5. **What is drawn while waiting.** The wave hint stays (decision 4.6). What is undecided is whether a
   sub-second wait should show the animation at all, and that is a question for the owner in that session: he
   liked it as a loading screen and has never seen it at that length.
6. **What happens when the phone reports an INVALID heading.** Apple documents a negative `headingAccuracy` as
   "invalid heading" and gates on it unconditionally in its own sample code. `expo-location` collapses that into
   bucket 0; `modules/qiblaheading` does not. This is the one case the current app cannot see at all.

---

## 7. What must NOT be re-investigated

| Settled | By, and the measurement |
| --- | --- |
| `SETTLE_WINDOW_MS` is not shortened as a fix | Session 52: it is the shortest window whose p95 error fits the 4-degree alignment window (2000ms gives 5.51 degrees, 2500ms gives 4.02, 3000ms gives 3.02) |
| The sensor rate is not a lever on the wait | `TIME_DELTA = 50f` survives the patch, so the gate receives ~14Hz at any sensor rate. 50Hz opens at 9703ms, 5Hz at 9844ms: a 1.4% difference |
| No stream-only gate separates motion from convergence | Sessions 48 and 52: a slow turn and a slow drift are the same signal. A 15-degree range cap refuses a hand-held phone 100% of the time |
| The wave hint stays | Decision 4.6, on AN4246's per-gesture fit plus the owner's ruling |
| A flat hint cannot replace it | A flat still phone leaves 497.6% of the hard-iron offset unremoved; a figure of eight leaves 1.3% |
| The 13-second time floor is not shipped | It fixes a regime his phones are not in, at up to 3.5s added to every open |
| The field-magnitude and dip physics check is dead | Session 48: a 10 uT offset swings the heading 30.8 degrees while passing a 5-degree dip gate |
| Hard-iron calibration from the user's own turn is impossible | Session 52: that turn traces a circle, which does not determine a sphere's centre |
| The app's geometry is correct to 0.1 degrees | Session 47, measured off the owner's own screen recordings |
| Reanimated's gyro-fused sensor stays rejected | Session 47: beautifully smooth and 5 to 34 degrees wrong outdoors, varying with orientation |

---

## 8. The build and install ritual, with the trap that cost this session real time

**Read an APK's package name BEFORE installing it to a phone the owner uses:**

```bash
AAPT2=~/Library/Android/sdk/build-tools/37.0.0/aapt2
"$AAPT2" dump badging <apk> | grep "^package"
```

**`build-mock.zsh` ALWAYS declares `com.mugtaba.athan`, the PRODUCTION package, carrying MOCK data.** Installing
it with `adb install -r` replaced the owner's real app with fabricated prayer times in session 52. App data
survives, so nothing looks broken: the times are simply invented. **Passing `EXPO_ANDROID_SUFFIX=fleettest` to
the script does not help**, because line 56 unsets it (see trap 5.2's excerpt). Verified by exporting it and
reading the resulting APK, which still declared the production package.

Confirm `$AAPT2` exists before trusting its output: a `grep` on a missing command returns the same empty result
as a real absence.

**Android:**

```bash
zsh ~/athan-device-sweep/session3/bin/build-mock.zsh uat-2 mocks/simple.ts <out.apk>
```

Success ends `BUILD-MOCK OK`. Measured at 481s warm and 1784s cold in session 52.

**iOS, in this order, because `expo run:ios` never re-syncs an existing native directory:**

```bash
npx expo prebuild -p ios --no-install
grep -A1 CFBundleShortVersionString ios/Athan/Info.plist
npx expo run:ios --configuration Release --device 00008020-0015585C22D2002E
```

The plist must show the `app.json` version before the build runs. Session 52 found it stale at 1.29.233 while
`app.json` said 1.29.241.

**A Gradle TLS handshake failure reads like a toolchain fault and is a network one.** Session 52 lost a build to
`Could not download kotlin-scripting-jvm-2.2.21.jar` with `Remote host terminated the handshake`; `curl` returned
HTTP 200 for the same URL seconds later and a plain retry succeeded. Check the URL with `curl` before changing
any configuration.

**An empty `adb` result is not evidence the app is absent.** `pm list packages | grep athan` and
`dumpsys package ... | grep versionName` both returned nothing in session 52 because the phone had been
unplugged. Run `adb devices` first.

---

## 9. Where the phones are now

| Phone | Version | Build | Carries the session 52 subtitle fix? | Prayer times |
| --- | --- | --- | --- | --- |
| OnePlus 3T (`8f7ada76`) | 1.29.244 | mock | **Yes** | Fabricated |
| iPhone XS (`00008020-0015585C22D2002E`) | 1.29.241 | production | **No** | Real |

**They are not on matching builds**, and the next session's first act should be to put both on the same mock
build of whatever it ships, so the owner judges identical code. The iPhone currently predates the truncation fix
and would still show `Hold flat and...`.

Verify before building:

```bash
adb -s 8f7ada76 shell dumpsys package com.mugtaba.athan | grep versionName
xcrun devicectl device info apps --device 00008020-0015585C22D2002E | grep "com.mugtaba.athan "
```

---

## 10. The two measurement rules session 52 earned

Both bind the next session, because both were learned by getting something wrong.

**1. The error at the instant a gate opens is not a user-facing quantity.** Session 52 told the owner that waving
the phone costs a 4x worse reading, repeating row 50's figure, and he refused it from his own hands: 🐋 "I've
been shaking my phone during the animation with every test that I do, and I don't really find myself being
penalised." He was right. The gate LATCHES, so the fusion keeps converging while the user turns toward the
qibla, and at the moment the app actually claims alignment the error is **0.70 degrees still against 0.73
waving**, with zero false taps in 300 runs each. **Measure the error at the moment the app makes a claim a user
acts on, never at the moment an internal state flips.**

**2. A simulation's premise is worth less than one trial on the real device.** The predicted 9.7-second wait, the
cold-fusion convergence and the wave penalty were all derived from a model whose starting assumption, that the
app meets a cold fusion about 30 degrees out, is false on a phone in daily use. The owner found that in twenty
opens. **Every number in `ai/plans/52-qibla-wait/MEASURED.md` is a bound on the gate's arithmetic, never a
prediction about his hardware.**

And one layout rule, from the defect session 52 introduced and fixed: **`numberOfLines` hides a layout fault
rather than fixing one.** Capping the subtitle at one line turned a wrap into a truncation and the owner saw
🐋 "hold the phone flat and dot dot dot". The cause was never text length: an absolutely positioned child
contributes NO width, so the column shrink-wrapped to the shorter in-flow line and clipped the longer one inside
it. **Measure the box before capping the lines.**

---

## 11. Reading order for the next session

1. This file.
2. `ai/plans/52-qibla-wait/MEASURED.md`: every number session 52 measured, and section 8's table of what is
   closed.
3. `ai/plans/52-qibla-wait/RESEARCH.md`: the AN4246 per-gesture fit, the both-platform comparison from the SDK
   headers on this machine, and the owner's two corrections.
4. `ai/plans/49-qibla-native-heading/`: `MEASURED.md` and `FINDINGS.md`, for what the module reads and the
   defects found building it.
5. `ai/plans/48-qibla-heading-accuracy/DECISION.md`: why the settling gate exists and what the research rejected.
6. `ai/AGENTS.md` sections 0, 6, 7 and 15, plus the Recent Decisions entries dated 2026-10-03.
7. `opencode.json` at the repo root, for the MCP servers this project has wired up.

Then `ai/plans/PLANNER-BRIEF.md`, and plan row 53.
