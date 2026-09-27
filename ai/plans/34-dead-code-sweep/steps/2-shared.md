# Step 2: Delete four dead symbols in `shared/`

0. **Anchor check:** run `bash $TMPDIR/preflight-34.sh 2`. Anchors `2-1`, `2-2`, `2-3` and `2-4` must
   each print `1`. Any other count, or `EMPTY ANCHOR`, means NEEDS REPLAN.

1. **Goal:** `ISTIJABA_INDEX`, `PLATFORM`, `getSecondsBetween` and `perfFlush` leave the tree, with
   the private `perfStorage` they orphan.

2. **Branch:** `git checkout -b chore/34-shared-dead-code uat-2`

3. **Files:**
   - `shared/constants.ts`, `shared/time.ts`, `shared/perf.ts`
   - `shared/__tests__/constants.test.ts`, `shared/__tests__/time.test.ts`,
     `shared/__tests__/perf.test.ts`, `shared/__tests__/perfBackgroundFlush.test.ts`
   - `app.json`, `package.json`
   - `ai/plans/README.md`, `ai/plans/34-dead-code-sweep/PLAN.md`, `ai/plans/34-dead-code-sweep/LOG.md`

4. **Tests first (red).** A deletion's red is `tsc`, not a new test: it names every suite that
   referenced the symbol. Make the production edits of part 5 FIRST, then run:

   ```bash
   npx tsc --noEmit
   ```

   **Expected, exactly these five lines** (paths relative to the repository root):

   ```
   shared/__tests__/constants.test.ts(15,3): error TS2305: Module '"../constants"' has no exported member 'ISTIJABA_INDEX'.
   shared/__tests__/perf.test.ts(182,10): error TS2339: Property 'perfFlush' does not exist on type 'typeof import(".../shared/perf")'.
   shared/__tests__/perf.test.ts(195,12): error TS2339: Property 'perfFlush' does not exist on type 'typeof import(".../shared/perf")'.
   shared/__tests__/perf.test.ts(220,10): error TS2339: Property 'perfFlush' does not exist on type 'typeof import(".../shared/perf")'.
   shared/__tests__/perf.test.ts(312,10): error TS2339: Property 'perfFlush' does not exist on type 'typeof import(".../shared/perf")'.
   shared/__tests__/perf.test.ts(366,23): error TS2339: Property 'perfFlush' does not exist on type 'typeof import(".../shared/perf")'.
   shared/__tests__/time.test.ts(19,3): error TS2305: Module '"../time"' has no exported member 'getSecondsBetween'.
   ```

   `PLATFORM` produces no error, because nothing referenced it at all. If `tsc` names a file this
   plan does not list, STOP (`PLAN.md` section 2.2, item 3).

   Then make the test edits below, and these are the tests that change:

   | Suite | Change | What it proves after |
   | --- | --- | --- |
   | `shared/__tests__/constants.test.ts` | remove `ISTIJABA_INDEX` from the import list, and delete its `describe` block with the two banner comment lines above it | unchanged for every other constant |
   | `shared/__tests__/time.test.ts` | remove `getSecondsBetween` from the import list, and delete its `describe` block with the `COUNTDOWN UTILITIES` banner above it | unchanged for the countdown-contract tests that follow |
   | `shared/__tests__/perf.test.ts` | four disabled-path tests drop their `perf.perfFlush(...)` line; one test flushes through the app's own background listener instead; the "flushed before the monitor has started" test is deleted | every remaining test keeps its name and what it proves |
   | `shared/__tests__/perfBackgroundFlush.test.ts` | no change in this step | |

   **The four disabled-path tests** assert `mockMmkvInstances` is empty, which already proves nothing
   was recorded, so dropping the `perfFlush` call changes nothing they prove.

   **The one test that asserted a named flush reason** is
   `flushes the ring snapshot into the perf-monitor MMKV instance`. It keeps its name. Replace its
   `perf.perfFlush('test');` with a call to a new local helper `backgroundTheApp()`, and change its
   `expect(parsed.reason).toBe('test');` to `expect(parsed.reason).toBe('background');`. Add the
   helper directly above the existing `lastMmkvInstance` helper, verbatim:

   ```ts
   /** Backgrounds the app, the one path that flushes the ring on demand */
   const backgroundTheApp = () => {
     const { AppState } = require('react-native') as { AppState: { addEventListener: jest.Mock } };
     const registration = AppState.addEventListener.mock.calls.find(([event]: [string]) => event === 'change');
     if (!registration) throw new Error('the monitor registered no AppState listener');
     (registration[1] as (state: string) => void)('background');
   };
   ```

   **The deleted test** is `writes nothing, and does not throw, when flushed before the monitor has
   started`. It existed only because `perfFlush` could be called before init; with the manual call
   gone there is no way to reach that state, since backgrounding before init registers no listener.

   Run:

   ```bash
   npx jest shared/__tests__/constants.test.ts shared/__tests__/time.test.ts shared/__tests__/perf.test.ts shared/__tests__/perfBackgroundFlush.test.ts --watchman=false --selectProjects=unit
   ```

   Expected after the edits: every suite passes. `perf.test.ts` reports `Tests: 14 passed, 14 total`.

   Tests that must NOT change: every other `describe` in all four suites, and every assertion in
   `perfBackgroundFlush.test.ts`.

