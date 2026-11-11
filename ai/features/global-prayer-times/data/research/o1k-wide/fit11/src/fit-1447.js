// Between-year test: does the 1448 Alger recipe hold on 1447, and does a free
// 1447 fit land on the same parameters? adhan-js 4.4.6, Rounding.None then an
// explicit integer margin, one TZ per invocation, no clock read.
import { readFileSync, writeFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding, HighLatitudeRule } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];
const MODES = { nearest: Math.round, floor: Math.floor, ceil: Math.ceil };
const ALGER = { lat: 36.7538, lon: 3.0588, tz: 'Africa/Algiers' };
const ADRAR = { lat: 27.8743, lon: -0.2939, tz: 'Africa/Algiers' };

// fit2's 1448 recipe, frozen verbatim.
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
const pad = (n) => String(n).padStart(2, '0');
const hhmm = (m) => `${pad(Math.floor(m / 60))}:${pad(((m % 60) + 60) % 60)}`;

function loadRows(files) {
  const rows = {};
  for (const f of files) {
    const doc = JSON.parse(readFileSync(f, 'utf8'));
    for (const [date, r] of Object.entries(doc.rows)) {
      rows[date] = {
        fajr: toMin(r.fajr),
        sunrise: toMin(r.sunrise),
        dhuhr: toMin(r.dhuhr),
        asr: toMin(r.asr),
        magrib: toMin(r.maghrib ?? r.magrib),
        isha: toMin(r.isha),
      };
    }
  }
  return Object.entries(rows)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, obs]) => ({ date, obs }));
}

function rawSeries(day, site, { fajrAngle, ishaAngle, madhab = Madhab.Shafi }) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  const [y, m, d] = day.date.split('-').map(Number);
  const t = new PrayerTimes(new Coordinates(site.lat, site.lon), new Date(y, m - 1, d), p);
  const mins = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
  return {
    fajr: mins(t.fajr),
    sunrise: mins(t.sunrise),
    dhuhr: mins(t.dhuhr),
    asr: mins(t.asr),
    magrib: mins(t.maghrib),
    isha: mins(t.isha),
  };
}

function score(days, site, params, marginMode) {
  const raws = days.map((d) => rawSeries(d, site, params));
  const per = {};
  for (const p of PRAYERS) {
    const { margin, mode } = marginMode[p];
    const f = MODES[mode];
    let exact = 0;
    let within1 = 0;
    let worst = 0;
    let sum = 0;
    const errs = [];
    days.forEach((d, i) => {
      const err = f(raws[i][p] + margin) - d.obs[p];
      errs.push(err);
      if (err === 0) exact++;
      if (Math.abs(err) <= 1) within1++;
      worst = Math.max(worst, Math.abs(err));
      sum += Math.abs(err);
    });
    per[p] = { margin, mode, exact, within1, worst, mae: +(sum / days.length).toFixed(3), n: days.length };
  }
  const tot = PRAYERS.reduce(
    (a, p) => ({ exact: a.exact + per[p].exact, within1: a.within1 + per[p].within1, n: a.n + per[p].n, worst: Math.max(a.worst, per[p].worst) }),
    { exact: 0, within1: 0, n: 0, worst: 0 },
  );
  return { ...tot, exactPct: +((100 * tot.exact) / tot.n).toFixed(1), within1Pct: +((100 * tot.within1) / tot.n).toFixed(1), per };
}

function bestMargin(raws, obsList, marginRange = [-15, 15]) {
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
      const s = { margin: m, mode, exact, within1, worst, mae: +(sum / raws.length).toFixed(3), n: raws.length };
      if (!best || s.worst < best.worst || (s.worst === best.worst && s.mae < best.mae) || (s.worst === best.worst && s.mae === best.mae && s.exact > best.exact)) best = s;
    }
  }
  return best;
}

