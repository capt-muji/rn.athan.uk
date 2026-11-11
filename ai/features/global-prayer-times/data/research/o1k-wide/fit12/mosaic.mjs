// Fit 12: UK mosaic. Recipes for the English/Scottish towns outside the
// fit1/fit4 set, then the recipe clusters. Census discipline: adhan 4.4.6,
// second resolution then explicit rounding, dates from the data's own strings.
// Run: TZ=Europe/London node mosaic.mjs [--candidates]
import fs from 'node:fs';
import { fitTable, printTable, pmFlag, parseCol } from './engine.mjs';

const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1k-wide/uktowns2/data/';
const S = HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit12/uk-mosaic-fit.json';
const skipFree = process.argv.includes('--candidates');

const candidates = [
  { name: 'Wifaqul 18/15 caps 1/2+1/7', fa: 18, is: 15, portions: { fajr: 1 / 2, isha: 1 / 7 } },
  { name: 'Wifaqul 18/15 bare', fa: 18, is: 15 },
  { name: 'MWL 18/17 bare', fa: 18, is: 17 },
  { name: 'Diyanet-Europe 18/16 bare', fa: 18, is: 16 },
  { name: 'Karachi 18/18 bare', fa: 18, is: 18 },
  { name: 'ISNA 15/15 bare', fa: 15, is: 15 },
  { name: 'Moonsighting 18/18 caps 1/7+1/7', fa: 18, is: 18, portions: { fajr: 1 / 7, isha: 1 / 7 } },
];

const full = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' };
const noMaghrib = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', isha: 'isha' };

