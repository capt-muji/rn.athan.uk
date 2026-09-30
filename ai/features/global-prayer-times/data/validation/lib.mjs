// R7 shared helpers. Loaded by every other script in this directory.
//
// Two jobs:
//
//   1. INVERT a published prayer time back to the solar depression angle the
//      publisher must have used. This is how an authority's own timetable is
//      turned into a number comparable with a library constant. The solar
//      position comes from `astronomy-engine@2.1.19`, which R3 measured against
//      Skyfield driven by JPL DE440s at 0.45 arcsec mean, so the inversion is
//      limited by the publisher's own one-minute rounding, not by the model.
//
//   2. Drive `adhan@4.4.6` with every preset, rule and resolution, always in
//      UTC epoch minutes, because adhan reads the calendar date off the Date's
//      LOCAL getters (`PrayerTimes.ts` L52-56). Every script here must run with
//      TZ=UTC.
//
// Nothing in this file is installed into the repository. Packages live in
// /Users/muji/athan-global-scratch/harness/node_modules.

import * as Astronomy from 'astronomy-engine';
import * as adhan from 'adhan';

export { adhan, Astronomy };

export const CITIES = JSON.parse(
  // kept inline so the script has no read dependency on a sibling file
  `[
  {"name":"London","lat":51.5074,"lon":-0.1278,"tz":"Europe/London"},
  {"name":"Berlin","lat":52.5200,"lon":13.4050,"tz":"Europe/Berlin"},
  {"name":"Manchester","lat":53.4808,"lon":-2.2426,"tz":"Europe/London"},
  {"name":"Copenhagen","lat":55.6761,"lon":12.5683,"tz":"Europe/Copenhagen"},
  {"name":"Stockholm","lat":59.3293,"lon":18.0686,"tz":"Europe/Stockholm"},
  {"name":"Oslo","lat":59.9139,"lon":10.7522,"tz":"Europe/Oslo"},
  {"name":"Helsinki","lat":60.1699,"lon":24.9384,"tz":"Europe/Helsinki"},
  {"name":"Anchorage","lat":61.2181,"lon":-149.9003,"tz":"America/Anchorage"},
  {"name":"Reykjavik","lat":64.1466,"lon":-21.9426,"tz":"Atlantic/Reykjavik"},
  {"name":"Tromso","lat":69.6492,"lon":18.9553,"tz":"Europe/Oslo"},
  {"name":"Ushuaia","lat":-54.8019,"lon":-68.3030,"tz":"America/Argentina/Ushuaia"}
]`,
);

// ------------------------------------------------------------------ inversion

/**
 * Solar depression below the horizon, in degrees, at an absolute instant.
 * Positive means the sun is below the horizon.
 *
 * GEOMETRIC, not apparent. `Horizon(..., 'normal')` adds atmospheric
 * refraction, and using it here costs an inverted angle a flat 0.52 degrees:
 * the first run of this script recovered Egypt's Fajr at 18.99 against the
 * authority's known 19.5, which reads exactly like a half-degree preset error
 * and is nothing but the refraction term. Every prayer-time angle in the
 * literature is a geometric solar depression, and `SearchAltitude` (used by
 * `timeAtDepression` below) is geometric too, so both halves of this file must
 * be. `astronomy-engine` spells "no refraction" as a falsy option
 * (`astronomy.js` L6479 throws on anything else), so the argument is omitted.
 */
export function depressionAt(date, lat, lon) {
  const obs = new Astronomy.Observer(lat, lon, 0);
  const eq = Astronomy.Equator(Astronomy.Body.Sun, date, obs, true, true);
  const hor = Astronomy.Horizon(date, obs, eq.ra, eq.dec);
  return -hor.altitude;
}

/** Solar transit (local apparent noon) for a UTC calendar day. */
export function transit(y, m, d, lat, lon) {
  const obs = new Astronomy.Observer(lat, lon, 0);
  const start = Astronomy.MakeTime(new Date(Date.UTC(y, m - 1, d)));
  const ev = Astronomy.SearchHourAngle(Astronomy.Body.Sun, obs, 0, start, 1);
  return ev ? ev.time.date : null;
}

/**
 * Solve for the instant at which the sun reaches a given depression, on the
 * SAME solar day as this UTC date's transit. `which` is `'morning'` (the sun
 * ASCENDING through the angle, which is Fajr) or `'evening'` (descending,
 * which is Isha). Returns null when no solution exists, which is the whole
 * point: at high latitude the answer is genuinely absent and must not be faked.
 *
 * Two traps are closed here, both of which produced a wrong table first.
 *
 * `astronomy-engine`'s `SearchAltitude` direction is +1 for an ASCENDING
 * crossing, so the morning twilight takes +1 and the evening takes -1. Passing
 * the intuitive -1 for "before noon" finds nothing at all.
 *
 * The search is anchored on solar transit, not on 00:00 UTC. Anchoring on
 * 00:00 UTC is the same day-pairing trap R3 documented against the USNO in a
 * different costume: west of about 90 degrees longitude the first crossing
 * after 00:00 UTC belongs to the previous local day, and at Calgary that
 * turned a -13 minute Canada delta into +19.
 */
