/**
 * The wave a phone on Google's fused sensor must be given: what counts as a turn, and how many make a wave
 */

import { type Attitude, advanceWave, hasWaved, type Wave } from '../qiblaWaveGate';

/** A phone lying flat and facing wherever it was facing: the attitude most turns below are measured from */
const FLAT: Attitude = [0, 0, 0, 1];

/** The attitude of a phone turned this many degrees about an axis of its own, away from flat */
const turnedAbout = (axis: readonly [number, number, number], degrees: number): Attitude => {
  const half = (degrees * Math.PI) / 360;
  const length = Math.hypot(...axis);
  const sine = Math.sin(half) / length;

  return [axis[0] * sine, axis[1] * sine, axis[2] * sine, Math.cos(half)];
};

const AXES = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1], diagonal: [1, 1, 1] } as const;

const turned = (axis: keyof typeof AXES, degrees: number): Attitude => turnedAbout(AXES[axis], degrees);

/** One turn made after another: the phone is first at `first`, then turned by `then` from there */
const compose = (first: Attitude, then: Attitude): Attitude => {
  const [ax, ay, az, aw] = first;
  const [bx, by, bz, bw] = then;

  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
};

/** The same attitude as the sensor reports it: in single precision, so a hair longer or shorter than one */
const asSensed = (attitude: Attitude): Attitude =>
  [Math.fround(attitude[0]), Math.fround(attitude[1]), Math.fround(attitude[2]), Math.fround(attitude[3])] as const;

/** Feeds a run of attitudes through the wave, as the sensor would deliver them */
const waveThrough = (attitudes: Attitude[]): Wave | null =>
  attitudes.reduce<Wave | null>((wave, attitude) => advanceWave(wave, attitude), null);

describe('advanceWave', () => {
  it('counts nothing on the first sample, which only fixes where counting starts', () => {
    expect(advanceWave(null, FLAT)).toEqual({ from: FLAT, turns: 0 });
  });

  // degrees turned from flat about the phone's long axis, turns counted. The step is written as literals each side
  // of it, because a test spending the constant it guards moves with it and guards nothing. The last two rows are
  // why one sample is one turn at most: a single leap is not a wave, however far it goes
  it.each([
    [10, 0],
    [29.9, 0],
    [30.1, 1],
    [90, 1],
    [179, 1],
  ])('a phone turned %p degrees from where counting started has made %p turns', (degrees, turns) => {
    expect(waveThrough([FLAT, turned('y', degrees)])?.turns).toBe(turns);
  });

  // A user copying the drawing twists, tilts and swings the phone, so no one kind of motion may be demanded
  it.each(['x', 'y', 'z', 'diagonal'] as const)('counts a turn about the %p axis as it counts any other', (axis) => {
    expect(waveThrough([FLAT, turned(axis, 29.9)])?.turns).toBe(0);
    expect(waveThrough([FLAT, turned(axis, 30.1)])?.turns).toBe(1);
  });

  // A phone is rarely flat when the sheet opens, and a turn measured only from flat would hide an error that
  // depends on where the phone starts
  it.each(['x', 'y', 'z', 'diagonal'] as const)(
    'counts a turn about the %p axis from a phone already tilted',
    (axis) => {
      const held = compose(turned('x', 40), turned('z', 115));

      expect(waveThrough([held, compose(held, turned(axis, 29.9))])?.turns).toBe(0);
      expect(waveThrough([held, compose(held, turned(axis, 30.1))])?.turns).toBe(1);
    }
  );

  it('hands back the very same wave when nothing was counted, so a still phone allocates nothing per sample', () => {
    const wave = advanceWave(null, FLAT);

    expect(advanceWave(wave, turned('x', 29.9))).toBe(wave);
  });

  it('counts the next turn from the attitude it last counted at, not from where the wave began', () => {
    const wave = waveThrough([FLAT, turned('x', 31), turned('x', 60)]);

    // 60 is 29 on from 31, though it is 60 from flat
    expect(wave).toEqual({ from: turned('x', 31), turns: 1 });
  });

  // No two samples here are 30 degrees apart, so a count taken from the previous SAMPLE would stay at zero. Counted
  // from the last counted attitude the turns land at 35, 70 and 105
  it('adds up a slow steady turn that never moves a whole step between two samples', () => {
    const sweep = Array.from({ length: 16 }, (_, sample) => turned('z', sample * 7));

    expect(waveThrough(sweep)?.turns).toBe(3);
  });

  it('has not yet counted the third turn one sample earlier in that sweep', () => {
    const sweep = Array.from({ length: 15 }, (_, sample) => turned('z', sample * 7));

    expect(waveThrough(sweep)?.turns).toBe(2);
  });

  // What must happen when the phone is only shaken lightly. 200 swings of 28 degrees travel 5600 degrees in all,
  // which a count of distance travelled would take for a wave many times over
  it('never counts a wobble that stays inside the step, however long it goes on', () => {
    const wobble = Array.from({ length: 200 }, (_, sample) => (sample % 2 === 0 ? FLAT : turned('x', 28)));

    expect(waveThrough(wobble)?.turns).toBe(0);
  });

  it('takes an attitude and its negative as the one attitude they are', () => {
    const [x, y, z, w] = turned('x', 40);

    expect(waveThrough([turned('x', 40), [-x, -y, -z, -w]])?.turns).toBe(0);
  });
});

