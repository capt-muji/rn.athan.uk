/**
 * Whether the heading stream has CONVERGED, so the compass never draws a cold fusion's first guess.
 *
 * The owner's symptom: the same phone at the same spot answers 5 to 30 degrees differently on each app
 * restart. A fused heading arms cold and walks toward the truth, and the app was drawing the first step of
 * that walk. Measured, the first reading is about 30 degrees out where the converged one is 0.71.
 *
 * DRIFT is the test, never spread: a stream still converging is quiet between consecutive readings, so a
 * spread gate passes it at 27 degrees of error. Drift asks whether the window's own mean is still moving,
 * which is what convergence means.
 *
 * The window is counted in TIME and must be SPANNED. Counting readings alone needs 120 seconds on a still
 * phone, because the platform suppresses anything within 2 degrees of the last reading; and a window that
 * holds enough readings without spanning its period measures a 400ms slice of a slow convergence and opens
 * at full error.
 */

/** Long enough for a cold fusion to show its drift, short enough that the user is not left waiting */
export const SETTLE_WINDOW_MS = 3000;

/** Below this the window is too sparse to mean anything, however long it has been open */
export const SETTLE_MIN_READINGS = 8;

/** The window's two halves must agree within this for the stream to count as no longer moving */
export const SETTLE_DRIFT_DEGREES = 1.5;

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

/** A reading as the watch delivers it, with the moment it arrived */
export interface HeadingSample {
  degrees: number;
  atMs: number;
}

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

/** The samples of the last `SETTLE_WINDOW_MS`, oldest first, with anything older dropped */
export const trailingWindow = (samples: HeadingSample[], nowMs: number): HeadingSample[] =>
  samples.filter((sample) => nowMs - sample.atMs <= SETTLE_WINDOW_MS);

/**
 * Whether a reopen has met the SAME stream it left, so the settling wait would only re-prove what it proved.
 *
 * A reopen cannot be trusted because it happened recently: the fusion may have been reset and the phone may
 * have been carried or turned. So the remembered heading is VERIFIED against live readings instead.
 */
export const isWarmStream = (readings: number[], rememberedDegrees: number): boolean => {
  if (readings.length < WARM_CONFIRM_READINGS) return false;

  const recent = readings.slice(-WARM_CONFIRM_READINGS);

  return Math.abs(headingDelta(circularMean(recent), rememberedDegrees)) <= WARM_TOLERANCE_DEGREES;
};

/**
 * Whether the window has converged: enough readings, spanning enough time, whose two halves agree.
 *
 * The span check is load-bearing. Without it a fast stream fills the count in 400ms and a drift measured
 * over 400ms of an 8-second convergence passes at 29 degrees of error rather than 10.
 */
export const hasSettled = (window: HeadingSample[], nowMs: number): boolean => {
  if (window.length < SETTLE_MIN_READINGS) return false;
  if (nowMs - window[0].atMs < SETTLE_WINDOW_MS * 0.9) return false;

  const half = Math.floor(window.length / 2);
  const older = circularMean(window.slice(0, half).map((sample) => sample.degrees));
  const newer = circularMean(window.slice(half).map((sample) => sample.degrees));

  return Math.abs(headingDelta(newer, older)) <= SETTLE_DRIFT_DEGREES;
};
