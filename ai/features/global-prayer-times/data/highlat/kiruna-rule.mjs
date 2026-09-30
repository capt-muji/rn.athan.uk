// R11 Part 3: what Islamiska Forbundet i Sverige actually does above the Arctic Circle.
//
// R9 identified Sweden's sub-Arctic rule as a FROZEN FRACTION OF THE NIGHT and measured
// it to 1.0 min median at Stockholm and 1.2 at Malmo. The same construction leaves a
// median 23.5 and worst 89.3 at Kiruna (67.86 N), so R9 left the Arctic case open.
//
// This script tests every candidate construction against the IFiS Kiruna year, including
// the one R9 did not try: that IFiS freezes the SUNRISE and SUNSET columns too, and the
// substituted values are those of a lower latitude (Aqrab al-Bilad) or of a frozen day
// (Aqrab al-Ayyam as a clock time).
//
// Reuses R5's validated solar harness unchanged. No new astronomy.
import { readFileSync } from 'node:fs';
import { timeAtAngle, toH, hm } from '../countries/solar-harness.mjs';

const C = { name: 'Kiruna', lat: 67.8558, lng: 20.2253 };
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;

const rows = [];
for (const line of readFileSync(new URL('../countries/se-kiruna-2026.tsv', import.meta.url), 'utf8').split('\n')) {
  const p = line.split('\t').map(s => s.trim());
  if (p.length === 8) rows.push({ m: +p[0], d: +p[1], fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
}

const stat = a => {
  if (!a.length) return null;
  const s = a.map(Math.abs).sort((x, y) => x - y);
  return { n: s.length, median: +s[Math.floor(s.length / 2)].toFixed(1), p90: +s[Math.floor(0.9 * s.length)].toFixed(1), max: +s[s.length - 1].toFixed(1) };
};

for (const r of rows) {
  const tz = tzOf(r.m, r.d);
  r.tz = tz;
  r.trueSunrise = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, tz, 0.833, -1);
  r.trueSunset = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, tz, 0.833, 1);
  r.f18 = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, tz, 18, -1);
  r.i16 = timeAtAngle(2026, r.m, r.d, C.lat, C.lng, tz, 16, 1);
}

// 1. How many days does the sun not rise or not set at Kiruna, and how many days does an
//    18-degree Fajr / 16-degree Isha have no solution.
const noSunrise = rows.filter(r => r.trueSunrise === null).length;
const noF18 = rows.filter(r => r.f18 === null).length;
const noI16 = rows.filter(r => r.i16 === null).length;
console.log(`=== ${C.name} ${C.lat} N, IFiS published year, ${rows.length} days ===`);
console.log(`days the sun never sets or never rises (0.833 deg): ${noSunrise}`);
console.log(`days an 18-deg Fajr has no solution: ${noF18}`);
console.log(`days a 16-deg Isha has no solution: ${noI16}`);
console.log(`days IFiS prints a blank: ${rows.filter(r => /--|^$/.test(r.fajr)).length}`);

// 2. Does IFiS freeze the SUNRISE column too? Runs of identical printed values.
const runs = (key) => {
  const out = [];
  let cur = null;
  for (const r of rows) {
    if (cur && cur.v === r[key]) { cur.end = `${r.m}/${r.d}`; cur.n++; }
    else { if (cur && cur.n >= 5) out.push(cur); cur = { v: r[key], start: `${r.m}/${r.d}`, end: `${r.m}/${r.d}`, n: 1 }; }
  }
  if (cur && cur.n >= 5) out.push(cur);
  return out;
};
console.log('\n--- runs of 5 or more identical printed values, per column ---');
for (const k of ['fajr', 'shuruk', 'dhohr', 'asr', 'magrib', 'isha']) {
  const rs = runs(k);
  console.log(`${k.padEnd(7)} ${rs.length ? rs.map(x => `${x.v} x${x.n} (${x.start} to ${x.end})`).join('; ') : 'no run of 5'}`);
}

// 3. Against the true solar sunrise and sunset, how wrong is the printed Shuruk and Magrib?
const srErr = [], ssErr = [];
for (const r of rows) {
  if (r.trueSunrise !== null) srErr.push((toH(r.shuruk) - r.trueSunrise) * 60);
  if (r.trueSunset !== null) ssErr.push((toH(r.magrib) - r.trueSunset) * 60);
}
console.log('\n--- printed Shuruk vs true sunrise, on days the sun does rise ---');
console.log(JSON.stringify(stat(srErr)));
console.log('--- printed Magrib vs true sunset, on days the sun does set ---');
console.log(JSON.stringify(stat(ssErr)));

