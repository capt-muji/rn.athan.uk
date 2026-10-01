# What this planning session measured itself

Every number below came out of a script in `scripts/probes/`, run in a scratch worktree at `uat-2` and
reproducible with `node scripts/probes/<name>.mjs`. Nothing here is cited; it is all computed.

The owner's symptom is what these probes were built to attack:

🐋  "if I shake the phone about it, if I close the app and I open it up again and I shake it about it,
recalibrate it, and I point both the phones flat in the same direction, sometimes it's 20 degrees off,
sometimes 30 degrees off. Sometimes 5 degrees, sometimes 10 degrees. There's a lot of inconsistencies."

So the question is not "which sensor is more accurate on average". It is **why the same phone, at the same
spot, in the same orientation, answers differently on each run, and what the app can honestly do about it.**

---

## 1. A spread gate does NOT work, and it fails in the most dangerous direction

The obvious idea: hold the compass blank until the heading stream is quiet, measuring quiet as the circular
standard deviation of a trailing window. Measured over six synthetic streams whose truth is known, 60 runs
each, window of 8 readings (`scripts/probes/probe-settle.mjs`):

| Stream | Gate 2 deg: settles at | Error WHEN it settles | Error of the FIRST reading |
| --- | --- | --- | --- |
| Converges fast, low jitter | sample 15.5 | **4.31** | 30.01 |
| Converges SLOWLY, low jitter | sample 7.5 | **27.22** | 29.97 |
| Converges fast, high jitter (indoors) | sample 275.5, 56 of 60 never settle | 1.82 | 30.68 |
| Stable 25 degree hard-iron bias | sample 7.0 | **24.99** | 24.74 |
| Wanders, no bias | never settles | refused to draw | 12.95 |
| Already settled on arrival | sample 7.0 | 0.29 | 0.80 |

**The slow-converging row is the defect.** A stream that is smoothly walking from 30 degrees of error toward
zero has a LOW spread at every instant, because consecutive readings are close together, so it passes a
2-degree gate at sample 7 while still 27.22 degrees wrong. A spread gate measures smoothness, and a
confidently wrong reading is perfectly smooth. Loosening the gate makes it worse, not better: at 8 degrees
the fast-converging stream settles at 17.99 degrees of error.

**This is the same shape as session 47's central lesson.** A heading that is SMOOTH is not a heading that is
RIGHT, and a gate built on smoothness inherits exactly that blindness.

## 2. A DRIFT gate does work, and it is a 36-fold improvement

Spread asks "are the readings close together". Drift asks "is the window's own mean still MOVING", which is
what a converging fusion has and a converged one does not. Implemented as a 16-reading window split into two
halves of 8, comparing the circular mean of the older half against the newer (`scripts/probes/probe-drift.mjs`):

| Stream | Settles at | Error of the window mean when settled | Error of the FIRST reading |
| --- | --- | --- | --- |
| Converges fast, low jitter | sample 30.9 | **mean 0.82, worst 1.64** | 29.91 |
| Converges SLOWLY, low jitter | sample 63.3 | mean 7.52, worst 10.96 | 30.10 |
| Converges fast, high jitter (indoors) | sample 93.5 | mean 1.63, worst 6.31 | 31.36 |
| Stable 25 degree hard-iron bias | sample 15.2 | **mean 25.03** | 25.11 |
| Wanders, no bias | **never settles, refused to draw** | refused to draw | 12.06 |
| Already settled on arrival | sample 15.1 | 0.25 | 0.91 |

Gate: trailing circular spread at or under 6 degrees AND half-to-half drift at or under 1 degree.

Two results matter. **The fast-converging stream goes from 29.91 degrees of error at its first reading to
0.82 at the moment the gate opens**, which is the owner's symptom and its remedy in one row. And **the
wandering stream is refused outright** rather than drawn badly, which is the owner's standing rule that the
app never shows a direction it knows to be wrong.

The slow-converging stream still opens at 7.52 degrees, which is the gate's honest limit: a fusion drifting
slower than 1 degree per 8 readings is indistinguishable from one that has arrived.

