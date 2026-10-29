/**
 * The per-locale typography map (D74.2, D74.4): which family, size, line
 * height and letter spacing the app's text renders for the active locale.
 */

import { TEXT } from '@/shared/constants';
import type { LocaleId } from '@/shared/i18n/locale';

/** The ar size factor: the bundled family and its real medium weight carry the
 * fix, so ar sizes stay at the pre-change values until the owner pins a parity number */
const ARABIC_SIZE_FACTOR = 1;

export interface LocaleTypography {
  familyRegular: string;
  familyMedium: string;
  /** Timer digits are Latin glyphs in every locale (row 82), riding the locale's own medium face beside the word styles */
  familyDigits: string;
  /** The row time is Latin glyphs in every locale, so the record names its regular face for them */
  familyRowTime: string;
  /** The timer's digit size: ar runs two points under the shared token (row 81a) */
  countdownSize: number;
  size: (n: number) => number;
  lineHeight: (n: number) => number;
  letterSpacing: (n: number) => number;
  /** Word styles must name the record's family explicitly; the Latin records leave the system default */
  wordFace: boolean;
  /** The record's script needs a taller line box than its size suggests (ar's clamped blocks); absent when the font's own metrics serve */
  scriptLineHeight?: (n: number) => number;
}

const ARABIC: LocaleTypography = {
  familyRegular: 'Rubik-Regular',
  familyMedium: 'Rubik-Medium',
  familyDigits: 'Rubik-Medium',
  familyRowTime: 'Rubik-Regular',
  countdownSize: TEXT.sizeLarge - 2,
  size: (n) => Math.round(n * ARABIC_SIZE_FACTOR),
  lineHeight: (n) => Math.round(n * ARABIC_SIZE_FACTOR),
  letterSpacing: () => 0,
  wordFace: true,
  scriptLineHeight: (n) => Math.round(n * 1.5),
};

// Devanagari carries no glyphs in the Latin faces, so its words name their own pair (the
// row-106 Rubik pattern); digits and row times stay Roboto, the app's Latin digits everywhere
const HINDI: LocaleTypography = {
  familyRegular: 'NotoSansDevanagari-Regular',
  familyMedium: 'NotoSansDevanagari-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
  // The face's win ink runs past its own 1.304em box (measured 0.558em descent against the
  // box's 0.408em), so ink-bearing surfaces take the taller script box, the Arabic pattern
  scriptLineHeight: (n) => Math.round(n * 1.5),
};

// Thai's own 1.511em box already clears its ink (descent and win descent both 0.450em), so
// no script box: the font's own metrics serve, the row-87 law
const THAI: LocaleTypography = {
  familyRegular: 'NotoSansThai-Regular',
  familyMedium: 'NotoSansThai-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
};

// Urdu's five own letters (ٹ ڈ ڑ ھ ے) are absent from Rubik (measured with fontTools,
// plan T-410 decision 3), so its words name the Naskh pair; digits and row times stay
// Roboto. The pair's own hhea box is 1.703em (ascent 1069, descent -634, UPM 1000, both
// weights) while its win ink spans 2.039em (winAscent 1405), so the box-bearing row-106
// law applies: ink-bearing surfaces take the script box, pinned at the shipped RTL 1.5em
// line (R3 §3's Naskh floor is 1.4em; the ARABIC and HINDI records set the 1.5 precedent).
// Pashto rides this same record: Rubik carries none of its eleven own letters (U+067C
// U+0688 U+0691 U+0681 U+0685 U+069A U+0696 U+06BC U+06D0 U+06CD U+06AB, measured absent
// by explicit codepoint in both weights, plan T-419 decision 7) while this Naskh pair
// carries them all plus the Persian prose digits ۰-۹, both weights, same 1.703em box
// against 2.039em win ink. Sindhi, Uyghur and Shahmukhi Punjabi ride it too (plan
// T-427 decision 4): measured the same day by explicit codepoint, this pair carries
// all fifteen Sindhi letters, Uyghur's eight and Shahmukhi's thirteen, both weights,
// while Rubik lacks every one of them. Saraiki, Balochi and Kashmiri ride it too
// (plan T-453 decision 10): measured 2026-10-29 by explicit codepoint, this pair
// carries Saraiki's eight own letters, Balochi's five and Kashmiri's fourteen in
// both weights while Roboto and Rubik carry none of the twenty-seven, and every
// character of each locale's whole keyed surface (108, 104 and 112 distinct
// characters: catalog, native strings, widget statics and endonym) is carried by
// both weights
const URDU: LocaleTypography = {
  familyRegular: 'NotoNaskhArabic-Regular',
  familyMedium: 'NotoNaskhArabic-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
  scriptLineHeight: (n) => Math.round(n * 1.5),
};

