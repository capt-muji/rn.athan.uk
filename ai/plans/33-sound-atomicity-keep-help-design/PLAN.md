# Plan: Session 33. The athan sound change, ISSUES #42's keep, and the Help modal's design

| Field | Value |
| --- | --- |
| Brief | `ai/plans/README.md` row 33, `ai/ISSUES.md` #42, `ai/prompts/README.md` "Decided by the owner, 2026-09-27, ON THE SIMULATOR" |
| Planned at | `d59347a2` (version 1.29.38), 2026-09-27 |
| Planned by | Planning session on 2026-09-27 |
| Needs first | nothing |
| Steps | 3, each one branch, one commit, one version |
| Device | none. No step arms, cancels or reads an alarm on a phone, and the Help design was specified by the owner from the simulator screenshots session 29 kept |
| Owner decisions still needed | None (both were taken while planning; see section 2) |

## 1. Goal

Three open items close in one session. **(1)** Picking a new athan is not atomic: the preference is written, then the
channel and the re-arm are awaited, and a failure part way leaves some prayers on the new athan and the rest on the
old while the restored preference agrees with neither. Worse, and not previously recorded, the undo runs OUTSIDE the
scheduling lock, so anything queued behind the commit arms with the athan about to be thrown away. **(2)** ISSUES #42
records a surviving mutant in `filterRelevantPrayers` and prescribes a test to kill it; that test is impossible, and
this session proves why and guards what is actually guardable instead. **(3)** The Help modal ships session 29's
interim design, and the owner has now specified the one to ship. When this plan is DONE, a failed athan change leaves
the phone exactly as it was, ISSUES #42 is closed with evidence, and the Help modal reads as the owner described it.

The owner's rules that apply, quoted:

- 🐋  "If anything fails, whether it's the settings choice, whether it's the committing or the settings choice, if
  anything fails... We should draw back everything, even there. And then selection... It's an all or nothing kind of
  thing. It's an all or nothing thing, and... The selection is part of that." (2026-09-27, this session)
- 🐋  "Try to have the buttons positioned to the right side, for example, like open settings, uh, and no outline on
  them, there should just be a text, and the um, background cards should be very, very faint, not too much of a
  border radius. Um, good structuring. Soft colours, et cetera." (2026-09-27, this session)
- An alert does exactly what its bell shows, with no healing "on the next refresh" (finding 79). This session extends
  that rule to the athan selection, on the owner's ruling above.
- Comments explain why, never what, and are extremely compact (`ai/AGENTS.md` section 15).
- Visuals are the owner's alone. Step 3 changes visuals BECAUSE the owner specified them, and nothing else does.

## 2. Decisions

### 2.1 Taken

1. **A failed athan change puts everything back, selection included** (owner, 2026-09-27). Offered three options:
   keep the choice and repair the refused prayers later, put everything back, or retry once then put it back. The
   owner chose put everything back, and made the reason explicit: the selection is part of the commit, so a stored
   athan the alarms do not play is the same defect as a bell that lies. Recorded in `ai/prompts/README.md`.
2. **The undo re-arms, it does not merely rewrite the preference** (planner, from the owner's ruling). "Draw back
   everything" cannot mean only the preference, because the preference was never what the user heard. So the undo
   runs the same three actions with the previous athan.
3. **The Help modal's design, specified directly by the owner** (owner, 2026-09-27). Asked to pick one of the 25
   candidates, the owner instead specified: settings buttons on the right, no outline, plain text; very faint
   background cards; a small border radius; good structure and soft colours. Step 3 implements exactly that.
   Recorded in `ai/prompts/README.md`.
4. **ISSUES #42 is closed as untestable-by-mutation, not fixed** (planner, measured). The issue prescribes a test
   that fails when the keep is mutated from `>=` to `===`. Measured over 1,209,600 reachable states, the two forms
   keep the identical row set in every one, so no such test can exist. The clause IS load-bearing (199,714 states
   where it uniquely keeps rows), so step 2 guards its removal instead and records the measurement. Section 5 has
   the proof.
5. **No device work** (planner). Step 1 is covered by the store suite, which drives the real scheduling lock; steps
   2 and 3 touch no alarm at all. The Help design was specified by the owner from session 29's simulator
   screenshots, which are still at `~/athan-help-designs`.
6. **The 25 candidate files stay where they are until the row is DONE** (planner). They are the record behind
   decision 3. Section 8 leaves their removal to the owner, since they live outside the repository.

### 2.2 The executor must not decide

STOP and ask the owner when any of these happens:

1. **Any anchor count other than 1.** That is NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4), not a question.
2. **A test fails that this plan does not name.** Ask: "Step `<k>`'s command failed `<test name>`, which the plan
   does not predict. The failure line is `<line>`. How should I proceed?"
