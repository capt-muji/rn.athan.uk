# Execution log: Session 52

Planned, executed and audited in one session on 2026-10-03, as the owner's standing rule requires.

| Step | Version | Breaks | Suite after |
| --- | --- | --- | --- |
| 1. The compass subtitle fits one line | 1.29.237 | 2 of 2 | 187 suites, 5045 tests, 100% |
| 2. A verified warm reopen draws the compass at once | 1.29.238 | 10 of 10 | 187 suites, 5062 tests, 100% |
| 3. No success haptic on an instant open | 1.29.239 | 3 of 3 | 187 suites, 5064 tests, 100% |
| Final sweep from a clean tree | - | **15 of 15** | 187 suites, 5064 tests, 100% |

---

## What the owner changed while this ran, and both times he was right

**1. The wave penalty does not exist.** He challenged the claim that waving the phone during the animation costs
a 4x worse reading. 🐋 "I've been shaking my phone during the animation with every test that I do, and I don't
really find myself being penalised... are you sure about this?"

He was right. That figure, which this session repeated from row 50, measures the error at the instant the gate
OPENS. The gate latches (`settledRef.current = true`), so the fusion keeps converging while the user turns toward
the qibla, and by the moment the app actually claims alignment both users are in the same place: **0.70 degrees
still against 0.73 waving, zero false taps in 300 runs each** (`scripts/probes/probe-felt.mjs`).

**The durable rule this earned: the error at the instant a gate opens is not a user-facing quantity.** The
user-facing quantity is the error at the moment the app makes a claim. Measuring the convenient moment instead of
the decisive one produced a confident wrong conclusion twice, once in row 50 and once here.

**2. "Costs nothing" is not "does nothing", and the probe could not have told the difference.** He then asked
what the point of the animation is, if the wave costs nothing: 🐋 "If the wave doesn't cost us anything, then
what's the point of the animation? Don't remove it. I'm just questioning."

The probe showing the wave is free **models a converging fusion and holds no hard iron at all**, so it was
structurally incapable of showing a benefit. The wave's job is hard iron, a different mechanism. Both findings
stand and neither is evidence about the other. `RESEARCH.md` Part 1 now says so, and carries his own 20-trial
cold-start protocol with the three corrections that make it decisive: both arms rather than still alone, cold
starts only, and the reading being WHERE the compass points rather than how long it took.

---

## What the audit found, and it found things

### A break sweep of the real implementation caught three weaknesses the worktree proof had not

The planning worktree reported 14 of 14. Against the real implementation, three survived and each was a genuine
finding rather than a flaky break:

1. **A test spending `WARM_CONFIRM_READINGS - 1` readings moves with the constant it guards.** Lowering the
   constant to 1 left the test spending 0 readings and passing. The count is now asserted against a **literal**
   as well, so the constant cannot move its own guard.
2. **The confirmation buffer surviving a close, and surviving a lost fix, were unguarded.** Readings from a
   refused visit could have joined a few from the next and confirmed a phone since turned. Two tests now drive
   those paths directly.
3. **The third survivor was DEAD CODE, not a missing test.** Clearing `confirmRef` in `start()` could never be
   the thing that emptied it, because `stop()` already does and `useRef` seeds it empty. **Deleted rather than
   tested**, which is the right answer to an unbreakable line.

### The suite could not see the feature at all before the plan fixed it

**Deleting the entire warm path passed all 221 existing qibla tests.** That is session 49's audit finding in a
new place: a suite that cannot see a gate cannot tell a gated feature from an ungated one. The plan specifies the
tests that can see it, and the break script proves each one.

### A coverage trap was fixed by simplifying the code rather than by widening a test

A `setState` guarded by `previous.arrivedWarm ? previous : ...` inside the latch has an **unreachable branch**,
because the latch runs once per visit. The gate refused the commit at 97.82%. One local flag, carried out of the
block and written once with `hasHeading`, has no dead branch. The code is shorter and the coverage is honest.

