// R14 part 2: what does a worldwide city list cost, and how many cities are actually needed?
//
// Part 1 answers "a prayer time needs position accuracy of about R km". So a city list is a
// COVERING of the inhabited world by discs of radius R. This measures:
//   1. The raw byte cost of cities15000 trimmed to name, cc, lat, lon.
//   2. A greedy maximal-coverage subset: how many cities are needed so every one of the
//      34,152 places is within R km of a listed city, for several R.
//   3. Population coverage of a small curated list.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { table } from './lib.mjs';

const cities = [];
for (const line of fs.readFileSync('cities15000.txt', 'utf8').split('\n')) {
  if (!line) continue;
  const f = line.split('\t');
  const lat = Number(f[4]);
  const lon = Number(f[5]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  cities.push({ name: f[1], cc: f[8], lat, lon, pop: Number(f[14]) || 0, tz: f[17], admin1: f[10] });
}

const out = [];
const say = (s = '') => out.push(s);
say('# R14 part 2: the cost of a worldwide city list');
say('');
say(`GeoNames \`cities15000\`, downloaded 2026-09-30: ${cities.length} places over 15,000 population, CC BY 4.0.`);
say('');

// ------------------------------------------------- byte cost of the trimmed list
function encode(list, style) {
  if (style === 'json') {
    return Buffer.from(JSON.stringify(list.map((c) => [c.name, c.cc, +c.lat.toFixed(3), +c.lon.toFixed(3)])));
  }
  if (style === 'tsv3') {
    return Buffer.from(list.map((c) => `${c.name}\t${c.cc}\t${c.lat.toFixed(3)}\t${c.lon.toFixed(3)}`).join('\n'));
  }
  if (style === 'tsv2') {
    return Buffer.from(list.map((c) => `${c.name}\t${c.cc}\t${c.lat.toFixed(2)}\t${c.lon.toFixed(2)}`).join('\n'));
  }
  if (style === 'bin') {
    // name as UTF-8 with a 1-byte length, cc as 2 bytes, lat/lon as int16 at 0.01 deg
    const parts = [];
    for (const c of list) {
      const nb = Buffer.from(c.name, 'utf8').subarray(0, 255);
      const b = Buffer.alloc(1 + nb.length + 2 + 4);
      b.writeUInt8(nb.length, 0);
      nb.copy(b, 1);
      b.write(c.cc.padEnd(2).slice(0, 2), 1 + nb.length, 'latin1');
      b.writeInt16LE(Math.round(c.lat * 100), 3 + nb.length);
      b.writeInt16LE(Math.round(c.lon * 100), 5 + nb.length);
      parts.push(b);
    }
    return Buffer.concat(parts);
  }
  throw new Error(style);
}

{
  const rows = [];
  for (const style of ['json', 'tsv3', 'tsv2', 'bin']) {
    const buf = encode(cities, style);
    rows.push([
      style,
      buf.length.toLocaleString('en-GB'),
      zlib.gzipSync(buf, { level: 9 }).length.toLocaleString('en-GB'),
      zlib.brotliCompressSync(buf).length.toLocaleString('en-GB'),
      (zlib.brotliCompressSync(buf).length / cities.length).toFixed(1),
    ]);
  }
  say('## 2K. Byte cost of the full 34,152-city list, four encodings');
  say('');
  say(table(['encoding', 'raw bytes', 'gzip bytes', 'brotli bytes', 'brotli B per city'], rows));
  say('');
  say('`bin` stores latitude and longitude as int16 at 0.01 degree, which is 1.1 km of latitude');
  say('resolution, well inside the tolerance part 1 establishes.');
  say('');
}

// ----------------------------------------- greedy covering at several radii
function hav(a, b) {
  const R = 6371.0088;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const l1 = (a.lat * Math.PI) / 180;
  const l2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(l1) * Math.cos(l2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Grid index for speed.
function buildGrid(list, cell) {
  const g = new Map();
  for (let i = 0; i < list.length; i++) {
    const kx = Math.floor(list[i].lon / cell);
    const ky = Math.floor(list[i].lat / cell);
    const k = kx + ',' + ky;
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(i);
  }
  return g;
}

function neighbours(g, list, i, cell, span) {
  const kx = Math.floor(list[i].lon / cell);
  const ky = Math.floor(list[i].lat / cell);
  const res = [];
  for (let dx = -span; dx <= span; dx++) {
    for (let dy = -span; dy <= span; dy++) {
      const a = g.get(kx + dx + ',' + (ky + dy));
      if (a) res.push(...a);
    }
  }
  return res;
}

say('## 2L. How many cities are needed to cover every one of the 34,152 places within R km');
say('');
say('Greedy set cover: repeatedly take the city whose R-km disc contains the most uncovered');
say('population, until every place is covered. This is the honest answer to "how many cities');
say('does the picker actually need".');
say('');
{
  const rows = [];
  for (const R of [10, 25, 50, 100, 200]) {
    const cell = Math.max(0.5, R / 111 + 0.01);
    const span = Math.ceil(R / (111 * cell)) + 1;
    const grid = buildGrid(cities, cell);
    // precompute the disc of each city
    const disc = new Array(cities.length);
    for (let i = 0; i < cities.length; i++) {
      const cand = neighbours(grid, cities, i, cell, span);
      const d = [];
      for (const j of cand) if (hav(cities[i], cities[j]) <= R) d.push(j);
      disc[i] = d;
    }
    const covered = new Uint8Array(cities.length);
    const gain = new Float64Array(cities.length);
    for (let i = 0; i < cities.length; i++) {
      let s = 0;
      for (const j of disc[i]) s += Math.max(cities[j].pop, 1);
      gain[i] = s;
    }
    let nCovered = 0;
    let picked = 0;
    let coveredPop = 0;
    const totPop = cities.reduce((s, c) => s + Math.max(c.pop, 1), 0);
    const milestones = {};
    while (nCovered < cities.length) {
      let best = -1;
      let bg = -1;
      for (let i = 0; i < cities.length; i++) {
        if (gain[i] > bg) {
          bg = gain[i];
          best = i;
        }
      }
      if (best < 0 || bg <= 0) break;
      for (const j of disc[best]) {
        if (!covered[j]) {
          covered[j] = 1;
          nCovered++;
          coveredPop += Math.max(cities[j].pop, 1);
        }
      }
      picked++;
      // recompute gains only for cities whose disc intersects the newly covered set
      const touched = new Set();
      for (const j of disc[best]) for (const k of disc[j]) touched.add(k);
      for (const i of touched) {
        let s = 0;
        for (const j of disc[i]) if (!covered[j]) s += Math.max(cities[j].pop, 1);
        gain[i] = s;
      }
      gain[best] = 0;
      const pct = (100 * coveredPop) / totPop;
      for (const m of [50, 80, 90, 95, 99]) {
        if (!milestones[m] && pct >= m) milestones[m] = picked;
      }
    }
    const binBytes = zlib.brotliCompressSync(encode(cities.slice(0, picked), 'bin')).length;
    rows.push([
      String(R),
      picked.toLocaleString('en-GB'),
      String(milestones[50] ?? '-'),
      String(milestones[80] ?? '-'),
      String(milestones[90] ?? '-'),
      String(milestones[95] ?? '-'),
      String(milestones[99] ?? '-'),
      Math.round(binBytes / 1024) + ' KB',
    ]);
  }
  say(
    table(
      ['R km', 'cities for 100% coverage', 'for 50% pop', 'for 80%', 'for 90%', 'for 95%', 'for 99%', 'brotli bin cost of full cover'],
      rows
    )
  );
  say('');
}

// ------------------------------------------ top-N population coverage
say('## 2M. Population coverage of just the N most populous cities in `cities15000`');
say('');
{
  const sorted = [...cities].sort((a, b) => b.pop - a.pop);
  const tot = cities.reduce((s, c) => s + c.pop, 0);
  const rows = [];
  for (const n of [50, 100, 250, 500, 1000, 2500, 5000, 10000]) {
    const sub = sorted.slice(0, n);
    const buf = encode(sub, 'bin');
    rows.push([
      String(n),
      ((100 * sub.reduce((s, c) => s + c.pop, 0)) / tot).toFixed(1) + '%',
      buf.length.toLocaleString('en-GB'),
      zlib.brotliCompressSync(buf).length.toLocaleString('en-GB'),
    ]);
  }
  say(table(['N cities', 'share of cities15000 population', 'bin raw bytes', 'bin brotli bytes'], rows));
  say('');
  say('This is population coverage, not coverage of where people are. Section 2L is the honest one.');
  say('');
}

console.log(out.join('\n'));
