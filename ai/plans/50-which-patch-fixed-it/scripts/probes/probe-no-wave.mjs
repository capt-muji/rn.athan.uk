/**
 * The owner's question: if the user never waves the phone, does the compass give a WRONG reading?
 *
 * The figure-eight hint is shown while the settling gate is shut, and it doubles as a loading screen.
 * The gate waits for the heading stream to stop DRIFTING, which a still phone satisfies too, so the
 * compass opens either way. The question is whether it opens on a reading that is correct.
 *
 * The distinction that matters, and it is the one the gate cannot see: a cold fusion's drift DECAYS,
 * so waiting cures it, while a hard-iron offset is STABLE, so waiting never cures it and only the
 * figure-eight gesture does. Session 48 measured exactly this: no gate reading the heading stream can
 * detect a stable bias, by construction.
 */

const SETTLE_WINDOW_MS = 3000;
const SETTLE_MIN_READINGS = 8;
const SETTLE_DRIFT_DEGREES = 1.5;
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

let seed = 20261002;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

const TRUTH = 118.99;
const COLD_OFFSET = 30;
const TAU_MS = 4000;
const WAVE_MS = 4000;

/**
 * One sheet opening. `hardIron` is a stable bias in degrees that only the wave cancels.
 * Returns when the gate opened and how wrong the heading it opened on was.
 */
const open = ({ waves, hardIron, hz = 50, jitter = 0.5, durationMs = 30000 }) => {
  let samples = [];
  let lastEmit = -Infinity;

  for (let t = 0; t <= durationMs; t += 1000 / hz) {
    const fusionDrift = COLD_OFFSET * Math.exp(-t / TAU_MS);
    const iron = waves && t > WAVE_MS ? 0 : hardIron;
    const userMotion = waves && t < WAVE_MS ? 60 * Math.sin(t / 300) : 0;
    const reading = TRUTH + fusionDrift + iron + userMotion + gauss() * jitter;

    if (t - lastEmit <= 50) continue;
    lastEmit = t;

    samples = trailingWindow([...samples, { degrees: reading, atMs: t }], t);
    if (hasSettled(samples, t)) {
      // What the dial draws, against where the phone really points
      const drawnError = Math.abs(headingDelta(reading - userMotion, TRUTH + iron));
      return { openedAtMs: t, drawnError, residualIron: iron };
    }
  }

  return null;
};

const RUNS = 300;
const pad = (s, n) => String(s).padEnd(n);

console.log('Does the compass open WITHOUT a wave, and is the reading it opens on right?\n');
console.log(
  pad('room', 22),
  pad('user', 10),
  pad('opens', 9),
  pad('median open', 14),
  pad('error at open', 15),
  'residual bias'
);

for (const hardIron of [0, 5, 15, 27]) {
  for (const waves of [false, true]) {
    let opened = 0;
    let sumT = 0;
    let sumErr = 0;
    let sumIron = 0;
    for (let i = 0; i < RUNS; i++) {
      const r = open({ waves, hardIron });
      if (!r) continue;
      opened++;
      sumT += r.openedAtMs;
      sumErr += r.drawnError;
      sumIron += Math.abs(r.residualIron);
    }
    const label = hardIron === 0 ? 'clean, no iron' : `${hardIron} deg of hard iron`;
    console.log(
      pad(label, 22),
      pad(waves ? 'waves' : 'still', 10),
      pad(`${((opened / RUNS) * 100).toFixed(0)}%`, 9),
      pad(`${(sumT / Math.max(opened, 1) / 1000).toFixed(1)}s`, 14),
      pad(`${(sumErr / Math.max(opened, 1)).toFixed(2)} deg`, 15),
      `${(sumIron / Math.max(opened, 1)).toFixed(1)} deg`
    );
  }
}

console.log('\nThe gate measures DRIFT, so it cannot tell these two apart:');
console.log('  a cold fusion   drift decays, so waiting alone cures it');
console.log('  hard iron       bias is STABLE, so the window looks settled and the dial draws it');
console.log('\nSo a user who never waves gets a compass that is CONFIDENT and carries the room error.');
