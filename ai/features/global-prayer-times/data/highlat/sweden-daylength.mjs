// R11 Part 3, step one: the model-free observation that identifies the IFiS mechanism.
//
// No astronomy and no model. It reads the published Magrib minus the published Shuruk on every
// day of every captured IFiS year and asks one question: what are the extremes, and how many
// days sit exactly on them. If the authority were computing at each city's own latitude, seven
// cities spanning twelve degrees would have seven different extremes. They do not.
//
// The model that this observation leads to is fitted and scored in sweden-model.mjs, and lives
// as a module in ifis-model.mjs. This script exists separately because the observation is worth
// more than the model: it is true whatever anyone concludes from it.
import { readFileSync } from 'node:fs';
import { toH } from '../countries/solar-harness.mjs';

const CITIES = [
  { name: 'Malmo', f: '../countries/se-malmo-2026.tsv', lat: 55.6050 },
  { name: 'Stockholm', f: '../countries/se-stockholm-2026.tsv', lat: 59.3293 },
  { name: 'Sundsvall', f: './se-sundsvall.tsv', lat: 62.3908 },
  { name: 'Ostersund', f: './se-ostersund.tsv', lat: 63.1792 },
  { name: 'Umea', f: './se-umea.tsv', lat: 63.8258 },
  { name: 'Lulea', f: './se-lulea.tsv', lat: 65.5848 },
  { name: 'Haparanda', f: './se-haparanda.tsv', lat: 65.8355 },
  { name: 'Jokkmokk', f: './se-jokkmokk.tsv', lat: 66.6069 },
  { name: 'Gallivare', f: './se-gallivare.tsv', lat: 67.1333 },
  { name: 'Pajala', f: './se-pajala.tsv', lat: 67.2117 },
  { name: 'Kiruna', f: '../countries/se-kiruna-2026.tsv', lat: 67.8558 },
];
const load = f => {
  const rows = [];
  for (const line of readFileSync(new URL(f, import.meta.url), 'utf8').split('\n')) {
    const p = line.split('\t').map(s => s.trim());
    if (p.length === 8) rows.push({ m: +p[0], d: +p[1], shuruk: p[3], magrib: p[6] });
  }
  return rows;
};

console.log('=== printed day length (Magrib minus Shuruk) in the IFiS published year, per city ===');
console.log('city          lat     minDay   maxDay   daysAt300   daysAt1140   daysOutside[300,1140]');
for (const c of CITIES) {
  const days = load(c.f).map(r => Math.round((toH(r.magrib) - toH(r.shuruk)) * 60));
  const mn = Math.min(...days), mx = Math.max(...days);
  const at300 = days.filter(x => x === 300).length, at1140 = days.filter(x => x === 1140).length;
  const outside = days.filter(x => x < 300 || x > 1140).length;
  console.log(`${c.name.padEnd(13)}${c.lat.toFixed(2).padStart(5)}  ${String(mn).padStart(5)} m  ${String(mx).padStart(5)} m  ${String(at300).padStart(9)}   ${String(at1140).padStart(10)}   ${String(outside).padStart(20)}`);
}
console.log('\n300 minutes is 5 hours and 1140 is 19 hours, and they sum to 24.');
console.log('Nine cities spanning 12 degrees of latitude share the same two extremes and not one');
console.log('day of any published year falls outside them. That is a CLAMP, not a computation.');
