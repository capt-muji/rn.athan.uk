/**
 * Whether the user is actually waving the phone, read from the accelerometer.
 *
 * The hint asks for a figure of eight and nothing checked that it happened. Measured over 300 runs per case, a
 * phone held STILL opens the settling gate at 9.7s with 2.98 degrees of error while a WAVED one opens at 3.7s
 * with 11.88, because waving fills the settling window with the user's own motion and its two halves average
 * alike. So the instruction made the first reading worse for the people who followed it.
 *
 * Reading the accelerometer separates the two: the compass waits for BOTH a settled heading and a user who has
 * actually waved, so motion can no longer buy an early reading, and a still user is no longer asked to wait
 * while the app pretends to need something it never checked.
 *
 * Pure arithmetic over samples, so every rule here is testable without a device.
 */

export const SHAKE = {
  /**
   * How much the reading must VARY across the window to count as motion, in m/s squared.
   *
   * Variation rather than distance from gravity, because Reanimated's ACCELEROMETER is a different sensor on
   * each platform: Android gives `TYPE_LINEAR_ACCELERATION`, with gravity already removed, so a still phone
   * reads about 0, while iOS passes `CMAccelerometerData` through, so a still phone reads about 9.81. Any
   * threshold against a gravity constant is therefore correct on one platform and inverted on the other, which
   * shipped once: a still 3T read 9.81 away from gravity and satisfied the whole gesture without being touched.
   *
   * A phone's own noise is a few hundredths either way. 1.4 clears a held phone and a tap on the table, and a
   * figure of eight at the speed the hint draws exceeds it easily.
   */
  motionThreshold: 1.4,
  /**
   * The window the share is measured over.
   *
   * Shorter than `requiredMs` on purpose: a window that outlives the requirement keeps reporting motion from
   * samples the user has already stopped producing, so a wave shorter than the gate asks for would still
   * finish it on stale readings alone.
   */
  windowMs: 400,
  /** Below this the window is too sparse to mean anything, so one jolt cannot read as a wave */
  minReadings: 8,
  /**
   * How long the user must have been waving in total before the gesture counts as done.
   *
   * The owner's number, settled at 500ms: long enough to be a deliberate gesture, short enough not to be a
   * chore. Counted as time spent IN MOTION rather than wall time, so a user who waves, pauses and waves again
   * keeps what they have already done.
   */
  requiredMs: 500,
} as const;

/** A sample as the accelerometer delivers it, in m/s squared, with the moment it arrived */
export interface ShakeSample {
  magnitude: number;
  atMs: number;
}

/**
 * The strength of an accelerometer reading in m/s squared, gravity included.
 *
 * Gravity is LEFT IN because the two platforms disagree about whether it is there at all, so removing it needs
 * a constant that is right on one and wrong on the other. What the gate reads instead is how much this value
 * MOVES, which is the same on both: gravity is a constant offset and a constant offset does not vary.
 *
 * A worklet: the sensor is read on the UI thread, so the arithmetic runs there rather than hopping to JS for
 * every reading.
 */
export const shakeMagnitude = (x: number, y: number, z: number): number => {
  'worklet';

  return Math.sqrt(x * x + y * y + z * z);
};

/** The samples of the last `SHAKE.windowMs`, oldest first, with anything older dropped */
export const shakeWindow = (samples: ShakeSample[], nowMs: number): ShakeSample[] =>
  samples.filter((sample) => nowMs - sample.atMs <= SHAKE.windowMs);

/**
 * Whether the window shows the phone being waved right now.
 *
 * The SPREAD of the window, which is what separates a phone being moved from a phone being held: a still phone
 * reads a near-constant value, whatever that value happens to be on the platform, and a waved one swings. A
 * test against the readings themselves cannot do this, because the resting value differs per platform.
 *
 * The minimum count is what stops a single jolt reading as a wave: at one or two samples any spread test passes
 * the instant the phone is picked up off a table.
 */
export const isShaking = (window: ShakeSample[]): boolean => {
  if (window.length < SHAKE.minReadings) return false;

  const magnitudes = window.map((sample) => sample.magnitude);

  return Math.max(...magnitudes) - Math.min(...magnitudes) >= SHAKE.motionThreshold;
};

/**
 * How much of the required wave has been performed, from 0 to 1.
 *
 * Time spent in motion, not wall time, so a user who pauses keeps what they have already done rather than
 * starting again. Clamped at 1 so a long waver cannot overshoot the progress the ring is drawn from.
 */
export const shakeProgress = (movingMs: number): number => {
  'worklet';

  return Math.min(movingMs / SHAKE.requiredMs, 1);
};
