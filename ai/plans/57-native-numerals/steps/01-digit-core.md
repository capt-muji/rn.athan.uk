# Step 01: the digit localiser and the shared formatters

**Requirements:** R1.1, R1.2, R3.1
Weight: 2
**Anchors:** `time-format-prayer`, `time-format-elapsed`, `time-date-localized`.

## Goal

One localiser, `localiseDigits`, and the six `shared/time.ts` functions routing
through it. Arabic renders Eastern Arabic-Indic digits everywhere the shared
formatters feed; every other locale renders byte-identical to 2.0.49.

## Branch

`feat/57-01-digit-core` off `uat`.

## Files

- `shared/i18n/digits.ts` (new), `shared/i18n/index.ts` (re-export), `shared/time.ts`
- tests: `shared/__tests__/digits.test.ts` (new), the `time.test.ts` and
  `dateLocalized.test.ts` extensions

## Red tests

1. `digits.test.ts`: `localiseDigits('05:44')` under ar returns `'٠٥:٤٤'`; under en,
  ms, so, hi, th returns `'05:44'`; empty string returns empty; a string with no
  digits returns itself - fails on the absent module.
2. `time.test.ts` extension: `formatPrayerTime` under ar returns `'٠٥:٤٤'`;
  `formatTime(10740)` under ar returns `'٢س ٥٩د'` (the ar duration labels are `'س'`/`'د'`);
  under en both return today's bytes - fails (today every locale renders Latin).
3. `dateLocalized.test.ts` extension: the Gregorian label under ar composes
  `'الأحد, ١١ أكتوبر ٢٠٢٦'`; the Hijri label under ar composes native digits with no
  era affix; the th assertions (including the `[๐-๙]` prohibition) stay green - fails.

## Change contracts

1. `shared/i18n/digits.ts`:
   `export const ARABIC_INDIC: Readonly<Record<string, string>>` mapping the ten Latin
   digit glyphs to their Eastern Arabic-Indic counterparts, and
   `export const localiseDigits = (value: string): string`. The locale test appears
   exactly once, spelled `currentLocaleId() === 'ar'`, in
   `return currentLocaleId() === 'ar' ? <the mapped value> : value;`, so the break
   script's bytes are pinned. The locale read is call-time through the existing locale
   module (job 39's loader law: no module-scope capture). Nothing else exports from
   the file.
2. `shared/i18n/index.ts` re-exports `localiseDigits`.
3. `shared/time.ts`: `formatPrayerTime`, `formatTime`, `formatTimeAgo`,
   `formatDateLocalized`, `formatHijriDateLocalized` and `footerFor` - every return
   path's composed string passes through `localiseDigits`; wrap each return, no
   control-flow refactor (`formatTime` has six returns, `formatTimeAgo` four,
   `footerFor` three - each wrapped). The Hijri Intl call stays pinned `en-US` (it
   yields Latin digits the map then converts; the shape and order never change).
   `pad2` and `adjustTime` stay pure Latin (their output flows through the callers'
   localisation; stored keys stay Latin by construction). Each wrapped value is stored
   in a `const` before returning (the repo's no-nested-calls rule).

## Green run

New and extended suites pass; `yarn validate` passes; `yarn test:tz` green in four zones (this step touches `shared/time.ts`); `npx tsc --noEmit` and `npx biome check . --error-on-warnings` exit 0.

## Break script

Copy `shared/i18n/digits.ts` to `$TMPDIR`; `sed -i '' "s/currentLocaleId() === 'ar'/false/" shared/i18n/digits.ts`; run `npx jest shared/__tests__/digits.test.ts --watchman=false --selectProjects=unit`, expect the ar mapping test to fail with the Latin string shown; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(i18n): localiseDigits core, the six shared formatters render native digits in ar`.

## Review checklist

- The map covers exactly ten glyphs; nothing else transliterates.
- en, ms, so, hi, th bytes identical to 2.0.49 (the suites prove it).
- No formatter parses its own localised output.

## Merge

`git checkout uat && git merge --no-ff feat/57-01-digit-core -m "Merge feat/57-01-digit-core into uat: job 57 step 01"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 1`.
