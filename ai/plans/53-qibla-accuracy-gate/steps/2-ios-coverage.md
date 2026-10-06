# Step 2: The iOS half is covered, and the stopwatch it replaced is deleted

Planned and executed by the same session on 2026-10-06, as prototype P1 was. This file is the specification the
build satisfied, with the numbers it measured.

0. **Anchor check.** None. The step changes no compass logic, so there is no line to anchor a change on. The
   proof in part 6 replaces it: it fails if any code line of the hook or the sheet differs from `uat-2`.

1. **Goal.** `uat-2` has been red since 1.29.248, by design: 21 tests in `Qibla.test.tsx` still describe the
   stopwatch the certainty gate replaced, and 2 in `unusedExports.test.ts` name the stopwatch as code nothing
   reaches. This step makes the suite green at 100% with the gate tested from both sides, and changes nothing the
   compass does.

   **The owner's rule for this step, given while it ran, and it binds every later step of this row:**
   🐋  "Do not touch the compass logic. We're touching things around the compass outside of the compass, but the
   compass logic itself absolutely not."

2. **Branch.**
   ```bash
   git checkout -b test/qibla-certainty-gate-coverage uat-2
   ```

3. **Files.** Exactly these, apart from `app.json`, `package.json`, `ai/plans/README.md` and this plan folder:

   | File | What changes |
   | --- | --- |
   | `shared/qiblaSettle.ts` | `hasSettled`, `trailingWindow`, `HeadingSample`, `SETTLE_WINDOW_MS`, `SETTLE_MIN_READINGS` and `SETTLE_DRIFT_DEGREES` are deleted. Comments compacted. Every kept symbol keeps its code |
   | `hooks/useQibla.ts` | Comments only |
   | `components/sheets/screens/Qibla.tsx` | Comments only |
   | `components/sheets/screens/__tests__/Qibla.test.tsx` | The helpers and the gate's tests are rewritten for the certainty gate |
   | `components/sheets/screens/__tests__/QiblaDiagnostic.test.tsx` | Six tests for the readout's two new lines |
   | `shared/__tests__/qiblaSettle.test.ts` | The stopwatch's tests go with it. `isCertain` and the ceiling gain theirs |

   **The deletion was the owner's decision**, asked with the question tool on 2026-10-06 after he queried it:
   "Delete it (Recommended)". Nothing in production has called the stopwatch since 1.29.248, measured with
   `codegraph callers hasSettled`, which lists plan probes and the test file only.

4. **Tests.**

   **Helpers in `Qibla.test.tsx`.** The suite mocks `@/modules/qiblaheading` with a factory that keeps each
   accuracy callback, so a test reports the phone's certainty by hand:

   | Helper | What it does | Why it is shaped that way |
   | --- | --- | --- |
   | `reportAccuracy(reading)` | Delivers one accuracy reading to the live watch | The gate decides on it, so no test may leave it to chance |
   | `reportBareHeadings(...headings)` | Delivers headings with no certainty behind them, moving no clock | Neither path through the gate is helped, so the test shows what the gate itself decides |
   | `reportHeadings(...headings)` | `reportAccuracy(CERTAIN)`, then the bare headings | A phone in daily use vouches for its heading first. Every test about the dial uses this |
   | `CERTAIN` | `{ accuracyDegrees: 12.5, wantsCalibration: false }` | The owner's own untethered reading |
   | `CEILING_MS` | The literal `3000` | A test spending the constant it guards moves with it (`ai/AGENTS.md`, 2026-10-03) |

   **The gate, in `describe('the gate the compass waits behind')`.** Each row is one test:

   | What it proves | Inputs | Asserts |
   | --- | --- | --- |
   | A heading the phone has not vouched for draws nothing | one bare heading | no dial |
   | A certainty inside the bar draws on the next heading | `CERTAIN`, one bare heading | dial |
   | The bar, each side of it | accuracy 0, 12.5, 15, 15.1, 25.4 | dial for the first three only |
   | A negative accuracy is refused | accuracy -1 | no dial |
   | Android's cone opens the gate | `fusedErrorDegrees: 9` | dial |
   | A sample with no cone keeps the last certainty | cone 9, then a coneless sample | dial |
   | A sample with no cone is silence | a coneless sample only | no dial |
   | The latest report decides | 12.5, then 40 | no dial |
   | The ceiling draws an unvouched stream | bare heading, 3000ms, bare heading | dial |
   | The ceiling holds one millisecond short | bare heading, 2999ms, bare heading | no dial |
   | The ceiling draws a phone outside the bar | accuracy 25.4, 3000ms | dial |
   | A dropped reading restarts the ceiling | bare, 2000ms, a lost reading, bare, 1500ms, bare | no dial |
   | The gate latches | drawn, then accuracy 40, then heading 140 | the dial turns to -140 |
   | A genuine loss makes the stream wait out the ceiling again | drawn on the ceiling, lost for 2000ms, one bare heading | no dial |
   | The compass returns after a genuine loss | drawn, lost for 2000ms, `reportHeadings(140)` | dial |
   | Each visit starts its own ceiling | bare, 3000ms, close, reopen, bare | no dial |
   | A certainty never carries over a close | drawn, close, reopen, one bare heading at 200 | no dial |
   | A refused reading fires no haptic | one bare heading on the line | `impactAsync` not called |

   **The accuracy watch, in `describe('the accuracy watch the gate decides on')`:** it arms once with the readout
   off, draws no readout, stops when the sheet closes, and does not arm when location is refused.

   **The position, in `describe('a heading that arrives before the position')`:** the ceiling starts at the first
   reading, so a reading taken once the fix lands, 3000ms after one taken before it, draws.

   **The readout, in `QiblaDiagnostic.test.tsx`:** `drew on -` and `bar 15 / ceiling 3000ms` before anything is
   drawn; `drew on certainty`, `drew on ceiling` and `drew on warm` for the three paths; warm outranks certainty
   when both hold on the confirming reading; and a close returns it to `drew on -`.

   **In `qiblaSettle.test.ts`:** `isCertain` for an absent report, a negative one, and the five values each side
   of the bar; and the ceiling is no shorter than 2700ms.

   **Tests deleted, with the code they tested:** the `trailingWindow` and `hasSettled` describes in
   `qiblaSettle.test.ts`, and the window tests of the old `describe('the settling gate')`, whose behaviour no
   longer exists.

   **One clause no test can see, and it is not dead code:** `accuracyDegrees !== undefined` in `isCertain`.
   Removing it changes nothing at run time, because `undefined >= 0` is already false, but `tsc` refuses the
   comparison without it. It has no break for that reason.

