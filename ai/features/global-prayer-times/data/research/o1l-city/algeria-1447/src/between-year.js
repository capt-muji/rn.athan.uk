// Between-year test extended to the summer corner: 1447 against 1448 on the same Hijri cells,
// and the frozen recipe applied to the two 1448 months transcribed this session.
import { readFileSync, writeFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding, HighLatitudeRule } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const HOME = process.env.HOME;
const ROOT = `${HOME}/athan-gitree/census/o1l-city/algeria-1447`;
const FIT2 = `${HOME}/athan-gitree/census/o1k-wide/fit2`;
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const SITE = { name: 'Alger', lat: 36.7538, lon: 3.0588 };
const RECIPE = {
  fajrAngle: 17.8,
  ishaAngle: 16.1,
  madhab: Madhab.Shafi,
  per: { fajr: { margin: 0, mode: 'floor' }, sunrise: { margin: 1, mode: 'floor' }, dhuhr: { margin: 1, mode: 'floor' }, asr: { margin: 1, mode: 'floor' }, magrib: { margin: 4, mode: 'floor' }, isha: { margin: 5, mode: 'nearest' } },
};
// the isha parameterisation the full-year three-book fit prefers (same printed curve, no margin degeneracy)
const RECIPE_ISHA17 = { ...RECIPE, ishaAngle: 17.0, per: { ...RECIPE.per, isha: { margin: 0, mode: 'ceil' } } };
const MODES = { nearest: Math.round, floor: Math.floor, ceil: Math.ceil };
const toMin = (s) => (s.includes(':') ? Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5)) : Number(s.slice(0, 2)) * 60 + Number(s.slice(2)));

function load1447() {
  const doc = JSON.parse(readFileSync(`${ROOT}/data/dz47-1447-all.json`, 'utf8'));
  const rows = {};
  for (const [m, month] of Object.entries(doc.months)) for (const [date, r] of Object.entries(month.rows)) rows[date] = { m: Number(m), obs: Object.fromEntries(PRAYERS.map((p) => [p, toMin(r[p === 'magrib' ? 'maghrib' : p])])) };
  return rows;
}

