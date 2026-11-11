// Job 1: Fondation Culturelle Islamique de Genève — hijri 1446+1447+1448,
// 1022 dated rows, one span. Verify the stated reading (fajr 15 deg with a
// 90-minute isha interval), then free-fit. TZ Europe/Zurich.
import fs from 'node:fs';
import { load, computeCols, chartOf, score, bestMargin, scanValue, line, parseMin, roundMin, r1, r2 } from './lib.mjs';

const ROOT = process.env.HOME + '/athan-gitree/census/o1k-wide/iberia2/data/';
const adhan = await load();
const coords = { lat: 46.2044, lon: 6.1432 };
const TZ = 'Europe/Zurich';

const files = ['ch-geneve-hijri1446.json', 'ch-geneve-hijri1447.json', 'ch-geneve-hijri1448.json'];
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const dates = [], rows = [], origin = [];
files.forEach((f, fi) => {
  const raw = JSON.parse(fs.readFileSync(ROOT + f));
  for (const d of Object.keys(raw).sort()) {
    dates.push(d);
    origin.push(fi);
    const r = raw[d];
    rows.push({ fajr: r.fajr, sunrise: r.sunrise, dhuhr: r.dhuhr, asr: r.asr, magrib: r.magrib, isha: r.isha });
  }
});
const YEARS = ['hijri1446', 'hijri1447', 'hijri1448'];
const yearIdx = origin;
const perFileRows = Object.fromEntries(YEARS.map((y, i) => [y, origin.filter((x) => x === i).length]));
console.log(`span ${dates[0]} .. ${dates[dates.length - 1]}, rows ${rows.length} (${YEARS.map((y, i) => `${y} ${perFileRows[YEARS[i]]}`).join(' / ')})`);

// printed isha-maghrib law
let d90 = 0, dOther = 0;
const deltas = new Map();
for (const r of rows) {
  const v = parseMin(r.isha) - parseMin(r.magrib);
  deltas.set(v, (deltas.get(v) || 0) + 1);
  if (v === 90) d90++; else dOther++;
}
console.log(`printed isha-magrib: 90 on ${d90}, other on ${dOther}`, JSON.stringify([...deltas.entries()]));

const chart = chartOf(rows, COLS);
const angles = [];
for (let a = 80; a <= 240; a++) angles.push(a / 10);
const modes = ['nearest', 'floor', 'ceil'];
const perMode = {};

for (const mode of modes) {
  const fajr = scanValue(adhan, coords, TZ, dates, chart.fajr, 'fajr', angles,
    (a) => ({ fajr: { kind: 'angle', v: a, after: false } }), { mode, marginBound: 2 });
  const base = { fajr: { kind: 'angle', v: fajr.best.value, after: false } };
  const geo = computeCols(adhan, coords, TZ, dates, {
    ...base, sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' },
    asr: { kind: 'asr', v: 'shafi' }, magrib: { kind: 'sunset' },
  });
  const solar = {
    sunrise: bestMargin(geo.sunrise, chart.sunrise, { margins: [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2], modes: [mode] }),
    dhuhr: bestMargin(geo.dhuhr, chart.dhuhr, { margins: [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2], modes: [mode] }),
    magrib: bestMargin(geo.magrib, chart.magrib, { margins: [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2], modes: [mode] }),
  };
  const asrShafi = bestMargin(geo.asr, chart.asr, { margins: [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2], modes: [mode] });
  const asrHanafi = bestMargin(computeCols(adhan, coords, TZ, dates, { ...base, asr: { kind: 'asr', v: 'hanafi' } }).asr,
    chart.asr, { margins: [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2], modes: [mode] });
  const ivs = []; for (let n = 80; n <= 100; n++) ivs.push(n);
  const ishaInterval = scanValue(adhan, coords, TZ, dates, chart.isha, 'isha', ivs,
    (n) => ({ isha: { kind: 'interval', v: n } }), { mode, marginBound: 2 });
  const ishaAngle = scanValue(adhan, coords, TZ, dates, chart.isha, 'isha', angles,
    (a) => ({ isha: { kind: 'angle', v: a, after: true } }), { mode, marginBound: 2 });
  const useInterval = ishaInterval.best.worst < ishaAngle.best.worst
    || (ishaInterval.best.worst === ishaAngle.best.worst && ishaInterval.best.exact >= ishaAngle.best.exact);
  perMode[mode] = { fajr, solar, asrShafi, asrHanafi, ishaInterval, ishaAngle, useInterval };
  console.log(`  ${mode}: fajr ${fajr.best.value.toFixed(1)} deg ${fajr.best.exact}/${fajr.best.n} (plateau ${fajr.plateau ? fajr.plateau.min + '..' + fajr.plateau.max : '-'})  isha ${useInterval ? 'interval ' + ishaInterval.best.value : 'angle ' + ishaAngle.best.value.toFixed(1)} ${useInterval ? ishaInterval.best.exact + '/' + ishaInterval.best.n : ishaAngle.best.exact + '/' + ishaAngle.best.n}  asr shafi ${asrShafi.exact} hanafi ${asrHanafi.exact}`);
}

