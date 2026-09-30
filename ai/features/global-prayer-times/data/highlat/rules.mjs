// R11 Part 2: every high-latitude rule in the catalogue, implemented on ONE astronomy engine.
//
// The engine is R5's solar-harness.mjs, which `validate-harness.mjs` reproduces against the
// Egyptian General Authority of Survey's own published Cairo row on all six times to the
// minute. Putting every rule on one engine is the whole point: R7 measured the between-rule
// spread at one library, and this file removes the last shared-engine caveat by implementing
// the rules no library ships (Sweden's, Norway's, Belgium's, Diyanet's, Wifaqul Ulama's
// 3-day average) on the same solver as the rules libraries do ship.
//
// Every rule takes the SAME inputs and returns { fajr, isha } in local clock hours, or null
// where the rule genuinely has no answer. A rule must never invent a value; returning null is
// how the app's never-invent rule is respected downstream.
import { timeAtAngle, midDay, sin, cos } from '../countries/solar-harness.mjs';

const jul = (y, m, d) => { if (m <= 2) { y -= 1; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; };
export const declAt = (y, m, d, tz, t) => {
  const dd = jul(y, m, d) + (t - tz) / 24 - 2451545.0;
  const g = ((357.529 + 0.98560028 * dd) % 360 + 360) % 360;
  const q = ((280.459 + 0.98564736 * dd) % 360 + 360) % 360;
  const L = ((q + 1.915 * sin(g) + 0.020 * sin(2 * g)) % 360 + 360) % 360;
  const e = 23.439 - 0.00000036 * dd;
  return Math.asin(sin(e) * sin(L)) * 180 / Math.PI;
};

// Half-day length in hours at a given depression. Direct from the noon declination, so the
// polar boundary is a clean 'day' / 'night' answer rather than a null from a failed iteration.
export function halfDay(lat, lng, tz, y, m, d, ang) {
  const noon = midDay(y, m, d, lng, tz);
  let half = null;
  for (let i = 0; i < 3; i++) {
    const decl = declAt(y, m, d, tz, noon + (half ?? 6));
    const c = (sin(-ang) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
    if (c <= -1) return { half: null, polar: 'day' };
    if (c >= 1) return { half: null, polar: 'night' };
    half = Math.acos(c) * 180 / Math.PI / 15;
  }
  return { half, polar: null };
}

export const SUNRISE_ANG = 0.833;

// The solar frame every rule shares: sunrise, sunset, the night length, and the raw angle
// solutions. night is null when there is no sunrise or no sunset, which is what makes every
// portion rule undefined inside the polar circle.
export function frame(lat, lng, tz, y, m, d, fajrAngle, ishaAngle) {
  const noon = midDay(y, m, d, lng, tz);
  const hs = halfDay(lat, lng, tz, y, m, d, SUNRISE_ANG);
  const hF = halfDay(lat, lng, tz, y, m, d, fajrAngle);
  const hI = halfDay(lat, lng, tz, y, m, d, ishaAngle);
  const sunrise = hs.half === null ? null : noon - hs.half;
  const sunset = hs.half === null ? null : noon + hs.half;
  return {
    noon, sunrise, sunset, polar: hs.polar,
    night: hs.half === null ? null : 24 - 2 * hs.half,
    angFajr: hF.half === null ? null : noon - hF.half,
    angIsha: hI.half === null ? null : noon + hI.half,
    fajrAngle, ishaAngle,
  };
}

// --- the portion family -------------------------------------------------------------------
// A portion rule is a FLOOR on Fajr and a CEILING on Isha, per praytimes.org and adhan.
const portion = (p, q) => f => {
  if (f.night === null) return { fajr: null, isha: null };
  const floor = f.sunrise - p * f.night, ceil = f.sunset + q * f.night;
  return {
    fajr: f.angFajr === null ? floor : Math.max(f.angFajr, floor),
    isha: f.angIsha === null ? ceil : Math.min(f.angIsha, ceil),
  };
};

export const RULES = {
  // The baseline: the angle alone, no rule. Nulls where it has no solution.
  AngleOnly: { family: 'none', fn: f => ({ fajr: f.angFajr, isha: f.angIsha }) },

  // praytimes.org "Middle of the Night"; adhan `HighLatitudeRule.MiddleOfTheNight`;
  // Wifaqul Ulama's Nisful-Layl. Numerically one rule, three names.
  MiddleOfTheNight: { family: 'portion', fn: portion(0.5, 0.5) },

  // praytimes.org "One-Seventh of the Night"; adhan `SeventhOfTheNight`; Moonsighting's
  // Sab'u Lail; ITL options 6 and 7.
  SeventhOfTheNight: { family: 'portion', fn: portion(1 / 7, 1 / 7) },

  // praytimes.org "Angle-Based"; adhan `TwilightAngle`; ITL option 15.
  TwilightAngle: { family: 'portion', fn: f => portion(f.fajrAngle / 60, f.ishaAngle / 60)(f) },

  // Sweden, Islamiska Forbundet i Sverige. Measured in R9 at Stockholm and Malmo and
  // identified in R11 Part 3 as a portion of the night with a DAY LENGTH CLAMP.
  SwedenFrozenFraction: { family: 'portion', fn: portion(0.2055, 0.1815) },
  SwedenIFiS: {
    family: 'clamp',
    fn: (f, ctx) => {
      const rawDay = f.night === null ? (f.polar === 'day' ? 24 : 0) : 24 - f.night;
      const day = Math.min(19, Math.max(5, rawDay));
      const sr = f.noon - day / 2, ss = f.noon + day / 2, night = 24 - day;
      const floor = sr - 0.2055 * night, ceil = ss + 0.1815 * night;
      return {
        fajr: f.angFajr === null ? floor : Math.max(f.angFajr, floor),
        isha: f.angIsha === null ? ceil : Math.min(f.angIsha, ceil),
        shuruk: sr, magrib: ss,
      };
    },
  },

  // --- the fixed-interval family ---------------------------------------------------------
  // Turkey, Diyanet Din Isleri Yuksek Kurulu, 2009-08-28, read in Turkish on ditib.de.
  // Above 45 degrees: Isha is Maghrib + 1h20m, but never later than one third of the
  // shar'i night. Its mirrored Imsak rule: take the Maghrib-to-Isha interval, add 10
  // minutes, and subtract that from sunrise.
  Diyanet: {
    family: 'interval',
    fn: f => {
      if (f.sunset === null || f.sunrise === null) return { fajr: null, isha: null };
      const shariNight = f.night;
      const thirdCap = f.sunset + shariNight / 3;
      const isha = Math.min(f.sunset + 80 / 60, thirdCap);
      const fajr = f.sunrise - ((isha - f.sunset) + 10 / 60);
      return { fajr, isha };
    },
  },

  // Belgium, Executief van de Moslims van Belgie, its own PDF's Arabic text:
  // التقدير النسبي لخط عرض 45, the relative estimate at latitude 45. Implemented literally:
  // compute the angle at latitude 45 with the location's own longitude, and take the OFFSET
  // from that latitude's sunrise and sunset, applied to the local sunrise and sunset.
  // The 45 is signed to the observer's own hemisphere. Hard-coding +45, which is what the
  // rule's literal wording invites, is a sign bug of the class R7 found in adhan's
  // `recommended()`, and measure-hemisphere.mjs quantifies it at 20 to 47 minutes.
  BelgiumLat45: {
    family: 'nearest-place',
    fn: (f, ctx) => {
      if (f.sunrise === null || f.sunset === null) return { fajr: null, isha: null };
      const d = frame(ctx.lat >= 0 ? 45 : -45, ctx.lng, ctx.tz, ctx.y, ctx.m, ctx.d, f.fajrAngle, f.ishaAngle);
      if (d.angFajr === null || d.angIsha === null || d.sunrise === null) return { fajr: null, isha: null };
      return { fajr: f.sunrise - (d.sunrise - d.angFajr), isha: f.sunset + (d.angIsha - d.sunset) };
    },
  },

  // Aqrab al-Bilad as adhan implements it (`PolarCircleResolution.AqrabBalad`): walk the
  // latitude toward the equator in 0.5-degree steps until the angle solves. ITL option 1 to 3
  // walk to a FIXED 48.5, which is the next rule.
  AqrabBaladWalk: {
    family: 'nearest-place',
    fn: (f, ctx) => {
      if (f.angFajr !== null && f.angIsha !== null) return { fajr: f.angFajr, isha: f.angIsha };
      const sgn = ctx.lat >= 0 ? -1 : 1;
      for (let step = 0.5; step <= 40; step += 0.5) {
        const L = ctx.lat + sgn * step;
        const d = frame(L, ctx.lng, ctx.tz, ctx.y, ctx.m, ctx.d, f.fajrAngle, f.ishaAngle);
        if (d.angFajr === null || d.angIsha === null || d.sunrise === null) continue;
        // transfer the OFFSET from the donor's sunrise and sunset, not the raw clock time
        if (f.sunrise === null || f.sunset === null) return { fajr: d.angFajr, isha: d.angIsha, walked: step };
        return { fajr: f.sunrise - (d.sunrise - d.angFajr), isha: f.sunset + (d.angIsha - d.sunset), walked: step };
      }
      return { fajr: null, isha: null };
    },
  },

  // ITL's own text: "The recommended latitude by many schools of Fiqh is 48.5 degrees."
  // prayertimes.dk records the Muslim World League moving the same rule to 45 in 1986.
  AqrabBalad485: {
    family: 'nearest-place',
    fn: (f, ctx) => {
      const L = ctx.lat >= 0 ? Math.min(ctx.lat, 48.5) : Math.max(ctx.lat, -48.5);
      const d = frame(L, ctx.lng, ctx.tz, ctx.y, ctx.m, ctx.d, f.fajrAngle, f.ishaAngle);
      if (d.angFajr === null || d.angIsha === null || d.sunrise === null) return { fajr: null, isha: null };
      if (f.sunrise === null || f.sunset === null) return { fajr: d.angFajr, isha: d.angIsha };
      return { fajr: f.sunrise - (d.sunrise - d.angFajr), isha: f.sunset + (d.angIsha - d.sunset) };
    },
  },
};

// --- the nearest-day family, which needs the whole year -----------------------------------
// Both variants transfer the OFFSET from the donor day's sunrise or sunset, not the raw clock
// time, which is the only reading that stays continuous across a 55-day donor gap (R7).
//
//   AqrabAyyamLast   the absolute last solvable day. HMNAO's method, per Wifaqul Ulama.
//   AqrabAyyam3Day   the mean of the three nearest solvable days. Wifaqul Ulama's OWN app
//                    method, adopted after analysing "nearly 3,000 postcodes in Britain"
//                    because the absolute last day "causes severe problems during leap years".
export function nearestDay(days, variant) {
  const n = days.length;
  const out = new Array(n);
  const solvF = days.map(f => f.angFajr !== null && f.sunrise !== null);
  const solvI = days.map(f => f.angIsha !== null && f.sunset !== null);
  const pick = (i, ok) => {
    const hits = [];
    for (let r = 0; r < n && hits.length < 3; r++) {
      for (const j of [i - r, i + r]) {
        const k = ((j % n) + n) % n;
        if (ok[k] && !hits.includes(k)) hits.push(k);
        if (hits.length >= 3) break;
      }
      if (r === 0 && hits.length) break; // the day itself solves
    }
    return hits;
  };
  for (let i = 0; i < n; i++) {
    const f = days[i];
    let fajr = null, isha = null, dist = 0;
    if (solvF[i]) fajr = f.angFajr;
    else if (f.sunrise !== null) {
      const hits = pick(i, solvF);
      const use = variant === '3day' ? hits.slice(0, 3) : hits.slice(0, 1);
      if (use.length) {
        const offs = use.map(k => days[k].sunrise - days[k].angFajr);
        fajr = f.sunrise - offs.reduce((a, b) => a + b, 0) / offs.length;
        dist = Math.max(...use.map(k => Math.min(Math.abs(k - i), n - Math.abs(k - i))));
      }
    }
    if (solvI[i]) isha = f.angIsha;
    else if (f.sunset !== null) {
      const hits = pick(i, solvI);
      const use = variant === '3day' ? hits.slice(0, 3) : hits.slice(0, 1);
      if (use.length) {
        const offs = use.map(k => days[k].angIsha - days[k].sunset);
        isha = f.sunset + offs.reduce((a, b) => a + b, 0) / offs.length;
      }
    }
    out[i] = { fajr, isha, donorDistance: dist };
  }
  return out;
}

// Norway, Islamsk Rad Norge: freeze the CLOCK TIME carried across the boundary, measured in
// R9 as Fajr 03:37 held for 34 days and 03:17 for 46. Unlike Aqrab al-Ayyam this transfers the
// raw clock, not the sunrise offset, which is exactly what makes it a different rule.
export function norwayFrozenClock(days) {
  const n = days.length;
  const out = days.map(() => ({ fajr: null, isha: null }));
  const solvF = days.map(f => f.angFajr !== null), solvI = days.map(f => f.angIsha !== null);
  const nearestSolvable = (i, ok) => {
    for (let r = 0; r < n; r++) for (const j of [i - r, i + r]) { const k = ((j % n) + n) % n; if (ok[k]) return k; }
    return -1;
  };
  for (let i = 0; i < n; i++) {
    const kF = solvF[i] ? i : nearestSolvable(i, solvF);
    const kI = solvI[i] ? i : nearestSolvable(i, solvI);
    out[i].fajr = kF < 0 ? null : days[kF].angFajr;
    out[i].isha = kI < 0 ? null : days[kI].angIsha;
  }
  return out;
}

// Wifaqul Ulama Haraj cap, quoted from its own 2018-11-11 ruling: Isha "restricted to 65
// minutes after the local Astronomical sunset on the longest day of the year". The longest
// day's sunset is a per-location constant, so this is a hard clock ceiling.
// day's sunset is a per-location constant, so this is a hard clock ceiling. The longest day is
// searched over the WHOLE year, not over May to July: the rule's wording assumes a northern
// reader, and measure-hemisphere.mjs measures a May-to-July search as 316 minutes wrong at
// 69.6 S. This is the second sign-blind rule in the catalogue.
export function wifaqHarajCap(lat, lng, tz, y) {
  let latest = -1;
  const dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= dim[m - 1]; d++) {
    const h = halfDay(lat, lng, tz, y, m, d, SUNRISE_ANG);
    if (h.half === null) continue;
    const ss = midDay(y, m, d, lng, tz) + h.half;
    if (ss > latest) latest = ss;
  }
  return latest < 0 ? null : latest + 65 / 60;
}

// Moonsighting Committee, from its own how-we.html, read 2026-09-30:
//   from the equator to 55 deg, the seasonal function against 18 deg, taking the LATER for
//     Fajr and the EARLIER for Isha (not implemented here: the function is wave 1's subject);
//   from 55 to 60 deg, Sab'u Lail (1/7 of the night);
//   above 60 deg, "we slide down to 60 degrees and calculate Fajr & Isha using the rule of
//     Sab'u Lail in summer".
// The published text and adhan's shipped tables disagree (wave 1). What is implemented here is
// the PUBLISHED TEXT, so the report measures the rule the committee states.
export const moonsightingText = (f, ctx) => {
  const alat = Math.abs(ctx.lat);
  if (alat < 55) return { fajr: f.angFajr, isha: f.angIsha };
  const L = alat <= 60 ? ctx.lat : (ctx.lat >= 0 ? 60 : -60);
  const d = alat <= 60 ? f : frame(L, ctx.lng, ctx.tz, ctx.y, ctx.m, ctx.d, f.fajrAngle, f.ishaAngle);
  if (d.night === null) return { fajr: null, isha: null };
  const floor = d.sunrise - d.night / 7, ceil = d.sunset + d.night / 7;
  const fj = d.angFajr === null ? floor : Math.max(d.angFajr, floor);
  const ih = d.angIsha === null ? ceil : Math.min(d.angIsha, ceil);
  if (alat <= 60) return { fajr: fj, isha: ih };
  if (f.sunrise === null || f.sunset === null) return { fajr: fj, isha: ih };
  return { fajr: f.sunrise - (d.sunrise - fj), isha: f.sunset + (ih - d.sunset) };
};
