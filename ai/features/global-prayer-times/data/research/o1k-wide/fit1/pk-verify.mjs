// Job 1 verification + diagnostics: rebuild the best recipes through full
// PrayerTimes, canonical-form checks, dhuhr/isha clock analysis, Feb-29 and
// anchor-year tests.
// Run: TZ=Asia/Karachi node pk-verify.mjs
import fs from 'node:fs';
import { loadAdhan, parseHHMM, bestMargin, evalFixed, scoreLine, fmtMin } from './lib.mjs';

const HOME = process.env.HOME;
const DATA = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/southasia/data/pk-islamabad-nizam-2026.json', 'utf8'));
const LAT = 33.6844, LNG = 73.0479;
const adhan = await loadAdhan();
const coords = new adhan.Coordinates(LAT, LNG);
const PM = { fajr: false, sunrise: false, dhuhr: true, asr: true, magrib: true, isha: true };
const keys = Object.keys(DATA._rows).sort();

function buildSlots(year) {
  const leap = (y) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  return keys.map((key) => {
    const [, m, d] = key.split('-').map(Number);
    const y29 = leap(year) ? year : 2028; // template slot has no instant in non-leap years
    const date = (m === 2 && d === 29) ? new Date(y29, 1, 29) : new Date(year, m - 1, d);
    const chart = {};
    for (const [p, pm] of Object.entries(PM)) chart[p] = parseHHMM(DATA._rows[key][p], pm);
    return { key, date, chart };
  });
}
const slots = buildSlots(2026);
const secOf = (x) => x.getHours() * 3600 + x.getMinutes() * 60 + x.getSeconds();
const CHART = {};
for (const p of Object.keys(PM)) CHART[p] = Int32Array.from(slots, (s) => s.chart[p]);

// Raw second-resolution columns via SolarTime fast path (verified == PrayerTimes).
const n = slots.length;
const solar = slots.map((s) => new adhan.SolarTime(s.date, coords));
const instant = (date, hours) => new adhan.TimeComponents(hours).utcDate(date.getFullYear(), date.getMonth(), date.getDate());
const raw = {};
raw.sunrise = Float64Array.from({ length: n }, (_, i) => secOf(instant(slots[i].date, solar[i].sunrise)));
raw.dhuhr = Float64Array.from({ length: n }, (_, i) => secOf(instant(slots[i].date, solar[i].transit)));
raw.asrHanafi = Float64Array.from({ length: n }, (_, i) => secOf(instant(slots[i].date, solar[i].afternoon(2))));
raw.maghrib = Float64Array.from({ length: n }, (_, i) => secOf(instant(slots[i].date, solar[i].sunset)));
raw.isha18 = Float64Array.from({ length: n }, (_, i) => secOf(instant(slots[i].date, solar[i].hourAngle(-18, true))));
raw.fajr18 = Float64Array.from({ length: n }, (_, i) => secOf(instant(slots[i].date, solar[i].hourAngle(-18, false))));

console.log('== canonical-form checks on the computed columns ==');
const checks = {
  'fajr 18.00 -1 nearest': evalFixed(raw.fajr18, CHART.fajr, -1, 'nearest'),
  'fajr 18.00 -0.5 floor': evalFixed(raw.fajr18, CHART.fajr, -0.5, 'floor'),
  'fajr 18.00 0 nearest': evalFixed(raw.fajr18, CHART.fajr, 0, 'nearest'),
  'fajr 18.00 0 floor': evalFixed(raw.fajr18, CHART.fajr, 0, 'floor'),
  'sunrise 0 nearest': evalFixed(raw.sunrise, CHART.sunrise, 0, 'nearest'),
  'sunrise -0.5 floor': evalFixed(raw.sunrise, CHART.sunrise, -0.5, 'floor'),
  'asrH +2 nearest': evalFixed(raw.asrHanafi, CHART.asr, 2, 'nearest'),
  'asrH +2.5 floor': evalFixed(raw.asrHanafi, CHART.asr, 2.5, 'floor'),
  'maghrib +6.5 floor': evalFixed(raw.maghrib, CHART.magrib, 6.5, 'floor'),
  'maghrib +6 nearest': evalFixed(raw.maghrib, CHART.magrib, 6, 'nearest'),
  'maghrib +7 nearest': evalFixed(raw.maghrib, CHART.magrib, 7, 'nearest'),
};
for (const [name, r] of Object.entries(checks)) console.log(scoreLine(name, r));

console.log('\n== full PrayerTimes rebuild of grid-best fajr 17.95 -0.5 floor ==');
{
  const params = new adhan.CalculationParameters(null, 17.95, 18);
  params.rounding = 'none';
  params.madhab = 'hanafi';
  let exact = 0, within1 = 0, worst = 0;
  for (let i = 0; i < n; i++) {
    const pt = new adhan.PrayerTimes(coords, slots[i].date, params);
    const mins = (pt.fajr.getHours() * 3600 + pt.fajr.getMinutes() * 60 + pt.fajr.getSeconds()) / 60 - 0.5;
    const diff = Math.abs(Math.floor(mins) - CHART.fajr[i]);
    exact += diff === 0 ? 1 : 0; within1 += diff <= 1 ? 1 : 0; worst = Math.max(worst, diff);
  }
  console.log(`fajr exact ${exact} within1 ${within1} worst ${worst}`);
}

