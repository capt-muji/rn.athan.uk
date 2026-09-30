// R12: generate the human-readable catalog tables in SOURCE-CATALOG.md FROM sources.json.
//
// The two artefacts cannot be allowed to drift, so the markdown is never hand-edited. This
// script reads `sources.json`, renders the tables, and splices them into SOURCE-CATALOG.md
// between named marker comments. Everything outside the markers is prose and is left alone.
//
//   node build-catalog.mjs          write the tables into SOURCE-CATALOG.md
//   node build-catalog.mjs --check  exit 1 if the file is out of date, printing nothing else
//
// `--check` is the drift guard: run it after editing either file.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(HERE, 'sources.json');
const MD_PATH = join(HERE, '..', '..', 'SOURCE-CATALOG.md');

const catalog = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

// ------------------------------------------------------------------ validation
//
// Every rule name a source points at must exist in `ruleCatalog`, or the document
// silently ships a rule nobody defined. This gate is the reason to generate rather than
// hand-write: a dangling rule reference is invisible in prose and fatal here.
const validate = () => {
  const known = new Set(catalog.ruleCatalog.map((r) => r.rule));
  const problems = [];
  for (const s of catalog.sources) {
    const refs = [s.highLatitudeRule, s.statedHighLatitudeRule, s.fajr?.rule, s.isha?.rule].filter(Boolean);
    for (const r of refs) {
      if (r !== 'UNVERIFIED' && !known.has(r)) problems.push(`${s.id} references unknown rule \`${r}\``);
    }
    if (!s.id || !s.authority || !s.obtain?.kind || !s.evidence || !s.report) {
      problems.push(`${s.id || '(no id)'} is missing a mandatory field`);
    }
    if (!s.conceptToRow?.fajr) problems.push(`${s.id} has no fajr row in its concept map`);
  }
  const ids = catalog.sources.map((s) => s.id);
  if (new Set(ids).size !== ids.length) problems.push('duplicate source ids');
  if (problems.length) {
    console.error(`sources.json failed validation:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
};

validate();

// --------------------------------------------------------------------- helpers

// A markdown cell may not contain a raw pipe or a newline.
const cell = (v) => {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();
};

const table = (headers, rows) => {
  const head = `| ${headers.join(' | ')} |`;
  const rule = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.map(cell).join(' | ')} |`);
  return [head, rule, ...body].join('\n');
};

// Render a fajr/isha parameter object as one short human string.
const param = (p) => {
  if (!p) return '';
  if (typeof p.angle === 'number') return `${p.angle} deg`;
  if (typeof p.intervalAfterMaghribMin === 'number') {
    const ram = p.ramadanIntervalAfterMaghribMin;
    return `Maghrib +${p.intervalAfterMaghribMin} min${ram ? `, +${ram} in Ramadan` : ''}`;
  }
  if (p.rule) return `rule \`${p.rule}\``;
  return '';
};

// Wifaqul Ulama switches its Isha angle at 48 degrees of latitude, which no library
// expresses and which a single Isha cell would silently drop.
const isha = (s) => {
  const base = param(s.isha);
  const below = s.ishaBelow48Degrees;
  if (!below) return base;
  return `${base} at 48N and above, ${param(below)} below 48N`;
};

const asr = (s) => {
  const f = s.asrShadowFactor;
  const label = f === null || f === undefined ? 'none published'
    : f === 1 ? '1.0 standard'
    : f === 2 ? '2.0 Hanafi'
    : String(f);
  return s.asrAlternateShadowFactor ? `${label}, plus ${s.asrAlternateShadowFactor} published` : label;
};

const OFFSET_FIELDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const offsets = (s) => {
  const o = s.offsetsMin || {};
  return OFFSET_FIELDS.map((f) => (o[f] === null || o[f] === undefined ? '?' : o[f] > 0 ? `+${o[f]}` : String(o[f]))).join(' ');
};

const rounding = (s) => {
  const r = s.rounding || {};
  if (r.all) return r.all;
  const vals = OFFSET_FIELDS.map((f) => r[f]).filter(Boolean);
  if (!vals.length) return 'UNVERIFIED';
  if (new Set(vals).size === 1) return vals[0];
  return OFFSET_FIELDS.filter((f) => r[f]).map((f) => `${f[0].toUpperCase()}:${r[f]}`).join(' ');
};

const conceptMap = (s) => Object.entries(s.conceptToRow || {})
  .map(([concept, row]) => `${concept}=\`${row}\``)
  .join(', ');

const extras = (s) => {
  if (!s.extraRows?.length) return 'none';
  return s.extraRows.map((e) => {
    const bits = [`\`${e.row}\``, e.concept];
    if (typeof e.offsetFromFajrMin === 'number') bits.push(`${e.offsetFromFajrMin} min from fajr`);
    if (e.derivation) bits.push(`as ${e.derivation}`);
    return bits.join(' ');
  }).join('; ');
};

const obtain = (s) => {
  const o = s.obtain || {};
  const flags = [o.wholeYear ? 'whole year' : 'part year', o.keyless ? 'keyless' : 'keyed'];
  return `${o.kind} (${flags.join(', ')})`;
};

const place = (s) => {
  const bits = [s.place];
  if (s.zoneCode) bits.push(`zone \`${s.zoneCode}\``);
  if (s.coordinates) bits.push(`${s.coordinates[0]}, ${s.coordinates[1]}`);
  return bits.join(' / ');
};

// ------------------------------------------------------------------- the tables

// Table 1: identity. Who the source is and where it applies.
const identityTable = () => table(
  ['`id`', 'Authority', 'Country', 'Place, zone, coordinates', 'IANA timezone', 'URL'],
  catalog.sources.map((s) => [
    `\`${s.id}\``,
    s.authority,
    s.country,
    place(s),
    s.timezone ? `\`${s.timezone}\`` : 'per user',
    s.authorityUrl ? `\`${s.authorityUrl}\`` : 'none',
  ]),
);

// Table 2: parameters. Everything a computation needs.
const parameterTable = () => table(
  ['`id`', 'Fajr', 'Isha', 'Asr factor', 'Offsets F Su Dh A M I', 'High-latitude rule', 'Rounding'],
  catalog.sources.map((s) => [
    `\`${s.id}\``,
    param(s.fajr),
    isha(s),
    asr(s),
    `\`${offsets(s)}\``,
    `\`${s.highLatitudeRule}\``,
    rounding(s),
  ]),
);

// Table 3: rows. The concept-to-row map and the extra published rows.
const rowTable = () => table(
  ['`id`', 'Concept to published row', 'Extra published rows'],
  catalog.sources.map((s) => [`\`${s.id}\``, conceptMap(s), extras(s)]),
);

// Table 4: provenance. Category, how it is obtained, evidence, which report.
const provenanceTable = () => table(
  ['`id`', 'R6 category', 'Obtained as', 'Evidence', 'Report'],
  catalog.sources.map((s) => [
    `\`${s.id}\``,
    s.r6Category === null || s.r6Category === undefined ? 'not measured' : String(s.r6Category),
    obtain(s),
    s.evidence,
    s.report,
  ]),
);

// Table 5: the named rule catalog the parameter table's rule column points into.
const ruleTable = () => table(
  ['Rule', 'What it does', 'Used by', 'Evidence'],
  catalog.ruleCatalog.map((r) => [`\`${r.rule}\``, r.description, r.usedBy, r.evidence || 'see description']),
);

// Summary counts, so the prose never states a total the data contradicts.
const summaryTable = () => {
  const byKind = {};
  const byCategory = {};
  const byTier = { A: 0, mixed: 0, D: 0 };
  for (const s of catalog.sources) {
    byKind[s.obtain.kind] = (byKind[s.obtain.kind] || 0) + 1;
    const c = s.r6Category === null || s.r6Category === undefined ? 'not measured' : String(s.r6Category);
    byCategory[c] = (byCategory[c] || 0) + 1;
    if (s.evidence === 'A') byTier.A += 1;
    else if (s.evidence.startsWith('D')) byTier.D += 1;
    else byTier.mixed += 1;
  }
  const countries = new Set(catalog.sources.map((s) => s.countryIso2).filter(Boolean));
  const wholeYear = catalog.sources.filter((s) => s.obtain.wholeYear).length;
  const keyless = catalog.sources.filter((s) => s.obtain.keyless).length;
  return table(['Count', 'Value'], [
    ['Sources in the catalog', catalog.sources.length],
    ['Countries covered', countries.size],
    ['Evidence tier A outright', byTier.A],
    ['Evidence tier A in part, qualified on the row', byTier.mixed],
    ['Evidence tier D, a library constant only', byTier.D],
    ['Serve a whole year in one pass', wholeYear],
    ['Keyless', keyless],
    ['R6 category 1, exactly computable', byCategory['1'] || 0],
    ['R6 category 2, computable plus constants', byCategory['2'] || 0],
    ['R6 category 3, computable plus a seasonal curve', byCategory['3'] || 0],
    ['R6 category 4, genuinely irregular', byCategory['4'] || 0],
    ['Not measured by R6', byCategory['not measured'] || 0],
    ['Obtain kinds in use', Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join(', ')],
  ]);
};

// --------------------------------------------------------------------- splicing

const BLOCKS = {
  'catalog-summary': summaryTable,
  'catalog-identity': identityTable,
  'catalog-parameters': parameterTable,
  'catalog-rows': rowTable,
  'catalog-provenance': provenanceTable,
  'catalog-rules': ruleTable,
};

const GENERATED_NOTE = '<!-- generated from data/catalog/sources.json by build-catalog.mjs; do not hand-edit -->';

const splice = (md) => {
  let out = md;
  for (const [name, render] of Object.entries(BLOCKS)) {
    const open = `<!-- BEGIN ${name} -->`;
    const close = `<!-- END ${name} -->`;
    const start = out.indexOf(open);
    const end = out.indexOf(close);
    if (start === -1 || end === -1) {
      throw new Error(`SOURCE-CATALOG.md is missing the ${name} markers`);
    }
    const block = `${open}\n${GENERATED_NOTE}\n\n${render()}\n\n${close}`;
    out = out.slice(0, start) + block + out.slice(end + close.length);
  }
  return out;
};

const current = readFileSync(MD_PATH, 'utf8');
const next = splice(current);

if (process.argv.includes('--check')) {
  if (current !== next) {
    console.error('SOURCE-CATALOG.md is out of date with sources.json. Run `node build-catalog.mjs`.');
    process.exit(1);
  }
  console.log('SOURCE-CATALOG.md is in sync with sources.json.');
  process.exit(0);
}

writeFileSync(MD_PATH, next);
console.log(`wrote ${Object.keys(BLOCKS).length} generated tables covering ${catalog.sources.length} sources`);
