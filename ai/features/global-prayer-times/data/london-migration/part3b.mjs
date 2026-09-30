// R13 Part 3b: two loose ends from Part 3.
//   1. Dhuhr reproduced only 0.63% of the fifty years exactly. Is that the +5 margin, the transit, or adhan?
//   2. Four Isha slots revert to the book's value from 2027 onward. Which years held which value?

import fs from 'node:fs';
import { readLupt } from './xlsx.mjs';
import { readElm, readLpt, toMin, adhan, dayDate, londonMinutesExact, ELM_YEARS } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const YEARS = [];
for (let y = 2027; y <= 2076; y += 1) YEARS.push(y);
const years = {};
for (const y of YEARS) years[y] = readLupt(`./lupt/LUPT-${y}.xlsx`);

say('R13 PART 3b: the Dhuhr margin and the four reverted Isha slots');
say('');

say('== 3b.1 Dhuhr: which margin over adhan\'s transit reproduces the published Zuhr? ==');
say('The publisher documents "Zuhr: 5 minutes later" to avoid Zawal. adhan\'s own `dhuhr` may already');
say('carry an offset of its own, so the fitted margin says what the two conventions differ by.');
say('');
const POINTS = [
  ['Charing Cross 51.5073,-0.12755', new adhan.Coordinates(51.5073, -0.12755)],
  ['51.5,-0.1275', new adhan.Coordinates(51.5, -0.1275)],
];
const sunParams = () => {
  const p = adhan.CalculationMethod.MuslimWorldLeague();
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  return p;
};

// Sample every fifth year to keep the sweep quick; the annual curve is what matters, not the count.
const SAMPLE = YEARS.filter((_, i) => i % 5 === 0);
say(`Years sampled: ${SAMPLE.join(', ')}`);
say('');
say('point                              margin  exact              within 1 min       worst');
for (const [label, coords] of POINTS) {
  const params = sunParams();
  const transit = [];
  const published = [];
  for (const y of SAMPLE) {
    for (const d of Object.keys(years[y]).sort()) {
      const pt = new adhan.PrayerTimes(coords, dayDate(d), params);
      transit.push(londonMinutesExact(pt.dhuhr, d));
      published.push(toMin(years[y][d].dhuhr));
    }
  }
  for (const margin of [3, 4, 5, 6]) {
    let e = 0;
    let w1 = 0;
    let worst = 0;
    for (let i = 0; i < transit.length; i += 1) {
      const delta = Math.round(transit[i] + margin) - published[i];
      const a = Math.abs(delta);
      if (a === 0) e += 1;
      if (a <= 1) w1 += 1;
      if (a > worst) worst = a;
    }
    const n = transit.length;
    say(
      `${label.padEnd(34)} ${String(margin).padStart(6)}  ${`${e} (${((100 * e) / n).toFixed(2)}%)`.padStart(17)} ${`${w1} (${((100 * w1) / n).toFixed(2)}%)`.padStart(17)} ${String(worst).padStart(5)}`
    );
  }
  say('');
}

say('  What adhan\'s own `dhuhr` is, against the same day\'s published Zuhr with no margin at all:');
{
  const params = sunParams();
  const coords = new adhan.Coordinates(51.5073, -0.12755);
  const deltas = [];
  for (const d of Object.keys(years[2027]).sort()) {
    const pt = new adhan.PrayerTimes(coords, dayDate(d), params);
    deltas.push(londonMinutesExact(pt.dhuhr, d) - toMin(years[2027][d].dhuhr));
  }
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  say(`  2027, mean of (adhan dhuhr - published Zuhr): ${mean.toFixed(3)} minutes, range ${Math.min(...deltas).toFixed(2)} to ${Math.max(...deltas).toFixed(2)}`);
}
say('');

say('== 3b.2 The four Isha slots, every year the repository or the publisher holds ==');
say('Interval is Isha minus (published Maghrib - 3), in minutes, as everywhere else in this report.');
say('');
const SLOTS = ['06-16', '06-17', '06-18', '06-19', '11-29', '02-01', '03-31'];
const ivAt = (rows, year, slot) => {
  const row = rows[`${year}-${slot}`];
  if (!row) return null;
  return toMin(row.isha) - (toMin(row.magrib) - 3);
};

