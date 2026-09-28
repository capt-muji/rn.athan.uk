# R4: Locale detection, language selection UX, and the top-20 language set

Research report for session 39 (localisation). Answers three questions: what language the app opens in, how the user changes it, and which languages to ship. Every claim carries a source and a date where the source is a living document. Written 2026-09-29.

Method note: research ran through the TinyFish Search and Fetch MCP tools (`tools.tinyfish.search`, `tools.tinyfish.fetch_content`), with `docs-mcp-server` for the indexed Expo SDK 58 documentation. No fetch failures forced a `curl` fallback. One page (npmjs.com package view for `@cospired/i18n-iso-languages`) blocked the fetch bot, and `docs-mcp-server.fetch_url` retrieved it instead.

---

## Part A: What language does the app open in, the first time?

### A.1 The owner's question, restated

> "Should we say English is the primary language, then plus Arabic? Then if the user downloads the app but they don't understand English, are we going to have to ask for their location so that we know which region they're in... For example, if they are in the Philippines, we're going to want to set the language to Tagalog."

The first half is right: the app needs a default and it should be English today. The second half proposes location for language inference. That is the wrong signal, it needs a permission the app has deliberately scoped away from the launch path, and the correct signal costs nothing. The device already tells the app the user's ordered language preferences with no prompt, no permission, and no network.

### A.2 What the device exposes, exactly

**`expo-localization` (SDK 58, recommended `~57.0.1` compatible line).** `getLocales()` returns an ordered array, guaranteed non-empty, in the order the user defined in device settings. The exact `Locale` shape, verbatim from the SDK 58 API reference (docs.expo.dev/versions/v58.0.0/sdk/localization, retrieved 2026-09-29):

```js
[{
  "languageTag": "pl-PL",
  "languageCode": "pl",
  "textDirection": "ltr",
  "digitGroupingSeparator": " ",
  "decimalSeparator": ",",
  "measurementSystem": "metric",
  "currencyCode": "PLN",
  "currencySymbol": "zł",
  "regionCode": "PL",
  "temperatureUnit": "celsius"
}]
```

Full field list from the same reference:

| Field | Type | Notes |
| --- | --- | --- |
| `languageTag` | `string` | Full BCP 47 tag with region, `'en-GB'`, `'es-419'` |
| `languageCode` | `string \| null` | BCP 47 primary subtag |
| `languageScriptCode` | `string \| null` | ISO 15924, `'Latn'`, `'Hans'`; null on Android and web when undefined |
| `regionCode` | `string \| null` | From the Region setting, not from position |
| `languageRegionCode` | `string \| null` | Region for the language (`en-CA` gives `CA`) |
| `textDirection` | `'ltr' \| 'rtl'` | Per locale entry |
| `measurementSystem` | `'metric' \| 'us' \| 'uk' \| null` | Null on web |
| `digitGroupingSeparator` | `string \| null` | |
| `decimalSeparator` | `string \| null` | |
| `currencyCode`, `currencySymbol` | `string \| null` | iOS reads the Region setting, not the language |
| `temperatureUnit` | `'celsius' \| 'fahrenheit' \| null` | |

`getCalendars()` returns the calendar, `timeZone`, `uses24hourClock`, and `firstWeekday`. For a prayer-times app this matters beyond language: `CalendarIdentifier.ISLAMIC_UMALQURA`, `ISLAMIC_CIVIL`, and `PERSIAN` are all in the enum, which is the system's own Hijri machinery if the hijri-date setting ever localises properly (docs.expo.dev/versions/v58.0.0/sdk/localization, 2026-09-29).

Platform behaviour, documented by Expo: "On iOS, the results will remain the same while the app is running. On Android, the user can change locale preferences in Settings without restarting apps", so the guide recommends re-reading `getLocales()` on every `AppState` foreground transition (docs.expo.dev/guides/localization, updated 2026-08-06). iOS resets the app when the system language changes, which makes the same one-shot read correct there.

**`react-native-localize` (zoontek, MIT, 2.4k stars).** `getLocales()` returns a leaner ordered list:

```js
[
  { countryCode: "GB", languageTag: "en-GB", languageCode: "en", isRTL: false },
  { countryCode: "US", languageTag: "en-US", languageCode: "en", isRTL: false },
  { countryCode: "FR", languageTag: "fr-FR", languageCode: "fr", isRTL: false },
]
```

It also ships `findBestLanguageTag(languageTags)`, which walks that ordered list against the app's supported tags and returns `{ languageTag, isRTL }` (github.com/zoontek/react-native-localize README, retrieved 2026-09-29). Its own docs state `getCountry()` is "based on its device locale, **not** on its position". The library requires declaring supported locales through `CFBundleLocalizations` on iOS and `android:localeConfig` on Android, both of which `expo-localization`'s config plugin now also does (see B.8).

**Raw platform APIs.** On iOS, `NSLocale.preferredLanguages` is "an ordered list of the user's preferred languages" as an array of locale identifiers (developer.apple.com/documentation/foundation/nslocale/preferredlanguages). Apple's QA1828 documents the matching the OS itself performs: take the first preferred language, look for a matching `.lproj` in the bundle, fall back through regional variants to the generic language (`en-GB` falls back to `en`), then walk the rest of the list, and finally use `CFBundleDevelopmentRegion` (developer.apple.com/library/archive/qa/qa1828, revision 2016-03-23, still the canonical description). On Android, the equivalent is the per-app `LocaleList` from `LocaleManager.getApplicationLocales()` (API 33+) falling back to the system locale list (developer.android.com/guide/topics/resources/app-languages, updated 2026-05-11).

**Recommendation.** Use `expo-localization`. It is the Expo-native path, it is already what the SDK 58 guide wires up, and its config plugin generates the per-app language declarations on both platforms, which `react-native-localize` would duplicate at the cost of a second dependency.

### A.3 The list, not the first entry

A phone set to French in London typically reports `["fr-FR", "en-GB"]`. Reading only `getLocales()[0]` and finding no French strings would dump a French speaker into English, when the user's own second preference, also English, is available and the OS would have honoured it. Both platforms expose the ordered list precisely because they expect the walk.

The standard negotiation algorithm is RFC 4647, "Matching of Language Tags" (tools.ietf.org/html/rfc4647, 2006, current). It defines two mechanisms:

- **Filtering** returns every supported tag that matches the priority list.
- **Lookup** returns one best tag: truncate the requested range right-to-left (`zh-Hant-TW`, then `zh-Hant`, then `zh`) until something matches, then fall through to the default. Lookup also treats `*` and the empty range as "match anything".

Lookup is what an app picker wants. The code shape, using the FormatJS implementation that codifies it:

```ts
import { match } from '@formatjs/intl-localematcher';
import { getLocales } from 'expo-localization';

const APP_LOCALES = ['en', 'ar', 'bn', 'id', 'tr', 'ur']; // what we actually ship
const requested = getLocales().map((l) => l.languageTag);  // ordered user preferences
const chosen = match(requested, APP_LOCALES, 'en');        // RFC 4647 lookup + CLDR distance
```

