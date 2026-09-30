'use strict';
// The fixture-blind-spot rule, applied deliberately.
//
// STREET-SENTENCE.md rests on four tiles and three are dense downtowns. That is exactly
// the sample shape that made "the sun points at the qibla" look correct in London and
// Cairo while having ZERO usable days in New York.
//
// So: fetch a deliberately hostile spread and measure how often a usable street exists.
// Suburbs, villages, deserts, and the global south. Everything read live from the archive.

const https = require('https');
const zlib = require('zlib');
const { HEADER_BYTES, parseHeader, deserializeDir, zxyToTileId, findEntry, lonLatToTile } = require('./pmtiles.js');
const { decodeTile, tagsOf } = require('./mvt.js');

const URL = 'https://build.protomaps.com/20260929.pmtiles';
const d2r = Math.PI / 180;
const r2d = 180 / Math.PI;
const norm = (a) => ((a % 360) + 360) % 360;

function range(start, len) {
  return new Promise((res, rej) => {
    const req = https.get(URL, { headers: { Range: `bytes=${start}-${start + len - 1}` } }, (r) => {
      if (r.statusCode !== 206) {
        rej(new Error(`status ${r.statusCode}`));
        return;
      }
      const c = [];
      r.on('data', (d) => c.push(d));
      r.on('end', () => res(Buffer.concat(c)));
    });
    req.on('error', rej);
    req.setTimeout(30000, () => req.destroy(new Error('timeout')));
  });
}

const metresPerDegree = (lat) => ({
  lat: 111132.92 - 559.82 * Math.cos(2 * lat * d2r),
  lon: 111412.84 * Math.cos(lat * d2r),
});
const VISIBLE_KINDS = new Set(['highway', 'major_road', 'minor_road', 'other']);
const EXCLUDED_DETAIL = new Set(['sidewalk', 'crossing', 'steps', 'corridor', 'service']);

function analyse(layers, z, X, Y) {
  const roads = layers.roads;
  if (!roads) return { usable: 0, named: 0, total: 0, best: null };
  const extent = roads.extent;
  const n = 2 ** z;
  const proj = (px, py) => {
    const lon = ((X + px / extent) / n) * 360 - 180;
    const k = Math.PI * (1 - (2 * (Y + py / extent)) / n);
    return { lat: r2d * Math.atan(Math.sinh(k)), lon };
  };
  const here = proj(extent / 2, extent / 2);
  const mpd = metresPerDegree(here.lat);
  let named = 0;
  const usable = [];
  for (const f of roads.features) {
    const t = tagsOf(roads, f);
    if (t.name) named++;
    if (!t.name || !VISIBLE_KINDS.has(t.kind) || EXCLUDED_DETAIL.has(t.kind_detail) || t.is_tunnel) continue;
    for (const part of f.parts) {
      if (part.length < 2) continue;
      let nearest = Infinity;
      for (const [px, py] of part) {
        const p = proj(px, py);
        const d = Math.hypot((p.lon - here.lon) * mpd.lon, (p.lat - here.lat) * mpd.lat);
        if (d < nearest) nearest = d;
      }
      const a = proj(part[0][0], part[0][1]);
      const b = proj(part[part.length - 1][0], part[part.length - 1][1]);
      const ax = (b.lon - a.lon) * mpd.lon;
      const ay = (b.lat - a.lat) * mpd.lat;
      const chord = Math.hypot(ax, ay);
      if (chord < 40) continue;
      let pathLen = 0;
      for (let i = 1; i < part.length; i++) {
        const p0 = proj(part[i - 1][0], part[i - 1][1]);
        const p1 = proj(part[i][0], part[i][1]);
        pathLen += Math.hypot((p1.lon - p0.lon) * mpd.lon, (p1.lat - p0.lat) * mpd.lat);
      }
      if (pathLen <= 0 || chord / pathLen < 0.95) continue;
      usable.push({ name: t.name, nearest, chord, bearing: norm(Math.atan2(ax, ay) * r2d) });
    }
  }
  const within = usable.filter((s) => s.nearest <= 122);
  const score = (s) => (1 / (1 + s.nearest / 30)) * 2 + Math.min(s.chord, 400) / 400;
  within.sort((a, b) => score(b) - score(a));
  return { usable: within.length, named, total: roads.features.length, best: within[0] || null, anyUsable: usable.length };
}

const PLACES = [
  ['Tokyo Shinjuku', 35.6896, 139.7006],
  ['Lagos Ikeja', 6.6018, 3.3515],
  ['Dhaka Gulshan', 23.7925, 90.4078],
  ['Karachi Saddar', 24.86, 67.0099],
  ['Istanbul Fatih', 41.0186, 28.9647],
  ['Cairo Downtown', 30.0444, 31.2357],
  ['Kuala Lumpur', 3.1478, 101.6953],
  ['Dubai Deira', 25.2697, 55.3094],
  ['Birmingham UK', 52.4796, -1.9026],
  ['Bradford UK', 53.7938, -1.7524],
  ['Leicester UK', 52.6369, -1.1398],
  ['US suburb TX', 32.9483, -96.7299],
  ['US suburb AZ', 33.3062, -111.8413],
  ['Village Norfolk', 52.6503, 1.0669],
  ['Village Wales', 52.4153, -3.9276],
  ['Rural Punjab', 30.9, 75.85],
  ['Rural Java', -7.2575, 112.7521],
  ['Rural Kenya', -0.0917, 34.768],
  ['Sahara Algeria', 27.8743, -0.2891],
  ['Outback AU', -23.698, 133.8807],
  ['Siberia Yakutsk', 62.0355, 129.6755],
  ['Reykjavik', 64.1466, -21.9426],
  ['Sao Paulo', -23.5505, -46.6333],
  ['Mexico City', 19.4326, -99.1332],
];

(async () => {
  const header = parseHeader(await range(0, HEADER_BYTES));
  const root = deserializeDir(zlib.gunzipSync(await range(header.rootOffset, header.rootLength)));
  const z = 15;
  console.log('place               named  usable  nearest    the street it would name');
  let haveStreet = 0;
  for (const [name, lat, lon] of PLACES) {
    const { x, y } = lonLatToTile(lat, lon, z);
    const tid = zxyToTileId(z, x, y);
    let e = findEntry(root, tid);
    try {
      while (e && e.runLength === 0) {
        const leaf = deserializeDir(zlib.gunzipSync(await range(header.leafOffset + e.offset, e.length)));
        e = findEntry(leaf, tid);
      }
      if (!e) {
        console.log(`${name.padEnd(18)}    -       -        -    NO TILE AT ALL`);
        continue;
      }
      const mvt = zlib.gunzipSync(await range(header.tileDataOffset + e.offset, e.length));
      const layers = decodeTile(new Uint8Array(mvt.buffer, mvt.byteOffset, mvt.byteLength));
      const r = analyse(layers, z, x, y);
      if (r.best) haveStreet++;
      console.log(
        `${name.padEnd(18)} ${String(r.named).padStart(4)} ${String(r.usable).padStart(7)} ${(r.best ? `${r.best.nearest.toFixed(0)}m` : '  -').padStart(8)}    ${r.best ? r.best.name.slice(0, 34) : '*** NOTHING USABLE ***'}`
      );
    } catch (err) {
      console.log(`${name.padEnd(18)} ERROR ${err.message}`);
    }
  }
  console.log(`\n${haveStreet} of ${PLACES.length} places have a usable named street within 122 m.`);
})().catch((e) => {
  console.error('FAILED', e);
  process.exit(1);
});
