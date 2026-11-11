import { adhan, rawTimes, score, parseHM, readJSON, pct, ROUND } from "./lib.mjs";
const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const cities = readJSON(`${W}/saudi-cities/data/cities.json`).cities;
const c = cities.find((x) => x.name === "arar");
const rows = readJSON(`${W}/saudi-cities/data/sa-arar-rows.json`);
const isos = Object.keys(rows).sort();
for (const ang of [17.5, 18, 18.2, 18.4, 18.5, 18.6, 18.8, 19]) {
  const p = new adhan.CalculationParameters("Other", ang, 18);
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  const mk = (r) =>
    isos.map((iso) => {
      const raw = rawTimes({ lat: c.lat, lon: c.lon, iso, tz: "Asia/Riyadh", params: p });
      return { model: r(raw.fajr / 60), printed: parseHM(rows[iso].fajr) };
    });
  const a = score(mk(ROUND.floorPlus1));
  const b = score(mk(ROUND.nearest));
  const d = score(mk(ROUND.ceil));
  console.log(
    ang,
    "floor+1", a.mae.toFixed(3), pct(a.w1, a.n).toFixed(1),
    "| nearest", b.mae.toFixed(3), pct(b.w1, b.n).toFixed(1),
    "| ceil", d.mae.toFixed(3), pct(d.w1, d.n).toFixed(1)
  );
}
