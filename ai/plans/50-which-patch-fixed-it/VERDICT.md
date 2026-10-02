# The owner's verdicts, outdoors and untethered, 2026-10-02

Every verdict below was given on the owner's own 3T, outdoors, with the USB cable OUT, in one sitting
at one spot. Wireless adb (`192.168.1.206:5555`) carried the installs and the sensor reads, so no
reading was taken inside the laptop's magnetic field (session 49's rule, the owner's own).

**This page is filled in as each test is judged. A row with no verdict has not been run.**

---

## The baseline: 1.29.217, the shipped build, no experiment applied

**This is not one of the five experiments.** It is the build the owner already approved, reinstalled so
that every later verdict has an anchor measured in the same place on the same evening. Running it first
is what makes "better or worse" answerable at all.

| | |
| --- | --- |
| APK | `athan-SHIPPED.apk`, versionName 1.29.217 |
| Built from | `476522b7` (`uat-2`), all four changes present |
| Carries | the latch, 50 Hz, no 2-degree gate, iOS `kCLHeadingFilterNone`, the figure-eight hint |

**The owner's verdict, and it is unambiguous:**

🐋  "So I've tested the geometry and it works amazingly. It really works perfectly. works great,
fantastic, really, really good... we can confirm this test works great. It's very smooth, it's
fantastic, really good."

| Question | Answer |
| --- | --- |
| Does the compass appear, and how fast | Yes |
| Is the Kaaba at 12 o'clock against Maps | Yes, the geometry is right |
| Does the dial follow a turn | Yes, very smooth |
| Compared to the build he loved | It IS that build |

**One new observation, and it is the only open item from this run:** the owner reports the iPhone may
be **1 to 2 degrees off**, and asks whether it can be made more perfect. That is a genuinely different
question from the row's, and it is recorded in "What the baseline opened" below rather than answered
here, because 1 to 2 degrees is at or below the floor every measurement in this programme has
established for this feature.

**What this verdict does and does not establish.** It confirms the shipped build is good in the spot the
experiments run in, which is exactly its job. It attributes nothing: all four changes plus the hint are
present, so it is the state the row exists to decompose. The attribution comes from the experiments.

---

## Experiment C: the latch reverted. FAILED, exactly as predicted

| | |
| --- | --- |
| APK | `athan-C.apk`, built from throwaway ref `7f945502` |
| Ref carried | `hooks/useQibla.ts \| 3 +--`, one file, one change, verified before the build |
| Changed | the settling gate is re-tested on EVERY reading instead of latching once |
| Unchanged | 50 Hz, no 2-degree gate, iOS filter, the figure-eight hint, all still present |

**The owner's verdict:**

🐋  "the 1+3 T, it gets stuck, like it lags really, really horribly. definitely a problem... So this
one is a flop. This one is bad."

| Question | Answer |
| --- | --- |
| Does the compass appear | Yes |
| Does the dial follow a turn | **No. It sticks and lags horribly** |
| Compared to the baseline | Far worse, a flop |

**THIS IS THE ROW'S CENTRAL RESULT, and it was predicted in writing before the build existed.** Three
independent predictions all said the dial would stick, and all three were right:

| Prediction, made before the APK existed | Source | Outcome |
| --- | --- | --- |
| 5% of readings reach the dial while turning at 10 deg/s, against 100% latched | `MEASURED.md` section 3, `probe-latch.mjs` | confirmed on device |
| The dial stops at -20deg where it owes -140, and -95 where it owes -195 | this repo's own `Qibla.test.tsx`, 2 of 65 failing | confirmed on device |
| It will reproduce the owner's original complaint | the plan's section 4 table | confirmed in his own words |

**So the LATCH is the change that fixed the compass's responsiveness**, and nothing else in the set of
four can substitute for it: C keeps all three `expo-location` patches and still fails. That settles the
row's first hypothesis, which said the latch was necessary and not sufficient; it is necessary, and the
patches without it are worth nothing.

**The owner tested the 3T only, which is correct:** the latch lives in `hooks/useQibla.ts`, shared by
both platforms, and the iPhone is still on 1.29.211 and has never run this code. No iPhone reading was
taken, and none is claimed. 🐋  "I've just tested the 1+3T only not the iPhone."

### What the remaining experiments are for, in the owner's own framing

🐋  "it's for confirmation. The rest of the tests are for confirmation and also to see if they're
actually even better than the first test."

