// How much does the Egyptian verdict depend on the coordinate pair chosen? Offsets of 0.2 degrees.
// Run: TZ=Africa/Cairo node eg-sensitivity.js
const L = require("./lib");
const fs = require("fs");

const W = process.env.HOME + "/athan-gitree/census/o1k-wide/tncities";
const CITIES = {
  portsaid: { lat: 31.2653, lng: 32.3019 },
  luxor: { lat: 25.6872, lng: 32.6396 },
  assiut: { lat: 27.1809, lng: 31.1837 },
};
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
const OFFSETS = [[0, 0], [0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2], [0.2, 0.2], [-0.2, -0.2]];

for (const [key, cfg] of Object.entries(CITIES)) {
  const src = require(`${W}/data/eg-esa-${key}-2026.json`);
  const days = Object.keys(src).sort();
  const rows = Object.fromEntries(days.map((d) => [d, Object.fromEntries(COLS.map((k) => [k, toMin(src[d][k === "maghrib" ? "magrib" : k])]))]));
  console.log(key);
  for (const [dlat, dlng] of OFFSETS) {
    const c = L.coords(cfg.lat + dlat, cfg.lng + dlng);
    let w1 = 0, worst = 0, bias = 0;
    for (const d of days) {
      const t = L.times(c, { fajrAngle: 19.5, ishaAngle: 17.5, madhab: "shafi" }, d);
      let devMax = 0;
      for (const k of COLS) {
        const dev = Math.abs(L.roundMin(t[k], 0, "round") - rows[d][k]);
        bias += L.roundMin(t[k], 0, "round") - rows[d][k];
        if (dev > devMax) devMax = dev;
      }
      if (devMax <= 1) w1++;
      if (devMax > worst) worst = devMax;
    }
    console.log(`  dlat ${dlat.toFixed(1)} dlng ${dlng.toFixed(1)}: all six within1 ${w1}/${days.length}, worst ${worst}, mean signed ${(bias / (days.length * COLS.length)).toFixed(2)}`);
  }
}
