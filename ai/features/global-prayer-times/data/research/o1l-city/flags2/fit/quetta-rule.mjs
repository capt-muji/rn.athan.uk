// F2 diagnostics: what rule generates each printed asr column.
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
const coords = new adhan.Coordinates(LAT, LON);
const base = (utc, h) => localMin(new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate()) + h * 3600000));

function solar(utc) {
  const st = new SolarTime(utc, coords);
  return { transit: base(utc, st.transit), a1: base(utc, st.afternoon(1)), a2: base(utc, st.afternoon(2)) };
}
function decNOAA(utc) {
  const n = Math.floor((utc - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  const g = 2 * Math.PI * (n - 1) / 365;
  return (0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)) * 180 / Math.PI;
}
const RAD = Math.PI / 180;
function altAt(Hdeg, dec) {
  const s = Math.sin(LAT * RAD) * Math.sin(dec * RAD) + Math.cos(LAT * RAD) * Math.cos(dec * RAD) * Math.cos(Hdeg * RAD);
  return Math.asin(Math.max(-1, Math.min(1, s))) / RAD;
}
function timeAtCot(transit, dec, cotVal) {
  const h = Math.atan(1 / cotVal);
  const c = (Math.sin(h) - Math.sin(LAT * RAD) * Math.sin(dec * RAD)) / (Math.cos(LAT * RAD) * Math.cos(dec * RAD));
  if (c > 1 || c < -1) return NaN;
  return transit + (Math.acos(c) / RAD) * 4;
}

const MASK = new Set(['2026-04-23', '2026-09-16', '2026-09-25', '2026-07-31']);
const rows = [];
for (let m = 1; m <= 12; m++) {
  const mm = String(m).padStart(2, '0');
  for (const dStr of Object.keys(chart[mm])) {
    const d = Number(dStr), r = chart[mm][dStr];
    const date = `2026-${mm}-${String(d).padStart(2, '0')}`;
    if (MASK.has(date)) continue;
    const utc = new Date(Date.UTC(2026, m - 1, d, 12));
    const s = solar(utc);
    rows.push({ date, m, d, utc, asr1: pm(hm(r[4])), asr2: pm(hm(r[5])), sunrise: hm(r[1]), maghrib: pm(hm(r[6])), zawal: pm(hm(r[2])), ...s, dec: decNOAA(utc) });
  }
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const score = (rows, target, fn) => {
  let e = 0, w1 = 0, worst = 0, sum = 0;
  for (const r of rows) { const v = fn(r); if (Number.isNaN(v)) continue; const d = r[target] - Math.round(v); sum += d; if (d === 0) e++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d)); }
  return `exact ${e}/${rows.length} within1 ${w1}/${rows.length} mean ${(sum / rows.length).toFixed(2)} worst ${worst}`;
};

console.log('=== exact-rule tests ===');
console.log('asr1 = transit + 0.5*(maghrib-transit)   ', score(rows, 'asr1', r => r.transit + 0.5 * (r.maghrib - r.transit)));
console.log('asr1 = (zawal+maghrib)/2                  ', score(rows, 'asr1', r => (r.zawal + r.maghrib) / 2));
console.log('asr1 = transit + 0.5*(sunset_eng-transit) ', score(rows, 'asr1', r => r.transit + 0.5 * (r.maghrib - r.transit)));
console.log('asr2 = transit + 0.71*(maghrib-transit)   ', score(rows, 'asr2', r => r.transit + 0.71 * (r.maghrib - r.transit)));
console.log('asr2 = shadow2 standard                   ', score(rows, 'asr2', r => r.a2));

// does the half-afternoon rule hold for asr1 in exact seconds?
const f1 = rows.map(r => (r.asr1 - r.transit) / (r.maghrib - r.transit));
console.log(`\nfrac1: mean ${mean(f1).toFixed(4)} sd ${Math.sqrt(mean(f1.map(x => (x - mean(f1)) ** 2))).toFixed(4)} min ${Math.min(...f1).toFixed(4)} max ${Math.max(...f1).toFixed(4)}`);
const f2 = rows.map(r => (r.asr2 - r.transit) / (r.maghrib - r.transit));
console.log(`frac2: mean ${mean(f2).toFixed(4)} sd ${Math.sqrt(mean(f2.map(x => (x - mean(f2)) ** 2))).toFixed(4)}`);

