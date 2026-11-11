// Job 1 fit: one recipe (ISNA 15/15, Hanafi, TwilightAngle clamp, two margin sets split
// at 48 N) against the publisher's own tables for the whole 2026-2100 span.
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const ROOT = path.join(__dirname, '..');
const YEARS = [2026, 2030, 2035, 2040, 2050, 2060, 2075, 2090, 2100];
const CITIES = [
  { key: 'astana', name: 'Астана (Astana)', lat: 51.133333, lng: 71.433333, tz: 5, set: 'B (>=48N)' },
  { key: 'petropavl', name: 'Петропавл (Petropavl)', lat: 54.862222, lng: 69.140833, tz: 5, set: 'B (>=48N)' },
];

function margin(lat, col) {
  const m = lat < 48 ? 3 : 5;
  if (col === 'sunrise') return -m;
  if (col === 'dhuhr' || col === 'asr' || col === 'maghrib') return m;
  return 0;
}

function predict(city, y, m, d) {
  const raw = L.rawTimes('kz', city.lat, city.lng, city.tz, y, m, d);
  const out = {};
  for (const c of L.COLS) out[c] = L.roundHalfUp(raw[c] + margin(city.lat, c));
  return { pred: out, raw };
}

const result = { job: 'KZ deep span', recipe: {}, cities: [], leap: {} };

result.recipe = {
  method: 'ISNA (NorthAmerica params) 15/15',
  asr: 'Hanafi (shadow factor 2)',
  highLat: 'TwilightAngle (fajr angle / 60 of the night, isha likewise)',
  margins: { below48: { sunrise: -3, dhuhr: 3, asr: 3, maghrib: 3 }, atOrAbove48: { sunrise: -5, dhuhr: 5, asr: 5, maghrib: 5 }, fajr: 0, isha: 0 },
  rounding: 'nearest minute, halves up, applied after the margin at second resolution',
  engine: 'adhan-js 4.4.6',
  surface: 'muftyat.kz client engine (getTimes dst forced 0)',
};

for (const city of CITIES) {
  const entry = { key: city.key, name: city.name, lat: city.lat, lng: city.lng, marginSet: city.set, years: {} };
  for (const year of YEARS) {
    const table = L.readTable(path.join(ROOT, 'data', `kz-${city.key}-${year}.json`));
    const pairs = [];
    const resid = {};
    for (const c of L.COLS) resid[c] = [];
    const perDay = {};
    for (const day of Object.keys(table).sort()) {
      const [y, m, d] = day.split('-').map(Number);
      const { pred } = predict(city, y, m, d);
      perDay[day] = {};
      for (const c of L.COLS) {
        const err = pred[c] - L.tmin(table[day][c]);
        pairs.push({ col: c, err });
        resid[c].push(err);
        perDay[day][c] = err;
      }
    }
    const sc = L.score(pairs);
    // residual summary per column
    const sum = {};
    for (const c of L.COLS) {
      const v = resid[c];
      const mean = v.reduce((a, b) => a + b, 0) / v.length;
      const sorted = [...v].sort((a, b) => a - b);
      sum[c] = { mean: +mean.toFixed(3), min: sorted[0], p50: sorted[Math.floor(sorted.length / 2)], max: sorted[sorted.length - 1] };
    }
    // amplitude of the published column (peak to trough across the year)
    const amp = {};
    for (const c of L.COLS) {
      const vals = Object.values(table).map((r) => L.tmin(r[c]));
      amp[c] = Math.max(...vals) - Math.min(...vals);
    }
    // leap-day behaviour
    const feb29 = table[`${year}-02-29`] ? `${year}-02-29` : null;
    const leapDay = feb29
      ? { day: feb29, err: perDay[feb29] }
      : { day: null };
    entry.years[year] = { rows: Object.keys(table).length, score: sc, residuals: sum, amplitudeMin: amp, leapDay, perDay };
  }
  result.cities.push(entry);
}

// stability across years: per column, exact% and mean residual spread
for (const city of result.cities) {
  const years = Object.keys(city.years).map(Number).sort((a, b) => a - b);
  const st = {};
  for (const c of L.COLS) {
    const exact = years.map((y) => city.years[y].score.perColumn[c].exactPct);
    const mean = years.map((y) => city.years[y].residuals[c].mean);
    const mae = years.map((y) => city.years[y].score.perColumn[c].mae);
    const spread = Math.max(...mean) - Math.min(...mean);
    const slope = mean[mean.length - 1] - mean[0];
    st[c] = {
      exactPct: exact,
      meanResidual: mean,
      mae,
      meanResidualSpread: +spread.toFixed(3),
      driftFirstToLast: +slope.toFixed(3),
    };
  }
  const totExact = years.map((y) => city.years[y].score.total.exactPct);
  const totMae = years.map((y) => city.years[y].score.total.mae);
  city.stability = { years, totalExactPct: totExact, totalMae: totMae, perColumn: st };
  city.amplitude = {
    perYear: years.map((y) => city.years[y].amplitudeMin),
  };
}

// leap cycle: years divisible by 4 vs not, and the Feb-29 residual set
for (const city of result.cities) {
  const years = Object.keys(city.years).map(Number).sort((a, b) => a - b);
  const leap = years.filter((y) => new Date(y, 1, 29).getMonth() === 1);
  const flat = years.filter((y) => !leap.includes(y));
  const meanOf = (ys) => {
    const v = ys.map((y) => city.years[y].score.total.mae);
    return +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(3);
  };
  const feb29errs = {};
  for (const y of leap) {
    const e = city.years[y].leapDay.err;
    if (e) feb29errs[y] = e;
  }
  result.leap[city.key] = {
    leapYears: leap,
    nonLeapYears: flat,
    leapMeanMae: meanOf(leap),
    nonLeapMeanMae: meanOf(flat),
    feb29Residuals: feb29errs,
  };
}

fs.writeFileSync(path.join(ROOT, 'kz-deep.json'), JSON.stringify(result, null, 1));

// console digest
for (const city of result.cities) {
  console.log(`\n== ${city.name} ${city.marginSet} ==`);
  for (const y of Object.keys(city.years)) {
    const s = city.years[y].score;
    console.log(` ${y} rows=${city.years[y].rows} exact=${s.total.exactPct}% within1=${s.total.w1Pct}% mae=${s.total.mae} max=${s.total.maxAbs}`);
  }
  console.log(' stability exact%:', city.stability.totalExactPct.join(' '));
  console.log(' stability mae  :', city.stability.totalMae.join(' '));
}
console.log('\nleap:', JSON.stringify(result.leap, null, 1));
