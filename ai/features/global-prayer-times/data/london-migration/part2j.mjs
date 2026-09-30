// R13 Part 2j: the 2027 published year, and what it proves about the interval table.
// Source: londonsalahtimes.com/downloads/LUPT-2027.xlsx, fetched 2026-09-30.
// Its own header reads "times & dates valid when generated in July 2026".
// This is a year the app has never seen and that postdates every capture in the repository.

import fs from 'node:fs';
import zlib from 'node:zlib';
import { readElm, readLpt, toMin, fmt } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const rows = JSON.parse(fs.readFileSync('/Users/muji/athan-global-scratch/r13/sheet2.json', 'utf8'));

/** Excel serial day 1 is 1900-01-01, with the 1900 leap bug, so 1899-12-30 is the epoch. */
const excelDate = (serial) => new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000).toISOString().slice(0, 10);
/** An Excel time fraction to whole minutes, rounded, as the sheet itself holds whole minutes. */
const excelMinutes = (frac) => Math.round(frac * 1440);

const t2027 = {};
for (const row of rows) {
  const c = row.cells;
  if (typeof c.B !== 'number' || c.B < 40_000) continue;
  const date = excelDate(c.B);
  if (!date.startsWith('2027')) continue;
  t2027[date] = {
    date,
    fajr: fmt(excelMinutes(c.D)),
    sunrise: fmt(excelMinutes(c.E)),
    dhuhr: fmt(excelMinutes(c.F)),
    asr: fmt(excelMinutes(c.G)),
    asr_2: fmt(excelMinutes(c.H)),
    magrib: fmt(excelMinutes(c.I)),
    isha: fmt(excelMinutes(c.J)),
  };
}

say('R13 PART 2j: the 2027 published year, obtained from the timetable\'s own publisher');
say('Source: londonsalahtimes.com/downloads/LUPT-2027.xlsx, fetched 2026-09-30, 70,171 bytes.');
say('The workbook\'s own absPath is "ELM/Prayer timetables and calendar/London Unified Prayer');
say('Timetable/Generated years/", and its header reads "times & dates valid when generated in');
say('July 2026". Downloads are offered for every year from 2027 to 2076.');
say('');
say(`Days parsed: ${Object.keys(t2027).length}`);
say(`First: ${JSON.stringify(t2027['2027-01-01'])}`);
say(`Last:  ${JSON.stringify(t2027['2027-12-31'])}`);
say('');

const intervalsOf = (r) => {
  const out = {};
  for (const [date, row] of Object.entries(r)) {
    const sr = toMin(row.sunrise);
    const mg = toMin(row.magrib);
    if (sr === null || mg === null) continue;
    out[date.slice(5)] = { fajr: sr + 3 - toMin(row.fajr), isha: toMin(row.isha) - (mg - 3) };
  }
  return out;
};

const iv2027 = intervalsOf(t2027);
const iv2026 = intervalsOf(readElm(2026));
const ivLpt = intervalsOf(readLpt());

say('== 2j.1 Does the 2026 interval table still hold in 2027? ==');
{
  const slots = Object.keys(iv2027).filter((s) => s in iv2026 && s !== '02-29');
  const fSame = slots.filter((s) => iv2027[s].fajr === iv2026[s].fajr);
  const iSame = slots.filter((s) => iv2027[s].isha === iv2026[s].isha);
  const fDiff = slots.filter((s) => iv2027[s].fajr !== iv2026[s].fajr);
  const iDiff = slots.filter((s) => iv2027[s].isha !== iv2026[s].isha);
  say(`  Slots compared: ${slots.length}`);
  say(`  Fajr interval identical: ${fSame.length} (${((100 * fSame.length) / slots.length).toFixed(1)}%)`);
  say(`  Isha interval identical: ${iSame.length} (${((100 * iSame.length) / slots.length).toFixed(1)}%)`);
  say(`  Fajr slots that differ: ${fDiff.length ? fDiff.map((s) => `${s} (2026:${iv2026[s].fajr} 2027:${iv2027[s].fajr})`).join(', ') : 'none'}`);
  say(`  Isha slots that differ: ${iDiff.length ? iDiff.map((s) => `${s} (2026:${iv2026[s].isha} 2027:${iv2027[s].isha})`).join(', ') : 'none'}`);
  say('');
  say('  Against the app\'s own captured 2026 API year rather than the ELM PDF:');
  const fSame2 = slots.filter((s) => iv2027[s].fajr === ivLpt[s].fajr).length;
  const iSame2 = slots.filter((s) => iv2027[s].isha === ivLpt[s].isha).length;
  say(`  Fajr identical ${fSame2}/${slots.length}, Isha identical ${iSame2}/${slots.length}`);
}
say('');

