// SA ten-city fit: one recipe across both held Hijri years, per-city scores +
// per-city free fajr-angle fit, so "one recipe" is tested at every city, not assumed.
const fs = require('fs');
const path = require('path');

const ADHAN = path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan');
const A = require(ADHAN);

const ROOT = path.join(__dirname, '..');
const CAP = path.join(ROOT, 'captures');
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const YEARS = [1448, 1449];
const ZONE = 3;

const CITIES = [
  ['makkah', 21.4225, 39.8262],
  ['riyadh', 24.7136, 46.6753],
  ['medina', 24.4672, 39.6111],
  ['jeddah', 21.4858, 39.1925],
  ['abha', 18.2164, 42.5053],
  ['tabuk', 28.3835, 36.5662],
  ['dammam', 26.4207, 50.0888],
  ['taif', 21.2703, 40.4158],
  ['buraidah', 26.3260, 43.9750],
  ['hail', 27.5114, 41.7208],
];

const floorMin = (x) => Math.floor(x + 1e-9);
const tmin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const wallMinutes = (d, off) => (((d.getTime() + off * 3600000) % 86400000) + 86400000) % 86400000 / 60000;

function params(fajrAngle) {
  const p = new A.CalculationParameters('Other', fajrAngle, 18, 0);
  p.madhab = A.Madhab.Shafi;
  p.highLatitudeRule = A.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = A.Rounding.None;
  return p;
}

function predict(lat, lon, y, m, d, ramadan, fajrAngle) {
  const pt = new A.PrayerTimes(new A.Coordinates(lat, lon), new Date(Date.UTC(y, m - 1, d)), params(fajrAngle));
  const out = {};
  for (const c of ['fajr', 'dhuhr', 'asr', 'maghrib']) out[c] = floorMin(wallMinutes(pt[c], ZONE) + 1);
  out.sunrise = floorMin(wallMinutes(pt.sunrise, ZONE));
  out.isha = out.maghrib + (ramadan ? 120 : 90);
  return out;
}

function load(name, lat, lon, yh) {
  const raw = JSON.parse(fs.readFileSync(path.join(CAP, `sa-${name}-${yh}.json`), 'utf8'));
  return raw.filter((r) => r.hijriDate.year === yh).map((r) => ({
    date: r.date.slice(0, 10),
    hm: r.hijriDate.month, hd: r.hijriDate.day,
    lat, lon,
    tab: r.prayerTimes,
  }));
}

function scoreRows(rows, fajrAngle) {
  const per = {}; let tot = { n: 0, exact: 0, w1: 0, sum: 0, max: 0 };
  for (const c of COLS) per[c] = { n: 0, exact: 0, w1: 0, sum: 0, max: 0 };
  for (const r of rows) {
    const [y, m, d] = r.date.split('-').map(Number);
    const p = predict(r.lat, r.lon, y, m, d, r.hm === 9, fajrAngle);
    for (const c of COLS) {
      const e = p[c] - tmin(r.tab[c]);
      const s = per[c];
      s.n++; if (e === 0) s.exact++; if (Math.abs(e) <= 1) s.w1++;
      s.sum += Math.abs(e); s.max = Math.max(s.max, Math.abs(e));
      tot.n++; if (e === 0) tot.exact++; if (Math.abs(e) <= 1) tot.w1++;
      tot.sum += Math.abs(e); tot.max = Math.max(tot.max, Math.abs(e));
    }
  }
  const fin = {};
  for (const c of COLS) {
    const s = per[c];
    fin[c] = { exactPct: +(100 * s.exact / s.n).toFixed(1), w1Pct: +(100 * s.w1 / s.n).toFixed(1), mae: +(s.sum / s.n).toFixed(3), max: s.max, n: s.n };
  }
  return {
    perColumn: fin,
    total: { n: tot.n, exactPct: +(100 * tot.exact / tot.n).toFixed(1), w1Pct: +(100 * tot.w1 / tot.n).toFixed(1), mae: +(tot.sum / tot.n).toFixed(3), max: tot.max },
  };
}

const result = { job: 'O1l-8 SA second cities', recipe: {
  fajr: '18.5 deg', isha: 'maghrib + 90 (1448/1449 non-Ramadan), + 120 on the API Ramadan days',
  offsets: { fajr: 1, sunrise: 0, dhuhr: 1, asr: 1, maghrib: 1, isha: 'inherits maghrib' },
  rounding: 'floor(raw + 1) single formulation; sunrise floor(raw)',
  madhab: 'Shafi', highLat: 'MiddleOfTheNight', clock: 'UTC+3',
  engine: 'adhan-js 4.4.6 CalculationParameters Other(18.5,18) Rounding.None',
}, cities: {} };

