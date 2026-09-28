# R3: RTL, scripts, and the never-mirror decision

Research report for the localisation effort. Scope: layout direction policy, bidi inside pinned-LTR text, font coverage for the top 20 languages, and the fixed-width prayer-name column.

Method. Web claims come from the `tinyfish` MCP search and fetch tools. React Native and Expo claims were cross-checked against `docs-mcp-server` where indexed; the React Native doc index on that server has no `I18nManager` pages, so those cite `reactnative.dev` directly. Font coverage, file sizes, and glyph metrics were measured locally with `fontTools` against the actual files: the bundled `assets/fonts/Roboto-Regular.ttf` and upstream Noto TTFs downloaded from `notofonts.github.io`. One StackOverflow page (`Fallback fonts in react native`, question 58965663) returned `bot_blocked` to the fetcher; its content is cited from the search snippet only and marked accordingly. Everything unverifiable is labelled UNVERIFIED with the experiment that would settle it.

App facts used throughout, read from this worktree:

| Fact | Value | Source |
|---|---|---|
| Prayer row height | `57` fixed | `shared/constants.ts` `STYLES.prayer.height` |
| Base font size | `18`, `lineHeight` default `22` (1.22em) | `shared/constants.ts` `TEXT` |
| Arabic line height | `24` (1.6em at `sizeArabic` 15) | `shared/constants.ts` |
| Bundled fonts | `Roboto-Regular.ttf` (168,260 bytes), `Roboto-Medium.ttf` (168,644 bytes) | `assets/fonts/` |
| First column width | runtime-measured width of the longest English name per list, plus left padding | `components/ui/InitialWidthMeasurement.tsx`, `components/prayer/Prayer.tsx` |
| Width-setting names | `Sunrise` (standard list), `Last Third` (extras list) | `shared/constants.ts`, `getLongestPrayerNameIndex` |
| Arabic second column | `flex: 1`, `textAlign: 'right'`, own font size | `components/prayer/Prayer.tsx` `styles.arabic` |
| Digit mapping | `toArabicNumbers`, unconditional 0-9 to U+0660..U+0669 | `shared/text.ts` |

---

## 1. What React Native actually does with RTL

### 1.1 `I18nManager` surface

