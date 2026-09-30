// R11 Part 3, the last step. sweden-model.mjs reproduces six of the seven IFiS cities to a
// median of 0.8 to 4.4 minutes with five constants fitted 800 km south. Kiruna sits at 11.4,
// three times its neighbour Gallivare 0.72 degrees away, and a handful of days carry a 410 to
// 425 minute error. This script asks two questions:
//   Q1  which days carry the 400-minute errors, and are they the polar boundary days;
//   Q2  does Kiruna's residual vanish if the model is run at a DIFFERENT latitude for Kiruna,
//       and if so which, and does the same substitution help or hurt the other six cities.
import { readFileSync, writeFileSync } from 'node:fs';
import { timeAtAngle, midDay, toH, hm, sin, cos } from '../countries/solar-harness.mjs';

const CITIES = [
  { name: 'Malmo', f: '../countries/se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  { name: 'Stockholm', f: '../countries/se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  { name: 'Umea', f: './se-umea.tsv', lat: 63.8258, lng: 20.2630 },
  { name: 'Lulea', f: './se-lulea.tsv', lat: 65.5848, lng: 22.1567 },
  { name: 'Gallivare', f: './se-gallivare.tsv', lat: 67.1333, lng: 20.6667 },
  { name: 'Pajala', f: './se-pajala.tsv', lat: 67.2117, lng: 23.3700 },
  { name: 'Kiruna', f: '../countries/se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
];
const P = { horizon: 1.51, dayMin: 300, dayMax: 1140, fajrAngle: 17.98, ishaAngle: 15.90, fF: 0.2055, fI: 0.1815 };
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
  const noon = midDay(y, m, d, lng, tz);
  const decl = declOf(y, m, d, tz, noon);
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
  return {
    shuruk, magrib,
    fajr: hF.half === null ? floorF : Math.max(noon - hF.half, floorF),
    isha: hI.half === null ? ceilI : Math.min(noon + hI.half, ceilI),
    clampedBy: Math.abs(clamped - dayH) > 1e-9, polar: h.polar, dayH,
  };
}

const loaded = CITIES.map(c => ({ ...c, rows: load(c.f) }));

// Q1: where do the 400-minute errors sit?
console.log('=== Q1: every day with an error above 60 minutes on any column, all seven cities ===');
console.log('city        date    col      published  modelled   err(min)  clamped  polar  trueDay(min)');
let big = 0;
for (const c of loaded) {
  for (const r of c.rows) {
    const mo = model(c.lat, c.lng, r, P);
    for (const k of ['shuruk', 'magrib', 'fajr', 'isha']) {
      const err = (toH(r[k]) - mo[k]) * 60;
      if (Math.abs(err) > 60) {
        big++;
        console.log(`${c.name.padEnd(11)} ${MN[r.m]} ${String(r.d).padStart(2)}  ${k.padEnd(7)}  ${r[k]}      ${hm(mo[k])}     ${err.toFixed(1).padStart(7)}  ${String(mo.clampedBy).padEnd(7)} ${String(mo.polar ?? '-').padEnd(6)} ${Math.round(mo.dayH * 60)}`);
      }
    }
  }
}
console.log(`total column-days above 60 minutes: ${big} out of ${7 * 365 * 4} = ${(100 * big / (7 * 365 * 4)).toFixed(2)}%`);

// Q1b: the same, split by whether the clamp bound that day
console.log('\n=== Q1b: error split by whether the clamp bound, per city, median abs minutes ===');
console.log('city         clampDays  clamped shuruk/fajr   unclamped shuruk/fajr');
for (const c of loaded) {
  const cl = { s: [], f: [] }, un = { s: [], f: [] };
  for (const r of c.rows) {
    const mo = model(c.lat, c.lng, r, P);
    const t = mo.clampedBy ? cl : un;
    t.s.push((toH(r.shuruk) - mo.shuruk) * 60);
    t.f.push((toH(r.fajr) - mo.fajr) * 60);
  }
  const a = stat(cl.s), b = stat(cl.f), x = stat(un.s), y = stat(un.f);
  console.log(`${c.name.padEnd(12)} ${String(cl.s.length).padStart(6)}     ${String(a?.median ?? 'na').padStart(5)}/${String(b?.median ?? 'na').padStart(5)}          ${String(x?.median ?? 'na').padStart(5)}/${String(y?.median ?? 'na').padStart(5)}`);
}

// Q2: fit a latitude per city under the clamp model
console.log('\n=== Q2: best-fit latitude per city under the SAME clamp model, all four columns ===');
console.log('city        trueLat  bestFitLat   gap     medianErr  (fit over the whole year)');
const fits = [];
for (const c of loaded) {
  let bl = null, be = 1e9;
  for (let L = c.lat - 5; L <= c.lat + 2.5; L += 0.02) {
    const e = [];
    for (const r of c.rows) {
      const mo = model(L, c.lng, r, P);
      for (const k of ['shuruk', 'magrib', 'fajr', 'isha']) e.push((toH(r[k]) - mo[k]) * 60);
    }
    const s = stat(e);
    if (s.median < be) { be = s.median; bl = L; }
  }
  fits.push({ city: c.name, trueLat: c.lat, bestFitLat: +bl.toFixed(2), gap: +(bl - c.lat).toFixed(2), medianErr: be });
  console.log(`${c.name.padEnd(11)} ${c.lat.toFixed(2).padStart(6)}   ${bl.toFixed(2).padStart(6)}    ${(bl - c.lat).toFixed(2).padStart(6)}   ${be.toFixed(1).padStart(5)}`);
}

// Q2b: Kiruna at Umea's latitude, the full four-column result
console.log('\n=== Q2b: Kiruna run at 63.83 N (Umea latitude) with its OWN longitude, same five constants ===');
const kir = loaded.find(c => c.name === 'Kiruna');
for (const [label, L] of [['true 67.86 N', 67.8558], ['63.83 N (Umea)', 63.8258]]) {
  const e = { shuruk: [], magrib: [], fajr: [], isha: [] };
  for (const r of kir.rows) {
    const mo = model(L, kir.lng, r, P);
    for (const k of Object.keys(e)) e[k].push((toH(r[k]) - mo[k]) * 60);
  }
  const s = Object.fromEntries(Object.entries(e).map(([k, v]) => [k, stat(v)]));
  console.log(`${label.padEnd(16)} shuruk ${String(s.shuruk.median).padStart(4)}/${String(s.shuruk.max).padStart(5)}  magrib ${String(s.magrib.median).padStart(4)}/${String(s.magrib.max).padStart(5)}  fajr ${String(s.fajr.median).padStart(4)}/${String(s.fajr.max).padStart(5)}  isha ${String(s.isha.median).padStart(4)}/${String(s.isha.max).padStart(5)}`);
}
writeFileSync(new URL('./sweden-latfit-summary.json', import.meta.url), JSON.stringify({ params: P, fits }, null, 2));
