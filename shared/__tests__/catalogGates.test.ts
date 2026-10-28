/**
 * The R2 mechanical gates over the landed catalogs (D42), in-process so CI refuses
 * a defective catalog without the plan folder. The provenance check has no twin here by
 * design: it is a planning artefact. The shipped suite pins the prayer names against
 * sourced-names.json, the committed copy of the research glossary.
 */

import { ar } from '@/shared/i18n/ar';
import { az } from '@/shared/i18n/az';
import { bm } from '@/shared/i18n/bm';
import { bn } from '@/shared/i18n/bn';
import { bs } from '@/shared/i18n/bs';
import { de } from '@/shared/i18n/de';
import { type Catalog, en } from '@/shared/i18n/en';
import { fa } from '@/shared/i18n/fa';
import { ff } from '@/shared/i18n/ff';
import { fr } from '@/shared/i18n/fr';
import { gu } from '@/shared/i18n/gu';
import { ha } from '@/shared/i18n/ha';
import { hi } from '@/shared/i18n/hi';
import { id } from '@/shared/i18n/id';
import { ml } from '@/shared/i18n/ml';
import { ms } from '@/shared/i18n/ms';
import { om } from '@/shared/i18n/om';
import { ps } from '@/shared/i18n/ps';
import { pt } from '@/shared/i18n/pt';
import { ru } from '@/shared/i18n/ru';
import { so } from '@/shared/i18n/so';
import sourced from '@/shared/i18n/sourced-names.json';
import { sq } from '@/shared/i18n/sq';
import { sw } from '@/shared/i18n/sw';
import { ta } from '@/shared/i18n/ta';
import { te } from '@/shared/i18n/te';
import { th } from '@/shared/i18n/th';
import { tl } from '@/shared/i18n/tl';
import { tr } from '@/shared/i18n/tr';
import { ur } from '@/shared/i18n/ur';
import { uz } from '@/shared/i18n/uz';
import { zhHans } from '@/shared/i18n/zh-Hans';
import { zhHant } from '@/shared/i18n/zh-Hant';

const CATALOGS: Record<string, Catalog> = {
  ar,
  ms,
  so,
  hi,
  th,
  id,
  tr,
  fr,
  uz,
  sw,
  ha,
  pt,
  ur,
  fa,
  bn,
  ru,
  az,
  de,
  sq,
  bs,
  ps,
  ta,
  ml,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  om,
  bm,
  tl,
  ff,
  te,
  gu,
};
const LOCALES = Object.keys(CATALOGS);
const RTL = new Set(['ar', 'ur', 'fa', 'ps']);
const BRAND = 'Athan';
const TOKEN = /\{(\w+)\}/g;

const PRAYER_NAME_KEYS = [
  'prayer.fajr',
  'prayer.sunrise',
  'prayer.dhuhr',
  'prayer.asr',
  'prayer.magrib',
  'prayer.isha',
  'prayer.midnight',
  'prayer.last third',
  'prayer.suhoor',
  'prayer.duha',
  'prayer.istijaba',
];

// Brand bytes: only app-open copy names the application; "athan" elsewhere is the
// feature word, which translates
const BRAND_REQUIRED = new Set(['widget.refresh', 'widget.refreshLead']);
// Place names stay as printed; calendar loanwords are legitimately identical
// across languages
const echoExempt = (key: string) => key === 'day.location' || key.startsWith('calendar.');

const tokensOf = (value: string) =>
  [...value.matchAll(TOKEN)]
    .map((match) => match[1])
    .sort()
    .join(',');
const plain = (value: string) => value.replace(TOKEN, '');

// en is CATALOGS' reference, not a member; the spacing rule below is absolute rather
// than measured against en, so en walks beside the five as an equal
const SHIPPED: Record<string, Catalog> = { en, ...CATALOGS };

// The owner's spacing rule (T-346): the interpolated time never touches a neighbouring
// glyph in any language, so each side of the token is a space or the string's edge
const gluedSides = (template: string): string[] => {
  const token = '{duration}';
  const start = template.indexOf(token);
  const end = start + token.length;
  const glued: string[] = [];
  if (start > 0 && template[start - 1] !== ' ') glued.push('leading');
  if (end < template.length && template[end] !== ' ') glued.push('trailing');
  return glued;
};

