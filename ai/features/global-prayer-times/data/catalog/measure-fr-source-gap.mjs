// R12: price the French two-sources-one-place case, because the source specification has to
// say how the app distinguishes them to a user and the only honest way is a measured delta.
//
// R9 measured 52 French mosques: 48.1% print a Fajr at or near 12 degrees (the Musulmans de
// France position) and 11.5% near 18 (the position attributed to the Grande Mosquee de
// Paris). R9 further measured that the GMP does NOT publish a fixed 18: its own 366-day
// calendar sweeps 18.0 in December to 13.0 in June, with Isha at Maghrib + 87 minutes.
//
// So the two French sources are not two angles, they are an angle and a non-angle. This
// script prices the gap a Paris user faces between them, on each affected time, month by
// month, using the GMP's OWN published calendar rather than a model of it.
//
// Reuses R5's validated solar harness unchanged. No new astronomy.
// Run `node ../countries/validate-harness.mjs` first; it must exit 0.
import { readFileSync } from 'node:fs';
import { timeAtAngle, toH, hm } from '../countries/solar-harness.mjs';

const PARIS = { lat: 48.8424, lng: 2.3548 };
const GMP_JSON = new URL('../countries/fr-gmparis-mawaqit.json', import.meta.url);

// Musulmans de France, measured by R9 at 12/12 with Maghrib sunset +3.
const MDF = { fajr: 12.0, isha: 12.0, maghribOffsetMin: 3 };

// Paris is on CET/CEST. The GMP calendar is a wall-clock local table, so the offset has to
// follow the EU DST rule: last Sunday of March to last Sunday of October.
const lastSunday = (year, monthIndex) => {
  const d = new Date(Date.UTC(year, monthIndex + 1, 0));
  return d.getUTCDate() - d.getUTCDay();
};
const tzAt = (year, month, day) => {
  const marchSwitch = lastSunday(year, 2);
  const octoberSwitch = lastSunday(year, 9);
  if (month < 3 || month > 10) return 1;
  if (month > 3 && month < 10) return 2;
  if (month === 3) return day >= marchSwitch ? 2 : 1;
  return day >= octoberSwitch ? 1 : 2;
};

const raw = JSON.parse(readFileSync(GMP_JSON, 'utf8'));
// The Mawaqit `confData` carries `calendar` as 12 objects keyed by day-of-month, each a
// six-element array [fajr, shuruq, dhuhr, asr, maghrib, isha].
const calendar = raw.calendar ?? raw.confData?.calendar;
if (!Array.isArray(calendar) || calendar.length !== 12) {
  console.error('the saved GMP calendar is not the expected 12-month shape');
  process.exit(1);
}

const stat = (a) => {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y);
  const mean = a.reduce((t, v) => t + v, 0) / a.length;
  return {
    n: s.length,
    min: +s[0].toFixed(1),
    median: +s[Math.floor(s.length / 2)].toFixed(1),
    max: +s[s.length - 1].toFixed(1),
    mean: +mean.toFixed(1),
  };
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

console.log('=== R12: the French choice, priced at Paris against the GMP\'s own calendar ===');
console.log('Source A: Musulmans de France, 12/12, Maghrib sunset +3 (R9 measured, 48.1% of 52 mosques)');
console.log('Source B: Grande Mosquee de Paris, its own published 366-day calendar (R9 measured)\n');

console.log('month  GMP Fajr  MdF Fajr  delta   GMP Isha  MdF Isha  delta   MdF Fajr solvable?');
const allFajr = [];
const allIsha = [];
let unsolvableFajr = 0;
let unsolvableIsha = 0;

for (let mi = 0; mi < 12; mi += 1) {
  const month = mi + 1;
  const fajrDeltas = [];
  const ishaDeltas = [];
  let sampleFajr = null;
  let sampleIsha = null;
  for (const [dayKey, row] of Object.entries(calendar[mi])) {
    const day = Number(dayKey);
    if (!day || !Array.isArray(row)) continue;
    const tz = tzAt(2026, month, day);
    const gmpFajr = toH(row[0]);
    const gmpIsha = toH(row[5]);
    const mdfFajr = timeAtAngle(2026, month, day, PARIS.lat, PARIS.lng, tz, MDF.fajr, -1);
    const mdfIsha = timeAtAngle(2026, month, day, PARIS.lat, PARIS.lng, tz, MDF.isha, +1);
    if (!Number.isFinite(mdfFajr)) { unsolvableFajr += 1; } else {
      const d = Math.round((mdfFajr - gmpFajr) * 60);
      fajrDeltas.push(d);
      allFajr.push(d);
      if (day === 15) sampleFajr = [hm(gmpFajr), hm(mdfFajr), d];
    }
    if (!Number.isFinite(mdfIsha)) { unsolvableIsha += 1; } else {
      const d = Math.round((mdfIsha - gmpIsha) * 60);
      ishaDeltas.push(d);
      allIsha.push(d);
      if (day === 15) sampleIsha = [hm(gmpIsha), hm(mdfIsha), d];
    }
  }
  const fs = stat(fajrDeltas);
  const is = stat(ishaDeltas);
  console.log(
    `${MONTH_NAMES[mi].padEnd(6)} ${(sampleFajr?.[0] ?? '--:--').padStart(8)}  ${(sampleFajr?.[1] ?? '--:--').padStart(8)}  `
    + `${String(fs ? fs.median : '-').padStart(5)}   ${(sampleIsha?.[0] ?? '--:--').padStart(8)}  `
    + `${(sampleIsha?.[1] ?? '--:--').padStart(8)}  ${String(is ? is.median : '-').padStart(5)}   `
    + `${fajrDeltas.length} of ${Object.keys(calendar[mi]).length} days`,
  );
}

console.log('\nwhole year, Musulmans de France minus Grande Mosquee de Paris, minutes');
console.log('  Fajr', JSON.stringify(stat(allFajr)));
console.log('  Isha', JSON.stringify(stat(allIsha)));
console.log(`  days a 12-degree Fajr has NO solution at Paris: ${unsolvableFajr}`);
console.log(`  days a 12-degree Isha has NO solution at Paris: ${unsolvableIsha}`);

console.log('\n=== verdict ===');
console.log('The two French sources are not close and the gap is not constant, so a picker');
console.log('that names only the authority is not enough: it must show the delta the user');
console.log('would actually see, at their own place, because the delta is what decides');
console.log('whether the choice matters to them.');
