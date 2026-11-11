// Job 3: Iraq. The fitted Diwan recipe replayed on the 31 banked October rows.
import {
  params, rawMinutes, round, parseHHMM, readJson, emptyScore, addScore, finishScore,
  bestCell, range, pct,
} from './lib.mjs';
import { writeFileSync } from 'node:fs';

const ROOT = `${process.env.HOME}/athan-gitree/census`;
const OUT = `${ROOT}/o1k-wide/verify2`;
const TZ = 'Asia/Baghdad';
const BAGHDAD = { lat: 33.3152, lng: 44.3661 };
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

const rows = readJson(`${ROOT}/o1k-wide/mideast/data/iq-diwan-october-2026.json`);
const yearFit = readJson(`${ROOT}/n2f-topup/out/iq-report.json`);
if (yearFit.bestCfg.fajrAngle !== 18.1) throw new Error('year fit moved');

const FITTED = {
  fajr: { angle: 18.1, margin: 1, rounding: 'floor' },
  dhuhr: { margin: 5, rounding: 'nearest' },
  asr: { margin: 4, rounding: 'nearest' },
  maghrib: { margin: 3, rounding: 'nearest' },
  isha: { angle: 16.9, margin: 1, rounding: 'nearest' },
};
const STANDING = {
  fajr: { angle: 18.0, margin: 0, rounding: 'floor' },
  isha: { angle: 17.0, margin: 0, rounding: 'nearest' },
};

const keys = Object.keys(rows).sort();
const result = {
  job: 'iraq-october',
  source: 'mideast/data/iq-diwan-october-2026.json (Diwan app API)',
  coordinate: BAGHDAD,
  rows: keys.length,
  span: `${keys[0]}..${keys[keys.length - 1]}`,
  inSample: 'the 365-day fit in n2f-topup/out/iq-report.json covers all of 2026, October included',
  fittedRecipe: FITTED,
  variants: {},
};

function predict(recipe) {
  const p = params({ fajrAngle: recipe.fajr.angle, ishaAngle: recipe.isha.angle });
  const out = [];
  for (const key of keys) {
    const [y, m, d] = key.split('-').map(Number);
    const raw = rawMinutes(BAGHDAD, [y, m, d], TZ, p);
    const pred = {};
    pred.fajr = round(raw.fajr + recipe.fajr.margin, recipe.fajr.rounding);
    pred.sunrise = round(raw.sunrise, 'floor');
    pred.dhuhr = round(raw.dhuhr + recipe.dhuhr.margin, recipe.dhuhr.rounding);
    pred.asr = round(raw.asr + recipe.asr.margin, recipe.asr.rounding);
    pred.maghrib = round(raw.maghrib + recipe.maghrib.margin, recipe.maghrib.rounding);
    pred.isha = round(raw.isha + recipe.isha.margin, recipe.isha.rounding);
    out.push({ key, pred, raw, target: Object.fromEntries(COLS.map((c) => [c, parseHHMM(rows[key][c])])) });
  }
  return out;
}

function score(runs, cols) {
  const s = Object.fromEntries(cols.map((c) => [c, emptyScore()]));
  for (const r of runs) for (const c of cols) addScore(s[c], r.pred[c], r.target[c]);
  return Object.fromEntries(cols.map((c) => [c, finishScore(s[c])]));
}

const UNIFIED = {
  fajr: { angle: 18.1, margin: 1, rounding: 'floor' },
  dhuhr: { margin: 5, rounding: 'floor' },
  asr: { margin: 4, rounding: 'floor' },
  maghrib: { margin: 3, rounding: 'floor' },
  isha: { angle: 16.9, margin: 0, rounding: 'floor' },
};
const runsFitted = predict(FITTED);
const runsUnified = predict(UNIFIED);
result.variants.unifiedFloor = score(runsUnified, COLS);
result.unifiedRecipe = UNIFIED;
const runsStanding = predict({ ...FITTED, fajr: STANDING.fajr, isha: STANDING.isha });
result.variants.fitted = score(runsFitted, COLS);
result.variants.standing18_17 = score(runsStanding, ['fajr', 'isha']);
const runsAsr3 = predict({ ...FITTED, asr: { margin: 3, rounding: 'nearest' } });
result.variants.fittedAsr3 = { asr: score(runsAsr3, ['asr']).asr };
result.variants.fittedAsr3.note = 'mideast prose records asr +3 where the year fit record holds +4';
result.variants.standing18_17.note = 'twilights only differ from the fitted pair; dhuhr/asr/maghrib/sunrise carry the fitted offsets';

