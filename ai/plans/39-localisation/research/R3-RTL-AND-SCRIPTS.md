# R3: RTL, scripts, and the never-mirror decision (compressed)

Research report for session 39. Scope: layout direction policy, bidi inside pinned-LTR text,
font coverage for the top 20 languages, and the fixed-width prayer-name column. Written
2026-09-29 at 480 lines. **Compressed 2026-10-07** to the sections other documents do not
carry; the conclusions and rules the plan builds on live in `R3-FINDINGS.md` (the LTR-box/RTL-
text amendment to D7 and its evidence, the RLI U+2067 / PDI U+2069 isolate rule with the
`⁧الفجر⁩` example, the Fabric restart finding #48311/#45661, Nastaliq 2.50em and the
no-bundled-fonts verdict, the per-locale width-setting-name finding) and in `MEASURED.md` §5
(directional/measure-site counts: 63 directional props, 30 flexDirection, 32 absolute, 30
measure sites, 11 textAlign, 0 I18nManager). Recover the full original from git history (C4).

App facts used throughout, read from this worktree (kept as the anchor table for every count):

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

What is kept here, because nothing else carries it:

## 1. The bidi control set, complete (R3 §2.2)

RLI and PDI are in R3-FINDINGS. The other controls, from the W3C
(qa-bidi-unicode-controls), so nobody reaches for a deprecated one:

| Character | Code point | Class | Use in 2026 |
|---|---|---|---|
| LRI LEFT-TO-RIGHT ISOLATE | U+2066 | Paired isolate, closes with PDI U+2069 | Preferred wrapper for LTR islands (times, numbers) inside RTL text: `صلاة الفجر في ⁦05:42⁩` |
| RLI RIGHT-TO-LEFT ISOLATE | U+2067 | Paired isolate, closes with PDI U+2069 | Preferred wrapper for RTL islands inside LTR text; the fix for every prayer-name-in-LTR-column case: `⁧الفجر⁩` |
| FSI FIRST-STRONG ISOLATE | U+2068 | Paired isolate, closes with PDI | Preferred when the embedded content's direction is unknown at authoring time |
| LRE / RLE | U+202A / U+202B | Paired embedding, closes with PDF U+202C | Deprecated for hand-authoring (W3C: use RLI and LRI, avoid RLE and LRE, since embeddings allow spillover) |
| LRM / RLM | U+200E / U+200F | Single strong mark | Spot fix for one neutral |
| LRO / RLO | U+202D / U+202E | Override | Avoid; forces character order against the algorithm |

Library note kept with them: MessageFormat 2's Default Bidi Strategy inserts isolating
controls around placeholder output by specification (LDML tr35-messageFormat); whether a
given JS i18n library does this is implementation-specific and was UNVERIFIED for i18next and
intl-messageformat (settling experiment: format `{time}` inside an Arabic string with the
candidate library in Jest and inspect `codePointAt` output for U+2066/U+2069).

## 2. Yoga per-prop resolution (R3 §1.4)

Yoga resolves logical edges from the node's own direction
(yogalayout.dev, reactnative.dev/docs/layout-props):

| Style | LTR resolves to | RTL resolves to |
|---|---|---|
| `start`, `marginStart`, `paddingStart`, `borderStartWidth` | left | right |
| `end`, `marginEnd`, `paddingEnd`, `borderEndWidth` | right | left |
| `left`, `marginLeft` (physical) | left | left, unless `doLeftAndRightSwapInRTL` is active, in which case RN rewrites them to logical edges before layout |
| `position: 'absolute'` with `left` | left edge | same, modulo the swap above |

Two consequences kept: (1) the app's `paddingLeft` on the English column and `textAlign:
'right'` on the Arabic column are physical, so under the pinned-LTR policy they never move,
the desired outcome; (2) if mirroring is ever enabled, every physical style in
`shared/constants.ts` and the components becomes a per-locale branch, the concrete measure
of how much work full mirroring is in this codebase, which never used the `start`/`end`
authoring style.

## 3. Per-script line heights and floors (R3 §4.5)

R3-FINDINGS carries Roboto 1.17em, Naskh 1.70em, Arabic sans 2.11em, Nastaliq 2.50em. The
full measured table and the floors, from the same font files (`hhea` ascent/descent over
units per em):

| Font | Total line span (em) | Versus the app's 1.22em line height |
|---|---|---|
| Roboto (bundled) | 1.17 | Fits |
| Noto Sans Devanagari | 1.30 | Tight; conjuncts and matras above the shirorekha reach past `hhea` in places |
| Noto Sans Thai | 1.51 | Clips stacked tone marks at 1.22em |
| Noto Naskh Arabic | 1.70 | Clips deep descenders |
| Noto Sans Arabic | 2.11 | Clips badly; the 2.11 figure includes mark extremes, but 1.6em is the practical floor |
| Noto Nastaliq Urdu | 2.50 | Unusable at 1.22em; Nastaliq stacks diagonally and needs roughly double Latin leading |

Remedy: per-script line-height multipliers instead of the single `TEXT.lineHeight.default =
22`. **Floors: 1.4em Arabic sans or Naskh, 1.5em Devanagari and Thai, 2.0em or more for
Nastaliq Urdu.** The fixed row height of 57px accommodates a one-line 18px name at any of
those leading values; Nastaliq at 2.0em plus the row's other elements is the one case to mock
up before committing. Supporting findings kept: RN issue #49886 (descender clipping when
line-height equals font-size) and Android's `includeFontPadding` behaviour; the W3C rule that
non-Latin text commonly needs much more height than Latin.

## 4. The allowRTL(false) leftover surface (R3 §1.3)

With the app pinned LTR and the device language Arabic, these flip regardless of the app,
so the plan does not count them against the never-mirror decision:

| Surface | Flips? | Who controls it |
|---|---|---|
| System notifications, notification centre, control centre, app switcher | Yes, with device language | OS entirely |
| Keyboard (Arabic layout, key order) | Yes | OS entirely |
| Share sheet, print dialog, system permission prompts | Yes when the app declares Arabic localizations; otherwise the app's fallback language | OS, keyed off the app's declared localizations |
| In-app native alerts built with `UIAlertController` | Follows the app's effective semantic content direction, derived from the app localization list | Partly app-controlled via what `knownRegions` ships |
| Back-edged swipe gesture (iOS), gesture hint | Follows system direction | OS |
| RN-managed layout, flexbox order, `left`/`right` styles | No, when `allowRTL(false)` and `supportsRtl=false` | App |

The `knownRegions` trap kept: registering Arabic in the Xcode project's `knownRegions` to
localise permission strings also opts the UIKit layer into RTL semantics for system-presented
UI inside the app; shipping Arabic strings from JS without registering `ar` keeps every
native surface LTR and English. Untranslated permission prompts versus OS-flipped alerts is a
real trade the plan must choose consciously.
