/**
 * THE OWNER'S CHALLENGE: he shakes the phone on every test and feels no penalty. Is the claim true?
 *
 * The claim ("waving opens the gate at 11.88 degrees of error") measures the error at the INSTANT the gate
 * opens. That is not what a user experiences, and this probe measures what is.
 *
 * The gate LATCHES (`settledRef.current = true` in hooks/useQibla.ts), so once it opens EVERY later reading
 * flows straight through to the dial. The fusion keeps converging whether the gate is open or shut. So a user
 * who opens early does not get a wrong ANSWER, they get a dial that is still moving when it appears, and by
 * the time they have turned to face the qibla the fusion has converged regardless.
 *
 * What a user could actually be harmed by, in order of how much it matters:
 *   1. a FALSE HAPTIC: the tap firing while they are not really on the line (this is the real risk)
 *   2. the error at the moment they ALIGN, which is seconds after the open
 *   3. the dial visibly drifting under them after it appears
 */

const DEGREES = Math.PI / 180;

const circularMean = (degrees) => {
  let x = 0;
  let y = 0;
  for (const v of degrees) {
    x += Math.cos(v * DEGREES);
    y += Math.sin(v * DEGREES);
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
const ENTER = 4;
const EXIT = 8;
const TIME_DELTA_MS = 50;
const SENSOR_HZ = 50;
const TRUTH = 118.99;
const COLD_OFFSET = 30;

const trailingWindow = (s, nowMs) => s.filter((x) => nowMs - x.atMs <= WINDOW_MS);

const hasSettled = (win, nowMs) => {
  if (win.length < MIN_READINGS) return false;
  if (nowMs - win[0].atMs < WINDOW_MS * 0.9) return false;
  const half = Math.floor(win.length / 2);
  const older = circularMean(win.slice(0, half).map((x) => x.degrees));
  const newer = circularMean(win.slice(half).map((x) => x.degrees));
  return Math.abs(headingDelta(newer, older)) <= DRIFT_DEGREES;
};

let seed = 20261003;
const reseed = (s) => {
  seed = s;
};
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

/**
 * One whole sheet visit, simulated as the USER actually behaves.
 *
 * Phase 1: the hint is up. The user either waves or holds still.
 * Phase 2: the compass has appeared. The user TURNS toward where the dial says the qibla is, which takes
 *          `reactionMs` to notice plus a turn at `turnRateDegPerSec`, and then holds still on the line.
 *
 * The app's own alignment logic runs throughout, so a false tap is counted the way the app would fire it.
 */
const visit = ({ waves, waveMs, jitter, tauMs, reactionMs, turnRateDegPerSec, startOffsetDeg, durationMs = 40000 }) => {
  const stepMs = 1000 / SENSOR_HZ;
  let samples = [];
  let lastEmit = -Infinity;
  let settled = false;
  let openedAt = null;
  let errorAtOpen = null;

  // Where the phone physically points, relative to the qibla. The user starts off the line and turns onto it.
  let phoneOffset = startOffsetDeg;
  let wasAligned = false;
  const taps = [];
  let firstAlignedAt = null;
  let errorWhenAligned = null;
  let driftAfterOpen = 0;
  let dialAtOpen = null;

  for (let t = 0; t <= durationMs; t += stepMs) {
    const hand = waves && t < waveMs ? 60 * Math.sin(t / 300) : 0;
    const fusionBias = COLD_OFFSET * Math.exp(-t / tauMs);

    // Once the compass is up the user turns to close the gap the DIAL shows them, not the true gap
    if (openedAt !== null && t > openedAt + reactionMs) {
      const shownGap = -(phoneOffset + fusionBias);
      const step = Math.sign(shownGap) * Math.min(Math.abs(shownGap), (turnRateDegPerSec * stepMs) / 1000);
      phoneOffset += step;
    }

    const reading = TRUTH + phoneOffset + hand + fusionBias + gauss() * jitter;
    if (t - lastEmit <= TIME_DELTA_MS) continue;
    lastEmit = t;

    samples = trailingWindow([...samples, { degrees: reading, atMs: t }], t);
    if (!settled && !hasSettled(samples, t)) continue;
    if (!settled) {
      settled = true;
      openedAt = t;
      errorAtOpen = Math.abs(fusionBias);
      dialAtOpen = reading;
    }

    driftAfterOpen = Math.max(driftAfterOpen, Math.abs(headingDelta(reading, dialAtOpen)));

    // The app's own logic, verbatim in behaviour: offset of the DRAWN heading from the bearing
    const drawnOffset = -(phoneOffset + fusionBias + gauss() * 0);
    const away = Math.abs(drawnOffset);
    const nowAligned = wasAligned ? away <= EXIT : away <= ENTER;
    if (!wasAligned && nowAligned) {
      // What the phone TRULY points at, at the moment the app says "you are on the line"
      taps.push({ atMs: t, trueErrorDeg: Math.abs(phoneOffset) });
      if (firstAlignedAt === null) {
        firstAlignedAt = t;
        errorWhenAligned = Math.abs(phoneOffset);
      }
    }
    wasAligned = nowAligned;
  }

  return { openedAt, errorAtOpen, firstAlignedAt, errorWhenAligned, taps, driftAfterOpen };
};

const RUNS = 300;
const stats = (cfg) => {
  const openedAt = [];
  const errorAtOpen = [];
  const errorWhenAligned = [];
  const driftAfterOpen = [];
  let falseTaps = 0;
  let totalTaps = 0;
  let neverAligned = 0;

  for (let i = 0; i < RUNS; i += 1) {
    reseed(20261003 + i * 7919);
    const r = visit(cfg);
    if (r.openedAt === null) continue;
    openedAt.push(r.openedAt);
    errorAtOpen.push(r.errorAtOpen);
    driftAfterOpen.push(r.driftAfterOpen);
    if (r.firstAlignedAt === null) neverAligned += 1;
    else errorWhenAligned.push(r.errorWhenAligned);
    for (const tap of r.taps) {
      totalTaps += 1;
      // A tap is FALSE when the app says "on the line" and the phone is outside the owner's own window
      if (tap.trueErrorDeg > ENTER) falseTaps += 1;
    }
  }

  const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
  const p95 = (a) =>
    a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * 0.95))] : NaN;
  const worst = (a) => (a.length ? Math.max(...a) : NaN);

  return {
    open: mean(openedAt),
    errAtOpen: mean(errorAtOpen),
    errAligned: mean(errorWhenAligned),
    errAlignedP95: p95(errorWhenAligned),
    errAlignedWorst: worst(errorWhenAligned),
    drift: mean(driftAfterOpen),
    falseTapPct: totalTaps ? (falseTaps / totalTaps) * 100 : 0,
    totalTaps,
    neverAligned,
  };
};