3. **A break prints `BREAK NOT APPLIED`.** Ask: "Step `<k>`'s break `<label>` changed nothing, so the code does not
   carry the text the plan fixed. Should the plan be refreshed?" The one exception is step 3's break 3, whose own
   text says to adjust the search to the executor's own attribute formatting.
4. **Step 2's break 2 is CAUGHT rather than SURVIVED.** That would mean this session's measurement was wrong. Ask:
   "ISSUES #42's mutation was caught by `<test name>`, where the plan measured it as equivalent. Should #42 be
   fixed rather than closed?"
5. **A review finding this plan's section 10 does not answer, and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8.**
6. **A finding that step 3's design itself looks wrong.** The design is the owner's. Ask: "Step 3's design produces
   `<what you see>`. Is that what you intended?"
7. **Anything the step does not answer** that would otherwise be the executor's decision: "The plan does not say
   `<X>`. What should it be?"
8. **Anything touching prayer times, a hand-edited release file, `uat` or EAS.**

## 3. Pre-flight

Save as `$TMPDIR/preflight-33.sh`, run as `bash $TMPDIR/preflight-33.sh <k>`, where `<k>` is the first step in
section 6's checklist not ticked DONE (1 for a new plan).

```bash
#!/bin/bash
# Session 33 pre-flight
set -u
STEP="${1:-1}"
REPO=/Users/muji/repos/rn.athan.uk
A="$REPO/ai/plans/33-sound-atomicity-keep-help-design/scripts/anchors"
FAIL=0

cd "$REPO" || { echo "STOP: cannot enter $REPO"; exit 1; }

[ "$(pwd)" = "$REPO" ] || { echo "STOP: wrong checkout"; FAIL=1; }
[ "$(git branch --show-current)" = "uat-2" ] || { echo "STOP: not on uat-2"; FAIL=1; }

DIRTY=$(git status --porcelain | grep -v 'ai/plans/README.md' \
  | grep -v 'ai/plans/33-sound-atomicity-keep-help-design/PLAN.md' \
  | grep -v 'ai/plans/33-sound-atomicity-keep-help-design/LOG.md')
[ -z "$DIRTY" ] || { echo "STOP: unexpected changes:"; echo "$DIRTY"; FAIL=1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "STOP: uat-2 is behind origin"; FAIL=1; }

echo "version: $(node -p "require('./package.json').version")"

# Every "Needs first" row: this plan has none, so nothing to check here

count_anchor() {
  local name="$1" src="$2"
  local n
  n=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' "$A/$name.txt" "$src")
  echo "anchor $name in $src: $n"
  [ "$n" = "1" ] || FAIL=1
}

# Step 1's anchors are on code no earlier step changes; steps 2 and 3 likewise
[ "$STEP" -le 1 ] && { count_anchor 1-1 hooks/useNotification.ts; count_anchor 1-2 stores/notifications.ts; }
[ "$STEP" -le 2 ] && count_anchor 2-1 stores/schedule.ts
[ "$STEP" -le 3 ] && { count_anchor 3-1 components/modals/Help.tsx; count_anchor 3-2 components/modals/Help.tsx; }

node -e "process.exit(require('./node_modules/.bin/jest') ? 0 : 0)" 2>/dev/null
[ -x node_modules/.bin/jest ] || { echo "STOP: jest missing, see EXECUTOR-BRIEF section 3 (midnight)"; FAIL=1; }

[ "$FAIL" = "0" ] && echo "PREFLIGHT OK" || echo "PREFLIGHT FAILED"
```

