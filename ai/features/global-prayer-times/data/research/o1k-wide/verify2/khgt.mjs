// Job 2: the Muhammadiyah KHGT decade recipe at the north-west anchor.
// Recipe from deep3 job 1: fajr 18.0 ceil + 1, isha 18.0 ceil + 1.
import {
  params, rawMinutes, round, parseHHMM, readJson, emptyScore, addScore, finishScore,
  bestCell, monthlyMean, pct, tzOffsetSeconds,
} from './lib.mjs';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ADHAN_DIR = `${process.env.HOME}/athan-gitree/census/adhan-build/node_modules/adhan`;
const A = require(ADHAN_DIR);
const SolarTime = require(`${ADHAN_DIR}/lib/cjs/SolarTime.js`).default;

const ROOT = `${process.env.HOME}/athan-gitree/census/o1k-wide`;
const OUT = `${ROOT}/verify2`;
const TZ = 'Asia/Jakarta';
const COLS = ['fajr', 'isha'];

const DATASET_COORD = { lat: 5.558704, lng: 95.327713 };
const BRIEF_COORD = { lat: 5.5483, lng: 95.3238 };

const p18 = params({ fajrAngle: 18, ishaAngle: 18 });

function loadYear(year) {
  const d = readJson(`${ROOT}/sea2/data/khgt-${year}-banda-aceh.json`);
  return { meta: d.meta, coord: { lat: d.lat, lng: d.lng }, rows: d.rows };
}

function depression(decl, lat, hoursFromNoon) {
  const rad = Math.PI / 180;
  const H = hoursFromNoon * 15 * rad;
  const d = decl * rad, L = lat * rad;
  const sinAlt = Math.sin(L) * Math.sin(d) + Math.cos(L) * Math.cos(d) * Math.cos(H);
  return -Math.asin(Math.max(-1, Math.min(1, sinAlt))) / rad;
}

const result = { job: 'khgt-nw-anchor', recipe: null, coordinateUsed: DATASET_COORD, years: {}, structure: {} };

// ---- recipe score at the surface's own coordinate ----
for (const year of [2026, 2027]) {
  const { coord, rows } = loadYear(year);
  const dates = Object.keys(rows).sort();
  const s = { fajr: emptyScore(), isha: emptyScore() };
  const implied = { fajr: [], isha: [] };
  const printed = { fajr: [], isha: [] };
  let imsakViolations = 0;
  for (const key of dates) {
    const r = rows[key];
    const [y, m, d] = key.split('-').map(Number);
    if (parseHHMM(r.imsak) !== parseHHMM(r.fajr) - 10) imsakViolations += 1;
    const raw = rawMinutes(coord, [y, m, d], TZ, p18);
    addScore(s.fajr, round(raw.fajr + 1, 'ceil'), parseHHMM(r.fajr));
    addScore(s.isha, round(raw.isha + 1, 'ceil'), parseHHMM(r.isha));
    printed.fajr.push(parseHHMM(r.fajr));
    printed.isha.push(parseHHMM(r.isha));
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    const st = new SolarTime(date, new A.Coordinates(coord.lat, coord.lng));
    const noon = (st.transit + tzOffsetSeconds(date, TZ) / 3600) * 60;
    implied.fajr.push(depression(st.solar.declination, coord.lat, (parseHHMM(r.fajr) - noon) / 60));
    implied.isha.push(depression(st.solar.declination, coord.lat, (parseHHMM(r.isha) - noon) / 60));
  }
  const monthFajr = monthlyMean(printed.fajr, dates);
  const med = (v) => { const q = v.slice().sort((a, b) => a - b); return Number(q[Math.floor(q.length / 2)].toFixed(2)); };
  const jan = monthFajr['2026-01'] ?? monthFajr['2027-01'];
  const jul = monthFajr['2026-07'] ?? monthFajr['2027-07'];
  const window = (col) => {
    let lo = -Infinity, hi = Infinity;
    for (const key of dates) {
      const [y, m, d] = key.split('-').map(Number);
      const raw = rawMinutes(coord, [y, m, d], TZ, p18);
      const t = parseHHMM(rows[key][col]);
      const x = raw[col];
      lo = Math.max(lo, t - 1 - x);
      hi = Math.min(hi, t - x);
    }
    return { lo: Number(lo.toFixed(3)), hi: Number(hi.toFixed(3)), width: Number((hi - lo).toFixed(3)) };
  };
  result.years[year] = {
    ceilMarginWindow: { fajr: window('fajr'), isha: window('isha') },
    rows: dates.length,
    span: `${dates[0]}..${dates[dates.length - 1]}`,
    fajr: finishScore(s.fajr),
    isha: finishScore(s.isha),
    imsakEqualsFajrMinus10: { violations: imsakViolations, n: dates.length },
    impliedFajrDepth: { median: med(implied.fajr), p05: Number(implied.fajr.slice().sort((a, b) => a - b)[Math.floor(dates.length * 0.05)].toFixed(2)) },
    impliedIshaDepth: { median: med(implied.isha) },
    fajrJanMean: jan, fajrJulMean: jul, fajrJanJulSpanMin: jan && jul ? Math.abs(jan - jul) : null,
  };
}

