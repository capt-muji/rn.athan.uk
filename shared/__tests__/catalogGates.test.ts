/**
 * The R2 mechanical gates over the six landed catalogs (D42), in-process so CI refuses
 * a defective catalog without the plan folder. The provenance check has no twin here by
 * design: it is a planning artefact. The shipped suite pins the prayer names against
 * sourced-names.json, the committed copy of the research glossary.
 */

import { ar } from '@/shared/i18n/ar';
import type { Catalog } from '@/shared/i18n/en';
import { en } from '@/shared/i18n/en';
import { hi } from '@/shared/i18n/hi';
import { ms } from '@/shared/i18n/ms';
import { so } from '@/shared/i18n/so';
import sourced from '@/shared/i18n/sourced-names.json';
import { th } from '@/shared/i18n/th';

const CATALOGS: Record<string, Catalog> = { ar, ms, so, hi, th };
const LOCALES = Object.keys(CATALOGS);
const RTL = new Set(['ar']);
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
// Place names stay as printed; calendar loanwords are legitimately identical across
// languages; historical What's New entries never render for a fresh installer
const echoExempt = (key: string) =>
  key === 'day.location' ||
  key.startsWith('calendar.') ||
  /^whatsNew\.(title|body)\.(tabletSupport|athanSounds|reminderSounds|widgets|secondReminder|helpPage|qiblaCompass)$/.test(
    key
  );

const tokensOf = (value: string) =>
  [...value.matchAll(TOKEN)]
    .map((match) => match[1])
    .sort()
    .join(',');
const plain = (value: string) => value.replace(TOKEN, '');

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
        /^whatsNew\.(title|body)\.(tabletSupport|athanSounds|reminderSounds|widgets|secondReminder|helpPage|qiblaCompass)$/.test(
          key
        )
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
