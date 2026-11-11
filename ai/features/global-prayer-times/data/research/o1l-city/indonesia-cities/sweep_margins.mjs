// Per-column margin sweep for both publishers, all cities, all held years.
// Model computed once per (city, year) at each publisher's angle pair; only margins/modes sweep.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { loadAdhan, columns, tzOffsetMinutes, parseHHMM, bestMargin } from './lib.mjs';

const ROOT = process.cwd();
const A = await loadAdhan();
const table = JSON.parse(readFileSync(ROOT + '/data/cities.json', 'utf8'));
const COLS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function shafiParams(fa, ia) {
  const p = new A.CalculationParameters('Other', fa, ia);
  p.method = 'Other';
  p.madhab = 'shafi';
  return p;
}

function modelSeries(city, dsList, p, tzOverride) {
  const tz = tzOverride || city.tz;
  const out = {};
  for (const k of COLS) out[k] = [];
  for (const ds of dsList) {
    const [y, m, d] = ds.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 0));
    const off = tzOffsetMinutes(tz, new Date(Date.UTC(y, m - 1, d, 12)));
    const cols = columns(A, { lat: city.lat, lng: city.lng }, date, p);
    for (const k of COLS) out[k].push(((cols[k] / 60 + off) % 1440 + 1440) % 1440);
  }
  return out;
}

const report = { sweeps: {} };
for (const c of table.capitals) {
  const slug = c.city.toLowerCase().replace('kota ', '').replace('kab. ', '').replace(' ', '-');
  const entry = {};
  for (const [pub, angles, fileFor] of [
    ['sihat', [20, 18], y => `${ROOT}/data/sihat-${y}-${slug}.json`],
    ['khgt', [18, 18], y => `${ROOT}/data/khgt-${y}-${slug}.json`],
  ]) {
    const p = shafiParams(angles[0], angles[1]);
    for (const y of [2026, 2027]) {
      const f = fileFor(y);
      if (!existsSync(f)) continue;
      const j = JSON.parse(readFileSync(f, 'utf8'));
      const rows = j.rows;
      const dsList = Object.keys(rows).sort();
      if (!dsList.length) continue;
      const key = `${pub}-${y}-${slug}`;
      const tzOverride = pub === 'khgt' && j.timezone ? `Etc/GMT-${j.timezone}` : null;
      const model = modelSeries(c, dsList, p, tzOverride);
      const sweep = {};
      for (const k of COLS) {
        const printed = dsList.map(ds => parseHHMM(rows[ds][pub === 'sihat' && k === 'maghrib' ? 'magrib' : k]));
        sweep[k] = bestMargin(model[k], printed, { m0: -10, step: 0.5, jMax: 30 });
      }
      report.sweeps[key] = sweep;
    }
  }
  process.stdout.write(slug + ' ');
}
writeFileSync(ROOT + '/data/sweeps.json', JSON.stringify(report, null, 1));
console.log('\nsweeps written');
