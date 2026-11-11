import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const adhan = require('$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js');

const { Coordinates, PrayerTimes, CalculationMethod, Madhab } = adhan;

export const COLUMNS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function parseHm(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) throw new Error('bad time ' + s);
  return Number(m[1]) * 60 + Number(m[2]);
}

// UTC noon keeps the local calendar date unambiguous in every zone used here (|offset| < 12h).
export function utcDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

// Zone offset from Intl, so the runtime TZ cannot colour the answer. Cached per UTC hour:
// the sweeps ask for the same instants thousands of times.
const offsetCache = new Map();
function zoneOffsetMinutes(date, tz) {
  const key = tz + '|' + Math.floor(date.getTime() / 3600000);
  const hit = offsetCache.get(key);
  if (hit !== undefined) return hit;
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  const off = Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 1000 / 60);
  offsetCache.set(key, off);
  return off;
}

function minutesOfDay(date, iso, tz) {
  const [y, m, d] = iso.split('-').map(Number);
  const dayStart = Date.UTC(y, m - 1, d);
  return (date.getTime() - dayStart) / 60000 + zoneOffsetMinutes(date, tz);
}

export function makeParams({ fajrAngle, ishaAngle, ishaInterval, madhab, fajrOffset = 0, sunriseOffset = 0, dhuhrOffset = 0, asrOffset = 0, maghribOffset = 0, ishaOffset = 0 }) {
  const p = new CalculationMethod.MuslimWorldLeague();
  p.method = 'fit';
  p.fajrAngle = fajrAngle;
  if (ishaInterval > 0) { p.ishaAngle = 0; p.ishaInterval = ishaInterval; }
  else { p.ishaAngle = ishaAngle; p.ishaInterval = 0; }
  p.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  p.rounding = 'none';
  p.adjustments = {
    fajr: fajrOffset, sunrise: sunriseOffset, dhuhr: dhuhrOffset,
    asr: asrOffset, maghrib: maghribOffset, isha: ishaOffset,
  };
  return p;
}

export function rawTimes(coords, iso, params, tz) {
  const pt = new PrayerTimes(coords, utcDate(iso), params);
  return {
    fajr: minutesOfDay(pt.fajr, iso, tz),
    sunrise: minutesOfDay(pt.sunrise, iso, tz),
    dhuhr: minutesOfDay(pt.dhuhr, iso, tz),
    asr: minutesOfDay(pt.asr, iso, tz),
    maghrib: minutesOfDay(pt.maghrib, iso, tz),
    isha: minutesOfDay(pt.isha, iso, tz),
  };
}

export function coordsOf(lat, lon) { return new Coordinates(lat, lon); }

// 1-D sweep of a single column over one parameter, printed minute as target.
export function sweep(dates, printed, col, lo, hi, step, coords, build, tz) {
  let best = null;
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const params = build(a);
    let sum = 0;
    const raws = {};
    for (const iso of dates) {
      const t = rawTimes(coords, iso, params, tz);
      raws[iso] = t;
      sum += Math.abs(printed[iso][col] - t[col]);
    }
    const mae = sum / dates.length;
    if (!best || mae < best.mae) best = { value: a, mae, raws };
  }
  return best;
}

export function amplitude(dates, raw, col) {
  const jan = dates.filter((d) => d.slice(5, 7) === '01').map((d) => raw[d][col]);
  const jul = dates.filter((d) => d.slice(5, 7) === '07').map((d) => raw[d][col]);
  if (!jan.length || !jul.length) return null;
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  return { jan: mean(jan), jul: mean(jul), span: mean(jul) - mean(jan) };
}

// Monthly means of one column's residual, for spotting a seasonal signature.
export function monthlyBias(dates, raw, printed, col) {
  const b = {};
  for (const iso of dates) {
    const k = iso.slice(0, 7);
    (b[k] = b[k] || []).push(printed[iso][col] - raw[iso][col]);
  }
  return Object.fromEntries(Object.entries(b).map(([k, v]) => [
    k, Math.round((v.reduce((x, y) => x + y, 0) / v.length) * 100) / 100,
  ]));
}