An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### Code map

| File | What it does | Anchor |
| --- | --- | --- |
| `hooks/useNotification.ts` | The sheet-facing hook. `commitSoundSelection` (line 291 at "Planned at") writes the preference, updates the Android channel, re-arms, and rolls the preference back on a throw | `1-1.txt` |
| `stores/notifications.ts` | Owns the scheduling lock, the preference atoms and every arming path. `rescheduleAllNotifications` (line 1686) wraps `_rescheduleAllNotifications` in `withSchedulingLock` | `1-2.txt` |
| `stores/schedule.ts` | `filterRelevantPrayers` (line 391) decides which rows a refresh keeps, with three clauses | `2-1.txt` |
| `components/modals/Help.tsx` | The Help modal: its styles (line 79) and the action and Close buttons (line 140) | `3-1.txt`, `3-2.txt` |
| `components/sheets/screens/Sound.tsx` | The only caller of the hook's `commitSoundSelection`, from `handleDismiss` | none, unchanged |
| `device/notifications.ts` | `updateAndroidChannel(sound)` creates the athan's channel. Unchanged, but now passed as a parameter | none, unchanged |

### How the pieces interact

The blast radius, read with `codegraph_explore` rather than reconstructed by hand:

- `commitSoundSelection` (hook) has exactly ONE production caller, `handleDismiss` in
  `components/sheets/screens/Sound.tsx`, which awaits it and ignores nothing but the boolean.
- `rescheduleAllNotifications` (store) has exactly ONE caller, that same hook function. So moving the commit into
  the store leaves no other path to update.
- `filterRelevantPrayers` has exactly ONE caller, `refreshSequence` in the same file.
- `ModalHelp` has exactly ONE caller, `app/index.tsx`.

The concurrency table for step 1, which is the whole reason it is a defect:

| Moment | Today | After step 1 |
| --- | --- | --- |
| Sheet closes on a new athan | Preference written, OUTSIDE any lock | Nothing written yet; the commit queues for the lock |
| `updateAndroidChannel` runs | Outside the lock | Inside the lock |
| `rescheduleAllNotifications` runs | Takes the lock, then releases it | Same acquisition, no second take |
| It throws | The lock is ALREADY RELEASED | Still held |
| A queued pass (refresh, background task, alert commit) runs | Runs NOW, reading the new athan that is about to be abandoned | Cannot run: the commit still holds the lock |
| The undo runs | After the queued pass, writing only the preference | Before anything else runs, re-arming on the old athan |

Measured while planning, with the real lock: a `refreshNotifications` queued behind a failing commit saw the
abandoned athan every time.

### Existing tests

- `hooks/__tests__/useNotification.test.ts`, `describe('commitSoundSelection')`: five tests scripting the channel and
  reschedule mocks. They describe store behaviour from the hook, so step 1 moves them.
- `stores/__tests__/notificationSchedulingLock.test.ts`: proves operations run one at a time. Its fixture shape is
  what step 1's new suite copies. Unchanged.
- `stores/__tests__/schedule.test.ts`, `describe('a day roll with every row readable (ISSUES #27)')`: one test,
  session 32's. Step 2 adds a second beside it.
- `components/modals/__tests__/Help.test.tsx`: 11 tests over the questions, actions and Close. Step 3 adds two and
  deletes the badge test.

### Why the obvious simple fix is wrong

