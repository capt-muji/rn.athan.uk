// Engine-free anchor test: printed day length (sunset - sunrise) depends only on
// declination, so the refraction constants cancel. Which seasonal phase does the
// chart's day length follow?
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const A = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const mod = await import(pathToFileURL(A + 'Adhan.js'));
const { default: SolarTime } = await import(pathToFileURL(A + 'SolarTime.js'));
const { default: TimeComponents } = await import(pathToFileURL(A + 'TimeComponents.js'));
const W = process.env.HOME + '/athan-gitree/census/o1k-wide/';
const rows = JSON.parse(fs.readFileSync(W + 'southasia2/data/pk-islamabad-nizam-2026.json', 'utf8'))._rows;
const keys = Object.keys(rows).sort();
const coords = new mod.Coordinates(33.6844, 73.0479);
const secOf = (d) => d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v) => { const mu = mean(v); return Math.sqrt(mean(v.map((x) => (x - mu) ** 2))); };
const parse = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

function dayLen(y, m, d) {
  const date = new Date(y, m - 1, d);
  const st = new SolarTime(date, coords);
  const at = (h) => secOf(new TimeComponents(h).utcDate(y, m - 1, d)) / 60;
  return at(st.sunset) - at(st.sunrise);
}
for (const y of [2016, 2024, 2026, 2027, 2028]) {
  const leap = y % 4 === 0;
  const byM = {}; const all = [];
  for (const k of keys) {
    const [, m, d] = k.split('-').map(Number);
    if (m === 2 && d === 29 && !leap) continue;
    const printed = (parse(rows[k].magrib) < 720 ? parse(rows[k].magrib) + 720 : parse(rows[k].magrib)) - 5 - parse(rows[k].sunrise);
    const r = printed - dayLen(y, m, d);
    (byM[m] ??= []).push(r); all.push(r);
  }
  console.log(`${y} ${leap ? 'L' : ' '} |`, Object.entries(byM).map(([m, v]) => mean(v).toFixed(1)).join(' '),
    '| mean', mean(all).toFixed(2), 'sd', sd(all).toFixed(2));
}
