/**
 * WHY the physics check cannot bound heading error, and why it is WORSE the further north you go.
 *
 * A compass reads only the HORIZONTAL component of the field. At London's 66.5 degree dip that component
 * is a small fraction of the total, so an offset big enough to swing the heading badly is still small
 * next to the TOTAL magnitude the check measures. This quantifies that, because it is the argument that
 * kills the check rather than any single measurement.
 */

const DEGREES = Math.PI / 180;

/** Total intensity and dip from the World Magnetic Model, via NOAA's online calculator, epoch 2026 */
const PLACES = [
  { name: 'Singapore', latitude: 1.35, totalUT: 41.4, dip: -14.0 },
  { name: 'Makkah', latitude: 21.42, totalUT: 41.6, dip: 35.9 },
  { name: 'Cairo', latitude: 30.04, totalUT: 43.0, dip: 45.0 },
  { name: 'New York', latitude: 40.71, totalUT: 50.6, dip: 64.5 },
  { name: 'London', latitude: 51.51, totalUT: 49.0, dip: 66.5 },
  { name: 'Oslo', latitude: 59.91, totalUT: 50.6, dip: 73.0 },
  { name: 'Tromso', latitude: 69.65, totalUT: 52.0, dip: 78.0 },
];

console.log('# Why the field check cannot bound heading error\n');
console.log('A compass reads the HORIZONTAL field only. The check measures the TOTAL.\n');
console.log('| Place | dip | total (uT) | horizontal (uT) | horizontal share | 5uT sideways costs | and changes total by |');
console.log('| --- | --- | --- | --- | --- | --- | --- |');

for (const p of PLACES) {
  const horizontal = p.totalUT * Math.cos(p.dip * DEGREES);
  // An offset of 5 uT lying in the horizontal plane, perpendicular to the field: the worst case for heading
  const offset = 5;
  const headingError = Math.atan2(offset, horizontal) / DEGREES;
  const newTotal = Math.hypot(p.totalUT, offset);
  const magChange = ((newTotal - p.totalUT) / p.totalUT) * 100;
  console.log(
    `| ${p.name} | ${p.dip.toFixed(1)} | ${p.totalUT.toFixed(1)} | ${horizontal.toFixed(1)} | ${((horizontal / p.totalUT) * 100).toFixed(0)}% | ${headingError.toFixed(1)} deg | ${magChange.toFixed(2)}% |`
  );
}

console.log('\n\n## The same offset, as a function of its size, at London\n');
const london = PLACES.find((p) => p.name === 'London');
const horizontal = london.totalUT * Math.cos(london.dip * DEGREES);
console.log('| sideways offset (uT) | heading error | total magnitude changes by | would a 10% magnitude gate catch it? |');
console.log('| --- | --- | --- | --- |');
for (const offset of [1, 2, 3, 5, 8, 10, 15, 20]) {
  const headingError = Math.atan2(offset, horizontal) / DEGREES;
  const magChange = ((Math.hypot(london.totalUT, offset) - london.totalUT) / london.totalUT) * 100;
  console.log(
    `| ${offset} | ${headingError.toFixed(1)} deg | ${magChange.toFixed(2)}% | ${magChange > 10 ? 'yes' : 'NO'} |`
  );
}

console.log('\n\n## The conclusion, in one line\n');
const offset20 = Math.atan2(20, horizontal) / DEGREES;
const mag20 = ((Math.hypot(london.totalUT, 20) - london.totalUT) / london.totalUT) * 100;
console.log(
  `At London a sideways offset of 20 uT swings the heading ${offset20.toFixed(1)} degrees while moving the total`
);
console.log(
  `magnitude only ${mag20.toFixed(1)}%, because the offset adds in quadrature to the total and linearly to`
);
console.log('the horizontal. A magnitude gate loose enough to admit real phones cannot catch it.');