function fitAngle(days, site, which, madhab, step, center) {
  const grid = which === 'fajr' ? [15, 21] : [14, 21];
  const lo = center == null ? grid[0] : center - 0.15;
  const hi = center == null ? grid[1] : center + 0.15;
  const out = [];
  for (let a = lo; a <= hi + 1e-9; a += step) {
    const angle = +a.toFixed(2);
    const params = { fajrAngle: which === 'fajr' ? angle : 18, ishaAngle: which === 'isha' ? angle : 17, madhab };
    const raws = days.map((d) => rawSeries(d, site, params)[which]);
    const obsList = days.map((d) => d.obs[which]);
    out.push({ angle, ...bestMargin(raws, obsList), boundHit: Math.abs(bestMargin(raws, obsList).margin) === 15 });
  }
  return out.sort((x, y) => x.worst - y.worst || x.mae - y.mae || y.exact - x.exact);
}

// --- data -------------------------------------------------------------
const days47 = loadRows([
  'dz-alger-1447-jumada1.json',
  'dz-alger-1447-jumada2.json',
  'dz-alger-1447-rajab.json',
  'dz-alger-1447-ramadan.json',
]);
const days48 = loadRows(['../fit2/dz-alger-1448-merged.json']);
const adrar47 = loadRows(['dz-adrar-1447-jumada1.json']);

const out = { meta: { engine: 'adhan-js 4.4.6', site: ALGER, tz: process.env.TZ } };

// 1. frozen recipe, both years
out.frozen1448On1447 = score(days47, ALGER, RECIPE_1448, RECIPE_1448.per);
out.frozen1448On1448 = score(days48, ALGER, RECIPE_1448, RECIPE_1448.per);

// 2. frozen angles, margins refitted on 1447 (separates angle drift from margin drift)
out.frozenAnglesFreeMargins1447 = score(days47, ALGER, RECIPE_1448, {
  fajr: bestMargin(days47.map((d) => rawSeries(d, ALGER, RECIPE_1448).fajr), days47.map((d) => d.obs.fajr)),
  sunrise: bestMargin(days47.map((d) => rawSeries(d, ALGER, RECIPE_1448).sunrise), days47.map((d) => d.obs.sunrise)),
  dhuhr: bestMargin(days47.map((d) => rawSeries(d, ALGER, RECIPE_1448).dhuhr), days47.map((d) => d.obs.dhuhr)),
  asr: bestMargin(days47.map((d) => rawSeries(d, ALGER, RECIPE_1448).asr), days47.map((d) => d.obs.asr)),
  magrib: bestMargin(days47.map((d) => rawSeries(d, ALGER, RECIPE_1448).magrib), days47.map((d) => d.obs.magrib)),
  isha: bestMargin(days47.map((d) => rawSeries(d, ALGER, RECIPE_1448).isha), days47.map((d) => d.obs.isha)),
});

// 3. free fit on 1447
const free = {};
for (const school of [Madhab.Shafi, Madhab.Hanafi]) {
  const fScan = fitAngle(days47, ALGER, 'fajr', school, 0.05);
  const iScan = fitAngle(days47, ALGER, 'isha', school, 0.05);
  const fFine = fitAngle(days47, ALGER, 'fajr', school, 0.01, fScan[0].angle);
  const iFine = fitAngle(days47, ALGER, 'isha', school, 0.01, iScan[0].angle);
  const params = { fajrAngle: fFine[0].angle, ishaAngle: iFine[0].angle, madhab: school };
  const margins = {
    fajr: bestMargin(days47.map((d) => rawSeries(d, ALGER, params).fajr), days47.map((d) => d.obs.fajr)),
    sunrise: bestMargin(days47.map((d) => rawSeries(d, ALGER, params).sunrise), days47.map((d) => d.obs.sunrise)),
    dhuhr: bestMargin(days47.map((d) => rawSeries(d, ALGER, params).dhuhr), days47.map((d) => d.obs.dhuhr)),
    asr: bestMargin(days47.map((d) => rawSeries(d, ALGER, params).asr), days47.map((d) => d.obs.asr)),
    magrib: bestMargin(days47.map((d) => rawSeries(d, ALGER, params).magrib), days47.map((d) => d.obs.magrib)),
    isha: bestMargin(days47.map((d) => rawSeries(d, ALGER, params).isha), days47.map((d) => d.obs.isha)),
  };
  free[school === Madhab.Shafi ? 'shafi' : 'hanafi'] = {
    fajrFine: fFine.slice(0, 6),
    ishaFine: iFine.slice(0, 6),
    fajrScanTop: fScan.slice(0, 6).map((r) => ({ angle: r.angle, margin: r.margin, mode: r.mode, exact: r.exact, worst: r.worst })),
    ishaScanTop: iScan.slice(0, 6).map((r) => ({ angle: r.angle, margin: r.margin, mode: r.mode, exact: r.exact, worst: r.worst })),
    recipe: { ...params, per: margins },
    scored: score(days47, ALGER, params, margins),
  };
}
out.free1447 = free;

