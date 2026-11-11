// Between-year structure: constrained 1447 fit, the angle ridge under the frozen
// margins, reverse transfer to 1448, and the copy test (is 1448 a reprint of
// 1447, or recomputed?).
import { readFileSync, writeFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding, HighLatitudeRule } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const MODES = { nearest: Math.round, floor: Math.floor, ceil: Math.ceil };
const ALGER = { lat: 36.7538, lon: 3.0588 };
const RECIPE_1448 = {
  fajrAngle: 17.8,
  ishaAngle: 16.1,
  madhab: Madhab.Shafi,
  per: {
    fajr: { margin: 0, mode: 'floor' },
    sunrise: { margin: 1, mode: 'floor' },
    dhuhr: { margin: 1, mode: 'floor' },
    asr: { margin: 1, mode: 'floor' },
    magrib: { margin: 4, mode: 'floor' },
    isha: { margin: 5, mode: 'nearest' },
  },
};

const toMin = (s) => (s.includes(':') ? Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]) : null);
const FILES_47 = {
  jumada1: 'dz-alger-1447-jumada1.json',
  jumada2: 'dz-alger-1447-jumada2.json',
  rajab: 'dz-alger-1447-rajab.json',
  ramadan: 'dz-alger-1447-ramadan.json',
};
const FILES_48 = {
  jumada1: '../fit2/dz-alger-1448-jumada1.json',
  jumada2: '../fit2/dz-alger-1448-jumada2.json',
  rajab: '../fit2/dz-alger-1448-rajab.json',
  ramadan: '../fit2/dz-alger-1448-ramadan.json',
};

function monthRows(file) {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  return Object.keys(doc.rows)
    .sort()
    .map((date) => {
      const r = doc.rows[date];
      return {
        date,
        obs: {
          fajr: toMin(r.fajr),
          sunrise: toMin(r.sunrise),
          dhuhr: toMin(r.dhuhr),
          asr: toMin(r.asr),
          magrib: toMin(r.maghrib ?? r.magrib),
          isha: toMin(r.isha),
        },
      };
    });
}

function rawSeries(day, { fajrAngle, ishaAngle, madhab = Madhab.Shafi }) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  const [y, m, d] = day.date.split('-').map(Number);
  const t = new PrayerTimes(new Coordinates(ALGER.lat, ALGER.lon), new Date(y, m - 1, d), p);
  const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  return { fajr: mins(t.fajr), sunrise: mins(t.sunrise), dhuhr: mins(t.dhuhr), asr: mins(t.asr), magrib: mins(t.maghrib), isha: mins(t.isha) };
}

function bestMargin(raws, obsList, marginRange) {
  let best = null;
  for (const mode of ['nearest', 'floor', 'ceil']) {
    for (let m = marginRange[0]; m <= marginRange[1]; m++) {
      const f = MODES[mode];
      let exact = 0;
      let within1 = 0;
      let worst = 0;
      let sum = 0;
      for (let i = 0; i < raws.length; i++) {
        const err = f(raws[i] + m) - obsList[i];
        if (err === 0) exact++;
        if (Math.abs(err) <= 1) within1++;
        worst = Math.max(worst, Math.abs(err));
        sum += Math.abs(err);
      }
      const s = { margin: m, mode, exact, within1, worst, mae: +(sum / raws.length).toFixed(3) };
      if (!best || s.worst < best.worst || (s.worst === best.worst && s.mae < best.mae) || (s.worst === best.worst && s.mae === best.mae && s.exact > best.exact)) best = s;
    }
  }
  return best;
}

const months47 = Object.fromEntries(Object.entries(FILES_47).map(([k, f]) => [k, monthRows(f)]));
const months48 = Object.fromEntries(Object.entries(FILES_48).map(([k, f]) => [k, monthRows(f)]));
const days47 = Object.values(months47).flat().sort((a, b) => a.date.localeCompare(b.date));
const days48 = Object.values(months48).flat().sort((a, b) => a.date.localeCompare(b.date));

const out = {};

// A. constrained 1447 fit: non-negative margins only (the sheet prints at or after the astronomical time)
function constrainedScan(days, which) {
  const grid = which === 'fajr' ? [15, 21] : [14, 21];
  const res = [];
  for (let a = grid[0]; a <= grid[1] + 1e-9; a += 0.05) {
    const angle = +a.toFixed(2);
    const params = { fajrAngle: which === 'fajr' ? angle : 18, ishaAngle: which === 'isha' ? angle : 17 };
    const raws = days.map((d) => rawSeries(d, params)[which]);
    const obsList = days.map((d) => d.obs[which]);
    res.push({ angle, ...bestMargin(raws, obsList, [0, 15]) });
  }
  return res.sort((x, y) => y.exact - x.exact || x.worst - y.worst || x.mae - y.mae);
}

for (const which of ['fajr', 'isha']) {
  const r = constrainedScan(days47, which);
  out[`constrained1447_${which}`] = r.slice(0, 12);
  console.log(`1447 constrained ${which}:`, r.slice(0, 6).map((x) => `${x.angle} -> ${x.exact}/${days47.length} (${x.margin}/${x.mode}, worst ${x.worst})`).join('  '));
  out[`ridge1447_${which}`] = r.filter((_, i) => i % 4 === 0).map((x) => ({ angle: x.angle, exact: x.exact, margin: x.margin, mode: x.mode }));
}

