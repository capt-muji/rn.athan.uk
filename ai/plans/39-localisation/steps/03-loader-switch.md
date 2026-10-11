# Step 03: the loader switches, the captures dissolve

**Requirements:** R1.3, R3.1, R5.1, R5.2
Weight: 2
**Anchors:** `loader-body`, `i18n-locale-const`, `ui-width-atoms`, `ui-legacy-seed`, `alert-options-capture`, `alert-unavailable-capture`, `reminder-sound-capture`, `help-action-capture`, `whatsnew-visible-capture`, `width-measure-pick`.

## Goal

The active catalog follows the runtime locale, the whole tree re-renders on a switch, the
four module-scope `t()` captures resolve at call time, and the width machinery reads the
active locale's labels and keys. An English device renders byte-identically.

## Branch

`feat/39-03-loader` off `uat`.

## Files

- `shared/i18n/loader.ts`, `shared/i18n/locale.ts`, `shared/i18n/index.ts`
- `stores/ui.ts`, `components/ui/InitialWidthMeasurement.tsx`, `hooks/usePrayer.ts`
- `components/sheets/screens/Alert.tsx`, `components/sheets/screens/ReminderCard.tsx`, `shared/help.ts`, `shared/whatsNew.ts`
- `app/index.tsx`, `stores/bootstrap.ts` (or `_layout.tsx` if the resolution call belongs there)
- tests: `shared/__tests__/i18nRuntime.test.ts` (new), the touched suites (`Alert`, `ReminderCard`, `whatsNew`, `Settings`, `InitialWidthMeasurement`, `app/index`)

## Red tests

1. `i18nRuntime.test.ts`: `setActiveLocale('ar'); expect(t('prayer.fajr')).toBe('الفجر')` fails (loader still returns en). Second case: `prayerLabel('last third')` under th returns `'ช่วงสุดท้ายของคืน'`.
2. A render test in the Alert suite: with `setActiveLocale('ar')` before render, the option row labels read `إيقاف`/`صامت`/`صوت` — fails today because `ALERT_OPTIONS` captured English at module scope.
3. `whatsNew` suite: with `setActiveLocale('ms')`, `getVisibleWhatsNew()` (new API) resolves the ms catalog — fails on the absent function.
4. `InitialWidthMeasurement` suite: under th, the measured row is the widest Thai label's row — fails today (English index).

Record the first failing lines.

## Change contracts

1. `shared/i18n/locale.ts` gains: a private `let active: LocaleId | null = null`; `export const currentLocaleId = (): LocaleId` — resolves once on first call via `resolveInitialLocale(readStoredLanguagePreference(), getLocales())` (import `getLocales` from `expo-localization`; the call is lazy, never at module evaluation) and memoizes; `export const setActiveLocale = (id: LocaleId): void` — sets `active` and bumps `localeVersionAtom`; `export const localeVersionAtom = atom(0)` (in-memory jotai atom; no storage).
2. `shared/i18n/loader.ts` body becomes: the six requires in a `const MODULES = { en: require('./en'), ar: require('./ar'), ms: require('./ms'), so: require('./so'), hi: require('./hi'), th: require('./th') } as const;` map (perf marks unchanged around the requires), `currentCatalog()` returns `MODULES[currentLocaleId()].en` — careful: each locale module's catalog export keeps its own name; the map entries are normalised to a `{ en: Catalog; PRAYER_LABELS: Record<PrayerId, string> }` view via a tiny per-module adapter object, so `currentCatalog()` and `currentPrayerLabels()` stay one-line calls and no call site moves.
3. `shared/i18n/index.ts`: `CURRENT_LOCALE_ID` is deleted; every import of it (`stores/ui.ts`) switches to `currentLocaleId()`. `t()` and `prayerLabel` signatures are unchanged.
4. `stores/ui.ts`: the two width atoms become a family — `const widthAtoms = new Map<string, PrimitiveAtom<number>>(); export const englishWidthAtomFor = (type: ScheduleType): PrimitiveAtom<number>` keyed `` `prayer_max_english_width_${currentLocaleId()}_${side}` ``, creating `atomWithStorageNumber(key, 0)` on first access per key and caching. The module-eval legacy seed stays en-only and runs exactly as today (the `ui-legacy-seed` anchor region). `setEnglishWidth` and `getEnglishWidth` read/write through the family. `hooks/usePrayer.ts` reads `englishWidthAtomFor(type)` inside `useAtomValue` so the remount re-subscribes under the new key.
5. The four captures become call-time: `ALERT_OPTIONS` → `const alertOptions = (): SegmentOption[] => [...]` used in render; `UNAVAILABLE_MESSAGE` → `const unavailableMessage = () => t('alert.unavailable')`; `SOUND_OPTIONS` in ReminderCard likewise; `HELP_ACTION_LABELS` → `getHelpActionLabels()`; `VISIBLE_WHATS_NEW` → `getVisibleWhatsNew()` with its two consumers (`app/index.tsx` lines reading it) calling the function. No value or shape changes beyond the call-time resolution.
6. `components/ui/InitialWidthMeasurement.tsx`: the picked index comes from the active catalog — `getLongestPrayerNameIndex`'s comparator reads `currentPrayerLabels()` lengths (`[...str].length` for surrogate pairs) instead of the English constants; the function keeps its name and signature.
7. `app/index.tsx`: the root content container carries `key={useAtomValue(localeVersionAtom)}` so a locale bump remounts the screen tree (sheets included; overlay state lives in atoms and rehydrates). The remount is the re-render mechanism of R3.1; no per-component subscriptions are added anywhere.
8. First resolution timing: nothing calls `currentLocaleId()` before `stores/bootstrap` has hydrated (it already runs before first render in `app/_layout.tsx`); the lazy memo means the first `t()` resolves the locale synchronously from MMKV plus `getLocales()`.

## Green run

New suites pass; every touched suite passes; `yarn validate` passes (English parity: no existing assertion changes anywhere).

## Break script

Copy `shared/i18n/loader.ts` and `app/index.tsx` to `$TMPDIR`; `sed -i '' "s/MODULES\[currentLocaleId()\]/MODULES.en/" shared/i18n/loader.ts`; run `npx jest shared/__tests__/i18nRuntime.test.ts --watchman=false --selectProjects=unit`, expect the ar case to fail with the English value shown; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): runtime catalog switch, call-time captures, locale-keyed widths, remount key`.

## Review checklist

- No component subscribes to the locale besides the root key.
- No English assertion changed in any suite (byte parity).
- The lazy resolution holds no module-eval native call.

## Merge

`git checkout uat && git merge --no-ff feat/39-03-loader -m "Merge feat/39-03-loader into uat: job 39 step 03"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 3`.
