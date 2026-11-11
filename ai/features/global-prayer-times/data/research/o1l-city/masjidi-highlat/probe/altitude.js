'use strict';
// For each high-lat table: published fajr/isha altitude, and the interval structure.
const fs = require('fs');
const { altAt } = require('./solar');
const SRC = process.env.HOME + '/athan-gitree/census/o1l-city/masjidi/data/tables';
const T = { 394: [59.86, 9.99, 60], 444: [59.12, 10.36, 60], 5587: [59.83, 15.75, 60], 5622: [58.39, 13.15, 60], 1641: [50.31, 4.41, 60] };

function mins(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }

for (const [id, [lat, lon, off]] of Object.entries(T)) {
  const d = JSON.parse(fs.readFileSync(`${SRC}/table_${id}.json`, 'utf8'));
  const keys = Object.keys(d.days).sort();
  const rows = keys.map(k => {
    const r = d.days[k];
    const [y, mo, dd] = k.split('-').map(Number);
    const f = mins(r.fajr), sr = mins(r.sunrise), m = mins(r.maghrib), i = mins(r.isha);
    return {
      k, y, mo, dd, f, sr, m, i,
      fInt: sr - f, iInt: i - m,
      fAlt: altAt(lat, lon, y, mo, dd, f, off),
      iAlt: altAt(lat, lon, y, mo, dd, i, off),
    };
  });
  console.log(`\n===== table ${id} lat ${lat} =====`);
  console.log('date       fajr  sr    fInt  fAlt    isha  magh  iInt  iAlt');
  for (const r of rows) {
    if (r.dd % 10 === 5) {
      console.log(`${r.k} ${String(r.f).padStart(5)} ${String(r.sr).padStart(4)} ${String(r.fInt).padStart(5)} ${r.fAlt.toFixed(1).padStart(6)}  ${String(r.i).padStart(5)} ${String(r.m).padStart(5)} ${String(r.iInt).padStart(5)} ${r.iAlt.toFixed(1).padStart(6)}`);
    }
  }
  const altF = rows.map(r => r.fAlt), altI = rows.map(r => r.iAlt);
  const q = a => { const s = [...a].sort((x, y) => x - y); return [s[0], s[Math.floor(s.length / 4)], s[Math.floor(s.length / 2)], s[Math.floor(s.length * 3 / 4)], s[s.length - 1]]; };
  console.log('fAlt min/q1/med/q3/max', q(altF).map(x => x.toFixed(1)).join(' '));
  console.log('iAlt min/q1/med/q3/max', q(altI).map(x => x.toFixed(1)).join(' '));
  console.log('fInt min/max', Math.min(...rows.map(r => r.fInt)), Math.max(...rows.map(r => r.fInt)));
  console.log('iInt min/max', Math.min(...rows.map(r => r.iInt)), Math.max(...rows.map(r => r.iInt)));
}
