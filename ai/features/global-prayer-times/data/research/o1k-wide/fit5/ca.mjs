// Job 4: Toronto's two year feeds. Masjid Toronto (MAC, Dundas St W) and the
// Islamic Institute of Toronto (Scarborough), 365 dated rows each for 2026.
import fs from 'node:fs';
import { load, series, bestMargin, scanValue, score, marginsIn, line, PRAYERS } from './lib.mjs';

const ROOT = process.env.HOME + '/athan-gitree/census/o1k-wide/americas/data/';
const adhan = await load();
const { CalculationParameters, Madhab } = adhan;
const C = { lat: 43.6532, lon: -79.3832 };

const SETS = [
  { name: 'masjid-toronto', file: 'ca_masjid_toronto_2026.json', defect: null },
  { name: 'islamic-institute-toronto', file: 'ca_islamic_institute_toronto_2026.json', defect: '2026-03-08' },
];

function params({ fajrAngle = 15, ishaAngle = 0, ishaInterval = 80, madhab = Madhab.Shafi }) {
  const p = new CalculationParameters('Other', fajrAngle, ishaAngle, ishaInterval);
  p.madhab = madhab;
  return p;
}

const angles = [];
for (let a = 100; a <= 200; a++) angles.push(a / 10);
const MODES = ['nearest', 'floor', 'ceil'];
const out = {};

