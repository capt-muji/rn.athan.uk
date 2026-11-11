// Tunisia INM fit: one recipe across 2020-2026.
// Run: TZ=Africa/Tunis node scripts/tn-deep.js
const L = require("./lib");
const E = require("./engine");
const fs = require("fs");

const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";
const BANK = process.env.HOME + "/athan-gitree/census/o1k-wide/northafrica2/data";
const LAT = 36.8, LNG = 10.183;

const rows = {};
for (const y of [2020, 2021, 2022, 2023, 2024, 2025, 2026]) {
  let src;
  try { src = require(`${W}/data/tn-inm-tunis-${y}.json`); }
  catch { src = require(`${BANK}/tn-inm-tunis-${y}.json`); }
  for (const [d, v] of Object.entries(src)) {
    if (!v || !v.fajr || !v.dhuhr || !v.asr || !v.magrib || !v.isha) continue;
    const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
    rows[d] = { fajr: toMin(v.fajr), dhuhr: toMin(v.dhuhr), asr: toMin(v.asr), maghrib: toMin(v.magrib), isha: toMin(v.isha) };
  }
}
const days = Object.keys(rows).sort();
const years = [...new Set(days.map((d) => d.slice(0, 4)))];
const c = L.coords(LAT, LNG);
const printed = (k) => (d) => rows[d][k];

const coarse = E.grid(14, 22, 0.05);
const TAB_F = E.angleTable(c, days, coarse, "fajr");
const TAB_I = E.angleTable(c, days, coarse, "isha");
const TH = {}, TS = {};
for (const d of days) {
  TH[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: "hanafi" }, d);
  TS[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: "shafi" }, d);
}

const out = { meta: { city: "Tunis", lat: LAT, lng: LNG, tz: "Africa/Tunis", rows: days.length, first: days[0], last: days[days.length - 1], years }, prayers: {} };

const fajr = E.fitAngle(TAB_F, days, printed("fajr"), [-3, -2, -1, 0, 1, 2, 3]);
out.prayers.fajr = { rule: "angle", theta: fajr.theta, pad: fajr.pad, mode: fajr.mode, score: fajr.s };
const isha = E.fitAngle(TAB_I, days, printed("isha"), [-3, -2, -1, 0, 1, 2, 3]);
out.prayers.isha = { rule: "angle", theta: isha.theta, pad: isha.pad, mode: isha.mode, score: isha.s };
const dhuhr = E.fitFixed((d) => TH[d].dhuhr, days, printed("dhuhr"), [3, 4, 5, 6, 7, 8, 9], E.MODES);
out.prayers.dhuhr = { rule: "noon+pad", pad: dhuhr.pad, mode: dhuhr.mode, score: dhuhr.s };
const asrH = E.fitFixed((d) => TH[d].asr, days, printed("asr"), [-3, -2, -1, 0, 1, 2, 3], E.MODES);
const asrS = E.fitFixed((d) => TS[d].asr, days, printed("asr"), [-3, -2, -1, 0, 1, 2, 3], E.MODES);
out.prayers.asr_hanafi = { rule: "shadow", pad: asrH.pad, mode: asrH.mode, score: asrH.s };
out.prayers.asr_shafi = { rule: "shadow", pad: asrS.pad, mode: asrS.mode, score: asrS.s };
const maghrib = E.fitFixed((d) => TH[d].maghrib, days, printed("maghrib"), [-1, 0, 1, 2, 3, 4, 5], E.MODES);
out.prayers.maghrib = { rule: "sunset+pad", pad: maghrib.pad, mode: maghrib.mode, score: maghrib.s };

// the held recipe, evaluated as one five-prayer block
// two recipes evaluated as one five-prayer block: the held one and the refined one
function evalRecipe(name, cfg) {
  const fajrRef = cfg.theta === 18 ? (d) => TH[d].fajr : (d) => TAB_F[cfg.theta][d];
  const ishaRef = cfg.theta === 18 ? (d) => TH[d].isha : (d) => TAB_I[cfg.theta][d];
  const model = (d) => ({
    fajr: L.roundMin(fajrRef(d), 0, cfg.fajr),
    dhuhr: L.roundMin(TH[d].dhuhr, cfg.dhuhrPad, cfg.dhuhr),
    asr: L.roundMin(TS[d].asr, 0, cfg.asr),
    maghrib: L.roundMin(TH[d].maghrib, cfg.maghribPad, cfg.maghrib),
    isha: L.roundMin(ishaRef(d), 0, cfg.isha),
  });
  const perYear = {};
  let allExact = 0, allW1 = 0;
  for (const d of days) {
    const m = model(d);
    const ex = Object.keys(m).every((k) => m[k] === rows[d][k]);
    const w1 = Object.keys(m).every((k) => Math.abs(m[k] - rows[d][k]) <= 1);
    if (ex) allExact++;
    if (w1) allW1++;
    const y = d.slice(0, 4);
    perYear[y] = perYear[y] || { n: 0, allExact: 0, allW1: 0, perPrayer: {} };
    perYear[y].n++;
    if (ex) perYear[y].allExact++;
    if (w1) perYear[y].allW1++;
    for (const k of Object.keys(m)) {
      const s = (perYear[y].perPrayer[k] = perYear[y].perPrayer[k] || { n: 0, exact: 0, w1: 0, sum: 0 });
      s.n++;
      const dev = Math.abs(m[k] - rows[d][k]);
      if (dev === 0) s.exact++;
      if (dev <= 1) s.w1++;
      s.sum += dev;
    }
  }
  return { name, cfg, allFiveExact: allExact, allFiveWithin1: allW1, n: days.length, perYear };
}

