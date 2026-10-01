/**
 * When the phone is on the line to Makkah, and when that earns the one haptic tap a blind user feels
 */

import {
  ALIGNMENT_ENTER_DEGREES,
  ALIGNMENT_EXIT_DEGREES,
  alignmentOffset,
  isAligned,
  shouldTap,
} from '@/shared/qiblaAlignment';

const LONDON_QIBLA = 118.876;

/** Walks a run of headings exactly as the hook does, carrying the aligned flag, and counts the taps */
const tapsOver = (headings: number[], bearing: number): number => {
  let wasAligned = false;
  let taps = 0;

  for (const heading of headings) {
    const nowAligned = isAligned(alignmentOffset(heading, bearing), wasAligned);
    if (shouldTap(wasAligned, nowAligned)) taps++;
    wasAligned = nowAligned;
  }

  return taps;
};

/** The same walk against a SINGLE threshold, which is the buzz the owner refuses */
const tapsWithOneThreshold = (headings: number[], bearing: number): number => {
  let wasAligned = false;
  let taps = 0;

  for (const heading of headings) {
    const nowAligned = Math.abs(alignmentOffset(heading, bearing)) <= ALIGNMENT_ENTER_DEGREES;
    if (!wasAligned && nowAligned) taps++;
    wasAligned = nowAligned;
  }

  return taps;
};

/** A deterministic wobble around a centre, standing in for a sensor that never reports the same angle twice */
const jitterAround = (centre: number, samples: number): number[] =>
  Array.from({ length: samples }, (_, index) => centre + Math.sin(index * 1.7) * 0.3);

describe('the turn to the qibla', () => {
  // Both directions, across north, and the exact half turn
  it.each([
    [110, 118, 8],
    [126, 118, -8],
    [350, 10, 20],
    [10, 350, -20],
    [0, 180, 180],
  ])('reads a heading of %p against a bearing of %p as %p degrees', (heading, bearing, expected) => {
    expect(alignmentOffset(heading, bearing)).toBe(expected);
  });

  it('never answers outside a half turn, so a tap can never fire at the antipode', () => {
    for (let heading = 0; heading < 360; heading++) {
      expect(Math.abs(alignmentOffset(heading, LONDON_QIBLA))).toBeLessThanOrEqual(180);
    }
  });
});

describe('whether the phone is on the line', () => {
  // Derived from the thresholds rather than written as a number, so widening the window cannot silently stale it
  it('needs the tighter angle to arrive and the wider one to leave', () => {
    const between = (ALIGNMENT_ENTER_DEGREES + ALIGNMENT_EXIT_DEGREES) / 2;

    expect(isAligned(between, false)).toBe(false);
    expect(isAligned(between, true)).toBe(true);
  });

  // Each threshold from both sides, at the boundary and just past it
  it.each([
    [ALIGNMENT_ENTER_DEGREES, false, true],
    [ALIGNMENT_ENTER_DEGREES + 0.1, false, false],
    [-ALIGNMENT_ENTER_DEGREES, false, true],
    [ALIGNMENT_EXIT_DEGREES, true, true],
    [ALIGNMENT_EXIT_DEGREES + 0.1, true, false],
    [-ALIGNMENT_EXIT_DEGREES - 0.1, true, false],
  ])('at %p degrees, having been %p, reads %p', (offset, wasAligned, expected) => {
    expect(isAligned(offset, wasAligned)).toBe(expected);
  });

  it('leaves on a wider angle than it arrives on, which is what stops the buzz', () => {
    expect(ALIGNMENT_EXIT_DEGREES).toBeGreaterThan(ALIGNMENT_ENTER_DEGREES);
  });
});

describe('the tap', () => {
  // Only the crossing earns one: holding, leaving and staying away are all silent
  it.each([
    [false, true, true],
    [true, true, false],
    [true, false, false],
    [false, false, false],
  ])('having been %p and now %p, taps: %p', (wasAligned, nowAligned, expected) => {
    expect(shouldTap(wasAligned, nowAligned)).toBe(expected);
  });
});

describe('a real turn, sampled the way the sensor delivers it', () => {
  it('taps once for a turn that crosses the line, even with the phone jittering', () => {
    const sweep: number[] = [];
    for (let offset = -40; offset <= 40; offset += 0.5) {
      sweep.push(LONDON_QIBLA + offset, LONDON_QIBLA + offset + 0.3, LONDON_QIBLA + offset - 0.3);
    }

    expect(tapsOver(sweep, LONDON_QIBLA)).toBe(1);
  });

  it('stays silent while the phone is held on the line and the reading wobbles', () => {
    expect(tapsOver(jitterAround(LONDON_QIBLA, 100), LONDON_QIBLA)).toBe(1);
  });

  // The failure the two thresholds exist to prevent, measured against the one-threshold version on the same samples
  it('taps once where a single threshold would buzz, for a reading wobbling across the boundary', () => {
    const straddling = jitterAround(LONDON_QIBLA + ALIGNMENT_ENTER_DEGREES, 100);

    expect(tapsOver(straddling, LONDON_QIBLA)).toBe(1);
    expect(tapsWithOneThreshold(straddling, LONDON_QIBLA)).toBeGreaterThan(20);
  });

  it('fires once per return, so turning away and back gives exactly two', () => {
    const sweep: number[] = [];
    for (let offset = -40; offset <= 40; offset += 0.5) sweep.push(LONDON_QIBLA + offset);

    expect(tapsOver([...sweep, ...[...sweep].reverse()], LONDON_QIBLA)).toBe(2);
  });

  it('stays silent for a whole turn that never reaches the line', () => {
    const away = Array.from({ length: 80 }, (_, index) => LONDON_QIBLA + 20 + index * 0.5);

    expect(tapsOver(away, LONDON_QIBLA)).toBe(0);
  });

  it('never taps when the phone faces directly away from Makkah', () => {
    const antipode: number[] = [];
    for (let offset = 170; offset <= 190; offset += 0.5) antipode.push(LONDON_QIBLA + offset);

    expect(tapsOver(antipode, LONDON_QIBLA)).toBe(0);
  });

  it('taps twice, not fifty, for two full revolutions', () => {
    const revolutions: number[] = [];
    for (let turn = 0; turn < 2; turn++) {
      for (let heading = 0; heading < 360; heading += 0.5) revolutions.push(heading);
    }

    expect(tapsOver(revolutions, LONDON_QIBLA)).toBe(2);
  });
});
