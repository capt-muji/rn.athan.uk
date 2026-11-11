// Engine cross-check: adhan 4.4.6 PrayerTimes (Other 18/17, rounding none) vs fit9/solar.py.
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');
const coords = new Coordinates(52.3702, 4.8952); // Amsterdam, job 1 coordinates
const out = {};
for (const iso of ['2025-01-15', '2025-04-15', '2025-07-15', '2025-10-15']) {
  const [y, m, d] = iso.split('-').map(Number);
  const mk = () => Object.assign(CalculationMethod.Other(), { fajrAngle: 18, ishaAngle: 17, rounding: Rounding.None });
  const pt = new PrayerTimes(coords, new Date(Date.UTC(y, m - 1, d, 12)), mk());
  const utcmin = x => (x.getTime() / 60000) % 1440;
  out[iso] = {
    fajr18: pt.fajr === null ? null : utcmin(pt.fajr),
    sunrise: utcmin(pt.sunrise),
    dhuhr: utcmin(pt.dhuhr),
    maghrib: utcmin(pt.maghrib),
    isha17: pt.isha === null ? null : utcmin(pt.isha),
  };
}
fs.writeFileSync(process.env.HOME + '/athan-gitree/census/o1k-wide/fit9/adhan_times.json', JSON.stringify(out, null, 1));
console.log('written');
