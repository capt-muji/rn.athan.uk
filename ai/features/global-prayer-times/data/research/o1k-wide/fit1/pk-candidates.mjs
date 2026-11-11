// Job 1 named candidates, scored per prayer with best-margin+rounding on top
// (each candidate gets its best achievable shot at the chart).
// Run: TZ=Asia/Karachi node pk-candidates.mjs
import fs from 'node:fs';
import { loadAdhan, parseHHMM, bestMargin, scoreLine } from './lib.mjs';

const HOME = process.env.HOME;
const DATA = JSON.parse(fs.readFileSync(HOME + '/athan-gitree/census/o1k-wide/southasia/data/pk-islamabad-nizam-2026.json', 'utf8'));
const LAT = 33.6844, LNG = 73.0479;
const adhan = await loadAdhan();
const coords = new adhan.Coordinates(LAT, LNG);
const PM = { fajr: false, sunrise: false, dhuhr: true, asr: true, magrib: true, isha: true };
const keys = Object.keys(DATA._rows).sort();
const slots = keys.map((key) => {
  const [y, m, d] = key.split('-').map(Number);
  const date = (y === 2026 && m === 2 && d === 29) ? new Date(2028, 1, 29) : new Date(y, m - 1, d);
  const chart = {};
  for (const [p, pm] of Object.entries(PM)) chart[p] = parseHHMM(DATA._rows[key][p], pm);
  return { key, date, chart };
});
const secOf = (x) => x.getHours() * 3600 + x.getMinutes() * 60 + x.getSeconds();
const PT_NAME = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', magrib: 'maghrib', isha: 'isha' };
const CHART = {};
for (const p of Object.keys(PM)) CHART[p] = Int32Array.from(slots, (s) => s.chart[p]);

const candidates = {
  'Karachi 18/18 (+dhuhr 1)': () => { const p = adhan.CalculationMethod.Karachi(); return p; },
  'MWL 18/17 (+dhuhr 1)': () => adhan.CalculationMethod.MuslimWorldLeague(),
  'Umm al-Qura 18.5/+90': () => adhan.CalculationMethod.UmmAlQura(),
  'Turkey 18/17 temkin': () => adhan.CalculationMethod.Turkey(),
  'Diyanet-Europe 18/16+temkin': () => {
    const p = new adhan.CalculationParameters(null, 18, 16);
    p.methodAdjustments = { fajr: 0, sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0 };
    return p;
  },
  'Diyanet-Europe 18/16 bare': () => new adhan.CalculationParameters(null, 18, 16),
};

const rows = [];
for (const [name, make] of Object.entries(candidates)) {
  for (const madhab of ['shafi', 'hanafi']) {
    const params = make();
    params.rounding = 'none';
    params.madhab = madhab;
    const sec = {};
    for (const p of Object.keys(PM)) sec[p] = new Float64Array(slots.length);
    for (let i = 0; i < slots.length; i++) {
      const pt = new adhan.PrayerTimes(coords, slots[i].date, params);
      for (const p of Object.keys(PM)) sec[p][i] = secOf(pt[PT_NAME[p]]);
    }
    const per = {};
    for (const p of Object.keys(PM)) per[p] = bestMargin(sec[p], CHART[p]);
    const total = Object.values(per).reduce((a, r) => a + r.exact, 0);
    rows.push({ name, madhab, per, total });
  }
}
rows.sort((a, b) => b.total - a.total);
for (const r of rows) {
  console.log(`\n== ${r.name} [${r.madhab}]  total exact ${r.total}/2196 ==`);
  for (const [p, res] of Object.entries(r.per)) console.log('  ' + scoreLine(p, res));
}
fs.writeFileSync(HOME + '/athan-gitree/census/o1k-wide/fit1/pk-candidates.json', JSON.stringify({ candidates: rows }, null, 1));
console.log('\nwrote pk-candidates.json');
