// Reference times from adhan 4.4.6, for validating solar.py.
const adhan = require('adhan');

const coords = new adhan.Coordinates(53.3498, -6.2603); // Dublin
const params = new adhan.CalculationParameters();
params.fajrAngle = 16.25;
params.ishaAngle = 15.25;
params.method = adhan.CalculationMethod.Other;
params.madhab = adhan.Madhab.Shafi;
params.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
params.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

const fmt = (d) => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(d);

const out = [];
for (const iso of process.argv.slice(2)) {
  const [y, m, d] = iso.split('-').map(Number);
  const pt = new adhan.PrayerTimes(coords, new Date(Date.UTC(y, m - 1, d, 12)), params);
  out.push({
    date: iso,
    fajr: fmt(pt.fajr), sunrise: fmt(pt.sunrise), dhuhr: fmt(pt.dhuhr),
    asr: fmt(pt.asr), maghrib: fmt(pt.maghrib), isha: fmt(pt.isha),
  });
}
console.log(JSON.stringify(out, null, 0));
