const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');
const vm = require('vm');

// PrayTimes v2.5, canonical source, loaded in a sandbox
const ptSrc = fs.readFileSync(__dirname + '/PrayTimes.js', 'utf8');
const sandbox = { console, Math, Date, parseFloat, parseInt, isNaN };
vm.createContext(sandbox);
vm.runInContext(ptSrc, sandbox);
const PrayTimes = sandbox.PrayTimes;

const COLS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function parseTable(path) {
  const rows = JSON.parse(fs.readFileSync(path, 'utf8'));
  const out = rows.map(r => {
    const o = {};
    for (const c of COLS) {
      const [h, m] = r[c].split(':').map(Number);
      o[c] = h * 60 + m;
    }
    return o;
  });
  return out;
}

// day-of-year index -> civil date. leap=true uses a leap reference year.
function doyDate(i, leap, year) {
  const d = new Date(Date.UTC(year, 0, 1));
  d.setUTCDate(d.getUTCDate() + i);
  return d;
}

function minutesAt(date, offsetMinutes) {
  return (date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60) + offsetMinutes;
}

function adhanTimes(lat, lon, date, offsetMinutes, opts = {}) {
  const coords = new adhan.Coordinates(lat, lon);
  const p = new adhan.CalculationParameters(adhan.CalculationMethod.Other);
  p.madhab = opts.hanafi ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
  p.rounding = adhan.Rounding.None;
  p.fajrAngle = opts.fajrAngle == null ? 18 : opts.fajrAngle;
  p.ishaAngle = opts.ishaAngle == null ? 17 : opts.ishaAngle;
  if (opts.ishaInterval) { p.ishaInterval = opts.ishaInterval; p.ishaAngle = 0; }
  if (opts.adjustments) p.adjustments = opts.adjustments;
  if (opts.highLatitudeRule) p.highLatitudeRule = opts.highLatitudeRule;
  const pt = new adhan.PrayerTimes(coords, date, p);
  return {
    Fajr: minutesAt(pt.fajr, offsetMinutes),
    Sunrise: minutesAt(pt.sunrise, offsetMinutes),
    Dhuhr: minutesAt(pt.dhuhr, offsetMinutes),
    Asr: minutesAt(pt.asr, offsetMinutes),
    Maghrib: minutesAt(pt.maghrib, offsetMinutes),
    Isha: minutesAt(pt.isha, offsetMinutes),
  };
}

function prayTimesTimes(lat, lon, date, offsetMinutes, opts = {}) {
  const pt = new PrayTimes('Other');
  pt.setMethod({
    fajr: opts.fajrAngle == null ? 18 : opts.fajrAngle,
    isha: opts.ishaAngle == null ? 17 : opts.ishaAngle,
    maghrib: opts.ishaInterval ? opts.ishaInterval / 60 : 0,
    midnight: 'Standard',
    highLats: 'None',
  });
  pt.setMethod({ fajr: opts.fajrAngle == null ? 18 : opts.fajrAngle, isha: opts.ishaAngle == null ? 17 : opts.ishaAngle, maghrib: 0, midnight: 'Standard', highLats: 'None', asr: opts.hanafi ? 'Hanafi' : 'Standard' });
  const y = date.getUTCFullYear(), mo = date.getUTCMonth() + 1, d = date.getUTCDate();
  const t = pt.getTimes([y, mo, d], [lat, lon], 0, 0, 'Float');
  // PrayTimes returns local clock minutes at tz=0; add our offset
  const o = {};
  for (const c of COLS) o[c] = t[c.toLowerCase()] * 60 + offsetMinutes;
  return o;
}

function rms(a) { return Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length); }
function mean(a) { return a.reduce((s, x) => s + x, 0) / a.length; }

// fit lat/lon by coarse grid then hill climb on sunrise+maghrib rms
function fitSolar(table, offsetMinutes, leap, year, engine, opts = {}) {
  const days = table.length;
  const dates = Array.from({ length: days }, (_, i) => doyDate(i, leap, year));
  const fn = engine === 'adhan' ? adhanTimes : prayTimesTimes;
  function cost(lat, lon) {
    const r = [];
    for (let i = 0; i < days; i++) {
      const c = fn(lat, lon, dates[i], offsetMinutes, opts);
      r.push(c.Sunrise - table[i].Sunrise, c.Maghrib - table[i].Maghrib);
    }
    return rms(r);
  }
  let best = { lat: 0, lon: 0, cost: 1e9 };
  for (let lat = -60; lat <= 60; lat += 2) {
    for (let lon = -180; lon < 180; lon += 2) {
      const c = cost(lat, lon);
      if (c < best.cost) best = { lat, lon, cost: c };
    }
  }
  let step = 1;
  while (step > 0.001) {
    let improved = false;
    for (const [dl, dn] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const c = cost(best.lat + dl, best.lon + dn);
      if (c < best.cost) { best = { lat: best.lat + dl, lon: best.lon + dn, cost: c }; improved = true; }
    }
    if (!improved) step /= 2;
  }
  return best;
}

module.exports = { COLS, parseTable, doyDate, adhanTimes, prayTimesTimes, rms, mean, fitSolar, PrayTimes };
