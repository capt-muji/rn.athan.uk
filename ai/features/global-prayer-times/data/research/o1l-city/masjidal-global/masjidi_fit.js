// masjidi.app regional table fit. The tables are undated 366-row day-of-year arrays with
// no coordinates, so the clock offset and the longitude are not separable: the fit solves
// latitude from the day-length curve (clock-independent), reads the clock behaviour from
// the drift of the implied longitude, then measures the recipe.
//
// Usage: node masjidi_fit.js <region-file> <label>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { solarDay, hourAngle } from './solar.js';

const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const SIN_HORIZON = Math.sin(-0.833 * RAD);
const rad = (d) => d * RAD, deg = (r) => r * DEG;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] * 0.5 + s[Math.ceil((s.length - 1) / 2)] * 0.5 : null; };
const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);

const toMin = (s) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(s).trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

// Leap-year layout: 366 rows, index 0 = 1 January.
const LEAP = (() => {
  const out = [];
  const dim = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= dim[m - 1]; d++) out.push([m, d]);
  return out;
})();

function load(path) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const days = [];
  raw.forEach((r, i) => {
    if (i >= LEAP.length) return;
    const [M, D] = LEAP[i];
    const fajr = toMin(r.Fajr), sr = toMin(r.Sunrise), dhuhr = toMin(r.Dhuhr), asr = toMin(r.Asr), mg = toMin(r.Maghrib);
    let isha = toMin(r.Isha);
    if ([fajr, sr, dhuhr, asr, mg, isha].some((v) => v === null)) return;
    if (isha < mg) isha += 1440;
    const { dec, eotMin } = solarDay(2024, M, D);
    days.push({ i, month: M, dec, eotMin, fajr, sr, dhuhr, asr, mg, isha });
  });
  return days;
}

// Latitude from the sunrise/sunset curve alone; longitude and clock are read off separately.
function fitLat(days, kFixed) {
  const n = days.length;
  const sr = new Float64Array(n), mg = new Float64Array(n), dec = new Float64Array(n);
  for (let i = 0; i < n; i++) { sr[i] = days[i].sr; mg[i] = days[i].mg; dec[i] = days[i].dec; }
  const score = (lat, k) => {
    // noon midline spread and half-day-length agreement, both in one pass
    let mid = 0;
    for (let i = 0; i < n; i++) mid += (sr[i] + mg[i] - k) / 2;
    mid /= n;
    const res = new Float64Array(2 * n);
    let m = 0;
    for (let i = 0; i < n; i++) {
      const hs = hourAngle(-0.833, lat, dec[i]);
      if (hs === null) continue;
      res[m++] = (sr[i] + mg[i] - k) / 2 - mid;
      res[m++] = (mg[i] - k - sr[i]) / 2 - 4 * hs;
    }
    let s = 0;
    for (let i = 0; i < m; i++) s += res[i] * res[i];
    return Math.sqrt(s / m);
  };
  let best = null;
  const ks = kFixed === undefined ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [kFixed];
  for (const k of ks) for (let lat = -66; lat <= 66; lat += 0.5) {
    const r = score(lat, k);
    if (!best || r < best.r) best = { lat, k, r };
  }
  for (let lat = best.lat - 0.5; lat <= best.lat + 0.5 + 1e-9; lat += 0.02) {
    const r = score(lat, best.k);
    if (r < best.r) { best.lat = lat; best.r = r; }
  }
  return { lat: +best.lat.toFixed(3), k: best.k, rms: +best.r.toFixed(3) };
}

function impliedAngle(lat, dec, gapMin) {
  const sinLat = Math.sin(rad(lat)), cosLat = Math.cos(rad(lat));
  const sdec = Math.sin(rad(dec)), cdec = Math.cos(rad(dec));
  const cosHsr = (SIN_HORIZON - sinLat * sdec) / (cosLat * cdec);
  if (cosHsr < -1 || cosHsr > 1) return null;
  const h = deg(Math.acos(cosHsr)) + gapMin / 4;
  if (h > 180) return null;
  const alpha = -deg(Math.asin(sinLat * sdec + cosLat * cdec * Math.cos(rad(h))));
  const sens = 4 * Math.cos(rad(alpha)) / (cosLat * cdec * Math.sin(rad(h)));
  return sens >= 1 ? alpha : null;
}

