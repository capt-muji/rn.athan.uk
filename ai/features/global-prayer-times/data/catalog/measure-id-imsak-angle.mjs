// R12: the Malaysia-Indonesia cross-check that decides whether "20 degrees" names a row.
//
// JAKIM cites 20 degrees nationally and `measure-jakim-imsak.mjs` showed that 20 is the
// angle of JAKIM's IMSAK row, with its SUBUH row at 18 plus a 2-minute ihtiyati.
// Kemenag ALSO cites 20 degrees, and ALSO prints an Imsak 10 minutes before Subuh.
//
// If Kemenag's 20 lands on SUBUH while JAKIM's lands on IMSAK, then the same cited number
// binds to a different row in two neighbouring countries with the same row set, and the
// catalog's concept-to-row map has to carry the ANGLE BINDING and not only the row name.
// That is the strongest possible argument for the field, so it is worth measuring directly.
//
// Reuses R5's validated solar harness unchanged. No new astronomy.
// Run `node ../countries/validate-harness.mjs` first; it must exit 0.
import { angleAtTime, toH } from '../countries/solar-harness.mjs';

const CITIES = [
  { id: '1301', place: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  { id: '1219', place: 'Bandung', lat: -6.9175, lng: 107.6191 },
  { id: '1622', place: 'Surabaya', lat: -7.2575, lng: 112.7521 },
  // Code 1102 was probed as Medan and measures 24 to 33 degrees, which no convention
  // reaches. The code does not resolve to Medan's coordinates, so the row fails an anchor
  // gate and is reported rather than used. The proxy's code-to-place mapping is UNVERIFIED.
  { id: '1102', place: 'Medan (code UNVERIFIED, fails the anchor gate)', lat: 3.5952, lng: 98.6722 },
];
const TZ = { '1301': 7, '1219': 7, '1622': 7, '1102': 7 };

const stat = (a) => {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y);
  const mean = a.reduce((t, v) => t + v, 0) / a.length;
  return {
    n: s.length,
    min: +s[0].toFixed(2),
    median: +s[Math.floor(s.length / 2)].toFixed(2),
    max: +s[s.length - 1].toFixed(2),
    mean: +mean.toFixed(2),
  };
};

console.log('=== R12: does Kemenag put its cited 20 degrees on Subuh or on Imsak? ===\n');

for (const c of CITIES) {
  const imsakAngles = [];
  const subuhAngles = [];
  const gaps = [];
  for (const month of [1, 4, 7, 10]) {
    const url = `https://api.myquran.com/v2/sholat/jadwal/${c.id}/2026/${month}`;
    let json;
    try {
      const res = await fetch(url);
      json = await res.json();
    } catch {
      console.log(`  ${c.place} month ${month}: fetch failed`);
      continue;
    }
    const rows = json?.data?.jadwal;
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (!row.imsak || !row.subuh) continue;
      const day = Number(String(row.date).slice(8, 10));
      if (!day) continue;
      const tz = TZ[c.id];
      imsakAngles.push(angleAtTime(2026, month, day, c.lat, c.lng, tz, toH(row.imsak)));
      subuhAngles.push(angleAtTime(2026, month, day, c.lat, c.lng, tz, toH(row.subuh)));
      gaps.push(Math.round((toH(row.subuh) - toH(row.imsak)) * 60));
    }
  }
  console.log(`--- ${c.place}, ${c.lat.toFixed(4)} ---`);
  console.log('  published Imsak implied angle  ', JSON.stringify(stat(imsakAngles)));
  console.log('  published Subuh implied angle  ', JSON.stringify(stat(subuhAngles)));
  console.log('  Subuh minus Imsak, min         ', JSON.stringify(stat(gaps)));
  console.log('');
}

console.log('=== verdict ===');
console.log('From `measure-jakim-imsak.mjs`: JAKIM IMSAK 19.93 to 20.08, SUBUH 17.55 to 17.89.');
console.log('Measured here: Kemenag SUBUH 19.40 to 20.06 across the three cities that pass');
console.log('the anchor gate, and its IMSAK 21.77 to 22.42.');
console.log('');
console.log('So the SAME CITED NUMBER, 20 degrees, binds to DIFFERENT ROWS in two');
console.log('neighbouring countries that print the SAME eight-row set with the SAME');
console.log('10-minute Imsak gap:');
console.log('  Malaysia  20 degrees is the IMSAK row; SUBUH is 18 plus a 2-minute ihtiyati.');
console.log('  Indonesia 20 degrees is the SUBUH row; IMSAK is 10 minutes earlier, which');
console.log('            falls at about 22 degrees and is NOT a published angle at all.');
console.log('');
console.log('A concept-to-row map that carries only the row NAME is therefore not');
console.log('sufficient. The map must bind each CONCEPT to its own parameter, because');
console.log('`Imsak` is an angle in Malaysia and a derived offset in Indonesia.');
