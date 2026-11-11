// Print the per-year tables quoted in REPORT.md.
const W = process.env.HOME + "/athan-gitree/census/o1k-wide/deep2";
const show = (label, o) => {
  const v = o[0];
  console.log(`\n### ${label}`);
  for (const k of Object.keys(v)) {
    const s = v[k];
    if (!s || typeof s.exact !== "number") continue;
    console.log(`${k}: exact ${s.exact}/${s.n} (${(100 * s.exact / s.n).toFixed(1)}%) within1 ${(100 * s.w1 / s.n).toFixed(1)}% mae ${s.mae.toFixed(2)}`);
  }
};

const om = require(`${W}/om-deep.json`);
console.log("== OMAN ==  rows", om.meta.rows);
for (const [k, p] of Object.entries(om.prayers)) console.log(k.padEnd(12), `theta ${p.theta ?? "-"} pad ${p.pad} ${p.mode}`.padEnd(30), `exact ${(100 * p.score.exact / p.score.n).toFixed(1)}% w1 ${(100 * p.score.w1 / p.score.n).toFixed(1)}% mae ${p.score.mae.toFixed(2)} max ${p.score.maxAbs}`);
console.log("amplitudes", JSON.stringify(Object.fromEntries(Object.entries(om.prayers).map(([k, v]) => [k, v.amplitude ? v.amplitude.peakToPeak : null]))));
console.log("perYear fajr", JSON.stringify(om.prayers.fajr.perYear, (k, v) => typeof v === "number" ? +v.toFixed(2) : v));

const ne = require(`${W}/ne-deep.json`);
console.log("\n== NIGER ==  rows", ne.meta.rows);
for (const [k, p] of Object.entries(ne.prayers)) console.log(k.padEnd(12), `theta ${p.theta ?? "-"} pad ${p.pad} ${p.mode}`.padEnd(30), `exact ${(100 * p.score.exact / p.score.n).toFixed(1)}% w1 ${(100 * p.score.w1 / p.score.n).toFixed(1)}% mae ${p.score.mae.toFixed(2)} max ${p.score.maxAbs}`);
console.log("frozen histogram", JSON.stringify(ne.frozen.spreadHistogram), "max", ne.frozen.maxSpreadMin);
