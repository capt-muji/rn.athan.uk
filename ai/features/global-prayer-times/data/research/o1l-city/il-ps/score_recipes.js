// Score fixed recipes on the Awqaf print, with per-year breakdown and the
// seasonal amplitude the fit rules ask for beside the between-year verdict.
const fs = require("fs");
const adhan = require(process.env.HOME + "/athan-gitree/census/adhan-build/node_modules/adhan");

const PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

function params(fa, ia) {
  const p = new adhan.CalculationParameters();
  p.fajrAngle = fa; p.ishaAngle = ia; p.ishaInterval = 0;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  p.rounding = adhan.Rounding.None;
  return p;
}

function times(lat, lon, ds, fa, ia) {
  const [y, m, d] = ds.split("-").map(Number);
  const pt = new adhan.PrayerTimes(new adhan.Coordinates(lat, lon), new Date(Date.UTC(y, m - 1, d, 12)), params(fa, ia));
  const o = {};
  for (const p of PRAYERS) { const t = pt[p]; o[p] = t.getUTCHours() * 60 + t.getUTCMinutes() + t.getUTCSeconds() / 60; }
  return o;
}

function apply(v, m, r) { const x = v + m; return r === "floor" ? Math.floor(x) : r === "ceil" ? Math.ceil(x) : Math.round(x); }

function run(targets, lat, lon, fa, ia, margins, roundings) {
  const per = {}, years = {};
  for (const p of PRAYERS) per[p] = { n: 0, exact: 0, w1: 0, sum: 0, worst: 0, signed: 0 };
  for (const [ds, row] of Object.entries(targets)) {
    const raw = times(lat, lon, ds, fa, ia);
    const y = ds.slice(0, 4);
    years[y] = years[y] || { n: 0, exact: 0, w1: 0, sum: 0, worst: 0 };
    for (const p of PRAYERS) {
      const dev = apply(raw[p], margins[p], roundings[p]) - row[p];
      const s = per[p]; s.n++; s.sum += Math.abs(dev); s.signed += dev;
      if (!dev) s.exact++; if (Math.abs(dev) <= 1) s.w1++; s.worst = Math.max(s.worst, Math.abs(dev));
      const ys = years[y]; ys.n++; ys.sum += Math.abs(dev);
      if (!dev) ys.exact++; if (Math.abs(dev) <= 1) ys.w1++; ys.worst = Math.max(ys.worst, Math.abs(dev));
    }
  }
  const n = PRAYERS.reduce((a, p) => a + per[p].n, 0);
  const sum = PRAYERS.reduce((a, p) => a + per[p].sum, 0);
  const res = { mae: +(sum / n).toFixed(3), n, per: {}, years: {} };
  for (const p of PRAYERS) res.per[p] = {
    mae: +(per[p].sum / per[p].n).toFixed(3), exactPct: +((100 * per[p].exact) / per[p].n).toFixed(1),
    w1: `${per[p].w1}/${per[p].n}`, worst: per[p].worst, signed: +(per[p].signed / per[p].n).toFixed(3),
  };
  for (const y of Object.keys(years).sort()) {
    const v = years[y];
    res.years[y] = { days: v.n / 6, mae: +(v.sum / v.n).toFixed(3), exactPct: +((100 * v.exact) / v.n).toFixed(1), w1Pct: +((100 * v.w1) / v.n).toFixed(1), worst: v.worst };
  }
  return res;
}

const lat = 31.7761, lon = 35.2358;
const live = JSON.parse(fs.readFileSync("data/jerusalem-awqaf-wayback.json"));
const perp = JSON.parse(fs.readFileSync("data/jerusalem-awqaf-perpetual-24h.json"));
const nearest = { fajr: "nearest", sunrise: "nearest", dhuhr: "nearest", asr: "nearest", maghrib: "nearest", isha: "nearest" };

const liveT = {};
for (const [d, r] of Object.entries(live)) {
  if (d === "2024-02-29") continue;
  const h = {}; for (const p of PRAYERS) h[p] = Number(r[p].split(":")[0]) * 60 + Number(r[p].split(":")[1]) - 180;
  liveT[d] = h;
}
const perpT = {};
for (const [md, r] of Object.entries(perp)) {
  const [m, d] = md.split("-").map(Number);
  const h = {}; for (const p of PRAYERS) h[p] = r[p] - 120;
  perpT[`2026-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`] = h;
}

const recipes = {
  "record-18/18 nearest": { fa: 18, ia: 18, m: { fajr: 0, sunrise: -3, dhuhr: 0, asr: 0, maghrib: 6, isha: 0 }, r: nearest },
  "record-18/18 dhuhr-floor": { fa: 18, ia: 18, m: { fajr: 0, sunrise: -3, dhuhr: 0, asr: 0, maghrib: 6, isha: 0 }, r: { ...nearest, dhuhr: "floor" } },
  "grid 18.25/17.9": { fa: 18.25, ia: 17.9, m: { fajr: 1, sunrise: -3, dhuhr: 0, asr: 0, maghrib: 6, isha: 0 }, r: nearest },
};

const out = {};
for (const [name, rc] of Object.entries(recipes)) {
  out[name] = { live: run(liveT, lat, lon, rc.fa, rc.ia, rc.m, rc.r), perpetual: run(perpT, lat, lon, rc.fa, rc.ia, rc.m, rc.r) };
}
console.log(JSON.stringify(out, null, 1));

// Seasonal amplitude of the published print itself (Jan vs Jul fajr span).
const f = Object.entries(perp).filter(([k]) => k.startsWith("01-")).map(([, v]) => v.fajr);
const j = Object.entries(perp).filter(([k]) => k.startsWith("07-")).map(([, v]) => v.fajr);
console.log("amplitude fajr jan", Math.min(...f), Math.max(...f), "jul", Math.min(...j), Math.max(...j));
fs.writeFileSync("data/fit-awqaf-recipes.json", JSON.stringify(out, null, 1));
