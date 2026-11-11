// Recover the implied solar declination and EoT from a table's own sunrise/maghrib/dhuhr
// columns, then compare against a precise ephemeris. Engine-agnostic.
const L = require('./fitlib');
const path = process.argv[2];
const off = Number(process.argv[3] || 120);
const year = Number(process.argv[4] || 2028);
const table = L.parseTable(path);
const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const dates = Array.from({ length: table.length }, (_, i) => L.doyDate(i, leap, year));
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const H0 = -0.833 * D2R;

// precise ephemeris (NOAA low-precision, <0.01 deg)
function sun(jd) {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) * D2R;
  const q = 280.459 + 0.98564736 * D;
  const Ls = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
  const e = (23.439 - 0.00000036 * D) * D2R;
  const dec = Math.asin(Math.sin(e) * Math.sin(Ls));
  let ra = Math.atan2(Math.cos(e) * Math.sin(Ls), Math.cos(Ls)) / D2R;
  ra = ((ra % 360) + 360) % 360;
  let eqt = q - ra;
  eqt = ((eqt + 180) % 360 + 360) % 360 - 180; // minutes
  return { dec: dec * R2D, eqt: eqt * 4 };
}
function jdOf(date, hourFrac) {
  return date.getTime() / 86400000 + 2440587.5 + hourFrac / 24;
}

// implied declination from half-day at latitude phi
function decImplied(halfMin, phi, h0 = H0) {
  const H = (halfMin / 4) * D2R; // hour angle in rad
  const p = phi * D2R;
  const c = (Math.sin(h0) - Math.sin(p) * Math.sin(0)) / 1; // unused
  // cos H = (sin h0 - sin phi sin dec)/(cos phi cos dec)
  // solve: sin h0 = sin phi sin dec + cos phi cos dec cos H = cos(phi - dec)*... use identity
  // sin h0 = cos(phi-dec) - cos phi cos dec (1-cos H)... do numeric solve
  let lo = -25, hi = 25;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const d = mid * D2R;
    const ch = (Math.sin(h0) - Math.sin(p) * Math.sin(d)) / (Math.cos(p) * Math.cos(d));
    const Hc = Math.acos(Math.max(-1, Math.min(1, ch)));
    if (Hc > H) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

// best latitude: minimise rms of (decImplied - decTrue)
function score(phi) {
  const r = [];
  for (let i = 0; i < table.length; i++) {
    const half = (table[i].Maghrib - table[i].Sunrise) / 2;
    const jd = jdOf(dates[i], 12);
    const s = sun(jd);
    r.push(decImplied(half, phi) - s.dec);
  }
  return { rms: L.rms(r), res: r };
}
let best = { phi: 0, rms: 1e9 };
for (let p = -60; p <= 60; p += 0.25) { const s = score(p); if (s.rms < best.rms) best = { phi: p, rms: s.rms }; }
const s = score(best.phi);

// implied EoT from noon: noon_clock = 12:00 - 4*(lon-15*tz)/15*... derive eqt + lon offset combined
const dnoon = [];
for (let i = 0; i < table.length; i++) {
  const noonT = (table[i].Sunrise + table[i].Maghrib) / 2 + 0.5; // centre of disc => true noon approx
  const jd = jdOf(dates[i], 12);
  const eqt = sun(jd).eqt;
  const lonTerm = 4 * (12 * 60 - noonT) / 60; // minutes of longitude-equivalent
  dnoon.push(eqt - lonTerm);
}

const out = { phi: best.phi, decResidRms: +best.rms.toFixed(3), monthly: {}, eqtOffsetMonthly: {} };
for (let m = 0; m < 12; m++) {
  const idx = [];
  for (let i = 0; i < table.length; i++) if (dates[i].getUTCMonth() === m) idx.push(i);
  const avg = a => +(idx.reduce((x, i) => x + a[i], 0) / idx.length).toFixed(3);
  out.monthly[m + 1] = avg(s.res);
  out.eqtOffsetMonthly[m + 1] = avg(dnoon);
}
console.log(JSON.stringify(out, null, 1));
