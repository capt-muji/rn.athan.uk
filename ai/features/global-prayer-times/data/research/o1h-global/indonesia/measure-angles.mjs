// Measures the depression angle Kemenag's own published minutes imply, per city and prayer.
// Inverts adhan's solar geometry numerically: angle -> instant -> wall clock.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ADHAN = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs';
const adhan = require(`${ADHAN}/Adhan.js`);
const SolarTime = require(`${ADHAN}/SolarTime.js`).default;
const { Coordinates } = adhan;

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, 'kemenag');

const CITIES = [
  { key: 'jakarta', zone: 'Asia/Jakarta', offset: 7 },
  { key: 'medan', zone: 'Asia/Jakarta', offset: 7 },
  { key: 'pontianak', zone: 'Asia/Pontianak', offset: 7 },
  { key: 'surabaya', zone: 'Asia/Makassar', offset: 8 },
  { key: 'makassar', zone: 'Asia/Makassar', offset: 8 },
  { key: 'jayapura', zone: 'Asia/Jayapura', offset: 9 },
];

const cityMeta = JSON.parse(readFileSync(join(DATA, 'cities.json'), 'utf8')).data;
const idByKey = {
  jakarta: 'cb2d6586-c0d9-48af-a8c2-fc3b886c7460',
  medan: '0e851335-9fdb-40a8-9429-a2a7938ca4df',
  pontianak: '8dec396b-cfa5-4f43-ad5e-363b87db0260',
  surabaya: '08099d8a-c291-4922-a848-0460a62a8018',
  makassar: '5fff1150-d39a-411f-b39d-af4314ce5355',
  jayapura: '555d572d-e33e-4bd4-b751-7da741969d30',
};

function utcHoursAtAngle(date, coords, angle, afterTransit) {
  const st = new SolarTime(date, coords);
  return st.hourAngle(-1 * angle, afterTransit);
}

function impliedAngle(date, coords, wallMinutes, offset, afterTransit) {
  const target = wallMinutes - offset * 60;
  const lo = 8;
  const hi = 26;
  const fLo = utcHoursAtAngle(date, coords, lo, afterTransit) * 60;
  const fHi = utcHoursAtAngle(date, coords, hi, afterTransit) * 60;
  if (!Number.isFinite(fLo) || !Number.isFinite(fHi)) return null;
  return lo + ((target - fLo) / (fHi - fLo)) * (hi - lo);
}

const parse = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

function q(values, p) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))];
}

const report = {};
for (const city of CITIES) {
  const meta = cityMeta.find((c) => c.id === idByKey[city.key]);
  const coords = new Coordinates(meta.latitude, meta.longitude);
  const file = JSON.parse(readFileSync(join(DATA, `${city.key}.json`), 'utf8'));
  const days = Object.keys(file.rows).sort();
  const fajrAngles = [];
  const ishaAngles = [];
  for (const iso of days) {
    const row = file.rows[iso];
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    const fa = impliedAngle(date, coords, parse(row.fajr), city.offset, false);
    const ia = impliedAngle(date, coords, parse(row.isha), city.offset, true);
    if (fa !== null && Math.abs(fa) < 60) fajrAngles.push(fa);
    if (ia !== null && Math.abs(ia) < 60) ishaAngles.push(ia);
  }
  const stat = (v) => (v.length
    ? { n: v.length, min: +q(v, 0.02).toFixed(2), p25: +q(v, 0.25).toFixed(2), median: +q(v, 0.5).toFixed(2), p75: +q(v, 0.75).toFixed(2), max: +q(v, 0.98).toFixed(2), mean: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) }
    : null);
  report[city.key] = {
    name: meta.name,
    lat: meta.latitude,
    lon: meta.longitude,
    elevation: meta.elevation,
    tzField: meta.timezone,
    zoneUsed: city.zone,
    fajrImpliedAngle: stat(fajrAngles),
    ishaImpliedAngle: stat(ishaAngles),
  };
  console.log(city.key.padEnd(10), 'fajr', JSON.stringify(report[city.key].fajrImpliedAngle), 'isha', JSON.stringify(report[city.key].ishaImpliedAngle));
}

writeFileSync(join(HERE, 'kemenag-implied-angles.json'), JSON.stringify(report, null, 1));
