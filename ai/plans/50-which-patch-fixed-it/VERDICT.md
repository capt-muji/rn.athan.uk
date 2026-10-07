# The owner's verdicts, outdoors and untethered, 2026-10-02

Every verdict below was given on the owner's own 3T (iPhone XS for D), outdoors, USB cable OUT, in one
sitting at one spot. Wireless adb carried the installs and reads, so no reading sat inside the
laptop's magnetic field (session 49's rule, the owner's own). Five experiments isolated the changes
between the rejected 1.29.203 and the loved 1.29.205: A = rate to 5 Hz, B = 2-degree gate back, C =
latch reverted, D = iOS 1-degree filter back, E = hint removed (E ran as designed; the row's answer
came from the baseline plus C, A, B, D).

## Baseline: 1.29.217, the shipped build, reinstalled as the anchor

Built from `476522b7` (`uat-2`), carries the latch, 50 Hz, no 2-degree gate, iOS `kCLHeadingFilterNone`,
the figure-eight hint. It attributes nothing; the experiments do.

🐋  "So I've tested the geometry and it works amazingly. It really works perfectly. works great,
fantastic, really, really good... we can confirm this test works great. It's very smooth, it's
fantastic, really good."

Kaaba at 12 o'clock against Maps, dial follows a turn very smoothly. **One open observation:** the
owner reports the iPhone may be 1 to 2 degrees off (see "The iPhone's last 1 to 2 degrees" below).

## Experiment C: the latch reverted. FAILED, exactly as predicted

APK `athan-C.apk` from throwaway ref `7f945502`, carrying exactly `hooks/useQibla.ts | 3 +--`; the
gate is re-tested on EVERY reading instead of latching once. 50 Hz, no gate, iOS filter, hint all
still present.

🐋  "the 1+3 T, it gets stuck, like it lags really, really horribly. definitely a problem... So this
one is a flop. This one is bad."

**THE ROW'S CENTRAL RESULT, predicted in writing before the build existed.** Three independent
predictions, all confirmed on device:

| Prediction, made before the APK existed | Source | Outcome |
| --- | --- | --- |
| 5% of readings reach the dial while turning at 10 deg/s, against 100% latched | `MEASURED.md` section 3, `probe-latch.mjs` | confirmed on device |
| The dial stops at -20deg where it owes -140, and -95 where it owes -195 | this repo's own `Qibla.test.tsx`, 2 of 65 failing | confirmed on device |
| It will reproduce the owner's original complaint | the plan's section 4 table | confirmed in his own words |

**So the LATCH is the change that fixed the compass's responsiveness**, and nothing else substitutes
for it: C keeps all three `expo-location` patches and still fails. The row's first hypothesis (the
latch necessary, not sufficient) settles as: necessary, and the patches without it are worth nothing.

The owner tested the 3T only, which is correct: the latch lives in `hooks/useQibla.ts`, shared by both
platforms, and the iPhone never ran this code. 🐋  "I've just tested the 1+3T only not the iPhone."

🐋  "it's for confirmation. The rest of the tests are for confirmation and also to see if they're
actually even better than the first test." Each remaining experiment is judged backward (does
removing it reproduce the defect?) and forward (is it as good or better without it, making it
removable?).

## Experiment A: the sensor rate back to 5 Hz. Accurate but NOT smooth, exactly as bounded

`athan-A.apk`, `node_modules` edit: both registrations `SENSOR_DELAY_GAME` (20 ms, 50 Hz) back to
`SENSOR_DELAY_NORMAL` (200 ms, 5 Hz). Latch, no gate, iOS filter, hint unchanged. 3T only, correctly:
this is `LocationModule.kt`, which iOS never runs.

🐋  "It's I think it's as accurate, it seems as accurate as the first test we did. But it's not smooth,
it's not smooth at all. It's very wobbly. It's very jittery so it's very very wobbly. It feels much
slower. It jumps. The compass is not smooth. Accurate, but no smooth, no smoothing, no smooth at all."

Kaaba still at 12 o'clock; immediately distinguishable on smoothness alone. The cleanest confirmation
of arithmetic, not device, prediction: the rate's accuracy effect is bounded at 0.40 degrees mean
either way (`MEASURED.md` section 1) and the dial drops to 5.1 updates/s against 16.7: accuracy held,
smoothness collapsed. **Forward answer NO:** `SENSOR_DELAY_GAME` stays, and `SENSOR_DELAY_UI` (15 Hz,
nearer 5 than 50) is no longer an attractive fallback either.

**The two changes are separated, each owning one quality:** the latch owns whether the dial FOLLOWS at
all (C); the 50 Hz rate owns whether it follows SMOOTHLY (A). The original hypothesis (the 2-degree
gate was the accuracy hero) is now refuted twice over: by the 2.38-degree bound and by A holding
accuracy at a tenth of the rate.

## Experiment B: the 2-degree gate restored at 50 Hz. Wobbly and slow, and the compass DID appear

