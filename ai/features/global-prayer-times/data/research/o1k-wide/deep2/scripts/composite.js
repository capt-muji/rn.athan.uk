// Composite per-year scores: how many days are exact / within 1 on every column.
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";

function composite(label, perPrayer, years) {
  console.log(`\n${label}`);
  for (const y of years) {
    const rows = perPrayer.map((p) => p[y]).filter(Boolean);
    if (!rows.length) continue;
    const n = rows[0].n;
    const worstExact = Math.min(...rows.map((r) => r.exact));
    const worstW1 = Math.min(...rows.map((r) => r.w1));
    console.log(`  ${y}: n ${n}  worst-column exact ${(100 * worstExact / n).toFixed(1)}%  every-column-within-1 ${worstW1 === n ? "YES" : (100 * worstW1 / n).toFixed(1) + "%"}`);
  }
}

const om = require(`${W}/om-deep.json`);
composite("OMAN 2021-2028 (worst column per year)", ["fajr", "sunrise", "dhuhr", "asr_shafi", "maghrib", "isha"].map((k) => om.prayers[k].perYear), om.meta.years);

const ne = require(`${W}/ne-deep.json`);
const nePerYear = {};
for (const y of ne.meta.years) nePerYear[y] = ne.prayers.fajr.perYear[y];
const ne2 = require(`${W}/ne-deep.json`);
console.log("\nNIGER 2025-2031 fajr per year");
for (const y of ne.meta.years) {
  const s = ne2.prayers.fajr.perYear[y];
  console.log(`  ${y}: exact ${(100 * s.exact / s.n).toFixed(1)}% within1 ${(100 * s.w1 / s.n).toFixed(1)}%`);
}

const tn = require(`${W}/tn-deep.json`);
for (const r of tn.recipes) {
  console.log(`\nTUNISIA recipe ${r.name} all-five`);
  for (const y of tn.meta.years) {
    const s = r.perYear[y];
    console.log(`  ${y}: exact-all-five ${s.allExact}/${s.n} (${(100 * s.allExact / s.n).toFixed(1)}%) within1-all-five ${s.allW1}/${s.n} (${(100 * s.allW1 / s.n).toFixed(1)}%)`);
  }
}
