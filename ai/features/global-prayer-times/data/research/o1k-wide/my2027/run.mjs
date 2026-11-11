// Between-year test at national scale: JAKIM recipe, 2026 vs 2027.
//
// Point discipline: each 2026 zone's reference point is recovered from the 2026 table itself
// (longitude from dhuhr, latitude from the other five fields). That point is then FROZEN and
// predicts the 2027 table with nothing re-fitted on 2027. A 2027 table's own recovered point is
// also reported, as discovery, never as an input to the frozen score.
//
// Recipe A is the one on the census board (+2 / -1 / +1.5 / +2 / 0 / +2). Recipe B is the same
// rounding discipline with margins calibrated on the 2026 national harvest.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const { default: Coordinates } = await import(pathToFileURL(ADHAN + 'Coordinates.js'));
const { default: CalculationParameters } = await import(pathToFileURL(ADHAN + 'CalculationParameters.js'));
const { default: PrayerTimes } = await import(pathToFileURL(ADHAN + 'PrayerTimes.js'));
const { default: SolarTime } = await import(pathToFileURL(ADHAN + 'SolarTime.js'));

const TZ = 8 * 60;
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const ADHAN_COL = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', magrib: 'maghrib', isha: 'isha' };
const RECIPE_A = { fajr: 2, sunrise: -1, dhuhr: 1.5, asr: 2, magrib: 0, isha: 2 };

const min = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const secOfDay = d => d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();

function params(angles) {
  const p = new CalculationParameters('Other', angles.fajr, angles.isha);
  p.method = 'Other';
  p.madhab = 'shafi';
  p.rounding = 'none';
  return p;
}

function raw(point, iso, angles) {
  const t = new PrayerTimes(new Coordinates(point.lat, point.lon), new Date(iso + 'T00:00:00Z'), params(angles));
  const out = {};
  for (const c of COLS) out[c] = ((secOfDay(t[ADHAN_COL[c]]) + TZ * 60) / 60) % 1440;
  return out;
}

function fitLon(table, angles) {
  let lon = 101.5;
  for (let i = 0; i < 6; i++) {
    const offs = [];
    for (const [iso, row] of Object.entries(table)) {
      const st = new SolarTime(new Date(iso + 'T00:00:00Z'), new Coordinates(3, lon));
      offs.push((min(row.dhuhr) - RECIPE_A.dhuhr) - ((st.transit * 60 + TZ) % 1440));
    }
    offs.sort((a, b) => a - b);
    lon -= offs[Math.floor(offs.length / 2)] / 4;
  }
  return lon;
}

function sse(table, lon, lat, angles) {
  let s = 0;
  for (const [iso, row] of Object.entries(table)) {
    const r = raw({ lat, lon }, iso, angles);
    for (const c of ['fajr', 'asr', 'isha', 'sunrise', 'magrib']) { const e = min(row[c]) - r[c]; s += e * e; }
  }
  return s;
}

function fitLat(table, lon, angles) {
  const f = lat => sse(table, lon, lat, angles);
  let a = 0.5, b = 7.5;
  const phi = (Math.sqrt(5) - 1) / 2;
  let c = b - phi * (b - a), d = a + phi * (b - a);
  let fc = f(c), fd = f(d);
  for (let i = 0; i < 80; i++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - phi * (b - a); fc = f(c); }
    else { a = c; c = d; fc = fd; d = a + phi * (b - a); fd = f(d); }
  }
  return (a + b) / 2;
}

const fitPoint = (table, angles) => {
  const lon = fitLon(table, angles);
  return { lat: +fitLat(table, lon, angles).toFixed(4), lon: +lon.toFixed(4) };
};

function predict(point, iso, angles, col, m) {
  const r = raw(point, iso, angles);
  if (col === 'dhuhr') return Math.round(r.dhuhr + m.dhuhr);
  if (col === 'sunrise') return Math.floor(r.sunrise + m.sunrise);
  return Math.ceil(r[col] + m[col]);
}

function score(table, point, angles, m) {
  const out = {};
  for (const col of COLS) {
    const res = [];
    for (const [iso, row] of Object.entries(table)) res.push(min(row[col]) - predict(point, iso, angles, col, m));
    const hist = {};
    for (const x of res) hist[x] = (hist[x] || 0) + 1;
    out[col] = {
      n: res.length,
      exact: res.filter(x => x === 0).length,
      within1: res.filter(x => Math.abs(x) <= 1).length,
      mean: +(res.reduce((a, b) => a + b, 0) / res.length).toFixed(2),
      worst: res.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0),
      hist,
    };
  }
  return out;
}

const anglesOf = name => (/ktn/.test(name) ? { fajr: 18, isha: 17 } : { fajr: 18, isha: 18 });
const NATIONAL = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/my-jakim-2026-all-zones.json'), 'utf8'));

// Stage 1: recover every 2026 zone point once, then calibrate margins on that year.
const points2026 = {};
for (const [zone, table] of Object.entries(NATIONAL)) points2026[zone] = fitPoint(table, anglesOf(zone.toLowerCase()));