// Bengali has no R3 §3 row, so this record's script box is this wave's own measurement
// (plan T-410 decision 3): the pair's own hhea box is 1.325em (ascent 917, descent -408,
// UPM 1000, both weights) while its win ink spans 1.403em (winAscent 995, the matra row
// above the headline), so the box-bearing row-106 law applies and ink-bearing surfaces
// take the 1.5em script line the HINDI record already renders
const BENGALI: LocaleTypography = {
  familyRegular: 'NotoSansBengali-Regular',
  familyMedium: 'NotoSansBengali-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
  scriptLineHeight: (n) => Math.round(n * 1.5),
};

// Tamil has no R3 section 3 row, so this record's script box is this wave's own
// measurement (plan T-419 decision 7): the pair's own hhea box is 1.240em (ascent
// 870, descent -370, UPM 1000, both weights) and its win ink matches it, and the
// worst GPOS-stacked mark (anusvara over a base) tops at 843 units (0.843em)
// under that ascent, so the box clears the script's ink and the font's own
// metrics serve - no script box, the Thai row-87 law
const TAMIL: LocaleTypography = {
  familyRegular: 'NotoSansTamil-Regular',
  familyMedium: 'NotoSansTamil-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
};

// Malayalam, same wave's own measurement: the declared hhea box and win ink are
// both 1.247em (ascent 864, descent -383, UPM 1000, both weights), but the
// script's stacked ink runs past them - the GPOS reph-over-base rows top at 963
// and 971 units (0.963em and 0.971em, Regular and Medium) against the 864
// ascent, the Bengali matra case - so ink-bearing surfaces take the 1.5em script
// line the HINDI and BENGALI records already render
const MALAYALAM: LocaleTypography = {
  familyRegular: 'NotoSansMalayalam-Regular',
  familyMedium: 'NotoSansMalayalam-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
  scriptLineHeight: (n) => Math.round(n * 1.5),
};

// Yoruba cannot ride Roboto: measured 2026-10-28 with fontTools over the bundled faces,
// Roboto carries ẹ U+1EB9 and ọ U+1ECD but lacks ṣ U+1E63 and Ṣ U+1E62 in both weights,
// and no bundled face carries them (plan T-427 decision 5). The Noto Sans pair is instanced
// from the google/fonts variable source at 400 and 500 outside the repository. Yoruba's own
// glyph ink sits inside the em square (worst glyph top 944, worst bottom -240, the combining
// acute at 766, the dot below at -186), but the pair's declared win metrics do not: its hhea
// box is 1.362em (ascent 1069, descent -293, UPM 1000, both weights) against a 1.519em win
// ink (winAscent 1124, winDescent 395), the measurement the AFRICAN record carries over the
// same pair, so the box-bearing row-106 law applies and ink-bearing surfaces take AFRICAN's
// 1.55em script line
const YORUBA: LocaleTypography = {
  familyRegular: 'NotoSans-Regular',
  familyMedium: 'NotoSans-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
  scriptLineHeight: (n) => Math.round(n * 1.55),
};

const LATIN: LocaleTypography = {
  familyRegular: TEXT.family.regular,
  familyMedium: TEXT.family.medium,
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: false,
};

// Simplified Chinese rides its own subset pair (plan T-419 decision 8): the full
// statics run near 10MB a weight, so the bundled pair is cut over the closed
// string set - every character of the zh-Hans catalog, its native-strings row,
// its widget-statics row and its endonym, 377 characters, gated by the glyph
// lock (shared/i18n/cjk-glyph-lock.json) - a fortieth of the bytes. This wave's
// own measurement over the cut subsets (fontTools, both weights): hhea ascent
// 1160, descent -288, lineGap 0 against UPM 1000, a 1.448em box the win ink
// (1160/288) matches exactly, so the box clears the ink and no surface pins a
// script box - the Thai row-87 law
const HANS: LocaleTypography = {
  familyRegular: 'NotoSansSC-Subset-Regular',
  familyMedium: 'NotoSansSC-Subset-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
};

// Traditional Chinese rides the TC twin of the same cut: 378 characters, the
// same measured box (hhea 1160/-288, lineGap 0, win 1160/288, UPM 1000, both
// weights), so the same row-87 law serves
const HANT: LocaleTypography = {
  familyRegular: 'NotoSansTC-Subset-Regular',
  familyMedium: 'NotoSansTC-Subset-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
};

