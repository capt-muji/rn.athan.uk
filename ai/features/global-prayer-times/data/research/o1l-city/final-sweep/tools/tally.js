// Per-country tallies for the report: rows, gate, and the 18/17 score of every page, so the
// table does not mix a scanned recipe with a fixed one.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.dirname(__dirname);
const fits = JSON.parse(fs.readFileSync(path.join(ROOT, "fits-athpro.json"), "utf8"));
const rows = [];
for (const f of fits) {
  const file = path.join(ROOT, "data", `athanpro-${f.slug}.json`);
  const j = JSON.parse(execFileSync("node", [path.join(ROOT, "tools/fixed.js"), file, f.tz, 18, 17],
    { encoding: "utf8", maxBuffer: 1 << 24 }));
  rows.push({ ...f, at1817: j.pct, at1817worst: j.worst });
}
const by = {};
for (const r of rows) {
  const b = (by[r.country] = by[r.country] || { cities: 0, rows: 0, gate: 0, perfect: 0, worst: 0, pages: [] });
  b.cities++; b.rows += r.rows; if (r.gate <= 2) b.gate++;
  if (r.at1817 === 100) b.perfect++;
  b.worst = Math.max(b.worst, r.at1817worst);
  b.pages.push(`${r.city}:${r.at1817}`);
}
for (const [c, b] of Object.entries(by)) {
  console.log(`${c.padEnd(20)} cities=${String(b.cities).padStart(2)} rows=${String(b.rows).padStart(4)} ` +
    `gate<=2=${b.gate} perfect18/17=${b.perfect} worst=${b.worst}`);
}
const t = Object.values(by).reduce((a, b) => ({ cities: a.cities + b.cities, rows: a.rows + b.rows,
  gate: a.gate + b.gate, perfect: a.perfect + b.perfect }), { cities: 0, rows: 0, gate: 0, perfect: 0 });
console.log(`TOTAL cities=${t.cities} rows=${t.rows} gate<=2=${t.gate} perfect=${t.perfect}`);
fs.writeFileSync(path.join(ROOT, "tally.json"), JSON.stringify({ rows, by }, null, 1));
