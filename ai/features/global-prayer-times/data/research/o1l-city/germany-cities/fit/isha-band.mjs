// Fine isha-angle band at the publisher's own point: zero-margin nearest-minute
// exact counts on the winter window (Oct-Mar), 15.8..16.5 at 0.05.
import fs from 'node:fs';
import { loadTable, makeContext } from './engine.mjs';

const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const index = JSON.parse(fs.readFileSync('./data/igmg-index.json', 'utf8'));
const roundN = (d) => d.getHours() * 60 + d.getMinutes() + (d.getSeconds() >= 30 ? 1 : 0);
const out = {};
for (const [tag, meta] of Object.entries(index)) {
  const { lat, lon } = meta.sun;
  const t = loadTable({ file: `./data/igmg-${tag}.json`, cols });
  const slots = t.slots.filter((s) => { const m = s.date.getMonth() + 1; return m <= 3 || m >= 10; });
  const ctx = await makeContext(lat, lon, slots);
  const row = [];
  for (let a = 15.8; a <= 16.5001; a += 0.05) {
    let ex = 0, w1 = 0;
    for (let i = 0; i < slots.length; i++) {
      const d = ctx.hourAngle(i, -a, true);
      if (isNaN(d.getTime())) continue;
      const diff = Math.abs(roundN(d) - slots[i].chart.isha);
      if (diff === 0) ex++;
      if (diff <= 1) w1++;
    }
    row.push({ angle: +a.toFixed(2), exact: ex, within1: w1 });
  }
  out[tag] = row;
  const best = row.reduce((b, x) => (x.exact > b.exact ? x : b));
  console.log(`${tag.padEnd(12)} n=${slots.length} best ${best.angle} exact ${best.exact} within1 ${best.within1} | ${row.map((x) => `${x.angle}:${x.exact}`).join(' ')}`);
}
fs.writeFileSync('./fit/isha-band.json', JSON.stringify(out, null, 1));
