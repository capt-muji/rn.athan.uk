'use strict';
// "Queensway Tunnel" survived a filter that excludes is_tunnel. Either the tag is absent
// on that feature, or my filter reads it wrongly. A filter that silently fails to exclude
// is worse than no filter, because it is trusted.

const https = require('https');
const zlib = require('zlib');
const { HEADER_BYTES, parseHeader, deserializeDir, zxyToTileId, findEntry, lonLatToTile } = require('./pmtiles.js');
const { decodeTile, tagsOf } = require('./mvt.js');

const URL = 'https://build.protomaps.com/20260929.pmtiles';

function range(start, len) {
  return new Promise((res, rej) => {
    https
      .get(URL, { headers: { Range: `bytes=${start}-${start + len - 1}` } }, (r) => {
        const c = [];
        r.on('data', (d) => c.push(d));
        r.on('end', () => res(Buffer.concat(c)));
      })
      .on('error', rej);
  });
}

(async () => {
  const header = parseHeader(await range(0, HEADER_BYTES));
  const root = deserializeDir(zlib.gunzipSync(await range(header.rootOffset, header.rootLength)));
  const { x, y } = lonLatToTile(52.4796, -1.9026, 15);
  const tid = zxyToTileId(15, x, y);
  let e = findEntry(root, tid);
  while (e && e.runLength === 0) {
    const leaf = deserializeDir(zlib.gunzipSync(await range(header.leafOffset + e.offset, e.length)));
    e = findEntry(leaf, tid);
  }
  const mvt = zlib.gunzipSync(await range(header.tileDataOffset + e.offset, e.length));
  const layers = decodeTile(new Uint8Array(mvt.buffer, mvt.byteOffset, mvt.byteLength));
  const roads = layers.roads;
  console.log('Every feature whose name contains "Queensway", with ALL its tags:\n');
  const shapes = new Map();
  for (const f of roads.features) {
    const t = tagsOf(roads, f);
    if (!t.name || !String(t.name).includes('Queensway')) continue;
    const key = JSON.stringify(t);
    shapes.set(key, (shapes.get(key) || 0) + 1);
  }
  for (const [k, n] of shapes) console.log(`  x${n}  ${k}`);

  console.log('\nvalue TYPES of is_tunnel / is_bridge across the whole layer:');
  const types = new Map();
  for (const f of roads.features) {
    const t = tagsOf(roads, f);
    for (const key of ['is_tunnel', 'is_bridge']) {
      if (!(key in t)) continue;
      const label = `${key} = ${JSON.stringify(t[key])} (${typeof t[key]})`;
      types.set(label, (types.get(label) || 0) + 1);
    }
  }
  for (const [k, n] of types) console.log(`  x${String(n).padStart(4)}  ${k}`);

  console.log('\nnamed features containing Tunnel/tunnel anywhere, and whether is_tunnel is set:');
  for (const f of roads.features) {
    const t = tagsOf(roads, f);
    if (!t.name || !/tunnel/i.test(String(t.name))) continue;
    console.log(`  ${String(t.name).padEnd(32)} kind=${t.kind}/${t.kind_detail} is_tunnel=${JSON.stringify(t.is_tunnel)}`);
  }
})();
