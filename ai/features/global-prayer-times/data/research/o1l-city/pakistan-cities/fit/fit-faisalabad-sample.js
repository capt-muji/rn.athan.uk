const fs = require('fs');
const { Coordinates, CalculationParameters, PrayerTimes, Madhab, Rounding } = require(`${process.env.HOME}/athan-gitree/census/adhan-build/node_modules/adhan`);

const src = JSON.parse(fs.readFileSync(`${__dirname}/../data/faisalabad-january-sample.json`, 'utf8'));
const coords = new Coordinates(31.4187, 73.0791);
const P = new CalculationParameters('x');
P.fajrAngle = 18;
P.ishaAngle = 18;
P.madhab = Madhab.Hanafi;
P.rounding = Rounding.None;
P.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

const mins = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toMin = (d) => {
  const [h, m, s] = d.toLocaleString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).split(':').map(Number);
  return h * 60 + m + s / 60;
};
const pm = (v) => (v < 12 * 60 ? v + 720 : v);

const acc = { fajr: [], sunrise: [], zuhr: [], asr: [], maghrib: [], isha: [], zawalMinusZuhr: [] };
for (const [day, fajr, sunrise, zawal, zuhr, asr, maghrib, isha] of src.rows) {
  const pt = new PrayerTimes(coords, new Date(Date.UTC(2026, 0, day, 12)), P);
  const chart = { fajr: mins(fajr), sunrise: mins(sunrise), zuhr: pm(mins(zuhr)), asr: pm(mins(asr)), maghrib: pm(mins(maghrib)), isha: pm(mins(isha)) };
  for (const c of ['fajr', 'sunrise', 'zuhr', 'asr', 'maghrib', 'isha']) acc[c].push(chart[c] - toMin(pt[c === 'zuhr' ? 'dhuhr' : c]));
  acc.zawalMinusZuhr.push(chart.zuhr - mins(zawal));
}
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log('Faisalabad perpetual chart, January 2026, 31 rows, Karachi 18/18 Hanafi');
for (const c of ['fajr', 'sunrise', 'zuhr', 'asr', 'maghrib', 'isha']) {
  const a = acc[c];
  console.log(c.padEnd(8), `median ${med(a).toFixed(1)}`, `mean ${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1)}`, `min ${Math.min(...a).toFixed(1)}`, `max ${Math.max(...a).toFixed(1)}`);
}
console.log('zawal->zuhr gap min', Math.min(...acc.zawalMinusZuhr), 'max', Math.max(...acc.zawalMinusZuhr));
