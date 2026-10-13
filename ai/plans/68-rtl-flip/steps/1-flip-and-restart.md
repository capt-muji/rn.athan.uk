# Step 1: The flip, the bootstrap direction, the boundary relaunch

Requirements: R1.1, R1.2, R2.1, R2.2
Weight: 2

## Anchor check

Run the pre-flight (`scripts/preflight-68.sh`, copied to `$TMPDIR`, run from
the repository root). Anchors this step edits against: `appjson-rtl`,
`commit-flow`, `locale-ids`. A count other than 1 is a STOP.

## Goal

`supportsRTL` flips true, the stored direction applies before first render,
and crossing the RTL boundary converges then relaunches; same-direction
switches never relaunch.

## Branch

`git checkout -b feat/68-rtl-flip uat`

## Files

- `app.json` (change: the plugin flag)
- `shared/i18n/locale.ts` (change: `localeDirection`)
- `stores/bootstrap.ts` (change: the launch-time direction)
- `stores/language.ts` (change: the boundary relaunch)
- `jest.config.js` (change: map `expo-updates` to the mock in `appModuleMocks`)
- `shared/__mocks__/expo-updates.ts` (new: `reloadAsync` resolving undefined,
  the Error.test.tsx shape — without the mapping and the file the unit
  project cannot load `stores/language.ts`, whose new top-level import is ESM
  and untransformed)
- `shared/__mocks__/react-native.ts` (change: the I18nManager mock the unit
  suites import — `allowRTL`, `forceRTL`, `getConstants` returning `isRTL`)
- `stores/__tests__/rtlSwitch.test.ts` (new)
- `stores/__tests__/bootstrap.test.ts` (change: the direction cases)
- `shared/__tests__/nativeConfig.test.ts` (change: the supportsRTL assertion)

## Red tests

1. New `stores/__tests__/rtlSwitch.test.ts`, mocking `expo-updates`
   (`reloadAsync: jest.fn().mockResolvedValue(undefined)`, the
   `components/ui/__tests__/Error.test.tsx:6,13` shape) and React Native's
   I18nManager (`react-native` mock extension: `allowRTL`, `forceRTL` as
   `jest.fn()`), driving `commitLanguagePreference` through the real store
   the `languageConvergence.test.ts` way (`withSchedulingLock` pass-through,
   `rescheduleAllForLanguageChange` mocked resolved):

```ts
it('crossing to ar converges, then forces RTL and relaunches', async () => {
  await commitLanguagePreference('ar');
  expect(reloadAsync).toHaveBeenCalledTimes(1);
  const arm = reschedule.mock.invocationCallOrder.at(-1)!;
  const allow = allowRTL.mock.invocationCallOrder.at(-1)!;
  const force = forceRTL.mock.invocationCallOrder.at(-1)!;
  expect(allow).toBeGreaterThan(arm);
  expect(force).toBeGreaterThan(allow);
  expect(forceRTL).toHaveBeenLastCalledWith(true);
});

it('crossing back to en forces LTR and relaunches', async () => {
  store.set(languagePreferenceAtom, 'ar');
  setActiveLocale('ar');
  await commitLanguagePreference('en');
  expect(reloadAsync).toHaveBeenCalledTimes(1);
  expect(forceRTL).toHaveBeenLastCalledWith(false);
});

it('a same-direction switch never relaunches', async () => {
  await commitLanguagePreference('ms');
  expect(reloadAsync).not.toHaveBeenCalled();
  expect(forceRTL).not.toHaveBeenCalled();
});
```

   The suite carries `languageConvergence.test.ts`'s hygiene verbatim — the
   unit project sets no `clearMocks`, so without it the second and third
   cases inherit the first's calls:

```ts
beforeEach(() => {
  jest.clearAllMocks();
  store.set(lastArmedLanguageAtom, '');
  store.set(languagePreferenceAtom, '');
});
```

2. In `stores/__tests__/bootstrap.test.ts`, add (the database mock factory
   gains a primable `getRawItem` jest.fn in this suite before the module
   re-evaluates, and the file's existing fresh-module helper drives it):

```ts
it('applies the stored direction before first render', () => {
  primeRawItem('ar');
  requireFreshBootstrap();
  expect(allowRTL).toHaveBeenCalledWith(true);
  expect(forceRTL).toHaveBeenCalledWith(true);
});

it('forces LTR when the stored preference is LTR', () => {
  primeRawItem('en');
  requireFreshBootstrap();
  expect(forceRTL).toHaveBeenCalledWith(false);
});

it('leaves the device default when no preference is stored', () => {
  primeRawItem(undefined);
  requireFreshBootstrap();
  expect(forceRTL).not.toHaveBeenCalled();
});
```

3. R1.1's observable: in `shared/__tests__/nativeConfig.test.ts` (which
   already reads `app.json`), add
   `it('ships supportsRTL true on the expo-localization plugin', ...)` asserting
   the plugin entry's config equals `{ supportsRTL: true }`.

Run:

```
npx jest stores/__tests__/rtlSwitch.test.ts stores/__tests__/bootstrap.test.ts shared/__tests__/nativeConfig.test.ts --watchman=false --selectProjects=unit
```

