'use strict';
// Era parameter scans for HK 2022-10..12 and 2023 classes.
const fs = require('fs');
const path = require('path');
const adhan = require(path.join(process.env.HOME, 'athan-gitree/census/adhan-build/node_modules/adhan'));
const CAP = path.join(__dirname, '..', 'captures');
const coords = new adhan.Coordinates(22.30395, 114.17123);
const wallSec = dt => { const s = Math.floor(dt.getTime() / 1000 + 480 * 60); return (((s % 86400) + 86400) % 86400) / 60; };
const hk12 = str => { const m = String(str).trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i); let h = Number(m[1]); const ap = m[3].toUpperCase(); if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0; return h * 60 + Number(m[2]); };
const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const j = JSON.parse(fs.readFileSync(path.join(CAP, 'hk-kowloon-2021-2023.json'), 'utf8'));
const rows = j.data.salah.map(s => {
  const mm = s.date.match(/^\w+,\s+(\w+)\s+(\d+),\s+(\d+)$/);
  return { key: `${mm[3]}-${String(MON[mm[1]]).padStart(2, '0')}-${String(mm[2]).padStart(2, '0')}`,
    y: Number(mm[3]), m: MON[mm[1]], d: Number(mm[2]),
    pub: { fajr: hk12(s.fajr), dhuhr: hk12(s.zuhr), asr: hk12(s.asr), maghrib: hk12(s.maghrib), isha: hk12(s.isha) } };
}).sort((a, b) => a.key.localeCompare(b.key));

function inst(row, fajrAngle, madhab) {
  const p = new adhan.CalculationParameters('Other', fajrAngle, 18, 0, 0);
  p.madhab = madhab; p.rounding = adhan.Rounding.None;
  const pt = new adhan.PrayerTimes(coords, new Date(row.y, row.m - 1, row.d), p);
  return { fajr: wallSec(pt.fajr), dhuhr: wallSec(pt.dhuhr), asr: wallSec(pt.asr), sunset: wallSec(pt.sunset) };
}

function scan(lo, hi, label) {
  const set = rows.filter(r => r.key >= lo && r.key <= hi);
  const out = {};
  for (const fa of [17.5, 17.8, 18.0, 18.2, 18.4]) {
    for (const mm of [0, 1, 2, 3]) {
      for (const school of ['Shafi', 'Hanafi']) {
        let exF = 0, exA = 0, exM = 0, n = 0, imSum = 0;
        const ivs = [];
        for (const r of set) {
          const t = inst(r, fa, school === 'Shafi' ? adhan.Madhab.Shafi : adhan.Madhab.Hanafi);
          const pf = fa === 18.4 ? Math.floor(t.fajr) : Math.floor(t.fajr);
          const pa = Math.round(t.asr + 1);
          const pm = Math.round(t.sunset + mm);
          if (r.pub.fajr === pf) exF++;
          if (r.pub.asr === pa) exA++;
          if (r.pub.maghrib === pm) exM++;
          ivs.push(r.pub.isha - r.pub.maghrib);
          n++;
        }
        out[`${fa}/${school}/m+${mm}`] = { exF, exA, exM, n, ivMin: Math.min(...ivs), ivMax: Math.max(...ivs) };
      }
    }
  }
  const best = Object.entries(out).sort((a, b) => (b[1].exA + b[1].exM + b[1].exF) - (a[1].exA + a[1].exM + a[1].exF)).slice(0, 4);
  console.log(`\n== ${label} (${lo}..${hi}, n=${set.length}) top4 ==`);
  for (const [k, v] of best) console.log(`  ${k}: fajrExact ${v.exF}/${v.n} asrExact ${v.exA} maghribExact ${v.exM} iv ${v.ivMin}..${v.ivMax}`);
}

scan('2022-10-01', '2022-12-31', 'Era2 2022 Oct-Dec (suspected Hanafi/maghrib+0)');
scan('2023-01-01', '2023-02-28', 'Era3a 2023 Jan-Feb (maghrib suspect)');
scan('2023-05-01', '2023-07-31', 'Era3-clean 2023 May-Jul');
scan('2023-08-01', '2023-12-31', 'Era3d 2023 Aug-Dec (fajr +2 suspect)');
