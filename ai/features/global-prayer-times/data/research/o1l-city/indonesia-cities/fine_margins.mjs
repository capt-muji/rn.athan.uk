// Fine-grid margin search (0.05 steps, floor/ceil/nearest) per column, pooled across cities,
// model localized in each publisher's own zone. Answers the +1 vs +2 vote split.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { loadAdhan, columns, tzOffsetMinutes, parseHHMM } from './lib.mjs';

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

const corpus = [];
for (const c of table.capitals) {
  const slug = c.city.toLowerCase().replace('kota ', '').replace('kab. ', '').replace(' ', '-');
  for (const [pub, fa, ia, fileFor] of [
    ['sihat', 20, 18, y => `${ROOT}/data/sihat-${y}-${slug}.json`],
    ['khgt', 18, 18, y => `${ROOT}/data/khgt-${y}-${slug}.json`],
  ]) {
    const p = shafiParams(fa, ia);
    for (const y of [2026, 2027]) {
      const f = fileFor(y);
      if (!existsSync(f)) continue;
      const j = JSON.parse(readFileSync(f, 'utf8'));
      const rows = j.rows;
      const dsList = Object.keys(rows).sort();
      if (!dsList.length) continue;
      const tz = pub === 'khgt' && j.timezone ? `Etc/GMT-${j.timezone}` : c.tz;
      const series = {};
      for (const k of COLS) series[k] = { model: [], printed: [] };
      for (const ds of dsList) {
        const [yy, mm, dd] = ds.split('-').map(Number);
        const off = tzOffsetMinutes(tz, new Date(Date.UTC(yy, mm - 1, dd, 12)));
        const cols = columns(A, { lat: c.lat, lng: c.lng }, new Date(Date.UTC(yy, mm - 1, dd, 0)), p);
        for (const k of COLS) {
          series[k].model.push(((cols[k] / 60 + off) % 1440 + 1440) % 1440);
          series[k].printed.push(parseHHMM(rows[ds][pub === 'sihat' && k === 'maghrib' ? 'magrib' : k]));
        }
      }
      corpus.push({ pub, y, slug, series });
    }
  }
  process.stdout.write(slug + ' ');
}

const modes = ['floor', 'ceil', 'nearest'];
const roundMin = (v, m) => m === 'floor' ? Math.floor(v) : m === 'ceil' ? Math.ceil(v) : Math.round(v);
const out = {};
for (const pub of ['sihat', 'khgt']) {
  const parts = corpus.filter(r => r.pub === pub);
  if (!parts.length) continue;
  out[pub] = {};
  for (const k of COLS) {
    const model = parts.flatMap(r => r.series[k].model);
    const printed = parts.flatMap(r => r.series[k].printed);
    let best = null;
    for (const mode of modes) {
      for (let mg = -6; mg <= 8.0001; mg += 0.05) {
        let exact = 0, w1 = 0, worst = 0;
        for (let i = 0; i < model.length; i++) {
          const diff = Math.abs(roundMin(model[i] + mg, mode) - printed[i]);
          if (diff === 0) exact++;
          if (diff <= 1) w1++;
          if (diff > worst) worst = diff;
        }
        if (!best || exact > best.exact) best = { mode, margin: Math.round(mg * 100) / 100, exact, w1, worst, n: model.length };
      }
    }
    out[pub][k] = best;
  }
}
writeFileSync(ROOT + '/data/fine-margins.json', JSON.stringify(out, null, 1));
console.log('\nfine margins written');
