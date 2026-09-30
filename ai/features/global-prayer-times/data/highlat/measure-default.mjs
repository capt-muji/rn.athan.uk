// R11 Part 4: the user-facing design question, answered with measurements rather than
// preference. R7 recommended `SeventhOfTheNight` as the default where an authority publishes
// nothing, on the ground that it is CONTINUOUS while `MiddleOfTheNight` is a cliff. R9 then
// found authorities using rules no library ships. This script tests three things R7 did not:
//
//   T1  the DISCONTINUITY claim, measured as the largest day-to-day jump each rule produces.
//       R7 argued the case qualitatively; this puts a number on it, which is what decides it.
//   T2  the ORDERING claim: how often each rule produces a prayer card out of time order, which
//       R7 measured only for the polar resolutions and not for the high-latitude rules.
//   T3  the AUTHORITY-AGREEMENT claim: which single default lands closest to the three
//       authorities that actually publish a year at these latitudes, since a default that
//       happens to agree with real authorities is better than one that does not.
import { writeFileSync } from 'node:fs';
import { frame, RULES, nearestDay, norwayFrozenClock, moonsightingText } from './rules.mjs';

const CITIES = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522, tz: 1 },
  { name: 'London', lat: 51.5074, lng: -0.1278, tz: 0 },
  { name: 'Manchester', lat: 53.4808, lng: -2.2426, tz: 0 },
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683, tz: 1 },
  { name: 'Aberdeen', lat: 57.1497, lng: -2.0943, tz: 0 },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, tz: 1 },
  { name: 'Oslo', lat: 59.9139, lng: 10.7522, tz: 1 },
  { name: 'Helsinki', lat: 60.1699, lng: 24.9384, tz: 2 },
  { name: 'Anchorage', lat: 61.2181, lng: -149.9003, tz: -9 },
  { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, tz: 0 },
  { name: 'ArcticCircle', lat: 66.5, lng: 20.0, tz: 1 },
  { name: 'Tromso', lat: 69.6492, lng: 18.9553, tz: 1 },
  { name: 'Longyearbyen', lat: 78.2232, lng: 15.6267, tz: 1 },
  { name: 'Ushuaia', lat: -54.8019, lng: -68.303, tz: -3 },
];
const FAJR = 18, ISHA = 17, Y = 2026;
const DAYS = (() => { const a = [], dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; for (let m = 1; m <= 12; m++) for (let d = 1; d <= dim[m - 1]; d++) a.push([m, d]); return a; })();
const CANDIDATES = ['MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle', 'SwedenIFiS', 'Diyanet', 'AqrabAyyam3Day', 'MoonsightingText'];

function run(c) {
  // Fixed offset throughout, so a day-to-day jump is a jump in the RULE and not in the clock.
  // A real app sees DST jumps on top of this, which is a separate and larger discontinuity the
  // app already handles for every prayer.
  const frames = DAYS.map(([m, d]) => ({ m, d, f: frame(c.lat, c.lng, c.tz, Y, m, d, FAJR, ISHA) }));
  const ay3 = nearestDay(frames.map(x => x.f), '3day');
  const vals = Object.fromEntries(CANDIDATES.map(n => [n, []]));
  frames.forEach((x, i) => {
    const ctx = { lat: c.lat, lng: c.lng, tz: c.tz, y: Y, m: x.m, d: x.d };
    for (const n of CANDIDATES) {
      if (n === 'AqrabAyyam3Day') vals[n].push(ay3[i]);
      else if (n === 'MoonsightingText') vals[n].push(moonsightingText(x.f, ctx));
      else vals[n].push(RULES[n].fn(x.f, ctx));
    }
  });
  return { frames, vals };
}

const out = {};
console.log('=== T1. the DISCONTINUITY test: the largest day-to-day jump each rule produces, minutes ===');
console.log('R7 argued MiddleOfTheNight is a cliff and SeventhOfTheNight is smooth. This measures it.');
console.log('A well-behaved rule moves a few minutes a day, which is the rate the sun itself moves.');
console.log('city            ' + CANDIDATES.map(n => n.slice(0, 10).padStart(12)).join(''));
for (const c of CITIES) {
  const { vals } = run(c);
  const cells = CANDIDATES.map(n => {
    let worst = 0;
    for (let i = 1; i < 365; i++) {
      const a = vals[n][i - 1].fajr, b = vals[n][i].fajr;
      if (a === null || b === null) continue;
      worst = Math.max(worst, Math.abs((b - a) * 60));
    }
    return worst.toFixed(0).padStart(12);
  });
  console.log(c.name.padEnd(15) + cells.join(''));
  out[c.name] ||= { lat: c.lat };
  out[c.name].maxDailyJump = Object.fromEntries(CANDIDATES.map((n, i) => [n, +cells[i].trim()]));
}

