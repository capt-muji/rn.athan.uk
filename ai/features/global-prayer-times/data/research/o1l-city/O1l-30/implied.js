// Implied-angle inversion: for each printed column value, find the adhan angle that
// reproduces it exactly. A constant implied angle = angle-based; a drifting one = interval.
const fs = require('fs');
const adhan = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan');
const { Coordinates, CalculationParameters, PrayerTimes, Rounding } = adhan;

const file = process.argv[2], tz = process.argv[3];
const { meta, rows } = JSON.parse(fs.readFileSync(file, 'utf8'));
const dates = Object.keys(rows).sort();
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const lm = d => { const p = fmt.formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {}); let h = +p.hour; if (h === 24) h = 0; return h * 60 + +p.minute + +p.second / 60; };
const pm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const coords = new Coordinates(meta.lat, meta.lon, 0);

function colTime(dayIso, col, angle) {
  const [y, m, d] = dayIso.split('-').map(Number);
  const p = new CalculationParameters('c', col === 'fajr' ? angle : 18, col === 'isha' ? angle : 17);
  p.rounding = Rounding.None;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  const pt = new PrayerTimes(coords, new Date(Date.UTC(y, m - 1, d, 12)), p);
  return lm(pt[col]);
}
function implied(dayIso, col) {
  const target = pm(rows[dayIso][col]);
  let lo = 0, hi = 30;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const later = col === 'isha' ? colTime(dayIso, col, mid) < target : colTime(dayIso, col, mid) > target;
    if (later) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
const out = {};
for (const col of ['fajr', 'isha']) {
  const byMonth = {};
  for (const d of dates) {
    const k = d.slice(0, 7);
    (byMonth[k] = byMonth[k] || []).push(implied(d, col));
  }
  const med = v => { const s = v.slice().sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  const monthly = Object.keys(byMonth).map(k => +med(byMonth[k]).toFixed(2));
  const all = monthly.slice().sort((a, b) => a - b);
  out[col] = { monthly, min: all[0], max: all[all.length - 1], spread: +(all[all.length - 1] - all[0]).toFixed(2) };
}
// isha as maghrib interval
const gaps = dates.map(d => pm(rows[d].isha) - pm(rows[d].maghrib));
gaps.sort((a, b) => a - b);
out.isha_minus_maghrib = { min: gaps[0], med: gaps[Math.floor(gaps.length / 2)], max: gaps[gaps.length - 1] };
// fajr as sunrise interval
const fg = dates.map(d => pm(rows[d].sunrise) - pm(rows[d].fajr));
fg.sort((a, b) => a - b);
out.sunrise_minus_fajr = { min: fg[0], med: fg[Math.floor(fg.length / 2)], max: fg[fg.length - 1] };
console.log(JSON.stringify(out, null, 1));
