// Job 1: Australia Diyanet diaspora fit — Broadmeadows, Preston, Brisbane, Auburn Gallipoli.
import * as L from './lib.js';

const DOMESTIC = {
  fajr:   { angle: 18, offsetMin: 0 },
  sunrise: { offsetMin: -7 },
  dhuhr:  { offsetMin: 5 },
  asr:    { shadow: 1, offsetMin: 4 },
  maghrib: { offsetMin: 7 },
  isha:   { angle: 17, offsetMin: 0 },
};
const EUROPEAN = {
  fajr:   { angle: 18, offsetMin: 0 },
  sunrise: { offsetMin: 0 },
  dhuhr:  { offsetMin: 0 },
  asr:    { shadow: 1, offsetMin: 0 },
  maghrib: { offsetMin: 0 },
  isha:   { angle: 16, offsetMin: 0 },
};

function residualSet(rows, lat, lon, zone, label) {
  const out = { label };
  const cfg = {
    fajr: { angle: 18 }, sunrise: {}, dhuhr: {}, asr: { shadow: 1 }, asr2: { shadow: 2 }, maghrib: {}, isha: { angle: 17 }, isha16: { angle: 16 },
  };
  for (const [prayer, c] of Object.entries(cfg)) {
    const pr = prayer === 'asr2' ? 'asr' : prayer === 'isha16' ? 'isha' : prayer;
    const res = L.residuals(rows, lat, lon, zone, pr, c);
    const st = L.stats(res);
    out[prayer] = { n: st.n, min: +st.min.toFixed(2), median: +st.median.toFixed(2), max: +st.max.toFixed(2), sd: st.sd, mode: st.mode.value, modeCount: st.mode.count };
  }
  return out;
}

function runCity(name, file, lat, lon, zone, extra = {}) {
  const rows = L.loadTable(`${L.DATA}/${file}`);
  const years = {};
  for (const r of rows) years[r.date.slice(0, 4)] = (years[r.date.slice(0, 4)] || 0) + 1;
  const out = {
    city: name, file, lat, lon, zone, rows: rows.length,
    span: [rows[0].date, rows[rows.length - 1].date], rowsByYear: years,
    ...extra,
  };
  out.residualsVsRaw = residualSet(rows, lat, lon, zone, name);
  out.exactDomestic = L.score(rows, lat, lon, zone, DOMESTIC);
  out.exactEuropean = L.score(rows, lat, lon, zone, EUROPEAN);
  // rounding mode sensitivity on the winner
  const modes = {};
  for (const mode of ['nearest', 'floor', 'ceil']) {
    const rec = JSON.parse(JSON.stringify(DOMESTIC));
    for (const p of Object.values(rec)) p.round = mode;
    modes[mode] = L.score(rows, lat, lon, zone, rec);
  }
  out.roundingModes = Object.fromEntries(Object.entries(modes).map(([m, s]) => [m, Object.fromEntries(Object.entries(s).map(([p, v]) => [p, v.exact]))]));
  out.amplitude = L.amplitudes(rows, zone, ['fajr', 'isha', 'sunrise', 'magrib']);
  return out;
}

const broad = runCity('Broadmeadows (Diyanet 11331)', 'au-2026-diyanet-broadmeadows.json', -37.6852, 144.9146, 'Australia/Melbourne');
L.writeJSON('tmp-au-broad.json', broad);

const preston = runCity('Preston (Diyanet 11281)', 'au-2026-diyanet-preston.json', -37.7410, 145.0183, 'Australia/Melbourne');
L.writeJSON('tmp-au-preston.json', preston);

const bris = runCity('Brisbane (Diyanet 11428)', 'au-2026-diyanet-brisbane.json', -27.4705, 153.0260, 'Australia/Brisbane');
L.writeJSON('tmp-au-brisbane.json', bris);

console.log('BROAD residuals fajr/sunrise/dhuhr/asr/maghrib/isha:', JSON.stringify(Object.fromEntries(['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(p => [p, broad.residualsVsRaw[p].median]))));
console.log('BROAD exact domestic:', JSON.stringify(broad.exactDomestic));
console.log('BROAD exact european:', JSON.stringify(broad.exactEuropean));
console.log('PRESTON exact domestic:', JSON.stringify(preston.exactDomestic));
console.log('BRISBANE exact domestic:', JSON.stringify(bris.exactDomestic));
console.log('BRISBANE residuals:', JSON.stringify(Object.fromEntries(['fajr','sunrise','dhuhr','asr','maghrib','isha'].map(p => [p, bris.residualsVsRaw[p].median]))));
