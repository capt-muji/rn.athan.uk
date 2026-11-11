import { adhan, rawTimes, score, parseHM, readJSON } from "./lib.mjs";
const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const cities = readJSON(`${W}/saudi-cities/data/cities.json`).cities;
const c = cities.find((x) => x.name === "arar");
const rows = readJSON(`${W}/saudi-cities/data/sa-arar-rows.json`);
const p = new adhan.CalculationParameters("Other", 18.5, 18);
p.rounding = adhan.Rounding.None;
p.madhab = adhan.Madhab.Shafi;
p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
const isos = Object.keys(rows).sort();
const hist = {};
const samples = [];
for (const iso of isos) {
  const raw = rawTimes({ lat: c.lat, lon: c.lon, iso, tz: "Asia/Riyadh", params: p });
  const r = +(Math.floor(raw.fajr / 60 + 1) - parseHM(rows[iso].fajr)).toFixed(2);
  hist[r] = (hist[r] || 0) + 1;
  if (samples.length < 8 || iso.startsWith("2027-01")) {
    samples.push([iso, (raw.fajr / 60).toFixed(4), rows[iso].fajr, (raw.sunrise / 60).toFixed(4), rows[iso].sunrise]);
  }
}
console.log("hist", JSON.stringify(hist));
for (const s of samples.slice(0, 14)) console.log(s.join("  "));
