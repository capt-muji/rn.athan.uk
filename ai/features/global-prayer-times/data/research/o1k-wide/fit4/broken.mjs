// Find the broken rows: per-town fajr residuals vs 18 deg + LUPT dhuhr diffs.
// Run: TZ=Europe/London node broken.mjs
import fs from 'node:fs';
import { loadTable, makeContext } from './engine.mjs';

const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1k-wide/uktowns2/data/';
const town = process.argv[2] ?? 'reading-aisha-ics';
const cfgs = {
  'reading-aisha-ics': { file: D + 'reading-amic-2026.json', cols: { fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' }, lat: 51.4543, lng: -0.9781 },
  'coventry-zeenatul': { file: D + 'coventry-zeenatul-islam-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' }, lat: 52.4068, lng: -1.5197 },
  'rochdale-golden': { file: D + 'rochdale-golden-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' }, lat: 53.6097, lng: -2.1561 },
  'bolton-zakariyya': { file: D + 'bolton-zakariyya-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' }, lat: 53.5769, lng: -2.4282 },
};
const cfg = cfgs[town];
const t = loadTable(cfg);
const ctx = await makeContext(cfg.lat, cfg.lng, t.slots);
const fmt = (v) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;

console.log(`== ${town} fajr residual vs 18 deg (chart - computed), months with |res|>30 on >3 days:`);
const byMonth = {};
for (let i = 0; i < t.slots.length; i++) {
  const sec = ctx.pairSec(i, 18, 15, null).f;
  if (sec === null) continue;
  const res = t.slots[i].chart.fajr - sec / 60;
  (byMonth[t.slots[i].key.slice(0, 7)] ??= []).push([t.slots[i].key, res, t.slots[i].chart.fajr]);
}
for (const [mo, arr] of Object.entries(byMonth)) {
  const bad = arr.filter((x) => Math.abs(x[1]) > 30);
  console.log(`${mo}: n=${arr.length} bad=${bad.length}  median ${(arr.map((x) => x[1]).sort((a, b) => a - b)[Math.floor(arr.length / 2)]).toFixed(1)}`);
  for (const [k, r, c] of bad.slice(0, 6)) console.log(`   ${k} chart ${fmt(c)} res ${r.toFixed(0)}`);
}

if (town === 'reading-aisha-ics') {
  const lu = {};
  for (const mo of ['01', '02', '04', '07', '11', '12']) {
    const d = JSON.parse(fs.readFileSync(`${D}lupt-2027-${mo}.json`, 'utf8'));
    for (const [k, row] of Object.entries(d)) lu[k.slice(5)] = row;
  }
  const data = JSON.parse(fs.readFileSync(cfg.file, 'utf8'));
  console.log('\n== LUPT dhuhr diff rows with |diff|>30:');
  for (const [k, row] of Object.entries(data)) {
    const l = lu[k.slice(5)];
    if (!l) continue;
    const a = String(row.dhuhr).trim(), b = String(l.dhuhr).trim();
    const pm = (v, p) => { let h = parseInt(v.slice(0, v.indexOf(':')), 10); const m = parseInt(v.slice(-2)); if (p && h < 12) h += 12; return h * 60 + m; };
    const diff = pm(a, false) - pm(b, false);
    if (Math.abs(diff) > 30) console.log(`  ${k} town ${a} lupt ${b} diff ${diff}`);
  }
}
