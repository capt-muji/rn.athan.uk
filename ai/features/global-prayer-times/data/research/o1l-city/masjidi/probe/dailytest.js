// Daily-evaluation test: fit lat/lon/margin with the sun taken at the event
// versus at 0h UT of the civil day. Report both rms.
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
function fitModel(t, off, mode) {
  const dates = Array.from({ length: t.length }, (_, i) => L.doyDate(i, true, YEAR));
  const at0 = dates.map(d => sun(jd0(d)));
  const atEv = dates.map((d, i) => sun(jd0(d) + (((t[i].Sunrise + t[i].Maghrib) / 2 - off) / 1440)));
  const S = mode === 'daily' ? at0 : atEv;
  const cost = (lat, lon, x) => {
    const r = [];
    for (let i = 0; i < t.length; i++) {
      const n = 720 - S[i].eqt - 4 * (lon - off / 4);
      const H = ha(-0.833, lat, S[i].dec);
      if (H == null) return 1e9;
      r.push(n - H - x - t[i].Sunrise, n + H + x - t[i].Maghrib);
    }
    return L.rms(r);
  };
  let best = { rms: 1e9 };
  for (let lat = -55; lat <= 60; lat += 0.5) {
    let sum = 0;
    for (let i = 0; i < t.length; i++) sum += ((t[i].Sunrise + t[i].Maghrib) / 2) - (720 - S[i].eqt);
    const lon = off / 4 - (sum / t.length) / 4;
    for (let x = -6; x <= 6; x += 0.1) {
      const v = cost(lat, lon, x);
      if (v < best.rms) best = { rms: v, lat, lon, x };
    }
  }
  return best;
}
for (const f of process.argv.slice(2)) {
  const id = +f.match(/region_(\d+)\.json/)[1];
  const off = (meta[id] || {}).off ?? 120;
  const t = L.parseTable(f);
  const a = fitModel(t, off, 'event'), b = fitModel(t, off, 'daily');
  console.log(JSON.stringify({ id, event: +a.rms.toFixed(3), daily: +b.rms.toFixed(3), winner: a.rms < b.rms ? 'event' : 'daily', xEvent: +a.x.toFixed(1), xDaily: +b.x.toFixed(1) }));
}
