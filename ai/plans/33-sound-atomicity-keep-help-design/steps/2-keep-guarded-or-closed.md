# Step 2: ISSUES #42, the previous-row keep, guarded by what it actually decides (specified)

0. **Anchor check:** run the section 3 pre-flight for step 2. This must count `1`:

```bash
python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
  ai/plans/33-sound-atomicity-keep-help-design/scripts/anchors/2-1.txt stores/schedule.ts
```

Any count other than `1` means NEEDS REPLAN.

1. **Goal:** the first keep test in `filterRelevantPrayers` gains a test that fails when the clause is REMOVED, and
   ISSUES #42 is closed with the measurement showing why the mutation it names can never fail one.

2. **Branch:** `git checkout -b test/33-previous-row-keep uat-2`

3. **Files:**
   - `stores/__tests__/schedule.test.ts`
   - `ai/ISSUES.md`

   No production file changes in this step. Nothing else may change, apart from `ai/plans/README.md` and this
   folder's `PLAN.md` and `LOG.md`.

4. **Tests first (red).**

**Read this before writing the test.** ISSUES #42 asks for a test that fails when
`prayer.belongsToDate >= previous.belongsToDate` is mutated to `===`. That test cannot exist, and the planning
session proved it rather than assuming it. Two invariants hold over every reachable state:

- `resolveDisplayDate` never answers a list day AFTER next's list day, because it returns the EARLIEST list day
  with a readable row still to come;
- `findPreviousRow` never answers a row AFTER next's list day: it looks on next's own list day, or, for the first
  row of a list, the day before.

So `previous.belongsToDate <= displayDate <= next.belongsToDate`, and every row the `>=` admits beyond
`previous.belongsToDate` is also `>= currentDisplayDate`, which clause 3 already keeps. The two forms therefore
keep the same SET in every reachable state. Measured over **1,209,600 states** (four day shapes including a >60N
overlap and a polar day, seven breakage patterns, three broken-day positions, both schedules, every minute across
five days): **zero** disagreements between `>=` and `===`, zero states with the display date after next's list day,
and zero with previous after next's list day. Over the same sweep the clause UNIQUELY keeps rows in **199,714**
states, so it is load-bearing while its operator is not.

The honest guard is therefore against the clause's REMOVAL, which is what session 32 already measured as reachable
(1,014 short-list states with it gone).

Changed suite: `stores/__tests__/schedule.test.ts`, inside the existing
`describe('a day roll with every row readable (ISSUES #27)')` block, beneath its existing test. Use that describe's
existing helpers exactly as its current test does: `storeDays(OVERLAPPING_JUNE)`, `launchAt`, `moveClockTo`,
`refreshSequence`, `getDisplayDate`, `getPrevPrayer`, `rowsHeld` and `actualPrayer`. The previous row is read with
`getPrevPrayer(STANDARD)`, which is the name this suite already imports; there is no `getPreviousPrayer`.

| Test name | What it proves | Inputs | Asserts |
| --- | --- | --- | --- |
| `keeps the whole list day holding the row the countdown bar measures from` | Clause 1 of `filterRelevantPrayers` is load-bearing: while the bar measures from a row on an EARLIER list day than the day on screen, that earlier day is kept whole | `storeDays(OVERLAPPING_JUNE)`, `launchAt('2026-06-18T11:00:00.000Z')`, then walk the clock in 5 minute steps across 3 days, calling `refreshSequence(STANDARD)` each step. At each step read `getPrevPrayer(STANDARD)`; when it is non-null and its `belongsToDate` is EARLIER than `getDisplayDate(STANDARD)`, record whether `rowsHeld(STANDARD)[previous.belongsToDate]` equals that day's whole list, built with `actualPrayer().createPrayerSequence` exactly as the neighbouring test builds it | the recorded list of incomplete days equals `[]`, AND the count of states that exercised the rule is greater than 0, so a sweep that never reaches the shape cannot pass by vacuum |

The second assertion matters as much as the first: without it a future change that stops producing this shape would
leave the test green over nothing. That is the same trap as session 32's `SURVIVED` break script.

