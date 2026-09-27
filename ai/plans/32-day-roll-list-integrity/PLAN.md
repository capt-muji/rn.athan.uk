# Plan: Session 32. ISSUES #27, the day roll: a list day on screen always holds every one of its rows

| Field | Value |
| --- | --- |
| Brief | `ai/ISSUES.md` #27 + the owner's instruction of 2026-09-27 |
| Planned at | `aeb985d5` (version 1.29.32), 2026-09-27 |
| Planned by | Planning session on 2026-09-27 |
| Needs first | nothing |
| Steps | 2, each one branch, one commit, one version |
| Device | none (see section 7) |
| Owner decisions still needed | None (every one was taken while planning; see section 2) |

## 1. Goal

`ai/ISSUES.md` #27 has been OPEN since 2026-09-10: after the sequence cascaded past the final prayer of one day
into the next, the prayer list rendered only the new day's Isha row, with Fajr through Magrib entirely absent while
the countdown and the date header stayed correct. The issue says its root cause was never found, and the owner asked
whether it is still an issue.

**It is not, and this plan proves why rather than asserting it.** The defect was real, it was reproduced in this
planning session against the code as it stood on 2026-09-10, and it was fixed as a side effect of the dashes work of
2026-09-13 (`da39c9c8` onward). What is missing today is not the fix: it is a test that fails when the fix is
removed by the shape the owner actually saw. The suite's 13 guards over that line all describe the UNREADABLE-DAY
rule (R8); not one describes a day roll with every row readable, which is what #27 was. So the line is guarded
incidentally, and an engineer refactoring `filterRelevantPrayers` reads 13 failures about missing provider data and
has no way to learn that a day roll depends on the same line.

When this plan is DONE: one named invariant test covers the day roll with fully readable data, it is red against the
2026-09-10 behaviour, and `ai/ISSUES.md` #27 is CLOSED with its root cause named and its fix commit identified. The
owner would notice nothing in the app, because nothing in the app changes.

**The owner's rules that apply:**

- 🐋  "Don't ask me questions, make assumptions, and then clearly list out those assumptions at the end." (owner,
  2026-09-27, carried from session 29 and repeated for this session.) Every assumption is in section 2.1 and in the
  final report.
- 🐋  "the comments should be extremely compact, and they should only explain the why, and they should never explain
  the how or the what, because those two should be self-explanatory from your code." (owner, 2026-09-26.)
- 🐋  "a test should not be based on what time of date being run. Our test should be mocking the time... everything
  should be mocked so that we can properly test the scenarios." (owner, 2026-09-27, ISSUES #41.)
- 🐋  "I would rather you use the iPhone simulator rather than the real device that you have connected right now"
  (owner, 2026-09-27). No phone is touched; section 7 explains why not even the simulator is needed.
- **Never copy, average or synthesise a prayer time** (owner, 2026-09-13, absolute). The new test's fixture times are
  a synthetic LATITUDE, never a substituted London time: see assumption A4.

## 2. Decisions

### 2.1 Taken

1. **#27 is a REGRESSION TEST session, not a fix session.** Decided by the planning session on the evidence in
   section 5: the defect reproduces 562 times against the 2026-09-10 algorithm and zero times against today's, over
   1440 download minutes, 20,000 randomised states and the whole real London year. There is nothing left to fix, so
   proposing a code change would be inventing a problem. Recorded here and in `AUDIT.md`.
2. **The test goes in `stores/__tests__/schedule.test.ts`, under "on the real builder".** That describe already runs
   the real stores, the real list builder and the real sequence rules over stored London days with a driven clock,
   which is exactly the machinery #27 ran through. A new file would duplicate ~150 lines of harness.
3. **The fixture is a synthetic high-latitude day set, not a London one.** London cannot express #27's shape: every
   London day's rows precede the next day's, so no list day is ever on screen while a LATER day's rows have passed.
   The shape needs day N's Isha after day N+1's Fajr, which the midnight-crossing pair makes real above about 60N
   (`shared/prayer.ts`, `magribCrossesIntoNextDay`: "Reykjavik 00:03, Nome 01:48 on 21 June"). Assumption A4 records
   that this is a latitude the app is designed for in v2.0, not an invented London time.
4. **The test asserts the INVARIANT, not a row list.** "Whenever a list day is on screen, the sequence holds every
   one of its rows" is the one sentence #27 violated, and it is what a future refactor needs told. A fixed expected
   array would pass while holding four of six rows if the expectation were edited to match.
5. **`ai/ISSUES.md` #27 moves to FIXED with its cause and its fix commit**, in step 2. An OPEN issue whose cause is
   known and whose fix shipped is worse than no issue: the next session re-investigates it from scratch, which is
   what this session nearly did.
6. **No code in `stores/schedule.ts`, `shared/sequence.ts` or any component changes.** Planner's decision, from
   decision 1. The step's review checklist and the break script both depend on this.

### 2.2 The executor must not decide

1. Any anchor count other than 1: STOP. Ask "The anchor `<file>` counts `<n>`, not 1. Has `stores/schedule.ts`
   changed since `aeb985d5`?"
2. A test failing that this plan does not expect: STOP. Ask "`<test name>` failed and the plan does not predict it.
   The failure line is `<line>`. What should it be?"
3. A break printing `BREAK NOT APPLIED`: STOP. Ask "The break `<label>` changed nothing, so the plan's substitution
   does not match `stores/schedule.ts`. Has that file changed since `aeb985d5`?"
4. **The new test passing BEFORE the break script runs is expected** (it guards existing behaviour, which is
   correct today). The red proof for this step is the break script, not a pre-change failure: part 4 says so
   explicitly. If either break leaves the new test GREEN, STOP and ask "The break `<label>` left
   `<test name>` green, so it does not guard the day roll. What should it be?"
5. A reviewer finding this plan's section 10 does not answer and that does not meet all three conditions in
   `EXECUTOR-BRIEF.md` section 4, item 8: STOP.
6. Anything the step does not answer that would otherwise be a decision: STOP, with "The plan does not say `<X>`.
   What should it be?"
7. Anything touching visuals, prayer times, a hand-edited release file, `uat` or EAS: STOP.

## 3. Pre-flight

Save to `$TMPDIR/preflight-32.sh` and run `bash $TMPDIR/preflight-32.sh <k>`, where `<k>` is the first step in
section 6's checklist not ticked DONE (1 for a new plan).

