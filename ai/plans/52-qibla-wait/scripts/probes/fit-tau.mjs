/**
 * Fits the fusion's convergence time constant from a captured heading stream.
 *
 * The absolute heading is deliberately discarded: a tethered phone sits inside the field of the thing
 * tethering it (session 49's rule), and a constant magnetic bias drops out of a rate. Only the DECAY is read,
 * which is what decides whether MEASURED.md section 6's time floor is needed.
 *
 * Usage: node ai/plans/52-qibla-wait/scripts/fit-tau.mjs <logcat file>
 */

import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('Usage: node fit-tau.mjs <logcat file>');
  process.exit(1);
}

const DEGREES = Math.PI / 180;
const lines = readFileSync(path, 'utf8').split('\n');

/** Any decimal in the line is a candidate heading; the last one wins, which is where loggers put the value */
const samples = [];
for (const line of lines) {
  const time = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
  const numbers = line.match(/-?\d+\.\d+/g);
  if (!time || !numbers) continue;
  const atMs =
    Number(time[1]) * 3600000 + Number(time[2]) * 60000 + Number(time[3]) * 1000 + Number(time[4]);
  samples.push({ atMs, degrees: Number(numbers[numbers.length - 1]) });
}

console.log(`SAMPLES: ${samples.length}`);
if (samples.length < 20) {
  console.log('TAU_MS: UNMEASURED');
  console.log('Too few samples to fit a decay. See PLAN.md section 7 item 3.');
  process.exit(0);
}

const t0 = samples[0].atMs;
const headingDelta = (to, from) => {
  const raw = (to - from) % 360;
  if (raw > 180) return raw - 360;
  if (raw <= -180) return raw + 360;
  return raw;
};

/** The converged value is where the stream ends, so error is each sample's distance from the final mean */
const tail = samples.slice(-Math.max(5, Math.floor(samples.length / 5)));
let x = 0;
let y = 0;
for (const s of tail) {
  x += Math.cos(s.degrees * DEGREES);
  y += Math.sin(s.degrees * DEGREES);
}
const converged = (Math.atan2(y / tail.length, x / tail.length) / DEGREES + 360) % 360;

/** log|error| against time is linear with slope -1/tau for an exponential decay */
const points = samples
  .map((s) => ({ t: s.atMs - t0, error: Math.abs(headingDelta(s.degrees, converged)) }))
  .filter((p) => p.error > 0.2);

if (points.length < 10) {
  console.log('TAU_MS: UNMEASURED');
  console.log(`The stream never moved more than 0.2 degrees from ${converged.toFixed(2)}: already converged.`);
  process.exit(0);
}

let sumT = 0;
let sumL = 0;
let sumTT = 0;
let sumTL = 0;
for (const p of points) {
  const l = Math.log(p.error);
  sumT += p.t;
  sumL += l;
  sumTT += p.t * p.t;
  sumTL += p.t * l;
}
const n = points.length;
const slope = (n * sumTL - sumT * sumL) / (n * sumTT - sumT * sumT);

console.log(`CONVERGED_DEGREES: ${converged.toFixed(2)}`);
console.log(`FIRST_ERROR_DEGREES: ${points[0].error.toFixed(2)}`);
console.log(`TAU_MS: ${slope < 0 ? Math.round(-1 / slope) : 'UNMEASURED'}`);
if (slope >= 0) console.log('The error grew rather than decayed: the phone moved during capture. Re-capture still.');
