// Shared fit machinery for the o1k-wide fit phase.
// Census discipline: adhan 4.4.6, second resolution (Rounding.None) then
// explicit per-prayer rounding, no clock reads, no network.
import { pathToFileURL } from 'node:url';

const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';

export async function load() {
  const mod = await import(pathToFileURL(ADHAN + 'Adhan.js'));
  const { default: CalculationParameters } = await import(pathToFileURL(ADHAN + 'CalculationParameters.js'));
  const { default: Coordinates } = await import(pathToFileURL(ADHAN + 'Coordinates.js'));
  return {
    PrayerTimes: mod.PrayerTimes,
    Coordinates,
    Madhab: mod.Madhab,
    Rounding: mod.Rounding,
    methods: mod.CalculationMethod,
    CalculationParameters,
  };
}

// Whole-second-of-day from a Rounding.None Date. TZ is set by the caller.
export function secOfDay(d) {
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

// Explicit minute rounding of a minutes-of-day value derived from second
// resolution, mirroring adhan's roundedMinute: floor keeps, ceil bumps when
// s>0, nearest bumps at s>=30.
export function roundMin(mins, mode) {
  const base = Math.floor(mins);
  const s = (mins - base) * 60;
  const bump = mode === 'floor' ? 0 : mode === 'ceil' ? (s > 1e-6 ? 1 : 0) : (s >= 30 ? 1 : 0);
  return base + bump;
}

export function parseMin(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) throw new Error('bad time ' + t);
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

// Rows: {date:'YYYY-MM-DD', fajr:'HH:MM', ...}
export function chartCols(rows) {
  const out = {};
  for (const p of PRAYERS) out[p] = rows.map((r) => parseMin(r[p]));
  return out;
}

// Full six-column series for a parameter set over the row dates.
export function series(adhan, coords, dates, params) {
  const { PrayerTimes, Coordinates } = adhan;
  const c = new Coordinates(coords.lat, coords.lon);
  const out = { fajr: [], sunrise: [], dhuhr: [], asr: [], maghrib: [], isha: [] };
  for (const d of dates) {
    const [y, m, day] = d.split('-').map(Number);
    const pt = new PrayerTimes(c, new Date(y, m - 1, day), params);
    out.fajr.push(secOfDay(pt.fajr));
    out.sunrise.push(secOfDay(pt.sunrise));
    out.dhuhr.push(secOfDay(pt.dhuhr));
    out.asr.push(secOfDay(pt.asr));
    out.maghrib.push(secOfDay(pt.maghrib));
    out.isha.push(secOfDay(pt.isha));
  }
  return out;
}

// Stats for a fixed (margin, mode) against one printed column.
export function score(sec, chart, margin, mode) {
  let exact = 0, within1 = 0, worst = 0, sum = 0, signed = 0;
  for (let i = 0; i < sec.length; i++) {
    const v = roundMin(sec[i] / 60 + margin, mode);
    const diff = v - chart[i];
    const a = Math.abs(diff);
    if (a === 0) exact++;
    if (a <= 1) within1++;
    if (a > worst) worst = a;
    sum += a;
    signed += diff;
  }
  const n = sec.length;
  return { margin, mode, exact, within1, worst, mae: sum / n, bias: signed / n, n };
}

const MODES = ['floor', 'ceil', 'nearest'];
const ALL_MARG = [];
for (let j = -20; j <= 20; j++) ALL_MARG.push(j / 2); // -10.0 .. +10.0 by 0.5

export function marginsIn(bound) {
  return ALL_MARG.filter((m) => Math.abs(m) <= bound);
}

// Best (margin, mode) for one column. Ties prefer the smallest |margin| so the
// recipe does not absorb a parameter into an offset.
export function bestMargin(sec, chart, opts = {}) {
  const { margins = ALL_MARG, modes = MODES } = opts;
  const res = [];
  for (const mode of modes) for (const margin of margins) res.push(score(sec, chart, margin, mode));
  res.sort((a, b) => b.exact - a.exact || b.within1 - a.within1 || a.worst - b.worst || Math.abs(a.margin) - Math.abs(b.margin));
  return res[0];
}

// Scan one numeric parameter (angle or interval) for one column under a fixed
// rounding mode. Returns the best candidate, the full score curve, and the
// plateau of values that reach the best exact+worst, so a report can state what
// the span can and cannot identify.
export function scanValue(adhan, coords, dates, chart, col, values, build, opts = {}) {
  const { mode = 'nearest', marginBound = 2 } = opts;
  const margins = marginsIn(marginBound);
  const curve = [];
  for (const v of values) {
    const ser = series(adhan, coords, dates, build(v));
    const r = bestMargin(ser[col], chart, { margins, modes: [mode] });
    curve.push({ value: v, ...r, sec: ser[col] });
  }
  curve.sort((a, b) => b.exact - a.exact || a.worst - b.worst || Math.abs(a.margin) - Math.abs(b.margin));
  const best = curve[0];
  const plateau = curve.filter((c) => c.exact === best.exact && c.worst === best.worst).map((c) => c.value);
  return { best, curve, plateau: { min: Math.min(...plateau), max: Math.max(...plateau), values: plateau } };
}

export function line(name, r) {
  return `${name.padEnd(10)} exact ${String(r.exact).padStart(3)}/${String(r.n).padEnd(3)} within1 ${String(r.within1).padStart(3)}/${String(r.n).padEnd(3)} worst ${String(r.worst).padStart(2)}  mae ${r.mae.toFixed(2)}  bias ${r.bias >= 0 ? '+' : ''}${r.bias.toFixed(2)}  margin ${r.margin >= 0 ? '+' + r.margin : r.margin} ${r.mode}`;
}