// === what does the asr2 residual track? ===
console.log('\n=== asr2 residual regressions (residual in min, printed minus shadow-2 engine) ===');
const y = rows.map(r => r.asr2 - r.a2);
const feats = {
  const: r => 1,
  'cot(noon)': r => Math.abs(1 / Math.tan((90 - Math.abs(LAT - r.dec)) * RAD)),
  'tan|lat-dec|': r => Math.tan(Math.abs(LAT - r.dec) * RAD),
  dec: r => r.dec,
  'sin(dec)': r => Math.sin(r.dec * RAD),
  'cos(dec)': r => Math.cos(r.dec * RAD),
  daylen: r => r.maghrib - r.sunrise,
  'afternoon': r => r.maghrib - r.transit,
  'd(dec)/dt': r => { const i = rows.indexOf(r); const a = rows[Math.max(0, i - 1)], b = rows[Math.min(rows.length - 1, i + 1)]; return (b.dec - a.dec) / (b.d - a.d || 1); },
};
function ols(X, y) {
  // normal equations, small p
  const p = X[0].length, n = X.length;
  const A = Array.from({ length: p }, () => new Array(p).fill(0)), b = new Array(p).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) { b[j] += X[i][j] * y[i]; for (let k = 0; k < p; k++) A[j][k] += X[i][j] * X[i][k]; }
  // gaussian elimination
  for (let i = 0; i < p; i++) {
    let piv = i; for (let k = i + 1; k < p; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k;
    [A[i], A[piv]] = [A[piv], A[i]]; [b[i], b[piv]] = [b[piv], b[i]];
    for (let k = i + 1; k < p; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < p; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; }
  }
  const c = new Array(p).fill(0);
  for (let i = p - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < p; j++) s -= A[i][j] * c[j]; c[i] = s / A[i][i]; }
  const pred = X.map(x => x.reduce((s, v, i) => s + v * c[i], 0));
  const ss = y.reduce((s, v, i) => s + (v - pred[i]) ** 2, 0);
  const sst = y.reduce((s, v) => s + (v - mean(y)) ** 2, 0);
  return { c, r2: 1 - ss / sst, rmse: Math.sqrt(ss / n) };
}
for (const [name, fn] of Object.entries(feats)) {
  const { c, r2, rmse } = ols(rows.map(r => [1, fn(r)]), y);
  console.log(`${name.padEnd(14)} r2 ${r2.toFixed(3)} rmse ${rmse.toFixed(2)} coef ${c[1].toFixed(3)}`);
}
// two-feature: const + sin(dec) + cos(dec)
{
  const { c, r2, rmse } = ols(rows.map(r => [1, Math.sin(r.dec * RAD), Math.cos(r.dec * RAD)]), y);
  console.log(`sin+cos(dec)   r2 ${r2.toFixed(3)} rmse ${rmse.toFixed(2)}`);
}

// === declination-lag test: asr at shadow 2 using the declination of date shifted by D days ===
console.log('\n=== declination lag: asr2 from the declination of D days earlier/later ===');
let bestLag = { D: 0, w: -1 };
for (let D = -40; D <= 40; D++) {
  let w1 = 0, e = 0, worst = 0;
  for (const r of rows) {
    const sh = new Date(r.utc.getTime() + D * 86400000);
    const dec = decNOAA(sh);
    const t = timeAtCot(r.transit, dec, 2 + Math.abs(1 / Math.tan((90 - Math.abs(LAT - dec)) * RAD)));
    const d = r.asr2 - Math.round(t);
    if (d === 0) e++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d));
  }
  if (w1 > bestLag.w) bestLag = { D, w: w1, e, worst };
}
console.log('best lag', bestLag);

// === does a coarse (monthly) declination reproduce it? ===
// declination held at the month's 15th value for the whole month
let w1 = 0, e = 0, worst = 0;
const byMonth = {};
for (const r of rows) (byMonth[r.m] ||= []).push(r);
for (const m of Object.keys(byMonth)) {
  const rs = byMonth[m];
  const decMid = decNOAA(new Date(Date.UTC(2026, +m - 1, 15, 12)));
  for (const r of rs) {
    const t = timeAtCot(r.transit, decMid, 2 + Math.abs(1 / Math.tan((90 - Math.abs(LAT - decMid)) * RAD)));
    const d = r.asr2 - Math.round(t);
    if (d === 0) e++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d));
  }
}
console.log('monthly-held declination:', `exact ${e}/${rows.length} within1 ${w1}/${rows.length} worst ${worst}`);

// === within-month scatter of the residual: staircase vs smooth ===
console.log('\n=== asr2 residual, full year, 3-char cells (min, offset +20) ===');
let line = '';
for (const r of rows) {
  const v = Math.round(r.asr2 - r.a2);
  line += String(v).padStart(3) + (r.d === 1 ? ' |' : '');
  if (r.d === 15) { console.log(`${String(r.m).padStart(2)} ${line}`); line = ''; }
}
console.log(`${String(12).padStart(2)} ${line}`);
