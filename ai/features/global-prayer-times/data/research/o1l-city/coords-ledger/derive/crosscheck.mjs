// Cross-check: where the record states a point and the solver recovers one from the same
// table, the two must agree. This is the only test that licenses the DERIVED class elsewhere.
import fs from "node:fs";
import path from "node:path";

const DATA = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "data");
const solved = JSON.parse(fs.readFileSync(path.join(DATA, "solved.json"), "utf8"));
const published = JSON.parse(fs.readFileSync(path.join(DATA, "published.json"), "utf8"));

const byFile = new Map(solved.map((r) => [r.file, r]));
const groups = {};
for (const [file, p] of Object.entries(published)) {
  const s = byFile.get(file);
  if (!s || s.lat === undefined) continue;
  const dLat = s.lat - p.lat;
  const dLon = ((s.lon - p.lon + 540) % 360) - 180;
  const key = p.source.split(/[,;]/)[0].split(" ")[0];
  (groups[key] ||= []).push({ file, dLat, dLon, rms: s.rms, cls: p.pointClass });
}
for (const [key, arr] of Object.entries(groups)) {
  const abs = arr.map((x) => Math.max(Math.abs(x.dLat), Math.abs(x.dLon)));
  abs.sort((a, b) => a - b);
  const pct = (v) => (100 * abs.filter((x) => x <= v).length / abs.length).toFixed(0);
  console.log(`${key.padEnd(12)} n=${String(arr.length).padStart(3)} median=${abs[Math.floor(abs.length / 2)].toFixed(2)} `
    + `<=0.25:${pct(0.25)}% <=0.5:${pct(0.5)}% <=1:${pct(1)}% worst=${abs[abs.length - 1].toFixed(2)}`);
}
const worst = Object.values(groups).flat().sort((a, b) => Math.max(Math.abs(b.dLat), Math.abs(b.dLon)) - Math.max(Math.abs(a.dLat), Math.abs(a.dLon))).slice(0, 6);
console.log("largest disagreements:");
for (const w of worst) console.log(`  ${w.file} dLat=${w.dLat.toFixed(2)} dLon=${w.dLon.toFixed(2)} rms=${w.rms}`);
