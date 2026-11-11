/* Fit every islamichina.com city-year and test each city for a Urumqi-class defect.
 *
 * Engine: adhan 4.4.6, Rounding.None, TZ pinned Asia/Shanghai, dates built from the
 * printed capture strings only (never the real clock).
 *
 * Method, in the order that keeps the two questions apart:
 *  1. Point. The printed sunrise and sunset carry no margin and no angle, so the
 *     coordinate that reproduces them is the coordinate the table was computed at.
 *     Coarse grid over China and its neighbours, then a fine pass.
 *  2. Recipe. At that point, scan fajr and isha angles at 0.1 deg and pick the asr
 *     school by MAE. A table computed 30 deg east is not a bad recipe, it is a
 *     different place; measuring the recipe at the wrong point hides that.
 *  3. Both point and recipe are then reported against the named city's own
 *     coordinate, so the defect magnitude reads in minutes on every column.
 */
const fs = require('fs');
const path = require('path');

if (process.env.TZ !== 'Asia/Shanghai') {
  throw new Error('TZ must be Asia/Shanghai; run with TZ=Asia/Shanghai node ' + __filename);
}

const adhan = require(process.env.HOME +
  '/athan-gitree/census/adhan-build/node_modules/adhan');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const COORDS = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'captures', 'wikipedia_coords_china.json'), 'utf8'));

const NAME = {
  beijing: 'Beijing', shanghai: 'Shanghai', tianjin: 'Tianjin', chongqing: 'Chongqing',
  guangzhou: 'Guangzhou', kunming: 'Kunming', urumqi: 'Ürümqi', yinchuan: 'Yinchuan',
  lanzhou: 'Lanzhou', xining: 'Xining', xian: "Xi'an", zhengzhou: 'Zhengzhou',
  jinan: 'Jinan', shenyang: 'Shenyang', changchun: 'Changchun', harbin: 'Harbin',
  hohhot: 'Hohhot', chengdu: 'Chengdu', wuhan: 'Wuhan', changsha: 'Changsha',
  nanjing: 'Nanjing', hangzhou: 'Hangzhou', fuzhou: 'Fuzhou', nanning: 'Nanning',
  guiyang: 'Guiyang', hefei: 'Hefei', shijiazhuang: 'Shijiazhuang', taiyuan: 'Taiyuan',
  lhasa: 'Lhasa', dalian: 'Dalian', dunhuang: 'Dunhuang', guilin: 'Guilin',
  haikou: 'Haikou', kashgar: 'Kashgar', luoyang: 'Luoyang', nanchang: 'Nanchang',
  ningbo: 'Ningbo', qingdao: 'Qingdao', quanzhou: 'Quanzhou', sanya: 'Sanya',
  shenzhen: 'Shenzhen', suzhou: 'Suzhou', turpan: 'Turpan', xiamen: 'Xiamen',
};

const toMinutes = (d) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

function printed(hhmm) {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!m) return NaN;
  let h = Number(m[1]) % 12;
  if (m[3] === 'PM') h += 12;
  return h * 60 + Number(m[2]);
}

function params(fajrAngle, ishaAngle, madhab) {
  const p = new adhan.CalculationParameters();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = madhab;
  p.rounding = adhan.Rounding.None;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  return p;
}

function times(coords, year, month, day, p) {
  const pt = new adhan.PrayerTimes(coords, new Date(year, month - 1, day, 12, 0, 0), p);
  return { fajr: toMinutes(pt.fajr), sunrise: toMinutes(pt.sunrise), dhuhr: toMinutes(pt.dhuhr),
           asr: toMinutes(pt.asr), sunset: toMinutes(pt.sunset), isha: toMinutes(pt.isha) };
}

// The printed table names its solar columns maghrib and dhuhr; the engine returns
// sunset and dhuhr. One map keeps every comparison honest.
function printedValue(r, c) {
  if (c === 'sunset') return r.p.maghrib;
  if (c === 'noon') return r.p.dhuhr;
  return r.p[c];
}

