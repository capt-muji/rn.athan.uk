/**
 * The Kaaba's geometry, built from the building's own measurements.
 *
 * Height 13.1 m, front 12.86 m, flank 11.03 m, so the cube is slightly taller than it is wide and its flank is
 * shorter again. The hizam and the door sit at the heights they really sit at, which is what keeps the cartoon
 * reading as the Kaaba rather than as a box with a stripe.
 *
 * Pure arithmetic on a box of a given size, so the figure is built once at the size it is drawn and never
 * recomputed. Every ratio lives in `FIGURE`, because a number invented at a call site is how a drawing drifts.
 */

const HEIGHT_METRES = 13.1;
const FRONT_METRES = 12.86;
const FLANK_METRES = 11.03;

/** Two decimal places, matching the rounding the compass face's own paths use */
const round = (value: number): string => value.toFixed(2);

type Point = [x: number, y: number];

const point = ([x, y]: Point): string => `${round(x)},${round(y)}`;
const polygon = (...points: Point[]): string => points.map(point).join(' ');
const polyline = (...points: Point[]): string => `M${points.map(point).join('L')}`;

/** Every proportion the figure is built from, as a share of the box it is drawn in */
export const FIGURE = {
  aspect: FRONT_METRES / HEIGHT_METRES,
  flank: FLANK_METRES / FRONT_METRES,
  /** How much of the flank the oblique view shows, as a share of its true length */
  foreshorten: 0.46,
  /** How far the flank climbs as it recedes: low, because the eye stands on the ground rather than over the roof */
  rake: 0.52,
  /** The hizam, the gold band 95 cm tall whose underside sits two thirds of the way up */
  beltBottom: 8.0 / HEIGHT_METRES,
  beltHeight: 0.95 / HEIGHT_METRES,
  /** The door, 3.06 m by 1.7 m with its sill 2.13 m up, set toward the Black Stone's corner */
  doorWidth: 1.7 / FRONT_METRES,
  doorHeight: 3.06 / HEIGHT_METRES,
  doorSill: 2.13 / HEIGHT_METRES,
  doorCentre: 0.705,
} as const;

export interface KaabaShapes {
  front: string;
  flank: string;
  roof: string;
  silhouette: string;
  belt: { front: string; flank: string };
  door: { x: number; y: number; width: number; height: number };
}

/**
 * Every shape the figure is drawn from, fitted inside a square box of the given size.
 *
 * The cube is fitted rather than placed: its drawn width is the front plus the receding flank and its drawn
 * height the front plus that flank's climb, so the figure fills the box whatever the view angle is set to.
 */
export const kaabaShapes = (box: number, figure = FIGURE): KaabaShapes => {
  const run = figure.flank * figure.foreshorten;
  const climb = run * figure.rake;
  const width = Math.min(box / (1 + run), (box * figure.aspect) / (1 + climb * figure.aspect));
  const height = width / figure.aspect;
  const depth = width * run;
  const rise = width * climb;

  const left = -(width + depth) / 2;
  const bottom = (height + rise) / 2;
  const x = (at: number) => left + at;
  const y = (at: number) => bottom - at;

  const frontBottomLeft: Point = [x(0), y(0)];
  const frontBottomRight: Point = [x(width), y(0)];
  const frontTopRight: Point = [x(width), y(height)];
  const frontTopLeft: Point = [x(0), y(height)];
  const backBottomRight: Point = [x(width + depth), y(rise)];
  const backTopRight: Point = [x(width + depth), y(height + rise)];
  const backTopLeft: Point = [x(depth), y(height + rise)];

  const beltFrom = figure.beltBottom * height;
  const beltTo = beltFrom + figure.beltHeight * height;
  const doorWidth = figure.doorWidth * width;
  const doorHeight = figure.doorHeight * height;
  const doorLeft = figure.doorCentre * width - doorWidth / 2;

  return {
    front: polygon(frontTopLeft, frontTopRight, frontBottomRight, frontBottomLeft),
    flank: polygon(frontTopRight, backTopRight, backBottomRight, frontBottomRight),
    roof: polygon(frontTopLeft, backTopLeft, backTopRight, frontTopRight),
    silhouette: `${polyline(frontTopLeft, backTopLeft, backTopRight, backBottomRight, frontBottomRight, frontBottomLeft)}Z`,
    /** The hizam, carried round the corner onto the flank so the band never stops at the edge */
    belt: {
      front: polygon([x(0), y(beltTo)], [x(width), y(beltTo)], [x(width), y(beltFrom)], [x(0), y(beltFrom)]),
      flank: polygon(
        [x(width), y(beltTo)],
        [x(width + depth), y(beltTo + rise)],
        [x(width + depth), y(beltFrom + rise)],
        [x(width), y(beltFrom)]
      ),
    },
    door: {
      x: x(doorLeft),
      y: y(figure.doorSill * height + doorHeight),
      width: doorWidth,
      height: doorHeight,
    },
  };
};

/** Half the gold outline, which reaches beyond every vertex it is drawn through */
const OUTLINE_OVERSHOOT = 0.041 / 2;

/**
 * How far the drawn figure spreads around its own centre, as a share of the box it is fitted to.
 *
 * `reach` is its furthest point, which is what an orbit must keep clear of the rim; `underside` is how far it
 * falls below centre, which is what must clear the arrowhead when the user is on the line; `halfWidth` is how
 * wide it reads, which the gold arc behind it is cut to match.
 *
 * Measured from the geometry rather than written down beside it, because a figure that is edited and a clearance
 * that is not is how a marker starts overlapping the ring it is meant to sit inside.
 */
const measureSpread = (figure = FIGURE) => {
  // Measured at a large box and divided back down, because the paths round to two decimals and a unit box would
  // quantise every clearance to a hundredth of itself
  const box = 10000;
  const outline = kaabaShapes(box, figure).silhouette;
  const corners = [...outline.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((match) => ({
    x: Number(match[1]) / box,
    y: Number(match[2]) / box,
  }));

  return {
    reach: Math.max(...corners.map(({ x, y }) => Math.hypot(x, y))) + OUTLINE_OVERSHOOT,
    underside: Math.max(...corners.map(({ y }) => y)) + OUTLINE_OVERSHOOT,
    halfWidth: Math.max(...corners.map(({ x }) => Math.abs(x))) + OUTLINE_OVERSHOOT,
  };
};

/** The figure's drawn spread, measured once at load because the proportions never change at runtime */
export const FIGURE_SPREAD = measureSpread();

/**
 * The canvas the marker is drawn on, as a multiple of the box the figure is fitted to.
 *
 * Derived from the drawing's own extent rather than chosen, so a thicker outline or a deeper flank cannot
 * silently clip the figure at exactly the sizes it is hardest to notice.
 */
export const FIGURE_CANVAS = 2 * Math.max(FIGURE_SPREAD.halfWidth, FIGURE_SPREAD.underside);