say('== 2j.2 Reconstructing 2027 from the 2026 table and 2027\'s own published sun ==');
{
  let fE = 0;
  let iE = 0;
  let n = 0;
  const misses = [];
  for (const d of Object.keys(t2027).sort()) {
    const iv = iv2026[d.slice(5)];
    if (!iv) continue;
    n += 1;
    const dF = toMin(t2027[d].sunrise) + 3 - iv.fajr - toMin(t2027[d].fajr);
    const dI = toMin(t2027[d].magrib) - 3 + iv.isha - toMin(t2027[d].isha);
    if (dF === 0) fE += 1;
    else misses.push(`F${d.slice(5)}${dF > 0 ? '+' : ''}${dF}`);
    if (dI === 0) iE += 1;
    else misses.push(`I${d.slice(5)}${dI > 0 ? '+' : ''}${dI}`);
  }
  say(`  Fajr ${fE}/${n} exact, Isha ${iE}/${n} exact. Misses: ${misses.length ? misses.join(' ') : 'none'}`);
  say('  This is the durability test the residual model failed: a 2026 table applied to a 2027');
  say('  the table was not built from.');
}
say('');

say('== 2j.3 The Asr margin question, settled on 2027 ==');
say('The publisher documents "\'Asr: 2 minutes later". Part 2i measured that no shipped year');
say('carries a +2 margin over a plain shadow solve. 2027 is the check.');
{
  // Asr 1 against Asr 2: the internal gap, which does not depend on the margin.
  const gaps = Object.keys(t2027).map((d) => toMin(t2027[d].asr_2) - toMin(t2027[d].asr));
  say(`  Mithl 2 minus Mithl 1 across 2027: ${Math.min(...gaps)} to ${Math.max(...gaps)} minutes.`);
  const gaps26 = Object.keys(readElm(2026)).map((d) => {
    const r = readElm(2026)[d];
    return toMin(r.asr_2) - toMin(r.asr);
  });
  say(`  The same gap in 2026: ${Math.min(...gaps26)} to ${Math.max(...gaps26)} minutes.`);
}
say('');

say('== 2j.4 Byte cost of the interval table, recomputed on 2027 ==');
{
  const slots = Object.keys(iv2027).sort();
  const both = Buffer.from([...slots.map((s) => iv2027[s].fajr), ...slots.map((s) => iv2027[s].isha)]);
  const rle = (arr) => {
    const runs = [];
    for (const v of arr) {
      if (runs.length && runs[runs.length - 1][0] === v) runs[runs.length - 1][1] += 1;
      else runs.push([v, 1]);
    }
    return runs;
  };
  const rleBuf = Buffer.from([
    ...rle(slots.map((s) => iv2027[s].fajr)).flat(),
    ...rle(slots.map((s) => iv2027[s].isha)).flat(),
  ]);
  say(`  two uint8 arrays: ${both.length} raw, ${zlib.gzipSync(both, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(both).length} brotli`);
  say(`  run-length encoded: ${rleBuf.length} raw, ${zlib.gzipSync(rleBuf, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(rleBuf).length} brotli`);
  const yearJson = Buffer.from(JSON.stringify(t2027));
  say(`  the whole 2027 year as JSON: ${yearJson.length} raw, ${zlib.gzipSync(yearJson, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(yearJson).length} brotli`);
  say(`  the .xlsx as published: 70171 bytes`);
}

fs.writeFileSync('/Users/muji/athan-global-scratch/r13/lupt-2027.json', JSON.stringify(t2027, null, 1));
const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part2j.txt', out + '\n');
console.log(out);
