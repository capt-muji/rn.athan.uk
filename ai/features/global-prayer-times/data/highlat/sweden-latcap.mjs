// R11 Part 3, the decisive structural test. Kiruna (67.86 N, 20.23 E) and Umea (63.83 N,
// 20.26 E) print the IDENTICAL solstice day, 03:16 to 22:16, despite four degrees of
// latitude between them. Gallivare and Pajala print the same day shifted by exactly their
// longitude difference. Two hypotheses explain that and they are distinguishable:
//
//   H1  a NIGHT FLOOR of 300 minutes centred on solar midnight, latitude-blind;
//   H2  a LATITUDE CAP: every city above L* is computed at L* with its own longitude.
//
// H1 and H2 coincide at the solstice and diverge in the shoulder seasons, because a capped
// latitude still tracks the declination while a fixed night floor does not. This script
// separates them by comparing the published tables of two cities against each other, which
// needs no astronomy at all beyond solar noon.
import { readFileSync } from 'node:fs';
import { timeAtAngle, midDay, toH, hm } from '../countries/solar-harness.mjs';

const SR_ANG = 1.65;
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CITIES = {
  Malmo: { f: '../countries/se-malmo-2026.tsv', lat: 55.6050, lng: 13.0038 },
  Stockholm: { f: '../countries/se-stockholm-2026.tsv', lat: 59.3293, lng: 18.0686 },
  Umea: { f: './se-umea.tsv', lat: 63.8258, lng: 20.2630 },
  Lulea: { f: './se-lulea.tsv', lat: 65.5848, lng: 22.1567 },
  Gallivare: { f: './se-gallivare.tsv', lat: 67.1333, lng: 20.6667 },
  Pajala: { f: './se-pajala.tsv', lat: 67.2117, lng: 23.3700 },
  Kiruna: { f: '../countries/se-kiruna-2026.tsv', lat: 67.8558, lng: 20.2253 },
};
const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL(f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], tz: tzOf(+p[0], +p[1]), fajr: p[2], shuruk: p[3], dhohr: p[4], asr: p[5], magrib: p[6], isha: p[7] });
  }
  return rows;
};
const st = a => {
  if (!a.length) return { n: 0, median: NaN, p90: NaN, max: NaN };
  const s = a.map(Math.abs).sort((x, y) => x - y);
  return { n: s.length, median: +s[Math.floor(s.length / 2)].toFixed(1), p90: +s[Math.floor(0.9 * s.length)].toFixed(1), max: +s[s.length - 1].toFixed(1) };
};
const data = Object.fromEntries(Object.entries(CITIES).map(([n, c]) => [n, { c, rows: load(c.f) }]));

// Test 1: city A against city B, after removing the pure solar-noon (longitude) difference.
// If a latitude cap is in force and both cities are above it, the residual is zero on every day.
console.log('=== city against city, after removing the solar-noon difference, whole year ===');
console.log('pair                     shuruk med/max   magrib med/max   fajr med/max    isha med/max');
const pairs = [['Kiruna', 'Umea'], ['Kiruna', 'Gallivare'], ['Kiruna', 'Pajala'], ['Kiruna', 'Lulea'],
  ['Gallivare', 'Pajala'], ['Lulea', 'Umea'], ['Stockholm', 'Umea'], ['Malmo', 'Stockholm']];
for (const [A, B] of pairs) {
  const a = data[A], b = data[B];
  const e = { shuruk: [], magrib: [], fajr: [], isha: [] };
  for (let k = 0; k < a.rows.length; k++) {
    const ra = a.rows[k], rb = b.rows.find(x => x.m === ra.m && x.d === ra.d);
    if (!rb) continue;
    const dNoon = (midDay(2026, ra.m, ra.d, a.c.lng, ra.tz) - midDay(2026, ra.m, ra.d, b.c.lng, rb.tz)) * 60;
    for (const k2 of ['shuruk', 'magrib', 'fajr', 'isha']) {
      e[k2].push((toH(ra[k2]) - toH(rb[k2])) * 60 - dNoon);
    }
  }
  const cell = k => { const s = st(e[k]); return `${String(s.median).padStart(5)}/${String(s.max).padEnd(6)}`; };
  console.log(`${(A + ' vs ' + B).padEnd(24)} ${['shuruk', 'magrib', 'fajr', 'isha'].map(cell).join('  ')}`);
}

