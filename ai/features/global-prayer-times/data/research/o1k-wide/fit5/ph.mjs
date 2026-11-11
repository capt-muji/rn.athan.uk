// Job 1: the Philippines year-round surfaces.
// Davao (Darul Ifta Region XI, 90 rows, 3 poster months) and the BARMM pair
// (Cotabato + Marawi, 29 rows each, Muharram 1448).
// Discipline: second resolution, explicit rounding, margins bounded to +-2 min
// so an angle cannot hide inside an offset, plateaus reported.
import fs from 'node:fs';
import { load, series, bestMargin, scanValue, score, marginsIn, line, PRAYERS } from './lib.mjs';

const ROOT = process.env.HOME + '/athan-gitree/census/o1k-wide/philippines/data/';
const SURFACES = [
  { name: 'davao', file: 'davao-city_darul-ifti-region-xi.json', lat: 7.0711, lon: 125.6125 },
  { name: 'cotabato', file: 'cotabato-city_bdi-muharram1448.json', lat: 7.2047, lon: 124.2310 },
  { name: 'marawi', file: 'marawi-city_bdi-muharram1448.json', lat: 7.9997, lon: 124.2864 },
];
const MODES = ['nearest', 'floor', 'ceil'];

const adhan = await load();
const { CalculationParameters, Madhab } = adhan;

function params({ fajrAngle = 18, ishaAngle = 17, ishaInterval = 0, madhab = Madhab.Shafi }) {
  const p = new CalculationParameters('Other', fajrAngle, ishaAngle, ishaInterval);
  p.madhab = madhab;
  return p;
}

function readRows(file) {
  const raw = JSON.parse(fs.readFileSync(ROOT + file));
  return Object.keys(raw).sort().map((day) => ({
    date: day,
    fajr: raw[day].fajr, sunrise: raw[day].sunrise, dhuhr: raw[day].dhuhr,
    asr: raw[day].asr, maghrib: raw[day].magrib, isha: raw[day].isha,
  }));
}

const angles = [];
for (let a = 100; a <= 200; a++) angles.push(a / 10);

const result = {};

