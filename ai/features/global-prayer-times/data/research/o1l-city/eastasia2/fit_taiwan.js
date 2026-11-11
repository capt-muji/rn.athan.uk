/* Taiwan: test the Taipei mosque's stated method (fajr 18.0 MWL, iftar sunset + 4 min
 * safety buffer, Central Weather Bureau almanac) against the association's printed
 * Ramadan 1447 table, and measure the interval rule the record derived.
 * Engine adhan 4.4.6, TZ Asia/Taipei, dates from the printed month-day in 2026. */
const fs = require('fs');
const path = require('path');
if (process.env.TZ !== 'Asia/Taipei') throw new Error('TZ must be Asia/Taipei');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'data',
  'taiwan_1447_ramadan_transcribed.json'), 'utf8'));
const c = new adhan.Coordinates(25.033, 121.565);
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
  return { n: a.length, mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2),
           mae: +(abs.reduce((x, y) => x + y, 0) / a.length).toFixed(2),
           within1: +(abs.filter((v) => v <= 1).length / a.length).toFixed(3) };
};
const rows = Object.entries(src.rows).map(([k, v]) => {
  const [mm, dd] = k.split('-').map(Number);
  return { mm, dd, p: { imsak: m(v[0]), fajr: m(v[1]), sunrise: m(v[2]), dhuhr: m(v[3]),
                        asr: m(v[4]), maghrib: m(v[5]), isha: m(v[6]), iftar: m(v[7]) } };
});
const P = (r, p) => new adhan.PrayerTimes(c, new Date(2026, r.mm - 1, r.dd, 12), p);
const base = params(18, 17, adhan.Madhab.Shafi);

const solar = {};
for (const col of ['sunrise', 'sunset', 'noon']) {
  solar[col] = stat(rows.map((r) => {
    const pt = P(r, base);
    return wrap(r.p[col === 'sunset' ? 'sunset' : col] - toMin(col === 'noon' ? pt.dhuhr : pt[col]));
  }));
}
const intervals = {
  fajr_minus_sunrise: stat(rows.map((r) => r.p.fajr - r.p.sunrise)),
  isha_minus_maghrib: stat(rows.map((r) => r.p.isha - r.p.maghrib)),
  imsak_minus_fajr: stat(rows.map((r) => r.p.imsak - r.p.fajr)),
  maghrib_minus_sunset: stat(rows.map((r) => wrap(r.p.maghrib - toMin(P(r, base).sunset)))),
  iftar_minus_sunset: stat(rows.map((r) => wrap(r.p.iftar - toMin(P(r, base).sunset)))),
  dhuhr_minus_noon: stat(rows.map((r) => wrap(r.p.dhuhr - toMin(P(r, base).dhuhr)))),
  asr_minus_shafi: stat(rows.map((r) => wrap(r.p.asr - toMin(P(r, params(18, 17, adhan.Madhab.Shafi)).asr)))),
  asr_minus_hanafi: stat(rows.map((r) => wrap(r.p.asr - toMin(P(r, params(18, 17, adhan.Madhab.Hanafi)).asr)))),
};
const scan = (col, lo, hi) => {
  let best = { angle: null, mae: 1e9 };
  for (let a = lo; a <= hi + 1e-9; a += 0.1) {
    const v = stat(rows.map((r) => wrap(r.p[col] -
      toMin(P(r, params(col === 'fajr' ? a : 18, col === 'isha' ? a : 17,
                     adhan.Madhab.Shafi))[col])))).mae;
    if (v < best.mae) best = { angle: +a.toFixed(1), mae: v };
  }
  return best;
};
const out = { engine: 'adhan 4.4.6', tz: 'Asia/Taipei', rows: rows.length,
              point: { lon: 121.565, lat: 25.033 },
              solar_columns: solar, intervals,
              fajr_angle_scan: scan('fajr', 15, 20), isha_angle_scan: scan('isha', 15, 20),
              fajr_at_18: stat(rows.map((r) => wrap(r.p.fajr -
                toMin(P(r, params(18, 17, adhan.Madhab.Shafi)).fajr)))),
              offset_table: src.offset_table };
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(__dirname, 'data', 'taiwan_1447_fit.json'), JSON.stringify(out, null, 1));
