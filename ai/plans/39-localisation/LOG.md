# Job 39 execution ledger

Steps land here as they execute. Nothing has executed.

## Step 01: locale resolution core

- Branch `feat/39-01-locale-core` off `uat` (pre-flight `PREFLIGHT OK`, 43 anchors verified).
- Red: `shared/__tests__/locale.test.ts` failed with `Could not locate module @/shared/i18n/locale` (all 6 planned tests plus the coverage additions the hook demands).
- Change: `expo-localization@58.0.4` installed exact via the plan's D46 command; `widgetRuntimeLoads` passed first try (3 passed), no C3 recovery needed. `app.json` plugins array gained `["expo-localization", { "supportsRTL": false }]` after `expo-splash-screen`. `shared/i18n/locale.ts` created per contract (`LOCALE_IDS`, `LocaleId`, `DeviceLocaleInfo`, `resolveInitialLocale`, `readStoredLanguagePreference`). Nothing imports it yet; `CURRENT_LOCALE_ID` untouched.
- Extra beyond the step's file list: `shared/__tests__/unusedExports.test.ts` gained two `REACHED_WITHOUT_AN_IMPORT` entries (`resolveInitialLocale`, `readStoredLanguagePreference`), because the sweep flags the not-yet-imported module and the step's own green run requires the full `yarn validate` chain to pass. Same mechanism the plan's step 2 contract prescribes for the five catalog exports.
- Green: `locale.test.ts` 16 passed; coverage on `shared/i18n/locale.ts` 100% x4; `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0; full `yarn validate` 196 suites, 5313 passed, coverage 100% x4, exit 0.
- Break: `ALL AS EXPECTED: 1` (mutating `return 'en'` to `return 'ar'` failed exactly the `falls back to en` test, 1 failed / 15 skipped; restore passed).
- Version 2.0.20 in `app.json`, `package.json`, `android/app/build.gradle` (gradle gitignored, not added).
- Commit: `c2f08caa` (2.0.20). Hook `Tests: 5313 passed, 5313 total`, coverage 100% on statements (5015), branches (2184), functions (1040), lines (4493).
- Review: cold read of `git show c2f08caa` against the checklist; exact pin verified, no extra rule in `resolveInitialLocale`, no pixel/key/identifier change; no findings.
- Merge: `dce0f053` into `uat` (`--no-ff`). Branch deleted.

## Step 02: the five catalogs land

- Branch `feat/39-02-catalogs` off `uat` (pre-flight re-run this session: `PREFLIGHT OK`, 43 anchors; step anchors `en-catalog-head` and `bridge-import-mode` each counted 1). Saved work from the stopped session reused after re-deriving it red-first: the generator re-ran from the plan JSONs and, after Biome formatting, reproduced the saved locale files byte for byte.
- Red (all three, re-run and recorded): `catalogGates.test.ts` `Could not locate module @/shared/i18n/ar`; `catalogLock.test.ts` `Could not locate module @/shared/i18n/catalog-lock.json`; `I18N_BRIDGE=import I18N_LOCALE=ar` on the bridge suite `Could not locate module @/shared/i18n/ar`.
- Change: `en.ts` appended the 40 keys (197 total, values byte-identical to `catalogs/en-full.json`, order verified = existing 157 + appended 40); `ar/ms/so/hi/th.ts` generated from the plan JSONs (197 keys each, order matches, `PRAYER_LABELS` resolve from each file's own members); `sourced-names.json` copied from `research/prayer-names.json` (byte-identical, `cmp` clean); `i18nBridge.test.ts` per-locale export/import (all six locales round-trip OK, 6 passed each) plus `channel.reminder: [name, n]` in the pinned list and the `t('channel.reminder', ...)` throw test; `index.ts` `ParamsOf` gained the `channel.reminder` branch; `catalogGates.test.ts` (46 tests) mirrors the mjs gate list; `catalogLock.test.ts` with the plan's stale message; `scripts/catalog-lock.mjs` (reads en.ts through `@babel/parser`; the mjs precedent is `scan-strings.mjs`); `package.json` gained `i18n:lock`; `catalog-lock.json` written (all five locales, hash `482665ab...`, regenerated this run and identical to the saved file).
- unusedExports (contract 5, as the refreshed plan prescribes): the five locale exports stay off `REACHED_WITHOUT_AN_IMPORT` (self-reachable through their own `PRAYER_LABELS`); the suite's reported-symbol assertion dedupes per symbol. No deviation.
- Green: gates+lock suites 52 passed; `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0; full `yarn validate` 198 suites, 5365 passed, 5365 total, coverage 100% x4, exit 0.
- Break (D53 line-anchored sed): mutated `1 failed, 45 passed, 46 total`, the failures array holding the one string `ar: notification.now placeholder set differs`; restored `46 passed, 46 total`; `ALL AS EXPECTED: 1`. Tree listed only this step's files after.
- Version 2.0.23 in `app.json`, `package.json`, `android/app/build.gradle` (gradle gitignored, not added).
- Commit: `40bb5074` (2.0.23). Hook `Tests: 5365 passed, 5365 total`, coverage 100% on statements (5025), branches (2184), functions (1040), lines (4503).
- Review: cold read of `git show 40bb5074` against the checklist; a python byte-audit re-derived every locale value from the plan JSONs (197 keys per locale, 0 mismatches, en order preserved), en gained keys only (no deletions in the diff), and the lock hash recomputed over the landed en (`482665ab...`) matches. No findings.
- Merge: `0734b3fb` into `uat` (`--no-ff`). Branch deleted.