`@formatjs/intl-localematcher` implements a three-tier matcher: exact match, then subtag removal with CLDR likely-subtag maximisation (`zh-TW` resolves to `zh-Hant` before matching), then UTS 35 "Enhanced Language Matching" with language distance data. Its own benchmark on 725 CLDR locales: 1.39 ms per match for the common case, 610 ms DurationFormat instantiation bug on React Native fixed by it (github.com/formatjs/formatjs, packages/intl-localematcher README, retrieved 2026-09-29). `Intl.LocaleMatcher` itself is a TC39 Stage 1 proposal with this exact signature surfaced as `Intl.LocaleMatcher.match(requested, available, default)` (github.com/tc39/proposal-intl-localematcher, retrieved 2026-09-29), so the polyfill is the stable form of a future standard.

`react-native-localize`'s `findBestLanguageTag` is the zero-dependency alternative and respects list order; it does not do CLDR distance matching, which for a curated list of 20 languages is acceptable.

### A.4 Fallback chains and which languages genuinely need variants

| Requested | Chain | Verdict for this app |
| --- | --- | --- |
| `pt-BR` | `pt-BR` then `pt` | One `pt` file serves both Brazils and Portugal; differences are orthographic and small in a prayer app's vocabulary. Ship `pt` only. |
| `zh-Hans-CN`, `zh-SG` | then `zh-Hans` | Simplified is one script. Ship `zh-Hans`. |
| `zh-Hant-TW`, `zh-Hant-HK` | then `zh-Hant` | Traditional is one script; HK vs TW differs in some phrasing. Ship `zh-Hant`. `zh` alone is ambiguous and the likely-subtag default resolves to `zh-Hans`, so a bare `zh` entry must not be the fallback for a Traditional user. |
| `ar-EG`, `ar-SA`, `ar-AE` | then `ar` | Modern Standard Arabic is the written lingua franca and what every localised app ships. Regional dialects are spoken, not written UI. Ship `ar`, RTL. |
| `sr-RS` | `sr` (Cyrillic) | Serbian has equal official status in Cyrillic and Latin. Android's own sample locale config lists both `sr` and `sr-Latn` (developer.android.com sample `locale_config.xml`). If Serbian ships at all, decide script explicitly. |
| `pa` | `pa-Guru` (default) | Punjabi splits by script: Gurmukhi in India, Shahmukhi (Arabic script) in Pakistan (en.wikipedia.org/wiki/Shahmukhi, retrieved 2026-09-29). The overwhelming majority of Punjabi-speaking Muslims are in Pakistan, so if Punjabi ships for this audience it is `pa-Arab`, not the CLDR default `pa-Guru`. |
| `en-GB` | then `en` | The one that matters most for Athan.uk. Apple documents this exact fallback (QA1828). Ship `en`; optionally differentiate `en-GB` later for date and spelling conventions. |
| `es-419` | then `es` | Latin-American Spanish as a unit. Ship `es`. |
| `id` vs `ms` | no chain | Indonesian and Malay are distinct standards with distinct tags. Never treat `ms` as covering `id`. |

CLDR's likely-subtags data (unicode-org/cldr, `common/supplemental/likelySubtags.xml`) is the canonical mapping used by the maximisation step, including the load-bearing one: `zh` plus `TW` resolves to `zh-Hant`, plus `CN` to `zh-Hans`.

Of the candidate top-20 set, only three genuinely require a script or region decision on day one: Chinese (Simplified and Traditional are separate written languages, not variants), Portuguese (optional), and Serbian/Punjabi (script splits, only if they ship). Arabic needs no regional variants despite its dialect spread, because written UI Arabic is MSA everywhere.

### A.5 Where locale detection misleads

| Scenario | What the device reports | What the industry does |
| --- | --- | --- |
| Saudi user with an English phone | `en-SA`, English UI | Correct outcome. The user chose English. Muslim Pro and Athan both open English here. |
| Diaspora user in London with a Bengali phone | `bn-BD`, Bengali UI | Correct outcome, and exactly the user a London prayer app gains by honouring the list. |
| Shared family device | One locale list for all users | Apps with accounts key the language to the account (Netflix, Duolingo). Apps without accounts key it to the device and offer the in-app picker. This app has no accounts (non-goal), so it keys to the device with a picker. |
| Second-hand phone with factory locale | Previous owner's language | The picker is the remedy. This is the strongest argument for a visible, icon-labelled language row rather than silent system-following. |
| Multilingual user, system English, app preferred Bengali | `en-GB` system | This is the exact case per-app language settings exist for. iOS 13+ and Android 13+ both expose it (A.6). |

The pattern across every surveyed app is the same two-layer answer: follow the system list, and provide an explicit override. Nobody resolves the ambiguity by asking for location, because location does not resolve it.

### A.6 Does region ever legitimately beat language?

The Philippines case is the owner's sharpest example, so take it literally. A phone sold in the Philippines is commonly set to English: English and Filipino are both official, media and education run in English, and the App Store's own storefront for the Philippines defaults to English (UK) with no Filipino listed as an additional language, per Apple's published per-country storefront table (developer.apple.com/help/app-store-connect/reference/app-information/app-store-localizations, retrieved 2026-09-29). So "the user is in the Philippines" is weak evidence they prefer Filipino, and the same phone's `getLocales()` usually contains `fil-PH` somewhere in the list anyway, which lookup would honour if and when Filipino ships.

Region-based language guessing does exist in production, in one narrow form: storefront defaulting. Apple and Google decide which store listing language to show from the storefront plus device languages, not from GPS. In-app, the honest uses of region are defaults for things that are genuinely regional and not exposed by the locale: currency, first weekday, date formats when the user has not expressed one. React-native-localize's `getCountry()` exists for exactly this and its author still documents it as locale-derived, never position-derived.

What would location actually buy over the locale list here? Consider the failure matrix. A location query in the Philippines returns a Filipino speaker who reads English, or it returns a Filipino-Chinese user, an English expat, a Muslim Tausug speaker in Zamboanga whose phone is set to `fil`, or a returning OFW worker in London whose GPS is in Manila on a UK phone. The signal is coarse country-level data used to guess at a preference the user has already stated, in writing, one screen deeper in the same Settings app. Tagalog itself sits 22nd in the Ethnologue 2026 total-speakers table (87M) and Philippine Muslims are roughly 5.5M, about 5% of the population (worldpopulationreview.com/country-rankings/muslim-population-by-country, 2026 data), so for this app specifically the Philippines is not even a priority market.

**Verdict: region never beats language for UI language.** The device locale list is a direct statement of preference. Location is an inference about nationality. When they disagree, the stated preference wins, and the in-app picker is the correction valve for the residual cases.

