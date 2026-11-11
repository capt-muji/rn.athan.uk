// Solar engine recovered from the 2027 fit: Meeus solar position (via adhan-js 4.4.6),
// transit refined, declination taken once at 12:00 UT of the civil date and reused for
// every hour-angle event. Times are London wall-clock minutes (DST included).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ROOT = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan';
const SolarTime = require(ROOT + '/lib/cjs/SolarTime.js').default;
const SolarCoordinates = require(ROOT + '/lib/cjs/SolarCoordinates.js').default;
const Coordinates = require(ROOT + '/lib/cjs/Coordinates.js').default;
const Astronomical = require(ROOT + '/lib/cjs/Astronomical.js').default;

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});

function londonOffsetMinutes(dateStr, utcHours) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const instant = new Date(Date.UTC(y, m - 1, d) + utcHours * 3600e3);
  const p = Object.fromEntries(FMT.formatToParts(instant).map((x) => [x.type, x.value]));
  const localHours = Number(p.hour) + Number(p.minute) / 60 + Number(p.second) / 3600;
  return Math.round((localHours - utcHours) * 60);
}

// Transit (London wall clock minutes), the noon declination, and an hour-angle helper.
export function solarDay(dateStr, lat, lon = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const st = new SolarTime(new Date(y, m - 1, d), new Coordinates(lat, lon));
  const dec = new SolarCoordinates(Astronomical.julianDay(y, m, d, 0) + 0.5).declination;
  const transit = st.transit * 60 + londonOffsetMinutes(dateStr, st.transit);
  const hourAngleMinutes = (altitudeDeg) => {
    const cosH =
      (Math.sin(altitudeDeg * D2R) - Math.sin(lat * D2R) * Math.sin(dec * D2R)) /
      (Math.cos(lat * D2R) * Math.cos(dec * D2R));
    return (R2D * Math.acos(Math.max(-1, Math.min(1, cosH))) / 15) * 60;
  };
  return { transit, declination: dec, hourAngleMinutes };
}

export function asrAltitude(lat, declinationDeg, shadowFactor = 1) {
  return R2D * Math.atan(1 / (shadowFactor + Math.tan(Math.abs(lat - declinationDeg) * D2R)));
}

const HORIZON = -0.8333;

// Baseline (pre-margin) London wall-clock minutes for one civil date.
export function baseTimes(dateStr, lat, lon = 0) {
  const day = solarDay(dateStr, lat, lon);
  const h = day.hourAngleMinutes(HORIZON);
  return {
    sunrise: day.transit - h,
    dhuhr: day.transit,
    asr: day.transit + day.hourAngleMinutes(asrAltitude(lat, day.declination)),
    magrib: day.transit + h,
  };
}
