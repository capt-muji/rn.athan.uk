// o1n-22 KBR fit: twilight columns are angle curves with fixed-minute floors.
// Table shape: fajr gap = max(angle_gap, 90), isha gap = max(angle_gap, 100).
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');
const doc = JSON.parse(fs.readFileSync(__dirname + '/kbr_nalchik_2025.json', 'utf8'));
const LAT = 43.4989, LNG = 43.6189, ZONE = 'Europe/Moscow';

function zoneClock(dateUTC) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const p = {};
  for (const x of dtf.formatToParts(dateUTC)) p[x.type] = x.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
  const off = (asUTC - dateUTC.getTime()) / 60000;
  const s = new Date(dateUTC.getTime() + off * 60000);
  return s.getUTCHours() * 60 + s.getUTCMinutes() + s.getUTCSeconds() / 60;
}
function pm(s) { if (s == null) return null; const [h, m] = s.split(':').map(Number); return h * 60 + m; }

const coords = new adhan.Coordinates(LAT, LNG);
function dayModel(y, mo, d, madhab, fajrAng, ishaAng, floorF, floorI, mSunrise, mDhuhr, mMaghrib) {
  const p = adhan.CalculationMethod.Other();
  p.coordinates = coords;
  p.fajrAngle = fajrAng; p.ishaAngle = ishaAng;
  p.madhab = madhab;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  const t = new adhan.PrayerTimes(coords, new Date(Date.UTC(y, mo - 1, d, 12)), p);
  const sr = zoneClock(t.sunrise), mg = zoneClock(t.maghrib);
  return {
    fajr: Math.min(zoneClock(t.fajr), sr - floorF),
    sunrise: sr + mSunrise,
    dhuhr: zoneClock(t.dhuhr) + mDhuhr,
    asr: zoneClock(t.asr),
    maghrib: mg + mMaghrib,
    isha: Math.max(zoneClock(t.isha), mg + floorI),
  };
}
function score(madhab, fa, ia, fF, fI, mS, mD, mM) {
  const out = {};
  for (const col of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) out[col] = [];
  for (const r of doc.rows) {
    const [y, mo, d] = r.date.split('-').map(Number);
    const t = dayModel(y, mo, d, madhab, fa, ia, fF, fI, mS, mD, mM);
    for (const col of Object.keys(out)) {
      const v = pm(r[col]);
      if (v == null) continue;
      let dd = v - t[col];
      if (dd > 720) dd -= 1440; if (dd < -720) dd += 1440;
      out[col].push(dd);
    }
  }
  const res = {};
  for (const [col, arr] of Object.entries(out)) {
    if (!arr.length) { res[col] = null; continue; }
    const s = [...arr].sort((a, b) => a - b);
    const med = s[Math.floor(arr.length / 2)];
    const c = arr.map(x => x - med);
    res[col] = { margin: Math.round(med), n: arr.length,
      exact: +(100 * c.filter(x => Math.abs(x) <= 0.5).length / arr.length).toFixed(1),
      w1: +(100 * c.filter(x => Math.abs(x) <= 1.5).length / arr.length).toFixed(1),
      worst: Math.max(...c.map(x => Math.abs(x))).toFixed(1) };
  }
  return res;
}
function total(res) {
  let t = 0;
  for (const col of ['fajr', 'isha']) t += res[col].w1 * 100 + res[col].exact;
  return t;
}
let best = null;
for (let fa = 14.5; fa <= 19.01; fa += 0.25) {
  const r = score(adhan.Madhab.Shafi, fa, 15, 90, 100, 0, 0, 0);
  const k = r.fajr.w1 * 100 + r.fajr.exact;
  if (!best || k > best.k) best = { fa, k };
}
let bestI = null;
for (let ia = 13; ia <= 18.01; ia += 0.25) {
  const r = score(adhan.Madhab.Shafi, best.fa, ia, 90, 100, 0, 0, 0);
  const k = r.isha.w1 * 100 + r.isha.exact;
  if (!bestI || k > bestI.k) bestI = { ia, k };
}
const angles = { fa: best.fa, ia: bestI.ia };
// asr madhab + solar margins on the best angles
let best2 = null;
for (const mad of [adhan.Madhab.Shafi, adhan.Madhab.Hanafi])
  for (let mS = -3; mS <= 3; mS++)
    for (let mD = 0; mD <= 12; mD++)
      for (let mM = -3; mM <= 6; mM++) {
        const r = score(mad, angles.fa, angles.ia, 90, 100, mS, mD, mM);
        const k = r.asr.exact * 100 + r.asr.w1 + r.sunrise.exact + r.dhuhr.exact + r.maghrib.exact;
        if (!best2 || k > best2.k) best2 = { mad: mad === adhan.Madhab.Shafi ? 'shafi' : 'hanafi', mS, mD, mM, k, r };
      }
console.log('angles:', angles.fa, angles.ia, 'floors 90/100');
console.log('solar:', best2.mad, 'mSun', best2.mS, 'mDhuhr', best2.mD, 'mMagh', best2.mM);
console.log(JSON.stringify(best2.r, null, 1));
