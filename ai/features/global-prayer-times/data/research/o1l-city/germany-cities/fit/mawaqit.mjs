// mawaqit mosque calendars: the platform's own engine against the Diyanet table
// for the same city. The mawaqit year carries a 29 February in a non-leap year
// (a publication defect); that row is dropped for the fit and recorded.
import fs from 'node:fs';
import { fitTable } from './engine.mjs';

const cols = { fajr: 'fajr', sunrise: 'sunrise', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
const candidates = [
  { name: 'MWL 18/17', fa: 18, is: 17 },
  { name: 'Diyanet-Europe 18/16', fa: 18, is: 16 },
  { name: 'ISNA 15/15', fa: 15, is: 15 },
  { name: 'Egypt 19.5/17.5', fa: 19.5, is: 17.5 },
];
const mosques = [
  { tag: 'duisburg-ali', lat: 51.424309869569, lng: 6.7527937889099, diyanet: 'duisburg' },
  { tag: 'hannover-ditib', lat: 52.4172906, lng: 9.7603141, diyanet: 'hannover' },
];
const out = {};
for (const m of mosques) {
  const raw = JSON.parse(fs.readFileSync(`./data/mawaqit-${m.tag}-2026.json`, 'utf8'));
  const clean = {};
  for (const [k, v] of Object.entries(raw)) if (k !== '2026-02-29') clean[k] = v;
  fs.writeFileSync(`./data/mawaqit-${m.tag}-2026.json`, JSON.stringify(clean, null, 0));
  const cfg = { tag: m.tag, file: `./data/mawaqit-${m.tag}-2026.json`, cols, lat: m.lat, lng: m.lng, tz: 'Europe/Berlin' };
  const res = await fitTable(cfg, candidates, { skipFree: false });
  const d = JSON.parse(fs.readFileSync(`./data/de-diyanet-${m.diyanet}-2026.json`, 'utf8'));
  let diff = {};
  for (const p of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const vals = Object.keys(clean).filter((k) => d[k]).map((k) => {
      const a = clean[k][p].split(':').map(Number), b = d[k][p].split(':').map(Number);
      return (a[0] * 60 + a[1]) - (b[0] * 60 + b[1]);
    });
    vals.sort((x, y) => x - y);
    diff[p] = { median: vals[Math.floor(vals.length / 2)], min: vals[0], max: vals[vals.length - 1] };
  }
  out[m.tag] = { rows: res.rowsParsed, solar: res.solar, candidates: res.candidates, freeFit: res.freeFit, vsDiyanet: diff };
  console.log(`${m.tag} n=${res.rowsParsed}`);
  for (const [p, r] of Object.entries(res.solar)) if (r.exact !== undefined) console.log(`  ${p} exact ${r.exact} within1 ${r.within1} worst ${r.worst} (${r.margin} ${r.mode})`);
  for (const c of res.candidates.slice(0, 3)) console.log(`  ${c.name}: fajr ${c.fajr.exact}/${c.fajr.coverage} isha ${c.isha.exact}/${c.isha.coverage}`);
  console.log('  vs Diyanet median diff', JSON.stringify(diff));
  const f = res.freeFit;
  console.log(`  free bare ${f.bare[0].fa}/${f.bare[0].is} sum ${f.bare[0].sum} | portion ${f.portionScan[0].pF.toFixed(3)}/${f.portionScan[0].pI.toFixed(3)}`);
}
fs.writeFileSync('./fit/mawaqit-fit.json', JSON.stringify(out, null, 1));