Command, path before flags:

```bash
npx jest stores/__tests__/schedule.test.ts --watchman=false --selectProjects=unit
```

Expected BEFORE the change: the new test PASSES, exactly as its neighbour in the same describe did, because the fix
shipped on 2026-09-13. Its red is its break script, part 7, and that is the only red this step has. If the new test
fails on today's code, STOP: the sweep is not reaching the shape the plan measured.

5. **Change.** None to production code. This step adds one test and closes an issue.

**`ai/ISSUES.md`, entry 42.** Replace its `[OPEN, found 2026-09-27, session 32]` marker with
`[CLOSED 2026-09-27, session 33]`, and replace the `How to close it` and `Not fixed in session 32` bullets with what
the measurement showed. The new text states: the prescribed test is impossible because the mutation is semantically
equivalent under two invariants (display date never after next's list day, previous never after next's list day),
which makes every row the `>=` admits already covered by the display-date clause; the numbers above, naming the
state count, the zero disagreements and the 199,714 states where the clause uniquely keeps rows; and that the clause
is now guarded against removal by the named test. Keep every existing bullet that records what session 32 found.

The durable lesson to record in the entry, in one sentence: a surviving mutant is not always a missing test, because
an operator whose two forms are provably equivalent over every reachable input has nothing to test, and the way to
tell the two apart is to measure the mutation's effect on real states rather than to write a test against it.

6. **Green.** The same command. Every test in the suite passes, including the new one. Then `npx tsc --noEmit` and
   `npx biome check . --error-on-warnings`, both exiting 0.

7. **Breaks.** Save as `$TMPDIR/breaks-33-2.sh` and run with `bash $TMPDIR/breaks-33-2.sh` from the repository root.

```bash
#!/bin/bash
# Step 2 breaks: the clause is load-bearing, and the mutation ISSUES #42 named is not
set -u
SUITE="stores/__tests__/schedule.test.ts"
TARGET="stores/schedule.ts"
CAUGHT=0
TOTAL=0

# The pattern is a real perl regex, already escaped in each call below. \Q...\E is NOT used here:
# it does not protect an interpolated \n, so a multi-line search silently matches nothing and the
# break reports BREAK NOT APPLIED while the code is untouched (measured while planning this step).
run_break() {
  local label="$1" search="$2" replace="$3" expect="$4"
  TOTAL=$((TOTAL + 1))
  cp "$TARGET" "$TARGET.bak"
  perl -0pi -e "s/$search/$replace/" "$TARGET"
  if cmp -s "$TARGET" "$TARGET.bak"; then
    echo "BREAK NOT APPLIED: $label"
    mv "$TARGET.bak" "$TARGET"
    return
  fi
  if npx jest "$SUITE" --watchman=false --selectProjects=unit > /dev/null 2>&1; then
    RESULT="survived"
  else
    RESULT="caught"
  fi
  if [ "$RESULT" = "$expect" ]; then
    echo "AS EXPECTED ($expect): $label"
    CAUGHT=$((CAUGHT + 1))
  else
    echo "NOT AS EXPECTED (wanted $expect, got $RESULT): $label"
  fi
  mv "$TARGET.bak" "$TARGET"
}

# 1. The clause removed: the rows it alone keeps are dropped, and the bar's day is short.
#    Verified while planning: fails the new test plus 2 others, 3 failed of 110.
run_break "previous-row keep removed" \
  '    if \(previous && prayer\.belongsToDate >= previous\.belongsToDate\) return true;\n' \
  '' \
  "caught"

# 2. The mutation ISSUES #42 named. It is semantically equivalent, so it MUST survive:
#    this break is what keeps the issue's closure honest rather than assumed.
#    Verified while planning: 110 passed, 110 total, with the mutation in place.
run_break "previous-row keep weakened to an equality" \
  'prayer\.belongsToDate >= previous\.belongsToDate' \
  'prayer.belongsToDate === previous.belongsToDate' \
  "survived"

# 3. The day-roll keep removed: session 32's own measured red, still guarded
run_break "day-roll keep removed" \
  'return currentDisplayDate !== null && prayer\.belongsToDate >= currentDisplayDate;' \
  'return false;' \
  "caught"

echo "AS EXPECTED $CAUGHT of $TOTAL"
[ "$CAUGHT" -eq "$TOTAL" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
```

