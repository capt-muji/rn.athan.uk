import { adhan, rawTimes, score, parseHM, readJSON, pct, ROUND } from "./lib.mjs";
const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const d = readJSON(`${W}/indonesia-cities/data/sihat-2026-jakarta-pusat.json`);
const p = new adhan.CalculationParameters("Other", 20, 18);
p.rounding = adhan.Rounding.None;
p.madhab = adhan.Madhab.Shafi;
p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
const isos = Object.keys(d.rows).sort();
const raw = isos.map((iso) => rawTimes({ lat: d.lat, lon: d.lng, iso, tz: d.tz, params: p }));
const variants = {
  "floor(raw+2)": (r) => Math.floor(r.fajr / 60 + 2),
  "round(raw+2)": (r) => Math.round(r.fajr / 60 + 2),
  "round(raw)+2": (r) => Math.round(r.fajr / 60) + 2,
  "ceil(raw+2)": (r) => Math.ceil(r.fajr / 60 + 2),
  "floor(raw+1.5)": (r) => Math.floor(r.fajr / 60 + 1.5),
  "floor(raw+2.5)": (r) => Math.floor(r.fajr / 60 + 2.5),
};
for (const [name, f] of Object.entries(variants)) {
  const s = score(raw.map((r, i) => ({ model: f(r), printed: parseHM(d.rows[isos[i]].fajr) })));
  console.log(name.padEnd(16), "exact", pct(s.exact, s.n).toFixed(1), "within1", pct(s.w1, s.n).toFixed(2), "MAE", s.mae.toFixed(3));
}
console.log("\nraw fractional parts (first 10):", raw.slice(0, 10).map((r) => (r.fajr / 60).toFixed(3)).join(" "));
console.log("printed fajr (first 10):", isos.slice(0, 10).map((i) => d.rows[i].fajr).join(" "));