function computedValue(t, c) {
  if (c === 'maghrib' || c === 'sunset') return t.sunset;
  if (c === 'noon') return t.dhuhr;
  return t[c];
}

function mae(rows, coords, year, p, cols) {
  let sum = 0;
  for (const r of rows) {
    const t = times(coords, year, r.month, r.day, p);
    for (const c of cols) sum += Math.abs(printedValue(r, c) - computedValue(t, c));
  }
  return sum / (rows.length * cols.length);
}

const ROUNDERS = { ceil: Math.ceil, floor: Math.floor, nearest: Math.round };
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const KEYS = COLS;

// A column printed after midnight reads as 00:xx, so the raw difference can be a
// whole day out. Unwrap into [-720, 720) before judging.
function wrap(v) {
  let x = v;
  while (x < -720) x += 1440;
  while (x >= 720) x -= 1440;
  return x;
}

function columnScore(rows, coords, year, p, c) {
  const res = []; const comp = []; const pr = [];
  for (const r of rows) {
    const t = times(coords, year, r.month, r.day, p);
    const pv = printedValue(r, c); const cv = computedValue(t, c);
    res.push(wrap(pv - cv)); comp.push(cv); pr.push(pv);
  }
  const n = res.length; const abs = res.map(Math.abs);
  const matches = {};
  for (const [name, fn] of Object.entries(ROUNDERS)) {
    matches[name] = res.filter((v, i) => fn(comp[i]) === pr[i]).length;
  }
  const sorted = [...res].sort((a, b) => a - b);
  return {
    mean: Number((res.reduce((a, b) => a + b, 0) / n).toFixed(3)),
    mae: Number((abs.reduce((a, b) => a + b, 0) / n).toFixed(3)),
    rms: Number(Math.sqrt(res.reduce((a, b) => a + b * b, 0) / n).toFixed(3)),
    p05: Number(sorted[Math.floor(n * 0.05)].toFixed(2)),
    p95: Number(sorted[Math.floor(n * 0.95)].toFixed(2)),
    within_one: Number((abs.filter((v) => v <= 1).length / n).toFixed(3)),
    rounding: matches,
    rounding_verdict: Object.keys(matches).sort((a, b) => matches[b] - matches[a])[0],
  };
}

function scanAngle(rows, coords, year, col) {
  let best = { angle: null, mae: Infinity };
  for (let a10 = 120; a10 <= 200; a10 += 1) {
    const angle = a10 / 10;
    const p = params(col === 'fajr' ? angle : 17, col === 'isha' ? angle : 18,
                    adhan.Madhab.Shafi);
    const m = mae(rows, coords, year, p, [col]);
    if (m < best.mae) best = { angle, mae: Number(m.toFixed(2)) };
  }
  return best;
}

const results = { engine: 'adhan 4.4.6', tz: 'Asia/Shanghai', rounding: 'none',
                  residual: 'printed minus computed, minutes', cities: {} };

const files = fs.readdirSync(DATA)
  .filter((f) => /^islamichina_[a-z]+_\d{4}\.json$/.test(f)).sort();

