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
- `widgets/widgetStaticStrings.ts` (new), `widgets/PrayerWidget.tsx`, `widgets/LockPrayerWidget.tsx`
- tests: `shared/__tests__/widgetStaticStrings.test.ts` (new), the widget contract closure walk

## Red tests

1. `widgetStaticStrings.test.ts`: the table holds all six locales with the seven fields of `catalogs/widget-statics.json` byte-identical, and `resolveStaticStrings('ar')` returns the ar row while an unknown locale falls back to en — fails on the absent module.
2. The contract suite: every neutral and stale literal site in `PrayerWidget.tsx` and `LockPrayerWidget.tsx` resolves through the table (asserted by rendering each layout with absent props and checking the en row's bytes; the closure walk extends to all three lock layouts reading the shared module) — fails today (inline literals).

## Change contracts

1. The runtime patch (extend the existing patch file; never a second file for the same package):
   - iOS, `WidgetsJSRuntime.swift`, inside `getContext()` immediately after `context.evaluateScript(script)` succeeds: `context.setObject(Locale.current.language.languageCode ?? "en", forKey: "__expoWidgetDeviceLocale")`.
   - Android, `WidgetsHermesRuntime.cpp`, beside the `__expoWidgetLayout` property installation: install `__expoWidgetDeviceLocale` as a `jsi::String` sourced from the locale string the Kotlin host passes in (the existing Kotlin entry that owns the render call gains one field read from `LocaleList.getDefault().get(0).getLanguage()`, plumbed to the runtime through the same path that carries the layout cache; the anchors quote both ends).
   - Nothing else changes in the package. Apply by editing the two node_modules files, run `npx patch-package expo-widgets`, verify the patch file grew by exactly the hunks above.
2. `widgets/widgetStaticStrings.ts`: `export interface WidgetStaticStrings { title: string; subtitle: string; inline: string; rectTitle: string; rectSubtitle: string; staleTitle: string; staleBody: string; staleInline: string }` — wait, seven fields per `catalogs/widget-statics.json`: subtitle, inline, rectTitle, rectSubtitle, staleTitle, staleBody, staleInline (title is the brand `Athan`, constant). `export const WIDGET_STATIC_STRINGS: Record<LocaleId, WidgetStaticStrings>` holds the six rows byte-identical to the plan JSON. `export const resolveStaticStrings = (): WidgetStaticStrings` reads `` (globalThis as { __expoWidgetDeviceLocale?: string }).__expoWidgetDeviceLocale ``, maps it through the six ids (prefix match on the language code), falls back to the en row. Statically imported by the widget modules (closure law: imports are static, values are module constants).
3. `widgets/PrayerWidget.tsx` and `widgets/LockPrayerWidget.tsx`: every inline neutral/stale literal (the home neutral's title/subtitle, the catch fallback, and the three lock layouts' neutral and stale blocks) resolves through `resolveStaticStrings()`. The three identical neutral blocks in the lock widget collapse into one shared helper in the same file (the same logic appears three times; extraction is the fix), used by all three layout functions.

## Green run

New suites pass; the closure walk covers all layouts; `npx jest shared/__tests__/widgetRuntimeLoads.test.ts --watchman=false --selectProjects=unit` passes (the patch touched the package); `yarn validate` passes.

## Break script

Copy `widgets/widgetStaticStrings.ts` to `$TMPDIR`; `sed -i '' "s/return ROWS[locale] ?? ROWS.en;/return ROWS.en;/" widgets/widgetStaticStrings.ts` (or the exact-text equivalent disabling the lookup); run the fallback test (unknown locale must reach en via the resolver — pick the assertion that a resolved `ar` row differs from en), expect the failure; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): widget neutral cards read the device locale through the runtime patch`.

## Review checklist

- The patch carries exactly the two hunks; no behavior change beyond the global.
- The three lock layouts share one neutral helper; no other refactor.
- The table bytes equal `catalogs/widget-statics.json`.

## Merge

`git checkout uat && git merge --no-ff feat/39-08-widget-statics -m "Merge feat/39-08-widget-statics into uat: job 39 step 08"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 8`.