for (const s of SURFACES) {
  const rows = readRows(s.file);
  const dates = rows.map((r) => r.date);
  const coords = { lat: s.lat, lon: s.lon };
  const chart = {};
  for (const p of PRAYERS) chart[p] = rows.map((r) => parseInt(r[p].slice(0, 2), 10) * 60 + parseInt(r[p].slice(3, 5), 10));

  console.log(`\n########## ${s.name}  ${rows.length} rows  ${dates[0]} .. ${dates[dates.length - 1]}  (${s.lat}, ${s.lon})`);

  const perMode = {};
  for (const mode of MODES) {
    const fajr = scanValue(adhan, coords, dates, chart.fajr, 'fajr', angles,
      (a) => params({ fajrAngle: a, ishaAngle: 17 }), { mode, marginBound: 2 });
    const geo = series(adhan, coords, dates, params({ fajrAngle: fajr.best.value, ishaAngle: 17 }));
    const sunrise = bestMargin(geo.sunrise, chart.sunrise, { margins: marginsIn(2), modes: [mode] });
    const dhuhr = bestMargin(geo.dhuhr, chart.dhuhr, { margins: marginsIn(2), modes: [mode] });
    const maghrib = bestMargin(geo.maghrib, chart.maghrib, { margins: marginsIn(2), modes: [mode] });
    const asrShafi = bestMargin(geo.asr, chart.asr, { margins: marginsIn(2), modes: [mode] });
    const asrHanafi = bestMargin(series(adhan, coords, dates, params({ fajrAngle: fajr.best.value, madhab: Madhab.Hanafi })).asr,
      chart.asr, { margins: marginsIn(2), modes: [mode] });
    const ishaAngle = scanValue(adhan, coords, dates, chart.isha, 'isha', angles,
      (a) => params({ fajrAngle: fajr.best.value, ishaAngle: a }), { mode, marginBound: 2 });
    const ivs = [];
    for (let n = 55; n <= 85; n++) ivs.push(n);
    const ishaInterval = scanValue(adhan, coords, dates, chart.isha, 'isha', ivs,
      (n) => params({ fajrAngle: fajr.best.value, ishaAngle: 0, ishaInterval: n }), { mode, marginBound: 2 });

    const useInterval = ishaInterval.best.worst < ishaAngle.best.worst
      || (ishaInterval.best.worst === ishaAngle.best.worst && ishaInterval.best.exact > ishaAngle.best.exact);
    const isha = useInterval ? ishaInterval : ishaAngle;

    const margin = { fajr: fajr.best.margin, sunrise: sunrise.margin, dhuhr: dhuhr.margin, asr: asrShafi.margin, maghrib: maghrib.margin, isha: isha.best.margin };
    const ser = series(adhan, coords, dates, params({
      fajrAngle: fajr.best.value,
      ishaAngle: useInterval ? 0 : ishaAngle.best.value,
      ishaInterval: useInterval ? ishaInterval.best.value : 0,
    }));
    const joint = {};
    let worstAll = 0, exactAll = 0, within1All = 0;
    for (const col of PRAYERS) {
      joint[col] = score(ser[col], chart[col], margin[col], mode);
      worstAll = Math.max(worstAll, joint[col].worst);
      exactAll += joint[col].exact;
      within1All += joint[col].within1;
    }
    perMode[mode] = { mode, fajr, sunrise, dhuhr, maghrib, asrShafi, asrHanafi, ishaAngle, ishaInterval, useInterval, isha, joint, worstAll, exactAll, within1All };
    console.log(`  ${mode.padEnd(8)} worst ${worstAll}  within1 ${within1All}/${rows.length * 6}  exact ${exactAll}/${rows.length * 6}  fajr ${fajr.best.value.toFixed(1)}@${fajr.best.margin >= 0 ? '+' : ''}${fajr.best.margin}  isha ${useInterval ? 'int ' + ishaInterval.best.value : ishaAngle.best.value.toFixed(1) + '@' + isha.best.margin}`);
  }

  // Adopt the mode with no row beyond 1 min, then the most exact rows.
  const chosen = MODES.map((m) => perMode[m])
    .sort((a, b) => b.within1All - a.within1All || b.exactAll - a.exactAll)[0];

  console.log(`  ADOPTED ${chosen.mode}`);
  for (const col of PRAYERS) console.log('   ', line(col, chosen.joint[col]).trim());
  console.log('    fajr angle', chosen.fajr.best.value.toFixed(1), 'plateau', chosen.fajr.plateau.min.toFixed(1), '..', chosen.fajr.plateau.max.toFixed(1));
  const band = (c) => { const v = c.curve.filter((x) => x.worst <= 1).map((x) => x.value); return v.length ? [Math.min(...v), Math.max(...v)] : null; };
  const fajrBand = band(chosen.fajr), ishaAngleBand = band(chosen.ishaAngle), ishaIvBand = band(chosen.ishaInterval);
  const fmtBand = (b) => (b ? b[0].toFixed(1) + '..' + b[1].toFixed(1) : 'none');
  console.log('    fajr band (worst<=1)', fmtBand(fajrBand), '| isha angle band', fmtBand(ishaAngleBand), '| isha interval band', fmtBand(ishaIvBand));
  console.log('    isha angle', chosen.ishaAngle.best.value.toFixed(1), 'plateau', chosen.ishaAngle.plateau.min.toFixed(1), '..', chosen.ishaAngle.plateau.max.toFixed(1));
  console.log('    isha interval', chosen.ishaInterval.best.value, 'plateau', chosen.ishaInterval.plateau.min, '..', chosen.ishaInterval.plateau.max);
  console.log('    isha model', chosen.useInterval ? 'interval' : 'angle');
  console.log('    asr hanafi worst', chosen.asrHanafi.worst);

  const printedIv = rows.map((r, i) => chart.isha[i] - chart.maghrib[i]);
  console.log(`    printed isha-maghrib ${Math.min(...printedIv)}..${Math.max(...printedIv)}`);

  result[s.name] = {
    coords: { lat: s.lat, lon: s.lon },
    rows: rows.length, first: dates[0], last: dates[dates.length - 1],
    mode: chosen.mode,
    fajr: { angle: chosen.fajr.best.value, margin: chosen.fajr.best.margin, exact: chosen.fajr.best.exact, within1: chosen.fajr.best.within1, worst: chosen.fajr.best.worst, plateau: [chosen.fajr.plateau.min, chosen.fajr.plateau.max] },
    sunrise: { margin: chosen.sunrise.margin, exact: chosen.sunrise.exact, within1: chosen.sunrise.within1, worst: chosen.sunrise.worst },
    dhuhr: { margin: chosen.dhuhr.margin, exact: chosen.dhuhr.exact, within1: chosen.dhuhr.within1, worst: chosen.dhuhr.worst },
    asr: { school: 'Shafi', margin: chosen.asrShafi.margin, exact: chosen.asrShafi.exact, within1: chosen.asrShafi.within1, worst: chosen.asrShafi.worst, hanafiWorst: chosen.asrHanafi.worst },
    maghrib: { margin: chosen.maghrib.margin, exact: chosen.maghrib.exact, within1: chosen.maghrib.within1, worst: chosen.maghrib.worst },
    fajrBand: band(chosen.fajr),
    ishaAngleBand: band(chosen.ishaAngle),
    ishaIntervalBand: band(chosen.ishaInterval),
    isha: {
      model: chosen.useInterval ? 'interval' : 'angle',
      angle: chosen.ishaAngle.best.value,
      angleScore: { exact: chosen.ishaAngle.best.exact, within1: chosen.ishaAngle.best.within1, worst: chosen.ishaAngle.best.worst, margin: chosen.ishaAngle.best.margin, plateau: [chosen.ishaAngle.plateau.min, chosen.ishaAngle.plateau.max] },
      interval: chosen.ishaInterval.best.value,
      intervalScore: { exact: chosen.ishaInterval.best.exact, within1: chosen.ishaInterval.best.within1, worst: chosen.ishaInterval.best.worst, margin: chosen.ishaInterval.best.margin, plateau: [chosen.ishaInterval.plateau.min, chosen.ishaInterval.plateau.max] },
      printedIntervalRange: [Math.min(...printedIv), Math.max(...printedIv)],
      margin: chosen.isha.best.margin,
    },
    joint: { worst: chosen.worstAll, exact: chosen.exactAll, within1: chosen.within1All, of: rows.length * 6 },
    byMode: Object.fromEntries(MODES.map((m) => [m, { worst: perMode[m].worstAll, within1: perMode[m].within1All, exact: perMode[m].exactAll }])),
  };
}

