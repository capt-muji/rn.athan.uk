// Stage 7: why the residual misses exist.
// The four solar columns are rounded from a raw minute value. If our engine differs
// from the publisher's by a sub-second amount, a cell mismatches exactly when the raw
// value sits within that amount of a .5 boundary. Measure how many cells do.
import fs from 'node:fs';
import path from 'node:path';
import { generate, PRAYERS } from './verify.mjs';

const HOME = process.env.HOME;
const ROOT = path.join(HOME, 'athan-gitree/census/o1g-decade');
const OUT = path.join(ROOT, 'verify');
const recipe = JSON.parse(fs.readFileSync(path.join(ROOT, 'fit/recipe.json'), 'utf8'));
const ext = JSON.parse(fs.readFileSync(path.join(OUT, 'extract-2028-2038.json'), 'utf8'));
const daysInMonth = (y, m) => [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];

const margin = (x) => Math.abs(x - Math.floor(x) - 0.5); // distance to the rounding boundary
const rows = [];
for (let y = 2028; y <= 2038; y++) {
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= daysInMonth(y, m); d++) {
      const k = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const g = generate(recipe, y, m, d);
      const r = g._raw;
      const raw = {
        sunrise: r.transitMin - r.ha + recipe.prayers.sunrise.marginMinutes,
        dhuhr: r.transitMin + recipe.prayers.dhuhr.marginMinutes,
        asr: r.transitMin + r.haAsr + recipe.prayers.asr.marginMinutes,
        magrib: r.transitMin + r.ha + recipe.prayers.magrib.marginMinutes,
      };
      const t = ext[k];
      const row = { k };
      for (const p of Object.keys(raw)) {
        row[p] = { m: margin(raw[p]), miss: Math.floor(raw[p] + 0.5) !== t[p] ? 1 : 0, raw: raw[p] };
      }
      rows.push(row);
    }
  }
}
const out = { thresholds: {} };
for (const th of [0.002, 0.005, 0.0087, 0.01, 0.02, 0.05]) {
  const rec = {};
  for (const p of ['sunrise', 'dhuhr', 'asr', 'magrib']) {
    const near = rows.filter((r) => r[p].m <= th);
    const missNear = near.filter((r) => r[p].miss).length;
    const missAll = rows.filter((r) => r[p].miss).length;
    rec[p] = { nearBoundary: near.length, ofThoseMissed: missNear, totalMisses: missAll };
  }
  out.thresholds[th] = rec;
}
// per-prayer miss rate vs. the fraction of cells inside 0.0087 min
out.summary = Object.fromEntries(['sunrise', 'dhuhr', 'asr', 'magrib'].map((p) => {
  const miss = rows.filter((r) => r[p].miss).length;
  return [p, { misses: miss, ratePct: +((100 * miss) / rows.length).toFixed(2) }];
}));
out.nearBoundaryExamples = rows
  .map((r) => ({ k: r.k, best: Math.min(...['sunrise', 'dhuhr', 'asr', 'magrib'].map((p) => r[p].m)) }))
  .filter((r) => r.best <= 0.002)
  .slice(0, 30);
fs.writeFileSync(path.join(OUT, 'stage7-boundary.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.thresholds['0.0087'], null, 1));
console.log(JSON.stringify(out.summary));
console.log('examples', JSON.stringify(out.nearBoundaryExamples));
