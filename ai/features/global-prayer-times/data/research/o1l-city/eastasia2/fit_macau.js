/* Macau: fit the Macau Islamic Cultural Exchange Promotion Association's Ramadan 1447
 * fasting table. Two columns only (imsak, iftar), so the recipe reads as a pair of
 * intervals on the solar times.
 * Engine adhan 4.4.6, TZ Asia/Macau, dates from the printed month-day in 2026. */
const fs = require('fs');
const path = require('path');
if (process.env.TZ !== 'Asia/Macau') throw new Error('TZ must be Asia/Macau');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'data',
  'macau_1447_ramadan_transcribed.json'), 'utf8'));
const c = new adhan.Coordinates(22.1987, 113.5439);
const toMin = (d) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
const wrap = (v) => { let x = v; while (x < -720) x += 1440; while (x >= 720) x -= 1440; return x; };
const m = (s) => { const [h, mm] = s.split(':').map(Number); return h * 60 + mm; };
function params(f, i, mad) {
  const x = new adhan.CalculationParameters();
  x.fajrAngle = f; x.ishaAngle = i; x.madhab = mad;
  x.rounding = adhan.Rounding.None;
  x.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  return x;
}
const stat = (a) => {
  const abs = a.map(Math.abs);
  const s = [...a].sort((x, y) => x - y);
  return { n: a.length, mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2),
           mae: +(abs.reduce((x, y) => x + y, 0) / a.length).toFixed(2),
           p05: +s[Math.floor(a.length * 0.05)].toFixed(1), p95: +s[Math.floor(a.length * 0.95)].toFixed(1),
           min: +s[0].toFixed(1), max: +s[s.length - 1].toFixed(1),
           within1: +(abs.filter((v) => v <= 1).length / a.length).toFixed(3) };
};
const rows = Object.entries(src.rows).map(([k, v]) => {
  const [mm, dd] = k.split('-').map(Number);
  return { mm, dd, imsak: m(v[0]), iftar: m(v[1]) };
});
const P = (r, p) => new adhan.PrayerTimes(c, new Date(2026, r.mm - 1, r.dd, 12), p);
const base = params(18, 17, adhan.Madhab.Shafi);

// imsak as an interval under fajr, and as its own angle
const imsakInterval = stat(rows.map((r) => wrap(r.imsak - toMin(P(r, base).fajr))));
const iftarInterval = stat(rows.map((r) => wrap(r.iftar - toMin(P(r, base).sunset))));
const scanFajr = () => {
  let best = { angle: null, mae: 1e9 };
  for (let a = 15; a <= 20 + 1e-9; a += 0.1) {
    const v = stat(rows.map((r) => wrap(r.imsak - toMin(P(r, params(a, 17, adhan.Madhab.Shafi)).fajr)))).mae;
    if (v < best.mae) best = { angle: +a.toFixed(1), mae: v };
  }
  return best;
};
const out = { engine: 'adhan 4.4.6', tz: 'Asia/Macau', rows: rows.length,
              point: { lon: 113.5439, lat: 22.1987 },
              imsak_minus_fajr: imsakInterval, iftar_minus_sunset: iftarInterval,
              imsak_angle_scan: scanFajr(),
              imsak_at_18: stat(rows.map((r) => wrap(r.imsak - toMin(P(r, params(18, 17, adhan.Madhab.Shafi)).fajr)))),
              iftar_minus_nautical: stat(rows.map((r) => wrap(r.iftar -
                toMin(new adhan.PrayerTimes(c, new Date(2026, r.mm - 1, r.dd, 12),
                  (() => { const p = params(18, 17, adhan.Madhab.Shafi); p.shafaq = adhan.Shafaq.General; return p; })()).sunset)))) };
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(__dirname, 'data', 'macau_1447_fit.json'), JSON.stringify(out, null, 1));
