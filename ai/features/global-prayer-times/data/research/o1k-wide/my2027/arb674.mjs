// T-674: MY-JAKIM margin arbitration, recomputed from the banked raw tables.
//
// Question: does the census margin set (+2 / -1 / +1.5 / +2 / 0 / +2) survive the 57-zone 2026
// baseline and the eleven 2027 tables, or does the my2027 sweep's zero-margin reading hold?
//
// Discipline: adhan 4.4.6 with rounding 'none', TZ pinned at +8 (Asia/Kuala_Lumpur, no DST, no
// clock read anywhere), margins applied to the raw float minutes, then the census row's own
// per-column rounding: syuruk floor, dhuhr round(transit + m), the other four prayers ceil.
// Every zone/table is scored at its banked recovered reference point (between-year.json,
// validated against Lampiran B); the arbitration is over margins, not points. The KL subuh
// point is re-derived here as an independence check on the 2027 fajr column.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const { default: Coordinates } = await import(pathToFileURL(ADHAN + 'Coordinates.js'));
const { default: CalculationParameters } = await import(pathToFileURL(ADHAN + 'CalculationParameters.js'));
const { default: PrayerTimes } = await import(pathToFileURL(ADHAN + 'PrayerTimes.js'));

const TZ = 8 * 60; // Asia/Kuala_Lumpur, fixed, no DST
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const KEY = { magrib: 'maghrib' };
const CENSUS = { fajr: 2, sunrise: -1, dhuhr: 1.5, asr: 2, magrib: 0, isha: 2 };
const SWEEP = { fajr: 0, sunrise: 0, dhuhr: 1.5, asr: 0, magrib: 0, isha: 0 };
const SWEEP_MARGIN_STEP = 0.5;
const MARGIN_LO = -2, MARGIN_HI = 3;
// Banked 2027 subuh reference points (subuh-point.txt), used for B2's fajr column.
const SUBUH27 = {
  'my-jawi-klptj-2027': 101.665,
  'my-jawi-labuan-2027': 115.145,
  'my-selangor-2027-gombak': 101.67,
  'my-selangor-2027-petaling': 101.665,
  'my-selangor-2027-sepang': 101.78,
  'my-selangor-2027-hulu-langat': 101.95,
  'my-selangor-2027-hulu-selangor': 101.55,
  'my-selangor-2027-kuala-selangor': 101.345,
  'my-selangor-2027-sabak-bernam': 101.055,
  'my-selangor-2027-klang': 101.46,
  'my-selangor-2027-kuala-langat': 101.54,
};

const min = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const secOfDay = d => d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();

function params(fajrAngle, ishaAngle) {
  const p = new CalculationParameters('Other', fajrAngle, ishaAngle);
  p.method = 'Other';
  p.madhab = 'shafi';
  p.rounding = 'none';
  return p;
}

// Raw float minutes (KL clock) for all six columns of one zone-day.
function rawAll(point, iso, fajrAngle, ishaAngle) {
  const t = new PrayerTimes(
    new Coordinates(point.lat, point.lon),
    new Date(iso + 'T00:00:00Z'),
    params(fajrAngle, ishaAngle),
  );
  const out = {};
  for (const c of COLS) out[c] = ((secOfDay(t[KEY[c] || c]) + TZ * 60) / 60) % 1440;
  return out;
}

// Census per-column rounding applied to raw + margin.
function round1(col, v) {
  if (col === 'sunrise') return Math.floor(v);
  if (col === 'dhuhr') return Math.round(v);
  return Math.ceil(v);
}

// ---- Banked inputs ----
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/between-year.json'), 'utf8'));
const zones2026 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/my-jakim-2026-all-zones.json'), 'utf8'));

// Baseline 1: 57 JAKIM zones, full 2026, at each zone's recovered point. Kelantan's isha
// exception (17 deg, both zones) is applied per the sweep and the census row.
const b1 = [];
for (const zone of Object.keys(zones2026)) {
  const point = bank.points2026[zone];
  const ishaAngle = zone === 'KTN01' || zone === 'KTN02' ? 17 : 18;
  for (const [iso, row] of Object.entries(zones2026[zone])) {
    const r = rawAll(point, iso, 18, ishaAngle);
    b1.push({ zone, iso, row, raw: r });
  }
}

