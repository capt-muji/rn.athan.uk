// Pins the geometry a table was actually computed for: dhuhr gives longitude,
// sunrise gives latitude. Scans a fine grid and reports the residual minimum.
import { readFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const [, , file, lat0, lon0, latSpan, lonSpan] = process.argv;
const doc = JSON.parse(readFileSync(file, 'utf8'));
const rows = Object.entries(doc.rows ?? doc).sort((a, b) => a[0].localeCompare(b[0]));
const toMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
const params = CalculationMethod.Other();
params.fajrAngle = 18;
params.ishaAngle = 17;
params.madhab = Madhab.Shafi;
params.rounding = Rounding.None;

const spread = (lat, lon) => {
  const c = new Coordinates(lat, lon);
  const errs = [];
  for (const [date, r] of rows) {
    const [y, m, d] = date.split('-').map(Number);
    const t = new PrayerTimes(c, new Date(y, m - 1, d), params);
    const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
    errs.push(toMin(r.sunrise) - mins(t.sunrise));
  }
  const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
  return { mean, spread: errs.reduce((a, b) => a + Math.abs(b - mean), 0) / errs.length };
};

const L0 = Number(lat0);
const N0 = Number(lon0);
const LS = Number(latSpan ?? 0.3);
const NS = Number(lonSpan ?? 0.2);
let best = null;
for (let lat = L0 - LS; lat <= L0 + LS + 1e-9; lat += 0.01) {
  for (let lon = N0 - NS; lon <= N0 + NS + 1e-9; lon += 0.01) {
    const s = spread(lat, lon);
    if (!best || s.spread < best.spread) best = { lat: +lat.toFixed(2), lon: +lon.toFixed(2), ...s };
  }
}
// longitude that removes the residual at the best latitude
const bestLon = +(best.lon - best.mean / 4).toFixed(3);
console.log(JSON.stringify({ bestLatitude: best.lat, bestLongitudeGrid: best.lon, spread: +best.spread.toFixed(2), meanAtBest: +best.mean.toFixed(2), impliedLongitude: bestLon }, null, 1));
