# Prototype findings

Running `PROTOTYPE-PLAN.md`. Written as each step reports, newest last. Nothing here is merged into the app;
every code change is reverted from its own diff once its number is recorded.

---

## Step P2a, part 1: the import route is decided, and NOT the way R3 recommended

**Question.** `P4` section 5 found that Metro, Jest and tsc disagree about a deep import into `adhan`'s
internals: Metro resolves `adhan/lib/cjs/SolarTime.js`, Jest and tsc refuse it. R3 measured a public-API-only
route as the alternative at "0.288 degrees mean, 1.350 worst" and called it the fallback. **If the public
route is good enough, the disagreement disappears entirely and no config change is needed.**

So I rebuilt the public route from scratch and swept it far wider than R3 did: 10 cities, all 12 months,
seven times a day, keeping only samples inside the design's own 5 to 65 degree altitude gate.

**Result: the public route is NOT good enough, and the reason is a genuine singularity rather than a bug.**

| Measure | Value |
| --- | --- |
| Samples in the gate | 419 |
| Mean error | **0.484 deg** |
| **Worst error** | **7.847 deg**, at Singapore in January |

R3's 1.350 worst came from a 5-city sample that happened to miss the failure. **Mine found it by adding
Singapore, Lagos and Reykjavik**, which is the fixture-blind-spot rule catching a real defect for the second
time in this session.

### The root cause, measured

The public route recovers the sun's declination from the length of the day, because `PrayerTimes` gives
`sunrise` and `sunset` but not declination. **How well that works depends entirely on latitude**, because
near the equator the day length barely changes across the year:

| Place | Latitude | How much the half-day angle moves across a whole year |
| --- | --- | --- |
| **Singapore** | 1.35 | **1.17 deg** |
| Jakarta | -6.21 | 5.41 deg |
| Lagos | 6.52 | 5.68 deg |
| Karachi | 24.86 | 23.18 deg |
| London | 51.51 | 66.12 deg |

**`adhan` rounds its prayer times to the whole minute.** So near the equator the solve is reading declination
out of rounding noise. Measured directly, the cost of one minute of rounding:

| Place | Declination error from 1 minute of rounding |
| --- | --- |
| **Singapore** | **9.07 deg** |
| Lagos | 2.17 deg |
| Karachi | 0.54 deg |
| London | 0.20 deg |

**That is structural and no amount of care fixes it.** Inverting a function that is flat is ill-conditioned,
and the flatness is astronomy rather than an implementation choice.

**Decision: use the deep import, and treat the three-resolver disagreement as a config item rather than a
risk.** R3 already measured the remedy as one Jest config line, and `tsc` needs the same kind of declaration.
The public route is documented here as rejected **with its failure latitude named**, so nobody revisits it on
the strength of a temperate-latitude test.

### Two mistakes I made getting here, both recorded because they are the interesting part

1. **My first public-route implementation was 21 degrees wrong on average**, far worse than R3's figure. The
   cause was a **bisection direction assumed rather than tested**: the day-length function increases with
   declination in the northern hemisphere and decreases in the southern, and I had hardcoded one direction.
   It failed on exactly the cases that reveal it, Jakarta and Sydney, showing a declination of -23.5 where
   the truth was +23.3, a perfect sign flip. Fixed by scanning for the sign change instead of assuming it.
2. **Even after that fix the mean was 6.2 degrees**, because the equatorial cases were still being solved out
   of noise and one produced a 60.9-degree error. Only separating "is this a bug or a singularity" gave the
   real answer. **A single fix that improves a number from 21 to 6 looks like progress and was still wrong.**

**The generalisable lesson, which belongs in the plan:** a monotonic solve whose direction depends on a sign
must scan for its bracket, never assume it, and any inversion of a nearly-flat function needs its
conditioning measured before its accuracy is quoted.

---

## Still to run

| Step | Theory | Blocked on |
| --- | --- | --- |
| P1 | The magnetic offset is a repeatable property of a spot | Nothing. Needs the phone still and an instrumented build |
| P2a part 2 | The solar azimuth agrees on-device to 0.1 deg | The instrumented build |
| P2b | The shadow interaction is usable | Daylight, and the owner's judgement |
| P3 | The tile pipeline holds its timings in Hermes on the A12 | A prototype screen |
