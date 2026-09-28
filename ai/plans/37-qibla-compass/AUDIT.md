# Audit: session 37, the research range

Audited at `77eb52fe`, the tip of `uat-2`, covering the 19 unpushed commits `a626ae8b` to `77eb52fe`
(1.29.76 to 1.29.94) and their merges.

This is a section 2, item 2 audit: no row was EXECUTED. The range is the research half of row 37, which is
still PLANNING, so the verdict rules apply to what those commits actually did and the row's status is left
alone.

## 1. What the range contains

`git diff --name-only origin/uat-2..uat-2` lists 17 files and **not one line of application code**:

| Files | What |
| --- | --- |
| `ai/plans/37-qibla-compass/RESEARCH.md` | 1,803 lines, the research record |
| `ai/plans/37-qibla-compass/agent-reports/*.md` (13) | the reports its sections cite |
| `ai/plans/README.md` | rows 37 to 39 queued, row 36 cancelled |
| `app.json`, `package.json` | the version bumps |

So there is no step commit, no break script and no device claim to check. What can be audited is whether
the research is true, because the plan is about to be built on it.

## 2. Checked, with the evidence

| Check | Result |
| --- | --- |
| Versions in sequence, no gaps | 1.29.76 through 1.29.94, 19 consecutive patches |
| `app.json` and `package.json` agree | both `1.29.94` |
| Commit messages carry their version | every one starts `1.29.<n> - docs: ` |
| Working tree clean | `git status --porcelain` empty |
| Full suite in a scratch worktree | **177 suites, 4784 passed, 2 skipped, 100% statements / branches / functions / lines** |
| No app code touched | confirmed by the diff above |
| No owner rule bent | no visual change, no prayer time, no release file, no `uat`, no EAS, no API key, no ignore comment |
| `expo-location` NOT installed | `package.json` unchanged, matching the research's own section 8.5 |

## 3. The research's own numbers, recomputed independently

Every load-bearing measurement was recomputed in this audit from the formula alone, not read back from the
file. All figures reproduce.

| Claim | Research | Recomputed |
| --- | --- | --- |
| Eight-city bearing table, worst deviation | 0.05° | **0.05°** (Cape Town), all eight match |
| Bearing error from 10 km of position error | 0.5° | **0.48°** |
| 50 km | 2.4° | **2.40°** |
| 200 km | 9.7° | **9.71°** |
| Jeddah, 50 km error | ~49° | **49.4°** |
| Great circle vs rhumb, Los Angeles | 71° | **71.3°** |
| Great circle vs rhumb, New York | 43° | **42.8°** |
| Invariant 6, from 20°E on the Kaaba's parallel | 86.3477° | **86.3477°** |
| Invariant 6, from 50°E | 271.8622° | **271.8622°** |
| Due north of the Kaaba on its meridian | 180 | **180.000000** |
| Due south | 0 | **0.000000** |
| North pole | 140.1738° | **140.1735°** (at 89.999°, the limit value agrees) |
| Mirror symmetry on the Kaaba's parallel | exact | **exact**, the pair sums to 360.0000 |
| Kaaba candidate spread across 8 cities | 0.0037° | **0.0037°** |

The formula, the error budget, the position tolerance and the thirteen invariants are therefore sound, and
invariant 6 does what the research claims: it separates a great-circle implementation from a rhumb-line or
flat-map one by 3.65° at the nearest sample.

## 4. Findings

### 4.1 The headline survey fixture does not record its own coordinates (FIXED in the plan)

Section 22.1 calls this "the strongest single fact this session has produced": the computed bearing for the
Universiti Teknologi Malaysia campus matches a published theodolite survey of **292.9622°** to **0.012°**,
giving a computed **292.9742°**.

Recomputing from the campus coordinates `1.5595 N, 103.6381 E` gives **292.9616°**, which is 0.0006° from
the theodolite value, not 0.012°. Both are far inside the 0.05° bound the fixture will use, so **the
conclusion stands and the feature is unaffected**. The discrepancy is the input: the research does not
record which coordinates produced 292.9742, and a fixture whose input is unrecorded cannot be reproduced by
the executor.

**Fix, carried into the plan:** the surveyed fixture carries its exact coordinates beside its expected
value, and the assertion is written against the **published theodolite figure** (292.9622°) rather than
against either recomputation, because the survey is the ground truth and our own arithmetic is the thing
under test.

### 4.2 No finding against any commit

Every commit in the range is a docs commit that does what its message says, at a correct version, with no
app code and no owner rule bent.

## 5. Verdict

**PASS**, with the section 4.1 fix carried into `PLAN.md` rather than into a code commit, because the range
contains no code.

The row stays **PLANNING**: this audit closes the research range, and the last thing audited is
`77eb52fe`. `uat-2` is NOT pushed, on the owner's instruction of 2026-09-28 that nothing lands until the
execution and its audit are finished and approved.
