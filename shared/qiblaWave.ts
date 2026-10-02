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
  dot: 0.038,
  stroke: 0.008,
  /** How many straight segments stand in for the curve */
  segments: 48,
} as const;

export interface WavePoint {
  x: number;
  y: number;
}

/**
 * Where the wave has reached at a progress of 0 to 1, about the figure's own centre.
 *
 * A worklet, because the dot is placed by this on the UI thread every frame.
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
 * The whole figure as one closed path, sampled as segments too short to read as straight.
 *
 * Sampled through `wavePoint` rather than alongside it, so the dot can never run beside the line it is meant
 * to be running along.
 */
export const wavePath = (width: number, height: number): string => {
  const vertices = Array.from({ length: WAVE.segments }, (_, index) => wavePoint(index / WAVE.segments, width, height));

  return `${vertices.map((at, index) => `${index === 0 ? 'M' : 'L'}${round(at.x)},${round(at.y)}`).join('')}Z`;
};