// Baseline 2: the eleven 2027 tables at their own recovered point; fajr additionally at the
// table's banked subuh point (the 2027 peninsula reference move).
const b2 = [];
const b2fajrAtSubuh = [];
for (const slug of Object.keys(bank.tables2027)) {
  const meta = bank.tables2027[slug];
  const table = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', slug + '.json'), 'utf8'));
  const point = meta.ownPoint;
  const subuhPoint = { lat: point.lat, lon: SUBUH27[slug] };
  for (const [iso, row] of Object.entries(table)) {
    const r = rawAll(point, iso, meta.angles.fajr, meta.angles.isha);
    b2.push({ zone: slug, iso, row, raw: r });
    const rf = rawAll(subuhPoint, iso, meta.angles.fajr, meta.angles.isha);
    b2fajrAtSubuh.push({ zone: slug, iso, row, raw: rf });
  }
}

// ---- Scoring ----
function scoreColumn(samples, col, margin) {
  let exact = 0, within1 = 0, sumAbs = 0, worst = 0;
  for (const s of samples) {
    const e = min(s.row[col]) - round1(col, s.raw[col] + margin);
    if (e === 0) exact++;
    if (Math.abs(e) <= 1) within1++;
    sumAbs += Math.abs(e);
    if (Math.abs(e) > Math.abs(worst)) worst = e;
  }
  const n = samples.length;
  return { n, exact, within1, mae: +(sumAbs / n).toFixed(2), worst };
}

function sweepColumn(samples, col) {
  const rows = [];
  for (let m = MARGIN_LO; m <= MARGIN_HI + 1e-9; m += SWEEP_MARGIN_STEP) {
    rows.push({ margin: +m.toFixed(1), ...scoreColumn(samples, col, +m.toFixed(1)) });
  }
  rows.sort((a, b) => b.exact - a.exact || Math.abs(a.margin) - Math.abs(b.margin));
  return rows;
}

const line = (label, s) =>
  `${label.padEnd(22)} exact ${String(s.exact).padStart(6)}/${s.n} (${(100 * s.exact / s.n).toFixed(1)}%)` +
  `  within1 ${s.within1}  MAE ${s.mae}  worst ${s.worst}`;

const out = [];
out.push('T-674 MY-JAKIM margin arbitration - adhan 4.4.6, Rounding.None, TZ +8 fixed, no clock reads');
out.push('Census rounding discipline throughout: syuruk floor, dhuhr round, prayers ceil.');
out.push(`B1 = 57 JAKIM zones, full 2026, ${b1.length} rows, banked recovered points, isha 17 on KTN01+KTN02.`);
out.push(`B2 = eleven 2027 tables, ${b2.length} rows, own recovered points (fajr at the 2027 subuh point).`);
out.push('');

out.push('== Per-column margin sweep (exact counts; best margin first) ==');
for (const col of COLS) {
  for (const [tag, samples] of [['B1', b1], ['B2', b2]]) {
    if (col === 'fajr' && tag === 'B2') continue; // B2 fajr handled at the subuh point below
    const rows = sweepColumn(samples, col);
    const best = rows[0];
    const at0 = rows.find(r => r.margin === 0);
    const atCensus = rows.find(r => r.margin === CENSUS[col]);
    out.push(`${col.padEnd(8)} ${tag}  BEST m=${best.margin} exact ${best.exact}/${best.n} (${(100 * best.exact / best.n).toFixed(1)}%)` +
      ` | m=0: ${at0.exact} (${(100 * at0.exact / at0.n).toFixed(1)}%)` +
      ` | census m=${CENSUS[col]}: ${atCensus.exact} (${(100 * atCensus.exact / atCensus.n).toFixed(1)}%)`);
  }
}
out.push('');
out.push('== B2 fajr, 2027 subuh reference point (the peninsula move) ==');
{
  const rows = sweepColumn(b2fajrAtSubuh, 'fajr');
  const best = rows[0];
  const at0 = rows.find(r => r.margin === 0);
  const atCensus = rows.find(r => r.margin === CENSUS.fajr);
  out.push(`fajr     B2@subuh  BEST m=${best.margin} exact ${best.exact}/${best.n} (${(100 * best.exact / best.n).toFixed(1)}%)` +
    ` | m=0: ${at0.exact} (${(100 * at0.exact / at0.n).toFixed(1)}%)` +
    ` | census m=+2: ${atCensus.exact} (${(100 * atCensus.exact / atCensus.n).toFixed(1)}%)`);
  // Same column at the zohor point: shows the one-minute uniform shift a margin would misread.
  const z = sweepColumn(b2, 'fajr');
  const zb = z[0];
  out.push(`fajr     B2@zohor  BEST m=${zb.margin} exact ${zb.exact}/${zb.n} (${(100 * zb.exact / zb.n).toFixed(1)}%)  <- uniform -1 = the reference move, not a margin`);
}
out.push('');

