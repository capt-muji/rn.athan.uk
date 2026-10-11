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
- Commit: (sha recorded below), merged into `uat` with `--no-ff`.

## Step 02 checklist

- [x] Red: all three named tests failed on the missing modules (recorded above)
- [x] Contracts 1-7 built; en gained keys only; values byte-identical to the plan JSONs
- [x] Named tests pass; tsc and biome exit 0; `yarn validate` green (5365 passed, 100% x4)
- [x] Break script ends `ALL AS EXPECTED: 1`; tree listed only step files after
- [x] Version 2.0.23 set in all three files
- [x] Commit and `--no-ff` merge landed

<!-- hook and merge lines appended after commit -->

session: ses_ed6af035fffew0oURclFBpeBoY
