# Audit: session 37, the execution range

Audited 2026-09-29 on `feat/37-qibla-compass`, covering 1.29.95 to 1.29.110 and their merges, in a scratch
worktree at `~/athan-device-sweep/worktrees/audit-37`.

`AUDIT.md` holds the earlier audits: the research range, and the execution audit of steps 1 to 4. This file
covers steps 5 and 6, which landed after that, and rechecks the whole range as one.

## 1. Checked

| Check | Command or file | Result |
| --- | --- | --- |
| Full suite, scratch worktree | `yarn validate` | **182 suites, 4879 tests, 100% statements / branches / functions / lines** |
| Break script, scratch worktree | `bash ai/plans/37-qibla-compass/scripts/break-step-5.sh` | **25 of 25 caught**, `ALL AS EXPECTED: 1` |
| Break script has no absolute paths | `grep -n /Users/muji/repos/rn.athan.uk scripts/*.sh` | nothing |
| `tsc --noEmit` | direct | clean |
| Biome | `biome check . --error-on-warnings` | clean |
| Dead code | `python3 scripts/find-unused-exports.py` | only the 5 allow-listed symbols; `KAABA` carries its reason |
| No ignore comments | grep over the session's files | none |
| No release file, no EAS, no `uat` | diff over the range | none touched |
| Versions in sequence | `git log` over the range | 1.29.95 to 1.29.110, one gap at 106, see finding 1 |
| `app.json` and `package.json` agree | both files | both 1.29.111 after the fixes |
| Device evidence | `~/athan-device-sweep/session37/` | 8 screenshots and the latency capture, all read |
| Phone left as the plan says | `settings get global auto_time`, `dumpsys alarm` | auto_time 1, the owner's alarm still armed, clock never changed |

The maths was re-derived rather than read back: the face rotates by `-heading`, so a phone pointing east puts
north on the left and the Kaaba marker 29 degrees right of the mark, which is correct for a London bearing of 119.

## 2. Findings

### 2.1 Two versions name two different commits each (finding 1, NOT FIXED, and it cannot be)

`uat-2` and this branch allocated **1.29.107 and 1.29.108 independently**, because a second session was
planning row 39 in the main checkout at the same time and took the next patch from the same counter.

| Version | On `uat-2` | On this branch |
| --- | --- | --- |
| 1.29.107 | `a57a9d7b` docs: which 20 languages | `376c7545` feat(qibla): the compass face |
| 1.29.108 | `7601b789` docs: both columns fit | `c0454a36` fix(qibla): the labels read upright |

**Not fixable without rewriting history, which the brief forbids.** Both are docs-versus-code pairs, so no
user-visible behaviour is ambiguous and `versionLockstep.test.ts` still passes, since it pins the three files to
each other and never requires a version to be unique. The merge is recorded here so a later reader does not
mistake it for a mis-stamped release. The audit's own fixes continue from **1.29.111**, above both.

**The durable lesson, and it is the useful part: a version counter read from the working tree is not safe while
two sessions run.** Take it from `origin/uat-2` at the moment of the bump, or serialise the sessions.

### 2.2 The phone's calibration verdict was discarded (finding 2, FIXED in 1.29.111)

**This is a real defect against the plan's own governing principle**, which is the one rule the screen was
designed around:

> The compass is therefore honest about the needle, never about the number.

Every heading event `expo-location` emits carries an `accuracy` field, on **both** platforms: iOS from Core
Location, Android from `onAccuracyChanged` into `mAccuracy`, read out of the module source rather than assumed.
Its bands are documented as `3` under 20 degrees of uncertainty, `2` under 35, `1` under 50, `0` worse than 50.

`watchHeading` read `trueHeading` out of that event and **threw the calibration away**, so the dial drew a
confident needle while the phone was reporting the heading might be more than 50 degrees out. The screen said
only `Hold the phone flat for an accurate reading`, whatever the sensor thought.

**This is the likely cause of the owner's report that the compass "is not very accurate right now."** An
uncalibrated magnetometer is the common case rather than the edge: the plan's own research cites indoor heading
RMSE at about 17.4 degrees even with a purpose-built algorithm, and most prayer happens indoors.

**Fix:** `watchHeading` now reports a `HeadingReading` carrying `heading` and `calibrated`, with the threshold at
`accuracy > 1`, the iOS band for better than 35 degrees. When the phone reports poor calibration the hint becomes
`Move the phone in a figure of eight a few times, away from metal and magnets`, which names the condition and
bounds the effort, following Google Maps' own wording rather than apologising for the reading.

Four `it.each` rows pin the threshold at every band, and two more pin the copy in both states.

### 2.3 A stale warning survived a reopen (found in my own review of the fix, FIXED in the same commit)

`handlePresent` reset the reading but not the calibration, so a warning from the last time the sheet was open
survived into the next one, describing a sensor state nobody was measuring. Its red was proven by removing the
reset.

### 2.4 No finding against steps 1 to 4, or against any commit in the range

Every commit does what its message says, at a correct version, with no owner rule bent. The two defects the
executor found on the simulator and fixed itself (labels counter-rotated, the mark covering north) were checked:
both fixes are correct, both carry a test that fails without them, and both are recorded in `LOG.md` as
`EXECUTOR-BRIEF.md` section 4 item 8 requires.

## 3. After the fixes

| Check | Result |
| --- | --- |
| Break script | **28 of 28 caught**, `ALL AS EXPECTED: 1` |
| Full suite | 182 suites, 100% on all four measures |

## 4. Verdict

**PASS**, with finding 1 recorded as unfixable and findings 2 and 3 fixed in this session.

The row is **DONE**. Nothing merges into `uat-2` until the owner approves, which is their standing instruction
of 2026-09-28.
