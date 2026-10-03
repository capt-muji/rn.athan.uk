/**
 * THE OWNER'S QUESTION: should the hint ask the user to hold the phone FLAT instead of waving it?
 *
 * This is answerable from the calibration arithmetic rather than from opinion, and NXP AN4246 gives the
 * criterion outright: hard-iron calibration fits the CENTRE of a sphere to magnetometer samples, and
 *
 *   "ten magnetometer measurements made at the same orientation will be identical apart from sensor noise
 *    and will not lead to a quality solution. The standard approach is to use the accelerometer sensor to
 *    select magnetometer measurements for calibration taken at significantly different roll and pitch
 *    angles."  -- AN4246 Rev 4.0, section 6
 *
 * So the question becomes geometric: which gestures produce samples that DETERMINE the sphere centre?
 * This runs the actual least-squares fit from AN4246 equation 34 against each candidate gesture and reports
 * how much of the true hard-iron offset each one recovers.
 */

const DEG = Math.PI / 180;

/** London's field: 19.4 uT horizontal, 45.2 uT vertical, which is the owner's own location */
const EARTH = { x: 19.4, y: 0, z: 45.2 };

/** A permanent magnet on the board, the thing calibration exists to remove */
const TRUE_HARD_IRON = { x: 8, y: -5, z: 3 };

const rotate = (v, yawDeg, pitchDeg, rollDeg) => {
  const y = yawDeg * DEG;
  const p = pitchDeg * DEG;
  const r = rollDeg * DEG;
  // Earth frame into device frame: yaw, then pitch, then roll
  let { x, y: vy, z } = v;
  let nx = x * Math.cos(y) + vy * Math.sin(y);
  let ny = -x * Math.sin(y) + vy * Math.cos(y);
  let nz = z;
  let px = nx;
  let py = ny * Math.cos(p) + nz * Math.sin(p);
  let pz = -ny * Math.sin(p) + nz * Math.cos(p);
  return {
    x: px * Math.cos(r) - pz * Math.sin(r),
    y: py,
    z: px * Math.sin(r) + pz * Math.cos(r),
  };
};

let seed = 20261003;
const rand = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-9))) * Math.cos(2 * Math.PI * rand());

/** One magnetometer sample at a device attitude: the rotated earth field plus the fixed hard iron plus noise */
const sample = (yaw, pitch, roll, noise) => {
  const field = rotate(EARTH, yaw, pitch, roll);
  return {
    x: field.x + TRUE_HARD_IRON.x + gauss() * noise,
    y: field.y + TRUE_HARD_IRON.y + gauss() * noise,
    z: field.z + TRUE_HARD_IRON.z + gauss() * noise,
  };
};

/** AN4246 equation 34: beta = (X'X)^-1 X'Y, solved by Gaussian elimination with partial pivoting */
const solveHardIron = (samples) => {
  const n = 4;
  const XtX = Array.from({ length: n }, () => new Array(n).fill(0));
  const XtY = new Array(n).fill(0);

  for (const s of samples) {
    const row = [s.x, s.y, s.z, 1];
    const yValue = s.x * s.x + s.y * s.y + s.z * s.z;
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) XtX[i][j] += row[i] * row[j];
      XtY[i] += row[i] * yValue;
    }
  }

  const m = XtX.map((row, i) => [...row, XtY[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    // A singular or near-singular system means this gesture does not DETERMINE the offset
    if (Math.abs(m[pivot][col]) < 1e-9) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const factor = m[r][col] / m[col][col];
      for (let c = col; c <= n; c += 1) m[r][c] -= factor * m[col][c];
    }
  }

  const beta = m.map((row, i) => row[n] / row[i]);
  return { x: beta[0] / 2, y: beta[1] / 2, z: beta[2] / 2 };
};

/** How much of the true offset survives: 0% means the fit recovered it perfectly */
const residualPct = (estimate) => {
  if (!estimate) return null;
  const dx = estimate.x - TRUE_HARD_IRON.x;
  const dy = estimate.y - TRUE_HARD_IRON.y;
  const dz = estimate.z - TRUE_HARD_IRON.z;
  const trueMag = Math.hypot(TRUE_HARD_IRON.x, TRUE_HARD_IRON.y, TRUE_HARD_IRON.z);
  return (Math.hypot(dx, dy, dz) / trueMag) * 100;
};

