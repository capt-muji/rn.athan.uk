/**
 * The gate's real defect is RESOLUTION, not the test it uses.
 *
 * `hasSettled` splits its window into TWO halves and compares their means. A hand waving a figure of eight is
 * roughly sinusoidal, and a sinusoid's two halves average alike, so drift reads near zero while the fusion is
 * still 12 degrees out. That is row 50's measured defect.
 *
 * A range cap was the obvious answer and it is measurably wrong: it rejects a 60-degree wave and a 12-degree
 * hand tremor alike, so a phone held in a hand never opens at all.
 *
 * This asks the honest question: does the SAME drift test, applied to more segments of the same window, see the
 * oscillation that two segments average away? More segments resolve a shorter period, and the test stays a
 * DRIFT test (is the mean moving) rather than becoming a SPREAD test (how noisy is it), which session 48
 * measured and rejected because spread passes a smoothly converging stream at 27 degrees of error.
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

/** The widest disagreement between any two of `segments` equal slices of the window */
const segmentSpread = (win, segments) => {
  const means = [];
  for (let i = 0; i < segments; i += 1) {
    const from = Math.floor((win.length * i) / segments);
    const to = Math.floor((win.length * (i + 1)) / segments);
    if (to <= from) return Infinity;
    means.push(circularMean(win.slice(from, to).map((s) => s.degrees)));
  }
  let widest = 0;
  for (const a of means) for (const b of means) widest = Math.max(widest, Math.abs(headingDelta(a, b)));
  return widest;
};

const makeGate = (segments) => (win, nowMs) => {
  if (win.length < MIN_READINGS) return false;
  if (nowMs - win[0].atMs < WINDOW_MS * 0.9) return false;
  return segmentSpread(win, segments) <= DRIFT_DEGREES;
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

const open = ({ motion, hardIron = 0, jitter = 0.5, gate, durationMs = 40000 }) => {
  const stepMs = 1000 / SENSOR_HZ;
  let samples = [];
  let lastEmit = -Infinity;

  for (let t = 0; t <= durationMs; t += stepMs) {
    const reading = TRUTH + motion(t) + hardIron + COLD_OFFSET * Math.exp(-t / TAU_MS) + gauss() * jitter;
    if (t - lastEmit <= TIME_DELTA_MS) continue;
    lastEmit = t;
    samples = trailingWindow([...samples, { degrees: reading, atMs: t }], t);
    if (gate(samples, t)) return { openedAtMs: t, drawnError: Math.abs(COLD_OFFSET * Math.exp(-t / TAU_MS)) };
  }
  return null;
};

const CASES = [
  ['holds still', () => 0],
  ['waves 3s then still', (t) => (t < 3000 ? 60 * Math.sin(t / 300) : 0)],
  ['waves without stopping', (t) => 60 * Math.sin(t / 300)],
  ['small wave, 20deg', (t) => 20 * Math.sin(t / 300)],
  ['hand tremor, 4deg', (t) => 4 * Math.sin(t / 400) + 1.5 * Math.sin(t / 150)],
  ['hand sway, 12deg', (t) => 12 * Math.sin(t / 900) + 4 * Math.sin(t / 220)],
  ['turns slowly, 20deg/s', (t) => (20 * t) / 1000],
];

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

const fmt = (label, s) =>
  `  ${label.padEnd(23)} | ${Number.isNaN(s.open) ? '   --   ' : `${s.open.toFixed(0).padStart(6)}ms`} | ${Number.isNaN(s.errorMean) ? '   --  ' : `${s.errorMean.toFixed(2).padStart(5)}deg`} | ${Number.isNaN(s.errorP95) ? '   --  ' : `${s.errorP95.toFixed(2).padStart(5)}deg`} | ${s.never ? `${((s.never / RUNS) * 100).toFixed(0)}%` : '0%'}`;

for (const segments of [2, 3, 4, 6]) {
  console.log(`\n${segments} SEGMENTS${segments === 2 ? '  (this is exactly what ships today)' : ''}`);
  console.log('  user                    | opens at | err mean | err p95  | never');
  for (const [label, motion] of CASES) console.log(fmt(label, summarise({ motion, gate: makeGate(segments) })));
}

console.log('\nNOISE TOLERANCE on a still phone (does more resolution refuse a noisy magnetometer?)');
console.log('  jitter  | 2 seg: open / never | 4 seg: open / never');
for (const jitter of [0.5, 1, 2, 3, 5]) {
  const a = summarise({ motion: () => 0, jitter, gate: makeGate(2) });
  const b = summarise({ motion: () => 0, jitter, gate: makeGate(4) });
  const cell = (s) =>
    `${Number.isNaN(s.open) ? '  --  ' : `${s.open.toFixed(0).padStart(6)}ms`} / ${s.never ? `${((s.never / RUNS) * 100).toFixed(0)}%`.padStart(4) : '  0%'}`;
  console.log(`  ${jitter.toFixed(1).padStart(4)}deg | ${cell(a)}      | ${cell(b)}`);
}

console.log('\nHARD IRON is invisible to every segment count, by construction (row 50). Confirming no regression.');
console.log('  iron   | 2 seg err | 4 seg err');
for (const hardIron of [0, 5, 15, 27]) {
  const a = summarise({ motion: () => 0, hardIron, gate: makeGate(2) });
  const b = summarise({ motion: () => 0, hardIron, gate: makeGate(4) });
  console.log(`  ${String(hardIron).padStart(4)}deg |  ${a.errorMean.toFixed(2).padStart(5)}deg  |  ${b.errorMean.toFixed(2).padStart(5)}deg`);
}
