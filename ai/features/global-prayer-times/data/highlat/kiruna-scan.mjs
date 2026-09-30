// R11 Part 3, step 2. The Kiruna Shuruk column is 27 minutes off the true Kiruna sunrise
// on the days the sun does rise, which no rounding explains. That is the signature of a
// LATITUDE SUBSTITUTION (Aqrab al-Bilad) applied to the whole table, not just to Fajr and
// Isha. This script solves for the substituted latitude day by day and then tests whether
// one fixed latitude reproduces the whole IFiS Kiruna year.
import { readFileSync } from 'node:fs';
import { timeAtAngle, asrTime, midDay, toH, hm } from '../countries/solar-harness.mjs';

const C = { lat: 67.8558, lng: 20.2253 };
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const rows = [];
for (const line of readFileSync(new URL('../countries/se-kiruna-2026.tsv', import.meta.url), 'utf8').split('\n')) {
  const p = line.split('\t').map(s => s.trim());
  if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
}
const stat = a => {
  if (!a.length) return null;
  const s = a.map(Math.abs).sort((x, y) => x - y);
  return { n: s.length, median: +s[Math.floor(s.length / 2)].toFixed(1), p90: +s[Math.floor(0.9 * s.length)].toFixed(1), max: +s[s.length - 1].toFixed(1) };
};

// Step 1: per-day implied latitude from the printed Shuruk. Scan, do not bisect, because
// sunrise time is not monotonic in latitude across the polar boundary.
console.log('=== implied latitude from the printed Shuruk, per month ===');
console.log('month  n  minLat  medianLat  maxLat   (true Kiruna lat 67.86)');
const byMonth = {};
for (const r of rows) {
  let best = null, bestErr = 1e9;
  for (let L = 40; L <= 68.0; L += 0.02) {
    const t = timeAtAngle(2026, r.m, r.d, L, C.lng, r.tz, 0.833, -1);
    if (t === null) continue;
    const e = Math.abs(t - toH(r.shuruk));
    if (e < bestErr) { bestErr = e; best = L; }
  }
  r.impliedLat = best;
  r.impliedLatErr = bestErr * 60;
  (byMonth[r.m] ||= []).push(best);
}
for (const m of Object.keys(byMonth)) {
  const s = byMonth[m].filter(x => x !== null).sort((a, b) => a - b);
  if (!s.length) { console.log(`${MN[m]}  none`); continue; }
  console.log(`${MN[m].padEnd(6)} ${String(s.length).padStart(2)}  ${s[0].toFixed(2)}  ${s[Math.floor(s.length / 2)].toFixed(2)}     ${s[s.length - 1].toFixed(2)}`);
}

// Step 2: does one fixed substituted latitude reproduce the whole year? Scan L, score all
// six columns. Longitude and timezone stay Kiruna's, which is how Aqrab al-Bilad is defined.
console.log('\n=== one fixed substituted latitude, scored on all 365 days, all six columns ===');
console.log(' lat   fajr18  shuruk  dhohr   asr    magrib  isha16   (median abs minutes)');
let bestL = null, bestScore = 1e9;
for (let L = 55.0; L <= 68.0; L += 0.25) {
  const e = { fajr: [], shuruk: [], dhohr: [], asr: [], magrib: [], isha: [] };
  let nulls = 0;
  for (const r of rows) {
    const f = timeAtAngle(2026, r.m, r.d, L, C.lng, r.tz, 18, -1);
    const sr = timeAtAngle(2026, r.m, r.d, L, C.lng, r.tz, 0.833, -1);
    const ss = timeAtAngle(2026, r.m, r.d, L, C.lng, r.tz, 0.833, 1);
    const i = timeAtAngle(2026, r.m, r.d, L, C.lng, r.tz, 16, 1);
    const a = asrTime(2026, r.m, r.d, L, C.lng, r.tz, 1);
    const n = midDay(2026, r.m, r.d, C.lng, r.tz);
    if (f === null || sr === null || ss === null || i === null) nulls++;
    if (f !== null) e.fajr.push((toH(r.fajr) - f) * 60);
    if (sr !== null) e.shuruk.push((toH(r.shuruk) - sr) * 60);
    e.dhohr.push((toH(r.dhohr) - n) * 60);
    if (a !== null) e.asr.push((toH(r.asr) - a) * 60);
    if (ss !== null) e.magrib.push((toH(r.magrib) - ss) * 60);
    if (i !== null) e.isha.push((toH(r.isha) - i) * 60);
  }
  const med = k => e[k].length ? stat(e[k]).median : NaN;
  const score = med('shuruk') + med('magrib');
  if (score < bestScore) { bestScore = score; bestL = L; }
  if (L % 1 === 0 || Math.abs(L - 65.5) < 0.01) {
    console.log(`${L.toFixed(2)}  ${String(med('fajr')).padStart(6)}  ${String(med('shuruk')).padStart(6)}  ${String(med('dhohr')).padStart(6)}  ${String(med('asr')).padStart(5)}  ${String(med('magrib')).padStart(6)}  ${String(med('isha')).padStart(6)}   nulls=${nulls}`);
  }
}
console.log(`\nbest fixed latitude on Shuruk+Magrib: ${bestL.toFixed(2)} (score ${bestScore.toFixed(1)} min)`);