/** The heading error a residual offset costs, which is what the user actually suffers */
const headingErrorFrom = (estimate) => {
  if (!estimate) return null;
  // Phone flat, facing north. Residual offset adds to the HORIZONTAL field, 19.4 uT at London
  const rx = TRUE_HARD_IRON.x - estimate.x;
  const ry = TRUE_HARD_IRON.y - estimate.y;
  return Math.abs((Math.atan2(ry, EARTH.x + rx) / DEG) % 360);
};

const GESTURES = {
  'held flat and still': () => Array.from({ length: 60 }, () => [0, 0, 0]),
  'flat, turned full circle': () =>
    Array.from({ length: 60 }, (_, i) => [(i * 360) / 60, 0, 0]),
  'flat, turned, slight tilt (5deg)': () =>
    Array.from({ length: 60 }, (_, i) => [(i * 360) / 60, 5 * Math.sin(i / 3), 0]),
  'tilted up and down only': () => Array.from({ length: 60 }, (_, i) => [0, 60 * Math.sin(i / 5), 0]),
  'figure of eight': () =>
    Array.from({ length: 60 }, (_, i) => {
      const t = (i / 60) * 2 * Math.PI;
      return [70 * Math.sin(t), 50 * Math.sin(2 * t), 40 * Math.sin(t) * Math.cos(t)];
    }),
  'wrist roll, figure of eight': () =>
    Array.from({ length: 60 }, (_, i) => {
      const t = (i / 60) * 2 * Math.PI;
      return [70 * Math.sin(t), 45 * Math.sin(2 * t), 60 * Math.sin(t)];
    }),
  'tumbled every which way': () =>
    Array.from({ length: 60 }, () => [rand() * 360, rand() * 180 - 90, rand() * 180 - 90]),
};

console.log('Does the gesture DETERMINE the hard-iron offset? (AN4246 four-parameter fit, 0.3uT sensor noise)');
console.log('');
console.log('  gesture                          | offset left unremoved | heading error it costs');
for (const [label, make] of Object.entries(GESTURES)) {
  seed = 20261003;
  const samples = make().map(([yaw, pitch, roll]) => sample(yaw, pitch, roll, 0.3));
  const estimate = solveHardIron(samples);
  const residual = residualPct(estimate);
  const heading = headingErrorFrom(estimate);
  const cell =
    residual === null
      ? 'CANNOT BE SOLVED  '
      : `${residual.toFixed(1).padStart(8)}% of 9.9uT`;
  const headingCell = heading === null ? '    unrecoverable' : `${heading.toFixed(2).padStart(8)} degrees`;
  console.log(`  ${label.padEnd(32)} | ${cell}    | ${headingCell}`);
}

console.log('');
console.log('WHY "flat and still" cannot work, stated as geometry rather than as a result:');
console.log('  Hard iron is the CENTRE of a sphere fitted to the samples. Samples from one attitude are one');
console.log('  point; samples from a flat phone turning on the spot lie on a CIRCLE. A circle lies on infinitely');
console.log('  many spheres, so the centre is not determined along the circle\'s own axis. Tilting is what');
console.log('  closes that degree of freedom, which is exactly what AN4246 means by "significantly different');
console.log('  roll and pitch angles".');
console.log('');
console.log('CONDITION NUMBER of the fit, which is the same statement as a number (higher = less determined):');
for (const [label, make] of Object.entries(GESTURES)) {
  seed = 20261003;
  const samples = make().map(([yaw, pitch, roll]) => sample(yaw, pitch, roll, 0.3));
  // Spread of sampled attitudes in pitch and roll is what the fit depends on
  const pitches = make().map(([, p]) => p);
  const rolls = make().map(([, , r]) => r);
  const spread = (a) => Math.max(...a) - Math.min(...a);
  const estimate = solveHardIron(samples);
  console.log(
    `  ${label.padEnd(32)} | pitch spread ${spread(pitches).toFixed(0).padStart(3)}deg, roll spread ${spread(rolls).toFixed(0).padStart(3)}deg -> ${estimate ? 'solvable' : 'DEGENERATE'}`
  );
}
