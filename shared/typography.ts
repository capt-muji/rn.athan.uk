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
  /** Timer digits are Latin glyphs in every locale (row 82), so this face is the Latin medium everywhere while word styles stay per-locale */
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

/** One record per shipped locale: a new language adds its entry here
 * and its id to RTL_IDS if it reads right to left */
const RECORDS: Record<LocaleId, LocaleTypography> = {
  en: LATIN,
  ar: ARABIC,
  ms: LATIN,
  so: LATIN,
  hi: LATIN,
  th: LATIN,
};

/**
 * Consumers resolve this once at their own module scope; the answer changes
 * only when the active locale crosses the ar boundary.
 */
export const typographyFor = (locale: LocaleId): LocaleTypography => RECORDS[locale];
