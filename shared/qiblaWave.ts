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

type Point = [x: number, y: number];

const point = ([x, y]: Point): string => {
  'worklet';

  return `${x.toFixed(2)},${y.toFixed(2)}`;
};

const polygon = (...points: Point[]): string => {
  'worklet';

  return points.map(point).join(' ');
};

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
  phone: { width: 0.105, height: 0.188, radius: 0.02, screenInset: 0.13 },
  /**
   * How far the phone leans into its turn, in degrees either side of upright.
   *
   * The lean follows the curve's own direction, so the figure teaches a WRIST that rolls rather than a hand
   * sliding flat: a phone held rigid through a figure of eight sweeps one plane and calibrates nothing.
   */
  lean: 30,
  /** The glowing tail behind the phone, as a share of one loop and of the figure's own stroke */
  trail: { span: 0.3, samples: 24, core: 0.009, halo: 0.03 },
  /**
   * The depth the phone is drawn with, as a share of its own width.
   *
   * The phone is a SOLID seen obliquely rather than a flat card: a card scaled to edge-on vanishes, which is
   * exactly what the owner saw. Drawn the way the Kaaba is, with a front, a receding flank and a roof.
   */
  slab: { depth: 0.46, rake: 0.42 },
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
 * How far the phone has turned about its own long axis at a progress of 0 to 1, as a share of a quarter turn.
 *
 * NEVER reaches a quarter turn, which is the whole point: a phone turned fully edge-on is a line, and the owner
 * saw exactly that. `WAVE.slab.depth` bounds it so the front face is always the face the user is looking at and
 * the trail always leaves the phone's foot.
 */
export const waveYaw = (progress: number): number => {
  'worklet';

  return Math.cos(progress * TURN * 2);
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

export interface PhoneSlab {
  front: string;
  flank: string;
  roof: string;
  screen: string;
  /** How far the drawn solid reaches below its own centre, which is where the trail must leave it */
  foot: number;
}

/**
 * The phone as a solid seen obliquely, drawn the way the Kaaba is: a front, a receding flank and a roof.
 *
 * `yaw` of 1 shows the flank on the right, -1 on the left, 0 straight on. The flank's width is a share of the
 * phone's own width rather than a rotation, so the front face never narrows to nothing however the phone turns:
 * a flat card scaled to edge-on disappears, which is the defect this replaces.
 *
 * Drawn about the phone's own centre, so one transform places it on the curve.
 *
 * A worklet, and every helper it calls is one too: it is rebuilt on the UI thread every frame, and a plain JS
 * function reached from there throws "Tried to synchronously call a Remote Function" and blanks the screen.
 */
export const phoneSlab = (size: number, yaw: number): PhoneSlab => {
  'worklet';
  const body = phoneBody(size);
  const depth = body.width * WAVE.slab.depth * yaw;
  const rise = Math.abs(depth) * WAVE.slab.rake;
  const halfWidth = body.width / 2;
  const halfHeight = body.height / 2;
  const inset = body.width * WAVE.phone.screenInset;

  const frontTopLeft: Point = [-halfWidth, -halfHeight];
  const frontTopRight: Point = [halfWidth, -halfHeight];
  const frontBottomRight: Point = [halfWidth, halfHeight];
  const frontBottomLeft: Point = [-halfWidth, halfHeight];
  // The flank recedes from whichever edge the yaw turns away from, and climbs as it goes
  const edgeX = depth >= 0 ? halfWidth : -halfWidth;
  const backTop: Point = [edgeX + depth, -halfHeight - rise];
  const backBottom: Point = [edgeX + depth, halfHeight - rise];

  return {
    front: polygon(frontTopLeft, frontTopRight, frontBottomRight, frontBottomLeft),
    flank: polygon([edgeX, -halfHeight], backTop, backBottom, [edgeX, halfHeight]),
    roof: polygon(frontTopLeft, frontTopRight, backTop, [frontTopLeft[0] + depth, -halfHeight - rise]),
    screen: polygon(
      [-halfWidth + inset, -halfHeight + inset],
      [halfWidth - inset, -halfHeight + inset],
      [halfWidth - inset, halfHeight - inset],
      [-halfWidth + inset, halfHeight - inset]
    ),
    foot: halfHeight,
  };
};

/**
 * The phone's body, as a rounded rectangle centred on its own origin, so a transform alone places it.
 *
 * A worklet, because `phoneSlab` is rebuilt on the UI thread every frame and calls this.
 */
export const phoneBody = (size: number): { width: number; height: number; radius: number } => {
  'worklet';

  return {
    width: size * WAVE.phone.width,
    height: size * WAVE.phone.height,
    radius: size * WAVE.phone.radius,
  };
};
