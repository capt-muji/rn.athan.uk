// 2027-only angle check on the IGMG mirror: zero-margin nearest-minute exact
// counts over the 2027 days the mirror serves (2027-01-01..2027-11-30).
import fs from 'node:fs';
import { loadTable, makeContext } from './engine.mjs';

const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const index = JSON.parse(fs.readFileSync('./data/igmg-index.json', 'utf8'));
const roundN = (d) => d.getHours() * 60 + d.getMinutes() + (d.getSeconds() >= 30 ? 1 : 0);
const out = {};
for (const [tag, meta] of Object.entries(index)) {
  const { lat, lon } = meta.sun;
  const t = loadTable({ file: `./data/igmg-${tag}.json`, cols });
  const slots = t.slots.filter((s) => s.date.getFullYear() === 2027);
  const ctx = await makeContext(lat, lon, slots);
  const scan = (angles, prayer) => angles.map((a) => {
    let ex = 0, w1 = 0, n = 0;
    for (let i = 0; i < slots.length; i++) {
      const d = prayer === 'fajr' ? ctx.hourAngle(i, -a, false) : ctx.hourAngle(i, -a, true);
      if (isNaN(d.getTime())) continue;
      n++;
      const diff = Math.abs(roundN(d) - slots[i].chart[prayer]);
      if (diff === 0) ex++;
      if (diff <= 1) w1++;
    }
    return { angle: a, exact: ex, within1: w1, coverage: n };
  });
  out[tag] = { days: slots.length, fajr: scan([17.5, 18, 18.25, 18.5], 'fajr'), isha: scan([15.5, 16, 16.5, 17], 'isha') };
  const f = out[tag].fajr, i2 = out[tag].isha;
  console.log(`${tag.padEnd(12)} n=${slots.length} fajr ${f.map((x) => `${x.angle}:${x.exact}/${x.coverage}`).join(' ')} | isha ${i2.map((x) => `${x.angle}:${x.exact}/${x.coverage}`).join(' ')}`);
}
fs.writeFileSync('./fit/y2027-angle.json', JSON.stringify(out, null, 1));
