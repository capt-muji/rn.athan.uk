'use strict';
// Does the fetch-on-demand route the owner chose actually work today, end to end,
// with every offset read from the header rather than hardcoded?

const https = require('https');
const zlib = require('zlib');
const { HEADER_BYTES, parseHeader, deserializeDir, zxyToTileId, findEntry, lonLatToTile } = require('./pmtiles.js');

const BUILD = process.argv[2];
const URL = `https://build.protomaps.com/${BUILD}.pmtiles`;

let requestCount = 0;
let bytesFetched = 0;

function range(start, len) {
  requestCount++;
  return new Promise((res, rej) => {
    https
      .get(URL, { headers: { Range: `bytes=${start}-${start + len - 1}` } }, (r) => {
        if (r.statusCode !== 206) {
          rej(new Error(`expected 206, got ${r.statusCode}`));
          return;
        }
        const c = [];
        r.on('data', (d) => c.push(d));
        r.on('end', () => {
          const b = Buffer.concat(c);
          bytesFetched += b.length;
          res(b);
        });
      })
      .on('error', rej);
  });
}

const PLACES = [
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
  { name: 'Makkah', lat: 21.4225, lon: 39.8262 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
];

(async () => {
  const t0 = Date.now();
  const header = parseHeader(await range(0, HEADER_BYTES));
  console.log('HEADER (read from bytes 0-126, nothing hardcoded)');
  console.log(
    `  version ${header.version}  tileType ${header.tileType}  zoom ${header.minZoom}-${header.maxZoom}  clustered ${header.clustered}`
  );
  console.log(
    `  bounds ${header.minLon},${header.minLat} .. ${header.maxLon},${header.maxLat}  addressedTiles ${header.addressedTiles}`
  );
  console.log(
    `  root @${header.rootOffset} len ${header.rootLength}  leaf @${header.leafOffset}  tiles @${header.tileDataOffset}`
  );
  console.log(`  internalCompression ${header.internalCompression}  tileCompression ${header.tileCompression}`);

  const sane =
    header.tileType === 1 &&
    header.maxZoom === 15 &&
    Math.abs(header.minLon + 180) < 1 &&
    Math.abs(header.maxLat - 85.0511) < 0.01;
  console.log(`  SANE: ${sane}`);

  const rootRaw = await range(header.rootOffset, header.rootLength);
  const root = deserializeDir(zlib.gunzipSync(rootRaw));
  console.log(`\nroot directory: ${root.length} entries\n`);

  for (const place of PLACES) {
    const z = 15;
    const { x, y } = lonLatToTile(place.lat, place.lon, z);
    const tid = zxyToTileId(z, x, y);
    let e = findEntry(root, tid);
    let hops = 1;
    while (e && e.runLength === 0) {
      const leafRaw = await range(header.leafOffset + e.offset, e.length);
      const leaf = deserializeDir(zlib.gunzipSync(leafRaw));
      e = findEntry(leaf, tid);
      hops++;
    }
    if (!e) {
      console.log(`${place.name}: NO TILE at z${z} (${x},${y})`);
      continue;
    }
    const raw = await range(header.tileDataOffset + e.offset, e.length);
    const mvt = zlib.gunzipSync(raw);
    console.log(
      `${place.name.padEnd(9)} z${z} (${x},${y}) tileId ${String(tid).padEnd(11)} ${hops} dir hops  ${String(raw.length).padStart(7)} B gz -> ${String(mvt.length).padStart(7)} B mvt`
    );
    require('fs').writeFileSync(`/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/q41/${place.name.replace(/ /g, '')}.mvt`, mvt);
  }

  console.log(`\nTOTAL: ${requestCount} range requests, ${(bytesFetched / 1024).toFixed(1)} KB, ${Date.now() - t0} ms`);
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