### A.7 The location-permission approach, costed

A separate workstream has already established this app will ask for coarse location for a qibla compass, scoped to the one screen the user chooses to open. Extending location to first launch for language selection would mean:

1. **A permission prompt before the user has seen the app work.** Apple's review guidance is explicit that apps must "clearly and completely describe how your app will use the data" and not "attempt to manipulate, trick, or force people into consenting to unnecessary data access" (developer.apple.com/app-store/review/guidelines/, 5.1.1, retrieved 2026-09-29).
2. **A policy problem on Android.** Play's sensitive-permissions policy states you "may only request permissions... that are necessary to implement current features or services in your app that are promoted in your Google Play listing", and requests "should make sense to users" (support.google.com/googleplay/android-developer/answer/16909972, retrieved 2026-09-29; an April 2026 preview further tightens the Location Permissions policy with a location-button minimum scope effective 2027-01-27). Language selection is not a location feature. A reviewer reading "location requested to choose UI language" against the qibla-declared purpose is a rejection risk and a Data-safety declaration inconsistency.
3. **Zero accuracy gain.** The locale list is the user's typed preference. Location is a guess with a demonstrated failure population (diaspora, shared devices, multilingual countries, travellers, VPNs).
4. **A regression in permission hygiene.** The qibla prompt is defensible precisely because it is scoped, opt-in, and contextual. A launch-time prompt for anything else spends that credibility.

**State plainly: it is never justified.** If the concern is "a user who cannot read English at all", the answers are, in order: ship their language and let lookup find it; ship the endonym-labelled picker reachable without reading English (icons and native script are language-independent); and declare supported locales so the OS per-app language screen, which is in the user's own language, can set it.

### A.8 Follow the device locale forever, or once?

Conventions from the surveyed apps:

- **iOS.** Apps follow the system language, and since iOS 13 users can set a per-app language in Settings, which iOS surfaces only for apps that declare their localizations. Signal's iOS instructions point exclusively at that screen (support.signal.org/hc/en-us/articles/360049188372, retrieved 2026-09-29). Spotify's iOS path is an in-app row that deep-links the same system screen (support.spotify.com/us/article/change-language). Revolut's iOS help does the same (help.revolut.com). iOS restarts the app on a system language change, so following is automatic.
- **Android.** The platform guidance since Android 13 is that in-app pickers should call `LocaleManager.setApplicationLocales` / `AppCompatDelegate.setApplicationLocales` rather than keep private state, precisely so system settings and the app never disagree (developer.android.com/guide/topics/resources/app-languages). The setting syncs both ways. `setApplicationLocales` recreates the activity.

**Recommendation.** Follow the device locale until the user chooses. Model this as three states, not two: `system` (no choice recorded, always re-negotiate from `getLocales()` on each foreground on Android), `user` (an explicit pick, stored, wins over the system), and the platform per-app setting as a first-class citizen on both ends. Expo's own guide frames it the same way: "On newer Android and iOS versions, app language can be set per app, so you usually don't need to build a custom UI", then lists when you still should (docs.expo.dev/guides/localization, 2026-08-06). This app should still build the picker (B.2), because an endonym-labelled list is discoverable without English literacy, but the stored choice should be pushed into the platform setting too, so the OS screen and the app never disagree.

### A.9 First-run algorithm (the deliverable for Question A)

```text
on first launch:
  prefs = getLocales().map(languageTag)          # ordered, guaranteed non-empty
  lang  = intlLocaleMatcher.match(prefs, SHIPPED, 'en')
  store languageMode = 'system', language = lang

on every AppState foreground (Android) while languageMode = 'system':
  re-run the match; if it changes, apply it live (text-only languages need no restart)

when the user picks a language in the sheet:
  store languageMode = 'user', language = pick
  push the pick to the platform per-app locale (iOS Settings, LocaleManager on Android)

when the platform per-app locale changes (either direction):
  treat it as the user's choice; mirror it into the sheet's selected row
```

`SHIPPED` is the curated tag list from Part C. `en` is the default because it is both the current app language and the world's largest L2 lingua franca (Ethnologue 2026: 1,493M total, 1,121M of them second-language speakers).

---

## Part B: The language-change screen

### B.1 What the owner sketched

> "I want this to be a setting in the settings, and I want the Google Translate icon to be there... or a globe, perhaps a globe with lines. And it will be a drop-down option... it will go to the language bottom sheet where they can do a selection, just like the sound bottom sheet."

The sound bottom sheet already solves this shape: a scrolling list of 32 selectable rows, radio-style chosen state, opened from a chevron row inside the settings sheet (`components/sheets/screens/Sound.tsx`, `parts/SoundItem.tsx`). A language sheet is the same component family with different data and no audio preview.

### B.2 Survey: how real apps present it

| App | Where the setting lives | Control | What opens | List order | Instant? |
| --- | --- | --- | --- | --- | --- |
| WhatsApp (Android) | Settings then App Language | Row, chevron | Full-screen list, also offered on the Welcome screen | Localised endonyms | Yes |
| WhatsApp (iOS) | Follows phone language; no in-app picker (faq.whatsapp.com/779773243128935, retrieved 2026-09-29) | System only | iOS per-app language screen | Endonyms | App reset |
| Telegram | Settings then Language | Row | Full-screen list with search | Endonyms, alphabetised, "suggested" pinned | Applies immediately, no restart (telegram.org and community documentation) |
| Signal (Android) | Settings then Appearance then Language, first row | Row | In-app list | Endonyms | "select the language for it to apply immediately" (support.signal.org, retrieved 2026-09-29) |
| Signal (iOS) | None in-app | Deep-link | iOS Settings then Signal then Language | Endonyms | Immediate |
| Spotify (iOS) | Settings then Content and display then App language | Row | System per-app language screen | Endonyms | App restarts |
| Spotify (Android, pre-13) | None in-app; followed device language (community.spotify.com thread 5465187) | System only | OS language | Endonyms | OS-level |
| Netflix | Profile then Display Language, or My Netflix then app language on mobile | Row | Full-screen list | Endonyms + search | Immediate |
| Duolingo | Interface language tied to account base language | Dropdown | Course/base picker | Endonyms | Account-level |
| Google apps | Follow device; Android 13+ appear in system per-app list | System | OS per-app list | Endonyms | Activity recreate |
| Instagram | Settings then Account then App language | Row | In-app full screen | Endonyms | Immediate |
| Revolut (iOS) | Device Settings then Apps then Revolut then Language (help.revolut.com); Business app: Settings then Appearance then Language | Row | System screen or in-app list | Endonyms | Immediate |
| Facebook | Settings then Language and region | Row | In-app list | Endonyms | Immediate |
| Wikipedia app | Settings holds both "Wikipedia languages" (content) and "App language" (interface) | Rows | In-app pickers | Endonyms | Immediate |
| Muslim Pro | Settings then Language | Row | In-app list | Endonyms; supports English, Bahasa Indonesia, Bahasa Melayu, Français, العربية, اردو and more (Play listing, retrieved 2026-09-29) | Immediate |
| Athan (IslamicFinder) | Settings then Language | Row | In-app list; German added June 2025, advertised as "Switch anytime from Settings > Language" (App Store release notes, retrieved 2026-09-29) | Endonyms | Immediate |
| Quran.com | Interface follows device; translation language is a per-surah content choice (quran.com/support) | Dropdown | Content picker | Endonyms | Content-level |
| Pillars | English only today (App Store and Play listings, retrieved 2026-09-29); no language setting exists | n/a | n/a | n/a | n/a |

