# What this planning session measured, before any plan was written

Every number here came from replaying this repository's own shipped code against simulated sensor
streams, or from the devices themselves. The probes are in `scripts/probes/`. Nothing on this page is
cited from an earlier session without being re-derived.

Three findings changed the row's design. Two of them contradict the row's own hypothesis.

---

## 1. The row's central hypothesis is REFUTED by arithmetic: the 2-degree gate cannot be the accuracy hero

Row 50's planner hypothesis, written down so it could be proven wrong:

> **the 2-DEGREE GATE is the likely hero for ACCURACY** ... because a higher sample rate does not make a
> heading more correct while removing a 2-degree quantisation floor does

**It cannot be, and the reason is that a quantiser's error is bounded by its own step size.**
`probe-accuracy-bound.mjs` replays the exact emission logic of `LocationModule.kt` and measures how far
the DRAWN heading can sit from the phone's real heading:

| Configuration | Still | Creeping 2 deg/s | Turning 10 deg/s |
| --- | --- | --- | --- |
| SHIPPED, 50 Hz, no degree gate | 0.40 mean, 2.01 worst | 0.42 mean, 1.96 worst | 0.42 mean, 2.06 worst |
| A, 5 Hz, no degree gate | 0.38 mean, 1.27 worst | 0.42 mean, 1.69 worst | 0.39 mean, 1.37 worst |
| B, 50 Hz, 2-degree gate | 0.00 mean, 0.00 worst | 0.65 mean, 1.80 worst | 0.78 mean, 2.38 worst |
| REJECTED, 5 Hz, 2-degree gate | 0.44 mean, 0.44 worst | 0.77 mean, 2.11 worst | 0.85 mean, 2.33 worst |

The worst case across every configuration is **2.38 degrees**. The owner's complaint is 🐋  "sometimes
it's 20 degrees off, sometimes 30 degrees off". **A 2-degree quantiser cannot produce a 20-degree error
at any sensor rate**, so neither change 2 nor change 3 is the hero for accuracy, and no device experiment
can make them one.

### What CAN produce 20 to 30 degrees, measured

Two mechanisms, and only two:

**The cold fusion the settling gate exists to exclude.** A fused heading arms cold and walks to the truth
with a time constant session 48 measured at about 4 seconds from about 30 degrees out:

| Drawn at | Error |
| --- | --- |
| 0.0s | 30.0 degrees |
| 1.0s | 23.4 degrees |
| 2.0s | 18.2 degrees |
| 4.0s | 11.0 degrees |
| 9.7s | 2.7 degrees |

**Hard iron in the room**, which session 48 measured as invisible to every gate reading the heading
stream. At London's horizontal field of about 19.4 uT:

| Offset | Heading error, worst direction |
| --- | --- |
| 2 uT | 5.9 degrees |
| 5 uT | 14.5 degrees |
| 10 uT | 27.3 degrees |
| 20 uT | 45.9 degrees |

**So the owner's "20 to 30 degrees" is the cold fusion, the room, or both, and the LATCH is the only one
of the four changes that touches either.** That reframes the row: the valuable pair is not A and B.

---

## 2. Experiment B barely draws a compass at all, so it cannot be judged on accuracy

`probe-separability.mjs` and `probe-separability2.mjs` replay `shared/qiblaSettle.ts` verbatim against
each configuration's emission pattern. The settling gate needs 8 readings spanning 2.7 of 3 seconds.
With the 2-degree gate restored, a converged stream emits almost nothing, so the gate starves:

| Configuration | Draws at, phone held still | Never draws |
| --- | --- | --- |
| SHIPPED, 50 Hz, no gate, latched | 9.7s | 0% |
| A, 5 Hz, no gate, latched | 9.8s | 0% |
| **B, 50 Hz, 2-degree gate, latched** | **23.0s** | **87%** |
| C, 50 Hz, no gate, unlatched | 9.7s | 0% |
| REJECTED 1.29.203 | never | 100% |

**B mostly shows the calibration hint rather than a compass.** The owner ruled on this directly
(2026-10-02): B still runs, and its verdict is pass or fail on whether a compass appears at all, which
is itself the finding that removing the 2-degree gate was necessary for the gate to open.

Waving the figure eight the app asks for changes this, because motion feeds the window: B then draws at
3.5s with only 2% never drawing. **So B's outcome depends on whether the owner waves first**, which is
why the protocol fixes the gesture rather than leaving it to the moment.

