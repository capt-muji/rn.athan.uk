// Solar geometry (carried from c47's proven fitter).
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function julianDay(y, m, d) {
  let yy = y, mm = m;
  if (mm <= 2) { yy -= 1; mm += 12; }
  const A = Math.floor(yy / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + d + B - 1524.5;
}

export function solarDay(y, m, d) {
  const jd = julianDay(y, m, d);
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  let eot = (L * RAD - ra) * DEG;
  eot = ((eot + 540) % 360) - 180;
  return { dec: dec * DEG, eotMin: eot * 4 };
}

export function hourAngle(altDeg, latDeg, decDeg) {
  const la = latDeg * RAD, de = decDeg * RAD;
  const den = Math.cos(la) * Math.cos(de);
  if (Math.abs(den) < 1e-9) return null;
  const cosH = (Math.sin(altDeg * RAD) - Math.sin(la) * Math.sin(de)) / den;
  if (cosH < -1 || cosH > 1) return null;
  return Math.acos(cosH) * DEG;
}

export function asrAltitude(factor, latDeg, decDeg) {
  const denom = factor + Math.tan(Math.abs(latDeg - decDeg) * RAD);
  return Math.atan(1 / denom) * DEG;
}
