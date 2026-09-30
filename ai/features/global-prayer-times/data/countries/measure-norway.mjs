// R9: what does Islamsk Rad Norge's unified national calendar actually print in
// summer, when the sun never reaches the Fajr angle?
//
// IRN's own thirteen columns, in its own Norwegian, captured with `grab-norway.sh`:
//   Dato, Dag, Morgengry 16, Fajr, Fajr slutt, Duhr, Asr, 1x-skygge, 2x-skygge,
//   Maghrib, Isha, Kveldsgry 15, Midnatt
// Three things in that header are findings on their own:
//   - IRN names its own angles: 16 degrees for dawn, 15 degrees for dusk.
//   - IRN prints BOTH Asr columns, 1x-skygge and 2x-skygge, side by side.
//   - IRN prints `Fajr slutt` (the end of the Fajr window) as a first-class column.
//
// The summer behaviour is the point: IRN leaves `Morgengry 16` and `Kveldsgry 15`
// BLANK for months, while still printing a Fajr and an Isha. This script measures
// what those substitute values are.
import { readFileSync } from 'node:fs';
import { angleAtTime, timeAtAngle, toH, hm } from './solar-harness.mjs';

// Oslo, the municipality bonnetid.no loads with. IRN prints one table per kommune.
const LAT = 59.913263, LNG = 10.7522;
// Norway: CEST (UTC+2) 29 March to 25 October 2026, CET (UTC+1) otherwise.
const tzOf = (m, d) => ((m > 3 && m < 10) || (m === 3 && d >= 29) || (m === 10 && d < 25)) ? 2 : 1;
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const rows = [];
for (const line of readFileSync(new URL('./no-oslo-2026.tsv', import.meta.url), 'utf8').split('\n')) {
  const c = line.split('\t');
  if (c.length !== 13) continue;
  const [dato, , morgengry, fajr, fajrSlutt, duhr, asr, asr1, asr2, maghrib, isha, kveldsgry, midnatt] = c;
  const [d, m] = dato.split('.').map(Number);
  rows.push({ m, d, morgengry, fajr, fajrSlutt, duhr, asr1, asr2, maghrib, isha, kveldsgry, midnatt });
}
console.log(`${rows.length} published days, Oslo, Islamsk Rad Norge`);

// 1. How many days does IRN itself leave the named-angle columns blank?
const blankM = rows.filter(r => !r.morgengry);
const blankK = rows.filter(r => !r.kveldsgry);
console.log(`\ndays with the 'Morgengry 16' cell BLANK: ${blankM.length}` +
  (blankM.length ? `, ${blankM[0].m}-${blankM[0].d} to ${blankM[blankM.length - 1].m}-${blankM[blankM.length - 1].d}` : ''));
console.log(`days with the 'Kveldsgry 15' cell BLANK: ${blankK.length}` +
  (blankK.length ? `, ${blankK[0].m}-${blankK[0].d} to ${blankK[blankK.length - 1].m}-${blankK[blankK.length - 1].d}` : ''));
console.log(`days where IRN still prints a Fajr: ${rows.filter(r => r.fajr).length} of ${rows.length}`);
console.log(`days where IRN still prints an Isha: ${rows.filter(r => r.isha).length} of ${rows.length}`);