function load1448() {
  const rows = {};
  for (const [m, file] of [[5, 'dz-alger-1448-jumada1.json'], [6, 'dz-alger-1448-jumada2.json'], [7, 'dz-alger-1448-rajab.json'], [9, 'dz-alger-1448-ramadan.json']]) {
    const doc = JSON.parse(readFileSync(`${FIT2}/${file}`, 'utf8'));
    for (const [date, r] of Object.entries(doc.rows)) rows[date] = { m, obs: Object.fromEntries(PRAYERS.map((p) => [p, toMin(r[p === 'magrib' ? 'magrib' : p])])) };
  }
  for (const [m, file] of [[1, 'dz48-01.tsv'], [11, 'dz48-11.tsv']]) {
    for (const line of readFileSync(`${ROOT}/src/tsv/${file}`, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const p = t.split(/\s+/);
      const cols = ['fajr', 'sunrise', 'qibla', 'dhuhr', 'asr', 'magrib', 'isha'];
      rows[p[0]] = { m, obs: Object.fromEntries(PRAYERS.map((q) => [q, toMin(p[cols.indexOf(q) + 1])])) };
    }
  }
  return rows;
}

function raw(day, params = RECIPE) {
  const p = CalculationMethod.Other();
  p.fajrAngle = params.fajrAngle;
  p.ishaAngle = params.ishaAngle;
  p.madhab = params.madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  const [y, m, d] = day.split('-').map(Number);
  const t = new PrayerTimes(new Coordinates(SITE.lat, SITE.lon), new Date(y, m - 1, d), p);
  const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  return { fajr: mins(t.fajr), sunrise: mins(t.sunrise), dhuhr: mins(t.dhuhr), asr: mins(t.asr), magrib: mins(t.maghrib), isha: mins(t.isha) };
}

function score(rows, params) {
  const per = {};
  for (const p of PRAYERS) {
    const { margin, mode } = params.per[p];
    let exact = 0, within1 = 0, worst = 0, n = 0;
    for (const [date, r] of Object.entries(rows)) {
      const err = MODES[mode](raw(date, params)[p] + margin) - r.obs[p];
      n++;
      if (err === 0) exact++;
      if (Math.abs(err) <= 1) within1++;
      worst = Math.max(worst, Math.abs(err));
    }
    per[p] = { exact, within1, worst, n };
  }
  const tot = PRAYERS.reduce((a, p) => ({ exact: a.exact + per[p].exact, within1: a.within1 + per[p].within1, n: a.n + per[p].n, worst: Math.max(a.worst, per[p].worst) }), { exact: 0, within1: 0, n: 0, worst: 0 });
  return { ...tot, exactPct: +((100 * tot.exact) / tot.n).toFixed(1), per };
}

const r47 = load1447();
const r48 = load1448();
const out = { meta: { engine: 'adhan-js 4.4.6', site: SITE, tz: process.env.TZ } };

out.holdout1448 = {
  months: [...new Set(Object.values(r48).map((r) => r.m))].sort((a, b) => a - b),
  days: Object.keys(r48).length,
  frozen: score(r48, RECIPE),
  isha17: score(r48, RECIPE_ISHA17),
};
const h1 = Object.fromEntries(Object.entries(r48).filter(([, r]) => r.m === 1));
const h11 = Object.fromEntries(Object.entries(r48).filter(([, r]) => r.m === 11));
out.holdout1448.month1 = { days: Object.keys(h1).length, frozen: score(h1, RECIPE) };
out.holdout1448.month11 = { days: Object.keys(h11).length, frozen: score(h11, RECIPE) };

// same Hijri cell, one Hijri year apart: index both years by month-day
function byHijriCell(rows) {
  const months = {};
  for (const [date, r] of Object.entries(rows)) (months[r.m] ??= []).push(date);
  const out = {};
  for (const [m, dates] of Object.entries(months)) {
    dates.sort();
    dates.forEach((date, i) => (out[`${m}-${i + 1}`] = { date, obs: rows[date].obs }));
  }
  return out;
}
const cell47 = byHijriCell(r47);
const cell48 = byHijriCell(r48);
const drift = {};
for (const [cell, a] of Object.entries(cell47)) {
  const b = cell48[cell];
  if (!b) continue;
  const m = Number(cell.split('-')[0]);
  const gapDays = (Date.parse(b.date + 'T00:00:00Z') - Date.parse(a.date + 'T00:00:00Z')) / 86400000;
  drift[m] ??= { month: m, gapDays, rows: [] };
  const row = { cell, date47: a.date, date48: b.date };
  for (const p of PRAYERS) {
    const printed = b.obs[p] - a.obs[p];
    const modelled = raw(b.date)[p] - raw(a.date)[p];
    row[p] = { printed, modelled, resid: +(printed - modelled).toFixed(2) };
  }
  drift[m].rows.push(row);
}
out.sameCellDrift = Object.fromEntries(
  Object.entries(drift).map(([k, v]) => {
    const sum = {};
    for (const p of PRAYERS) {
      const printed = v.rows.map((r) => r[p].printed);
      const modelled = v.rows.map((r) => r[p].modelled);
      const resid = v.rows.map((r) => r[p].resid);
      const mean = (a) => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);
      sum[p] = { printedMean: mean(printed), modelledMean: mean(modelled), residMean: mean(resid), residMax: +Math.max(...resid.map(Math.abs)).toFixed(2), identicalCells: printed.filter((x) => x === 0).length, n: printed.length };
    }
    return [k, { month: v.month, gapDays: v.gapDays, days: v.rows.length, per: sum }];
  }),
);

writeFileSync(`${ROOT}/data/dz-between-year-full.json`, JSON.stringify(out, null, 1));
const line = (n, s) => `${n}: exact ${s.exact}/${s.n} (${s.exactPct}%), within1 ${s.within1}/${s.n}, worst ${s.worst}`;
console.log('1448 holdout (months ' + out.holdout1448.months.join(',') + ', ' + out.holdout1448.days + ' days)');
console.log('  frozen :', line('frozen', out.holdout1448.frozen));
console.log('  isha17 :', line('isha17', out.holdout1448.isha17));
for (const p of PRAYERS) console.log(`    ${p.padEnd(8)} ${out.holdout1448.frozen.per[p].exact}/${out.holdout1448.frozen.per[p].n} w1 ${out.holdout1448.frozen.per[p].within1} worst ${out.holdout1448.frozen.per[p].worst}`);
console.log('  month1 :', line('m1', out.holdout1448.month1.frozen));
console.log('  month11:', line('m11', out.holdout1448.month11.frozen));
console.log('\nSAME-CELL DRIFT (1447 -> 1448, one Hijri year)');
for (const [k, v] of Object.entries(out.sameCellDrift)) {
  console.log(` month ${v.month} gap ${v.gapDays}d n=${v.days}`);
  for (const p of PRAYERS) {
    const r = v.per[p];
    console.log(`   ${p.padEnd(8)} printed ${r.printedMean} model ${r.modelledMean} resid ${r.residMean} max ${r.residMax} ident ${r.identicalCells}/${r.n}`);
  }
}
