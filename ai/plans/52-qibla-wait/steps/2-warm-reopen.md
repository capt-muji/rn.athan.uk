# Step 2: A verified warm reopen draws the compass at once

**Everything in this step was built and run in a scratch worktree during planning.** The contracts below are the
ones that compiled, the test names are the ones that passed, and the breaks are the ones that were caught 14 of
14. The worktree was deleted; the executor writes the code from these contracts.

0. **Anchor check.** From the repository root:

   ```bash
   python3 -c 'import sys;print(open(sys.argv[2]).read().count(open(sys.argv[1]).read()))' \
     ai/plans/52-qibla-wait/scripts/anchors/2-1.txt hooks/useQibla.ts
   ```
   Expect exactly `1`. Any other count means NEEDS REPLAN (`PLAN.md` section 2.2, item 1).

1. **Goal.** A reopen whose first eight readings agree within 3 degrees of the heading the sheet last drew paints
   the compass without the settling wait, and a reopen after the phone moved still pays the full gate.

2. **Branch.**
   ```bash
   git checkout -b feat/qibla-warm-reopen uat-2
   ```

3. **Files.** Exactly these four:
   - `shared/qiblaSettle.ts`
   - `shared/__tests__/qiblaSettle.test.ts`
   - `hooks/useQibla.ts`
   - `components/sheets/screens/__tests__/Qibla.test.tsx`

   Nothing else, apart from `app.json`, `package.json`, `ai/plans/README.md` and this plan folder's `PLAN.md`
   and `LOG.md`. **`components/sheets/screens/Qibla.tsx` is NOT in this step**: the hook reports the new flag and
   step 3 consumes it.

