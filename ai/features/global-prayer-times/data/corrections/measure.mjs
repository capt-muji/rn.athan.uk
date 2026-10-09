// R6: does the correction-table model generalise?
// For every authority obtained, compute the per-field residual against a local `adhan` baseline,
// classify its shape, score four correction models and price the exact residual in bytes.
// Nothing here is used as a prayer time. Run: node measure.mjs

import * as adhan from 'adhan';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import * as P from './parse.mjs';

const FIELDS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

// ---------------------------------------------------------------- baseline

function makeParams(spec) {
  const p = adhan.CalculationMethod.Other();
  p.fajrAngle = spec.fajr;
  if (spec.ishaInterval) { p.ishaInterval = spec.ishaInterval; p.ishaAngle = 0; }
  else p.ishaAngle = spec.isha;
  p.madhab = spec.hanafi ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  // `adhan` rounds internally. Switch that off so the rounding rule is applied here, where
  // it can be chosen per authority. Most authorities do not round to nearest.
  p.rounding = adhan.Rounding.None;
  return p;
}

const fmtCache = new Map();
// `rounding` is 'nearest', 'up' or 'down'. 'up' is the common institutional rule: never
// announce a prayer before its true instant.
function localMinutes(date, tz, rounding = 'nearest') {
  let f = fmtCache.get(tz);
  if (!f) { f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); fmtCache.set(tz, f); }
  const p = f.formatToParts(date), g = (t) => Number(p.find((x) => x.type === t).value);
  const secs = g('hour') * 3600 + g('minute') * 60 + g('second');
  if (rounding === 'up') return Math.ceil(secs / 60);
  if (rounding === 'down') return Math.floor(secs / 60);
  return Math.round(secs / 60);
}

// Baseline for one published day. `dummyYear` maps a perpetual table onto a real leap year.
// `site.tz` may be a fixed-offset pseudo-zone such as `Etc/GMT` for an authority that serves
// its timetable at a clock other than the country's civil time (Morocco does exactly this).
function baseline(day, site, spec, dummyYear) {
  const [y, m, d] = day.date.split('-').map(Number);
  const yy = dummyYear ?? y;
  const coords = new adhan.Coordinates(site.lat, site.lon);
  const params = makeParams(spec);
  // A Ramadan-only Isha interval, published by Umm al-Qura as 120 minutes instead of 90.
  if (spec.ramadanIshaInterval && day.hijriMonth === 9) params.ishaInterval = spec.ramadanIshaInterval;
  const t = new adhan.PrayerTimes(coords, new Date(Date.UTC(yy, m - 1, d, 12)), params);
  const r = site.rounding ?? 'nearest';
  const pick = (k) => (typeof r === 'string' ? r : (r[k] ?? 'nearest'));
  return { fajr: localMinutes(t.fajr, site.tz, pick('fajr')), sunrise: localMinutes(t.sunrise, site.tz, pick('sunrise')),
    dhuhr: localMinutes(t.dhuhr, site.tz, pick('dhuhr')), asr: localMinutes(t.asr, site.tz, pick('asr')),
    maghrib: localMinutes(t.maghrib, site.tz, pick('maghrib')), isha: localMinutes(t.isha, site.tz, pick('isha')) };
}

export function residuals(days, site, spec, dummyYear) {
  const out = Object.fromEntries(FIELDS.map((k) => [k, []]));
  const doy = [];
  for (const day of days) {
    const b = baseline(day, site, spec, dummyYear);
    const [y, m, d] = day.date.split('-').map(Number);
    doy.push(Math.round((Date.UTC(dummyYear ?? y, m - 1, d) - Date.UTC(dummyYear ?? y, 0, 1)) / 86400000));
    for (const k of FIELDS) {
      const p = day[k];
      if (p === null || p === undefined) { out[k].push(null); continue; }
      // A computed time can land on the other side of midnight at high latitude, where the
      // library falls back to a night-portion rule. Fold the residual into [-720, 720) so it
      // measures the real disagreement rather than a day-boundary artefact.
      let d = p - b[k];
      while (d >= 720) d -= 1440;
      while (d < -720) d += 1440;
      out[k].push(d);
    }
  }
  return { resid: out, doy };
}

// ---------------------------------------------------------------- statistics

const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v) => { const m = mean(v); return Math.sqrt(mean(v.map((x) => (x - m) ** 2))); };

export function fieldStats(v0) {
  const v = v0.filter((x) => x !== null);
  const m = mean(v);
  const counts = new Map();
  for (const x of v) counts.set(x, (counts.get(x) || 0) + 1);
  const mode = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { n: v.length, min: Math.min(...v), max: Math.max(...v), spread: Math.max(...v) - Math.min(...v),
    mean: m, sd: sd(v), mode: mode[0], modeShare: mode[1] / v.length };
}

