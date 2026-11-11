// Arbitration item 1: the Islamabad chart's anchor and recipe, re-derived.
// adhan 4.4.6, TZ=Asia/Karachi, no clock reads, published coordinate.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const A = process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/';
const mod = await import(pathToFileURL(A + 'Adhan.js'));
const { default: SolarTime } = await import(pathToFileURL(A + 'SolarTime.js'));
const { default: TimeComponents } = await import(pathToFileURL(A + 'TimeComponents.js'));

const LAT = 33.6844, LNG = 73.0479;
const W = process.env.HOME + '/athan-gitree/census/o1k-wide/';
const rows = JSON.parse(fs.readFileSync(W + 'southasia2/data/pk-islamabad-nizam-2026.json', 'utf8'))._rows;
const rawCols = {};
for (let m = 1; m <= 12; m++) {
  const f = W + 'southasia/data/pk-islamabad-nizam-m' + String(m).padStart(2, '0') + '.json';
  const src = m === 10 || m === 11 || m === 12 ? W + 'southasia/data/pk-islamabad-nizam-m10-12.json' : f;
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(src, 'utf8')))) {
    if (k.startsWith('2026-')) rawCols[k] = v;
  }
}
const parse = (s, pm) => {
  const [h, mi] = s.split(':').map(Number);
  return (pm && h < 12 ? h + 12 : h) * 60 + mi;
};
const PM = { dhuhr: 1, asr: 1, magrib: 1, isha: 1 };
const keys = Object.keys(rows).sort();
const coords = new mod.Coordinates(LAT, LNG);
const secOf = (d) => d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v) => { const mu = mean(v); return Math.sqrt(mean(v.map((x) => (x - mu) ** 2))); };

function sol(y, m, d) {
  const date = new Date(y, m - 1, d);
  const st = new SolarTime(date, coords);
  const at = (hours) => secOf(new TimeComponents(hours).utcDate(y, m - 1, d)) / 60;
  return { fajr18: at(st.hourAngle(-18, false)), sunrise: at(st.sunrise),
    sunset: at(st.sunset), asrH: at(st.afternoon(2)), transit: at(st.transit) };
}
const chart = (k) => ({
  fajr: parse(rows[k].fajr), sunrise: parse(rows[k].sunrise), dhuhr: parse(rows[k].dhuhr, 1),
  asr: parse(rows[k].asr, 1), magrib: parse(rows[k].magrib, 1), isha: parse(rows[k].isha, 1),
});

// ---------- 1. anchor: does the print follow leap geometry (2028) or common (2026)? ----------
const L = keys.map((k) => { const [, m, d] = k.split('-').map(Number); return { k, m, d, c: chart(k), s: sol(2028, m, d) }; });
const C = L.filter((r) => !(r.m === 2 && r.d === 29)).map((r) => ({ ...r, s: sol(2026, r.m, r.d) }));

const resid = (set, col, key) => set.map((r) => r.c[col] - r.s[key]);
const fL = resid(L, 'fajr', 'fajr18'), fC = resid(C, 'fajr', 'fajr18');
console.log('== 1. fajr residual (printed minus computed 18.00), overall ==');
console.log(' leap 2028 : n', fL.length, 'mean', mean(fL).toFixed(2), 'sd', sd(fL).toFixed(2),
  'range', Math.min(...fL).toFixed(1), Math.max(...fL).toFixed(1));
console.log(' common 26 : n', fC.length, 'mean', mean(fC).toFixed(2), 'sd', sd(fC).toFixed(2),
  'range', Math.min(...fC).toFixed(1), Math.max(...fC).toFixed(1));

// the decisive instrument: the residual step at 1 March. The mapping that is
// right is smooth across Feb->Mar; the wrong one is one day out from 1 March.
const byMonth = (set, col, key) => {
  const o = {};
  for (const r of set) (o[r.m] ??= []).push(r.c[col] - r.s[key]);
  return Object.fromEntries(Object.entries(o).map(([m, v]) => [m, +mean(v).toFixed(2)]));
};
console.log(' fajr month means  leap  :', JSON.stringify(byMonth(L, 'fajr', 'fajr18')));
console.log(' fajr month means  common:', JSON.stringify(byMonth(C, 'fajr', 'fajr18')));
console.log(' sunrise month means leap  :', JSON.stringify(byMonth(L, 'sunrise', 'sunrise')));
console.log(' sunrise month means common:', JSON.stringify(byMonth(C, 'sunrise', 'sunrise')));

// drop the known-low February rows, compare Mar-Dec sd (the phase-sensitive block)
const md = (set, col, key) => set.filter((r) => r.m >= 3).map((r) => r.c[col] - r.s[key]);
console.log(' Mar-Dec fajr sd   leap', sd(md(L, 'fajr', 'fajr18')).toFixed(2),
  '| common', sd(md(C, 'fajr', 'fajr18')).toFixed(2));
console.log(' Mar-Dec sunrise sd leap', sd(md(L, 'sunrise', 'sunrise')).toFixed(2),
  '| common', sd(md(C, 'sunrise', 'sunrise')).toFixed(2));

