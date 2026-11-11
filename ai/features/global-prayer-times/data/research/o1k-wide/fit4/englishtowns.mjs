// Job 2: the English Hanafi towns - Reading, Coventry, Rochdale, Bolton.
// Free fit + candidates; LUPT monthly pages (2027) as same-MM-DD reference.
// Run: TZ=Europe/London node englishtowns.mjs
import fs from 'node:fs';
import { fitTable, printTable, pmFlag, parseCol } from './engine.mjs';

const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1k-wide/uktowns2/data/';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit4/uktowns-fit.json';

const candidates = [
  { name: 'Wifaqul 18/15 caps 1/2+1/7', fa: 18, is: 15, portions: { fajr: 1 / 2, isha: 1 / 7 } },
  { name: 'Wifaqul 18/15 bare', fa: 18, is: 15 },
  { name: 'MWL 18/17 bare', fa: 18, is: 17 },
  { name: 'Diyanet-Europe 18/16 bare', fa: 18, is: 16 },
  { name: 'Karachi 18/18 bare', fa: 18, is: 18 },
];

const tables = [
  { tag: 'reading-aisha-ics', file: D + 'reading-amic-2026.json', cols: { fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' }, lat: 51.4543, lng: -0.9781, tz: 'Europe/London' },
  { tag: 'coventry-zeenatul', file: D + 'coventry-zeenatul-islam-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' }, lat: 52.4068, lng: -1.5197, tz: 'Europe/London' },
  { tag: 'rochdale-golden', file: D + 'rochdale-golden-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' }, lat: 53.6097, lng: -2.1561, tz: 'Europe/London' },
  { tag: 'bolton-zakariyya', file: D + 'bolton-zakariyya-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' }, lat: 53.5769, lng: -2.4282, tz: 'Europe/London' },
];

const out = { job: 'uktowns', meta: { adhan: '4.4.6', luptReference: 'lupt-2027-{01,02,04,07,11,12} same-MM-DD diffs' }, tables: [] };
for (const t of tables) {
  const res = await fitTable(t, candidates);
  out.tables.push(res);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  printTable(res);
}

// LUPT same-MM-DD reference diffs for each town
const luptByMMDD = {};
for (const mo of ['01', '02', '04', '07', '11', '12']) {
  const d = JSON.parse(fs.readFileSync(`${D}lupt-2027-${mo}.json`, 'utf8'));
  for (const [k, row] of Object.entries(d)) luptByMMDD[k.slice(5)] = row;
}
const luCols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' };
const pmLu = {};
for (const [p, col] of Object.entries(luCols)) {
  const vals = Object.values(luptByMMDD).map((r) => String(r[col] ?? '').trim());
  pmLu[p] = pmFlag(p, vals);
}
const parseLu = (v, p) => parseCol(v, p, pmLu[p]);
console.log('\n== LUPT reference (2027 pages, same MM-DD) ==');
const luptDiff = {};
for (const t of tables) {
  const res = out.tables.find((r) => r.tag === t.tag);
  const data = JSON.parse(fs.readFileSync(t.file, 'utf8'));
  const diffs = {};
  let n = 0;
  for (const [k, row] of Object.entries(data)) {
    const mmdd = k.slice(5);
    const lu = luptByMMDD[mmdd];
    if (!lu) continue;
    n++;
    for (const [p, col] of Object.entries(luCols)) {
      if (res.cols[p] === undefined) continue;
      const a = parseLu(String(row[res.cols[p]] ?? '').trim(), p);
      const b = parseLu(String(lu[col] ?? '').trim(), p);
      if (a === null || b === null) continue;
      (diffs[p] ??= []).push(a - b);
    }
  }
  const summary = {};
  for (const [p, arr] of Object.entries(diffs)) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const within1 = arr.filter((x) => Math.abs(x) <= 1).length;
    const worst = Math.max(...arr.map((x) => Math.abs(x)));
    summary[p] = { mean: +mean.toFixed(1), within1, worst, n: arr.length };
  }
  luptDiff[t.tag] = { days: n, summary };
  console.log(t.tag + '  days ' + n + '  ' + Object.entries(summary).map(([p, s]) => `${p} mean ${s.mean >= 0 ? '+' : ''}${s.mean} w1 ${s.within1}/${s.n} worst ${s.worst}`).join('  '));
}
out.luptReference = luptDiff;
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('\nwrote uktowns-fit.json');
