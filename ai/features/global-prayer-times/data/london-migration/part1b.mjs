// R13 Part 1b: search the computed parameter space for the best fit to London's published year.
// Every candidate is given every advantage: its own rounding rule, its own coordinates,
// its own high-latitude rule, and a per-field integer offset fitted to London's own digits.
// If the best of these still moves a user's times, no computed configuration is close enough.

import fs from 'node:fs';
import { adhan, readLpt, toMin, datesOf, computeDay, FIELDS, summarise } from './lib.mjs';

const lpt = readLpt();
const dates = datesOf(2026).filter((d) => lpt[d]);
const published = {};
for (const f of FIELDS) published[f] = dates.map((d) => toMin(lpt[d][f]));

const roundBy = (x, rule) =>
  rule === 'nearest' ? Math.round(x) : rule === 'up' ? Math.ceil(x) : Math.floor(x);

/**
 * The integer offset that maximises exact matches for one field, searched over the whole
 * plausible range. This is R6's constant-correction model, fitted per field on London itself.
 */
const fitOffset = (raw, pub, rule) => {
  let best = { offset: 0, exact: -1, w1: -1, worst: Infinity };
  for (let off = -180; off <= 180; off += 1) {
    let exact = 0;
    let w1 = 0;
    let w2 = 0;
    let worst = 0;
    for (let i = 0; i < raw.length; i += 1) {
      if (raw[i] === null || pub[i] === null) continue;
      const delta = roundBy(raw[i] + off, rule) - pub[i];
      const a = Math.abs(delta);
      if (a === 0) exact += 1;
      if (a <= 1) w1 += 1;
      if (a <= 2) w2 += 1;
      if (a > worst) worst = a;
    }
    if (w1 > best.w1 || (w1 === best.w1 && exact > best.exact)) best = { offset: off, exact, w1, w2, worst };
  }
  return best;
};

const coordSet = [
  ['51.5072,-0.1276', new adhan.Coordinates(51.5072, -0.1276)],
  ['51.5,-0.165', new adhan.Coordinates(51.5, -0.165)],
  ['51.5,-0.1275', new adhan.Coordinates(51.5, -0.1275)],
];
const hlrSet = ['MiddleOfTheNight', 'SeventhOfTheNight', 'TwilightAngle'];

const specs = [];

// Family A: a pure angle pair, every Fajr angle against every Isha angle.
for (const fajrAngle of range(8, 20, 0.5)) {
  for (const ishaAngle of range(8, 20, 0.5)) {
    specs.push({ kind: 'angle', fajrAngle, ishaAngle, ishaInterval: 0 });
  }
}
// Family B: an angle Fajr with an interval Isha, which is what London's Isha structurally is.
for (const fajrAngle of range(8, 20, 0.5)) {
  for (const ishaInterval of range(45, 135, 5)) {
    specs.push({ kind: 'interval', fajrAngle, ishaAngle: 0, ishaInterval });
  }
}
// Family C: the Moonsighting Committee's own seasonal function, all three shafaq variants.
for (const shafaq of ['general', 'ahmer', 'abyad']) specs.push({ kind: 'moonsighting', shafaq });

function range(a, b, step) {
  const out = [];
  for (let v = a; v <= b + 1e-9; v += step) out.push(Number(v.toFixed(2)));
  return out;
}

const buildParams = (spec, hlr) => {
  let p;
  if (spec.kind === 'moonsighting') {
    p = adhan.CalculationMethod.MoonsightingCommittee();
    p.shafaq = adhan.Shafaq[spec.shafaq];
  } else {
    p = new adhan.CalculationParameters('Other', spec.fajrAngle, spec.ishaAngle, spec.ishaInterval);
  }
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  p.highLatitudeRule = adhan.HighLatitudeRule[hlr];
  return p;
};

const describe = (spec, hlr, coordName, rule) =>
  spec.kind === 'moonsighting'
    ? `moonsighting shafaq=${spec.shafaq} hlr=${hlr} at ${coordName} round=${rule}`
    : spec.kind === 'angle'
      ? `Fajr ${spec.fajrAngle} / Isha ${spec.ishaAngle} hlr=${hlr} at ${coordName} round=${rule}`
      : `Fajr ${spec.fajrAngle} / Isha maghrib+${spec.ishaInterval}min hlr=${hlr} at ${coordName} round=${rule}`;