4. **Tests first (red).**

   **Suite A: `shared/__tests__/qiblaSettle.test.ts` (existing).** Add one `describe('isWarmStream', ...)` block
   at the end of the file, holding a local helper and these tests. The helper:

   ```typescript
   const steadyReadings = (degrees: number, count = WARM_CONFIRM_READINGS): number[] =>
     Array.from({ length: count }, () => degrees);
   ```

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `refuses a buffer holding one reading fewer than the confirmation needs` | The count is a real requirement, so one lucky reading cannot skip the gate | `steadyReadings(118.99, WARM_CONFIRM_READINGS - 1)`, remembered `118.99` | `false` |
   | `accepts a phone that has not moved since the sheet last drew` | The common case works | `steadyReadings(118.99)`, remembered `118.99` | `true` |
   | `accepts readings inside the tolerance` | The tolerance is inclusive of real values just under it | `steadyReadings(118.99 + WARM_TOLERANCE_DEGREES - 0.1)`, remembered `118.99` | `true` |
   | `refuses readings just outside the tolerance, so a moved phone pays the full gate` | The boundary is where the constant says | `steadyReadings(118.99 + WARM_TOLERANCE_DEGREES + 0.1)`, remembered `118.99` | `false` |
   | `refuses a phone turned %p degrees while the sheet was closed` | The measured refusals hold. Written as `it.each([5, 15, 40, 90])` | `steadyReadings(118.99 + moved)`, remembered `118.99` | `false` for each of 5, 15, 40, 90 |
   | `compares across north, where a plain mean would read half a turn out` | It uses the circular mean, not an arithmetic one | `steadyReadings(359)`, remembered `1` | `true` |
   | `reads only the most recent readings, so a stale buffer cannot carry a refusal` | Only the last `WARM_CONFIRM_READINGS` count, so an early disagreement cannot poison a later agreement | `[...steadyReadings(40, WARM_CONFIRM_READINGS), ...steadyReadings(118.99)]`, remembered `118.99` | `true` |

   The suite's import from `'../qiblaSettle'` gains `isWarmStream`, `WARM_CONFIRM_READINGS` and
   `WARM_TOLERANCE_DEGREES`, in the existing alphabetical order Biome's organiser enforces.

   **Suite B: `components/sheets/screens/__tests__/Qibla.test.tsx` (existing).** One helper and five tests.

   The helper goes directly after `reportLostHeadings` and before the file's `beforeEach`:

   ```typescript
   /**
    * Drives exactly the readings a warm reopen is confirmed by, advancing NO clock.
    *
    * Advancing none is the point: a warm reopen must draw without the settling window ever spanning, so a helper
    * that moved the clock could not tell the warm path from the ordinary gate.
    */
   const reportWarmConfirmation = async (trueHeading: number, count = WARM_CONFIRM_READINGS) => {
     // The LIVE watcher only: mockWatchers keeps every open's subscription, so notifying all of them would
     // deliver one reading per past visit and a test counting readings would be counting opens
     const watcher = mockWatchers[mockWatchers.length - 1];

     await act(async () => {
       for (let i = 0; i < count; i++) watcher({ trueHeading });
     });
   };
   ```

   **That comment is load-bearing and was earned by a failure during planning.** The suite's existing
   `reportHeadings` notifies every watcher in `mockWatchers`, which is correct for it because it advances the
   clock and only the window matters. A test that COUNTS readings must notify one watcher, or the second open
   delivers two readings per iteration and a test proving "seven readings is not enough" silently passes eight.

   All five tests go inside the existing `describe('reopening the sheet in the same place', ...)`, after its last
   test (`never draws the compass on the first frame of a reopen, however complete the last visit was`).

   | Test name | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `draws the compass without the settling wait when the phone has not moved since it last drew` | The feature itself | `openSheet()`, `reportHeadings(95)`, dismiss, present, `reportWarmConfirmation(95)` | `screen.getByTestId('qibla-dial')` is on the screen |
   | `refuses to draw on fewer readings than the confirmation asks for` | The count has teeth. Carries the comment below | same, but `reportWarmConfirmation(95, WARM_CONFIRM_READINGS - 1)` | `screen.queryByTestId('qibla-dial')` is `null` |
   | `still waits out the settling gate when the phone was turned while the sheet was closed` | A moved phone is refused | same, but `reportWarmConfirmation(200)` | `queryByTestId('qibla-dial')` is `null` |
   | `waits out the settling gate on a first open, because nothing is remembered to check against` | No remembered heading means no shortcut | `openSheet()`, then `reportWarmConfirmation(95)` with no prior visit | `queryByTestId('qibla-dial')` is `null` |
   | `fires no arrival haptic on a warm reopen, because nothing arrived` | **This test only passes after step 3**, so it is written here and expected to fail until then. See the note below | `openSheet()`, `reportHeadings(95)`, dismiss, `jest.mocked(Haptics.notificationAsync).mockClear()`, present, `reportWarmConfirmation(95)` | `Haptics.notificationAsync` not called |
   | `fires the arrival haptic on a reopen that had to wait, because the compass did arrive` | The haptic still fires when something genuinely arrived | same, but `reportHeadings(200)` instead | `Haptics.notificationAsync` was called |

   **The haptic test's comment, verbatim:**
   ```typescript
   // One matching reading is noise, not a converged stream: the confirmation is a COUNT as well as a tolerance,
   // and a single sample agreeing by chance must not be enough to skip the gate
   ```
   goes above `refuses to draw on fewer readings than the confirmation asks for`.

   **The two haptic tests move to step 3.** They are listed here so the executor knows the whole shape, and
   step 3's part 4 is where they are written. Writing them in this step would leave `uat-2` red between steps,
   which `PLAN.md` section 6 forbids.

   The suite's import from `'@/shared/qiblaSettle'` gains `WARM_CONFIRM_READINGS`.

   **Existing tests that must NOT change:** every test already in both suites, including
   `never draws the compass on the first frame of a reopen`, which proves a reopen's FIRST frame is blank. That
   remains true: the confirmation needs eight readings, and the first frame has none.

   Run both suites:
   ```bash
   npx jest components/sheets/screens/__tests__/Qibla.test.tsx shared/__tests__/qiblaSettle.test.ts --watchman=false
   ```

   **Expected failures before the change.** `shared/__tests__/qiblaSettle.test.ts` fails to compile at all:
   ```
   TypeScript error: Module '"../qiblaSettle"' has no exported member 'isWarmStream'.
   ```
   and the four behaviour tests in suite B fail on the dial assertion, because today every open waits the full
   gate. If any other test fails, STOP (`PLAN.md` section 2.2, item 2).