// Consistency of the month against the recorded year rates.
function binomTail(n, k, p) {
  const logFact = (x) => { let s = 0; for (let i = 2; i <= x; i++) s += Math.log(i); return s; };
  const logPmf = (i) => logFact(n) - logFact(i) - logFact(n - i) + i * Math.log(p) + (n - i) * Math.log(1 - p);
  let s = 0;
  for (let i = 0; i <= k; i++) s += Math.exp(logPmf(i));
  return Number(s.toFixed(4));
}
result.monthVersusYear = {};
for (const c of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
  const year = yearFit.bestJoint[c];
  const oct = result.variants.fitted[c];
  result.monthVersusYear[c] = {
    october: { n: oct.n, exact: oct.exact, exactPct: oct.exactPct, within1Pct: oct.within1Pct, mae: oct.mae, worst: oct.worst },
    year365: { n: year.n, exact: year.exact, exactPct: year.exactPct, within1Pct: year.within1Pct, mae: year.mae },
    pExactOrFewer: binomTail(oct.n, oct.exact, year.exactPct / 100),
  };
}

// October's own angle, with rounding and margin held at the fitted config so the
// angle is the only free term (a joint scan is not identifiable on 31 days).
{
  const free = {};
  for (const c of ['fajr', 'isha']) {
    const cfg = FITTED[c];
    const cells = [];
    for (const angle of range(16.5, 19.0001, 0.05)) {
      const p = params({ fajrAngle: c === 'fajr' ? angle : 18.1, ishaAngle: c === 'isha' ? angle : 16.9 });
      const s = emptyScore();
      for (const key of keys) {
        const [y, m, d] = key.split('-').map(Number);
        const raw = rawMinutes(BAGHDAD, [y, m, d], TZ, p);
        addScore(s, round(raw[c] + cfg.margin, cfg.rounding), parseHHMM(rows[key][c]));
      }
      cells.push({ angle, score: finishScore(s) });
    }
    const bestMae = Math.min(...cells.map((x) => x.score.mae));
    const flat = cells.filter((x) => x.score.within1Pct === 100);
    free[c] = {
      fittedAngle: cfg.angle,
      fittedAngleScore: cells.reduce((a, b) => (Math.abs(b.angle - cfg.angle) < Math.abs(a.angle - cfg.angle) ? b : a)).score,
      bestAngle: cells.filter((x) => x.score.mae === bestMae).map((x) => x.angle),
      within1Band: flat.length ? [flat[0].angle, flat[flat.length - 1].angle] : null,
    };
  }
  result.octoberFreeFit = free;
}

// Residual histogram on the fitted recipe, to show where the minute lands.
{
  const hist = {};
  for (const c of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const h = {};
    for (const r of runsFitted) {
      const e = r.pred[c] - r.target[c];
      h[e] = (h[e] || 0) + 1;
    }
    hist[c] = h;
  }
  result.residualHistogram = hist;
}

// Per-column offsets October asks for, to expose any drift from the year's grid.
{
  const cells = {};
  for (const c of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const prev = runsFitted.map((r) => r.raw[c]);
    const act = runsFitted.map((r) => r.target[c]);
    const best = bestCell(prev, act);
    cells[c] = { rounding: best.rounding, margin: best.margin, score: best.score };
  }
  result.octoberBestCells = cells;
}

writeFileSync(`${OUT}/iq-oct.json`, JSON.stringify(result, null, 1) + '\n');

console.log('fitted, 31 rows');
for (const c of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
  const s = result.variants.fitted[c];
  const y = result.monthVersusYear[c];
  console.log(` ${c.padEnd(7)} exact ${s.exactPct}% w1 ${s.within1Pct}% mae ${s.mae} worst ${s.worst} | year ${y.year365.exactPct}% exact, ${y.year365.within1Pct}% w1 | P(<=${s.exact})=${y.pExactOrFewer}`);
}
console.log('standing 18/17', JSON.stringify(result.variants.standing18_17.fajr), JSON.stringify(result.variants.standing18_17.isha));
console.log('october angle (rounding+margin held)', JSON.stringify(result.octoberFreeFit));
console.log('residuals', JSON.stringify(result.residualHistogram));
console.log('october best cells', Object.fromEntries(Object.entries(result.octoberBestCells).map(([k, v]) => [k, `${v.rounding}${v.margin} w1 ${v.score.within1Pct} exact ${v.score.exactPct}`])));
