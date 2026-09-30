// R11 Part 3, the complete IFiS model. Built in four layers, each added only after the
// previous one is measured, so the report can say what each layer is worth.
//
//   L1  Shuruk and Magrib at a fixed horizon depression, fitted on Stockholm.
//   L2  a DAY LENGTH CLAMP into [300, 1140] minutes, symmetric about solar noon. This is the
//       mechanism sweden-latcap.mjs found: every IFiS city from Umea north prints exactly
//       300 min on 21 December and exactly 1140 min on 21 June regardless of latitude.
//   L3  Fajr at 18 deg and Isha at 16 deg where the angle solves AT THE CLAMPED HORIZON.
//   L4  where it does not, a night-portion floor: Fajr no earlier than fF of the CLAMPED
//       night before clamped sunrise, Isha no later than fI after clamped sunset.
//
// All four constants are fitted on Stockholm and Malmo, where the clamp never binds, and then
// applied UNCHANGED to the five northern cities including Kiruna. That is the test: if Kiruna
// falls out of constants fitted 800 km south, the rule is identified.
import { readFileSync, writeFileSync } from 'node:fs';
import { timeAtAngle, asrTime, midDay, toH, hm, sin, cos } from '../countries/solar-harness.mjs';

const CITIES = [
  { name: 'Malmo', f: '../countries/se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  { name: 'Stockholm', f: '../countries/se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  { name: 'Umea', f: './se-umea.tsv', lat: 63.8258, lng: 20.2630 },
  { name: 'Lulea', f: './se-lulea.tsv', lat: 65.5848, lng: 22.1567 },
  { name: 'Gallivare', f: './se-gallivare.tsv', lat: 67.1333, lng: 20.6667 },
  { name: 'Pajala', f: './se-pajala.tsv', lat: 67.2117, lng: 23.3700 },
  { name: 'Kiruna', f: '../countries/se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
];
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL(f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const stat = a => {
  if (!a.length) return null;
  const s = a.map(Math.abs).sort((x, y) => x - y);
  return { n: s.length, median: +s[Math.floor(s.length / 2)].toFixed(1), p90: +s[Math.floor(0.9 * s.length)].toFixed(1), max: +s[s.length - 1].toFixed(1) };
};
const jul = (y, m, d) => { if (m <= 2) { y -= 1; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; };
const declOf = (y, m, d, tz, t) => { const dd = jul(y, m, d) + (t - tz) / 24 - 2451545.0; const g = ((357.529 + 0.98560028 * dd) % 360 + 360) % 360; const q = ((280.459 + 0.98564736 * dd) % 360 + 360) % 360; const L = ((q + 1.915 * sin(g) + 0.020 * sin(2 * g)) % 360 + 360) % 360; const e = 23.439 - 0.00000036 * dd; return Math.asin(sin(e) * sin(L)) * 180 / Math.PI; };

// Half day length in hours for a depression `ang` below the horizon, or null if the sun never
// reaches it. Returns { half, polar } where polar is 'day' (sun always above) or 'night'.
function halfDay(lat, lng, tz, y, m, d, ang) {
  const noon = midDay(y, m, d, lng, tz);
  const decl = declOf(y, m, d, tz, noon);
  const c = (sin(-ang) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
  if (c >= 1) return { half: null, polar: 'night' };   // sun never that high: polar night
  if (c <= -1) return { half: null, polar: 'day' };    // sun never that low: polar day
  const t = timeAtAngle(y, m, d, lat, lng, tz, ang, 1);
  return { half: t === null ? null : t - noon, polar: null };
}

// The model, all four layers.
function model(city, r, P) {
  const noon = midDay(2026, r.m, r.d, city.lng, r.tz);
  // L1 + L2
  const h = halfDay(city.lat, city.lng, r.tz, 2026, r.m, r.d, P.horizon);
  let dayH = h.half === null ? (h.polar === 'day' ? 24 : 0) : 2 * h.half;
  const clamped = Math.min(P.dayMax / 60, Math.max(P.dayMin / 60, dayH));
  const clampedBy = Math.abs(clamped - dayH) > 1e-9;
  const shuruk = noon - clamped / 2, magrib = noon + clamped / 2;
  const nightH = 24 - clamped;
  // L3
  const hF = halfDay(city.lat, city.lng, r.tz, 2026, r.m, r.d, P.fajrAngle);
  const hI = halfDay(city.lat, city.lng, r.tz, 2026, r.m, r.d, P.ishaAngle);
  const angFajr = hF.half === null ? null : noon - hF.half;
  const angIsha = hI.half === null ? null : noon + hI.half;
  // L4 night-portion floor on the CLAMPED night
  const floorFajr = shuruk - P.fF * nightH;
  const ceilIsha = magrib + P.fI * nightH;
  const fajr = angFajr === null ? floorFajr : Math.max(angFajr, floorFajr);
  const isha = angIsha === null ? ceilIsha : Math.min(angIsha, ceilIsha);
  return { shuruk, magrib, fajr, isha, clampedBy, fajrFromFloor: angFajr === null || floorFajr > angFajr, ishaFromCeil: angIsha === null || ceilIsha < angIsha };
}

const loaded = CITIES.map(c => ({ ...c, rows: load(c.f) }));
const south = loaded.filter(c => c.name === 'Stockholm' || c.name === 'Malmo');

// ---- fit L1: the horizon depression, on the two southern cities ----------------------
let horizon = null, hErr = 1e9;
for (let a = 0.5; a <= 3.0; a += 0.01) {
  const e = [];
  for (const c of south) for (const r of c.rows) {
    const sr = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, a, -1);
    const ss = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, a, 1);
    if (sr === null || ss === null) continue;
    e.push((toH(r.shuruk) - sr) * 60, (toH(r.magrib) - ss) * 60);
  }
  const s = stat(e);
  if (s && s.median < hErr) { hErr = s.median; horizon = a; }
}
console.log('=== L1: horizon depression, fitted on Stockholm and Malmo only ===');
console.log(`horizon ${horizon.toFixed(2)} deg below the true horizon, median error ${hErr} min on Shuruk and Magrib`);

// ---- fit L3: the Fajr and Isha angles, on the southern cities, solvable days only -----
function fitAngle(col, dir) {
  let best = null, bErr = 1e9;
  for (let a = 12; a <= 20; a += 0.01) {
    const e = [];
    for (const c of south) for (const r of c.rows) {
      const t = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, a, dir);
      if (t === null) continue;
      e.push((toH(r[col]) - t) * 60);
    }
    const s = stat(e);
    if (s && s.n > 200 && s.median < bErr) { bErr = s.median; best = a; }
  }
  return { angle: best, err: bErr };
}
const fF3 = fitAngle('fajr', -1), fI3 = fitAngle('isha', 1);
console.log('\n=== L3: the twilight angles, fitted on the southern cities, solvable days only ===');
console.log(`Fajr ${fF3.angle.toFixed(2)} deg, median error ${fF3.err} min`);
console.log(`Isha ${fI3.angle.toFixed(2)} deg, median error ${fI3.err} min`);

// ---- fit L4: the night fractions, on the southern cities, UNSOLVABLE days only --------
function fitFraction(col, side) {
  let best = null, bErr = 1e9, bN = 0;
  for (let f = 0.10; f <= 0.30; f += 0.0005) {
    const e = [];
    for (const c of south) for (const r of c.rows) {
      const ang = side === 'fajr' ? fF3.angle : fI3.angle;
      const dir = side === 'fajr' ? -1 : 1;
      if (timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, ang, dir) !== null) continue;
      const noon = midDay(2026, r.m, r.d, c.lng, r.tz);
      const h = halfDay(c.lat, c.lng, r.tz, 2026, r.m, r.d, horizon);
      if (h.half === null) continue;
      const day = 2 * h.half, night = 24 - day;
      const t = side === 'fajr' ? (noon - day / 2 - f * night) : (noon + day / 2 + f * night);
      e.push((toH(r[col]) - t) * 60);
    }
    const s = stat(e);
    if (s && s.median < bErr) { bErr = s.median; best = f; bN = s.n; }
  }
  return { f: best, err: bErr, n: bN };
}
const L4F = fitFraction('fajr', 'fajr'), L4I = fitFraction('isha', 'isha');
console.log('\n=== L4: the night fractions, fitted on southern UNSOLVABLE days only ===');
console.log(`Fajr fraction ${L4F.f.toFixed(4)} (1/${(1 / L4F.f).toFixed(2)}) on ${L4F.n} days, median error ${L4F.err} min`);
console.log(`Isha fraction ${L4I.f.toFixed(4)} (1/${(1 / L4I.f).toFixed(2)}) on ${L4I.n} days, median error ${L4I.err} min`);

const P = { horizon, dayMin: 300, dayMax: 1140, fajrAngle: fF3.angle, ishaAngle: fI3.angle, fF: L4F.f, fI: L4I.f };

// ---- the test: all seven cities, the same five constants ------------------------------
console.log('\n=== all seven cities, the SAME five constants, no per-city tuning ===');
console.log(`horizon ${P.horizon.toFixed(2)} | clamp [${P.dayMin},${P.dayMax}] min | Fajr ${P.fajrAngle.toFixed(2)} deg / floor ${P.fF.toFixed(4)} | Isha ${P.ishaAngle.toFixed(2)} deg / ceil ${P.fI.toFixed(4)}`);
console.log('city         lat    clampD  floorD  shuruk m/max   magrib m/max   fajr m/p90/max    isha m/p90/max');
const out = [];
for (const c of loaded) {
  const e = { shuruk: [], magrib: [], fajr: [], isha: [] };
  let clampD = 0, floorD = 0;
  const perday = [];
  for (const r of c.rows) {
    const mo = model(c, r, P);
    if (mo.clampedBy) clampD++;
    if (mo.fajrFromFloor) floorD++;
    const row = { m: r.m, d: r.d, clamped: mo.clampedBy, fromFloor: mo.fajrFromFloor };
    for (const k of ['shuruk', 'magrib', 'fajr', 'isha']) {
      const err = (toH(r[k]) - mo[k]) * 60;
      e[k].push(err);
      row[k] = { pub: r[k], mod: hm(mo[k]), err: +err.toFixed(1) };
    }
    perday.push(row);
  }
  const s = Object.fromEntries(Object.entries(e).map(([k, v]) => [k, stat(v)]));
  console.log(`${c.name.padEnd(12)} ${c.lat.toFixed(2).padStart(5)}  ${String(clampD).padStart(5)}  ${String(floorD).padStart(6)}  ${String(s.shuruk.median).padStart(4)}/${String(s.shuruk.max).padStart(5)}   ${String(s.magrib.median).padStart(4)}/${String(s.magrib.max).padStart(5)}   ${String(s.fajr.median).padStart(4)}/${String(s.fajr.p90).padStart(4)}/${String(s.fajr.max).padStart(5)}   ${String(s.isha.median).padStart(4)}/${String(s.isha.p90).padStart(4)}/${String(s.isha.max).padStart(5)}`);
  out.push({ city: c.name, lat: c.lat, lng: c.lng, clampDays: clampD, floorDays: floorD, errors: s });
}
writeFileSync(new URL('./sweden-model-summary.json', import.meta.url), JSON.stringify({ params: P, cities: out }, null, 2));

// ---- ablation: what each layer is worth, at Kiruna -----------------------------------
console.log('\n=== ablation at Kiruna: what each layer is worth (median abs error, minutes) ===');
const kir = loaded.find(c => c.name === 'Kiruna');
const variants = [
  ['L1 only, true angles, no clamp, no floor', { ...P, dayMin: 0, dayMax: 1440, fF: null, fI: null }],
  ['L1 + L2 clamp, no floor', { ...P, fF: null, fI: null }],
  ['L1 + L3 + L4 floor, no clamp', { ...P, dayMin: 0, dayMax: 1440 }],
  ['all four layers', P],
];
console.log('variant                                     shuruk  magrib   fajr    isha   nullDays');
for (const [label, V] of variants) {
  const e = { shuruk: [], magrib: [], fajr: [], isha: [] };
  let nulls = 0;
  for (const r of kir.rows) {
    const mo = model(kir, r, { ...V, fF: V.fF ?? 0, fI: V.fI ?? 0 });
    let bad = false;
    if (V.fF === null) {
      // no floor: Fajr is the raw angle, null if unsolvable
      const noon = midDay(2026, r.m, r.d, kir.lng, r.tz);
      const hF = halfDay(kir.lat, kir.lng, r.tz, 2026, r.m, r.d, V.fajrAngle);
      const hI = halfDay(kir.lat, kir.lng, r.tz, 2026, r.m, r.d, V.ishaAngle);
      if (hF.half === null || hI.half === null) { nulls++; bad = true; }
      else { mo.fajr = noon - hF.half; mo.isha = noon + hI.half; }
    }
    if (bad) continue;
    for (const k of ['shuruk', 'magrib', 'fajr', 'isha']) e[k].push((toH(r[k]) - mo[k]) * 60);
  }
  const s = Object.fromEntries(Object.entries(e).map(([k, v]) => [k, stat(v) || { median: 'na' }]));
  console.log(`${label.padEnd(43)} ${String(s.shuruk.median).padStart(6)}  ${String(s.magrib.median).padStart(6)} ${String(s.fajr.median).padStart(6)}  ${String(s.isha.median).padStart(6)}   ${String(nulls).padStart(6)}`);
}