5. **Change.** This step is **(specified)**.

   ### `shared/qiblaSettle.ts`

   **Two constants, added after `SETTLE_DRIFT_DEGREES` and before the `HeadingSample` interface.** Both are
   exported, because both tests and the hook read them.

   | Name | Type | Value | What it means |
   | --- | --- | --- | --- |
   | `WARM_CONFIRM_READINGS` | `number` | `8` | How many readings of a reopen must agree before the remembered heading is trusted |
   | `WARM_TOLERANCE_DEGREES` | `number` | `3` | How far those readings may sit from the remembered heading |

   Their JSDoc, verbatim, because each carries the measurement that chose it:

   ```typescript
   /**
    * How many readings of a reopen must agree with the heading the sheet last drew before it is trusted.
    *
    * Eight is the first count that agreed on every run across every noise level measured, so it is the first that
    * never discards a genuinely warm stream, and at the ~14Hz the platform emits it costs about 420ms.
    */
   export const WARM_CONFIRM_READINGS = 8;

   /**
    * How far a reopen's readings may sit from the remembered heading and still count as the same stream.
    *
    * Three degrees accepts a phone that has not moved and refuses one carried or turned: five degrees of real
    * movement fails it every time, which is what makes this a measurement rather than an assumption about the OS.
    */
   export const WARM_TOLERANCE_DEGREES = 3;
   ```

   **One function, `isWarmStream`, added directly above `hasSettled`.**

   - Signature: `(readings: number[], rememberedDegrees: number): boolean`
   - It answers: whether a reopen has met the same stream it left, so the settling wait would only re-prove what
     was already proven.
   - It must never: read fewer than `WARM_CONFIRM_READINGS`; use an arithmetic mean (it must go through
     `circularMean`, or a comparison across north is half a turn out); or consider readings older than the last
     `WARM_CONFIRM_READINGS`.
   - It writes no log lines and throws nothing.
   - It is pure, and it takes plain numbers rather than `HeadingSample`s, because the confirmation is a count
     rather than a span and timestamps would be dead weight.

   Its JSDoc, verbatim:
   ```typescript
   /**
    * Whether a reopen has met the SAME stream it left, so the settling wait would only re-prove what it proved.
    *
    * A reopen cannot be trusted because it happened recently: the fusion may have been reset and the phone may
    * have been carried or turned. So the remembered heading is VERIFIED against live readings instead.
    */
   ```

   **Nothing else in this file changes.** `SETTLE_WINDOW_MS` stays `3000`, `SETTLE_MIN_READINGS` stays `8`,
   `SETTLE_DRIFT_DEGREES` stays `1.5`, and `hasSettled`'s body is untouched.

   ### `hooks/useQibla.ts`

   **The import** from `'@/shared/qiblaSettle'` gains `isWarmStream`.

   **`QiblaState` gains one field:**
   ```typescript
   /** Whether the compass arrived on a stream proven warm, so nothing was waited for and nothing arrived to announce */
   arrivedWarm: boolean;
   ```
   and `useState`'s initial object gains `arrivedWarm: false`.

   **Two refs, added after `placeRef`:**
   ```typescript
   // Outlives stop(), which is the whole point: it is what a reopen checks the fresh stream against
   const warmHeadingRef = useRef<number | null>(null);
   const confirmRef = useRef<number[]>([]);
   ```

   | Ref | Holds | Cleared by | NOT cleared by |
   | --- | --- | --- | --- |
   | `warmHeadingRef` | the last heading the sheet actually drew, or `null` | `blank()`, because a genuinely lost stream may mean the phone was carried | **`stop()`. This is the step's whole purpose** |
   | `confirmRef` | the readings of the current visit, for the confirmation | `stop()`, `start()`, and the `NO_HEADING` branch | nothing else |

   **`stop()`** gains `confirmRef.current = [];` directly after `settledRef.current = false;`, and its final
   `setState` carries `arrivedWarm: false` alongside `hasHeading: false`. **It must NOT clear
   `warmHeadingRef`**: anticipated review fix 2 in `PLAN.md` section 10 exists for exactly this mistake.

   **`blank()`** gains `warmHeadingRef.current = null;` directly after `settledRef.current = false;`.

   **`start()`** gains `confirmRef.current = [];` directly after `bearingRef.current = null;`.

   **The `NO_HEADING` branch** in `processReading` gains `confirmRef.current = [];` directly after the existing
   `samplesRef.current = [];`.

   **The gate at anchor `2-1` becomes**, verbatim, because every term matters:

   ```typescript
      let arrivedWarm = false;

      if (!settledRef.current) {
        const remembered = warmHeadingRef.current;
        confirmRef.current = [...confirmRef.current, trueHeading];
        // A reopen meeting the stream it left has already paid for this window once, so re-proving it is pure wait
        arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);

        if (!arrivedWarm && !hasSettled(window, nowMs)) return;
        settledRef.current = true;
      }
   ```

   **Why `arrivedWarm` is a local rather than a second state write, which matters for coverage:** the block runs
   at most once per visit, because `settledRef` latches. A `setState` guarded by `previous.arrivedWarm ? ...`
   inside it therefore has an unreachable branch, and the coverage gate refused the commit at 97.82% during
   planning. One flag, carried out of the block and written once with `hasHeading`, has no dead branch.

   **The existing `hasHeading` write becomes:**
   ```typescript
   setState((previous) => (previous.hasHeading ? previous : { ...previous, hasHeading: true, arrivedWarm }));
   ```

   **And one line is added directly above it:**
   ```typescript
   warmHeadingRef.current = trueHeading;
   ```
   It sits after `heading.value = unwrapHeading(...)` and before the `setState`, so only a heading that reached
   the dial is ever remembered. A reading that returned early must never be remembered.

   **The invariant:** the compass draws without the settling wait only when the mean of the last
   `WARM_CONFIRM_READINGS` readings is within `WARM_TOLERANCE_DEGREES` of the heading the sheet last drew, and
   in every other case `hasSettled` alone decides.

   **Cases it must hold in, all five covered by the tests in part 4:** a first ever open (no remembered
   heading); a reopen in the same spot (warm); a reopen after turning (refused); a reopen with too few readings
   (refused); and a lost fix mid-visit (`confirmRef` cleared, so readings from before the loss cannot confirm).

