// R13 Part 2: the interval encoding that reproduces London exactly.
// R6 measured Fajr and Isha as INTERVALS against London's own published sunrise and Maghrib,
// costing 204 bytes brotli and identical across 2019, 2022, 2025 and 2026 except four June days.
// This verifies that independently on every London year the repository holds (2012 to 2026),
// establishes exactly which days differ, and then answers the crux: do the intervals work
// against a COMPUTED sun, or do they need the authority's own published sun times?

import fs from 'node:fs';
import zlib from 'node:zlib';
import { adhan, readLpt, readElm, ELM_YEARS, toMin, fmt, datesOf, computeDay, FIELDS } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

// ---------------------------------------------------------------------------
// 1. Build the interval table for every year, from that year's own published columns.
// ---------------------------------------------------------------------------

/**
 * London's own published structure, per ELM's explainer:
 *   fajr  = (published sunrise + 3) - fajrInterval
 *   isha  = (published magrib  - 3) + ishaInterval
 * The +3 and -3 undo the safety margins ELM states it applies to the HMNAO sun times.
 */
const intervalsOf = (year, rows) => {
  const out = {};
  for (const [date, row] of Object.entries(rows)) {
    const sunrise = toMin(row.sunrise);
    const fajr = toMin(row.fajr);
    const magrib = toMin(row.magrib);
    const isha = toMin(row.isha);
    if (sunrise === null || fajr === null || magrib === null || isha === null) continue;
    out[date.slice(5)] = {
      fajr: sunrise + 3 - fajr,
      isha: isha - (magrib - 3),
    };
  }
  return out;
};

const lpt = readLpt();
const years = {};
for (const y of ELM_YEARS) years[y] = readElm(y);
// The app's own current source, independent of the ELM PDFs.
years['2026-LPT'] = lpt;

const tables = {};
for (const [label, rows] of Object.entries(years)) tables[label] = intervalsOf(label, rows);

say('R13 PART 2: London reproduced by its own interval table');
say('');
say('== 2.1 Source identity: the app API year against the ELM 2026 PDF ==');
{
  const dates = datesOf(2026);
  let cells = 0;
  let diffs = 0;
  for (const d of dates) {
    for (const f of FIELDS) {
      const a = lpt[d]?.[f];
      const b = years[2026][d]?.[f];
      if (a === undefined || b === undefined) continue;
      cells += 1;
      if (a !== b) {
        diffs += 1;
        say(`  DIFF ${d} ${f}: LPT ${a} vs ELM ${b}`);
      }
    }
  }
  say(`  ${cells} cells compared, ${diffs} differences.`);
}
say('');

say('== 2.2 The interval table, per year ==');
say('year        days  Fajr distinct  Fajr min-max  Isha distinct  Isha min-max');
for (const label of Object.keys(tables)) {
  const t = tables[label];
  const keys = Object.keys(t);
  const fv = keys.map((k) => t[k].fajr);
  const iv = keys.map((k) => t[k].isha);
  say(
    `${String(label).padEnd(10)} ${String(keys.length).padStart(5)} ${String(new Set(fv).size).padStart(14)} ${`${Math.min(...fv)} to ${Math.max(...fv)}`.padStart(13)} ${String(new Set(iv).size).padStart(14)} ${`${Math.min(...iv)} to ${Math.max(...iv)}`.padStart(13)}`
  );
}
say('');

// ---------------------------------------------------------------------------
// 2. Year-over-year stability, and exactly which days move.
// ---------------------------------------------------------------------------

say('== 2.3 Year-over-year stability of the interval table ==');
const comparableYears = Object.keys(tables).filter((y) => y !== '2026-LPT');
say('pair              common  Fajr identical      Isha identical      Isha days that differ');
for (let i = 0; i < comparableYears.length - 1; i += 1) {
  const a = tables[comparableYears[i]];
  const b = tables[comparableYears[i + 1]];
  const common = Object.keys(a).filter((k) => k in b && k !== '02-29');
  const fSame = common.filter((k) => a[k].fajr === b[k].fajr);
  const iSame = common.filter((k) => a[k].isha === b[k].isha);
  const iDiff = common.filter((k) => a[k].isha !== b[k].isha);
  say(
    `${`${comparableYears[i]} vs ${comparableYears[i + 1]}`.padEnd(17)} ${String(common.length).padStart(6)} ${`${fSame.length} (${((100 * fSame.length) / common.length).toFixed(1)}%)`.padStart(18)} ${`${iSame.length} (${((100 * iSame.length) / common.length).toFixed(1)}%)`.padStart(18)}  ${iDiff.length <= 12 ? iDiff.join(', ') : `${iDiff.length} days`}`
  );
}
say('');

