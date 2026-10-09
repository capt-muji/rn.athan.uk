# Verification: Architecture (typed TS catalogs, hand-rolled `t()`, i18next-JSON bridge)

| Field | Value |
| --- | --- |
| Base | `uat` `52109ec0` (1.29.303) |
| Date | 2026-10-09 |
| Claim under test | Flat `as const` TypeScript catalogs, a roughly 20-line `t()` and a tested i18next-JSON bridge are best practice for this app at six languages once six forced changes land. Lingui plus Crowdin is right only at fifty locales with community proofreaders. |
| Result | 6 confirmed, 11 contradicted, 2 uncertain |

The central choice survives: no i18n library at six languages on this stack. The record around it does
not. Six of the contradictions are MAJOR and all six sit in what the design leaves outside `t()`:
dates, widget text, native strings, the string count, the guard and the bridge format.

## Method

**Record files read in full:** `ai/AGENTS.md`, `SINGLE-LANGUAGE-PIVOT.md`, `OWNER-DECISIONS.md`,
`PLAN.md`, `research/R16-ARCHITECTURE.md`, `research/R1-LIBRARY-LANDSCAPE.md`,
`research/R2-TRANSLATION-PIPELINE.md`, `research/R5-PRODUCTION-ENGINEERING.md`, `R1-FINDINGS.md`,
`R2-FINDINGS.md`, `R5-FINDINGS.md`, `PLURAL-EVIDENCE.md`, `SPIKE-EVIDENCE.md`, `LOCALIZATION-API.md`,
`CATALOG-EVIDENCE.md`, `research/R17-SCALE-AND-FONTS.md`, `research/R8-FIRST-RUN-LOCALE.md`,
`research/string-inventory.json`, and the scripts `inventory-strings.py`, `classify-strings.py`,
`plural-surface.py`.

**Code read in full:** `shared/time.ts`, `shared/notifications.ts`, `shared/qiblaPlace.ts`,
`device/qibla.ts`, `device/tasks.ts`, `app.json`, `app.config.ts`, `metro.config.js`. Partial code
reads are listed under "Not verified".

**Ran:**

- An in-memory copy of the regex in `scripts/inventory-strings.py:10` over the tree at `52109ec0`
  (the script itself rewrites a record file, so it was not executed).
- `python3 ai/plans/39-localisation/scripts/plural-surface.py` (read-only).
- `grep -rnE '`[^`]*\$\{[^`]*`'` over `app components hooks stores shared device api widgets modules`,
  tests and logger lines excluded, then a hand classification of the 134 hits.
- A synthetic type-check in a scratch folder outside the tree: fifty catalogs of 164 keys, each
  `as const satisfies Catalog`, a typed `t()`, run with the repository's `tsc` 7.0.2 and
  `--extendedDiagnostics`.
- A synthetic bytecode measurement in a scratch folder: the repository's `hermesc`
  (`node_modules/hermes-compiler`, 260318099.0.4) with `-emit-binary -O` over one and fifty 164-key
  catalogs. No project build ran.
- `node -e` date probes on Node 24.14.1 (ICU 78.2, CLDR 48) for `en-US ar ms so hi th`.

**External primary sources, fetched raw on 2026-10-09:**

| Source | URL |
| --- | --- |
| Hermes Intl source at the pinned tag | `https://raw.githubusercontent.com/facebook/hermes/hermes-v260318099.0.4/lib/VM/JSLib/Intl.cpp` |
| Hermes Intl document at the pinned tag | `https://raw.githubusercontent.com/facebook/hermes/hermes-v260318099.0.4/doc/IntlAPIs.md` |
| i18next JSON format | `https://raw.githubusercontent.com/i18next/i18next-gitbook/master/misc/json-format.md` |
| i18next plurals | `https://raw.githubusercontent.com/i18next/i18next-gitbook/master/translation-function/plurals.md` |
| Lingui React Native tutorial | `https://raw.githubusercontent.com/lingui/js-lingui/main/website/docs/tutorials/react-native.md` |
| Paraglide JS README | `https://raw.githubusercontent.com/opral/paraglide-js/main/README.md` |
| `Intl.MessageFormat` proposal | `https://raw.githubusercontent.com/tc39/proposal-intl-messageformat/main/README.md` |
| MessageFormat working group | `https://raw.githubusercontent.com/unicode-org/message-format-wg/main/README.md` |
| Expo localisation guide | `https://raw.githubusercontent.com/expo/expo/main/docs/pages/guides/localization.mdx` |
| hermes-intl README | `https://raw.githubusercontent.com/magrinj/hermes-intl/main/README.md` |
| Weblate i18next and JSON formats | `https://raw.githubusercontent.com/WeblateOrg/weblate/main/docs/formats/i18next.rst`, `.../formats/json.rst` |
| npm registry metadata | `https://registry.npmjs.org/<package>` |

## Findings

### ARCH-1. CONFIRMED: Hermes for React Native 0.88.0-rc.3 ships no `Intl.PluralRules`, `DisplayNames`, `Locale`, `RelativeTimeFormat`, `ListFormat` or `Segmenter`

- **Record says:** Hermes implements `NumberFormat`, `DateTimeFormat` and `Collator` and not
  `PluralRules` (`R1-FINDINGS.md` "The trap", `research/R16-ARCHITECTURE.md` (a) item 3). R1 marks
  this "not independently verified here".
