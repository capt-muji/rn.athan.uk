# Verification 01: fonts (no-bundle claim)

Independent adversarial verification of the strongest claim in the record: no bundled font is
needed, ever, for Arabic, Devanagari (Hindi) or Thai, because OS per-glyph fallback serves them on
both floor platforms (Android 9, iOS 18). Method: read the code and assets directly, parse the
bundled font cmaps, cross-check the record. Branch `verify/39-localisation-deepseek-20261009` at
`52109ec0`. No file was modified.

## Findings

### F1. Only Roboto is bundled. CONFIRMED.
`assets/fonts/` holds exactly `Roboto-Regular.ttf` (168,260 B) and `Roboto-Medium.ttf` (168,644 B),
measured with `wc -c`. No other `.ttf`/`.otf` exists outside `node_modules`. `app.json:74-79`
embeds only those two through the `expo-font` plugin. No `ios/` or `android/` directory is
committed, so no second family can hide in generated natives. Matches `R3-RTL-AND-SCRIPTS.md:20`.

### F2. "896 codepoints, no Arabic" is true and reproducible. CONFIRMED.
Parsing both cmaps independently gives 896 codepoints each. `الفجر`, `नमाज़`, `ละหมาด` and `নামাজ`
are all absent. Latin digits and Cyrillic are present. The repo's own checker
`ai/plans/39-localisation/scripts/font-coverage.py:6-8` needs `fontTools`, which is not installed,
so the figure was reproduced with a standalone cmap parser instead.

### F3. Production already falls back to the OS for Arabic. CONFIRMED.
`TEXT.family.regular/medium = 'Roboto-Regular'/'Roboto-Medium'` (`shared/constants.ts:282-287`) is
set on the Arabic name (`components/prayer/Prayer.tsx:88-92,106-116`), the Arabic explanation line
(`components/prayer/Explanation.tsx:80,159-165`), the times (`components/prayer/Time.tsx:62-72`) and
the countdown (`components/countdown/Countdown.tsx:73-77`). The Arabic toggle defaults on
(`stores/ui.ts:132`), so OS fallback serves Arabic today. Whether the result "looks fine" is a visual
judgement no file settles.

### F4. Line-height and row constants, exact. CONFIRMED.
`TEXT.lineHeight.default = 22`, `TEXT.lineHeight.arabic = 24`, `TEXT.sizeArabic = 15`
(`shared/constants.ts:301-307`), so the shipped Arabic leading is 24/15 = 1.6em. The prayer row is
`STYLES.prayer.height = 57` (`shared/constants.ts:984`).

### F5. The 1.4em Arabic floor is a stale number the record elsewhere supersedes. CONTRADICTED.
`R17-SCALE-AND-FONTS.md:28,91` and `R3-RTL-AND-SCRIPTS.md:83` state a 1.4em Arabic floor.
`R3-FINDINGS.md:110-116` measures Noto Naskh at 1.70em. `SINGLE-LANGUAGE-PIVOT.md:249-251` explicitly
supersedes 1.4 with 1.70 as the governing floor. The lower figure is stale and understates the
leading a Naskh render needs.

### F6. The "fixed 57px row clips tall scripts" mechanism is mis-located. CONTRADICTED as stated.
`R3-FINDINGS.md:116` says the fixed 22px line height clips Thai, Devanagari and Arabic. The prayer
row name Text sets only `fontFamily` and `fontSize`, no line height (`Prayer.tsx:106-109`), so a
single 18px line inside the 57px centred row fits even at Naskh 1.70em (about 31px) or Thai 1.51em
(about 27px). The explicit 22px lands on prose surfaces (`Explanation.tsx:156` at 16px,
`Help.tsx:179-249`). The clipping risk is real. The named mechanism is not the row.

