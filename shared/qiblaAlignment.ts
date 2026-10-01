/**
 * When the phone is on the line to Makkah, and when that earns a haptic tap.
 *
 * Two thresholds rather than one: a single threshold fired 49 taps in 100 samples of 0.3-degree jitter, which is the
 * continuous buzz the owner refuses.
 */

/** The owner's window: one degree either side of the bearing, plus the bearing itself */
export const ALIGNMENT_ENTER_DEGREES = 1.5;

/**
 * Twice the enter threshold, so jitter inside the window cannot chatter across the boundary.
 *
 * The RATIO is what suppresses the buzz rather than the absolute value, so narrowing the window to the owner's
 * 3 degrees keeps session 43's proven 2:1 gap.
 */
export const ALIGNMENT_EXIT_DEGREES = 3;

/** The signed turn to the qibla, the short way: negative left, positive right */
export const alignmentOffset = (heading: number, bearing: number): number => {
  const raw = (bearing - heading) % 360;

  if (raw > 180) return raw - 360;
  if (raw <= -180) return raw + 360;
  return raw;
};

/** Whether the user is on the line now, given whether they were */
export const isAligned = (offset: number, wasAligned: boolean): boolean => {
  const away = Math.abs(offset);

  return wasAligned ? away <= ALIGNMENT_EXIT_DEGREES : away <= ALIGNMENT_ENTER_DEGREES;
};

/** Whether this reading earns a tap */
export const shouldTap = (wasAligned: boolean, nowAligned: boolean): boolean => !wasAligned && nowAligned;