- **Evidence:** `node_modules/react-native/package.json:168` pins `hermes-compiler` `260318099.0.4`
  and `node_modules/react-native/sdks/hermes-engine/version.properties` reads
  `HERMES_VERSION_NAME=260318099.0.4`. At that tag `lib/VM/JSLib/Intl.cpp:1746-1777`
  (`createIntlObject`) defines `getCanonicalLocales` and then exactly three constructors:
  `vm::defineIntlCollator`, `vm::defineIntlDateTimeFormat`, `vm::defineIntlNumberFormat`. A grep of
  the whole 1,783-line file for `PluralRules|DisplayNames|RelativeTimeFormat|ListFormat|Segmenter`
  returns nothing. `formatToParts` is registered for `DateTimeFormat` (line 985) and `NumberFormat`
  (line 1299). `doc/IntlAPIs.md` at the same tag lists the same three services under "Supported on
  both platforms". The document is identical on `main`, and `main` still registers no fourth
  constructor.
- **Attack tried:** Looked for a later Hermes that closes the gap. `main` on 2026-10-09 registers the
  same three constructors (`Intl.cpp:1688-1702` region). The third-party `hermes-intl` README still
  advertises native `PluralRules`, `RelativeTimeFormat`, `ListFormat` and `Locale` as its reason to
  exist.
- **Consequence:** None for the verdict. The canary rule and the no-plural-machinery posture rest on
  a fact that holds. The device log line in `R1-FINDINGS.md` is no longer needed to decide the
  library question. It stays useful as a regression probe.

### ARCH-2. CONTRADICTED (MAJOR): `Intl.DisplayName` cannot localise the qibla place name

- **Record says:** The `placeName` gap "closes by formatting the geocoded place through the app
  locale (`Intl.DisplayName`)" (`SINGLE-LANGUAGE-PIVOT.md` synthesis finding 23d).
- **Evidence:** Three independent failures. (1) The API is `Intl.DisplayNames` and Hermes does not
  ship it (ARCH-1). (2) `Intl.DisplayNames` names regions, languages, scripts and currencies from
  codes. It never translates free text. `shared/qiblaPlace.ts:11-17` defines `PlaceParts` as
  `city`, `district`, `subregion`, `region`, `country`, all free text, with no ISO code.
  `shared/qiblaPlace.ts:39-46` builds `` `${locality}, ${country}` `` from those strings. (3) The
  text comes from `Location.reverseGeocodeAsync(position)` at `device/qibla.ts:68`, and the installed
  `expo-location` 58.0.12 declares that function with a position argument only
  (`node_modules/expo-location/build/Location.d.ts:105`). There is no locale parameter to pass.
- **Attack tried:** Looked for a code path that carries an ISO country code to format, and for a
  geocoder option that takes a language. Neither exists.
- **Consequence:** Finding 23d must be rewritten. A city name cannot be produced by any `Intl` call
  on any engine, and the geocoder cannot be told the app language. The place line therefore follows
  the platform locale. The owner must rule it a named exception to D17, or rule that the line is
  hidden when the app language differs from the device language.

### ARCH-3. CONTRADICTED (MAJOR): month names are not "the existing formatter with the locale tag swapped"

- **Record says:** "Hijri and Gregorian dates format through `Intl` pinned to `en-US` month names"
  (`SINGLE-LANGUAGE-PIVOT.md` code fact 6, citing `shared/time.ts:241-243`). Q9 and D23 add that one
  `Intl` call per calendar localises both, "so the mechanism is the existing formatter with the
  locale tag swapped", with "formats and day-month order unchanged".
- **Evidence:**
  - The Gregorian label is not `Intl`. `shared/time.ts:232` is
    `return format(new Date(year, month - 1, day, 12), 'EEE, d MMM yyyy');`, the `date-fns`
    formatter with its default English locale. There is no tag to swap.
  - `date-fns` 4.4.0 ships no Somali locale: `node_modules/date-fns/locale/so.js` is absent, while
    `ar`, `ms`, `hi` and `th` exist. Somali is in the milestone six.
  - The pattern carries a weekday (`EEE`). D23 rules on month names only. No ruling covers the
    weekday abbreviation, and D17 requires it to follow the language.
  - The Hijri path strips an English suffix: `shared/time.ts:250`
    `hijriFormatter.format(getDayAnchor(date)).replace(/ AH$/, '')`.
  - Swapping the tag changes order, era position and, for Thai, the year. Node 24.14.1 output for
    `{ day: 'numeric', month: 'long', year: 'numeric' }` on `<lang>-u-ca-islamic-umalqura`:

    | Tag | Hijri output | After the `/ AH$/` strip |
    | --- | --- | --- |
    | `en-US` | `Rabiʻ II 28, 1448 AH` | `Rabiʻ II 28, 1448` |
    | `ar` | `28 ربيع الآخر 1448 هـ` | unchanged, era suffix kept |
    | `ms` | `28 Rabiulakhir 1448 H` | unchanged, era suffix kept |
    | `so` | `Rabic al-thani 28, 1448 AH` | `Rabic al-thani 28, 1448` |
    | `hi` | `AH 28 राबी द्वितीय 1448` | unchanged, era prefix kept |
    | `th` | `28 รอบี II ฮ.ศ. 1448` | unchanged, era infix kept |

    The Gregorian probe for `th` prints `ศุกร์ 9 ต.ค. 2569`, a Buddhist-era year, unless
    `-u-ca-gregory` is pinned.
  - Two widget parsers depend on the English shape. `widgets/PrayerWidget.tsx:303-310` and
    `widgets/PrayerWidget.tsx:545-555` take `dateLabel.split(',')[0]`, split on spaces, then build
    `` `${monthPrefix} ${dayNumber}` `` from `dateTokens[0].slice(0, 3)` and the last token. For the
    Arabic output above the result is `28 هـ`. `slice(0, 3)` also cuts Devanagari and Thai month
    names inside a syllable.
  - Hermes projects the platform's own ICU. `doc/IntlAPIs.md` states the cost: "some variance in
    behaviours across Android and iOS platforms. This also includes behavioural variations between
    different versions of Android". Its table gives Android 9 as ICU4J 60.2 with CLDR 32.0.1. The
    record's verification ran on a desktop engine.
