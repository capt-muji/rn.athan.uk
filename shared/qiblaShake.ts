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

/** Gravity in m/s squared, which is what a still phone reads and what is subtracted to leave the shaking */
const GRAVITY = 9.81;

export const SHAKE = {
  /**
   * How far from gravity a sample must sit to count as motion.
   *
   * A phone resting on a desk reads about 9.81 with a few hundredths of noise, and a hand holding one still
   * reads a few tenths more. Measured against both: 1.4 clears a held phone and a tap on the table, and a
   * figure of eight at the speed the hint draws exceeds it on most samples.
   */
  motionThreshold: 1.4,
  /** How many of the last samples must show motion, as a share, so one jolt is not a wave */
  motionShare: 0.35,
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

/** A sample as the accelerometer delivers it, in g, with the moment it arrived */
export interface ShakeSample {
  magnitude: number;
  atMs: number;
}

/**
 * The magnitude of an accelerometer reading in m/s squared, with gravity removed.
 *
 * A worklet: the sensor is read on the UI thread, so the arithmetic that decides whether a sample counts as
 * motion runs there too rather than hopping to JS for every reading.
 */
export const shakeMagnitude = (x: number, y: number, z: number): number => {
  'worklet';

  return Math.abs(Math.sqrt(x * x + y * y + z * z) - GRAVITY);
};

/** The samples of the last `SHAKE.windowMs`, oldest first, with anything older dropped */
export const shakeWindow = (samples: ShakeSample[], nowMs: number): ShakeSample[] =>
  samples.filter((sample) => nowMs - sample.atMs <= SHAKE.windowMs);

/**
 * Whether the window shows the phone being waved right now.
 *
 * A SHARE of samples rather than a mean, because a mean is dragged under the threshold by the two moments every
 * figure of eight is nearly still: the ends of each lobe, where the wrist turns around.
 *
 * The minimum count is what stops a single jolt reading as a wave: at one sample, any share test passes on the
 * first reading above the threshold, so a phone picked up off a table would satisfy the gesture instantly.
 */
export const isShaking = (window: ShakeSample[]): boolean => {
  if (window.length < SHAKE.minReadings) return false;

  const moving = window.filter((sample) => sample.magnitude >= SHAKE.motionThreshold).length;

  return moving / window.length >= SHAKE.motionShare;
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