// 4. HYPOTHESIS A: Aqrab al-Bilad. Solve for the latitude L at which the computed sunrise
//    equals the printed Shuruk. If L is stable across the polar day, IFiS substituted a place.
const solveLat = (m, d, tz, target, ang, dir) => {
  let lo = 0, hi = C.lat;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const t = timeAtAngle(2026, m, d, mid, C.lng, tz, ang, dir);
    if (t === null) { hi = mid; continue; }
    // sunrise is later at higher latitude in summer, so t increases with latitude
    if (dir === -1) { if (t < target) lo = mid; else hi = mid; }
    else { if (t > target) lo = mid; else hi = mid; }
  }
  return (lo + hi) / 2;
};
console.log('\n--- HYPOTHESIS A, Aqrab al-Bilad: latitude implied by the printed Shuruk during the polar day ---');
const polar = rows.filter(r => r.trueSunrise === null);
const impliedLat = [];
for (const r of polar) {
  const L = solveLat(r.m, r.d, r.tz, toH(r.shuruk), 0.833, -1);
  impliedLat.push(L);
}
if (impliedLat.length) {
  const s = impliedLat.slice().sort((a, b) => a - b);
  console.log(`n=${s.length} min=${s[0].toFixed(2)} median=${s[Math.floor(s.length / 2)].toFixed(2)} max=${s[s.length - 1].toFixed(2)} spread=${(s[s.length - 1] - s[0]).toFixed(2)} deg`);
  console.log(`first 6: ${impliedLat.slice(0, 6).map(x => x.toFixed(2)).join(' ')}`);
  console.log(`last 6:  ${impliedLat.slice(-6).map(x => x.toFixed(2)).join(' ')}`);
}

// 5. HYPOTHESIS B: frozen clock time, carried from the last solvable day (Aqrab al-Ayyam as clock).
const froz = (key, solvKey) => {
  const first = rows.findIndex(r => r[solvKey] === null);
  if (first <= 0) return null;
  const held = toH(rows[first - 1][key]);
  // the stretch is contiguous in these tables; find its end
  let last = first;
  while (last + 1 < rows.length && rows[last + 1][solvKey] === null) last++;
  const err = [];
  for (let i = first; i <= last; i++) err.push((toH(rows[i][key]) - held) * 60);
  return { held: hm(held), from: `${rows[first].m}/${rows[first].d}`, to: `${rows[last].m}/${rows[last].d}`, stat: stat(err) };
};
console.log('\n--- HYPOTHESIS B, frozen clock time carried across the boundary ---');
console.log('Fajr  ', JSON.stringify(froz('fajr', 'f18')));
console.log('Isha  ', JSON.stringify(froz('isha', 'i16')));
console.log('Shuruk', JSON.stringify(froz('shuruk', 'trueSunrise')));
console.log('Magrib', JSON.stringify(froz('magrib', 'trueSunset')));

// 6. HYPOTHESIS C: R9's frozen fraction of the night, re-run for the record.
for (const r of rows) {
  r.night = r.trueSunrise !== null && r.trueSunset !== null ? 24 - (r.trueSunset - r.trueSunrise) : null;
}
const fb = rows.findIndex(r => r.f18 === null);
const fFrac = fb > 0 && rows[fb - 1].night ? (rows[fb - 1].trueSunrise - toH(rows[fb - 1].fajr)) / rows[fb - 1].night : null;
const fcErr = [];
for (const r of rows) if (r.f18 === null && r.night !== null && fFrac !== null) fcErr.push((toH(r.fajr) - (r.trueSunrise - r.night * fFrac)) * 60);
console.log('\n--- HYPOTHESIS C, R9 frozen fraction of the night, Fajr, only on days a night exists ---');
console.log(`boundary fraction ${fFrac !== null ? fFrac.toFixed(4) : 'n/a'}, ${JSON.stringify(stat(fcErr))}`);

// 7. HYPOTHESIS D: the printed Fajr tracks the printed Shuruk at a frozen offset.
const gap = [];
for (const r of rows) gap.push({ day: `${r.m}/${r.d}`, g: Math.round((toH(r.shuruk) - toH(r.fajr)) * 60), polar: r.trueSunrise === null });
const polarGaps = gap.filter(g => g.polar).map(g => g.g);
console.log('\n--- HYPOTHESIS D, printed Shuruk minus printed Fajr, minutes, during the polar day ---');
if (polarGaps.length) {
  const s = polarGaps.slice().sort((a, b) => a - b);
  console.log(`n=${s.length} min=${s[0]} median=${s[Math.floor(s.length / 2)]} max=${s[s.length - 1]}`);
}
const ig = rows.filter(r => r.trueSunset === null).map(r => Math.round((toH(r.isha) - toH(r.magrib)) * 60));
if (ig.length) {
  const s = ig.slice().sort((a, b) => a - b);
  console.log(`printed Isha minus printed Magrib during the polar day: n=${s.length} min=${s[0]} median=${s[Math.floor(s.length / 2)]} max=${s[s.length - 1]}`);
}

// 8. Does Kiruna's whole summer equal another Swedish city's printed times, shifted?
//    Test against the two other captured cities on the same days.
for (const [f, nm] of [['se-stockholm-2026.tsv', 'Stockholm'], ['se-malmo-2026.tsv', 'Malmo']]) {
  const other = [];
  for (const line of readFileSync(new URL('../countries/' + f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) other.push({ m: +p[0], d: +p[1], fajr: p[2], isha: p[7] });
  }
  const errs = [];
  for (const r of polar) {
    const o = other.find(x => x.m === r.m && x.d === r.d);
    if (o) errs.push((toH(r.fajr) - toH(o.fajr)) * 60);
  }
  console.log(`\n--- Kiruna printed Fajr minus ${nm} printed Fajr, polar days: ${JSON.stringify(stat(errs))} ---`);
}
