// Measure the engine's implied horizon from the SUNRISE column alone.
// Given phi and the precise declination, h0_implied = asin(sin phi sin dec + cos phi cos dec cos H)
// with H = (noon - sunrise)/4 deg, noon from the table's own (sunrise+maghrib)/2.
// If h0_implied is flat across the year, the engine uses a fixed non-standard horizon.
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

const META = JSON.parse(fs.readFileSync(__dirname + '/regions.json', 'utf8'));
for (const f of process.argv.slice(2)) {
  const id = f.match(/region_(\d+)\./)[1];
  const m = META[id] || { tz: 120 };
  const table = L.parseTable(f);
  const dates = Array.from({ length: table.length }, (_, i) => L.doyDate(i, true, YEAR));
  const dec = dates.map(d => sun(jdOf(d)).dec);
  function h0series(phi) {
    const out = [];
    for (let i = 0; i < table.length; i++) {
      const noon = (table[i].Sunrise + table[i].Maghrib) / 2;
      const H = ((noon - table[i].Sunrise) / 4) * D2R;
      const p = phi * D2R, d = dec[i] * D2R;
      const v = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H);
      out.push(Math.asin(Math.max(-1, Math.min(1, v))) * R2D);
    }
    return out;
  }
  // phi minimising the seasonal spread of h0
  let best = { phi: 0, sd: 1e9 };
  for (let p = 5; p <= 62; p += 0.05) {
    const s = h0series(p);
    const mu = L.mean(s);
    const sd = L.rms(s.map(x => x - mu));
    if (sd < best.sd) best = { phi: p, sd };
  }
  const s = h0series(best.phi);
  const mon = [];
  for (let mo = 0; mo < 12; mo++) {
    const v = [];
    for (let i = 0; i < table.length; i++) if (dates[i].getUTCMonth() === mo) v.push(s[i]);
    mon.push(+(v.reduce((a, b) => a + b, 0) / v.length).toFixed(3));
  }
  console.log(JSON.stringify({ id: +id, country: m.country, phi: +best.phi.toFixed(2), h0mean: +L.mean(s).toFixed(3), h0sd: +L.rms(s.map(x => x - L.mean(s))).toFixed(3), mon }));
}
