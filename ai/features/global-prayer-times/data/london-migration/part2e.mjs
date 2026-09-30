// R13 Part 2e: the FULL six-field offline reconstruction of London.
// Part 2c settled Fajr and Isha. The other four are Dhuhr = transit + 5, Maghrib = sunset + 3,
// sunrise = sunrise - 3, Asr = Mithl 1. This measures all six at once, which is what a fully
// offline London source would have to ship.

import fs from 'node:fs';
import { adhan, readElm, readLpt, toMin, computeDay, FIELDS } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const ERA_B2 = [2022, 2025, 2026];
const years = {};
for (const y of ERA_B2) years[y] = readElm(y);
const lpt = readLpt();

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
const perYear = {};
for (const y of ERA_B2) perYear[y] = intervalsOf(years[y]);

// `CalculationMethod.MuslimWorldLeague()` carries `methodAdjustments.dhuhr = 1`, which would be
// silently added to the transit. `Other` carries none, so the reconstruction applies only the
// margins East London Mosque publishes.
const mkParams = (madhab) => {
  const p = new adhan.CalculationParameters('Other', 18, 17);
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab[madhab];
  return p;
};

const LAT = 51.5;
const LON = -0.165;

say('R13 PART 2e: the full six-field offline reconstruction of London');
say(`Point: ${LAT}, ${LON}. adhan 4.4.6 sun, rounding None then half-up. Era B2: ${ERA_B2.join(', ')}.`);
say('Published rules, per East London Mosque\'s own explainer:');
say('  sunrise = HMNAO sunrise - 3      Dhuhr = HMNAO transit + 5');
say('  Maghrib = HMNAO sunset  + 3      Asr   = Mithl 1 (one shadow), Asr 2 = Mithl 2');
say('  Fajr    = (published sunrise + 3) - interval');
say('  Isha    = (published Maghrib - 3) + interval');
say('');

const coords = new adhan.Coordinates(LAT, LON);
const paramsShafi = mkParams('Shafi');
const paramsHanafi = mkParams('Hanafi');

const tally = {};
for (const f of [...FIELDS, 'asr_2']) tally[f] = { n: 0, exact: 0, w1: 0, worst: 0, misses: [] };

for (const y of ERA_B2) {
  const rows = years[y];
  const t = perYear[y];
  for (const d of Object.keys(rows).sort()) {
    const iv = t[d.slice(5)];
    if (!iv) continue;
    const c = computeDay(d, coords, paramsShafi);
    const cH = computeDay(d, coords, paramsHanafi);
    const srComputed = Math.round(c.sunrise);
    const mgComputed = Math.round(c.magrib);
    const reconstructed = {
      sunrise: srComputed - 3,
      dhuhr: Math.round(c.dhuhr) + 5,
      asr: Math.round(c.asr),
      magrib: mgComputed + 3,
      fajr: srComputed - iv.fajr,
      isha: mgComputed + iv.isha,
      asr_2: Math.round(cH.asr),
    };
    for (const f of [...FIELDS, 'asr_2']) {
      const pub = toMin(rows[d][f]);
      if (pub === null || reconstructed[f] === undefined) continue;
      const delta = reconstructed[f] - pub;
      const s = tally[f];
      s.n += 1;
      if (delta === 0) s.exact += 1;
      if (Math.abs(delta) <= 1) s.w1 += 1;
      s.worst = Math.max(s.worst, Math.abs(delta));
      if (delta !== 0) s.misses.push(`${d}${delta > 0 ? '+' : ''}${delta}`);
    }
  }
}

say('== 2e.1 Six fields plus the second Asr column, all at once ==');
say('field    n      exact              within 1 min       worst  misses beyond 1 min');
for (const f of [...FIELDS, 'asr_2']) {
  const s = tally[f];
  const beyond = s.n - s.w1;
  say(
    `${f.padEnd(8)} ${String(s.n).padStart(5)} ${`${s.exact} (${((100 * s.exact) / s.n).toFixed(2)}%)`.padStart(18)} ${`${s.w1} (${((100 * s.w1) / s.n).toFixed(2)}%)`.padStart(18)} ${String(s.worst).padStart(5)}  ${beyond}`
  );
}
say('');

const sixFields = FIELDS;
const totalN = sixFields.reduce((a, f) => a + tally[f].n, 0);
const totalExact = sixFields.reduce((a, f) => a + tally[f].exact, 0);
const totalW1 = sixFields.reduce((a, f) => a + tally[f].w1, 0);
say(`Six fields combined: ${totalExact}/${totalN} exact (${((100 * totalExact) / totalN).toFixed(2)}%), ${totalW1}/${totalN} within 1 minute (${((100 * totalW1) / totalN).toFixed(2)}%).`);
say(`Worst error on any of the six: ${Math.max(...sixFields.map((f) => tally[f].worst))} minute(s).`);
say('');

say('== 2e.2 The Asr problem, stated plainly ==');
say(`adhan's Shafi Asr against published asr (Mithl 1): exact ${tally.asr.exact}/${tally.asr.n} (${((100 * tally.asr.exact) / tally.asr.n).toFixed(2)}%), within 1 min ${((100 * tally.asr.w1) / tally.asr.n).toFixed(2)}%, worst ${tally.asr.worst}`);
say(`adhan's Hanafi Asr against published asr_2 (Mithl 2): exact ${tally.asr_2.exact}/${tally.asr_2.n} (${((100 * tally.asr_2.exact) / tally.asr_2.n).toFixed(2)}%), within 1 min ${((100 * tally.asr_2.w1) / tally.asr_2.n).toFixed(2)}%, worst ${tally.asr_2.worst}`);
say('Wave 1 recorded the same gap: adhan uses the noon declination, London\'s source treats the');
say('shadow target as an apparent altitude with refraction, so the two differ on boundary days.');
say('');

say('== 2e.3 Per-field misses, listed in full where few enough ==');
for (const f of [...FIELDS, 'asr_2']) {
  const s = tally[f];
  say(`${f}: ${s.misses.length} misses${s.misses.length <= 30 ? ` -> ${s.misses.join(' ')}` : ''}`);
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part2e.txt', out + '\n');
console.log(out);