The consensus shape for a settings-driven app: a labelled row with a leading icon, the current language's endonym as the value, a trailing chevron, opening a full-screen or sheet list of endonym rows with a radio-style selected state. Search appears once the list passes roughly 15 to 20 entries (Telegram and Netflix both add it; Signal's shorter list does not need it).

**Fit for this app.** The owner's sketch matches the industry exactly: a row in the settings sheet, chevron, opening a language bottom sheet built like the sound sheet. The one divergence worth adopting from Signal and Telegram is immediate application for same-direction languages.

### B.3 The naming rule: endonyms

Every surveyed app lists each language in its own script: `العربية`, `हिन्दी`, `Bahasa Indonesia`, `Türkçe`, `Русский`, `中文（简体）`. The rule is not stylistic. A user who cannot read English cannot find "Arabic" in an English list, but can find `العربية`, and the reverse holds for every language. The list is the one screen that must be readable by someone who cannot yet read the app.

Subtitle practice: Wikipedia and Telegram show endonym only. Netflix and Telegram show endonym primary with English name as secondary text for some locales. Google's system per-app list shows endonym primary with the current UI language's name for it as secondary. **Recommendation:** endonym primary, English name secondary in the app's muted text style. It costs one line, aids the multilingual household case, and gives the search field an English target.

Reliable endonym data, with licences:

| Source | What it gives | Licence |
| --- | --- | --- |
| CLDR `languages.json` per locale (`cldr-json` distribution) | The name of every language in every CLDR locale, so `ar.json` contains `"en": "الإنجليزية"` and `en.json` contains `"ar": "Arabic"` | Unicode License (formerly Unicode License v3, OSI-approved) |
| `@cospired/i18n-iso-languages` 4.2.0 | ISO 639-1/2 names in ~30 display languages, `getName('de', 'de')` returns `Deutsch` | MIT (github.com/cospired/i18n-iso-languages, retrieved 2026-09-29) |
| Wikidata property P1705 "native label" | Per-item endonyms, SPARQL-queryable | CC0 |
| Wikipedia "List of ISO 639-1 codes" | Human-checkable cross reference | CC BY-SA |

**Recommendation:** a 20-row table in the repo, generated once from CLDR `cldr-json` (Unicode License, no attribution burden), hand-checked against Wikidata, committed as data. Twenty rows do not need a runtime dependency.

### B.4 Ordering

Alphabetical by endonym is not sortable across scripts without a collation engine, and even with one it scatters the Latin-script languages among five other scripts, which reads as disorder to a scanning eye. The apps in B.2 that face long lists do one of three things:

1. **Suggested group first, then alphabetical by the current UI language's names.** Telegram pins a compact "suggested" set derived from the device list, then alphabetises the remainder by the current language's name for each language. This is the dominant pattern.
2. **Speaker population.** Used by no surveyed app. It bakes a political ranking into the UI and confuses scanning.
3. **Grouped by script.** Used by no surveyed app; it makes the Latin group look privileged.

**Recommendation:** a "Suggested" section holding every shipped language the device list matches (typically one to three rows, the exact set the negotiator would have chosen), then all languages alphabetically by English name, endonym as primary label. English is the app's current language and the ranking key is invisible to the user; when the UI language changes the alphabetical key can follow it.

### B.5 Search

With the launch set at 8 to 10 languages, search is noise. The surveyed threshold is consistent: Signal ships a plain scroll for roughly 50 languages but its list is one screen deep and users arrive knowing their target; Telegram and Netflix, whose lists run past 50, add a search field. For the full 20-plus set, add a search field at the sheet header. Match against three targets in this order: endonym (prefix and substring), English name, and ISO 639-1 code (the power-user target; nobody types `urd`, but engineers and reviewers do). Diacritic-fold both directions where the platform allows, and treat the search field's own keyboard language as no obstacle: the endonym is what a Bengali keyboard types.

### B.6 The icon: legal position and safe choices

The Google Translate glyph is a Google product icon. Google's brand guidance, retrieved 2026-09-29, is unambiguous in both its public statements:

- "Don't imitate our logo or visual identity (distinctive color combinations, graphic designs, product icons, or imagery associated with Google)" is listed under uses for which no request will be granted (about.google/brand-resource-center/guidance/).
- Product icons fall under "Ask first": "Refer to our icon usage guidelines to see whether you can use certain product icons in association with your business", and the Partner Marketing Hub version adds "Don't incorporate a Google product icon out of context, without the proper information for your audience to understand what it means" plus "Make sure your brand is more prominent than Google's product icon" (partnermarketinghub.withgoogle.com/brands/google/branding-guidelines/how-to-show-googles-brand).

A settings row for choosing this app's UI language is not an association with Google Translate, offers no context in which the glyph means anything but "language" borrowed from Google's visual identity, and would imply a relationship that does not exist. Verdict at the end of this report.

Trademark-safe alternatives:

| Candidate | Source | Licence / terms | Notes |
| --- | --- | --- | --- |
| Material Symbols `translate` | fonts.google.com/icons, name `translate` | Apache 2.0 | The generic "A" plus "文" glyph. Generic across the industry, reads as language at 16 pt. |
| Material Symbols `language` | fonts.google.com/icons, name `language` | Apache 2.0 | The plain globe glyph, no letterforms. Same licence, zero brand association. |
| Material Symbols `g_translate` | codepoint `e927` in the classic Material Icons codepoint table | Apache 2.0 for the artwork, but it is the Google-Translate-specific glyph | Avoid. Same legal analysis as the product icon even though it ships in the open icon set. |
| SF Symbols `globe`, `character.bubble`, `textformat.abc`, `translate` | developer.apple.com/sf-symbols | Apple-proprietary; may be used in apps for Apple platforms per the Xcode/SDK agreement | Cannot be exported to Android or rendered from a cross-platform SVG pipeline without redrawing. |
| Unicode globe `🌐` / globe-with-meridians `🌐` | Unicode | Free to render | Emoji presentation varies by OS and clashes with the app's line-icon settings rows. |
| Custom SVG globe | Drawn in-house | Owned | Matches the existing `assets/icons/svg/*.svg` pipeline exactly. |

