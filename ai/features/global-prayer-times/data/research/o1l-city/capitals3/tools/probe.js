const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding } = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const [lat, lon, tz, date] = process.argv.slice(2);
const c = new Coordinates(+lat, +lon);
const p = new PrayerTimes(c, new Date(date), CalculationMethod.MuslimWorldLeague());
p.madhab = Madhab.Shafi;
const f = (d) => d.toLocaleTimeString('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit' });
console.log(date, 'fajr', f(p.fajr), 'sunrise', f(p.sunrise), 'dhuhr', f(p.dhuhr), 'asr', f(p.asr), 'maghrib', f(p.maghrib), 'isha', f(p.isha));
