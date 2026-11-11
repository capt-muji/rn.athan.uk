// Claim 1: Pakistan federal chart. Independent column mapping, clock switch dates, isha ladder, recipe.
import fs from 'node:fs';
import path from 'node:path';
import { params, times, hm, score, MODES, median, pct, isoAddDays } from './lib.mjs';

const DATA = '$HOME/athan-gitree/census/o1k-wide/southasia/data';
const out = {};

// --- load the 11-column monthly transcription (closest thing to the raw print) ---
const monthFiles = fs.readdirSync(DATA).filter(f => /^pk-islamabad-nizam-m0/.test(f) || f === 'pk-islamabad-nizam-m10-12.json');
const rows = [];
for (const f of monthFiles.sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
  for (const [iso, vals] of Object.entries(d)) {
    if (iso.startsWith('_')) continue;
    if (!Array.isArray(vals) || vals.length !== 11) throw new Error(`${f} ${iso} width ${vals && vals.length}`);
    // the chart prints a 12-hour clock for every afternoon/evening column; columns 4,5,6,7,9,10,11 are PM
    const pm = new Set([3, 4, 5, 6, 7, 8, 9, 10]);
    rows.push({ iso, v: vals.map((s, i) => { const x = hm(s); return x != null && pm.has(i) && Math.floor(x / 60) < 12 ? x + 720 : x; }), raw: vals, file: f });
  }
}
rows.sort((a, b) => a.iso.localeCompare(b.iso));
out.rowCount = rows.length;
out.first = rows[0].iso;
out.last = rows[rows.length - 1].iso;
out.widths = [...new Set(rows.map(r => r.v.length))];

// 2026 is not a leap year: the chart carries a 29-Feb slot. Compute it on 2028-02-29.
const comp = new Map();
const LAT = 33.6844, LNG = 73.0479;
const get = (iso, p) => {
  if (!comp.has(iso + JSON.stringify(p))) comp.set(iso + JSON.stringify(p), times(LAT, LNG, iso, p, 'Asia/Karachi'));
  return comp.get(iso + JSON.stringify(p));
};
const calcIso = (iso) => (iso === '2026-02-29' ? '2028-02-29' : iso);
const base = params({ fajr: 18, isha: 18, madhab: 'hanafi' });
const shafi = params({ fajr: 18, isha: 18, madhab: 'shafi' });

// --- 1. derive the column mapping from solar geometry, not from fit1's table ---
// For each of the 11 printed columns, report: n, distinct values, median absolute difference
// to computed sunrise / sunset / transit / asr-hanafi, and the midnight-relative spread.
const geoKey = ['sunrise', 'sunset', 'dhuhr', 'asr'];
const colStats = [];
for (let c = 0; c < 11; c++) {
  const vals = rows.map(r => r.v[c]).filter(x => x != null);
  const distinct = new Set(vals);
  const to = {};
  for (const k of geoKey) {
    const diffs = [];
    for (const r of rows) {
      const x = r.v[c]; if (x == null) continue;
      const t = get(calcIso(r.iso), k === 'asr' ? base : base)[k];
      if (t == null) continue;
      diffs.push(x - t);
    }
    diffs.sort((a, b) => a - b);
    to[k] = { med: median(diffs), min: diffs[0], max: diffs[diffs.length - 1] };
  }
  const sortedVals = [...vals].sort((a, b) => a - b);
  colStats.push({ col: c + 1, n: vals.length, distinct: distinct.size, to, spread: sortedVals[sortedVals.length - 1] - sortedVals[0] });
}
out.columnStats = colStats;

// choose the mapping by geometry
const pick = (key, exclude = []) => {
  let best = null;
  for (const s of colStats) {
    if (exclude.includes(s.col)) continue;
    const scoreAbs = Math.abs(s.to[key].med);
    if (!best || scoreAbs < Math.abs(best.to[key].med)) best = s;
  }
  return best.col;
};
const cSunrise = pick('sunrise');
const cSunset = pick('sunset', [cSunrise]);
const cTransit = pick('dhuhr', [cSunrise, cSunset]);
const cAsr = pick('asr', [cSunrise, cSunset, cTransit]);
out.autoMapping = { cSunrise, cSunset, cTransit, cAsr };

