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

## 5. The execution audit, 2026-09-29

Audited on `feat/37-qibla-compass`, covering 1.29.95 to 1.29.102. Nothing is merged to `uat-2`, on the
owner's instruction.

### 5.1 Checked

| Check | Result |
| --- | --- |
| Full suite | **180 suites, 4851 tests, 100% statements / branches / functions / lines** |
| Break script | **14 of 14 caught**, `ALL AS EXPECTED: 1` |
| `tsc --noEmit` | clean |
| Biome, on the 18 changed files | clean |
| Dead code (`find-unused-exports.py`) | no new orphan; `KAABA` allow-listed with its reason |
| Versions | 1.29.95 to 1.29.102, consecutive, all three files in step |
| iPhone XS simulator | built, installed, launched, driven to the bearing |
| Owner rules | no visual change outside the feature, no prayer time touched, no release file, no `uat`, no EAS, no API key, no ignore comment, no skipped hook |

### 5.2 Device evidence

Verified on the booted iPhone XS replica with the simulator location set to London:

1. The Settings sheet shows a **Qibla** row directly beneath **Change athan**, with the compass needle in the
   same purple circle.
2. Tapping it raises the iOS permission dialog carrying the exact purpose string:
   *"Your location is used to point the compass toward the Kaaba. It never leaves your device."*
3. Granting it opens the Qibla sheet, titled **Qibla** / *The direction of prayer*.
4. The card reads **`119° from north`**, against the 118.99° this session computed independently from the
   great-circle formula. No error overlay.

### 5.3 Findings, all fixed in this session

| # | Finding | Severity | Fix |
| --- | --- | --- | --- |
| 1 | `onFirstPresent` latches on a ref, so the sensor armed once and never again: the needle would be dead on every later open | **Real defect** | `Sheet` gained `onPresent`, which fires on every open. 1.29.98 |
| 2 | A live position read throws `LocationUnavailable` with no fix, leaving the sheet on "Finding your position" forever | **Real defect**, found on the simulator | Falls back to the last known fix, and says so when there is none. 1.29.100 |
| 3 | `handlePresent` overwrote the stop function without calling it, stranding the previous stream | **Real defect** | The release runs at the top of every present as well as on dismiss. 1.29.101 |
| 4 | Handled failures logged at `error`, raising a LogBox overlay in development | Minor | All four calls log at `warn` with structured data. 1.29.100, 1.29.102 |
| 5 | The component's doc comment had drifted above the `Reading` type | Minor | Moved. 1.29.101 |
| 6 | The card's corner radius was a literal where the repo has a token | Minor | `RADIUS.xxl`. 1.29.101 |
| 7 | The break script backed files up by basename, and `shared/qibla.ts` sits beside `device/qibla.ts`: the first run corrupted the maths file and reported six breaks as NOT APPLIED | **Tooling defect** | Keyed on the full path. Recorded as the session's durable lesson |
| 8 | `expo-location` forces `ACCESS_FINE_LOCATION` into the manifest and hardcodes it in the runtime request, so the owner's coarse-only decision is not reachable by configuration | **Open**, needs the owner | Researched in full in `ANDROID-PERMISSIONS.md`; the remedy is a fourth config plugin |

### 5.4 What is NOT done

- **The dial.** This session ships the bearing as text. The compass face, its ticks and the rotating needle
  are the next step, and the 60fps architecture they must follow is specified in `PLAN.md` section 4.1.
- **Android.** Not built or run. The 3T proof is the owner's, and `ANDROID-PERMISSIONS.md` finding 8 must be
  settled before an Android build is meaningful.
- **The frame audit.** It needs the dial, so it waits for that step.

## 6. Verdict

**PASS** for the research range, with the section 4.1 fix carried into `PLAN.md` rather than into a code
commit, because that range contains no code.

**PASS** for the executed work, with all seven code findings fixed in this session and the eighth
(`ANDROID-PERMISSIONS.md`) put to the owner, because it changes a decision they already took.

The row is **IN PROGRESS**: the bearing, the gate and the sheet ship and are proven on the simulator; the
dial and the Android proof remain. `uat-2` is NOT pushed and nothing is merged into it, on the owner's
instruction of 2026-09-28 that nothing lands until execution and audit are finished and they have approved.
Everything lives on `feat/37-qibla-compass`.
