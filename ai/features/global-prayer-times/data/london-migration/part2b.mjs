// R13 Part 2b: can the computed sun close the last few boundary days?
// Part 2 found 51.5,-0.165 nearest leaves Fajr 1 miss and Isha 3 misses in 2026, all +/-1 minute.
// This searches a coordinate grid and tests every era-B year, to establish whether a fully
// offline London is exact or merely within one minute.

import fs from 'node:fs';
import { adhan, readLpt, readElm, toMin, datesOf, computeDay } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const lpt = readLpt();
const ERA_B = [2015, 2017, 2018, 2019, 2020, 2021, 2022, 2025, 2026];
const years = {};
for (const y of ERA_B) years[y] = readElm(y);

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

// The shipped table: 2026's, which is 2025's, and equals every era-B year except the
// 03-31 and 16-19 June slots.
const table = intervalsOf(years[2026]);

const mkParams = () => {
  const p = adhan.CalculationMethod.MuslimWorldLeague();
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  return p;
};

const scoreCoord = (lat, lon, rule, yearList) => {
  const round = rule === 'nearest' ? Math.round : rule === 'up' ? Math.ceil : Math.floor;
  const coords = new adhan.Coordinates(lat, lon);
  const params = mkParams();
  let n = 0;
  let sunriseExact = 0;
  let magribExact = 0;
  let fajrExact = 0;
  let ishaExact = 0;
  let worst = 0;
  const misses = [];
  for (const y of yearList) {
    const rows = y === '2026-LPT' ? lpt : years[y];
    for (const d of Object.keys(rows).sort()) {
      const iv = table[d.slice(5)];
      if (!iv) continue;
      const pubSr = toMin(rows[d].sunrise);
      const pubMg = toMin(rows[d].magrib);
      const pubF = toMin(rows[d].fajr);
      const pubI = toMin(rows[d].isha);
      if ([pubSr, pubMg, pubF, pubI].some((v) => v === null)) continue;
      const c = computeDay(d, coords, params);
      const sr = round(c.sunrise);
      const mg = round(c.magrib);
      n += 1;
      if (sr - 3 === pubSr) sunriseExact += 1;
      if (mg + 3 === pubMg) magribExact += 1;
      const dF = sr - iv.fajr - pubF;
      const dI = mg + iv.isha - pubI;
      if (dF === 0) fajrExact += 1;
      else misses.push(`F${y}-${d.slice(5)}${dF > 0 ? '+' : ''}${dF}`);
      if (dI === 0) ishaExact += 1;
      else misses.push(`I${y}-${d.slice(5)}${dI > 0 ? '+' : ''}${dI}`);
      worst = Math.max(worst, Math.abs(dF), Math.abs(dI));
    }
  }
  return { lat, lon, rule, n, sunriseExact, magribExact, fajrExact, ishaExact, worst, misses };
};

say('R13 PART 2b: how exact can a fully offline London be?');
say('');
say('== 2b.1 Coordinate grid, 2026 only, nearest rounding ==');
say('The grid is 0.005 degrees over the plausible London points. Score = Fajr + Isha exact of 730.');
const grid = [];
for (let lat = 51.47; lat <= 51.54 + 1e-9; lat += 0.005) {
  for (let lon = -0.22; lon <= -0.05 + 1e-9; lon += 0.005) {
    const r = scoreCoord(Number(lat.toFixed(4)), Number(lon.toFixed(4)), 'nearest', [2026]);
    grid.push(r);
  }
}
grid.sort((a, b) => b.fajrExact + b.ishaExact - (a.fajrExact + a.ishaExact));
say('lat      lon       Fajr exact  Isha exact  total/730  worst  sunrise exact  maghrib exact');
for (const r of grid.slice(0, 12)) {
  say(
    `${r.lat.toFixed(4)}  ${r.lon.toFixed(4)}  ${String(r.fajrExact).padStart(10)}  ${String(r.ishaExact).padStart(10)}  ${String(r.fajrExact + r.ishaExact).padStart(9)}  ${String(r.worst).padStart(5)}  ${String(r.sunriseExact).padStart(13)}  ${String(r.magribExact).padStart(13)}`
  );
}
say(`Grid points evaluated: ${grid.length}. Best total: ${grid[0].fajrExact + grid[0].ishaExact} of 730.`);
say('');

