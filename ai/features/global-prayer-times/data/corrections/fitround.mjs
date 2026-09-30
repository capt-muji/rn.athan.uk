// R6: pick each authority's rounding rule from its own published digits.
// The rule that drives the per-field mean residual closest to a whole number is the rule
// the authority used. Reported per city so a disagreement inside an authority is visible.
// node fitround.mjs

import * as P from './parse.mjs';
import { SITES } from './sites.mjs';
import { residuals, FIELDS, mean } from './measure.mjs';

const RULES = ['nearest', 'up', 'down'];

console.log('| site | authority | fajr | sunrise | dhuhr | asr | maghrib | isha | fractional part left |');
console.log('|---|---|---|---|---|---|---|---|---|');

const byAuth = {};
for (const s of SITES) {
  const days = s.load(P);
  if (!days || !days.length) continue;
  const best = {}, frac = {};
  for (const k of FIELDS) {
    let bestRule = 'nearest', bestFrac = 9;
    for (const r of RULES) {
      const { resid } = residuals(days, { ...s, rounding: r }, s.spec, s.dummyYear);
      const v = resid[k].filter((x) => x !== null);
      if (!v.length) continue;
      const m = mean(v);
      const f = Math.abs(m - Math.round(m));
      if (f < bestFrac) { bestFrac = f; bestRule = r; }
    }
    best[k] = bestRule; frac[k] = bestFrac;
  }
  console.log(`| \`${s.id}\` | ${s.authority} | ${FIELDS.map((k) => best[k]).join(' | ')} | ${Math.max(...Object.values(frac)).toFixed(3)} |`);
  (byAuth[s.authority] ||= []).push(best);
}

console.log('\n## Majority rounding rule per authority\n');
console.log('| authority | cities | fajr | sunrise | dhuhr | asr | maghrib | isha | unanimous |');
console.log('|---|---|---|---|---|---|---|---|---|');
const out = {};
for (const [a, list] of Object.entries(byAuth)) {
  const pick = {};
  let unanimous = true;
  for (const k of FIELDS) {
    const c = {};
    for (const b of list) c[b[k]] = (c[b[k]] || 0) + 1;
    const [win, n] = Object.entries(c).sort((x, y) => y[1] - x[1])[0];
    pick[k] = win;
    if (n !== list.length) unanimous = false;
  }
  out[a] = pick;
  console.log(`| ${a} | ${list.length} | ${FIELDS.map((k) => pick[k]).join(' | ')} | ${unanimous ? 'yes' : 'no'} |`);
}
console.log('\n```json\n' + JSON.stringify(out, null, 1) + '\n```');
