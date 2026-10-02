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
  width: 0.58,
  /** Flatter than it is wide, which is the shape a wrist actually traces */
  height: 0.24,
  stroke: 0.008,
  /** How many straight segments stand in for the curve */
  segments: 72,
  /** The phone the user is being asked to move, drawn to the proportions of a real one */
  phone: { width: 0.088, height: 0.164, radius: 0.018, screenInset: 0.14, notchWidth: 0.42, notchHeight: 0.055 },
  /** The glowing tail behind the phone, as a share of one loop and of the figure's own stroke */
  trail: { span: 0.21, samples: 24, core: 0.009, halo: 0.03 },
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
 * Which way the phone points at a progress of 0 to 1, in degrees, with its top leading.
 *
 * The phone FACES ALONG THE CURVE, like a car on a road, which is what keeps the trail leaving its bottom edge
 * the whole way round: the direction the tail runs back along and the direction the phone's foot points are the
 * same direction by construction, so they cannot drift apart however the figure is reshaped.
 *
 * It turns only in the plane of the screen. There is no roll out of the screen and no scaling: the phone keeps
 * its dimensions all the way round, because a drawing that narrows reads as a phone turning edge-on and at the
 * extreme it vanishes, which it did.
 *
 * Taken from the curve's own derivative, so the heading is the tangent rather than a second invented motion.
 * The width and height are needed because the figure is wider than it is tall, which tilts every tangent on it.
 */
export const waveHeading = (progress: number, width: number, height: number): number => {
  'worklet';
  const angle = progress * TURN;
  const dx = (width / 2) * Math.cos(angle);
  const dy = height * Math.cos(2 * angle);

  // The phone is drawn pointing up, so its top is turned onto the travel direction: atan2(dx, -dy), not (dy, dx)
  return (Math.atan2(dx, -dy) * 180) / Math.PI;
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

/**
 * The tail behind the phone at a progress of 0 to 1, as an open path ending where the phone is.
 *
 * A worklet: the tail is rebuilt every frame on the UI thread, which is what makes the trail follow rather than
 * sit still. Sampled through `wavePoint` so it cannot drift off the line, and walked BACKWARDS from the phone so
 * the path's last point is always exactly where the phone stands.
 */
export const waveTrail = (progress: number, width: number, height: number): string => {
  'worklet';
  const step = WAVE.trail.span / WAVE.trail.samples;
  let path = '';

  for (let index = WAVE.trail.samples; index >= 0; index--) {
    const at = wavePoint(progress - index * step, width, height);
    path += `${index === WAVE.trail.samples ? 'M' : 'L'}${at.x.toFixed(2)},${at.y.toFixed(2)}`;
  }

  return path;
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

/**
 * The notch at the top of the screen, which is the one mark that names the shape as a phone.
 *
 * A notch rather than a camera dot and a home button: every phone is edge to edge now, so a header and a
 * bumper read as a device from a decade ago, and at this size two small marks read as specks.
 */
export const phoneNotch = (size: number): { width: number; height: number } => {
  const body = phoneBody(size);

  return {
    width: body.width * WAVE.phone.notchWidth,
    height: body.height * WAVE.phone.notchHeight,
  };
};
