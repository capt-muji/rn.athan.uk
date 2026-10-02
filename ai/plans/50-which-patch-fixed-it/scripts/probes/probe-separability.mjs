/**
 * Can experiments A, B, C and D actually be separated on a device?
 *
 * Row 50 assumes each of the four changes can be restored on its own and judged. Three of them live in
 * `expo-location` and one is this app's own latch, but they all feed ONE consumer: the settling gate in
 * `hooks/useQibla.ts`, which refuses to draw until the stream has converged. So the experiments are not
 * independent by construction, and whether each one produces a JUDGEABLE compass has to be measured
 * before a plan asks the owner to hold a phone for it.
 *
 * This replicates the shipped gate exactly (shared/qiblaSettle.ts) and the patched and unpatched
 * expo-location emission logic (LocationModule.kt), then asks one question per configuration: does the
 * compass ever draw, and how long does it take?
 */

// Verbatim from shared/qiblaSettle.ts
const SETTLE_WINDOW_MS = 3000;
const SETTLE_MIN_READINGS = 8;
const SETTLE_DRIFT_DEGREES = 1.5;
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

const trailingWindow = (samples, nowMs) => samples.filter((s) => nowMs - s.atMs <= SETTLE_WINDOW_MS);

const hasSettled = (window, nowMs) => {
  if (window.length < SETTLE_MIN_READINGS) return false;
  if (nowMs - window[0].atMs < SETTLE_WINDOW_MS * 0.9) return false;
  const half = Math.floor(window.length / 2);
  const older = circularMean(window.slice(0, half).map((s) => s.degrees));
  const newer = circularMean(window.slice(half).map((s) => s.degrees));
  return Math.abs(headingDelta(newer, older)) <= SETTLE_DRIFT_DEGREES;
};

// expo-location's own gate (LocationModule.kt). TIME_DELTA is 50ms in every configuration; DEGREE_DELTA
// is the 2-degree gate the patch removes.
const TIME_DELTA_MS = 50;
const DEGREE_DELTA = 2;

let seed = 987654321;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

/**
 * One run. `sensorHz` is what SENSOR_DELAY_* buys, `degreeGate` whether the 2-degree gate is present,
 * `latch` whether the app latches the gate. Returns the moment the compass first draws, or null.
 *
 * The truth is a cold fusion converging exponentially onto the real bearing, which is what session 48
 * measured: about 30 degrees out at the first reading, 0.71 converged.
 */
const run = ({ sensorHz, degreeGate, latch, turnRateDegPerSec, durationMs = 60000 }) => {
  const TRUTH = 118.99;
  const COLD_OFFSET = 30;
  const TAU_MS = 4000;
  const JITTER = 0.5;

  const stepMs = 1000 / sensorHz;
  let lastEmitAt = -Infinity;
  let lastAzimuth = Infinity;
  let samples = [];
  let settled = false;

  for (let t = 0; t <= durationMs; t += stepMs) {
    // What the sensor reads: the converging fusion, plus the user's own turn, plus noise
    const converged = TRUTH + COLD_OFFSET * Math.exp(-t / TAU_MS);
    const turn = (turnRateDegPerSec * t) / 1000;
    const reading = converged + turn + gauss() * JITTER;

    // expo-location decides whether to emit this reading at all
    const timeOk = t - lastEmitAt > TIME_DELTA_MS;
    const degreeOk = !degreeGate || Math.abs(reading - lastAzimuth) > DEGREE_DELTA;
    if (!(timeOk && degreeOk)) continue;
    lastEmitAt = t;
    lastAzimuth = reading;

    // The app's settling gate
    samples = trailingWindow([...samples, { degrees: reading, atMs: t }], t);
    if (latch && settled) return { drawsAtMs: t, emitted: true };
    if (hasSettled(samples, t)) {
      settled = true;
      return { drawsAtMs: t, emitted: true };
    }
  }

  return { drawsAtMs: null, emitted: false };
};

const CONFIGS = [
  { label: 'SHIPPED (1.29.205): 50Hz, no degree gate, latched', sensorHz: 50, degreeGate: false, latch: true },
  { label: 'A. rate alone: 5Hz, no degree gate, latched', sensorHz: 5, degreeGate: false, latch: true },
  { label: 'B. gate alone: 50Hz, 2-degree gate, latched', sensorHz: 50, degreeGate: true, latch: true },
  { label: 'C. latch reverted: 50Hz, no degree gate, UNlatched', sensorHz: 50, degreeGate: false, latch: false },
  { label: 'REJECTED (1.29.201): 5Hz, 2-degree gate, UNlatched', sensorHz: 5, degreeGate: true, latch: false },
];

// The two ways a user actually holds the phone while the compass is warming up
const MOTIONS = [
  { label: 'held still', turnRateDegPerSec: 0 },
  { label: 'waving the figure eight the app asks for', turnRateDegPerSec: 25 },
  { label: 'turning slowly onto the line', turnRateDegPerSec: 5 },
];

const RUNS = 200;

console.log('Time until the compass first DRAWS, median of %d runs. "never" = 60s with no draw.\n', RUNS);

const pad = (s, n) => String(s).padEnd(n);
console.log(
  pad('configuration', 54),
  MOTIONS.map((m) => pad(m.label, 42)).join('')
);

for (const config of CONFIGS) {
  const cells = MOTIONS.map((motion) => {
    const times = [];
    let never = 0;
    for (let i = 0; i < RUNS; i++) {
      const result = run({ ...config, turnRateDegPerSec: motion.turnRateDegPerSec });
      if (result.drawsAtMs === null) never++;
      else times.push(result.drawsAtMs);
    }
    if (never === RUNS) return pad('NEVER DRAWS', 42);
    times.sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)];
    const neverPct = ((never / RUNS) * 100).toFixed(0);
    return pad(`${(median / 1000).toFixed(1)}s` + (never ? `  (never: ${neverPct}%)` : ''), 42);
  });
  console.log(pad(config.label, 54), cells.join(''));
}
