// R11 Part 3, the answer. Five northern Swedish cities, fetched from IFiS's own widget,
// all print EXACTLY 19h00 of day at the June solstice: Kiruna 03:16 to 22:16, Gallivare
// 03:14 to 22:14, Pajala 03:03 to 22:03, Lulea 03:08 to 22:08, Umea 03:16 to 22:16.
// That is a NIGHT FLOOR of 300 minutes, centred on solar midnight, not a latitude
// substitution and not R9's frozen fraction.
//
// This script states the rule precisely and scores it:
//   sunrise = min(true sunrise at 1.65 deg, solar midnight + 150 min)
//   sunset  = max(true sunset  at 1.65 deg, solar midnight - 150 min)
//   Fajr    = sunrise - f * night,  Isha = sunset + i * night, on capped days
// with f and i the authority's own boundary fractions, and night the PRINTED night.
import { readFileSync, writeFileSync } from 'node:fs';
import { timeAtAngle, midDay, toH, hm } from '../countries/solar-harness.mjs';

const SR_ANG = 1.65;
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Coordinates: the city centre, from the standard gazetteer values. Longitude matters here
// only through solar noon, so a few km is worth well under a minute.
const CITIES = [
  { name: 'Malmo', f: '../countries/se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  { name: 'Stockholm', f: '../countries/se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  { name: 'Umea', f: './se-umea.tsv', lat: 63.8258, lng: 20.2630 },
  { name: 'Lulea', f: './se-lulea.tsv', lat: 65.5848, lng: 22.1567 },
  { name: 'Gallivare', f: './se-gallivare.tsv', lat: 67.1333, lng: 20.6667 },
  { name: 'Pajala', f: './se-pajala.tsv', lat: 67.2117, lng: 23.3700 },
  { name: 'Kiruna', f: '../countries/se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
];

const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL(f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const st = a => {
  if (!a.length) return { n: 0 };
  const s = a.map(Math.abs).sort((x, y) => x - y);
  return { n: s.length, median: +s[Math.floor(s.length / 2)].toFixed(1), p90: +s[Math.floor(0.9 * s.length)].toFixed(1), max: +s[s.length - 1].toFixed(1) };
};

// Step 1: the printed day length at the solstice, and the exact minimum printed night.
console.log('=== printed day length at the June solstice, and the minimum printed night ===');
console.log('city        lat     solsticeShuruk  solsticeMagrib  solsticeDay  minPrintedNight  daysAtTheFloor');
const all = {};
for (const c of CITIES) {
  const rows = load(c.f);
  all[c.name] = { c, rows };
  const sol = rows.find(r => r.m === 6 && r.d === 21);
  const nights = rows.map(r => 1440 - (toH(r.magrib) - toH(r.shuruk)) * 60);
  const minN = Math.min(...nights);
  const atFloor = nights.filter(n => n <= minN + 0.6).length;
  console.log(`${c.name.padEnd(11)} ${c.lat.toFixed(2)}   ${sol.shuruk}           ${sol.magrib}           ${(1440 - (toH(sol.magrib) - toH(sol.shuruk)) * 60 === 0 ? '' : '')}${((toH(sol.magrib) - toH(sol.shuruk)) * 60).toFixed(0).padStart(5)} min   ${minN.toFixed(0).padStart(6)} min      ${String(atFloor).padStart(4)}`);
}

// Step 2: score the night-floor rule on the Shuruk and Magrib columns, by city.
console.log('\n=== NIGHT FLOOR of 300 minutes centred on solar midnight, scored ===');
console.log('city        floorBinds  shuruk med/p90/max   magrib med/p90/max   (minutes)');
const FLOOR = 300;
for (const c of CITIES) {
  const { rows } = all[c.name];
  const es = [], em = [];
  let binds = 0;
  for (const r of rows) {
    const noon = midDay(2026, r.m, r.d, c.lng, r.tz);
    const mid = noon - 12;                       // solar midnight at the start of this day
    const trueSr = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, SR_ANG, -1);
    const trueSs = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, SR_ANG, 1);
    const capSr = mid + FLOOR / 120;
    const capSs = (noon + 12) - FLOOR / 120;
    // The floor binds when the true night is SHORTER than 300 minutes, which means the
    // true sunrise is earlier than the capped one and the true sunset later.
    const sr = trueSr === null ? capSr : Math.max(trueSr, capSr);
    const ss = trueSs === null ? capSs : Math.min(trueSs, capSs);
    if (trueSr === null || trueSr < capSr) binds++;
    es.push((toH(r.shuruk) - sr) * 60);
    em.push((toH(r.magrib) - ss) * 60);
    r.ruleSr = sr; r.ruleSs = ss; r.capped = trueSr === null || trueSr < capSr;
  }
  const a = st(es), b = st(em);
  console.log(`${c.name.padEnd(11)} ${String(binds).padStart(6)}      ${String(a.median).padStart(4)}/${String(a.p90).padStart(4)}/${String(a.max).padEnd(5)}   ${String(b.median).padStart(4)}/${String(b.p90).padStart(4)}/${String(b.max).padEnd(5)}`);
}

// Step 3: on the capped days, at what fraction of the PRINTED night do Fajr and Isha sit?
console.log('\n=== on capped days, printed Fajr and Isha as a fraction of the printed night ===');
console.log('city        n    fajrFrac p25/median/p75      ishaFrac p25/median/p75      1/f     1/i');
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
for (const c of CITIES) {
  const { rows } = all[c.name];
  const ff = [], iff = [];
  for (const r of rows.filter(x => x.capped)) {
    const night = 1440 - (toH(r.magrib) - toH(r.shuruk)) * 60;
    ff.push((toH(r.shuruk) - toH(r.fajr)) * 60 / night);
    iff.push((toH(r.isha) - toH(r.magrib)) * 60 / night);
  }
  if (!ff.length) { console.log(`${c.name.padEnd(11)} 0    never capped`); continue; }
  console.log(`${c.name.padEnd(11)} ${String(ff.length).padStart(3)}  ${q(ff, .25).toFixed(4)}/${q(ff, .5).toFixed(4)}/${q(ff, .75).toFixed(4)}   ${q(iff, .25).toFixed(4)}/${q(iff, .5).toFixed(4)}/${q(iff, .75).toFixed(4)}   ${(1 / q(ff, .5)).toFixed(2)}  ${(1 / q(iff, .5)).toFixed(2)}`);
}

// Step 4: the full composite rule, scored on all six columns over all 365 days per city.
// Rule: Dhuhr = true noon + 5 min. Shuruk/Magrib = night floored at 300 min. Fajr = 18 deg
// if it solves at the capped geometry, else sunrise - f*night; Isha = 16 deg else sunset + i*night.
console.log('\n=== COMPOSITE RULE, all 365 days, median / p90 / max abs error in minutes ===');
console.log('city        fajr             shuruk           dhohr          magrib           isha             nullsLeft');
const summary = [];
for (const c of CITIES) {
  const { rows } = all[c.name];
  // f and i taken from the LAST uncapped day, the authority's own boundary, as R9 did.
  let f = null, i = null;
  for (let k = 1; k < rows.length; k++) {
    if (!rows[k].capped) continue;
    const r = rows[k - 1];
    const night = 1440 - (toH(r.magrib) - toH(r.shuruk)) * 60;
    f = (toH(r.shuruk) - toH(r.fajr)) * 60 / night;
    i = (toH(r.isha) - toH(r.magrib)) * 60 / night;
    break;
  }
  if (f === null) { console.log(`${c.name.padEnd(11)} never capped, the floor does not engage`); continue; }
  const e = { fajr: [], shuruk: [], dhohr: [], magrib: [], isha: [] };
  let nulls = 0;
  for (const r of rows) {
    const noon = midDay(2026, r.m, r.d, c.lng, r.tz);
    const night = (24 - (r.ruleSs - r.ruleSr)) * 60;
    const f18 = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, 18, -1);
    const i16 = timeAtAngle(2026, r.m, r.d, c.lat, c.lng, r.tz, 16, 1);
    const fajr = f18 !== null && f18 <= r.ruleSr ? f18 : r.ruleSr - night * f / 60;
    const isha = i16 !== null && i16 >= r.ruleSs ? i16 : r.ruleSs + night * i / 60;
    if (fajr === null || isha === null) nulls++;
    e.fajr.push((toH(r.fajr) - fajr) * 60);
    e.shuruk.push((toH(r.shuruk) - r.ruleSr) * 60);
    e.dhohr.push((toH(r.dhohr) - (noon + 5 / 60)) * 60);
    e.magrib.push((toH(r.magrib) - r.ruleSs) * 60);
    e.isha.push((toH(r.isha) - isha) * 60);
  }
  const cell = k => { const s = st(e[k]); return `${String(s.median).padStart(4)}/${String(s.p90).padStart(4)}/${String(s.max).padEnd(5)}`; };
  console.log(`${c.name.padEnd(11)} ${['fajr', 'shuruk', 'dhohr', 'magrib', 'isha'].map(cell).join('  ')}  ${nulls}`);
  summary.push({ city: c.name, lat: c.lat, fajrFraction: +f.toFixed(4), ishaFraction: +i.toFixed(4), cappedDays: rows.filter(r => r.capped).length, ...Object.fromEntries(['fajr', 'shuruk', 'dhohr', 'magrib', 'isha'].map(k => [k, st(e[k])])) });
}
writeFileSync(new URL('./sweden-nightfloor-summary.json', import.meta.url), JSON.stringify(summary, null, 2));

// Step 5: where does the 300-minute floor first bind? Solve for the latitude at which the
// solstice night at 1.65 deg equals exactly 300 minutes.
console.log('\n=== the latitude at which the 300-minute night floor first binds ===');
for (let L = 57; L <= 62; L += 0.01) {
  const sr = timeAtAngle(2026, 6, 21, L, 20, 2, SR_ANG, -1);
  const ss = timeAtAngle(2026, 6, 21, L, 20, 2, SR_ANG, 1);
  if (sr === null || ss === null) { console.log(`${L.toFixed(2)} N: no sunrise or sunset at the solstice`); break; }
  const night = (24 - (ss - sr)) * 60;
  if (night <= 300) { console.log(`first binds at ${L.toFixed(2)} N (solstice night ${night.toFixed(1)} min at a ${SR_ANG} deg horizon)`); break; }
}