// Test 2: the same comparison restricted to the days the floor cannot be binding, that is
// the winter half. A latitude cap still bites in winter (the winter day is longer at the
// capped, lower latitude); a night floor does not bite at all.
console.log('\n=== the same pairs, DECEMBER only, where a night floor cannot possibly bind ===');
console.log('pair                     shuruk med/max   magrib med/max   printedDayA   printedDayB');
for (const [A, B] of pairs) {
  const a = data[A], b = data[B];
  const e = { shuruk: [], magrib: [] };
  let dayA = null, dayB = null;
  for (const ra of a.rows.filter(r => r.m === 12)) {
    const rb = b.rows.find(x => x.m === ra.m && x.d === ra.d);
    if (!rb) continue;
    const dNoon = (midDay(2026, ra.m, ra.d, a.c.lng, ra.tz) - midDay(2026, ra.m, ra.d, b.c.lng, rb.tz)) * 60;
    e.shuruk.push((toH(ra.shuruk) - toH(rb.shuruk)) * 60 - dNoon);
    e.magrib.push((toH(ra.magrib) - toH(rb.magrib)) * 60 - dNoon);
    if (ra.d === 21) { dayA = (toH(ra.magrib) - toH(ra.shuruk)) * 60; dayB = (toH(rb.magrib) - toH(rb.shuruk)) * 60; }
  }
  const cell = k => { const s = st(e[k]); return `${String(s.median).padStart(5)}/${String(s.max).padEnd(6)}`; };
  console.log(`${(A + ' vs ' + B).padEnd(24)} ${['shuruk', 'magrib'].map(cell).join('  ')}   ${dayA === null ? 'na' : dayA.toFixed(0).padStart(5)} min     ${dayB === null ? 'na' : dayB.toFixed(0).padStart(5)} min`);
}

// Test 3: the printed December-solstice day length by latitude, against the true one.
// A latitude cap makes the winter day TOO LONG by a predictable amount.
console.log('\n=== printed vs true day length, 21 December, at a 1.65 deg horizon ===');
console.log('city        lat     printedDay  trueDay   excess   impliedCapLat');
for (const [name, c] of Object.entries(CITIES)) {
  const r = data[name].rows.find(x => x.m === 12 && x.d === 21);
  const printed = (toH(r.magrib) - toH(r.shuruk)) * 60;
  const sr = timeAtAngle(2026, 12, 21, c.lat, c.lng, r.tz, SR_ANG, -1);
  const ss = timeAtAngle(2026, 12, 21, c.lat, c.lng, r.tz, SR_ANG, 1);
  const trueDay = sr === null || ss === null ? null : (ss - sr) * 60;
  // what latitude gives a 21 December day of exactly the printed length?
  let cap = null, be = 1e9;
  for (let L = 45; L <= 70; L += 0.01) {
    const s1 = timeAtAngle(2026, 12, 21, L, c.lng, r.tz, SR_ANG, -1);
    const s2 = timeAtAngle(2026, 12, 21, L, c.lng, r.tz, SR_ANG, 1);
    if (s1 === null || s2 === null) continue;
    const e = Math.abs((s2 - s1) * 60 - printed);
    if (e < be) { be = e; cap = L; }
  }
  console.log(`${name.padEnd(11)} ${c.lat.toFixed(2)}   ${printed.toFixed(0).padStart(6)} min  ${trueDay === null ? '   none' : trueDay.toFixed(0).padStart(5) + ' min'}  ${trueDay === null ? '    na' : (printed - trueDay).toFixed(0).padStart(5)}    ${cap === null ? 'na' : cap.toFixed(2)}`);
}

// Test 4: the printed June-solstice day by latitude, and its implied cap.
console.log('\n=== printed vs true day length, 21 June, at a 1.65 deg horizon ===');
console.log('city        lat     printedDay  trueDay   deficit  impliedCapLat  printedNight');
for (const [name, c] of Object.entries(CITIES)) {
  const r = data[name].rows.find(x => x.m === 6 && x.d === 21);
  const printed = (toH(r.magrib) - toH(r.shuruk)) * 60;
  const sr = timeAtAngle(2026, 6, 21, c.lat, c.lng, r.tz, SR_ANG, -1);
  const ss = timeAtAngle(2026, 6, 21, c.lat, c.lng, r.tz, SR_ANG, 1);
  const trueDay = sr === null || ss === null ? null : (ss - sr) * 60;
  let cap = null, be = 1e9;
  for (let L = 45; L <= 70; L += 0.01) {
    const s1 = timeAtAngle(2026, 6, 21, L, c.lng, r.tz, SR_ANG, -1);
    const s2 = timeAtAngle(2026, 6, 21, L, c.lng, r.tz, SR_ANG, 1);
    if (s1 === null || s2 === null) continue;
    const e = Math.abs((s2 - s1) * 60 - printed);
    if (e < be) { be = e; cap = L; }
  }
  console.log(`${name.padEnd(11)} ${c.lat.toFixed(2)}   ${printed.toFixed(0).padStart(6)} min  ${trueDay === null ? '   none' : trueDay.toFixed(0).padStart(5) + ' min'}  ${trueDay === null ? '    na' : (printed - trueDay).toFixed(0).padStart(5)}    ${cap === null ? '   na' : cap.toFixed(2)}        ${(1440 - printed).toFixed(0)} min`);
}
