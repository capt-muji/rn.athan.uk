/**
 * The compass face's geometry, and the clearances the owner settled by eye on the phone
 */

import {
  arcPath,
  CARDINALS,
  FACE,
  facePoint,
  qiblaLinePath,
  RUB_EL_HIZB_INNER,
  rubElHizbPath,
  TICKS,
  unwrapHeading,
} from '@/shared/qiblaCompass';

/** The radius the design was drawn and measured at, so a px figure here means the same px the owner saw */
const R = 170;

/** Every coordinate pair in an SVG path, as numbers */
const pointsOf = (path: string): { x: number; y: number }[] =>
  [...path.matchAll(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g)].map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));

const distanceFromCentre = ({ x, y }: { x: number; y: number }): number => Math.hypot(x, y);

describe('a point on the face', () => {
  // Zero degrees is straight up and the angle runs clockwise, which is what makes the dial read like a compass
  it.each([
    [0, 0, -R],
    [90, R, 0],
    [180, 0, R],
    [270, -R, 0],
  ])('puts %p degrees at (%p, %p)', (angle, x, y) => {
    const at = facePoint(angle, R);

    expect(at.x).toBeCloseTo(x, 6);
    expect(at.y).toBeCloseTo(y, 6);
  });

  it('stays on the circle it is given, at any angle', () => {
    for (let angle = 0; angle < 360; angle += 7) {
      expect(distanceFromCentre(facePoint(angle, R))).toBeCloseTo(R, 6);
    }
  });
});

describe('the dial ticks', () => {
  it('marks every fifteenth degree once, all the way round', () => {
    expect(TICKS).toHaveLength(24);
    expect(TICKS.map((tick) => tick.angle)).toEqual(Array.from({ length: 24 }, (_, step) => step * 15));
  });

  it('stands the quarters tallest, the eighths between, and the rest short', () => {
    const weightAt = (angle: number) => TICKS.find((tick) => tick.angle === angle)?.weight;

    expect(weightAt(90)).toBe('major');
    expect(weightAt(45)).toBe('mid');
    expect(weightAt(15)).toBe('minor');
    expect(FACE.tickLength.major).toBeGreaterThan(FACE.tickLength.mid);
    expect(FACE.tickLength.mid).toBeGreaterThan(FACE.tickLength.minor);
  });
});

describe('the cardinal letters', () => {
  it('names the four directions at their own bearings', () => {
    expect(CARDINALS).toEqual([
      { angle: 0, letter: 'N' },
      { angle: 90, letter: 'E' },
      { angle: 180, letter: 'S' },
      { angle: 270, letter: 'W' },
    ]);
  });

  // The owner moved them outward toward their notches; past this the Kaaba overlaps one at some bearings
  it('orbits outside the inner circle and inside the ticks', () => {
    expect(FACE.cardinal).toBeGreaterThan(FACE.medallion);
    expect(FACE.cardinal).toBeLessThan(FACE.tick - FACE.tickLength.major);
  });
});

describe('the Rub el Hizb jewel', () => {
  it('is built from two squares at 45 degrees, which is the motif its own construction', () => {
    expect(RUB_EL_HIZB_INNER).toBeCloseTo(Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8), 12);
  });

  it('closes a sixteen-vertex star that alternates between the squares and their crossings', () => {
    const path = rubElHizbPath(R, 0);
    const vertices = pointsOf(path);

    expect(path.endsWith('Z')).toBe(true);
    expect(vertices).toHaveLength(16);
    expect(distanceFromCentre(vertices[0])).toBeCloseTo(R, 1);
    expect(distanceFromCentre(vertices[1])).toBeCloseTo(R * RUB_EL_HIZB_INNER, 1);
  });

  it('turns with its phase, so the line can leave through one of its notches', () => {
    expect(rubElHizbPath(R, 30)).not.toBe(rubElHizbPath(R, 0));
  });
});

