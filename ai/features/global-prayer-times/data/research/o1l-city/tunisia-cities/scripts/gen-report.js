// Generates the Results section of REPORT.md from the fit, national, stability, year-pair
// and Kasserine outputs. Run: node gen-report.js sw
const fs = require("fs");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities";
const tag = process.argv[2] || "sw";
const fits = JSON.parse(fs.readFileSync(`${W}/data/tn-fits-${tag}.json`, "utf8"));
const nat = JSON.parse(fs.readFileSync(`${W}/data/tn-national-${tag}.json`, "utf8"));
const stab = JSON.parse(fs.readFileSync(`${W}/data/tn-stability-back.json`, "utf8"));
const yp = JSON.parse(fs.readFileSync(`${W}/data/tn-yearpair.json`, "utf8"));
const kass = JSON.parse(fs.readFileSync(`${W}/data/tn-fits-kass.json`, "utf8"))[0];
const july = JSON.parse(fs.readFileSync(`${W}/data/tn-july-class.json`, "utf8"));
const full = fs.existsSync(`${W}/data/tn-fits-full.json`) ? JSON.parse(fs.readFileSync(`${W}/data/tn-fits-full.json`, "utf8")) : [];
const tree = JSON.parse(fs.readFileSync(`${W}/data/tn-gouv-deleg-tree.json`, "utf8"));
const govName = Object.fromEntries(tree.map((g) => [g.id, g.intituleFr.trim()]));
const cityName = { "348-621": "Sousse", "353-494": "Djerba Houmt Souk", "362-635": "Kasserine" };
const p1 = (x) => Number(x).toFixed(1);
const f2 = (x) => Number(x).toFixed(2);
const f3 = (x) => Number(x).toFixed(3);
const L = [];

L.push(`### Coverage\n`);
L.push(`${fits.length} delegations across ${nat.governors} governorates, ${nat.days_total.toLocaleString('en-US')} dated rows, 20 days each by design (5 days in each of 2024-10, 2025-01, 2025-04, 2026-07). That is 256 delegations at the full 20 days, Chrarda at 14 and Sfax/Tina at 10 (publisher nulls), and Arram at zero: the publisher serves no table for Arram on any probed date. The four banked cities (Tunis, Sfax, Kairouan, Gafsa) sit inside the sweep.`);
L.push(`\nBeside the season sweep: 71 delegations x 6 January days in 2024 and 2026 (the year-pair test), 3 cities x 107 days across 2019-10-25 to 2023-12-20 (the back-harvest), and Kasserine x 365 consecutive days of 2026 (the month-invariance test).`);

L.push(`\n### The recipe is national; the horizon is per site\n`);
L.push(`Mean per-column scores at the fitted dip, over all ${fits.length} delegations:\n`);
L.push(`| Column | Within 1 min | Exact | MAE (min) | Mean signed (min) |`);
L.push(`| --- | --- | --- | --- | --- |`);
for (const [c, s] of Object.entries(nat.perColumnFit)) {
  L.push(`| ${c} | ${p1(s.w1Pct)}% | ${p1(s.exactPct)}% | ${f2(s.mae)} | ${f2(s.meanSigned)} |`);
}
L.push(`\nOn a flat horizon the same recipe gives:\n`);
L.push(`| Column | Within 1 min | Mean signed (min) |`);
L.push(`| --- | --- | --- |`);
for (const [c, s] of Object.entries(nat.perColumnFlat)) {
  L.push(`| ${c} | ${p1(s.w1Pct)}% | ${f2(s.meanSigned)} |`);
}
L.push(`\nAll five columns within 1 min: flat horizon ${p1(nat.score_flat.meanAll1)}% mean, ${nat.score_flat.delegationsAt100} delegations at 100%; with the per-delegation dip fitted ${p1(nat.score_fit.meanAll1)}% mean, ${nat.score_fit.delegationsAt95} of ${fits.length} at 95% or better. The dip alone moves the national mean by ${p1(nat.score_fit.meanAll1 - nat.score_flat.meanAll1)} points.`);
L.push(`\nThe asr column's ${p1(100 - nat.perColumnFit.asr.w1Pct)}% miss is a seasonal skew, not a parameter: at the fitted dip the asr residual runs +0.95 min in January, +0.64 in April, -0.24 in July and -1.20 in October, the engine's own seasonal asr term on these rows. Dhuhr is 100% within 1 in every season.`);

