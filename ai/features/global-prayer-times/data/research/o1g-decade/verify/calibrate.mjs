// Stage 6: engine calibration and sensitivity.
// a) Run the same generator on 2027 and score against data/2027.json.
//    A sound engine must reproduce the recipe's own inSampleScores2027.
// b) Variant: declination at the event instant instead of 12:00 UT (recipe's claim).
// c) Variant: margins zeroed (shows the margins carry the fit, not the coordinates).
import fs from 'node:fs';
import path from 'node:path';
import { generate, PRAYERS } from './verify.mjs';

const HOME = process.env.HOME;
const ROOT = path.join(HOME, 'athan-gitree/census/o1g-decade');
const OUT = path.join(ROOT, 'verify');
const pad = (n, w = 2) => String(n).padStart(w, '0');
const hhmm = (m) => `${pad(Math.floor(Math.round(m) / 60))}:${pad(Math.round(m) % 60)}`;

const recipe = JSON.parse(fs.readFileSync(path.join(ROOT, 'fit/recipe.json'), 'utf8'));

function scoreSet(pairs) {
  let exact = 0, w1 = 0, worst = 0, sum = 0;
  for (const [p, t] of pairs) {
    const e = Math.abs(p - t);
    if (e === 0) exact++;
    if (e <= 1) w1++;
    if (e > worst) worst = e;
    sum += e;
  }
  const n = pairs.length;
  return { n, exact, within1: w1, worst, mae: +(sum / n).toFixed(4), pctExact: +((100 * exact) / n).toFixed(2) };
}

// ---- a) 2027 in-sample ----------------------------------------------------
const t2027 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/2027.json'), 'utf8'));
const s2027 = Object.fromEntries(PRAYERS.map((p) => [p, []]));
for (const [k, row] of Object.entries(t2027)) {
  const [y, m, d] = k.split('-').map(Number);
  const g = generate(recipe, y, m, d);
  for (const p of PRAYERS) {
    const [h, mi] = row[p].split(':').map(Number);
    s2027[p].push([g[p], h * 60 + mi]);
  }
}
const inSample = Object.fromEntries(PRAYERS.map((p) => [p, scoreSet(s2027[p])]));
inSample.overall = scoreSet(PRAYERS.flatMap((p) => s2027[p]));

// ---- b/c) sensitivity on the decade, recomputed from the artifact rows ----
const ext = JSON.parse(fs.readFileSync(path.join(OUT, 'extract-2028-2038.json'), 'utf8'));
function variantScore(mut) {
  const r = JSON.parse(JSON.stringify(recipe));
  mut(r);
  const per = Object.fromEntries(PRAYERS.map((p) => [p, []]));
  for (const [k, row] of Object.entries(ext)) {
    const [y, m, d] = k.split('-').map(Number);
    const g = generate(r, y, m, d);
    for (const p of PRAYERS) per[p].push([g[p], row[p]]);
  }
  return { overall: scoreSet(PRAYERS.flatMap((p) => per[p])), byPrayer: Object.fromEntries(PRAYERS.map((p) => [p, scoreSet(per[p])])) };
}
const baseline = variantScore(() => {});
const noMargins = variantScore((r) => {
  for (const p of ['sunrise', 'dhuhr', 'asr', 'magrib']) r.prayers[p].marginMinutes = 0;
});
const lat525 = variantScore((r) => { r.coordinates.latitude = 52.5; });
const lonMinus035 = variantScore((r) => { r.coordinates.longitude = -0.35; });

const out = {
  inSample2027: inSample,
  recipeClaimed2027: recipe.inSampleScores2027,
  decade: { baseline, noMargins, lat525, lonMinus035 },
};
fs.writeFileSync(path.join(OUT, 'stage6-calibration.json'), JSON.stringify(out, null, 2));
console.log('2027 in-sample', JSON.stringify(inSample));
console.log('decade baseline', JSON.stringify(baseline.overall));
console.log('decade no margins', JSON.stringify(noMargins.overall));
console.log('decade lat 52.5', JSON.stringify(lat525.overall));
console.log('decade lon -0.35', JSON.stringify(lonMinus035.overall));
