// Job 4: Adelaide ISSA Nov+Dec 2026 — recipe fit.
import * as L from './lib.js';
import { readFileSync } from 'fs';

const LAT = -34.9285, LON = 138.6007, ZONE = 'Australia/Adelaide';
const nov = JSON.parse(readFileSync(`${L.DATA}/au-2026-11-adelaide-issa.json`, 'utf8'));
const dec = JSON.parse(readFileSync(`${L.DATA}/au-2026-12-adelaide-issa.json`, 'utf8'));
const rows = [...L.loadTable(`${L.DATA}/au-2026-11-adelaide-issa.json`), ...L.loadTable(`${L.DATA}/au-2026-12-adelaide-issa.json`)];
const lowConf = new Set(nov._low_confidence_rows || []);

const out = { _job: 'Job 4: Islamic Society of South Australia (Adelaide), Nov+Dec 2026', lat: LAT, lon: LON, zone: ZONE, rows: rows.length, span: [rows[0].date, rows[rows.length - 1].date], lowConfidenceRows: [...lowConf], source: 'islamicsocietysa.org.au monthly schedule; 7 more months (Apr-Oct 2026 PDFs) banked raw for follow-up' };

const implied = (field, which) => {
  const st = L.stats(rows.map((r) => L.impliedAngle(r.date, LAT, LON, which, L.parseHM(r.times[field]), ZONE)));
  return { median: +st.median.toFixed(2), sd: st.sd, min: +st.min.toFixed(2), max: +st.max.toFixed(2) };
};
const scan = (prayer, cfg, subset = rows) => {
  const st = L.stats(L.residuals(subset, LAT, LON, ZONE, prayer, cfg));
  return { median: +st.median.toFixed(2), sd: st.sd, min: +st.min.toFixed(2), max: +st.max.toFixed(2) };
};
out.fajrImpliedAngle = implied('fajr', 'fajr');
out.ishaImpliedAngle = implied('isha', 'isha');
out.fajrScan = {};
for (const a of [15, 16, 17, 18, 19, 20]) out.fajrScan[a] = scan('fajr', { angle: a });
out.ishaScan = {};
for (const a of [14, 15, 16, 17, 18, 19]) out.ishaScan[a] = scan('isha', { angle: a });
out.solarResiduals = { sunrise: scan('sunrise', {}), maghrib: scan('maghrib', {}), dhuhr: scan('dhuhr', {}), asrShadow1: scan('asr', { shadow: 1 }), asrShadow2: scan('asr', { shadow: 2 }) };

// dhuhr column behaviour
const dhuhrVals = {};
for (const r of rows) dhuhrVals[r.times.dhuhr] = (dhuhrVals[r.times.dhuhr] || 0) + 1;
out.dhuhrValueCounts = dhuhrVals;

// exact recipes
out.exactScores = {};
for (const [name, rec] of Object.entries({
  fajr18_isha17: { fajr: { angle: 18, offsetMin: 0 }, isha: { angle: 17, offsetMin: 0 } },
  fajr18_isha18: { fajr: { angle: 18, offsetMin: 0 }, isha: { angle: 18, offsetMin: 0 } },
})) {
  out.exactScores[name] = L.score(rows, LAT, LON, ZONE, rec);
}
// maghrib conventions
for (const [off, mode] of [[0, 'nearest'], [4, 'ceil'], [5, 'floor'], [5, 'nearest'], [6, 'ceil'], [7, 'floor'], [7, 'nearest']]) {
  let e = 0, w1 = 0;
  for (const r of rows) {
    const pm = Math.floor(L.localSeconds(L.roundMin(L.rawTimes(r.date, LAT, LON).sunset + off * 60000, mode) * 1000, ZONE) / 60);
    const d = Math.abs(pm - L.parseHM(r.times.magrib) / 60);
    if (d === 0) e++;
    if (d <= 1) w1++;
  }
  out.exactScores[`maghrib_${off}m_${mode}`] = { exact: e, within1: w1, of: rows.length };
}
// asr conventions
for (const [sh, off] of [[1, 0], [1, 3], [1, 4], [1, 5], [1, 6], [2, 0], [2, 4]]) {
  let e = 0, w1 = 0;
  for (const r of rows) {
    const pm = Math.floor(L.localSeconds(L.roundMin(L.rawTimes(r.date, LAT, LON).asrAt(sh) + off * 60000, 'nearest') * 1000, ZONE) / 60);
    const d = Math.abs(pm - L.parseHM(r.times.asr) / 60);
    if (d === 0) e++;
    if (d <= 1) w1++;
  }
  out.exactScores[`asr_s${sh}+${off}m`] = { exact: e, within1: w1, of: rows.length };
}
// dhuhr conventions
for (const off of [0, 10, 15, 20, 22, 25, 30]) {
  let e = 0, w1 = 0;
  for (const r of rows) {
    const pm = Math.floor(L.localSeconds(L.roundMin(L.rawTimes(r.date, LAT, LON).transit + off * 60000, 'nearest') * 1000, ZONE) / 60);
    const d = Math.abs(pm - L.parseHM(r.times.dhuhr) / 60);
    if (d === 0) e++;
    if (d <= 1) w1++;
  }
  out.exactScores[`dhuhr+${off}m`] = { exact: e, within1: w1, of: rows.length };
}
// sunrise conventions
for (const [off, mode] of [[0, 'nearest'], [0, 'ceil'], [0, 'floor'], [-4, 'ceil'], [4, 'ceil']]) {
  let e = 0, w1 = 0;
  for (const r of rows) {
    const pm = Math.floor(L.localSeconds(L.roundMin(L.rawTimes(r.date, LAT, LON).sunrise + off * 60000, mode) * 1000, ZONE) / 60);
    const d = Math.abs(pm - L.parseHM(r.times.sunrise) / 60);
    if (d === 0) e++;
    if (d <= 1) w1++;
  }
  out.exactScores[`sunrise_${off}m_${mode}`] = { exact: e, within1: w1, of: rows.length };
}
// amplitude + split by month
out.amplitude = { nov: { fajrFirst: rows[0].times.fajr, fajrLast: rows.filter((r) => r.date.startsWith('2026-11')).slice(-1)[0].times.fajr }, dec: { fajrFirst: rows.filter((r) => r.date.startsWith('2026-12'))[0].times.fajr } };
const lowRes = [];
for (const r of rows.filter((x) => lowConf.has(x.date))) {
  const sc = L.score([r], LAT, LON, ZONE, { fajr: { angle: 18 }, isha: { angle: 17 } });
  lowRes.push({ date: r.date, fajr: sc.fajr.worst, isha: sc.isha.worst });
}
out.lowConfidenceFit = lowRes;
L.writeJSON('tmp-adelaide.json', out);
console.log('fajrImplied:', JSON.stringify(out.fajrImpliedAngle));
console.log('ishaImplied:', JSON.stringify(out.ishaImpliedAngle));
console.log('solar:', JSON.stringify(out.solarResiduals));
console.log('dhuhrVals:', JSON.stringify(dhuhrVals));
console.log('exact fajr/isha:', JSON.stringify(out.exactScores.fajr18_isha17), JSON.stringify(out.exactScores.fajr18_isha18));
console.log('conventions:', JSON.stringify(Object.fromEntries(Object.entries(out.exactScores).filter(([k]) => k.startsWith('magh') || k.startsWith('asr') || k.startsWith('dhuhr') || k.startsWith('sunrise')))));
console.log('lowConf fit:', JSON.stringify(lowRes));