describe('advanceWave, on attitudes as the sensor really reports them', () => {
  // A single precision quaternion is not exactly one long, and an angle taken through an arc cosine is not a number
  // for half of them. 200 samples of one still attitude must count nothing
  it('counts nothing for a still phone whose attitude is a hair off unit length', () => {
    const held = asSensed(compose(turned('x', 40), turned('z', 115)));

    expect(waveThrough(Array.from({ length: 200 }, () => held))?.turns).toBe(0);
  });

  it('counts eight turns of a waved phone as eight, in single precision as in double', () => {
    const waved = Array.from({ length: 9 }, (_, sample) => asSensed(turned('y', sample * 31)));

    expect(waveThrough(waved)?.turns).toBe(8);
  });

  // The sensor's own class lets these through. None is an attitude, so none may count as a turn
  const NOT_ATTITUDES: [string, Attitude][] = [
    ['all zeros', [0, 0, 0, 0]],
    ['not a number', [Number.NaN, 0, 0, 1]],
    ['infinite', [Number.POSITIVE_INFINITY, 0, 0, 1]],
    ['five times the length an attitude has', [0, 0, 0, 5]],
    ['a fifth of the length an attitude has', [0, 0, 0, 0.2]],
    ['missing altogether', undefined as unknown as Attitude],
    ['too short to be a quaternion', [0, 1] as unknown as Attitude],
  ];

  it.each(NOT_ATTITUDES)('counts no turn for a reading that is %s', (_name, garbage) => {
    expect(waveThrough([FLAT, garbage, garbage, garbage])).toEqual({ from: FLAT, turns: 0 });
  });

  // Taken as the place to count from, one bad opening sample would cost the visit its whole wave
  it.each(NOT_ATTITUDES)('does not count FROM an opening reading that is %s', (_name, garbage) => {
    expect(waveThrough([garbage])).toBeNull();
    expect(waveThrough([garbage, FLAT, turned('x', 90)])).toEqual({ from: turned('x', 90), turns: 1 });
  });

  it.each(NOT_ATTITUDES)('keeps the turns already counted through a reading that is %s', (_name, garbage) => {
    expect(waveThrough([FLAT, turned('x', 31), garbage, turned('x', 62)])?.turns).toBe(2);
  });
});

describe('advanceWave, on an attitude a little off unit length', () => {
  /** The same attitude, longer or shorter: no sensor should send one, and if one did its ANGLE is what was turned */
  const scaled = (attitude: Attitude, by: number): Attitude =>
    [attitude[0] * by, attitude[1] * by, attitude[2] * by, attitude[3] * by] as const;

  // Judged on the bare dot product, a still phone reporting a quaternion nine tenths as long would count a turn on
  // every sample and open the gate in under a fifth of a second
  it.each([0.9, 1.2])('counts nothing for a still phone whose quaternion is %p times as long', (by) => {
    const held = scaled(compose(turned('x', 40), turned('z', 115)), by);

    expect(waveThrough(Array.from({ length: 50 }, () => held))?.turns).toBe(0);
  });

  it.each([0.9, 1.2])('counts the step at the same angle when the quaternion is %p times as long', (by) => {
    expect(waveThrough([scaled(FLAT, by), scaled(turned('y', 29.9), by)])?.turns).toBe(0);
    expect(waveThrough([scaled(FLAT, by), scaled(turned('y', 30.1), by)])?.turns).toBe(1);
  });
});

describe('hasWaved', () => {
  const waveOf = (turns: number): Wave => ({ from: FLAT, turns });

  it('has seen no wave before the first sample', () => {
    expect(hasWaved(null)).toBe(false);
  });

  // The count as literals, each side of it
  it.each([
    [0, false],
    [7, false],
    [8, true],
    [9, true],
  ])('a phone that has made %p turns has waved: %p', (turns, waved) => {
    expect(hasWaved(waveOf(turns))).toBe(waved);
  });

  it('is reached by eight turns of the phone and not by seven', () => {
    const turns = (count: number) => Array.from({ length: count + 1 }, (_, sample) => turned('y', sample * 31));

    expect(hasWaved(waveThrough(turns(7)))).toBe(false);
    expect(hasWaved(waveThrough(turns(8)))).toBe(true);
  });
});
