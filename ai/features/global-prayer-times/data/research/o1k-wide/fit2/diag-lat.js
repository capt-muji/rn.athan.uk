import { readFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';
const [, , file, latS, lonS] = process.argv;
const doc = JSON.parse(readFileSync(file, 'utf8'));
const rows = doc.rows ?? doc;
const entries = Object.entries(rows).sort((a, b) => a[0].localeCompare(b[0]));
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const params = CalculationMethod.Other();
params.fajrAngle = 18; params.ishaAngle = 17; params.madhab = Madhab.Shafi; params.rounding = Rounding.None;
const spreadFor = (lat, lon) => {
  const c = new Coordinates(lat, lon);
  const errs = [];
  for (const [date, r] of entries) {
    const [y, m, d] = date.split('-').map(Number);
    const t = new PrayerTimes(c, new Date(y, m - 1, d), params);
    const got = t.sunrise.getHours() * 60 + t.sunrise.getMinutes() + t.sunrise.getSeconds() / 60;
    errs.push(toMin(r.sunrise) - got);
  }
  const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
  return { mean: +mean.toFixed(2), spread: +(errs.reduce((a, b) => a + Math.abs(b - mean), 0) / errs.length).toFixed(2) };
};
const lat0 = Number(latS), lon0 = Number(lonS);
const scored = [];
for (let lat = lat0 - 2; lat <= 30.001; lat += 0.25) {
  const s = spreadFor(lat, lon0);
  scored.push({ lat: +lat.toFixed(2), ...s });
}
scored.sort((a, b) => a.spread - b.spread);
console.log('best 8 latitudes by sunrise spread:', JSON.stringify(scored.slice(0, 8)));
