// Flag 3 — Austria: IGGÖ's published recipe vs the banked IZW Vienna 2025 XLSX.
// IGGÖ (derislam.at, "Berechnungsmethode", read 2026-11-11): fajr 18, isha 16, Shafi asr,
// dhuhr +5, asr +4, maghrib +7, sunrise 7 min before astronomical rise, fajr/isha temkin 0.
// Run: TZ=Europe/Vienna node at-iggo-vs-izw.js
const fs = require("fs");
const S = require("./solar");
const O = process.env.HOME + "/athan-gitree/census/o1l-city/gaps-closed";
const XLSX = process.env.HOME + "/athan-gitree/census/o1k-wide/europe/data/at-izw-wien-xlsx-2025.json";

const COORD = new S.A.Coordinates(48.2082, 16.3738);
const TZ = "Europe/Vienna";
const banked = JSON.parse(fs.readFileSync(XLSX, "utf8"));
const dates = Object.keys(banked).sort();

const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const KEY = { fajr: "fajr", sunrise: "sunrise", dhuhr: "dhuhr", asr: "asr", maghrib: "magrib", isha: "isha" };

function rows(margins) {
  return dates.map((d) => {
    const t = S.times(COORD, { fajrAngle: 18, ishaAngle: 16, madhab: "shafi", tz: TZ }, d);
    const out = { date: d };
    for (const c of COLS) {
      out[c] = t[c] === null ? null : S.roundMin(t[c], margins[c] || 0, "round");
      out[c + "Raw"] = t[c] === null ? null : t[c] / 60;
      out[c + "Printed"] = S.toMin(banked[d][KEY[c]]);
    }
    return out;
  });
}

function scoreAll(rs) {
  const o = {};
  for (const c of COLS) o[c] = S.score(rs.map((r) => [r[c], r[c + "Printed"]]));
  o.all6W1 = rs.filter((r) => COLS.every((c) => Math.abs(r[c] - r[c + "Printed"]) <= 1)).length;
  o.all6W1Pct = +((o.all6W1 / rs.length) * 100).toFixed(1);
  return o;
}

// Two published readings of the sunrise temkin: 7 min before astronomical rise, or after it.
const variants = {
  "iggo-sunrise-7": { fajr: 0, sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0 },
  "iggo-sunrise-plus7": { fajr: 0, sunrise: 7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0 },
};

const out = { job: "O1l-25 Austria IGGÖ vs IZW 2025", city: "Vienna", coord: [48.2082, 16.3738], tz: TZ, days: dates.length, variants: {} };
for (const [name, m] of Object.entries(variants)) {
  const rs = rows(m);
  const per = scoreAll(rs);
  const monthly = {};
  for (const r of rs) {
    const mo = r.date.slice(5, 7);
    monthly[mo] = monthly[mo] || {};
    for (const c of COLS) (monthly[mo][c] = monthly[mo][c] || []).push(r[c] - r[c + "Printed"]);
  }
  const monthlyMean = {};
  for (const mo of Object.keys(monthly).sort()) {
    monthlyMean[mo] = {};
    for (const c of COLS) monthlyMean[mo][c] = +(monthly[mo][c].reduce((a, b) => a + b, 0) / monthly[mo][c].length).toFixed(1);
  }
  out.variants[name] = { margins: m, perPrayer: per, monthlyMeanSigned: monthlyMean };
}

// Seasonal amplitude of the residual on the better sunrise reading.
const rs = rows(variants["iggo-sunrise-7"]);
const amp = {};
for (const c of COLS) {
  const by = {};
  for (const r of rs) {
    const mo = r.date.slice(5, 7);
    (by[mo] = by[mo] || []).push(r[c] - r[c + "Printed"]);
  }
  const means = Object.keys(by).sort().map((mo) => by[mo].reduce((a, b) => a + b, 0) / by[mo].length);
  amp[c] = { jan: +means[0].toFixed(1), jul: +means[6].toFixed(1), amplitude: +(Math.max(...means) - Math.min(...means)).toFixed(1) };
}
out.seasonalAmplitude = amp;

// Best free margins at the published angles, for the record (not a replacement recipe).
const free = {};
for (const c of COLS) {
  let best = null;
  for (const mode of ["round", "floor", "ceil"]) {
    for (let pad = -10; pad <= 10; pad += 0.5) {
      const s = S.score(rs.map((r) => [S.roundMin(r[c + "Raw"] * 60, pad, mode), r[c + "Printed"]]));
      if (!best || s.w1 > best.w1 || (s.w1 === best.w1 && s.mae < best.mae)) best = { pad, mode, ...s };
    }
  }
  free[c] = best;
}
out.freeMarginsAtPublishedAngles = free;

fs.writeFileSync(`${O}/data/at-iggo-vs-izw-2025.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ per: out.variants["iggo-sunrise-7"].perPrayer, amp: out.seasonalAmplitude, free }, null, 1));
