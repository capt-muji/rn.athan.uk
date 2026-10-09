# R8. First-run language selection (research agent report, 2026-10-09)

Dispatched by the owner's instruction; citations as marked. Full report, lightly formatted.

## Findings

### 1. expo-localization at SDK 58

- **Version line**: docs at SDK 58 recommend `~58.0.3` (docs.expo.dev/versions/v58.0.0/sdk/localization); the npm registry dist-tags show `next: 58.0.4` and `latest: 57.0.2` (registry.npmjs.org/expo-localization), matching "next = 58.x".
- **Exact API**: the SDK 58 module exports exactly four functions plus types, confirmed from source on the `sdk-58` branch (raw.githubusercontent.com/expo/expo/sdk-58/packages/expo-localization/src/Localization.ts):
  - `getLocales()` / `useLocales()` - ordered list of user locales (`Locale[]`, at least one), "returned in the order the user defines in their device settings"; each `Locale` carries `languageTag` (`"pl-PL"`), `languageCode` (`"pl"`), `regionCode`, `languageScriptCode`, `textDirection` (`'ltr' | 'rtl'`), `currencyCode`, `measurementSystem`, `temperatureUnit`, separators.
  - `getCalendars()` / `useCalendars()` - `Calendar[]` with `calendar` (Unicode type, incl. `islamic` variants), `timeZone`, `uses24hourClock`, `firstWeekday`.
  - On Android, locales can change in Settings without an app restart, so the docs advise re-running `getLocales()` on every `AppState` foreground return (docs.expo.dev/versions/v58.0.0/sdk/localization/).
- **No permission**: confirmed. The entire SDK 58 page contains no permission requirement for any API, and no OS locale permission exists to request. The Expo localization guide's canonical usage is a bare call with no permission setup: `const deviceLanguage = getLocales()[0].languageCode;` (docs.expo.dev/guides/localization).
- **Locale-matching helper**: none at 58.x. The module ships no matcher; the export surface is only the four functions above. Matching device locales to a shipped set is the app's own job. The config plugin's `supportedLocales` exists for a different purpose: "used to enable per-app language selection in the system settings" (SDK 58 docs).

### 2. RFC 4647 basic filtering and lookup, applied

RFC 4647 defines matching between the user's ordered **language priority list** (device locales, here `id-ID, ms-MY, ar-EG, en-GB`) and a set of **language tags** (the shipped set S = `[en, ar, id, ms, tr]`). **Basic filtering** (section 3.3.1) returns the subset of tags a range matches: a range matches a tag if it case-insensitively equals the tag or a prefix of it ending right before a `"-"` (rfc-editor.org/rfc/rfc4647.txt). **Lookup** (section 3.4) is the better fit for picking one display language: walk the priority list in order, and for each range truncate subtags from the end until a tag matches, returning the first hit, else a defined default (rfc-editor.org/rfc/rfc4647.txt). In practice: `id-ID` resolves to shipped `id`, `ms-MY` to `ms`, `ar-EG` to `ar`, `en-GB` truncates to `en`, and anything unmatched falls through to the default `en`.

### 3. What the stores actually control

- **App Store**: "App Store localizations" are listing metadata only. Apple's per-country table governs which *listing* a storefront shows, and "The language displayed to users may vary based on their device and system settings" (developer.apple.com/help/app-store-connect/reference/app-information/app-store-localizations).
- **Google Play**: translations cover "your app's store listing page, app strings or in-app products" that you add yourself; country-differentiated listings require separate custom store listings (support.google.com/googleplay/android-developer/answer/9844778).
- **Confirmed: nothing is injected into the binary.** Neither store sets an in-app default language per country at install. The OS itself resolves the app language with no store input: iOS matches the user's ordered preferred-languages list against the app's declared localizations, falling back to `CFBundleDevelopmentRegion`, per Apple QA1828 (developer.apple.com/library/archive/qa/qa1828); Android resolves from the system/app locale list (developer.android.com/guide/topics/resources/app-languages).

### 4. OS per-app language overrides

- **Android 13+ (API 33)**: system Settings gains a per-app language picker, plus `LocaleManager.setApplicationLocales`/`getApplicationLocales`. Google explicitly tells apps that already have an in-app picker to migrate onto these APIs, including calling `setApplicationLocales` on first run to sync a pre-existing choice (developer.android.com/guide/topics/resources/app-languages).
- **Android 9 floor**: per-app language settings do not exist below Android 13; the AndroidX backport works only through `AppCompatActivity` contexts on API 32 and earlier, which a React Native app does not use. On Android 9 the only OS-level signal is the device's system locale list, which `getLocales()` already reads.
- **iOS**: the per-app language row (Settings, since iOS 13) appears only for apps that declare multiple localizations, via `.lproj` folders or `CFBundleLocalizations` (developer.apple.com/documentation/bundleresources/information-property-list/cfbundlelocalizations); QA1828 confirms the fallback order. The expo-localization `supportedLocales` config-plugin prop generates exactly these declarations.
- **Should an app with its own picker ignore the OS setting?** Second-best. The Expo guide's own guidance is that per-app OS settings make custom pickers usually unnecessary, and where pickers exist they should not fight the OS (docs.expo.dev/guides/localization); Google says the same for Android. The cheap way to honor the OS setting is structural: whenever the user has made no explicit in-app choice, re-derive the language from `getLocales()` on every launch; on both platforms the app-visible locale list already reflects any OS per-app override, so it is honored for free.

### 5. Comparable apps

- **Muslim Pro**: documents an in-app picker (Settings > App settings > Language), and its support article frames surprise language changes as caused by "your device or system settings" (support.muslimpro.com/help/en/articles/how-to-change-language-settings-in-app).
- **Athan by IslamicFinder**: documents an in-app language switch (Settings > Language) in App Store release notes.
- **Honest gap**: neither app documents its first-run default in a citable public source. Muslim Pro's wording is the closest evidence and points to device-locale default.

## Recommended first-run algorithm

State: a persisted `languageChoice` (null until the user picks in-app) plus a `languageChoiceVersion` marker. Shipped set S, default `en`.

1. **Launch resolution order**: if `languageChoice` is non-null, use it. Otherwise run RFC 4647 lookup over `getLocales()` against S: for each device locale in the user's order, try the full tag, then truncate (`en-GB` to `en`, `ar-EG` to `ar`); first hit wins; no hit falls back to `en`. Re-run on every launch and on Android foreground-return while `languageChoice` is null. This honors OS per-app overrides on iOS 13+ and Android 13+ with zero extra code.
2. **In-app picker**: sets `languageChoice` and stamps `languageChoiceVersion`. Declaring `supportedLocales` in the expo-localization config plugin makes the OS per-app settings appear and stay consistent; optionally write through to `setApplicationLocales` on API 33+ later.
3. **Fresh install**: no storage, `languageChoice` null, device-locale matching decides. No prompt, no permission.
4. **Existing English installs upgrading**: storage exists but has no `languageChoice`. On upgrade, stamp `languageChoice = "en"` explicitly rather than re-matching the device locale. A pre-v2.0 user's device locale was never a vote for a language.
5. **Android 9 floor**: no per-app OS setting exists to read or honor; the algorithm is already complete there.
6. **Store listings**: localize listing metadata per country to match S for conversion, and treat it as metadata only.
