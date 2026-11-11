// Census fit discipline: adhan-js 4.4.6 pinned, Rounding.None then explicit
// rounding, one TZ per invocation, no clock reads (every date comes from the data).
import { readFileSync, writeFileSync } from 'node:fs';
import { PrayerTimes, Coordinates, CalculationMethod, Madhab, Rounding, HighLatitudeRule } from '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/lib/esm/Adhan.js';

const ADHAN = '$HOME/athan-gitree/census/adhan-build/node_modules/adhan/package.json';
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'];

const CITIES = {
  dz: {
    country: 'DZ',
    city: 'Algiers',
    lat: 36.7538,
    lon: 3.0588,
    tz: 'Africa/Algiers',
    file: './dz-alger-1448-merged.json',
    rowsPath: ['rows'],
    limits: [
      '119 printed days, 2026-10-12 .. 2027-03-09 (Jumada I, Jumada II, Rajab, Ramadan of 1448)',
      'October-March window only: the summer solstice months are not transcribed, so the annual extremum is unexercised',
      'values read visually from page images (the PDF carries no text layer); a cell may be off by a minute',
    ],
    candidates: [
      { name: 'MWL 18/17', fajrAngle: 18, ishaAngle: 17 },
      { name: 'Egyptian 19.5/17.5', fajrAngle: 19.5, ishaAngle: 17.5 },
      { name: 'Morocco 19/17', fajrAngle: 19, ishaAngle: 17 },
      { name: 'Tunisia 18/18', fajrAngle: 18, ishaAngle: 18 },
      { name: 'record fallback 17.91/17.09', fajrAngle: 17.91, ishaAngle: 17.09 },
    ],
  },
  mr: {
    country: 'MR',
    city: 'Nouakchott',
    lat: 18.0735,
    lon: -15.9582,
    tz: 'Africa/Nouakchott',
    file: '../northafrica2/data/mr-ministry-nouakchott-1446-ramadan.json',
    rowsPath: [],
    limits: [
      '30 Ramadan imsakia days only, 2025-03-01 .. 2025-03-30: a single month, no annual extremum',
      'Ramadan print: the sheet is an imsakia (imsak printed 5 min before fajr), not a year-round calendar',
      'the sheet also prints 12 more cities; only Nouakchott is transcribed',
    ],
    candidates: [
      { name: 'MWL 18/17', fajrAngle: 18, ishaAngle: 17 },
      { name: 'Egyptian 19.5/17.5', fajrAngle: 19.5, ishaAngle: 17.5 },
      { name: 'corpus 19.37/17.46', fajrAngle: 19.37, ishaAngle: 17.46 },
      { name: 'Morocco 19/17', fajrAngle: 19, ishaAngle: 17 },
    ],
  },
  tg: {
    country: 'TG',
    city: 'Sokode',
    lat: 8.970919667098,
    lon: 1.1726188659668,
    tz: 'Africa/Lome',
    file: '../sahel2/data/togo-sokode-al-farouk-mawaqit-2026.json',
    rowsPath: ['rows'],
    limits: [
      '365 days of 2026, community tier (Mawaqit mosque-platform table, not a state body)',
      'coordinates are the mosque page\'s own, which sit 1.6 km from the town point',
    ],
    candidates: [
      { name: 'MWL 18/17', fajrAngle: 18, ishaAngle: 17 },
      { name: 'ISNA 15/15', fajrAngle: 15, ishaAngle: 15 },
      { name: 'Egyptian 19.5/17.5', fajrAngle: 19.5, ishaAngle: 17.5 },
    ],
  },
  bj: {
    country: 'BJ',
    city: 'Cotonou',
    lat: 6.41612489208,
    lon: 2.1211123466492,
    tz: 'Africa/Porto-Novo',
    file: '../sahel2/data/benin-cotonou-omar-el-farooq-mawaqit-2026.json',
    rowsPath: ['rows'],
    limits: [
      '365 days of 2026, community tier (Mawaqit mosque-platform table, not a state body)',
      'coordinates are the mosque page\'s own (Gakpe), east of the Cotonou point',
    ],
    candidates: [
      { name: 'MWL 18/17', fajrAngle: 18, ishaAngle: 17 },
      { name: 'ISNA 15/15', fajrAngle: 15, ishaAngle: 15 },
      { name: 'Egyptian 19.5/17.5', fajrAngle: 19.5, ishaAngle: 17.5 },
    ],
  },
};