### A stale comment was corrected

`components/sheets/screens/Qibla.tsx` said the settling gate was "the whole wait", which stopped being true when
step 2 landed. It now names what decides each case.

---

## The device measurement: UNMEASURED, and why

**Purpose:** the fusion's real convergence time constant on the 3T, which is the one number deciding whether
`MEASURED.md` section 6's 13-second floor is needed.

**Safety read first:** `dumpsys alarm` reported **61** alarms (`~/athan-device-sweep/session52/alarms-before.txt`).
No clock was changed in this session, so none could be fired by it.

**The sensor rule was confirmed on the device before the build**, and it holds: with the app running,
`dumpsys sensorservice` lists its connection (`hn4`, uid 10201) holding exactly one `LSM6DS3 Accelerometer` and
one `MMC3416PJ Magnetometer`. The second holder of `0x00000001` is Google Play Services'
`BatchSignalCollector`, not this app, exactly as the handoff's trap warned.

**The first build failed on a network fault, not on the code**: Gradle could not fetch
`kotlin-scripting-jvm-2.2.21.jar`, reporting "Remote host terminated the handshake". The same URL returned HTTP
200 to `curl` immediately afterwards, so it was transient. **Worth carrying: a Gradle TLS handshake failure reads
like a toolchain problem and is a network one. Check the URL with `curl` before changing any configuration.**

**Result: `TAU_MS: UNMEASURED`, and the plan anticipated exactly this.** Section 7 item 3 forbids adding a log
line to obtain the measurement, because `shared/config.ts` disables Pino outside dev and a mock build therefore
emits no heading line. Decision 10 stands unchanged: the time floor is recorded, not shipped.

**What this means for the next session:** the slow-fusion regime is still unconfirmed, and the owner's own
20-trial protocol in `RESEARCH.md` Part 1 is the better instrument for it, because it measures where the compass
POINTS rather than how fast it appears.

---

## The phone, and the mistake made with it

**`build-mock.zsh` does NOT produce a `.fleettest` package, and installing its APK replaces the owner's real
app.** `ai/AGENTS.md` section 6 documents `EXPO_ANDROID_SUFFIX=fleettest EXPO_NAME_SUFFIX=FleetTest` for exactly
this, and the script was run without them, so the APK declared `com.mugtaba.athan` and `adb install -r` put a
MOCK-DATA build over the owner's production app. `aapt2 dump badging` confirmed it afterwards, which is the check
that should have run BEFORE the install.

**THE RULE, and it is cheap: read the package name out of the APK before installing it to a phone that carries
the owner's own app.**

```bash
AAPT2=~/Library/Android/sdk/build-tools/37.0.0/aapt2
"$AAPT2" dump badging <apk> | grep "^package"
```

A mock build must read `com.mugtaba.athan.fleettest`. Anything else is the production package and overwrites what
the owner tests on.

**What it cost and what it did not.** `adb install -r` keeps app data, so his settings and alarm preferences
survived; what changed was the code and the data source, since a mock build shows fabricated prayer times. The
restore to `athan-233.apk` (`EXPO_PUBLIC_ENV=prod`, real API key, the build he accepted) reported `Success` and
then the package queried empty, because **he had already deleted the app from both phones himself** to clear the
clash. His instruction then was to install the latest build on both, mock or production, whichever was quickest.

**Final state: both phones carry this session's code.** The 3T runs the already-built mock APK at 1.29.239,
launched and confirmed focused on `com.mugtaba.athan/.MainActivity`. The iPhone XS was prebuilt (its plist had
gone stale at 1.29.233 and now reads 1.29.241, which is the ORDER `ai/AGENTS.md` requires: bump, then prebuild,
then build) and a Release build was installed to it.

Automatic time was never turned off, and no clock was changed in this session.

---

## Resume from

Nothing. The row is DONE once the audit's push lands.