fs.writeFileSync('ph-fit.json', JSON.stringify(result, null, 1));

// ---- per-block breakdown and between-year stability ----
console.log('\nPER-BLOCK (adopted recipe) AND BETWEEN-YEAR STABILITY');
function blockScores(s, p, mode, margin, pred) {
  const rows = readRows(s.file).filter(pred);
  if (!rows.length) return null;
  const ser = series(adhan, { lat: s.lat, lon: s.lon }, rows.map((r) => r.date), p);
  const out = { n: rows.length, exact: 0, within1: 0, worst: 0 };
  for (const col of PRAYERS) {
    const chart = rows.map((r) => parseInt(r[col].slice(0, 2), 10) * 60 + parseInt(r[col].slice(3, 5), 10));
    const r = score(ser[col], chart, margin[col], mode);
    out.exact += r.exact; out.within1 += r.within1; out.worst = Math.max(out.worst, r.worst);
  }
  return out;
}
for (const s of SURFACES) {
  const r = result[s.name];
  const p = params({
    fajrAngle: r.fajr.angle,
    ishaAngle: r.isha.model === 'angle' ? r.isha.angle : 0,
    ishaInterval: r.isha.model === 'interval' ? r.isha.interval : 0,
  });
  const margin = { fajr: r.fajr.margin, sunrise: r.sunrise.margin, dhuhr: r.dhuhr.margin, asr: r.asr.margin, maghrib: r.maghrib.margin, isha: r.isha.margin };
  const years = [...new Set(readRows(s.file).map((x) => x.date.slice(0, 4)))];
  const per = {};
  for (const y of years) {
    per[y] = blockScores(s, p, r.mode, margin, (x) => x.date.startsWith(y));
    console.log(`  ${s.name} ${y}: rows ${per[y].n} worst ${per[y].worst} within1 ${per[y].within1}/${per[y].n * 6} exact ${per[y].exact}/${per[y].n * 6}`);
  }
  result[s.name].perYear = per;
}

