// Taiwan diagnostic: per-edition offset sweeps for maghrib/dhuhr, asr value
// histograms, and the anomaly days. Run: TZ=Asia/Taipei node tw-diag.js
import * as fs from 'node:fs';
import { loadAdhan, parseHHMM, fmtMin } from './lib.mjs';

const HOME = process.env.HOME;
const DIR = HOME + '/athan-gitree/census/o1k-wide/china/data/';
const FILES = { '1445': 'taiwan-taipei_cma-ramadan-1445_sample.json', '1446': 'taiwan-taipei_cma-ramadan-1446_sample.json', '1447': 'taiwan-taipei_cma-ramadan-1447.json' };
const adhan = await loadAdhan();
const c = new adhan.Coordinates(25.0330, 121.5654);

const all = [];
for (const [ed, f] of Object.entries(FILES)) {
  const d = JSON.parse(fs.readFileSync(DIR + f, 'utf8'));
  for (const [iso, v] of Object.entries(d).filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(k))) {
    const [y, m, dd] = iso.split('-').map(Number);
    all.push({ ed, iso, y, m, d: dd, ...Object.fromEntries(['fajr', 'sunrise', 'dhuhr', 'asr', 'magrib', 'isha'].map(k => [k, parseHHMM(v[k])])) });
  }
}

function solar(y, m, d) {
  const st = new adhan.SolarTime(new Date(y, m - 1, d), c);
  const t = (frac) => { const dt = new adhan.TimeComponents(frac).utcDate(y, m - 1, d); return dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60; };
  return { noon: t(st.transit), sunrise: t(st.sunrise), sunset: t(st.sunset) };
}

const EDS = ['1445', '1446', '1447'];
for (const ed of EDS) {
  const rows = all.filter(r => r.ed === ed);
  const sunset = rows.map(r => solar(r.y, r.m, r.d).sunset);
  const noon = rows.map(r => solar(r.y, r.m, r.d).noon);
  const sunrise = rows.map(r => solar(r.y, r.m, r.d).sunrise);
  console.log('== ' + ed + ' (n=' + rows.length + ')');
  // maghrib offset sweep
  let bestM = [];
  for (let o = -10; o <= 15; o += 0.5) {
    for (const mode of ['floor', 'ceil', 'nearest']) {
      let exact = 0;
      rows.forEach((r, i) => {
        const v = sunset[i] + o;
        const w = mode === 'floor' ? Math.floor(v) : mode === 'ceil' ? Math.ceil(v) : Math.round(v);
        if (w === r.magrib) exact++;
      });
      bestM.push([exact, o, mode]);
    }
  }
  bestM.sort((a, b) => b[0] - a[0]);
  console.log('  maghrib best:', bestM.slice(0, 3).map(b => '+' + b[1] + ' ' + b[2] + ' -> ' + b[0] + '/' + rows.length).join('  |  '));
  // dhuhr offset sweep
  let bestD = [];
  for (let o = 10; o <= 30; o += 0.5) {
    for (const mode of ['floor', 'ceil', 'nearest']) {
      let exact = 0;
      rows.forEach((r, i) => {
        const v = noon[i] + o;
        const w = mode === 'floor' ? Math.floor(v) : mode === 'ceil' ? Math.ceil(v) : Math.round(v);
        if (w === r.dhuhr) exact++;
      });
      bestD.push([exact, o, mode]);
    }
  }
  bestD.sort((a, b) => b[0] - a[0]);
  console.log('  dhuhr best:', bestD.slice(0, 3).map(b => '+' + b[1] + ' ' + b[2] + ' -> ' + b[0] + '/' + rows.length).join('  |  '));
  // fajr from computed sunrise sweep
  let bestF = [];
  for (let o = -90; o <= -50; o += 0.5) {
    for (const mode of ['floor', 'ceil', 'nearest']) {
      let exact = 0;
      rows.forEach((r, i) => {
        const v = sunrise[i] + o;
        const w = mode === 'floor' ? Math.floor(v) : mode === 'ceil' ? Math.ceil(v) : Math.round(v);
        if (w === r.fajr) exact++;
      });
      bestF.push([exact, o, mode]);
    }
  }
  bestF.sort((a, b) => b[0] - a[0]);
  console.log('  fajr (computed sunrise + off) best:', bestF.slice(0, 3).map(b => b[1] + ' ' + b[2] + ' -> ' + b[0] + '/' + rows.length).join('  |  '));
  // asr histogram
  const hist = {};
  rows.forEach(r => hist[fmtMin(r.asr)] = (hist[fmtMin(r.asr)] || 0) + 1);
  console.log('  asr histogram:', JSON.stringify(hist));
}

// anomaly days in detail
const pick = iso => all.find(r => r.iso === iso);
for (const iso of ['2025-03-29', '2026-03-04', '2026-03-05', '2026-02-20']) {
  const r = pick(iso);
  if (!r) continue;
  const s = solar(r.y, r.m, r.d);
  console.log('anomaly', iso, r.ed, JSON.stringify({ fajr: fmtMin(r.fajr), sunrise: fmtMin(r.sunrise), dhuhr: fmtMin(r.dhuhr), asr: fmtMin(r.asr), magrib: fmtMin(r.magrib), isha: fmtMin(r.isha) }), 'computed sunrise', fmtMin(Math.floor(s.sunrise)), 'sunset', fmtMin(Math.floor(s.sunset)), 'noon', fmtMin(Math.floor(s.noon)), 'sunrise-fajr', r.sunrise - r.fajr, 'isha-magrib', r.isha - r.magrib);
}
