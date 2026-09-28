# R1: The i18n library landscape, measured

Session 39 research deliverable. Written 2026-09-29. Every version, byte and date below was
read from the npm registry, the published package files, the Hermes repository, or the React
Native 0.88.0-rc.2 source tree on that date. Where a number is an estimate or could not be
verified, the text says so and section 13 lists what would verify it.

The question this report answers: which internationalization approach should Athan adopt,
given the constraints in `MEASURED.md` (113 display strings plus 25 widget strings, prayer
names doubling as identifiers), `OWNER-DECISIONS.md` D1 through D14, and the two hostile
runtimes (the five-name widget React stub, and notification copy baked at schedule time into
up to 64 OS requests).

## 1. Executive summary

1. **Hermes on both platforms still has no `Intl.PluralRules`.** The Hermes doc tree on
   `main` (read 2026-09-29) lists `PluralRules`, `ListFormat`, `RelativeTimeFormat`,
   `DisplayNames`, `Segmenter` and `Locale` as "Planned", not implemented
   ([doc/Features.md](https://github.com/facebook/hermes/blob/main/doc/Features.md),
   [issue #1462 open since 2022](https://github.com/facebook/hermes/issues/1462)). RN
   0.88.0-rc.2 pins `hermes-compiler@260318099.0.3` and ships a single `hermes-android`
   artifact with no intl/no-intl split. Any library that pluralises through
   `Intl.PluralRules` needs a JS polyfill in this app, on iOS and Android alike.
2. **i18next 26.4.2 has no plural fallback any more.** Its own docs state that since v24,
   without `Intl.PluralRules`, only English-style `_one`/`_other` forms resolve. Arabic has
   six CLDR categories. Unpolyfilled i18next renders wrong Arabic reminder copy on every
   device this app ships to.
3. **Lingui 6.8.0 has the smallest runtime** (core 2,116 B min+gz) but its official React
   Native path mandates `@formatjs/intl-locale` (102,761 B raw force-polyfill) plus
   `@formatjs/intl-pluralrules` (46,780 B raw), is ESM-only, and moved its macro from
   `@lingui/macro` (still 5.9.5, no v6 exists) into a direct Babel plugin. It carries the
   highest integration risk in this specific repo: a compile-time macro pipeline interacting
   with the existing `react-native-svg-transformer`, `jsx-runtime-shim` resolver redirect and
   the widget `'widget'` transform.
4. **react-intl 12.1.3 is the heaviest** (react-intl 15.2 KB gz plus `@formatjs/intl`
   10.1 KB gz plus the same polyfills) and its headline strength, rich number and date
   formatting, duplicates what this app already does with `date-fns` 4.4.0 and its own
   `Intl.DateTimeFormat` code.
5. **Catalogs are cheap at any scale.** Measured on this repo's real string inventory: a
   flat JSON catalog for the English corpus is 5,317 B. Twenty languages cost 104 KB of raw
   bundle bytes, sixty cost 312 KB. The app's Hermes bundle is 4.4 MB today, and the RN
   0.88 Gradle plugin defaults `enableBundleCompression` to false, so bundle bytes are APK
   bytes roughly one to one. Catalog size does not decide this choice. Runtime plumbing,
   plural correctness, testability and the widget graph do.
6. **Recommendation, ranked**: (1) a hand-rolled typed catalog plus a `t()` function, with
   plural rules generated from CLDR at authoring time and zero runtime dependencies;
   (2) `i18next` + `react-i18next` with `@formatjs/intl-pluralrules` force-polyfilled, the
   right choice the moment a translation-management system or paid translation workflow
   enters the loop; (3) Lingui v6; (4) react-intl; (5) i18n-js.
7. **The crossover**: at 2 languages and at 20 languages the hand-rolled catalog wins on
   every axis this repo measures. Somewhere past roughly 40 languages, or earlier if a TMS
   with review states and vendor handoff enters, i18next's operations tooling outweighs its
   24 KB min+gz plus polyfill cost. Section 12 gives the decision rule.
8. **The widget runtime constraint is library-independent under the props-baked design.**
   Widget copy is translated in the app process and baked into timeline props, so no i18n
   import needs to be reachable from `widgets/*.tsx` at all. Keep it that way whatever wins:
   the `@expo/ui` 58.0.7 lesson is that any dependency update can add a module-scope React
   call and blank every card. `react-i18next`'s `context.js` does call
   `React.createContext()` at module scope today (verified in its published CJS build);
   that call is one of the stub's five names, so it survives today, with no guarantee about
   the next release.
9. **Notification copy is a re-arm problem, not a library problem.** Neither iOS
   (`UNUserNotificationCenter` freezes content at schedule) nor Android (the builder resolves
   strings at build time) re-localises a scheduled notification at delivery. D12's right-hand
   column is the only JS-side path: cancel and re-arm the whole plan on language change. The
   only library requirement is that `t` be a synchronous plain function callable from
   `stores/notifications.ts`. Every candidate satisfies that through its non-hook export.
10. **Jest runs on Node, which has full `Intl`; Hermes does not.** A plural implementation
    that works in tests can be wrong on every device. Whatever ships needs either embedded
    plural rules (no `Intl` dependency) or a polyfill, plus one canary test that deletes
    `Intl.PluralRules` and asserts correct categories anyway.

## 2. Method and sources

- Versions, dependency lists, publish dates and dist-tags: `https://registry.npmjs.org/<pkg>`
  and `/<pkg>/latest`, read 2026-09-29 via direct fetch.
- Minified and gzipped sizes: `https://bundlephobia.com/api/size?package=<pkg>@<version>`.
  Raw file sizes: fetched from `unpkg.com` and measured as UTF-8 byte lengths.
- Hermes `Intl` support: `facebook/hermes` repository, `doc/IntlAPIs.md` and `doc/Features.md`
  on `main`, plus issue #1462, read 2026-09-29.
- RN 0.88 build behaviour: the `v0.88.0-rc.2` tag of `react/react-native`, Gradle plugin
  sources (`ReactExtension.kt`, `DependencyUtils.kt`), and the artifact listing at
  `https://repo.reactnative.dev/maven2/com/facebook/hermes/hermes-android/`.
- Library internals: published distribution files of `i18next@26.4.2`,
  `react-i18next@17.0.15`, `@lingui/core@6.8.0`, `@formatjs/intl@6.1.2`,
  `use-sync-external-store@1.6.0`, read from `unpkg.com`.
- Catalog sizes: computed in-repo from `research/string-inventory.json` (194 literals, the
  real corpus), gzipped with Python's `gzip` at level 9.
- Repo constraints: `ai/plans/39-localisation/MEASURED.md`, `OWNER-DECISIONS.md`,
  `ai/AGENTS.md` (widget runtime lesson, notification budget, coverage rule), `metro.config.js`.
- Weekly downloads: `https://api.npmjs.org/downloads/point/last-week/<pkg>`, week of
  2026-09-22 to 2026-09-28.

## 3. The candidate set

### 3.1 Headline comparison

| Candidate | Latest (date) | Licence | Runtime deps (transitive) | Min+gz bundle | Weekly downloads | Last release | Open issues | Bus factor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `i18next` + `react-i18next` | 26.4.2 + 17.0.15 (2026-09-03 / 09-21) | MIT | 5 packages, no polyfills; 8 with plural polyfill set | 13,703 + 10,229 B | 25.4M + 18.8M | 8 days ago | 2 / 1 | Low: one primary maintainer (locize founder), company-backed |
| `@lingui/core` + `@lingui/react` | 6.8.0 (2026-09-23) | MIT | ~14 with the mandated polyfills | 2,116 + 1,775 B | 1.7M + 1.2M | 6 days ago | 60 | Medium: active team, v6 modernisation shipped 2026-04-22 |
| `react-intl` (FormatJS) | 12.1.3 (2026-09-24) | BSD-3-Clause | ~11 with polyfills | 15,183 B + `@formatjs/intl` 10,126 B | 3.6M | 5 days ago | 9 | High: Meta-affiliated maintainers, very active |
| `intl-messageformat` standalone | 12.1.2 | BSD-3-Clause | 3 | 10,126 B | 23.0M | 2026-09-19 | (formatjs repo) | High |
| `expo-localization` | 57.0.2 latest, 58.0.1 `next` (2026-09-21) | MIT | 1 (`rtl-detect`); native module | JS side trivial | 3.2M | 8 days ago | Expo-managed | High (Expo core) |
| `react-native-localize` | 3.7.2 (2026-09-15) | MIT | 0; native TurboModule (codegen'd) | 384 B JS | 659k | 14 days ago | 5 | Low-medium: zoontek, long reliable record |
| `i18n-js` | 4.5.3 (2026-03-04) | MIT | 3 (`lodash`, `make-plural`, `bignumber.js`) | 14,189 B | 642k | ~7 months ago | 6 | Low: one maintainer |
| `intlayer` / `react-native-intlayer` | 9.5.11 | Apache-2.0 | 5+ | not measured | 12.5k (RN package) | active | n/a | Early: CDN-centric design conflicts with D3 offline |
| `@tolgee/react` | 7.2.1 | MIT | 2 | not measured | 95k | active | n/a | Dev-tool-centric, needs Tolgee server; conflicts with D3 |
| Roll-your-own typed catalog + `t()` | n/a | n/a | 0 runtime (1 dev-time generator) | ~0 B beyond catalogs | n/a | n/a | n/a | You |

Notable 2026 market check: the npm download split (i18next 25.4M weekly, react-intl 3.6M,
Lingui 1.7M core) matches what comparison articles from Tolgee, SimpleLocalize and dev.to
published in 2026: react-i18next is the dominant default in production React and React
Native; Expo's own `expo-localization` docs name "lingui-js, react-i18next, react-intl,
i18n-js or react-native-intlayer" as pairing libraries and explicitly provide no translation
layer themselves.

### 3.2 Per-candidate detail

**i18next 26.4.2 + react-i18next 17.0.15.** Zero runtime dependencies in `i18next` itself
(peer `typescript` optional). `react-i18next` brings `@babel/runtime`,
`html-parse-stringify` (1,878 B gz) and `use-sync-external-store` (221 B gz, with a
`react-native` condition in its exports map). The `useTranslation` hook subscribes through
`use-sync-external-store/shim`, whose RN build destructures `React.useState` and friends at
module scope but calls them only inside component bodies (verified in the published CJS
shim). `context.js` executes `React.createContext()` at module scope; that name survives the
widget stub today. TypeScript: `CustomTypeOptions.resources` typed from one language's JSON
gives compile-time key checking, and the selector API (`t($ => $.key)`) became the default
in v26 with a `strict` mode added in 26.1.0; the peer range accepts TypeScript 7 (repo has
7.0.2). JSON v4 plural keys are per-category (`key_one`, `key_other`), resolved through
`Intl.PluralRules` (section 4). Maintenance: 8,638 stars, 2 open issues, releases every few
weeks since 2012.

**Lingui 6.8.0.** Announced 2026-04-22
([blog](https://lingui.dev/blog/2026/04/22/announcing-lingui-6.0)): ESM-only distribution,
Node 22.19+ required, install footprint cut 62 MB to 35 MB for the core set, transitive tree
146 to 104 packages (their measured numbers, for core+react+cli). Runtime core is 2,116 B
min+gz, the smallest of any candidate. ICU MessageFormat is the native catalog format
(gettext `.po` source compiled to JS). `@lingui/macro` has no v6: the macro moved into
`@lingui/babel-plugin-lingui-macro` referenced directly from the Babel config, and
`babel-plugin-macros` is deprecated as of v6. Plural resolution constructs
`Intl.PluralRules` at runtime (verified in `@lingui/core/dist/index.mjs`), and the official
React Native tutorial mandates polyfilling `Intl.Locale` and `Intl.PluralRules`, importing
from `/polyfill-force` because the conditional-detection code "runs very slowly on Android"
(their words). `@lingui/metro-transformer` 6.8.0 compiles `.po` files on the fly, adding a
transformer stage to Metro. Testing story is documented (`i18n.load` plus `I18nProvider`
wrapper). 5,899 stars, 60 open issues, active development.

**react-intl 12.1.3 (FormatJS).** Depends on `@formatjs/intl` 6.1.2 and
`intl-messageformat` 12.1.2. ICU-native messages, the richest formatting API of the set.
`@formatjs/intl`'s `createFormatters` memoises `new Intl.DateTimeFormat`, `NumberFormat`,
`PluralRules` per locale and reads `RelativeTimeFormat`, `ListFormat`, `DisplayNames`;
every one of those except `DateTimeFormat` and `NumberFormat` is missing on Hermes, and the
library calls `onError(MISSING_INTL_API)` when they are absent (verified in the published
`index.js`). The FormatJS polyfill family exists precisely for this, at the sizes in section
4. Maintenance is the strongest here: 14,745 stars, 9 open issues, commits within the last
week.

**intl-messageformat standalone.** The ICU engine without React bindings: 10,126 B min+gz,
3 packages. This is what `i18next-icu` 2.4.4 wraps to give i18next ICU messages, but its
peer range pins `intl-messageformat >=10.3.3 <12`, so it is incompatible with the current
12.x line until updated. Relevant only as a building block.

**expo-localization.** Reads device preferences and nothing else. The entire v58 TypeScript
surface is `getLocales`, `getCalendars`, `useLocales`, `useCalendars` and their types
(verified in `build/Localization.d.ts`): language tags, text direction, calendar, timezone,
24-hour clock, separators, currency. It does not translate, interpolate, pluralise, load
catalogs or switch languages. It is the natural detection source in this repo because it is
versioned with the SDK (`next` dist-tag 58.0.1 aligns with the SDK 58 preview line) and
jest-expo mocks it. The config plugin also lets the app declare supported locales for the
store listing.

**react-native-localize.** Same job as `expo-localization` plus
`prefers24HourClock`, handlers for locale-change events, and currency/temperature
convenience getters. Zero JS dependencies, 384 B min+gz on the JS side, and the native
module ships a codegen'd TurboModule spec (`codegenConfig` in its package.json), so it is
New Architecture native. Choosing it over `expo-localization` adds a second native module
to align on every SDK bump. Either is fine; the Expo-pinned one is the better fit here.

**i18n-js 4.5.3.** Ships `make-plural` 7.5.0 as a dependency, so its pluralisation works
with zero `Intl` support, the only library in the set for which that is true. Costs:
`lodash` and `bignumber.js` in the dependency list, 14,189 B min+gz, a Ruby-on-Rails
heritage API (`I18n.t`, locale with fallback chain), no compile-time key safety, and the
quietest maintenance of the established options (last release March 2026, one maintainer).

**intlayer, Tolgee.** Both are 2026-era and genuinely shipped in production apps, and both
centre on a service or CDN delivery model (Intlayer's editor and CDN, Tolgee's dev-server
and platform). D3 forbids a network round trip for language switching and the app must work
fully offline; both can run with local dictionaries, but their centre of gravity fights the
constraint. intlayer's React Native package draws 12.5k weekly downloads, three orders of
magnitude below i18next. Not shortlisted further.

**Roll-your-own.** A typed object catalog (`en.json` as the source of truth,
`keyof typeof` for key safety), a `t(key, vars)` function with `{{var}}` interpolation, a
generated per-language plural-category table, and a Jotai `atomWithStorage` language atom
over MMKV following `stores/ui.ts`. The repo ladder ("does this need to exist? already in
the codebase? stdlib? native platform? installed dependency? one line? only then the
minimum that works") lands here: the stdlib `Intl` covers date formatting the app already
uses, the native platform covers detection, and the remaining gap is a lookup with
interpolation. Costed honestly in sections 4 through 8.

### 3.3 TypeScript key safety

| Candidate | Compile-time key checking | Mechanism | Cost |
| --- | --- | --- | --- |
| i18next | Yes | `CustomTypeOptions.resources` from one language's JSON; selector API `t($ => $.key)` default in v26 | Type-level only; docs warn of compile-time impact on large sets, mitigated by `enableSelector: "optimize"` |
| Lingui | Yes | Macros are checked at the call site; catalogs are generated with types | Requires the Babel plugin in the editor's TS server path for macro types |
| react-intl | Partial | `defineMessages` gives per-message typing; keys are strings unless you build a union | Manual |
| i18n-js | Weak | Declarations possible, not first-class | Manual |
| Roll-your-own | Yes | `t: (key: keyof typeof en, vars?: Vars<K>) => string` | One type; zero dependencies; breaks the build on a bad key |

## 4. The Intl question

### 4.1 What Hermes exposes, verified

From `facebook/hermes` `doc/IntlAPIs.md` and `doc/Features.md` on `main` (2026-09-29), and
consistent with the RN 0.88.0-rc.2 pin `hermes-compiler@260318099.0.3`:

| API | Android | iOS | Notes |
| --- | --- | --- | --- |
| `Intl.Collator` | Yes (`supportedLocalesOf`, `compare`, `resolvedOptions`) | Yes | |
| `Intl.NumberFormat` | Yes (`format`, `resolvedOptions`; `formatToParts` Android-only) | Yes | iOS lacks `notation: compact/engineering`, `compactDisplay`, `signDisplay`. Android 9 and older: 'Percent' unit rejected, unit symbol and significant-digit rough edges (SDK <29 section of the doc) |
| `Intl.DateTimeFormat` | Yes | Yes | Both lack `formatMatcher`; iOS lacks `numberingSystem`. Android 9 lacks `dayPeriod`, `fractionalSecondDigits`. The repo already relies on `DateTimeFormat` with `en-US-u-ca-islamic-umalqura` in `shared/time.ts` and it works on the 3T |
| `Intl.getCanonicalLocales` | Yes | Yes | |
| `String.prototype.localeCompare` and `toLocale*Case` | Yes | Yes | |
| `Intl.PluralRules` | **No** | **No** | Features.md "Planned"; issue #1462 open |
| `Intl.ListFormat` | **No** | **No** | "Planned" |
| `Intl.RelativeTimeFormat` | **No** | **No** | "Planned" |
| `Intl.DisplayNames` | **No** | **No** | "Planned" |
| `Intl.Locale` | **No** | **No** | "Planned" |
| `Intl.Segmenter`, `Intl.DurationFormat` | **No** | **No** | "Planned" / newer |

Platform data variance is real and documented: the OnePlus 3T runs Android 9 with ICU4J
60.2, CLDR 32.0.1, Unicode 10.0, versus Android 11's ICU 66.1 / CLDR 36.1. Any string that
depends on platform ICU (date names, calendar behaviour) can differ between the floor device
and a modern phone. The app already lives with this for Hijri dates.

### 4.2 The intl build flag and APK cost

The old `NOINTL`/`INTL` artifact split documented in `IntlAPIs.md` (57 to 62 KB per ABI,
measured by the Hermes team on a test app) no longer applies to what React Native ships:
the 0.88.0-rc.2 Gradle plugin pins a single `com.facebook.hermes:hermes-android` version
string with no flavour dimension (verified in `DependencyUtils.kt` and `ReactExtension.kt`
at the tag), and the Maven directory for `260318099.0.3` contains exactly one release AAR
(85,411,457 B) with no intl variant. `Intl` support is compiled in and cannot be toggled by
an app. The APK-diff tables in the Hermes doc are historical measurements of a split that
no longer exists; treat the 57 to 62 KB figure as context, not a current option.

### 4.3 Polyfill inventory, measured raw bytes

| Package | File | Raw bytes | Notes |
| --- | --- | --- | --- |
| `@formatjs/intl-pluralrules@6.3.15` | `polyfill-force.js` | 46,780 | Installs unconditionally; FormatJS's own RN guidance says use force on Android because detection is slow |
| `@formatjs/intl-pluralrules@6.3.15` | `polyfill.js` | 49,313 | With feature detection |
| `@formatjs/intl-pluralrules@6.3.15` | `locale-data/ar.js` | 2,623 | Per-locale data; `ru.js` is 2,575 |
| `@formatjs/intl-locale@5.3.12` | `polyfill-force.js` | 102,761 | Required by Lingui's RN path; unpacked package is 1.2 MB |
| `intl-pluralrules@2.0.1` (eemeli) | `plural-rules.js` | 35,517 | CJS, all locales compiled in via `make-plural`, zero deps, ISC. The Hermes maintainer's own issue #1462 names it as the working alternative |
| `make-plural@8.1.0` | rules per locale | ~300 B to 1 KB per locale | Unicode-DFS-2016. Usable as a devDependency to generate a table at authoring time |
| `@formatjs/intl-numberformat@9.4.3` | unpacked | 110,349,172 B package | Locale data for all locales; only needed for `formatToParts`-heavy use |
| `@formatjs/intl-datetimeformat@7.8.0` | unpacked | 140,721,344 B package | Same; the app does not need it, `Intl.DateTimeFormat` exists on Hermes |

A force-polyfill set of `intl-locale` + `intl-pluralrules` plus two locale-data files costs
roughly 155 KB of raw bundle bytes before minification. The eemeli plural rules alone cover
the whole need for 35.5 KB if `Intl.Locale` is not otherwise required.

### 4.4 Does the library need `Intl.PluralRules`? The decisive table

Verified in each library's published code and docs:

| Library | Plural mechanism | Without polyfill on Hermes | Arabic (6 categories) correct? |
| --- | --- | --- | --- |
| i18next 26.4.2 | `new Intl.PluralRules(code, {type})` in `PluralResolver.getRule`; on failure returns `dummyRule` (one/other). Docs: "Since i18next v24 there is no fallback: without Intl only English-style `_one`/`_other` forms resolve" | Degrades silently to one/other | **No.** Wrong reminder copy for counts like 2, 7, 11, 100 |
| Lingui 6.8.0 | `plural()` constructs `Intl.PluralRules` for cardinal and ordinal (verified in `dist/index.mjs`) | ICU plural opcode resolves to `other` or errors; official RN tutorial mandates the polyfills | **No**, unpolyfilled. Yes with the 150 KB force set |
| react-intl 12.1.3 | `@formatjs/intl` memoises `new Intl.PluralRules`; ICU messages without explicit `=n` cases call it | `onError(MISSING_INTL_API)`; message renders fallback | **No**, unpolyfilled |
| i18n-js 4.5.3 | Embedded `make-plural` 7.5.0 rules | Works with zero Intl | **Yes**, out of the box |
| Roll-your-own | Whatever is embedded; a table generated from `make-plural` at authoring time | Works with zero Intl | **Yes**, for every language whose rule was generated |

CLDR plural category counts for languages in the D1 launch set: Arabic 6 (zero, one, two,
few, many, other), Russian 4, Polish 4, Urdu 4, Hindi 2, Bengali 2, Portuguese 2, English 2,
Chinese 1, Japanese 1, Korean 1. The six-category Arabic case is not an edge case for this
app: reminder copy is "Fajr in 7m", and Arabic minute phrases change form at 1, 2, 3 to 10,
and 11 to 99.

## 5. Message format

| Dimension | ICU MessageFormat | i18next JSON v4 | Plain template / flat JSON |
| --- | --- | --- | --- |
| Plain interpolation | `{name}` | `{{name}}` | `{{name}}` or any convention you pick |
| Plurals | `{count, plural, one {...} other {...}}` in-message | Suffix keys `key_one` .. `key_few` outside the message | Per-category keys or an embedded table; your choice |
| Gender / select | `{gender, select, male {...} female {...}}` native | `context` feature (`key_male`, `key_female`) | Manual |
| Nesting | `$t(ref)` in FormatJS; parent lookup | `$t(key)` nesting native | Manual |
| Number and date in-message | `{count, number, ::percent}` etc., resolved by the engine | Formatted values passed in, or `format` helpers configured | You compose with existing `date-fns` / `Intl` code before calling `t` |
| What a human translator sees | One message containing its own grammar; the CLDR standard | Several sibling keys whose relationship is implicit | Simplest possible key-value list |
| What a machine translator sees | Best-in-class: Google, Microsoft, DeepL and every TMS document ICU handling | Supported by TMS i18next adapters; machine pipelines handle `{{var}}` well if told the convention | Generic JSON, supported by every TMS and every LLM batch flow |
| Tooling ecosystem | gettext `.po` toolchain (largest, decades old) plus Crowdin, Lokalise, Phrase, Transifex ICU modes | i18next-parser, locize, Crowdin's i18next JSON type | A script the repo already half-owns (`inventory-strings.py` is an extractor in all but name) |

Assessment for this app. The measured copy surface is 113 display strings plus 25 widget
strings, of which the truly grammar-bearing shapes are: the reminder interval message, the
notification title, possibly a "days remaining" What's New line. There is no gender select
in scope. The prayer names are identifiers first (`MEASURED.md` section 2), so they must not
flow through any message grammar at all. This corpus does not exercise the part of ICU that
justifies ICU. The translator-automation argument matters more: flat JSON is the one format
every TMS, every CAT tool and every LLM-mediated batch translation accepts without setup,
and ICU is the strongest format if a professional vendor pipeline arrives. i18next JSON v4
sits between: universally understood as data, but its plural-suffix convention is invisible
to a translator who is not told about it.

## 6. Catalog loading and offline

### 6.1 Loading strategies

| Strategy | Offline | Cost | Repo-specific risk |
| --- | --- | --- | --- |
| Static `import` of every catalog | Yes | All languages parse and evaluate at startup | 20 catalogs evaluated pre-entry on the SD820 for zero benefit |
| Lazy `require` behind a switch or map, with `inlineRequires: true` (already on in this repo's `metro.config.js`) | Yes | One catalog evaluates on first `t()` of that language | None; `inlineRequires` defers each module's evaluation to first use, which is the exact mechanism the perf campaign tuned (764 ms to 86 ms pre-entry) |
| Dynamic `import()` | Yes | Separate lazy Metro bundle per chunk | **Banned by hard repo lesson**: the widget transform does not apply inside lazy Metro bundles (`ERR_ARGUMENT_CAST`), and build-time transforms do not reach them. Do not use for catalogs or anything widget-adjacent |
| MMKV / disk hot-load | Yes | Catalogs fetched or shipped out-of-band, parsed at runtime | Viable later for OTA-faster-than-releases language drops; redundant while `expo-updates` ships whole JS bundles |

The pattern that fits this repo with zero new machinery:

```ts
const catalogs = {
  en: () => require('./catalogs/en.json'),
  ar: () => require('./catalogs/ar.json'),
  // one line per language; a data decision, not a code change, per D2
} as const;
```

Every candidate library accepts this shape: i18next `addResourceBundle`, Lingui
`i18n.load`, react-intl `messages`, or the hand-rolled `t` reading the object directly.

### 6.2 Catalog bytes, measured on this repo's corpus

Computed from `research/string-inventory.json`: a 150-string representative catalog (all
multi-word copy plus single-word labels), English source, flat keys:

| Format | Per language (raw) | Per language (gzip) | 20 languages | 60 languages |
| --- | --- | --- | --- | --- |
| Flat JSON (i18next or hand-rolled) | 5,317 B | 1,936 B | 104 KB | 312 KB |
| Lingui compiled JS module | 7,895 B | 2,052 B | 154 KB | 463 KB |
| gettext `.po` source | 9,952 B | 2,096 B | 194 KB | 583 KB |

Target-language expansion is not included: Arabic UTF-8 runs 2 bytes per character and
typical target text expands or contracts against English; treat these as English-source
baselines with a factor of roughly 1.0 to 1.5 per language (estimate, not measured).

Two repo-specific facts frame these numbers. The Hermes bundle is 4.4 MB today, so even 60
flat-JSON catalogs add roughly 7 percent. And `enableBundleCompression` defaults to false in
the 0.88 Gradle plugin (verified in `ReactExtension.kt`), which keeps the bundle
memory-mapped and uncompressed in the APK: bundle bytes translate to APK bytes close to one
to one. Gzip figures are irrelevant on device; raw is what ships.

Startup: parsing one 5.3 KB JSON catalog and building lookup structures is sub-millisecond
work even on an SD820 (estimate; not device-measured in this session). With `inlineRequires`
and the lazy-require map, a language that is never selected never evaluates. The startup
budget that matters here (86 ms pre-entry after the perf campaign) is untouched by any
candidate's runtime when only the active catalog loads.

### 6.3 Runtime language switching

| Candidate | Switch without restart | Mechanism |
| --- | --- | --- |
| i18next | Yes | `changeLanguage` emits, subscribed components re-render through `useSyncExternalStore` |
| Lingui | Yes | `i18n.loadAndActivate`; `I18nProvider` re-renders consumers. Their RN tutorial recommends reload-free switching but warns about layout conflicts, which D7's fixed left alignment already neutralises |
| react-intl | Yes | Recreate the `intl` object or swap `IntlProvider` props |
| i18n-js | Yes | Set `I18n.locale` and re-render |
| Roll-your-own | Yes | Write the Jotai atom; every consumer of a derived translated-value atom re-renders. This is the repo's existing pattern (`atomWithStorage` over MMKV in `stores/ui.ts`), and rule 5 of the performance rules (render-granular subscriptions to primitive-valued derived atoms) applies directly |

MMKV residency: the language preference belongs in MMKV through the existing
`atomWithStorage` pattern regardless of candidate. Storing the catalogs themselves in MMKV
buys nothing today (catalogs ship in the bundle; `expo-updates` delivers JS updates OTA),
and it would put translated copy outside the reviewed bundle. Revisit only if languages must
ship faster than app releases, which `expo-updates` already covers.

## 7. Compile-time versus runtime, and the widget stub

| Dimension | Lingui (compile-time macros) | i18next / react-intl / hand-rolled (runtime resolution) |
| --- | --- | --- |
| Bundle with 20 languages | 154 KB compiled JS, all languages as code | 104 KB JSON, one language evaluated |
| Startup on SD820 | Compiled messages are closures, defined at module eval of each catalog; with lazy requires, equivalent | JSON parse of one catalog; equivalent |
| Type safety | At the macro call site, checked during Babel/TS | i18next via `resources` typing; hand-rolled via `keyof typeof` |
| Extraction | `lingui extract` writes `.po`; a required CI step | A script (the repo owns one already) or i18next-parser |
| Failure mode when the build step is skipped | Stale catalogs silently serve old copy | Not applicable; the catalog is the source |
| Interaction with this repo's Metro chain | Adds `@lingui/babel-plugin-lingui-macro` to the Babel chain and optionally `@lingui/metro-transformer` for `.po` compilation, beside the existing `react-native-svg-transformer` override, the `jsx-runtime-shim` resolver redirect, and the `'widget'` transform | No new transform stages |

The widget stub changes the calculus. The stub exports five names (`Fragment`, `Children`,
`isValidElement`, `createContext`, `useContext`), and the durable lesson from `@expo/ui`
58.0.6 and 58.0.7 is that one new module-scope React call in any reachable package blanks
every card, with `widgetRuntimeLoads.test.ts` as the only guard. Under the props-baked
design (translate in the app, bake into timeline props, which `MEASURED.md` already assumes
for the 25 widget strings) no i18n module needs to be reachable from `widgets/*.tsx` at
all. That is the correct posture for every candidate. The compile-time option tempts a
different integration (macros inside widget layouts for translated copy), which would put
the macro's generated code, plus whatever `@lingui/react` drags in, inside the stub's graph:
`@lingui/react` depends on `use-sync-external-store` and calls `useContext` in hooks, all
five-name compatible today, with the same no-guarantee-tomorrow caveat as
`react-i18next`'s module-scope `createContext`. The minimal-exposure rule wins: the widget
graph gets zero i18n imports, whatever the app runtime uses.

Honest counterweight in Lingui's favour: compile-time extraction cannot miss a string that
a grep-based extractor can, and its `.po` workflow is the strongest professional-translation
story. If the owner later contracts a translation vendor, that argument strengthens.

## 8. Testing at 100 percent branch coverage

The repo enforces 100 percent coverage on statements, branches, functions and lines with no
ignore comments, and Jest runs on Node 24, which ships full `Intl`. Two distinct problems:
covering the app's own i18n glue, and writing component tests whose assertions survive
catalog changes.

| Candidate | App-glue coverage burden | Component test pattern (established, cited) | Catalog-change resilience |
| --- | --- | --- | --- |
| Roll-your-own | The `t()` module is maybe 80 to 150 LOC: key lookup, interpolation, plural selection, fallback. Trivially coverable to 100 percent with table-driven tests | `t` is a pure function; components take translated strings from atoms. Assert on keys via a test catalog, or import `en.json` in the test so both sides move together | Strong: tests import the same JSON the app loads |
| i18next + react-i18next | Your init wrapper and atom sync, roughly 50 LOC | Official docs (`react.i18next.com/misc/testing`): a `__mocks__/react-i18next.js` returning `useTranslation = () => [k => k, {...}]`, or initialise the real instance in `setupFiles` with resources. The repo's `shared/__mocks__/` convention already hosts module mocks | Key-echo mock means tests assert keys, immune to copy edits; the price is that no test guards the copy itself, so add a catalog-completeness test (every `en` key exists per language) |
| Lingui | Wrapper plus macro-compiled components | Official guide (`lingui.dev/guides/testing`): `i18n.load` then `i18n.activate('en')` in test setup, RNTL `wrapper` with `I18nProvider`. Requires the Babel plugin active in Jest (shared `babel.config.js`, no extra config) | Same as i18next: assert keys or assert against the compiled catalog |
| react-intl | Provider setup | `IntlProvider` with `messages`, or `createIntl` for logic tests. The key-echo trick (map each id to itself) is the standard way to avoid English assertions | Same |

Two repo-specific traps worth naming in the plan:

1. **The Node/Hermes `Intl` divergence.** A plural path written against `Intl.PluralRules`
   passes every Jest test and renders wrong on both platforms. Whatever ships needs a canary
   test that stubs `Intl.PluralRules` to `undefined` (the repo already spies
   `Intl.DateTimeFormat.prototype.formatToParts` in `shared/__tests__/time.test.ts`, so the
   technique is established) and asserts the plural categories still resolve. This is only
   possible when the rules are embedded (hand-rolled table, i18n-js, or a polyfilled
   library, where the canary proves the polyfill is imported on the app entry path).
2. **Module evaluation order.** `metro.config.js` notes that Jest's graph is eager where the
   device's is lazy. An i18n module that mutates globals at module scope (polyfills do:
   `Intl.PluralRules = ...`) evaluates in a different position in tests than on device. The
   polyfill import belongs at the very top of the true entry module, and the canary test
   must reconstruct the stubbed-out state it needs rather than relying on import order.

For the hand-rolled option specifically, the suite shape is: key lookup and fallback
branches, interpolation (present, missing, extra), plural table per language against CLDR
sample counts (0, 1, 2, 3, 7, 10, 11, 26, 100, 101 for Arabic; 1, 2, 5, 21 for Russian; and
so on, parameterised), and catalog completeness across every shipped language. That is a
few hundred lines of tests covering a few hundred lines of code, all first-party.

## 9. Notification copy and the re-arm constraint

Measured facts that fix the design:

- iOS `UNUserNotificationCenter` freezes the content of a scheduled request at schedule
  time. Android's `NotificationBuilder` resolves every string when the notification is
  built. Neither platform re-localises a pending notification at delivery. The D12 table's
  right-hand column is therefore the only JS-side option: a language change cancels and
  re-arms the plan, up to `NOTIFICATION_REQUEST_BUDGET` = 64 requests, reusing the
  `commitSoundSelection` pattern and inheriting session 33's partial-failure risk.
- The native-resource alternative (per-locale `InfoPlist.strings` /
  `res/values-<locale>/strings.xml`) would localise at delivery only on Android and only
  for framework-resourced strings; athan copy is composed in JS (`${name} now`,
  `${name} in ${intervalMinutes}m`), so it would still be frozen at schedule. It also
  demands a second catalog format kept in step. Reject.
- The library requirement is that translation be callable from `stores/notifications.ts`
  at schedule time as a synchronous plain function. `i18next.t`, `i18n.t` from
  `@lingui/core`, `createIntl(...).formatMessage`, and a hand-rolled `t` all qualify.
  Hook-only consumption (`useTranslation`, `useIntl`) does not, and the scheduling path is
  not a component.

The prayer name inside notification copy stays English under D5 unless the owner rules
otherwise (open point from D12); the library choice does not affect it.

## 10. Language detection

`expo-localization` 58.0.1 is the recommendation: SDK-aligned versioning, sync
`getLocales()`, `textDirection` per locale (useful metadata even with D7's fixed left
alignment, since bidi text inside a `Text` node is handled by the Unicode algorithm
regardless), config plugin for store-facing locale declarations, jest-expo compatibility.
`react-native-localize` 3.7.2 is equally capable (plus locale-change listeners) and its
TurboModule is New-Architecture native, but it adds a second native module to track across
SDK bumps for data `expo-localization` already returns. Neither translates anything.

First-run default: `getLocales()[0].languageTag`, matched against the shipped catalog list,
falling back to English. Persisted choice lives in an `atomWithStorage` MMKV atom.

## 11. Verdict

### 11.1 Decision table

Scores are 1 to 5, 5 best, judged against this repo's constraints and measured data.

| Criterion (weight) | Roll-your-own | i18next + react-i18next | Lingui v6 | react-intl | i18n-js |
| --- | --- | --- | --- | --- | --- |
| Runtime size (min+gz + polyfills) | 5 (~0 + catalogs) | 3 (24 KB + 46.8 KB plural polyfill) | 3 (3.9 KB + ~150 KB mandated polyfills) | 2 (25 KB + ~150 KB polyfills) | 3 (14.2 KB, no polyfill) |
| New runtime dependencies | 5 (zero) | 2 (5, or 8 with polyfill) | 2 (~14 with polyfills) | 2 (~11) | 3 (3) |
| Arabic / CLDR plurals correct on Hermes | 5 (embedded table) | 3 (polyfill required and often forgotten; documented trap) | 4 (polyfill mandated by their RN guide) | 3 (polyfill + onError path) | 5 (make-plural embedded) |
| Widget-stub safety | 5 (no React anywhere) | 4 (module-scope `createContext` survives; keep out of widget graph) | 4 (same class; keep out) | 4 (same) | 5 (no React) |
| 100 percent branch coverage of glue | 5 (own 100 LOC) | 4 (own wrapper + official mock pattern) | 3 (wrapper + macro coverage through Babel in Jest) | 3 (provider setup + `createIntl` for logic) | 4 (plain functions) |
| Compile-time key safety | 5 (`keyof typeof`) | 5 (resources typing + selector API) | 4 (macro call-site) | 3 | 2 |
| Offline, zero network on switch | 5 | 5 | 5 | 5 | 5 |
| Translation-automation ecosystem | 3 (generic JSON; own extractor) | 5 (i18next-parser, locize, Crowdin adapters) | 5 (gettext + ICU tooling) | 4 (ICU) | 3 |
| Maintenance risk carried by you | 3 (you own the table) | 5 (14 years, 25M weekly) | 4 (active, 60 open issues) | 5 (Meta-affiliated, very active) | 3 |
| Integration risk in this repo's build chain | 5 (nothing new) | 4 (packages only) | 2 (Babel plugin + ESM-only + optional metro transformer beside svg-transformer and the shim) | 4 (packages only) | 4 |
| Adding language 21 is a data decision (D2) | 5 | 5 | 5 | 5 | 5 |

### 11.2 Ranked recommendation

**Rank 1: hand-rolled typed catalog plus `t()`, embedded CLDR plural table, zero runtime
dependencies, `expo-localization` for detection.**

Reasoning, laid out:

- The measured problem is 113 display strings, 25 widget strings, roughly two plural-bearing
  message shapes, and a bilingual prayer row that must not flow through message grammar at
  all. The general-purpose machinery in every candidate exists for problems this app does
  not have: namespaces, lazy backend loading, ICU number formatting inside messages,
  server-driven translation delivery.
- The repo ladder in `ai/AGENTS.md` resolves to the same place: detection is native
  (`expo-localization`), date formatting is stdlib (`Intl.DateTimeFormat`, already in use),
  state is installed (`Jotai` plus MMKV atoms, pattern in `stores/ui.ts`), and what remains
  is a lookup with interpolation: one function.
- The two hostile runtimes both prefer it. The widget graph gets no i18n imports under any
  candidate, but a pure `t` also cannot regress into the stub graph by accident of a
  transitive update. The notification path needs a synchronous plain function, which is all
  a hand-rolled `t` is.
- The 100 percent coverage mandate turns from a liability into a specification: the plural
  table and fallback logic get first-party tests, including the Node/Hermes canary.
- Plural correctness for Arabic, Russian, Polish and Urdu comes from a generated table
  (dev-time dependency on `make-plural` or an equivalent CLDR source), a few hundred bytes
  per language, with zero dependence on `Intl.PluralRules`.
- Migration risk is bounded: flat JSON keys map one to one onto i18next resources. If the
  app later outgrows the hand-rolled layer, the catalogs move unchanged; only call sites
  change from `t('key')` to `t('key')`. Rank 2 remains one afternoon away.

**Rank 2: `i18next` + `react-i18next`, with `@formatjs/intl-pluralrules` force-polyfilled on
the entry path.**

The industry default, and the right one the moment the owner's translation workflow becomes
professional: a TMS (locize, Crowdin) with `saveMissing`, `i18next-parser` extraction in CI,
review states and vendor handoff. Costs accepted with eyes open: 5 to 8 packages, 24 KB
min+gz plus a 46.8 KB raw polyfill, and the documented no-fallback plural trap that this
report's canary test must pin. Choose it if D1's "unlimited languages" comes with a
translation-operations budget.

**Rank 3: Lingui v6.** The smallest runtime and the best message format for professional
translators. Ranked third only because of this repo's build chain: an ESM-only dependency
tree, a Babel macro plugin that must run in Metro and Jest, an optional Metro transformer
stage, all beside the existing svg transformer, the jsx-runtime shim redirect and the
widget transform, plus roughly 150 KB of mandated `Intl` polyfills on a Hermes engine that
will never need them natively. In a greenfield Expo app without the widget-stub constraint
it would rank second.

**Rank 4: react-intl.** Heaviest, polyfill-bound, and its core strength duplicates
`date-fns` plus existing `Intl` usage. Its impeccable maintenance does not offset that in
this corpus.

**Rank 5: i18n-js.** Genuinely solves the Hermes plural problem out of the box, which is why
it survives on the list, but `lodash` in 2026, the weakest type story, and the quietest
maintenance of the established options put it last.

## 12. The 2 / 20 / 60 crossover

| Scale | Pick | Why |
| --- | --- | --- |
| 2 languages | Hand-rolled, unconditionally | A JSON file and one function beat 24 KB min+gz, 5 packages and a polyfill. i18next's advantages (TMS, namespaces, lazy backends) are all scale advantages |
| 20 languages (D1 launch) | Hand-rolled | Catalogs are 104 KB of data either way; the decision axes (plurals, coverage, widget graph) all still point the same way. i18next becomes defensible, not necessary |
| 60 languages | i18next + polyfill, unless the team stays at one contributor and copy remains stable | Past roughly 40 languages the operations burden dominates: fallback chains across regional variants (`pt` versus `pt-BR`), CLDR rule updates, key-extraction CI, per-language completeness dashboards. Upstream maintenance of those is worth 24 KB plus a polyfill |

The crossover variable is not language count alone; it is the arrival of a translation
workflow with more than one human in it. A single contributor with LLM-assisted batch
translation and a completeness test scales the hand-rolled catalog past 60 languages without
code changes, because a language is one JSON file. The moment a vendor or a TMS with review
states enters, i18next's tooling pays for itself. State the rule to the owner as: one
contributor and flat JSON, hand-rolled; a translation pipeline with humans and review
states, i18next.

## 13. Strongest argument against the recommendation

The hand-rolled plural table re-implements, without fourteen years of battle testing, the
exact edge cases i18next and CLDR maintainers have already fixed: Arabic's six categories,
Russian's `many` versus `other` for fractions, Welsh and Irish ordinals if ever added,
Czech's `many` handling under JSON v4. A silent mistake in that table ships wrong prayer
reminder copy to every Arabic speaker, and the app's core promise is timing and trust; the
in-house table has no community watchdog filing issues when CLDR revises a rule. i18next's
degradation mode is also quieter to diagnose in reverse: it is the best-documented trap in
the ecosystem, while a bespoke table's bug is a private bug.

Mitigations, which the plan should adopt as acceptance criteria rather than intentions:
generate the table from a CLDR-derived source (`make-plural` or the FormatJS locale data),
never hand-write it; pin it with exhaustive per-language count tests (the CLDR spec
illustrations enumerate sample counts per category); add the `Intl.PluralRules`-deleted
canary; and keep the catalog format one-to-one with i18next resources so a later migration
is mechanical.

## 14. Assumptions made

- The 150-string measured catalog is representative of the final translated surface (113
  display plus 25 widget strings per `MEASURED.md`; the inventory's full 194 includes
  identifiers and doc examples that must never be translated).
- Plural-bearing copy is limited to notification and reminder shapes plus occasional What's
  New lines. If product copy grows dialogue-rich text, the ICU-leaning options strengthen.
- D7 (fixed left alignment, no mirroring) stands, so `I18nManager.forceRTL` and layout
  mirroring are out of scope for every candidate.
- The widget props-baked design stands: widget copy is translated in the app process and
  pushed as data. No candidate is evaluated for use inside widget layouts.
- Language switching re-arms notifications per D12's schedule-time column; this report
  treats the re-arm choreography as the plan's concern, not the library's.
- `expo-updates` remains the OTA channel, so MMKV catalog hot-loading is not required.

## 15. UNVERIFIED items

| Claim | Status | What would verify it |
| --- | --- | --- |
| i18next `lng: 'cimode'` returns raw keys, as a test mode | Not confirmed against v26 docs in this session | Read `i18next` 26.4.2 `LanguageResolver` / interpolator code, or run a one-line Node script against the installed package |
| Sub-millisecond parse of one 5.3 KB catalog on the SD820 | Estimate from corpus size, not device-measured | One `react-native-performance` mark around first `t()` on a 3T release build |
| `make-plural` 8.1.0's CLDR version | Not read from its package | Check `make-plural` repo changelog; cross-check any rule against current CLDR before generating the table |
| Lingui v6 under Yarn 1 with `unstable_enablePackageExports` in this repo's exact Metro config | Inferred from Metro 0.87 docs and Expo discussion #36551, not built | A spike: install `@lingui/core@6` in a branch, require it through Metro and through Jest |
| `react-native-localize` on the New Architecture in RN 0.88-rc.2 specifically | Codegen spec present in its package; runtime not exercised here | A one-hour spike on the 3T if it is ever preferred over `expo-localization` |
| Bundlephobia figures for `expo-localization` | Service returned a build error for this package | Measure the JS entry from the unpacked tarball, or accept the negligible size of a thin native wrapper |

## 16. Sources

- npm registry documents (versions, dependencies, dates, dist-tags): `registry.npmjs.org`
  for `i18next`, `react-i18next`, `@lingui/*`, `react-intl`, `@formatjs/intl*`,
  `intl-messageformat`, `expo-localization`, `react-native-localize`, `i18n-js`,
  `intl-pluralrules`, `make-plural`, `i18next-icu`, `intlayer`, `@tolgee/react`,
  `hermes-compiler`, `use-sync-external-store`. Read 2026-09-29.
- Bundlephobia size API for the packages in section 3. Read 2026-09-29.
- Hermes `Intl` support: `https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md`,
  `.../doc/Features.md`, issue `#1462`. Read 2026-09-29.
- RN 0.84 Hermes V1 default: `https://reactnative.dev/blog/2026/02/11/react-native-0.84`.
- RN 0.88.0-rc.2 Gradle plugin sources at tag `v0.88.0-rc.2` (`ReactExtension.kt`,
  `DependencyUtils.kt`); Hermes artifacts at
  `https://repo.reactnative.dev/maven2/com/facebook/hermes/hermes-android/260318099.0.3/`.
- Metro package-exports history: `https://metrobundler.dev/docs/package-exports/`,
  Expo discussion `https://github.com/expo/expo/discussions/36551`.
- i18next plurals and TypeScript docs: `https://www.i18next.com/translation-function/plurals`,
  `https://www.i18next.com/overview/typescript`.
- react-i18next testing docs: `https://react.i18next.com/misc/testing`.
- Lingui v6 announcement: `https://lingui.dev/blog/2026/04/22/announcing-lingui-6.0`.
  React Native tutorial: `https://lingui.dev/tutorials/react-native`. Testing guide:
  `https://lingui.dev/guides/testing`. Installation: `https://lingui.dev/installation`.
- FormatJS polyfill docs: `https://formatjs.github.io/docs/polyfills/`,
  `.../docs/polyfills/intl-pluralrules/`; `@formatjs/intl` 6.1.2 published `index.js`.
- expo-localization API: `https://docs.expo.dev/versions/latest/sdk/localization/` and the
  published `build/Localization.d.ts` at 58.0.1.
- Jest/Hermes `Intl` divergence: `https://github.com/callstack/react-native-testing-library/issues/1707`.
- Download counts: `https://api.npmjs.org/downloads/point/last-week/<pkg>`, week ending
  2026-09-28.
- In-repo measured inputs: `ai/plans/39-localisation/research/string-inventory.json`,
  `MEASURED.md`, `OWNER-DECISIONS.md`, `ai/AGENTS.md`, `metro.config.js`, `package.json`.