L.push(`\n### The elevation ladder\n`);
const r = nat.ladderReg;
L.push(`Fitted dip against the delegation's own Copernicus GLO-90 elevation:\n`);
L.push(`- dip = ${r.dipOnSqrtElev.slope.toFixed(4)} x sqrt(metres) ${r.dipOnSqrtElev.intercept < 0 ? "-" : "+"} ${Math.abs(r.dipOnSqrtElev.intercept).toFixed(4)} degrees, R2 ${Number(r.dipOnSqrtElev.r2).toFixed(3)}, n ${nat.score_dem.n};`);
L.push(`- the geometric dip arccos(R/(R+h)) is ${r.physicsSlopeDegPerSqrtM.toFixed(4)} degrees per sqrt(metre), so the fitted ladder runs at ${p1((100 * r.dipOnSqrtElev.slope) / r.physicsSlopeDegPerSqrtM)}% of the geometric slope with a ${Math.abs(r.dipOnSqrtElev.intercept).toFixed(3)}-degree offset at sea level: one physical term explains the per-delegation constant;`);
L.push(`- flat-horizon fajr residual = ${f3(r.residualMinOnSqrtElev.slope)} x sqrt(metres) ${r.residualMinOnSqrtElev.intercept < 0 ? "-" : "+"} ${f3(Math.abs(r.residualMinOnSqrtElev.intercept))} min, R2 ${Number(r.residualMinOnSqrtElev.r2).toFixed(3)}: ${p1(r.residualMinOnSqrtElev.slope * Math.sqrt(300) + r.residualMinOnSqrtElev.intercept)} min at 300 m and ${p1(r.residualMinOnSqrtElev.slope * Math.sqrt(700) + r.residualMinOnSqrtElev.intercept)} min at 700 m;`);
L.push(`- controls: residual against latitude R2 ${Number(nat.residualControls.absLat.r2).toFixed(4)}; against longitude alone R2 ${Number(nat.residualControls.lng.r2).toFixed(3)}; elevation and longitude together R2 ${Number(r.residualOnElevAndLng.r2).toFixed(3)} with coefficients ${r.residualOnElevAndLng.coefs[0]} min/m and ${r.residualOnElevAndLng.coefs[1]} min/degree;`);
if (r.lngWithinLowElevation) L.push(`- longitude inside the under-50 m set alone (n ${r.lowElevationN}): ${r.lngWithinLowElevation.slope} min/degree, R2 ${Number(r.lngWithinLowElevation.r2).toFixed(3)}.`);
L.push(`- season invariance: within each delegation the dip fitted separately on January, April, July and October spans ${f3(nat.seasonInvariance.meanSpreadDeg)} degrees on average (median ${f3(nat.seasonInvariance.medianSpreadDeg)}, max ${f3(nat.seasonInvariance.maxSpreadDeg)}); ${nat.seasonInvariance.withinHalfDegree} of ${nat.seasonInvariance.n} inside half a degree.`);
L.push(`- seasonal amplitude (January minus July, sampled rows): fajr ${nat.amplitude.fajr[0]}-${nat.amplitude.fajr[1]} min, isha ${nat.amplitude.isha[0]}-${nat.amplitude.isha[1]} min, dhuhr ${nat.amplitude.dhuhr[0]}-${nat.amplitude.dhuhr[1]} min.`);

