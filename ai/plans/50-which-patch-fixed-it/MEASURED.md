# What this planning session measured, before any plan was written

Every number here came from replaying this repository's own shipped code against simulated sensor
streams, or from the devices themselves. The five probes that produced the simulation numbers lived in
`scripts/probes/` as throwaway `.mjs` scripts; deleted in the record compression, recoverable from git
(`fc017fe6` added them, `9eb45559` is their final state). Nothing on this page is cited from an earlier
session without being re-derived. Three findings changed the row's design; two contradict the row's own
hypothesis.

## 1. The row's central hypothesis is REFUTED by arithmetic: the 2-degree gate cannot be the accuracy hero

The planner's hypothesis, written down so it could be proven wrong: the 2-DEGREE GATE is the likely
hero for ACCURACY. It cannot be, because a quantiser's error is bounded by its own step size.
`probe-accuracy-bound.mjs` replayed the exact emission logic of `LocationModule.kt` and measured how
far the DRAWN heading can sit from the phone's real heading:

| Configuration | Still | Creeping 2 deg/s | Turning 10 deg/s |
| --- | --- | --- | --- |
| SHIPPED, 50 Hz, no degree gate | 0.40 mean, 2.01 worst | 0.42 mean, 1.96 worst | 0.42 mean, 2.06 worst |
| A, 5 Hz, no degree gate | 0.38 mean, 1.27 worst | 0.42 mean, 1.69 worst | 0.39 mean, 1.37 worst |
| B, 50 Hz, 2-degree gate | 0.00 mean, 0.00 worst | 0.65 mean, 1.80 worst | 0.78 mean, 2.38 worst |
| REJECTED, 5 Hz, 2-degree gate | 0.44 mean, 0.44 worst | 0.77 mean, 2.11 worst | 0.85 mean, 2.33 worst |

The worst case across every configuration is **2.38 degrees**. The owner's complaint is 🐋  "sometimes
it's 20 degrees off, sometimes 30 degrees off". A 2-degree quantiser cannot produce a 20-degree error
at any sensor rate, so neither change 2 nor change 3 is the hero for accuracy.

### What CAN produce 20 to 30 degrees, measured: two mechanisms, and only two

**The cold fusion the settling gate exists to exclude**, time constant about 4 seconds from about 30
degrees out (session 48):

| Drawn at | Error |
| --- | --- |
| 0.0s | 30.0 degrees |
| 1.0s | 23.4 degrees |
| 2.0s | 18.2 degrees |
| 4.0s | 11.0 degrees |
| 9.7s | 2.7 degrees |

**Hard iron in the room**, invisible to every gate reading the heading stream (session 48), at London's
horizontal field of about 19.4 uT:

| Offset | Heading error, worst direction |
| --- | --- |
| 2 uT | 5.9 degrees |
| 5 uT | 14.5 degrees |
| 10 uT | 27.3 degrees |
| 20 uT | 45.9 degrees |

**So the owner's "20 to 30 degrees" is the cold fusion, the room, or both, and the LATCH is the only
one of the four changes that touches either.** That reframes the row: the valuable pair is not A and B.

## 2. Experiment B barely draws a compass at all, so it cannot be judged on accuracy

`probe-separability.mjs` and `probe-separability2.mjs` replayed `shared/qiblaSettle.ts` verbatim. The
settling gate needs 8 readings spanning 2.7 of 3 seconds; with the 2-degree gate restored a converged
stream emits almost nothing, so the gate starves:

| Configuration | Draws at, phone held still | Never draws |
| --- | --- | --- |
| SHIPPED, 50 Hz, no gate, latched | 9.7s | 0% |
| A, 5 Hz, no gate, latched | 9.8s | 0% |
| **B, 50 Hz, 2-degree gate, latched** | **23.0s** | **87%** |
| C, 50 Hz, no gate, unlatched | 9.7s | 0% |
| REJECTED 1.29.203 | never | 100% |

The owner ruled B still runs, its verdict being pass or fail on whether a compass appears at all
(2026-10-02). Waving the figure eight changes it: motion feeds the window, so B then draws at 3.5s
with only 2% never drawing. **B's outcome depends on whether the owner waves first**, which is why the
protocol fixes the gesture.

## 3. The latch is the dominant change, and its effect is 20x, measured while TURNING

`probe-latch.mjs` isolated the latch with the fusion pre-converged, so the gate is the only variable,
and measured the dial update rate DURING a continuous turn, the right question for the latch, since an
unlatched gate re-opens as soon as the phone stops and a mostly-stationary average flatters it:

| Configuration | Creeping 2 deg/s | Turning 10 deg/s | Turning 45 deg/s |
| --- | --- | --- | --- |
| SHIPPED, latched | 16.7/s (100% of readings) | 16.7/s (100%) | 16.7/s (100%) |
| A, 5 Hz, latched | 5.1/s (100%) | 5.1/s (100%) | 5.1/s (100%) |
| B, 2-degree gate, latched | 1.1/s (100%) | 4.3/s (100%) | 15.7/s (100%) |
| **C, unlatched** | **1.7/s (10%)** | **0.9/s (5%)** | **0.4/s (3%)** |
| REJECTED 1.29.203 | 0.1/s (13%) | 0.1/s (4%) | 0.1/s (2%) |

An unlatched gate discards 95% of readings while the user turns at 10 degrees a second, and the faster
the turn the worse it gets, the owner's 🐋  "I have shaken the phone a thousand times and it doesn't
move" exactly. The latch is worth 0.9/s to 16.7/s, a factor of 18.

