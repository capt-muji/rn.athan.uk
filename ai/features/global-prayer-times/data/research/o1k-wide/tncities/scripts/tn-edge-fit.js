// The frozen recipe at the country's latitude ends and at a high-elevation city.
// Run: TZ=Africa/Tunis node tn-edge-fit.js
const L = require("./lib");
const fs = require("fs");

const W = process.env.HOME + "/athan-gitree/census/o1k-wide/tncities";
const SITES = ["bizerte", "benguerdene", "kasserine"];
const COLS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

for (const city of SITES) {
  const src = require(`${W}/data/tn-inm-${city}-edge.json`);
  const days = Object.keys(src).sort();
  const lat = Number(src[days[0]].lat), lng = Number(src[days[0]].lng);
  const c = L.coords(lat, lng);
  const stats = {};
  let w1 = 0;
  for (const d of days) {
    const T = L.times(c, { fajrAngle: 18.1, ishaAngle: 18.1, madhab: "shafi" }, d);
    const m = {
      fajr: L.roundMin(T.fajr, 0, "round"),
      dhuhr: L.roundMin(T.dhuhr, 7, "round"),
      asr: L.roundMin(T.asr, 0, "round"),
      maghrib: L.roundMin(T.maghrib, 3, "floor"),
      isha: L.roundMin(T.isha, 0, "round"),
    };
    const r = Object.fromEntries(COLS.map((k) => [k, toMin(src[d][k === "maghrib" ? "magrib" : k])]));
    if (COLS.every((k) => Math.abs(m[k] - r[k]) <= 1)) w1++;
    for (const k of COLS) {
      const s = (stats[k] = stats[k] || { n: 0, sum: 0, max: 0 });
      const res = m[k] - r[k];
      s.n++; s.sum += res;
      if (Math.abs(res) > s.max) s.max = Math.abs(res);
    }
  }
  const dipDeg = Math.abs(stats.fajr.sum / stats.fajr.n) * 0.25 * Math.cos((lat * Math.PI) / 180);
  const impliedM = (6371000 / 2) * (dipDeg * Math.PI / 180) ** 2;
  // what twilight angle absorbs the city's offset? (elevation shows up as a larger depression angle)
  let best = { rank: -Infinity };
  for (let th = 17; th <= 21.001; th += 0.05) {
    const theta = +th.toFixed(2);
    const s = L.score(days.map((d) => {
      const printedFajr = toMin(src[d].fajr);
      const model = L.roundMin(L.times(c, { fajrAngle: theta, ishaAngle: theta, madhab: "shafi" }, d).fajr, 0, "round");
      return [printedFajr, model];
    }));
    const r = s.exact * 1e6 + s.w1 * 1e3 - s.mae;
    if (r > best.rank) best = { rank: r, theta, s };
  }
  console.log(`${city} ${lat},${lng} ${days.length} rows ${days[0]}..${days[days.length - 1]}`);
  console.log("  " + COLS.map((k) => `${k} mean ${(stats[k].sum / stats[k].n).toFixed(2)} max ${stats[k].max}`).join(" | "));
  console.log(`  all five within 1: ${w1}/${days.length}; implied horizon dip ${dipDeg.toFixed(3)} deg, implied elevation ${impliedM.toFixed(0)} m; fajr angle absorbing it ${best.theta} deg (${(100 * best.s.w1 / best.s.n).toFixed(1)}% within 1)`);
}
