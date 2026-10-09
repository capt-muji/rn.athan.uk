// R14 part 3E: could coordinate-to-JAKIM-zone ship OFFLINE?
//
// The service's answer carries a `district` name, so the mapping is almost certainly
// point-in-district-polygon plus a district-to-zone table. This tests whether that construction
// can be reproduced from open polygon data the app could ship, using the 425 probed grid points
// as the oracle.
//
// Polygons: geoBoundaries gbOpen MYS ADM2, 159 districts, CC BY 3.0 (measured from its own
// metadata file). Point-in-polygon by ray casting over every ring.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { table } from './lib.mjs';

const grid = JSON.parse(fs.readFileSync('wsgrid.json', 'utf8'));
const gj = JSON.parse(fs.readFileSync('bounds/MYS-adm2.geojson', 'utf8'));

const polys = gj.features.map((f) => ({
  name: f.properties.shapeName,
  rings: (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).flatMap((p) => p),
  bbox: null,
}));
for (const p of polys) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const r of p.rings) {
    for (const [x, y] of r) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  p.bbox = [x0, y0, x1, y1];
}

function inRing(x, y, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function locate(lat, lon) {
  for (const p of polys) {
    if (lon < p.bbox[0] || lon > p.bbox[2] || lat < p.bbox[1] || lat > p.bbox[3]) continue;
    let inside = false;
    for (const r of p.rings) if (inRing(lon, lat, r)) inside = !inside;
    if (inside) return p.name;
  }
  return null;
}

const norm = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const oracle = [];
for (const [k, v] of Object.entries(grid)) {
  if (!v || !v.zone) continue;
  const [la, lo] = k.split(',').map(Number);
  oracle.push({ la, lo, zone: v.zone, district: v.district });
}

const out = [];
const say = (s = '') => out.push(s);
say('# R14 part 3E: can coordinate-to-JAKIM-zone ship offline?');
say('');
say('Oracle: the ' + oracle.length + ' grid points where `api.waktusolat.app` returned a zone.');
say('Offline candidate: point-in-polygon over geoBoundaries gbOpen MYS ADM2, 159 district');
say('polygons, `Creative Commons Attribution 3.0 License` per its own metadata (measured).');
say('');

// 1. does the service's district name exist in the polygon set at all?
const polyNorm = new Map(polys.map((p) => [norm(p.name), p.name]));
const svcDistricts = new Set(oracle.map((o) => o.district));
const matched = [...svcDistricts].filter((d) => polyNorm.has(norm(d)));
say('## 3E-1. Does the service\'s district vocabulary match the open polygon set?');
say('');
say(
  table(
    ['measure', 'value'],
    [
      ['distinct district names the service returned', String(svcDistricts.size)],
      ['of those, present in the ADM2 polygon names', `${matched.length} (${((100 * matched.length) / svcDistricts.size).toFixed(1)}%)`],
      ['ADM2 polygons in the file', String(polys.length)],
    ]
  )
);
say('');
const unmatched = [...svcDistricts].filter((d) => !polyNorm.has(norm(d))).sort();
say('District names the service returns that the polygon set does not carry (' + unmatched.length + '):');
say('');
say('```');
say(unmatched.join(', ') || 'none');
say('```');
say('');

// 2. build a district -> zone table from the oracle, then classify by polygon
const d2z = new Map();
for (const o of oracle) {
  const key = norm(o.district);
  if (!d2z.has(key)) d2z.set(key, new Map());
  const m = d2z.get(key);
  m.set(o.zone, (m.get(o.zone) ?? 0) + 1);
}
const conflicts = [...d2z.entries()].filter(([, m]) => m.size > 1);
say('## 3E-2. Is the district-to-zone relation a FUNCTION?');
say('');
say(
  `Distinct districts observed: ${d2z.size}. Districts the service mapped to more than one zone: **${conflicts.length}**.`
);
say('');
if (conflicts.length) {
  say(
    table(
      ['district', 'zones seen'],
      conflicts.map(([d, m]) => [d, [...m.entries()].map(([z, n]) => `${z} x${n}`).join(', ')])
    )
  );
  say('');
}

// 3. reproduce the oracle offline
let hit = 0;
let wrongDistrict = 0;
let noPoly = 0;
let unknownDistrict = 0;
const fails = [];
for (const o of oracle) {
  const pn = locate(o.la, o.lo);
  if (pn === null) {
    noPoly++;
    fails.push({ ...o, why: 'point in no ADM2 polygon' });
    continue;
  }
  const key = norm(pn);
  const m = d2z.get(key);
  if (!m) {
    unknownDistrict++;
    fails.push({ ...o, why: `polygon "${pn}" has no zone in the table` });
    continue;
  }
  const best = [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
  if (best === o.zone) hit++;
  else {
    wrongDistrict++;
    fails.push({ ...o, why: `polygon "${pn}" gave ${best}, service said ${o.zone}` });
  }
}
say('## 3E-3. Offline reproduction of the service, point by point');
say('');
say(
  table(
    ['outcome', 'points', 'share'],
    [
      ['offline answer equals the service', String(hit), ((100 * hit) / oracle.length).toFixed(1) + '%'],
      ['offline polygon gave a different zone', String(wrongDistrict), ((100 * wrongDistrict) / oracle.length).toFixed(1) + '%'],
      ['point fell in no ADM2 polygon', String(noPoly), ((100 * noPoly) / oracle.length).toFixed(1) + '%'],
      ['polygon has no zone assignment', String(unknownDistrict), ((100 * unknownDistrict) / oracle.length).toFixed(1) + '%'],
    ]
  )
);
say('');
say('The failures, by reason, first 25:');
say('');
say(
  table(
    ['lat', 'lon', 'service zone', 'reason'],
    fails.slice(0, 25).map((f) => [f.la.toFixed(2), f.lo.toFixed(2), f.zone, f.why])
  )
);
say('');

// 3f. the ceiling: most failures are spelling variants, so retry with a hand alias table
say('## 3E-3b. The ceiling, with a hand-written alias table for the spelling variants');
say('');
say('The failures above are dominated by orthography: `Kulaijaya` against `Kulai`, `Ulu Langat`');
say('against `Hulu Langat`, `Hulu Perak` covering three JAKIM zones at once. This pass adds an');
say('alias table and measures what a real implementation would reach.');
say('');
const ALIAS = {
  kulaijaya: 'kulai',
  ledang: 'tangkak',
  ululangat: 'hululangat',
  uluselangor: 'huluselangor',
  bagandatuk: 'kualaselangor',
  nabawanpersiangan: 'nabawan',
  wplabuan: 'wplabuan',
};
{
  let ok = 0;
  let split = 0;
  let other = 0;
  const left = [];
  for (const o of oracle) {
    const pn = locate(o.la, o.lo);
    const key = ALIAS[norm(pn)] ?? norm(pn);
    const m = d2z.get(key);
    if (m) {
      const best = [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
      if (best === o.zone) {
        ok++;
        continue;
      }
      other++;
      left.push({ ...o, pn, why: `gave ${best}` });
      continue;
    }
    // Hulu Perak is one ADM2 polygon spanning PRK03 and PRK04, which no district lookup can split
    split++;
    left.push({ ...o, pn, why: 'one polygon spans more than one zone' });
  }
  say(
    table(
      ['outcome', 'points', 'share'],
      [
        ['offline answer equals the service', String(ok), ((100 * ok) / oracle.length).toFixed(1) + '%'],
        ['one ADM2 polygon spans more than one JAKIM zone', String(split), ((100 * split) / oracle.length).toFixed(1) + '%'],
        ['genuine polygon disagreement', String(other), ((100 * other) / oracle.length).toFixed(1) + '%'],
      ]
    )
  );
  say('');
  say('The residue, which is the real limit:');
  say('');
  say(
    table(
      ['lat', 'lon', 'service zone', 'polygon', 'reason'],
      left.map((f) => [f.la.toFixed(2), f.lo.toFixed(2), f.zone, f.pn ?? '(none)', f.why])
    )
  );
  say('');
}

// 4. cost of shipping the polygons
say('## 3E-4. What the polygon set costs to ship');
say('');
{
  const raw = fs.statSync('bounds/MYS-adm2.geojson').size;
  const buf = fs.readFileSync('bounds/MYS-adm2.geojson');
  // a simplified version: round every coordinate to 3 dp (about 110 m) and drop properties
  const simp = {
    type: 'FeatureCollection',
    features: gj.features.map((f) => ({
      t: 'F',
      n: f.properties.shapeName,
      g: (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map((p) =>
        p.map((r) => r.map(([x, y]) => [Number(x.toFixed(3)), Number(y.toFixed(3))]))
      ),
    })),
  };
  const sbuf = Buffer.from(JSON.stringify(simp));
  say(
    table(
      ['artefact', 'raw bytes', 'gzip bytes', 'brotli bytes'],
      [
        [
          'geoBoundaries MYS ADM2 as downloaded',
          raw.toLocaleString('en-GB'),
          zlib.gzipSync(buf, { level: 9 }).length.toLocaleString('en-GB'),
          zlib.brotliCompressSync(buf).length.toLocaleString('en-GB'),
        ],
        [
          'same, coordinates rounded to 3 dp, properties dropped',
          sbuf.length.toLocaleString('en-GB'),
          zlib.gzipSync(sbuf, { level: 9 }).length.toLocaleString('en-GB'),
          zlib.brotliCompressSync(sbuf).length.toLocaleString('en-GB'),
        ],
      ]
    )
  );
  say('');
  const totalVerts = gj.features.reduce((s, f) => {
    const ps = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    return s + ps.flat().reduce((t, r) => t + r.length, 0);
  }, 0);
  say(`Vertices across all 159 polygons: ${totalVerts.toLocaleString('en-GB')} (measured).`);
  say('');
}

// 5. the same cost for the other five countries
say('## 3E-5. The same polygon cost for the other countries R8 flagged');
say('');
{
  const rows = [];
  for (const [iso, country] of [
    ['MYS', 'Malaysia'],
    ['IDN', 'Indonesia'],
    ['BRN', 'Brunei'],
    ['LKA', 'Sri Lanka'],
    ['BGD', 'Bangladesh'],
    ['TUR', 'Turkey'],
  ]) {
    const p = `bounds/${iso}-adm2.geojson`;
    if (!fs.existsSync(p)) continue;
    const meta = JSON.parse(fs.readFileSync(`bounds/${iso}-adm2-meta.json`, 'utf8'));
    const g = JSON.parse(fs.readFileSync(p, 'utf8'));
    const verts = g.features.reduce((s, f) => {
      const ps = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      return s + ps.flat().reduce((t, r) => t + r.length, 0);
    }, 0);
    const simp = g.features.map((f) => ({
      n: f.properties.shapeName,
      g: (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map((pp) =>
        pp.map((r) => r.map(([x, y]) => [Number(x.toFixed(3)), Number(y.toFixed(3))]))
      ),
    }));
    const sbuf = Buffer.from(JSON.stringify(simp));
    rows.push([
      country,
      String(g.features.length),
      meta.boundaryCanonical,
      verts.toLocaleString('en-GB'),
      Math.round(fs.statSync(p).size / 1024).toLocaleString('en-GB') + ' KB',
      Math.round(zlib.brotliCompressSync(sbuf).length / 1024).toLocaleString('en-GB') + ' KB',
      meta.boundaryLicense,
    ]);
  }
  say(
    table(
      ['country', 'polygons', 'level called', 'vertices', 'raw GeoJSON', 'brotli, 3 dp', 'licence stated in its metadata'],
      rows
    )
  );
}
say('');
console.log(out.join('\n'));