// 4. per-month breakdown of the frozen recipe
const byMonth = {};
for (const d of days47) {
  const k = d.date.slice(0, 7);
  (byMonth[k] ??= []).push(d);
}
out.frozenByMonth = Object.fromEntries(
  Object.entries(byMonth).map(([k, ds]) => {
    const s = score(ds, ALGER, RECIPE_1448, RECIPE_1448.per);
    return [k, { per: s.per, totals: { exact: s.exact, within1: s.within1, n: s.n, worst: s.worst } }];
  }),
);

// 5. signed residual of the frozen recipe, per prayer and per month
const resid = {};
for (const d of days47) {
  const raw = rawSeries(d, ALGER, RECIPE_1448);
  const k = d.date.slice(0, 7);
  resid[k] ??= {};
  for (const p of PRAYERS) {
    const err = MODES[RECIPE_1448.per[p].mode](raw[p] + RECIPE_1448.per[p].margin) - d.obs[p];
    (resid[k][p] ??= []).push(err);
  }
}
out.frozenSignedResidual = Object.fromEntries(
  Object.entries(resid).map(([k, v]) => [
    k,
    Object.fromEntries(PRAYERS.map((p) => {
      const a = v[p];
      const mean = a.reduce((x, y) => x + y, 0) / a.length;
      return [p, { mean: +mean.toFixed(2), min: Math.min(...a), max: Math.max(...a) }];
    })),
  ]),
);

writeFileSync('dz-fit-1447.json', JSON.stringify(out, null, 1));

// --- console summary --------------------------------------------------
const line = (name, s) =>
  `${name}: exact ${s.exact}/${s.n} (${s.exactPct}%), within1 ${s.within1}/${s.n} (${s.within1Pct}%), worst ${s.worst}`;
console.log('FROZEN 1448 recipe on 1447 :', line('1447', out.frozen1448On1447));
console.log('FROZEN 1448 recipe on 1448 :', line('1448', out.frozen1448On1448));
console.log('1447, angles frozen, margins refit :', line('1447', out.frozenAnglesFreeMargins1447));
for (const p of PRAYERS) {
  const a = out.frozen1448On1447.per[p];
  const b = out.frozen1448On1448.per[p];
  console.log(`  ${p.padEnd(8)} 1447 ${a.exact}/${a.n} w1 ${a.within1} worst ${a.worst} | 1448 ${b.exact}/${b.n} w1 ${b.within1} worst ${b.worst}`);
}
console.log('\nFREE 1447 shafi :', line('sf', free.shafi.scored));
console.log('  recipe', JSON.stringify({ fajrAngle: free.shafi.recipe.fajrAngle, ishaAngle: free.shafi.recipe.ishaAngle, per: Object.fromEntries(PRAYERS.map((p) => [p, `${free.shafi.recipe.per[p].margin}/${free.shafi.recipe.per[p].mode}`])) }));
console.log('FREE 1447 hanafi :', line('hn', free.hanafi.scored));
console.log('\nFrozen recipe signed residual mean by month:');
for (const [k, v] of Object.entries(out.frozenSignedResidual)) {
  console.log(' ', k, PRAYERS.map((p) => `${p} ${v[p].mean}`).join('  '));
}