```bash
#!/usr/bin/env bash
set -u
STEP="${1:-1}"
REPO=/Users/muji/repos/rn.athan.uk
cd "$REPO" || { echo "FAIL: cannot cd to $REPO"; exit 1; }

[ "$(pwd -P)" = "$REPO" ] || { echo "FAIL: wrong checkout $(pwd -P)"; exit 1; }
[ "$(git branch --show-current)" = "uat-2" ] || { echo "FAIL: not on uat-2"; exit 1; }

DIRTY=$(git status --porcelain | grep -v -E 'ai/plans/README.md|ai/plans/32-day-roll-list-integrity/(PLAN|LOG).md' || true)
[ -z "$DIRTY" ] || { echo "FAIL: unexpected changes:"; echo "$DIRTY"; exit 1; }

git fetch -q origin uat-2
git merge-base --is-ancestor origin/uat-2 uat-2 || { echo "FAIL: uat-2 is not ahead of origin/uat-2"; exit 1; }

VERSION=$(node -p "require('./package.json').version")
echo "package.json version: $VERSION"
node -e 'const [a,b,c]=require("./package.json").version.split(".").map(Number);
  const ok = a>1 || (a===1 && (b>29 || (b===29 && c>=32)));
  if (!ok) { console.error("FAIL: version below the planned-at 1.29.32"); process.exit(1); }' \
  || exit 1

# Needs first: nothing, so no row is checked here

if [ "$STEP" -le 1 ]; then
  COUNT=$(python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
    ai/plans/32-day-roll-list-integrity/scripts/anchors/1-1.txt stores/schedule.ts)
  echo "anchor 1-1 count: $COUNT"
  [ "$COUNT" = "1" ] || { echo "FAIL: anchor 1-1 counts $COUNT, not 1 -> NEEDS REPLAN"; exit 1; }
fi

SUITE=stores/__tests__/schedule.test.ts
[ -f "$SUITE" ] || { echo "FAIL: $SUITE missing"; exit 1; }
grep -q "describe('on the real builder'" "$SUITE" || { echo "FAIL: 'on the real builder' describe missing"; exit 1; }

node -e 'const v=require("./node_modules/jest/package.json").version; console.log("jest "+v);'
echo "PREFLIGHT OK"
```

Expected output, in order: `package.json version: 1.29.32` (or higher), `anchor 1-1 count: 1`, a `jest 30.x` line,
then `PREFLIGHT OK`. An anchor count other than 1 means NEEDS REPLAN. Any other failure means STOP.

No device tool is checked, because no step touches a device (section 7).

## 4. Background the executor needs

### Code map

| File | What it does |
| --- | --- |
| `stores/schedule.ts` | Holds each schedule's sequence and applies the pure rules to it. `filterRelevantPrayers` decides which rows a refresh keeps; `refreshSequence` calls it on every boundary |
| `shared/sequence.ts` | The pure rules: `resolveDisplayDate` (which list day is on screen), `findNextReadable`, `getDisplayHoldEnd`, `isRowPassed` |
| `shared/prayer.ts` | Builds rows. `adjustPrayerDateForMidnightCrossing` moves a small-hours Isha or Magrib INSTANT to the next calendar day, and `calculateBelongsToDate` moves its list day back: a matched pair |
| `components/prayer/List.tsx:33` | `prayers.filter((p) => p.belongsToDate === displayDate)`, the render that showed one row |
| `hooks/usePrayer.ts:85`, `hooks/useSchedule.ts:105` | The same filter, for a single row and for the schedule view |
| `stores/countdown.ts:311` | `startSequenceCountdown`: on a boundary it calls `refreshSequence`, then restarts |
| `stores/__tests__/schedule.test.ts` | 108 tests. Its "on the real builder" describe (line 1035 on) runs the real stores, builder and rules over stored London days with a driven clock |

**The anchor**, `scripts/anchors/1-1.txt`, at `stores/schedule.ts:391` at "Planned at":

```ts
function filterRelevantPrayers(
  prayers: Prayer[],
  now: Date,
  currentDisplayDate: string | null,
  previous: ReadablePrayer | null
): Prayer[] {
  return prayers.filter((prayer) => {
    if (isReadable(prayer) && prayer.datetime > now) return true;
    if (previous && prayer.belongsToDate >= previous.belongsToDate) return true;
    return currentDisplayDate !== null && prayer.belongsToDate >= currentDisplayDate;
  });
}
```

Step 1 does NOT change this file. The anchor exists so the executor can prove the line the new test guards is still
the line the break script mutates.

### How the pieces interact

| Path | What happens | Reaches `filterRelevantPrayers`? |
| --- | --- | --- |
| Cold launch | `stores/bootstrap.ts` hydrates both sequences with `setSequence`, then `startCountdowns` | No: `setSequence` rebuilds from storage |
| Countdown tick past a boundary | `startSequenceCountdown` calls `refreshSequence(type)`, then restarts itself | **Yes** |
| Return from the background | `device/listeners.ts` calls `resyncCountdowns`, which calls `refreshSequence` for any boundary already passed, then `sync()` | **Yes** |
| Post-sync | `sync()` calls `setSequence` for both schedules | No |
| Background task | `sync()` again | No |

So the ONLY way a row leaves a sequence without a rebuild is `refreshSequence`, and the only decision it makes about
keeping a row is `filterRelevantPrayers`. That is why one line carries the whole defect.

### Existing tests that cover this code

`stores/__tests__/schedule.test.ts`, 108 tests. Thirteen fail when `>= currentDisplayDate` becomes
`=== currentDisplayDate` (measured, section 5), and every one of the thirteen is about a day with NO READABLE ROW:

| Test | What it proves |
| --- | --- |
| `R8: two list days with no readable row each hold for their own day` | An unreadable day comes on at its own 00:00 |
| `R8 on Extras: a Friday ending at Istijaba keeps its list until 00:00 before a Saturday with none` | The same on Extras |
| `keeps the 25th's lists on the same shapes: Extras until its 00:00, Standard until its 01:30 Isha` | A clock-change day |
| `keeps the 17th on screen after its Isha with --:-- and no bar, then brings the 18th on at 00:00` (x2) | R8's hold, with the bar |
| `stays until 00:00 London at its end, then moves to the 19th on exactly the 00:00:00.000 tick` (x2) | The handover tick |
| `catches up both 00:00s crossed while suspended when the app returns` (x2) | Two 00:00s in one resume |
| `opens a passed row of the waiting 17th on the unreadable 18th, and a row of the 18th on the 19th` (x2) | The overlay's occurrence |
| `closes an open overlay 2 seconds before 00:00 and refuses to open inside that window` (x2) | The overlay's deadline |

Not one of them puts a day roll with every row readable through a refresh. That is the gap this plan closes.

### Why the obvious simple fix is wrong

There is no fix to make. The obvious WRONG move is to "harden" `filterRelevantPrayers`, for instance by keeping
every row of every list day the sequence holds. That trades a closed bug for an open one: the function's whole job
is to bound memory as the app runs for days, and `refreshSequence` runs on every boundary. Section 5 records it as a
rejected alternative.

## 5. Design

**No behaviour changes. The design here is the DIAGNOSIS**, which is what the owner asked for, plus the one test
that records it.

### The invariant, as one sentence a test can check

**Whenever a list day is on screen, the sequence holds every one of that day's rows.**

### What #27 actually was

Two defects in the 2026-09-10 code compounded:

