// Basis survey: the depression angle Kemenag's published minutes imply, for every kab/kota.
// The zone offset is self-calibrated from dhuhr against solar transit, so a wrong timezone
// field in the ministry's own city record cannot corrupt the angle.
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
const API = 'https://bimasislam.kemenag.go.id/api/v1/public';
const DATES = ['2026-01-15', '2026-03-15', '2026-05-15', '2026-07-15', '2026-09-15', '2026-11-15'];

const cities = JSON.parse(readFileSync(join(HERE, 'kemenag', 'cities.json'), 'utf8')).data;

const parse = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

function hourAngleHours(date, coords, angle, after) {
  return new SolarTime(date, coords).hourAngle(-1 * angle, after);
}

function angleFromMinutes(date, coords, minutesFromMidnightUtc, after) {
  const lo = 6;
  const hi = 26;
  const a = hourAngleHours(date, coords, lo, after) * 60;
  const b = hourAngleHours(date, coords, hi, after) * 60;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return lo + ((minutesFromMidnightUtc - a) / (b - a)) * (hi - lo);
}

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
    } catch {}
    await new Promise((res) => setTimeout(res, 200 * (i + 1)));
  }
  return null;
}

const out = [];
let cursor = 0;
async function worker() {
  while (cursor < cities.length) {
    const i = cursor;
    cursor += 1;
    const city = cities[i];
    const coords = new Coordinates(city.latitude, city.longitude);
    const fajr = [];
    const isha = [];
    const offsets = [];
    for (const d of DATES) {
      const j = await get(`${API}/prayer-times?city_id=${city.id}&date=${d}`);
      if (!j?.data) continue;
      const [y, m, day] = d.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, day, 12));
      const transit = new SolarTime(date, coords).transit;
      if (!Number.isFinite(transit)) continue;
      const offset = Math.round((parse(j.data.dhuhr) - transit * 60) / 60);
      if (offset < 6 || offset > 10) continue;
      offsets.push(offset);
      const fa = angleFromMinutes(date, coords, parse(j.data.fajr) - offset * 60, false);
      const ia = angleFromMinutes(date, coords, parse(j.data.isha) - offset * 60, true);
      if (fa !== null && fa > 10 && fa < 30) fajr.push(fa);
      if (ia !== null && ia > 10 && ia < 30) isha.push(ia);
    }
    const med = (v) => (v.length ? [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)] : null);
    out.push({
      id: city.id,
      name: city.name,
      lat: +city.latitude.toFixed(3),
      lon: +city.longitude.toFixed(3),
      offset: med(offsets),
      timezoneField: city.timezone,
      fajr: med(fajr) === null ? null : +med(fajr).toFixed(2),
      isha: med(isha) === null ? null : +med(isha).toFixed(2),
      n: fajr.length,
    });
  }
}

await Promise.all(Array.from({ length: 12 }, worker));
out.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync(join(HERE, 'kemenag-basis-survey.json'), JSON.stringify(out, null, 1));

function hist(key) {
  const h = new Map();
  for (const r of out) {
    if (r[key] === null) continue;
    const k = (Math.round(r[key] * 2) / 2).toFixed(1);
    h.set(k, (h.get(k) || 0) + 1);
  }
  return [...h.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
}
console.log('cities', out.length);
console.log('fajr angle histogram', JSON.stringify(hist('fajr')));
console.log('isha angle histogram', JSON.stringify(hist('isha')));
const byOffset = {};
for (const r of out) {
  byOffset[r.offset] = byOffset[r.offset] || { n: 0, fajr: [], isha: [] };
  byOffset[r.offset].n += 1;
  if (r.fajr) byOffset[r.offset].fajr.push(r.fajr);
  if (r.isha) byOffset[r.offset].isha.push(r.isha);
}
for (const [o, v] of Object.entries(byOffset)) {
  const m = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : 'n/a');
  console.log(`offset +${o}: n=${v.n} fajr=${m(v.fajr)} isha=${m(v.isha)}`);
}