## Step 02 checklist

- [x] Red: all three named tests failed on the missing modules (recorded above)
- [x] Contracts 1-7 built; en gained keys only; values byte-identical to the plan JSONs
- [x] Named tests pass; tsc and biome exit 0; `yarn validate` green (5365 passed, 100% x4)
- [x] Break script ends `ALL AS EXPECTED: 1`; tree listed only step files after
- [x] Version 2.0.23 set in all three files
- [x] Commit and `--no-ff` merge landed

## Step 03: the loader switches, the captures dissolve

- Branch `feat/39-03-loader` off `uat`. All ten step anchors counted 1 before work began.
- Red (all five, recorded): `i18nRuntime.test.ts` `setActiveLocale is not a function` (4 tests); the Alert suite's ar render test `setActiveLocale is not a function` (1 failed / 27 passed); the whatsNew suite `currentVisibleWhatsNew is not a function`; the InitialWidthMeasurement suite `englishWidthAtomFor is not a function` / `setActiveLocale is not a function` (3 failed); the ui.test.ts family test `englishWidthAtomFor is not a function`.
- Change: `locale.ts` gained `localeVersionAtom`, the memoized lazy `currentLocaleId()` (resolves once via `resolveInitialLocale(readStoredLanguagePreference(), getLocales())`), and `setActiveLocale` (sets and bumps); the loader holds the six requires between the unchanged perf marks, normalised through a per-module adapter into `MODULES` keyed by `LocaleId`, with `currentCatalog()`/`currentPrayerLabels()` one-line `MODULES[currentLocaleId()]` calls; `index.ts` deleted `CURRENT_LOCALE_ID`; `stores/ui.ts` became the `englishWidthAtomFor` family (per-locale `prayer_max_english_width_${locale}_${side}` keys, `atomWithStorageNumber(key, 0)` created on first access and cached) with the legacy seed pinned to literal `en` and `setEnglishWidth` reading through the family; `usePrayer` reads `useAtomValue(englishWidthAtomFor(type))`; the four captures became call-time (`alertOptions()`, `unavailableMessage()`, `soundOptions()`, `getHelpActionLabels()`, `currentVisibleWhatsNew()`) with their consumers calling the functions; `getLongestPrayerNameIndex` compares `[...labels[id]].length` over `currentPrayerLabels()`; `_layout.tsx` subscribes `localeVersionAtom` and keys `GestureHandlerRootView` with it.
- Extras beyond the step's file list, all forced by the green run: `shared/__mocks__/expo-localization.ts` (new) plus one `^expo-localization$` mapper line in `jest.config.js` (the unit project cannot load the package's ESM build; the repo's established mock pattern); `locale.ts` imports `jotai/vanilla`, not the root entry (the root pulls Provider and React into logic suites whose react is a stub); 25 suites' `@/stores/database` mocks gained `getItem: () => null` (the locale resolver's preference read); `usePrayerAgo` and `overlay` widened their `jotai/vanilla` mocks with `requireActual` (locale.ts's `atom` must stay real); the seven width suites migrated their `@/stores/ui` mocks to `englishWidthAtomFor`; the whatsNew consumers' mocks moved from the `VISIBLE_WHATS_NEW` property to `currentVisibleWhatsNew` (app/index's nulling test now resets its mock variable in a `beforeEach`, since nothing auto-restores it); `ui.test.ts`'s isolated loader pre-creates the family's atoms inside the isolation window (its storage-factory mock picks its branch at call time); `help.test.ts`'s marked-catalog doMock dropped its `requireActual` spread (the loader-locale-database-time path now re-enters the mocked module mid-cycle); `unusedExports` swapped the two step-1 entries for `setActiveLocale` (the loader now reaches the former; nothing production reaches the setter before step 04).
- Green: all named suites pass; `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` exit 0; full `yarn validate` 199 suites, 5373 passed, 5373 total, coverage 100% x4, exit 0.
- Break: `sed "s/MODULES\[currentLocaleId()\]/MODULES.en/"` made `2 failed, 2 passed` with the ar case showing `Received: "Fajr"` (the th `prayerLabel` case fails alongside: the sed pins both lookups); restored `4 passed, 4 total`; `ALL AS EXPECTED: 1`. Tree listed only step files after.
- Version 2.0.24 in `app.json`, `package.json`, `android/app/build.gradle` (gradle gitignored, not added).
- Commit: `3ee03cb9` (2.0.24), merged into `uat` with `--no-ff` as `c8c8b3cb`. Hook and review lines in the step 04 stop note below.

