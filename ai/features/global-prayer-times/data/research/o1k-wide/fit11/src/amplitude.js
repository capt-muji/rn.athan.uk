// Seasonal amplitude beside the between-year verdict: what the frozen recipe
// produces at Algiers across the year, and how far the printed span reaches.
import { readFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding, HighLatitudeRule } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const RECIPE = { fajrAngle: 17.8, ishaAngle: 16.1, madhab: Madhab.Shafi };
const SITE = { lat: 36.7538, lon: 3.0588 };

function raw(y, m, d) {
  const p = CalculationMethod.Other();
  p.fajrAngle = RECIPE.fajrAngle;
  p.ishaAngle = RECIPE.ishaAngle;
  p.madhab = RECIPE.madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  const t = new PrayerTimes(new Coordinates(SITE.lat, SITE.lon), new Date(y, m - 1, d), p);
  const f = (z) => z.getHours() * 60 + z.getMinutes() + z.getSeconds() / 60;
  return { fajr: f(t.fajr), sunrise: f(t.sunrise), dhuhr: f(t.dhuhr), asr: f(t.asr), magrib: f(t.maghrib), isha: f(t.isha) };
}

const months = [];
for (let m = 1; m <= 12; m++) months.push({ m, ...raw(2026, m, 15) });
const span = Object.fromEntries(PRAYERS.map((p) => [p, +(Math.max(...months.map((r) => r[p])) - Math.min(...months.map((r) => r[p]))).toFixed(1)]));
console.log('model at Algiers, 15th of each month (minutes since midnight):');
for (const r of months) console.log(` ${String(r.m).padStart(2, '0')}`, PRAYERS.map((p) => `${p} ${r[p].toFixed(1)}`).join('  '));
console.log('modelled annual span:', JSON.stringify(span));
console.log('Jan vs Jul fajr:', (months[0].fajr - months[6].fajr).toFixed(1), 'min');

// printed span in hand, both years
const toMin = (s) => Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]);
const files47 = ['dz-alger-1447-jumada1.json', 'dz-alger-1447-jumada2.json', 'dz-alger-1447-rajab.json', 'dz-alger-1447-ramadan.json'];
const rows = files47.flatMap((f) => Object.values(JSON.parse(readFileSync(f, 'utf8')).rows));
const key = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', magrib: 'maghrib', isha: 'isha' };
const printed = Object.fromEntries(PRAYERS.map((p) => [p, rows.map((r) => toMin(r[key[p]]))]));
console.log('\nprinted 1447 span (Oct-Mar only):', JSON.stringify(Object.fromEntries(PRAYERS.map((p) => [p, Math.max(...printed[p]) - Math.min(...printed[p])]))));
