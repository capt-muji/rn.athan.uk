// Job 1: the Saudi recipe at four cities. Recipe taken verbatim from deep1 job 3.
import {
  params, rawMinutes, round, parseHHMM, readJson, emptyScore, addScore, finishScore,
  hijriMonthUmq, bestCell, monthlyMean, hhmm, pct, tzOffsetSeconds,
} from './lib.mjs';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ADHAN_DIR = `${process.env.HOME}/athan-gitree/census/adhan-build/node_modules/adhan`;
const A = require(ADHAN_DIR);
const SolarTime = require(`${ADHAN_DIR}/lib/cjs/SolarTime.js`).default;

const ROOT = `${process.env.HOME}/athan-gitree/census`;
const OUT = `${process.env.HOME}/athan-gitree/census/o1k-wide/verify2`;
const TZ = 'Asia/Riyadh';
const FAJR_ANGLE = 18.5;
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const CITIES = {
  makkah: { lat: 21.4267, lng: 39.8317, files: ['1448_21-4267_39-8317', '1449_21-4267_39-8317'], dir: `${ROOT}/s1-saudi` },
  riyadh: { lat: 24.7136, lng: 46.6753, files: ['1448_24-7136_46-6753', '1449_24-7136_46-6753'], dir: `${ROOT}/s1-saudi` },
  medina: { lat: 24.4672, lng: 39.6111, raw: ['sa-umq-medina-1448', 'sa-umq-medina-1449'], norm: 'sa-medina-1448-1449' },
  jeddah: { lat: 21.4858, lng: 39.1925, raw: ['sa-umq-jeddah-1448', 'sa-umq-jeddah-1449'], norm: 'sa-jeddah-1448-1449' },
};

function loadRows(city, name) {
  if (city.dir) {
    const rows = [];
    for (const f of city.files) {
      for (const r of readJson(`${city.dir}/${f}.json`)) rows.push(r);
    }
    return rows;
  }
  const rows = [];
  for (const f of city.raw) {
    for (const r of readJson(`${ROOT}/o1k-wide/gulf2/captures/${f}.json`)) rows.push(r);
  }
  // the normalized file must agree with the raw captures, else the bank is suspect
  const norm = readJson(`${ROOT}/o1k-wide/gulf2/data/${city.norm}.json`);
  const keys = Object.keys(norm);
  if (keys.length !== rows.length) throw new Error(`${name}: normalized ${keys.length} rows vs raw ${rows.length}`);
  const NORM_KEY = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' };
  let diff = 0;
  for (const r of rows) {
    const k = r.date.slice(0, 10);
    for (const c of COLS) {
      const a = parseHHMM(norm[k][NORM_KEY[c]]);
      const b = parseHHMM(r.prayerTimes[c]);
      if (a !== b) diff += 1;
    }
  }
  if (diff) throw new Error(`${name}: normalized/raw disagreement on ${diff} cells`);
  return rows;
}

function solarNoonLocal(coords, date, tz) {
  const st = new SolarTime(date, new A.Coordinates(coords.lat, coords.lng));
  return st.transit + tzOffsetSeconds(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)), tz) / 3600;
}

function depression(decl, lat, hoursFromNoon) {
  const rad = Math.PI / 180;
  const H = hoursFromNoon * 15 * rad;
  const d = decl * rad, L = lat * rad;
  const sinAlt = Math.sin(L) * Math.sin(d) + Math.cos(L) * Math.cos(d) * Math.cos(H);
  return -Math.asin(Math.max(-1, Math.min(1, sinAlt))) / rad;
}

const pNoIsha = params({ fajrAngle: FAJR_ANGLE, ishaAngle: 18 });
const result = { job: 'saudi-off-anchor', recipe: null, cities: {}, hijriCheck: null };

const hijriAgree = { checked: 0, agree: 0, examples: [] };
let pooledAngle = [];