**The second half of that is the sharper reason, and it is not what the row was written to ask.** The
row asks which change fixed the compass, which C has now answered. The owner's question is forward
looking: an experiment that removes a change and comes back BETTER, or equally good and cheaper, is a
change worth not shipping.

So each remaining experiment is judged on two questions rather than one:

| | Question |
| --- | --- |
| Backward | does removing this reproduce the defect, confirming the change earned its place? |
| **Forward** | **is it as good or better WITHOUT the change, making the change removable?** |

That matters most for experiment A. The 2.38-degree bound in `MEASURED.md` section 1 says dropping
50 Hz to 5 Hz cannot hurt ACCURACY, and 5 Hz draws 5.1 dial updates a second against 16.7. If the owner
cannot tell the difference, the lower rate is the better engineering choice: it is one tenth of the
sensor wakeups while the sheet is open, on a 2016 phone, for a quantity his own rule says is already
right. `WHAT-FIXED-IT.md` named `SENSOR_DELAY_UI` as a one-word fallback "if battery while the sheet is
open ever becomes a complaint"; experiment A is the measurement that would justify taking it without
waiting for the complaint.

---

## Experiment A: the sensor rate back to 5 Hz. Accurate but NOT smooth, exactly as bounded

| | |
| --- | --- |
| APK | `athan-A.apk`, built from `uat-2` with a `node_modules` edit |
| Changed | both registrations from `SENSOR_DELAY_GAME` (20 ms, 50 Hz) back to `SENSOR_DELAY_NORMAL` (200 ms, 5 Hz) |
| Unchanged | the latch, no 2-degree gate, the iOS filter, the figure-eight hint |
| Tested on | the 3T only, correctly: this is `LocationModule.kt`, which iOS never runs |

**The owner's verdict, and it separates the two qualities cleanly:**

🐋  "It's I think it's as accurate, it seems as accurate as the first test we did. But it's not smooth,
it's not smooth at all. It's very wobbly. It's very jittery so it's very very wobbly. It feels much
slower. It jumps. The compass is not smooth. Accurate, but no smooth, no smoothing, no smooth at all."

| Question | Answer |
| --- | --- |
| Is the Kaaba still at 12 o'clock | **Yes, as accurate as the baseline** |
| Does it feel steppier | **Yes: wobbly, jittery, jumps, feels much slower** |
| Can it be told apart from the baseline | **Yes, immediately, on smoothness alone** |

**This is the row's cleanest confirmation of a prediction made from arithmetic rather than from a
device.** `MEASURED.md` section 1 bounded the rate's effect on accuracy at 0.40 degrees mean either
way, because a sample rate changes how OFTEN a reading arrives and never how CORRECT it is, and section
3 put the dial at 5.1 updates a second against 16.7. The owner's two sentences are those two numbers:
accuracy held, smoothness collapsed.

**It also answers his forward question with a NO, which is the useful half.** 5 Hz would have been the
better engineering choice if he could not tell the difference, since it is one tenth of the sensor
wakeups on a 2016 phone for a quantity already proven accurate. He can tell the difference immediately,
so **`SENSOR_DELAY_GAME` stays, and `SENSOR_DELAY_UI` is no longer an attractive fallback either**: at
15 Hz it sits nearer 5 than 50, and the complaint here is about exactly that gap. `WHAT-FIXED-IT.md`'s
"one-word fallback if battery ever becomes a complaint" is now a measured trade rather than a free one.

**The two changes are now separated, and each owns one quality:**

| Change | Owns | Evidence |
| --- | --- | --- |
| The latch | **whether the dial FOLLOWS at all** | C sticks and lags horribly with all three patches present |
| The 50 Hz rate | **whether it follows SMOOTHLY** | A is accurate and "not smooth at all" with the latch present |

Neither substitutes for the other, and the row's original hypothesis that the 2-degree gate was the
accuracy hero is now refuted twice: by the 2.38-degree bound, and by A holding its accuracy at a tenth
of the sample rate.

---

## Experiment B: the 2-degree gate restored at 50 Hz. Wobbly and slow, and the compass DID appear

| | |
| --- | --- |
| APK | `athan-B.apk`, built from `uat-2` with a `node_modules` edit |
| Changed | the 2-degree `DEGREE_DELTA` emission gate put back, as upstream ships it |
| Unchanged | 50 Hz, the latch, the iOS filter, the figure-eight hint |
| Rate measured live | `0x00000003) active-count = 1; sampling_period(ms) = {20.0}, selected = 20.00 ms` |

