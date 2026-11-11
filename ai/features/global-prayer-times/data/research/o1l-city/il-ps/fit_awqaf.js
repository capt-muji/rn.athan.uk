// Fit adhan 4.4.6 to the Jerusalem Awqaf print.
//
// Both target sets are read on the publisher's own clock and never on the real
// clock. The live homepage prints fixed UTC+3 year-round; the 2012 perpetual
// print is on the winter clock (UTC+2). Each target is converted to UTC before
// scoring, so every margin that survives is a publisher adjustment, not a zone.
const fs = require("fs");
const adhan = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");

const PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

function params(fajrAngle, ishaAngle) {
  const p = new adhan.CalculationParameters();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.ishaInterval = 0;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = adhan.Rounding.None;
  return p;
}

function times(lat, lon, dateStr, fajrAngle, ishaAngle) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const pt = new adhan.PrayerTimes(new adhan.Coordinates(lat, lon), date, params(fajrAngle, ishaAngle));
  const out = {};
  for (const p of PRAYERS) {
    const t = pt[p];
    out[p] = t.getUTCHours() * 60 + t.getUTCMinutes() + t.getUTCSeconds() / 60;
  }
  return out;
}

function apply(raw, margin, rounding) {
  const v = raw + margin;
  if (rounding === "floor") return Math.floor(v);
  if (rounding === "ceil") return Math.ceil(v);
  return Math.round(v);
}

function score(targets, lat, lon, fajrAngle, ishaAngle, margins, roundings) {
  const per = {};
  for (const p of PRAYERS) per[p] = { n: 0, exact: 0, within1: 0, sum: 0, worst: 0, signed: 0 };
  for (const [date, row] of Object.entries(targets)) {
    const raw = times(lat, lon, date, fajrAngle, ishaAngle);
    for (const p of PRAYERS) {
      const t = row[p];
      if (t == null) continue;
      const dev = apply(raw[p], margins[p], roundings[p]) - t;
      const s = per[p];
      s.n += 1;
      s.sum += Math.abs(dev);
      s.signed += dev;
      if (dev === 0) s.exact += 1;
      if (Math.abs(dev) <= 1) s.within1 += 1;
      s.worst = Math.max(s.worst, Math.abs(dev));
    }
  }
  for (const p of PRAYERS) {
    const s = per[p];
    s.mae = s.n ? +(s.sum / s.n).toFixed(3) : null;
    s.signedMean = s.n ? +(s.signed / s.n).toFixed(3) : null;
    s.exactPct = s.n ? +((100 * s.exact) / s.n).toFixed(2) : null;
  }
  const total = PRAYERS.reduce((a, p) => a + per[p].sum, 0);
  const n = PRAYERS.reduce((a, p) => a + per[p].n, 0);
  return { per, mae: +(total / n).toFixed(3), n };
}

function grid(targets, lat, lon, label) {
  const roundings = { fajr: "nearest", sunrise: "nearest", dhuhr: "nearest", asr: "nearest", maghrib: "nearest", isha: "nearest" };
  let best = null;
  for (let fa = 16.5; fa <= 19.01; fa += 0.05) {
    for (let ia = 16.5; ia <= 19.01; ia += 0.05) {
      const zero = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
      const base = score(targets, lat, lon, +fa.toFixed(2), +ia.toFixed(2), zero, roundings);
      const margins = {};
      for (const p of PRAYERS) margins[p] = Math.round(-base.per[p].signedMean);
      const s = score(targets, lat, lon, +fa.toFixed(2), +ia.toFixed(2), margins, roundings);
      if (!best || s.mae < best.mae) best = { ...s, fajrAngle: +fa.toFixed(2), ishaAngle: +ia.toFixed(2), margins };
    }
  }
  console.log("\n" + label, "angles", best.fajrAngle, "/", best.ishaAngle, "margins", JSON.stringify(best.margins), "MAE", best.mae);
  for (const p of PRAYERS) {
    const s = best.per[p];
    console.log("  ", p.padEnd(8), "mae", String(s.mae).padStart(6), "exact", String(s.exactPct).padStart(6) + "%",
      "w1", String(s.within1).padStart(4) + "/" + s.n, "worst", String(s.worst).padStart(3), "signed", s.signedMean);
  }
  return best;
}

function main() {
  const lat = Number(process.env.LAT || 31.7761);
  const lon = Number(process.env.LON || 35.2358);
  const live = JSON.parse(fs.readFileSync("data/jerusalem-awqaf-wayback.json"));
  const perpetual = JSON.parse(fs.readFileSync("data/jerusalem-awqaf-perpetual-24h.json"));

  const liveT = {};
  for (const [d, r] of Object.entries(live)) {
    if (d === "2024-02-29") continue;
    const hh = {};
    for (const p of PRAYERS) hh[p] = Number(r[p].split(":")[0]) * 60 + Number(r[p].split(":")[1]) - 180;
    liveT[d] = hh;
  }
  const year = Number(process.env.YEAR || 2026);
  const perT = {};
  for (const [md, r] of Object.entries(perpetual)) {
    const [m, d] = md.split("-").map(Number);
    const hh = {};
    for (const p of PRAYERS) hh[p] = r[p] - 120;
    perT[`${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`] = hh;
  }
  const out = {
    point: { lat, lon },
    live: grid(liveT, lat, lon, `LIVE fixed+3 (${Object.keys(liveT).length} days)`),
    perpetual: grid(perT, lat, lon, `PERPETUAL winter+2 (${Object.keys(perT).length} days)`),
  };
  fs.writeFileSync("data/fit-awqaf.json", JSON.stringify(out, null, 1));
}

main();
