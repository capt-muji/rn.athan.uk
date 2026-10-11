# Step 05b: the sheet layer survives the locale remount

**Requirements:** R3.1, R3.2, R3.3, R5.2
Weight: 2
**Anchors:** `layout-remount-key`.

## Goal

Step 03 keyed the whole gesture root, so `setActiveLocale` during the language commit
unmounts the presented language sheet mid-apply and the D51 progress face can never show
on device (found by the step 05 session, recorded in LOG.md). The key moves down: the
screen tree and the width measurement remount cold, and the sheet layer re-renders in
place through a subscribing host, so a presented sheet survives the switch and the sheets
behind it still pick up the new language.

## Branch

`feat/39-05b-sheet-host` off `uat`.

## Files

- `app/_layout.tsx`
- `components/sheets/SheetHost.tsx` (new), `components/sheets/index.ts`
- tests: `components/sheets/__tests__/SheetHost.test.tsx` (new)

## Red tests

1. `SheetHost.test.tsx`: `SheetHost` with `deferred={false}` renders null - fails on the absent component.
2. Same suite: with `deferred={true}` and the five sheet screen defaults mocked as mount-counting components, all five mount exactly once; then `act(() => getDefaultStore().set(localeVersionAtom, (v) => v + 1))` re-renders them (each mock's render count grows) while every mount count stays 1 - no sheet unmounts on a locale bump. Fails on the absent component.

## Change contracts

1. `components/sheets/SheetHost.tsx`: `export function SheetHost({ deferred }: { deferred: boolean })`. The body calls `useAtomValue(localeVersionAtom);` without binding (the subscription is the re-render trigger; binding an unused value fails Biome), returns `null` when `!deferred`, otherwise the five sheet components (`BottomSheetSound`, `BottomSheetSettings`, `BottomSheetLanguage`, `BottomSheetAlert`, `BottomSheetQibla`) in that order, imported from their screen modules exactly as `components/sheets/index.ts` lines 18-22 import them, never through the index (a cycle: the index re-exports SheetHost).
2. `components/sheets/index.ts`: gains `export { SheetHost } from './SheetHost';`; the five `BottomSheet*` re-exports stand unchanged.
3. `app/_layout.tsx`: the five `BottomSheet*` imports collapse to `import { SheetHost } from '@/components/sheets';`; the return block becomes `<GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.navigation.rootBackground }}>` (no key), `<SystemBars ... />` unchanged, `<InitialWidthMeasurement key={localeVersion} />`, `<BottomSheetModalProvider>` wrapping `<Slot key={localeVersion} />` and `<SheetHost deferred={chromeDeferred} />`. The locale comment rewrites to say why the key sits on the screen tree and the measurement, not the root: the sheet layer must survive a switch mid-apply (D51) and re-renders through SheetHost's subscription. The exact byte `<SheetHost deferred={chromeDeferred} />` is the step's break target.

## Green run

The new suite passes; the Language, Settings and `_layout`-adjacent suites stay green; `yarn validate` passes; `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

## Break script

Copy `app/_layout.tsx` to `$TMPDIR`; `sed -i '' "s/<SheetHost deferred={chromeDeferred} \/>/<SheetHost deferred={chromeDeferred} key={localeVersion} \/>/" app/_layout.tsx`; run `npx jest components/sheets/__tests__/SheetHost.test.tsx --watchman=false --selectProjects=unit`, expect the no-unmount test to fail with mount counts of 2; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - fix(language): sheet layer survives the locale remount, screens and measurement re-key`.

## Review checklist

- No visual delta: the five sheets mount exactly as before at the same defer point; SheetHost renders no UI of its own.
- The subscription is unbound; no new locale subscribers appear anywhere else (screens stay key-driven).
- The comment explains why the key moved, not what it does.

## Merge

`git checkout uat && git merge --no-ff feat/39-05b-sheet-host -m "Merge feat/39-05b-sheet-host into uat: job 39 step 05b"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 5b`.
