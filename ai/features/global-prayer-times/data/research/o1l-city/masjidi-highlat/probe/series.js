'use strict';
// Daily published series for a high-lat table, spring through autumn.
const fs = require('fs');
const SRC = process.env.HOME + '/athan-gitree/census/o1l-city/masjidi/data/tables';
const id = process.argv[2] || '394';
function mins(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }
const d = JSON.parse(fs.readFileSync(`${SRC}/table_${id}.json`, 'utf8'));
const keys = Object.keys(d.days).sort();
let prev = null;
for (const k of keys) {
  const mo = Number(k.split('-')[1]), dd = Number(k.split('-')[2]);
  if (mo < 3 || mo > 10) continue;
  const r = d.days[k];
  const f = mins(r.fajr), sr = mins(r.sunrise), m = mins(r.maghrib), i = mins(r.isha);
  const noon = (sr + m) / 2;
  const N = 1440 - (m - sr);
  const mid = (noon + 720) % 1440;
  console.log(`${k} sr ${String(sr).padStart(4)} fajr ${String(f).padStart(4)} (${String(sr - f).padStart(3)})  magh ${String(m).padStart(4)} isha ${String(i).padStart(4)} (${String(i - m).padStart(3)})  N ${String(N).padStart(4)} mid ${mid.toFixed(0).padStart(4)}  f-mid ${(f - mid).toFixed(0).padStart(5)}  sr-mid ${(sr - mid).toFixed(0).padStart(4)}`);
}
