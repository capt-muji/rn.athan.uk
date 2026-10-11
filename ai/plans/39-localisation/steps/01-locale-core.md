# Step 01: locale resolution core

**Requirements:** R1.1, R5.3
Weight: 2
**Anchors:** `appjson-plugins-head` (app.json). New files carry no anchor.

## Goal

The app can answer "what locale should I speak?" from the stored preference and the
device locale list, and the layout is pinned LTR natively. No behavior change on an
English device.

## Branch

`feat/39-01-locale-core` off `uat`.

## Files

- `package.json` (the install), `yarn.lock`
- `app.json` (plugins array)
- `shared/i18n/locale.ts` (new)
- `shared/__tests__/locale.test.ts` (new)

## Red tests

`shared/__tests__/locale.test.ts`, all failing on the absent module:

1. `resolves ar from ar-EG` - `resolveInitialLocale(null, [{ languageTag: 'ar-EG', languageCode: 'ar' }])` returns `'ar'`.
2. Same shape for `ms-MY` to `'ms'`, `so-SO` to `'so'`, `hi-IN` to `'hi'`, `th-TH` to `'th'`, `en-GB` to `'en'`.
3. `falls back to en for an unsupported language` - `fr-FR` returns `'en'`; `zh-Hans` (languageCode `zh`) returns `'en'`.
4. `the stored preference wins` - `resolveInitialLocale('ar', [th-TH locale])` returns `'ar'`.
5. `an unsupported stored preference falls through to the device` - `resolveInitialLocale('zz', [ms-MY locale])` returns `'ms'`.
6. `an earlier device locale wins over a later one` - `[fr-FR, ar-EG]` returns `'ar'`.

Record the failing line of test 1 (`Cannot find module '@/shared/i18n/locale'`).

## Change contracts

1. Install, exact: `V=$(npm view expo-localization@next version)` then `yarn add expo-localization@$V --exact`. Never `npx expo install --fix`. Immediately run `npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit`; if it fails, apply the VERSIONS.md C3 recovery once, rerun, else STOP.
2. `app.json` plugins array gains `["expo-localization", { "supportsRTL": false }]` after the `expo-splash-screen` entry. No other app.json change in this step.
3. `shared/i18n/locale.ts`:
   - `export const LOCALE_IDS = ['en', 'ar', 'ms', 'so', 'hi', 'th'] as const;`
   - `export type LocaleId = (typeof LOCALE_IDS)[number];`
   - `export interface DeviceLocaleInfo { languageTag: string; languageCode: string | null }`
   - `export const resolveInitialLocale = (preference: string | null, deviceLocales: readonly DeviceLocaleInfo[]): LocaleId` - pure. If `preference` is non-null and a member of `LOCALE_IDS`, return it. Then for each device locale in order: exact `LOCALE_IDS` member match on `languageTag`, then on `languageCode`. Return `'en'` otherwise. No other rule, no region weighting.
   - `export const readStoredLanguagePreference = (): string | null` - `Database.getItem('preference_language')`, `''` and `null` both mean "no choice". Reads through `stores/database` directly (module-eval safe; MMKV is synchronous).
4. Nothing else imports the new module yet. `CURRENT_LOCALE_ID` stays `'en'` (step 03 removes it).

## Green run

`npx jest shared/__tests__/locale.test.ts --watchman=false --selectProjects=unit` passes; `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0; the full `yarn validate` chain passes at commit time.

## Break script

`bash` from the repository root: copy `shared/i18n/locale.ts` to `$TMPDIR`, `sed -i '' "s/return 'en';/return 'ar';/" shared/i18n/locale.ts`, run test 3 (`npx jest shared/__tests__/locale.test.ts -t 'falls back to en' --watchman=false --selectProjects=unit`), expect 1 failure; restore from `$TMPDIR`; rerun the suite, expect pass. The script ends `ALL AS EXPECTED: 1`.

## Version and commit

Version: next patch after `uat`'s `package.json` under the version lock (`mkdir $HOME/athan-gitree/version.lock`, retry in a short sleep loop, `rmdir` after merge). Set the version in `app.json`, `package.json`, `android/app/build.gradle` together. Commit message: `<VERSION> - feat(language): locale resolution core, expo-localization pinned, RTL pinned false`. Add by name: `package.json`, `yarn.lock`, `app.json`, `shared/i18n/locale.ts`, `shared/__tests__/locale.test.ts`, plus the plan files this run changed.

## Review checklist

- The install is an exact pin, not a range; `widgetRuntimeLoads` ran and passed.
- `resolveInitialLocale` holds no rule beyond the contract (no region weighting, no caching).
- No pixel, no stored key, no identifier changed.

## Merge

`git checkout uat && git merge --no-ff feat/39-01-locale-core -m "Merge feat/39-01-locale-core into uat: job 39 step 01"`. A conflict is `git merge --abort`, then STOP.

## Done when

Checklist ticked in `LOG.md` with the commit sha, the hook's `Tests:` line, the break's last line, and the merge sha. The row reads `IN PROGRESS, step 1`.
