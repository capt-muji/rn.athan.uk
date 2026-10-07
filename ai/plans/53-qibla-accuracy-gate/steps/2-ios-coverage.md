# Step 2: The iOS half is covered, and the stopwatch it replaced is deleted

2026-10-06. Specification the build satisfied, with the numbers it measured.

**The owner's rule, given while the step ran, binding every later step of this row:**
🐋  "Do not touch the compass logic. We're touching things around the compass outside of the compass, but the
compass logic itself absolutely not."

1. **Goal.** `uat-2` had been red since 1.29.248 by design: 21 tests in `Qibla.test.tsx` still described the
   stopwatch the certainty gate replaced, 2 in `unusedExports.test.ts` named it unreachable. This step makes the
   suite green at 100% with the gate tested from both sides, changing nothing the compass does. Anchor check:
   none — no compass line changed; part 5's comment-free comparison is the proof in its place.

2. **Files.** `shared/qiblaSettle.ts` (the stopwatch deleted: `hasSettled`, `trailingWindow`, `HeadingSample`, the
   three `SETTLE_` constants; kept symbols keep their code), comments only in `hooks/useQibla.ts` and
   `components/sheets/screens/Qibla.tsx`, the three suites rewritten for the certainty gate. The deletion was the
   owner's own decision ("Delete it (Recommended)", asked via the question tool); nothing in production had called
   it since 1.29.248 (`codegraph callers hasSettled` listed probes and the test file only).

3. **Tests.** Helpers `reportAccuracy`, `reportBareHeadings`, `reportHeadings` (= certain, then bare — a phone in
   daily use vouches first), `CERTAIN = { accuracyDegrees: 12.5, wantsCalibration: false }` (the owner's own
   untethered reading), and `CEILING_MS` as the literal `3000`. The gate's 18 tests: a bare heading draws nothing;
   certainty inside the bar draws on the next heading; the bar each side (0, 12.5, 15 draw; 15.1, 25.4 do not);
   negative refused; Android's cone opens it; a coneless sample is silence keeping the last certainty; the latest
   report decides; the ceiling draws at 3000ms and holds at 2999; a dropped reading restarts it; the gate latches;
   a genuine loss makes it wait the ceiling out again, then the compass returns; each visit starts its own ceiling;
   no certainty carries over a close; a refused reading fires no haptic. Plus the accuracy watch, the
   heading-before-position case, the readout's lines, and `isCertain`'s bar values. The stopwatch's own tests went
   with it. One clause no test can see and is not dead code: `accuracyDegrees !== undefined` in `isCertain` —
   `undefined >= 0` is already false at run time, but `tsc` refuses the comparison without it, so no break exists.

4. **Change.** **(specified):** no statement, expression, constant value or signature the compass runs may differ.
   Comments explain why only, compact.

5. **Green.** `yarn validate`: 187 suites, 5086 tests, 100% on all four measures. **The proof no logic changed** —
   each file against `uat-2`, comments stripped:

   ```
   hooks/useQibla.ts: CODE IDENTICAL
   components/sheets/screens/Qibla.tsx: CODE IDENTICAL
   shared/qiblaSettle.ts: CODE DIFFERS   (deletions only: the stopwatch. Any added or changed line = STOP)
   ```

6. **Breaks.** The step's break script: `CAUGHT: 23 of 23`, `ALL AS EXPECTED: 1`. It passed each search and
   replacement to `perl` through the environment, so a `/`, a `$` or a backtick in either is plain text — the
   earlier scripts' inline form could not carry template literals.

7. **Version, commit, merge.** 1.29.249 (`f6624843`, amended once from `f29e486f` on a review finding — the
   `openSheet` helper still described a removed timeout), through the hook, merged as `7f3a796e`; audited PASS in
   `AUDIT.md`. Review checklist items: the comparison prints part 5's three lines; no deleted symbol has a
   production caller (the five standing entries and nothing else); every new test fails against its break; no test
   asserts a style, snapshot or render count; no comment names a date, session, ruling or `ai/` file; nothing
   outside part 2's files changed; no visual changed.

**Done when:** `yarn validate` green, the break script ends `ALL AS EXPECTED: 1`, part 5's comparison still prints
the same three lines. It did.
