// R11 Part 3, the delivered result. Scores the identified IFiS model (ifis-model.mjs) against
// the authority's own published year for eleven Swedish cities, from 55.60 N to 67.86 N, and
// reports Kiruna both at its true latitude and at the 63.68 N the fit recovers.
import { readFileSync, writeFileSync } from 'node:fs';
import { toH, hm } from '../countries/solar-harness.mjs';
import { ifisDay, IFIS } from './ifis-model.mjs';

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
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL(f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const stat = a => { if (!a.length) return null; const s = a.map(Math.abs).sort((x, y) => x - y); return { n: s.length, median: +s[Math.floor(s.length / 2)].toFixed(1), p90: +s[Math.floor(0.9 * s.length)].toFixed(1), max: +s[s.length - 1].toFixed(1), within2: +(100 * s.filter(x => x <= 2).length / s.length).toFixed(1) }; };

function score(lat, lng, rows) {
  const e = { fajr: [], shuruk: [], dhohr: [], magrib: [], isha: [] };
  let clamped = 0, polarDay = 0, polarNight = 0, floorF = 0, ceilI = 0;
  for (const r of rows) {
    const mo = ifisDay(lat, lng, r.tz, 2026, r.m, r.d);
    if (mo.clamped) clamped++;
    if (mo.polar === 'day') polarDay++;
    if (mo.polar === 'night') polarNight++;
    if (mo.fajrFromFloor) floorF++;
    if (mo.ishaFromCeil) ceilI++;
    for (const k of Object.keys(e)) e[k].push((toH(r[k]) - mo[k]) * 60);
  }
  return { clamped, polarDay, polarNight, floorF, ceilI, err: Object.fromEntries(Object.entries(e).map(([k, v]) => [k, stat(v)])) };
}

const loaded = CITIES.map(c => ({ ...c, rows: load(c.f) }));
console.log('=== R11 Part 3: the IFiS model scored against the authority own published year ===');
console.log(`constants, ALL fitted on Malmo and Stockholm only: horizon ${IFIS.horizon} deg | day clamp [${IFIS.dayMin}, ${IFIS.dayMax}] min`);
console.log(`Fajr ${IFIS.fajrAngle} deg floored at ${IFIS.fF} of the clamped night | Isha ${IFIS.ishaAngle} deg capped at ${IFIS.fI}`);
console.log('');
console.log('city          lat   clampD floorD  fajr med/max/%<=2   shuruk med/max   magrib med/max   isha med/max/%<=2');
const out = [];
for (const c of loaded) {
  const s = score(c.lat, c.lng, c.rows);
  const F = s.err.fajr, S = s.err.shuruk, M = s.err.magrib, I = s.err.isha;
  console.log(`${c.name.padEnd(13)}${c.lat.toFixed(2).padStart(5)}  ${String(s.clamped).padStart(5)}  ${String(s.floorF).padStart(5)}  ${String(F.median).padStart(4)}/${String(F.max).padStart(5)}/${String(F.within2).padStart(5)}   ${String(S.median).padStart(4)}/${String(S.max).padStart(5)}    ${String(M.median).padStart(4)}/${String(M.max).padStart(5)}   ${String(I.median).padStart(4)}/${String(I.max).padStart(5)}/${String(I.within2).padStart(5)}`);
  out.push({ city: c.name, lat: c.lat, lng: c.lng, atTrueLat: s });
}

console.log('\n=== Kiruna, its true latitude against the 63.68 N the fit recovers ===');
const K = loaded.find(c => c.name === 'Kiruna');
for (const [label, L] of [['true 67.86 N', 67.8558], ['fitted 63.68 N', 63.68], ['Umea 63.83 N', 63.8258]]) {
  const s = score(L, K.lng, K.rows);
  const F = s.err.fajr, S = s.err.shuruk, M = s.err.magrib, I = s.err.isha;
  console.log(`${label.padEnd(16)} clampD ${String(s.clamped).padStart(3)}  fajr ${String(F.median).padStart(4)}/${String(F.max).padStart(5)} (${F.within2}% within 2)  shuruk ${String(S.median).padStart(4)}/${String(S.max).padStart(5)}  magrib ${String(M.median).padStart(4)}/${String(M.max).padStart(5)}  isha ${String(I.median).padStart(4)}/${String(I.max).padStart(5)} (${I.within2}%)`);
  const k = out.find(x => x.city === 'Kiruna');
  k[label.replace(/[^a-z0-9]/gi, '')] = s;
}

console.log('\n=== what the clamp is doing, per city, at its true latitude ===');
console.log('city          lat   trueDayMin  trueDayMax  clampedLowD  clampedHighD  polarDayD  polarNightD');
for (const c of loaded) {
  let lo = 0, hi = 0, pd = 0, pn = 0, mn = 1e9, mx = -1e9;
  for (const r of c.rows) {
    const mo = ifisDay(c.lat, c.lng, r.tz, 2026, r.m, r.d);
    mn = Math.min(mn, mo.rawDayMin); mx = Math.max(mx, mo.rawDayMin);
    if (mo.polar === 'day') pd++;
    if (mo.polar === 'night') pn++;
    if (mo.clamped) { if (mo.rawDayMin < IFIS.dayMin) lo++; else hi++; }
  }
  console.log(`${c.name.padEnd(13)}${c.lat.toFixed(2).padStart(5)}  ${String(mn).padStart(9)}  ${String(mx).padStart(10)}  ${String(lo).padStart(10)}  ${String(hi).padStart(11)}  ${String(pd).padStart(9)}  ${String(pn).padStart(11)}`);
}
writeFileSync(new URL('./sweden-final-summary.json', import.meta.url), JSON.stringify({ params: IFIS, cities: out }, null, 2));
