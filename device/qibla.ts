import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

import type { Coordinates } from '@/shared/qiblaGeometry';
import { type PlaceParts, placeName } from '@/shared/qiblaPlace';

/** What the screen needs from a heading reading */
export interface HeadingReading {
  trueHeading: number;
}

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
 * Why the qibla cannot be shown, and the one action that fixes it.
 *
 * Shown INSTEAD of the sheet rather than inside it: a compass with no position is not a degraded compass, it is
 * nothing at all, so opening one would be showing an instrument that cannot work. Settings is offered because
 * once the permission is refused the system dialog never appears again, leaving no other route back.
 */
export const showQiblaLocationDialog = (): void => {
  Alert.alert(
    'Enable Location',
    'The qibla is worked out from where you are, so it needs location access. Would you like to enable it in settings?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]
  );
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

/**
 * Starts the heading watch and returns the function that stops it.
 *
 * `trueHeading` is the platform's OWN fused, declination-corrected bearing, passed on untouched: it is the value
 * Google Maps and Apple Maps draw, measured against both on two handsets.
 *
 * It replaces Reanimated's `SensorType.ROTATION`, which was adopted for smoothness and proved inaccurate by an amount
 * that VARIES with orientation, 5 degrees in one attitude and 34 in another, so no constant could correct it. This
 * reading steps rather than glides, because the platform gates it at 2 degrees and 50ms, and that is the accepted
 * cost of a bearing that is right.
 */
export const watchHeading = async (onReading: (reading: HeadingReading) => void): Promise<() => void> => {
  const subscription = await Location.watchHeadingAsync(({ trueHeading }) => onReading({ trueHeading }));

  return () => subscription.remove();
};
