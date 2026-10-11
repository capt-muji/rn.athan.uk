# Step 03: the six point fixes

**Requirements:** R1.1, R4.1, R5.1
Weight: 2
**Anchors:** `sounditem-local-format`, `widget-alabel`, `stepper-raw-value`.

## Goal

The digit edges that do not flow through the shared formatters or the bridge render
native digits in ar: SoundItem's local `m:ss`, the widget's inline `ALabel`, the
legacy footer's rendered digits, the stepper's raw visible value, and the v1 snapshot
fallback literals. The iOS native `Text(timerInterval:)` countdowns stay untouched
(D58).

## Branch

`feat/57-03-point-fixes` off `uat`.

## Files

- `components/sheets/parts/SoundItem.tsx`, `components/sheets/parts/Stepper.tsx`
- `widgets/PrayerWidget.tsx`
- tests: `components/sheets/parts/__tests__/SoundItem.test.tsx`, `components/sheets/screens/__tests__/Alert.test.tsx` (the screens one renders Stepper), `shared/__tests__/widgetRenderer.test.ts` extensions

## Red tests

1. SoundItem suite extension: the preview time renders `'٠:٠٣'` under ar - fails today.
2. Alert suite extension (stepper): the visible interval renders `'١٥'`-shaped digits under ar - fails today.
3. Widget renderer suite extension: `ALabel` under the ar widget strings renders
   `'١٩د'`-shaped output per the ar labels - fails today.

## Change contracts

1. `SoundItem.tsx`: the local `formatTime` (line 18) passes its composed `m:ss`
   through `localiseDigits` before returning, in the exact line
   `const localised = localiseDigits(composed);` (the composed string held in a const
   first, per the house rule), so the break script's bytes are pinned.
2. `Stepper.tsx`: the visible value at line 71 renders through
   `const visible = localiseDigits(String(value));` rendered as `{visible}` (no nested
   call in JSX); the a11y labels already localise through the bridge (step 02).
3. `widgets/PrayerWidget.tsx`, per D61 (the closure walk fails any module-scope
   reference, so no import): an inline ten-glyph digit map defined INSIDE
   `AthanHomeWidget`, read through the existing `__expoWidgetDeviceLocale` resolver at
   lines 312-316 (ar maps, every other locale identity). The inline `ALabel` minutes
   formatter (line 383) composes through it; the legacy footer fallback (line 654)
   parses Latin from pre-v7 entries unchanged and renders its digits through it.
4. The iOS `Text(timerInterval:)` sites (line 729; LockPrayerWidget 263, 747) are
   untouched - D58. The v1 snapshot fallback literals stay as they are (v1 entries
   are English-only and the identity map covers them by shape; dropped from the
   change list).

## Green run

Extended suites pass; `yarn validate` passes; tsc and biome exit 0.

## Break script

Copy `components/sheets/parts/SoundItem.tsx` to `$TMPDIR`; `sed -i '' "s/const localised = localiseDigits(/const localised = (/" components/sheets/parts/SoundItem.tsx`; run `npx jest components/sheets/parts/__tests__/SoundItem.test.tsx --watchman=false --selectProjects=components`, expect the ar preview test to fail with `'0:03'` shown; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(i18n): the six non-shared digit edges render native digits, iOS native timers kept`.

## Review checklist

- The widget runtime still loads (the static import adds no closure capture).
- No pixel changes beyond the digit glyphs.
- D58 sites untouched in the diff.

## Merge

`git checkout uat && git merge --no-ff feat/57-03-point-fixes -m "Merge feat/57-03-point-fixes into uat: job 57 step 03"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 3`.
