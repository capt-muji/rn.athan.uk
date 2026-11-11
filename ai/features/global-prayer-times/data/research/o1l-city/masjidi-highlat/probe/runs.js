'use strict';
// Detect constant-clock runs in fajr / isha and the interval floor, for every high-lat table.
const fs = require('fs');
const SRC = process.env.HOME + '/athan-gitree/census/o1l-city/masjidi/data/tables';
const IDS = (process.argv[2] || '394,444,5587,5622,1641').split(',');
function mins(s) { const [h, m] = s.split(':').map(Number); return h * 60 + m; }

for (const id of IDS) {
  const d = JSON.parse(fs.readFileSync(`${SRC}/table_${id}.json`, 'utf8'));
  const keys = Object.keys(d.days).sort();
  const rows = keys.map(k => {
    const r = d.days[k];
    return { k, f: mins(r.fajr), sr: mins(r.sunrise), m: mins(r.maghrib), i: mins(r.isha) };
  });
  console.log(`\n===== table ${id} (${d.meta.country}) =====`);
  for (const [name, get] of [['fajr', r => r.f], ['isha', r => r.i], ['sunrise', r => r.sr]]) {
    let runs = [];
    let s = 0;
    for (let i = 1; i <= rows.length; i++) {
      if (i === rows.length || get(rows[i]) !== get(rows[s])) {
        if (i - s >= 4) runs.push(`${rows[s].k}..${rows[i - 1].k} = ${get(rows[s])} (${i - s}d)`);
        s = i;
      }
    }
    console.log(`  ${name} constant runs >=4d: ${runs.length ? '\n    ' + runs.join('\n    ') : 'none'}`);
  }
  const fi = rows.map(r => r.sr - r.f), ii = rows.map(r => r.i - r.m);
  const runsOf = (arr, pred, label) => {
    let out = [], s = null;
    for (let i = 0; i <= arr.length; i++) {
      const ok = i < arr.length && pred(arr[i]);
      if (ok && s === null) s = i;
      if (!ok && s !== null) { if (i - s >= 3) out.push(`${rows[s].k}..${rows[i - 1].k} (${i - s}d) val ${arr[s]}`); s = null; }
    }
    return out;
  };
  console.log(`  fajr interval floor 60 runs: ${runsOf(fi, v => v === 60).join('; ') || 'none'}`);
  console.log(`  isha interval floor 40 runs: ${runsOf(ii, v => v === 40).join('; ') || 'none'}`);
  console.log(`  fajr interval min ${Math.min(...fi)} max ${Math.max(...fi)}; isha interval min ${Math.min(...ii)} max ${Math.max(...ii)}`);
}
