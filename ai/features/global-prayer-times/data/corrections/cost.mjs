// R6 part 3: what does the no-synthesis option actually cost?
// Prices the EXACT residual for every measured authority at its real zone count, and sets
// the total against the app's own bundle. node cost.mjs

import { readFileSync } from 'node:fs';
import { brotliCompressSync } from 'node:zlib';

const R = JSON.parse(readFileSync('results.json', 'utf8'));
const by = (a) => R.filter((r) => r.authority === a && !/2025|1447|ALL|london-20(19|22|25)/.test(r.id));

const JS_BUNDLE = 4.9 * 1024 * 1024;   // cited, R4 section 5.5
const RELEASE = 67 * 1024 * 1024;      // cited, R4 section 5.5

// Zone counts: measured where R4 or this report counted them, cited otherwise.
const AUTHORITIES = [
  ['JAKIM Malaysia', 59, 'measured, 59 zone codes read from `e-solat.gov.my`'],
  ['MUIS Singapore', 1, 'measured, one national timetable'],
  ['Diyanet Turkey', 1055, 'measured sum of the 81 province ilce lists is UNVERIFIED; 1055 is the cited Diyanet ilce count'],
  ['Umm al-Qura Saudi Arabia', 100, 'UNVERIFIED; `ummulqura.org.sa/assets/data/cities.json` is 43,671 B, city count not counted here'],
  ['MORA Brunei', 1, 'measured, one national timetable'],
  ['Egyptian GAS', 82, 'measured, 82 named cities plus "all cities" in the `esa.gov.eg` dropdown'],
  ['MARA Oman', 86, 'measured, 86 city options in the `mara.gov.om` form'],
  ['Kemenag Indonesia', 516, 'cited, the `api.myquran.com` kota list length'],
  ['Awqaf UAE', 60, 'measured, 60 areas in the `awqaf.gov.ae` year response'],
  ['Habous Morocco', 191, 'measured, 191 ville options in the `habous.gov.ma` dropdown'],
  ['Qatar Calendar House (digitised)', 1, 'measured, one national perpetual table'],
  ['London unified timetable', 1, 'measured, one timetable for the whole M25 region'],
];

const fmtB = (b) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`);

console.log('## H. The measured price of the no-synthesis option, per authority\n');
console.log('Per-city-year figures are the MEASURED median over the cities this report obtained.');
console.log('Totals multiply that by the authority\'s own city or zone count.\n');
console.log('| authority | cities measured | zones or cities | median naive brotli B/city-yr | median exact residual 4-bit brotli B/city-yr | saving | whole authority, naive | whole authority, exact residual | Model A constants only |');
console.log('|---|---|---|---|---|---|---|---|---|');

const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
let totalNaive = 0, totalExact = 0, totalConst = 0, totalCities = 0;

for (const [name, count, note] of AUTHORITIES) {
  const g = by(name);
  if (!g.length) continue;
  const naive = med(g.map((r) => r.naive.brotli));
  // London's residual does not fit 4 bits; the int8 figure is the honest one there.
  const fits = g.every((r) => r.bytes.nibble.fits4);
  const exact = med(g.map((r) => (fits ? r.bytes.nibble.brotli : r.bytes.int8.brotli)));
  totalNaive += naive * count;
  totalExact += exact * count;
  totalConst += 6 * count;
  totalCities += count;
  console.log(`| ${name} | ${g.length} | ${count} | ${naive} | ${exact}${fits ? '' : ' (int8, 4-bit does not fit)'} | ${(naive / exact).toFixed(1)}x | ${fmtB(naive * count)} | ${fmtB(exact * count)} | ${fmtB(6 * count)} |`);
}

console.log(`| **all of the above** | | **${totalCities}** | | | | **${fmtB(totalNaive)}** | **${fmtB(totalExact)}** | **${fmtB(totalConst)}** |`);

console.log('\n## H2. In the app\'s own terms\n');
console.log('| what | brotli size | % of the 4.9 MB JS bundle | % of the 67 MB release bundle |');
console.log('|---|---|---|---|');
const row = (label, b) => console.log(`| ${label} | ${fmtB(b)} | ${(100 * b / JS_BUNDLE).toFixed(2)}% | ${(100 * b / RELEASE).toFixed(3)}% |`);
row('every measured authority, every city, naive published times', totalNaive);
row('every measured authority, every city, EXACT residual', totalExact);
row('every measured authority, every city, six constants only', totalConst);
row('the ten capital cities measured here, exact residual', by('').length ? 0 : R.filter((r) => /WLY01|SG-2026|TR-9541|SA-makkah$|BN-2026|EG-cairo|OM-muscat$|ID-jakarta|AE-dubai$|MA-rabat|QA-doha/.test(r.id)).reduce((a, r) => a + r.bytes.nibble.brotli, 0));

// A plausible launch set: one authority per country for the countries this report measured.
console.log('\n## H3. A plausible launch set, one capital per measured country\n');
const LAUNCH = ['MY-WLY01', 'SG-2026', 'TR-9541', 'SA-makkah', 'BN-2026', 'EG-cairo', 'OM-muscat', 'ID-jakarta', 'AE-dubai', 'MA-rabat', 'QA-doha', 'UK-london-2026'];
console.log('| site | naive brotli | exact residual brotli | six constants |');
console.log('|---|---|---|---|');
let ln = 0, le = 0;
for (const id of LAUNCH) {
  const r = R.find((x) => x.id === id);
  if (!r) continue;
  const e = r.bytes.nibble.fits4 ? r.bytes.nibble.brotli : r.bytes.int8.brotli;
  ln += r.naive.brotli; le += e;
  console.log(`| \`${id}\` | ${r.naive.brotli} | ${e} | 6 |`);
}
console.log(`| **total, 12 cities** | **${ln}** | **${le}** | **72** |`);
console.log(`\n12 city-years as the exact residual: ${fmtB(le)}, which is ${(100 * le / JS_BUNDLE).toFixed(3)}% of the JS bundle (measured).`);

// What a really ambitious set costs.
console.log('\n## H4. Scaling the exact residual\n');
const perCity = med(R.filter((r) => r.bytes.nibble.fits4 && r.n > 300).map((r) => r.bytes.nibble.brotli));
console.log(`Median exact-residual cost over every full-year site whose residual fits 4 bits: **${perCity} B/city-year** (measured, n=${R.filter((r) => r.bytes.nibble.fits4 && r.n > 300).length}).\n`);
console.log('| cities | exact residual, one year | % of the 4.9 MB JS bundle |');
console.log('|---|---|---|');
for (const n of [12, 100, 500, 1000, 2261, 5000, 20000]) {
  console.log(`| ${n} | ${fmtB(perCity * n)} | ${(100 * perCity * n / JS_BUNDLE).toFixed(2)}% |`);
}
