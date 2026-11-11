// Is the day-length hump a latitude difference or an engine convention?
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const A = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const mod = await import(pathToFileURL(A + 'Adhan.js'));
const { default: SolarTime } = await import(pathToFileURL(A + 'SolarTime.js'));
const { default: TimeComponents } = await import(pathToFileURL(A + 'TimeComponents.js'));
const W = process.env.HOME + '/athan-gitree/census/o1k-wide/';
const rows = JSON.parse(fs.readFileSync(W + 'southasia2/data/pk-islamabad-nizam-2026.json', 'utf8'))._rows;
const keys = Object.keys(rows).sort();
const secOf = (d) => d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v) => { const mu = mean(v); return Math.sqrt(mean(v.map((x) => (x - mu) ** 2))); };
const p = (s) => { const [h, m] = s.split(':').map(Number); return (h < 12 ? h + 12 : h) * 60 + m; };

function dl(lat, y, m, d) {
  const date = new Date(y, m - 1, d);
  const st = new SolarTime(date, new mod.Coordinates(lat, 73.0479));
  const at = (h) => secOf(new TimeComponents(h).utcDate(y, m - 1, d)) / 60;
  return at(st.sunset) - at(st.sunrise);
}
for (const y of [2028, 2026]) {
  let best = { sd: 1e9 };
  for (let lat = 33.40; lat <= 33.95; lat += 0.01) {
    const v = [];
    for (const k of keys) {
      const [, m, d] = k.split('-').map(Number);
      if (m === 2 && d === 29 && y % 4 !== 0) continue;
      v.push((p(rows[k].magrib) - 5 - p(rows[k].sunrise)) - dl(lat, y, m, d));
    }
    const s = sd(v);
    if (s < best.sd) best = { lat: +lat.toFixed(2), sd: s, mean: mean(v) };
  }
  console.log(y, 'best latitude for day length:', JSON.stringify(best));
}
// what a 0.01 deg latitude step is worth in March, and 0.1 deg in longitude
console.log('0.10 deg lat, 15 Mar day length:', (dl(33.78, 2028, 3, 15) - dl(33.68, 2028, 3, 15)).toFixed(2), 'min');
console.log('0.10 deg lon, 15 Mar day length:', (dl(33.68, 2028, 3, 15) - dl(33.68, 2028, 3, 15)).toFixed(2), 'min (lon cancels)');