// Raw computed values are expensive, so cache one pass per (spec, hlr, coord).
let bestOverall = null;
const perFieldBest = {};
for (const f of FIELDS) perFieldBest[f] = null;

let evaluated = 0;
for (const spec of specs) {
  for (const hlr of hlrSet) {
    for (const [coordName, coords] of coordSet) {
      const params = buildParams(spec, hlr);
      const raw = {};
      for (const f of FIELDS) raw[f] = [];
      for (const d of dates) {
        const c = computeDay(d, coords, params);
        for (const f of FIELDS) raw[f].push(c[f]);
      }
      for (const rule of ['nearest', 'down', 'up']) {
        evaluated += 1;
        const fields = {};
        let totalW1 = 0;
        let totalExact = 0;
        let worst = 0;
        for (const f of FIELDS) {
          const fit = fitOffset(raw[f], published[f], rule);
          fields[f] = fit;
          totalW1 += fit.w1;
          totalExact += fit.exact;
          worst = Math.max(worst, fit.worst);
          const pb = perFieldBest[f];
          if (!pb || fit.w1 > pb.fit.w1 || (fit.w1 === pb.fit.w1 && fit.exact > pb.fit.exact)) {
            perFieldBest[f] = { label: describe(spec, hlr, coordName, rule), fit };
          }
        }
        const cand = { label: describe(spec, hlr, coordName, rule), totalW1, totalExact, worst, fields };
        if (!bestOverall || cand.totalW1 > bestOverall.totalW1 || (cand.totalW1 === bestOverall.totalW1 && cand.totalExact > bestOverall.totalExact)) {
          bestOverall = cand;
        }
      }
    }
  }
}

const lines = [];
const say = (s = '') => lines.push(s);
say('R13 PART 1b: best-fitting computed configuration, searched');
say(`Configurations evaluated: ${evaluated}`);
say(`Days: ${dates.length}, fields: 6, values: ${dates.length * 6}`);
say('Each configuration is also given a per-field integer offset fitted to London itself,');
say('so these numbers are an upper bound on what any computed source could achieve.');
say('');
say(`BEST OVERALL (maximising values within 1 minute): ${bestOverall.label}`);
say(`  total within 1 min: ${bestOverall.totalW1} of ${dates.length * 6} (${((100 * bestOverall.totalW1) / (dates.length * 6)).toFixed(1)}%)`);
say(`  total exact:        ${bestOverall.totalExact} of ${dates.length * 6} (${((100 * bestOverall.totalExact) / (dates.length * 6)).toFixed(1)}%)`);
say(`  worst error across all six fields: ${bestOverall.worst} min`);
say('');
say('field    offset    exact      <=1min     <=2min   worst');
for (const f of FIELDS) {
  const fit = bestOverall.fields[f];
  say(
    `${f.padEnd(8)} ${String(fit.offset).padStart(6)} ${`${fit.exact} (${((100 * fit.exact) / dates.length).toFixed(1)}%)`.padStart(12)} ${`${fit.w1} (${((100 * fit.w1) / dates.length).toFixed(1)}%)`.padStart(12)} ${`${fit.w2} (${((100 * fit.w2) / dates.length).toFixed(1)}%)`.padStart(12)} ${String(fit.worst).padStart(5)}`
  );
}
say('');
say('PER-FIELD CEILING: the best any configuration in the search achieved on that field alone.');
say('These cannot all be had at once; they are separate configurations.');
say('field    best <=1min    exact    worst   configuration');
for (const f of FIELDS) {
  const { label, fit } = perFieldBest[f];
  say(
    `${f.padEnd(8)} ${`${fit.w1} (${((100 * fit.w1) / dates.length).toFixed(1)}%)`.padStart(13)} ${String(fit.exact).padStart(7)} ${String(fit.worst).padStart(7)}   offset ${fit.offset}, ${label}`
  );
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part1b.txt', out + '\n');
console.log(out);
