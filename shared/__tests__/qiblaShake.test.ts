/**
 * Whether the user actually waved the phone: that a still phone never counts, that a waved one does, and that
 * progress is credited for motion rather than for waiting
 */

import { isShaking, SHAKE, shakeMagnitude, shakeProgress, shakeWindow } from '@/shared/qiblaShake';

/** A run of samples all at one magnitude, which is what a phone nobody is touching delivers */
const run = (magnitude: number, count: number, startMs = 0, stepMs = 20) =>
  Array.from({ length: count }, (_, index) => ({ magnitude, atMs: startMs + index * stepMs }));

/**
 * A run that SWINGS by `swing` either side of a resting value, which is what a waved phone delivers.
 *
 * `resting` is the platform's own still reading: about 0 on Android, where gravity is already removed, and
 * about 9.81 on iOS, where it is not. Every wave here is run at both, because the gate must not care.
 */
const waving = (swing: number, count: number, resting = 0, startMs = 0, stepMs = 20) =>
  Array.from({ length: count }, (_, index) => ({
    magnitude: resting + swing * Math.sin((index / 4) * Math.PI),
    atMs: startMs + index * stepMs,
  }));

describe('shakeMagnitude, what one accelerometer reading says about motion', () => {
  it('is the strength of the reading, however it is spread across the axes', () => {
    expect(shakeMagnitude(0, 0, 9.81)).toBeCloseTo(9.81, 5);
    expect(shakeMagnitude(9.81, 0, 0)).toBeCloseTo(9.81, 5);
    expect(shakeMagnitude(0, -9.81, 0)).toBeCloseTo(9.81, 5);
  });

  // The owner's phone sits tilted on a desk, so gravity is split across two axes rather than sitting on one
  it('reads a tilted phone the same as a flat one, because only the total matters', () => {
    const tilted = 9.81 / Math.SQRT2;

    expect(shakeMagnitude(tilted, tilted, 0)).toBeCloseTo(9.81, 5);
  });

  /**
   * THE DEFECT THIS PINS, found on the owner's 3T with the phone untouched on a desk: Reanimated's
   * ACCELEROMETER is a DIFFERENT SENSOR on each platform. Android gives `TYPE_LINEAR_ACCELERATION`, gravity
   * already removed, so a still phone reads about 0; iOS passes `CMAccelerometerData` through, so a still
   * phone reads about 9.81. Subtracting a gravity constant is therefore correct on iOS and inverted on
   * Android, where it made a still phone read 9.81 of motion and satisfy the whole gesture by itself.
   *
   * So the magnitude keeps gravity, whether or not it was ever there, and the gate reads how much it VARIES.
   */
  it('leaves a still phone reading a CONSTANT on either platform, which is what the gate needs', () => {
    const androidStill = [shakeMagnitude(0, 0, 0), shakeMagnitude(0.01, 0, 0.01)];
    const iosStill = [shakeMagnitude(0, 0, 9.81), shakeMagnitude(0.01, 0, 9.8)];

    expect(androidStill[1] - androidStill[0]).toBeLessThan(SHAKE.motionThreshold);
    expect(iosStill[1] - iosStill[0]).toBeLessThan(SHAKE.motionThreshold);
  });
});

describe('shakeWindow, the samples a decision is made from', () => {
  it('keeps the samples inside its own span and drops what is older', () => {
    const nowMs = 2000;
    const samples = [
      { magnitude: 3, atMs: nowMs - SHAKE.windowMs * 2 },
      { magnitude: 3, atMs: nowMs - SHAKE.windowMs / 2 },
      { magnitude: 3, atMs: nowMs },
    ];

    expect(shakeWindow(samples, nowMs)).toHaveLength(2);
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

  // THE DEFECT THIS WHOLE MODULE EXISTS FOR, and it shipped once: a phone sitting untouched on the owner's
  // desk satisfied the entire gesture, because on Android a still reading is 0 and the old test measured
  // distance from 9.81. Both platforms' resting values are run here, so neither can pass by sitting there
  it.each([
    ['Android, gravity already removed', 0],
    ['iOS, gravity included', 9.81],
  ])('says no for a phone lying still on %s', (_platform, resting) => {
    expect(isShaking(run(resting, 60))).toBe(false);
  });

  it.each([
    ['Android', 0],
    ['iOS', 9.81],
  ])('says no for a phone merely held in a hand on %s, which is never perfectly still', (_platform, resting) => {
    expect(isShaking(waving(0.2, 60, resting))).toBe(false);
  });

  it.each([
    ['Android', 0],
    ['iOS', 9.81],
  ])('says yes for a phone being waved on %s', (_platform, resting) => {
    expect(isShaking(waving(4, 60, resting))).toBe(true);
  });

  // A figure of eight is nearly still twice a lap, at the ends of each lobe, where the wrist turns around
  it('says yes for a wave that pauses at the ends of each lobe', () => {
    const lobe = [...waving(5, 12), ...run(0, 8, 240)];

    expect(isShaking(lobe)).toBe(true);
  });

  // LITERALS, not SHAKE.minReadings: reading the constant on both sides makes the test follow whatever the
  // constant says, so lowering it to 1 would pass and a single jolt would ship counting as a wave
  it('says no to a single hard jolt, which is a phone picked up rather than waved', () => {
    expect(isShaking(waving(8, 1))).toBe(false);
    expect(isShaking(waving(8, 3))).toBe(false);
  });

  it('says yes once a real wave has had time to show itself', () => {
    expect(isShaking(waving(4, 12))).toBe(true);
  });

  // The whole point of measuring SPREAD: a reading's own size says nothing about motion, because the size of a
  // resting reading is the platform's choice rather than the user's
  it('cares how much the reading moves, never how large it is', () => {
    expect(isShaking(run(100, 60))).toBe(false);
    expect(isShaking(waving(4, 60))).toBe(true);
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
  // The owner's own number: 🐋  "let's do it for 500 milliseconds, so half a second... just so it can be much quicker"
  it('asks for half a second of waving', () => {
    expect(SHAKE.requiredMs).toBe(500);
  });

  // A window outliving the requirement would keep crediting motion from samples the user has stopped producing,
  // so a wave shorter than the gate asks for could finish it on stale readings alone
  it('measures over a window shorter than the wave it asks for', () => {
    expect(SHAKE.windowMs).toBeLessThan(SHAKE.requiredMs);
  });

  // The accelerometer is read at 20ms, so the window must still hold enough samples to clear its own minimum
  it('holds enough readings in its window to make a decision at all', () => {
    expect(SHAKE.windowMs / 20).toBeGreaterThanOrEqual(SHAKE.minReadings);
  });

  it('sets its motion threshold above a held phone and below a wave', () => {
    expect(SHAKE.motionThreshold).toBeGreaterThan(0.5);
    expect(SHAKE.motionThreshold).toBeLessThan(3);
  });

  // Neither platform's resting reading may be mistaken for a wave, and they sit about 9.81 apart
  it('judges motion by a spread small enough to be reached by a hand and larger than sensor noise', () => {
    expect(isShaking(run(0, 60))).toBe(false);
    expect(isShaking(run(9.81, 60))).toBe(false);
  });
});
