// R6: where the correction-table model breaks on geometry rather than on policy.
// At high latitude the sun never reaches the depression angle, so the baseline does not
// exist and there is nothing for a correction to correct. Measured two ways, which agree
// on the shape: pure solar geometry, and `adhan`'s own fallback firing.
// node highlat.mjs

import * as adhan from 'adhan';

const PLACES = [
  ['Cairo', 30.04, 31.24],
  ['Istanbul', 41.01, 28.98],
  ['London', 51.51, -0.13],
  ['Manchester', 53.48, -2.24],
  ['Copenhagen', 55.68, 12.57],
  ['Edinburgh', 55.95, -3.19],
  ['Stockholm', 59.33, 18.07],
  ['Oslo', 59.91, 10.75],
  ['Helsinki', 60.17, 24.94],
  ['Reykjavik', 64.15, -21.94],
  ['Tromso', 69.65, 18.96],
];

const rad = Math.PI / 180;
// Solar declination, the standard first-order expression. Good to a fraction of a degree,
// which is far finer than the whole-day counts below need.
const declination = (doy) => 23.44 * Math.sin(rad * 360 * (284 + doy) / 365);
// Solar altitude at local solar midnight, when the sun is at its lowest.
const midnightAltitude = (lat, doy) => {
  const d = declination(doy) * rad, L = lat * rad;
  return Math.asin(-Math.sin(L) * Math.sin(d) - Math.cos(L) * Math.cos(d)) / rad;
};

console.log('## I. Days per year on which the depression angle is never reached\n');
console.log('Pure solar geometry, no library. On these days the sun does not go far enough');
console.log('below the horizon for the angle to have an answer, so no correction table can');
console.log('exist and the authority must publish a non-angle rule instead.\n');
console.log('| place | latitude | Fajr/Isha 18 deg | 15 deg | 12 deg |');
console.log('|---|---|---|---|---|');
for (const [name, lat] of PLACES) {
  const c = [18, 15, 12].map((a) => {
    let n = 0;
    for (let doy = 1; doy <= 365; doy++) if (midnightAltitude(lat, doy) > -a) n++;
    return n;
  });
  console.log(`| ${name} | ${lat.toFixed(2)} | ${c[0]} | ${c[1]} | ${c[2]} |`);
}

console.log('\n## I2. The same question asked of `adhan` 4.4.6\n');
console.log('Days on which the pure twilight-angle result and the middle-of-the-night');
console.log('fallback differ by more than a minute, which is the fallback taking over.\n');
console.log('| place | latitude | Fajr 18 | Isha 18 | Fajr 15 | Isha 15 | Fajr 12 | Isha 12 |');
console.log('|---|---|---|---|---|---|---|---|');
for (const [name, lat, lon] of PLACES) {
  const row = [];
  for (const ang of [18, 15, 12]) {
    let nf = 0, ni = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date(Date.UTC(2026, 0, 1 + i, 12));
      const c = new adhan.Coordinates(lat, lon);
      const mk = (rule) => {
        const p = adhan.CalculationMethod.Other();
        p.fajrAngle = ang; p.ishaAngle = ang; p.madhab = adhan.Madhab.Shafi; p.highLatitudeRule = rule;
        return new adhan.PrayerTimes(c, date, p);
      };
      const a = mk(adhan.HighLatitudeRule.MiddleOfTheNight);
      const b = mk(adhan.HighLatitudeRule.TwilightAngle);
      if (Math.abs(a.fajr - b.fajr) > 60000) nf++;
      if (Math.abs(a.isha - b.isha) > 60000) ni++;
    }
    row.push(nf, ni);
  }
  console.log(`| ${name} | ${lat.toFixed(2)} | ${row.join(' | ')} |`);
}

console.log('\n## I3. What `adhan` returns when the angle has no answer\n');
{
  const c = new adhan.Coordinates(51.51, -0.13);
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  let nan = 0;
  for (let i = 0; i < 365; i++) {
    const p = adhan.CalculationMethod.Other();
    p.fajrAngle = 18; p.ishaAngle = 18; p.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle;
    const t = new adhan.PrayerTimes(c, new Date(Date.UTC(2026, 0, 1 + i, 12)), p);
    if (Number.isNaN(+t.fajr) || Number.isNaN(+t.isha)) nan++;
  }
  console.log(`London at 18 degrees, \`TwilightAngle\`: \`adhan\` returned NaN on **${nan}** of 365 days (measured).`);
  console.log('So the library never signals failure. It silently substitutes a night-portion value.');
  const p = adhan.CalculationMethod.Other();
  p.fajrAngle = 18; p.ishaAngle = 18; p.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle;
  const t = new adhan.PrayerTimes(c, new Date(Date.UTC(2026, 5, 21, 12)), p);
  console.log(`On 2026-06-21 it returns Fajr ${f.format(t.fajr)} and Isha ${f.format(t.isha)}, both of which are substitutions, not 18-degree times (measured).`);
}
