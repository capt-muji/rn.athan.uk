// R9: invert the Grande Mosquee de Paris's OWN published annual calendar, captured
// from the `confData` object on its Mawaqit page with `mawaqit-grab.sh`. The row
// order Mawaqit uses is [fajr, shuruq, dhuhr, asr, maghrib, isha].
//
// The single-day reading gave 16.0 degrees, not the 18 the mosque is credited with,
// so the whole year is inverted to see whether the angle is fixed or seasonal.
import { readFileSync } from 'node:fs';
import { invertRow } from './solar-harness.mjs';

const c = JSON.parse(readFileSync(new URL('./fr-gmparis-mawaqit.json', import.meta.url), 'utf8'));
const LAT = c.lat, LNG = c.lng;

// France: CEST (UTC+2) from the last Sunday in March to the last Sunday in October,
// CET (UTC+1) otherwise. In 2026 that is 29 March to 25 October.
const isSummer = (m, d) =>
  (m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25);

const rows = [];
c.calendar.forEach((month, mi) => {
  for (const [dStr, t] of Object.entries(month)) {
    const d = Number(dStr), m = mi + 1;
    if (!Array.isArray(t) || t.length < 6) continue;
    rows.push({
      m, d, tz: isSummer(m, d) ? 2 : 1,
      ...invertRow({ y: 2026, m, d, lat: LAT, lng: LNG, tz: isSummer(m, d) ? 2 : 1,
        fajr: t[0], sunrise: t[1], dhuhr: t[2], asr: t[3], maghrib: t[4], isha: t[5] }),
    });
  }
});

console.log(`${c.name} (${LAT.toFixed(4)} N, ${LNG.toFixed(4)} E), ${rows.length} published days\n`);

// Sample one day a month so the seasonal shape is visible rather than averaged away.
console.log('date   fajrAng ishaAng asrFac dhuhr+ mgrb+ isha-after-mgrb');
for (const r of rows.filter(r => r.d === 15)) {
  console.log(
    `${String(r.m).padStart(2, '0')}-15`,
    String(r.fajrAngle).padStart(7), String(r.ishaAngle).padStart(7),
    String(r.asrFactor).padStart(6), String(r.dhuhrOffsetMin).padStart(6),
    String(r.maghribMinusSunsetMin).padStart(5), String(r.ishaAfterMaghribMin).padStart(8));
}

const stat = key => {
  const a = rows.map(r => r[key]).filter(x => typeof x === 'number').sort((x, y) => x - y);
  return { min: a[0], q1: a[Math.floor(0.25 * a.length)], median: a[Math.floor(0.5 * a.length)],
    q3: a[Math.floor(0.75 * a.length)], max: a[a.length - 1] };
};
console.log('\nwhole year');
for (const k of ['fajrAngle', 'ishaAngle', 'asrFactor', 'dhuhrOffsetMin', 'maghribMinusSunsetMin', 'ishaAfterMaghribMin'])
  console.log(k.padEnd(22), JSON.stringify(stat(k)));

// Winter-only band: at 48.8 N the deep angles still have a solution in December,
// so a fixed-angle mosque should read the same number there as in September.
const winter = rows.filter(r => r.m === 12 || r.m === 1);
const wf = winter.map(r => r.fajrAngle).sort((a, b) => a - b);
const wi = winter.map(r => r.ishaAngle).sort((a, b) => a - b);
console.log(`\nDecember and January only, ${winter.length} days`);
console.log('fajrAngle  min', wf[0], 'median', wf[Math.floor(wf.length / 2)], 'max', wf[wf.length - 1]);
console.log('ishaAngle  min', wi[0], 'median', wi[Math.floor(wi.length / 2)], 'max', wi[wi.length - 1]);
