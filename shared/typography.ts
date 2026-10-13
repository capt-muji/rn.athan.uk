/**
 * The per-locale typography map (D74.2, D74.4): which family, size, line
 * height and letter spacing the app's text renders for the active locale.
 * The 1.15 factor's derivation from the two faces' measured glyph bands is
 * cited in ai/plans/74-arabic-typography/FONT-MEASUREMENTS.md.
 */

import { TEXT } from '@/shared/constants';
import type { LocaleId } from '@/shared/i18n/locale';

/** Measured size-parity factor between Roboto and Noto Sans Arabic (D74.2) */
export const ARABIC_SIZE_FACTOR = 1.15;

export interface LocaleTypography {
  familyRegular: string;
  familyMedium: string;
  size: (n: number) => number;
  lineHeight: (n: number) => number;
  letterSpacing: (n: number) => number;
  arabic: boolean;
}

const ARABIC: LocaleTypography = {
  familyRegular: 'NotoSansArabic-Regular',
  familyMedium: 'NotoSansArabic-Medium',
  size: (n) => Math.round(n * ARABIC_SIZE_FACTOR),
  lineHeight: (n) => Math.round(n * ARABIC_SIZE_FACTOR),
  letterSpacing: () => 0,
  arabic: true,
};

const LATIN: LocaleTypography = {
  familyRegular: TEXT.family.regular,
  familyMedium: TEXT.family.medium,
  size: (n) => n,
  lineHeight: (n) => n,
  letterSpacing: (n) => n,
  arabic: false,
};

/**
 * Consumers resolve this once at their own module scope: an ar pick always
 * relaunches the JS context (D59), so a module-scope answer never goes stale.
 */
export const typographyFor = (locale: LocaleId): LocaleTypography => (locale === 'ar' ? ARABIC : LATIN);
