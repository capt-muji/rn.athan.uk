// R9: the Grande Mosquee de Paris's own year inverts to 18 degrees in winter and
// 13 in June, so its Fajr is not a fixed angle. At 48.84 N the sun's lowest summer
// altitude is about -17.7 degrees, so an 18-degree Fajr has no solution at all
// around the solstice and some fallback must be in use. This script identifies it.
//
// Candidates tested, each the standard published construction:
//   MiddleOfTheNight   night/2 before sunrise
//   SeventhOfTheNight  night/7 before sunrise
//   AngleBased         night * (angle/60) before sunrise
//   FixedInterval      a constant number of minutes before sunrise
// where night runs sunset to next sunrise.
import { readFileSync } from 'node:fs';
import { timeAtAngle, toH } from './solar-harness.mjs';

const c = JSON.parse(readFileSync(new URL('./fr-gmparis-mawaqit.json', import.meta.url), 'utf8'));
const LAT = c.lat, LNG = c.lng;
const isSummer = (m, d) => (m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25);

const days = [];
c.calendar.forEach((month, mi) => {
  for (const [dStr, t] of Object.entries(month)) {
    if (!Array.isArray(t) || t.length < 6) continue;
    days.push({ m: mi + 1, d: Number(dStr), fajr: t[0], sunrise: t[1], maghrib: t[4], isha: t[5] });
  }
});

const errs = { middle: [], seventh: [], angle18: [], fixed90: [] };
for (const r of days) {
  const tz = isSummer(r.m, r.d) ? 2 : 1;
  const sunrise = timeAtAngle(2026, r.m, r.d, LAT, LNG, tz, 0.833, -1);
  const sunsetPrev = timeAtAngle(2026, r.m, r.d - 1 || 28, LAT, LNG, tz, 0.833, 1);
  const night = 24 - (sunsetPrev - sunrise); // sunset yesterday to sunrise today
  const pub = toH(r.fajr);
  errs.middle.push((pub - (sunrise - night / 2)) * 60);
  errs.seventh.push((pub - (sunrise - night / 7)) * 60);
  errs.angle18.push((pub - (sunrise - night * 18 / 60)) * 60);
}

const stat = a => {
  const s = [...a].map(Math.abs).sort((x, y) => x - y);
  return { medianAbsErrMin: +s[Math.floor(s.length / 2)].toFixed(1), maxAbsErrMin: +s[s.length - 1].toFixed(1) };
};
console.log('Fajr against each high-latitude construction, whole published year');
for (const [k, a] of Object.entries(errs)) if (a.length) console.log(k.padEnd(10), JSON.stringify(stat(a)));

// Same question for Isha, which inverted to a suspiciously flat 87 minutes.
const gaps = days.map(r => Math.round((toH(r.isha) - toH(r.maghrib)) * 60));
const hist = {};
for (const g of gaps) hist[g] = (hist[g] || 0) + 1;
console.log('\nIsha minus Maghrib, minutes, over the published year');
for (const [g, n] of Object.entries(hist).sort((a, b) => b[1] - a[1]))
  console.log(String(g).padStart(5), 'min on', String(n).padStart(3), 'days');