for (const s of SETS) {
  const raw = JSON.parse(fs.readFileSync(ROOT + s.file));
  const days = Object.keys(raw).sort();
  const col = (d, k) => raw[d][k === 'maghrib' ? 'magrib' : k];
  const val = (d, k) => parseInt(col(d, k).slice(0, 2), 10) * 60 + parseInt(col(d, k).slice(3, 5), 10);
  const chart = {};
  for (const p of PRAYERS) chart[p] = days.map((d) => val(d, p));

  console.log(`\n########## ${s.name}  ${days.length} rows  ${days[0]} .. ${days[days.length - 1]}`);

  // The printed isha rule, read straight off the two published columns.
  const ivs = days.map((d) => val(d, 'isha') - val(d, 'maghrib'));
  const hist = {};
  for (const v of ivs) hist[v] = (hist[v] || 0) + 1;
  console.log('  printed isha - printed maghrib:', JSON.stringify(hist));

  const perMode = {};
  for (const mode of MODES) {
    const fajr = scanValue(adhan, C, days, chart.fajr, 'fajr', angles, (a) => params({ fajrAngle: a }), { mode, marginBound: 2 });
    const geo = series(adhan, C, days, params({ fajrAngle: fajr.best.value }));
    const sunrise = bestMargin(geo.sunrise, chart.sunrise, { margins: marginsIn(2), modes: [mode] });
    const dhuhr = bestMargin(geo.dhuhr, chart.dhuhr, { margins: marginsIn(2), modes: [mode] });
    const maghrib = bestMargin(geo.maghrib, chart.maghrib, { margins: marginsIn(2), modes: [mode] });
    const asrShafi = bestMargin(geo.asr, chart.asr, { margins: marginsIn(2), modes: [mode] });
    const asrHanafi = bestMargin(series(adhan, C, days, params({ fajrAngle: fajr.best.value, madhab: Madhab.Hanafi })).asr,
      chart.asr, { margins: marginsIn(2), modes: [mode] });
    const ivsN = [];
    for (let n = 60; n <= 100; n++) ivsN.push(n);
    const ishaInterval = scanValue(adhan, C, days, chart.isha, 'isha', ivsN,
      (n) => params({ fajrAngle: fajr.best.value, ishaInterval: n }), { mode, marginBound: 2 });
    const margin = { fajr: fajr.best.margin, sunrise: sunrise.margin, dhuhr: dhuhr.margin, asr: asrShafi.margin, maghrib: maghrib.margin, isha: ishaInterval.best.margin };
    const ser = series(adhan, C, days, params({ fajrAngle: fajr.best.value, ishaInterval: ishaInterval.best.value }));
    const joint = {};
    let worstAll = 0, exactAll = 0, within1All = 0;
    for (const p of PRAYERS) {
      joint[p] = score(ser[p], chart[p], margin[p], mode);
      worstAll = Math.max(worstAll, joint[p].worst);
      exactAll += joint[p].exact; within1All += joint[p].within1;
    }
    perMode[mode] = { mode, fajr, sunrise, dhuhr, maghrib, asrShafi, asrHanafi, ishaInterval, joint, worstAll, exactAll, within1All, margin };
  }
  const chosen = MODES.map((m) => perMode[m]).sort((a, b) => b.within1All - a.within1All || b.exactAll - a.exactAll)[0];
  console.log(`  ADOPTED ${chosen.mode}`);
  for (const p of PRAYERS) console.log('   ', line(p, chosen.joint[p]).trim());
  console.log('    fajr angle', chosen.fajr.best.value.toFixed(1), 'margin', chosen.fajr.best.margin, '| isha interval', chosen.ishaInterval.best.value, 'margin', chosen.ishaInterval.best.margin);
  console.log('    asr: Shafi worst', chosen.asrShafi.worst, '| Hanafi worst', chosen.asrHanafi.worst);

  // Re-score with the known defect day dropped.
  const keep = days.map((d, i) => (d === s.defect ? -1 : i)).filter((i) => i >= 0);
  const ser = series(adhan, C, keep.map((i) => days[i]), params({ fajrAngle: chosen.fajr.best.value, ishaInterval: chosen.ishaInterval.best.value }));
  const clean = {};
  let cw = 0, ce = 0, c1 = 0;
  for (const p of PRAYERS) {
    const ch = keep.map((i) => chart[p][i]);
    clean[p] = score(ser[p], ch, chosen.margin[p], chosen.mode);
    cw = Math.max(cw, clean[p].worst); ce += clean[p].exact; c1 += clean[p].within1;
  }
  if (s.defect) {
    console.log(`    dropping the ${s.defect} defect row: worst ${cw} exact ${ce}/${keep.length * 6} within1 ${c1}/${keep.length * 6}`);
    for (const p of PRAYERS) console.log('     ', line(p, clean[p]).trim());
  }

  // Implied isha angle by month, to show what an interval looks like when read as an angle.
  const byMonth = {};
  for (const d of days) (byMonth[d.slice(0, 7)] ||= []).push(d);
  const implied = {};
  for (const [m, ds] of Object.entries(byMonth)) {
    let bestA = null;
    for (const a of angles) {
      const r = score(series(adhan, C, ds, params({ fajrAngle: 15, ishaAngle: a, ishaInterval: 0 })).isha, ds.map((d) => val(d, 'isha')), 0, 'nearest');
      if (!bestA || r.mae < bestA.mae) bestA = { a, mae: r.mae };
    }
    implied[m] = bestA.a;
  }
  console.log('    implied isha angle by month:', Object.entries(implied).map(([m, a]) => m.slice(5) + ':' + a.toFixed(1)).join(' '));

  out[s.name] = {
    rows: days.length, mode: chosen.mode,
    fajrAngle: chosen.fajr.best.value, fajrMargin: chosen.fajr.best.margin,
    fajrScore: { exact: chosen.joint.fajr.exact, within1: chosen.joint.fajr.within1, worst: chosen.joint.fajr.worst },
    ishaIntervalPrinted: { mode: Object.keys(hist)[0], values: hist },
    ishaIntervalFit: chosen.ishaInterval.best.value, ishaMargin: chosen.ishaInterval.best.margin,
    ishaScore: { exact: chosen.joint.isha.exact, within1: chosen.joint.isha.within1, worst: chosen.joint.isha.worst },
    asrSchool: 'Shafi', asrMargin: chosen.asrShafi.margin, asrScore: { exact: chosen.joint.asr.exact, within1: chosen.joint.asr.within1, worst: chosen.joint.asr.worst }, asrHanafiWorst: chosen.asrHanafi.worst,
    sunriseScore: { exact: chosen.joint.sunrise.exact, within1: chosen.joint.sunrise.within1, worst: chosen.joint.sunrise.worst },
    maghribScore: { exact: chosen.joint.maghrib.exact, within1: chosen.joint.maghrib.within1, worst: chosen.joint.maghrib.worst },
    dhuhrScore: { exact: chosen.joint.dhuhr.exact, within1: chosen.joint.dhuhr.within1, worst: chosen.joint.dhuhr.worst },
    joint: { worst: chosen.worstAll, exact: chosen.exactAll, within1: chosen.within1All, of: days.length * 6 },
    defect: s.defect,
    clean: s.defect ? { worst: cw, exact: ce, within1: c1, of: keep.length * 6 } : { worst: chosen.worstAll, exact: chosen.exactAll, within1: chosen.within1All, of: days.length * 6 },
    impliedIshaAngleByMonth: implied,
  };

  // FCNA divergence.
  const p13 = new CalculationParameters('Other', 13, 13);
  const p15 = new CalculationParameters('Other', 15, 15);
  const s13 = series(adhan, C, days, p13);
  const s15 = series(adhan, C, days, p15);
  const d13 = { min: 999, max: -999, sum: 0 }, d15 = { min: 999, max: -999, sum: 0 };
  for (let i = 0; i < days.length; i++) {
    const a = chart.isha[i] - (s13.isha[i] / 60 + 0.5);
    const b = chart.isha[i] - (s15.isha[i] / 60 + 0.5);
    d13.min = Math.min(d13.min, a); d13.max = Math.max(d13.max, a); d13.sum += a;
    d15.min = Math.min(d15.min, b); d15.max = Math.max(d15.max, b); d15.sum += b;
  }
  console.log(`    printed isha minus FCNA 13/13 isha: ${d13.min.toFixed(1)}..${d13.max.toFixed(1)} min (mean ${(d13.sum / days.length).toFixed(1)})`);
  console.log(`    printed isha minus 15/15 isha:       ${d15.min.toFixed(1)}..${d15.max.toFixed(1)} min (mean ${(d15.sum / days.length).toFixed(1)})`);
  out[s.name].fcna13 = { min: +d13.min.toFixed(1), max: +d13.max.toFixed(1), mean: +(d13.sum / days.length).toFixed(1) };
  out[s.name].fcna15 = { min: +d15.min.toFixed(1), max: +d15.max.toFixed(1), mean: +(d15.sum / days.length).toFixed(1) };
}

// Feed-to-feed disagreement.
const A = JSON.parse(fs.readFileSync(ROOT + SETS[0].file));
const B = JSON.parse(fs.readFileSync(ROOT + SETS[1].file));
const days = Object.keys(A).sort();
const delta = {};
for (const p of PRAYERS) {
  let min = 999, max = -999;
  for (const d of days) {
    const k = p === 'maghrib' ? 'magrib' : p;
    const x = parseInt(A[d][k].slice(0, 2), 10) * 60 + parseInt(A[d][k].slice(3, 5), 10);
    const y = parseInt(B[d][k].slice(0, 2), 10) * 60 + parseInt(B[d][k].slice(3, 5), 10);
    min = Math.min(min, y - x); max = Math.max(max, y - x);
  }
  delta[p] = [min, max];
}
console.log('\nfeed disagreement (IIT minus Masjid Toronto), minutes:', JSON.stringify(delta));
out.agreement = delta;

fs.writeFileSync('ca-fit.json', JSON.stringify(out, null, 1));
console.log('\nwrote ca-fit.json');
