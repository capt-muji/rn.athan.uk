# Step 09: native strings from committed config

**Requirements:** R7.3, R8.1, R8.2
Weight: 2
**Anchors:** `appjson-infoplist`, `appjson-plugins-head`.

## Goal

Permission purposes, widget gallery names and the locale declarations reproduce from
`app.json` on every prebuild (the native folders are gitignored and regenerate), so an
Arabic-locale phone sees Arabic permission prompts and Arabic gallery names.

## Branch

`feat/39-09-native` off `uat`.

## Files

- `app.json` (`expo.locales`, `ios.infoPlist.CFBundleLocalizations`)
- `plugins/androidLocaleConfig.js` (new, following `plugins/androidWidgetGrid.js`'s shape)
- `app.config.ts` (register the local plugin on the Android path)
- tests: `shared/__tests__/nativeLocalesConfig.test.ts` (new; reads app.json and the plugin output shape)

## Red tests

1. `nativeLocalesConfig.test.ts`: `app.json` carries an `expo.locales` entry per non-en locale with both permission strings and the full gallery map, byte-identical to `catalogs/native-strings.json` — fails today (no `expo.locales`).
2. Same suite: `ios.infoPlist.CFBundleLocalizations` equals the six ids — fails.
3. Same suite: the plugin file exists and its manifest write function produces a `locales_config.xml` with the six entries (unit-test the pure builder by importing it) — fails on the absent plugin.

## Change contracts

1. `app.json` gains `"locales"` under `expo`: for each of ar, ms, so, hi, th an object `{ "NSLocationWhenInUseUsageDescription": ..., "NSUserNotificationsUsageDescription": ..., "ios": { "Localizable.strings": { ...the gallery map... } }, "android": { ...the gallery resource keys... } }`, every value byte-identical to `catalogs/native-strings.json`. The Android keys are the plugin-derived resource names: `prayer_widget_display_name`, `extras_widget_display_name`, `prayer_widget_medium_display_name`, `extras_widget_medium_display_name`, `prayer_widget_dark_display_name`, `extras_widget_dark_display_name`, `prayer_widget_dark_medium_display_name`, `extras_widget_dark_medium_display_name`, `prayer_lock_widget_display_name`, `extras_lock_widget_display_name`, `prayer_lock_widget_2_display_name`, `extras_lock_widget_2_display_name`, `prayer_lock_widget_3_display_name`, `extras_lock_widget_3_display_name`, each with its `_description` twin.
2. `ios.infoPlist` gains `"CFBundleLocalizations": ["en", "ar", "ms", "so", "hi", "th"]`. `CFBundleDisplayName` stays `Athan`.
3. `plugins/androidLocaleConfig.js`: a `withAndroidManifest` + dangerous-mod plugin (the `androidWidgetGrid.js` pattern) writing `android/app/src/main/res/xml/locales_config.xml` with the six locales and adding `android:localeConfig="@xml/locales_config"` to the application tag. Export a pure `buildLocalesConfigXml(locales: string[]): string` so the test imports it. Register it in `app.config.ts` beside `androidWidgetGrid` on the Android path.
4. Verification in a scratch worktree (never the main checkout): `git worktree add --detach $HOME/athan-gitree/worktrees/plan-39-09 uat` (node_modules symlinked), run `npx expo prebuild -p android --no-install` with the widget env vars the build scripts carry, then grep the output for: `res/values-b+ar/strings.xml` existing and holding `prayer_widget_display_name`; `locales_config.xml` present; `AndroidManifest.xml` referencing it; `android:supportsRtl="false"`. Remove the worktree. Do the same for `-p ios` grepping `ios/Athan/Supporting/ar.lproj/InfoPlist.strings` and `ExpoWidgetsTarget` resource registration of `Localizable.strings`. Any miss is a STOP (the config-to-native mapping failed), not a hand edit to generated files.

## Green run

The new suite passes; `yarn validate` passes; the scratch prebuild greps all hit.

## Break script

Copy `app.json` to `$TMPDIR`; delete the `ar` entry from `expo.locales` with an exact-text edit; run the config suite, expect the ar row failure; restore; rerun, expect pass. Ends `ALL AS EXPECTED: 1`.

## Version and commit

Message: `<VERSION> - feat(language): per-locale native strings and locale declarations from committed config`.

## Review checklist

- Every native value traces to `catalogs/native-strings.json`; nothing hand-written into `ios/` or `android/`.
- The gallery keys match the plugin's derived names (spot-check four).
- The scratch worktree is removed.

## Merge

`git checkout uat && git merge --no-ff feat/39-09-native -m "Merge feat/39-09-native into uat: job 39 step 09"`.

## Done when

Checklist ticked; row reads `IN PROGRESS, step 9`.