That live reading matters: it proves B isolated the GATE and not the rate. The magnetometer was still
being sampled at 50 Hz while the gate decided which of those samples to emit.

**The owner's verdict:**

🐋  "very very wobbly as in very slow very jittery. It's not as accurate. I think. I feel like it's a
little bit less accurate. Could be just me in my eyes, but yeah, it's not. It's not the one. Still
doesn't, it's not better than number one."

| Question | Answer |
| --- | --- |
| Does the compass appear at all | **Yes** |
| Does it follow a turn | Very slowly, very jittery |
| Accuracy | "not as accurate... could be just me in my eyes" |
| Better than the baseline | No |

**THE PREDICTION WAS WRONG IN ITS MOST VISIBLE PART, and that is worth more than a hit would have
been.** `MEASURED.md` section 2 predicted the compass would NEVER DRAW in 87% of still runs, because a
converged stream emits almost nothing through a 2-degree gate and the settling gate needs 8 readings
spanning 3 seconds. It drew. Two differences between the model and the room explain it, and both say
the model was too clean rather than wrong in kind:

- **The simulation held the phone perfectly still** apart from 0.5 degrees of jitter. A hand holding a
  phone outdoors moves it several degrees, so readings clear a 2-degree gate far more often than a
  simulated still phone does. The owner's own measurement of the figure-eight gesture is the same
  effect deliberately applied.
- **It also assumed the user waits passively.** He turns the phone to find the qibla, which is motion
  the gate passes.

So the honest statement is that **the 87% figure describes a phone on a table, not a phone in a hand**,
and the plan should have said so. The gate's real cost is what he felt: 0.83 Hz of updates while
creeping onto the line, which reads as wobble and lag rather than as a missing compass.

**On "less accurate", his own caveat is the correct one and the measurement supports the caveat rather
than the impression.** The 2-degree gate quantises the heading, and `MEASURED.md` section 1 bounds that
at **2.38 degrees worst, 0.78 mean** while turning. That is real but it is near the limit of what an
eye can judge against a map, which is exactly why he hedged. The row's original hypothesis, that this
gate was the ACCURACY hero, stays refuted: a 0.78-degree mean error cannot explain a 20-to-30-degree
complaint, and he reports it as a smoothness problem first.

**Verdict: the gate's removal earned its place, for RESPONSIVENESS.** Three of three Android
experiments are now worse than the baseline, and each for its own reason.

---

## Experiment D: the iOS 1-degree heading filter restored. Not smooth, on the iPhone XS

| | |
| --- | --- |
| Build | `npx expo run:ios --configuration Release`, versionName 1.29.217 on the XS |
| Changed | `manager.headingFilter = kCLHeadingFilterNone` deleted, so CoreLocation's 1-degree default applies, which is what `expo-location` ships |
| Unchanged | the latch, and every Android-side change, none of which iOS runs |

**The owner's verdict:**

🐋  "I just tested the iOS build that it's not very smooth at all."

| Question | Answer |
| --- | --- |
| Does the compass appear | Yes |
| Smoothness | **Not very smooth at all** |
| Better than the baseline | No |

**D is the iOS twin of B, and the measurement explains why it hurts most when the user moves least.**
Both gates discard readings before the app sees them, B at 2 degrees on Android and D at 1 degree on
iOS. Modelled on CoreLocation's ~50 Hz fusion on the XS:

**Modelled, not measured on the phone:** no `dumpsys` equivalent was captured on iOS, so unlike every
other rate figure in this row these come from the same model as the Android probes rather than from the
device. Stated plainly because the distinction matters.

| Motion | Shipped, filter NONE | D, 1-degree filter |
| --- | --- | --- |
| Phone held still | 50.0/s (100%) | **8.5/s (17%)** |
| Creeping onto the line, 2 deg/s | 50.0/s (100%) | **8.8/s (17%)** |
| Turning 10 deg/s | 50.0/s (100%) | 10.8/s (22%) |
| Sweeping 45 deg/s | 50.0/s (100%) | 27.2/s (54%) |

**The filter is at its most hostile exactly where a qibla compass does its work.** Holding still or
creeping carefully onto the line, it throws away about 83% of readings; on a fast sweep it barely
bites. Careful alignment IS the interaction, so the gate penalises the only motion that matters. That
also explains session 48's measurement of **731 of 731 readings rejected** on this same phone, which
was taken with the phone stationary.