out.push('== Recipe-level scores ==');
const sets = [['census A', CENSUS], ['derived B', SWEEP]];
for (const [tag, m] of sets) {
  for (const [btag, samples] of [['B1', b1], ['B2', b2]]) {
    out.push(`--- ${tag} on ${btag} ---`);
    for (const col of COLS) {
      const samples2 = col === 'fajr' && btag === 'B2' ? b2fajrAtSubuh : samples;
      out.push(line(col, scoreColumn(samples2, col, m[col])));
    }
  }
}
out.push('');

out.push('== Independence checks ==');
// 1. Re-derive the KL 2027 subuh point by grid (banked: 101.665, 358/365).
{
  const table = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/my-jawi-klptj-2027.json'), 'utf8'));
  const lat = bank.tables2027['my-jawi-klptj-2027'].ownPoint.lat;
  let best = null;
  for (let lon = 101.3; lon <= 101.95; lon += 0.005) {
    let exact = 0;
    for (const [iso, row] of Object.entries(table)) {
      const r = rawAll({ lat, lon }, iso, 18, 18);
      if (Math.ceil(r.fajr) === min(row.fajr)) exact++;
    }
    if (!best || exact > best.exact) best = { lon: +lon.toFixed(3), exact };
  }
  out.push(`KL 2027 subuh point re-derived: ${best.lon} deg, ${best.exact}/365 exact at m=0 (banked 101.665, 358/365)`);
}
// 2. Re-derive the WLY01 2026 point's longitude from dhuhr (banked: 101.3696).
{
  const table = zones2026.WLY01;
  const lat = bank.points2026.WLY01.lat;
  let best = null;
  for (let lon = 101.1; lon <= 101.65; lon += 0.005) {
    let exact = 0;
    for (const [iso, row] of Object.entries(table)) {
      const r = rawAll({ lat, lon }, iso, 18, 18);
      if (Math.round(r.dhuhr + 1.5) === min(row.dhuhr)) exact++;
    }
    if (!best || exact > best.exact) best = { lon: +lon.toFixed(3), exact };
  }
  out.push(`WLY01 2026 zohor longitude re-derived: ${best.lon} deg, ${best.exact}/365 dhuhr exact (banked 101.3696; Lampiran B Kg. Gedangsa 101.383)`);
}
// 2b. Dhuhr rounding mode at m=+1.5: the census row says both "prayers ceil" and
//     "round(transit+1.5)"; the two disagree, so the mode is scored, not assumed.
{
  const modes = { round: Math.round, ceil: Math.ceil, floor: Math.floor };
  for (const [btag, samples] of [['B1', b1], ['B2', b2]]) {
    const parts = [];
    for (const [name, fn] of Object.entries(modes)) {
      let exact = 0;
      for (const s of samples) if (min(s.row.dhuhr) - fn(s.raw.dhuhr + 1.5) === 0) exact++;
      parts.push(`${name} ${exact}/${samples.length} (${(100 * exact / samples.length).toFixed(1)}%)`);
    }
    out.push(`Dhuhr at m=+1.5, ${btag}, by rounding mode: ${parts.join('  ')}`);
  }
}
// 3. The mechanism test on 2026 that kills any +2: the residual of the printed value against
//    the plain ceiling, at the table's own point, where a longitude error cancels.
{
  let sum = 0, n = 0, hist = {};
  for (const col of ['fajr', 'asr', 'isha']) {
    for (const s of b1) {
      const e = min(s.row[col]) - Math.ceil(s.raw[col]);
      sum += e; n++;
      hist[e] = (hist[e] || 0) + 1;
    }
  }
  const top = Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([k, v]) => `${k}:${v}`).join(' ');
  out.push(`B1 residual printed - ceil(raw), fajr+asr+isha pooled: mean ${(sum / n).toFixed(3)} min over ${n} cells; hist ${top}`);
}

fs.writeFileSync(path.join(ROOT, 'arb674.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
