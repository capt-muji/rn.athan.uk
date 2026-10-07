/**
 * The wave a phone on Google's fused sensor must be given before its compass is drawn.
 *
 * That sensor can sit tens of degrees out until the phone has been turned about, and its own error figure neither
 * moves during a visit nor follows the truth, so the phone cannot be asked how sure it is. The user is asked to
 * wave it instead, and this measures that they did.
 *
 * It is measured from the attitude the heading itself arrives with, because a second sensor reader beside the
 * compass degrades the compass.
 */

/** A phone's orientation as a unit quaternion: x, y, z, w */
export type Attitude = readonly [number, number, number, number];

/** How far a wave has got: the attitude last counted from, and the turns counted so far */
export type Wave = { from: Attitude; turns: number };

/**
 * How far the phone must turn from the last counted attitude for the turn to count.
 *
 * A shake that swings the phone less than this from one end to the other never counts, however long it lasts.
 */
const WAVE_TURN_DEGREES = 30;

/** How many turns complete a wave: 240 degrees of turning in all, which lifting the phone to look at it is not */
const WAVE_TURNS = 8;

const DEGREES = Math.PI / 180;

/** The dot product of two unit quaternions is the cosine of HALF the angle between them, so a turn is judged on it */
const TURN_COSINE_SQUARED = Math.cos((WAVE_TURN_DEGREES * DEGREES) / 2) ** 2;

const dot = (a: Attitude, b: Attitude): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

/**
 * Whether a reading is an attitude at all, which is a quaternion one long.
 *
 * The sensor's own class lets a quaternion of zeros or of infinities through, and a native side out of step with this
 * file could send none. Counted, such a reading would be a turn the phone never made, and counted FROM, it would cost
 * the visit its whole wave, so it is passed over as if it never arrived. The bounds are far looser than the single
 * precision the sensor reports in needs, and far tighter than any of those.
 */
const isAttitude = (reading: Attitude): boolean => {
  if (!Array.isArray(reading)) return false;

  const lengthSquared = dot(reading, reading);

  return lengthSquared > 0.5 && lengthSquared < 2;
};

/**
 * Whether the phone has turned a counted turn between two attitudes, by whichever axis it turned about.
 *
 * Squared, so that a quaternion and its negative, which are one attitude, compare alike. The two lengths are
 * multiplied back in so that a reading a little off unit length is judged on its angle and not on its length.
 */
const hasTurned = (from: Attitude, to: Attitude): boolean => {
  const along = dot(from, to);

  return along * along <= TURN_COSINE_SQUARED * dot(from, from) * dot(to, to);
};

/**
 * Takes one more attitude into the wave.
 *
 * A turn is counted from the last COUNTED attitude rather than the last sample, so the count does not depend on how
 * often the sensor reports: a slow steady turn still adds up, and a wobble never does.
 */
export const advanceWave = (wave: Wave | null, attitude: Attitude): Wave | null => {
  if (!isAttitude(attitude)) return wave;
  if (wave === null) return { from: attitude, turns: 0 };
  if (!hasTurned(wave.from, attitude)) return wave;

  return { from: attitude, turns: wave.turns + 1 };
};

export const hasWaved = (wave: Wave | null): boolean => wave !== null && wave.turns >= WAVE_TURNS;
