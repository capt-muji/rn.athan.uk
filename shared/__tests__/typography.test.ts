/**
 * The locale typography map (ticket 74 R1.5-R1.10): under ar every size and
 * line height resolves Math.round(n * 1) over the bundled Arabic faces and
 * letter spacing resolves 0; the five other locales resolve the Roboto
 * families with identity mappings, so their rendered bytes stay pre-change.
 */

import { LOCALE_IDS } from '@/shared/i18n/locale';
import { type LocaleTypography, typographyFor } from '@/shared/typography';

/** The pinned ar size table (D74.2) and the three lineHeight presets */
const AR_SIZES: ReadonlyArray<readonly [number, number]> = [
  [10, 10],
  [13, 13],
  [14, 14],
  [15, 15],
  [16, 16],
  [18, 18],
  [20, 20],
  [22, 22],
  [26, 26],
  [28, 28],
];
const AR_LINE_HEIGHTS: ReadonlyArray<readonly [number, number]> = [
  [16, 16],
  [20, 20],
  [22, 22],
];

const expectArabicRecord = (ty: LocaleTypography): void => {
  expect(ty.familyRegular).toBe('NotoSansArabic-Regular');
  expect(ty.familyMedium).toBe('NotoSansArabic-Medium');
  expect(ty.familyDigits).toBe('Roboto-Medium');
  for (const [n, scaled] of AR_SIZES) {
    expect(ty.size(n)).toBe(scaled);
  }
  for (const [n, scaled] of AR_LINE_HEIGHTS) {
    expect(ty.lineHeight(n)).toBe(scaled);
  }
  expect(ty.letterSpacing(0)).toBe(0);
  expect(ty.letterSpacing(0.2)).toBe(0);
  expect(ty.letterSpacing(0.3)).toBe(0);
  expect(ty.arabic).toBe(true);
};

const expectLatinRecord = (ty: LocaleTypography): void => {
  expect(ty.familyRegular).toBe('Roboto-Regular');
  expect(ty.familyMedium).toBe('Roboto-Medium');
  expect(ty.familyDigits).toBe('Roboto-Medium');
  expect(ty.size(10)).toBe(10);
  expect(ty.size(18)).toBe(18);
  expect(ty.size(28)).toBe(28);
  expect(ty.lineHeight(16)).toBe(16);
  expect(ty.lineHeight(20)).toBe(20);
  expect(ty.lineHeight(22)).toBe(22);
  expect(ty.letterSpacing(0)).toBe(0);
  expect(ty.letterSpacing(0.2)).toBe(0.2);
  expect(ty.letterSpacing(0.3)).toBe(0.3);
  expect(ty.arabic).toBe(false);
};

describe('typographyFor', () => {
  it('resolves ar to the Arabic faces at the pinned factor table', () => {
    expectArabicRecord(typographyFor('ar'));
  });

  it('resolves every shipped non-ar locale to the Roboto identity record', () => {
    for (const locale of LOCALE_IDS.filter((id) => id !== 'ar')) {
      expectLatinRecord(typographyFor(locale));
    }
  });
});

describe('live resolution through currentLocaleId', () => {
  it('returns the ar record once setActiveLocale("ar") has run', () => {
    jest.resetModules();
    jest.isolateModules(() => {
      const locale = require('@/shared/i18n/locale');
      const typography = require('@/shared/typography');
      locale.setActiveLocale('ar');
      expectArabicRecord(typography.typographyFor(locale.currentLocaleId()));
    });
  });

  it('returns the Roboto identity record once setActiveLocale("en") has run', () => {
    jest.resetModules();
    jest.isolateModules(() => {
      const locale = require('@/shared/i18n/locale');
      const typography = require('@/shared/typography');
      locale.setActiveLocale('en');
      expectLatinRecord(typography.typographyFor(locale.currentLocaleId()));
    });
  });
});
