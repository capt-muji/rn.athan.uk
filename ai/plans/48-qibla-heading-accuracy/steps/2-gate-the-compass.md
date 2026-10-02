# Step 2: The compass waits for the stream to converge

0. **Anchor check:** run the section 3 pre-flight with `2`. All three anchors must print `1`:

   ```
   anchor 2-1-useQibla-processReading.txt -> hooks/useQibla.ts : 1
   anchor 2-2-useQibla-imports.txt -> hooks/useQibla.ts : 1
   anchor 2-3-useQibla-refs.txt -> hooks/useQibla.ts : 1
   ```

   Any other count means NEEDS REPLAN.

1. **Goal:** `useQibla` draws a heading only once the stream has settled, and `heldRef` is deleted because
   the window replaces what it carried.

2. **Branch:** `git checkout -b feat/48-2-gate-the-compass uat-2`

3. **Files:**
   - `hooks/useQibla.ts`
   - `components/sheets/screens/__tests__/Qibla.test.tsx`
   - `app.json`, `package.json` (version)
   - `ai/plans/README.md`, and this folder's `PLAN.md` and `LOG.md`, if changed

   Nothing else may change. In particular `shared/qiblaAlignment.ts`, `shared/qiblaGeometry.ts`,
   `shared/qiblaCompass.ts`, `device/qibla.ts` and `components/sheets/screens/Qibla.tsx` are NOT touched.

4. **Tests first (red).**

   This step changes an existing suite rather than adding one. **`components/sheets/screens/__tests__/Qibla.test.tsx`
   is carried verbatim** at `ai/plans/48-qibla-heading-accuracy/working-code/components___tests___Qibla.test.tsx.txt`.
   Copy it over the existing file and change nothing in it.

   **Why it is carried rather than specified line by line:** the gate changes a precondition that **18 of the
   suite's 47 tests** depend on, and the planning session measured every one of them. Specifying 18 edits
   invites 18 divergences; carrying the file makes the executor's job a copy.

   **What changed in it, so the reviewer and the auditor can check the copy is the right one:**

   | Change | Why | Measured |
   | --- | --- | --- |
   | `reportHeadings` now calls `jest.useFakeTimers()`, sends `SETTLE_MIN_READINGS` copies of each heading, and advances the clock by `SETTLE_WINDOW_MS / (SETTLE_MIN_READINGS - 1)` between them | The gate needs a window that SPANS its period, and one reading cannot span it | 18 failures became 2 |
   | A new `reportLostHeadings(count)` helper drives `-1` with NO clock advance of its own | A lost heading must not run down the 1500ms dropout grace this suite also tests, and those tests drive that clock themselves | 2 failures became 1 |
   | `a heading that arrives before the position` renamed to `counts toward the settling window while the fix is still being read, rather than being dropped`, and it now reports a full window before the fix lands plus one reading after | **The one genuine behaviour change.** `heldRef` kept ONE reading, so a replayed single reading could never settle a window. Readings now enter the window before the bearing exists, which is strictly better: the window fills DURING the position read instead of waiting for it | 47 of 47 passing |
   | Imports `SETTLE_MIN_READINGS` and `SETTLE_WINDOW_MS` from `@/shared/qiblaSettle` | The helper must not restate the module's numbers | |
   | **A new `describe('the settling gate')` with THREE tests** | **Found by running the break script.** Without them, DELETING THE GATE ENTIRELY still passed all 47 tests, because every existing test now reports a settled window and so cannot tell a gated compass from an ungated one | 3 of 6 breaks caught became 6 of 6 |

   **The three tests that actually guard the gate**, and why the suite needed them:

   | Test | What it proves | Inputs | Asserts |
   | --- | --- | --- | --- |
   | `draws nothing on a single reading, however good it looks` | The gate refuses an unspanned window. **This is the test that catches the gate being removed** | One reading of 118, no clock advance | `queryByTestId('qibla-dial')` is null |
   | `draws nothing while the stream is still converging, even though it is smooth` | DRIFT is the test rather than spread. The stream is quiet between readings and still 20 degrees out, which is exactly what a spread gate accepted at 27.22 degrees of error | 16 readings decaying from 20 degrees of error, clock advanced between each | `queryByTestId('qibla-dial')` is null |
   | `fires no haptic on a reading it refuses to draw` | The gate sits ABOVE the haptic, so a blind user feels nothing on a reading the screen refused. **This is the test that catches the gate being moved below it** | One reading of 118.99, dead on the London line | `Haptics.impactAsync` not called |

   Command, path first:

   ```
   npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components
   ```

   **Before the change**, with the carried test file in place and `hooks/useQibla.ts` untouched, the suite
   fails on the three `the settling gate` tests plus the renamed one. The settling import resolves, because
   step 1 shipped the module, but the hook ignores it, so a single reading still draws the dial:

   ```
   expect(received).toBeNull()

   Received has value: <View testID="qibla-dial" ... />
   ```

   and `fires no haptic on a reading it refuses to draw` fails with
   `expect(jest.fn()).not.toHaveBeenCalled()`.

   If the suite passes before the change, the gate is already present and something is wrong: STOP.

   **Tests that must NOT change:** every suite in `device/__tests__/qibla.test.ts` (16),
   `shared/__tests__/qiblaAlignment.test.ts`, `shared/__tests__/qiblaCompass.test.ts`,
   `shared/__tests__/qiblaGeometry.test.ts` and `shared/__tests__/qiblaSettle.test.ts` (16). The gate is
   downstream of all of them.

