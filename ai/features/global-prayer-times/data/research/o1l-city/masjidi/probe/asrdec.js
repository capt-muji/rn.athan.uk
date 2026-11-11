// Horizon-free recovery of the engine's declination from the ASR column.
// asr (Shafi, shadow factor 1): cot(alt) = 1 + tan|phi - dec|;  cos H = (sin alt - sin phi sin dec)/(cos phi cos dec)
// H = (asr - noon)/4 deg. Solve for dec given phi. Compare with the precise ephemeris.
const L = require('./fitlib');
const fs = require('fs');
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
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

function asrTime(dec, phi, factor) {
  const alt = Math.atan(1 / (factor + Math.tan(Math.abs(phi - dec) * D2R))) * R2D;
  const ch = (Math.sin(alt * D2R) - Math.sin(phi * D2R) * Math.sin(dec * D2R)) / (Math.cos(phi * D2R) * Math.cos(dec * D2R));
  if (ch > 1 || ch < -1) return null;
  return Math.acos(ch) * R2D / 15 * 60; // minutes after noon
}

function decFromAsr(dHmin, phi, factor) {
  let lo = -26, hi = 26;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const t = asrTime(mid, phi, factor);
    if (t == null) return NaN;
    if (t < dHmin) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

const META = JSON.parse(fs.readFileSync(__dirname + '/regions.json', 'utf8'));
for (const f of process.argv.slice(2)) {
  const id = f.match(/region_(\d+)\./)[1];
  const m = META[id] || { tz: 120 };
  const table = L.parseTable(f);
  const dates = Array.from({ length: table.length }, (_, i) => L.doyDate(i, true, YEAR));
  const trueDec = dates.map(d => sun(jdOf(d)).dec);
  // phi: fit so that implied dec from asr is closest to true dec
  function residFor(phi) {
    const r = [];
    for (let i = 0; i < table.length; i++) {
      const dH = table[i].Asr - table[i].Dhuhr;
      const dec = decFromAsr(dH, phi, 1);
      if (!isNaN(dec)) r.push(dec - trueDec[i]);
    }
    return r;
  }
  let best = { phi: 0, rms: 1e9 };
  for (let p = 5; p <= 60; p += 0.05) { const v = L.rms(residFor(p)); if (v < best.rms) best = { phi: p, rms: v }; }
  const r = residFor(best.phi);
  const mon = [];
  for (let mo = 0; mo < 12; mo++) {
    const v = [];
    for (let i = 0; i < table.length; i++) if (dates[i].getUTCMonth() === mo) { const dH = table[i].Asr - table[i].Dhuhr; const dec = decFromAsr(dH, best.phi, 1); if (!isNaN(dec)) v.push(dec - trueDec[i]); }
    mon.push(+(v.reduce((s, x) => s + x, 0) / v.length).toFixed(3));
  }
  console.log(JSON.stringify({ id: +id, country: m.country, phi: +best.phi.toFixed(2), decRmsAsr: +best.rms.toFixed(3), mean: +L.mean(r).toFixed(3), mon }));
}
