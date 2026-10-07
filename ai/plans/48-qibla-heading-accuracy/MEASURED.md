# What this planning session measured itself

Every number below came out of a probe script run in a scratch worktree at `uat-2`. The probe scripts are
deleted here (recover: `git show f09456e4:ai/plans/48-qibla-heading-accuracy/scripts/probes/<name>.mjs`):
`probe-settle.mjs`, `probe-drift.mjs`, `probe-physics.mjs`, `probe-latitude.mjs`, `probe-cost.mjs`,
`probe-timed.mjs`, `probe-window-ms.mjs`. Nothing here is cited; it is all computed.

🐋  "if I shake the phone about it, if I close the app and I open it up again and I shake it about it,
recalibrate it, and I point both the phones flat in the same direction, sometimes it's 20 degrees off,
sometimes 30 degrees off. Sometimes 5 degrees, sometimes 10 degrees. There's a lot of inconsistencies."

So the question is not "which sensor is more accurate on average". It is **why the same phone, at the same
spot, in the same orientation, answers differently on each run, and what the app can honestly do about it.**

## 1. A spread gate fails in the most dangerous direction

Quiet measured as circular spread of a trailing 8-reading window; six synthetic streams, 60 runs each
(`probe-settle.mjs`):

| Stream | Gate 2 deg: settles at | Error WHEN it settles | Error of the FIRST reading |
| --- | --- | --- | --- |
| Converges fast, low jitter | sample 15.5 | **4.31** | 30.01 |
| Converges SLOWLY, low jitter | sample 7.5 | **27.22** | 29.97 |
| Converges fast, high jitter (indoors) | sample 275.5, 56 of 60 never settle | 1.82 | 30.68 |
| Stable 25 degree hard-iron bias | sample 7.0 | **24.99** | 24.74 |
| Wanders, no bias | never settles | refused to draw | 12.95 |
| Already settled on arrival | sample 7.0 | 0.29 | 0.80 |

**The slow-converging row is the defect:** a stream walking from 30 degrees of error toward zero is quiet
between consecutive readings, so a spread gate passes it at 27.22 degrees wrong. Loosening the gate makes it
worse (at 8 degrees, the fast stream settles at 17.99). Session 47's lesson again: a SMOOTH heading is not a
RIGHT one.

## 2. A DRIFT gate works

Drift asks "is the window's own mean still MOVING" — a converging fusion has it, a converged one does not.
16-reading window split into halves of 8, comparing circular means (`probe-drift.mjs`):

| Stream | Settles at | Error of the window mean when settled | Error of the FIRST reading |
| --- | --- | --- | --- |
| Converges fast, low jitter | sample 30.9 | **mean 0.82, worst 1.64** | 29.91 |
| Converges SLOWLY, low jitter | sample 63.3 | mean 7.52, worst 10.96 | 30.10 |
| Converges fast, high jitter (indoors) | sample 93.5 | mean 1.63, worst 6.31 | 31.36 |
| Stable 25 degree hard-iron bias | sample 15.2 | **mean 25.03** | 25.11 |
| Wanders, no bias | **never settles, refused to draw** | refused to draw | 12.06 |
| Already settled on arrival | sample 15.1 | 0.25 | 0.91 |

Gate: trailing spread at or under 6 degrees AND half-to-half drift at or under 1 degree. The gate's honest
limit: a fusion drifting slower than 1 degree per 8 readings is indistinguishable from one that has arrived
(7.52).

## 3. The decisive negative: NO gate reading the heading stream can see a stable bias

The stable 25-degree bias passes at **25.03 degrees of error** because it is genuinely quiet and genuinely
not moving — those properties ARE what "settled" means. **This is a proof, not a measurement:** any function
of the heading stream alone is blind to a constant added to that stream. Catching it needs a second,
independent quantity.

## 4. And the second quantity does NOT work either

Session 40's untried lever: a field-magnitude and dip physics check. Swept over every offset direction and
every phone heading against gates of 10% magnitude and 5 degrees dip (`probe-physics.mjs`):