const sourcedNames = (loc: string): Array<[key: string, text: string]> => {
  const glossary = sourced as unknown as Record<string, { names: Record<string, { text: string | null }> }>;
  const entries = glossary[loc].names;
  return Object.entries(entries).flatMap(([name, entry]) => {
    if (!entry?.text) return [];
    const slug = name === 'Last Third' ? 'last third' : name.toLowerCase();
    const key = PRAYER_NAME_KEYS.find((k) => k.endsWith(slug));
    return key ? [[key, entry.text] as [string, string]] : [];
  });
};

interface Entry {
  text: string | null;
  source: string | null;
  confidence: string | null;
}

/** The ten locales T-410 ships; every slot they add to the glossary must carry sourcing */
const T410_TEN = ['id', 'ur', 'bn', 'fa', 'fr', 'tr', 'sw', 'ha', 'pt', 'uz'] as const;

/** The ten locales T-419 ships next; the same bar covers their names and explanations */
const T419_TEN = ['ps', 'zh-Hans', 'zh-Hant', 'ru', 'az', 'de', 'sq', 'bs', 'ta', 'ml'] as const;

/** The eight locales T-428 ships last; the same bar covers their names and explanations */
const T428_EIGHT = ['te', 'gu', 'kn', 'am', 'om', 'bm', 'tl', 'ff'] as const;

