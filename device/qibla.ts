import * as Location from 'expo-location';
import { Linking } from 'react-native';

import logger from '@/shared/logger';
import { type Position, shortestDelta } from '@/shared/qibla';

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
    logger.warn('QIBLA: Failed to read location permissions', { error });
    return false;
  }
};

/**
 * Asks for foreground location
 *
 * @returns Whether the request ended granted, and whether asking again could ever succeed
 */
export const requestLocationPermission = async (): Promise<{ granted: boolean; canAskAgain: boolean }> => {
  try {
    const { granted, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    return { granted, canAskAgain };
  } catch (error) {
    logger.warn('QIBLA: Failed to request location permissions', { error });
    return { granted: false, canAskAgain: false };
  }
};

/**
 * Opens the app's own settings page
 *
 * The only route left once the permission is permanently denied: no app can grant itself location, and a further
 * request is a silent no-op, so without this the row would be a button that does nothing.
 */
export const openLocationSettings = async (): Promise<void> => {
  try {
    await Linking.openSettings();
  } catch (error) {
    logger.warn('QIBLA: Failed to open settings', { error });
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
    logger.warn('QIBLA: Failed to read position', { error });
    return null;
  }
};

/**
 * The local magnetic declination, read once from the platform's own geomagnetic model
 *
 * The fused rotation sensor is magnetic-referenced on both platforms, so the needle needs this to point at TRUE north.
 * It is taken as the gap between the two headings the platform already reports rather than by shipping a model.
 *
 * @returns Degrees to add to a magnetic bearing, east positive, or 0 when the platform cannot say
 */
export const readDeclination = async (): Promise<number> => {
  try {
    const heading = await Location.getHeadingAsync();
    if (heading.trueHeading === NO_HEADING) return 0;

    return shortestDelta(heading.magHeading, heading.trueHeading);
  } catch (error) {
    logger.warn('QIBLA: Failed to read declination', { error });
    return 0;
  }
};
