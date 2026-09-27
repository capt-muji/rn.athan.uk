# Step 7: Pin `widgetAndroid.test.ts`'s clock (ISSUES #44)

0. **Anchor check:** run `bash $TMPDIR/preflight-34.sh 7`. Anchor `7-1` must print `1`. Any other
   count, or `EMPTY ANCHOR`, means NEEDS REPLAN.

1. **Goal:** `stores/__tests__/widgetAndroid.test.ts` passes at every hour of the day, because it
   reads no real clock.

2. **Branch:** `git checkout -b fix/34-widget-android-clock uat-2`

3. **Files:**
   - `stores/__tests__/widgetAndroid.test.ts`
   - `ai/ISSUES.md`
   - `app.json`, `package.json`
   - `ai/plans/README.md`, `ai/plans/34-dead-code-sweep/PLAN.md`, `ai/plans/34-dead-code-sweep/LOG.md`

   No production file changes in this step. The code is correct; the test was not.

4. **Tests first (red).**

   **The defect, measured.** `stores/__tests__/widgetAndroid.test.ts`'s
   `reloads the home kinds at a minute flip instead of re-pushing snapshots` seeds today's prayers at
   FIXED wall-clock times through `makeDayData` (`asr: '17:45'`, `magrib: '21:15'`, `isha: '22:45'`),
   then advances the fake clock by 61,000 ms and asserts the four standard home kinds reloaded.

   `msUntilMinuteFlip` in `stores/widget.ts` arms the flip timer at
   `(msRemaining % 60000) + LABEL_FLIP_EPSILON_MS`, and answers `null` once the target has passed. So
   when the suite runs with fewer than 61 seconds left to the next seeded row, the 61-second advance
   sails PAST that target, the re-arm takes its `null` branch, and no kind reloads.

   Proven deterministically while planning, on code identical in both runs:

   | Clock pinned to | Seeded target ahead | Result |
   | --- | --- | --- |
   | `2026-09-27T22:44:33+01:00` | Isha at 22:45, 27 seconds away | `Tests: 1 failed, 9 passed` |
   | `2026-09-27T22:35:00+01:00` | Isha at 22:45, 10 minutes away | `Tests: 10 passed` |

   It first appeared as a baseline failure on clean `uat-2`, so it was not caused by any session that
   found it, and it blocks every commit made inside the affected window.

   This is ISSUES #41's rule broken a second time, in a different file:
   🐋 "a test should not be based on what time of date being run" (owner, 2026-09-27).

   **The red.** Before the change, run the suite twice with the clock pinned either side of the
   window, using a throwaway edit to the `beforeEach` that part 5 then makes permanent:

   ```bash
   npx jest stores/__tests__/widgetAndroid.test.ts --watchman=false --selectProjects=unit
   ```

   With `jest.useFakeTimers()` unchanged, the outcome depends on the real clock, which is the defect
   itself. To see the red deliberately, temporarily change that one line to
   `jest.useFakeTimers({ now: new Date('2026-09-27T22:44:33+01:00') });` and run it:

   **Expected:**

   ```
   ● Android snapshot pushes › reloads the home kinds at a minute flip instead of re-pushing snapshots

       expect(jest.fn()).toHaveBeenCalled()

       Expected number of calls: >= 1
       Received number of calls:    0
   ```

   at `expect(PrayerWidget.reload).toHaveBeenCalled();`. Then put that line back before doing part 5,
   so the change is made once and cleanly.

   | Test | What changes | What it proves after |
   | --- | --- | --- |
   | every test in the suite | the `beforeEach` pins the clock to a fixed instant, and `makeDayData` seeds its day from a fixed constant | each test proves exactly what it did, at any hour |

   No test is added, renamed or deleted. All 10 keep their names.

   Run:

   ```bash
   npx jest stores/__tests__/widgetAndroid.test.ts --watchman=false --selectProjects=unit
   ```

   Expected after the change: `Tests: 10 passed, 10 total`, at any hour.

   Tests that must NOT change: all 10 of them, in what they prove. In particular
   `rolls the window over when the flip target has passed` relies on `seedPrayerCache(3, true)`'s
   `todayRelative` shifts, which are computed from `now` and therefore follow the pinned clock
   correctly.

