'use strict';
// THE LOAD-BEARING TEST for the owner's chosen design.
//
// The map rung's real product is a SENTENCE: "the qibla is 53 degrees left of Whitehall".
// The previous session proved that sentence for ONE point in London. The owner has now
// ruled out bundling London and wants this to work anywhere, so the question is whether
// a named, usable street exists near an arbitrary point in an arbitrary city.
//
// Measures, per place: how many named roads within the 122 m design radius, how long the
// nearest ones are, and what the resulting sentence would read.

const fs = require('fs');
const { decodeTile, tagsOf } = require('./mvt.js');

const d2r = Math.PI / 180;
const r2d = 180 / Math.PI;
const norm = (a) => ((a % 360) + 360) % 360;
const KAABA = { lat: 21.4225241, lon: 39.8261818 };

function greatCircleBearing(a, b) {
  const p1 = a.lat * d2r;
  const p2 = b.lat * d2r;
  const dl = (b.lon - a.lon) * d2r;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return norm(Math.atan2(y, x) * r2d);
}

function makeProjector(z, X, Y, extent) {
  const n = 2 ** z;
  return (px, py) => {
    const lon = ((X + px / extent) / n) * 360 - 180;
    const k = Math.PI * (1 - (2 * (Y + py / extent)) / n);
    const lat = r2d * Math.atan(Math.sinh(k));
    return { lat, lon };
  };
}

// metres per degree at a latitude, good enough for distances under a kilometre
function metresPerDegree(lat) {
  return { lat: 111132.92 - 559.82 * Math.cos(2 * lat * d2r), lon: 111412.84 * Math.cos(lat * d2r) };
}

const PLACES = [
  { name: 'London', lat: 51.5074, lon: -0.1278, z: 15, x: 16372, y: 10896 },
  { name: 'Jakarta', lat: -6.2088, lon: 106.8456, z: 15, x: 26109, y: 16950 },
  { name: 'Makkah', lat: 21.4225, lon: 39.8262, z: 15, x: 20009, y: 14386 },
  { name: 'NewYork', lat: 40.7128, lon: -74.006, z: 15, x: 9647, y: 12320 },
];

const RADIUS_M = 122; // the design's measured feature cap

for (const place of PLACES) {
  const path = `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/q41/${place.name}.mvt`;
  if (!fs.existsSync(path)) continue;
  const buf = fs.readFileSync(path);
  const layers = decodeTile(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
  const roads = layers.roads;
  if (!roads) {
    console.log(`${place.name}: NO ROADS LAYER`);
    continue;
  }
  const proj = makeProjector(place.z, place.x, place.y, roads.extent);
  // the user stands at the tile centre for this probe
  const here = proj(roads.extent / 2, roads.extent / 2);
  const qibla = greatCircleBearing(here, KAABA);
  const mpd = metresPerDegree(here.lat);

  const candidates = [];
  for (const f of roads.features) {
    const t = tagsOf(roads, f);
    if (!t.name) continue;
    for (const part of f.parts) {
      if (part.length < 2) continue;
      // nearest vertex distance to the user, and the bearing of the segment nearest them
      let best = Infinity;
      let bestIdx = 0;
      for (let i = 0; i < part.length; i++) {
        const p = proj(part[i][0], part[i][1]);
        const dx = (p.lon - here.lon) * mpd.lon;
        const dy = (p.lat - here.lat) * mpd.lat;
        const d = Math.hypot(dx, dy);
        if (d < best) {
          best = d;
          bestIdx = i;
        }
      }
      if (best > RADIUS_M) continue;
      const a = proj(part[0][0], part[0][1]);
      const b = proj(part[part.length - 1][0], part[part.length - 1][1]);
      const ax = (b.lon - a.lon) * mpd.lon;
      const ay = (b.lat - a.lat) * mpd.lat;
      const lengthM = Math.hypot(ax, ay);
      if (lengthM < 20) continue;
      const brg = norm(Math.atan2(ax, ay) * r2d);
      // straightness: chord over path length. 1.0 is dead straight.
      let pathLen = 0;
      for (let i = 1; i < part.length; i++) {
        const p0 = proj(part[i - 1][0], part[i - 1][1]);
        const p1 = proj(part[i][0], part[i][1]);
        pathLen += Math.hypot((p1.lon - p0.lon) * mpd.lon, (p1.lat - p0.lat) * mpd.lat);
      }
      const straight = pathLen > 0 ? lengthM / pathLen : 0;
      candidates.push({ name: t.name, kind: t.kind, dist: best, lengthM, brg, straight, bestIdx });
    }
  }

  candidates.sort((p, q) => p.dist - q.dist);
  const seen = new Set();
  const unique = [];
  for (const c of candidates) {
    if (seen.has(c.name)) continue;
    seen.add(c.name);
    unique.push(c);
  }

  console.log(`\n=== ${place.name} === qibla ${qibla.toFixed(1)} deg, ${unique.length} named roads within ${RADIUS_M} m`);
  console.log('street                        dist   len  straight  runs at   the sentence');
  for (const c of unique.slice(0, 6)) {
    let d = norm(qibla - c.brg);
    const side = d <= 180 ? 'right' : 'left';
    if (d > 180) d = 360 - d;
    // a street is a line, not an arrow: it runs both ways, so use the acute reading
    let dd = d;
    let ss = side;
    if (dd > 90) {
      dd = 180 - dd;
      ss = side === 'right' ? 'left' : 'right';
    }
    console.log(
      `${c.name.slice(0, 28).padEnd(29)} ${c.dist.toFixed(0).padStart(4)}m ${c.lengthM.toFixed(0).padStart(5)}m  ${c.straight.toFixed(2)}     ${c.brg.toFixed(0).padStart(3)}deg   "${dd.toFixed(0)} deg to the ${ss} of ${c.name}"`
    );
  }
  if (unique.length === 0) console.log('  NOTHING NAMED IN RANGE -> the map rung has no sentence here');
}
