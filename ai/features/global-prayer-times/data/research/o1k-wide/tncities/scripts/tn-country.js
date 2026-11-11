// Countrywide test: per-city fits, one joint recipe, and the frozen deep2 Tunis recipe at every city.
// Run: TZ=Africa/Tunis node tn-country.js
const L = require("./lib");
const E = require("./engine");
const fs = require("fs");

const W = process.env.HOME + "/athan-gitree/census/o1k-wide/tncities";
const DEEP2 = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2/data";
const NA2 = process.env.HOME + "/athan-gitree/census/o1k-wide/northafrica2/data";
const YEARS = (process.env.YEARS || "2020,2021,2022,2023,2024,2025,2026").split(",");

const CITIES = {
  tunis: { lat: 36.8, lng: 10.183, bank: DEEP2 },
  kairouan: { lat: 35.677, lng: 10.097, bank: `${W}/data` },
  gafsa: { lat: 34.421, lng: 8.787, bank: `${W}/data` },
  sfax: { lat: 34.733, lng: 10.75, bank: `${W}/data` },
};

const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

const data = {};
for (const [city, cfg] of Object.entries(CITIES)) {
  const rows = {};
  for (const y of YEARS) {
    let src;
    if (city === "tunis") {
      try { src = require(`${DEEP2}/tn-inm-tunis-${y}.json`); }
      catch { src = require(`${NA2}/tn-inm-tunis-${y}.json`); }
    } else {
      src = require(`${cfg.bank}/tn-inm-${city}-${y}.json`);
    }
    for (const [d, v] of Object.entries(src)) {
      if (!v || !v.fajr || !v.dhuhr || !v.asr || !v.magrib || !v.isha) continue;
      rows[d] = { fajr: toMin(v.fajr), dhuhr: toMin(v.dhuhr), asr: toMin(v.asr), maghrib: toMin(v.magrib), isha: toMin(v.isha) };
    }
  }
  data[city] = { ...cfg, rows, days: Object.keys(rows).sort(), c: L.coords(cfg.lat, cfg.lng) };
  data[city].TH = {};
  data[city].TS = {};
  for (const d of data[city].days) {
    data[city].TH[d] = L.times(data[city].c, { fajrAngle: 18, ishaAngle: 18, madhab: "hanafi" }, d);
    data[city].TS[d] = L.times(data[city].c, { fajrAngle: 18, ishaAngle: 18, madhab: "shafi" }, d);
  }
  console.log(city, data[city].days.length, "rows", data[city].days[0], "..", data[city].days[data[city].days.length - 1]);
}

// one angle table per city (coarse), read as a lookup by both the per-city and the joint fit
const COARSE = E.grid(14, 22, 0.1);
function angleTab(city) {
  const t = { fajr: {}, isha: {} };
  for (const th of COARSE) {
    t.fajr[th] = {}; t.isha[th] = {};
    for (const d of data[city].days) {
      const x = L.times(data[city].c, { fajrAngle: th, ishaAngle: th, madhab: "shafi" }, d);
      t.fajr[th][d] = x.fajr;
      t.isha[th][d] = x.isha;
    }
  }
  return t;
}
for (const city of Object.keys(data)) data[city].TAB = angleTab(city);

function fitAngleCity(city, key, printedKey) {
  return E.fitAngle(data[city].TAB[key], data[city].days, (d) => data[city].rows[d][printedKey], [-3, -2, -1, 0, 1, 2, 3]);
}

// joint angle fit: same constant judged across every city at that city's own geometry
function fitAngleJoint(key, printedKey) {
  let best = { score: -Infinity };
  for (const th of COARSE) {
    for (const mode of E.MODES) {
      for (const pad of [-3, -2, -1, 0, 1, 2, 3]) {
        let exact = 0, w1 = 0, sum = 0, n = 0;
        for (const city of Object.keys(data)) {
          for (const d of data[city].days) {
            const p = data[city].rows[d][printedKey];
            const m = L.roundMin(data[city].TAB[key][th][d], pad, mode);
            const dev = Math.abs(p - m);
            n++; sum += dev;
            if (dev === 0) exact++;
            if (dev <= 1) w1++;
          }
        }
        const r = exact * 1e6 + w1 * 1e3 - sum / n;
        if (r > best.score) best = { score: r, theta: th, pad, mode, s: { n, exact, w1, mae: sum / n } };
      }
    }
  }
  return best;
}

