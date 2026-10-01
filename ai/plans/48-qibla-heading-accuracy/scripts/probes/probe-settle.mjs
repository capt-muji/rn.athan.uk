/**
 * Does a circular-spread settling gate separate a converged heading from a wandering one?
 *
 * The owner's symptom is run-to-run inconsistency: same spot, same orientation, 5 to 30 degrees different
 * each time he reopens the app. The hypothesis under test is that the FIRST readings after the watch arms
 * are the bad ones, and that a gate measuring the SPREAD of the last N readings can refuse to draw until
 * the stream has converged. This script measures whether such a gate is discriminating, on synthetic
 * streams whose truth is known.
 */

const DEGREES = Math.PI / 180;

/** Circular mean of headings in degrees, because 359 and 1 average to 0 rather than 180 */
const circularMean = (values) => {
  let x = 0;
  let y = 0;
  for (const v of values) {
    x += Math.cos(v * DEGREES);
    y += Math.sin(v * DEGREES);
  }
  return (Math.atan2(y / values.length, x / values.length) / DEGREES + 360) % 360;
};

/**
 * Circular spread: the resultant length R of the unit vectors, turned into an equivalent angular spread
 * in degrees. R = 1 means every reading identical, R near 0 means readings scattered round the circle.
 */
const circularSpread = (values) => {
  let x = 0;
  let y = 0;
  for (const v of values) {
    x += Math.cos(v * DEGREES);
    y += Math.sin(v * DEGREES);
  }
  const r = Math.hypot(x / values.length, y / values.length);
  // Standard circular standard deviation, in degrees
  return Math.sqrt(-2 * Math.log(Math.max(r, 1e-12))) / DEGREES;
};

const shortestDelta = (a, b) => {
  const raw = (a - b) % 360;
  if (raw > 180) return raw - 360;
  if (raw <= -180) return raw + 360;
  return raw;
};

let seed = 12345;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

/**
 * A stream shaped like a real fused compass arming from cold: it starts at an offset that decays as the
 * fusion converges, with jitter throughout. `startOffset` is the cold error, `tau` how many samples it
 * takes to decay, `jitter` the steady-state noise.
 */
const stream = (truth, startOffset, tau, jitter, count) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    const converging = startOffset * Math.exp(-i / tau);
    out.push((truth + converging + gauss() * jitter + 360) % 360);
  }
  return out;
};

const WINDOW = 8;

/** Walks a stream and reports the first index at which the trailing window's spread falls under the gate */
const firstSettled = (readings, gateDegrees) => {
  for (let i = WINDOW - 1; i < readings.length; i++) {
    const window = readings.slice(i - WINDOW + 1, i + 1);
    if (circularSpread(window) <= gateDegrees) return i;
  }
  return -1;
};

const TRUTH = 118.99;
const SAMPLES = 400;

const scenarios = [
  { name: 'converges fast, low jitter (good phone, clean field)', offset: 30, tau: 6, jitter: 1.0 },
  { name: 'converges slowly, low jitter (cold fusion)', offset: 30, tau: 40, jitter: 1.0 },
  { name: 'converges fast, high jitter (indoors, steel)', offset: 30, tau: 6, jitter: 8.0 },
  { name: 'NEVER converges: stable 25deg hard-iron bias', offset: 25, tau: 1e9, jitter: 1.0 },
  { name: 'NEVER converges: wanders, no bias', offset: 0, tau: 1e9, jitter: 14.0 },
  { name: 'already settled on arrival', offset: 0, tau: 1, jitter: 1.0 },
];

const GATES = [2, 3, 5, 8];

console.log('# Does a spread gate separate converged from wandering?\n');
console.log(`Window ${WINDOW} readings. Truth ${TRUTH}. ${SAMPLES} samples per stream, 60 runs per cell.\n`);

for (const gate of GATES) {
  console.log(`\n## Gate: trailing circular spread <= ${gate} degrees\n`);
  console.log('| Scenario | settled at | error WHEN settled | error of FIRST reading | error of raw mean |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const s of scenarios) {
    let settledAt = 0;
    let errAtSettle = 0;
    let errFirst = 0;
    let errMean = 0;
    let neverSettled = 0;
    const RUNS = 60;
    for (let run = 0; run < RUNS; run++) {
      const readings = stream(TRUTH, s.offset, s.tau, s.jitter, SAMPLES);
      const idx = firstSettled(readings, gate);
      errFirst += Math.abs(shortestDelta(readings[0], TRUTH));
      errMean += Math.abs(shortestDelta(circularMean(readings), TRUTH));
      if (idx < 0) {
        neverSettled++;
        continue;
      }
      settledAt += idx;
      const window = readings.slice(idx - WINDOW + 1, idx + 1);
      errAtSettle += Math.abs(shortestDelta(circularMean(window), TRUTH));
    }
    const drew = RUNS - neverSettled;
    const settleCell = drew === 0 ? 'NEVER' : `sample ${(settledAt / drew).toFixed(1)}`;
    const errCell = drew === 0 ? 'refused to draw' : `${(errAtSettle / drew).toFixed(2)}`;
    console.log(
      `| ${s.name} | ${settleCell}${neverSettled && drew ? ` (${neverSettled}/${RUNS} never)` : ''} | ${errCell} | ${(errFirst / RUNS).toFixed(2)} | ${(errMean / RUNS).toFixed(2)} |`
    );
  }
}
