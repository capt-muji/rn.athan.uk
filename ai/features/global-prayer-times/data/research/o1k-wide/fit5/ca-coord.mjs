import fs from 'node:fs';
import { load, series } from './lib.mjs';
const ROOT = process.env.HOME + '/athan-gitree/census/o1k-wide/americas/data/';
const adhan = await load();
const { CalculationParameters } = adhan;
const p = new CalculationParameters('Other', 15, 0, 0);
const raw = JSON.parse(fs.readFileSync(ROOT + 'ca_masjid_toronto_2026.json'));
const days = Object.keys(raw).sort();
const val = (col, d) => { const t = raw[d][col === 'maghrib' ? 'magrib' : col]; return parseInt(t.slice(0,2),10)*60 + parseInt(t.slice(3,5),10); };
let best = null;
for (let lat = 43.30; lat <= 44.01; lat += 0.02) {
  for (let lon = -79.70; lon <= -79.09; lon += 0.02) {
    const ser = series(adhan, { lat, lon }, days, p);
    let s = 0;
    for (let i = 0; i < days.length; i++) {
      s += Math.abs(ser.sunrise[i] / 60 + 0.5 - val('sunrise', days[i]));
      s += Math.abs(ser.maghrib[i] / 60 + 0.5 - val('maghrib', days[i]));
      s += Math.abs(ser.dhuhr[i] / 60 + 0.5 - val('dhuhr', days[i]));
      s += Math.abs(ser.asr[i] / 60 + 0.5 - val('asr', days[i]));
    }
    if (!best || s < best.s) best = { lat, lon, s };
  }
}
console.log('best lat/lon', best.lat.toFixed(2), best.lon.toFixed(2), 'mean abs residual', (best.s / (days.length * 4)).toFixed(3));
// residuals at the best fit, by month
const ser = series(adhan, { lat: best.lat, lon: best.lon }, days, p);
const monthly = {};
for (let i = 0; i < days.length; i++) {
  const m = days[i].slice(0, 7);
  (monthly[m] ||= { sunrise: [], maghrib: [], dhuhr: [], asr: [] });
  for (const c of ['sunrise', 'maghrib', 'dhuhr', 'asr']) {
    monthly[m][c].push(val(c, days[i]) - (ser[c][i] / 60 + 0.5));
  }
}
for (const [m, v] of Object.entries(monthly)) {
  const f = (a) => `${Math.min(...a).toFixed(1)}..${Math.max(...a).toFixed(1)}`;
  console.log(m, 'sunrise', f(v.sunrise), 'maghrib', f(v.maghrib), 'asr', f(v.asr), 'dhuhr', f(v.dhuhr));
}
