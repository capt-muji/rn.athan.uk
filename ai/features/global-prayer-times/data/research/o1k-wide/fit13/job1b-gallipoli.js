// Job 1b: Auburn Gallipoli own API (method printed Diyanet) vs the domestic recipe.
import * as L from './lib.js';

const LAT = -33.8509, LON = 151.0034, ZONE = 'Australia/Sydney';
const rows = L.loadTable(`${L.DATA}/au-gallipoli-own-api-2026-11_12_2027-06.json`);
const perYear = {};
for (const r of rows) (perYear[r.date.slice(0, 4)] ||= []).push(r);

const recipe = {
  imsak: { angle: 18, offsetMin: 0 },
  fajr17: { angle: 17, offsetMin: 0 },
  sunrise: { offsetMin: -7 },
  dhuhr: { offsetMin: 5 },
  asr: { shadow: 1, offsetMin: 4 },
  maghrib: { offsetMin: 7 },
  isha: { angle: 17, offsetMin: 0 },
  isha16: { angle: 16, offsetMin: 0 },
};

const out = {
  surface: 'Auburn Gallipoli Mosque own API (gallipolimosque.org.au), method printed "Diyanet İşleri Başkanlığı"',
  lat: LAT, lon: LON, zone: ZONE,
  rows: rows.length, span: [rows[0].date, rows[rows.length - 1].date],
  rowsByYear: Object.fromEntries(Object.entries(perYear).map(([y, rs]) => [y, rs.length])),
};

// residual medians vs raw astronomy (printed key: table field 'imsak'/'isha' etc.)
function res(prayer, tableKey, cfg) {
  const subset = rows.map((r) => ({ date: r.date, times: { [prayer]: r.times[tableKey] } }));
  return L.stats(L.residuals(subset, LAT, LON, ZONE, prayer, cfg));
}
const residualTable = {};
const fields = [
  ['imsak', 'fajr', { angle: 18 }], ['imsak', 'fajr', { angle: 18, offsetMin: -7 }],
  ['fajrIqamah', 'fajr', { angle: 18 }], ['isha', 'isha', { angle: 17 }], ['isha', 'isha', { angle: 16 }],
  ['ishaIqamah', 'isha', { angle: 17 }], ['sunrise', 'sunrise', {}], ['dhuhr', 'dhuhr', {}],
  ['dhuhrIqamah', 'dhuhr', {}], ['asr', 'asr', { shadow: 1 }], ['asr', 'asr', { shadow: 2 }],
  ['asrIqamah', 'asr', { shadow: 1 }], ['magrib', 'maghrib', {}], ['magribIqamah', 'maghrib', {}],
];
for (const [tk, pr, cfg] of fields) {
  const st = res(pr, tk, cfg);
  residualTable[`${tk} vs ${pr}(${cfg.angle ?? cfg.shadow ?? 'solar'}${cfg.offsetMin ? cfg.offsetMin + 'm' : ''})`] = {
    n: st.n, median: +st.median.toFixed(2), min: +st.min.toFixed(2), max: +st.max.toFixed(2), sd: st.sd, mode: st.mode.value, modeCount: st.mode.count,
  };
}
out.residuals = residualTable;