- **Attack tried:** Checked whether `formatToParts` rescues the claim. It does exist on Hermes
  (ARCH-1) and `shared/time.ts:52` already uses it, so a parts-based assembly is feasible. That is a
  different mechanism from the one the record names.
- **Consequence:** The plan must replace the "swap the tag" step with one of two designs before
  stage two is written. Preferred: month and weekday names become catalog keys (12 Gregorian,
  12 Hijri, 7 weekdays per language), so the output is identical on Node, Android 9 and iOS, and
  each name is a one-line edit under D33. Alternative: `formatToParts` with `-u-ca-gregory` or
  `-u-ca-islamic-umalqura` and `-u-nu-latn` pinned, the app assembling day, month and year in today's
  order. Either way the widget receives its short footer as a ready-made prop and stops parsing. The
  pre-flight in `PLAN.md` step 15 probes `ur bn fr de`, none of which is in the milestone six.

### ARCH-4. UNCERTAIN: whether the floor phone and the iPhone return localised Hijri and Gregorian month names for the six milestone languages

- **Record says:** Month-name localisation is "verified" for `id, en, ar, tr, ms`
  (`SINGLE-LANGUAGE-PIVOT.md` Q9, synthesis finding 19).
- **Evidence:** The verification engine is not named and cannot have been Hermes. The floor device
  runs CLDR 32.0.1 (Hermes `doc/IntlAPIs.md`). Coverage of Hijri month names for `so`, `hi` and `th`
  at that CLDR level is not established by any source read here.
- **Attack tried:** Node output proves the best case only.
- **Consequence:** If ARCH-3's catalog-key design is adopted this question disappears. Otherwise it
  settles with one log line per language on the Android 9 phone and the iPhone:
  `new Intl.DateTimeFormat('<lang>-u-ca-islamic-umalqura', { month: 'long' }).formatToParts(date)`
  and the same with `-u-ca-gregory`, for `ar ms so hi th`.

### ARCH-5. CONTRADICTED (MAJOR): the string count and the planned guard share one blind spot

- **Record says:** "205 capitalised literals: 123 display copy over 34 files, 25 widget copy"
  (`SINGLE-LANGUAGE-PIVOT.md` code fact 1). The corpus is "123 display strings plus 25 widget strings
  plus the 16 religious terms" (synthesis finding 11). `PLAN.md` step 14 switches a source-scan guard
  on "against a zero-length exclusion list".
- **Evidence:** The count reproduces: the regex at `scripts/inventory-strings.py:10` finds 205
  literals in 48 files at `52109ec0`. The regex is
  `(['"])([A-Z][A-Za-z0-9 ,.'\-!?%:()/&]{2,80})\1`. It matches only quoted literals that start with a
  capital. It cannot see JSX text children, template literals or lower-case literals. Sites it
  misses, none of which appears in `string-inventory.json`:

  | File and line | String |
  | --- | --- |
  | `components/ui/Error.tsx:37-42` | `Oh no!`, `Something went wrong.`, `Try refreshing!`, `Refresh` |
  | `components/sheets/screens/Settings.tsx:86,115,145,158` | `Prayer`, `Display`, `Countdown Bar`, `Other` |
  | `components/sheets/screens/Sound.tsx:178` | `Notification sound` |
  | `components/sheets/screens/Alert.tsx:222-223` | `Athan`, `Notification at prayer time` |
  | `components/sheets/screens/ReminderCard.tsx:70,75` | `Before`, `min` |
  | `components/sheets/screens/ColorPicker.tsx:121,144` | `Reset`, `Select Color` |
  | `components/modals/Update.tsx:17` | `A new version is available.` |
  | `components/day/Day.tsx:48` | `London, UK` |
  | `widgets/LockPrayerWidget.tsx:73-75,112,115` and two repeats each | `ATHAN`, `Open to load times`, `Out of date`, `Open app to refresh` |
  | `shared/time.ts:565` | `now` |

  `components/ui/Error.tsx` appears nowhere in `string-inventory.json` and a grep of
  `research/R13-BLAST-RADIUS.md` for it returns nothing. The guard the record specifies
  (`research/R5-PRODUCTION-ENGINEERING.md` section 2.2, `USER_FACING`) is the same quoted-capital
  shape, so it passes while every string above stays hardcoded. `biome.json` has no `noJsxLiterals`
  entry, and `PLAN.md` section 1 names three gates, none of them that rule.
- **Attack tried:** Checked whether the misses are new since the inventory. `Error.tsx` predates it
  (last touched at 1.25.33).
- **Consequence:** The plan must recount with a scan that sees JSX text and template literals, and
  the step-14 guard must be built on the same scan. The cheapest complete pair is Biome
  `style/noJsxLiterals` with `noStrings: true` (R5 already describes it) for JSX, plus the Jest scan
  extended to backtick literals. The 164-string figure and every byte figure derived from it
  understate the corpus.

### ARCH-6. CONTRADICTED (MINOR): the interpolation and plural surface is larger than the five sites the record lists

- **Record says:** Five interpolating strings, "That is the complete list. Everything else in the app
  is a fixed label" (`PLURAL-EVIDENCE.md` "The measurement"). R16 says "four interpolating strings".
