# Audit: Session 6b. An alert sheet change is all or nothing, in both directions (finding 81)

| Field | Value |
| --- | --- |
| Audited by | Claude Opus 5, audit session, 2026-09-16 |
| Plan | `ai/plans/06b-alert-all-or-nothing/PLAN.md`, executed by GLM 5.3 |
| Range audited | `origin/uat-2..uat-2`: `baa4fc7f`, `5932e9a8`, `e99d7099`, `8dde8df3`, `2f340358`, `34b1452e` |
| Scratch worktree | `~/athan-device-sweep/worktrees/audit-6b`, detached at `34b1452e`, `node_modules` symlinked, removed at the end |
| Verdict | **PASS**, after two records findings the audit fixed itself in `1.27.192` |

## 1. What was checked

### 1.1 The range

`git log --oneline origin/uat-2..uat-2`, run at `34b1452e` before this audit added commits of its own, lists six
commits and nothing else: two step commits with their merges, the
executed docs commit and its merge. Every one belongs to row 2 of `ai/plans/README.md`. The one docs commit,
`2f340358`, was reread in full: the `AUDIT-FINDINGS.md` append, the `LOG.md` append, the section 6 ticks, the row
moving to EXECUTED and the version bump, and nothing else.

`git diff --stat origin/uat-2..uat-2` touches 21 files, all of them named by the plan's step 3 file lists plus the
plan folder, `ai/plans/README.md`, `ai/features/uat-2/AUDIT-FINDINGS.md` and the two version files.

### 1.2 Plan against commits

**The diffs equal the plan's saved files exactly.** Both steps hand the executor finished files, so each was compared
by sha256, not by eye:

- step 1, `git show baa4fc7f:<path>` against `files/step1/<path>.txt`: all **7** files byte-identical;
- step 2, `git show e99d7099:<path>` against `files/step2/<path>.txt`: all **12** files byte-identical.

No extra file is in either commit, and no file the plan lists is missing.

**Commit messages.** Both step messages were extracted from `steps/1-native-call-timeout.md` and
`steps/2-all-or-nothing.md` and compared character for character with `git log -1 --format=%B`, with `<VERSION>`
substituted: both MATCH. The docs commit's message matches section 8.3. All three merge messages match the plan's.

**Versions in sequence.** `1.27.189`, `1.27.190`, `1.27.191`; `app.json` and `package.json` agree at every commit.

**The row.** `baa4fc7f` moved row 2 from READY to IN PROGRESS, `2f340358` from IN PROGRESS to EXECUTED. Nothing else
in `ai/plans/README.md` changed.

**The code was read in full,** not only diffed: `shared/notifications.ts`, `device/notifications.ts`,
`stores/notifications.ts` (all 1852 lines), `stores/database.ts`'s two new functions and `hooks/useNotification.ts`.
Every contract in the plan's section 5.3 is there under the name the plan gives, with the log-line text the plan
gives. The four interleavings of section 5.4 were traced by hand against the code and then against
`stores/__tests__/notificationAlertCommit.test.ts`, which pins each one.

One thing the trace turned up and the code is right about: `commitPrayerAlertChange` does NOT check the generation on
its success path, so a first commit overtaken by a second still does its own scheduling work. The plan's decision 10
reads as though it should touch nothing, but section 5.4's own sentence and the suite's
"two changes to the same prayer, one behind the other" block both pin what the code does: the older change's work is
harmless because the newer change's pass follows it inside the same queue and the final armed set is the newer one,
which the test asserts. Not a finding.

### 1.3 The tests still guard

`grep -n /Users/muji/repos/rn.athan.uk` on both break scripts prints only their own line-3 comment; every path they
act on is relative. Both were run from the scratch worktree's root:

- `breaks-step2.sh`: `breaks caught: 17 of 17`, `ALL AS EXPECTED: 1`;
- `breaks-step1.sh`: `breaks caught: 11 of 11`, `ALL AS EXPECTED: 1`;
- `git status --porcelain` after both: empty, so every break restored its file.

