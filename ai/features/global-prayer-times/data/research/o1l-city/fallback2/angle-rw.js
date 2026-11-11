// Angle forensics: for each candidate twilight angle, report the residual margin and its spread.
// The publisher's angle is the one whose residual series is flattest (min IQR); a constant offset is a board margin.
const path = require('path');
const fs = require('fs');
const { loadRows, params, rawTimes, median } = require('./fit-rw.js');
const { Madhab } = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));

const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const rows = loadRows(spec.files);
const madhab = Madhab.Shafi;

function iqr(a) {
  const s = [...a].sort((x, y) => x - y);
  const q = (p) => s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
  return q(0.75) - q(0.25);
}

for (const col of ['fajr', 'isha']) {
  const table = [];
  for (let a = spec.from; a <= spec.to + 1e-9; a += 0.1) {
    const ang = +a.toFixed(1);
    const p = params(rows[0].lat, col === 'fajr' ? ang : 18, col === 'isha' ? ang : 17, madhab);
    const res = rows.map((r) => r.printed[col] - rawTimes(r.lat, r.lon, r.day, p)[col]);
    const m = median(res);
    const dev = res.map((d) => d - m);
    table.push({ angle: ang, margin: +m.toFixed(2), iqr: +iqr(dev).toFixed(2), range: +(Math.max(...dev) - Math.min(...dev)).toFixed(1) });
  }
  table.sort((a, b) => a.iqr - b.iqr);
  console.log(`\n== ${col}: flattest angles (min IQR of residuals)`);
  for (const t of table.slice(0, 8)) console.log(`  ${t.angle}\t margin ${t.margin}\t IQR ${t.iqr}\t range ${t.range}`);
  console.log(`  --- standard angles`);
  for (const a of [12, 13, 14, 15, 16, 17, 18, 19, 20]) {
    const t = table.find((x) => x.angle === a);
    if (t) console.log(`  ${t.angle}\t margin ${t.margin}\t IQR ${t.iqr}\t range ${t.range}`);
  }
}
