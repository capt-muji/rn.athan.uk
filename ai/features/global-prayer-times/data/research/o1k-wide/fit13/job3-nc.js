// Job 3: Noumea (Mawaqit board) — base angles, rounding-to-5 shape, isha 19:45 floor.
import * as L from './lib.js';
import { readFileSync } from 'fs';

const LAT = -22.2758, LON = 166.4580, ZONE = 'Pacific/Noumea';
const rows = L.loadTable(`${L.DATA}/nc-2026-noumea-mawaqit-year.json`);
const fileCoords = JSON.parse(readFileSync(`${L.DATA}/nc-2026-noumea-mawaqit-year.json`, 'utf8'))._mosque;

const out = { _job: 'Job 3: Centre Islamique de Noumea year — mosque-board recipe behind the Mawaqit calendar', lat: LAT, lon: LON, zone: ZONE, fileMosqueCoords: fileCoords, rows: rows.length, span: [rows[0].date, rows[rows.length - 1].date] };

// 1. which columns live on the 5-minute grid
const grid = {};
for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha']) {
  const off = rows.filter((r) => L.parseHM(r.times[k]) % 300 !== 0).length;
  grid[k] = { rowsOff5Grid: off };
}
out.gridShape = grid;

// 2. isha distribution
const ishaCounts = {};
for (const r of rows) ishaCounts[r.times.isha] = (ishaCounts[r.times.isha] || 0) + 1;
out.ishaValueCounts = ishaCounts;
const freeDays = rows.filter((r) => r.times.isha !== '19:45');
const floorDays = rows.filter((r) => r.times.isha === '19:45');
out.ishaFloor = { value: '19:45', floorDays: floorDays.length, freeDays: freeDays.length, freeDayRanges: `${freeDays[0].date} .. ${freeDays[freeDays.length - 1].date}` };

// 3. implied angles: fajr (all days), isha (free days only)
function implied(subset, field, which) {
  const st = L.stats(subset.map((r) => L.impliedAngle(r.date, LAT, LON, which, L.parseHM(r.times[field]), ZONE)));
  return { median: +st.median.toFixed(2), sd: st.sd, min: +st.min.toFixed(2), max: +st.max.toFixed(2) };
}
out.fajrImpliedAngle = implied(rows, 'fajr', 'fajr');
out.ishaImpliedAngleFreeDays = implied(freeDays, 'isha', 'isha');

// 4. residual scans
const scan = (prayer, subset, cfg) => {
  const st = L.stats(L.residuals(subset, LAT, LON, ZONE, prayer, cfg));
  return { median: +st.median.toFixed(2), sd: st.sd, min: +st.min.toFixed(2), max: +st.max.toFixed(2) };
};
out.fajrScan = {};
for (const a of [16, 17, 18, 19, 20]) out.fajrScan[a] = scan('fajr', rows, { angle: a });
out.ishaScanFreeDays = {};
for (const a of [15, 16, 17, 18, 19]) out.ishaScanFreeDays[a] = scan('isha', freeDays, { angle: a });
out.solarResiduals = { sunrise: scan('sunrise', rows, {}), magrib: scan('maghrib', rows, {}) };
out.dhuhrRawResidual = scan('dhuhr', rows, {});
out.asrRawResidual = { shadow1: scan('asr', rows, { shadow: 1 }), shadow2: scan('asr', rows, { shadow: 2 }) };