Expected: the first two rtlSwitch cases fail with
`Expected number of calls: 1, Received number of calls: 0` on `reloadAsync`
(asserted first so the break is reachable), the third passes at red (a pure
negative: nothing calls `reloadAsync` yet); the first two bootstrap cases
fail (`forceRTL` not called) and the third passes at red (it asserts the
absence of a call); the nativeConfig case fails
(`Expected: true, Received: false` on the flag as it ships today). Every
existing case passes. Any other failure is a STOP.

## Change contracts

1. `app.json`: `["expo-localization", { "supportsRTL": false }],` becomes
   `["expo-localization", { "supportsRTL": true }],` (counts 1 at
   `Planned at`; count with `grep -F` first).

2. `shared/i18n/locale.ts`, below `LOCALE_IDS`:

```ts
/** The only RTL id in the shipped six; every surface keys direction off this. */
export const localeDirection = (id: LocaleId): 'ltr' | 'rtl' => (id === 'ar' ? 'rtl' : 'ltr');
```

3. `stores/bootstrap.ts`, at module evaluation after the MMKV hydration
   block, importing `I18nManager` from `react-native` and `LOCALE_IDS`,
   `localeDirection`, `LocaleId` (type) and `readStoredLanguagePreference`
   from `@/shared/i18n/locale`:

```ts
// RTL is launch-time under Fabric: the stored preference must set the
// direction before the first render, and no preference leaves the device
// default (D33).
I18nManager.allowRTL(true);
const storedDirection = readStoredLanguagePreference();
if (storedDirection !== null && (LOCALE_IDS as readonly string[]).includes(storedDirection)) {
  I18nManager.forceRTL(localeDirection(storedDirection as LocaleId) === 'rtl');
}
```

4. `stores/language.ts`, in `commitLanguagePreference`, capturing the
   previous direction before `setActiveLocale` and restarting after the
   reconcile resolves:

```ts
export const commitLanguagePreference = async (locale: LocaleId): Promise<void> => {
  const directionBefore = localeDirection(currentLocaleId());
  store.set(languageCommitBusyAtom, true);
  try {
    store.set(languagePreferenceAtom, locale);
    setActiveLocale(locale);
    await reconcileLanguageSurfaces();
    if (localeDirection(locale) !== directionBefore) {
      // Fabric treats direction as launch-time (D59): converge first, then
      // force the new direction and relaunch. The busy face ends here.
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(localeDirection(locale) === 'rtl');
      await Updates.reloadAsync();
    }
  } finally {
    store.set(languageCommitBusyAtom, false);
  }
};
```

   with `Updates` from `expo-updates` and `I18nManager` from `react-native`
   imported at the top, and `localeDirection` + `currentLocaleId` from
   `@/shared/i18n/locale`.

What the contract must never do: relaunch before the reconcile resolves,
relaunch on a same-direction switch, touch the sheet components, or write any
new storage key.

## Green run

```
npx jest stores/__tests__/rtlSwitch.test.ts stores/__tests__/bootstrap.test.ts stores/__tests__/languageConvergence.test.ts shared/__tests__/locale.test.ts shared/__tests__/i18nRuntime.test.ts shared/__tests__/nativeConfig.test.ts --watchman=false --selectProjects=unit
npx jest components/sheets/__tests__/Language.test.tsx --watchman=false --selectProjects=components
npx tsc --noEmit
npx biome check . --error-on-warnings
```

All pass; exit 0 each. The Language sheet suite passing unchanged proves the
sheet layer never learned about the restart.

## Break script

`bash scripts/break-step1.sh` from the plan folder, copied to `$TMPDIR`: it
comments out the `if (localeDirection...)` restart block, runs the rtlSwitch
suite, expects `crossing to ar` to fail with
`Expected number of calls: 1, Received number of calls: 0` on `reloadAsync`,
restores the file, ends `ALL AS EXPECTED: 1`.

## Version and commit

Version command: the next patch after `uat`'s `package.json` under the
version lock (`mkdir $HOME/athan-gitree/version.lock`, retry in a short sleep
loop while it exists, `rmdir` it after the merge). Set in `app.json` FIRST,
then `package.json`, then the gitignored `android/app/build.gradle`
(`versionName`, never added). Add the ten files plus `app.json`, `package.json`
and `jest.config.js` by name, `ai/plans/README.md` (`IN PROGRESS, step 1`) and
the plan's `PLAN.md` and `LOG.md`. Message:

```
<VERSION> - feat(rtl): supportsRTL flipped, direction forced at launch and boundary

The stored preference sets the direction before first render; crossing the
RTL boundary converges then relaunches (D59); same-direction switches never
restart. R1.1-R2.2.
```

## Review checklist

- `app.json` diff is the one flag.
- The restart block sits inside the `try`, after the reconcile `await`.
- No new storage key; `preference_language` remains the only locale key
  written.
- The sheet suites pass unchanged.

## Merge

`git checkout uat && git merge --no-ff feat/68-rtl-flip -m "<VERSION> -
merge feat/68-rtl-flip: step 1, the flip and the relaunch"`. A conflict
aborts and STOPs.

## Done when

Checklist ticked, `LOG.md` appended with the heading, shas, hook lines, break
line and `session:` line.
