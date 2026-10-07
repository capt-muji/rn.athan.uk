# Step 3: The debug readout is removed

2026-10-07. Specification the build satisfied, with the numbers it measured.

**Why now.** The owner settled Android's direction (step 4) and asked for the readout to go:
🐋  "let's remove the debugging logs. The debug readout that you have." Removed FIRST and on its own, so the one
change reaching the iPhone's files is a commit that can be judged, and reverted, apart from step 4.

1. **Goal.** Nothing in the app draws, stores or gates on the readout: the flag `qiblaDiagnostic`, its environment
   variable, the block on the sheet, `diagnostic` and `openedBy` in the hook's state, `GateOpening`, the suite that
   tested it and the flag's own tests are gone (132 lines removed, 10 added). **What the compass does is unchanged
   on both platforms.** Files: `Qibla.tsx`, `hooks/useQibla.ts`, `shared/flags.ts`, `.env.example`,
   `QiblaDiagnostic.test.tsx` (deleted), `Qibla.test.tsx`, `flags.test.ts`, `whatsNew.test.ts`.

2. **The change (specified).** `openedBy` existed only to name the path for the readout; with no reader it is dead,
   so the gate's three lines became the condition they encoded:

   ```ts
   if (!arrivedWarm && !isCertain(accuracyRef.current) && waitedMs < CERTAINTY_CEILING_MS) return;
   ```

   The compass draws when the reopen is warm, or the phone is certain, or the ceiling has passed — the same truth
   table, and `arrivedWarm` still reaches state for the arrival haptic. The accuracy watch keeps writing
   `accuracyRef`, which the gate reads, and stops `setState`-ing the reading (on the iPhone that removes one render
   per sample and changes nothing the gate decides). No constant, threshold, timer, haptic or style moved. No test
   of the gate was edited to make that pass.

3. **One line the breaks found dead, deleted.** The break script's first run printed `SURVIVED: a close leaves the
   last visit warm`: `stop()` reset `arrivedWarm` to false and nothing can see it — the only write that makes the
   compass visible sets `hasHeading` and `arrivedWarm` together, so a leftover value is always overwritten before
   the haptic effect reads it. An unbreakable line is dead code, not an untested one; it is deleted and the break
   aims at the `hasHeading` reset beside it.

4. **Green.** `yarn validate`: 186 suites, 5062 tests, 100% on all four measures (down from 5086 by exactly what
   was deleted: 13 readout-suite, 10 flag, 1 readout-absent). Breaks: `CAUGHT: 10 of 10`, `ALL AS EXPECTED: 1`.

5. **Commit and review.** `1bf2d8fc`, 1.29.252, through the hook. One independent reviewer, read-only: **pass with
   findings, no blocker** — it built the gate's truth table (eight rows, old and new identical, including what
   `arrivedWarm` is written as) and proved by induction over every state update that the deleted reset cannot be
   observed. Findings: two missing warm/certain tests and the unpinned dead-reset invariant (test and break in step
   4's commit); the one-render-less-per-sample recorded for the owner; the stray `export` on
   `CERTAINTY_THRESHOLD_DEGREES` dropped in step 4's commit; two false comments corrected there; the two
   older-than-this-session leaks recorded for the owner (step 4, part 12). Grep checklist: no
   `qiblaDiagnostic|QIBLA_DIAGNOSTIC|openedBy|GateOpening|qibla-diagnostic` anywhere in app code outside `ai/plans/`.

**Done when:** `yarn validate` passes and the break script ends `ALL AS EXPECTED: 1`. It did.
