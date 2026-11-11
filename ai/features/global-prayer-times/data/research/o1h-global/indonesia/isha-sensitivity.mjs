// What a 1 degree move in the isha reference costs, measured at each city.
// Kemenag publishes isha 19 for six Papuan highland regencies; everywhere else is 18.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const results = JSON.parse(readFileSync(join(HERE, 'results.json'), 'utf8'));

const pick = ['mabims', 'singapore', 'fazilet-a', 'egyptian', 'moonsighting', 'dubai'];
const perCity = results.table[0].perCity.map((c, i) => ({
  city: c.city,
  costMinutes: results.table.map((t) => ({
    id: t.id,
    at18: t.perCity[i].vsParam.isha.mean,
    at19: t.perCity[i].vsParam.isha19.mean,
    cost: +(t.perCity[i].vsParam.isha19.mean - t.perCity[i].vsParam.isha.mean).toFixed(2),
  })).filter((x) => pick.includes(x.id)),
}));

const costs = perCity.flatMap((c) => c.costMinutes.map((x) => x.cost));
const payload = {
  schema: 'o1h-indonesia-isha-sensitivity/1',
  note: 'Each cell is the same method scored against an isha reference of 18 degrees and of 19 degrees. The cost column is the penalty a method pays when the reference moves one degree away from the pair it was built on.',
  meanCostMinutes: +(costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(2),
  minCost: +Math.min(...costs).toFixed(2),
  maxCost: +Math.max(...costs).toFixed(2),
  perCity,
};
writeFileSync(join(HERE, 'isha-sensitivity.json'), JSON.stringify(payload, null, 1));
console.log('mean cost of a 1 degree isha move', payload.meanCostMinutes, 'range', payload.minCost, payload.maxCost);
