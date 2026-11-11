/* Hong Kong: fit the Masjidal Kowloon feed across every year held (2024-2027) on one
 * method, so a regime change between years is a measurement and not a comparison of
 * two reports written by different agents.
 * Engine adhan 4.4.6, TZ Asia/Hong_Kong, dates from the captures only. */
const fs = require('fs');
const path = require('path');
if (process.env.TZ !== 'Asia/Hong_Kong') throw new Error('TZ must be Asia/Hong_Kong');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

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
function p12(s) {
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  let h = Number(m[1]) % 12; if (m[3] === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}
function p24(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }

const out = { engine: 'adhan 4.4.6', tz: 'Asia/Hong_Kong', years: {} };
for (const year of [2024, 2025, 2026, 2027]) {
  const f = path.join(__dirname, 'data', `masjidal_kowloon_${year}.json`);
  const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
  const rows = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v.fajr === 'number') { rows[k] = v; continue; }
    const sep = v.fajr.includes(' ') ? p12 : p24;
    rows[k] = { fajr: sep(v.fajr), sunrise: sep(v.sunrise), dhuhr: sep(v.dhuhr),
                asr: sep(v.asr), maghrib: sep(v.maghrib), isha: sep(v.isha) };
  }
  const keys = Object.keys(rows);
  const day = (k) => { const [, mm, dd] = k.split('-').map(Number); return [mm, dd]; };
  const P = (mm, dd, p) => new adhan.PrayerTimes(c, new Date(year, mm - 1, dd, 12), p);
  const scan = (col, lo, hi, mad) => {
    let best = { angle: null, mae: 1e9 };
    for (let a = lo; a <= hi + 1e-9; a += 0.1) {
      const r = [];
      for (const k of keys) {
        const [mm, dd] = day(k);
        const p = params(col === 'fajr' ? a : 18, col === 'isha' ? a : 17, mad);
        r.push(wrap(rows[k][col] - toMin(P(mm, dd, p)[col])));
      }
      const m = stat(r).mae;
      if (m < best.mae) best = { angle: +a.toFixed(1), mae: m };
    }
    return best;
  };
  const asr = {};
  for (const [name, mad] of [['Shafi', adhan.Madhab.Shafi], ['Hanafi', adhan.Madhab.Hanafi]]) {
    const r = [];
    for (const k of keys) {
      const [mm, dd] = day(k);
      r.push(wrap(rows[k].asr - toMin(P(mm, dd, params(18, 18, mad)).asr)));
    }
    asr[name] = stat(r);
  }
  const margin = (col, key, mad) => {
    const r = [];
    for (const k of keys) {
      const [mm, dd] = day(k);
      r.push(wrap(rows[k][key] - toMin(P(mm, dd, params(18, 18, mad))[col])));
    }
    return stat(r);
  };
  out.years[year] = {
    rows: keys.length,
    fajr_angle: scan('fajr', 16, 20, adhan.Madhab.Hanafi),
    isha_angle: scan('isha', 16, 20, adhan.Madhab.Hanafi),
    asr,
    dhuhr_margin: margin('dhuhr', 'dhuhr', adhan.Madhab.Hanafi),
    maghrib_margin: margin('sunset', 'maghrib', adhan.Madhab.Hanafi),
  };
  console.log(year, JSON.stringify(out.years[year]));
}
fs.writeFileSync(path.join(__dirname, 'data', 'hk_kowloon_years_fit.json'), JSON.stringify(out, null, 1));
