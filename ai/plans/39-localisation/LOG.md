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

## Step 02: the five catalogs land - EXECUTION STOPPED, WORK SAVED

- Branch `feat/39-02-catalogs` off `uat`. Anchors `en-catalog-head` and `bridge-import-mode` both counted 1.
- Red (all three, recorded): `catalogGates.test.ts` `Could not locate module @/shared/i18n/ar`; `catalogLock.test.ts` `Could not locate module @/shared/i18n/catalog-lock.json`; `I18N_BRIDGE=import I18N_LOCALE=ar` on the bridge suite `Could not locate module @/shared/i18n/ar`.
- Change (all green before the break): `en.ts` appended the 40 keys (197 total, values byte-identical to `catalogs/en-full.json`, order verified = existing 157 + appended 40); `ar/ms/so/hi/th.ts` generated from the plan JSONs (197 keys each, byte-identity audited exhaustively: 0 mismatches, order matches, `PRAYER_LABELS` resolve from each file's own members); `sourced-names.json` copied from `research/prayer-names.json`; `i18nBridge.test.ts` per-locale export/import (all six locales round-trip OK) plus `channel.reminder: [name, n]` in the pinned list and the `t('channel.reminder', ...)` throw test; `index.ts` `ParamsOf` gained the `channel.reminder` branch; `catalogGates.test.ts` (46 tests) mirrors the mjs gate list; `catalogLock.test.ts` with the plan's stale message; `scripts/catalog-lock.mjs` (reads en.ts through `@babel/parser` because the package is CommonJS and Node's type stripping cannot load the ESM-syntax catalog; the mjs precedent is `scan-strings.mjs`); `package.json` gained `i18n:lock`; `catalog-lock.json` written (all five locales, hash `482665ab...`).
- Full `yarn validate`: 5365 passed, 5365 total, coverage 100% x4, exit 0. `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.
- **Contract deviation (unusedExports, contract 5):** the plan says the five locale exports join `REACHED_WITHOUT_AN_IMPORT`. The sweep proves them self-reachable (each file's `PRAYER_LABELS` references its own catalog const, exactly as `en` already was), so adding them would fail the suite's exact-set assertion. Instead the five new per-file `PRAYER_LABELS` reports are covered by the existing `PRAYER_LABELS` entry, and the suite's second assertion now dedupes reported symbols (six same-named exports report six times; the guarded property is per symbol). Both changes touch only code the plan did not give verbatim; recorded here for the reviewer.
- **STOP cause (the break):** the plan's break script runs `sed -i '' "s/{name} الآن/{name}/" shared/i18n/ar.ts` and expects "the placeholder-parity failure naming notification.now". That sed KEEPS `{name}` and drops the Arabic text, so the mutated value's token set still equals en's and NO gate in the contract's list fires (verified: mutated run passed 46/46). With the arms swapped, `sed "s/{name} الآن/الآن/"`, the gate fails exactly as the plan describes: `ar: notification.now placeholder set differs` (and `time.now`, which shares the value). The sed's replacement text looks swapped in the plan; the executor may not edit the plan's break. Nothing committed for step 02.
- Work saved: `$HOME/athan-gitree/sessions/39/step02-unfinished.patch` (tracked diffs), `step02-unfinished-status.txt`, `step02-files/` (the eight new files), `step02-generate.py` (the generator). Version lock released; tree restored to `uat` minus this LOG entry; branch `feat/39-02-catalogs` deleted (no commits).

session: ses_ed6af035fffew0oURclFBpeBoY
