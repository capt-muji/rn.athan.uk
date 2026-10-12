# Step 03b: the shown time and every widget time bake

**Requirements:** R1.1, R1.2, R4.1, R6.1
Weight: 2
**Anchors:** `useprayer-getshown`, `widget-daylist-time`, `widget-next-time`, `widget-stale-time`, `widget-android-time`.

## Goal

The two digit edges the census mislabeled: the list's main rows draw their time
straight from the stored `HH:mm` string, and the widget builders bake raw
`prayer.time`. Both wrap through `localiseDigits` so ar draws native digits on
the list and on every widget time, with the stored values, epochs and en bytes
untouched.

## Branch

`feat/57-03b-shown-and-widget-bakes` off `uat`.

## Files

- `hooks/usePrayer.ts`, `shared/widgetTimeline.ts`
- tests: the `Time.test.tsx` and `widgetSimulation.test.ts` extensions and the
  `widgetTimeline.test.ts` extension named below

## Red tests

1. `Time.test.tsx` extension: render the Suhoor and Duha rows on Friday
   11 September 2026 at 14:00 with the Fajr-only readable fixture under
   `setActiveLocale('ar')` (restore `'en'` in a `finally`): Suhoor shows
   `'٠٦:٤٦'`, the unread row still shows `'--:--'` - fails today showing
   `'06:46'`.
2. `widgetSimulation.test.ts` extension: build the timeline at the pushed
   instant under ar, take the entry active after 19:00 on 2026-10-20:
   `nextName` is `'العشاء'`, `nextTime` is `'٠١:٠٥'`, `dateLabel` composes from
   the ar catalog - fails today showing `'01:05'`.
3. `widgetTimeline.test.ts` extension: under ar on the 2026-06-15 two-day
   fixture, the first entry's `nextTime` is `'١٧:٤٥'`, its day rows contain
   `'٠٣:٣٠'`, the stale entry's `nextTime` is `'٢٢:٤٥'`, and the Android
   snapshot's day-row times contain `'١٣:١٠'` and never `'13:10'` - fails today
   showing `'17:45'`.

The three twins above are the defect twins from the stopped step-04 sweep,
preserved verbatim at `$HOME/athan-gitree/sessions/57/step04-stopped.patch`
(files `Time.test.tsx` and `widgetSimulation.test.ts`) and this step's proof.
Apply those two hunks from the patch; write the third from this file.

## Change contracts

1. `hooks/usePrayer.ts`: the import block gains
   `import { localiseDigits } from '@/shared/i18n';` sorted between the
   `@/shared/constants` and `@/shared/sequence` imports. `getShownTime` keeps
   its signature and null semantics; its body becomes:

   ```
   const shown = isSelectedForOverlay && row.isPassed ? nextOccurrence.time : row.time;
   const localised = shown === null ? null : localiseDigits(shown);
   return localised;
   ```

   The `ShownRow.time` fields and every caller's stored comparison stay
   Latin; `isShownOccurrenceUnavailable` keeps its `=== null` behaviour
   unchanged.
2. `shared/widgetTimeline.ts`: the import from `@/shared/i18n` gains
   `localiseDigits`. Four bakes wrap, each the only change on its line:
   `buildDayList`'s row bakes `time: localiseDigits(prayer.time ?? UNAVAILABLE_TIME)`,
   the timeline entry bakes `nextTime: localiseDigits(next.time)`, the stale
   entry bakes `nextTime: localiseDigits(finalPrayer.time)`, and the Android
   snapshot's readable row bakes `time: localiseDigits(prayer.time)`. The
   Android unreadable row keeps the bare `UNAVAILABLE_TIME` (no digits to
   map). No epoch field, schema version (`WIDGET_PROPS_VERSION`,
   `ANDROID_SNAPSHOT_VERSION`), props key or numeric value changes: the props
   shape is unchanged, only string content follows the active locale.
   `widgetTimeline.ts` sits app-side of the widget closure (only
   `stores/widget.ts` imports it; no widget module imports it), so this static
   import breaks no closure walk: D61's inline-map law governs only
   `widgets/PrayerWidget.tsx`.

## Green run

The three extended suites pass; `shared/__tests__/widgetSnapshot.test.ts`,
`shared/__tests__/widgetContract.test.ts` and `hooks/__tests__/usePrayer.test.ts`
pass unchanged; `yarn validate` passes; `npx tsc --noEmit` and
`npx biome check . --error-on-warnings` exit 0. `yarn test:tz` is not required:
the step wraps rendered strings only and touches no date arithmetic.

## Break script

Copy `hooks/usePrayer.ts` and `shared/widgetTimeline.ts` to `$TMPDIR`. Run
`sed -i '' 's/localiseDigits(shown)/shown/' hooks/usePrayer.ts` and
`sed -i '' -e 's/localiseDigits(prayer.time ?? UNAVAILABLE_TIME)/(prayer.time ?? UNAVAILABLE_TIME)/' -e 's/localiseDigits(next.time)/next.time/' -e 's/localiseDigits(finalPrayer.time)/finalPrayer.time/' -e 's/localiseDigits(prayer.time)/prayer.time/' shared/widgetTimeline.ts`.
Run `npx jest shared/__tests__/widgetTimeline.test.ts --watchman=false --selectProjects=unit`,
expect 1 failed with `Expected "١٧:٤٥"` and `Received "17:45"` shown; run
`npx jest components/prayer/__tests__/Time.test.tsx --watchman=false --selectProjects=components`,
expect 1 failed with `06:46` shown. Restore both files, rerun both suites,
expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(i18n): the list's shown time and every widget time bake render native digits in ar`.

## Review checklist

- Stored values stay Latin: no `Prayer.time`, `next.time` or `row.time` field
  is rewritten, only the rendered and baked copies wrap.
- The unread sentinel renders `'--:--'` in every locale (the twin pins it).
- No props schema, version or epoch value changed.
- en, ms, so, hi, th bytes identical (the pinning suites prove it).

## Merge

`git checkout uat && git merge --no-ff feat/57-03b-shown-and-widget-bakes -m "Merge feat/57-03b-shown-and-widget-bakes into uat: job 57 step 03b"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 3b`.
