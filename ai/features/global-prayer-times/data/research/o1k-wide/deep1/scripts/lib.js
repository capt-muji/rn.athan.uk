// Shared fit helpers: second-resolution instants, explicit rounding, deterministic clock.
const fs = require('fs');
const path = require('path');

const ADHAN = path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan');
const A = require(ADHAN);

const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const roundHalfUp = (x) => Math.floor(x + 0.5 + 1e-9);
const floorMin = (x) => Math.floor(x + 1e-9);

// adhan returns absolute epochs; read them on a fixed UTC+offset wall clock so no
// visitor clock and no DST rule can reach the arithmetic.
function wallMinutes(dateObj, offsetHours) {
  const ms = dateObj.getTime() + offsetHours * 3600 * 1000;
  return ((ms % 86400000) + 86400000) % 86400000 / 60000;
}

function paramsFor(kind) {
  if (kind === 'kz') {
    const p = A.CalculationMethod.NorthAmerica(); // ISNA 15/15
    p.madhab = A.Madhab.Hanafi;
    p.highLatitudeRule = A.HighLatitudeRule.TwilightAngle;
    p.rounding = A.Rounding.None;
    return p;
  }
  if (kind === 'kg') {
    const p = new A.CalculationParameters('Other', 18, 18, 0);
    p.madhab = A.Madhab.Hanafi;
    p.highLatitudeRule = A.HighLatitudeRule.TwilightAngle;
    p.rounding = A.Rounding.None;
    return p;
  }
  if (kind === 'sa') {
    const p = new A.CalculationParameters('Other', 18.5, 18, 0);
    p.madhab = A.Madhab.Shafi;
    p.highLatitudeRule = A.HighLatitudeRule.MiddleOfTheNight;
    p.rounding = A.Rounding.None;
    return p;
  }
  throw new Error('unknown kind ' + kind);
}

function rawTimes(kind, lat, lng, offsetHours, y, m, d) {
  const p = paramsFor(kind);
  const date = new Date(y, m - 1, d); // local fields only; TZ is fixed by the caller
  const pt = new A.PrayerTimes(new A.Coordinates(lat, lng), date, p);
  const o = {};
  for (const k of COLS) o[k] = wallMinutes(pt[k], offsetHours);
  return o;
}

function readTable(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function tmin(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function score(pairs) {
  // pairs: [{col, err}]
  const out = {};
  for (const c of COLS) out[c] = { n: 0, exact: 0, w1: 0, sumAbs: 0, maxAbs: 0 };
  for (const { col, err } of pairs) {
    const s = out[col];
    s.n++;
    if (err === 0) s.exact++;
    if (Math.abs(err) <= 1) s.w1++;
    s.sumAbs += Math.abs(err);
    s.maxAbs = Math.max(s.maxAbs, Math.abs(err));
  }
  let tot = { n: 0, exact: 0, w1: 0, sumAbs: 0, maxAbs: 0 };
  for (const c of COLS) {
    const s = out[c];
    s.exactPct = s.n ? +(100 * s.exact / s.n).toFixed(1) : null;
    s.w1Pct = s.n ? +(100 * s.w1 / s.n).toFixed(1) : null;
    s.mae = s.n ? +(s.sumAbs / s.n).toFixed(3) : null;
    tot.n += s.n; tot.exact += s.exact; tot.w1 += s.w1; tot.sumAbs += s.sumAbs;
    tot.maxAbs = Math.max(tot.maxAbs, s.maxAbs);
  }
  tot.exactPct = tot.n ? +(100 * tot.exact / tot.n).toFixed(1) : null;
  tot.w1Pct = tot.n ? +(100 * tot.w1 / tot.n).toFixed(1) : null;
  tot.mae = tot.n ? +(tot.sumAbs / tot.n).toFixed(3) : null;
  return { perColumn: out, total: tot };
}

module.exports = { A, COLS, roundHalfUp, floorMin, wallMinutes, paramsFor, rawTimes, readTable, tmin, score };