For step 1, the obvious fix is to keep the hook's structure and add the re-arm to its catch block. That leaves the
undo outside the lock, which is the half of the defect nobody had recorded, so the queued-pass window stays open.
Session 6b learned exactly this for the alert sheet and its comment in `commitAlertMenuChanges` says so; step 1
applies the same lesson to the athan.

For step 2, the obvious fix is to write the test ISSUES #42 asks for. It cannot pass, because the mutation is
semantically equivalent. Writing a test AGAINST it would mean constructing an unreachable state, which is the trap
session 24 recorded: a test that only passes because it manufactured the impossible input is testing the test.

## 5. Design

### Step 1: one lock acquisition, all or nothing

**The invariant:** the stored athan always names the athan the alarms were last armed with, and a failed change
leaves both on the athan that was in force before it.

The commit moves from the hook into `stores/notifications.ts`, because that is where the lock lives and a commit
that must be atomic has to be built inside it. The hook keeps its name, its signature and its perf marks, and
becomes the thin layer it should be: read the athan in force, hand three things to the store, return the verdict.

`updateChannel` is a parameter rather than an import so `stores/` keeps its rule of never importing `device/`.

Three failure levels, each with a defined answer:
1. The change fails: re-arm everything on the previous athan, store it, answer `false`.
2. The undo also fails: store the previous athan anyway and answer `false`. The preference is what Settings shows,
   and it must name an athan the user can still hear; the marks the arming paths already write get the alarms
   repaired on the next refresh.
3. Nothing throws: answer `true`.

**Alternatives rejected.** Keeping the commit in the hook and awaiting a store-side undo: two lock acquisitions, the
exact shape session 6b removed. Reusing `commitPrayerAlertChange`'s repair marks for the athan: marks are per prayer
and the athan is global, so the mark would have to be written for all eleven prayers to mean anything, which is a
bigger change than the owner asked for and is what the periodic refresh already does. Retrying before undoing: the
owner was offered it and chose the simple undo.

**Design review, by this session, 2026-09-27.** Attacked from three angles. *What if the undo's re-arm partially
fails?* Level 2 covers it: the preference still goes back, and the arming paths' own refusal marks bring the next
refresh round. *Does holding the lock through the undo delay anything user-visible?* The sheet is already closed and
`handleDismiss` is called un-awaited, so the extra time is invisible; the alternative is the bug. *Could the new
signature let a caller pass a wrong `previousSelection`?* Only one caller exists and it reads the value immediately
before, which the blast-radius read confirmed.

### Step 2: guard what the clause decides, close what cannot be tested

**The invariant:** while the countdown bar measures from a row on an earlier list day than the day on screen, that
earlier list day is kept whole.

The measurement behind the closure, run in a scratch worktree over the app's real builder and sequence rules:

| Sweep | States | Disagreements between `>=` and `===` | States where the clause uniquely keeps rows |
| --- | --- | --- | --- |
| London and a >60N overlap, 5 breakage patterns | 345,600 | 0 | 51,226 |
| Adds a polar day and an inverted polar day, 7 breakage patterns, 3 broken-day positions | 1,209,600 | 0 | 199,714 |

Also measured over the second sweep: **zero** states where the display date is after next's list day, and **zero**
where the previous row is after next's list day. Those two invariants are what make the mutation equivalent, so the
equivalence is structural rather than a happy accident of the fixtures.

**Alternatives rejected.** Constructing a state where the two forms differ: it would need a display date after
next's list day, which `resolveDisplayDate` cannot answer by construction. Deleting the clause as redundant: it
uniquely keeps rows in 199,714 states, so it is load-bearing and deleting it regresses the bar's day. Leaving #42
open: the measurement answers it, and an issue left open invites another session to re-derive this.

**Design review, by this session, 2026-09-27.** *Is the new test vacuous?* It would have been, so it asserts a
non-zero count of states that actually exercised the shape. *Is "expected to survive" a real break?* It is the
evidence for the closure: if it is ever caught, the measurement was wrong and the plan says STOP. Both halves of the
script were RUN, not reasoned about, and the first draft of break 1 printed `BREAK NOT APPLIED` because `\Q...\E`
does not protect an interpolated newline; the corrected script is what section 6 carries.

