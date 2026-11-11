// Season stability for the two year-long surfaces under their fitted recipe,
// plus the printed Jan-to-Jul fajr/isha span (seasonal amplitude).
// Run: TZ=Europe/London node season.mjs
import fs from 'node:fs';
import { makeContext, loadTable } from './engine.mjs';
import { fmtMin } from './lib.mjs';

const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1k-wide/uktowns2/data/';
const S = HOME + '/athan-gitree/census/o1k-wide/ukscotland/data/';

const jobs = [
  {
    town: 'Aberdeen', file: S + 'aberdeen-amic-central-2026.json', lat: 57.1497, lng: -2.0943,
    cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' },
    recipe: { fa: 18, is: 15, portions: { fajr: 1 / 2, isha: 1 / 7 } },
  },
  {
    town: 'Nottingham', file: D + 'nottingham-ic-2026.json', lat: 52.9548, lng: -1.1581,
    cols: { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr1', maghrib: 'magrib', isha: 'isha' },
    recipe: { fa: 18, is: 18 },
  },
];

const out = {};
for (const j of jobs) {
  const t = loadTable(j);
  const ctx = await makeContext(j.lat, j.lng, t.slots);
  const byMonth = {};
  for (let i = 0; i < t.slots.length; i++) {
    const s = t.slots[i];
    const p = ctx.pairSec(i, j.recipe.fa, j.recipe.is, j.recipe.portions ?? null);
    const fv = p.f === null ? null : Math.floor(p.f / 60);
    const iv = p.i === null ? null : Math.floor(p.i / 60);
    const m = s.key.slice(0, 7);
    const b = (byMonth[m] ??= { n: 0, fe: 0, fw: 0, fworst: 0, ie: 0, iw: 0, iworst: 0, fajr: [], isha: [] });
    b.n++;
    b.fajr.push(s.chart.fajr); b.isha.push(s.chart.isha);
    if (fv !== null) {
      const d = Math.abs(fv - s.chart.fajr);
      if (d === 0) b.fe++;
      if (d <= 1) b.fw++;
      if (d > b.fworst) b.fworst = d;
    }
    if (iv !== null) {
      const d = Math.abs(iv - s.chart.isha);
      if (d === 0) b.ie++;
      if (d <= 1) b.iw++;
      if (d > b.iworst) b.iworst = d;
    }
  }
  const mean = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null);
  const table = {};
  for (const [m, b] of Object.entries(byMonth)) {
    table[m] = { days: b.n, fajr: { exact: b.fe, within1: b.fw, worst: b.fworst }, isha: { exact: b.ie, within1: b.iw, worst: b.iworst } };
  }
  const jan = byMonth['2026-01'], jul = byMonth['2026-07'];
  out[j.town] = {
    recipe: j.recipe,
    days: t.slots.length,
    months: table,
    amplitude: {
      fajrJanMin: jan ? fmtMin(Math.min(...jan.fajr)) : null,
      fajrJulMin: jul ? fmtMin(Math.min(...jul.fajr)) : null,
      fajrJanMean: jan ? mean(jan.fajr) : null,
      fajrJulMean: jul ? mean(jul.fajr) : null,
      ishaJanMean: jan ? mean(jan.isha) : null,
      ishaJulMean: jul ? mean(jul.isha) : null,
    },
  };
  console.log(`\n== ${j.town}  recipe ${j.recipe.fa}/${j.recipe.is}${j.recipe.portions ? ' caps ' + j.recipe.portions.fajr.toFixed(2) + '/' + j.recipe.portions.isha.toFixed(2) : ''}  (${t.slots.length} days)`);
  for (const [m, r] of Object.entries(table)) console.log(`  ${m} n${String(r.days).padStart(3)}  fajr ${String(r.fajr.exact).padStart(3)} exact ${String(r.fajr.within1).padStart(3)} w1 worst ${String(r.fajr.worst).padStart(3)}   isha ${String(r.isha.exact).padStart(3)} exact ${String(r.isha.within1).padStart(3)} w1 worst ${String(r.isha.worst).padStart(4)}`);
  const a = out[j.town].amplitude;
  console.log(`  Jan fajr ${a.fajrJanMean} vs Jul ${a.fajrJulMean} (span ${(a.fajrJulMean - a.fajrJanMean).toFixed(0)} min); isha Jan ${a.ishaJanMean} Jul ${a.ishaJulMean}`);
}
fs.writeFileSync(HOME + '/athan-gitree/census/o1k-wide/fit12/season.json', JSON.stringify(out, null, 1));
