// Shared fit machinery. Run under TZ=<zone> so adhan's Date objects carry local wall time.
const a = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");

const PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

function coords(lat, lng) {
  return new a.Coordinates(lat, lng);
}

// cfg: { fajrAngle, ishaAngle, ishaInterval, madhab:'shafi'|'hanafi', highLat:'none'|'middle'|'seventh'|'twilight', adjustments:{...} }
function makeParams(cfg) {
  const p = new a.CalculationParameters(null, cfg.fajrAngle ?? 18, cfg.ishaAngle ?? 18, cfg.ishaInterval ?? 0);
  p.madhab = cfg.madhab === "hanafi" ? a.Madhab.Hanafi : a.Madhab.Shafi;
  p.rounding = a.Rounding.None;
  p.polarCircleResolution = a.PolarCircleResolution.Unresolved;
  if (cfg.adjustments) Object.assign(p.adjustments, cfg.adjustments);
  return p;
}

function secOfDay(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

// Second-resolution instants for one calendar day (local noon anchor, no ambient clock).
function times(c, cfg, ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const pt = new a.PrayerTimes(c, new Date(y, m - 1, d, 12, 0, 0), makeParams(cfg));
  const out = {};
  for (const k of PRAYERS) out[k] = pt[k] ? secOfDay(pt[k]) : null;
  return out;
}

function roundMin(sec, pad, mode) {
  if (sec === null) return null;
  const v = sec / 60 + (pad || 0);
  if (mode === "floor") return Math.floor(v);
  if (mode === "ceil") return Math.ceil(v);
  return Math.round(v);
}

function score(pairs) {
  let exact = 0, w1 = 0, sum = 0, max = 0, n = 0, signed = 0;
  let worst = null;
  for (const [printed, model] of pairs) {
    if (model === null) continue;
    const d = printed - model;
    const ad = Math.abs(d);
    n++;
    sum += ad;
    signed += d;
    if (ad === 0) exact++;
    if (ad <= 1) w1++;
    if (ad > max) { max = ad; worst = printed; }
  }
  return { n, exact, w1, mae: n ? sum / n : NaN, maxAbs: max, meanSigned: n ? signed / n : NaN, worstPrinted: worst };
}

function fmt(s) {
  return `${(s.exact / s.n * 100).toFixed(1)}%/${(s.w1 / s.n * 100).toFixed(1)}% mae ${s.mae.toFixed(2)} max ${s.maxAbs}`;
}

function dayOfWeek(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

module.exports = { a, PRAYERS, coords, makeParams, times, secOfDay, roundMin, score, fmt, dayOfWeek };
