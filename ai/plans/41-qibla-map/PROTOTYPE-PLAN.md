# Prototype plan: prove the theory on the iPhone XS, before anyone builds a feature

Written 2026-09-30. **This is NOT the execution plan.** The owner's instruction: 🐋  "I will allow you to
build, you know, to prototype, but for execution, execution means like the real big piece of work, but we
don't really need to go that far, I guess. We just want to make sure that our prototype works, our theory
works."

So this plan has one job: **find out whether the theory survives contact with a real phone**, at the smallest
possible cost, on the one device that is connected. It ships nothing, merges no feature, and every change it
makes is thrown away.

`PLAN.md`, the real execution plan, stays unwritten until the seven `PROPOSALS.md` rulings land AND this
prototype has reported.

## What the theory is, in the order the prototype must test it

The design is a ladder (`P2`). Three of its four rungs rest on claims that are proven in arithmetic and
unproven on hardware:

| # | The claim | Proven where | What could kill it |
| --- | --- | --- | --- |
| **T1** | The magnetic offset is a **repeatable property of a spot**, so it can be calibrated and stored | Nowhere. Two readings, one evening (`P2`, `P5`) | The offset wanders with time at a fixed spot |
| **T2** | The sun gives true north on a real phone to a few degrees, with no magnetometer | Arithmetic only, to 0.54 arcmin (`P1`) | The interaction is unusable, or the phone's clock or position is worse than assumed |
| **T3** | A tile decodes and draws inside budget in Hermes on an A12 | V8 only, 4.3 ms and 11.3 ms (`P4`) | Hermes is an order of magnitude slower, or 9 tiles blow memory |

**T1 is first because everything rests on it and it is the cheapest to answer.** It needs no new code at all.

## Step P1. Settle T1: is the offset a property of the spot?

**REVISED 2026-09-30 after reading the device.** The XS has **1.29.120** installed, whose
`IOS_AXIS_CORRECTION` is **190**, the desk-tuned value. `uat-2` ships **180**. So the owner's phone is running
the room-tuned build, which makes his "it points correctly" expected rather than surprising, and hands this
step a falsifiable experiment with a **predicted number**. See `P5` sections 6 and 7.

**The revised test, which needs no instrumented build at all:** leave the phone on its spot, install `uat-2`
without moving it, and measure how far the dial swings. It must move by **exactly 10 degrees**, the difference
between the two constants. If it does, the reading at that spot is repeatable and `P2`'s hypothesis holds. If
it moves by anything else, no stored offset can work and rung 2 becomes a landmark note. **It also puts the
defect on the owner's own desk in one install**, which is the demonstration this row has been arguing in
prose.

The time-and-place sweep below remains the fuller test and is worth running after it, because one comparison
of two constants proves repeatability at one instant rather than across hours.

**The original design, still valid as the follow-up.**

The owner's own setup is the controlled experiment: the phone lies flat on a fixed surface, aimed at a known
truth (his wall corner, which he states is the real qibla). `P5` section 5 has the design.

**What to measure.** The heading the fused sensor reports, at a fixed spot and orientation, sampled:

| Variable | Readings | Prediction if T1 holds | Prediction if T1 fails |
| --- | --- | --- | --- |
| **Time** | Same spot, same orientation, 6 samples over at least 3 hours, plus one the next day | Spread under about 3 degrees | Spread over 10 degrees, and nothing can be stored |
| **Place** | Two spots about 2 m apart, same orientation, 3 samples each | Offsets differ by roughly the 30 degrees session 40 measured | Difference not reproducible, so session 40's 30 was noise |

**How to read it without a build.** The shipped app already computes the heading. It does not log it, so
either the reading is taken off the dial by eye (which is what session 40 did, and the reason its numbers are
weak), or a throwaway instrumented build logs it.

**Prefer the instrumented build**, because a number read off a dial by eye is exactly the evidence that
produced six non-converging constants. The change is one `logger.info` in the sensor reaction, and it is
reverted before anything merges.

**Acceptance.** A table of readings with timestamps, and a stated verdict: T1 holds, T1 fails, or the spread
is between 3 and 10 degrees and the answer is inconclusive.

**What each verdict does to the design:**

- **T1 holds:** rung 2 is a real compass correction, and the feature can offer "calibrate this spot once".
- **T1 fails:** rung 2 becomes a landmark note ("the qibla is 20 degrees right of your window"), which still
  works forever and needs no sensor. **The ladder stands either way**, which is why this is a cheap test
  rather than a risky one.

## Step P2. Settle T2: the sun, on the real phone

**Goal:** confirm that the solar computation running in the app agrees with the arithmetic already proven,
and that the interaction is usable by a person.

**Two parts, and the first is pure software.**

**P2a, the computation in the app.** Import the solar azimuth into the app, compute it for the phone's own
clock and position, and log it beside the value this session's scripts produce for the same instant and
place. They must agree to **under 0.1 degrees**. This tests the thing `P1` could not: that Metro resolves
`adhan`'s internals (R3 says it does, `resolve.js:512-527`), that Hermes's `Math` agrees with V8's on the
series, and that the phone's clock and coarse position are good enough.

