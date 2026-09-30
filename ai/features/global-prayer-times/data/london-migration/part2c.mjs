// R13 Part 2c: the fully offline London question, era by era.
// Wave 1 established the sun point moved between era B1 (2015 to 2021, best at 51.5,-0.1275)
// and era B2 (2022 to 2026, best at 51.5,-0.165). Part 2b scored every year at B2's point,
// which under-reports B1. This fits each era its own point and reports both.

import fs from 'node:fs';
import { adhan, readLpt, readElm, toMin, computeDay } from './lib.mjs';

const lines = [];
const say = (s = '') => lines.push(s);

const ERA_B1 = [2015, 2017, 2018, 2019, 2020, 2021];
const ERA_B2 = [2022, 2025, 2026];
const ALL = [...ERA_B1, ...ERA_B2];
const years = {};
for (const y of ALL) years[y] = readElm(y);
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

// The shipped table: 2026's, which the app's own captured API year confirms.
const table = intervalsOf(years[2026]);
// The per-year table, which is what a source that carries its own edits would ship.
const perYear = {};
for (const y of ALL) perYear[y] = intervalsOf(years[y]);

const mkParams = () => {
  const p = adhan.CalculationMethod.MuslimWorldLeague();
  p.rounding = adhan.Rounding.None;
  p.madhab = adhan.Madhab.Shafi;
  return p;
};

const score = (lat, lon, yearList, tableFor) => {
  const coords = new adhan.Coordinates(lat, lon);
  const params = mkParams();
  let n = 0;
  let srExact = 0;
  let mgExact = 0;
  let fExact = 0;
  let iExact = 0;
  let fW1 = 0;
  let iW1 = 0;
  let worst = 0;
  const misses = [];
  for (const y of yearList) {
    const rows = years[y];
    const t = tableFor(y);
    for (const d of Object.keys(rows).sort()) {
      const iv = t[d.slice(5)];
      const pubSr = toMin(rows[d].sunrise);
      const pubMg = toMin(rows[d].magrib);
      const pubF = toMin(rows[d].fajr);
      const pubI = toMin(rows[d].isha);
      if (!iv || [pubSr, pubMg, pubF, pubI].some((v) => v === null)) continue;
      const c = computeDay(d, coords, params);
      const sr = Math.round(c.sunrise);
      const mg = Math.round(c.magrib);
      n += 1;
      if (sr - 3 === pubSr) srExact += 1;
      if (mg + 3 === pubMg) mgExact += 1;
      const dF = sr - iv.fajr - pubF;
      const dI = mg + iv.isha - pubI;
      if (dF === 0) fExact += 1;
      else misses.push(`F${d}${dF > 0 ? '+' : ''}${dF}`);
      if (dI === 0) iExact += 1;
      else misses.push(`I${d}${dI > 0 ? '+' : ''}${dI}`);
      if (Math.abs(dF) <= 1) fW1 += 1;
      if (Math.abs(dI) <= 1) iW1 += 1;
      worst = Math.max(worst, Math.abs(dF), Math.abs(dI));
    }
  }
  return { lat, lon, n, srExact, mgExact, fExact, iExact, fW1, iW1, worst, misses };
};

const gridSearch = (yearList, tableFor) => {
  const out = [];
  for (let lat = 51.48; lat <= 51.53 + 1e-9; lat += 0.0025) {
    for (let lon = -0.20; lon <= -0.07 + 1e-9; lon += 0.0025) {
      out.push(score(Number(lat.toFixed(4)), Number(lon.toFixed(4)), yearList, tableFor));
    }
  }
  out.sort((a, b) => b.fExact + b.iExact - (a.fExact + a.iExact));
  return out;
};

say('R13 PART 2c: fully offline London, era by era, with per-era coordinates');
say('Baseline: adhan 4.4.6 sun, rounding None then nearest. Only sunrise and sunset are used,');
say('so the Fajr and Isha ANGLES of the method are irrelevant here.');
say('');

for (const [eraName, yearList] of [
  ['era B1 (2015 to 2021)', ERA_B1],
  ['era B2 (2022, 2025, 2026)', ERA_B2],
]) {
  say(`== ${eraName}, per-year interval table (what a source carrying its own edits would ship) ==`);
  const grid = gridSearch(yearList, (y) => perYear[y]);
  const total = 2 * grid[0].n;
  say('lat      lon       n days  Fajr exact  Isha exact  combined        worst  sunrise exact  maghrib exact');
  for (const r of grid.slice(0, 6)) {
    say(
      `${r.lat.toFixed(4)}  ${r.lon.toFixed(4)}  ${String(r.n).padStart(6)}  ${String(r.fExact).padStart(10)}  ${String(r.iExact).padStart(10)}  ${`${r.fExact + r.iExact}/${total} (${((100 * (r.fExact + r.iExact)) / total).toFixed(2)}%)`.padStart(20)}  ${String(r.worst).padStart(5)}  ${String(r.srExact).padStart(13)}  ${String(r.mgExact).padStart(13)}`
    );
  }
  const b = grid[0];
  say(`  Grid points evaluated: ${grid.length}`);
  say(`  Best: ${b.lat}, ${b.lon}. Within 1 minute: Fajr ${b.fW1}/${b.n}, Isha ${b.iW1}/${b.n}. Worst error ${b.worst} min.`);
  say(`  Misses beyond 1 minute: ${b.misses.filter((m) => !/[+-]1$/.test(m)).length}`);
  say('');
}