// No shipped face carries the African Latin letters: Roboto and Rubik both lack
// ɛ ɔ ɲ (U+025B U+0254 U+0272) and ɓ ɗ ƴ (U+0253 U+0257 U+01B4), measured by explicit
// codepoint in both weights of all twenty bundled TTFs (plan T-428 decision 4), so
// Bambara and Fulfulde name the bundled Noto Sans pair. Its hhea box is 1.362em
// (ascent 1069, descent -293, UPM 1000, both weights) while its win ink spans
// 1.519em (winAscent 1124, winDescent 395), so the box-bearing row-106 law applies
// and ink-bearing surfaces take a script line that clears the measured ink: 1.55em
const AFRICAN: LocaleTypography = {
  familyRegular: 'NotoSans-Regular',
  familyMedium: 'NotoSans-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
  scriptLineHeight: (n) => Math.round(n * 1.55),
};

// Telugu has no coverage in any bundled face, so this wave bundles the Noto Sans
// Telugu v2.005 pair. Its hhea box is 1.352em (ascent 869, descent -483, UPM 1000,
// both weights) while its win ink spans 1.478em (winAscent 995, winDescent 483),
// so the box-bearing row-106 law applies and ink-bearing surfaces take the 1.5em
// script line the HINDI and BENGALI records already render
const TELUGU: LocaleTypography = {
  familyRegular: 'NotoSansTelugu-Regular',
  familyMedium: 'NotoSansTelugu-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
  scriptLineHeight: (n) => Math.round(n * 1.5),
};

// Gujarati, same wave's own measurement: the Noto Sans Gujarati v2.106 pair's
// hhea box is 1.304em (ascent 896, descent -408, UPM 1000, both weights) while
// its win ink spans 1.484em (winAscent 1076, winDescent 408), so ink-bearing
// surfaces take the 1.5em script line
const GUJARATI: LocaleTypography = {
  familyRegular: 'NotoSansGujarati-Regular',
  familyMedium: 'NotoSansGujarati-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
  scriptLineHeight: (n) => Math.round(n * 1.5),
};

// Kannada has no coverage in any bundled face, so this wave bundles the Noto Sans
// Kannada v2.006 pair. Its hhea box is 1.349em (ascent 809, descent -540, UPM 1000,
// both weights) while its win ink spans 1.645em (winAscent 1105, winDescent 540), so
// the 1.5em house value does not clear the measured ink and this wave's own measurement
// pins a taller box: a 1.65em factor rounded up with Math.ceil, because Math.round lands
// under the ink at the 16pt row (16 x 1.65 is 26.4, and 26px is 1.625em against 1.645em)
const KANNADA: LocaleTypography = {
  familyRegular: 'NotoSansKannada-Regular',
  familyMedium: 'NotoSansKannada-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
  scriptLineHeight: (n) => Math.ceil(n * 1.65),
};

// Ethiopic, same wave's own measurement: the Noto Sans Ethiopic v2.102 pair's
// hhea box is 1.362em (ascent 1069, descent -293, UPM 1000, both weights) and its
// win ink matches it exactly (winAscent 1069, winDescent 293), so the box clears
// the ink and the font's own metrics serve - the Thai row-87 law
const ETHIOPIC: LocaleTypography = {
  familyRegular: 'NotoSansEthiopic-Regular',
  familyMedium: 'NotoSansEthiopic-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
};

// No bundled face carries a single Thaana codepoint (measured 2026-10-29), so this
// wave bundles the Noto Sans Thaana v3.001 pair from the notofonts release statics,
// under the OFL licence file already in assets/fonts. This wave's own measurement
// with fontTools over the bundled pair, both weights: UPM 1000, hhea ascent 1069,
// descent -424, lineGap 0, a 1.493em box, with usWinAscent 1069 and usWinDescent
// 424 (1.493em), so the box equals the pair's own declared ink bounds, and the
// block's glyphs run +751 and -306 units at the extremes, inside the box. The box
// clears the ink, so no script box is pinned - the Thai row-87 law. A 1.5em pin was
// rejected: no measurement this pair makes asks for it (plan T-453 decision 10)
const THAANA: LocaleTypography = {
  familyRegular: 'NotoSansThaana-Regular',
  familyMedium: 'NotoSansThaana-Medium',
  familyDigits: TEXT.family.medium,
  familyRowTime: TEXT.family.regular,
  countdownSize: TEXT.sizeLarge,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  wordFace: true,
};

/** One record per shipped locale: a new language adds its entry here and its id to RTL_IDS
 * if it reads right to left. A record boundary (a script record against the Latin set) changes
 * the faces a context froze at module scope, so a switch across one relaunches the context. */
