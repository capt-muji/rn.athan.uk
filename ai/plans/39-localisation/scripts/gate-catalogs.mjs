// The R2 mechanical gates over the assembled catalogs (D42). Every check blocks.
// Advisory tiers do not exist here: a statistical check would lend false confidence.
//
// Gates: key parity; placeholder parity; padding preservation; paragraph-break shape;
// brand bytes (Athan stays Latin in body copy); glossary exact-match against
// research/prayer-names.json for every sourced entry; length budgets; the bidi scan
// (an RTL locale must not mix Latin letters into Arabic outside tokens and the brand);
// the echo scan (a value must not contain its own English source as a substring).
//
// Usage: node gate-catalogs.mjs   (from the plan folder's scripts/ dir)
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const plan = path.join(here, '..');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const LOCALES = ['ar', 'ms', 'so', 'hi', 'th'];
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
// feature word, which translates (azan/aqaan/अज़ान)
const BRAND_REQUIRED = new Set(['widget.refresh', 'widget.refreshLead']);
// Place names stay as printed; calendar loanwords are legitimately identical across
// languages (ms "Ramadan" == en "Ramadan")
const ECHO_EXEMPT = (key) => key === 'day.location' || key.startsWith('calendar.');

const en = read(path.join(plan, 'catalogs/en-full.json'));
const names = read(path.join(plan, 'research/prayer-names.json'));
const glossary = read(path.join(plan, 'catalogs/glossary-track.json'));
const failures = [];
const fail = (msg) => failures.push(msg);

const tokensOf = (v) =>
  [...String(v).matchAll(TOKEN)]
    .map((m) => m[1])
    .sort()
    .join(',');
const plain = (v) => String(v).replace(TOKEN, '');

const STANDIN = (key) =>
  /^whatsNew\.(title|body)\.(tabletSupport|athanSounds|reminderSounds|widgets|secondReminder|helpPage|qiblaCompass)$/.test(
    key
  );

for (const loc of LOCALES) {
  const cat = read(path.join(plan, `catalogs/${loc}.json`));
  const enKeys = Object.keys(en).sort();
  const locKeys = Object.keys(cat).sort();
  if (JSON.stringify(enKeys) !== JSON.stringify(locKeys)) {
    const missing = enKeys.filter((k) => !(k in cat));
    const extra = locKeys.filter((k) => !(k in en));
    fail(`${loc}: key parity broken (missing ${missing}, extra ${extra})`);
  }
  for (const [key, value] of Object.entries(cat)) {
    if (tokensOf(value) !== tokensOf(en[key])) fail(`${loc}: ${key} placeholder set differs`);
    if (en[key].includes('\n\n') && !value.includes('\n\n')) fail(`${loc}: ${key} lost its paragraph break`);
    if (en[key].startsWith(' ') && !value.startsWith(' ')) fail(`${loc}: ${key} lost leading space`);
    if (en[key].endsWith(' ') && !value.endsWith(' ')) fail(`${loc}: ${key} lost trailing space`);
    const ratio = plain(value).length / Math.max(plain(en[key]).length, 1);
    if (ratio > 3 && plain(value).length > 90) fail(`${loc}: ${key} over length budget (${ratio.toFixed(1)}x)`);
    if (
      !STANDIN(key) &&
      !ECHO_EXEMPT(key) &&
      plain(value).includes(plain(en[key])) &&
      plain(en[key]).length >= 6 &&
      !PRAYER_NAME_KEYS.includes(key)
    ) {
      fail(`${loc}: ${key} echoes its English source`);
    }
    if (BRAND_REQUIRED.has(key) && !value.includes(BRAND)) fail(`${loc}: ${key} dropped the brand bytes`);
    if (!en[key].includes(BRAND) && /Athan/.test(value)) fail(`${loc}: ${key} added stray brand bytes`);
  }

  // Glossary exact-match: every sourced (non-null) prayer name must appear verbatim
  const sourced = names[loc].names;
  for (const [key, entry] of Object.entries(sourced)) {
    if (!entry?.text) continue;
    const catalogKey = PRAYER_NAME_KEYS.find((k) => k.endsWith(entrySlug(key)));
    if (catalogKey && cat[catalogKey] !== entry.text) {
      fail(`${loc}: ${catalogKey} drifts from the sourced "${entry.text}"`);
    }
  }
  // Drafted fills must be recorded in provenance with a src starting "drafted"
  const prov = read(path.join(plan, 'catalogs/provenance.json'))[loc];
  for (const [key, entry] of Object.entries(glossary[loc])) {
    if (entry.src.startsWith('drafted') && !prov.some((note) => note.startsWith(`${key}: `))) {
      fail(`${loc}: ${key} drafted fill unrecorded`);
    }
  }

  // Bidi scan: an RTL locale mixes no Latin letters outside tokens and the brand.
  // Stand-in keys are English bytes by design and are exempt.
  if (RTL.has(loc)) {
    for (const [key, value] of Object.entries(cat)) {
      if (STANDIN(key)) continue;
      const stripped = plain(value).split(BRAND).join('');
      if (/[A-Za-z]{2,}/.test(stripped)) fail(`${loc}: ${key} mixes Latin into RTL copy`);
    }
  }

  // Width guard: a prayer name stays a label, not a sentence
  for (const key of PRAYER_NAME_KEYS) {
    if (plain(cat[key]).length > 24) fail(`${loc}: ${key} exceeds the 24-char label budget`);
  }
}

if (failures.length > 0) {
  process.stdout.write(`CATALOG GATES FAILED (${failures.length})\n`);
  for (const f of failures) process.stdout.write(`- ${f}\n`);
  process.exit(1);
}
process.stdout.write('CATALOG GATES OK\n');
function entrySlug(name) {
  return name === 'Last Third' ? 'last third' : name.toLowerCase();
}
