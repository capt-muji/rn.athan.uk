// Shared solar engine: adhan 4.4.6 astronomy, explicit dip on the horizon, IANA wall clock.
const A = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");
const SolarTime = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/SolarTime.js").default;
const TimeComponents = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan/lib/cjs/TimeComponents.js").default;

const SEA_HORIZON = -50 / 60;

const fmt = {};
function wall(tz, date) {
  if (!fmt[tz]) fmt[tz] = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const p = fmt[tz].formatToParts(date);
  const g = (t) => Number(p.find((x) => x.type === t).value);
  return g("hour") * 3600 + g("minute") * 60 + g("second");
}

// cfg: { fajrAngle, ishaAngle, dip (deg), madhab, tz }
function times(coord, cfg, ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const st = new SolarTime(date, coord);
  const dip = cfg.dip || 0;
  const at = (hours) => (hours === null || hours === undefined || Number.isNaN(hours)) ? null
    : wall(cfg.tz, new TimeComponents(hours).utcDate(y, m - 1, d));
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

const toMin = (s) => Number(String(s).slice(0, 2)) * 60 + Number(String(s).slice(3, 5));

function score(pairs) {
  const n = pairs.length;
  if (!n) return null;
  const diffs = pairs.map(([c, p]) => c - p);
  const abs = diffs.map(Math.abs);
  return {
    n,
    exact: abs.filter((x) => x === 0).length,
    w1: abs.filter((x) => x <= 1).length,
    max: Math.max(...abs),
    mae: +(abs.reduce((a, b) => a + b, 0) / n).toFixed(3),
    meanSigned: +(diffs.reduce((a, b) => a + b, 0) / n).toFixed(3),
    exactPct: +((abs.filter((x) => x === 0).length / n) * 100).toFixed(1),
    w1Pct: +((abs.filter((x) => x <= 1).length / n) * 100).toFixed(1),
  };
}

module.exports = { A, SolarTime, TimeComponents, times, roundMin, toMin, score, wall, SEA_HORIZON };