| # | The 2026-09-10 code | Why it was wrong |
| --- | --- | --- |
| a | `displayDate` = `sequence.prayers.find((p) => p.datetime > now)!.belongsToDate`: the first row in ARRAY order whose instant is future | The array was sorted by INSTANT. A small-hours Isha's instant sits inside the NEXT calendar day while its list day stays the day before, so just after a roll the first future row can belong to the OLD day |
| b | `filterRelevantPrayers` kept a passed row only when `p.belongsToDate === displayDate`, an EQUALITY | With (a) naming the old day, every row of the NEW day that had already passed was dropped, and a dropped row never came back: the refetch only adds days AFTER the sequence |

The list then rendered whatever survived, which is why the countdown and the date header stayed correct while rows
vanished: they read the next prayer and the display date, not the row set.

### Which of the two was the real defect: measured, one at a time

Run in the scratch worktree with a compressed rollover rig at a 04:30 download, with the display-date rule and the
keep test switched independently:

| Display-date rule | Keep test | List after the roll |
| --- | --- | --- |
| array order (09-10) | equality (09-10) | **5/6 rows: Sunrise, Dhuhr, Asr, Magrib, Isha** |
| array order (09-10) | `>=` (today) | 6/6 |
| `resolveDisplayDate` (today) | equality (09-10) | **5/6 rows** |
| `resolveDisplayDate` (today) | `>=` (today) | 6/6 |

**So the display-date rule was never the defect: the keep test was.** Today's `resolveDisplayDate` is better for
other reasons (it scans SORTED list days and understands unreadable days), but swapping it in alone would not have
fixed #27.

**The fix is two clauses that overlap, not one, and getting this wrong cost this plan a whole draft.** Today's
`filterRelevantPrayers` keeps a passed row by EITHER of two tests, and on the day-roll shape they keep the same
rows:

```ts
if (previous && prayer.belongsToDate >= previous.belongsToDate) return true;
return currentDisplayDate !== null && prayer.belongsToDate >= currentDisplayDate;
```

Measured on the overlap fixture (day N's Isha after day N+1's Fajr, everything readable), 4 days at 5-minute steps,
one mutation at a time:

| Mutation of today's code | Standard short-list states | Extras |
| --- | --- | --- |
| none (baseline) | 0 | 0 |
| day-roll keep becomes `===` | **0** | 0 |
| day-roll keep removed (`return false`) | **1,014** | 0 |
| `previous` keep removed | **0** | 0 |
| `previous` keep becomes `===` | **0** | 0 |
| **both keeps become `===`** | **966** | 0 |

Either clause alone holds the invariant, which is why a single-clause mutation survives: the countdown bar's
previous row sits on the earlier list day, and `>= previous.belongsToDate` therefore reaches every row of every
later day too. The 2026-09-10 code had NEITHER reach, because both of its tests were equalities against one day.
So "the equality was the defect" is true of 2026-09-10 as a whole and false of any single line today, and the break
script is written accordingly: one break removes the day-roll keep, and one reduces both to equalities.

Instrumenting the day-roll clause over the 20,000-state randomised sweep counted **3,748 rows kept by it that the
`previous` clause did not keep**, so it is not dead code; it is the clause that survives when there is no previous
row to measure from, which is exactly a sequence built after midnight.

### The reproduction, in numbers

Every figure below was measured in `~/athan-device-sweep/worktrees/plan-32` during this planning session, with the
2026-09-10 algorithm re-implemented verbatim from `8630f75d`'s own source beside today's real stores.

