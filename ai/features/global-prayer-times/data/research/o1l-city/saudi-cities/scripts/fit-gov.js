// O1l-40 Saudi governorate fit: the held one recipe (18.5 floor+1, isha maghrib
// +90 / +120 on the API's own Ramadan days) tested city by city over Hijri 1448+1449.
const fs = require('fs');
const path = require('path');

const ADHAN = path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan');
const A = require(ADHAN);

const ROOT = path.join(__dirname, '..');
const CAP = path.join(ROOT, 'captures');
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const YEARS = [1448, 1449];
const ZONE = 3;
const CONF = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cities.json'), 'utf8'));

const floorMin = (x) => Math.floor(x + 1e-9);
const tmin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const wallMinutes = (d, off) => ((((d.getTime() + off * 3600000) % 86400000) + 86400000) % 86400000) / 60000;

function params(fajrAngle) {
  const p = new A.CalculationParameters('Other', fajrAngle, 18, 0);
  p.madhab = A.Madhab.Shafi;
  p.highLatitudeRule = A.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = A.Rounding.None;
  return p;
}

function predict(lat, lon, y, m, d, ramadan, fajrAngle) {
  const pt = new A.PrayerTimes(new A.Coordinates(lat, lon), new Date(y, m - 1, d), params(fajrAngle));
  const out = {};
  for (const c of ['fajr', 'dhuhr', 'asr', 'maghrib']) out[c] = floorMin(wallMinutes(pt[c], ZONE) + 1);
  out.sunrise = floorMin(wallMinutes(pt.sunrise, ZONE));
  out.isha = out.maghrib + (ramadan ? 120 : 90);
  return out;
}

function load(prefix, yh) {
  const f = path.join(CAP, `sa-${prefix}-${yh}.json`);
  const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
  return raw.filter((r) => r.hijriDate.year === yh).map((r) => ({
    date: r.date.slice(0, 10),
    hm: r.hijriDate.month, hd: r.hijriDate.day,
    tab: r.prayerTimes,
  }));
}