## 3. The decisive negative: NO gate reading the heading stream can see a stable bias

The hard-iron row above is the important one. A stable 25-degree bias passes the drift gate at sample 15 with
**25.03 degrees of error**, and it does so because it is genuinely quiet and genuinely not moving. Those two
properties ARE what "settled" means, so the gate is not failing: it is correctly reporting that the stream has
converged, on a stream that converged to the wrong answer.

**This is a proof, not a measurement.** Any function of the heading stream alone is blind to a constant added
to that stream. Catching it needs a second, independent quantity.

## 4. And the second quantity does NOT work either, which is the finding that matters most

Session 40 specified a field-magnitude and dip physics check as a trustworthy alternative to the platform's
own accuracy band, and never built it. The idea is sound in principle: a hard-iron offset is a fixed vector
added in the device frame, so it changes the field's total magnitude and its dip angle, both of which the
World Magnetic Model gives for the user's position.

Measured by sweeping an offset over every direction on the sphere and every phone heading, against gates of
10% on magnitude and 5 degrees on dip (`scripts/probes/probe-physics.mjs`):

| Offset (uT) | Worst heading error | Caught by magnitude | Caught by dip | Caught by EITHER | **Worst error that SURVIVES both** |
| --- | --- | --- | --- | --- | --- |
| 2 | 5.8 | 0% | 0% | 0% | **5.9** |
| 5 | 14.8 | 5% | 11% | 16% | **14.8** |
| 10 | 30.8 | 63% | 53% | 88% | **30.8** |
| 15 | 49.9 | 74% | 66% | 95% | **49.3** |
| 20 | 180.0 | 81% | 75% | 96% | **69.1** |

The last column is the verdict. **A 10 uT offset can swing the heading 30.8 degrees and pass both gates**,
which is precisely the owner's reported range. The check catches 88% of the SAMPLES at that size, and the 12%
it misses are not the harmless ones: they are the ones where the offset lies in the horizontal plane, which is
exactly where it does the most damage to a heading and the least to a magnitude.

### Why, and it generalises to every high-latitude user

A compass reads only the HORIZONTAL component of the field. The check measures the TOTAL
(`scripts/probes/probe-latitude.mjs`, World Magnetic Model values via NOAA, epoch 2026):

| Place | Dip | Total (uT) | Horizontal (uT) | Horizontal share | A 5 uT sideways offset costs | and moves the total by |
| --- | --- | --- | --- | --- | --- | --- |
| Singapore | -14.0 | 41.4 | 40.2 | 97% | 7.1 deg | 0.73% |
| Makkah | 35.9 | 41.6 | 33.7 | 81% | 8.4 deg | 0.72% |
| Cairo | 45.0 | 43.0 | 30.4 | 71% | 9.3 deg | 0.67% |
| New York | 64.5 | 50.6 | 21.8 | 43% | 12.9 deg | 0.49% |
| **London** | 66.5 | 49.0 | **19.5** | **40%** | **14.4 deg** | **0.52%** |
| Oslo | 73.0 | 50.6 | 14.8 | 29% | 18.7 deg | 0.49% |
| Tromso | 78.0 | 52.0 | 10.8 | 21% | 24.8 deg | 0.46% |

**At London only 40% of the field is horizontal**, so the quantity a compass actually uses is less than half
the quantity the check inspects. The offset adds LINEARLY to the horizontal component and in QUADRATURE to
the total, which is the whole asymmetry:

| Sideways offset (uT) | Heading error at London | Total magnitude moves by | Caught by a 10% gate? |
| --- | --- | --- | --- |
| 2 | 5.8 deg | 0.08% | NO |
| 5 | 14.4 deg | 0.52% | NO |
| 10 | 27.1 deg | 2.06% | NO |
| 15 | 37.5 deg | 4.58% | NO |
| 20 | **45.7 deg** | **8.01%** | **NO** |

A 20 uT offset swings the heading 45.7 degrees and moves the total magnitude 8%, under a 10% gate that has to
stay loose enough to admit real phones and real places. **The check is weakest exactly where the owner lives,
and it gets weaker toward the poles.**