- **Evidence:** `scripts/plural-surface.py:9-12` scans `string-inventory.json`, which holds no
  template literal, so it cannot find one. The grep stated under Method finds 27 user-visible
  template literals in 9 files:

  | File and lines | Text |
  | --- | --- |
  | `shared/notifications.ts:130,181,410,502` | `${englishName} now`, `${englishName} in ${intervalMinutes}m`, `Athan ${soundIndex + 1}`, `${englishName} in ${intervalMinutes}m Reminder` |
  | `shared/time.ts:540,545,568,572,573` | `${totalHours}h`, `${minutes}m`, `${secs ?? 0}s`, `${hours}h ${remainingMinutes}m` |
  | `components/sheets/parts/Stepper.tsx:58,69,75` | `Decrease to ${nextDown ?? value} ${unit}`, `${value} ${unit}`, `Increase to ${nextUp ?? value} ${unit}` |
  | `components/countdown/Bar.tsx:166` | `Prayer countdown: ${Math.round(progress)} percent remaining` |
  | `components/sheets/parts/SoundItem.tsx:102,127` | `Athan ${index + 1}`, `Stop previewing ${name}`, `Preview ${name}` |
  | `components/prayer/Alert.tsx:185-186` | `${Prayer.english} notification: unavailable`, `${Prayer.english} notification: ${...spoken}` |
  | `hooks/usePrayerAgo.ts:36` | `${prevPrayer.english} now`, `${prevPrayer.english} ${timeAgo} ago` |
  | `shared/qiblaPlace.ts:46` | `${locality}, ${country}` |
  | `widgets/PrayerWidget.tsx:296-298,309,554` | `${minutes}m`, `${hours}h`, `${hours}h ${minutes}m`, `${monthPrefix} ${dayNumber}` |

  Seventeen of the 27 put a number beside a unit or a word. The Stepper labels are spoken by a screen
  reader as a count and a unit, which a translator renders as a full noun.
- **Attack tried:** Tested whether any site forces plural rules. None does while units stay
  abbreviated and the reminder interval stays a closed set of six values. The record's conclusion
  (no plural machinery) therefore holds. Its count and its "complete list" do not.
- **Consequence:** Correct the list. Rule that accessibility labels keep abbreviated units, or give
  the six interval values their own keys. Respecify the plural guard: a test that looks for a plural
  construct in catalog values cannot fire in a format that has no plural syntax. The guard that
  catches the real hazard keys on parameters: any catalog value that takes a numeric parameter must
  sit on an explicit allow-list, so a new `{count} reminders` string fails the suite.

### ARCH-7. CONFIRMED: non-React callers can read the language synchronously, and the pattern already exists

- **Record says:** `getLocales()` and a synchronous non-hook `t` serve "the notification scheduling
  pass and the widget push" (`LOCALIZATION-API.md`, `R1-FINDINGS.md` "What R1 confirms").
- **Evidence:** Notification copy is built in plain functions (`shared/notifications.ts:123-138`,
  `174-189`) and channel names at `shared/notifications.ts:409-417,445-463,492-514`. The headless
  entry is `device/tasks.ts:23-35`, which requires `@/stores/notifications` and awaits
  `rescheduleAllNotificationsFromBackground()`. Stored preferences load synchronously at atom
  creation (`stores/storage.ts:22`, `getOnInit: true`, MMKV `getString`), and `getDefaultStore()` is
  already called from ten non-React sites under `stores`, `device` and `shared`. A module-level
  `t()` that reads the language atom through the default store works in the background task without
  React.
- **Attack tried:** Looked for a way the read goes stale. `stores/storage.ts:7-12` documents one: an
  atom no component renders keeps its first snapshot, so a raw MMKV write behind it is invisible to
  `store.get`. Evaluation order is also load-bearing under `inlineRequires`
  (`metro.config.js:20-23`), and Jest does not reproduce it.
- **Consequence:** None for the design. The step that adds `preference_language` and
  `preference_language_commit_pending` must write through the atoms, never through `database.set`,
  and the step file must say so. The widget runtime is a separate case (ARCH-9).

### ARCH-8. UNCERTAIN: `getLocales()` from the headless background task while no explicit language is stored

- **Record says:** A null `preference_language` means "derive from the device locale on every launch"
  (`SINGLE-LANGUAGE-PIVOT.md` synthesis finding 8). `getLocales()` "stays the right call for the
  non-React paths" (`LOCALIZATION-API.md`).
- **Evidence:** `expo-localization` is not installed (`package.json` has no entry and
  `node_modules/expo-localization` does not exist), so its native module cannot be read here. A
  background reschedule with a null preference must call it with no activity on Android.
- **Attack tried:** None possible from source at this commit.
- **Consequence:** Settle on the Android 9 phone after install: trigger the background task with the
  app killed and log `getLocales()[0].languageTag` from inside
  `rescheduleAllNotificationsFromBackground`. Also define the case where the device locale changed
  while the app was dead: the task then arms copy in a language the widget and the UI have not yet
  switched to.

### ARCH-9. CONTRADICTED (MAJOR): baked props do not reach every string a widget draws

- **Record says:** "widgets' 25 strings resolved in the app and baked into props" (`PLAN.md` step 10).
  Translated text reaches a widget "exactly one way" (`research/R5-PRODUCTION-ENGINEERING.md` 4.1).
- **Evidence:**
  - Null-props cards draw literals when no prop exists. `widgets/PrayerWidget.tsx:520-525`:
    `if (entry == null) { ... return <NeutralCard title='Athan' subtitle='Prayer times for London' />; }`.
    `widgets/LockPrayerWidget.tsx:73-75` draws `ATHAN` and `Open to load times` in the same state.
    These are the cards shown before the app has pushed anything, so no baked string can be there.
  - Android computes its countdown text at widget render time with hardcoded units.
    `widgets/PrayerWidget.tsx:292-299` returns `` `${minutes}m` ``, `` `${hours}h` `` or
    `` `${hours}h ${minutes}m` `` from two epochs. The comment at 289-291 says why: "Android's
    countdown is computed at render time, so it carries the format itself".
  - The footer parsers of ARCH-3 run inside the widget runtime.
  - The count misses JSX text in `widgets/LockPrayerWidget.tsx` (ARCH-5).
- **Attack tried:** Checked whether a module-scope catalog could serve the null case. The repository
  rule forbids it: the widget runtime is not React and module-scope references blank the card
  (`ai/AGENTS.md` "Widgets").