const RECORDS: Record<LocaleId, LocaleTypography> = {
  en: LATIN,
  ar: ARABIC,
  ms: LATIN,
  so: LATIN,
  hi: HINDI,
  th: THAI,
  id: LATIN,
  tr: LATIN,
  fr: LATIN,
  uz: LATIN,
  sw: LATIN,
  ha: LATIN,
  pt: LATIN,
  ur: URDU,
  fa: ARABIC,
  bn: BENGALI,
  // Roboto covers ru's Cyrillic, az's schwa and every sq/bs/de diacritic
  // (measured with fontTools, plan T-419 decision 7), so all five take LATIN
  ru: LATIN,
  az: LATIN,
  de: LATIN,
  sq: LATIN,
  bs: LATIN,
  ps: URDU,
  'pa-Arab': URDU,
  sd: URDU,
  ug: URDU,
  ckb: URDU,
  ku: LATIN,
  yo: YORUBA,
  jv: LATIN,
  su: LATIN,
  ta: TAMIL,
  ml: MALAYALAM,
  'zh-Hans': HANS,
  'zh-Hant': HANT,
  // Roboto carries every Spanish diacritic by explicit codepoint in both weights
  // (measured with fontTools, plan T-429 decision 6)
  es: LATIN,
  // Roboto carries every Dutch diacritic by explicit codepoint in both weights
  // (measured with fontTools, plan T-429 decision 6)
  nl: LATIN,
  // Roboto carries every Kazakh letter (ә ғ қ ң ө ұ ү һ і) by explicit codepoint in both
  // weights (measured with fontTools, plan T-429 decision 6)
  kk: LATIN,
  // Roboto carries Kyrgyz's ң ө ү by explicit codepoint in both weights (measured with
  // fontTools, plan T-429 decision 6)
  ky: LATIN,
  // Roboto carries Tajik's ғ ӣ қ ӯ ҳ ҷ by explicit codepoint in both weights (measured
  // with fontTools, plan T-429 decision 6)
  tg: LATIN,
  // Roboto carries Turkmen's ä ç ž ň ö ş ü ý by explicit codepoint in both weights
  // (measured with fontTools, plan T-429 decision 6)
  tk: LATIN,
  // Roboto carries Wolof's ë é à ñ ó by explicit codepoint in both weights (measured
  // with fontTools, plan T-429 decision 6)
  wo: LATIN,
  // Marathi rides the HINDI record's own bundled pair: NotoSansDevanagari carries every
  // Marathi codepoint the catalog uses in both weights except the two guillemets U+00AB
  // and U+00BB that nine help strings quote with (measured with fontTools by explicit
  // codepoint, plan T-429 decision 6); those two have no glyph in the pair and fall to
  // the OS face, as the Latin brand text already does, while the Devanagari itself takes
  // the same measured 1.5em script box
  mr: HINDI,
  // Oromo's orthography is ASCII and Tagalog needs only ñ, which Roboto carries
  om: LATIN,
  bm: AFRICAN,
  tl: LATIN,
  ff: AFRICAN,
  te: TELUGU,
  gu: GUJARATI,
  kn: KANNADA,
  am: ETHIOPIC,
  // This wave's Arabic-script three (plan T-453 decision 10): skr, bal and kas ride
  // the URDU record's Naskh pair, the measurement recorded in the record's comment
  skr: URDU,
  bal: URDU,
  kas: URDU,
  // Thaana reads right to left, so dv joins RTL_IDS with its own bundled pair
  dv: THAANA,
  // Afar's orthography is ASCII and Maguindanao's register needs at most ñ: measured
  // with fontTools in both weights, Roboto carries every character of both locales'
  // whole keyed surface (67 distinct characters each, the em dash the one non-ASCII
  // codepoint besides the digits), and ñ beside it (plan T-453 decision 10)
  aa: LATIN,
  mdh: LATIN,
  // The Sahel three ride the AFRICAN record's Noto Sans pair (plan T-453 decision 10),
  // which Bambara and Fulfulde already take for the Sahel Latin letters Roboto and Rubik
  // lack. None of the three needs one of those letters: the basis is each language's own
  // orthography on the same Sahel Latin record, and this wave's census over its whole
  // keyed surface (68 distinct characters each, ŋ and the em dash the non-ASCII
  // codepoints, and kr's dash alone), every character carried by both weights, riding
  // the record's measured 1.55em script line
  kr: AFRICAN,
  mnk: AFRICAN,
  dje: AFRICAN,
};

/**
 * Consumers resolve this once at their own module scope; the answer changes only when the
 * active locale crosses a record boundary, which is exactly why such a switch relaunches.
 */
export const typographyFor = (locale: LocaleId): LocaleTypography => RECORDS[locale];