for (const [name, city] of Object.entries(CITIES)) {
  const rows = loadRows(city, name);
  rows.sort((a, b) => a.date.localeCompare(b.date));
  const perYear = {};
  const scoreA = {}, scoreB = {};
  for (const c of COLS) { scoreA[c] = emptyScore(); scoreB[c] = emptyScore(); }
  const depressions = [];
  const fajrPrinted = [];
  const dates = [];
  const days = { 90: 0, 120: 0, other: 0 };
  let ivMismatch = 0;

  for (const r of rows) {
    const key = r.date.slice(0, 10);
    const [y, m, d] = key.split('-').map(Number);
    const tgt = {};
    for (const c of COLS) tgt[c] = parseHHMM(r.prayerTimes[c]);
    const iv = r.hijriDate.month === 9 ? 120 : 90;
    const printedIv = ((tgt.isha - tgt.maghrib) % 1440 + 1440) % 1440;
    if (printedIv === 90) days[90] += 1; else if (printedIv === 120) days[120] += 1; else days.other += 1;
    if (printedIv !== iv) ivMismatch += 1;

    const raw = rawMinutes(city, [y, m, d], TZ, pNoIsha);
    const pred = {
      fajr: round(raw.fajr + 1, 'floor'),
      sunrise: round(raw.sunrise, 'floor'),
      dhuhr: round(raw.dhuhr + 1, 'floor'),
      asr: round(raw.asr + 1, 'floor'),
      maghrib: round(raw.maghrib + 1, 'floor'),
      isha: round(raw.sunset + iv + 1, 'floor'), // interval applied to the raw sunset
    };
    const predB = { ...pred, isha: pred.maghrib + iv }; // interval applied to the printed maghrib

    const yr = String(r.hijriDate.year);
    perYear[yr] = perYear[yr] || {};
    for (const c of COLS) {
      perYear[yr][c] = perYear[yr][c] || emptyScore();
      addScore(scoreA[c], pred[c], tgt[c]);
      addScore(perYear[yr][c], pred[c], tgt[c]);
      addScore(scoreB[c], predB[c], tgt[c]);
    }

    const date = new Date(Date.UTC(y, m - 1, d, 12));
    const st = new SolarTime(date, new A.Coordinates(city.lat, city.lng));
    const noon = st.transit + tzOffsetSeconds(date, TZ) / 3600;
    depressions.push(depression(st.solar.declination, city.lat, (tgt.fajr - noon * 60) / 60));
    fajrPrinted.push(tgt.fajr);
    dates.push(key);

    const hm = hijriMonthUmq(key);
    hijriAgree.checked += 1;
    if (hm.month === r.hijriDate.month) hijriAgree.agree += 1;
    else if (hijriAgree.examples.length < 3) hijriAgree.examples.push({ key, capture: r.hijriDate.month, intl: hm.month });
  }

  // knife-edge margin window at floor: floor(x+m)=t for every day
  const window = (col, xOf) => {
    const req = [];
    for (const r of rows) {
      const key = r.date.slice(0, 10);
      const [y, m, d] = key.split('-').map(Number);
      const raw = rawMinutes(city, [y, m, d], TZ, pNoIsha);
      const iv = r.hijriDate.month === 9 ? 120 : 90;
      req.push(parseHHMM(r.prayerTimes[col]) - xOf(raw, iv));
    }
    const lo = Math.max(...req);
    req.sort((a, b) => a - b);
    const hi = Math.min(...req.map((v) => v + 1));
    const q = (f) => Number(req[Math.floor((req.length - 1) * f)].toFixed(2));
    return { medianLowEndpoint: q(0.5), p05: q(0.05), p95: q(0.95), exactWindowWidth: Number((hi - lo).toFixed(2)) };
  };
  const windows = {
    fajr: window('fajr', (raw) => raw.fajr),
    sunrise: window('sunrise', (raw) => raw.sunrise),
    dhuhr: window('dhuhr', (raw) => raw.dhuhr),
    asr: window('asr', (raw) => raw.asr),
    maghrib: window('maghrib', (raw) => raw.maghrib),
    isha: window('isha', (raw, iv) => raw.sunset + iv),
  };

  const sorted = depressions.slice().sort((a, b) => a - b);
  const monthly = monthlyMean(fajrPrinted, dates);
  const monthVals = Object.values(monthly);
  const jan = Object.entries(monthly).filter(([k]) => k.endsWith('-01')).map(([, v]) => v);
  const jul = Object.entries(monthly).filter(([k]) => k.endsWith('-07')).map(([, v]) => v);
  const janMean = jan.reduce((a, b) => a + b, 0) / jan.length;
  const julMean = jul.reduce((a, b) => a + b, 0) / jul.length;
  const pooled = { n: 0, exact: 0, within1: 0 };
  for (const c of COLS) {
    const f = finishScore(scoreA[c]);
    pooled.n += f.n; pooled.exact += f.exact; pooled.within1 += f.within1;
  }

  result.cities[name] = {
    coordinate: { lat: city.lat, lng: city.lng },
    rows: rows.length,
    span: `${dates[0]}..${dates[dates.length - 1]}`,
    intervalHistogram: days,
    intervalMismatch: ivMismatch,
    requiredFloorMargin: windows,
    pooled: { cells: pooled.n, exact: pooled.exact, exactPct: pct(pooled.exact, pooled.n), within1Pct: pct(pooled.within1, pooled.n) },
    recipeRaw: Object.fromEntries(COLS.map((c) => [c, finishScore(scoreA[c])])),
    recipePrintedMaghrib: { isha: finishScore(scoreB.isha) },
    perYear: Object.fromEntries(Object.entries(perYear).map(([y, cols]) => [y,
      { n: cols.fajr.n, within1: Object.fromEntries(COLS.map((c) => [c, finishScore(cols[c]).within1Pct])),
        exact: Object.fromEntries(COLS.map((c) => [c, finishScore(cols[c]).exactPct])) }])),
    impliedFajrDepth: {
      median: Number(sorted[Math.floor(sorted.length / 2)].toFixed(2)),
      p05: Number(sorted[Math.floor(sorted.length * 0.05)].toFixed(2)),
      p95: Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(2)),
    },
    fajrJanMean: Number(janMean.toFixed(1)),
    fajrJulMean: Number(julMean.toFixed(1)),
    fajrJanJulSpanMin: Number(Math.abs(janMean - julMean).toFixed(0)),
    fajrAnnualSwingMin: Number((Math.max(...monthVals) - Math.min(...monthVals)).toFixed(0)),
  };
  pooledAngle.push({ city: name, median: result.cities[name].impliedFajrDepth.median });
}