- **Consequence:** The plan must add three things. Unit suffixes and every stale or neutral string
  become props with a schema version bump. The null-props cards need an owner ruling: they stay
  English, or they show no words. The footer arrives as a finished string. Under D17 the ruling
  cannot be skipped.

### ARCH-10. CONTRADICTED (MAJOR): native strings have no step, and some have no mechanism

- **Record says:** "every user-visible string renders in the selected language" (D17). 2.0.0
  "declares `supportedLocales` / `CFBundleLocalizations` exactly matching the picker set"
  (`SINGLE-LANGUAGE-PIVOT.md` synthesis finding 23c). R5 section 4.4 describes `expo.locales` for
  permission strings.
- **Evidence:**
  - Strings a JavaScript `t()` cannot reach: `app.json:3` and `app.json:23` (app name),
    `app.json:24-25` (two permission purpose strings), and 14 widget gallery entries with a
    `displayName` and a `description` each (`app.json:204-379`). In the generated project they are
    `android/app/src/main/res/values/strings.xml` (`app_name`) and the widget labels referenced at
    `android/app/src/main/AndroidManifest.xml:43-99`, and `ios/Athan/Info.plist` lines 13-14, 74-75
    and 86-87.
  - `app.json` has no `locales` key and no `expo-localization` plugin entry. `PLAN.md` has no step
    for either. A grep of the whole record for `displayName` returns nothing, so the widget gallery
    strings are unplanned.
  - The widget plugin localises iOS only. `node_modules/expo-widgets/plugin/build/ios/xcode/withTargetXcodeProject.js:138-139`
    reads `config.locales` and attaches `Localizable.strings`. The Android writer at
    `node_modules/expo-widgets/plugin/build/android/withAndroidWidgetFiles.js:190-201` emits one
    default strings file with no per-locale variant.
  - Native strings follow the operating system language, never the in-app choice.
    `LOCALIZATION-API.md` records that the module exports four read functions and no setter.
- **Attack tried:** Looked for a ruling that exempts native strings from D17. None exists.
- **Consequence:** The plan needs a native-strings step: `expo.locales` with
  `CFBundleAllowMixedLocalizations` for the two permission strings and the iOS widget gallery names,
  every key present in the default locale first (the `ExtraTranslation` lint failure R5 cites), and
  a small config plugin if Android widget labels are to localise. It also needs a ruling that these
  strings follow the device language when it differs from the in-app choice.

### ARCH-11. CONFIRMED: catalog weight stays small at fifty, measured as bytecode

- **Record says:** 5,317 B of source per language, 104 KB at twenty, against a 4.4 to 4.9 MB bundle
  (`R1-FINDINGS.md`, `research/R17-SCALE-AND-FONTS.md` section 2).
- **Evidence:** `hermesc -emit-binary -O` on synthetic ASCII catalogs of 164 keys: an empty module
  is 323 B, one catalog is 8,549 B from 8,217 B of JavaScript, fifty catalogs in one module are
  339,296 B from 418,517 B. That is about 6.8 KB of bytecode per catalog at fifty.
- **Attack tried:** Looked for the literal-size compiler hazard of `facebook/hermes#1046` at this
  shape. Fifty flat catalogs compile at once with no delay.
- **Consequence:** None. Two limits on the confirmation are under "Not verified": the 5,317 B figure
  and both bundle denominators could not be reproduced, and non-Latin catalogs will weigh more than
  the ASCII synthetic.

### ARCH-12. CONFIRMED: `keyof typeof` key safety holds on `typescript` 7.0.2 and costs nothing at fifty catalogs

- **Record says:** `tsc` rejects a mistyped key and lists the valid ones (`SPIKE-EVIDENCE.md`
  result 2). The spike "used one catalog of five keys".
- **Evidence:** Fifty catalogs of 164 keys, each `as const satisfies Catalog`, with a `t()` whose
  parameters are typed per key: `Files: 115`, `Types: 30295`, `Instantiations: 3886`,
  `Memory used: 41255K`, `Check time: 0.016s`, `Total time: 0.049s`. Four `@ts-expect-error`
  fixtures held: a mistyped key, a missing parameter object, a wrong parameter name, and a parameter
  object on a plain key. A catalog with one key removed fails with
  `error TS2741: Property '"k005.label"' is missing`.
- **Attack tried:** Scaled the spike by 10 in catalogs and 33 in keys to find a type-check cliff.
  There is none.
- **Consequence:** None against the claim. The measurement shows more safety is available than the
  record specifies (ARCH-13).

### ARCH-13. CONTRADICTED (MINOR): the specified `t()` leaves two free compile-time guarantees unused and keeps a fallback the rulings reject

- **Record says:** `t()` has "English fallback, and named interpolation", it "falls back to English
  when the active catalog lacks the key" and "leaves an unknown placeholder untouched"
  (`SPIKE-EVIDENCE.md`).
- **Evidence:** ARCH-12. With `as const satisfies Catalog` on every non-English catalog a missing key
  is a compile error, so the fallback branch can never run. Without it a missing key ships English
  inside another language, which D17 and D24 rule out, and a missing parameter ships the literal
  `{name}` on a lock-screen notification. Both are caught today only at run time or by a separate
  parity test. The typed version stays inside the record's size claim:

  ```ts
  type Key = keyof typeof en;
  type Names<S extends string> = S extends `${string}{${infer P}}${infer R}` ? P | Names<R> : never;
  type Params<K extends Key> = { [P in Names<(typeof en)[K]>]: string | number };
  export type Catalog = { readonly [K in Key]: string };

  export function t<K extends Key>(key: K, ...args: [Names<(typeof en)[K]>] extends [never] ? [] : [Params<K>]): string {
    const template: string = active[key];
    const params = args[0] as Record<string, string | number> | undefined;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
  }
  ```

  That is four type lines and six runtime lines. "20 lines" survives typed parameters and
  compile-time completeness. It does not survive plurals, which the record already excludes.