// exact score of the domestic recipe on the "begins" columns
function scoreField(field, prayer, cfg) {
  const subset = rows.map((r) => ({ date: r.date, times: { [prayer]: r.times[field] } }));
  return L.score(subset, LAT, LON, ZONE, { [prayer]: cfg })[prayer];
}
const scoreRows = rows.map((r) => ({ date: r.date, times: r.times }));
const domScores = {};
for (const [field, cfg] of [
  ['imsak', { angle: 18, offsetMin: 0 }], ['imsak', { angle: 18, offsetMin: -7 }],
  ['sunrise', { offsetMin: -7 }], ['dhuhr', { offsetMin: 5 }],
  ['asr', { shadow: 1, offsetMin: 4 }], ['magrib', { offsetMin: 7 }],
  ['isha', { angle: 17, offsetMin: 0 }], ['isha', { angle: 16, offsetMin: 0 }],
]) {
  domScores[`${field} <- ${JSON.stringify(cfg)}`] = scoreField(field, field === 'imsak' || field === 'isha' ? 'fajr' : field === 'sunrise' ? 'sunrise' : field === 'dhuhr' ? 'dhuhr' : field === 'asr' ? 'asr' : field === 'magrib' ? 'maghrib' : 'isha', cfg);
}
// scoreField maps printed key from prayer name; imsak/isha need explicit keys — redo carefully:
function scoreExact(field, predictPrayer, cfg) {
  const subset = rows.map((r) => ({ date: r.date, times: { [predictPrayer]: r.times[field] } }));
  return L.score(subset, LAT, LON, ZONE, { [predictPrayer]: cfg })[predictPrayer];
}
const clean = {};
for (const [field, cfg] of [
  ['imsak', { angle: 18, offsetMin: 0 }], ['imsak', { angle: 18, offsetMin: -7 }],
  ['sunrise', { offsetMin: -7 }], ['dhuhr', { offsetMin: 5 }],
  ['asr', { shadow: 1, offsetMin: 4 }], ['magrib', { offsetMin: 7 }],
  ['isha', { angle: 17, offsetMin: 0 }], ['isha', { angle: 16, offsetMin: 0 }],
]) {
  const pr = { imsak: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', magrib: 'maghrib', isha: 'isha' }[field];
  clean[`${field} <- ${JSON.stringify(cfg)}`] = scoreExact(field, pr, cfg);
}
out.exactDomestic = clean;

// per-year breakdown on the winning shape
const byYear = {};
for (const [y, rs] of Object.entries(perYear)) {
  const subset = rs.map((r) => ({ date: r.date, times: r.times }));
  const sc = (field, pr, cfg) => {
    const sub2 = subset.map((r) => ({ date: r.date, times: { [pr]: r.times[field] } }));
    return L.score(sub2, LAT, LON, ZONE, { [pr]: cfg })[pr];
  };
  byYear[y] = {
    rows: rs.length,
    span: [rs[0].date, rs[rs.length - 1].date],
    imsak18: sc('imsak', 'fajr', { angle: 18, offsetMin: 0 }),
    isha17: sc('isha', 'isha', { angle: 17, offsetMin: 0 }),
    dhuhr5: sc('dhuhr', 'dhuhr', { offsetMin: 5 }),
    dhuhr5_nonFriday: sc('dhuhr', 'dhuhr', { offsetMin: 5 }),
    asr4: sc('asr', 'asr', { shadow: 1, offsetMin: 4 }),
  };
}
out.byYear = byYear;

// iqamah offsets
const iqOff = {};
for (const [a, b] of [['fajrIqamah', 'imsak'], ['dhuhrIqamah', 'dhuhr'], ['asrIqamah', 'asr'], ['magribIqamah', 'magrib'], ['ishaIqamah', 'isha']]) {
  const diffs = rows.map((r) => (L.parseHM(r.times[a]) - L.parseHM(r.times[b])) / 60);
  iqOff[`${b} -> ${a}`] = L.stats(diffs);
}
out.iqamahOffsets = iqOff;

L.writeJSON('tmp-au-gallipoli.json', out);
console.log('GALLIPOLI residuals:', JSON.stringify(Object.fromEntries(Object.entries(residualTable).map(([k, v]) => [k, v.median]))));
console.log('GALLIPOLI exact:', JSON.stringify(Object.fromEntries(Object.entries(clean).map(([k, v]) => [k, [v.exact, v.total, v.worst]]))));
console.log('GALLIPOLI byYear:', JSON.stringify(byYear));
console.log('GALLIPOLI iqamah:', JSON.stringify(Object.fromEntries(Object.entries(iqOff).map(([k, v]) => [k, v.mode]))));
