// Anchor test 2: the print's seasonal phase, measured against leap years and
// common years at a FIXED convention (no per-year margin re-optimisation).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const A = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const mod = await import(pathToFileURL(A + 'Adhan.js'));
const { default: SolarTime } = await import(pathToFileURL(A + 'SolarTime.js'));
const { default: TimeComponents } = await import(pathToFileURL(A + 'TimeComponents.js'));

const LAT = 33.6844, LNG = 73.0479;
const W = process.env.HOME + '/athan-gitree/census/o1k-wide/';
const rows = JSON.parse(fs.readFileSync(W + 'southasia2/data/pk-islamabad-nizam-2026.json', 'utf8'))._rows;
const keys = Object.keys(rows).sort();
const coords = new mod.Coordinates(LAT, LNG);
const secOf = (d) => d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v) => { const mu = mean(v); return Math.sqrt(mean(v.map((x) => (x - mu) ** 2))); };
const parse = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

function fajrAt(y, m, d, angle = 18) {
  const date = new Date(y, m - 1, d);
  const st = new SolarTime(date, coords);
  return secOf(new TimeComponents(st.hourAngle(-angle, false)).utcDate(y, m - 1, d)) / 60;
}

console.log('year  leap? | month-mean residual (printed - 18.00 computed), fixed convention');
const years = [2016, 2020, 2024, 2026, 2027, 2028, 2029];
for (const y of years) {
  const leap = y % 4 === 0;
  const byM = {};
  let all = [];
  for (const k of keys) {
    const [, m, d] = k.split('-').map(Number);
    if (m === 2 && d === 29 && !leap) continue;
    const r = parse(rows[k].fajr) - fajrAt(y, m, d);
    (byM[m] ??= []).push(r); all.push(r);
  }
  const line = Object.entries(byM).map(([m, v]) => mean(v).toFixed(1)).join(' ');
  console.log(`${y} ${leap ? 'L' : ' '}      | ${line} | all sd ${sd(all).toFixed(2)}`);
}

// same test on sunrise, the column with no twilight-convention ambiguity
console.log('\nsunrise: month-mean residual (printed - computed -0.833)');
function sunriseAt(y, m, d) {
  const date = new Date(y, m - 1, d);
  const st = new SolarTime(date, coords);
  return secOf(new TimeComponents(st.sunrise).utcDate(y, m - 1, d)) / 60;
}
for (const y of [2016, 2024, 2026, 2027, 2028]) {
  const leap = y % 4 === 0;
  const byM = {};
  let all = [];
  for (const k of keys) {
    const [, m, d] = k.split('-').map(Number);
    if (m === 2 && d === 29 && !leap) continue;
    const r = parse(rows[k].sunrise) - sunriseAt(y, m, d);
    (byM[m] ??= []).push(r); all.push(r);
  }
  const line = Object.entries(byM).map(([m, v]) => mean(v).toFixed(1)).join(' ');
  console.log(`${y} ${leap ? 'L' : ' '}      | ${line} | all sd ${sd(all).toFixed(2)}`);
}

// magnitude of the year-to-year seasonal phase: same month-day across years
console.log('\nseasonal drift of the computed dawn, 2016 -> 2028, 15th of each month');
for (const m of [3, 6, 9, 12]) {
  const v = [2016, 2020, 2024, 2026, 2027, 2028].map((y) => fajrAt(y, m, 15));
  console.log(` ${m}/15:`, v.map((x) => x.toFixed(1)).join(' '), 'spread', (Math.max(...v) - Math.min(...v)).toFixed(2), 'min');
}
