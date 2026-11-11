// Job 1 assembly: isha quarter-snap full stats, then emit pk-fit.json.
// Run: TZ=Asia/Karachi node pk-assemble.mjs
import fs from 'node:fs';
import { loadAdhan, parseHHMM } from './lib.mjs';

const HOME = process.env.HOME;
const DATA = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/southasia/data/pk-islamabad-nizam-2026.json', 'utf8'));
const LAT = 33.6844, LNG = 73.0479;
const adhan = await loadAdhan();
const coords = new adhan.Coordinates(LAT, LNG);
const keys = Object.keys(DATA._rows).sort();
const slots = keys.map((key) => {
  const [y, m, d] = key.split('-').map(Number);
  const date = (y === 2026 && m === 2 && d === 29) ? new Date(2028, 1, 29) : new Date(y, m - 1, d);
  const chart = {};
  for (const [p, pm] of Object.entries({ fajr: false, sunrise: false, dhuhr: true, asr: true, magrib: true, isha: true })) {
    chart[p] = parseHHMM(DATA._rows[key][p], pm);
  }
  return { key, date, chart };
});
const secOf = (x) => x.getHours() * 3600 + x.getMinutes() * 60 + x.getSeconds();
const isha18 = Float64Array.from(slots, (s) => {
  const st = new adhan.SolarTime(s.date, coords);
  return secOf(new adhan.TimeComponents(st.hourAngle(-18, true)).utcDate(s.date.getFullYear(), s.date.getMonth(), s.date.getDate()));
});
const iChart = Int32Array.from(slots, (s) => s.chart.isha);

let best = null;
for (const mode of ['floor', 'ceil', 'nearest']) {
  for (let m = 0; m <= 20; m += 0.5) {
    let exact = 0, within1 = 0, worst = 0;
    const misses = [];
    for (let i = 0; i < slots.length; i++) {
      const x = isha18[i] / 60 + m;
      const q = mode === 'floor' ? Math.floor(x / 15) * 15 : mode === 'ceil' ? Math.ceil(x / 15) * 15 : Math.round(x / 15) * 15;
      const diff = Math.abs(q - iChart[i]);
      if (diff === 0) exact++;
      if (diff <= 1) within1++;
      if (diff > worst) worst = diff;
      if (diff > 1) misses.push(slots[i].key);
    }
    if (!best || exact > best.exact) best = { mode, m, exact, within1, worst, misses };
  }
}
console.log(`isha quarter-snap best: exact ${best.exact}/366 within1 ${best.within1} worst ${best.worst} (mode ${best.mode}, margin +${best.m})`);
console.log(`misses beyond 1 min (${best.misses.length}): ${best.misses.slice(0, 12).join(' ')} ...`);

const grid = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/fit1/pk-grid.json', 'utf8'));
const cands = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/fit1/pk-candidates.json', 'utf8'));

const fit = {
  meta: grid.meta,
  columnMapping: {
    chartColumns: 11,
    order: ['fajr adhan', 'fajr jamaat', 'sunrise', 'dhuhr adhan', 'dhuhr jamaat', 'asr adhan', 'asr jamaat', 'sunset', 'maghrib adhan', 'isha adhan', 'isha jamaat'],
    fitColumns: { fajr: 'c1 adhan', sunrise: 'c3 (fixed solar check)', dhuhr: 'c4 adhan', asr: 'c6 adhan', maghrib: 'c9 adhan', isha: 'c10 adhan' },
    excluded: { c2: 'fajr jamaat (+27)', c5: 'dhuhr jamaat (+15)', c7: 'asr jamaat (+15)', c8: 'sunset (pre-adhan solar)', c11: 'isha jamaat (+15)' },
    pmColumns: ['dhuhr', 'asr', 'magrib', 'isha'],
  },
  bestRecipe: {
    fajr: { angle: 17.95, margin: -0.5, mode: 'floor', ...grid.bestPair.bf, canonical18: evalFixedName('fajr 18.00 0 floor', 306, 366, 1) },
    sunrise: { angle: null, margin: -0.5, mode: 'floor', exact: 301, within1: 366, worst: 1 },
    asr: { madhab: 'hanafi', margin: 2, mode: 'nearest', exact: 233, within1: 366, worst: 1, note: '+2.5 floor identical (233/366/1)' },
    maghrib: { margin: 6, mode: 'nearest', exact: 303, within1: 364, worst: 2, note: '+6.5 floor identical (303/364/2)' },
    dhuhr: { rule: 'seasonal clock: 13:00 from 1 Jan to 14 Apr and from 15 Oct to 31 Dec; 13:15 from 15 Apr to 14 Oct', exact: 366, within1: 366, worst: 0, constantMarginBest: { margin: 69, mode: 'floor', exact: 32, within1: 73, worst: 31 } },
    isha: { rule: `quarter-hour snap: ceil(isha@18deg + ${best.m} min) to 15-min grid`, exact: best.exact, within1: best.within1, worst: best.worst, missesBeyond1: best.misses, constantMarginBest: { margin: 17.5, mode: 'floor', exact: 25, within1: 64, worst: 26 } },
  },
  bestPairGrid: grid.bestPair,
  runnerUpGrid: grid.topPairs[1],
  namedCandidates: cands.candidates.map((c) => ({ name: c.name, madhab: c.madhab, totalExact: c.total, per: c.per })),
  diagnostics: {
    dhuhrPrinted: { '13:00': 183, '13:15': 183, switches: ['2026-04-15 -> 13:15', '2026-10-15 -> 13:00'] },
    ishaPrintedValues: 11, ishaSwitches: 20, ishaOnQuarterGrid: true, ishaNote: 'one 30-min step 30 Sep -> 1 Oct; all other steps 15 min',
    fajrOffsetVs18: 'chart minute sits 30-90 s before computed 18-deg fajr (median ~39 s)',
    anchorYears: { 2024: 260, 2026: 306, 2028: 258, note: 'fajr@18 best exact per year; chart tracks the 2026 solar year, not a stale 2016 print' },
    feb29: { primary: '2028-02-29', alternates: { dupFeb28: 'sunrise+maghrib exact, fajr/asr -1', computed2024: 'fajr -2, sunrise -1, asr exact, maghrib +1' } },
  },
  verdict: 'the federal chart is its own construction: UISK/Karachi 18-deg dawn block with no safety margin (fajr), Hanafi asr +2, maghrib sunset+6, printed half-minute-early; dhuhr and isha adhan are seasonal fixed clocks no named method produces',
  nearestNamed: 'Karachi (UISK) 18/18, Hanafi asr: matches fajr/sunrise/asr/maghrib but totals 1161/2196 because dhuhr/isha are clocks',
};
function evalFixedName(name, exact, within1, worst) { return { name, exact, within1, worst }; }

fs.writeFileSync(HOME + '/athan-gitree/census/o1k-wide/fit1/pk-fit.json', JSON.stringify(fit, null, 1));
console.log('wrote pk-fit.json');
