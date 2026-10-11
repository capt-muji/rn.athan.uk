# Step 05: the Settings row, the language sheet, the progress face

**Requirements:** R1.2, R3.1, R3.2, R3.3
Weight: 2
**Anchors:** `settings-display-card`, `sound-commit-dismiss`.

## Goal

The owner picks a language: a globe row at the top of the Display card (D52) opens a
sheet built like the sound sheet (D8); picking commits immediately, blocks the sheet
behind the in-sheet progress row (D51), and dismisses when the surfaces converge. The
six names render in their own scripts, sorted by codepoint (D26).

## Branch

`feat/39-05-sheet` off `uat`.

## Files

- `components/sheets/screens/Settings.tsx`, `components/sheets/screens/Language.tsx` (new), `components/sheets/screens/languageSheet.ts` (new), `components/sheets/index.ts`
- `shared/languageNames.ts` (new), `shared/types.ts` (`Icon.GLOBE`), `assets/icons/svg/index.ts` + the globe asset (new)
- `scripts/scan-strings.mjs` (`DATA_MODULES` gains `shared/languageNames.ts`), `shared/__tests__/stringGuard.test.ts` (the data-module rule list)
- `stores/language.ts` (the busy atom), `stores/ui.ts` (sheet modal plumbing follows the existing pattern)
- tests: `components/sheets/__tests__/Language.test.tsx` (new), the Settings suite extension, `stringGuard` suite

## Red tests

1. `Language.test.tsx`: the sheet renders six rows whose labels are exactly `['العربية', 'Bahasa Melayu', 'English', 'Soomaali', 'ไทย', 'हिन्दी']` (codepoint order) — fails on the absent component.
2. Same suite: tapping the العربية row calls `commitLanguagePreference` with `'ar'` and, while the commit promise is unsettled, the list rows are disabled and the picked row shows the ActivityIndicator plus `t('language.applying')` — fails on the absent component.
3. Same suite: resolving the commit dismisses the sheet; rejecting it also dismisses (forward-only: the UI already switched) — fails.
4. Settings suite extension: the Display card's first row is the Language row with the globe icon, label `t('settings.language')`, a chevron, and it opens the language sheet — fails.

## Change contracts

1. `shared/languageNames.ts`: `export const LANGUAGE_NAMES: ReadonlyArray<{ id: LocaleId; name: string }> = [...]` holding the six native names (`English`, `العربية`, `Bahasa Melayu`, `Soomaali`, `ไทย`, `हिन्दी`) sorted by codepoint. No other export. The module joins `DATA_MODULES` in the scanner (catalog-data rule: literals are data, not copy).
2. The globe icon: one new SVG in `assets/icons/svg/` drawn in the same stroke style and viewBox as the existing compass icon (read `assets/icons/svg` for the house style; a globe of meridian and parallel lines), `Icon.GLOBE = 'GLOBE'` in `shared/types.ts`, registered in the svg index. Size 9 at the row, `SHEET_ICON_COLOR` for the sheet header icon, exactly like the athan row's construction.
3. `components/sheets/screens/Language.tsx`: a `Sheet` with `title={t('settings.language')}`, `snapPoints={['60%']}`, `perfName="sheet_language"`, list rows in `LANGUAGE_NAMES` order. Each row: the native name, a check on the active locale, `Pressable` disabled while busy. On tap of the active locale: dismiss (no commit). On tap of another: set `languageCommitBusyAtom`, `await commitLanguagePreference(id)`, then dismiss on settle (both paths). The busy face: the picked row renders the app's `ActivityIndicator` (the splash gate's component, `SIZE.activityIndicator`, `COLORS.navigation.activityIndicator`) and `t('language.applying')`; every row's press is refused while busy. No cancel control exists (D18's no-cancel, kept by D47).
4. `components/sheets/screens/languageSheet.ts`: the modal ref holder and present function following `soundSheet.ts`'s shape; `stackBehavior` matches the sound sheet.
5. `components/sheets/screens/Settings.tsx`: the Display card gains the Language row as its FIRST row (before the Hijri toggle), built exactly like the athan row: globe icon in the round button, label, chevron, haptics on press, `hideSettingsSheet()` then present the language sheet.
6. `stores/language.ts`: `export const languageCommitBusyAtom = atom(false)`; the commit function sets it true at entry and false on settle (finally).

## Green run

New and extended suites pass; `yarn validate` passes (the scanner accepts the names module through the data rule).

## Break script

Copy `components/sheets/screens/Language.tsx` to `$TMPDIR`; `sed -i '' "s/disabled={busy}/disabled={false}/" components/sheets/screens/Language.tsx`; run the busy-state test, expect the "accepts input while busy" failure; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): settings row, language sheet with native names, in-sheet progress face`.

## Review checklist

- The row's construction matches the athan row line for line (icon, sizes, chevron, haptics); no other visual delta.
- Six rows, codepoint order, no English glosses.
- No cancel path; both settle paths dismiss.

## Merge

`git checkout uat && git merge --no-ff feat/39-05-sheet -m "Merge feat/39-05-sheet into uat: job 39 step 05"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 5`.
