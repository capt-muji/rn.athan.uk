# Step 5: Delete five dead symbols in `stores/schedule.ts` and `stores/ui.ts`

0. **Anchor check:** run `bash $TMPDIR/preflight-34.sh 5`. Anchors `5-1`, `5-2` and `5-3` must each
   print `1`. Any other count, or `EMPTY ANCHOR`, means NEEDS REPLAN.

1. **Goal:** `getDisplayDate`, `hideAlertSheet`, `getAlertSheetState`, `getMeasurementsDate` and
   `setMeasurementsDate` leave the tree, with the `measurementsDateAtom` the last two orphan, and the
   84 assertions that reached live state through them read that state directly instead.

2. **Branch:** `git checkout -b chore/34-schedule-and-ui uat-2`

3. **Files:**
   - `stores/schedule.ts`, `stores/ui.ts`
   - `stores/__tests__/schedule.test.ts`, `stores/__tests__/syncUnreadableDay.test.ts`,
     `stores/__tests__/countdownMidnight.test.ts`, `stores/__tests__/ui.test.ts`
   - `components/prayer/__tests__/Alert.test.tsx`
   - `app.json`, `package.json`
   - `ai/plans/README.md`, `ai/plans/34-dead-code-sweep/PLAN.md`, `ai/plans/34-dead-code-sweep/LOG.md`

4. **Tests first (red).** Make the production edits of part 5 first, then run:

   ```bash
   npx tsc --noEmit
   ```

   **Expected:** errors naming `getDisplayDate` in `stores/__tests__/schedule.test.ts`,
   `stores/__tests__/syncUnreadableDay.test.ts` and `stores/__tests__/countdownMidnight.test.ts`;
   `getAlertSheetState` in `components/prayer/__tests__/Alert.test.tsx` and
   `stores/__tests__/ui.test.ts`; and `hideAlertSheet`, `getMeasurementsDate`, `setMeasurementsDate`
   and `measurementsDateAtom` in `stores/__tests__/ui.test.ts`.

   If `tsc` names a file this plan does not list, STOP (`PLAN.md` section 2.2, item 3).

   **This step's repoints are the largest in the plan, and the rule for all of them is the same:**
   the test was reading LIVE state through a dead accessor, so it now reads that live state directly.
   The assertion's expected value never changes.

   | Suite | Change |
   | --- | --- |
   | `stores/__tests__/schedule.test.ts` | remove `getDisplayDate` from the `../schedule` import clause; add the reader below that clause; rename all 37 call sites |
   | `stores/__tests__/syncUnreadableDay.test.ts` | swap its `@/stores/schedule` import clause for the multi-line form below; add the reader after its module-scope `const store = getDefaultStore();`; rename its 4 call sites |
   | `stores/__tests__/countdownMidnight.test.ts` | remove `getDisplayDate` from the `../schedule` import clause; add the reader after its module-scope `const store = getDefaultStore();`; rename its 4 call sites |
   | `stores/__tests__/ui.test.ts` | remove the four dead names and `measurementsDateAtom` from the import clause, and delete the four tests that call them |
   | `components/prayer/__tests__/Alert.test.tsx` | import `alertSheetStateAtom` in place of `getAlertSheetState`, add `import { getDefaultStore } from 'jotai/vanilla';`, and rename 3 read sites |

   **The reader for `schedule.test.ts`**, placed directly after that suite's `} from '../schedule';`
   line, verbatim:

   ```ts
   /** The display date a schedule shows, read from the atom the day header renders */
   const displayDateOf = (type: ScheduleType): string | null =>
     getDefaultStore().get(type === ScheduleType.Standard ? standardDisplayDateAtom : extraDisplayDateAtom);
   ```

   That suite has no module-scope store, taking one per test, so this reader resolves its own.

   **The reader for `syncUnreadableDay.test.ts` and `countdownMidnight.test.ts`**, placed directly
   after each one's existing `const store = getDefaultStore();`, verbatim:

   ```ts
   /** The display date a schedule shows, read from the atom the day header renders */
   const displayDateOf = (type: ScheduleType): string | null =>
     store.get(type === ScheduleType.Standard ? standardDisplayDateAtom : extraDisplayDateAtom);
   ```

   **`syncUnreadableDay.test.ts`'s import clause** becomes, verbatim:

   ```ts
   import {
     extraDisplayDateAtom,
     extraSequenceAtom,
     getSequenceAtom,
     standardDisplayDateAtom,
     standardSequenceAtom,
   } from '@/stores/schedule';
   ```

   **Every call site** changes from `getDisplayDate(` to `displayDateOf(`, and nothing else about the
   assertion changes. 45 sites: 37, 4 and 4.

   **`components/prayer/__tests__/Alert.test.tsx`** is the reference suite `__tests__/README.md`
   holds up as the example, so its structure and every test name stay exactly as they are. Only the
   read changes: `getAlertSheetState()` becomes `getDefaultStore().get(alertSheetStateAtom)`, at 3
   sites. Add `import { getDefaultStore } from 'jotai/vanilla';` in Biome's order, directly above
   `import type { TestInstance } from 'test-renderer';`.

   **The four deleted tests in `ui.test.ts`**, each of which tested only the accessor:
   `hideAlertSheet calls dismiss on modal`, `getAlertSheetState returns the state`,
   `getMeasurementsDate returns value` and `setMeasurementsDate sets value`.

   Run:

   ```bash
   npx jest stores/__tests__/schedule.test.ts stores/__tests__/syncUnreadableDay.test.ts stores/__tests__/countdownMidnight.test.ts stores/__tests__/ui.test.ts --watchman=false --selectProjects=unit
   npx jest components/prayer/__tests__/Alert.test.tsx --watchman=false --selectProjects=components
   ```

   Expected after the edits: every suite passes. The three schedule suites together report
   `Tests: 131 passed, 131 total`.

   Tests that must NOT change: every expected date string in the 45 repointed assertions, every
   other test in `ui.test.ts`, and every test name in the reference suite.

