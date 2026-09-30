// R9: close R5's Bosnia caveat. R5 measured the Rijaset's Sarajevo vaktija from ONE
// day and flagged that the 9-minute Maghrib margin and the 2.18-degree sunrise both
// needed a month to confirm. The Islamic Community in BiH serves the whole year for
// every one of its locations through a keyless JSON endpoint:
//   GET https://api.vaktija.ba/vaktija/v1/<id>/<year>/<month>/<day>
// `vakat` is [Zora, Izlazak sunca, Podne, Ikindija, Aksam, Jacija]. `Zora` is Fajr.
//
// Sarajevo is id 77. Bosnia is at 43.9 N, so an 18-degree Fajr is solvable all year
// and no high-latitude rule is needed, which makes this a clean angle measurement.
import { invertRow, timeAtAngle, toH } from './solar-harness.mjs';

const ID = 77, NAME = 'Sarajevo', LAT = 43.8563, LNG = 18.4131;
// Bosnia: CEST (UTC+2) 29 March to 25 October 2026, CET (UTC+1) otherwise.
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const acc = { fajrAngle: [], sunriseAngle: [], dhuhrOffsetMin: [], asrFactor: [],
  maghribMinusSunsetMin: [], ishaAngle: [], ishaAfterMaghribMin: [] };
const unsolvable = [];
let n = 0;

// Sample every third day: 122 days is enough to see a seasonal shape and keeps the
// request count civil against a community-run endpoint.
for (let m = 1; m <= 12; m++) {
  for (let d = 1; d <= DIM[m - 1]; d += 3) {
    const res = await fetch(`https://api.vaktija.ba/vaktija/v1/${ID}/2026/${m}/${d}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) continue;
    const j = await res.json();
    const [fajr, sunrise, dhuhr, asr, maghrib, isha] = j.vakat;
    const tz = tzOf(m, d);
    n++;
    const f18 = timeAtAngle(2026, m, d, LAT, LNG, tz, 18, -1);
    if (f18 === null) unsolvable.push(`${m}-${d}`);
    const inv = invertRow({ y: 2026, m, d, lat: LAT, lng: LNG, tz, fajr, sunrise, dhuhr, asr, maghrib, isha });
    for (const k of Object.keys(acc)) if (inv[k] !== undefined) acc[k].push(inv[k]);
  }
}

const stat = a => {
  const s = [...a].sort((x, y) => x - y);
  return { n: s.length, min: s[0], q1: s[Math.floor(0.25 * s.length)], median: s[Math.floor(0.5 * s.length)],
    q3: s[Math.floor(0.75 * s.length)], max: s[s.length - 1] };
};
console.log(`Islamic Community in BiH (Rijaset), ${NAME}, ${n} days sampled across 2026`);
console.log(`days where an 18-degree Fajr has no solution at ${LAT} N: ${unsolvable.length}` +
  (unsolvable.length ? ` (${unsolvable[0]} to ${unsolvable[unsolvable.length - 1]})` : ''));
for (const [k, a] of Object.entries(acc)) if (a.length) console.log('  ', k.padEnd(24), JSON.stringify(stat(a)));
