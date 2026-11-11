// Gate and fit every athanpro city month in data/.
// Gate = dhuhr vs solar noon at the page's own coordinates in the country zone.
// A page whose gate exceeds 2 min is re-run against the zones its own HTML names, and the
// smallest-gate zone wins. That correction is arithmetic on the page's own literals.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.dirname(__dirname);
const TZ = {
  "south-sudan": "Africa/Juba", liberia: "Africa/Monrovia", turkmenistan: "Asia/Ashgabat",
  nepal: "Asia/Kathmandu", myanmar: "Asia/Yangon", "papua-new-guinea": "Pacific/Port_Moresby",
  "solomon-islands": "Pacific/Guadalcanal", vanuatu: "Pacific/Efate", samoa: "Pacific/Apia",
  kiribati: "Pacific/Tarawa", palau: "Pacific/Palau", micronesia: "Pacific/Pohnpei",
  honduras: "America/Tegucigalpa",
};

function zonesIn(file) {
  const html = fs.readFileSync(file, "utf8");
  return [...new Set([...html.matchAll(/"timezone":"([A-Za-z]+\/[A-Za-z_]+)"/g)].map((m) => m[1]))];
}
function run(file, cityTz, renderTz) {
  return JSON.parse(execFileSync("node", [path.join(ROOT, "tools/deshift.js"), file, cityTz, renderTz],
    { encoding: "utf8", maxBuffer: 1 << 24 }));
}

const out = [];
for (const name of fs.readdirSync(path.join(ROOT, "data")).sort()) {
  if (!name.startsWith("athanpro-") || !name.endsWith(".json") || name.includes("-corrected")) continue;
  const slug = name.slice("athanpro-".length, -5);
  const [country, city] = slug.split("__");
  const cityTz = TZ[country];
  if (!cityTz || !city) continue;
  const file = path.join(ROOT, "data", name);
  let j = run(file, cityTz, cityTz);
  let renderTz = cityTz;
  if (j.solarGateWorst > 2) {
    const src = JSON.parse(fs.readFileSync(file, "utf8")).meta.source;
    for (const z of zonesIn(path.join(ROOT, "captures/ap-all", src))) {
      const k = run(file, cityTz, z);
      if (k.solarGateWorst < j.solarGateWorst) { j = k; renderTz = z; }
    }
  }
  out.push({ slug, country, city: j.city, coord: [j.lat, j.lon], tz: cityTz, renderTz,
    deltaMin: j.deltaMin, gate: j.solarGateWorst, recipe: j.recipe, joint: j.joint,
    pct: j.pctWithin1, worst: j.worst, rows: j.rows, per: j.per });
}
fs.writeFileSync(path.join(ROOT, "fits-athpro.json"), JSON.stringify(out, null, 1));
const bad = out.filter((r) => r.gate > 2 || r.worst > 2);
for (const r of out) {
  console.log(`${r.slug.padEnd(34)} gate=${String(r.gate).padStart(3)} ` +
    `recipe=${r.recipe.fajrAngle}/${r.recipe.ishaAngle}${r.recipe.asr[0]} ` +
    `pct=${String(r.pct).padStart(5)} worst=${r.worst}` +
    (r.renderTz !== r.tz ? ` render=${r.renderTz} d=${r.deltaMin}` : ""));
}
console.log(`\n${out.length} pages, ${out.reduce((a, r) => a + r.rows, 0)} rows, ` +
  `${out.filter((r) => r.gate <= 2).length} pass the gate, ${bad.length} flagged`);