### F7. No tabular-figure failure exists at 2.0.0. CONFIRMED.
No `fontVariant` or `tabular-nums` appears in app code. Times sit in a single `flex: 1` centred cell
(`Time.tsx:64-70`), the countdown is centred (`Countdown.tsx:73-77`), and there is no per-digit cell.
Latin digits are inside the bundled Roboto (F2). iOS widgets already align digits with system
`monospacedDigit()` (`widgets/PrayerWidget.tsx:592,624,674`). All digits are Latin at 2.0.0
(`OWNER-DECISIONS.md:385`, D21), so the non-Latin tabular risk named in `R17-SCALE-AND-FONTS.md:86-88`
is empty at launch. Residual: proportional Latin digits shift the colon slightly inside the cell.

### F8. No script renders outside a fallback-capable stack. CONFIRMED.
The only SVG `<Text>` is the Latin qibla cardinals (`components/sheets/screens/QiblaCompass.tsx:132-142`,
text from `shared/qiblaCompass.ts:91-96`). Widgets render through SwiftUI/Glance system fonts
(`widgets/PrayerWidget.tsx:22,38`, `widgets/LockPrayerWidget.tsx:1-11`), never the bundled Roboto, so
they already depend on OS coverage. No Skia dependency exists (`package.json`, react-native-svg only).

### F9. The Devanagari/Thai/Bengali line-height constants are not implemented. CONFIRMED.
A tree-wide `lineHeight` sweep returns only `default` and `arabic` in `shared/constants.ts:303-308`
plus per-component literals. `PLAN.md` contains no font or line-height step. The per-script floors are
specified in prose (`PLAN-OUTLINE.md:36`) and not yet code.

### F10. iOS 18 coverage is not verifiable from this worktree. UNCERTAIN.
`R17-SCALE-AND-FONTS.md:79-82` cites Apple's system-font list. No machine-readable copy was fetched,
so the iOS leg rests on the record and the production Arabic precedent, not on reproduced evidence.

### F11. The milestone set is exactly where the claim is least proven. CONFIRMED.
The final milestone is en, ar, ms, so, hi, th (`OWNER-DECISIONS.md:466-494`). It names Hindi as "the
script Roboto cannot draw" and Thai as "the tallest script". The record itself rates the no-bundle
assumption Medium confidence (`ASSUMPTIONS.md:37`) and adds a per-locale 3T check as an acceptance
criterion (`SELF-REVIEW.md:89-94`). The top-line "no bundled fonts are needed, ever" outruns that:
proven for Arabic in production, plausible for Thai and Devanagari from the AOSP list, device-unproven
until the 3T check runs.

### F12. "The only real per-locale font work is line-height constants" understates the plan. CONTRADICTED.
The record also requires dropping the explicit `fontFamily` for non-Latin scripts
(`R3-FINDINGS.md:103,170`), which is code work at every Text node, plus per-locale width measurement
and per-locale device checks (`R17-SCALE-AND-FONTS.md:99-106`). None is font-file cost, so the
no-bundle verdict survives.

## Break attempts

- Tabular figures force a bundle: no fixed digit cell, no `fontVariant`, digits are Latin and
  bundled, iOS widgets use system `monospacedDigit()`. Not broken.
- Devanagari or Thai absent on the floor Android: AOSP `pie-release` `fonts.xml` lists
  NotoSansThai, NotoSansDevanagari and NotoSansBengali, and production Arabic proves fallback on the
  device. Not broken, but external evidence, not a device run.
- The 57px row clips tall scripts: the row sets no line height, and one 18px line fits at 1.7em.
  Broke the wording only. The prose-surface risk stands.
- A render surface bypasses fallback: SVG text is Latin-only, widgets run on system fonts, no Skia.
  Not broken.
- The 896 figure unverifiable: reproduced with a standalone cmap parser. Not broken.
- iOS 18 font list: no authoritative source fetched, left UNCERTAIN.

## Better alternative and real cost

Keep the no-bundle default. Run the named 3T check for `hi` and `th` first. Bundle only a script that
demonstrates tofu or a clipped row. Real fetched sizes: `NotoSansDevanagari-Regular.ttf` 243,520 B and
`NotoSansThai-Regular.ttf` 37,780 B, so one weight for both hard milestone scripts is about 281 KB.
Bundling makes metrics deterministic but does not remove the per-script line-height work, and adds SIL
OFL licensing plus an `expo-font` entry. The record's decision is sound at the milestone; the wording
"ever" is the part to soften.
