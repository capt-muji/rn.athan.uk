import { adhan, rawTimes, score, parseHM, readJSON, pct, ROUND, PRAYERS } from "./lib.mjs";

const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const TZ = "Asia/Bangkok";
// 10 provinces spread north-south, including the two named defect provinces.
const SAMPLE = [
  "bangkok", "chiangrai", "chiangmai", "nan", "khonkaen",
  "chonburi", "ranong", "phuket", "pattani", "yala",
];
const ROUNDING = {
  fajr: ROUND.nearest,
  sunrise: ROUND.ceil,
  dhuhr: ROUND.ceil,
  asr: ROUND.ceil,
  magrib: ROUND.ceil,
  isha: ROUND.nearest,
};
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"];
const RAWKEY = { fajr: "fajr", sunrise: "sunrise", dhuhr: "dhuhr", asr: "asr", magrib: "maghrib", isha: "isha" };

const coords = readJSON(`${W}/thailand-provinces/data/th-province-coordinates.json`);
const bySlug = {};
for (const [k, v] of Object.entries(coords)) bySlug[k.toLowerCase().replace(/[^a-z]/g, "")] = { key: k, ...v };
// Nan's printed longitude is 3 degrees out (report defect); use the implied point.
const NAN_IMPLIED = { lat: 18.7, lon: 100.66 };

const params = new adhan.CalculationParameters("Other", 19.8, 18.1);
params.rounding = adhan.Rounding.None;
params.madhab = adhan.Madhab.Shafi;
params.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;

const out = [];
let pooledN = 0, pooledW1 = 0, pooledExact = 0, pooledWorst = 0;
const fails = [];
const perAll = Object.fromEntries(COLS.map((c) => [c, []]));

for (const slug of SAMPLE) {
  const meta = bySlug[slug];
  if (!meta) throw new Error(`no coords for ${slug}`);
  const pt = slug === "nan" ? NAN_IMPLIED : { lat: meta.lat, lon: meta.lon };
  const data = readJSON(`${W}/thailand-provinces/data/th-cicot-${slug}-2569.json`);
  const all = [];
  for (const [iso, printed] of Object.entries(data).sort()) {
    const raw = rawTimes({ lat: pt.lat, lon: pt.lon, iso, tz: TZ, params });
    for (const c of COLS) {
      const model = ROUNDING[c](raw[RAWKEY[c]] / 60);
      const pr = parseHM(printed[c]);
      if (pr == null) continue;
      all.push({ model, printed: pr, iso, col: c, slug });
      perAll[c].push({ model, printed: pr });
      if (Math.abs(model - pr) > 1) fails.push(`${slug} ${iso} ${c} model=${model} printed=${pr}`);
    }
  }
  const s = score(all);
  pooledN += s.n; pooledW1 += s.w1; pooledExact += s.exact; pooledWorst = Math.max(pooledWorst, s.worst);
  out.push({ slug, lat: pt.lat, lon: pt.lon, ...s });
}

console.log("province\tlat\tn\texact%\twithin1%\tMAE\tworst");
for (const r of out) console.log([r.slug, r.lat.toFixed(4), r.n, pct(r.exact, r.n).toFixed(2), pct(r.w1, r.n).toFixed(2), r.mae.toFixed(3), r.worst].join("\t"));
console.log(`\nSAMPLE POOLED n=${pooledN} exact=${pct(pooledExact, pooledN).toFixed(2)}% within1=${pct(pooledW1, pooledN).toFixed(2)}% worst=${pooledWorst}`);
console.log("PER-COLUMN:");
for (const c of COLS) {
  const s = score(perAll[c]);
  console.log(`${c}\tMAE ${s.mae.toFixed(3)}\twithin1 ${pct(s.w1, s.n).toFixed(3)}%\texact ${pct(s.exact, s.n).toFixed(1)}%`);
}
console.log(`\nFAILURES >1 min: ${fails.length}`);
for (const f of fails) console.log(f);

// National total check: rows x 6 across all 77 files
let rowsTotal = 0, nanCells = 0;
import { readdirSync } from "node:fs";
const dir = `${W}/thailand-provinces/data`;
for (const f of readdirSync(dir)) {
  if (!/^th-cicot-.*-2569\.json$/.test(f)) continue;
  const d = readJSON(`${dir}/${f}`);
  for (const r of Object.values(d)) {
    rowsTotal++;
    for (const c of COLS) if (r[c] == null || String(r[c]).toLowerCase() === "nan" || parseHM(r[c]) == null) nanCells++;
  }
}
console.log(`\nAll 77 files: rows=${rowsTotal} cells=${rowsTotal * 6} non-numeric cells=${nanCells}`);
