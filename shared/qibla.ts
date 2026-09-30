export interface Position {
  latitude: number;
  longitude: number;
}

/**
 * Independently sourced rather than taken from a library, because this is the one number the app must never get wrong.
 * Five sources agree to 8.27 m, the strongest being OpenStreetMap's surveyed footprint of the building, which is 0.34
 * arcseconds of bearing from London.
 */
export const KAABA: Position = { latitude: 21.4225, longitude: 39.8262 };

const FULL_TURN = 360;
const HALF_TURN = 180;
const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * The initial great-circle bearing from one position to another
 *
 * Initial, because a great circle's bearing changes along its length: this is the direction to set off in, never one to
 * hold. Measured, London already reads 120.330 a thirty-second of the way to the Kaaba against 118.876 at the start.
 *
 * @param from Where the bearing is measured from
 * @param to Where it points at
 * @returns The bearing in degrees clockwise from true north, in [0, 360)
 */
export const bearingTo = (from: Position, to: Position): number => {
  const fromLatitude = from.latitude * DEGREES_TO_RADIANS;
  const toLatitude = to.latitude * DEGREES_TO_RADIANS;
  const longitudeSpan = (to.longitude - from.longitude) * DEGREES_TO_RADIANS;

  const east = Math.sin(longitudeSpan) * Math.cos(toLatitude);
  const north =
    Math.cos(fromLatitude) * Math.sin(toLatitude) -
    Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(longitudeSpan);

  return normaliseHeading(Math.atan2(east, north) / DEGREES_TO_RADIANS);
};

/**
 * The initial great-circle bearing from a position to the Kaaba
 *
 * Great circle, never rhumb line: the two disagree by 71 degrees in Los Angeles, and the rhumb line is what puts a
 * quarter of the shipped qibla apps at a wrong answer.
 *
 * @param position Where the phone is standing
 * @returns The bearing in degrees clockwise from true north, in [0, 360)
 */
export const qiblaBearing = (position: Position): number => bearingTo(position, KAABA);

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