let recipeB = { ...RECIPE_A };
for (let pass = 0; pass < 3; pass++) {
  for (const col of COLS) {
    let best = null;
    for (let m = -1; m <= 2.5; m += 0.5) {
      let exact = 0;
      for (const [zone, table] of Object.entries(NATIONAL)) {
        exact += score(table, points2026[zone], anglesOf(zone.toLowerCase()), { ...recipeB, [col]: m })[col].exact;
      }
      if (!best || exact > best.exact) best = { m, exact };
    }
    recipeB[col] = best.m;
  }
}

function summarize(scores) {
  const agg = {};
  for (const col of COLS) {
    const s = Object.values(scores).map(x => x[col]);
    agg[col] = {
      exact: s.reduce((a, b) => a + b.exact, 0),
      within1: s.reduce((a, b) => a + b.within1, 0),
      n: s.reduce((a, b) => a + b.n, 0),
      maae: +(s.reduce((a, b) => a + Math.abs(b.mean) * b.n, 0) / s.reduce((a, b) => a + b.n, 0)).toFixed(2),
      worst: s.reduce((a, b) => (Math.abs(b.worst) > Math.abs(a) ? b.worst : a), 0),
    };
  }
  return agg;
}

const m2026A = {}, m2026B = {};
for (const [zone, table] of Object.entries(NATIONAL)) {
  const a = anglesOf(zone.toLowerCase());
  m2026A[zone] = score(table, points2026[zone], a, RECIPE_A);
  m2026B[zone] = score(table, points2026[zone], a, recipeB);
}

// Stage 2: 2027 tables, frozen 2026 points.
const MAP = {
  'my-jawi-klptj-2027': 'WLY01',
  'my-jawi-labuan-2027': 'WLY02',
  'my-selangor-2027-gombak': 'SGR01',
  'my-selangor-2027-petaling': 'SGR01',
  'my-selangor-2027-sepang': 'SGR01',
  'my-selangor-2027-hulu-langat': 'SGR01',
  'my-selangor-2027-hulu-selangor': 'SGR01',
  'my-selangor-2027-kuala-selangor': 'SGR02',
  'my-selangor-2027-sabak-bernam': 'SGR02',
  'my-selangor-2027-klang': 'SGR03',
  'my-selangor-2027-kuala-langat': 'SGR03',
};

const out2027 = {};
for (const [slug, zone] of Object.entries(MAP)) {
  const file = path.join(ROOT, 'data', slug + '.json');
  if (!fs.existsSync(file)) { console.log('MISSING', slug); continue; }
  const table = JSON.parse(fs.readFileSync(file, 'utf8'));
  const angles = anglesOf(slug.replace('my-selangor-2027-', 'sgr'));
  const own = fitPoint(table, angles);
  out2027[slug] = {
    zone, angles,
    frozenPoint: points2026[zone], ownPoint: own,
    frozenA: score(table, points2026[zone], angles, RECIPE_A),
    frozenB: score(table, points2026[zone], angles, recipeB),
    ownB: score(table, own, angles, recipeB),
  };
}

const report = {
  recipeA: RECIPE_A, recipeB,
  points2026,
  national2026: { recipeA: summarize(m2026A), recipeB: summarize(m2026B) },
  zones2026: m2026B,
  tables2027: out2027,
};
fs.writeFileSync(path.join(ROOT, 'data/between-year.json'), JSON.stringify(report, null, 1));

const show = (label, agg) => console.log(label, COLS.map(c => `${c} ${agg[c].exact}/${agg[c].n} (${(100 * agg[c].exact / agg[c].n).toFixed(0)}%) mae ${agg[c].maae} w${agg[c].worst}`).join(' | '));
console.log('recipe B margins', JSON.stringify(recipeB));
show('2026 A', report.national2026.recipeA);
show('2026 B', report.national2026.recipeB);
const frozenAgg = {}, ownAgg = {};
for (const [s, r] of Object.entries(out2027)) {
  frozenAgg[s] = r.frozenB;
  ownAgg[s] = r.ownB;
  console.log(s.padEnd(34), `z=${r.zone}`, `own ${r.ownPoint.lat},${r.ownPoint.lon}`,
    `dz ${(r.ownPoint.lon - r.frozenPoint.lon).toFixed(2)}dlon ${(r.ownPoint.lat - r.frozenPoint.lat).toFixed(2)}dlat |`,
    COLS.map(c => `${c.slice(0, 3)} ${r.ownB[c].exact}/${r.ownB[c].within1}/${r.ownB[c].mean}`).join(' '));
}
for (const [label, agg] of [['2027 B frozen point', frozenAgg], ['2027 B own point', ownAgg]]) {
  const tot = summarize(agg);
  console.log(label, COLS.map(c => `${c} ${tot[c].exact}/${tot[c].n} mae ${tot[c].maae} w${tot[c].worst}`).join(' | '));
}
