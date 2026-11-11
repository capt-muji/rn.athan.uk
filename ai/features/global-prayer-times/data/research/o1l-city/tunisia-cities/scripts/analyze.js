// National summary of the delegation fits: the elevation ladder, per-governorate table,
// the frozen-recipe score, and the seasonal amplitude. Run: node analyze.js sw
const fs = require("fs");
const W = process.env.HOME + "/athan-gitree/census/o1l-city/tunisia-cities";
const tag = process.argv[2] || "sw";
const fits = JSON.parse(fs.readFileSync(`${W}/data/tn-fits-${tag}.json`, "utf8"));
const COLS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const withDem = fits.filter((f) => f.demElevation !== null);
const pct = (n, d) => `${((100 * n) / d).toFixed(1)}%`;

const flatAll1 = fits.filter((f) => f.scoreFlat.all1Pct === 100).length;
const fitAll1 = fits.filter((f) => f.scoreFit.all1Pct >= 95).length;
const demAll1 = withDem.filter((f) => f.scoreDem.all1Pct >= 95).length;

const summary = {
  delegations: fits.length,
  governors: new Set(fits.map((f) => f.gouv)).size,
  days_total: fits.reduce((a, f) => a + f.days, 0),
  score_flat: { meanAll1: mean(fits.map((f) => f.scoreFlat.all1Pct)), medianAll1: median(fits.map((f) => f.scoreFlat.all1Pct)), delegationsAt100: flatAll1 },
  score_fit: { meanAll1: mean(fits.map((f) => f.scoreFit.all1Pct)), medianAll1: median(fits.map((f) => f.scoreFit.all1Pct)), delegationsAt95: fitAll1 },
  score_dem: { n: withDem.length, meanAll1: mean(withDem.map((f) => f.scoreDem.all1Pct)), delegationsAt95: demAll1 },
  perColumnFit: {},
  perColumnFlat: {},
};

for (const c of COLS) {
  summary.perColumnFit[c] = {
    w1Pct: mean(fits.map((f) => f.scoreFit[c].w1Pct)),
    exactPct: mean(fits.map((f) => f.scoreFit[c].exactPct)),
    mae: mean(fits.map((f) => f.scoreFit[c].mae)),
    meanSigned: mean(fits.map((f) => f.scoreFit[c].meanSigned)),
  };
  summary.perColumnFlat[c] = {
    w1Pct: mean(fits.map((f) => f.scoreFlat[c].w1Pct)),
    meanSigned: mean(fits.map((f) => f.scoreFlat[c].meanSigned)),
  };
}

// elevation ladder
const bins = [
  [0, 25], [25, 50], [50, 100], [100, 200], [200, 300], [300, 500], [500, 700], [700, 1200],
];
summary.ladder = bins.map(([lo, hi]) => {
  const g = withDem.filter((f) => f.demElevation >= lo && f.demElevation < hi);
  if (!g.length) return { lo, hi, n: 0 };
  return {
    lo, hi, n: g.length,
    meanElev: +mean(g.map((f) => f.demElevation)).toFixed(0),
    meanDipFit: +mean(g.map((f) => f.dipFitDeg)).toFixed(3),
    meanDipDem: +mean(g.map((f) => f.dipDemDeg)).toFixed(3),
    meanFajrFlatMin: +mean(g.map((f) => f.scoreFlat.fajr.meanSigned)).toFixed(2),
    meanMaghribFlatMin: +mean(g.map((f) => f.scoreFlat.maghrib.meanSigned)).toFixed(2),
    meanAll1Flat: +mean(g.map((f) => f.scoreFlat.all1Pct)).toFixed(1),
    meanAll1Fit: +mean(g.map((f) => f.scoreFit.all1Pct)).toFixed(1),
    meanAll1Dem: +mean(g.map((f) => f.scoreDem.all1Pct)).toFixed(1),
  };
});