**The red check was rerun for step 2, the riskier step**, by reverting its four production files in the worktree
(`git checkout baa4fc7f -- device/notifications.ts stores/notifications.ts stores/database.ts hooks/useNotification.ts`)
and running the step's own jest command. It reproduced the plan's predicted red exactly:

```
Test Suites: 8 failed, 8 total
Tests:       74 failed, 185 passed, 259 total
```

and, restored, the predicted green: `Tests: 259 passed, 259 total`.

### 1.4 The whole suite

`yarn validate` in the scratch worktree:

```
Statements   : 100% ( 3952/3952 )
Branches     : 100% ( 1699/1699 )
Functions    : 100% ( 824/824 )
Lines        : 100% ( 3551/3551 )
Test Suites: 158 passed, 158 total
Tests:       2 skipped, 4499 passed, 4501 total
```

The two skips are `shared/__tests__/audioMatrix.test.ts`'s bundle checks, which skip wherever `android/` and `ios/`
are absent, as they are in a worktree. That is the plan's section 10.1 row for it, and it is why the main checkout's
hook reported `4501 passed, 4501 total`.

### 1.5 Reviews

`LOG.md` records a `Code Reviewer` (GLM 5.3) verdict of **merge** in one round for each of the three commits, and
**no fix applied** in any round. There is therefore no `EXECUTOR-BRIEF.md` section 4, item 8 fix to judge, and no
unrecorded fix: both step trees are byte-identical to the plan's saved files, which a silent fix could not be. The
docs commit has no saved-file baseline, and is covered instead by section 1.1, which rereads it in full, and by its
message matching section 8.3.

### 1.6 Device evidence

Every claim in the records text was checked against a file under `~/athan-device-sweep/session6b/`, by rerunning the
plan's own scripts on the saved dumps and by reading the logcats:

| Claim | Proof |
| --- | --- |
| Isha armed for no day when saved Off | `isha_alarms.py … alarms-prod-cold.txt off 5` → `ISHA ALARMS AS EXPECTED (off): 3 app alarms` |
| Turning Isha on Silent armed exactly its future athan and reminder instants | `… alarms-isha-on.txt on 5` → `ISHA ALARMS AS EXPECTED (on): 7 app alarms` |
| Turning it off cancelled exactly those and left the other alarms | `… alarms-isha-off.txt off 5` → `ISHA ALARMS AS EXPECTED (off): 3 app alarms` |
| The forced refusal put the whole change back | `refusal_proof.py … refuse-off.logcat.txt` → `REFUSAL PROOF AS EXPECTED` |
| The forced hang was given up on and the change put back | `hang-off2.logcat.txt` holds all four line kinds, in order: the mark at 16:37:31.489 (generation 1), `FORCED HANG` at .500, `did not answer in 15000 ms` at 16:38:13.294, `putting the prayer back` at .295, and the gate reopen at .426 |
| The first hang pass proves nothing either way | `hang-off.logcat.txt` holds none of the four line kinds — 0 matches, exactly as `LOG.md` says |
| Neither throwaway build was committed | `git grep 'FORCED REFUSAL\|FORCED HANG' -- ':(exclude)ai/plans'` prints nothing |

The phone was then read live, read-only: `get-state` `device`, `auto_time` `1`, `dumpsys window policy` `showing=true`
count `0`, `stay_on_while_plugged_in` `7`, `versionName=1.27.190`, and `mCurrentFocus` is
`com.mugtaba.athan/.MainActivity`. It is unlocked with Athan on screen, on the mock build of the last code commit, and
automatic time was never moved. The live alarm dump holds one `NOTIFICATION_EVENT` where `alarms-end.txt` held two,
which is the mock's own minutes-away row having fired since 16:48; no unexpected tag appears in either.

### 1.7 The owner's rules

- **No visual change.** `git diff --name-only origin/uat-2..uat-2` touches nothing under `components/`, `assets/` or
  `app/`.
- **No substituted prayer time.** Nothing in the range writes a time; the schedulers still skip an unreadable row.
- **`releases.json`, `uat`, EAS, the API key:** untouched. The only occurrences of those words in the range are the
  records text saying so. `uat` has no local commits.
- **No ignore comment and no skipped hook:** `grep` over the whole range's added lines for
  `istanbul|c8|v8 ignore` and `no-verify` finds nothing.

