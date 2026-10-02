/**
 * Whether the user actually waved the phone: that a still phone never counts, that a waved one does, and that
 * progress is credited for motion rather than for waiting
 */

import { isShaking, SHAKE, shakeMagnitude, shakeProgress, shakeWindow } from '@/shared/qiblaShake';

/** A run of samples all at one magnitude, spaced the way the sensor delivers them */
const run = (magnitude: number, count: number, startMs = 0, stepMs = 20) =>
  Array.from({ length: count }, (_, index) => ({ magnitude, atMs: startMs + index * stepMs }));

describe('shakeMagnitude, what one accelerometer reading says about motion', () => {
  // A phone lying on a desk reads gravity alone on one axis, which must come out as no motion at all
  it('reads a phone at rest as still, whichever way up it is', () => {
    expect(shakeMagnitude(0, 0, 9.81)).toBeCloseTo(0, 5);
    expect(shakeMagnitude(9.81, 0, 0)).toBeCloseTo(0, 5);
    expect(shakeMagnitude(0, -9.81, 0)).toBeCloseTo(0, 5);
  });

  // The owner's phone sits tilted on a desk with a ring attachment, so gravity is split across two axes
  it('reads a tilted phone as still, because only the total matters', () => {
    const tilted = 9.81 / Math.SQRT2;

    expect(shakeMagnitude(tilted, tilted, 0)).toBeCloseTo(0, 5);
  });

  it('grows with how hard the phone is moved, in either direction', () => {
    expect(shakeMagnitude(0, 0, 14)).toBeCloseTo(4.19, 2);
    expect(shakeMagnitude(0, 0, 5)).toBeCloseTo(4.81, 2);
  });
});

describe('shakeWindow, the samples a decision is made from', () => {
  it('keeps the samples inside its own span and drops what is older', () => {
    const samples = [
      { magnitude: 3, atMs: 0 },
      { magnitude: 3, atMs: 1000 },
      { magnitude: 3, atMs: 2000 },
    ];

    expect(shakeWindow(samples, 2000)).toHaveLength(2);
  });

  it('keeps a sample exactly on its own boundary, so the window never flickers', () => {
    expect(shakeWindow([{ magnitude: 3, atMs: 0 }], SHAKE.windowMs)).toHaveLength(1);
  });

  it('answers empty when nothing has arrived yet', () => {
    expect(shakeWindow([], 500)).toHaveLength(0);
  });
});

describe('isShaking, whether the phone is being waved right now', () => {
  it('says no before any reading has arrived', () => {
    expect(isShaking([])).toBe(false);
  });

  // The defect this whole module exists for: a phone sitting on a magnetic desk must never satisfy the gesture
  it('says no for a phone lying still', () => {
    expect(isShaking(run(0.02, 60))).toBe(false);
  });

  it('says no for a phone merely held in a hand, which is never perfectly still', () => {
    expect(isShaking(run(0.4, 60))).toBe(false);
  });

  it('says yes for a phone being waved', () => {
    expect(isShaking(run(4, 60))).toBe(true);
  });

  // A figure of eight is nearly still twice a lap, at the ends of each lobe, so a MEAN would be dragged under
  // the threshold by exactly the gesture being asked for
  it('says yes for a wave that pauses at the ends of each lobe', () => {
    const lobe = [...run(5, 20), ...run(0.1, 20, 400)];

    expect(isShaking(lobe)).toBe(true);
  });

  it('says no when only a moment of the window moved, so one jolt is not a wave', () => {
    const jolt = [...run(6, 4), ...run(0.1, 56, 80)];

    expect(isShaking(jolt)).toBe(false);
  });

  // LITERALS, not SHAKE.minReadings: reading the constant on both sides makes the test follow whatever the
  // constant says, so lowering it to 1 would pass and a single jolt would ship counting as a wave
  it('says no to a single hard jolt, which is a phone picked up rather than waved', () => {
    expect(isShaking(run(8, 1))).toBe(false);
    expect(isShaking(run(8, 3))).toBe(false);
  });

  it('says yes once a real wave has had time to show itself', () => {
    expect(isShaking(run(4, 12))).toBe(true);
  });

  it('decides on the share of the window that moved rather than its length', () => {
    const short = run(4, SHAKE.minReadings);
    const long = run(4, 60);

    expect(isShaking(short)).toBe(isShaking(long));
  });
});

describe('shakeProgress, how far through the asked-for wave the user is', () => {
  it('starts at nothing', () => {
    expect(shakeProgress(0)).toBe(0);
  });

  it('reaches the whole way at the time the owner asked for', () => {
    expect(shakeProgress(SHAKE.requiredMs)).toBe(1);
  });

  it('reports half way at half the time', () => {
    expect(shakeProgress(SHAKE.requiredMs / 2)).toBeCloseTo(0.5, 5);
  });

  // The ring is drawn from this, and a value past 1 would draw it past itself
  it('never reports past the whole way, however long the user waves', () => {
    expect(shakeProgress(SHAKE.requiredMs * 10)).toBe(1);
  });
});

describe('the thresholds the gesture is judged by', () => {
  // The owner's own number, counted on his phone: "Have the user shake it for 3 seconds. Maximum 3 seconds."
  it('asks for three seconds of waving', () => {
    expect(SHAKE.requiredMs).toBe(3000);
  });

  it('sets its motion threshold above a held phone and below a wave', () => {
    expect(SHAKE.motionThreshold).toBeGreaterThan(0.5);
    expect(SHAKE.motionThreshold).toBeLessThan(3);
  });

  it('asks for a minority of the window to be moving, because a wave rests twice a lap', () => {
    expect(SHAKE.motionShare).toBeGreaterThan(0);
    expect(SHAKE.motionShare).toBeLessThan(0.5);
  });
});