**Recommendation.** Material Symbols `translate` (the A/文 glyph) rendered as an SVG in the repo's existing icon pipeline, at the same 16 pt stroke weight as the settings icon. It is Apache 2.0, it is the glyph Telegram, Signal and a dozen other apps use for exactly this row, and at the row's small size the two letterforms communicate "language" faster than a globe. If the owner prefers the globe, Material Symbols `language` is equally safe. The existing settings sheet already composes an SVG icon into its header (`SettingsIcon` in `components/sheets/screens/Settings.tsx`), so no new pattern is introduced.

### B.7 What happens at the moment of switching

Two distinct cases, and conflating them is where most Expo apps go wrong.

**Case 1: same text direction (en to tr, ar to en is the other direction but en to id stays LTR).** The translation lookup is a pure function of a Jotai atom. Set the atom, and every subscribed component re-renders with new strings on the next commit. No restart, no router involvement. This is what Signal means by "applies immediately" and what Telegram does. Expo Router needs nothing: routes do not change, and `Stack.Screen` titles re-read on render. The navigation stack is untouched, which is correct: the user stays where they are, now in the new language.

**Case 2: direction flip (en to ar, ar to en).** React Native's `I18nManager` reads the direction at startup. The React Native documentation says it plainly: "Avoid forcing RTL in production apps as it requires a full app restart to take effect, which makes for a poor user-experience" (reactnative.dev/docs/i18nmanager, retrieved 2026-09-29). Expo's own RTL guide's dynamic-override example calls `I18nManager.forceRTL` then `Updates.reloadAsync()` (docs.expo.dev/guides/localization, 2026-08-06), and open issue expo/expo#39752 (filed 2025-09-17, still open 2026-09-29) documents that `allowRTL` plus `forceRTL` without a reload leaves layout LTR while text swaps. `Updates.reloadAsync()` in production reloads the current bundle without a Metro round-trip; in development the page reloads. Android's platform path (`setApplicationLocales`) recreates the activity itself, so on Android 13+ the OS side does the equivalent for us if we push the choice to `LocaleManager`.

**Recommendation.** Same-direction switches apply live. Direction flips write the choice, then `Updates.reloadAsync()`, with the sheet dismissed first so the user returns to the home screen in the new direction rather than into a re-mounted sheet. This is a deliberate, disclosed trade, not a failure to modernise: every app that truly flips direction live (browsers, some native apps) does it with a per-view direction value instead of the global `I18nManager`, which in React Native means hand-rolling `flexDirection` swaps everywhere. That is not worth it for a settings action performed once or twice in an install's life.

**Accessibility at the switch.** Announce the change. `AccessibilityInfo.announceForAccessibility` posts a string to VoiceOver or TalkBack (reactnative.dev/docs/accessibilityinfo, retrieved 2026-09-29), and the announcement must be in the new language, phrased with the new language's own endonym, because the user just told the phone they read that one: for example `اللغة: العربية` or `Language: English`. Then fire `sendAccessibilityEvent` with `focus` on the settings row the user came from, so focus does not strand on a re-rendered node. The overlay workstream already treats screen-reader routing as a hard requirement, and a language change is the single most disruptive re-render the app will ever do.

### B.8 Side effects specific to this app

Three subsystems hold baked language at switch time.

**1. Up to 64 scheduled OS notifications.** Notification copy is frozen at schedule time. The scheduler arms whole rows against a 64-request budget (`NOTIFICATION_REQUEST_BUDGET` in `shared/constants.ts`, `SCHEDULE_CANDIDATE_DAYS` derived from it) and identifiers are deterministic (`prayerNotificationIdentifier`, `reminderNotificationIdentifier` in `device/notifications.ts`), so re-scheduling is idempotent: the same identifier replaces rather than duplicates, on both platforms, by construction. The correct re-arm sequence on a language change: cancel nothing, re-run the scheduling pass with the new string table, and let identifier equality replace each pending request in place. Deterministic identifiers are the whole reason this is safe.

**2. Home-screen and lock-screen widgets.** Widget copy comes from data the app pushes: iOS timelines from `stores/widget.ts` via `updateTimeline`, Android snapshots via `kind.widget.updateSnapshot`. A language change must re-push both, in the new language, after the string table swaps and before the re-arm completes. On iOS each push costs a WidgetKit reload per kind, and the AGENTS memory already documents that reload latency grows under barrages, so the widget re-push belongs in the same sequenced pass as notifications, not fired concurrently per kind.

**3. Android notification channels.** The premise needs correcting: a channel's name and description are mutable, its behaviours are not. "After you create a notification channel, you can't change the notification behaviors... However, you can still change a channel's name and description" (developer.android.com/develop/ui/compose/notifications/channels, updated 2026-09-11), and Microsoft's API docs echo the intended use: "The name and description should only be changed if the locale changes" (learn.microsoft.com, `NotificationManager.CreateNotificationChannel`). This repo's own durable lesson matches on the behaviour half: sound, audio attributes and importance are frozen at creation, which is why channel ids carry generations. So the localisation move is to re-run the channel-creation calls with the same ids and new localised names, which updates name and description in place while leaving every user's hand-set channel behaviour intact. Never mint new ids for a language change: that would orphan user-tuned channels.

**User-visible behaviour during the re-arm.** The pass is fast (scheduling 64 requests and pushing a few widget timelines is sub-second to a few seconds), but it is not free and it must be sequenced. The correct pattern, matching how the app already treats scheduling as a locked operation (`withSchedulingLock`):

1. Apply the language atom. Text swaps immediately; the sheet stays open.
2. Mark the row's check, give the haptic the sound sheet already uses on commit, and show a transient inline state on the sheet: the selected row's label in the new language with a small progress indicator at the sheet's foot. No full-screen spinner, no blocking modal. The user can read the new language's name in the row they picked, which is itself the confirmation.
3. Run notifications re-arm, then channel renames, then widget re-push, under the existing lock.
4. Dismiss the sheet, announce the change for accessibility, and only reload if the direction flipped.

If the process dies mid-pass, no harm: the identifiers make the next launch's scheduling pass converge, and the language atom is already stored. The one invariant to add is ordering: the language atom write happens before the lock is taken, so a queued pass never plans in the old language, which is the same write-path lesson the repo recorded for alert-preference commits.

### B.9 First-run: picker or silent pick?

Both patterns exist in the wild. WhatsApp's Android welcome screen asks for language before registration, and does so because its next screen is a phone-number form the user must read; Telegram asks nothing and follows the device. Netflix asks nothing. Duolingo asks, because its first question is "what course", which is language by another name. Muslim Pro follows the device. Athan follows the device.

The evidence for silence: a first-launch picker is an onboarding screen before any value is shown, and onboarding drop-off compounds; every extra screen costs completion. The device locale is right for the overwhelming majority of installs, and the picker is one settings tap away for the rest. For store review, neither pattern is required or penalised on either store; reviewers check that the app functions in the languages it claims, not that it asks.

