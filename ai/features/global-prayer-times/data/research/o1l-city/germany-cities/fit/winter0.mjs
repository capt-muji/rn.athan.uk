// Zero-margin angle discrimination on the held winter window (Jan-Mar + Oct-Dec,
// 182 days): nearest-minute rounding of the bare angle time against the printed
// column, the held fit4 comparison. Run: TZ=Europe/Berlin node fit/winter0.mjs
import fs from 'node:fs';
import { loadTable, makeContext } from './engine.mjs';

const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const cities = JSON.parse(fs.readFileSync('./fit/cities.json', 'utf8'));
const winter = (s) => { const m = s.date.getMonth() + 1; return m <= 3 || m >= 10; };
const roundN = (d) => d.getHours() * 60 + d.getMinutes() + (d.getSeconds() >= 30 ? 1 : 0);

const out = {};
for (const c of cities) {
  const t = loadTable({ file: `./data/de-diyanet-${c.tag}-2026.json`, cols });
  const slots = t.slots.filter(winter);
  const ctx = await makeContext(c.lat, c.lng, slots);
  const score = (angle, after, key) => {
    let ex = 0, w1 = 0, n = 0, worst = 0;
    for (let i = 0; i < slots.length; i++) {
      const d = ctx.hourAngle(i, -angle, after);
      if (isNaN(d.getTime())) continue;
      n++;
      const diff = Math.abs(roundN(d) - slots[i].chart[key]);
      if (diff === 0) ex++;
      if (diff <= 1) w1++;
      if (diff > worst) worst = diff;
    }
    return { angle, exact: ex, within1: w1, worst, coverage: n };
  };
  const isha = [15.0, 15.5, 15.75, 16.0, 16.25, 16.5, 17.0].map((a) => score(a, true, 'isha'));
  const fajr = [17.5, 18.0, 18.25, 18.5].map((a) => score(a, false, 'fajr'));
  out[c.tag] = { winterDays: slots.length, isha, fajr };
  console.log(
    `${c.tag.padEnd(12)} n=${slots.length} | isha ` +
    isha.map((x) => `${x.angle}:${x.exact}/${x.within1}`).join(' ') +
    ' | fajr ' + fajr.map((x) => `${x.angle}:${x.exact}/${x.within1}`).join(' ')
  );
}
fs.writeFileSync('./fit/winter0.json', JSON.stringify(out, null, 1));
