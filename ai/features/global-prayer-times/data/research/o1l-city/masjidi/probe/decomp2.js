// For every masjidi regional table: fit phi, recover implied declination + noon EoT,
// compare with a precise ephemeris. Output per-table residual profiles.
const L = require('./fitlib');
const fs = require('fs');
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const H0 = -0.833 * D2R;
const YEAR = 2028;

function sun(jd) {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) * D2R;
  const q = 280.459 + 0.98564736 * D;
  const Ls = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
  const e = (23.439 - 0.00000036 * D) * D2R;
  const dec = Math.asin(Math.sin(e) * Math.sin(Ls)) * R2D;
  let ra = Math.atan2(Math.cos(e) * Math.sin(Ls), Math.cos(Ls)) * R2D;
  ra = ((ra % 360) + 360) % 360;
  let eqt = q - ra;
  eqt = (((eqt + 180) % 360) + 360) % 360 - 180;
  return { dec, eqt: eqt * 4 };
}
function jdOf(date) { return date.getTime() / 86400000 + 2440587.5 + 0.5; }

function decImplied(halfMin, phi, h0 = H0) {
  const H = (halfMin / 4) * D2R, p = phi * D2R;
  let lo = -26, hi = 26;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2, d = mid * D2R;
    const ch = (Math.sin(h0) - Math.sin(p) * Math.sin(d)) / (Math.cos(p) * Math.cos(d));
    const Hc = Math.acos(Math.max(-1, Math.min(1, ch)));
    if (Hc > H) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

function analyse(file) {
  const table = L.parseTable(file);
  const dates = Array.from({ length: table.length }, (_, i) => L.doyDate(i, true, YEAR));
  const trueDec = dates.map(d => sun(jdOf(d)).dec);
  let best = { phi: 0, rms: 1e9 };
  for (let p = 10; p <= 60; p += 0.1) {
    const r = [];
    for (let i = 0; i < table.length; i++) {
      const half = (table[i].Maghrib - table[i].Sunrise) / 2;
      r.push(decImplied(half, p) - trueDec[i]);
    }
    const v = L.rms(r);
    if (v < best.rms) best = { phi: p, rms: v };
  }
  // refine
  for (let p = best.phi - 0.1; p <= best.phi + 0.1; p += 0.01) {
    const r = [];
    for (let i = 0; i < table.length; i++) {
      const half = (table[i].Maghrib - table[i].Sunrise) / 2;
      r.push(decImplied(half, p) - trueDec[i]);
    }
    const v = L.rms(r);
    if (v < best.rms) best = { phi: p, rms: v };
  }
  const dres = [], nres = [];
  for (let i = 0; i < table.length; i++) {
    const half = (table[i].Maghrib - table[i].Sunrise) / 2;
    dres.push(decImplied(half, best.phi) - trueDec[i]);
    const noon = (table[i].Sunrise + table[i].Maghrib) / 2;
    const eqt = sun(jdOf(dates[i])).eqt;
    nres.push(eqt - (12 * 60 - noon) * 4 / 4 * 1); // eqt - (12:00-noon) in minutes
  }
  // nres = eqt + (noon-720)  -> combined EoT + longitude term (constant)
  const monthlyDec = [], monthlyNoon = [];
  for (let m = 0; m < 12; m++) {
    const idx = [];
    for (let i = 0; i < table.length; i++) if (dates[i].getUTCMonth() === m) idx.push(i);
    const avg = a => idx.reduce((s, i) => s + a[i], 0) / idx.length;
    monthlyDec.push(+avg(dres).toFixed(3));
    monthlyNoon.push(+avg(nres).toFixed(3));
  }
  // harmonic fit of dec residual: a0 + a1 sin + b1 cos + a2 sin2 + b2 cos2
  const X = [], Y = dres;
  for (let i = 0; i < table.length; i++) {
    const t = 2 * Math.PI * i / 365;
    X.push([1, Math.sin(t), Math.cos(t), Math.sin(2 * t), Math.cos(2 * t)]);
  }
  const coef = lsq(X, Y);
  const pred = X.map(r => r.reduce((s, v, j) => s + v * coef[j], 0));
  const harmRms = L.rms(Y.map((y, i) => y - pred[i]));
  return { file: file.split('/').pop(), phi: +best.phi.toFixed(2), decRms: +best.rms.toFixed(3), monthlyDec, monthlyNoon, harm: coef.map(c => +c.toFixed(3)), harmRms: +harmRms.toFixed(3) };
}

function lsq(X, Y) {
  const n = X[0].length;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const b = new Array(n).fill(0);
  for (let k = 0; k < X.length; k++) {
    for (let i = 0; i < n; i++) {
      b[i] += X[k][i] * Y[k];
      for (let j = 0; j < n; j++) A[i][j] += X[k][i] * X[k][j];
    }
  }
  // gaussian
  for (let i = 0; i < n; i++) {
    let piv = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[piv][i])) piv = k;
    [A[i], A[piv]] = [A[piv], A[i]]; [b[i], b[piv]] = [b[piv], b[i]];
    for (let k = i + 1; k < n; k++) {
      const f = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) A[k][j] -= f * A[i][j];
      b[k] -= f * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j];
    x[i] = s / A[i][i];
  }
  return x;
}

const files = process.argv.slice(2);
for (const f of files) console.log(JSON.stringify(analyse(f)));
