// Shared fit library. Adhan 4.4.6 astronomy, no real clock anywhere:
// every Date is built from a table row's civil date.
import * as adhan from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';
import SolarTimeDefault from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/SolarTime.js';
import SolarCoordinatesDefault from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/SolarCoordinates.js';
import TimeComponentsDefault from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/TimeComponents.js';
import AstronomicalDefault from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Astronomical.js';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname } from 'path';

export const OUT = '$HOME/athan-gitree/census/o1k-wide/fit13';
mkdirSync(OUT, { recursive: true });

export const { Coordinates, Madhab } = adhan;
export const SolarTime = SolarTimeDefault;
export const SolarCoordinates = SolarCoordinatesDefault;
export const TimeComponents = TimeComponentsDefault;
export const Astronomical = AstronomicalDefault;

// ---- local wall clock in a named zone, second resolution ----
const fmtCache = new Map();
function formatter(zone, withSeconds) {
  const key = zone + (withSeconds ? 's' : 'm');
  if (!fmtCache.has(key)) {
    fmtCache.set(key, new Intl.DateTimeFormat('en-GB', {
      timeZone: zone, hourCycle: 'h23',
      hour: '2-digit', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}),
    }));
  }
  return fmtCache.get(key);
}

export function localSeconds(dateUTCms, zone) {
  const parts = formatter(zone, true).formatToParts(new Date(dateUTCms));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return get('hour') * 3600 + get('minute') * 60 + get('second');
}

// seconds -> {s: full seconds, m: floor minutes, str: "HH:MM"}
export const asClock = (sec) => ({
  s: sec,
  m: Math.floor(sec / 60),
  str: `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}`,
});

export const parseHM = (str) => {
  const [h, m] = str.split(':').map(Number);
  return h * 3600 + m * 60;
};

// ---- raw astronomical times for one civil date ----
// dateStr "YYYY-MM-DD" interpreted with UTC components (adhan convention).
export function rawTimes(dateStr, lat, lon) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const st = new SolarTime(base, new Coordinates(lat, lon));
  const t = (hoursVal) => new TimeComponents(hoursVal).utcDate(y, m - 1, d).getTime();
  const transit = t(st.transit);
  return {
    transit,
    sunrise: t(st.sunrise),
    sunset: t(st.sunset),
    fajrAt: (angle) => t(st.hourAngle(-angle, false)),
    duskAt: (angle) => t(st.hourAngle(-angle, true)),
    asrAt: (shadow) => t(st.afternoon(shadow)),
    solar: st.solar,
  };
}

// ---- explicit rounding of a raw instant (+offset) to a printed clock ----
export const roundMin = (ms, mode) => {
  const sec = ms / 1000;
  const base = Math.floor(sec / 60) * 60;
  if (mode === 'floor') return base;
  if (mode === 'ceil') return sec % 60 === 0 ? base : base + 60;
  return (sec % 60) >= 30 ? base + 60 : base; // nearest
};
export const roundTo5 = (ms, mode = 'nearest') => {
  const sec = ms / 1000;
  const q = sec / 300;
  const k = mode === 'floor' ? Math.floor(q) : mode === 'ceil' ? Math.ceil(q) : Math.round(q);
  return k * 300;
};

// predict one prayer: raw + offsetSec, then rounding
export function predict(dateStr, lat, lon, prayer, { angle, shadow, offsetSec = 0, zone, round = 'nearest', grid = 1 }) {
  const r = rawTimes(dateStr, lat, lon);
  let ms;
  switch (prayer) {
    case 'fajr': ms = r.fajrAt(angle); break;
    case 'isha': ms = r.duskAt(angle); break;
    case 'sunrise': ms = r.sunrise; break;
    case 'maghrib': ms = r.sunset; break;
    case 'dhuhr': ms = r.transit; break;
    case 'asr': ms = r.asrAt(shadow); break;
    default: throw new Error('prayer ' + prayer);
  }
  const shifted = ms + offsetSec * 1000;
  const sec = grid === 5 ? roundTo5(shifted, round) : roundMin(shifted, round);
  return localSeconds(sec * 1000, zone);
}

// ---- implied depression angle for a printed fajr/isha clock ----
export function impliedAngle(dateStr, lat, lon, which, targetSec, zone) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const r = rawTimes(dateStr, lat, lon);
  const transitSec = localSeconds(r.transit, zone);
  const Hdeg = ((targetSec - transitSec) / 3600) * 15; // target evening → positive
  const hLocal = which === 'isha' ? Hdeg : -Hdeg;
  const φ = lat * Math.PI / 180, δ = r.solar.declination * Math.PI / 180;
  const sinAlt = Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(hLocal * Math.PI / 180);
  const alt = Math.asin(sinAlt) * 180 / Math.PI;
  return -alt;
}

