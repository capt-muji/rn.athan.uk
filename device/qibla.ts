import * as Location from 'expo-location';

import type { Coordinates } from '@/shared/qiblaGeometry';
import { type PlaceParts, placeName } from '@/shared/qiblaPlace';

/**
 * One foreground prompt carries both the position and the heading, so the app asks for nothing more.
 *
 * What is already granted is read FIRST: asking outright re-prompts on every open, and on Android a user who has
 * chosen "only this time" is asked again each visit rather than being left alone.
 */
export const requestQiblaPermission = async (): Promise<boolean> => {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;

  const { granted } = await Location.requestForegroundPermissionsAsync();

  return granted;
};

/**
 * The coarsest fix the platform offers, because 3 km of error moves the qibla under 0.15 degrees.
 *
 * The cached fix is preferred and is usually instant: waiting on a fresh one leaves the sheet empty for seconds,
 * and at this tolerance a stale position is as good as a new one.
 */
export const readPosition = async (): Promise<Coordinates> => {
  const cached = await Location.getLastKnownPositionAsync();
  const { coords } = cached ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest }));

  return { latitude: coords.latitude, longitude: coords.longitude };
};

/**
 * The position written the way a person would say it, or null when the platform cannot name it.
 *
 * Needs no permission beyond the one already granted for the fix, and is deliberately best-effort: the geocoder is
 * a network-backed system service on both platforms, so it fails offline and is rate-limited, and the compass works
 * perfectly without it. A failure must never cost the user their bearing.
 */
export const readPlaceName = async (position: Coordinates): Promise<string | null> => {
  try {
    const [address] = await Location.reverseGeocodeAsync(position);

    return placeName(address as PlaceParts | undefined);
  } catch {
    return null;
  }
};