// ---- the same recipe at the briefed coordinate (sensitivity) ----
{
  const sens = {};
  for (const year of [2026, 2027]) {
    const { rows } = loadYear(year);
    const s = { fajr: emptyScore(), isha: emptyScore() };
    for (const key of Object.keys(rows).sort()) {
      const [y, m, d] = key.split('-').map(Number);
      const raw = rawMinutes(BRIEF_COORD, [y, m, d], TZ, p18);
      addScore(s.fajr, round(raw.fajr + 1, 'ceil'), parseHHMM(rows[key].fajr));
      addScore(s.isha, round(raw.isha + 1, 'ceil'), parseHHMM(rows[key].isha));
    }
    sens[year] = { fajr: finishScore(s.fajr), isha: finishScore(s.isha) };
  }
  result.briefedCoordinateSensitivity = { coordinate: BRIEF_COORD, years: sens };
}

// ---- the rest of the table: what the unchanged recipe needs per column ----
{
  const cells = {};
  for (const col of ['sunrise', 'dhuhr', 'asr', 'magrib']) {
    const prev = [], act = [], years = [];
    for (const year of [2026, 2027]) {
      const { rows, coord } = loadYear(year);
      for (const key of Object.keys(rows).sort()) {
        const [y, m, d] = key.split('-').map(Number);
        const raw = rawMinutes(coord, [y, m, d], TZ, p18);
        prev.push(col === 'magrib' ? raw.maghrib : raw[col]);
        act.push(parseHHMM(rows[key][col]));
        years.push(key);
      }
    }
    const best = bestCell(prev, act, { margins: [0, 1, 2, 3] });
    const byYear = {};
    for (const year of [2026, 2027]) {
      const idx = years.map((k, i) => [k, i]).filter(([k]) => k.startsWith(String(year))).map(([, i]) => i);
      const s = emptyScore();
      for (const i of idx) addScore(s, round(prev[i] + best.margin, best.rounding), act[i]);
      byYear[year] = finishScore(s);
    }
    cells[col] = { best: { rounding: best.rounding, margin: best.margin, score: best.score }, byYear };
  }
  result.structure.otherColumns = cells;
}

result.recipe = {
  source: 'deep3 REPORT job 1 (Muhammadiyah KHGT, 2025-2035)',
  fajrDeg: 18.0,
  ishaDeg: 18.0,
  rounding: 'ceil to the minute, plus one minute',
  asr: 'Shafi',
  highLatitude: 'not engaged at 5.5 N',
};

writeFileSync(`${OUT}/khgt-aceh.json`, JSON.stringify(result, null, 1) + '\n');

for (const [y, v] of Object.entries(result.years)) {
  console.log(`${y} n=${v.rows} fajr exact ${v.fajr.exactPct}% w1 ${v.fajr.within1Pct}% mae ${v.fajr.mae} worst ${v.fajr.worst}` +
    ` | isha exact ${v.isha.exactPct}% w1 ${v.isha.within1Pct}% mae ${v.isha.mae} worst ${v.isha.worst}` +
    ` | imsak viol ${v.imsakEqualsFajrMinus10.violations} | implied ${v.impliedFajrDepth.median}/${v.impliedIshaDepth.median}` +
    ` | jan ${v.fajrJanMean} jul ${v.fajrJulMean}`);
}
console.log('briefed coord', JSON.stringify(result.briefedCoordinateSensitivity.years));
console.log('other columns', Object.fromEntries(Object.entries(result.structure.otherColumns).map(([k, v]) => [k, `${v.best.rounding}${v.best.margin >= 0 ? '+' : ''}${v.best.margin} w1 ${v.best.score.within1Pct} mae ${v.best.score.mae}`])));
