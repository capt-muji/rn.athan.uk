/**
 * Placing ground positions on the map canvas, and drawing the qibla ray across it
 */

import { DRAWN_RADIUS_METRES, projectToCanvas, rayEndpoint } from '@/components/qibla/mapProjection';
import { metresPerDegree } from '@/shared/tileGeometry';

const HERE = { latitude: 51.5074, longitude: -0.1278 };
const CANVAS = 300;
const CENTRE = CANVAS / 2;

/** A position a given number of metres from HERE, so a test can name a distance rather than a coordinate */
const metresAway = (north: number, east: number) => {
  const scale = metresPerDegree(HERE.latitude);

  return { latitude: HERE.latitude + north / scale.latitude, longitude: HERE.longitude + east / scale.longitude };
};

describe('placing a position on the canvas', () => {
  it('puts the user at the centre', () => {
    expect(projectToCanvas(HERE, HERE, CANVAS)).toEqual({ x: CENTRE, y: CENTRE });
  });

  it('puts a position due north above the centre, because screen y grows downward', () => {
    const point = projectToCanvas(HERE, metresAway(50, 0), CANVAS);

    expect(point.y).toBeLessThan(CENTRE);
    expect(point.x).toBeCloseTo(CENTRE, 6);
  });

  it('puts a position due east to the right of the centre', () => {
    const point = projectToCanvas(HERE, metresAway(0, 50), CANVAS);

    expect(point.x).toBeGreaterThan(CENTRE);
    expect(point.y).toBeCloseTo(CENTRE, 6);
  });

  it('puts a position due south below the centre', () => {
    expect(projectToCanvas(HERE, metresAway(-50, 0), CANVAS).y).toBeGreaterThan(CENTRE);
  });

  it('puts a position due west to the left of the centre', () => {
    expect(projectToCanvas(HERE, metresAway(0, -50), CANVAS).x).toBeLessThan(CENTRE);
  });

  it('scales by the drawn radius, so the radius reaches the canvas edge', () => {
    const point = projectToCanvas(HERE, metresAway(DRAWN_RADIUS_METRES, 0), CANVAS);

    expect(point.y).toBeCloseTo(0, 4);
  });

  it('puts a position at half the radius halfway to the edge', () => {
    const point = projectToCanvas(HERE, metresAway(DRAWN_RADIUS_METRES / 2, 0), CANVAS);

    expect(point.y).toBeCloseTo(CENTRE / 2, 4);
  });

  it('draws at 122 metres, the radius measured against the path budget', () => {
    expect(DRAWN_RADIUS_METRES).toBe(122);
  });
});

describe('the qibla ray', () => {
  it('points straight up for a qibla due north', () => {
    const end = rayEndpoint(0, CANVAS);

    expect(end.x).toBeCloseTo(CENTRE, 6);
    expect(end.y).toBeCloseTo(0, 6);
  });

  // Every quarter turn, so a swapped sine and cosine or an inverted axis cannot pass
  it.each([
    [90, CANVAS, CENTRE],
    [180, CENTRE, CANVAS],
    [270, 0, CENTRE],
  ])('points to the canvas edge for a qibla at %s degrees', (bearing, x, y) => {
    const end = rayEndpoint(bearing, CANVAS);

    expect(end.x).toBeCloseTo(x, 6);
    expect(end.y).toBeCloseTo(y, 6);
  });

  it("draws London's qibla down and to the right, which is where south east is", () => {
    const end = rayEndpoint(119, CANVAS);

    expect(end.x).toBeGreaterThan(CENTRE);
    expect(end.y).toBeGreaterThan(CENTRE);
  });

  it('draws the ray at exactly the bearing it is given', () => {
    const end = rayEndpoint(119, CANVAS);
    const drawn = (Math.atan2(end.x - CENTRE, CENTRE - end.y) * 180) / Math.PI;

    expect(drawn).toBeCloseTo(119, 6);
  });

  it('reaches the same distance whatever the bearing', () => {
    const north = rayEndpoint(0, CANVAS);
    const oblique = rayEndpoint(119, CANVAS);

    expect(Math.hypot(oblique.x - CENTRE, oblique.y - CENTRE)).toBeCloseTo(
      Math.hypot(north.x - CENTRE, north.y - CENTRE),
      6
    );
  });
});
