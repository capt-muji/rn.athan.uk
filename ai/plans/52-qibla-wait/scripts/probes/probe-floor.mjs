/**
 * THE HONEST DESIGN, and why the two obvious ones are wrong.
 *
 * You cannot separate the fusion's convergence from the user's own motion by reading the heading stream alone.
 * Session 48 proved the same shape of thing about hard iron: "no gate reading the heading stream alone can see
 * a STABLE bias, by construction". A slow user turn and a slow fusion drift ARE the same signal.
 *
 * So the gate needs a term that does not read the stream at all, and cannot therefore be gamed by any motion:
 * a TIME FLOOR measured from the first reading. The fusion's error decays on its own time constant whatever
 * the user does, so a floor buys a guaranteed accuracy that no wave, sway or turn can defeat.
 *
 * Measured here:
 *   A. what each floor guarantees, against every user behaviour
 *   B. whether the drift gate still earns its place beside a floor
 *   C. the warm reopen, VERIFIED against the remembered heading rather than assumed from elapsed time
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

const driftSettled = (win, nowMs) => {
  if (win.length < MIN_READINGS) return false;
  if (nowMs - win[0].atMs < WINDOW_MS * 0.9) return false;
  const half = Math.floor(win.length / 2);
  const older = circularMean(win.slice(0, half).map((s) => s.degrees));
  const newer = circularMean(win.slice(half).map((s) => s.degrees));
  return Math.abs(headingDelta(newer, older)) <= DRIFT_DEGREES;
};

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
const SENSOR_HZ = 50;

const MOTIONS = [
  ['holds still', () => 0],
  ['waves hard, 60deg', (t) => 60 * Math.sin(t / 300)],
  ['waves 3s then still', (t) => (t < 3000 ? 60 * Math.sin(t / 300) : 0)],
  ['hand sway, 12deg', (t) => 12 * Math.sin(t / 900) + 4 * Math.sin(t / 220)],
  ['hand tremor, 4deg', (t) => 4 * Math.sin(t / 400) + 1.5 * Math.sin(t / 150)],
  ['turns slowly, 20deg/s', (t) => (20 * t) / 1000],
  ['walks and turns', (t) => (10 * t) / 1000 + 12 * Math.sin(t / 900)],
];

/** One cold open. `floorMs` is the minimum age of the stream before the gate may pass, whatever it reads. */
const openCold = ({ motion, jitter, tauMs, floorMs, useDrift, durationMs = 45000 }) => {
  const stepMs = 1000 / SENSOR_HZ;
  let samples = [];
  let lastEmit = -Infinity;
  let firstAt = null;

  for (let t = 0; t <= durationMs; t += stepMs) {
    const reading = TRUTH + motion(t) + COLD_OFFSET * Math.exp(-t / tauMs) + gauss() * jitter;
    if (t - lastEmit <= TIME_DELTA_MS) continue;
    lastEmit = t;
    if (firstAt === null) firstAt = t;
    samples = trailingWindow([...samples, { degrees: reading, atMs: t }], t);

    if (t - firstAt < floorMs) continue;
    if (useDrift && !driftSettled(samples, t)) continue;
    return { openedAtMs: t, error: Math.abs(COLD_OFFSET * Math.exp(-t / tauMs)) };
  }
  return null;
};

const RUNS = 200;
const stat = (cfg) => {
  const times = [];
  const errors = [];
  let never = 0;
  for (let i = 0; i < RUNS; i += 1) {
    const r = openCold(cfg);
    if (!r) {
      never += 1;
      continue;
    }
    times.push(r.openedAtMs);
    errors.push(r.error);
  }
  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
  const p95 = (a) =>
    a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * 0.95))] : NaN;
  return { open: mean(times), openP95: p95(times), errP95: p95(errors), neverPct: (never / RUNS) * 100 };
};

const JITTERS = [0.5, 1, 2, 3];
const TAUS = [2000, 4000, 6000];

const worstOver = (make) => {
  let openP95 = 0;
  let errP95 = 0;
  let neverPct = 0;
  for (const jitter of JITTERS) {
    for (const tauMs of TAUS) {
      reseed();
      const s = stat(make(jitter, tauMs));
      if (!Number.isNaN(s.openP95)) openP95 = Math.max(openP95, s.openP95);
      if (!Number.isNaN(s.errP95)) errP95 = Math.max(errP95, s.errP95);
      neverPct = Math.max(neverPct, s.neverPct);
    }
  }
  return { openP95, errP95, neverPct };
};