### Step 3: the owner's design

No behaviour changes. The design is the owner's specification, translated into existing constants, and section 5 of
its step file carries the value-by-value table with the reason for each.

**Design review, by this session, 2026-09-27.** *Does a text link stay reachable?* It keeps `accessibilityRole` and
its label, and a break proves removing the role is caught. *Does removing the badge lose anything?* The badge marked
each question as a cause; the question text already does that, and the faint card now groups the answer. *Should the
card's look be pinned by a test?* No: it is the owner's to change, and a test over it would turn every future tweak
into a test edit. Only the two rules are pinned.

## 6. Steps

- [ ] Step 1: The athan change is all or nothing, selection included (specified)
- [ ] Step 2: ISSUES #42, the previous-row keep, guarded by what it actually decides (specified)
- [ ] Step 3: The Help modal's visual design, as the owner specified it (specified)

Each step is in its own file, run in this order:

1. `steps/1-sound-all-or-nothing.md`
2. `steps/2-keep-guarded-or-closed.md`
3. `steps/3-help-visual-design.md`

## 7. Device proof

None. No step in this plan arms, cancels or reads an alarm on a phone, and no step changes what a phone does that a
test cannot observe: step 1's concurrency is proven against the real scheduling lock in the store suite, step 2 adds
a test and closes an issue, and step 3 changes only styling, specified by the owner from the simulator screenshots
session 29 kept at `~/athan-help-designs`.

The phone is left exactly as this session found it: the OnePlus 3T (`8f7ada76`) is untouched, on whatever build it
carried, with automatic time on. No clock is changed, so no `dumpsys alarm` reading is needed.

## 8. Records

### Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md`, under the exact heading `## 49b. The sound commit, finished`:

```
Finding 49 said the sound sheet persisted the athan before a reschedule that can throw, with no
rollback. Session 6b's sibling work added the rollback, so by 2026-09-27 the preference did go back.
Session 33 found the two halves that were still wrong, and the owner ruled on both.

The re-arm is not atomic, so a failure part way left some prayers on the new athan and the rest on the
old, while the restored preference agreed with neither. And rescheduleAllNotifications takes the
scheduling lock itself and had therefore RELEASED it before it rethrew, so the undo ran outside the
lock: anything queued behind the commit armed with the athan that was about to be abandoned. Measured
with the real lock while planning, a queued refresh saw the abandoned athan every time.

The owner's ruling, 2026-09-27: the selection is part of the commit, so a failure puts back everything
including the selection. The commit moved into stores/notifications.ts and now does the write, the
channel, the re-arm and the undo inside ONE lock acquisition, with the undo RE-ARMING on the previous
athan rather than only rewriting the preference. A failed undo still restores the preference, because
that is what Settings shows.

Tests after: <TESTS_AFTER>. Breaks: <BREAKS_STEP_1> of <BREAKS_STEP_1> caught.
```

### Table rows

The executor sets the `ai/plans/README.md` row 33 to EXECUTED. The exact cell text for the `ai/prompts/README.md`
row, for the auditor to apply on PASS, is in section 12's report.

`ai/prompts/README.md` also gains a "Decided by the owner, 2026-09-27, while planning session 33" section recording
decisions 1 and 3 of section 2.1, in the owner's own words with the whale mark. Step 3's commit carries it.

### Docs commit

