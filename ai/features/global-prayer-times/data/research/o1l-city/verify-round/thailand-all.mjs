import { adhan, rawTimes, score, parseHM, readJSON, pct, ROUND } from "./lib.mjs";
import { readdirSync } from "node:fs";

const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;
const TZ = "Asia/Bangkok";
const COLS = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"];
const RAWKEY = { fajr: "fajr", sunrise: "sunrise", dhuhr: "dhuhr", asr: "asr", magrib: "maghrib", isha: "isha" };
const ROUNDING = { fajr: ROUND.nearest, sunrise: ROUND.ceil, dhuhr: ROUND.ceil, asr: ROUND.ceil, magrib: ROUND.ceil, isha: ROUND.nearest };

const coords = readJSON(`${W}/thailand-provinces/data/th-province-coordinates.json`);
const bySlug = {};
for (const [k, v] of Object.entries(coords)) bySlug[k.toLowerCase().replace(/[^a-z]/g, "")] = { key: k, ...v };
const NAN_IMPLIED = { lat: 18.7, lon: 100.66 };

const params = new adhan.CalculationParameters("Other", 19.8, 18.1);
params.rounding = adhan.Rounding.None;
params.madhab = adhan.Madhab.Shafi;
params.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;

const dir = `${W}/thailand-provinces/data`;
const files = readdirSync(dir).filter((f) => /^th-cicot-.*-2569(-leap)?\.json$/.test(f)).sort();

const result = {};
for (const f of files) {
  const slug = f.replace(/^th-cicot-/, "").replace(/-2569(-leap)?\.json$/, "");
  const leap = f.includes("-leap");
  const meta = bySlug[slug];
  if (!meta) {
    console.log("NOCOORD", f);
    continue;
  }
  const pt = slug === "nan" ? NAN_IMPLIED : { lat: meta.lat, lon: meta.lon };
  const data = readJSON(`${dir}/${f}`);
  const bucket = leap ? "leap" : "normal";
  result[bucket] ||= { n: 0, exact: 0, w1: 0, worst: 0, fails: [] };
  for (const [iso, printed] of Object.entries(data).sort()) {
    const raw = rawTimes({ lat: pt.lat, lon: pt.lon, iso, tz: TZ, params });
    for (const c of COLS) {
      const pr = parseHM(printed[c]);
      if (pr == null) continue;
      const model = ROUNDING[c](raw[RAWKEY[c]] / 60);
      const r = result[bucket];
      r.n++;
      const d = Math.abs(model - pr);
      if (d < 1e-9) r.exact++;
      if (d <= 1) r.w1++;
      else r.fails.push(`${slug}${leap ? "/leap" : ""} ${iso} ${c} model=${model} printed=${pr}`);
      if (d > r.worst) r.worst = d;
    }
  }
}
for (const [b, r] of Object.entries(result)) {
  console.log(`${b}\tprinted=${r.n}\texact=${r.exact} (${pct(r.exact, r.n).toFixed(2)}%)\twithin1=${r.w1} (${pct(r.w1, r.n).toFixed(3)}%)\tworst=${r.worst}\tfails=${r.fails.length}`);
  for (const x of r.fails) console.log("  " + x);
}

// Nan at its printed (defective) longitude, for the defect claim
const nanMeta = bySlug["nan"];
const nanData = readJSON(`${dir}/th-cicot-nan-2569.json`);
const pairs = [];
for (const [iso, printed] of Object.entries(nanData).sort()) {
  const raw = rawTimes({ lat: nanMeta.lat, lon: nanMeta.lon, iso, tz: TZ, params });
  for (const c of COLS) pairs.push({ model: ROUNDING[c](raw[RAWKEY[c]] / 60), printed: parseHM(printed[c]) });
}
const s = score(pairs);
console.log(`\nNan at printed ${nanMeta.lat}/${nanMeta.lon}: within1 ${pct(s.w1, s.n).toFixed(2)}% MAE ${s.mae.toFixed(2)} worst ${s.worst}`);