5. **Change.** This is a `(specified)` step.

   Delete these, each located by its anchor file, never by line number:

   | Anchor | File | What goes |
   | --- | --- | --- |
   | `2-1` | `shared/constants.ts` | the `ISTIJABA_INDEX` doc comment and its `export const`, and the blank line after it |
   | `2-2` | `shared/constants.ts` | the `PLATFORM-SPECIFIC` banner, the `PLATFORM` doc comment, its whole `export const … as const;`, and the blank line after it |
   | `2-3` | `shared/time.ts` | the `getSecondsBetween` doc comment and its `export const`, and the blank line after it |
   | `2-4` | `shared/perf.ts` | the `perfFlush` doc comment and its `export const`, and the blank line after it |

   Then the fixpoint, in the SAME commit. Deleting `perfFlush` leaves the module-scope
   `perfStorage` with no reader, and Biome fails the build on it. Delete both of these:

   - the line `let perfStorage: PerfStorage | null = null;`
   - the line `  perfStorage = storage;` inside `initPerfMonitor`, leaving the
     `const storage = createMMKV({ id: MMKV_ID });` line above it untouched

   `PerfStorage` stays: `flushRing` and `recordEntriesInto` still take it as a parameter type.

   Also correct the module's architecture comment, which names the deleted function. Replace these
   two lines verbatim:

   ```
    * - MMKV flushes: every FLUSH_THRESHOLD entries, on app background, and via
    *   perfFlush(). The ring is a snapshot (bounded overwrite), never a log.
   ```

   with:

   ```
    * - MMKV flushes: every FLUSH_THRESHOLD entries and on app background. The ring
    *   is a snapshot (bounded overwrite), never a log.
   ```

   **The invariant this step keeps:** every exported symbol is reachable from production code by an
   import, or is allow-listed. Nothing the app does changes: none of the four had a caller, and
   `flushRing` keeps its three live callers (the entry threshold, the background listener, and init).

   Add no comment for a deletion. A removed symbol needs no explanation.