say('== 2c.1 One shipped table (2026\'s) across BOTH eras, at each era\'s own best point ==');
const b1 = gridSearch(ERA_B1, () => table)[0];
const b2 = gridSearch(ERA_B2, () => table)[0];
for (const [name, r] of [
  ['era B1 2015-2021', b1],
  ['era B2 2022/25/26', b2],
]) {
  say(
    `${name.padEnd(20)} at ${r.lat},${r.lon}: Fajr ${r.fExact}/${r.n} exact, Isha ${r.iExact}/${r.n} exact, within 1 min ${r.fW1 + r.iW1}/${2 * r.n}, worst ${r.worst}`
  );
}
say('');

say('== 2c.2 The current era alone (2022, 2025, 2026), which is what ships today ==');
{
  const grid = gridSearch(ERA_B2, () => table);
  const b = grid[0];
  say(`Best point: ${b.lat}, ${b.lon}`);
  say(`  Days: ${b.n}. Values: ${2 * b.n}.`);
  say(`  Fajr exact ${b.fExact}/${b.n} (${((100 * b.fExact) / b.n).toFixed(2)}%), within 1 min ${b.fW1}/${b.n} (${((100 * b.fW1) / b.n).toFixed(2)}%)`);
  say(`  Isha exact ${b.iExact}/${b.n} (${((100 * b.iExact) / b.n).toFixed(2)}%), within 1 min ${b.iW1}/${b.n} (${((100 * b.iW1) / b.n).toFixed(2)}%)`);
  say(`  Worst error: ${b.worst} min. Values beyond 1 minute: ${b.misses.filter((m) => !/[+-]1$/.test(m)).length}`);
  say(`  Sunrise reproduced (computed - 3 = published): ${b.srExact}/${b.n}`);
  say(`  Maghrib reproduced (computed + 3 = published): ${b.mgExact}/${b.n}`);
  say(`  Every miss: ${b.misses.join(' ')}`);
}
say('');

say('== 2c.3 2026 alone, against the app\'s own captured API year rather than the ELM PDF ==');
{
  const coords = new adhan.Coordinates(51.5, -0.165);
  const params = mkParams();
  let fExact = 0;
  let iExact = 0;
  let n = 0;
  const misses = [];
  for (const d of Object.keys(lpt).sort()) {
    const iv = table[d.slice(5)];
    if (!iv) continue;
    const c = computeDay(d, coords, params);
    n += 1;
    const dF = Math.round(c.sunrise) - iv.fajr - toMin(lpt[d].fajr);
    const dI = Math.round(c.magrib) + iv.isha - toMin(lpt[d].isha);
    if (dF === 0) fExact += 1;
    else misses.push(`F${d}${dF > 0 ? '+' : ''}${dF}`);
    if (dI === 0) iExact += 1;
    else misses.push(`I${d}${dI > 0 ? '+' : ''}${dI}`);
  }
  say(`  51.5,-0.165 nearest: Fajr ${fExact}/${n}, Isha ${iExact}/${n}. Misses: ${misses.join(' ')}`);
}
say('');

say('== 2c.4 How near the misses are to a rounding boundary ==');
say('If every miss is a computed sun event within a fraction of a second of a half-minute,');
say('the gap is HMNAO\'s own rounding, not a modelling error.');
{
  const coords = new adhan.Coordinates(51.5, -0.165);
  const params = mkParams();
  const rows = { ...years[2022], ...years[2025], ...years[2026] };
  const missDays = [];
  for (const d of Object.keys(rows).sort()) {
    const iv = table[d.slice(5)];
    const pubF = toMin(rows[d].fajr);
    const pubI = toMin(rows[d].isha);
    if (!iv || pubF === null || pubI === null) continue;
    const c = computeDay(d, coords, params);
    const dF = Math.round(c.sunrise) - iv.fajr - pubF;
    const dI = Math.round(c.magrib) + iv.isha - pubI;
    if (dF !== 0) missDays.push({ d, field: 'sunrise', v: c.sunrise, delta: dF });
    if (dI !== 0) missDays.push({ d, field: 'sunset', v: c.magrib, delta: dI });
  }
  say(`  ${missDays.length} misses across 2022, 2025 and 2026.`);
  for (const m of missDays) {
    const frac = m.v - Math.floor(m.v);
    say(
      `  ${m.d} ${m.field.padEnd(8)} computed ${m.v.toFixed(4)} min, fraction ${frac.toFixed(4)}, distance from .5 boundary ${Math.abs(frac - 0.5).toFixed(4)} min (${(Math.abs(frac - 0.5) * 60).toFixed(1)} s), delta ${m.delta > 0 ? '+' : ''}${m.delta}`
    );
  }
}

const out = lines.join('\n');
fs.writeFileSync('/Users/muji/athan-global-scratch/r13/part2c.txt', out + '\n');
console.log(out);