// daily daily-step of the computed dawn, to size a one-day phase error
const stepMar = sol(2028, 3, 1).fajr18 - sol(2028, 2, 29).fajr18;
const stepJun = sol(2028, 6, 1).fajr18 - sol(2028, 5, 31).fajr18;
const stepOct = sol(2028, 10, 1).fajr18 - sol(2028, 9, 30).fajr18;
console.log(' one-day dawn motion: 1 Mar', stepMar.toFixed(2), 'min | 1 Jun', stepJun.toFixed(2), '| 1 Oct', stepOct.toFixed(2));

// fit1's instrument: best-over-margin exact counts per anchor year
function bestCount(year) {
  let best = { exact: -1 };
  for (const angle of [17.8, 17.9, 17.95, 18.0, 18.05, 18.1, 18.2]) {
    const vals = keys.map((k) => {
      const [, m, d] = k.split('-').map(Number);
      if (m === 2 && d === 29 && !(year % 4 === 0)) return null;
      return sol(year, m, d).fajr18;  // angle is re-derived below instead
    }).filter((x) => x !== null);
    for (const margin of [-1.5, -1, -0.5, 0, 0.5, 1]) {
      for (const mode of ['floor', 'ceil', 'nearest']) {
        let exact = 0, i = 0;
        for (const k of keys) {
          const [, m, d] = k.split('-').map(Number);
          if (m === 2 && d === 29 && !(year % 4 === 0)) continue;
          const date = new Date(year, m - 1, d);
          const st = new SolarTime(date, coords);
          const t = new TimeComponents(st.hourAngle(-angle, false)).utcDate(year, m - 1, d);
          const v = secOf(t) / 60 + margin;
          const q = mode === 'floor' ? Math.floor(v) : mode === 'ceil' ? Math.ceil(v) : Math.round(v);
          if (q === parse(rows[k].fajr)) exact++;
          i++;
        }
        if (exact > best.exact) best = { exact, n: i, angle, margin, mode };
      }
    }
  }
  return best;
}
console.log('\n== 1b. best-over-margin exact, per anchor year (fit1 instrument) ==');
for (const y of [2024, 2026, 2027, 2028]) console.log(' ', y, JSON.stringify(bestCount(y)));

// ---------- 2. rounding-mode degeneracy at fixed 18.00 ----------
console.log('\n== 2. fajr at the printed convention, leap mapping ==');
for (const [angle, margin, mode] of [[17.95, -0.5, 'floor'], [18.0, 0, 'floor'], [18.0, 0, 'nearest'], [18.0, -0.5, 'floor']]) {
  let exact = 0, w1 = 0, worst = 0;
  for (const r of L) {
    const date = new Date(2028, r.m - 1, r.d);
    const st = new SolarTime(date, coords);
    const t = new TimeComponents(st.hourAngle(-angle, false)).utcDate(2028, r.m - 1, r.d);
    const v = secOf(t) / 60 + margin;
    const q = mode === 'floor' ? Math.floor(v) : mode === 'ceil' ? Math.ceil(v) : Math.round(v);
    const diff = Math.abs(q - r.c.fajr);
    if (diff === 0) exact++; if (diff <= 1) w1++; if (diff > worst) worst = diff;
  }
  console.log(`  ${(angle + ' ' + margin + ' ' + mode).padEnd(20)} exact ${exact}  within1 ${w1}  worst ${worst}`);
}

// ---------- 3. maghrib: the chart's own sunset + 5, and sunset + 6 on computed ----------
console.log('\n== 3. maghrib ==');
const diffs = new Set();
for (const k of keys) diffs.add(parse(rawCols[k][8], true) - parse(rawCols[k][7], true));
console.log(' printed maghrib minus printed sunset, unique values:', [...diffs].sort((a, b) => a - b));
let m5 = 0, m6n = 0;
for (const r of L) {
  if (Math.floor(r.s.sunset) + 5 === r.c.magrib) m5++;
  if (Math.round(r.s.sunset + 6) === r.c.magrib) m6n++;
}
console.log(' computed sunset floor +5 == print:', m5, '/366; computed sunset +6 nearest == print:', m6n, '/366');
// ---------- 4. asr, dhuhr, isha ----------
let ae = 0, aw = 0, aworst = 0;
for (const r of L) {
  const d = Math.abs(Math.round(r.s.asrH + 2) - r.c.asr);
  if (d === 0) ae++; if (d <= 1) aw++; if (d > aworst) aworst = d;
}
console.log('\n== 4. asr Hanafi +2 nearest: exact', ae, 'within1', aw, 'worst', aworst);
const dh = [...new Set(keys.map((k) => rows[k].dhuhr))];
const ish = [...new Set(keys.map((k) => rows[k].isha))].sort();
const switches = [];
for (let i = 1; i < keys.length; i++) if (rows[keys[i]].dhuhr !== rows[keys[i - 1]].dhuhr)
  switches.push(keys[i] + ' -> ' + rows[keys[i]].dhuhr);
console.log('  dhuhr distinct', dh, 'switches', switches);
console.log('  isha distinct', ish.length, ish.join(' '), '| all 15-min grid:',
  ish.every((v) => parse(v) % 15 === 0));
