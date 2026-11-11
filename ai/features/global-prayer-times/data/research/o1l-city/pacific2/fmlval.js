// Validate a transcribed FML month against the recorded recipe at Suva.
// Printed clock is 12-hour without meridiem: fajr/sunrise/dhuhr are morning/noon,
// asr/maghrib/isha are afternoon/evening and take +12 when below 12.
const { timesFor, hm } = require('./fit.js');
const P = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan').Prayer;
const fs = require('fs');
const [file, ym] = process.argv.slice(2);
const rows = JSON.parse(fs.readFileSync(file, 'utf8'))[ym];
const m = (s, pm) => { const [a, b] = s.split(':').map(Number); return (pm && a < 12 ? a + 12 : a) * 60 + b; };
const lat = -18.1416, lng = 178.4419;
const acc = {};
for (const r of rows) {
  const [d, f, sr, du, asS, asH, mg, is] = r;
  const ds = `${ym}-${String(d).padStart(2, '0')}`;
  const pt = timesFor(lat, lng, ds, { fajr: 18, isha: 17 });
  const T = (k) => m(hm(pt.timeForPrayer(P[k])), false);
  const got = { fajr: m(f), sunrise: m(sr), dhuhr: m(du), asrS: m(asS, true), asrH: m(asH, true), maghrib: m(mg, true), isha: m(is, true) };
  const delta = { fajr: got.fajr - T('Fajr'), sunrise: got.sunrise - T('Sunrise'), dhuhr: got.dhuhr - T('Dhuhr'), asrS: got.asrS - T('Asr'), maghrib: got.maghrib - T('Maghrib'), isha: got.isha - T('Isha') };
  for (const [k, v] of Object.entries(delta)) (acc[k] = acc[k] || []).push(v);
  console.log(ds, JSON.stringify(delta));
}
console.log('--- summary');
for (const [k, a] of Object.entries(acc)) {
  const mn = Math.min(...a), mx = Math.max(...a);
  console.log(k, 'min', mn, 'max', mx, 'mean', (a.reduce((s, x) => s + x, 0) / a.length).toFixed(2));
}
