/**
 * The compass face's fixed geometry, kept pure so the unit project can measure it without a renderer.
 */

interface Point {
  x: number;
  y: number;
}

interface DialTick {
  /** Degrees clockwise from the dial's own north */
  angle: number;
  /** How far the tick reaches in from the rim, as a fraction of the radius */
  length: number;
  /** Whether a label sits beside it, which is also what makes it the brightest of the three weights */
  labelled: boolean;
}

interface DialLabel {
  angle: number;
  text: string;
}

const HALF_TURN = 180;
const FULL_TURN = 360;

/** Garmin's published heading-indicator hierarchy: a tick every 5 degrees, a longer one every 10, a label every 30 */
const MINOR_STEP = 5;
const MAJOR_STEP = 10;
const LABEL_STEP = 30;

/** The three weights, in Garmin's 1 : 1.6 : 2.2 ratio, as a fraction of the radius */
const TICK_LENGTH = { minor: 0.05, major: 0.08, labelled: 0.11 };

const CARDINALS: Record<number, string> = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

const bearingsEvery = (step: number): number[] => {
  const bearings: number[] = [];

  for (let angle = 0; angle < FULL_TURN; angle += step) bearings.push(angle);

  return bearings;
};

const tickLength = (angle: number, labelled: boolean): number => {
  if (labelled) return TICK_LENGTH.labelled;

  return angle % MAJOR_STEP === 0 ? TICK_LENGTH.major : TICK_LENGTH.minor;
};

/** Aviation's abbreviation, because three digits every thirty degrees will not fit the arc: 030 reads as 03 */
const labelText = (angle: number): string => {
  const cardinal = CARDINALS[angle];
  if (cardinal) return cardinal;

  return String(angle / 10).padStart(2, '0');
};

/**
 * A point at a bearing on the dial, measured from its centre
 *
 * SVG's y grows downward, so north is negative y.
 *
 * @param angle Degrees clockwise from the dial's north
 * @param distance How far from the centre, in the caller's own units
 * @returns The offset from the centre
 */
export const dialPoint = (angle: number, distance: number): Point => {
  const radians = (angle * Math.PI) / HALF_TURN;

  return { x: Math.sin(radians) * distance, y: -Math.cos(radians) * distance };
};

export const DIAL_TICKS: DialTick[] = bearingsEvery(MINOR_STEP).map((angle) => {
  const labelled = angle % LABEL_STEP === 0;

  return { angle, labelled, length: tickLength(angle, labelled) };
});

export const DIAL_LABELS: DialLabel[] = bearingsEvery(LABEL_STEP).map((angle) => ({
  angle,
  text: labelText(angle),
}));