// --- 2. dhuhr: distinct values and switch dates, straight from the print ---
const cDhuhrAthan = 3; // derived below from geometry if autoMapping disagrees
const dhuhrCol = (() => {
  // the dhuhr adhan column is the one whose values are a two-value clock, not transit
  // identify among columns near transit (within 90 min) the one with the fewest distinct values
  const near = colStats.filter(s => Math.abs(s.to.dhuhr.med) < 90);
  near.sort((a, b) => a.distinct - b.distinct || a.col - b.col);
  return near[0].col;
})();
out.dhuhrColumn = dhuhrCol;
const dh = rows.map(r => ({ iso: r.iso, v: r.v[dhuhrCol - 1] })).filter(x => x.v != null);
const dhVals = [...new Set(dh.map(x => x.v))].sort((a, b) => a - b);
const dhSwitches = [];
for (let i = 1; i < dh.length; i++) if (dh[i].v !== dh[i - 1].v) dhSwitches.push({ from: dh[i - 1].iso, to: dh[i].iso, fromV: dh[i - 1].v, toV: dh[i].v });
out.dhuhr = {
  distinctValues: dhVals.map(v => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`),
  counts: Object.fromEntries(dhVals.map(v => [v, dh.filter(x => x.v === v).length])),
  switches: dhSwitches.map(s => `${s.fromV}->${s.toV} at ${s.to}`),
  ruleHolds: dhVals.every(v => v % 15 === 0),
};

// --- 3. isha: distinct values, ladder steps, switch dates ---
const ishaCands = colStats.map(s => s.col);
const ishaCol = (() => {
  // isha adhan: a column late in the day, on a coarse grid, distinct-set small; distinguish from
  // jamaat (which is a +15 shift of another) by picking the smaller-valued of the late pair
  const late = colStats.filter(s => s.to.sunset.med > 0 && s.to.sunset.med < 200);
  // find pairs offset by exactly 15 on most rows
  return null;
})();
// derive by structure: columns 1..11; athan columns are the earlier of each jamaat pair
// fajr pair (1,2), dhuhr pair (4,5), asr pair (6,7), maghrib (9) with sunset (8), isha pair (10,11)
const pairs = [[1, 2], [4, 5], [6, 7], [10, 11]];
const pairDeltas = pairs.map(([a, b]) => {
  const d = [];
  for (const r of rows) if (r.v[a - 1] != null && r.v[b - 1] != null) d.push(r.v[b - 1] - r.v[a - 1]);
  return { pair: `${a}/${b}`, median: median(d), distinct: [...new Set(d)].sort((x, y) => x - y) };
});
out.jamaatPairDeltas = pairDeltas;
const cIshaAthan = 10;
const ishaVals = rows.map(r => r.v[cIshaAthan - 1]).filter(x => x != null);
const ishaDistinct = [...new Set(ishaVals)].sort((a, b) => a - b);
const ishaRows = rows.map(r => ({ iso: r.iso, v: r.v[cIshaAthan - 1] })).filter(x => x.v != null);
const ishaSwitches = [];
for (let i = 1; i < ishaRows.length; i++) if (ishaRows[i].v !== ishaRows[i - 1].v) ishaSwitches.push({ date: ishaRows[i].iso, from: ishaRows[i - 1].v, to: ishaRows[i].v, step: ishaRows[i].v - ishaRows[i - 1].v });
out.isha = {
  distinctCount: ishaDistinct.length,
  distinct: ishaDistinct.map(v => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`),
  quarterGrid: ishaDistinct.every(v => v % 15 === 0),
  switchCount: ishaSwitches.length,
  switches: ishaSwitches.map(s => `${s.date} ${String(Math.floor(s.from / 60)).padStart(2, '0')}:${String(s.from % 60).padStart(2, '0')}->${String(Math.floor(s.to / 60)).padStart(2, '0')}:${String(s.to % 60).padStart(2, '0')} (${s.step >= 0 ? '+' : ''}${s.step})`),
  stepSizes: [...new Set(ishaSwitches.map(s => s.step))].sort((a, b) => a - b),
};