L.push(`\n### The ladder rung by rung\n`);
L.push(`| DEM band (m) | Delegations | Mean dip fitted (deg) | Mean dip from DEM (deg) | Fajr residual at flat horizon (min) | Maghrib residual at flat horizon (min) | All-5 within 1, flat | All-5 within 1, dip fitted |`);
L.push(`| --- | --- | --- | --- | --- | --- | --- | --- |`);
for (const b of nat.ladder) {
  if (!b.n) continue;
  L.push(`| ${b.lo}-${b.hi} | ${b.n} | ${f3(b.meanDipFit)} | ${f3(b.meanDipDem)} | ${f2(b.meanFajrFlatMin)} | ${f2(b.meanMaghribFlatMin)} | ${p1(b.meanAll1Flat)}% | ${p1(b.meanAll1Fit)}% |`);
}

L.push(`\n### Per governorate\n`);
L.push(`| Governorate | Delegations | Mean DEM (m) | Max DEM (m) | Mean dip (deg) | All-5 within 1, flat | All-5 within 1, dip fitted |`);
L.push(`| --- | --- | --- | --- | --- | --- | --- |`);
for (const g of nat.governorates.sort((a, b) => a.gouv - b.gouv)) {
  L.push(`| ${govName[g.gouv]} | ${g.n} | ${g.meanElev ?? "–"} | ${g.maxElev ?? "–"} | ${f3(g.meanDip)} | ${p1(g.meanAll1Flat)}% | ${p1(g.meanAll1Fit)}% |`);
}

L.push(`\n### The named cities at full months\n`);
if (full.length) {
  L.push(`Every day of the four season months (123 days) at the 13 governorate capitals and Djerba, one dip per city:\n`);
  L.push(`| City | Days | DEM (m) | Dip fitted (deg) | Dip from DEM (deg) | All-5 flat | All-5 fitted | All-5 DEM dip | Season dips 10/01/04/07 |`);
  L.push(`| --- | --- | --- | --- | --- | --- | --- | --- | --- |`);
  for (const f of full.sort((a, b) => a.name.localeCompare(b.name))) {
    L.push(`| ${f.name} | ${f.days} | ${f.demElevation} | ${f3(f.dipFitDeg)} | ${f3(f.dipDemDeg)} | ${p1(f.scoreFlat.all1Pct)}% | ${p1(f.scoreFit.all1Pct)}% | ${f.scoreDem ? p1(f.scoreDem.all1Pct) + "%" : "–"} | ${Object.values(f.seasonDip).join("/")} |`);
  }
}

L.push(`\n### Column constants (best per delegation, modal across the country)\n`);
L.push(`| Column | Modal pad / rounding | Delegations |`);
L.push(`| --- | --- | --- |`);
for (const [c, list] of Object.entries(nat.modalColumnBest)) {
  L.push(`| ${c} | ${list[0][0]} | ${list[0][1]} |`);
}

L.push(`\n### Kasserine, 365 days of 2026: the dip is month-invariant\n`);
L.push(`Kasserine sits at ${kass.demElevation} m DEM, dip ${f3(kass.dipDemDeg)} degrees. The dip fitted month by month: ${Object.entries(kass.seasonDip).map(([m, v]) => `${m}:${v}`).join(", ")} degrees, spread ${f3(Math.max(...Object.values(kass.seasonDip)) - Math.min(...Object.values(kass.seasonDip)))}. On the flat horizon fajr runs ${f2(kass.scoreFlat.fajr.meanSigned)} min and maghrib ${f2(kass.scoreFlat.maghrib.meanSigned)} min off across the whole year; dhuhr and asr are untouched (asr ${f2(kass.scoreFlat.asr.meanSigned)} min). All five within 1: ${p1(kass.scoreFlat.all1Pct)}% flat, ${p1(kass.scoreFit.all1Pct)}% at the single fitted dip of ${f3(kass.dipFitDeg)} degrees.`);