const out = { meta: { tz: "Africa/Tunis", rows: Object.values(data).reduce((a, c) => a + c.days.length, 0), years: YEARS }, cities: {}, joint: {} };

for (const city of Object.keys(data)) {
  const days = data[city].days;
  const printed = (k) => (d) => data[city].rows[d][k];
  const p = {};
  const f = fitAngleCity(city, "fajr", "fajr");
  const i = fitAngleCity(city, "isha", "isha");
  p.fajr = { theta: f.theta, pad: f.pad, mode: f.mode, s: f.s };
  p.isha = { theta: i.theta, pad: i.pad, mode: i.mode, s: i.s };
  const dh = E.fitFixed((d) => data[city].TH[d].dhuhr, days, printed("dhuhr"), [3, 4, 5, 6, 7, 8, 9], E.MODES);
  p.dhuhr = { pad: dh.pad, mode: dh.mode, s: dh.s };
  const mg = E.fitFixed((d) => data[city].TH[d].maghrib, days, printed("maghrib"), [-1, 0, 1, 2, 3, 4, 5], E.MODES);
  p.maghrib = { pad: mg.pad, mode: mg.mode, s: mg.s };
  const aS = E.fitFixed((d) => data[city].TS[d].asr, days, printed("asr"), [-3, -2, -1, 0, 1, 2, 3], E.MODES);
  const aH = E.fitFixed((d) => data[city].TH[d].asr, days, printed("asr"), [-3, -2, -1, 0, 1, 2, 3], E.MODES);
  p.asr_shafi = { pad: aS.pad, mode: aS.mode, s: aS.s };
  p.asr_hanafi = { pad: aH.pad, mode: aH.mode, s: aH.s };
  out.cities[city] = { meta: { lat: CITIES[city].lat, lng: CITIES[city].lng, rows: days.length, first: days[0], last: days[days.length - 1] }, prayers: p };

  // seasonal amplitude of the twilight residual under each city's own best constant
  for (const [k, ref] of [["fajr", (d) => data[city].TAB.fajr[f.theta][d]], ["isha", (d) => data[city].TAB.isha[i.theta][d]]]) {
    out.cities[city].prayers[k].amplitude = E.amplitude(ref, days, printed(k), p[k].pad, p[k].mode);
  }
}

out.joint.fajr = fitAngleJoint("fajr", "fajr");
out.joint.isha = fitAngleJoint("isha", "isha");
{
  // margins jointly: dhuhr and maghrib pads that serve all four cities at once
  const jointFixed = (refKey, printedKey, pads) => {
    let best = { score: -Infinity };
    for (const mode of E.MODES) for (const pad of pads) {
      let exact = 0, w1 = 0, sum = 0, n = 0;
      for (const city of Object.keys(data)) for (const d of data[city].days) {
        const p = data[city].rows[d][printedKey];
        const m = L.roundMin(data[city][refKey][d][printedKey], pad, mode);
        const dev = Math.abs(p - m);
        n++; sum += dev;
        if (dev === 0) exact++;
        if (dev <= 1) w1++;
      }
      const r = exact * 1e6 + w1 * 1e3 - sum / n;
      if (r > best.score) best = { score: r, pad, mode, s: { n, exact, w1, mae: sum / n } };
    }
    return best;
  };
  out.joint.dhuhr = jointFixed("TH", "dhuhr", [3, 4, 5, 6, 7, 8, 9]);
  out.joint.maghrib = jointFixed("TH", "maghrib", [-1, 0, 1, 2, 3, 4, 5]);
  out.joint.asr_shafi = jointFixed("TS", "asr", [-3, -2, -1, 0, 1, 2, 3]);
}

