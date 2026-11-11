'use strict';
// O1l-B1 HK 2021-2023 fit — c31's exact verifier on the new backward years.
// Recipe: fajr 18.4 truncate; dhuhr +5 nearest; asr Shafi +1; maghrib sunset+3; isha sunset+83.
const fs = require('fs');
const path = require('path');
const adhan = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));

const CAP = path.join(__dirname, '..', 'captures');
const COORDS = [22.30395, 114.17123];
const OFFSET = 480;
const coords = new adhan.Coordinates(COORDS[0], COORDS[1]);

const wallSec = dt => {
  const s = Math.floor(dt.getTime() / 1000 + OFFSET * 60);
  return (((s % 86400) + 86400) % 86400) / 60;
};
const hk12 = str => {
  const m = String(str).trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  let h = Number(m[1]);
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && h !== 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + Number(m[2]);
};
const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

const RECIPE = { fajrAngle: 18.4, dhuhrMargin: 5, asrMargin: 1, maghribMargin: 3, ishaInterval: 83 };

const rows = [];
{
  const j = JSON.parse(fs.readFileSync(path.join(CAP, 'hk-kowloon-2021-2023.json'), 'utf8'));
  for (const s of j.data.salah) {
    const mm = s.date.match(/^\w+,\s+(\w+)\s+(\d+),\s+(\d+)$/);
    const y = Number(mm[3]), mo = MON[mm[1]], d = Number(mm[2]);
    rows.push({
      key: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      y, m: mo, d,
      pub: { fajr: hk12(s.fajr), dhuhr: hk12(s.zuhr), asr: hk12(s.asr), maghrib: hk12(s.maghrib), isha: hk12(s.isha) },
    });
  }
}
rows.sort((a, b) => a.key.localeCompare(b.key));
console.log('rows:', rows.length, 'first:', rows[0].key, 'last:', rows[rows.length - 1].key);

function instants(row) {
  const p = new adhan.CalculationParameters('Other', RECIPE.fajrAngle, 18, 0, 0);
  p.madhab = adhan.Madhab.Shafi;
  p.rounding = adhan.Rounding.None;
  const pt = new adhan.PrayerTimes(coords, new Date(row.y, row.m - 1, row.d), p);
  return { fajr: wallSec(pt.fajr), dhuhr: wallSec(pt.dhuhr), asr: wallSec(pt.asr), sunset: wallSec(pt.sunset) };
}

const PLAN = {
  fajr: t => Math.floor(t.fajr),
  dhuhr: t => Math.round(t.dhuhr + RECIPE.dhuhrMargin),
  asr: t => Math.round(t.asr + RECIPE.asrMargin),
  maghrib: t => Math.round(t.sunset + RECIPE.maghribMargin),
  isha: t => Math.round(t.sunset + RECIPE.ishaInterval),
};

const byYear = {};
for (const row of rows) {
  const t = instants(row);
  const y = row.y;
  byYear[y] = byYear[y] || { n: 0, ex: {}, w1: {}, worst: {}, iv: { clean: 0, off: [] }, im: [] };
  const B = byYear[y];
  B.n++;
  for (const k of Object.keys(PLAN)) {
    const d = Math.abs(row.pub[k] - PLAN[k](t));
    B.ex[k] = (B.ex[k] || 0) + (d === 0 ? 1 : 0);
    B.w1[k] = (B.w1[k] || 0) + (d <= 1 ? 1 : 0);
    B.worst[k] = Math.max(B.worst[k] || 0, d);
  }
  const iv = row.pub.isha - row.pub.maghrib;
  B.im.push(iv);
  if (iv === 80) B.iv.clean++; else B.iv.off.push(`${row.key} iv=${iv}`);
}
for (const y of Object.keys(byYear).sort()) {
  const B = byYear[y];
  const cols = Object.keys(PLAN).map(k => `${k} ${B.ex[k]}/${B.n} e, w1 ${B.w1[k]}, worst ${B.worst[k]}`).join(' | ');
  const ivCounts = {};
  for (const v of B.im) ivCounts[v] = (ivCounts[v] || 0) + 1;
  console.log(`\n${y} n=${B.n}: ${cols}\n  isha-maghrib histogram: ${JSON.stringify(ivCounts)}  off-days: ${B.iv.off.length}`);
  if (B.iv.off.length) console.log('  off sample:', B.iv.off.slice(0, 12).join(', '));
}
