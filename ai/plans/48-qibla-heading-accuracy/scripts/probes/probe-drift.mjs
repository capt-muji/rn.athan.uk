/**
 * The spread gate failed: a SMOOTHLY converging stream has low spread and high error, so it passes the
 * gate while 27 degrees wrong, and a stable hard-iron bias passes it instantly at full error.
 *
 * So spread is the wrong discriminator. This tests DRIFT instead: is the window's own mean still moving?
 * A converging fusion is still moving; a converged one is not. And it establishes what NEITHER can see.
 */

const DEGREES = Math.PI / 180;

const circularMean = (values) => {
  let x = 0;
  let y = 0;
  for (const v of values) {
    x += Math.cos(v * DEGREES);
    y += Math.sin(v * DEGREES);
  }
  return (Math.atan2(y / values.length, x / values.length) / DEGREES + 360) % 360;
};

const circularSpread = (values) => {
  let x = 0;
  let y = 0;
  for (const v of values) {
    x += Math.cos(v * DEGREES);
    y += Math.sin(v * DEGREES);
  }
  const r = Math.hypot(x / values.length, y / values.length);
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

const stream = (truth, startOffset, tau, jitter, count) => {
  const out = [];
  for (let i = 0; i < count; i++) {
    const converging = startOffset * Math.exp(-i / tau);
    out.push((truth + converging + gauss() * jitter + 360) % 360);
  }
  return out;
};

const WINDOW = 16;
const HALF = WINDOW / 2;

/**
 * Settled when the window is BOTH quiet (spread) and no longer moving (drift between its two halves).
 * Drift is what a converging fusion still has and a converged one does not.
 */
const firstSettled = (readings, spreadGate, driftGate) => {
  for (let i = WINDOW - 1; i < readings.length; i++) {
    const window = readings.slice(i - WINDOW + 1, i + 1);
    if (circularSpread(window) > spreadGate) continue;
    const older = circularMean(window.slice(0, HALF));
    const newer = circularMean(window.slice(HALF));
    if (Math.abs(shortestDelta(newer, older)) > driftGate) continue;
    return i;
  }
  return -1;
};

const TRUTH = 118.99;
const SAMPLES = 600;
const RUNS = 60;

const scenarios = [
  { name: 'converges fast, low jitter', offset: 30, tau: 6, jitter: 1.0, truthful: true },
  { name: 'converges SLOWLY, low jitter', offset: 30, tau: 40, jitter: 1.0, truthful: true },
  { name: 'converges fast, high jitter (indoors)', offset: 30, tau: 6, jitter: 8.0, truthful: true },
  { name: 'STABLE 25deg hard-iron bias', offset: 25, tau: 1e9, jitter: 1.0, truthful: false },
  { name: 'wanders, no bias', offset: 0, tau: 1e9, jitter: 14.0, truthful: true },
  { name: 'already settled on arrival', offset: 0, tau: 1, jitter: 1.0, truthful: true },
];

console.log('# Drift gate: is the window still MOVING, rather than merely noisy?\n');
console.log(`Window ${WINDOW}, compared as two halves of ${HALF}. Truth ${TRUTH}. ${RUNS} runs per cell.\n`);

for (const [spreadGate, driftGate] of [
  [6, 1.0],
  [6, 0.5],
  [10, 1.0],
]) {
  console.log(`\n## spread <= ${spreadGate} AND half-to-half drift <= ${driftGate} degrees\n`);
  console.log('| Scenario | settled at | error of the window mean WHEN settled | error of FIRST reading |');
  console.log('| --- | --- | --- | --- |');
  for (const s of scenarios) {
    let settledAt = 0;
    let errAtSettle = 0;
    let worst = 0;
    let errFirst = 0;
    let never = 0;
    for (let run = 0; run < RUNS; run++) {
      const readings = stream(TRUTH, s.offset, s.tau, s.jitter, SAMPLES);
      errFirst += Math.abs(shortestDelta(readings[0], TRUTH));
      const idx = firstSettled(readings, spreadGate, driftGate);
      if (idx < 0) {
        never++;
        continue;
      }
      settledAt += idx;
      const window = readings.slice(idx - WINDOW + 1, idx + 1);
      const err = Math.abs(shortestDelta(circularMean(window), TRUTH));
      errAtSettle += err;
      worst = Math.max(worst, err);
    }
    const drew = RUNS - never;
    const cell = drew === 0 ? 'NEVER (refused)' : `sample ${(settledAt / drew).toFixed(1)}`;
    const errCell = drew === 0 ? 'refused to draw' : `mean ${(errAtSettle / drew).toFixed(2)}, worst ${worst.toFixed(2)}`;
    console.log(
      `| ${s.name} | ${cell}${never && drew ? ` (${never}/${RUNS} never)` : ''} | ${errCell} | ${(errFirst / RUNS).toFixed(2)} |`
    );
  }
}

console.log('\n\n## The limit this proves\n');
console.log('A stable bias is BY CONSTRUCTION invisible to any gate reading only the heading stream:');
console.log('it is quiet and it is not moving, which is exactly what "settled" means. Distinguishing it');
console.log('needs a second, independent quantity, which is what the field-magnitude and dip check is for.');
