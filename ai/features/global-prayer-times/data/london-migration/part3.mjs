// R13 Part 3: the fifty published future years, and what they settle about London's durability.
// Source: londonsalahtimes.com/downloads/LUPT-<year>.xlsx, 2027 to 2076, fetched 2026-09-30.
// The publisher is named on East London Mosque's own prayer-times page as the producer of its times.
//
// Three questions:
//   1. Does ONE interval table reproduce all fifty published years, against each year's own published sun?
//   2. Does a COMPUTED sun plus that table reproduce them, which is the fully-offline question?
//   3. What does the whole fifty-year corpus cost in bytes, against the table alone?

import fs from 'node:fs';
import zlib from 'node:zlib';
import { readLupt } from './xlsx.mjs';
import { readElm, readLpt, toMin, adhan, dayDate, londonMinutesExact } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const YEARS = [];
for (let y = 2027; y <= 2076; y += 1) YEARS.push(y);

const years = {};
for (const y of YEARS) years[y] = readLupt(`./lupt/LUPT-${y}.xlsx`);

say('R13 PART 3: the fifty published future years');
say('Source: londonsalahtimes.com/downloads/LUPT-<year>.xlsx, 2027 to 2076, fetched 2026-09-30.');
say('East London Mosque\'s own prayer-times page credits "Prayer times produced by London Salah Times".');
say('');
say('year  days  first row                                        last row');
for (const y of [2027, 2028, 2040, 2076]) {
  const ks = Object.keys(years[y]).sort();
  say(`${y}  ${String(ks.length).padStart(4)}  ${ks[0]} F${years[y][ks[0]].fajr} I${years[y][ks[0]].isha}   ${ks[ks.length - 1]} F${years[y][ks[ks.length - 1]].fajr} I${years[y][ks[ks.length - 1]].isha}`);
}
const totalDays = YEARS.reduce((a, y) => a + Object.keys(years[y]).length, 0);
say(`Total days across all fifty years: ${totalDays}. Total published values (7 fields): ${totalDays * 7}.`);
say('');

/** The Fajr and Isha intervals a year implies against its OWN published sunrise and Maghrib. */
const intervalsOf = (rows) => {
  const out = {};
  for (const [date, row] of Object.entries(rows)) {
    const sr = toMin(row.sunrise);
    const mg = toMin(row.magrib);
    if (sr === null || mg === null) continue;
    out[date.slice(5)] = { fajr: sr + 3 - toMin(row.fajr), isha: toMin(row.isha) - (mg - 3) };
  }
  return out;
};

// The reference table: the app's own captured 2026 API year, which is what a v2.0 build would ship.
const table = intervalsOf(readLpt());

say('== 3.1 Does the app\'s OWN 2026 interval table reproduce all fifty future years? ==');
say('The table is derived from ai/features/moonsighting/data/london/lpt-2026.json, the app\'s current source.');
say('Each year is reconstructed as: Fajr = (published sunrise + 3) - interval, Isha = (published Maghrib - 3) + interval.');
say('');
say('year   days   Fajr exact        Isha exact        worst   days that differ');
let fTot = 0;
let iTot = 0;
let nTot = 0;
let worstAll = 0;
const allDiffs = new Map();
for (const y of YEARS) {
  const rows = years[y];
  let fE = 0;
  let iE = 0;
  let n = 0;
  let worst = 0;
  const diffs = [];
  for (const d of Object.keys(rows).sort()) {
    const slot = d.slice(5);
    const iv = table[slot];
    if (!iv) continue;
    n += 1;
    const dF = toMin(rows[d].sunrise) + 3 - iv.fajr - toMin(rows[d].fajr);
    const dI = toMin(rows[d].magrib) - 3 + iv.isha - toMin(rows[d].isha);
    if (dF === 0) fE += 1;
    else {
      diffs.push(`F${slot}${dF > 0 ? '+' : ''}${dF}`);
      allDiffs.set(`F${slot}`, (allDiffs.get(`F${slot}`) ?? 0) + 1);
    }
    if (dI === 0) iE += 1;
    else {
      diffs.push(`I${slot}${dI > 0 ? '+' : ''}${dI}`);
      allDiffs.set(`I${slot}`, (allDiffs.get(`I${slot}`) ?? 0) + 1);
    }
    worst = Math.max(worst, Math.abs(dF), Math.abs(dI));
  }
  fTot += fE;
  iTot += iE;
  nTot += n;
  worstAll = Math.max(worstAll, worst);
  say(
    `${y}  ${String(n).padStart(5)}  ${`${fE}/${n}`.padStart(9)} ${`(${((100 * fE) / n).toFixed(1)}%)`.padStart(8)}  ${`${iE}/${n}`.padStart(9)} ${`(${((100 * iE) / n).toFixed(1)}%)`.padStart(8)}  ${String(worst).padStart(5)}   ${diffs.length ? diffs.join(' ') : 'none'}`
  );
}
say('');
say(`ALL FIFTY YEARS: Fajr ${fTot}/${nTot} exact (${((100 * fTot) / nTot).toFixed(3)}%), Isha ${iTot}/${nTot} exact (${((100 * iTot) / nTot).toFixed(3)}%).`);
say(`Combined ${fTot + iTot}/${nTot * 2} (${((100 * (fTot + iTot)) / (nTot * 2)).toFixed(3)}%). Worst error anywhere: ${worstAll} minute(s).`);
say('');
say('Every slot that ever differs, with how many of the fifty years it differs in:');
for (const [slot, count] of [...allDiffs.entries()].sort()) say(`  ${slot}: ${count} of 50 years`);
say('');

