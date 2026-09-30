'use strict';
// Re-reading my own measurement, because the naive reading is WRONG.
//
// position-error.js reported "New York 100m: 23% same street, 35.6 deg". Read naively that
// says the feature fails. It does not, and the reason matters more than the number.
//
// The sentence is "stand along <NAME>, then turn N to the <side>", where
//     N = qibla - bearing(NAME)
// Both terms are INTRINSIC:
//   - qibla moves 0.5 deg per 10 km of position error (settled, session 37)
//   - a street's compass bearing is a fact of the ground and does not move at all
//
// So if position error makes us name a DIFFERENT street, we also recompute N for THAT
// street, and the instruction stays geometrically correct. The user is not misled; they
// are pointed at a different, equally valid reference. The only real failure is naming a
// street the user cannot find.
//
// This script tests that claim directly: for every street we might name under position
// error, is the resulting instruction still correct when executed from the TRUE position?

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
  return norm(
    Math.atan2(
      Math.sin(dl) * Math.cos(p2),
      Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)
    ) * r2d
  );
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

console.log('Executing the instruction FROM THE TRUE POSITION, for whatever street the');
console.log('error-shifted fix happened to name. "delivered" is the direction the user');
console.log('actually faces; the error is against the true qibla.\n');
console.log('place      pos err   naming accuracy   mean delivered error   worst   > 5 deg');

const SAMPLES = 300;
for (const place of PLACES) {
  const p = `/private/var/folders/cs/j4wg7fqj1qd_xx4dcnmbb5fm0000gp/T/opencode/q41/${place.name}.mvt`;
  if (!fs.existsSync(p)) continue;
  const buf = fs.readFileSync(p);
  const layers = decodeTile(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
  const proj = makeProjector(place.z, place.x, place.y, layers.roads.extent);
  const here = proj(layers.roads.extent / 2, layers.roads.extent / 2);
  const mpd = metresPerDegree(here.lat);
  const trueQibla = greatCircleBearing(here, KAABA);
  const truthName = streetsNear(layers, place.z, place.x, place.y, here).sort((a, b) => score(b) - score(a))[0]?.name;

  for (const errM of [20, 50, 100]) {
    let same = 0;
    let sum = 0;
    let worst = 0;
    let over5 = 0;
    let n = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const ang = Math.random() * 2 * Math.PI;
      const r = errM * Math.sqrt(Math.random());
      const believed = {
        lat: here.lat + (r * Math.cos(ang)) / mpd.lat,
        lon: here.lon + (r * Math.sin(ang)) / mpd.lon,
      };
      const chosen = streetsNear(layers, place.z, place.x, place.y, believed).sort((a, b) => score(b) - score(a))[0];
      if (!chosen) continue;
      n++;
      if (chosen.name === truthName) same++;
      // The app computes the turn from the BELIEVED position's qibla and the street bearing.
      const believedQibla = greatCircleBearing(believed, KAABA);
      const turn = norm(believedQibla - chosen.bearing);
      // The user executes it against the street they can SEE, whose bearing is the true one.
      const delivered = norm(chosen.bearing + turn);
      let err = Math.abs(norm(delivered - trueQibla));
      if (err > 180) err = 360 - err;
      sum += err;
      if (err > worst) worst = err;
      if (err > 5) over5++;
    }
    console.log(
      `${place.name.padEnd(9)} ${String(errM).padStart(4)}m   ${String(Math.round((same / n) * 100)).padStart(3)}% same street   ${(sum / n).toFixed(3).padStart(10)} deg   ${worst.toFixed(2).padStart(5)}   ${String(over5).padStart(3)}/${n}`
    );
  }
}
console.log('\nIf the delivered error stays near zero while the naming accuracy collapses,');
console.log('the sentence is SELF-CORRECTING and position accuracy is a findability');
console.log('problem, not an accuracy problem. That inverts how the previous table reads.');
