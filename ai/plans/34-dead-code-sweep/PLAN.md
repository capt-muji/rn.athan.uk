# Plan: Session 34. Dead-code sweep: every exported symbol no production file reaches

| Field | Value |
| --- | --- |
| Brief | `ai/plans/README.md` row 34 (this session's own measurement, 2026-09-27) |
| Planned at | `6c3956ef` (version 1.29.48), 2026-09-27 |
| Planned by | Planning session on 2026-09-27 |
| Needs first | nothing |
| Steps | 7, each one branch, one commit, one version |
| Device | none |
| Owner decisions still needed | None (eight were taken while planning; see section 2) |

## 1. Goal

The app carries exported symbols that nothing on screen reaches. They sit at 100% coverage because
their own tests call them, so every gate the repo has reports them healthy while no screen, hook or
store uses them. This plan deletes them, deletes the tests that existed only for them, repoints the
tests that reach live code through a dead accessor, and leaves a test that fails the next commit to
create one. When it is DONE, `python3 scripts/find-unused-exports.py` reports only the five symbols
a framework or a test-time content rule reaches, and `yarn validate` fails if that ever changes.

The row was queued saying 18 symbols. **That number was wrong, and correcting it is step 1.** The
committed script had three blind spots, each measured in section 4. The true count at `6c3956ef` is
27 exported symbols, and removing them orphans 6 more private ones plus a 791-line reference file,
for 1,561 lines deleted against 305 added.

The owner would notice nothing on screen. That is the point: every deletion is verified to change no
behaviour, and `yarn validate` stays at 100% on all four measures throughout.

The owner's rules that apply:

🐋  "If the code is not being used, but we're testing the code, then we should delete the code and
the tests." (owner, 2026-09-27, ruling on this session's own question. This overrode the planning
session's recommendation to keep five symbols whose tests were said to be load-bearing: the tests
turned out to reach LIVE code through a dead accessor, so they repoint rather than disappear.)

🐋  "the comments should be extremely compact, and they should only explain the why, and they should
never explain the how or the what, because those two should be self-explanatory from your code."
(owner, 2026-09-26)

🐋  "a test should not be based on what time of date being run. Our test should be mocking the
time... everything should be mocked so that we can properly test the scenarios." (owner, 2026-09-27,
ISSUES #41. Step 7 fixes a second, separate breach of this rule that this session found on clean
`uat-2`.)

## 2. Decisions

### 2.1 Taken

1. **The script is fixed FIRST, and the sweep works from the corrected 27.** Owner, 2026-09-27,
   asked whether to sweep the queued 18 or the re-measured 27: 🐋 the recommended option, "Fix the
   script first, then sweep 27". The wrong count is itself the finding, because a guard that
   under-reports is worse than none, being trusted. Recorded here and in `ai/prompts/README.md`.
2. **The standing guard is a normal Jest test in the suite.** Owner, 2026-09-27, choosing between a
   Jest test, a manual script and a pre-push check, then confirming the shape: a test at
   `shared/__tests__/unusedExports.test.ts`, inside `yarn validate`, so the pre-commit hook fails
   the commit that creates an orphan. Measured at 0.5 seconds, so the hook does not get slower.
3. **`ErrorBoundary` and the four `MAX_WHATS_NEW_*` constants are kept, allow-listed.**
   `ErrorBoundary` is a false positive: Expo Router renders it by file convention, so deleting it
   breaks the error screen. The four constants are a rule about the CONTENT in `shared/whatsNew.ts`,
   enforced only at test time, so a test is their only possible caller; deleting them would let a
   200-character body ship and wrap the modal. Owner, 2026-09-27.
4. **Every other symbol goes, including the five the planning session first proposed keeping.**
   Owner, 2026-09-27, quoted in section 1. The five were `getDisplayDate` (45 assertions),
   `getPerfRing` (17), `perfFlush` (5), `getAlertSheetState` (7) and `didBootstrapFromCache` (10).
   The planning session then PROVED the owner right: each is a doorway onto live code, so its tests
   repoint onto the atom or the persisted snapshot the app itself uses, and the coverage moves rather
   than vanishing. Proof in section 5.
5. **A deletion runs to a fixpoint: whatever it orphans goes in the same commit.** Owner,
   2026-09-27, on `useAnimationOpacity`: 🐋 "Delete the hook and its now-orphaned helpers". Leaving
   a private helper nobody calls is the same debt one level down, and Biome fails the build on it
   anyway. Depth reached 3 in one case (`useAnimationOpacity`, then `createTimingAnimation`, then
   `DEFAULT_TIMING`).
6. **`StoredPrayer`, `StoredPrayerSequence` and `mocks/timing-system-schema.ts` all go.** Owner,
   2026-09-27. The two types describe a sequence cache the app does not have, the 791-line file is
   the only thing naming them, and nothing imports or tests that file. `shared/types.ts`'s own
   comment warned that reasoning about the type "will send you looking for a bug that cannot be
   there". `ai/AGENTS.md` already recorded the real design decision, that sequences are rebuilt on
   every launch and never persisted, so no documentation is lost.
7. **The `widgetAndroid` clock bug is fixed in this session, as its own step.** Owner, 2026-09-27,
   after the planning session hit it on clean `uat-2`: 🐋 "Fix it in this session as its own step".
   It blocks every commit in the affected window, this session's own included, so the sweep cannot
   proceed cleanly without it. Step 7, and ISSUES gains an entry.