6. **Green.** Same command:
   ```bash
   npx jest components/sheets/screens/__tests__/Qibla.test.tsx shared/__tests__/qiblaSettle.test.ts --watchman=false
   ```
   **Expected, measured in the planning worktree:** `Tests: 105 passed, 105 total` across 2 suites, where the
   component suite holds 79 and the settle suite 26. The count may differ if step 1 added its own; what must be
   true is zero failures.

   Then both, each expected to exit 0:
   ```bash
   npx tsc --noEmit
   npx biome check . --error-on-warnings
   ```
   Biome's expected last line is `Checked <n> files in <t>ms. No fixes applied.`

   **Then the coverage of the two changed source files, because the hook's branches are the risk:**
   ```bash
   npx jest --watchman=false --coverage --collectCoverageFrom='hooks/useQibla.ts' --coverageReporters=text
   ```
   `useQibla.ts` must read `100` in all four columns with an empty `Uncovered Line #s`. Anything less means a
   branch has no test: add one to suite B rather than changing the code.

7. **Breaks.** Save as `ai/plans/52-qibla-wait/scripts/breaks-2.sh`, run with
   `bash ai/plans/52-qibla-wait/scripts/breaks-2.sh` from the repository root.

   ```bash
   #!/usr/bin/env bash
   set -u
   cd "$(git rev-parse --show-toplevel)" || exit 1

   SUITES="components/sheets/screens/__tests__/Qibla.test.tsx shared/__tests__/qiblaSettle.test.ts"
   CAUGHT=0
   TOTAL=0
   UNEXPECTED=0

   run_break() {
     local label="$1" file="$2" search="$3" replace="$4"
     TOTAL=$((TOTAL + 1))
     cp "$file" "$file.bak"
     perl -0pi -e "s/\Q$search\E/$replace/" "$file"
     if cmp -s "$file" "$file.bak"; then
       echo "BREAK NOT APPLIED: $label"
       UNEXPECTED=$((UNEXPECTED + 1))
       mv "$file.bak" "$file"
       return
     fi
     if npx jest $SUITES --watchman=false >/dev/null 2>&1; then
       echo "SURVIVED: $label"
       UNEXPECTED=$((UNEXPECTED + 1))
     else
       echo "CAUGHT: $label"
       CAUGHT=$((CAUGHT + 1))
     fi
     mv "$file.bak" "$file"
   }

   H=hooks/useQibla.ts
   S=shared/qiblaSettle.ts

   run_break "warm path disabled" "$H" \
     "arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);" \
     "arrivedWarm = false;"
   run_break "warm path always on" "$H" \
     "arrivedWarm = remembered !== null && isWarmStream(confirmRef.current, remembered);" \
     "arrivedWarm = remembered !== null;"
   run_break "remembered heading never stored" "$H" "warmHeadingRef.current = trueHeading;" ""
   run_break "remembered heading cleared on close" "$H" \
     "    confirmRef.current = [];
    clearBlank();" \
     "    confirmRef.current = [];
    warmHeadingRef.current = null;
    clearBlank();"
   run_break "confirm buffer not reset on open" "$H" \
     "    bearingRef.current = null;
    confirmRef.current = [];" \
     "    bearingRef.current = null;"
   run_break "confirm buffer not cleared on lost fix" "$H" \
     "        samplesRef.current = [];
        confirmRef.current = [];" \
     "        samplesRef.current = [];"
   run_break "tolerance widened" "$S" \
     "export const WARM_TOLERANCE_DEGREES = 3;" "export const WARM_TOLERANCE_DEGREES = 90;"
   run_break "confirm count dropped to 1" "$S" \
     "export const WARM_CONFIRM_READINGS = 8;" "export const WARM_CONFIRM_READINGS = 1;"
   run_break "isWarmStream ignores the count" "$S" \
     "  if (readings.length < WARM_CONFIRM_READINGS) return false;" ""
   run_break "isWarmStream reads whole buffer" "$S" \
     "const recent = readings.slice(-WARM_CONFIRM_READINGS);" "const recent = readings;"

   echo "CAUGHT: $CAUGHT of $TOTAL"
   echo "ALL AS EXPECTED: $([ "$UNEXPECTED" = "0" ] && echo 1 || echo 0)"
   ```

   **Expected: every one CAUGHT, `CAUGHT: 10 of 10`, and `ALL AS EXPECTED: 1`.** All ten were run in the
   planning worktree and all ten were caught. Which test catches each:

   | Break | Test that fails |
   | --- | --- |
   | warm path disabled | `draws the compass without the settling wait...` |
   | warm path always on | `still waits out the settling gate when the phone was turned...` |
   | remembered heading never stored | `draws the compass without the settling wait...` |
   | remembered heading cleared on close | `draws the compass without the settling wait...` |
   | confirm buffer not reset on open | `waits out the settling gate on a first open...` |
   | confirm buffer not cleared on lost fix | an existing lost-fix test in suite B |
   | tolerance widened | `refuses readings just outside the tolerance...` and `still waits out...` |
   | confirm count dropped to 1 | `refuses to draw on fewer readings than the confirmation asks for` |
   | isWarmStream ignores the count | `refuses a buffer holding one reading fewer...` |
   | isWarmStream reads whole buffer | `reads only the most recent readings...` |

