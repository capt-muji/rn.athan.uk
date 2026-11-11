// Minsk: which angle governs the robust-season twilight columns, and what
// happens through the summer non-existence window?
import fs from 'node:fs';
import { load, computeCols, chartOf, score, bestMargin } from './lib.mjs';

const adhan = await load();
const H = process.env.HOME + '/athan-gitree/census/o1k-wide/nordics2/data/';
const raw = JSON.parse(fs.readFileSync(H + 'by-islambel-minsk-2025.json'));
const dates = Object.keys(raw).sort();
const rows = dates.map((d) => { const r = raw[d]; return { fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.dhuhr, asr: r.asr, maghrib: r.magrib, isha: r.isha }; });
const coords = { lat: 53.9006, lon: 27.5590 };
const TZ = 'Europe/Minsk';
const chart = chartOf(rows, ['fajr', 'sunrise', 'maghrib', 'isha']);

const wide = [];
for (let j = -16; j <= 16; j++) wide.push(j / 2);

// robust-season subsets: months when the respective twilight exists with margin
const robustFajr = dates.map((d, i) => i).filter((i) => { const m = +dates[i].slice(5, 7); return m <= 3 || m >= 10; });
const robustIsha = dates.map((d, i) => i).filter((i) => { const m = +dates[i].slice(5, 7); return m <= 2 || m >= 10; });

for (const [col, idx, lo, hi] of [['fajr', robustFajr, 110, 240], ['isha', robustIsha, 110, 240]]) {
  const angles = []; for (let a = lo; a <= hi; a++) angles.push(a / 10);
  const res = [];
  for (const a of angles) {
    const s = computeCols(adhan, coords, TZ, idx.map((i) => dates[i]), { [col]: { kind: 'angle', v: a, after: col === 'isha' } });
    res.push({ a, ...bestMargin(s[col], idx.map((i) => chart[col][i]), { margins: wide, modes: ['nearest'] }) });
  }
  res.sort((x, y) => y.exact - x.exact || x.worst - y.worst || Math.abs(x.margin) - Math.abs(y.margin));
  const top = res.slice(0, 5);
  console.log(`${col} robust-season (${idx.length} days): ` + top.map((r) => `${r.a}deg exact ${r.exact}/${robustFajr.length && col === 'fajr' ? robustFajr.length : robustIsha.length} worst ${r.worst} m${r.margin}`).join(' | '));
  console.log(`  15deg: ` + JSON.stringify(res.find((r) => r.a === 15)) );
  console.log(`  16deg: ` + JSON.stringify(res.find((r) => r.a === 16)) );
  console.log(`  18deg: ` + JSON.stringify(res.find((r) => r.a === 18)) );
}

// shape of the printed twilight intervals through the summer window
console.log('\nprinted intervals through summer (fajr=sunrise-fajr, isha=isha-maghrib):');
for (const d of ['2025-05-10', '2025-05-20', '2025-05-25', '2025-06-01', '2025-06-10', '2025-06-15', '2025-06-20', '2025-06-21', '2025-06-25', '2025-07-03', '2025-07-10', '2025-07-20', '2025-08-01']) {
  const i = dates.indexOf(d);
  if (i < 0) continue;
  console.log(' ', d, 'fajr', rows[i].fajr, 'sunrise', rows[i].sunrise, 'interval', chart.sunrise[i] - chart.fajr[i], '| isha', rows[i].isha, 'maghrib', rows[i].maghrib, 'interval', chart.isha[i] - chart.maghrib[i]);
}
// and computed 15/16/17/18 isha for Jun 20 (the boundary day) plus Jun 5-25
{
  const ds = ['2025-06-05', '2025-06-10', '2025-06-14', '2025-06-16', '2025-06-18', '2025-06-19', '2025-06-20', '2025-06-21'];
  const s = computeCols(adhan, coords, TZ, ds, {
    i15: { kind: 'angle', v: 15, after: true }, i16: { kind: 'angle', v: 16, after: true },
    i17: { kind: 'angle', v: 17, after: true }, i18: { kind: 'angle', v: 18, after: true },
  });
  const f = (sec) => { if (sec === null) return '  ---'; const m = Math.round(sec / 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  console.log('\ncomputed isha angles at the boundary:');
  for (let k = 0; k < ds.length; k++) console.log(' ', ds[k], '15deg', f(s.i15[k]), '16deg', f(s.i16[k]), '17deg', f(s.i17[k]), '18deg', f(s.i18[k]), 'printed', rows[dates.indexOf(ds[k])].isha);
}
// same for fajr at its boundary (May 18-24, Jul 22-28) and midsummer
{
  const ds = ['2025-05-15', '2025-05-18', '2025-05-20', '2025-05-22', '2025-06-15', '2025-06-21', '2025-07-10', '2025-07-20', '2025-07-23', '2025-07-25', '2025-07-28'];
  const s = computeCols(adhan, coords, TZ, ds, {
    f12: { kind: 'angle', v: 12, after: false }, f13: { kind: 'angle', v: 13, after: false },
    f14: { kind: 'angle', v: 14, after: false }, f15: { kind: 'angle', v: 15, after: false },
  });
  const f = (sec) => { if (sec === null) return '  ---'; const m = Math.round(sec / 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  console.log('\ncomputed fajr angles through summer:');
  for (let k = 0; k < ds.length; k++) console.log(' ', ds[k], '12deg', f(s.f12[k]), '13deg', f(s.f13[k]), '14deg', f(s.f14[k]), '15deg', f(s.f15[k]), 'printed', rows[dates.indexOf(ds[k])].fajr);
}