const BASE = { waveMs: 3000, jitter: 1, tauMs: 4000, reactionMs: 800, turnRateDegPerSec: 45, startOffsetDeg: 70 };

console.log('THE CLAIM I MADE, restated: error at the INSTANT the gate opens.');
console.log('  user          | opens at | error AT OPEN');
for (const waves of [false, true]) {
  const s = stats({ ...BASE, waves });
  console.log(`  ${(waves ? 'waves' : 'holds still').padEnd(13)} | ${s.open.toFixed(0).padStart(6)}ms | ${s.errAtOpen.toFixed(2).padStart(6)}deg`);
}

console.log('\nWHAT THE USER ACTUALLY GETS: the error when the app TELLS THEM they are on the line.');
console.log('  (the user notices the compass, turns onto the line at 45deg/s, and the fusion keeps converging)');
console.log('  user          | aligns at | true error when told "aligned" | p95  | worst | FALSE taps');
for (const waves of [false, true]) {
  const s = stats({ ...BASE, waves });
  console.log(
    `  ${(waves ? 'waves' : 'holds still').padEnd(13)} | ${s.open.toFixed(0).padStart(7)}ms |          ${s.errAligned.toFixed(2).padStart(5)}deg            | ${s.errAlignedP95.toFixed(2).padStart(4)} | ${s.errAlignedWorst.toFixed(2).padStart(5)} | ${s.falseTapPct.toFixed(1)}% of ${s.totalTaps}`
  );
}

console.log('\nSENSITIVITY: does the answer survive a user who turns FAST, and a slow fusion?');
console.log('  turn rate | fusion tau | still: err when aligned | waves: err when aligned | waves false taps');
for (const turnRateDegPerSec of [30, 45, 90, 180]) {
  for (const tauMs of [2000, 4000, 8000]) {
    const still = stats({ ...BASE, waves: false, turnRateDegPerSec, tauMs });
    const waved = stats({ ...BASE, waves: true, turnRateDegPerSec, tauMs });
    console.log(
      `  ${String(turnRateDegPerSec).padStart(6)}d/s | ${String(tauMs).padStart(7)}ms |        ${still.errAligned.toFixed(2).padStart(5)}deg          |        ${waved.errAligned.toFixed(2).padStart(5)}deg          |  ${waved.falseTapPct.toFixed(1)}%`
    );
  }
}

console.log('\nTHE DIAL DRIFT the user can SEE after the compass appears (how much it moves under them):');
console.log('  user          | dial drifts by');
for (const waves of [false, true]) {
  const s = stats({ ...BASE, waves });
  console.log(`  ${(waves ? 'waves' : 'holds still').padEnd(13)} | ${s.drift.toFixed(1).padStart(5)}deg`);
}

console.log('\nTHE WORST REALISTIC CASE for a waver: user is ALREADY nearly on the line when it opens.');
console.log('  (so they never turn, and whatever error the dial opened with is the answer they act on)');
console.log('  start offset | user      | true error when told "aligned" | FALSE taps');
for (const startOffsetDeg of [0, 5, 10]) {
  for (const waves of [false, true]) {
    const s = stats({ ...BASE, waves, startOffsetDeg });
    console.log(
      `  ${String(startOffsetDeg).padStart(10)}deg | ${(waves ? 'waves' : 'still').padEnd(9)} |          ${Number.isNaN(s.errAligned) ? '  --  ' : s.errAligned.toFixed(2).padStart(5)}deg            |  ${s.falseTapPct.toFixed(1)}% of ${s.totalTaps}`
    );
  }
}
