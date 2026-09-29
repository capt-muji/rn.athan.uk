import { Coordinates, Qibla } from 'adhan';

export interface Position {
  latitude: number;
  longitude: number;
}

/**
 * The value adhan computes from, restated because adhan keeps it private. `qibla.test.ts` fails if the two ever
 * diverge, since a second source of truth here would bend every bearing by a few thousandths of a degree.
 */
export const KAABA: Position = { latitude: 21.4225241, longitude: 39.8261818 };

const FULL_TURN = 360;
const HALF_TURN = 180;

/**
 * The initial great-circle bearing from a position to the Kaaba
 *
 * Great circle, never rhumb line: the two disagree by 71 degrees in Los Angeles, and the rhumb line is what puts a
 * quarter of the shipped qibla apps at a wrong answer.
 *
 * @param position Where the phone is standing
 * @returns The bearing in degrees clockwise from true north, in [0, 360)
 */
export const qiblaBearing = (position: Position): number => {
  const coordinates = new Coordinates(position.latitude, position.longitude);
  const bearing = Qibla(coordinates);

  return normaliseHeading(bearing);
};

/**
 * A heading as a compass bearing
 *
 * Android's `calcTrueNorth` uses Kotlin's `%`, which keeps the dividend's sign, so it reports a negative heading
 * wherever magnetic declination is negative. Test for the `-1` no-permission sentinel BEFORE calling this.
 *
 * @param heading A heading in degrees, possibly negative or past a full turn
 * @returns The same direction in [0, 360)
 */
export const normaliseHeading = (heading: number): number => {
  'worklet';
  return ((heading % FULL_TURN) + FULL_TURN) % FULL_TURN;
};

/**
 * A compass bearing from the fused rotation sensor's yaw
 *
 * Yaw grows anticlockwise and a bearing grows clockwise, so the sign flips here. What the correction carries differs by
 * platform, which is why the caller supplies it rather than this knowing.
 *
 * @param yaw The sensor's yaw in radians
 * @param correction Degrees to add once the sign is flipped
 * @returns The bearing in degrees clockwise from true north, in [0, 360)
 */
export const headingFromYaw = (yaw: number, correction: number): number => {
  'worklet';
  const degrees = (-yaw * HALF_TURN) / Math.PI;

  return normaliseHeading(degrees + correction);
};

/**
 * The shorter of the two ways round from one bearing to another
 *
 * An exact half turn is the same rotation either way, and resolves clockwise so the needle never depends on the sign
 * of a rounding error.
 *
 * @param from The bearing turned from
 * @param to The bearing turned to
 * @returns The turn in degrees, within (-180, 180], negative anticlockwise
 */
export const shortestDelta = (from: number, to: number): number => {
  'worklet';
  const difference = to - from + HALF_TURN;
  const delta = normaliseHeading(difference) - HALF_TURN;

  return delta === -HALF_TURN ? HALF_TURN : delta;
};

/**
 * The next continuous angle for an animation
 *
 * The animated value must never wrap, because an interpolation runs between the two numbers it is given: handing it a
 * wrapped heading sends the needle the long way round however correct that heading is.
 *
 * @param current The continuous angle the animation holds now
 * @param heading The new heading, in [0, 360)
 * @returns The angle to animate to, which may sit outside [0, 360)
 */
export const unwrapAngle = (current: number, heading: number): number => {
  'worklet';
  return current + shortestDelta(current, heading);
};

/**
 * The next continuous dial angle for a sensor sample
 *
 * One step so the sensor reaction stays a single call: a reaction body is the only code on this path a test cannot
 * reach, because nothing delivers sensor samples off a device.
 *
 * @param current The continuous angle the dial holds now
 * @param yaw The sensor's yaw in radians
 * @param correction Degrees to add once the sign is flipped
 * @returns The angle to animate to, which may sit outside [0, 360)
 */
export const dialAngleFromYaw = (current: number, yaw: number, correction: number): number => {
  'worklet';
  return unwrapAngle(current, headingFromYaw(yaw, correction));
};