// B. angle ridge under the FROZEN 1448 margins: vary the angle, margins untouched
for (const which of ['fajr', 'isha']) {
  const grid = which === 'fajr' ? [15, 21] : [14, 21];
  const curve = [];
  for (let a = grid[0]; a <= grid[1] + 1e-9; a += 0.05) {
    const angle = +a.toFixed(2);
    const params = { ...RECIPE_1448, fajrAngle: which === 'fajr' ? angle : RECIPE_1448.fajrAngle, ishaAngle: which === 'isha' ? angle : RECIPE_1448.ishaAngle };
    const { margin, mode } = RECIPE_1448.per[which];
    for (const [tag, days] of [['1447', days47], ['1448', days48]]) {
      let exact = 0;
      let within1 = 0;
      let worst = 0;
      for (const d of days) {
        const err = MODES[mode](rawSeries(d, params)[which] + margin) - d.obs[which];
        if (err === 0) exact++;
        if (Math.abs(err) <= 1) within1++;
        worst = Math.max(worst, Math.abs(err));
      }
      curve.push({ angle, year: tag, exact, within1, worst, n: days.length });
    }
  }
  out[`frozenMarginRidge_${which}`] = curve;
  const peak = (tag) => curve.filter((c) => c.year === tag).sort((x, y) => y.exact - x.exact || x.worst - y.worst)[0];
  console.log(`frozen-margin ridge ${which}: 1447 peak ${peak('1447').angle} (${peak('1447').exact}/${peak('1447').n}), 1448 peak ${peak('1448').angle} (${peak('1448').exact}/${peak('1448').n})`);
}

// C. copy test: same Hijri month-day one Hijri year apart
const cmp = {};
for (const m of Object.keys(months47)) {
  const a = months47[m];
  const b = months48[m];
  const rows = [];
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const rawsA = rawSeries(a[i], RECIPE_1448);
    const rawsB = rawSeries(b[i], RECIPE_1448);
    const row = { hijriDay: i + 1, d47: a[i].date, d48: b[i].date };
    for (const p of PRAYERS) {
      row[p] = { printed: b[i].obs[p] - a[i].obs[p], predicted: +(rawsB[p] - rawsA[p]).toFixed(2) };
    }
    rows.push(row);
  }
  cmp[m] = rows;
}
out.copyTest = cmp;
for (const m of Object.keys(cmp)) {
  const rows = cmp[m];
  const stat = {};
  for (const p of PRAYERS) {
    const printed = rows.map((r) => r[p].printed);
    const pred = rows.map((r) => r[p].predicted);
    const resid = printed.map((x, i) => x - pred[i]);
    const mean = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);
    stat[p] = {
      printedMean: mean(printed),
      printedMin: Math.min(...printed),
      printedMax: Math.max(...printed),
      predictedMean: mean(pred),
      residMean: mean(resid),
      residMaxAbs: +Math.max(...resid.map(Math.abs)).toFixed(2),
      identicalCells: printed.filter((x) => x === 0).length,
    };
  }
  out.copyTestSummary ??= {};
  out.copyTestSummary[m] = { n: rows.length, stat };
  console.log(`\ncopy test ${m} (n=${rows.length}):`);
  for (const p of PRAYERS) {
    const s = stat[p];
    console.log(`  ${p.padEnd(8)} printed ${s.printedMin}..${s.printedMax} (mean ${s.printedMean}) | adhan ${s.predictedMean} | resid mean ${s.residMean} max ${s.residMaxAbs} | identical ${s.identicalCells}/${rows.length}`);
  }
}

// D. does the 1447 free (constrained) recipe transfer to 1448?
const c47f = out.constrained1447_fajr[0];
const c47i = out.constrained1447_isha[0];
const p47 = { fajrAngle: c47f.angle, ishaAngle: c47i.angle };
const margins47 = {
  fajr: { margin: c47f.margin, mode: c47f.mode },
  isha: { margin: c47i.margin, mode: c47i.mode },
};
for (const p of ['sunrise', 'dhuhr', 'asr', 'magrib']) {
  const raws = days47.map((d) => rawSeries(d, p47)[p]);
  const best = bestMargin(raws, days47.map((d) => d.obs[p]), [0, 15]);
  margins47[p] = { margin: best.margin, mode: best.mode };
}
out.recipe1447 = { ...p47, per: margins47 };
const scoreWith = (days, params, margins) => {
  let exact = 0;
  let within1 = 0;
  let worst = 0;
  for (const d of days) {
    const raw = rawSeries(d, params);
    for (const p of PRAYERS) {
      const err = MODES[margins[p].mode](raw[p] + margins[p].margin) - d.obs[p];
      if (err === 0) exact++;
      if (Math.abs(err) <= 1) within1++;
      worst = Math.max(worst, Math.abs(err));
    }
  }
  return { exact, within1, worst, n: days.length * PRAYERS.length };
};
out.transfer1447to1448 = scoreWith(days48, p47, margins47);
out.transfer1448to1447 = scoreWith(days47, RECIPE_1448, RECIPE_1448.per);
console.log('\n1447 recipe -> 1448:', JSON.stringify(out.transfer1447to1448));
console.log('1448 recipe -> 1447:', JSON.stringify(out.transfer1448to1447));
console.log('1447 recipe:', JSON.stringify({ fajr: p47.fajrAngle, isha: p47.ishaAngle, per: Object.fromEntries(PRAYERS.map((p) => [p, `${margins47[p].margin}/${margins47[p].mode}`])) }));

writeFileSync('dz-between-year.json', JSON.stringify(out, null, 1));
