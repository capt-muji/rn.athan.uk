// Named-candidate comparison and per-year admissible windows for Job 1.
import fs from 'node:fs';
import path from 'node:path';
import { init, solarDay, rnd, score, round2, line } from './lib.mjs';

const ROOT = path.resolve(process.env.HOME, 'athan-gitree/census/o1k-wide/deep3');
const CITIES = {
  jakarta: { lat: -6.2088, lng: 106.8456, tz: 'Asia/Jakarta' },
  surabaya: { lat: -7.2575, lng: 112.7521, tz: 'Asia/Jakarta' },
  jayapura: { lat: -2.5916, lng: 140.6690, tz: 'Asia/Jayapura' },
};
const YEARS = [2025, 2027, 2029, 2031, 2033, 2035];
await init();

const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/khgt-decade-rows.json'), 'utf8'));
const rows = src.rows;

const col = (key, kind, angle) => rows.map((r) => {
  const c = CITIES[r.city];
  const d = solarDay(c.lat, c.lng, r.iso, c.tz);
  return kind === 'fajr' ? d.fajr(angle) : d.isha(angle);
});

const printed = (key) => rows.map((r) => r[key]);

const candidates = [];
const add = (name, key, kind, angle, mode, margin) => candidates.push({ name, key, kind, angle, mode, margin });

for (const a of [17.9, 18, 18.1]) {
  for (const m of [1, 1.5, 2]) for (const mode of ['ceil', 'nearest', 'floor']) {
    add(`f ${a}/${mode}/${m}`, 'fajr', 'fajr', a, mode, m);
    add(`i ${a}/${mode}/${m}`, 'isha', 'isha', a, mode, m);
  }
}
const out = [];
for (const c of candidates) {
  const s = score(rows.map((r) => r.iso), printed(c.key), (d) => col(c.key, c.kind, c.angle)[d], c.mode, c.margin);
  out.push({ ...c, ...s });
}
const rank = out.filter((c) => c.key === 'fajr').sort((a, b) => b.exact - a.exact);
console.log('--- fajr candidates (top 8) ---');
for (const c of rank.slice(0, 8)) console.log(line(c.name, c));
const rankI = out.filter((c) => c.key === 'isha').sort((a, b) => b.exact - a.exact);
console.log('--- isha candidates (top 8) ---');
for (const c of rankI.slice(0, 8)) console.log(line(c.name, c));
console.log('--- held reading: 18/18 +1.5 ---');
for (const c of out.filter((x) => x.margin === 1.5 && x.angle === 18)) console.log(line(c.name, c));

// Per-year admissible margin at a fixed angle, ceil rounding: the interval of
// margins that prints every row of that year exactly.
const windows = {};
for (const [key, kind] of [['fajr', 'fajr'], ['isha', 'isha']]) {
  const secs = col(key, kind, 18);
  windows[key] = {};
  for (const y of YEARS) {
    const idx = rows.map((r, i) => r.year === y ? i : -1).filter((i) => i >= 0);
    let lo = -Infinity, hi = Infinity;
    for (const i of idx) {
      const base = secs[i] / 60;
      const c = rows[i][key];
      // ceil(base + m) == c  ->  c-1 < base+m <= c  ->  m in (c-1-base, c-base]
      lo = Math.max(lo, c - 1 - base);
      hi = Math.min(hi, c - base);
    }
    windows[key][y] = { lo: round2(lo), hi: round2(hi), width: round2(hi - lo) };
  }
  console.log(key, 'year window at 18deg ceil:', JSON.stringify(windows[key]));
}

fs.writeFileSync(path.join(ROOT, 'data', 'khgt-candidates.json'), JSON.stringify({ candidates: out, windows }, null, 1));
console.log('wrote khgt-candidates.json');
