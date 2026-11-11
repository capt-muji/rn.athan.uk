// DUM RB band map, measured on the publisher's own columns: the summer substitute is
// the run where (sunrise - fajr) holds one fixed value through midsummer, and the same
// for (isha - maghrib). This avoids mistaking the natural 90-minute winter gap for it.
const fs = require('fs');
const path = require('path');

const load = (y) => JSON.parse(fs.readFileSync(path.join(__dirname, `data/dumrb_${y}.json`), 'utf8'));

function longestRun(rows, key, lo, hi) {
  const days = Object.keys(rows).sort();
  const runs = [];
  let cur = null;
  for (const iso of days) {
    const r = rows[iso];
    const md = iso.slice(5);
    const inCore = md >= lo && md <= hi;
    const v = key(r);
    if (!inCore || v == null) { if (cur) { runs.push(cur); cur = null; } continue; }
    if (!cur) { cur = { start: iso, end: iso, values: [v] }; continue; }
    const modal = cur.values.slice().sort((a, b) => a - b)[Math.floor(cur.values.length / 2)];
    if (Math.abs(v - modal) <= 1) { cur.end = iso; cur.values.push(v); } else { runs.push(cur); cur = { start: iso, end: iso, values: [v] }; }
  }
  if (cur) runs.push(cur);
  runs.sort((a, b) => b.values.length - a.values.length);
  const best = runs[0];
  if (!best) return null;
  const modal = best.values.slice().sort((x, y) => x - y)[Math.floor(best.values.length / 2)];
  return { start: best.start, end: best.end, days: best.values.length, value: modal };
}

const out = {};
for (const year of [2026, 2025]) {
  const d = load(year);
  out[year] = {};
  for (const [name, c] of Object.entries(d.cities)) {
    out[year][name] = {
      months: c.months.length,
      fajr: longestRun(c.rows, (r) => (r.sunrise != null && r.fajr != null ? r.sunrise - r.fajr : null), '05-01', '09-30'),
      isha: longestRun(c.rows, (r) => (r.maghrib != null && r.isha != null ? r.isha - r.maghrib : null), '05-01', '09-30'),
    };
  }
}
fs.writeFileSync(path.join(__dirname, 'data/dumrb_bands.json'), JSON.stringify(out, null, 1));

for (const year of [2026, 2025]) {
  const rs = Object.values(out[year]).filter((r) => r.fajr);
  const med = (k) => rs.map((r) => r.fajr[k]).sort((a, b) => a - b)[Math.floor(rs.length / 2)];
  const hist = {};
  for (const r of rs) hist[r.fajr.value] = (hist[r.fajr.value] || 0) + 1;
  console.log(`\n=== ${year}: ${rs.length} cities; fajr plateau value histogram ${JSON.stringify(hist)}; `
    + `median band ${med('days')} days, median start ${med('start')}, median end ${med('end')}`);
  const ishHist = {};
  for (const r of Object.values(out[year])) if (r.isha) ishHist[r.isha.value] = (ishHist[r.isha.value] || 0) + 1;
  console.log(`   isha plateau histogram ${JSON.stringify(ishHist)}`);
  for (const n of Object.keys(out[year]).sort()) {
    const r = out[year][n];
    const f = r.fajr, i = r.isha;
    console.log(' ', n.slice(0, 30).padEnd(30), `m${r.months}`,
      f ? `fajr ${f.value}/${f.days}d ${f.start}..${f.end}` : 'fajr -',
      i ? `| isha ${i.value}/${i.days}d ${i.start}..${i.end}` : '| isha -');
  }
}
