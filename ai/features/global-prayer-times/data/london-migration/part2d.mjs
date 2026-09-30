// R13 Part 2d: classify every miss of the fully offline reconstruction, and test whether
// any tie-break rule closes them. The question this settles: is the residual gap a modelling
// error the app could fix, or HMNAO's own sub-second sun differing from adhan's?

import fs from 'node:fs';
import { adhan, readElm, readLpt, toMin, computeDay } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const ERA_B1 = [2015, 2017, 2018, 2019, 2020, 2021];
const ERA_B2 = [2022, 2025, 2026];
const years = {};
for (const y of [...ERA_B1, ...ERA_B2]) years[y] = readElm(y);

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
for (const y of Object.keys(years)) perYear[y] = intervalsOf(years[y]);

const mkParams = () => {
  const p = adhan.CalculationMethod.MuslimWorldLeague();
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  return p;
};

const ROUNDERS = {
  'half-up (Math.round)': (x) => Math.round(x),
  'half-down': (x) => -Math.round(-x),
  'half-even': (x) => {
    const f = Math.floor(x);
    if (x - f !== 0.5) return Math.round(x);
    return f % 2 === 0 ? f : f + 1;
  },
  'truncate seconds (floor)': (x) => Math.floor(x),
};

const run = (yearList, lat, lon, rounderName) => {
  const round = ROUNDERS[rounderName];
  const coords = new adhan.Coordinates(lat, lon);
  const params = mkParams();
  let n = 0;
  let fExact = 0;
  let iExact = 0;
  const misses = [];
  for (const y of yearList) {
    const rows = years[y];
    const t = perYear[y];
    for (const d of Object.keys(rows).sort()) {
      const iv = t[d.slice(5)];
      const pubF = toMin(rows[d].fajr);
      const pubI = toMin(rows[d].isha);
      if (!iv || pubF === null || pubI === null) continue;
      const c = computeDay(d, coords, params);
      n += 1;
      const dF = round(c.sunrise) - iv.fajr - pubF;
      const dI = round(c.magrib) + iv.isha - pubI;
      if (dF === 0) fExact += 1;
      else misses.push({ d, field: 'sunrise', v: c.sunrise, delta: dF });
      if (dI === 0) iExact += 1;
      else misses.push({ d, field: 'sunset', v: c.magrib, delta: dI });
    }
  }
  return { n, fExact, iExact, misses };
};

say('R13 PART 2d: classifying the residual gap of a fully offline London');
say('Per-year interval table (each year\'s own edits), each era at its own fitted point.');
say('');

const eras = [
  ['era B1 2015-2021', ERA_B1, 51.5, -0.13],
  ['era B2 2022/25/26', ERA_B2, 51.5, -0.165],
];

say('== 2d.1 Tie-break rules compared ==');
say('era                rounder                    Fajr exact   Isha exact   combined');
for (const [name, list, lat, lon] of eras) {
  for (const rounder of Object.keys(ROUNDERS)) {
    const r = run(list, lat, lon, rounder);
    say(
      `${name.padEnd(18)} ${rounder.padEnd(26)} ${`${r.fExact}/${r.n}`.padStart(12)} ${`${r.iExact}/${r.n}`.padStart(12)} ${`${r.fExact + r.iExact}/${2 * r.n} (${((100 * (r.fExact + r.iExact)) / (2 * r.n)).toFixed(2)}%)`.padStart(22)}`
    );
  }
}
say('');

say('== 2d.2 Miss classification, half-up rounding ==');
for (const [name, list, lat, lon] of eras) {
  const r = run(list, lat, lon, 'half-up (Math.round)');
  const dists = r.misses.map((m) => {
    const frac = m.v - Math.floor(m.v);
    return { ...m, sec: Math.abs(frac - 0.5) * 60 };
  });
  const tie = dists.filter((x) => x.sec === 0).length;
  const within1s = dists.filter((x) => x.sec <= 1.0001).length;
  const within3s = dists.filter((x) => x.sec <= 3.0001).length;
  const within10s = dists.filter((x) => x.sec <= 10.0001).length;
  const beyond = dists.filter((x) => x.sec > 10);
  say(`${name}: ${r.misses.length} misses of ${2 * r.n} values (${((100 * r.misses.length) / (2 * r.n)).toFixed(2)}%)`);
  say(`  exactly on the half-minute tie: ${tie}`);
  say(`  within 1 second of the half-minute boundary: ${within1s}`);
  say(`  within 3 seconds: ${within3s}`);
  say(`  within 10 seconds: ${within10s}`);
  say(`  beyond 10 seconds: ${beyond.length}${beyond.length ? ` -> ${beyond.map((x) => `${x.d} ${x.field} ${x.sec.toFixed(1)}s ${x.delta > 0 ? '+' : ''}${x.delta}`).join('; ')}` : ''}`);
  say(`  every miss is +/-1 minute: ${r.misses.every((m) => Math.abs(m.delta) === 1)}`);
  say('');
}

say('== 2d.3 The best achievable: per-era point, per-year table, best tie-break ==');
for (const [name, list, lat, lon] of eras) {
  let best = null;
  for (const rounder of Object.keys(ROUNDERS)) {
    const r = run(list, lat, lon, rounder);
    if (!best || r.fExact + r.iExact > best.r.fExact + best.r.iExact) best = { rounder, r };
  }
  const { rounder, r } = best;
  say(
    `${name}: ${rounder}. Exact ${r.fExact + r.iExact}/${2 * r.n} (${((100 * (r.fExact + r.iExact)) / (2 * r.n)).toFixed(2)}%), ${r.misses.length} values 1 minute out, 0 values 2 or more minutes out: ${r.misses.every((m) => Math.abs(m.delta) === 1)}`
  );
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part2d.txt', out + '\n');
console.log(out);
