# Verification: fonts

| Field | Value |
| --- | --- |
| Base | `uat` `52109ec0` (1.29.303) |
| Date | 2026-10-09 |
| Claim under test | No bundled font is ever needed for Arabic, Devanagari or Thai, because per-glyph OS fallback serves them on both floor platforms (Android 9, iOS 18). The only per-locale font work is line-height constants plus checks on the Android 9 phone. Urdu renders Naskh there and Nastaliq bundling is rejected. |
| Result | 9 confirmed, 9 contradicted, 3 uncertain |

**Summary.** Glyph coverage for Arabic, Devanagari and Thai by OS fallback holds. No evidence found that
bundling a face for those three scripts is required. Four parts of the surrounding claim do not hold.
The configured floors are API 24 and iOS 16.4. The app targets SDK 36, so Android 15 and later draw
the tall font variants that the Android 9 phone never draws. The "1.22em default line height" the
record reasons from does not exist in code. The word "ever" fails for Latin-script roadmap languages
on iOS (Hausa, Uzbek, Yoruba), where a fuller Roboto is clearly better.

## Method

Read in full: `ai/AGENTS.md`, `SINGLE-LANGUAGE-PIVOT.md`, `OWNER-DECISIONS.md`, `PLAN.md`,
`research/R17-SCALE-AND-FONTS.md`, `research/R3-RTL-AND-SCRIPTS.md`, `R3-FINDINGS.md`,
`research/R12-NUMERALS.md`, `research/R9-LAUNCH-SET.md`, `WIDTH-EVIDENCE.md`, `MEASURED.md`,
`scripts/font-coverage.py`, `app.json`, `shared/constants.ts`, `components/prayer/Prayer.tsx`,
`components/prayer/Explanation.tsx`, `components/countdown/Countdown.tsx`,
`components/ui/InitialWidthMeasurement.tsx`, `components/sheets/screens/QiblaCompass.tsx`,
`jsx-runtime-shim.ts`, and in
`node_modules/react-native`: `ReactAndroid/.../common/assets/ReactFontManager.kt`,
`.../views/text/ReactTypefaceUtils.kt`, `.../views/text/internal/span/CustomLineHeightSpan.kt`,
`ReactCommon/react/renderer/textlayoutmanager/platform/ios/react/renderer/textlayoutmanager/RCTFontUtils.mm`.
Partial reads are listed under "Not verified".

Ran, in a scratch virtualenv outside the repository:

- `fontTools` over both bundled fonts (cmap, `hhea`, `OS/2`, `name`, `GSUB`, `hmtx`).
- `fontTools` plus `uharfbuzz` over the AOSP `pie-release` Noto files and the macOS system fonts, to
  get `hhea` spans and the shaped ink extents of the record's own Arabic, Hindi and Thai names
  (`research/prayer-names.json`) plus a few stress words.
- A CoreText program on macOS 27 that registers the two bundled fonts for the process, lays out
  sample strings with `Roboto-Regular` and `Roboto-Medium` as the requested font, and prints the font
  of every glyph run. This is a proxy for iOS, not an iPhone measurement.

External primary sources (fetched raw, read as noted under "Not verified"):

- AOSP `fonts.xml` at `pie-release`, `nougat-release` and `android15-release`:
  `https://android.googlesource.com/platform/frameworks/base/+/refs/heads/pie-release/data/fonts/fonts.xml`
- AOSP `Typeface.java` (`pie-release`), `Paint.java`, `libs/hwui/hwui/MinikinUtils.cpp`,
  `libs/hwui/jni/Paint.cpp` (`android15-release`) under `platform/frameworks/base`, and
  `platform/frameworks/minikin` `libs/minikin/FontFamily.cpp` (`pie-release`).
- AOSP font files: `platform/external/noto-fonts` `other/` and `platform/external/roboto-fonts`, both
  at `pie-release`.
- `https://developer.android.com/about/versions/15/behavior-changes-15` and
  `https://developer.android.com/about/versions/16/behavior-changes-16`.
- `https://source.android.com/docs/compatibility/9/android-9-cdd` section 3.8.13.
- `https://github.com/google/fonts/tree/main/ofl/roboto` (the current variable Roboto).

## Findings

### FONT-1. CONFIRMED: the bundled Roboto holds 896 codepoints and none from Arabic, Devanagari or Thai

- **Record says:** each bundled font covers 896 codepoints and no letter of those scripts
  (`MEASURED.md` section 3, `R3-FINDINGS.md` "Fonts").
