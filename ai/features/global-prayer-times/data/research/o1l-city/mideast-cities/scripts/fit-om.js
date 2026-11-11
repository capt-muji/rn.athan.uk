// Oman second-city fit: free per-column fits, then the held recipe scored city by city
// across both served years (2026 and 2031).
// Run: TZ=Asia/Muscat node scripts/fit-om.js
const fs = require('fs');
const path = require('path');
const C = process.env.HOME + '/athan-gitree/census';
const L = require(C + '/o1k-wide/deep2/scripts/lib');
const E = require(C + '/o1k-wide/deep2/scripts/engine');

const ROOT = path.join(__dirname, '..');
const CITIES = [
  ['salalah', 55, 17.0151, 54.0924],
  ['sohar', 51, 24.3419, 56.7298],
  ['nizwa', 78, 22.9333, 57.5333],
  ['sur', 56, 22.5667, 59.5289],
  ['ibri', 60, 23.2254, 56.5155],
  ['buraimi', 5, 24.2500, 55.7833],
];
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const tmin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const fmt = (s) => ({ exactPct: +(100 * s.exact / s.n).toFixed(1), w1Pct: +(100 * s.w1 / s.n).toFixed(1), mae: +s.mae.toFixed(3), max: s.maxAbs, n: s.n });

