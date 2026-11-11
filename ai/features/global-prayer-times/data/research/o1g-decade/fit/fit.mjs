// Blind fit of the 2027 London Unified Prayer Timetable.
// Run: TZ=Europe/London node fit.mjs
// Stages: (1) transit/longitude, (2) latitude + horizon angle + margins, (3) fajr/isha structure.
import fs from 'fs';
import { data, DAYS, toMin } from './lib.mjs';
import { baseTimes, solarDay } from './solar.mjs';

const OUT = new URL('./', import.meta.url).pathname;
const COLS = ['sunrise', 'dhuhr', 'asr', 'magrib'];
const halfUp = (x) => Math.floor(x + 0.5);
const pub = (k, n) => toMin(data[k][n]);
const md = (k) => k.slice(5);
const flush = (name, obj) => fs.writeFileSync(OUT + name, JSON.stringify(obj, null, 1));

// ---- scoring -----------------------------------------------------------------
function score(computed, name) {
  let exact = 0, within1 = 0, worst = 0;
  for (let i = 0; i < DAYS.length; i++) {
    const e = computed[i] - pub(DAYS[i], name);
    if (e === 0) exact++;
    if (Math.abs(e) <= 1) within1++;
    if (Math.abs(e) > worst) worst = Math.abs(e);
  }
  return { exact, within1, worst, pctExact: +(100 * exact / DAYS.length).toFixed(2), pctWithin1: +(100 * within1 / DAYS.length).toFixed(2) };
}
function bestMargin(computed, name, step = 0.5, span = 20) {
  let best = null;
  for (let m = -span; m <= span + 1e-9; m += step) {
    const s = score(computed.map((c) => halfUp(c + m)), name);
    if (!best || s.exact > best.exact || (s.exact === best.exact && s.within1 > best.within1)) best = { margin: +m.toFixed(2), ...s };
  }
  return best;
}

// ---- stage 1+2: coordinate + margin fit --------------------------------------
const baseCache = new Map();
const baseFor = (lat, lon) => {
  const key = lat + ':' + lon;
  if (!baseCache.has(key)) baseCache.set(key, DAYS.map((k) => baseTimes(k, lat, lon)));
  return baseCache.get(key);
};
const grid = [];
for (let lat = 51.44; lat <= 51.60 + 1e-9; lat += 0.005) {
  for (let lon = -0.22; lon <= 0.05 + 1e-9; lon += 0.005) {
    const row = { lat: +lat.toFixed(3), lon: +lon.toFixed(3), total: 0, within1: 0, cols: {} };
    for (const c of COLS) {
      const s = bestMargin(baseFor(+lat.toFixed(3), +lon.toFixed(3)).map((x) => x[c]), c);
      row.cols[c] = s;
      row.total += s.exact;
      row.within1 += s.within1;
    }
    grid.push(row);
  }
}
grid.sort((a, b) => b.total - a.total || b.within1 - a.within1);
flush('stage12-coordinate-fit.json', { top: grid.slice(0, 20), note: 'objective = summed exact-minute matches over sunrise/dhuhr/asr/magrib, 2027, round-half-up' });
const best = grid[0];
console.log('best coordinate/margin fit:', best.lat, best.lon, best.total, JSON.stringify(best.cols));

const lat = best.lat;
const lon = best.lon;
const base = baseFor(lat, lon);
const margins = Object.fromEntries(COLS.map((c) => [c, best.cols[c].margin]));

// ---- stage 3: fajr / isha structure -----------------------------------------
const genSunrise = base.map((x) => halfUp(x.sunrise + margins.sunrise));
const genMagrib = base.map((x) => halfUp(x.magrib + margins.magrib));

const lead = DAYS.map((k, i) => pub(k, 'sunrise') - pub(k, 'fajr'));       // minutes fajr leads published sunrise
const lag = DAYS.map((k, i) => pub(k, 'isha') - pub(k, 'magrib'));         // minutes isha trails published maghrib

const leadRuns = [];
for (let i = 0; i < DAYS.length; i++) {
  const last = leadRuns[leadRuns.length - 1];
  if (last && last.value === lead[i]) { last.end = DAYS[i]; last.days++; }
  else leadRuns.push({ start: DAYS[i], end: DAYS[i], value: lead[i], days: 1 });
}
const lagRuns = [];
for (let i = 0; i < DAYS.length; i++) {
  const last = lagRuns[lagRuns.length - 1];
  if (last && last.value === lag[i]) { last.end = DAYS[i]; last.days++; }
  else lagRuns.push({ start: DAYS[i], end: DAYS[i], value: lag[i], days: 1 });
}
flush('stage3-offset-runs.json', {
  fajrLead: { min: Math.min(...lead), max: Math.max(...lead), distinct: [...new Set(lead)].sort((a, b) => a - b), runs: leadRuns },
  ishaLag: { min: Math.min(...lag), max: Math.max(...lag), distinct: [...new Set(lag)].sort((a, b) => a - b), runs: lagRuns },
});

// ---- assemble generation -----------------------------------------------------
const tableF = {};
const tableI = {};
DAYS.forEach((k, i) => { tableF[md(k)] = lead[i]; tableI[md(k)] = lag[i]; });

const genFajr = DAYS.map((k, i) => genSunrise[i] - lead[i]);
const genIsha = DAYS.map((k, i) => genMagrib[i] + lag[i]);
const genDhuhr = base.map((x) => halfUp(x.dhuhr + margins.dhuhr));
const genAsr = base.map((x) => halfUp(x.asr + margins.asr));

// ---- stage 3b: fixed-angle hypothesis for fajr / isha -----------------------
const angleScan = { fajr: [], isha: [] };
for (const name of ['fajr', 'isha']) {
  for (let a = 14; a <= 21.0001; a += 0.05) {
    const errs = [];
    for (const k of DAYS) {
      const day = solarDay(k, lat, lon);
      const t = day.transit + (name === 'fajr' ? -1 : 1) * day.hourAngleMinutes(-a);
      errs.push(t - pub(k, name));
    }
    const mean = errs.reduce((x, y) => x + y, 0) / errs.length;
    const sd = Math.sqrt(errs.reduce((x, y) => x + (y - mean) ** 2, 0) / errs.length);
    angleScan[name].push({ angle: +a.toFixed(2), mean: +mean.toFixed(2), sd: +sd.toFixed(2), min: +Math.min(...errs).toFixed(1), max: +Math.max(...errs).toFixed(1) });
  }
  angleScan[name].sort((x, y) => x.sd - y.sd);
  angleScan[name] = { bestSd: angleScan[name][0].sd, best: angleScan[name].slice(0, 6), at18: angleScan[name].find((x) => x.angle === 18) };
}
flush('stage3b-angle-scan.json', angleScan);
console.log('angle scan best sd:', JSON.stringify({ fajr: angleScan.fajr.best[0], isha: angleScan.isha.best[0] }));

const scores = {
  fajr: score(genFajr, 'fajr'),
  sunrise: score(genSunrise, 'sunrise'),
  dhuhr: score(genDhuhr, 'dhuhr'),
  asr: score(genAsr, 'asr'),
  magrib: score(genMagrib, 'magrib'),
  isha: score(genIsha, 'isha'),
};
flush('stage4-scores.json', scores);
console.log('scores', JSON.stringify(scores));

flush('stage5-tables.json', { fajrLeadMinutes: tableF, ishaLagMinutes: tableI });
console.log('wrote stage files; lat', lat, 'lon', lon, 'margins', JSON.stringify(margins));
