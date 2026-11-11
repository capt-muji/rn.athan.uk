// Census fit machinery: adhan 4.4.6 solar core, second resolution, explicit
// rounding. Raw crossings only: no high-latitude clamp, no safeFajr guard, so a
// published rule is measured rather than the library's own fallback.
import { pathToFileURL } from 'node:url';

const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';

export async function loadAdhan() {
  const { default: SolarTime } = await import(pathToFileURL(ADHAN + 'SolarTime.js'));
  const { default: TimeComponents } = await import(pathToFileURL(ADHAN + 'TimeComponents.js'));
  const { default: Coordinates } = await import(pathToFileURL(ADHAN + 'Coordinates.js'));
  return { SolarTime, TimeComponents, Coordinates };
}

let A = null;
export async function init() { A = await loadAdhan(); return A; }

const dayCache = new Map();
const fmtCache = new Map();

// Signed seconds of an instant relative to a calendar date's local midnight in
// the given zone. Day-aware: a 00:04 sunset belongs to the next day (+86400),
// which the summer tables need. adhan's own date components need a UTC process
// (run with TZ=UTC).
function zoneFormatter(tz) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit',
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    fmtCache.set(tz, f);
  }
  return f;
}

export function localStamp(instant, tz, isoDate) {
  const parts = {};
  for (const p of zoneFormatter(tz).formatToParts(instant)) parts[p.type] = p.value;
  const localDay = Date.UTC(+parts.year, +parts.month - 1, +parts.day);
  const [y, m, d] = isoDate.split('-').map(Number);
  const baseDay = Date.UTC(y, m - 1, d);
  const dayDelta = Math.round((localDay - baseDay) / 86400000);
  return dayDelta * 86400 + (+parts.hour) * 3600 + (+parts.minute) * 60 + (+parts.second);
}

// Raw solar day for one date at one coordinate, in seconds of the local day.
export function solarDay(lat, lng, iso, tz) {
  const key = `${lat},${lng},${iso},${tz}`;
  const hit = dayCache.get(key);
  if (hit) return hit;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const coords = new A.Coordinates(lat, lng);
  const st = new A.SolarTime(date, coords);
  const at = (num) => {
    if (num === null || num === undefined || Number.isNaN(num)) return null;
    const tc = new A.TimeComponents(num);
    return localStamp(tc.utcDate(y, m - 1, d), tz, iso);
  };
  const out = {
    fajr: (angle) => at(st.hourAngle(-Math.abs(angle), false)),
    isha: (angle) => at(st.hourAngle(-Math.abs(angle), true)),
    sunrise: at(st.sunrise),
    sunset: at(st.sunset),
    transit: at(st.transit),
    asr: (shadow) => at(st.afternoon(shadow)),
  };
  dayCache.set(key, out);
  return out;
}

// Explicit minute rounding of a second-resolution value, with the published
// margin folded in BEFORE rounding (a safety margin shifts the threshold).
export function rnd(seconds, mode, margin = 0) {
  const mins = seconds / 60 + margin;
  if (mode === 'floor') return Math.floor(mins);
  if (mode === 'ceil') return Math.ceil(mins);
  if (mode === 'nearest') return Math.round(mins);
  throw new Error('mode ' + mode);
}

export const MODES = ['floor', 'ceil', 'nearest'];
export const MODE_TXT = { floor: 'floor', ceil: 'ceil', nearest: 'nearest', trunc: 'truncate' };

export function fmtMin(v) {
  const m = ((Math.round(v) % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

export function fmtSec(s) {
  const v = ((s % 86400) + 86400) % 86400;
  return fmtMin(v / 60) + ':' + String(Math.floor(v % 60)).padStart(2, '0');
}

export function parseHHMM(str, pm = false) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(str).trim());
  if (!m) throw new Error('bad time ' + str);
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (pm && h < 12) h += 12;
  return h * 60 + min;
}

// 12-hour AM/PM ("01:24 PM") -> minutes of day.
export function parse12h(str) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(str).trim());
  if (!m) throw new Error('bad 12h time ' + str);
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + parseInt(m[2], 10);
}

// Fit one column to one printed series.
// model: (iso, angle) -> seconds|null; printed: minutes; days: iso list.
// Sweeps angle (deg) and offset (min) on a grid, returns the best cell by
// exact, then within-1, then worst, then |offset|.
export function fitAngle(days, printed, model, opts = {}) {
  const { aMin = 12, aMax = 22, aStep = 0.01, oMin = -6, oMax = 6, oStep = 0.1,
          modes = ['floor', 'ceil', 'nearest'] } = opts;
  let best = null;
  const nA = Math.round((aMax - aMin) / aStep);
  for (let i = 0; i <= nA; i++) {
    const angle = aMin + i * aStep;
    const raw = days.map((iso) => model(iso, angle));
    if (raw.some((v) => v === null)) continue;
    for (const mode of modes) {
      for (let o = oMin; o <= oMax + 1e-9; o += oStep) {
        const off = Math.round(o * 10) / 10;
        let exact = 0, within1 = 0, worst = 0;
        for (let d = 0; d < days.length; d++) {
          const v = rnd(raw[d], mode, off);
          const diff = Math.abs(v - printed[d]);
          if (diff === 0) exact++;
          if (diff <= 1) within1++;
          if (diff > worst) worst = diff;
        }
        const cand = { angle: Math.round(angle * 1000) / 1000, offset: off, mode, exact, within1, worst, n: days.length };
        if (!best || better(cand, best)) best = cand;
      }
    }
  }
  return best;
}

export function better(a, b) {
  if (a.exact !== b.exact) return a.exact > b.exact;
  if (a.within1 !== b.within1) return a.within1 > b.within1;
  if (a.worst !== b.worst) return a.worst < b.worst;
  return Math.abs(a.offset) < Math.abs(b.offset);
}

// Score a fixed rule: seconds model + rounding mode + margin, against printed.
export function score(days, printed, secondsOf, mode, offset = 0, circular = false) {
  let exact = 0, within1 = 0, worst = 0, sumAbs = 0, nulls = 0;
  const diffs = [];
  for (let d = 0; d < days.length; d++) {
    const s = secondsOf(d);
    if (s === null) { nulls++; continue; }
    const v = rnd(s, mode, offset);
    const diff = circular ? (((v - printed[d]) % 1440) + 2160) % 1440 - 720 : v - printed[d];
    diffs.push(diff);
    if (diff === 0) exact++;
    if (Math.abs(diff) <= 1) within1++;
    if (Math.abs(diff) > worst) worst = Math.abs(diff);
    sumAbs += Math.abs(diff);
  }
  const k = diffs.length;
  const mean = k ? diffs.reduce((a, b) => a + b, 0) / k : NaN;
  return { n: days.length, scored: k, nulls, exact, within1, worst, mean: round2(mean), mae: round2(k ? sumAbs / k : NaN),
           pctExact: k ? round2(100 * exact / k) : 0, pctWithin1: k ? round2(100 * within1 / k) : 0 };
}

export const round2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : v);

export function line(name, s) {
  return `${name.padEnd(12)} n=${String(s.n).padStart(4)} exact=${String(s.exact).padStart(4)} (${String(s.pctExact).padStart(5)}%) within1=${String(s.within1).padStart(4)} (${String(s.pctWithin1).padStart(5)}%) worst=${String(s.worst).padStart(3)} mean=${s.mean} mae=${s.mae}${s.nulls ? ' nulls=' + s.nulls : ''}`;
}

export const dates = (y, m) => {
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
};

export const yearDates = (y) => Array.from({ length: 12 }, (_, i) => dates(y, i + 1)).flat();
