// Germany year-2 hunt: the Diyanet portal's Munich, Hamburg, Stuttgart 2026
// city-years, fitted beside the held Koeln/Berlin/Frankfurt recipe (18/16 +
// domestic temkin). Run: TZ=Europe/Berlin node fit/germany2.mjs
import fs from 'node:fs';
import { fitTable, printTable } from './engine.mjs';
import { loadAdhan } from './lib.mjs';

const HOME = process.env.HOME;
const D = HOME + '/athan-gitree/census/o1l-city/watches-eu/data/';
const OUT = HOME + '/athan-gitree/census/o1l-city/watches-eu/fit/germany2-fit.json';

const candidates = [
  { name: 'Diyanet domestic 18/17 bare', fa: 18, is: 17 },
  { name: 'Diyanet-Europe 18/16 bare', fa: 18, is: 16 },
  { name: 'MWL 18/17 bare', fa: 18, is: 17 },
  { name: 'Karachi 18/18 bare', fa: 18, is: 18 },
];

const adhan = await loadAdhan();
const stockPresets = [
  { name: 'stock Turkey 18/17 shafi', make: () => adhan.CalculationMethod.Turkey(), madhab: 'shafi' },
];

const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const cities = [
  { tag: 'muenchen', lat: 48.1372, lng: 11.5756 },
  { tag: 'hamburg', lat: 53.5511, lng: 9.9937 },
  { tag: 'stuttgart', lat: 48.7758, lng: 9.1829 },
];

const out = { job: 'germany2', meta: { adhan: '4.4.6', rows: '2026 full year, Diyanet portal' }, tables: [] };
for (const c of cities) {
  const res = await fitTable({ tag: c.tag, file: `${D}de-diyanet-${c.tag}-2026.json`, cols, lat: c.lat, lng: c.lng, tz: 'Europe/Berlin' }, candidates, { stockPresets });
  out.tables.push(res);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  printTable(res);
  for (const st of res.stock) {
    console.log(`  stock ${st.name}: total ${st.total}  ` + Object.entries(st.per).map(([p, r]) => `${p} ${r.exact}/${r.coverage}`).join(' '));
  }
}
console.log('\nwrote germany2-fit.json');