const chosen = modes.map((m) => perMode[m]).sort((a, b) => {
  const t = (x) => x.fajr.best.exact + x.solar.sunrise.exact + x.solar.dhuhr.exact + x.solar.magrib.exact + x.asrShafi.exact + (x.useInterval ? x.ishaInterval.best.exact : x.ishaAngle.best.exact);
  return t(b) - t(a);
})[0];

const spec = {
  fajr: { kind: 'angle', v: chosen.fajr.best.value, after: false },
  sunrise: { kind: 'sunrise' }, dhuhr: { kind: 'transit' }, asr: { kind: 'asr', v: 'shafi' },
  magrib: { kind: 'sunset' },
  isha: chosen.useInterval ? { kind: 'interval', v: chosen.ishaInterval.best.value } : { kind: 'angle', v: chosen.ishaAngle.best.value, after: true },
};
const margins = {
  fajr: chosen.fajr.best.margin, sunrise: chosen.solar.sunrise.margin, dhuhr: chosen.solar.dhuhr.margin,
  asr: chosen.asrShafi.margin, magrib: chosen.solar.magrib.margin,
  isha: chosen.useInterval ? chosen.ishaInterval.best.margin : chosen.ishaAngle.best.margin,
};
const modesC = {
  fajr: chosen.fajr.best.mode, sunrise: chosen.solar.sunrise.mode, dhuhr: chosen.solar.dhuhr.mode,
  asr: chosen.asrShafi.mode, magrib: chosen.solar.magrib.mode,
  isha: chosen.useInterval ? chosen.ishaInterval.best.mode : chosen.ishaAngle.best.mode,
};
const ser = computeCols(adhan, coords, TZ, dates, spec);

const colScore = {};
const joint = {};
for (const c of COLS) {
  const s = score(ser[c], chart[c], margins[c], modesC[c]);
  colScore[c] = s;
  joint[c] = line(c, s);
}
const totN = rows.length * COLS.length;
const totExact = Object.values(colScore).reduce((a, s) => a + s.exact, 0);
const totW1 = Object.values(colScore).reduce((a, s) => a + s.within1, 0);
const totWorst = Math.max(...Object.values(colScore).map((s) => s.worst));

console.log(`\nFREE FIT (${modesC.fajr}): fajr ${chosen.fajr.best.value.toFixed(1)} deg @${margins.fajr}  isha ${chosen.useInterval ? 'interval ' + chosen.ishaInterval.best.value : 'angle ' + chosen.ishaAngle.best.value.toFixed(1)} @${margins.isha}  asr ${chosen.asrShafi.exact >= chosen.asrHanafi.exact ? 'Shafi' : 'Hanafi'} @${margins.asr}  sunrise @${margins.sunrise} dhuhr @${margins.dhuhr} magrib @${margins.magrib}`);
for (const c of COLS) console.log('  ', joint[c]);
console.log(`JOINT exact ${totExact}/${totN} within1 ${totW1}/${totN} worst ${totWorst}`);

// February 1446 defect: the whole month drifts (morning cols early, evening
// cols late), no date shift repairs it - the poster is faulty as printed.
const febIdx = dates.map((_, i) => i).filter((i) => dates[i].slice(0, 7) === '2025-02');
const febClean = dates.map((_, i) => i).filter((i) => dates[i].slice(0, 7) !== '2025-02');

