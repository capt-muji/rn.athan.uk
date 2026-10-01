/**
 * Two gate shapes have now been measured and rejected:
 *   - a window counted in READINGS needs 120s on a still phone, because the platform emits 1 per 7.5s;
 *   - a gate waiting for platform SILENCE never opens, because jitter alone keeps re-triggering the
 *     2-degree emission gate, so silence never arrives.
 *
 * This measures the correct shape: a drift test over the emissions that arrived in a trailing TIME
 * window, with a minimum count so a sparse stream cannot pass on two readings. It is the form that can
 * actually ship, and this establishes its numbers.
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

const shortestDelta = (a, b) => {
  const raw = (a - b) % 360;
  if (raw > 180) return raw - 360;
  if (raw <= -180) return raw + 360;
  return raw;
};

let seed = 90210;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

/** The stream as `expo-location` delivers it: >2 degrees of change AND at least 50ms since the last */
const platformStream = (truth, offset, tauMs, jitter, durationMs) => {
  const out = [];
  let lastEmitted = null;
  let lastEmitMs = -Infinity;
  for (let t = 0; t < durationMs; t += 5) {
    const value = (truth + offset * Math.exp(-t / tauMs) + gauss() * jitter + 360) % 360;
    const moved = lastEmitted === null || Math.abs(shortestDelta(value, lastEmitted)) > 2;
    if (moved && t - lastEmitMs >= 50) {
      out.push({ t, value });
      lastEmitted = value;
      lastEmitMs = t;
    }
  }
  return out;
};

/**
 * Settled when the emissions of the last `windowMs` number at least `minCount`, and the circular mean of
 * their older half sits within `driftGate` of their newer half. Drift, not spread, because a smoothly
 * converging stream is quiet and still wrong.
 */
const gate = (emissions, windowMs, minCount, driftGate) => {
  for (let i = 0; i < emissions.length; i++) {
    const now = emissions[i].t;
    const window = [];
    for (let j = i; j >= 0 && now - emissions[j].t <= windowMs; j--) window.unshift(emissions[j]);
    if (window.length < minCount) continue;
    // The window must SPAN the period, not merely hold enough readings: a fast-moving stream fills the
    // count in 400ms, and a drift measured over 400ms of a slow 8s convergence is under any useful gate.
    if (now - window[0].t < windowMs * 0.9) continue;
    const half = Math.floor(window.length / 2);
    const older = circularMean(window.slice(0, half).map((e) => e.value));
    const newer = circularMean(window.slice(half).map((e) => e.value));
    if (Math.abs(shortestDelta(newer, older)) > driftGate) continue;
    return { t: now, value: circularMean(window.map((e) => e.value)) };
  }
  return null;
};

const TRUTH = 118.99;
const DURATION = 45000;
const RUNS = 50;

const scenarios = [
  { name: 'cold fusion, converges 300ms', offset: 30, tauMs: 300, jitter: 1, truthful: true },
  { name: 'cold fusion, converges 2s', offset: 30, tauMs: 2000, jitter: 1, truthful: true },
  { name: 'cold fusion, converges 8s', offset: 30, tauMs: 8000, jitter: 1, truthful: true },
  { name: 'indoors jittery, converges 2s', offset: 30, tauMs: 2000, jitter: 6, truthful: true },
  { name: 'STABLE 25deg bias', offset: 25, tauMs: 1e12, jitter: 1, truthful: false },
  { name: 'wanders 14deg, never settles', offset: 0, tauMs: 1e12, jitter: 14, truthful: true },
];

for (const [windowMs, minCount, driftGate] of [
  [2000, 6, 2],
  [3000, 6, 2],
  [3000, 8, 1.5],
]) {
  console.log(`\n## window ${windowMs}ms, at least ${minCount} readings, half-to-half drift <= ${driftGate} deg\n`);
  console.log('| Scenario | opens at | error when it opens | error of FIRST emission | improvement |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const s of scenarios) {
    let openAt = 0;
    let errOpen = 0;
    let worst = 0;
    let errFirst = 0;
    let never = 0;
    for (let run = 0; run < RUNS; run++) {
      const em = platformStream(TRUTH, s.offset, s.tauMs, s.jitter, DURATION);
      if (em.length) errFirst += Math.abs(shortestDelta(em[0].value, TRUTH));
      const g = gate(em, windowMs, minCount, driftGate);
      if (!g) {
        never++;
        continue;
      }
      openAt += g.t;
      const e = Math.abs(shortestDelta(g.value, TRUTH));
      errOpen += e;
      worst = Math.max(worst, e);
    }
    const drew = RUNS - never;
    const openCell = drew === 0 ? 'NEVER (refused)' : `${(openAt / drew / 1000).toFixed(2)}s`;
    const errCell = drew === 0 ? 'refused' : `mean ${(errOpen / drew).toFixed(2)}, worst ${worst.toFixed(2)}`;
    const first = errFirst / RUNS;
    const improv = drew === 0 ? 'n/a' : `${(first / Math.max(errOpen / drew, 0.001)).toFixed(1)}x`;
    console.log(
      `| ${s.name} | ${openCell}${never && drew ? ` (${never}/${RUNS} never)` : ''} | ${errCell} | ${first.toFixed(2)} | ${improv} |`
    );
  }
}