console.log('A. A TIME FLOOR ALONE (no drift test). Worst case over jitter 0.5-3deg and tau 2000-6000ms.');
console.log('   The point: the floor reads nothing, so EVERY user behaviour gets the same guarantee.');
console.log('');
console.log('  floor  | worst p95 error across ALL 7 user behaviours | refused');
for (const floorMs of [3000, 5000, 7000, 9000, 11000, 13000]) {
  let worstErr = 0;
  let worstNever = 0;
  for (const [, motion] of MOTIONS) {
    const w = worstOver((jitter, tauMs) => ({ motion, jitter, tauMs, floorMs, useDrift: false }));
    worstErr = Math.max(worstErr, w.errP95);
    worstNever = Math.max(worstNever, w.neverPct);
  }
  console.log(
    `  ${String(floorMs).padStart(5)}ms |            ${worstErr.toFixed(2).padStart(6)}deg                     |  ${worstNever.toFixed(0)}%${worstErr < 4 ? '   <- meets the 4deg bar' : ''}`
  );
}

console.log('\nB. FLOOR **AND** DRIFT, which is the shipped gate with a floor added. Floor 9000ms.');
console.log('  user                   | opens p95 | err p95 | never');
for (const [label, motion] of MOTIONS) {
  const w = worstOver((jitter, tauMs) => ({ motion, jitter, tauMs, floorMs: 9000, useDrift: true }));
  console.log(
    `  ${label.padEnd(22)} | ${w.openP95 ? `${w.openP95.toFixed(0).padStart(7)}ms` : '    --  '} | ${w.errP95 ? `${w.errP95.toFixed(2).padStart(5)}deg` : '   -- '} | ${w.neverPct.toFixed(0)}%`
  );
}

console.log('\nC. THE SHIPPED GATE, drift only, for comparison. Same worst-case sweep.');
console.log('  user                   | opens p95 | err p95 | never');
for (const [label, motion] of MOTIONS) {
  const w = worstOver((jitter, tauMs) => ({ motion, jitter, tauMs, floorMs: 0, useDrift: true }));
  console.log(
    `  ${label.padEnd(22)} | ${w.openP95 ? `${w.openP95.toFixed(0).padStart(7)}ms` : '    --  '} | ${w.errP95 ? `${w.errP95.toFixed(2).padStart(5)}deg` : '   -- '} | ${w.neverPct.toFixed(0)}%`
  );
}

console.log('\nD. THE WARM REOPEN, verified rather than assumed.');
console.log('   The sheet remembers the heading it last drew. On reopen the first readings are compared with it:');
console.log('   agreement means the fusion never went cold and the compass draws at once; disagreement means the');
console.log('   full gate. So an assumption about the OS is replaced by a measurement of it.');
console.log('');
const warmOpen = ({ rememberedError, confirmReadings, tolerance, jitter }) => {
  const stepMs = 1000 / SENSOR_HZ;
  let lastEmit = -Infinity;
  const seen = [];
  for (let t = 0; t <= 4000; t += stepMs) {
    // The fusion is as warm as it was left: `rememberedError` is how far the remembered heading sits from truth
    const reading = TRUTH + rememberedError + gauss() * jitter;
    if (t - lastEmit <= TIME_DELTA_MS) continue;
    lastEmit = t;
    seen.push(reading);
    if (seen.length < confirmReadings) continue;
    const mean = circularMean(seen.slice(-confirmReadings));
    const agrees = Math.abs(headingDelta(mean, TRUTH + rememberedError)) <= tolerance;
    return { atMs: t, agrees, error: Math.abs(rememberedError) };
  }
  return null;
};
console.log('  confirm | tolerance | draws at | and the error it draws on (= the error it was left with)');
for (const confirmReadings of [3, 5, 8]) {
  for (const tolerance of [2, 3]) {
    reseed();
    let worstAt = 0;
    let agreedAll = true;
    for (const jitter of JITTERS) {
      for (let i = 0; i < 200; i += 1) {
        const r = warmOpen({ rememberedError: 0.7, confirmReadings, tolerance, jitter });
        worstAt = Math.max(worstAt, r.atMs);
        if (!r.agrees) agreedAll = false;
      }
    }
    console.log(
      `  ${String(confirmReadings).padStart(5)}   |   ${tolerance}deg     |  ${worstAt.toFixed(0).padStart(5)}ms  |  agrees every time: ${agreedAll}`
    );
  }
}
console.log('');
console.log('  A phone MOVED while the sheet was closed must NOT draw instantly. Remembered 0.7deg, now off by:');
console.log('  moved by | first 5 readings agree within 3deg?  (false = falls through to the full gate, correct)');
for (const moved of [0, 2, 5, 15, 40, 90]) {
  reseed();
  let anyAgreed = false;
  for (let i = 0; i < 200; i += 1) {
    const stepMs = 1000 / SENSOR_HZ;
    const seen = [];
    for (let t = 0; seen.length < 5; t += stepMs) {
      if (t % (TIME_DELTA_MS + stepMs) < stepMs) seen.push(TRUTH + moved + gauss() * 1);
    }
    const mean = circularMean(seen);
    if (Math.abs(headingDelta(mean, TRUTH)) <= 3) anyAgreed = true;
  }
  console.log(`  ${String(moved).padStart(6)}deg | ${anyAgreed}`);
}
