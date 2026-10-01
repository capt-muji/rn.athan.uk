/**
 * The window-in-readings gate was unshippable: a STILL phone emits 1 reading every 7.5s through the
 * platform's 2-degree gate, so 16 readings take 120 seconds.
 *
 * The fix is to measure the window in TIME and to recognise that the platform's gate is itself the
 * signal: a stream that has stopped emitting IS a stream that has stopped moving. This measures a gate
 * built on that insight, which needs no new sensor and no new permission.
 */

const DEGREES = Math.PI / 180;

const shortestDelta = (a, b) => {
  const raw = (a - b) % 360;
  if (raw > 180) return raw - 360;
  if (raw <= -180) return raw + 360;
  return raw;
};

let seed = 4242;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

/**
 * A stream as the PLATFORM delivers it: a 200 Hz underlying sensor, emitted only when the reading moved
 * more than 2 degrees from the last emitted one AND 50ms has passed. That is `expo-location`'s real gate
 * on both platforms, read from its own source.
 */
const platformStream = (truth, offset, tauMs, jitter, durationMs) => {
  const out = [];
  const stepMs = 5;
  let lastEmitted = null;
  let lastEmitMs = -Infinity;
  for (let t = 0; t < durationMs; t += stepMs) {
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
 * The gate: the compass stays blank until the stream has been QUIET for `quietMs`, meaning the platform
 * emitted nothing new, which it only does when the heading stopped changing by more than 2 degrees.
 * Returns the time the gate opened and the value it opened on.
 */
const timedGate = (emissions, quietMs, durationMs) => {
  for (let i = 0; i < emissions.length; i++) {
    const next = i + 1 < emissions.length ? emissions[i + 1].t : durationMs;
    if (next - emissions[i].t >= quietMs) return { t: emissions[i].t + quietMs, value: emissions[i].value };
  }
  return null;
};

const TRUTH = 118.99;
const DURATION = 60000;
const RUNS = 50;

const scenarios = [
  { name: 'cold fusion, converges in 300ms', offset: 30, tauMs: 300, jitter: 1 },
  { name: 'cold fusion, converges in 2s', offset: 30, tauMs: 2000, jitter: 1 },
  { name: 'cold fusion, converges in 8s', offset: 30, tauMs: 8000, jitter: 1 },
  { name: 'indoors, jittery, converges in 2s', offset: 30, tauMs: 2000, jitter: 6 },
  { name: 'STABLE 25deg bias', offset: 25, tauMs: 1e12, jitter: 1 },
  { name: 'never settles, wanders 14deg', offset: 0, tauMs: 1e12, jitter: 14 },
];

console.log('# A gate measured in TIME, using the platform silence as the signal\n');
console.log('The platform emits only on a >2 degree change, so silence IS stillness. No new sensor needed.\n');

for (const quietMs of [400, 800, 1500]) {
  console.log(`\n## Quiet period: ${quietMs}ms with no new emission\n`);
  console.log('| Scenario | opens at | error when it opens | error of the FIRST emission | improvement |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const s of scenarios) {
    let openAt = 0;
    let errOpen = 0;
    let errFirst = 0;
    let worstOpen = 0;
    let never = 0;
    for (let run = 0; run < RUNS; run++) {
      const em = platformStream(TRUTH, s.offset, s.tauMs, s.jitter, DURATION);
      if (em.length) errFirst += Math.abs(shortestDelta(em[0].value, TRUTH));
      const g = timedGate(em, quietMs, DURATION);
      if (!g) {
        never++;
        continue;
      }
      openAt += g.t;
      const e = Math.abs(shortestDelta(g.value, TRUTH));
      errOpen += e;
      worstOpen = Math.max(worstOpen, e);
    }
    const drew = RUNS - never;
    const openCell = drew === 0 ? 'NEVER (refused)' : `${(openAt / drew / 1000).toFixed(2)}s`;
    const errCell = drew === 0 ? 'refused to draw' : `mean ${(errOpen / drew).toFixed(2)}, worst ${worstOpen.toFixed(2)}`;
    const first = errFirst / RUNS;
    const improv = drew === 0 ? 'n/a' : `${(first / Math.max(errOpen / drew, 0.001)).toFixed(1)}x`;
    console.log(`| ${s.name} | ${openCell}${never && drew ? ` (${never}/${RUNS} never)` : ''} | ${errCell} | ${first.toFixed(2)} | ${improv} |`);
  }
}
