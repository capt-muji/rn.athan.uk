/**
 * The compass face: where a bearing lands on it, and the tick and label hierarchy it draws
 */

import { DIAL_LABELS, DIAL_TICKS, dialPoint } from '../dialGeometry';

const RADIUS = 100;
/** Both coordinates are irrational at most bearings, so they are compared to within a thousandth of a point */
const PLACES = 3;

describe('a bearing on the dial', () => {
  it('puts north at the top, where SVG counts y downward', () => {
    const { x, y } = dialPoint(0, RADIUS);

    expect(x).toBeCloseTo(0, PLACES);
    expect(y).toBeCloseTo(-RADIUS, PLACES);
  });

  it('turns clockwise, so east is to the right', () => {
    const { x, y } = dialPoint(90, RADIUS);

    expect(x).toBeCloseTo(RADIUS, PLACES);
    expect(y).toBeCloseTo(0, PLACES);
  });

  it('puts south at the bottom', () => {
    const { x, y } = dialPoint(180, RADIUS);

    expect(x).toBeCloseTo(0, PLACES);
    expect(y).toBeCloseTo(RADIUS, PLACES);
  });

  it('puts west to the left', () => {
    const { x, y } = dialPoint(270, RADIUS);

    expect(x).toBeCloseTo(-RADIUS, PLACES);
    expect(y).toBeCloseTo(0, PLACES);
  });

  // The London qibla, which is the bearing the sheet draws today
  it('stays on the circle at a bearing between the cardinals', () => {
    const { x, y } = dialPoint(119, RADIUS);

    expect(Math.hypot(x, y)).toBeCloseTo(RADIUS, PLACES);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
  });

  it('scales with the distance from the centre', () => {
    const near = dialPoint(119, RADIUS / 2);
    const far = dialPoint(119, RADIUS);

    expect(near.x).toBeCloseTo(far.x / 2, PLACES);
    expect(near.y).toBeCloseTo(far.y / 2, PLACES);
  });
});

describe('the dial ticks', () => {
  // 72 is 360/5, which is also the densest a 312pt dial reads comfortably at
  it('marks every five degrees, once each', () => {
    expect(DIAL_TICKS.map((tick) => tick.angle)).toEqual(Array.from({ length: 72 }, (_, index) => index * 5));
  });

  // Garmin's published hierarchy: three weights, never two, which is what reads as an instrument
  it('draws three lengths, longest at the labelled bearings and shortest between the tens', () => {
    const at = (angle: number) => DIAL_TICKS.find((tick) => tick.angle === angle)?.length;

    expect(at(30)).toBeGreaterThan(at(40) as number);
    expect(at(40)).toBeGreaterThan(at(35) as number);
    expect(new Set(DIAL_TICKS.map((tick) => tick.length)).size).toBe(3);
  });

  it('keeps every tick inside the rim', () => {
    const overflowing = DIAL_TICKS.filter((tick) => tick.length <= 0 || tick.length >= 1);

    expect(overflowing).toEqual([]);
  });
});

describe('the dial labels', () => {
  it('labels every thirty degrees, once each', () => {
    expect(DIAL_LABELS.map((label) => label.angle)).toEqual(Array.from({ length: 12 }, (_, index) => index * 30));
  });

  it('names the four cardinals instead of numbering them', () => {
    const textAt = (angle: number) => DIAL_LABELS.find((label) => label.angle === angle)?.text;

    expect([textAt(0), textAt(90), textAt(180), textAt(270)]).toEqual(['N', 'E', 'S', 'W']);
  });

  // Aviation's abbreviation, because three digits every thirty degrees will not fit the arc on the narrowest phone
  it('abbreviates the rest to two digits, keeping the leading zero', () => {
    const textAt = (angle: number) => DIAL_LABELS.find((label) => label.angle === angle)?.text;

    expect([textAt(30), textAt(60), textAt(120), textAt(330)]).toEqual(['03', '06', '12', '33']);
  });

  it('gives every label two characters', () => {
    const wrongLength = DIAL_LABELS.filter((label) => label.text.length !== 2 && !'NESW'.includes(label.text));

    expect(wrongLength).toEqual([]);
  });
});
