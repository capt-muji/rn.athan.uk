// DEM elevations for every delegation coordinate, from the Open-Meteo elevation API
// (Copernicus GLO-90), batched 100 points per request. Raw responses kept.
const fs = require("fs");
const { execFileSync } = require("child_process");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities";
const tag = process.argv[2] || "sw";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

const files = fs.readdirSync(`${W}/data`).filter((f) => f.startsWith(`tn-inm-${tag}-`) && f.endsWith(".json"));
const pts = new Map();
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(`${W}/data/${f}`, "utf8"));
  const dates = Object.keys(j.rows).sort();
  if (!dates.length) continue;
  const r = j.rows[dates[0]];
  pts.set(`${Number(r.lat)},${Number(r.lng)}`, [Number(r.lat), Number(r.lng)]);
}
const list = [...pts.values()];
console.log(`unique coordinates: ${list.length}`);

const dem = fs.existsSync(`${W}/data/tn-dem.json`) ? JSON.parse(fs.readFileSync(`${W}/data/tn-dem.json`, "utf8")) : {};
const raw = fs.openSync(`${W}/captures/tn-dem-openmeteo.ndjson`, "w");

for (let i = 0; i < list.length; i += 100) {
  const batch = list.slice(i, i + 100);
  const lat = batch.map((p) => p[0].toFixed(4)).join(",");
  const lng = batch.map((p) => p[1].toFixed(4)).join(",");
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
  let body = null;
  for (let a = 0; a < 3 && body === null; a++) {
    try { body = execFileSync("curl", ["-sS", "-A", UA, "--max-time", "30", url], { encoding: "utf8" }); }
    catch (e) { body = null; }
  }
  if (body === null) { console.log(`FAIL batch ${i}`); continue; }
  fs.writeSync(raw, body.trim() + "\n");
  const els = JSON.parse(body).elevation;
  batch.forEach((p, k) => { dem[`${p[0]},${p[1]}`] = els[k]; });
  console.log(`batch ${i / 100}: ${els.length} elevations`);
}
fs.closeSync(raw);
fs.writeFileSync(`${W}/data/tn-dem.json`, JSON.stringify(dem, null, 0));
console.log(`wrote ${Object.keys(dem).length} elevations`);