// Davao: independent fits per calendar year, to read stability.
const davaoOnly = SURFACES[0];
const dvRows = readRows(davaoOnly.file);
for (const y of ['2025', '2026']) {
  const rows = dvRows.filter((r) => r.date.startsWith(y));
  const chart = (col) => rows.map((r) => parseInt(r[col].slice(0, 2), 10) * 60 + parseInt(r[col].slice(3, 5), 10));
  const fa = scanValue(adhan, { lat: davaoOnly.lat, lon: davaoOnly.lon }, rows.map((r) => r.date), chart('fajr'), 'fajr', angles,
    (a) => params({ fajrAngle: a, ishaAngle: 17 }), { mode: 'nearest', marginBound: 2 });
  const ia = scanValue(adhan, { lat: davaoOnly.lat, lon: davaoOnly.lon }, rows.map((r) => r.date), chart('isha'), 'isha', angles,
    (a) => params({ fajrAngle: 18.1, ishaAngle: a }), { mode: 'nearest', marginBound: 2 });
  const fw = rows.map((r) => r.fajr), iw = rows.map((r) => r.isha);
  console.log(`  davao ${y} alone: fajr ${fa.best.value.toFixed(1)}@${fa.best.margin} worst ${fa.best.worst} (printed ${Math.min(...fw.map(x => x))}..${Math.max(...fw.map(x => x))}); isha ${ia.best.value.toFixed(1)}@${ia.best.margin} worst ${ia.best.worst} (printed ${Math.min(...iw.map(x => x))}..${Math.max(...iw.map(x => x))})`);
  result.davao['fit' + y] = { fajrAngle: fa.best.value, fajrMargin: fa.best.margin, fajrWorst: fa.best.worst, ishaAngle: ia.best.value, ishaMargin: ia.best.margin, ishaWorst: ia.best.worst };
}
fs.writeFileSync('ph-fit.json', JSON.stringify(result, null, 1));
console.log('\nwrote ph-fit.json');

// ---- shared-method test: one angle pair for all three surfaces, each keeping
// its own minute margins, scored over the union of every row. ----
function evalSurfaces(list, p, mode) {
  const acc = { exact: 0, within1: 0, worst: 0, n: 0, per: {} };
  for (const s of list) {
    const rows = readRows(s.file);
    const dates = rows.map((r) => r.date);
    const coords = { lat: s.lat, lon: s.lon };
    const ser = series(adhan, coords, dates, p);
    const per = {};
    for (const col of PRAYERS) {
      const chart = rows.map((r) => parseInt(r[col].slice(0, 2), 10) * 60 + parseInt(r[col].slice(3, 5), 10));
      per[col] = bestMargin(ser[col], chart, { margins: marginsIn(2), modes: [mode] });
      acc.exact += per[col].exact;
      acc.within1 += per[col].within1;
      acc.n += per[col].n;
      acc.worst = Math.max(acc.worst, per[col].worst);
    }
    acc.per[s.name] = per;
  }
  return acc;
}