L.push(`\n### Back-harvest 2019-2023: the term is frozen\n`);
L.push(`| City | Days | Span | Dip, whole span (deg) | All-5 within 1 | Per-year dips (deg) |`);
L.push(`| --- | --- | --- | --- | --- | --- |`);
for (const s of stab) {
  const key = s.name.replace("tn-inm-back-", "").replace(".json", "");
  L.push(`| ${cityName[key] || key} | ${s.n} | ${s.first} to ${s.last} | ${f3(s.dipAll)} | ${p1(s.all1All)}% | ${s.perYear.map((p) => `${p.year}:${p.dip}`).join(", ")} |`);
}
L.push(`\nAcross the three spread cities the dip holds to a hundredth of a degree per year for four years and into the 2024-2026 sweep. Sousse sits at sea level and needs none; Djerba Houmt Souk likewise; Kasserine needs ${f3(stab[2].dipAll)} degrees every year from 2019 to 2026. No regime change appears in the span.`);

L.push(`\n### Year-pair 2024 vs 2026: parameters frozen, sample noise only\n`);
const y = yp.summary;
L.push(`${y.delegations} delegations on the same six January days two years apart: mean dip ${f3(y.meanDip24)} degrees in 2024 and ${f3(y.meanDip26)} in 2026, mean absolute shift ${f3(y.meanAbsDelta)} degrees (median ${f3(y.medianAbsDelta)}, max ${f3(y.maxAbsDelta)}); ${y.within005} of ${y.delegations} inside 0.05 degrees and ${y.within010} inside 0.10. Applying 2024's dip to 2026's rows scores ${p1(y.crossYear.mean26at24)}% all-five-within-1 against ${p1(y.crossYear.mean26at26)}% at 2026's own dip; applying 2026's dip to 2024's rows scores ${p1(y.crossYear.mean24at26)}% against ${p1(y.crossYear.mean24at24)}%. The per-column flat-horizon residuals are year-invariant to within 0.2 min, so the cross-year loss is six-day sampling on a one-minute grid, not a moved parameter.`);

L.push(`\n### A regional summer edition: Kairouan and Sidi Bouzid change angle in July\n`);
L.push(`Fitting the July rows alone, per delegation, at its own DEM dip: ${july.summary.julyReproducesAt18_1} of ${july.summary.delegations} reproduce the frozen 18.1/18.1 angles on every July day (two more miss a single day at a rounding boundary); ${july.summary.julyNeedsLowerAngle} need a fajr/isha angle between 17.1 and 17.6 degrees and reproduce at it exactly. All ${july.summary.julyNeedsLowerAngle} sit in two adjacent governorates: the ten Kairouan delegations and ten of Sidi Bouzid's twelve. The other three seasons in the same tables hold 18.1. This is a seasonal regime inside the publisher's own year, not an elevation term: the July residuals are symmetric (fajr late, isha early), so no positive dip can absorb them, which is why the July dip for those delegations fits to zero.`);
L.push(`\nThe affected delegations, angle that reproduces July: ${july.summary.lowerAngles.join("; ")}.`);

L.push(`\n### The national verdict\n`);
L.push(`One recipe covers ${fits.length} delegations: fajr 18.1, isha 18.1, Shafi asr, dhuhr transit +7 rounded, maghrib sunset +2 rounded up, fajr/isha rounded to the minute. One per-site term covers the rest: a horizon dip at the delegation's own DEM elevation, whose fitted slope runs at ${p1((100 * r.dipOnSqrtElev.slope) / r.physicsSlopeDegPerSqrtM)}% of the geometric value (R2 ${Number(r.dipOnSqrtElev.r2).toFixed(3)}). The DEM dip alone scores ${p1(nat.score_dem.meanAll1)}% all-five-within-1 against ${p1(nat.score_flat.meanAll1)}% on a flat horizon. Flat-horizon failure tracks elevation and nothing else: latitude R2 ${Number(nat.residualControls.absLat.r2).toFixed(4)}, longitude alone ${Number(nat.residualControls.lng.r2).toFixed(3)}, elevation ${Number(nat.residualControls.elev.r2).toFixed(3)}. The one regional exception is dated: the 20 Kairouan and Sidi Bouzid tables print a July fajr/isha angle near 17.3 and 18.1 the rest of the year.`);

fs.writeFileSync(`${W}/data/tn-results.md`, L.join("\n") + "\n");
console.log(L.join("\n"));
