// R11 Part 2, the hemisphere check. Table D measured Ushuaia (54.80 S) with an Isha spread of
// 181 minutes mean against a Fajr spread of 78, while every northern city at a comparable
// latitude has the two within 10 minutes of each other. A physical asymmetry of that size at
// 55 degrees is not possible, so the asymmetry is in a RULE, not in the sky. This script finds
// which rule, by mirroring each city across the equator and comparing each rule against its
// own mirror image.
//
// R7 already found one hemisphere bug of this kind: adhan's `recommended()` tests the SIGNED
// latitude, so it never fires below the equator. This tests every rule in the catalogue for the
// same class of defect.
import { frame, RULES, nearestDay, norwayFrozenClock, wifaqHarajCap, moonsightingText, halfDay, SUNRISE_ANG } from './rules.mjs';
import { midDay } from '../countries/solar-harness.mjs';

const PAIRS = [
  ['London 51.5N', 51.5074, -0.1278, 'mirror 51.5S', -51.5074],
  ['Copenhagen 55.7N', 55.6761, 12.5683, 'Ushuaia-band 55.7S', -55.6761],
  ['Oslo 59.9N', 59.9139, 10.7522, 'mirror 59.9S', -59.9139],
  ['Tromso 69.6N', 69.6492, 18.9553, 'mirror 69.6S', -69.6492],
];
const FAJR = 18, ISHA = 17, Y = 2026;
const DAYS = (() => { const a = [], dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; for (let m = 1; m <= 12; m++) for (let d = 1; d <= dim[m - 1]; d++) a.push([m, d]); return a; })();
const rel = (v, noon) => v === null ? null : (v - noon) * 60;
const stat = a => { const s = a.filter(x => x !== null).map(Math.abs).sort((x, y) => x - y); return s.length ? { n: s.length, mean: +(s.reduce((p, q) => p + q, 0) / s.length).toFixed(1), max: +s[s.length - 1].toFixed(1) } : null; };

// Each rule reduced to a per-day array of { fajr, isha } in minutes from solar noon.
function runCity(lat, lng, tz) {
  const frames = DAYS.map(([m, d]) => ({ m, d, f: frame(lat, lng, tz, Y, m, d, FAJR, ISHA) }));
  const ay3 = nearestDay(frames.map(x => x.f), '3day');
  const clk = norwayFrozenClock(frames.map(x => x.f));
  const cap = wifaqHarajCap(lat, lng, tz, Y);
  const res = {};
  const add = (n, i, v, noon) => { (res[n] ||= [])[i] = { fajr: rel(v.fajr, noon), isha: rel(v.isha, noon) }; };
  frames.forEach((x, i) => {
    const ctx = { lat, lng, tz, y: Y, m: x.m, d: x.d }, noon = x.f.noon;
    for (const n of ['AngleOnly', 'MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle', 'SwedenIFiS', 'Diyanet', 'BelgiumLat45', 'AqrabBalad485', 'AqrabBaladWalk']) add(n, i, RULES[n].fn(x.f, ctx), noon);
    add('AqrabAyyam3Day', i, ay3[i], noon);
    add('NorwayFrozenClock', i, clk[i], noon);
    add('MoonsightingText', i, moonsightingText(x.f, ctx), noon);
    const h15 = frame(lat, lng, tz, Y, x.m, x.d, FAJR, 15);
    add('WifaqIshaCap', i, { fajr: ay3[i].fajr, isha: h15.angIsha === null ? cap : (cap === null ? h15.angIsha : Math.min(h15.angIsha, cap)) }, noon);
  });
  return { res, harajCap: cap };
}

console.log('=== the "longest day of the year" in the Wifaqul Ulama Haraj cap, searched May to July ===');
console.log('this is how the rule is worded; the script that implements it literally searches those months');
console.log('location            lat      capFoundAt(local h)  trueLongestDayMonth');
for (const [nN, lat, lng] of PAIRS) {
  for (const L of [lat, -lat]) {
    const cap = wifaqHarajCap(L, lng, 0, Y);
    // find the real longest day of the year for this latitude
    let best = -1, bm = 0, bd = 0;
    for (const [m, d] of DAYS) { const h = halfDay(L, lng, 0, Y, m, d, SUNRISE_ANG); if (h.half !== null && h.half > best) { best = h.half; bm = m; bd = d; } }
    console.log(`${(L > 0 ? 'north' : 'south').padEnd(19)} ${L.toFixed(2).padStart(7)}      ${cap === null ? 'null' : cap.toFixed(2).padStart(13)}  ${String(bm).padStart(2)}/${String(bd).padStart(2)}, half-day ${best.toFixed(2)} h`);
  }
}

console.log('\n=== each rule against its own mirror image across the equator, minutes from solar noon ===');
console.log('a symmetric rule reads 0/0; anything else is the rule encoding a hemisphere assumption');
for (const [nameN, lat, lng] of PAIRS) {
  const north = runCity(lat, lng, 0), south = runCity(-lat, lng, 0);
  console.log(`\n--- ${nameN} against ${(-lat).toFixed(2)} at the same longitude ---`);
  console.log('rule                  fajr mean/max   isha mean/max   northNulls  southNulls');
  for (const n of Object.keys(north.res)) {
    // Mirror the date: day-of-year i in the north corresponds to i + 182.5 in the south.
    const dF = [], dI = [];
    let nn = 0, sn = 0;
    for (let i = 0; i < 365; i++) {
      const j = (i + 183) % 365;
      const a = north.res[n][i], b = south.res[n][j];
      if (a.fajr === null || a.isha === null) nn++;
      if (b.fajr === null || b.isha === null) sn++;
      if (a.fajr !== null && b.fajr !== null) dF.push(a.fajr - b.fajr);
      if (a.isha !== null && b.isha !== null) dI.push(a.isha - b.isha);
    }
    const sF = stat(dF), sI = stat(dI);
    const flag = (sF && sF.max > 10) || (sI && sI.max > 10) ? '  <-- ASYMMETRIC' : '';
    console.log(`${n.padEnd(21)} ${String(sF?.mean ?? '-').padStart(6)}/${String(sF?.max ?? '-').padStart(6)}   ${String(sI?.mean ?? '-').padStart(6)}/${String(sI?.max ?? '-').padStart(6)}   ${String(nn).padStart(9)}  ${String(sn).padStart(10)}${flag}`);
  }
}
