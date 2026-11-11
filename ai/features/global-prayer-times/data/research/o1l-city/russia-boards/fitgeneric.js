// Generic fitter: derive position from the solar anchors, fit the twilight angles
// against median-centred residuals, then measure the per-column offsets and score.
const path = require('path');
const L = require(path.join(process.env.HOME, 'athan-gitree/census/c23-russia/fit/lib'));
const S = require(path.join(process.env.HOME, 'athan-gitree/census/c23-russia/fit/solar'));

const DAY = 86400000;
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const dateOf = (iso) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), 12));
const median = (a) => {
  const s = [...a].sort((x, y) => x - y);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};

function model(lat, lon, iso, tz, fa, ia) {
  const p = L.params({ fajrAngle: fa, ishaAngle: ia });
  p.rounding = 'none';
  return L.times(lat, lon, dateOf(iso), p, tz);
}

// Solar-anchor position. `noonKey` is the column carrying solar noon.
function derivePosition(rows, tz, noonKey = 'dhuhr', seed = null) {
  const list = Object.entries(rows).filter(([, r]) => r.sunrise != null && r.maghrib != null && r[noonKey] != null);
  if (list.length < 30) return null;
  const cost = (lat, lon, step) => {
    let s = 0, n = 0;
    for (let i = 0; i < list.length; i += step) {
      const [iso, r] = list[i];
      const t = model(lat, lon, iso, tz, 18, 15);
      s += (t.sunrise - r.sunrise) ** 2 + (t.dhuhr - r[noonKey]) ** 2 + (t.maghrib - r.maghrib) ** 2;
      n += 1;
    }
    return s / n;
  };
  let lat, lon;
  if (seed) { [lat, lon] = seed; } else {
    let best = Infinity;
    for (let la = 42; la <= 70; la += 2) {
      for (let lo = 18; lo <= 180; lo += 4) {
        const c = cost(la, lo, 45);
        if (c < best) { best = c; lat = la; lon = lo; }
      }
    }
  }
  let best = cost(lat, lon, 7);
  let step = 0.2;
  while (step > 0.0005) {
    let moved = false;
    for (const [dl, dn] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const c = cost(lat + dl, lon + dn, 7);
      if (c < best) { best = c; lat += dl; lon += dn; moved = true; }
    }
    if (!moved) step /= 2;
  }
  return { lat, lon, rms: Math.sqrt(best) };
}

// Angle whose curve best explains the column once its constant offset is removed.
function fitAngle(rows, pos, tz, which, lo, hi, step, other) {
  // A 365-day city-year is sampled every other day for the angle search; the
  // winner is then scored on the full set by analyse().
  const all = Object.entries(rows).filter(([, r]) => r[which] != null);
  const list = all.length > 120 ? all.filter((_, i) => i % 2 === 0) : all;
  let best = { angle: null, mad: Infinity, n: 0 };
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const fa = which === 'fajr' ? a : other.fajr;
    const ia = which === 'isha' ? a : other.isha;
    const diffs = [];
    for (const [iso, r] of list) {
      const d = dateOf(iso);
      const nx = new Date(d.getTime() + DAY);
      const anchor = which === 'fajr' ? d : nx;
      if (!S.angleReachable(pos.lat, anchor, a)) continue;
      const t = model(pos.lat, pos.lon, iso, tz, fa, ia);
      if (t[which] == null) continue;
      const diff = r[which] - t[which];
      if (Math.abs(diff) > 120) continue;
      diffs.push(diff);
    }
    if (diffs.length < Math.min(20, all.length / 2)) continue;
    const med = median(diffs);
    const mad = diffs.reduce((s, x) => s + Math.abs(x - med), 0) / diffs.length;
    if (mad < best.mad) best = { angle: +a.toFixed(2), mad: +mad.toFixed(3), n: diffs.length };
  }
  return best;
}

function analyse(rows, pos, tz, angles, skip, useMedian = false) {
  const stats = Object.fromEntries(COLS.map((c) => [c, { raw: [] }]));
  for (const [iso, r] of Object.entries(rows)) {
    if (skip && skip.has(iso)) continue;
    const d = dateOf(iso);
    const nx = new Date(d.getTime() + DAY);
    if (!S.angleReachable(pos.lat, d, angles.fajr) || !S.angleReachable(pos.lat, nx, angles.isha)) continue;
    if (Math.abs(S.midnightAltitude(pos.lat, d) + 18) < 0.35) continue;
    if (Math.abs(S.midnightAltitude(pos.lat, nx) + 18) < 0.35) continue;
    const t = model(pos.lat, pos.lon, iso, tz, angles.fajr, angles.isha);
    for (const c of COLS) {
      if (r[c] == null || t[c] == null) continue;
      const diff = r[c] - t[c];
      if (Math.abs(diff) > 120) continue;
      stats[c].raw.push(diff);
    }
  }
  const out = {};
  for (const c of COLS) {
    const raw = stats[c].raw;
    const offset = raw.length ? (useMedian ? median(raw) : raw.reduce((s, x) => s + x, 0) / raw.length) : null;
    const resid = raw.map((x) => Math.abs(x - offset));
    out[c] = {
      n: raw.length,
      offset: offset == null ? null : +offset.toFixed(2),
      exact: raw.length ? +(100 * resid.filter((x) => x < 0.5).length / raw.length).toFixed(1) : null,
      w1: raw.length ? +(100 * resid.filter((x) => x <= 1.0001).length / raw.length).toFixed(1) : null,
      max: raw.length ? +Math.max(...resid).toFixed(1) : null,
      mae: raw.length ? +(resid.reduce((s, x) => s + x, 0) / raw.length).toFixed(2) : null,
    };
  }
  return out;
}

module.exports = { derivePosition, fitAngle, analyse, dateOf, COLS, median, model };
