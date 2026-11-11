import { readJSON } from "./lib.mjs";
import { readdirSync } from "node:fs";
const W = `${process.env.HOME}/athan-gitree/census/o1l-city`;

const tr = readdirSync(`${W}/o1l-15r/data`).filter((f) => /^tr-2026-.*\.json$/.test(f));
let trRows = 0, trBad = 0;
for (const f of tr) {
  const d = readJSON(`${W}/o1l-15r/data/${f}`);
  trRows += Object.keys(d.rows).length;
  for (const r of Object.values(d.rows)) for (const v of Object.values(r)) if (!/^\d{2}:\d{2}$/.test(v)) trBad++;
}
console.log(`Turkey files=${tr.length} rows=${trRows} malformed=${trBad}`);

const th = readdirSync(`${W}/thailand-provinces/data`).filter((f) => /^th-cicot-.*-2569\.json$/.test(f));
console.log(`Thailand normal-block files=${th.length}`);

const eg = readJSON(`${W}/egypt-82/data/manifest.json`);
console.log(`Egypt options=${eg.length} full-year=${eg.filter((x) => x.days === 365).length} empty=${eg.filter((x) => x.days === 0).length} partial=${eg.filter((x) => x.days > 0 && x.days < 365).length}`);
console.log("Egypt non-365:", eg.filter((x) => x.days !== 365).map((x) => `${x.key}:${x.days}`).join(", "));

const sa = readJSON(`${W}/saudi-cities/data/cities.json`).cities;
console.log(`Saudi points=${sa.length} governorates=${new Set(sa.map((c) => c.gov)).size}`);