8. **Version and commit.**
   ```bash
   node -e 'const v=require("./package.json").version.split(".").map(Number);v[2]+=1;console.log(v.join("."))'
   ```
   Set it in `app.json` (`expo.version`), `package.json` (`version`), and `android/app/build.gradle`
   (`versionName`) if `android/` exists.

   ```bash
   git add shared/qiblaSettle.ts shared/__tests__/qiblaSettle.test.ts hooks/useQibla.ts components/sheets/screens/__tests__/Qibla.test.tsx app.json package.json
   ```

   ```bash
   git commit -F - <<'EOF'
   <VERSION> - feat: a verified warm reopen draws the qibla compass at once

   Every open paid the settling wait, including a reopen seconds later in the same
   spot where the heading had not moved. Measured, an already-converged stream
   still spent 2700ms re-proving what it had proven, at 0.00 degrees of benefit.

   A reopen is now VERIFIED rather than assumed warm: the sheet remembers the last
   heading it drew, and when the first eight readings of the next visit agree with
   it within 3 degrees the compass draws without the wait. Eight at 3 degrees is
   the first combination that agreed on every run at every noise level measured,
   and a phone turned 5 degrees or more fails it every time, so a user who walked
   or turned still pays the full gate.

   Elapsed time is deliberately not the test. The fusion may have been reset and
   the phone may have been carried, so the remembered heading is checked against
   live readings instead.

   SETTLE_WINDOW_MS is unchanged at 3000ms. It is the shortest window whose p95
   error fits ALIGNMENT_ENTER_DEGREES, so shortening it would let the haptic fire
   while the user is outside the window it announces.

   Tests: 17 new, and all 10 breaks caught, including the one that matters most,
   deleting the warm path entirely.
   EOF
   ```

   The hook runs the full suite and the coverage gate. **Expected, measured during planning: 187 suites, 5059
   passed, and four `100%` coverage lines.**

