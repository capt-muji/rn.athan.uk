/**
 * The locale typography map (ticket 74 R1.5-R1.10): under ar every size and
 * line height resolves Math.round(n * 1) over the bundled Arabic faces and
 * letter spacing resolves 0; the Latin-record locales resolve the Roboto
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
      (id) =>
        id !== 'ar' &&
        id !== 'hi' &&
        id !== 'th' &&
        id !== 'ur' &&
        id !== 'fa' &&
        id !== 'bn' &&
        id !== 'ps' &&
        id !== 'pa-Arab' &&
        id !== 'sd' &&
        id !== 'ug' &&
        id !== 'ckb' &&
        id !== 'yo' &&
        id !== 'ta' &&
        id !== 'ml' &&
        id !== 'mr' &&
        id !== 'zh-Hans' &&
        id !== 'zh-Hant' &&
        id !== 'bm' &&
        id !== 'ff' &&
        id !== 'te' &&
        id !== 'gu' &&
        id !== 'kn' &&
        id !== 'am' &&
        id !== 'ja' &&
        id !== 'ko'
    )) {
      expectLatinRecord(typographyFor(locale));
    }
  });

  it('resolves pa-Arab and sd to the same Naskh record, Rubik lacking their letters', () => {
    // Plan T-427 decision 4: measured by explicit codepoint, the Naskh pair carries
    // Shahmukhi's thirteen letters and Sindhi's fifteen, both weights, while Rubik
    // lacks every one of them
    for (const locale of ['pa-Arab', 'sd', 'ug', 'ckb'] as const) {
      const ty = typographyFor(locale);
      expectScriptRecord(ty, 'NotoNaskhArabic-Regular', 'NotoNaskhArabic-Medium');
      expect(ty.scriptLineHeight?.(14)).toBe(21);
      expect(ty.scriptLineHeight?.(15)).toBe(23);
    }
  });

  it('resolves yo to the Noto Sans pair with the measured script line box', () => {
    // Plan T-427 decision 5: Roboto lacks ṣ, so yo rides the instanced Noto Sans pair.
    // Its hhea box is 1.362em against a 1.519em win ink (1124/395, both weights, the
    // AFRICAN record's measurement over the same pair), so ink-bearing surfaces take
    // the 1.55em script line that clears the measured ink
    const ty = typographyFor('yo');
    expectScriptRecord(ty, 'NotoSans-Regular', 'NotoSans-Medium');
    expect(ty.scriptLineHeight?.(14)).toBe(22);
    expect(ty.scriptLineHeight?.(15)).toBe(23);
  });

  it('resolves hi to the Devanagari pair with the taller script line box', () => {
    const ty = typographyFor('hi');
    expectScriptRecord(ty, 'NotoSansDevanagari-Regular', 'NotoSansDevanagari-Medium');
    // The face's win ink runs past its own box, so ink-bearing surfaces take the script box
    expect(ty.scriptLineHeight?.(14)).toBe(21);
    expect(ty.scriptLineHeight?.(15)).toBe(23);
  });

  it('resolves mr to the same Devanagari pair, the Marathi script record', () => {
    // Plan T-429 decision 6: NotoSansDevanagari carries every Marathi codepoint the
    // catalog uses in both weights except U+00AB and U+00BB, the two guillemets nine
    // help strings quote with, which fall to the OS face as the Latin brand text
    // already does, so mr rides the HINDI record's own measured box
    const ty = typographyFor('mr');
    expectScriptRecord(ty, 'NotoSansDevanagari-Regular', 'NotoSansDevanagari-Medium');
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

  it('resolves ps to the same Naskh record, Rubik lacking every Pashto letter', () => {
    // Decision 7, plan T-419: measured by explicit codepoint, Rubik carries none of
    // the eleven Pashto-specific letters while the Naskh pair carries them all, both
    // weights, so ps renders the URDU record's exact surfaces
    const ty = typographyFor('ps');
    expectScriptRecord(ty, 'NotoNaskhArabic-Regular', 'NotoNaskhArabic-Medium');
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

  it('resolves ta to the Tamil pair with no script line box', () => {
    const ty = typographyFor('ta');
    expectScriptRecord(ty, 'NotoSansTamil-Regular', 'NotoSansTamil-Medium');
    // The pair's own 1.240em box (ascent 870, descent -370, UPM 1000, both weights,
    // this wave's own measurement, plan T-419 decision 7) already clears the script's
    // ink: the win metrics match the box and the worst GPOS-stacked mark tops at 843
    // units (0.843em, anusvara over a base) under the ascent, so no surface pins a
    // script box, the Thai row-87 law
    expect(ty.scriptLineHeight).toBeUndefined();
  });

  it('resolves ml to the Malayalam pair with the measured script line box', () => {
    const ty = typographyFor('ml');
    expectScriptRecord(ty, 'NotoSansMalayalam-Regular', 'NotoSansMalayalam-Medium');
    // The pair's declared box and win ink are both 1.247em (ascent 864, descent -383,
    // UPM 1000, both weights), but the script's own stacked ink runs past them: the
    // GPOS reph-over-base rows top at 963 and 971 units (0.963em, 0.971em) against
    // the 864 ascent (this wave's own measurement, plan T-419 decision 7), the Bengali
    // matra case, so ink-bearing surfaces take the 1.5em script box the HINDI record
    // already renders
    expect(ty.scriptLineHeight?.(14)).toBe(21);
    expect(ty.scriptLineHeight?.(15)).toBe(23);
  });

  it('resolves zh-Hans to the SC subset pair with no script line box', () => {
    const ty = typographyFor('zh-Hans');
    expectScriptRecord(ty, 'NotoSansSC-Subset-Regular', 'NotoSansSC-Subset-Medium');
    // The subset pairs carry the closed string set's whole 377-character census (the
    // glyph lock, plan T-419 decision 8) and their own declared box already clears
    // their ink: hhea 1160/-288 with lineGap 0 and win 1160/288 against UPM 1000,
    // a 1.448em box the win ink matches exactly, both weights (this wave's own
    // measurement over the bundled subsets), so no surface pins a script box -
    // the Thai row-87 law
    expect(ty.scriptLineHeight).toBeUndefined();
  });

  it('resolves bm and ff to the bundled Noto Sans pair with the measured script line box', () => {
    for (const locale of ['bm', 'ff'] as const) {
      const ty = typographyFor(locale);
      // No shipped face carries the African letters (ɛ ɔ ɲ for bm, ɓ ɗ ƴ for
      // ff, measured absent by codepoint in both weights of all twenty bundled
      // TTFs), so both ride the Noto Sans pair. Its hhea box is 1.362em
      // (ascent 1069, descent -293, UPM 1000) against a 1.519em win ink
      // (1124/395, both weights, this wave's own measurement), so ink-bearing
      // surfaces take the 1.55em script line that clears the measured ink
      expectScriptRecord(ty, 'NotoSans-Regular', 'NotoSans-Medium');
      expect(ty.scriptLineHeight?.(14)).toBe(22);
      expect(ty.scriptLineHeight?.(15)).toBe(23);
    }
  });

  it('resolves te to the Telugu pair with the measured script line box', () => {
    const ty = typographyFor('te');
    // No bundled face carries a Telugu letter, so te bundles the Noto Sans
    // Telugu v2.005 pair. Its hhea box is 1.352em (ascent 869, descent -483,
    // UPM 1000, both weights) against a 1.478em win ink (995/483), so ink-bearing
    // surfaces take the 1.5em script line that clears the measured ink
    expectScriptRecord(ty, 'NotoSansTelugu-Regular', 'NotoSansTelugu-Medium');
    expect(ty.scriptLineHeight?.(14)).toBe(21);
    expect(ty.scriptLineHeight?.(15)).toBe(23);
  });

  it('resolves gu to the Gujarati pair with the measured script line box', () => {
    const ty = typographyFor('gu');
    // The Noto Sans Gujarati v2.106 pair's hhea box is 1.304em (ascent 896,
    // descent -408, UPM 1000, both weights) against a 1.484em win ink (1076/408),
    // so ink-bearing surfaces take the 1.5em script line
    expectScriptRecord(ty, 'NotoSansGujarati-Regular', 'NotoSansGujarati-Medium');
    expect(ty.scriptLineHeight?.(14)).toBe(21);
    expect(ty.scriptLineHeight?.(15)).toBe(23);
  });

  it('resolves kn to the Kannada pair with the measured script line box', () => {
    const ty = typographyFor('kn');
    // The Noto Sans Kannada v2.006 pair's hhea box is 1.349em (ascent 809,
    // descent -540, UPM 1000, both weights) while its win ink spans 1.645em
    // (winAscent 1105, winDescent 540), so the 1.5em house value does not clear
    // it and this wave's own measurement pins a 1.65em factor rounded up with
    // Math.ceil: Math.round lands under the ink at the 16pt row (26px is 1.625em
    // against 1.645em)
    expectScriptRecord(ty, 'NotoSansKannada-Regular', 'NotoSansKannada-Medium');
    expect(ty.scriptLineHeight?.(14)).toBe(24);
    expect(ty.scriptLineHeight?.(15)).toBe(25);
  });

  it('resolves am to the Ethiopic pair with no script line box', () => {
    const ty = typographyFor('am');
    // The Noto Sans Ethiopic v2.102 pair's hhea box is 1.362em (ascent 1069,
    // descent -293, UPM 1000, both weights) and its win ink matches exactly
    // (1069/293), so the font's own metrics serve - the Thai row-87 law
    expectScriptRecord(ty, 'NotoSansEthiopic-Regular', 'NotoSansEthiopic-Medium');
    expect(ty.scriptLineHeight).toBeUndefined();
  });

  it('resolves om and tl to the Roboto identity record', () => {
    // Oromo's orthography is ASCII and Tagalog needs only ñ, which Roboto carries
    expectLatinRecord(typographyFor('om'));
    expectLatinRecord(typographyFor('tl'));
  });

  it('resolves zh-Hant to the TC subset pair with no script line box', () => {
    const ty = typographyFor('zh-Hant');
    expectScriptRecord(ty, 'NotoSansTC-Subset-Regular', 'NotoSansTC-Subset-Medium');
    // The measured numbers match the SC pair's exactly (hhea 1160/-288, lineGap 0,
    // win 1160/288, UPM 1000, both weights, 378 carried characters), so the same
    // row-87 law serves: the font's own metrics, no script box
    expect(ty.scriptLineHeight).toBeUndefined();
  });

  it('resolves ja to the JP subset pair with no script line box', () => {
    const ty = typographyFor('ja');
    expectScriptRecord(ty, 'NotoSansJP-Subset-Regular', 'NotoSansJP-Subset-Medium');
    // The JP subsets carry the closed string set's own census (the glyph lock,
    // plan T-452 decision 3) and their measured box clears their ink, so no
    // surface pins a script box - the Thai row-87 law, the numbers in the record
    expect(ty.scriptLineHeight).toBeUndefined();
  });

  it('resolves ko to the KR subset pair with no script line box', () => {
    const ty = typographyFor('ko');
    expectScriptRecord(ty, 'NotoSansKR-Subset-Regular', 'NotoSansKR-Subset-Medium');
    // The KR subsets carry the closed string set's own census (the glyph lock,
    // plan T-452 decision 3) and their measured box clears their ink, so no
    // surface pins a script box - the Thai row-87 law, the numbers in the record
    expect(ty.scriptLineHeight).toBeUndefined();
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
