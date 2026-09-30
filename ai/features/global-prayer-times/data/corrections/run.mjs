// R6: run every site through the measurement engine and print the result tables.
// node run.mjs > results.txt

import * as P from './parse.mjs';
import { SITES } from './sites.mjs';
import { residuals, models, byteCost, naiveCost, FIELDS, mean } from './measure.mjs';
import { writeFileSync } from 'node:fs';

const f2 = (x) => (x >= 0 ? '+' : '') + x.toFixed(2);
const sgn = (x) => (x >= 0 ? '+' : '') + x;

const results = [];

for (const s of SITES) {
  const days = s.load(P);
  if (!days || !days.length) { console.log(`SKIP ${s.id}: no data`); continue; }
  const { resid, doy } = residuals(days, s, s.spec, s.dummyYear);
  const m = models(resid, doy);
  const constants = Object.fromEntries(FIELDS.map((k) => [k, m[k]?.constant ?? 0]));
  const bytes = byteCost(resid, constants);
  const naive = naiveCost(days);
  results.push({ site: s, n: days.length, resid, doy, m, constants, bytes, naive });
}

// ------------------------------------------------ 1. per-field residual statistics
console.log('## 1. Per-field residual statistics, published minus computed, minutes\n');
console.log('| site | authority | days | field | min | max | spread | mean | sd | mode | mode share | lag-1 autocorr |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of results) {
  for (const k of FIELDS) {
    const st = r.m[k].stats;
    console.log(`| \`${r.site.id}\` | ${r.site.authority} | ${r.n} | ${k} | ${sgn(st.min)} | ${sgn(st.max)} | ${st.spread} | ${f2(st.mean)} | ${st.sd.toFixed(2)} | ${sgn(st.mode)} | ${(st.modeShare * 100).toFixed(0)}% | ${r.m[k].lag1.toFixed(2)} |`);
  }
}

// ------------------------------------------------ 2. Model A, six constants
console.log('\n## 2. Model A, six constants per site, and what they leave\n');
console.log('| site | place | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha | values | exact | <=1 min | <=2 min | worst |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of results) {
  let n = 0, e = 0, w1 = 0, w2 = 0, worst = 0;
  for (const k of FIELDS) { const a = r.m[k].A; n += a.n; e += a.exact; w1 += a.w1; w2 += a.w2; worst = Math.max(worst, a.worst); }
  console.log(`| \`${r.site.id}\` | ${r.site.place} | ${FIELDS.map((k) => sgn(r.constants[k])).join(' | ')} | ${n} | ${e} (${(100 * e / n).toFixed(1)}%) | ${w1} (${(100 * w1 / n).toFixed(1)}%) | ${w2} (${(100 * w2 / n).toFixed(1)}%) | ${worst} |`);
}

// ------------------------------------------------ 3. seasonal models
console.log('\n## 3. Does a seasonal model beat six constants? Worst error left, minutes\n');
console.log('| site | A: 6 constants | B: per-month, 72 ints | H1: 1 harmonic | H2 | H3 | H4 | C: exact per-day |');
console.log('|---|---|---|---|---|---|---|---|');
for (const r of results) {
  const w = (get) => Math.max(...FIELDS.map((k) => get(r.m[k])));
  console.log(`| \`${r.site.id}\` | ${w((x) => x.A.worst)} | ${w((x) => x.B.worst)} | ${w((x) => x.harm[1].worst)} | ${w((x) => x.harm[2].worst)} | ${w((x) => x.harm[3].worst)} | ${w((x) => x.harm[4].worst)} | 0 |`);
}

console.log('\n## 3b. Same models scored as percentage of values reproduced exactly\n');
console.log('| site | A | B | H1 | H2 | H3 | H4 |');
console.log('|---|---|---|---|---|---|---|');
for (const r of results) {
  const pct = (get) => {
    let n = 0, e = 0;
    for (const k of FIELDS) { const a = get(r.m[k]); n += a.n; e += a.exact; }
    return `${(100 * e / n).toFixed(1)}%`;
  };
  console.log(`| \`${r.site.id}\` | ${pct((x) => x.A)} | ${pct((x) => x.B)} | ${pct((x) => x.harm[1])} | ${pct((x) => x.harm[2])} | ${pct((x) => x.harm[3])} | ${pct((x) => x.harm[4])} |`);
}

// ------------------------------------------------ 4. byte cost
console.log('\n## 4. Byte cost of the EXACT per-day residual, brotli, per site-year\n');
console.log('| site | days | naive JSON raw | naive brotli | resid int8 raw | resid int8 brotli | resid 4-bit raw | resid 4-bit brotli | 4-bit fits | centred range |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const r of results) {
  const b = r.bytes;
  console.log(`| \`${r.site.id}\` | ${r.n} | ${r.naive.raw} | ${r.naive.brotli} | ${b.int8.raw} | ${b.int8.brotli} | ${b.nibble.raw} | ${b.nibble.brotli} | ${b.nibble.fits4 ? 'yes' : 'NO'} | ${b.nibble.lo} to ${b.nibble.hi} |`);
}

// ------------------------------------------------ 5. classification
console.log('\n## 5. Automatic classification\n');
console.log('| site | max abs constant | worst after A | worst after H4 | seasonal gain (A worst minus H4 worst) | max lag-1 | suggested category |');
console.log('|---|---|---|---|---|---|---|');
for (const r of results) {
  const maxC = Math.max(...FIELDS.map((k) => Math.abs(r.constants[k])));
  const wA = Math.max(...FIELDS.map((k) => r.m[k].A.worst));
  const wH = Math.max(...FIELDS.map((k) => r.m[k].harm[4].worst));
  const maxLag = Math.max(...FIELDS.map((k) => r.m[k].lag1));
  let cat;
  if (maxC === 0 && wA <= 1) cat = '1 exactly computable';
  else if (wA <= 2) cat = '2 computable + constants';
  else if (wA - wH >= 2) cat = '3 computable + seasonal';
  else cat = '4 irregular';
  console.log(`| \`${r.site.id}\` | ${maxC} | ${wA} | ${wH} | ${wA - wH} | ${maxLag.toFixed(2)} | ${cat} |`);
}

writeFileSync('results.json', JSON.stringify(results.map((r) => ({
  id: r.site.id, authority: r.site.authority, place: r.site.place, n: r.n,
  spec: r.site.spec, specNote: r.site.specNote,
  constants: r.constants, bytes: r.bytes, naive: r.naive,
  stats: Object.fromEntries(FIELDS.map((k) => [k, r.m[k].stats])),
  scores: Object.fromEntries(FIELDS.map((k) => [k, { A: r.m[k].A, B: r.m[k].B, H4: r.m[k].harm[4], lag1: r.m[k].lag1 }])),
  resid: r.resid, doy: r.doy,
})), null, 1));
console.log(`\nWrote results.json with ${results.length} sites.`);
