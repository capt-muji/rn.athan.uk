// R11 Part 3, step 3. The IFiS Kiruna table's error against the true Kiruna latitude is
// near zero at BOTH equinoxes and 68 to 106 minutes at BOTH solstices. Sunrise time is
// latitude-independent at equinox, so that pattern can only be a LATITUDE SUBSTITUTION.
// This script fits the substituted latitude precisely, on the months where the signal is
// strong, column by column, and then scores a single fixed cap across the whole year.
import { readFileSync } from 'node:fs';
import { timeAtAngle, asrTime, midDay, toH, hm } from '../countries/solar-harness.mjs';

const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL('../countries/' + f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const med = a => { if (!a.length) return NaN; const s = a.map(Math.abs).sort((x, y) => x - y); return +s[Math.floor(s.length / 2)].toFixed(1); };
const mx = a => { if (!a.length) return NaN; const s = a.map(Math.abs).sort((x, y) => x - y); return +s[s.length - 1].toFixed(1); };

const CITIES = {
  Kiruna: { f: 'se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
  Stockholm: { f: 'se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  Malmo: { f: 'se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
};

// A candidate table computed at latitude L with the city's own longitude and timezone,
// with IFiS's measured constants: Fajr 18, Isha 16, standard Asr, Dhuhr + dOff minutes.
const build = (rows, L, lng, dOff) => rows.map(r => ({
  fajr: timeAtAngle(2026, r.m, r.d, L, lng, r.tz, 18, -1),
  shuruk: timeAtAngle(2026, r.m, r.d, L, lng, r.tz, 0.833, -1),
  dhohr: midDay(2026, r.m, r.d, lng, r.tz) + dOff / 60,
  asr: asrTime(2026, r.m, r.d, L, lng, r.tz, 1),
  magrib: timeAtAngle(2026, r.m, r.d, L, lng, r.tz, 0.833, 1),
  isha: timeAtAngle(2026, r.m, r.d, L, lng, r.tz, 16, 1),
}));

const score = (rows, cand, cols, filter) => {
  const e = {};
  for (const c of cols) e[c] = [];
  rows.forEach((r, i) => {
    if (filter && !filter(r)) return;
    for (const c of cols) if (cand[i][c] !== null) e[c].push((toH(r[c]) - cand[i][c]) * 60);
  });
  return e;
};

// Step 1: fit the substituted latitude from the Shuruk column alone, on the four months
// furthest from an equinox, where sunrise time is most sensitive to latitude.
console.log('=== substituted latitude fitted from the printed Shuruk column ===');
console.log('city        window                 bestLat  medianErr  maxErr   trueLat');
for (const [name, c] of Object.entries(CITIES)) {
  const rows = load(c.f);
  for (const [wname, filt] of [
    ['Nov to Feb (winter)', r => r.m === 11 || r.m === 12 || r.m === 1 || r.m === 2],
    ['Jun to Jul (summer)', r => r.m === 6 || r.m === 7],
    ['whole year', () => true],
  ]) {
    let best = null, bm = 1e9, bmax = null;
    for (let L = 45; L <= 70; L += 0.01) {
      const cand = build(rows, L, c.lng, 0);
      const e = score(rows, cand, ['shuruk'], filt);
      if (e.shuruk.length < 10) continue;
      const m = med(e.shuruk);
      if (m < bm) { bm = m; best = L; bmax = mx(e.shuruk); }
    }
    console.log(`${name.padEnd(11)} ${wname.padEnd(22)} ${best === null ? '  na' : best.toFixed(2)}     ${bm.toFixed(1)}       ${bmax}    ${c.lat}`);
  }
}

// Step 2: for Kiruna, fit all six columns independently. If they all land on the same
// latitude, the whole table is computed at a substituted place, not just Fajr and Isha.
console.log('\n=== Kiruna, each column fitted for its own best latitude, Nov to Feb ===');
console.log('column   bestLat  medianErr  maxErr');
{
  const c = CITIES.Kiruna, rows = load(c.f);
  const filt = r => r.m === 11 || r.m === 12 || r.m === 1 || r.m === 2;
  for (const col of ['fajr', 'shuruk', 'asr', 'magrib', 'isha']) {
    let best = null, bm = 1e9, bmax = null;
    for (let L = 45; L <= 70; L += 0.01) {
      const cand = build(rows, L, c.lng, 0);
      const e = score(rows, cand, [col], filt);
      if (e[col].length < 10) continue;
      const m = med(e[col]);
      if (m < bm) { bm = m; best = L; bmax = mx(e[col]); }
    }
    console.log(`${col.padEnd(8)} ${best.toFixed(2)}     ${bm.toFixed(1)}       ${bmax}`);
  }
  // Dhuhr offset, separately, since it carries no latitude information.
  const cand = build(rows, 63, c.lng, 0);
  const de = [];
  rows.forEach((r, i) => de.push((toH(r.dhohr) - cand[i].dhohr) * 60));
  const s = de.sort((a, b) => a - b);
  console.log(`dhuhr offset from true noon: median ${s[Math.floor(s.length / 2)].toFixed(1)} min, range ${s[0].toFixed(1)} to ${s[s.length - 1].toFixed(1)}`);
}

// Step 3: the winning single hypothesis, scored over the whole year, all six columns.
console.log('\n=== Kiruna: single fixed substituted latitude, Dhuhr +5, whole year, all six columns ===');
console.log(' lat   fajr   shuruk  dhohr   asr   magrib  isha   nullDays  worstCol');
{
  const c = CITIES.Kiruna, rows = load(c.f), cols = ['fajr', 'shuruk', 'dhohr', 'asr', 'magrib', 'isha'];
  for (const L of [62.0, 62.5, 63.0, 63.2, 63.4, 63.5, 64.0, 64.5, 65.0]) {
    const cand = build(rows, L, c.lng, 5);
    const e = score(rows, cand, cols);
    const nulls = cand.filter(x => cols.some(k => x[k] === null)).length;
    const meds = cols.map(k => med(e[k]));
    console.log(`${L.toFixed(2)}  ${meds.map(v => String(v).padStart(5)).join('  ')}   ${String(nulls).padStart(6)}   ${Math.max(...meds.filter(Number.isFinite)).toFixed(1)}`);
  }
}

// Step 4: after substituting the best latitude, what residual remains and is it seasonal?
console.log('\n=== Kiruna at the fitted latitude, residual per month, median abs minutes ===');
console.log('month  fajr   shuruk  dhohr   asr   magrib  isha');
{
  const c = CITIES.Kiruna, rows = load(c.f), cols = ['fajr', 'shuruk', 'dhohr', 'asr', 'magrib', 'isha'];
  const L = 63.0;
  const cand = build(rows, L, c.lng, 5);
  for (let m = 1; m <= 12; m++) {
    const e = score(rows, cand, cols, r => r.m === m);
    console.log(`${MN[m].padEnd(6)} ${cols.map(k => String(med(e[k])).padStart(5)).join('  ')}`);
  }
}