say('== 2.4 Era B only (2015 onward), every day that moves in EITHER column ==');
const eraB = comparableYears.filter((y) => Number(y) >= 2015);
{
  const ref = tables[eraB[eraB.length - 1]];
  const slots = Object.keys(ref).filter((k) => k !== '02-29');
  const movers = [];
  for (const slot of slots) {
    const fVals = new Map();
    const iVals = new Map();
    for (const y of eraB) {
      const t = tables[y][slot];
      if (!t) continue;
      fVals.set(y, t.fajr);
      iVals.set(y, t.isha);
    }
    const fSet = new Set(fVals.values());
    const iSet = new Set(iVals.values());
    if (fSet.size > 1 || iSet.size > 1) {
      movers.push({ slot, fVals, iVals, fSet, iSet });
    }
  }
  say(`Years in era B present here: ${eraB.join(', ')}`);
  say(`Slots where either interval is NOT constant across era B: ${movers.length} of ${slots.length}`);
  for (const m of movers) {
    const f = m.fSet.size > 1 ? `Fajr {${[...m.fVals].map(([y, v]) => `${y}:${v}`).join(' ')}}` : `Fajr ${[...m.fSet][0]}`;
    const i = m.iSet.size > 1 ? `Isha {${[...m.iVals].map(([y, v]) => `${y}:${v}`).join(' ')}}` : `Isha ${[...m.iSet][0]}`;
    say(`  ${m.slot}  ${f}  ${i}`);
  }
}
say('');

say('== 2.5 Era A (2012 to 2014) against era B, to show where the break is ==');
{
  const ref = tables[2026];
  for (const y of [2012, 2013, 2014, 2015]) {
    const t = tables[y];
    const common = Object.keys(t).filter((k) => k in ref && k !== '02-29');
    const fSame = common.filter((k) => t[k].fajr === ref[k].fajr).length;
    const iSame = common.filter((k) => t[k].isha === ref[k].isha).length;
    say(`  ${y} vs 2026: Fajr identical ${fSame}/${common.length}, Isha identical ${iSame}/${common.length}`);
  }
}
say('');

// ---------------------------------------------------------------------------
// 3. THE CRUX: do the intervals work against a COMPUTED sun?
// ---------------------------------------------------------------------------

say('== 2.6 THE CRUX: intervals against a COMPUTED sunrise and Maghrib ==');
say('If this reproduces the published Fajr and Isha to the minute, London goes fully offline.');
say('If it does not, London still needs the authority\'s own sun times, so it still needs a fetch.');
say('');

const table2026 = tables[2026];
const dates2026 = datesOf(2026).filter((d) => lpt[d]);

const coordSet = [
  ['51.5,-0.165 (Hizbul Ulama LONDON point)', new adhan.Coordinates(51.5, -0.165)],
  ['51.5072,-0.1276 (generic London)', new adhan.Coordinates(51.5072, -0.1276)],
  ['51.5,-0.1275', new adhan.Coordinates(51.5, -0.1275)],
  ['51.5,-0.1167 (51:30N 0:07W)', new adhan.Coordinates(51.5, -0.11667)],
];

const mkParams = () => {
  const p = adhan.CalculationMethod.MuslimWorldLeague();
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  return p;
};

