// Numbers quoted in REPORT.md, computed from the banked tables only.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/between-year.json'), 'utf8'));
const NAT = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/my-jakim-2026-all-zones.json'), 'utf8'));
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];

const pct = (a, b) => `${(100 * a / b).toFixed(1)}%`;

console.log('## 2026 national, 57 zones, recipe B (margins', JSON.stringify(R.recipeB) + ')');
for (const c of COLS) {
  const s = R.national2026.recipeB[c];
  console.log(`  ${c.padEnd(8)} exact ${s.exact}/${s.n} ${pct(s.exact, s.n)}  within1 ${pct(s.within1, s.n)}  mae ${s.maae}  worst ${s.worst}`);
}

console.log('\n## 2026 national, recipe A (recorded margins +2/-1/+1.5/+2/0/+2)');
for (const c of COLS) {
  const s = R.national2026.recipeA[c];
  console.log(`  ${c.padEnd(8)} exact ${s.exact}/${s.n} ${pct(s.exact, s.n)}  mae ${s.maae}`);
}

console.log('\n## 2027 tables at their own recovered point (recipe B)');
const agg = {};
for (const [slug, r] of Object.entries(R.tables2027)) {
  for (const c of COLS) {
    agg[c] ??= { exact: 0, within1: 0, n: 0, sum: 0 };
    agg[c].exact += r.ownB[c].exact;
    agg[c].within1 += r.ownB[c].within1;
    agg[c].n += r.ownB[c].n;
    agg[c].sum += r.ownB[c].mean * r.ownB[c].n;
  }
  const f = r.ownB.fajr;
  const off = f.hist['-1'] ?? 0;
  console.log(`  ${slug.padEnd(32)} point ${r.ownPoint.lat.toFixed(3)},${r.ownPoint.lon.toFixed(3)}  fajr ${f.exact}/${f.n} at0, ${off} at -1, mean ${f.mean}`);
}
console.log('  AGGREGATE');
for (const c of COLS) {
  const a = agg[c];
  console.log(`    ${c.padEnd(8)} exact ${a.exact}/${a.n} ${pct(a.exact, a.n)}  within1 ${pct(a.within1, a.n)}  mae ${(Math.abs(a.sum) / a.n).toFixed(2)}`);
}

console.log('\n## KTN01 / KTN02 2026 isha angle test');
for (const z of ['KTN01', 'KTN02', 'JHR02', 'TRG01']) {
  console.log(`  ${z} isha (17 for KTN01) exact ${R.zones2026[z].isha.exact}/${R.zones2026[z].isha.n} mean ${R.zones2026[z].isha.mean}`);
}

console.log('\n## PLS01 imsak = subuh?');
let eq = 0, n = 0;
for (const [d, row] of Object.entries(NAT.PLS01)) { if (row.imsak === row.fajr) eq++; n++; }
console.log(`  PLS01 imsak equals subuh on ${eq}/${n} days`);
let eqk = 0, nk = 0;
for (const [d, row] of Object.entries(NAT.KTN01)) { if (row.imsak === row.fajr) eqk++; nk++; }
console.log(`  KTN01 imsak equals subuh on ${eqk}/${nk} days (expect 0; imsak = subuh - 10)`);

console.log('\n## Seasonal amplitude (subuh Jan 1 vs Jul 1, 2026) and between-year drift');
for (const z of ['WLY01', 'WLY02', 'SGR01', 'SWK08', 'SBH05']) {
  const f = d => NAT[z][d].fajr;
  console.log(`  ${z} 2026-01-01 ${f('2026-01-01')}  2026-07-01 ${f('2026-07-01')}`);
}
