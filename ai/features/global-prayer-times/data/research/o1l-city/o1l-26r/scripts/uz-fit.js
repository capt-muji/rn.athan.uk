const fs = require('fs');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const COLS = { fajr: 2, sunrise: 3, ishroq: 4, dhuhr: 5, asr: 6, maghrib: 7, isha: 8, tahajjud: 9 };
const mins = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

function calc(y, mo, d, lat, lng, adj, tz = 5) {
  const ds = Date.UTC(y, mo - 1, d);
  const p = new adhan.CalculationParameters('Other', 15.5, 15.5);
  p.madhab = adhan.Madhab.Hanafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.adjustments = adj;
  p.rounding = adhan.Rounding.None;
  const t = new adhan.PrayerTimes(new adhan.Coordinates(lat, lng), new Date(ds), p);
  const out = {};
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const m = (new Date(t[k]).getTime() - ds) / 60000 + tz * 60;
    out[k] = ((m % 1440) + 1440) % 1440;
  }
  out.sunset = (new Date(t.maghrib).getTime() - ds) / 60000 + tz * 60;
  return out;
}

function run(file, lat, lng, adj = {}, tz = 5, month = 11, year = 2026) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const acc = {};
  for (const k of Object.keys(COLS)) acc[k] = { n: 0, exact: 0, w1: 0, abs: 0, bias: 0, worst: 0 };
  for (const row of d.rows) {
    const day = Number(row[0]);
    const p = calc(year, month, day, lat, lng, adj, tz);
    for (const [k, ci] of Object.entries(COLS)) {
      let pred;
      if (k === 'ishroq') pred = p.sunrise + 20;
      else if (k === 'tahajjud') continue;
      else pred = p[k];
      if (pred == null || Number.isNaN(pred)) continue;
      const diff = mins(row[ci]) - Math.round(pred);
      const s = acc[k];
      s.n++; if (diff === 0) s.exact++; if (Math.abs(diff) <= 1) s.w1++;
      s.abs += Math.abs(diff); s.bias += diff;
      if (Math.abs(diff) > Math.abs(s.worst)) s.worst = diff;
    }
  }
  return acc;
}

function table(label, acc) {
  const L = [`### ${label}`, '| column | exact % | within-1 % | MAE | bias | worst |', '|---|---|---|---|---|---|'];
  for (const k of Object.keys(acc)) {
    const s = acc[k];
    if (!s.n) continue;
    L.push(`| ${k} | ${(100 * s.exact / s.n).toFixed(1)} | ${(100 * s.w1 / s.n).toFixed(1)} | ${(s.abs / s.n).toFixed(2)} | ${(s.bias / s.n).toFixed(2)} | ${s.worst} |`);
  }
  return L.join('\n');
}

module.exports = { run, table, calc, mins, COLS };
