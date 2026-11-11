import { adhan, rawTimes, score, parseHM, readJSON } from "./lib.mjs";
const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const rows = readJSON(`${W}/saudi-cities/data/sa-arar-rows.json`);
const isos = Object.keys(rows).sort();
const mk = (lat, lon, ang) => {
  const p = new adhan.CalculationParameters("Other", ang, 18);
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  return isos.map((iso) => {
    const raw = rawTimes({ lat, lon, iso, tz: "Asia/Riyadh", params: p });
    return { iso, raw: raw.fajr / 60, printed: parseHM(rows[iso].fajr), rawSun: raw.sunrise / 60, pSun: parseHM(rows[iso].sunrise) };
  });
};
for (const [lat, lon] of [[30.99, 41.02], [30.9753, 41.0381]]) {
  for (const ang of [18.5]) {
    const arr = mk(lat, lon, ang);
    const s = score(arr.map((a) => ({ model: Math.ceil(a.raw), printed: a.printed })));
    const s2 = score(arr.map((a) => ({ model: Math.round(a.raw), printed: a.printed })));
    console.log(lat, lon, ang, "ceil", s.mae.toFixed(3), "nearest", s2.mae.toFixed(3));
    // monthly residual means
    const bym = {};
    for (const a of arr) {
      const m = a.iso.slice(0, 7);
      (bym[m] ||= []).push(Math.ceil(a.raw) - a.printed);
    }
    console.log(Object.entries(bym).map(([m, v]) => `${m}:${(v.reduce((x, y) => x + y, 0) / v.length).toFixed(2)}`).join(" "));
  }
}