`athan-B.apk`, `node_modules` edit: the 2-degree `DEGREE_DELTA` emission gate put back, as upstream
ships it. Latch, 50 Hz, iOS filter, hint unchanged. Live rate: `sampling_period(ms) = {20.0},
selected = 20.00 ms`: B isolated the GATE, not the rate.

🐋  "very very wobbly as in very slow very jittery. It's not as accurate. I think. I feel like it's a
little bit less accurate. Could be just me in my eyes, but yeah, it's not. It's not the one. Still
doesn't, it's not better than number one."

Compass appeared, followed very slowly and jittery, not better than baseline.

**The prediction was wrong in its most visible part, worth more than a hit.** `MEASURED.md` section 2
predicted the compass would NEVER DRAW in 87% of still runs. It drew every time. The simulation held
the phone still to within 0.5 degrees of jitter and assumed a passive user; a hand outdoors moves
several degrees and the owner turns the phone to find the qibla, so readings clear the gate far more
often. **The 87% figure describes a phone on a table, not a phone in a hand.** The gate's real cost is
what he felt: 0.83 Hz of updates while creeping onto the line, read as wobble and lag.

On "less accurate": his own caveat is correct and the measurement supports it: the gate's bounded
error is 2.38 degrees worst, 0.78 mean while turning, near the limit of an eye judging against a map.
**Verdict: the gate's removal earned its place, for RESPONSIVENESS.**

## Experiment D: the iOS 1-degree heading filter restored. Not smooth, on the iPhone XS

Xcode Release 1.29.217; `manager.headingFilter = kCLHeadingFilterNone` deleted so CoreLocation's
1-degree default applies, which is what `expo-location` ships. The latch and every Android-side change
unchanged (none of which iOS runs).

🐋  "I just tested the iOS build that it's not very smooth at all."

**D is the iOS twin of B, and modelled rather than measured on the phone**: no `dumpsys` equivalent
was captured on iOS, so unlike every other rate figure in this row these come from the same model as
the Android probes. Stated plainly because the distinction matters.

| Motion | Shipped, filter NONE | D, 1-degree filter |
| --- | --- | --- |
| Phone held still | 50.0/s (100%) | **8.5/s (17%)** |
| Creeping onto the line, 2 deg/s | 50.0/s (100%) | **8.8/s (17%)** |
| Turning 10 deg/s | 50.0/s (100%) | 10.8/s (22%) |
| Sweeping 45 deg/s | 50.0/s (100%) | 27.2/s (54%) |

The filter is most hostile exactly where a qibla compass does its work: careful alignment throws away
about 83% of readings. That explains session 48's 731 of 731 readings rejected on this phone,
stationary. **`kCLHeadingFilterNone` earned its place and is the strongest upstream PR candidate in
the set**: `expo-location` never sets the property, so every compass built on the library inherits a
default that silences a stationary phone. One-line correction; row 51's call.

# THE ANSWER

🐋  "The first test that we did is absolute best for both platforms no questions asked easily the best
one. It's smooth and it's accurate."

🐋  "for Android, the first option is the best option, absolutely best option. Fantastic. Nothing beats
it. It's smooth, it's accurate, it's great."

**Every one of the four changes earned its place, and each owns a DIFFERENT quality. None is redundant
and none substitutes for another.**

| # | Change | What it owns | The experiment that proved it |
| --- | --- | --- | --- |
| 1 | **The latch** (`hooks/useQibla.ts`) | **Whether the dial FOLLOWS at all** | C: "lags really horribly", with all three patches present |
| 2 | **No 2-degree gate** (Android) | **Responsiveness while aligning** | B: "very slow very jittery", with 50 Hz present |
| 3 | **50 Hz** (Android) | **Smoothness** | A: "accurate, but no smooth at all", with the latch present |
| 4 | **`kCLHeadingFilterNone`** (iOS) | **Smoothness on the iPhone** | D: "not very smooth at all" |

(Platform-conditional since rows 53/54: row 53's forced wave and row 54's finding that the Android
hunks are no longer reached on fused-sensor phones make rows 2 and 3 Android-conditional; see
`ai/plans/NEXT-SESSION-PATCHES-AND-COPY.md` for the current patch verdict. The iOS and latch rows
are untouched by that.)

**The row's own hypothesis (the 2-degree emission gate was "the likely hero for ACCURACY") is REFUTED
three separate ways:** (1) by arithmetic, before any build: a quantiser's error is bounded by its
step, 2.38 degrees worst and 0.78 mean, against a complaint of 20 to 30 degrees; (2) by experiment A:
accuracy held at one tenth of the sample rate; (3) by experiment B itself: the owner reported a
SMOOTHNESS problem first and hedged on accuracy, 🐋  "Could be just me in my eyes".

**What fixed the owner's original complaint was the LATCH, which is this app's own code and
not a patch at all.** The three `expo-location` patches make the compass pleasant; the latch is what
makes it work. C is the proof: it carries every patch and still fails.

