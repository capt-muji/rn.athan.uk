// Final whole-axis numbers on the validated point set: the three districts whose
// printed table contradicts their gazetteer point are excluded and named.
import fs from 'node:fs';
import path from 'node:path';
import { loadAdhan, parseHHMM } from '../../germany-cities/fit/lib.mjs';

const OUT = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const isWinter = (k) => { const m = Number(k.slice(5, 7)); return m <= 3 || m >= 10; };
const wrap = (d) => { d %= 1440; if (d > 720) d -= 1440; if (d < -720) d += 1440; return d; };

const sweep = JSON.parse(fs.readFileSync(`${OUT}/fit/district-sweep.json`, 'utf8'));
const lat = Object.fromEntries(JSON.parse(fs.readFileSync(`${OUT}/fit/recovered-lat.json`, 'utf8')).map((x) => [x.id, x]));
const REJECT = new Set(['HORST', 'REGENSTAUF', 'LAUENFORDE'].map((n) => Object.values(lat).find((x) => x.name === n)?.id).filter(Boolean));
const rows = sweep.filter((r) => !REJECT.has(r.id));

const mode = (arr) => { const c = {}; for (const x of arr) c[x] = (c[x] || 0) + 1; return Object.entries(c).sort((a, b) => b[1] - a[1]); };
const q = (a) => [Math.min(...a), Math.max(...a)];
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

console.log(`VALIDATED SET: ${rows.length} districts (${REJECT.size} excluded: ${[...REJECT].map((id) => `${lat[id].name} ${lat[id].gazLat}->${lat[id].solvedLat}`).join(', ')})`);
const d = Object.values(lat).filter((x) => !REJECT.has(x.id)).map((x) => Math.abs(x.delta)).sort((a, b) => a - b);
console.log(`  latitude recovered vs gazetteer: median ${d[Math.floor(d.length / 2)]}, p99 ${d[Math.floor(d.length * 0.99)]}, max ${d[d.length - 1]}, within 0.10 deg ${d.filter((x) => x <= 0.1).length}/${d.length}`);

console.log('\nrecipe margins across the validated set:');
for (const c of ['sunrise', 'dhuhr', 'maghrib', 'asrShafi']) {
  const m = mode(rows.map((r) => `${r.solar[c].margin} ${r.solar[c].mode}`));
  const ex = rows.map((r) => r.solar[c].exact);
  console.log(`  ${c.padEnd(9)} ${m.slice(0, 5).map(([k, v]) => `${k} x${v}`).join(', ')}`);
  console.log(`  ${' '.repeat(9)} exact median ${med(ex)}/365, p10 ${[...ex].sort((a, b) => a - b)[Math.floor(ex.length * 0.1)]}, worst ${Math.min(...ex)}`);
}
console.log(`  asr Hanafi: ${mode(rows.map((r) => `${r.solar.asrHanafi.margin} ${r.solar.asrHanafi.mode}`))[0][0]} at ${rows.length}/${rows.length}; Shafi better at ${rows.filter((r) => r.solar.asrShafi.exact >= r.solar.asrHanafi.exact).length}/${rows.length}`);

console.log('\nzero-margin angle identification, winter window, across the validated set:');
for (const a of ['17', '17.5', '18', '18.25', '18.5']) {
  const e = rows.map((r) => r.fajrAngle[a]).filter(Boolean);
  const ex = e.map((x) => x.exact), w = e.map((x) => x.within1);
  console.log(`  fajr ${String(a).padEnd(5)} exact ${q(ex).join('-')}/182 (median ${med(ex)}), within1 ${q(w).join('-')}, zero-exact districts ${ex.filter((x) => x === 0).length}/${e.length}`);
}
for (const a of ['15', '15.5', '15.75', '16', '16.25', '16.5', '17']) {
  const e = rows.map((r) => r.ishaAngle[a]).filter(Boolean);
  const ex = e.map((x) => x.exact), w = e.map((x) => x.within1);
  console.log(`  isha ${String(a).padEnd(5)} exact ${q(ex).join('-')}/182 (median ${med(ex)}), within1 ${q(w).join('-')}, zero-exact districts ${ex.filter((x) => x === 0).length}/${e.length}`);
}

