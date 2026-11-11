// Korea: KMF (Korean Muslim Federation) Seoul year table, 365 rows
// 2026-02-01..2027-01-31. Publisher statement under test: MWL at rounded
// coords 37.6/127.0 with ceiling rounding. Free fit follows.
// Run: TZ=Asia/Seoul node kr.js
import * as fs from 'node:fs';
import { loadAdhan, params, methodParams, parseHHMM, bestMargin, evalFixed, secOfDay, scoreLine } from './lib.mjs';

const HOME = process.env.HOME;
const DATA = HOME + '/athan-gitree/census/o1k-wide/koreajapan/data/kmf-seoul-2026-2027.json';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit3/kr.json';

const adhan = await loadAdhan();
const rawAll = JSON.parse(fs.readFileSync(DATA, 'utf8'));
// 2027-01-27 fajr prints 6:19 where the sequence and astronomy give 6:09:
// publisher typesetting slip, flagged by the wave-4 capture report. Carried
// as printed in the data file, excluded from fit stats and reported apart.
const SLIP = '2027-01-27';
const raw = Object.fromEntries(Object.entries(rawAll).filter(([k]) => k !== SLIP));
const isos = Object.keys(raw).sort();
const rows = isos.map(iso => {
  const [y, m, d] = iso.split('-').map(Number);
  const r = raw[iso];
  return { iso, y, m, d, fajr: parseHHMM(r.fajr), sunrise: parseHHMM(r.sunrise), dhuhr: parseHHMM(r.dhuhr), asr: parseHHMM(r.asr), magrib: parseHHMM(r.magrib), isha: parseHHMM(r.isha) };
});
const slipRow = { iso: SLIP, ...rawAll[SLIP] };
console.log('rows', rows.length, rows[0].iso, '..', rows[rows.length - 1].iso, '(slip day excluded:', SLIP + ')');

const CITY = { lat: 37.5665, lon: 126.9780 };
const STATED = { lat: 37.6, lon: 127.0 };

function computeAt(lat, lon, mk, y, m, d) {
  const c = new adhan.Coordinates(lat, lon);
  return new adhan.PrayerTimes(c, new Date(y, m - 1, d), mk());
}

const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const PICK = { fajr: t => t.fajr, sunrise: t => t.sunrise, dhuhr: t => t.dhuhr, asr: t => t.asr, magrib: t => t.maghrib, isha: t => t.isha };

function stats(printed, sec, mode, margin = 0) {
  return evalFixed(sec, printed, margin, mode);
}

// 1) Verify the statement as-is: MWL, 37.6/127.0, ceiling, margin 0 — plus
// the same at city and masjid coords, to test the 37.6/127.0 hypothesis.
const HYP = { stated_37_6_127: [37.6, 127.0], city: [37.5665, 126.9780], masjid: [37.5483, 126.9774] };
const coordsTable = {};
let asis = null;
for (const [name, [lat, lon]] of Object.entries(HYP)) {
  const c = new adhan.Coordinates(lat, lon);
  const per = {};
  let tex = 0, tw1 = 0;
  for (const col of COLS) {
    const sec = secOfDay(rows, (y, m, d) => computeAt(lat, lon, () => methodParams(adhan, () => adhan.CalculationMethod.MuslimWorldLeague()), y, m, d), PICK[col]);
    per[col] = stats(rows.map(r => r[col]), sec, 'ceil');
    tex += per[col].exact; tw1 += per[col].within1;
  }
  coordsTable[name] = { per, total_exact: tex, total_within1: tw1, n_values: rows.length * 6 };
  if (name === 'stated_37_6_127') asis = per;
}
console.log('AS-IS MWL 37.6/127.0 ceil (slip excluded):');
COLS.forEach(c => console.log('  ' + scoreLine(c + ' [' + asis[c].exact + ']', { ...asis[c], margin: 0, mode: 'ceil' })));
Object.entries(coordsTable).forEach(([k, v]) => console.log('coords', k, 'total exact', v.total_exact + '/' + v.n_values, 'within1', v.total_within1));

// Rounding-mode cross-check at the stated recipe.
const rcheck = {};
for (const mode of ['floor', 'nearest', 'ceil']) {
  const sec = secOfDay(rows, (y, m, d) => computeAt(STATED.lat, STATED.lon, () => methodParams(adhan, () => adhan.CalculationMethod.MuslimWorldLeague()), y, m, d), PICK.fajr);
  rcheck[mode] = stats(rows.map(r => r.fajr), sec, mode);
}
console.log('fajr rounding cross-check:', Object.entries(rcheck).map(([k, v]) => k + '=' + v.exact).join('  '));

