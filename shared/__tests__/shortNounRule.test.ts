/**
 * The short-noun rule across every catalog (owner order 2026-10-31, restated with the
 * 2.43.1 read batch): the Extras explanation rows carry the locale's own row noun -
 * "Midnight", never "Halfway between Magrib and Fajr" or "the middle of the night";
 * "Last Third", never "the last third of the night" - and the Sunrise row is the
 * locale's short noun, never a "rising of the sun" periphrasis, except where the
 * sourcing record names the phrase the language's only form (the naturally-long rows
 * stand recorded, chain named, in sourced-names.json).
 */

import { catalogFor } from '@/shared/i18n/loader';

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

describe('the short-noun rule, owner order 2026-10-31', () => {
  it('carries the midnight row noun as its explanation in every catalog', () => {
    const failures: string[] = [];
    for (const locale of LOCALE_IDS) {
      const catalog = catalogFor(locale);
      if (catalog['extras.explanation.midnight'] !== catalog['prayer.midnight']) {
        failures.push(locale);
      }
    }
    expect(failures).toEqual([]);
  });

  it('carries the last-third row noun as its explanation in every catalog', () => {
    const failures: string[] = [];
    for (const locale of LOCALE_IDS) {
      const catalog = catalogFor(locale);
      if (catalog['extras.explanation.last third'] !== catalog['prayer.last third']) {
        failures.push(locale);
      }
    }
    expect(failures).toEqual([]);
  });

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
