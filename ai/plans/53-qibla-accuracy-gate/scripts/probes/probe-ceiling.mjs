/**
 * What the accuracy gate costs against the stopwatch it replaces, and what ceiling the fail-open rule needs.
 *
 * The question the owner's 20 trials left open: his phones show 2 to 3 seconds of animation every time, and the
 * gate is a stopwatch rather than a convergence test. Replacing it with the phone's own uncertainty opens as soon
 * as the phone says it is certain. This measures WHEN that is, across the accuracy regimes his phones might be in,
 * and what a phone that never reports a good accuracy costs.
 *
 * It models only the gate's arithmetic against a reported-accuracy stream. It predicts nothing about his hardware:
 * row 52's own lesson is that one trial on the real device beats every simulation here.
 */

const WINDOW_MS = 3000;
const SPAN_MS = WINDOW_MS * 0.9;
const MIN_READINGS = 8;
const EMIT_HZ = 14.3; // measured: TIME_DELTA = 50f survives the patch, so the gate sees ~14Hz at any sensor rate
const STEP_MS = 1000 / EMIT_HZ;

/**
 * The accuracy a phone reports over time.
 *
 * `settled` is where it ends up, which is the number no build of this app has ever seen untethered. `tau` is how
 * fast it gets there. A phone in daily use hands the app an already-converged fusion (row 52), so `start` is low.
 */
const stream = ({ start, settled, tau }) => (tMs) => settled + (start - settled) * Math.exp(-tMs / tau);

/** The shipped gate: 8 readings spanning 2700ms, whose halves agree. On a converged phone the span is what binds. */
const stopwatchOpensAt = () => {
  let readings = 0;
  for (let t = 0; ; t += STEP_MS) {
    readings += 1;
    if (readings >= MIN_READINGS && t >= SPAN_MS) return t;
  }
};

/** The replacement: open on the first reading whose reported accuracy is inside the threshold, else the ceiling. */
const accuracyOpensAt = ({ reported, threshold, ceilingMs }) => {
  for (let t = 0; t <= ceilingMs; t += STEP_MS) {
    const value = reported(t);
    if (value >= 0 && value <= threshold) return { atMs: t, reason: 'accuracy' };
  }
  return { atMs: ceilingMs, reason: 'ceiling' };
};

const CEILING_MS = 3000;
const regimes = [
  ['already certain (converged fusion, his measured case)', { start: 3, settled: 2, tau: 1000 }],
  ['certain after a short settle', { start: 20, settled: 3, tau: 800 }],
  ['slow to become certain', { start: 30, settled: 3, tau: 3000 }],
  ['NEVER certain: reports 25 forever (the tethered XS reading)', { start: 25, settled: 25, tau: 1000 }],
  ['never certain: reports 10 forever', { start: 10, settled: 10, tau: 1000 }],
];

const stopwatch = stopwatchOpensAt();
console.log(`THE GATE THAT SHIPS TODAY opens at ${stopwatch.toFixed(0)}ms for every phone, certain or not.\n`);

for (const threshold of [4, 10, 15]) {
  console.log(`THRESHOLD ${threshold} degrees, ceiling ${CEILING_MS}ms`);
  console.log('  regime                                                        | opens at | why       | vs today');
  for (const [label, shape] of regimes) {
    const reported = stream(shape);
    const { atMs, reason } = accuracyOpensAt({ reported, threshold, ceilingMs: CEILING_MS });
    const delta = atMs - stopwatch;
    const verdict = delta <= 0 ? `${Math.abs(delta).toFixed(0)}ms faster` : `${delta.toFixed(0)}ms slower`;
    console.log(`  ${label.padEnd(61)} | ${String(atMs.toFixed(0)).padStart(7)}ms | ${reason.padEnd(9)} | ${verdict}`);
  }
  console.log('');
}

// Apple documents a NEGATIVE headingAccuracy as an invalid reading and gates on it unconditionally in its own
// sample. The app cannot see this case at all today, because expo-location buckets it into the same band as a
// merely poor reading. A gate that treated it as a number would open on it.
console.log('THE INVALID CASE: Apple uses a negative accuracy to mean "this reading is invalid".');
for (const threshold of [4, 10, 15]) {
  const naive = -1 <= threshold; // what a gate written as `value <= threshold` would decide
  const guarded = -1 >= 0 && -1 <= threshold;
  console.log(
    `  threshold ${String(threshold).padStart(2)}: a bare "value <= threshold" opens on it: ${naive}` +
      `   |  with the >= 0 guard: ${guarded}`
  );
}
