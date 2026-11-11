// Effective longitude of the printed subuh in the 2027 tables, solved per table by matching
// ceil(18 deg fajr) over the year. Compared against the zone's Lampiran B west point and,
// where one exists, its east (syuruk) point.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const { default: Coordinates } = await import(pathToFileURL(ADHAN + 'Coordinates.js'));
const { default: CalculationParameters } = await import(pathToFileURL(ADHAN + 'CalculationParameters.js'));
const { default: PrayerTimes } = await import(pathToFileURL(ADHAN + 'PrayerTimes.js'));

const TZ = 8 * 60;
const min = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const secOfDay = d => d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();

function fajrAt(lat, lon, iso) {
  const p = new CalculationParameters('Other', 18, 18);
  p.method = 'Other';
  p.madhab = 'shafi';
  p.rounding = 'none';
  const t = new PrayerTimes(new Coordinates(lat, lon), new Date(iso + 'T00:00:00Z'), p);
  return ((secOfDay(t.fajr) + TZ * 60) / 60) % 1440;
}

// Grid the longitude in 0.005 deg steps and keep the one with the most exact ceilings.
function solve(table, lat) {
  let best = null;
  for (let lon = 99.5; lon <= 119.5; lon += 0.005) {
    let exact = 0;
    for (const [iso, row] of Object.entries(table)) {
      if (Math.ceil(fajrAt(lat, lon, iso)) === min(row.fajr)) exact++;
    }
    if (!best || exact > best.exact) best = { lon: +lon.toFixed(3), exact };
  }
  return best;
}

const B = {
  // Lampiran B, decimal degrees
  'my-jawi-klptj-2027': { west: 101.383, east: 101.7583, name: 'Kg. Gedangsa / Cheras (syuruk)' },
  'my-jawi-labuan-2027': { west: 115.1397, east: 115.3428, name: 'Pulau Kuraman / Pulau Daat (syuruk)' },
};
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/between-year.json'), 'utf8'));
for (const slug of Object.keys(report.tables2027)) {
  const table = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', slug + '.json'), 'utf8'));
  const { lat, lon } = report.tables2027[slug].ownPoint;
  const s = solve(table, lat);
  const b = B[slug];
  console.log(slug.padEnd(32), `dhuhr point ${lon}  subuh point ${s.lon} (${s.exact}/365 exact)`,
    `  offset ${(s.lon - lon).toFixed(3)} deg`,
    b ? `  LampiranB west ${b.west} east ${b.east}` : '');
}
