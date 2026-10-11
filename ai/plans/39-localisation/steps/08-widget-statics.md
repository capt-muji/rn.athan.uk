# Step 08: the widget neutral card reads the device locale

**Requirements:** R7.2
Weight: 2
**Anchors:** `widget-android-neutral`, `lock-layout-countdown`, `lock-layout-centred`, `lock-layout-stacked`, `patch-file-head`, `ios-runtime-context`, `android-runtime-global`.

## Goal

A widget with absent props (first-ever placement) or stale data draws its card from a
static six-language table keyed by the device locale the widget process itself reads
(D44), through one new global the runtime patch installs on both platforms.

## Branch

`feat/39-08-widget-statics` off `uat`.

## Files

- `patches/expo-widgets+58.0.14.patch` (extended), `node_modules/expo-widgets/ios/Widgets/WidgetsJSRuntime.swift` and `node_modules/expo-widgets/android/src/main/cpp/WidgetsHermesRuntime.cpp` (edited live, then `npx patch-package expo-widgets` rewrites the patch file)
- `widgets/PrayerWidget.tsx`, `widgets/LockPrayerWidget.tsx` (the inline tables and resolvers)
- tests: `shared/__tests__/widgetStaticStrings.test.ts` (new), the widget contract closure walk

## Red tests

1. `widgetStaticStrings.test.ts`: it reads `catalogs/widget-statics.json` from the plan folder and asserts each landed inline table (extracted by rendering each neutral site with a forced `__expoWidgetDeviceLocale`) matches its locale's row byte-identically; an unknown locale renders the en row - fails today (inline English literals).
2. The contract suite: every neutral and stale literal site in `PrayerWidget.tsx` and `LockPrayerWidget.tsx` resolves through its local table (asserted by rendering each layout with absent props under `ar` and checking the ar row's bytes; the closure walk covers all three lock layouts) - fails today (inline literals).

## Change contracts

1. The runtime patch (extend the existing patch file; never a second file for the same package):
   - iOS, `WidgetsJSRuntime.swift`, inside `getContext()` immediately after `context.evaluateScript(script)` succeeds: `context.setObject(Locale.current.language.languageCode ?? "en", forKey: "__expoWidgetDeviceLocale")`.
   - Android, `WidgetsHermesRuntime.cpp`, beside the `__expoWidgetLayout` property installation: install `__expoWidgetDeviceLocale` as a `jsi::String` sourced from the locale string the Kotlin host passes in (the existing Kotlin entry that owns the render call gains one field read from `LocaleList.getDefault().get(0).getLanguage()`, plumbed to the runtime through the same path that carries the layout cache; the anchors quote both ends).
   - Nothing else changes in the package. Apply by editing the two node_modules files, run `npx patch-package expo-widgets`, verify the patch file grew by exactly the hunks above.
2. The static table lands INLINE inside each widget body that renders a neutral or stale card. The serialization law (`widgets/LockPrayerWidget.tsx:39-41`: the `'widget'` directive serializes the body alone, so all helpers live inside each function, and repo-local value imports cannot close over) forbids both a shared helper file and cross-function helpers. The table's bytes come from `catalogs/widget-statics.json` verbatim: seven fields (`subtitle`, `inline`, `rectTitle`, `rectSubtitle`, `staleTitle`, `staleBody`, `staleInline`; the brand title is the constant `Athan`, never a field) times six locales, defined as a local `const STATIC = { en: {...}, ar: {...}, ... }` inside each of the bodies that needs it, with a local resolver reading `(globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale`, matching the language code by prefix, and falling back to the `en` row. The duplication across bodies is the law's price; the bytes are identical everywhere.
3. `widgets/PrayerWidget.tsx`: the Android neutral (`ANeutral`), the iOS neutral card site, the catch fallback, and the iOS stale card (the `>Out of date<` region with its `Open Athan to refresh` / `Open Athan` / `to refresh` lines) each gain the local table and resolver, replacing their English literals. The catalog-driven `widget.stale` / `widget.refresh*` keys that the app bakes into live props are unchanged (that path already localizes through step 02's catalogs).
4. `widgets/LockPrayerWidget.tsx`: each of the three layout functions' `neutralForFamily` body (and each layout's stale sites, where present) carries its own local table and resolver, replacing the `Athan - prayer times`, `ATHAN`, `Open to load times`, `Out of date` and `Open app to refresh` literals. No helper crosses a body boundary.

## Green run

New suites pass; the closure walk covers all layouts; `npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit` passes (the patch touched the package); `yarn validate` passes.

## Break script

Copy `widgets/PrayerWidget.tsx` to `$TMPDIR`; in one resolver, change the fallback row from en to ar by exact-text edit; run `widgetStaticStrings.test.ts`'s unknown-locale case, expect the en-row assertion to fail; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): widget neutral cards read the device locale through the runtime patch`.

## Review checklist

- The patch carries exactly the two hunks; no behavior change beyond the global.
- Every table lives inside a widget body; no repo-local value import was added to any widget module.
- Every table's bytes equal `catalogs/widget-statics.json`.

## Merge

`git checkout uat && git merge --no-ff feat/39-08-widget-statics -m "Merge feat/39-08-widget-statics into uat: job 39 step 08"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 8`.
