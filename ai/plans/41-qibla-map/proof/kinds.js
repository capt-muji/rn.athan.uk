'use strict';
// What is actually IN the roads layer? The street-sentence probe surfaced
// "IRT Lexington Avenue Line", a subway, which no user can see from the pavement.
// Enumerate every kind and every tag key so the filter is built from the data.

const fs = require('fs');
const { decodeTile, tagsOf } = require('./mvt.js');

const PLACES = ['London', 'Jakarta', 'Makkah', 'NewYork'];

const kindCounts = {};
const keySet = new Set();
const kindNamedExamples = {};

for (const name of PLACES) {
  const path = `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/q41/${name}.mvt`;
  if (!fs.existsSync(path)) continue;
  const buf = fs.readFileSync(path);
  const layers = decodeTile(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
  console.log(`\n${name}: layers = ${Object.keys(layers).join(', ')}`);
  const roads = layers.roads;
  if (!roads) continue;
  for (const f of roads.features) {
    const t = tagsOf(roads, f);
    for (const k of Object.keys(t)) keySet.add(k);
    const kind = `${t.kind}${t.kind_detail ? `/${t.kind_detail}` : ''}`;
    kindCounts[kind] = (kindCounts[kind] || 0) + 1;
    if (t.name && !kindNamedExamples[kind]) kindNamedExamples[kind] = `${t.name} (${name})`;
  }
}

console.log('\n=== every tag key on a road feature ===');
console.log([...keySet].sort().join(', '));

console.log('\n=== every kind, across four cities ===');
const rows = Object.entries(kindCounts).sort((a, b) => b[1] - a[1]);
for (const [kind, n] of rows) {
  console.log(`${String(n).padStart(5)}  ${kind.padEnd(28)} ${kindNamedExamples[kind] || ''}`);
}