// --- 4. independent fit of the computed columns ---
const mkRows = (c) => rows.map(r => ({ iso: r.iso, printed: r.v[c - 1] }));
const calc = (iso, p, key) => get(calcIso(iso), p)[key];

// fajr: angle sweep, mode/margin
const fajrRows = mkRows(1);
const fajrGrid = [];
for (let ang = 17.5; ang <= 18.5001; ang += 0.01) {
  const p = params({ fajr: ang, isha: 18, madhab: 'hanafi' });
  for (const mode of ['floor', 'nearest', 'ceil']) {
    for (let margin = -1.5; margin <= 1.5001; margin += 0.5) {
      let ex = 0, w1 = 0, worst = 0;
      for (const r of fajrRows) {
        const v = MODES[mode](calc(r.iso, p, 'fajr') + margin);
        const d = v - r.printed;
        if (d === 0) ex++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d));
      }
      fajrGrid.push({ ang: Number(ang.toFixed(2)), mode, margin, ex, w1, worst });
    }
  }
}
fajrGrid.sort((a, b) => b.ex - a.ex || a.worst - b.worst);
out.fajr = { top10: fajrGrid.slice(0, 10), canonical18: fajrGrid.filter(g => g.ang === 18 && g.mode === 'floor' && g.margin === 0).sort((a, b) => b.ex - a.ex)[0] };

// sunrise
const srGrid = [];
for (const mode of ['floor', 'nearest', 'ceil']) for (let margin = -1.5; margin <= 1.5001; margin += 0.5) {
  let ex = 0, w1 = 0, worst = 0;
  for (const r of rows) { const d = MODES[mode](calc(r.iso, base, 'sunrise') + margin) - r.v[2]; if (d === 0) ex++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d)); }
  srGrid.push({ mode, margin, ex, w1, worst });
}
srGrid.sort((a, b) => b.ex - a.ex || a.worst - b.worst);
out.sunrise = srGrid.slice(0, 4);

// maghrib: sunset + margin
const mgGrid = [];
for (const mode of ['floor', 'nearest', 'ceil']) for (let margin = 0; margin <= 10.0001; margin += 0.5) {
  let ex = 0, w1 = 0, worst = 0;
  for (const r of rows) { const d = MODES[mode](calc(r.iso, base, 'sunset') + margin) - r.v[8]; if (d === 0) ex++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d)); }
  mgGrid.push({ mode, margin, ex, w1, worst });
}
mgGrid.sort((a, b) => b.ex - a.ex || a.worst - b.worst);
out.maghrib = mgGrid.slice(0, 4);

// asr: school + margin
const asrGrid = [];
for (const madhab of ['shafi', 'hanafi']) for (const mode of ['floor', 'nearest', 'ceil']) for (let margin = -2; margin <= 6.0001; margin += 0.5) {
  const p = params({ fajr: 18, isha: 18, madhab });
  let ex = 0, w1 = 0, worst = 0;
  for (const r of rows) { const d = MODES[mode](calc(r.iso, p, 'asr') + margin) - r.v[5]; if (d === 0) ex++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d)); }
  asrGrid.push({ madhab, mode, margin, ex, w1, worst });
}
asrGrid.sort((a, b) => b.ex - a.ex || a.worst - b.worst);
out.asr = { best: asrGrid.slice(0, 6), mwl: asrGrid.filter(g => g.madhab === 'shafi' && g.margin === 0).sort((a, b) => b.ex - a.ex)[0] };