export function timeAtDepression(y, m, d, lat, lon, depressionDeg, which) {
  const obs = new Astronomy.Observer(lat, lon, 0);
  const noon = transit(y, m, d, lat, lon);
  if (!noon) return null;
  const morning = which === 'morning';
  const from = morning
    ? new Date(noon.getTime() - 12 * 3600000)
    : new Date(noon.getTime());
  const ev = Astronomy.SearchAltitude(
    Astronomy.Body.Sun,
    obs,
    morning ? +1 : -1,
    Astronomy.MakeTime(from),
    0.5,
    -depressionDeg,
  );
  if (!ev) return null;
  // Reject a crossing that belongs to the neighbouring solar day.
  const off = (ev.date.getTime() - noon.getTime()) / 3600000;
  if (morning && (off > 0 || off < -12)) return null;
  if (!morning && (off < 0 || off > 12)) return null;
  return ev.date;
}

/**
 * Sunrise and sunset for the SOLAR day whose transit falls in this UTC date,
 * or null when the sun does not cross. Anchored on transit, not 00:00 UTC, for
 * the reason given on `timeAtDepression`: at Anchorage (longitude -149.9) every
 * sunset falls after 00:00 UTC, so a 00:00-anchored search returns the
 * PREVIOUS solar day's sunset and every night length computed from it is 24
 * hours out. The first run of `highlat.mjs` with the naive anchor reported
 * Anchorage Isha deltas of 1,402 minutes, which is that bug and not a rule.
 */
export function riseSet(y, m, d, lat, lon) {
  const obs = new Astronomy.Observer(lat, lon, 0);
  const noon = transit(y, m, d, lat, lon);
  if (!noon) return { rise: null, set: null };
  const before = Astronomy.MakeTime(new Date(noon.getTime() - 12 * 3600000));
  const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, +1, before, 0.5);
  const set = Astronomy.SearchRiseSet(
    Astronomy.Body.Sun,
    obs,
    -1,
    Astronomy.MakeTime(noon),
    0.5,
  );
  return {
    rise: rise && rise.date <= noon ? rise.date : null,
    set: set && set.date >= noon ? set.date : null,
  };
}

// ------------------------------------------------------------------- adhan

/** Every named preset, keyed by the exact `CalculationMethod` member name. */
export const PRESETS = [
  'MuslimWorldLeague',
  'Egyptian',
  'Karachi',
  'UmmAlQura',
  'Dubai',
  'MoonsightingCommittee',
  'NorthAmerica',
  'Kuwait',
  'Qatar',
  'Singapore',
  'Tehran',
  'Turkey',
  'Other',
];

/**
 * Run adhan for one UTC calendar day. `opts` may carry `fajrAngle`,
 * `ishaAngle`, `highLatitudeRule`, `polarCircleResolution`, `madhab`,
 * `rounding` and `zeroAdjustments`.
 */
export function adhanDay(preset, lat, lon, y, m, d, opts = {}) {
  const p = adhan.CalculationMethod[preset]();
  if (opts.zeroAdjustments) {
    p.methodAdjustments = {
      fajr: 0,
      sunrise: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    };
  }
  if (opts.fajrAngle !== undefined) p.fajrAngle = opts.fajrAngle;
  if (opts.ishaAngle !== undefined) p.ishaAngle = opts.ishaAngle;
  if (opts.ishaInterval !== undefined) p.ishaInterval = opts.ishaInterval;
  if (opts.highLatitudeRule) p.highLatitudeRule = opts.highLatitudeRule;
  if (opts.polarCircleResolution)
    p.polarCircleResolution = opts.polarCircleResolution;
  if (opts.madhab) p.madhab = opts.madhab;
  if (opts.rounding) p.rounding = opts.rounding;
  const t = new adhan.PrayerTimes(
    new adhan.Coordinates(lat, lon),
    new Date(Date.UTC(y, m - 1, d)),
    p,
  );
  return t;
}

/** Absolute epoch minutes, ROUNDED not floored, or null for an Invalid Date. */
export function mins(date) {
  if (!date || Number.isNaN(date.getTime())) return null;
  return Math.round(date.getTime() / 60000);
}

/** Every day of a year as [y, m, d]. */
export function yearDays(year) {
  const out = [];
  const cur = new Date(Date.UTC(year, 0, 1));
  while (cur.getUTCFullYear() === year) {
    out.push([cur.getUTCFullYear(), cur.getUTCMonth() + 1, cur.getUTCDate()]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

// ------------------------------------------------------------------ reporting

export function stats(arr) {
  const v = arr.filter((x) => x !== null && Number.isFinite(x));
  if (!v.length) return null;
  const sorted = [...v].sort((a, b) => a - b);
  const sum = v.reduce((a, b) => a + b, 0);
  return {
    n: v.length,
    mean: sum / v.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    absMax: Math.max(...v.map(Math.abs)),
  };
}

export function fmt(n, dp = 2) {
  return n === null || n === undefined || !Number.isFinite(n)
    ? 'n/a'
    : n.toFixed(dp);
}

/** Days equal / |d|=1 / |d|>=2, the cell shape R3 used, kept for continuity. */
export function buckets(arr) {
  const v = arr.filter((x) => x !== null && Number.isFinite(x));
  const eq = v.filter((d) => d === 0).length;
  const one = v.filter((d) => Math.abs(d) === 1).length;
  const two = v.filter((d) => Math.abs(d) >= 2).length;
  return `${eq}/${one}/${two}`;
}