## Step 03 checklist

- [x] Red: the five named tests failed on the absent functions (recorded above)
- [x] Contracts 1-8 built; `CURRENT_LOCALE_ID`, `englishWidthStandardAtom`/`ExtraAtom` and the four captures deleted
- [x] Named tests pass; tsc and biome exit 0; `yarn validate` green (5373 passed, 100% x4)
- [x] Break script ends `ALL AS EXPECTED: 1`; tree listed only step files after
- [x] Version 2.0.24 set in all three files
- [x] Commit and `--no-ff` merge landed

<!-- hook and merge lines appended after commit -->

## Step 04: forward-only convergence - EXECUTION STOPPED AT THE ANCHOR CHECK

- Step 4's anchor check before any work: `app-init-timeout` counts **0** on `app/index.tsx`; the other six step anchors count 1. The failing anchor line is `import { shouldShowWhatsNew, VISIBLE_WHATS_NEW } from '@/shared/whatsNew';`, which step 03's contract 5 itself renamed to `currentVisibleWhatsNew` (commit `3ee03cb9`). The anchor file was not refreshed for step 03's output: the D53 refresh proved its worktree fixes against step 2 only. Per the plan's rule (any anchor count other than 1 is NEEDS REPLAN) and the executor's law (never repair an anchor in flight), the step stopped before its red tests. Nothing was built for step 4; branch `feat/39-04-convergence` deleted (no commits).
- Step 03 completion lines: commit `3ee03cb9` (2.0.24). Hook `Tests: 5373 passed, 5373 total`, coverage 100% on statements (5052), branches (2188), functions (1049), lines (4523). Merge: `c8c8b3cb` into `uat` (`--no-ff`). Branch deleted. Review: cold read against the checklist (only `_layout.tsx` subscribes to the locale; the removed test lines were accessor plumbing with values carried verbatim; the lazy resolution makes no module-eval native call); no findings.
- The one-line repair a replan needs: `app-init-timeout.txt`'s whatsNew import line updated to `import { currentVisibleWhatsNew, shouldShowWhatsNew } from '@/shared/whatsNew';` (verified present exactly once at `app/index.tsx:24` on uat `c8c8b3cb`).

## Step 04: forward-only convergence