Expected: all three lines `AS EXPECTED`, the script ending `ALL AS EXPECTED: 1`. Break 2 is deliberately expected to
SURVIVE: it is the issue's own mutation, and its survival beside break 1's catch is the evidence that the clause is
guarded while the operator is untestable. A break 2 that is CAUGHT means the planning session's measurement was
wrong: STOP and ask.

8. **Version and commit.**

```bash
node -p "const v=require('./package.json').version.split('.');v[2]=+v[2]+1;v.join('.')"
```

Set that version in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). Add by name:
`stores/__tests__/schedule.test.ts`, `ai/ISSUES.md`, `app.json`, `package.json`, `ai/plans/README.md`, and this
folder's `PLAN.md` and `LOG.md`. Commit message, in a heredoc at `$TMPDIR/msg-2.txt`:

```
<VERSION> - test(schedule): guard the previous-row keep, and close ISSUES #42 as untestable-by-mutation

ISSUES #42 asked for a test that fails when filterRelevantPrayers' first keep is mutated from >= to
===. That test cannot be written, and this measures why rather than asserting it. Two invariants hold:
resolveDisplayDate returns the EARLIEST list day with a readable row still to come, so it is never
after next's list day, and findPreviousRow looks only on next's list day or the one before it. So
previous <= display <= next, and every row the >= admits beyond previous's list day is already kept by
the display-date clause. Measured over 1,209,600 states across four day shapes including a >60N overlap
and a polar day, seven breakage patterns, both schedules and every minute of five days: zero
disagreements between the two forms, and zero states with either the display date or the previous row
after next's list day.

The clause is still load-bearing, which is the part worth guarding: over the same sweep it uniquely
keeps rows in 199,714 states. So the new test guards its REMOVAL, the mutation session 32 measured as
reachable at 1,014 short-list states, and asserts a non-zero count of states that actually exercised
the shape so it cannot pass by vacuum.

The break script pins both halves: removing the clause is CAUGHT, and the >= to === mutation is
expected to SURVIVE. That expectation is the evidence for the closure, and if it is ever caught the
measurement behind it was wrong.

DURABLE LESSON: a surviving mutant is not always a missing test. An operator whose two forms are
provably equivalent over every reachable input has nothing to test, and the way to tell that from a
real gap is to measure the mutation against real states.
```

The pre-commit hook runs the full suite: the last `Tests:` line ends `passed, <n> total`, and four `100%` coverage
lines are present.

9. **Review.** Read `git show <sha>` back cold, as a stranger, against this list:
   - the new test sits in the ISSUES #27 describe and uses only that describe's existing helpers;
   - it asserts BOTH the empty incomplete-days list and a non-zero exercised count;
   - no production file changed;
   - the ISSUES #42 entry states the invariants, the measured numbers and the closure, and keeps what session 32 found;
   - the break script's expectations match part 7, break 2 included;
   - nothing beyond the two files changed.

   Handle a finding as `EXECUTOR-BRIEF.md` section 4, item 8 says.

10. **Merge.**

```bash
git checkout uat-2 && git merge --no-ff test/33-previous-row-keep -m "Merge test/33-previous-row-keep into uat-2: ISSUES #42 guarded and closed, reviewed"
```

11. **Done when:**
    - `npx jest stores/__tests__/schedule.test.ts --watchman=false --selectProjects=unit` passes with no failures;
    - `bash $TMPDIR/breaks-33-2.sh` ends `ALL AS EXPECTED: 1`;
    - `npx tsc --noEmit` and `npx biome check . --error-on-warnings` both exit 0;
    - `grep -n 'CLOSED 2026-09-27, session 33' ai/ISSUES.md` prints one line.
