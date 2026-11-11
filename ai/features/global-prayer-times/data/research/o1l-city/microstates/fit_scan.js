process.env.TZ = process.argv[2] || 'Europe/Andorra';
const fs = require('fs');
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');

const spec = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const coords = new adhan.Coordinates(spec.lat, spec.lon);

const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const fmt = (d) => d.getHours() * 60 + d.getMinutes();

function loadRows(spec) {
  if (spec.rowsFile) return JSON.parse(fs.readFileSync(spec.rowsFile, 'utf8'));
  const conf = JSON.parse(fs.readFileSync(spec.confFile, 'utf8'));
  const cal = conf.calendar;
  const year = spec.year;
  const rows = {};
  for (let m = 0; m < 12; m++) {
    const dim = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
    for (let d = 1; d <= dim; d++) {
      const r = cal[m][String(d)];
      if (!r) continue;
      const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      rows[key] = { fajr: r[0], sunrise: r[1], dhuhr: r[2], asr: r[3], maghrib: r[4], isha: r[5] };
    }
  }
  return rows;
}

function paramsWith(opts) {
  const p = adhan.CalculationMethod.Other();
  p.fajrAngle = opts.fajrAngle;
  p.ishaAngle = opts.ishaAngle || 0;
  p.ishaInterval = opts.ishaInterval || 0;
  p.madhab = opts.hanafi ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  p.highLatitudeRule = opts.rule || adhan.HighLatitudeRule.MiddleOfTheNight;
  p.methodAdjustments = new adhan.CalculationParameters().methodAdjustments;
  p.rounding = adhan.Rounding.None;
  return p;
}

const rows = loadRows(spec);
const dates = Object.keys(rows).sort();
const cache = {};
function times(key, opts) {
  const sig = JSON.stringify(opts);
  if (!cache[sig]) cache[sig] = {};
  if (cache[sig][key]) return cache[sig][key];
  const [y, m, d] = key.split('-').map(Number);
  const t = new adhan.PrayerTimes(coords, new Date(y, m - 1, d, 12, 0, 0), paramsWith(opts));
  cache[sig][key] = t;
  return t;
}

// residual after removing the median (median = the fitted integer/float margin)
function resid(prayer, opts) {
  const e = dates.map((k) => fmt(times(k, opts)[prayer]) - toMin(rows[k][prayer])).sort((a, b) => a - b);
  const med = e[Math.floor(e.length / 2)];
  const res = e.map((x) => x - med);
  const absmean = res.reduce((a, b) => a + Math.abs(b), 0) / res.length;
  const rms = Math.sqrt(res.reduce((a, b) => a + b * b, 0) / res.length);
  return {
    margin: med, absmean: +absmean.toFixed(2), rms: +rms.toFixed(2),
    exact: res.filter((x) => x === 0).length,
    w1: res.filter((x) => Math.abs(x) <= 1).length, n: res.length,
  };
}

const out = { surface: spec.name, tz: process.env.TZ, rows: dates.length, span: [dates[0], dates.at(-1)], cols: {} };

out.cols.sunrise = resid('sunrise', { fajrAngle: 18, ishaAngle: 17 });
out.cols.maghrib = resid('maghrib', { fajrAngle: 18, ishaAngle: 17 });
out.cols.dhuhr = resid('dhuhr', { fajrAngle: 18, ishaAngle: 17 });
out.cols.asr_shafi = resid('asr', { fajrAngle: 18, ishaAngle: 17 });
out.cols.asr_hanafi = resid('asr', { fajrAngle: 18, ishaAngle: 17, hanafi: true });

let bestF = null;
for (let a = 12; a <= 20.001; a += 0.1) {
  const r = resid('fajr', { fajrAngle: +a.toFixed(1), ishaAngle: 17 });
  if (!bestF || r.absmean < bestF.absmean) bestF = { angle: +a.toFixed(1), ...r };
}
// fajr as a fixed interval before sunrise (dawn-gate family)
let bestFI = null;
{
  const opts = { fajrAngle: 18, ishaAngle: 17 };
  for (let iv = 60; iv <= 130; iv += 1) {
    const e = dates.map((k) => fmt(times(k, opts).sunrise) - iv - toMin(rows[k].fajr)).sort((a, b) => a - b);
    const med = e[Math.floor(e.length / 2)];
    const res = e.map((x) => x - med);
    const absmean = res.reduce((a, b) => a + Math.abs(b), 0) / res.length;
    if (!bestFI || absmean < bestFI.absmean) bestFI = { interval: iv, margin: med, absmean: +absmean.toFixed(2), w1: res.filter((x) => Math.abs(x) <= 1).length, n: res.length };
  }
}
out.cols.fajr = bestF;
out.cols.fajr_interval = bestFI;

let bestIA = null;
for (let a = 10; a <= 19.001; a += 0.1) {
  const r = resid('isha', { fajrAngle: 18, ishaAngle: +a.toFixed(1) });
  if (!bestIA || r.absmean < bestIA.absmean) bestIA = { angle: +a.toFixed(1), ...r };
}
let bestII = null;
for (let iv = 60; iv <= 130; iv += 1) {
  const r = resid('isha', { fajrAngle: 18, ishaInterval: iv });
  if (!bestII || r.absmean < bestII.absmean) bestII = { interval: iv, ...r };
}
out.cols.isha = { angle: bestIA, interval: bestII };

console.log(JSON.stringify(out, null, 1));
