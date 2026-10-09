// R11 Part 3, the confirmation. The clamp model reproduces six of seven cities to a median of
// 0.8 to 4.4 minutes at their own latitude, and Kiruna only at 63.68 N, four degrees south.
// If a four-degree substitution were IFiS POLICY above some threshold, every city above that
// threshold would show it. Gallivare (67.13 N) and Pajala (67.21 N) are also above the Arctic
// Circle and they fit their OWN latitude. So the Kiruna gap is either a one-city data error or
// a one-city substitution. This script adds four more IFiS cities, two of them Arctic
// (Jokkmokk 66.61 N, Haparanda 65.83 N) and two sub-Arctic controls (Ostersund 63.18 N,
// Sundsvall 62.39 N), and fits the latitude of each under the same five constants.
import { readFileSync, writeFileSync } from 'node:fs';
import { timeAtAngle, midDay, toH, hm, sin, cos } from '../countries/solar-harness.mjs';

// Coordinates from GeoNames / Wikipedia town centres, cited in the report source table.
const CITIES = [
  { name: 'Malmo', f: '../countries/se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  { name: 'Stockholm', f: '../countries/se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  { name: 'Sundsvall', f: './se-sundsvall.tsv', lat: 62.3908, lng: 17.3069 },
  { name: 'Ostersund', f: './se-ostersund.tsv', lat: 63.1792, lng: 14.6357 },
  { name: 'Umea', f: './se-umea.tsv', lat: 63.8258, lng: 20.2630 },
  { name: 'Lulea', f: './se-lulea.tsv', lat: 65.5848, lng: 22.1567 },
  { name: 'Haparanda', f: './se-haparanda.tsv', lat: 65.8355, lng: 24.1454 },
  { name: 'Jokkmokk', f: './se-jokkmokk.tsv', lat: 66.6069, lng: 19.8272 },
  { name: 'Gallivare', f: './se-gallivare.tsv', lat: 67.1333, lng: 20.6667 },
  { name: 'Pajala', f: './se-pajala.tsv', lat: 67.2117, lng: 23.3700 },
  { name: 'Kiruna', f: '../countries/se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
];
const P = { horizon: 1.51, dayMin: 300, dayMax: 1140, fajrAngle: 17.98, ishaAngle: 15.90, fF: 0.2055, fI: 0.1815 };
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL(f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const stat = a => { if (!a.length) return null; const s = a.map(Math.abs).sort((x, y) => x - y); return { n: s.length, median: +s[Math.floor(s.length / 2)].toFixed(1), p90: +s[Math.floor(0.9 * s.length)].toFixed(1), max: +s[s.length - 1].toFixed(1) }; };
const jul = (y, m, d) => { if (m <= 2) { y -= 1; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; };
const declOf = (y, m, d, tz, t) => { const dd = jul(y, m, d) + (t - tz) / 24 - 2451545.0; const g = ((357.529 + 0.98560028 * dd) % 360 + 360) % 360; const q = ((280.459 + 0.98564736 * dd) % 360 + 360) % 360; const L = ((q + 1.915 * sin(g) + 0.020 * sin(2 * g)) % 360 + 360) % 360; const e = 23.439 - 0.00000036 * dd; return Math.asin(sin(e) * sin(L)) * 180 / Math.PI; };
function halfDay(lat, lng, tz, y, m, d, ang) {
  const noon = midDay(y, m, d, lng, tz), decl = declOf(y, m, d, tz, noon);
  const c = (sin(-ang) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
  if (c >= 1) return { half: null, polar: 'night' };
  if (c <= -1) return { half: null, polar: 'day' };
  const t = timeAtAngle(y, m, d, lat, lng, tz, ang, 1);
  return { half: t === null ? null : t - noon, polar: null };
}
function model(lat, lng, r, Q) {
  const noon = midDay(2026, r.m, r.d, lng, r.tz);
  const h = halfDay(lat, lng, r.tz, 2026, r.m, r.d, Q.horizon);
  const dayH = h.half === null ? (h.polar === 'day' ? 24 : 0) : 2 * h.half;
  const clamped = Math.min(Q.dayMax / 60, Math.max(Q.dayMin / 60, dayH));
  const shuruk = noon - clamped / 2, magrib = noon + clamped / 2, nightH = 24 - clamped;
  const hF = halfDay(lat, lng, r.tz, 2026, r.m, r.d, Q.fajrAngle);
  const hI = halfDay(lat, lng, r.tz, 2026, r.m, r.d, Q.ishaAngle);
  const floorF = shuruk - Q.fF * nightH, ceilI = magrib + Q.fI * nightH;
  return { shuruk, magrib, fajr: hF.half === null ? floorF : Math.max(noon - hF.half, floorF), isha: hI.half === null ? ceilI : Math.min(noon + hI.half, ceilI), clampedBy: Math.abs(clamped - dayH) > 1e-9 };
}

const loaded = CITIES.map(c => ({ ...c, rows: load(c.f) }));

console.log('=== eleven IFiS cities, the same five constants, at each city TRUE latitude ===');
console.log(`horizon ${P.horizon} deg | clamp [${P.dayMin},${P.dayMax}] min | Fajr ${P.fajrAngle} deg / floor ${P.fF} | Isha ${P.ishaAngle} deg / ceil ${P.fI}`);
console.log('city         lat     clampD  shuruk m/max   magrib m/max   fajr m/max    isha m/max');
const rows = [];
for (const c of loaded) {
  const e = { shuruk: [], magrib: [], fajr: [], isha: [] };
  let clampD = 0;
  for (const r of c.rows) {
    const mo = model(c.lat, c.lng, r, P);
    if (mo.clampedBy) clampD++;
    for (const k of Object.keys(e)) e[k].push((toH(r[k]) - mo[k]) * 60);
  }
  const s = Object.fromEntries(Object.entries(e).map(([k, v]) => [k, stat(v)]));
  console.log(`${c.name.padEnd(12)} ${c.lat.toFixed(2).padStart(5)}   ${String(clampD).padStart(5)}   ${String(s.shuruk.median).padStart(4)}/${String(s.shuruk.max).padStart(5)}   ${String(s.magrib.median).padStart(4)}/${String(s.magrib.max).padStart(5)}   ${String(s.fajr.median).padStart(4)}/${String(s.fajr.max).padStart(5)}  ${String(s.isha.median).padStart(4)}/${String(s.isha.max).padStart(5)}`);
  rows.push({ city: c.name, trueLat: c.lat, clampDays: clampD, atTrueLat: s });
}

console.log('\n=== best-fit latitude per city, all eleven, same five constants ===');
console.log('city        trueLat  bestFit   gap     medianErr   verdict');
for (const c of loaded) {
  let bl = null, be = 1e9;
  for (let L = c.lat - 5; L <= c.lat + 2.5; L += 0.02) {
    const e = [];
    for (const r of c.rows) { const mo = model(L, c.lng, r, P); for (const k of ['shuruk', 'magrib', 'fajr', 'isha']) e.push((toH(r[k]) - mo[k]) * 60); }
    const s = stat(e);
    if (s.median < be) { be = s.median; bl = L; }
  }
  const gap = bl - c.lat;
  const verdict = Math.abs(gap) < 0.4 ? 'own latitude' : `SUBSTITUTED ${gap.toFixed(2)} deg`;
  const row = rows.find(x => x.city === c.name);
  row.bestFitLat = +bl.toFixed(2); row.gap = +gap.toFixed(2); row.bestFitMedian = be; row.verdict = verdict;
  console.log(`${c.name.padEnd(11)} ${c.lat.toFixed(2).padStart(6)}  ${bl.toFixed(2).padStart(6)}  ${gap.toFixed(2).padStart(6)}    ${be.toFixed(1).padStart(5)}     ${verdict}`);
}

// The tie-breaker: does Kiruna's printed table match Umea's printed table after removing only
// the longitude difference? If IFiS substituted a PLACE, Kiruna would inherit Umea's longitude
// too and the two tables would be byte-identical. If it has a wrong LATITUDE field, Kiruna
// keeps its own longitude and the tables differ by the small longitude gap only.
console.log('\n=== tie-breaker: Kiruna printed table against Umea printed table ===');
const K = loaded.find(c => c.name === 'Kiruna'), U = loaded.find(c => c.name === 'Umea');
const dLngMin = (U.lng - K.lng) * 4; // minutes of solar time per degree of longitude
console.log(`Kiruna lng ${K.lng.toFixed(4)} E, Umea lng ${U.lng.toFixed(4)} E, difference ${(U.lng - K.lng).toFixed(4)} deg = ${dLngMin.toFixed(2)} min of solar time`);
for (const col of ['fajr', 'shuruk', 'dhohr', 'asr', 'magrib', 'isha']) {
  const raw = [], corr = [];
  for (const rk of K.rows) {
    const ru = U.rows.find(x => x.m === rk.m && x.d === rk.d);
    if (!ru) continue;
    const d = (toH(rk[col]) - toH(ru[col])) * 60;
    raw.push(d); corr.push(d - dLngMin);
  }
  const a = stat(raw), b = stat(corr);
  console.log(`${col.padEnd(7)} raw median ${String(a.median).padStart(4)} max ${String(a.max).padStart(4)} | after removing the longitude gap: median ${String(b.median).padStart(4)} max ${String(b.max).padStart(4)}`);
}
console.log('\nA byte-identical table would mean IFiS substituted the PLACE Umea (same lat AND lng).');
console.log('A residual equal to the longitude gap means IFiS kept Kiruna longitude and only its LATITUDE is wrong.');
writeFileSync(new URL('./sweden-eleven-summary.json', import.meta.url), JSON.stringify({ params: P, cities: rows }, null, 2));
