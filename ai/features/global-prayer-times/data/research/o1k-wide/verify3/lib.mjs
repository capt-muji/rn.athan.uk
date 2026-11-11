// verify3 independent harness. adhan 4.4.6, seconds then explicit rounding.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ADHAN = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/Adhan.js';
const adhan = require(ADHAN);

export const { Coordinates, CalculationParameters, PrayerTimes, Madhab, Rounding, HighLatitudeRule } = adhan;

export function params({ fajr = 18, isha = 18, ishaInterval = 0, madhab = 'shafi', highLat = 'middleofthenight', maghribAngle = 0 } = {}) {
  const p = new CalculationParameters(null, fajr, isha, ishaInterval, maghribAngle);
  p.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule[highLat === 'seventh' ? 'SeventhOfTheNight' : highLat === 'twilightangle' ? 'TwilightAngle' : 'MiddleOfTheNight'];
  return p;
}

// wall-clock minutes (float, seconds retained) in `tz` for every prayer.
// The date is built at 12:00 UTC and the process runs TZ=UTC, so adhan's date components are the
// intended calendar date for every zone; the instants are then rendered in the target zone.
const fmtCache = new Map();
function zoneFmt(tz) {
  if (!fmtCache.has(tz)) fmtCache.set(tz, new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }));
  return fmtCache.get(tz);
}
function zoneMinutes(instant, tz) {
  const parts = Object.fromEntries(zoneFmt(tz).formatToParts(instant).map((p) => [p.type, p.value]));
  return Number(parts.hour) % 24 * 60 + Number(parts.minute) + Number(parts.second) / 60;
}

export function times(lat, lng, iso, p, tz = 'UTC') {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  const pt = new PrayerTimes(new Coordinates(lat, lng), date, p);
  const out = {};
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'sunset', 'maghrib', 'isha']) {
    const v = pt[k];
    if (!v || Number.isNaN(v.getTime())) { out[k] = null; continue; }
    out[k] = zoneMinutes(v, tz);
  }
  return out;
}

// parse "5:43" or "13:00", "05:43" -> minutes since midnight
export function hm(s) {
  if (s == null) return null;
  if (typeof s !== 'string') return null;
  const t = s.trim();
  if (!/^\d{1,2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export const MODES = {
  none: (x) => x,
  floor: (x) => Math.floor(x),
  ceil: (x) => Math.ceil(x),
  nearest: (x) => Math.round(x),
  round: (x) => Math.round(x),
};

// score: printed minutes vs computed minutes + margin, then mode
export function score(rows, compute, mode, margin = 0) {
  let n = 0, exact = 0, w1 = 0, worst = 0, sum = 0, sumAbs = 0, maxAbs = 0;
  const misses = [];
  for (const r of rows) {
    const printed = r.printed;
    if (printed == null) continue;
    const c = compute(r);
    if (c == null || Number.isNaN(c)) continue;
    const v = MODES[mode](c + margin);
    const diff = v - printed;
    n++;
    if (diff === 0) exact++;
    if (Math.abs(diff) <= 1) w1++; else misses.push({ iso: r.iso, printed, predicted: v, diff });
    if (Math.abs(diff) > worst) worst = Math.abs(diff);
    sum += diff; sumAbs += Math.abs(diff); maxAbs = Math.max(maxAbs, Math.abs(diff));
  }
  return { n, exact, w1, worst, mean: n ? sum / n : 0, mae: n ? sumAbs / n : 0, maxAbs, misses };
}

export function median(xs) {
  const a = [...xs].sort((x, y) => x - y);
  const n = a.length;
  if (!n) return null;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
}
export function pct(x, d = 1) { return Number((100 * x).toFixed(d)); }

export function isoAddDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