5. **Change.** This is a `(specified)` step.

   **Anchor `7-1`** locates the suite's `describe`/`beforeEach`. Replace the line
   `    jest.useFakeTimers();` with:

   ```ts
       // Fixed, because the seeded rows are fixed: a real clock inside the last minute before a
       // seeded row makes the 61s advance in the flip test sail past its target (ISSUES #44)
       jest.useFakeTimers({ now: SEEDED_NOW });
   ```

   Add the constant directly above the `makeDayData` definition, verbatim:

   ```ts
   /** 09:00 London on a fixed day: every seeded row below is hours ahead of it */
   const SEEDED_NOW = new Date('2026-09-27T08:00:00Z');
   ```

   Contract for the constant:

   - **Name:** `SEEDED_NOW`, a module-scope `const` of type `Date`.
   - **What it answers:** the instant every test in this suite starts at.
   - **Why this value:** `08:00Z` is 09:00 in London on 27 September 2026, which is BST. The earliest
     seeded row is `fajr: '03:30'`, already past, and the next is `sunrise: '05:20'`, also past, so
     the first row ahead is `dhuhr: '13:10'`, four hours and ten minutes away. Every advance in the
     suite is bounded well under that, so no test can cross a seeded boundary by accident. The
     largest advance in the suite is 30 minutes.
   - **What it must never do:** be read from the real clock, or be a value that puts any seeded row
     within 61 seconds ahead.

   The `afterEach` already calls `jest.clearAllTimers()` and `jest.useRealTimers()`, satisfying
   `__tests__/README.md`'s rule that real timers are restored, so it needs no change.

   `makeDayData` already takes its date as a parameter and `seedPrayerCache` derives every day from
   `createInstant()`, which reads the now-pinned fake clock, so neither needs changing: pinning the
   clock first is what makes them consistent.

   **The invariant this step keeps:** the suite's result does not depend on the time of day it runs,
   and each of its 10 tests proves exactly what it proved before.

   **ISSUES entry.** Add the text `PLAN.md` section 8 gives, verbatim, to the end of `ai/ISSUES.md`
   section E.

6. **Green.**

   ```bash
   npx jest stores/__tests__/widgetAndroid.test.ts stores/__tests__/widgetAndroidFlagOff.test.ts --watchman=false --selectProjects=unit
   ```

   Expected: `Tests: 10 passed` for the first suite, and the flag-off suite unchanged.

   Then prove the pin is what fixes it, by running the same suite under two pinned clocks that
   previously disagreed. Save as `$TMPDIR/hours-34-7.sh` and run with `bash`:

   ```bash
   #!/bin/bash
   # The suite must pass whatever the real clock says. TZ shifts the machine's clock, not the pin.
   set -u
   cd /Users/muji/repos/rn.athan.uk || exit 1
   for tz in Europe/London Pacific/Kiritimati Pacific/Pago_Pago Asia/Tokyo; do
     printf '%-22s ' "$tz"
     TZ=$tz npx jest stores/__tests__/widgetAndroid.test.ts --watchman=false --selectProjects=unit --silent 2>&1 | grep -E '^Tests:'
   done
   ```

   Expected: `Tests:       10 passed, 10 total` on all four lines. A machine timezone that moved the
   real clock into the old failure window would have broken the unpinned version.

   Then:

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Both exit 0.

