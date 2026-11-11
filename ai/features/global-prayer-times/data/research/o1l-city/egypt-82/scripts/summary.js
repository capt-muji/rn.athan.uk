// Summary: per-column exact/within-1, seasonal amplitude, and the single-fixed-point test.
const fs = require("fs");
const L = require("./lib");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/egypt-82";
const fit = JSON.parse(fs.readFileSync(W + "/data/fit82.json", "utf8"));
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const RECIPE = { fajrAngle: 19.5, ishaAngle: 17.5, madhab: "shafi" };
const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

const rows = [];
for (const i of Object.keys(fit).sort((a, b) => a - b)) {
  const f = fit[i];
  if (f.atImplied.n === 0) { rows.push({ i: +i, key: f.key, empty: true }); continue; }
  const src = JSON.parse(fs.readFileSync(`${W}/data/eg-esa-${String(i).padStart(2, "0")}-2026.json`, "utf8"));
  const days = Object.keys(src).sort();
  const fajrJan = Math.min(...days.filter((d) => d.startsWith("2026-01")).map((d) => toMin(src[d].fajr)));
  const fajrJul = Math.min(...days.filter((d) => d.startsWith("2026-07")).map((d) => toMin(src[d].fajr)));
  const ishaJan = Math.max(...days.filter((d) => d.startsWith("2026-01")).map((d) => toMin(src[d].isha)));
  const ishaJul = Math.max(...days.filter((d) => d.startsWith("2026-07")).map((d) => toMin(src[d].isha)));
  rows.push({
    i: +i, key: f.key, n: f.atImplied.n, lat: f.implied.lat, lng: f.implied.lng,
    allSixW1: f.atImplied.allSixW1, allSixExact: f.atImplied.allSixExact,
    exactPct: +(f.atImplied.allSixExact / f.atImplied.n * 100).toFixed(1),
    per: f.atImplied.per, gazW1: f.atGazetteer ? f.atGazetteer.allSixW1 : null,
    spanKm: f.spanKm,
    amp: { fajr: Math.abs(fajrJul - fajrJan), isha: Math.abs(ishaJul - ishaJan) },
  });
}
// single fixed Cairo point vs each city
const cCairo = L.coords(fit["0"].implied.lat, fit["0"].implied.lng);
const fixedPoint = rows.filter((r) => !r.empty).slice(0, 1)[0];
let fixedWorst = [];
for (const r of rows.filter((x) => !x.empty)) {
  const src = JSON.parse(fs.readFileSync(`${W}/data/eg-esa-${String(r.i).padStart(2, "0")}-2026.json`, "utf8"));
  const days = Object.keys(src).sort();
  let w1 = 0, worst = 0;
  for (const d of days) {
    const t = L.times(cCairo, RECIPE, d);
    let ok = true;
    for (const k of COLS) {
      const m = L.roundMin(t[k], 0, "round");
      const v = toMin(src[d][k === "maghrib" ? "magrib" : k]);
      if (Math.abs(m - v) > 1) ok = false;
      worst = Math.max(worst, Math.abs(m - v));
    }
    if (ok) w1++;
  }
  r.cairoFixedW1 = w1; r.cairoFixedWorst = worst;
}

const data = rows.filter((r) => !r.empty);
const tot = data.reduce((a, r) => a + r.n, 0);
const totW1 = data.reduce((a, r) => a + r.allSixW1, 0);
const totExact = data.reduce((a, r) => a + r.allSixExact, 0);
const mAmp = (k) => Math.min(...data.map((r) => r.amp[k])) + "-" + Math.max(...data.map((r) => r.amp[k]));
console.log(`cities with data ${data.length}, day-rows ${tot}`);
console.log(`all six <=1 min: ${totW1}/${tot} (${(totW1 / tot * 100).toFixed(2)}%), all six exact ${totExact} (${(totExact / tot * 100).toFixed(1)}%)`);
console.log(`latitude ${Math.min(...data.map((r) => r.lat))}..${Math.max(...data.map((r) => r.lat))}, longitude ${Math.min(...data.map((r) => r.lng))}..${Math.max(...data.map((r) => r.lng))}`);
console.log(`fajr month amplitude ${mAmp("fajr")} min, isha ${mAmp("isha")} min`);
for (const k of COLS) {
  const ex = data.reduce((a, r) => a + r.per[k].exact, 0);
  const w1 = data.reduce((a, r) => a + r.per[k].w1, 0);
  const n = data.reduce((a, r) => a + r.per[k].n, 0);
  const mae = data.reduce((a, r) => a + r.per[k].mae * r.per[k].n, 0) / n;
  const sgn = data.reduce((a, r) => a + r.per[k].signed * r.per[k].n, 0) / n;
  console.log(`  ${k.padEnd(8)} exact ${(ex / n * 100).toFixed(1)}%  <=1 ${(w1 / n * 100).toFixed(2)}%  mae ${mae.toFixed(2)}  signed ${sgn.toFixed(2)}`);
}
console.log(`fixed Cairo point as every city: worst-city within1 days min ${Math.min(...data.map((r) => r.cairoFixedW1))}, worst deviation ${Math.max(...data.map((r) => r.cairoFixedWorst))} min`);
fs.writeFileSync(W + "/data/summary82.json", JSON.stringify({ rows, totals: { cities: data.length, days: tot, w1: totW1, exact: totExact } }, null, 1));
