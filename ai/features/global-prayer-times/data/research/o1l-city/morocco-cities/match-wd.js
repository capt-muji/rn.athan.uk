// Match the ministry's 190 Arabic city names to Wikidata settlements (P625 coordinates).
const fs = require("fs");
const path = require("path");
const W = path.join(process.env.HOME, "athan-gitree/census/o1l-city/morocco-cities");
const cities = JSON.parse(fs.readFileSync(path.join(W, "data", "cities-190.json"), "utf8"));
const wd = JSON.parse(fs.readFileSync(path.join(W, "captures/wikidata-ma-settlements.json"), "utf8")).results.bindings;

const norm = (s) =>
  s
    .normalize("NFC")
    .replace(/[\u064B-\u0652\u0670\u0640\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[^\u0600-\u06FF ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const variants = (s) => {
  const base = norm(s);
  const out = new Set([base]);
  const bare = base.replace(/^ال/, "");
  out.add(bare);
  out.add(base.replace(/^ال/, ""));
  out.add(base.replace(/ه$/, "ه").replace(/ه$/, "ة"));
  // common spelling swaps
  out.add(base.replace(/ي/g, "ي").replace(/ه$/, "ه"));
  return out;
};

const index = new Map();
for (const b of wd) {
  const label = b.itemLabel.value;
  const key = norm(label);
  if (!key) continue;
  const rec = { qid: b.item.value.split("/").pop(), label, lat: +b.lat.value, lon: +b.lon.value, pop: b.pop ? +b.pop.value : 0 };
  for (const k of variants(label)) {
    if (!index.has(k)) index.set(k, []);
    index.get(k).push(rec);
  }
}

const out = [];
let exact = 0, fuzzy = 0;
for (const c of cities) {
  const keys = [...variants(c.n)];
  let hits = [];
  for (const k of keys) if (index.has(k)) hits = hits.concat(index.get(k));
  // dedupe by qid
  const seen = new Map();
  for (const h of hits) if (!seen.has(h.qid) || seen.get(h.qid).pop < h.pop) seen.set(h.qid, h);
  const list = [...seen.values()].sort((a, b) => b.pop - a.pop);
  const best = list[0] || null;
  if (best) { if (best.label === c.n) exact++; else fuzzy++; }
  out.push({ c: c.c, n: c.n, hits: list.length, best, alts: list.slice(1, 4).map((x) => `${x.label}(${x.pop})`) });
}
fs.writeFileSync(path.join(W, "data", "coords-wikidata.json"), JSON.stringify(out, null, 1));
console.log(`matched ${out.filter((o) => o.best).length}/190 (exact label ${exact}, variant ${fuzzy})`);
for (const o of out.filter((x) => !x.best)) console.log(`  MISS c=${o.c} ${o.n}`);
console.log("--- ambiguous or zero-pop picks ---");
for (const o of out.filter((x) => x.best && x.hits > 1).slice(0, 40))
  console.log(`  c=${o.c} ${o.n} hits ${o.hits} -> ${o.best.label} ${o.best.lat},${o.best.lon} pop ${o.best.pop} | alts ${o.alts.join(" ; ")}`);