// Step 3: the substitution is probably seasonal, not year-round. Score the TRUE latitude
// against the printed columns, month by month, to locate exactly where it departs.
console.log('\n=== printed columns against the TRUE Kiruna latitude, per month, median abs minutes ===');
console.log('month  shuruk  magrib  dhohr   asr    fajr18  isha16  f18null i16null srNull');
for (let m = 1; m <= 12; m++) {
  const rs = rows.filter(r => r.m === m);
  const e = { shuruk: [], magrib: [], dhohr: [], asr: [], fajr: [], isha: [] };
  let fn = 0, iN = 0, sn = 0;
  for (const r of rs) {
    const sr = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, r.tz, 0.833, -1);
    const ss = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, r.tz, 0.833, 1);
    const f = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, r.tz, 18, -1);
    const i = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, r.tz, 16, 1);
    const a = asrTime(2026, r.m, r.d, C.lat, C.lng, r.tz, 1);
    const n = midDay(2026, r.m, r.d, C.lng, r.tz);
    if (sr === null) sn++; else e.shuruk.push((toH(r.shuruk) - sr) * 60);
    if (ss !== null) e.magrib.push((toH(r.magrib) - ss) * 60);
    e.dhohr.push((toH(r.dhohr) - n) * 60);
    if (a !== null) e.asr.push((toH(r.asr) - a) * 60);
    if (f === null) fn++; else e.fajr.push((toH(r.fajr) - f) * 60);
    if (i === null) iN++; else e.isha.push((toH(r.isha) - i) * 60);
  }
  const g = k => e[k].length ? String(stat(e[k]).median).padStart(6) : '    na';
  console.log(`${MN[m].padEnd(6)} ${g('shuruk')}  ${g('magrib')}  ${g('dhohr')}  ${g('asr')}  ${g('fajr')}  ${g('isha')}  ${String(fn).padStart(6)} ${String(iN).padStart(7)} ${String(sn).padStart(6)}`);
}

// Step 4: per-day implied latitude for the SUNSET column too, and whether the two agree.
// If IFiS substituted one place the two columns must imply the same latitude on the same day.
console.log('\n=== Shuruk-implied vs Magrib-implied latitude, sample of the summer ===');
console.log('date    printedShuruk printedMagrib  latFromShuruk  latFromMagrib  agree');
for (const r of rows.filter(x => (x.m === 5 && x.d % 7 === 1) || (x.m === 6 && x.d % 7 === 1) || (x.m === 7 && x.d % 7 === 1))) {
  let bs = null, be = 1e9, bm = null, bme = 1e9;
  for (let L = 40; L <= 68; L += 0.02) {
    const sr = timeAtAngle(2026, r.m, r.d, L, C.lng, r.tz, 0.833, -1);
    const ss = timeAtAngle(2026, r.m, r.d, L, C.lng, r.tz, 0.833, 1);
    if (sr !== null) { const e = Math.abs(sr - toH(r.shuruk)); if (e < be) { be = e; bs = L; } }
    if (ss !== null) { const e = Math.abs(ss - toH(r.magrib)); if (e < bme) { bme = e; bm = L; } }
  }
  console.log(`${MN[r.m]} ${String(r.d).padStart(2)}  ${r.shuruk}         ${r.magrib}          ${bs === null ? '  na' : bs.toFixed(2)}          ${bm === null ? '  na' : bm.toFixed(2)}         ${bs !== null && bm !== null ? Math.abs(bs - bm).toFixed(2) : 'na'}`);
}
