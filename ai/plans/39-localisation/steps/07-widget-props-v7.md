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

1. The widget contract suite: a v7 iOS entry and a v7 Android snapshot carry `dateParts: { weekday: string; day: string }` populated from the active catalog at push time — fails today (no v7, no field).
2. The renderer suite: the Android footer and the iOS footer render `dateParts.weekday + ' ' + dateParts.day` when present — fails today.
3. The tolerance suite: a v6 entry (absent `dateParts`) still renders through the legacy parse — passes today and must keep passing (regression guard, written now).

## Change contracts

1. `shared/widgetTypes.ts`: `WIDGET_PROPS_VERSION` 6 to 7. The iOS entry type and the Android snapshot type gain `dateParts: { weekday: string; day: string }` as OPTIONAL (absent on v6/v2-era entries, present on v7 writes); `ANDROID_SNAPSHOT_VERSION` 2 to 3 with the same optionality rule. The tolerance helpers (`schedule`/`theme`/`prayers` optional) are the pattern; `dateParts` joins them.
2. `shared/widgetTimeline.ts`: every push site that writes `dateLabel` (iOS entries, the stale entry, the Android snapshot days) also writes `dateParts` with the localized short weekday and the day number — derived in `formatDateLocalized`'s composition (export a `datePartsFor(date: string): { weekday: string; day: string }` from `shared/time.ts` in this step so widget and app cannot drift).
3. `widgets/PrayerWidget.tsx`: both footers prefer `dateParts` and fall back to the existing parse when it is absent. The parse code is not deleted (it serves old entries); a one-line comment on each states why it stays (v6 tolerance).

## Green run

The three suites pass; the closure walk covers all layouts; `yarn validate` passes.

## Break script

Copy `shared/widgetTimeline.ts` to `$TMPDIR`; `sed -i '' "s/dateParts: datePartsFor(/dateParts: { weekday: 'XX', day: '00' } as never, \/\/ x/" shared/widgetTimeline.ts` or the nearest exact-text equivalent that corrupts one push site; run the contract suite, expect the v7 population failure; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): widget props v7 with structured localized date parts, v6 tolerated`.

## Review checklist

- Old entries render (the v6 guard passes without edits to its fixtures).
- `datePartsFor` is the single source; no widget composes its own weekday.
- Version constants moved exactly 6→7 and 2→3.

## Merge

`git checkout uat && git merge --no-ff feat/39-07-widget-v7 -m "Merge feat/39-07-widget-v7 into uat: job 39 step 07"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 7`.
