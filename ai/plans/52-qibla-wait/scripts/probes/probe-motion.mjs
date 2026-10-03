/**
 * Can the gate tell the USER'S OWN MOTION from the sensor's convergence, reading the heading stream alone?
 *
 * It must be the stream alone: the heading owns the accelerometer and the magnetometer while the sheet is open
 * (ai/AGENTS.md, the session 52 rule), so no second sensor may be subscribed to answer this.
 *
 * The candidate: keep the DRIFT test exactly as it ships, and add a RANGE cap on the same window. Session 48
 * rejected spread as a REPLACEMENT for drift, because spread passes a smoothly converging stream at 27 degrees.
 * This asks whether it earns its place BESIDE drift, where it is doing the opposite job: drift cannot see a
 * wave (the halves average alike), and range cannot miss one.
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

const WINDOW_MS = 3000;
const MIN_READINGS = 8;
const DRIFT_DEGREES = 1.5;

const trailingWindow = (samples, nowMs) => samples.filter((s) => nowMs - s.atMs <= WINDOW_MS);

const driftOk = (win) => {
  const half = Math.floor(win.length / 2);
  const older = circularMean(win.slice(0, half).map((s) => s.degrees));
  const newer = circularMean(win.slice(half).map((s) => s.degrees));
  return Math.abs(headingDelta(newer, older)) <= DRIFT_DEGREES;
};

/** The widest excursion inside the window, measured against its own mean so it survives north */
const windowRange = (win) => {
  const mean = circularMean(win.map((s) => s.degrees));
  let widest = 0;
  for (const s of win) widest = Math.max(widest, Math.abs(headingDelta(s.degrees, mean)));
  return widest * 2;
};

const makeGate = (rangeDegrees) => (win, nowMs) => {
  if (win.length < MIN_READINGS) return false;
  if (nowMs - win[0].atMs < WINDOW_MS * 0.9) return false;
  if (rangeDegrees !== null && windowRange(win) > rangeDegrees) return false;
  return driftOk(win);
};

let seed = 20261003;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

const TRUTH = 118.99;
const TIME_DELTA_MS = 50;
const COLD_OFFSET = 30;
const TAU_MS = 4000;
const SENSOR_HZ = 50;

/**
 * One sheet opening.
 * `motion` is what the USER'S hand does to the true heading over time, in degrees.
 * `hardIron` is a stable bias the gate cannot see by construction (row 50 measured this and it is not in scope).
 */
const open = ({ motion, hardIron = 0, jitter = 0.5, gate, durationMs = 30000 }) => {
  const stepMs = 1000 / SENSOR_HZ;
  let samples = [];
  let lastEmit = -Infinity;

  for (let t = 0; t <= durationMs; t += stepMs) {
    const hand = motion(t);
    const reading = TRUTH + hand + hardIron + COLD_OFFSET * Math.exp(-t / TAU_MS) + gauss() * jitter;
    if (t - lastEmit <= TIME_DELTA_MS) continue;
    lastEmit = t;
    samples = trailingWindow([...samples, { degrees: reading, atMs: t }], t);
    if (gate(samples, t)) {
      // What the dial draws against where the phone really points: the hand's own motion is NOT an error
      const drawnError = Math.abs(COLD_OFFSET * Math.exp(-t / TAU_MS));
      return { openedAtMs: t, drawnError };
    }
  }
  return null;
};

const STILL = () => 0;
const WAVE_MS = 3000;
const WAVES = (t) => (t < WAVE_MS ? 60 * Math.sin(t / 300) : 0);
const WAVES_FOREVER = (t) => 60 * Math.sin(t / 300);
const TURNS_SLOWLY = (t) => (20 * t) / 1000;
const WALKING = (t) => 12 * Math.sin(t / 900) + 4 * Math.sin(t / 220);

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
    errors.push(r.drawnError);
  }
  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
  const p95 = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length * 0.95)] : NaN);
  return { open: mean(times), errorMean: mean(errors), errorP95: p95(errors), never };
};

const CASES = [
  ['holds still', STILL],
  ['waves 3s then still', WAVES],
  ['waves without stopping', WAVES_FOREVER],
  ['turns slowly, 20deg/s', TURNS_SLOWLY],
  ['walking / in a hand', WALKING],
];

const row = (label, s) =>
  `  ${label.padEnd(24)} | ${Number.isNaN(s.open) ? '    --  ' : `${s.open.toFixed(0).padStart(6)}ms`} | ${Number.isNaN(s.errorMean) ? '   -- ' : `${s.errorMean.toFixed(2).padStart(5)}deg`} | ${Number.isNaN(s.errorP95) ? '   -- ' : `${s.errorP95.toFixed(2).padStart(5)}deg`} | ${s.never ? `${((s.never / RUNS) * 100).toFixed(0)}%` : '0%'}`;

console.log('A. THE GATE AS IT SHIPS (drift only). This is the defect row 50 measured.');
console.log('  user                     | opens at | err mean | err p95  | never opens');
for (const [label, motion] of CASES) console.log(row(label, summarise({ motion, gate: makeGate(null) })));

for (const cap of [10, 15, 25, 40]) {
  console.log(`\nB. DRIFT **AND** a ${cap}-degree range cap on the same window`);
  console.log('  user                     | opens at | err mean | err p95  | never opens');
  for (const [label, motion] of CASES) console.log(row(label, summarise({ motion, gate: makeGate(cap) })));
}

console.log('\nC. Does the range cap survive a NOISY phone? (still, convergence done, jitter swept, cap 15)');
console.log('  jitter    | opens at | never opens');
for (const jitter of [0.5, 1, 2, 3, 5]) {
  const s = summarise({ motion: STILL, jitter, gate: makeGate(15) });
  console.log(
    `  ${jitter.toFixed(1).padStart(4)}deg   | ${Number.isNaN(s.open) ? '    --  ' : `${s.open.toFixed(0).padStart(6)}ms`} | ${s.never ? `${((s.never / RUNS) * 100).toFixed(0)}%` : '0%'}`
  );
}

console.log('\nD. Hard iron still passes untouched, as row 50 measured. Not in scope, confirmed not made worse.');
console.log('  hard iron | drift only: open / err | cap 15: open / err');
for (const hardIron of [0, 5, 15, 27]) {
  const a = summarise({ motion: STILL, hardIron, gate: makeGate(null) });
  const b = summarise({ motion: STILL, hardIron, gate: makeGate(15) });
  console.log(
    `  ${String(hardIron).padStart(5)}deg   |  ${a.open.toFixed(0).padStart(5)}ms / ${a.errorMean.toFixed(2).padStart(5)}deg |  ${b.open.toFixed(0).padStart(5)}ms / ${b.errorMean.toFixed(2).padStart(5)}deg`
  );
}
