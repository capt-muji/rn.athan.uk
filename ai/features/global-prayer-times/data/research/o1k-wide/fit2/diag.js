// Diagnostic: is a table shifted by a day, or off by a constant? Compares the
// table against the computation under lag -2..+2 and prints residuals by month.
import { readFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const toMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

const [, , file, latS, lonS, fajrS, ishaS] = process.argv;
const doc = JSON.parse(readFileSync(file, 'utf8'));
const rows = doc.rows ?? doc;
const entries = Object.entries(rows).sort((a, b) => a[0].localeCompare(b[0]));

const params = CalculationMethod.Other();
params.fajrAngle = Number(fajrS ?? 18);
params.ishaAngle = Number(ishaS ?? 17);
params.madhab = Madhab.Shafi;
params.rounding = Rounding.None;
const c = new Coordinates(Number(latS), Number(lonS));

const compute = (dateStr, lag) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new PrayerTimes(c, new Date(y, m - 1, d + lag), params);
  const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  return { fajr: mins(t.fajr), sunrise: mins(t.sunrise), dhuhr: mins(t.dhuhr), asr: mins(t.asr), magrib: mins(t.maghrib), isha: mins(t.isha) };
};

for (const lag of [-2, -1, 0, 1, 2]) {
  const res = PRAYERS.map((p) => {
    const errs = entries.map(([date, r]) => r[p] ? toMin(r[p]) - compute(date, lag)[p] : null).filter((v) => v !== null);
    const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
    const mae = errs.reduce((a, b) => a + Math.abs(b - mean), 0) / errs.length;
    const worst = Math.max(...errs.map((e) => Math.abs(e - mean)));
    return `${p} mean ${mean.toFixed(2)} spread ${mae.toFixed(2)} worst ${worst.toFixed(2)}`;
  });
  console.log(`lag ${lag}`);
  for (const line of res) console.log('  ' + line);
}

// monthly residual means at lag 0, sunrise and isha
console.log('\nmonthly residual mean (lag 0): month sunrise isha fajr asr');
const byMonth = {};
for (const [date, r] of entries) {
  const k = date.slice(0, 7);
  const raw = compute(date, 0);
  byMonth[k] ??= [];
  byMonth[k].push({ sunrise: toMin(r.sunrise) - raw.sunrise, isha: toMin(r.isha) - raw.isha, fajr: toMin(r.fajr) - raw.fajr, asr: toMin(r.asr) - raw.asr });
}
for (const [k, v] of Object.entries(byMonth)) {
  const avg = (key) => (v.reduce((a, b) => a + b[key], 0) / v.length).toFixed(1);
  console.log(k, avg('sunrise'), avg('isha'), avg('fajr'), avg('asr'));
}
