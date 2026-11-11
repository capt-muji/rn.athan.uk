// O1l-1 Malaysia states: point recovery + recipe scoring for every dated table held.
// Recipe B is the 2027 federation verdict (fajr 18 / isha 18 / Shafi / zohor +1.5 only / ceil,
// sunrise floor). Recipe A is the census margins (+2 / -1 / +1.5 / +2 / 0 / +2).
// Each table's own reference point is recovered from the table itself: longitude from dhuhr
// (transit + 1.5, median over the year, 4 min per degree), latitude by golden-section on the
// other five fields. KTN-style zones carry isha 17; everything else 18.
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
const RECIPE_B = { fajr: 0, sunrise: -1, dhuhr: 1.5, asr: 0, magrib: 0, isha: 0 };

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
  let lon = 102;
  for (let i = 0; i < 6; i++) {
    const offs = [];
    for (const [iso, row] of Object.entries(table)) {
      const st = new SolarTime(new Date(iso + 'T00:00:00Z'), new Coordinates(3.5, lon));
      offs.push((min(row.dhuhr) - RECIPE_B.dhuhr) - ((st.transit * 60 + TZ) % 1440));
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
    out[col] = {
      n: res.length,
      exact: res.filter(x => x === 0).length,
      within1: res.filter(x => Math.abs(x) <= 1).length,
      mean: +(res.reduce((a, b) => a + b, 0) / res.length).toFixed(2),
      worst: res.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a), 0),
    };
  }
  return out;
}

function seasonalAmplitude(table, point, angles, m) {
  const isos = Object.keys(table);
  const jan = isos.find(k => k.slice(5, 7) === '01' && k.slice(8) === '01') || isos[0];
  const jul = isos.find(k => k.slice(5, 7) === '07' && k.slice(8) === '01') || isos[isos.length - 1];
  const out = {};
  for (const col of ['fajr', 'isha']) {
    const a = predict(point, jan, angles, col, m);
    const b = predict(point, jul, angles, col, m);
    out[col] = Math.abs(a - b);
  }
  return out;
}

const anglesOf = name => (/ktn/.test(name) ? { fajr: 18, isha: 17 } : { fajr: 18, isha: 18 });

const targets = [];
for (const f of fs.readdirSync(path.join(ROOT, 'data'))) {
  const m = f.match(/^(my-[\w-]+)\.json$/);
  if (m && f !== 'my-jakim-2026-all-zones.json') targets.push(m[1]);
}
targets.sort();

const report = {};
for (const slug of targets) {
  const table = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', slug + '.json'), 'utf8'));
  const angles = anglesOf(slug);
  const point = fitPoint(table, angles);
  const byYear = {};
  for (const [iso, row] of Object.entries(table)) (byYear[iso.slice(0, 4)] ||= []).push([iso, row]);
  const yr = {};
  for (const [y, rows] of Object.entries(byYear)) {
    const sub = Object.fromEntries(rows);
    yr[y] = {
      days: Object.keys(sub).length,
      B: score(sub, point, angles, RECIPE_B),
      A: score(sub, point, angles, RECIPE_A),
    };
  }
  report[slug] = { point, angles, span: [Object.keys(table)[0], Object.keys(table).at(-1)], days: Object.keys(table).length, perYear: yr, amplitude: seasonalAmplitude(table, point, angles, RECIPE_B) };
}

fs.writeFileSync(path.join(ROOT, 'data', 'fit-results.json'), JSON.stringify(report, null, 1));

for (const [slug, r] of Object.entries(report)) {
  console.log('== ' + slug + '  point ' + r.point.lat + ',' + r.point.lon + '  span ' + r.span[0] + '..' + r.span[1] + '  n ' + r.days
    + '  amp fajr ' + r.amplitude.fajr + ' isha ' + r.amplitude.isha);
  for (const [y, d] of Object.entries(r.perYear)) {
    const f = c => COLS.map(k => `${k.slice(0, 3)} ${d[c][k].exact}/${d[c][k].within1}/w${d[c][k].worst}`).join(' ');
    console.log('  ' + y + ' B: ' + f('B'));
    console.log('  ' + y + ' A: ' + f('A'));
  }
}
