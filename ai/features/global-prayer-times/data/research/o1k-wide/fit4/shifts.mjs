// Interval-shift quantification: (chartSunrise - chartFajr) - LUPT_F and
// (chartIsha - chartMaghrib) - LUPT_I, per town, distribution of the shift.
// Run: TZ=Europe/London node shifts.mjs
import fs from 'node:fs';
import { loadTable, makeContext, pmFlag, parseCol } from './engine.mjs';

const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1k-wide/uktowns2/data/';

const luptByMMDD = {};
for (const mo of ['01', '02', '04', '07', '11', '12']) {
  const d = JSON.parse(fs.readFileSync(`${D}lupt-2027-${mo}.json`, 'utf8'));
  for (const [k, row] of Object.entries(d)) luptByMMDD[k.slice(5)] = row;
}
const luCols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', maghrib: 'magrib', isha: 'isha' };
const pmLu = {};
for (const [p, col] of Object.entries(luCols)) {
  const vals = Object.values(luptByMMDD).map((r) => String(r[col] ?? '').trim());
  pmLu[p] = pmFlag(p, vals);
}
const luVal = (mmdd, p) => {
  const v = String(luptByMMDD[mmdd]?.[luCols[p]] ?? '').trim();
  if (!/^\d{1,2}:\d{2}$/.test(v)) return null;
  return parseCol(v, p, pmLu[p]);
};

const towns = [
  { tag: 'reading', file: D + 'reading-amic-2026.json', cols: { fajr: 'fajr', maghrib: 'magrib', isha: 'isha' }, lat: 51.4543, lng: -0.9781 },
  { tag: 'coventry', file: D + 'coventry-zeenatul-islam-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', maghrib: 'magrib', isha: 'isha' }, lat: 52.4068, lng: -1.5197 },
  { tag: 'rochdale', file: D + 'rochdale-golden-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', maghrib: 'magrib', isha: 'isha' }, lat: 53.6097, lng: -2.1561 },
  { tag: 'bolton', file: D + 'bolton-zakariyya-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', maghrib: 'magrib', isha: 'isha' }, lat: 53.5769, lng: -2.4282 },
];

for (const t of towns) {
  const tt = loadTable(t);
  const ctx = await makeContext(t.lat, t.lng, tt.slots);
  // simpler: reload raw isha strings with pm
  const d = JSON.parse(fs.readFileSync(t.file, 'utf8'));
  const keys = Object.keys(d).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && d[k]).sort();
  const ishaVals = keys.map((k) => String(d[k][t.cols.isha] ?? '').trim());
  const ishaPm = pmFlag('isha', ishaVals);
  const fShift = [], iShift = [];
  for (let i = 0; i < tt.slots.length; i++) {
    const s = tt.slots[i];
    const srChart = s.chart.sunrise !== undefined ? s.chart.sunrise : ctx.raw.sunrise[i] / 60;
    const mgChart = s.chart.maghrib;
    const F = luVal(s.key.slice(5), 'fajr');
    const srL = luVal(s.key.slice(5), 'sunrise');
    const I = luVal(s.key.slice(5), 'isha');
    const mgL = luVal(s.key.slice(5), 'maghrib');
    if (F !== null && srL !== null) fShift.push(Math.round((srChart - s.chart.fajr) - (srL - F)));
    if (I !== null && mgL !== null) iShift.push(Math.round(parseCol(ishaVals[i], 'isha', ishaPm) - mgChart - (I - mgL)));
  }
  const mode = (arr) => {
    const c = {};
    for (const x of arr) c[x] = (c[x] ?? 0) + 1;
    const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return { mode: +best[0], count: best[1] };
  };
  const mf = mode(fShift), mi = mode(iShift);
  const near = (arr, m) => arr.filter((x) => Math.abs(x - m) <= 1).length;
  console.log(`${t.tag}: F-shift (lead - LUPT F) mode ${mf.mode} on ${mf.count}/${fShift.length}, within±1 ${near(fShift, mf.mode)}; I-shift mode ${mi.mode} on ${mi.count}/${iShift.length}, within±1 ${near(iShift, mi.mode)}`);
  console.log(`  F-shift sample: ${fShift.slice(0, 24).join(',')}`);
  console.log(`  I-shift sample: ${iShift.slice(0, 24).join(',')}`);
}
