// Per-file (per-month) breakdown for a fixed recipe, so between-year stability reads off one table.
const path = require('path');
const fs = require('fs');
const { loadRows, params, rawTimes, COLUMNS } = require('./fit-rw.js');
const { Madhab } = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));

const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

function report(files, label) {
  const rows = loadRows(files);
  const p = params(rows[0].lat, spec.fajr, spec.isha, Madhab.Shafi);
  const acc = {};
  for (const c of COLUMNS) acc[c] = { n: 0, exact: 0, w1: 0, err: 0, res: [] };
  for (const r of rows) {
    const raw = rawTimes(r.lat, r.lon, r.day, p);
    for (const c of COLUMNS) {
      const d = r.printed[c] - raw[c];
      acc[c].res.push(d);
      const e = Math.abs(Math.round(raw[c]) - r.printed[c]);
      acc[c].n++;
      if (e === 0) acc[c].exact++;
      if (e <= 1) acc[c].w1++;
      acc[c].err += e;
    }
  }
  const lines = [];
  for (const c of COLUMNS) {
    const a = acc[c];
    const med = [...a.res].sort((x, y) => x - y)[Math.floor(a.res.length / 2)];
    lines.push(`${c} margin ${med.toFixed(2)} ex ${a.exact}/${a.n} w1 ${a.w1}/${a.n} mae ${(a.err / a.n).toFixed(2)}`);
  }
  console.log(`\n## ${label} (n=${rows.length}, fajr ${spec.fajr} isha ${spec.isha})`);
  for (const l of lines) console.log("  " + l);
}

for (const f of spec.files) report([f], path.basename(f));
if (spec.files.length > 1) report(spec.files, "ALL");
