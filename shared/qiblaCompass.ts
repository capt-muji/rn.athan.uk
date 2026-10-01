/**
 * The compass face's geometry: the ticks, the letters, the Rub el Hizb jewel and the line to Makkah.
 *
 * Pure arithmetic on a circle of a given radius, so the face is built once at the size it is drawn and never
 * recomputed. Every ratio the drawing needs is in `FACE`, because a number invented at a call site is how four
 * earlier attempts drifted from the design the owner approved.
 */

const DEGREES = Math.PI / 180;

/** Two decimal places, which is what the approved design's own generator rounds its path coordinates to */
const round = (value: number): string => value.toFixed(2);

export interface FacePoint {
  x: number;
  y: number;
}

export type TickWeight = 'minor' | 'mid' | 'major';

export interface DialTick {
  angle: number;
  weight: TickWeight;
}

export interface DialCardinal {
  angle: number;
  letter: string;
}

/**
 * Every radius, length and angle the face is built from, as a share of its radius.
 *
 * Taken from the design the owner locked in on 2026-09-30 (`ai/plans/45-qibla-flat-map/design/README.md`), whose
 * generator these reproduce exactly.
 */
export const FACE = {
  /** The stroke unit every line width is a multiple of */
  stroke: 0.006,
  /** The outer disc, which carries the ground colour */
  rim: 0.985,
  /** The one ring inside the rim. There is deliberately nothing else out here */
  ring: 0.945,
  /** The gold arc marking where Makkah lies: concentric with the rim, so it lies ON it rather than inside it */
  arc: 0.985,
  /**
   * Half the arc's PATH, shortened by the round caps' own overshoot so the DRAWN arc is exactly as wide as the
   * Kaaba: a round cap adds half a stroke beyond each end, which is what made it read longer than the cube.
   */
  arcSpread: 6.31,
  /** The ticks hang inward from here */
  tick: 0.905,
  /** How far each weight of tick reaches in, as a share of the radius */
  tickLength: { minor: 0.026, mid: 0.038, major: 0.055 },
  /**
   * The cardinal letters' orbit: as far out toward their ticks as the Kaaba allows at EVERY bearing.
   * Past this the cube overlaps a letter for about one user in five, since the clash depends on their qibla.
   */
  cardinal: 0.7,
  /** The cardinal letters' size */
  cardinalSize: 0.096,
  /** The inner circle, a quarter smaller than the arrowhead's own reach so the face reads open rather than crowded */
  medallion: 0.462,
  /**
   * The Kaaba's orbit, set so the standing figure clears the rim above and the arrowhead below by about 2px at
   * the size the owner judged it. A figure held upright turns UNDER the plate, so its far corner swings outward
   * at every heading rather than staying squared to the ring, and the orbit has to pay for that swing.
   */
  kaaba: 0.836,
  kaabaSize: 0.1941,
  /** The Rub el Hizb jewel over the pivot, and the smaller one nested inside it */
  jewel: 0.125,
  jewelInner: 0.083,
  /** The gold dot at the pivot the line is hinged on */
  hub: 0.034,
} as const;

/** Where an angle lands on a circle of that radius: 0 degrees straight up, y downward */
export const facePoint = (angle: number, radius: number): FacePoint => ({
  x: Math.sin(angle * DEGREES) * radius,
  y: -Math.cos(angle * DEGREES) * radius,
});

/** Every 15 degrees, with the quarters standing tallest and the eighths between them */
export const TICKS: DialTick[] = Array.from({ length: 24 }, (_, step) => {
  const angle = step * 15;
  const weight: TickWeight = angle % 90 === 0 ? 'major' : angle % 45 === 0 ? 'mid' : 'minor';

  return { angle, weight };
});

export const CARDINALS: DialCardinal[] = [
  { angle: 0, letter: 'N' },
  { angle: 90, letter: 'E' },
  { angle: 180, letter: 'S' },
  { angle: 270, letter: 'W' },
];

/**
 * The Rub el Hizb, the eight-pointed star that marks the Qur'an's divisions.
 *
 * Its inner vertices sit where two squares at 45 degrees cross, at cos(45)/cos(22.5) of the outer radius, so the
 * ratio is the construction's own rather than a chosen approximation of it.
 */
export const RUB_EL_HIZB_INNER = Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8);

/** The jewel as a closed path of 16 vertices, turned so the line leaves through one of its notches */
export const rubElHizbPath = (radius: number, phase: number): string => {
  const vertices = Array.from({ length: 16 }, (_, index) =>
    facePoint(phase + index * 22.5, index % 2 === 0 ? radius : radius * RUB_EL_HIZB_INNER)
  );

  return `${vertices.map((at, index) => `${index === 0 ? 'M' : 'L'}${round(at.x)},${round(at.y)}`).join('')}Z`;
};

/**
 * The line to Makkah: shaft and barbed arrowhead as ONE closed path, drawn pointing straight up.
 *
 * One path rather than two shapes because a seam anywhere along the run is what the owner rejected in six earlier
 * rounds. The shaft's flanks meet the head's notch edges exactly, so the line emerges from the head's own notch and
 * the barbs keep their full sweep.
 */
export const qiblaLinePath = (radius: number): string => {
  // Scaled as one piece so the tip stops just short of the Kaaba's inner edge while the head keeps its proportions
  const reach = 1.0267;
  const barb = 0.6 * reach * radius;
  const notch = 0.648 * reach * radius;
  const tip = 0.715 * reach * radius;
  const barbWidth = 0.046 * radius;
  const shaftAtHub = 0.0125 * radius;
  const shaftAtHead = 0.011 * radius;
  const flank = notch - (notch - barb) * (shaftAtHead / barbWidth);

  return (
    `M${round(-shaftAtHub)},0` +
    `L${round(-shaftAtHead)},${round(-flank)}L${round(-barbWidth)},${round(-barb)}L0,${round(-tip)}` +
    `L${round(barbWidth)},${round(-barb)}L${round(shaftAtHead)},${round(-flank)}L${round(shaftAtHub)},0Z`
  );
};

/** An arc between two angles at a radius, swept clockwise */
export const arcPath = (fromAngle: number, toAngle: number, radius: number): string => {
  const start = facePoint(fromAngle, radius);
  const end = facePoint(toAngle, radius);
  const large = Math.abs(toAngle - fromAngle) > 180 ? 1 : 0;

  return `M${round(start.x)},${round(start.y)}A${round(radius)},${round(radius)} 0 ${large} 1 ${round(end.x)},${round(end.y)}`;
};

/**
 * The heading, carried forward so the face never spins the long way round.
 *
 * An interpolation runs between the two numbers it is given, so a turn from 359 to 1 degrees would drive the face
 * backwards through south unless the wrap is unrolled into a continuous angle first.
 */
export const unwrapHeading = (previous: number, heading: number): number => {
  const turns = Math.round((previous - heading) / 360);

  return heading + turns * 360;
};