---

## 3. The latch is the dominant change, and its effect is 20x, measured while TURNING

`probe-latch.mjs` isolates the latch with the fusion pre-converged, so the gate is the only variable,
and measures the dial update rate DURING a continuous turn. This is the right question for the latch:
probe 2 averaged over a mostly-stationary run and flattered the unlatched gate, because an unlatched
gate re-opens as soon as the phone stops.

| Configuration | Creeping 2 deg/s | Turning 10 deg/s | Turning 45 deg/s |
| --- | --- | --- | --- |
| SHIPPED, latched | 16.7/s (100% of readings) | 16.7/s (100%) | 16.7/s (100%) |
| A, 5 Hz, latched | 5.1/s (100%) | 5.1/s (100%) | 5.1/s (100%) |
| B, 2-degree gate, latched | 1.1/s (100%) | 4.3/s (100%) | 15.7/s (100%) |
| **C, unlatched** | **1.7/s (10%)** | **0.9/s (5%)** | **0.4/s (3%)** |
| REJECTED 1.29.203 | 0.1/s (13%) | 0.1/s (4%) | 0.1/s (2%) |

**An unlatched gate discards 95% of readings while the user turns at 10 degrees a second**, and the
faster the turn the worse it gets, which is the owner's 🐋  "I have shaken the phone a thousand times and
it doesn't move" exactly. The latch is worth 0.9/s to 16.7/s, a factor of 18.

**The counter-intuitive part, and it is why C is worth running:** C's dial is not merely slow, it is
FROZEN at whatever value it last drew, and the table above shows that value is drawn early, while the
fusion is still 20 to 30 degrees out. **So reverting the latch reproduces the owner's accuracy complaint
too, not just his responsiveness complaint.** That is the single most useful thing on this page, because
it means one change explains both halves of what he reported.

---

## 4. A FIFTH change landed between the two builds, and the row counts four

The row's premise: 🐋  "FOUR changes landed between the build he rejected (1.29.203) and the build he
loves (1.29.205)".

`git log 5e4882b7..62f66c21` shows two commits, not one:

| Version | Commit | What it changed |
| --- | --- | --- |
| 1.29.204 | `6423d899` | The latch, plus all three `expo-location` patches |
| **1.29.205** | **`62f66c21`** | **The figure-eight calibration hint and its animation** |

**The fifth change is the calibration hint itself**, and it is not cosmetic to this question: it tells
the user to wave the phone in a figure eight, which is the standard gesture for re-estimating a hard-iron
offset. Section 1 of this page measures hard iron as the one mechanism that reaches 20 to 30 degrees, and
section 2 measures that waving makes the settling gate open in 3.5s rather than 23s.

**So the hint may be a cause of the improvement rather than a label on it**, by getting the user to
calibrate and by feeding the settling window. No experiment in the row's own list separates it. The plan
adds experiment E for it.

---

## 5. Both phones are reachable, and wireless adb removes the tethering confound

Session 49's rule, the owner's own: a tethered phone sits inside the magnetic field of the thing
tethering it, so no heading reading taken over a cable is evidence about anywhere.

Measured this session:

| Check | Result |
| --- | --- |
| `adb devices` | 3T on USB as `8f7ada76` |
| `adb tcpip 5555` then `adb connect 192.168.1.206:5555` | `connected to 192.168.1.206:5555` |
| `adb -s 192.168.1.206:5555 shell getprop ro.product.model` | `ONEPLUS A3003` |
| 3T installed version | 1.29.211 |
| iPhone XS, `xcrun devicectl device info apps` | `Athan com.mugtaba.athan 1.29.211` |

**Wireless adb is what makes this row's protocol honest.** The owner can carry the 3T outdoors with the
cable unplugged while `dumpsys sensorservice` and logcat are still readable over wifi, so every reading
is taken outside the laptop's field and the rate claims are still measurable.

The iPhone's own IP address is not needed: experiment D is judged by the owner's eye, and `pymobiledevice3`
is not required for a verdict he gives verbally.

---

## 6. The build mechanics, proven rather than assumed

The three `expo-location` changes live in `patches/expo-location+58.0.9.patch`, which `patch-package`
applies to `node_modules` at `postinstall`. Every build worktree symlinks the MAIN checkout's
`node_modules` (`build-prod.zsh`: `ln -s $REPO/node_modules $WT/node_modules`).

