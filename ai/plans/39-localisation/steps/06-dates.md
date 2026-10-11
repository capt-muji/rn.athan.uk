# Step 06: catalog-composed dates

**Requirements:** R6.1, R6.2
Weight: 2
**Anchors:** `format-date-long`, `format-hijri-long`, `shown-date-format`, `widget-date-label`.

## Goal

Date labels compose from the active catalog's calendar keys in the English shape and
order; en output is byte-identical to today's date-fns and Intl output; Hijri carries no
era affix and Latin digits in every locale.

## Branch

`feat/39-06-dates` off `uat`.

## Files

- `shared/time.ts`, `components/day/shownDate.ts`, `shared/widgetTimeline.ts`
- tests: `shared/__tests__/dateLocalized.test.ts` (new), the `Day` and widgetTimeline suites, `yarn test:tz`, and the five converting suites named in contract 1

## Red tests

1. `dateLocalized.test.ts`: for every day of 2026, `formatDateLocalized(dateString)` equals `format(new Date(...), 'EEE, d MMM yyyy')` under en - fails on the absent function.
2. Same suite: under `ar`, `formatDateLocalized('2026-10-11')` is `الأحد, 11 أكتوبر 2026` (the en shape with catalog names; the exact value asserted from the landed ar catalog) - fails.
3. Same suite: `formatHijriDateLocalized` under en equals today's `formatHijriDateLong` output for ten fixture dates including a Ramadan 1st and a Dhul-Hijjah 10th, with no ` AH` suffix - fails on the absent function.
4. Same suite: under `th`, the Hijri label uses the Thai catalog month with Latin digits and no era - fails.

## Change contracts

1. `shared/time.ts`: `export const formatDateLocalized = (date: string): string` - parse `date` exactly as `formatDateLong` does; compose `` `${t('calendar.weekdayShort.' + isoWeekday)}, ${day} ${t('calendar.monthShort.' + month)} ${year}` `` with `isoWeekday` the ISO number (Monday 1 to Sunday 7). `export const formatHijriDateLocalized = (date: string): string` - the existing `en-US-u-ca-islamic-umalqura` Intl call with `{ day: 'numeric', month: 'numeric', year: 'numeric', timeZone: PRAYER_TIMEZONE }` (numeric month to keep Latin digits and no era), then compose `` `${t('calendar.hijri.' + hijriMonth)} ${hijriDay}, ${hijriYear}` `` - month first, then day, then comma, then year, matching today's measured en output (`Rabiʻ II 30, 1448` shape); the catch falls back to `formatDateLocalized` exactly as the current catch falls back to `formatDateLong`. The old `formatDateLong` and `formatHijriDateLong` are deleted. Five suites import the deleted pair today and convert to the localized pair in this step: `shared/__tests__/time.test.ts` (two describe blocks), `shared/__tests__/widgetSimulation.test.ts`, `shared/__tests__/widgetSnapshot.test.ts`, `shared/__tests__/widgetTimeline.test.ts`, `stores/__tests__/widgetSettingsSync.test.ts`.
2. `components/day/shownDate.ts` and `shared/widgetTimeline.ts`: every call site switches from the deleted pair to the localized pair. No format decisions live outside `shared/time.ts`.

## Green run

New suite passes; the `Day` and widget suites pass (en values unchanged); `yarn test:tz` passes; `yarn validate` passes.

## Break script

Copy `shared/time.ts` to `$TMPDIR`; `sed -i '' "s/', \${day} /', \${day}x/" shared/time.ts` (shape corruption); run test 1 over 2026, expect failures; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): dates compose from calendar catalog keys, en byte-parity held`.

## Review checklist

- No format string, order, or numeral decision outside the two functions.
- Hijri digits Latin in every locale, era stripped.
- `grep -rn "formatDateLong\|formatHijriDateLong"` returns nothing outside git history.

## Merge

`git checkout uat && git merge --no-ff feat/39-06-dates -m "Merge feat/39-06-dates into uat: job 39 step 06"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 6`.
