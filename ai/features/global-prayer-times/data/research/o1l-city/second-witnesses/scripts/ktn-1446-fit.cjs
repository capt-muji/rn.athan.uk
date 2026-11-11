// Kelantan Ramadan 1446 (2025) poster vs the banked 1441 recipe. adhan 4.4.6, TZ pinned.
// Sweeps angle (twilight columns), margin and rounding per column, and reports the best
// combos plus the implied depth band each printed minute admits.
process.env.TZ = 'Asia/Kuala_Lumpur';
const path = require('path');
const A = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding, HighLatitudeRule } = A;
const D = require('../data/my-ktn-mufti-1446-ramadan.json');

const POINTS = {
  'KotaBharu 6.1200,102.2400': [6.12, 102.24],
  'JAKIM-KTN01 6.1254,102.2381': [6.1254, 102.2381],
};

function params(fajrAngle, ishaAngle) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fajrAngle;
  p.ishaAngle = ishaAngle;
  p.madhab = Madhab.Shafi;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight; // never triggers at 6 N
  p.rounding = Rounding.None;
  return p;
}
const dateOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 12, 0, 0, 0); };
const hhmm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const minutesOf = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;
const rounders = {
  floor: (v) => Math.floor(v),
  ceil: (v) => Math.ceil(v),
  nearest: (v) => Math.round(v),
};
const median = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

function bestForColumn(coord, days, printed, pick, angles) {
  const results = [];
  for (const ang of angles) {
    for (const [rname, rf] of Object.entries(rounders)) {
      for (let m = -4; m <= 4; m += 0.5) {
        let exact = 0, w1 = 0, abs = 0, worst = 0;
        for (let i = 0; i < days.length; i++) {
          const pt = new PrayerTimes(coord, dateOf(days[i]), params(ang ?? 18, ang ?? 17));
          const v = rf(minutesOf(pick(pt)) + m);
          const r = v - printed[i];
          if (r === 0) exact++;
          if (Math.abs(r) <= 1) w1++;
          abs += Math.abs(r);
          worst = Math.max(worst, Math.abs(r));
        }
        results.push({ angle: ang, rounding: rname, margin: m, exact, within1: w1, mae: +(abs / days.length).toFixed(2), worst, n: days.length });
      }
    }
  }
  results.sort((a, b) => b.exact - a.exact || a.mae - b.mae || Math.abs(a.margin) - Math.abs(b.margin));
  return results.slice(0, 4);
}

const angleGrid = [];
for (let a = 15.0; a <= 20.0001; a += 0.05) angleGrid.push(+a.toFixed(2));

const out = { engine: 'adhan 4.4.6', tz: 'Asia/Kuala_Lumpur', zones: {} };
for (const zone of ['zon1', 'zon2']) {
  const rows = D[zone];
  const days = Object.keys(rows).sort();
  const z = { days: days.length, columns: {}, checks: {} };

  const imsak = [...new Set(days.map((d) => hhmm(rows[d].subuh) - hhmm(rows[d].imsak)))];
  z.checks.imsakMinusSubuh = imsak;
  const iv = days.map((d) => hhmm(rows[d].isha) - hhmm(rows[d].maghrib));
  z.checks.ishaMinusMaghrib = { min: Math.min(...iv), max: Math.max(...iv), median: median(iv) };

  if (zone === 'zon2') {
    const d1 = D.zon1, delta = {};
    for (const col of ['subuh', 'syuruk', 'zuhur', 'asar', 'maghrib', 'isha']) {
      const v = days.map((d) => hhmm(rows[d][col]) - hhmm(d1[d][col]));
      delta[col] = { min: Math.min(...v), max: Math.max(...v), median: median(v) };
    }
    z.checks.zon2MinusZon1 = delta;
  }

  for (const [pname, [lat, lng]] of Object.entries(POINTS)) {
    const coord = new Coordinates(lat, lng);
    const pc = {};
    const printed = (col) => days.map((d) => hhmm(rows[d][col]));
    const cols = [
      ['subuh', (pt) => pt.fajr, angleGrid],
      ['syuruk', (pt) => pt.sunrise, [null]],
      ['zuhur', (pt) => pt.dhuhr, [null]],
      ['asar', (pt) => pt.asr, [null]],
      ['maghrib', (pt) => pt.maghrib, [null]],
      ['isha', (pt) => pt.isha, angleGrid],
    ];
    for (const [col, pick, grid] of cols) pc[col] = bestForColumn(coord, days, printed(col), pick, grid);
    z.columns[pname] = pc;

    // implied depth: the angle band whose unrounded twilight time floors to the printed minute
    const bands = { subuh: [], isha: [] };
    for (const d of days) {
      for (const [col, isFajr] of [['subuh', true], ['isha', false]]) {
        const target = hhmm(rows[d][col]);
        const solve = (t) => {
          let lo = 12, hi = 22;
          for (let i = 0; i < 50; i++) {
            const mid = (lo + hi) / 2;
            const pt = new PrayerTimes(coord, dateOf(d), params(isFajr ? mid : 18, isFajr ? 17 : mid));
            const v = minutesOf(isFajr ? pt.fajr : pt.isha);
            const laterWithBiggerAngle = !isFajr;
            if (laterWithBiggerAngle ? v > t : v < t) hi = mid; else lo = mid;
          }
          return (lo + hi) / 2;
        };
        // printed is a floor, so the true instant sits in [target, target+1)
        const a = solve(target), b = solve(target + 1);
        bands[col].push([Math.min(a, b), Math.max(a, b)]);
      }
    }
    z.implied = z.implied || {};
    z.implied[pname] = {};
    for (const col of ['subuh', 'isha']) {
      const bs = bands[col];
      z.implied[pname][col] = {
        lo: +Math.min(...bs.map((b) => b[0])).toFixed(2),
        hi: +Math.max(...bs.map((b) => b[1])).toFixed(2),
        medianMid: +median(bs.map((b) => (b[0] + b[1]) / 2)).toFixed(2),
        medianWidth: +median(bs.map((b) => b[1] - b[0])).toFixed(3),
      };
    }
  }
  out.zones[zone] = z;
}
console.log(JSON.stringify(out, null, 1));