function scoreCity(name, id, lat, lng) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `om-${name}.json`), 'utf8'));
  const days = Object.keys(raw).sort();
  const printed = (k) => (d) => tmin(raw[d][k]);
  const c = L.coords(lat, lng);

  const gridF = E.grid(16.5, 19.6, 0.05);
  const tabF = E.angleTable(c, days, gridF, 'fajr');
  const tabI = E.angleTable(c, days, gridF, 'isha');
  const fajrFit = E.fitAngle(tabF, days, printed('fajr'), [-3, -2, -1, 0, 1, 2, 3]);
  const ishaFit = E.fitAngle(tabI, days, printed('isha'), [-3, -2, -1, 0, 1, 2, 3]);

  const T18 = {}, T18S = {};
  for (const d of days) {
    T18[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: 'hanafi' }, d);
    T18S[d] = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: 'shafi' }, d);
  }

  const sunriseFit = E.fitFixed((d) => T18[d].sunrise, days, printed('sunrise'), [-5, -4, -3, -2, -1, 0, 1, 2]);
  const dhuhrFit = E.fitFixed((d) => T18[d].dhuhr, days, printed('dhuhr'), [2, 3, 4, 5, 6, 7, 8]);
  const asrShafi = E.fitFixed((d) => T18S[d].asr, days, printed('asr'), [2, 3, 4, 5, 6, 7, 8]);
  const asrHanafi = E.fitFixed((d) => T18[d].asr, days, printed('asr'), [2, 3, 4, 5, 6, 7, 8]);
  const maghribFit = E.fitFixed((d) => T18[d].maghrib, days, printed('maghrib'), [2, 3, 4, 5, 6, 7, 8]);

  // the held recipe, one parameterisation, both years
  const held = {};
  const scoreHeld = (subset) => {
    const pairs = {};
    for (const k of COLS) pairs[k] = [];
    for (const d of subset) {
      const t = L.times(c, { fajrAngle: 18, ishaAngle: 18, madhab: 'shafi' }, d);
      const model = {
        fajr: L.roundMin(t.fajr, 0, 'ceil'),
        sunrise: L.roundMin(t.sunrise, 0, 'ceil'),
        dhuhr: L.roundMin(t.dhuhr, 5, 'ceil'),
        asr: L.roundMin(t.asr, 5, 'ceil'),
        maghrib: L.roundMin(t.maghrib, 5, 'ceil'),
        isha: L.roundMin(t.isha, 0, 'ceil'),
      };
      for (const k of COLS) pairs[k].push([printed(k)(d), model[k]]);
    }
    const per = {};
    let all = [];
    for (const k of COLS) { per[k] = fmt(L.score(pairs[k])); all = all.concat(pairs[k]); }
    return { perColumn: per, total: fmt(L.score(all)) };
  };
  held.all = scoreHeld(days);
  held.byYear = {};
  for (const y of [...new Set(days.map((d) => d.slice(0, 4)))]) {
    held.byYear[y] = scoreHeld(days.filter((d) => d.startsWith(y)));
  }

  const amp = {};
  for (const k of COLS) {
    const v = days.map((d) => printed(k)(d));
    const jan = days.filter((d) => d.slice(5, 7) === '01').map((d) => printed(k)(d));
    const jul = days.filter((d) => d.slice(5, 7) === '07').map((d) => printed(k)(d));
    const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
    amp[k] = { peakToPeak: Math.max(...v) - Math.min(...v), jan: med(jan), jul: med(jul), janJul: med(jul) - med(jan) };
  }

  const out = {
    name, cityId: id, lat, lng, rows: days.length,
    span: { from: days[0], to: days[days.length - 1] },
    freeFit: {
      fajr: { theta: fajrFit.theta, pad: fajrFit.pad, mode: fajrFit.mode, score: fmt(fajrFit.s) },
      isha: { theta: ishaFit.theta, pad: ishaFit.pad, mode: ishaFit.mode, score: fmt(ishaFit.s) },
      sunrise: { pad: sunriseFit.pad, mode: sunriseFit.mode, score: fmt(sunriseFit.s) },
      dhuhr: { pad: dhuhrFit.pad, mode: dhuhrFit.mode, score: fmt(dhuhrFit.s) },
      asr_shafi: { pad: asrShafi.pad, mode: asrShafi.mode, score: fmt(asrShafi.s) },
      asr_hanafi: { pad: asrHanafi.pad, mode: asrHanafi.mode, score: fmt(asrHanafi.s) },
      maghrib: { pad: maghribFit.pad, mode: maghribFit.mode, score: fmt(maghribFit.s) },
    },
    held, amplitude: amp,
  };
  console.log(`${name.padEnd(8)} ${out.rows}d free fajr ${fajrFit.theta}${fajrFit.mode === 'ceil' ? '+' : ''}${fajrFit.pad}(${fajrFit.mode}) ${fmt(fajrFit.s).exactPct}/${fmt(fajrFit.s).w1Pct} | isha ${ishaFit.theta}+${ishaFit.pad}(${ishaFit.mode}) ${fmt(ishaFit.s).exactPct}/${fmt(ishaFit.s).w1Pct}`);
  console.log(`         pads sunrise ${sunriseFit.pad}${sunriseFit.mode} dhuhr ${dhuhrFit.pad}${dhuhrFit.mode} asrShafi ${asrShafi.pad}${asrShafi.mode} (hanafi ${asrHanafi.pad}${asrHanafi.mode} ${fmt(asrHanafi.s).w1Pct}) maghrib ${maghribFit.pad}${maghribFit.mode}`);
  console.log(`         held 18/18 +5 ceil: total ${held.all.total.exactPct}%/${held.all.total.w1Pct}% mae ${held.all.total.mae} max ${held.all.total.max} | byYear ${JSON.stringify(Object.fromEntries(Object.entries(held.byYear).map(([y, v]) => [y, v.total.w1Pct])))}`);
  console.log(`         held per-col ${JSON.stringify(Object.fromEntries(Object.entries(held.all.perColumn).map(([k, v]) => [k, v.w1Pct])))}`);
  return out;
}

const res = { job: 'O1l-8 Oman second cities', cities: {} };
for (const [n, id, lat, lng] of CITIES) res.cities[n] = scoreCity(n, id, lat, lng);
fs.writeFileSync(path.join(ROOT, 'data', 'om-six-cities-fit.json'), JSON.stringify(res, null, 1));
