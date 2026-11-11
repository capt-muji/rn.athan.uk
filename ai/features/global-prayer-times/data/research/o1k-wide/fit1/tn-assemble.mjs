// Job 2 assembly: recompute the small unlogged pieces and emit tn-fit.json.
// Run: TZ=Africa/Tunis node tn-assemble.mjs
import fs from 'node:fs';
import { loadAdhan, parseHHMM, evalFixed } from './lib.mjs';

const HOME = process.env.HOME;
const adhan = await loadAdhan();
const FIELDS = ['fajr', 'dhuhr', 'asr', 'magrib', 'isha'];
const PT_NAME = { fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr', magrib: 'maghrib', isha: 'isha' };
const secOf = (x) => x.getHours() * 3600 + x.getMinutes() * 60 + x.getSeconds();

function loadYear(y) {
  const rows = JSON.parse(fs.readFileSync(`${HOME}/athan-gitree/census/o1k-wide/northafrica2/data/tn-inm-tunis-${y}.json`, 'utf8'));
  return Object.keys(rows).sort().map((key) => {
    const [yy, m, d] = key.split('-').map(Number);
    return { key, date: new Date(yy, m - 1, d), chart: Object.fromEntries(FIELDS.map((f) => [f, parseHHMM(rows[key][f])])) };
  });
}
const years = { 2024: loadYear(2024), 2025: loadYear(2025) };

let identical = 0, shared = 0;
{
  const a = new Map(years[2024].map((s) => [s.key.slice(5), JSON.stringify(FIELDS.map((f) => s.chart[f]))]));
  const b = new Map(years[2025].map((s) => [s.key.slice(5), JSON.stringify(FIELDS.map((f) => s.chart[f]))]));
  for (const [md, v] of a) if (b.has(md)) { shared++; if (b.get(md) === v) identical++; }
}

function heldStats(slots, lat, lng, magribMode = 'nearest') {
  const params = new adhan.CalculationParameters(null, 18, 18);
  params.rounding = 'none';
  params.madhab = 'shafi';
  const coords = new adhan.Coordinates(lat, lng);
  const sec = {};
  for (const f of FIELDS) sec[f] = new Float64Array(slots.length);
  for (let i = 0; i < slots.length; i++) {
    const pt = new adhan.PrayerTimes(coords, slots[i].date, params);
    for (const f of FIELDS) sec[f][i] = secOf(pt[PT_NAME[f]]);
  }
  const MARGIN = { fajr: 0, dhuhr: 7, asr: 0, magrib: 2, isha: 0 };
  const MODE = { fajr: 'floor', dhuhr: 'nearest', asr: 'nearest', magrib: magribMode, isha: 'ceil' };
  const per = {};
  for (const f of FIELDS) per[f] = evalFixed(sec[f], Int32Array.from(slots, (s) => s.chart[f]), MARGIN[f], MODE[f]);
  return per;
}

const held = { asis: {}, maghribCeil: {} };
for (const y of [2024, 2025]) held.asis[y] = heldStats(years[y], 36.8, 10.18);
for (const y of [2024, 2025]) held.maghribCeil[y] = heldStats(years[y], 36.8, 10.18, 'ceil');

const today = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/northafrica2/data/tn-inm-today-2026-11-10.json', 'utf8'))['2026-11-10'];
const cities = {};
for (const [city, c] of Object.entries(today)) {
  const slot = [{ key: '2026-11-10', date: new Date(2026, 10, 10), chart: Object.fromEntries(FIELDS.map((f) => [f, parseHHMM(c[f])])) }];
  cities[city] = { lat: Number(c.lat.trim()), lng: Number(c.lng.trim()), asis: heldStats(slot, Number(c.lat.trim()), Number(c.lng.trim()), 'nearest'), maghribCeil: heldStats(slot, Number(c.lat.trim()), Number(c.lng.trim()), 'ceil') };
}

const grid = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/fit1/tn-grid.json', 'utf8'));
const fit = {
  meta: { place: 'Tunis', lat: 36.8, lng: 10.18, tz: 'Africa/Tunis', adhan: '4.4.6', data: ['tn-inm-tunis-2024.json (366)', 'tn-inm-tunis-2025.json (365)', 'tn-inm-today-2026-11-10.json (4 cities)'] },
  grid: { fajr: '15-21@0.05', isha: '14-21@0.05', margins: '-10..+10@0.5', modes: ['floor', 'ceil', 'nearest'], asr: 'both schools' },
  perYear: {
    2024: { fajr: grid.bestPer['2024'].bf, fajrAngle: grid.bestPer['2024'].fa, isha: grid.bestPer['2024'].bi, ishaAngle: grid.bestPer['2024'].is, angleIndependent: { dhuhr: { margin: 7.5, mode: 'floor', exact: 323, within1: 366, worst: 1 }, magrib: { margin: 3, mode: 'floor', exact: 349, within1: 366, worst: 1 }, asrShafi: { margin: 0, mode: 'floor', exact: 150, within1: 303, worst: 2 } } },
    2025: { fajr: grid.bestPer['2025'].bf, fajrAngle: grid.bestPer['2025'].fa, isha: grid.bestPer['2025'].bi, ishaAngle: grid.bestPer['2025'].is, angleIndependent: { dhuhr: { margin: 7.5, mode: 'floor', exact: 338, within1: 365, worst: 1 }, magrib: { margin: 3, mode: 'floor', exact: 343, within1: 365, worst: 1 }, asrShafi: { margin: 0, mode: 'floor', exact: 145, within1: 298, worst: 2 } } },
  },
  jointFrozen: {
    fajr: { angle: grid.bestJoint.fa, ...grid.bestJoint.f }, isha: { angle: grid.bestJoint.is, ...grid.bestJoint.i },
    dhuhr: { margin: 7.5, mode: 'floor', exact: 661, within1: 731, worst: 1 },
    magrib: { margin: 3, mode: 'floor', exact: 692, within1: 731, worst: 1 },
    asrShafi: { margin: 0, mode: 'floor', exact: 295, within1: 601, worst: 2 },
    note: 'joint frozen sums equal the per-year optima summed (fajr+isha 707+708=1415; dhuhr 323+338=661; magrib 349+343=692): no parameter shift between years',
  },
  heldObject: {
    recipe: '18/18, dhuhr +7, maghrib +2, fajr FLOOR, isha CEIL; unspecified roundings read as nearest (as-is)',
    asis: held.asis,
    refinement: { maghribMode: 'ceil', result: held.maghribCeil, note: 'maghrib +2 CEIL = 345/366 and 345/365 exact (grid best +3 floor differs only on exact-minute rows); dhuhr +7 nearest already optimal (floor(x+7.5) == nearest(x+7))' },
  },
  printedRowOverlap: { sharedMonthDay: shared, identical: identical, note: '2025 is a recomputation, not a reprint of 2024' },
  cities2026Today: cities,
  verdict: 'one recipe serves both years with parameters frozen: fajr/isha 18 deg (grid optimum 18.10 with +0.5-floor print convention, indistinguishable from the held 18/18), dhuhr +7 nearest, maghrib +2 ceil, asr Shafi 0 (weakest column, worst 2). No angle or margin shift 2024 -> 2025.',
};
fs.writeFileSync(HOME + '/athan-gitree/census/o1k-wide/fit1/tn-fit.json', JSON.stringify(fit, null, 1));
console.log('wrote tn-fit.json; identical rows', identical, '/', shared);