**So `kCLHeadingFilterNone` earned its place, and it is the strongest upstream PR candidate in the
set**: `expo-location` never sets this property at all, so every compass built on the library inherits
a default that silences a stationary phone. That is a one-line correction to the library rather than a
new feature, which is what row 51 was queued to decide.

---

# THE ANSWER

**The owner's conclusion, after all five experiments, both phones, outdoors and untethered:**

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

**The row's own hypothesis is REFUTED, and it was refuted three separate ways.** It named the 2-degree
emission gate as "the likely hero for ACCURACY":

1. **By arithmetic, before any build existed:** a quantiser's error is bounded by its step, measured at
   2.38 degrees worst and 0.78 mean, against a complaint of 20 to 30 degrees.
2. **By experiment A:** accuracy held perfectly at one tenth of the sample rate, which no accuracy
   mechanism would survive.
3. **By experiment B itself:** the owner reported it as a SMOOTHNESS problem first and hedged on
   accuracy in his own words, 🐋  "Could be just me in my eyes".

**What actually fixed the owner's original complaint was the LATCH**, which is this app's own code and
not a patch at all. The three `expo-location` patches make the compass pleasant; the latch is what
makes it work. C is the proof: it carries every patch and still fails.

**THE PREDICTION THAT WAS WRONG, recorded because it is the most useful thing on this page.**
`MEASURED.md` section 2 predicted experiment B would NEVER DRAW a compass in 87% of still runs. It drew
every time. The model held the phone still to within 0.5 degrees of jitter; a hand holding a phone
outdoors moves several degrees, so readings clear a 2-degree gate far more often than the simulation
allowed. **The 87% figure describes a phone on a table, not a phone in a hand,** and the plan should
have said so. The gate's real cost is the 0.83 Hz of updates it serves while a user creeps onto the
line, which is what he felt as wobble.

**The experiments that could NOT have answered this, and why running them anyway was right.** A, B and
D were each bounded in advance as polish rather than fixes, and all three came back as predicted. The
owner's reason for running them was better than the row's: 🐋  "it's for confirmation and also to see if
they're actually even better than the first test." An experiment that removes a change and comes back
BETTER makes that change removable. None did, so all four changes stay, and that is a stronger
statement than "we think the latch did it".

**`SENSOR_DELAY_UI` is now ruled out as a battery fallback.** `WHAT-FIXED-IT.md` offered 15 Hz as a
one-word change "if battery while the sheet is open ever becomes a complaint". Experiment A measured
5 Hz as immediately distinguishable and unacceptable, and 15 Hz sits far nearer 5 than 50, so taking it
would trade a quality the owner can see for a cost he has not complained about.

## What this means for row 51, the upstream PRs

Row 51 was queued behind this one precisely so its PRs could be argued from an isolation experiment
rather than a hunch. All three candidates now have one:

| Candidate | Evidence from this row | Strength |
| --- | --- | --- |
| **iOS `headingFilter`** | D, judged "not very smooth at all" on an XS; 731 of 731 readings rejected when stationary; 17% of readings survive while creeping onto a line | **Strongest. One line, and it breaks every compass built on the library** |
| **The Android 2-degree gate** | B, judged "very slow very jittery" at full 50 Hz, so the gate alone is responsible; 0.83 Hz served during careful alignment | **Strong, best proposed as configurable rather than deleted** |
| `headingAccuracy` in degrees | Not touched by this row; session 49 measured 25.4 degrees on the XS where the library would say "bucket 2" | Unchanged by today's work |

**The 5 Hz to 50 Hz rate change is now a WEAKER upstream candidate than it looked.** Experiment A shows
the rate matters for smoothness, but it is a preference rather than a correction: upstream's 5 Hz is a
defensible default for a map, where the patch's value is specific to a compass. It belongs as an option,
as `WHAT-FIXED-IT.md` already said.

---

## What the baseline opened: the iPhone's last 1 to 2 degrees

🐋  "I realised iOS is maybe like 2 degrees off or 1 degree off, I don't know. Um... Is there any way to
make it even more perfect?"

**This is not something the five experiments can answer**, and it would be dishonest to let it ride on
one of them. Three measurements already in this programme bound it:

