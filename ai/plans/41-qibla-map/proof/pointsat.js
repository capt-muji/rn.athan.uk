'use strict';
// THE AMBIGUITY FIX.
//
// "Stand along Whitehall then turn 53 left" is 180-degree ambiguous: a street is a LINE
// with two directions, and the user has no way to know which way to face along it without
// the very compass this feature exists to avoid.
//
// The unambiguous form names what the qibla POINTS AT: "the qibla points toward Trafalgar
// Square". No sensor, no facing choice, nothing to get backwards. This probe measures
// whether such a target exists near an arbitrary point in an arbitrary city, and what it is.

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
    return { lat: r2d * Math.atan(Math.sinh(k)), lon };
  };
}

const metresPerDegree = (lat) => ({
  lat: 111132.92 - 559.82 * Math.cos(2 * lat * d2r),
  lon: 111412.84 * Math.cos(lat * d2r),
});

const PLACES = [
  { name: 'London', z: 15, x: 16372, y: 10896 },
  { name: 'Jakarta', z: 15, x: 26109, y: 16950 },
  { name: 'Makkah', z: 15, x: 20009, y: 14386 },
  { name: 'NewYork', z: 15, x: 9647, y: 12320 },
];

for (const place of PLACES) {
  const path = `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/q41/${place.name}.mvt`;
  if (!fs.existsSync(path)) continue;
  const buf = fs.readFileSync(path);
  const layers = decodeTile(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
  const extent = (layers.roads || layers.pois).extent;
  const proj = makeProjector(place.z, place.x, place.y, extent);
  const here = proj(extent / 2, extent / 2);
  const qibla = greatCircleBearing(here, KAABA);
  const mpd = metresPerDegree(here.lat);

  console.log(`\n=== ${place.name} === qibla ${qibla.toFixed(1)} deg`);

  // Candidate targets: anything NAMED with a point-ish geometry, from places and pois.
  const targets = [];
  for (const layerName of ['places', 'pois', 'landuse', 'water']) {
    const layer = layers[layerName];
    if (!layer) continue;
    for (const f of layer.features) {
      const t = tagsOf(layer, f);
      if (!t.name) continue;
      for (const part of f.parts) {
        // centroid of the part
        let sx = 0;
        let sy = 0;
        for (const [px, py] of part) {
          sx += px;
          sy += py;
        }
        const c = proj(sx / part.length, sy / part.length);
        const dx = (c.lon - here.lon) * mpd.lon;
        const dy = (c.lat - here.lat) * mpd.lat;
        const dist = Math.hypot(dx, dy);
        if (dist < 25 || dist > 600) continue;
        const brg = norm(Math.atan2(dx, dy) * r2d);
        let off = Math.abs(norm(qibla - brg));
        if (off > 180) off = 360 - off;
        targets.push({ name: t.name, kind: t.kind, layer: layerName, dist, brg, off });
        break;
      }
    }
  }
  targets.sort((a, b) => a.off - b.off);
  const seen = new Set();
  let shown = 0;
  console.log('  targets ALONG the qibla ray (what the qibla points AT):');
  for (const t of targets) {
    if (seen.has(t.name)) continue;
    seen.add(t.name);
    if (t.off > 25) break;
    console.log(
      `    ${t.off.toFixed(0).padStart(2)} deg off   ${t.dist.toFixed(0).padStart(3)}m  ${t.layer.padEnd(8)} ${String(t.kind).padEnd(18)} ${t.name}`
    );
    if (++shown === 5) break;
  }
  if (!shown) console.log('    NONE within 25 degrees');
}