function measureAngle(lat, days, gapFn) {
  const series = [];
  for (const d of days) {
    const a = impliedAngle(lat, d.dec, gapFn(d));
    if (a !== null) series.push({ month: d.month, alpha: a });
  }
  if (series.length < 150) return { kind: 'unmeasurable', n: series.length };
  const dark = lat >= 0 ? [11, 12, 1, 2] : [5, 6, 7, 8];
  const darkA = series.filter((x) => dark.includes(x.month)).map((x) => x.alpha).sort((a, b) => a - b);
  const iqr = darkA[Math.floor(darkA.length * 0.75)] - darkA[Math.floor(darkA.length * 0.25)];
  return { kind: iqr > 0.6 ? 'interval' : 'angle', n: series.length, angle: +median(series.map((x) => x.alpha)).toFixed(2), darkIqr: +iqr.toFixed(2) };
}

// The clock signature: the implied longitude per day at zero offset. A flat series is a
// fixed-offset clock; a 15-degree step is a DST switch.
function clockSignature(days, k) {
  const lon = days.map((d) => (720 - d.eotMin - (d.sr + d.mg - k) / 2) / 4);
  const med = median(lon);
  const resid = lon.map((x) => (x - med) * 4); // minutes of clock drift
  const runs = [];
  for (let i = 0; i < resid.length; i++) {
    const b = Math.round(resid[i] / 30) * 30;
    const last = runs[runs.length - 1];
    if (last && last.bucket === b) last.to = days[i].i; else runs.push({ from: days[i].i, bucket: b, to: days[i].i });
  }
  const steps = runs.filter((r) => r.bucket !== 0);
  return { lonImplied: +med.toFixed(2), offsetMin: +(med * 4).toFixed(0), driftRms: +rms(resid.map((x) => x - median(resid))).toFixed(1), runs: runs.length, steps };
}

const file = process.argv[2], label = process.argv[3] || file;
mkdirSync('out', { recursive: true });
const days = load(file);
if (!days.length) { console.log(`${label}\tNO_ROWS`); process.exit(0); }
const geo = fitLat(days, 0);
const geoK = fitLat(days, geo.k);
const g = geoK;
const fajr = measureAngle(g.lat, days, (d) => d.sr - d.fajr);
const isha = measureAngle(g.lat, days, (d) => d.isha - (d.mg - g.k));
const gap = median(days.map((d) => d.isha - d.mg));
const asr = (() => {
  // Shafi vs Hanafi from the shadow-ratio implied by the printed asr.
  let s1 = 0, s2 = 0, n = 0;
  for (const d of days) {
    const noon = d.dhuhr;
    const h1 = hourAngle(deg(Math.atan(1 / (1 + Math.tan(Math.abs(rad(g.lat) - rad(d.dec)))))), g.lat, d.dec);
    const h2 = hourAngle(deg(Math.atan(1 / (2 + Math.tan(Math.abs(rad(g.lat) - rad(d.dec)))))), g.lat, d.dec);
    if (h1 === null || h2 === null) continue;
    s1 += Math.abs(d.asr - (noon + 4 * h1)); s2 += Math.abs(d.asr - (noon + 4 * h2)); n++;
  }
  return { school: n && s2 < s1 * 0.5 ? 'Hanafi' : 'Shafi', shafiMae: +(s1 / n).toFixed(1), hanafiMae: +(s2 / n).toFixed(1) };
})();
const clk = clockSignature(days, g.k);
const janF = days.filter((d) => d.month === 1).map((d) => d.fajr);
const julF = days.filter((d) => d.month === 7).map((d) => d.fajr);
const rec = {
  label, file, rows: days.length, lat: g.lat, k: g.k, geoRms: g.rms,
  fajr, isha: { ...isha, gap: +gap.toFixed(1) }, asr, clock: clk,
  amplitude: janF.length && julF.length ? median(julF) - median(janF) : null,
};
writeFileSync(`out/mj_${label.replace(/[^A-Za-z0-9_-]/g, '_')}.json`, JSON.stringify(rec, null, 1));
console.log([label, `lat ${g.lat}`, `k${g.k}`, `rms ${g.rms}`, `fajr ${fajr.kind} ${fajr.angle}`,
  `isha ${isha.kind} ${isha.angle}${isha.kind === 'interval' ? ` int${Math.round(gap)}` : ''}`,
  `asr ${asr.school}`, `clock ${clk.offsetMin}min drift${clk.driftRms} steps${clk.steps.length}`,
  `amp ${rec.amplitude === null ? '-' : rec.amplitude.toFixed(0)}`].join('\t'));
