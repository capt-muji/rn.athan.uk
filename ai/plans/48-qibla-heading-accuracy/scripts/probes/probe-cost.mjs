/**
 * What the drift gate COSTS the user: how long before the compass appears, and what it does to the haptic.
 *
 * A gate that takes 20 seconds to open is not shippable however accurate it is, and a gate that runs after
 * the haptic would tap on readings it has not yet trusted. This measures both against the real rates the
 * platform delivers, which session 47 measured on hardware rather than guessed.
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

let seed = 777;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

const WINDOW = 16;
const HALF = 8;
const SPREAD_GATE = 6;
const DRIFT_GATE = 1;

const settledIndex = (readings) => {
  for (let i = WINDOW - 1; i < readings.length; i++) {
    const w = readings.slice(i - WINDOW + 1, i + 1);
    if (circularSpread(w) > SPREAD_GATE) continue;
    if (Math.abs(shortestDelta(circularMean(w.slice(HALF)), circularMean(w.slice(0, HALF)))) > DRIFT_GATE) continue;
    return i;
  }
  return -1;
};

/**
 * The rates session 47 measured on hardware, not guesses:
 * - `expo-location` gates at 2 degrees AND 50ms, and a STILL phone emitted 2 samples in 15 seconds.
 * - A phone being turned by a user emits far more. The gap between those two is the whole problem for a
 *   window-based gate, so both are measured.
 */
const RATES = [
  { name: 'phone still (2 samples / 15s)', hz: 2 / 15 },
  { name: 'phone turning slowly (5 Hz)', hz: 5 },
  { name: 'phone turning briskly (20 Hz, the 50ms gate)', hz: 20 },
];

console.log('# What the drift gate costs: time to first draw\n');
console.log(`Window ${WINDOW}, spread <= ${SPREAD_GATE}, drift <= ${DRIFT_GATE}.\n`);
console.log('A window-based gate needs WINDOW readings before it can open at all, so its floor is set by the rate.\n');
console.log('| Reading rate | Floor (window alone) | Converging fast | Converging slowly | Already settled |');
console.log('| --- | --- | --- | --- | --- |');

const stream = (truth, offset, tau, jitter, count) => {
  const out = [];
  for (let i = 0; i < count; i++) out.push((truth + offset * Math.exp(-i / tau) + gauss() * jitter + 360) % 360);
  return out;
};

const RUNS = 40;
for (const rate of RATES) {
  const cells = [];
  for (const s of [
    { offset: 30, tau: 6, jitter: 1 },
    { offset: 30, tau: 40, jitter: 1 },
    { offset: 0, tau: 1, jitter: 1 },
  ]) {
    let total = 0;
    let n = 0;
    for (let run = 0; run < RUNS; run++) {
      const idx = settledIndex(stream(118.99, s.offset, s.tau, s.jitter, 600));
      if (idx < 0) continue;
      total += idx;
      n++;
    }
    cells.push(n === 0 ? 'never' : `${(total / n / rate.hz).toFixed(1)}s`);
  }
  console.log(`| ${rate.name} | ${(WINDOW / rate.hz).toFixed(1)}s | ${cells[0]} | ${cells[1]} | ${cells[2]} |`);
}

console.log('\n\n## The verdict on a window-based gate\n');
console.log('A STILL phone on iOS/Android emits about 1 reading every 7.5 seconds through the platform gate,');
console.log(`so a ${WINDOW}-reading window needs ${(WINDOW / (2 / 15)).toFixed(0)}s before it can open even once.`);
console.log('That is unshippable. The gate can only work on a stream that is NOT platform-gated, or the window');
console.log('must be measured in TIME with a minimum count, not in readings alone.');

console.log('\n\n## So: what does the 2-degree platform gate do to a settling window?\n');
console.log('The platform suppresses any reading within 2 degrees of the last one. A converged stream with 1');
console.log('degree of jitter therefore emits ALMOST NOTHING, which means the readings a window does see are');
console.log('precisely the ones that moved more than 2 degrees: the gate is fed only the outliers.\n');

for (const jitter of [0.5, 1, 2, 4, 8]) {
  let emitted = 0;
  let last = 118.99;
  const N = 20000;
  for (let i = 0; i < N; i++) {
    const reading = 118.99 + gauss() * jitter;
    if (Math.abs(shortestDelta(reading, last)) > 2) {
      emitted++;
      last = reading;
    }
  }
  console.log(
    `  jitter ${jitter} deg: ${((emitted / N) * 100).toFixed(1)}% of readings survive the 2-degree gate (${emitted} of ${N})`
  );
}