// 5. rounding-to-5 shape: candidate constructions
function gridScore(prayer, rawFn, modes) {
  const res = {};
  for (const mode of modes) {
    let exact = 0, within1 = 0, worst = 0;
    for (const r of rows) {
      const printed = L.parseHM(r.times[prayer]);
      const raw = rawFn(r.date);
      const p = L.roundTo5(raw + (mode.offsetMin || 0) * 60000, mode.mode);
      const pm = Math.floor(L.localSeconds(p, ZONE) / 60);
      const d = Math.abs(pm - printed / 60);
      if (d === 0) exact++;
      if (d <= 1) within1++;
      if (d > worst) worst = d;
    }
    res[`${mode.mode}${mode.offsetMin ? '+' + mode.offsetMin : ''}`] = { exact, within1: within1, worst };
  }
  return res;
}
const raws = {};
for (const r of rows) raws[r.date] = L.rawTimes(r.date, LAT, LON);
out.dhuhrConstructions = gridScore('dhuhr', (d) => raws[d].transit, [
  { mode: 'nearest', offsetMin: 0 }, { mode: 'nearest', offsetMin: 1 }, { mode: 'nearest', offsetMin: 2 },
  { mode: 'floor', offsetMin: 0 }, { mode: 'ceil', offsetMin: 0 },
]);
out.asrConstructions = gridScore('asr', (d) => raws[d].asrAt(1), [
  { mode: 'nearest', offsetMin: 0 }, { mode: 'nearest', offsetMin: 1 }, { mode: 'nearest', offsetMin: 2 },
  { mode: 'floor', offsetMin: 0 }, { mode: 'ceil', offsetMin: 0 },
]);

// 6. isha construction: max(round5(dusk(a)), 19:45) over the full year
function ishaConstructions(angle) {
  const res = {};
  for (const mode of ['nearest', 'floor', 'ceil']) {
    let exact = 0, worst = 0, worstRow = null;
    for (const r of rows) {
      const dusk = raws[r.date].duskAt(angle);
      const floored = Math.max(L.roundTo5(dusk, mode), 19 * 3600 + 45 * 60) * 1000;
      const pm = Math.floor(L.localSeconds(floored, ZONE) / 60);
      const printed = L.parseHM(r.times.isha) / 60;
      const d = Math.abs(pm - printed);
      if (d === 0) exact++;
      if (d > worst) { worst = d; worstRow = r.date; }
    }
    res[mode] = { exact, worst, worstRow };
  }
  return res;
}
const ishaAngleBest = out.ishaImpliedAngleFreeDays.median;
out.ishaConstructions = { angleUsed: +ishaAngleBest.toFixed(2), results: ishaConstructions(Math.round(ishaAngleBest)) };
// also with 17 and 18 exactly
out.ishaConstructions17 = ishaConstructions(17);
out.ishaConstructions18 = ishaConstructions(18);

// 7. fajr construction exact
const fajrBest = out.fajrImpliedAngle.median;
for (const a of [Math.round(fajrBest), 18]) {
  const sc = L.score(rows, LAT, LON, ZONE, { fajr: { angle: a, offsetMin: 0 } }).fajr;
  out[`fajrExact_at_${a}`] = sc;
}

// 8. amplitude + stability
out.amplitude = L.amplitudes(rows, ZONE, ['fajr', 'isha', 'magrib']);
const ishaFreeByMonth = {};
for (const r of freeDays) { const m = r.date.slice(0, 7); (ishaFreeByMonth[m] ||= []).push(r.times.isha); }
out.ishaFreeByMonth = Object.fromEntries(Object.entries(ishaFreeByMonth).map(([m, v]) => [m, `${v.length}d: ${v[0]}..${v[v.length - 1]}`]));

L.writeJSON('tmp-nc.json', out);
console.log('grid:', JSON.stringify(grid));
console.log('isha floor/free:', floorDays.length, freeDays.length, 'free range:', freeDays[0].date, '..', freeDays[freeDays.length - 1].date);
console.log('fajrImplied:', JSON.stringify(out.fajrImpliedAngle), 'ishaImplied(free):', JSON.stringify(out.ishaImpliedAngleFreeDays));
console.log('dhuhrConstr:', JSON.stringify(out.dhuhrConstructions));
console.log('asrConstr:', JSON.stringify(out.asrConstructions));
console.log('ishaConstr@', out.ishaConstructions.angleUsed, JSON.stringify(out.ishaConstructions.results));
console.log('isha17:', JSON.stringify(out.ishaConstructions17), 'isha18:', JSON.stringify(out.ishaConstructions18));
console.log('fajrExact:', JSON.stringify(out.fajrExact_at_18 || out.fajrExact_at_fajrBest));
console.log('dhuhr/asr/sunrise/magrib raw residuals:', JSON.stringify(out.dhuhrRawResidual), JSON.stringify(out.asrRawResidual), JSON.stringify(out.solarResiduals));
console.log('ishaFreeByMonth:', JSON.stringify(out.ishaFreeByMonth));
