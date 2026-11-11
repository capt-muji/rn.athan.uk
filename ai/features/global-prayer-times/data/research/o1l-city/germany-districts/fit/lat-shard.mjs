// Validate every name-matched gazetteer point against the district's own printed
// columns: recover the latitude from the seasonal shape of sunrise/sunset/asr and
// reject a point whose gazetteer latitude the table contradicts. This is the
// name-collision filter the 100-district sample did not need and 1,105 does.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ADHAN = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const { default: SolarTime } = await import(pathToFileURL(ADHAN + 'SolarTime.js'));
const { default: TimeComponents } = await import(pathToFileURL(ADHAN + 'TimeComponents.js'));
const { default: Coordinates } = await import(pathToFileURL(ADHAN + 'Coordinates.js'));

const OUT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const SHARD = Number(process.env.SHARD ?? 0), TOTAL = Number(process.env.TOTAL ?? 1);
const secOf = (dt) => dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
const parse = (v) => { const [h, m] = v.split(':').map(Number); return h * 3600 + m * 60; };
const inst = (d, h) => new TimeComponents(h).utcDate(d.getFullYear(), d.getMonth(), d.getDate());
const rms = (a) => { let m = 0; for (const v of a) m += v; m /= a.length; let s = 0; for (const v of a) s += (v - m) ** 2; return Math.sqrt(s / a.length); };

const sun = JSON.parse(fs.readFileSync(`${OUT}/data/igmg-sun.json`, 'utf8'));
const all = JSON.parse(fs.readFileSync(`${OUT}/data/parse-all.json`, 'utf8'));
const norm = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss')
  .toLowerCase().replace(/[^a-z0-9]/g, '');
const point = {};
for (const v of Object.values(sun)) {
  if (!v.sun) continue;
  const k = norm(v.name);
  if (!(k in point)) point[k] = v.sun;
}

function load(id) {
  const d = JSON.parse(fs.readFileSync(`${OUT}/data/district-${id}-2026.json`, 'utf8'));
  return Object.keys(d).sort().map((k) => {
    const [y, m, dd] = k.split('-').map(Number);
    return { date: new Date(y, m - 1, dd), sunrise: parse(d[k].sunrise), maghrib: parse(d[k].maghrib), asr: parse(d[k].asr) };
  });
}
function score(lat, rows, idx) {
  const coords = new Coordinates(lat, 0);
  let a = 0, b = 0, c = 0;
  const A = [], B = [], C = [];
  for (const i of idx) {
    const st = new SolarTime(rows[i].date, coords);
    A.push(secOf(inst(rows[i].date, st.sunrise)) - rows[i].sunrise);
    B.push(secOf(inst(rows[i].date, st.sunset)) - rows[i].maghrib);
    C.push(secOf(inst(rows[i].date, st.afternoon(1))) - rows[i].asr);
  }
  a = rms(A); b = rms(B); c = rms(C);
  return a * a + b * b + c * c;
}

const mine = all.filter((s, i) => s.rows && i % TOTAL === SHARD);
const out = [];
for (const s of mine) {
  const pt = point[norm(s.name)];
  if (!pt) continue;
  const rows = load(s.id);
  const allIdx = rows.map((_, i) => i);
  const coarseIdx = allIdx.filter((i) => i % 15 === 0);
  const fineIdx = allIdx.filter((i) => i % 10 === 0);
  let best = null;
  for (let lat = 46; lat <= 56.001; lat += 0.1) {
    const v = score(lat, rows, coarseIdx);
    if (!best || v < best.v) best = { lat, v };
  }
  let fine = { lat: best.lat, v: score(best.lat, rows, fineIdx) };
  for (let lat = best.lat - 0.2; lat <= best.lat + 0.2001; lat += 0.01) {
    const L = +lat.toFixed(3);
    const v = score(L, rows, fineIdx);
    if (v < fine.v) fine = { lat: L, v };
  }
  out.push({ id: s.id, name: s.name, state: s.state, gazLat: pt.lat, gazLon: pt.lon,
             solvedLat: fine.lat, delta: +(fine.lat - pt.lat).toFixed(3) });
}
fs.writeFileSync(`${OUT}/fit/lat-${SHARD}.json`, JSON.stringify(out, null, 1));
console.log(`shard ${SHARD}: ${out.length} districts`);