For this app specifically: the first launch already gates on a network sync and a notification-permission decision. A language question would be the third thing asked before the first prayer time renders. **Recommendation: no first-run picker.** Silent locale match, then make the settings row visible enough (its own icon, in the first card) that a non-English reader finds it. The genuinely non-English reader whose language is not shipped is better served by the endonym list they can scan than by a modal in English.

### B.10 Store metadata and app config

What a 20-language app owes the stores:

| Surface | Requirement | Recommendation |
| --- | --- | --- |
| iOS `CFBundleLocalizations` | Declares the app's localizations to the system. Drives the App Store "Information" language list and the availability of the iOS per-app language screen (react-native-localize docs; Apple QA1828) | Set via the `expo-localization` config plugin's `supportedLocales`, which writes it at prebuild |
| iOS `CFBundleAllowMixedLocalizations` + `locales` config | Enables localised system dialogs and the display name. Expo's `locales` config maps JSON files to `InfoPlist.strings` per language, including permission strings (docs.expo.dev/guides/localization, 2026-08-06) | Localise at minimum the notification-permission purpose string; an Arabic user granting notifications in English is a credibility hit |
| App Store listing localizations | App Store Connect supports metadata in ~50 locales; the language a customer sees depends on storefront and device language (developer.apple.com/help/app-store-connect/reference/app-information/app-store-localizations, retrieved 2026-09-29) | Localise the listing for every shipped language. An English-only listing for an app whose screenshots are in Arabic depresses conversion and looks unfinished |
| Play `android:localeConfig` | Required for the app to appear in Android 13+ system per-app language settings (developer.android.com/guide/topics/resources/app-languages) | Written by the same config plugin; verify `resourceConfigurations` matches or library strings leak extra languages |
| Play store listing translations | Add translations per language; if you do not, Play offers users an automated machine translation of the listing with a disclosure banner, and automated translations are not available in every language (support.google.com/googleplay/android-developer/answer/9844778, retrieved 2026-09-29) | Ship human translations for the launch set; Play's own console surfaces per-language "recommendations likely to increase installs" once data exists |

Is an unlocalised listing for a localised app "a problem"? Not a rejection on either store. It is a conversion and trust problem, and on Play it silently degrades to a machine translation with a warning banner, which is worse than nothing for a religious app whose copy precision matters to its audience. The minimum honest set: localised listing title, description, and screenshots for every language the app ships, plus localised permission strings on iOS.

---

## Part C: The languages

### C.1 Top 20 by total speakers (L1 + L2)

Source: Ethnologue 2026 edition, 50M-plus table, as republished with figures at en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers (retrieved 2026-09-29; underlying reference "What are the top 200 most spoken languages?", ethnologue.com/insights/ethnologue200/, 2026). Ethnologue excludes macrolanguages from this table (Arabic, Chinese, Malay, Persian, Pashto, Lahnda), so Arabic appears as Modern Standard Arabic and Chinese as Mandarin; notes flag where a macrolanguage view changes the picture. Plural categories from CLDR v48 cardinal rules (webtranslateit.com/learn/locales/plural-rules-by-language, cross-checked against cldr.unicode.org/index/cldr-spec/plural-rules, retrieved 2026-09-29).

| # | Language | Total (M) | L1 (M) | L2 (M) | BCP 47 tag(s) | Endonym | Script | Dir | CLDR plurals |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | English | 1,493 | 372 | 1,121 | `en` (`en-GB` later) | English | Latin | LTR | 2 (`one`, `other`) |
| 2 | Mandarin Chinese | 1,183 | 988 | 194 | `zh-Hans`, `zh-Hant` | 简体中文 / 繁體中文 | Han (Simplified / Traditional) | LTR | 1 (`other`) |
| 3 | Hindi | 611 | 347 | 264 | `hi` | हिन्दी | Devanagari | LTR | 2 (`one` covers 0 and 1, `other`) |
| 4 | Spanish | 561 | 487 | 75 | `es` (Latin America may prefer `es-419` later) | Español | Latin | LTR | 2 |
| 5 | Modern Standard Arabic | 335 | 0 (no L1) | 335 | `ar` (macrolanguage `ar` covers all varieties) | العربية | Arabic | RTL | 6 (`zero`, `one`, `two`, `few`, `many`, `other`) |
| 6 | French | 334 | 75 | 258 | `fr` | Français | Latin | LTR | 2 (`one` covers 0 and 1) |
| 7 | Bengali | 274 | 234 | 43 | `bn` | বাংলা | Bengali | LTR | 2 |
| 8 | Portuguese | 269 | 252 | 18 | `pt` (`pt-BR` for Brazil if differentiated) | Português | Latin | LTR | 2 (`pt` `one` is 0-1 in `pt-PT`, 1 in general CLDR `pt`) |
| 9 | Indonesian | 255 | 78 | 177 | `id` | Bahasa Indonesia | Latin | LTR | 1 (`other`) |
| 10 | Urdu | 246 | 78 | 168 | `ur` | اردو | Arabic (Nastaliq typography) | RTL | 2 |
| 11 | Russian | 210 | 133 | 77 | `ru` | Русский | Cyrillic | LTR | 4 (`one`, `few`, `many`, `other`) |
| 12 | Standard German | 133 | 76 | 57 | `de` | Deutsch | Latin | LTR | 2 |
| 13 | Japanese | 126 | 124 | 2 | `ja` | 日本語 | Han + Kana | LTR | 1 |
| 14 | Nigerian Pidgin | 121 | 5 | 116 | `pcm` | Naijá | Latin | LTR | not in CLDR 163; treat as 2 |
| 15 | Egyptian Arabic | 118 | 83 | 35 | covered by `ar` | العربية المصرية | Arabic | RTL | covered by `ar` (6) |
| 16 | Marathi | 99 | 83 | 16 | `mr` | मराठी | Devanagari | LTR | 2 |
| 17 | Vietnamese | 97 | 86 | 11 | `vi` | Tiếng Việt | Latin | LTR | 1 |
| 18 | Telugu | 96 | 83 | 13 | `te` | తెలుగు | Telugu | LTR | 2 |
| 19 | Swahili | 95 | 4 | 91 | `sw` | Kiswahili | Latin | LTR | 2 |
| 20 | Hausa (tie with Turkish) | 94 | 58 | 36 | `ha` | Hausa (Ajami: هَوُسَ) | Latin (Boko) | LTR | 2 |
| 20 | Turkish (tie) | 94 | 86 | 7 | `tr` | Türkçe | Latin | LTR | 2 |

Notes that matter for shipping decisions:

