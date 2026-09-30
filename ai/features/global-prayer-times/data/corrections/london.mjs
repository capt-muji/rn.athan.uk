// R6: the category-3 and category-4 boundary, measured on London, the app's own timetable.
// London's Fajr and Isha are interval tables from the 1989 Blackburn observations, so their
// residual against any angle is a large smooth seasonal curve with hand edits on top.
// How many harmonic terms does it take, and what is left when they run out?
// node london.mjs

import * as P from './parse.mjs';
import { SITES } from './sites.mjs';
import { residuals, FIELDS, mean } from './measure.mjs';
import { brotliCompressSync } from 'node:zlib';

const site = (id) => SITES.find((s) => s.id === id);

function fit(resid, doy, k) {
  const idx = resid.map((x, i) => [x, doy[i]]).filter(([x]) => x !== null);
  const cols = [() => 1];
  for (let j = 1; j <= k; j++) {
    cols.push((t) => Math.cos(2 * Math.PI * j * t / 365.25));
    cols.push((t) => Math.sin(2 * Math.PI * j * t / 365.25));
  }
  const n = cols.length;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const b = new Array(n).fill(0);
  for (const [y, t] of idx) {
    const x = cols.map((f) => f(t));
    for (let i = 0; i < n; i++) { b[i] += x[i] * y; for (let j = 0; j < n; j++) A[i][j] += x[i] * x[j]; }
  }
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    if (Math.abs(A[i][i]) < 1e-12) continue;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = A[r][i] / A[i][i];
      for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }
  const coef = b.map((v, i) => (Math.abs(A[i][i]) < 1e-12 ? 0 : v / A[i][i]));
  return { coefCount: n, f: (t) => cols.reduce((s, g, i) => s + coef[i] * g(t), 0) };
}

console.log('## G. London: how deep a seasonal model has to go, and what is left over\n');
console.log('Baseline: `adhan` at 18 / 18, Shafi Asr, 51.5 N 0.165 W, the point wave 1 measured.\n');
console.log('| field | harmonic terms | stored coefficients | exact | <=1 min | <=2 min | worst |');
console.log('|---|---|---|---|---|---|---|');

const s = site('UK-london-2026');
const days = s.load(P);
const { resid, doy } = residuals(days, s, s.spec);

for (const f of FIELDS) {
  for (const k of [0, 1, 2, 3, 4, 6, 8, 12, 20]) {
    const model = k === 0
      ? { coefCount: 1, f: () => Math.round(mean(resid[f].filter((x) => x !== null))) }
      : fit(resid[f], doy, k);
    let n = 0, e = 0, w1 = 0, w2 = 0, worst = 0;
    resid[f].forEach((v, i) => {
      if (v === null) return;
      n++;
      const d = Math.abs(v - Math.round(model.f(doy[i])));
      if (d === 0) e++; if (d <= 1) w1++; if (d <= 2) w2++; if (d > worst) worst = d;
    });
    console.log(`| ${f} | ${k} | ${model.coefCount} | ${e} (${(100 * e / n).toFixed(1)}%) | ${w1} (${(100 * w1 / n).toFixed(1)}%) | ${w2} (${(100 * w2 / n).toFixed(1)}%) | ${worst} |`);
  }
}

// The competing structure: an INTERVAL table, which is what London actually publishes.
// Fajr = published sunrise + 3 minus an interval; Isha = published Maghrib - 3 plus one.
console.log('\n## G2. London as an interval table against its own published sunrise and Maghrib\n');
{
  const fInt = days.map((d) => (d.sunrise + 3) - d.fajr);
  const iInt = days.map((d) => d.isha - (d.maghrib - 3));
  const uniq = (v) => new Set(v).size;
  const stat = (v, name) => {
    const steps = v.slice(1).filter((x, i) => x !== v[i]).length;
    console.log(`| ${name} | ${Math.min(...v)} | ${Math.max(...v)} | ${uniq(v)} | ${steps} | ${v.length} |`);
  };
  console.log('| interval | min | max | distinct values | days it changes | days |');
  console.log('|---|---|---|---|---|---|');
  stat(fInt, 'Fajr before sunrise+3');
  stat(iInt, 'Isha after Maghrib-3');

  // How does that interval table compress against the raw residual?
  const enc = (v) => {
    const lo = Math.min(...v);
    return Buffer.from(v.map((x) => x - lo));
  };
  const both = Buffer.concat([enc(fInt), enc(iInt)]);
  console.log(`\nThe two interval columns as raw bytes: ${both.length} B, brotli ${brotliCompressSync(both).length} B (measured).`);

  // Run-length: the intervals hold a value for many days, which is the whole point.
  const rle = (v) => { const out = []; let c = 1; for (let i = 1; i < v.length; i++) { if (v[i] === v[i - 1]) c++; else { out.push([v[i - 1], c]); c = 1; } } out.push([v[v.length - 1], c]); return out; };
  const rF = rle(fInt), rI = rle(iInt);
  console.log(`Run-length encoded: Fajr ${rF.length} runs, Isha ${rI.length} runs, ${2 * (rF.length + rI.length)} bytes raw as (value, count) pairs.`);
  const rleBuf = Buffer.from([...rF, ...rI].flatMap(([v, c]) => [v & 0xff, c & 0xff]));
  console.log(`That is ${rleBuf.length} B raw, brotli ${brotliCompressSync(rleBuf).length} B (measured).`);
}

// Across years, is the interval table the same? Wave 1 says yes except the June and 2020 edits.
console.log('\n## G3. Is London\'s interval table stable across years?\n');
console.log('| year pair | common days | Fajr interval identical | Isha interval identical | Isha days that differ |');
console.log('|---|---|---|---|---|');
const yrs = [2019, 2022, 2025, 2026].map((y) => [y, site(`UK-london-${y}`).load(P)]);
for (let i = 1; i < yrs.length; i++) {
  const [ya, a] = yrs[i - 1], [yb, b] = yrs[i];
  const ma = new Map(a.map((d) => [d.date.slice(5), d]));
  const mb = new Map(b.map((d) => [d.date.slice(5), d]));
  const common = [...ma.keys()].filter((k) => mb.has(k) && k !== '02-29');
  let fs = 0, is = 0; const diff = [];
  for (const k of common) {
    const fa = (ma.get(k).sunrise + 3) - ma.get(k).fajr, fb = (mb.get(k).sunrise + 3) - mb.get(k).fajr;
    const ia = ma.get(k).isha - (ma.get(k).maghrib - 3), ib = mb.get(k).isha - (mb.get(k).maghrib - 3);
    if (fa === fb) fs++;
    if (ia === ib) is++; else diff.push(`${k} ${ia}/${ib}`);
  }
  console.log(`| ${ya} vs ${yb} | ${common.length} | ${fs} (${(100 * fs / common.length).toFixed(1)}%) | ${is} (${(100 * is / common.length).toFixed(1)}%) | ${diff.join(', ') || 'none'} |`);
}