- **Attack tried:** Checked whether types can also prove that a translation keeps its placeholders.
  They cannot with a plain `Record<Key, string>`. That stays a test
  (`research/R5-PRODUCTION-ENGINEERING.md` 5.3).
- **Consequence:** Step 6 should specify `satisfies Catalog` on every catalog, typed parameters, no
  English fallback branch, and a placeholder-parity test. The record must also pick one placeholder
  syntax: the spike uses `{name}` and R5's tests use `{{var}}`.

### ARCH-14. CONTRADICTED (MAJOR): the bridge targets a format that neither the catalog nor the record's own fifty-locale destination uses

- **Record says:** A "TS-to-i18next-JSON bridge" with round-trip parity leaves "every TMS unlocked,
  migration past 40 locales mechanical" (`research/R16-ARCHITECTURE.md` (d) item 1). The fifty-locale
  answer is "Lingui v6 plus `@lingui/metro-transformer`, `.po` catalogs, Crowdin" (R16 (b)).
- **Evidence:** The i18next JSON v4 document defines interpolation as
  `"keyInterpolate": "replace this {{value}}"`, plural keys by suffix
  (`keyPluralSimple_one`, `_other`, and `_zero _two _few _many` for Arabic), context by suffix
  (`keyContext_male`), nesting as `$t(keyDeep.inner)`, and nested objects for dotted paths. The
  record's catalog uses single-brace `{name}` (`SPIKE-EVIDENCE.md`) and flat dotted keys (R16 (d)
  item 2). So:
  - An export that writes `{name}` into an i18next file is not interpolated by i18next and is not
    recognised as a placeholder by a tool in i18next mode. The bridge must rewrite braces both ways,
    and the parity test must cover a value that holds a literal brace.
  - A flat key ending in `_one`, `_other`, `_male` and the like changes meaning on the other side.
  - A flat key that is a prefix of another (`a` and `a.b`) cannot survive a nested round trip.
  - JSON carries no translator comment or context. `Off`, `Silent`, `Sound` and `Close to save` are
    the cases R5 itself names as ambiguous.
  - Lingui catalogs are PO files with ICU placeholders. Single-brace `{name}` is already a valid ICU
    simple argument, so the catalog is closer to the named destination than the bridge format is.
  - The one translation tool checked from its own documentation, Weblate, ingests both shapes
    natively: "i18next JSON file v4" and "Simple key / value files, used for example by `vue-i18n`
    or `react-intl`". Its nested mode rewrites a dotted key: "`app.name` key is inserted as" a nested
    object. So i18next JSON is a sound tool format, as R16 says. It is not a required one, and the
    plain flat file is accepted as it stands.
- **Attack tried:** Asked whether the bridge is needed at six languages at all. The record's pipeline
  is a sourced glossary plus batched machine translation committed to git
  (`research/R2-TRANSLATION-PIPELINE.md` stages 3 and 4), with no translation management system and
  no translators. A flat `as const` catalog is already serialisable with `JSON.stringify`.
- **Consequence:** Change forced change 1 before step 7 is written. Define the transfer format as
  flat key-value JSON with ICU-style `{name}` placeholders, which is the catalog itself, and make the
  parity test assert: key-set equality, order independence, no reserved i18next suffix, no prefix
  collision, placeholder-set parity per key, and byte-exact values. Add a PO or i18next emitter only
  when a named tool needs it. The claim that the i18next format makes a later migration mechanical is
  not supported for Lingui.

### ARCH-15. CONFIRMED: the JSON posture and the OTA tension are each closed by a ruling

- **Record says:** R5 says no JSON files. R16 keeps a `JSON.parse` fallback. R16 lists an OTA ruling
  as forced change 5. D30 rules OTA out.
- **Evidence:** `SINGLE-LANGUAGE-PIVOT.md` synthesis finding 21 states the reconciliation: "R5's 'no
  JSON files' is the design; R16's JSON.parse fallback is the pre-decided contingency". D30 states
  that it "closes R16's forced change 5 permanently for the 2.x line". The code agrees: `app.json`
  holds no `updates` block, and `expo-updates` (`package.json:57`) is used only for
  `Updates.reloadAsync()` at `components/ui/Error.tsx:29`.
- **Attack tried:** Looked for text that still treats either as open.
- **Consequence:** Drift only. `PLAN.md` field "Owner decisions still needed" still lists "OTA: none
  at 2.0.0 (recommendation, stands unless moved)", its "Brief" row stops at D29, and the pivot's Q12
  row still says the OTA ruling awaits the owner. All three predate D30 and should be updated.

### ARCH-16. CONTRADICTED (MINOR): D2 and D1 as written do not describe the adopted design, and neither carries a banner

- **Record says:** D2: a translation is "authored, generated or corrected outside the source tree and
  loaded as data". D1: "Adding a language is a data decision, never a code change."
- **Evidence:** `PLAN.md` step 6 creates `shared/locales/en.ts` inside the source tree, compiled into
  the bundle. The only reconciling text is inside D32's last amendment, which says the catalog file
  "is TypeScript for the key safety". D2 has no supersede banner, unlike D8, D15 and D16. Adding a
  language under the adopted design edits code in at least four places: the catalog file, the lazy
  loader map and its locale union, the picker list, and the `supportedLocales` declaration, plus
  tests.
- **Attack tried:** Read D30 to D33 for a ruling that amends D2. D33 confirms one flat file per
  language and does not mention D2.
- **Consequence:** Add a banner to D2 that points at D32 and D33, and state the true cost of adding a
  language. No design change.