// 2) Free fit: angle sweeps for fajr/isha, margin sweep for all columns.
// Solar columns use angles 90 (unused by their picks) so the picked time is
// the bare solar event; asr gets both madhabs.
function fitAngle(col, lo, hi, step) {
  const printed = rows.map(r => r[col]);
  let best = null;
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const sec = secOfDay(rows, (y, m, d) => computeAt(CITY.lat, CITY.lon, () => params(adhan, a, a), y, m, d), PICK[col]);
    const r = bestMargin(sec, printed);
    if (!best || r.exact > best.r.exact || (r.exact === best.r.exact && r.within1 > best.r.within1)) best = { angle: Math.round(a * 100) / 100, r };
  }
  return best;
}

const free = {};
free.fajr = await fitAngle('fajr', 12, 21, 0.1);
free.isha = await fitAngle('isha', 12, 21, 0.1);
// refine around the winners at 0.01
for (const col of ['fajr', 'isha']) {
  const b = free[col];
  const printed = rows.map(r => r[col]);
  let best = { angle: b.angle, r: evalFixed(secOfDay(rows, (y, m, d) => computeAt(CITY.lat, CITY.lon, () => params(adhan, b.angle, b.angle), y, m, d), PICK[col]), printed, b.r.margin, b.r.mode) };
  for (let a = b.angle - 0.1; a <= b.angle + 0.1 + 1e-9; a += 0.01) {
    const sec = secOfDay(rows, (y, m, d) => computeAt(CITY.lat, CITY.lon, () => params(adhan, Math.round(a * 100) / 100, Math.round(a * 100) / 100), y, m, d), PICK[col]);
    const r = bestMargin(sec, printed);
    if (r.exact > best.r.exact || (r.exact === best.r.exact && r.within1 > best.r.within1)) best = { angle: Math.round(a * 100) / 100, r };
  }
  free[col] = best;
}
console.log('free fajr angle', free.fajr.angle, scoreLine('fajr', free.fajr.r));
console.log('free isha angle', free.isha.angle, scoreLine('isha', free.isha.r));

// Solar columns at true coords: sunrise (alt -0.833), dhuhr (transit), asr
// (Shafi and Hanafi), maghrib (sunset). Angle 0/0 with the right pick gives
// exactly the solar event; Other(0,0) fajr/isha are meaningless but unused.
const solar = {};
for (const col of ['sunrise', 'dhuhr', 'magrib']) {
  const printed = rows.map(r => r[col]);
  const sec = secOfDay(rows, (y, m, d) => computeAt(CITY.lat, CITY.lon, () => params(adhan, 90, 90), y, m, d), PICK[col]);
  solar[col] = bestMargin(sec, printed);
}
for (const [mad, name] of [[adhan.Madhab.Shafi, 'shafi'], [adhan.Madhab.Hanafi, 'hanafi']]) {
  const printed = rows.map(r => r.asr);
  const sec = secOfDay(rows, (y, m, d) => {
    const p = params(adhan, 90, 90); p.madhab = mad;
    return computeAt(CITY.lat, CITY.lon, () => p, y, m, d);
  }, PICK.asr);
  solar['asr_' + name] = bestMargin(sec, printed);
}
Object.entries(solar).forEach(([k, v]) => console.log('free', k, scoreLine(k, v)));

const out = {
  country: 'kr', publisher: 'KMF (Korean Muslim Federation), Seoul',
  source: 'koreajapan/data/kmf-seoul-2026-2027.json', rows: rows.length + 1,
  span: [rows[0].iso, rows[rows.length - 1].iso], tz: 'Asia/Seoul',
  city_coords: CITY,
  stated: { method: 'MWL (fajr 18 / isha 17)', coords: STATED, rounding: 'ceil (up)' },
  slip_day: { iso: slipRow.iso, printed: slipRow, note: 'fajr prints 6:19 where the sequence and astronomy give 6:09 (publisher typesetting slip, flagged by wave-4 capture); excluded from fit stats' },
  stated_verification: coordsTable,
  rounding_crosscheck_fajr: rcheck,
  free_fit: { fajr: free.fajr, isha: free.isha, solar: solar },
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('wrote', OUT);
