/**
 * The T-542 conformance pattern suite: the golden invariants the spelling and
 * format pass leaves behind. For every one of the 75 shipped catalogs: en's
 * exact key set, record equality on all sixteen sourced rows (11 names, 5
 * descriptions, text, slug and confidence all vouched), the two title rows
 * never repeated as their descriptions, en's five description bytes pinned
 * literally, and the count 75 on every registry surface - read live, never
 * mirrored. The suite is additive on top of catalogGates, shortNounRule,
 * languageWave and catalogLock, which stay.
 */

import catalogLock from '@/shared/i18n/catalog-lock.json';
import { catalogFor } from '@/shared/i18n/loader';
import { LOCALE_IDS } from '@/shared/i18n/locale';
import nativeStrings from '@/shared/i18n/native-strings.json';
import sourced from '@/shared/i18n/sourced-names.json';
import widgetStatics from '@/shared/i18n/widget-statics.json';
import { LANGUAGE_NAMES } from '@/shared/languageNames';

import appJson from '../../app.json';

const glossary = sourced as unknown as Record<
  string,
  | {
      names: Record<string, { text: string | null; source: string | null; confidence: string | null }>;
      explanations: Record<string, { text: string | null; source: string | null; confidence: string | null }>;
    }
  | undefined
>;

/** The eleven name slots and five explanation slots, catalog key against glossary slot */
const NAME_PAIRS: Array<[key: string, slot: string]> = [
  ['prayer.fajr', 'Fajr'],
  ['prayer.sunrise', 'Sunrise'],
  ['prayer.dhuhr', 'Dhuhr'],
  ['prayer.asr', 'Asr'],
  ['prayer.magrib', 'Magrib'],
  ['prayer.isha', 'Isha'],
  ['prayer.midnight', 'Midnight'],
  ['prayer.last third', 'Last Third'],
  ['prayer.suhoor', 'Suhoor'],
  ['prayer.duha', 'Duha'],
  ['prayer.istijaba', 'Istijaba'],
];

const EXPLANATION_PAIRS: Array<[key: string, slot: string]> = [
  ['extras.explanation.midnight', 'Halfway between Magrib and Fajr'],
  ['extras.explanation.last third', 'Start of the last third of the night'],
  ['extras.explanation.suhoor', '20 mins before Fajr'],
  ['extras.explanation.duha', '20 mins after Sunrise'],
  ['extras.explanation.istijaba', '1 hour before Magrib (Fridays only)'],
];

const en = catalogFor('en');
const enKeys = Object.keys(en).sort();

describe('the conformance pattern, T-542', () => {
  it.each(LOCALE_IDS)('%s holds exactly the en key set', (locale) => {
    expect(Object.keys(catalogFor(locale)).sort()).toEqual(enKeys);
  });

  it.each(LOCALE_IDS)('%s reproduces its sourcing record on all sixteen rows, vouched', (locale) => {
    const sections = glossary[locale];
    expect(sections).toBeDefined();
    const failures: string[] = [];
    const compare = (
      key: string,
      slot: string,
      section: Record<string, { text: string | null; source: string | null; confidence: string | null }>
    ) => {
      const entry = section[slot];
      if (!entry?.text || !entry.source || !entry.confidence) {
        failures.push(`${slot} unvouched`);
        return;
      }
      if (catalogFor(locale)[key as keyof ReturnType<typeof catalogFor>] !== entry.text) {
        failures.push(`${slot} drifts from its record`);
      }
    };
    for (const [key, slot] of NAME_PAIRS) compare(key, slot, sections!.names);
    for (const [key, slot] of EXPLANATION_PAIRS) compare(key, slot, sections!.explanations);
    expect(failures).toEqual([]);
  });

  it.each(LOCALE_IDS)('%s never repeats a title as its description', (locale) => {
    const catalog = catalogFor(locale);
    expect(catalog['extras.explanation.midnight'].toLowerCase()).not.toBe(catalog['prayer.midnight'].toLowerCase());
    expect(catalog['extras.explanation.last third'].toLowerCase()).not.toBe(catalog['prayer.last third'].toLowerCase());
  });

  it('pins the English description pattern literally', () => {
    expect(en['extras.explanation.midnight']).toBe('Halfway between Magrib and Fajr');
    expect(en['extras.explanation.last third']).toBe('Start of the last third of the night');
    expect(en['extras.explanation.suhoor']).toBe('20 minutes before Fajr');
    expect(en['extras.explanation.duha']).toBe('20 minutes after Sunrise');
    expect(en['extras.explanation.istijaba']).toBe('1 hour before Magrib (Fridays only)');
  });

  it('holds the count at seventy-five on every registry, read live', () => {
    expect(LOCALE_IDS).toHaveLength(75);
    expect(LANGUAGE_NAMES).toHaveLength(75);
    expect(Object.keys(nativeStrings).filter((k) => k !== '_comment')).toHaveLength(75);
    expect(Object.keys(widgetStatics).filter((k) => !k.startsWith('_'))).toHaveLength(75);
    expect(Object.keys(glossary).filter((k) => k !== '_meta')).toHaveLength(75);
    // The two en-excluded registries carry 74 by design
    expect(Object.keys(catalogLock)).toHaveLength(74);
    expect(Object.keys(appJson.expo.locales ?? {})).toHaveLength(74);
    expect(appJson.expo.ios?.infoPlist?.CFBundleLocalizations).toHaveLength(75);
  });
});
