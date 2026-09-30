// R9: the Swedish summer rule, identified and then tested.
//
// IFiS prints Fajr and Isha on all 365 days. Inverting the days when 18 degrees is
// solvable recovers a flat 18.0 / 16.0. During the months when 18 degrees has no
// solution, the printed times keep moving, which rules out a frozen clock time.
//
// The rule that fits: FREEZE THE FRACTION OF THE NIGHT. On the last day the angle
// solves, Fajr sits a certain fraction of the night before sunrise; that fraction is
// then held constant through the whole unsolvable stretch and applied to each day's
// own (shrinking, then growing) night. `adhan` calls the fixed-fraction family
// `AngleBased`; this is the same shape but with the fraction taken from the
// authority's own boundary day rather than from angle/60.
//
// Tested here on all three cities, for Fajr and for Isha independently.
import { readFileSync } from 'node:fs';
import { timeAtAngle, toH } from './solar-harness.mjs';

const CITIES = {
  'se-stockholm-2026.tsv': { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  'se-malmo-2026.tsv': { name: 'Malmo', lat: 55.6050, lng: 13.0038 },
  'se-kiruna-2026.tsv': { name: 'Kiruna', lat: 67.8558, lng: 20.2253 },
};
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const stat = a => {
  const s = a.map(Math.abs).sort((x, y) => x - y);
  return { n: s.length, median: +s[Math.floor(s.length / 2)].toFixed(1),
    p90: +s[Math.floor(0.9 * s.length)].toFixed(1), max: +s[s.length - 1].toFixed(1) };
};

for (const [file, c] of Object.entries(CITIES)) {
  const rows = [];
  for (const line of readFileSync(new URL('./' + file, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], fajr: p[2], isha: p[7] });
  }

  for (const r of rows) {
    const tz = tzOf(r.m, r.d);
    r.sunrise = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, tz, 0.833, -1);
    r.sunset = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, tz, 0.833, 1);
    const pd = r.d === 1 ? DIM[(r.m + 10) % 12] : r.d - 1;
    const pm = r.d === 1 ? (r.m === 1 ? 12 : r.m - 1) : r.m;
    const ssPrev = timeAtAngle(2026, pm, pd, c.lat, c.lng, tz, 0.833, 1);
    r.night = r.sunrise !== null && ssPrev !== null ? 24 - (ssPrev - r.sunrise) : null;
    r.nightFwd = r.sunset !== null && r.sunrise !== null ? 24 - (r.sunset - r.sunrise) : null;
    r.f18 = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, tz, 18, -1);
    r.i18 = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, tz, 18, 1);
    r.fajrFrac = r.night ? (r.sunrise - toH(r.fajr)) / r.night : null;
    r.ishaFrac = r.nightFwd ? (toH(r.isha) - r.sunset) / r.nightFwd : null;
  }

  // Boundary fraction: the last day before the unsolvable stretch begins.
  const firstBad = rows.findIndex(r => r.f18 === null);
  const fFrac = firstBad > 0 ? rows[firstBad - 1].fajrFrac : null;
  const firstBadI = rows.findIndex(r => r.i18 === null);
  const iFrac = firstBadI > 0 ? rows[firstBadI - 1].ishaFrac : null;

  const fErr = [], iErr = [];
  for (const r of rows) {
    if (r.f18 === null && fFrac !== null && r.night !== null)
      fErr.push((toH(r.fajr) - (r.sunrise - r.night * fFrac)) * 60);
    if (r.i18 === null && iFrac !== null && r.nightFwd !== null)
      iErr.push((toH(r.isha) - (r.sunset + r.nightFwd * iFrac)) * 60);
  }

  console.log(`\n=== ${c.name} (${c.lat} N) ===`);
  console.log(`boundary Fajr fraction of night: ${fFrac !== null ? fFrac.toFixed(4) + ' (1/' + (1 / fFrac).toFixed(2) + ')' : 'n/a'}`);
  console.log(`boundary Isha fraction of night: ${iFrac !== null ? iFrac.toFixed(4) + ' (1/' + (1 / iFrac).toFixed(2) + ')' : 'n/a'}`);
  if (fErr.length) console.log('frozen-fraction Fajr, unsolvable days, abs error min  ', JSON.stringify(stat(fErr)));
  if (iErr.length) console.log('frozen-fraction Isha, unsolvable days, abs error min  ', JSON.stringify(stat(iErr)));
}