// asr: how far does a Shafi fit miss the printed column at its best?
const bestShafi = asrGrid.filter(g => g.madhab === 'shafi').sort((a, b) => b.ex - a.ex)[0];
out.asrShafiBest = bestShafi;

// isha: best single angle (to reproduce the refutation), and the ladder reconstruction
const ishaRowsS = mkRows(cIshaAthan);
const ishaGrid = [];
for (let ang = 14; ang <= 21.0001; ang += 0.05) {
  const p = params({ fajr: 18, isha: ang, madhab: 'hanafi' });
  for (const mode of ['floor', 'nearest', 'ceil']) for (let margin = -5; margin <= 20.0001; margin += 0.5) {
    let ex = 0, w1 = 0, worst = 0;
    for (const r of ishaRowsS) { const d = MODES[mode](calc(r.iso, p, 'isha') + margin) - r.printed; if (d === 0) ex++; if (Math.abs(d) <= 1) w1++; worst = Math.max(worst, Math.abs(d)); }
    ishaGrid.push({ ang: Number(ang.toFixed(2)), mode, margin, ex, w1, worst });
  }
}
ishaGrid.sort((a, b) => b.ex - a.ex || a.worst - b.worst);
out.ishaAngleBest = ishaGrid.slice(0, 6);

// the exact ladder: is it reproducible as 15-min snap of (angle isha + margin)?
// test the claim ceil(18deg isha + 12.5) snapped to 15
const snap = (x) => Math.ceil(x / 15) * 15;
let snapExact = 0, snapW1 = 0, snapWorst = 0;
const snapMisses = [];
for (const r of ishaRowsS) {
  const c = calc(r.iso, params({ fajr: 18, isha: 18 }), 'isha');
  const v = snap(c + 12.5);
  const d = v - r.printed;
  if (d === 0) snapExact++; if (Math.abs(d) <= 1) snapW1++; else snapMisses.push({ iso: r.iso, printed: r.printed, pred: v, d });
  snapWorst = Math.max(snapWorst, Math.abs(d));
}
out.ishaSnapClaim = { exact: snapExact, w1: snapW1, worst: snapWorst, misses: snapMisses.length };
out.snapMissDates = snapMisses.map(m => m.iso);

// --- 5. MWL 18/17 asr check ---
const pMWL = params({ fajr: 18, isha: 17, madhab: 'shafi' });
const asrDiffsMWL = rows.map(r => MODES.nearest(calc(r.iso, pMWL, 'asr')) - r.v[5]);
out.mwlAsr = { medianDiff: median(asrDiffsMWL), worst: Math.max(...asrDiffsMWL.map(Math.abs)), within1: asrDiffsMWL.filter(d => Math.abs(d) <= 1).length, n: asrDiffsMWL.length };

// --- 6. column mapping verification: is the fit1 mapping consistent with the pair structure? ---
out.fitMappingCheck = {
  sunriseColumnClosest: cSunrise,
  sunsetColumnClosest: cSunset,
  transitColumnClosest: cTransit,
  asrColumnClosest: cAsr,
  note: 'fit1 claims c1 fajr, c3 sunrise, c4 dhuhr, c6 asr, c9 maghrib, c10 isha',
};

fs.writeFileSync(new URL('./pk.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ rows: out.rowCount, mapping: out.autoMapping, dhuhr: out.dhuhr, isha: { distinct: out.isha.distinctCount, switches: out.isha.switchCount, stepSizes: out.isha.stepSizes, grid: out.isha.quarterGrid }, fajr: out.fajr.top10.slice(0, 5), canonical18: out.fajr.canonical18, sunrise: out.sunrise, maghrib: out.maghrib, asr: out.asr.best.slice(0, 3), asrShafiBest: out.asrShafiBest, ishaAngleBest: out.ishaAngleBest.slice(0, 3), snap: out.ishaSnapClaim, mwlAsr: out.mwlAsr, pairs: out.jamaatPairDeltas }, null, 1));
