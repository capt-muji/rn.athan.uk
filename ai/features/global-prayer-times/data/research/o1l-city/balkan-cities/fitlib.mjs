// Fit harness: adhan 4.4.6 against dated JSON rows.
// rows JSON shape: { "<YYYY-MM-DD>": {fajr,sunrise,dhuhr,asr,maghrib,isha} } with "HH:MM" strings.
import fs from 'node:fs';
import * as adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

export const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ROUND = { round: Math.round, floor: Math.floor, ceil: Math.ceil };
const fmtCache = new Map();
const offCache = new Map();

function tzFmt(tz) {
  let f = fmtCache.get(tz);
  if (!f) { f = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); fmtCache.set(tz, f); }
  return f;
}
export function tzOffsetMinutes(probeMs, tz) {
  const k = `${tz}|${probeMs}`;
  let v = offCache.get(k);
  if (v === undefined) {
    const p = Object.fromEntries(tzFmt(tz).formatToParts(new Date(probeMs)).map(x => [x.type, x.value]));
    const local = (+p.hour % 24) * 3600 + +p.minute * 60 + +p.second;
    v = (local - ((probeMs / 1000) % 86400)) / 60;
    offCache.set(k, v);
  }
  return v;
}
export function toLocalMinutes(date, tz, probeMs) {
  return (((date.getTime() / 60000 + tzOffsetMinutes(probeMs, tz)) % 1440) + 1440) % 1440;
}
export function parseHM(s) { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; }

export function loadRows(path) {
  const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
  const table = raw.rows ?? raw;
  return Object.keys(table).sort().map(date => {
    const probe = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), 12);
    const want = {};
    for (const p of PRAYERS) if (table[date][p] != null) want[p] = parseHM(table[date][p]);
    return { date, probe, want };
  });
}

export function compute(data, { lat, lon, tz, fajr, isha, madhab = 'shafi' }) {
  const params = new adhan.CalculationParameters('Other', fajr, isha);
  params.madhab = madhab;
  params.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  const coords = new adhan.Coordinates(lat, lon);
  return data.map(d => {
    const pt = new adhan.PrayerTimes(coords, new Date(d.probe), params);
    const vals = [pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha];
    const got = {};
    PRAYERS.forEach((n, i) => { if (vals[i]) got[n] = toLocalMinutes(vals[i], tz, d.probe); });
    return { date: d.date, want: d.want, got };
  });
}

export function scoreOf(rows, prayer, margin, mode = 'round') {
  const rn = ROUND[mode];
  const cmp = rows.filter(r => r.want[prayer] !== undefined && r.got[prayer] !== undefined)
    .map(r => r.want[prayer] - rn(r.got[prayer] + margin));
  if (!cmp.length) return null;
  const exact = cmp.filter(x => x === 0).length;
  const within1 = cmp.filter(x => Math.abs(x) <= 1).length;
  const mae = cmp.reduce((a, b) => a + Math.abs(b), 0) / cmp.length;
  const mean = cmp.reduce((a, b) => a + b, 0) / cmp.length;
  const sd = Math.sqrt(cmp.reduce((a, b) => a + (b - mean) ** 2, 0) / cmp.length);
  return { exact, within1, mae, mean, sd, n: cmp.length, min: Math.min(...cmp), max: Math.max(...cmp) };
}

// angular fit for fajr/isha: grid over angle, margin and rounding mode
export function fitAngle(data, ctx, prayer, lo = 6, hi = 24, step = 0.05) {
  let best = null;
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const rows = compute(data, { ...ctx, [prayer]: a });
    for (let m = -10; m <= 10; m += 1) for (const mode of ['round', 'floor', 'ceil']) {
      const s = scoreOf(rows, prayer, m, mode);
      if (!s) continue;
      const loss = s.mae + 0.002 * Math.abs(m);
      if (!best || loss < best.loss) best = { loss, angle: +a.toFixed(2), margin: m, mode, ...s };
    }
  }
  return best;
}

export function fitMargin(rows, prayer, lo = -14, hi = 14) {
  let best = null;
  for (let m = lo; m <= hi; m += 0.5) for (const mode of ['round', 'floor', 'ceil']) {
    const s = scoreOf(rows, prayer, m, mode);
    if (!s) continue;
    if (!best || s.mae + 0.001 * Math.abs(m) < best.mae + 0.001 * Math.abs(best.margin)) best = { margin: m, mode, ...s };
  }
  return best;
}

export function perYear(rows, margins, modes) {
  const years = {};
  for (const r of rows) (years[r.date.slice(0, 4)] ??= []).push(r);
  return Object.entries(years).map(([y, rs]) => {
    let e = 0, w = 0, t = 0;
    for (const p of PRAYERS) {
      if (rs[0].want[p] === undefined) continue;
      const s = scoreOf(rs, p, margins[p] ?? 0, modes[p] ?? 'round');
      if (!s) continue;
      e += s.exact; w += s.within1; t += s.n;
    }
    return { year: y, exact: e, within1: w, n: t };
  });
}
