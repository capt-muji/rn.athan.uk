/* Hong Kong: fit the Trustees' printed sheet (page 1) transcribed from the live PDF.
 * Engine adhan 4.4.6, TZ Asia/Hong_Kong, dates from the printed month-day only (no year:
 * the sheet carries no year stamp, so every row is computed on a leap-neutral year and
 * the 0.1-deg resolution is what the comparison can carry).
 * Purpose: does the live artifact reproduce the record's characterisation, and do the two
 * pages really disagree? */
const fs = require('fs');
const path = require('path');
if (process.env.TZ !== 'Asia/Hong_Kong') throw new Error('TZ must be Asia/Hong_Kong');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'data',
  'hk_trustees_page1_transcribed.json'), 'utf8'));
const c = new adhan.Coordinates(22.34, 114.161);
const toMin = (d) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
const wrap = (v) => { let x = v; while (x < -720) x += 1440; while (x >= 720) x -= 1440; return x; };
const m = (s) => { const [h, mm] = s.split(':').map(Number); return h * 60 + mm; };
function params(fajr, isha, madhab) {
  const x = new adhan.CalculationParameters();
  x.fajrAngle = fajr; x.ishaAngle = isha; x.madhab = madhab;
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
  return { mm, dd, p: { fajr: m(v[0]), zuhr: m(v[1]), asr_shafee: m(v[2]),
                        asr_hanafee: m(v[3]), maghrib: m(v[4]), isha: m(v[5]),
                        sunrise: m(v[6]), noon: m(v[7]), sunset: m(v[8]) } };
});
const P = (r, p) => new adhan.PrayerTimes(c, new Date(2025, r.mm - 1, r.dd, 12), p);

// coordinate check on the margin-free columns
const solar = {};
for (const col of ['sunrise', 'sunset', 'noon']) {
  solar[col] = stat(rows.map((r) => {
    const pt = P(r, params(18, 17, adhan.Madhab.Shafi));
    const eng = col === 'noon' ? pt.dhuhr : pt[col];
    return wrap(r.p[col] - toMin(eng));
  }));
}
// angle scans
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
const asr = {};
for (const [name, mad] of [['Shafee', adhan.Madhab.Shafi], ['Hanafee', adhan.Madhab.Hanafi]]) {
  const key = name === 'Shafee' ? 'asr_shafee' : 'asr_hanafee';
  asr[name] = stat(rows.map((r) => wrap(r.p[key] - toMin(P(r, params(18, 17, mad)).asr))));
}
const margin = (printedKey, engKey, mad) => stat(rows.map((r) =>
  wrap(r.p[printedKey] - toMin(P(r, params(18, 17, mad || adhan.Madhab.Shafi))[engKey]))));

const out = {
  engine: 'adhan 4.4.6', tz: 'Asia/Hong_Kong', rows: rows.length,
  point: { lon: 114.161, lat: 22.34 },
  solar_columns: solar,
  fajr_angle: scan('fajr', 15, 20), isha_angle: scan('isha', 18, 24),
  asr, zuhr_minus_noon: margin('zuhr', 'dhuhr'), maghrib_minus_sunset: margin('maghrib', 'sunset'),
  isha_minus_maghrib: stat(rows.map((r) => r.p.isha - r.p.maghrib)),
  fajr_minus_sunrise: stat(rows.map((r) => r.p.fajr - r.p.sunrise)),
};
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(__dirname, 'data', 'hk_trustees_fit.json'), JSON.stringify(out, null, 1));