5. **Change.** `hooks/useQibla.ts`, five edits. The finished file is carried at
   `ai/plans/48-qibla-heading-accuracy/working-code/hooks_useQibla.ts.txt`, built and proven at `ad131a51`.
   Copy it over `hooks/useQibla.ts`.

   The contract of what changes, so the review can check it rather than diff it:

   | Edit | What | Why |
   | --- | --- | --- |
   | 1 | Add `import { type HeadingSample, hasSettled, trailingWindow } from '@/shared/qiblaSettle';` **after** the `qiblaGeometry` import | Biome's `organizeImports` sorts `qiblaSettle` after `qiblaGeometry`. Placing it earlier fails `biome check` |
   | 2 | Replace the `heldRef` declaration with `const samplesRef = useRef<HeadingSample[]>([]);` | The window carries what `heldRef` carried, and more of it |
   | 3 | In `stop`, add `samplesRef.current = [];` | A reopened sheet must not settle instantly on the previous session's window |
   | 4 | In `processReading`, **move the `bearing === null` check AFTER the window append**, and delete the `heldRef.current = trueHeading` branch. Add `samplesRef.current = [];` to the `NO_HEADING` branch. Append to the window, then `if (!hasSettled(window, nowMs)) return;` immediately before the alignment work | The ORDER is the design: readings collected before the bearing exists fill the window during the position read. The gate sits above the alignment, the haptic and `hasHeading`, so a tap is never felt on a refused reading |
   | 5 | In `start`, delete the `heldRef` reset and the three-line held replay | `heldRef` no longer exists |

   `processReading`'s resulting order, which the review checks:

   1. `trueHeading === NO_HEADING`: clear alignment, clear the samples, arm the grace timer, return.
   2. Append `{ degrees: trueHeading, atMs: Date.now() }` and keep only the trailing window.
   3. `bearing === null`: return. The sample is already banked.
   4. `clearBlank()`.
   5. `!hasSettled(window, nowMs)`: return.
   6. Alignment, the haptic, `aligned`, `heading.value`, `hasHeading`.

   **No signature changes**, no new export from this file, and no log lines: this hook writes none today and
   writes none after.

   Comments explain why, never what, and extremely compactly. The three the plan specifies are in the carried
   file.

6. **Green.**

   ```
   npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components
   ```

   Expected:

   ```
   Tests:       50 passed, 50 total
   ```

   Then the suites that must be unaffected:

   ```
   npx jest device/__tests__/qibla.test.ts shared/__tests__/qiblaSettle.test.ts --watchman=false --selectProjects=unit
   ```

   Expected `Tests:       32 passed, 32 total`.

   Then `npx tsc --noEmit` and `npx biome check . --error-on-warnings`, both exit 0.

   Coverage on the two files this plan touches, measured in the scratch worktree at `ad131a51`:

   ```
   Statements   : 100% ( 133/133 )
   Branches     : 100% ( 40/40 )
   Functions    : 100% ( 23/23 )
   Lines        : 100% ( 110/110 )
   ```

