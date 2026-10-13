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
  size: (n: number) => number;
  lineHeight: (n: number) => number;
  letterSpacing: (n: number) => number;
  arabic: boolean;
}

const ARABIC: LocaleTypography = {
  familyRegular: 'NotoSansArabic-Regular',
  familyMedium: 'NotoSansArabic-Medium',
  familyDigits: TEXT.family.medium,
  size: (n) => Math.round(n * ARABIC_SIZE_FACTOR),
  lineHeight: (n) => Math.round(n * ARABIC_SIZE_FACTOR),
  letterSpacing: () => 0,
  arabic: true,
};

const LATIN: LocaleTypography = {
  familyRegular: TEXT.family.regular,
  familyMedium: TEXT.family.medium,
  familyDigits: TEXT.family.medium,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  arabic: false,
};

/**
 * Consumers resolve this once at their own module scope; the answer changes
 * only when the active locale crosses the ar boundary.
 */
export const typographyFor = (locale: LocaleId): LocaleTypography => (locale === 'ar' ? ARABIC : LATIN);
