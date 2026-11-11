// Angle identifiability check on the 2026 national harvest: is 18/18 the peak, and is
// KTN01's isha really 17 rather than 18?
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const { default: Coordinates } = await import(pathToFileURL(ADHAN + 'Coordinates.js'));
const { default: CalculationParameters } = await import(pathToFileURL(ADHAN + 'CalculationParameters.js'));
const { default: PrayerTimes } = await import(pathToFileURL(ADHAN + 'PrayerTimes.js'));

const TZ = 8 * 60;
const NAT = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/my-jakim-2026-all-zones.json'), 'utf8'));
const PTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/between-year.json'), 'utf8')).points2026;
const min = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const secOfDay = d => d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();

function time(point, iso, fajr, isha, col) {
  const p = new CalculationParameters('Other', fajr, isha);
  p.method = 'Other';
  p.madhab = 'shafi';
  p.rounding = 'none';
  const t = new PrayerTimes(new Coordinates(point.lat, point.lon), new Date(iso + 'T00:00:00Z'), p);
  return ((secOfDay(t[col === 'sunrise' ? 'sunrise' : col]) + TZ * 60) / 60) % 1440;
}

function tally(zone, col, fajr, isha, margin = 0) {
  let exact = 0;
  for (const [iso, row] of Object.entries(NAT[zone])) {
    exact += min(row[col]) === Math.ceil(time(PTS[zone], iso, fajr, isha, col) + margin) ? 1 : 0;
  }
  return exact;
}

const KEYS = ['KTN01', 'KTN02', 'JHR02', 'TRG01', 'KDH01', 'SWK08'];
console.log('isha angle sweep (exact/365, margin 0):');
console.log('zone     ' + [16.0, 16.5, 17.0, 17.5, 18.0, 18.5, 19.0].map(a => a.toFixed(1).padStart(5)).join(''));
for (const z of KEYS) {
  const row = [16.0, 16.5, 17.0, 17.5, 18.0, 18.5, 19.0]
    .map(a => String(tally(z, 'isha', 18, a)).padStart(5)).join('');
  console.log(z.padEnd(8) + row);
}

console.log('\nfajr angle sweep (exact/365, margin 0):');
console.log('zone     ' + [17.0, 17.5, 18.0, 18.5, 19.0, 19.5, 20.0].map(a => a.toFixed(1).padStart(5)).join(''));
for (const z of ['WLY01', 'SGR01', 'KTN01', 'SWK08', 'SBH05']) {
  const row = [17.0, 17.5, 18.0, 18.5, 19.0, 19.5, 20.0]
    .map(a => String(tally(z, 'fajr', a, 18)).padStart(5)).join('');
  console.log(z.padEnd(8) + row);
}