// 2. On the days the named-angle column IS filled, does it measure at 16 and 15?
const stat = a => {
  const s = [...a].sort((x, y) => x - y);
  return { n: s.length, min: s[0], q1: s[Math.floor(0.25 * s.length)], median: s[Math.floor(0.5 * s.length)],
    q3: s[Math.floor(0.75 * s.length)], max: s[s.length - 1] };
};
const mg = [], kg = [], fj = [], ish = [], asrF = [], asrH = [], mgh = [];
for (const r of rows) {
  const tz = tzOf(r.m, r.d);
  const A = t => +angleAtTime(2026, r.m, r.d, LAT, LNG, tz, toH(t)).toFixed(2);
  if (r.morgengry) mg.push(A(r.morgengry));
  if (r.kveldsgry) kg.push(A(r.kveldsgry));
  if (r.morgengry && r.fajr) fj.push(A(r.fajr));
  if (r.kveldsgry && r.isha) ish.push(A(r.isha));
  const sunset = timeAtAngle(2026, r.m, r.d, LAT, LNG, tz, 0.833, 1);
  if (r.maghrib && sunset !== null) mgh.push(Math.round((toH(r.maghrib) - sunset) * 60));
}
console.log('\non days IRN fills them, the named columns invert to:');
console.log('  Morgengry 16 depression angle', JSON.stringify(stat(mg)));
console.log('  Kveldsgry 15 depression angle', JSON.stringify(stat(kg)));
console.log('  Fajr, same days              ', JSON.stringify(stat(fj)));
console.log('  Isha, same days              ', JSON.stringify(stat(ish)));
console.log('  Maghrib minus sunset, minutes', JSON.stringify(stat(mgh)));

// 3. What is the summer substitute? Test the frozen-fraction-of-night rule against
// the constructions a library would offer.
const boundary = rows.findIndex(r => !r.morgengry);
let fFrac = null;
if (boundary > 0) {
  const b = rows[boundary - 1], tz = tzOf(b.m, b.d);
  const sr = timeAtAngle(2026, b.m, b.d, LAT, LNG, tz, 0.833, -1);
  const pd = b.d === 1 ? DIM[(b.m + 10) % 12] : b.d - 1, pm = b.d === 1 ? (b.m === 1 ? 12 : b.m - 1) : b.m;
  const ssp = timeAtAngle(2026, pm, pd, LAT, LNG, tz, 0.833, 1);
  fFrac = (sr - toH(b.fajr)) / (24 - (ssp - sr));
  console.log(`\nlast day before the blank stretch: ${b.m}-${b.d}, Fajr ${b.fajr},` +
    ` sitting ${fFrac.toFixed(4)} of the night (1/${(1 / fFrac).toFixed(2)}) before sunrise`);
}

const err = { frozenFrac: [], seventh: [], middle: [] };
for (const r of blankM) {
  const tz = tzOf(r.m, r.d);
  const sr = timeAtAngle(2026, r.m, r.d, LAT, LNG, tz, 0.833, -1);
  const pd = r.d === 1 ? DIM[(r.m + 10) % 12] : r.d - 1, pm = r.d === 1 ? (r.m === 1 ? 12 : r.m - 1) : r.m;
  const ssp = timeAtAngle(2026, pm, pd, LAT, LNG, tz, 0.833, 1);
  if (sr === null || ssp === null) continue;
  const night = 24 - (ssp - sr), pub = toH(r.fajr);
  if (fFrac !== null) err.frozenFrac.push((pub - (sr - night * fFrac)) * 60);
  err.seventh.push((pub - (sr - night / 7)) * 60);
  err.middle.push((pub - (sr - night / 2)) * 60);
}
const absStat = a => {
  const s = a.map(Math.abs).sort((x, y) => x - y);
  return { n: s.length, medianAbsMin: +s[Math.floor(s.length / 2)].toFixed(1), maxAbsMin: +s[s.length - 1].toFixed(1) };
};
console.log('\nsummer Fajr against each construction, on the blank-column days');
for (const [k, a] of Object.entries(err)) if (a.length) console.log('  ', k.padEnd(12), JSON.stringify(absStat(a)));

// 4. Both Asr columns: confirm they really are the one-shadow and two-shadow rules.
let sameCount = 0;
const gap = [];
for (const r of rows) {
  if (!r.asr1 || !r.asr2) continue;
  const g = Math.round((toH(r.asr2) - toH(r.asr1)) * 60);
  gap.push(g);
  if (g === 0) sameCount++;
}
console.log(`\n2x-skygge minus 1x-skygge, minutes ${JSON.stringify(stat(gap))}, identical on ${sameCount} of ${gap.length} days`);
