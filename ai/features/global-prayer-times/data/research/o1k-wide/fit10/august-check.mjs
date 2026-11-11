// Second-month check on the 1447 edition: August 2025 (pages 2 and 3) against
// August 2021 (2021 annual page 8), fajr and isha only.
import { readFileSync } from 'node:fs';
import { parseHHMM } from './lib.mjs';

const TXT = process.env.HOME + '/athan-gitree/census/o1k-wide/sahel2/captures/msbf-heures-priere-2021-extracted.txt';
const page8 = readFileSync(TXT, 'utf8').split(/===== PAGE 9 =====/)[0].split(/===== PAGE 8 =====/)[1];

const ROW = /^\s*(?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s+[^\d\s]*\s*(\d{1,2})\s+(\d{1,2})\s+[^\d]+((?:\d{2}:\d{2}\s*){10})/;
// The text layer puts the Latin weekday on its own line for some rows, so a
// second pattern matches a row that begins with the Arabic weekday.
const ROW2 = /^\s*[^\d\s]+\s+(\d{1,2})\s+(\d{1,2})\s+[^\d]+((?:\d{2}:\d{2}\s*){10})/;
const aug2021 = new Map();
for (const line of page8.split('\n')) {
  const m = ROW.exec(line) || ROW2.exec(line);
  if (!m) continue;
  const t = m[3].trim().split(/\s+/).map(parseHHMM);
  aug2021.set(+m[1], { fajr: t[0], isha: t[8], maghrib: t[6], asr: t[4] });
}

// August 2025, read from msbf-1447-annual-page2.jpg (rows 8-29 = 2-23 Aug) and
// page3.jpg (rows 2-8 = 25-31 Aug). 1 and 24 Aug fall outside the crops read.
const aug2025 = new Map([
  [2, ['04:43', '19:45']], [3, ['04:44', '19:45']], [4, ['04:44', '19:40']], [5, ['04:44', '19:40']],
  [6, ['04:44', '19:40']], [7, ['04:45', '19:40']], [8, ['04:45', '19:40']], [9, ['04:45', '19:40']],
  [10, ['04:46', '19:40']], [11, ['04:46', '19:40']], [12, ['04:46', '19:40']], [13, ['04:46', '19:35']],
  [14, ['04:47', '19:35']], [15, ['04:47', '19:35']], [16, ['04:47', '19:35']], [17, ['04:47', '19:35']],
  [18, ['04:47', '19:35']], [19, ['04:48', '19:35']], [20, ['04:48', '19:35']], [21, ['04:48', '19:35']],
  [22, ['04:48', '19:35']], [23, ['04:48', '19:35']],
  [25, ['04:49', '19:30']], [26, ['04:49', '19:30']], [27, ['04:49', '19:30']], [28, ['04:49', '19:30']],
  [29, ['04:49', '19:25']], [30, ['04:49', '19:25']], [31, ['04:49', '19:25']],
].map(([d, [f, i]]) => [d, { fajr: parseHHMM(f), isha: parseHHMM(i) }]));

const dF = [], dI = [];
const rows = [];
for (const [d, v] of [...aug2025].sort((a, b) => a[0] - b[0])) {
  const a = aug2021.get(d);
  if (!a) { console.log('no 2021 row for', d); continue; }
  dF.push(v.fajr - a.fajr); dI.push(v.isha - a.isha);
  rows.push({ day: d, fajr_2021: a.fajr, fajr_2025: v.fajr, dF: v.fajr - a.fajr, isha_2021: a.isha, isha_2025: v.isha, dI: v.isha - a.isha });
}
const tally = (v) => Object.fromEntries([...new Set(v)].sort((a, b) => a - b).map(x => [x, v.filter(y => y === x).length]));
console.log('August 2025 vs 2021, days compared:', rows.length);
console.log('fajr delta:', JSON.stringify(tally(dF)));
console.log('isha delta:', JSON.stringify(tally(dI)));
console.log('isha delta detail:', rows.map(r => `${r.day}:${r.dI}`).join(' '));

const blocks = (map, key) => {
  const out = [];
  for (const [d, v] of [...map].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && last.v === v[key] && last.to === d - 1) last.to = d;
    else out.push({ v: v[key], from: d, to: d });
  }
  return out;
};
console.log('2021 isha blocks:', blocks(aug2021, 'isha').map(b => `${b.v} ${b.from}-${b.to}`).join('  '));
console.log('2025 isha blocks:', blocks(aug2025, 'isha').map(b => `${b.v} ${b.from}-${b.to}`).join('  '));
console.log('2021 fajr blocks:', blocks(aug2021, 'fajr').map(b => `${b.v} ${b.from}-${b.to}`).join('  '));
console.log('2025 fajr blocks:', blocks(aug2025, 'fajr').map(b => `${b.v} ${b.from}-${b.to}`).join('  '));