5. **Change.** This is a `(specified)` step.

   | Anchor | File | What goes |
   | --- | --- | --- |
   | `5-1` | `stores/schedule.ts` | the `getDisplayDate` doc comment and its whole `export const`, and the blank line after it |
   | `5-2` | `stores/ui.ts` | the `hideAlertSheet` doc comment and its `export const`, and the `getAlertSheetState` doc comment and its `export const` |
   | `5-3` | `stores/ui.ts` | the `getMeasurementsDate` and `setMeasurementsDate` doc comments and both `export const`s |

   Then the fixpoint, in the SAME commit: `measurementsDateAtom` had no reader but those two
   accessors, so delete its doc comment and its `export const` too:

   ```ts
   /** Page coordinates of the date component (for animations) */
   export const measurementsDateAtom = atom<PageCoordinates>(emptyCoordinates);
   ```

   **What must NOT be deleted, because the names are nearly identical.** Keep all of these, which are
   live:

   - `measurementsListAtom`, `getMeasurementsList` and `setMeasurementsList`: `components/prayer/List.tsx`
     writes and reads them, and `components/overlay/Overlay.tsx` renders the atom;
   - `standardDisplayDateAtom` and `extraDisplayDateAtom`: `components/day/Day.tsx` renders them, and
     they are what the repointed tests now read;
   - `alertSheetStateAtom`: `components/sheets/screens/Alert.tsx` renders it;
   - `alertSheetModalAtom`, `setAlertSheetModal` and `showAlertSheet`: the bell opens the sheet
     through them;
   - `hideSettingsSheet`, which looks like `hideAlertSheet` and is called by the settings sheet.

   `emptyCoordinates` stays: `measurementsListAtom` still initialises from it.

   **The invariant this step keeps:** every exported symbol is reachable by an import, or is
   allow-listed, AND every value the app renders is the same value it rendered before.