function scoreRows(rows, lat, lon, fajrAngle) {
  const per = {}; const tot = { n: 0, exact: 0, w1: 0, sum: 0, max: 0 };
  for (const c of COLS) per[c] = { n: 0, exact: 0, w1: 0, sum: 0, max: 0 };
  const outliers = [];
  for (const r of rows) {
    const [y, m, d] = r.date.split('-').map(Number);
    const p = predict(lat, lon, y, m, d, r.hm === 9, fajrAngle);
    for (const c of COLS) {
      const e = p[c] - tmin(r.tab[c]);
      const s = per[c];
      s.n++; if (e === 0) s.exact++; if (Math.abs(e) <= 1) s.w1++;
      s.sum += Math.abs(e); s.max = Math.max(s.max, Math.abs(e));
      tot.n++; if (e === 0) tot.exact++; if (Math.abs(e) <= 1) tot.w1++;
      tot.sum += Math.abs(e); tot.max = Math.max(tot.max, Math.abs(e));
      if (Math.abs(e) > 1) outliers.push({ date: r.date, hm: r.hm, col: c, err: e });
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
    outliers,
  };
}

function freeAngle(rows, lat, lon) {
  let best = null;
  for (let a = 16.0; a <= 21.001; a += 0.02) {
    let sum = 0;
    for (const r of rows) {
      const [y, m, d] = r.date.split('-').map(Number);
      sum += Math.abs(predict(lat, lon, y, m, d, false, a).fajr - tmin(r.tab.fajr));
    }
    const mae = sum / rows.length;
    if (!best || mae < best.mae) best = { angle: +a.toFixed(2), mae: +mae.toFixed(3) };
  }
  return best;
}

const result = { job: 'O1l-40 Saudi governorate sweep', recipe: CONF.recipe, cities: {}, span: {} };
const allOutliers = [];

for (const city of CONF.cities) {
  const cap = city.capture || city.name;
  const byYear = {};
  for (const yh of YEARS) byYear[yh] = load(cap, yh);
  const rows = YEARS.flatMap((yh) => byYear[yh]);
  const held = scoreRows(rows, city.lat, city.lon, 18.5);
  const free = freeAngle(rows, city.lat, city.lon);

  const years = {};
  for (const yh of YEARS) {
    const sub = byYear[yh];
    const s = scoreRows(sub, city.lat, city.lon, 18.5);
    years[yh] = { rows: sub.length, from: sub[0].date, to: sub[sub.length - 1].date, total: s.total };
  }

  const intervals = {};
  const monthIv = {};
  let ramadanDays = 0;
  for (const r of rows) {
    const iv = (tmin(r.tab.isha) - tmin(r.tab.maghrib) + 1440) % 1440;
    intervals[iv] = (intervals[iv] || 0) + 1;
    (monthIv[r.hm] = monthIv[r.hm] || new Set()).add(iv);
    if (r.hm === 9) ramadanDays++;
  }
  const monthSet = {};
  for (const [m, s] of Object.entries(monthIv)) monthSet[m] = [...s].sort((a, b) => a - b).join('/');
  const viol = Object.entries(monthSet)
    .filter(([m, s]) => (Number(m) === 9 ? s !== '120' : s !== '90'))
    .map(([m, s]) => ({ month: +m, iv: s }));
  const ramadanMonthDays = {};
  for (const r of rows) if (r.hm === 9) ramadanMonthDays[r.date.slice(0, 4)] = (ramadanMonthDays[r.date.slice(0, 4)] || 0) + 1;

  const nonRam = rows.filter((r) => r.hm !== 9);
  const amp = {};
  for (const c of COLS) {
    const src = c === 'isha' ? nonRam : rows;
    const v = src.map((r) => tmin(r.tab[c]));
    amp[c] = Math.max(...v) - Math.min(...v);
  }
  const janJul = {};
  for (const c of ['fajr', 'isha']) {
    const src = c === 'isha' ? nonRam : rows;
    const jan = src.filter((r) => r.date.slice(5, 7) === '01').map((r) => tmin(r.tab[c]));
    const jul = src.filter((r) => r.date.slice(5, 7) === '07').map((r) => tmin(r.tab[c]));
    janJul[c] = { janMin: Math.min(...jan), julMax: Math.max(...jul), span: Math.max(...jul) - Math.min(...jan) };
  }

  const entry = {
    gov: city.gov, lat: city.lat, lon: city.lon, anchor: city.anchor,
    rows: rows.length, years, held, freeFit: free,
    intervals, ramadanDays, ramadanMonthDays, monthInterval: monthSet, intervalViolations: viol,
    amplitude: amp, janJul, outliers: held.outliers,
  };

  if (city.alt) {
    const altRows = YEARS.flatMap((yh) => load(city.alt.capture, yh));
    const alt = scoreRows(altRows, city.alt.lat, city.alt.lon, 18.5);
    let maxDelta = 0; const deltas = {};
    for (const c of COLS) {
      const d = Math.max(...altRows.map((r) => Math.abs(tmin(r.tab[c]) - tmin(rows.find((x) => x.date === r.date).tab[c]))));
      deltas[c] = d; maxDelta = Math.max(maxDelta, d);
    }
    entry.coordinateSensitivity = { altLat: city.alt.lat, altLon: city.alt.lon, altTotal: alt.total, maxDeltaByColumn: deltas, maxDelta };
  }

  result.cities[city.name] = entry;
  allOutliers.push(...held.outliers.map((o) => ({ city: city.name, ...o })));
  console.log(`${city.name.padEnd(17)} rows=${rows.length} exact=${held.total.exactPct}% w1=${held.total.w1Pct}% mae=${held.total.mae} max=${held.total.max} free=${free.angle}(mae ${free.mae}) iv=${JSON.stringify(intervals)} viol=${viol.length} ampFajr=${amp.fajr} ampIsha=${amp.isha}`);
}

const C = Object.values(result.cities);
const exacts = C.map((c) => c.held.total.exactPct);
const w1s = C.map((c) => c.held.total.w1Pct);
const maes = C.map((c) => c.held.total.mae);
const angles = C.map((c) => c.freeFit.angle);
const amps = C.map((c) => c.amplitude.fajr);
result.span = {
  cities: C.length,
  cityDays: C.reduce((a, c) => a + c.rows, 0),
  prayerCells: C.reduce((a, c) => a + c.held.total.n, 0),
  exactMin: Math.min(...exacts), exactMax: Math.max(...exacts),
  w1Min: Math.min(...w1s), maeMin: Math.min(...maes), maeMax: Math.max(...maes),
  freeAngleMin: Math.min(...angles), freeAngleMax: Math.max(...angles),
  ampFajrMin: Math.min(...amps), ampFajrMax: Math.max(...amps),
  allWhollyWithin1: w1s.every((x) => x >= 99.9),
  everyCityUnder100: w1s.every((x) => x === 100),
  oneRecipeHolds: w1s.every((x) => x >= 99.8),
  outliers: allOutliers.length,
  citiesWithOutliers: [...new Set(allOutliers.map((o) => o.city))],
  ramadanViolations: C.reduce((a, c) => a + c.intervalViolations.length, 0),
  intervalValues: [...new Set(C.flatMap((c) => Object.keys(c.intervals)))].sort((a, b) => a - b),
};
result.outlierLedger = allOutliers;
fs.writeFileSync(path.join(ROOT, 'data', 'sa-gov-fit.json'), JSON.stringify(result, null, 1));
console.log('SPAN', JSON.stringify(result.span, null, 1));