say('== 3.2 A table built from 2027 instead, to see which year\'s table is the right one to ship ==');
{
  const t2027 = intervalsOf(years[2027]);
  let fE = 0;
  let iE = 0;
  let n = 0;
  let worst = 0;
  const diffSlots = new Map();
  for (const y of YEARS) {
    for (const d of Object.keys(years[y]).sort()) {
      const iv = t2027[d.slice(5)];
      if (!iv) continue;
      n += 1;
      const dF = toMin(years[y][d].sunrise) + 3 - iv.fajr - toMin(years[y][d].fajr);
      const dI = toMin(years[y][d].magrib) - 3 + iv.isha - toMin(years[y][d].isha);
      if (dF === 0) fE += 1;
      else diffSlots.set(`F${d.slice(5)}`, (diffSlots.get(`F${d.slice(5)}`) ?? 0) + 1);
      if (dI === 0) iE += 1;
      else diffSlots.set(`I${d.slice(5)}`, (diffSlots.get(`I${d.slice(5)}`) ?? 0) + 1);
      worst = Math.max(worst, Math.abs(dF), Math.abs(dI));
    }
  }
  say(`  2027's table on all fifty years: Fajr ${fE}/${n} (${((100 * fE) / n).toFixed(3)}%), Isha ${iE}/${n} (${((100 * iE) / n).toFixed(3)}%), worst ${worst}`);
  say(`  Slots that ever differ: ${diffSlots.size ? [...diffSlots.entries()].sort().map(([s, c]) => `${s}x${c}`).join(' ') : 'none'}`);
}
say('');

say('== 3.3 29 February, the slot no non-leap year can supply ==');
{
  const leaps = YEARS.filter((y) => Object.keys(years[y]).some((d) => d.endsWith('-02-29')));
  say(`  Leap years in the corpus: ${leaps.length} (${leaps.slice(0, 5).join(', ')} ... ${leaps.slice(-2).join(', ')})`);
  const feb29 = leaps.map((y) => {
    const row = years[y][`${y}-02-29`];
    return { y, fajr: toMin(row.sunrise) + 3 - toMin(row.fajr), isha: toMin(row.isha) - (toMin(row.magrib) - 3) };
  });
  const fSet = new Set(feb29.map((x) => x.fajr));
  const iSet = new Set(feb29.map((x) => x.isha));
  say(`  29 Feb Fajr interval across every leap year: ${[...fSet].join(', ')}`);
  say(`  29 Feb Isha interval across every leap year: ${[...iSet].join(', ')}`);
  say('  The app\'s 2026 capture is a non-leap year, so this slot must come from a leap year or be');
  say('  interpolated. The measurement above says which.');
  const f228 = table['02-28'];
  const f301 = table['03-01'];
  say(`  For comparison, the 2026 table's neighbours: 02-28 Fajr ${f228.fajr} Isha ${f228.isha}; 03-01 Fajr ${f301.fajr} Isha ${f301.isha}`);
}
say('');