// Harmonic fit of the residual against the day of year, k terms, least squares.
function harmonicFit(resid, doy, k, period) {
  const idx = resid.map((x, i) => [x, doy[i]]).filter(([x]) => x !== null);
  const cols = [() => 1];
  for (let j = 1; j <= k; j++) {
    cols.push((t) => Math.cos(2 * Math.PI * j * t / period));
    cols.push((t) => Math.sin(2 * Math.PI * j * t / period));
  }
  const nC = cols.length;
  const A = Array.from({ length: nC }, () => new Array(nC).fill(0));
  const b = new Array(nC).fill(0);
  for (const [y, t] of idx) {
    const x = cols.map((f) => f(t));
    for (let i = 0; i < nC; i++) { b[i] += x[i] * y; for (let j = 0; j < nC; j++) A[i][j] += x[i] * x[j]; }
  }
  // Gaussian elimination with partial pivoting.
  for (let i = 0; i < nC; i++) {
    let p = i; for (let r = i + 1; r < nC; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    if (Math.abs(A[i][i]) < 1e-12) continue;
    for (let r = 0; r < nC; r++) {
      if (r === i) continue;
      const f = A[r][i] / A[i][i];
      for (let c = i; c < nC; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }
  const coef = b.map((v, i) => (Math.abs(A[i][i]) < 1e-12 ? 0 : v / A[i][i]));
  return (t) => cols.reduce((s, f, i) => s + coef[i] * f(t), 0);
}

// Lag-1 autocorrelation of the residual after the constant is removed.
function lag1(v0) {
  const v = v0.filter((x) => x !== null);
  const m = mean(v);
  let num = 0, den = 0;
  for (let i = 0; i < v.length; i++) { den += (v[i] - m) ** 2; if (i) num += (v[i] - m) * (v[i - 1] - m); }
  return den === 0 ? 0 : num / den;
}

// ---------------------------------------------------------------- models

function score(resid, predict) {
  let exact = 0, w1 = 0, w2 = 0, worst = 0, n = 0;
  resid.forEach((r, i) => {
    if (r === null) return;
    n++;
    const e = Math.abs(r - predict(i));
    if (e === 0) exact++;
    if (e <= 1) w1++;
    if (e <= 2) w2++;
    if (e > worst) worst = e;
  });
  return { n, exact, w1, w2, worst };
}

export function models(resid, doy) {
  const out = {};
  for (const k of FIELDS) {
    const v = resid[k];
    const clean = v.filter((x) => x !== null);
    if (!clean.length) continue;
    const c = Math.round(mean(clean));
    const A = score(v, () => c);

    const byMonthIdx = doy.map((d) => Math.min(11, Math.floor(d / 30.5)));
    const monthC = {};
    for (let mi = 0; mi < 12; mi++) {
      const s = v.filter((x, i) => x !== null && byMonthIdx[i] === mi);
      monthC[mi] = s.length ? Math.round(mean(s)) : c;
    }
    const B = score(v, (i) => monthC[byMonthIdx[i]]);

    const harm = {};
    for (const kk of [1, 2, 3, 4]) {
      const f = harmonicFit(v, doy, kk, 365.25);
      harm[kk] = score(v, (i) => Math.round(f(doy[i])));
    }
    out[k] = { constant: c, A, B, harm, lag1: lag1(v), stats: fieldStats(v) };
  }
  return out;
}

// ---------------------------------------------------------------- byte cost

export function byteCost(resid, constants) {
  const flat = [];
  for (const k of FIELDS) for (const x of resid[k]) flat.push(x === null ? 0 : x);
  const int8 = Buffer.from(flat.map((x) => x & 0xff));

  const centred = [];
  for (const k of FIELDS) for (const x of resid[k]) centred.push((x === null ? 0 : x) - constants[k]);
  const lo = Math.min(...centred), hi = Math.max(...centred);
  const fits4 = hi - lo <= 15;
  const nib = Buffer.alloc(Math.ceil(centred.length / 2));
  for (let i = 0; i < centred.length; i += 2) {
    const a = Math.max(0, Math.min(15, centred[i] - lo));
    const b2 = Math.max(0, Math.min(15, (centred[i + 1] ?? 0) - lo));
    nib[i / 2] = (a << 4) | b2;
  }
  const naive = Buffer.from(JSON.stringify(flat));
  return {
    int8: { raw: int8.length, gzip: gzipSync(int8, { level: 9 }).length, brotli: brotliCompressSync(int8).length },
    nibble: { raw: nib.length, gzip: gzipSync(nib, { level: 9 }).length, brotli: brotliCompressSync(nib).length, fits4, lo, hi },
    json: { raw: naive.length, brotli: brotliCompressSync(naive).length },
  };
}

export function naiveCost(days) {
  const obj = days.map((d) => ({ date: d.date, ...Object.fromEntries(FIELDS.map((k) => [k, `${String(Math.floor(d[k] / 60)).padStart(2, '0')}:${String(d[k] % 60).padStart(2, '0')}`])) }));
  const b = Buffer.from(JSON.stringify(obj));
  return { raw: b.length, gzip: gzipSync(b, { level: 9 }).length, brotli: brotliCompressSync(b).length };
}

export { FIELDS, mean, sd };
