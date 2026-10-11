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
- Commit: (sha recorded below), merged into `uat` with `--no-ff`.

<!-- hook and merge lines appended after commit -->
