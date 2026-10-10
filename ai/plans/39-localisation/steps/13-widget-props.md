# Step 13: widget props v6 - ids, tolerance, baked strings

The widget prop contracts carry `id`; both version constants bump (`WIDGET_PROPS_VERSION`
5 to 6, `ANDROID_SNAPSHOT_VERSION` 1 to 2); layouts tolerate entries written by older app
versions; React keys off `id ?? name`; every string the Android layout computes at render
time becomes a prop; the `props != null` guard is fixed; the closure test walks all three
lock layouts.

Requirements: R8.1

- Branch: `feat/38-13-widgets`
- Anchors: `widget-versions`, `widget-row-name`, `widget-next-name`, `widget-android-row`,
  `widget-guard`, `widget-eyebrow`, `widget-rowkey`, `widget-units`, `widget-dateparse`,
  `timeline-names`, `timeline-next` (both timeline anchors hold pre-step-06 text; the name
  sites read `prayerLabel(prayer.id)` by the time this step runs)
- Files: `shared/widgetTypes.ts`, `shared/widgetTimeline.ts`, `stores/widget.ts`,
  `widgets/PrayerWidget.tsx`, `widgets/LockPrayerWidget.tsx`,
  `shared/__tests__/widgetContract.test.ts`, `widgetTimeline.test.ts`, `widgetSimulation.test.ts`,
  `widgetSnapshot.test.ts`, `widgetRenderer.test.ts`, `widgetLockRenderer.test.ts`,
  `stores/__tests__/widgetSettingsSync.test.ts`, `widgetAndroid.test.ts`

## Contracts

1. `WidgetPrayerRow` and `AndroidWidgetDayRow` gain `id: PrayerId` beside `name`; `name`
   stays (renderers draw it; the app bakes `prayerLabel(id)` into it - byte-identical today).
2. Both version constants bump. Layouts read `props.v` and tolerate v5/v1 entries: an entry
   without `id` renders with `name` alone (the `id ?? name` key and every `id`-dependent
   branch guards on presence).
3. The renderer fixes: rows key by `row.id ?? row.name` (`widget-rowkey`); the eyebrow's
   `.toUpperCase()` stays on the baked `name` (it is a display prop, not an id); the
   render-time unit suffixes (`h`/`m`/`s`, `now`) and any stale/neutral card string the
   Android layout computes (`widget-units`) become baked props on
   `PrayerWidgetAndroidProps` (`strings: WidgetStrings` with the same fields as
   `DurationLabels` plus the neutral-card line), resolved in `shared/widgetTimeline.ts` from
   `t()` - byte-identical English today; the null-props card keeps its literals (English is
   the only language; row 39 rules its fate).
4. The guard fix (`widget-guard`): `props !== null && 'days' in props` becomes
   `props != null && 'days' in props` (undefined props no longer throw on the `in` check).
5. `widgetContract.test.ts` (the AST closure gate): the walk covers all three lock layouts,
   not the first; the payload guard re-runs with `id` present (a widget body that imports
   from `@/shared/i18n` still fails rule 1 - the layouts gain no import; `strings` is a prop).
6. `stores/widget.ts`: no change beyond what the version bump's tolerance requires; the
   settings sync does not carry language in stage one.

## Red

1. `widgetTimeline.test.ts`: `it('bakes the id and the label into every row and entry')` -
   entries carry `id` and `name` equal to `prayerLabel(id)`. Fails today (no `id`).
2. `widgetContract.test.ts`: `it('walks the closure of all three lock layouts')` - extend the
   walk; today it covers one (claude defect 3), so the assertion that layouts two and three
   hold no free identifier fails once the walk reaches them - record the first failing
   identifier in LOG.md; if none fails, the fix is still the walk itself and the test pins
   it against regression.
3. `widgetRenderer.test.ts`: `it('renders unit suffixes from props, never from the layout')` -
   drive the Android medium composition with `strings` carrying sentinel labels; assert the
   sentinel renders. Fails today (no `strings` field).

## Break script

1. Key rows by `name` alone. The v6 payload test with two same-named rows (a future-locale
   collision fixture) fails to distinguish them. Restore.
2. Revert the guard to `props !== null`. A renderer call with `undefined` props throws where
   the suite pins tolerance (add the exact call to the renderer suite in this step). Restore.
3. Drop the `v` tolerance branch for v5 entries. The tolerance test (an entry object without
   `id`) fails. Restore. End `ALL AS EXPECTED: 1`.

## Version and commit

`<VERSION> - feat(i18n): widget props v6: ids, tolerance, baked strings, guard fix`

## Review checklist

The widget layouts hold no new import (the closure gate proves it). Old entries render (the
tolerance tests prove it). No pixel moves: the baked strings are today's bytes. Shipped
classes: Residue (the `strings` field is read by both platforms' renderers), Rule (no
substituted time or name).

## Done when

All named suites green, closure walk green over all layouts, break `ALL AS EXPECTED: 1`, hook
lines as step 01, merged `--no-ff`.

## Restore

`git checkout --` each changed file and suite.