### ARCH-17. CONTRADICTED (MINOR): the pre-flight that can change the catalog format runs after everything built on that format

- **Record says:** Forced change 3 is a first-catalog `require()` timing pre-flight "with the
  JSON.parse fallback decision written down before the experiment runs"
  (`research/R16-ARCHITECTURE.md` (d) item 3).
- **Evidence:** `PLAN.md` section 6 places it at step 15, after the catalog and `t()` (step 6), the
  bridge (step 7), three string waves (steps 8 to 10) and the guard (step 14). A failed pre-flight
  would move catalogs to JSON, which removes `as const` typing from every file those steps wrote.
- **Attack tried:** Estimated the chance of failure. It is low: ARCH-11 shows the shape compiles
  cleanly, and `facebook/hermes#1046` concerns large literals.
- **Consequence:** Move the timing experiment to directly after step 6, with one real catalog and
  five synthetic ones at the worst-case script.

### ARCH-18. CONTRADICTED (MINOR): R5 states that Hermes ships `Intl.PluralRules` on Android

- **Record says:** "Hermes ships `Intl.PluralRules` on Android natively since RN 0.65"
  (`research/R5-PRODUCTION-ENGINEERING.md` section 5.3).
- **Evidence:** ARCH-1. The constructor is not registered on any platform at the pinned tag or on
  `main`.
- **Attack tried:** None needed beyond ARCH-1.
- **Consequence:** The governing reports (R1, R16) are right and R5 is wrong on this line. R5's
  plural-category test shape must not be copied into a step file on the strength of that sentence.

### ARCH-19. CONFIRMED: no library beats the hand-rolled design for this app at six languages

- **Record says:** Best practice for this shape, not a stopgap (`research/R16-ARCHITECTURE.md` (a)).
- **Evidence:** Four facts decide it, and each was checked here. (1) Every library's plural path
  needs an API Hermes lacks (ARCH-1). The i18next document says "the Hermes engine still does not
  implement `Intl.PluralRules`" and that since v24 there is no fallback. The Lingui tutorial says "As
  of 08/2024, we need to polyfill `Intl.Locale` ... and `Intl.PluralRules`". The Paraglide README
  lists "`plural` (`Intl.PluralRules`)". (2) The widget runtime can import nothing (ARCH-9), so a
  library covers the same surface `t()` covers and no more. (3) The corpus selects no plural form
  (ARCH-6). (4) Key and parameter safety are free (ARCH-12, ARCH-13). The Expo guide confirms there
  is no house standard: it "uses `i18n-js` as an example" and says "Take a look at other translation
  libraries".
- **Attack tried:** Each alternative in the next section, judged for six languages now and fifty
  later.
- **Consequence:** Keep the choice. Apply ARCH-3, 5, 9, 10, 13 and 14.

## Better alternatives

Versions and dates are npm registry `dist-tags.latest` read on 2026-10-09. Bundle figures marked R1
are the record's and were not re-measured.

| Option | Version (date) | What it adds over the hand-rolled design | Real cost here | Verdict |
| --- | --- | --- | --- | --- |
| Hand-rolled catalogs and `t()`, amended | n/a | Nothing to add. It already gives exact keys, typed parameters and compile-time completeness | About 10 lines owned. Roughly 6.8 KB of bytecode per language | **Keep** |
| `i18next` + `react-i18next` | 26.4.2 (2026-09-03), 17.0.16 (2026-10-06) | Plural, context and nesting syntax, a large tool ecosystem | About 24 KB gzipped (R1). A `PluralRules` polyfill for any non-English plural. `{{x}}` placeholders, so every interpolating value changes. A React context the widget runtime cannot use | Not better at six. Overhead with no exercised feature |
| Lingui | 6.9.1 (2026-10-09) | ICU messages, PO catalogs with translator comments, extraction, pseudo-locales | ESM-only tooling, a Babel macro plugin and optionally a Metro transformer beside the SVG transformer and the JSX shim. `Intl.Locale` and `Intl.PluralRules` polyfills on the documented React Native path, about 150 KB raw (R1). Pre-release React Native raises the integration risk | Right only when human translators arrive |
| FormatJS `react-intl` | 12.1.4 (2026-10-05) | Full ICU MessageFormat | About 25 KB gzipped (R1) plus the same polyfills | Not better |
| Paraglide JS | 2.26.0 (2026-10-06) | Compiler-emitted typed message functions, per-message tree-shaking | Its README targets Vite and names no React Native, Metro or Expo support. Metro does not tree-shake by default, so the headline gain is void. Plurals use `Intl.PluralRules` | Not better. Highest integration risk of the set |
| `i18n-js` | 4.5.4 (2026-10-06) | Embedded plural rules with no `Intl` | `lodash` dependency, no key typing | Not better |
| `typesafe-i18n` | 5.27.1 (2026-02-11) | Generated types | Maintenance state not verified here | Not assessed further |
| `hermes-intl` native module | README on `main` | Native `PluralRules`, `Locale`, `RelativeTimeFormat`, `ListFormat` | A native dependency on a release candidate of React Native. Its README quotes "about 0.6 MB per ABI for 5 locales" for a trimmed build | Not now. The remedy to evaluate if plurals ever arrive |

**Two alternatives do beat what the record specifies, both inside the hand-rolled design:**

1. **Month and weekday names as catalog data instead of platform `Intl` (ARCH-3).** Cost: 31 keys per
   language, generated once from CLDR at development time and reviewed like any other term. Runtime
   cost: none. It removes the dependence on each phone's ICU and CLDR level, makes Jest output equal
   device output, covers Somali, keeps today's order and digits by construction, and makes each name
   a one-line edit. It displaces the "swap the locale tag" step and the month-name pre-flight.
2. **A format-neutral bridge, or none yet (ARCH-14).** Cost: less than the planned bridge, because
   the catalog is already the transfer format. It displaces the i18next-specific export and import.

