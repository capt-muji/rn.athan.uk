// Iraq Diwan app API: 365 dated rows of 2026 (one national row per date).
// Parse to data, then free-fit each column and score the recorded 18.1+1 / 16.9+1 pair.
// Run: TZ=Asia/Baghdad node scripts/fit-iq.js
const fs = require('fs');
const path = require('path');
const C = process.env.HOME + '/athan-gitree/census';
const L = require(C + '/o1k-wide/deep2/scripts/lib');
const E = require(C + '/o1k-wide/deep2/scripts/engine');

const ROOT = path.join(__dirname, '..');
const DAYS = path.join(ROOT, 'captures', 'iq-days');
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const BAGHDAD = [33.3152, 44.3661];
const OTHERS = [
  ['basra', 30.5085, 47.7804], ['mosul', 36.3350, 43.1189], ['erbil', 36.1911, 44.0092],
  ['kirkuk', 35.4681, 44.3922], ['najaf', 32.0000, 44.3333],
];
const tmin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const fmt = (s) => ({ exactPct: +(100 * s.exact / s.n).toFixed(1), w1Pct: +(100 * s.w1 / s.n).toFixed(1), mae: +s.mae.toFixed(3), max: s.maxAbs, n: s.n });

const raw = {};
for (const f of fs.readdirSync(DAYS).filter((x) => x.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(DAYS, f), 'utf8'));
  if (!j.success) throw new Error('unserved ' + f);
  raw[j.data.date] = j.data;
}
const days = Object.keys(raw).sort();
fs.writeFileSync(path.join(ROOT, 'data', 'iq-baghdad-2026.json'),
  JSON.stringify(Object.fromEntries(days.map((d) => [d, Object.fromEntries(COLS.map((k) => [k, raw[d][k]]))])), null, 1));

const printed = (k) => (d) => tmin(raw[d][k]);
const c = L.coords(BAGHDAD[0], BAGHDAD[1]);
const grid = E.grid(15.5, 19.5, 0.05);
const tabF = E.angleTable(c, days, grid, 'fajr');
const tabI = E.angleTable(c, days, grid, 'isha');
const fajrFit = E.fitAngle(tabF, days, printed('fajr'), [-2, -1, 0, 1, 2, 3]);
const ishaFit = E.fitAngle(tabI, days, printed('isha'), [-2, -1, 0, 1, 2, 3]);

const T = {}, TS = {};
for (const d of days) {
  T[d] = L.times(c, { fajrAngle: 18.1, ishaAngle: 16.9, madhab: 'hanafi' }, d);
  TS[d] = L.times(c, { fajrAngle: 18.1, ishaAngle: 16.9, madhab: 'shafi' }, d);
}
const sunriseFit = E.fitFixed((d) => T[d].sunrise, days, printed('sunrise'), [-4, -3, -2, -1, 0, 1, 2]);
const dhuhrFit = E.fitFixed((d) => T[d].dhuhr, days, printed('dhuhr'), [2, 3, 4, 5, 6, 7, 8]);
const asrFit = E.fitFixed((d) => TS[d].asr, days, printed('asr'), [2, 3, 4, 5, 6, 7, 8]);
const maghribFit = E.fitFixed((d) => T[d].maghrib, days, printed('maghrib'), [2, 3, 4, 5, 6, 7, 8]);

// the recorded recipe, at Baghdad and at each second city's own coordinates
function scoreAt(lat, lon, angles) {
  const cc = L.coords(lat, lon);
  const pairs = {};
  for (const k of COLS) pairs[k] = [];
  for (const d of days) {
    const t = L.times(cc, { fajrAngle: angles.fajr, ishaAngle: angles.isha, madhab: 'shafi' }, d);
    const model = {
      fajr: L.roundMin(t.fajr, 1, 'floor'), sunrise: L.roundMin(t.sunrise, 0, 'floor'),
      dhuhr: L.roundMin(t.dhuhr, 5, 'floor'), asr: L.roundMin(t.asr, 3, 'floor'),
      maghrib: L.roundMin(t.maghrib, 3, 'floor'), isha: L.roundMin(t.isha, 1, 'floor'),
    };
    for (const k of COLS) pairs[k].push([printed(k)(d), model[k]]);
  }
  const per = {};
  let all = [];
  for (const k of COLS) { per[k] = fmt(L.score(pairs[k])); all = all.concat(pairs[k]); }
  return { perColumn: per, total: fmt(L.score(all)) };
}

const out = {
  job: 'O1l-8 Iraq second cities', rows: days.length, span: { from: days[0], to: days[days.length - 1] },
  surfaceNote: 'one national row per date; city/city_id/governorate/lat/lng query params all ignored (identical bytes)',
  freeFit: {
    fajr: { theta: fajrFit.theta, pad: fajrFit.pad, mode: fajrFit.mode, score: fmt(fajrFit.s) },
    isha: { theta: ishaFit.theta, pad: ishaFit.pad, mode: ishaFit.mode, score: fmt(ishaFit.s) },
    sunrise: { pad: sunriseFit.pad, mode: sunriseFit.mode, score: fmt(sunriseFit.s) },
    dhuhr: { pad: dhuhrFit.pad, mode: dhuhrFit.mode, score: fmt(dhuhrFit.s) },
    asr_shafi: { pad: asrFit.pad, mode: asrFit.mode, score: fmt(asrFit.s) },
    maghrib: { pad: maghribFit.pad, mode: maghribFit.mode, score: fmt(maghribFit.s) },
  },
  recorded117: {},
};
out.recorded117.baghdad = scoreAt(BAGHDAD[0], BAGHDAD[1], { fajr: 18.1, isha: 16.9 });
for (const [n, lat, lon] of OTHERS) out.recorded117[n] = scoreAt(lat, lon, { fajr: 18.1, isha: 16.9 });

fs.writeFileSync(path.join(ROOT, 'data', 'iq-fit.json'), JSON.stringify(out, null, 1));
console.log('rows', days.length, days[0], '..', days[days.length - 1]);
console.log('free fajr', JSON.stringify(out.freeFit.fajr), '| isha', JSON.stringify(out.freeFit.isha));
console.log('free pads', JSON.stringify(Object.fromEntries(Object.entries(out.freeFit).slice(2).map(([k, v]) => [k, `${v.pad}${v.mode} ${v.score.w1Pct}`]))));
for (const [k, v] of Object.entries(out.recorded117)) {
  console.log(k.padEnd(8), `exact ${v.total.exactPct}% w1 ${v.total.w1Pct}% mae ${v.total.mae} max ${v.total.max}`);
}
console.log('baghdad per-col', JSON.stringify(Object.fromEntries(Object.entries(out.recorded117.baghdad.perColumn).map(([k, v]) => [k, `${v.exactPct}/${v.w1Pct} mae ${v.mae}`]))));