7. **Breaks.** Save as `$TMPDIR/breaks-34-7.sh` and run `bash $TMPDIR/breaks-34-7.sh` from the
   repository root.

   ```bash
   #!/bin/bash
   # Step 7 breaks: removing the pin must reintroduce the time dependence, and the flip chain
   # must still be what the test observes.
   set -u
   cd /Users/muji/repos/rn.athan.uk || exit 1
   caught=0
   total=0

   SUITE=stores/__tests__/widgetAndroid.test.ts

   try() { # try <label> <file> <perl> <expected>
     total=$((total + 1))
     cp "$2" "$2.bak"
     perl -pi -e "$3" "$2"
     if cmp -s "$2" "$2.bak"; then
       echo "BREAK NOT APPLIED: $1"
       mv "$2.bak" "$2"
       return
     fi
     if npx jest "$SUITE" --watchman=false --selectProjects=unit --silent > "$TMPDIR/b34-7.log" 2>&1; then
       echo "NOT CAUGHT: $1 (expected $4 to fail)"
     else
       echo "caught: $1 (expected $4)"
       caught=$((caught + 1))
     fi
     mv "$2.bak" "$2"
   }

   # The pin is the fix: pinning INTO the old window must fail again, which proves what it guards
   try "the clock is pinned inside the old failure window" "$SUITE" \
     "s/jest\.useFakeTimers\(\{ now: SEEDED_NOW \}\)/jest.useFakeTimers({ now: new Date('2026-09-27T21:44:33Z') })/" \
     "reloads the home kinds at a minute flip instead of re-pushing snapshots"

   # The flip chain itself must still reload the home kinds
   try "the flip chain reloads nothing" stores/widget.ts \
     "s/^      reloadAndroidKinds\(schedule\);\$/      \/\/ broken/" \
     "reloads the home kinds at a minute flip instead of re-pushing snapshots"

   # And it must reload rather than re-push a snapshot
   try "the flip chain re-pushes instead of reloading" stores/widget.ts \
     "s/^    kind\.widget\.reload\(\);\$/    \/\/ broken/" \
     "reloads the home kinds at a minute flip instead of re-pushing snapshots"

   echo "caught $caught of $total"
   [ "$caught" = "3" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   | Break | Expected to fail | Why it must |
   | --- | --- | --- |
   | the clock is pinned inside the old failure window | `reloads the home kinds at a minute flip instead of re-pushing snapshots` | this is the defect reproduced on purpose, so it proves the pin's value is load-bearing rather than decorative |
   | the flip chain reloads nothing | the same test | the test must still observe the real chain |
   | the flip chain re-pushes instead of reloading | the same test | the chain must reload, not re-push |

   Ends `ALL AS EXPECTED: 1`. The first break's search text is the line this step itself writes, so it
   can never silently fail to apply.

   Afterwards, `git status --porcelain` must list only this step's files and the three plan files,
   and no `.bak` file may remain.

8. **Version and commit.** Version command as step 1. Add by name:

   ```
   stores/__tests__/widgetAndroid.test.ts
   ai/ISSUES.md
   app.json
   package.json
   ai/plans/README.md
   ai/plans/34-dead-code-sweep/PLAN.md
   ai/plans/34-dead-code-sweep/LOG.md
   ```

   Commit message, to `$TMPDIR/msg-7.txt` with `<VERSION>` replaced:

   ```
   <VERSION> - fix(tests): pin widgetAndroid's clock, so it passes at every hour

   The suite seeded today's prayers at fixed wall-clock times, the last at 22:45,
   and the minute-flip test advanced the clock by 61 seconds. msUntilMinuteFlip
   arms its timer at (msRemaining % 60000) + 250 and answers null once the target
   has passed, so a run with under 61 seconds left to the next seeded row sailed
   past that target, took the null branch, and saw no reload.

   Proven by pinning the clock: 22:44:33 fails, 22:35:00 passes, on identical code.
   It was failing on clean uat-2 when a planning session hit it, so no session
   caused it, and it blocked every commit made inside the window.

   ISSUES #41's rule, a second time in a different file: a test never reads the
   real clock. The fix is the one that rule prescribes, a fixed now in
   useFakeTimers, chosen so the nearest seeded row is over four hours ahead and no
   advance in the suite can reach it. All 10 tests keep their names and prove what
   they proved.

   Opened and closed as ISSUES #44. The tell for the next one: a test that seeds a
   fixed wall-clock time and then advances the clock by a bounded amount.
   ```

9. **Review.** Read `git show <sha>` back cold against this list:

   - no production file is in the diff: the code was right and the test was wrong;
   - `SEEDED_NOW` is `new Date('2026-09-27T08:00:00Z')`, and the comment explains WHY that instant,
     in one line, not what the code does;
   - the `beforeEach` comment names ISSUES #44 and the mechanism, compactly;
   - the `afterEach` still calls `jest.clearAllTimers()` and `jest.useRealTimers()`;
   - all 10 test names are unchanged, and none was added or deleted;
   - `seedPrayerCache`'s `todayRelative` branch is unchanged, and still derives its shifts from `now`;
   - the ISSUES entry matches `PLAN.md` section 8 word for word, and sits at the end of section E;
   - the version is bumped in both files and they match;
   - nothing beyond part 3's files changed.

   A clean read is: one constant added, one `useFakeTimers` call given a fixed now, two compact
   comments, and one ISSUES entry.

   A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff fix/34-widget-android-clock -m "Merge fix/34-widget-android-clock into uat-2: ISSUES #44, the suite no longer reads the real clock, reviewed"
    ```

11. **Done when:**

    - `npx jest stores/__tests__/widgetAndroid.test.ts --watchman=false --selectProjects=unit` prints
      `Tests:       10 passed, 10 total`;
    - `bash $TMPDIR/hours-34-7.sh` prints `Tests:       10 passed, 10 total` on all four lines;
    - `grep -c 'SEEDED_NOW' stores/__tests__/widgetAndroid.test.ts` prints `2`;
    - `grep -c 'jest.useFakeTimers()' stores/__tests__/widgetAndroid.test.ts` prints `0`;
    - `grep -c '#44' ai/ISSUES.md` prints `1`;
    - `yarn validate` passes with four `100%` lines.

    Tick the step in `PLAN.md` section 6, and append to `LOG.md` as step 1 part 11 says, plus the four
    timezone lines from the hours script.
