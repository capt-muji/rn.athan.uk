/**
 * When the compass may be drawn.
 *
 * The phone is ASKED how sure it is, because the heading stream cannot say: a fused heading reads just as steady
 * tens of degrees out as it does on the truth, so no test of the stream alone can tell the two apart.
 */

/**
 * How many readings of a reopen must agree with the heading the sheet last drew before it is trusted.
 *
 * Eight is the first count that agreed on every run across every noise level measured, so it is the first that
 * never discards a genuinely warm stream, and at the ~14Hz the platform emits it costs about 420ms.
 */
export const WARM_CONFIRM_READINGS = 8;

/**
 * How far a reopen's readings may sit from the remembered heading and still count as the same stream.
 *
 * Three degrees accepts a phone that has not moved and refuses one carried or turned: five degrees of real
 * movement fails it every time, which is what makes this a measurement rather than an assumption about the OS.
 */
export const WARM_TOLERANCE_DEGREES = 3;

/**
 * The worst uncertainty the phone may report and still have its heading drawn, as a half-angle: fifteen either way.
 *
 * It is the best the hardware can promise rather than a ruling. No source fixes a number, and a tighter bar is a
 * refusal screen: at 5 the gate never fired once, because a phone indoors reports about 12.
 */
const CERTAINTY_THRESHOLD_DEGREES = 15;

/**
 * How long the gate waits for a certainty the phone may never report, because this screen must never lock.
 *
 * No shorter than the 2700ms wait it replaced: a phone that cannot vouch for its heading must not be drawn sooner
 * than it used to be.
 */
export const CERTAINTY_CEILING_MS = 3000;

/**
 * Whether the phone has reported an uncertainty tight enough to draw on.
 *
 * Absence is not certainty, since Android attaches its error cone to some samples only. A NEGATIVE value is Apple's
 * sentinel for a heading it considers invalid, which a bare `<=` would open on.
 */
export const isCertain = (accuracyDegrees: number | undefined): boolean =>
  accuracyDegrees !== undefined && accuracyDegrees >= 0 && accuracyDegrees <= CERTAINTY_THRESHOLD_DEGREES;

const DEGREES = Math.PI / 180;

/** The mean direction of a set of headings, which a plain average gets wrong across north */
export const circularMean = (degrees: number[]): number => {
  let x = 0;
  let y = 0;
  for (const value of degrees) {
    x += Math.cos(value * DEGREES);
    y += Math.sin(value * DEGREES);
  }

  return (Math.atan2(y / degrees.length, x / degrees.length) / DEGREES + 360) % 360;
};

/** The signed turn from one heading to another, the short way round */
export const headingDelta = (to: number, from: number): number => {
  const raw = (to - from) % 360;

  if (raw > 180) return raw - 360;
  if (raw <= -180) return raw + 360;
  return raw;
};

/**
 * Whether a reopen has met the SAME stream it left, so waiting on the phone again would only re-prove it.
 *
 * A reopen cannot be trusted because it happened recently: the fusion may have been reset and the phone may
 * have been carried or turned. So the remembered heading is VERIFIED against live readings instead.
 */
export const isWarmStream = (readings: number[], rememberedDegrees: number): boolean => {
  if (readings.length < WARM_CONFIRM_READINGS) return false;

  const recent = readings.slice(-WARM_CONFIRM_READINGS);

  return Math.abs(headingDelta(circularMean(recent), rememberedDegrees)) <= WARM_TOLERANCE_DEGREES;
};