6. **Green.**

   ```bash
   npx jest shared/__tests__/constants.test.ts shared/__tests__/time.test.ts shared/__tests__/perf.test.ts shared/__tests__/perfBackgroundFlush.test.ts --watchman=false --selectProjects=unit
   ```

   Then:

   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```

   Both exit 0. If Biome names an unused symbol this step does not list, STOP (`PLAN.md` section 2.2,
   item 6): the fixpoint went deeper than the plan predicted.

   Then confirm the sweep moved by exactly four:

   ```bash
   python3 scripts/find-unused-exports.py | head -2
   ```

   prints `NEVER reachable from production code: 22`.

7. **Breaks.** Save as `$TMPDIR/breaks-34-2.sh` and run `bash $TMPDIR/breaks-34-2.sh` from the
   repository root.

   ```bash
   #!/bin/bash
   # Step 2 breaks: the repointed perf tests must still guard what they claim.
   set -u
   cd /Users/muji/repos/rn.athan.uk || exit 1
   caught=0
   total=0

   try() { # try <label> <file> <perl> <expected-failing-test>
     total=$((total + 1))
     cp "$2" "$2.bak"
     perl -pi -e "$3" "$2"
     if cmp -s "$2" "$2.bak"; then
       echo "BREAK NOT APPLIED: $1"
       mv "$2.bak" "$2"
       return
     fi
     if npx jest shared/__tests__/perf.test.ts shared/__tests__/perfBackgroundFlush.test.ts --watchman=false --selectProjects=unit --silent > "$TMPDIR/b34-2.log" 2>&1; then
       echo "NOT CAUGHT: $1 (expected $4 to fail)"
     else
       echo "caught: $1 (expected $4)"
       caught=$((caught + 1))
     fi
     mv "$2.bak" "$2"
   }

   # The background flush must write the ring, with the reason 'background'
   try "background flush writes no ring" shared/perf.ts \
     "s/^    flushRing\(storage, 'background'\);\$/    \/\/ broken/" \
     "flushes the ring snapshot into the perf-monitor MMKV instance"

   # The reason must be the string the tests read
   try "background flush uses the wrong reason" shared/perf.ts \
     "s/flushRing\(storage, 'background'\)/flushRing(storage, 'init')/" \
     "flushes the ring snapshot into the perf-monitor MMKV instance"

   # The listener must be registered at init, or nothing can flush on demand
   try "no AppState listener registered" shared/perf.ts \
     "s/^  AppState\.addEventListener\('change', flushOnBackgroundInto\(storage\)\);\$/  \/\/ broken/" \
     "registers for app state changes when the monitor starts"

   # A mark must reach the ring at all
   try "marks never reach the ring" shared/perf.ts \
     "s/^      ring\.push\(ringEntry\);\$/      \/\/ broken/" \
     "initializes the MMKV ring and records marks with detail and epoch timestamps"

   echo "caught $caught of $total"
   [ "$caught" = "4" ] && echo "ALL AS EXPECTED: 1" || echo "ALL AS EXPECTED: 0"
   ```

   | Break | Expected to fail |
   | --- | --- |
   | background flush writes no ring | `flushes the ring snapshot into the perf-monitor MMKV instance` |
   | background flush uses the wrong reason | the same test |
   | no AppState listener registered | `registers for app state changes when the monitor starts` |
   | marks never reach the ring | `initializes the MMKV ring and records marks with detail and epoch timestamps` |

   Ends `ALL AS EXPECTED: 1`. Every search text is a line this step's own change leaves in place, so
   none of them depends on code the executor wrote.

   Afterwards, `git status --porcelain` must list only this step's files and the three plan files,
   and no `.bak` file may remain.

8. **Version and commit.** Version command as step 1. Add by name:

   ```
   shared/constants.ts
   shared/time.ts
   shared/perf.ts
   shared/__tests__/constants.test.ts
   shared/__tests__/time.test.ts
   shared/__tests__/perf.test.ts
   app.json
   package.json
   ai/plans/README.md
   ai/plans/34-dead-code-sweep/PLAN.md
   ai/plans/34-dead-code-sweep/LOG.md
   ```

   Commit message, to `$TMPDIR/msg-2.txt` with `<VERSION>` replaced:

   ```
   <VERSION> - chore(shared): delete four exports nothing reaches

   ISTIJABA_INDEX, PLATFORM, getSecondsBetween and perfFlush had no caller in any
   screen, hook or store. Each sat at 100% coverage from its own tests, which is
   why no gate reported them.

   Deleting perfFlush orphaned the module-scope perfStorage, so that goes in the
   same commit: Biome fails the build on it, and a private helper nobody calls is
   the same debt one level down.

   perfFlush's five tests do not disappear. Four only listed it among calls that
   must not throw while the monitor is off, and they already assert no MMKV
   instance exists, which proves more. The fifth asserted a named flush reason, so
   it now flushes through the AppState listener the app itself uses and reads
   'background'. The sixth, which covered a flush before init, is gone with the
   only call that could reach that state.

   shared/perf.ts's architecture comment no longer names a function that does not
   exist.
   ```

9. **Review.** Read `git show <sha>` back cold against this list:

   - all four symbols are gone, and nothing else was removed from those three files;
   - `perfStorage` and its assignment are gone, and `PerfStorage` is kept because `flushRing` and
     `recordEntriesInto` still take it;
   - `flushRing` keeps all three live callers: threshold, background and init;
   - the architecture comment matches the plan's replacement text exactly;
   - `backgroundTheApp` is byte-identical to the plan's block;
   - the repointed test keeps its original name, and asserts `'background'`;
   - the four disabled-path tests lost only their `perfFlush` line;
   - no deleted symbol's name survives in a comment anywhere in the three files;
   - no test was weakened: every remaining assertion is the one it had before;
   - the version is bumped in `app.json` and `package.json`, and they match;
   - nothing beyond part 3's files changed.

   A clean read is: four exports and one private variable gone, one comment corrected, three test
   suites lighter by exactly the assertions that only reached the deleted symbols.

   A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```bash
    git checkout uat-2 && git merge --no-ff chore/34-shared-dead-code -m "Merge chore/34-shared-dead-code into uat-2: four dead exports in shared/ removed, reviewed"
    ```

11. **Done when:**

    - `python3 scripts/find-unused-exports.py | head -2` prints
      `NEVER reachable from production code: 22`;
    - `npx tsc --noEmit` exits 0;
    - `npx biome check . --error-on-warnings` exits 0;
    - `grep -rn 'ISTIJABA_INDEX\|getSecondsBetween\|perfFlush\|perfStorage' shared/ app/ components/ stores/ hooks/ device/` prints nothing;
    - `grep -c 'PLATFORM' shared/constants.ts` prints `0`.

    Tick the step in `PLAN.md` section 6, and append to `LOG.md`: the branch, the sha and version,
    the hook's last `Tests:` line and its coverage lines, the break script's last line, the sweep's
    new count, the review verdict and its rounds, and the merge sha.