So the field-physics lever is not merely unbuilt: it cannot do the job it was specified for. That removes the
cheaper of the two options session 46 was holding open, and it is recorded here so no later session rebuilds it.

## 5. A window counted in READINGS is unshippable, and the reason is the platform's own gate

The drift gate above counts 16 readings. Measured against the rates session 47 took off hardware
(`scripts/probes/probe-cost.mjs`):

| Reading rate | Floor, the window alone | Converging fast | Converging slowly |
| --- | --- | --- | --- |
| Phone still, 2 samples in 15s | **120.0s** | 223.9s | 482.6s |
| Phone turning slowly, 5 Hz | 3.2s | 6.3s | 13.0s |
| Phone turning briskly, 20 Hz | 0.8s | 1.5s | 3.3s |

**A still phone needs two minutes to fill the window.** `expo-location` suppresses any reading within 2
degrees of the last one on BOTH platforms, so a converged phone emits almost nothing, and the readings a
window does see are precisely the ones that moved:

| Jitter | Share of readings surviving the 2-degree gate |
| --- | --- |
| 0.5 deg | **0.1%** |
| 1 deg | 16.6% |
| 2 deg | 49.5% |
| 4 deg | 73.8% |
| 8 deg | 87.1% |

So the platform's gate feeds a settling window only its outliers, which is the opposite of what such a
window wants.

### The gate built on platform silence also fails

If the platform emits only on a 2-degree change, then silence ought to mean stillness, and a gate could
simply wait for it. Measured, it does not work (`scripts/probes/probe-timed.mjs`): at a 400ms quiet period
the gate opens after about 15 seconds, and at 800ms or longer **it never opens at all in any scenario**,
because 1 degree of jitter on a converged stream still re-triggers the 2-degree gate often enough that
silence never arrives.

## 6. The gate that DOES work: drift over a trailing TIME window that must be SPANNED

The shippable form keeps drift as the test, counts the window in milliseconds, and requires both a minimum
number of readings and that those readings actually SPAN the window
(`scripts/probes/probe-window-ms.mjs`, 50 runs per cell, against a simulated `expo-location` stream with
its real 2-degree and 50ms gate):

**Window 3000ms, at least 8 readings, half-to-half drift at or under 1.5 degrees:**

| Scenario | Opens at | Error when it opens | Error of the FIRST emission | Improvement |
| --- | --- | --- | --- | --- |
| Cold fusion, converges in 300ms | 3.43s | **mean 0.71, worst 1.05** | 30.05 | **42.1x** |
| Cold fusion, converges in 2s | 7.02s | mean 2.17, worst 3.13 | 29.98 | 13.8x |
| Cold fusion, converges in 8s | 10.66s | mean 9.70, worst 12.10 | 29.81 | 3.1x |
| Indoors, jittery, converges in 2s | 6.03s | **mean 3.52, worst 8.36** | 29.48 | 8.4x |
| Stable 25 degree bias | 2.76s | mean 25.09 | 24.91 | **1.0x** |
| Wanders 14 degrees, never settles | 3.08s | mean 1.66, worst 4.62 | 10.94 | 6.6x |

**THE SPAN REQUIREMENT IS LOAD-BEARING AND WAS FOUND BY A DEFECT IN THIS SESSION'S OWN FIRST GATE.** Without
it, a fast-moving stream fills the count in 400ms, and a drift measured over 400ms of a slow 8-second
convergence is under any useful threshold, so the gate opens at full error. The numbers say it plainly: the
8-second convergence opened at **29.18 degrees** of error without the span check and **9.70** with it, and
the indoor jittery case went from **22.19** to **3.52**. A gate that samples a window without checking the
window's own duration is measuring nothing.

## 7. THREE DEFECTS THE BREAK SCRIPT FOUND IN THIS PLAN'S OWN TESTS

The plan was written, the code was built, the suite went green at 50 of 50 and the full validation passed at
100% on all four measures. **Then the break script was run, and it caught three defects**, which is exactly
the case `PLANNER-BRIEF.md` requires it for.

### Defect 1, and it is the serious one: DELETING THE GATE ENTIRELY passed all 47 tests

