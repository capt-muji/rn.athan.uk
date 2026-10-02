/**
 * The latch's own question: while the user is TURNING, what fraction of readings reach the dial?
 *
 * Probe 2 averaged the follow rate over 45 seconds of which 35 were stationary, which flatters the
 * unlatched gate: an unlatched gate re-opens as soon as the phone is held still, so a long still tail
 * hides the defect. The owner's complaint was specifically about motion: "I have shaken the phone a
 * thousand times and it doesn't move."
 *
 * So this measures the follow rate DURING a continuous slow turn, which is the careful alignment a qibla
 * compass is for, with the fusion already converged so the only variable is the gate.
 */

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

const TIME_DELTA_MS = 50;
const DEGREE_DELTA = 2;

let seed = 13572468;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

/** Fusion pre-converged, so the gate is the only variable. The user turns steadily for the whole run. */
const turnRun = ({ sensorHz, degreeGate, latch, turnRateDegPerSec, durationMs = 20000 }) => {
  const JITTER = 0.5;
  const stepMs = 1000 / sensorHz;

  let lastEmitAt = -Infinity;
  let lastAzimuth = Infinity;
  let samples = [];
  let settled = false;
  let emitted = 0;
  let drawn = 0;
  // Prime the window with a settled stationary period so the gate starts open, as it does on device
  for (let t = -4000; t < 0; t += stepMs) {
    samples = trailingWindow([...samples, { degrees: 118.99 + gauss() * JITTER, atMs: t }], t);
    if (hasSettled(samples, t)) settled = true;
  }

  for (let t = 0; t <= durationMs; t += stepMs) {
    const reading = 118.99 + (turnRateDegPerSec * t) / 1000 + gauss() * JITTER;
    const timeOk = t - lastEmitAt > TIME_DELTA_MS;
    const degreeOk = !degreeGate || Math.abs(reading - lastAzimuth) > DEGREE_DELTA;
    if (!(timeOk && degreeOk)) continue;
    lastEmitAt = t;
    lastAzimuth = reading;
    emitted++;

    samples = trailingWindow([...samples, { degrees: reading, atMs: t }], t);
    const open = latch && settled ? true : hasSettled(samples, t);
    if (open) {
      settled = true;
      drawn++;
    }
  }

  return { emitted, drawn, followRate: emitted ? drawn / emitted : 0, drawnPerSec: drawn / (durationMs / 1000) };
};

const CONFIGS = [
  { label: 'SHIPPED 1.29.205  50Hz | no gate | latch', sensorHz: 50, degreeGate: false, latch: true },
  { label: 'A  rate alone      5Hz | no gate | latch', sensorHz: 5, degreeGate: false, latch: true },
  { label: 'B  gate alone     50Hz |    gate | latch', sensorHz: 50, degreeGate: true, latch: true },
  { label: 'C  latch reverted 50Hz | no gate |  none', sensorHz: 50, degreeGate: false, latch: false },
  { label: 'REJECTED 1.29.203  5Hz |    gate |  none', sensorHz: 5, degreeGate: true, latch: false },
];

const TURNS = [
  { label: 'creeping 2 deg/s', rate: 2 },
  { label: 'turning 10 deg/s', rate: 10 },
  { label: 'turning 45 deg/s', rate: 45 },
];

const RUNS = 100;
const pad = (s, n) => String(s).padEnd(n);

console.log('Dial updates per second WHILE TURNING (and the share of emitted readings that reach it).\n');
console.log(pad('configuration', 42), TURNS.map((t) => pad(t.label, 26)).join(''));

for (const config of CONFIGS) {
  const cells = TURNS.map((turn) => {
    let follow = 0;
    let perSec = 0;
    for (let i = 0; i < RUNS; i++) {
      const r = turnRun({ ...config, turnRateDegPerSec: turn.rate });
      follow += r.followRate;
      perSec += r.drawnPerSec;
    }
    return pad(`${(perSec / RUNS).toFixed(1)}/s  (${((follow / RUNS) * 100).toFixed(0)}% of readings)`, 26);
  });
  console.log(pad(config.label, 42), cells.join(''));
}
