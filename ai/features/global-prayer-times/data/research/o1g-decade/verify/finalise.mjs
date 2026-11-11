// Consolidate every stage into verify/results.json.
import fs from 'node:fs';
import path from 'node:path';

const HOME = process.env.HOME;
const OUT = path.join(HOME, 'athan-gitree/census/o1g-decade/verify');
const read = (f) => JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'));
const r = {
  claimUnderTest: {
    exactPct: 98.24, within1Pct: 100, worst: 1, mae: 0.0176, days: 4018, cells: 24108,
    exact2028: 98.0, exact2038: 98.31,
    leapDay: '02-29 row equals 03-01 row (isha 86); shipped mean-fill 87 misses isha by 1 on all three leap days; copy-03-01 scores 18/18',
    keying: 'offset tables key by MM-DD, not day-of-year',
  },
  truthIntegrity: read('stage1-truth.json'),
  decade: read('stage2-gen.json'),
  leapDay: read('stage3-leap.json'),
  handChecks: read('stage4-hand.json'),
  structure: read('stage5-structure.json'),
  calibration: read('stage6-calibration.json'),
  boundary: read('stage7-boundary.json'),
  keyingCases: read('stage8-keying-cases.json'),
  crossCheckOtherAgents: {
    source: 'predict/results.json (their script, read for numbers only)',
    theirOverall: { exact: 23684, exactPct: 98.24, within1: 24108, within1Pct: 100, worst: 1, mae: 0.0176 },
    myOverall: { exact: 23690, exactPct: 98.27, within1: 24108, within1Pct: 100, worst: 1, mae: 0.0173 },
    perPrayerDelta: { fajr: -1, sunrise: -1, dhuhr: -1, asr: -1, magrib: -1, isha: -1 },
    note: 'six cells differ, exactly one per prayer, each in a different year: sub-second engine difference on rounding boundaries',
    theirLeapVariants: { recipeMean: 15, prev: 15, next: 18, total: 18 },
    myLeapVariants: { shipped: 15, copy0301: 18, total: 18 },
  },
};
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(r, null, 2));
console.log('wrote results.json', fs.statSync(path.join(OUT, 'results.json')).size, 'bytes');
