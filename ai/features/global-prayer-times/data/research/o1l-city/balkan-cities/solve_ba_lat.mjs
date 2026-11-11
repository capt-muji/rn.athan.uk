// Solve each city's implied computation latitude: the latitude whose 18/16 twilight
// reproduces the published fajr/isha series with the smallest scatter.
import fs from 'node:fs';
import { loadRows, compute } from './fitlib.mjs';

const TZ = 'Europe/Sarajevo';
const coords = JSON.parse(fs.readFileSync('data/ba_coords.json', 'utf8'));
const index = JSON.parse(fs.readFileSync('data/ba_cities_index.json', 'utf8'));

function scatter(rows, prayers) {
  let s = 0, n = 0;
  for (const p of prayers) {
    const r = rows.map(x => x.want[p] - x.got[p]);
    const m = r.reduce((a, b) => a + b, 0) / r.length;
    s += Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / r.length);
    n++;
  }
  return s / n;
}
const out = [];
for (const id of Object.keys(index).map(Number)) {
  const meta = index[id]; const c = coords[id];
  if (!c) continue;
  const data = loadRows(`data/${meta.file}`);
  let best = null;
  for (let lat = 42.0; lat <= 45.6; lat += 0.05) {
    const rows = compute(data, { lat, lon: c.lon, tz: TZ, fajr: 18, isha: 16, madhab: 'shafi' });
    const sc = scatter(rows, ['fajr', 'isha']);
    if (!best || sc < best.scatter) best = { lat: +lat.toFixed(2), scatter: +sc.toFixed(2) };
  }
  const atTrue = (() => {
    const rows = compute(data, { lat: c.lat, lon: c.lon, tz: TZ, fajr: 18, isha: 16, madhab: 'shafi' });
    return +scatter(rows, ['fajr', 'isha']).toFixed(2);
  })();
  out.push({ place: meta.place, trueLat: c.lat, impliedLat: best.lat, dLat: +(best.lat - c.lat).toFixed(2), scatterImplied: best.scatter, scatterAtTrue: atTrue });
  console.error(`${meta.place.padEnd(16)} true ${c.lat.toFixed(2)} implied ${best.lat.toFixed(2)} d ${(best.lat - c.lat >= 0 ? '+' : '')}${(best.lat - c.lat).toFixed(2)} scatter ${best.scatter} (at true ${atTrue})`);
}
fs.writeFileSync('data/ba_lat_solve.json', JSON.stringify(out, null, 1));
const impl = out.map(o => o.impliedLat);
console.log('implied lat range', Math.min(...impl).toFixed(2), Math.max(...impl).toFixed(2),
  'mean', (impl.reduce((a, b) => a + b, 0) / impl.length).toFixed(2));
const good = out.filter(o => o.scatterImplied < 0.8);
console.log('cities with implied scatter < 0.8 min:', good.length, 'of', out.length);
const gi = good.map(o => o.impliedLat);
console.log('their implied lat range', Math.min(...gi).toFixed(2), Math.max(...gi).toFixed(2), 'mean', (gi.reduce((a, b) => a + b, 0) / gi.length).toFixed(2));
