// o1n-22 generic front fit: adhan 4.4.6, Rounding.None, zone from arg.
// Usage: node fit_front.js <rows.json> <lat> <lng> <zone> [madhab=shafi]
// Scans angles for fajr/isha (0.25 steps), integer margins elsewhere,
// scores after removing the per-column median residual.
const adhan = require(process.env.HOME + '/athan-gitree/census/adhan-build/node_modules/adhan');
const fs = require('fs');

const [, , rowsPath, latS, lngS, ZONE, madhabArg] = process.argv;
const LAT = parseFloat(latS), LNG = parseFloat(lngS);
const MADHAB = madhabArg === 'hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;

function zoneOffsetMin(dateUTC, zone) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const parts = {};
  for (const p of dtf.formatToParts(dateUTC)) parts[p.type] = p.value;
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  return (asUTC - dateUTC.getTime()) / 60000;
}
function zoneClock(dateUTC, zone) {
  const off = zoneOffsetMin(dateUTC, zone);
  const shifted = new Date(dateUTC.getTime() + off * 60000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes() + shifted.getUTCSeconds() / 60;
}
function timesFor(dateLocal, fajrAng, ishaAng) {
  const coords = new adhan.Coordinates(LAT, LNG);
  const params = adhan.CalculationMethod.Other();
  params.coordinates = coords;
  if (fajrAng != null) params.fajrAngle = fajrAng;
  if (ishaAng != null) params.ishaAngle = ishaAng;
  params.madhab = MADHAB;
  params.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
  const pt = new adhan.PrayerTimes(coords, dateLocal, params);
  const fmt = (d) => d == null ? null : zoneClock(d, ZONE);
  return { fajr: fmt(pt.fajr), sunrise: fmt(pt.sunrise), dhuhr: fmt(pt.dhuhr),
    asr: fmt(pt.asr), maghrib: fmt(pt.maghrib), isha: fmt(pt.isha) };
}
function parseHHMM(s) { if (s == null) return null; const [h, m] = s.split(':').map(Number); return h * 60 + m; }

const doc = JSON.parse(fs.readFileSync(rowsPath, 'utf8'));
const rows = doc.rows.filter(r => r.date && r.fajr != null);

// per column: residuals under the current (fajrAng, ishaAng)
function residuals(fajrAng, ishaAng) {
  const res = { fajr: [], sunrise: [], dhuhr: [], asr: [], maghrib: [], isha: [] };
  const byDate = {};
  for (const r of doc.rows) if (r.date) byDate[r.date] = r;
  for (const r of doc.rows) {
    if (!r.date) continue;
    const [y, m, d] = r.date.split('-').map(Number);
    const t = timesFor(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)), fajrAng, ishaAng);
    for (const col of Object.keys(res)) {
      const v = parseHHMM(r[col]);
      if (v == null || t[col] == null) continue;
      let dd = v - t[col];
      if (dd > 720) dd -= 1440; if (dd < -720) dd += 1440;
      res[col].push(dd);
    }
  }
  return res;
}
function scoreRes(res) {
  const out = {};
  for (const [col, arr] of Object.entries(res)) {
    if (!arr.length) { out[col] = null; continue; }
    const sorted = [...arr].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    const centered = arr.map(d => d - med);
    const exact = centered.filter(d => Math.abs(d) <= 0.5).length;
    const w1 = centered.filter(d => Math.abs(d) <= 1.5).length;
    const worst = Math.max(...centered.map(d => Math.abs(d)));
    out[col] = { margin: Math.round(med), med: +med.toFixed(2), n: arr.length,
      exact: +(100 * exact / arr.length).toFixed(1),
      w1: +(100 * w1 / arr.length).toFixed(1), worst: +worst.toFixed(1) };
  }
  return out;
}

// scan fajr angle (isha fixed placeholder 15) then isha angle (fajr at best)
const fajrAngles = [];
for (let a = 12; a <= 20.01; a += 0.25) fajrAngles.push(+a.toFixed(2));
let bestF = null;
for (const fa of fajrAngles) {
  const s = scoreRes(residuals(fa, 15)).fajr;
  const key = s.w1 * 1000 + s.exact;
  if (!bestF || key > bestF.key) bestF = { fa, key, s };
}
const ishaAngles = [];
for (let a = 11; a <= 20.01; a += 0.25) ishaAngles.push(+a.toFixed(2));
let bestI = null;
for (const ia of ishaAngles) {
  const s = scoreRes(residuals(bestF.fa, ia)).isha;
  const key = s.w1 * 1000 + s.exact;
  if (!bestI || key > bestI.key) bestI = { ia, key, s };
}
const final = scoreRes(residuals(bestF.fa, bestI.ia));
console.log('rows used:', rows.length, 'madhab:', madhabArg || 'shafi');
console.log('fajr angle:', bestF.fa);
console.log('isha angle:', bestI.ia);
console.log(JSON.stringify(final, null, 1));
// internal gap signatures
const byDate = {};
for (const r of doc.rows) if (r.date && r.fajr && r.sunrise && r.maghrib && r.isha) byDate[r.date] = r;
const gapF = [], gapI = [];
for (const r of Object.values(byDate)) {
  gapF.push(parseHHMM(r.sunrise) - parseHHMM(r.fajr));
  gapI.push(parseHHMM(r.isha) - parseHHMM(r.maghrib));
}
const uniqI = [...new Set(gapI)];
console.log('fajr->sunrise gap min/max:', Math.min(...gapF), Math.max(...gapF));
console.log('isha-maghrib uniq deltas:', uniqI.length > 1 ? `${Math.min(...gapI)}..${Math.max(...gapI)} (${uniqI.length})` : `FIXED ${uniqI[0]}`);