// per-year scores under the one recipe (also with the Feb-1446 defect excluded)
const perYear = {};
for (let y = 0; y < 3; y++) {
  const idx = dates.map((_, i) => i).filter((i) => yearIdx[i] === y);
  perYear[YEARS[y]] = {};
  for (const c of COLS) {
    perYear[YEARS[y]][c] = score(idx.map((i) => ser[c][i]), idx.map((i) => chart[c][i]), margins[c], modesC[c]);
  }
  const e = Object.values(perYear[YEARS[y]]).reduce((a, s) => a + s.exact, 0);
  const w1 = Object.values(perYear[YEARS[y]]).reduce((a, s) => a + s.within1, 0);
  const w = Math.max(...Object.values(perYear[YEARS[y]]).map((s) => s.worst));
  console.log(`${YEARS[y]} exact ${e}/${idx.length * 6} within1 ${w1}/${idx.length * 6} worst ${w}`);
}
const clean1446 = {};
for (const c of COLS) clean1446[c] = score(febClean.map((i) => ser[c][i]), febClean.map((i) => chart[c][i]), margins[c], modesC[c]);
{
  const e = Object.values(clean1446).reduce((a, s) => a + s.exact, 0);
  const w1 = Object.values(clean1446).reduce((a, s) => a + s.within1, 0);
  const w = Math.max(...Object.values(clean1446).map((s) => s.worst));
  console.log(`hijri1446 excl Feb defect exact ${e}/${febClean.length * 6} within1 ${w1}/${febClean.length * 6} worst ${w}`);
}

// February 1446 defect block (febIdx/febClean defined above)
const febScores = {};
for (const c of COLS) {
  const s = score(febIdx.map((i) => ser[c][i]), febIdx.map((i) => chart[c][i]), margins[c], modesC[c]);
  febScores[c] = { exact: s.exact, worst: s.worst, mae: r2(s.mae), bias: r2(s.bias) };
}
const febFajrBias = febScores.fajr.bias, febMagribBias = febScores.magrib.bias;
console.log(`\nFEB 2025 (1446) DEFECT: ${febIdx.length} rows; fajr bias +${febFajrBias} sunrise +${febScores.sunrise.bias} dhuhr +${febScores.dhuhr.bias} asr ${febScores.asr.bias} magrib ${febMagribBias} isha ${febScores.isha.bias} (min/row)`);
// no single date shift repairs it
let bestShift = null;
for (let sh = -20; sh <= 20; sh++) {
  const shifted = febIdx.map((i) => {
    const [y, m, d] = dates[i].split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + sh)).toISOString().slice(0, 10);
  });
  const serS = computeCols(adhan, coords, TZ, shifted, spec);
  let e = 0;
  for (const c of COLS) e += score(serS[c], febIdx.map((i) => chart[c][i]), margins[c], modesC[c]).exact;
  if (!bestShift || e > bestShift.exact) bestShift = { shift: sh, exact: e };
}
console.log(`  best date-shift repair: ${bestShift.shift} days -> ${bestShift.exact}/${febIdx.length * 6} exact (no shift fixes the month)`);

// frozen check: independent per-year fajr-angle fit on the clean rows of each year
const perYearAngle = {};
for (let y = 0; y < 3; y++) {
  const idx = dates.map((_, i) => i).filter((i) => yearIdx[i] === y && !dates[i].startsWith('2025-02'));
  const cIdx = idx.filter((i) => true);
  const fy = scanValue(adhan, coords, TZ, cIdx.map((i) => dates[i]), idx.map((i) => chart.fajr[i]), 'fajr', angles,
    (a) => ({ fajr: { kind: 'angle', v: a, after: false } }), { mode: modesC.fajr, marginBound: 2 });
  perYearAngle[YEARS[y]] = { best: fy.best.value, plateau: fy.plateau, exact: fy.best.exact, n: fy.best.n };
  console.log(`${YEARS[y]} independent fajr fit: ${fy.best.value.toFixed(1)} plateau ${fy.plateau ? fy.plateau.min + '..' + fy.plateau.max : '-'} exact ${fy.best.exact}/${fy.best.n}`);
}

// stated reading check: fajr 15 + interval 90
const stated = computeCols(adhan, coords, TZ, dates, {
  fajr: { kind: 'angle', v: 15, after: false }, sunrise: { kind: 'sunrise' },
  dhuhr: { kind: 'transit' }, asr: { kind: 'asr', v: 'shafi' }, magrib: { kind: 'sunset' },
  isha: { kind: 'interval', v: 90 },
});
const statedScore = {};
for (const c of COLS) statedScore[c] = bestMargin(stated[c], chart[c]);
console.log('\nSTATED READING fajr 15 / isha 90:');
for (const c of COLS) console.log('  ', line(c, statedScore[c]));