// dip ~ sqrt(2h/R): regress dipFit on sqrt(elevation)
function linreg(xs, ys) {
  const n = xs.length, mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  const slope = sxy / sxx, intercept = my - slope * mx;
  return { slope, intercept, r2: (sxy * sxy) / (sxx * syy) };
}
const sq = withDem.map((f) => Math.sqrt(f.demElevation));
const res = withDem.map((f) => f.scoreFlat.fajr.meanSigned);
const dips = withDem.map((f) => f.dipFitDeg);
summary.ladderReg = {
  dipOnSqrtElev: linreg(sq, dips),
  dipOnElev: linreg(withDem.map((f) => f.demElevation), dips),
  demDipOnSqrtElev: linreg(sq, withDem.map((f) => f.dipDemDeg)),
};
summary.ladderReg.dipOnSqrtElev = Object.fromEntries(Object.entries(summary.ladderReg.dipOnSqrtElev).map(([k, v]) => [k, +v.toFixed(5)]));
summary.ladderReg.dipOnElev = Object.fromEntries(Object.entries(summary.ladderReg.dipOnElev).map(([k, v]) => [k, +v.toFixed(6)]));
summary.ladderReg.demDipOnSqrtElev = Object.fromEntries(Object.entries(summary.ladderReg.demDipOnSqrtElev).map(([k, v]) => [k, +v.toFixed(5)]));
// physical slope: dip(deg) = 180/pi * sqrt(2h/R) -> deg per sqrt(m)
summary.ladderReg.physicsSlopeDegPerSqrtM = +(((180 / Math.PI) * Math.sqrt(2 / 6371000))).toFixed(5);
// minutes of horizon shift per sqrt(m), measured on the flat-horizon fajr residual
const absRes = withDem.map((f) => Math.abs(f.scoreFlat.fajr.meanSigned));
summary.ladderReg.residualMinOnSqrtElev = Object.fromEntries(Object.entries(linreg(sq, absRes)).map(([k, v]) => [k, +v.toFixed(5)]));
summary.ladderReg.residualMinOnElev = Object.fromEntries(Object.entries(linreg(withDem.map((f) => f.demElevation), absRes)).map(([k, v]) => [k, +v.toFixed(5)]));
// does longitude survive beside elevation?
function multreg(y, cols) {
  // normal equations for y = b0 + b1*x1 + b2*x2 (2 predictors), solved by elimination
  const X = cols[0].map((_, i) => [1, ...cols.map((c) => c[i])]);
  const k = X[0].length;
  const A = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => X.reduce((s, r) => s + r[i] * r[j], 0)));
  const b = Array.from({ length: k }, (_, i) => X.reduce((s, r, n) => s + r[i] * y[n], 0));
  for (let i = 0; i < k; i++) {
    let p = i;
    for (let r = i + 1; r < k; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    for (let r = 0; r < k; r++) {
      if (r === i) continue;
      const f = A[r][i] / A[i][i];
      for (let c = i; c < k; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }
  const beta = b.map((v, i) => v / A[i][i]);
  const yhat = X.map((r) => r.reduce((s, v, i) => s + v * beta[i], 0));
  const my = mean(y);
  const ss = y.reduce((s, v) => s + (v - my) ** 2, 0);
  const sr = y.reduce((s, v, i) => s + (v - yhat[i]) ** 2, 0);
  return { intercept: +beta[0].toFixed(4), coefs: beta.slice(1).map((v) => +v.toFixed(5)), r2: +(1 - sr / ss).toFixed(4) };
}
summary.ladderReg.residualOnElevAndLng = multreg(res, [withDem.map((f) => f.demElevation), withDem.map((f) => f.lng)]);
// longitude control at low elevation only: if a longitude term were real it would show here too
const lowE = withDem.filter((f) => f.demElevation < 50);
summary.ladderReg.lngWithinLowElevation = lowE.length > 2
  ? Object.fromEntries(Object.entries(linreg(lowE.map((f) => f.lng), lowE.map((f) => f.scoreFlat.fajr.meanSigned))).map(([k, v]) => [k, +v.toFixed(5)]))
  : null;
summary.ladderReg.lowElevationN = lowE.length;

// what explains the flat-horizon residual: elevation or position?
summary.residualControls = {
  elev: linreg(withDem.map((f) => f.demElevation), res),
  absLat: linreg(withDem.map((f) => Math.abs(f.lat)), res),
  lng: linreg(withDem.map((f) => f.lng), res),
};
for (const k of Object.keys(summary.residualControls)) {
  summary.residualControls[k] = Object.fromEntries(Object.entries(summary.residualControls[k]).map(([a, b]) => [a, +b.toFixed(5)]));
}

// per governorate
const govs = {};
for (const f of fits) {
  const g = (govs[f.gouv] = govs[f.gouv] || { gouv: f.gouv, n: 0, elev: [], dip: [], flat: [], fit: [], dem: [] });
  g.n++;
  if (f.demElevation !== null) g.elev.push(f.demElevation);
  g.dip.push(f.dipFitDeg);
  g.flat.push(f.scoreFlat.all1Pct);
  g.fit.push(f.scoreFit.all1Pct);
  if (f.scoreDem) g.dem.push(f.scoreDem.all1Pct);
}
summary.governorates = Object.values(govs).map((g) => ({
  gouv: g.gouv, n: g.n,
  meanElev: g.elev.length ? +mean(g.elev).toFixed(0) : null,
  maxElev: g.elev.length ? Math.max(...g.elev) : null,
  meanDip: +mean(g.dip).toFixed(3),
  meanAll1Flat: +mean(g.flat).toFixed(1),
  meanAll1Fit: +mean(g.fit).toFixed(1),
  meanAll1Dem: g.dem.length ? +mean(g.dem).toFixed(1) : null,
}));

// modal column constants
const modes = {};
for (const c of COLS) {
  const counts = {};
  for (const f of fits) {
    const k = `${f.best[c].pad}/${f.best[c].mode}`;
    counts[k] = (counts[k] || 0) + 1;
  }
  modes[c] = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
}
summary.modalColumnBest = modes;

// seasonal amplitude from the sampled rows: Jan high vs Jul high per delegation
const amps = [];
for (const f of fits) {
  const file = `${W}/data/tn-inm-${tag}-${f.gouv}-${f.deleg}.json`;
  if (!fs.existsSync(file)) continue;
  const rows = JSON.parse(fs.readFileSync(file, "utf8")).rows;
  const byMonth = {};
  for (const [d, r] of Object.entries(rows)) {
    const m = d.slice(5, 7);
    (byMonth[m] = byMonth[m] || []).push(r);
  }
  if (!byMonth["01"] || !byMonth["07"]) continue;
  const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  amps.push({
    name: f.name,
    fajrAmp: toMin(byMonth["01"][0].fajr) - toMin(byMonth["07"][0].fajr),
    ishaAmp: toMin(byMonth["07"][0].isha) - toMin(byMonth["01"][0].isha),
    dhuhrAmp: toMin(byMonth["01"][0].dhuhr) - toMin(byMonth["07"][0].dhuhr),
  });
}
summary.amplitude = {
  n: amps.length,
  fajr: [Math.min(...amps.map((a) => a.fajrAmp)), Math.max(...amps.map((a) => a.fajrAmp))],
  isha: [Math.min(...amps.map((a) => a.ishaAmp)), Math.max(...amps.map((a) => a.ishaAmp))],
  dhuhr: [Math.min(...amps.map((a) => a.dhuhrAmp)), Math.max(...amps.map((a) => a.dhuhrAmp))],
};

// season invariance of the dip: spread of the four monthly fits inside each delegation
const seasonSpread = fits.filter((f) => Object.keys(f.seasonDip).length === 4).map((f) => {
  const v = Object.values(f.seasonDip);
  return Math.max(...v) - Math.min(...v);
});
summary.seasonInvariance = {
  n: seasonSpread.length,
  meanSpreadDeg: +mean(seasonSpread).toFixed(3),
  medianSpreadDeg: +median(seasonSpread).toFixed(3),
  maxSpreadDeg: Math.max(...seasonSpread),
  withinHalfDegree: seasonSpread.filter((s) => s <= 0.5).length,
};

fs.writeFileSync(`${W}/data/tn-national-${tag}.json`, JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ ...summary, governorates: summary.governorates.length }, null, 1));