for (const [name, lat, lon] of CITIES) {
  const byYear = {};
  for (const yh of YEARS) byYear[yh] = load(name, lat, lon, yh);
  const rows = YEARS.flatMap((yh) => byYear[yh]);
  const held = scoreRows(rows, 18.5);

  // free fajr angle: minimise total fajr MAE over 17.0-20.0 in 0.02 steps
  let best = null;
  for (let a = 17.0; a <= 20.001; a += 0.02) {
    let sum = 0;
    for (const r of rows) {
      const [y, m, d] = r.date.split('-').map(Number);
      const p = predict(lat, lon, y, m, d, r.hm === 9, a);
      sum += Math.abs(p.fajr - tmin(r.tab.fajr));
    }
    const mae = sum / rows.length;
    if (!best || mae < best.mae) best = { angle: +a.toFixed(2), mae: +mae.toFixed(3) };
  }

  const years = {};
  for (const yh of YEARS) {
    const sub = byYear[yh];
    const s = scoreRows(sub, 18.5);
    years[yh] = { rows: sub.length, from: sub[0].date, to: sub[sub.length - 1].date, score: s };
  }

  const intervals = {};
  let ramadanDays = 0;
  const monthIv = {};
  for (const r of rows) {
    const iv = (tmin(r.tab.isha) - tmin(r.tab.maghrib) + 1440) % 1440;
    intervals[iv] = (intervals[iv] || 0) + 1;
    (monthIv[r.hm] = monthIv[r.hm] || new Set()).add(iv);
    if (r.hm === 9) ramadanDays++;
  }
  const monthSet = {};
  for (const [m, s] of Object.entries(monthIv)) monthSet[m] = [...s].sort((a, b) => a - b).join('/');
  const viol = Object.entries(monthSet).filter(([m, s]) => (Number(m) === 9 ? s !== '120' : s !== '90')).map(([m, s]) => ({ month: +m, iv: s }));

  const amp = {};
  for (const c of COLS) {
    const v = rows.map((r) => tmin(r.tab[c]));
    amp[c] = Math.max(...v) - Math.min(...v);
  }
  const janRows = rows.filter((r) => r.date.slice(5, 7) === '12' || r.date.slice(5, 7) === '01');
  const julRows = rows.filter((r) => ['05', '06', '07'].includes(r.date.slice(5, 7)));

  result.cities[name] = { lat, lon, rows: rows.length, years, held, freeFit: best,
    intervals, ramadanDays, monthInterval: monthSet, intervalViolations: viol,
    amplitude: amp, spanDays: rows.length };
  console.log(`${name} rows=${rows.length} exact=${held.total.exactPct}% w1=${held.total.w1Pct}% mae=${held.total.mae} max=${held.total.max} freeAngle=${best.angle} (mae ${best.mae}) iv=${JSON.stringify(intervals)} viol=${viol.length} ampFajr=${amp.fajr}`);
  console.log('   ', JSON.stringify(held.perColumn));
}

const exacts = Object.values(result.cities).map((c) => c.held.total.exactPct);
const w1s = Object.values(result.cities).map((c) => c.held.total.w1Pct);
const maes = Object.values(result.cities).map((c) => c.held.total.mae);
const angles = Object.values(result.cities).map((c) => c.freeFit.angle);
result.span = {
  cities: CITIES.length, days: Object.values(result.cities).reduce((a, c) => a + c.spanDays, 0),
  cityDays: Object.values(result.cities).reduce((a, c) => a + c.spanDays, 0),
  exactMin: Math.min(...exacts), exactMax: Math.max(...exacts),
  w1Min: Math.min(...w1s), maeMin: Math.min(...maes), maeMax: Math.max(...maes),
  freeAngleMin: Math.min(...angles), freeAngleMax: Math.max(...angles),
  allWhollyWithin1: w1s.every((x) => x >= 99.9),
  oneRecipeHolds: w1s.every((x) => x >= 99.9) && Math.max(...maes) - Math.min(...maes) <= 0.15,
};
fs.writeFileSync(path.join(ROOT, 'data', 'sa-ten-cities-fit.json'), JSON.stringify(result, null, 1));
console.log('SPAN', JSON.stringify(result.span));