const results = [];
for (const [coordName, coords] of coordSet) {
  for (const rule of ['nearest', 'down', 'up']) {
    const round = rule === 'nearest' ? Math.round : rule === 'up' ? Math.ceil : Math.floor;
    const params = mkParams();
    let sunriseExact = 0;
    let magribExact = 0;
    let fajrExact = 0;
    let ishaExact = 0;
    let fajrW1 = 0;
    let ishaW1 = 0;
    let fajrWorst = 0;
    let ishaWorst = 0;
    const fajrMisses = [];
    const ishaMisses = [];
    for (const d of dates2026) {
      const c = computeDay(d, coords, params);
      const slot = d.slice(5);
      const iv = table2026[slot];
      if (!iv) continue;
      // The published sunrise is the computed sunrise minus 3 (ELM's stated safety margin),
      // so (published sunrise + 3) IS the computed sunrise, rounded.
      const sunriseComputed = round(c.sunrise);
      const magribComputed = round(c.magrib);
      const pubSunrise = toMin(lpt[d].sunrise);
      const pubMagrib = toMin(lpt[d].magrib);
      if (sunriseComputed - 3 === pubSunrise) sunriseExact += 1;
      if (magribComputed + 3 === pubMagrib) magribExact += 1;

      const fajr = sunriseComputed - iv.fajr;
      const isha = magribComputed + iv.isha;
      const dF = fajr - toMin(lpt[d].fajr);
      const dI = isha - toMin(lpt[d].isha);
      if (dF === 0) fajrExact += 1;
      else fajrMisses.push(`${d}:${dF > 0 ? '+' : ''}${dF}`);
      if (dI === 0) ishaExact += 1;
      else ishaMisses.push(`${d}:${dI > 0 ? '+' : ''}${dI}`);
      if (Math.abs(dF) <= 1) fajrW1 += 1;
      if (Math.abs(dI) <= 1) ishaW1 += 1;
      fajrWorst = Math.max(fajrWorst, Math.abs(dF));
      ishaWorst = Math.max(ishaWorst, Math.abs(dI));
    }
    results.push({
      coordName,
      rule,
      n: dates2026.length,
      sunriseExact,
      magribExact,
      fajrExact,
      ishaExact,
      fajrW1,
      ishaW1,
      fajrWorst,
      ishaWorst,
      fajrMisses,
      ishaMisses,
    });
  }
}

say('Computed sun reproducing the PUBLISHED sunrise and Maghrib (the -3 and +3 margins applied):');
say('coordinates                                round    sunrise exact  maghrib exact');
for (const r of results) {
  say(
    `${r.coordName.padEnd(42)} ${r.rule.padEnd(8)} ${`${r.sunriseExact}/${r.n}`.padStart(13)} ${`${r.magribExact}/${r.n}`.padStart(14)}`
  );
}
say('');
say('Intervals chained to that computed sun, reproducing the PUBLISHED Fajr and Isha:');
say('coordinates                                round    Fajr exact   Fajr<=1  worst   Isha exact   Isha<=1  worst');
for (const r of results) {
  say(
    `${r.coordName.padEnd(42)} ${r.rule.padEnd(8)} ${`${r.fajrExact}/${r.n}`.padStart(11)} ${`${r.fajrW1}`.padStart(8)} ${String(r.fajrWorst).padStart(6)} ${`${r.ishaExact}/${r.n}`.padStart(12)} ${`${r.ishaW1}`.padStart(8)} ${String(r.ishaWorst).padStart(6)}`
  );
}
say('');
const best = results.reduce((a, b) => (a.fajrExact + a.ishaExact >= b.fajrExact + b.ishaExact ? a : b));
say(`Best configuration: ${best.coordName}, rounding ${best.rule}`);
say(`  Fajr: ${best.fajrExact} of ${best.n} exact, ${best.fajrW1} within 1 minute, worst ${best.fajrWorst}`);
say(`  Isha: ${best.ishaExact} of ${best.n} exact, ${best.ishaW1} within 1 minute, worst ${best.ishaWorst}`);
say(`  Fajr misses (${best.fajrMisses.length}): ${best.fajrMisses.join(' ')}`);
say(`  Isha misses (${best.ishaMisses.length}): ${best.ishaMisses.join(' ')}`);
say('');

