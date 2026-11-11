// Taiwan: CMA (Chinese Muslim Association ROC) Ramadan tables, three
// editions (1445/2024 sample, 1446/2025 sample, 1447/2026 full).
// Derived rule under test: fajr = sunrise - 70, isha = maghrib + 90,
// maghrib = sunset + 6.7, dhuhr = noon + 19, asr fixed 16:06, at Taipei.
// Run: TZ=Asia/Taipei node tw.js
import * as fs from 'node:fs';
import { loadAdhan, parseHHMM, p2m, fmtMin, evalFixed } from './lib.mjs';

const HOME = process.env.HOME;
const DIR = HOME + '/athan-gitree/census/o1k-wide/china/data/';
const FILES = {
  '1445': 'taiwan-taipei_cma-ramadan-1445_sample.json',
  '1446': 'taiwan-taipei_cma-ramadan-1446_sample.json',
  '1447': 'taiwan-taipei_cma-ramadan-1447.json',
};
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit3/tw.json';

const adhan = await loadAdhan();
const c = new adhan.Coordinates(25.0330, 121.5654);

const editions = {};
for (const [ed, f] of Object.entries(FILES)) {
  const d = JSON.parse(fs.readFileSync(DIR + f, 'utf8'));
  const rows = {};
  for (const [k, v] of Object.entries(d)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) rows[k] = v;
  }
  editions[ed] = { source: d._source, offsets: d._city_offsets_minutes, notes: d._notes || d._of_note || null, rows };
}

const all = [];
for (const [ed, e] of Object.entries(editions)) {
  for (const [iso, v] of Object.entries(e.rows).sort()) {
    const [y, m, dd] = iso.split('-').map(Number);
    all.push({ ed, iso, y, m, d: dd, fajr: parseHHMM(v.fajr), sunrise: parseHHMM(v.sunrise), dhuhr: parseHHMM(v.dhuhr), asr: parseHHMM(v.asr), magrib: parseHHMM(v.magrib), isha: parseHHMM(v.isha) });
  }
}
console.log('rows per edition:', Object.fromEntries(Object.entries(editions).map(([k, e]) => [k, Object.keys(e.rows).length])), 'total', all.length);

function solar(y, m, d) {
  const st = new adhan.SolarTime(new Date(y, m - 1, d), c);
  const noon = new adhan.TimeComponents(st.transit).utcDate(y, m - 1, d);
  const sunrise = new adhan.TimeComponents(st.sunrise).utcDate(y, m - 1, d);
  const sunset = new adhan.TimeComponents(st.sunset).utcDate(y, m - 1, d);
  return { noon, sunrise, sunset };
}

function score(printed, computedMinArr, mode) {
  let exact = 0, within1 = 0, worst = 0; const bad = [];
  all.forEach((r, i) => {
    const v = computedMinArr[i];
    const diff = Math.abs(v - printed[i]);
    if (diff === 0) exact++;
    if (diff <= 1) within1++;
    if (diff > worst) { worst = diff; }
    if (diff > 1) bad.push(r.iso + ':' + fmtMin(printed[i]) + ' vs ' + fmtMin(v));
  });
  return { exact, within1, worst, n: all.length, bad: bad.slice(0, 8) };
}

// Component tests. For rule+rounding: computed second-resolution event, add
// offset minutes, then round explicitly.
const minsSunrise = [], minsSunset = [], minsNoon = [];
for (const r of all) {
  const s = solar(r.y, r.m, r.d);
  minsSunrise.push(s.sunrise.getHours() * 60 + s.sunrise.getMinutes() + s.sunrise.getSeconds() / 60);
  minsSunset.push(s.sunset.getHours() * 60 + s.sunset.getMinutes() + s.sunset.getSeconds() / 60);
  minsNoon.push(s.noon.getHours() * 60 + s.noon.getMinutes() + s.noon.getSeconds() / 60);
}
const applyR = (base, offset, mode) => {
  const v = base + offset;
  return mode === 'floor' ? Math.floor(v) : mode === 'ceil' ? (v % 1 > 0 ? Math.ceil(v) : v) : Math.round(v);
};