console.log('\nSHARED METHOD (one angle per column, per-surface margins, all 148 rows)');
function sharedAngle(col, make) {
  const margins = marginsIn(2);
  let best = null;
  for (const v of angles) {
    let exact = 0, within1 = 0, worst = 0, n = 0;
    const per = {};
    for (const s of SURFACES) {
      const rows = readRows(s.file);
      const ser = series(adhan, s.coords || { lat: s.lat, lon: s.lon }, rows.map((r) => r.date), make(v));
      const chart = rows.map((r) => parseInt(r[col].slice(0, 2), 10) * 60 + parseInt(r[col].slice(3, 5), 10));
      const r = bestMargin(ser[col], chart, { margins, modes: ['nearest'] });
      per[s.name] = r;
      exact += r.exact; within1 += r.within1; n += r.n; worst = Math.max(worst, r.worst);
    }
    if (!best || worst < best.worst || (worst === best.worst && exact > best.exact)) best = { v, exact, within1, worst, n, per };
  }
  return best;
}
const sharedFajr = sharedAngle('fajr', (a) => params({ fajrAngle: a, ishaAngle: 17 }));
const sharedIsha = sharedAngle('isha', (a) => params({ fajrAngle: sharedFajr.v, ishaAngle: a }));
for (const [nm, b] of [['fajr', sharedFajr], ['isha', sharedIsha]]) {
  console.log(`  ${nm} ${b.v.toFixed(1)}  worst ${b.worst}  within1 ${b.within1}/${b.n}  exact ${b.exact}/${b.n}  margins ${Object.entries(b.per).map(([k, r]) => k + ' ' + (r.margin >= 0 ? '+' : '') + r.margin).join(', ')}`);
}
result.shared = { fajrAngle: sharedFajr.v, ishaAngle: sharedIsha.v, fajrWorst: sharedFajr.worst, ishaWorst: sharedIsha.worst, fajrExact: sharedFajr.exact, ishaExact: sharedIsha.exact, of: sharedFajr.n };

// ---- cross-region test: does one region's fitted recipe serve the other? ----
function evalAt(src, dst) {
  const rows = readRows(dst.file);
  const dates = rows.map((r) => r.date);
  const coords = { lat: dst.lat, lon: dst.lon };
  const chart = {};
  for (const p of PRAYERS) chart[p] = rows.map((r) => parseInt(r[p].slice(0, 2), 10) * 60 + parseInt(r[p].slice(3, 5), 10));
  const p = params({
    fajrAngle: src.fajr.angle,
    ishaAngle: src.isha.model === 'angle' ? src.isha.angle : 0,
    ishaInterval: src.isha.model === 'interval' ? src.isha.interval : 0,
  });
  const ser = series(adhan, coords, dates, p);
  const out = {};
  for (const col of PRAYERS) out[col] = score(ser[col], chart[col], src[col].margin, src.mode);
  return out;
}

console.log('\nCROSS-APPLICATION');
for (const a of SURFACES) for (const b of SURFACES) {
  if (a.name === b.name) continue;
  const r = evalAt(result[a.name], b);
  console.log(`  ${a.name} recipe on ${b.name}: fajr worst ${r.fajr.worst} within1 ${r.fajr.within1}/${r.fajr.n} | isha worst ${r.isha.worst} within1 ${r.isha.within1}/${r.isha.n} | asr worst ${r.asr.worst} | maghrib worst ${r.maghrib.worst}`);
  result[a.name + '->' + b.name] = { fajr: r.fajr.worst, isha: r.isha.worst };
}

fs.writeFileSync('ph-fit.json', JSON.stringify(result, null, 1));
console.log('final ph-fit.json written');
