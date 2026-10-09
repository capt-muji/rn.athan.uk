// R14 shared helpers. Measured with adhan@4.4.6, Rounding.None so the residual is sub-minute.
import * as adhan from 'adhan';

export const { CalculationMethod, Coordinates, PrayerTimes, HighLatitudeRule, Rounding, Madhab } = adhan;

export const R_EARTH_KM = 6371.0088;
export const KM_PER_DEG_LAT = (Math.PI * R_EARTH_KM) / 180; // 111.1949...

export function kmToDegLat(km) {
  return km / KM_PER_DEG_LAT;
}

export function kmToDegLon(km, latDeg) {
  const c = Math.cos((latDeg * Math.PI) / 180);
  if (Math.abs(c) < 1e-9) return 0;
  return km / (KM_PER_DEG_LAT * c);
}

// A parameter set that has a solution at every latitude sampled, so the sensitivity of
// Fajr and Isha is measurable rather than null. MWL angles with the SeventhOfTheNight
// high-latitude rule, which is R3's recommended default.
export function params() {
  const p = CalculationMethod.MuslimWorldLeague();
  p.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  p.rounding = Rounding.None;
  p.madhab = Madhab.Shafi;
  return p;
}

export const KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export function times(lat, lon, date, p = params()) {
  const t = new PrayerTimes(new Coordinates(lat, lon), date, p);
  const out = {};
  for (const k of KEYS) {
    const d = t[k];
    out[k] = d instanceof Date && !Number.isNaN(d.getTime()) ? d.getTime() : null;
  }
  return out;
}

// Signed minute delta per prayer between two positions on the same civil date.
export function deltaMinutes(a, b) {
  const out = {};
  for (const k of KEYS) {
    out[k] = a[k] === null || b[k] === null ? null : (b[k] - a[k]) / 60000;
  }
  return out;
}

export function fmt(n, dp = 2) {
  if (n === null || n === undefined) return 'null';
  return n.toFixed(dp);
}

export function pad(s, w) {
  s = String(s);
  return s.length >= w ? s : s + ' '.repeat(w - s.length);
}

export function padl(s, w) {
  s = String(s);
  return s.length >= w ? s : ' '.repeat(w - s.length) + s;
}

export function table(headers, rows) {
  const all = [headers, ...rows];
  const w = headers.map((_, i) => Math.max(...all.map((r) => String(r[i] ?? '').length)));
  const line = (r) => '| ' + r.map((c, i) => pad(c ?? '', w[i])).join(' | ') + ' |';
  const sep = '| ' + w.map((n) => '-'.repeat(n)).join(' | ') + ' |';
  return [line(headers), sep, ...rows.map(line)].join('\n');
}

export const DATES = [
  ['2026-03-20', new Date(Date.UTC(2026, 2, 20, 12))],
  ['2026-06-21', new Date(Date.UTC(2026, 5, 21, 12))],
  ['2026-09-22', new Date(Date.UTC(2026, 8, 22, 12))],
  ['2026-12-21', new Date(Date.UTC(2026, 11, 21, 12))],
];

export const CITIES = [
  ['Singapore', 1.3521, 103.8198],
  ['Jakarta', -6.2088, 106.8456],
  ['Lagos', 6.5244, 3.3792],
  ['Dhaka', 23.8103, 90.4125],
  ['Makkah', 21.4225, 39.8262],
  ['Karachi', 24.8607, 67.0011],
  ['Cairo', 30.0444, 31.2357],
  ['Casablanca', 33.5731, -7.5898],
  ['Istanbul', 41.0082, 28.9784],
  ['Toronto', 43.6532, -79.3832],
  ['London', 51.5074, -0.1278],
  ['Berlin', 52.52, 13.405],
  ['Oslo', 59.9139, 10.7522],
  ['Tromso', 69.6492, 18.9553],
];

export const LAT_BAND = [0, 10, 20, 30, 40, 45, 50, 55, 60, 65];
export const DIST_KM = [1, 10, 50, 100, 500];