- **Evidence:** own cmap parse. `assets/fonts/Roboto-Regular.ttf` (168,260 B) and `Roboto-Medium.ttf`
  (168,644 B) are Roboto `Version 2.137; 2017`, 1,294 glyphs, 896 codepoints each, `hhea`
  1900/-500/0 on 2048 units (1.172em).

  | Block | Covered / assigned |
  | --- | --- |
  | Basic Latin, Latin-1, Latin Extended-A | 95/95, 96/96, 128/128 |
  | Latin Extended-B | 18/208 |
  | IPA Extensions | 1/96 (schwa only) |
  | Spacing Modifier Letters | 11/80 (U+02BC yes, U+02BB no, U+02BE and U+02BF no) |
  | Combining Diacritical Marks | 6/112 |
  | Latin Extended Additional | 100/256 (Vietnamese yes, dot-below consonants no) |
  | Cyrillic, Cyrillic Supplement | 255/256, 20/48 |
  | Greek | 75/135 |
  | Arabic, Arabic Supplement, Devanagari, Bengali, Thai, Hebrew | 0 each |
  | General Punctuation | 38/111 (no U+200C to U+200F, no U+2066 to U+2069) |

- **Attack tried:** looked for a second cmap subtable or a hidden Arabic range. None.
- **Consequence:** none.

### FONT-2. CONFIRMED: both faces are embedded natively at build time and selected by PostScript name

- **Record says:** the app sets a Roboto family on its text (`MEASURED.md` section 3).
- **Evidence:** `app.json:74-79` (the `expo-font` config plugin with the two files).
  `ios/Athan/Info.plist:94-98` (`UIAppFonts`). `android/app/src/main/assets/fonts/` holds both files.
  `shared/constants.ts:282-287` (`TEXT.family.regular: 'Roboto-Regular'`, `medium: 'Roboto-Medium'`).
  No `useFonts` or `loadAsync` call exists in the tree (`git grep`).
- **Attack tried:** looked for a runtime font load that a measurement could race. None exists, so
  the "pre-font-load" caution in `components/ui/InitialWidthMeasurement.tsx:11-13` describes a past
  state.
- **Consequence:** none.

### FONT-3. CONFIRMED: Arabic reaches the screen in production through OS fallback, with digits staying in Roboto

- **Record says:** Arabic already renders by per-glyph fallback (`MEASURED.md` section 3).
- **Evidence:** `components/prayer/Prayer.tsx:91-93` draws `Prayer.arabic` with `styles.text`
  (`:106-109`, `fontFamily: TEXT.family.regular`). `components/prayer/Explanation.tsx:80` with
  `:159-165` (Roboto-Regular, 15px, `lineHeight` 24).
  Android: `ReactFontManager.kt:170-188` calls `Typeface.createFromAsset`. AOSP `Typeface.java`
  (`pie-release`) `:830-834` builds it through `Builder`, and `:925-938`
  (`createFromFamiliesWithDefault`) appends the system fallback families of the default family.
  iOS: `RCTFontUtils.mm:410-423` finds no family named `Roboto-Regular` and resolves it with
  `fontWithName:`, which leaves the default cascade in place.
  CoreText proxy run: `الفجر 05:42` with `Roboto-Regular` gives three runs, digits and colon in
  `Roboto-Regular`, the space in `Roboto-Regular`, the word in `GeezaPro`.
- **Attack tried:** looked for a path where a custom typeface drops the fallback chain. Not found on
  either platform for a `Text` node.
- **Consequence:** none.

### FONT-4. CONFIRMED: the Android 9 font set carries Arabic, Devanagari and Thai, and no Nastaliq

- **Record says:** `fonts.xml` at `pie-release` ships Noto for these scripts, and Urdu renders Naskh
  on the Android 9 phone (`research/R17-SCALE-AND-FONTS.md` section 3).
- **Evidence:** `fonts.xml` at `pie-release`: `:103-110` (`und-Arab`, `NotoNaskhArabic` as
  `variant="elegant"`, `NotoNaskhArabicUI` as `variant="compact"`), `:123-132` (`und-Thai`),
  `:145-154` (`und-Deva`). Every one of these families lists weights 400 and 700 only. The header
  `:11-14` states the match order (full tag, language, then order). A case-insensitive search for
  `nastaliq` and `urdu` returns 0 lines at `pie-release` and 0 at `android15-release`.
- **Attack tried:** looked for a language-specific Urdu family on stock Android. None in AOSP at
  either release. Vendor builds are not covered (see FONT-20).
- **Consequence:** none for coverage. The compact and elegant split matters, see FONT-6.

### FONT-5. CONTRADICTED (MAJOR): the configured floors are API 24 and iOS 16.4, not Android 9 and iOS 18

- **Record says:** no font needs bundling "on either floor platform", with the font risk column headed
  "Android 9 / iOS 18" (`research/R17-SCALE-AND-FONTS.md:11`, `:22`).