8. **The word "cascade" never describes dead code in this repo.** Owner, 2026-09-27, when the
   planning session's phrase "the cascade" read as the date-roll cascade animation. Write "chain of
   dead code". The cascade animation is untouched by this plan: `useDerivedOpacity`,
   `useDerivedColor`, `useDerivedFill`, `ANIMATION.cascadeDelay` and `getCascadeDelay` are all kept,
   and all 58 prayer-row component tests pass in the spike.

### 2.2 The executor must not decide

Each of these is a STOP. Append the question and what you saw to `LOG.md` first.

1. **Any anchor count other than 1.** NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4). Ask:
   "Anchor `<name>` counts `<n>` rather than 1. The plan is stale. Should I set the row to NEEDS
   REPLAN?"
2. **An anchor file the pre-flight reports as `EMPTY ANCHOR`.** An empty anchor matches thousands of
   times and reads as a pass. Ask: "Anchor `<name>` is empty, so its count is meaningless. Should I
   set the row to NEEDS REPLAN?"
3. **A test fails that this plan does not name.** Ask: "`<test name>` failed and the plan does not
   predict it. The failure line is `<line>`. What should I do?"
4. **A break prints `BREAK NOT APPLIED`.** Ask: "Break `<label>` changed nothing, so the plan's
   substitution does not match the code I wrote. Should I reshape the code, or is this a replan?"
   Never reshape the code to fit a break.
5. **The sweep reports a symbol this plan does not list.** `uat-2` moved since `6c3956ef` and
   something new is dead, or something listed became live. Ask: "The sweep reports `<file>:
   <symbol>`, which the plan does not list. Should it be deleted, or allow-listed?"
6. **A deletion orphans something this plan does not name.** Ask: "Deleting `<symbol>` leaves
   `<orphan>` with no caller, and the plan does not list it. Should it go in this commit?"
7. **A repointed test needs a different assertion from the one the plan gives.** Ask: "The plan
   repoints `<test>` onto `<target>`, and that assertion `<what happened>`. What should it assert?"
8. **Anything touching visuals, a prayer time, a hand-edited release file, `uat` or EAS.** None of
   this plan's steps do. Ask before proceeding.
9. **Anything else the plan does not answer**, with the question "The plan does not say `<X>`. What
   should it be?"

## 3. Pre-flight

Save to `$TMPDIR/preflight-34.sh` and run `bash $TMPDIR/preflight-34.sh <k>`, where `<k>` is the
first step in section 6's checklist not ticked DONE (1 for a new plan). It ends `PREFLIGHT OK`.

```bash
#!/bin/bash
# Pre-flight for plan 34. Usage: bash $TMPDIR/preflight-34.sh <first unticked step>
set -u
FROM=${1:?give the first unticked step number}
REPO=/Users/muji/repos/rn.athan.uk
cd "$REPO" || { echo "STOP: not $REPO"; exit 1; }

[ "$(git branch --show-current)" = "uat-2" ] || { echo "STOP: not on uat-2"; exit 1; }

