/**
 * The drift gate cannot see a STABLE bias, because a stable bias is quiet and still, which is what
 * "settled" means. A second, INDEPENDENT quantity is needed, and the candidate is physics: a hard-iron
 * offset is a vector ADDED to the earth's field, so it changes the field's MAGNITUDE and its DIP angle,
 * both of which are known for the user's latitude.
 *
 * This measures how much heading error the check can actually catch, which is the number that decides
 * whether it is worth building.
 */

const DEGREES = Math.PI / 180;

/**
 * London: 49.0 uT total intensity, 66.5 degrees dip, from the World Magnetic Model via NOAA's calculator.
 * The exact values are a function of place and date; what matters here is the SHAPE of the result.
 */
const FIELD = { magnitudeUT: 49.0, dipDegrees: 66.5 };

/** The earth's field in a level device frame, with the phone flat and pointing at `headingDeg` */
const earthField = (headingDeg) => {
  const dip = FIELD.dipDegrees * DEGREES;
  const horizontal = FIELD.magnitudeUT * Math.cos(dip);
  const vertical = FIELD.magnitudeUT * Math.sin(dip);
  // The phone flat, screen up: +y points where the top of the phone points
  const bearing = headingDeg * DEGREES;
  return {
    x: horizontal * -Math.sin(bearing),
    y: horizontal * Math.cos(bearing),
    z: -vertical,
  };
};

const magnitude = (v) => Math.hypot(v.x, v.y, v.z);

/** Dip is the angle between the field and the horizontal plane, which with the phone flat is the z axis */
const dipOf = (v) => Math.asin(Math.max(-1, Math.min(1, -v.z / magnitude(v)))) / DEGREES;

/** The heading a flat phone computes from a (possibly corrupted) field vector */
const headingFrom = (v) => (Math.atan2(-v.x, v.y) / DEGREES + 360) % 360;

const shortestDelta = (a, b) => {
  const raw = (a - b) % 360;
  if (raw > 180) return raw - 360;
  if (raw <= -180) return raw + 360;
  return raw;
};

const TRUTH = 118.99;

console.log('# Can a field-magnitude and dip check catch a hard-iron offset?\n');
console.log(`London field: ${FIELD.magnitudeUT} uT, dip ${FIELD.dipDegrees} degrees.\n`);
console.log('A hard-iron offset is a fixed vector added in the DEVICE frame. Swept over direction and size:\n');

console.log('| offset (uT) | worst heading error | magnitude seen | dip seen | caught by mag>10%? | caught by dip>5deg? | caught by EITHER? |');
console.log('| --- | --- | --- | --- | --- | --- | --- |');

for (const size of [2, 5, 10, 15, 20, 30]) {
  let worstErr = 0;
  let worstMag = 0;
  let worstDip = 0;
  let caughtMag = 0;
  let caughtDip = 0;
  let caughtEither = 0;
  let total = 0;
  let worstUncaught = 0;

  // Sweep the offset's direction over the whole sphere, and the phone's own heading over the circle
  for (let az = 0; az < 360; az += 15) {
    for (let el = -75; el <= 75; el += 15) {
      const ox = size * Math.cos(el * DEGREES) * Math.cos(az * DEGREES);
      const oy = size * Math.cos(el * DEGREES) * Math.sin(az * DEGREES);
      const oz = size * Math.sin(el * DEGREES);
      for (let heading = 0; heading < 360; heading += 15) {
        const clean = earthField(heading);
        const dirty = { x: clean.x + ox, y: clean.y + oy, z: clean.z + oz };
        const err = Math.abs(shortestDelta(headingFrom(dirty), headingFrom(clean)));
        const mag = magnitude(dirty);
        const dip = dipOf(dirty);
        const magOff = Math.abs(mag - FIELD.magnitudeUT) / FIELD.magnitudeUT;
        const dipOff = Math.abs(dip - FIELD.dipDegrees);
        const byMag = magOff > 0.1;
        const byDip = dipOff > 5;

        total++;
        if (byMag) caughtMag++;
        if (byDip) caughtDip++;
        if (byMag || byDip) caughtEither++;
        else worstUncaught = Math.max(worstUncaught, err);

        if (err > worstErr) {
          worstErr = err;
          worstMag = mag;
          worstDip = dip;
        }
      }
    }
  }
  console.log(
    `| ${size} | ${worstErr.toFixed(1)} | ${worstMag.toFixed(1)} | ${worstDip.toFixed(1)} | ${((caughtMag / total) * 100).toFixed(0)}% | ${((caughtDip / total) * 100).toFixed(0)}% | ${((caughtEither / total) * 100).toFixed(0)}% |`
  );
}

console.log('\n\n## The number that decides it: what survives the check\n');
console.log('| offset (uT) | worst heading error the check does NOT catch |');
console.log('| --- | --- |');
for (const size of [2, 5, 10, 15, 20, 30]) {
  let worstUncaught = 0;
  for (let az = 0; az < 360; az += 5) {
    for (let el = -80; el <= 80; el += 5) {
      const ox = size * Math.cos(el * DEGREES) * Math.cos(az * DEGREES);
      const oy = size * Math.cos(el * DEGREES) * Math.sin(az * DEGREES);
      const oz = size * Math.sin(el * DEGREES);
      for (let heading = 0; heading < 360; heading += 5) {
        const clean = earthField(heading);
        const dirty = { x: clean.x + ox, y: clean.y + oy, z: clean.z + oz };
        const mag = magnitude(dirty);
        const dip = dipOf(dirty);
        if (Math.abs(mag - FIELD.magnitudeUT) / FIELD.magnitudeUT > 0.1) continue;
        if (Math.abs(dip - FIELD.dipDegrees) > 5) continue;
        worstUncaught = Math.max(worstUncaught, Math.abs(shortestDelta(headingFrom(dirty), headingFrom(clean))));
      }
    }
  }
  console.log(`| ${size} | ${worstUncaught.toFixed(1)} |`);
}
