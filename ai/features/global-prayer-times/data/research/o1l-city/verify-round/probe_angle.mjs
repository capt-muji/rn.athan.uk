import { adhan, rawTimes, parseHM, readJSON } from "./lib.mjs";
const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const rows = readJSON(`${W}/saudi-cities/data/sa-arar-rows.json`);
const c = { lat: 30.99, lon: 41.02 };
const isos = Object.keys(rows).sort();
function fajrAt(iso, ang) {
  const p = new adhan.CalculationParameters("Other", ang, 18);
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  return rawTimes({ lat: c.lat, lon: c.lon, iso, tz: "Asia/Riyadh", params: p }).fajr / 60;
}
const picks = ["2026-06-16", "2026-08-15", "2026-09-23", "2026-10-15", "2026-12-21", "2027-01-15", "2027-03-21", "2027-04-15", "2027-06-21"];
for (const iso of picks) {
  const target = parseHM(rows[iso].fajr);
  let lo = 12, hi = 22, best = null;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    const v = fajrAt(iso, mid);
    if (v > target) lo = mid; // deeper angle = earlier = smaller value? check monotonic
    else hi = mid;
  }
  // monotonicity check
  const a1 = fajrAt(iso, 17), a2 = fajrAt(iso, 20);
  best = (lo + hi) / 2;
  console.log(iso, "printed", target, "implied angle", best.toFixed(3), `| f@17=${a1.toFixed(1)} f@20=${a2.toFixed(1)}`);
}
