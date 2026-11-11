// Month-span solar solve: latitude/longitude/maghrib caution from sunrise+maghrib only.
// Usage: node solve_month.mjs <rows.json> <tz> <lat0> <lon0>
import { readFileSync } from 'node:fs';
import { solarDay, hourAngle } from './solar.js';

const [, , path, tz, lat0s, lon0s] = process.argv;
const lat0 = Number(lat0s), lon0 = Number(lon0s);
const rows = JSON.parse(readFileSync(path, 'utf8'));
const toMin = (s) => { const m = /^(\d{1,2}):(\d{2})/.exec(s); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const tzOff = (key) => {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const p = Object.fromEntries(fmt.formatToParts(new Date(key + 'T12:00:00Z')).map((x) => [x.type, x.value]));
  return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - new Date(key + 'T12:00:00Z').getTime()) / 60000);
};
const days = Object.entries(rows).map(([key, r]) => {
  const [Y, M, D] = key.split('-').map(Number);
  const { dec, eotMin } = solarDay(Y, M, D);
  return { key, dec, eotMin, sr: toMin(r.sunrise), mg: toMin(r.maghrib), tzMin: tzOff(key) };
});
const rms = (a) => Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length);
const score = (lat, lon, k) => {
  const res = [];
  for (const d of days) {
    const noon = 720 + d.tzMin - d.eotMin - lon * 4;
    const hs = hourAngle(-0.833, lat, d.dec);
    if (hs === null) continue;
    res.push(d.sr - (noon - 4 * hs), d.mg - (noon + 4 * hs + k));
  }
  return res.length ? rms(res) : Infinity;
};
let best = null;
for (let k = 0; k <= 6; k++) {
  for (let lat = lat0 - 1.5; lat <= lat0 + 1.5; lat += 0.05) {
    for (let lon = lon0 - 2; lon <= lon0 + 2; lon += 0.05) {
      const r = score(lat, lon, k);
      if (!best || r < best.r) best = { lat, lon, k, r };
    }
  }
}
console.log(path, `lat ${best.lat.toFixed(2)} lon ${best.lon.toFixed(2)} k ${best.k} rms ${best.r.toFixed(2)} min`);