5. **Change.** This step is **(specified)**, and what it specifies is an absence: no statement, expression,
   constant value or signature the compass runs may differ. Comments explain why only, and are compact
   (`ai/AGENTS.md` section 15): the history in the hook's latch comment and the provenance in the threshold's
   comment are removed for that reason.

6. **Green.**
   ```bash
   yarn validate
   ```
   Measured: `Test Suites: 187 passed, 187 total`, `Tests: 5086 passed, 5086 total`, and `100%` on Statements,
   Branches, Functions and Lines.

   **The proof that no logic changed.** A comparison of each file against `uat-2` with every comment removed:

   ```
   hooks/useQibla.ts: CODE IDENTICAL
   components/sheets/screens/Qibla.tsx: CODE IDENTICAL
   shared/qiblaSettle.ts: CODE DIFFERS
   ```

   and for `shared/qiblaSettle.ts` the difference is deletions only: the three `SETTLE_` constants, the
   `HeadingSample` interface, `trailingWindow` and `hasSettled`. Any added or changed line there is a STOP.

7. **Breaks.** `bash ai/plans/53-qibla-accuracy-gate/scripts/breaks-1.sh`, from the repository root, after the
   formatter has run. Measured: `CAUGHT: 23 of 23`, then `ALL AS EXPECTED: 1`.

   The script passes each search and replacement to `perl` through the environment, so a `/`, a `$` or a backtick
   in either is plain text. Two of its breaks target template literals in `Qibla.tsx`, which the earlier scripts'
   inline form could not carry.

8. **Version and commit.**
   ```bash
   git fetch -q origin uat-2
   node -e 'const v=require("./package.json").version.split(".").map(Number);v[2]+=1;console.log(v.join("."))'
   ```
   Set it in `app.json`, `package.json` and `android/app/build.gradle` (`versionName`). The commit goes through
   the hook. `--no-verify` was granted once, for 1.29.247 and 1.29.248, and is banned again.

9. **Review.** Read the diff back cold against this list:

   - [ ] The comment-free comparison in part 6 prints exactly what part 6 records.
   - [ ] No deleted symbol has a production caller: `python3 scripts/find-unused-exports.py` reports its five
         standing entries and nothing else.
   - [ ] Every new test would fail against the break that targets it: the break script's last line.
   - [ ] No test asserts a style value, a snapshot or a render count.
   - [ ] No comment names a date, a session, an owner ruling or a file under `ai/`.
   - [ ] Nothing outside part 3's files changed. No visual changed.

10. **Merge.**
    ```bash
    git checkout uat-2 && git merge --no-ff test/qibla-certainty-gate-coverage \
      -m "Merge test/qibla-certainty-gate-coverage into uat-2: session 53 step 2, the iOS half covered with no compass logic changed"
    ```

11. **Done when:** `yarn validate` passes, the break script ends `ALL AS EXPECTED: 1`, and part 6's comparison
    still prints the same three lines.