### 1.8 The records

The `AUDIT-FINDINGS.md` text was checked claim by claim against section 1.6 and against the suite. Its test claim is
right: `stores/__tests__/notificationAlertCommit.test.ts` reports `Tests: 25 passed, 25 total`, made of nine `it.each`
combinations and sixteen named tests, over both lists. Two claims were wrong; they are findings 1 and 2 below.

## 2. Findings

### Finding 1: the records said the app gave up after fifteen seconds; its own evidence times it at 41.8

**What the records said.** "On a second throwaway build whose first cancel never answers, the app gave up after
fifteen seconds and the change was put back" (`AUDIT-FINDINGS.md`, session 6b), and `LOG.md` glosses the timeout line
as "the timer fired while the app was backgrounded".

**What the evidence holds.** In `~/athan-device-sweep/session6b/hang-off2.logcat.txt` the forced hang is logged at
`16:37:31.500`. The JS thread then goes quiet at `16:37:31.502` — the app had just been sent to the background with
`key home` — and writes nothing at all until `16:38:13.260`, when the resume wakes it. The fifteen-second timer fires
34 ms later, at `16:38:13.294`: **41.79 seconds of wall clock after the call began**, not fifteen, and 34 ms after the
app came back, not while it was backgrounded.

**Why it matters.** The fifteen seconds run on wall clock, but the timer can only fire while the app is running, so
a hang the phone sleeps through is not given up on until the user returns. That is a different promise from the one
the records made. It is also the answer to the open limit in `PLAN.md` section 5.6 — the limit section 7.3 was
written to probe — and the plan recorded the question rather than the measurement. Sections 5.6 and 5.7 both pointed
at section 7.4 for that probe; 7.4 is the clean-up section and 7.3 is the probe.

**The mechanism took two passes to get right, and the reviewer is why.** The first version of this fix said the
fifteen seconds were "counted in the app's own running time", which the same logcat disproves: had the countdown
paused with the JS thread it would have had fifteen seconds still to run on the thaw and fired around 16:38:28, not
34 ms after the wake. The `Code Reviewer` (Claude Opus 5) refuted it from the numbers and named the correct
mechanism, and the commit was amended before it merged. The error is recorded here rather than quietly dropped,
because the plan's original wording ("the fifteen seconds are wall time, not foreground time") was right on mechanism
all along: its only defect was its pointer to section 7.4.

**Fixed in `1.27.192`** (see section 3).

### Finding 2: the `VISION_BELL` prompt describes no case that fits the app's Silent glyph

**What the plan said.** `PLAN.md` section 7.2's `VISION_BELL` prompt: "SILENT if that row's bell has no line through
it and no sound waves beside it; SOUND if that row's icon is a speaker with sound waves."

**What the app draws.** `components/prayer/Alert.tsx`'s `ALERT_CONFIGS` maps `AlertType.Silent` to `Icon.BELL_RING`
— `assets/icons/svg/bell-ring.svg`, a bell WITH ringing arcs — and `AlertType.Sound` to `Icon.SPEAKER`. A correctly
read Silent row therefore matches neither branch: it is not a bell without arcs, and it is not a loudspeaker.

**What happened.** The `vision` (GLM 5.3 Flash) subagent answered `SOUND` in both 7.2 and 7.3, describing in each
case "a bell ... with NO diagonal line ... two curved sound/ringing arcs", and explicitly "It is not a speaker". The
executor stopped and asked the owner under section 2.2, item 8; the owner answered "Please continue as you are ...
Make sure everything is working"; the executor mapped the description to SILENT on the strength of the logcat and
recorded the defect. **That conclusion is correct** — the logcat independently proves the undo re-armed both Magrib
alarms at `alertType: 1` and reset the mark — but the prompt is wrong, and the records text's explanation of it was
wrong too: it said the prompt "calls that glyph SOUND", when the prompt in fact describes no case for it.

**Fixed in `1.27.192`** (see section 3).

### Not findings

- **The two `audioMatrix` skips** in the scratch worktree: the plan's section 10.1 predicts them, and the main
  checkout has none.
