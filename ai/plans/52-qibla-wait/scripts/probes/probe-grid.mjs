/**
 * The two knobs together: window LENGTH and segment COUNT.
 *
 * Both control the same thing (the shortest oscillation the gate can resolve) and nobody has swept them
 * together. The owner's bar is explicit: accuracy first, and the p95 error at the moment the compass appears
 * must sit inside the 4-degree alignment window, because the haptic fires on that threshold.
 *
 * Reported per cell: when a STILL phone opens (the wait the owner wants shortened), the p95 error it opens on
 * (the accuracy bar), and whether a phone IN A HAND is refused (which decides whether a fail-open path is
 * needed at all).
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

const DRIFT_DEGREES = 1.5;
const MIN_READINGS = 8;

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

const makeGate = (windowMs, segments, driftDegrees = DRIFT_DEGREES) => ({
  trailingWindow: (samples, nowMs) => samples.filter((s) => nowMs - s.atMs <= windowMs),
  hasSettled: (win, nowMs) => {
    if (win.length < MIN_READINGS) return false;
    if (nowMs - win[0].atMs < windowMs * 0.9) return false;
    return segmentSpread(win, segments) <= driftDegrees;
  },
});

let seed = 20261003;
const reseed = () => {
  seed = 20261003;
};
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

const open = ({ motion, jitter, gate, durationMs = 45000 }) => {
  const stepMs = 1000 / SENSOR_HZ;
  let samples = [];
  let lastEmit = -Infinity;

  for (let t = 0; t <= durationMs; t += stepMs) {
    const reading = TRUTH + motion(t) + COLD_OFFSET * Math.exp(-t / TAU_MS) + gauss() * jitter;
    if (t - lastEmit <= TIME_DELTA_MS) continue;
    lastEmit = t;
    samples = gate.trailingWindow([...samples, { degrees: reading, atMs: t }], t);
    if (gate.hasSettled(samples, t)) return { openedAtMs: t, drawnError: Math.abs(COLD_OFFSET * Math.exp(-t / TAU_MS)) };
  }
  return null;
};

const RUNS = 200;
const run = (motion, jitter, gate) => {
  const times = [];
  const errors = [];
  let never = 0;
  for (let i = 0; i < RUNS; i += 1) {
    const r = open({ motion, jitter, gate });
    if (!r) {
      never += 1;
      continue;
    }
    times.push(r.openedAtMs);
    errors.push(r.drawnError);
  }
  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
  const p95 = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * 0.95))] : NaN);
  return { open: mean(times), openP95: p95(times), errorP95: p95(errors), neverPct: (never / RUNS) * 100 };
};

const STILL = () => 0;
const HAND = (t) => 12 * Math.sin(t / 900) + 4 * Math.sin(t / 220);
const WAVE = (t) => 60 * Math.sin(t / 300);

console.log('GRID: still-phone wait and p95 error. BAR: p95 error must stay under 4 degrees.');
console.log('      Each cell averaged over noise levels 0.5, 1, 2 and 3 degrees of jitter (a real phone varies).');
console.log('');
console.log('  win   seg | still: open p95 | still: err p95 | hand refused | wave refused');
const results = [];
for (const windowMs of [1000, 1500, 2000, 2500, 3000]) {
  for (const segments of [2, 3, 4]) {
    const cells = [0.5, 1, 2, 3].map((jitter) => {
      reseed();
      const gate = makeGate(windowMs, segments);
      return { still: run(STILL, jitter, gate), hand: run(HAND, jitter, gate), wave: run(WAVE, jitter, gate) };
    });
    const worstOpen = Math.max(...cells.map((c) => c.still.openP95));
    const worstErr = Math.max(...cells.map((c) => c.still.errorP95));
    const stillNever = Math.max(...cells.map((c) => c.still.neverPct));
    const handRefused = Math.min(...cells.map((c) => c.hand.neverPct));
    const waveRefused = Math.min(...cells.map((c) => c.wave.neverPct));
    const pass = worstErr < 4 && stillNever === 0;
    results.push({ windowMs, segments, worstOpen, worstErr, handRefused, waveRefused, pass });
    console.log(
      `  ${String(windowMs).padStart(4)}   ${segments}  |  ${worstOpen.toFixed(0).padStart(7)}ms      |  ${worstErr.toFixed(2).padStart(5)}deg      |    ${handRefused.toFixed(0).padStart(3)}%      |    ${waveRefused.toFixed(0).padStart(3)}%   ${pass ? '' : '  <-- FAILS BAR'}${stillNever > 0 ? ` still-never ${stillNever.toFixed(0)}%` : ''}`
    );
  }
}

const passing = results.filter((r) => r.pass).sort((a, b) => a.worstOpen - b.worstOpen);
console.log('\nCELLS MEETING THE 4-DEGREE BAR, fastest first:');
for (const r of passing.slice(0, 6)) {
  console.log(
    `  ${r.windowMs}ms x ${r.segments} segments: opens by ${r.worstOpen.toFixed(0)}ms, p95 error ${r.worstErr.toFixed(2)}deg, refuses a hand ${r.handRefused.toFixed(0)}% / a wave ${r.waveRefused.toFixed(0)}%`
  );
}
console.log(`\nSHIPPED TODAY is 3000ms x 2 segments.`);
const shipped = results.find((r) => r.windowMs === 3000 && r.segments === 2);
console.log(
  `  opens by ${shipped.worstOpen.toFixed(0)}ms, p95 error ${shipped.worstErr.toFixed(2)}deg, refuses a hand ${shipped.handRefused.toFixed(0)}%`
);
