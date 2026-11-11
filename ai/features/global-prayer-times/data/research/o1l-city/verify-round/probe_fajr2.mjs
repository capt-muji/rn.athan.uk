import { adhan, rawTimes, score, parseHM, readJSON, pct } from "./lib.mjs";
const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const cities = readJSON(`${W}/saudi-cities/data/cities.json`).cities;
for (const slug of ["arar", "turaif", "jizan"]) {
  const c = cities.find((x) => x.name === slug);
  const rows = readJSON(`${W}/saudi-cities/data/sa-${slug}-rows.json`);
  const isos = Object.keys(rows).sort();
  let best = null;
  for (const ang of [18.0, 18.1, 18.2, 18.3, 18.4, 18.45, 18.5, 18.55, 18.6, 18.7]) {
    const p = new adhan.CalculationParameters("Other", ang, 18);
    p.rounding = adhan.Rounding.None;
    p.madhab = adhan.Madhab.Shafi;
    p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
    const raws = isos.map((iso) => rawTimes({ lat: c.lat, lon: c.lon, iso, tz: "Asia/Riyadh", params: p }).fajr / 60);
    for (const delta of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) {
      const pairs = raws.map((r, i) => ({ model: Math.floor(r + delta), printed: parseHM(rows[isos[i]].fajr) }));
      const s = score(pairs);
      if (!best || s.mae < best.mae) best = { ang, delta, ...s };
    }
  }
  // signed residual at the held recipe
  const p = new adhan.CalculationParameters("Other", 18.5, 18);
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  const resid = [];
  for (const iso of isos) {
    const raw = rawTimes({ lat: c.lat, lon: c.lon, iso, tz: "Asia/Riyadh", params: p }).fajr / 60;
    resid.push(+(Math.floor(raw + 1) - parseHM(rows[iso].fajr)).toFixed(3));
  }
  const mean = resid.reduce((a, b) => a + b, 0) / resid.length;
  console.log(slug, "best", JSON.stringify(best), "held-resid mean", mean.toFixed(3), "min", Math.min(...resid), "max", Math.max(...resid));
}