say('== 3.4 THE OFFLINE QUESTION, tested on fifty years the table was not built from ==');
say('Computed sun (adhan 4.4.6, rounding None then half-up) at the publisher\'s own Charing Cross point');
say('and at the point wave 1 fitted, with the publisher\'s own documented margins:');
say('  sunrise = computed sunrise - 3   Zuhr = computed transit + 5   Maghrib = computed sunset + 3');
say('  Fajr = (that sunrise + 3) - interval   Isha = (that Maghrib - 3) + interval');
say('');
const POINTS = [
  ['Charing Cross 51.5073,-0.12755', new adhan.Coordinates(51.5073, -0.12755)],
  ['51.5,-0.165 (wave 1 era B2 fit)', new adhan.Coordinates(51.5, -0.165)],
  ['51.5,-0.1275 (wave 1 era B1 fit)', new adhan.Coordinates(51.5, -0.1275)],
];
/**
 * A bare parameter set, NOT a named method.
 *
 * `CalculationMethod.MuslimWorldLeague()` ships `methodAdjustments.dhuhr = 1` and
 * `MoonsightingCommittee()` ships `dhuhr: 5, maghrib: 3` (measured, adhan 4.4.6), so a named method
 * silently adds its own margin on top of the publisher's documented one. Only sunrise, transit and
 * sunset are read here, so the Fajr and Isha angles are irrelevant; the point is a clean transit.
 */
const sunParams = () => {
  const p = new adhan.CalculationParameters('Other', 18, 17);
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  return p;
};

say('point                              field      exact                within 1 min         worst  beyond 1');
const pointRows = [];
for (const [label, coords] of POINTS) {
  const params = sunParams();
  const stat = { fajr: [0, 0, 0, 0], sunrise: [0, 0, 0, 0], dhuhr: [0, 0, 0, 0], magrib: [0, 0, 0, 0], isha: [0, 0, 0, 0] };
  let n = 0;
  for (const y of YEARS) {
    for (const d of Object.keys(years[y]).sort()) {
      const slot = d.slice(5);
      const iv = table[slot];
      if (!iv) continue;
      n += 1;
      const pt = new adhan.PrayerTimes(coords, dayDate(d), params);
      const cSunrise = Math.round(londonMinutesExact(pt.sunrise, d) - 3);
      const cSunset = Math.round(londonMinutesExact(pt.maghrib, d) + 3);
      const cDhuhr = Math.round(londonMinutesExact(pt.dhuhr, d) + 5);
      const got = {
        sunrise: cSunrise,
        magrib: cSunset,
        dhuhr: cDhuhr,
        fajr: cSunrise + 3 - iv.fajr,
        isha: cSunset - 3 + iv.isha,
      };
      for (const f of ['fajr', 'sunrise', 'dhuhr', 'magrib', 'isha']) {
        const delta = got[f] - toMin(years[y][d][f]);
        const a = Math.abs(delta);
        if (a === 0) stat[f][0] += 1;
        if (a <= 1) stat[f][1] += 1;
        if (a > stat[f][2]) stat[f][2] = a;
        if (a > 1) stat[f][3] += 1;
      }
    }
  }
  for (const f of ['fajr', 'sunrise', 'dhuhr', 'magrib', 'isha']) {
    const [e, w1, worst, beyond] = stat[f];
    say(
      `${label.padEnd(34)} ${f.padEnd(9)} ${`${e} (${((100 * e) / n).toFixed(2)}%)`.padStart(19)} ${`${w1} (${((100 * w1) / n).toFixed(2)}%)`.padStart(19)} ${String(worst).padStart(5)}  ${beyond}`
    );
  }
  pointRows.push({ label, stat, n });
  say('');
}

