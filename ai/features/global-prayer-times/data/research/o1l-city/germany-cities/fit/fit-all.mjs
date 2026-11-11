// The Diyanet/DITIB German city layer, fitted at the publisher's own reference
// point (IGMG's payload publishes the same 0.1-degree gazetteer point the
// portal computes at). Two datasets: the portal's 2026 year per city, and the
// IGMG mirror's 14-month window (2026-10..2027-11) for the forward test.
// Run: TZ=Europe/Berlin node fit/fit-all.mjs
import fs from 'node:fs';
import { fitTable, solarScores, makeContext, loadTable, scoreCandidate, printTable } from './engine.mjs';
import { loadAdhan, bestMargin } from './lib.mjs';

const adhan = await loadAdhan();
const index = JSON.parse(fs.readFileSync('./data/igmg-index.json', 'utf8'));
const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const candidates = [
  { name: 'Diyanet-Europe 18/16', fa: 18, is: 16 },
  { name: 'Diyanet-domestic 18/17', fa: 18, is: 17 },
  { name: 'MWL 18/17', fa: 18, is: 17 },
  { name: 'Karachi 18/18', fa: 18, is: 18 },
];
const stockPresets = [{ name: 'stock Turkey 18/17 shafi', make: () => adhan.CalculationMethod.Turkey(), madhab: 'shafi' }];
const roundN = (d) => d.getHours() * 60 + d.getMinutes() + (d.getSeconds() >= 30 ? 1 : 0);

// Zero-margin angle discrimination over the winter months only (Oct-Mar).
const winterAngle = async (cfg, angles, prayer) => {
  const t = loadTable(cfg);
  const slots = t.slots.filter((s) => { const m = s.date.getMonth() + 1; return m <= 3 || m >= 10; });
  const ctx = await makeContext(cfg.lat, cfg.lng, slots);
  return angles.map((a) => {
    let ex = 0, w1 = 0, n = 0, worst = 0;
    for (let i = 0; i < slots.length; i++) {
      const d = prayer === 'fajr' ? ctx.hourAngle(i, -a, false) : ctx.hourAngle(i, -a, true);
      if (isNaN(d.getTime())) continue;
      n++;
      const diff = Math.abs(roundN(d) - slots[i].chart[prayer]);
      if (diff === 0) ex++;
      if (diff <= 1) w1++;
      if (diff > worst) worst = diff;
    }
    return { angle: a, exact: ex, within1: w1, worst, coverage: n };
  });
};

const result = { job: 'germany-city-layer', meta: { adhan: '4.4.6', point: 'IGMG published sun lat/lon (0.1 deg gazetteer)' }, cities: [] };

for (const tag of Object.keys(index)) {
  const { lat, lon } = index[tag].sun;
  const out = { tag, lat, lon };
  for (const [set, file] of [['portal2026', `./data/de-diyanet-${tag}-2026.json`], ['igmg14mo', `./data/igmg-${tag}.json`]]) {
    if (!fs.existsSync(file)) continue;
    const cfg = { tag: `${tag}-${set}`, file, cols, lat, lng: lon, tz: 'Europe/Berlin' };
    const res = await fitTable(cfg, candidates, { stockPresets, skipFree: true });
    const ang = {
      isha: await winterAngle(cfg, [15.5, 15.75, 16, 16.25, 16.5, 17], 'isha'),
      fajr: await winterAngle(cfg, [17.5, 18, 18.25, 18.5], 'fajr'),
    };
    const t = loadTable(cfg);
    const byYear = [];
    for (const y of [2026, 2027]) {
      const sl = t.slots.filter((s) => s.date.getFullYear() === y);
      if (!sl.length) continue;
      const yctx = await makeContext(lat, lon, sl);
      const c = scoreCandidate(yctx, sl, candidates[0], solarScores(yctx, sl, cols));
      byYear.push({ year: y, days: sl.length, fajr: `${c.fajr.exact}/${c.fajr.coverage}`, isha: `${c.isha.exact}/${c.isha.coverage}` });
    }
    const month = (m, y) => t.slots.filter((s) => s.date.getMonth() === m && s.date.getFullYear() === y);
    const meanOf = (sl, p) => (sl.length ? sl.reduce((a, s) => a + s.chart[p], 0) / sl.length : null);
    out[set] = {
      rows: res.rowsParsed,
      solar: res.solar,
      recipe: res.candidates,
      stock: res.stock[0],
      angles: ang,
      amplitude: {
        fajr: +(meanOf(month(0, 2027), 'fajr') - meanOf(month(6, 2027), 'fajr')).toFixed(1),
        isha: +(meanOf(month(0, 2027), 'isha') - meanOf(month(6, 2027), 'isha')).toFixed(1),
      },
      byYear,
    };
  }
  result.cities.push(out);
  fs.writeFileSync('./fit/germany-city-fit.json', JSON.stringify(result, null, 1));

  const a = out.portal2026, b = out.igmg14mo;
  const fmt = (r) => `${r.recipe[0].fa}/${r.recipe[0].is} fajr ${r.recipe[0].fajr.exact}/${r.recipe[0].fajr.coverage} isha ${r.recipe[0].isha.exact}/${r.recipe[0].isha.coverage} | sr ${r.solar.sunrise.exact}(${r.solar.sunrise.margin}) dh ${r.solar.dhuhr.exact}(${r.solar.dhuhr.margin}) asr ${r.solar.asrShafi.exact}(${r.solar.asrShafi.margin}) mg ${r.solar.maghrib.exact}(${r.solar.maghrib.margin})`;
  console.log(`${tag.padEnd(12)} 2026 n=${a?.rows} ${a ? fmt(a) : ''}`);
  if (b) console.log(`${''.padEnd(12)} 14mo n=${b.rows} ${fmt(b)} | winter isha ${b.angles.isha.map((x) => `${x.angle}:${x.exact}`).join(' ')} | fajr ${b.angles.fajr.map((x) => `${x.angle}:${x.exact}`).join(' ')} | byYear ${b.byYear.map((y) => `${y.year}:${y.days}d f${y.fajr} i${y.isha}`).join(' ')}`);
}
console.log('\nwrote fit/germany-city-fit.json');
