// R11: the identified Islamiska Forbundet i Sverige model, as a reusable module.
//
// Five constants, all fitted on Stockholm and Malmo where no high-latitude mechanism binds,
// then applied unchanged to nine more cities up to 67.86 N (see sweden-eleven.mjs):
//
//   horizon    1.51 deg below the true horizon for Shuruk and Magrib
//   clamp      day length forced into [300, 1140] minutes, symmetric about solar noon
//   fajrAngle  17.98 deg
//   ishaAngle  15.90 deg
//   fF, fI     0.2055 and 0.1815 of the CLAMPED night, as a floor on Fajr and a ceiling on Isha
//
// The half-day length is solved from the noon declination directly rather than by the harness's
// fixed-point iteration, because the iteration returns null on the two or three days a year when
// the polar boundary is crossed mid-iteration, and a null there is indistinguishable from a real
// polar day. Everything else comes from the validated harness unchanged.
import { midDay, sin, cos } from '../countries/solar-harness.mjs';

export const IFIS = { horizon: 1.51, dayMin: 300, dayMax: 1140, fajrAngle: 17.98, ishaAngle: 15.90, fF: 0.2055, fI: 0.1815 };

const jul = (y, m, d) => { if (m <= 2) { y -= 1; m += 12; } const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5; };
export const declAt = (y, m, d, tz, t) => {
  const dd = jul(y, m, d) + (t - tz) / 24 - 2451545.0;
  const g = ((357.529 + 0.98560028 * dd) % 360 + 360) % 360;
  const q = ((280.459 + 0.98564736 * dd) % 360 + 360) % 360;
  const L = ((q + 1.915 * sin(g) + 0.020 * sin(2 * g)) % 360 + 360) % 360;
  const e = 23.439 - 0.00000036 * dd;
  return Math.asin(sin(e) * sin(L)) * 180 / Math.PI;
};

// Half the time from the event to solar noon, in hours, for a depression `ang` below the
// horizon. Returns { half, polar } with polar 'day' (the sun never descends that far) or
// 'night' (the sun never climbs that high). Two Newton refinements on the declination.
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

// The full IFiS day. Returns clock hours local, plus which mechanism supplied each value.
export function ifisDay(lat, lng, tz, y, m, d, P = IFIS) {
  const noon = midDay(y, m, d, lng, tz);
  const h = halfDay(lat, lng, tz, y, m, d, P.horizon);
  const rawDay = h.half === null ? (h.polar === 'day' ? 24 : 0) : 2 * h.half;
  const day = Math.min(P.dayMax / 60, Math.max(P.dayMin / 60, rawDay));
  const shuruk = noon - day / 2, magrib = noon + day / 2, night = 24 - day;
  const hF = halfDay(lat, lng, tz, y, m, d, P.fajrAngle);
  const hI = halfDay(lat, lng, tz, y, m, d, P.ishaAngle);
  const floorF = shuruk - P.fF * night, ceilI = magrib + P.fI * night;
  const angF = hF.half === null ? null : noon - hF.half;
  const angI = hI.half === null ? null : noon + hI.half;
  return {
    shuruk, magrib, dhohr: noon,
    fajr: angF === null ? floorF : Math.max(angF, floorF),
    isha: angI === null ? ceilI : Math.min(angI, ceilI),
    clamped: Math.abs(day - rawDay) > 1e-9,
    polar: h.polar,
    fajrFromFloor: angF === null || floorF > angF,
    ishaFromCeil: angI === null || ceilI < angI,
    rawDayMin: Math.round(rawDay * 60),
  };
}
