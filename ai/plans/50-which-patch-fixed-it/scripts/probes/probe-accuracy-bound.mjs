/**
 * The question the row exists to answer: which change explains "sometimes 20 degrees off, sometimes 30"?
 *
 * The row's own hypothesis is that removing the 2-degree emission gate is the hero for ACCURACY. That is
 * testable without a phone, because a quantiser's error is BOUNDED by its step size. If the bound is a
 * degree or two, the 2-degree gate cannot be the hero whatever the device says, and the plan must name a
 * different candidate.
 *
 * Each row below is the mean and worst ABSOLUTE error of the heading the dial draws, against the phone's
 * real heading, with the fusion already converged so only the change under test varies.
 */

const DEGREES = Math.PI / 180;
const headingDelta = (to, from) => {
  const raw = (to - from) % 360;
  if (raw > 180) return raw - 360;
  if (raw <= -180) return raw + 360;
  return raw;
};

let seed = 55512345;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

const TIME_DELTA_MS = 50;
const DEGREE_DELTA = 2;

/**
 * Error the user suffers from the EMISSION GATE alone: the dial holds the last emitted value, so while
 * the user creeps onto the line the drawn heading lags the real one by up to the gate's step.
 */
const gateError = ({ sensorHz, degreeGate, turnRateDegPerSec, durationMs = 20000 }) => {
  const JITTER = 0.5;
  const stepMs = 1000 / sensorHz;
  let lastEmitAt = -Infinity;
  let lastAzimuth = Infinity;
  let drawn = null;
  const errors = [];

  for (let t = 0; t <= durationMs; t += stepMs) {
    const trueHeading = 118.99 + (turnRateDegPerSec * t) / 1000;
    const reading = trueHeading + gauss() * JITTER;
    const timeOk = t - lastEmitAt > TIME_DELTA_MS;
    const degreeOk = !degreeGate || Math.abs(reading - lastAzimuth) > DEGREE_DELTA;
    if (timeOk && degreeOk) {
      lastEmitAt = t;
      lastAzimuth = reading;
      drawn = reading;
    }
    // Sampled every sensor step, which is what the user's eye integrates
    if (drawn !== null) errors.push(Math.abs(headingDelta(drawn, trueHeading)));
  }

  const mean = errors.reduce((a, b) => a + b, 0) / errors.length;
  return { mean, worst: Math.max(...errors) };
};

const pad = (s, n) => String(s).padEnd(n);

console.log('1. THE EMISSION GATE AND THE SENSOR RATE: how wrong can they make the DRAWN heading?\n');
console.log(pad('configuration', 34), pad('still', 22), pad('creeping 2 deg/s', 22), 'turning 10 deg/s');
for (const config of [
  { label: 'SHIPPED  50Hz | no degree gate', sensorHz: 50, degreeGate: false },
  { label: 'A        5Hz  | no degree gate', sensorHz: 5, degreeGate: false },
  { label: 'B        50Hz | 2-degree gate', sensorHz: 50, degreeGate: true },
  { label: 'REJECTED 5Hz  | 2-degree gate', sensorHz: 5, degreeGate: true },
]) {
  const cells = [0, 2, 10].map((rate) => {
    const r = gateError({ ...config, turnRateDegPerSec: rate });
    return pad(`${r.mean.toFixed(2)} mean, ${r.worst.toFixed(2)} worst`, 22);
  });
  console.log(pad(config.label, 34), cells.join(''));
}

console.log('\n   The 2-degree gate is a QUANTISER, so its error is bounded by its own step. It cannot');
console.log('   produce the 20 to 30 degrees the owner reported, at any sensor rate.\n');

console.log('2. THE COLD FUSION, which the settling gate exists to exclude.\n');
const COLD_OFFSET = 30;
const TAU_MS = 4000;
for (const t of [0, 500, 1000, 2000, 3000, 4000, 6000, 9700]) {
  const err = COLD_OFFSET * Math.exp(-t / TAU_MS);
  console.log(`   drawn at ${pad(`${(t / 1000).toFixed(1)}s`, 7)} error ${err.toFixed(1)} degrees`);
}
console.log('\n   An UNLATCHED gate re-closes the moment the user turns, so the dial keeps whatever value it');
console.log('   last drew. Drawn early and then frozen is exactly a 20-to-30-degree error that persists.\n');

console.log('3. HARD IRON, the half session 48 measured as invisible to every gate.\n');
console.log('   A hard-iron offset adds to the HORIZONTAL field, which at London is about 40% of the total.');
const H_LONDON = 19.4; // uT, horizontal component at London
for (const offset of [2, 5, 10, 20]) {
  // Worst case: offset perpendicular to the horizontal field
  const err = (Math.atan2(offset, H_LONDON) / DEGREES).toFixed(1);
  console.log(`   ${pad(`${offset} uT offset`, 14)} up to ${err} degrees of heading error`);
}
console.log('\n   This is the ONLY mechanism on this page that reaches 20 to 30 degrees. A figure-eight wave is');
console.log('   the standard way to re-estimate it, and the calibration hint shipped in 1.29.205 itself.');
