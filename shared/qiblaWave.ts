/**
 * The figure of eight the user waves the phone through, which is how a magnetometer is calibrated.
 *
 * A Gerono lemniscate, because its two lobes meet at the centre and the curve closes on itself: the gesture it
 * teaches has no seam, so a loop that jumped at its restart would be teaching the wrong motion.
 *
 * Pure arithmetic on a box of a given size, so the figure is built once at the size it is drawn and never
 * recomputed. Every proportion lives in `WAVE`, because a number invented at a call site is how a drawing drifts.
 */

const TURN = Math.PI * 2;

/** Two decimal places, matching the rounding the compass face's own paths use */
const round = (value: number): string => value.toFixed(2);

/** Every proportion and count the figure is built from, as a share of the box it is drawn in */
export const WAVE = {
  /** Half the stage the compass would have filled, so the hint never reads as the instrument */
  width: 0.5,
  /** Flatter than it is wide, which is the shape a wrist actually traces */
  height: 0.26,
  stroke: 0.008,
  /** How many straight segments stand in for the curve */
  segments: 48,
  /** The phone the user is being asked to move, drawn to the proportions of a real one */
  phone: { width: 0.072, height: 0.148, radius: 0.016, screenInset: 0.1 },
  /**
   * How far the phone leans into its turn, in degrees either side of upright.
   *
   * The lean follows the curve's own direction, so the figure teaches a WRIST that rolls rather than a hand
   * sliding flat: a phone held rigid through a figure of eight sweeps one plane and calibrates nothing.
   */
  lean: 26,
} as const;

export interface WavePoint {
  x: number;
  y: number;
}

/**
 * Where the wave has reached at a progress of 0 to 1, about the figure's own centre.
 *
 * A worklet, because the phone is placed by this on the UI thread every frame.
 */
export const wavePoint = (progress: number, width: number, height: number): WavePoint => {
  'worklet';
  const angle = progress * TURN;

  return {
    x: (width / 2) * Math.sin(angle),
    y: height * Math.sin(angle) * Math.cos(angle),
  };
};

/**
 * How far the phone leans at a progress of 0 to 1, in degrees.
 *
 * Taken from the curve's own tangent rather than from a second invented motion, so the lean cannot drift out of
 * step with the path however the figure is reshaped. Scaled to `WAVE.lean` at its steepest.
 *
 * A worklet, for the same reason as `wavePoint`.
 */
export const waveLean = (progress: number): number => {
  'worklet';
  const angle = progress * TURN;
  // d/dt of the lemniscate: the x term leads the y term by a quarter turn, and their ratio is the tangent's slope
  const tangent = Math.atan2(2 * Math.cos(2 * angle), Math.cos(angle));

  return Math.sin(tangent) * WAVE.lean;
};

/**
 * The whole figure as one closed path, sampled as segments too short to read as straight.
 *
 * Sampled through `wavePoint` rather than alongside it, so the phone can never run beside the line it is meant
 * to be running along.
 */
export const wavePath = (width: number, height: number): string => {
  const vertices = Array.from({ length: WAVE.segments }, (_, index) => wavePoint(index / WAVE.segments, width, height));

  return `${vertices.map((at, index) => `${index === 0 ? 'M' : 'L'}${round(at.x)},${round(at.y)}`).join('')}Z`;
};

/** The phone's body, as a rounded rectangle centred on its own origin, so a transform alone places it */
export const phoneBody = (size: number): { width: number; height: number; radius: number } => ({
  width: size * WAVE.phone.width,
  height: size * WAVE.phone.height,
  radius: size * WAVE.phone.radius,
});

/** The lit screen inside that body, inset on every side so the phone reads as a device rather than a slab */
export const phoneScreen = (size: number): { width: number; height: number; radius: number } => {
  const body = phoneBody(size);
  const inset = body.width * WAVE.phone.screenInset;

  return {
    width: body.width - inset * 2,
    height: body.height - inset * 2,
    radius: Math.max(body.radius - inset, 0),
  };
};
