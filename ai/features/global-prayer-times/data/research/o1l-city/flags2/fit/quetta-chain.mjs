// F2: test the chained rule - column 6 = column 5 plus one shadow increment.
import fs from 'node:fs';
import * as adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';
import SolarTime from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/SolarTime.js';

const HOME = process.env.HOME;
const LAT = 30.1841, LON = 66.9966, TZ = 'Asia/Karachi';
const chart = (await import(`file://${HOME}/athan-gitree/census/o1l-city/o1l-21r/data/quetta-transcribed.js`)).default;
const hm = s => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };
const pm = v => (v < 720 ? v + 720 : v);
const tzf = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const localMin = d => { const p = Object.fromEntries(tzf.formatToParts(d).map(x => [x.type, x.value])); return (+p.hour % 24) * 60 + +p.minute + +p.second / 60; };
const RAD = Math.PI / 180;
const coords = new adhan.Coordinates(LAT, LON);
function decNOAA(utc) {
  const n = Math.floor((utc - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  const g = 2 * Math.PI * (n - 1) / 365;
  return (0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)) / RAD;
}
const cotAt = (Hdeg, dec) => {
  const s = Math.sin(LAT * RAD) * Math.sin(dec * RAD) + Math.cos(LAT * RAD) * Math.cos(dec * RAD) * Math.cos(Hdeg * RAD);
  return 1 / Math.tan(Math.asin(Math.max(-1, Math.min(1, s))));
};
const timeAtCot = (transit, dec, cotVal) => {
  const h = Math.atan(1 / cotVal);
  const c = (Math.sin(h) - Math.sin(LAT * RAD) * Math.sin(dec * RAD)) / (Math.cos(LAT * RAD) * Math.cos(dec * RAD));
  if (c > 1 || c < -1) return NaN;
  return transit + (Math.acos(c) / RAD) * 4;
};
const MASK = new Set(['2026-04-23', '2026-09-16', '2026-09-25', '2026-07-31']);
const rows = [];
for (let m = 1; m <= 12; m++) {
  const mm = String(m).padStart(2, '0');
  for (const dStr of Object.keys(chart[mm])) {
    const d = Number(dStr), r = chart[mm][dStr];
    const date = `2026-${mm}-${String(d).padStart(2, '0')}`;
    if (MASK.has(date)) continue;
    const utc = new Date(Date.UTC(2026, m - 1, d, 12));
    const st = new SolarTime(utc, coords);
    const b = Date.UTC(2026, m - 1, d);
    const conv = h => localMin(new Date(b + h * 3600000));
    rows.push({ date, m, d, utc, asr1: pm(hm(r[4])), asr2: pm(hm(r[5])), maghrib: pm(hm(r[6])), sunrise: hm(r[1]),
      transit: conv(st.transit), a1: conv(st.afternoon(1)), a2: conv(st.afternoon(2)), dec: decNOAA(utc) });
  }
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const score = (target, fn) => { let e = 0, w1 = 0, worst = 0, sum = 0; for (const r of rows) { const v = fn(r); if (Number.isNaN(v)) continue; const dd = r[target] - Math.round(v); sum += dd; if (dd === 0) e++; if (Math.abs(dd) <= 1) w1++; worst = Math.max(worst, Math.abs(dd)); } return `exact ${e}/361 within1 ${w1}/361 mean ${(sum / 361).toFixed(2)} worst ${worst}`; };

const cotOf = (r, mins) => cotAt((mins - r.transit) / 4, r.dec);
console.log('chained: asr2 = time at cot(asr1_printed)+1   ', score('asr2', r => timeAtCot(r.transit, r.dec, cotOf(r, r.asr1) + 1)));
console.log('chained: asr2 = time at cot(asr1_printed)+1.2 ', score('asr2', r => timeAtCot(r.transit, r.dec, cotOf(r, r.asr1) + 1.2)));
console.log('chained: asr2 = time at cot(asr1_printed)*2   ', score('asr2', r => timeAtCot(r.transit, r.dec, cotOf(r, r.asr1) * 2)));
console.log('reference shadow-2 from noon                  ', score('asr2', r => timeAtCot(r.transit, r.dec, 2 + Math.abs(1 / Math.tan((90 - Math.abs(LAT - r.dec)) * RAD)))));
console.log('asr1 = transit + 0.5*(maghrib-transit)        ', score('asr1', r => r.transit + 0.5 * (r.maghrib - r.transit)));
console.log('asr1 = shadow-1 from noon (for comparison)    ', score('asr1', r => timeAtCot(r.transit, r.dec, 1 + Math.abs(1 / Math.tan((90 - Math.abs(LAT - r.dec)) * RAD)))));

// per-month residuals of the best chained form
console.log('\nmonth | chained(+1) residual | shadow-2 residual | asr1 half-frac residual');
for (let m = 1; m <= 12; m++) {
  const rs = rows.filter(r => r.m === m);
  const a = rs.map(r => r.asr2 - Math.round(timeAtCot(r.transit, r.dec, cotOf(r, r.asr1) + 1)));
  const b = rs.map(r => r.asr2 - Math.round(timeAtCot(r.transit, r.dec, 2 + Math.abs(1 / Math.tan((90 - Math.abs(LAT - r.dec)) * RAD)))));
  const c = rs.map(r => r.asr1 - Math.round(r.transit + 0.5 * (r.maghrib - r.transit)));
  console.log(`${String(m).padStart(2)} | ${mean(a).toFixed(2).padStart(6)} | ${mean(b).toFixed(2).padStart(6)} | ${mean(c).toFixed(2).padStart(6)}`);
}