| Source | Measurement | What it means here |
| --- | --- | --- |
| Session 47, full-resolution frames of the owner's own recordings | the Kaaba sits **119.4 and 118.9** degrees from the dial's North against a true **118.99**, errors of 0.4 and 0.1 | the app's drawing and geometry are already correct to well inside 1 degree, so the residual is not in the app's maths |
| Session 49, the native module on the XS | the phone reports its OWN heading uncertainty as **25.4, 24.8, 24.8 degrees** | the hardware's own claimed uncertainty is an order of magnitude larger than the error the owner is now reporting |
| Session 48, hard iron swept over every offset direction | a 10 uT offset swings the heading **27.3** degrees at London's horizontal field | the dominant error term is the room, not the code |

**So a 1-to-2-degree residual on a magnetometer compass is at the noise floor of the instrument**, and
the honest answer is that it is already better than the phone claims to be able to do. Session 48's
research also measured that no gate reading the heading stream can see a stable bias, by construction.

**What could still be tried, and it is a decision for the owner rather than this row:** the one lever
nobody has pulled is Apple's own calibration HUD, which session 49 built the module for and
deliberately answers `false` to (`locationManagerShouldDisplayHeadingCalibration`), on the grounds that
the app owns every pixel of that screen. Letting iOS show it would hand the calibration to Apple's own
guided flow. Session 48 downgraded this honestly: the alert is UI rather than algorithm and supplies
only the motion the figure-eight hint already asks for.

**Recommendation, stated plainly: do not chase this.** The owner's standing rule is that the app never
invents a constant, a tuned offset or a per-location calibration, and every remaining 1-to-2-degree
mechanism would need one. Experiment D said what it could about the iPhone's share: removing
`kCLHeadingFilterNone` costs smoothness and nothing about accuracy, so the filter is not where the
last degree hides.

---

# THE FIGURE-EIGHT ANIMATION: the owner's question, measured

🐋  "if we do have this animation and the user doesn't actually, you know, wobble the phone around.
Because we just wait 3 seconds, isn't it? I like the fact that we are using it as a loading screen to
load the compass behind the scenes. That's really smart. I like that idea. But what if the user doesn't
actually shake their phone? Is it gonna give them a wrong reading or what?"

**The answer is yes, and it is worse than he feared in one way and better in another.**
`scripts/probes/probe-no-wave.mjs` replays the shipped gate against a still phone and a waved one, in
rooms carrying 0, 5, 15 and 27 degrees of hard iron:

| Room | User | Gate opens | Median open | Error of the drawn heading | Residual bias |
| --- | --- | --- | --- | --- | --- |
| clean | **still** | 100% | 9.7s | 2.98 deg | 0.0 |
| clean | waves | 100% | **3.7s** | **11.88 deg** | 0.0 |
| 5 deg hard iron | **still** | 100% | 9.7s | 3.00 deg | **5.0** |
| 5 deg hard iron | waves | 100% | 3.7s | 11.86 deg | 5.0 |
| 15 deg hard iron | **still** | 100% | 9.7s | 2.94 deg | **15.0** |
| 27 deg hard iron | **still** | 100% | 9.7s | 2.99 deg | **27.0** |

**Three findings, and the second one is a defect in the shipped build.**

**1. The compass ALWAYS opens, waved or not, so the animation is not a gate on correctness.** A still
phone satisfies the drift test too, because a cold fusion's drift decays whether or not the phone
moves. So nobody is ever stuck on the hint, which answers the "is it useful?" half: it is a loading
screen, exactly as he read it, and not a prerequisite.

**2. THE WAVE OPENS THE GATE EARLY AND AT A WORSE READING: 11.9 degrees of error at 3.7s against 2.98
at 9.7s.** This inverts the hint's apparent purpose. Waving feeds the window with readings whose spread
comes from the USER'S OWN MOTION, so the window's two halves agree and the gate opens while the fusion
is still 12 degrees out. A user who obeys the instruction gets a confident compass sooner and WRONGER
than one who ignores it. The animation currently rewards impatience.

**3. Hard iron passes the gate untouched in every case**, which session 48 already proved by
construction: the gate measures DRIFT, and a stable bias does not drift. So a user in a steel-framed
room gets a compass that is confident and carries the full room error, whether they wave or not. The
wave COULD cure this, because the figure-eight gesture is the standard hard-iron re-estimation and the
OS recalibrates from it, but nothing in the app verifies that it happened.

**So the honest summary of the animation as it ships:** it is a good loading screen, it is not a
correctness gate, and it currently makes the first reading worse for the users who follow it. That is a
real defect and it is the next session's work, which is written up in `NEXT-SESSION.md`.
