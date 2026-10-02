/**
 * The three things the owner can actually JUDGE, measured per configuration.
 *
 * Probe 1 measured time-to-first-draw and found the latch irrelevant to it, which is correct and is the
 * wrong question for the latch: the latch governs whether readings flow AFTER the gate opens. So this
 * measures all three judgeable qualities separately:
 *
 *   1. does it draw, and when                     (the "it's blank" complaint)
 *   2. what fraction of readings reach the dial    (the "shaken a thousand times, doesn't move" complaint)
 *   3. how wrong is the drawn heading              (the "sometimes 20 degrees off" complaint, the real question)
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

let seed = 24681357;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

const TRUTH = 118.99;

/**
 * The user's own motion over time, in degrees of phone rotation. The phone starts 60 degrees off the
 * qibla, the user waves to calibrate for `waveMs`, then turns onto the line and holds it.
 */
const userHeadingOffset = (t, waveMs) => {
  if (t < waveMs) return 60 + 90 * Math.sin((t / 400) * Math.PI);
  const afterWave = t - waveMs;
  const turnMs = 3000;
  if (afterWave < turnMs) return 60 * (1 - afterWave / turnMs);
  return 0;
};

const run = ({ sensorHz, degreeGate, latch, waveMs, durationMs = 45000 }) => {
  const COLD_OFFSET = 30;
  const TAU_MS = 4000;
  const JITTER = 0.5;
  const stepMs = 1000 / sensorHz;

  let lastEmitAt = -Infinity;
  let lastAzimuth = Infinity;
  let samples = [];
  let settled = false;
  let drawsAtMs = null;
  let emittedAfterDraw = 0;
  let drawnAfterDraw = 0;
  // Error judged over the last 5 seconds, when the user is holding still on the line
  const lateErrors = [];
  let drawnHeading = null;

  for (let t = 0; t <= durationMs; t += stepMs) {
    const fusionBias = COLD_OFFSET * Math.exp(-t / TAU_MS);
    const trueDeviceHeading = TRUTH + userHeadingOffset(t, waveMs);
    const reading = trueDeviceHeading + fusionBias + gauss() * JITTER;

    const timeOk = t - lastEmitAt > TIME_DELTA_MS;
    const degreeOk = !degreeGate || Math.abs(reading - lastAzimuth) > DEGREE_DELTA;
    if (!(timeOk && degreeOk)) continue;
    lastEmitAt = t;
    lastAzimuth = reading;
    if (drawsAtMs !== null) emittedAfterDraw++;

    samples = trailingWindow([...samples, { degrees: reading, atMs: t }], t);

    const open = latch && settled ? true : hasSettled(samples, t);
    if (open) {
      settled = true;
      if (drawsAtMs === null) drawsAtMs = t;
      else drawnAfterDraw++;
      drawnHeading = reading;
      // The qibla is at TRUTH; the dial draws `reading`, so the user aims the phone by it. The error the
      // user suffers is how far the drawn heading is from the device's real heading.
      if (t > durationMs - 5000) lateErrors.push(Math.abs(headingDelta(reading, trueDeviceHeading)));
    }
  }

  return {
    drawsAtMs,
    followRate: emittedAfterDraw ? drawnAfterDraw / emittedAfterDraw : 0,
    updatesPerSec: drawnAfterDraw / ((durationMs - (drawsAtMs ?? durationMs)) / 1000 || 1),
    lateError: lateErrors.length ? lateErrors.reduce((a, b) => a + b, 0) / lateErrors.length : null,
    drawnHeading,
  };
};

const CONFIGS = [
  { label: 'SHIPPED 1.29.205  50Hz | no gate | latch', sensorHz: 50, degreeGate: false, latch: true },
  { label: 'A  rate alone      5Hz | no gate | latch', sensorHz: 5, degreeGate: false, latch: true },
  { label: 'B  gate alone     50Hz |    gate | latch', sensorHz: 50, degreeGate: true, latch: true },
  { label: 'C  latch reverted 50Hz | no gate |  none', sensorHz: 50, degreeGate: false, latch: false },
  { label: 'REJECTED 1.29.203  5Hz |    gate |  none', sensorHz: 5, degreeGate: true, latch: false },
];

const RUNS = 200;
const pad = (s, n) => String(s).padEnd(n);

for (const waveMs of [0, 4000]) {
  console.log(
    `\n=== user ${waveMs ? `waves the figure eight for ${waveMs / 1000}s first, then turns onto the line` : 'does not wave, just turns onto the line'} ===\n`
  );
  console.log(
    pad('configuration', 42),
    pad('draws at', 22),
    pad('readings drawn', 16),
    pad('dial updates/s', 16),
    'error held on line'
  );
  for (const config of CONFIGS) {
    let never = 0;
    const draws = [];
    const follows = [];
    const rates = [];
    const errors = [];
    for (let i = 0; i < RUNS; i++) {
      const r = run({ ...config, waveMs });
      if (r.drawsAtMs === null) {
        never++;
        continue;
      }
      draws.push(r.drawsAtMs);
      follows.push(r.followRate);
      rates.push(r.updatesPerSec);
      if (r.lateError !== null) errors.push(r.lateError);
    }
    const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const drawCell =
      never === RUNS
        ? 'NEVER'
        : `${(mean(draws) / 1000).toFixed(1)}s${never ? ` (never ${((never / RUNS) * 100).toFixed(0)}%)` : ''}`;
    console.log(
      pad(config.label, 42),
      pad(drawCell, 22),
      pad(never === RUNS ? '-' : `${(mean(follows) * 100).toFixed(0)}%`, 16),
      pad(never === RUNS ? '-' : mean(rates).toFixed(1), 16),
      errors.length ? `${mean(errors).toFixed(2)} deg` : '-'
    );
  }
}