7. **Breaks.** Save this as `$TMPDIR/breaks-48-2.sh` and run `bash $TMPDIR/breaks-48-2.sh` from the
   repository root.

   ```bash
   #!/bin/bash
   # Every decision the gate makes in the hook, broken one at a time.
   set -u
   SRC="hooks/useQibla.ts"
   TESTS="components/sheets/screens/__tests__/Qibla.test.tsx"
   CAUGHT=0
   TOTAL=0

   run_break() {
     local label="$1"
     local search="$2"
     local replace="$3"
     TOTAL=$((TOTAL + 1))
     cp "$SRC" "$SRC.bak"
     perl -pi -e "s|\Q$search\E|$replace|" "$SRC"
     if cmp -s "$SRC" "$SRC.bak"; then
       echo "BREAK NOT APPLIED: $label"
       mv "$SRC.bak" "$SRC"
       return
     fi
     if npx jest "$TESTS" --watchman=false --selectProjects=components >/dev/null 2>&1; then
       echo "SURVIVED: $label"
     else
       echo "caught: $label"
       CAUGHT=$((CAUGHT + 1))
     fi
     mv "$SRC.bak" "$SRC"
   }

   run_break "the gate is removed, so a cold first reading is drawn" \
     'if (!settledRef.current && !hasSettled(window, nowMs)) return;' \
     ''

   # The defect the owner found on device: a gate re-tested per reading drops every update made while the
   # phone turns, so the compass only moves when it is held still
   run_break "the gate stops latching, so it re-tests on every reading" \
     'if (!settledRef.current && !hasSettled(window, nowMs)) return;' \
     'if (!hasSettled(window, nowMs)) return;'

   # Deletes the latch reset inside `blank` only, identified by the comment that sits above it, because the
   # same assignment also appears in `stop` and a bare substitution would hit the wrong one
   run_break_blank_latch() {
     local label="the latch is never reset, so a lost stream draws cold on its return"
     TOTAL=$((TOTAL + 1))
     cp "$SRC" "$SRC.bak"
     perl -0pi -e 's|// The stream is genuinely gone[^\n]*\n(\s*)settledRef\.current = false;\n|$1|s' "$SRC"
     if cmp -s "$SRC" "$SRC.bak"; then
       echo "BREAK NOT APPLIED: $label"
       mv "$SRC.bak" "$SRC"
       return
     fi
     if npx jest "$TESTS" --watchman=false --selectProjects=components >/dev/null 2>&1; then
       echo "SURVIVED: $label"
     else
       echo "caught: $label"
       CAUGHT=$((CAUGHT + 1))
     fi
     mv "$SRC.bak" "$SRC"
   }
   run_break_blank_latch

   run_break "the gate is inverted" \
     'if (!settledRef.current && !hasSettled(window, nowMs)) return;' \
     'if (!settledRef.current && hasSettled(window, nowMs)) return;'

   run_break "the window is not trimmed, so samples accumulate forever" \
     'const window = trailingWindow([...samplesRef.current, { degrees: trueHeading, atMs: nowMs }], nowMs);' \
     'const window = [...samplesRef.current, { degrees: trueHeading, atMs: nowMs }];'

   run_break "the window is never stored, so it can never fill" \
     'samplesRef.current = window;' \
     ''

   # Deletes the LAST of the two `samplesRef.current = []` lines, which is the one in the NO_HEADING
   # branch. `perl -0pi` slurps the file, because a one-line-at-a-time substitution cannot tell the two
   # apart, and `\Q\E` does not survive an embedded newline in a shell-quoted search string.
   run_break_last_clear() {
     local label="a lost heading leaves its stale half-window behind"
     TOTAL=$((TOTAL + 1))
     cp "$SRC" "$SRC.bak"
     perl -0pi -e 's|(.*)\n(\s*)samplesRef\.current = \[\];\n(\s*)if \(!blankRef|$1\n$3if (!blankRef|s' "$SRC"
     if cmp -s "$SRC" "$SRC.bak"; then
       echo "BREAK NOT APPLIED: $label"
       mv "$SRC.bak" "$SRC"
       return
     fi
     if npx jest "$TESTS" --watchman=false --selectProjects=components >/dev/null 2>&1; then
       echo "SURVIVED: $label"
     else
       echo "caught: $label"
       CAUGHT=$((CAUGHT + 1))
     fi
     mv "$SRC.bak" "$SRC"
   }
   run_break_last_clear

   run_break "the gate sits BELOW the haptic, so a tap fires on a refused reading" \
     'if (!settledRef.current && !hasSettled(window, nowMs)) return;' \
     'const settled = hasSettled(window, nowMs);'

   echo ""
   echo "caught $CAUGHT of $TOTAL"
   if [ "$CAUGHT" -eq "$TOTAL" ]; then echo "ALL AS EXPECTED: 1"; else echo "ALL AS EXPECTED: 0"; fi
   ```

   Each break must print `caught`, and the script must end:

   ```
   ALL AS EXPECTED: 1
   ```

   The sixth break leaves an unused variable, so it fails the suite through tsc rather than an assertion;
   that still counts as caught, because the point is that the gate cannot be moved below the haptic without
   something failing. If any break prints `SURVIVED` or `BREAK NOT APPLIED`, STOP.

   Afterwards `git status --porcelain` must list only this step's files and the three plan files.

