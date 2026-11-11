// verify2 engine: adhan 4.4.6, second resolution, explicit rounding.
// Every runner pins TZ before node starts; the local-civil conversion below is
// independent of that pin and reads the zone from the IANA database.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const ADHAN = `${process.env.HOME}/athan-gitree/census/adhan-build/node_modules/adhan`;
const A = require(ADHAN);

const fmtCache = new Map();
function tzFormatter(tz) {
  if (!fmtCache.has(tz)) {
    fmtCache.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }
  return fmtCache.get(tz);
}

// Zone offset in seconds at an instant.
export function tzOffsetSeconds(instant, tz) {
  const parts = tzFormatter(tz).formatToParts(instant);
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second'));
  return (asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 1000;
}

export function params({ fajrAngle, ishaAngle, ishaInterval = 0, madhab = 'shafi' }) {
  const p = new A.CalculationParameters('Other', fajrAngle, ishaAngle, ishaInterval);
  p.rounding = A.Rounding.None;
  p.madhab = madhab === 'hanafi' ? A.Madhab.Hanafi : A.Madhab.Shafi;
  p.highLatitudeRule = A.HighLatitudeRule.MiddleOfTheNight;
  p.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return p;
}

// Float minutes past local midnight for every column, adhan's instants.
export function rawMinutes(coords, ymd, tz, p) {
  const [y, m, d] = ymd;
  const pt = new A.PrayerTimes(new A.Coordinates(coords.lat, coords.lng), new Date(y, m - 1, d, 12), p);
  const out = {};
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'sunset', 'isha']) {
    const instant = pt[k];
    if (!instant || Number.isNaN(instant.getTime())) { out[k] = NaN; continue; }
    const utcSec = Math.floor(instant.getTime() / 1000) % 86400;
    const localSec = ((utcSec + tzOffsetSeconds(instant, tz)) % 86400 + 86400) % 86400;
    out[k] = localSec / 60;
  }
  return out;
}

export function rawSunsetMinutes(coords, ymd, tz, p) {
  return rawMinutes(coords, ymd, tz, p).sunset;
}

const EPS = 1e-9;
export function round(x, mode) {
  if (mode === 'floor') return Math.floor(x + EPS);
  if (mode === 'ceil') return Math.ceil(x - EPS);
  if (mode === 'nearest') return Math.round(x);
  throw new Error(`unknown rounding ${mode}`);
}

export function hhmm(v) {
  const h = Math.floor(v / 60), m = v % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseHHMM(str) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(str).trim());
  if (!m) throw new Error(`bad time ${str}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// ---- scoring ----

export function emptyScore() {
  return { n: 0, exact: 0, within1: 0, sumAbs: 0, maxAbs: 0, under1: 0, over1: 0 };
}

export function addScore(s, predicted, actual) {
  const e = predicted - actual;
  const a = Math.abs(e);
  s.n += 1;
  if (e === 0) s.exact += 1;
  if (a <= 1) s.within1 += 1;
  s.sumAbs += a;
  s.maxAbs = Math.max(s.maxAbs, a);
  if (e < 0) s.under1 += 1;
  if (e > 0) s.over1 += 1;
}

export function finishScore(s) {
  return {
    n: s.n,
    exact: s.exact,
    exactPct: pct(s.exact, s.n),
    within1: s.within1,
    within1Pct: pct(s.within1, s.n),
    mae: s.n ? Number((s.sumAbs / s.n).toFixed(3)) : 0,
    worst: s.n ? s.maxAbs : 0,
    late: s.over1,
    early: s.under1,
  };
}

export function pct(a, b) {
  return b ? Number(((100 * a) / b).toFixed(1)) : 0;
}

// Umm al-Qura Hijri month for a civil date (independent of any capture field).
export function hijriMonthUmq(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: 'UTC', month: 'numeric', day: 'numeric', year: 'numeric' });
  const parts = fmt.formatToParts(new Date(Date.UTC(y, m - 1, d, 12)));
  const get = (t) => Number(parts.find((p) => p.type === t).value.replace(/\D/g, ''));
  return { year: get('year'), month: get('month'), day: get('day') };
}

// Best (rounding, margin) on a 0.5-minute margin grid for one column.
export function bestCell(prev, actuals, { roundings = ['floor', 'nearest', 'ceil'], margins = range(-5, 10, 0.5) } = {}) {
  let best = null;
  for (const r of roundings) {
    for (const m of margins) {
      const s = emptyScore();
      for (let i = 0; i < prev.length; i++) addScore(s, round(prev[i] + m, r), actuals[i]);
      const f = finishScore(s);
      const key = [f.mae, -f.exact, f.worst];
      if (!best || key[0] < best.key[0] || (key[0] === best.key[0] && key[1] < best.key[1]) || (key[0] === best.key[0] && key[1] === best.key[1] && key[2] < best.key[2])) {
        best = { rounding: r, margin: m, score: f, key };
      }
    }
  }
  return best;
}

export function range(from, to, step) {
  const out = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(Number(v.toFixed(2)));
  return out;
}

// Monthly means of a printed column, to read the seasonal amplitude.
export function monthlyMean(minutes, dateKeys) {
  const buckets = {};
  dateKeys.forEach((k, i) => {
    const mk = k.slice(0, 7);
    (buckets[mk] = buckets[mk] || []).push(minutes[i]);
  });
  const out = {};
  for (const [k, v] of Object.entries(buckets)) out[k] = Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(1));
  return out;
}