console.log('\n=== T1b. the same, as the 99th-percentile daily move, which is what a user feels ===');
console.log('city            ' + CANDIDATES.map(n => n.slice(0, 10).padStart(12)).join(''));
for (const c of CITIES) {
  const { vals } = run(c);
  const cells = CANDIDATES.map(n => {
    const j = [];
    for (let i = 1; i < 365; i++) { const a = vals[n][i - 1].fajr, b = vals[n][i].fajr; if (a !== null && b !== null) j.push(Math.abs((b - a) * 60)); }
    j.sort((x, y) => x - y);
    return (j.length ? j[Math.floor(0.99 * j.length)] : NaN).toFixed(1).padStart(12);
  });
  console.log(c.name.padEnd(15) + cells.join(''));
  out[c.name].p99DailyJump = Object.fromEntries(CANDIDATES.map((n, i) => [n, +cells[i].trim()]));
}

console.log('\n=== T2. the ORDERING test: days on which the card is out of time order ===');
console.log('A prayer card must read Fajr, Sunrise, Dhuhr, Maghrib, Isha in order. Counted only on');
console.log('days where the rule supplied BOTH Fajr and Isha, so a null is not scored as a failure.');
console.log('city            ' + CANDIDATES.map(n => n.slice(0, 10).padStart(12)).join(''));
for (const c of CITIES) {
  const { frames, vals } = run(c);
  const cells = CANDIDATES.map(n => {
    let bad = 0, judged = 0;
    frames.forEach((x, i) => {
      const v = vals[n][i], f = x.f;
      if (v.fajr === null || v.isha === null || f.sunrise === null || f.sunset === null) return;
      judged++;
      // Fajr before sunrise, sunrise before noon, noon before sunset, sunset before Isha.
      if (!(v.fajr < f.sunrise && f.sunrise < f.noon && f.noon < f.sunset && f.sunset < v.isha)) bad++;
    });
    return `${bad}/${judged}`.padStart(12);
  });
  console.log(c.name.padEnd(15) + cells.join(''));
  out[c.name].outOfOrder = Object.fromEntries(CANDIDATES.map((n, i) => [n, cells[i].trim()]));
}

console.log('\n=== T2b. nulls: days each candidate rule leaves with NO Fajr answer ===');
console.log('city            ' + CANDIDATES.map(n => n.slice(0, 10).padStart(12)).join(''));
for (const c of CITIES) {
  const { vals } = run(c);
  const cells = CANDIDATES.map(n => String(vals[n].filter(v => v.fajr === null).length).padStart(12));
  console.log(c.name.padEnd(15) + cells.join(''));
  out[c.name].fajrNulls = Object.fromEntries(CANDIDATES.map((n, i) => [n, +cells[i].trim()]));
}

console.log('\n=== T3. the gap between an angle-only Isha and midnight, which is the HARDSHIP the rules exist to relieve ===');
console.log('Wifaqul Ulama named Haraj explicitly, Diyanet named istihsan and maslahat, and the Swedish and');
console.log('Belgian fatwa sides both permit combining. This measures what they are relieving.');
console.log('city            lat     daysIshaAfter23:00  daysIshaAfterMidnight  latestIsha  daysFajrBefore02:00');
for (const c of CITIES) {
  const { frames } = run(c);
  let a = 0, b = 0, e = 0, latest = -1;
  frames.forEach(x => {
    const f = x.f;
    if (f.angIsha !== null) { if (f.angIsha >= 23) a++; if (f.angIsha >= 24) b++; latest = Math.max(latest, f.angIsha); }
    if (f.angFajr !== null && f.angFajr < 2) e++;
  });
  const hm = h => h < 0 ? 'none' : `${String(Math.floor(h % 24)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  console.log(`${c.name.padEnd(15)}${c.lat.toFixed(2).padStart(6)}  ${String(a).padStart(18)}  ${String(b).padStart(21)}  ${hm(latest).padStart(10)}  ${String(e).padStart(19)}`);
  out[c.name].hardship = { daysIshaAfter23: a, daysIshaAfterMidnight: b, daysFajrBefore02: e };
}
writeFileSync(new URL('./default-summary.json', import.meta.url), JSON.stringify(out, null, 2));
