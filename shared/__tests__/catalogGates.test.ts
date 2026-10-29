/**
 * The R2 mechanical gates over the landed catalogs (D42), in-process so CI refuses
 * a defective catalog without the plan folder. The provenance check has no twin here by
 * design: it is a planning artefact. The shipped suite pins the prayer names and the two
 * derived explanations against sourced-names.json, the committed copy of the research
 * glossary.
 */

import { am } from '@/shared/i18n/am';
import { ar } from '@/shared/i18n/ar';
import { az } from '@/shared/i18n/az';
import { bm } from '@/shared/i18n/bm';
import { bn } from '@/shared/i18n/bn';
import { bs } from '@/shared/i18n/bs';
import { ckb } from '@/shared/i18n/ckb';
import { de } from '@/shared/i18n/de';
import { type Catalog, en } from '@/shared/i18n/en';
import { es } from '@/shared/i18n/es';
import { fa } from '@/shared/i18n/fa';
import { ff } from '@/shared/i18n/ff';
import { fr } from '@/shared/i18n/fr';
import { gu } from '@/shared/i18n/gu';
import { ha } from '@/shared/i18n/ha';
import { hi } from '@/shared/i18n/hi';
import { id } from '@/shared/i18n/id';
import { jv } from '@/shared/i18n/jv';
import { kk } from '@/shared/i18n/kk';
import { kn } from '@/shared/i18n/kn';
import { ku } from '@/shared/i18n/ku';
import { ky } from '@/shared/i18n/ky';
import { ml } from '@/shared/i18n/ml';
import { mr } from '@/shared/i18n/mr';
import { ms } from '@/shared/i18n/ms';
import { nl } from '@/shared/i18n/nl';
import { om } from '@/shared/i18n/om';
import { paArab } from '@/shared/i18n/pa-Arab';
import { ps } from '@/shared/i18n/ps';
import { pt } from '@/shared/i18n/pt';
import { ru } from '@/shared/i18n/ru';
import { sd } from '@/shared/i18n/sd';
import { so } from '@/shared/i18n/so';
import sourced from '@/shared/i18n/sourced-names.json';
import { sq } from '@/shared/i18n/sq';
import { su } from '@/shared/i18n/su';
import { sw } from '@/shared/i18n/sw';
import { ta } from '@/shared/i18n/ta';
import { te } from '@/shared/i18n/te';
import { tg } from '@/shared/i18n/tg';
import { th } from '@/shared/i18n/th';
import { tk } from '@/shared/i18n/tk';
import { tl } from '@/shared/i18n/tl';
import { tr } from '@/shared/i18n/tr';
import { ug } from '@/shared/i18n/ug';
import { ur } from '@/shared/i18n/ur';
import { uz } from '@/shared/i18n/uz';
import { wo } from '@/shared/i18n/wo';
import { yo } from '@/shared/i18n/yo';
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
  es,
  nl,
  kk,
  ky,
  tg,
  tk,
  wo,
  mr,
  om,
  bm,
  tl,
  ff,
  te,
  gu,
  kn,
  am,
  'pa-Arab': paArab,
  sd,
  ug,
  ckb,
  ku,
  yo,
  jv,
  su,
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

/** The eleven name slots every locale's glossary section carries, against the catalog keys */
const GLOSSARY_NAMES: Array<[catalogKey: string, slot: string]> = [
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

/** The five explanation slots every locale's glossary section carries */
const GLOSSARY_EXPLANATIONS = [
  'Halfway between Magrib and Fajr',
  'Start of the last third of the night',
  '20 mins before Fajr',
  '20 mins after Sunrise',
  '1 hour before Magrib (Fridays only)',
];

/** The two explanations whose catalog text is the glossary's own sentence, never a paraphrase */
const GLOSSARY_EXPLANATION_PAIRS: Array<[catalogKey: string, slot: string]> = [
  ['extras.explanation.midnight', 'Halfway between Magrib and Fajr'],
  ['extras.explanation.last third', 'Start of the last third of the night'],
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

interface Entry {
  text: string | null;
  source: string | null;
  confidence: string | null;
}

interface GlossarySections {
  names: Record<string, Entry>;
  explanations: Record<string, Entry>;
}

const glossaryFor = (loc: string): GlossarySections | undefined =>
  (sourced as unknown as Record<string, GlossarySections | undefined>)[loc];

/** The ten locales T-410 ships; every slot they add to the glossary must carry sourcing */
const T410_TEN = ['id', 'ur', 'bn', 'fa', 'fr', 'tr', 'sw', 'ha', 'pt', 'uz'] as const;

/** The ten locales T-419 ships next; the same bar covers their names and explanations */
const T419_TEN = ['ps', 'zh-Hans', 'zh-Hant', 'ru', 'az', 'de', 'sq', 'bs', 'ta', 'ml'] as const;

/** The eight locales T-429 ships last; the same bar covers their names and explanations */
const T429_EIGHT = ['es', 'nl', 'kk', 'ky', 'tg', 'tk', 'wo', 'mr'] as const;
const T428_EIGHT = ['te', 'gu', 'kn', 'am', 'om', 'bm', 'tl', 'ff'] as const;
const T427_EIGHT = ['pa-Arab', 'sd', 'ug', 'ckb', 'ku', 'yo', 'jv', 'su'] as const;

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

  it.each(Object.keys(SHIPPED))(
    '%s carries the glossary whole and reproduces its names and two derived explanations byte for byte',
    (loc) => {
      const sections = glossaryFor(loc);
      expect(Object.keys(sections?.names ?? {}).sort()).toEqual(GLOSSARY_NAMES.map(([, slot]) => slot).sort());
      expect(Object.keys(sections?.explanations ?? {}).sort()).toEqual([...GLOSSARY_EXPLANATIONS].sort());

      const failures: string[] = [];
      const compare = (key: string, slot: string, section: Record<string, Entry>) => {
        // A slot the glossary leaves without text carries nothing to compare
        const text = section[slot]?.text;
        if (text && SHIPPED[loc][key as keyof Catalog] !== text) {
          failures.push(`${loc}: ${key} drifts from the glossary "${text}"`);
        }
      };
      const names = sections?.names ?? {};
      const explanations = sections?.explanations ?? {};
      for (const [key, slot] of GLOSSARY_NAMES) compare(key, slot, names);
      for (const [key, slot] of GLOSSARY_EXPLANATION_PAIRS) compare(key, slot, explanations);
      expect(failures).toEqual([]);
    }
  );

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

  it('sources every T-429 name and explanation slot with text, slug and confidence', () => {
    const glossary = sourced as unknown as Record<
      string,
      { names: Record<string, Entry>; explanations: Record<string, Entry> } | undefined
    >;
    const failures: string[] = [];
    for (const loc of T429_EIGHT) {
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

  it('sources every T-427 name and explanation slot with text, slug and confidence', () => {
    const glossary = sourced as unknown as Record<
      string,
      { names: Record<string, Entry>; explanations: Record<string, Entry> } | undefined
    >;
    const failures: string[] = [];
    for (const loc of T427_EIGHT) {
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

  it('negates the Wolof no-match line with the existential negation the catalog itself uses (T-451)', () => {
    expect(wo['language.noMatch']).toContain('Amul');
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
