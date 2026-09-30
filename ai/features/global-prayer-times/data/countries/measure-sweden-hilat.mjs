// R9: IFiS prints a Fajr and an Isha on every day of the Swedish year, including the
// 118 days at Stockholm when an 18-degree Fajr has no astronomical solution. The
// printed values keep moving day to day through that stretch, so it is not a frozen
// plateau. This script identifies the construction.
//
// Candidates, each over the WHOLE year so that the summer rule and the winter angle
// can be told apart:
//   angle18            sun 18 degrees below the horizon (null in summer)
//   seventhOfTheNight  night/7 before sunrise, night/7 after sunset
//   middleOfTheNight   night/2 either side
//   angleBased18       night * 18/60 either side
// `night` is sunset to next sunrise.
import { readFileSync } from 'node:fs';
import { timeAtAngle, toH } from './solar-harness.mjs';

const CITIES = {
  'se-stockholm-2026.tsv': { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  'se-malmo-2026.tsv': { name: 'Malmo', lat: 55.6050, lng: 13.0038 },
  'se-kiruna-2026.tsv': { name: 'Kiruna', lat: 67.8558, lng: 20.2253 },
};
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;

const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

for (const [file, c] of Object.entries(CITIES)) {
  const rows = [];
  for (const line of readFileSync(new URL('./' + file, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], fajr: p[2], isha: p[7] });
  }

  const err = { angle18: [], seventh: [], middle: [], angleBased: [] };
  const summerErr = { seventh: [], middle: [], angleBased: [] };

  for (const r of rows) {
    const tz = tzOf(r.m, r.d);
    const sunrise = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, tz, 0.833, -1);
    const pd = r.d === 1 ? DIM[(r.m + 10) % 12] : r.d - 1;
    const pm = r.d === 1 ? (r.m === 1 ? 12 : r.m - 1) : r.m;
    const sunsetPrev = timeAtAngle(2026, pm, pd, c.lat, c.lng, tz, 0.833, 1);
    if (sunrise === null || sunsetPrev === null) continue; // midnight sun, no anchors at all
    const night = 24 - (sunsetPrev - sunrise);
    const pub = toH(r.fajr);

    const f18 = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, tz, 18, -1);
    if (f18 !== null) err.angle18.push((pub - f18) * 60);

    const cands = {
      seventh: sunrise - night / 7,
      middle: sunrise - night / 2,
      angleBased: sunrise - night * 18 / 60,
    };
    for (const [k, v] of Object.entries(cands)) {
      err[k].push((pub - v) * 60);
      if (f18 === null) summerErr[k].push((pub - v) * 60);
    }
  }

  const stat = a => {
    const s = a.map(Math.abs).sort((x, y) => x - y);
    return { n: s.length, medianAbsMin: +s[Math.floor(s.length / 2)].toFixed(1),
      p90AbsMin: +s[Math.floor(0.9 * s.length)].toFixed(1), maxAbsMin: +s[s.length - 1].toFixed(1) };
  };

  console.log(`\n=== ${c.name} ===`);
  console.log('whole year, published Fajr against each construction');
  for (const [k, a] of Object.entries(err)) if (a.length) console.log('  ', k.padEnd(12), JSON.stringify(stat(a)));
  console.log('summer only (days where 18 deg has no solution)');
  for (const [k, a] of Object.entries(summerErr)) if (a.length) console.log('  ', k.padEnd(12), JSON.stringify(stat(a)));
}
