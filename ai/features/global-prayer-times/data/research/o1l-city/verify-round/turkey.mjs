import { adhan, rawTimes, score, parseHM, readJSON, pct, ROUND, PRAYERS } from "./lib.mjs";

const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const SAMPLE = ["istanbul", "ankara", "izmir", "antalya", "trabzon", "sinop", "hatay", "van", "kars", "igdir"];
const TZ = "Europe/Istanbul";

const coords = readJSON(`${W}/o1l-15r/data/province-coords.json`);
const TR = { ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I", ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U" };
const norm = (s) =>
  s
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR[c])
    .toLowerCase()
    .replace(/[^a-z]/g, "");
const findCoord = (slug) => {
  const key = Object.keys(coords).find((k) => norm(k) === slug);
  if (!key) throw new Error(`no coord for ${slug}`);
  return coords[key];
};
const params = adhan.CalculationMethod.Turkey();
params.rounding = adhan.Rounding.None;

const byPrayer = Object.fromEntries(PRAYERS.map((p) => [p, []]));
const rows = [];

for (const slug of SAMPLE) {
  const key = Object.keys(coords).find((k) => norm(k) === slug);
  const { lat, lon } = findCoord(slug);
  const data = readJSON(`${W}/o1l-15r/data/tr-2026-${slug}.json`);
  const all = [];
  for (const [iso, printed] of Object.entries(data.rows).sort()) {
    const raw = rawTimes({ lat, lon, iso, tz: TZ, params });
    for (const p of PRAYERS) {
      const model = ROUND.nearest(raw[p] / 60);
      const pr = parseHM(printed[p]);
      all.push({ model, printed: pr });
      byPrayer[p].push({ model, printed: pr });
    }
  }
  const s = score(all);
  const per = {};
  for (const p of PRAYERS) per[p] = score(byPrayer[p].slice(-365));
  rows.push({ slug, key, lat, lon, n: s.n, exact: pct(s.exact, s.n), w1: pct(s.w1, s.n), mae: s.mae, worst: s.worst, per });
}

console.log("province\tlat\tn\texact%\twithin1%\tMAE\tworst\tfajrMAE\tasrMAE\tishaMAE");
for (const r of rows) {
  console.log(
    [r.slug, r.lat.toFixed(4), r.n, r.exact.toFixed(2), r.w1.toFixed(2), r.mae.toFixed(3), r.worst,
     r.per.fajr.mae.toFixed(2), r.per.asr.mae.toFixed(2), r.per.isha.mae.toFixed(2)].join("\t")
  );
}
const pooled = rows.reduce(
  (a, r) => ({ n: a.n + r.n, exact: a.exact + (r.exact * r.n) / 100, w1: a.w1 + (r.w1 * r.n) / 100 }),
  { n: 0, exact: 0, w1: 0 }
);
console.log(`\nPOOLED n=${pooled.n} exact=${pct(pooled.exact, pooled.n).toFixed(2)}% within1=${pct(pooled.w1, pooled.n).toFixed(2)}%`);
console.log(`PER-PRAYER pooled MAE:`);
for (const p of PRAYERS) {
  const s = score(rows.flatMap(() => []).concat([]));
}
// recompute per-prayer pooled across the sample
const perAll = Object.fromEntries(PRAYERS.map((p) => [p, []]));
for (const slug of SAMPLE) {
  const key = Object.keys(coords).find((k) => norm(k) === slug);
  const { lat, lon } = findCoord(slug);
  const data = readJSON(`${W}/o1l-15r/data/tr-2026-${slug}.json`);
  for (const [iso, printed] of Object.entries(data.rows).sort()) {
    const raw = rawTimes({ lat, lon, iso, tz: TZ, params });
    for (const p of PRAYERS) perAll[p].push({ model: ROUND.nearest(raw[p] / 60), printed: parseHM(printed[p]) });
  }
}
for (const p of PRAYERS) {
  const s = score(perAll[p]);
  console.log(`${p}\tMAE ${s.mae.toFixed(3)}\twithin1 ${pct(s.w1, s.n).toFixed(2)}%\texact ${pct(s.exact, s.n).toFixed(1)}%`);
}
