const fs = require('fs');
const path = require('path');
const L = require(path.join(process.env.HOME, 'athan-gitree/census/c23-russia/fit/lib'));
const S = require(path.join(process.env.HOME, 'athan-gitree/census/c23-russia/fit/solar'));

const DAY = 86400000;
const dateOf = (iso) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), 12));
const TZ = {
  'Москва': 'Europe/Moscow', 'Санкт-Петербург': 'Europe/Moscow', 'Казань': 'Europe/Moscow',
  'Астрахань': 'Europe/Samara', 'Чебоксары': 'Europe/Moscow', 'Волгоград': 'Europe/Moscow',
  'Киров': 'Europe/Moscow', 'Пенза': 'Europe/Moscow', 'Йошкар-Ола': 'Europe/Moscow',
  'Ростов-на-Дону': 'Europe/Moscow', 'Ульяновск': 'Europe/Samara', 'Самара': 'Europe/Samara',
  'Ижевск': 'Europe/Samara', 'Оренбург': 'Asia/Yekaterinburg', 'Пермь': 'Asia/Yekaterinburg',
  'Екатеринбург': 'Asia/Yekaterinburg', 'Челябинск': 'Asia/Yekaterinburg',
  'Курган': 'Asia/Yekaterinburg', 'Салехард': 'Asia/Yekaterinburg', 'Уфа': 'Asia/Yekaterinburg',
  'Хабаровск': 'Asia/Vladivostok',
};
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function scoreCity(rows, lat, lon, tz, p, exclude) {
  const out = Object.fromEntries(COLS.map((c) => [c, { n: 0, exact: 0, w1: 0, sum: 0, max: 0 }]));
  let used = 0;
  for (const [iso, r] of Object.entries(rows)) {
    if (exclude && exclude.has(iso)) continue;
    const d = dateOf(iso);
    const nx = new Date(d.getTime() + DAY);
    if (!S.angleReachable(lat, d, p.fajrAngle) || !S.angleReachable(lat, nx, p.ishaAngle)) continue;
    if (Math.abs(S.midnightAltitude(lat, d) + 18) < 0.35) continue;
    if (Math.abs(S.midnightAltitude(lat, nx) + 18) < 0.35) continue;
    const t = L.times(lat, lon, d, p, tz);
    used += 1;
    for (const c of COLS) {
      if (r[c] == null) continue;
      const ref = c === 'dhuhr' ? t.dhuhr : t[c];
      const diff = Math.abs(r[c] - ref);
      if (diff > 120) continue;
      const o = out[c];
      o.n += 1; o.sum += diff;
      if (diff < 0.5) o.exact += 1;
      if (diff <= 1.0001) o.w1 += 1;
      if (diff > o.max) o.max = diff;
    }
  }
  for (const c of COLS) {
    const o = out[c];
    o.mae = o.n ? +(o.sum / o.n).toFixed(2) : null;
    o.exact = o.n ? +(100 * o.exact / o.n).toFixed(1) : null;
    o.w1 = o.n ? +(100 * o.w1 / o.n).toFixed(1) : null;
    o.max = +o.max.toFixed(1);
    delete o.sum;
  }
  return { used, cols: out };
}

module.exports = { scoreCity, dateOf, TZ, COLS };
