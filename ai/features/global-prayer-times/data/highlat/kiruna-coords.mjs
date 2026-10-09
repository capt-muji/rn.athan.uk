// R11 Part 3, the finding. Six of the seven Swedish cities fit their own latitude to within
// 0.32 degrees. KIRUNA ALONE implies 63.86 N against a true 67.86 N, a gap of exactly -4.00
// degrees. 63.86 N is Umea's latitude (63.83 N), and Kiruna and Umea share a longitude
// (20.23 E and 20.26 E). So the two cities print an almost identical table.
//
// Two explanations fit that and they are different in kind:
//   E1  IFiS deliberately substitutes a place for Kiruna (Aqrab al-Bilad, one hop to Umea);
//   E2  IFiS's city database has Kiruna's latitude wrong, as 63.86 instead of 67.86, which
//       is a single transposed digit.
// This script tests which, by fitting the longitude as well. A deliberate nearest-place
// substitution would move the longitude to the donor city; a typo in the latitude field
// would leave the longitude correct.
import { readFileSync } from 'node:fs';
import { timeAtAngle, midDay, toH } from '../countries/solar-harness.mjs';

const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL(f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const med = a => { if (!a.length) return NaN; const s = a.map(Math.abs).sort((x, y) => x - y); return +s[Math.floor(s.length / 2)].toFixed(2); };
const mx = a => { if (!a.length) return NaN; const s = a.map(Math.abs).sort((x, y) => x - y); return +s[s.length - 1].toFixed(1); };

// Step 1: the longitude, from the Dhuhr column alone. Dhuhr carries longitude and nothing else.
console.log('=== longitude recovered from the printed Dhuhr column, which carries no latitude ===');
console.log('city        trueLng  impliedLng  gap     medianErr(min)   (Dhuhr = true noon + 5 min)');
const CITIES = [
  { name: 'Malmo', f: '../countries/se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  { name: 'Stockholm', f: '../countries/se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  { name: 'Umea', f: './se-umea.tsv', lat: 63.8258, lng: 20.2630 },
  { name: 'Lulea', f: './se-lulea.tsv', lat: 65.5848, lng: 22.1567 },
  { name: 'Gallivare', f: './se-gallivare.tsv', lat: 67.1333, lng: 20.6667 },
  { name: 'Pajala', f: './se-pajala.tsv', lat: 67.2117, lng: 23.3700 },
  { name: 'Kiruna', f: '../countries/se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
];
for (const c of CITIES) {
  const rows = load(c.f);
  let bl = null, bm = 1e9;
  for (let L = c.lng - 6; L <= c.lng + 6; L += 0.01) {
    const e = rows.map(r => (toH(r.dhohr) - (midDay(2026, r.m, r.d, L, r.tz) + 5 / 60)) * 60);
    const m = med(e);
    if (m < bm) { bm = m; bl = L; }
  }
  console.log(`${c.name.padEnd(11)} ${c.lng.toFixed(2).padStart(6)}   ${bl.toFixed(2).padStart(6)}      ${(bl - c.lng).toFixed(2).padStart(6)}   ${bm.toFixed(2)}`);
}

// Step 2: joint fit of latitude and longitude for Kiruna from all four solar columns.
console.log('\n=== Kiruna, joint latitude and longitude fit from Shuruk, Magrib, Fajr and Isha ===');
{
  const c = CITIES.find(x => x.name === 'Kiruna'), rows = load(c.f);
  let best = null, be = 1e9;
  for (let L = 62.5; L <= 68.5; L += 0.05) {
    for (let G = 17.5; G <= 23.5; G += 0.1) {
      const e = [];
      for (const r of rows) {
        const noon = midDay(2026, r.m, r.d, G, r.tz);
        const sr = timeAtAngle(2026, r.m, r.d, L, G, r.tz, 1.55, -1);
        if (sr === null) continue;
        const half = (noon - sr) * 60;
        if (half > 570 || half < 150) continue;
        e.push((toH(r.shuruk) - sr) * 60);
      }
      if (e.length < 150) continue;
      const m = med(e);
      if (m < be) { be = m; best = { L, G, n: e.length, max: mx(e) }; }
    }
  }
  console.log(`best fit: latitude ${best.L.toFixed(2)}, longitude ${best.G.toFixed(2)} on ${best.n} unfloored days, median ${be} min, max ${best.max} min`);
  console.log(`true Kiruna: latitude ${c.lat.toFixed(2)}, longitude ${c.lng.toFixed(2)}`);
  console.log(`Umea:        latitude 63.83, longitude 20.26`);
  console.log(`latitude gap ${(best.L - c.lat).toFixed(2)} deg, longitude gap ${(best.G - c.lng).toFixed(2)} deg`);
}

// Step 3: the direct comparison. Kiruna's published table against Umea's, day by day, raw.
console.log('\n=== Kiruna published table against Umea published table, raw, no correction ===');
{
  const k = load('../countries/se-kiruna-2026.tsv'), u = load('./se-umea.tsv');
  const cols = ['fajr', 'shuruk', 'dhohr', 'asr', 'magrib', 'isha'];
  const e = Object.fromEntries(cols.map(x => [x, []]));
  let identical = 0;
  for (const rk of k) {
    const ru = u.find(x => x.m === rk.m && x.d === rk.d);
    if (!ru) continue;
    if (cols.every(cc => rk[cc] === ru[cc])) identical++;
    for (const cc of cols) e[cc].push((toH(rk[cc]) - toH(ru[cc])) * 60);
  }
  console.log(`days on which all six printed values are byte-identical: ${identical} of 365`);
  for (const cc of cols) console.log(`${cc.padEnd(8)} median ${String(med(e[cc])).padStart(5)} min, max ${mx(e[cc])} min`);
}

// Step 4: and the same against Gallivare, the genuinely Arctic city 0.7 deg south of Kiruna.
console.log('\n=== Kiruna against Gallivare (67.13 N, 0.72 deg apart), raw ===');
{
  const k = load('../countries/se-kiruna-2026.tsv'), g = load('./se-gallivare.tsv');
  const cols = ['fajr', 'shuruk', 'dhohr', 'asr', 'magrib', 'isha'];
  for (const cc of cols) {
    const e = [];
    for (const rk of k) { const rg = g.find(x => x.m === rk.m && x.d === rk.d); if (rg) e.push((toH(rk[cc]) - toH(rg[cc])) * 60); }
    console.log(`${cc.padEnd(8)} median ${String(med(e)).padStart(5)} min, max ${mx(e)} min`);
  }
}
