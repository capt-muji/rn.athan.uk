/**
 * The compass heading, from the device's own fused orientation sensor.
 *
 * The sensor reports yaw in radians about the vertical axis. Turning that into a compass bearing is
 * three corrections, and each one is a defect when it is left out: the sign and zero convention, the
 * screen's own rotation, and on Android the difference between magnetic and true north.
 *
 * Pure, so every convention is tested against known angles rather than trusted.
 */

const DEGREES_PER_RADIAN = 180 / Math.PI;

/** A bearing is only meaningful in 0 to 360, and every term above can push it outside */
export const normaliseBearing = (degrees: number): number => {
  'worklet';
  return ((degrees % 360) + 360) % 360;
};

/**
 * The compass bearing the phone's top edge points along.
 *
 * `yaw` is Reanimated's own value, which it already negates on Android to match iOS
 * (`ReanimatedSensorListener.kt`), so one conversion serves both platforms.
 *
 * It is NEGATED because that yaw is counterclockwise-positive on both platforms while a compass
 * bearing runs clockwise. Measured on an S23 rather than argued from the sign conventions: turning
 * the phone clockwise drove the uncorrected heading DOWN, 273 to 147, where a compass must climb.
 *
 * `declination` is the angle from magnetic to true north and is ANDROID ONLY: the Android sensor
 * reports magnetic north, while iOS `XTrueNorthZVertical` has already applied it, so passing it on
 * both platforms double-counts it. It is the one correction permitted here, because it comes from
 * the platform's own geomagnetic field rather than from a constant tuned by eye.
 *
 * `interfaceOrientation` is how far the screen itself is rotated, which the sensor does not know.
 */
export const headingFromYaw = (yaw: number, declination = 0, interfaceOrientation = 0): number => {
  'worklet';
  return normaliseBearing(-yaw * DEGREES_PER_RADIAN + declination + interfaceOrientation);
};

/**
 * The declination the platform itself is applying, as the signed short way from magnetic to true.
 *
 * Taken as a difference of two readings the platform already gives rather than from a table of our
 * own, and signed the short way round so a pair either side of north reads as a degree rather than
 * as 359.
 */
export const declinationBetween = (trueHeading: number, magneticHeading: number): number => {
  const difference = normaliseBearing(trueHeading - magneticHeading);

  return difference > 180 ? difference - 360 : difference;
};