`<VERSION> - docs(plans): session 33 executed: the athan commit is atomic, ISSUES #42 closed, the Help design shipped`

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| Step 1's new suite fails with `commitSoundSelection is not a function` BEFORE the change | Expected: that is the red | Carry on to part 5 |
| Step 1's new suite still fails after the change, on the queued-pass test | The undo is outside the lock, or a second acquisition was taken | Reread part 5's contract: one `withSchedulingLock` call, everything inside it |
| Step 1 breaks 1 or 2 SURVIVE | The undo does not re-arm | The contract requires the undo to run the same three actions; fix the code, not the test |
| Step 2's new test fails on today's code | The sweep is not reaching the shape | STOP (section 2.2, item 2) |
| Step 2's break 2 is CAUGHT | This session's measurement was wrong | STOP (section 2.2, item 4) |
| Step 3's new tests pass before the change | The file already carries the design | STOP (section 2.2, item 2) |
| Step 3 break 3 prints `BREAK NOT APPLIED` | The attribute order differs from the plan's | Adjust the search to the two attributes as the executor wrote them, keeping the intent. This is the one break the plan lets the executor adjust |
| Biome reports an unused import in step 3 | `SIZE` is no longer used | Remove it from the import; that is work, not a finding |
| Anything else | | `EXECUTOR-BRIEF.md` section 7's table |

### Anticipated review fixes

These are the only fixes the executor may make to anything this plan fixed, and each is given word for word:

1. **If the store's `commitSoundSelection` duplicates the three actions in both branches,** extract them into one
   local helper inside the function, named `armEverything`, taking the athan as its only parameter, and call it
   twice. Nothing else changes.
2. **If `hooks/useNotification.ts` still imports something it no longer uses after the body shrinks** (`Device` and
   `logger` are the candidates), remove only the imports that are genuinely unused, and leave every other import.
3. **If step 3 leaves `RADIUS` or `COLORS` unused,** remove only the unused name from the import line.

A reviewer finding this section does not answer is handled by `EXECUTOR-BRIEF.md` section 4, item 8: the executor
applies it itself only when all three of that item's conditions hold, and records it in `LOG.md`. Those three
conditions are written there and are never restated here in different words.

### Stopping part-way

| Step | Restore with `git checkout --` | Delete |
| --- | --- | --- |
| 1 | `stores/notifications.ts`, `hooks/useNotification.ts`, `hooks/__tests__/useNotification.test.ts`, `app.json`, `package.json` | `stores/__tests__/notificationSoundCommit.test.ts` |
| 2 | `stores/__tests__/schedule.test.ts`, `ai/ISSUES.md`, `app.json`, `package.json` | nothing |
| 3 | `components/modals/Help.tsx`, `components/modals/__tests__/Help.test.tsx`, `ai/prompts/README.md`, `app.json`, `package.json` | nothing |

## 11. Subagents in this plan

None. This session does its own planning, execution, review and audit (owner, 2026-09-26). No image needs reading
during execution: the Help design was specified by the owner in words, so there is no screenshot for the executor to
interpret and no `vision` call anywhere in this plan.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, then:

- a few plain sentences on what changed and what was proven;
- the progress table, in `EXECUTOR-BRIEF.md` section 6's format;
- any decision now waiting on the owner (expected: none);
- the four-line handoff from the `athan-next` skill, section 8.

The `ai/prompts/README.md` row text for the auditor to apply on PASS:

```
DONE 2026-09-27. Three open items closed in one session. The athan change is now ALL OR NOTHING
including the selection, on the owner's ruling: the commit moved into the store, where the scheduling
lock lives, and does the write, the channel, the re-arm and the undo in ONE acquisition, with the undo
re-arming on the previous athan. Two defects, one of them unrecorded: the re-arm was never atomic, and
the undo ran AFTER rescheduleAllNotifications had released the lock, so a queued pass armed with the
athan about to be abandoned. ISSUES #42 is CLOSED as untestable-by-mutation rather than fixed: measured
over 1,209,600 states, the >= and === forms keep the identical row set in every one, because the display
date and the previous row are each never after next's list day, so the clause is guarded against
REMOVAL instead and the break script pins the mutation as expected-to-survive. The Help modal ships the
design the owner specified in words rather than one of the 25 candidates: faint cards, a small radius,
and the settings actions as right-aligned text links, with Close the one filled button spanning the
card. DURABLE LESSON: a surviving mutant is not always a missing test.
```