**The counter-intuitive part, and why C was worth running:** C's dial is not merely slow, it is FROZEN
at whatever value it last drew, and that value was drawn early, while the fusion was still 20 to 30
degrees out. **Reverting the latch reproduces the owner's accuracy complaint too, not just his
responsiveness complaint.** One change explains both halves of what he reported.

## 4. A FIFTH change landed between the two builds, and the row counts four

`git log 5e4882b7..62f66c21` shows two commits, not one:

| Version | Commit | What it changed |
| --- | --- | --- |
| 1.29.204 | `6423d899` | The latch, plus all three `expo-location` patches |
| **1.29.205** | **`62f66c21`** | **The figure-eight calibration hint and its animation** |

The fifth change is not cosmetic: the hint asks for the standard hard-iron re-estimation gesture, hard
iron is the one mechanism that reaches 20 to 30 degrees, and waving takes the gate's open time from
23s to 3.5s. **The hint may be a cause of the improvement rather than a label on it.** The plan added
experiment E for it.

## 5. Wireless adb removes the tethering confound

Session 49's rule, the owner's own: a tethered phone sits inside the magnetic field of the thing
tethering it, so no heading reading taken over a cable is evidence about anywhere. Measured this
session: the 3T moved to wireless adb (`adb tcpip 5555`, `ONEPLUS A3003` answering over wifi, then on
1.29.211) and the iPhone XS read at 1.29.211 via `xcrun devicectl device info apps`. **The owner could
carry the 3T outdoors with the cable unplugged while `dumpsys sensorservice` and logcat stayed
readable**, so every reading sat outside the laptop's field and the rate claims stayed measurable.

## 6. The build mechanics, proven rather than assumed

The three `expo-location` changes live in `patches/expo-location+58.0.9.patch`, applied to
`node_modules` at `postinstall`, and every build worktree symlinks the MAIN checkout's `node_modules`
(`build-prod.zsh`). **So an experiment is an edit to `node_modules`, never a commit**, and three
consequences follow, each verified: the edit is invisible to git (no experiment branch can exist);
every build worktree sees it, so two builds must never run at once; and Gradle compiles the patched
Kotlin from source (session 49's `publication` block / prebuilt-AAR trap verified absent).

The restore is the risk that matters: a `node_modules` left edited silently changes every later build
in this repository, and nothing in the test suite would catch it, because the suite never compiles
Kotlin. Step 1's guard script was therefore run after every experiment, and the device proof restored
from `patch-package` itself rather than from a copy (section 8).

## 7. Every experiment's substitution was RUN before it was specified

The guard script, built and run against the real tree, printed its five expected lines and
`PATCH AS SHIPPED`. All five substitutions were then applied to copies of the day's source, 9 of 9
checks passing. A: `SENSOR_DELAY_NORMAL` = 2; B: the gate condition replaced whole so `TIME_DELTA`
still counted 2 (the check that makes B "the gate alone"); C: unlatched condition = 1, latch read = 0;
D: `kCLHeadingFilterNone` = 0; E: `<QiblaWave` = 0 with one usage before.

**Experiment C was confirmed in JS before any APK existed**: with the latch reverted,
`components/sheets/screens/__tests__/Qibla.test.tsx` fails exactly 2 of 65:

```
● the settling gate › keeps following while the user turns
    Expected: "-140deg"   Received: "-20deg"
● the settling gate › keeps following through a fast sweep, where no window could ever look settled
    Expected: "-195deg"   Received: "-95deg"
```

The received values are the measurement: the dial strands about 100 degrees short of where the phone is
pointing, stronger than the probe's 5%-of-readings figure, and this repository's own suite saying it.

## 8. THE PLAN'S OWN RESTORE PATH WAS WRONG, and only RUNNING it found that out

The plan's first design restored `node_modules` with `npx patch-package`. **It cannot work:**
`patch-package` refuses an already-edited tree (`Failed to apply patch for package expo-location`,
because the hunk no longer matches), and reverse-applying fails the same way
(`1 out of 4 hunks failed`). As first written the plan would have left `node_modules` edited after the
FIRST experiment, and every later build would have silently compiled the wrong code while reporting
`BUILD SUCCESSFUL`. Caught only because the script was executed rather than reviewed.

**The restore that works, measured end to end:** replace the package wholesale from yarn's cache
(`~/Library/Caches/Yarn/v6/npm-expo-location-58.0.9-<hash>/node_modules/expo-location`), then
`npx patch-package` (`expo-location@58.0.9 ✔`), then the guard printing `PATCH AS SHIPPED`, reachable
from ANY edited state, which is the property the restore needs. Two fixes from the same dry run: the
build script traps its own exit so no failure path strands the tree (verified by stubbing a failed
build), and a full restore cycle was followed by
`shared/__tests__/widgetRuntimeLoads.test.ts` (`3 passed`), because any install can reintroduce a
nested `@expo/ui` copy under `expo-widgets` and blank every widget, checked rather than assumed.

## 9. A probes folder needs TWO registrations, not one

The commit was refused with the suite fully green: the coverage gate
(`scripts/check-changed-coverage.js`) demands each changed source file be measured or declared
`UNMEASURED` with a reason, and `.mjs` matches its source pattern, so Biome's exclusion alone is not
enough. A probes folder needs an entry in BOTH `biome.json` `files.includes` and the gate's
`UNMEASURED` list (session 48's folder has exactly that). The gate's message is well designed: it
offers the two legitimate answers, so it cannot be silenced without a sentence explaining the
exemption. Third behaviour, constraining EXECUTION ORDER: coverage is measured on the WORKING tree, so
an untracked test would cover a file whose commit does not carry it: the gate refuses that, and the
planning commit and step 1's files cannot coexist in the tree. The gate working correctly, not an
obstacle.
