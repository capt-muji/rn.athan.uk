// Mean sunrise / maghrib residual at the STANDARD horizon (-0.833), per table,
// with lat/lon fitted. A constant-angle correction scales with latitude; a
// constant-minutes convention does not.
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
const jd0 = d => d.getTime() / 86400000 + 2440587.5;
const META = JSON.parse(fs.readFileSync(__dirname + '/regions.json', 'utf8'));
for (const f of process.argv.slice(2)) {
  const id = f.match(/region_(\d+)\./)[1];
  const m = META[id] || { tz: 120 };
  const table = L.parseTable(f);
  const dates = Array.from({ length: table.length }, (_, i) => L.doyDate(i, true, YEAR));
  const dec = dates.map(d => sun(jd0(d)).dec);
  const eqt = dates.map(d => sun(jd0(d)).eqt);
  let best = { phi: 0, lon: 0, rms: 1e9 };
  for (let p = 5; p <= 62; p += 0.25) {
    // lon from mean noon
    let s = 0;
    for (let i = 0; i < table.length; i++) s += (table[i].Sunrise + table[i].Maghrib) / 2 - (720 - eqt[i] - (0 - m.tz) / 15 * 60 * 0);
    // analytic: noon = 720 - eqt - 4*(lon - tz)
    let sum = 0;
    for (let i = 0; i < table.length; i++) sum += ((table[i].Sunrise + table[i].Maghrib) / 2) - (720 - eqt[i]);
    const lon = -(sum / table.length) / 4 + m.tz / 4;
    const r = [];
    for (let i = 0; i < table.length; i++) {
      const pp = p * D2R, d = dec[i] * D2R;
      const ch = (Math.sin(-0.833 * D2R) - Math.sin(pp) * Math.sin(d)) / (Math.cos(pp) * Math.cos(d));
      const H = Math.acos(Math.max(-1, Math.min(1, ch))) * R2D / 15;
      const noon = 720 - eqt[i] - 4 * (lon - m.tz / 4) * 1;
      r.push((noon - H * 60) - table[i].Sunrise, (noon + H * 60) - table[i].Maghrib);
    }
    const v = L.rms(r);
    if (v < best.rms) best = { phi: p, lon, rms: v, r };
  }
  const ds = [], dm = [];
  for (let i = 0; i < best.r.length; i += 2) { ds.push(best.r[i]); dm.push(best.r[i + 1]); }
  console.log(JSON.stringify({ id: +id, country: m.country, phi: +best.phi.toFixed(2), lon: +best.lon.toFixed(2), rms: +best.rms.toFixed(2), meanSunrise: +L.mean(ds).toFixed(2), meanMaghrib: +L.mean(dm).toFixed(2) }));
}