console.log('\n== dhuhr: printed-value histogram and switch dates ==');
const hist = (p) => {
  const h = {};
  let prev = null;
  for (let i = 0; i < n; i++) {
    const v = CHART[p][i];
    h[v] = (h[v] || 0) + 1;
    if (v !== prev) { console.log('  switch at', slots[i].key, '->', fmtMin(v)); prev = v; }
  }
  return h;
};
const dhuhrHist = hist('dhuhr');
console.log('  dhuhr values:', Object.entries(dhuhrHist).map(([k, v]) => fmtMin(+k) + ' x' + v).join(', '));
console.log('== isha: printed-value histogram and switch dates ==');
const ishaHist = hist('isha');
console.log('  isha values:', Object.entries(ishaHist).map(([k, v]) => fmtMin(+k) + ' x' + v).join(', '));

console.log('\n== dhuhr: wide constant-margin scan (-20..+90) ==');
console.log(scoreLine('dhuhr wide', bestMargin(raw.dhuhr, CHART.dhuhr, { jMin: 0, jMax: 220, m0: -20 })));
console.log('== isha: wide constant-margin scan at 18 deg (-20..+90) ==');
console.log(scoreLine('isha wide', bestMargin(raw.isha18, CHART.isha, { jMin: 0, jMax: 220, m0: -20 })));

console.log('\n== 15-minute clock-snap hypothesis (quarter-round of computed + margin) ==');
function quarterScan(rawSec, chart, name) {
  let best = null;
  for (let mode of ['floor', 'ceil', 'nearest']) {
    for (let m10 = -200; m10 <= 200; m10 += 5) { // -20..+20 in 0.5 steps
      const m = m10 / 10;
      let exact = 0;
      for (let i = 0; i < n; i++) {
        const x = rawSec[i] / 60 + m;
        const q = mode === 'floor' ? Math.floor(x / 15) * 15 : mode === 'ceil' ? Math.ceil(x / 15) * 15 : Math.round(x / 15) * 15;
        if (q === chart[i]) exact++;
      }
      if (!best || exact > best.exact) best = { mode, m, exact };
    }
  }
  console.log(`${name}: best quarter-snap exact ${best.exact}/366 (mode ${best.mode}, margin ${best.m})`);
}
quarterScan(raw.dhuhr, CHART.dhuhr, 'dhuhr');
quarterScan(raw.isha18, CHART.isha, 'isha@18');
quarterScan(raw.fajr18, CHART.fajr, 'fajr@18');

console.log('\n== Feb-29 slot: three assignments, scored on the best recipe ==');
function feb29Score(year, dupFeb28) {
  const idx = keys.indexOf('2026-02-29');
  const date = dupFeb28 ? new Date(2026, 1, 28) : new Date(year, 1, 29);
  const st = new adhan.SolarTime(date, coords);
  const mins = (p) => (secOf(instant(date, p))) / 60;
  const checks29 = {
    fajr: [Math.floor(mins(st.hourAngle(-18, false)) - 1), 'nearest', CHART.fajr[idx]],
    sunrise: [Math.floor(mins(st.sunrise) - 0.5), 'floor', CHART.sunrise[idx]],
    asr: [mins(st.afternoon(2)) + 2.5, 'floor', CHART.asr[idx]],
    maghrib: [mins(st.sunset) + 6.5, 'floor', CHART.magrib[idx]],
  };
  const out = [];
  for (const [p, [x, mode, c]] of Object.entries(checks29)) {
    const v = mode === 'nearest' ? Math.round(x) : Math.floor(x);
    out.push(`${p}:${v === c ? 'exact' : 'diff ' + (v - c)}`);
  }
  console.log(`  ${dupFeb28 ? 'dup of 2026-02-28' : 'computed at ' + year + '-02-29'}: chart ${fmtMin(CHART.fajr[idx])}/${fmtMin(CHART.asr[idx])} -> ${out.join(' ')}`);
}
feb29Score(2028, false); feb29Score(2024, false); feb29Score(2028, true);

console.log('\n== anchor-year test: same MM-DD slots computed at 2024 / 2026 / 2028 ==');
for (const year of [2024, 2026, 2028]) {
  const S = year === 2026 ? slots : buildSlots(year);
  const sol = year === 2026 ? solar : S.map((s) => new adhan.SolarTime(s.date, coords));
  const chartA = Int32Array.from(S, (s) => s.chart.fajr);
  const f18 = Float64Array.from(S, (s, i) => secOf(instant(s.date, sol[i].hourAngle(-18, false))));
  const r = bestMargin(f18, chartA);
  console.log(`${year}: fajr@18 best ${r.exact}/366 exact (margin ${r.margin} ${r.mode})`);
}

console.log('\n== sub-minute profile: raw fajr@18 seconds past the printed minute ==');
const offsets = [];
for (let i = 0; i < n; i++) {
  const chartM = CHART.fajr[i];
  const off = raw.fajr18[i] / 60 - chartM;
  offsets.push(off);
}
offsets.sort((a, b) => a - b);
console.log(`offset chart-vs-18deg raw (min): p5 ${offsets[Math.floor(n * 0.05)].toFixed(2)} p25 ${offsets[Math.floor(n * 0.25)].toFixed(2)} median ${offsets[Math.floor(n / 2)].toFixed(2)} p75 ${offsets[Math.floor(n * 0.75)].toFixed(2)} p95 ${offsets[Math.floor(n * 0.95)].toFixed(2)}`);

fs.writeFileSync(HOME + '/athan-gitree/census/o1k-wide/fit1/pk-verify.json', JSON.stringify({ checks }, null, 1));
console.log('\nwrote pk-verify.json');