- **Evidence:** `node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin/src/main/kotlin/expo/modules/plugin/ExpoRootProjectPlugin.kt:205-207`
  defaults `minSdkVersion` 24, `compileSdkVersion` 37, `targetSdkVersion` 36 from the version
  catalog. `node_modules/react-native/gradle/libs.versions.toml:3-4` (`minSdk = "24"`,
  `targetSdk = "36"`). `android/app/build.gradle:93-94` reads those `rootProject.ext` values, and
  `android/gradle.properties` carries no SDK override. `app.json:47-55` sets only the iOS
  deployment target: `"deploymentTarget": "16.4"` (`app.json:53`), matched by
  `ios/Podfile.properties.json:6` and six `IPHONEOS_DEPLOYMENT_TARGET = 16.4` lines in
  `ios/Athan.xcodeproj/project.pbxproj`.
- **Attack tried:** checked what differs below the tested versions.
  `node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/views/text/TextLayoutManager.kt:871-873`
  enables `setUseLineSpacingFromFallbacks(true)` only on API 28 and later. On API 24 to 27 a line
  whose glyphs come from a fallback face keeps Roboto's line metrics. `fonts.xml` at
  `nougat-release` (`:91-130`) carries the same three script families, so coverage itself holds
  there.
- **Consequence:** the plan names the real minimums, then either raises `minSdkVersion` to 28 or adds
  a text check on an API 24 to 27 image. The iOS proof device must not be read as covering
  16.4 and 17.

### FONT-6. CONTRADICTED (MAJOR): a proof on the Android 9 phone does not hold on Android 15 and later, because this app targets SDK 36

- **Record says:** the per-locale font work is line-height constants "plus 3T checks"
  (`SINGLE-LANGUAGE-PIVOT.md` Q12, `research/R17-SCALE-AND-FONTS.md` section 3). The record never
  mentions `elegantTextHeight`, the compact variants or the target SDK (searched the whole folder).
- **Evidence:** target SDK 36 (FONT-5). Android 15 behaviour changes: "For apps targeting Android 15
  (API level 35), the elegantTextHeight TextView attribute becomes true by default, replacing the
  compact font used by default with some scripts that have large vertical metrics" and "if your app
  supports the following scripts: Arabic, Lao, Myanmar, Tamil, Gujarati, Kannada, Malayalam, Odia,
  Telugu or Thai, test your app". Android 16 behaviour changes: "the attribute will be ignored once
  your app targets Android 16. The 'UI fonts' controlled by these APIs are being discontinued".
  The same default applies below `TextView`, which matters because React Native draws with its own
  `TextPaint`: AOSP `Paint.java` (`android15-release`) `:1836-1856` leaves the flag unset when the
  `DEPRECATE_UI_FONT` change is enabled (`@EnabledSince(targetSdkVersion = VANILLA_ICE_CREAM)`), and
  `MinikinUtils.cpp:52-58` resolves an unset variant to `ELEGANT` when `deprecate_ui_fonts()` is on.
  A search of `ReactAndroid/.../views/text/` finds no call that sets the elegant flag.
  Measured from the AOSP `pie-release` files (`hhea`, equal to `OS/2` typo and win in each):

  | Face | Role | Ascent | Descent | Span |
  | --- | --- | --- | --- | --- |
  | Roboto (bundled) | primary | 0.928 | 0.244 | 1.172em |
  | NotoNaskhArabicUI | compact, the Android 9 default | 1.069 | 0.293 | 1.362em |
  | NotoNaskhArabic | elegant, the default for target 35+ on Android 15+ | 1.069 | 0.634 | 1.703em |
  | NotoSansThaiUI / NotoSansThai | compact / elegant | 1.069 / 1.116 | 0.293 / 0.256 | 1.362 / 1.372em |
  | NotoSansDevanagariUI / NotoSansDevanagari | compact / elegant | 1.069 / 0.896 | 0.293 / 0.408 | 1.362 / 1.305em |

  With fallback line spacing on (`TextLayoutManager.kt:871-873`), a natural-height Arabic line at
  18px is about 24.5px on the Android 9 phone and about 30.7px on an Android 15 phone. A 22px sheet
  title (`components/sheets/parts/Header.tsx:57-58`) goes from about 30px to about 37.5px. Thai and
  Devanagari move by under 1px.
- **Attack tried:** looked for clipping, not only growth. The record's Arabic names keep their ink
  inside 1.13em in both variants (FONT-8), so nothing clips. What changes is height and baseline:
  every Arabic `Text` without a `lineHeight` (the row name, titles, labels, the date line) is about
  25% taller per line than the Android 9 phone shows, and `CustomLineHeightSpan.kt:41-43` centres an
  explicit line box on the deeper descent, which lifts the Arabic baseline by about 2px at 16px.
- **Consequence:** the plan adds an Android 15 or later device (or emulator image) to every per-script
  check, and records its numbers separately from the Android 9 phone. Whether the shipping flag
  state matches AOSP needs that one device observation. Do not "fix" this by forcing the compact
  fonts: Android 16 ignores the override.