out.recipes = [
  evalRecipe("held", { theta: 18, fajr: "floor", dhuhr: "floor", asr: "floor", maghrib: "ceil", isha: "ceil", dhuhrPad: 7, maghribPad: 2 }),
  evalRecipe("round-all@18", { theta: 18, fajr: "round", dhuhr: "round", asr: "round", maghrib: "round", isha: "round", dhuhrPad: 7, maghribPad: 2 }),
  evalRecipe("round-all@18.1", { theta: 18.1, fajr: "round", dhuhr: "round", asr: "round", maghrib: "round", isha: "round", dhuhrPad: 7, maghribPad: 2 }),
  evalRecipe("fitted", { theta: 18.1, fajr: "round", dhuhr: "round", asr: "floor", maghrib: "floor", isha: "round", dhuhrPad: 7, maghribPad: 3 }),
];

// per-year + amplitude for the fitted single-prayer forms
for (const [name, ref, key] of [
  ["fajr", (d) => TAB_F[fajr.theta][d], "fajr"],
  ["isha", (d) => TAB_I[isha.theta][d], "isha"],
  ["dhuhr", (d) => TH[d].dhuhr, "dhuhr"],
  ["asr_shafi", (d) => TS[d].asr, "asr"],
  ["maghrib", (d) => TH[d].maghrib, "maghrib"],
]) {
  const p = out.prayers[name];
  p.perYear = E.perYear(ref, days, printed(key), p.pad, p.mode);
  p.amplitude = E.amplitude(ref, days, printed(key), p.pad, p.mode);
}

// per-year refit: does one recipe hold every year?
{
  const stab = {};
  for (const y of years) {
    const yd = days.filter((d) => d.startsWith(y));
    const f = E.fitAngle(TAB_F, yd, printed("fajr"), [-2, -1, 0, 1, 2]);
    const i = E.fitAngle(TAB_I, yd, printed("isha"), [-2, -1, 0, 1, 2]);
    const dh = E.fitFixed((d) => TH[d].dhuhr, yd, printed("dhuhr"), [4, 5, 6, 7, 8], E.MODES);
    const mg = E.fitFixed((d) => TH[d].maghrib, yd, printed("maghrib"), [0, 1, 2, 3], E.MODES);
    const a = E.fitFixed((d) => TS[d].asr, yd, printed("asr"), [-2, -1, 0, 1, 2], E.MODES);
    stab[y] = { fajrTheta: f.theta, fajrPad: f.pad, fajrMode: f.mode, ishaTheta: i.theta, ishaPad: i.pad, ishaMode: i.mode, dhuhrPad: dh.pad, dhuhrMode: dh.mode, maghribPad: mg.pad, maghribMode: mg.mode, asrPad: a.pad, asrMode: a.mode };
  }
  out.stability = stab;
}

fs.writeFileSync(`${W}/tn-deep.json`, JSON.stringify(out, null, 1));
console.log("rows", days.length, days[0], days[days.length - 1], "years", years.join(","));
for (const [k, v] of Object.entries(out.prayers)) console.log(k.padEnd(12), `theta ${v.theta ?? "-"} pad ${v.pad} ${v.mode}`.padEnd(30), E.fmt(v.score));
for (const r of out.recipes) {
  console.log(`${r.name}: all-five exact ${r.allFiveExact}/${r.n} (${(100 * r.allFiveExact / r.n).toFixed(1)}%) within1 ${r.allFiveWithin1}/${r.n} (${(100 * r.allFiveWithin1 / r.n).toFixed(1)}%)`);
  for (const y of years) {
    const s = r.perYear[y];
    console.log(`  ${y} n ${s.n} allFiveExact ${s.allExact} allFiveW1 ${s.allW1}  ` + Object.entries(s.perPrayer).map(([k, v]) => `${k} ${v.exact}/${v.n} (${(v.sum / v.n).toFixed(2)})`).join(" "));
  }
}
console.log("stability", JSON.stringify(out.stability));
