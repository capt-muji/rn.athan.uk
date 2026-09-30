// R11 Part 4, following up T2. The ordering test flagged `SwedenIFiS` alone as producing an
// out-of-order card, on 21 days at Reykjavik and 26 at the Arctic Circle, where every other rule
// scored 0. That deserves isolating, because it is either a defect in the rule or a defect in
// how an app would apply it, and those have opposite consequences.
//
// The hypothesis: IFiS's day-length clamp replaces SUNRISE AND SUNSET as well as Fajr and Isha.
// An app that adopts Sweden's Fajr rule while keeping the true astronomical sunrise is mixing two
// frames, and the card goes out of order. If the test is rerun against the rule's OWN clamped
// sunrise and sunset, the disorder should vanish.
import { frame, RULES } from './rules.mjs';
import { hm } from '../countries/solar-harness.mjs';

const CITIES = [
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, tz: 1 },
  { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, tz: 0 },
  { name: 'ArcticCircle', lat: 66.5, lng: 20.0, tz: 1 },
  { name: 'Tromso', lat: 69.6492, lng: 18.9553, tz: 1 },
  { name: 'Kiruna', lat: 67.8558, lng: 20.2253, tz: 1 },
];
const DAYS = (() => { const a = [], dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; for (let m = 1; m <= 12; m++) for (let d = 1; d <= dim[m - 1]; d++) a.push([m, d]); return a; })();
const MN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

console.log('=== SwedenIFiS ordering, scored two ways ===');
console.log('A: against the TRUE astronomical sunrise and sunset, which is what an app does if it');
console.log('   adopts only the Fajr and Isha rule.');
console.log('B: against the rule OWN clamped sunrise and sunset, which is what IFiS itself prints.');
console.log('city            daysJudged  A: outOfOrder   B: outOfOrder');
for (const c of CITIES) {
  let judged = 0, badA = 0, badB = 0;
  const examples = [];
  for (const [m, d] of DAYS) {
    const f = frame(c.lat, c.lng, c.tz, 2026, m, d, 18, 17);
    const v = RULES.SwedenIFiS.fn(f, { lat: c.lat, lng: c.lng, tz: c.tz, y: 2026, m, d });
    if (v.fajr === null || v.isha === null) continue;
    judged++;
    const okB = v.fajr < v.shuruk && v.shuruk < f.noon && f.noon < v.magrib && v.magrib < v.isha;
    if (!okB) badB++;
    if (f.sunrise === null || f.sunset === null) { badA++; if (examples.length < 3) examples.push({ m, d, why: 'no true sunrise or sunset at all', fajr: hm(v.fajr), clampedSr: hm(v.shuruk) }); continue; }
    const okA = v.fajr < f.sunrise && f.sunrise < f.noon && f.noon < f.sunset && f.sunset < v.isha;
    if (!okA) { badA++; if (examples.length < 3) examples.push({ m, d, fajr: hm(v.fajr), trueSr: hm(f.sunrise), clampedSr: hm(v.shuruk), trueSs: hm(f.sunset), clampedSs: hm(v.magrib), isha: hm(v.isha) }); }
  }
  console.log(`${c.name.padEnd(15)}${String(judged).padStart(10)}  ${String(badA).padStart(13)}  ${String(badB).padStart(14)}`);
  for (const e of examples) console.log(`     ${MN[e.m]} ${String(e.d).padStart(2)}: ${e.why ?? `Fajr ${e.fajr}, true sunrise ${e.trueSr}, clamped sunrise ${e.clampedSr}, true sunset ${e.trueSs}, clamped sunset ${e.clampedSs}, Isha ${e.isha}`}`);
}
