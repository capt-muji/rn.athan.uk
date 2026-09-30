// Population weighting for R5 section "Population coverage".
// Denominator: Pew Research Center, June 2025, "How the Global Religious Landscape Changed
// From 2010 to 2020": 2.0 billion Muslims in 2020, 25.6% of world population, from 2,700+
// censuses and surveys across 201 countries. Cited.
// Per-country counts: Wikipedia "Islam by country", each row individually sourced, fetched
// 2026-09-30. Cited, NOT measured. Pew's own per-country anchors for cross-check:
// Indonesia ~240m, India 213m, top 10 = 1.3bn = 65% of the world total.
const DENOM = 2_000_000_000;

// [country, Muslim population, convention bucket, evidence tier for the convention]
const top25 = [
  ['Indonesia',   249_800_000, 'Kemenag 20/18 + 2 min ihtiyati', 'A (R2)'],
  ['Pakistan',    233_000_000, 'no national authority; Karachi 18/18 asserted', 'C'],
  ['India',       200_000_000, 'no national authority', 'NULL'],
  ['Bangladesh',  150_800_000, 'Islamic Foundation, Fajr 18.0 measured', 'A (R5)'],
  ['Nigeria',      96_000_000, 'no national authority', 'NULL'],
  ['Egypt',        87_500_000, 'Egyptian Survey 19.5/17.5, measured 19.4-19.6 / 17.4-17.6', 'A (R5)'],
  ['Iran',         85_700_000, 'Tehran Calendar Centre, Fajr 18.0 measured, Maghrib sunset+17', 'A (R5)'],
  ['Turkey',       81_200_000, 'Diyanet 18/17 + temkin', 'A (R1/R5)'],
  ['Algeria',      46_500_000, 'ministry publishes per-city PDF tables; 18/17 asserted', 'D'],
  ['Sudan',        38_585_777, 'no authority document found', 'NULL'],
  ['Iraq',         39_000_000, 'no single authority; Sunni and Shia divans differ', 'NULL'],
  ['Afghanistan',  37_098_000, 'no authority document found; Kabul table asserted', 'NULL'],
  ['Morocco',      36_370_847, 'Habous 19/17, measured', 'A (R1/R2)'],
  ['Saudi Arabia', 31_535_000, 'Umm al-Qura 18.5 / sunset+90, measured', 'A (R1/R2)'],
  ['Ethiopia',     34_702_632, 'no authority document found', 'NULL'],
  ['Yemen',        28_000_000, 'Awqaf, Fajr ~18.1, Isha ~15.8, measured', 'A (R5)'],
  ['Uzbekistan',   30_500_000, 'no method document found', 'NULL'],
  ['China',        28_000_000, 'no national convention; range 6.3m to 50m', 'NULL'],
  ['Niger',        21_101_926, 'no authority document found', 'NULL'],
  ['Mali',         20_541_904, 'no authority document found', 'NULL'],
  ['Malaysia',     20_063_500, 'JAKIM 20/18, zone system', 'A (R2)'],
  ['Tanzania',     19_426_814, 'no authority document found', 'NULL'],
  ['Senegal',      17_421_191, 'no authority document found', 'NULL'],
  ['Syria',        15_000_000, 'no authority document reachable', 'NULL'],
  ['Russia',       15_000_000, 'competing muftiates; 16/15 library-only', 'D'],
];

console.log('| Rank | Country | Muslims (cited) | % of world Muslims (computed) | Convention | Tier |');
console.log('| --- | --- | ---: | ---: | --- | --- |');
let cum = 0;
top25.forEach(([c, n, conv, tier], i) => {
  cum += n;
  console.log(`| ${i+1} | ${c} | ${n.toLocaleString('en-GB')} | ${(100*n/DENOM).toFixed(2)}% | ${conv} | ${tier} |`);
});
console.log(`\nTop 25 total: ${cum.toLocaleString('en-GB')} = ${(100*cum/DENOM).toFixed(1)}% of the 2.0 bn denominator`);

// Coverage by evidence state
const bucket = {};
for (const [, n, , tier] of top25) {
  const k = tier.startsWith('A') ? 'A: measured or read on the authority'
          : tier === 'C' ? 'C: asserted second-hand'
          : tier === 'D' ? 'D: library constant only' : 'NULL: nothing sourceable';
  bucket[k] = (bucket[k] || 0) + n;
}
console.log('\n| Evidence state | Muslims in top 25 | % of world Muslims |');
console.log('| --- | ---: | ---: |');
for (const [k, v] of Object.entries(bucket).sort((a,b)=>b[1]-a[1]))
  console.log(`| ${k} | ${v.toLocaleString('en-GB')} | ${(100*v/DENOM).toFixed(1)}% |`);

// Coverage by actual convention family, for the countries where the convention IS established.
const fam = {
  'Fajr 18 to 18.2 (Bangladesh, Iran, Turkey, Yemen, UAE)': 150_800_000+85_700_000+81_200_000+28_000_000+9_800_000,
  'Fajr 19 to 20 (Indonesia, Malaysia, Egypt, Morocco, Singapore, Brunei)': 249_800_000+20_063_500+87_500_000+36_370_847+915_118+379_894,
  'Fajr 18.5 with a fixed-interval Isha (Saudi Arabia, Qatar)': 31_535_000+1_566_786,
  'Fajr 15 (Kazakhstan, and the FCNA recommendation in the USA)': 13_158_672+4_500_000,
};
console.log('\n| Convention family, where established | Muslims | % of world Muslims |');
console.log('| --- | ---: | ---: |');
let est=0;
for (const [k,v] of Object.entries(fam)) { est+=v; console.log(`| ${k} | ${v.toLocaleString('en-GB')} | ${(100*v/DENOM).toFixed(1)}% |`); }
console.log(`| **Total with an ESTABLISHED convention** | ${est.toLocaleString('en-GB')} | ${(100*est/DENOM).toFixed(1)}% |`);
console.log(`| **Remainder: no established national convention** | ${(DENOM-est).toLocaleString('en-GB')} | ${(100*(DENOM-est)/DENOM).toFixed(1)}% |`);