// the frozen deep2 Tunis recipe, read two ways where the report itself carries two readings of asr
function evalFrozen(asrMode) {
  const perCity = {};
  let allExact = 0, allW1 = 0, n = 0;
  for (const city of Object.keys(data)) {
    const days = data[city].days;
    const s = { n: 0, allExact: 0, allW1: 0, perYear: {}, perPrayer: {}, residuals: {} };
    for (const d of days) {
      const T = data[city].TH[d], S = data[city].TS[d];
      const m = {
        fajr: L.roundMin(data[city].TAB.fajr[18.1][d], 0, "round"),
        dhuhr: L.roundMin(T.dhuhr, 7, "round"),
        asr: L.roundMin(S.asr, 0, asrMode),
        maghrib: L.roundMin(T.maghrib, 3, "floor"),
        isha: L.roundMin(data[city].TAB.isha[18.1][d], 0, "round"),
      };
      const r = data[city].rows[d];
      const ex = Object.keys(m).every((k) => m[k] === r[k]);
      const w1 = Object.keys(m).every((k) => Math.abs(m[k] - r[k]) <= 1);
      const w2 = Object.keys(m).every((k) => Math.abs(m[k] - r[k]) <= 2);
      const w3 = Object.keys(m).every((k) => Math.abs(m[k] - r[k]) <= 3);
      s.n++; n++;
      if (ex) { s.allExact++; allExact++; }
      if (w1) { s.allW1++; allW1++; }
      if (w2) s.allW2 = (s.allW2 || 0) + 1;
      if (w3) s.allW3 = (s.allW3 || 0) + 1;
      const y = d.slice(0, 4);
      const ys = (s.perYear[y] = s.perYear[y] || { n: 0, allExact: 0, allW1: 0 });
      ys.n++;
      if (ex) ys.allExact++;
      if (w1) ys.allW1++;
      for (const k of Object.keys(m)) {
        const pp = (s.perPrayer[k] = s.perPrayer[k] || { n: 0, exact: 0, w1: 0, sum: 0, max: 0 });
        const dev = Math.abs(m[k] - r[k]);
        pp.n++;
        if (dev === 0) pp.exact++;
        if (dev <= 1) pp.w1++;
        pp.sum += dev;
        if (dev > pp.max) pp.max = dev;
        (s.residuals[k] = s.residuals[k] || {})[d] = m[k] - r[k];
      }
    }
    perCity[city] = s;
  }
  return { asrMode, allFiveExact: allExact, allFiveWithin1: allW1, n, perCity };
}
out.frozen = [evalFrozen("floor"), evalFrozen("round")];

// between-year identity: for each calendar date, do all seven years print the same five values?
{
  const same = {}, differ = {}, maxDiff = {};
  for (const city of Object.keys(data)) {
    const byDate = {};
    for (const d of data[city].days) (byDate[d.slice(5)] = byDate[d.slice(5)] || []).push(d);
    let ident = 0, total = 0, worst = 0;
    for (const ds of Object.values(byDate)) {
      if (ds.length < 2) continue;
      total++;
      const vals = ds.map((d) => ["fajr", "dhuhr", "asr", "maghrib", "isha"].map((k) => data[city].rows[d][k]));
      let allSame = true, dmax = 0;
      for (const k of [0, 1, 2, 3, 4]) {
        const lo = Math.min(...vals.map((v) => v[k])), hi = Math.max(...vals.map((v) => v[k]));
        if (hi !== lo) allSame = false;
        dmax = Math.max(dmax, hi - lo);
      }
      if (allSame) ident++;
      worst = Math.max(worst, dmax);
    }
    same[city] = ident;
    differ[city] = { dates: total, identicalAllYears: ident, worstSpreadMinutes: worst };
  }
  out.betweenYear = differ;
}

fs.writeFileSync(`${W}/tn-country.json`, JSON.stringify(out, null, 1));