- **`LOG.md` carrying step 1's entry in step 2's commit** rather than step 1's: the step loop appends to `LOG.md` in
  its "done when", after the commit, so it can only land with the next one. The step-2 reviewer noted the same
  sequencing and asked for no change.
- **The uncommitted `LOG.md` tail** the executor left in the working tree, recording the docs commit and the Reality
  Checker's verdict. Its own last line says it is "post-merge records for the audit session to carry", and the audit
  commit carries it.

## 3. What the audit fixed itself

Work is never handed back to the executor. Both findings are records defects, in the same two documents and both
arising from the same device proof, so they were made as one step rather than two; nothing in either is separately
revertible. No test applies to a documentation correction, so there is no red-before-green and no break script for
this step; `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0, and the commit's hook ran the
full suite and the coverage gate.

**Branch `fix/audit-6b-device-proof-records`, commit `1.27.192`.** A `Code Reviewer` (Claude Opus 5, isolation
`worktree`) reviewed it and replied "fix first" with six findings, one of them substantive; all six were applied and
the commit amended before it merged. The table below is numbered by the audit's own findings, except for the one row
that answers a reviewer finding with no audit finding behind it, which says so. Under the owner's "one review, then stop" rule (2026-09-16) a
documents commit is reviewed once, so the amended commit was not sent back.

| Finding | What changed |
| --- | --- |
| 1 | `PLAN.md` section 5.6's third bullet now records what section 7.3 measured: the fifteen seconds run on wall clock but can only fire while the app runs, the JS thread was quiet from 16:37:31.502, the resume woke it at 16:38:13.260 and the timer fired 34 ms later, 41.8 seconds of wall clock after the call began — and it names `LOG.md`'s HOME timestamps as the second source for the backgrounding |
| 1 | `PLAN.md` sections 5.6 and 5.7 now point at section 7.3 for that probe, not 7.4 |
| 1 | `AUDIT-FINDINGS.md`'s session 6b note drops "gave up after fifteen seconds" for what the app did, and states the measured timing and the mechanism |
| 1 | `PLAN.md` section 8.1's records template no longer asserts the refusal in its lead-in, so it fits both branches of `<HANG_OUTCOME>` |
| 1 | `LOG.md`'s gloss "the timer fired while the app was backgrounded" carries an audit correction in place: it fired 34 ms after the resume |
| 2 | `PLAN.md` section 7.2's `VISION_BELL` prompt now describes the glyphs the app draws: OFF is a bell struck through, SILENT is a bell with no line WHETHER OR NOT it has ringing arcs, SOUND is a loudspeaker rather than a bell. The discriminator is bell versus loudspeaker, not the arcs, so a later glyph change cannot reopen the same gap |
| 2 | `AUDIT-FINDINGS.md`'s parenthetical says what vision actually saw and that the prompt described no case that fitted it, instead of saying the prompt called that glyph SOUND |
| 2 | `LOG.md`'s note on the defect says the audit corrected the prompt, so its quote of the old wording does not read as current |
| reviewer only | `PLAN.md` section 8.1 now says it is the pre-audit form of the note, and that the shipped note in `AUDIT-FINDINGS.md` carries two things the template cannot produce |

No design choice was needed, and no notification, data or schedule behaviour changed, so no design review applies
(`AUDITOR-BRIEF.md` section 4, FIX IT, item 2).

## 4. Verdict

**PASS.** Session 6b does what its plan specified. A refusal is answered as a value rather than thrown or swallowed,
the undo runs inside the acquisition that failed, the generation-stamped mark under `preference_notification_repair_*`
is the only way a prayer's bell and alarms can be left disagreeing, and a marked prayer is put right by the existing
full reschedule narrowed to it. Both steps' code is byte-identical to the plan's own proven files, every break still
fails its named tests, the red check reproduces, `yarn validate` is 100% on all four measures, and the 3T's dumps and
logcats prove each device claim. The two records defects the audit found are fixed in `1.27.192`, in this session.

Row 2 of `ai/plans/README.md` moves to DONE, the `ai/prompts/README.md` row for session 6b is set from the plan's
section 8.2, and `uat-2` is pushed.
