const fs = require('fs');
const path = require('path');
const A = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));
const CAP = path.join(__dirname, '..', 'captures');
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ZONE = 3;
const fl = (x) => Math.floor(x + 1e-9);
const tm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const wm = (d, o) => (((d.getTime() + o * 3600000) % 86400000) + 86400000) % 86400000 / 60000;
const P = () => {
  const q = new A.CalculationParameters('Other', 18.5, 18, 0);
  q.madhab = A.Madhab.Shafi;
  q.highLatitudeRule = A.HighLatitudeRule.MiddleOfTheNight;
  q.rounding = A.Rounding.None;
  return q;
};
const C = [
  ['makkah', 21.4225, 39.8262], ['riyadh', 24.7136, 46.6753], ['medina', 24.4672, 39.6111],
  ['jeddah', 21.4858, 39.1925], ['abha', 18.2164, 42.5053], ['tabuk', 28.3835, 36.5662],
  ['dammam', 26.4207, 50.0888], ['taif', 21.2703, 40.4158], ['buraidah', 26.3260, 43.9750],
  ['hail', 27.5114, 41.7208],
];
let n2 = 0;
for (const [name, lat, lon] of C) {
  for (const yh of [1448, 1449]) {
    const raw = JSON.parse(fs.readFileSync(path.join(CAP, `sa-${name}-${yh}.json`), 'utf8'))
      .filter((r) => r.hijriDate.year === yh);
    for (const r of raw) {
      const [y, m, d] = r.date.slice(0, 10).split('-').map(Number);
      const pt = new A.PrayerTimes(new A.Coordinates(lat, lon), new Date(Date.UTC(y, m - 1, d)), P());
      const out = {
        fajr: fl(wm(pt.fajr, ZONE) + 1), sunrise: fl(wm(pt.sunrise, ZONE)),
        dhuhr: fl(wm(pt.dhuhr, ZONE) + 1), asr: fl(wm(pt.asr, ZONE) + 1),
        maghrib: fl(wm(pt.maghrib, ZONE) + 1),
      };
      out.isha = out.maghrib + (r.hijriDate.month === 9 ? 120 : 90);
      for (const c of COLS) {
        const e = out[c] - tm(r.prayerTimes[c]);
        if (Math.abs(e) > 1) {
          n2++;
          console.log(name, yh, r.date.slice(0, 10), 'H' + r.hijriDate.month + '/' + r.hijriDate.day, c,
            'tab=' + r.prayerTimes[c], 'pred=' + out[c], 'err=' + e);
        }
      }
    }
  }
}
console.log('total |err|>1 :', n2);
