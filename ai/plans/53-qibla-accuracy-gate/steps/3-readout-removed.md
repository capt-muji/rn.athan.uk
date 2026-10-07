# Step 3: The debug readout is removed

Planned and executed by the same session on 2026-10-07. This file is the specification the build satisfied, with
the numbers it measured.

**Why now.** The owner settled Android's direction on 2026-10-07 (step 4) and asked for the readout to go:
🐋  "let's remove the debugging logs. The debug readout that you have." It is removed FIRST and on its own, so the
one change that reaches the iPhone's files is a commit that can be judged, and reverted, apart from step 4.

0. **Anchor check.** The gate's three lines, which this step rewrites as one. From the repository root:

   ```bash
   grep -c "else if (isCertain(accuracyRef.current)) openedBy = 'certainty';" hooks/useQibla.ts
   ```

   Prints `1` before the step and `0` after it.

1. **Goal.** Nothing in the app draws, stores or gates on the readout: the flag, its environment variable, the
   block on the sheet, the two state fields that fed it and the suite that tested it are gone. **What the compass
   does is unchanged on both platforms.**

2. **Branch.**
   ```bash
   git checkout -b refactor/qibla-readout-removed uat-2
   ```

3. **Files.** Exactly these, apart from `app.json`, `package.json`, `ai/plans/README.md` and this plan folder:

   | File | What changes |
   | --- | --- |
   | `components/sheets/screens/Qibla.tsx` | The readout block, `PENDING`, `oneDecimal` and three imports are deleted. The hook's result is read without `diagnostic` and `openedBy` |
   | `hooks/useQibla.ts` | `diagnostic` and `openedBy` leave `QiblaState`. `GateOpening` is deleted. The accuracy watch no longer stores its reading in state. The gate's three lines become one |
   | `shared/flags.ts` | `qiblaDiagnostic` is deleted |
   | `.env.example` | `EXPO_PUBLIC_QIBLA_DIAGNOSTIC` and its comment are deleted |
   | `components/sheets/screens/__tests__/QiblaDiagnostic.test.tsx` | Deleted, with the readout it tested |
   | `components/sheets/screens/__tests__/Qibla.test.tsx` | The one test that asserted the readout was absent is deleted, and one comment that named the deleted suite |
   | `shared/__tests__/flags.test.ts` | The `qiblaDiagnostic` describe is deleted |
   | `shared/__tests__/whatsNew.test.ts` | Four flag fixtures lose the deleted flag |

4. **Tests.** None is added, because nothing is added. The gate's existing tests in
   `describe('the gate the compass waits behind')` are what prove part 5's rewrite: both sides of the bar, the
   ceiling at 2999ms and at 3000ms, the warm reopen, the latch and the loss. They are not edited.

5. **Change.** This step is **(specified)**.

   **The gate.** `openedBy` existed to name the path for the readout. With no reader it is dead, so the three
   lines that assigned it become the condition they encoded:

   ```ts
   if (!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs < CERTAINTY_CEILING_MS) return;
   ```

   The compass draws when the reopen is warm, or the phone is certain, or the ceiling has passed. That is the
   same truth table as before, and `arrivedWarm` still reaches state for the arrival haptic.

   **The accuracy watch.** It keeps writing `accuracyRef`, which the gate reads. It no longer calls `setState`
   with the reading, because nothing renders it. On the iPhone that removes one render per accuracy sample and
   changes nothing the gate decides, since the gate reads the ref.

   **Nothing else moves.** No constant, no threshold, no timer, no haptic and no style changes.

6. **Green.**
   ```bash
   yarn validate
   ```
   Measured: recorded in `LOG.md`, step 3.

7. **Breaks.** `bash ai/plans/53-qibla-accuracy-gate/scripts/breaks-2.sh`, from the repository root. It aims at the
   rewritten gate line: each of its three terms removed, the ceiling one millisecond early, and the latch. Its
   last line must read `ALL AS EXPECTED: 1`.

8. **Version and commit.** As step 2, part 8. The commit goes through the hook.

9. **Review.** Read the diff back cold against this list:

   - [ ] `grep -rn "qiblaDiagnostic\|QIBLA_DIAGNOSTIC\|openedBy\|GateOpening\|qibla-diagnostic"` over the app's
         code, outside `ai/plans/`, prints nothing.
   - [ ] No test of the gate was edited: `git diff uat-2 -- components/sheets/screens/__tests__/Qibla.test.tsx`
         shows only the readout assertion and its comment removed.
   - [ ] `python3 scripts/find-unused-exports.py` reports its five standing entries and nothing else.
   - [ ] Nothing outside part 3's files changed. No visual changed.

10. **Merge.**
    ```bash
    git checkout uat-2 && git merge --no-ff refactor/qibla-readout-removed \
      -m "Merge refactor/qibla-readout-removed into uat-2: session 53 step 3, the debug readout removed"
    ```

11. **Done when:** `yarn validate` passes and the break script ends `ALL AS EXPECTED: 1`.
