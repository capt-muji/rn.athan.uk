# Step 07: widget props v7 carry structured date parts

**Requirements:** R7.1
Weight: 2
**Anchors:** `widget-versions`, `widget-android-footer`, `widget-ios-footer`, `widget-date-label`.

## Goal

Widget timelines carry the localized weekday and day number as structured props, the two
English-shape parsers stop being the primary path, and v6 entries keep rendering.

## Branch

`feat/39-07-widget-v7` off `uat`.

## Files

- `shared/widgetTypes.ts`, `shared/widgetTimeline.ts`, `widgets/PrayerWidget.tsx`
- tests: the widget contract, simulation and renderer suites

## Red tests

1. The widget contract suite: a v7 iOS entry and a v7 Android snapshot day carry `footer: string` populated from the active catalog at push time - fails today (no v7, no field).
2. The renderer suite: the Android footer and the iOS footer render the `footer` prop verbatim when present, byte-identical to today's parsed output under en (`Sun`, `Rab 30` shapes) - fails today.
3. The tolerance suite: a v6 entry (absent `footer`) still renders through the legacy parse - passes today and must keep passing (regression guard, written now).

## Change contracts

1. `shared/widgetTypes.ts`: `WIDGET_PROPS_VERSION` 6 to 7. The iOS entry type gains `footer: string` (precomposed, localized) and the Android day type `AndroidWidgetDay` gains `footer: string`, both OPTIONAL (absent on v6/v2-era entries, present on v7 writes); `ANDROID_SNAPSHOT_VERSION` 2 to 3 with the same optionality rule. The tolerance helpers (`schedule`/`theme`/`prayers` optional) are the pattern; `footer` joins them.
2. `shared/widgetTimeline.ts`: every push site that writes `dateLabel` (iOS entries, the stale entry, the Android snapshot days) also writes `footer`, composed by a `footerFor` helper in `shared/time.ts` so widget and app cannot drift: for the Gregorian label the footer is the short weekday alone (`Sun`), for the Hijri label the month's first three graphemes plus the day (`Rab 30`), reproducing today's parsed English bytes exactly in en and localizing cleanly elsewhere.
3. `widgets/PrayerWidget.tsx`: both footers prefer `footer` and fall back to the existing parse when it is absent. The parse code is not deleted (it serves old entries); a one-line comment on each states why it stays (v6 tolerance).

## Green run

The three suites pass; the closure walk covers all layouts; `yarn validate` passes.

## Break script

Copy `shared/time.ts` to `$TMPDIR`; `sed -i '' "s/return \\`${t('calendar.weekdayShort/return \\`${'XX'}/" shared/time.ts` or the nearest exact-text equivalent that corrupts the footer composition; run the contract suite, expect the v7 population failure; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): widget props v7 with structured localized date parts, v6 tolerated`.

## Review checklist

- Old entries render (the v6 guard passes without edits to its fixtures).
- `footerFor` in `shared/time.ts` is the single source; no widget composes its own footer.
- Version constants moved exactly 6 to 7 and 2 to 3.

## Merge

`git checkout uat && git merge --no-ff feat/39-07-widget-v7 -m "Merge feat/39-07-widget-v7 into uat: job 39 step 07"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 7`.
