import * as Location from 'expo-location';

import logger from '@/shared/logger';
import { normaliseHeading, type Position } from '@/shared/qibla';

/** What `expo-location` reports for a heading it cannot resolve, before any normalisation can hide it */
const NO_HEADING = -1;

/**
 * Whether the compass may open
 *
 * Read at every tap rather than cached: an iOS one-time grant reverts to undetermined on its own, so a remembered
 * "granted" goes stale without anything telling the app.
 *
 * @returns Whether foreground location is granted now
 */
export const hasLocationPermission = async (): Promise<boolean> => {
  try {
    const { granted } = await Location.getForegroundPermissionsAsync();
    return granted;
  } catch (error) {
    logger.error('QIBLA: Failed to read location permissions:', error);
    return false;
  }
};

/**
 * Asks for foreground location
 *
 * @returns Whether the request ended granted
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    return granted;
  } catch (error) {
    logger.error('QIBLA: Failed to request location permissions:', error);
    return false;
  }
};

/**
 * Where the phone is, to city accuracy
 *
 * Balanced accuracy, never Highest: 10 km of position error moves the qibla by half a degree, so precision beyond a
 * city costs battery and buys nothing.
 *
 * @returns The position, or null when it cannot be read
 */
export const readPosition = async (): Promise<Position | null> => {
  try {
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: coords.latitude, longitude: coords.longitude };
  } catch (error) {
    logger.warn('QIBLA: Failed to read position, falling back to the last known one', { error });

    return readLastKnownPosition();
  }
};

/**
 * The fix the phone already had
 *
 * A live read fails indoors and on a phone whose radio is cold, where a fix from minutes ago is still worth far more
 * than nothing: the qibla moves half a degree per 10 km, so a stale city is the same answer as a fresh one.
 *
 * @returns The last known position, or null when the phone holds none
 */
const readLastKnownPosition = async (): Promise<Position | null> => {
  try {
    const last = await Location.getLastKnownPositionAsync();
    if (!last) return null;

    return { latitude: last.coords.latitude, longitude: last.coords.longitude };
  } catch (error) {
    logger.warn('QIBLA: No last known position either', { error });
    return null;
  }
};

/**
 * Streams the phone's heading while the compass is open
 *
 * Android reports a NEGATIVE trueHeading wherever declination is negative, which is indistinguishable from its own -1
 * "not ready" sentinel to anything that merely tests for a negative number. So the sentinel is matched exactly, before
 * normalising.
 *
 * @param onHeading Called with each heading in [0, 360)
 * @returns A function that stops the stream, which the caller must run on dismiss
 */
export const watchHeading = async (onHeading: (heading: number) => void): Promise<() => void> => {
  const subscription = await Location.watchHeadingAsync((heading) => {
    if (heading.trueHeading === NO_HEADING) return;

    onHeading(normaliseHeading(heading.trueHeading));
  });

  return () => subscription.remove();
};