for (const file of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
  const slug = d.city_slug; const year = d.year;
  const name = NAME[slug]; const real = COORDS[name];
  if (!real) { console.log('NO COORDS', slug); continue; }
  // A row printed entirely as 12:00 AM is a publisher gap, not a time.
  const usable = d.rows.filter((r) => KEYS.some((k) => r[k].trim() !== '12:00 AM'));
  const nulls = d.rows.length - usable.length;
  const rows = usable.map((r) => ({
    month: r.month, day: r.day,
    p: { fajr: printed(r.fajr), sunrise: printed(r.sunrise), dhuhr: printed(r.dhuhr),
         asr: printed(r.asr), maghrib: printed(r.maghrib), isha: printed(r.isha) },
  }));
  const sample = rows.filter((_, i) => i % 5 === 0);

  const solarMae = (lo, la, p) => mae(sample, new adhan.Coordinates(la, lo), year, p,
                                      ['sunrise', 'sunset']);
  const coarse = params(18, 17, adhan.Madhab.Shafi);
  let best = { lon: real.lon, lat: real.lat, mae: solarMae(real.lon, real.lat, coarse) };
  for (let dlo = -40; dlo <= 40; dlo += 1) {
    for (let dla = -20; dla <= 20; dla += 1) {
      const m = solarMae(real.lon + dlo, real.lat + dla, coarse);
      if (m < best.mae) best = { lon: real.lon + dlo, lat: real.lat + dla, mae: m };
    }
  }
  for (let dlo = -1; dlo <= 1.0001; dlo += 0.05) {
    for (let dla = -1; dla <= 1.0001; dla += 0.05) {
      const m = solarMae(best.lon + dlo, best.lat + dla, coarse);
      if (m < best.mae) best = { lon: best.lon + dlo, lat: best.lat + dla, mae: m };
    }
  }
  const lon = Number(best.lon.toFixed(2)); const lat = Number(best.lat.toFixed(2));
  const fitC = new adhan.Coordinates(lat, lon);
  const realC = new adhan.Coordinates(real.lat, real.lon);

  const fajr = scanAngle(sample, fitC, year, 'fajr');
  const isha = scanAngle(sample, fitC, year, 'isha');
  const asrS = mae(sample, fitC, year, params(fajr.angle, isha.angle, adhan.Madhab.Shafi), ['asr']);
  const asrH = mae(sample, fitC, year, params(fajr.angle, isha.angle, adhan.Madhab.Hanafi), ['asr']);
  const madhab = asrS <= asrH ? adhan.Madhab.Shafi : adhan.Madhab.Hanafi;
  const pFit = params(fajr.angle, isha.angle, madhab);

  const atFit = {}; const atReal = {};
  for (const c of COLS) {
    atFit[c] = columnScore(rows, fitC, year, pFit, c);
    atReal[c] = columnScore(rows, realC, year, pFit, c);
  }

  const rec = {
    city: name, lon_real: real.lon, lat_real: real.lat,
    fit_point: { lon, lat, dlon_deg: Number((lon - real.lon).toFixed(2)),
                 dlat_deg: Number((lat - real.lat).toFixed(2)),
                 solar_minutes_shift: Number(((lon - real.lon) * 4).toFixed(1)) },
    angles: { fajr: fajr.angle, fajr_mae: fajr.mae, isha: isha.angle, isha_mae: isha.mae },
    asr: { madhab: madhab === adhan.Madhab.Shafi ? 'Shafi' : 'Hanafi',
           mae_shafi: Number(asrS.toFixed(2)), mae_hanafi: Number(asrH.toFixed(2)) },
    rows_printed: d.rows.length, rows_null: nulls,
    at_fit_point: Object.fromEntries(COLS.map((c) => [c, atFit[c]])),
    at_real_point: Object.fromEntries(COLS.map((c) => [c, atReal[c]])),
  };
  (results.cities[slug] = results.cities[slug] || {})[year] = rec;
  console.log(`${slug.padEnd(13)} ${year} fajr=${fajr.angle} isha=${isha.angle} ` +
    `${rec.asr.madhab.padEnd(6)} point=${lon}/${lat} (d ${rec.fit_point.dlon_deg}/` +
    `${rec.fit_point.dlat_deg} = ${rec.fit_point.solar_minutes_shift} min) ` +
    `mae@fit=${atFit.fajr.mae}/${atFit.sunrise.mae}/${atFit.dhuhr.mae}/${atFit.asr.mae}/` +
    `${atFit.maghrib.mae}/${atFit.isha.mae} ` +
    `mae@real=${atReal.fajr.mae}/${atReal.sunrise.mae}/${atReal.dhuhr.mae}/${atReal.asr.mae}/` +
    `${atReal.maghrib.mae}/${atReal.isha.mae}`);
}

fs.writeFileSync(path.join(DATA, 'islamichina-fit.json'), JSON.stringify(results, null, 1));