say(`source            year   ${SLOTS.map((s) => s.padStart(6)).join('')}`);
for (const y of ELM_YEARS) {
  const rows = readElm(y);
  say(`ELM PDF           ${y}   ${SLOTS.map((s) => String(ivAt(rows, y, s) ?? '-').padStart(6)).join('')}`);
}
{
  const rows = readLpt();
  say(`app API capture   2026   ${SLOTS.map((s) => String(ivAt(rows, 2026, s) ?? '-').padStart(6)).join('')}`);
}
for (const y of [2027, 2028, 2035, 2050, 2076]) {
  say(`publisher .xlsx   ${y}   ${SLOTS.map((s) => String(ivAt(years[y], y, s) ?? '-').padStart(6)).join('')}`);
}
say('');
say('Miftahi Table 6, the book\'s own printed values at these slots (wave 1 section 2.15):');
say('  06-16: 83   06-17: 83   06-18: 82   06-19: 82   11-29: 100   02-01: 98   03-31: 80');
say('');

say('== 3b.3 Which table a v2.0 build should ship, measured against every year available ==');
say('Two candidate tables: the app\'s own 2026 capture, and the publisher\'s 2027 generated year.');
say('Scored against every year in the repository AND every published future year.');
say('');
const tableOf = (rows) => {
  const out = {};
  for (const [date, row] of Object.entries(rows)) {
    out[date.slice(5)] = { fajr: toMin(row.sunrise) + 3 - toMin(row.fajr), isha: toMin(row.isha) - (toMin(row.magrib) - 3) };
  }
  return out;
};
const CANDIDATES = [
  ['the app\'s 2026 API capture', tableOf(readLpt())],
  ['the publisher\'s 2027 year', tableOf(years[2027])],
];

const corpora = [
  ['ELM PDFs 2015 to 2026 (era B)', ELM_YEARS.filter((y) => y >= 2015).map((y) => [y, readElm(y)])],
  ['ELM PDFs 2012 to 2014 (era A)', [2012, 2013, 2014].map((y) => [y, readElm(y)])],
  ['publisher .xlsx 2027 to 2076', YEARS.map((y) => [y, years[y]])],
];

say('table                        corpus                            Fajr exact          Isha exact          worst');
for (const [label, table] of CANDIDATES) {
  for (const [corpusLabel, corpus] of corpora) {
    let fE = 0;
    let iE = 0;
    let n = 0;
    let worst = 0;
    for (const [y, rows] of corpus) {
      for (const d of Object.keys(rows).sort()) {
        const iv = table[d.slice(5)];
        if (!iv) continue;
        n += 1;
        const dF = toMin(rows[d].sunrise) + 3 - iv.fajr - toMin(rows[d].fajr);
        const dI = toMin(rows[d].magrib) - 3 + iv.isha - toMin(rows[d].isha);
        if (dF === 0) fE += 1;
        if (dI === 0) iE += 1;
        worst = Math.max(worst, Math.abs(dF), Math.abs(dI));
      }
    }
    say(
      `${label.padEnd(28)} ${corpusLabel.padEnd(33)} ${`${fE}/${n} (${((100 * fE) / n).toFixed(1)}%)`.padStart(19)} ${`${iE}/${n} (${((100 * iE) / n).toFixed(1)}%)`.padStart(19)} ${String(worst).padStart(5)}`
    );
  }
  say('');
}

say('== 3b.4 Asr: does the publisher\'s own Mithl column survive across the fifty years? ==');
say('The gap between the two published Asr columns, which no margin or rounding choice can change.');
{
  const gaps = [];
  for (const y of YEARS) {
    for (const d of Object.keys(years[y])) gaps.push(toMin(years[y][d].asr_2) - toMin(years[y][d].asr));
  }
  say(`  Mithl 2 minus Mithl 1 across all fifty years: ${Math.min(...gaps)} to ${Math.max(...gaps)} minutes, ${gaps.length} values.`);
  const lpt = readLpt();
  const g26 = Object.keys(lpt).map((d) => toMin(lpt[d].asr_2) - toMin(lpt[d].asr));
  say(`  The same gap in the app's own 2026 capture: ${Math.min(...g26)} to ${Math.max(...g26)} minutes.`);
  say('  The app displays `asr`, which is Mithl 1. Wave 1 established the type comment is the reverse.');
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part3b.txt', out + '\n');
console.log(out);
