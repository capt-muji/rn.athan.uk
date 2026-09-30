// Solar harness for R5. Self-contained implementation of the USNO low-precision
// solar algorithm published at praytimes.org/docs/calculation. Reimplemented from
// R1's description; no third-party library, nothing installed into the repository.
//
// Forward: compute a prayer time from a depression angle or Asr shadow factor.
// Inverse: recover the depression angle or shadow factor a published time implies.
//
// Validated by reproducing the Egyptian General Authority of Survey's own published
// Cairo row for 2026-09-30 to the minute on all six times (see R5 report).

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
export const sin = d => Math.sin(d * D2R);
export const cos = d => Math.cos(d * D2R);
export const tan = d => Math.tan(d * D2R);
const asin = x => Math.asin(x) * R2D;
const acos = x => Math.acos(x) * R2D;
const atan2 = (y, x) => Math.atan2(y, x) * R2D;
const acot = x => Math.atan(1 / x) * R2D;
export const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };

export function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

export function sunPosition(jd) {
  const dd = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * dd, 360);
  const q = fix(280.459 + 0.98564736 * dd, 360);
  const L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360);
  const e = 23.439 - 0.00000036 * dd;
  let RA = atan2(cos(e) * sin(L), cos(L)) / 15;
  RA = fix(RA, 24);
  return { eqt: fix(q / 15 - RA + 12, 24) - 12, decl: asin(sin(e) * sin(L)) };
}

export function midDay(y, m, d, lng, tz) {
  let t = 12;
  for (let i = 0; i < 4; i++) t = 12 - sunPosition(julian(y, m, d) + (t - tz) / 24).eqt + tz - lng / 15;
  return t;
}

export function declAt(y, m, d, tz, t) { return sunPosition(julian(y, m, d) + (t - tz) / 24).decl; }

function span(alt, lat, decl) {
  const c = (sin(alt) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
  if (c > 1 || c < -1) return null;
  return acos(c) / 15;
}

// dir -1 for morning events, +1 for evening events. ang is degrees BELOW the horizon.
export function timeAtAngle(y, m, d, lat, lng, tz, ang, dir) {
  const noon = midDay(y, m, d, lng, tz);
  let t = noon + dir * 6;
  for (let i = 0; i < 5; i++) {
    const s = span(-ang, lat, declAt(y, m, d, tz, t));
    if (s === null) return null;
    t = noon + dir * s;
  }
  return t;
}

export function asrTime(y, m, d, lat, lng, tz, factor) {
  const noon = midDay(y, m, d, lng, tz);
  let t = noon + 3;
  for (let i = 0; i < 5; i++) {
    const decl = declAt(y, m, d, tz, t);
    const s = span(acot(factor + tan(Math.abs(lat - decl))), lat, decl);
    if (s === null) return null;
    t = noon + s;
  }
  return t;
}

// Inversion: what depression angle does this published clock time imply?
export function angleAtTime(y, m, d, lat, lng, tz, t) {
  const decl = declAt(y, m, d, tz, t);
  const H = (t - midDay(y, m, d, lng, tz)) * 15;
  return -asin(sin(decl) * sin(lat) + cos(decl) * cos(lat) * cos(H));
}

// Inversion: what Asr shadow factor does this published clock time imply?
export function asrFactorAtTime(y, m, d, lat, lng, tz, t) {
  const decl = declAt(y, m, d, tz, t);
  const H = (t - midDay(y, m, d, lng, tz)) * 15;
  const alt = asin(sin(decl) * sin(lat) + cos(decl) * cos(lat) * cos(H));
  return 1 / tan(alt) - tan(Math.abs(lat - decl));
}

export const hm = t => {
  if (t === null) return '--:--';
  const x = fix(t + 0.5 / 60, 24), h = Math.floor(x);
  return String(h).padStart(2, '0') + ':' + String(Math.floor((x - h) * 60)).padStart(2, '0');
};
export const toH = s => { const p = String(s).trim().split(':'); return +p[0] + (+p[1]) / 60; };

// Invert a whole published row into the convention it implies.
export function invertRow({ y, m, d, lat, lng, tz, fajr, sunrise, dhuhr, asr, maghrib, isha }) {
  const noon = midDay(y, m, d, lng, tz);
  const out = {};
  if (fajr) out.fajrAngle = +angleAtTime(y, m, d, lat, lng, tz, toH(fajr)).toFixed(2);
  if (sunrise) out.sunriseAngle = +angleAtTime(y, m, d, lat, lng, tz, toH(sunrise)).toFixed(2);
  if (dhuhr) out.dhuhrOffsetMin = +((toH(dhuhr) - noon) * 60).toFixed(1);
  if (asr) out.asrFactor = +asrFactorAtTime(y, m, d, lat, lng, tz, toH(asr)).toFixed(3);
  if (maghrib) {
    out.maghribAngle = +angleAtTime(y, m, d, lat, lng, tz, toH(maghrib)).toFixed(2);
    out.maghribMinusSunsetMin = Math.round((toH(maghrib) - timeAtAngle(y, m, d, lat, lng, tz, 0.833, 1)) * 60);
  }
  if (isha) {
    out.ishaAngle = +angleAtTime(y, m, d, lat, lng, tz, toH(isha)).toFixed(2);
    if (maghrib) out.ishaAfterMaghribMin = Math.round((toH(isha) - toH(maghrib)) * 60);
  }
  return out;
}
