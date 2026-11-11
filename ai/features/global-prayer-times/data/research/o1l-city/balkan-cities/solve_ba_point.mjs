// Solve each city's implied computation point: the (lat,lon) whose 18/16 adhan series
// reproduces the published six columns up to a constant per-column temkin.
import fs from 'node:fs';
import { loadRows, compute, PRAYERS } from './fitlib.mjs';

const TZ = 'Europe/Sarajevo';
const coords = JSON.parse(fs.readFileSync('data/ba_coords.json', 'utf8'));
const index = JSON.parse(fs.readFileSync('data/ba_cities_index.json', 'utf8'));

function scatter(rows) {
  let s = 0;
  for (const p of PRAYERS) {
    const r = rows.map(x => x.want[p] - x.got[p]).filter(v => Number.isFinite(v));
    const m = r.reduce((a, b) => a + b, 0) / r.length;
    s += Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / r.length);
  }
  return s / PRAYERS.length;
}
const out = [];
for (const id of Object.keys(index).map(Number)) {
  const meta = index[id], c = coords[id];
  const data = loadRows('data/' + meta.file);
  const sample = data.filter(d => +d.date.slice(8, 10) === 15);
  let best = null;
  for (let lat = c.lat - 2.4; lat <= c.lat + 2.4 + 1e-9; lat += 0.1) {
    for (let lon = c.lon - 0.6; lon <= c.lon + 0.6 + 1e-9; lon += 0.05) {
      const sc = scatter(compute(sample, { lat, lon, tz: TZ, fajr: 18, isha: 16, madhab: 'shafi' }));
      if (!best || sc < best.sc) best = { lat, lon, sc };
    }
  }
  // refine on the full year around the coarse optimum
  let fine = best;
  for (let lat = best.lat - 0.1; lat <= best.lat + 0.1 + 1e-9; lat += 0.02) {
    for (let lon = best.lon - 0.06; lon <= best.lon + 0.06 + 1e-9; lon += 0.01) {
      const sc = scatter(compute(data, { lat, lon, tz: TZ, fajr: 18, isha: 16, madhab: 'shafi' }));
      if (sc < fine.sc) fine = { lat, lon, sc };
    }
  }
  const rows = compute(data, { lat: fine.lat, lon: fine.lon, tz: TZ, fajr: 18, isha: 16, madhab: 'shafi' });
  const temkin = {};
  for (const p of PRAYERS) {
    const r = rows.map(x => x.want[p] - x.got[p]);
    temkin[p] = +(r.reduce((a, b) => a + b, 0) / r.length).toFixed(2);
  }
  const rec = { id, place: meta.place, trueLat: c.lat, trueLon: c.lon,
    lat: +fine.lat.toFixed(2), lon: +fine.lon.toFixed(2),
    dLat: +(fine.lat - c.lat).toFixed(2), dLon: +(fine.lon - c.lon).toFixed(2),
    scatter: +fine.sc.toFixed(2), temkin };
  out.push(rec);
  console.error(`${meta.place.padEnd(16)} ${c.lat.toFixed(2)},${c.lon.toFixed(2)} -> ${rec.lat},${rec.lon} d ${rec.dLat >= 0 ? '+' : ''}${rec.dLat}/${rec.dLon >= 0 ? '+' : ''}${rec.dLon} sc ${rec.scatter}`);
}
fs.writeFileSync('data/ba_point_solve.json', JSON.stringify(out, null, 1));
const sc = out.map(o => o.scatter);
console.log('cities', out.length, 'scatter mean', (sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(2), 'max', Math.max(...sc).toFixed(2));
