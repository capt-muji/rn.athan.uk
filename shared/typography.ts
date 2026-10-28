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
// against 2.039em win ink
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
};

/**
 * Consumers resolve this once at their own module scope; the answer changes only when the
 * active locale crosses a record boundary, which is exactly why such a switch relaunches.
 */
export const typographyFor = (locale: LocaleId): LocaleTypography => RECORDS[locale];
