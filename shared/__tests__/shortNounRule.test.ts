/**
 * The Extras rows' two rules, one per half (owner order 2026-11-01, restated as
 * hard): the DESCRIPTION rows - extras.explanation.midnight and .last third -
 * are the faithful translations of the English description sentences, "Halfway
 * between Magrib and Fajr" and "Start of the last third of the night", long
 * where the language is long, and they never repeat their row's title. The
 * SHORT-NOUN rule (owner order 2026-10-31) governs TITLES ONLY: the Sunrise
 * title is the locale's short noun, never a "rising of the sun" periphrasis,
 * except where the sourcing record names the phrase the language's only form
 * (the naturally-long rows stand recorded, chain named, in sourced-names.json).
 */

import { catalogFor } from '@/shared/i18n/loader';
import sourced from '@/shared/i18n/sourced-names.json';

import { LOCALE_IDS } from '../i18n/locale';

/**
 * Every locale whose Sunrise row is the sourcing record's naturally-long form: the
 * language prints no single noun for sunrise and the phrase is its standard term.
 * sourced-names.json's Sunrise entry for each carries the chain that says so
 * (tl's Pagsikat ng araw and pl's Wschód słońca among them: no single noun circulates).
 */
const NATURALLY_LONG_SUNRISE = new Set([
  'ha',
  'ku',
  'ta',
  'tg',
  'tk',
  'om',
  'bm',
  'ff',
  'sd',
  'ug',
  'yo',
  'jv',
  'su',
  'tt',
  'uk',
  'min',
  'mad',
  'bug',
  'qu',
  'ceb',
  'ilo',
  'vi',
  'skr',
  'bal',
  'kas',
  'pa-Arab',
  'pt',
  'hil',
  'war',
  'tl',
  'pl',
]);

/**
 * Every locale exempt from the description guard: the language provably lacks
 * distinct words for the row and its description, so the title repeats by
 * necessity. The set starts empty and may only grow, and only behind proof -
 * each entry is recorded in sourced-names.json's slot for the row, the note
 * carrying the word "exempt" with the chain that says the words do not exist.
 */
const TITLE_EQUAL_EXEMPT = new Set<string>([]);

/** The glossary as the exemption record reads it */
const GLOSSARY = sourced as unknown as Record<string, { explanations?: Record<string, { note?: string }> } | undefined>;

/** The exemption record's missing chains: one failure per exempted locale and row whose sourcing note does not carry the chain word */
const unrecordedExemptions = (): string[] => {
  const failures: string[] = [];
  for (const locale of TITLE_EQUAL_EXEMPT) {
    for (const slot of ['Halfway between Magrib and Fajr', 'Start of the last third of the night']) {
      const note = GLOSSARY[locale]?.explanations?.[slot]?.note ?? '';
      if (!note.includes('exempt')) failures.push(`${locale}: ${slot} carries no exemption chain`);
    }
  }
  return failures;
};

describe('the description rule, owner order 2026-11-01', () => {
  it('differs from its title in every catalog, midnight row', () => {
    const failures: string[] = [];
    for (const locale of LOCALE_IDS) {
      if (TITLE_EQUAL_EXEMPT.has(locale)) continue;
      const catalog = catalogFor(locale);
      if (catalog['extras.explanation.midnight'].toLowerCase() === catalog['prayer.midnight'].toLowerCase()) {
        failures.push(locale);
      }
    }
    expect(failures).toEqual([]);
  });

  it('differs from its title in every catalog, last-third row', () => {
    const failures: string[] = [];
    for (const locale of LOCALE_IDS) {
      if (TITLE_EQUAL_EXEMPT.has(locale)) continue;
      const catalog = catalogFor(locale);
      if (catalog['extras.explanation.last third'].toLowerCase() === catalog['prayer.last third'].toLowerCase()) {
        failures.push(locale);
      }
    }
    expect(failures).toEqual([]);
  });

  it('records every title-equal exemption in the sourcing record with its chain', () => {
    expect(unrecordedExemptions()).toEqual([]);
  });

  it('flags an exemption whose slot carries no chain word', () => {
    // The live set starts empty, so the check above runs over nothing; this
    // proves the detection itself, on a stand-in locale the record never heard of
    TITLE_EQUAL_EXEMPT.add('zz');
    try {
      expect(unrecordedExemptions()).toEqual([
        'zz: Halfway between Magrib and Fajr carries no exemption chain',
        'zz: Start of the last third of the night carries no exemption chain',
      ]);
    } finally {
      TITLE_EQUAL_EXEMPT.delete('zz');
    }
  });

  it('pins the English pair the rule names', () => {
    const catalog = catalogFor('en');
    expect(catalog['extras.explanation.midnight']).toBe('Halfway between Magrib and Fajr');
    expect(catalog['extras.explanation.last third']).toBe('Start of the last third of the night');
  });

  it('pins the Bikol pair the owner worked', () => {
    const catalog = catalogFor('bcl');
    expect(catalog['extras.explanation.midnight']).toBe('Sa kabangaan kan Magrib asin Fajr');
    expect(catalog['extras.explanation.last third']).toBe('Poon kan huring ikatolo kan banggi');
  });
});

describe('the short-noun rule, owner order 2026-10-31', () => {
  it('carries a one-word Sunrise noun wherever the record does not name the phrase naturally long', () => {
    const failures: string[] = [];
    for (const locale of LOCALE_IDS) {
      if (NATURALLY_LONG_SUNRISE.has(locale)) continue;
      const words = String(catalogFor(locale)['prayer.sunrise']).trim().split(/\s+/);
      if (words.length !== 1) failures.push(`${locale}: ${words.length} words`);
    }
    expect(failures).toEqual([]);
  });
});
