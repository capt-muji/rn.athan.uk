// One city, one process, one TZ. Scores every method against both Kemenag references.
// Parameter reference: dispatch coordinates, both sides.
// Printed reference: Kemenag's own city point, both sides, so a few kilometres of
// coordinate drift between the two points cannot be read as a recipe defect.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { METHODS, methodDay, ramadanSet } from '../sim/lib.mjs';

const require = createRequire(import.meta.url);
const ADHAN = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs';
const CP = require(`${ADHAN}/CalculationParameters.js`).default;
const Madhab = require(`${ADHAN}/Madhab.js`).Madhab;
const { Coordinates, PrayerTimes } = require(`${ADHAN}/Adhan.js`);

const HERE = dirname(fileURLToPath(import.meta.url));
const job = JSON.parse(readFileSync(process.argv[2], 'utf8'));

const seen = Intl.DateTimeFormat().resolvedOptions().timeZone;
const canonical = new Intl.DateTimeFormat('en-GB', { timeZone: job.tz }).resolvedOptions().timeZone;
if (seen !== canonical) {
  console.error(`TZ mismatch for ${job.key}: process ${seen}, job ${job.tz} (${canonical})`);
  process.exit(2);
}

const otherPair = () => {
  const p = new CP('Other', 20, 18, 0, 0);
  p.madhab = Madhab.Shafi;
  return p;
};

const CATALOGUE = [
  ...METHODS.filter((m) => m.id !== 'mabims'),
  { id: 'mabims', label: 'MABIMS (20/18)', fajr: 20, isha: 18, asr: 'shafi', build: otherPair, carrier: 'constructed Other' },
  { id: 'kemenag', label: 'Kemenag RI (20/18)', fajr: 20, isha: 18, asr: 'shafi', build: otherPair, carrier: 'constructed Other' },
];

const printRows = JSON.parse(readFileSync(join(HERE, 'kemenag', `${job.key}.json`), 'utf8')).rows;

const wallMin = (date, offset) => {
  const t = new Date(date.getTime() + offset * 3600000);
  return t.getUTCHours() * 60 + t.getUTCMinutes() + t.getUTCSeconds() / 60;
};

function pairAt(lat, lon, date, margins, ishaAngle = 18) {
  const params = new CP('Other', 20, ishaAngle, 0, 0);
  params.madhab = Madhab.Shafi;
  params.adjustments = { fajr: margins, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: margins };
  const pt = new PrayerTimes(new Coordinates(lat, lon), date, params);
  return { fajr: wallMin(pt.fajr, job.offset), isha: wallMin(pt.isha, job.offset) };
}

const parseHm = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
const nearest = (v) => Math.floor(v + 0.5);
const normalise = (d) => {
  let x = d % 1440;
  if (x > 720) x -= 1440;
  if (x < -720) x += 1440;
  return x;
};

const ramadan = ramadanSet([2026]);
const dates = [];
for (let d = new Date(Date.UTC(2026, 0, 1)); d.getUTCFullYear() === 2026; d.setUTCDate(d.getUTCDate() + 1)) {
  dates.push(d.toISOString().slice(0, 10));
}

const acc = {};
for (const m of CATALOGUE) acc[m.id] = { fajrParam: [], ishaParam: [], isha19: [], fajrPrinted: [], ishaPrinted: [] };
const replayCheck = { fajr: [], isha: [] };

for (const iso of dates) {
  const [y, mo, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, 12));
  const param = pairAt(job.lat, job.lon, date, 0);
  const param19 = pairAt(job.lat, job.lon, date, 0, 19);
  const printed = { fajr: parseHm(printRows[iso].fajr), isha: parseHm(printRows[iso].isha) };
  const replay = pairAt(job.kLat, job.kLon, date, 2);
  replayCheck.fajr.push(nearest(replay.fajr) - printed.fajr);
  replayCheck.isha.push(nearest(replay.isha) - printed.isha);

  for (const m of CATALOGUE) {
    const atDispatch = methodDay(m, job.lat, job.lon, date, ramadan.has(iso));
    const atKemenag = methodDay(m, job.kLat, job.kLon, date, ramadan.has(iso));
    acc[m.id].fajrParam.push(Math.abs(normalise(nearest(atDispatch.fajr) - nearest(param.fajr))));
    acc[m.id].ishaParam.push(Math.abs(normalise(nearest(atDispatch.isha) - nearest(param.isha))));
    acc[m.id].isha19.push(Math.abs(normalise(nearest(atDispatch.isha) - nearest(param19.isha))));
    acc[m.id].fajrPrinted.push(Math.abs(normalise(nearest(atKemenag.fajr) - printed.fajr)));
    acc[m.id].ishaPrinted.push(Math.abs(normalise(nearest(atKemenag.isha) - printed.isha)));
  }
}

function stats(values) {
  let sum = 0;
  let worst = 0;
  let within = 0;
  for (const x of values) {
    sum += x;
    if (x > worst) worst = x;
    if (x <= 2.0000001) within += 1;
  }
  return { n: values.length, mean: +(sum / values.length).toFixed(3), worst: +worst.toFixed(1), within2: +((100 * within) / values.length).toFixed(1) };
}

const cells = {};
for (const m of CATALOGUE) {
  cells[m.id] = {
    label: m.label,
    asrMatch: m.asr === 'shafi',
    vsParam: { fajr: stats(acc[m.id].fajrParam), isha: stats(acc[m.id].ishaParam), isha19: stats(acc[m.id].isha19) },
    vsPrinted: { fajr: stats(acc[m.id].fajrPrinted), isha: stats(acc[m.id].ishaPrinted) },
  };
}

writeFileSync(process.argv[3], JSON.stringify({
  key: job.key,
  name: job.name,
  region: job.region,
  tz: job.tz,
  offset: job.offset,
  lat: job.lat,
  lon: job.lon,
  kLat: job.kLat,
  kLon: job.kLon,
  kemenagFajrAngle: job.kemenagFajrAngle,
  kemenagIshaAngle: job.kemenagIshaAngle,
  days: dates.length,
  printedRecipeReplay: {
    fajr: stats(replayCheck.fajr.map(Math.abs)),
    isha: stats(replayCheck.isha.map(Math.abs)),
    exactFajr: +((100 * replayCheck.fajr.filter((x) => x === 0).length) / replayCheck.fajr.length).toFixed(1),
    exactIsha: +((100 * replayCheck.isha.filter((x) => x === 0).length) / replayCheck.isha.length).toFixed(1),
  },
  cells,
}, null, 1));
