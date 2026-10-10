# Step 02: the row's Arabic column dies

The prayer row renders one name. The second column, its style and the row's
`showArabicNames` read go. The atom itself dies in step 03 with its Settings writer.

Requirements: R1.1

- Branch: `feat/38-02-row`
- Anchors: `row-conditional`, `row-styles`, `shownames-atom`
- Files: `components/prayer/Prayer.tsx`, `components/prayer/__tests__/Prayer.test.tsx`,
  `components/prayer/__tests__/Prayer.test.ts`

## Red

In `Prayer.test.tsx` add: `it('renders exactly one name text on the row')` - render a Standard
row for a seeded London day, assert `screen.getByText('Fajr')` exists and
`screen.queryByText('الفجر')` is null (the atom defaults true today, so the Arabic Text renders
and this fails). Follow `__tests__/README.md`: fresh install per test, `showLondonDay`,
`await render`, `await fireEvent`.

In the same suite, the existing Arabic-name tests (`getByText('الشروق')` block, the toggle
block) are the surface being removed: delete those assertions and their helper setup, keep the
suite. In `Prayer.test.ts`, drop the `showArabicNamesAtom` mock entry with the ui mock block.

Run: `npx jest components/prayer/__tests__/Prayer.test.tsx --watchman=false --selectProjects=components`.
Named test fails with "Unable to find element with text: الفجر" inverted (queryByText null
fails today because the element exists).

## Change

1. Delete the conditional Arabic block anchored by `row-conditional` (`{showArabicNames && (...)}`).
2. Delete the `styles.arabic` entry anchored by `row-styles`.
3. Delete the `showArabicNames` read (the `useAtomValue`/destructure on `showArabicNamesAtom`)
   and its import in `Prayer.tsx`.
4. Nothing else. `Time`, `Alert`, paddings, heights untouched. The name keeps
   `styles.english` with its left padding exactly as-is.

## Green

The named test passes. `npx jest components/prayer/__tests__/ --watchman=false --selectProjects=components`
(all Prayer suites) green. tsc, Biome clean.

## Break script

1. Re-add the Arabic Text to the row, ungated (always rendered). The named test must fail on
   `queryByText('الفجر')` finding the element. Restore.
2. Change the name Text to render `{Prayer.english.toUpperCase()}`. The named test must fail
   (`getByText('Fajr')` finds nothing). Restore. End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): the prayer row renders one name, the Arabic column is removed`

## Review checklist

The diff touches only the three files. No style value other than the deleted `arabic` entry
changes (visuals settled; the ruled removal is the whole visible delta). Shipped classes:
Residue (no leftover import or variable), Rule (no substituted name).

## Done when

Row renders one name in the reference suite, `Prayer.tsx` holds no `arabic` identifier, break
`ALL AS EXPECTED: 1`, hook lines as step 01, merged `--no-ff`.

## Restore

`git checkout -- components/prayer/Prayer.tsx components/prayer/__tests__/Prayer.test.tsx components/prayer/__tests__/Prayer.test.ts`