const MODES = { nearest: Math.round, floor: Math.floor, ceil: Math.ceil };
const MARGIN_LIMIT = 15;
const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

function loadRows(cfg) {
  const doc = JSON.parse(readFileSync(cfg.file, 'utf8'));
  let rows = doc;
  for (const k of cfg.rowsPath) rows = rows[k];
  return Object.entries(rows)
    .map(([date, r]) => ({ date, obs: r }))
    .filter(({ obs }) => obs && obs.fajr && obs.sunrise && obs.dhuhr && obs.asr && (obs.magrib || obs.maghrib) && obs.isha)
    .map(({ date, obs }) => ({
      date,
      obs: {
        fajr: toMin(obs.fajr),
        sunrise: toMin(obs.sunrise),
        dhuhr: toMin(obs.dhuhr),
        asr: toMin(obs.asr),
        magrib: toMin(obs.magrib ?? obs.maghrib),
        isha: toMin(obs.isha),
      },
      imsak: obs.imsak ? toMin(obs.imsak) : null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function rawSeries(day, cfg, { fajrAngle, ishaAngle, madhab }) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = madhab;
  p.rounding = Rounding.None;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  const c = new Coordinates(cfg.lat, cfg.lon);
  const [y, m, d] = day.date.split('-').map(Number);
  const t = new PrayerTimes(c, new Date(y, m - 1, d), p);
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

function stats(raws, obsList, margin, mode) {
  const f = MODES[mode];
  let exact = 0;
  let within1 = 0;
  let worst = 0;
  let sum = 0;
  const misses = [];
  for (let i = 0; i < raws.length; i++) {
    const got = f(raws[i] + margin);
    const err = got - obsList[i];
    if (err === 0) exact++;
    if (Math.abs(err) <= 1) within1++;
    worst = Math.max(worst, Math.abs(err));
    sum += Math.abs(err);
    if (Math.abs(err) > 1) misses.push({ date: obsList[i].date, err });
  }
  return { margin, mode, exact, within1, worst, mae: +(sum / raws.length).toFixed(3), n: raws.length, misses: misses.slice(0, 5) };
}

function bestFor(raws, obsList, { marginRange = [-MARGIN_LIMIT, MARGIN_LIMIT], modes = ['nearest', 'floor', 'ceil'] } = {}) {
  let best = null;
  const all = [];
  for (const mode of modes) {
    for (let m = marginRange[0]; m <= marginRange[1]; m++) {
      const s = stats(raws, obsList, m, mode);
      all.push(s);
      if (
        !best ||
        s.worst < best.worst ||
        (s.worst === best.worst && s.mae < best.mae) ||
        (s.worst === best.worst && s.mae === best.mae && s.exact > best.exact)
      ) {
        best = s;
      }
    }
  }
  return { best, all };
}

function scoreRecipe(days, cfg, params) {
  const raws = days.map((d) => rawSeries(d, cfg, params));
  const out = {};
  for (const p of PRAYERS) {
    const obsList = days.map((d) => d.obs[p]);
    out[p] = bestFor(raws.map((r) => r[p]), obsList);
  }
  const per = Object.fromEntries(PRAYERS.map((p) => [p, out[p].best]));
  const totals = PRAYERS.reduce(
    (a, p) => ({
      exact: a.exact + per[p].exact,
      within1: a.within1 + per[p].within1,
      n: a.n + per[p].n,
      worst: Math.max(a.worst, per[p].worst),
      maeSum: a.maeSum + per[p].mae * per[p].n,
    }),
    { exact: 0, within1: 0, n: 0, worst: 0, maeSum: 0 },
  );
  return {
    fajrAngle: params.fajrAngle,
    ishaAngle: params.ishaAngle,
    madhab: params.madhab,
    perPrayer: per,
    totals: {
      ...totals,
      mae: +(totals.maeSum / totals.n).toFixed(3),
      exactPct: +((100 * totals.exact) / totals.n).toFixed(1),
      within1Pct: +((100 * totals.within1) / totals.n).toFixed(1),
    },
  };
}

function scanAngles(days, cfg, madhab, which, step = 0.05) {
  const grid = which === 'fajr' ? [15, 21] : [14, 21];
  const results = [];
  for (let a = grid[0]; a <= grid[1] + 1e-9; a += step) {
    const angle = +a.toFixed(2);
    const params = {
      fajrAngle: which === 'fajr' ? angle : 18,
      ishaAngle: which === 'isha' ? angle : 17,
      madhab,
    };
    const raws = days.map((d) => rawSeries(d, cfg, params)[which]);
    const obsList = days.map((d) => d.obs[which]);
    const { best } = bestFor(raws, obsList);
    results.push({ angle, ...best, boundHit: Math.abs(best.margin) === MARGIN_LIMIT });
  }
  results.sort((x, y) => x.worst - y.worst || x.mae - y.mae || y.exact - x.exact);
  return results;
}

function refineAngle(days, cfg, madhab, which, center) {
  const results = [];
  for (let a = center - 0.15; a <= center + 0.15 + 1e-9; a += 0.01) {
    const angle = +a.toFixed(2);
    const params = {
      fajrAngle: which === 'fajr' ? angle : 18,
      ishaAngle: which === 'isha' ? angle : 17,
      madhab,
    };
    const raws = days.map((d) => rawSeries(d, cfg, params)[which]);
    const obsList = days.map((d) => d.obs[which]);
    const { best } = bestFor(raws, obsList);
    results.push({ angle, ...best, boundHit: Math.abs(best.margin) === MARGIN_LIMIT });
  }
  results.sort((x, y) => x.worst - y.worst || x.mae - y.mae || y.exact - x.exact);
  return results;
}

function scanConstrained(days, cfg, madhab, which, range) {
  // The printed sheets only ever run at or after the astronomical time: margins
  // are safety additions, so a negative margin is treated as implausible.
  const grid = which === 'fajr' ? [15, 21] : [14, 21];
  const results = [];
  for (let a = grid[0]; a <= grid[1] + 1e-9; a += 0.05) {
    const angle = +a.toFixed(2);
    const params = { fajrAngle: which === 'fajr' ? angle : 18, ishaAngle: which === 'isha' ? angle : 17, madhab };
    const raws = days.map((d) => rawSeries(d, cfg, params)[which]);
    const obsList = days.map((d) => d.obs[which]);
    const { best } = bestFor(raws, obsList, { marginRange: range });
    results.push({ angle, ...best });
  }
  results.sort((x, y) => y.exact - x.exact || x.worst - y.worst || x.mae - y.mae);
  return results;
}

function monthlyResidual(days, cfg, recipe) {
  const byMonth = {};
  for (const d of days) {
    const raw = rawSeries(d, cfg, recipe);
    const k = d.date.slice(0, 7);
    byMonth[k] ??= { n: 0 };
    for (const p of PRAYERS) {
      const s = recipe.perPrayer ? recipe.perPrayer[p] : { margin: 0 };
      const err = MODES[(recipe.perPrayer ? s.mode : 'nearest')](raw[p] + s.margin) - d.obs[p];
      byMonth[k][p] = (byMonth[k][p] ?? 0) + err;
    }
    byMonth[k].n++;
  }
  return Object.fromEntries(
    Object.entries(byMonth).map(([k, v]) => [k, Object.fromEntries(PRAYERS.map((p) => [p, +(v[p] / v.n).toFixed(2)]))]),
  );
}

function zeroMargin(days, cfg, c) {
  const raws = days.map((d) => rawSeries(d, cfg, { ...c, madhab: Madhab.Shafi }));
  const per = {};
  for (const p of PRAYERS) {
    per[p] = stats(raws.map((r) => r[p]), days.map((d) => d.obs[p]), 0, 'nearest');
  }
  const totals = PRAYERS.reduce(
    (a, p) => ({
      exact: a.exact + per[p].exact,
      within1: a.within1 + per[p].within1,
      n: a.n + per[p].n,
      worst: Math.max(a.worst, per[p].worst),
      maeSum: a.maeSum + per[p].mae * per[p].n,
    }),
    { exact: 0, within1: 0, n: 0, worst: 0, maeSum: 0 },
  );
  return {
    fajrAngle: c.fajrAngle,
    ishaAngle: c.ishaAngle,
    perPrayer: per,
    totals: { ...totals, mae: +(totals.maeSum / totals.n).toFixed(3), exactPct: +((100 * totals.exact) / totals.n).toFixed(1), within1Pct: +((100 * totals.within1) / totals.n).toFixed(1) },
  };
}

const key = process.argv[2];
const cfg = CITIES[key];
if (!cfg) {
  console.error('usage: node fit.js <dz|mr|tg|bj>');
  process.exit(2);
}
if (process.env.FIT_LAT) cfg.lat = Number(process.env.FIT_LAT);
if (process.env.FIT_LON) cfg.lon = Number(process.env.FIT_LON);
if (process.env.FIT_OUT) cfg.outSuffix = process.env.FIT_OUT;

const days = loadRows(cfg);
const free = {};

for (const school of [Madhab.Shafi, Madhab.Hanafi]) {
  const fajrScan = scanAngles(days, cfg, school, 'fajr');
  const ishaScan = scanAngles(days, cfg, school, 'isha');
  const fajrFine = refineAngle(days, cfg, school, 'fajr', fajrScan[0].angle);
  const ishaFine = refineAngle(days, cfg, school, 'isha', ishaScan[0].angle);
  const recipe = scoreRecipe(days, cfg, { fajrAngle: fajrFine[0].angle, ishaAngle: ishaFine[0].angle, madhab: school });
  free[school] = {
    fajrScanTop: fajrScan.slice(0, 10),
    ishaScanTop: ishaScan.slice(0, 10),
    fajrRefinedTop: fajrFine.slice(0, 10),
    ishaRefinedTop: ishaFine.slice(0, 10),
    ridge: {
      fajr: scanAngles(days, cfg, school, 'fajr', 0.25).map((r) => ({
        angle: r.angle, margin: r.margin, mode: r.mode, exact: r.exact, within1: r.within1, worst: r.worst, mae: r.mae,
      })),
      isha: scanAngles(days, cfg, school, 'isha', 0.25).map((r) => ({
        angle: r.angle, margin: r.margin, mode: r.mode, exact: r.exact, within1: r.within1, worst: r.worst, mae: r.mae,
      })),
    },
    constrained: {
      range: [0, 5],
      fajrTop: scanConstrained(days, cfg, school, 'fajr', [0, 5]).slice(0, 10),
      ishaTop: scanConstrained(days, cfg, school, 'isha', [0, 5]).slice(0, 10),
      recipe: scoreRecipe(days, cfg, {
        fajrAngle: scanConstrained(days, cfg, school, 'fajr', [0, 5])[0].angle,
        ishaAngle: scanConstrained(days, cfg, school, 'isha', [0, 5])[0].angle,
        madhab: school,
      }),
    },
    recipe,
  };
}

const candidates = cfg.candidates.map((c) => {
  const scored = [Madhab.Shafi, Madhab.Hanafi].map((school) => scoreRecipe(days, cfg, { ...c, madhab: school }));
  scored.sort((a, b) => a.totals.worst - b.totals.worst || a.totals.mae - b.totals.mae || b.totals.exact - a.totals.exact);
  return { name: c.name, best: scored[0], zeroMargin: zeroMargin(days, cfg, c) };
});

const usable = Object.entries(free).map(([, v]) => v.recipe);
usable.sort((a, b) => a.totals.worst - b.totals.worst || a.totals.mae - b.totals.mae || b.totals.exact - a.totals.exact);

const out = {
  _meta: {
    country: cfg.country,
    city: cfg.city,
    latitude: cfg.lat,
    longitude: cfg.lon,
    timezone: cfg.tz,
    engine: `adhan-js ${JSON.parse(readFileSync(ADHAN, 'utf8')).version}`,
    engine_path: '$HOME/athan-gitree/census/adhan-build/node_modules/adhan',
    mode: 'Rounding.None everywhere, then per-prayer integer margin and rounding applied in the comparison',
    marginSearch: `-${MARGIN_LIMIT}..+${MARGIN_LIMIT} minutes, integer; a margin of magnitude ${MARGIN_LIMIT} means the search bound was hit`,
    days: days.length,
    window: [days[0].date, days[days.length - 1].date],
    fitted_at: '2026-11-10 (no clock read: every date comes from the data)',
    limits: cfg.limits,
    reading:
      'margins are minutes added to the raw computed time before the printed rounding; exact/within1/worst are per-prayer day counts; zeroMargin is the recipe as published with no margin and nearest rounding',
  },
  best: Object.values(free)[0].constrained.recipe,
  bestUnconstrained: usable[0],
  freeFit: free,
  candidates,
  monthlyResidualOfBest: monthlyResidual(days, cfg, usable[0]),
};

if (days[0].imsak !== null) {
  const raws = days.map((d) => rawSeries(d, cfg, usable[0]));
  out.imsakCheck = bestFor(raws.map((r) => r.fajr), days.map((d) => d.imsak)).best;
}

writeFileSync(`./${key}${cfg.outSuffix ?? ''}-fit.json`, JSON.stringify(out, null, 1) + '\n');
console.log(`${cfg.country} ${cfg.city} (${cfg.lat}, ${cfg.lon}): ${days.length} days ${days[0].date}..${days[days.length - 1].date}`);
console.log('best (margins 0..+5)', JSON.stringify({ fajrAngle: out.best.fajrAngle, ishaAngle: out.best.ishaAngle, totals: out.best.totals }));
console.log('best unconstrained', JSON.stringify({ fajrAngle: out.bestUnconstrained.fajrAngle, ishaAngle: out.bestUnconstrained.ishaAngle, totals: out.bestUnconstrained.totals }));
for (const p of PRAYERS) {
  const s = out.best.perPrayer[p];
  console.log(` ${p.padEnd(8)} margin ${String(s.margin).padStart(3)} ${s.mode.padEnd(7)} exact ${s.exact}/${s.n} within1 ${s.within1}/${s.n} worst ${s.worst} mae ${s.mae}`);
}
for (const c of candidates) {
  console.log(` ${c.name.padEnd(28)} ${c.best.madhab.padEnd(6)} tuned: exact ${c.best.totals.exact}/${c.best.totals.n} within1 ${c.best.totals.within1} worst ${c.best.totals.worst} mae ${c.best.totals.mae}`);
  console.log(` ${''.padEnd(28)} zero-margin: exact ${c.zeroMargin.totals.exact}/${c.zeroMargin.totals.n} within1 ${c.zeroMargin.totals.within1} worst ${c.zeroMargin.totals.worst} mae ${c.zeroMargin.totals.mae}`);
}