// The same check with the authority's OWN published sun times, as the control.
say('== 2.7 Control: the SAME intervals against the authority\'s own published sun ==');
{
  let fajrExact = 0;
  let ishaExact = 0;
  const misses = [];
  for (const d of dates2026) {
    const iv = table2026[d.slice(5)];
    if (!iv) continue;
    const fajr = toMin(lpt[d].sunrise) + 3 - iv.fajr;
    const isha = toMin(lpt[d].magrib) - 3 + iv.isha;
    if (fajr === toMin(lpt[d].fajr)) fajrExact += 1;
    else misses.push(`F ${d}`);
    if (isha === toMin(lpt[d].isha)) ishaExact += 1;
    else misses.push(`I ${d}`);
  }
  say(`  Fajr ${fajrExact}/${dates2026.length} exact, Isha ${ishaExact}/${dates2026.length} exact. Misses: ${misses.length ? misses.join(', ') : 'none'}`);
  say('  (Exact by construction: the table is derived from these same columns. Stated as the control.)');
}
say('');

// Cross-year: the 2026 table applied to 2025's and 2019's own published sun.
say('== 2.8 Does ONE table serve other years, against those years\' own published sun? ==');
for (const y of eraB) {
  const rows = years[y];
  const dates = Object.keys(rows).sort();
  let fajrExact = 0;
  let ishaExact = 0;
  let n = 0;
  let fw = 0;
  let iw = 0;
  const ishaMiss = [];
  for (const d of dates) {
    const slot = d.slice(5);
    const iv = table2026[slot];
    const sr = toMin(rows[d].sunrise);
    const mg = toMin(rows[d].magrib);
    if (!iv || sr === null || mg === null) continue;
    n += 1;
    const dF = sr + 3 - iv.fajr - toMin(rows[d].fajr);
    const dI = mg - 3 + iv.isha - toMin(rows[d].isha);
    if (dF === 0) fajrExact += 1;
    if (dI === 0) ishaExact += 1;
    else ishaMiss.push(`${slot}${dI > 0 ? '+' : ''}${dI}`);
    fw = Math.max(fw, Math.abs(dF));
    iw = Math.max(iw, Math.abs(dI));
  }
  say(
    `  2026 table on ${y}: Fajr ${fajrExact}/${n} exact (worst ${fw}), Isha ${ishaExact}/${n} exact (worst ${iw})${ishaMiss.length && ishaMiss.length <= 8 ? `  Isha misses: ${ishaMiss.join(' ')}` : ''}`
  );
}
say('');

// ---------------------------------------------------------------------------
// 4. Byte cost.
// ---------------------------------------------------------------------------

say('== 2.9 Byte cost of the interval table ==');
{
  const slots = Object.keys(table2026).sort();
  const fajrBytes = Buffer.from(slots.map((s) => table2026[s].fajr));
  const ishaBytes = Buffer.from(slots.map((s) => table2026[s].isha));
  const both = Buffer.concat([fajrBytes, ishaBytes]);
  const csv = Buffer.from(slots.map((s) => `${table2026[s].fajr},${table2026[s].isha}`).join('\n'));
  const json = Buffer.from(JSON.stringify(table2026));
  const rle = (arr) => {
    const runs = [];
    for (const v of arr) {
      if (runs.length && runs[runs.length - 1][0] === v) runs[runs.length - 1][1] += 1;
      else runs.push([v, 1]);
    }
    return runs;
  };
  const fRuns = rle(slots.map((s) => table2026[s].fajr));
  const iRuns = rle(slots.map((s) => table2026[s].isha));
  const rleBuf = Buffer.from([...fRuns.flat(), ...iRuns.flat()]);
  const rows = [
    ['two uint8 arrays, 365 each', both],
    ['run-length encoded pairs', rleBuf],
    ['CSV text', csv],
    ['JSON object keyed by MM-DD', json],
  ];
  say('encoding                          raw   gzip  brotli');
  for (const [name, buf] of rows) {
    say(
      `${name.padEnd(30)} ${String(buf.length).padStart(6)} ${String(zlib.gzipSync(buf, { level: 9 }).length).padStart(6)} ${String(zlib.brotliCompressSync(buf).length).padStart(7)}`
    );
  }
  say(`Fajr runs: ${fRuns.length}, Isha runs: ${iRuns.length}`);
  say('');
  // For comparison, the whole published year as the app stores it.
  const yearJson = Buffer.from(JSON.stringify(lpt));
  say(
    `Whole published 2026 year as fetched: ${yearJson.length} raw, ${zlib.gzipSync(yearJson, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(yearJson).length} brotli`
  );
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part2.txt', out + '\n');
console.log(out);
