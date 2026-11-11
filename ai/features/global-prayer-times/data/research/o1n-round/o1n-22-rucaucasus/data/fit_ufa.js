// o1n-22 Ufa fit: angle twilight with white-nights clamp (fallback window -> +-90 min).
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');
const doc = JSON.parse(fs.readFileSync(__dirname + '/dumrb_ufa_2026.json', 'utf8'));
const LAT = 54.7352, LNG = 55.9587, ZONE = 'Asia/Yekaterinburg';
const coords = new adhan.Coordinates(LAT, LNG);
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
function model(y, mo, d, fa, ia, mD) {
  const p = adhan.CalculationMethod.Other();
  p.coordinates = coords; p.fajrAngle = fa; p.ishaAngle = ia;
  p.madhab = adhan.Madhab.Hanafi;
  p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  const t = new adhan.PrayerTimes(coords, new Date(Date.UTC(y, mo - 1, d, 12)), p);
  const sr = zoneClock(t.sunrise), mg = zoneClock(t.maghrib);
  const ishaRaw = zoneClock(t.isha);
  const fallback = ishaRaw - mg > 180;
  return {
    suhur: null, fajr: fallback ? sr - 90 : zoneClock(t.fajr),
    sunrise: sr, dhuhr: zoneClock(t.dhuhr) + mD, asr: zoneClock(t.asr),
    maghrib: mg, isha: fallback ? mg + 90 : ishaRaw,
  };
}
function score(fa, ia, mD) {
  const out = {};
  for (const col of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) out[col] = [];
  for (const r of doc.rows) {
    const [y, mo, d] = r.date.split('-').map(Number);
    const t = model(y, mo, d, fa, ia, mD);
    for (const col of Object.keys(t)) {
      const v = pm(r[col]);
      if (v == null || t[col] == null) continue;
      let dd = v - t[col];
      if (dd > 720) dd -= 1440; if (dd < -720) dd += 1440;
      out[col].push(dd);
    }
  }
  const res = {};
  for (const [col, arr] of Object.entries(out)) {
    const s = [...arr].sort((a, b) => a - b);
    const med = s[Math.floor(arr.length / 2)];
    const c = arr.map(x => x - med);
    res[col] = { margin: Math.round(med), n: arr.length,
      exact: +(100 * c.filter(x => Math.abs(x) <= 0.5).length / arr.length).toFixed(1),
      w1: +(100 * c.filter(x => Math.abs(x) <= 1.5).length / arr.length).toFixed(1),
      worst: +Math.max(...c.map(x => Math.abs(x))).toFixed(1) };
  }
  return res;
}
let best = null;
for (let fa = 14; fa <= 19.01; fa += 0.25) {
  const r = score(fa, fa - 1, 0);
  const k = r.fajr.w1 * 3 + r.fajr.exact + r.isha.w1;
  if (!best || k > best.k) best = { fa, k, r };
}
let bestD = null;
for (let mD = 0; mD <= 20; mD++) {
  const r = score(best.fa, best.fa - 1, mD);
  const k = r.dhuhr.exact * 100 + r.dhuhr.w1;
  if (!bestD || k > bestD.k) bestD = { mD, k };
}
console.log('fajr angle:', best.fa, '(isha', best.fa - 1, ') dhuhr margin', bestD.mD);
console.log(JSON.stringify(score(best.fa, best.fa - 1, bestD.mD), null, 1));
