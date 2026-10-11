# Step 10: residual literals to zero

**Requirements:** R1.3
Weight: 2
**Anchors:** `qibla-cardinals`, `scan-guard-suite`.

## Goal

The compass dial's cardinal letters resolve from the active catalog (they are copy: the
Arabic dial reads ش/ق/ج/غ), and the string census reports zero display rows outside the
catalog across the scanned trees.

## Branch

`feat/39-10-cardinals` off `uat`.

## Files

- `shared/qiblaCompass.ts`, `components/sheets/screens/QiblaCompass.tsx` (the CARDINALS consumer, `QiblaCompass.tsx:134`)
- tests: `shared/__tests__/qiblaCompass.test.ts` extension, the `stringGuard` suite

## Red tests

1. `qiblaCompass.test.ts` extension: a `resolveCardinals()` (new export) returns `[{ angle: 0, letter: t('qibla.cardinal.n') }, ...]` and under `ar` the letters are `['ش', 'ق', 'ج', 'غ']` - fails on the absent export.
2. The `stringGuard` census assertion, extended to flag the `CARDINALS` literals: temporarily name `shared/qiblaCompass.ts` in the scanner's classification expectation and watch it fail - record the failure, then make it pass by the change below (the census re-runs zero after).

## Change contracts

1. `shared/qiblaCompass.ts`: `export const resolveCardinals = (): DialCardinal[]` reading the four `qibla.cardinal.*` keys through `t()`; the static `CARDINALS` array with its literals is deleted. The tick geometry, the arc math and every sensor rule are untouched (D20).
2. The consumer renders `resolveCardinals()` at render time (call-time resolution, like step 03's captures).
3. Re-run the census: `node scripts/scan-strings.mjs ''` reports zero `data-module` rows and the guard suite stays green with the allowlist still `[]`.

## Green run

The extended suite passes; `yarn validate` passes.

## Break script

Copy `shared/qiblaCompass.ts` to `$TMPDIR`; `sed -i '' "s/t('qibla.cardinal.n')/'N'/" shared/qiblaCompass.ts`; run the ar cardinals test, expect `N` versus `ش` failure; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): compass cardinals resolve from the catalog, census at zero`.

## Review checklist

- No geometry, angle or sensor change (diff touches the letters only).
- The census output shows zero display rows.

## Merge

`git checkout uat && git merge --no-ff feat/39-10-cardinals -m "Merge feat/39-10-cardinals into uat: job 39 step 10"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 10`.
