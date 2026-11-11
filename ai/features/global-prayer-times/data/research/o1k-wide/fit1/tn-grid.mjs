// Job 2: Tunisia INM Tunis 2024 vs 2025 re-fit.
// Per-year free grids + a joint scan with parameters frozen across years.
// Run: TZ=Africa/Tunis node tn-grid.mjs
import fs from 'node:fs';
import { loadAdhan, parseHHMM, bestMargin, evalFixed, scoreLine } from './lib.mjs';

const HOME = process.env.HOME;
const LAT = 36.8, LNG = 10.18;
const adhan = await loadAdhan();
const coords = new adhan.Coordinates(LAT, LNG);
const FIELDS = ['fajr', 'dhuhr', 'asr', 'magrib', 'isha'];
const SRC = { fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr', magrib: 'magrib', isha: 'isha' };

function loadYear(y) {
  const rows = JSON.parse(fs.readFileSync(`${HOME}/athan-gitree/census/o1k-wide/northafrica2/data/tn-inm-tunis-${y}.json`, 'utf8'));
  const keys = Object.keys(rows).sort();
  const slots = keys.map((key) => {
    const [yy, m, d] = key.split('-').map(Number);
    return { key, date: new Date(yy, m - 1, d), chart: Object.fromEntries(FIELDS.map((f) => [f, parseHHMM(rows[key][SRC[f]])])) };
  });
  return slots;
}
const years = [2024, 2025].map(loadYear);
const secOf = (x) => x.getHours() * 3600 + x.getMinutes() * 60 + x.getSeconds();
const instant = (date, hours) => new adhan.TimeComponents(hours).utcDate(date.getFullYear(), date.getMonth(), date.getDate());

// identical-row check on shared MM-DD
{
  const k24 = new Map(years[0].map((s) => [s.key.slice(5), JSON.stringify(Object.values(s.chart))]));
  const k25 = new Map(years[1].map((s) => [s.key.slice(5), JSON.stringify(Object.values(s.chart))]));
  let same = 0, diffDays = [];
  for (const [md, v] of k24) {
    if (k25.has(md)) { if (k25.get(md) === v) same++; else diffDays.push(md); }
  }
  console.log(`identical printed rows on shared MM-DD: ${same}/${k24.size} (2024 rows vs 2025 rows); first diffs: ${diffDays.slice(0, 8).join(' ')}`);
}

// angle-independent raw columns per year
const raws = years.map((slots) => {
  const sol = slots.map((s) => new adhan.SolarTime(s.date, coords));
  const R = {};
  R.dhuhr = Float64Array.from(slots, (s, i) => secOf(instant(s.date, sol[i].transit)));
  R.asrShafi = Float64Array.from(slots, (s, i) => secOf(instant(s.date, sol[i].afternoon(1))));
  R.asrHanafi = Float64Array.from(slots, (s, i) => secOf(instant(s.date, sol[i].afternoon(2))));
  R.magrib = Float64Array.from(slots, (s, i) => secOf(instant(s.date, sol[i].sunset)));
  return R;
});
const charts = years.map((slots) => Object.fromEntries(FIELDS.map((f) => [f, Int32Array.from(slots, (s) => s.chart[f])])));

const cat = (a, b) => { const o = new Float64Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
const catI = (a, b) => { const o = new Int32Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };

console.log('\n== angle-independent prayers: per-year best, then frozen-across-years best ==');
for (const prayer of ['dhuhr', 'magrib']) {
  const per = years.map((_, y) => bestMargin(raws[y][prayer], charts[y][prayer]));
  const joint = bestMargin(cat(raws[0][prayer], raws[1][prayer]), catI(charts[0][prayer], charts[1][prayer]));
  console.log(`${prayer}: 2024 [${scoreLine(prayer, per[0])}]`);
  console.log(`         2025 [${scoreLine(prayer, per[1])}]`);
  console.log(`         frozen [exact ${joint.exact}/731 within1 ${joint.within1} worst ${joint.worst} margin ${joint.margin} ${joint.mode}]`);
}
for (const madhab of ['asrShafi', 'asrHanafi']) {
  const per = years.map((_, y) => bestMargin(raws[y][madhab], charts[y].asr));
  const joint = bestMargin(cat(raws[0][madhab], raws[1][madhab]), catI(charts[0].asr, charts[1].asr));
  console.log(`${madhab}: 2024 [exact ${per[0].exact}/366 w1 ${per[0].within1} worst ${per[0].worst} m ${per[0].margin} ${per[0].mode}]  2025 [exact ${per[1].exact}/365 w1 ${per[1].within1} worst ${per[1].worst} m ${per[1].margin} ${per[1].mode}]  frozen [exact ${joint.exact}/731 w1 ${joint.within1} worst ${joint.worst} m ${joint.margin} ${joint.mode}]`);
}

// angle grids: per-year and joint
const A2 = (x) => Math.round(x * 20) / 20;
const fajrs = []; for (let a = 15; a <= 21.001; a += 0.05) fajrs.push(A2(a));
const ishas = []; for (let a = 14; a <= 21.001; a += 0.05) ishas.push(A2(a));
const fC = [charts[0].fajr, charts[1].fajr], iC = [charts[0].isha, charts[1].isha];

const secArr = (slots, sol, fa, after) => Float64Array.from(slots, (s, i) => secOf(instant(s.date, sol[i].hourAngle(-fa, after))));
const sols = years.map((slots) => slots.map((s) => new adhan.SolarTime(s.date, coords)));

let bestPer = [null, null], bestJoint = null;
const topJoint = [];
let t0 = Date.now();
for (const fa of fajrs) {
  const fRaw = years.map((slots, y) => secArr(slots, sols[y], fa, false));
  for (const is of ishas) {
    const iRaw = years.map((slots, y) => secArr(slots, sols[y], is, true));
    const bf = [bestMargin(fRaw[0], fC[0]), bestMargin(fRaw[1], fC[1])];
    const bi = [bestMargin(iRaw[0], iC[0]), bestMargin(iRaw[1], iC[1])];
    for (const y of [0, 1]) {
      const cand = { fa, is, sum: bf[y].exact + bi[y].exact, w1: bf[y].within1 + bi[y].within1, worst: bf[y].worst + bi[y].worst, bf: bf[y], bi: bi[y] };
      if (!bestPer[y] || cand.sum > bestPer[y].sum) bestPer[y] = cand;
    }
    const bj = { fa, is, f: bestMargin(cat(fRaw[0], fRaw[1]), catI(fC[0], fC[1])), i: bestMargin(cat(iRaw[0], iRaw[1]), catI(iC[0], iC[1])) };
    bj.sum = bj.f.exact + bj.i.exact; bj.w1 = bj.f.within1 + bj.i.within1; bj.worst = bj.f.worst + bj.i.worst;
    topJoint.push(bj);
    if (!bestJoint || bj.sum > bestJoint.sum || (bj.sum === bestJoint.sum && bj.w1 > bestJoint.w1)) bestJoint = bj;
  }
}
console.log(`\ngrids done ${((Date.now() - t0) / 1000).toFixed(1)}s`);
for (const y of [0, 1]) console.log(`per-year ${years[y][0].key.slice(0, 4)}: fajr ${bestPer[y].fa} [exact ${bestPer[y].bf.exact} w1 ${bestPer[y].bf.within1} worst ${bestPer[y].bf.worst} m ${bestPer[y].bf.margin} ${bestPer[y].bf.mode}] isha ${bestPer[y].is} [exact ${bestPer[y].bi.exact} w1 ${bestPer[y].bi.within1} worst ${bestPer[y].bi.worst} m ${bestPer[y].bi.margin} ${bestPer[y].bi.mode}] sum ${bestPer[y].sum}`);
console.log(`joint frozen: fajr ${bestJoint.fa} [exact ${bestJoint.f.exact}/731 w1 ${bestJoint.f.within1} worst ${bestJoint.f.worst} m ${bestJoint.f.margin} ${bestJoint.f.mode}] isha ${bestJoint.is} [exact ${bestJoint.i.exact}/731 w1 ${bestJoint.i.within1} worst ${bestJoint.i.worst} m ${bestJoint.i.margin} ${bestJoint.i.mode}] sum ${bestJoint.sum}`);
topJoint.sort((a, b) => b.sum - a.sum || b.w1 - a.w1);
console.log('top joint pairs:', topJoint.slice(0, 6).map((t) => `${t.fa}/${t.is} sum ${t.sum}`).join('  '));

fs.writeFileSync(HOME + '/athan-gitree/census/o1k-wide/fit1/tn-grid.json', JSON.stringify({
  bestPer: { 2024: bestPer[0], 2025: bestPer[1] }, bestJoint,
  topJoint: topJoint.slice(0, 30),
  angleIndependent: { dhuhr: { per: null, note: 'see log' } },
}, null, 1));
console.log('wrote tn-grid.json');
