// Al-Ojeiri: parse the day block matching each requested date, then fit.
// The page carries two prayer blocks when the requested day is not today (today's
// block first, the selected day's second); each block's own head-date decides which.
// Run: TZ=Asia/Kuwait node scripts/fit-kw.js
const fs = require('fs');
const path = require('path');
const C = process.env.HOME + '/athan-gitree/census';
const L = require(C + '/o1k-wide/deep2/scripts/lib');
const E = require(C + '/o1k-wide/deep2/scripts/engine');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'captures', 'kw-days');
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const LAT = 29.3759, LNG = 47.9774; // Kuwait City
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const tmin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const fmt = (s) => ({ exactPct: +(100 * s.exact / s.n).toFixed(1), w1Pct: +(100 * s.w1 / s.n).toFixed(1), mae: +s.mae.toFixed(3), max: s.maxAbs, n: s.n });

function parseDay(html) {
  // blocks: each <div class="d-flex"> with a date line then its prayer list
  const out = {};
  const parts = html.split('head-date');
  for (const p of parts.slice(1)) {
    const dm = /<p>(\d{1,2}) ([A-Za-z]{3}) (\d{4})<\/p>/.exec(p);
    if (!dm) continue;
    const key = `${dm[3]}-${String(MONTHS[dm[2]]).padStart(2, '0')}-${String(dm[1]).padStart(2, '0')}`;
    const times = [...p.matchAll(/data-time="(\d{2}:\d{2}):\d{2}"/g)].map((m) => m[1]);
    if (times.length >= 6 && !out[key]) out[key] = Object.fromEntries(COLS.map((k, i) => [k, times[i]]));
  }
  return out;
}

const rows = {};
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.html'))) {
  const want = /(\d{4}-\d{2}-\d{2})\.html$/.exec(f)[1];
  const got = parseDay(fs.readFileSync(path.join(DIR, f), 'utf8'));
  if (got[want]) rows[want] = got[want];
}
const days = Object.keys(rows).sort();
fs.writeFileSync(path.join(ROOT, 'data', 'kw-kuwait-city-2026.json'), JSON.stringify(rows, null, 1));
console.log('rows', days.length, days[0], '..', days[days.length - 1], 'gaps', 365 - days.length);

const c = L.coords(LAT, LNG);
const printed = (k) => (d) => tmin(rows[d][k]);
const grid = E.grid(15.5, 19.5, 0.05);
const tabF = E.angleTable(c, days, grid, 'fajr');
const tabI = E.angleTable(c, days, grid, 'isha');
const fajrFit = E.fitAngle(tabF, days, printed('fajr'), [-3, -2, -1, 0, 1]);
const ishaFit = E.fitAngle(tabI, days, printed('isha'), [-3, -2, -1, 0, 1]);
const T = {}, TS = {};
for (const d of days) {
  T[d] = L.times(c, { fajrAngle: 18, ishaAngle: 17.5, madhab: 'hanafi' }, d);
  TS[d] = L.times(c, { fajrAngle: 18, ishaAngle: 17.5, madhab: 'shafi' }, d);
}
const sunriseFit = E.fitFixed((d) => T[d].sunrise, days, printed('sunrise'), [-4, -3, -2, -1, 0, 1]);
const dhuhrFit = E.fitFixed((d) => T[d].dhuhr, days, printed('dhuhr'), [-2, -1, 0, 1, 2, 3]);
const asrFit = E.fitFixed((d) => TS[d].asr, days, printed('asr'), [-2, -1, 0, 1, 2, 3]);
const maghribFit = E.fitFixed((d) => T[d].maghrib, days, printed('maghrib'), [-2, -1, 0, 1, 2, 3]);

function score(modelFn) {
  const pairs = {};
  for (const k of COLS) pairs[k] = [];
  for (const d of days) {
    const m = modelFn(d);
    for (const k of COLS) if (rows[d][k] !== '00:00') pairs[k].push([printed(k)(d), m[k]]);
  }
  const per = {};
  let all = [];
  for (const k of COLS) { per[k] = fmt(L.score(pairs[k])); all = all.concat(pairs[k]); }
  return { perColumn: per, total: fmt(L.score(all)) };
}