From the React Native 0.88-era documentation ([reactnative.dev/docs/i18nmanager](https://reactnative.dev/docs/i18nmanager)):

| Member | What it does | Restart needed | Platform notes |
|---|---|---|---|
| `allowRTL(bool)` | Permits RTL layout when the device language is RTL. Persisted across restarts. | Yes, "changes take effect on the next application start" | On iOS the flip additionally requires the app's `knownRegions` in the Xcode project to include the language. On Android it additionally requires `android:supportsRtl="true"` in the manifest. |
| `forceRTL(bool)` | Forces RTL regardless of device language. Persisted. | Yes, full restart | Docs: "Only meant for development and testing." |
| `swapLeftAndRightInRTL(bool)` | When true, `left`/`right` style values are swapped in RTL mode. Does not change `isRTL`. | Yes | Default is true on both platforms; this is why RN maps `left`/`right` onto `start`/`end` internally ([RN blog, RTL support](https://reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps.html)). |
| `isRTL` (read-only) | `forceRTL(true)` wins; else `allowRTL(false)` forces false; else true when device language is RTL and the platform conditions above hold. | Read at start | The iOS `knownRegions` condition is the one that bites: shipping an `ar.lproj` flips OS-level semantics even if RN never lays out RTL. |
| `doLeftAndRightSwapInRTL` (read-only) | Reports whether the swap is active. | Read at start | Read-only counterpart of `swapLeftAndRightInRTL`. |

Expo exposes a first-class opt-out: "To opt out of RTL layout, set the `supportsRTL` option to false on the `expo-localization` config plugin" ([docs.expo.dev/guides/localization](https://docs.expo.dev/guides/localization/)). That writes `android:supportsRtl="false"` and keeps Android from mirroring `start`/`end` edges. The Android manifest docs confirm the kill switch: "If this is set to `false` ... the RTL APIs are ignored or have no effect" ([developer.android.com/guide/topics/manifest/application-element](https://developer.android.com/guide/topics/manifest/application-element)).

### 1.2 New Architecture status

Three open-and-closed GitHub issues define the current state:

| Issue | Version | Symptom | Status on page |
|---|---|---|---|
| [#48311](https://github.com/react/react-native/issues/48311) | reported on 0.76-era New Arch | Toggling `forceRTL` or changing system language does not re-lay out; "a complete termination and relaunch of the app is required" | Closed |
| [#45661](https://github.com/react/react-native/issues/45661) | 0.74 New Arch | After `RNRestart`, styles like `textAlign` stay stale; "styles and layout directions are only applied correctly after the app is fully restarted" | Closed |
| [#51235](https://github.com/react/react-native/issues/51235) | 0.79.2 New Arch | `writingDirection` on Text "becomes ineffective when new architecture is enabled on IOS"; normal on the old renderer | Closed |

Community reports continue this pattern into 2026: an r/reactnative thread titled "RTL fails in Release APK but works in dev with New Architecture enabled" ([reddit.com/r/reactnative/comments/1otgl68](https://www.reddit.com/r/reactnative/comments/1otgl68/expoeas_build_rtl_fails_in_release_apk_but_works/)). The practical reading for RN 0.88: layout direction is effectively a launch-time constant under Fabric. A live in-app language switch that also switches direction is not reliably supported. UNVERIFIED on the exact 0.88.0-rc.2 commit; the settling experiment is a two-language debug build that calls `forceRTL` plus `RNRestart` and inspects row order and `textAlign` on both platforms.

This is evidence in favour of the owner's instinct, for a different reason than he gave: full mirroring in this codebase would have to be a launch-time, whole-app decision, with a restart on every language change, or it will half-apply.

### 1.3 What `allowRTL(false)` leaves outside the app's control

With the app pinned LTR and the device language Arabic:

| Surface | Flips? | Who controls it |
|---|---|---|
| System notifications, notification centre, control centre, app switcher | Yes, with device language | OS entirely |
| Keyboard (Arabic keyboard layout, key order) | Yes | OS entirely; the app gets whatever input method is active |
| Share sheet, print dialog, system permission prompts | Yes when the app declares Arabic localizations; otherwise they render in the app's fallback language | OS, keyed off the app's declared localizations |
| In-app native alerts built with `UIAlertController` | Follows the app's effective semantic content direction, which iOS derives from the app localization list | Partly app-controlled via what `knownRegions` ships |
| Back-edged swipe gesture (iOS), gesture hint | Follows system direction | OS |
| RN-managed layout, flexbox order, `left`/`right` styles | No, when `allowRTL(false)` and `supportsRtl=false` | App |

The RN documentation states the iOS condition precisely: `isRTL` requires "the application-defined localizations include the user-chosen language (as defined in the Xcode project file `knownRegions`)" ([reactnative.dev/docs/i18nmanager](https://reactnative.dev/docs/i18nmanager)). The trap for this project: registering Arabic in `knownRegions` to get localized permission strings also opts the UIKit layer into RTL semantics for system-presented UI inside the app. Shipping Arabic strings from JS bundles without registering `ar` in the native project keeps every native surface LTR and English. That is a real trade: untranslated permission prompts versus OS-flipped alerts. Apple's HIG expects system dialogs to follow the app language ([developer.apple.com/design/human-interface-guidelines/right-to-left](https://developer.apple.com/design/human-interface-guidelines/right-to-left), see the localization cross-reference).

### 1.4 Yoga: `start`/`end` versus `left`/`right`

Yoga resolves logical edges from the node's own direction, not from a global flag alone ([yogalayout.dev/docs/styling/layout-direction](https://www.yogalayout.dev/docs/styling/layout-direction)):

| Style | LTR resolves to | RTL resolves to |
|---|---|---|
| `start`, `marginStart`, `paddingStart`, `borderStartWidth` | left | right |
| `end`, `marginEnd`, `paddingEnd`, `borderEndWidth` | right | left |
| `left`, `marginLeft` (physical) | left | left, unless `doLeftAndRightSwapInRTL` is active, in which case RN rewrites them to logical edges before layout |
| `position: 'absolute'` with `left` | left edge | same, modulo the swap above |

The React Native layout-props doc confirms the resolution table per property, for example `borderEndWidth`: "When direction is `ltr`, `borderEndWidth` is equivalent to `borderRightWidth`. When direction is `rtl`, `borderEndWidth` is equivalent to `borderLeftWidth`" ([reactnative.dev/docs/layout-props](https://reactnative.dev/docs/layout-props)).

Two consequences for this codebase:

1. The app uses `paddingLeft` on the English column (`styles.english`) and `textAlign: 'right'` on the Arabic column. Both are physical. Under a pinned-LTR policy they never move, which is the desired outcome.
2. If mirroring is ever enabled, every physical style in `shared/constants.ts` and the components becomes a per-locale branch. The RN blog post that introduced RTL support describes the intended authoring style: use `start`/`end` and let the root direction flip the tree ([reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps.html](https://reactnative.dev/blog/2016/08/19/right-to-left-support-for-react-native-apps.html)). The current code does not follow that style, which is the concrete measure of how much work full mirroring is here.

### 1.5 `direction` as a style property: the crux

Documented behaviour: `direction` is a layout prop, `enum('inherit', 'ltr', 'rtl')`, default `inherit`, "except for root node which will have value based on the current locale" ([reactnative.dev/docs/layout-props](https://reactnative.dev/docs/layout-props)). Yoga documents per-node direction with inheritance from the parent ([yogalayout.dev/docs/styling/layout-direction](https://www.yogalayout.dev/docs/styling/layout-direction)). The 2016 RN blog states the same mechanism: "css-layout already makes each component's direction inherit from its parent ... set the direction of the root component to RTL, and the entire app will flip".

So the answer to the owner's question: yes, `direction: 'rtl'` on a subtree is a real, supported layout property, and a statically-set subtree direction is the standard way to hold an RTL island inside an LTR app or the reverse. It flips child order and `start`/`end` resolution for that subtree. It does not flip the OS-level semantic content attribute, native views outside RN, or the text base direction on iOS (see 1.6). The known New Architecture bugs (#48311, #45661) are about changing direction at runtime; a direction fixed for the app's lifetime is not implicated by those reports. UNVERIFIED on 0.88.0-rc.2 specifically; the settling experiment is a debug screen with `direction: 'rtl'` on one container, verifying child order and `marginStart` resolution on iOS and Android simulators.

React Native for Web documents the same pattern with `dir`/`lang` props ([necolas.github.io/react-native-web/docs/localization](https://necolas.github.io/react-native-web/docs/localization/)), which is relevant only if a web target ever appears.

### 1.6 `writingDirection` and text base direction

The text style prop exists and is iOS-only: `writingDirection`, `enum('auto', 'ltr', 'rtl')`, default `'auto'` ([reactnative.dev/docs/text-style-props](https://reactnative.dev/docs/text-style-props)). It sets the paragraph's base writing direction for the Unicode bidi algorithm, which is a different axis from `textAlign`. `textAlign` positions the line box content; the base direction determines run ordering, where neutrals resolve, and which side a trailing neutral lands on.

On Android the equivalent is the native `textDirection` on `TextView`, whose framework default resolves from the first strong directional character (`firstStrong`), documented in the View behaviour discussion ([developer.android.com/training/basics/supporting-devices/languages](https://developer.android.com/training/basics/supporting-devices/languages)) and summarised for Compose as "sets direction based on the first strong directional character" ([medium.com/@ilyas_ipek/mastering-textdirection-for-multi-language-apps-in-jetpack-compose-539459bc4aee](https://medium.com/@ilyas_ipek/mastering-textdirection-for-multi-language-apps-in-jetpack-compose-539459bc4aee)). On iOS, `UILabel.textAlignment` has defaulted to `NSTextAlignment.natural` since iOS 9, which resolves per the base writing direction ([developer.apple.com/documentation/uikit/uilabel/textalignment](https://developer.apple.com/documentation/uikit/uilabel/textalignment)).

The problem: #51235 reports `writingDirection` as ineffective under New Architecture on iOS (RN 0.79.2, closed). For this app that means the one prop that would pin an RTL base direction on a Text node is not dependable on iOS Fabric today. The remaining tools for base direction on iOS are: rely on `textAlign: 'auto'` first-strong detection (works when the string starts with an Arabic letter, which every translated prayer name does), or embed Unicode isolates into the string itself (section 2).

---

## 2. Bidi: the part that does not go away

Layout direction and text direction are independent. Pinning the app LTR stops flexbox from mirroring; it does not stop the Unicode Bidirectional Algorithm ([UAX #9](http://www.unicode.org/reports/tr9/)) from running inside every `Text` node. Every string containing both RTL and LTR runs is reordered by UAX #9 according to the paragraph's base direction, and with a pinned-LTR app the base direction inside JS-driven Text defaults to LTR unless something sets it otherwise.

### 2.1 Mixed runs in this app's actual strings

Take the day-string family this app renders: an Arabic explanation line like `20 دقيقة قبل الفجر` (already shipped, `EXTRAS_EXPLANATIONS_ARABIC`) and the future `{{count}}`-style interpolations. Under an LTR base:

| Logical string | LTR-base display | What an Arabic reader expects (RTL base) | Defect |
|---|---|---|---|
| `الفجر 05:42` | `الفجر 05:42` (word left, time right) | time left, word right | Reading order reversed; the eye enters at the wrong end |
| `موعد (الفجر) 05:42` | `موعد (الفجر) 05:42` | mirrored arrangement with time at left | Same |
| `الفجر:` (trailing colon, LTR base) | colon renders to the RIGHT of the glyphs | colon renders to the LEFT | The punctuation appears to precede the word for an RTL reader |
| `صلاة الفجر في 05:42` | runs reordered so `05:42` sits at the far right | `05:42` at far left | Time separated from its phrase |

The trailing-punctuation case is the shipped-bug class. The mechanism: a neutral between an RTL run and the end of the paragraph resolves to the paragraph base direction (UAX #9 neutral resolution, [unicode.org/reports/tr9](http://www.unicode.org/reports/tr9/)). Under an LTR base the colon lands on the right side of the Arabic glyphs, which is where an Arabic reader starts reading, so the punctuation appears to lead the word. The W3C documents the same spillover family with a Hebrew phrase followed by a logically separate number: "the bidi algorithm tells the browser to treat the '5' as part of the Hebrew text" ([w3.org/International/questions/qa-bidi-unicode-controls](https://www.w3.org/International/questions/qa-bidi-unicode-controls.en.html)). That page's `(FAQ)` example shows parentheses detaching from their RTL run and drifting right.

The reasoning above is rule-derived from UAX #9, not device-verified. Experiment to settle all four rows: a debug screen rendering the four strings in a pinned-LTR app on iOS and Android simulators with device language Arabic, compared against the same strings in Notes with RTL paragraph direction.

### 2.2 The control characters, and which to use in 2026

From the W3C guidance ([w3.org/International/questions/qa-bidi-unicode-controls](https://www.w3.org/International/questions/qa-bidi-unicode-controls.en.html)):

| Character | Code point | Class | Use in 2026 |
|---|---|---|---|
| LRI LEFT-TO-RIGHT ISOLATE | U+2066 | Paired isolate, closes with PDI U+2069 | Preferred wrapper for LTR islands (times, numbers) inside RTL text |
| RLI RIGHT-TO-LEFT ISOLATE | U+2067 | Paired isolate, closes with PDI U+2069 | Preferred wrapper for RTL islands inside LTR text; the fix for every prayer-name-in-LTR-column case |
| FSI FIRST-STRONG ISOLATE | U+2068 | Paired isolate, closes with PDI | Preferred when the embedded content's direction is unknown at authoring time |
| LRE / RLE | U+202A / U+202B | Paired embedding, closes with PDF U+202C | Deprecated for hand-authoring; the W3C: "in an ideal world you would want to follow the recommendation of the Unicode Standard to use RLI and LRI, and avoid using RLE and LRE" because embeddings allow spillover |
| LRM / RLM | U+200E / U+200F | Single strong mark | Spot fix for one neutral; the W3C's own example fixes the stray `5` with an LRM before it |
| LRO / RLO | U+202D / U+202E | Override | Avoid; forces character order against the algorithm |

Rules for this codebase:

1. Wrap every interpolated number and time in `LRI ... PDI` when the surrounding string is RTL: `صلاة الفجر في \u206605:42\u2069`.
2. Wrap every translated RTL prayer name in `RLI ... PDI` when it sits in an LTR-base container: `\u2067الفجر\u2069`. This makes the string self-contained regardless of container base direction, which matters because iOS `writingDirection` is unreliable under Fabric (#51235).
3. Never rely on LRE/RLE/PDF.
4. Keep wraps tight around the directional change, per the W3C.

Library support: ICU's C API exposes `ubidi_setReorderingMode` with `UBIDI_INSERT_MARKS`, documented as "insert Bidi marks (LRM or RLM) when needed" ([icu4c ubidi.h](https://github.com/unicode-org/icu/blob/master/icu4c/source/common/unicode/ubidi.h)). MessageFormat 2, the successor to ICU MessageFormat, specifies a "Default Bidi Strategy" that "uses isolating Unicode control characters around placeholder's formatted output" ([LDML Part 9, tr35-messageFormat](https://www.unicode.org/reports/tr35/tr35-72/tr35-messageFormat.html)). So an MF2-conformant runtime inserts isolates around placeholders automatically. Whether a given JS i18n library does this is implementation-specific; UNVERIFIED for `i18next` and `intl-messageformat`. The settling experiment: format `{time}` inside an Arabic string with the candidate library in Jest and inspect `codePointAt` output for U+2066/U+2069.

### 2.3 Arabic-Indic digits

The app's `toArabicNumbers` maps Western digits to U+0660..U+0669 unconditionally. Region expectations differ, and the split is country-level, carried by CLDR:

| Locale default | Regions |
|---|---|
| Arabic-Indic digits (`arab`, ٠-٩) | Egypt, Saudi Arabia, Iraq, Jordan, Kuwait, Qatar, Syria, Yemen, Sudan, Palestine, and most others |
| Western digits (`latn`, 0-9) | Morocco, Algeria, Tunisia, Libya, UAE (per Android's CLDR snapshot) |

Source: a measured per-country test on Android ([helw.net/2025/05/31/arabic-numbers-and-regions](https://helw.net/2025/05/31/arabic-numbers-and-regions/)), consistent with CLDR's numbering-system data ([cldr.unicode.org supported numbering systems](https://cldr.unicode.org/development/development-process/design-proposals/supported-numberingsystems)). The same article documents an Android 16 behaviour change: `Locale("ar")` now defaults to Western digits unless a country qualifier is present, so `Locale("ar", "EG")` is required to get ٠-٩.

Apple's HIG says the same thing from the design side: "Hebrew text uses Western Arabic numerals, whereas Arabic text might use either Western or Eastern Arabic numerals. The use ... varies among countries and regions", and "Don't reverse the order of numerals in a specific number" ([Apple HIG, right-to-left](https://developer.apple.com/design/human-interface-guidelines/right-to-left)).

Recommendation: make the digit system locale-driven (region-qualified Arabic locales get `arab`, Maghreb and Gulf per CLDR get `latn`), with a user override in settings. An unconditional map is wrong for the Maghreb and Gulf users in the top-20 rollout. Do not drop the function; a settings toggle is cheap and settles arguments.

### 2.4 Punctuation mirroring

Paired brackets and parentheses are mirrored characters in RTL runs: UAX #9 renders `(` as `)` when it resolves into an RTL run. This is automatic and correct when the brackets wrap RTL text inside an RTL context. It produces the visible defects when the brackets sit at an RTL/LTR boundary, which is the W3C `(FAQ)` case cited above. The remedy is the same isolate wrap: `\u2067(الفجر)\u2069` keeps the pair attached to its run. Note the app already ships one such string: `ساعة قبل المغرب (الجمعة فقط)` in `EXTRAS_EXPLANATIONS_ARABIC`. Today it renders inside a right-aligned Arabic Text and is safe; the day it is composed with a Latin time on one line it needs isolates.

---

## 3. Does a pinned-LTR layout actually work?

### 3.1 Teams that did not mirror, and what happened

| Product | Evidence | Outcome |
|---|---|---|
| Discord | Community thread "Add Right to Left (RTL) support to Discord", opened November 2018, 1138 upvotes before archiving, 193 comments: "Right to Left text in Discord is often flipped"; "This is such a trivial feature, and the fact that it hasn't been implemented for so long is embarrassing"; "This will discourage so many people from using Discord" ([support.discord.com](https://support.discord.com/hc/en-us/community/posts/360030086752-Add-Right-to-Left-RTL-support-to-Discord)) | Years of user resentment; third-party CSS extensions circulated as the workaround |
| Slack | Official help centre: "Slack does not support right-to-left languages. We hope to include better support for these languages in the future" ([slack.com/help/articles/215058658](https://slack.com/help/articles/215058658-Manage-your-language-preferences)); a Chrome extension "RTL for Slack" exists to patch alignment, brackets and fonts ([chromewebstore](https://chromewebstore.google.com/detail/rtl-for-slack-arabic-pers/kkglhicljbajpdbmhohodoafmmnmmdfm)) | Documented non-support; users self-patch |
| Bluesky mobile app | July 2026 bug report: "Arabic text in posts/comments is left-aligned and not rendered RTL" on iOS and Android, while web rendered correctly; reporter attributes it to "missing writingDirection/textAlign handling for RTL languages in native text components"; filed and closed as a bug ([github.com/bluesky-social/social-app/issues/11345](https://github.com/bluesky-social/social-app/issues/11345)) | The exact behaviour the owner proposes (RTL text, LTR alignment) was treated by both reporter and maintainers as a defect to fix, not a design choice |
| Warp terminal | Open feature/bug issue: "Warp lacks proper RTL text direction support", labelled accessibility and bug ([github.com/warpdotdev/warp/issues/10355](https://github.com/warpdotdev/warp/issues/10355)) | Open demand |
| Microsoft Copilot chat | Q&A thread requesting full RTL display for Arabic, Persian, Hebrew, Urdu ([learn.microsoft.com answers](https://learn.microsoft.com/en-us/answers/questions/5619708/full-support-for-right-to-left-rtl-languages-in-co)) | Open demand |
| Reddit (site bug thread) | "Arabic is an RTL not LTR" filed under r/bugs: "It is very hard to read it if the text is aligned left-to-right (especially if Arabic and English are mingled)" ([reddit.com/r/bugs/comments/1lj33vo](https://www.reddit.com/r/bugs/comments/1lj33vo/desktop_web_mobile_web_android_arabic_is_an_rtl/)) | Direct user-perception quote for left-aligned Arabic |

No App Store rejection was found that cites failure to mirror an RTL layout. Apple's review guidelines reject incomplete localisation and crashes, not unmirrored chrome ([developer.apple.com/app-store/review/guidelines](https://developer.apple.com/app-store/review/guidelines/)). The risk is reviews and churn, not gatekeeping. UNVERIFIED as a universal claim; the settling check is App Review feedback on the first Arabic-localised submission.

### 3.2 The counter-position, quoted

Apple HIG, right-to-left ([developer.apple.com](https://developer.apple.com/design/human-interface-guidelines/right-to-left)):

- "System-provided UI frameworks support right-to-left (RTL) by default ... If you use system-provided elements and standard layouts, you might not need to make any changes."
- Alignment: "Adjust text alignment to match the interface direction"; "Align a paragraph based on its language, not on the current context. When the alignment of a paragraph ... doesn't match its language, it can be difficult to read"; "Use a consistent alignment for all text items in a list."
- Flip: sliders, progress indicators, back and next buttons, icons representing text direction.
- Do not flip: photographs and artwork, clocks ("clocks work the same everywhere"), the digit order inside a number, controls that point at a real direction.
- Balance: "increase the RTL font size by about 2 points" when Arabic sits next to uppercased Latin.

Material Design 3, bidirectionality ([m3.material.io/foundations/layout/bidirectionality-rtl](https://m3.material.io/foundations/layout/bidirectionality-rtl)):

- "Over 2 billion people read and write in right-to-left (RTL) languages ... Layouts should support both ... through mirroring."
- "Don't apply LTR directionality to RTL content, because it may scramble word order. To ensure readability across all languages, the content should have both RTL alignment and directionality."
- "Improperly rendering text in RTL languages can create cognitive overload and negatively impact user sentiment and trust."
- Media controls are always LTR; Hebrew timelines stay LTR; linear progress fills right-to-left except Hebrew; circular indicators and clocks never mirror; 12-hour AM/PM placement moves.
- Material 2 adds the classic table: mirror text-field icons, navigation buttons, directional arrows; never mirror numbers, untranslated text, charts, clocks, phone numbers ([m2.material.io/design/usability/bidirectionality](https://m2.material.io/design/usability/bidirectionality.html)).

W3C/Unicode: base direction must come from metadata or markup, not guesswork ([w3.org/TR/string-meta](https://www.w3.org/TR/string-meta/)); isolates over embeddings for inline fixes (section 2.2).

### 3.3 Accessibility under LTR layout with RTL content

- Reading order. VoiceOver and TalkBack traverse elements in focus order, which follows the layout order of the accessibility tree. In a pinned-LTR app the rows are visited left-to-right, top-to-bottom. Within a single `Text`, the screen reader speaks the string in logical order regardless of alignment or direction, so the words come out in correct Arabic order even when the line is left-aligned. The reorder problem is visual, not auditory.
- Language of synthesis. `accessibilityLanguage` is the React Native prop for per-element language tagging, documented for React Native by appt.org: "foreign words should ideally be indicated in their respective language ... enables assistive technologies to use the right pronunciation" ([appt.org/en/docs/react-native/samples/accessibility-language](https://appt.org/en/docs/react-native/samples/accessibility-language)). It maps to iOS `accessibilityLanguage` (VoiceOver picks the matching voice) and to the Android equivalent propagated into accessibility nodes. The iOS prop was requested in RN issue #30891 ([github.com/react/react-native/issues/30891](https://github.com/react/react-native/issues/30891)); the `docs-mcp-server` React Native index returned no hits for `accessibilityLanguage`, so its 0.88 typing is UNVERIFIED. The settling experiment is a TypeScript check plus VoiceOver listen-through with device language English and app language Arabic.
- Without the tag, VoiceOver reads Arabic strings with the app's default-language voice, producing garbled pronunciation. TalkBack behaviour depends on the installed text-to-speech engine, which on many devices auto-detects script. UNVERIFIED; experiment: TalkBack on a Pixel image with Google TTS.
- The two-column row is the accessibility crux. Today the English name, Arabic name, time and alert are separate focus stops. In Arabic-first mode the visual order (name left, time right) is preserved while the reading order stays name then time, which is correct. No change needed for order; the label language tags are the gap.

### 3.4 Verdict on the owner's decision

Split the decision the way the guidance splits it:

1. Never mirroring the layout chrome (row order, side of the time column, chevrons, sheets) is acceptable for this app. The screen is a single-column data table, not prose. Both vendors say a long list of elements must not mirror anyway (clocks, numbers, media controls, charts), and the row structure here is closer to a timetable than to a reading surface. The alternative, full mirroring, costs a launch-time restart on every language change under Fabric (#48311, #45661) and a sweep of every physical style in the codebase. The instinct to refuse that cost is sound.
2. Left-aligning RTL text inside those LTR boxes is mildly wrong for single words and badly wrong for sentences. Measured against the guidance: Apple says paragraphs must align by their language and list items must share one consistent alignment; Material says LTR directionality applied to RTL content may scramble word order and "negatively impact user sentiment and trust"; the only direct user quote found calls left-aligned Arabic "very hard to read". Single-word prayer names in a fixed column are the mild case. The shipped Arabic explanation strings (`EXTRAS_EXPLANATIONS_ARABIC`) and any future sentence with an interpolated time are the bad case.
3. The decision as stated conflates two things it does not need to conflate. Keeping boxes LTR does not require left-aligning their contents. The app already proves it: the Arabic second column is `flex: 1, textAlign: 'right'` inside an LTR row and nobody reads it as broken. The same treatment extends to the first column when it holds Arabic, Urdu, Persian or Hebrew: LTR box, RTL base direction, right alignment. That captures the layout simplicity the owner wants without the readability defect his wording would introduce.

Hard defects if the decision is implemented literally as "left-align everything":

| Element | Defect | Severity |
|---|---|---|
| Arabic explanation strings in the overlay | Multi-line RTL paragraphs left-aligned; Apple: "can be difficult to read" | High |
| Any composed string with a time (`الفجر 05:42`) | Time lands on the wrong side; reading order reversed | High |
| Trailing punctuation on RTL strings | Colon or bracket renders on the wrong side (2.1) | Medium |
| Arabic next to uppercased Latin | Arabic reads small; Apple suggests +2pt compensation | Low |
| `toArabicNumbers` applied to all Arabic locales | Wrong digits for Maghreb and UAE users | Medium |
| Screen readers | No language tag; Arabic read with English voice | Medium |

Taste questions, not defects: which side the time column sits on; whether the countdown ring or the overlay chevron flips; whether the settings icon moves. Those are the owner's call, and the guidance permits keeping them LTR as long as directional icons that mean "forward in time" are not made misleading.

Caveats that survive even an unmirrored layout, enumerated:

1. RTL strings need RTL base direction plus right alignment inside their LTR boxes.
2. Every LTR island inside an RTL string needs `LRI ... PDI`; every RTL island inside an LTR string needs `RLI ... PDI`.
3. Digits follow the locale's CLDR default, with a user override.
4. `accessibilityLanguage` tags on Arabic text.
5. A bundled Arabic-capable font, or deliberate use of system fonts (section 4).
6. Line height raised for Arabic, Devanagari, Thai, and doubled for Nastaliq Urdu.
7. Permission prompts and system dialogs: decide whether to register `ar` in `knownRegions` (flips native surfaces) or accept English prompts (section 1.3).

---

## 4. Fonts and scripts

### 4.1 What the bundled Roboto covers

Measured directly from `assets/fonts/Roboto-Regular.ttf` with `fontTools`: 896 glyphs in the cmap.

| Script (languages) | Covered by bundled Roboto | Notes |
|---|---|---|
| Latin core (English, plus German/French/Spanish/Portuguese/Indonesian/Swahili basics) | Yes | |
| Vietnamese Latin Extended (Ơ, ơ, Ư, ư, diacritics) | Yes | U+01A0 present in cmap |
| Turkish dotted İ / dotless ı | Yes | U+0130, U+0131 present |
| Cyrillic (Russian) | Yes | |
| Greek | Yes | |
| Arabic (Arabic, and the Arabic half of Persian/Urdu) | No | U+0627 absent |
| Arabic-Indic digits ٠-٩ and extended ۰-۹ | No | U+0661, U+06F1 absent |
| Hebrew | No | |
| Devanagari (Hindi, Marathi) | No | |
| Bengali | No | |
| Gurmukhi (Punjabi) | No | |
| Gujarati | No | |
| Telugu, Tamil | No | |
| Han (Chinese) | No | |
| Kana + Kanji (Japanese) | No | |
| Hangul (Korean) | No | |
| Thai | No | |
| Ethiopic (Amharic, Oromo) | No | |
| Javanese | No | |

The single most important fact in this report sits here: the app sets `fontFamily: TEXT.family.regular` on essentially every Text node (49 `fontFamily` references across `components`, `app`, `shared`), and that font contains no glyph for Arabic, Hebrew, Devanagari, Bengali, Han, Thai, or any other non-Latin script listed above. Whatever the OS does with those missing glyphs decides whether the localised app renders at all.

### 4.2 What RN does when the named font lacks a glyph

There is no CSS-style fallback stack in React Native. `fontFamily` takes a single name; the NativeWind docs state it plainly: "React Native does not support fallback fonts. The value must be a single font name, not a comma-separated list" ([nativewind.dev/v5/guides/custom-fonts](https://www.nativewind.dev/v5/guides/custom-fonts)), and the long-standing core feature request for fallback fonts is issue #25798, still the canonical reference ([github.com/react/react-native/issues/25798](https://github.com/react/react-native/issues/25798)).

Per platform:

- iOS. Text renders through CoreText with the named font in an attributed string. CoreText runs a font cascade: missing glyphs are substituted from system fonts, and the substitution ignores the original font's weight and optical style. The material-foundation Roboto loader for iOS documents the exact behaviour this app will hit: "Roboto does not have characters for Arabic languages ... the fallback font used in this case does not care about the style used" ([github.com/material-foundation/material-roboto-font-loader-ios issue 12](https://github.com/material-foundation/material-roboto-font-loader-ios/issues/12)). Practical effect: Arabic renders, in the system's Arabic face (San Francisco Arabic), at a weight that does not match the Medium used for emphasis, with metrics that do not match the 22px line height tuned for Roboto.
- Android. The platform's text stack falls back per glyph through the Noto families declared in the system font configuration; the fallback chain is the mechanism by which "the system ... will be searched for any glyphs not handled by the default fonts" ([android.googlesource.com fallback_fonts.xml](https://android.googlesource.com/platform/frameworks/base/+/52c489cd63cca0361f374f7cb392018fabfa8bcc/data/fonts/fallback_fonts.xml)). Setting a custom typeface keeps that chain available for glyphs the typeface lacks on modern Android. Evidence specific to RN 0.88 with a bundled font is thin; community reports describe Arabic appearing in the system face when the bundled font lacks it, matching the cascade model, but no authoritative RN statement was found. UNVERIFIED. Experiment: an Expo debug build with `fontFamily: 'Roboto-Regular'` rendering `الفجر` on an Android emulator, inspecting the rendered typeface; a tofu-box result would flip this conclusion and make bundling mandatory rather than recommended.

Working assumption for planning: both platforms render the text via system fallback, with style mismatch on iOS and possible weight loss on Android. It is a silent quality failure, not a blank screen. The one scenario that does produce boxes is a custom font that maps the codepoints but lacks the glyphs, which is not the case here.

### 4.3 Font options and real sizes

Sizes measured by downloading the current hinted TTFs from `notofonts.github.io` and the CJK OTF from `notofonts/noto-cjk`:

| Font | Bytes (Regular, hinted) | Covers |
|---|---|---|
| Roboto Regular (bundled today) | 168,260 | Latin, Cyrillic, Greek, Vietnamese, Turkish |
| Noto Sans Arabic | 234,892 | Arabic script incl. Arabic-Indic digits |
| Noto Naskh Arabic | 247,336 | Arabic, bookish Naskh style |
| Noto Nastaliq Urdu | 253,396 | Urdu in Nastaliq |
| Noto Sans Devanagari | 243,520 | Hindi, Marathi |
| Noto Sans Bengali | 143,072 | Bengali |
| Noto Sans Hebrew | 26,860 | Hebrew |
| Noto Sans Thai | 37,780 | Thai |
| Noto Sans Gurmukhi | 55,172 | Punjabi |
| Noto Sans Gujarati | 200,704 | Gujarati |
| Noto Sans Tamil | 73,992 | Tamil |
| Noto Sans Telugu | 235,176 | Telugu |
| Noto Sans Ethiopic | 376,804 | Amharic and relatives |
| Noto Sans Javanese | 120,504 | Javanese |
| Noto Sans CJK SC (OTF, one weight) | 16,437,164 | Chinese, Japanese, Korean |

Derived totals:

| Bundle | Payload |
|---|---|
| All non-CJK scripts above, one weight | 1,976 KB |
| Same, two weights (Regular + Medium to match today) | 3,952 KB, roughly 3.8 MB added to both APK and IPA |
| Any single CJK weight added | +16.4 MB |
| Full static Pan-CJK set | 593.7 MB, per Adobe's Source Han variable-font write-up ([blog.adobe.com](https://blog.adobe.com/en/publish/2021/04/08/source-han-sans-goes-variable)); the variable single-file OTC is the realistic alternative |

Urdu deserves its own note. Urdu readers expect Nastaliq, the hanging calligraphic style, and report Naskh as readable but bookish/foreign for Urdu; Arabic readers expect Naskh or a sans. Write-ups aimed at Urdu users put it as: Nastaliq for Urdu identity, Naskh for small-size readability ([urdu-nigaar.com/best-urdu-fonts](https://www.urdu-nigaar.com/best-urdu-fonts/), [kitab.noorui.com/en/blog/nastaliq-vs-naskh](https://kitab.noorui.com/en/blog/nastaliq-vs-naskh)). Noto ships both: Noto Nastaliq Urdu for Urdu, Noto Naskh Arabic or Noto Sans Arabic for Arabic ([fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu](https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu)). The two cannot share metrics: see 4.5.

Subsetting and variable fonts: subsetting each Noto file to the codepoints the app's strings use (a few hundred per script) cuts each file by 60 to 90 percent; the prayer-name and settings vocabularies are small and enumerable, and a build-time subset step against the translation catalogues is deterministic. Google's web delivery slices CJK into more than one hundred `unicode-range` subsets so a page downloads a few hundred KB, not 16 MB; that mechanism is web-only.

### 4.4 Delivery options, and which work offline-first

| Option | Size cost | Offline | Verdict for this app |
|---|---|---|---|
| Bundle per-script Noto files with `expo-font` config plugin | ~3.8 MB both weights, non-CJK | Yes, embedded at build | Viable for Arabic/Urdu/Persian/Hebrew/Indic; ruinous for CJK |
| Runtime load with `Font.loadAsync`/`useFonts` after language choice | Same bytes, downloaded post-install | Yes once fetched; first launch online | Works, and Expo documents the constraint: "the fonts are not reloaded when you dynamically change the font map. A `fontFamily` loads once" ([docs.expo.dev/versions/v58.0.0/sdk/font](https://docs.expo.dev/versions/v58.0.0/sdk/font)). Load only the selected locale's file; cache it in the expo-asset cache |
| Android Downloadable Fonts (Google Play services provider) | 0 in APK | Font fetched over network on first use, then cached and shared system-wide; provider dependency ([developer.android.com](https://developer.android.com/develop/ui/views/text-and-emoji/downloadable-fonts)) | Not reachable from RN without a native module, and the first-run network dependency conflicts with offline-first; reject |
| Drop `fontFamily` for non-Latin text, let the OS pick | 0 | Yes | The pragmatic recommendation: iOS and Android system fonts cover every script in the top 20 with tuned metrics. Cost is visual inconsistency against Roboto |
| On-demand asset delivery (Play Asset Delivery / app-store resource packs) | 0 in base | Yes once delivered | Real but heavy machinery for a font set this size; only worth it if CJK bundles ship |

### 4.5 Line height and vertical metrics

Measured from the same font files (`hhea` ascent/descent over units per em):

| Font | Total line span (em) | Versus the app's 1.22em line height |
|---|---|---|
| Roboto (bundled) | 1.17 | Fits |
| Noto Sans Devanagari | 1.30 | Tight; conjuncts and matras above the shirorekha reach past `hhea` in places |
| Noto Sans Thai | 1.51 | Clips stacked tone marks at 1.22em |
| Noto Naskh Arabic | 1.70 | Clips deep descenders |
| Noto Sans Arabic | 2.11 | Clips badly; the 2.11 figure includes mark extremes, but 1.6em is the practical floor |
| Noto Nastaliq Urdu | 2.50 | Unusable at 1.22em; Nastaliq stacks diagonally and needs roughly double Latin leading |

The W3C states the general rule: "It is very common for non-Latin text to have much taller characters than Latin text ... numerous scripts which require much more height than Latin, including Arabic (especially in Nastaliq fonts), Chinese, Devanagari, Japanese, Korean, Tibetan" ([w3.org text size in translation](https://www.w3.org/International/articles/article-text-size.en.html)). React Native has the same failure on its own tracker: descender cutoff after a 0.76 upgrade, "using a line-height the same as font-size will cause clipping" ([github.com/react/react-native/issues/49886](https://github.com/react/react-native/issues/49886)); Android adds `includeFontPadding` behaviour that shifts vertical centring ([reactnative.dev/docs/text-style-props](https://reactnative.dev/docs/text-style-props)).

Remedy: per-script line-height multipliers instead of the single `TEXT.lineHeight.default = 22`. Floors: 1.4em Arabic sans or Naskh, 1.5em Devanagari and Thai, 2.0em or more for Nastaliq Urdu. The fixed row height of 57px accommodates a one-line 18px name at any of those leading values; Nastaliq at 2.0em plus the row's other elements is the one case to mock up before committing.

### 4.6 Text expansion versus English

Published tables. The W3C republishes IBM's guidance: for English sources up to 10 characters, expect 200 to 300 percent expansion; 11 to 20 characters, 180 to 200 percent; 21 to 30, 160 to 180 percent; 31 to 50, 140 to 160 percent; over 70, 130 percent ([w3.org/International/articles/article-text-size](https://www.w3.org/International/articles/article-text-size.en.html)). The same page carries the Flickr "views" measurement: Korean 0.8x, English 1.0x, Chinese 1.2x, Portuguese and French 2.6x, German 2.8x, Italian 3.0x. A second IBM table via tcworld gives 100 to 200 percent additional space for strings up to 10 characters ([tcworld.info](https://www.tcworld.info/e-magazine/translation-and-localization/changes-in-text-size-and-how-to-tackle-them-1190)).

Per-language figures, Kwintessential's table ([kwintessential.co.uk](https://www.kwintessential.co.uk/blog/translation-text-expansion-how-it-affects-design-2)); entries marked est. are absent from the published tables and are engineering estimates from script typology, flagged as such:

| Language | Versus English | Source |
|---|---|---|
| German | +10 to +35% | Kwintessential |
| French | +15 to +20% | Kwintessential |
| Spanish | +15 to +30% | Kwintessential |
| Portuguese | +15 to +30% | Kwintessential |
| Russian | +15% | Kwintessential |
| Turkish | +15% (est.) | not in cited tables |
| Arabic | +20 to +25% | Kwintessential |
| Hindi | +15 to +35% | Kwintessential |
| Thai | +15% | Kwintessential |
| Vietnamese | +15 to +25% (est.) | Latin with heavy diacritics; not in cited tables |
| Urdu | +20 to +25% (est.) | Arabic-script typology; not in cited tables |
| Bengali | +15 to +20% (est.) | not in cited tables |
| Persian | +20 to +25% (est.) | not in cited tables |
| Swahili | +10 to +15% (est.) | not in cited tables |
| Punjabi | +15 to +35% (est.) | Gurmukhi parallels Devanagari; not in cited tables |
| Indonesian | 0 to +10% (est.) | not in cited tables |
| Tagalog | +10 to +20% (est.) | not in cited tables |
| Japanese | -10 to -55% | Kwintessential |
| Korean | -10 to -15% | Kwintessential |
| Chinese | -30 to -50% | Polilingua, monosyllabic structure ([polilingua.com](https://www.polilingua.com/blog/post/chinese-translation-text-compression.htm)) |

Two structural warnings from the same W3C page. First, contraction causes its own bug: CJK characters are full-width, so a two-character Chinese name can still be wider than a seven-character English word; the width table in section 5 shows this with measured numbers (Chinese `日出` measures 36px against `Sunrise` at 60px, fine, but Japanese `ファジュル` at 90px is wider than `Sunrise`). Second, German and Dutch compound words cannot wrap at internal boundaries, so narrow columns fail differently.

---

## 5. Concrete rendering predictions for the prayer-name column

### 5.1 How the column works today

`InitialWidthMeasurement` renders the longest English name per list invisibly, reads its `onLayout` width, and stores it; `Prayer` gives every first-column Text `width: maxEnglishWidth + STYLES.prayer.padding.left` and every Arabic second column `flex: 1` right-aligned. The store only widens, so an early narrow measurement self-heals on the next launch (ISSUES #22 in the file's comment). English widths at 18px in the bundled Roboto, measured with `fontTools` advance sums:

| List | Width-setting name | Measured width at 18px |
|---|---|---|
| Standard | `Sunrise` | 59.8 px |
| Extras | `Last Third` | 80.4 px |

### 5.2 Translated names, character counts, measured widths

Translations collected from live prayer-time services per language (sources: namazvakti.com and dinimizislam.com for Turkish, islamicfinder.org and muslimpro.com locale pages for Indonesian, Russian, French, Spanish, Portuguese, German, Swahili; muslimbangla.com and jagonews24.com for Bengali; anwaar-e-madina.com and ur.wikipedia for Urdu; bahesab.ir and namaz.ir for Persian; baike.baidu.com and the App Store zh listing for Chinese; mzzjj.gz.gov.cn for the five-prayer naming; localised muslimpro pages for Japanese and Korean; hindu-language sources for Hindi). Widths are advance sums at 18px in the script's Noto font (Arabic in Noto Sans Arabic, Urdu in Noto Nastaliq Urdu, Devanagari, Bengali, CJK as labelled). Arabic-script widths are unshaped sums and so are upper bounds; joining typically removes 15 to 30 percent, and Nastaliq's stacking removes more while growing height.

Terms in order: Fajr, Sunrise, Dhuhr, Asr, Magrib, Isha, Midnight, Last Third, Suhoor, Duha, Istijaba.

| Lang | Script | Fajr | Sunrise | Dhuhr | Asr | Magrib | Isha | Midnight | Last Third | Suhoor | Duha | Istijaba |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| en | Latin | Fajr 30 | Sunrise 60 | Dhuhr 48 | Asr 27 | Magrib 56 | Isha 34 | Midnight 70 | Last Third 80 | Suhoor 57 | Duha 41 | Istijaba 58 |
| ar | Arabic | الفجر 53 | الشروق 67 | الظهر 50 | العصر 56 | المغرب 59 | العشاء 59 | نصف الليل 114 | آخر ثلث 75 | السحور 65 | الضحى 66 | استجابة 85 |
| fa | Arabic | فجر 36 | طلوع آفتاب 110 | ظهر 33 | عصر 39 | مغرب 42 | عشا 35 | نیمه‌شب 86 | آخر ثلث 75 | سحری 54 | چاشت 56 | استجابت 96 |
| ur | Nastaliq | فجر 45 | طلوع آفتاب 130 | ظہر 25 | عصر 45 | مغرب 56 | عشاء 52 | آدھی رات 76 | آخر ثلث 90 | سحری 58 | چاشت 63 | استجابت 111 |
| tr | Latin | İmsak 49 | Güneş 51 | Öğle 36 | İkindi 43 | Akşam 56 | Yatsı 40 | Gece yarısı 88 | Teheccüd 79 | Sahur 46 | Kuşluk 54 | İsticabe 63 |
| id | Latin | Subuh 50 | Terbit 47 | Zuhur 47 | Asar 37 | Magrib 56 | Isya 32 | Tengah Malam 120 | Sepertiga Akhir 122 | Sahur 46 | Duha 41 | Istijabah 68 |
| ru | Cyrillic | Фаджр 58 | Восход 61 | Зухр 38 | Аср 31 | Магриб 64 | Иша 37 | Полночь 74 | Последняя треть 145 | Сухур 48 | Духа 41 | Истиджаба 96 |
| fr | Latin | Fajr 30 | Lever du soleil 115 | Dhuhr 48 | Asr 27 | Maghrib 66 | Isha 34 | Minuit 50 | Dernier tiers 97 | Suhur 46 | Duha 41 | Istijaba 58 |
| es | Latin | Fajr 30 | Amanecer 82 | Dhuhr 48 | Asr 27 | Maghrib 66 | Isha 34 | Medianoche 99 | Último tercio 102 | Suhur 46 | Duha 41 | Istijaba 58 |
| de | Latin | Fadschr 65 | Sonnenaufgang 126 | Zuhr 37 | Asr 27 | Maghrib 66 | Isha 34 | Mitternacht 92 | Letztes Drittel 111 | Suhur 46 | Duha 41 | Istijaba 58 |
| pt | Latin | Fajr 30 | Nascer do sol 110 | Dhuhr 48 | Asr 27 | Maghrib 66 | Isha 34 | Meia-noite 84 | Último terço 98 | Suhur 46 | Duha 41 | Istijaba 58 |
| hi | Devanagari | फज्र 35 | सूर्योदय 55 | ज़ुहर 30 | असर 33 | मग़रिब 43 | इशा 26 | मध्यरात्रि 67 | अंतिम तृतीयांश 97 | सहरी 34 | चश्त 34 | इस्तिजाबा 69 |
| bn | Bengali | ফজর 41 | সূর্যোদয় 75 | যুহর 32 | আসর 43 | মাগরিব 54 | এশা 30 | মধ্যরাত 61 | শেষ তৃতীয়াংশ 101 | সেহরি 43 | দোহা 45 | ইস্তিজাবা 74 |
| zh | Han | 晨礼 36 | 日出 36 | 晌礼 36 | 晡礼 36 | 昏礼 36 | 宵礼 36 | 午夜 36 | 后三分之一夜 108 | 苏胡尔 54 | 杜哈 36 | 应答祷告 72 |
| ja | Kana+Han | ファジュル 90 | 日の出 54 | ズフル 54 | アスル 54 | マグリブ 72 | イシャー 72 | 真夜中 54 | 夜の最後の三分の一 162 | スフール 72 | ドゥハー 72 | イスティジャーバ 144 |
| ko | Hangul | 파즈르 50 | 일출 33 | 주흐르 50 | 아스르 50 | 마그리브 66 | 이샤 33 | 자정 33 | 밤의 마지막 삼분의일 157 | 수후르 50 | 두하 33 | 이스티자바 83 |
| sw | Latin | Alfajiri 51 | Macheo 65 | Adhuhuri 72 | Alasiri 50 | Magharibi 80 | Isha 34 | Usiku wa manane 141 | Sehemu ya mwisho 156 | Sahur 46 | Duha 41 | Istijaba 58 |

### 5.3 Predicted column widths and the 2x flags

Column width per language equals the widest name in that language, since the measurement machinery generalises to whichever list it is handed.

| Lang | Standard-list width (px) | vs English 60 | Extras-list width (px) | vs English 80 | Width-setting name | Plausibly over 2x English |
|---|---|---|---|---|---|---|
| en | 60 | 1.00 | 80 | 1.00 | Sunrise / Last Third | baseline |
| ar | 67 | 1.12 | 114 | 1.42 | الشروق / نصف الليل | no |
| fa | 110 | 1.84 | 96 | 1.19 | طلوع آفتاب / استجابت | near (shaping will cut it) |
| ur | 130 | 2.17 | 111 | 1.38 | طلوع آفتاب / استجابت | yes (Nastaliq stacking reduces it) |
| tr | 56 | 0.94 | 88 | 1.09 | Akşam / Gece yarısı | no |
| id | 56 | 0.94 | 122 | 1.52 | Magrib / Sepertiga Akhir | no |
| ru | 64 | 1.07 | 145 | 1.80 | Магриб / Последняя треть | no |
| fr | 115 | 1.92 | 97 | 1.21 | Lever du soleil / Dernier tiers | near |
| es | 82 | 1.37 | 102 | 1.27 | Amanecer / Último tercio | no |
| de | 126 | 2.11 | 111 | 1.38 | Sonnenaufgang / Letztes Drittel | yes |
| pt | 110 | 1.84 | 98 | 1.22 | Nascer do sol / Último terço | near |
| hi | 55 | 0.92 | 97 | 1.21 | सूर्योदय / अंतिम तृतीयांश | no |
| bn | 75 | 1.25 | 101 | 1.26 | সূর্যোদয় / শেষ তৃতীয়াংশ | no |
| zh | 36 | 0.60 | 108 | 1.34 | all equal / 后三分之一夜 | no |
| ja | 90 | 1.50 | 162 | 2.02 | ファジュル / 夜の最後の三分の一 | yes (extras) |
| ko | 66 | 1.10 | 157 | 1.95 | 마그리브 / 밤의 마지막 삼분의일 | near (extras) |
| sw | 80 | 1.34 | 156 | 1.94 | Magharibi / Sehemu ya mwisho | near (extras) |

Reading of the table:

1. The width-setting names are not the ones the current code assumes. In Arabic the extras column is set by `نصف الليل` (Midnight, 114px), not `آخر ثلث` (Last Third, 75px), because `getLongestPrayerNameIndex` picks by character count and Arabic `Midnight` has nine characters to `Last Third`'s seven. Character count is a poor proxy for width in every non-Latin script; Japanese `日の出` is three characters and 54px while `ファジュル` is five characters and 90px.
2. Languages where a name plausibly exceeds twice the English width: Urdu (`طلوع آفتاب`, 2.17x before Nastaliq stacking), German (`Sonnenaufgang`, 2.11x), Japanese extras (`夜の最後の三分の一`, 2.02x). Persian, French and Portuguese land near 1.9x. These need a decision, not luck.
3. Contraction bites in CJK: every Chinese standard-list name is 36px, 60 percent of English, so a Chinese user sees a narrow first column and a wide gap before the time. The same column that overflows in German underfills in Chinese.
4. On a 390pt screen the extras row holds name column plus Arabic column plus time plus alert within roughly 340px of usable width. At English widths that is 80 plus about 14 padding plus the rest. A 162px Japanese extras column consumes double, and the Arabic column (`flex: 1`) absorbs the loss by shrinking, which is where it silently breaks: `flex: 1` with no `minWidth` can be squeezed to zero and the right-aligned Arabic then clips.

### 5.4 Strategy ranking

| Rank | Strategy | Verdict |
|---|---|---|
| 1 | Per-locale measured column | Reuses `InitialWidthMeasurement` unchanged in mechanism: hand it the locale's name array instead of `PRAYERS_ENGLISH`, keep the widen-only store, keep the self-heal. The column is correct by construction in every script, including the CJK contraction case, with zero per-language maintenance. Pair with a `minWidth` on the Arabic column and a `maxWidth` cap (say 45 percent of row width) so no locale starves the time column |
| 2 | Two-line wrapping with a taller row for flagged locales | Survives everything; `numberOfLines={2}` plus a per-locale row height. Costs the fixed 57px rhythm, touches the cascade animation timings, and the overlay placement tests (`overlayPlacement.test.ts`) key off row geometry. Do it only for locales the measured column flags |
| 3 | `adjustsFontSizeToFit` with `minimumFontScale` | iOS-only in practice; on Android the prop historically does nothing, and New Arch added its own bug: `minimumFontScale` broken in 0.77.1 ([github.com/react/react-native/issues/50248](https://github.com/react/react-native/issues/50248)) and differing Text behaviour on Fabric ([#42044](https://github.com/react/react-native/issues/42044)). Useful as a safety net on iOS, never as the primary mechanism, and it breaks the 18px typographic consistency the design leans on |
| 4 | Abbreviation table | Translator-owned short forms per locale (`Tengah Malam` to `T. Malam`). Works, but prayer names are religious vocabulary; inventing abbreviations for `الثلث الأخير` reads as irreverence before it reads as economy. Only acceptable where a natural short form already exists in the target culture (Turkish `Teheccüd`, Indonesian `Sahur`) |
| 5 | Truncation with ellipsis | Never. Cutting `آخر ثلث` to `آخر...` in a worship context is the single fastest route to a one-star review, and it hides information the user cannot guess |

---

## 6. Verdict

### 6.1 Layout direction policy

Keep the app pinned LTR at the layout level: `allowRTL(false)`, `supportsRTL: false` via the `expo-localization` plugin, physical styles left as they are. Full mirroring under Fabric is a launch-time restart on every language change (#48311, #45661), a sweep of 49 `fontFamily` sites and every physical padding, and a redesign of the overlay cascade, for a screen that is a timetable rather than prose. Amend the policy in one respect: pinning the boxes LTR does not require left-aligning their contents. RTL strings get an RTL base direction plus right alignment inside their LTR boxes, exactly as the Arabic second column already does. Ship `direction: 'rtl'` on containers that hold multi-line RTL prose (the explanation overlay), isolate-wrap composed strings per 6.2, and tag `accessibilityLanguage`.

### 6.2 Bidi-safety rules for the code

1. A `bidi()` helper wraps interpolated values: `LRI + value + PDI` inside RTL strings, `RLI + value + PDI` inside LTR strings.
2. Every translated RTL name rendered in an LTR-base container is wrapped `RLI ... PDI`, which makes the string independent of the unreliable iOS `writingDirection` prop (#51235).
3. No LRE/RLE/PDF anywhere.
4. `toArabicNumbers` becomes locale-driven from CLDR region defaults (arab for most, latn for Morocco, Algeria, Tunisia, Libya, UAE), region-qualified locale required on Android 16+, with a user override.
5. A Jest snapshot test renders every catalogue string containing a digit or a bracket and fails on unexpected reordering; the assertions are logical-order comparisons plus isolate presence.

### 6.3 Font strategy

Two-tier. Latin, Cyrillic, Greek, Vietnamese and Turkish stay on the bundled Roboto. For every other script, drop the explicit `fontFamily` and let the platform fonts render: both OSes cover all top-20 scripts with tuned metrics, at zero payload, fully offline. If brand consistency is ruled important enough to pay for, bundle Noto per script for the RTL and Indic languages only, at a measured 3.8 MB for both weights across all non-CJK scripts, and subset against the translation catalogues to cut that by more than half. Never bundle CJK; 16.4 MB per weight measured. Urdu, if Nastaliq is chosen for authenticity, needs its own line-height class at roughly 2em and a row-height mock before commit. Line heights become per-script: 1.4em Arabic, 1.5em Devanagari and Thai, 1.17em Latin stays.

### 6.4 Prayer-name column strategy

Per-locale measured column, first rank. The machinery exists and self-heals; it needs the locale's name array instead of the English one, a `minWidth` on the Arabic column so `flex: 1` cannot be starved, and a `maxWidth` cap on the name column. Two-line wrapping with a taller row remains the fallback for locales the measurement flags (Japanese extras today). `adjustsFontSizeToFit` only as an iOS safety net. No truncation, no invented abbreviations.

### 6.5 Strongest argument against this recommendation

Material Design 3 states that improper RTL rendering "can create cognitive overload and negatively impact user sentiment and trust" and instructs designers not to apply LTR directionality to RTL content at all ([m3.material.io](https://m3.material.io/foundations/layout/bidirectionality-rtl)). Both platform vendors, every design system surveyed, and the only named-app precedent where this exact rendering appeared (Bluesky, July 2026) treat unmirrored, left-aligned RTL as a bug to fix, while the products that persisted with it (Discord for years, Slack today) accumulated years of user resentment and third-party patch extensions. An Arabic user opening this app sees, on every screen, an interface that every other app on his phone mirrors. The recommendation survives that argument only because the screen is a single-column data table, the alternative carries a documented restart-and-half-apply failure mode under the app's chosen renderer, and the alignment half of the defect is fixed inside LTR boxes at near-zero cost. If the app later adds prose surfaces, a settings sheet with long paragraphs, or an onboarding flow, the never-mirror position weakens and should be revisited.
