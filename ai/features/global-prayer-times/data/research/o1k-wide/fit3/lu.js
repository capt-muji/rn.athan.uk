// Luxembourg: Shoura calendar year 2026, 365 rows, Luxembourg City.
// Census record holds the angle hypothesis fajr 13.0 / isha 12.9. Verify as
// stated, free-fit, and evaluate named candidates MWL / ISNA / UOIF 12-12.
// Run: TZ=Europe/Luxembourg node lu.js
import * as fs from 'node:fs';
import { loadAdhan, params, methodParams, parseHHMM, bestMargin, evalFixed, secOfDay, scoreLine } from './lib.mjs';

const HOME = process.env.HOME;
const DATA = HOME + '/athan-gitree/census/o1k-wide/benelux2/data/lu-shoura-luxembourg-2026.json';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit3/lu.json';

const adhan = await loadAdhan();
const raw = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const isos = Object.keys(raw).sort();
const rows = isos.map(iso => {
  const [y, m, d] = iso.split('-').map(Number);
  const r = raw[iso];
  return { iso, y, m, d, fajr: parseHHMM(r.fajr), sunrise: parseHHMM(r.sunrise), dhuhr: parseHHMM(r.dhuhr), asr: parseHHMM(r.asr), magrib: parseHHMM(r.magrib), isha: parseHHMM(r.isha) };
});
console.log('rows', rows.length, rows[0].iso, '..', rows[rows.length - 1].iso);

const CITY = { lat: 49.6116, lon: 6.1319 };
const PICK = { fajr: t => t.fajr, sunrise: t => t.sunrise, dhuhr: t => t.dhuhr, asr: t => t.asr, magrib: t => t.maghrib, isha: t => t.isha };
const COLS = Object.keys(PICK);

function computeAt(lat, lon, mk, y, m, d) {
  return new adhan.PrayerTimes(new adhan.Coordinates(lat, lon), new Date(y, m - 1, d), mk());
}

function atMargin0(printed, sec, modes) {
  const out = {};
  for (const mode of modes) out[mode] = evalFixed(sec, printed, 0, mode);
  return out;
}

// 1) Stated hypothesis fajr 13.0 / isha 12.9 at margin 0.
const stated = {};
for (const col of COLS) {
  const sec = secOfDay(rows, (y, m, d) => computeAt(CITY.lat, CITY.lon, () => params(adhan, 13.0, 12.9), y, m, d), PICK[col]);
  stated[col] = atMargin0(rows.map(r => r[col]), sec, ['floor', 'nearest', 'ceil']);
}
console.log('STATED fajr 13.0 / isha 12.9, margin 0:');
for (const col of COLS) {
  const b = ['floor', 'nearest', 'ceil'].map(mo => [stated[col][mo].exact, mo]).sort((a, b) => b[0] - a[0])[0];
  console.log('  ' + col.padEnd(8) + ' exact ' + b[1] + '=' + b[0] + '/' + rows.length, ' nearest worst ' + stated[col].nearest.worst);
}

// 2) Named candidates at margin 0: MWL, ISNA, UOIF 12/12.
const candidates = {};
const CAND = { MWL: () => adhan.CalculationMethod.MuslimWorldLeague(), ISNA: () => adhan.CalculationMethod.NorthAmerica(), UOIF_12_12: () => params(adhan, 12, 12) };
for (const [name, mk] of Object.entries(CAND)) {
  const per = {};
  let tex = 0;
  for (const col of COLS) {
    const sec = secOfDay(rows, (y, m, d) => computeAt(CITY.lat, CITY.lon, mk, y, m, d), PICK[col]);
    per[col] = atMargin0(rows.map(r => r[col]), sec, ['floor', 'nearest', 'ceil']);
    tex += Math.max(...Object.values(per[col]).map(v => v.exact));
  }
  candidates[name] = { per, total_best_exact: tex };
  console.log('candidate', name, 'total best exact', tex + '/' + (rows.length * 6));
}

