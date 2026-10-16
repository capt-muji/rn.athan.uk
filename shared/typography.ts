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
};

/**
 * Consumers resolve this once at their own module scope; the answer changes only when the
 * active locale crosses a record boundary, which is exactly why such a switch relaunches.
 */
export const typographyFor = (locale: LocaleId): LocaleTypography => RECORDS[locale];
