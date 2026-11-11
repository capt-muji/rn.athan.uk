/* Hong Kong: fit the Masjidal Kowloon feed's 2027 year column by column.
 * Engine adhan 4.4.6, TZ Asia/Hong_Kong, dates from the capture only.
 * Each column is measured against its own basis: fajr as a depression angle, asr by
 * school and margin, maghrib and dhuhr as margins on sunset and noon, isha both as an
 * angle and as an interval on the printed maghrib. */
const fs = require('fs');
const path = require('path');
if (process.env.TZ !== 'Asia/Hong_Kong') throw new Error('TZ must be Asia/Hong_Kong');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

const rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'data',
  'masjidal_kowloon_2027_normalized.json'), 'utf8'));
const c = new adhan.Coordinates(22.34, 114.161);
const toMin = (d) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
const wrap = (v) => { let x = v; while (x < -720) x += 1440; while (x >= 720) x -= 1440; return x; };

function params(fajr, isha, madhab) {
  const x = new adhan.CalculationParameters();
  x.fajrAngle = fajr; x.ishaAngle = isha; x.madhab = madhab;
  x.rounding = adhan.Rounding.None;
  x.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  return x;
}
const stat = (a) => {
  const abs = a.map(Math.abs);
  return { mean: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2),
           mae: +(abs.reduce((x, y) => x + y, 0) / a.length).toFixed(2),
           within1: +(abs.filter((v) => v <= 1).length / a.length).toFixed(3) };
};

const P = (mm, dd, p) => new adhan.PrayerTimes(c, new Date(2027, mm - 1, dd, 12), p);
const day = (k) => { const [, mm, dd] = k.split('-').map(Number); return [mm, dd]; };

// fajr angle scan
let fajrBest = { angle: null, mae: 1e9 };
for (let a = 16; a <= 20.001; a += 0.1) {
  const r = [];
  for (const [k, v] of Object.entries(rows)) {
    const [mm, dd] = day(k);
    r.push(wrap(v.fajr - toMin(P(mm, dd, params(a, 17, adhan.Madhab.Hanafi)).fajr)));
  }
  const m = stat(r).mae;
  if (m < fajrBest.mae) fajrBest = { angle: +a.toFixed(1), mae: m };
}

// asr: school and margin
const asrTry = {};
for (const [name, mad] of [['Shafi', adhan.Madhab.Shafi], ['Hanafi', adhan.Madhab.Hanafi]]) {
  const base = [];
  for (const [k, v] of Object.entries(rows)) {
    const [mm, dd] = day(k);
    base.push(wrap(v.asr - toMin(P(mm, dd, params(18, 17, mad)).asr)));
  }
  asrTry[name] = { base_mean: stat(base).mean, base_mae: stat(base).mae };
}

// margins: dhuhr on noon, maghrib on sunset
const marg = (col, key) => {
  const r = [];
  for (const [k, v] of Object.entries(rows)) {
    const [mm, dd] = day(k);
    r.push(wrap(v[key] - toMin(P(mm, dd, params(18, 17, adhan.Madhab.Hanafi))[col])));
  }
  return stat(r);
};

// isha: interval on the printed maghrib, and angle
const ishaGap = [];
for (const v of Object.values(rows)) ishaGap.push(v.isha - v.maghrib);
const ishaAngle = {};
for (let a = 15; a <= 19.001; a += 0.1) {
  const r = [];
  for (const [k, v] of Object.entries(rows)) {
    const [mm, dd] = day(k);
    r.push(wrap(v.isha - toMin(P(mm, dd, params(18, a, adhan.Madhab.Hanafi)).isha)));
  }
  const m = stat(r).mae;
  if (!ishaAngle.best || m < ishaAngle.best.mae) ishaAngle.best = { angle: +a.toFixed(1), mae: m };
}

const out = {
  engine: 'adhan 4.4.6', tz: 'Asia/Hong_Kong', year: 2027, rows: Object.keys(rows).length,
  fajr: { best_angle: fajrBest, at_18_4: stat(Object.entries(rows).map(([k, v]) => {
    const [mm, dd] = day(k);
    return wrap(v.fajr - toMin(P(mm, dd, params(18.4, 17, adhan.Madhab.Hanafi)).fajr));
  })) },
  asr: asrTry,
  dhuhr_margin_on_noon: marg('dhuhr', 'dhuhr'),
  maghrib_margin_on_sunset: marg('sunset', 'maghrib'),
  sunrise: marg('sunrise', 'sunrise'),
  isha: { interval_on_printed_maghrib: stat(ishaGap), best_angle: ishaAngle.best },
};
console.log(JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(__dirname, 'data', 'hk_kowloon_2027_fit.json'), JSON.stringify(out, null, 1));