describe('the line to Makkah', () => {
  it('is one closed path, so no seam shows anywhere along the run', () => {
    const path = qiblaLinePath(R);

    expect(path.endsWith('Z')).toBe(true);
    expect(path.match(/M/g)).toHaveLength(1);
  });

  it('points straight up, with its tip on the centre line', () => {
    const tip = pointsOf(qiblaLinePath(R)).reduce((far, at) => (at.y < far.y ? at : far));

    expect(tip.x).toBe(0);
    expect(tip.y).toBeLessThan(0);
  });

  it('tapers from the pivot to the head, which is felt as weight rather than seen as a shape', () => {
    const path = qiblaLinePath(R);
    const atHub = Math.abs(pointsOf(path)[0].x);
    const widths = pointsOf(path).map((at) => Math.abs(at.x));

    expect(atHub).toBeGreaterThan(Math.min(...widths.filter((width) => width > 0)));
  });
});

describe('the arc over the Kaaba', () => {
  it('is drawn as a single sweep at the radius it is given', () => {
    const path = arcPath(100, 120, R);
    const [start, , end] = pointsOf(path);

    expect(path).toContain('A');
    expect(distanceFromCentre(start)).toBeCloseTo(R, 1);
    expect(distanceFromCentre(end)).toBeCloseTo(R, 1);
  });

  it('takes the long way round only when the span passes a half turn', () => {
    expect(arcPath(0, 10, R)).toContain(' 0 1 ');
    expect(arcPath(0, 200, R)).toContain(' 1 1 ');
  });
});

describe('the clearances the owner settled on the phone', () => {
  const half = FACE.kaabaSize / 2;

  // The cube's two outward corners sit ON the ring rather than floating between it and the rim
  it('lands the Kaaba\u2019s outward corners exactly on the ring', () => {
    const outwardEdge = FACE.kaaba + half;

    expect(Math.hypot(outwardEdge, half)).toBeCloseTo(FACE.ring, 3);
  });

  it('stops the arrow two pixels short of the Kaaba, so the two never touch', () => {
    const tip = Math.abs(pointsOf(qiblaLinePath(R)).reduce((far, at) => (at.y < far.y ? at : far)).y);
    const kaabaInnerEdge = (FACE.kaaba - half) * R;

    expect(kaabaInnerEdge - tip).toBeCloseTo(2, 0);
  });

  // The arc and the cube must read as one marker, and a round cap adds half a stroke beyond each end of the path
  it('draws the arc exactly as wide as the Kaaba, once its round caps are counted', () => {
    const capDegrees = (((2.2 * FACE.stroke) / 2 / FACE.arc) * 180) / Math.PI;
    const drawnSpread = FACE.arcSpread + capDegrees;
    const kaabaHalfAngle = (Math.atan2(half, FACE.kaaba) * 180) / Math.PI;

    expect(drawnSpread).toBeCloseTo(kaabaHalfAngle, 2);
  });

  it('keeps the arc concentric with the rim, rather than sitting inside it', () => {
    expect(FACE.arc).toBeCloseTo(FACE.rim, 6);
  });

  it('keeps every ring inside the one outside it', () => {
    expect(FACE.medallion).toBeLessThan(FACE.cardinal);
    expect(FACE.cardinal).toBeLessThan(FACE.tick);
    expect(FACE.tick).toBeLessThan(FACE.ring);
    expect(FACE.ring).toBeLessThan(FACE.rim);
  });
});

describe('the heading, carried forward', () => {
  it('leaves a heading alone when it has not wrapped', () => {
    expect(unwrapHeading(10, 20)).toBe(20);
  });

  // Without this the face spins backwards through south on the one degree either side of north
  it('carries a turn past north forward instead of spinning the dial the long way round', () => {
    expect(unwrapHeading(359, 1)).toBe(361);
    expect(unwrapHeading(361, 359)).toBe(359);
  });

  it('keeps counting through many turns, so a user spinning on the spot never unwinds', () => {
    expect(unwrapHeading(1080, 10)).toBe(1090);
  });
});