**What a later move to Lingui would cost at fifty locales.** Keys are explicit ids, which Lingui
supports, so call sites change mechanically (about 164 keys, more after ARCH-5's recount). Values with
`{name}` carry over unchanged as ICU simple arguments. Fifty catalogs convert to PO with a script.
The real cost is the toolchain: the macro plugin, the catalog compile step, the polyfills, and a
second resolution path for notifications and widgets that still cannot use React context. The
i18next-JSON bridge does not shorten that path. It would lock in a brace convention the destination
does not use.

**Unicode MessageFormat 2 and `Intl.MessageFormat`.** The working-group README calls the standard "a
stable part of CLDR" that "is recommended for implementation and adoption". The TC39 proposal README
reads "Stage: 1", last presented in February 2024. No engine ships it, and Hermes lacks the plural
API it needs. The hand-rolled `{name}` subset converts mechanically to MessageFormat 1 (`{name}`) and
to MessageFormat 2 (`{$name}`), so it is not a dead end for interpolation. It becomes one the day a
string needs plural, gender or ordinal selection. Arabic has six plural categories. The trigger is
ARCH-6's numeric-parameter guard, and the pre-decided remedy (a generated plural table with a
canary) stands.

**Quality gates the record lacks or leaves unplanned:**

| Gate | State in the record | Cost to add |
| --- | --- | --- |
| Key parity across catalogs | A test in R5 5.3 | Free at compile time with `satisfies Catalog` |
| Typed parameters per key | Absent | Four type lines (ARCH-13) |
| Placeholder parity across catalogs | A test in R5 5.3, not in `PLAN.md`'s three gates | One unit test |
| Pseudo-locale render sweep | Promised in `R2-FINDINGS.md`, absent from `PLAN.md`'s gates | A 20-line generator and one components suite |
| JSX-text and template-literal guard | Absent (ARCH-5) | One Biome rule and a scan extension |
| Numeric-parameter allow-list | Absent (ARCH-6) | One unit test |
| Length budget per key | Only prayer names are measured | A per-key character budget for sheet titles, buttons and widget strings |
| Translator context | None | Comments in the catalog today. A context field only if a tool is adopted |
| Missing-translation policy | A runtime English fallback | Compile error, no fallback |

**Scale mechanics at fifty.** Type-check cost is not a concern (ARCH-12). Bytecode is about 0.34 MB
for ASCII catalogs (ARCH-11). Evaluation stays bounded to the active catalog only if each catalog is
reached through its own lazy `require()`, which `metro.config.js:27` (`inlineRequires: true`)
supports. One static import of all fifty from the loader map defeats that, and R5 section 3.2 shows
the map with `import()`, which `R1-FINDINGS.md` bans. The step file must show the `require()` form.
Review ergonomics favour flat one-line entries: a term change is a one-line diff per language, as D33
requires.

## Not verified

- **Bundle and catalog figures.** The 5,317 B per-language figure and the 4.4 MB and 4.9 MB bundle
  denominators could not be reproduced from any artefact in the record. No bundle was built. The
  synthetic catalogs are ASCII. Arabic, Devanagari and Thai catalogs will be larger in bytecode.
- **Device behaviour.** Nothing ran on a phone or simulator. ARCH-4 and ARCH-8 name the checks.
  First-catalog `require()` timing on the Android 9 phone is unmeasured.
- **`expo-localization`.** Not installed, so its plugin options (`supportedLocales`, `supportsRTL`)
  and its native module were not read. `research/R8-FIRST-RUN-LOCALE.md` and `LOCALIZATION-API.md`
  were taken as read.
- **Translation management tools.** Only Weblate was checked from its own documentation (its
  i18next and JSON format pages, read whole). Crowdin, Tolgee, Lokalise and Transifex format support
  was not established from primary sources. R16's claim that Crowdin ingests `as const` TypeScript
  was not checked. The Weblate formats overview was fetched and only grepped.
- **Metro tree-shaking.** The statement that Metro does not tree-shake by default comes from general
  knowledge, not from a source fetched here.
- **Lingui's toolchain details.** ESM-only tooling and the polyfill byte total are R1's figures.
- **`typesafe-i18n` maintenance status.** Only the registry date was read.
- **Lingui, i18next and FormatJS bundle sizes.** Taken from R1, not re-measured.
- **Partial reads:**
  - Hermes `Intl.cpp`: `createIntlObject` read in full, the rest by grep.
  - `stores/widget.ts`, `stores/notifications.ts`, `shared/widgetTypes.ts`, `stores/storage.ts`
    (lines 1 to 48): located by grep, not read whole.
  - `widgets/PrayerWidget.tsx`: lines 270 to 340 and 515 to 558 only.
  - `widgets/LockPrayerWidget.tsx`: lines 62 to 77 and a grep.
  - `components/sheets/parts/Stepper.tsx`: lines 1 to 90. Other component files in ARCH-5 and
    ARCH-6 were read at the cited lines only.
  - `research/R13-BLAST-RADIUS.md`: grep only.
  - `node_modules/expo-widgets/plugin/build`: grep and lines 185 to 215 of the Android writer.
  - The generated `AndroidManifest.xml` and `Info.plist`: grep only.
  - External documents: the i18next JSON format and the Hermes Intl document were read whole. The
    Lingui tutorial was read whole with lines clipped at 600 characters. The i18next plurals page,
    the Paraglide README, the Expo guide, the hermes-intl README and the `typesafe-i18n` README were
    grepped. The two MessageFormat READMEs were read for their first 40 lines. The Bluesky
    localisation document and the `expo-localization` changelog were fetched and not read.
- **The count in ARCH-5 is a floor.** The JSX-text scan was a heuristic, hand-filtered. An
  AST-based recount is the plan's job.