// ---- difference space -------------------------------------------------------
const adhan = await loadAdhan();
const secOf = (dt) => dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
const RECIPE = { sunrise: -6.5, dhuhr: 5.5, asr: 3, maghrib: 6.5 };
function recipeAt(latv, lon, keys) {
  const coords = new adhan.Coordinates(latv, lon);
  const o = { sunrise: [], dhuhr: [], asr: [], maghrib: [], fajr: [], isha: [] };
  for (const k of keys) {
    const [y, m, dd] = k.split('-').map(Number);
    const st = new adhan.SolarTime(new Date(y, m - 1, dd), coords);
    const inst = (h) => new adhan.TimeComponents(h).utcDate(y, m - 1, dd);
    const f = inst(st.hourAngle(-18, false)), g = inst(st.hourAngle(-16, true));
    o.sunrise.push(Math.floor(secOf(inst(st.sunrise)) / 60 + RECIPE.sunrise));
    o.dhuhr.push(Math.floor(secOf(inst(st.transit)) / 60 + RECIPE.dhuhr));
    o.asr.push(Math.floor(secOf(inst(st.afternoon(1))) / 60 + RECIPE.asr));
    o.maghrib.push(Math.floor(secOf(inst(st.sunset)) / 60 + RECIPE.maghrib));
    o.fajr.push(isNaN(f.getTime()) ? null : Math.floor(secOf(f) / 60));
    o.isha.push(isNaN(g.getTime()) ? null : Math.floor(secOf(g) / 60));
  }
  return o;
}

let seed = 20261111;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const byState = {};
for (const r of rows) (byState[r.state] ||= []).push(r);
const pairs = [];
for (const [st, ds] of Object.entries(byState)) {
  const total = (ds.length * (ds.length - 1)) / 2;
  const want = Math.min(total, Math.max(60, Math.round(4000 * total / 90000)));
  const seen = new Set();
  for (let t = 0; t < want * 3 && seen.size < want; t++) {
    const i = Math.floor(rnd() * ds.length), j = Math.floor(rnd() * ds.length);
    if (i === j) continue;
    const k = `${Math.min(i, j)}:${Math.max(i, j)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    pairs.push([st, ds[Math.min(i, j)], ds[Math.max(i, j)]]);
  }
}
console.log(`\nDIFFERENCE SPACE: ${pairs.length} same-state pairs sampled across ${Object.keys(byState).length} states`);

const cache = new Map();
const tab = (id) => { if (!cache.has(id)) cache.set(id, JSON.parse(fs.readFileSync(`${OUT}/data/district-${id}-2026.json`, 'utf8'))); return cache.get(id); };
const model = new Map();
const mod = (r, keys) => { if (!model.has(r.id)) model.set(r.id, recipeAt(r.lat, r.lon, keys)); return model.get(r.id); };

const stat = { winter: {}, summer: {} };
for (const c of COLS) { stat.winter[c] = []; stat.summer[c] = []; }
for (const [, a, b] of pairs) {
  const keys = Object.keys(tab(a.id)).sort();
  const ma = mod(a, keys), mb = mod(b, keys);
  for (const c of COLS) {
    const w = [], s = [];
    for (let k = 0; k < keys.length; k++) {
      if (ma[c][k] === null || mb[c][k] === null) continue;
      const r = wrap(wrap(parseHHMM(tab(a.id)[keys[k]][c]) - parseHHMM(tab(b.id)[keys[k]][c])) - wrap(ma[c][k] - mb[c][k]));
      (isWinter(keys[k]) ? w : s).push(r);
    }
    const pack = (arr) => (arr.length ? { n: arr.length, zero: arr.filter((x) => x === 0).length / arr.length,
      w1: arr.filter((x) => Math.abs(x) <= 1).length / arr.length, maxAbs: Math.max(...arr.map(Math.abs)) } : null);
    stat.winter[c].push(pack(w)); stat.summer[c].push(pack(s));
  }
}
fs.writeFileSync(`${OUT}/fit/difference-space.json`, JSON.stringify(stat, null, 1));
for (const season of ['winter', 'summer']) {
  console.log(`  ${season}:`);
  for (const c of COLS) {
    const s = stat[season][c].filter(Boolean);
    if (!s.length) { console.log(`    ${c.padEnd(8)} no days`); continue; }
    console.log(`    ${c.padEnd(8)} within1 ${q(s.map((x) => x.w1 * 100)).map((v) => v.toFixed(1)).join('-')}%  ` +
      `zero ${q(s.map((x) => x.zero * 100)).map((v) => v.toFixed(1)).join('-')}%  maxAbs ${Math.max(...s.map((x) => x.maxAbs))}  med within1 ${med(s.map((x) => x.w1 * 100)).toFixed(1)}%`);
  }
}