| Sweep | 2026-09-10 algorithm | Today's code |
| --- | --- | --- |
| Mock rig, all 1440 download minutes, ticked boundary to boundary | **562 short-list states** | 0 |
| Mock rig, the same minutes, with resume jumps of 1 to 1400 minutes | 2 distinct short shapes (5 rows, 4 rows) | 0 |
| Compressed rigs (1, 2, 5 minute spacing; 2 and 3 days) x 7 start hours x 7 refresh intervals, 8,820 states | smallest list 6/6 | 0 |
| **Real London 2024 year, 360 days x 9 launch hours** | **0** | 0 |
| Real London year, every minute of every day, three-day builds | n/a | 0 |
| Mock rig + `setSequence` re-runs + unreadable days, 480 scenarios | n/a | 0 |
| Randomised adversarial sweep: 400 seeds x 2 schedules x 25 steps, random rigs, random resume jumps, four session paths, **20,000 states** | n/a | **0** |
| High-latitude June (Isha 01:10, list day the day before), three days at 7-minute steps | n/a | 0 |
| Overlapping days (Isha 03:30 after the next day's 01:00 Fajr), three days at 5-minute steps | n/a | 0 |

Two conclusions follow, and both matter:

1. **The defect was real and is gone.** 562 reproducing states against the old algorithm, zero against today's,
   across every sweep including a 20,000-state randomised one.
2. **It could never have happened on real London data.** The whole 2024 year, at nine launch hours a day, produced
   zero short lists even under the 2026-09-10 algorithm. The bad download minutes were 04:00 to 05:56 and nothing
   else, which is inside the band `mocks/simple.ts`'s own header forbids: "To test the Magrib->Isha handoff and day
   rollover cleanly, simulate during 06:00-23:55." **Inside the supported band the old algorithm produced zero bad
   states out of 1440 minutes.** So #27 was observable only on a mock rig used outside its documented window, which
   is exactly why "not yet confirmed whether this reproduces on real data" sat in the issue for 17 days.

That is not a reason to skip the test. The shape is reachable on real data above about 60N, which v2.0 targets, and
the fix is two overlapping comparisons that a refactor can silently undo.

### The guard gap, measured

Mutating `>= currentDisplayDate` to `=== currentDisplayDate` on today's code:

- 13 of 108 tests in `stores/__tests__/schedule.test.ts` fail, and **all 13 are about a day with no readable row**;
- every readable-data sweep still passes, including the randomised one restricted to readable days, because the
  `previous` clause keeps the same rows.

So the 13 failures do not describe the day roll at all. They describe R8, the unreadable-day rule, where the
`previous` clause cannot help because an unreadable day has no readable row for the bar to measure from. That is the
whole guard gap: **the day roll's own shape is not covered by any existing test**, and the readable-data sweeps
confirm it by passing under the mutation that fails those 13.

Mutating the OTHER `>=`, `prayer.belongsToDate >= previous.belongsToDate`, to `===`: **the entire 4,372-test unit
suite passes.** That mutation is a surviving mutant today, recorded as its own open issue by step 2 and not fixed
here.

### The chosen approach

Add ONE test to `stores/__tests__/schedule.test.ts`, inside "on the real builder", that drives a day roll with every
row readable through `refreshSequence` and asserts the invariant. It uses a high-latitude fixture, because that is
the only readable shape that reaches the defect, and it asserts by comparing the rows held for the day on screen
against the rows the real builder puts on that day, so it cannot be satisfied by editing an expected array.

### Alternatives rejected

| Alternative | Why rejected |
| --- | --- |
| Change `filterRelevantPrayers` to keep more | Its job is to bound memory over days of running. Nothing is broken, so this trades a closed bug for an open one (section 4) |
| Close #27 with no test | The fix is two overlapping comparisons, and the day roll has no test of its own: the 13 tests over one of them all describe a different rule (R8), and every readable-data sweep passes under that mutation. A refactor reads those 13 and learns nothing about the day roll |
| Put the test in a new file | Duplicates ~150 lines of the "on the real builder" harness: `storeDays`, `rowsHeld`, `launchAt`, `moveClockTo`, the subscription cleanup |
| Use a London fixture | London cannot express the shape: every London day's rows precede the next day's. The test would pass against the 2026-09-10 code and prove nothing |
| Also fix the surviving `previous >=` mutant | A second finding, so a second session. Recorded in `ai/ISSUES.md` by step 2 rather than folded in here, per the standing one-finding-one-branch rule |
| Prove it on a device | Nothing here is platform-specific: it is one pure decision over a row array. Section 7 gives the reasoning in full |

### The design review

Reviewed by this planning session on 2026-09-27, reading the diagnosis back cold and attacking it:

1. **"You reproduced your OWN re-implementation of the old code, not the old code."** Fair, and it is the main risk.
   Answered by taking every line of the re-implementation verbatim from `git show 8630f75d:stores/schedule.ts`
   (`oldDisplayDate`, `oldRefresh`, `oldMerge` in the saved spikes at `~/athan-device-sweep/session32/`), and by the
   cross-check that matters: the same harness run against TODAY's real, unmodified `refreshSequence` gives zero bad
   states, and today's real code with the day-roll keep removed gives 1,014 on the same fixture. The defect tracks the
   comparison, not the harness.
2. **"Then #27 was a mock artifact, so close it and write nothing."** Rejected on the band evidence cutting BOTH
   ways: zero bad states inside the mock's supported band means it was never a real London bug, and the high-latitude
   sweep means the shape is reachable on readable data the app is designed for. A one-operator fix guarded only by
   tests about a different rule is worth one test.
3. **"Why not assert the exact six row names?"** Because that is the assertion an engineer edits when it fails. The
   invariant compares against the builder's own answer for the day on screen, so there is nothing to edit.
4. **"Is the fixture a substituted prayer time?"** No. It is a synthetic latitude, not a London time presented as
   London's. Assumption A4 states it, and the test's own doc comment says it.
5. **What the review CHANGED:** the step originally asserted a fixed row list, and item 3 replaced that with the
   builder comparison. It originally had no break for the `previous` clause; the surviving mutant was found while
   writing the break script, and it is now recorded as its own finding in step 2 rather than silently fixed.

## 6. Steps

- [x] Step 1: DONE in 5d68802d (specified)
- [x] Step 2: DONE (specified)

### Step 1: The day-roll invariant test

0. **Anchor check.** Run, from the repository root:

   ```bash
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
     ai/plans/32-day-roll-list-integrity/scripts/anchors/1-1.txt stores/schedule.ts
   ```

   Expected: `1`. Any other count means NEEDS REPLAN.

1. **Goal:** one test proves that a day roll with every row readable leaves the list day on screen holding every one
   of its rows, and it fails when `filterRelevantPrayers` stops keeping rows of a list day later than the one on
   screen (part 7's two breaks).

2. **Branch:** `git checkout -b test/32-day-roll-invariant uat-2`

3. **Files:** `stores/__tests__/schedule.test.ts` only, plus `app.json`, `package.json`, `ai/plans/README.md` and
   this folder's `PLAN.md` and `LOG.md`. **`stores/schedule.ts` is NOT changed by this step**, nor is any other
   source file.

4. **Tests first (red).** One new test in the existing suite `stores/__tests__/schedule.test.ts`, which is not new.

   It goes inside `describe('on the real builder', ...)`, as the LAST top-level child describe of that block, in a
   new `describe('a day roll with every row readable (ISSUES #27)', ...)`.

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `keeps every row of the day on screen while the day before it is still counting down` | The invariant of section 5: whenever a list day is on screen, the sequence holds every one of its rows. This is the state ISSUES #27 violated, rendering one row | Five consecutive stored days, each with Fajr `01:00`, Sunrise `02:00`, Dhuhr `13:00`, Asr `18:00`, Magrib `23:30`, Isha `03:30`, so each day's Isha instant lands on the NEXT calendar day, after that day's Fajr, Sunrise and Dhuhr. Launch on the first day at `12:00`, then move the clock in 5-minute steps across three days, calling `refreshSequence(STANDARD)` at each step, as the countdown tick does | At EVERY step where `getDisplayDate(STANDARD)` is not null, the rows the sequence holds for that day equal the rows the real builder puts on that day. Collect every step that differs and assert the collection is empty, so a failure names the step, the clock reading, the day and the rows |

   The suite's existing helpers carry all of this and none of them is changed: `storeDays` (which reads
   `LONDON_2026`), `rowsHeld`, `launchAt`, `moveClockTo`, `getDisplayDate`, `STANDARD`.

   **`LONDON_2026` gains five dates**, and only additions: `2026-06-18` through `2026-06-22`, each the array
   `['01:00', '02:00', '13:00', '18:00', '23:30', '03:30']` in the file's existing `FIELDS` order. No existing date
   is edited, so no existing test's inputs move.

   Add one `const` beside the file's other list-day constants, so the test and the plan name the same thing:

   ```ts
   const OVERLAPPING_JUNE = ['2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21', '2026-06-22'];
   ```

   Why the times are what they are, and this reasoning goes in the test's doc comment compactly: an Isha at `03:30`
   is in the small hours, so `adjustPrayerDateForMidnightCrossing` moves its instant to the next calendar day while
   `calculateBelongsToDate` keeps its list day on the day before. Its day therefore stays on screen while the NEXT
   day's `01:00` Fajr, `02:00` Sunrise and `13:00` Dhuhr have already passed, which is the only readable shape where
   a later day's rows are passed while an earlier day is on screen. London never produces it; above about 60N the
   provider does (`shared/prayer.ts`: "Reykjavik 00:03, Nome 01:48 on 21 June").

   **The clock is pinned before any state is built**, as `__tests__/README.md` requires: the describe's own
   `beforeEach` already calls `jest.useFakeTimers()`, and `launchAt('2026-06-18T11:00:00.000Z')` sets the instant
   before `setSequence` runs. No day is read from the real clock.

   `2026-06-18` is BST, so `12:00` London is `11:00Z`. Every `moveClockTo` in this test is written as a `Z` instant,
   as every other test in this describe does.

   **Existing tests that change: none.** `LONDON_2026` gains keys and no existing key changes, so every existing
   test reads exactly what it read before.

   **The command that runs only this suite:**

   ```bash
   npx jest stores/__tests__/schedule.test.ts --watchman=false --selectProjects=unit
   ```

   **Expected: the new test PASSES the first time it is run.** This is deliberate and it is not a defect in the
   test. The behaviour it guards is correct today, because the fix shipped on 2026-09-13; the test exists to keep it
   correct. **The red proof for this step is part 7's break script**, which mutates the keep tests and requires the new
   test to fail. Section 2.2, item 4 makes that the executor's rule: if the break leaves it green, STOP.

   Expected `Tests:` line after the change: `Tests:       109 passed, 109 total`.

5. **Change.** None to any source file. **This is a test-only step.** It is a `(specified)` step: the executor
   writes the test from the row above, following `__tests__/README.md`.

   The invariant the test checks, repeated here because this is the step that encodes it: **whenever a list day is
   on screen, the sequence holds every one of that day's rows.**

   The test compares against the real builder's own answer for the day on screen, obtained through the suite's
   existing mocked `createPrayerSequence` (which the describe's `beforeEach` points at the real implementation) for
   that one day. It never writes an expected row list as a literal.

   Comments explain why, never what, and one line wherever one line does (owner, 2026-09-26). The doc comment above
   the new describe says why the times are high-latitude and why the test passes on first run. Nothing else in the
   file gains a comment.

6. **Green.** The same command. Expected:

   ```
   Tests:       109 passed, 109 total
   ```

   Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exiting 0.

7. **Breaks.** Save to `$TMPDIR/breaks-32-1.sh` and run `bash $TMPDIR/breaks-32-1.sh` from the repository root.

   ```bash
   #!/usr/bin/env bash
   set -u
   SRC=stores/schedule.ts
   SUITE=stores/__tests__/schedule.test.ts
   NEW_TEST='keeps every row of the day on screen while the day before it is still counting down'
   CAUGHT=0
   TOTAL=0

   run_break() {
     LABEL="$1"; FIND="$2"; REPLACE="$3"; WANT="$4"
     TOTAL=$((TOTAL + 1))
     cp "$SRC" "$SRC.bak"
     perl -0pi -e "s/\Q$FIND\E/$REPLACE/" "$SRC"
     if cmp -s "$SRC" "$SRC.bak"; then
       echo "BREAK NOT APPLIED: $LABEL"
       mv "$SRC.bak" "$SRC"
       return
     fi
     if npx jest "$SUITE" --watchman=false --selectProjects=unit -t "$WANT" 2>&1 | grep -q "Tests:.*failed"; then
       echo "CAUGHT: $LABEL"
       CAUGHT=$((CAUGHT + 1))
     else
       echo "SURVIVED: $LABEL"
     fi
     mv "$SRC.bak" "$SRC"
   }

   # The day-roll keep removed outright: the clause that keeps every row of a list day at or after the day
   # on screen. Measured in planning: 1,014 short-list states on the overlap fixture
   run_break "day-roll keep removed" \
     'return currentDisplayDate !== null && prayer.belongsToDate >= currentDisplayDate;' \
     'return false;' \
     "$NEW_TEST"

   # BOTH keeps reduced to equality, which is the true 2026-09-10 shape: neither clause then reaches a row
   # of a LATER list day than the one on screen. Measured in planning: 966 short-list states
   cp "$SRC" "$SRC.pre"
   perl -0pi -e 's/    if \(previous && prayer\.belongsToDate >= previous\.belongsToDate\) return true;/    if (previous \&\& prayer.belongsToDate === previous.belongsToDate) return true;/' "$SRC"
   run_break "both keeps become equalities" \
     'return currentDisplayDate !== null && prayer.belongsToDate >= currentDisplayDate;' \
     'return currentDisplayDate !== null \&\& prayer.belongsToDate === currentDisplayDate;' \
     "$NEW_TEST"
   mv "$SRC.pre" "$SRC"

   echo "caught $CAUGHT of $TOTAL"
   [ "$CAUGHT" = "$TOTAL" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   Expected output:

   ```
   CAUGHT: day-roll keep removed
   CAUGHT: both keeps become equalities
   caught 2 of 2
   ALL AS EXPECTED: 1
   ```

   Both breaks' search text is text this plan fixes: it is the anchor's own final two lines, verbatim. After the
   script, `git status --porcelain` must list only this step's files and the three plan files, and
   `stores/schedule.ts` must NOT appear; if it does, run `git checkout -- stores/schedule.ts` and rerun the script
   once.

   **Why the second break mutates BOTH clauses, which is the most important fact in this plan.** The single
   mutation of the day-roll keep to an equality does NOT break this test, measured in planning: the
   `previous` clause independently keeps the same rows, because the row the countdown bar measures from sits on
   the earlier list day and the clause keeps every row at or after it. So a single-clause break would print
   `SURVIVED` and the plan would be wrong about its own red. The two clauses OVERLAP by design, and only removing
   the day-roll keep outright, or reducing both to equalities, leaves no clause reaching a row of a later list day.
   That overlap is also the answer to "which line fixed #27": both, together.

8. **Version and commit.**

   ```bash
   node -e 'const [a,b,c]=require("./package.json").version.split(".").map(Number); console.log(`${a}.${b}.${c+1}`)'
   ```

   Set that version in `app.json` (`expo.version`), `package.json` (`version`) and, when `android/` exists,
   `android/app/build.gradle` (`versionName`); all three must match, or `shared/__tests__/versionLockstep.test.ts`
   fails. `android/app/build.gradle` is gitignored and never added.

   Add by name: `stores/__tests__/schedule.test.ts`, `app.json`, `package.json`, `ai/plans/README.md`,
   `ai/plans/32-day-roll-list-integrity/PLAN.md`, `ai/plans/32-day-roll-list-integrity/LOG.md`.

   Write to `$TMPDIR/msg-1.txt`, replacing `<VERSION>` with the version the command printed:

   ```
   <VERSION> - test(schedule): a day roll keeps every row of the day on screen (ISSUES #27)

   ISSUES #27 reported the prayer list rendering only the new day's Isha after a day roll, and said the
   root cause was never found. It was found: stores/schedule.ts kept a passed row only when its list day
   EQUALLED the display date, so every already-passed row of the day coming on screen was dropped, and a
   dropped row never returned. The fix shipped on 2026-09-13 as two `>=` tests, and this test is what guards them.

   The 13 existing tests that fail on that clause's equality mutation are all about a day with NO readable
   row (R8), where the other keep cannot help because such a day has no readable row for the bar to measure
   from. The day roll's own readable shape had no test at all. This one drives it and asserts the invariant:
   whenever a list day is on screen, the sequence holds every one of its rows.

   The fixture is a synthetic high latitude, never a substituted London time. London cannot express the
   shape, because every London day's rows precede the next day's; an Isha at 03:30 puts its instant on the
   next calendar day while its list day stays the day before, which is what leaves an earlier day on screen
   while a later day's rows have passed. That is real provider data above about 60N.

   No source file changes. Proven by the break script: removing the day-roll keep, and reducing both keeps to
   equalities, each fail this test. A single equality does NOT, because the two clauses overlap by design, and
   that overlap is why #27 needed both of 2026-09-10's equalities to be wrong at once.
   ```

   Commit with `git commit -F $TMPDIR/msg-1.txt`, in the background with its log (`EXECUTOR-BRIEF.md` section 3).
   In the log, the last `Tests:` line ends `passed, 4775 total` and four `100%` coverage lines are present. That is
   the WHOLE suite, both Jest projects, which is what the hook runs: 4,774 at 1.29.33 plus this step's one test. The
   `109 passed, 109 total` above is the unit project's `schedule.test.ts` alone.

9. **Review.** Read `git show <sha>` back cold, as a stranger, against this checklist:

   - [ ] Exactly one test is added, with the name this plan gives, word for word.
   - [ ] It is inside `describe('on the real builder', ...)`, in a new child describe naming ISSUES #27.
   - [ ] `LONDON_2026` gained exactly the five June dates, and no existing date's times changed.
   - [ ] The test asserts by comparing against the real builder's rows for the day on screen, never a literal row
         list.
   - [ ] The clock is pinned before any state is built, and no day is read from the real clock.
   - [ ] **No source file changed.** `git show --stat <sha>` lists only the test file, `app.json`, `package.json`
         and the plan files.
   - [ ] Comments explain why, never what, and none is a paragraph.
   - [ ] The three version numbers match.
   - [ ] Nothing beyond this step changed.

   A clean read: the diff adds one describe with one test plus five fixture dates and one constant, and touches no
   source. Handle a finding by `EXECUTOR-BRIEF.md` section 4, item 8: a fix this plan's section 10 gives word for
   word, or one meeting all three of that item's conditions, is applied; anything else is a STOP.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff test/32-day-roll-invariant \
      -m "Merge test/32-day-roll-invariant into uat-2: the day-roll invariant is guarded, reviewed"
    ```

11. **Done when:**
    - `npx jest stores/__tests__/schedule.test.ts --watchman=false --selectProjects=unit` prints
      `Tests:       109 passed, 109 total`;
    - `bash $TMPDIR/breaks-32-1.sh` ends `ALL AS EXPECTED: 1`;
    - `git show --stat HEAD` lists no file under `stores/schedule.ts`, `shared/`, `hooks/` or `components/`;
    - the step is ticked in section 6 and `LOG.md` holds the commit, the version, the hook's `Tests:` and coverage
      lines, the break script's last line, the review verdict and the merge sha.

### Step 2: Close ISSUES #27 and record the surviving mutant

0. **Anchor check.** None: this step changes only documentation. Confirm the two headings it edits exist:

   ```bash
   grep -c "^### 27\. \[OPEN, found 2026-09-10" ai/ISSUES.md
   grep -c "^- #7 — 2-day rolling notification horizon" ai/ISSUES.md
   ```

   Expected: `1` and `1`. Any other count means STOP.

1. **Goal:** `ai/ISSUES.md` #27 reads FIXED with its root cause, its fix commit and the evidence, and the surviving
   `previous >=` mutant is recorded as a new open issue so a later session can close it.

2. **Branch:** `git checkout -b docs/32-close-issue-27 uat-2`

3. **Files:** `ai/ISSUES.md`, `ai/AGENTS.md`, `ai/plans/README.md`, and this folder's `PLAN.md`, `LOG.md` and
   `AUDIT.md`, plus `app.json` and `package.json`.

4. **Tests first (red).** None: this step changes documentation only, and nothing executes it. The pre-commit hook
   still runs the whole suite, both projects, which must stay green at `Tests: 4775 total`.

5. **Change.** Three edits, and the executor writes the prose from the contracts below rather than copying a block.

   **(a) `ai/ISSUES.md`, the #27 heading.** Change
   `### 27. [OPEN, found 2026-09-10, presentation-rearchitecture session] Prayer list shows only one row for a period after a day-roll cascade instead of the full six`
   to begin `### 27. [FIXED 2026-09-13, diagnosed and guarded 2026-09-27, session 32]` and keep the rest of the
   sentence as it is.

   Keep every existing bullet of #27 as the record of what was observed. Add, after them, bullets carrying exactly
   these facts and no others:

   - **Root cause**: `filterRelevantPrayers` in `stores/schedule.ts` kept a passed row only when
     `p.belongsToDate === displayDate`; every already-passed row of the day coming on screen was therefore dropped,
     and a dropped row never returned, because the refetch only adds days after the sequence. The display-date rule
     of the day was a second defect (the first row in ARRAY order whose instant was future, which just after a roll
     can belong to the OLD day) but it was NOT what broke the list: measured one at a time, fixing the display-date
     rule alone still gives 5 rows of 6, and fixing the keep test alone gives 6 of 6.
   - **Fixed** by the dashes work of 2026-09-13 (`da39c9c8` onward), which replaced BOTH equalities with `>=`
     tests and the display-date rule with `resolveDisplayDate`. Not by a session that knew about this issue, which
     is why it stayed open for 17 days. The two keep tests overlap: on this shape either one alone holds the
     invariant, so mutating one today changes nothing and only removing the day-roll keep outright, or reducing both
     to equalities, reproduces the defect.
   - **It could never have happened on real London data**: the whole real 2024 London year, 360 days at nine launch
     hours each, produces zero short lists even under the 2026-09-10 algorithm, and under that algorithm the mock
     rig's bad download minutes are 04:00 to 05:56 and nothing else, which is inside the band `mocks/simple.ts`'s own
     header forbids ("simulate during 06:00-23:55"). Inside the supported band, zero of 1440 minutes reproduce. The
     shape IS reachable on readable provider data above about 60N, where an Isha after midnight keeps its list day on
     the day before while the next day's early rows pass.
   - **Reproduction**: 562 short-list states against the 2026-09-10 algorithm across all 1440 download minutes,
     against zero for today's code there and in a 20,000-state randomised sweep over random rigs, random resume
     jumps and the four paths a session takes. The smallest list reachable was 4 rows, never the 1 row originally
     reported, so the one-row observation needed something the sweeps could not reproduce: most likely a mock rig
     compressing more than one day, which is not in the repository.
   - **Guarded** by `keeps every row of the day on screen while the day before it is still counting down` in
     `stores/__tests__/schedule.test.ts`. The 13 tests that fail on the day-roll keep's equality mutation are all
     about a day with NO readable row (R8), where the other clause cannot help because such a day has no readable
     row for the bar to measure from. No existing test covered the day roll's own readable shape.

   **(b) `ai/ISSUES.md`, a new open issue** for the surviving mutant, in the same section as #27, immediately after
   it, numbered with the next unused number in that file (the executor reads the file and takes it; if the highest
   existing number is 41, this is 42). Its heading names the section's convention (`[OPEN, found 2026-09-27, session 32]`)
   and it carries these facts:

   - `filterRelevantPrayers`' second keep test, `prayer.belongsToDate >= previous.belongsToDate`, survives mutation
     to `===`: the whole unit suite, 4,372 tests before session 32, passes with it mutated.
   - Why it matters: that clause is what keeps a whole earlier list day when it holds the row the countdown bar
     measures from, and instrumenting it over a 20,000-state sweep counted 3,748 rows it kept that the day-roll
     clause did not, so it is load-bearing.
   - How to close it: a test in `stores/__tests__/schedule.test.ts`'s "on the real builder" describe that puts the
     bar's previous row on an earlier list day than the day on screen, then refreshes.
   - Not fixed in session 32, under the standing one-finding-one-branch rule.

   **(c) `ai/ISSUES.md`'s closed index** near line 999, where `- #7 — 2-day rolling notification horizon ...` sits:
   add a line for #27 in that list's existing one-line style, naming it as fixed and pointing at the section.

   **(d) `ai/AGENTS.md`, a Recent Decisions entry** dated `[2026-09-27]`, in the file's existing style, at the top of
   that list. It carries the durable lesson and nothing about this plan's mechanics:

   - the headline: an incidental guard is not a guard, and 13 failing tests can all be about the wrong rule;
   - that #27's root cause was an equality where an inequality was needed, that the other suspect (the display-date
     rule) was measured and cleared one at a time, and that the fix today is TWO overlapping comparisons, so a
     single-clause mutation proves nothing: the honest red needed one clause removed outright or both reduced at
     once, which a break script written from the diagnosis alone got wrong until it was actually run;
   - that a bug reported against a mock rig used outside its own documented window may never have been a production
     bug, and that the way to settle that is to run the real year through the OLD algorithm, not the new one;
   - that a session asked "is this still an issue?" answers it by re-implementing the old code verbatim from git and
     sweeping both, because a green suite on today's code proves only that today's code is green.

6. **Green.** `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exiting 0, and
   `npx jest stores/__tests__/schedule.test.ts --watchman=false --selectProjects=unit` still printing
   `Tests:       109 passed, 109 total`.

7. **Breaks.** None: a documentation step has no decision to break. The step's correctness is its review (part 9),
   which checks each claim against the evidence this plan records.

8. **Version and commit.** The same version command as step 1. Add by name: `ai/ISSUES.md`, `ai/AGENTS.md`,
   `ai/plans/README.md`, `ai/plans/32-day-roll-list-integrity/PLAN.md`, `LOG.md`, `AUDIT.md`, `app.json`,
   `package.json`.

   Write to `$TMPDIR/msg-2.txt`:

   ```
   <VERSION> - docs(issues): #27 closed with its root cause, and the surviving mutant beside it opened

   #27 said the root cause of the one-row prayer list after a day roll was never found. It is named now:
   filterRelevantPrayers kept a passed row only when its list day EQUALLED the display date, so every
   already-passed row of the day coming on screen was dropped and never returned. Fixed on 2026-09-13 by
   the dashes work, which nobody connected to this issue.

   The day's other suspect, the display-date rule, was measured and cleared: switched one at a time, the
   display-date fix alone still short-lists and the keep-test fix alone does not. Two compounding defects
   need that separation or the wrong one gets the credit.

   It could never have happened on real London data. The real 2024 year at nine launch hours a day gives
   zero short lists even under the old algorithm, and the mock rig only misbehaves between 04:00 and 05:56,
   inside the band mocks/simple.ts itself forbids. The shape is reachable above about 60N, which is why the
   guard is worth having.

   Opens the finding the break script turned up: the second keep test survives mutation to === with the
   whole suite green, so it is load-bearing and untested at its boundary.
   ```

9. **Review.** Read `git show <sha>` back cold against this checklist:

   - [ ] Every factual claim in `ai/ISSUES.md` matches a number this plan's section 5 records: 562, 0, 1440, 20,000,
         360 days, 04:00 to 05:56, 13 tests, 1,014, 966, 3,748, 4 rows.
   - [ ] #27's original observation bullets are kept, not rewritten.
   - [ ] The new issue's number is the next unused one in `ai/ISSUES.md`, and no existing number moved.
   - [ ] The closed index gained one line, in the list's existing style.
   - [ ] The `ai/AGENTS.md` entry is a durable lesson, names no model, and carries no plan mechanics.
   - [ ] No source file and no test changed in this commit.
   - [ ] The three version numbers match.
   - [ ] Prose follows `ai/AGENTS.md` section 8: no em dashes, no arrows in prose, no exclamation marks, no emoji
         except the whale marking an owner quote, no banned filler.

   A clean read: documentation only, every number traceable to section 5.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff docs/32-close-issue-27 \
      -m "Merge docs/32-close-issue-27 into uat-2: ISSUES #27 closed and its mutant opened, reviewed"
    ```

11. **Done when:**
    - `grep -c "^### 27\. \[FIXED 2026-09-13" ai/ISSUES.md` prints `1`;
    - `grep -c "^### 27\. \[OPEN" ai/ISSUES.md` prints `0`;
    - `npx biome check . --error-on-warnings` exits 0;
    - the step is ticked in section 6 and `LOG.md` records the commit, the version, the review verdict and the merge
      sha.

## 7. Device proof

**None, and this is the reasoning rather than an omission.**

The owner asked for the iPhone simulator over the connected phone: 🐋  "I would rather you use the iPhone simulator
rather than the real device that you have connected right now, and 1 +3D, just use the device hub simulator." No
device of either kind is used, for three reasons:

1. **Nothing changes in the app.** Step 1 adds a test; step 2 edits documentation. A build from this session is
   byte-identical in behaviour to `uat-2` before it, so a device could only confirm that the app still works, which
   `uat-2` already does.
2. **The behaviour is not platform-specific.** `filterRelevantPrayers` is one decision over an array of rows, in
   `stores/`, with no platform branch anywhere on the path (`ai/AGENTS.md`: "No `Platform` checks in the countdown
   path"). A simulator cannot see the row set; only the store can.
3. **The reproduction needs data a device cannot hold.** #27 needs a day roll with a later day's rows already
   passed, which London never produces and a real device would need either a driven clock across days or a
   high-latitude provider. Both live better in the suite, where 20,000 states run in four seconds.

**Safety:** no clock is changed, so no `dumpsys alarm` reading is needed and no armed alarm can fire. Neither phone
is touched, and automatic time is left as it is on both. The owner receives no screenshots.

**The phone left behind:** whatever it was on before this session, untouched.

## 8. Records

### Findings text

Add to `ai/features/uat-2/AUDIT-FINDINGS.md`, under the exact heading
`## ISSUES #27: the day roll, diagnosed and guarded (session 32, 2026-09-27)`:

> `ai/ISSUES.md` #27, open since 2026-09-10, reported the prayer list rendering only the new day's Isha after a
> day-roll cascade, with its root cause never found. The cause is found and the defect is already fixed.
>
> **Root cause: an equality where an inequality was needed.** `filterRelevantPrayers` in `stores/schedule.ts` kept a passed row only when
> `p.belongsToDate === displayDate`, so every already-passed row of the day coming on screen was dropped, and a
> dropped row never came back, because the refetch only adds days after the sequence. The 2026-09-10 code had a
> second defect beside it, a display date taken as the first row in ARRAY order whose instant was future, which just
> after a roll can belong to the old day. Measured one at a time, that second defect was NOT the cause: fixing the
> display-date rule alone still leaves 5 rows of 6, and fixing the keep test alone gives 6 of 6.
>
> **Fixed on 2026-09-13** by the dashes work (`da39c9c8` onward), which replaced BOTH equalities with `>=` tests
> and the display-date rule with `resolveDisplayDate`, without knowing it closed this issue. The two keep tests
> overlap on this shape, so either alone holds the invariant: mutating one today changes nothing, and reproducing the
> defect needs the day-roll keep removed outright (1,014 short-list states) or both reduced to equalities (966).
>
> **Reproduction, measured against the 2026-09-10 algorithm re-implemented verbatim from `8630f75d`:** 562
> short-list states across all 1440 download minutes of the mock rig, against 0 for today's code over the same
> sweep, over a 20,000-state randomised sweep of random rigs, resume jumps and the four session paths, over the
> whole real London year at every minute, and over high-latitude and overlapping-day fixtures.
>
> **It was never a production bug.** The real 2024 London year, 360 days at nine launch hours each, gives zero
> short lists even under the old algorithm. Under that algorithm the mock rig's bad download minutes are 04:00 to
> 05:56 and nothing else, inside the band `mocks/simple.ts`'s own header forbids. Inside the supported band,
> 06:00 to 23:55, zero of 1440 minutes reproduce. The shape is reachable on readable provider data above about 60N.
> The smallest list any sweep reached was 4 rows, never the 1 row reported, so the original observation needed a
> rig compressing more than one day, which is not in the repository.
>
> **The guard gap this closed.** Mutating `>= currentDisplayDate` to `===` failed 13 of the suite's 108
> `schedule.test.ts` tests, and all 13 were about a day with NO readable row (R8). Not one described a day roll with
> every row readable, so the fix was guarded incidentally and a refactor would have read 13 failures about missing
> provider data. `keeps every row of the day on screen while the day before it is still counting down` now asserts
> the invariant directly: whenever a list day is on screen, the sequence holds every one of its rows.
>
> **A finding beside it, left open.** The other keep test, `prayer.belongsToDate >= previous.belongsToDate`,
> survives mutation to `===` with the whole 4,372-test suite green. With both mutated together an overlapping-days
> sweep counted 3,748 rows it uniquely kept, so it is load-bearing and untested at its boundary. Recorded as its
> own open issue in `ai/ISSUES.md`, not fixed here.
>
> No source file changed in this session. Tests after: `<TESTS_AFTER>`.

`<TESTS_AFTER>` is the `Tests:` line from step 2's commit log.

### Table rows

The executor sets the `ai/plans/README.md` row 32 to EXECUTED. The auditor applies this text to the
`ai/prompts/README.md` closed-prompts index on PASS, in that list's existing one-line style:

> - 32. `ai/ISSUES.md` #27 — DONE 2026-09-27 — the day-roll one-row list: root cause found (a keep test that
>   compared list day for EQUALITY with the display date, so every already-passed row of the day coming on screen
>   was dropped), already fixed by the 2026-09-13 dashes work, reproduced 562 times against the old algorithm and
>   zero times against today's, and now guarded directly instead of incidentally by 13 tests about a different rule.
>   Never a production bug: the real London year gives zero short lists even under the old code, and the mock rig
>   only misbehaves inside the band its own header forbids. One finding left open, the second keep test's surviving
>   mutant.

### Docs commit

Step 2's message, above, is the docs commit. The `executed` docs commit that follows it
(`EXECUTOR-BRIEF.md` section 4b) uses:

```
<VERSION> - docs(plans): session 32 executed: ISSUES #27 diagnosed, guarded and closed
```

## 9. Push

None in this plan. The executor never pushes (`EXECUTOR-BRIEF.md` section 2). The audit session pushes `uat-2` after
a PASS verdict (`AUDITOR-BRIEF.md` section 4).

## 10. When something goes wrong

### Symptom table

| Symptom | Cause | Action |
| --- | --- | --- |
| Anchor 1-1 counts 0 or more than 1 | `stores/schedule.ts` changed since `aeb985d5` | NEEDS REPLAN (`EXECUTOR-BRIEF.md` section 1, item 4) |
| The new test fails on its first run | The fixture's times or the invariant comparison are not as this plan specifies, since the behaviour is correct today | Reread part 4's row and correct the test towards it. If it still fails, STOP and quote the failure |
| A break prints `BREAK NOT APPLIED` | The substitution does not match `stores/schedule.ts` | NEEDS REPLAN: the file changed since `aeb985d5` |
| A break prints `SURVIVED` | The new test does not guard the line | STOP, with section 2.2 item 4's question |
| An existing `schedule.test.ts` test fails | One of the five added `LONDON_2026` dates overwrote an existing key | STOP and quote the failing test |
| Coverage below 100% | A test-only step cannot lower coverage | STOP and ask. Never add an ignore comment |
| `versionLockstep.test.ts` fails | The three version numbers differ | Set all three to the step's version and commit again |
| The hook fails only on `audioMatrix.test.ts` timing out | Machine load | Wait for the load to fall and commit again, up to 3 times (`EXECUTOR-BRIEF.md` section 3) |
| Anything not here | | `EXECUTOR-BRIEF.md` section 7's general table |

### Anticipated review fixes

These are the only fixes the executor may make to anything this plan fixed, and each is word for word:

1. **The new describe is not the last child of "on the real builder".** Move it so it is the last top-level child
   describe of that block, changing nothing inside it.
2. **The added `LONDON_2026` dates are not in ascending date order among the file's existing keys.** Reorder the five
   added keys so `2026-06-18` through `2026-06-22` sit in ascending order between `2026-03-30` and `2026-10-16`,
   changing no times.
3. **A comment in the new test explains WHAT the test does.** Delete that comment. Keep only a why: why the times
   are high-latitude, and why the test passes on its first run.

A reviewer finding this list does not answer, and that meets all three conditions in `EXECUTOR-BRIEF.md` section 4,
item 8, the executor applies itself and records in `LOG.md`. Those three conditions are written there and are never
restated here in different words.

### Stopping part-way

| Step | Restore | Delete |
| --- | --- | --- |
| 1 | `git checkout -- stores/__tests__/schedule.test.ts app.json package.json`, and `git checkout -- stores/schedule.ts` if the break script left it modified | nothing |
| 2 | `git checkout -- ai/ISSUES.md ai/AGENTS.md app.json package.json` | nothing |

Then follow `EXECUTOR-BRIEF.md` section 4a: save the patch and the status under
`~/athan-device-sweep/session32/`, drop the step branch, and leave the tree clean but for `ai/plans/README.md` and
this folder's `PLAN.md` and `LOG.md`.

## 11. Subagents in this plan

None. This session does its own planning, execution, review and audit (owner, 2026-09-26). No step reads an image,
so `vision` is not needed either.

## 12. Report to the owner

The final message starts with `Execution session` and a `Time:` line from `date '+%H:%M:%S %d.%m.%Y'`, and gives:

- what the diagnosis found, in plain sentences: that #27's cause was an equality where an inequality was needed, that it was already fixed on
  2026-09-13, that it was never reachable on real London data, and that the day roll is now guarded directly;
- the progress table (format in `EXECUTOR-BRIEF.md` section 6);
- the assumptions listed in section 2.1, because the owner asked for assumptions rather than questions;
- the one finding left open, the surviving `previous >=` mutant;
- the four-line handoff from the `athan-next` skill, section 8.
