/**
 * What actually sets the settling gate's wait: the sample RATE, or the window LENGTH?
 *
 * Replays this repository's own hasSettled against a cold-fusion convergence, sweeping the sensor rate and
 * the window independently, and reports both halves of what the owner cares about: when the animation goes
 * away, and how wrong the compass is at that instant.
 */

const DEGREES = Math.PI / 180;

const circularMean = (degrees) => {
  let x = 0;
  let y = 0;
  for (const value of degrees) {
    x += Math.cos(value * DEGREES);
    y += Math.sin(value * DEGREES);
  }
  return (Math.atan2(y / degrees.length, x / degrees.length) / DEGREES + 360) % 360;
};

const headingDelta = (to, from) => {
  const raw = (to - from) % 360;
  if (raw > 180) return raw - 360;
  if (raw <= -180) return raw + 360;
  return raw;
};

const makeGate = ({ windowMs, minReadings, driftDegrees }) => {
  const trailingWindow = (samples, nowMs) => samples.filter((s) => nowMs - s.atMs <= windowMs);
  const hasSettled = (win, nowMs) => {
    if (win.length < minReadings) return false;
    if (nowMs - win[0].atMs < windowMs * 0.9) return false;
    const half = Math.floor(win.length / 2);
    const older = circularMean(win.slice(0, half).map((s) => s.degrees));
    const newer = circularMean(win.slice(half).map((s) => s.degrees));
    return Math.abs(headingDelta(newer, older)) <= driftDegrees;
  };
  return { trailingWindow, hasSettled };
};

let seed = 20261002;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

const TRUTH = 118.99;
const TIME_DELTA_MS = 50; // expo-location's own rate limit, unchanged by the patch

const open = ({ sensorHz, windowMs, minReadings, driftDegrees, coldOffset, tauMs, jitter, durationMs = 60000 }) => {
  const { trailingWindow, hasSettled } = makeGate({ windowMs, minReadings, driftDegrees });
  const stepMs = 1000 / sensorHz;
  let samples = [];
  let lastEmit = -Infinity;

  for (let t = 0; t <= durationMs; t += stepMs) {
    const reading = TRUTH + coldOffset * Math.exp(-t / tauMs) + gauss() * jitter;
    if (t - lastEmit <= TIME_DELTA_MS) continue;
    lastEmit = t;
    samples = trailingWindow([...samples, { degrees: reading, atMs: t }], t);
    if (hasSettled(samples, t)) {
      return { openedAtMs: t, errorDegrees: Math.abs(coldOffset * Math.exp(-t / tauMs)) };
    }
  }
  return null;
};

const RUNS = 300;
const summarise = (cfg) => {
  const times = [];
  const errors = [];
  let never = 0;
  for (let i = 0; i < RUNS; i += 1) {
    const r = open(cfg);
    if (!r) {
      never += 1;
      continue;
    }
    times.push(r.openedAtMs);
    errors.push(r.errorDegrees);
  }
  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
  const p95 = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.95)] : NaN);
  return { openMs: mean(times), openP95: p95(times), errorMean: mean(errors), errorP95: p95(errors), never };
};

const BASE = { coldOffset: 30, tauMs: 4000, jitter: 0.5, minReadings: 8, driftDegrees: 1.5 };

console.log('A. SENSOR RATE at the shipped 3000ms window (does 50Hz set the wait?)');
console.log('  Hz  | emitted Hz | opens at | err at open | p95 err');
for (const sensorHz of [50, 25, 10, 5, 2]) {
  const emitted = Math.min(sensorHz, 1000 / (TIME_DELTA_MS + 1000 / sensorHz));
  const s = summarise({ ...BASE, sensorHz, windowMs: 3000 });
  console.log(
    `  ${String(sensorHz).padStart(2)}  |   ${emitted.toFixed(1).padStart(5)}    | ${s.openMs.toFixed(0).padStart(6)}ms | ${s.errorMean.toFixed(2).padStart(6)}deg  | ${s.errorP95.toFixed(2)}deg${s.never ? `  NEVER:${s.never}` : ''}`
  );
}

console.log('\nB. WINDOW LENGTH at the shipped 50Hz (the real knob)');
console.log('  window | opens at | p95 open | err at open | p95 err');
for (const windowMs of [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000]) {
  const s = summarise({ ...BASE, sensorHz: 50, windowMs });
  console.log(
    `  ${String(windowMs).padStart(5)}  | ${s.openMs.toFixed(0).padStart(6)}ms | ${s.openP95.toFixed(0).padStart(6)}ms | ${s.errorMean.toFixed(2).padStart(6)}deg  | ${s.errorP95.toFixed(2)}deg${s.never ? `  NEVER:${s.never}` : ''}`
  );
}

console.log('\nC. DRIFT THRESHOLD at 50Hz, 3000ms (the other knob)');
console.log('  drift | opens at | err at open');
for (const driftDegrees of [0.5, 1.0, 1.5, 2.0, 3.0, 5.0]) {
  const s = summarise({ ...BASE, sensorHz: 50, windowMs: 3000, driftDegrees });
  console.log(
    `  ${driftDegrees.toFixed(1).padStart(4)}  | ${s.openMs.toFixed(0).padStart(6)}ms | ${s.errorMean.toFixed(2).padStart(6)}deg${s.never ? `  NEVER:${s.never}` : ''}`
  );
}

console.log('\nD. HOW SENSITIVE IS ALL OF IT TO TAU, which nobody has measured on a phone?');
console.log('  tau   | 1500ms win: open / err | 3000ms win: open / err');
for (const tauMs of [1000, 2000, 4000, 8000]) {
  const fast = summarise({ ...BASE, tauMs, sensorHz: 50, windowMs: 1500 });
  const slow = summarise({ ...BASE, tauMs, sensorHz: 50, windowMs: 3000 });
  console.log(
    `  ${String(tauMs).padStart(5)} |  ${fast.openMs.toFixed(0).padStart(5)}ms / ${fast.errorMean.toFixed(2).padStart(5)}deg  |  ${slow.openMs.toFixed(0).padStart(5)}ms / ${slow.errorMean.toFixed(2).padStart(5)}deg`
  );
}

console.log('\nE. THE FLOOR: an ALREADY-CONVERGED stream (a warm reopen) still pays what?');
console.log('  window | opens at | err at open');
for (const windowMs of [1000, 1500, 3000]) {
  const s = summarise({ ...BASE, coldOffset: 0, sensorHz: 50, windowMs });
  console.log(
    `  ${String(windowMs).padStart(5)}  | ${s.openMs.toFixed(0).padStart(6)}ms | ${s.errorMean.toFixed(2).padStart(6)}deg`
  );
}
