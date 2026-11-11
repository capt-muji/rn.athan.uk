'use strict';
// Era analysis: per month of 2021-2023, which prayer deviates and by how much.
const fs = require('fs');
const path = require('path');
const adhan = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));

const CAP = path.join(__dirname, '..', 'captures');
const COORDS = [22.30395, 114.17123], OFFSET = 480;
const coords = new adhan.Coordinates(COORDS[0], COORDS[1]);
const wallSec = dt => { const s = Math.floor(dt.getTime() / 1000 + OFFSET * 60); return (((s % 86400) + 86400) % 86400) / 60; };
const hk12 = str => { const m = String(str).trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i); let h = Number(m[1]); const ap = m[3].toUpperCase(); if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0; return h * 60 + Number(m[2]); };
const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

const j = JSON.parse(fs.readFileSync(path.join(CAP, 'hk-kowloon-2021-2023.json'), 'utf8'));
const rows = j.data.salah.map(s => {
  const mm = s.date.match(/^\w+,\s+(\w+)\s+(\d+),\s+(\d+)$/);
  const y = Number(mm[3]), m = MON[mm[1]], d = Number(mm[2]);
  return { key: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, y, m, d,
    pub: { fajr: hk12(s.fajr), sunrise: hk12(s.sunrise), dhuhr: hk12(s.zuhr), asr: hk12(s.asr), maghrib: hk12(s.maghrib), isha: hk12(s.isha) } };
}).sort((a, b) => a.key.localeCompare(b.key));

function instants(row, fajrAngle) {
  const p = new adhan.CalculationParameters('Other', fajrAngle, 18, 0, 0);
  p.madhab = adhan.Madhab.Shafi;
  p.rounding = adhan.Rounding.None;
  const pt = new adhan.PrayerTimes(coords, new Date(row.y, row.m - 1, row.d), p);
  return { fajr: wallSec(pt.fajr), sunrise: wallSec(pt.sunrise), dhuhr: wallSec(pt.dhuhr), asr: wallSec(pt.asr), sunset: wallSec(pt.sunset) };
}

// per-month mean residual for each prayer under the standing recipe, plus alt-asr (Hanafi) and alt-fajr scans
const months = {};
for (const row of rows) {
  const t = instants(row, 18.4);
  const th = JSON.parse(JSON.stringify(row)); // Hanafi asr
  const p2 = new adhan.CalculationParameters('Other', 18.4, 18, 0, 0);
  p2.madhab = adhan.Madhab.Hanafi; p2.rounding = adhan.Rounding.None;
  const pt2 = new adhan.PrayerTimes(coords, new Date(row.y, row.m - 1, row.d), p2);
  const tHanafi = { asr: wallSec(pt2.asr) };
  const k = row.key.slice(0, 7);
  months[k] = months[k] || { n: 0, res: {}, hanafiAsr: [], iv: {} };
  const B = months[k];
  B.n++;
  B.res.fajr = (B.res.fajr || 0) + (row.pub.fajr - Math.floor(t.fajr));
  B.res.dhuhr = (B.res.dhuhr || 0) + (row.pub.dhuhr - Math.round(t.dhuhr + 5));
  B.res.asr = (B.res.asr || 0) + (row.pub.asr - Math.round(t.asr + 1));
  B.res.asrHanafi = (B.res.asrHanafi || 0) + (row.pub.asr - Math.round(tHanafi.asr + 1));
  B.res.maghrib = (B.res.maghrib || 0) + (row.pub.maghrib - Math.round(t.sunset + 3));
  const iv = row.pub.isha - row.pub.maghrib;
  B.iv[iv] = (B.iv[iv] || 0) + 1;
}
for (const k of Object.keys(months).sort()) {
  const B = months[k];
  const r = Object.fromEntries(Object.entries(B.res).map(([kk, v]) => [kk, (v / B.n).toFixed(2)]));
  console.log(`${k} n=${B.n} meanRes fajr=${r.fajr} dhuhr=${r.dhuhr} asrShafi=${r.asr} asrHanafi=${r.asrHanafi} maghrib=${r.maghrib} ivHist=${JSON.stringify(B.iv)}`);
}
