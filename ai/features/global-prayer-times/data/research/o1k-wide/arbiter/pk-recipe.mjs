// Final recipe scan for the Islamabad chart, on the leap anchor the residual
// phase test established. adhan 4.4.6, TZ=Asia/Karachi, published coordinate.
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
const parse = (s, pm) => { const [h, m] = s.split(':').map(Number); return (pm && h < 12 ? h + 12 : h) * 60 + m; };

const S = keys.map((k) => {
  const [, m, d] = k.split('-').map(Number);
  const y = 2028;
  const date = new Date(y, m - 1, d);
  const st = new SolarTime(date, coords);
  const at = (h) => secOf(new TimeComponents(h).utcDate(y, m - 1, d)) / 60;
  return { k, c: { fajr: parse(rows[k].fajr), sunrise: parse(rows[k].sunrise),
    dhuhr: parse(rows[k].dhuhr, 1), asr: parse(rows[k].asr, 1),
    magrib: parse(rows[k].magrib, 1), isha: parse(rows[k].isha, 1) },
    at, st };
});

function score(get, col, margin, mode) {
  let exact = 0, w1 = 0, worst = 0;
  for (const r of S) {
    const v = get(r) + margin;
    const q = mode === 'floor' ? Math.floor(v) : mode === 'ceil' ? Math.ceil(v) : Math.round(v);
    const diff = Math.abs(q - r.c[col]);
    if (diff === 0) exact++; if (diff <= 1) w1++; if (diff > worst) worst = diff;
  }
  return { exact, w1, worst };
}
function best(get, col, lo, hi, step = 0.05) {
  let top = { exact: -1 };
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const g = (r) => get(r, +a.toFixed(2));
    for (const margin of [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]) {
      for (const mode of ['floor', 'ceil', 'nearest']) {
        const s = score(g, col, margin, mode);
        if (s.exact > top.exact || (s.exact === top.exact && s.worst < top.worst))
          top = { angle: +a.toFixed(2), margin, mode, ...s };
      }
    }
  }
  return top;
}

const fajrAt = (r, a) => r.at(r.st.hourAngle(-a, false));
console.log('fajr best on leap anchor:', JSON.stringify(best(fajrAt, 'fajr', 17.5, 18.5)));
for (const [a, m, mode] of [[17.95, -0.5, 'floor'], [18, 0, 'floor'], [18, -0.5, 'floor'], [18, -1, 'nearest']])
  console.log(`  fajr ${a} ${m} ${mode}:`, JSON.stringify(score((r) => fajrAt(r, a), 'fajr', m, mode)));

console.log('sunrise best:', JSON.stringify(best((r) => r.at(r.st.sunrise), 'sunrise', 0, 0)));
for (const [m, mode] of [[-0.5, 'floor'], [0, 'nearest']])
  console.log(`  sunrise ${m} ${mode}:`, JSON.stringify(score((r) => r.at(r.st.sunrise), 'sunrise', m, mode)));

console.log('maghrib vs computed sunset, best:', JSON.stringify(best((r) => r.at(r.st.sunset), 'magrib', 5, 7)));
for (const [m, mode] of [[6, 'nearest'], [6.5, 'floor'], [5, 'nearest']])
  console.log(`  maghrib ${m} ${mode}:`, JSON.stringify(score((r) => r.at(r.st.sunset), 'magrib', m, mode)));

console.log('asr Hanafi best:', JSON.stringify(best((r) => r.at(r.st.afternoon(2)), 'asr', 0, 4)));
for (const [m, mode] of [[2, 'nearest'], [2.5, 'floor']])
  console.log(`  asrH ${m} ${mode}:`, JSON.stringify(score((r) => r.at(r.st.afternoon(2)), 'asr', m, mode)));
console.log('asr Shafi +2 nearest:', JSON.stringify(score((r) => r.at(r.st.afternoon(1)), 'asr', 2, 'nearest')));

// printed-sunset-derived maghrib, the exact chart relation
const raw = {};
for (let m = 1; m <= 12; m++) {
  const f = m >= 10 ? W + 'southasia/data/pk-islamabad-nizam-m10-12.json' : W + 'southasia/data/pk-islamabad-nizam-m' + String(m).padStart(2, '0') + '.json';
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(f, 'utf8')))) if (k.startsWith('2026-')) raw[k] = v;
}
const d = new Set(keys.map((k) => parse(raw[k][8], true) - parse(raw[k][7], true)));
console.log('printed maghrib - printed sunset unique values:', [...d].sort((a, b) => a - b));

// clock columns
const dh = [...new Set(keys.map((k) => rows[k].dhuhr))];
const isha = [...new Set(keys.map((k) => rows[k].isha))].sort();
const sw = [];
for (let i = 1; i < keys.length; i++) {
  if (rows[keys[i]].dhuhr !== rows[keys[i - 1]].dhuhr) sw.push(keys[i] + ' ' + rows[keys[i - 1]].dhuhr + '->' + rows[keys[i]].dhuhr);
  if (rows[keys[i]].isha !== rows[keys[i - 1]].isha) sw.push('isha ' + keys[i] + ' ' + rows[keys[i - 1]].isha + '->' + rows[keys[i]].isha);
}
console.log('dhuhr values', dh, '| isha values', isha.length, isha.join(' '));
console.log('switches:', sw.length, '\n ', sw.join('\n  '));