**So an experiment is an edit to `node_modules`, never a commit**, and three consequences follow, each
verified this session:

1. **The edit is invisible to git**, so no experiment branch exists and nothing can be accidentally
   committed. `git status` stays clean throughout.
2. **Every build worktree sees the edit**, because they all symlink the same `node_modules`. Two builds
   must never run at once, which `build-prod.zsh` already refuses.
3. **Gradle compiles the patched Kotlin from source.** Session 49's trap was an `expo-module.config.json`
   `publication` block causing autolinking to resolve a prebuilt AAR. Verified absent: the block is
   already removed by the patch, and `node_modules/expo-location/android/local-maven-repo` does not exist.

The substitution and its restore were both run this session:

```
perl -0pi -e 's/SensorManager\.SENSOR_DELAY_GAME/SensorManager.SENSOR_DELAY_NORMAL/g' <file>   # 2 hits
cp /tmp/LM.orig.kt <file>                                                                       # 2 hits back
```

**The restore is the risk that matters.** A `node_modules` left edited silently changes every later build
in this repository, and nothing in the test suite would catch it, because the suite never compiles Kotlin.
The plan's step 1 therefore writes a verify script that is run after every experiment, and the device
proof ends by restoring from `patch-package` itself rather than from a copy.

---

## 7. Every experiment's substitution was RUN before it was specified

`scripts/probes/` carries the probes; the two spikes below were run in a scratch worktree and thrown
away, as `PLANNER-BRIEF.md` section 3 item 8 requires. What they taught is recorded here; their code is
not the plan.

**The guard script was built and run against the real tree**, to prove the contract in step 1 is
buildable and that its output lines are what the plan predicts:

```
SENSOR_DELAY_GAME: 2, expected 2
DEGREE_DELTA: absent, expected absent
kCLHeadingFilterNone: 1, expected 1
publication block: absent, expected absent
local-maven-repo: absent, expected absent
PATCH AS SHIPPED                                    exit 0
```

**All five substitutions were applied to copies of today's source**, 9 of 9 checks passing, which is what
makes section 7 of the plan runnable rather than hopeful:

| Experiment | Applied | Also checked |
| --- | --- | --- |
| A | `SENSOR_DELAY_NORMAL` = 2 | `SENSOR_DELAY_GAME` = 0 |
| B | `0.0355` = 1 | `TIME_DELTA` still = 2, so only the degree gate came back |
| C | the unlatched condition = 1 | the latch read = 0 |
| D | `kCLHeadingFilterNone` = 0 | `startUpdatingHeading` still = 1 |
| E | `<QiblaWave` = 0 | 1 usage before, so the substitution had a target |

**Experiment C was then confirmed in JS, before any APK exists.** With the latch reverted in a scratch
worktree, `components/sheets/screens/__tests__/Qibla.test.tsx` fails exactly 2 of 65:

```
● the settling gate › keeps following while the user turns
    Expected: "-140deg"   Received: "-20deg"
● the settling gate › keeps following through a fast sweep, where no window could ever look settled
    Expected: "-195deg"   Received: "-95deg"

Tests:       2 failed, 63 passed, 65 total
```

**The received values are the measurement, not just the failure:** the dial stopped at -20 degrees where
it should have reached -140, and at -95 where it should have reached -195. So an unlatched gate does not
merely slow the dial, it STRANDS it about 100 degrees short of where the phone is pointing. That is
stronger than the probe's 5%-of-readings figure and it is this repository's own test suite saying it.

**The B substitution needed care and the first form was wrong.** Restoring the degree gate by editing the
`if` condition whole keeps `TIME_DELTA` intact, which is what makes B "the gate alone" rather than "the
gate plus a rate change". The check on `TIME_DELTA` still counting 2 is what proves it.

---

## 8. THE PLAN'S OWN RESTORE PATH WAS WRONG, and only RUNNING it found that out

The plan's first design restored `node_modules` with `npx patch-package`, which is the obvious choice and
reads as correct. **It cannot work, and the failure is silent in the worst way.**

Dry-running the plan's own build script with a stubbed build failure left the tree edited, and the
recovery then failed:

```
**ERROR** Failed to apply patch for package expo-location at path
    node_modules/expo-location
  This error was caused because patch-package cannot apply the following patch file:
    patches/expo-location+58.0.9.patch
patch-package finished with 1 error(s).
```

