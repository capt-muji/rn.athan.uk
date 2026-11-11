// Elevation-aware solo engine on adhan 4.4.6's own astronomy.
// The INM table's residual signature is a horizon term: fajr early, maghrib/isha late,
// dhuhr/asr untouched. So the model puts a dip on the apparent horizon for the four
// horizon-crossing prayers and leaves transit and the shadow ratio alone.
const A = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");
const SolarTime = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/SolarTime.js").default;
const TimeComponents = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/TimeComponents.js").default;

const R_EARTH = 6371000;
const SEA_HORIZON = -50 / 60;

function dipDeg(elevM) {
  if (!(elevM > 0)) return 0;
  return (Math.acos(R_EARTH / (R_EARTH + elevM)) * 180) / Math.PI;
}

function elevationFromDip(deg) {
  const rad = (deg * Math.PI) / 180;
  return R_EARTH * (1 / Math.cos(rad) - 1);
}

function secOfDay(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

// One solar day, reusable for as many dip trials as a fit needs.
function mkDay(coord, ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const st = new SolarTime(new Date(y, m - 1, d, 12, 0, 0), coord);
  const at = (hours) => secOfDay(new TimeComponents(hours).utcDate(y, m - 1, d));
  return { st, at };
}

// cfg: { fajrAngle, ishaAngle, dip (degrees), madhab }
function times(coord, cfg, ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);
  const st = new SolarTime(date, coord);
  const dip = cfg.dip || 0;
  const at = (hours) => secOfDay(new TimeComponents(hours).utcDate(y, m - 1, d));
  return {
    fajr: at(st.hourAngle(-(cfg.fajrAngle + dip), false)),
    sunrise: at(st.hourAngle(SEA_HORIZON - dip, false)),
    dhuhr: at(st.transit),
    asr: at(st.afternoon(cfg.madhab === "hanafi" ? 2 : 1)),
    maghrib: at(st.hourAngle(SEA_HORIZON - dip, true)),
    isha: at(st.hourAngle(-(cfg.ishaAngle + dip), true)),
  };
}

function roundMin(sec, pad, mode) {
  if (sec === null || sec === undefined) return null;
  const v = sec / 60 + (pad || 0);
  if (mode === "floor") return Math.floor(v);
  if (mode === "ceil") return Math.ceil(v);
  return Math.round(v);
}

const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

module.exports = { A, dipDeg, elevationFromDip, times, mkDay, roundMin, toMin, R_EARTH, SEA_HORIZON };
