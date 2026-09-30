// Does the APP's decoder agree with the independently written probe decoder on a REAL tile?
// Two implementations, written separately, fed the same bytes. Disagreement means one is wrong.
//
// The app modules are TypeScript, so strip the types with the repo's own babel and load them.

import { readFileSync } from 'node:fs';
import { transformSync } from '@babel/core';
import { createRequire } from 'node:module';
import Module from 'node:module';

const WT = '/Users/muji/athan-device-sweep/worktrees/plan-41';
const require = createRequire(`${WT}/package.json`);

// Load a .ts file from the worktree by transpiling it and evaluating as CommonJS
function loadTs(relative) {
  const filename = `${WT}/${relative}`;
  const source = readFileSync(filename, 'utf8');
  const { code } = transformSync(source, {
    filename,
    presets: [[require.resolve('@babel/preset-typescript'), {}]],
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
    babelrc: false,
    configFile: false,
  });
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(`${WT}/shared`);
  const patched = code.replace(/require\("@\/shared\/([a-zA-Z]+)"\)/g, (_m, name) => `__load("shared/${name}.ts")`);
  const fn = new Function('module', 'exports', 'require', '__load', patched);
  fn(mod, mod.exports, require, loadTs);
  return mod.exports;
}

const appTile = loadTs('shared/vectorTile.ts');
const appGeom = loadTs('shared/tileGeometry.ts');
const appStreet = loadTs('shared/qiblaStreet.ts');

const probe = require('/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/q41/mvt.js');

const PLACES = [
  ['London', 15, 16372, 10896],
  ['Jakarta', 15, 26109, 16950],
  ['Makkah', 15, 20009, 14386],
  ['NewYork', 15, 9647, 12320],
];

const KAABA = { latitude: 21.4225241, longitude: 39.8261818 };
const d2r = Math.PI / 180;
const norm = (a) => ((a % 360) + 360) % 360;
function qiblaBearing(p) {
  const p1 = p.latitude * d2r;
  const p2 = KAABA.latitude * d2r;
  const dl = (KAABA.longitude - p.longitude) * d2r;
  return norm(
    (Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) *
      180) /
      Math.PI
  );
}

let mismatches = 0;
for (const [name, zoom, x, y] of PLACES) {
  const buf = readFileSync(`/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/q41/${name}.mvt`);
  const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

  const mine = appTile.decodeVectorTile(bytes);
  const theirs = probe.decodeTile(bytes);

  const myLayers = Object.keys(mine).sort().join(',');
  const theirLayers = Object.keys(theirs).sort().join(',');
  const layersMatch = myLayers === theirLayers;

  const myRoads = mine.roads;
  const theirRoads = theirs.roads;
  const countMatch = myRoads.features.length === theirRoads.features.length;

  // compare every road's name and vertex count
  let featureDiffs = 0;
  for (let i = 0; i < myRoads.features.length; i++) {
    const a = myRoads.features[i];
    const b = theirRoads.features[i];
    const an = a.tags.name ?? null;
    const bt = {};
    for (let k = 0; k < b.tags.length; k += 2) bt[theirRoads.keys[b.tags[k]]] = theirRoads.values[b.tags[k + 1]];
    const bn = bt.name ?? null;
    if (an !== bn) featureDiffs++;
    const av = a.parts.reduce((s, p) => s + p.length, 0);
    const bv = b.parts.reduce((s, p) => s + p.length, 0);
    if (av !== bv) featureDiffs++;
  }

  const tile = { zoom, x, y };
  const here = appGeom.positionInTile(tile, { x: myRoads.extent / 2, y: myRoads.extent / 2 }, myRoads.extent);
  const qibla = qiblaBearing(here);
  const streets = appStreet.nearbyStreets(myRoads, tile, here);
  const best = streets[0];
  const answer = best ? appStreet.qiblaFromStreet(qibla, best) : null;

  if (!layersMatch || !countMatch || featureDiffs) mismatches++;
  console.log(
    `${name.padEnd(8)} layers ${layersMatch ? 'OK' : 'DIFF'}  features ${myRoads.features.length}/${theirRoads.features.length} ${countMatch ? 'OK' : 'DIFF'}  per-feature diffs ${featureDiffs}`
  );
  console.log(
    `         qibla ${qibla.toFixed(1)}  -> ${answer ? `"${answer.street.name}", turn ${answer.turn.toFixed(0)} ${answer.side}" (${streets.length} usable)` : 'NO STREET'}`
  );
}
console.log(`\n${mismatches === 0 ? 'THE TWO DECODERS AGREE ON EVERY TILE' : `${mismatches} MISMATCHES`}`);