// the recorded recipe: 18/17.5, fajr+sunrise FLOOR, maghrib+isha NEAREST, dhuhr/asr silent (fitted here)
const recorded = score((d) => ({
  fajr: L.roundMin(T[d].fajr, 0, 'floor'),
  sunrise: L.roundMin(T[d].sunrise, 0, 'floor'),
  dhuhr: L.roundMin(T[d].dhuhr, dhuhrFit.pad, dhuhrFit.mode),
  asr: L.roundMin(TS[d].asr, asrFit.pad, asrFit.mode),
  maghrib: L.roundMin(T[d].maghrib, 0, 'round'),
  isha: L.roundMin(T[d].isha, 0, 'round'),
}));
const silentDhuhrAsrFloor = score((d) => ({
  fajr: L.roundMin(T[d].fajr, 0, 'floor'),
  sunrise: L.roundMin(T[d].sunrise, 0, 'floor'),
  dhuhr: L.roundMin(T[d].dhuhr, 0, 'floor'),
  asr: L.roundMin(TS[d].asr, 0, 'floor'),
  maghrib: L.roundMin(T[d].maghrib, 0, 'round'),
  isha: L.roundMin(T[d].isha, 0, 'round'),
}));

const perYear = {};
for (const y of [...new Set(days.map((d) => d.slice(0, 4)))]) {
  const sub = days.filter((d) => d.startsWith(y));
  const sp = {};
  for (const k of COLS) sp[k] = [];
  let all = [];
  for (const d of sub) {
    const m = {
      fajr: L.roundMin(T[d].fajr, 0, 'floor'), sunrise: L.roundMin(T[d].sunrise, 0, 'floor'),
      dhuhr: L.roundMin(T[d].dhuhr, dhuhrFit.pad, dhuhrFit.mode), asr: L.roundMin(TS[d].asr, asrFit.pad, asrFit.mode),
      maghrib: L.roundMin(T[d].maghrib, 0, 'round'), isha: L.roundMin(T[d].isha, 0, 'round'),
    };
    for (const k of COLS) if (rows[d][k] !== '00:00') { sp[k].push([printed(k)(d), m[k]]); all = all.concat([[printed(k)(d), m[k]]]); }
  }
  perYear[y] = fmt(L.score(all));
}

const amp = {};
for (const k of COLS) {
  const v = days.map((d) => printed(k)(d));
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  amp[k] = {
    peakToPeak: Math.max(...v) - Math.min(...v),
    jan: med(days.filter((d) => d.slice(5, 7) === '01').map((d) => printed(k)(d))),
    jul: med(days.filter((d) => d.slice(5, 7) === '07').map((d) => printed(k)(d))),
  };
}

const out = {
  job: 'O1l-8 Kuwait Al-Ojeiri full year', rows: days.length,
  span: { from: days[0], to: days[days.length - 1] }, lat: LAT, lng: LNG,
  freeFit: {
    fajr: { theta: fajrFit.theta, pad: fajrFit.pad, mode: fajrFit.mode, score: fmt(fajrFit.s) },
    isha: { theta: ishaFit.theta, pad: ishaFit.pad, mode: ishaFit.mode, score: fmt(ishaFit.s) },
    sunrise: { pad: sunriseFit.pad, mode: sunriseFit.mode, score: fmt(sunriseFit.s) },
    dhuhr: { pad: dhuhrFit.pad, mode: dhuhrFit.mode, score: fmt(dhuhrFit.s) },
    asr_shafi: { pad: asrFit.pad, mode: asrFit.mode, score: fmt(asrFit.s) },
    maghrib: { pad: maghribFit.pad, mode: maghribFit.mode, score: fmt(maghribFit.s) },
  },
  recordedRecipe: recorded, dhuhrAsrFloor: silentDhuhrAsrFloor, perYear, amplitude: amp,
};
fs.writeFileSync(path.join(ROOT, 'data', 'kw-fit.json'), JSON.stringify(out, null, 1));

console.log('free fajr', JSON.stringify(out.freeFit.fajr), '| isha', JSON.stringify(out.freeFit.isha));
console.log('pads', JSON.stringify({ sun: out.freeFit.sunrise.pad, dhuhr: out.freeFit.dhuhr.pad, asr: out.freeFit.asr_shafi.pad, maghrib: out.freeFit.maghrib.pad }));
console.log('recorded recipe total', JSON.stringify(recorded.total));
console.log('  per-column', JSON.stringify(Object.fromEntries(Object.entries(recorded.perColumn).map(([k, v]) => [k, `${v.exactPct}/${v.w1Pct}`]))));
console.log('dhuhr/asr floor   total', JSON.stringify(silentDhuhrAsrFloor.total));
console.log('per-year', JSON.stringify(perYear));
console.log('amplitude', JSON.stringify(amp));
