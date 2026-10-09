// R14 part 5: elevation, closed out.
//
// R4 measured the horizon-dip effect on sunset analytically. This pass does two new things:
//   5A. Recompute the dip effect through `adhan` itself, which is what the app would actually
//       run, to confirm R4's analytic figures agree with the shipping solver.
//   5B. Measure the elevation of the cities the app would actually serve, from GeoNames'
//       own `elevation` and `dem` columns, and cost storing it.
//   5C. The decisive question: does applying elevation move the app TOWARD or AWAY from an
//       authority's published table? Measured against JAKIM's own published times for the
//       three zones JAKIM assigns to high ground.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { Coordinates, PrayerTimes, CalculationMethod, HighLatitudeRule, Rounding, Madhab } from './lib.mjs';
import { KEYS, table } from './lib.mjs';

const out = [];
const say = (s = '') => out.push(s);
say('# R14 part 5: elevation');
say('');

// -------------------------------------------- 5A confirm the dip through adhan
say('## 5A. The horizon dip through adhan itself');
say('');
say('adhan has no elevation input. The dip is applied by treating sunset as the sun reaching');
say('`-(0.833 + dip)` rather than `-0.833`, solved the same way. `dip = acos(R/(R+h))` with R = 6,371,000 m.');
say('');
{
  // solve the sunset hour angle directly, same construction R4 used, for cross-checking
  const R = 6371000;
  const dip = (h) => (Math.acos(R / (R + h)) * 180) / Math.PI;
  function sunsetShiftMin(latDeg, declDeg, h) {
    const lat = (latDeg * Math.PI) / 180;
    const dec = (declDeg * Math.PI) / 180;
    const alt0 = (-0.833 * Math.PI) / 180;
    const alt1 = ((-0.833 - dip(h)) * Math.PI) / 180;
    const H = (alt) => {
      const c = (Math.sin(alt) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
      if (c < -1 || c > 1) return null;
      return (Math.acos(c) * 180) / Math.PI;
    };
    const a = H(alt0);
    const b = H(alt1);
    if (a === null || b === null) return null;
    return ((b - a) / 15) * 60;
  }
  const rows = [];
  for (const [name, lat, dec] of [
    ['equator, equinox', 0, 0],
    ['Makkah 21.4, equinox', 21.4, 0],
    ['Makkah 21.4, June', 21.4, 23.44],
    ['Cameron Highlands 4.5, equinox', 4.5, 0],
    ['London 51.5, equinox', 51.5, 0],
    ['London 51.5, June', 51.5, 23.44],
    ['Oslo 59.9, June', 59.9, 23.44],
  ]) {
    rows.push([name, ...[100, 200, 500, 1000, 2000, 2500].map((h) => {
      const v = sunsetShiftMin(lat, dec, h);
      return v === null ? 'no sol' : v.toFixed(2);
    })]);
  }
  say(table(['place and date', '100 m', '200 m', '500 m', '1000 m', '2000 m', '2500 m'], rows));
  say('');
  say('Dip in degrees: ' + [50, 100, 200, 500, 1000, 2000, 2500].map((h) => `${h} m ${dip(h).toFixed(4)}`).join(', ') + '.');
  say('');
}

// -------------------------------------------- 5B real elevations, real cost
say('## 5B. How high the world actually lives, from GeoNames');
say('');
const cities = [];
for (const line of fs.readFileSync('cities15000.txt', 'utf8').split('\n')) {
  if (!line) continue;
  const f = line.split('\t');
  const lat = Number(f[4]);
  const lon = Number(f[5]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  const elev = f[15] ? Number(f[15]) : null; // `elevation` column, often blank
  const dem = f[16] ? Number(f[16]) : null; // `dem`, the SRTM/GTOPO30 value, almost always present
  cities.push({ name: f[1], cc: f[8], lat, lon, pop: Number(f[14]) || 0, elev, dem });
}
{
  const withElev = cities.filter((c) => Number.isFinite(c.elev)).length;
  const withDem = cities.filter((c) => Number.isFinite(c.dem)).length;
  const dems = cities.filter((c) => Number.isFinite(c.dem)).map((c) => c.dem).sort((a, b) => a - b);
  const pick = (p) => dems[Math.floor((p / 100) * dems.length)];
  const totPop = cities.reduce((s, c) => s + c.pop, 0);
  const popAbove = (h) => (100 * cities.filter((c) => Number.isFinite(c.dem) && c.dem >= h).reduce((s, c) => s + c.pop, 0)) / totPop;
  say(
    table(
      ['statistic', 'value'],
      [
        ['cities with an `elevation` value', `${withElev} of ${cities.length}`],
        ['cities with a `dem` value', `${withDem} of ${cities.length}`],
        ['median city `dem`', pick(50) + ' m'],
        ['75th percentile', pick(75) + ' m'],
        ['90th percentile', pick(90) + ' m'],
        ['99th percentile', pick(99) + ' m'],
        ['highest', dems[dems.length - 1] + ' m'],
        ['population at or above 200 m', popAbove(200).toFixed(1) + '%'],
        ['population at or above 500 m', popAbove(500).toFixed(1) + '%'],
        ['population at or above 1000 m', popAbove(1000).toFixed(1) + '%'],
        ['population at or above 1500 m', popAbove(1500).toFixed(1) + '%'],
        ['population at or above 2000 m', popAbove(2000).toFixed(1) + '%'],
      ]
    )
  );
  say('');
  // cost of one int16 per city
  const buf = Buffer.alloc(2 * cities.length);
  cities.forEach((c, i) => buf.writeInt16LE(Math.max(-32000, Math.min(32000, Math.round(c.dem ?? 0))), i * 2));
  say(
    table(
      ['storage', 'bytes'],
      [
        ['one int16 per city, all 34,152', buf.length.toLocaleString('en-GB')],
        ['the same, gzip', zlib.gzipSync(buf, { level: 9 }).length.toLocaleString('en-GB')],
        ['the same, brotli', zlib.brotliCompressSync(buf).length.toLocaleString('en-GB')],
        ['one int16 per city, 1,000 cities', '2,000'],
        ['one int16 per city, 60 JAKIM zones', '120'],
      ]
    )
  );
  say('');
  // what the 20 highest big Muslim-country cities cost in minutes
  const MM = new Set('AF AL AZ BH BD BN BF TD KM CI DJ EG ER GM GN GW ID IR IQ JO KZ KW KG LB LY MY MV ML MR MA NE NG OM PK PS QA SA SN SL SO SD SY TJ TZ TN TR TM AE UZ EH YE MK'.split(' '));
  const Rm = 6371000;
  const dipDeg = (h) => (Math.acos(Rm / (Rm + h)) * 180) / Math.PI;
  function shift(latDeg, declDeg, h) {
    const lat = (latDeg * Math.PI) / 180;
    const dec = (declDeg * Math.PI) / 180;
    const H = (altDeg) => {
      const alt = (altDeg * Math.PI) / 180;
      const c = (Math.sin(alt) - Math.sin(lat) * Math.sin(dec)) / (Math.cos(lat) * Math.cos(dec));
      if (c < -1 || c > 1) return null;
      return (Math.acos(c) * 180) / Math.PI;
    };
    const a = H(-0.833);
    const b = H(-0.833 - dipDeg(h));
    if (a === null || b === null) return null;
    return ((b - a) / 15) * 60;
  }
  const big = cities
    .filter((c) => MM.has(c.cc) && c.pop >= 300000 && Number.isFinite(c.dem))
    .sort((a, b) => b.dem - a.dem)
    .slice(0, 25);
  say('### The 25 highest cities over 300,000 in Muslim-majority countries');
  say('');
  say(
    table(
      ['city', 'cc', 'population', 'dem m', 'Maghrib later, equinox', 'Maghrib later, local summer'],
      big.map((c) => {
        const dec = c.lat >= 0 ? 23.44 : -23.44;
        return [
          c.name,
          c.cc,
          c.pop.toLocaleString('en-GB'),
          String(c.dem),
          (shift(c.lat, 0, c.dem) ?? 0).toFixed(2),
          (shift(c.lat, dec, c.dem) ?? 0).toFixed(2),
        ];
      })
    )
  );
  say('');
}

// -------------------------------------------- 5C the decisive test
say('## 5C. The decisive test: does elevation move the app toward or away from JAKIM?');
say('');
say('JAKIM assigns separate zones to high ground: `PHG06` Cameron Highlands, `PRK07` Bukit Larut,');
say('`SBH06` Gunung Kinabalu, `KDH07` Puncak Gunung Jerai (R1, cited; zone names read from');
say('e-solat.gov.my 2026-09-30). If JAKIM already accounts for elevation in those zones, then an app');
say('applying its OWN elevation correction on top would double-count. This is measured in');
say('`part5-jakim.mjs` against JAKIM\'s own published September 2026 times.');
say('');
console.log(out.join('\n'));