8. **Version and commit.**

   ```
   node -e "const p=require('./package.json');const [a,b,c]=p.version.split('.').map(Number);console.log(\`\${a}.\${b}.\${c+1}\`)"
   ```

   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`).

   Add by name: `hooks/useQibla.ts`, `components/sheets/screens/__tests__/Qibla.test.tsx`, `app.json`,
   `package.json`, and the three plan files if changed.

   Message to `$TMPDIR/msg-48-2.txt`:

   ```
   <VERSION> - fix(qibla): the compass waits for the heading to settle before it draws

   The owner's symptom: the same phone at the same spot read 5, 10, 20 or 30 degrees differently on
   each app restart, which is why the feature is not released.

   Half of that is a cold sensor fusion. A fused heading arms from cold and walks toward the truth,
   and the app drew the first step of that walk: measured against a stream carrying expo-location's
   own 2-degree and 50ms gate, the first reading is about 30 degrees out where the converged one is
   0.71. The compass now draws nothing, and the haptic fires nothing, until the stream's trailing
   3000ms window holds 8 readings spanning the period whose two halves agree within 1.5 degrees.

   `heldRef` is DELETED, and that is an improvement rather than a trade. It kept ONE reading to
   replay once the bearing arrived; readings now enter the settling window before the bearing exists,
   so the window fills DURING the position read instead of waiting for it.

   The other half of the symptom is iron in the room and no software can fix it. That is measured
   rather than asserted, and it retires the lever session 40 specified: a stable bias passes every
   gate on the heading stream at 1.0x improvement, and the field-magnitude and dip check cannot bound
   it either, missing 30.8 degrees at a 10 uT offset because a compass reads only the horizontal
   field, 40% of the total at London. Detail in
   `ai/plans/48-qibla-heading-accuracy/MEASURED.md` and `DECISION.md`.

   18 of the sheet suite's 47 tests depended on one reading drawing the dial, and each was measured
   rather than adjusted until green: a shared helper now reports a settled window, a separate helper
   drives a lost heading without running down the dropout grace, and one test's name changed because
   its behaviour genuinely did.
   ```

   Commit with `git commit -F $TMPDIR/msg-48-2.txt` in the background. The hook's last `Tests:` line ends
   `passed, <n> total` and four `100%` coverage lines are present.

9. **Review.** Read `git show <sha>` back cold, against this checklist:

   - [ ] `processReading` runs in the order section 5 gives: `NO_HEADING` first, then the window append, then
         the `bearing === null` return, then `clearBlank`, then the gate, then the alignment work.
   - [ ] **The gate is ABOVE the haptic.** A refused reading fires no `Haptics.impactAsync`.
   - [ ] `samplesRef` is cleared in `stop` AND in the `NO_HEADING` branch.
   - [ ] `heldRef` is gone: no declaration, no reset in `start`, no replay. `grep -n heldRef hooks/useQibla.ts`
         prints nothing.
   - [ ] `trailingWindow` is called exactly once per reading.
   - [ ] The settling import sits after the `qiblaGeometry` import, so Biome is clean.
   - [ ] The test file is byte-identical to the carried copy.
   - [ ] No change to `shared/qiblaAlignment.ts`, `shared/qiblaGeometry.ts`, `shared/qiblaCompass.ts`,
         `device/qibla.ts` or `components/sheets/screens/Qibla.tsx`.
   - [ ] No `Platform` check added anywhere in the qibla path.
   - [ ] No constant beyond step 1's three, and none of them adjusts a heading.
   - [ ] Every comment explains WHY, compactly.

   A clean read: one hook changed, one suite changed, `heldRef` deleted, nothing else. A finding is handled
   by `EXECUTOR-BRIEF.md` section 4, item 8.

10. **Merge.**

    ```
    git checkout uat-2 && git merge --no-ff feat/48-2-gate-the-compass -m "Merge feat/48-2-gate-the-compass into uat-2: session 48 step 2, reviewed"
    ```

11. **Done when:**

    ```
    npx jest components/sheets/screens/__tests__/Qibla.test.tsx --watchman=false --selectProjects=components
    ```
    prints `Tests:       50 passed, 50 total`;

    ```
    npx jest device/__tests__/qibla.test.ts shared/__tests__/qiblaSettle.test.ts --watchman=false --selectProjects=unit
    ```
    prints `Tests:       32 passed, 32 total`;

    `grep -n heldRef hooks/useQibla.ts` prints nothing;

    ```
    npx tsc --noEmit && npx biome check . --error-on-warnings
    ```
    both exit 0;

    ```
    bash $TMPDIR/breaks-48-2.sh
    ```
    ends `ALL AS EXPECTED: 1`;

    `yarn validate` passes with 100% on all four measures.
