/**
 * The Kaaba's geometry, built from the building's own measurements.
 *
 * Height 13.1 m, front 12.86 m, flank 11.03 m, so the cube is slightly taller than it is wide and its flank is
 * shorter again. The hizam, the door, the Black Stone and the shadharwan sit at the heights they really sit at,
 * which is what separates this from a square with a stripe.
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
  /** The braid along the band's two edges, as a share of the band's height */
  beltBraid: 0.17,
  /** How many cells of inscription run across the band */
  beltWords: 7,
  /** The door, 3.06 m by 1.7 m with its sill 2.13 m up, set toward the Black Stone's corner */
  doorWidth: 1.7 / FRONT_METRES,
  doorHeight: 3.06 / HEIGHT_METRES,
  doorSill: 2.13 / HEIGHT_METRES,
  doorCentre: 0.705,
  /** The shadharwan, the sloped marble skirt around the base */
  plinth: 0.45 / HEIGHT_METRES,
  /** The Black Stone in its silver frame, 1.5 m up, set just in from the eastern corner */
  stoneHeight: 1.5 / HEIGHT_METRES,
  stoneRadius: 0.05,
  stoneInset: 0.055,
  /** The mizab, the golden rainspout running out over the roof's north-western edge */
  spout: { length: 0.17, from: 0.26, to: 0.62, thickness: 0.035 },
  /** The kiswah's vertical seams, as fractions across the front */
  seams: [0.24, 0.48, 0.9],
} as const;

export interface KaabaShapes {
  front: string;
  flank: string;
  roof: string;
  silhouette: string;
  corner: string;
  eave: string;
  spout: string;
  spoutLip: string;
  belt: { front: string; flank: string };
  braidTop: string;
  braidBottom: string;
  words: string;
  plinth: { front: string; flank: string };
  door: { x: number; y: number; width: number; height: number };
  doorPanel: { x: number; y: number; width: number; height: number };
  stone: { x: number; y: number; r: number };
  seams: string;
}

/**
 * One cell of the hizam's inscription: a baseline dipping into two bowls, with ascenders rising off it.
 *
 * Not letters. The eye reads cursive script by its baseline-and-ascender rhythm long before it resolves glyphs,
 * so reproducing that rhythm is what makes a band three pixels tall read as writing rather than as a row of ticks.
 */
const cartouche = (
  horizontal: (at: number) => number,
  vertical: (at: number) => number,
  left: number,
  cell: number,
  base: number,
  cap: number,
  index: number
): string => {
  const x = (at: number) => horizontal(left + cell * at);
  const y = (at: number) => vertical(base + (cap - base) * at);
  const tall = index % 2 === 0;

  return (
    `M${point([x(0), y(0)])}Q${point([x(0.18), y(-0.42)])} ${point([x(0.36), y(0)])}` +
    `L${point([x(0.62), y(0)])}Q${point([x(0.78), y(-0.3)])} ${point([x(0.94), y(0)])}` +
    `M${point([x(0.3), y(0)])}L${point([x(0.3), y(tall ? 1 : 0.62)])}` +
    `M${point([x(0.72), y(0)])}L${point([x(0.72), y(tall ? 0.55 : 0.9)])}`
  );
};

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

  /** A horizontal band across the front, carried round the corner onto the flank */
  const band = (from: number, to: number) => ({
    front: polygon([x(0), y(to)], [x(width), y(to)], [x(width), y(from)], [x(0), y(from)]),
    flank: polygon(
      [x(width), y(to)],
      [x(width + depth), y(to + rise)],
      [x(width + depth), y(from + rise)],
      [x(width), y(from)]
    ),
  });

  const beltFrom = figure.beltBottom * height;
  const beltTo = beltFrom + figure.beltHeight * height;
  const braid = figure.beltBraid * (beltTo - beltFrom);
  const wordTop = beltTo - braid * 1.6;
  const wordBottom = beltFrom + braid * 1.6;
  const margin = width * 0.04;
  const cell = (width - margin * 2) / figure.beltWords;

  const doorWidth = figure.doorWidth * width;
  const doorHeight = figure.doorHeight * height;
  const doorLeft = figure.doorCentre * width - doorWidth / 2;
  const doorBottom = figure.doorSill * height;

  // The spout runs out from the roof's left edge in the roof's OWN plane, which this projection draws horizontal.
  // It is its own shape rather than part of the outline: threading it through makes that outline double back on
  // itself, which reads as a bent wire rather than as a spout.
  const reach = width * figure.spout.length;
  const thickness = width * figure.spout.thickness;
  const onRoofEdge = (at: number): Point => [x(depth * at), y(height + rise * at)];
  const rootNear = onRoofEdge(figure.spout.from);
  const rootFar = onRoofEdge(figure.spout.to);
  const tipNear: Point = [rootNear[0] - reach, rootNear[1]];
  const tipFar: Point = [rootFar[0] - reach, rootFar[1]];

  return {
    front: polygon(frontTopLeft, frontTopRight, frontBottomRight, frontBottomLeft),
    flank: polygon(frontTopRight, backTopRight, backBottomRight, frontBottomRight),
    roof: polygon(frontTopLeft, backTopLeft, backTopRight, frontTopRight),
    silhouette: `${polyline(frontTopLeft, backTopLeft, backTopRight, backBottomRight, frontBottomRight, frontBottomLeft)}Z`,
    corner: polyline(frontTopRight, frontBottomRight),
    eave: polyline(frontTopLeft, frontTopRight),
    spout: polygon(rootNear, tipNear, tipFar, rootFar),
    spoutLip: polygon(tipNear, [tipNear[0], tipNear[1] + thickness], [tipFar[0], tipFar[1] + thickness], tipFar),
    belt: band(beltFrom, beltTo),
    braidTop: band(beltTo - braid, beltTo).front,
    braidBottom: band(beltFrom, beltFrom + braid).front,
    words: Array.from({ length: figure.beltWords }, (_, index) =>
      cartouche(x, y, margin + cell * index, cell, wordBottom, wordTop, index)
    ).join(''),
    plinth: band(0, figure.plinth * height),
    door: { x: x(doorLeft), y: y(doorBottom + doorHeight), width: doorWidth, height: doorHeight },
    doorPanel: {
      x: x(doorLeft + doorWidth * 0.16),
      y: y(doorBottom + doorHeight * 0.88),
      width: doorWidth * 0.68,
      height: doorHeight * 0.74,
    },
    stone: { x: x(width * (1 - figure.stoneInset)), y: y(figure.stoneHeight * height), r: figure.stoneRadius * width },
    seams: figure.seams.map((at) => polyline([x(at * width), y(height)], [x(at * width), y(0)])).join(''),
  };
};