const tests = {};
// fajr vs PRINTED sunrise - 70 (pure interval check, integer minutes)
{
  const v = all.map((r, i) => minsSunrise[i] * 0 + (r.sunrise - 70));
  tests.fajr_from_printed_sunrise_70 = score(all.map(r => r.fajr), v, 'exact-int');
}
// fajr vs computed sunrise - 70, three rounding modes
for (const mode of ['floor', 'ceil', 'nearest']) {
  const v = all.map((r, i) => applyR(minsSunrise[i], -70, mode));
  tests['fajr_from_computed_sunrise_minus70_' + mode] = score(all.map(r => r.fajr), v, mode);
}
// isha vs printed maghrib + 90
{
  const v = all.map(r => r.magrib + 90);
  tests.isha_from_printed_maghrib_90 = score(all.map(r => r.isha), v, 'exact-int');
}
// maghrib vs computed sunset + 6.7, rounding modes
for (const mode of ['floor', 'ceil', 'nearest']) {
  const v = all.map((r, i) => applyR(minsSunset[i], 6.7, mode));
  tests['maghrib_from_computed_sunset_plus6.7_' + mode] = score(all.map(r => r.magrib), v, mode);
}
// dhuhr vs computed noon + 19, rounding modes
for (const mode of ['floor', 'ceil', 'nearest']) {
  const v = all.map((r, i) => applyR(minsNoon[i], 19, mode));
  tests['dhuhr_from_computed_noon_19_' + mode] = score(all.map(r => r.dhuhr), v, mode);
}
// asr fixed 16:06
{
  let exact = 0; const bad = [];
  all.forEach(r => { if (r.asr === 16 * 60 + 6) exact++; else bad.push(r.iso + ':' + fmtMin(r.asr)); });
  tests.asr_fixed_1606 = { exact, within1: exact + all.filter(r => Math.abs(r.asr - 966) === 1).length, worst: Math.max(...all.map(r => Math.abs(r.asr - 966))), n: all.length, bad };
}

for (const [k, v] of Object.entries(tests)) {
  console.log(k.padEnd(46), 'exact', String(v.exact).padStart(3) + '/' + v.n, ' within1', String(v.within1).padStart(3), ' worst', v.worst, v.bad.length ? ' bad: ' + v.bad.slice(0, 4).join(' ') : '');
}

// Per-edition stability of the best variants
function perEdition(printed, vArr) {
  const out = {};
  for (const ed of ['1445', '1446', '1447']) {
    let exact = 0, n = 0, worst = 0;
    all.forEach((r, i) => {
      if (r.ed !== ed) return;
      n++; const diff = Math.abs(vArr[i] - printed[i]);
      if (diff === 0) exact++;
      if (diff > worst) worst = diff;
    });
    out[ed] = { exact, n, worst };
  }
  return out;
}
const stability = {
  fajr_printed_sunrise_minus70: perEdition(all.map(r => r.fajr), all.map(r => r.sunrise - 70)),
  isha_printed_maghrib_90: perEdition(all.map(r => r.isha), all.map(r => r.magrib + 90)),
  'maghrib_sunset_6.7_nearest': perEdition(all.map(r => r.magrib), all.map((r, i) => Math.round(minsSunset[i] + 6.7))),
  'maghrib_sunset_6.7_floor': perEdition(all.map(r => r.magrib), all.map((r, i) => Math.floor(minsSunset[i] + 6.7))),
  dhuhr_noon_19_nearest: perEdition(all.map(r => r.dhuhr), all.map((r, i) => Math.round(minsNoon[i] + 19))),
  dhuhr_noon_19_floor: perEdition(all.map(r => r.dhuhr), all.map((r, i) => Math.floor(minsNoon[i] + 19))),
  fajr_computed_sunrise_minus70_nearest: perEdition(all.map(r => r.fajr), all.map((r, i) => Math.round(minsSunrise[i] - 70))),
  asr_fixed: perEdition(all.map(r => r.asr), all.map(() => 966)),
};
console.log('\nper-edition stability:');
Object.entries(stability).forEach(([k, v]) => console.log('  ' + k.padEnd(42), Object.entries(v).map(([e, s]) => e + ': ' + s.exact + '/' + s.n + ' (worst ' + s.worst + ')').join('  ')));

// suhoor relation (1447 only, 31 rows): printed suhoor vs printed fajr
const suh = JSON.parse(fs.readFileSync(DIR + FILES['1447'], 'utf8'))._suhoor;
const suhStats = { m20: 0, m21: 0, other: {} };
for (const [iso, t] of Object.entries(suh)) {
  const f = editions['1447'].rows[iso].fajr;
  const dmin = parseHHMM(f) - parseHHMM(t);
  if (dmin === 20) suhStats.m20++; else if (dmin === 21) suhStats.m21++; else suhStats.other[iso] = dmin;
}
console.log('\nsuhoor = fajr - 20:', suhStats.m20, ' -21:', suhStats.m21, ' other:', JSON.stringify(suhStats.other));

