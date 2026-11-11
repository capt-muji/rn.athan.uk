// F2: name the asr rule-form. Seasonal shadow factor, latitude test, and the fraction rule.
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
const MASK = new Set(['2026-04-23', '2026-09-16', '2026-09-25', '2026-07-31']);

function decNOAA(utc) {
  const n = Math.floor((utc - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  const g = 2 * Math.PI * (n - 1) / 365;
  return (0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)) / RAD;
}
function solarFor(lat, utc) {
  const st = new SolarTime(utc, new adhan.Coordinates(lat, LON));
  const b = Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  const conv = h => localMin(new Date(b + h * 3600000));
  return { transit: conv(st.transit), a1: conv(st.afternoon(1)), a2: conv(st.afternoon(2)) };
}
function timeAtCot(lat, transit, dec, cotVal) {
  const h = Math.atan(1 / cotVal);
  const c = (Math.sin(h) - Math.sin(lat * RAD) * Math.sin(dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
  if (c > 1 || c < -1) return NaN;
  return transit + (Math.acos(c) / RAD) * 4;
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

const rows = [];
for (let m = 1; m <= 12; m++) {
  const mm = String(m).padStart(2, '0');
  for (const dStr of Object.keys(chart[mm])) {
    const d = Number(dStr), r = chart[mm][dStr];
    const date = `2026-${mm}-${String(d).padStart(2, '0')}`;
    if (MASK.has(date)) continue;
    const utc = new Date(Date.UTC(2026, m - 1, d, 12));
    rows.push({ date, m, d, utc, asr1: pm(hm(r[4])), asr2: pm(hm(r[5])), maghrib: pm(hm(r[6])), sunrise: hm(r[1]), ...solarFor(LAT, utc), dec: decNOAA(utc) });
  }
}
const scoreFn = (target, fn) => { let e = 0, w1 = 0, worst = 0, sum = 0; for (const r of rows) { const v = fn(r); if (Number.isNaN(v)) continue; const dd = r[target] - Math.round(v); sum += dd; if (dd === 0) e++; if (Math.abs(dd) <= 1) w1++; worst = Math.max(worst, Math.abs(dd)); } return `exact ${e} within1 ${w1} mean ${(sum / rows.length).toFixed(2)} worst ${worst}`; };

console.log('=== latitude test (asr2 at shadow 2, asr1 at shadow 1), same longitude ===');
for (const lat of [28, 29, 30, 30.1841, 31, 32, 33, 34]) {
  let w2 = 0, e2 = 0, w1_ = 0;
  for (const r of rows) {
    const s = solarFor(lat, r.utc);
    if (Math.abs(r.asr2 - Math.round(s.a2)) <= 1) w2++;
    if (r.asr2 === Math.round(s.a2)) e2++;
    if (Math.abs(r.asr1 - Math.round(s.a1)) <= 1) w1_++;
  }
  console.log(`lat ${String(lat).padStart(7)}  asr2 exact ${e2} within1 ${w2}   asr1 within1 ${w1_}`);
}

console.log('\n=== seasonal shadow factor: n_eff = a + b*sin(dec) + c*cos(dec) ===');
function solveN(r, target) {
  let lo = 0.2, hi = 4.0;
  for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (timeAtCot(LAT, r.transit, r.dec, mid + Math.abs(1 / Math.tan((90 - Math.abs(LAT - r.dec)) * RAD))) - r[target] < 0) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
for (const target of ['asr1', 'asr2']) {
  const n = rows.map(r => solveN(r, target));
  const X = rows.map(r => [1, Math.sin(r.dec * RAD), Math.cos(r.dec * RAD)]);
  // OLS by hand (3 params)
  const p = 3, N = rows.length;
  const A = Array.from({ length: p }, () => new Array(p).fill(0)), b = new Array(p).fill(0);
  for (let i = 0; i < N; i++) for (let j = 0; j < p; j++) { b[j] += X[i][j] * n[i]; for (let k = 0; k < p; k++) A[j][k] += X[i][j] * X[i][k]; }
  for (let i = 0; i < p; i++) { let piv = i; for (let k = i + 1; k < p; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k; [A[i], A[piv]] = [A[piv], A[i]]; [b[i], b[piv]] = [b[piv], b[i]]; for (let k = i + 1; k < p; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < p; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; } }
  const c = new Array(p).fill(0);
  for (let i = p - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < p; j++) s -= A[i][j] * c[j]; c[i] = s / A[i][i]; }
  const pred = X.map(x => x.reduce((s, v, i) => s + v * c[i], 0));
  const ss = n.reduce((s, v, i) => s + (v - pred[i]) ** 2, 0);
  const sst = n.reduce((s, v) => s + (v - mean(n)) ** 2, 0);
  console.log(`${target}: n_eff mean ${mean(n).toFixed(3)} sd ${Math.sqrt(mean(n.map(x => (x - mean(n)) ** 2))).toFixed(3)}  fit a=${c[0].toFixed(3)} b=${c[1].toFixed(3)} c=${c[2].toFixed(3)} r2=${(1 - ss / sst).toFixed(3)} rmse=${Math.sqrt(ss / N).toFixed(3)}`);
}

console.log('\n=== does the seasonal n reproduce the printed column? (n = a + b*sin(dec) + c*cos(dec), rounded to 3dp) ===');
const coeff = {};
for (const target of ['asr1', 'asr2']) {
  const n = rows.map(r => solveN(r, target));
  const X = rows.map(r => [1, Math.sin(r.dec * RAD), Math.cos(r.dec * RAD)]);
  const p = 3, N = rows.length;
  const A = Array.from({ length: p }, () => new Array(p).fill(0)), b = new Array(p).fill(0);
  for (let i = 0; i < N; i++) for (let j = 0; j < p; j++) { b[j] += X[i][j] * n[i]; for (let k = 0; k < p; k++) A[j][k] += X[i][j] * X[i][k]; }
  for (let i = 0; i < p; i++) { let piv = i; for (let k = i + 1; k < p; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k; [A[i], A[piv]] = [A[piv], A[i]]; [b[i], b[piv]] = [b[piv], b[i]]; for (let k = i + 1; k < p; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < p; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; } }
  const c = new Array(p).fill(0);
  for (let i = p - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < p; j++) s -= A[i][j] * c[j]; c[i] = s / A[i][i]; }
  coeff[target] = c;
  console.log(`${target} n(dec) = ${c[0].toFixed(3)} + ${c[1].toFixed(3)}sin + ${c[2].toFixed(3)}cos  ->  ${scoreFn(target, r => timeAtCot(LAT, r.transit, r.dec, (c[0] + c[1] * Math.sin(r.dec * RAD) + c[2] * Math.cos(r.dec * RAD)) + Math.abs(1 / Math.tan((90 - Math.abs(LAT - r.dec)) * RAD))))}`);
}

// the fraction rule for asr1, per month, to show it is the same rule all year
console.log('\n=== asr1 fraction of the afternoon, per month ===');
for (let m = 1; m <= 12; m++) {
  const rs = rows.filter(r => r.m === m);
  const f = rs.map(r => (r.asr1 - r.transit) / (r.maghrib - r.transit));
  const t = rs.map(r => (r.asr2 - r.transit) / (r.maghrib - r.transit));
  const tf = rs.map(r => (r.a2 - r.transit) / (r.maghrib - r.transit));
  console.log(`${String(m).padStart(2)}  frac1 ${mean(f).toFixed(4)} sd ${Math.sqrt(mean(f.map(x => (x - mean(f)) ** 2))).toFixed(4)} | frac2 ${mean(t).toFixed(4)} | true-hanafi frac ${mean(tf).toFixed(4)}`);
}