/** Half the gold outline, which reaches beyond every vertex it is drawn through */
const OUTLINE_OVERSHOOT = 0.011 / 2;

/**
 * How far the drawn figure spreads around its own centre, as a share of the box it is fitted to.
 *
 * `reach` is its furthest point, which is what an orbit must keep clear of the rim; `underside` is how far it
 * falls below centre, which is what must clear the arrowhead when the user is on the line; `halfWidth` is how
 * wide the CUBE reads, which the gold arc behind it is cut to match, the mizab being too slight to widen a
 * marker; `extent` is the half-size of the smallest square that holds the whole drawing.
 *
 * Measured from the geometry rather than written down beside it, because a figure that is edited and a clearance
 * that is not is how a marker starts overlapping the ring it is meant to sit inside.
 */
const measureSpread = (figure = FIGURE) => {
  // Measured at a large box and divided back down, because the paths round to two decimals and a unit box would
  // quantise every clearance to a hundredth of itself
  const box = 10000;
  const shapes = kaabaShapes(box, figure);
  const read = (path: string) =>
    [...path.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((match) => ({
      x: Number(match[1]) / box,
      y: Number(match[2]) / box,
    }));

  const cube = read(shapes.silhouette);
  const everything = cube.concat(read(shapes.spout), read(shapes.spoutLip));
  const furthestFromCentre = Math.max(...everything.flatMap(({ x, y }) => [Math.abs(x), Math.abs(y)]));

  return {
    reach: Math.max(...everything.map(({ x, y }) => Math.hypot(x, y))) + OUTLINE_OVERSHOOT,
    underside: Math.max(...everything.map(({ y }) => y)) + OUTLINE_OVERSHOOT,
    halfWidth: Math.max(...cube.map(({ x }) => Math.abs(x))) + OUTLINE_OVERSHOOT,
    extent: furthestFromCentre + OUTLINE_OVERSHOOT,
  };
};

/** The figure's drawn spread, measured once at load because the proportions never change at runtime */
export const FIGURE_SPREAD = measureSpread();

/**
 * The canvas the marker is drawn on, as a multiple of the box the figure is fitted to.
 *
 * Derived from the drawing's own extent rather than chosen, because the mizab reaches past the cube and a canvas
 * guessed a little too small clips it at exactly the sizes it is hardest to notice.
 */
export const FIGURE_CANVAS = FIGURE_SPREAD.extent * 2;