say('== 2b.2 The best grid point, every era-B year ==');
const bestPoint = grid[0];
say(`Point: ${bestPoint.lat}, ${bestPoint.lon}, rounding nearest, MWL sun (angles irrelevant: only sunrise and sunset are used)`);
say('year   values  Fajr exact       Isha exact       worst  misses');
let allN = 0;
let allF = 0;
let allI = 0;
let allWorst = 0;
const allMisses = [];
for (const y of ERA_B) {
  const r = scoreCoord(bestPoint.lat, bestPoint.lon, 'nearest', [y]);
  allN += r.n;
  allF += r.fajrExact;
  allI += r.ishaExact;
  allWorst = Math.max(allWorst, r.worst);
  allMisses.push(...r.misses);
  say(
    `${y}  ${String(r.n).padStart(6)}  ${`${r.fajrExact}/${r.n}`.padStart(15)}  ${`${r.ishaExact}/${r.n}`.padStart(15)}  ${String(r.worst).padStart(5)}  ${r.misses.length <= 10 ? r.misses.join(' ') : `${r.misses.length} misses`}`
  );
}
say('');
say(`Across all ${ERA_B.length} era-B years: ${allN} days, ${2 * allN} values.`);
say(`  Fajr exact ${allF}/${allN} (${((100 * allF) / allN).toFixed(2)}%)`);
say(`  Isha exact ${allI}/${allN} (${((100 * allI) / allN).toFixed(2)}%)`);
say(`  Combined exact ${allF + allI}/${2 * allN} (${((100 * (allF + allI)) / (2 * allN)).toFixed(2)}%)`);
say(`  Worst error anywhere: ${allWorst} minute(s). Values outside 1 minute: ${allMisses.filter((m) => !/[+-]1$/.test(m)).length}`);
say('');
say('Every miss, listed in full:');
say(`  ${allMisses.join(' ')}`);
say('');

say('== 2b.3 Where the misses come from: computed sun versus published sun on those days ==');
{
  const coords = new adhan.Coordinates(bestPoint.lat, bestPoint.lon);
  const params = mkParams();
  const seen = new Set();
  for (const m of allMisses) {
    const [, kind, year, slot] = /^([FI])(\d{4})-(\d{2}-\d{2})/.exec(m);
    const key = `${year}-${slot}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const d = `${year}-${slot}`;
    const rows = years[Number(year)];
    if (!rows?.[d]) continue;
    const c = computeDay(d, coords, params);
    say(
      `  ${d} (${kind}): computed sunrise ${c.sunrise.toFixed(3)} min (rounds to ${Math.round(c.sunrise)}), published sunrise+3 = ${toMin(rows[d].sunrise) + 3}; computed sunset ${c.magrib.toFixed(3)} (rounds to ${Math.round(c.magrib)}), published magrib-3 = ${toMin(rows[d].magrib) - 3}`
    );
  }
}
say('');

say('== 2b.4 Rounding-boundary proximity: is every miss a half-minute coin flip? ==');
{
  const coords = new adhan.Coordinates(bestPoint.lat, bestPoint.lon);
  const params = mkParams();
  let boundary = 0;
  let total = 0;
  const distances = [];
  for (const y of ERA_B) {
    const rows = years[y];
    for (const d of Object.keys(rows).sort()) {
      const c = computeDay(d, coords, params);
      for (const v of [c.sunrise, c.magrib]) {
        total += 1;
        const frac = Math.abs(v - Math.floor(v) - 0.5);
        distances.push(frac);
        if (frac < 0.01) boundary += 1;
      }
    }
  }
  distances.sort((a, b) => a - b);
  say(`  ${total} computed sun events. ${boundary} lie within 0.01 min (0.6 s) of a half-minute boundary.`);
  say(`  Closest 10 distances from the half-minute, in minutes: ${distances.slice(0, 10).map((x) => x.toFixed(4)).join(' ')}`);
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part2b.txt', out + '\n');
console.log(out);
