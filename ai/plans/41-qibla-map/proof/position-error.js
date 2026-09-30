'use strict';
// THE FINDING THAT DECIDES THE DESIGN.
//
// Three candidate presentations, and they do NOT degrade the same way under position error:
//
//   A. "The qibla points toward <POI>"  -> bearing to a target at distance d.
//      Error = atan(positionError / d). CATASTROPHIC for near targets.
//   B. "Turn N degrees from <street>"   -> the street's own bearing.
//      A street's direction is INTRINSIC. Position error cannot bend it.
//      It can only make us pick the WRONG street.
//   C. The drawn map                     -> the picture is centred on the wrong spot,
//      so the risk is that the pattern shown is not the pattern the user sees.
//
// This script measures A directly, and measures for B and C how often a given position
// error changes the ANSWER (the chosen street, and whether the local pattern still matches).

const fs = require('fs');
const { decodeTile, tagsOf } = require('./mvt.js');

const d2r = Math.PI / 180;
const r2d = 180 / Math.PI;
const norm = (a) => ((a % 360) + 360) % 360;

console.log('=== A. Pointing at a target: bearing error from position error ===');
console.log('   (error = atan(positionError / targetDistance), in degrees)\n');
const distances = [28, 50, 100, 200, 300, 600, 1000];
const errors = [10, 20, 50, 100];
process.stdout.write('target dist  ');
for (const e of errors) process.stdout.write(`${String(e).padStart(6)}m pos err`);
process.stdout.write('\n');
for (const d of distances) {
  process.stdout.write(`${String(d).padStart(9)}m  `);
  for (const e of errors) {
    const deg = Math.atan(e / d) * r2d;
    const flag = deg > 5 ? '!' : ' ';
    process.stdout.write(`${deg.toFixed(1).padStart(12)}${flag}`);
  }
  process.stdout.write('\n');
}
console.log('\n   ! marks an error above 5 degrees, the sun rung\'s whole budget.');
console.log('   The CoCo Fresh Tea target measured at 28 m is unusable: a 20 m fix makes it 36 degrees wrong.');

// ---------------------------------------------------------------------------
console.log('\n\n=== B. Choosing a street: does position error change WHICH street wins? ===\n');

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
const VISIBLE_KINDS = new Set(['highway', 'major_road', 'minor_road', 'other']);
const EXCLUDED_DETAIL = new Set(['sidewalk', 'crossing', 'steps', 'corridor', 'service']);

function streetsNear(layers, z, X, Y, here) {
  const roads = layers.roads;
  const proj = makeProjector(z, X, Y, roads.extent);
  const mpd = metresPerDegree(here.lat);
  const out = [];
  for (const f of roads.features) {
    const t = tagsOf(roads, f);
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
      const straightness = pathLen > 0 ? chord / pathLen : 0;
      if (straightness < 0.95) continue;
      out.push({ name: t.name, nearest, chord, straightness, bearing: norm(Math.atan2(ax, ay) * r2d) });
    }
  }
  return out;
}
const score = (s) => (1 / (1 + s.nearest / 30)) * 2 + Math.min(s.chord, 400) / 400 + s.straightness;

const PLACES = [
  { name: 'London', z: 15, x: 16372, y: 10896 },
  { name: 'Jakarta', z: 15, x: 26109, y: 16950 },
  { name: 'Makkah', z: 15, x: 20009, y: 14386 },
  { name: 'NewYork', z: 15, x: 9647, y: 12320 },
];

const SAMPLES = 200;
for (const place of PLACES) {
  const p = `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/q41/${place.name}.mvt`;
  if (!fs.existsSync(p)) continue;
  const buf = fs.readFileSync(p);
  const layers = decodeTile(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
  const proj = makeProjector(place.z, place.x, place.y, layers.roads.extent);
  const here = proj(layers.roads.extent / 2, layers.roads.extent / 2);
  const mpd = metresPerDegree(here.lat);
  const truth = streetsNear(layers, place.z, place.x, place.y, here).sort((a, b) => score(b) - score(a))[0];
  if (!truth) continue;

  process.stdout.write(`${place.name.padEnd(9)} truth = ${truth.name.slice(0, 22).padEnd(23)}`);
  for (const errM of [10, 20, 50, 100]) {
    let sameName = 0;
    let bearingErrSum = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const ang = Math.random() * 2 * Math.PI;
      const r = errM * Math.sqrt(Math.random());
      const shifted = { lat: here.lat + (r * Math.cos(ang)) / mpd.lat, lon: here.lon + (r * Math.sin(ang)) / mpd.lon };
      const best = streetsNear(layers, place.z, place.x, place.y, shifted).sort((a, b) => score(b) - score(a))[0];
      if (!best) continue;
      if (best.name === truth.name) sameName++;
      let d = Math.abs(norm(best.bearing - truth.bearing));
      if (d > 180) d = 360 - d;
      if (d > 90) d = 180 - d;
      bearingErrSum += d;
    }
    process.stdout.write(`  ${String(errM).padStart(3)}m:${String(Math.round((sameName / SAMPLES) * 100)).padStart(4)}% same, ${(bearingErrSum / SAMPLES).toFixed(1).padStart(4)}deg`);
  }
  process.stdout.write('\n');
}
console.log('\n   "same" = the same street is chosen. "deg" = mean bearing error of whatever street won,');
console.log('   which is what actually reaches the user. A different PARALLEL street costs 0 degrees.');
