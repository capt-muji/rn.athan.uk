// Job 1 grid: Islamabad Nizam-e-Salat 2026-keyed perpetual chart.
// Free fit: fajr 15-21 x isha 14-21 (0.05) x margins (-10..+10 x 0.5) x
// rounding (floor/ceil/nearest per prayer) x asr school (both).
// Run: TZ=Asia/Karachi node pk-grid.mjs [probe]
import fs from 'node:fs';
import { loadAdhan, p2m, parseHHMM, bestMargin, evalFixed, scoreLine, marginOf } from './lib.mjs';

const HOME = process.env.HOME;
const DATA = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/southasia/data/pk-islamabad-nizam-2026.json', 'utf8'));
const LAT = 33.6844, LNG = 73.0479;

const adhan = await loadAdhan();
const coords = new adhan.Coordinates(LAT, LNG);

// Chart columns (athan columns of the 11-column chart):
// fajr(c1) sunrise(c3) dhuhr(c4) asr(c6) maghrib(c9) isha(c10).
const PM = { fajr: false, sunrise: false, dhuhr: true, asr: true, magrib: true, isha: true };

// Perpetual template keyed onto 2026; slot 2026-02-29 has no 2026 instant.
// Primary assignment: next leap year (2028-02-29), alternates kept for verify.
const keys = Object.keys(DATA._rows).sort();
const slots = keys.map((key) => {
  const [y, m, d] = key.split('-').map(Number);
  let date;
  if (y === 2026 && m === 2 && d === 29) date = new Date(2028, 1, 29);
  else date = new Date(y, m - 1, d);
  const chart = {};
  for (const [p, pm] of Object.entries(PM)) chart[p] = parseHHMM(DATA._rows[key][p], pm);
  return { key, date, chart };
});

function secOf(date) { return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(); }

const n = slots.length;
const solar = slots.map((s) => new adhan.SolarTime(s.date, coords));
const tc = (hours) => new adhan.TimeComponents(hours);
const instant = (date, hours) => {
  const t = tc(hours).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
  if (isNaN(t.getTime())) throw new Error('NaN time for ' + date);
  return t;
};

// Angle-independent raw seconds (asr both schools).
const rawSunrise = new Float64Array(n), rawDhuhr = new Float64Array(n),
  rawAsrShafi = new Float64Array(n), rawAsrHanafi = new Float64Array(n), rawMaghrib = new Float64Array(n);
for (let i = 0; i < n; i++) {
  const st = solar[i], d = slots[i].date;
  rawSunrise[i] = secOf(instant(d, st.sunrise));
  rawDhuhr[i] = secOf(instant(d, st.transit));
  rawAsrShafi[i] = secOf(instant(d, st.afternoon(1)));
  rawAsrHanafi[i] = secOf(instant(d, st.afternoon(2)));
  rawMaghrib[i] = secOf(instant(d, st.sunset));
}
const chartOf = (p) => Int32Array.from(slots, (s) => s.chart[p]);

// Fast-path cross-check vs full PrayerTimes at second resolution.
if (process.argv[2] === 'probe') {
  const p2s = (x) => x.getHours() * 3600 + x.getMinutes() * 60 + x.getSeconds();
  for (const idx of [0, 60, 172, 180, 273, 364]) {
    for (const madhab of ['shafi', 'hanafi']) {
      const params = new adhan.CalculationParameters(null, 18, 18);
      params.rounding = 'none';
      params.madhab = madhab;
      const p = new adhan.PrayerTimes(coords, slots[idx].date, params);
      const st = solar[idx], d = slots[idx].date;
      const ok = p2s(p.fajr) === secOf(instant(d, st.hourAngle(-18, false)))
        && p2s(p.asr) === secOf(instant(d, st.afternoon(madhab === 'shafi' ? 1 : 2)))
        && p2s(p.maghrib) === rawMaghrib[idx] && p2s(p.sunrise) === rawSunrise[idx];
      console.log(slots[idx].key, madhab, 'fastpath==PrayerTimes:', ok);
      if (!ok) { console.log('  pt', p2s(p.fajr), p2s(p.asr), 'fast', secOf(instant(d, st.hourAngle(-18, false))), secOf(instant(d, st.afternoon(madhab === 'shafi' ? 1 : 2)))); }
    }
  }
}

const angleIndependent = {
  sunrise: bestMargin(rawSunrise, chartOf('sunrise')),
  dhuhr: bestMargin(rawDhuhr, chartOf('dhuhr')),
  asrShafi: bestMargin(rawAsrShafi, chartOf('asr')),
  asrHanafi: bestMargin(rawAsrHanafi, chartOf('asr')),
  maghrib: bestMargin(rawMaghrib, chartOf('magrib')),
};

const fajrSec = new Float64Array(n), ishaSec = new Float64Array(n);
const fChart = chartOf('fajr'), iChart = chartOf('isha');
const A2 = (x) => Math.round(x * 20) / 20; // 0.05 grid exactness
const fajrs = []; for (let a = 15; a <= 21.001; a += 0.05) fajrs.push(A2(a));
const ishas = []; for (let a = 14; a <= 21.001; a += 0.05) ishas.push(A2(a));

let best = null;
const top = [];
let t0 = Date.now();
for (const fa of fajrs) {
  for (let i = 0; i < n; i++) fajrSec[i] = secOf(instant(slots[i].date, solar[i].hourAngle(-fa, false)));
  for (const is of ishas) {
    for (let i = 0; i < n; i++) ishaSec[i] = secOf(instant(slots[i].date, solar[i].hourAngle(-is, true)));
    const bf = bestMargin(fajrSec, fChart);
    const bi = bestMargin(ishaSec, iChart);
    const cand = { fa, is, fExact: bf.exact, iExact: bi.exact, sum: bf.exact + bi.exact, w1: bf.within1 + bi.within1, worst: bf.worst + bi.worst, bf, bi };
    top.push(cand);
    if (!best || cand.sum > best.sum || (cand.sum === best.sum && (cand.w1 > best.w1 || (cand.w1 === best.w1 && cand.worst < best.worst)))) best = cand;
  }
}
top.sort((a, b) => b.sum - a.sum || b.w1 - a.w1 || a.worst - b.worst || b.fa - a.fa);
console.log('grid done in', ((Date.now() - t0) / 1000).toFixed(1), 's; pairs', fajrs.length * ishas.length);

console.log('\n== angle-independent (best margin+mode) ==');
for (const [name, r] of Object.entries(angleIndependent)) console.log(scoreLine(name, r));
console.log('\n== best pair ==');
console.log('fajr', best.fa, 'isha', best.is, 'sumExact', best.sum, 'w1', best.w1);
console.log(scoreLine('fajr', best.bf));
console.log(scoreLine('isha', best.bi));

const out = {
  meta: { chart: DATA._source, lat: LAT, lng: LNG, tz: 'Asia/Karachi', rows: n, feb29Assignment: '2028-02-29 (primary)', grid: { fajr: '15-21@0.05', isha: '14-21@0.05', margins: '-10..+10@0.5', modes: ['floor', 'ceil', 'nearest'], adhan: '4.4.6' } },
  angleIndependent, bestPair: best,
  topPairs: top.slice(0, 40),
};
fs.writeFileSync(HOME + '/athan-gitree/census/o1k-wide/fit1/pk-grid.json', JSON.stringify(out, null, 1));
console.log('wrote pk-grid.json');
