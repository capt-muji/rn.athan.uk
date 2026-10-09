// R9: what does a Swedish authority actually print in summer, when the sun never
// reaches the Fajr angle?
//
// Islamiska Forbundet i Sverige publishes a full year for 112 Swedish cities at
// islamiskaforbundet.se/bonetider/, captured with `grab-sweden.sh`. Columns:
// Fajr, Shuruk, Dhohr, Asr, Magrib, Isha. IFiS prints a number on every single day,
// including the weeks when no depression angle has a solution, so the question is
// which construction those numbers come from.
//
// Constructions tested against the published Fajr and Isha, per day:
//   angle        the depression angle the published time implies (null where unsolvable)
//   nightFrac    published time expressed as a fraction of the sunset-to-sunrise night
//   aqrabAyyam   the "nearest day" rule: reuse the last day the angle was solvable
import { readFileSync } from 'node:fs';
import { angleAtTime, timeAtAngle, toH, hm } from './solar-harness.mjs';

const CITIES = {
  'se-stockholm-2026.tsv': { name: 'Stockholm', lat: 59.3293, lng: 18.0686 },
  'se-malmo-2026.tsv': { name: 'Malmo', lat: 55.6050, lng: 13.0038 },
  'se-kiruna-2026.tsv': { name: 'Kiruna', lat: 67.8558, lng: 20.2253 },
};

// Sweden: CEST (UTC+2) from the last Sunday in March to the last Sunday in October.
// In 2026 that is 29 March to 25 October.
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;

for (const [file, c] of Object.entries(CITIES)) {
  const rows = [];
  for (const line of readFileSync(new URL('./' + file, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length !== 8) continue;
    const [m, d, fajr, shuruk, dhuhr, asr, maghrib, isha] = p;
    rows.push({ m: +m, d: +d, fajr, shuruk, dhuhr, asr, maghrib, isha });
  }

  let noFajrSolution = 0, noIshaSolution = 0;
  const fajrAngles = [], ishaAngles = [], plateauFajr = [], plateauIsha = [];
  let firstUnsolvable = null, lastUnsolvable = null;

  for (const r of rows) {
    const tz = tzOf(r.m, r.d);
    const q = { y: 2026, m: r.m, d: r.d, lat: c.lat, lng: c.lng, tz };
    // Is an 18-degree Fajr solvable at all on this day?
    const f18 = timeAtAngle(q.y, q.m, q.d, c.lat, c.lng, tz, 18, -1);
    const i18 = timeAtAngle(q.y, q.m, q.d, c.lat, c.lng, tz, 18, 1);
    if (f18 === null) {
      noFajrSolution++;
      if (!firstUnsolvable) firstUnsolvable = `${r.m}-${r.d}`;
      lastUnsolvable = `${r.m}-${r.d}`;
      plateauFajr.push(r.fajr);
      plateauIsha.push(r.isha);
    } else {
      fajrAngles.push(+angleAtTime(q.y, q.m, q.d, c.lat, c.lng, tz, toH(r.fajr)).toFixed(2));
      ishaAngles.push(+angleAtTime(q.y, q.m, q.d, c.lat, c.lng, tz, toH(r.isha)).toFixed(2));
    }
    if (i18 === null) noIshaSolution++;
  }

  const stat = a => {
    const s = [...a].sort((x, y) => x - y);
    return { min: s[0], q1: s[Math.floor(0.25 * s.length)], median: s[Math.floor(0.5 * s.length)],
      q3: s[Math.floor(0.75 * s.length)], max: s[s.length - 1] };
  };

  console.log(`\n=== ${c.name} (${c.lat} N), ${rows.length} published days ===`);
  console.log(`days where an 18-degree Fajr has NO astronomical solution: ${noFajrSolution}` +
    (firstUnsolvable ? `, ${firstUnsolvable} to ${lastUnsolvable}` : ''));
  console.log(`IFiS prints a Fajr time on all ${rows.length} days regardless.`);
  if (fajrAngles.length) {
    console.log('on solvable days, implied Fajr angle ', JSON.stringify(stat(fajrAngles)));
    console.log('on solvable days, implied Isha angle ', JSON.stringify(stat(ishaAngles)));
  }
  if (plateauFajr.length) {
    const uniqF = [...new Set(plateauFajr)], uniqI = [...new Set(plateauIsha)];
    console.log(`during the unsolvable stretch, distinct printed Fajr values: ${uniqF.length}`,
      uniqF.length <= 6 ? JSON.stringify(uniqF) : `${uniqF[0]} .. ${uniqF[uniqF.length - 1]}`);
    console.log(`during the unsolvable stretch, distinct printed Isha values: ${uniqI.length}`,
      uniqI.length <= 6 ? JSON.stringify(uniqI) : `${uniqI[0]} .. ${uniqI[uniqI.length - 1]}`);
    console.log(`first unsolvable day prints Fajr ${plateauFajr[0]} Isha ${plateauIsha[0]};` +
      ` last prints Fajr ${plateauFajr[plateauFajr.length - 1]} Isha ${plateauIsha[plateauIsha.length - 1]}`);
  }

  // Does the published Isha-to-Fajr gap ever collapse, that is, do the two meet?
  const gaps = rows.map(r => {
    let g = (toH(r.fajr) + 24 - toH(r.isha)) % 24;
    return Math.round(g * 60);
  }).sort((a, b) => a - b);
  console.log('Isha to next Fajr gap, minutes:', JSON.stringify({ min: gaps[0], median: gaps[Math.floor(gaps.length / 2)], max: gaps[gaps.length - 1] }));
}