// ---- residual statistics over rows ----
export function stats(diffsMin) {
  const sorted = [...diffsMin].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const modeOfRounded = (() => {
    const c = new Map();
    for (const v of sorted) c.set(v, (c.get(v) || 0) + 1);
    let best = null, bc = -1;
    for (const [v, ct] of c) if (ct > bc || (ct === bc && Math.abs(v - mean) < Math.abs(best - mean))) { best = v; bc = ct; }
    return { value: best, count: bc };
  })();
  const sd = Math.sqrt(sorted.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
  return { n, min: sorted[0], max: sorted[n - 1], mean: +mean.toFixed(3), median, mode: modeOfRounded, sd: +sd.toFixed(3) };
}

// diffs in fractional minutes between printed minute and raw instant + offset
export function residuals(rows, lat, lon, zone, prayer, { angle, shadow, offsetMin = 0 }) {
  const out = [];
  for (const row of rows) {
    const r = rawTimes(row.date, lat, lon);
    let ms;
    if (prayer === 'fajr') ms = r.fajrAt(angle);
    else if (prayer === 'isha') ms = r.duskAt(angle);
    else if (prayer === 'sunrise') ms = r.sunrise;
    else if (prayer === 'maghrib') ms = r.sunset;
    else if (prayer === 'dhuhr') ms = r.transit;
    else if (prayer === 'asr') ms = r.asrAt(shadow);
    const printed = row.times[prayer === 'maghrib' ? (row.times.magrib !== undefined ? 'magrib' : 'maghrib') : prayer];
    if (printed === undefined || printed === null) continue;
    const printedSec = parseHM(printed);
    const rawSec = localSeconds(ms, zone);
    out.push((printedSec - rawSec) / 60 - offsetMin);
  }
  return out;
}

// exact-fit scorer: predicted minute string vs printed
export function score(rows, lat, lon, zone, recipes) {
  // recipes: { prayer: {angle|shadow, offsetMin, grid, round} }
  const per = {};
  for (const [prayer, cfg] of Object.entries(recipes)) {
    let total = 0, exact = 0, within1 = 0, worst = 0, worstRow = null;
    for (const row of rows) {
      const key = prayer === 'maghrib' && row.times.magrib !== undefined ? 'magrib' : prayer;
      const printed = row.times[key];
      if (printed === undefined || printed === null) continue;
      total++;
      const p = predict(row.date, lat, lon, prayer, {
        angle: cfg.angle, shadow: cfg.shadow, offsetSec: (cfg.offsetMin || 0) * 60, zone, round: cfg.round || 'nearest', grid: cfg.grid || 1,
      });
      const printedMin = Math.floor(parseHM(printed) / 60);
      const predMin = Math.floor(p / 60);
      const diff = Math.abs(predMin - printedMin);
      if (diff === 0) exact++;
      if (diff <= 1) within1++;
      if (diff > worst) { worst = diff; worstRow = row.date; }
    }
    per[prayer] = { total, exact, within1, worst, worstRow };
  }
  return per;
}

export function loadTable(file) {
  const j = JSON.parse(readFileSync(file, 'utf8'));
  const out = [];
  const src = j.rows || j;
  for (const [date, times] of Object.entries(src)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    out.push({ date, times });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

export function writeJSON(name, obj) {
  const p = `${OUT}/${name}`;
  writeFileSync(p, JSON.stringify(obj, null, 1) + '\n');
  console.log('WROTE', p);
}

export const DATA = '$HOME/athan-gitree/census/o1k-wide/oceania2/data';
export const amplitudes = (rows, zone, keys) => {
  // seasonal amplitude: earliest vs latest clock in Jan vs Jul per prayer key
  const pick = (mon) => {
    const sel = rows.filter((r) => Number(r.date.slice(5, 7)) === mon);
    const acc = {};
    for (const k of keys) {
      const vals = sel.map((r) => r.times[k]).filter(Boolean).map(parseHM);
      if (!vals.length) continue;
      acc[k] = { min: Math.min(...vals) / 60, max: Math.max(...vals) / 60, spanMin: (Math.max(...vals) - Math.min(...vals)) };
    }
    return acc;
  };
  return { jan: pick(1), jul: pick(7) };
};