// 3) Free fit: independent angle sweeps for fajr and isha, margin sweep.
function fitAngle(col, lo, hi, step) {
  const printed = rows.map(r => r[col]);
  let best = null;
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const ang = Math.round(a * 100) / 100;
    const sec = secOfDay(rows, (y, m, d) => computeAt(CITY.lat, CITY.lon, () => params(adhan, ang, ang), y, m, d), PICK[col]);
    const r = bestMargin(sec, printed);
    if (!best || r.exact > best.r.exact || (r.exact === best.r.exact && r.within1 > best.r.within1)) best = { angle: ang, r };
  }
  return best;
}
const free = {};
free.fajr = fitAngle('fajr', 9, 18, 0.1);
free.isha = fitAngle('isha', 8, 18, 0.1);
// refine
for (const col of ['fajr', 'isha']) {
  const b = free[col];
  const printed = rows.map(r => r[col]);
  let best = { angle: b.angle, r: evalFixed(secOfDay(rows, (y, m, d) => computeAt(CITY.lat, CITY.lon, () => params(adhan, b.angle, b.angle), y, m, d), PICK[col]), printed, b.r.margin, b.r.mode) };
  for (let a = b.angle - 0.1; a <= b.angle + 0.1 + 1e-9; a += 0.01) {
    const ang = Math.round(a * 100) / 100;
    const sec = secOfDay(rows, (y, m, d) => computeAt(CITY.lat, CITY.lon, () => params(adhan, ang, ang), y, m, d), PICK[col]);
    const r = bestMargin(sec, printed);
    if (r.exact > best.r.exact || (r.exact === best.r.exact && r.within1 > best.r.within1)) best = { angle: ang, r };
  }
  free[col] = best;
}
console.log('free fajr', free.fajr.angle, scoreLine('fajr', free.fajr.r));
console.log('free isha', free.isha.angle, scoreLine('isha', free.isha.r));

// Solar + asr columns free fit at true coords.
const solar = {};
for (const col of ['sunrise', 'dhuhr', 'magrib']) {
  const sec = secOfDay(rows, (y, m, d) => computeAt(CITY.lat, CITY.lon, () => params(adhan, 90, 90), y, m, d), PICK[col]);
  solar[col] = bestMargin(sec, rows.map(r => r[col]));
}
for (const [mad, name] of [[adhan.Madhab.Shafi, 'asr_shafi'], [adhan.Madhab.Hanafi, 'asr_hanafi']]) {
  const sec = secOfDay(rows, (y, m, d) => {
    const p = params(adhan, 90, 90); p.madhab = mad;
    return computeAt(CITY.lat, CITY.lon, () => p, y, m, d);
  }, PICK.asr);
  solar[name] = bestMargin(sec, rows.map(r => r.asr));
}
Object.entries(solar).forEach(([k, v]) => console.log('free', k, scoreLine(k, v)));

const out = {
  country: 'lu', publisher: 'Shoura (Luxembourg Muslim council) calendar 2026',
  source: 'benelux2/data/lu-shoura-luxembourg-2026.json', rows: rows.length,
  span: [rows[0].iso, rows[rows.length - 1].iso], tz: 'Europe/Luxembourg',
  coords: CITY,
  stated_hypothesis: { fajr_angle: 13.0, isha_angle: 12.9, per_prayer_margin0: stated },
  named_candidates_margin0: candidates,
  free_fit: { fajr: free.fajr, isha: free.isha, solar: solar },
  seasonal_wobble: {
    fajr: '13.0 ceil is within 1 min all year except June-July (computed runs 1-2 min earlier than printed on 18 days) and the 2026-10-25 defect',
    isha: '12.9 nearest is exact Jul-Dec; Jan-Jun computed runs +1..+3 min later than printed (peak Apr-May): a seasonal angle wobble roughly 12.9 winter -> 12.4 spring that no single angle absorbs',
  },
  defects: [
    { days: '2026-03-01..03-31', col: 'magrib', what: 'printed = sunset + ~6 min for the whole month (baseline +1)' },
    { days: '2026-03-29', col: 'magrib,asr', what: 'DST-change day: both columns left on CET arithmetic, 55 resp 58 min off the shifted zone' },
    { days: '2026-10-25', col: 'fajr', what: 'DST-change day: fajr not shifted, printed 06:57 where the zone says 05:56 (61 min); other five columns correct' },
    { days: '2026-10-02', col: 'dhuhr', what: 'typo 13:34 where neighbours are 13:25/13:24' },
    { days: '2026-11-18/19', col: 'date stamps', what: 'source page prints 18.10./19.10.; parsed under the correct November dates' },
  ],
  verdict: {
    stated_held: 'yes in family: fajr 13.0 / isha 12.9 confirmed as the pair; isha carries a seasonal wobble the single angle absorbs only within 3 min',
    best_single_recipe: 'fajr 12.87-13.0 (+0.5 min floor bias), isha 12.9-12.94 (nearest), sunrise floor +0, dhuhr floor +0, maghrib sunset floor +1, asr Shafi floor +1.5 with winter drift to +3.5',
    candidates: 'MWL and ISNA refuted (429/2190 each at best rounding); UOIF 12/12 weak (806/2190)',
  },
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('wrote', OUT);
