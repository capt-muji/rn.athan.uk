// Job 4: the German Diyanet years - Koeln, Berlin, Frankfurt (Diyanet portal).
// Does the domestic recipe (18/17 + temkin) reproduce the portal's European
// tables, or does the portal apply the European 18/16?
// Run: TZ=Europe/Berlin node germany.mjs
import fs from 'node:fs';
import { fitTable, printTable } from './engine.mjs';
import { loadAdhan } from './lib.mjs';

const HOME = process.env.HOME;
const E = HOME + '/athan-gitree/census/o1k-wide/europe/data/';
const OUT = HOME + '/athan-gitree/census/o1k-wide/fit4/germany-fit.json';

const candidates = [
  { name: 'Diyanet domestic 18/17 bare', fa: 18, is: 17 },
  { name: 'Diyanet-Europe 18/16 bare', fa: 18, is: 16 },
  { name: 'MWL 18/17 bare', fa: 18, is: 17 },
  { name: 'Karachi 18/18 bare', fa: 18, is: 18 },
];

const adhan = await loadAdhan();
const stockPresets = [
  { name: 'stock Turkey 18/17 hanafi', make: () => adhan.CalculationMethod.Turkey(), madhab: 'hanafi' },
  { name: 'stock Turkey 18/17 shafi', make: () => adhan.CalculationMethod.Turkey(), madhab: 'shafi' },
];

const cols = { fajr: 'fajr_imsak', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'magrib', isha: 'isha' };
const cities = [
  { tag: 'koeln', lat: 50.9375, lng: 6.9603 },
  { tag: 'berlin', lat: 52.52, lng: 13.405 },
  { tag: 'frankfurt', lat: 50.1109, lng: 8.6821 },
];

const out = { job: 'germany', meta: { adhan: '4.4.6', question: 'domestic 18/17+temkin vs European 18/16' }, tables: [] };
for (const c of cities) {
  const res = await fitTable({ tag: `diyanet-${c.tag}`, file: `${E}de-diyanet-${c.tag}-2026.json`, cols, lat: c.lat, lng: c.lng, tz: 'Europe/Berlin' }, candidates, { stockPresets });
  out.tables.push(res);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  printTable(res);
  for (const st of res.stock) {
    console.log(`  stock ${st.name}: total ${st.total}  ` + Object.entries(st.per).map(([p, r]) => `${p} ${r.exact}/${r.coverage}`).join(' '));
  }
}
console.log('\nwrote germany-fit.json');