# Only the plan's own bookkeeping may be dirty
DIRTY=$(git status --porcelain | grep -vE 'ai/plans/README\.md|ai/plans/34-dead-code-sweep/(PLAN|LOG)\.md' || true)
[ -z "$DIRTY" ] || { echo "STOP: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "STOP: uat-2 is behind origin"; exit 1; }

echo "package.json version: $(python3 -c 'import json;print(json.load(open("package.json"))["version"])')"
echo "  (must not be lower than 1.29.48, the Planned at version)"

# Needs first: nothing, so no row is checked

python3 - <<'PY' || exit 1
import re
rows = [r for r in open('ai/plans/README.md') if r.startswith('| 34 ')]
if len(rows) != 1:
    raise SystemExit(f"STOP: expected one row 34, found {len(rows)}")
print("row 34 status cell:", rows[0].split('|')[5].strip()[:60])
PY

# Every anchor on code no earlier step of this plan changes
count() { # count <anchor> <source>
  python3 -c '
import sys
anchor = open(sys.argv[1]).read()
if not anchor.strip():
    print("EMPTY ANCHOR"); raise SystemExit(1)
print(open(sys.argv[2]).read().count(anchor))' "$1" "$2"
}

A=ai/plans/34-dead-code-sweep/scripts/anchors
fail=0
check() { # check <step> <anchor> <source>
  [ "$1" -lt "$FROM" ] && return 0
  n=$(count "$A/$2.txt" "$3") || { echo "ANCHOR $2: EMPTY, STOP"; fail=1; return 0; }
  printf 'anchor %-6s %-40s %s\n' "$2" "$3" "$n"
  [ "$n" = "1" ] || fail=1
}

check 2 2-1 shared/constants.ts
check 2 2-2 shared/constants.ts
check 2 2-3 shared/time.ts
check 2 2-4 shared/perf.ts
check 3 3-1 device/notifications.ts
check 3 3-2 device/tls13.ts
check 3 3-3 stores/bootstrap.ts
check 4 4-1 stores/database.ts
check 4 4-2 stores/database.ts
check 4 4-3 stores/database.ts
check 4 4-4 stores/notifications.ts
check 5 5-1 stores/schedule.ts
check 5 5-2 stores/ui.ts
check 5 5-3 stores/ui.ts
check 6 6-1 hooks/useAnimation.ts
check 6 6-2 hooks/useAnimation.ts
check 6 6-3 shared/types.ts
check 7 7-1 stores/__tests__/widgetAndroid.test.ts

[ "$fail" = "0" ] || { echo "STOP: an anchor did not count 1 (NEEDS REPLAN)"; exit 1; }

# Tools
python3 --version || { echo "STOP: python3 missing"; exit 1; }
[ -x node_modules/.bin/jest ] || { echo "STOP: jest missing, run yarn install"; exit 1; }

echo PREFLIGHT OK
```

Observed at `6c3956ef`: all 18 anchors printed `1`, and the script printed `PREFLIGHT OK`.

An anchor count other than 1, or `EMPTY ANCHOR`, means NEEDS REPLAN. Any other failure means STOP.

## 4. Background the executor needs

### 4.1 Why the committed script under-reported, measured

`scripts/find-unused-exports.py` at `6c3956ef` collects every `export const|function|class|type|…`
by regex, then counts bare identifier matches across production files. It reports 18. It has three
blind spots, each of which hides a dead symbol:

| Blind spot | What it hides | Measured example |
| --- | --- | --- |
| **A name is not a symbol.** It counts the identifier anywhere, so a different symbol with the same name reads as a caller | Any export whose name is reused | THREE symbols are named `clearAllScheduledRemindersForPrayer`: an export of `stores/database.ts` (dead), an export of `device/notifications.ts` (live), and a local `const` in `stores/notifications.ts` (live). The live two made the dead one read as used |
| **A comment is not a caller.** It searches raw text, so a name mentioned in its own JSDoc reads as a use | 8 symbols | `PLATFORM`, `perfFlush`, `getSecondsBetween`, `getDisplayDate`, `useAnimationOpacity`, and the four `MAX_WHATS_NEW_*`, each named only by the prose above its own definition or by an `@example` line |
| **`mocks/` is outside its scan.** `SRC_DIRS` omits it, so a type only that folder names reads as dead while a real reference exists | 1 symbol, in the other direction | `StoredPrayerSequence` was reported dead while `mocks/timing-system-schema.ts` imported it. That reference turned out to be worth deleting too, but the script could not know |

The replacement resolves by import graph: a reference counts only where it resolves to that export,
through `@/` aliases, relative specifiers, `require()`, and barrel re-exports, with comments and
import clauses stripped before the identifier search. It is verified in both directions with planted
canaries:

| Verification | Command | Observed |
| --- | --- | --- |
| No live symbol is flagged | grep the output for `perfMark`, `setSequence`, `showAlertSheet`, `rescheduleAllNotifications`, `getPrayerByDateString`, `initPerfMonitor`, `filterRelevantPrayers`, `buildSchedulePlan`, `atomWithStorageNumber`, `renderBackdrop` | none reported |
| A planted dead export is caught | append `export const sweepCanaryUnused = () => 1;` to `shared/perf.ts` | reported as `shared/perf.ts: sweepCanaryUnused` |
| A planted live export is not | add `sweepCanaryLive` plus a caller in `stores/ui.ts` | not reported |

The corrected script reports **27** at `6c3956ef`, and the plan's own copy is at
`ai/plans/34-dead-code-sweep/scripts/find-unused-exports.py`.

### 4.2 The inventory: 27 exports, 6 private orphans, 1 file

Every row is verified individually. "Doorway" means the symbol is dead but its tests reach LIVE code
through it, so those tests repoint rather than disappear.

| # | Symbol | File | Step | Its tests |
| --- | --- | --- | --- | --- |
| 1 | `ISTIJABA_INDEX` | `shared/constants.ts` | 2 | its 2-test `describe` goes with it |
| 2 | `PLATFORM` | `shared/constants.ts` | 2 | none exist |
| 3 | `getSecondsBetween` | `shared/time.ts` | 2 | its 3-test `describe` goes with it |
| 4 | `perfFlush` | `shared/perf.ts` | 2 | doorway: 4 disabled-path lines drop it, 1 test moves to the background flush |
| 5 | `getPerfRing` | `shared/perf.ts` | 2 | doorway: 17 assertions read the persisted MMKV snapshot |
| 6 | `perfStorage` (private) | `shared/perf.ts` | 2 | orphaned by 4; Biome flags it |
| 7 | `openAppSettings` | `device/notifications.ts` | 3 | its 3-test `describe` goes; 2 negative assertions drop |
| 8 | `tls13FirstProvider` | `device/tls13.ts` | 3 | doorway: 4 tests assert the log line the module now writes |
| 9 | `didBootstrapFromCache` | `stores/bootstrap.ts` | 3 | doorway: 10 boolean assertions drop, the side-effect assertions beside them already prove it |
| 10 | `mmkvStorage` | `stores/database.ts` | 4 | none exist |
| 11 | `clearAllScheduledNotificationsForSchedule` | `stores/database.ts` | 4 | its `describe` goes; the negative guard spies on `clearPrefix` |
| 12 | `clearAllScheduledNotificationsForPrayer` | `stores/database.ts` | 4 | its `describe` goes with it |
| 13 | `clearAllScheduledRemindersForSchedule` | `stores/database.ts` | 4 | its `describe` goes; the negative guard spies on `clearPrefix` |
| 14 | `clearAllScheduledRemindersForPrayer` | `stores/database.ts` | 4 | its `describe` goes with it |
| 15 | `unregisterBackgroundTask` | `stores/notifications.ts` | 4 | its 4-test `describe` goes with it |
| 16 | `getBackgroundTaskStatus` | `stores/notifications.ts` | 4 | its 3-test `describe` goes with it |
| 17 | `getDisplayDate` | `stores/schedule.ts` | 5 | doorway: 45 assertions read the display-date atoms `Day.tsx` renders |
| 18 | `hideAlertSheet` | `stores/ui.ts` | 5 | its 1 test goes with it |
| 19 | `getAlertSheetState` | `stores/ui.ts` | 5 | doorway: 7 assertions read `alertSheetStateAtom`, which the sheet renders |
| 20 | `getMeasurementsDate` | `stores/ui.ts` | 5 | its 1 test goes with it |
| 21 | `setMeasurementsDate` | `stores/ui.ts` | 5 | its 1 test goes with it |
| 22 | `measurementsDateAtom` (private) | `stores/ui.ts` | 5 | orphaned by 20 and 21; nothing rendered it |
| 23 | `useAnimationOpacity` | `hooks/useAnimation.ts` | 6 | its `describe` goes; the paired `it.each` narrows to `useAnimationScale` |
| 24 | `createTimingAnimation` (private) | `hooks/useAnimation.ts` | 6 | orphaned by 23; Biome flags it |
| 25 | `DEFAULT_TIMING` (private) | `hooks/useAnimation.ts` | 6 | orphaned by 24; Biome flags it |
| 26 | `StoredPrayerSequence` | `shared/types.ts` | 6 | none exist |
| 27 | `StoredPrayer` | `shared/types.ts` | 6 | none exist; orphaned by 26 |
| 28 | `mocks/timing-system-schema.ts` | whole file, 791 lines | 6 | nothing imported it |

Kept, allow-listed: `ErrorBoundary`, `MAX_WHATS_NEW_ITEMS`, `MAX_WHATS_NEW_ARCHIVE`,
`MAX_WHATS_NEW_TITLE_LENGTH`, `MAX_WHATS_NEW_BODY_LENGTH`.

### 4.3 The traps, each one hit while planning

1. **A deletion orphans private code, and Biome is the detector.** `noUnusedVariables` and
   `noUnusedFunctionParameters` fail the build on the orphan, so `npx biome check . --error-on-warnings`
   after each deletion names what else must go. This found `perfStorage`, `createTimingAnimation`,
   `DEFAULT_TIMING` and a stale `perf` parameter. Run the sweep again after each step: it reached a
   depth of 3 once.
2. **Deleting an export whose initialiser does the work would break the app.** `stores/bootstrap.ts`
   ends `export const didBootstrapFromCache = bootstrapFromCache();`, and that CALL is what hydrates
   the launch before React renders. `device/tls13.ts` is the same shape. Both keep the call and lose
   only the export.
3. **`tsc --noEmit` is the red signal for a deletion.** It names every test file that referenced the
   symbol, with line numbers. Run it right after the production edit, before touching a test.
4. **A scratch worktree runs a different build from the main checkout.** `.env` is gitignored, so a
   worktree has no `EXPO_PUBLIC_ENV`. That is harmless for this plan's suites but it is why an audit
   run can differ from a local one.
5. **An empty anchor file counts in the thousands, not zero.** `sed` with a bad path writes nothing,
   and an empty string matches between every character: three anchors read 33241, 33241 and 23264
   while the plan was being written. The pre-flight checks for it explicitly.
6. **`git checkout --` on a file undoes an earlier step's deletion.** Restoring `shared/time.ts`
   after a break test silently brought `getSecondsBetween` back, and the new guard caught it. Use
   the break script's own copy-and-restore, never a blanket checkout.
7. **The coverage gate reads any committed `*.test.ts` as a source file needing 100% coverage,
   wherever it sits.** `scripts/check-changed-coverage.js` has no `ai/` entry in its `UNMEASURED`
   list, so the plan's own copy of the guard is carried as `unusedExports.test.ts.txt` and step 1
   copies it into place. A `.test.ts` committed under `ai/plans/` fails the hook with
   `not measured. Add its folder to collectCoverageFrom, or to UNMEASURED with a reason`.

### 4.4 Existing tests that change, and why

| Suite | What changes | What must NOT change |
| --- | --- | --- |
| `shared/__tests__/constants.test.ts` | the `ISTIJABA_INDEX` `describe` goes | every other constant's assertions |
| `shared/__tests__/time.test.ts` | the `getSecondsBetween` `describe` goes | the countdown-contract tests below it |
| `shared/__tests__/perf.test.ts` | `perfFlush` and `getPerfRing` repoint onto the persisted snapshot | all 14 tests keep their names and what they prove |
| `shared/__tests__/perfBackgroundFlush.test.ts` | one `getPerfRing` read becomes a `readFlushed()` read | the flush-reason assertions |
| `device/__tests__/androidChannelUpdate.test.ts` | the `openAppSettings` `describe` goes | the `openDndAccessSettings` and `updateAndroidChannel` tests |
| `components/modals/__tests__/Help.test.tsx` | 2 `openAppSettings` negative assertions and its mock entry go | every `openDndAccessSettings` assertion |
| `device/__tests__/tls13.test.ts` | asserts the log line rather than a returned string | all 4 cases keep their names |
| `stores/__tests__/bootstrap.test.ts` | 10 boolean assertions go | the `setSequence` and `startCountdowns` assertions that prove the same thing |
| `stores/__tests__/database.test.ts` | 4 `describe` blocks go | every other database test |
| `stores/__tests__/notifications.test.ts` | 2 `describe` blocks go; the bulk-wipe guard spies on `clearPrefix` | that the guard still proves no bulk wipe happens |
| `stores/__tests__/schedule.test.ts`, `syncUnreadableDay.test.ts`, `countdownMidnight.test.ts` | 45 `getDisplayDate(` calls become `displayDateOf(` over the atoms | every expected date string |
| `stores/__tests__/ui.test.ts` | 4 accessor tests go | every atom and preference test |
| `components/prayer/__tests__/Alert.test.tsx` | 7 reads become `getDefaultStore().get(alertSheetStateAtom)` | this is the reference suite in `__tests__/README.md`: its structure and test names stay |
| `hooks/__tests__/imperativeAnimations.test.ts` | the opacity `describe` goes, the paired tables narrow | every `useAnimationScale` assertion |
| `stores/__tests__/widgetAndroid.test.ts` | step 7 pins its clock | all 10 tests keep their names |

## 5. Design

**The invariant, one sentence a test can check:** every exported symbol in `app/`, `components/`,
`shared/`, `stores/`, `hooks/`, `device/`, `api/`, `assets/`, `modules/` and `widgets/` is reachable
from production code by an import, or is named in the allow-list with the mechanism that reaches it.

**The approach.** Fix the measurement, then delete in six batches grouped by file so each commit is
reviewable, then leave the measurement running as a test. A deletion is complete only when the sweep
and Biome both report nothing new, which is what makes the private orphans part of the same commit.

**Why a doorway's tests repoint rather than disappear.** The owner's rule is to delete unused code
and its tests together. A doorway is the case that looks like an exception and is not: the test
covers live code (an atom the app renders, a snapshot the app persists), and the dead accessor is
only how it got there. Deleting the test would delete coverage of something live, so the test moves
onto the live thing directly. The planning session proved every one of these repoints green, which is
why the owner's rule applies to all 27 with no exceptions beyond the five allow-listed.

**The alternatives rejected:**

| Rejected | Why |
| --- | --- |
| Sweep the row's original 18 | The count was wrong. 9 more were dead and the script could not see them |
| Keep the 5 doorway symbols | The owner's ruling, and the spike proved their tests repoint with no loss |
| A Biome rule instead of a test | Biome has no rule for an export nobody imports; `noUnusedImports` only sees imports |
| Delete the whole allow-list and sweep uniformly | `ErrorBoundary` is called by file convention, so deleting it breaks the error screen. The `MAX_WHATS_NEW_*` limits constrain the copy in a file, not runtime behaviour, so a test is their only possible caller |
| Delete a symbol without its private orphans | Biome fails the build on them, and it is the same debt one level down |
| One commit for the whole sweep | 1,561 deleted lines across 31 files is not reviewable in one diff |

**The design review, by this planning session, reading its own design cold.** Four findings, all
fixed before the steps were written:

1. *"A deletion is not proven by a green suite: coverage could fall and still pass a per-file gate."*
   So each step's acceptance names the four 100% lines, and the whole sweep was run end to end in the
   scratch worktree: 176 suites, 4748 tests, 100% statements, branches, functions and lines.
2. *"The plan assumes the orphan chain stops at depth 1."* It does not. The step order now runs the
   sweep AND Biome after each deletion, and step 6 carries a chain of depth 3.
3. *"A doorway repoint could weaken what a test proves while staying green."* So each repoint names
   the live target and the reason it is equivalent, and section 4.4 lists what must not change. The
   bulk-wipe guard actually got stronger: spying on `clearPrefix`, the single primitive all four
   wrappers called, catches a bulk wipe however it is spelled, and after the deletions `clearPrefix`
   has exactly one production caller.
4. *"Nothing proves the new guard would catch a real orphan."* So step 1 carries three breaks, run
   while planning: a planted dead export, a removed allow-list entry, and a stale allow-list entry
   naming a live symbol. All three failed the guard.

**The concurrency trace.** None. No step changes runtime behaviour, scheduling, storage or any
asynchronous path. The two side-effect modules keep their calls in the same place in the import
order, verified by `__tests__/app/_layout.test.tsx` passing unchanged.

**Measured in the scratch worktree** (`~/athan-device-sweep/worktrees/plan-34`, at `6c3956ef`):

| Reading | Before | After |
| --- | --- | --- |
| `yarn validate` | green, but 1 intermittent failure (step 7's bug) | green |
| Test suites | 175 | 176 |
| Tests | 4785 | 4750 |
| Statements | 100% (4428) | 100% (4359) |
| Branches | 100% (1978) | 100% (1957) |
| Functions | 100% (922) | 100% (901) |
| Lines | 100% (3988) | 100% (3928) |
| Sweep reports | 27 unreachable | 5, all allow-listed |
| Net lines | | 305 added, 1561 deleted |

## 6. Steps

- [ ] Step 1: Replace the sweep script and add the standing guard (specified)
- [ ] Step 2: Delete four dead symbols in `shared/` (specified)
- [ ] Step 3: Delete three dead symbols in `device/` and `stores/bootstrap.ts` (specified)
- [ ] Step 4: Delete seven dead symbols in `stores/database.ts` and `stores/notifications.ts` (specified)
- [ ] Step 5: Delete five dead symbols in `stores/schedule.ts` and `stores/ui.ts` (specified)
- [ ] Step 6: Delete the animation chain, the two stored types and the reference file (specified)
- [ ] Step 7: Pin `widgetAndroid.test.ts`'s clock (specified)

Each step file is in `steps/`. Read the step file, not this list.

- `steps/1-sweep-script-and-guard.md`
- `steps/2-shared.md`
- `steps/3-device-and-bootstrap.md`
- `steps/4-database-and-notifications.md`
- `steps/5-schedule-and-ui.md`
- `steps/6-animation-types-and-reference-file.md`
- `steps/7-widget-android-clock.md`

## 7. Device proof

None. No step changes anything the phone does: no notification, no alarm, no widget, no visual and
no stored value. Every deletion is of code nothing calls, and the two side-effect modules keep their
calls unchanged. The proof is `yarn validate` at 100% plus the sweep reporting only the allow-list,
both of which the executor runs itself.

The phone is not touched, so it is left exactly as it was: the mock build it already carries, with
automatic time on.

## 8. Records

### Findings text

Append to `ai/features/uat-2/AUDIT-FINDINGS.md` under the exact heading
`## Session 34: the dead-code sweep, and the measurement that was wrong`:

```markdown
## Session 34: the dead-code sweep, and the measurement that was wrong

**27 exported symbols were unreachable from production code, not the 18 the row was queued with.**
Each sat at 100% coverage because its own tests called it, so every gate reported it healthy while
nothing on screen used it. Deleting them orphaned 6 private symbols and one 791-line reference
file: <LINES_DELETED> lines deleted against <LINES_ADDED> added.

**The queued count was wrong because the committed script had three blind spots**, and correcting it
was step 1. It counted a bare identifier, so a different symbol with the same name read as a caller:
THREE symbols are named `clearAllScheduledRemindersForPrayer`, and the two live ones hid the dead
one. It counted a name mentioned in its own JSDoc, which hid 8 more. And `mocks/` was outside its
scan. The replacement resolves by import graph, through `@/` aliases, relative specifiers,
`require()` and barrel re-exports, with comments stripped before the search, and it is verified in
both directions with planted canaries.

**DURABLE LESSON: a guard that under-reports is worse than no guard, because it is trusted.** The
row was queued from that script's output and would have left 9 dead symbols behind while reporting
the sweep complete. The standing guard is therefore a test, `shared/__tests__/unusedExports.test.ts`,
running inside `yarn validate` at 0.5 seconds, with an allow-list that names the mechanism reaching
each kept symbol. Its own three breaks were run before it was trusted: a planted dead export, a
removed allow-list entry, and a stale entry naming a live symbol, all three caught.

**DURABLE LESSON: a deletion runs to a fixpoint, and Biome is the detector.** Removing an export
orphans the private helpers that served only it, and `noUnusedVariables` fails the build on them, so
`biome check . --error-on-warnings` after each deletion names what else must go. The chain reached
depth 3: `useAnimationOpacity`, then `createTimingAnimation`, then `DEFAULT_TIMING`.

**The trap that would have broken the app: an export whose INITIALISER does the work.**
`stores/bootstrap.ts` ended `export const didBootstrapFromCache = bootstrapFromCache();`, and that
call is what hydrates the prayer sequences before React renders. `device/tls13.ts` had the same
shape. Deleting the export naively deletes the call. Both keep the call and lose only the name.

**Five symbols that looked like exceptions were not.** `getDisplayDate` (45 assertions),
`getPerfRing` (17), `perfFlush` (5), `getAlertSheetState` (7) and `didBootstrapFromCache` (10) each
had tests that seemed load-bearing. The owner ruled that unused code and its tests go together, and
was right: every one was a DOORWAY onto live code, so its tests repoint onto the atom or the
persisted snapshot the app itself uses, and the coverage moved rather than vanishing. One repoint
came out stronger, the bulk-wipe guard now spying on `clearPrefix`, the single primitive all four
deleted wrappers called, which catches a bulk wipe however it is spelled.

**A SECOND breach of ISSUES #41 was found on clean `uat-2` and fixed here** (ISSUES #44):
`stores/__tests__/widgetAndroid.test.ts`'s minute-flip test seeded today's prayers at fixed wall
times and advanced 61 seconds, so whenever the suite ran inside the final minute before a seeded row
the advance sailed past the countdown target, the re-arm took its null branch, and no reload
happened. Proven deterministically: pinned to 22:44:33 it fails, pinned to 22:35:00 it passes, on
identical code. It was not caused by this session and it blocked every commit inside that window.

**Kept, allow-listed:** `ErrorBoundary`, called by Expo Router by file convention, so deleting it
breaks the error screen; and the four `MAX_WHATS_NEW_*` limits, which constrain the COPY in
`shared/whatsNew.ts` and are enforced only at test time, so a test is their only possible caller.

**Measured:** <SUITES_AFTER> suites, <TESTS_AFTER> tests, 100% on statements, branches, functions
and lines. The sweep reports 5 symbols, all allow-listed. No device proof: no step changes anything
the phone does.
```

Placeholders the executor fills from its own runs: `<LINES_DELETED>`, `<LINES_ADDED>`,
`<SUITES_AFTER>`, `<TESTS_AFTER>`.

### Table rows

The executor sets the `ai/plans/README.md` row 34 status to `EXECUTED`.

For the auditor to apply on PASS, the row 34 status cell becomes:

```
DONE 2026-09-27 (<FIRST_VERSION> to <LAST_VERSION>). **The row was queued saying 18 dead exports and the true count was 27**, because the committed sweep script counted a bare identifier (three symbols share the name `clearAllScheduledRemindersForPrayer`, and the two live ones hid the dead one), counted a name mentioned only in its own JSDoc (8 symbols, including all four `MAX_WHATS_NEW_*`), and left `mocks/` outside its scan. The script now resolves by import graph and is verified in both directions with planted canaries. Deleting the 27 orphaned 6 private symbols and `mocks/timing-system-schema.ts`, a 791-line reference document nothing imported: <LINES_DELETED> lines deleted against <LINES_ADDED> added, ending at <SUITES_AFTER> suites / <TESTS_AFTER> tests / 100% on all four measures. **DURABLE LESSON: a guard that under-reports is worse than none, because it is trusted** — this row would have closed with 9 dead symbols still in the tree. The standing guard is `shared/__tests__/unusedExports.test.ts`, inside `yarn validate` at 0.5s, with an allow-list naming the mechanism that reaches each kept symbol; its three breaks were run before it was trusted. **A deletion runs to a FIXPOINT and Biome is the detector**: `noUnusedVariables` fails the build on each orphaned helper, and the chain reached depth 3 (`useAnimationOpacity`, `createTimingAnimation`, `DEFAULT_TIMING`). **The trap that would have broken the app is an export whose INITIALISER does the work**: `stores/bootstrap.ts` ended `export const didBootstrapFromCache = bootstrapFromCache();` and that call hydrates the sequences before React renders, `device/tls13.ts` likewise, so both keep the call and lose only the name. The owner ruled that unused code and its tests go together, against this session's own recommendation to keep five, and was right: each of those five was a DOORWAY onto live code, so 84 assertions repointed onto the atoms and the persisted snapshot the app itself uses and the coverage moved rather than vanishing, with the bulk-wipe guard coming out stronger by spying on `clearPrefix`. `ErrorBoundary` is kept as a false positive (Expo Router calls it by file convention) and the four `MAX_WHATS_NEW_*` as test-time content limits. **A second breach of ISSUES #41 was found on clean `uat-2` and fixed here as ISSUES #44**: `widgetAndroid.test.ts` seeded fixed wall times and advanced 61s, so a run inside the final minute before a seeded row sailed past the target and saw no reload, proven by pinning the clock to 22:44:33 (fails) against 22:35:00 (passes) on identical code | `<DOCS_SHA>` | nothing
```

The `ai/prompts/README.md` change, for the auditor to apply on PASS: add this section after
"Decided by the owner, 2026-09-27, while planning session 33":

```markdown
## Decided by the owner, 2026-09-27, while planning session 34 (the dead-code sweep)

- **Unused code and its tests are deleted together, with no exception for a test that looks
  load-bearing.** Offered five symbols the planning session wanted to keep because their tests
  carried real assertions, the owner refused the premise: 🐋  "I don't understand what you said.
  Okay, you said we were using it in tests, but what's the point if we're testing that could?
  What's the point? If we're testing code that is not being actually used anywhere. What's the
  point? I don't get it. I'm so confused. If the code is not being used, but we're testing the code,
  then we should delete the code and the tests." The session then proved the ruling correct: each of
  the five was a DOORWAY onto live code, so its 84 assertions repointed onto the atom or the
  persisted snapshot the app itself uses and the coverage moved rather than vanishing. One came out
  stronger. The rule now governs any future sweep.
- **The sweep's own measurement is fixed before it is trusted.** The row was queued saying 18 dead
  exports; the true count was 27. 🐋  the recommended option, "Fix the script first, then sweep 27".
  A guard that under-reports is worse than none, because it is trusted.
- **The standing guard is a Jest test inside `yarn validate`**, not a manual script and not a
  pre-push check, so the commit that creates an orphan is the commit that fails.
- **Five symbols are kept, allow-listed**: `ErrorBoundary`, which Expo Router calls by file
  convention, and the four `MAX_WHATS_NEW_*` limits, which constrain the copy in a file and are
  enforced only at test time.
- **A deletion runs to a fixpoint.** 🐋  "Delete the hook and its now-orphaned helpers". A private
  helper left with no caller is the same debt one level down, and Biome fails the build on it anyway.
- **"Cascade" never describes dead code in this repository.** The word named the date-roll cascade
  animation first, and the planning session's phrase "the cascade" read as a threat to it. Write
  "chain of dead code". The cascade animation was never touched: `useDerivedOpacity`,
  `useDerivedColor`, `useDerivedFill`, `ANIMATION.cascadeDelay` and `getCascadeDelay` are all kept.
```

### ISSUES entry

Add to `ai/ISSUES.md` at the end of section E, for step 7:

```markdown
- **#44 (FIXED 2026-09-27, session 34): `widgetAndroid.test.ts` failed for part of every hour, and
  ISSUES #41's rule is the reason.** `stores/__tests__/widgetAndroid.test.ts`'s "reloads the home
  kinds at a minute flip" seeded today's prayers at FIXED wall-clock times (the last at 22:45) and
  advanced 61 seconds. `msUntilMinuteFlip` arms its timer at `(msRemaining % 60000) + 250`, so
  whenever the suite ran with under 61 seconds to the next seeded row, the 61-second advance sailed
  PAST the countdown target, the re-arm took its null branch, and no kind reloaded. Proven
  deterministically by pinning the clock: 22:44:33 fails, 22:35:00 passes, on identical code. Found
  by a planning session whose scratch-worktree baseline failed on clean `uat-2`, so it was never
  caused by the session that found it, and it blocked every commit inside the window. Fix: pin the
  clock with `jest.useFakeTimers({ now: london(SEEDED_DAY, '09:00') })` before seeding, exactly as
  #41's rule requires. DURABLE LESSON: #41 was closed by fixing five tests in one file, and the same
  shape was sitting in another file the whole time. The tell is a test that seeds a fixed wall-clock
  time and then advances the clock by a bounded amount.
```

### Docs commit

`<VERSION> - docs(plans): session 34 executed: 27 dead exports removed, the sweep corrected and guarded`

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session
pushes `uat-2` after a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| An anchor counts 0 | `uat-2` moved since `6c3956ef` | NEEDS REPLAN (section 2.2, item 1) |
| An anchor counts more than 1 | the excerpt is not unique any more | NEEDS REPLAN |
| The pre-flight prints `EMPTY ANCHOR` | the anchor file is empty, so its count is meaningless | NEEDS REPLAN (section 2.2, item 2) |
| `tsc` names a test file the step does not list | that suite also used the symbol | STOP, section 2.2 item 3. The plan's file list is wrong |
| Biome reports an unused private symbol after a deletion | the fixpoint is not reached | Delete it in the SAME commit if the step lists it, else STOP (section 2.2, item 6) |
| The sweep reports a symbol the plan does not list | `uat-2` moved, or a deletion orphaned something new | STOP, section 2.2 item 5 |
| Coverage falls below 100% | a repoint dropped an assertion the deleted test carried | STOP. Never add an ignore comment |
| A repointed test fails | its live target answers differently from the accessor | STOP, section 2.2 item 7 |
| `versionLockstep.test.ts` fails | the three version numbers differ | Set all three to the step's version and commit again |
| The hook fails only on `audioMatrix.test.ts` timing out | the machine is busy | `EXECUTOR-BRIEF.md` section 3: wait for the load to fall, up to 3 times |
| `widgetAndroid.test.ts` fails before step 7 | this is ISSUES #44, and it is time-dependent | Expected. Step 7 fixes it. If it blocks an earlier step's commit, run step 7 first and note the reorder in `LOG.md` |
| Anything else | | `EXECUTOR-BRIEF.md` section 7 |

### Anticipated review fixes

Given word for word. These are the only fixes the executor may make to anything this plan fixed. A
finding meeting all three conditions in `EXECUTOR-BRIEF.md` section 4, item 8, the executor applies
itself and records in `LOG.md`.

1. **A deleted symbol's name left in a comment.** Delete the sentence naming it. Where the sentence
   carries a reason that still holds, rewrite it without the name and keep it to one line.
2. **An import left with no remaining use after a deletion.** Remove the name from the import
   clause, and remove the whole import statement when nothing is left in it.
3. **A section banner left with nothing under it**, such as `// ===== PLATFORM-SPECIFIC =====` once
   `PLATFORM` goes. Delete the banner and its two rule lines.
4. **A `describe` block left empty after its tests go.** Delete the `describe` and its blank line.
5. **A test name that still says what the deleted symbol did.** Rename it to name the live thing it
   now reads, in the present tense, keeping what it proves identical.
6. **A local helper added by a repoint that duplicates one already in the file.** Use the existing
   one and delete the new one.

### Stopping part-way

| Step | Restore with `git checkout --` | Delete if it exists |
| --- | --- | --- |
| 1 | `scripts/find-unused-exports.py`, `app.json`, `package.json` | `shared/__tests__/unusedExports.test.ts` |
| 2 | `shared/constants.ts`, `shared/time.ts`, `shared/perf.ts`, `shared/__tests__/constants.test.ts`, `shared/__tests__/time.test.ts`, `shared/__tests__/perf.test.ts`, `shared/__tests__/perfBackgroundFlush.test.ts`, `app.json`, `package.json` | nothing |
| 3 | `device/notifications.ts`, `device/tls13.ts`, `stores/bootstrap.ts`, `device/__tests__/androidChannelUpdate.test.ts`, `device/__tests__/tls13.test.ts`, `components/modals/__tests__/Help.test.tsx`, `stores/__tests__/bootstrap.test.ts`, `app.json`, `package.json` | nothing |
| 4 | `stores/database.ts`, `stores/notifications.ts`, `stores/__tests__/database.test.ts`, `stores/__tests__/notifications.test.ts`, `app.json`, `package.json` | nothing |
| 5 | `stores/schedule.ts`, `stores/ui.ts`, `stores/__tests__/schedule.test.ts`, `stores/__tests__/syncUnreadableDay.test.ts`, `stores/__tests__/countdownMidnight.test.ts`, `stores/__tests__/ui.test.ts`, `components/prayer/__tests__/Alert.test.tsx`, `app.json`, `package.json` | nothing |
| 6 | `hooks/useAnimation.ts`, `shared/types.ts`, `mocks/timing-system-schema.ts`, `hooks/__tests__/imperativeAnimations.test.ts`, `app.json`, `package.json` | nothing |
| 7 | `stores/__tests__/widgetAndroid.test.ts`, `ai/ISSUES.md`, `app.json`, `package.json` | nothing |

Then follow `EXECUTOR-BRIEF.md` section 4a: drop the step branch, and leave the tree holding only
`ai/plans/README.md` and this folder's `PLAN.md` and `LOG.md`.

## 11. Subagents in this plan

None. This session does its own planning, execution, review and audit (owner, 2026-09-26). No step
reads an image, so `vision` is not needed either.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from
`date '+%H:%M:%S %d.%m.%Y'`, then gives:

- what changed, in a few plain sentences: how many symbols went, the lines deleted against added,
  and that the guard now fails the commit that creates an orphan;
- the corrected count against the row's 18, and why the old script under-reported;
- the progress table (format in `EXECUTOR-BRIEF.md` section 6);
- ISSUES #44, found on clean `uat-2` and fixed in step 7;
- any decision now waiting on the owner (expected: none);
- the four-line handoff from the `athan-next` skill, section 5.
