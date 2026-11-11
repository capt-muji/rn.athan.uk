const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/Adhan.js');
const fs = require('fs');
const coords = new adhan.Coordinates(32.9483, -96.7299);
const tz = 'America/Chicago';
const fmt = new Intl.DateTimeFormat('en-GB', {timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false});
const hhmm = d => fmt.format(d);
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const dpt = {};
JSON.parse(fs.readFileSync('captures/dpt_iant.com.json'))[0].forEach(r => dpt[r.d_date] = r);
const mas = {};
JSON.parse(fs.readFileSync('captures/us_masjidal_iant_2026.json'))['data']['salah'].forEach(r => {
  const d = new Date(r.date);
  mas[d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')] = r;
});
const mp = t => { const m = /(\d{1,2}):(\d{2})(AM|PM)/.exec(t); let h = +m[1] % 12; if (m[3] === 'PM') h += 12; return h * 60 + +m[2]; };
const pad = n => String(n).padStart(2, '0');
const days = Object.keys(dpt).filter(k => mas[k]);
const T = {
  dptFajr: k => toMin(dpt[k].fajr_begins.slice(0, 5)),
  dptIsha: k => toMin(dpt[k].isha_begins.slice(0, 5)),
  masFajr: k => mp(mas[k].fajr),
  masIsha: k => mp(mas[k].isha),
};
function fitOne(which, target) {
  let best = null;
  for (let a = 10; a <= 21.001; a += 0.05) {
    for (const madhab of [adhan.Madhab.Shafi, adhan.Madhab.Hanafi]) {
      const p = new adhan.CalculationParameters('Other', which === 'fajr' ? a : 18, which === 'isha' ? a : 17);
      p.madhab = madhab;
      p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
      let s = 0;
      for (const k of days) {
        const [Y, M, D] = k.split('-').map(Number);
        const pt = new adhan.PrayerTimes(coords, new Date(Y, M - 1, D), p);
        s += Math.abs(toMin(hhmm(which === 'fajr' ? pt.fajr : pt.isha)) - target(k));
      }
      const mae = s / days.length;
      if (!best || mae < best.mae) best = {angle: +a.toFixed(2), mae: +mae.toFixed(2), hanafi: madhab === adhan.Madhab.Hanafi};
    }
  }
  return best;
}
console.log('days', days.length);
console.log('dpt   fajr angle', JSON.stringify(fitOne('fajr', T.dptFajr)));
console.log('dpt   isha angle', JSON.stringify(fitOne('isha', T.dptIsha)));
console.log('masj  fajr angle', JSON.stringify(fitOne('fajr', T.masFajr)));
console.log('masj  isha angle', JSON.stringify(fitOne('isha', T.masIsha)));
console.log('sample 2026-11-10 dpt', hhmm(new adhan.PrayerTimes(coords, new Date(2026, 10, 10), Object.assign(new adhan.CalculationParameters('Other', 18, 17), {highLatitudeRule: adhan.HighLatitudeRule.MiddleOfTheNight})).fajr));
