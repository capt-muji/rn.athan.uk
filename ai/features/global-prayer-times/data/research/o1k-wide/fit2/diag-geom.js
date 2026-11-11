// Which geometry does the table actually carry? Scans latitude and longitude
// against the printed sunrise (its geometry depends on both, seasonally on lat).
import { readFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const [, , file, latS, lonS] = process.argv;
const doc = JSON.parse(readFileSync(file, 'utf8'));
const rows = doc.rows ?? doc;
const entries = Object.entries(rows).sort((a, b) => a[0].localeCompare(b[0]));
const toMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

const params = CalculationMethod.Other();
params.fajrAngle = 18;
params.ishaAngle = 17;
params.madhab = Madhab.Shafi;
params.rounding = Rounding.None;

const maeFor = (lat, lon, prayer) => {
  const c = new Coordinates(lat, lon);
  let sum = 0;
  const errs = [];
  for (const [date, r] of entries) {
    const [y, m, d] = date.split('-').map(Number);
    const t = new PrayerTimes(c, new Date(y, m - 1, d), params);
    const mins = prayer === 'sunrise' ? t.sunrise : t.dhuhr;
    const got = mins.getHours() * 60 + mins.getMinutes() + mins.getSeconds() / 60;
    const err = toMin(r[prayer]) - got;
    errs.push(err);
    sum += Math.abs(err);
  }
  const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
  const spread = errs.reduce((a, b) => a + Math.abs(b - mean), 0) / errs.length;
  return { mean: +mean.toFixed(2), spread: +spread.toFixed(2), mae: +(sum / errs.length).toFixed(2) };
};

const baseLat = Number(latS);
const baseLon = Number(lonS);
console.log('sunrise vs latitude (lon fixed at metadata):');
for (let lat = baseLat - 4; lat <= baseLat + 4.001; lat += 0.5) {
  const r = maeFor(lat, baseLon, 'sunrise');
  console.log(` lat ${lat.toFixed(2)} mean ${r.mean} spread ${r.spread}`);
}
console.log('sunrise vs longitude (lat fixed at metadata):');
for (let lon = baseLon - 0.6; lon <= baseLon + 0.601; lon += 0.1) {
  const r = maeFor(baseLat, lon, 'sunrise');
  console.log(` lon ${lon.toFixed(2)} mean ${r.mean} spread ${r.spread}`);
}
console.log('dhuhr vs longitude:');
for (let lon = baseLon - 0.6; lon <= baseLon + 0.601; lon += 0.1) {
  const r = maeFor(baseLat, lon, 'dhuhr');
  console.log(` lon ${lon.toFixed(2)} mean ${r.mean} spread ${r.spread}`);
}
