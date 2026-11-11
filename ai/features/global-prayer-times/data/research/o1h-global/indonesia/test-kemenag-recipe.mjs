// Tests candidate Kemenag recipes against the ministry's own published minutes.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ADHAN = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs';
const adhan = require(`${ADHAN}/Adhan.js`);
const SolarTime = require(`${ADHAN}/SolarTime.js`).default;
const CP = require(`${ADHAN}/CalculationParameters.js`).default;
const Madhab = require(`${ADHAN}/Madhab.js`).Madhab;
const { Coordinates, PrayerTimes } = adhan;

const HERE = dirname(fileURLToPath(import.meta.url));
const CITIES = [
  { key: 'jakarta', offset: 7 },
  { key: 'medan', offset: 7 },
  { key: 'pontianak', offset: 7 },
  { key: 'surabaya', offset: 7 },
  { key: 'makassar', offset: 8 },
  { key: 'jayapura', offset: 9 },
];
const idByKey = {
  jakarta: 'cb2d6586-c0d9-48af-a8c2-fc3b886c7460',
  medan: '0e851335-9fdb-40a8-9429-a2a7938ca4df',
  pontianak: '8dec396b-cfa5-4f43-ad5e-363b87db0260',
  surabaya: '08099d8a-c291-4922-a848-0460a62a8018',
  makassar: '5fff1150-d39a-411f-b39d-af4314ce5355',
  jayapura: '555d572d-e33e-4bd4-b751-7da741969d30',
};
const cityMeta = JSON.parse(readFileSync(join(HERE, 'kemenag', 'cities.json'), 'utf8')).data;

const parse = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

function compute(lat, lon, date, offset, fajrAngle, ishaAngle, margins) {
  const params = new CP('Other', fajrAngle, ishaAngle, 0, 0);
  params.madhab = Madhab.Shafi;
  params.adjustments = { fajr: margins[0], sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: margins[1] };
  const pt = new PrayerTimes(new Coordinates(lat, lon), date, params);
  const wall = (d) => {
    const t = new Date(d.getTime() + offset * 3600000);
    return t.getUTCHours() * 60 + t.getUTCMinutes() + t.getUTCSeconds() / 60;
  };
  return { fajr: wall(pt.fajr), isha: wall(pt.isha) };
}

const RECIPES = [
  { key: '20/18 nearest, no margin', fajr: 20, isha: 18, margins: [0, 0], round: 'nearest' },
  { key: '20/18 +2 minutes both (ihtiyat)', fajr: 20, isha: 18, margins: [2, 2], round: 'nearest' },
];

const rnd = (v, mode) => (mode === 'down' ? Math.floor(v) : Math.floor(v + 0.5));

const report = {};
for (const city of CITIES) {
  const meta = cityMeta.find((c) => c.id === idByKey[city.key]);
  const rows = JSON.parse(readFileSync(join(HERE, 'kemenag', `${city.key}.json`), 'utf8')).rows;
  const days = Object.keys(rows).sort();
  report[city.key] = {};
  for (const r of RECIPES) {
    const dev = { fajr: [], isha: [] };
    let exactF = 0;
    let exactI = 0;
    for (const iso of days) {
      const [y, m, d] = iso.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d, 12));
      const got = compute(meta.latitude, meta.longitude, date, city.offset, r.fajr, r.isha, r.margins);
      const pf = parse(rows[iso].fajr);
      const pi = parse(rows[iso].isha);
      const gf = rnd(got.fajr, r.round);
      const gi = rnd(got.isha, r.round);
      dev.fajr.push(gf - pf);
      dev.isha.push(gi - pi);
      if (gf === pf) exactF += 1;
      if (gi === pi) exactI += 1;
    }
    const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
    const worst = (v) => Math.max(...v.map(Math.abs));
    report[city.key][r.key] = {
      fajrBias: +mean(dev.fajr).toFixed(2),
      ishaBias: +mean(dev.isha).toFixed(2),
      fajrWorst: worst(dev.fajr),
      ishaWorst: worst(dev.isha),
      fajrExact: +((100 * exactF) / days.length).toFixed(1),
      ishaExact: +((100 * exactI) / days.length).toFixed(1),
    };
  }
}

for (const city of CITIES) {
  console.log(`-- ${city.key}`);
  for (const [k, v] of Object.entries(report[city.key])) {
    console.log(`   ${k.padEnd(38)} fajr bias ${String(v.fajrBias).padStart(6)} worst ${String(v.fajrWorst).padStart(3)} exact ${String(v.fajrExact).padStart(5)}% | isha bias ${String(v.ishaBias).padStart(6)} worst ${String(v.ishaWorst).padStart(3)} exact ${String(v.ishaExact).padStart(5)}%`);
  }
}
writeFileSync(join(HERE, 'kemenag-recipe-test.json'), JSON.stringify(report, null, 1));