**P2b, the interaction.** The owner's phone is already flat on a surface in the sun's absence, so this part
waits for daylight and is the owner's to judge, not mine to assert. What the prototype must produce is the
screen: a line the user rotates to match a real shadow, with the qibla drawn from it. **Nothing about it is
measurable without a person**, so the prototype's job is to make it exist and stop.

**Acceptance for P2a:** two numbers in a log line, agreeing to 0.1 degrees. That is the whole test.

## Step P3. Settle T3: the tile pipeline in Hermes on the A12

**Goal:** the numbers `P4` measured under V8, re-measured on the device.

**What to build.** The smallest possible screen: read ONE bundled tile, inflate it with `fflate`, decode it,
draw the capped 122 m view with the qibla ray, and log four timings.

| Measure | V8 figure to beat | Budget |
| --- | --- | --- |
| `fflate` inflate | 4.3 ms | Anything under 50 ms |
| MVT decode | 11.3 ms | Anything under 100 ms |
| SVG record, 49 paths | 92 ms predicted on the SD820 | Under 300 ms on the A12 |
| Retained memory | 146 KB per tile | Under 5 MB for the screen |

**Three traps this step must respect, each already paid for once:**

1. **`fflate` must be imported from its BROWSER entry** and proven under Metro, Jest AND tsc, because `P4`
   section 5 found those three disagree about deep package imports. Import it wrong and the app runs while
   `yarn validate` fails, or the reverse.
2. **The tile is bundled, not fetched.** A `require` of a binary asset goes through `expo-asset`, and whether
   Metro will bundle a `.mvt` or `.pmtiles` file at all is unproven. If it refuses, base64 in a `.ts` module
   is the fallback and costs a third more bytes.
3. **Never draw a long line to Makkah.** A 1 km ray at the great-circle initial bearing, per `P3`'s addendum,
   because a straight Mercator line is the rhumb line and is 14.84 degrees wrong in London.

**Acceptance:** four numbers in a log line, and a screenshot showing the drawn map with the ray.

## How the prototype is run, and how it leaves no trace

**Branch.** `proto/41-qibla` off `uat-2`, and **it is never merged.** The owner's standing rule is that
nothing lands without approval, and a prototype has nothing to land.

**Version.** No bump. A prototype commit is not a release, and `versionLockstep.test.ts` only checks the
three files agree, which they will if none changes.

**The hook will fight this**, and that is correct rather than a problem: the pre-commit hook runs the full
suite with 100% coverage, and prototype code has no tests. So **the prototype does not commit its app
changes at all.** It writes its findings to `PROTOTYPE-FINDINGS.md`, which is documentation and commits
cleanly, and the throwaway code is reverted with `git checkout --` once the numbers are recorded.

**This is the same discipline the performance campaign used** (`ai/AGENTS.md`: "this campaign NEVER commits,
so never `git checkout --` paths holding uncommitted work"). The warning in that line applies here: revert
only the specific files the prototype touched, from their own diff.

**The device.** iPhone XS, `00008020-0015585C22D2002E`, physical. A local Release build needs
`DEVELOPMENT_TEAM=9V3WAU9Z54` with `-allowProvisioningUpdates` (`ai/AGENTS.md`), and the version-sync ritual
requires `npx expo prebuild -p ios --no-install` BEFORE `expo run:ios`, in that order.

**The XS is a TEST DEVICE and Debug builds are preferred** (owner, 2026-09-30): 🐋  "the iPhone XS is a test
device, so feel free to delete, create any type of build you want... debug builds are usually faster and
easier to prototype on, quicker to reload, with hot reloading." So every prototype screen is Debug, and the
app may be deleted and reinstalled freely.

**One exception, and it matters:** the 10 degree test of `TEN-DEGREE-TEST.md` compares a new build against
the Release build already on the phone. **Comparing a Debug reading to a Release one would confound the
measurement with a configuration change**, so that one test builds Release. Every later prototype is Debug.

**A Debug timing is never quoted as a shipped number.** Say so in the findings, since Hermes runs unoptimised
there and `inlineRequires` changes evaluation order (`metro.config.js`).

**What is NOT in this prototype.** No MapLibre, no WebView, no Skia, no new native module, no tile
downloading, no permission changes, no notification changes, and nothing outside the Qibla sheet.

## The order, and why

1. **P1 first.** No build, cheapest, and its verdict changes what rung 2 is.
2. **P2a second.** Pure software, one log line, and it de-risks the rung the whole ladder leans on.
3. **P3 third.** The most code, and the least likely to fail in a way that changes the design, because `P4`
   already removed every Node dependency and measured the memory.

**Stop after any step whose verdict changes the design**, and report. The point of a prototype is to find
that out early, not to finish a list.

## What the prototype cannot tell anyone

Recorded here so its findings are not over-read:

- **It cannot validate the 6.2-degree map alignment estimate.** That needs users, not a phone. It remains the
  only load-bearing number in this row that is an estimate.
- **It cannot speak for the SD820.** Every timing it produces is A12. The 3T is the floor device and the
  30fps rule is written against it, so a green A12 result is necessary and not sufficient.
- **It cannot prove the sun interaction is usable.** Only the owner, in daylight, can say that.