| Offset (uT) | Worst heading error | Caught by magnitude | Caught by dip | Caught by EITHER | **Worst error that SURVIVES both** |
| --- | --- | --- | --- | --- | --- |
| 2 | 5.8 | 0% | 0% | 0% | **5.9** |
| 5 | 14.8 | 5% | 11% | 16% | **14.8** |
| 10 | 30.8 | 63% | 53% | 88% | **30.8** |
| 15 | 49.9 | 74% | 66% | 95% | **49.3** |
| 20 | 180.0 | 81% | 75% | 96% | **69.1** |

A 10 uT offset swings the heading **30.8 degrees** and passes both gates — the owner's reported range. The
misses are the offsets lying in the horizontal plane, where they do the most heading damage.

**Why, and it generalises:** a compass reads only the HORIZONTAL field. World Magnetic Model values, NOAA,
epoch 2026 (`probe-latitude.mjs`):

| Place | Dip | Total (uT) | Horizontal (uT) | Horizontal share | A 5 uT sideways offset costs | and moves the total by |
| --- | --- | --- | --- | --- | --- | --- |
| Singapore | -14.0 | 41.4 | 40.2 | 97% | 7.1 deg | 0.73% |
| Makkah | 35.9 | 41.6 | 33.7 | 81% | 8.4 deg | 0.72% |
| Cairo | 45.0 | 43.0 | 30.4 | 71% | 9.3 deg | 0.67% |
| New York | 64.5 | 50.6 | 21.8 | 43% | 12.9 deg | 0.49% |
| **London** | 66.5 | 49.0 | **19.5** | **40%** | **14.4 deg** | **0.52%** |
| Oslo | 73.0 | 50.6 | 14.8 | 29% | 18.7 deg | 0.49% |
| Tromso | 78.0 | 52.0 | 10.8 | 21% | 24.8 deg | 0.46% |

The offset adds LINEARLY to the horizontal component and in QUADRATURE to the total (`probe-latitude.mjs`):

| Sideways offset (uT) | Heading error at London | Total magnitude moves by | Caught by a 10% gate? |
| --- | --- | --- | --- |
| 2 | 5.8 deg | 0.08% | NO |
| 5 | 14.4 deg | 0.52% | NO |
| 10 | 27.1 deg | 2.06% | NO |
| 15 | 37.5 deg | 4.58% | NO |
| 20 | **45.7 deg** | **8.01%** | **NO** |

**The check is weakest exactly where the owner lives, and weaker toward the poles.** It cannot do the job it
was specified for; recorded so no later session rebuilds it.

## 5. A window counted in READINGS is unshippable

Against the rates session 47 took off hardware (`probe-cost.mjs`):

| Reading rate | Floor, the window alone | Converging fast | Converging slowly |
| --- | --- | --- | --- |
| Phone still, 2 samples in 15s | **120.0s** | 223.9s | 482.6s |
| Phone turning slowly, 5 Hz | 3.2s | 6.3s | 13.0s |
| Phone turning briskly, 20 Hz | 0.8s | 1.5s | 3.3s |

`expo-location` suppresses any reading within 2 degrees of the last one on BOTH platforms, so a converged
phone emits almost nothing — the readings a window sees are precisely the ones that moved:

| Jitter | Share of readings surviving the 2-degree gate |
| --- | --- |
| 0.5 deg | **0.1%** |
| 1 deg | 16.6% |
| 2 deg | 49.5% |
| 4 deg | 73.8% |
| 8 deg | 87.1% |

**The platform-silence gate fails too** (`probe-timed.mjs`): at a 400ms quiet period it opens after ~15s; at
800ms or longer **it never opens at all in any scenario** — 1 degree of jitter re-triggers the 2-degree gate
often enough that silence never arrives.

## 6. The gate that works: drift over a trailing TIME window that must be SPANNED

50 runs per cell against a simulated `expo-location` stream with its real 2-degree and 50ms gate
(`probe-window-ms.mjs`). Window 3000ms, at least 8 readings, half-to-half drift at or under 1.5 degrees:

| Scenario | Opens at | Error when it opens | Error of the FIRST emission | Improvement |
| --- | --- | --- | --- | --- |
| Cold fusion, converges in 300ms | 3.43s | **mean 0.71, worst 1.05** | 30.05 | **42.1x** |
| Cold fusion, converges in 2s | 7.02s | mean 2.17, worst 3.13 | 29.98 | 13.8x |
| Cold fusion, converges in 8s | 10.66s | mean 9.70, worst 12.10 | 29.81 | 3.1x |
| Indoors, jittery, converges in 2s | 6.03s | **mean 3.52, worst 8.36** | 29.48 | 8.4x |
| Stable 25 degree bias | 2.76s | mean 25.09 | 24.91 | **1.0x** |
| Wanders 14 degrees, never settles | 3.08s | mean 1.66, worst 4.62 | 10.94 | 6.6x |

**THE SPAN REQUIREMENT IS LOAD-BEARING AND WAS FOUND BY A DEFECT IN THIS SESSION'S OWN FIRST GATE.** Without
it a fast stream fills the count in 400ms and a drift measured over 400ms of a slow convergence is under any
useful threshold: the 8-second convergence opened at **29.18** without the span check and **9.70** with it;
the indoor jittery case went **22.19 → 3.52**. A gate that samples a window without checking the window's own
duration is measuring nothing.

## 7. Three defects the break script found in this plan's own tests

Written, built, suite green at 50/50, full validation 100% — then the break script caught three defects.

**Defect 1, the serious one: DELETING THE GATE ENTIRELY passed all 47 tests.** Fixing the 18 tests that
depended on one reading drawing the dial meant teaching the shared `reportHeadings` helper to report a
SETTLED window — once it did, **every test reported a settled window**, so no test could tell a gated
compass from an ungated one. Fix: three tests driving the refusal directly — `draws nothing on a single
reading, however good it looks`, `draws nothing while the stream is still converging, even though it is
smooth`, `fires no haptic on a reading it refuses to draw`. Durable lesson: when the fix to failing tests is
a shared HELPER, the helper may satisfy the new precondition everywhere and the suite stops guarding it; add
a test that exercises the refusal path and prove it by deleting the feature.

**Defect 2: a break whose search text spanned a comment never applied.** `perl -pi` with `\Q...\E` cannot
match a string holding an embedded newline (it processes line by line); Python's `str.count` found the text
once, proving the mismatch was the tool's. Fix: slurp with `perl -0pi`, target by pattern not literal.
Session 41's lesson a second time, new cause.

**Defect 3: the gate below the haptic survived** until `fires no haptic on a reading it refuses to draw`
existed — the owner's accessibility requirement, 🐋  "this is going to be useful for blind people", which
nothing in the suite was checking. After all three fixes: 6 of 6 caught, 50/50, full suite 184 suites, 4947
tests, 100% on four measures.

## 8. Verdict

| Idea | Verdict |
| --- | --- |
| Spread gate | **Rejected, measured.** Passes a smoothly wrong stream at 27.22 degrees |
| Window counted in READINGS | **Rejected.** 120s on a still phone (platform gates at 2 degrees) |
| Gate waiting for SILENCE | **Rejected.** Never opens at 800ms or longer |
| **Drift over a trailing TIME window, SPANNED** | **Works — the recommendation.** 30.05→0.71, 42.1x; indoor 29.48→3.52 |
| Any gate on the heading stream | **Cannot see a stable bias**, by construction; measured 1.0x |
| Field magnitude and dip check | **Rejected.** Misses 30.8 degrees at 10 uT; worst at high latitude |
| Tuned constant / stored offset | **Forbidden**, and the error drifts with time anyway (session 41) |

The honest division: a cold fusion that has not converged — every app restart — **is attackable, 42.1x**; a
residual from iron in the room is **invisible to every gate measured, and the field check cannot bound it**.