9. **Review.** Read the diff back cold against this list:

   - [ ] `SETTLE_WINDOW_MS`, `SETTLE_MIN_READINGS` and `SETTLE_DRIFT_DEGREES` are byte-identical to `uat-2`.
   - [ ] `hasSettled`'s body is byte-identical to `uat-2`.
   - [ ] `isWarmStream` goes through `circularMean` and `headingDelta`, not an arithmetic mean or a raw subtraction.
   - [ ] `isWarmStream` slices the last `WARM_CONFIRM_READINGS`, so a stale buffer cannot poison it.
   - [ ] **`stop()` does NOT clear `warmHeadingRef`.** Anticipated review fix 2 if it does.
   - [ ] `blank()` DOES clear `warmHeadingRef`, because a lost stream may mean a carried phone.
   - [ ] `confirmRef` is cleared in `stop()`, in `start()` and in the `NO_HEADING` branch, and nowhere else.
   - [ ] `warmHeadingRef.current = trueHeading` sits AFTER the alignment and dial writes, so a reading that
         returned early is never remembered.
   - [ ] `arrivedWarm` is a local inside `processReading`, written once into state with `hasHeading`. No second
         `setState`, no guarded branch that cannot be reached.
   - [ ] Every comment explains WHY. The four that ship are the two constants' JSDoc, `isWarmStream`'s JSDoc,
         the `warmHeadingRef` note and the "already paid for this window once" line.
   - [ ] No comment explains WHAT or HOW. Anticipated review fix 1 if one does.
   - [ ] Nothing outside the four files and the version files changed. In particular
         `components/sheets/screens/Qibla.tsx` is untouched: it is step 3's.
   - [ ] No visual changed: no spacing, no colour, no size, no animation duration.

   A clean read is: two constants, one pure function, two refs, five small edits in `processReading`, `stop()`,
   `blank()` and `start()`, and 17 tests. A finding is handled by `EXECUTOR-BRIEF.md` section 4, item 8, or by
   `PLAN.md` section 10; anything else is a STOP.

10. **Merge.**
    ```bash
    git checkout uat-2 && git merge --no-ff feat/qibla-warm-reopen \
      -m "Merge feat/qibla-warm-reopen into uat-2: session 52 step 2, a verified warm reopen draws the compass at once"
    ```

11. **Done when:**
    ```bash
    grep -c 'export const WARM_CONFIRM_READINGS = 8;' shared/qiblaSettle.ts
    grep -c 'export const SETTLE_WINDOW_MS = 3000;' shared/qiblaSettle.ts
    ```
    both print `1`, and
    ```bash
    git diff uat-2@{1} -- shared/qiblaSettle.ts | grep -c '^-.*SETTLE_WINDOW_MS'
    ```
    prints `0`, proving the window was not touched, and
    ```bash
    npx jest components/sheets/screens/__tests__/Qibla.test.tsx shared/__tests__/qiblaSettle.test.ts --watchman=false
    ```
    reports no failures, and `bash ai/plans/52-qibla-wait/scripts/breaks-2.sh` ends `CAUGHT: 10 of 10` then
    `ALL AS EXPECTED: 1`.
