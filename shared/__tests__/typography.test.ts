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
  expect(ty.familyRegular).toBe('Rubik-Regular');
  expect(ty.familyMedium).toBe('Rubik-Medium');
  expect(ty.familyDigits).toBe('Rubik-Medium');
  expect(ty.familyRowTime).toBe('Rubik-Regular');
  for (const [n, scaled] of AR_SIZES) {
    expect(ty.size(n)).toBe(scaled);
  }
  for (const [n, scaled] of AR_LINE_HEIGHTS) {
    expect(ty.lineHeight(n)).toBe(scaled);
  }
  expect(ty.letterSpacing(0)).toBe(0);
  expect(ty.letterSpacing(0.2)).toBe(0);
  expect(ty.letterSpacing(0.3)).toBe(0);
  expect(ty.wordFace).toBe(true);
  // Row 81: the ar countdown timer runs two points under the shared token
  expect(ty.countdownSize).toBe(24);
};

const expectLatinRecord = (ty: LocaleTypography): void => {
  expect(ty.familyRegular).toBe('Roboto-Regular');
  expect(ty.familyMedium).toBe('Roboto-Medium');
  expect(ty.familyDigits).toBe('Roboto-Medium');
  expect(ty.familyRowTime).toBe('Roboto-Regular');
  expect(ty.size(10)).toBe(10);
  expect(ty.size(18)).toBe(18);
  expect(ty.size(28)).toBe(28);
  expect(ty.lineHeight(16)).toBe(16);
  expect(ty.lineHeight(20)).toBe(20);
  expect(ty.lineHeight(22)).toBe(22);
  expect(ty.letterSpacing(0)).toBe(0);
  expect(ty.letterSpacing(0.2)).toBe(0.2);
  expect(ty.letterSpacing(0.3)).toBe(0.3);
  expect(ty.wordFace).toBe(false);
  expect(ty.countdownSize).toBe(26);
};

/** The script pair carries the words; digits and row times stay on the app's Latin faces */
const expectScriptRecord = (ty: LocaleTypography, regular: string, medium: string): void => {
  expect(ty.familyRegular).toBe(regular);
  expect(ty.familyMedium).toBe(medium);
  expect(ty.familyDigits).toBe('Roboto-Medium');
  expect(ty.familyRowTime).toBe('Roboto-Regular');
  expect(ty.size(10)).toBe(10);
  expect(ty.size(18)).toBe(18);
  expect(ty.size(28)).toBe(28);
  expect(ty.lineHeight(16)).toBe(16);
  expect(ty.lineHeight(20)).toBe(20);
  expect(ty.lineHeight(22)).toBe(22);
  expect(ty.letterSpacing(0)).toBe(0);
  expect(ty.letterSpacing(0.2)).toBe(0.2);
  expect(ty.letterSpacing(0.3)).toBe(0.3);
  expect(ty.wordFace).toBe(true);
  expect(ty.countdownSize).toBe(26);
};

describe('typographyFor', () => {
  it('resolves ar to the Arabic faces at the pinned factor table', () => {
    expectArabicRecord(typographyFor('ar'));
  });

  it('resolves fa to the same Arabic record, Rubik covering all six Persian letters', () => {
    // Decision 3, plan T-410: measured with fontTools, Rubik carries پ چ ژ گ ک ی,
    // so fa needs no pair of its own and renders exactly the ar surfaces' record
    expectArabicRecord(typographyFor('fa'));
  });

  it('resolves the Latin-shipped locales to the Roboto identity record', () => {
    for (const locale of LOCALE_IDS.filter(
      (id) => id !== 'ar' && id !== 'hi' && id !== 'th' && id !== 'ur' && id !== 'fa' && id !== 'bn'
    )) {
      expectLatinRecord(typographyFor(locale));
    }
  });

  it('resolves hi to the Devanagari pair with the taller script line box', () => {
    const ty = typographyFor('hi');
    expectScriptRecord(ty, 'NotoSansDevanagari-Regular', 'NotoSansDevanagari-Medium');
    // The face's win ink runs past its own box, so ink-bearing surfaces take the script box
    expect(ty.scriptLineHeight?.(14)).toBe(21);
    expect(ty.scriptLineHeight?.(15)).toBe(23);
  });

  it('resolves th to the Thai pair with no script line box', () => {
    const ty = typographyFor('th');
    expectScriptRecord(ty, 'NotoSansThai-Regular', 'NotoSansThai-Medium');
    // The Thai face's own 1.511em box clears its ink, so no surface pins a script box
    expect(ty.scriptLineHeight).toBeUndefined();
  });

  it('resolves ur to the Naskh pair with the measured script line box', () => {
    const ty = typographyFor('ur');
    expectScriptRecord(ty, 'NotoNaskhArabic-Regular', 'NotoNaskhArabic-Medium');
    // The pair's own 1.703em box does not clear its 2.039em win ink (measured with
    // fontTools, both weights), so ink-bearing surfaces take the 1.5em RTL script box
    expect(ty.scriptLineHeight?.(14)).toBe(21);
    expect(ty.scriptLineHeight?.(15)).toBe(23);
  });

  it('resolves bn to the Bengali pair with the measured script line box', () => {
    const ty = typographyFor('bn');
    expectScriptRecord(ty, 'NotoSansBengali-Regular', 'NotoSansBengali-Medium');
    // The pair's own 1.325em box does not clear its 1.403em win ink (this wave's own
    // measurement, decision 3), so ink-bearing surfaces take the 1.5em script box
    expect(ty.scriptLineHeight?.(14)).toBe(21);
    expect(ty.scriptLineHeight?.(15)).toBe(23);
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
