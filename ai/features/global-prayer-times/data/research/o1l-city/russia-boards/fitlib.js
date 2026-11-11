const fs = require('fs');
const path = require('path');
const HOME = process.env.HOME;
const L = require(path.join(HOME, 'athan-gitree/census/c23-russia/fit/lib'));
const S = require(path.join(HOME, 'athan-gitree/census/c23-russia/fit/solar'));

const TZ = 'Asia/Yekaterinburg';
const DAY = 86400000;

const dateOf = (iso) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), 12));
const mdl = (lat, lon, date, p) => L.times(lat, lon, date, p, TZ);

function params(fajrAngle, ishaAngle) {
  const p = L.params({ fajrAngle, ishaAngle });
  p.rounding = 'none';
  return p;
}

// Days the publisher replaces the twilight column with a fixed solar offset.
function substituteDays(recs, offsetMin) {
  const out = new Set();
  for (const [iso, r] of Object.entries(recs)) {
    if (r.fajr == null || r.sunrise == null) continue;
    if (Math.abs(r.fajr - (r.sunrise - offsetMin)) <= 0.5) out.add(iso);
  }
  return out;
}

function score(recs, lat, lon, p, cols, skip) {
  const res = {};
  for (const c of cols) res[c] = { n: 0, exact: 0, within1: 0, sumAbs: 0, worst: 0 };
  for (const [iso, r] of Object.entries(recs)) {
    if (skip && skip.has(iso)) continue;
    const date = dateOf(iso);
    if (!S.angleReachable(lat, date, p.fajrAngle)) continue;
    const nx = new Date(date.getTime() + DAY);
    if (!S.angleReachable(lat, nx, p.ishaAngle)) continue;
    const m = mdl(lat, lon, date, p);
    for (const c of cols) {
      const pub = r[c];
      if (pub == null) continue;
      const ref = c === 'zawal' ? m.dhuhr : m[c];
      if (ref == null) continue;
      const d = Math.abs(pub - ref);
      if (d > 120) continue;
      const s = res[c];
      s.n += 1;
      s.sumAbs += d;
      if (d < 0.5) s.exact += 1;
      if (d <= 1.0001) s.within1 += 1;
      if (d > s.worst) s.worst = d;
    }
  }
  for (const c of cols) {
    const s = res[c];
    s.mae = s.n ? +(s.sumAbs / s.n).toFixed(3) : null;
    s.pctExact = s.n ? +(100 * s.exact / s.n).toFixed(2) : null;
    s.pctWithin1 = s.n ? +(100 * s.within1 / s.n).toFixed(2) : null;
    s.worst = +s.worst.toFixed(2);
    delete s.sumAbs; delete s.exact; delete s.within1;
  }
  return res;
}

// Grid-search one angle while the other is held; score = MAE over winter days.
function fitOne(recs, lat, lon, which, lo, hi, step, other) {
  let best = { angle: null, mae: Infinity };
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const fa = which === 'fajr' ? a : other.fajr;
    const ia = which === 'isha' ? a : other.isha;
    const p = params(fa, ia);
    let sum = 0, n = 0;
    for (const [iso, r] of Object.entries(recs)) {
      const date = dateOf(iso);
      if (!S.angleReachable(lat, date, fa)) continue;
      const nx = new Date(date.getTime() + DAY);
      if (!S.angleReachable(lat, nx, ia)) continue;
      const pub = r[which];
      if (pub == null) continue;
      const ref = mdl(lat, lon, date, p)[which];
      if (ref == null) continue;
      const d = Math.abs(pub - ref);
      if (d > 120) continue;
      sum += d; n += 1;
    }
    if (!n) continue;
    const mae = sum / n;
    if (mae < best.mae) best = { angle: +a.toFixed(2), mae: +mae.toFixed(3), n };
  }
  return best;
}

module.exports = { params, score, fitOne, substituteDays, dateOf };
