// Implied asr shadow factor per day, given lat/dec and the table's asr hour angle.
const L = require('./fitlib');
const fs = require('fs');
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const YEAR = 2028;
function sun(jd) {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) * D2R;
  const q = 280.459 + 0.98564736 * D;
  const Ls = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
  const e = (23.439 - 0.00000036 * D) * D2R;
  const dec = Math.asin(Math.sin(e) * Math.sin(Ls)) * R2D;
  let ra = Math.atan2(Math.cos(e) * Math.sin(Ls), Math.cos(Ls)) * R2D;
  ra = ((ra % 360) + 360) % 360;
  let eqt = q - ra;
  eqt = (((eqt + 180) % 360) + 360) % 360 - 180;
  return { dec, eqt: eqt * 4 };
}
const jd0 = d => d.getTime() / 86400000 + 2440587.5;
const meta = JSON.parse(fs.readFileSync(__dirname + '/../data/table_meta.json', 'utf8'));
const rec = Object.fromEntries(JSON.parse(fs.readFileSync(__dirname + '/../out/recipes.json', 'utf8')).map(r => [r.id, r]));
const med = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
for (const f of process.argv.slice(2)) {
  const id = +f.match(/region_(\d+)\.json/)[1];
  const off = (meta[id] || {}).off ?? 120;
  const r = rec[id];
  const t = L.parseTable(f);
  const dates = Array.from({ length: t.length }, (_, i) => L.doyDate(i, true, YEAR));
  const factors = [];
  for (let i = 0; i < t.length; i++) {
    const dec = sun(jd0(dates[i])).dec, eqt = sun(jd0(dates[i])).eqt;
    const noon = 720 - eqt - 4 * (r.lon - off / 4);
    const dH = ((t[i].Asr - noon) / 4) * D2R;
    const P = r.lat * D2R, d = dec * D2R;
    const ch = Math.sin(P) * Math.sin(d) + Math.cos(P) * Math.cos(d) * Math.cos(dH);
    const alt = Math.asin(Math.max(-1, Math.min(1, ch)));
    // cot(alt) = f + tan|phi - dec|
    const cot = 1 / Math.tan(alt);
    const fct = cot - Math.tan(Math.abs(r.lat - dec) * D2R);
    if (isFinite(fct) && Math.abs(fct) < 50) factors.push(fct);
  }
  console.log(JSON.stringify({ id, country: r.country, median: +med(factors).toFixed(2), p10: +[...factors].sort((a, b) => a - b)[Math.floor(factors.length * .1)].toFixed(2), p90: +[...factors].sort((a, b) => a - b)[Math.floor(factors.length * .9)].toFixed(2) }));
}