The first break removes `if (!hasSettled(window, nowMs)) return;` and the suite stayed green.

**The cause is subtle and worth keeping.** Fixing the 18 tests that depended on one reading drawing the dial
meant teaching the shared `reportHeadings` helper to report a SETTLED window. Once it did, **every test in
the suite reports a settled window**, so no test could tell a gated compass from an ungated one. The suite
had been made to accommodate the gate and in doing so lost the ability to detect it.

The fix is three tests that drive the gate's refusal directly rather than through the helper:

| Test | Catches |
| --- | --- |
| `draws nothing on a single reading, however good it looks` | The gate being removed or the window check being weakened |
| `draws nothing while the stream is still converging, even though it is smooth` | A spread gate being substituted for the drift gate |
| `fires no haptic on a reading it refuses to draw` | The gate being moved below the haptic |

**The durable lesson:** when a change makes existing tests fail and the fix is to a shared HELPER, the helper
may now satisfy the new precondition everywhere, and the suite stops guarding it. Add a test that exercises
the refusal path directly, and prove it by deleting the feature.

### Defect 2: a break whose search text spanned a comment never applied

`BREAK NOT APPLIED` on the stale-half-window break. Two causes, both worth knowing:

- The search text had to reproduce the comment line above it **exactly**, which a hand-written break will not
  do reliably.
- `perl -pi` with `\Q...\E` cannot match a string holding an embedded newline, because it processes one line
  at a time. Python's `str.count` found the same text once, which is how the mismatch was diagnosed: the
  text was present and the tool could not match it.

The fix slurps the file with `perl -0pi` and targets the LAST of the two identical `samplesRef.current = []`
lines by pattern rather than by literal. **This is session 41's lesson a second time** (a break whose search
text a formatter can move stops testing anything), with a new cause: a break whose search text spans a
comment is just as fragile.

### Defect 3: the gate below the haptic survived

The sixth break moves the gate below the haptic, which would let a blind user feel a tap on a reading the
screen refuses to draw. It survived until `fires no haptic on a reading it refuses to draw` existed.

**That is the owner's accessibility requirement**, 🐋  "this is going to be useful for blind people", and
nothing in the suite was checking it.

**After all three fixes: 6 of 6 breaks caught, 50 of 50 tests passing, and the full suite at 184 suites,
4947 tests, 100% on all four measures.**

## 8. What this leaves

| Idea | Verdict |
| --- | --- |
| Spread gate on the heading stream | **Rejected, measured.** A smoothly wrong stream passes it at 27.22 degrees of error |
| Window counted in READINGS | **Rejected, measured.** 120s to open on a still phone, because the platform gates at 2 degrees |
| Gate waiting for platform SILENCE | **Rejected, measured.** Never opens at 800ms or longer: jitter re-triggers the gate forever |
| **Drift over a trailing TIME window that must be SPANNED** | **Works, and is the recommendation.** 30.05 to 0.71 degrees, 42.1x, and the indoor case 29.48 to 3.52 |
| Any gate on the heading stream | **Cannot see a stable bias**, by construction, measured at 1.0x improvement |
| Field magnitude and dip check | **Rejected, measured.** Misses 30.8 degrees at 10 uT, and is worst at high latitude |
| A tuned constant or stored per-place offset | **Forbidden** by the owner, and session 41 proved the error drifts with time at a fixed spot anyway |

The drift gate is worth having because it attacks the half of the symptom that IS attackable: a cold fusion
that has not converged, which is what an app restart produces every single time, and which is exactly what
the owner is doing when he closes the app, reopens it and reads a different answer. It does not pretend to
fix a biased field, and nothing measured here can.

**The honest division of the owner's symptom:**

| Half of the symptom | Cause | Can the app fix it? |
| --- | --- | --- |
| Different answer on each app restart | The fusion is cold and has not converged | **Yes**, measured 42.1x with the drift gate |
| A residual error that is there every run | Hard or soft iron in the room, or an uncalibrated magnetometer | **No.** Invisible to every gate measured, and the field check cannot bound it |