// Standard town centres (no coordinate metadata in the captures).
const tables = [
  { town: 'Luton', tag: 'luton-central', file: D + 'luton-central-mosque-2026-11.json', cols: full, lat: 51.8787, lng: -0.4200, span: '2026-11 (30d)' },
  { town: 'Brighton', tag: 'brighton-almedinah', file: D + 'brighton-almedinah-2026-11.json', cols: full, lat: 50.8225, lng: -0.1372, span: '2026-11 (30d)' },
  { town: 'Dudley', tag: 'dudley-mcc', file: D + 'dudley-mcc-2026-11.json', cols: full, lat: 52.5120, lng: -2.0810, span: '2026-11 (30d)' },
  { town: 'Preston', tag: 'preston-jamea', file: D + 'preston-jamea-2026-11.json', cols: noMaghrib, lat: 53.7632, lng: -2.7031, span: '2026-11 (30d)' },
  { town: 'Blackpool', tag: 'blackpool-central', file: D + 'blackpool-central-2026-11.json', cols: full, lat: 53.8175, lng: -3.0357, span: '2026-11 (30d)' },
  { town: 'Middlesbrough', tag: 'middlesbrough-central', file: D + 'middlesbrough-central-2026-11.json', cols: full, lat: 54.5742, lng: -1.2350, span: '2026-11 (30d)' },
  { town: 'Stockport', tag: 'stockport-ic', file: D + 'stockport-islamic-centre-2026-11.json', cols: full, lat: 53.4106, lng: -2.1575, span: '2026-11 (30d)' },
  { town: 'Watford', tag: 'watford-jamia', file: D + 'watford-jamia-2026-11.json', cols: full, lat: 51.6565, lng: -0.3903, span: '2026-11 (30d)' },
  { town: 'Ilford', tag: 'ilford-mosque', file: D + 'ilford-2026-11.json', cols: full, lat: 51.5590, lng: 0.0741, span: '2026-11 (30d)' },
  { town: 'Cambridge', tag: 'cambridge-central', file: D + 'cambridge-central-2026-11.json', cols: full, lat: 52.2053, lng: 0.1218, span: '2026-11-10..12-11 (32d)' },
  { town: 'Stoke', tag: 'stoke-citycentral', file: D + 'stoke-citycentral-month.json', cols: full, lat: 53.0027, lng: -2.1794, span: '2026-11 (30d)' },
  { town: 'Edinburgh', tag: 'edinburgh-central', file: S + 'edinburgh-central-mosque-2026-11.json', cols: { fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' }, lat: 55.9533, lng: -3.1883, span: '2026-11 (30d)' },
  { town: 'Birmingham', tag: 'birmingham-central', file: S + 'birmingham-central-mosque-2026-11.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'zuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' }, lat: 52.4862, lng: -1.8904, span: '2026-11 (30d)' },
  { town: 'Leicester', tag: 'leicester-umar', file: S + 'leicester-masjid-umar-2026-11.json', cols: { fajr: 'subh_sadiq', sunrise: 'sunrise', dhuhr: 'noon', asr: 'asr', isha: 'esha' }, lat: 52.6369, lng: -1.1398, span: '2026-11 (30d)' },
  { town: 'Cardiff', tag: 'cardiff-swicc', file: S + 'swicc-cardiff-2026-11.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' }, lat: 51.4816, lng: -3.1791, span: '2026-11 (30d)' },
  { town: 'Hull', tag: 'hull-mosque', file: S + 'hull-mosque-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' }, lat: 53.7443, lng: -0.3325, span: '2026-01 + 2026-11..12 (62d)' },
  { town: 'Nottingham', tag: 'nottingham-ic', file: D + 'nottingham-ic-2026.json', cols: full, lat: 52.9548, lng: -1.1581, span: '2026, May-Jul excluded (dpt summer defect)', drop: (k) => k >= '2026-05-01' && k <= '2026-07-31' },
  { town: 'Aberdeen', tag: 'aberdeen-amic-central', file: S + 'aberdeen-amic-central-2026.json', cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' }, lat: 57.1497, lng: -2.0943, span: '2026 (333d)' },
];

if (!skipFree) {
  const have = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { job: 'uk-mosaic', meta: {}, tables: [] };
}

const out = { job: 'uk-mosaic', meta: { adhan: '4.4.6', discipline: 'second resolution then explicit rounding', candidates: candidates.map((c) => c.name), coords: 'standard town centres' }, tables: [] };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
for (const t of tables) {
  const res = await fitTable(t, candidates, { skipFree });
  res.town = t.town;
  res.span = t.span;
  out.tables.push(res);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); // incremental
  printTable(res);
}

// LUPT same-MM-DD reference from the six published 2027 months.
const luptByMMDD = {};
for (const mo of ['01', '02', '04', '07', '11', '12']) {
  const d = JSON.parse(fs.readFileSync(`${D}lupt-2027-${mo}.json`, 'utf8'));
  for (const [k, row] of Object.entries(d)) luptByMMDD[k.slice(5)] = row;
}
const luCols = full;
const pmLu = {};
for (const [p, col] of Object.entries(luCols)) pmLu[p] = pmFlag(p, Object.values(luptByMMDD).map((r) => String(r[col] ?? '').trim()));
const parseLu = (v, p) => parseCol(v, p, pmLu[p]);

const luptDiff = {};
console.log('\n== LUPT reference (2027 pages, same MM-DD) ==');
for (const t of tables) {
  const res = out.tables.find((r) => r.tag === t.tag);
  const data = JSON.parse(fs.readFileSync(t.file, 'utf8'));
  const diffs = {};
  let n = 0;
  for (const [k, row] of Object.entries(data)) {
    const lu = luptByMMDD[k.slice(5)];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || !lu) continue;
    if (t.drop && t.drop(k)) continue;
    n++;
    for (const [p, col] of Object.entries(luCols)) {
      if (res.cols[p] === undefined) continue;
      const av = String(row[res.cols[p]] ?? '').trim();
      const bv = String(lu[col] ?? '').trim();
      if (!/^\d{1,2}:\d{2}$/.test(av) || !/^\d{1,2}:\d{2}$/.test(bv)) continue;
      (diffs[p] ??= []).push(parseCol(av, p, res.pm[p]) - parseLu(bv, p));
    }
  }
  const summary = {};
  for (const [p, arr] of Object.entries(diffs)) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    summary[p] = {
      mean: +mean.toFixed(1),
      min: Math.min(...arr), max: Math.max(...arr),
      within1: arr.filter((x) => Math.abs(x) <= 1).length,
      worst: Math.max(...arr.map((x) => Math.abs(x))),
      n: arr.length,
    };
  }
  luptDiff[t.tag] = { days: n, summary };
  console.log(t.tag.padEnd(24) + ' days ' + String(n).padStart(3) + '  ' + ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter((p) => summary[p]).map((p) => `${p} ${summary[p].mean >= 0 ? '+' : ''}${summary[p].mean} [${summary[p].min},${summary[p].max}]`).join('  '));
}
out.luptReference = luptDiff;
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('\nwrote uk-mosaic-fit.json');
