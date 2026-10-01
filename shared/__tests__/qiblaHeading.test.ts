/**
 * The conversion from the fused sensor's yaw to a compass bearing, against known angles
 */

import { declinationBetween, headingFromYaw, normaliseBearing } from '@/shared/qiblaHeading';

const RADIANS_PER_DEGREE = Math.PI / 180;

describe('keeping a bearing inside the circle', () => {
  it.each([
    [0, 0],
    [90, 90],
    [359.9, 359.9],
  ])('leaves %p alone', (input, expected) => {
    expect(normaliseBearing(input)).toBeCloseTo(expected, 6);
  });

  // Every term the conversion adds can push the angle outside, and a compass has no 370 degrees
  it('wraps past a full turn back into the circle', () => {
    expect(normaliseBearing(361)).toBeCloseTo(1, 6);
    expect(normaliseBearing(720)).toBeCloseTo(0, 6);
  });

  it('wraps a negative angle forward rather than leaving it negative', () => {
    expect(normaliseBearing(-1)).toBeCloseTo(359, 6);
    expect(normaliseBearing(-90)).toBeCloseTo(270, 6);
    expect(normaliseBearing(-540)).toBeCloseTo(180, 6);
  });
});

describe('the heading the phone points along', () => {
  // The sensor's yaw runs anticlockwise and a compass bearing runs clockwise, so the conversion negates it
  it.each([
    ['north', 0, 0],
    ['east', -90, 90],
    ['south', -180, 180],
    ['west', -270, 270],
  ])('reads %s as %p degrees', (_name, degrees, expected) => {
    expect(headingFromYaw(degrees * RADIANS_PER_DEGREE)).toBeCloseTo(expected, 4);
  });

  it('converts radians rather than passing the raw sensor value through', () => {
    expect(headingFromYaw(-Math.PI)).toBeCloseTo(180, 6);
    expect(headingFromYaw(-Math.PI / 2)).toBeCloseTo(90, 6);
  });

  it('wraps a yaw that has gone past a full turn', () => {
    expect(headingFromYaw(-(2 * Math.PI + Math.PI / 2))).toBeCloseTo(90, 6);
  });

  it('carries a yaw of the other sign round the circle instead of reporting it negative', () => {
    expect(headingFromYaw(Math.PI / 2)).toBeCloseTo(270, 6);
  });

  /**
   * The regression test for the axis bug, and the only one here taken from hardware rather than from a convention.
   *
   * Measured on an S23 turning clockwise through roughly a quarter turn. A compass bearing MUST climb through that
   * turn; before the fix these same samples fell from 273 to 147, which is what put the dial in reverse.
   */
  it('climbs as the phone turns clockwise, against yaw sampled from a real device', () => {
    const headings = [-1.535, -2.019, -2.502, -3.127, 2.547].map((yaw) => headingFromYaw(yaw));

    for (let index = 1; index < headings.length; index += 1) {
      expect(headings[index]).toBeGreaterThan(headings[index - 1]);
    }
  });
});

describe('the declination term, which is Android only', () => {
  // The Android sensor reports MAGNETIC north; iOS XTrueNorthZVertical has already applied this, so
  // passing it on both platforms would double-count it
  it('turns magnetic north into true north when the platform has not', () => {
    expect(headingFromYaw(0, 1.2)).toBeCloseTo(1.2, 6);
  });

  it('applies nothing by default, which is what iOS needs', () => {
    expect(headingFromYaw(-Math.PI / 2)).toBeCloseTo(90, 6);
  });

  // The alignment window is 1.5 degrees, so a declination of this size is the difference between
  // the gold state firing on the line and firing beside it
  it('moves the reading by the full declination, not a fraction of it', () => {
    const withoutTerm = headingFromYaw(-Math.PI / 2);
    const withTerm = headingFromYaw(-Math.PI / 2, 2);

    expect(withTerm - withoutTerm).toBeCloseTo(2, 6);
  });

  it('wraps when the declination pushes the reading past north', () => {
    expect(headingFromYaw(-359 * RADIANS_PER_DEGREE, 2)).toBeCloseTo(1, 4);
  });

  it('accepts a westward declination, which is negative', () => {
    expect(headingFromYaw(0, -3)).toBeCloseTo(357, 6);
  });
});

describe('reading the declination off the platform\u2019s own two headings', () => {
  // Taken as a difference of readings the platform already gives, never from a table of ours
  it('reports the gap between true and magnetic north', () => {
    expect(declinationBetween(91.2, 90)).toBeCloseTo(1.2, 6);
  });

  it('reports a westward declination as negative', () => {
    expect(declinationBetween(88, 90)).toBeCloseTo(-2, 6);
  });

  it('reports nothing when the platform agrees with itself', () => {
    expect(declinationBetween(90, 90)).toBeCloseTo(0, 6);
  });

  // A pair either side of north differs by a degree, not by 359
  it('takes the short way round when the pair straddles north', () => {
    expect(declinationBetween(1, 359)).toBeCloseTo(2, 6);
    expect(declinationBetween(359, 1)).toBeCloseTo(-2, 6);
  });

  it('stays inside half a turn either way, whatever it is given', () => {
    for (const [trueHeading, magnetic] of [
      [0, 180],
      [180, 0],
      [270, 90],
      [45, 300],
    ]) {
      const declination = declinationBetween(trueHeading, magnetic);

      expect(declination).toBeGreaterThanOrEqual(-180);
      expect(declination).toBeLessThanOrEqual(180);
    }
  });

  // The whole point of reading it: feeding it back must recover true north
  it('corrects a magnetic reading onto true north when fed back in', () => {
    const declination = declinationBetween(119.4, 118.9);

    expect(headingFromYaw(-118.9 * RADIANS_PER_DEGREE, declination)).toBeCloseTo(119.4, 4);
  });
});

describe('the screen\u2019s own rotation, which the sensor cannot see', () => {
  it('adds the interface orientation so a turned screen still reads true', () => {
    expect(headingFromYaw(0, 0, 90)).toBeCloseTo(90, 6);
  });

  it('combines with the declination rather than replacing it', () => {
    expect(headingFromYaw(0, 1, 90)).toBeCloseTo(91, 6);
  });

  it('wraps when the two together pass a full turn', () => {
    expect(headingFromYaw(-350 * RADIANS_PER_DEGREE, 5, 90)).toBeCloseTo(85, 4);
  });
});