- Branch `feat/39-04-convergence` off `uat` (`4a2cc40d`, the anchor-repair merge). All seven step anchors counted 1 before work began (python count).
- Red (all three, recorded): `languageConvergence.test.ts` and the keep-alive extension both failed `Cannot find module '@/stores/language'`; the `notifications.test.ts` ar channel-name test failed `Expected: "تنبيه المغرب بعد 15 د"` against the template literal's `"Magrib in 15m Reminder"` (1 failed / 75 passed).
- Change: `stores/language.ts` created (`lastArmedLanguageAtom` on `preference_language_last_armed`, `languagePreferenceAtom` on `preference_language`, `reconcileLanguageSurfaces` comparing `currentLocaleId() === store.get(lastArmedLanguageAtom)` byte-for-byte as the break pins, `commitLanguagePreference` persisting then `setActiveLocale` then converging); `stores/notifications.ts` gained only the `export` keyword on `withSchedulingLock` (signature untouched) and the thin `rescheduleAllForLanguageChange = (): Promise<boolean>` around `_rescheduleAllNotifications({ deferWidgetRefresh: false })`; `shared/notifications.ts` gained `resetAndroidChannelCaches` and the reminder channel name line became `t('channel.reminder', { name: prayerLabel(id), n: intervalMinutes })`; `device/listeners.ts` calls `reconcileLanguageSurfaces()` fire-and-forget at the end of the background-to-active branch; `app/index.tsx` chains `.then(() => reconcileLanguageSurfaces())` after `initializeNotifications(...)` inside the 1.5 s window, sharing the existing catch.
- Extras beyond the step's file list, all forced by the green run: `__tests__/app/index.test.tsx` gained `jest.mock('@/stores/language', ...)` (the real pass re-armed alerts behind the launch under test and broke the "leaves alerts armed within the last 12 hours alone on an iOS launch" assertion; convergence behaviour lives in its own suite); `shared/__tests__/unusedExports.test.ts` swapped the `setActiveLocale` entry (now production-reached through `stores/language.ts`) for `commitLanguagePreference` (reached at step 05), the step-01 precedent; `shared/__tests__/prayerIdContract.test.ts` updated the one freeze assertion that pinned the deleted template-literal source bytes to the sibling lines' established catalog-driven pattern (`t('channel.reminder', ...)` in source plus `'{name} in {n}m Reminder'` in the en catalog), so the English name format stays frozen. English bytes and every id/sound/importance byte are unchanged.
- Green: named suites 5 + 6 + 76 passed; `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` clean; full `yarn validate` 200 suites, 5380 passed, 5380 total, coverage 100% x4; `yarn test:tz` 5380 passed in each of the four zones.
- Break: the sed on `currentLocaleId() === store.get(lastArmedLanguageAtom)` mutated `1 failed, 4 passed` (the no-op case saw the driver spy called once); restored `5 passed, 5 total`; `ALL AS EXPECTED: 1`. Tree listed only step files after.
- Version 2.0.26 in `app.json`, `package.json`, `android/app/build.gradle` (gradle gitignored, not added; origin/uat lags local at 2.0.19, so local uat's 2.0.25 decided the next patch).
- Commit: `cd3a5b18` (2.0.26). Hook `Tests: 5380 passed, 5380 total`, coverage 100% on statements (5077), branches (2192), functions (1055), lines (4545).
- Review: cold read of `git show cd3a5b18` against the checklist. No channel id, identifier, sound or importance byte changed; the stamp writes only after a `true` pass; no rollback path exists; every new export is reached or allow-listed for step 05. No findings beyond the recorded extras.
- Merge: `0597c09a` into `uat` (`--no-ff`). Branch deleted. Row reads `IN PROGRESS, step 4`.

## Step 05: the Settings row, the language sheet, the progress face

- Branch `feat/39-05-sheet` off `uat` (`0597c09a`). Both step anchors (`settings-display-card`, `sound-commit-dismiss`) counted 1 before work began.
- Red (all three, recorded): `Language.test.tsx` failed `Cannot find module '../screens/Language'` (0 tests); the Settings extension failed `Cannot find module '../Language' from 'components/sheets/screens/__tests__/Settings.test.tsx'` (suite failed to run); the stringGuard names pin failed `ENOENT ... shared/languageNames.ts` (1 failed / 5 passed).
- Change: `shared/languageNames.ts` created (`LANGUAGE_NAMES`, the six D26 native names in codepoint order, no other export); the globe SVG (`assets/icons/svg/globe.svg`, 256 viewBox, currentColor strokes: circle, meridian ellipse, equator, two parallels) with `Icon.GLOBE` in `shared/types.ts` and the svg index; `components/sheets/screens/Language.tsx` created (Sheet titled `t('settings.language')`, empty subtitle because the pick commits immediately, globe header icon at `SHEET_ICON_COLOR` size 16, `snapPoints={['60%']}`, `perfName="sheet_language"`, `stackBehavior={'push'}` matching the sound sheet; radio rows over `LANGUAGE_NAMES` with `const busy = useAtomValue(languageCommitBusyAtom)` and `disabled={busy}` byte-for-byte as the break pins; the active row carries the check, and while busy the active row shows the splash gate's ActivityIndicator with `SIZE.activityIndicator` and `COLORS.navigation.activityIndicator` plus `t('language.applying')`, which already reads the new locale because the UI switches with the pick); `components/sheets/screens/languageSheet.ts` created holding the pure `pickLanguage` flow (the active row only closes the sheet; any other pick awaits the commit and dismisses on both settle paths), following soundSheet.ts's tested-decisions split; `components/sheets/screens/Settings.tsx` gained the Language row as the Display card's first row, built line for line like the athan row (round button, globe at size 9, label, chevron, Medium haptic, `hideSettingsSheet()` then `showLanguageSheet()`); `stores/language.ts` gained `languageCommitBusyAtom`, and `commitLanguagePreference` now brackets itself with it (true at entry, false in a finally); `stores/ui.ts` gained `languageSheetModalAtom`, `setLanguageSheetModal`, `showLanguageSheet` (perfMark `sheet_language_present`) and `hideLanguageSheet`, following the existing pattern; `scripts/scan-strings.mjs` added `shared/languageNames.ts` to `DATA_MODULES` plus the `name`-field allowance; `shared/__tests__/stringGuard.test.ts` pins the names-as-data rule; both sheets indexes export the sheet.
- Extras beyond the step's file list, both forced by the working feature and recorded here for the audit: `app/_layout.tsx` mounts `<BottomSheetLanguage />` beside the other sheets (the plan's file list omits the mount, but without it the Settings row opens nothing on device; every sheet mounts there); `shared/__tests__/unusedExports.test.ts` dropped the step-04 `commitLanguagePreference` allow-list entry (the sheet imports it now).
- KNOWN DEFECT for the lead, found while building and deliberately not worked around: the remount key from step 03 sits on `GestureHandlerRootView` (`app/_layout.tsx:86`), so `setActiveLocale` inside the commit unmounts the presented language sheet mid-apply. On device the D51 progress face cannot show without a mechanism the plan does not give (the sheet re-presenting itself on a busy mount, or the sheet layer living outside the keyed root). The suite passes because it renders the sheet outside `_layout`. No speculative mechanism was committed; the device steps (12 onwards) will hit this, and a replan ruling is needed before then.
- Green: `Language.test.tsx` 5 passed; the Settings suite 19 passed; stringGuard + unusedExports 8 passed; `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` clean; full `yarn validate` 201 suites, 5387 passed, 5387 total, coverage 100% x4.
- Break: `sed "s/disabled={busy}/disabled={false}/"` made `1 failed, 4 passed` with the busy test the one failure (rows accepting input while busy); restored `5 passed, 5 total`; `ALL AS EXPECTED: 1`. (The first run showed a cascade second failure because a failed assertion threw past the test's queue-drain; the drain moved into an `afterEach` so the suite is order-robust.)
- Version 2.0.27 in `app.json`, `package.json`, `android/app/build.gradle` (gradle gitignored, not added).
- Commit: `92804f45` (2.0.27). Hook `Tests: 5387 passed, 5387 total`, coverage 100% on statements, branches, functions, lines.
- Review: cold read of `git show 92804f45` against the checklist: the row matches the athan row line for line (same styles, sizes, chevron, haptic); six rows in codepoint order with no English glosses; no cancel path and both settle paths dismiss. No findings beyond the recorded extras and the known defect above.
- Merge: `460d0587` into `uat` (`--no-ff`). Branch deleted. Row reads `IN PROGRESS, step 5`.

## Step 06: catalog-composed dates

- Branch `feat/39-06-dates` off `uat` (`460d0587`). All four step anchors counted 1 before work began.
- Red (all four, recorded): every test in `dateLocalized.test.ts` failed `TypeError: (0 , _time.formatDateLocalized) is not a function` / `...formatHijriDateLocalized is not a function` (4 failed, 0 passed; the functions did not exist).
- Change: `shared/time.ts` replaced the deleted `formatDateLong`/`formatHijriDateLong` pair with `formatDateLocalized` (parses exactly as the old function did, ISO weekday Monday 1 to Sunday 7, composing `` `${t(GREGORIAN_WEEKDAY_KEYS[isoWeekday - 1])}, ${day} ${t(GREGORIAN_MONTH_KEYS[month - 1])} ${year}` ``) and `formatHijriDateLocalized` (the `en-US-u-ca-islamic-umalqura` Intl call with `{ day: 'numeric', month: 'numeric', year: 'numeric', timeZone: PRAYER_TIMEZONE }` read through `formatToParts`, composing `` `${t(HIJRI_MONTH_KEYS[hijriMonth - 1])} ${hijriDay}, ${hijriYear}` `` - the era part is never read, so no affix in any locale and the digits stay Latin; the catch falls back to `formatDateLocalized` exactly as the old catch fell back). The three key tuples are module-private, typed `as const satisfies readonly TranslationKey[]`, so the computed lookups stay compile-checked with no casts. `components/day/shownDate.ts` and `shared/widgetTimeline.ts` route to the localized pair; the five suites that imported the deleted pair converted by rename (`time.test.ts`, `widgetSimulation.test.ts`, `widgetSnapshot.test.ts`, `widgetTimeline.test.ts`, `widgetSettingsSync.test.ts`). The unused date-fns `format` import left with the old function.
- Green: `dateLocalized.test.ts` 4 passed (365-day en byte parity against a date-fns oracle, the ar label `الأحد, 11 أكتوبر 2026`, ten Hijri fixtures against an independent Intl long-month oracle with no ` AH` suffix, and the th label `รอบี II 30, 1448` with no Thai digits); the seven converted and neighbouring suites 276 passed; `npx tsc --noEmit` exit 0; `npx biome check . --error-on-warnings` clean; full `yarn validate` 202 suites, 5391 passed, 5391 total, coverage 100% x4; `yarn test:tz` 5391 passed in each of the four zones.
- Break: the sed on the Gregorian template's `}, ${day} ` bytes made `2 failed, 2 passed` (the 365-day parity test and the ar label test both catch the `Sun, 30x Mar 2026` shape); restored `4 passed, 4 total`; `ALL AS EXPECTED: 1`. Tree listed only step files after.
- Review: `grep -rn "formatDateLong\|formatHijriDateLong"` over every source tree returns nothing; no format decision lives outside the two functions (both call sites only route); Hijri digits Latin with the era part unread. No findings.
- Version 2.0.28 in `app.json`, `package.json`, `android/app/build.gradle` (gradle gitignored, not added).
- Commit: `098ec7cd` (2.0.28). Hook `Tests: 5391 passed, 5391 total`, coverage 100% on statements, branches, functions, lines.
- Merge: `d36923cc` into `uat` (`--no-ff`). Branch deleted. Row reads `IN PROGRESS, step 6`.

## Step 04 checklist

- [x] Red: the convergence suite and keep-alive extension failed on the absent module; the ar channel-name test failed on the template literal
- [x] Contracts 1-5 built; no id, sound, importance or identifier byte changed; no rollback path
- [x] Named tests pass; tsc and biome exit 0; `yarn validate` green (5380 passed, 100% x4); `yarn test:tz` green in four zones
- [x] Break script ends `ALL AS EXPECTED: 1`; tree listed only step files after
- [x] Version 2.0.26 set in all three files
- [x] Commit `cd3a5b18` and `--no-ff` merge `0597c09a` landed

## Step 05 checklist

- [x] Red: the Language suite and Settings extension failed on the absent component; the stringGuard names pin failed on the absent module
- [x] Contracts 1-6 built; the row matches the athan row line for line; six names in codepoint order; no cancel; both settle paths dismiss
- [x] Named tests pass; tsc and biome exit 0; `yarn validate` green (5387 passed, 100% x4)
- [x] Break script ends `ALL AS EXPECTED: 1`; tree listed only step files after
- [x] Version 2.0.27 set in all three files
- [x] Commit `92804f45` and `--no-ff` merge `460d0587` landed

## Step 06 checklist

- [x] Red: all four dateLocalized tests failed on the absent functions
- [x] Contracts 1-2 built; the old pair deleted; every call site and the five suites converted
- [x] Named tests pass; tsc and biome exit 0; `yarn validate` green (5391 passed, 100% x4); `yarn test:tz` green in four zones
- [x] Break script ends `ALL AS EXPECTED: 1`; tree listed only step files after
- [x] Version 2.0.28 set in all three files
- [x] Commit `098ec7cd` and `--no-ff` merge `d36923cc` landed

session: ses_ed68ed1ebffeum3GKU1fk2P6zu (steps 1 to 3 and the step 4 stop)
session: ses_ed66ae6c9ffe9YyDq9SegY4zcs (steps 4 to 6)


- Commit: `098ec7cd` (2.0.28), merged into `uat` with `--no-ff` as `d36923cc`. The completing session ended before these lines: the hook log died with its temp folder, and the checklist's own measured line stands - `yarn validate` 201 suites, 5391 passed, 5391 total, coverage 100% x4, `yarn test:tz` green in four zones. Branch deleted; row read `IN PROGRESS, step 6`. The lead verified the landing from the repository and appended this entry.

session: ses_ed66ae6c9ffe9YyDq9SegY4zcs
