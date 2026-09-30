'use strict';
// The selection rule for the landmark sentence, built from the tag data rather than guessed.
//
// Requirements the rule must satisfy, each from a measured defect in the first probe:
//   1. NEVER name something the user cannot see: rail/subway ("IRT Lexington Avenue Line"),
//      any is_tunnel, and rail/* generally.
//   2. NEVER name a sidewalk or crossing: it shares the parent road's bearing and confuses.
//   3. Prefer a STRAIGHT street: a bent road has no single direction to read.
//   4. Prefer a LONG street: a 45 m alley is harder to sight along than a 300 m road.
//   5. Prefer a NEAR street: it must be the one in front of them.
//   6. A street is a LINE, not an arrow, so the answer is always the acute angle.

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

// A user standing on a pavement can see these and nothing else in the layer.
const VISIBLE_KINDS = new Set(['highway', 'major_road', 'minor_road', 'other']);
const EXCLUDED_DETAIL = new Set(['sidewalk', 'crossing', 'steps', 'corridor', 'service']);

function usableStreets(layers, z, X, Y, here) {
  const roads = layers.roads;
  if (!roads) return [];
  const proj = makeProjector(z, X, Y, roads.extent);
  const mpd = metresPerDegree(here.lat);
  const out = [];
  for (const f of roads.features) {
    const t = tagsOf(roads, f);
    if (!t.name) continue;
    if (!VISIBLE_KINDS.has(t.kind)) continue;
    if (EXCLUDED_DETAIL.has(t.kind_detail)) continue;
    if (t.is_tunnel) continue;
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
      const straightness = pathLen > 0 ? chord / pathLen : 0;
      if (straightness < 0.95) continue;
      out.push({
        name: t.name,
        kind: `${t.kind}/${t.kind_detail || ''}`,
        nearest,
        chord,
        straightness,
        bearing: norm(Math.atan2(ax, ay) * r2d),
      });
    }
  }
  return out;
}

// Score: near is what matters most, then long, then straight. A street 20 m away
// beats one 100 m away even if shorter, because it is the one they are looking at.
function scoreStreet(s) {
  const nearScore = 1 / (1 + s.nearest / 30);
  const lengthScore = Math.min(s.chord, 400) / 400;
  return nearScore * 2 + lengthScore + s.straightness;
}

function sentence(qibla, street) {
  let delta = norm(qibla - street.bearing);
  let side = delta <= 180 ? 'right' : 'left';
  if (delta > 180) delta = 360 - delta;
  if (delta > 90) {
    delta = 180 - delta;
    side = side === 'right' ? 'left' : 'right';
  }
  if (delta < 5) return `The qibla runs along ${street.name}.`;
  return `Stand along ${street.name}, then turn ${Math.round(delta)} degrees to the ${side}.`;
}

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
  const proj = makeProjector(place.z, place.x, place.y, layers.roads.extent);
  const here = proj(layers.roads.extent / 2, layers.roads.extent / 2);
  const qibla = greatCircleBearing(here, KAABA);
  const streets = usableStreets(layers, place.z, place.x, place.y, here);
  streets.sort((a, b) => scoreStreet(b) - scoreStreet(a));
  const seen = new Set();
  const top = [];
  for (const s of streets) {
    if (seen.has(s.name)) continue;
    seen.add(s.name);
    top.push(s);
    if (top.length === 4) break;
  }
  console.log(`\n=== ${place.name} === qibla ${qibla.toFixed(1)} deg  (${streets.length} usable segments)`);
  for (const s of top) {
    console.log(
      `  ${s.name.slice(0, 26).padEnd(27)} ${s.nearest.toFixed(0).padStart(4)}m ${s.chord.toFixed(0).padStart(5)}m str ${s.straightness.toFixed(2)} ${s.kind.padEnd(22)}`
    );
    console.log(`      -> "${sentence(qibla, s)}"`);
  }
  if (!top.length) console.log('  NO USABLE STREET -> must fall through to another rung');
}
