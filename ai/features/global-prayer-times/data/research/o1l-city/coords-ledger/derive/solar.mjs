// NOAA solar position, continuous in (lat, lon). Used only to recover the point a
// published table implies; validated against adhan 4.4.6 in validate.mjs.

const RAD = Math.PI / 180;

function julianDay(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  let yy = y, mm = m;
  if (mm <= 2) { yy -= 1; mm += 12; }
  const A = Math.floor(yy / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + B - 1524.5;
}

// Declination (deg) and equation of time (minutes, apparent = mean + eot) at a UTC hour.
export function solarPosition(ymd, hourUTC = 12) {
  const jd = julianDay(ymd) + (hourUTC - 12) / 24;
  const T = (jd - 2451545.0) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T))
    + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T)
    + Math.sin(3 * M * RAD) * 0.000289;
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
  const y = Math.tan((eps / 2) * RAD) ** 2;
  const eot = 4 * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD)
    + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD)
    - 0.5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD)) / RAD;
  return { dec, eot };
}

function hourAngle(alt, lat, dec) {
  const cosH = (Math.sin(alt * RAD) - Math.sin(lat * RAD) * Math.sin(dec * RAD))
    / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
  if (cosH < -1 || cosH > 1) return null;
  return Math.acos(cosH) / RAD;
}

// Civil clock hours of transit, sunrise, asr and sunset for one date at one point.
// Declination and equation of time are taken once for the day, as the census engine does.
export function events(ymd, lat, lon, tzOff, { rise = -0.833, set = -0.833, shadow = 1 } = {}) {
  const { dec, eot } = solarPosition(ymd, 12);
  const noon = 12 - lon / 15 - eot / 60 + tzOff;
  const span = (alt) => {
    const H = hourAngle(alt, lat, dec);
    return H === null ? null : H / 15;
  };
  const riseH = span(rise);
  const setH = span(set);
  const asrAlt = Math.atan(1 / (shadow + Math.tan(Math.abs(lat - dec) * RAD))) / RAD;
  const asrH = span(asrAlt);
  return {
    rise: riseH === null ? null : noon - riseH,
    noon,
    asr: asrH === null ? null : noon + asrH,
    set: setH === null ? null : noon + setH,
  };
}

// Minutes-of-day for a printed "HH:MM" or "HH:MM:SS".
export function toMin(s) {
  if (!s) return null;
  const p = s.split(":").map(Number);
  if (p.some((v) => Number.isNaN(v))) return null;
  return p[0] * 60 + p[1] + (p[2] || 0) / 60;
}
