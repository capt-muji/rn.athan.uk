// Job 3: the Norwegian third line - islamweb.no (Jamiat Ulama Norway) 7 city-years.
// Fit each city at its own coordinates; diff against mawaqeet (18/15 line) and
// IRN (16/15 line) where the same city-year exists.
// Run: TZ=Europe/Oslo node norway.mjs
import fs from 'node:fs';
import { fitTable, printTable } from './engine.mjs';

const HOME = process.env.HOME;
const E = HOME + '/athan-gitree/census/o1k-wide/europe/data/';
const N2 = HOME + '/athan-gitree/census/o1k-wide/nordics2/data/';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit4/norway-fit.json';

const candidates = [
  { name: 'IRN 16/15 bare', fa: 16, is: 15 },
  { name: 'IRN 16/15 caps 1/7+1/7', fa: 16, is: 15, portions: { fajr: 1 / 7, isha: 1 / 7 } },
  { name: 'mawaqeet 18/15 bare', fa: 18, is: 15 },
  { name: 'mawaqeet 18/15 caps 1/7+1/7', fa: 18, is: 15, portions: { fajr: 1 / 7, isha: 1 / 7 } },
  { name: 'MWL 18/17 bare', fa: 18, is: 17 },
];

const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' };
const cities = [
  { tag: 'oslo', lat: 59.9139, lng: 10.7522 },
  { tag: 'bergen', lat: 60.3913, lng: 5.3221 },
  { tag: 'stavanger', lat: 58.9700, lng: 5.7331 },
  { tag: 'drammen', lat: 59.7440, lng: 10.2045 },
  { tag: 'kristiansand', lat: 58.1461, lng: 7.9956 },
  { tag: 'sandnes', lat: 58.8524, lng: 5.7352 },
  { tag: 'skien', lat: 59.2095, lng: 9.6090 },
];

const out = { job: 'norway', meta: { adhan: '4.4.6', lines: 'IRN 16/15, mawaqeet 18/15, third line = islamweb/JU' }, tables: [], diffs: {} };
for (const c of cities) {
  const res = await fitTable({ tag: `islamweb-${c.tag}`, file: `${E}no-islamweb-${c.tag}-2026.json`, cols, lat: c.lat, lng: c.lng, tz: 'Europe/Oslo' }, candidates);
  out.tables.push(res);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  printTable(res);
}

// same-day same-city diffs against the two mapped lines
const parse = (v) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(v ?? '').trim()); return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null; };
const diff = (aFile, aCols, bFile, bCols, label) => {
  const a = JSON.parse(fs.readFileSync(aFile, 'utf8'));
  const b = JSON.parse(fs.readFileSync(bFile, 'utf8'));
  const acc = {};
  let n = 0;
  for (const [k, row] of Object.entries(a)) {
    const rb = b[k];
    if (!rb) continue;
    n++;
    for (const [p, ca] of Object.entries(aCols)) {
      const va = parse(row[ca]), vb = parse(rb[bCols[p]]);
      if (va === null || vb === null) continue;
      (acc[p] ??= []).push(va - vb);
    }
  }
  const sum = {};
  for (const [p, arr] of Object.entries(acc)) {
    sum[p] = { mean: +(arr.reduce((x, y) => x + y, 0) / arr.length).toFixed(1), min: Math.min(...arr), max: Math.max(...arr), n: arr.length };
  }
  out.diffs[label] = { days: n, per: sum };
  console.log(`\ndiff ${label}: days ${n}  ` + Object.entries(sum).map(([p, s]) => `${p} mean ${s.mean >= 0 ? '+' : ''}${s.mean} [${s.min}..${s.max}] n=${s.n}`).join('  '));
};

const mwCols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', maghrib: 'magrib', isha: 'isha' };
for (const city of ['oslo', 'bergen', 'stavanger']) {
  diff(`${E}no-islamweb-${city}-2026.json`, cols, `${E}no-mawaqeet-${city}-2026.json`, mwCols, `islamweb-vs-mawaqeet-${city}`);
}
diff(`${E}no-islamweb-bergen-2026.json`, cols, `${N2}no-irn-bergen-2026.json`, { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', maghrib: 'magrib', isha: 'isha' }, 'islamweb-vs-IRN-bergen');
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('\nwrote norway-fit.json');