- **Chinese is two entries, not one.** `zh-Hans` and `zh-Hant` are different written languages. A Traditional reader cannot comfortably read Simplified and vice versa. Both must ship or neither.
- **Arabic as a macrolanguage** has roughly 332M MSA users plus dialect L1 speakers; Ethnologue's macro view puts all Arabic varieties near the top five. For an app, `ar` in MSA is correct: it is the written register every literate Arabic speaker reads.
- **Nigerian Pidgin** has no CLDR plural entry and thin localisation tooling. It is enormous in L2 and irrelevant to this app's audience; it appears here for completeness of the top-20, not as a shipping candidate.
- **Turkish and Hausa tie at 94M.** For this app Hausa and Turkish both matter (Part C.2), which is convenient.
- Tagalog (`tl` / `fil`, 87M total) and Western Punjabi (`pa`, 90M) sit just outside the top 20; both appear in the Muslim-overlap analysis.

### C.2 Ranked by Muslim-population overlap

Sources: Pew Research Center, "How the Global Religious Landscape Changed From 2010 to 2020" (pewresearch.org, 2025-06-09, 2.2B Muslims worldwide, 53 Muslim-majority countries, six countries hold 52% of the world's Muslims) and its companion short read (pewresearch.org, 2025-12-08, naming Indonesia, Pakistan, India, Bangladesh, Nigeria as the five largest, ahead of Egypt). Country figures below are from the Pew-based compilation at worldpopulationreview.com/country-rankings/muslim-population-by-country (2026 dataset, retrieved 2026-09-29). Languages are mapped to countries by predominant usage among that country's Muslims; the mapping note records where the fit is loose.

| # | Language | Anchor countries (Muslims, M) | Approx. Muslim-addressable (M) | Global rank (C.1) | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | Arabic (`ar`) | Indonesia-adjacent no; Egypt 87.5, Algeria 43.7, Iraq 39, Sudan 38.6, Morocco 36.4, Saudi 31.5, Yemen 26.8, Syria 15, plus Tunisia, Jordan, Libya, UAE, Qatar, Kuwait, Oman, Palestine, Lebanon | 400+ | 5 (MSA) | Core. Every Muslim learns liturgical Arabic; MSA is the UI register. |
| 2 | Indonesian (`id`) | Indonesia 249.8 (87.1%) | 218 | 9 | Core. Largest single Muslim population on earth. |
| 3 | Urdu (`ur`) | Pakistan 233 (96.5%), India 200 (lingua among North Indian Muslims), UK 4 (largest diaspora bloc) | 280+ | 10 | Core. Pakistan's official language and the UK mosque's common tongue. |
| 4 | Bengali (`bn`) | Bangladesh 150.8 (91%), India West Bengal, UK 4 | 160+ | 7 | Core. Tower Hamlets alone makes it a London priority. |
| 5 | Hindi (`hi`) | India 200 (14.6%) | 200 (as L2 bridge; colloquially overlapping Urdu) | 3 | Ship. Hindi-region Muslims number in the tens of millions as L1. |
| 6 | Turkish (`tr`) | Turkey 81.2 (94.5%), Cyprus, Germany 5.6, UK diaspora | 85+ | 20 | Core. London Turkish community is well established. |
| 7 | Persian / Farsi (`fa`) | Iran 85.7 (99.8%), Afghanistan Dari ~20 of 37, Tajikistan partial | 110+ | not in top 20 (82M Iranian Persian) | Ship in full set. |
| 8 | Hausa (`ha`) | Nigeria north of 96 (48%), Niger 21.1 | 70+ | 20 | Full set. West Africa's Muslim lingua franca. |
| 9 | Malay (`ms`) | Malaysia 20.1 (63.5%), Brunei, Singapore 0.9 | 25+ | not in top 20 | Full set. Overlaps Indonesian readers partially; distinct standard. |
| 10 | Swahili (`sw`) | Tanzania 19.4 (35.2%), Kenya 5.5, Mozambique 5.8 | 30+ | 19 | Full set. East African coastal Muslim belt. |
| 11 | Pashto (`ps`) | Afghanistan 37 (south), Pakistan KPK and Balochistan | 50+ | not in top 20 (macrolanguage) | Full set. Large, but low smartphone-app English workarounds and script/voice challenges. |
| 12 | Somali (`so`) | Somalia 11 (99.8%), Ethiopia 34.7 (Somali region), Kenya 5.5, UK diaspora | 20+ | not in top 20 | Full set. Significant London community. |
| 13 | Kurdish (`ku`) | Turkey southeast, Iran west, Iraq north, diaspora | 30+ | not in top 20 | Full set, lower priority; fragmented standard (`ku` covers Kurmanji; Sorani is `ckb`, RTL). |
| 14 | Uzbek (`uz`) | Uzbekistan 29.9 (88.7%) | 27 | not in top 20 | Full set. Latin-script since the 1990s, straightforward. |
| 15 | Azerbaijani (`az`) | Azerbaijan 10.1 (97.3%), Iran north | 15+ | not in top 20 | Full set, lower priority. |
| 16 | Tamil (`ta`) | India Tamil Nadu and Sri Lanka 2.1 (9.7%), Singapore 0.9, Malaysia | 10+ | just outside top 20 (86M total) | Full set. Sri Lankan and Tamil Muslim diaspora in the UK. |
| 17 | Malayalam (`ml`) | Kerala, UAE diaspora | 10+ | not in top 20 (59M L1) | Full set. Kerala's Muslim community is a third of the state. |
| 18 | Bosnian (`bs`) | Bosnia 2 (50.7%), diaspora | 2+ | not in top 20 | Full set, last. Plurals: 4 forms. |
| 19 | Albanian (`sq`) | Albania 1.2 (50.7%), Kosovo, North Macedonia 0.6 | 5+ | not in top 20 | Full set, last. |
| 20 | English (`en`) | UK 4, US 3.5, and the default everywhere | global | 1 | Core, and the app's current language. |

Two structural observations. First, the overlap ranking inverts the global one: Indonesian, Urdu, Bengali, Turkish and Hausa rise; Mandarin Chinese, Spanish, French, German, Japanese, Russian and Telugu fall away entirely. Second, English stays in both lists, which is the strongest argument for keeping it the default and the fallback.

### C.3 Recommended launch set and full set

**Launch set (8):** `en`, `ar`, `id`, `ur`, `bn`, `tr`, `fr`, `de`.

Reasoning: `en` is the base and the fallback. `ar` is the liturgical and regional core, already half-present as the hardcoded second line. `id` and `ur` cover the two largest Muslim populations. `bn` is the largest London mosque community. `tr` is both a top-20 language and a top-10 overlap language. `fr` and `de` cover the two largest European Muslim diasporas (France 6.9M, Germany 5.6M) whose communities are largely North African and Turkish but whose phones, and app-store browsing, run in the local language. Eight is also the size at which no search field is needed and the sheet matches the sound sheet's proven density.

**Full set (20), in rollout order after launch:** `fa`, `ms`, `sw`, `ha`, `so`, `nl` (UK Somalis arrived via the Netherlands in part; low priority, optional), `ps`, `ku`, `uz`, `az`, `ta`, `ml`, `zh-Hans` and `zh-Hant` (pair, for the Hui and overseas Chinese Muslim communities and general reach), `bs`, `sq`, `hi`, `ru`.

Hindi and Russian are full-set rather than launch despite their size because this app's Hindi- and Russian-speaking Muslim audiences are addressable in Urdu and in local languages respectively, and each added language carries the RTL, plural and font obligations in C.4. Chinese ships as the pair or not at all, which is why it sits in the full set where it can be done once, properly.

Deliberately excluded: Serbian and Punjabi. Serbian's script question (Cyrillic, Latin, or both) and Punjabi's Gurmukhi/Shahmukhi split (A.4) each cost a decision this audience does not force: Balkan Muslims are served by `bs` and `sq`, Pakistani Punjabis overwhelmingly by `ur`. Neither exclusion is permanent; both are deferrals of a script decision, and the exclusion should be revisited if user demand appears.

### C.4 What each language costs beyond strings

| Obligation | Applies to | Work |
| --- | --- | --- |
| RTL layout | `ar`, `ur`, `fa`, `ps`, `ckb` if Kurdish Sorani ships | Direction flip on switch (B.7), `I18nManager` restart path, mirrored padding and chevrons |
| Six-way plurals | `ar` | Message strings for `zero`, `one`, `two`, `few`, `many`, `other` wherever a count is shown |
| Four-way plurals | `bs`, (`ru`, `ku` in full set) | `one`, `few`, `many`, `other` |
| Fonts with full coverage | `bn`, `ur`, `hi`, `mr`, `te`, `ta`, `ml`, `ne` scripts | Devanagari, Bengali, Tamil, Telugu, Malayalam glyph sets; Nastaliq for Urdu reads better but Thuluth-style naskh is acceptable |
| Calendar localisation | all, escalating | Hijri month names per language; `getCalendars()` already exposes the system's Islamic calendar choice |
| Notification channel renames | all Android | B.8 |
| Store listing | all | B.10 |

The plural and script facts come from the CLDR v48 table (webtranslateit.com CLDR guide, 2026-08-13) and the script facts from the standard references already cited in A.4.

---

## Conclusions

1. **First launch:** match the device's ordered locale list against the shipped set with RFC 4647 lookup (`@formatjs/intl-localematcher` or `react-native-localize`'s `findBestLanguageTag`), default `en`. No location, no prompt, no first-run picker.
2. **Location for language:** rejected on policy (Apple 5.1.1, Play sensitive-permissions policy), on permission hygiene (the qibla scoping), and on accuracy (it guesses what the locale states).
3. **Change surface:** a settings row, globe or A/文 icon, chevron, opening a bottom sheet built on the sound-sheet pattern, endonym-primary rows, suggested group then alphabetical by English name, search when the list passes 15 or so.
4. **Icon:** Material Symbols `translate` (Apache 2.0) or `language`. Not the Google Translate glyph.
5. **Switch mechanics:** live for same-direction pairs, `Updates.reloadAsync()` only for direction flips, accessibility announcement in the new language, then sequenced notification re-arm, channel renames, and widget re-push under the existing scheduling lock.
6. **Platform settings:** declare `supportedLocales` through the `expo-localization` config plugin so both OS per-app language screens work, and mirror the user's in-app pick into them.
7. **Ship:** 8 at launch (`en ar id ur bn tr fr de`), 20 in the full set, weighted by Muslim-population overlap rather than raw speaker rank, Chinese as the Hans/Hant pair.