describe('the landed catalogs against the R2 gates', () => {
  it.each(LOCALES)('%s holds exactly the en key set', (loc) => {
    expect(Object.keys(CATALOGS[loc]).sort()).toEqual([...Object.keys(en).sort()]);
  });

  it.each(LOCALES)('%s keeps every placeholder token set equal to en', (loc) => {
    const failures: string[] = [];
    for (const [key, value] of Object.entries(CATALOGS[loc])) {
      if (tokensOf(value) !== tokensOf(en[key as keyof typeof en])) {
        failures.push(`${loc}: ${key} placeholder set differs`);
      }
    }
    expect(failures).toEqual([]);
  });

  it.each(Object.keys(SHIPPED))('%s gives the interpolated time a space or the string edge on each side', (loc) => {
    expect(gluedSides(SHIPPED[loc]['time.ago'])).toEqual([]);
  });

  it('names the glued sides from the template bytes, with the string edge standing in for a space', () => {
    expect(gluedSides('{duration}')).toEqual([]);
    expect(gluedSides('{name}{duration} ago')).toEqual(['leading']);
    expect(gluedSides('{name} {duration}ago')).toEqual(['trailing']);
    expect(gluedSides('{name}{duration}ago')).toEqual(['leading', 'trailing']);
  });

  it.each(LOCALES)('%s keeps the padded error keys padded', (loc) => {
    const failures: string[] = [];
    for (const [key, value] of Object.entries(CATALOGS[loc])) {
      const english = en[key as keyof typeof en];
      if (english.startsWith(' ') && !value.startsWith(' ')) failures.push(`${loc}: ${key} lost leading space`);
      if (english.endsWith(' ') && !value.endsWith(' ')) failures.push(`${loc}: ${key} lost trailing space`);
    }
    expect(failures).toEqual([]);
  });

  it.each(LOCALES)('%s keeps the paragraph breaks', (loc) => {
    const failures: string[] = [];
    for (const [key, value] of Object.entries(CATALOGS[loc])) {
      if (en[key as keyof typeof en].includes('\n\n') && !value.includes('\n\n')) {
        failures.push(`${loc}: ${key} lost its paragraph break`);
      }
    }
    expect(failures).toEqual([]);
  });

  it.each(LOCALES)('%s keeps the brand bytes where en has them and adds none elsewhere', (loc) => {
    const failures: string[] = [];
    for (const [key, value] of Object.entries(CATALOGS[loc])) {
      const english = en[key as keyof typeof en];
      if (BRAND_REQUIRED.has(key) && !value.includes(BRAND)) failures.push(`${loc}: ${key} dropped the brand bytes`);
      if (!english.includes(BRAND) && /Athan/.test(value)) failures.push(`${loc}: ${key} added stray brand bytes`);
    }
    expect(failures).toEqual([]);
  });

  it.each(LOCALES)('%s matches the sourced prayer names verbatim', (loc) => {
    const failures: string[] = [];
    for (const [key, text] of sourcedNames(loc)) {
      if (CATALOGS[loc][key as keyof Catalog] !== text) {
        failures.push(`${loc}: ${key} drifts from the sourced "${text}"`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('sources every T-410 name and explanation slot with text, slug and confidence', () => {
    const glossary = sourced as unknown as Record<
      string,
      { names: Record<string, Entry>; explanations: Record<string, Entry> } | undefined
    >;
    const failures: string[] = [];
    for (const loc of T410_TEN) {
      const sections = glossary[loc];
      if (!sections) {
        failures.push(`${loc}: absent from the glossary`);
        continue;
      }
      const slots = [...Object.entries(sections.names), ...Object.entries(sections.explanations)];
      for (const [slot, entry] of slots) {
        if (!entry?.text || !entry.source || !entry.confidence) {
          failures.push(`${loc}: ${slot} unsourced`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('sources every T-419 name and explanation slot with text, slug and confidence', () => {
    const glossary = sourced as unknown as Record<
      string,
      { names: Record<string, Entry>; explanations: Record<string, Entry> } | undefined
    >;
    const failures: string[] = [];
    for (const loc of T419_TEN) {
      const sections = glossary[loc];
      if (!sections) {
        failures.push(`${loc}: absent from the glossary`);
        continue;
      }
      const slots = [...Object.entries(sections.names), ...Object.entries(sections.explanations)];
      for (const [slot, entry] of slots) {
        if (!entry?.text || !entry.source || !entry.confidence) {
          failures.push(`${loc}: ${slot} unsourced`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('sources every T-428 name and explanation slot with text, slug and confidence', () => {
    const glossary = sourced as unknown as Record<
      string,
      { names: Record<string, Entry>; explanations: Record<string, Entry> } | undefined
    >;
    const failures: string[] = [];
    for (const loc of T428_EIGHT) {
      const sections = glossary[loc];
      if (!sections) {
        failures.push(`${loc}: absent from the glossary`);
        continue;
      }
      const slots = [...Object.entries(sections.names), ...Object.entries(sections.explanations)];
      for (const [slot, entry] of slots) {
        if (!entry?.text || !entry.source || !entry.confidence) {
          failures.push(`${loc}: ${slot} unsourced`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('carries the owner-ruled re-shortened names (D81 and D83, 2026-10-12)', () => {
    expect(CATALOGS.ms['prayer.last third']).toBe('Sepertiga malam');
    expect(CATALOGS.hi['prayer.midnight']).toBe('आधी रात');
    expect(CATALOGS.th['prayer.last third']).toBe('ช่วงสุดท้าย');
    expect(CATALOGS.so['prayer.midnight']).toBe('Saqda dhexe');
  });

  it.each(LOCALES)('%s stays inside the length budget', (loc) => {
    const failures: string[] = [];
    for (const [key, value] of Object.entries(CATALOGS[loc])) {
      const english = en[key as keyof typeof en];
      const ratio = plain(value).length / Math.max(plain(english).length, 1);
      if (ratio > 3 && plain(value).length > 90) {
        failures.push(`${loc}: ${key} over length budget (${ratio.toFixed(1)}x)`);
      }
    }
    expect(failures).toEqual([]);
  });

  it.each(LOCALES)('%s does not echo its English source', (loc) => {
    const failures: string[] = [];
    for (const [key, value] of Object.entries(CATALOGS[loc])) {
      const english = en[key as keyof typeof en];
      if (
        !echoExempt(key) &&
        plain(value).includes(plain(english)) &&
        plain(english).length >= 6 &&
        !PRAYER_NAME_KEYS.includes(key)
      ) {
        failures.push(`${loc}: ${key} echoes its English source`);
      }
    }
    expect(failures).toEqual([]);
  });

  it.each([...RTL])('%s mixes no Latin into RTL copy outside tokens and the brand', (loc) => {
    const failures: string[] = [];
    for (const [key, value] of Object.entries(CATALOGS[loc])) {
      if (
        // The widget answer's platform labels stay Latin in every locale
        key === 'help.a.widgets'
      ) {
        continue;
      }
      const stripped = plain(value).split(BRAND).join('');
      if (/[A-Za-z]{2,}/.test(stripped)) failures.push(`${loc}: ${key} mixes Latin into RTL copy`);
    }
    expect(failures).toEqual([]);
  });

  it.each(LOCALES)('%s keeps prayer names inside the 24-char label budget', (loc) => {
    const failures: string[] = [];
    for (const key of PRAYER_NAME_KEYS) {
      if (plain(CATALOGS[loc][key as keyof Catalog]).length > 24) {
        failures.push(`${loc}: ${key} exceeds the 24-char label budget`);
      }
    }
    expect(failures).toEqual([]);
  });
});
