// Emit the per-city markdown table and the horizon table for REPORT.md.
const fs = require("fs");
const path = require("path");
const W = path.join(process.env.HOME, "athan-gitree/census/o1l-city/morocco-cities");
const fit = JSON.parse(fs.readFileSync(path.join(W, "data/per-city-fit.json"), "utf8"));
const cities = JSON.parse(fs.readFileSync(path.join(W, "data/cities-190.json"), "utf8"));
const P = fs.readFileSync(path.join(W, "captures/ma_geonames/MA.txt"), "utf8")
  .split("\n").filter(Boolean).map((l) => l.split("\t"))
  .filter((r) => r[6] === "P" && r[4] && r[5])
  .map((r) => ({ lat: +r[4], lon: +r[5], dem: +r[16] || 0, name: r[1] }));

const demAt = (lat, lon) => {
  let bd = 1e9, best = null;
  for (const p of P) {
    const d = (p.lat - lat) ** 2 + ((p.lon - lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (d < bd) { bd = d; best = p; }
  }
  return best;
};

const rows = fit.cities.map((r) => {
  const f = fit.fits.find((x) => x.c === r.c);
  const n = demAt(f.lat, f.lon);
  return { ...r, dem: n.dem, bracket: f.bracketOffset, place: n.name, latF: f.lat, lonF: f.lon };
});

const head = "| c | city | lat | lon | within/366 | exact | worst | worst at | fajr | sunrise | dhuhr | asr | maghrib | isha | DEM m | bracket |";
const sep = "|---:|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|";
const lines = rows.map((r) => {
  const pc = ["fajr", "sunrise", "dhuhr", "asr", "magrib", "isha"].map((p) => `${r.per[p].within}/${r.per[p].cells}`).join(" | ");
  return `| ${r.c} | ${r.n} | ${r.latF.toFixed(2)} | ${r.lonF.toFixed(2)} | ${r.within} | ${r.exact} | ${r.worst.toFixed(2)} | ${r.worstAt} | ${pc} | ${r.dem} | ${r.bracket.toFixed(2)} |`;
});
fs.writeFileSync(path.join(W, "data", "per-city-table.md"), [head, sep, ...lines].join("\n") + "\n");
fs.writeFileSync(path.join(W, "data", "horizon.json"), JSON.stringify(rows.map((r) => ({ c: r.c, n: r.n, bracket: +r.bracket.toFixed(2), dem: r.dem, place: r.place })), null, 1));
console.log(`rows ${lines.length}`);
console.log([head, sep, ...lines.slice(0, 3)].join("\n"));