// seasonal amplitude: Jan vs Jul fajr (printed and computed), in both years that hold them
const amp = {};
for (const [label, m] of [['Jan 2025', '2025-01'], ['Jul 2025', '2025-07'], ['Jan 2026', '2026-01'], ['Jul 2026', '2026-07'], ['Jan 2027', '2027-01']]) {
  const idx = dates.map((_, i) => i).filter((i) => dates[i].startsWith(m));
  if (!idx.length) continue;
  const p = idx.map((i) => chart.fajr[i]);
  const c = idx.map((i) => roundMin(ser.fajr[i] / 60 + margins.fajr, modesC.fajr));
  amp[label] = { printed: [Math.min(...p), Math.max(...p)], computed: [Math.min(...c), Math.max(...c)] };
}
console.log('\nSEASONAL AMPLITUDE (fajr minutes-of-day min..max):');
for (const [k, v] of Object.entries(amp)) {
  const f = (x) => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`;
  console.log(`  ${k} printed ${f(v.printed[0])}..${f(v.printed[1])} computed ${f(v.computed[0])}..${f(v.computed[1])}`);
}

const out = {
  site: 'Fondation Culturelle Islamique de Genève', coords, tz: TZ,
  span: { from: dates[0], to: dates[dates.length - 1], days: dates.length, rows: rows.length },
  perFileRows,
  printedIshaMinusMaghrib: { at90: d90, other: dOther, distribution: Object.fromEntries(deltas) },
  statedReading: Object.fromEntries(COLS.map((c) => [c, { margin: statedScore[c].margin, mode: statedScore[c].mode, exact: statedScore[c].exact, within1: statedScore[c].within1, worst: statedScore[c].worst, n: statedScore[c].n }])),
  freeFit: {
    rounding: modesC.fajr,
    fajrAngle: chosen.fajr.best.value, fajrPlateau: chosen.fajr.plateau, fajrMargin: margins.fajr,
    ishaModel: chosen.useInterval ? 'interval' : 'angle',
    ishaInterval: chosen.useInterval ? chosen.ishaInterval.best.value : null,
    ishaIntervalPlateau: chosen.useInterval ? chosen.ishaInterval.plateau : null,
    ishaAngle: chosen.useInterval ? null : r1(chosen.ishaAngle.best.value),
    asrSchool: chosen.asrShafi.exact >= chosen.asrHanafi.exact ? 'Shafi' : 'Hanafi',
    asrHanafiBest: { margin: chosen.asrHanafi.margin, mode: chosen.asrHanafi.mode, exact: chosen.asrHanafi.exact, worst: chosen.asrHanafi.worst },
    margins, colScores: Object.fromEntries(COLS.map((c) => [c, colScore[c]])),
    joint: { exact: totExact, within1: totW1, worst: totWorst, of: totN },
  },
  perYear: Object.fromEntries(YEARS.map((y) => [y, {
    exact: Object.values(perYear[y]).reduce((a, s) => a + s.exact, 0),
    within1: Object.values(perYear[y]).reduce((a, s) => a + s.within1, 0),
    worst: Math.max(...Object.values(perYear[y]).map((s) => s.worst)),
    of: Object.values(perYear[y]).reduce((a, s) => a + s.n, 0),
    perCol: Object.fromEntries(COLS.map((c) => [c, { exact: perYear[y][c].exact, worst: perYear[y][c].worst }])),
  }])),
  hijri1446ExclFeb: null, // superseded by spanExclFebDefect below
  spanExclFebDefect: {
    exact: Object.values(clean1446).reduce((a, s) => a + s.exact, 0),
    within1: Object.values(clean1446).reduce((a, s) => a + s.within1, 0),
    worst: Math.max(...Object.values(clean1446).map((s) => s.worst)),
    of: febClean.length * 6,
  },
  feb1446Defect: {
    rows: febIdx.length, dates: '2025-02-01..2025-02-28',
    perColBiasMin: febScores,
    bestDateShiftRepair: bestShift,
    reading: 'the poster itself is faulty: morning columns run early, evening columns late, no date shift repairs it; scoped to one month',
  },
  perYearIndependentFajrFit: perYearAngle,
  seasonalAmplitudeFajr: amp,
};
fs.writeFileSync('job1-geneva.json', JSON.stringify(out, null, 1));
console.log('\nwrote job1-geneva.json');
