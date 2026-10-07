/**
 * When the compass may be drawn: the phone's own certainty, and a reopen proven warm
 */

import {
  CERTAINTY_CEILING_MS,
  circularMean,
  headingDelta,
  isCertain,
  isWarmStream,
  WARM_CONFIRM_READINGS,
  WARM_TOLERANCE_DEGREES,
} from '../qiblaSettle';

describe('circularMean', () => {
  it('averages headings either side of north to north, where a plain mean gives south', () => {
    expect(circularMean([359, 1])).toBeCloseTo(0, 5);
  });

  it('averages a spread inside one quadrant to its middle', () => {
    expect(circularMean([110, 120, 130])).toBeCloseTo(120, 5);
  });
});

describe('headingDelta', () => {
  // to, from, expected: the short way round, negative left and positive right
  it.each([
    [10, 350, 20],
    [350, 10, -20],
    [118, 118, 0],
    [180, 0, 180],
    [0, 180, 180],
  ])('the turn from %p to %p is %p', (to, from, expected) => {
    expect(headingDelta(to, from)).toBe(expected);
  });
});

describe('isCertain', () => {
  // Before its first report the phone has said nothing, and nothing is not a certainty
  it('takes an absent report as silence, never as certainty', () => {
    expect(isCertain(undefined)).toBe(false);
  });

  // Apple's sentinel for a heading it considers invalid, which a bare comparison would open on
  it('refuses a negative report, which is the phone disowning its own heading', () => {
    expect(isCertain(-1)).toBe(false);
  });

  // reported uncertainty in degrees, whether it is tight enough. The bar is written as literals, each side of it,
  // beside the two readings taken on the owner's iPhone: 12.5 indoors, which must draw, and 25.4 on a cable
  // beside a laptop, which must not
  it.each([
    [0, true],
    [12.5, true],
    [15, true],
    [15.1, false],
    [25.4, false],
  ])('a reported uncertainty of %p degrees is tight enough to draw on: %p', (accuracyDegrees, expected) => {
    expect(isCertain(accuracyDegrees)).toBe(expected);
  });
});

describe('the ceiling', () => {
  // A phone that cannot vouch for its heading must not be drawn sooner than the stopwatch this replaced drew it
  it('is no shorter than the 2700ms wait it replaced, so speed is never bought with accuracy', () => {
    expect(CERTAINTY_CEILING_MS).toBeGreaterThanOrEqual(2700);
  });
});

describe('isWarmStream', () => {
  const steadyReadings = (degrees: number, count = WARM_CONFIRM_READINGS): number[] =>
    Array.from({ length: count }, () => degrees);

  it('refuses a buffer holding one reading fewer than the confirmation needs', () => {
    expect(isWarmStream(steadyReadings(118.99, WARM_CONFIRM_READINGS - 1), 118.99)).toBe(false);
  });

  it('accepts a phone that has not moved since the sheet last drew', () => {
    expect(isWarmStream(steadyReadings(118.99), 118.99)).toBe(true);
  });

  it('accepts readings inside the tolerance', () => {
    expect(isWarmStream(steadyReadings(118.99 + WARM_TOLERANCE_DEGREES - 0.1), 118.99)).toBe(true);
  });

  it('refuses readings just outside the tolerance, so a moved phone pays the full gate', () => {
    expect(isWarmStream(steadyReadings(118.99 + WARM_TOLERANCE_DEGREES + 0.1), 118.99)).toBe(false);
  });

  it.each([5, 15, 40, 90])('refuses a phone turned %p degrees while the sheet was closed', (moved) => {
    expect(isWarmStream(steadyReadings(118.99 + moved), 118.99)).toBe(false);
  });

  it('compares across north, where a plain mean would read half a turn out', () => {
    expect(isWarmStream(steadyReadings(359), 1)).toBe(true);
  });

  it('reads only the most recent readings, so a stale buffer cannot carry a refusal', () => {
    const stale = [...steadyReadings(40, WARM_CONFIRM_READINGS), ...steadyReadings(118.99)];

    expect(isWarmStream(stale, 118.99)).toBe(true);
  });
});
