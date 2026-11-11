/* Diagnose the islamichina.com outliers: the 120-minute western clock, the Harbin
 * 2025 table, the Kashgar isha column, and the between-year relation of every city.
 *
 * Engine: adhan 4.4.6, TZ pinned Asia/Shanghai, no clock read.
 */
const fs = require('fs');
const path = require('path');

if (process.env.TZ !== 'Asia/Shanghai') {
  throw new Error('TZ must be Asia/Shanghai');
}
const adhan = require(process.env.HOME +
  '/athan-gitree/census/adhan-build/node_modules/adhan');
const DATA = path.join(__dirname, 'data');
const COORDS = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'captures', 'wikipedia_coords_china.json'), 'utf8'));
const NAME = JSON.parse(fs.readFileSync(path.join(DATA, 'city-names.json'), 'utf8'));

const toMinutes = (d) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
function printed(s) {
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  let h = Number(m[1]) % 12; if (m[3] === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}
function params(f, i, madhab) {
  const p = new adhan.CalculationParameters();
  p.fajrAngle = f; p.ishaAngle = i; p.madhab = madhab;
  p.rounding = adhan.Rounding.None;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  return p;
}
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ENGINE_KEY = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr',
                     maghrib: 'sunset', isha: 'isha' };

function load(slug, year) {
  const f = path.join(DATA, `islamichina_${slug}_${year}.json`);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8')).rows.map((r) => ({
    month: r.month, day: r.day,
    p: { fajr: printed(r.fajr), sunrise: printed(r.sunrise), dhuhr: printed(r.dhuhr),
         asr: printed(r.asr), maghrib: printed(r.maghrib), isha: printed(r.isha) },
    raw: r,
  }));
}

// A column printed after midnight (isha in the west) reads as 00:xx, so the raw
// difference can be a whole day out. Unwrap into [-720, 720) before judging.
function wrap(v) {
  let x = v;
  while (x < -720) x += 1440;
  while (x >= 720) x -= 1440;
  return x;
}

function residual(rows, coords, year, p, c, shiftMin) {
  const out = [];
  for (const r of rows) {
    const pt = new adhan.PrayerTimes(coords, new Date(year, r.month - 1, r.day, 12), p);
    out.push(wrap(r.p[c] - (toMinutes(pt[ENGINE_KEY[c]]) + (shiftMin || 0))));
  }
  return out;
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const mae = (a) => mean(a.map(Math.abs));

const out = {};

// 1. The western clock: does a pure +120 min shift reproduce all four cities?
const west = ['urumqi', 'turpan', 'dunhuang', 'lhasa'];
out.western_clock = {};
for (const slug of west) {
  const real = COORDS[NAME[slug]];
  const c = new adhan.Coordinates(real.lat, real.lon);
  for (const year of [2025, 2026]) {
    const rows = load(slug, year);
    if (!rows) continue;
    const p = params(17.9, 17.0, adhan.Madhab.Shafi);
    const perCol = {};
    for (const col of COLS) {
      const r0 = residual(rows, c, year, p, col, 0);
      const r120 = residual(rows, c, year, p, col, -120);
      perCol[col] = { raw_mean: Number(mean(r0).toFixed(2)),
                      raw_mae: Number(mae(r0).toFixed(2)),
                      minus120_mean: Number(mean(r120).toFixed(2)),
                      minus120_mae: Number(mae(r120).toFixed(2)) };
    }
    (out.western_clock[slug] = out.western_clock[slug] || {})[year] = perCol;
  }
}

// 2. Between-year relation: is 2026 a reprint of 2025, and is 2027 a reprint of 2026?
out.between_year = {};
function compare(x, y) {
  if (!x || !y) return null;
  const idx = new Map(y.map((r) => [`${r.month}-${r.day}`, r]));
  let same = 0; let n = 0;
  for (const r of x) {
    const o = idx.get(`${r.month}-${r.day}`);
    if (!o) continue;
    for (const c of COLS) { n += 1; if (r.raw[c] === o.raw[c]) same += 1; }
  }
  return { cells: n, identical: Number((same / n).toFixed(3)) };
}
for (const slug of Object.keys(NAME)) {
  const y = {};
  for (const year of [2025, 2026, 2027, 2028, 2029]) y[year] = load(slug, year);
  out.between_year[slug] = {
    '2025_vs_2026': compare(y[2025], y[2026]),
    '2026_vs_2027': compare(y[2026], y[2027]),
    '2027_vs_2028': compare(y[2027], y[2028]),
    '2028_vs_2029': compare(y[2028], y[2029]),
  };
}

// 3. Harbin 2025: where is that table computed, and with what angles?
out.harbin = {};
for (const year of [2025, 2026]) {
  const rows = load('harbin', year);
  const sample = rows.filter((_, i) => i % 5 === 0);
  const real = COORDS.Harbin;
  const p = params(17.9, 17.0, adhan.Madhab.Shafi);
  let best = { lon: real.lon, lat: real.lat, mae: 1e9 };
  for (let dlo = -3; dlo <= 3; dlo += 0.1) {
    for (let dla = -3; dla <= 3; dla += 0.1) {
      const c = new adhan.Coordinates(real.lat + dla, real.lon + dlo);
      const m = (mae(residual(sample, c, year, p, 'sunrise', 0)) +
                 mae(residual(sample, c, year, p, 'maghrib', 0))) / 2;
      if (m < best.mae) best = { lon: Number((real.lon + dlo).toFixed(2)),
                                 lat: Number((real.lat + dla).toFixed(2)), mae: Number(m.toFixed(2)) };
    }
  }
  out.harbin[year] = best;
}

// 4. Kashgar isha: what rule does that column follow?
out.kashgar_isha = {};
for (const year of [2025, 2026]) {
  const rows = load('kashgar', year);
  const real = COORDS.Kashgar;
  const c = new adhan.Coordinates(real.lat, real.lon);
  const p = params(17.9, 17.0, adhan.Madhab.Shafi);
  const res = residual(rows, c, year, p, 'isha', 0);
  const maghrib = rows.map((r) => r.p.maghrib);
  const gap = rows.map((r, i) => r.p.isha - maghrib[i]);
  out.kashgar_isha[year] = {
    isha_residual_p05: Number([...res].sort((a, b) => a - b)[Math.floor(res.length * 0.05)].toFixed(1)),
    isha_residual_p95: Number([...res].sort((a, b) => a - b)[Math.floor(res.length * 0.95)].toFixed(1)),
    isha_minus_maghrib_min: Math.min(...gap), isha_minus_maghrib_max: Math.max(...gap),
    isha_minus_maghrib_mean: Number(mean(gap).toFixed(1)),
    first_days: rows.slice(0, 3).map((r) => r.raw),
    june_days: rows.filter((r) => r.month === 6).slice(0, 3).map((r) => r.raw),
    december_days: rows.filter((r) => r.month === 12).slice(0, 3).map((r) => r.raw),
  };
}

fs.writeFileSync(path.join(DATA, 'islamichina-diagnose.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.western_clock, null, 1));
console.log(JSON.stringify(out.harbin, null, 1));
console.log(JSON.stringify(out.kashgar_isha, null, 1));
