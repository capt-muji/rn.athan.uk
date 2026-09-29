# Execution log: Session 37

## Step 5: the dial

**Branch:** `step/37-5-dial` off `feat/37-qibla-compass`. **Version:** 1.29.107.

The compass face ships: 72 ticks at 5 degrees in three Garmin weights, 12 labels at 30 with the cardinals named
and the rest abbreviated to two digits, a needle to the Kaaba and a Kaaba marker on the rim, turning as ONE
recorded layer under a fixed mark at the top.

**The architecture the plan required, built as specified.** `Face` is memoised on its size and bearing alone, both
of which hold still while the needle moves, so react-native-svg records the tree once and the rotation is a
Reanimated transform on the layer above it. No `useAnimatedProps`, no per-frame JS, no attribute animation. The
derived value snaps on its first evaluation, so the face draws at the phone's real heading rather than spinning to
it from north on every open.

`components/qibla/dialGeometry.ts` is pure and carries the whole face: the unit project measures it with no
renderer, which is what let the bearing-to-point mapping, the tick hierarchy and the label abbreviation each get a
test that can fail.

**Two edits found in my own review and applied under section 4, item 8** (own code, no contract touched): the
tick's "is it labelled" test was computed twice from the same rule and is now computed once and passed down; and
`MAJOR_STEP` was doing two unrelated jobs, the 10-degree tick and the label's divide-by-ten, which are only equal
by coincidence. The break script's substitutions were re-pointed at the new text and re-run.

**Also fixed:** the branch tip failed `biome check` on two files from steps 2 to 4
(`components/sheets/screens/__tests__/Settings.test.tsx`, `device/__tests__/qibla.test.ts`), both import ordering.
The pre-commit hook runs `yarn validate`, so no commit was possible until they were formatted.

| Check | Result |
| --- | --- |
| Break script | **23 of 23 caught**, `ALL AS EXPECTED: 1` (step 2's 15, plus 8 for the dial) |
| `tsc --noEmit` | clean |
| `biome check . --error-on-warnings` | clean |
| Coverage, new files | `Dial.tsx` and `dialGeometry.ts` both 100% on all four measures |