### FONT-7. CONTRADICTED (MINOR): the "18px text on a 22px line (1.22em)" premise does not exist in code

- **Record says:** base font size 18 with `lineHeight` default 22, 1.22em
  (`research/R3-RTL-AND-SCRIPTS.md:18`, `:73-80`), "a default 1.22em"
  (`research/R17-SCALE-AND-FONTS.md:92`, `:133`), and "the app's fixed 22px line height clips Thai,
  Devanagari and Arabic" (`R3-FINDINGS.md`, "Fonts").
- **Evidence:** no style pairs size 18 with a `lineHeight`. The size-18 texts set none:
  `components/prayer/Prayer.tsx:106-109`, `components/prayer/Time.tsx:68-69`,
  `components/prayer/Explanation.tsx:147-151`. Every explicit line box in the tree:

  | Style | Size / line height | Ratio |
  | --- | --- | --- |
  | `components/modals/Help.tsx:202-206` question (Medium) | 15 / 20 | 1.333em |
  | `components/prayer/Explanation.tsx:152-157`, `components/modals/Update.tsx:41-46` | 16 / 22 | 1.375em |
  | `components/modals/Help.tsx:225-229`, `:244-249` | 13 / 20 | 1.538em |
  | `components/modals/WhatsNew.tsx:60-65`, `:94-98`, `components/sheets/screens/Qibla.tsx:205-209`, `components/sheets/screens/Alert.tsx:326-331` | 14 / 22 | 1.571em |
  | `components/prayer/Explanation.tsx:159-165` (today's Arabic line) | 15 / 24 | 1.6em |

- **Attack tried:** searched every `lineHeight` under `app`, `components`, `widgets`, `shared`.
- **Consequence:** the tightest box a translated string meets is 1.333em, not 1.22em. The plan's
  per-script constants must be derived against the table above. The prayer row needs no constant
  at all: its name has no `lineHeight` and the row is 57px (`Prayer.tsx:101-105`).

### FONT-8. CONTRADICTED (MINOR): neither Arabic figure is a clipping floor. 1.70em and 1.4em describe two different faces

- **Record says:** R3 measures Noto Naskh Arabic at 1.70em, R17 states a 1.4em floor, and the
  synthesis rules that 1.70em "governs as the floor" to be verified on the Android 9 phone
  (`SINGLE-LANGUAGE-PIVOT.md`, synthesis finding 12).
- **Evidence:** 1.703em is the `hhea` span of the elegant `NotoNaskhArabic`. The Android 9 phone
  draws the compact `NotoNaskhArabicUI` at 1.362em by default (FONT-4, FONT-6), so it cannot verify
  a 1.70em figure. On the Apple side the CoreText proxy gives Geeza Pro 1.226em plus a 0.136em gap
  (a 1.36em to 1.39em line at 18pt). Shaped ink of the record's eleven Arabic names plus two
  settings words:

  | Face | Ink above baseline | Ink below | Ink span |
  | --- | --- | --- | --- |
  | NotoNaskhArabicUI | 0.926em | 0.127em | 1.05em |
  | NotoNaskhArabic | 0.815em | 0.311em | 1.13em |
  | Geeza Pro | 0.726em | 0.274em | 1.00em |

  All three fit the tightest existing box (1.333em).
- **Attack tried:** worked the `CustomLineHeightSpan` arithmetic for 16/22 with the elegant face:
  the box leaves about 15px above and 7px below the baseline against 13px and 5px of ink. No clip.
  Vocalised Arabic (harakat) was not measured.
- **Consequence:** unvocalised Arabic needs no line-height constant to avoid clipping. If the plan
  wants a constant for rhythm, it takes 1.4em. It drops the sentence that 1.70em is a floor the
  Android 9 phone confirms.

### FONT-9. CONTRADICTED (MINOR): a 2.5em Nastaliq line does not break the 57px row

- **Record says:** Nastaliq's 2.5em span "would break the fixed 57px row"
  (`research/R17-SCALE-AND-FONTS.md:75-76`, repeated in the pivot's R17 digest).
- **Evidence:** 2.5em at `TEXT.size` 18 is 45px. The row is 57px with `alignItems: 'center'` and the
  name sets no `lineHeight` (`components/prayer/Prayer.tsx:101-109`). Measured Noto Nastaliq Urdu
  ink on the Arabic-script names: 1.65em above, 0.45em below, 2.10em (38px at 18px).
  `research/R3-RTL-AND-SCRIPTS.md` section 3 already says the row accommodates it.
- **Attack tried:** looked for a second fixed box around the name. None.
- **Consequence:** the rejection of a Nastaliq bundle stands on taste and bytes, not on the row.
  Where Nastaliq does fail is every explicit line box in FONT-7, which matters for FONT-10.

### FONT-10. UNCERTAIN: iOS may choose Nastaliq for Urdu on its own, by device language

- **Record says:** Urdu is "Geeza Pro on iOS" (`research/R17-SCALE-AND-FONTS.md:33`).
- **Evidence:** CoreText proxy. With the bundled `Roboto-Regular` and the default cascade list for
  language `ur`, `طلوع آفتاب` shapes in `NotoNastaliqUrdu`: line span 45.0pt at 18pt (2.50em),
  width 82.2pt. For `ar`, `fa` and `en` the same string shapes in `GeezaPro`: 25.1pt, 69.5pt.
  React Native sets no language attribute on its attributed strings (no `kCTLanguageAttributeName`
  or `NSLanguageIdentifier` under the iOS text layout manager), so the process default applies.
- **Attack tried:** this is the only route found by which a very tall face enters without a bundle.
  It could not be observed on an iPhone here.
- **Consequence:** Urdu is roadmap, not milestone. To settle: on the iPhone, set the device (or
  per-app) language to Urdu with Urdu declared in `CFBundleLocalizations`, render an Urdu row and an
  Urdu explanation, and read which face draws. If Nastaliq appears, Urdu renders in two faces
  depending on the phone's language, and the 1.333em to 1.6em boxes clip it.

### FONT-11. CONTRADICTED (MINOR): fallback glyphs lose the Medium weight for Arabic and Thai on both platforms

- **Record says:** the font work is line heights only. Weight is not discussed anywhere.
- **Evidence:** Android: the asset typeface takes weight 500 from the font table, and Minikin picks
  the nearest face per family: `FontFamily.cpp` (`pie-release`) `:124-131` scores by weight distance
  and `:133-140` fakes bold only when the wanted weight is 600 or more. The Arabic, Thai and
  Devanagari families offer 400 and 700 (FONT-4), so 500 resolves to Regular with no synthetic
  bold. Apple proxy with `Roboto-Medium`: Arabic runs in `GeezaPro` (weight trait 0.00), Thai in
  `Thonburi` (0.00), Devanagari in `KohinoorDevanagari-Medium` (0.23).
- **Attack tried:** checked where it shows. The prayer row is safe: name and time are both Regular
  (`Prayer.tsx:107`, `Time.tsx:68`). It shows in every Medium label: sheet titles
  (`components/sheets/parts/Header.tsx:58`), the explanation title (`Explanation.tsx:150`), Help
  questions (`Help.tsx:206`), card titles (`Alert.tsx:280`, `ReminderCard.tsx:99`), buttons. An
  Arabic or Thai title draws at the same weight as its body, and Latin digits inside a Medium
  string stay Medium beside Regular letters.
- **Consequence:** the plan states this as a known visual consequence for the owner, since visuals
  are settled by rule. No bundle fixes it cheaply (see alternatives C and D).

### FONT-12. CONTRADICTED (MAJOR): "never bundle" fails for Latin-script roadmap languages on iOS

- **Record says:** font risk "None" for Hausa and Swahili, Uzbek ready, Vietnamese covered
  (`research/R17-SCALE-AND-FONTS.md` section 1 table), and no bundle is needed for any candidate
  set.
- **Evidence:** letters missing from the bundled cmap, checked per alphabet in both cases:

  | Language | Missing from bundled Roboto |
  | --- | --- |
  | Hausa (boko) | U+0181, U+018A, U+0198, U+0199, U+01B3, U+01B4, U+0253, U+0257 |
  | Uzbek (Latin) | U+02BB |
  | Yoruba | U+1E62, U+1E63, U+01F8, U+01F9 |
  | Igbo | U+1E44, U+1E45 |
  | Fula, Bambara | hooked letters plus U+019D, U+0272, U+0186, U+0190, U+0254, U+025B |
  | Scholarly transliteration | U+02BE, U+02BF, and dot-below D, H, S, T, Z in both cases |

  Apple proxy: in `Ƙofar ɗaki` the first letter draws in `LucidaGrande` and the hooked d in
  `Helvetica`. In `Oʻzbek` the U+02BB draws in `Helvetica`. Under `Roboto-Medium` those fallback
  letters are Regular weight. On Android the fallback starts at the device default sans family
  (`Typeface.java` `:925-938`), which on AOSP is the system Roboto 2.138 with 2,769 codepoints and
  every letter above, so stock Android hides the gap.
- **Attack tried:** checked whether a newer upstream Roboto closes it. The current Google Fonts
  variable Roboto (`Version 3.015`, 488,584 B) has 927 codepoints and misses the same letters.
- **Consequence:** none for the milestone six. Before Hausa, Uzbek or Yoruba ship, the plan replaces
  the bundled pair (alternative B). R17's "None" cells for those rows are wrong for iOS.

### FONT-13. CONFIRMED: Malay and Somali, and most Latin and Cyrillic roadmap languages, need nothing outside the bundled Roboto

- **Record says:** no font risk for the Latin-script launch languages.
- **Evidence:** full alphabets in both cases pass against the bundled cmap for Malay, Somali,
  Indonesian, Swahili, Turkish (dotted and dotless i included), Azerbaijani (U+018F and U+0259
  included), Kurmanji, Wolof, Vietnamese, Bosnian, Albanian, French, German, Spanish, Portuguese,
  Russian, Kazakh and Tajik. The record's Somali names use only ASCII and U+0027.
- **Attack tried:** the Azerbaijani schwa and the Turkish i pair, the usual gaps. Both present.
- **Consequence:** none.

### FONT-14. CONFIRMED: no `tabular-nums` anywhere, and Latin digits stay tabular Roboto inside fallback strings

- **Record says:** tabular figures are a risk only for non-Latin digits, empty under D21.
- **Evidence:** `fontVariant` appears nowhere under `app`, `components`, `widgets`, `shared`. The ten
  digits share one advance in each bundled face (1150 units Regular, 1164 Medium), so Roboto's
  default figures are already tabular. The CoreText proxy keeps `05:42` and `12:55` in Roboto beside
  Arabic, Devanagari and Thai runs.
- **Attack tried:** a string whose letters all fall back, to see whether digits follow the fallback
  face. They do not.
- **Consequence:** none.

### FONT-15. CONTRADICTED (MINOR): not every `Text` sets Roboto. The countdown name uses the system font, which has a different cascade on Apple

- **Record says:** the app sets a Roboto family "on every `Text` node" (`MEASURED.md:109-110`).
- **Evidence:** `components/countdown/Countdown.tsx:63-72` (the prayer name above the countdown) sets
  no `fontFamily`. Apple proxy with the system UI font: Arabic draws in `.SFArabic-Regular`,
  Devanagari in `.SFDevanagari-Regular`, Thai in `.ThonburiUI-Regular`. With Roboto requested the
  same strings draw in `GeezaPro`, `KohinoorDevanagari-Regular` and `Thonburi`.
- **Attack tried:** asked whether a custom font's cascade matches the system font's. It does not.
- **Consequence:** on iOS the countdown's Arabic name and the row's Arabic name draw in two
  different faces on one screen. The plan either gives that style `TEXT.family.regular` (a pixel
  change in English too, so an owner call) or accepts the mix knowingly.

### FONT-16. CONTRADICTED (MINOR): the compass letters are SVG text. Fallback holds there, joining does not on Android

- **Record says:** the cardinal letters are listed as ordinary translatable copy
  (`SINGLE-LANGUAGE-PIVOT.md`, blast radius digest, `shared/qiblaCompass.ts:92-97`).
- **Evidence:** `components/sheets/screens/QiblaCompass.tsx:128-144` draws them with
  `react-native-svg` `Text` and `fontFamily={TEXT.family.medium}`. Android:
  `node_modules/react-native-svg/android/src/main/java/com/horcrux/svg/TSpanView.java:916-941` walks
  the string one UTF-16 unit at a time, merging only following units whose advance is zero, and
  `:1083-1088` takes each unit's outline on its own. The typeface comes from
  `Typeface.createFromAsset` (`:1163-1177`), so fallback glyphs resolve. iOS:
  `apple/Text/RNSVGTSpan.mm:942-997` reads the font from each CoreText run, so fallback and shaping
  both hold.
- **Attack tried:** looked for a hard break (an explicit typeface with no fallback). Not present.
  The break is shaping: a label of two or more joining Arabic letters draws as isolated letters on
  Android. Marks with zero advance (Devanagari matras, Thai tone marks) merge and survive.
- **Consequence:** the plan constrains each cardinal label to one grapheme cluster in every locale, or
  keeps the four Latin letters. This is the only user-visible text found outside a React Native
  `Text`, a widget or a notification. No Skia, canvas or animated `TextInput` text exists.

### FONT-17. CONFIRMED: OS font scaling never reaches app text

- **Record says:** nothing directly. The fixed 57px row assumes it.
- **Evidence:** `jsx-runtime-shim.ts:28` (`allowFontScaling: false, maxFontSizeMultiplier: 1`) and
  `:45-52` inject the defaults into every `Text` created through the JSX runtime, wired by
  `metro.config.js:40-56`. `numberOfLines` appears only at
  `components/sheets/screens/Qibla.tsx:84,87,166`. `adjustsFontSizeToFit`, `includeFontPadding` and
  `textAlignVertical` appear nowhere.
- **Attack tried:** Dynamic Type against taller fallback lines. Blocked by the shim.
- **Consequence:** none in the app. Widgets and notifications still follow the system size.

### FONT-18. CONFIRMED: the width measurement holds with fallback faces and cannot run before fonts exist

- **Record says:** hidden `Text` nodes measure the longest name per schedule.
- **Evidence:** `components/ui/InitialWidthMeasurement.tsx:20-25` and `:31-37` use the row's own
  family and size, through the same text engine that draws the row. Fonts are native resources
  (FONT-2). The CoreText proxy reproduces two of the record's widths exactly: `ตะวันขึ้น` 61.0pt and
  `طلوع آفتاب` 69.5pt (`WIDTH-EVIDENCE.md`, "The numbers").
- **Attack tried:** looked for a face change that alters a width after it is cached. One exists on
  paper: Urdu at 82.2pt under the Nastaliq cascade against 69.5pt (FONT-10). The widen-only store
  absorbs it.
- **Consequence:** `WIDTH-EVIDENCE.md` numbers are Apple-face widths. The planned width-budget test
  does not predict Android Noto widths, so it needs an Android reading per locale.

### FONT-19. UNCERTAIN: Thai, and Devanagari on iOS, overflow the two tightest line boxes by one to two pixels

- **Record says:** per-script line heights are needed, 1.5em for Devanagari and Thai.
- **Evidence:** shaped ink spans of the record's names plus stress words:

  | Face | Above | Below | Span |
  | --- | --- | --- | --- |
  | NotoSansThaiUI (Android 9) | 1.044em | 0.256em | 1.30em |
  | NotoSansThai (Android 15+) | 1.082em | 0.256em | 1.34em |
  | Thonburi / Thonburi Bold (iOS proxy) | 1.138 / 1.188em | 0.276 / 0.297em | 1.41 / 1.49em |
  | NotoSansDevanagariUI and NotoSansDevanagari | 0.896em | 0.268em | 1.16em |
  | Kohinoor Devanagari Regular / Medium (iOS proxy) | 1.021 / 1.035em | 0.290 / 0.296em | 1.31 / 1.33em |

  Against 1.333em (Help question) and 1.375em (explanation, update message), Thonburi exceeds the
  box and Kohinoor sits at its edge. iOS fixes the box
  (`RCTAttributedTextUtils.mm:246-249`) and centres it from the declared fonts only
  (`:364-383`), so the overflow lands on the first line's top marks.
- **Attack tried:** could not establish from source whether either platform clips ink that leaves
  the line box of a first or last line.
- **Consequence:** to settle, render `ตะวันขึ้น` and `ผู้ใหญ่` in the Help question style and the
  explanation style on the iPhone and on an Android 15 phone, and inspect the upper marks of line
  one and the lower marks of the last line. A Thai constant of 1.5em on those styles is the fix if
  it clips. The record's direction is right here.

### FONT-20. UNCERTAIN: the Android font set for these scripts is an AOSP default, not a compatibility requirement

- **Record says:** the system image ships Noto for every needed script.
- **Evidence:** Android 9 CDD section 3.8.13: devices "MUST include support for: Roboto 2 font with
  different weights ... for the languages available on the device" and "Full Unicode 7.0 coverage of
  Latin, Greek, and Cyrillic, including the Latin Extended A, B, C, and D ranges". No clause names
  Arabic, Devanagari or Thai faces. The fallback chain of an asset typeface starts at the device's
  default family (`Typeface.java` `:925-938`), so a vendor default font or a user-chosen system font
  becomes the first fallback for any letter the bundled Roboto lacks.
- **Attack tried:** looked for a device class that provably lacks a script. Found none from sources.
- **Consequence:** to settle, run one Arabic, one Hindi and one Thai screen on each fleet phone
  (`X8_SERIAL`, `S23_SERIAL`, `8T_SERIAL`), once with a non-default system font selected, and on one
  Android Go image. A missing script on a real device class is the one result that would make a
  bundled face necessary.

### FONT-21. CONFIRMED: widgets and notifications are drawn by the system with system fonts

- **Record says:** widget text is resolved in the app and baked into props.
- **Evidence:** `widgets/PrayerWidget.tsx:249,255` pass only `fontSize` and `fontWeight` with
  `maxLines={1}`. `widgets/LockPrayerWidget.tsx:55-57`, `:74`, `:162-166` use `font({ size, weight })`
  with `lineLimit(1)` and, on two labels, `minimumScaleFactor(0.6)`. No widget names a font family.
  Notification text has no font control on either platform.
- **Attack tried:** looked for a bundled-font dependency in either runtime. None. Missing-glyph risk
  is the system's own.
- **Consequence:** none for bundling. Single-line clipping of a long translated label at 11 to 17pt
  was not measured.

## Better alternatives

| Option | Bytes | Per-platform effect | Engineering and upkeep | Verdict |
| --- | --- | --- | --- | --- |
| A. Bundle nothing (the record) | 0 | Arabic, Devanagari and Thai draw from system faces. Faces, heights and weights vary by OS version and vendor (FONT-6, FONT-11, FONT-20) | None | Right for the milestone six. Keep it, with FONT-5, FONT-6 and FONT-7 repaired |
| B. Replace the bundled pair with the full Roboto 2.138 static pair from AOSP `roboto-fonts` (Apache 2.0) | 305,608 + 306,536 B, which is +275,240 B over today's 336,904 B. A subset to Latin, Greek, Cyrillic, marks and punctuation ranges measures 197,336 B per weight (1,666 codepoints, every alphabet in FONT-12 passes), about +58 KB for the pair | iOS: ends the mid-word face and weight switch for Hausa, Uzbek, Yoruba, Igbo, Fula, Bambara and transliteration marks. Android: no visible change on stock | Two files swapped. The build differs from 2.137: 421 of 896 shared advances differ, 4 by more than 2 font units, and "Sunrise" at 18px moves from 59.81px to 59.86px. English is no longer byte-identical in width, so the width cache and the visual rule need one re-check | Clearly better, but only from the release that adds the first of those languages. Not needed for the milestone |
| B2. Current Google Fonts variable Roboto | 488,584 B | Adds nothing: 927 codepoints, the same letters missing | A variable font also changes weight selection on both platforms | Rejected on measurement |
| C. Bundle Noto faces per script | From the `pie-release` files: Naskh Arabic 116,716 B (Bold 115,784 B), Devanagari 135,908 B, Thai 21,380 B (Bold 18,336 B). About 0.55 MB for three scripts in two weights | Same glyphs on every Android version and vendor, and a weight match if a middle weight is added | React Native takes one family per `Text`, with no font stack. Keeping Latin digits in Roboto needs a per-locale family switch plus native fallback composition on both platforms. It changes today's Arabic look | Not justified. Revisit only if FONT-20 finds a device class without a script |
| D. System font for non-Latin locales (drop `fontFamily` per locale, as `R3-FINDINGS.md` item 9 proposed and the pivot did not carry) | 0 | iOS proxy: SF Arabic, SF Devanagari and Thonburi UI, with compact metrics (SF Arabic 1.24em) and real weights, which repairs FONT-11 on iOS. Android: no change, the fallback chain is the same | A per-locale style switch. Latin digits and the time column then draw in San Francisco on iOS in those locales, and today's Arabic face on iOS changes | An owner decision on pixels. The record must state whether item 9 is adopted or dropped. It is silently both today |

## Not verified

- **Devices.** Nothing ran on a phone or simulator. Every Apple result is CoreText on macOS 27 with
  the bundled fonts registered in-process. Every Android result is source plus font-file arithmetic.
- **Apple's iOS 18 system font list** was not re-fetched. Presence of Geeza Pro, Kohinoor Devanagari,
  Thonburi and Noto Nastaliq Urdu was observed on macOS only. iOS 16.4 and 17 were not checked.
- **Whether overflowing ink is clipped** on either platform (FONT-19), and the shipping state of the
  `deprecate_ui_fonts` flag on Android 15 and 16 builds (FONT-6).
- **Not attempted:** truncation and ellipsis with fallback faces, the iOS Bold Text setting, Android
  12+ font weight adjustment, vocalised Arabic, Bengali, Android Go, vendor font sets.
- **Partial reads, located by search and read around the cited lines only:**
  `TextLayoutManager.kt` (843-880), `TextAttributeProps.kt` (search hits),
  `RCTAttributedTextUtils.mm` (340-386 and search hits), `RCTParagraphComponentView.mm` (432-470),
  `TSpanView.java` (884-953, 1076-1102, 1150-1190), `RNSVGTSpan.mm` and `RNSVGGlyphContext.mm`
  (search hits), `ExpoRootProjectPlugin.kt` (search hits), the `expo-font` plugin sources (search
  hits), `components/modals/Help.tsx` (170-290), `app/_layout.tsx` (60-97),
  `metro.config.js` (search hits), style blocks of `Update.tsx`, `WhatsNew.tsx`, `Qibla.tsx`,
  `Alert.tsx`, `Header.tsx`, `Time.tsx`, `Day.tsx`, `Ago.tsx`, both widget files (search hits),
  `shared/qiblaCompass.ts` (search hits), `stores/ui.ts` (search hits).
- **Partial reads of external sources:** the three AOSP `fonts.xml` files (header, the default
  family and the Arabic, Devanagari, Thai and Bengali families, plus whole-file searches), AOSP
  `Paint.java`, `Paint.cpp`, `MinikinUtils.cpp`, `Typeface.java` and `FontFamily.cpp` (the cited
  functions), the two Android behaviour-change pages (the elegant text sections), the CDD (section
  3.8.13), and `research/prayer-names.json` (names for 13 locales extracted by script).
- **R3's original 480-line report** in git history was not recovered. The compressed file was read.
