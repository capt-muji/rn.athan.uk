// F2: does a latitude shift absorb the seasonal term? 2-parameter (lat, n) and (lat, noon-shadow scale).
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
function decNOAA(utc) { const n = Math.floor((utc - Date.UTC(2026, 0, 1)) / 86400000) + 1; const g = 2 * Math.PI * (n - 1) / 365;
  return (0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)) / RAD; }
function timeAtCot(lat, transit, dec, cotVal) {
  const h = Math.atan(1 / cotVal);
  const c = (Math.sin(h) - Math.sin(lat * RAD) * Math.sin(dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
  if (c > 1 || c < -1) return NaN;
  return transit + (Math.acos(c) / RAD) * 4;
}
const MASK = new Set(['2026-04-23', '2026-09-16', '2026-09-25', '2026-07-31']);
const rows = [];
for (let m = 1; m <= 12; m++) { const mm = String(m).padStart(2, '0');
  for (const dStr of Object.keys(chart[mm])) { const d = Number(dStr), r = chart[mm][dStr];
    const date = `2026-${mm}-${String(d).padStart(2, '0')}`; if (MASK.has(date)) continue;
    const utc = new Date(Date.UTC(2026, m - 1, d, 12));
    const st = new SolarTime(utc, coords); const b = Date.UTC(2026, m - 1, d);
    rows.push({ date, asr2: pm(hm(r[5])), transit: localMin(new Date(b + st.transit * 3600000)), dec: decNOAA(utc) }); } }
const nn = r => Math.abs(1 / Math.tan((90 - Math.abs(LAT - r.dec)) * RAD));
let best = { w: -1 };
for (let lat = 29; lat <= 33; lat += 0.05) for (let n = 1.7; n <= 2.3; n += 0.01) {
  let w = 0, e = 0, worst = 0;
  for (const r of rows) { const t = timeAtCot(lat, r.transit, r.dec, n + nn(r)); const dd = r.asr2 - Math.round(t); if (dd === 0) e++; if (Math.abs(dd) <= 1) w++; worst = Math.max(worst, Math.abs(dd)); }
  if (w > best.w) best = { lat: +lat.toFixed(2), n: +n.toFixed(2), w, e, worst };
}
console.log('best (lat, n):', best, 'of 361');
// (lat, noon-shadow scale c)
best = { w: -1 };
for (let lat = 29; lat <= 33; lat += 0.05) for (let c = 0.7; c <= 1.3; c += 0.01) {
  let w = 0, e = 0, worst = 0;
  for (const r of rows) { const t = timeAtCot(lat, r.transit, r.dec, 2 + c * nn(r)); const dd = r.asr2 - Math.round(t); if (dd === 0) e++; if (Math.abs(dd) <= 1) w++; worst = Math.max(worst, Math.abs(dd)); }
  if (w > best.w) best = { lat: +lat.toFixed(2), c: +c.toFixed(2), w, e, worst };
}
console.log('best (lat, c):', best, 'of 361');
