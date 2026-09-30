// R11 Part 3, step 5. Refit Kiruna using IFiS's OWN measured constants rather than
// textbook ones, recovered in sweden-angles.mjs from Malmo and Stockholm where no
// high-latitude rule fires: Fajr 18.0, sunrise and Maghrib at 1.65 deg below the horizon
// (not 0.833), Isha 16.0, Dhuhr true noon + 5 min, Asr standard factor plus a margin.
//
// Then answer the question R9 left open: at Kiruna, does IFiS substitute a LATITUDE?
import { readFileSync } from 'node:fs';
import { timeAtAngle, asrTime, midDay, toH, hm } from '../countries/solar-harness.mjs';

const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SR_ANG = 1.65; // IFiS's own, measured at Malmo and Stockholm
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
  Malmo: { f: 'se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  Stockholm: { f: 'se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  Kiruna: { f: 'se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
};

// Column-by-column implied latitude, at 0.05 deg resolution, scanning only a sensible band.
const fitLat = (rows, lng, col, ang, dir, filt, lo = 50, hi = 70) => {
  let best = null, bm = 1e9, bmax = null;
  for (let L = lo; L <= hi; L += 0.05) {
    const e = [];
    for (const r of rows) {
      if (filt && !filt(r)) continue;
      const t = col === 'asr' ? asrTime(2026, r.m, r.d, L, lng, r.tz, 1)
        : timeAtAngle(2026, r.m, r.d, L, lng, r.tz, ang, dir);
      if (t !== null) e.push((toH(r[col]) - t) * 60);
    }
    if (e.length < 8) continue;
    const m = med(e);
    if (m < bm) { bm = m; best = L; bmax = mx(e); }
  }
  return { lat: best, median: bm, max: bmax };
};

// Sanity: do Malmo and Stockholm fit their OWN latitude once the right sunrise angle is used?
console.log('=== control: with IFiS own 1.65 deg sunrise angle, does each city fit its own latitude ===');
console.log('city        column   fittedLat  trueLat  gap    medianErr  maxErr');
for (const [name, c] of Object.entries(CITIES)) {
  const rows = load(c.f);
  const winter = r => r.m === 11 || r.m === 12 || r.m === 1 || r.m === 2;
  for (const [col, ang, dir] of [['shuruk', SR_ANG, -1], ['magrib', SR_ANG, 1], ['fajr', 18, -1], ['isha', 16, 1]]) {
    const f = fitLat(rows, c.lng, col, ang, dir, winter);
    console.log(`${name.padEnd(11)} ${col.padEnd(8)} ${f.lat === null ? '  na' : f.lat.toFixed(2)}      ${c.lat.toFixed(2)}   ${f.lat === null ? ' na' : (f.lat - c.lat).toFixed(2).padStart(6)}  ${String(f.median).padStart(6)}     ${f.max}`);
  }
}

// The decisive Kiruna measurement, on all four seasons.
console.log('\n=== Kiruna: fitted latitude per season, per column, IFiS constants ===');
console.log('window          shuruk   magrib   fajr18   isha16');
{
  const c = CITIES.Kiruna, rows = load(c.f);
  const windows = [
    ['Dec to Feb', r => r.m === 12 || r.m === 1 || r.m === 2],
    ['Mar to Apr', r => r.m === 3 || r.m === 4],
    ['May to Jul', r => r.m >= 5 && r.m <= 7],
    ['Aug to Sep', r => r.m === 8 || r.m === 9],
    ['Oct to Nov', r => r.m === 10 || r.m === 11],
    ['whole year', () => true],
  ];
  for (const [wn, filt] of windows) {
    const out = [];
    for (const [col, ang, dir] of [['shuruk', SR_ANG, -1], ['magrib', SR_ANG, 1], ['fajr', 18, -1], ['isha', 16, 1]]) {
      const f = fitLat(rows, c.lng, col, ang, dir, filt);
      out.push(f.lat === null ? '  na  ' : `${f.lat.toFixed(2)}(${f.median})`);
    }
    console.log(`${wn.padEnd(15)} ${out.map(s => s.padEnd(8)).join(' ')}`);
  }
}

// The final hypothesis, scored: Kiruna's whole table is computed at a single substituted
// latitude with Kiruna's own longitude and timezone. Score it over the whole year.
console.log('\n=== Kiruna, single substituted latitude, IFiS constants, whole year, median / max abs min ===');
console.log(' lat    fajr        shuruk      dhohr      asr        magrib      isha      nullDays');
{
  const c = CITIES.Kiruna, rows = load(c.f);
  for (const L of [62.5, 63.0, 63.2, 63.4, 63.5, 63.8, 64.0, 64.5, 65.0, 65.5, 66.0, 66.57]) {
    const e = { fajr: [], shuruk: [], dhohr: [], asr: [], magrib: [], isha: [] };
    let nulls = 0;
    for (const r of rows) {
      const f = timeAtAngle(2026, r.m, r.d, L, c.lng, r.tz, 18, -1);
      const sr = timeAtAngle(2026, r.m, r.d, L, c.lng, r.tz, SR_ANG, -1);
      const ss = timeAtAngle(2026, r.m, r.d, L, c.lng, r.tz, SR_ANG, 1);
      const i = timeAtAngle(2026, r.m, r.d, L, c.lng, r.tz, 16, 1);
      const a = asrTime(2026, r.m, r.d, L, c.lng, r.tz, 1);
      const n = midDay(2026, r.m, r.d, c.lng, r.tz) + 5 / 60;
      if (f === null || sr === null || ss === null || i === null) nulls++;
      if (f !== null) e.fajr.push((toH(r.fajr) - f) * 60);
      if (sr !== null) e.shuruk.push((toH(r.shuruk) - sr) * 60);
      e.dhohr.push((toH(r.dhohr) - n) * 60);
      if (a !== null) e.asr.push((toH(r.asr) - a) * 60);
      if (ss !== null) e.magrib.push((toH(r.magrib) - ss) * 60);
      if (i !== null) e.isha.push((toH(r.isha) - i) * 60);
    }
    const cell = k => `${String(med(e[k])).padStart(4)}/${String(mx(e[k])).padEnd(5)}`;
    console.log(`${L.toFixed(2)}  ${['fajr', 'shuruk', 'dhohr', 'asr', 'magrib', 'isha'].map(cell).join('  ')}  ${String(nulls).padStart(6)}`);
  }
}

// And the per-month residual at the best latitude, to show what is left unexplained.
console.log('\n=== Kiruna at 63.40 N substituted, residual per month, median abs minutes ===');
console.log('month  fajr   shuruk  dhohr   asr   magrib  isha');
{
  const c = CITIES.Kiruna, rows = load(c.f), L = 63.40;
  for (let m = 1; m <= 12; m++) {
    const e = { fajr: [], shuruk: [], dhohr: [], asr: [], magrib: [], isha: [] };
    for (const r of rows.filter(x => x.m === m)) {
      const f = timeAtAngle(2026, r.m, r.d, L, c.lng, r.tz, 18, -1);
      const sr = timeAtAngle(2026, r.m, r.d, L, c.lng, r.tz, SR_ANG, -1);
      const ss = timeAtAngle(2026, r.m, r.d, L, c.lng, r.tz, SR_ANG, 1);
      const i = timeAtAngle(2026, r.m, r.d, L, c.lng, r.tz, 16, 1);
      const a = asrTime(2026, r.m, r.d, L, c.lng, r.tz, 1);
      const n = midDay(2026, r.m, r.d, c.lng, r.tz) + 5 / 60;
      if (f !== null) e.fajr.push((toH(r.fajr) - f) * 60);
      if (sr !== null) e.shuruk.push((toH(r.shuruk) - sr) * 60);
      e.dhohr.push((toH(r.dhohr) - n) * 60);
      if (a !== null) e.asr.push((toH(r.asr) - a) * 60);
      if (ss !== null) e.magrib.push((toH(r.magrib) - ss) * 60);
      if (i !== null) e.isha.push((toH(r.isha) - i) * 60);
    }
    console.log(`${MN[m].padEnd(6)} ${['fajr', 'shuruk', 'dhohr', 'asr', 'magrib', 'isha'].map(k => String(med(e[k])).padStart(5)).join('  ')}`);
  }
}
