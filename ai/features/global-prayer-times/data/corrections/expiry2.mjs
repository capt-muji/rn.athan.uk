// R6 part 4, the decisive test. A residual table is only useful if, applied to a LATER
// year's freshly computed baseline, it reproduces that later year's published times.
// This measures exactly that, and sets it against the naive alternative of reusing last
// year's published times verbatim. node expiry2.mjs

import * as P from './parse.mjs';
import { SITES } from './sites.mjs';
import { residuals, FIELDS, mean } from './measure.mjs';

const site = (id) => SITES.find((s) => s.id === id);
const key = (d) => d.slice(5);

function load(id) {
  const s = site(id);
  const days = s.load(P);
  const { resid } = residuals(days, s, s.spec, s.dummyYear);
  const pub = new Map(), res = new Map(), base = new Map();
  days.forEach((d, i) => {
    pub.set(key(d.date), d);
    res.set(key(d.date), Object.fromEntries(FIELDS.map((k) => [k, resid[k][i]])));
    base.set(key(d.date), Object.fromEntries(FIELDS.map((k) => [k, d[k] === null ? null : d[k] - resid[k][i]])));
  });
  return { pub, res, base, days, s };
}

const PAIRS = [
  ['MUIS Singapore', 'SG-2025', 'SG-2026'],
  ['MARA Oman, Muscat', 'OM-muscat-2025', 'OM-muscat'],
  ['Awqaf UAE, Dubai', 'AE-dubai-2025', 'AE-dubai'],
  ['MORA Brunei', 'BN-2025', 'BN-2026'],
];

console.log('## E. Carrying a table forward one year, scored against the later year\'s own published times\n');
console.log('Three strategies, all scored on the SAME later-year days.\n');
console.log('| authority | later year | values | strategy | exact | <=1 min | <=2 min | worst |');
console.log('|---|---|---|---|---|---|---|---|');

for (const [label, oldId, newId] of PAIRS) {
  const O = load(oldId), N = load(newId);
  const common = [...N.pub.keys()].filter((k) => O.pub.has(k) && k !== '02-29');

  const oldConst = Object.fromEntries(FIELDS.map((k) => {
    const v = [...O.res.values()].map((r) => r[k]).filter((x) => x !== null);
    return [k, Math.round(mean(v))];
  }));

  const strategies = {
    'reuse last year\'s PUBLISHED times verbatim': (k, f) => O.pub.get(k)[f],
    'last year\'s SIX CONSTANTS on this year\'s baseline': (k, f) => N.base.get(k)[f] + oldConst[f],
    'last year\'s EXACT RESIDUAL on this year\'s baseline': (k, f) => N.base.get(k)[f] + O.res.get(k)[f],
    'this year\'s own exact residual (the lossless reference)': (k, f) => N.base.get(k)[f] + N.res.get(k)[f],
  };

  for (const [name, fn] of Object.entries(strategies)) {
    let n = 0, e = 0, w1 = 0, w2 = 0, worst = 0;
    for (const k of common) {
      for (const f of FIELDS) {
        const truth = N.pub.get(k)[f];
        const got = fn(k, f);
        if (truth === null || got === null || got === undefined || Number.isNaN(got)) continue;
        n++;
        const d = Math.abs(truth - got);
        if (d === 0) e++; if (d <= 1) w1++; if (d <= 2) w2++; if (d > worst) worst = d;
      }
    }
    const pc = (x) => `${x} (${(100 * x / n).toFixed(1)}%)`;
    console.log(`| ${label} | \`${newId}\` | ${n} | ${name} | ${pc(e)} | ${pc(w1)} | ${pc(w2)} | ${worst} |`);
  }
}

// How much of the year-over-year movement is the authority's, and how much is the baseline's?
console.log('\n## E2. Where the year-over-year movement comes from\n');
console.log('| authority | field | published times move | computed baseline moves | residual moves |');
console.log('|---|---|---|---|---|');
for (const [label, oldId, newId] of PAIRS) {
  const O = load(oldId), N = load(newId);
  const common = [...N.pub.keys()].filter((k) => O.pub.has(k) && k !== '02-29');
  for (const f of FIELDS) {
    const mv = (a, b) => {
      const d = common.map((k) => (a.get(k)[f] === null || b.get(k)[f] === null ? null : Math.abs(a.get(k)[f] - b.get(k)[f]))).filter((x) => x !== null);
      return `mean ${mean(d).toFixed(2)}, max ${Math.max(...d)}`;
    };
    console.log(`| ${label} | ${f} | ${mv(O.pub, N.pub)} | ${mv(O.base, N.base)} | ${mv(O.res, N.res)} |`);
  }
}

// The Maldives trick, tested directly: one perpetual table in a dummy leap year, applied
// to three real years, against a baseline recomputed for each real year.
console.log('\n## F. The Maldives trick: a perpetual residual table in a dummy leap year\n');
{
  const s = site('SG-ALL');
  const days = s.load(P);
  const byYear = {};
  for (const d of days) (byYear[d.date.slice(0, 4)] ||= []).push(d);

  // Build the perpetual table from 2024 only (the leap year, so 02-29 exists).
  const y24 = byYear['2024'];
  const { resid: r24 } = residuals(y24, s, s.spec);
  const perpetual = new Map();
  y24.forEach((d, i) => perpetual.set(key(d.date), Object.fromEntries(FIELDS.map((k) => [k, r24[k][i]]))));

  console.log('| perpetual table source | applied to | values | exact | <=1 min | <=2 min | worst |');
  console.log('|---|---|---|---|---|---|---|');
  for (const yr of ['2024', '2025', '2026']) {
    const sub = byYear[yr];
    const { resid } = residuals(sub, s, s.spec);
    let n = 0, e = 0, w1 = 0, w2 = 0, worst = 0;
    sub.forEach((d, i) => {
      const p = perpetual.get(key(d.date));
      if (!p) return;
      for (const f of FIELDS) {
        if (resid[f][i] === null) continue;
        n++;
        const dd = Math.abs(resid[f][i] - p[f]);
        if (dd === 0) e++; if (dd <= 1) w1++; if (dd <= 2) w2++; if (dd > worst) worst = dd;
      }
    });
    const pc = (x) => `${x} (${(100 * x / n).toFixed(1)}%)`;
    console.log(`| 2024, a leap year | ${yr} | ${n} | ${pc(e)} | ${pc(w1)} | ${pc(w2)} | ${worst} |`);
  }
}
