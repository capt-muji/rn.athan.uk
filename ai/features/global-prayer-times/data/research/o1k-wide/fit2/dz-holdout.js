// Hold-out: fit the twilight angles on the autumn window (Jumada I+II) and
// score them on the spring window (Ramadan), which they never saw.
import { readFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const doc = JSON.parse(readFileSync('./dz-alger-1448-merged.json', 'utf8'));
const rows = Object.entries(doc.rows).sort((a, b) => a[0].localeCompare(b[0]));
const toMin = (s) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};
const c = new Coordinates(36.7538, 3.0588);
const raw = (date, fajrAngle, ishaAngle) => {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = Madhab.Shafi;
  p.rounding = Rounding.None;
  const [y, m, d] = date.split('-').map(Number);
  const t = new PrayerTimes(c, new Date(y, m - 1, d), p);
  const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  return { fajr: mins(t.fajr), isha: mins(t.isha) };
};

const split = (list) => ({
  autumn: rows.filter(([d]) => d < '2026-12-01'),
  spring: rows.filter(([d]) => d >= '2027-02-01'),
});
const { autumn, spring } = split(rows);

const fitOn = (set, prayer) => {
  let best = null;
  for (let a = 15; a <= 21.001; a += 0.05) {
    for (const mode of ['nearest', 'floor', 'ceil']) {
      for (let m = 0; m <= 5; m++) {
        let exact = 0;
        let worst = 0;
        for (const [date, r] of set) {
          const err = Math[mode === 'nearest' ? 'round' : mode](raw(date, prayer === 'fajr' ? a : 18, prayer === 'isha' ? a : 17)[prayer] + m) - toMin(r[prayer]);
          if (err === 0) exact++;
          worst = Math.max(worst, Math.abs(err));
        }
        if (!best || worst < best.worst || (worst === best.worst && exact > best.exact)) {
          best = { angle: +a.toFixed(2), mode, margin: m, exact, worst, n: set.length };
        }
      }
    }
  }
  return best;
};

const evalOn = (set, prayer, { angle, mode, margin }) => {
  let exact = 0;
  let within1 = 0;
  let worst = 0;
  for (const [date, r] of set) {
    const err = Math[mode === 'nearest' ? 'round' : mode](raw(date, prayer === 'fajr' ? angle : 18, prayer === 'isha' ? angle : 17)[prayer] + margin) - toMin(r[prayer]);
    if (err === 0) exact++;
    if (Math.abs(err) <= 1) within1++;
    worst = Math.max(worst, Math.abs(err));
  }
  return { exact, within1, worst, n: set.length };
};

const out = {};
for (const prayer of ['fajr', 'isha']) {
  const fittedAutumn = fitOn(autumn, prayer);
  const fittedSpring = fitOn(spring, prayer);
  const fittedAll = fitOn(rows, prayer);
  out[prayer] = {
    fittedOnAutumn: fittedAutumn,
    fittedOnSpring: fittedSpring,
    fittedOnAll: fittedAll,
    autumnRecipeAppliedToSpring: evalOn(spring, prayer, fittedAutumn),
    springRecipeAppliedToAutumn: evalOn(autumn, prayer, fittedSpring),
    allRecipeAppliedToAutumn: evalOn(autumn, prayer, fittedAll),
    allRecipeAppliedToSpring: evalOn(spring, prayer, fittedAll),
  };
}
console.log(JSON.stringify(out, null, 1));
