# Step 03: the Arabic chrome dies

The Settings toggle row, the explanation box's Arabic line, `toArabicNumbers`, the Arabic half
of the overlay content, and the `showArabicNamesAtom` itself go. The stored key
(`preference_show_arabic_names`) is deleted from disk in step 12's migration; this step removes
every code path that could read or write it.

Requirements: R1.1

- Branch: `feat/38-03-chrome`
- Anchors: `settings-toggle`, `explanation-arabic`, `toarabic`, `overlaycontent-arabic`, `shownames-atom`
- Files: `components/sheets/screens/Settings.tsx`, `components/prayer/Explanation.tsx`,
  `shared/text.ts`, `components/overlay/overlayContent.ts`, `stores/ui.ts`, and their suites:
  `components/sheets/screens/__tests__/Settings.test.tsx`,
  `components/prayer/__tests__/Explanation.test.tsx`, `shared/__tests__/text.test.ts`,
  `components/overlay/__tests__/overlayContent.test.ts`, `components/overlay/__tests__/Overlay.test.tsx`,
  `components/overlay/__tests__/overlayPlacement.test.tsx`, `stores/__tests__/ui.test.ts`

## Red

1. `Settings.test.tsx`: add `it('shows no arabic-names toggle')` - open Settings, assert
   `screen.queryByText('Show arabic names')` is null. Fails today (row exists, `settings-toggle`).
2. `Explanation.test.tsx`: add `it('explains in one language')` - render the explanation for a
   seeded extras row, assert the English explanation text appears exactly once and no Arabic
   explanation node exists (`queryByText(/[\u0600-\u06FF]/)` null). Fails today.
3. `text.test.ts`: delete the whole `toArabicNumbers` describe (the export dies; the suite
   keeps whatever else it holds, or the file goes with the export if it holds nothing else -
   it holds nothing else, so delete the file with the surface).
4. `ui.test.ts`: delete the `showArabicNamesAtom` default assertion with the atom.

## Change

1. Delete the `SettingsToggle` block anchored by `settings-toggle` and the `showArabicNames`
   `useAtom` wiring and import in `Settings.tsx`. The remaining toggle rows and both card
   layouts do not move by one point.
2. Delete the Arabic explanation line anchored by `explanation-arabic` (the
   `toArabicNumbers(explanationArabic)` Text) and its style entry in `Explanation.tsx`; delete
   the now-unused `explanationArabic` prop and its callers' passing of it, back to
   `overlayContent`.
3. Delete `toArabicNumbers` and `ENGLISH_TO_ARABIC` from `shared/text.ts`; if the file is then
   empty, delete it (its test file goes with it).
4. In `overlayContent.ts`, delete the Arabic fields anchored by `overlaycontent-arabic`
   (the Arabic half of the explanation pairing and every Arabic field on the overlay content
   objects). The `EXTRAS_EXPLANATIONS_ARABIC` and `PRAYERS_ARABIC` / `EXTRAS_ARABIC`
   constants in `shared/constants.ts` survive this step untouched; they die in step 04 with
   their last consumers.
5. Delete `showArabicNamesAtom` from `stores/ui.ts` (anchor `shownames-atom`).

## Green

All named suites green: Settings, Explanation, overlayContent, Overlay, overlayPlacement, ui.
tsc, Biome clean. `npx jest components/ shared/__tests__/text.test.ts --watchman=false --selectProjects=components,unit`
is not needed beyond the named suites plus their folder siblings.

## Break script

1. Re-add the toggle row ungated. Named test 1 fails. Restore.
2. Re-add the Arabic explanation Text with a hardcoded Arabic string. Named test 2 fails. Restore.
3. Re-add `showArabicNamesAtom` to `stores/ui.ts` alone (no consumer). tsc stays clean and
   every named test stays green - so this break targets the unused-export gate instead:
   `npx jest shared/__tests__/unusedExports.test.ts --watchman=false --selectProjects=unit`
   must fail (the atom is exported and unreachable). Restore. End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): the arabic chrome is removed: toggle, explanation line, digit helper, atom`

## Review checklist

Only the listed files change. The Settings sheet's remaining rows, spacing and icons are
byte-identical (visuals settled). Shipped classes: Residue (no dead prop, style, import or
export survives), Rule (no pixel beyond the ruled removals).

## Done when

`grep -r 'showArabicNames\|toArabicNumbers\|EXTRAS_EXPLANATIONS_ARABIC' components/ shared/ stores/ hooks/`
returns only step-04-owned `overlayContent` remains if any (target: zero in this step's files),
break `ALL AS EXPECTED: 1`, hook lines as step 01, merged `--no-ff`.

## Restore

`git checkout --` each changed file; delete `shared/text.ts` and `shared/__tests__/text.test.ts`
only after confirming they were deleted by this step's commit (uncommitted deletions: restore
the same way).
