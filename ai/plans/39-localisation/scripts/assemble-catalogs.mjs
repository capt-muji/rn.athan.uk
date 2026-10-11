// Assembles the five milestone catalogs from the authoring tracks (D42).
// Inputs: the exported en.json (key truth), the stage-two en additions defined
// here, ui-track-<loc>.json (drafted UI translations), glossary-track.json (sourced
// or D24-filled), calendar-keys.json (CLDR-generated). Dead-at-2.0.0 keys (the
// historical whatsNew archive never displays for any installer of this version)
// stand in as English bytes, recorded in provenance. Anything else missing fails.
//
// Usage: node assemble-catalogs.mjs   (from the plan folder's scripts/ dir)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..', '..');
const plan = path.join(here, '..');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const en = read(path.join(root, 'shared/i18n/dist/en.json'));
const glossary = read(path.join(plan, 'catalogs/glossary-track.json'));
const calendar = read(path.join(plan, 'scripts/calendar-keys.json'));
const LOCALES = ['ar', 'ms', 'so', 'hi', 'th'];

const hijriMonths = (loc) => {
  const fmt = new Intl.DateTimeFormat(`${loc}-u-ca-islamic-umalqura`, { month: 'long' });
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric' });
  const out = [];
  const d = new Date(2026, 0, 15);
  const seen = new Set();
  while (seen.size < 12) {
    const idx = Number(parts.format(d));
    if (!seen.has(idx)) {
      seen.add(idx);
      out[idx - 1] = fmt.format(d);
    }
    d.setDate(d.getDate() + 1);
  }
  if (out.some((v) => v === undefined)) throw new Error(`sparse hijri year for ${loc}`);
  return out;
};

// en calendar values generate from the same CLDR source so en and the five agree
const enMonthShort = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(2026, i, 15))
);
const enWeekdayShort = [5, 6, 7, 8, 9, 10, 11].map((d) =>
  new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(2026, 9, d))
);
const enHijri = hijriMonths('en');

const NEW_KEYS = {
  'settings.language': 'Language',
  'language.applying': 'Applying…',
  'channel.reminder': '{name} in {n}m Reminder',
  'qibla.cardinal.n': 'N',
  'qibla.cardinal.e': 'E',
  'qibla.cardinal.s': 'S',
  'qibla.cardinal.w': 'W',
  'whatsNew.title.language': 'Language',
  'whatsNew.body.language': 'The app now speaks your language: pick it in Settings',
};
for (let m = 1; m <= 12; m += 1) NEW_KEYS[`calendar.monthShort.${m}`] = enMonthShort[m - 1];
for (let d = 1; d <= 7; d += 1) NEW_KEYS[`calendar.weekdayShort.${d}`] = enWeekdayShort[d - 1];
for (let h = 1; h <= 12; h += 1) NEW_KEYS[`calendar.hijri.${h}`] = enHijri[h - 1];

const FULL_KEYS = { ...en, ...NEW_KEYS };

// Keys whose English bytes stand in this milestone because no installer at 2.0.0 can
// ever see them render (shouldShowWhatsNew only shows items of the installed version)
const STANDIN = (key) =>
  /^whatsNew\.(title|body)\.(tabletSupport|athanSounds|reminderSounds|widgets|secondReminder|helpPage|qiblaCompass)$/.test(
    key
  );

const PADDED = new Set(['error.heading', 'error.body', 'error.hint', 'error.refresh']);
const out = { en: FULL_KEYS };
const provenance = {};

for (const loc of LOCALES) {
  const ui = read(path.join(plan, `catalogs/ui-track-${loc}.json`));
  const g = glossary[loc];
  const cal = calendar[loc];
  const flatCal = { ...cal.monthShort, ...cal.weekdayShort, ...cal.hijri };
  const gFlat = Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.v]));
  const catalog = {};
  const notes = [];
  for (const [key, enValue] of Object.entries(FULL_KEYS)) {
    const from = ui[key] ?? gFlat[key] ?? flatCal[key];
    if (from !== undefined) {
      catalog[key] = from;
      if (g[key]?.src.startsWith('drafted')) notes.push(`${key}: ${g[key].src}`);
      continue;
    }
    if (STANDIN(key)) {
      catalog[key] = enValue;
      notes.push(`${key}: English stand-in (never renders at 2.0.0)`);
      continue;
    }
    if (key === 'day.location' && ui[key] === enValue) {
      notes.push(`${key}: place name kept as printed (Latin), owner verifies in the confidence build`);
    }
    throw new Error(`${loc}: no value authored for ${key}`);
  }
  for (const key of PADDED) {
    const v = catalog[key];
    if (FULL_KEYS[key].startsWith(' ') && !v.startsWith(' ')) throw new Error(`${loc}: ${key} lost leading space`);
    if (FULL_KEYS[key].endsWith(' ') && !v.endsWith(' ')) throw new Error(`${loc}: ${key} lost trailing space`);
  }
  out[loc] = catalog;
  provenance[loc] = notes;
}

fs.writeFileSync(path.join(plan, 'catalogs/en-full.json'), `${JSON.stringify(out.en, null, 2)}\n`);
for (const loc of LOCALES) {
  fs.writeFileSync(path.join(plan, `catalogs/${loc}.json`), `${JSON.stringify(out[loc], null, 2)}\n`);
}
fs.writeFileSync(path.join(plan, 'catalogs/provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
process.stdout.write(
  `assembled: ${Object.keys(out)
    .map((l) => `${l}=${Object.keys(out[l]).length}`)
    .join(' ')}\n`
);