say('== 3.5 Byte cost: the table against the whole fifty-year corpus ==');
{
  const slots = Object.keys(table).sort();
  const both = Buffer.from([...slots.map((s) => table[s].fajr), ...slots.map((s) => table[s].isha)]);
  const rle = (arr) => {
    const runs = [];
    for (const v of arr) {
      if (runs.length && runs[runs.length - 1][0] === v) runs[runs.length - 1][1] += 1;
      else runs.push([v, 1]);
    }
    return runs;
  };
  const rleBuf = Buffer.from([
    ...rle(slots.map((s) => table[s].fajr)).flat(),
    ...rle(slots.map((s) => table[s].isha)).flat(),
  ]);
  say(`  the interval table, two uint8 arrays of ${slots.length}: ${both.length} raw, ${zlib.gzipSync(both, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(both).length} brotli`);
  say(`  the same, run-length encoded:                 ${rleBuf.length} raw, ${zlib.gzipSync(rleBuf, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(rleBuf).length} brotli`);

  // The alternative: ship every published year outright, which needs no computation at all.
  const allYears = Buffer.from(JSON.stringify(years));
  say(`  all fifty published years as JSON:            ${allYears.length} raw, ${zlib.gzipSync(allYears, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(allYears).length} brotli`);
  // A tighter encoding of the same fifty years: seven uint16 minute values per day.
  const packed = [];
  for (const y of YEARS) {
    for (const d of Object.keys(years[y]).sort()) {
      for (const f of ['fajr', 'sunrise', 'dhuhr', 'asr', 'asr_2', 'magrib', 'isha']) {
        packed.push(toMin(years[y][d][f]));
      }
    }
  }
  const packedBuf = Buffer.alloc(packed.length * 2);
  packed.forEach((v, i) => packedBuf.writeUInt16LE(v, i * 2));
  say(`  all fifty years as uint16 minutes:            ${packedBuf.length} raw, ${zlib.gzipSync(packedBuf, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(packedBuf).length} brotli`);
  // Delta-of-delta on each field across days compresses a smooth annual curve further.
  const deltaBuf = Buffer.alloc(packed.length);
  const FIELDS7 = 7;
  for (let i = 0; i < packed.length; i += 1) {
    const prev = i >= FIELDS7 ? packed[i - FIELDS7] : packed[i];
    let d = packed[i] - prev;
    if (d < -128) d = -128;
    if (d > 127) d = 127;
    deltaBuf.writeInt8(d, i);
  }
  say(`  all fifty years as per-field day deltas:      ${deltaBuf.length} raw, ${zlib.gzipSync(deltaBuf, { level: 9 }).length} gzip, ${zlib.brotliCompressSync(deltaBuf).length} brotli`);
  say('  (the delta encoding is a size measurement only, and clamps at int8; it is not proposed as a format)');
  say(`  one year of the app's own API response, for scale: ${fs.statSync('/Users/muji/athan-global-wt/ai/features/moonsighting/data/london/lpt-2026.json').size} raw bytes`);
}
say('');

say('== 3.6 Do the published future years still carry London\'s hand edits? ==');
say('The 21 edited Isha slots wave 1 documented are the signature of London\'s own timetable rather than');
say('the Hizbul Ulama book. If a generated future year drops them, the edits are not durable.');
{
  // The book's own values at the edited slots, from wave 1 section 2.15.
  const EDITS = [
    ['02-01', 99, 98],
    ['04-29', 74, 73],
    ['04-30', 74, 73],
    ['05-01', 74, 68],
    ['05-04', 74, 60],
    ['05-08', 74, 65],
    ['05-12', 74, 70],
    ['11-29', 99, 100],
  ];
  say('slot    London  book   years of fifty holding London\'s value');
  for (const [slot, london, book] of EDITS) {
    const held = YEARS.filter((y) => {
      const d = `${y}-${slot}`;
      const row = years[y][d];
      if (!row) return false;
      return toMin(row.isha) - (toMin(row.magrib) - 3) === london;
    }).length;
    say(`${slot}   ${String(london).padStart(5)}  ${String(book).padStart(4)}   ${held} of 50`);
  }
  say('');
  say('The four June slots that moved between 2022 and 2025, across the fifty future years:');
  for (const slot of ['06-16', '06-17', '06-18', '06-19']) {
    const vals = new Map();
    for (const y of YEARS) {
      const row = years[y][`${y}-${slot}`];
      if (!row) continue;
      const v = toMin(row.isha) - (toMin(row.magrib) - 3);
      vals.set(v, (vals.get(v) ?? 0) + 1);
    }
    say(`  ${slot}: ${[...vals.entries()].sort().map(([v, c]) => `${v} on ${c} years`).join(', ')}  (2026 table says ${table[slot].isha})`);
  }
}
say('');

say('== 3.7 Control: the 2026 ELM PDF against the 2026 API year, to anchor the corpus ==');
{
  const elm = readElm(2026);
  const lpt = readLpt();
  let same = 0;
  let n = 0;
  for (const d of Object.keys(lpt)) {
    for (const f of ['fajr', 'sunrise', 'dhuhr', 'asr', 'asr_2', 'magrib', 'isha']) {
      if (!elm[d]) continue;
      n += 1;
      if (elm[d][f] === lpt[d][f]) same += 1;
    }
  }
  say(`  ${same} of ${n} cells identical between the ELM 2026 PDF and the app's captured API year.`);
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part3.txt', out + '\n');
console.log(out);
