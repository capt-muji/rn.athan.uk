// Fit a dated table against adhan 4.4.6. Usage:
//   node fit.js <data.json> <lat> <lon> <tz> <label>
// data.json: {"YYYY-MM-DD": {fajr,sunrise,dhuhr,asr,maghrib,isha}}
const fs = require("fs");
const path = require("path");
const adhan = require(path.join(process.env.HOME, "athan-gitree/census/adhan-build/node_modules/adhan"));

const [, , file, latS, lonS, tz, label] = process.argv;
process.env.TZ = tz;
const rows = JSON.parse(fs.readFileSync(file, "utf8"));
const dates = Object.keys(rows).sort();
const coords = new adhan.Coordinates(parseFloat(latS), parseFloat(lonS));

const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

function toMin(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  return m ? +m[1] * 60 + +m[2] : null;
}
function fmt(d) {
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
function compute(fajrAngle, ishaAngle, madhab) {
  const p = new adhan.CalculationParameters(adhan.CalculationMethod.Other);
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = madhab;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  p.rounding = adhan.Rounding.None;
  return dates.map((iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    const t = new adhan.PrayerTimes(coords, date, p);
    return {
      fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr,
      asr: t.asr, maghrib: t.maghrib, isha: t.isha,
    };
  });
}
function minsOf(objs, col) {
  return objs.map((o) => (o[col] == null ? null : toMin(fmt(o[col]))));
}

// angle search on fajr and isha independently
function bestAngle(col) {
  let best = null;
  for (let a = 12; a <= 20.001; a += 0.05) {
    const c = compute(col === "fajr" ? a : 18, col === "isha" ? a : 17, adhan.Madhab.Shafi);
    const v = minsOf(c, col);
    let exact = 0, w1 = 0, worst = 0;
    dates.forEach((iso, i) => {
      const obs = toMin(rows[iso][col]);
      if (obs == null || v[i] == null) return;
      const d = Math.abs(obs - v[i]);
      if (d === 0) exact++;
      if (d <= 1) w1++;
      if (d > worst) worst = d;
    });
    const score = w1 * 1000 + exact;
    if (!best || score > best.score) best = { angle: +a.toFixed(2), exact, w1, worst, score };
  }
  return best;
}

const fajrBest = bestAngle("fajr");
const ishaBest = bestAngle("isha");

// asr madhab check at the chosen fajr/isha
function scoreMadhab(madhab) {
  const c = compute(fajrBest.angle, ishaBest.angle, madhab);
  const out = {};
  for (const col of COLS) {
    const v = minsOf(c, col);
    let exact = 0, w1 = 0, worst = 0;
    dates.forEach((iso, i) => {
      const obs = toMin(rows[iso][col]);
      if (obs == null || v[i] == null) return;
      const d = Math.abs(obs - v[i]);
      if (d === 0) exact++;
      if (d <= 1) w1++;
      if (d > worst) worst = d;
    });
    out[col] = { exact, w1, worst, n: dates.length };
  }
  return out;
}
const shafi = scoreMadhab(adhan.Madhab.Shafi);
const hanafi = scoreMadhab(adhan.Madhab.Hanafi);
const madhab = hanafi.asr.w1 > shafi.asr.w1 ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;

// per-column integer offset = modal signed difference
const base = compute(fajrBest.angle, ishaBest.angle, madhab);
const offsets = {};
for (const col of COLS) {
  const v = minsOf(base, col);
  const hist = {};
  dates.forEach((iso, i) => {
    const obs = toMin(rows[iso][col]);
    if (obs == null || v[i] == null) return;
    const d = obs - v[i];
    hist[d] = (hist[d] || 0) + 1;
  });
  const best = Object.entries(hist).sort((a, b) => b[1] - a[1])[0];
  offsets[col] = best ? +best[0] : 0;
}

// final score with offsets applied
const adj = {};
for (const col of COLS) adj[col] = offsets[col];
const p = new adhan.CalculationParameters(adhan.CalculationMethod.Other);
p.fajrAngle = fajrBest.angle;
p.ishaAngle = ishaBest.angle;
p.madhab = madhab;
p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
p.rounding = adhan.Rounding.None;
p.adjustments = adj;
const final = dates.map((iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new adhan.PrayerTimes(coords, new Date(y, m - 1, d, 12, 0, 0), p);
});
const finalScore = {};
let totalW1 = 0, totalN = 0, totalExact = 0;
for (const col of COLS) {
  const v = final.map((t) => toMin(fmt(t[col])));
  let exact = 0, w1 = 0, worst = 0;
  dates.forEach((iso, i) => {
    const obs = toMin(rows[iso][col]);
    if (obs == null || v[i] == null) return;
    const d = Math.abs(obs - v[i]);
    if (d === 0) exact++;
    if (d <= 1) w1++;
    if (d > worst) worst = d;
  });
  finalScore[col] = { exact, w1, worst, n: dates.length };
  totalW1 += w1; totalN += dates.length; totalExact += exact;
}
const out = {
  label, file: path.basename(file), tz, lat: +latS, lon: +lonS,
  days: dates.length, span: [dates[0], dates[dates.length - 1]],
  engine: "adhan 4.4.6 Rounding.None MiddleOfTheNight",
  recipe: {
    fajrAngle: fajrBest.angle, ishaAngle: ishaBest.angle,
    madhab: madhab === adhan.Madhab.Hanafi ? "Hanafi" : "Shafi",
    offsets: adj,
  },
  angleSearch: { fajr: fajrBest, isha: ishaBest },
  asrMadhab: { shafi: shafi.asr, hanafi: hanafi.asr },
  perColumn: finalScore,
  totals: { within1: totalW1, of: totalN, exact: totalExact, worst: Math.max(...COLS.map((c) => finalScore[c].worst)) },
};
console.log(JSON.stringify(out, null, 1));