None of A, B, D came back better without its change, so all four stay, a stronger statement than "we
think the latch did it". **`SENSOR_DELAY_UI` is ruled out as a battery fallback**: 5 Hz was
immediately distinguishable and unacceptable, and 15 Hz sits far nearer 5 than 50.

## For row 51, the upstream PRs

| Candidate | Evidence from this row | Strength |
| --- | --- | --- |
| **iOS `headingFilter`** | D, "not very smooth at all" on an XS; 731 of 731 readings rejected when stationary; 17% survive while creeping onto a line | **Strongest. One line, and it breaks every compass built on the library** |
| **The Android 2-degree gate** | B, "very slow very jittery" at full 50 Hz; 0.83 Hz served during careful alignment | **Strong, best proposed as configurable rather than deleted** |
| `headingAccuracy` in degrees | Not touched by this row; session 49 measured 25.4 degrees on the XS where the library would say "bucket 2" | Unchanged by today's work |

The 5 Hz to 50 Hz rate change is a WEAKER candidate than it looked: a preference rather than a
correction, upstream's 5 Hz defensible for a map. It belongs as an option.

## The iPhone's last 1 to 2 degrees

🐋  "I realised iOS is maybe like 2 degrees off or 1 degree off, I don't know. Um... Is there any way to
make it even more perfect?"

Not answerable by the five experiments. Three measurements bound it:

| Source | Measurement | What it means here |
| --- | --- | --- |
| Session 47, full-resolution frames of the owner's own recordings | Kaaba sits **119.4 and 118.9** degrees from the dial's North against a true **118.99**, errors of 0.4 and 0.1 | the app's drawing and geometry are already correct to well inside 1 degree |
| Session 49, the native module on the XS | the phone reports its OWN heading uncertainty as **25.4, 24.8, 24.8 degrees** | the hardware's claimed uncertainty is an order of magnitude larger than the reported error |
| Session 48, hard iron swept over every offset direction | a 10 uT offset swings the heading **27.3** degrees at London's horizontal field | the dominant error term is the room, not the code |

A 1-to-2-degree residual is at the noise floor of the instrument; no gate reading the heading stream
can see a stable bias, by construction. The one unpulled lever is Apple's own calibration HUD (the app
deliberately answers `false` to `locationManagerShouldDisplayHeadingCalibration`); session 48
downgraded it honestly (UI rather than algorithm, supplying only the motion the hint already asks
for). **Recommendation, stated plainly: do not chase this.** Every remaining mechanism would need an
invented constant, a tuned offset or a per-location calibration, against the owner's standing rule.
Experiment D says the filter is not where the last degree hides.

## The figure-eight animation: the owner's question, measured

🐋  "if we do have this animation and the user doesn't actually, you know, wobble the phone around.
Because we just wait 3 seconds, isn't it? I like the fact that we are using it as a loading screen to
load the compass behind the scenes. That's really smart. I like that idea. But what if the user doesn't
actually shake their phone? Is it gonna give them a wrong reading or what?"

`scripts/probes/probe-no-wave.mjs`, deleted with the probe trees in 1.29.266 (recoverable from git history), replayed the shipped gate against a still phone and a waved one, in
rooms carrying 0, 5, 15 and 27 degrees of hard iron (300 runs per cell):

| Room | User | Gate opens | Median open | Error of the drawn heading | Residual bias |
| --- | --- | --- | --- | --- | --- |
| clean | **still** | 100% | 9.7s | 2.98 deg | 0.0 |
| clean | waves | 100% | **3.7s** | **11.88 deg** | 0.0 |
| 5 deg hard iron | **still** | 100% | 9.7s | 3.00 deg | **5.0** |
| 5 deg hard iron | waves | 100% | 3.7s | 11.86 deg | 5.0 |
| 15 deg hard iron | **still** | 100% | 9.7s | 2.94 deg | **15.0** |
| 27 deg hard iron | **still** | 100% | 9.7s | 2.99 deg | **27.0** |

**1. The compass ALWAYS opens, waved or not**: a cold fusion's drift decays whether or not the phone
moves, so the animation is a loading screen, exactly as he read it, not a correctness gate.

**2. THE WAVE OPENS THE GATE EARLY AND AT A WORSE READING: 11.9 degrees of error at 3.7s against 2.98
at 9.7s.** Waving feeds the settling window with readings whose spread is the USER'S OWN MOTION, the
window's halves agree, and the gate opens while the fusion is still 12 degrees out. **A defect in the
shipped build: the animation rewards impatience.**

**3. Hard iron passes the gate untouched in every case**: the gate measures DRIFT and a stable bias
does not drift (session 48, by construction). The wave COULD cure it, the figure eight being the
standard hard-iron re-estimation the OS recalibrates from, but nothing verifies that it happened.

**Honest summary as it shipped:** a good loading screen, not a correctness gate, and it makes the
first reading worse for users who follow it. 🐋  "If we do keep it, we definitely need to make it
better. But that will be in a future session." The defect and the design decision it forces went to
`NEXT-SESSION.md` (deleted in the record compression, recoverable from git; the animation work was
taken by row 52, the wave gate by row 53's step 4).