**`patch-package` refuses a tree that is already edited**, because the hunk it wants to apply no longer
matches. Reverse-applying fails for the same reason:

```
patch -R -p1 -i patches/expo-location+58.0.9.patch --dry-run
  1 out of 4 hunks failed while patching '.../LocationModule.kt'
```

So the plan as first written would have left `node_modules` edited after the FIRST experiment with no
working way back, and **every later build in this repository would have silently compiled the wrong
code while reporting `BUILD SUCCESSFUL`.** That is the exact shape of defect this programme keeps
catching, and it was caught here only because the script was executed rather than reviewed.

**The restore that does work, measured end to end:**

```
PRISTINE=~/Library/Caches/Yarn/v6/npm-expo-location-58.0.9-<hash>/node_modules/expo-location
rm -rf node_modules/expo-location && cp -R "$PRISTINE" node_modules/expo-location
npx patch-package          ->  expo-location@58.0.9 ✔
verify                     ->  PATCH AS SHIPPED
```

Yarn's cache holds the pristine upstream source (`SENSOR_DELAY_NORMAL` = 2, `DEGREE_DELTA` present), so
replacing the package and re-applying the committed patch reaches the shipped state from ANY edited
state, which is the property the restore actually needs.

**Two further fixes came from the same dry run.** The script now traps its own exit, so no failure path
can strand the tree, verified by stubbing a failed build and watching the guard still print
`PATCH AS SHIPPED`. And the full restore cycle was followed by
`shared/__tests__/widgetRuntimeLoads.test.ts` (`Tests: 3 passed, 3 total`), because `ai/AGENTS.md`
records that any install can reintroduce a nested `@expo/ui` copy under `expo-widgets` and blank every
widget; it did not fire, and it is now checked rather than assumed.

**The throwaway-ref path was verified the same way.** Experiment C's ref carried exactly
`hooks/useQibla.ts | 3 +--`, one file, and the working tree came back clean afterwards.

---

## 9. A probes folder needs TWO registrations, not one, and the hook is what says so

Session 41's lesson is that an unregistered folder of throwaway `.mjs` scripts falls on whoever stages
next. This session met the other half of it: **Biome's exclusion is not enough, because the coverage
gate keeps its own list.**

The commit was refused with the suite fully green:

```
Test Suites: 186 passed, 186 total
Tests:       5002 passed, 5002 total
Statements : 100% ( 4792/4792 )

Coverage gate: every changed source file needs 100% coverage.
  ai/plans/50-which-patch-fixed-it/scripts/probes/probe-accuracy-bound.mjs: not measured.
  Add its folder to collectCoverageFrom, or to UNMEASURED with a reason
  ... and the other three
```

So a probes folder needs an entry in BOTH places, and session 48's folder has exactly that:

| Where | Why it is needed |
| --- | --- |
| `biome.json` `files.includes` | Or `biome check . --error-on-warnings` reports the throwaway scripts' formatting |
| `scripts/check-changed-coverage.js` `UNMEASURED` | Or the per-file coverage gate refuses the commit, because `.mjs` matches its source pattern |

**The gate's message is a good one** and it is worth noting why: it offers the two legitimate answers,
measure the folder or declare it unmeasured with a reason, so it cannot be silenced without a sentence
explaining the exemption. That is the design that stops a new folder escaping the measure by not being
listed, which the file's own comment says outright.

**The same list independently confirmed a cold-read conclusion.** `scripts/` is already `UNMEASURED`
with the reason "repository tooling, including this gate", so step 1's shell script needs no coverage
entry of its own, which is what section 4 of the plan's design review concluded from the gate's
`\.(ts|tsx|js|jsx|mjs)$` pattern.

**A third behaviour of the same gate constrains the EXECUTION ORDER, and it is why step 1's files must
not exist while the planning commit is made:**

```
Coverage gate: stage or stash these first, since coverage is measured on the working tree:
husky - pre-commit script failed (code 1)
```

Coverage is measured on the working tree, not the index, so an untracked test file would cover a file
whose commit does not carry that test. The gate refuses that outright. The consequence for this session
is practical: **the planning commit and step 1's files cannot coexist in the tree**, so step 1's script
and suite are written, verified, moved out of the tree while the docs commit is made, and moved back
for their own commit. That is the gate working correctly rather than an obstacle, and it is the same
property that makes it impossible to pass by leaving a test unstaged.
