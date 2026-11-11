// Shared fit machinery. Census discipline: adhan 4.4.6, second resolution
// (Rounding.None semantics) then explicit per-prayer rounding, no clock reads.
import { pathToFileURL } from 'node:url';

const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';

export async function loadAdhan() {
  const mod = await import(pathToFileURL(ADHAN + 'Adhan.js'));
  const { default: SolarTime } = await import(pathToFileURL(ADHAN + 'SolarTime.js'));
  const { default: TimeComponents } = await import(pathToFileURL(ADHAN + 'TimeComponents.js'));
  return { ...mod, SolarTime, TimeComponents };
}

// Explicit minute rounding of a second-resolution Date, mirroring adhan's
// roundedMinute modes: floor keeps, ceil bumps at s>0, nearest bumps at s>=30.
export function p2m(date, mode) {
  const s = date.getSeconds();
  const base = date.getHours() * 60 + date.getMinutes();
  const bump = mode === 'floor' ? 0 : mode === 'ceil' ? (s > 0 ? 1 : 0) : (s >= 30 ? 1 : 0);
  return base + bump;
}

// "H:MM"/"HH:MM" -> minutes-of-day; pm=true maps a 12-hour printed column to
// the afternoon (chart values below 12).
export function parseHHMM(str, pm = false) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(str.trim());
  if (!m) throw new Error('bad time ' + str);
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (pm && h < 12) h += 12;
  return h * 60 + min;
}

export function fmtMin(v) {
  const h = Math.floor(v / 60), m = v % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

// Margins on a 0.5-minute grid: m(j) = j/2 - 10, j in 0..40 (-10..+10).
export const MJ = 41;
export const marginOf = (j) => j / 2 - 10;

// Best (margin, rounding mode) for one prayer against a printed column.
// Sweep: per day per mode the qualifying margin indices form <= 3 contiguous
// slots, so exact counts accumulate in O(days); candidates get full stats.
export function bestMargin(secOfDay, chartMin, opts = {}) {
  const { jMin = 0, jMax = MJ - 1, m0 = -10, step = 0.5, modes = ['floor', 'ceil', 'nearest'] } = opts;
  const n = secOfDay.length;
  const marginAt = (j) => m0 + (j - jMin) * step;
  const results = [];
  for (const mode of modes) {
    const counts = new Float64Array(jMax - jMin + 1);
    for (let d = 0; d < n; d++) {
      const base = secOfDay[d] / 60;
      const lo = chartMin[d] - base;
      let jLo, jHi;
      if (mode === 'ceil') { // v in ((C-1)*60, C*60] -> m in (lo, hi]
        jLo = Math.floor((lo - m0) / step) + 1;
        jHi = Math.floor((lo + 1 - m0) / step);
      } else { // floor and nearest: half-open [lo, lo+w)
        const w = mode === 'floor' ? 1 : 0.5;
        jLo = Math.ceil((lo - m0) / step);
        jHi = Math.ceil((lo + w - m0) / step) - 1;
      }
      for (let j = Math.max(jLo, jMin); j <= Math.min(jHi, jMax); j++) counts[j - jMin]++;
    }
    let max = 0;
    for (let k = 0; k < counts.length; k++) if (counts[k] > max) max = counts[k];
    for (let k = 0; k < counts.length; k++) {
      if (counts[k] >= max - 1) results.push(evalFixed(secOfDay, chartMin, marginAt(k + jMin), mode));
    }
  }
  results.sort((a, b) => b.exact - a.exact || b.within1 - a.within1 || a.worst - b.worst);
  return results[0];
}

// Exact stats for a fixed (margin, mode).
export function evalFixed(secOfDay, chartMin, margin, mode) {
  const n = secOfDay.length;
  let exact = 0, within1 = 0, worst = 0;
  for (let d = 0; d < n; d++) {
    const mins = secOfDay[d] / 60 + margin;
    let v;
    if (mode === 'floor') v = Math.floor(mins);
    else if (mode === 'ceil') v = Math.ceil(mins);
    else v = Math.round(mins);
    const diff = Math.abs(v - chartMin[d]);
    if (diff === 0) exact++;
    if (diff <= 1) within1++;
    if (diff > worst) worst = diff;
  }
  return { margin, mode, exact, within1, worst };
}

export function scoreLine(name, r) {
  return `${name.padEnd(22)} exact ${String(r.exact).padStart(3)}  within1 ${String(r.within1).padStart(3)}  worst ${String(r.worst).padStart(3)}  (margin ${r.margin >= 0 ? '+' + r.margin : r.margin} ${r.mode})`;
}
