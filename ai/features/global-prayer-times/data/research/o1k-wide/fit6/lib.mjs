// Shared fit machinery for fit6. Census discipline: adhan 4.4.6, second
// resolution, explicit per-prayer rounding, no clock reads, no network.
// Process runs TZ=UTC; dates enter as UTC noon so adhan's local getters read
// the intended calendar day; wall-clock reading is per-site via Intl zones.
import { pathToFileURL } from 'node:url';

const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';

export async function load() {
  const mod = await import(pathToFileURL(ADHAN + 'Adhan.js'));
  const { default: SolarTime } = await import(pathToFileURL(ADHAN + 'SolarTime.js'));
  const { default: CalculationParameters } = await import(pathToFileURL(ADHAN + 'CalculationParameters.js'));
  const { default: Coordinates } = await import(pathToFileURL(ADHAN + 'Coordinates.js'));
  const { default: TimeComponents } = await import(pathToFileURL(ADHAN + 'TimeComponents.js'));
  return {
    PrayerTimes: mod.PrayerTimes, SolarTime, CalculationParameters, Coordinates,
    TimeComponents, Madhab: mod.Madhab, Rounding: mod.Rounding,
  };
}

const ZF = new Map();
export function zoneMin(d, tz) {
  // Wall-clock minutes-of-day (minute resolution) and seconds part, per zone.
  let f = ZF.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    ZF.set(tz, f);
  }
  const p = {};
  for (const { type, value } of f.formatToParts(d)) p[type] = value;
  const h = +p.hour % 24, m = +p.minute, s = +p.second;
  return { min: h * 60 + m, sec: s, day: `${p.year}-${p.month}-${p.day}` };
}

export function utcNoon(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

// Raw solar events via adhan's own Meeus implementation, no safety-net
// fallbacks: values are fractional hours in the site's zone reading.
// col: {transit, sunrise, sunset, angleN|m|e, asr1, asr2}
export function solarEvents(adhan, dateStr, coords) {
  const st = new adhan.SolarTime(utcNoon(dateStr), new adhan.Coordinates(coords.lat, coords.lon));
  return {
    transit: st.transit, sunrise: st.sunrise, sunset: st.sunset,
    hourAngle: (a, after) => st.hourAngle(-a, after),
    asr: (shadow) => st.afternoon(shadow),
  };
}

// Fractional-hour solar value -> seconds-of-day in a zone (second resolution).
function toSec(adhan, val, dateStr, tz) {
  if (val === null || Number.isNaN(val)) return null;
  const tc = new adhan.TimeComponents(val);
  const d = new Date(Date.UTC(
    +dateStr.slice(0, 4), +dateStr.slice(5, 7) - 1, +dateStr.slice(8, 10),
    tc.hours, tc.minutes, tc.seconds));
  return zoneMin(d, tz);
}

// Second-resolution secOfDay for every computed column of every date.
export function computeCols(adhan, coords, tz, dates, spec) {
  // spec: { fajr:{kind:'angle',v}, isha:{kind:'angle'|'interval',v}, asr:'shafi'|'hanafi', mirror18:bool }
  const out = {};
  const cols = new Set(Object.keys(spec));
  for (const c of cols) out[c] = [];
  for (const d of dates) {
    const ev = solarEvents(adhan, d, coords);
    for (const [col, s] of Object.entries(spec)) {
      let v = null;
      if (s.kind === 'transit') v = ev.transit;
      else if (s.kind === 'sunrise') v = ev.sunrise;
      else if (s.kind === 'sunset') v = ev.sunset;
      else if (s.kind === 'angle') v = ev.hourAngle(s.v, !!s.after);
      else if (s.kind === 'asr') v = ev.asr(s.v === 'hanafi' ? 2 : 1);
      else if (s.kind === 'interval') v = ev.sunset + s.v / 60;
      const r = toSec(adhan, v, d, tz);
      out[col].push(r === null ? null : r.min * 60 + r.sec);
    }
  }
  return out;
}

// Explicit minute rounding of minutes carrying seconds.
export function roundMin(mins, mode) {
  const base = Math.floor(mins);
  const s = (mins - base) * 60;
  const bump = mode === 'floor' ? 0 : mode === 'ceil' ? (s > 1e-6 ? 1 : 0) : (s >= 30 ? 1 : 0);
  return base + bump;
}

export function parseMin(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t).trim());
  if (!m) throw new Error('bad time ' + t);
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function chartOf(rows, cols) {
  const out = {};
  for (const c of cols) out[c] = rows.map((r) => (r[c] === null || r[c] === undefined ? null : parseMin(r[c])));
  return out;
}

// Score a fixed (margin, mode) for one column; null chart rows skipped.
export function score(sec, chart, margin, mode) {
  let exact = 0, within1 = 0, worst = 0, sum = 0, signed = 0, n = 0;
  for (let i = 0; i < sec.length; i++) {
    if (chart[i] === null || sec[i] === null) continue;
    n++;
    const v = roundMin(sec[i] / 60 + margin, mode);
    const diff = v - chart[i];
    const a = Math.abs(diff);
    if (a === 0) exact++;
    if (a <= 1) within1++;
    if (a > worst) worst = a;
    sum += a;
    signed += diff;
  }
  return { margin, mode, exact, within1, worst, mae: n ? sum / n : 0, bias: n ? signed / n : 0, n };
}

const MODES = ['nearest', 'floor', 'ceil'];
const MARGINS = [];
for (let j = -20; j <= 20; j++) MARGINS.push(j / 2);

export function bestMargin(sec, chart, opts = {}) {
  const { margins = MARGINS, modes = MODES } = opts;
  const res = [];
  for (const mode of modes) for (const margin of margins) res.push(score(sec, chart, margin, mode));
  res.sort((a, b) => b.exact - a.exact || b.within1 - a.within1 || a.worst - b.worst || Math.abs(a.margin) - Math.abs(b.margin));
  return res[0];
}

// Sweep one value (angle or interval) for one column; report best + plateau.
export function scanValue(adhan, coords, tz, dates, chart, col, values, specOf, opts = {}) {
  const { mode = 'nearest', marginBound = 2 } = opts;
  const margins = MARGINS.filter((m) => Math.abs(m) <= marginBound);
  const curve = [];
  for (const v of values) {
    const ser = computeCols(adhan, coords, tz, dates, specOf(v));
    curve.push({ value: v, ...bestMargin(ser[col], chart, { margins, modes: [mode] }) });
  }
  curve.sort((a, b) => b.exact - a.exact || b.within1 - a.within1 || a.worst - b.worst || Math.abs(a.margin) - Math.abs(b.margin));
  const best = curve[0];
  const plateau = curve.filter((c) => c.exact === best.exact && c.worst === best.worst).map((c) => c.value);
  return { best, plateau: plateau.length ? { min: Math.min(...plateau), max: Math.max(...plateau) } : null, curve };
}

export function line(name, r) {
  return `${name.padEnd(10)} exact ${String(r.exact).padStart(3)}/${String(r.n).padEnd(3)} within1 ${String(r.within1).padStart(3)}/${String(r.n).padEnd(3)} worst ${String(r.worst).padStart(2)}  mae ${r.mae.toFixed(2)}  bias ${r.bias >= 0 ? '+' : ''}${r.bias.toFixed(2)}  margin ${r.margin >= 0 ? '+' + r.margin : r.margin} ${r.mode}`;
}

export function r1(x) { return Math.round(x * 10) / 10; }
export function r2(x) { return Math.round(x * 100) / 100; }