// free grid refit of the fajr angle alone, per city, to expose any pull away from 18.5
for (const [name, city] of Object.entries(CITIES)) {
  const rows = loadRows(city, name);
  let best = null;
  for (let angle = 18.0; angle <= 19.001; angle += 0.01) {
    const p = params({ fajrAngle: Number(angle.toFixed(2)), ishaAngle: 18 });
    const s = emptyScore();
    for (const r of rows) {
      const key = r.date.slice(0, 10);
      const [y, m, d] = key.split('-').map(Number);
      const raw = rawMinutes(city, [y, m, d], TZ, p);
      addScore(s, round(raw.fajr + 1, 'floor'), parseHHMM(r.prayerTimes.fajr));
    }
    const f = finishScore(s);
    if (!best || f.mae < best.score.mae || (f.mae === best.score.mae && f.exact > best.score.exact)) {
      best = { angle: Number(angle.toFixed(2)), score: f };
    }
  }
  result.cities[name].freeFajrFit = best;
}

result.hijriCheck = { surface: 'Intl islamic-umalqura vs capture hijriDate.month', ...hijriAgree, agreePct: pct(hijriAgree.agree, hijriAgree.checked) };
result.recipe = {
  source: 'deep1 REPORT job 3 (Saudi, Hijri 1450-1500)',
  fajrAngle: 18.5,
  asr: 'Shafi',
  highLatitude: 'MiddleOfTheNight',
  rounding: 'fajr, dhuhr, asr, maghrib = floor(raw + 1); sunrise = floor(raw)',
  isha: 'maghrib + 90, + 120 on the capture hijriDate.month 9',
};

writeFileSync(`${OUT}/sa-cities.json`, JSON.stringify(result, null, 1) + '\n');

// console summary
for (const [name, c] of Object.entries(result.cities)) {
  const r = c.recipeRaw;
  console.log(
    `${name.padEnd(7)} n=${c.rows} fajr w1 ${r.fajr.within1Pct}% exact ${r.fajr.exactPct}% mae ${r.fajr.mae}` +
    ` | isha w1 ${r.isha.within1Pct}% exact ${r.isha.exactPct}% mae ${r.isha.mae}` +
    ` | worst ${Math.max(...COLS.map((x) => r[x].worst))} | implied ${c.impliedFajrDepth.median}` +
    ` | freeFit ${c.freeFajrFit.angle} (mae ${c.freeFajrFit.score.mae})`);
}
console.log("hijri", result.hijriCheck);