## Source index

- Expo SDK 58 `expo-localization` API and config plugin: docs.expo.dev/versions/v58.0.0/sdk/localization (via docs-mcp-server index, 2026-09-29)
- Expo localisation guide incl. per-app language and RTL: docs.expo.dev/guides/localization (updated 2026-08-06)
- `react-native-localize`: github.com/zoontek/react-native-localize (2026-09-29)
- Apple QA1828 language selection: developer.apple.com/library/archive/qa/qa1828 (2016-03-23 revision)
- `NSLocale.preferredLanguages`: developer.apple.com/documentation/foundation/nslocale/preferredlanguages
- Android per-app language preferences: developer.android.com/guide/topics/resources/app-languages (2026-05-11)
- RFC 4647: tools.ietf.org/html/rfc4647 (2006)
- TC39 `Intl.LocaleMatcher` proposal: github.com/tc39/proposal-intl-localematcher (Stage 1, 2026-09-29)
- `@formatjs/intl-localematcher`: github.com/formatjs/formatjs, packages/intl-localematcher README
- CLDR plural rules: cldr.unicode.org/index/cldr-spec/plural-rules; per-language table webtranslateit.com/learn/locales/plural-rules-by-language (CLDR v48, 2026-08-13)
- Google brand guidance: about.google/brand-resource-center/guidance/; partnermarketinghub.withgoogle.com (2026-09-29)
- Material Symbols licence: fonts.google.com/icons (Apache 2.0)
- Apple App Review Guidelines 5.1.1: developer.apple.com/app-store/review/guidelines/
- Play sensitive permissions policy: support.google.com/googleplay/android-developer/answer/16909972 (incl. April 2026 location preview, effective 2027-01-27)
- Play localisation: support.google.com/googleplay/android-developer/answer/9844778
- App Store localizations and storefront table: developer.apple.com/help/app-store-connect/reference/app-information/app-store-localizations/
- Android notification channels: developer.android.com/develop/ui/compose/notifications/channels (2026-09-11)
- React Native `I18nManager` and `AccessibilityInfo`: reactnative.dev/docs/i18nmanager, reactnative.dev/docs/accessibilityinfo (2026-09-29)
- Expo RTL restart issue: github.com/expo/expo/issues/39752 (2025-09-17, open)
- Ethnologue 2026 speaker tables: en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers and /List_of_languages_by_number_of_native_speakers (2026-09-29); ethnologue.com/insights/ethnologue200/
- Pew Research Center: "How the Global Religious Landscape Changed From 2010 to 2020" (2025-06-09); "Many religions are heavily concentrated in a few countries" (2025-12-08)
- Muslim population by country: worldpopulationreview.com/country-rankings/muslim-population-by-country (2026 dataset)
- App surveys: faq.whatsapp.com, support.signal.org, support.spotify.com, help.netflix.com, help.revolut.com, facebook.com/help, support.muslimpro.com, apps.apple.com (Athan, Muslim Pro, Pillars), play.google.com (Muslim Pro), quran.com/support, thepillarsapp.com/faqs (all 2026-09-29)
- Endonym data: CLDR `cldr-json` (Unicode License); `@cospired/i18n-iso-languages` 4.2.0 (MIT), github.com/cospired/i18n-iso-languages; Wikidata P1705 (CC0)
- Shahmukhi/Gurmukhi split: en.wikipedia.org/wiki/Shahmukhi
