# Step 11: the width cache goes per-locale

`prayer_max_english_width_standard/extra` become `prayer_max_english_width_en_standard` and
`prayer_max_english_width_en_extra`, seeded at module evaluation from the legacy keys, which
are then removed. Widen-only semantics stay per key. The keep-prefix
`prayer_max_english_width_` already covers both shapes in both wipes, unchanged.

Requirements: R7.1

- Branch: `feat/38-11-width`
- Anchors: `width-atoms`, `setwidth`, `setwidth-grow`, `version-keeplist`, `sync-keeplist`
- Files: `stores/ui.ts`, `components/ui/InitialWidthMeasurement.tsx`,
  `components/day/__tests__/shownDate.test.ts` (mock identity changes, R14's noted
  indirect), `stores/__tests__/ui.test.ts`, `components/ui/__tests__/InitialWidthMeasurement.test.tsx`,
  `stores/__tests__/sync.test.ts`, `syncFetchBeforeWipe.test.ts`, `version.test.ts` (their
  keep-list pins gain the locale-shaped strings)

## Contracts

1. `stores/ui.ts`, module scope ABOVE the atom definitions (R18 phase 0 step 2; the only
   ordering hazard in the stage): for each of `standard`/`extra`, if
   `prayer_max_english_width_en_<side>` is absent on disk and the legacy
   `prayer_max_english_width_<side>` is present, copy the value (raw MMKV string-to-string),
   then remove the legacy key unconditionally (idempotent; D35's clean-database rule).
2. The atoms: `englishWidthStandardAtom = atomWithStorageNumber('prayer_max_english_width_en_standard', 0)`
   and the extra twin. The atom factory takes the locale segment `'en'` as a constant from
   `shared/i18n` (`CURRENT_LOCALE_ID = 'en'` stage one; row 39 makes it dynamic).
3. `setEnglishWidth(type, width)` keeps per-key widen-only exactly (anchors `setwidth`,
   `setwidth-grow`).
4. `InitialWidthMeasurement` measures the catalog's labels (`prayerLabel(id)`) - already true
   after step 06; its suite's assertions re-key to the locale keys.

## Red

1. `stores/__tests__/ui.test.ts`: `it('seeds the en width keys from the legacy keys and removes the legacy keys at module evaluation')` -
   seed legacy MMKV values, `jest.isolateModules`-load `stores/ui`, assert the `en` atoms read
   the seeded numbers and the legacy keys are gone. Fails today (atoms read legacy keys).
2. Same suite: `it('keeps widen-only per key and never leaks across keys')` - a smaller
   measurement never narrows; a zero measurement never writes. Partially covered today;
   re-keyed, the fresh assertions fail before the change.

## Break script

1. Move the seed BELOW the atom definitions. Named test 1 fails (the atoms' module-eval
   snapshot reads 0). Restore.
2. Make `setEnglishWidth` overwrite unconditionally. Named test 2 fails. Restore.
3. Stop removing the legacy key. Named test 1's removal assertion fails. Restore.
End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): per-locale width keys with a module-eval seed, legacy keys removed`

## Review checklist

The seed runs before any atom over the new keys exists (ordering is the design). No wipe
keep-list entry changes (D35; the prefix already covers). Shipped classes: Residue (no legacy
key read anywhere after the seed), Lifecycle (module-eval work is idempotent).

## Done when

Both red tests green, keep-list pins updated and green, break `ALL AS EXPECTED: 1`, hook lines
as step 01, merged `--no-ff`.

## Restore

`git checkout -- stores/ui.ts components/ui/InitialWidthMeasurement.tsx` and the suites.
