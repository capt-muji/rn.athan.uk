// Zero-margin angle discrimination (no margin sweep): nearest-minute rounding of
// the bare angle time against the printed column, the held fit4 comparison.
import { loadTable, makeContext } from './engine.mjs';

const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1l-city/watches-eu/data/';
const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const cities = [
  { tag: 'muenchen', lat: 48.1372, lng: 11.5756 },
  { tag: 'hamburg', lat: 53.5511, lng: 9.9937 },
  { tag: 'stuttgart', lat: 48.7758, lng: 9.1829 },
];
const winter = (s) => { const m = s.date.getMonth() + 1; return m <= 3 || m >= 10; };
const roundN = (d) => {
  const s = d.getSeconds();
  return d.getHours() * 60 + d.getMinutes() + (s >= 30 ? 1 : 0);
};

for (const c of cities) {
  const t = loadTable({ file: `${D}de-diyanet-${c.tag}-2026.json`, cols });
  const slots = t.slots.filter(winter);
  const ctx = await makeContext(c.lat, c.lng, slots);
  const score = (angle, after, key) => {
    let ex = 0, w1 = 0, n = 0;
    for (let i = 0; i < slots.length; i++) {
      const d = ctx.hourAngle(i, -angle, after);
      if (isNaN(d.getTime())) continue;
      n++;
      const v = roundN(d), p = slots[i].chart[key];
      const diff = Math.abs(v - p);
      if (diff === 0) ex++;
      if (diff <= 1) w1++;
    }
    return `${ex}/${w1} of ${n}`;
  };
  const parts = [15.0, 15.5, 16.0, 16.5, 17.0].map((a) => `isha ${a}: ${score(a, true, 'isha')}`);
  console.log(c.tag, `winter days ${slots.length}`, '| fajr 18:', score(18, false, 'fajr'), '|', parts.join('  '));
}
