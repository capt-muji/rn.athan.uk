// Residual audit for the Kelantan 1446 poster: best recipe per column, day by day,
// plus the Hanafi-asr control and the zon 2 reference-point solve.
process.env.TZ = 'Asia/Kuala_Lumpur';
const path = require('path');
const A = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));
const { Coordinates, CalculationMethod, PrayerTimes, Madhab, Rounding, HighLatitudeRule } = A;
const D = require('../data/my-ktn-mufti-1446-ramadan.json');

function params(fa, ia, madhab = Madhab.Shafi) {
  const p = CalculationMethod.Other();
  p.fajrAngle = fa; p.ishaAngle = ia; p.madhab = madhab;
  p.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight; p.rounding = Rounding.None;
  return p;
}
const dateOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 12, 0, 0, 0); };
const hhmm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const mo = (dt) => dt.getHours() * 60 + dt.getMinutes() + dt.getSeconds() / 60;

// zon 1 recipe as fitted
const RECIPE = [
  ['subuh', (pt) => pt.fajr, Math.round, 0],
  ['syuruk', (pt) => pt.sunrise, Math.ceil, 0],
  ['zuhur', (pt) => pt.dhuhr, Math.round, 2.5],
  ['asar', (pt) => pt.asr, Math.ceil, 1],
  ['maghrib', (pt) => pt.maghrib, Math.round, 1.5],
  ['isha', (pt) => pt.isha, Math.round, 0],
];
const coord = new Coordinates(6.12, 102.24);
const rows = D.zon1;
const days = Object.keys(rows).sort();

const out = { residuals: [], hanafi: null, zon2Point: null };

for (const d of days) {
  const pt = new PrayerTimes(coord, dateOf(d), params(17.65, 17.4));
  const r = { date: d };
  for (const [col, pick, rf, m] of RECIPE) r[col] = rf(mo(pick(pt)) + m) - hhmm(rows[d][col]);
  out.residuals.push(r);
}

// Hanafi asr control
let hanafiExact = 0, hanafiMae = 0;
for (const d of days) {
  const pt = new PrayerTimes(coord, dateOf(d), params(17.65, 17.4, Madhab.Hanafi));
  const v = Math.ceil(mo(pt.asr) + 1);
  const res = v - hhmm(rows[d].asar);
  if (res === 0) hanafiExact++;
  hanafiMae += Math.abs(res);
}
out.hanafi = { exact: hanafiExact, n: days.length, mae: +(hanafiMae / days.length).toFixed(2) };

// zon 2 reference point: solve lat/lng so that computed sunrise and sunset floor/ceil to print
const z2 = D.zon2;
const d2 = Object.keys(z2).sort();
function score(lat, lng) {
  const c = new Coordinates(lat, lng);
  let s = 0;
  for (const d of d2) {
    const pt = new PrayerTimes(c, dateOf(d), params(17.65, 17.4));
    s += Math.abs(Math.ceil(mo(pt.sunrise)) - hhmm(z2[d].syuruk));
    s += Math.abs(Math.round(mo(pt.maghrib) + 1.5) - hhmm(z2[d].maghrib));
  }
  return s / (2 * d2.length);
}
let best = null;
for (let lat = 4.2; lat <= 6.0; lat += 0.02) {
  for (let lng = 101.2; lng <= 102.3; lng += 0.02) {
    const s = score(lat, lng);
    if (!best || s < best.s) best = { lat: +lat.toFixed(2), lng: +lng.toFixed(2), mae: +s.toFixed(3) };
  }
}
out.zon2Point = best;

console.log(JSON.stringify(out, null, 1));
