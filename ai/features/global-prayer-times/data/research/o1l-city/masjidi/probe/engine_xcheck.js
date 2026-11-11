// Do PrayTimes v2 and adhan 4.4.6 differ from the NOAA series at this resolution?
// At identical coordinates, compare sunrise / dhuhr / asr across the year.
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
function ha(alt, lat, dec) {
  const P = lat * D2R, d = dec * D2R;
  const ch = (Math.sin(alt * D2R) - Math.sin(P) * Math.sin(d)) / (Math.cos(P) * Math.cos(d));
  if (ch > 1 || ch < -1) return null;
  return Math.acos(ch) * R2D / 15 * 60;
}
const meta = JSON.parse(fs.readFileSync(__dirname + '/../data/table_meta.json', 'utf8'));
const rec = Object.fromEntries(JSON.parse(fs.readFileSync(__dirname + '/../out/recipes.json', 'utf8')).map(r => [r.id, r]));
for (const f of process.argv.slice(2)) {
  const id = +f.match(/region_(\d+)\.json/)[1];
  const off = (meta[id] || {}).off ?? 120;
  const r = rec[id];
  const dates = Array.from({ length: 366 }, (_, i) => L.doyDate(i, true, YEAR));
  const dNoaa = [], dPt = [], dAd = [];
  for (let i = 0; i < 366; i += 3) {
    const d = dates[i], dec = sun(jd0(d)).dec, eqt = sun(jd0(d)).eqt;
    const n = 720 - eqt - 4 * (r.lon - off / 4);
    const H = ha(-0.833, r.lat, dec);
    const mine = { Sunrise: n - H, Dhuhr: n, Asr: n + ha(Math.atan(1 / (1 + Math.tan(Math.abs(r.lat - dec) * D2R))) * R2D, r.lat, dec) };
    const pt = L.prayTimesTimes(r.lat, r.lon, d, off, { fajrAngle: 18, ishaAngle: 18 });
    const ad = L.adhanTimes(r.lat, r.lon, d, off, { fajrAngle: 18, ishaAngle: 18 });
    for (const k of ['Sunrise', 'Dhuhr', 'Asr']) { dPt.push(pt[k] - mine[k]); dAd.push(ad[k] - mine[k]); }
  }
  console.log(JSON.stringify({ id, prayTimesVsNoaa: +L.rms(dPt).toFixed(3), adhanVsNoaa: +L.rms(dAd).toFixed(3) }));
}