6. **Green.**

   ```bash
   npx jest stores/__tests__/schedule.test.ts stores/__tests__/syncUnreadableDay.test.ts stores/__tests__/countdownMidnight.test.ts stores/__tests__/ui.test.ts --watchman=false --selectProjects=unit
   npx jest components/prayer/__tests__/Alert.test.tsx components/day components/overlay --watchman=false --selectProjects=components
   ```

   All pass. `components/day` and `components/overlay` are run here deliberately: they render the
   atoms this step keeps, so they are the check that nothing live was removed by mistake.

   Then:

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Both exit 0. If Biome names an unused symbol this step does not list, STOP (`PLAN.md`
   section 2.2, item 6).

   ```bash
   python3 scripts/find-unused-exports.py | head -2
   ```

   prints `NEVER reachable from production code: 7`.

7. **Breaks.** Save as `$TMPDIR/breaks-34-5.sh` and run `bash $TMPDIR/breaks-34-5.sh` from the
   repository root.

   ```bash
   #!/bin/bash
   # Step 5 breaks: the repointed reads must still guard the display date and the sheet state.
   set -u
   cd /Users/muji/repos/rn.athan.uk || exit 1
   caught=0
   total=0

   try() { # try <label> <file> <perl> <suites> <project> <expected>
     total=$((total + 1))
     cp "$2" "$2.bak"
     perl -pi -e "$3" "$2"
     if cmp -s "$2" "$2.bak"; then
       echo "BREAK NOT APPLIED: $1"
       mv "$2.bak" "$2"
       return
     fi
     if npx jest $4 --watchman=false --selectProjects=$5 --silent > "$TMPDIR/b34-5.log" 2>&1; then
       echo "NOT CAUGHT: $1 (expected $6 to fail)"
     else
       echo "caught: $1 (expected $6)"
       caught=$((caught + 1))
     fi
     mv "$2.bak" "$2"
   }

   # The display date the repointed assertions read must still be the one the builder decides
   try "the display date is always null" stores/schedule.ts \
     "s/^    return resolveDisplayDate\(sequence\.prayers, TimeUtils\.createInstant\(\)\);\$/    return null;/" \
     "stores/__tests__/schedule.test.ts" unit \
     "returns belongsToDate of next prayer"

   # And it must be resolved rather than taken from the first row
   try "the display date is the first row's" stores/schedule.ts \
     "s/^    return resolveDisplayDate\(sequence\.prayers, TimeUtils\.createInstant\(\)\);\$/    return sequence.prayers[0].belongsToDate;/" \
     "stores/__tests__/schedule.test.ts" unit \
     "returns null when every prayer in the sequence has passed"

   # The sheet state the reference suite reads must still be written on a bell press
   try "the bell writes no sheet state" stores/ui.ts \
     "s/^  store\.set\(alertSheetStateAtom, state\);\$/  \/\/ broken/" \
     "components/prayer/__tests__/Alert.test.tsx" components \
     "the bell's sheet-state assertions"

   # The list measurement accessors this step KEEPS must stay wired
   try "the list measurement is never stored" stores/ui.ts \
     "s/^export const setMeasurementsList = \(measurements: PageCoordinates\) => store\.set\(measurementsListAtom, measurements\);\$/export const setMeasurementsList = (_measurements: PageCoordinates) => undefined;/" \
     "stores/__tests__/ui.test.ts" unit \
     "setMeasurementsList sets value"

   echo "caught $caught of $total"
   [ "$caught" = "4" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   | Break | Expected to fail |
   | --- | --- |
   | the display date is always null | `returns belongsToDate of next prayer` |
   | the display date is the first row's | `returns null when every prayer in the sequence has passed` |
   | the bell writes no sheet state | `checks notification permission before opening the sheet of a prayer saved Off` |
   | the list measurement is never stored | `setMeasurementsList sets value`, proving the kept accessors are still guarded |

   Ends `ALL AS EXPECTED: 1`. All four were run while planning and all four failed their named test.

   **If a break prints `BREAK NOT APPLIED`,** STOP (`PLAN.md` section 2.2, item 4). Never reshape the
   code to fit a break.

   Afterwards, `git status --porcelain` must list only this step's files and the three plan files,
   and no `.bak` file may remain.

8. **Version and commit.** Version command as step 1. Add by name:

   ```
   stores/schedule.ts
   stores/ui.ts
   stores/__tests__/schedule.test.ts
   stores/__tests__/syncUnreadableDay.test.ts
   stores/__tests__/countdownMidnight.test.ts
   stores/__tests__/ui.test.ts
   components/prayer/__tests__/Alert.test.tsx
   app.json
   package.json
   ai/plans/README.md
   ai/plans/34-dead-code-sweep/PLAN.md
   ai/plans/34-dead-code-sweep/LOG.md
   ```

   Commit message, to `$TMPDIR/msg-5.txt` with `<VERSION>` replaced:

   ```
   <VERSION> - chore(stores): delete five accessors nothing reaches

   getDisplayDate, hideAlertSheet, getAlertSheetState, getMeasurementsDate and
   setMeasurementsDate had no caller in any screen. The last two were the only
   readers of measurementsDateAtom, so it goes with them: nothing ever rendered the
   date component's coordinates.

   These are the accessors whose tests looked load-bearing, and the owner's rule
   settled it: unused code and its tests go together. Every one turned out to be a
   doorway onto live state, so 84 assertions now read that state directly and the
   coverage moved rather than vanishing.

   getDisplayDate's 45 assertions read standardDisplayDateAtom and
   extraDisplayDateAtom, which components/day/Day.tsx renders, through one local
   reader per suite. getAlertSheetState's 7 read alertSheetStateAtom, which the
   alert sheet renders. Both are one step closer to what the user sees than the
   accessor was.

   components/prayer/__tests__/Alert.test.tsx is the reference suite in
   __tests__/README.md, so its structure and every test name are unchanged; only
   the read is different.

   The four tests that existed to test an accessor and nothing else are gone with
   the accessors. measurementsListAtom, getMeasurementsList, setMeasurementsList
   and hideSettingsSheet all stay: they are live, and they read almost the same.
   ```

9. **Review.** Read `git show <sha>` back cold against this list:

   - exactly five exports plus `measurementsDateAtom` are gone from the two store files;
   - `measurementsListAtom`, `getMeasurementsList`, `setMeasurementsList`, `standardDisplayDateAtom`,
     `extraDisplayDateAtom`, `alertSheetStateAtom`, `alertSheetModalAtom`, `setAlertSheetModal`,
     `showAlertSheet` and `hideSettingsSheet` are all still present;
   - `emptyCoordinates` is still present and still initialises `measurementsListAtom`;
   - each of the three `displayDateOf` readers is byte-identical to the plan's block for its suite;
   - all 45 repointed assertions keep their expected values: `git show` them and compare the date
     strings against the pre-change file;
   - the reference suite's test names and structure are unchanged, and only 3 reads differ;
   - `jotai/vanilla` is imported in Biome's order in the reference suite;
   - exactly four tests were deleted from `ui.test.ts`, each of which tested only a deleted accessor;
   - no deleted symbol's name survives in a comment;
   - no test was weakened;
   - the version is bumped in both files and they match;
   - nothing beyond part 3's files changed.

   A clean read is: five accessors and one atom gone, four accessor-only tests gone, and 45 plus 3
   assertions reading the live atoms directly with every expected value identical.

   A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/34-schedule-and-ui -m "Merge chore/34-schedule-and-ui into uat-2: five dead accessors removed, 84 assertions repointed onto the live atoms, reviewed"
    ```

11. **Done when:**

    - `python3 scripts/find-unused-exports.py | head -2` prints
      `NEVER reachable from production code: 7`;
    - `npx tsc --noEmit` exits 0;
    - `npx biome check . --error-on-warnings` exits 0;
    - `grep -rn 'getDisplayDate\|hideAlertSheet\|getAlertSheetState\|getMeasurementsDate\|setMeasurementsDate\|measurementsDateAtom' app/ components/ shared/ stores/ hooks/ device/` prints nothing;
    - `grep -c 'measurementsListAtom' stores/ui.ts` prints `3`;
    - `grep -c 'hideSettingsSheet' stores/ui.ts` prints `1`.

    Tick the step in `PLAN.md` section 6, and append to `LOG.md` as step 1 part 11 says.