// asr: astronomical check (Shafi, adhan) and value histogram per edition.
const pAsr = new adhan.CalculationParameters('Other', 18, 18);
pAsr.rounding = adhan.Rounding.None;
let asrAstro = 0;
const badAsr = [];
for (const r of all) {
  const t = new adhan.PrayerTimes(c, new Date(r.y, r.m - 1, r.d), pAsr);
  if (Math.abs(p2m(t.asr, 'nearest') - r.asr) <= 1) asrAstro++;
  else badAsr.push(r.iso);
}
const asrHist = {};
for (const ed of ['1445', '1446', '1447']) {
  asrHist[ed] = {};
  all.filter(r => r.ed === ed).forEach(r => { const k = fmtMin(r.asr); asrHist[ed][k] = (asrHist[ed][k] || 0) + 1; });
}
console.log('asr vs computed Shafi (nearest, within-1):', asrAstro + '/' + all.length);
console.log('asr histogram per edition:', JSON.stringify(asrHist));

// maghrib offset drift per edition: sweep sunset+off at -0.833 deg.
const maghribDrift = {};
for (const ed of ['1445', '1446', '1447']) {
  const rows = all.filter(r => r.ed === ed);
  const sunset = rows.map(r => {
    const st = new adhan.SolarTime(new Date(r.y, r.m - 1, r.d), c);
    const dt = new adhan.TimeComponents(st.sunset).utcDate(r.y, r.m - 1, r.d);
    return dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  });
  let best = [];
  for (let o = 1; o <= 10; o += 0.5) for (const mode of ['floor', 'ceil', 'nearest']) {
    let x = 0;
    rows.forEach((r, i) => {
      const v = sunset[i] + o;
      const w = mode === 'floor' ? Math.floor(v) : mode === 'ceil' ? Math.ceil(v) : Math.round(v);
      if (w === r.magrib) x++;
    });
    best.push([x, o, mode]);
  }
  best.sort((a, b) => b[0] - a[0]);
  maghribDrift[ed] = best.slice(0, 2).map(b => ({ offset: b[1], mode: b[2], exact: b[0], n: rows.length }));
}
console.log('maghrib drift per edition (sunset-0.833 + off):', JSON.stringify(maghribDrift));

// city offsets, verbatim from the three editions
const cityOffsets = Object.fromEntries(Object.entries(editions).map(([k, e]) => [k, e.offsets]));

const out = {
  country: 'tw', publisher: 'Chinese Muslim Association ROC (CMA)',
  coords: { lat: 25.0330, lon: 121.5654 }, tz: 'Asia/Taipei',
  editions: Object.fromEntries(Object.entries(editions).map(([k, e]) => [k, { source: e.source, rows: Object.keys(e.rows).length }])),
  n_rows: all.length,
  rule_tests: tests,
  per_edition_stability: stability,
  asr_analysis: { vs_computed_shafi_within1: asrAstro + '/' + all.length, histogram_per_edition: asrHist, reading: 'asr is quasi-fixed, stepping 16:05 -> 16:06 -> 16:07 across the Ramadan window; NOT astronomical (computed Shafi is ~40 min earlier); the stated fixed 16:06 holds within +-1 for 43/44' },
  maghrib_drift_per_edition: maghribDrift,
  maghrib_drift_reading: 'maghrib allowance over astronomical sunset (-0.833 deg) moved from ~+4.5/+5 (1445, 1446) to ~+6/+6.5 (1447): the +6.7 rule describes 1447 only and is NOT edition-stable',
  anomalies: { '2026-03-04': 'dhuhr printed 12:23 (3 min step in the publisher column); fajr printed 05:04 both 03-04 and 03-05 so fajr vs sunrise -70 misses by 1 on 03-05', '2026-02-20': 'asr printed 16:07 inside the 16:06 block', '2025-03-29': 'maghrib prints +8 over sunset and isha = maghrib + 88, not +90', '2024-04-09': 'asr printed 16:04, 2 min under the quasi-fixed value' },
  suhoor_relation: suhStats,
  city_offsets_minutes: cityOffsets,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('wrote', OUT);