console.log("\nPer-city fitted constants");
for (const [city, v] of Object.entries(out.cities)) {
  console.log(` ${city}: fajr ${v.prayers.fajr.theta} pad ${v.prayers.fajr.pad} ${v.prayers.fajr.mode} (${E.fmt(v.prayers.fajr.s)}) | isha ${v.prayers.isha.theta} pad ${v.prayers.isha.pad} ${v.prayers.isha.mode} (${E.fmt(v.prayers.isha.s)})`);
  console.log(`   dhuhr +${v.prayers.dhuhr.pad} ${v.prayers.dhuhr.mode} (${E.fmt(v.prayers.dhuhr.s)}) | maghrib +${v.prayers.maghrib.pad} ${v.prayers.maghrib.mode} (${E.fmt(v.prayers.maghrib.s)}) | asr shafi +${v.prayers.asr_shafi.pad} ${v.prayers.asr_shafi.mode} (${E.fmt(v.prayers.asr_shafi.s)}) | amplitude fajr ${v.prayers.fajr.amplitude.peakToPeak} isha ${v.prayers.isha.amplitude.peakToPeak}`);
}
console.log("\nJoint fit across all four cities");
for (const [k, v] of Object.entries(out.joint)) {
  console.log(` ${k}: theta ${v.theta ?? "-"} pad ${v.pad} ${v.mode} exact ${(100 * v.s.exact / v.s.n).toFixed(1)}% w1 ${(100 * v.s.w1 / v.s.n).toFixed(1)}% mae ${v.s.mae.toFixed(2)}`);
}
for (const r of out.frozen) {
  console.log(`\nFrozen recipe, asr ${r.asrMode}: all five within 1 on ${r.allFiveWithin1}/${r.n} (${(100 * r.allFiveWithin1 / r.n).toFixed(1)}%), exact ${r.allFiveExact}/${r.n} (${(100 * r.allFiveExact / r.n).toFixed(1)}%)`);
  for (const [city, s] of Object.entries(r.perCity)) {
    console.log(`  ${city.padEnd(9)} all-five w1 ${(100 * s.allW1 / s.n).toFixed(1)}% w2 ${(100 * (s.allW2 || 0) / s.n).toFixed(1)}% w3 ${(100 * (s.allW3 || 0) / s.n).toFixed(1)}% exact ${(100 * s.allExact / s.n).toFixed(1)}% | ` +
      Object.entries(s.perPrayer).map(([k, v]) => `${k} ${(100 * v.w1 / v.n).toFixed(1)}/${(100 * v.exact / v.n).toFixed(1)} max${v.max}`).join(" "));
    console.log(`             by year ` + Object.keys(s.perYear).map((y) => `${y} ${(100 * s.perYear[y].allW1 / s.perYear[y].n).toFixed(1)}%`).join(" "));
  }
}

// residual structure: is a city's shortfall a constant offset or a seasonal term?
for (const r of out.frozen.filter((x) => x.asrMode === "round")) {
  for (const [city, s] of Object.entries(r.perCity)) {
    const line = [];
    for (const [k, res] of Object.entries(s.residuals)) {
      const vals = Object.entries(res);
      const mean = vals.reduce((a, [, v]) => a + v, 0) / vals.length;
      const sd = Math.sqrt(vals.reduce((a, [, v]) => a + (v - mean) ** 2, 0) / vals.length);
      const months = {};
      for (const [d, v] of vals) (months[d.slice(5, 7)] = months[d.slice(5, 7)] || []).push(v);
      const med = Object.values(months).map((a) => {
        const b = a.slice().sort((x, y) => x - y);
        return +b[Math.floor(b.length / 2)].toFixed(1);
      });
      line.push(`${k} mean ${mean.toFixed(2)} sd ${sd.toFixed(2)} byMonth ${med.join(",")}`);
    }
    console.log(`\nresiduals ${city} (frozen recipe, asr round)`);
    for (const l of line) console.log("   " + l);
  }
}
console.log("\nBetween-year identity:", JSON.stringify(out.betweenYear));
