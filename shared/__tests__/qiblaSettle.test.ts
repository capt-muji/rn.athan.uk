/**
 * When the heading stream counts as converged, so the compass never draws a cold fusion's first guess
 */

import {
  circularMean,
  type HeadingSample,
  hasSettled,
  headingDelta,
  isWarmStream,
  SETTLE_DRIFT_DEGREES,
  SETTLE_MIN_READINGS,
  SETTLE_WINDOW_MS,
  trailingWindow,
  WARM_CONFIRM_READINGS,
  WARM_TOLERANCE_DEGREES,
} from '../qiblaSettle';

/** A window of `count` readings spread evenly across the full period, all at `degrees` */
const steady = (degrees: number, count: number, spanMs = SETTLE_WINDOW_MS): HeadingSample[] =>
  Array.from({ length: count }, (_, i) => ({ degrees, atMs: (i * spanMs) / (count - 1) }));

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

describe('trailingWindow', () => {
  it('drops a reading older than the window and keeps one exactly on its edge', () => {
    const samples: HeadingSample[] = [
      { degrees: 100, atMs: 0 },
      { degrees: 110, atMs: 1000 },
      { degrees: 120, atMs: 4000 },
    ];

    expect(trailingWindow(samples, 4000)).toEqual([
      { degrees: 110, atMs: 1000 },
      { degrees: 120, atMs: 4000 },
    ]);
  });
});

describe('hasSettled', () => {
  it('refuses a window holding one reading fewer than the minimum', () => {
    const window = steady(118.99, SETTLE_MIN_READINGS - 1);

    expect(hasSettled(window, SETTLE_WINDOW_MS)).toBe(false);
  });

  it('accepts a steady window holding exactly the minimum', () => {
    const window = steady(118.99, SETTLE_MIN_READINGS);

    expect(hasSettled(window, SETTLE_WINDOW_MS)).toBe(true);
  });

  it('refuses a window with enough readings that does not SPAN the period, however steady it looks', () => {
    // The trap the probes caught: a fast stream fills the count in a fraction of the window, and a drift
    // measured over that fraction of a slow convergence passes at 29 degrees of error rather than 10
    const window = steady(118.99, SETTLE_MIN_READINGS + 4, 400);

    expect(hasSettled(window, 400)).toBe(false);
  });

  it('accepts a window spanning nine tenths of the period, which is the stated tolerance', () => {
    const window = steady(118.99, SETTLE_MIN_READINGS, SETTLE_WINDOW_MS * 0.9);

    expect(hasSettled(window, SETTLE_WINDOW_MS * 0.9)).toBe(true);
  });

  it('refuses a stream still converging, because its two halves disagree', () => {
    // 30 degrees of cold error decaying across the window: quiet between readings, still moving overall
    const window: HeadingSample[] = Array.from({ length: 12 }, (_, i) => ({
      degrees: 118.99 + 30 * Math.exp(-i / 4),
      atMs: (i * SETTLE_WINDOW_MS) / 11,
    }));

    expect(hasSettled(window, SETTLE_WINDOW_MS)).toBe(false);
  });

  it('accepts a window whose halves differ by exactly the drift threshold', () => {
    const window: HeadingSample[] = Array.from({ length: 8 }, (_, i) => ({
      degrees: i < 4 ? 118 : 118 + SETTLE_DRIFT_DEGREES,
      atMs: (i * SETTLE_WINDOW_MS) / 7,
    }));

    expect(hasSettled(window, SETTLE_WINDOW_MS)).toBe(true);
  });

  it('refuses a window whose halves differ by just over the drift threshold', () => {
    const window: HeadingSample[] = Array.from({ length: 8 }, (_, i) => ({
      degrees: i < 4 ? 118 : 118 + SETTLE_DRIFT_DEGREES + 0.2,
      atMs: (i * SETTLE_WINDOW_MS) / 7,
    }));

    expect(hasSettled(window, SETTLE_WINDOW_MS)).toBe(false);
  });

  it('settles across north, where a plain mean of each half would read south and refuse', () => {
    const window: HeadingSample[] = Array.from({ length: 8 }, (_, i) => ({
      degrees: i % 2 === 0 ? 359.5 : 0.5,
      atMs: (i * SETTLE_WINDOW_MS) / 7,
    }));

    expect(hasSettled(window, SETTLE_WINDOW_MS)).toBe(true);
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
